"use client";

import { useMemo, useState } from "react";
import type { ContractFunctionParameters } from "viem";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Users,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ActionButton } from "@/components/mt/action-button";
import {
  mitanda,
  tandaContract,
  TandaState,
  perCycleCharge,
  premiumPerCycle,
  fmtToken,
  activeChain,
} from "@/lib/contracts";
import { useTwoStepTx } from "@/lib/hooks/use-two-step-tx";
import { useToken } from "@/lib/hooks/use-token";
import { CostBreakdown, TwoStepProgress } from "@/components/tx-ui";
import { EXPLORER_TX } from "@/lib/tx-error";
import { Banner, GuardArea, zeroAddr } from "@/components/tx-shared";
import { useT, useIntervalLabel } from "@/lib/i18n";

interface JoinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-target a specific clone (Create success "join to activate"). */
  presetAddress?: `0x${string}`;
  presetId?: bigint;
}

/** Dashboard "Join a tanda" — opens the join-by-ID dialog. */
export function JoinTandaButton() {
  const [open, setOpen] = useState(false);
  const t = useT();
  return (
    <>
      <ActionButton variant="secondary" onClick={() => setOpen(true)}>
        {t("join.btn")}
      </ActionButton>
      <JoinTandaDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export function JoinTandaDialog({
  open,
  onOpenChange,
  presetAddress,
  presetId,
}: JoinDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <JoinContent
          key={open ? "open" : "closed"}
          presetAddress={presetAddress}
          presetId={presetId}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function JoinContent({
  presetAddress,
  presetId,
  onDone,
}: {
  presetAddress?: `0x${string}`;
  presetId?: bigint;
  onDone: () => void;
}) {
  const { address } = useAccount();
  const t = useT();
  const intervalLabel = useIntervalLabel();
  const [idInput, setIdInput] = useState(
    presetId != null ? String(presetId) : "",
  );

  const idIsValid = /^\d+$/.test(idInput) && Number(idInput) > 0;

  // Resolve tandaId -> clone address (skipped when a preset address is given).
  const { data: resolvedAddr, isLoading: resolving } = useReadContract({
    ...mitanda.manager,
    functionName: "tandaIdToAddress",
    args: idIsValid ? [BigInt(idInput)] : undefined,
    chainId: activeChain.id,
    query: { enabled: !presetAddress && idIsValid },
  });

  const target = presetAddress ?? (resolvedAddr as `0x${string}` | undefined);
  const targetIsReal = !!target && target !== zeroAddr;

  // Read the clone's terms.
  const termCalls = useMemo<ContractFunctionParameters[]>(() => {
    if (!targetIsReal) return [];
    const c = tandaContract(target!);
    return [
      { ...c, functionName: "state" },
      { ...c, functionName: "privacy" },
      { ...c, functionName: "contributionAmount" },
      { ...c, functionName: "payoutInterval" },
      { ...c, functionName: "participantCount" },
      { ...c, functionName: "activeParticipantCount" },
      { ...c, functionName: "isParticipant", args: [address ?? zeroAddr] },
      { ...c, functionName: "token" },
    ];
  }, [targetIsReal, target, address]);

  const { data: termData, isLoading: loadingTerms } = useReadContracts({
    contracts: termCalls,
    chainId: activeChain.id,
    query: { enabled: targetIsReal },
  });

  const terms = useMemo(() => {
    if (!termData || termData.length < 8) return null;
    const g = (i: number) => termData[i]?.result;
    return {
      state: Number(g(0) ?? 0) as TandaState,
      isPublic: Number(g(1) ?? 0) === 0,
      contribution: (g(2) as bigint) ?? 0n,
      interval: (g(3) as bigint) ?? 0n,
      participantCount: Number(g(4) ?? 0),
      activeCount: Number(g(5) ?? 0),
      alreadyJoined: g(6) === true,
      token: (g(7) as `0x${string}` | undefined) ?? undefined,
    };
  }, [termData]);

  // The tanda's own contribution token — render + pay in its symbol/decimals.
  const { token: tokenMeta } = useToken(terms?.token);
  const symbol = tokenMeta?.symbol ?? "";
  const decimals = tokenMeta?.decimals ?? 6;

  const perCycle = terms ? perCycleCharge(terms.contribution) : 0n;
  const slotsRemaining = terms
    ? terms.participantCount - terms.activeCount
    : 0;
  const isOpenState = terms?.state === TandaState.OPEN;
  const joinable =
    !!terms &&
    isOpenState &&
    terms.isPublic &&
    slotsRemaining > 0 &&
    !terms.alreadyJoined;

  const tx = useTwoStepTx({
    spender: target,
    requiredAmount: perCycle,
    token: terms?.token,
    action: joinable
      ? {
          address: target!,
          abi: tandaContract(target!).abi,
          functionName: "join",
          args: [],
        }
      : null,
  });

  // ── Panels ─────────────────────────────────────────────────────────────────
  if (tx.status === "success") {
    return (
      <SuccessPanel
        title={t("join.successTitle")}
        body={t("join.successBody")}
        hash={tx.actionHash}
        onDone={onDone}
      />
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
          <DialogTitle className="text-h2">{t("join.joiningTitle")}</DialogTitle>
          <DialogDescription>{t("join.joiningDesc")}</DialogDescription>
        </DialogHeader>
        <TwoStepProgress
          status={tx.status}
          errorPhase={tx.errorPhase}
          needsApproval={tx.needsApproval}
          actionLabel={t("join.joinPayAction")}
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
        <DialogTitle className="text-h2">{t("join.title")}</DialogTitle>
        <DialogDescription>
          {presetAddress ? t("join.descPreset") : t("join.descEnter")}
        </DialogDescription>
      </DialogHeader>

      {tx.status === "error" && tx.error && (
        <Banner tone="danger" icon={<AlertTriangle className="size-4" />}>
          {tx.error}
        </Banner>
      )}

      {/* ID entry (hidden when a specific tanda is preset) */}
      {!presetAddress && (
        <div className="space-y-1.5">
          <label className="text-caption font-semibold text-foreground">
            {t("join.idLabel")}
          </label>
          <input
            inputMode="numeric"
            placeholder="e.g. 1"
            value={idInput}
            onChange={(e) => setIdInput(e.target.value)}
            className="w-full rounded-btn border border-border bg-background px-3 py-2.5 text-body text-foreground outline-none transition-colors placeholder:text-foreground-subtle focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-accent dark:focus:ring-accent/20"
          />
          {idIsValid && resolving && (
            <p className="text-caption text-foreground-muted">{t("join.lookingUp")}</p>
          )}
          {idIsValid && !resolving && !targetIsReal && (
            <p className="text-caption text-danger">{t("join.noTanda")}</p>
          )}
        </div>
      )}

      {/* Terms */}
      {targetIsReal && loadingTerms && (
        <div className="flex items-center gap-2 rounded-btn bg-background-muted p-3 text-caption text-foreground-muted">
          <Loader2 className="size-4 animate-spin" /> {t("join.loadingTerms")}
        </div>
      )}

      {terms && (
        <>
          <div className="rounded-card bg-background-muted p-4">
            <div className="mb-2 flex items-center gap-1.5 text-caption font-semibold text-foreground">
              <Users className="size-3.5" />{" "}
              {t("join.terms", {
                n: presetId != null ? ` #${presetId}` : idInput ? ` #${idInput}` : "",
              })}
            </div>
            <dl className="grid grid-cols-2 gap-y-2 text-caption">
              <Term
                label={t("join.contribution")}
                value={`${fmtToken(terms.contribution, decimals)} ${symbol}`.trim()}
              />
              <Term label={t("join.interval")} value={intervalLabel(terms.interval)} />
              <Term label={t("join.participants")} value={`${terms.participantCount}`} />
              <Term
                label={t("join.slotsLeft")}
                value={t("join.slotsOf", { n: slotsRemaining, m: terms.participantCount })}
              />
            </dl>
          </div>

          {/* Status / blockers */}
          {terms.alreadyJoined ? (
            <Banner tone="muted" icon={<CheckCircle2 className="size-4" />}>
              {t("join.already")}
            </Banner>
          ) : !terms.isPublic ? (
            <Banner tone="muted" icon={<AlertTriangle className="size-4" />}>
              {t("join.privateBlock")}
            </Banner>
          ) : !isOpenState ? (
            <Banner tone="muted" icon={<AlertTriangle className="size-4" />}>
              {t("join.notOpen")}
            </Banner>
          ) : slotsRemaining <= 0 ? (
            <Banner tone="muted" icon={<AlertTriangle className="size-4" />}>
              {t("join.full")}
            </Banner>
          ) : (
            <>
              <div>
                <div className="mb-1.5 text-caption font-semibold text-foreground">
                  {t("join.payNow")}
                </div>
                <CostBreakdown
                  contribution={terms.contribution}
                  premium={premiumPerCycle(terms.contribution)}
                  total={perCycle}
                  symbol={symbol}
                  decimals={decimals}
                />
              </div>
              <GuardArea
                tx={tx}
                required={perCycle}
                actionLabel={t("join.joinPay")}
                symbol={symbol}
                decimals={decimals}
              />
            </>
          )}
        </>
      )}

      {!address && (
        <Banner tone="muted" icon={<Wallet className="size-4" />}>
          {t("join.connect")}
        </Banner>
      )}
    </div>
  );
}

function Term({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-foreground-subtle">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

function SuccessPanel({
  title,
  body,
  hash,
  onDone,
}: {
  title: string;
  body: string;
  hash?: `0x${string}`;
  onDone: () => void;
}) {
  const t = useT();
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <CheckCircle2 className="size-10 text-success" />
      <h2 className="text-h2">{title}</h2>
      <p className="max-w-xs text-body text-foreground-muted">{body}</p>
      {hash && (
        <a
          href={`${EXPLORER_TX}${hash}`}
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
