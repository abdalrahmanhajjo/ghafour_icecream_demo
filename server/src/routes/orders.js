import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import Item from '../models/Item.js';
import Config from '../models/Config.js';
import Order from '../models/Order.js';
import { nextSeq } from '../models/Counter.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { normalizeSpecs, unitPrice, validateSchedule } from '../lib/pricing.js';

const router = Router();

const createLimiter = rateLimit({ windowMs: 60 * 1000, max: 12 });

// Public: place an order. Never trusts client prices — recomputes everything.
router.post(
  '/',
  createLimiter,
  body('customer.name').trim().notEmpty().withMessage('fillInfo').isLength({ max: 80 }),
  body('customer.phone').trim().notEmpty().withMessage('fillInfo').isLength({ max: 30 }),
  body('customer.address').optional().isString().isLength({ max: 300 }),
  body('fulfillment').optional().isIn(['delivery', 'pickup']),
  body('lang').optional().isIn(['ar', 'en']),
  body('lines').isArray({ min: 1, max: 50 }).withMessage('addFirst'),
  body('lines.*.qty').optional().isInt({ min: 1, max: 99 }),
  validate,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const customer = body.customer || {};
    const fulfillment = body.fulfillment === 'pickup' ? 'pickup' : 'delivery';
    const lang = body.lang === 'en' ? 'en' : 'ar';
    const schedule = body.schedule || {};

    if (!customer.name || !customer.phone) {
      return res.status(400).json({ error: 'fillInfo' });
    }
    if (fulfillment === 'delivery' && !customer.address) {
      return res.status(400).json({ error: 'fillInfo' });
    }
    if (!Array.isArray(body.lines) || body.lines.length === 0) {
      return res.status(400).json({ error: 'addFirst' });
    }

    const cfg = (await Config.findOne({ key: 'options' })) || { optionGroups: {}, optionPrices: {} };

    // Resolve items + recompute prices
    const slugs = [...new Set(body.lines.map((l) => l.slug || l.id))];
    const items = await Item.find({ slug: { $in: slugs }, available: true });
    const bySlug = Object.fromEntries(items.map((i) => [i.slug, i]));

    const lines = [];
    let leadDays = 0;
    for (const raw of body.lines) {
      const item = bySlug[raw.slug || raw.id];
      if (!item) continue; // silently drop unknown/unavailable items
      const qty = Math.max(1, Math.min(99, parseInt(raw.qty, 10) || 1));
      const specs = normalizeSpecs(item, raw.specs || {}, cfg);
      const price = unitPrice(item, specs, cfg);
      leadDays = Math.max(leadDays, item.leadDays || 0);
      lines.push({
        slug: item.slug,
        name: { ar: item.ar.name, en: item.en.name },
        qty,
        unitPrice: price,
        lineTotal: Math.round(price * qty * 100) / 100,
        specs,
      });
    }
    if (lines.length === 0) return res.status(400).json({ error: 'addFirst' });

    // Schedule validation (server-side mirror of the client rules)
    const schedErr = validateSchedule({ date: schedule.date, time: schedule.time, leadDays });
    if (schedErr) return res.status(400).json({ error: schedErr });

    const total = Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
    const seq = await nextSeq('order');
    const orderNumber = '1919-' + String(seq).padStart(4, '0');

    const order = await Order.create({
      orderNumber,
      customer: {
        name: String(customer.name).slice(0, 80),
        phone: String(customer.phone).slice(0, 30),
        address: String(customer.address || '').slice(0, 300),
      },
      fulfillment,
      schedule: {
        type: schedule.date ? 'scheduled' : 'asap',
        date: schedule.date || '',
        time: schedule.time || '',
      },
      lines,
      total,
      lang,
    });

    res.status(201).json({
      orderNumber: order.orderNumber,
      total: order.total,
      lines: order.lines,
      whatsapp: process.env.BUSINESS_WHATSAPP || '',
    });
  })
);

// Admin: list orders
router.get(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    const orders = await Order.find(q).sort({ createdAt: -1 }).limit(200).lean();
    res.json(orders);
  })
);

// Admin: update status
router.patch(
  '/:id/status',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  })
);

export default router;
