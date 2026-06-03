"use client";

import { useMemo, useState } from "react";
import type { ContractFunctionParameters } from "viem";
import Image from "next/image";
import { useAccount, useReadContract, useReadContracts, useSignMessage } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Users, Clock, CheckCircle2, AlertTriangle, Wallet } from "lucide-react";

import { HeaderCard } from "@/components/mt/header-card";
import { ThemeToggle } from "@/components/mt/theme-toggle";
import { ConnectButton } from "@/components/mt/connect-button";
import {
  mitanda,
  tandaContract,
  TandaState,
  perCycleCharge,
  premiumPerCycle,
  fmtToken,
  activeChain,
} from "@/lib/contracts";
import { ownershipMessage } from "@/lib/request-messages";
import { submitRequest, fetchStatus } from "@/lib/requests-client";
import { useTwoStepTx } from "@/lib/hooks/use-two-step-tx";
import { useToken } from "@/lib/hooks/use-token";
import { CostBreakdown, TwoStepProgress } from "@/components/tx-ui";
import { Banner, GuardArea, intervalLabel, zeroAddr } from "@/components/tx-shared";
import { InviteRedeem, Card, ErrorCard } from "@/components/invite-redeem";
import { RequestsManagerDialog } from "@/components/requests-manager-dialog";
import { Wordmark } from "@/components/mt/wordmark";

export function JoinRequest({ tandaId }: { tandaId: bigint }) {
  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 bg-background px-6 py-8">
      <HeaderCard
        icon={
          <Image
            src="/mitanda-mark.png"
            alt="MiTanda logo"
            width={48}
            height={48}
            priority
            className="size-full object-contain"
          />
        }
        title={<Wordmark />}
        subtitle={`Join tanda #${tandaId.toString()}`}
        action={
          <div className="flex min-w-0 items-center gap-1">
            <ThemeToggle />
            <ConnectButton />
          </div>
        }
      />
      <Body tandaId={tandaId} />
    </main>
  );
}

