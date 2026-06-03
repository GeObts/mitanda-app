# Fork-verified UI proof

Screenshots from driving the **real app UI** (not raw contract calls) against the live
v4 contracts on an Anvil fork of Arbitrum Sepolia — the complete tanda lifecycle, including
a default and the insurance payout, executed end-to-end through the dashboard.

- **`00`–`40`, `pay-*`, `claim-*`** — full lifecycle: create → 2 joins → VRF/auto-start →
  3 cycles of pay + payout + claim → completion + insurance refunds (clone drains to zero).
- **`R1`–`R3`** — release-payout flow: recipient "Release & claim" + the permissionless
  "Release this cycle's payout" fallback; one tap settles the cycle and lands the funds.
- **`D1`–`D4`** — defaulter handling: within-grace info → past-grace "Mark as defaulter"
  → payout unblocks → honest members made whole from the slashed insurance.

Each run was reproduced through the real components and cross-checked against on-chain state.
