import { APP_URL } from "@/lib/app-mode";

/**
 * Serves `/.well-known/farcaster.json`.
 *
 * As of April 2026 the Base App registers apps via base.dev (not this manifest),
 * so this file is OPTIONAL for the Base App itself. It is still read by Farcaster
 * clients (Warpcast et al.) when your URL is cast, so keeping it lets MiTanda
 * cross-post as a launchable mini app there too — a free extra discovery channel.
 *
 * The `accountAssociation` proves your domain↔account link. Generate it from
 * base.dev (or the Farcaster manifest tool) and paste the three values into the
 * deployment env (FARCASTER_HEADER / FARCASTER_PAYLOAD / FARCASTER_SIGNATURE).
 * Without them the manifest still serves, just unverified.
 */
export function GET(req: Request): Response {
  const origin = APP_URL || new URL(req.url).origin;

  const header = process.env.FARCASTER_HEADER;
  const payload = process.env.FARCASTER_PAYLOAD;
  const signature = process.env.FARCASTER_SIGNATURE;

  const manifest: Record<string, unknown> = {
    miniapp: {
      version: "1",
      name: "MiTanda",
      subtitle: "Rotating savings, protected by code",
      description:
        "Save together with people you trust. Everyone chips in each round, " +
        "and each round one member receives the whole pot — held and paid out " +
        "safely onchain. Works with digital pesos (MXNB) and dollars (USDC).",
      iconUrl: `${origin}/mitanda-logo.png`,
      homeUrl: origin,
      imageUrl: `${origin}/mitanda-logo.png`,
      splashImageUrl: `${origin}/mitanda-logo.png`,
      splashBackgroundColor: "#0000ff",
      primaryCategory: "finance",
      tags: ["savings", "tanda", "defi", "usdc", "stablecoin"],
    },
  };

  if (header && payload && signature) {
    manifest.accountAssociation = { header, payload, signature };
  }

  return Response.json(manifest, {
    headers: { "cache-control": "public, max-age=600" },
  });
}
