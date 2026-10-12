/**
 * Path: backend/tests/orderService.test.js
 * Responsibility: Unit-check order input and integer money calculations without database access.
 * Integration: Run with `node --test tests/orderService.test.js` inside backend/.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateOrderDetails, calculateSubtotal } from '../src/services/orderService.js';

test('dine-in orders require a table', () => {
  assert.throws(() => validateOrderDetails({ type: 'DINE_IN', tableNumber: '' }), /Table number/);
});

test('takeaway clears table number', () => {
  assert.equal(validateOrderDetails({ type: 'TAKEAWAY', tableNumber: '8' }).tableNumber, '');
});

test('totals use integer paise', () => {
  assert.equal(calculateSubtotal([{ lineTotalPaise: 1099 }, { lineTotalPaise: 201 }]), 1300);
});
