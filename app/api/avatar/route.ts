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
const MAX_NAME = 40;

// GET /api/avatar?address=0x…            → { url, name }
// GET /api/avatar?addresses=0x..,0x..    → { profiles: { [addr]: { url, name } } }
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const store = getAvatarStore();

  const many = params.get("addresses");
  if (many) {
    const addrs = many
      .split(",")
      .map((a) => a.trim())
      .filter((a) => isAddress(a))
      .slice(0, 60);
    const profiles = await store.getManyProfiles(addrs);
    return Response.json({ profiles });
  }

  const address = params.get("address");
  if (!address || !isAddress(address)) return bad("Missing or invalid address");
  const rec = await store.get(address);
  return Response.json({ url: rec?.dataUrl ?? null, name: rec?.name ?? null });
}

// POST /api/avatar — set the caller's own profile (photo and/or name).
// Body: { address, dataUrl?, name?, signature }
// Auth: ownership signature over avatarMessage(address, sha256(dataUrl|"none"),
// name), verified ON-CHAIN (EOA + smart wallets). Binding the photo hash + name
// means a captured signature can't be replayed to set a different photo/name.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return bad("Invalid JSON");
  const { address, dataUrl, name, signature } = body;

  if (!isAddress(address) || typeof signature !== "string") {
    return bad("Missing or invalid fields");
  }

  let photo: string | null = null;
  if (dataUrl !== undefined && dataUrl !== null) {
    if (
      typeof dataUrl !== "string" ||
      !/^data:image\/(png|jpeg|webp);base64,/.test(dataUrl)
    ) {
      return bad("Image must be a PNG, JPEG, or WebP data URL");
    }
    if (dataUrl.length > MAX_DATA_URL) return bad("Image is too large", 413);
    photo = dataUrl;
  }

  const cleanName = typeof name === "string" ? name.trim().slice(0, MAX_NAME) : "";

  const photoHash = photo ? await sha256Hex(photo) : "none";
  const message = avatarMessage(address, photoHash, cleanName);
  const ok = await verifyOwnership(
    address,
    message,
    signature as `0x${string}`,
  );
  if (!ok) return bad("Signature does not match wallet", 401);

  await getAvatarStore().put({
    address,
    dataUrl: photo,
    name: cleanName || null,
    updatedAt: nowSec(),
  });
  return Response.json({ ok: true });
}
