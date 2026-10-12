/**
 * Path: backend/src/controllers/menu.controller.js
 * Responsibility: List, create, update and delete real menu records.
 * Integration: MenuItem model and menu.routes.js.
 */
import mongoose from 'mongoose';
import { MenuItem } from '../models/MenuItem.js';
import { HttpError, asyncHandler } from '../middleware/errorHandler.js';

function validateMenuPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Menu information is required');
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  if (!name || name.length > 80) throw new HttpError(400, 'Name is required (maximum 80 characters)');
  if (!category || category.length > 40) throw new HttpError(400, 'Category is required (maximum 40 characters)');
  if (!Number.isSafeInteger(body.pricePaise) || body.pricePaise < 0 || body.pricePaise > 100000000) throw new HttpError(400, 'Enter a valid price of ₹0 to ₹10,00,000');
  if (typeof body.isAvailable !== 'boolean') throw new HttpError(400, 'Availability must be true or false');
  return { name, category, pricePaise: body.pricePaise, isAvailable: body.isAvailable };
}

function checkId(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'Invalid menu item ID');
}

export const listMenu = asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase();
  const items = await MenuItem.find(req.user?.role === 'OWNER' ? {} : { isAvailable: true }).sort({ category: 1, name: 1 }).lean();
  const visible = search ? items.filter((i) => `${i.name} ${i.category}`.toLowerCase().includes(search)) : items;
  res.json({ data: visible });
});

export const createMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.create(validateMenuPayload(req.body));
  res.status(201).json({ data: item });
});

export const updateMenuItem = asyncHandler(async (req, res) => {
  checkId(req.params.id);
  const item = await MenuItem.findByIdAndUpdate(req.params.id, validateMenuPayload(req.body), { new: true, runValidators: true });
  if (!item) throw new HttpError(404, 'Menu item not found');
  res.json({ data: item });
});

export const deleteMenuItem = asyncHandler(async (req, res) => {
  checkId(req.params.id);
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) throw new HttpError(404, 'Menu item not found');
  // Historical order lines store their own name and price snapshots.
  res.json({ message: 'Menu item deleted' });
});
