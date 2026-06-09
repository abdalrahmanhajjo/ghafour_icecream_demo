import { Router } from 'express';
import Order from '../models/Order.js';
import EventInquiry from '../models/EventInquiry.js';
import Item from '../models/Item.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// Dashboard overview: KPIs, status breakdown, recent orders.
router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [byStatus, todayAgg, eventsTotal, eventsNew, itemsTotal, itemsHidden, recentOrders, recentEvents] =
      await Promise.all([
        Order.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
        ]),
        Order.aggregate([
          { $match: { createdAt: { $gte: startOfToday }, status: { $ne: 'cancelled' } } },
          { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$total' } } },
        ]),
        EventInquiry.countDocuments(),
        EventInquiry.countDocuments({ status: 'new' }),
        Item.countDocuments(),
        Item.countDocuments({ available: false }),
        Order.find().sort({ createdAt: -1 }).limit(6).lean(),
        EventInquiry.find().sort({ createdAt: -1 }).limit(5).lean(),
      ]);

    const statusMap = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
    const ordersTotal = byStatus.reduce((n, s) => n + s.count, 0);
    // Revenue excludes cancelled orders.
    const revenueTotal = byStatus
      .filter((s) => s._id !== 'cancelled')
      .reduce((n, s) => n + s.revenue, 0);
    const today = todayAgg[0] || { count: 0, revenue: 0 };

    res.json({
      kpis: {
        ordersTotal,
        revenueTotal: Math.round(revenueTotal * 100) / 100,
        ordersNew: statusMap.new || 0,
        todayCount: today.count,
        todayRevenue: Math.round((today.revenue || 0) * 100) / 100,
        eventsTotal,
        eventsNew,
        itemsTotal,
        itemsHidden,
      },
      statusBreakdown: statusMap,
      recentOrders,
      recentEvents,
    });
  })
);

export default router;
