/**
 * Path: backend/src/models/User.js
 * Responsibility: Persist demo users, hashed passwords, roles and editable customer names.
 * Integration: auth service, owner dashboard and customer order ownership.
 */
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  identifier: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['OWNER', 'CASHIER', 'CUSTOMER'], required: true },
  displayName: { type: String, required: true, trim: true, maxlength: 80 },
  sessionVersion: { type: Number, default: 1 },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
