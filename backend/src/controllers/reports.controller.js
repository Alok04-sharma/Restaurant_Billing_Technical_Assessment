/**
 * Path: backend/src/controllers/reports.controller.js
 * Responsibility: Generate daily real-paid-sales reports using Asia/Kolkata business-day boundaries.
 * Integration: /api/reports/daily?date=YYYY-MM-DD, shared by reporting and dashboard.
 */
import { Order } from '../models/Order.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { indiaDayRange, indianBusinessDate } from '../services/billingService.js';

export async function dailySalesSummary(date) {
  const { from, to } = indiaDayRange(date);
  const match = { status: 'BILLED', 'bill.paidAt': { $gte: from, $lt: to } };
  const [summaryRows, topItems, recent] = await Promise.all([
    Order.aggregate([
      { $match: match },
      { $group: {
        _id: null,
        paidOrders: { $sum: 1 },
        salesPaise: { $sum: '$bill.totalPaise' },
        subtotalPaise: { $sum: '$bill.subtotalPaise' },
        discountsPaise: { $sum: '$bill.discountPaise' },
        taxPaise: { $sum: '$bill.taxPaise' },
        cashPaise: { $sum: { $cond: [{ $eq: ['$bill.paymentMethod', 'CASH'] }, '$bill.totalPaise', 0] } },
        upiPaise: { $sum: { $cond: [{ $eq: ['$bill.paymentMethod', 'UPI'] }, '$bill.totalPaise', 0] } },
        demoUpiPaise: { $sum: { $cond: [{ $eq: ['$bill.paymentSource', 'DEMO_UPI'] }, '$bill.totalPaise', 0] } },
      } },
    ]),
    Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', quantity: { $sum: '$items.quantity' }, grossPaise: { $sum: '$items.lineTotalPaise' } } },
      { $sort: { quantity: -1, _id: 1 } },
      { $limit: 5 },
    ]),
    Order.find(match).sort({ 'bill.paidAt': -1 }).select('orderNumber customerName type tableNumber bill').limit(15).lean(),
  ]);
  const totals = summaryRows[0] || { paidOrders: 0, salesPaise: 0, subtotalPaise: 0, discountsPaise: 0, taxPaise: 0, cashPaise: 0, upiPaise: 0, demoUpiPaise: 0 };
  return { date, ...totals, demoUpiPaise: totals.demoUpiPaise || 0, recordedSalesPaise: totals.salesPaise - (totals.demoUpiPaise || 0), topItems, recentBills: recent };
}

export const getDailyReport = asyncHandler(async (req, res) => {
  const date = req.query.date === undefined ? indianBusinessDate() : req.query.date;
  res.json({ data: await dailySalesSummary(date) });
});
