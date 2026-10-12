/**
 * Path: backend/src/services/authService.js
 * Responsibility: Normalize demo identifiers, hash passwords and sign expiry-bound sessions.
 * Integration: User model, session middleware and login controller; no extra npm dependency.
 */
import { createHmac, randomBytes, scrypt as rawScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { HttpError } from '../middleware/errorHandler.js';
const scrypt = promisify(rawScrypt);
const SESSION_AGE_SECONDS = 7 * 24 * 60 * 60;

export function normalizeIdentifier(input) {
  if (typeof input !== 'string') throw new HttpError(400, 'Enter an email or 10-digit mobile number');
  const value = input.trim().toLowerCase();
  if (/^[0-9]{10}$/.test(value)) return value;
  if (/^[^\s@]{1,64}@[^\s@]+\.[a-z]{2,}$/i.test(value) && value.length <= 120) return value;
  throw new HttpError(400, 'Enter a valid email format or 10-digit mobile number');
}

export function validatePassword(password, minimum = 6) {
  if (typeof password !== 'string' || password.length < minimum || password.length > 128) {
    throw new HttpError(400, `Password must have ${minimum} to 128 characters`);
  }
  return password;
}

export function validateDisplayName(name) {
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) throw new HttpError(400, 'Name must be 1 to 80 characters');
  return name.trim();
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password, encoded) {
  const [algorithm, salt, key] = String(encoded || '').split(':');
  if (algorithm !== 'scrypt' || !/^[0-9a-f]{32}$/.test(salt || '') || !/^[0-9a-f]{128}$/.test(key || '')) return false;
  const hashed = await scrypt(password, salt, 64);
  return timingSafeEqual(hashed, Buffer.from(key, 'hex'));
}

function secret() {
  const value = process.env.SESSION_SECRET || '';
  if (value.length < 32) throw new Error('Set SESSION_SECRET to at least 32 random characters in backend/.env');
  return value;
}

export function issueSession(user, nowSeconds = Math.floor(Date.now() / 1000)) {
  const body = Buffer.from(JSON.stringify({ id: String(user._id), sv: user.sessionVersion, exp: nowSeconds + SESSION_AGE_SECONDS })).toString('base64url');
  const signature = createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function readSession(token, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (typeof token !== 'string' || token.length > 1500) return null;
  const [body, signature, extra] = token.split('.');
  if (!body || !signature || extra) return null;
  const expected = createHmac('sha256', secret()).update(body).digest();
  let received;
  try { received = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (typeof claims.id !== 'string' || !/^[a-f\d]{24}$/i.test(claims.id) || !Number.isInteger(claims.sv) || !Number.isSafeInteger(claims.exp) || claims.exp <= nowSeconds) return null;
    return claims;
  } catch { return null; }
}

export function publicUser(user) {
  return { id: String(user._id), identifier: user.identifier, displayName: user.displayName, role: user.role };
}
export const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api', maxAge: SESSION_AGE_SECONDS * 1000 });
