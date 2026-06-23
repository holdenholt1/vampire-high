import { build } from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve our internal path aliases (@shared/* -> ./shared/*, @/* -> ./client/src/*)
// so they get BUNDLED, while real npm packages stay external (loaded from
// node_modules at runtime).
const aliasPlugin = {
  name: "alias-and-externals",
  setup(b) {
    // Bundle @shared/* by rewriting to the real file path.
    b.onResolve({ filter: /^@shared\// }, (args) => {
      const rel = args.path.replace(/^@shared\//, "");
      return { path: path.resolve(__dirname, "shared", rel) };
    });
    // Bundle @/* (client) similarly, in case anything references it.
    b.onResolve({ filter: /^@\// }, (args) => {
      const rel = args.path.replace(/^@\//, "");
      return { path: path.resolve(__dirname, "client/src", rel) };
    });
    // Everything else that's a bare package name -> external (node_modules).
    b.onResolve({ filter: /^[^./]/ }, (args) => {
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
  resolveExtensions: [".ts", ".js", ".mjs", ".json"],
  plugins: [aliasPlugin],
}).then(() => console.log("Server bundled to dist/index.js"));
