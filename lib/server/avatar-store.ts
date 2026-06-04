// Off-chain avatar (profile-photo) store, keyed by wallet address.
//
// Mirrors lib/server/store.ts exactly: Cloudflare D1 in production — native
// binding (env.DB) preferred, REST as fallback (see lib/server/d1.ts) — and a
// local JSON-file fallback for dev so the flow is testable without any
// Cloudflare credentials.
//
// Images are small, square, client-resized base64 data URLs (see
// avatar-upload-dialog). Storing them as TEXT keeps everything inside the
// existing D1 setup with no new infra. NOTE: an R2 bucket (store the blob,
// keep only the URL here) is the eventual upgrade for larger images — this
// schema can hold an `https://…` R2 URL in `data_url` unchanged.
import { promises as fs } from "fs";
import { join } from "path";
import { resolveRunner, usingD1 as d1Available, type SqlRunner } from "./d1";

export interface AvatarRecord {
  address: string; // lowercased wallet
  dataUrl: string | null; // "data:image/…;base64,…" (or, later, an R2 URL)
  name: string | null; // optional display name
  updatedAt: number; // unix seconds
}

export interface Profile {
  url: string | null;
  name: string | null;
}

export interface AvatarStore {
  get(address: string): Promise<AvatarRecord | null>;
  getManyProfiles(addresses: string[]): Promise<Record<string, Profile>>;
  put(rec: AvatarRecord): Promise<void>;
}

// True if D1 is reachable by some path (binding or REST); else the local file.
export const usingD1 = d1Available;

// ── Cloudflare D1 (native binding or REST — same SQL either way) ──────────────
let schemaReady = false;

async function ensureSchema(run: SqlRunner) {
  if (schemaReady) return;
  await run(
    `CREATE TABLE IF NOT EXISTS avatars (
      address TEXT PRIMARY KEY,
      data_url TEXT,
      name TEXT,
      updated_at INTEGER NOT NULL
    )`,
  );
  // Add the name column for tables created before it existed (ignore if present).
  try {
    await run(`ALTER TABLE avatars ADD COLUMN name TEXT`);
  } catch {
    // column already exists
  }
  schemaReady = true;
}

const orNull = (v: unknown): string | null =>
  v === null || v === undefined ? null : String(v);

function makeD1Store(run: SqlRunner): AvatarStore {
  return {
    async get(address) {
      await ensureSchema(run);
      const rows = await run(`SELECT * FROM avatars WHERE address = ?`, [
        address.toLowerCase(),
      ]);
      return rows[0]
        ? {
            address: String(rows[0].address),
            dataUrl: orNull(rows[0].data_url),
            name: orNull(rows[0].name),
            updatedAt: Number(rows[0].updated_at),
          }
        : null;
    },
    async getManyProfiles(addresses) {
      if (addresses.length === 0) return {};
      await ensureSchema(run);
      const lowered = addresses.map((a) => a.toLowerCase());
      const placeholders = lowered.map(() => "?").join(",");
      const rows = await run(
        `SELECT address, data_url, name FROM avatars WHERE address IN (${placeholders})`,
        lowered,
      );
      const out: Record<string, Profile> = {};
      for (const r of rows) {
        out[String(r.address)] = {
          url: orNull(r.data_url),
          name: orNull(r.name),
        };
      }
      return out;
    },
    async put(rec) {
      await ensureSchema(run);
      await run(
        `INSERT INTO avatars (address, data_url, name, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(address) DO UPDATE SET
           data_url = COALESCE(excluded.data_url, avatars.data_url),
           name = excluded.name,
           updated_at = excluded.updated_at`,
        [rec.address.toLowerCase(), rec.dataUrl, rec.name, rec.updatedAt],
      );
    },
  };
}

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
  async getManyProfiles(addresses) {
    const all = await readAll();
    const out: Record<string, Profile> = {};
    for (const a of addresses) {
      const rec = all[a.toLowerCase()];
      if (rec) out[a.toLowerCase()] = { url: rec.dataUrl, name: rec.name };
    }
    return out;
  },
  async put(rec) {
    const all = await readAll();
    const key = rec.address.toLowerCase();
    const existing = all[key];
    all[key] = {
      address: key,
      // Keep the existing photo when this update only changes the name.
      dataUrl: rec.dataUrl ?? existing?.dataUrl ?? null,
      name: rec.name,
      updatedAt: rec.updatedAt,
    };
    await writeAll(all);
  },
};

export function getAvatarStore(): AvatarStore {
  const run = resolveRunner();
  return run ? makeD1Store(run) : localStore;
}
