# Etherfuse integration — CETES yield for the insurance pool

MiTanda charges a **10% insurance premium** on every contribution
(`INSURANCE_BPS = 1000`, see `lib/contracts/index.ts`). That premium accrues into
each tanda's `totalInsuranceReserve` and sits **idle** for the life of the tanda,
then is refunded to members on completion. This integration puts that idle capital
to work by routing it into **CETES** — tokenized Mexican treasury bills issued by
[Etherfuse](https://etherfuse.com) — so the pool earns a real, low-risk yield
(live **3.13% APY** at time of writing) while it waits.

This doc describes the production target (v2) and the shipped demo (v1), and why
they differ.

---

## TL;DR

| | v1 (shipped demo) | v2 (production target) |
|---|---|---|
| Where the pool lives | Solana devnet | Base mainnet (where the tandas are) |
| Yield asset | CETES SPL token | CETES |
| How USDC → CETES | Direct Etherfuse swap on Solana | Bridge Base USDC → Solana, swap, bridge CETES value back |
| Cross-chain | none | LayerZero / Circle CCTP round-trip |
| Auth surface | `app/api/etherfuse/*` route handlers (server-held key) | same, plus signed webhooks + durable store |

The **only** reason v1 runs on Solana instead of Base is **liquidity** (next
section). The integration code (`lib/etherfuse/client.ts`, the route handlers, the
quote/swap flow) is chain-parameterized and carries over to v2 largely unchanged —
what changes is the bridging plumbing around it.

---

## Why not just do CETES on Base directly?

MiTanda's live tandas are on **Arbitrum One / Base** (EVM). The obvious design is
to swap the Base-USDC insurance pool straight into CETES on Base. Today that
**doesn't work**, because CETES liquidity on Base is negligible.

From the public Etherfuse lookup (`GET /lookup/stablebonds`, observed 2026-06-05),
CETES total supply by chain:

| Chain | CETES supply |
|---|---:|
| **Solana** | ~402,125,225 |
| Stellar | ~84,665,126 |
| Monad | ~111,889 |
| Base | **~1,925** |
| Polygon | ~1,716 |

Base has **~1,900 CETES** vs **~402M on Solana** — five orders of magnitude less.
A swap of any meaningful insurance pool on Base would either fail or eat
catastrophic slippage. **Solana is where CETES is actually liquid**, so that's
where the v1 demo executes the swap.

(The Etherfuse `/ramp/assets` and `/ramp/quote` endpoints will happily price a
Solana swap; a Base swap of the same size has nothing to fill against.)

---

## v1 — the shipped demo (Solana swap)

End-to-end, all against the Etherfuse **sandbox** (`api.sand.etherfuse.com`) on
**Solana devnet**.

### Flow

```
YieldSection (tanda room)
  ├─ live APY:   GET /api/etherfuse/cetes-rate ─► GET /lookup/bonds/cost/CETES   (public)
  └─ swap demo:  SolanaProvider › SwapWidget
        1. connect wallet         (wallet-adapter, Phantom/Solflare via Wallet Standard)
        2. quote   POST /api/etherfuse/quote ─► POST /ramp/quote {type:"swap"}    (server key)
        3. swap    POST /api/etherfuse/swap  ─► POST /ramp/swap                     (server key)
        4. await   Etherfuse ─► POST /api/etherfuse/webhook (swap_updated)          (async)
        5. poll    GET /api/etherfuse/swap/{orderId} ─► sendTransaction
        6. sign    wallet signs + submits the returned Solana tx
        7. confirm + show Solana Explorer link
```

### Key facts (verified live)

- **Auth header is the bare key** — `Authorization: <key>`, **no `Bearer`**.
- **`customerId` is derived from the key**: `key.split(":")[2]`. This equals the
  `id` returned by `GET /ramp/me` — never hardcode it (`deriveCustomerId()`).
- **On Solana the asset `identifier` is the bare mint address**, not Stellar's
  `CODE:ISSUER`. Verified mints (sandbox):
  - USDC (Etherfuse Devnet): `BXTou3CvPxpFVAJvzvEZcAnRLGCHqT1LHKsFTSQft7s`
  - CETES: `AvvetPGuuB5FD5m86fpw3LtDKyQoUFT1mG9WarNQLW4q`
- **`/ramp/quote` is synchronous** and returns fee-inclusive pricing
  (`exchangeRate`, `destinationAmount`, `expiresAt` ~2 min).
- **`/ramp/swap` is asynchronous**: it returns an empty `200`. The signable
  transaction (`sendTransaction`) and final status arrive via the `swap_updated`
  webhook (`created → funded → completed`).
- **CETES APY** comes from `GET /lookup/bonds/cost/CETES` →
  `current_basis_points` (e.g. `313` = 3.13%). This endpoint is **public** (no key).
- `/ramp/assets` is intermittently slow (504s); the mints above are baked into
  `lib/etherfuse/constants.ts` with the live lookup as a fallback.

### The webhook + localhost caveat

Because the swap transaction comes back over a webhook, **Etherfuse must be able to
reach our server**. On localhost it can't. To run the full swap end-to-end locally:

1. Start the app: `npm run dev`.
2. Tunnel it: `cloudflared tunnel --url http://localhost:3000`
   (or `ngrok http 3000`).
3. Register the public URL for the `swap_updated` event:
   `POST /ramp/webhook` with `{ url: "<tunnel>/api/etherfuse/webhook", events: ["swap_updated"] }`.

Until a webhook is delivered, the swap UI sits in **"Waiting for Etherfuse…"** and
times out after 90s with a message pointing here. Quote + live APY work without any
tunnel.

> Production hardening TODO: verify the webhook signature in
> `app/api/etherfuse/webhook/route.ts`, and replace the in-memory
> `lib/server/etherfuse-swap-store.ts` Map with a durable store (the app already
> has a D1 store pattern in `lib/server/`).

### Files

```
lib/etherfuse/constants.ts            chain + mint identifiers, quote TTL
lib/etherfuse/client.ts               SERVER-ONLY typed API client (key lives here)
lib/server/etherfuse-swap-store.ts    in-memory webhook payload store (dev)
app/api/etherfuse/cetes-rate/route.ts GET live CETES APY (public passthrough)
app/api/etherfuse/quote/route.ts      POST swap quote (server key)
app/api/etherfuse/swap/route.ts       POST initiate swap (server key)
app/api/etherfuse/swap/[orderId]/...  GET poll for the swap_updated payload
app/api/etherfuse/webhook/route.ts    POST swap_updated receiver
lib/hooks/use-cetes-rate.ts           live APY (TanStack Query)
lib/hooks/use-etherfuse-swap.ts       quote → swap → sign orchestration
components/solana/solana-provider.tsx scoped Solana wallet-adapter provider
components/solana/swap-widget.tsx      connect / quote / swap UI
components/yield-section.tsx           the panel slotted into the tanda room
```

The MiTanda contracts are **untouched** — the integration only *reads*
`totalInsuranceReserve()`.

---

## v2 — production target (Base, via a bridge round-trip)

The insurance pool is Base USDC, but CETES liquidity is on Solana. v2 keeps the
pool's *accounting* on Base while sourcing yield from Solana via a cross-chain
round-trip:

```
Base USDC (insurance reserve)
   │  1. bridge USDC Base → Solana        (Circle CCTP — native USDC burn/mint)
   ▼
Solana USDC
   │  2. swap USDC → CETES                (Etherfuse /ramp/swap, as in v1)
   ▼
Solana CETES  ──────────  earns ~3% APY while the tanda runs
   │  3. on tanda completion: swap CETES → USDC   (Etherfuse offramp/swap)
   │  4. bridge USDC Solana → Base        (CCTP back)  + a messaging layer
   ▼                                       (LayerZero) to settle accounting
Base USDC (refunded to members + accrued yield)
```

### Why CCTP **and** LayerZero

- **Circle CCTP** moves the *value* (USDC) trustlessly across chains via native
  burn-and-mint — no wrapped-asset risk. This is the asset bridge.
- **LayerZero** carries the *messages* — "pool X of tanda Y has been deployed to
  CETES / has been redeemed for Z USDC" — so the Base-side contract can track the
  off-chain position and gate refunds on settlement. CCTP moves money; LayerZero
  moves the state that the contract reasons about.

### What carries over from v1 unchanged

- `lib/etherfuse/client.ts` (quote/swap/rate) — the Solana leg is identical.
- The route-handler + webhook architecture, server-held key, `deriveCustomerId`.
- The YieldSection UI (the numbers just come from a Base-side position instead of
  a direct Solana wallet).

### What's new in v2

- A Base-side vault/escrow contract that holds the insurance reserve and emits the
  bridge intents (out of scope for this integration; contracts are not modified
  here).
- CCTP attestation handling + LayerZero message verification.
- A keeper to drive the multi-step round-trip and reconcile via webhooks.
- Webhook signature verification + durable persistence.

Until CETES liquidity on Base grows enough to make a direct same-chain swap viable
(making the bridge round-trip unnecessary), the Solana-sourced v2 above is the
pragmatic production path.
