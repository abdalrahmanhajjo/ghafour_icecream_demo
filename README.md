# Ghafour Original 1919 — MERN App

A production-ready rebuild of the single-file demo as a **MERN** stack app:
bilingual (AR/EN) storefront + customizable ordering + scheduling + events, with
a database, a real order pipeline, and an **owner admin panel**.

- **Client** — React (Vite), pixel-identical to the approved demo (CSS/i18n/data
  extracted verbatim from `index.html`).
- **Server** — Node/Express + MongoDB (Mongoose). Source of truth for pricing,
  validation, and orders.
- **Orders** — saved to MongoDB **and** handed off to WhatsApp (prefilled), with
  an order number. The owner sees and manages everything in the admin panel.

> The original `index.html` is kept at the repo root as the **design reference**.
> Run `npm run extract` to re-sync CSS / i18n / seed data from it after any tweak.

---

## Project structure

```
.
├── index.html                 # original single-file demo (design reference)
├── assets/                    # source images (copied into client/public/assets)
├── scripts/extract-from-demo.cjs   # regenerates styles.css, i18n.js, demo.json
├── server/                    # Express + MongoDB API
│   └── src/
│       ├── index.js           # app entry
│       ├── config/db.js
│       ├── models/            # Category, Item, Config, Order, EventInquiry, User, Counter
│       ├── routes/            # auth, categories, items, config, orders, events
│       ├── lib/pricing.js     # server-side pricing + spec/schedule validation
│       ├── data/demo.json     # seed data (auto-generated from the demo)
│       └── seed/seed.js       # seeds categories, items, options, admin user
└── client/                    # React (Vite)
    └── src/
        ├── pages/Home.jsx     # storefront
        ├── components/        # Nav, Hero, Menu, ItemModal, Featured, Events, CartDrawer, Marketing
        ├── admin/Admin.jsx    # /admin login + Orders / Events / Items dashboard
        ├── state.jsx          # global store (lang, config, items, cart, UI)
        ├── lib/menu.js        # client mirror of pricing/validation (for live display)
        ├── styles.css         # full demo CSS (auto-generated)
        └── i18n.js            # AR/EN strings (auto-generated)
```

---

## Prerequisites

- **Node 18+**
- **MongoDB** — either a local install (`mongodb://127.0.0.1:27017`) or a free
  [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (put its URI in `.env`).

## Setup & run (local)

### Option A — zero-config (no MongoDB install)
Spins up an **in-memory MongoDB**, seeds it, and starts the API. Great for a quick demo.

```bash
npm run install:all
npm run dev:mem        # API on :5000 (in-memory DB, auto-seeded)
npm run dev:client     # client on :5173  (second terminal)
# admin login: admin@ghafour.com / admin12345
```
> First run downloads a MongoDB binary (~hundreds of MB) once and caches it.

### Option B — real MongoDB (local or Atlas)
```bash
npm run install:all
cp server/.env.example server/.env
#   -> set MONGO_URI, JWT_SECRET, BUSINESS_WHATSAPP, ADMIN_EMAIL/PASSWORD
npm run seed           # seed items, categories, options, admin user
npm run dev:server     # http://localhost:5000   (second terminal: npm run dev:client)
```

- Storefront: <http://localhost:5173>
- Admin: <http://localhost:5173/admin> (log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

The Vite dev server proxies `/api` and `/assets` to the API, so no CORS setup is
needed in development.

---

## How it works

### Pricing & customization (single source of truth)
Customization groups (scoops, serving, toppings, box flavors, cake size/flavor/
message) and their price modifiers live in a `Config` document, seeded from the
demo. The **server** re-normalizes specs and recomputes every line + total on
`POST /api/orders` — client prices are for display only and never trusted.
`client/src/lib/menu.js` mirrors `server/src/lib/pricing.js` so the live UI total
matches the saved order to the cent.

### Scheduling
Orders support delivery/pickup + date/time. The server validates the time falls
within opening hours (10:30–00:30) and enforces a per-item **lead time** (ice
cream cakes need 48h; events need 3 days). Same rules run client-side for instant
feedback.

### Orders → WhatsApp
`POST /api/orders` validates, prices, and saves the order, returning an order
number + authoritative total. The client then opens a prefilled WhatsApp message
(`wa.me`) so the customer confirms in chat — while the order is already recorded
for the owner.

## API summary

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/config` | public | Option catalog + price modifiers + business info |
| GET | `/api/categories` | public | Active categories |
| GET | `/api/items` | public | Available items (`?category=`, `?featured=true`) |
| POST | `/api/orders` | public | Place an order (validated + priced server-side) |
| POST | `/api/events` | public | Submit an event/catering inquiry |
| POST | `/api/auth/login` | public | Admin login → JWT |
| GET | `/api/items/all` · POST · PUT · DELETE `/api/items` | admin | Menu CRUD |
| PUT | `/api/config` | admin | Edit options/prices |
| GET | `/api/orders` · PATCH `/api/orders/:id/status` | admin | Manage orders |
| GET | `/api/events` · PATCH `/api/events/:id/status` | admin | Manage inquiries |

---

## Deployment (recommended, low-cost)

- **Database**: MongoDB Atlas free tier.
- **API**: Render / Railway / Fly.io (Node web service). Set all `server/.env`
  vars; set `CLIENT_ORIGIN` to the deployed client URL.
- **Client**: Vercel / Netlify static deploy of `client/`. Set `VITE_API_URL` to
  the API origin and add an SPA rewrite (all routes → `/index.html`) so `/admin`
  works on refresh.
- Point the shop's domain at the client; use a subdomain (e.g. `api.…`) for the API.

---

## What's built vs. next (scope map)

**Done in this build**
- Bilingual storefront identical to the demo (menu, search, filters, customization
  modal with live pricing, featured, events, cart, scheduling, gallery, map).
- Express API with MongoDB models, JWT admin auth, server-side pricing/validation.
- Order pipeline (DB + WhatsApp) and event inquiries.
- Admin panel: login, orders & events (status), **full item CRUD with image upload**,
  **category editor**, and **options/pricing editor**.
- **Security hardening** — Helmet, CORS allow-list, NoSQL-injection sanitization, HPP,
  request validation, layered rate limiting, bcrypt, JWT, env validation, safe uploads,
  prod-safe errors. See [SECURITY.md](SECURITY.md). `npm audit`: 0 vulnerabilities.
- Seed from the exact demo data; verified pricing/validation parity (server + client).
- Zero-config in-memory dev runner (`npm run dev:mem`).

**Natural next steps (not in this build)**
- Online **payments** (Stripe) if you want prepaid orders.
- Automatic owner notifications (WhatsApp Cloud API / email) on new orders.
- Move admin JWT to httpOnly cookie + CSRF; image re-encoding (EXIF strip).
- Automated tests (supertest) + CI; analytics, SEO/OG, PWA.

---

## Suggested delivery milestones (for the $1,000–$7,000 engagement)

| # | Milestone | Outcome |
| --- | --- | --- |
| 1 | Foundation | Repo, DB, seeded menu, API, storefront parity (this build) |
| 2 | Admin & orders | Admin panel, order management, statuses, WhatsApp handoff (this build) |
| 3 | Content & media | Image uploads, category/option editor, copy polish |
| 4 | Hardening | Validation, rate limits, tests, error states, accessibility |
| 5 | Launch | Atlas + hosting, domain, env, monitoring, owner handover/training |
| 6 (opt.) | Payments/notifications | Stripe checkout and/or automated owner alerts |

Milestones 1–2 are delivered here. Use 3–6 to scope the rest with the client.
