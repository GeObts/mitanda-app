-- Mi Tanda — Cloudflare D1 schema.
--
-- Exactly the schema the app's store code expects:
--   requests  ← lib/server/store.ts        (join-requests; CORE feature)
--   avatars   ← lib/server/avatar-store.ts (profile photo + display name)
--
-- Apply to the live database with:
--   wrangler d1 execute mitanda-db --remote --file=./db/schema.sql
--
-- All statements are idempotent (IF NOT EXISTS), so re-running is safe. The app
-- also self-heals these tables at runtime (CREATE TABLE IF NOT EXISTS), but
-- applying here means the very first request never pays the DDL round-trip.

-- ── Join-requests ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS requests (
  tanda          TEXT    NOT NULL,  -- clone address (lowercased)
  requester      TEXT    NOT NULL,  -- wallet (lowercased)
  status         TEXT    NOT NULL,  -- 'pending' | 'approved' | 'declined'
  signed_message TEXT    NOT NULL,  -- wallet-ownership signature
  created_at     INTEGER NOT NULL,  -- unix seconds
  deadline       INTEGER,           -- approved ticket deadline (unix seconds)
  ticket         TEXT,              -- approved EIP-712 ticket signature
  approved_at    INTEGER,           -- unix seconds
  PRIMARY KEY (tanda, requester)
);

-- Optional performance index for listPending() (WHERE tanda = ? AND status =
-- 'pending'). Not required by the code; harmless if absent.
CREATE INDEX IF NOT EXISTS idx_requests_tanda_status ON requests (tanda, status);

-- ── Avatars / profiles ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS avatars (
  address    TEXT    PRIMARY KEY,   -- lowercased wallet
  data_url   TEXT,                  -- "data:image/…;base64,…" (or later an R2 URL)
  name       TEXT,                  -- optional display name
  updated_at INTEGER NOT NULL       -- unix seconds
);
