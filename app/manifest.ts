import type { MetadataRoute } from "next";

/**
 * Web App Manifest — makes the app installable and is what PWABuilder / the
 * Trusted Web Activity (Google Play) build reads. Next serves this at
 * `/manifest.webmanifest` and auto-injects `<link rel="manifest">`.
 *
 * Relative `start_url`/`scope` + icon paths resolve against whatever domain
 * serves it, so this works on the Vercel URL and the custom domain unchanged.
 * theme/background colors are reasonable defaults — tweak to match the final
 * brand once the redesign settles.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mi Tanda",
    short_name: "Mi Tanda",
    description:
      "Save together. On-chain rotating savings circles (tandas) — create or join a circle, pay each cycle, and receive your payout.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0000ff",
    categories: ["finance"],
    icons: [
      // 512 source (Play listing icon + adaptive icon source for PWABuilder).
      { src: "/mitanda-logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/mitanda-logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.png", sizes: "128x128", type: "image/png", purpose: "any" },
    ],
  };
}
