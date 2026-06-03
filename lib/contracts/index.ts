// Typed contract module for Mi Tanda.
//
// Pairs the deployed Base Sepolia addresses (addresses.ts) with the ABIs
// extracted from the Foundry compiled artifacts (abis/, generated `as const`
// so viem/wagmi infer argument + return types). Import the `mitanda` configs
// directly into wagmi's useReadContract / useReadContracts / useWriteContract.
import {
  ManagerAbi,
  TandaAbi,
  MitandaPassNFTAbi,
  MitandaReceiptNFTAbi,
  MitandaCompletionNFTAbi,
  IERC20Abi,
} from "./abis";
import { addresses, DEFAULT_CHAIN_ID } from "./addresses";
import { formatUnits } from "viem";

export { addresses, DEFAULT_CHAIN_ID, activeChain } from "./addresses";
export type { MitandaAddresses } from "./addresses";
export {
  ManagerAbi,
  TandaAbi,
  MitandaPassNFTAbi,
  MitandaReceiptNFTAbi,
  MitandaCompletionNFTAbi,
  IERC20Abi,
} from "./abis";

const a = addresses[DEFAULT_CHAIN_ID];

/**
 * Ready-to-use {address, abi} configs for the singleton contracts on the
 * default chain (Base Sepolia). Spread into a wagmi read/write call:
 *
 *   useReadContract({ ...mitanda.manager, functionName: "tandaCount" })
 */
export const mitanda = {
  manager: { address: a.manager, abi: ManagerAbi },
  passNft: { address: a.passNft, abi: MitandaPassNFTAbi },
  receiptNft: { address: a.receiptNft, abi: MitandaReceiptNFTAbi },
  completionNft: { address: a.completionNft, abi: MitandaCompletionNFTAbi },
  // Active-chain USDC. Still used as the default token in a few read paths,
  // but payments are token-aware (see erc20() + the per-tanda token()).
  usdc: { address: a.usdc, abi: IERC20Abi },
  // Mock MXNB on Arbitrum Sepolia (undefined on chains without it).
  mxnb: a.mxnb ? { address: a.mxnb, abi: IERC20Abi } : undefined,
} as const;

/**
 * A Tanda is an EIP-1167 clone, so its address is per-tanda (resolved at
 * runtime from the Manager). Build a {address, abi} config for one clone.
 */
export const tandaContract = (address: `0x${string}`) =>
  ({ address, abi: TandaAbi }) as const;

/** {address, abi} config for any ERC-20 (allowlisted contribution token). */
export const erc20 = (address: `0x${string}`) =>
  ({ address, abi: IERC20Abi }) as const;

/** Format a token base-unit amount using its own decimals (no hardcoded 6). */
export const fmtToken = (v: bigint, decimals: number) =>
  Number(formatUnits(v, decimals)).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

// Per-cycle insurance premium = contribution * INSURANCE_BPS / BPS_DENOMINATOR.
// Mirrored from the contracts (TandaManager.INSURANCE_BPS = 1000 => 10%).
export const INSURANCE_BPS = 1000n;
export const BPS_DENOMINATOR = 10000n;

export const premiumPerCycle = (contributionAmount: bigint) =>
  (contributionAmount * INSURANCE_BPS) / BPS_DENOMINATOR;

/** Total charged per cycle = base contribution + insurance premium. */
export const perCycleCharge = (contributionAmount: bigint) =>
  contributionAmount + premiumPerCycle(contributionAmount);

// Payout split (mirrors Tanda.triggerPayout): platform 2%, organizer 3%,
// recipient 95% absorbing rounding dust (pot - platform - organizer).
export const PLATFORM_FEE_BPS = 200n;
export const ORGANIZER_FEE_BPS = 300n;

/** The cycle pot = contribution * active participant count. */
export const cyclePot = (contributionAmount: bigint, activeParticipants: number) =>
  contributionAmount * BigInt(activeParticipants);

/** Recipient's share of a cycle pot (95%, dust-absorbing) — what they receive. */
export const recipientPayout = (pot: bigint) =>
  pot -
  (pot * PLATFORM_FEE_BPS) / BPS_DENOMINATOR -
  (pot * ORGANIZER_FEE_BPS) / BPS_DENOMINATOR;

/** Tanda lifecycle states (matches Tanda.TandaState enum order). */
export enum TandaState {
  OPEN = 0,
  ACTIVE = 1,
  COMPLETED = 2,
}
