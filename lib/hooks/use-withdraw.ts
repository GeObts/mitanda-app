"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

import { activeChain, tandaContract } from "@/lib/contracts";
import { BUILDER_DATA_SUFFIX } from "@/lib/app-mode";
import { describeTxError } from "@/lib/tx-error";
import { useEnsureChain } from "@/lib/hooks/use-ensure-chain";

export type WithdrawStatus = "idle" | "signing" | "pending" | "success" | "error";

/**
 * Single-transaction pull-payment claim: calls `withdraw()` on a Tanda clone,
 * which transfers the caller's accrued `pendingWithdrawals` (payouts, the
 * creator's 3% fee, insurance refunds) to their wallet. No approval needed.
 */
export function useWithdraw(tandaAddress: `0x${string}`) {
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

  // Auto-switch to the active chain first, then claim. A declined switch
  // surfaces via switchError instead of a hard write error.
  const claim = useCallback(async () => {
    if (!(await ensureChain())) return;
    writeContract({
      ...tandaContract(tandaAddress),
      functionName: "withdraw",
      chainId: activeChain.id,
      dataSuffix: BUILDER_DATA_SUFFIX,
    });
  }, [ensureChain, writeContract, tandaAddress]);

  const reset = useCallback(() => {
    resetWrite();
    resetSwitch();
  }, [resetWrite, resetSwitch]);

  // On success, refetch app reads so the claimable balance refreshes to zero.
  useEffect(() => {
    if (isSuccess) queryClient.invalidateQueries();
  }, [isSuccess, queryClient]);

  const status: WithdrawStatus =
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
    claim,
    status,
    error,
    hash,
    isWrongNetwork,
    switchToActiveChain,
    isSwitching,
    reset,
  };
}
