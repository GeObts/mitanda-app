// Off-chain pending-request store.
//
// Production: Cloudflare D1 over the REST API (no Workers runtime needed — runs
// from any Next.js server). Local/dev fallback: a JSON file, so the API
// round-trip is testable without Cloudflare credentials.
//
// Set these in .env.local to use D1 (else the local file is used):
//   CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, CLOUDFLARE_D1_DATABASE_ID
import { promises as fs } from "fs";
import { join } from "path";

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

const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const DB = process.env.CLOUDFLARE_D1_DATABASE_ID;

export const usingD1 = !!(ACCOUNT && TOKEN && DB);

// ── Cloudflare D1 (REST) ─────────────────────────────────────────────────────
let schemaReady = false;

async function d1(sql: string, params: unknown[] = []): Promise<any[]> {
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

function rowToReq(r: any): JoinRequest {
  return {
    tanda: r.tanda,
    requester: r.requester,
    status: r.status,
    signedMessage: r.signed_message,
    createdAt: r.created_at,
    deadline: r.deadline ?? undefined,
    ticket: r.ticket ?? undefined,
    approvedAt: r.approved_at ?? undefined,
  };
}

const d1Store: Store = {
  async get(tanda, requester) {
    await ensureSchema();
    const rows = await d1(
      `SELECT * FROM requests WHERE tanda = ? AND requester = ?`,
      [tanda.toLowerCase(), requester.toLowerCase()],
    );
    return rows[0] ? rowToReq(rows[0]) : null;
  },
  async listPending(tanda) {
    await ensureSchema();
    const rows = await d1(
      `SELECT * FROM requests WHERE tanda = ? AND status = 'pending' ORDER BY created_at ASC`,
      [tanda.toLowerCase()],
    );
    return rows.map(rowToReq);
  },
  async put(rec) {
    await ensureSchema();
    await d1(
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
  return usingD1 ? d1Store : localStore;
}