function Body({ tandaId }: { tandaId: bigint }) {
  const { address, isConnected } = useAccount();

  // Resolve tandaId -> clone.
  const { data: cloneData, isLoading: resolving } = useReadContract({
    ...mitanda.manager,
    functionName: "tandaIdToAddress",
    args: [tandaId],
    chainId: activeChain.id,
  });
  const clone = cloneData as `0x${string}` | undefined;
  const realClone = !!clone && clone !== zeroAddr;

  // Read terms.
  const calls = useMemo<ContractFunctionParameters[]>(() => {
    if (!realClone) return [];
    const c = tandaContract(clone!);
    return [
      { ...c, functionName: "state" },
      { ...c, functionName: "privacy" },
      { ...c, functionName: "contributionAmount" },
      { ...c, functionName: "payoutInterval" },
      { ...c, functionName: "participantCount" },
      { ...c, functionName: "activeParticipantCount" },
      { ...c, functionName: "isParticipant", args: [address ?? zeroAddr] },
      { ...c, functionName: "token" },
      { ...c, functionName: "creator" },
    ];
  }, [realClone, clone, address]);
  const { data, isLoading } = useReadContracts({
    contracts: calls,
    chainId: activeChain.id,
    query: { enabled: realClone },
  });
  const terms = useMemo(() => {
    if (!data || data.length < 9) return null;
    const g = (i: number) => data[i]?.result;
    return {
      state: Number(g(0) ?? 0) as TandaState,
      isPrivate: Number(g(1) ?? 0) === 1,
      contribution: (g(2) as bigint) ?? 0n,
      interval: (g(3) as bigint) ?? 0n,
      participantCount: Number(g(4) ?? 0),
      activeCount: Number(g(5) ?? 0),
      alreadyJoined: g(6) === true,
      token: (g(7) as `0x${string}` | undefined) ?? undefined,
      creator: (g(8) as `0x${string}` | undefined) ?? undefined,
    };
  }, [data]);

  // Is the connected wallet the tanda's creator? (compared on the active chain
  // read, never the wallet's selected chain).
  const isCreator =
    !!address &&
    !!terms?.creator &&
    terms.creator.toLowerCase() === address.toLowerCase();

  // The tanda's own contribution token — render + pay in its symbol/decimals.
  const { token: tokenMeta } = useToken(terms?.token);
  const symbol = tokenMeta?.symbol ?? "";
  const decimals = tokenMeta?.decimals ?? 6;

  // Off-chain request status. Gated on the CONNECTED wallet (keyed by address)
  // and never fetched for the creator, an existing member, a public tanda, or a
  // signed-out visitor — so a stale or other-wallet request can never leak in.
  const statusEligible =
    isConnected &&
    !!address &&
    realClone &&
    !!terms?.isPrivate &&
    !isCreator &&
    !terms?.alreadyJoined;
  const statusQ = useQuery({
    queryKey: ["reqStatus", clone, address],
    queryFn: () => fetchStatus(clone!, address!),
    enabled: statusEligible,
    refetchInterval: (q) =>
      q.state.data?.status === "pending" ? 8000 : false,
  });

  // ── State machine ──────────────────────────────────────────────────────────

  // 1) Not signed in → sign-in prompt ONLY (no tanda details, no status card).
  if (!isConnected || !address) {
    return <SignInGate />;
  }

  // 2) Resolving / not found / loading the clone terms.
  if (resolving) {
    return <LoadingCard />;
  }
  if (!realClone) {
    return (
      <ErrorCard
        title="Tanda not found"
        body={`There's no tanda with ID #${tandaId.toString()}.`}
      />
    );
  }
  if (isLoading || !terms) {
    return <LoadingCard />;
  }

  const slots = terms.participantCount - terms.activeCount;

  // 3) Connected wallet IS the creator → manage view. Never request/waiting.
  if (isCreator) {
    return (
      <CreatorView tandaId={tandaId} clone={clone!} isPrivate={terms.isPrivate} />
    );
  }

  // 4) Already a participant → "you're already in" + dashboard.
  if (terms.alreadyJoined) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="size-9 text-success" />
          <h2 className="text-h2">You&apos;re already in this tanda</h2>
          <p className="max-w-xs text-body text-foreground-muted">
            You&apos;re a participant in tanda #{tandaId.toString()}. Track your
            payments and progress on your dashboard.
          </p>
          <a
            href="/"
            className="mt-1 flex w-full items-center justify-center rounded-btn bg-primary px-5 py-3 text-h3 text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Go to dashboard
          </a>
        </div>
      </Card>
    );
  }

  // 5) Public tanda (not creator, not joined) → direct join.
  if (!terms.isPrivate) {
    return (
      <>
        <TermsCard
          tandaId={tandaId}
          terms={terms}
          slots={slots}
          symbol={symbol}
          decimals={decimals}
        />
        <PublicJoin
          clone={clone!}
          terms={terms}
          slots={slots}
          symbol={symbol}
          decimals={decimals}
        />
      </>
    );
  }

  // 6) Private tanda (not creator, not joined) → request / pending / approved.
  const status = statusQ.data?.status ?? "none";
  const statusLoading = statusEligible && statusQ.isLoading;
  return (
    <>
      <TermsCard
        tandaId={tandaId}
        terms={terms}
        slots={slots}
        symbol={symbol}
        decimals={decimals}
      />
      {statusLoading ? (
        <LoadingCard label="Checking your request status…" />
      ) : status === "approved" &&
        statusQ.data?.ticket &&
        statusQ.data?.deadline ? (
        <InviteRedeem
          payload={{
            clone: clone!,
            tandaId,
            invitee: address,
            deadline: BigInt(statusQ.data.deadline),
            signature: statusQ.data.ticket,
          }}
        />
      ) : status === "pending" ? (
        <Card>
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <Clock className="size-8 text-warning" />
            <h2 className="text-h3">Waiting for the organizer to approve you</h2>
            <p className="max-w-xs text-caption text-foreground-muted">
              Your request was sent. This page updates automatically once the
              creator approves — you can leave and come back.
            </p>
          </div>
        </Card>
      ) : (
        <RequestToJoin
          clone={clone!}
          address={address}
          declined={status === "declined"}
          onSent={() => statusQ.refetch()}
        />
      )}
    </>
  );
}

/** Signed-out gate: a sign-in prompt only — no tanda details, no status. */
function SignInGate() {
  return (
    <div className="rounded-card bg-background-card p-8 text-center shadow-card">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-btn bg-background-muted text-foreground-muted">
        <Wallet className="size-6" />
      </div>
      <h2 className="text-h2">Sign in to view this invite</h2>
      <p className="mx-auto mt-2 max-w-xs text-body text-foreground-muted">
        This invite link is private. Sign in to see the tanda&apos;s terms and
        request to join.
      </p>
      <div className="mt-4 flex justify-center">
        <ConnectButton />
      </div>
    </div>
  );
}

function LoadingCard({ label = "Loading tanda…" }: { label?: string }) {
  return (
    <Card>
      <div className="flex items-center gap-2 text-caption text-foreground-muted">
        <Loader2 className="size-4 animate-spin" /> {label}
      </div>
    </Card>
  );
}

