"use client";

import { useMemo, useState } from "react";
import { Plus, Loader2, CheckCircle2, AlertTriangle, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ActionButton } from "@/components/mt/action-button";
import { JoinTandaDialog } from "@/components/join-tanda-dialog";
import { InviteGeneratorDialog } from "@/components/invite-generator-dialog";
import { ShareLinkBox } from "@/components/share-link";
import {
  activeChain,
  fmtToken,
  perCycleCharge,
  premiumPerCycle,
} from "@/lib/contracts";
import { useAllowedTokens, type TokenMeta } from "@/lib/hooks/use-token";
import { EXPLORER_TX } from "@/lib/tx-error";
import {
  initialFormState,
  validateCreateTanda,
  minScheduledLocal,
  BOUNDS,
  type CreateTandaFormState,
} from "@/lib/tanda-form";

/** Friendly duration: total length = totalCycles × intervalDays. */
function humanizeDays(totalDays: number, t: TFn): string {
  if (totalDays % 30 === 0) {
    const m = totalDays / 30;
    return t(m === 1 ? "create.durMonth" : "create.durMonths", { n: m });
  }
  if (totalDays % 7 === 0) {
    const w = totalDays / 7;
    return t(w === 1 ? "create.durWeek" : "create.durWeeks", { n: w });
  }
  return t("create.durDays", { n: totalDays });
}

/**
 * Live, contract-accurate summary. Total length is derived purely from the
 * participant count (one cycle per member, each receives the pot once — there
 * is no separate cycles parameter). A member pays the contribution + 10%
 * insurance premium every cycle for the whole tanda.
 */
function computeSummary(form: CreateTandaFormState, decimals: number) {
  const participants = Number(form.participants);
  const intervalDays = Number(form.intervalDays);
  if (
    !/^\d+$/.test(form.participants) ||
    !/^\d+$/.test(form.intervalDays) ||
    participants < BOUNDS.participants.min ||
    participants > BOUNDS.participants.max ||
    intervalDays < BOUNDS.intervalDays.min ||
    intervalDays > BOUNDS.intervalDays.max
  ) {
    return null;
  }
  let contribution = 0n;
  try {
    if (!/^\d*\.?\d*$/.test(form.contribution) || form.contribution.trim() === "")
      return { participants, intervalDays, contribution: null as bigint | null };
    contribution = parseUnits(form.contribution, decimals);
  } catch {
    return { participants, intervalDays, contribution: null as bigint | null };
  }
  return { participants, intervalDays, contribution };
}
import { useCreateTanda } from "@/lib/hooks/use-create-tanda";
import { useT } from "@/lib/i18n";
import type { TKey } from "@/lib/i18n/dict";

type TFn = (key: TKey, vars?: Record<string, string | number>) => string;

type Touched = Partial<Record<keyof CreateTandaFormState, boolean>>;

const INTERVAL_PRESETS = [
  { key: "interval.weekly", days: "7" },
  { key: "interval.biweekly", days: "14" },
  { key: "interval.monthly", days: "30" },
] as const;

/** "Create tanda" button that opens the create-tanda modal. */
export function CreateTandaButton() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [joinTarget, setJoinTarget] = useState<{
    address: `0x${string}`;
    id?: bigint;
  } | null>(null);
  const [inviteTarget, setInviteTarget] = useState<{
    address: `0x${string}`;
    id: bigint;
  } | null>(null);

  return (
    <>
      <ActionButton
        variant="primary"
        icon={<Plus className="size-5" />}
        onClick={() => setOpen(true)}
      >
        {t("create.btn")}
      </ActionButton>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <CreateTandaContent
            key={open ? "open" : "closed"}
            onDone={() => setOpen(false)}
            onJoin={(address, id) => {
              setOpen(false);
              setJoinTarget({ address, id });
            }}
            onInvite={(address, id) => {
              setOpen(false);
              setInviteTarget({ address, id });
            }}
          />
        </DialogContent>
      </Dialog>
      {joinTarget && (
        <JoinTandaDialog
          open={!!joinTarget}
          onOpenChange={(o) => {
            if (!o) setJoinTarget(null);
          }}
          presetAddress={joinTarget.address}
          presetId={joinTarget.id}
        />
      )}
      {inviteTarget && (
        <InviteGeneratorDialog
          open={!!inviteTarget}
          onOpenChange={(o) => {
            if (!o) setInviteTarget(null);
          }}
          tandaAddress={inviteTarget.address}
          tandaId={inviteTarget.id}
        />
      )}
    </>
  );
}

