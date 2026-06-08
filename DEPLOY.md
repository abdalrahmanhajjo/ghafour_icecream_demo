# Deploying to Render (API) + Netlify (client)

Architecture: **Netlify** serves the React app → calls the **Render** API → which talks
to **MongoDB Atlas**. You already have Atlas. Config files are included:
`render.yaml`, `netlify.toml`, `client/public/_redirects`.

```
[ Browser ] → Netlify (client)  → Render (Express API) → MongoDB Atlas
```

---

## Step 0 — Push the code to GitHub
Render and Netlify deploy from a Git repo.

```bash
cd ghafour_icecream_demo
git init
git add .
git commit -m "Ghafour MERN app"
# create an empty repo on github.com, then:
git remote add origin https://github.com/<you>/ghafour.git
git branch -M main
git push -u origin main
```
> `.gitignore` already excludes `node_modules`, `.env`, `dist`, and uploads — your secrets
> won't be committed. Make sure `server/.env` is NOT pushed (it's ignored).

## Step 0b — Atlas network access
Atlas → **Network Access** → ensure **`0.0.0.0/0`** is allowed (Render's free tier has no
fixed outbound IP). Keep your DB user + password handy.

---

## Part A — Deploy the API to Render

1. Go to <https://render.com> → sign up (GitHub login) → **New + → Blueprint**.
2. Pick your repo. Render reads `render.yaml` and creates the **ghafour-api** web service
   (root `server`, build `npm install`, start `npm start`, health check `/api/health`).
3. It will ask for the `sync:false` env vars — fill them in:
   - **MONGO_URI** — your Atlas string, with the password **URL-encoded** (e.g. `@` → `%40`)
     and a db name, e.g.
     `mongodb+srv://user:pass%40@cluster0.xxxx.mongodb.net/ghafour?retryWrites=true&w=majority`
   - **CLIENT_ORIGIN** — leave a placeholder for now (e.g. `https://example.netlify.app`);
     you'll update it in Part C once you know the Netlify URL.
   - **ADMIN_EMAIL** — e.g. `admin@ghafour.com`
   - **ADMIN_PASSWORD** — a strong password (this is your admin login)
   - (`JWT_SECRET` is auto-generated; `NODE_ENV=production` is preset.)
4. Click **Apply / Create**. Wait for the first deploy → you get a URL like
   **`https://ghafour-api.onrender.com`**. Copy it.
5. **Seed the database once**: open the service → **Shell** tab → run:
   ```bash
   npm run seed
   ```
   This loads the 13 items, categories, options, and the admin user. (Run it only when you
   want to (re)seed — it resets items/categories to the demo set.)
6. Verify: open `https://ghafour-api.onrender.com/api/health` → `{"ok":true}`.

> **Note (production hardening):** the server refuses to start in production with a weak
> `JWT_SECRET` or `CLIENT_ORIGIN=*`, so make sure CLIENT_ORIGIN is a real URL (Part C).

---

## Part B — Deploy the client to Netlify

1. Go to <https://netlify.com> → **Add new site → Import an existing project** → pick your repo.
2. Netlify reads `netlify.toml` (base `client`, build `npm run build`, publish `dist`,
   SPA redirect). Leave the build settings as detected.
3. **Before the first build**, add the env var: **Site settings → Environment variables →**
   `VITE_API_URL = https://ghafour-api.onrender.com`  ← your Render URL, **no trailing slash**.
4. **Deploy site.** You'll get a URL like **`https://ghafour.netlify.app`** (you can rename it
   in Site settings → Change site name, or add a custom domain later).

> `VITE_API_URL` is baked in at **build time** — if you change it later, trigger a
> **redeploy** (Deploys → Trigger deploy → Clear cache and deploy site).

---

## Part C — Wire them together (the important bit)

1. Back in **Render → ghafour-api → Environment**, set **`CLIENT_ORIGIN`** to your real Netlify
   URL (e.g. `https://ghafour.netlify.app`, no trailing slash) → **Save** (it redeploys).
   This unlocks CORS for your client.
2. If you used a placeholder `VITE_API_URL` in Netlify, fix it now and redeploy the client.
3. **Test the live app:**
   - Open `https://ghafour.netlify.app` → the menu loads (13 items from Atlas).
   - Add to cart → checkout → "Send on WhatsApp": the order saves to Atlas and opens WhatsApp.
   - Open `https://ghafour.netlify.app/admin` → log in with your `ADMIN_EMAIL`/`ADMIN_PASSWORD`
     → the order appears on the dashboard.

Done. 🎉

---

## Things to know (free-tier realities)

- **Render free spins down** after ~15 min idle; the next request cold-starts (~30–50s). Fine
  for a small shop; upgrade to a paid instance (or a cron pinger) to keep it warm.
- **Uploaded images are ephemeral on Render free.** Admin image uploads go to the server's
  disk (`/uploads`), which is **wiped on every redeploy/restart**. The seeded demo images are
  safe (they're served by Netlify from `client/public/assets`). For permanent uploads, add a
  **Render Disk** (paid) or switch uploads to **Cloudinary/S3** (recommended — small change to
  `server/src/routes/uploads.js`).
- **Env changes:** API env changes redeploy automatically; client (`VITE_*`) needs a manual
  redeploy because it's compiled in.
- **Security:** rotate any password shared in chat; keep Atlas user least-privilege; consider
  tightening Atlas IP access if you move to a host with a static IP. See `SECURITY.md`.

## Custom domains (optional)
- Netlify: Site settings → Domain management → add `ghafour.com` (or subdomain).
- Render: Settings → Custom Domains → e.g. `api.ghafour.com`. Then update `VITE_API_URL`
  (Netlify) and `CLIENT_ORIGIN` (Render) to the custom domains and redeploy.
