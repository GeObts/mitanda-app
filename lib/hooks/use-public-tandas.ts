"use client";

import type { ContractFunctionParameters } from "viem";
import { useAccount, useReadContract, useReadContracts } from "wagmi";

import {
  mitanda,
  tandaContract,
  TandaState,
  activeChain,
} from "@/lib/contracts";

/** A public, open, joinable tanda surfaced in the discovery strip. */
export interface PublicTanda {
  id: number;
  address: `0x${string}`;
  contributionAmount: bigint;
  /** The tanda's contribution token (per-tanda, read on-chain). */
  tokenAddress: `0x${string}`;
  payoutInterval: bigint;
  /** Target seats (participantCount). */
  seatsTarget: number;
  /** Filled seats (getAllParticipants length). */
  seatsFilled: number;
  /** Member wallet addresses (for avatars); capped for display. */
  memberAddrs: `0x${string}`[];
  /** The connected wallet is already a participant. */
  alreadyJoined: boolean;
  /** The connected wallet created this tanda. */
  isCreator: boolean;
}

type ParticipantTuple = { addr: `0x${string}` };

// Per clone we read: state, privacy, participantCount, getAllParticipants,
// contributionAmount, token, payoutInterval, creator.
const DETAIL_FIELDS = [
  "state",
  "privacy",
  "participantCount",
  "getAllParticipants",
  "contributionAmount",
  "token",
  "payoutInterval",
  "creator",
] as const;
const CALLS_PER_TANDA = DETAIL_FIELDS.length;

/**
 * Discovery feed: every PUBLIC + OPEN tanda with seats still remaining.
 *
 * There is no Manager-side index of "open public tandas", so we walk the full
 * registry the same way the dashboard does:
 *   1. read tandaCount(),
 *   2. resolve each tandaId → clone address,
 *   3. batch-read display fields for every clone,
 *   4. filter to public + OPEN + (filled < target) in memory.
 *
 * Reads are PUBLIC (no wallet required), so the walk runs whenever there are
 * tandas; the connected address is only used to *badge* (not hide) ones the
 * user already joined or created. Every read is pinned to activeChain.id so it
 * always targets the active chain regardless of the wallet's selected network.
 *
 * NOTE: walking the whole registry is fine at today's scale; an indexer /
 * subgraph is the eventual optimization once tanda counts grow.
 */
export function usePublicTandas(): {
  tandas: PublicTanda[];
  isLoading: boolean;
  isError: boolean;
} {
  const { address } = useAccount();

  // 1) Total tandas ever created (ids are 1..count).
  const countQ = useReadContract({
    ...mitanda.manager,
    functionName: "tandaCount",
    chainId: activeChain.id,
  });
  const count = countQ.data ? Number(countQ.data) : 0;

  // 2) Resolve clone addresses for every tanda id.
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
    query: { enabled: count > 0 },
  });
  const addrs: `0x${string}`[] = (addrQ.data ?? []).map(
    (r) => r.result as `0x${string}`,
  );

  // 3) Batch-read display fields for every clone.
  const detailCalls: ContractFunctionParameters[] = addrs.flatMap((a) =>
    DETAIL_FIELDS.map((fn) => ({ ...tandaContract(a), functionName: fn })),
  );
  const detailQ = useReadContracts({
    contracts: detailCalls,
    chainId: activeChain.id,
    query: { enabled: addrs.length > 0 },
  });

  // 4) Assemble + filter.
  const tandas: PublicTanda[] = [];
  if (detailQ.data && detailQ.data.length === addrs.length * CALLS_PER_TANDA) {
    addrs.forEach((a, t) => {
      const base = t * CALLS_PER_TANDA;
      const g = (k: number) => detailQ.data![base + k]?.result;

      const state = Number(g(0) ?? 0) as TandaState;
      const isPublic = Number(g(1) ?? 0) === 0; // TandaPrivacy.PUBLIC === 0
      const seatsTarget = Number(g(2) ?? 0);
      const participants = (g(3) as ParticipantTuple[] | undefined) ?? [];
      const contributionAmount = (g(4) as bigint | undefined) ?? 0n;
      const tokenAddress =
        (g(5) as `0x${string}` | undefined) ??
        "0x0000000000000000000000000000000000000000";
      const payoutInterval = (g(6) as bigint | undefined) ?? 0n;
      const creator = (g(7) as `0x${string}` | undefined) ?? undefined;
      const seatsFilled = participants.length;

      // Filter: public + OPEN + seats remaining.
      if (!isPublic || state !== TandaState.OPEN || seatsFilled >= seatsTarget) {
        return;
      }

      const lower = address?.toLowerCase();
      const alreadyJoined =
        !!lower && participants.some((p) => p.addr?.toLowerCase() === lower);
      const isCreator = !!lower && creator?.toLowerCase() === lower;

      tandas.push({
        id: t + 1,
        address: a,
        contributionAmount,
        tokenAddress,
        payoutInterval,
        seatsTarget,
        seatsFilled,
        memberAddrs: participants
          .map((p) => p.addr)
          .filter(Boolean)
          .slice(0, 8),
        alreadyJoined,
        isCreator,
      });
    });
  }

  const isLoading =
    countQ.isLoading ||
    (count > 0 && addrQ.isLoading) ||
    (addrs.length > 0 && detailQ.isLoading);
  const isError = countQ.isError || addrQ.isError || detailQ.isError;

  return { tandas, isLoading, isError };
}
