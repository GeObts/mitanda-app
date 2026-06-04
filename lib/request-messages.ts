// Plain-text messages signed for off-chain auth. Shared by the client (signs)
// and the API routes (recovers) — they MUST stay byte-identical.
//
// These authenticate *who is calling the off-chain request broker*. They do
// NOT authorize joining — that stays gated on-chain by the creator's EIP-712
// ticket, so a spoofed/compromised backend still cannot let anyone join.

/** A requester proves they own the wallet they're requesting to join with. */
export function ownershipMessage(
  tanda: `0x${string}`,
  requester: `0x${string}`,
): string {
  return [
    "Mi Tanda — request to join",
    `Tanda: ${tanda.toLowerCase()}`,
    `Requester: ${requester.toLowerCase()}`,
  ].join("\n");
}

/** A creator proves they're the on-chain creator to manage a tanda's requests. */
export function manageMessage(tanda: `0x${string}`): string {
  return [
    "Mi Tanda — manage join requests",
    `Tanda: ${tanda.toLowerCase()}`,
  ].join("\n");
}

/**
 * A wallet owner proves ownership to set their own profile photo, binding the
 * exact image via its SHA-256 so a captured signature can't be replayed to set
 * a different image. Client (signs) and server (recovers) MUST build this
 * byte-identically.
 */
export function avatarMessage(
  address: `0x${string}`,
  photoHash: string,
  name: string,
): string {
  return [
    "Mi Tanda — set profile",
    `Wallet: ${address.toLowerCase()}`,
    `Photo: ${photoHash}`,
    `Name: ${name}`,
  ].join("\n");
}
