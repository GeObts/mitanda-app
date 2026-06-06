"use client";

import { useCallback, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction, Transaction } from "@solana/web3.js";

import type { SwapUpdate } from "@/lib/server/etherfuse-swap-store";

export interface SwapQuote {
  quoteId: string;
  sourceAmount: string;
  destinationAmount: string;
  exchangeRate: string;
  feeBps: string | null;
  feeAmount: string | null;
  expiresAt: string;
}

export type SwapPhase =
  | "idle"
  | "quoting"
  | "quoted"
  | "initiating"
  | "awaiting_tx" // swap initiated; waiting for the swap_updated webhook
  | "signing"
  | "submitted"
  | "completed"
  | "error";

interface SwapState {
  phase: SwapPhase;
  quote: SwapQuote | null;
  orderId: string | null;
  signature: string | null;
  error: string | null;
}

const INITIAL: SwapState = {
  phase: "idle",
  quote: null,
  orderId: null,
  signature: null,
  error: null,
};

// How long to poll our webhook store before giving up (the webhook needs a public
// tunnel to reach localhost — see docs/ETHERFUSE.md).
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 90_000;

function decodeTx(encoded: string): VersionedTransaction | Transaction {
  const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  try {
    return VersionedTransaction.deserialize(bytes);
  } catch {
    return Transaction.from(bytes);
  }
}

/**
 * Drives the end-to-end Etherfuse swap from the connected Solana wallet:
 *   getQuote(amount) → executeSwap() → [webhook delivers tx] → sign + submit.
 *
 * The /ramp/swap call is async — the signable transaction arrives via webhook, so
 * executeSwap() polls /api/etherfuse/swap/{orderId} until it appears (or times
 * out), then signs and submits it with the wallet adapter.
 */
export function useEtherfuseSwap() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [state, setState] = useState<SwapState>(INITIAL);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = null;
    setState(INITIAL);
  }, []);

  const getQuote = useCallback(async (sourceAmount: string) => {
    setState((s) => ({ ...s, phase: "quoting", error: null }));
    try {
      const res = await fetch("/api/etherfuse/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceAmount }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Quote failed" }));
        throw new Error(error ?? "Quote failed");
      }
      const q = await res.json();
      const quote: SwapQuote = {
        quoteId: q.quoteId,
        sourceAmount: q.sourceAmount,
        destinationAmount: q.destinationAmount,
        exchangeRate: q.exchangeRate,
        feeBps: q.feeBps,
        feeAmount: q.feeAmount,
        expiresAt: q.expiresAt,
      };
      setState((s) => ({ ...s, phase: "quoted", quote }));
      return quote;
    } catch (e) {
      setState((s) => ({ ...s, phase: "error", error: msg(e) }));
      return null;
    }
  }, []);

  const executeSwap = useCallback(async () => {
    if (!publicKey) {
      setState((s) => ({ ...s, phase: "error", error: "Connect a Solana wallet first." }));
      return;
    }
    const quote = state.quote;
    if (!quote) {
      setState((s) => ({ ...s, phase: "error", error: "Get a quote first." }));
      return;
    }

    setState((s) => ({ ...s, phase: "initiating", error: null }));
    let orderId: string;
    try {
      const res = await fetch("/api/etherfuse/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: quote.quoteId, publicKey: publicKey.toBase58() }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Swap failed" }));
        throw new Error(error ?? "Swap failed");
      }
      ({ orderId } = await res.json());
    } catch (e) {
      setState((s) => ({ ...s, phase: "error", error: msg(e) }));
      return;
    }

    setState((s) => ({ ...s, phase: "awaiting_tx", orderId }));

    // Poll the webhook store for the signable transaction.
    const started = Date.now();
    const update = await new Promise<SwapUpdate | null>((resolve) => {
      pollTimer.current = setInterval(async () => {
        if (Date.now() - started > POLL_TIMEOUT_MS) {
          if (pollTimer.current) clearInterval(pollTimer.current);
          resolve(null);
          return;
        }
        const r = await fetch(`/api/etherfuse/swap/${orderId}`);
        if (r.status === 200) {
          const u: SwapUpdate = await r.json();
          if (u.sendTransaction || u.status === "completed" || u.status === "failed") {
            if (pollTimer.current) clearInterval(pollTimer.current);
            resolve(u);
          }
        }
      }, POLL_INTERVAL_MS);
    });

    if (!update) {
      setState((s) => ({
        ...s,
        phase: "error",
        error:
          "No swap callback received. The Etherfuse webhook can't reach localhost without a tunnel — see docs/ETHERFUSE.md.",
      }));
      return;
    }
    if (update.status === "failed") {
      setState((s) => ({ ...s, phase: "error", error: "Etherfuse reported the swap failed." }));
      return;
    }
    if (!update.sendTransaction) {
      // Completed without needing a client signature.
      setState((s) => ({ ...s, phase: "completed", signature: update.sendTransactionHash ?? null }));
      return;
    }

    // Sign + submit the transaction Etherfuse returned.
    setState((s) => ({ ...s, phase: "signing" }));
    try {
      const tx = decodeTx(update.sendTransaction);
      const signature = await sendTransaction(tx, connection);
      setState((s) => ({ ...s, phase: "submitted", signature }));
      await connection.confirmTransaction(signature, "confirmed");
      setState((s) => ({ ...s, phase: "completed", signature }));
    } catch (e) {
      setState((s) => ({ ...s, phase: "error", error: msg(e) }));
    }
  }, [publicKey, state.quote, sendTransaction, connection]);

  return { ...state, getQuote, executeSwap, reset };
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
