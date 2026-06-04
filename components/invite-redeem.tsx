"use client";

// Shared invite-redeem engine: given a ticket payload (clone, tandaId, invitee,
// deadline, signature), reads terms, validates the ticket client-side, and runs
// approve → joinWithInvite via the two-step engine. Used by /invite (ticket in
// URL) and /join/<id> approved state (ticket from the request API).
import { useEffect, useMemo, useState } from "react";
import type { ContractFunctionParameters } from "viem";
import { recoverTypedDataAddress } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { Loader2, CheckCircle2, AlertTriangle, Users, ShieldX } from "lucide-react";

import {
  tandaContract,
  TandaState,
  perCycleCharge,
  premiumPerCycle,
  fmtToken,
  activeChain,
} from "@/lib/contracts";
import {
  inviteDomain,
  INVITE_TYPES,
  ticketHash,
  type InvitePayload,
} from "@/lib/invite";
import { useTwoStepTx } from "@/lib/hooks/use-two-step-tx";
import { useToken } from "@/lib/hooks/use-token";
import { CostBreakdown, TwoStepProgress } from "@/components/tx-ui";
import { EXPLORER_TX } from "@/lib/tx-error";
import { Banner, GuardArea, intervalLabel, zeroAddr } from "@/components/tx-shared";

