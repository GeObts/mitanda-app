"use client";

import type { ContractFunctionParameters } from "viem";
import { useAccount, useReadContract, useReadContracts } from "wagmi";

import {
  mitanda,
  tandaContract,
  TandaState,
  activeChain,
} from "@/lib/contracts";

/** One participant in the roster, with rotation + payment status derived. */
export interface RosterMember {
  address: `0x${string}`;
  index: number; // position in getAllParticipants
  paidUntilCycle: number;
  isActive: boolean;
  joinTimestamp: number;
  /** 1-based cycle this member receives the pot (from payout order); null if unassigned. */
  rotationCycle: number | null;
  /** They have already received their pot. */
  funded: boolean;
  /** They receive this cycle's pot. */
  isCurrentRecipient: boolean;
  /** Paid in/through the current cycle. */
  paidThisCycle: boolean;
  /** They're the connected viewer. */
  isViewer: boolean;
}

export type TandaDetailStatus = "loading" | "notfound" | "ready" | "error";

export interface TandaDetail {
  status: TandaDetailStatus;
  id: number;
  address: `0x${string}` | null;
  state: TandaState;
  currentCycle: number;
  /** Target seats. */
  participantCount: number;
  /** Filled seats. */
  seatsFilled: number;
  contributionAmount: bigint;
  tokenAddress: `0x${string}`;
  payoutInterval: bigint;
  gracePeriod: bigint;
  startTimestamp: bigint;
  privacy: number;
  isPublic: boolean;
  creator: `0x${string}` | null;
  /** contribution × target participants. */
  potSize: bigint;
  cyclesCompleted: number;
  totalCycles: number;
  payoutOrder: number[];
  orderAssigned: boolean;
  members: RosterMember[];
  currentRecipient: `0x${string}` | null;
  viewerIsMember: boolean;
}

type ParticipantTuple = {
  addr: `0x${string}`;
  paidUntilCycle: bigint;
  isActive: boolean;
  joinTimestamp: bigint;
};

const FIELDS = [
  "state",
  "currentCycle",
  "participantCount",
  "contributionAmount",
  "payoutInterval",
  "startTimestamp",
  "token",
  "gracePeriod",
  "privacy",
  "creator",
  "getAllParticipants",
  "getPayoutOrder",
] as const;

const ZERO = "0x0000000000000000000000000000000000000000" as const;

/**
 * Reads one tanda in full for the detail "room": every participant, the VRF
 * payout order, and per-member payment/rotation status — all derived from
 * current on-chain reads (no event indexing). Pinned to activeChain.id and
 * batched via multicall, mirroring useUserTandas's read pattern.
 */
