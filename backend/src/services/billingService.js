/**
 * Path: backend/src/services/billingService.js
 * Responsibility: Validate checkout inputs and calculate integer-paise bills without floating errors.
 * Integration: Used by billing.controller.js; unit-tested without a database connection.
 */
import { HttpError } from '../middleware/errorHandler.js';

export const ALLOWED_TAX_RATES_BPS = [0, 500, 1200, 1800];

export function calculateBill(subtotalPaise, discountPaise, taxRateBps) {
  if (!Number.isSafeInteger(subtotalPaise) || subtotalPaise < 0) throw new HttpError(400, 'Invalid order subtotal');
  if (!Number.isSafeInteger(discountPaise) || discountPaise < 0 || discountPaise > subtotalPaise) {
    throw new HttpError(400, 'Discount cannot be negative or greater than the subtotal');
  }
  if (!ALLOWED_TAX_RATES_BPS.includes(taxRateBps)) throw new HttpError(400, 'Choose a supported tax rate');
  const taxablePaise = subtotalPaise - discountPaise;
  // Round once to the nearest paise, after subtracting the order discount.
  const taxPaise = Math.round(taxablePaise * taxRateBps / 10000);
  return { subtotalPaise, discountPaise, taxRateBps, taxablePaise, taxPaise, totalPaise: taxablePaise + taxPaise };
}

export function validateBillOptions(payload, subtotalPaise) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new HttpError(400, 'Bill details are required');
  const { discountPaise = 0, taxRateBps = 0 } = payload;
  return calculateBill(subtotalPaise, discountPaise, taxRateBps);
}

export function validatePayment(payload, billTotals) {
  const method = payload?.paymentMethod;
  if (!['CASH', 'UPI'].includes(method)) throw new HttpError(400, 'Select cash or UPI as payment method');
  const upiReference = typeof payload.upiReference === 'string' ? payload.upiReference.trim() : '';
  if (upiReference.length > 80) throw new HttpError(400, 'UPI reference is too long');
  if (method === 'UPI') {
    if (payload.tenderedPaise !== undefined && payload.tenderedPaise !== billTotals.totalPaise) {
      throw new HttpError(400, 'UPI payment must equal the bill total');
    }
    return { paymentStatus: 'PAID', paymentMethod: method, tenderedPaise: billTotals.totalPaise, changePaise: 0, upiReference };
  }
  if (upiReference) throw new HttpError(400, 'UPI reference is only allowed for UPI payments');
  const tenderedPaise = payload.tenderedPaise;
  if (!Number.isSafeInteger(tenderedPaise) || tenderedPaise < billTotals.totalPaise) {
    throw new HttpError(400, 'Cash received must cover the full bill amount');
  }
  if (tenderedPaise > 1000000000000) throw new HttpError(400, 'Cash amount is too large');
  return { paymentStatus: 'PAID', paymentMethod: method, tenderedPaise, changePaise: tenderedPaise - billTotals.totalPaise, upiReference: '' };
}

export function invoiceNumberFor(orderNumber) {
  // This derives a stable unique invoice number from the already-unique order number.
  return orderNumber.replace(/^ORD-/, 'INV-');
}

const INDIA_OFFSET_MS = 330 * 60 * 1000;
export function indianBusinessDate(now = new Date()) {
  return new Date(now.getTime() + INDIA_OFFSET_MS).toISOString().slice(0, 10);
}

export function indiaDayRange(dateString) {
  if (typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) throw new HttpError(400, 'Date must be YYYY-MM-DD');
  const midnightUtc = Date.parse(`${dateString}T00:00:00.000Z`);
  if (!Number.isFinite(midnightUtc) || new Date(midnightUtc).toISOString().slice(0, 10) !== dateString) {
    throw new HttpError(400, 'Invalid calendar date');
  }
  const from = new Date(midnightUtc - INDIA_OFFSET_MS);
  return { from, to: new Date(from.getTime() + 24 * 60 * 60 * 1000) };
}
