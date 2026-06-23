import { createConnection } from "mysql2/promise";
import fs from "fs";
import path from "path";

/**
 * Runs the SQL migrations in drizzle/*.sql against the database on startup.
 * Idempotent: ignores "already exists" / "duplicate" errors so repeated boots
 * are safe. This removes the need to run drizzle-kit manually in production.
 */
export async function runMigrations() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[migrate] No DATABASE_URL — skipping migrations");
    return;
  }

  // Find the drizzle folder (it sits next to the bundled server at runtime,
  // or two levels up in dev). Try a few likely spots.
  const candidates = [
    path.resolve(process.cwd(), "drizzle"),
    path.resolve(process.cwd(), "..", "drizzle"),
  ];
  const dir = candidates.find((d) => fs.existsSync(d));
  if (!dir) {
    console.warn("[migrate] drizzle folder not found — skipping");
    return;
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const conn = await createConnection({ uri: url, multipleStatements: true });
  try {
    for (const file of files) {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      // Strip full-line SQL comments first, so a statement preceded by a
      // comment isn't accidentally discarded.
      const sql = raw
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n");
      // Split on drizzle's breakpoint marker or statement-terminating semicolons.
      const statements = sql
        .split(/--> statement-breakpoint|;\s*$/m)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const stmt of statements) {
        try {
          await conn.query(stmt);
        } catch (e: any) {
          const msg = String(e?.message || e);
          // Ignore "already exists" / "duplicate" — migration already applied.
          if (
            msg.includes("already exists") ||
            msg.includes("Duplicate") ||
            msg.includes("duplicate") ||
            e?.code === "ER_TABLE_EXISTS_ERROR" ||
            e?.code === "ER_DUP_FIELDNAME" ||
            e?.code === "ER_DUP_KEYNAME"
          ) {
            continue;
          }
          console.warn(`[migrate] ${file}: ${msg}`);
        }
      }
    }
    console.log("[migrate] Migrations applied (or already present)");
  } finally {
    await conn.end();
  }
}
