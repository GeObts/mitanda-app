"use client";

import { useCallback } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";

import { activeChain } from "@/lib/contracts";

/**
 * Shared auto chain-switch helper for every write hook.
 *
 * `ensureChain()` guarantees the wallet is on the app's active chain before a
 * transaction. If it isn't, it prompts the wallet to switch
 * (`wallet_switchEthereumChain`); wagmi falls back to `wallet_addEthereumChain`
 * when the chain isn't in the wallet yet, using the chain config from the wagmi
 * `chains` list. It resolves to `true` once on the right chain and `false` if
 * the user declines — the decline is surfaced via `switchError` (which
 * `describeTxError` renders as "You rejected the request"). It never throws, so
 * action callbacks stay a simple `if (!(await ensureChain())) return;`.
 *
 * This replaces the old behaviour where a write on the wrong network threw a
 * hard "wallet not connected to <chain>" error: now the user gets a one-tap
 * switch prompt instead.
 */
export function useEnsureChain() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const {
    switchChainAsync,
    isPending: isSwitching,
    error: switchError,
    reset: resetSwitch,
  } = useSwitchChain();

  const isWrongNetwork = isConnected && chainId !== activeChain.id;

  const ensureChain = useCallback(async (): Promise<boolean> => {
    if (chainId === activeChain.id) return true;
    try {
      await switchChainAsync({ chainId: activeChain.id });
      return true;
    } catch {
      return false; // user declined; surfaced via switchError
    }
  }, [chainId, switchChainAsync]);

  // For dedicated "Switch network" buttons.
  const switchToActiveChain = useCallback(() => {
    void ensureChain();
  }, [ensureChain]);

  return {
    ensureChain,
    switchToActiveChain,
    isWrongNetwork,
    isSwitching,
    switchError,
    resetSwitch,
  };
}
