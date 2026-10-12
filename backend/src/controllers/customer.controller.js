/**
 * Path: backend/src/controllers/customer.controller.js
 * Responsibility: Owned customer orders, server-priced checkout, demo UPI and profile statistics.
 * Integration: Existing Order billing snapshot; all endpoints require CUSTOMER session.
 */
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { validateOrderDetails, buildOrderLines, calculateSubtotal } from '../services/orderService.js';
import { calculateBill, invoiceNumberFor } from '../services/billingService.js';

function ownedFilter(req, id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'Invalid order ID');
  return { _id: id, customerId: req.user._id, source: 'CUSTOMER' };
}
export const createCustomerOrder = asyncHandler(async (req, res) => {
  const key = req.body?.checkoutKey;
  if (typeof key !== 'string' || !/^[0-9a-f-]{36}$/i.test(key)) throw new HttpError(400, 'Invalid checkout identifier');
  const existing = await Order.findOne({ customerCheckoutKey: key, customerId: req.user._id }).lean();
  if (existing) return res.json({ data: existing });
  if (!['CASH', 'DEMO_UPI'].includes(req.body?.paymentIntent)) throw new HttpError(400, 'Choose cash or demo UPI');
  const details = validateOrderDetails({ ...req.body, customerName: req.user.displayName });
  const items = await buildOrderLines(req.body.items);
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
  try {
    const order = await Order.create({ ...details, items, orderNumber, source: 'CUSTOMER', customerId: req.user._id, customerCheckoutKey: key, paymentIntent: req.body.paymentIntent, subtotalPaise: calculateSubtotal(items) });
    res.status(201).json({ data: order });
  } catch (error) {
    if (error.code !== 11000) throw error;
    const retry = await Order.findOne({ customerCheckoutKey: key, customerId: req.user._id }).lean();
    if (!retry) throw error;
    res.json({ data: retry });
  }
});

export const customerOrders = asyncHandler(async (req, res) => {
  const rows = await Order.find({ customerId: req.user._id, source: 'CUSTOMER' }).sort({ createdAt: -1 }).limit(100).lean();
  res.json({ data: rows });
});

export const customerOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne(ownedFilter(req, req.params.id)).lean();
  if (!order) throw new HttpError(404, 'Order not found');
  res.json({ data: order });
});

export const demoUpiPay = asyncHandler(async (req, res) => {
  const filter = ownedFilter(req, req.params.id);
  const order = await Order.findOne(filter).lean();
  if (!order) throw new HttpError(404, 'Order not found');
  if (order.status !== 'OPEN') throw new HttpError(409, 'This order is no longer awaiting payment');
  if (order.paymentIntent !== 'DEMO_UPI') throw new HttpError(400, 'This order uses cashier-confirmed cash payment');
  const totals = calculateBill(order.subtotalPaise, 0, 0);
  const bill = {
    invoiceNumber: invoiceNumberFor(order.orderNumber), paidAt: new Date(),
    subtotalPaise: totals.subtotalPaise, discountPaise: 0, taxRateBps: 0, taxPaise: 0,
    totalPaise: totals.totalPaise, paymentStatus: 'PAID', paymentMethod: 'UPI',
    tenderedPaise: totals.totalPaise, changePaise: 0,
    paymentSource: 'DEMO_UPI', upiReference: `DEMO-${randomUUID().slice(0, 8).toUpperCase()}`,
  };
  // Compare-and-swap prevents two browser tabs from producing duplicate paid bills.
  const paid = await Order.findOneAndUpdate({ ...filter, status: 'OPEN', __v: order.__v }, { $set: { status: 'BILLED', bill }, $inc: { __v: 1 } }, { new: true, runValidators: true }).lean();
  if (!paid) throw new HttpError(409, 'Order already processed. Refresh your orders.');
  res.status(201).json({ data: paid });
});

export const customerStats = asyncHandler(async (req, res) => {
  const [orders, totals] = await Promise.all([
    Order.countDocuments({ customerId: req.user._id, source: 'CUSTOMER' }),
    Order.aggregate([{ $match: { customerId: req.user._id, source: 'CUSTOMER', status: 'BILLED' } }, { $group: { _id: null, paidOrders: { $sum: 1 }, totalPaidPaise: { $sum: '$bill.totalPaise' }, demoPaidPaise: { $sum: { $cond: [{ $eq: ['$bill.paymentSource', 'DEMO_UPI'] }, '$bill.totalPaise', 0] } } } }]),
  ]);
  res.json({ data: { totalOrders: orders, paidOrders: totals[0]?.paidOrders || 0, totalPaidPaise: totals[0]?.totalPaidPaise || 0, demoPaidPaise: totals[0]?.demoPaidPaise || 0 } });
});
