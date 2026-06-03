"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

import { activeChain, tandaContract } from "@/lib/contracts";
import { describeTxError } from "@/lib/tx-error";

export type WithdrawStatus = "idle" | "signing" | "pending" | "success" | "error";

/**
 * Single-transaction pull-payment claim: calls `withdraw()` on a Tanda clone,
 * which transfers the caller's accrued `pendingWithdrawals` (payouts, the
 * creator's 3% fee, insurance refunds) to their wallet. No approval needed.
 */
export function useWithdraw(tandaAddress: `0x${string}`) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const queryClient = useQueryClient();

  const {
    writeContract,
    data: hash,
    isPending: isSigning,
    error: writeError,
    reset,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  const isWrongNetwork = isConnected && chainId !== activeChain.id;

  const claim = useCallback(() => {
    writeContract({
      ...tandaContract(tandaAddress),
      functionName: "withdraw",
      chainId: activeChain.id,
    });
  }, [writeContract, tandaAddress]);

  const switchToActiveChain = useCallback(
    () => switchChain({ chainId: activeChain.id }),
    [switchChain],
  );

  // On success, refetch app reads so the claimable balance refreshes to zero.
  useEffect(() => {
    if (isSuccess) queryClient.invalidateQueries();
  }, [isSuccess, queryClient]);

  const status: WithdrawStatus =
    writeError || receiptError
      ? "error"
      : isSuccess
        ? "success"
        : hash && isConfirming
          ? "pending"
          : isSigning
            ? "signing"
            : "idle";

  const error = useMemo(() => {
    if (writeError) return describeTxError(writeError);
    if (receiptError) return describeTxError(receiptError);
    return null;
  }, [writeError, receiptError]);

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
