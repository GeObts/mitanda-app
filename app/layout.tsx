import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "./providers";
import { APP_URL } from "@/lib/app-mode";

const TITLE = "MiTanda — The tanda you trust, now protected by code";
const DESCRIPTION =
  "Save together with people you trust. Everyone chips in each round, and each round one member receives the whole pot — held and paid out safely by code. Works with digital pesos (MXNB) and dollars (USDC).";

// Image shared in social/Base App previews. Swap /mitanda-logo.png for a purpose
// -built 1200×630 /og.png (see docs/BASE_APP.md) when you have one.
const OG_IMAGE = "/mitanda-logo.png";
const SPLASH_IMAGE = "/mitanda-logo.png";

/**
 * Base App / Farcaster embed. When this URL is shared in the Base App social
 * feed, these meta tags make it render as a launchable app card instead of a
 * plain link. Requires absolute URLs, so we only emit it when NEXT_PUBLIC_APP_URL
 * is set for the deployment. We emit both the current `fc:miniapp` tag and the
 * legacy `fc:frame` alias for maximum client compatibility.
 */
function embedTags(): Record<string, string> {
  if (!APP_URL) return {};
  const embed = JSON.stringify({
    version: "1",
    imageUrl: `${APP_URL}${OG_IMAGE}`,
    button: {
      title: "Open Mi Tanda",
      action: {
        type: "launch_miniapp",
        url: APP_URL,
        name: "Mi Tanda",
        splashImageUrl: `${APP_URL}${SPLASH_IMAGE}`,
        splashBackgroundColor: "#0000ff",
      },
    },
  });
  return { "fc:miniapp": embed, "fc:frame": embed };
}

export const metadata: Metadata = {
  metadataBase: APP_URL ? new URL(APP_URL) : undefined,
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Mi Tanda",
    images: [{ url: OG_IMAGE, width: 512, height: 512, alt: "Mi Tanda" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  other: embedTags(),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Apply the saved (or system) theme before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
