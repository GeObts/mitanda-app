// Deployed contract addresses for Mi Tanda, keyed by chain.
//
// Source of truth:
//   - Arbitrum One    (42161):  mitanda-contracts/deployments/arbitrum-one-mainnet.md  ← ACTIVE (live)
//   - Arbitrum Sepolia (421614): mitanda-contracts/deployments/421614.json  (testnet)
//   - Base Sepolia    (84532):  mitanda-contracts/deployments/84532.json     (testnet)
// These are public addresses (not secrets), so they're committed as literals.
// Each chain has its own NEXT_PUBLIC_* override prefix so a stale override for
// one chain can't hijack the active chain.
import { arbitrum, arbitrumSepolia, baseSepolia } from "viem/chains";

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
  // ── Base Sepolia (legacy / fallback) ──────────────────────────────────────
  [baseSepolia.id]: {
    // v2 redeploy (SignatureChecker invites for smart-account creators).
    manager: env(
      "NEXT_PUBLIC_MANAGER_ADDRESS",
      "0x606f71bd7Fded64E9964dE2DcEDEC0f9Ed8dBe72",
    ),
    tandaImpl: env(
      "NEXT_PUBLIC_TANDA_IMPL_ADDRESS",
      "0x0a9844cF5646AF3FEb4EbCD9743FdB743D17Cf16",
    ),
    passNft: env(
      "NEXT_PUBLIC_PASS_NFT_ADDRESS",
      "0xfBC3BC48e7d07D18cE60A68c228C87312703338e",
    ),
    receiptNft: env(
      "NEXT_PUBLIC_RECEIPT_NFT_ADDRESS",
      "0xcd35759C3181b5316434e803bFbCE0942Ed8683C",
    ),
    completionNft: env(
      "NEXT_PUBLIC_COMPLETION_NFT_ADDRESS",
      "0x9aa463d8623F40aE6be5a17C391bE9623685Ca30",
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

/** The chain the app reads/writes against. Switch this to repoint the app. */
export const activeChain = arbitrum;
export const DEFAULT_CHAIN_ID = activeChain.id;

export type MitandaAddresses = (typeof addresses)[typeof DEFAULT_CHAIN_ID];
