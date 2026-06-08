import { Router } from 'express';
import Category from '../models/Category.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public: list active categories
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const cats = await Category.find({ active: true }).sort({ sort: 1 });
    res.json(cats);
  })
);

// Admin CRUD
router.post(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const cat = await Category.create(req.body);
    res.status(201).json(cat);
  })
);

router.put(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    res.json(cat);
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  })
);

export default router;