function CreateTandaContent({
  onDone,
  onJoin,
  onInvite,
}: {
  onDone: () => void;
  onJoin: (address: `0x${string}`, id?: bigint) => void;
  onInvite: (address: `0x${string}`, id: bigint) => void;
}) {
  const { isConnected } = useAccount();
  const t = useT();
  const [form, setForm] = useState<CreateTandaFormState>(initialFormState);
  const [touched, setTouched] = useState<Touched>({});
  const [attempted, setAttempted] = useState(false);

  // Token allowlist (Manager.getAllowedTokens), enriched with symbol/decimals
  // read on-chain. The picker is populated from this — no hardcoded token.
  const { tokens, isLoading: loadingTokens } = useAllowedTokens();
  const [tokenAddr, setTokenAddr] = useState<`0x${string}` | null>(null);
  const selectedToken: TokenMeta | null =
    tokens.find((t) => t.address === tokenAddr) ?? tokens[0] ?? null;
  const decimals = selectedToken?.decimals ?? 6;
  const symbol = selectedToken?.symbol ?? "";
  const fmt = (v: bigint) => fmtToken(v, decimals);

  const { errors, args } = useMemo(
    () => validateCreateTanda(form, decimals),
    [form, decimals],
  );
  const summary = useMemo(
    () => computeSummary(form, decimals),
    [form, decimals],
  );

  // Charge-at-create: the creator pays their first cycle (contribution +
  // premium) at create, so the Create flow is approve(Manager) → createTanda.
  const firstCharge = args ? perCycleCharge(args.contributionAmount) : 0n;
  const create = useCreateTanda({
    token: selectedToken?.address,
    charge: firstCharge,
  });

  const showErr = (k: keyof CreateTandaFormState) =>
    (attempted || touched[k]) && errors[k];

  const set = (k: keyof CreateTandaFormState, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));
  const blur = (k: keyof CreateTandaFormState) =>
    setTouched((t) => ({ ...t, [k]: true }));

  function onSubmit() {
    setAttempted(true);
    if (!args || !selectedToken) return;
    create.submit(args, selectedToken.address);
  }

  // ── Status panels ────────────────────────────────────────────────────────
  if (create.status === "success") {
    return (
      <SuccessPanel
        create={create}
        isPrivate={form.privacy === "private"}
        onDone={onDone}
        onJoin={onJoin}
        onInvite={onInvite}
      />
    );
  }
  if (create.status !== "idle" && create.status !== "error") {
    return (
      <PendingPanel status={create.status} hash={create.hash} symbol={symbol} />
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-h2">{t("create.title")}</DialogTitle>
        <DialogDescription>
          {t("create.desc", { chain: activeChain.name })}
        </DialogDescription>
      </DialogHeader>

      {create.status === "error" && create.error && (
        <Banner tone="danger" icon={<AlertTriangle className="size-4" />}>
          {create.error}
        </Banner>
      )}

      <div className="space-y-4">
        {/* Contribution */}
        <Field
          label={t("create.contribution")}
          hint={symbol ? t("create.inSym", { sym: symbol }) : undefined}
          error={showErr("contribution")}
        >
          <div className="relative">
            <input
              inputMode="decimal"
              placeholder="10"
              value={form.contribution}
              onChange={(e) => set("contribution", e.target.value)}
              onBlur={() => blur("contribution")}
              className={inputCls(!!showErr("contribution"))}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-caption font-medium text-foreground-muted">
              {symbol || "—"}
            </span>
          </div>
        </Field>

        {/* Payout interval */}
        <Field
          label={t("create.interval")}
          hint={t("create.daysRange", {
            min: BOUNDS.intervalDays.min,
            max: BOUNDS.intervalDays.max,
          })}
          error={showErr("intervalDays")}
        >
          <div className="mb-2 flex gap-1.5">
            {INTERVAL_PRESETS.map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => set("intervalDays", p.days)}
                className={chipCls(form.intervalDays === p.days)}
              >
                {t(p.key)}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              inputMode="numeric"
              value={form.intervalDays}
              onChange={(e) => set("intervalDays", e.target.value)}
              onBlur={() => blur("intervalDays")}
              className={inputCls(!!showErr("intervalDays"))}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-caption font-medium text-foreground-muted">
              {t("create.days")}
            </span>
          </div>
        </Field>

        {/* Participants */}
        <Field
          label={t("create.participants")}
          hint={`${BOUNDS.participants.min}–${BOUNDS.participants.max}`}
          error={showErr("participants")}
        >
          <input
            inputMode="numeric"
            value={form.participants}
            onChange={(e) => set("participants", e.target.value)}
            onBlur={() => blur("participants")}
            className={inputCls(!!showErr("participants"))}
          />
        </Field>

        {/* Grace period */}
        <Field
          label={t("create.grace")}
          hint={t("create.graceHint", {
            min: BOUNDS.graceDays.min,
            max: BOUNDS.graceDays.max,
          })}
          error={showErr("graceDays")}
        >
          <div className="relative">
            <input
              inputMode="numeric"
              value={form.graceDays}
              onChange={(e) => set("graceDays", e.target.value)}
              onBlur={() => blur("graceDays")}
              className={inputCls(!!showErr("graceDays"))}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-caption font-medium text-foreground-muted">
              {t("create.days")}
            </span>
          </div>
        </Field>

        {/* Start */}
        <Field label={t("create.start")} error={showErr("scheduledLocal")}>
          <div className="mb-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => set("startMode", "auto")}
              className={chipCls(form.startMode === "auto")}
            >
              {t("create.whenFull")}
            </button>
            <button
              type="button"
              onClick={() => set("startMode", "scheduled")}
              className={chipCls(form.startMode === "scheduled")}
            >
              {t("create.scheduled")}
            </button>
          </div>
          {form.startMode === "scheduled" && (
            <input
              type="datetime-local"
              min={minScheduledLocal()}
              value={form.scheduledLocal}
              onChange={(e) => set("scheduledLocal", e.target.value)}
              onBlur={() => blur("scheduledLocal")}
              className={inputCls(!!showErr("scheduledLocal"))}
            />
          )}
          {form.startMode === "auto" && (
            <p className="text-caption text-foreground-muted">
              {t("create.autoBody")}
            </p>
          )}
        </Field>

        {/* Privacy (live) */}
        <Field
          label={t("create.privacy")}
          hint={form.privacy === "private" ? t("create.inviteOnly") : t("create.anyoneJoin")}
        >
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => set("privacy", "public")}
              className={chipCls(form.privacy === "public")}
            >
              {t("create.public")}
            </button>
            <button
              type="button"
              onClick={() => set("privacy", "private")}
              className={chipCls(form.privacy === "private")}
            >
              {t("create.privateOpt")}
            </button>
          </div>
          {form.privacy === "private" && (
            <p className="text-caption text-foreground-muted">
              {t("create.privateHelp")}
            </p>
          )}
        </Field>

        {/* Token (picker from the Manager allowlist) */}
        <Field label={t("create.token")} hint={t("create.tokenHint")}>
          {loadingTokens ? (
            <div className="flex items-center gap-2 rounded-btn border border-border bg-background-muted px-3 py-2.5 text-caption text-foreground-muted">
              <Loader2 className="size-4 animate-spin" /> {t("create.loadingTokens")}
            </div>
          ) : tokens.length === 0 ? (
            <Banner tone="danger" icon={<AlertTriangle className="size-4" />}>
              {t("create.noTokens")}
            </Banner>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {tokens.map((t) => (
                <button
                  key={t.address}
                  type="button"
                  onClick={() => setTokenAddr(t.address)}
                  className={chipCls(selectedToken?.address === t.address)}
                >
                  {t.symbol || `${t.address.slice(0, 6)}…`}
                </button>
              ))}
            </div>
          )}
        </Field>
      </div>

      {/* Live duration / cost summary */}
      {summary && (
        <div className="rounded-btn bg-accent-soft p-3 text-caption text-foreground">
          <p>
            {t("create.summaryRuns", {
              n: summary.participants,
              dur: humanizeDays(summary.participants * summary.intervalDays, t),
            })}
          </p>
          {summary.contribution != null && summary.contribution > 0n && (
            <>
              <p className="mt-1 text-foreground-muted">
                {t("create.summaryCharged", {
                  total: fmt(perCycleCharge(summary.contribution)),
                  sym: symbol,
                  contrib: fmt(summary.contribution),
                  prem: fmt(premiumPerCycle(summary.contribution)),
                })}
              </p>
              <p className="mt-1 text-foreground-muted">
                {t("create.summaryTotal", {
                  total: fmt(
                    perCycleCharge(summary.contribution) * BigInt(summary.participants),
                  ),
                  sym: symbol,
                  n: summary.participants,
                })}
              </p>
            </>
          )}
        </div>
      )}

      {/* Submit / guards */}
      <div className="space-y-2 pt-1">
        {!isConnected ? (
          <Banner tone="muted" icon={<Wallet className="size-4" />}>
            {t("create.connect")}
          </Banner>
        ) : create.isWrongNetwork ? (
          <button
            type="button"
            onClick={create.switchToActiveChain}
            disabled={create.isSwitching}
            className="flex w-full items-center justify-center gap-2 rounded-btn bg-primary px-5 py-3.5 text-h3 text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {create.isSwitching && <Loader2 className="size-4 animate-spin" />}
            {t("common.switchTo", { chain: activeChain.name })}
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={attempted && !args}
            className="flex w-full items-center justify-center gap-2 rounded-btn bg-primary px-5 py-3.5 text-h3 text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="size-5" />
            {t("create.createBtn")}
          </button>
        )}
      </div>
    </div>
  );
}

