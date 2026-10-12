/**
 * Path: backend/src/models/Order.js
 * Responsibility: Store orders and immutable paid-invoice snapshots in the same document.
 * Integration: Order editing uses optimistic concurrency; checkout atomically changes OPEN to BILLED.
 */
import mongoose from 'mongoose';

const lineSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  unitPricePaise: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, max: 99 },
  lineTotalPaise: { type: Number, required: true, min: 0 },
}, { _id: false });

// One immutable billing snapshot per order. No payment gateway credentials are stored.
const billSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true },
  paidAt: { type: Date, required: true },
  subtotalPaise: { type: Number, required: true, min: 0 },
  discountPaise: { type: Number, required: true, min: 0 },
  taxRateBps: { type: Number, required: true, min: 0 },
  taxPaise: { type: Number, required: true, min: 0 },
  totalPaise: { type: Number, required: true, min: 0 },
  paymentStatus: { type: String, enum: ['PAID'], required: true },
  paymentMethod: { type: String, enum: ['CASH', 'UPI'], required: true },
  tenderedPaise: { type: Number, required: true, min: 0 },
  changePaise: { type: Number, required: true, min: 0 },
  paymentSource: { type: String, enum: ['STAFF_CONFIRMED', 'DEMO_UPI'], default: 'STAFF_CONFIRMED' },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  upiReference: { type: String, trim: true, maxlength: 80, default: '' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  source: { type: String, enum: ['STAFF', 'CUSTOMER'], default: 'STAFF' },
  paymentIntent: { type: String, enum: ['CASH', 'DEMO_UPI'], default: 'CASH' },
  customerCheckoutKey: { type: String, default: undefined },
  orderNumber: { type: String, unique: true, required: true },
  type: { type: String, enum: ['DINE_IN', 'TAKEAWAY'], required: true },
  tableNumber: { type: String, trim: true, default: '' },
  customerName: { type: String, trim: true, default: '' },
  notes: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['OPEN', 'BILLED', 'CANCELLED'], default: 'OPEN' },
  items: { type: [lineSchema], required: true },
  subtotalPaise: { type: Number, required: true, min: 0 },
  bill: { type: billSchema, default: undefined },
}, { timestamps: true, optimisticConcurrency: true });

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ customerCheckoutKey: 1 }, { unique: true, partialFilterExpression: { customerCheckoutKey: { $type: 'string' } } });
orderSchema.index({ 'bill.paidAt': -1 });
// Sparse partial index keeps legacy OPEN orders (without invoices) valid.
orderSchema.index({ 'bill.invoiceNumber': 1 }, {
  unique: true,
  partialFilterExpression: { 'bill.invoiceNumber': { $type: 'string' } },
});

export const Order = mongoose.model('Order', orderSchema);
