// Etherfuse API client — SERVER-ONLY.
//
// This module reads ETHERFUSE_SANDBOX_API_KEY, a secret. It must only ever be
// imported from server code (route handlers under app/api/etherfuse/*). It has no
// "use client" and no NEXT_PUBLIC_ env reads, so it will never be bundled into the
// browser as long as it isn't imported from a client component. (We can't rely on
// the `server-only` package here — it isn't installed in this project.)
//
// Auth: Etherfuse uses `Authorization: <key>` with NO `Bearer` prefix. Verified
// against GET /ramp/me (2026-06-05).
//
// What's wired (all verified live against the sandbox):
//   • getOrgIdentity()      GET  /ramp/me                       — key smoke test
//   • getCetesRate()        GET  /lookup/bonds/cost/CETES       — live APY (public)
//   • getStablebonds()      GET  /lookup/stablebonds            — bond list (public)
//   • getAssets()           GET  /ramp/assets                   — asset identifiers
//   • getSwapQuote()        POST /ramp/quote (type: swap)       — live pricing
//   • initiateSwap()        POST /ramp/swap                     — async (webhook)
//   • getOrder()            GET  /ramp/order/{id}               — order status

import { randomUUID } from "node:crypto";
import { ETHERFUSE_CHAIN, SOLANA_ASSETS } from "./constants";

const DEFAULT_BASE_URL = "https://api.sand.etherfuse.com";

function getConfig() {
  const apiKey = process.env.ETHERFUSE_SANDBOX_API_KEY;
  const baseUrl = process.env.ETHERFUSE_SANDBOX_BASE_URL || DEFAULT_BASE_URL;
  if (!apiKey) {
    throw new EtherfuseConfigError(
      "ETHERFUSE_SANDBOX_API_KEY is not set. Add it to .env.local to enable Etherfuse calls.",
    );
  }
  return { apiKey, baseUrl };
}

/**
 * Derive the Etherfuse customer/org id from the API key. The sandbox key is
 * `api_sand:<secret>:<customerId>` — the org id is the 3rd colon-segment. Verified:
 * this equals the `id` returned by GET /ramp/me. Never hardcode it — derive here.
 */
export function deriveCustomerId(apiKey: string): string {
  const parts = apiKey.split(":");
  const id = parts[2];
  if (!id) {
    throw new EtherfuseConfigError(
      "Malformed ETHERFUSE_SANDBOX_API_KEY — expected `api_sand:<secret>:<customerId>`.",
    );
  }
  return id;
}

/** Thrown when the key/base URL is missing or malformed (→ HTTP 500, not 4xx). */
export class EtherfuseConfigError extends Error {}

/** Thrown when the Etherfuse API returns a non-2xx response. Carries status + body. */
export class EtherfuseApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { apiKey, baseUrl } = getConfig();
  const { method = "GET", body, auth = true } = init;

  const headers: Record<string, string> = {};
  if (auth) headers.Authorization = apiKey; // bare key — NO "Bearer" prefix
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      // Etherfuse's gateway can be slow (esp. /ramp/assets). Don't let Next cache
      // these — pricing and order state are always live.
      cache: "no-store",
    });
  } catch (e) {
    throw new EtherfuseApiError(0, null, `Network error calling ${path}: ${String(e)}`);
  }

  const text = await res.text();
  const parsed = text ? safeJson(text) : null;

  if (!res.ok) {
    const msg =
      (parsed && typeof parsed === "object" && "message" in parsed
        ? String((parsed as { message: unknown }).message)
        : null) ?? `Etherfuse ${method} ${path} failed with ${res.status}`;
    throw new EtherfuseApiError(res.status, parsed ?? text, msg);
  }

  return parsed as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/* ─────────────────────────────────────────────────────────────── types ── */

export interface OrgIdentity {
  id: string;
  displayName: string;
  approvedAt: string | null;
  partnerFeeDefaultBps: number;
}

/** Subset of GET /lookup/bonds/cost/{identifier} we use for the yield rate. */
export interface BondCost {
  bond_symbol: string;
  currency: string;
  /** Current interest rate in basis points (e.g. 313 = 3.13% APY). */
  current_basis_points: number;
  bond_cost_in_fiat: string;
  bond_cost_in_usd: string;
  current_time: string;
}

export interface RampableAsset {
  symbol: string;
  identifier: string;
  name: string;
  currency: string;
  balance: string | null;
  image: string | null;
}

export type QuoteType = "onramp" | "offramp" | "swap";

export interface SwapQuoteParams {
  /** Source asset identifier (Solana mint). Defaults to USDC. */
  sourceAsset?: string;
  /** Target asset identifier (Solana mint). Defaults to CETES. */
  targetAsset?: string;
  /** Decimal string amount of the source asset, e.g. "100". */
  sourceAmount: string;
  /** Optional destination wallet (defaults to the signer at swap time). */
  walletAddress?: string;
}