function PendingPanel({
  status,
  hash,
  symbol,
}: {
  status: "approve-signing" | "approve-pending" | "signing" | "pending";
  hash?: `0x${string}`;
  symbol: string;
}) {
  const t = useT();
  const heading =
    status === "approve-signing"
      ? t("create.approveSign", { sym: symbol })
      : status === "approve-pending"
        ? t("create.approving", { sym: symbol })
        : status === "signing"
          ? t("create.signing")
          : t("create.creating");
  const body =
    status === "approve-signing"
      ? t("create.approveSignBody", { sym: symbol })
      : status === "approve-pending"
        ? t("create.approvingBody", { chain: activeChain.name })
        : status === "signing"
          ? t("create.signingBody")
          : t("create.creatingBody", { chain: activeChain.name });
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <Loader2 className="size-10 animate-spin text-primary dark:text-accent" />
      <h2 className="text-h2">{heading}</h2>
      <p className="max-w-xs text-body text-foreground-muted">{body}</p>
      {hash && (
        <a
          href={`${EXPLORER_TX}${hash}`}
          target="_blank"
          rel="noreferrer"
          className="break-all font-mono text-caption text-accent underline"
        >
          {hash.slice(0, 10)}…{hash.slice(-8)}
        </a>
      )}
    </div>
  );
}

