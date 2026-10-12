/**
 * Path: backend/src/services/orderService.js
 * Responsibility: Validate order input, keep immutable price snapshots, and calculate exact totals.
 * Integration: Called by order.controller.js; reads available menu items from MongoDB.
 */
import mongoose from 'mongoose';
import { MenuItem } from '../models/MenuItem.js';
import { HttpError } from '../middleware/errorHandler.js';

const MAX_ITEMS = 40;
const MAX_QUANTITY = 99;

export function validateOrderDetails(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new HttpError(400, 'Order information is required');
  if (!['DINE_IN', 'TAKEAWAY'].includes(data.type)) throw new HttpError(400, 'Select dine-in or takeaway');
  const tableNumber = typeof data.tableNumber === 'string' ? data.tableNumber.trim() : '';
  const customerName = typeof data.customerName === 'string' ? data.customerName.trim() : '';
  const notes = typeof data.notes === 'string' ? data.notes.trim() : '';
  if (data.type === 'DINE_IN' && !tableNumber) throw new HttpError(400, 'Table number is required for dine-in orders');
  if (tableNumber.length > 12 || customerName.length > 80 || notes.length > 300) throw new HttpError(400, 'One of the text fields is too long');
  return { type: data.type, tableNumber: data.type === 'DINE_IN' ? tableNumber : '', customerName, notes };
}

export function calculateSubtotal(items) {
  return items.reduce((total, line) => total + line.lineTotalPaise, 0);
}

export async function buildOrderLines(requested, previousItems = []) {
  if (!Array.isArray(requested) || requested.length === 0) throw new HttpError(400, 'Add at least one item to the order');
  if (requested.length > MAX_ITEMS) throw new HttpError(400, `An order supports up to ${MAX_ITEMS} different items`);

  const ids = new Set();
  for (const line of requested) {
    if (!line || typeof line.menuItemId !== 'string' || !mongoose.isValidObjectId(line.menuItemId)) throw new HttpError(400, 'Invalid menu item');
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_QUANTITY) throw new HttpError(400, `Item quantity must be from 1 to ${MAX_QUANTITY}`);
    const id = line.menuItemId.toLowerCase();
    if (ids.has(id)) throw new HttpError(400, 'The same item cannot be added twice');
    ids.add(id);
  }

  // Existing line snapshots remain stable even if menu prices later change.
  const oldById = new Map(previousItems.map((line) => [String(line.menuItemId), line]));
  const freshIds = [...ids].filter((id) => !oldById.has(id));
  const available = await MenuItem.find({ _id: { $in: freshIds }, isAvailable: true });
  const freshById = new Map(available.map((item) => [String(item._id), item]));

  return requested.map(({ menuItemId, quantity }) => {
    const id = menuItemId.toLowerCase();
    const old = oldById.get(id);
    const menu = freshById.get(id);
    if (!old && !menu) throw new HttpError(400, 'An item was removed or is unavailable. Refresh the menu.');
    const unitPricePaise = old ? old.unitPricePaise : menu.pricePaise;
    const name = old ? old.name : menu.name;
    return { menuItemId: id, name, unitPricePaise, quantity, lineTotalPaise: unitPricePaise * quantity };
  });
}
