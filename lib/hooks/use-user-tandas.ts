"use client";

import type { ContractFunctionParameters } from "viem";
import { useAccount, useReadContract, useReadContracts } from "wagmi";

import {
  mitanda,
  tandaContract,
  TandaState,
  perCycleCharge,
  cyclePot,
  recipientPayout,
  activeChain,
} from "@/lib/contracts";

/** An active participant who hasn't paid the current cycle (blocks the payout). */
export interface UnpaidParticipant {
  address: `0x${string}`;
  paidUntilCycle: number;
  /** Unix seconds the grace period ends; markDefaulter is callable after this. */
  graceExpiresAt: number;
  /** True once grace has expired — the participant can be marked a defaulter. */
  pastGrace: boolean;
}

/** A single tanda the connected wallet participates in, with derived state. */
export interface UserTanda {
  id: number;
  address: `0x${string}`;
  state: TandaState;
  /** 1-based cycle index; 0 while OPEN (not started). */
  currentCycle: number;
  /** Original seat/cycle count (participantCount). */
  totalCycles: number;
  /** Cycles already paid out. */
  cyclesCompleted: number;
  contributionAmount: bigint;
  payoutInterval: bigint;
  startTimestamp: bigint;
  /** The tanda's contribution token (per-tanda; read on-chain). */
  tokenAddress: `0x${string}`;
  /** Last cycle the user has paid for (join covers cycle 1). */
  paidUntilCycle: number;
  isActive: boolean;
  /** base contribution + 10% insurance premium. */
  perCycle: bigint;
  /** Next cycle the user still owes, or null if fully paid. */
  nextDueCycle: number | null;
  /** Unix seconds the next owed cycle is due, or null. */
  nextDueTimestamp: number | null;
  /**
   * Funds accrued to the connected wallet on this tanda, claimable via
   * withdraw() (pull-payment): the 95% pot when they're the recipient, the
   * creator's 3% organizer fee, and insurance refunds at completion.
   */
  claimable: bigint;
  /**
   * The current cycle's payout time has passed but it hasn't been triggered yet
   * (state ACTIVE, order assigned, now >= readyAt). The pot is sitting unsettled.
   */
  payoutDue: boolean;
  /**
   * `payoutDue` AND every active participant has paid this cycle — so
   * `triggerPayout()` will actually succeed (won't revert DefaultersOutstanding).
   */
  releasable: boolean;
  /** The address that receives this cycle's pot (participants[payoutOrder[cycle-1]]). */
  currentRecipient: `0x${string}` | null;
  /** True when the connected wallet is this cycle's recipient. */
  isCurrentRecipient: boolean;
  /** Recipient's share (95%) of the current cycle pot — for display. */
  currentPayoutAmount: bigint;
  /**
   * Active participants blocking the current cycle's payout (haven't paid it),
   * each with grace status. Empty unless the cycle is due but not releasable.
   */
  unpaidActive: UnpaidParticipant[];
}

export type DashboardStatus =
  | "disconnected"
  | "loading"
  | "empty"
  | "ready"
  | "error";

export interface DashboardData {
  status: DashboardStatus;
  tandas: UserTanda[];
  /** First ACTIVE tanda, else first joined tanda — drives the headline stats. */
  primary: UserTanda | null;
  /** Count of tandas where the user is still an active participant. */
  activeCount: number;
  joinedCount: number;
}

const STATE_FIELDS = [
  "state",
  "currentCycle",
  "participantCount",
  "contributionAmount",
  "payoutInterval",
  "startTimestamp",
  "token",
  "gracePeriod",
] as const;
// Per member tanda we also fetch getAllParticipants + pendingWithdrawals(user)
// + getPayoutOrder (to resolve the current cycle's recipient).
const CALLS_PER_TANDA = STATE_FIELDS.length + 3;

/** Current Unix seconds (wall clock). In a helper so reads stay out of the
 * render body — re-evaluated whenever the hook re-runs (every read refetch). */
const nowSeconds = () => Math.floor(Date.now() / 1000);

type ParticipantTuple = {
  addr: `0x${string}`;
  paidUntilCycle: bigint;
  isActive: boolean;
  joinTimestamp: bigint;
};

