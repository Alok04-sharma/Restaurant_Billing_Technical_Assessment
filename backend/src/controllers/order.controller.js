/**
 * Path: backend/src/controllers/order.controller.js
 * Responsibility: Create/edit/cancel persisted orders and retrieve order history.
 * Integration: Order model and orderService; bills/payments belong to Part 2.
 */
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { Order } from '../models/Order.js';
import { HttpError, asyncHandler } from '../middleware/errorHandler.js';
import { validateOrderDetails, buildOrderLines, calculateSubtotal } from '../services/orderService.js';

function checkId(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'Invalid order ID');
}

export const listOrders = asyncHandler(async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : '';
  if (status && !['OPEN', 'CANCELLED', 'BILLED'].includes(status)) throw new HttpError(400, 'Invalid order status');
  const query = status ? { status } : {};
  const orders = await Order.find(query).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ data: orders });
});

export const getOrder = asyncHandler(async (req, res) => {
  checkId(req.params.id);
  const order = await Order.findById(req.params.id).lean();
  if (!order) throw new HttpError(404, 'Order not found');
  res.json({ data: order });
});

export const createOrder = asyncHandler(async (req, res) => {
  const details = validateOrderDetails(req.body);
  const items = await buildOrderLines(req.body.items);
  // UUID avoids collisions even under concurrent order creation.
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
  const order = await Order.create({ ...details, items, orderNumber, source: 'STAFF', subtotalPaise: calculateSubtotal(items) });
  res.status(201).json({ data: order });
});

export const updateOrder = asyncHandler(async (req, res) => {
  checkId(req.params.id);
  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, 'Order not found');
  if (order.status !== 'OPEN') throw new HttpError(409, 'Only open orders can be edited');
  if (order.source === 'CUSTOMER') throw new HttpError(403, 'Customer-submitted orders cannot be edited by staff');
  if (!Number.isInteger(req.body?.version) || req.body.version !== order.__v) throw new HttpError(409, 'Order changed. Reload the order before saving.');
  const details = validateOrderDetails(req.body);
  const items = await buildOrderLines(req.body.items, order.items);
  order.set({ ...details, items, subtotalPaise: calculateSubtotal(items) });
  await order.save();
  res.json({ data: order });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  checkId(req.params.id);
  // Single atomic update prevents two cancellation actions racing.
  const order = await Order.findOneAndUpdate({ _id: req.params.id, status: 'OPEN' }, { $set: { status: 'CANCELLED' }, $inc: { __v: 1 } }, { new: true });
  if (!order) throw new HttpError(409, 'Order is already cancelled, billed or missing');
  res.json({ data: order });
});
