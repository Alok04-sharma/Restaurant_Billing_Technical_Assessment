/**
 * Path: backend/src/controllers/billing.controller.js
 * Responsibility: Preview, record payment, finalize invoices and retrieve immutable bill history.
 * Integration: /api/orders/:id/bill-preview, /checkout and /api/bills; Order and billingService.
 */
import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { validateBillOptions, validatePayment, invoiceNumberFor } from '../services/billingService.js';

function validateId(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'Invalid order ID');
}

async function findOpenOrder(id) {
  validateId(id);
  const order = await Order.findById(id).lean();
  if (!order) throw new HttpError(404, 'Order not found');
  if (order.status !== 'OPEN') throw new HttpError(409, 'Only OPEN orders can be billed');
  return order;
}

function requireCurrentVersion(input, order) {
  if (!Number.isInteger(input?.version) || input.version !== order.__v) {
    throw new HttpError(409, 'Order changed. Reload it before checkout.');
  }
}

export const previewBill = asyncHandler(async (req, res) => {
  const order = await findOpenOrder(req.params.id);
  requireCurrentVersion(req.body, order);
  const totals = validateBillOptions(req.body, order.subtotalPaise);
  if (order.source === 'CUSTOMER' && (totals.discountPaise || totals.taxRateBps)) throw new HttpError(400, 'Customer order total cannot be changed at the cashier');
  res.json({ data: { orderId: order._id, orderNumber: order.orderNumber, version: order.__v, items: order.items, ...totals } });
});

export const checkoutOrder = asyncHandler(async (req, res) => {
  const order = await findOpenOrder(req.params.id);
  requireCurrentVersion(req.body, order);
  const totals = validateBillOptions(req.body, order.subtotalPaise);
  if (order.source === 'CUSTOMER' && (totals.discountPaise || totals.taxRateBps)) throw new HttpError(400, 'Customer order total cannot be changed at the cashier');
  const payment = validatePayment(req.body, totals);
  if (order.source === 'CUSTOMER') {
    if (order.paymentIntent === 'DEMO_UPI') throw new HttpError(403, 'Customer demo UPI orders must be paid in the customer account');
    if (payment.paymentMethod !== 'CASH') throw new HttpError(400, 'Customer requested cash payment. Record cash only.');
  }
  const bill = {
    invoiceNumber: invoiceNumberFor(order.orderNumber),
    paidAt: new Date(),
    subtotalPaise: totals.subtotalPaise,
    discountPaise: totals.discountPaise,
    taxRateBps: totals.taxRateBps,
    taxPaise: totals.taxPaise,
    totalPaise: totals.totalPaise,
    ...payment,
    paymentSource: 'STAFF_CONFIRMED',
    confirmedBy: req.user._id,
  };

  // CAS operation guarantees exactly one checkout, even if staff double-click or use two tabs.
  const completed = await Order.findOneAndUpdate(
    { _id: order._id, status: 'OPEN', __v: order.__v },
    { $set: { status: 'BILLED', bill }, $inc: { __v: 1 } },
    { new: true, runValidators: true },
  ).lean();
  if (!completed) throw new HttpError(409, 'Order changed or was already billed. Refresh before retrying.');
  res.status(201).json({ data: completed });
});

export const listBills = asyncHandler(async (req, res) => {
  const queryText = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (queryText.length > 80) throw new HttpError(400, 'Search must be 80 characters or shorter');
  const filter = { status: 'BILLED', bill: { $exists: true } };
  if (queryText) {
    const escaped = queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    filter.$or = [{ 'bill.invoiceNumber': regex }, { orderNumber: regex }, { customerName: regex }, { tableNumber: regex }];
  }
  const bills = await Order.find(filter).sort({ 'bill.paidAt': -1 }).limit(100).lean();
  res.json({ data: bills });
});

export const getBill = asyncHandler(async (req, res) => {
  validateId(req.params.id);
  const order = await Order.findOne({ _id: req.params.id, status: 'BILLED' }).lean();
  if (!order?.bill) throw new HttpError(404, 'Paid bill not found');
  if (req.user.role === 'CUSTOMER' && String(order.customerId || '') !== String(req.user._id)) throw new HttpError(403, 'This receipt belongs to another customer');
  res.json({ data: order });
});
