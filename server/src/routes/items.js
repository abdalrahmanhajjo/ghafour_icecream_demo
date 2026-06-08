import { Router } from 'express';
import Item from '../models/Item.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public: list items (optionally filter by category / featured)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = { available: true };
    if (req.query.category && req.query.category !== 'all') q.category = req.query.category;
    if (req.query.featured === 'true') q.featured = true;
    const items = await Item.find(q).sort({ sort: 1, createdAt: 1 });
    res.json(items);
  })
);

// Admin: list everything (incl. unavailable)
router.get(
  '/all',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const items = await Item.find().sort({ sort: 1, createdAt: 1 });
    res.json(items);
  })
);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const item = await Item.create(req.body);
    res.status(201).json(item);
  })
);

router.put(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  })
);

export default router;