export function InviteRedeem({ payload }: { payload: InvitePayload }) {
  const { address } = useAccount();
  const { clone, tandaId, invitee, deadline, signature } = payload;
  const ticket = useMemo(
    () => ticketHash({ invitee, tandaId, deadline }),
    [invitee, tandaId, deadline],
  );

  const calls = useMemo<ContractFunctionParameters[]>(() => {
    const c = tandaContract(clone);
    return [
      { ...c, functionName: "state" },
      { ...c, functionName: "privacy" },
      { ...c, functionName: "contributionAmount" },
      { ...c, functionName: "payoutInterval" },
      { ...c, functionName: "participantCount" },
      { ...c, functionName: "activeParticipantCount" },
      { ...c, functionName: "creator" },
      { ...c, functionName: "usedTickets", args: [ticket] },
      { ...c, functionName: "revokedTickets", args: [ticket] },
      { ...c, functionName: "isParticipant", args: [address ?? zeroAddr] },
      { ...c, functionName: "token" },
    ];
  }, [clone, ticket, address]);

  const { data, isLoading } = useReadContracts({
    contracts: calls,
    chainId: activeChain.id,
  });

  const terms = useMemo(() => {
    if (!data || data.length < 11) return null;
    const g = (i: number) => data[i]?.result;
    return {
      state: Number(g(0) ?? 0) as TandaState,
      isPrivate: Number(g(1) ?? 0) === 1,
      contribution: (g(2) as bigint) ?? 0n,
      interval: (g(3) as bigint) ?? 0n,
      participantCount: Number(g(4) ?? 0),
      activeCount: Number(g(5) ?? 0),
      creator: (g(6) as `0x${string}`) ?? zeroAddr,
      used: g(7) === true,
      revoked: g(8) === true,
      alreadyJoined: g(9) === true,
      token: (g(10) as `0x${string}` | undefined) ?? undefined,
    };
  }, [data]);

  // The tanda's own contribution token — render + pay in its symbol/decimals.
  const { token: tokenMeta } = useToken(terms?.token);
  const symbol = tokenMeta?.symbol ?? "";
  const decimals = tokenMeta?.decimals ?? 6;

  const [recovered, setRecovered] = useState<`0x${string}` | null>(null);
  useEffect(() => {
    let alive = true;
    recoverTypedDataAddress({
      domain: inviteDomain(clone),
      types: INVITE_TYPES,
      primaryType: "Invite",
      message: { invitee, tandaId, deadline },
      signature,
    })
      .then((a) => alive && setRecovered(a))
      .catch(() => alive && setRecovered(zeroAddr));
    return () => {
      alive = false;
    };
  }, [clone, invitee, tandaId, deadline, signature]);

  const perCycle = terms ? perCycleCharge(terms.contribution) : 0n;
  const slotsRemaining = terms ? terms.participantCount - terms.activeCount : 0;
  const nowSec = Math.floor(Date.now() / 1000);
  const expired = nowSec > Number(deadline);
  const wrongWallet =
    !!address && address.toLowerCase() !== invitee.toLowerCase();
  const signerValid =
    !!terms &&
    recovered != null &&
    recovered.toLowerCase() === terms.creator.toLowerCase();

  const joinable =
    !!terms &&
    !!address &&
    !wrongWallet &&
    !expired &&
    terms.state === TandaState.OPEN &&
    terms.isPrivate &&
    !terms.used &&
    !terms.revoked &&
    !terms.alreadyJoined &&
    slotsRemaining > 0 &&
    signerValid;

  const tx = useTwoStepTx({
    spender: clone,
    requiredAmount: perCycle,
    token: terms?.token,
    action: joinable
      ? {
          address: clone,
          abi: tandaContract(clone).abi,
          functionName: "joinWithInvite",
          args: [deadline, signature],
        }
      : null,
  });

  if (tx.status === "success") return <SuccessCard hash={tx.actionHash} />;
  if (
    tx.status === "approve-sign" ||
    tx.status === "approve-pending" ||
    tx.status === "action-sign" ||
    tx.status === "action-pending"
  ) {
    return (
      <Card>
        <h2 className="mb-3 text-h2">Joining tanda</h2>
        <TwoStepProgress
          status={tx.status}
          errorPhase={tx.errorPhase}
          needsApproval={tx.needsApproval}
          actionLabel="Redeem invite & pay cycle 1"
          approveHash={tx.approveHash}
          actionHash={tx.actionHash}
          tokenSymbol={symbol}
        />
      </Card>
    );
  }
  if (isLoading || !terms) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-caption text-foreground-muted">
          <Loader2 className="size-4 animate-spin" /> Loading invite…
        </div>
      </Card>
    );
  }

  const blocker = (() => {
    if (!terms.isPrivate)
      return "This tanda is public — no invite is needed; just join it.";
    if (expired) return "This invite has expired. Ask the creator for a new one.";
    if (terms.used) return "This invite has already been used.";
    if (terms.revoked) return "This invite was revoked by the creator.";
    if (recovered != null && !signerValid)
      return "This invite signature is invalid — it wasn't signed by the tanda creator.";
    if (terms.state !== TandaState.OPEN)
      return "This tanda is no longer open to new members.";
    if (slotsRemaining <= 0) return "This tanda is full.";
    if (terms.alreadyJoined) return "You're already a participant in this tanda.";
    return null;
  })();

  return (
    <>
      <Card>
        <div className="mb-3 flex items-center gap-1.5 text-caption font-semibold text-foreground">
          <Users className="size-3.5" /> Tanda #{tandaId.toString()}
          {terms.isPrivate && (
            <span className="rounded-pill bg-accent-soft px-2 py-0.5 text-foreground-muted">
              invite-only
            </span>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-y-3 text-caption">
          <Term
            label="Contribution"
            value={`${fmtToken(terms.contribution, decimals)} ${symbol}`.trim()}
          />
          <Term label="Payout interval" value={intervalLabel(terms.interval)} />
          <Term label="Participants" value={`${terms.participantCount}`} />
          <Term
            label="Slots left"
            value={`${slotsRemaining} of ${terms.participantCount}`}
          />
        </dl>
      </Card>

      {wrongWallet ? (
        <ErrorCard
          icon={<ShieldX className="size-6" />}
          title="Wrong wallet"
          body={`This invite is for ${invitee.slice(0, 6)}…${invitee.slice(-4)}. Connect that wallet to join.`}
        />
      ) : blocker ? (
        <Card>
          <Banner tone="muted" icon={<AlertTriangle className="size-4" />}>
            {blocker}
          </Banner>
        </Card>
      ) : (
        <Card>
          {tx.status === "error" && tx.error && (
            <div className="mb-3">
              <Banner tone="danger" icon={<AlertTriangle className="size-4" />}>
                {tx.error}
              </Banner>
            </div>
          )}
          <div className="mb-1.5 text-caption font-semibold text-foreground">
            You pay now (cycle 1)
          </div>
          <CostBreakdown
            contribution={terms.contribution}
            premium={premiumPerCycle(terms.contribution)}
            total={perCycle}
            symbol={symbol}
            decimals={decimals}
          />
          <div className="mt-3">
            <GuardArea
              tx={tx}
              required={perCycle}
              actionLabel="Accept invite & join"
              symbol={symbol}
              decimals={decimals}
            />
          </div>
        </Card>
      )}
    </>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-card bg-background-card p-6 shadow-card">{children}</div>
  );
}

function Term({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-foreground-subtle">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function ErrorCard({
  icon,
  title,
  body,
}: {
  icon?: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-card bg-background-card p-8 text-center shadow-card">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-btn bg-background-muted text-foreground-muted">
        {icon ?? <AlertTriangle className="size-6" />}
      </div>
      <h2 className="text-h2">{title}</h2>
      <p className="mx-auto mt-2 max-w-xs text-body text-foreground-muted">{body}</p>
    </div>
  );
}

function SuccessCard({ hash }: { hash?: `0x${string}` }) {
  return (
    <div className="rounded-card bg-background-card p-8 text-center shadow-card">
      <CheckCircle2 className="mx-auto mb-3 size-10 text-success" />
      <h2 className="text-h2">You&apos;re in!</h2>
      <p className="mx-auto mt-2 max-w-xs text-body text-foreground-muted">
        You&apos;ve joined the tanda. It now appears on your dashboard.
      </p>
      {hash && (
        <a
          href={`${EXPLORER_TX}${hash}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block font-mono text-caption text-accent underline"
        >
          View transaction
        </a>
      )}
      <a
        href="/dashboard"
        className="mt-4 flex w-full items-center justify-center rounded-btn bg-primary px-5 py-3 text-h3 text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        Go to dashboard
      </a>
    </div>
  );
}
