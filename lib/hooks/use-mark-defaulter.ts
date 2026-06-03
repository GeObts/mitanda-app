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

  const mark = useCallback(
    (participant: `0x${string}`) => {
      writeContract({
        ...tandaContract(tandaAddress),
        functionName: "markDefaulter",
        args: [participant],
        chainId: activeChain.id,
      });
    },
    [writeContract, tandaAddress],
  );

  const switchToActiveChain = useCallback(
    () => switchChain({ chainId: activeChain.id }),
    [switchChain],
  );

  // On success, refetch app reads so the cycle becomes releasable.
  useEffect(() => {
    if (isSuccess) queryClient.invalidateQueries();
  }, [isSuccess, queryClient]);

  const status: MarkDefaulterStatus =
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
