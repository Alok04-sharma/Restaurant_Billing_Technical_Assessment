/**
 * Path: backend/src/middleware/auth.js
 * Responsibility: Authenticate signed HTTP-only sessions and enforce server-side role permissions.
 * Integration: User and authService, used on every protected REST route.
 */
import { User } from '../models/User.js';
import { readSession } from '../services/authService.js';
import { asyncHandler, HttpError } from './errorHandler.js';

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith('restaurant_session='))?.slice('restaurant_session='.length);
  const claims = readSession(token);
  if (claims) {
    const user = await User.findById(claims.id).lean();
    if (user && user.sessionVersion === claims.sv) req.user = user;
  }
  next();
});

export function requireAuth(req, _res, next) {
  if (!req.user) return next(new HttpError(401, 'Please sign in to continue'));
  next();
}
export const allowRoles = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new HttpError(401, 'Please sign in to continue'));
  if (!roles.includes(req.user.role)) return next(new HttpError(403, 'You do not have permission to use this feature'));
  next();
};
