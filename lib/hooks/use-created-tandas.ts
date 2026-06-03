"use client";

import type { ContractFunctionParameters } from "viem";
import { useAccount, useReadContract, useReadContracts } from "wagmi";

import { mitanda, tandaContract, TandaState, activeChain } from "@/lib/contracts";

export interface CreatedTanda {
  id: number;
  address: `0x${string}`;
  isPrivate: boolean;
  state: TandaState;
  participantCount: number;
  activeCount: number;
}

/**
 * Tandas the connected wallet created (creator == address). Enumerates all
 * tandas (no Manager index for "created by"), filters by creator(), then reads
 * display fields. Batched via multicall.
 */
export function useCreatedTandas(): {
  tandas: CreatedTanda[];
  isLoading: boolean;
} {
  const { address, isConnected } = useAccount();
  const connected = isConnected && !!address;

  const countQ = useReadContract({
    ...mitanda.manager,
    functionName: "tandaCount",
    chainId: activeChain.id,
    query: { enabled: connected },
  });
  // Guard on `connected` so retained react-query data from a previous session
  // can't keep the list populated after a disconnect — count collapses to 0,
  // which cascades every downstream read/derivation to empty.
  const count = connected && countQ.data ? Number(countQ.data) : 0;

  const idCalls: ContractFunctionParameters[] = Array.from(
    { length: count },
    (_, i) => ({
      ...mitanda.manager,
      functionName: "tandaIdToAddress",
      args: [BigInt(i + 1)],
    }),
  );
  const addrQ = useReadContracts({
    contracts: idCalls,
    chainId: activeChain.id,
    query: { enabled: connected && count > 0 },
  });
  const addrs = connected
    ? (addrQ.data ?? []).map((r) => r.result as `0x${string}`)
    : [];

  const creatorCalls: ContractFunctionParameters[] = addrs.map((a) => ({
    ...tandaContract(a),
    functionName: "creator",
  }));
  const creatorQ = useReadContracts({
    contracts: creatorCalls,
    chainId: activeChain.id,
    query: { enabled: connected && !!address && addrs.length > 0 },
  });
  const created = !connected
    ? []
    : addrs
        .map((a, i) => ({ address: a, id: i + 1 }))
        .filter(
          (_, i) =>
            (creatorQ.data?.[i]?.result as string | undefined)?.toLowerCase() ===
            address?.toLowerCase(),
        );

  const detailCalls: ContractFunctionParameters[] = created.flatMap(
    ({ address: a }) => {
      const c = tandaContract(a);
      return [
        { ...c, functionName: "privacy" },
        { ...c, functionName: "state" },
        { ...c, functionName: "participantCount" },
        { ...c, functionName: "activeParticipantCount" },
      ];
    },
  );
  const detailQ = useReadContracts({
    contracts: detailCalls,
    chainId: activeChain.id,
    query: { enabled: connected && created.length > 0 },
  });

  const tandas: CreatedTanda[] = [];
  if (detailQ.data && detailQ.data.length === created.length * 4) {
    created.forEach((info, t) => {
      const base = t * 4;
      const g = (k: number) => detailQ.data![base + k]?.result;
      tandas.push({
        id: info.id,
        address: info.address,
        isPrivate: Number(g(0) ?? 0) === 1,
        state: Number(g(1) ?? 0) as TandaState,
        participantCount: Number(g(2) ?? 0),
        activeCount: Number(g(3) ?? 0),
      });
    });
  }

  const isLoading =
    countQ.isLoading ||
    (count > 0 && addrQ.isLoading) ||
    (addrs.length > 0 && creatorQ.isLoading) ||
    (created.length > 0 && detailQ.isLoading);

  return { tandas, isLoading };
}
