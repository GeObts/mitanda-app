"use client";

import { useQuery } from "@tanstack/react-query";

export interface CetesRate {
  apyBps: number;
  apyPct: number;
  bondCostFiat: string;
  bondCostUsd: string;
  currency: string;
  asOf: string;
}

/**
 * Live CETES interest rate from Etherfuse (via /api/etherfuse/cetes-rate, which
 * proxies the public /lookup/bonds/cost/CETES endpoint). Verified to return
 * 313 bps = 3.13% APY against the sandbox.
 */
export function useCetesRate() {
  return useQuery<CetesRate>({
    queryKey: ["etherfuse", "cetes-rate"],
    queryFn: async () => {
      const res = await fetch("/api/etherfuse/cetes-rate");
      if (!res.ok) throw new Error("Failed to load CETES rate");
      return res.json();
    },
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}
