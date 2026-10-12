/**
 * Path: backend/src/config/database.js
 * Responsibility: Connect to MongoDB once and expose connection lifecycle helpers.
 * Integration: Used by server.js; MONGODB_URI comes from backend/.env.
 */
import mongoose from 'mongoose';

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is missing in backend/.env');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`[database] Connected to ${mongoose.connection.name}`);
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}