/**
 * Resolves every tanda the connected wallet participates in and reads its
 * on-chain state. There is no Manager-side "tandas of user" index, so we:
 *   1. read tandaCount(),
 *   2. resolve each tandaId → clone address,
 *   3. check isParticipant(user) on each clone,
 *   4. batch-read state for the member clones.
 * Steps 2–4 collapse into multicall batches.
 */
export function useUserTandas(): DashboardData {
  const { address, isConnected } = useAccount();

  // 1) Total tandas ever created (ids are 1..count).
  // Every read is pinned to the active chain so it always targets Arbitrum
  // Sepolia regardless of the connected wallet's selected network — otherwise
  // a wallet on another chain (e.g. Base) routes reads to the wrong RPC and the
  // Arb Manager address has no code there → "Couldn't reach the network".
  const countQ = useReadContract({
    ...mitanda.manager,
    functionName: "tandaCount",
    chainId: activeChain.id,
  });
  const count = countQ.data ? Number(countQ.data) : 0;

  // 2) Resolve clone addresses for every tanda id.
  // Dynamic multicall arrays are typed as ContractFunctionParameters[] so
  // wagmi doesn't try to deep-infer per-element result types (which explodes
  // with these large `as const` ABIs). Results come back as `unknown` and are
  // cast at the read site.
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
  const tandaAddrs: `0x${string}`[] = (addrQ.data ?? []).map(
    (r) => r.result as `0x${string}`,
  );

  // 3) Membership check per tanda for the connected wallet.
  const memberCalls: ContractFunctionParameters[] = tandaAddrs.map((a) => ({
    ...tandaContract(a),
    functionName: "isParticipant",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
  }));
  const memberQ = useReadContracts({
    contracts: memberCalls,
    chainId: activeChain.id,
    query: { enabled: !!address && tandaAddrs.length > 0 },
  });
  // index i in tandaAddrs ↔ tandaId (i+1).
  const memberInfos = tandaAddrs
    .map((a, i) => ({ address: a, id: i + 1 }))
    .filter((_, i) => memberQ.data?.[i]?.result === true);

  // 4) Batch-read state for member tandas.
  const memberAddr = address ?? "0x0000000000000000000000000000000000000000";
  const stateCalls: ContractFunctionParameters[] = memberInfos.flatMap(
    ({ address: a }) => [
      ...STATE_FIELDS.map((fn) => ({ ...tandaContract(a), functionName: fn })),
      { ...tandaContract(a), functionName: "getAllParticipants" },
      { ...tandaContract(a), functionName: "pendingWithdrawals", args: [memberAddr] },
      { ...tandaContract(a), functionName: "getPayoutOrder" },
    ],
  );
  const stateQ = useReadContracts({
    contracts: stateCalls,
    chainId: activeChain.id,
    query: { enabled: memberInfos.length > 0 },
  });

  // ── Assemble ────────────────────────────────────────────────────────────
  const tandas: UserTanda[] = [];
  if (stateQ.data && stateQ.data.length === memberInfos.length * CALLS_PER_TANDA) {
    memberInfos.forEach((info, t) => {
      const base = t * CALLS_PER_TANDA;
      const get = (k: number) => stateQ.data![base + k]?.result;

      const state = Number(get(0) ?? 0) as TandaState;
      const currentCycle = Number(get(1) ?? 0);
      const totalCycles = Number(get(2) ?? 0);
      const contributionAmount = (get(3) as bigint) ?? 0n;
      const payoutInterval = (get(4) as bigint) ?? 0n;
      const startTimestamp = (get(5) as bigint) ?? 0n;
      const tokenAddress =
        (get(6) as `0x${string}` | undefined) ??
        "0x0000000000000000000000000000000000000000";
      const gracePeriod = (get(7) as bigint) ?? 0n;
      const participants = (get(8) as ParticipantTuple[] | undefined) ?? [];
      const claimable = (get(9) as bigint | undefined) ?? 0n;
      const payoutOrder = ((get(10) as readonly bigint[] | undefined) ?? []).map(
        Number,
      );

      const me = participants.find(
        (p) => p.addr.toLowerCase() === address?.toLowerCase(),
      );
      const paidUntilCycle = me ? Number(me.paidUntilCycle) : 0;
      const isActive = me ? me.isActive : false;

      // ── Release / un-triggered payout detection ───────────────────────────
      // The current cycle is "due" once its payout time has passed; triggering
      // it advances currentCycle, so a still-current overdue cycle == not yet
      // triggered. `releasable` additionally requires every active participant
      // to have paid this cycle (else triggerPayout reverts DefaultersOutstanding).
      const activeParticipants = participants.filter((p) => p.isActive);
      const cycleInRange =
        payoutOrder.length > 0 &&
        currentCycle >= 1 &&
        currentCycle <= payoutOrder.length;
      const readyAt =
        startTimestamp > 0n
          ? Number(startTimestamp) + currentCycle * Number(payoutInterval)
          : 0;
      const nowSec = nowSeconds();
      const payoutDue =
        state === TandaState.ACTIVE && cycleInRange && readyAt > 0 && nowSec >= readyAt;
      const allActivePaid =
        activeParticipants.length > 0 &&
        activeParticipants.every((p) => Number(p.paidUntilCycle) >= currentCycle);
      const releasable = payoutDue && allActivePaid;
      const currentRecipient = cycleInRange
        ? (participants[payoutOrder[currentCycle - 1]]?.addr ?? null)
        : null;
      const isCurrentRecipient =
        !!currentRecipient &&
        !!address &&
        currentRecipient.toLowerCase() === address.toLowerCase();
      const currentPayoutAmount = recipientPayout(
        cyclePot(contributionAmount, activeParticipants.length),
      );

      // ── Defaulter detection ───────────────────────────────────────────────
      // When the cycle is due but NOT releasable, the blockers are the active
      // participants who haven't paid this cycle. Each can be marked a defaulter
      // only after the grace period (mirrors Tanda.markDefaulter's
      // `block.timestamp > startTimestamp + currentCycle*payoutInterval + grace`).
      const graceExpiresAt =
        readyAt > 0 ? readyAt + Number(gracePeriod) : 0;
      const unpaidActive: UnpaidParticipant[] =
        payoutDue && !allActivePaid
          ? activeParticipants
              .filter((p) => Number(p.paidUntilCycle) < currentCycle)
              .map((p) => ({
                address: p.addr,
                paidUntilCycle: Number(p.paidUntilCycle),
                graceExpiresAt,
                pastGrace: graceExpiresAt > 0 && nowSec > graceExpiresAt,
              }))
          : [];

      const cyclesCompleted =
        state === TandaState.COMPLETED
          ? totalCycles
          : state === TandaState.ACTIVE
            ? Math.max(0, currentCycle - 1)
            : 0;

      const nextDueCycle =
        paidUntilCycle < totalCycles ? paidUntilCycle + 1 : null;
      const nextDueTimestamp =
        nextDueCycle !== null && startTimestamp > 0n
          ? Number(startTimestamp) + nextDueCycle * Number(payoutInterval)
          : null;

      tandas.push({
        id: info.id,
        address: info.address,
        state,
        currentCycle,
        totalCycles,
        cyclesCompleted,
        contributionAmount,
        payoutInterval,
        startTimestamp,
        tokenAddress,
        paidUntilCycle,
        isActive,
        perCycle: perCycleCharge(contributionAmount),
        nextDueCycle,
        nextDueTimestamp,
        claimable,
        payoutDue,
        releasable,
        currentRecipient,
        isCurrentRecipient,
        currentPayoutAmount,
        unpaidActive,
      });
    });
  }

  const primary =
    tandas.find((t) => t.state === TandaState.ACTIVE) ?? tandas[0] ?? null;
  const activeCount = tandas.filter(
    (t) => t.state === TandaState.ACTIVE && t.isActive,
  ).length;

  // ── Status ────────────────────────────────────────────────────────────────
  let status: DashboardStatus;
  if (!isConnected || !address) {
    status = "disconnected";
  } else if (countQ.isError || addrQ.isError || memberQ.isError || stateQ.isError) {
    status = "error";
  } else if (
    countQ.isLoading ||
    (count > 0 && addrQ.isLoading) ||
    (tandaAddrs.length > 0 && memberQ.isLoading) ||
    (memberInfos.length > 0 && stateQ.isLoading)
  ) {
    status = "loading";
  } else if (memberInfos.length === 0) {
    status = "empty";
  } else if (tandas.length > 0) {
    status = "ready";
  } else {
    status = "loading";
  }

  return { status, tandas, primary, activeCount, joinedCount: tandas.length };
}
