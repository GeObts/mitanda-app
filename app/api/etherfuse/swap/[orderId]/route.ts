import { getSwapUpdate } from "@/lib/server/etherfuse-swap-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/etherfuse/swap/{orderId} — poll for the latest swap_updated payload
// received from the Etherfuse webhook. Returns 204 until the first update lands.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const update = getSwapUpdate(orderId);
  if (!update) {
    // Nothing yet — the webhook hasn't fired (or can't reach us locally).
    return new Response(null, { status: 204 });
  }
  return Response.json(update);
}
