// Build + deploy the Base App build of MiTanda to its own Cloudflare Worker
// (mitanda-base). Dependency-free and cross-platform.
//
//   npm run cf:build:base    # build only (preview the output)
//   npm run cf:deploy:base   # build + deploy to the mitanda-base Worker
//
// It loads .env.base (if present) so all the Base-specific NEXT_PUBLIC_* values
// live in one gitignored file, then forces NEXT_PUBLIC_ACTIVE_CHAIN=base so the
// same codebase compiles for Base mainnet. NEXT_PUBLIC_* MUST be present at
// build time (they are inlined into the bundle) — setting them as Worker `vars`
// is NOT enough.
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const deploy = process.argv.includes("--deploy");

// Minimal .env parser (KEY=VALUE, ignores comments/blank lines, strips quotes).
if (existsSync(".env.base")) {
  for (const line of readFileSync(".env.base", "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  console.log("[deploy-base] loaded .env.base");
} else {
  console.warn(
    "[deploy-base] no .env.base found — relying on current shell env. " +
      "Copy .env.base.example to .env.base and fill it in.",
  );
}

// The one flag that repoints the whole app to Base. Always force it on here.
process.env.NEXT_PUBLIC_ACTIVE_CHAIN = "base";

const run = (cmd) => execSync(cmd, { stdio: "inherit", env: process.env });

run("opennextjs-cloudflare build");
if (deploy) run("wrangler deploy -c wrangler.base.jsonc");
