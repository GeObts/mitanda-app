"use client";

// <YieldSection /> — the Etherfuse panel for the tanda room.
//
// Honest, no-math framing: the 10% safety deposit earns the live CETES APY, and at
// completion members get a full refund plus the yield. The live USDC→CETES swap on
// Solana devnet sits below as the working demo, in its own SolanaProvider so it
// never touches the app's Privy/wagmi EVM auth. Contracts are untouched.

import { ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";

import { useT } from "@/lib/i18n";
import { useCetesRate } from "@/lib/hooks/use-cetes-rate";
import { SolanaProvider } from "@/components/solana/solana-provider";
import { SwapWidget } from "@/components/solana/swap-widget";

export function YieldSection() {
  const t = useT();
  const rate = useCetesRate();
  // Live rate from the production lookup (see getCetesRate); one decimal place.
  // Falls back to ~5.8% if the rate hasn't loaded yet.
  const apy = (rate.data?.apyPct ?? 5.8).toFixed(1);

  return (
    <section className="overflow-hidden rounded-card bg-background-card p-6 shadow-card md:p-7">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-btn bg-primary-soft text-primary dark:text-accent">
          <ShieldCheck className="size-5" />
        </span>
        <h2 className="text-h2 text-foreground">{t("yield.title")}</h2>
      </div>

      {/* line 1 — what's happening, with the live APY */}
      <p className="mt-4 text-body text-foreground-muted">
        {t("yield.depositLine", { apy })}
      </p>

      {/* line 2 — the payoff, emphasized */}
      <div className="mt-3 flex items-center gap-1.5 text-h3 font-semibold text-foreground">
        <span>{t("yield.atCompletion")}</span>
        <ArrowRight className="size-4 shrink-0 text-primary dark:text-accent" />
        <span>{t("yield.refundYield")}</span>
      </div>

      {/* live swap demo */}
      <div className="mt-6">
        <SolanaProvider>
          <SwapWidget />
        </SolanaProvider>
        <p className="mt-4 flex items-start gap-1.5 text-caption text-foreground-subtle">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {t("yield.disclaimer")}
        </p>
      </div>

      {/* line 3 — powered by, muted */}
      <p className="mt-4 text-caption text-foreground-subtle">{t("yield.eyebrow")}</p>
    </section>
  );
}
