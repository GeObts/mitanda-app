"use client";

import { Loader2, CheckCircle2, Gift, AlertTriangle } from "lucide-react";

import { activeChain, fmtToken } from "@/lib/contracts";
import { EXPLORER_TX } from "@/lib/tx-error";
import { useWithdraw } from "@/lib/hooks/use-withdraw";
import { useToken } from "@/lib/hooks/use-token";
import type { UserTanda } from "@/lib/hooks/use-user-tandas";
import { useT } from "@/lib/i18n";

/**
 * One-tap pull-payment claim. Sends `withdraw()` on the tanda clone (single tx,
 * no approval) and refreshes the balance to zero on success.
 */
export function ClaimButton({
  tandaAddress,
  amount,
  token,
  variant = "primary",
}: {
  tandaAddress: `0x${string}`;
  amount: bigint;
  token: `0x${string}`;
  variant?: "primary" | "compact";
}) {
  const { token: meta } = useToken(token);
  const symbol = meta?.symbol ?? "";
  const decimals = meta?.decimals ?? 6;
  const w = useWithdraw(tandaAddress);
  const t = useT();

  const amountLabel = `${fmtToken(amount, decimals)} ${symbol}`.trim();
  const compact = variant === "compact";
  const base = compact
    ? "flex items-center justify-center gap-1.5 rounded-btn px-4 py-2.5 text-caption font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
    : "flex w-full items-center justify-center gap-2 rounded-btn px-5 py-3.5 text-h3 transition-colors disabled:cursor-not-allowed disabled:opacity-60";
  const solid = `${base} bg-success text-white hover:bg-success/90`;

  if (w.status === "success") {
    return (
      <div className={compact ? "flex items-center gap-1.5" : "space-y-1.5"}>
        <div
          className={`flex items-center justify-center gap-1.5 ${
            compact ? "text-caption" : "py-2 text-body"
          } font-semibold text-success`}
        >
          <CheckCircle2 className="size-4" /> {t("claim.claimed")}
        </div>
        {w.hash && !compact && (
          <a
            href={`${EXPLORER_TX}${w.hash}`}
            target="_blank"
            rel="noreferrer"
            className="block text-center font-mono text-caption text-accent underline"
          >
            {t("common.viewTx")}
          </a>
        )}
      </div>
    );
  }

  if (w.status === "signing" || w.status === "pending") {
    return (
      <button type="button" disabled className={solid}>
        <Loader2 className="size-4 animate-spin" />
        {w.status === "signing" ? t("common.confirmWallet") : t("claim.claiming")}
      </button>
    );
  }

  if (w.isWrongNetwork) {
    return (
      <button
        type="button"
        onClick={w.switchToActiveChain}
        disabled={w.isSwitching}
        className={solid}
      >
        {w.isSwitching && <Loader2 className="size-4 animate-spin" />}
        {t("common.switchTo", { chain: activeChain.name })}
      </button>
    );
  }

  return (
    <div className={compact ? "" : "space-y-1.5"}>
      <button type="button" onClick={w.claim} className={solid}>
        <Gift className="size-4" />
        {t("claim.claimAmt", { amt: amountLabel })}
      </button>
      {w.status === "error" && w.error && (
        <p
          className={`flex items-center gap-1 text-caption text-danger ${
            compact ? "mt-1" : ""
          }`}
        >
          <AlertTriangle className="size-3.5 shrink-0" /> {w.error}
        </p>
      )}
    </div>
  );
}

/**
 * Dashboard banner summarizing claimable funds across every tanda the user is
 * in, with a one-tap Claim button per tanda. Renders nothing when there's
 * nothing to claim.
 */
export function ClaimBanner({ tandas }: { tandas: UserTanda[] }) {
  const t = useT();
  const claimable = tandas.filter((x) => x.claimable > 0n);
  if (claimable.length === 0) return null;

  return (
    <div className="rounded-card border border-success/30 bg-success/10 p-5 shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-btn bg-success/15 text-success">
          <Gift className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-h3 text-foreground">{t("claim.readyTitle")}</h2>
          <p className="mt-0.5 text-caption text-foreground-muted">
            {claimable.length === 1
              ? t("claim.readyBodyOne")
              : t("claim.readyBodyMany", { n: claimable.length })}
          </p>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {claimable.map((x) => (
          <ClaimRow key={x.id} tanda={x} />
        ))}
      </ul>
    </div>
  );
}

function ClaimRow({ tanda }: { tanda: UserTanda }) {
  const { token: meta } = useToken(tanda.tokenAddress);
  const symbol = meta?.symbol ?? "";
  const decimals = meta?.decimals ?? 6;
  const t = useT();
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-btn bg-background-card px-3 py-2.5">
      <div className="min-w-0">
        <div className="text-body font-semibold text-foreground">
          Tanda #{tanda.id}
        </div>
        <div className="text-caption text-foreground-muted">
          {t("claim.tandaReady", {
            amt: fmtToken(tanda.claimable, decimals),
            sym: symbol,
          })}
        </div>
      </div>
      <ClaimButton
        tandaAddress={tanda.address}
        amount={tanda.claimable}
        token={tanda.tokenAddress}
        variant="compact"
      />
    </li>
  );
}
