/**
 * Path: backend/src/app.js
 * Responsibility: Mount public menu/auth, role-restricted restaurant operations and customer APIs.
 * Integration: Express, MongoDB health, session middleware, protected REST routers.
 */
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { menuRouter } from './routes/menu.routes.js';
import { orderRouter } from './routes/order.routes.js';
import { billingRouter, billHistoryRouter } from './routes/billing.routes.js';
import { reportsRouter } from './routes/reports.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { customerRouter } from './routes/customer.routes.js';
import { optionalAuth, allowRoles } from './middleware/auth.js';
import { getOverview } from './controllers/dashboard.controller.js';
import { errorHandler, notFoundHandler, HttpError } from './middleware/errorHandler.js';

export const app = express();
app.disable('x-powered-by');
const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin, credentials: true }));
app.use(express.json({ limit: '32kb' }));
// Same-site cookies are also guarded by an Origin check on browser mutations.
app.use('/api', (req, _res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin && req.headers.origin !== origin) return next(new HttpError(403, 'Request origin is not permitted'));
  next();
});
app.get('/api/health', (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ status: connected ? 'ok' : 'unavailable', database: connected ? 'connected' : 'disconnected' });
});
app.use('/api', optionalAuth);
app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);
app.get('/api/dashboard/overview', allowRoles('OWNER'), getOverview);
app.use('/api/customer', customerRouter);
app.use('/api/orders', billingRouter);
app.use('/api/orders', orderRouter);
app.use('/api/bills', billHistoryRouter);
app.use('/api/reports', reportsRouter);
app.use(notFoundHandler);
app.use(errorHandler);
