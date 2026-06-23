import { build } from "esbuild";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Given a base path with no extension, find the real file:
//   base.ts | base.tsx | base.js | base/index.ts | base/index.js
function resolveFile(base) {
  const tries = [
    base + ".ts", base + ".tsx", base + ".js", base + ".mjs",
    path.join(base, "index.ts"), path.join(base, "index.tsx"),
    path.join(base, "index.js"),
  ];
  for (const t of tries) {
    if (fs.existsSync(t)) return t;
  }
  return base; // let esbuild error clearly if truly missing
}

// Bundle our internal aliases (@shared/*, @/*); externalize real npm packages.
const aliasPlugin = {
  name: "alias-and-externals",
  setup(b) {
    b.onResolve({ filter: /^@shared\// }, (args) => ({
      path: resolveFile(path.resolve(__dirname, "shared", args.path.replace(/^@shared\//, ""))),
    }));
    b.onResolve({ filter: /^@\// }, (args) => ({
      path: resolveFile(path.resolve(__dirname, "client/src", args.path.replace(/^@\//, ""))),
    }));
    // Bare package names (not . or /) -> external, except the entry point.
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
  resolveExtensions: [".ts", ".tsx", ".js", ".mjs", ".json"],
  plugins: [aliasPlugin],
}).then(() => console.log("Server bundled to dist/index.js"));
