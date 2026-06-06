// Single build-time switch that selects which chain THIS deployment targets and,
// by extension, which wallet/auth stack mounts. Set via NEXT_PUBLIC_ACTIVE_CHAIN:
//
//   (unset) | "arbitrum"  → Arbitrum One + Privy login   (the main web app — DEFAULT)
//   "base"                → Base mainnet + Base App wallet (the Base App build)
//   "baseSepolia"         → Base Sepolia rehearsal of the Base App build
//
// NEXT_PUBLIC_* is inlined at build time, so this resolves identically on the
// server and in the browser — no hydration drift, and the whole app (every file
// that imports DEFAULT_CHAIN_ID/activeChain from lib/contracts) follows it with
// no per-file changes. Ship two builds from one codebase: the live web app keeps
// its default behavior, and a separate deploy with NEXT_PUBLIC_ACTIVE_CHAIN=base
// is the URL you register in the Base App.
export type AppMode = "arbitrum" | "base" | "baseSepolia";

const raw = (process.env.NEXT_PUBLIC_ACTIVE_CHAIN ?? "arbitrum")
  .trim()
  .toLowerCase();

export const APP_MODE: AppMode =
  raw === "base"
    ? "base"
    : raw === "basesepolia" || raw === "base-sepolia"
      ? "baseSepolia"
      : "arbitrum";

/**
 * True for any Base App build (Base mainnet or its Sepolia rehearsal). Drives
 * the wallet stack: when true we mount the Base Account / mini-app wallet and
 * skip Privy; when false the app keeps the existing Privy login.
 */
export const IS_BASE_APP = APP_MODE === "base" || APP_MODE === "baseSepolia";

/**
 * Precomputed ERC-8021 calldata suffix from your base.dev Builder Code. Appended
 * to every onchain write so Base attributes the volume to you (Builder Rewards).
 * Empty string = attribution disabled — a safe no-op. See docs/BASE_APP.md for
 * how to obtain this value.
 */
export const BUILDER_DATA_SUFFIX = ((): `0x${string}` | undefined => {
  const v = (process.env.NEXT_PUBLIC_BUILDER_DATA_SUFFIX ?? "").trim();
  return v.startsWith("0x") && v.length > 2 ? (v as `0x${string}`) : undefined;
})();

/**
 * Public origin of THIS deployment, no trailing slash (e.g.
 * https://base.mitanda.online). Used to build absolute URLs for embed/OG metadata
 * and the Farcaster manifest. Falls back to a relative-safe empty string.
 */
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "")
  .trim()
  .replace(/\/+$/, "");
