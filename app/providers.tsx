"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import {
  WagmiProvider as BaseWagmiProvider,
  createConfig as createWagmiConfig,
  useAccount,
  useConnect,
  http,
  createStorage,
  cookieStorage,
} from "wagmi";
import { baseAccount, injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Chain } from "viem";
import {
  arbitrum as arbitrumOneBase,
  arbitrumSepolia as arbitrumSepoliaBase,
  base as baseMainnetBase,
  baseSepolia,
  baseSepolia as baseSepoliaBase,
} from "viem/chains";

import { LanguageProvider } from "@/lib/i18n";
import { APP_MODE, IS_BASE_APP } from "@/lib/app-mode";

// ── Auth mode ───────────────────────────────────────────────────────────────
// One signal the whole UI switches on: which wallet stack is mounted.
//   "privy" — the web app's Privy login (App ID present)
//   "base"  — the Base App build's Base Account / mini-app wallet
//   "none"  — no auth available (Privy App ID missing on the web build)
export type AuthMode = "privy" | "base" | "none";
const AuthModeContext = createContext<AuthMode>("none");
export const useAuthMode = () => useContext(AuthModeContext);
/** Back-compat helper: true only when the Privy login stack is mounted. */
export const usePrivyConfigured = () => useContext(AuthModeContext) === "privy";

// ── Web app (Arbitrum + Privy) wagmi config — unchanged ───────────────────────
// Reliable Arbitrum Sepolia RPC. The public `sepolia-rollup.arbitrum.io`
// endpoint rate-limits under the app's multicall reads and stalls Privy's
// embedded-wallet creation ("Couldn't reach the network" + login hang), so we
// default to a reliable public node and allow an override (e.g. Alchemy) via
// NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL.
const ARB_SEPOLIA_RPC =
  process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL ||
  process.env.NEXT_PUBLIC_ARB_SEPOLIA_RPC_URL || // legacy name, kept for compat
  "https://arbitrum-sepolia-rpc.publicnode.com";

// Arbitrum One (mainnet) RPC — the web app is LIVE here. Override with
// NEXT_PUBLIC_ARBITRUM_RPC_URL (e.g. a dedicated Alchemy endpoint) for
// production multicall load; the public node is fine for light use.
const ARB_ONE_RPC =
  process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc";

// Override the chain's default rpcUrls so BOTH wagmi (reads/writes) AND Privy's
// embedded-wallet provider talk to the reliable endpoint — Privy derives its RPC
// from the chain object, so setting the wagmi transport alone isn't enough.
const arbitrumSepolia: Chain = {
  ...arbitrumSepoliaBase,
  rpcUrls: {
    ...arbitrumSepoliaBase.rpcUrls,
    default: { http: [ARB_SEPOLIA_RPC] },
    public: { http: [ARB_SEPOLIA_RPC] },
  },
};

const arbitrumOne: Chain = {
  ...arbitrumOneBase,
  rpcUrls: {
    ...arbitrumOneBase.rpcUrls,
    default: { http: [ARB_ONE_RPC] },
    public: { http: [ARB_ONE_RPC] },
  },
};

// wagmi config targeting Arbitrum One (42161, active) with the testnets retained
// as secondaries. Privy injects the connected wallet into this config so wagmi
// read/write hooks see the account.
//
// `multiInjectedProviderDiscovery: false` disables EIP-6963 auto-discovery of
// injected wallets (e.g. Leap). Without it, wagmi reconnects to a
// previously-connected injected wallet ~2s after load — INDEPENDENT of Privy
// auth — which would flip the dashboard "connected" even though the user never
// signed in through Privy. The dashboard must reflect Privy sign-in only.
export const wagmiConfig = createConfig({
  chains: [arbitrumOne, arbitrumSepolia, baseSepolia],
  multiInjectedProviderDiscovery: false,
  transports: {
    [arbitrumOne.id]: http(ARB_ONE_RPC),
    [arbitrumSepolia.id]: http(ARB_SEPOLIA_RPC),
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
    ),
  },
});

