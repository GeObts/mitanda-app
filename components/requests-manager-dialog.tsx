"use client";

import { useState } from "react";
import { useAccount, useBytecode, useSignMessage, useSignTypedData } from "wagmi";
import { Loader2, Check, X, AlertTriangle, Inbox } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Banner } from "@/components/tx-shared";
import { activeChain } from "@/lib/contracts";
import { manageMessage } from "@/lib/request-messages";
import { inviteDomain, INVITE_TYPES } from "@/lib/invite";
import {
  listRequests,
  approveRequest,
  declineRequest,
  type PendingRequest,
} from "@/lib/requests-client";

const APPROVE_TTL_DAYS = 7;

function relTime(unixSec: number): string {
  const s = Math.max(0, Math.floor(Date.now() / 1000) - unixSec);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function RequestsManagerDialog({
  open,
  onOpenChange,
  tandaAddress,
  tandaId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tandaAddress: `0x${string}`;
  tandaId: bigint;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <ManagerContent
          key={open ? "open" : "closed"}
          tandaAddress={tandaAddress}
          tandaId={tandaId}
        />
      </DialogContent>
    </Dialog>
  );
}

function ManagerContent({
  tandaAddress,
  tandaId,
}: {
  tandaAddress: `0x${string}`;
  tandaId: bigint;
}) {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { signTypedDataAsync } = useSignTypedData();

  // Smart-account creators can list requests, but the contract's joinWithInvite
  // verifies tickets with ECDSA.recover — so they can't issue redeemable invite
  // tickets. Warn up front.
  const { data: code } = useBytecode({ address, chainId: activeChain.id });
  const isSmartWallet = !!code && code !== "0x";

  const [proof, setProof] = useState<`0x${string}` | null>(null);
  const [requests, setRequests] = useState<PendingRequest[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!address) return;
    setBusy(true);
    setError(null);
    try {
      const message = manageMessage(tandaAddress);
      if (process.env.NODE_ENV !== "production") {
        console.log("[manage] signing message:", JSON.stringify(message));
      }
      const sig = await signMessageAsync({ message });
      setProof(sig);
      setRequests(await listRequests(tandaAddress, address, sig));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load requests");
    } finally {
      setBusy(false);
    }
  }

  async function refetch() {
    if (!address || !proof) return;
    setRequests(await listRequests(tandaAddress, address, proof));
  }

  async function approve(requester: `0x${string}`) {
    setActing(requester);
    setError(null);
    try {
      const deadline = Math.floor(Date.now() / 1000) + APPROVE_TTL_DAYS * 86400;
      const ticket = await signTypedDataAsync({
        domain: inviteDomain(tandaAddress),
        types: INVITE_TYPES,
        primaryType: "Invite",
        message: { invitee: requester, tandaId, deadline: BigInt(deadline) },
      });
      await approveRequest(tandaAddress, requester, deadline, ticket);
      await refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to approve");
    } finally {
      setActing(null);
    }
  }

  async function decline(requester: `0x${string}`) {
    if (!address || !proof) return;
    setActing(requester);
    setError(null);
    try {
      await declineRequest(tandaAddress, requester, address, proof);
      await refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to decline");
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-h2">
          Join requests · Tanda #{tandaId.toString()}
        </DialogTitle>
        <DialogDescription>
          Approve a request by signing an invite ticket (no gas). The requester
          can then join.
        </DialogDescription>
      </DialogHeader>

      {error && (
        <Banner tone="danger" icon={<AlertTriangle className="size-4" />}>
          {error}
        </Banner>
      )}

      {isSmartWallet && (
        <Banner tone="danger" icon={<AlertTriangle className="size-4" />}>
          Your wallet is a smart-contract account. You can view requests, but the
          contract&apos;s invite redeem verifies tickets with ECDSA and can&apos;t
          validate smart-account signatures — so approvals can&apos;t be redeemed
          on-chain. Use a standard (EOA) wallet to create tandas that need
          invites.
        </Banner>
      )}

      {requests === null ? (
        <button
          type="button"
          onClick={load}
          disabled={busy || !address}
          className="flex w-full items-center justify-center gap-2 rounded-btn bg-primary px-5 py-3.5 text-h3 text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Sign to load…
            </>
          ) : (
            "Load pending requests"
          )}
        </button>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Inbox className="size-8 text-foreground-subtle" />
          <p className="text-body text-foreground-muted">No pending requests.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {requests.map((r) => (
            <li
              key={r.requester}
              className="flex items-center justify-between gap-2 rounded-btn border border-border p-2.5"
            >
              <div className="min-w-0">
                <div className="truncate font-mono text-caption font-medium text-foreground">
                  {r.requester.slice(0, 6)}…{r.requester.slice(-4)}
                </div>
                <div className="text-caption text-foreground-subtle">
                  {relTime(r.createdAt)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => approve(r.requester)}
                  disabled={acting === r.requester}
                  className="flex items-center gap-1 rounded-btn bg-primary px-2.5 py-1.5 text-caption font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
                >
                  {acting === r.requester ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => decline(r.requester)}
                  disabled={acting === r.requester}
                  className="flex items-center gap-1 rounded-btn border border-border px-2.5 py-1.5 text-caption font-medium text-foreground-muted transition-colors hover:bg-background-muted disabled:opacity-60"
                >
                  <X className="size-3.5" />
                  Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
