/**
 * Path: backend/src/routes/billing.routes.js
 * Responsibility: Restrict staff checkout and bills to owner/cashier accounts.
 * Integration: billing controller; customer-only invoices use authorization at GET.
 */
import { Router } from 'express';
import { previewBill, checkoutOrder, listBills, getBill } from '../controllers/billing.controller.js';
import { allowRoles, requireAuth } from '../middleware/auth.js';
export const billingRouter = Router();
export const billHistoryRouter = Router();
billingRouter.post('/:id/bill-preview', allowRoles('OWNER', 'CASHIER'), previewBill);
billingRouter.post('/:id/checkout', allowRoles('OWNER', 'CASHIER'), checkoutOrder);
billHistoryRouter.get('/', allowRoles('OWNER', 'CASHIER'), listBills);
billHistoryRouter.get('/:id', requireAuth, getBill);
