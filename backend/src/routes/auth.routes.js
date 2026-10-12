/**
 * Path: backend/src/routes/auth.routes.js
 * Responsibility: Public registration/login, session status, logout and profile endpoints.
 * Integration: auth controllers plus simple development login throttling.
 */
import { Router } from 'express';
import { login, logout, me, register, updateProfile } from '../controllers/auth.controller.js';
import { allowRoles, requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';

const attempts = new Map();
function throttle(req, _res, next) {
  const now = Date.now();
  const key = `${req.ip}:${String(req.body?.identifier || '').toLowerCase()}`;
  if (attempts.size > 5000) { for (const [k, value] of attempts) if (value.until < now) attempts.delete(k); }
  const state = attempts.get(key);
  if (state && state.until > now && state.count >= 15) return next(new HttpError(429, 'Too many attempts. Try again in 15 minutes.'));
  attempts.set(key, { count: state && state.until > now ? state.count + 1 : 1, until: now + 15 * 60 * 1000 });
  next();
}

export const authRouter = Router();
authRouter.post('/register', throttle, register);
authRouter.post('/login', throttle, login);
authRouter.post('/logout', logout);
authRouter.get('/me', me);
authRouter.patch('/profile', requireAuth, allowRoles('CUSTOMER'), updateProfile);