function SuccessPanel({
  create,
  isPrivate,
  onDone,
  onJoin,
  onInvite,
}: {
  create: ReturnType<typeof useCreateTanda>;
  isPrivate: boolean;
  onDone: () => void;
  onJoin: (address: `0x${string}`, id?: bigint) => void;
  onInvite: (address: `0x${string}`, id: bigint) => void;
}) {
  const t = useT();
  const addr = create.createdTandaAddress;
  const id = create.createdTandaId;
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <CheckCircle2 className="size-10 text-success" />
      <h2 className="text-h2">
        {t("create.createdTitle", { n: id != null ? ` #${id}` : "" })}
      </h2>
      {/* Charge-at-create: the creator is already enrolled (cycle 1 paid). */}
      <p className="max-w-xs text-body text-foreground-muted">
        {isPrivate ? t("create.createdPrivate") : t("create.createdPublic")}
      </p>
      {create.hash && (
        <a
          href={`${EXPLORER_TX}${create.hash}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-caption text-accent underline"
        >
          {t("common.viewTx")}
        </a>
      )}
      <div className="mt-2 w-full space-y-2">
        {id != null && (
          <div className="space-y-1.5 text-left">
            <div className="text-caption font-semibold text-foreground">
              {isPrivate ? t("create.sharePrivate") : t("create.sharePublic")}
            </div>
            <ShareLinkBox tandaId={id} />
          </div>
        )}
        {isPrivate && (
          <button
            type="button"
            disabled={!addr || id == null}
            onClick={() => addr && id != null && onInvite(addr, id)}
            className="flex w-full items-center justify-center rounded-btn border border-border px-5 py-2.5 text-caption font-medium text-foreground-muted transition-colors hover:bg-background-muted disabled:opacity-60"
          >
            {t("create.advancedInvite")}
          </button>
        )}
        <button
          type="button"
          onClick={onDone}
          className="flex w-full items-center justify-center rounded-btn bg-primary px-5 py-3 text-h3 text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          {t("create.goToDashboard")}
        </button>
      </div>
    </div>
  );
}

// ── Small styled building blocks ────────────────────────────────────────────

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | false;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-caption font-semibold text-foreground">
          {label}
        </label>
        {hint && <span className="text-caption text-foreground-subtle">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-caption text-danger">{error}</p>}
    </div>
  );
}

function Banner({
  tone,
  icon,
  children,
}: {
  tone: "danger" | "muted";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const cls =
    tone === "danger"
      ? "bg-danger/10 text-danger"
      : "bg-background-muted text-foreground-muted";
  return (
    <div className={`flex items-start gap-2 rounded-btn p-3 text-caption ${cls}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

const inputCls = (hasError: boolean) =>
  `w-full rounded-btn border bg-background px-3 py-2.5 text-body text-foreground outline-none transition-colors placeholder:text-foreground-subtle focus:ring-2 ${
    hasError
      ? "border-danger focus:ring-danger/30"
      : "border-border focus:border-primary focus:ring-primary/20 dark:focus:border-accent dark:focus:ring-accent/20"
  }`;

const chipCls = (active: boolean) =>
  `rounded-pill px-3 py-1.5 text-caption font-medium transition-colors ${
    active
      ? "bg-primary text-primary-foreground dark:bg-accent dark:text-primary-foreground"
      : "bg-background-muted text-foreground-muted hover:bg-border-soft"
  }`;
