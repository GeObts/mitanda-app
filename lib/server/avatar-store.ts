// Off-chain avatar (profile-photo) store, keyed by wallet address.
//
// Mirrors lib/server/store.ts exactly: Cloudflare D1 over the REST API in
// production (same CLOUDFLARE_* env), a local JSON-file fallback for dev so the
// flow is testable without Cloudflare credentials.
//
// Images are small, square, client-resized base64 data URLs (see
// avatar-upload-dialog). Storing them as TEXT keeps everything inside the
// existing D1 setup with no new infra. NOTE: an R2 bucket (store the blob,
// keep only the URL here) is the eventual upgrade for larger images — this
// schema can hold an `https://…` R2 URL in `data_url` unchanged.
import { promises as fs } from "fs";
import { join } from "path";

export interface AvatarRecord {
  address: string; // lowercased wallet
  dataUrl: string; // "data:image/…;base64,…" (or, later, an R2 URL)
  updatedAt: number; // unix seconds
}

export interface AvatarStore {
  get(address: string): Promise<AvatarRecord | null>;
  getMany(addresses: string[]): Promise<Record<string, string>>;
  put(rec: AvatarRecord): Promise<void>;
}

const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const DB = process.env.CLOUDFLARE_D1_DATABASE_ID;

export const usingD1 = !!(ACCOUNT && TOKEN && DB);

// ── Cloudflare D1 (REST) ─────────────────────────────────────────────────────
let schemaReady = false;

async function d1(
  sql: string,
  params: unknown[] = [],
): Promise<Record<string, unknown>[]> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/d1/database/${DB}/query`,
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
    throw new Error(`D1 error: ${JSON.stringify(json.errors ?? json)}`);
  }
  return json.result?.[0]?.results ?? [];
}

async function ensureSchema() {
  if (schemaReady) return;
  await d1(
    `CREATE TABLE IF NOT EXISTS avatars (
      address TEXT PRIMARY KEY,
      data_url TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
  );
  schemaReady = true;
}

const d1Store: AvatarStore = {
  async get(address) {
    await ensureSchema();
    const rows = await d1(`SELECT * FROM avatars WHERE address = ?`, [
      address.toLowerCase(),
    ]);
    return rows[0]
      ? {
          address: String(rows[0].address),
          dataUrl: String(rows[0].data_url),
          updatedAt: Number(rows[0].updated_at),
        }
      : null;
  },
  async getMany(addresses) {
    if (addresses.length === 0) return {};
    await ensureSchema();
    const lowered = addresses.map((a) => a.toLowerCase());
    const placeholders = lowered.map(() => "?").join(",");
    const rows = await d1(
      `SELECT address, data_url FROM avatars WHERE address IN (${placeholders})`,
      lowered,
    );
    const out: Record<string, string> = {};
    for (const r of rows) out[String(r.address)] = String(r.data_url);
    return out;
  },
  async put(rec) {
    await ensureSchema();
    await d1(
      `INSERT INTO avatars (address, data_url, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(address) DO UPDATE SET
         data_url = excluded.data_url,
         updated_at = excluded.updated_at`,
      [rec.address.toLowerCase(), rec.dataUrl, rec.updatedAt],
    );
  },
};

// ── Local JSON-file fallback ─────────────────────────────────────────────────
const FILE = join(process.cwd(), ".dev-avatars.json");

async function readAll(): Promise<Record<string, AvatarRecord>> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return {};
  }
}
async function writeAll(data: Record<string, AvatarRecord>) {
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}

const localStore: AvatarStore = {
  async get(address) {
    const all = await readAll();
    return all[address.toLowerCase()] ?? null;
  },
  async getMany(addresses) {
    const all = await readAll();
    const out: Record<string, string> = {};
    for (const a of addresses) {
      const rec = all[a.toLowerCase()];
      if (rec) out[a.toLowerCase()] = rec.dataUrl;
    }
    return out;
  },
  async put(rec) {
    const all = await readAll();
    all[rec.address.toLowerCase()] = {
      ...rec,
      address: rec.address.toLowerCase(),
    };
    await writeAll(all);
  },
};

export function getAvatarStore(): AvatarStore {
  return usingD1 ? d1Store : localStore;
}
