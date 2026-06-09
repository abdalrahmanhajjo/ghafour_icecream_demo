import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

import { validateEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import itemRoutes from './routes/items.js';
import configRoutes from './routes/config.js';
import orderRoutes from './routes/orders.js';
import eventRoutes from './routes/events.js';
import uploadRoutes from './routes/uploads.js';
import adminRoutes from './routes/admin.js';

validateEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // correct client IPs behind a proxy (for rate limiting)

// --- gzip responses ---
app.use(compression());

// --- Security headers (incl. a restrictive CSP for the image/JSON API surface) ---
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'none'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow the client to <img> our uploads
  })
);

// --- CORS (locked to configured origins) ---
const origins = (process.env.CLIENT_ORIGIN || '*').split(',').map((s) => s.trim());
app.use(cors({ origin: origins.includes('*') ? true : origins, credentials: false }));

// --- Body parsing + injection/pollution protection ---
app.use(express.json({ limit: '200kb' }));
app.use(mongoSanitize()); // strip $ / . keys → blocks NoSQL operator injection
app.use(hpp()); // collapse duplicated query params

if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// --- Global rate limit on the API surface ---
app.use(
  '/api',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false })
);

// Static files: demo assets (dev convenience) + admin uploads, with long cache.
const staticOpts = { maxAge: '7d', etag: true };
app.use('/assets', express.static(path.join(__dirname, '..', '..', 'assets'), staticOpts));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), staticOpts));

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/config', configRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

// In tests we mount `app` directly (supertest) without a DB or open port.
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
    .catch((err) => {
      console.error('Failed to start:', err.message);
      process.exit(1);
    });
}

export default app;
