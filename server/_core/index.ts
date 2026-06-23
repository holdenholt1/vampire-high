import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { runMigrations } from "./migrate";

async function startServer() {
  // Ensure database tables exist before accepting requests.
  await runMigrations().catch((e) => console.error("[migrate] failed:", e));

  const app = express();
  const server = createServer(app);

  // ── CORS ──
  // Browsers (Expo web, and any future web client) enforce CORS; native apps
  // do not. Allow all origins so the game is reachable from web + mobile.
  // Handles the preflight OPTIONS request too.
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-player-token"
    );
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Body parser (large limit retained for any uploads)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Storage proxy: only registered if Forge credentials exist (Manus-hosted assets).
  // Off-platform it self-disables and asset requests 404 harmlessly. See storageProxy.ts.
  registerStorageProxy(app);

  // NOTE: OAuth routes intentionally removed for the guest-only deployment.
  // (Originally: registerOAuthRoutes(app);)

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Dev = Vite middleware; Prod = serve built static client
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // IMPORTANT for cloud hosts (Railway/Render/Fly):
  //  - bind the host's assigned PORT (do NOT search for a free port)
  //  - bind 0.0.0.0 so the platform router can reach the process
  const port = parseInt(process.env.PORT || "3000", 10);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch((err) => {
  console.error("[startup] fatal", err);
  process.exit(1);
});
