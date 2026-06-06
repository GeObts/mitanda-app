"use client";

// Solana wallet-adapter provider, scoped to the Etherfuse feature only.
//
// Deliberately NOT mounted in the global app/providers.tsx: the app's primary
// auth is Privy + wagmi (EVM / Arbitrum). Solana is needed solely for the
// Etherfuse swap, so we mount this provider locally around the YieldSection. That
// keeps the EVM auth tree untouched and avoids loading Solana wallet code on every
// page.
//
// Wallets are auto-discovered via the Wallet Standard (Phantom, Solflare,
// Backpack register themselves), so we pass no explicit adapters — which is also
// why we skipped the heavy @solana/wallet-adapter-wallets meta-package.

import { useMemo } from "react";
import { clusterApiUrl } from "@solana/web3.js";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import { SOLANA_CLUSTER } from "@/lib/etherfuse/constants";

// Modal + button styles for @solana/wallet-adapter-react-ui. Importing CSS into a
// Client Component is supported by the Next App Router.
import "@solana/wallet-adapter-react-ui/styles.css";

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(SOLANA_CLUSTER),
    [],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
