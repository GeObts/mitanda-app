import { putSwapUpdate, type SwapUpdate } from "@/lib/server/etherfuse-swap-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/etherfuse/webhook — receiver for Etherfuse `swap_updated` events.
//
// /ramp/swap is async: Etherfuse posts SwapResponse payloads here as the swap
// moves created → funded → completed, including `sendTransaction` (the Solana tx
// the user must sign). We stash each payload so the client can poll for it.
//
// LOCAL DEV: Etherfuse can't reach localhost. Expose this route via a tunnel
// (e.g. `cloudflared tunnel --url http://localhost:3000`) and register the public
// URL with POST /ramp/webhook for the `swap_updated` event. See docs/ETHERFUSE.md.
//
// PRODUCTION TODO: verify the webhook signature before trusting the payload, and
// persist to a durable store (D1/KV) instead of process memory.
export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload.orderId !== "string") {
    return Response.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const update: Omit<SwapUpdate, "receivedAt"> = {
    orderId: payload.orderId,
    customerId: payload.customerId,
    sendTransaction: payload.sendTransaction,
    sendTransactionHash: payload.sendTransactionHash,
    receiveTransactionHash: payload.receiveTransactionHash ?? null,
    status: payload.status ?? "created",
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  };
  putSwapUpdate(update);

  // Etherfuse expects a 2xx ack.
  return Response.json({ ok: true });
}
