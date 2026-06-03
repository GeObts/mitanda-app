// Shared transaction helpers — error categorization + explorer links.
import {
  BaseError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
} from "viem";

import { activeChain } from "@/lib/contracts";

/** Turn a viem/wagmi error into a short, user-facing message. */
export function describeTxError(err: unknown): string {
  if (!(err instanceof BaseError)) {
    return err instanceof Error ? err.message : "Something went wrong.";
  }
  // User rejected the signature in their wallet.
  if (err.walk((e) => e instanceof UserRejectedRequestError)) {
    return "You rejected the request in your wallet.";
  }
  // Contract revert — surface the custom error name / reason.
  const reverted = err.walk(
    (e) => e instanceof ContractFunctionRevertedError,
  ) as ContractFunctionRevertedError | null;
  if (reverted) {
    const name = reverted.data?.errorName;
    if (name) {
      const argsPart = reverted.data?.args?.length
        ? ` (${reverted.data.args.map(String).join(", ")})`
        : "";
      return `Transaction would revert: ${name}${argsPart}.`;
    }
    if (reverted.reason) return `Transaction reverted: ${reverted.reason}.`;
  }
  // Gas / funds.
  const msg = err.message.toLowerCase();
  if (msg.includes("insufficient funds")) {
    return "Insufficient funds to cover gas for this transaction.";
  }
  return err.shortMessage || err.message;
}

/** Block-explorer tx URL prefix for the active chain (e.g. Arbiscan Sepolia). */
export const EXPLORER_TX = `${
  activeChain.blockExplorers?.default.url ?? "https://sepolia.arbiscan.io"
}/tx/`;
/** @deprecated use EXPLORER_TX — kept as an alias during the chain migration. */
export const BASESCAN_TX = EXPLORER_TX;

export function shortHash(hash?: `0x${string}`): string {
  if (!hash) return "";
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}
