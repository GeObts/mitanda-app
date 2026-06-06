# Mi Tanda — Project Context

> **Last updated:** 2026-06-05
>
> Single source of truth for the current state of the Mi Tanda project: what it
> is, how it's built, where it's deployed, what's done, and what's in flight.
> Cross-checked against `mitanda-contracts/deployments/*.json` and the in-repo
> runbooks (`docs/BASE_APP.md`). When this drifts from reality, fix it here.

---

## 1. What it is

Mi Tanda is an on-chain **ROSCA** (rotating savings and credit association — a
*tanda* / *cundina* in Latin America). Members each contribute a fixed amount
per cycle, and one member receives the full pot each cycle, rotating until
everyone has received exactly once. The whole thing is **smart-contract
enforced**, so no organizer can run off with the pooled money.

- **Audience:** Latino/Hispanic communities and non-crypto users — the UX hides
  the chain (Privy email/social login on the web, Base Account inside the Base App).
- **Live:** [mitanda.online](https://mitanda.online).
- **Built-in defaulter insurance**, soulbound membership/completion NFTs, and
  transferable payout receipts.

The product spec (vision, market, personas, business model, GTM, roadmap) lives
in [`docs/PRD.md`](./docs/PRD.md). This file tracks engineering/deployment state.

---

## 2. Architecture — dual build from one codebase

Mi Tanda ships as **two builds from a single codebase**, selected at build time
by the `NEXT_PUBLIC_ACTIVE_CHAIN` env var (see `lib/app-mode.ts`). The whole app
reads its active chain + contract addresses from one module
(`lib/contracts/addresses.ts`), so the flag repoints everything with no
per-file changes.

| Build | Branch | Chain | Auth | Cloudflare Worker | URL | State |
|-------|--------|-------|------|-------------------|-----|-------|
| **Web app** (default) | `main` | Arbitrum One (42161) | Privy (email/social) | `mitanda` | [mitanda.online](https://mitanda.online) | **Live** |
| **Base App** | `base-app` | Base mainnet (8453) | Base Account (auto-connect in-app) | `mitanda-base` | [base.mitanda.online](https://base.mitanda.online) | **Deploy in progress** |

- **Deploys** run through **Cloudflare Workers Builds** (OpenNext adapter). A push
  to `main` builds + deploys the web app to `mitanda.online` automatically.
- The Base App build deploys to its **own** Worker (`mitanda-base`) via
  `wrangler.base.jsonc`, so it never touches the live web app.
- The full Base App integration runbook (base.dev registration, Builder Code,
  notifications, verification checklist) is in [`docs/BASE_APP.md`](./docs/BASE_APP.md).

> **Note — the "unified runtime chain-switcher" refactor was cancelled.** An
> alternative was briefly scoped: collapse the two builds into one app that
> supports both chains via a runtime `useChainId()` switcher in the UI. That
> approach was **abandoned** in favor of keeping the proven build-flag dual-build
> (zero risk to the live web app, no chain-threading refactor across ~27 files).

---

## 3. Chains & deployments

Both mainnets run the **v4 audit-hardened** contracts (`_mint` NFTs,
`nonReentrant markDefaulter`), commit `d17e039`. Tanda clones are minimal proxies
of a single implementation; the Manager orchestrates Chainlink VRF v2.5 (native
ETH) and forwards the seed to each clone via `assignPayoutOrder` (clones are
never VRF consumers).

Shared config across both deployments:
- **Treasury:** `0x70D3a9aA7e10070d3F528e91c9bCf5158c922C66`
- **Owner / deployer:** `0xe4d579f6195c5A4f084132a8250139d7B84b8f63`
- **Fees:** platform 2% / organizer 3% / recipient 95% (200 / 300 bps)
- **Genesis sponsored collection (#1):** registered + active, royalty receiver = treasury.

### Arbitrum One (chainId 42161) — **LIVE**, all production tandas here

| Contract | Address |
|----------|---------|
| TandaManager | `0xa88aB3B81D9cA6BB556104B72e73b722D3abE678` |
| Tanda implementation | `0xD55c72B7fF4777D382Bd69b9B27Cc1da799d119d` |
| MitandaPassNFT | `0x52ff9dBb6124E3EBCEbA75A875A43d1752c0F277` |
| MitandaReceiptNFT | `0x00e904e04156d13Eb35D8404053e2eDE02aDAB96` |
| MitandaCompletionNFT | `0x1CB29BCb3Dc1bF7B4A7083F779c488BF4a55573d` |

- **Tokens (allowlisted):** MXNB `0xF197FFC28c23E0309B5559e7a166f2c6164C80aA` (the
  headline contribution currency for the Mexican audience) and USDC
  `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`.
- **VRF:** subscription `39124666372397226298450322444773052468399208338933848659824100593694266892739`;
  the Manager is registered as a consumer (`addConsumer` done, consumer list
  verified on-chain).
- **Explorer:** [arbiscan.io/address/0xa88a…E678](https://arbiscan.io/address/0xa88aB3B81D9cA6BB556104B72e73b722D3abE678)

### Base mainnet (chainId 8453) — contracts deployed, Base App build in progress

| Contract | Address |
|----------|---------|
| TandaManager | `0x74b6Fc121A40C1A3282af6Bd78074AC3C2a32814` |
| Tanda implementation | `0x7Ee43871c368901652F9b15A2ed28603Bc7A0bB9` |
| MitandaPassNFT | `0xe9A5c185F5ab2A9434a880C92DB8A51014C75e5f` |
| MitandaReceiptNFT | `0x0dDb8bC0bD88d7933Dc4B54618768156a3558443` |
| MitandaCompletionNFT | `0xCF006fe8E86E7Fd92A7fD2f9E0A64dc4761AfAB3` |

- **Token (allowlisted):** USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (MXNB
  is not native to Base; Base tandas use USDC).
- **VRF:** subscription `96962708632878719095006892215857070533570294314705997602906995270009408934655`;
  the Manager is registered as a consumer via `addConsumer` tx
  `0x1dd0427d181df17468263017fbf32768ab811dc69df08ef957d00993a2083e29` (verified
  on-chain).
- **Explorer:** [basescan.org/address/0x74b6…2814](https://basescan.org/address/0x74b6Fc121A40C1A3282af6Bd78074AC3C2a32814)
- Rehearsed first on Base Sepolia (commit `201fc58`).

Authoritative deployment records: `mitanda-contracts/deployments/42161.json`,
`8453.json`, and the matching `arbitrum-one-mainnet.md` / `base-mainnet.md`.

---

## 4. Tech stack

- **Frontend:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · shadcn/ui
- **Web3:** Privy (web auth) · wagmi v3 · viem · TanStack Query · Base Account (Base App auth)
- **Contracts:** Solidity 0.8.20 · Foundry · OpenZeppelin · Chainlink VRF v2.5
- **Hosting:** OpenNext on Cloudflare Workers (Workers Builds CI)

---

## 5. Repositories

| Repo / folder | Role |
|---------------|------|
| `mitanda-app` (this) | Web + Base App frontend; drives the contracts |
| `mitanda-contracts` | Solidity v4 contracts, Foundry, deployment records |
| `mitanda-etherfuse` | Etherfuse / CETES yield integration work (in progress) |

> The smart contracts live in a separate repo
> ([GeObts/mitanda-contracts](https://github.com/GeObts/mitanda-contracts)); the
> frontend and contracts together are the full project.

---

## 6. Status

### Done
- **Footer restructure** on the landing page (brand left, nav top-right,
  powered-by bottom-right).
- **`onJoin` cleanup** — removed the dormant "Join this tanda" chain from
  `create-tanda-dialog.tsx` (the creator auto-joins at create time, so the
  Success panel never needed a join button).
- **Unified runtime multi-chain refactor — cancelled** (kept the dual-build; see §2).
- **Mainnet contract deployments** on both Arbitrum One and Base (v4
  audit-hardened, VRF wired, consumers registered on both).
- **Base mainnet addresses baked into `addresses.ts`** for the Base App build.

### Open / in progress
- **Etherfuse integration** — in progress on the `etherfuse` branch (see §7).
- **Base App Cloudflare Worker deploy** — in progress; custom domain
  `base.mitanda.online` attached. Complete base.dev registration per
  `docs/BASE_APP.md` once the Worker is live.

---

## 7. Etherfuse / CETES integration plan

Goal: make the **defaulter-insurance pool productive** by earning yield on
Mexican government bond rates (**CETES**) via Etherfuse, instead of sitting idle.

- **v1 (yield):** insurance-pool capital is swapped into a CETES-yielding
  instrument (Etherfuse tokenized CETES / stablebonds) on **Solana**, so idle
  insurance reserves accrue real-world bond yield while remaining claimable to
  cover defaulters.
- **v2 (production bridge architecture):** bridge the value back to **Base** using
  **LayerZero** messaging and **Circle CCTP** for native USDC transfer, so yield
  earned on Solana settles back into the Base-side insurance accounting without
  custodial hops.

Detailed design and runbook will live in **`docs/ETHERFUSE.md`** (authored on the
`etherfuse` branch by the Etherfuse agent). Link it here once written.

---

## 8. Reference docs

- [`README.md`](./README.md) — hackathon submission overview
- [`docs/PRD.md`](./docs/PRD.md) — full product requirements
- [`docs/BASE_APP.md`](./docs/BASE_APP.md) — Base App integration runbook
- `docs/ETHERFUSE.md` — Etherfuse integration (forthcoming)
- `mitanda-contracts/deployments/` — authoritative on-chain deployment records
- `e2e-evidence/` — screenshots of the full lifecycle driven through the real UI
