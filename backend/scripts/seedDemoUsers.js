/**
 * Path: backend/scripts/seedDemoUsers.js
 * Responsibility: Idempotently create local-assessment owner and cashier accounts.
 * Integration: MongoDB User model, dotenv and authService password hashes.
 */
import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { hashPassword } from '../src/services/authService.js';

if (process.env.NODE_ENV === 'production') throw new Error('Demo seeding is disabled in production');
const demo = [
  { identifier: 'owner@gmail.com', role: 'OWNER', displayName: 'Restaurant Owner' },
  { identifier: 'cashir@gmail.com', role: 'CASHIER', displayName: 'Restaurant Cashier' },
];
try {
  await connectDatabase();
  for (const account of demo) {
    const existing = await User.findOne({ identifier: account.identifier });
    if (existing && existing.role !== account.role) throw new Error(`Account role conflict: ${account.identifier}`);
    if (!existing) {
      await User.create({ ...account, passwordHash: await hashPassword('1234') });
      console.log(`[seed] Created ${account.role}: ${account.identifier}`);
    } else console.log(`[seed] Preserved existing ${account.role}: ${account.identifier}`);
  }
  console.log('[seed] Demo accounts ready. Seed does not reset existing passwords.');
} finally { await disconnectDatabase(); }
