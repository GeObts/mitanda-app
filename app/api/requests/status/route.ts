import { isAddress } from "viem";

import { getStore } from "@/lib/server/store";
import { bad } from "@/lib/server/respond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/requests/status?tanda=…&addr=… — a requester checks their status.
// No auth needed: the approved ticket is invitee-bound (msg.sender must equal
// the invitee on-chain), so exposing it to anyone is harmless.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tanda = url.searchParams.get("tanda");
  const addr = url.searchParams.get("addr");
  if (!tanda || !isAddress(tanda)) return bad("Missing or invalid tanda");
  if (!addr || !isAddress(addr)) return bad("Missing or invalid addr");

  const rec = await getStore().get(tanda, addr);
  if (!rec) return Response.json({ status: "none" });

  if (rec.status === "approved" && rec.ticket && rec.deadline) {
    return Response.json({
      status: "approved",
      deadline: rec.deadline,
      ticket: rec.ticket,
    });
  }
  return Response.json({ status: rec.status });
}
