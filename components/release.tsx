"use client";

import { Loader2, CheckCircle2, Zap, Gift, AlertTriangle } from "lucide-react";

import { activeChain, fmtToken } from "@/lib/contracts";
import { EXPLORER_TX } from "@/lib/tx-error";
import { useReleasePayout } from "@/lib/hooks/use-release-payout";
import { useToken } from "@/lib/hooks/use-token";
import type { UserTanda } from "@/lib/hooks/use-user-tandas";

const short = (a: `0x${string}`) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/**
 * Surfaces tandas whose current cycle is due but un-triggered. `triggerPayout()`
 * is permissionless, but nothing in the app called it — so without this, a
 * cycle's pot would sit unsettled and the recipient would never see a Claim.
 *
 * The recipient (who gets the money) sees a prominent "release & claim" that
 * settles the cycle AND pulls the funds in one tap. Any other participant sees a
 * lighter "release this cycle's payout" fallback, since anyone can trigger it.
 */
export function ReleaseBanner({ tandas }: { tandas: UserTanda[] }) {
  const releasable = tandas.filter((t) => t.releasable);
  if (releasable.length === 0) return null;
  return (
    <div className="space-y-3">
      {releasable.map((t) =>
        t.isCurrentRecipient ? (
          <RecipientRelease key={t.id} tanda={t} />
        ) : (
          <FallbackRelease key={t.id} tanda={t} />
        ),
      )}
    </div>
  );
}

/** The recipient's prominent "release & claim" card. */
function RecipientRelease({ tanda }: { tanda: UserTanda }) {
  const { token: meta } = useToken(tanda.tokenAddress);
  const symbol = meta?.symbol ?? "";
  const decimals = meta?.decimals ?? 6;
  const amount = `${fmtToken(tanda.currentPayoutAmount, decimals)} ${symbol}`.trim();
  const r = useReleasePayout(tanda.address, { andClaim: true });

  const busy =
    r.status === "release-sign" ||
    r.status === "release-pending" ||
    r.status === "claim-sign" ||
    r.status === "claim-pending";
  const busyLabel =
    r.status === "release-sign"
      ? "Confirm release in your wallet…"
      : r.status === "release-pending"
        ? "Releasing your payout…"
        : r.status === "claim-sign"
          ? "Confirm claim in your wallet…"
          : "Sending to your wallet…";

  return (
    <div className="rounded-card border border-success/30 bg-success/10 p-5 shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-btn bg-success/15 text-success">
          <Gift className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-h3 text-foreground">Your payout is ready</h2>
          <p className="mt-0.5 text-caption text-foreground-muted">
            It&apos;s your turn for Tanda #{tanda.id} (cycle {tanda.currentCycle}).
            Release this cycle and we&apos;ll send {amount} straight to your wallet.
          </p>
        </div>
      </div>

      <div className="mt-4">
        {r.status === "success" ? (
          <ClaimedRow hash={r.claimHash} />
        ) : r.isWrongNetwork ? (
          <SwitchButton onClick={r.switchToActiveChain} isSwitching={r.isSwitching} solid />
        ) : (
          <button
            type="button"
            onClick={r.run}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-btn bg-success px-5 py-3.5 text-h3 text-white transition-colors hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {busyLabel}
              </>
            ) : (
              <>
                <Gift className="size-4" /> Release &amp; claim {amount}
              </>
            )}
          </button>
        )}
        {r.status === "error" && r.error && <ErrorLine text={r.error} />}
      </div>
    </div>
  );
}

/** The altruistic fallback any participant can use to settle the cycle. */
function FallbackRelease({ tanda }: { tanda: UserTanda }) {
  const { token: meta } = useToken(tanda.tokenAddress);
  const symbol = meta?.symbol ?? "";
  const decimals = meta?.decimals ?? 6;
  const amount = `${fmtToken(tanda.currentPayoutAmount, decimals)} ${symbol}`.trim();
  const r = useReleasePayout(tanda.address);

  const busy = r.status === "release-sign" || r.status === "release-pending";

  return (
    <div className="rounded-card border border-border bg-background-card p-5 shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-btn bg-accent-soft text-accent">
          <Zap className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-h3 text-foreground">This cycle&apos;s payout is ready</h2>
          <p className="mt-0.5 text-caption text-foreground-muted">
            Tanda #{tanda.id} cycle {tanda.currentCycle} can be paid out
            {tanda.currentRecipient ? ` to ${short(tanda.currentRecipient)}` : ""} (
            {amount}). Anyone can release it — they&apos;ll claim it themselves.
          </p>
        </div>
      </div>

      <div className="mt-4">
        {r.status === "success" ? (
          <div className="flex items-center justify-center gap-1.5 py-2 text-body font-semibold text-success">
            <CheckCircle2 className="size-4" /> Payout released
          </div>
        ) : r.isWrongNetwork ? (
          <SwitchButton onClick={r.switchToActiveChain} isSwitching={r.isSwitching} />
        ) : (
          <button
            type="button"
            onClick={r.run}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-btn border border-primary bg-transparent px-5 py-3 text-h3 text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-70 dark:border-accent dark:text-accent dark:hover:bg-accent/10"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {r.status === "release-sign" ? "Confirm in your wallet…" : "Releasing…"}
              </>
            ) : (
              "Release this cycle's payout"
            )}
          </button>
        )}
        {r.status === "error" && r.error && <ErrorLine text={r.error} />}
      </div>
    </div>
  );
}

function ClaimedRow({ hash }: { hash?: `0x${string}` }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-center gap-1.5 py-2 text-body font-semibold text-success">
        <CheckCircle2 className="size-4" /> Claimed!
      </div>
      {hash && (
        <a
          href={`${EXPLORER_TX}${hash}`}
          target="_blank"
          rel="noreferrer"
          className="block text-center font-mono text-caption text-accent underline"
        >
          View transaction
        </a>
      )}
    </div>
  );
}

function SwitchButton({
  onClick,
  isSwitching,
  solid,
}: {
  onClick: () => void;
  isSwitching: boolean;
  solid?: boolean;
}) {
  const cls = solid
    ? "flex w-full items-center justify-center gap-2 rounded-btn bg-success px-5 py-3.5 text-h3 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
    : "flex w-full items-center justify-center gap-2 rounded-btn border border-primary px-5 py-3 text-h3 text-primary transition-colors hover:bg-primary/5 disabled:opacity-70 dark:border-accent dark:text-accent";
  return (
    <button type="button" onClick={onClick} disabled={isSwitching} className={cls}>
      {isSwitching && <Loader2 className="size-4 animate-spin" />}
      Switch to {activeChain.name}
    </button>
  );
}

function ErrorLine({ text }: { text: string }) {
  return (
    <p className="mt-2 flex items-center gap-1 text-caption text-danger">
      <AlertTriangle className="size-3.5 shrink-0" /> {text}
    </p>
  );
}
