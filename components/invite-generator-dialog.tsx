"use client";

import { useState } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { Loader2, Copy, Check, Link2, AlertTriangle } from "lucide-react";

import { activeChain } from "@/lib/contracts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  inviteDomain,
  INVITE_TYPES,
  encodeInviteLink,
  EXPIRY_OPTIONS,
} from "@/lib/invite";
import { Banner } from "@/components/tx-shared";
import { describeTxError } from "@/lib/tx-error";

export function InviteGeneratorDialog({
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
        <InviteContent
          key={open ? "open" : "closed"}
          tandaAddress={tandaAddress}
          tandaId={tandaId}
        />
      </DialogContent>
    </Dialog>
  );
}

function InviteContent({
  tandaAddress,
  tandaId,
}: {
  tandaAddress: `0x${string}`;
  tandaId: bigint;
}) {
  const { address } = useAccount();
  const [invitee, setInvitee] = useState("");
  const [days, setDays] = useState(7);
  const [link, setLink] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<bigint | null>(null);
  const [copied, setCopied] = useState(false);

  const { signTypedDataAsync, isPending, error } = useSignTypedData();

  const inviteeValid = /^0x[0-9a-fA-F]{40}$/.test(invitee.trim());

  async function generate() {
    if (!inviteeValid) return;
    const invAddr = invitee.trim() as `0x${string}`;
    const dl = BigInt(Math.floor(Date.now() / 1000) + days * 86400);
    const signature = await signTypedDataAsync({
      domain: inviteDomain(tandaAddress, activeChain.id),
      types: INVITE_TYPES,
      primaryType: "Invite",
      message: { invitee: invAddr, tandaId, deadline: dl },
    });
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    setDeadline(dl);
    setLink(
      encodeInviteLink(origin, {
        clone: tandaAddress,
        tandaId,
        invitee: invAddr,
        deadline: dl,
        signature,
      }),
    );
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  // ── Generated link view ────────────────────────────────────────────────────
  if (link && deadline != null) {
    const expiryStr = new Date(Number(deadline) * 1000).toLocaleString();
    return (
      <div className="space-y-4">
        <DialogHeader>
          <DialogTitle className="text-h2">Invite link ready</DialogTitle>
          <DialogDescription>
            Send this to the invited wallet. It only works for that address and
            can be used once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <label className="text-caption font-semibold text-foreground">
            Shareable link
          </label>
          <div className="flex items-stretch gap-2">
            <div className="min-w-0 flex-1 truncate rounded-btn border border-border bg-background-muted px-3 py-2.5 font-mono text-caption text-foreground">
              {link}
            </div>
            <button
              type="button"
              onClick={copy}
              className="flex shrink-0 items-center gap-1.5 rounded-btn bg-primary px-3 text-caption font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <Banner tone="muted" icon={<Link2 className="size-4" />}>
          For wallet{" "}
          <span className="font-mono">
            {invitee.slice(0, 6)}…{invitee.slice(-4)}
          </span>
          . Expires <strong>{expiryStr}</strong>.
        </Banner>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-h2">Invite to Tanda #{tandaId.toString()}</DialogTitle>
        <DialogDescription>
          Private tandas are invite-only. Sign a ticket for a specific wallet —
          this is a signature, not a transaction (no gas).
        </DialogDescription>
      </DialogHeader>

      {error && (
        <Banner tone="danger" icon={<AlertTriangle className="size-4" />}>
          {describeTxError(error)}
        </Banner>
      )}

      <div className="space-y-1.5">
        <label className="text-caption font-semibold text-foreground">
          Invitee wallet address
        </label>
        <input
          placeholder="0x…"
          value={invitee}
          onChange={(e) => setInvitee(e.target.value)}
          className="w-full rounded-btn border border-border bg-background px-3 py-2.5 font-mono text-body text-foreground outline-none transition-colors placeholder:text-foreground-subtle focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-accent dark:focus:ring-accent/20"
        />
        {invitee.length > 0 && !inviteeValid && (
          <p className="text-caption text-danger">
            Enter a valid 0x wallet address.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-caption font-semibold text-foreground">
          Expires in
        </label>
        <div className="flex gap-1.5">
          {EXPIRY_OPTIONS.map((o) => (
            <button
              key={o.days}
              type="button"
              onClick={() => setDays(o.days)}
              className={`rounded-pill px-3 py-1.5 text-caption font-medium transition-colors ${
                days === o.days
                  ? "bg-primary text-primary-foreground dark:bg-accent"
                  : "bg-background-muted text-foreground-muted hover:bg-border-soft"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {address && (
        <p className="text-caption text-foreground-subtle">
          Signed by your wallet{" "}
          <span className="font-mono">
            {address.slice(0, 6)}…{address.slice(-4)}
          </span>{" "}
          (must be the tanda creator).
        </p>
      )}

      <button
        type="button"
        onClick={generate}
        disabled={!inviteeValid || isPending || !address}
        className="flex w-full items-center justify-center gap-2 rounded-btn bg-primary px-5 py-3.5 text-h3 text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Sign in your wallet…
          </>
        ) : (
          "Generate invite link"
        )}
      </button>
    </div>
  );
}
