import type { Express } from "express";
import { ENV } from "./env";

export function registerStorageProxy(app: Express) {
  // Off-platform (no Forge creds) this proxy can't reach Manus storage.
  // Register a handler that 404s cleanly so the app degrades gracefully
  // (emoji fallbacks render; nothing 500s). Add real assets to client/public
  // and reference them by relative path to replace /manus-storage/ URLs.
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    app.get("/manus-storage/*", (_req, res) => {
      res.status(404).send("Asset not hosted on this server");
    });
    console.warn("[StorageProxy] Forge not configured — /manus-storage/* disabled (expected off Manus).");
    return;
  }
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
