"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { parseEventLogs } from "viem";

import { activeChain, erc20, mitanda, ManagerAbi } from "@/lib/contracts";
import { BUILDER_DATA_SUFFIX } from "@/lib/app-mode";
import { describeTxError } from "@/lib/tx-error";
import { useEnsureChain } from "@/lib/hooks/use-ensure-chain";
import type { CreateTandaArgs } from "@/lib/tanda-form";

export type CreateStatus =
  | "idle"
  | "approve-signing" // confirm token approval in wallet
  | "approve-pending" // approval mining
  | "signing" // confirm createTanda in wallet
  | "pending" // createTanda mining
  | "success"
  | "error";

export interface UseCreateTanda {
  /** Create a tanda denominated in `token` (allowlisted contribution token). */
  submit: (args: CreateTandaArgs, token: `0x${string}`) => void;
  status: CreateStatus;
  error: string | null;
  hash: `0x${string}` | undefined;
  createdTandaId: bigint | null;
  createdTandaAddress: `0x${string}` | null;
  isWrongNetwork: boolean;
  switchToActiveChain: () => void;
  isSwitching: boolean;
  /** True when the creator still needs to approve the Manager for `charge`. */
  needsApproval: boolean;
  reset: () => void;
}

/**
 * Two-step create flow: approve the Manager → createTanda.
 *
 * Charge-at-create: `createTanda` pulls the creator's first contribution +
 * insurance premium (`charge`) via the Manager, so the creator must approve the
 * Manager first (the clone doesn't exist yet). Mirrors the join two-step engine.
 */
export function useCreateTanda({
  token,
  charge,
}: {
  token?: `0x${string}`;
  charge: bigint;
}): UseCreateTanda {
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

  const tokenCfg = useMemo(
    () => erc20(token ?? mitanda.usdc.address),
    [token],
  );

  // Allowance: creator → Manager (the spender that pulls the first charge).
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    ...tokenCfg,
    functionName: "allowance",
    args: address ? [address, mitanda.manager.address] : undefined,
    chainId: activeChain.id,
    query: { enabled: !!address && !!token },
  });
  const allowanceVal = (allowance as bigint | undefined) ?? null;
  const needsApproval = allowanceVal !== null && allowanceVal < charge;

  const approve = useWriteContract();
  const approveReceipt = useWaitForTransactionReceipt({ hash: approve.data });
  const create = useWriteContract();
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: createMined,
  } = useWaitForTransactionReceipt({ hash: create.data });

  type Flow = "idle" | "approving" | "creating" | "done" | "error";
  const [flow, setFlow] = useState<Flow>("idle");
  const pendingRef = useRef<{ args: CreateTandaArgs; token: `0x${string}` } | null>(
    null,
  );
  const createFiredRef = useRef(false);

  const fireCreate = useCallback(() => {
    const p = pendingRef.current;
    if (!p) return;
    createFiredRef.current = true;
    setFlow("creating");
    create.writeContract({
      ...mitanda.manager,
      functionName: "createTanda",
      chainId: activeChain.id,
      dataSuffix: BUILDER_DATA_SUFFIX,
      args: [
        p.token,
        p.args.contributionAmount,
        p.args.payoutInterval,
        p.args.participantCount,
        p.args.gracePeriod,
        p.args.scheduledStart,
        p.args.privacy,
      ],
    });
  }, [create]);

  // Auto-switch to the active chain first, then approve/create. A declined
  // switch surfaces via switchError instead of a hard write error.
  const submit = useCallback(
    async (args: CreateTandaArgs, tokenArg: `0x${string}`) => {
      if (!(await ensureChain())) return;
      pendingRef.current = { args, token: tokenArg };
      createFiredRef.current = false;
      if (needsApproval) {
        setFlow("approving");
        approve.writeContract({
          ...erc20(tokenArg),
          functionName: "approve",
          args: [mitanda.manager.address, charge],
          chainId: activeChain.id,
          dataSuffix: BUILDER_DATA_SUFFIX,
        });
      } else {
        fireCreate();
      }
    },
    [ensureChain, needsApproval, approve, charge, fireCreate],
  );

  // After approval confirms, refetch allowance and fire createTanda once.
  useEffect(() => {
    if (
      flow === "approving" &&
      approveReceipt.isSuccess &&
      !createFiredRef.current
    ) {
      refetchAllowance();
      fireCreate();
    }
  }, [flow, approveReceipt.isSuccess, refetchAllowance, fireCreate]);

  // createTanda confirmed → refetch app reads (success is derived in `status`).
  useEffect(() => {
    if (flow === "creating" && createMined) {
      queryClient.invalidateQueries();
    }
  }, [flow, createMined, queryClient]);

  // `status` derives "error" from errorObj directly, so no effect is needed to
  // transition the flow.
  const errorObj =
    switchError || approve.error || approveReceipt.error || create.error || null;

  const status: CreateStatus = useMemo(() => {
    if (errorObj) return "error";
    if (createMined) return "success";
    if (flow === "creating") {
      if (create.isPending) return "signing";
      if (create.data && isConfirming) return "pending";
    }
    if (flow === "approving") {
      if (approve.isPending) return "approve-signing";
      if (approve.data && approveReceipt.isLoading) return "approve-pending";
    }
    return "idle";
  }, [
    flow,
    errorObj,
    createMined,
    create.isPending,
    create.data,
    isConfirming,
    approve.isPending,
    approve.data,
    approveReceipt.isLoading,
  ]);

  const error = useMemo(
    () => (errorObj ? describeTxError(errorObj) : null),
    [errorObj],
  );

  // Parse the new tandaId from the TandaCreated event in the create receipt.
  const { createdTandaId, createdTandaAddress } = useMemo(() => {
    if (!receipt) return { createdTandaId: null, createdTandaAddress: null };
    try {
      const logs = parseEventLogs({
        abi: ManagerAbi,
        eventName: "TandaCreated",
        logs: receipt.logs,
      });
      const ev = logs[0];
      if (ev) {
        return {
          createdTandaId: ev.args.tandaId as bigint,
          createdTandaAddress: ev.args.tandaAddress as `0x${string}`,
        };
      }
    } catch {
      // fall through
    }
    return { createdTandaId: null, createdTandaAddress: null };
  }, [receipt]);

  const reset = useCallback(() => {
    pendingRef.current = null;
    createFiredRef.current = false;
    setFlow("idle");
    approve.reset();
    create.reset();
    resetSwitch();
  }, [approve, create, resetSwitch]);

  return {
    submit,
    status,
    error,
    hash: create.data,
    createdTandaId,
    createdTandaAddress,
    isWrongNetwork,
    switchToActiveChain,
    isSwitching,
    needsApproval,
    reset,
  };
}
