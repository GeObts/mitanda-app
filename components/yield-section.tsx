"use client";

// <YieldSection /> — the Etherfuse "put the insurance pool to work" panel for the
// tanda room. Two parts:
//   1. Live info: the tanda's insurance pool, the live CETES APY (from Etherfuse),
//      and the projected annual yield.
//   2. A real USDC → CETES swap demo on Solana devnet (connect wallet → quote →
//      swap), wrapped in its own SolanaProvider so it doesn't touch the app's
//      Privy/wagmi EVM auth.
//
// Slots into the tanda room (components/tanda-room.tsx). Contracts are untouched —
// we only READ totalInsuranceReserve().

import { Sparkles, TrendingUp, ShieldCheck, AlertTriangle } from "lucide-react";
import { useReadContract } from "wagmi";

import { tandaContract, activeChain, fmtToken, premiumPerCycle } from "@/lib/contracts";
import { useT } from "@/lib/i18n";
import { useCetesRate } from "@/lib/hooks/use-cetes-rate";
import { SolanaProvider } from "@/components/solana/solana-provider";
import { SwapWidget } from "@/components/solana/swap-widget";

export function YieldSection({
  tandaAddress,
  contributionAmount,
  participantCount,
  totalCycles,
  tokenDecimals,
  tokenSymbol,
}: {
  tandaAddress: `0x${string}`;
  contributionAmount: bigint;
  participantCount: number;
  totalCycles: number;
  tokenDecimals: number;
  tokenSymbol: string;
}) {
  const t = useT();
  const rate = useCetesRate();

  // Live insurance pool from the contract; fall back to the fully-funded estimate
  // (10% premium × members × cycles) when the reserve read is empty/unavailable.
  const reserveQ = useReadContract({
    ...tandaContract(tandaAddress),
    functionName: "totalInsuranceReserve",
    chainId: activeChain.id,
    query: { enabled: !!tandaAddress },
  });
  const liveReserve = (reserveQ.data as bigint | undefined) ?? 0n;
  const estimatedPool =
    premiumPerCycle(contributionAmount) * BigInt(participantCount) * BigInt(totalCycles);
  const poolUnits = liveReserve > 0n ? liveReserve : estimatedPool;
  const poolNumber = Number(poolUnits) / 10 ** tokenDecimals;

  const apyPct = rate.data?.apyPct ?? null;
  const projectedYear = apyPct != null ? (poolNumber * apyPct) / 100 : null;

  const apyDisplay = apyPct != null ? apyPct.toFixed(2) : "—";
  const fmtMoney = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <section className="overflow-hidden rounded-card bg-background-card shadow-card">
      {/* header */}
      <div className="border-b border-border-soft bg-primary-soft/40 p-6 md:p-7">
        <div className="flex items-center gap-1.5 text-caption font-medium text-primary dark:text-accent">
          <Sparkles className="size-3.5" /> {t("yield.eyebrow")}
        </div>
        <h2 className="mt-1 text-h2 text-foreground">{t("yield.title")}</h2>
        <p className="mt-2 max-w-2xl text-body text-foreground-muted">
          {apyPct != null
            ? t("yield.headline", { apy: apyDisplay })
            : rate.isError
              ? t("yield.rateError")
              : t("yield.rateLoading")}
        </p>
        <p className="mt-2 max-w-2xl text-caption text-foreground-subtle">{t("yield.body")}</p>
      </div>

      {/* metrics */}
      <div className="grid grid-cols-1 gap-px bg-border-soft sm:grid-cols-3">
        <Metric
          icon={<ShieldCheck className="size-4" />}
          label={t("yield.poolLabel")}
          value={`${fmtToken(poolUnits, tokenDecimals)} ${tokenSymbol}`.trim()}
        />
        <Metric
          icon={<TrendingUp className="size-4" />}
          label={t("yield.apyLabel")}
          value={apyPct != null ? `${apyDisplay}%` : "…"}
          accent
        />
        <Metric
          icon={<Sparkles className="size-4" />}
          label={t("yield.projectedLabel")}
          value={
            projectedYear != null
              ? `${fmtMoney(projectedYear)} ${tokenSymbol}`.trim()
              : "…"
          }
          note={apyPct != null ? t("yield.projectedNote", { apy: apyDisplay }) : undefined}
        />
      </div>

      {/* swap demo */}
      <div className="p-6 md:p-7">
        <SolanaProvider>
          <SwapWidget />
        </SolanaProvider>
        <p className="mt-4 flex items-start gap-1.5 text-caption text-foreground-subtle">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {t("yield.disclaimer")}
        </p>
      </div>
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
  note,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-background-card p-5">
      <div className="flex items-center gap-1.5 text-caption text-foreground-subtle">
        {icon}
        {label}
      </div>
      <div
        className={`mt-1 text-h2 ${accent ? "text-primary dark:text-accent" : "text-foreground"}`}
      >
        {value}
      </div>
      {note && <div className="mt-0.5 text-caption text-foreground-subtle">{note}</div>}
    </div>
  );
}