export function useTandaDetail(tandaId: number): TandaDetail {
  const { address } = useAccount();

  // 1) Resolve tandaId → clone address.
  const addrQ = useReadContract({
    ...mitanda.manager,
    functionName: "tandaIdToAddress",
    args: [BigInt(tandaId)],
    chainId: activeChain.id,
    query: { enabled: Number.isInteger(tandaId) && tandaId > 0 },
  });
  const clone = addrQ.data as `0x${string}` | undefined;
  const cloneIsReal = !!clone && clone !== ZERO;

  // 2) Batch-read the clone's full state.
  const calls: ContractFunctionParameters[] = cloneIsReal
    ? FIELDS.map((fn) => ({ ...tandaContract(clone!), functionName: fn }))
    : [];
  const q = useReadContracts({
    contracts: calls,
    chainId: activeChain.id,
    query: { enabled: cloneIsReal },
  });

  const empty: TandaDetail = {
    status: "loading",
    id: tandaId,
    address: clone ?? null,
    state: TandaState.OPEN,
    currentCycle: 0,
    participantCount: 0,
    seatsFilled: 0,
    contributionAmount: 0n,
    tokenAddress: ZERO,
    payoutInterval: 0n,
    gracePeriod: 0n,
    startTimestamp: 0n,
    privacy: 0,
    isPublic: true,
    creator: null,
    potSize: 0n,
    cyclesCompleted: 0,
    totalCycles: 0,
    payoutOrder: [],
    orderAssigned: false,
    members: [],
    currentRecipient: null,
    viewerIsMember: false,
  };

  if (addrQ.isLoading) return empty;
  if (addrQ.isError) return { ...empty, status: "error" };
  if (!cloneIsReal) return { ...empty, status: "notfound" };
  if (q.isLoading || !q.data) return empty;
  if (q.isError || q.data.length !== FIELDS.length)
    return { ...empty, status: "error" };

  const g = (k: number) => q.data![k]?.result;
  const state = Number(g(0) ?? 0) as TandaState;
  const currentCycle = Number(g(1) ?? 0);
  const participantCount = Number(g(2) ?? 0);
  const contributionAmount = (g(3) as bigint) ?? 0n;
  const payoutInterval = (g(4) as bigint) ?? 0n;
  const startTimestamp = (g(5) as bigint) ?? 0n;
  const tokenAddress = (g(6) as `0x${string}`) ?? ZERO;
  const gracePeriod = (g(7) as bigint) ?? 0n;
  const privacy = Number(g(8) ?? 0);
  const creator = (g(9) as `0x${string}`) ?? ZERO;
  const participants = (g(10) as ParticipantTuple[] | undefined) ?? [];
  const payoutOrder = ((g(11) as readonly bigint[] | undefined) ?? []).map(Number);

  const orderAssigned = payoutOrder.length > 0;
  const seatsFilled = participants.length;
  const totalCycles = participantCount;
  const cyclesCompleted =
    state === TandaState.COMPLETED
      ? totalCycles
      : state === TandaState.ACTIVE
        ? Math.max(0, currentCycle - 1)
        : 0;

  // member index → its 1-based rotation cycle (position in payoutOrder).
  const cycleOf = new Map<number, number>();
  payoutOrder.forEach((memberIdx, k) => cycleOf.set(memberIdx, k + 1));

  const lowerViewer = address?.toLowerCase();
  const members: RosterMember[] = participants.map((p, i) => {
    const rotationCycle = cycleOf.has(i) ? cycleOf.get(i)! : null;
    const funded =
      orderAssigned &&
      rotationCycle != null &&
      (state === TandaState.COMPLETED || rotationCycle < currentCycle);
    const isCurrentRecipient =
      state === TandaState.ACTIVE &&
      rotationCycle != null &&
      rotationCycle === currentCycle;
    const paidUntilCycle = Number(p.paidUntilCycle);
    const paidThisCycle =
      state === TandaState.ACTIVE
        ? paidUntilCycle >= currentCycle
        : paidUntilCycle >= 1; // joining pays cycle 1
    return {
      address: p.addr,
      index: i,
      paidUntilCycle,
      isActive: p.isActive,
      joinTimestamp: Number(p.joinTimestamp),
      rotationCycle,
      funded,
      isCurrentRecipient,
      paidThisCycle,
      isViewer: !!lowerViewer && p.addr.toLowerCase() === lowerViewer,
    };
  });

  const currentRecipient =
    orderAssigned && currentCycle >= 1 && currentCycle <= payoutOrder.length
      ? (participants[payoutOrder[currentCycle - 1]]?.addr ?? null)
      : null;

  return {
    status: "ready",
    id: tandaId,
    address: clone!,
    state,
    currentCycle,
    participantCount,
    seatsFilled,
    contributionAmount,
    tokenAddress,
    payoutInterval,
    gracePeriod,
    startTimestamp,
    privacy,
    isPublic: privacy === 0,
    creator,
    potSize: contributionAmount * BigInt(participantCount),
    cyclesCompleted,
    totalCycles,
    payoutOrder,
    orderAssigned,
    members,
    currentRecipient,
    viewerIsMember: members.some((m) => m.isViewer),
  };
}
