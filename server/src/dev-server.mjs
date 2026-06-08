// Zero-config dev runner: spins up an in-memory MongoDB, seeds it, and starts the
// API — so you can run the whole app without installing MongoDB. Not for production.
import 'dotenv/config';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB } from './config/db.js';
import { seedDatabase } from './seed/seed.js';

const mongod = await MongoMemoryServer.create({ instance: { dbName: 'ghafour' } });

process.env.MONGO_URI = mongod.getUri('ghafour');
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-please-change-0123456789abcd';
process.env.BUSINESS_WHATSAPP = process.env.BUSINESS_WHATSAPP || '96179167963';
process.env.BUSINESS_NAME = process.env.BUSINESS_NAME || 'Ghafour Original 1919';
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@ghafour.com';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin12345';
process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

console.log('[dev] in-memory MongoDB:', process.env.MONGO_URI);

await connectDB();
const r = await seedDatabase();
console.log(`[dev] seeded ${r.items} items, admin login: ${r.admin} / ${process.env.ADMIN_PASSWORD}`);

await import('./index.js'); // connects (reuses) + starts listening

const shutdown = async () => {
  try {
    await mongod.stop();
  } catch {}
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
