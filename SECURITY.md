# Security

Security controls implemented in this app, and the operational steps required to
keep it secure in production. "100% secure" is not a real thing — this documents a
defense-in-depth baseline aligned with the OWASP Top 10.

## Application controls (in code)

### Authentication & authorization
- Admin auth via **JWT** (`Authorization: Bearer <token>`), signed with `JWT_SECRET`,
  expiring per `JWT_EXPIRES` (default 7d). `requireAuth` + `requireAdmin` guard every
  mutating/admin route.
- Passwords stored as **bcrypt** hashes (cost 10); never stored or logged in plaintext.
- Login returns a generic `Invalid credentials` for both bad email and bad password
  (no user enumeration).
- Boot-time env validation (`config/env.js`) refuses to start with a missing/weak/
  placeholder `JWT_SECRET`, missing `MONGO_URI`, or `CLIENT_ORIGIN=*` in production.

### Input handling & injection
- **NoSQL injection**: `express-mongo-sanitize` strips `$`/`.` keys from `req.body`,
  `query`, and `params`, blocking Mongo operator injection.
- **Validation**: `express-validator` validates public endpoints (`/auth/login`,
  `/orders`, `/events`) — types, lengths, enums, array bounds.
- **Mass assignment / price tampering**: orders are **never** priced from client input.
  The server re-resolves items from the DB, re-normalizes specs against the allowed
  option catalog, and recomputes unit prices + totals (`lib/pricing.js`).
- **HTTP parameter pollution**: `hpp` collapses duplicated query params.
- All persisted free-text fields are length-capped server-side.

### Uploads
- Admin-only, single file, **4 MB** limit.
- MIME all-list (`jpeg`/`png`/`webp`); rejected otherwise.
- Server generates a random filename (`crypto.randomBytes`) — the client filename is
  never used, preventing path traversal / overwrite.

### Transport, headers & CORS
- **Helmet** sets security headers (HSTS, `X-Content-Type-Options`, frameguard, etc.);
  `x-powered-by` disabled. `crossOriginResourcePolicy: cross-origin` so the web client
  can load uploaded images.
- **CORS** locked to `CLIENT_ORIGIN` (comma-separated allow-list); `*` is rejected in prod.
- JSON body limit **200 kb**.

### Rate limiting (anti-abuse / brute force)
- Global: 600 requests / 15 min per IP across `/api`.
- Login: 10 attempts / 15 min per IP.
- Order creation: 12 / min. Event inquiries: 8 / min.
- `trust proxy` is set so limits use the real client IP behind a reverse proxy.

### Error handling
- 5xx responses return a generic message in production (no stack/internals leaked);
  full detail is logged server-side only.

## Client controls
- No secrets in the client bundle (only `VITE_API_URL`).
- JWT stored in `localStorage` for the admin SPA. (For higher assurance, move to an
  httpOnly cookie + CSRF token — noted as a hardening upgrade.)
- React escapes rendered content by default; no `dangerouslySetInnerHTML` is used.

## Dependency hygiene
- `npm audit` → **0 vulnerabilities** at build time (Multer pinned to 2.x; 1.x CVEs avoided).
- Run `npm audit` in CI and patch regularly.

## Operational checklist (production)
- [ ] Strong, random `JWT_SECRET` (32+ chars) from a secret manager — not in git.
- [ ] Change the seeded admin password; use a unique strong password.
- [ ] `NODE_ENV=production` and `CLIENT_ORIGIN` set to the real domain(s).
- [ ] Serve everything over **HTTPS** (platform TLS); enable HSTS at the edge.
- [ ] MongoDB Atlas: enable auth, IP allow-list, and least-privilege DB user.
- [ ] Put the API behind the platform's WAF/CDN; keep rate limits on.
- [ ] Regular backups of MongoDB; test restores.
- [ ] Rotate `JWT_SECRET` and admin credentials periodically.
- [ ] Monitor logs/alerts; review `npm audit` on a schedule.

## Known limitations / recommended upgrades
- JWT in `localStorage` (XSS-exposed) → move to httpOnly cookie + CSRF for higher assurance.
- Add automated tests (supertest) for authz on every admin route.
- Add account lockout + optional 2FA for admin.
- Add a strict **Content-Security-Policy** on the web client host.
- Add image re-encoding (e.g. sharp) to strip EXIF and neutralize malicious payloads.
