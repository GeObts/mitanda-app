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
import { useT } from "@/lib/i18n";

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
 * "Make a payment" control. The contract's `makePayment` is
 * `onlyInState(ACTIVE)`, so while the tanda is still OPEN (not yet full/started)
 * we never offer a payment the contract would reject — the control is disabled
 * with a plain-language explanation instead.
 */
export function PayTandaButton({ tanda }: { tanda: PayTarget }) {
  const [open, setOpen] = useState(false);
  const t = useT();

  if (tanda.state !== TandaState.ACTIVE) {
    return (
      <div className="space-y-1.5">
        <button
          type="button"
          disabled
          className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-btn border border-border bg-background-muted px-5 py-3 text-h3 text-foreground-subtle"
        >
          <Clock className="size-4" /> {t("pay.makePayment")}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-caption text-foreground-muted">
          {t("pay.opensWhenFull")}
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
        {t("pay.makePayment")}
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
  const t = useT();
  const payLabel = t(clamped === 1 ? "pay.payNCyclesOne" : "pay.payNCycles", { n: clamped });

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
          <DialogTitle className="text-h2">{t("pay.notStartedTitle")}</DialogTitle>
        </DialogHeader>
        <Banner tone="muted" icon={<Clock className="size-4" />}>
          {t("pay.notStartedBody")}
        </Banner>
        <button
          type="button"
          onClick={onDone}
          className="flex w-full items-center justify-center rounded-btn bg-primary px-5 py-3 text-h3 text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          {t("common.gotIt")}
        </button>
      </div>
    );
  }

  if (tx.status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <h2 className="text-h2">{t("pay.confirmedTitle")}</h2>
        <p className="max-w-xs text-body text-foreground-muted">
          {t(clamped === 1 ? "pay.confirmedBodyOne" : "pay.confirmedBody", { n: clamped })}
        </p>
        {tx.actionHash && (
          <a
            href={`${EXPLORER_TX}${tx.actionHash}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-caption text-accent underline"
          >
            {t("common.viewTx")}
          </a>
        )}
        <button
          type="button"
          onClick={onDone}
          className="mt-2 flex w-full items-center justify-center rounded-btn bg-primary px-5 py-3 text-h3 text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          {t("common.done")}
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
          <DialogTitle className="text-h2">{t("pay.makingTitle")}</DialogTitle>
          <DialogDescription>{t("join.joiningDesc")}</DialogDescription>
        </DialogHeader>
        <TwoStepProgress
          status={tx.status}
          errorPhase={tx.errorPhase}
          needsApproval={tx.needsApproval}
          actionLabel={payLabel}
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
        <DialogTitle className="text-h2">{t("pay.title")}</DialogTitle>
        <DialogDescription>
          {t("pay.desc", { n: tanda.paidUntilCycle, total: tanda.totalCycles })}
        </DialogDescription>
      </DialogHeader>

      {tx.status === "error" && tx.error && (
        <Banner tone="danger" icon={<AlertTriangle className="size-4" />}>
          {tx.error}
        </Banner>
      )}

      {cap <= 0 ? (
        <Banner tone="muted" icon={<CheckCircle2 className="size-4" />}>
          {t("pay.fullyPaid")}
        </Banner>
      ) : (
        <>
          {/* Cycle stepper */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <label className="text-caption font-semibold text-foreground">
                {t("pay.cyclesToPay")}
              </label>
              <span className="text-caption text-foreground-subtle">
                {t("pay.upTo", { n: cap })}
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
              {t("pay.youPay")}
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
            actionLabel={payLabel}
            symbol={symbol}
            decimals={decimals}
          />
        </>
      )}
    </div>
  );
}
