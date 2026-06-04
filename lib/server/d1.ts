// Shared Cloudflare D1 access for the off-chain stores (join-requests, avatars).
//
// Resolution order (per request), highest priority first:
//   1. Native D1 binding (env.DB) via OpenNext's getCloudflareContext() — the
//      production path on Cloudflare Workers. No API token to manage; the
//      database is wired in wrangler.jsonc under `d1_databases`.
//   2. Cloudflare D1 over the REST API (CLOUDFLARE_ACCOUNT_ID / _API_TOKEN /
//      _D1_DATABASE_ID) — only used if the binding is unavailable.
//   3. (none) — callers fall back to their local JSON file for dev.
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Minimal structural type for the bits of the D1 binding we use. Avoids a
// dependency on @cloudflare/workers-types or the generated cloudflare-env.d.ts.
export interface D1Like {
  prepare(sql: string): {
    bind(...params: unknown[]): {
      all(): Promise<{ results?: Record<string, unknown>[] }>;
    };
  };
}

// Executes one SQL statement (with positional `?` params) and returns rows.
export type SqlRunner = (
  sql: string,
  params?: unknown[],
) => Promise<Record<string, unknown>[]>;

const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const DB_ID = process.env.CLOUDFLARE_D1_DATABASE_ID;

export const restConfigured = !!(ACCOUNT && TOKEN && DB_ID);

// Native binding (env.DB), resolved per request. Returns null outside the
// Workers runtime (e.g. `next dev` without initOpenNextCloudflareForDev), so
// callers cleanly fall through to REST or the local-file store.
export function getD1Binding(): D1Like | null {
  try {
    const { env } = getCloudflareContext();
    const db = (env as { DB?: D1Like }).DB;
    return db ?? null;
  } catch {
    return null;
  }
}

function bindingRunner(db: D1Like): SqlRunner {
  return async (sql, params = []) => {
    const { results } = await db
      .prepare(sql)
      .bind(...params)
      .all();
    return results ?? [];
  };
}

const restRunner: SqlRunner = async (sql, params = []) => {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/d1/database/${DB_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    },
  );
  const json = await res.json();
  if (!json.success) {
    throw new Error(`D1 REST error: ${JSON.stringify(json.errors ?? json)}`);
  }
  return json.result?.[0]?.results ?? [];
};

// Resolve the active SQL runner, or null to signal "use the local-file
// fallback". Preference: native binding → REST → none.
export function resolveRunner(): SqlRunner | null {
  const db = getD1Binding();
  if (db) return bindingRunner(db);
  if (restConfigured) return restRunner;
  return null;
}

// True if D1 is reachable by some path (binding or REST). Resolved per call.
export function usingD1(): boolean {
  return resolveRunner() !== null;
}
