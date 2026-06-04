import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Default Cloudflare config for OpenNext on Workers. No incremental-cache
// override (would require an R2 bucket) — this app is SSR/dynamic + reads
// chain/D1 over the network, so the default caching is fine.
export default defineCloudflareConfig();
