"use client";

import Link from "next/link";
import { Users, Clock, Gift, ArrowRight } from "lucide-react";

import { fmtToken, TandaState } from "@/lib/contracts";
import { useToken } from "@/lib/hooks/use-token";
import type { UserTanda } from "@/lib/hooks/use-user-tandas";
import { ClaimButton } from "@/components/claim";
import { PayTandaButton } from "@/components/pay-tanda-dialog";
import { useT, useIntervalLabel } from "@/lib/i18n";
import type { TKey } from "@/lib/i18n/dict";

const STATE_META: Record<TandaState, { key: TKey; cls: string }> = {
  [TandaState.OPEN]: {
    key: "status.filling",
    cls: "bg-primary-soft text-primary dark:text-accent",
  },
  [TandaState.ACTIVE]: {
    key: "status.active",
    cls: "bg-success/15 text-success",
  },
  [TandaState.COMPLETED]: {
    key: "status.completed",
    cls: "bg-background-muted text-foreground-muted",
  },
};

/**
 * One card in the "Your tandas" grid: a compact summary of a tanda the user is
 * in (joined or created), with the inline actions that apply right now — claim
 * a ready payout, or pay the current cycle. Reused at every breakpoint; the
 * grid around it controls the columns.
 */
export function TandaSummaryCard({ tanda }: { tanda: UserTanda }) {
  const t = useT();
  const intervalLabel = useIntervalLabel();
  const { token } = useToken(tanda.tokenAddress);
  const symbol = token?.symbol ?? "";
  const decimals = token?.decimals ?? 6;

  const meta = STATE_META[tanda.state];
  const cyclesPct =
    tanda.totalCycles > 0
      ? Math.round((tanda.cyclesCompleted / tanda.totalCycles) * 100)
      : 0;
  const fullyPaid = tanda.nextDueCycle == null;

  return (
    <div className="flex flex-col rounded-card border border-transparent bg-background-card p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <span className="text-h3 text-foreground">Tanda #{tanda.id}</span>
        <span
          className={`rounded-pill px-2.5 py-0.5 text-caption font-medium ${meta.cls}`}
        >
          {t(meta.key)}
        </span>
      </div>

      <div className="mt-3">
        <div className="text-caption text-foreground-subtle">
          {t("card.contributionPerRound")}
        </div>
        <div className="text-h2 text-foreground">
          {fmtToken(tanda.contributionAmount, decimals)}{" "}
          <span className="text-h3 text-foreground-muted">{symbol}</span>
        </div>
      </div>

      <dl className="mt-3 space-y-2 text-caption">
        <Row
          icon={<Clock className="size-3.5" />}
          label={t("card.payout")}
          value={intervalLabel(tanda.payoutInterval)}
        />
        <Row
          icon={<Users className="size-3.5" />}
          label={t("card.yourStatus")}
          value={t(tanda.isActive ? "card.activeMember" : "card.member")}
        />
      </dl>

      {/* Cycle progress (ACTIVE/COMPLETED). */}
      {tanda.state !== TandaState.OPEN && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-caption text-foreground-subtle">
            <span>{t("card.roundsPaidOut")}</span>
            <span className="font-medium text-foreground">
              {tanda.cyclesCompleted}/{tanda.totalCycles}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-pill bg-background-muted">
            <div
              className="h-full rounded-pill bg-primary dark:bg-accent"
              style={{ width: `${cyclesPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Inline actions — pushed to the bottom of the card. */}
      <div className="mt-auto space-y-2 pt-4">
        {tanda.claimable > 0n && (
          <div className="flex items-center gap-1.5 rounded-btn bg-success/10 px-3 py-2 text-caption font-medium text-success">
            <Gift className="size-3.5" />
            {t("common.readyToClaim", {
              amt: fmtToken(tanda.claimable, decimals),
              sym: symbol,
            })}
          </div>
        )}
        {tanda.claimable > 0n && (
          <ClaimButton
            tandaAddress={tanda.address}
            amount={tanda.claimable}
            token={tanda.tokenAddress}
            variant="compact"
          />
        )}
        {tanda.state === TandaState.ACTIVE && !fullyPaid && (
          <PayTandaButton
            tanda={{
              address: tanda.address,
              contribution: tanda.contributionAmount,
              paidUntilCycle: tanda.paidUntilCycle,
              totalCycles: tanda.totalCycles,
              token: tanda.tokenAddress,
              state: tanda.state,
            }}
          />
        )}
        {tanda.state === TandaState.ACTIVE && fullyPaid && tanda.claimable === 0n && (
          <div className="rounded-btn bg-background-muted px-3 py-2 text-center text-caption font-medium text-foreground-muted">
            {t("card.paidUp")}
          </div>
        )}
        {tanda.state === TandaState.OPEN && (
          <div className="rounded-btn bg-background-muted px-3 py-2 text-center text-caption font-medium text-foreground-muted">
            {t("card.waitingFill")}
          </div>
        )}
        <Link
          href={`/tandas/${tanda.id}`}
          prefetch
          className="flex w-full items-center justify-center gap-1.5 rounded-btn border border-border px-4 py-2.5 text-caption font-semibold text-foreground transition-colors hover:bg-background-muted"
        >
          {t("card.viewCircle")}
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-foreground-subtle">
        {icon}
        {label}
      </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
