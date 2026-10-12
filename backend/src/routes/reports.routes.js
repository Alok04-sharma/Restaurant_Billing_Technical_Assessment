/**
 * Path: backend/src/routes/reports.routes.js
 * Responsibility: Owner-only daily paid sales reporting.
 * Integration: Existing Part 2 reports controller and role enforcement.
 */
import { Router } from 'express';
import { getDailyReport } from '../controllers/reports.controller.js';
import { allowRoles } from '../middleware/auth.js';
export const reportsRouter = Router();
reportsRouter.use(allowRoles('OWNER'));
reportsRouter.get('/daily', getDailyReport);
