import { bad } from "@/lib/server/respond";
import {
  getSwapQuote,
  EtherfuseApiError,
  EtherfuseConfigError,
} from "@/lib/etherfuse/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/etherfuse/quote — get a live USDC→CETES swap quote.
// Body: { sourceAmount: string, sourceAsset?, targetAsset?, walletAddress? }
// The API key stays server-side; the browser only sees the quote.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.sourceAmount !== "string") {
    return bad("Missing or invalid sourceAmount");
  }
  if (!/^\d+(\.\d+)?$/.test(body.sourceAmount) || Number(body.sourceAmount) <= 0) {
    return bad("sourceAmount must be a positive decimal string");
  }

  try {
    const quote = await getSwapQuote({
      sourceAmount: body.sourceAmount,
      sourceAsset: typeof body.sourceAsset === "string" ? body.sourceAsset : undefined,
      targetAsset: typeof body.targetAsset === "string" ? body.targetAsset : undefined,
      walletAddress:
        typeof body.walletAddress === "string" ? body.walletAddress : undefined,
    });
    return Response.json(quote);
  } catch (e) {
    if (e instanceof EtherfuseConfigError) {
      return bad("Etherfuse is not configured on the server", 500);
    }
    if (e instanceof EtherfuseApiError) {
      return bad(e.message, e.status || 502);
    }
    return bad("Quote failed", 500);
  }
}
