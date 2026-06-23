# Vampire High — Deploy to Railway (Multiplayer, Guest Mode)

This is your existing multiplayer game (real backend + database, players join on
their own phones with a code), patched to run **off Manus** on Railway with **no
login** — players just type a name. The game logic, roles, voting, and abilities
are unchanged from your source.

> Why it wasn't loading before: the server bound to a random free port and to
> `localhost` only, and it required Manus's OAuth/storage services at startup.
> All of that is fixed/removed in this build (see CHANGES.md).

---

## What you need (15–20 min)

- A [Railway](https://railway.app) account (free trial credit; ~$5/mo after).
- This project pushed to a **GitHub repo** (Railway deploys from GitHub).
- That's it. Railway provides the MySQL database.

---

## Step 1 — Push this code to GitHub

```bash
cd vampire-high            # this folder
git init
git add .
git commit -m "Vampire High — guest-mode, Railway-ready"
# create an empty repo on github.com first, then:
git remote add origin https://github.com/<you>/vampire-high.git
git push -u origin main
```

## Step 2 — Create the Railway project + database

1. Railway dashboard → **New Project** → **Deploy from GitHub repo** → pick your repo.
2. In the project, click **+ New** → **Database** → **Add MySQL**.
3. Railway creates a `MySQL` service with a connection variable.

## Step 3 — Point the app at the database

1. Open your **app service** (not the DB) → **Variables** tab.
2. Add a variable:
   - **Name:** `DATABASE_URL`
   - **Value:** `${{MySQL.MYSQL_URL}}`  ← Railway substitutes the real URL.
   (If the reference picker shows a different name like `MYSQL_PUBLIC_URL` or
   `DATABASE_URL`, use whichever the MySQL service exposes.)
3. Add `NODE_ENV` = `production`.
4. You do **not** need any of the old Manus variables (JWT_SECRET, OAUTH_*, FORGE_*).

## Step 4 — Build settings (usually auto-detected)

Railway reads `railway.json` / `nixpacks.toml` in this repo:
- **Build:** `npm run build`  (builds the React client + bundles the server)
- **Start:** `npm run start`  (serves the API and the built site on `$PORT`)

If Railway asks, set them manually to the above.

## Step 5 — Create the database tables

The schema needs to be applied once. Easiest path:

**Option A — Railway one-off command (recommended)**
In your app service → **Settings** → run a one-off command, or use the Railway CLI:
```bash
railway run npm run db:push     # generates + applies all migrations
```

**Option B — Railway CLI locally**
```bash
npm i -g @railway/cli
railway login
railway link            # pick your project
railway run npm run db:push
```

`db:push` creates the `users`, `games`, `players`, and `ability_usages` tables
and applies the guest-host migration (`drizzle/0005_guest_host.sql`, which makes
`games.hostUserId` nullable).

## Step 6 — Open the app

1. App service → **Settings** → **Networking** → **Generate Domain**.
2. You get a URL like `vampire-high-production.up.railway.app`. Open it.
3. Tap **Host a Game**, enter a name, share the 6-letter code. Others open the
   same URL on their phones, tap **Join**, enter the code + their name.

## Step 7 — Point playvampirehigh.com at it

1. App service → **Settings** → **Networking** → **Custom Domain** →
   enter `playvampirehigh.com`.
2. Railway shows a CNAME target. At your domain registrar (where you bought
   playvampirehigh.com), add a CNAME record pointing to that target.
   (For a root/apex domain, use your registrar's ALIAS/ANAME or Railway's
   provided A records.)
3. Wait for DNS to propagate (minutes to a couple hours). HTTPS is automatic.

---

## Assets (portraits + audio)

✅ **The real character portraits and all audio are now bundled** in
`client/public/assets/` and the code references them by local path
(`/assets/...`). They ship with the deploy and load from your own server — no
Manus storage needed. The `/manus-storage/*` proxy is disabled and harmless.

> Note: the portrait PNGs and WAV music files are large (~41MB total). The app
> works fine, but if first load feels heavy on slow connections, you can later
> compress the PNGs (e.g. to ~200KB each) and convert WAV music to MP3 to shrink
> it dramatically. Optional, not required.

---

## Troubleshooting

- **Site won't load / 502:** check the app **Deploy logs**. You should see
  `Server running on http://0.0.0.0:<port>/`. If it crashed on DB, re-check
  `DATABASE_URL`.
- **"Database not available" or empty lobby:** you skipped Step 5. Run
  `railway run npm run db:push`.
- **"Name already taken" on join:** that's expected — names are unique per game.
- **Players can't see each other:** confirm everyone is on the **same domain**
  (the Railway URL or playvampirehigh.com), not the old manus.space URL.
- **Build fails on `vite build`:** ensure Node 20 (pinned in `nixpacks.toml` and
  `package.json` engines).

---

© 2026 Holden Holt. Vampire High™
