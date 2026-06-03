// Server-side on-chain reads used to authorize off-chain request actions.
import { createPublicClient, http } from "viem";

import { TandaAbi, activeChain } from "@/lib/contracts";

const client = createPublicClient({
  chain: activeChain,
  transport: http(
    process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL ||
      process.env.NEXT_PUBLIC_ARB_SEPOLIA_RPC_URL || // legacy name
      "https://arbitrum-sepolia-rpc.publicnode.com",
  ),
});

/**
 * Verify a personal_sign message ON-CHAIN against `address`. Unlike
 * recoverMessageAddress (ECDSA-only, EOA-only), this uses the ERC-6492
 * universal validator, so it works for EOAs, deployed ERC-1271 smart accounts,
 * AND counterfactual (undeployed) smart accounts — i.e. any Privy wallet type.
 */
export async function verifyOwnership(
  address: `0x${string}`,
  message: string,
  signature: `0x${string}`,
): Promise<boolean> {
  try {
    return await client.verifyMessage({ address, message, signature });
  } catch {
    return false;
  }
}

/** Returns true if `address` has deployed bytecode (i.e. a smart-contract wallet). */
export async function isSmartAccount(address: `0x${string}`): Promise<boolean> {
  const code = await client.getCode({ address });
  return !!code && code !== "0x";
}

export interface TandaOnchain {
  creator: `0x${string}`;
  tandaId: bigint;
  privacy: number; // 0 PUBLIC, 1 PRIVATE_TICKETED
  state: number; // 0 OPEN, 1 ACTIVE, 2 COMPLETED
}

/** Read the fields needed to authorize/validate a request. Throws if not a tanda. */
export async function readTanda(clone: `0x${string}`): Promise<TandaOnchain> {
  // Dev/test-only override (never set in production): lets the request flow be
  // exercised end-to-end before a real private tanda exists on-chain.
  const mock = process.env.MITANDA_DEV_MOCK_TANDA;
  if (mock) {
    const m = JSON.parse(mock);
    if (m.address?.toLowerCase() === clone.toLowerCase()) {
      return {
        creator: m.creator,
        tandaId: BigInt(m.tandaId),
        privacy: m.privacy,
        state: m.state,
      };
    }
  }

  const c = { address: clone, abi: TandaAbi } as const;
  const [creator, tandaId, privacy, state] = await Promise.all([
    client.readContract({ ...c, functionName: "creator" }),
    client.readContract({ ...c, functionName: "tandaId" }),
    client.readContract({ ...c, functionName: "privacy" }),
    client.readContract({ ...c, functionName: "state" }),
  ]);
  return {
    creator: creator as `0x${string}`,
    tandaId: tandaId as bigint,
    privacy: Number(privacy),
    state: Number(state),
  };
}

export const eq = (a?: string, b?: string) =>
  !!a && !!b && a.toLowerCase() === b.toLowerCase();
