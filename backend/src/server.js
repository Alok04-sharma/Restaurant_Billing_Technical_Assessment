/**
 * Path: backend/src/server.js
 * Responsibility: Validate demo configuration, connect MongoDB and start Express on port 5050.
 * Integration: npm run dev/start, backend/.env, app.js and database connector.
 */
import 'dotenv/config';
import { app } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

const port = Number(process.env.PORT || 5050);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid port number');
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32 || /^(PASTE_|YOUR_)/.test(process.env.SESSION_SECRET)) {
  throw new Error('Set SESSION_SECRET in backend/.env using: openssl rand -hex 32');
}

try {
  await connectDatabase();
  const server = app.listen(port, () => console.log(`[api] Listening on http://localhost:${port}`));
  async function shutdown() {
    server.close(async () => { await disconnectDatabase(); process.exit(0); });
  }
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
} catch (error) {
  console.error('[startup]', error.message);
  await disconnectDatabase();
  process.exit(1);
}
