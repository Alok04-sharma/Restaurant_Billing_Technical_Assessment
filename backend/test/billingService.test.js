/**
 * Path: backend/tests/billingService.test.js
 * Responsibility: Exercise exact billing, cash/UPI validation and IST date boundary math.
 * Integration: Run with node --test; does not require a MongoDB connection.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBill, validatePayment, indiaDayRange, indianBusinessDate, invoiceNumberFor } from '../src/services/billingService.js';

test('₹645 bill can be paid with no tax or discount', () => {
  assert.deepEqual(calculateBill(64500, 0, 0), { subtotalPaise: 64500, discountPaise: 0, taxRateBps: 0, taxablePaise: 64500, taxPaise: 0, totalPaise: 64500 });
});
test('discount applies before tax; tax rounds once to paise', () => {
  const bill = calculateBill(64500, 4500, 500);
  assert.equal(bill.taxPaise, 3000);
  assert.equal(bill.totalPaise, 63000);
});
test('discount cannot exceed subtotal', () => {
  assert.throws(() => calculateBill(100, 101, 0), /Discount/);
});
test('rejects unsupported tax rates', () => {
  assert.throws(() => calculateBill(100, 0, 450), /supported tax rate/);
});
test('cash requires sufficient amount and calculates change', () => {
  assert.equal(validatePayment({ paymentMethod: 'CASH', tenderedPaise: 70000 }, { totalPaise: 64500 }).changePaise, 5500);
  assert.throws(() => validatePayment({ paymentMethod: 'CASH', tenderedPaise: 60000 }, { totalPaise: 64500 }), /cover/);
});
test('UPI accepts reference but no overpayment', () => {
  const result = validatePayment({ paymentMethod: 'UPI', upiReference: 'TXN123' }, { totalPaise: 64500 });
  assert.equal(result.tenderedPaise, 64500);
  assert.equal(result.upiReference, 'TXN123');
  assert.throws(() => validatePayment({ paymentMethod: 'UPI', tenderedPaise: 65000 }, { totalPaise: 64500 }), /UPI payment/);
});
test('invoice number is deterministic for unique order number', () => {
  assert.equal(invoiceNumberFor('ORD-TEST-123'), 'INV-TEST-123');
});
test('reporting day is midnight-to-midnight India Standard Time', () => {
  const { from, to } = indiaDayRange('2026-10-12');
  assert.equal(from.toISOString(), '2026-10-11T18:30:00.000Z');
  assert.equal(to.toISOString(), '2026-10-12T18:30:00.000Z');
  assert.equal(indianBusinessDate(new Date('2026-10-11T19:00:00.000Z')), '2026-10-12');
  assert.throws(() => indiaDayRange('2026-02-30'), /Invalid calendar date/);
});
