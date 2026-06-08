// Runtime HTTP test of the real Express app + security middleware, WITHOUT a DB.
// Mounts `app` via supertest (NODE_ENV=test => no connect/listen) and exercises the
// endpoints that run before any DB access: health, headers, validation, rate limit, 404.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-which-is-long-enough-1234';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/test'; // never connected in test mode
process.env.CLIENT_ORIGIN = 'http://localhost:5173';

import request from 'supertest';
import app from '../src/index.js';

let pass = 0,
  fail = 0;
const chk = (label, cond, extra = '') => {
  console.log((cond ? 'PASS' : 'FAIL') + ' | ' + label + (cond ? '' : '  ' + extra));
  cond ? pass++ : fail++;
};

// 1) health
let r = await request(app).get('/api/health');
chk('GET /api/health → 200 ok', r.status === 200 && r.body.ok === true, JSON.stringify(r.body));

// 2) security headers present, x-powered-by removed
chk('Helmet header x-content-type-options=nosniff', r.headers['x-content-type-options'] === 'nosniff');
chk('x-powered-by removed', r.headers['x-powered-by'] === undefined);
chk('rate-limit headers present', !!r.headers['ratelimit-limit'] || !!r.headers['ratelimit']);

// 3) order validation runs before DB → empty body rejected with i18n key
r = await request(app).post('/api/orders').send({});
chk('POST /api/orders {} → 400 fillInfo', r.status === 400 && r.body.error === 'fillInfo', JSON.stringify(r.body));

// 4) login validation: bad email → 400 (no DB hit)
r = await request(app).post('/api/auth/login').send({ email: 'nope', password: 'x' });
chk('POST /api/auth/login bad email → 400', r.status === 400, JSON.stringify(r.body));

// 5) admin route without token → 401 (auth middleware before DB)
r = await request(app).get('/api/items/all');
chk('GET /api/items/all (no token) → 401', r.status === 401, JSON.stringify(r.body));

// 6) upload without token → 401
r = await request(app).post('/api/uploads');
chk('POST /api/uploads (no token) → 401', r.status === 401);

// 7) unknown route → 404 JSON
r = await request(app).get('/api/nope');
chk('GET /api/nope → 404', r.status === 404 && r.body.error === 'Not found');

// 8) NoSQL-injection payload in login is sanitized (operator object stripped → 400, not 500)
r = await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
chk('NoSQL injection on login → 400 (sanitized)', r.status === 400, JSON.stringify(r.body));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
