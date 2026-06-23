import { build } from "esbuild";

// Externalize all installed dependencies (and their subpaths, e.g.
// "drizzle-orm/mysql2") so esbuild bundles only our own source. A plugin marks
// anything that isn't a relative/absolute path as external — the robust way to
// avoid the entry-point flag conflict and handle deep imports.
const externalizeDeps = {
  name: "externalize-deps",
  setup(b) {
    // Any import that doesn't start with "." or "/" is a node_modules package.
    b.onResolve({ filter: /^[^./]|^\.[^./]/ }, (args) => {
      if (args.kind === "entry-point") return null;
      return { path: args.path, external: true };
    });
  },
};

await build({
  entryPoints: ["server/_core/index.ts"],
  platform: "node",
  format: "esm",
  bundle: true,
  outdir: "dist",
  plugins: [externalizeDeps],
}).then(() => console.log("Server bundled to dist/index.js"));
