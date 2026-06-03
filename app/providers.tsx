"use client";

import { createContext, useContext, useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { WagmiProvider as BaseWagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "wagmi";
import type { Chain } from "viem";
import {
  arbitrum as arbitrumOneBase,
  arbitrumSepolia as arbitrumSepoliaBase,
  baseSepolia,
} from "viem/chains";

// Reliable Arbitrum Sepolia RPC. The public `sepolia-rollup.arbitrum.io`
// endpoint rate-limits under the app's multicall reads and stalls Privy's
// embedded-wallet creation ("Couldn't reach the network" + login hang), so we
// default to a reliable public node and allow an override (e.g. Alchemy) via
// NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL.
const ARB_SEPOLIA_RPC =
  process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL ||
  process.env.NEXT_PUBLIC_ARB_SEPOLIA_RPC_URL || // legacy name, kept for compat
  "https://arbitrum-sepolia-rpc.publicnode.com";

// Arbitrum One (mainnet) RPC — the app is LIVE here. Override with
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

// wagmi config targeting Arbitrum Sepolia (421614, active) with Base Sepolia
// (84532) retained as a secondary chain. Active chain is listed first.
// Privy injects the connected wallet into this config so wagmi read/write hooks
// see the account.
//
// `multiInjectedProviderDiscovery: false` disables EIP-6963 auto-discovery of
// injected wallets (e.g. Leap). Without it, wagmi reconnects to a
// previously-connected injected wallet ~2s after load — INDEPENDENT of Privy
// auth — which would flip the dashboard "connected" even though the user never
// signed in through Privy. The dashboard must reflect Privy sign-in only.
export const wagmiConfig = createConfig({
  // Active chain (Arbitrum One) is listed first; testnets kept as secondaries.
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

const PrivyConfiguredContext = createContext(false);
/** True when a Privy App ID is present, i.e. login is actually available. */
export const usePrivyConfigured = () => useContext(PrivyConfiguredContext);

export function Providers({ children }: { children: React.ReactNode }) {
  // One QueryClient per app lifetime (kept stable across renders).
  const [queryClient] = useState(() => new QueryClient());
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
      <PrivyConfiguredContext.Provider value={false}>
        <QueryClientProvider client={queryClient}>
          <BaseWagmiProvider config={wagmiConfig}>
            {children}
          </BaseWagmiProvider>
        </QueryClientProvider>
      </PrivyConfiguredContext.Provider>
    );
  }

  return (
    <PrivyConfiguredContext.Provider value={true}>
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
    </PrivyConfiguredContext.Provider>
  );
}
