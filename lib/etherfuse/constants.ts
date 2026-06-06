// Etherfuse integration constants (shared client + server).
//
// These are NOT secrets — just public identifiers and config. The API key lives
// in ETHERFUSE_SANDBOX_API_KEY (server-only, see client.ts) and is never imported
// here so this module is safe to use from client components.

/** Blockchain we operate on for the v1 demo (Etherfuse sandbox is Solana devnet). */
export const ETHERFUSE_CHAIN = "solana" as const;

/** Solana cluster the sandbox bonds live on. Override via NEXT_PUBLIC_SOLANA_RPC_URL. */
export const SOLANA_CLUSTER = "devnet" as const;

/**
 * Solana asset identifiers for the swap demo.
 *
 * IMPORTANT: on Solana the Etherfuse asset `identifier` is the BARE mint address
 * — NOT the Stellar-style `CODE:ISSUER`. Verified live against
 * GET /ramp/assets?blockchain=solana (2026-06-05). The /ramp/assets endpoint is
 * intermittently slow (504s), so we bake the verified mints here and fall back to
 * the live lookup only if needed.
 */
export const SOLANA_ASSETS = {
  /** USDC (Etherfuse Devnet) — the stablecoin the insurance pool holds. */
  USDC: "BXTou3CvPxpFVAJvzvEZcAnRLGCHqT1LHKsFTSQft7s",
  /** CETES — Mexican treasury-bill stablebond. The yield destination. */
  CETES: "AvvetPGuuB5FD5m86fpw3LtDKyQoUFT1mG9WarNQLW4q",
} as const;

/** Bond symbol used by the public /lookup/bonds/cost/{identifier} rate endpoint. */
export const CETES_SYMBOL = "CETES" as const;

/** Quotes expire 2 minutes after creation (per Etherfuse docs). */
export const QUOTE_TTL_MS = 2 * 60 * 1000;
