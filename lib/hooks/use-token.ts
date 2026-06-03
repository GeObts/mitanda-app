"use client";

import { useMemo } from "react";
import type { ContractFunctionParameters } from "viem";
import { useReadContract, useReadContracts } from "wagmi";

import { activeChain, erc20, mitanda } from "@/lib/contracts";

export interface TokenMeta {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
}

const zeroAddr = "0x0000000000000000000000000000000000000000";

/**
 * Read an ERC-20's `symbol()` and `decimals()` on-chain. No hardcoded 6/USDC —
 * the values come straight from the token contract. Returns sane fallbacks
 * (symbol "", decimals 18) only while loading or if the reads fail.
 */
export function useToken(address?: `0x${string}`): {
  token: TokenMeta | null;
  isLoading: boolean;
} {
  const enabled = !!address && address !== zeroAddr;
  const { data, isLoading } = useReadContracts({
    contracts: enabled
      ? [
          { ...erc20(address!), functionName: "symbol" },
          { ...erc20(address!), functionName: "decimals" },
        ]
      : [],
    chainId: activeChain.id,
    query: { enabled },
  });

  const token = useMemo<TokenMeta | null>(() => {
    if (!enabled || !data) return null;
    const symbol = data[0]?.result as string | undefined;
    const decimals = data[1]?.result as number | undefined;
    if (symbol == null || decimals == null) return null;
    return { address: address!, symbol, decimals: Number(decimals) };
  }, [enabled, data, address]);

  return { token, isLoading };
}

/**
 * The Manager's token allowlist (getAllowedTokens), enriched with each token's
 * on-chain symbol + decimals. Drives the Create currency picker.
 */
export function useAllowedTokens(): {
  tokens: TokenMeta[];
  isLoading: boolean;
} {
  const { data: allowed, isLoading: loadingList } = useReadContract({
    ...mitanda.manager,
    functionName: "getAllowedTokens",
    chainId: activeChain.id,
  });

  const list = useMemo(
    () => (Array.isArray(allowed) ? (allowed as `0x${string}`[]) : []),
    [allowed],
  );

  const metaCalls = useMemo<ContractFunctionParameters[]>(
    () =>
      list.flatMap((addr) => [
        { ...erc20(addr), functionName: "symbol" },
        { ...erc20(addr), functionName: "decimals" },
      ]),
    [list],
  );
  const { data: metaData, isLoading: loadingMeta } = useReadContracts({
    contracts: metaCalls,
    chainId: activeChain.id,
    query: { enabled: list.length > 0 },
  });

  const tokens = useMemo<TokenMeta[]>(() => {
    if (list.length === 0 || !metaData) return [];
    return list.map((address, i) => ({
      address,
      symbol: (metaData[i * 2]?.result as string | undefined) ?? "",
      decimals: Number(metaData[i * 2 + 1]?.result ?? 18),
    }));
  }, [list, metaData]);

  return {
    tokens,
    isLoading: loadingList || (list.length > 0 && loadingMeta),
  };
}
