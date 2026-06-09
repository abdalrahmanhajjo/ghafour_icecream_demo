import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import EventInquiry from '../models/EventInquiry.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const createLimiter = rateLimit({ windowMs: 60 * 1000, max: 8 });

// Public: submit an event/catering inquiry
router.post(
  '/',
  createLimiter,
  body('name').trim().notEmpty().withMessage('evFill').isLength({ max: 80 }),
  body('phone').trim().notEmpty().withMessage('evFill').isLength({ max: 30 }),
  body('date').trim().notEmpty().withMessage('evFill'),
  body('notes').optional().isString().isLength({ max: 500 }),
  body('services').optional().isArray({ max: 8 }),
  validate,
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    if (!b.name || !b.phone || !b.date) return res.status(400).json({ error: 'evFill' });

    // Events need >= 3 days notice (mirrors the client rule)
    const min = new Date();
    min.setHours(0, 0, 0, 0);
    min.setDate(min.getDate() + 3);
    const z = (n) => String(n).padStart(2, '0');
    const minStr = `${min.getFullYear()}-${z(min.getMonth() + 1)}-${z(min.getDate())}`;
    if (b.date < minStr) return res.status(400).json({ error: 'evLeadErr' });

    const inquiry = await EventInquiry.create({
      name: String(b.name).slice(0, 80),
      phone: String(b.phone).slice(0, 30),
      eventType: b.eventType || '',
      guests: b.guests || '',
      services: Array.isArray(b.services) ? b.services.slice(0, 8) : [],
      date: b.date || '',
      time: b.time || '',
      notes: String(b.notes || '').slice(0, 500),
    });
    res.status(201).json({ id: inquiry._id, whatsapp: process.env.BUSINESS_WHATSAPP || '' });
  })
);

// Admin: list + update status
router.get(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const list = await EventInquiry.find().sort({ createdAt: -1 }).limit(200).lean();
    res.json(list);
  })
);

router.patch(
  '/:id/status',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const inq = await EventInquiry.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!inq) return res.status(404).json({ error: 'Inquiry not found' });
    res.json(inq);
  })
);

export default router;
