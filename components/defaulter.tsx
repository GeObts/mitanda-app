"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Loader2, Clock, ShieldCheck, AlertTriangle } from "lucide-react";

import { activeChain } from "@/lib/contracts";
import { useMarkDefaulter } from "@/lib/hooks/use-mark-defaulter";
import type { UserTanda, UnpaidParticipant } from "@/lib/hooks/use-user-tandas";
import { useT } from "@/lib/i18n";
import type { TKey } from "@/lib/i18n/dict";

const short = (a: `0x${string}`) => `${a.slice(0, 6)}…${a.slice(-4)}`;

type TFn = (key: TKey, vars?: Record<string, string | number>) => string;

/** Friendly "grace ends …" label (translated). */
function graceLabel(unixSec: number, t: TFn): string {
  const diffMs = unixSec * 1000 - Date.now();
  if (diffMs <= 0) return t("grace.now");
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return t("grace.inMin", { n: mins });
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return t(hrs === 1 ? "grace.inHour" : "grace.inHours", { n: hrs });
  const days = Math.round(hrs / 24);
  return t(days === 1 ? "grace.inDay" : "grace.inDays", { n: days });
}

/**
 * When a cycle is due but a member hasn't paid, the release button stays hidden.
 * This surfaces that block: within grace it's informational; once grace expires
 * it offers the permissionless `markDefaulter` action that removes the unpaid
 * member, covers the gap from their insurance deposit, and unblocks the payout.
 * Shown to any participant (it's permissionless) but excludes the viewer if it's
 * their own missed payment — that's handled by their own Pay control.
 */
export function DefaulterBanner({ tandas }: { tandas: UserTanda[] }) {
  const { address } = useAccount();
  const blocked = tandas
    .map((t) => ({
      tanda: t,
      others: t.unpaidActive.filter(
        (u) => u.address.toLowerCase() !== address?.toLowerCase(),
      ),
    }))
    .filter((x) => x.others.length > 0);

  if (blocked.length === 0) return null;
  return (
    <div className="space-y-3">
      {blocked.map(({ tanda, others }) => (
        <DefaulterCard key={tanda.id} tanda={tanda} unpaid={others} />
      ))}
    </div>
  );
}

function DefaulterCard({
  tanda,
  unpaid,
}: {
  tanda: UserTanda;
  unpaid: UnpaidParticipant[];
}) {
  const t = useT();
  const m = useMarkDefaulter(tanda.address);
  const [target, setTarget] = useState<`0x${string}` | null>(null);
  const anyPastGrace = unpaid.some((u) => u.pastGrace);

  return (
    <div className="rounded-card border border-warning/40 bg-warning/10 p-5 shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-btn bg-warning/25 text-foreground">
          <AlertTriangle className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-h3 text-foreground">
            {anyPastGrace ? t("def.holdTitle") : t("def.waitTitle")}
          </h2>
          <p className="mt-0.5 text-caption text-foreground-muted">
            {anyPastGrace
              ? t("def.holdBody", { id: tanda.id, cycle: tanda.currentCycle })
              : t("def.waitBody", { id: tanda.id, cycle: tanda.currentCycle })}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {unpaid.map((u) => {
          const busy =
            (m.status === "signing" || m.status === "pending") &&
            target?.toLowerCase() === u.address.toLowerCase();
          return (
            <li
              key={u.address}
              className="rounded-btn bg-background-card px-3 py-2.5"
            >
              {u.pastGrace ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-caption text-foreground-muted">
                    <Clock className="size-3.5 shrink-0" />
                    {t("def.missed", {
                      addr: short(u.address),
                      cycle: tanda.currentCycle,
                    })}
                  </div>
                  {m.isWrongNetwork ? (
                    <button
                      type="button"
                      onClick={m.switchToActiveChain}
                      disabled={m.isSwitching}
                      className="flex w-full items-center justify-center gap-2 rounded-btn bg-primary px-5 py-2.5 text-caption font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-70"
                    >
                      {m.isSwitching && <Loader2 className="size-4 animate-spin" />}
                      {t("common.switchTo", { chain: activeChain.name })}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTarget(u.address);
                        m.mark(u.address);
                      }}
                      disabled={busy}
                      className="flex w-full items-center justify-center gap-2 rounded-btn bg-primary px-5 py-2.5 text-caption font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {busy ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          {m.status === "signing" ? t("common.confirmWallet") : t("def.marking")}
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="size-4" />
                          {t("def.markBtn", { addr: short(u.address) })}
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-caption text-foreground-muted">
                  <Clock className="size-3.5 shrink-0 text-warning" />
                  <span>
                    {t("def.waiting", {
                      addr: short(u.address),
                      cycle: tanda.currentCycle,
                      when: graceLabel(u.graceExpiresAt, t),
                    })}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {m.status === "error" && m.error && (
        <p className="mt-2 flex items-center gap-1 text-caption text-danger">
          <AlertTriangle className="size-3.5 shrink-0" /> {m.error}
        </p>
      )}
    </div>
  );
}
