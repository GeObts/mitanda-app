# Etherfuse integration — CETES yield for the insurance pool

MiTanda charges a **10% insurance premium** on every contribution
(`INSURANCE_BPS = 1000`, see `lib/contracts/index.ts`). That premium accrues into
each tanda's `totalInsuranceReserve` and sits **idle** for the life of the tanda,
then is refunded to members on completion. This integration puts that idle capital
to work by routing it into **CETES** — tokenized Mexican treasury bills issued by
[Etherfuse](https://etherfuse.com) — so the pool earns a real, low-risk yield
(live **~5.58% APY** at time of writing, sourced from Etherfuse production — see
[Rate source](#rate-source-live-vs-sandbox)) while it waits.

This doc describes the production target (v2) and the shipped demo (v1), and why
they differ.

---

## TL;DR

| | v1 (shipped demo) | v2 (production target) |
|---|---|---|
| Network | Solana **devnet** (sandbox key) | **mainnet** (production key) |
| Where CETES ends up | user's Solana wallet | user's **Base** Privy wallet (`0x33a7…1FfC`) |
| How USDC → CETES | Direct Etherfuse swap on Solana | Etherfuse swap on Solana mainnet, then **LayerZero OFT `send()` → Base** |
| Cross-chain | none | LayerZero OFT (Solana→Base, peer live); CCTP round-trip optional |
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
  `current_basis_points`. This endpoint is **public** (no key). We read it from
  **production** for the true live rate — see [Rate source](#rate-source-live-vs-sandbox).
- `/ramp/assets` is intermittently slow (504s); the mints above are baked into
  `lib/etherfuse/constants.ts` with the live lookup as a fallback.

### Rate source (live vs sandbox)

The displayed APY is read from **production's** public lookup
(`https://api.etherfuse.com/lookup/bonds/cost/CETES`), not the sandbox. Why:

| Source | `current_basis_points` | APY |
|---|---:|---|
| `api.sand.etherfuse.com` (sandbox) | `313` | 3.13% — **stale/fixed** |
| `api.etherfuse.com` (production, public) | `558` | **5.58% (live, 2026-06-06)** |

The sandbox value just mirrors the **devnet mint's** interest-bearing extension
(`currentRate: 313`; its `preUpdateAverageRate` was `639`). Production tracks the
real instrument and matches what `devnet.etherfuse.com` shows (~6%). Both endpoints
are public and keyless, so sourcing the *rate* from production is free and honest;
only the **swap/quote** require the sandbox key. Override via
`ETHERFUSE_PUBLIC_BASE_URL` (`lib/etherfuse/client.ts › getCetesRate`).

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

## v2 — production target (Solana swap → LayerZero OFT → Base CETES)

The goal: the user ends up holding **CETES on Base** (in their existing Privy
wallet) so the yield position lives next to the tandas. The pathway, all on
**mainnet**:

```
Solana mainnet USDC
   │  1. swap USDC → CETES        Etherfuse /ramp/swap (PRODUCTION key)   [same code as v1]
   ▼
Solana mainnet CETES
   │  2. LayerZero OFT send()     via the Solana CETES OFT program → dstEid = Base (30184)
   ▼
Base mainnet CETES               delivered to the user's Privy wallet 0x33a7…1FfC
   (contract 0x834df4C1d8f51Be24322E39e4766697BE015512F)
```

### The LayerZero pathway is real and live (verified 2026-06-06)

- **Base CETES `0x834df4C1d8f51Be24322E39e4766697BE015512F` is a real LayerZero
  OFT** on **Base mainnet**: `token()` returns its own address (native OFT, not an
  adapter), `symbol()` = `CETES`, behind an upgradeable proxy. It has **code on Base
  mainnet** and **none on Base Sepolia**.
- **The Solana ↔ Base pathway is configured**: calling `peers(30168)` (LayerZero
  **Solana-mainnet** EID) on the Base OFT returns a non-zero peer
  `0xdf27232aeae2338ad9c7cf38c083de3d97869dc69b3d480a1dd73d1a2c05cbb5` — i.e. the
  Base OFT already trusts a Solana-mainnet CETES OFT. So a Solana→Base OFT `send()`
  has a live, peered destination.

### Why this CANNOT run in the sandbox/devnet (verified by probes today)

This is the reason v2 is future work, not a sandbox demo:

1. **Sandbox doesn't support Base swaps.** `POST /ramp/quote` with
   `blockchain: "base"` → `400 {"type":"UnsupportedBlockchain","message":"Unsupported
   blockchain: base"}`. The sandbox only swaps on Solana. (Full payloads in
   [Probe evidence](#probe-evidence-2026-06-06).)
2. **Devnet CETES is not a user-callable OFT.** The Solana **devnet** CETES mint
   (`Avvet…LW4q`) is a plain **Token-2022** mint with an `interestBearingConfig`
   extension — there is no OFT program a user can call `send()` on. The OFT only
   exists on **mainnet**.
3. **Tier mismatch.** Even if devnet CETES were OFT-wrapped, LayerZero only bridges
   matching tiers (devnet/testnet ↔ testnet, mainnet ↔ mainnet). Solana devnet would
   peer to **Base Sepolia**, where `0x834d…512F` has **no code**. There is no
   devnet → Base-mainnet path.

### What's needed to enable v2

- **Etherfuse production API key** (`api_live:…` + base URL `https://api.etherfuse.com`),
  which requires completing **KYB onboarding** with Etherfuse.
- **A real USDC float** on Solana mainnet to swap (the swap moves real value).
- Client-side **LayerZero Solana OFT `send()`** construction (e.g.
  `@layerzerolabs/oft-v2-solana-sdk`): quote the native fee, build the
  `VersionedTransaction`, have the user sign in their Solana wallet, then poll
  [LayerZero Scan](https://layerzeroscan.com) for delivery and the Base receipt.
- Optionally, an alternative **CCTP + offramp round-trip** if the pool's accounting
  must stay denominated on Base (bridge Base USDC → Solana, swap, and bridge value
  back on completion) — heavier, only needed if a Base-side escrow contract holds
  the reserve. Out of scope here; contracts are not modified.

### What carries over from v1 unchanged

- `lib/etherfuse/client.ts` (quote/swap/rate) — the Solana swap leg is identical;
  only the base URL + key flip from sandbox to production.
- The route-handler + webhook architecture, server-held key, `deriveCustomerId`.
- The YieldSection UI.

---

## Probe evidence (2026-06-06)

Raw requests/responses behind the conclusions above, reproducible with the sandbox
key (`Authorization: <key>`, no `Bearer`).

**Base swaps are unsupported in sandbox** (bond↔bond, isolates the chain check):

```
POST https://api.sand.etherfuse.com/ramp/quote
{"blockchain":"base","quoteAssets":{"type":"swap",
  "sourceAsset":"0xcC77c598d42f2f78Beb42C91d12B9d4041a5cE29",
  "targetAsset":"0x8C58C6c8Cc86F2E551f3CD94a2E061c659ca61C3"},"sourceAmount":"100"}
→ 400 {"message":"Unsupported blockchain: base","type":"UnsupportedBlockchain","details":{"blockchain":"base"}}
```

**No USDC swap source on Base in sandbox** (and cross-chain targets are rejected):

```
POST https://api.sand.etherfuse.com/ramp/quote
{"blockchain":"base","quoteAssets":{"type":"swap",
  "sourceAsset":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",   // Base USDC
  "targetAsset":"0xcC77c598d42f2f78Beb42C91d12B9d4041a5cE29"},"sourceAmount":"100"}
→ 400 {"message":"Non-stable assets are not supported: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","type":"NonStableAsset"}

POST https://api.sand.etherfuse.com/ramp/quote   (blockchain:solana, target = Base CETES address)
{"blockchain":"solana","quoteAssets":{"type":"swap",
  "sourceAsset":"BXTou3CvPxpFVAJvzvEZcAnRLGCHqT1LHKsFTSQft7s",
  "targetAsset":"0x834df4C1d8f51Be24322E39e4766697BE015512F"},"sourceAmount":"100"}
→ 400 {"message":"Non-stable assets are not supported: 0x834df4C1d8f51Be24322E39e4766697BE015512F","type":"NonStableAsset"}
```

`GET /ramp/assets?blockchain=base` returns only CETES (`0xcC77…`) and TESOURO — **no
stablecoin**, so there is nothing to swap *from* on Base in sandbox.

**Base OFT peer check** (Base mainnet RPC):

```
eth_call 0x834df4C1d8f51Be24322E39e4766697BE015512F  peers(uint32 30168)   // Solana mainnet EID
→ 0xdf27232aeae2338ad9c7cf38c083de3d97869dc69b3d480a1dd73d1a2c05cbb5   (non-zero ⇒ peered)
eth_call … token()  → 0x834d…512F (self ⇒ native OFT)   ;   symbol() → "CETES"
eth_getCode (Base Sepolia) → 0x (no contract there)
```
