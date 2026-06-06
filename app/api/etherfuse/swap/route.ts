import { isAddress } from "viem";

import { bad } from "@/lib/server/respond";
import {
  initiateSwap,
  EtherfuseApiError,
  EtherfuseConfigError,
} from "@/lib/etherfuse/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Basic base58 sanity check for a Solana public key (32–44 base58 chars).
const isSolanaPubkey = (s: unknown): s is string =>
  typeof s === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);

// POST /api/etherfuse/swap — initiate a swap for a prior quote.
// Body: { quoteId: string, publicKey: string (Solana), targetWallet? }
// Returns { orderId }. The signable transaction arrives via the swap_updated
// webhook (see /api/etherfuse/webhook) — poll /api/etherfuse/swap/{orderId}.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return bad("Invalid JSON");
  const { quoteId, publicKey, targetWallet } = body;

  if (typeof quoteId !== "string" || quoteId.length < 8) {
    return bad("Missing or invalid quoteId");
  }
  if (!isSolanaPubkey(publicKey)) {
    return bad("Missing or invalid Solana publicKey");
  }
  // targetWallet, if given, may be a Solana pubkey or an EVM address (cross-chain
  // payout target). Accept either; reject obvious garbage.
  if (
    targetWallet !== undefined &&
    !isSolanaPubkey(targetWallet) &&
    !isAddress(targetWallet)
  ) {
    return bad("Invalid targetWallet");
  }

  try {
    const result = await initiateSwap({ quoteId, publicKey, targetWallet });
    return Response.json(result);
  } catch (e) {
    if (e instanceof EtherfuseConfigError) {
      return bad("Etherfuse is not configured on the server", 500);
    }
    if (e instanceof EtherfuseApiError) {
      return bad(e.message, e.status || 502);
    }
    return bad("Swap initiation failed", 500);
  }
}
