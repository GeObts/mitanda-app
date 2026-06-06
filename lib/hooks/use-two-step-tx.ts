"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

import { activeChain, erc20, mitanda } from "@/lib/contracts";
import { BUILDER_DATA_SUFFIX } from "@/lib/app-mode";
import { describeTxError } from "@/lib/tx-error";
import { useEnsureChain } from "@/lib/hooks/use-ensure-chain";

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
  const { address } = useAccount();
  const {
    ensureChain,
    switchToActiveChain,
    isWrongNetwork,
    isSwitching,
    switchError,
    resetSwitch,
  } = useEnsureChain();
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
      dataSuffix: BUILDER_DATA_SUFFIX,
    } as never);
  }, [action, act]);

  // Auto-switch to the active chain first, then approve/act. A declined switch
  // surfaces via switchError instead of a hard write error.
  const run = useCallback(async () => {
    if (!action || !spender) return;
    if (!hasEnoughBalance) return;
    if (!(await ensureChain())) return;
    actionFiredRef.current = false;
    if (needsApproval) {
      setFlow("approving");
      approve.writeContract({
        ...tokenCfg,
        functionName: "approve",
        args: [spender, requiredAmount],
        chainId: activeChain.id,
        dataSuffix: BUILDER_DATA_SUFFIX,
      });
    } else {
      fireAction();
    }
  }, [
    action,
    spender,
    ensureChain,
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

  // Action confirmed → refetch app reads (success is derived in `status`).
  useEffect(() => {
    if (flow === "acting" && actReceipt.isSuccess) {
      queryClient.invalidateQueries();
    }
  }, [flow, actReceipt.isSuccess, queryClient]);

  // Error: which phase failed. `status` derives "error" from errorObj directly,
  // so no effect is needed to transition the flow.
  const approveErr = approve.error || approveReceipt.error;
  const actErr = act.error || actReceipt.error;
  const errorObj = switchError || approveErr || actErr;
  const errorPhase: "approve" | "action" | null = approveErr
    ? "approve"
    : actErr
      ? "action"
      : null;

  const reset = useCallback(() => {
    actionFiredRef.current = false;
    setFlow("idle");
    approve.reset();
    act.reset();
    resetSwitch();
  }, [approve, act, resetSwitch]);

  // ── Derived status ──────────────────────────────────────────────────────────
  const status: TwoStepStatus = useMemo(() => {
    if (errorObj) return "error";
    if (actReceipt.isSuccess) return "success";
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
    actReceipt.isSuccess,
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
