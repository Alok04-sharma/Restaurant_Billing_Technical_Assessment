/**
 * Path: backend/src/models/MenuItem.js
 * Responsibility: Persist sellable menu items and prices in integer paise.
 * Integration: Menu CRUD and order price snapshots; avoids floating-point money errors.
 */
import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  category: { type: String, required: true, trim: true, maxlength: 40 },
  pricePaise: { type: Number, required: true, min: 0, max: 100000000 },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

menuItemSchema.index({ category: 1, name: 1 });

export const MenuItem = mongoose.model('MenuItem', menuItemSchema);
