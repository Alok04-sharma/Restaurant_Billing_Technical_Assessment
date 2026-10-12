/**
 * Path: backend/src/routes/order.routes.js
 * Responsibility: Protect staff order CRUD; customers use isolated /api/customer routes.
 * Integration: order controllers and backend role middleware.
 */
import { Router } from 'express';
import { listOrders, getOrder, createOrder, updateOrder, cancelOrder } from '../controllers/order.controller.js';
import { allowRoles } from '../middleware/auth.js';
export const orderRouter = Router();
orderRouter.use(allowRoles('OWNER', 'CASHIER'));
orderRouter.get('/', listOrders);
orderRouter.post('/', createOrder);
orderRouter.get('/:id', getOrder);
orderRouter.put('/:id', updateOrder);
orderRouter.patch('/:id/cancel', cancelOrder);
