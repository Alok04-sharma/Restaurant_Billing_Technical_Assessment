/**
 * Path: backend/src/routes/customer.routes.js
 * Responsibility: Scope all customer actions to the signed-in customer's own records.
 * Integration: customer.controller and role enforcement.
 */
import { Router } from 'express';
import { allowRoles } from '../middleware/auth.js';
import { createCustomerOrder, customerOrders, customerOrder, customerStats, demoUpiPay } from '../controllers/customer.controller.js';
export const customerRouter = Router();
customerRouter.use(allowRoles('CUSTOMER'));
customerRouter.get('/stats', customerStats);
customerRouter.get('/orders', customerOrders);
customerRouter.post('/orders', createCustomerOrder);
customerRouter.get('/orders/:id', customerOrder);
customerRouter.post('/orders/:id/demo-pay', demoUpiPay);
