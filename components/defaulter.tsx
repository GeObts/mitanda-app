"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Loader2, Clock, ShieldCheck, AlertTriangle } from "lucide-react";

import { activeChain } from "@/lib/contracts";
import { useMarkDefaulter } from "@/lib/hooks/use-mark-defaulter";
import type { UserTanda, UnpaidParticipant } from "@/lib/hooks/use-user-tandas";

const short = (a: `0x${string}`) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** Friendly "grace ends …" label. In a module helper so the impure clock read
 * stays out of the render body (re-evaluated whenever the dashboard re-renders). */
function graceLabel(unixSec: number): string {
  const diffMs = unixSec * 1000 - Date.now();
  if (diffMs <= 0) return "now";
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `in ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `in ${hrs} hour${hrs === 1 ? "" : "s"}`;
  const days = Math.round(hrs / 24);
  return `in ${days} day${days === 1 ? "" : "s"}`;
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
            {anyPastGrace
              ? "A payment is holding up the payout"
              : "Waiting on a payment"}
          </h2>
          <p className="mt-0.5 text-caption text-foreground-muted">
            Tanda #{tanda.id} cycle {tanda.currentCycle}{" "}
            can&apos;t pay out until everyone&apos;s paid in.{" "}
            {anyPastGrace
              ? "The grace period has passed — you can step in to keep things moving. Their insurance deposit covers the shortfall, so the honest members stay whole."
              : "Give them a little longer to pay before anyone needs to step in."}
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
                    <span className="font-mono">{short(u.address)}</span> missed
                    cycle {tanda.currentCycle} and the grace period has passed.
                  </div>
                  {m.isWrongNetwork ? (
                    <button
                      type="button"
                      onClick={m.switchToActiveChain}
                      disabled={m.isSwitching}
                      className="flex w-full items-center justify-center gap-2 rounded-btn bg-primary px-5 py-2.5 text-caption font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-70"
                    >
                      {m.isSwitching && <Loader2 className="size-4 animate-spin" />}
                      Switch to {activeChain.name}
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
                          {m.status === "signing" ? "Confirm in your wallet…" : "Marking…"}
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="size-4" />
                          Mark {short(u.address)} as defaulter
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-caption text-foreground-muted">
                  <Clock className="size-3.5 shrink-0 text-warning" />
                  <span>
                    Waiting on <span className="font-mono">{short(u.address)}</span>{" "}
                    to pay cycle {tanda.currentCycle} — grace period ends{" "}
                    {graceLabel(u.graceExpiresAt)}.
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
