// Deployed contract addresses for Mi Tanda, keyed by chain.
//
// Source of truth:
//   - Arbitrum One    (42161):  mitanda-contracts/deployments/arbitrum-one-mainnet.md  ← web app (live)
//   - Base mainnet    (8453):   mitanda-contracts/deployments/base-mainnet.md          ← Base App
//   - Arbitrum Sepolia (421614): mitanda-contracts/deployments/421614.json  (testnet)
//   - Base Sepolia    (84532):  mitanda-contracts/deployments/84532.json     (testnet)
// These are public addresses (not secrets), so they're committed as literals.
// Each chain has its own NEXT_PUBLIC_* override prefix so a stale override for
// one chain can't hijack the active chain.
//
// Which chain the app actually reads/writes is chosen at BUILD time by
// NEXT_PUBLIC_ACTIVE_CHAIN (see lib/app-mode.ts), so the same codebase ships as
// both the Arbitrum web app (default) and the Base App build.
import { arbitrum, arbitrumSepolia, base, baseSepolia } from "viem/chains";
import { APP_MODE } from "@/lib/app-mode";

type Hex = `0x${string}`;

const env = (key: string, fallback: Hex): Hex => {
  const v = process.env[key];
  return v && v.length > 0 ? (v as Hex) : fallback;
};