/** Creator-of-this-tanda view — manage requests / go to dashboard. */
function CreatorView({
  tandaId,
  clone,
  isPrivate,
}: {
  tandaId: bigint;
  clone: `0x${string}`;
  isPrivate: boolean;
}) {
  const [mgrOpen, setMgrOpen] = useState(false);
  return (
    <>
      <Card>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-btn bg-accent-soft text-foreground">
            <Users className="size-6" />
          </div>
          <h2 className="text-h2">You created this tanda</h2>
          <p className="max-w-xs text-body text-foreground-muted">
            {isPrivate
              ? "This is your tanda's invite link. Share it so people can request to join — you approve requests from the requests manager."
              : "This is your tanda's share link. Anyone can join it directly; manage it from your dashboard."}
          </p>
          <div className="mt-1 w-full space-y-2">
            {isPrivate && (
              <button
                type="button"
                onClick={() => setMgrOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-btn bg-primary px-5 py-3 text-h3 text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Manage join requests
              </button>
            )}
            <a
              href="/"
              className="flex w-full items-center justify-center rounded-btn border border-border px-5 py-2.5 text-caption font-medium text-foreground-muted transition-colors hover:bg-background-muted"
            >
              Go to dashboard
            </a>
          </div>
        </div>
      </Card>
      {isPrivate && (
        <RequestsManagerDialog
          open={mgrOpen}
          onOpenChange={setMgrOpen}
          tandaAddress={clone}
          tandaId={tandaId}
        />
      )}
    </>
  );
}

function TermsCard({
  tandaId,
  terms,
  slots,
  symbol,
  decimals,
}: {
  tandaId: bigint;
  terms: { contribution: bigint; interval: bigint; participantCount: number; isPrivate: boolean };
  slots: number;
  symbol: string;
  decimals: number;
}) {
  return (
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
        <Term label="Slots left" value={`${slots} of ${terms.participantCount}`} />
      </dl>
    </Card>
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

function RequestToJoin({
  clone,
  address,
  declined,
  onSent,
}: {
  clone: `0x${string}`;
  address: `0x${string}`;
  declined: boolean;
  onSent: () => void;
}) {
  const { signMessageAsync, isPending } = useSignMessage();
  const [error, setError] = useState<string | null>(null);

  async function request() {
    setError(null);
    try {
      const sig = await signMessageAsync({
        message: ownershipMessage(clone, address),
      });
      await submitRequest(clone, address, sig);
      onSent();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send request");
    }
  }

  return (
    <Card>
      {declined && (
        <div className="mb-3">
          <Banner tone="muted" icon={<AlertTriangle className="size-4" />}>
            A previous request was declined. You can request again.
          </Banner>
        </div>
      )}
      {error && (
        <div className="mb-3">
          <Banner tone="danger" icon={<AlertTriangle className="size-4" />}>
            {error}
          </Banner>
        </div>
      )}
      <p className="mb-3 text-caption text-foreground-muted">
        This is a private tanda. Send a request — you&apos;ll sign a message to
        prove you own this wallet (no gas). The organizer approves you, then you
        can join.
      </p>
      <button
        type="button"
        onClick={request}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-btn bg-primary px-5 py-3.5 text-h3 text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Sign in your wallet…
          </>
        ) : (
          "Request to join"
        )}
      </button>
    </Card>
  );
}

function PublicJoin({
  clone,
  terms,
  slots,
  symbol,
  decimals,
}: {
  clone: `0x${string}`;
  terms: { contribution: bigint; state: TandaState; token?: `0x${string}` };
  slots: number;
  symbol: string;
  decimals: number;
}) {
  const perCycle = perCycleCharge(terms.contribution);
  const joinable = terms.state === TandaState.OPEN && slots > 0;
  const tx = useTwoStepTx({
    spender: clone,
    requiredAmount: perCycle,
    token: terms.token,
    action: joinable
      ? { address: clone, abi: tandaContract(clone).abi, functionName: "join", args: [] }
      : null,
  });

  if (tx.status === "success") {
    return (
      <Card>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <CheckCircle2 className="size-8 text-success" />
          <h2 className="text-h3">You&apos;re in!</h2>
          <a href="/" className="text-caption text-accent underline">
            Go to dashboard
          </a>
        </div>
      </Card>
    );
  }
  if (
    tx.status === "approve-sign" ||
    tx.status === "approve-pending" ||
    tx.status === "action-sign" ||
    tx.status === "action-pending"
  ) {
    return (
      <Card>
        <h2 className="mb-3 text-h3">Joining tanda</h2>
        <TwoStepProgress
          status={tx.status}
          errorPhase={tx.errorPhase}
          needsApproval={tx.needsApproval}
          actionLabel="Join tanda (pay cycle 1)"
          approveHash={tx.approveHash}
          actionHash={tx.actionHash}
          tokenSymbol={symbol}
        />
      </Card>
    );
  }

  return (
    <Card>
      {tx.status === "error" && tx.error && (
        <div className="mb-3">
          <Banner tone="danger" icon={<AlertTriangle className="size-4" />}>
            {tx.error}
          </Banner>
        </div>
      )}
      {!joinable ? (
        <Banner tone="muted" icon={<AlertTriangle className="size-4" />}>
          {terms.state !== TandaState.OPEN
            ? "This tanda is no longer open."
            : "This tanda is full."}
        </Banner>
      ) : (
        <>
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
              actionLabel="Join & pay cycle 1"
              symbol={symbol}
              decimals={decimals}
            />
          </div>
        </>
      )}
    </Card>
  );
}
