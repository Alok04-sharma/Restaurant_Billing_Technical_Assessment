/**
 * Path: backend/src/controllers/auth.controller.js
 * Responsibility: Register customers, authenticate all roles, manage sessions and profile edits.
 * Integration: User, scrypt hashing and HTTP-only session cookie.
 */
import { User } from '../models/User.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { cookieOptions, hashPassword, issueSession, normalizeIdentifier, publicUser, validateDisplayName, validatePassword, verifyPassword } from '../services/authService.js';

function loginResponse(res, user, status = 200) {
  res.cookie('restaurant_session', issueSession(user), cookieOptions());
  res.status(status).json({ data: publicUser(user) });
}

export const register = asyncHandler(async (req, res) => {
  const identifier = normalizeIdentifier(req.body?.identifier);
  const displayName = validateDisplayName(req.body?.displayName);
  const password = validatePassword(req.body?.password);
  if (await User.exists({ identifier })) throw new HttpError(409, 'This email or mobile number is already registered');
  const passwordHash = await hashPassword(password);
  // Public signup can only create CUSTOMER users; client-supplied roles are ignored.
  const user = await User.create({ identifier, displayName, passwordHash, role: 'CUSTOMER' });
  loginResponse(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const identifier = normalizeIdentifier(req.body?.identifier);
  if (typeof req.body?.password !== 'string') throw new HttpError(400, 'Password is required');
  const user = await User.findOne({ identifier }).select('+passwordHash');
  // Uninformative failures do not reveal whether an account exists.
  if (!user || !await verifyPassword(req.body.password, user.passwordHash)) throw new HttpError(401, 'Invalid login credentials');
  loginResponse(res, user);
});

export const logout = (_req, res) => {
  res.clearCookie('restaurant_session', { ...cookieOptions(), maxAge: undefined });
  res.json({ data: { signedOut: true } });
};

export const me = (req, res) => res.json({ data: req.user ? publicUser(req.user) : null });

export const updateProfile = asyncHandler(async (req, res) => {
  const displayName = validateDisplayName(req.body?.displayName);
  const user = await User.findOneAndUpdate({ _id: req.user._id, role: 'CUSTOMER' }, { $set: { displayName } }, { new: true });
  if (!user) throw new HttpError(404, 'Customer account not found');
  res.json({ data: publicUser(user) });
});
