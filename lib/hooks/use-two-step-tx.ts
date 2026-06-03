"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

import { activeChain, erc20, mitanda } from "@/lib/contracts";
import { describeTxError } from "@/lib/tx-error";

export interface ActionConfig {
  address: `0x${string}`;
  abi: readonly unknown[];
  functionName: string;
  args: readonly unknown[];
}

export type TwoStepStatus =
  | "idle"
  | "approve-sign" // confirm approve in wallet
  | "approve-pending" // approve mining
  | "action-sign" // confirm action in wallet
  | "action-pending" // action mining
  | "success"
  | "error";

interface Params {
  /** The Tanda clone that will pull the token (approve spender). */
  spender?: `0x${string}`;
  /** Base units of the contribution token required for the action. */
  requiredAmount: bigint;
  /**
   * The contribution token to approve/spend. Defaults to the active-chain
   * USDC; pass the tanda's own token() for token-aware Join/Pay.
   */
  token?: `0x${string}`;
  /** The join / makePayment call. Null until the form is ready. */
  action: ActionConfig | null;
}

/**
 * Shared two-step token flow used by both Join and Pay:
 *   check allowance → (approve if needed) → action.
 * Pre-checks balance and network before any signing. Token-aware: the
 * allowance/balance/approve all run against `token` (defaults to USDC).
 */
export function useTwoStepTx({ spender, requiredAmount, token, action }: Params) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const queryClient = useQueryClient();

  // The contribution token (per-tanda token, or USDC fallback).
  const tokenCfg = useMemo(
    () => erc20(token ?? mitanda.usdc.address),
    [token],
  );

  // ── Token reads ───────────────────────────────────────────────────────────
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    ...tokenCfg,
    functionName: "allowance",
    args: address && spender ? [address, spender] : undefined,
    chainId: activeChain.id,
    query: { enabled: !!address && !!spender },
  });
  const { data: balance } = useReadContract({
    ...tokenCfg,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: activeChain.id,
    query: { enabled: !!address },
  });

  const allowanceVal = (allowance as bigint | undefined) ?? null;
  const balanceVal = (balance as bigint | undefined) ?? null;
  const needsApproval =
    allowanceVal !== null && allowanceVal < requiredAmount;
  const hasEnoughBalance =
    balanceVal !== null && balanceVal >= requiredAmount;
  const isWrongNetwork = isConnected && chainId !== activeChain.id;

  // ── Tx machinery ───────────────────────────────────────────────────────────
  type Flow = "idle" | "approving" | "acting" | "done" | "error";
  const [flow, setFlow] = useState<Flow>("idle");
  const actionFiredRef = useRef(false);

  const approve = useWriteContract();
  const approveReceipt = useWaitForTransactionReceipt({ hash: approve.data });
  const act = useWriteContract();
  const actReceipt = useWaitForTransactionReceipt({ hash: act.data });

  const fireAction = useCallback(() => {
    if (!action) return;
    actionFiredRef.current = true;
    setFlow("acting");
    act.writeContract({
      address: action.address,
      abi: action.abi,
      functionName: action.functionName,
      args: action.args,
      chainId: activeChain.id,
    } as never);
  }, [action, act]);

  const run = useCallback(() => {
    if (!action || !spender) return;
    if (isWrongNetwork) return;
    if (!hasEnoughBalance) return;
    actionFiredRef.current = false;
    if (needsApproval) {
      setFlow("approving");
      approve.writeContract({
        ...tokenCfg,
        functionName: "approve",
        args: [spender, requiredAmount],
        chainId: activeChain.id,
      });
    } else {
      fireAction();
    }
  }, [
    action,
    spender,
    isWrongNetwork,
    hasEnoughBalance,
    needsApproval,
    approve,
    tokenCfg,
    requiredAmount,
    fireAction,
  ]);

  // After approve confirms, refetch allowance and fire the action once.
  useEffect(() => {
    if (
      flow === "approving" &&
      approveReceipt.isSuccess &&
      !actionFiredRef.current
    ) {
      refetchAllowance();
      fireAction();
    }
  }, [flow, approveReceipt.isSuccess, refetchAllowance, fireAction]);

  // Action confirmed → success + refetch app reads.
  useEffect(() => {
    if (flow === "acting" && actReceipt.isSuccess) {
      setFlow("done");
      queryClient.invalidateQueries();
    }
  }, [flow, actReceipt.isSuccess, queryClient]);

  // Any error bubbles the flow to error; track which phase failed.
  const approveErr = approve.error || approveReceipt.error;
  const actErr = act.error || actReceipt.error;
  const errorObj = approveErr || actErr;
  const errorPhase: "approve" | "action" | null = approveErr
    ? "approve"
    : actErr
      ? "action"
      : null;
  useEffect(() => {
    if (errorObj && flow !== "error") setFlow("error");
  }, [errorObj, flow]);

  const reset = useCallback(() => {
    actionFiredRef.current = false;
    setFlow("idle");
    approve.reset();
    act.reset();
  }, [approve, act]);

  const switchToActiveChain = useCallback(
    () => switchChain({ chainId: activeChain.id }),
    [switchChain],
  );

  // ── Derived status ──────────────────────────────────────────────────────────
  const status: TwoStepStatus = useMemo(() => {
    if (flow === "error" || errorObj) return "error";
    if (flow === "done") return "success";
    if (flow === "acting") {
      if (act.isPending) return "action-sign";
      if (act.data && actReceipt.isLoading) return "action-pending";
    }
    if (flow === "approving") {
      if (approve.isPending) return "approve-sign";
      if (approve.data && approveReceipt.isLoading) return "approve-pending";
    }
    return "idle";
  }, [
    flow,
    errorObj,
    act.isPending,
    act.data,
    actReceipt.isLoading,
    approve.isPending,
    approve.data,
    approveReceipt.isLoading,
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
    needsApproval,
    allowance: allowanceVal,
    balance: balanceVal,
    hasEnoughBalance,
    isWrongNetwork,
    switchToActiveChain,
    isSwitching,
    approveHash: approve.data,
    actionHash: act.data,
    actionReceipt: actReceipt.data,
  };
}
