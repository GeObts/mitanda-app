"use client";

import { useState } from "react";
import { Minus, Plus, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  tandaContract,
  perCycleCharge,
  premiumPerCycle,
  TandaState,
} from "@/lib/contracts";
import { useTwoStepTx } from "@/lib/hooks/use-two-step-tx";
import { useToken } from "@/lib/hooks/use-token";
import { CostBreakdown, TwoStepProgress } from "@/components/tx-ui";
import { EXPLORER_TX } from "@/lib/tx-error";
import { Banner, GuardArea } from "@/components/tx-shared";

export interface PayTarget {
  address: `0x${string}`;
  contribution: bigint;
  paidUntilCycle: number;
  totalCycles: number;
  /** The tanda's contribution token — payments use its symbol/decimals. */
  token: `0x${string}`;
  /** Lifecycle state — payments are only accepted while ACTIVE. */
  state: TandaState;
}

/**
 * "Pay / Contribuir" control. The contract's `makePayment` is
 * `onlyInState(ACTIVE)`, so while the tanda is still OPEN (not yet full/started)
 * we never offer a payment the contract would reject — the control is disabled
 * with a plain-language explanation instead.
 */
export function PayTandaButton({ tanda }: { tanda: PayTarget }) {
  const [open, setOpen] = useState(false);

  if (tanda.state !== TandaState.ACTIVE) {
    return (
      <div className="space-y-1.5">
        <button
          type="button"
          disabled
          className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-btn border border-border bg-background-muted px-5 py-3 text-h3 text-foreground-subtle"
        >
          <Clock className="size-4" /> Pagar / Contribuir
        </button>
        <p className="flex items-center justify-center gap-1.5 text-caption text-foreground-muted">
          Payments open once your tanda fills and starts.
        </p>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-btn border border-primary bg-transparent px-5 py-3 text-h3 text-primary transition-colors hover:bg-primary/5 dark:border-accent dark:text-accent dark:hover:bg-accent/10"
      >
        Pagar / Contribuir
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <PayContent
            key={open ? "open" : "closed"}
            tanda={tanda}
            onDone={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function PayContent({
  tanda,
  onDone,
}: {
  tanda: PayTarget;
  onDone: () => void;
}) {
  const cap = Math.max(0, tanda.totalCycles - tanda.paidUntilCycle);
  const [cycles, setCycles] = useState(1);
  const clamped = Math.min(Math.max(1, cycles), Math.max(1, cap));

  const perCycle = perCycleCharge(tanda.contribution);
  const premium = premiumPerCycle(tanda.contribution);
  const total = perCycle * BigInt(clamped);

  const { token: tokenMeta } = useToken(tanda.token);
  const symbol = tokenMeta?.symbol ?? "";
  const decimals = tokenMeta?.decimals ?? 6;

  const tx = useTwoStepTx({
    spender: tanda.address,
    requiredAmount: total,
    token: tanda.token,
    action:
      cap > 0
        ? {
            address: tanda.address,
            abi: tandaContract(tanda.address).abi,
            functionName: "makePayment",
            args: [BigInt(clamped)],
          }
        : null,
  });

  // Defensive backstop: the contract's makePayment is onlyInState(ACTIVE), so
  // never present a payment form while the tanda is still OPEN / not started.
  if (tanda.state !== TandaState.ACTIVE) {
    return (
      <div className="space-y-4">
        <DialogHeader>
          <DialogTitle className="text-h2">Not started yet</DialogTitle>
        </DialogHeader>
        <Banner tone="muted" icon={<Clock className="size-4" />}>
          Payments open once your tanda fills and starts. You&apos;ve already
          paid your first cycle by joining — there&apos;s nothing to pay until it
          goes active.
        </Banner>
        <button
          type="button"
          onClick={onDone}
          className="flex w-full items-center justify-center rounded-btn bg-primary px-5 py-3 text-h3 text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Got it
        </button>
      </div>
    );
  }

  if (tx.status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <h2 className="text-h2">Payment confirmed</h2>
        <p className="max-w-xs text-body text-foreground-muted">
          You paid {clamped} cycle{clamped === 1 ? "" : "s"}. Your dashboard has
          been updated.
        </p>
        {tx.actionHash && (
          <a
            href={`${EXPLORER_TX}${tx.actionHash}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-caption text-accent underline"
          >
            View transaction
          </a>
        )}
        <button
          type="button"
          onClick={onDone}
          className="mt-2 flex w-full items-center justify-center rounded-btn bg-primary px-5 py-3 text-h3 text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Done
        </button>
      </div>
    );
  }

  if (
    tx.status === "approve-sign" ||
    tx.status === "approve-pending" ||
    tx.status === "action-sign" ||
    tx.status === "action-pending"
  ) {
    return (
      <div className="space-y-4">
        <DialogHeader>
          <DialogTitle className="text-h2">Making payment</DialogTitle>
          <DialogDescription>
            Keep this open until both steps confirm.
          </DialogDescription>
        </DialogHeader>
        <TwoStepProgress
          status={tx.status}
          errorPhase={tx.errorPhase}
          needsApproval={tx.needsApproval}
          actionLabel={`Pay ${clamped} cycle${clamped === 1 ? "" : "s"}`}
          approveHash={tx.approveHash}
          actionHash={tx.actionHash}
          tokenSymbol={symbol}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-h2">Make a payment</DialogTitle>
        <DialogDescription>
          Pay one or more cycles ahead. You&apos;ve paid through cycle{" "}
          {tanda.paidUntilCycle} of {tanda.totalCycles}.
        </DialogDescription>
      </DialogHeader>

      {tx.status === "error" && tx.error && (
        <Banner tone="danger" icon={<AlertTriangle className="size-4" />}>
          {tx.error}
        </Banner>
      )}

      {cap <= 0 ? (
        <Banner tone="muted" icon={<CheckCircle2 className="size-4" />}>
          You&apos;re fully paid up for this tanda.
        </Banner>
      ) : (
        <>
          {/* Cycle stepper */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <label className="text-caption font-semibold text-foreground">
                Cycles to pay
              </label>
              <span className="text-caption text-foreground-subtle">
                up to {cap}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Fewer cycles"
                onClick={() => setCycles((c) => Math.max(1, c - 1))}
                disabled={clamped <= 1}
                className="flex size-10 items-center justify-center rounded-btn border border-border text-foreground transition-colors hover:bg-background-muted disabled:opacity-40"
              >
                <Minus className="size-4" />
              </button>
              <div className="flex-1 text-center text-h2 tabular-nums">
                {clamped}
              </div>
              <button
                type="button"
                aria-label="More cycles"
                onClick={() => setCycles((c) => Math.min(cap, c + 1))}
                disabled={clamped >= cap}
                className="flex size-10 items-center justify-center rounded-btn border border-border text-foreground transition-colors hover:bg-background-muted disabled:opacity-40"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-caption font-semibold text-foreground">
              You pay
            </div>
            <CostBreakdown
              contribution={tanda.contribution}
              premium={premium}
              cycles={clamped}
              total={total}
              symbol={symbol}
              decimals={decimals}
            />
          </div>

          <GuardArea
            tx={tx}
            required={total}
            actionLabel={`Pay ${clamped} cycle${clamped === 1 ? "" : "s"}`}
            symbol={symbol}
            decimals={decimals}
          />
        </>
      )}
    </div>
  );
}
