"use client";

import { Loader2, CheckCircle2, Circle, AlertTriangle } from "lucide-react";

import { activeChain, fmtToken } from "@/lib/contracts";
import { EXPLORER_TX, shortHash } from "@/lib/tx-error";
import type { TwoStepStatus } from "@/lib/hooks/use-two-step-tx";

/** Itemized cost: contribution + insurance premium = total (× cycles). */
export function CostBreakdown({
  contribution,
  premium,
  cycles = 1,
  total,
  symbol,
  decimals,
}: {
  contribution: bigint;
  premium: bigint;
  cycles?: number;
  total: bigint;
  /** Token symbol (read on-chain) shown next to amounts. */
  symbol: string;
  /** Token decimals (read on-chain) used to format amounts. */
  decimals: number;
}) {
  const fmt = (v: bigint) => `${fmtToken(v, decimals)} ${symbol}`.trim();
  return (
    <div className="space-y-1.5 rounded-btn bg-background-muted p-3 text-caption">
      <Row
        label={`Contribution${cycles > 1 ? ` × ${cycles}` : ""}`}
        value={fmt(contribution * BigInt(cycles))}
      />
      <Row
        label={`Insurance premium${cycles > 1 ? ` × ${cycles}` : ""}`}
        value={fmt(premium * BigInt(cycles))}
      />
      <div className="my-1 border-t border-border" />
      <Row label="Total" value={fmt(total)} strong />
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? "font-semibold text-foreground" : "text-foreground-muted"}>
        {label}
      </span>
      <span className={strong ? "font-semibold text-foreground" : "text-foreground"}>
        {value}
      </span>
    </div>
  );
}

type StepState = "upcoming" | "active" | "done" | "error";

function StepRow({
  state,
  label,
  sub,
  hash,
}: {
  state: StepState;
  label: string;
  sub?: string;
  hash?: `0x${string}`;
}) {
  const icon =
    state === "done" ? (
      <CheckCircle2 className="size-5 text-success" />
    ) : state === "active" ? (
      <Loader2 className="size-5 animate-spin text-primary dark:text-accent" />
    ) : state === "error" ? (
      <AlertTriangle className="size-5 text-danger" />
    ) : (
      <Circle className="size-5 text-foreground-subtle" />
    );
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div
          className={
            state === "upcoming"
              ? "text-body text-foreground-subtle"
              : "text-body font-medium text-foreground"
          }
        >
          {label}
        </div>
        {sub && <div className="text-caption text-foreground-muted">{sub}</div>}
        {hash && (
          <a
            href={`${EXPLORER_TX}${hash}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-caption text-accent underline"
          >
            {shortHash(hash)}
          </a>
        )}
      </div>
    </div>
  );
}

/** Two-step progress: optional approve step + the action step. */
export function TwoStepProgress({
  status,
  errorPhase,
  needsApproval,
  actionLabel,
  approveHash,
  actionHash,
  tokenSymbol = "token",
}: {
  status: TwoStepStatus;
  errorPhase?: "approve" | "action" | null;
  needsApproval: boolean;
  actionLabel: string;
  approveHash?: `0x${string}`;
  actionHash?: `0x${string}`;
  /** Symbol of the token being approved (read on-chain). */
  tokenSymbol?: string;
}) {
  const inApprove = status === "approve-sign" || status === "approve-pending";
  const inAction = status === "action-sign" || status === "action-pending";
  const done = status === "success";

  const approveState: StepState =
    errorPhase === "approve"
      ? "error"
      : inApprove
        ? "active"
        : status === "idle"
          ? "upcoming"
          : "done"; // moved on to the action or finished

  const actionState: StepState = done
    ? "done"
    : errorPhase === "action"
      ? "error"
      : inAction
        ? "active"
        : "upcoming";

  const approveSub =
    status === "approve-sign"
      ? "Confirm approval in your wallet"
      : status === "approve-pending"
        ? `Approving on ${activeChain.name}…`
        : undefined;
  const actionSub =
    status === "action-sign"
      ? "Confirm in your wallet"
      : status === "action-pending"
        ? `Submitting on ${activeChain.name}…`
        : undefined;

  return (
    <div className="space-y-3">
      {needsApproval && (
        <StepRow
          state={approveState}
          label={`Approve ${tokenSymbol} spend`}
          sub={approveSub}
          hash={approveHash}
        />
      )}
      <StepRow
        state={actionState}
        label={actionLabel}
        sub={actionSub}
        hash={actionHash}
      />
    </div>
  );
}
