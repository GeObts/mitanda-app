// EIP-712 invite helpers for PRIVATE_TICKETED tandas.
//
// Mirrors Tanda.sol exactly:
//   - typehash: keccak256("Invite(address invitee,uint256 tandaId,uint256 deadline)")
//   - domain:   EIP712Upgradeable.__EIP712_init("MiTanda", "1")
//               => { name:"MiTanda", version:"1", chainId, verifyingContract: <clone> }
//   - ticket:   keccak256(abi.encode(invitee, tandaId, deadline))   (single-use, per-invitee)
//   - signer must equal the tanda's creator.
import { encodeAbiParameters, keccak256, type TypedDataDomain } from "viem";

import { activeChain } from "@/lib/contracts";

export const INVITE_TYPES = {
  Invite: [
    { name: "invitee", type: "address" },
    { name: "tandaId", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

export function inviteDomain(
  cloneAddress: `0x${string}`,
  chainId: number = activeChain.id,
): TypedDataDomain {
  return {
    name: "MiTanda",
    version: "1",
    chainId,
    verifyingContract: cloneAddress,
  };
}

export interface InviteMessage {
  invitee: `0x${string}`;
  tandaId: bigint;
  deadline: bigint;
}

/** Ticket fingerprint — matches keccak256(abi.encode(invitee, tandaId, deadline)). */
export function ticketHash(msg: InviteMessage): `0x${string}` {
  return keccak256(
    encodeAbiParameters(
      [{ type: "address" }, { type: "uint256" }, { type: "uint256" }],
      [msg.invitee, msg.tandaId, msg.deadline],
    ),
  );
}

export interface InvitePayload {
  clone: `0x${string}`;
  tandaId: bigint;
  invitee: `0x${string}`;
  deadline: bigint;
  signature: `0x${string}`;
}

/** Encode an invite into a shareable link path+query. */
export function encodeInviteLink(origin: string, p: InvitePayload): string {
  const q = new URLSearchParams({
    t: p.clone,
    id: p.tandaId.toString(),
    i: p.invitee,
    d: p.deadline.toString(),
    s: p.signature,
  });
  return `${origin}/invite?${q.toString()}`;
}

/** Parse invite params from a URLSearchParams; null if anything is malformed. */
export function decodeInviteParams(
  params: URLSearchParams,
): InvitePayload | null {
  const t = params.get("t");
  const id = params.get("id");
  const i = params.get("i");
  const d = params.get("d");
  const s = params.get("s");
  if (!t || !id || !i || !d || !s) return null;
  if (!/^0x[0-9a-fA-F]{40}$/.test(t)) return null;
  if (!/^0x[0-9a-fA-F]{40}$/.test(i)) return null;
  if (!/^0x[0-9a-fA-F]+$/.test(s)) return null;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(d)) return null;
  return {
    clone: t as `0x${string}`,
    tandaId: BigInt(id),
    invitee: i as `0x${string}`,
    deadline: BigInt(d),
    signature: s as `0x${string}`,
  };
}

export const EXPIRY_OPTIONS = [
  { label: "1 day", days: 1 },
  { label: "3 days", days: 3 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
] as const;
