/**
 * Path: backend/tests/authService.test.js
 * Responsibility: Verify demo account input rules, password hashing and tamper-proof sessions.
 * Integration: Node built-in test runner; does not require a live MongoDB instance.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeIdentifier, validateDisplayName, validatePassword, hashPassword, verifyPassword, issueSession, readSession } from '../src/services/authService.js';

test('email and mobile account identifiers normalize safely', () => {
  assert.equal(normalizeIdentifier('  DEMO@Example.com  '), 'demo@example.com');
  assert.equal(normalizeIdentifier('9876543210'), '9876543210');
  assert.throws(() => normalizeIdentifier('abc'), /valid email/);
  assert.throws(() => normalizeIdentifier('12345'), /valid email/);
});
test('customer names and passwords are validated', () => {
  assert.equal(validateDisplayName('  Alok  '), 'Alok');
  assert.throws(() => validateDisplayName(' '));
  assert.throws(() => validatePassword('1234'));
  assert.equal(validatePassword('123456'), '123456');
});
test('passwords use salted scrypt hashes', async () => {
  const a = await hashPassword('1234');
  const b = await hashPassword('1234');
  assert.notEqual(a, b);
  assert.equal(await verifyPassword('1234', a), true);
  assert.equal(await verifyPassword('4321', a), false);
});
test('sessions are signed and expire', () => {
  process.env.SESSION_SECRET = 'test-random-secret-at-least-32-chars-long';
  const user = { _id: '123456789012345678901234', sessionVersion: 1 };
  const token = issueSession(user, 1000);
  assert.equal(readSession(token, 1001).id, String(user._id));
  assert.equal(readSession(`${token.slice(0, -1)}X`, 1001), null);
  assert.equal(readSession(token, 1000 + 8 * 24 * 60 * 60), null);
});
