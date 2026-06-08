import { Router } from 'express';
import Config from '../models/Config.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public: customization catalog + price modifiers + business info
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const cfg = await Config.findOne({ key: 'options' });
    res.json({
      optionGroups: cfg?.optionGroups || {},
      optionPrices: cfg?.optionPrices || {},
      business: {
        whatsapp: process.env.BUSINESS_WHATSAPP || '',
        name: process.env.BUSINESS_NAME || 'Ghafour Original 1919',
      },
    });
  })
);

// Admin: update the customization catalog / prices
router.put(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { optionGroups, optionPrices } = req.body || {};
    const cfg = await Config.findOneAndUpdate(
      { key: 'options' },
      { $set: { ...(optionGroups && { optionGroups }), ...(optionPrices && { optionPrices }) } },
      { new: true, upsert: true }
    );
    res.json(cfg);
  })
);

export default router;
