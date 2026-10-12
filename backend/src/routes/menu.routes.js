/**
 * Path: backend/src/routes/menu.routes.js
 * Responsibility: Public menu browsing, owner-only menu creation and edits.
 * Integration: optional session middleware is mounted globally in app.js.
 */
import { Router } from 'express';
import { listMenu, createMenuItem, updateMenuItem, deleteMenuItem } from '../controllers/menu.controller.js';
import { allowRoles } from '../middleware/auth.js';
export const menuRouter = Router();
menuRouter.get('/', listMenu);
menuRouter.post('/', allowRoles('OWNER'), createMenuItem);
menuRouter.put('/:id', allowRoles('OWNER'), updateMenuItem);
menuRouter.delete('/:id', allowRoles('OWNER'), deleteMenuItem);