// ── Base App (Base mainnet / Base Sepolia) wagmi config ───────────────────────
// Built only for the Base App build. Per Base's 2026 "standard web app" model,
// the Base Account connector is the first-party path BOTH inside the Base App
// and in a normal browser — so we don't use the legacy Farcaster mini-app
// connector (which also peers on wagmi 2 and conflicts with our wagmi 3).
// Connectors, in priority order:
//   1. baseAccount() — "Sign in with Base" smart wallet; connects the user's
//      Base Account, including the host wallet when opened inside the Base App.
//   2. injected()    — any other injected wallet (MetaMask, etc.).
const BASE_MAINNET_RPC =
  process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org";
const BASE_SEPOLIA_RPC =
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

const baseAppChain: Chain =
  APP_MODE === "baseSepolia" ? baseSepoliaBase : baseMainnetBase;
const baseAppRpc =
  APP_MODE === "baseSepolia" ? BASE_SEPOLIA_RPC : BASE_MAINNET_RPC;

const baseAppWagmiConfig = IS_BASE_APP
  ? createWagmiConfig({
      chains: [baseAppChain],
      connectors: [baseAccount({ appName: "Mi Tanda" }), injected()],
      transports: { [baseAppChain.id]: http(baseAppRpc) },
      // SSR-safe hydration for the Next.js / OpenNext (Cloudflare) server render.
      ssr: true,
      storage: createStorage({ storage: cookieStorage }),
    })
  : null;

/**
 * Inside the Base App, connect the Base Account up front so the user lands on
 * the connected dashboard without a manual step (they're already signed into a
 * wallet in the Base App, so this is a quick approve / silent). We gate on
 * `sdk.isInMiniApp()` so that opening this same URL in a NORMAL browser does NOT
 * auto-trigger the Base sign-in popup — there we leave the choice to the
 * ConnectButton.
 */
function BaseAutoConnect() {
  const { connect, connectors } = useConnect();
  const { isConnected, status } = useAccount();

  useEffect(() => {
    if (isConnected || status === "connecting" || status === "reconnecting") {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");
        const inApp = await sdk.isInMiniApp();
        if (cancelled || !inApp) return; // normal browser — let the user choose
        const connector =
          connectors.find((c) => c.id === "baseAccount") ?? connectors[0];
        if (connector) connect({ connector });
      } catch {
        // SDK absent or not in a mini-app host — no-op; ConnectButton handles it.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isConnected, status, connect, connectors]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // One QueryClient per app lifetime (kept stable across renders).
  const [queryClient] = useState(() => new QueryClient());

  // ── Base App build: Base Account / mini-app wallet, no Privy ────────────────
  if (IS_BASE_APP) {
    return (
      <LanguageProvider>
        <AuthModeContext.Provider value="base">
          <QueryClientProvider client={queryClient}>
            <BaseWagmiProvider config={baseAppWagmiConfig!}>
              <BaseAutoConnect />
              {children}
            </BaseWagmiProvider>
          </QueryClientProvider>
        </AuthModeContext.Provider>
      </LanguageProvider>
    );
  }

  // ── Web app build: existing Privy flow ──────────────────────────────────────
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  // Graceful degradation: without a Privy App ID we can't mount PrivyProvider
  // (it throws on an empty appId). The app still renders — wagmi reads work
  // against the RPC, and the connect button surfaces the missing config —
  // instead of crashing the whole tree.
  if (!appId) {
    if (typeof window !== "undefined") {
      console.warn(
        "[Mi Tanda] NEXT_PUBLIC_PRIVY_APP_ID is not set — wallet login is disabled. " +
          "Add it to .env.local to enable connecting a wallet.",
      );
    }
    return (
      <LanguageProvider>
        <AuthModeContext.Provider value="none">
          <QueryClientProvider client={queryClient}>
            <BaseWagmiProvider config={wagmiConfig}>
              {children}
            </BaseWagmiProvider>
          </QueryClientProvider>
        </AuthModeContext.Provider>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <AuthModeContext.Provider value="privy">
        <PrivyProvider
          appId={appId}
          config={{
            defaultChain: arbitrumOne,
            supportedChains: [arbitrumOne, arbitrumSepolia, baseSepolia],
            embeddedWallets: {
              ethereum: { createOnLogin: "users-without-wallets" },
            },
            loginMethods: ["wallet", "email", "sms", "google", "twitter", "farcaster"],
            appearance: { theme: "light", accentColor: "#0000ff" },
          }}
        >
          <QueryClientProvider client={queryClient}>
            <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
          </QueryClientProvider>
        </PrivyProvider>
      </AuthModeContext.Provider>
    </LanguageProvider>
  );
}
