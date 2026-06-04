// Off-chain pending-request store.
//
// Production: Cloudflare D1, preferring the native binding (env.DB) and falling
// back to the REST API — see lib/server/d1.ts for the resolution order.
// Local/dev fallback: a JSON file, so the API round-trip is testable without
// any Cloudflare credentials.
import { promises as fs } from "fs";
import { join } from "path";
import { resolveRunner, usingD1 as d1Available, type SqlRunner } from "./d1";

export type RequestStatus = "pending" | "approved" | "declined";

export interface JoinRequest {
  tanda: string; // clone address (lowercased)
  requester: string; // wallet (lowercased)
  status: RequestStatus;
  signedMessage: string; // ownership signature (proves requester owns wallet)
  createdAt: number; // unix seconds
  deadline?: number; // approved ticket deadline (unix seconds)
  ticket?: string; // approved EIP-712 ticket signature
  approvedAt?: number;
}

export interface Store {
  get(tanda: string, requester: string): Promise<JoinRequest | null>;
  listPending(tanda: string): Promise<JoinRequest[]>;
  put(rec: JoinRequest): Promise<void>;
}

// True if D1 is reachable by some path (binding or REST); else the local file.
export const usingD1 = d1Available;

// ── Cloudflare D1 (native binding or REST — same SQL either way) ──────────────
let schemaReady = false;

async function ensureSchema(run: SqlRunner) {
  if (schemaReady) return;
  await run(
    `CREATE TABLE IF NOT EXISTS requests (
      tanda TEXT NOT NULL,
      requester TEXT NOT NULL,
      status TEXT NOT NULL,
      signed_message TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      deadline INTEGER,
      ticket TEXT,
      approved_at INTEGER,
      PRIMARY KEY (tanda, requester)
    )`,
  );
  schemaReady = true;
}

function rowToReq(r: Record<string, unknown>): JoinRequest {
  return {
    tanda: String(r.tanda),
    requester: String(r.requester),
    status: r.status as RequestStatus,
    signedMessage: String(r.signed_message),
    createdAt: Number(r.created_at),
    deadline: r.deadline == null ? undefined : Number(r.deadline),
    ticket: r.ticket == null ? undefined : String(r.ticket),
    approvedAt: r.approved_at == null ? undefined : Number(r.approved_at),
  };
}

function makeD1Store(run: SqlRunner): Store {
  return {
    async get(tanda, requester) {
      await ensureSchema(run);
      const rows = await run(
        `SELECT * FROM requests WHERE tanda = ? AND requester = ?`,
        [tanda.toLowerCase(), requester.toLowerCase()],
      );
      return rows[0] ? rowToReq(rows[0]) : null;
    },
    async listPending(tanda) {
      await ensureSchema(run);
      const rows = await run(
        `SELECT * FROM requests WHERE tanda = ? AND status = 'pending' ORDER BY created_at ASC`,
        [tanda.toLowerCase()],
      );
      return rows.map(rowToReq);
    },
    async put(rec) {
      await ensureSchema(run);
      await run(
        `INSERT INTO requests (tanda, requester, status, signed_message, created_at, deadline, ticket, approved_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(tanda, requester) DO UPDATE SET
           status = excluded.status,
           signed_message = excluded.signed_message,
           created_at = excluded.created_at,
           deadline = excluded.deadline,
           ticket = excluded.ticket,
           approved_at = excluded.approved_at`,
        [
          rec.tanda.toLowerCase(),
          rec.requester.toLowerCase(),
          rec.status,
          rec.signedMessage,
          rec.createdAt,
          rec.deadline ?? null,
          rec.ticket ?? null,
          rec.approvedAt ?? null,
        ],
      );
    },
  };
}

// ── Local JSON-file fallback ─────────────────────────────────────────────────
const FILE = join(process.cwd(), ".dev-requests.json");

async function readAll(): Promise<Record<string, JoinRequest>> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return {};
  }
}
async function writeAll(data: Record<string, JoinRequest>) {
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}
const key = (t: string, r: string) => `${t.toLowerCase()}|${r.toLowerCase()}`;

const localStore: Store = {
  async get(tanda, requester) {
    const all = await readAll();
    return all[key(tanda, requester)] ?? null;
  },
  async listPending(tanda) {
    const all = await readAll();
    return Object.values(all)
      .filter(
        (r) => r.tanda === tanda.toLowerCase() && r.status === "pending",
      )
      .sort((a, b) => a.createdAt - b.createdAt);
  },
  async put(rec) {
    const all = await readAll();
    all[key(rec.tanda, rec.requester)] = {
      ...rec,
      tanda: rec.tanda.toLowerCase(),
      requester: rec.requester.toLowerCase(),
    };
    await writeAll(all);
  },
};

export function getStore(): Store {
  const run = resolveRunner();
  return run ? makeD1Store(run) : localStore;
}
