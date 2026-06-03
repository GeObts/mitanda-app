import { isAddress } from "viem";

import { getStore } from "@/lib/server/store";
import { readTanda, verifyOwnership } from "@/lib/server/chain";
import { bad, nowSec } from "@/lib/server/respond";
import { manageMessage } from "@/lib/request-messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/requests/decline — creator declines a pending request.
// Body: { tanda, requester, sig }  (sig over manageMessage(tanda))
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return bad("Invalid JSON");
  const { tanda, requester, sig } = body;
  if (!isAddress(tanda) || !isAddress(requester) || typeof sig !== "string") {
    return bad("Missing or invalid fields");
  }

  let chain;
  try {
    chain = await readTanda(tanda);
  } catch {
    return bad("Not a recognized tanda", 400);
  }

  // On-chain proof: signer must be the tanda creator (EOA or smart wallet).
  const ok = await verifyOwnership(
    chain.creator,
    manageMessage(tanda),
    sig as `0x${string}`,
  );
  if (!ok) return bad("Only the tanda creator can decline requests", 403);

  const store = getStore();
  const existing = await store.get(tanda, requester);
  if (!existing) return Response.json({ status: "none" });
  if (existing.status === "approved") {
    return Response.json({ status: "approved" });
  }
  await store.put({ ...existing, status: "declined", approvedAt: nowSec() });
  return Response.json({ status: "declined" });
}
