# CHANGES — what was patched for the off-Manus, guest-mode deploy

Your game logic (roles, abilities, voting, win conditions, the tRPC API, the DB
queries) is **unchanged**. Only the platform coupling and the host-login flow
were touched.

## Server

**`server/_core/index.ts`** (the "won't load" fix)
- Bind `server.listen(port, "0.0.0.0", ...)` instead of localhost-only.
- Use `process.env.PORT` directly; removed the `findAvailablePort` scan that
  fought with cloud port assignment.
- Removed `registerOAuthRoutes(app)` (Manus OAuth) — guest mode has no login.
- Kept `registerStorageProxy(app)` but it now self-disables off-platform.

**`server/_core/context.ts`**
- No longer calls `sdk.authenticateRequest` (Manus OAuth). Always returns
  `user: null`. Per-player identity is the `x-player-token` header, which the
  game already used — so lobby/start/vote/ability all keep working.

**`server/_core/storageProxy.ts`**
- When Forge credentials are absent (i.e. off Manus), `/manus-storage/*` returns
  a clean 404 instead of a 500. Prevents asset requests from erroring the app.

**`server/routers.ts`**
- `game.create` changed from `protectedProcedure` (required login) to
  `publicProcedure` taking `{ displayName }`. Host is created as a guest player.
- Removed the now-unused `protectedProcedure` import.

**`server/db.ts`**
- `createGame(hostUserId: number | null)` — accepts a null host (guest).

**`drizzle/schema.ts` + `drizzle/0005_guest_host.sql`**
- `games.hostUserId` is now nullable, with a migration to alter the existing
  column. Run via `npm run db:push`.

## Client

**`client/src/pages/Home.tsx`**
- Removed `useAuth` / OAuth redirect. "Host a Game" now reveals a name field and
  calls `game.create({ displayName })`, then goes to the lobby.

**`client/src/main.tsx`**
- The unauthorized-error handler no longer redirects to the Manus login portal
  (there is none). It just logs. Removed the `getLoginUrl` import.

> Note: `client/src/_core/hooks/useAuth.ts` and `getLoginUrl` in
> `client/src/const.ts` are left in the repo but are no longer used by the
> game flow. They can be deleted later if you want; leaving them avoids touching
> unrelated imports.

## New files

- `railway.json`, `nixpacks.toml` — Railway/Nixpacks build + start + Node 20.
- `.env.example` — the only required var is `DATABASE_URL`.
- `DEPLOY_RAILWAY.md` — step-by-step deploy guide.

## What I could NOT verify from here

- I can't run `npm install`, build, or boot the server in this environment
  (no network), and I can't run an iOS/cloud deploy. I syntax-checked every
  edited file and balanced the JSX, but the real `tsc`/`vite build` happens on
  Railway. If the build surfaces a type error, send me the log and I'll fix it.
- The assets (portraits/audio) are emoji-only until you export the originals
  from Manus and drop them into `client/public` (see DEPLOY_RAILWAY.md).
