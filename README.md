# Mi Tanda

**Mi Tanda is an on-chain ROSCA** (a *tanda* / *cundina* — rotating savings club).
Members each contribute a fixed amount per cycle, and one member receives the
full pot each cycle, rotating until **everyone has received exactly once**.
Because it's **smart-contract enforced**, no organizer can run off with the
money — the rules, the pot, and the payout order all live on-chain.

Built for **Latino/Hispanic communities and non-crypto users**: the chain is
hidden behind email/social login, and contributions are made in a stablecoin
people already understand (the Mexican-peso stablecoin **MXNB**, or USDC).

🌐 **Live:** [mitanda.online](https://mitanda.online)

> **Smart contracts live in a separate repo:**
> [**GeObts/mitanda-contracts**](https://github.com/GeObts/mitanda-contracts).
> This repo is the frontend that drives them; the two together are the full project.

📄 **Product Requirements Document:** [`docs/PRD.md`](./docs/PRD.md) ·
🧭 **Project context / current state:** [`MITANDA_PROJECT_CONTEXT.md`](./MITANDA_PROJECT_CONTEXT.md)

---

## Sponsor integrations

| Sponsor | How Mi Tanda uses it |
|---------|----------------------|
| **Arbitrum One** | The main chain — **all production tandas run here.** v4 audit-hardened contracts, live mainnet. |
| **Bitso / MXNB** | **MXNB**, the Mexican-peso stablecoin, is the headline contribution currency on Arbitrum — members save in pesos, not an unfamiliar asset. |
| **Base** | The **Base App distribution build**; contracts are deployed and verified on **Base mainnet**, with the Base App build in progress. |
| **Etherfuse / CETES** | **Insurance-pool yield** — idle defaulter-insurance reserves earn Mexican government-bond (**CETES**) yield via Etherfuse. See [`docs/ETHERFUSE.md`](./docs/ETHERFUSE.md) *(written by the Etherfuse integration; link goes live when published)*. |

---

## Live URLs

- **Web app:** [mitanda.online](https://mitanda.online) — Arbitrum One, Privy login.
- **Base App:** [base.mitanda.online](https://base.mitanda.online) — Base mainnet, Base Account auth (deploy in progress).

---

## Contract addresses

Both mainnets run the same **v4 audit-hardened** contracts (commit `d17e039`).
Tanda clones are minimal proxies of one implementation; the Manager orchestrates
Chainlink VRF v2.5 for the randomized payout order.

### Arbitrum One (chainId 42161) — live

| Contract | Address |
|----------|---------|
| TandaManager | [`0xa88aB3B81D9cA6BB556104B72e73b722D3abE678`](https://arbiscan.io/address/0xa88aB3B81D9cA6BB556104B72e73b722D3abE678) |
| Tanda implementation | [`0xD55c72B7fF4777D382Bd69b9B27Cc1da799d119d`](https://arbiscan.io/address/0xD55c72B7fF4777D382Bd69b9B27Cc1da799d119d) |
| MitandaPassNFT | [`0x52ff9dBb6124E3EBCEbA75A875A43d1752c0F277`](https://arbiscan.io/address/0x52ff9dBb6124E3EBCEbA75A875A43d1752c0F277) |
| MitandaReceiptNFT | [`0x00e904e04156d13Eb35D8404053e2eDE02aDAB96`](https://arbiscan.io/address/0x00e904e04156d13Eb35D8404053e2eDE02aDAB96) |
| MitandaCompletionNFT | [`0x1CB29BCb3Dc1bF7B4A7083F779c488BF4a55573d`](https://arbiscan.io/address/0x1CB29BCb3Dc1bF7B4A7083F779c488BF4a55573d) |

**Tokens:** MXNB [`0xF197…80aA`](https://arbiscan.io/token/0xF197FFC28c23E0309B5559e7a166f2c6164C80aA) ·
USDC [`0xaf88…5831`](https://arbiscan.io/token/0xaf88d065e77c8cC2239327C5EDb3A432268e5831)

### Base mainnet (chainId 8453) — deployed

| Contract | Address |
|----------|---------|
| TandaManager | [`0x74b6Fc121A40C1A3282af6Bd78074AC3C2a32814`](https://basescan.org/address/0x74b6Fc121A40C1A3282af6Bd78074AC3C2a32814) |
| Tanda implementation | [`0x7Ee43871c368901652F9b15A2ed28603Bc7A0bB9`](https://basescan.org/address/0x7Ee43871c368901652F9b15A2ed28603Bc7A0bB9) |
| MitandaPassNFT | [`0xe9A5c185F5ab2A9434a880C92DB8A51014C75e5f`](https://basescan.org/address/0xe9A5c185F5ab2A9434a880C92DB8A51014C75e5f) |
| MitandaReceiptNFT | [`0x0dDb8bC0bD88d7933Dc4B54618768156a3558443`](https://basescan.org/address/0x0dDb8bC0bD88d7933Dc4B54618768156a3558443) |
| MitandaCompletionNFT | [`0xCF006fe8E86E7Fd92A7fD2f9E0A64dc4761AfAB3`](https://basescan.org/address/0xCF006fe8E86E7Fd92A7fD2f9E0A64dc4761AfAB3) |

**Token:** USDC [`0x8335…2913`](https://basescan.org/token/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
(MXNB isn't native to Base; Base tandas use USDC.)

---

## Tech stack

- **Frontend:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · shadcn/ui
- **Web3:** Privy (web auth) · wagmi v3 · viem · TanStack Query · Base Account (Base App)
- **Contracts:** Solidity 0.8.20 · Foundry · OpenZeppelin · Chainlink VRF v2.5
- **Hosting:** OpenNext on Cloudflare Workers

---

## Demo flow

A complete tanda runs end-to-end from the dashboard — no block-explorer calls needed:

1. **Create** — start a savings circle (amount per cycle, member count, interval,
   public or private). The **creator is auto-enrolled at create time** (cycle 1
   paid), so they never need a separate "join" step.
2. **Join** — others join a public tanda by ID, or a private one via an
   **EIP-712 signed invite** (per-address ticket) or an approved join request.
3. **Pay** — members pay one or more cycles ahead; pull-payment throughout.
4. **Cycle payout** — once the circle fills, **Chainlink VRF** randomizes the
   payout order; each cycle the current recipient receives the pot
   (recipient 95% / organizer 3% / platform 2%).
5. **Completion** — after everyone has received once, the tanda completes with a
   soulbound completion NFT and **no trapped funds**.
6. **Insurance refund** — honest members get their defaulter-insurance deposit
   refunded; if someone defaults past grace, their insurance is slashed to cover
   the gap and unblock the payout.

Soulbound membership/completion NFTs and transferable payout receipts are minted
along the way. Every read is pinned to the active chain and derived from on-chain
state (`getPayoutOrder`, `getAllParticipants`, `gracePeriod`).

---

## Proof of testing

[`e2e-evidence/`](./e2e-evidence) holds screenshots from driving the **real UI**
against the live v4 contracts on a mainnet fork — the **full lifecycle** (create →
join → VRF → cycles → completion + insurance refunds), the **release flow**, and a
complete **default + insurance payout**, each cross-checked against on-chain state.
The deployed mainnet implementation bytecode is a byte-for-byte match to the code
that passed the 91-test suite and the full fork lifecycle.

---

## Getting started

```bash
npm install
cp .env.example .env.local   # add NEXT_PUBLIC_PRIVY_APP_ID + RPC overrides (no secrets committed)
npm run dev                  # http://localhost:3000
```

Regenerate ABIs from the contracts repo with `node scripts/gen-abis.mjs`.
The Base App build + deploy runbook is in [`docs/BASE_APP.md`](./docs/BASE_APP.md).

---

## Team

<!-- TODO: fill in team members, roles, and contact/links before submission. -->
_TODO — add team members and roles._
