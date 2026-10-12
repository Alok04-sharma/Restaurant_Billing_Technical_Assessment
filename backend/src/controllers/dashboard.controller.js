/**
 * Path: backend/src/controllers/dashboard.controller.js
 * Responsibility: Owner-only real restaurant overview including registered customer count.
 * Integration: Existing daily reporting and MongoDB MenuItem/Order/User models.
 */
import { MenuItem } from '../models/MenuItem.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { dailySalesSummary } from './reports.controller.js';
import { indianBusinessDate } from '../services/billingService.js';

export const getOverview = asyncHandler(async (_req, res) => {
  const [menuItems, availableItems, openOrders, takeawayOrders, customerCount, customerOrders, totals, recentOrders, today] = await Promise.all([
    MenuItem.countDocuments(),
    MenuItem.countDocuments({ isAvailable: true }),
    Order.countDocuments({ status: 'OPEN' }),
    Order.countDocuments({ status: 'OPEN', type: 'TAKEAWAY' }),
    User.countDocuments({ role: 'CUSTOMER' }),
    Order.countDocuments({ source: 'CUSTOMER' }),
    Order.aggregate([{ $match: { status: 'OPEN' } }, { $group: { _id: null, amountPaise: { $sum: '$subtotalPaise' } } }]),
    Order.find({ status: 'OPEN' }).sort({ createdAt: -1 }).limit(5).lean(),
    dailySalesSummary(indianBusinessDate()),
  ]);
  res.json({ data: {
    menuItems, availableItems, openOrders, takeawayOrders, customerCount, customerOrders,
    openOrderValuePaise: totals[0]?.amountPaise ?? 0, recentOrders,
    todaySalesPaise: today.salesPaise, todayPaidOrders: today.paidOrders,
    todayDemoUpiPaise: today.demoUpiPaise, todayRecordedSalesPaise: today.recordedSalesPaise,
  } });
});
