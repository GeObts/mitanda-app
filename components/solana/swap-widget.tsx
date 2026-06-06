"use client";

// USDC → CETES swap demo, driven by the connected Solana wallet. Must be rendered
// inside <SolanaProvider>. Handles: connect → quote → swap → sign → result.

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ArrowRight, Loader2, Check, ExternalLink, RotateCcw } from "lucide-react";

import { useT } from "@/lib/i18n";
import { useEtherfuseSwap, type SwapPhase } from "@/lib/hooks/use-etherfuse-swap";

const num = (s: string, dp = 2) => {
  const n = Number(s);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: dp }) : s;
};

export function SwapWidget() {
  const t = useT();
  const { connected } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [amount, setAmount] = useState("100");
  const swap = useEtherfuseSwap();

  // Wallet adapter reads localStorage on mount → render after hydration to avoid a
  // mismatch. This mount-sync setState is intentional (same pattern as lib/i18n).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const busy =
    swap.phase === "quoting" ||
    swap.phase === "initiating" ||
    swap.phase === "awaiting_tx" ||
    swap.phase === "signing" ||
    swap.phase === "submitted";

  return (
    <div className="rounded-card border border-border-soft bg-background p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-h3 text-foreground">{t("yield.swapTitle")}</h3>
        {mounted && (
          <div className="shrink-0">
            {/* wallet-adapter's own button; styled by its imported CSS */}
            <WalletMultiButton />
          </div>
        )}
      </div>
      <p className="mt-1 text-caption text-foreground-muted">{t("yield.swapIntro")}</p>

      {/* amount + quote */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="text-caption text-foreground-subtle">{t("yield.amountLabel")}</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            disabled={busy}
            className="mt-1 w-full rounded-btn border border-border bg-background-card px-3 py-2 text-body text-foreground outline-none focus:border-primary disabled:opacity-60"
          />
        </label>
        <button
          type="button"
          onClick={() => swap.getQuote(amount)}
          disabled={busy || !amount || Number(amount) <= 0}
          className="flex h-10 items-center justify-center gap-1.5 rounded-btn bg-background-muted px-4 text-caption font-semibold text-foreground transition-colors hover:bg-border-soft disabled:opacity-60"
        >
          {swap.phase === "quoting" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          {swap.phase === "quoting" ? t("yield.quoting") : t("yield.getQuote")}
        </button>
      </div>

      {/* quote result */}
      {swap.quote && swap.phase !== "completed" && (
        <div className="mt-4 rounded-btn bg-primary-soft/50 p-4">
          <div className="text-h3 text-foreground">
            {t("yield.quoteResult", {
              src: num(swap.quote.sourceAmount),
              dst: num(swap.quote.destinationAmount),
            })}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-caption text-foreground-muted">
            <span>{t("yield.quoteRate", { rate: num(swap.quote.exchangeRate, 4) })}</span>
            {swap.quote.feeBps && <span>{t("yield.quoteFee", { bps: swap.quote.feeBps })}</span>}
            <span>{t("yield.quoteExpires")}</span>
          </div>

          <button
            type="button"
            onClick={() => swap.executeSwap()}
            disabled={!connected || busy}
            className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-btn bg-primary px-4 text-body font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60 sm:w-auto"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            {swapButtonLabel(swap.phase, t)}
          </button>
        </div>
      )}

      {/* completed */}
      {swap.phase === "completed" && (
        <div className="mt-4 rounded-btn bg-success/10 p-4">
          <div className="flex items-center gap-1.5 text-h3 text-success">
            <Check className="size-4" strokeWidth={3} /> {t("yield.swapCompleted")}
          </div>
          {swap.signature && (
            <a
              href={`https://explorer.solana.com/tx/${swap.signature}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-caption font-medium text-primary hover:underline dark:text-accent"
            >
              {t("yield.viewTx")} <ExternalLink className="size-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={swap.reset}
            className="mt-3 flex items-center gap-1.5 text-caption font-medium text-foreground-muted hover:text-foreground"
          >
            <RotateCcw className="size-3.5" /> {t("yield.reset")}
          </button>
        </div>
      )}

      {/* error */}
      {swap.phase === "error" && swap.error && (
        <div className="mt-4 rounded-btn bg-danger/10 p-4">
          <p className="text-caption text-danger">{swap.error}</p>
          <button
            type="button"
            onClick={swap.reset}
            className="mt-2 flex items-center gap-1.5 text-caption font-medium text-foreground-muted hover:text-foreground"
          >
            <RotateCcw className="size-3.5" /> {t("yield.reset")}
          </button>
        </div>
      )}
    </div>
  );
}

function swapButtonLabel(phase: SwapPhase, t: ReturnType<typeof useT>): string {
  switch (phase) {
    case "initiating":
      return t("yield.swapInitiating");
    case "awaiting_tx":
      return t("yield.swapAwaiting");
    case "signing":
      return t("yield.swapSigning");
    case "submitted":
      return t("yield.swapSubmitted");
    default:
      return t("yield.executeSwap");
  }
}
