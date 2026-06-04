"use client";

import { useAccount } from "wagmi";
import { Loader2, Wallet } from "lucide-react";

import type { useTwoStepTx } from "@/lib/hooks/use-two-step-tx";
import { activeChain, fmtToken } from "@/lib/contracts";
import { useT } from "@/lib/i18n";

export const zeroAddr =
  "0x0000000000000000000000000000000000000000" as const;

/** Circle USDC faucet (testnet). */
const FAUCET_URL = "https://faucet.circle.com";

/** Friendly payout-interval label from seconds. */
export function intervalLabel(seconds: bigint): string {
  const days = Number(seconds) / 86400;
  if (days === 7) return "Weekly";
  if (days === 14) return "Biweekly";
  if (days === 30) return "Monthly";
  if (Number.isInteger(days)) return `Every ${days} days`;
  return `Every ${Math.round(Number(seconds) / 3600)}h`;
}

export function Banner({
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

type Tx = ReturnType<typeof useTwoStepTx>;

const primaryBtn =
  "flex w-full items-center justify-center gap-2 rounded-btn bg-primary px-5 py-3.5 text-h3 text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60";

/**
 * Shared submit/guard area for two-step flows: handles disconnected,
 * wrong-network, balance precheck, and the approve-aware action button.
 */
export function GuardArea({
  tx,
  required,
  actionLabel,
  symbol,
  decimals,
}: {
  tx: Tx;
  required: bigint;
  actionLabel: string;
  /** Contribution-token symbol (read on-chain). */
  symbol: string;
  /** Contribution-token decimals (read on-chain). */
  decimals: number;
}) {
  const { isConnected } = useAccount();
  const t = useT();
  const fmt = (v: bigint) => fmtToken(v, decimals);

  if (!isConnected) {
    return (
      <Banner tone="muted" icon={<Wallet className="size-4" />}>
        {t("common.connectToContinue")}
      </Banner>
    );
  }

  if (tx.isWrongNetwork) {
    return (
      <button
        type="button"
        onClick={tx.switchToActiveChain}
        disabled={tx.isSwitching}
        className={primaryBtn}
      >
        {tx.isSwitching && <Loader2 className="size-4 animate-spin" />}
        {t("common.switchTo", { chain: activeChain.name })}
      </button>
    );
  }

  // Reads still loading.
  if (tx.allowance === null || tx.balance === null) {
    return (
      <button type="button" disabled className={primaryBtn}>
        <Loader2 className="size-4 animate-spin" /> {t("common.checking")}
      </button>
    );
  }

  if (!tx.hasEnoughBalance) {
    const isUsdc = symbol.toUpperCase() === "USDC";
    return (
      <div className="space-y-2">
        <Banner tone="danger" icon={<Wallet className="size-4" />}>
          {t("guard.needBalance", {
            req: fmt(required),
            sym: symbol,
            bal: fmt(tx.balance),
          })}
          {isUsdc && (
            <>
              {" "}
              <a
                href={FAUCET_URL}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {t("guard.faucet")}
              </a>
              .
            </>
          )}
        </Banner>
        <button type="button" disabled className={primaryBtn}>
          {actionLabel}
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={tx.run} className={primaryBtn}>
      {tx.needsApproval ? t("guard.approveAnd", { action: actionLabel }) : actionLabel}
    </button>
  );
}
