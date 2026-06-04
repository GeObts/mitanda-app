"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

import { activeChain, tandaContract } from "@/lib/contracts";
import { BUILDER_DATA_SUFFIX } from "@/lib/app-mode";
import { describeTxError } from "@/lib/tx-error";
import { useEnsureChain } from "@/lib/hooks/use-ensure-chain";

export type MarkDefaulterStatus =
  | "idle"
  | "signing"
  | "pending"
  | "success"
  | "error";

/**
 * Single-transaction, permissionless `markDefaulter(participant)` on a Tanda
 * clone: removes an active participant who hasn't paid the current cycle and is
 * past the grace period, slashes their insurance premium into the slash pool to
 * cover the gap, and unblocks the cycle's payout. Anyone may call it; the honest
 * members (especially the cycle's recipient) are the ones motivated to.
 */
export function useMarkDefaulter(tandaAddress: `0x${string}`) {
  const {
    ensureChain,
    switchToActiveChain,
    isWrongNetwork,
    isSwitching,
    switchError,
    resetSwitch,
  } = useEnsureChain();
  const queryClient = useQueryClient();

  const {
    writeContract,
    data: hash,
    isPending: isSigning,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  // Auto-switch to the active chain first, then mark. A declined switch
  // surfaces via switchError instead of a hard write error.
  const mark = useCallback(
    async (participant: `0x${string}`) => {
      if (!(await ensureChain())) return;
      writeContract({
        ...tandaContract(tandaAddress),
        functionName: "markDefaulter",
        args: [participant],
        chainId: activeChain.id,
        dataSuffix: BUILDER_DATA_SUFFIX,
      });
    },
    [ensureChain, writeContract, tandaAddress],
  );

  const reset = useCallback(() => {
    resetWrite();
    resetSwitch();
  }, [resetWrite, resetSwitch]);

  // On success, refetch app reads so the cycle becomes releasable.
  useEffect(() => {
    if (isSuccess) queryClient.invalidateQueries();
  }, [isSuccess, queryClient]);

  const status: MarkDefaulterStatus =
    writeError || receiptError || switchError
      ? "error"
      : isSuccess
        ? "success"
        : hash && isConfirming
          ? "pending"
          : isSigning
            ? "signing"
            : "idle";

  const error = useMemo(() => {
    if (switchError) return describeTxError(switchError);
    if (writeError) return describeTxError(writeError);
    if (receiptError) return describeTxError(receiptError);
    return null;
  }, [switchError, writeError, receiptError]);

  return {
    mark,
    status,
    error,
    hash,
    isWrongNetwork,
    switchToActiveChain,
    isSwitching,
    reset,
  };
}