export const addresses = {
  // ── Arbitrum One (ACTIVE — mainnet, live) ─────────────────────────────────
  // v4 audit-hardened deploy (see mitanda-contracts/deployments/arbitrum-one-mainnet.md).
  [arbitrum.id]: {
    manager: env(
      "NEXT_PUBLIC_ARB_ONE_MANAGER_ADDRESS",
      "0xa88aB3B81D9cA6BB556104B72e73b722D3abE678",
    ),
    tandaImpl: env(
      "NEXT_PUBLIC_ARB_ONE_TANDA_IMPL_ADDRESS",
      "0xD55c72B7fF4777D382Bd69b9B27Cc1da799d119d",
    ),
    passNft: env(
      "NEXT_PUBLIC_ARB_ONE_PASS_NFT_ADDRESS",
      "0x52ff9dBb6124E3EBCEbA75A875A43d1752c0F277",
    ),
    receiptNft: env(
      "NEXT_PUBLIC_ARB_ONE_RECEIPT_NFT_ADDRESS",
      "0x00e904e04156d13Eb35D8404053e2eDE02aDAB96",
    ),
    completionNft: env(
      "NEXT_PUBLIC_ARB_ONE_COMPLETION_NFT_ADDRESS",
      "0x1CB29BCb3Dc1bF7B4A7083F779c488BF4a55573d",
    ),
    // Circle USDC on Arbitrum One.
    usdc: env(
      "NEXT_PUBLIC_ARB_ONE_USDC_ADDRESS",
      "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    ),
    // MXNB on Arbitrum One.
    mxnb: env(
      "NEXT_PUBLIC_ARB_ONE_MXNB_ADDRESS",
      "0xF197FFC28c23E0309B5559e7a166f2c6164C80aA",
    ) as Hex | undefined,
  },
  // ── Base mainnet (8453) — the Base App build (NEXT_PUBLIC_ACTIVE_CHAIN=base) ─
  // v4 audit-hardened deploy (2026-06-03, commit d17e039). Literals are the
  // documented source of truth from mitanda-contracts/deployments/base-mainnet.md
  // (cross-checked against deployments/8453.json). Each can still be overridden
  // per-chain via the NEXT_PUBLIC_BASE_* env vars.
  [base.id]: {
    manager: env(
      "NEXT_PUBLIC_BASE_MANAGER_ADDRESS",
      "0x74b6Fc121A40C1A3282af6Bd78074AC3C2a32814",
    ),
    tandaImpl: env(
      "NEXT_PUBLIC_BASE_TANDA_IMPL_ADDRESS",
      "0x7Ee43871c368901652F9b15A2ed28603Bc7A0bB9",
    ),
    passNft: env(
      "NEXT_PUBLIC_BASE_PASS_NFT_ADDRESS",
      "0xe9A5c185F5ab2A9434a880C92DB8A51014C75e5f",
    ),
    receiptNft: env(
      "NEXT_PUBLIC_BASE_RECEIPT_NFT_ADDRESS",
      "0x0dDb8bC0bD88d7933Dc4B54618768156a3558443",
    ),
    completionNft: env(
      "NEXT_PUBLIC_BASE_COMPLETION_NFT_ADDRESS",
      "0xCF006fe8E86E7Fd92A7fD2f9E0A64dc4761AfAB3",
    ),
    // Circle-native USDC on Base mainnet (well-known; override only if needed).
    usdc: env(
      "NEXT_PUBLIC_BASE_USDC_ADDRESS",
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    ),
    // MXNB is not natively deployed on Base — leave undefined unless bridged.
    mxnb: (process.env.NEXT_PUBLIC_BASE_MXNB_ADDRESS as Hex | undefined) ||
      undefined,
  },
  // ── Arbitrum Sepolia (testnet) ────────────────────────────────────────────
  // v4 redeploy (audit hardening: NFT mints use _mint — no onERC721Received
  // callback in join/payout/completion; markDefaulter is nonReentrant).
  [arbitrumSepolia.id]: {
    // Singleton orchestrator — create tandas, registry, token allowlist.
    manager: env(
      "NEXT_PUBLIC_ARB_MANAGER_ADDRESS",
      "0x6887437CC0A7501D67e803F70445d29F27496bCf",
    ),
    // EIP-1167 implementation that every Tanda clone delegates to.
    tandaImpl: env(
      "NEXT_PUBLIC_ARB_TANDA_IMPL_ADDRESS",
      "0xb9691Be9a1682f5e2487d4f35A299077dBC725F8",
    ),
    // Soulbound membership pass (one per participant per tanda).
    passNft: env(
      "NEXT_PUBLIC_ARB_PASS_NFT_ADDRESS",
      "0x0e05c0568E59733F0184a54b118B35AAB5dae6c5",
    ),
    // Transferable per-payout receipt (sponsored, frozen-at-mint metadata).
    receiptNft: env(
      "NEXT_PUBLIC_ARB_RECEIPT_NFT_ADDRESS",
      "0xfA9C299b9Ff7Ef737D862c9dd88a5eC32Af765c5",
    ),
    // Soulbound completion badge (reputation).
    completionNft: env(
      "NEXT_PUBLIC_ARB_COMPLETION_NFT_ADDRESS",
      "0xb9f70d99b199Be0aE03482A421E6Da37626248b8",
    ),
    // Circle USDC on Arbitrum Sepolia — allowlisted contribution token.
    usdc: env(
      "NEXT_PUBLIC_ARB_USDC_ADDRESS",
      "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    ),
    // Mock MXNB (6 decimals, open mint) — allowlisted test stand-in for the
    // real MXNB, which isn't deployed on Arbitrum Sepolia.
    mxnb: env(
      "NEXT_PUBLIC_ARB_MXNB_ADDRESS",
      "0xD55c72B7fF4777D382Bd69b9B27Cc1da799d119d",
    ) as Hex | undefined,
  },
  // ── Base Sepolia (testnet) ────────────────────────────────────────────────
  [baseSepolia.id]: {
    // v4 audit-hardened redeploy (rehearsal for Base mainnet).
    manager: env(
      "NEXT_PUBLIC_MANAGER_ADDRESS",
      "0x95c0CC4a57BFF8e0A258f6a40957b9D3528290A4",
    ),
    tandaImpl: env(
      "NEXT_PUBLIC_TANDA_IMPL_ADDRESS",
      "0xcd9954a410c6fa08886D70578d79BB69268F2f09",
    ),
    passNft: env(
      "NEXT_PUBLIC_PASS_NFT_ADDRESS",
      "0x04795Cb38871b7a9055d26b949f93Df76b16f73c",
    ),
    receiptNft: env(
      "NEXT_PUBLIC_RECEIPT_NFT_ADDRESS",
      "0xe28F0b1Af21C1de8c2833655720B15e589bD6458",
    ),
    completionNft: env(
      "NEXT_PUBLIC_COMPLETION_NFT_ADDRESS",
      "0x08045e9A58CE56c33404dF499885b40D994c12bd",
    ),
    // Circle USDC on Base Sepolia.
    usdc: env(
      "NEXT_PUBLIC_USDC_ADDRESS",
      "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    ),
    // No MXNB on Base Sepolia.
    mxnb: undefined as Hex | undefined,
  },
} as const;

/**
 * The chain the app reads/writes against — chosen at build time by
 * NEXT_PUBLIC_ACTIVE_CHAIN (lib/app-mode.ts). Default (web app) is Arbitrum One;
 * the Base App build resolves to Base mainnet (or Base Sepolia for the rehearsal
 * build). Every consumer reads from here, so this one switch repoints the app.
 */
export const activeChain =
  APP_MODE === "base"
    ? base
    : APP_MODE === "baseSepolia"
      ? baseSepolia
      : arbitrum;
export const DEFAULT_CHAIN_ID = activeChain.id;

export type MitandaAddresses = (typeof addresses)[typeof DEFAULT_CHAIN_ID];
