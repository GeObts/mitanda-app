import { isAddress, recoverTypedDataAddress } from "viem";

import { getStore } from "@/lib/server/store";
import { readTanda, eq, isSmartAccount } from "@/lib/server/chain";
import { bad, nowSec } from "@/lib/server/respond";
import { inviteDomain, INVITE_TYPES } from "@/lib/invite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/requests/approve — creator submits the EIP-712 ticket for a
// requester. Verifying the ticket recovers the creator, which both proves the
// caller's authority AND validates the ticket the requester will redeem.
// Body: { tanda, requester, deadline, signature }
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return bad("Invalid JSON");
  const { tanda, requester, deadline, signature } = body;
  if (
    !isAddress(tanda) ||
    !isAddress(requester) ||
    typeof signature !== "string" ||
    !(typeof deadline === "number" || /^\d+$/.test(String(deadline)))
  ) {
    return bad("Missing or invalid fields");
  }
  const deadlineBn = BigInt(deadline);

  let chain;
  try {
    chain = await readTanda(tanda);
  } catch {
    return bad("Not a recognized tanda", 400);
  }
  if (chain.privacy !== 1) return bad("This tanda is not private", 400);

  // The contract's joinWithInvite verifies the ticket with ECDSA.recover, which
  // cannot validate a smart-contract-wallet signature. So a smart-account
  // creator can't issue a redeemable ticket — fail clearly instead of producing
  // an "approved" status that reverts on-chain at redeem time.
  if (await isSmartAccount(chain.creator)) {
    return bad(
      "This tanda's creator is a smart-contract wallet. The on-chain invite redeem (joinWithInvite) verifies tickets with ECDSA, which can't validate smart-account signatures — so invite tickets can't be issued. Create the tanda from a standard (EOA) wallet to use the invite/request flow.",
      400,
    );
  }

  // Recover the EIP-712 ticket signer against the clone's domain — must be the
  // on-chain creator (ECDSA, matching the contract's on-chain check).
  let signer: string;
  try {
    signer = await recoverTypedDataAddress({
      domain: inviteDomain(tanda),
      types: INVITE_TYPES,
      primaryType: "Invite",
      message: { invitee: requester, tandaId: chain.tandaId, deadline: deadlineBn },
      signature: signature as `0x${string}`,
    });
  } catch {
    return bad("Invalid ticket signature", 401);
  }
  if (!eq(signer, chain.creator)) {
    return bad("Ticket not signed by the tanda creator", 403);
  }

  const store = getStore();
  const existing = await store.get(tanda, requester);
  await store.put({
    tanda,
    requester,
    status: "approved",
    signedMessage: existing?.signedMessage ?? "",
    createdAt: existing?.createdAt ?? nowSec(),
    deadline: Number(deadlineBn),
    ticket: signature,
    approvedAt: nowSec(),
  });
  return Response.json({ status: "approved" });
}
