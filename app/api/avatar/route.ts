import { isAddress } from "viem";

import { getAvatarStore } from "@/lib/server/avatar-store";
import { verifyOwnership } from "@/lib/server/chain";
import { avatarMessage } from "@/lib/request-messages";
import { sha256Hex } from "@/lib/avatar-hash";
import { bad, nowSec } from "@/lib/server/respond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cap the stored image. Client resizes to 256² JPEG (~10–40KB); 256KB of
// base64 is a generous ceiling that still keeps the row small.
const MAX_DATA_URL = 256 * 1024;

// GET /api/avatar?address=0x…            → { url: string | null }
// GET /api/avatar?addresses=0x..,0x..    → { urls: { [addr]: string } }
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const store = getAvatarStore();

  const many = params.get("addresses");
  if (many) {
    const addrs = many
      .split(",")
      .map((a) => a.trim())
      .filter((a) => isAddress(a))
      .slice(0, 50);
    const urls = await store.getMany(addrs);
    return Response.json({ urls });
  }

  const address = params.get("address");
  if (!address || !isAddress(address)) return bad("Missing or invalid address");
  const rec = await store.get(address);
  return Response.json({ url: rec?.dataUrl ?? null });
}

// POST /api/avatar — set the caller's own profile photo.
// Body: { address, dataUrl, signature }
// Auth: an ownership signature over avatarMessage(address, sha256(dataUrl)),
// verified ON-CHAIN (works for EOA + smart-contract wallets), so nobody can set
// another wallet's photo, and a captured signature can't swap the image.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return bad("Invalid JSON");
  const { address, dataUrl, signature } = body;

  if (!isAddress(address) || typeof signature !== "string") {
    return bad("Missing or invalid fields");
  }
  if (
    typeof dataUrl !== "string" ||
    !/^data:image\/(png|jpeg|webp);base64,/.test(dataUrl)
  ) {
    return bad("Image must be a PNG, JPEG, or WebP data URL");
  }
  if (dataUrl.length > MAX_DATA_URL) {
    return bad("Image is too large", 413);
  }

  const photoHash = await sha256Hex(dataUrl);
  const message = avatarMessage(address, photoHash);
  const ok = await verifyOwnership(
    address,
    message,
    signature as `0x${string}`,
  );
  if (!ok) return bad("Signature does not match wallet", 401);

  await getAvatarStore().put({
    address,
    dataUrl,
    updatedAt: nowSec(),
  });
  return Response.json({ ok: true });
}
