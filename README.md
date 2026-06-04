# Mi Tanda — App

The web app for **Mi Tanda**, an on-chain ROSCA (rotating savings club) that brings Latin
America's *tanda* savings tradition on-chain with built-in defaulter insurance, automatic NFT
receipts, and rotating artist/sponsor collections.

> **Smart contracts live in a separate repo:** [**GeObts/mitanda-contracts**](https://github.com/GeObts/mitanda-contracts).
> This repo is the frontend that drives them. The two together are the full project.

📄 **Product Requirements Document:** [`docs/PRD.md`](./docs/PRD.md) — vision, market, personas, full feature spec, business model, go-to-market, and roadmap (PMF score 8.2/10).

## What it does

A complete tanda runs end-to-end from the dashboard — no block-explorer calls needed:

- **Create / Join / Pay** — start a savings circle, join by ID, pay one or more cycles ahead.
- **Claim** — one-tap `withdraw()` of accrued pull-payments (cycle payouts, the organizer fee,
  insurance refunds).
- **Release** — once a cycle's payout time passes, the recipient gets a "Release & claim"
  (settles the cycle and pulls the funds in one flow); any participant gets a permissionless
  "Release this cycle's payout" fallback.
- **Defaulter handling** — when a member hasn't paid a due cycle, the payout stays blocked;
  within grace it's informational, and past grace a permissionless "Mark as defaulter" slashes
  their insurance to cover the gap and unblocks the payout — framed as protecting the honest
  members.
- **Invites, soulbound membership/completion NFTs, and transferable payout receipts.**

Every read is pinned to the active chain; all payout/default logic is derived from on-chain
state (`getPayoutOrder`, `getAllParticipants`, `gracePeriod`). Pull-payment throughout.

## Proof of testing

[`e2e-evidence/`](./e2e-evidence) holds screenshots from driving the **real UI** against the
live v4 contracts on an Arbitrum Sepolia fork — the **full lifecycle** (create → join → VRF →
3 cycles → completion + insurance refunds), the **release flow**, and a complete **default +
insurance payout**, each cross-checked against on-chain state.

## Stack

Next.js 16 (App Router) · wagmi v3 · viem · Privy (auth) · TanStack Query · Tailwind ·
Arbitrum Sepolia. Deployed contract addresses live in [`lib/contracts/addresses.ts`](./lib/contracts/addresses.ts).

## Getting started

```bash
npm install
cp .env.example .env.local   # add NEXT_PUBLIC_PRIVY_APP_ID + RPC overrides (no secrets committed)
npm run dev                  # http://localhost:3000
```

Regenerate ABIs from the contracts repo with `node scripts/gen-abis.mjs`.
