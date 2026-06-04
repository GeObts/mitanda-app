"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

import { activeChain, tandaContract } from "@/lib/contracts";
import { BUILDER_DATA_SUFFIX } from "@/lib/app-mode";
import { describeTxError } from "@/lib/tx-error";
import { useEnsureChain } from "@/lib/hooks/use-ensure-chain";

export type ReleaseStatus =
  | "idle"
  | "release-sign" // confirm triggerPayout in wallet
  | "release-pending" // triggerPayout mining
  | "claim-sign" // confirm withdraw in wallet
  | "claim-pending" // withdraw mining
  | "success"
  | "error";

/**
 * Settle the current cycle by calling the permissionless `triggerPayout()` on a
 * Tanda clone. With `andClaim` (the recipient's flow), it chains straight into
 * `withdraw()` so the recipient releases the pot and pulls it to their wallet in
 * one tap (two signatures). Without it (the altruistic/fallback flow for any
 * participant), it just releases the cycle so the recipient can claim later.
 *
 * Status is derived purely from the two write/receipt states (no effect-driven
 * state machine) — the only effects fire the chained claim and refresh reads.
 */
export function useReleasePayout(
  tandaAddress: `0x${string}`,
  opts?: { andClaim?: boolean },
) {
  const andClaim = opts?.andClaim ?? false;
  const {
    ensureChain,
    switchToActiveChain,
    isWrongNetwork,
    isSwitching,
    switchError,
    resetSwitch,
  } = useEnsureChain();
  const queryClient = useQueryClient();

  const release = useWriteContract();
  const releaseReceipt = useWaitForTransactionReceipt({ hash: release.data });
  const claimW = useWriteContract();
  const claimReceipt = useWaitForTransactionReceipt({ hash: claimW.data });

  const claimFiredRef = useRef(false);

  // Auto-switch to the active chain first, then release. A declined switch
  // surfaces via switchError instead of silently no-op'ing.
  const run = useCallback(async () => {
    if (!(await ensureChain())) return;
    claimFiredRef.current = false;
    release.writeContract({
      ...tandaContract(tandaAddress),
      functionName: "triggerPayout",
      chainId: activeChain.id,
      dataSuffix: BUILDER_DATA_SUFFIX,
    });
  }, [ensureChain, release, tandaAddress]);

  // Once the release confirms: recipient flow fires the claim (deferring the
  // read-refresh until the claim lands, so the card doesn't unmount mid-flight);
  // fallback flow refreshes now since it's done.
  useEffect(() => {
    if (releaseReceipt.isSuccess) {
      if (andClaim && !claimFiredRef.current) {
        claimFiredRef.current = true;
        claimW.writeContract({
          ...tandaContract(tandaAddress),
          functionName: "withdraw",
          chainId: activeChain.id,
          dataSuffix: BUILDER_DATA_SUFFIX,
        });
      } else if (!andClaim) {
        queryClient.invalidateQueries();
      }
    }
  }, [releaseReceipt.isSuccess, andClaim, claimW, tandaAddress, queryClient]);

  // After the claim confirms, refresh so the claimable balance zeroes.
  useEffect(() => {
    if (claimReceipt.isSuccess) queryClient.invalidateQueries();
  }, [claimReceipt.isSuccess, queryClient]);

  const reset = useCallback(() => {
    claimFiredRef.current = false;
    release.reset();
    claimW.reset();
    resetSwitch();
  }, [release, claimW, resetSwitch]);

  const releaseErr = release.error || releaseReceipt.error;
  const claimErr = claimW.error || claimReceipt.error;
  const errorObj = switchError || releaseErr || claimErr;
  const errorPhase: "release" | "claim" | null = releaseErr
    ? "release"
    : claimErr
      ? "claim"
      : null;

  const status: ReleaseStatus = useMemo(() => {
    if (errorObj) return "error";
    // Claim leg (recipient flow).
    if (claimReceipt.isSuccess) return "success";
    if (claimW.isPending) return "claim-sign";
    if (claimW.data && claimReceipt.isLoading) return "claim-pending";
    // Release leg.
    if (release.isPending) return "release-sign";
    if (release.data && releaseReceipt.isLoading) return "release-pending";
    // Release done: success for the fallback flow, transitional for the
    // recipient flow (claim write is about to fire from the effect).
    if (releaseReceipt.isSuccess) return andClaim ? "claim-sign" : "success";
    return "idle";
  }, [
    errorObj,
    andClaim,
    release.isPending,
    release.data,
    releaseReceipt.isLoading,
    releaseReceipt.isSuccess,
    claimW.isPending,
    claimW.data,
    claimReceipt.isLoading,
    claimReceipt.isSuccess,
  ]);

  const error = useMemo(
    () => (errorObj ? describeTxError(errorObj) : null),
    [errorObj],
  );

  return {
    run,
    reset,
    status,
    error,
    errorPhase,
    isWrongNetwork,
    switchToActiveChain,
    isSwitching,
    releaseHash: release.data,
    claimHash: claimW.data,
  };
}