export interface QuoteResponse {
  quoteId: string;
  blockchain: string;
  quoteAssets: { type: QuoteType; sourceAsset: string; targetAsset: string };
  sourceAmount: string;
  destinationAmount: string;
  /** Fee-inclusive rate: sourceAmount × exchangeRate = destinationAmount. */
  exchangeRate: string;
  etherfuseMidMarketRate: string | null;
  feeBps: string | null;
  feeAmount: string | null;
  destinationAmountAfterFee: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface InitiateSwapParams {
  /** Quote id from a prior getSwapQuote() call (still unexpired). */
  quoteId: string;
  /** The connected Solana wallet that will sign and fund the swap. */
  publicKey: string;
  /** Optional target wallet; defaults to publicKey. */
  targetWallet?: string;
}

export interface InitiateSwapResult {
  /** Client-generated order id — correlate with the swap_updated webhook. */
  orderId: string;
}

/* ──────────────────────────────────────────────────────────── methods ── */

/** GET /ramp/me — verifies which org the key belongs to (key smoke test). */
export const getOrgIdentity = () => request<OrgIdentity>("/ramp/me");

// Public Etherfuse lookup base. The SANDBOX (`api.sand.*`) reports a fixed/stale
// CETES rate of 313 bps (3.13%) — it just mirrors the devnet mint's interest-bearing
// extension (`currentRate: 313`). PRODUCTION's public lookup returns the real, live
// rate (~558 bps = 5.58% as of 2026-06-06), matches devnet.etherfuse.com, and needs
// NO API key. We source only the *displayed yield rate* from production; the swap +
// quote stay on the sandbox. Override with ETHERFUSE_PUBLIC_BASE_URL.
const PUBLIC_LOOKUP_BASE_URL =
  process.env.ETHERFUSE_PUBLIC_BASE_URL || "https://api.etherfuse.com";

/**
 * GET /lookup/bonds/cost/CETES — live bond pricing + interest rate.
 * Public (no key), read from PRODUCTION (see PUBLIC_LOOKUP_BASE_URL above), so it
 * reflects the true live APY rather than the sandbox's stale 3.13%.
 */
export async function getCetesRate(): Promise<BondCost> {
  let res: Response;
  try {
    res = await fetch(`${PUBLIC_LOOKUP_BASE_URL}/lookup/bonds/cost/CETES`, {
      cache: "no-store",
    });
  } catch (e) {
    throw new EtherfuseApiError(0, null, `Network error fetching CETES rate: ${String(e)}`);
  }
  if (!res.ok) {
    throw new EtherfuseApiError(
      res.status,
      await res.text().catch(() => null),
      `Etherfuse CETES rate lookup failed with ${res.status}`,
    );
  }
  return (await res.json()) as BondCost;
}

/** GET /lookup/stablebonds — full stablebond list (price, supply per chain). Public. */
export const getStablebonds = () =>
  request<{ stablebonds: unknown[] }>("/lookup/stablebonds", { auth: false });

/** GET /ramp/assets — rampable asset identifiers for a wallet on a chain. */
export const getAssets = (wallet: string, currency = "mxn") =>
  request<{ assets: RampableAsset[] }>(
    `/ramp/assets?blockchain=${ETHERFUSE_CHAIN}&currency=${currency}&wallet=${wallet}`,
  );

/**
 * POST /ramp/quote with quoteAssets.type = "swap". Returns live, fee-inclusive
 * pricing for converting USDC → CETES on Solana. quoteId is client-generated and
 * echoed back; the quote expires in ~2 minutes.
 */
export function getSwapQuote(params: SwapQuoteParams): Promise<QuoteResponse> {
  const { apiKey } = getConfig();
  const quoteId = randomUUID();
  return request<QuoteResponse>("/ramp/quote", {
    method: "POST",
    body: {
      quoteId,
      customerId: deriveCustomerId(apiKey),
      blockchain: ETHERFUSE_CHAIN,
      quoteAssets: {
        type: "swap" as const,
        sourceAsset: params.sourceAsset ?? SOLANA_ASSETS.USDC,
        targetAsset: params.targetAsset ?? SOLANA_ASSETS.CETES,
      },
      sourceAmount: params.sourceAmount,
      ...(params.walletAddress ? { walletAddress: params.walletAddress } : {}),
    },
  });
}

/**
 * POST /ramp/swap — initiates the swap for a quote. ASYNC: returns an empty 200.
 * The signable Solana transaction arrives later via the `swap_updated` webhook
 * (created → funded → completed). We generate the orderId so the caller can
 * correlate the webhook payloads to this swap.
 */
export async function initiateSwap(
  params: InitiateSwapParams,
): Promise<InitiateSwapResult> {
  const orderId = randomUUID();
  await request<unknown>("/ramp/swap", {
    method: "POST",
    body: {
      orderId,
      quoteId: params.quoteId,
      publicKey: params.publicKey,
      blockchain: ETHERFUSE_CHAIN,
      ...(params.targetWallet ? { targetWallet: params.targetWallet } : {}),
    },
  });
  return { orderId };
}

/** GET /ramp/order/{id} — poll an order's status (fallback to webhooks). */
export const getOrder = (orderId: string) =>
  request<unknown>(`/ramp/order/${orderId}`);
