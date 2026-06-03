import { isAddress } from "viem";

import { getStore } from "@/lib/server/store";
import { readTanda, verifyOwnership, isSmartAccount } from "@/lib/server/chain";
import { bad, nowSec } from "@/lib/server/respond";
import { ownershipMessage, manageMessage } from "@/lib/request-messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dev = process.env.NODE_ENV !== "production";

// POST /api/requests — a requester submits a pending join request.
// Body: { tanda, requester, signedMessage }
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return bad("Invalid JSON");
  const { tanda, requester, signedMessage } = body;
  if (!isAddress(tanda) || !isAddress(requester) || typeof signedMessage !== "string") {
    return bad("Missing or invalid fields");
  }

  // Verify the requester owns the wallet — on-chain (EOA + ERC-1271/6492 smart
  // accounts), so it works for any Privy wallet type.
  const message = ownershipMessage(tanda, requester);
  const ok = await verifyOwnership(requester, message, signedMessage as `0x${string}`);
  if (dev) {
    console.log("[requests:POST] ownership proof", {
      requester,
      smartAccount: await isSmartAccount(requester).catch(() => "?"),
      message: JSON.stringify(message),
      valid: ok,
    });
  }
  if (!ok) return bad("Signature does not match requester", 401);

  // On-chain sanity: must be a real private, open tanda.
  let chain;
  try {
    chain = await readTanda(tanda);
  } catch {
    return bad("Not a recognized tanda", 400);
  }
  if (chain.privacy !== 1) return bad("This tanda is not private", 400);
  if (chain.state !== 0) return bad("This tanda is no longer open", 400);

  const store = getStore();
  const existing = await store.get(tanda, requester);
  if (existing?.status === "approved") {
    return Response.json({ status: "approved" });
  }
  await store.put({
    tanda,
    requester,
    status: "pending",
    signedMessage,
    createdAt: existing?.createdAt ?? nowSec(),
  });
  return Response.json({ status: "pending" });
}

// GET /api/requests?tanda=… — creator lists pending requests.
// Auth: x-mitanda-sig header (manageMessage signature), verified ON-CHAIN
// against the tanda's creator() — works for EOA + smart-contract wallets.
export async function GET(request: Request) {
  const tanda = new URL(request.url).searchParams.get("tanda");
  if (!tanda || !isAddress(tanda)) return bad("Missing or invalid tanda");

  const sig = request.headers.get("x-mitanda-sig");
  if (!sig) return bad("Missing auth", 401);

  let chain;
  try {
    chain = await readTanda(tanda as `0x${string}`);
  } catch {
    return bad("Not a recognized tanda", 400);
  }

  const message = manageMessage(tanda as `0x${string}`);
  const ok = await verifyOwnership(chain.creator, message, sig as `0x${string}`);
  if (dev) {
    console.log("[requests:GET] creator proof", {
      tanda,
      creator: chain.creator,
      creatorIsSmartAccount: await isSmartAccount(chain.creator).catch(() => "?"),
      message: JSON.stringify(message),
      valid: ok,
    });
  }
  if (!ok) {
    return bad("Only the tanda creator can list requests", 403);
  }

  const pending = await getStore().listPending(tanda);
  return Response.json({
    requests: pending.map((r) => ({
      requester: r.requester,
      createdAt: r.createdAt,
    })),
  });
}
