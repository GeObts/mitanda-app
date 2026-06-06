// In-memory store for Etherfuse swap progress (SERVER-ONLY, dev/demo).
//
// /ramp/swap is asynchronous: the signable transaction and final status arrive
// via the `swap_updated` webhook, not from the POST response. For the demo we
// stash each webhook payload here keyed by orderId, and the client polls
// GET /api/etherfuse/swap/{orderId} to pick it up.
//
// This is a process-memory Map — fine for local dev / a single server instance.
// Production would persist to D1/KV (the website already has a D1 store pattern)
// and verify the webhook signature. See docs/ETHERFUSE.md.

export interface SwapUpdate {
  orderId: string;
  customerId?: string;
  /** Base64/encoded Solana tx the user must sign and submit (when present). */
  sendTransaction?: string;
  sendTransactionHash?: string;
  receiveTransactionHash?: string | null;
  status: "created" | "funded" | "completed" | "failed";
  createdAt?: string;
  updatedAt?: string;
  /** When we received this update (epoch ms), for staleness checks. */
  receivedAt: number;
}

// Survive Next dev hot-reloads by hanging the Map off globalThis.
const g = globalThis as unknown as { __mitandaSwaps?: Map<string, SwapUpdate> };
const swaps: Map<string, SwapUpdate> = (g.__mitandaSwaps ??= new Map());

export function putSwapUpdate(update: Omit<SwapUpdate, "receivedAt">): void {
  swaps.set(update.orderId, { ...update, receivedAt: Date.now() });
}

export function getSwapUpdate(orderId: string): SwapUpdate | null {
  return swaps.get(orderId) ?? null;
}
