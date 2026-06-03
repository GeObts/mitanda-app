"use client";

import Image from "next/image";
import { Plus, Clock, Wallet } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

import { usePrivyConfigured } from "@/app/providers";
import { HeaderCard } from "@/components/mt/header-card";
import { DatePill } from "@/components/mt/date-pill";
import { StatRing } from "@/components/mt/stat-ring";
import { MetricCard } from "@/components/mt/metric-card";
import { ThemeToggle } from "@/components/mt/theme-toggle";
import { ConnectButton } from "@/components/mt/connect-button";
import { CreateTandaButton } from "@/components/create-tanda-dialog";
import { JoinTandaButton } from "@/components/join-tanda-dialog";
import { PayTandaButton } from "@/components/pay-tanda-dialog";
import { CreatedTandasSection } from "@/components/created-tandas-section";
import { ClaimBanner, ClaimButton } from "@/components/claim";
import { ReleaseBanner } from "@/components/release";
import { DefaulterBanner } from "@/components/defaulter";
import { Wordmark } from "@/components/mt/wordmark";
import { useUserTandas, type DashboardData } from "@/lib/hooks/use-user-tandas";
import { useToken } from "@/lib/hooks/use-token";
import { fmtToken, activeChain } from "@/lib/contracts";

function relativeDue(ts: number | null): string {
  if (ts === null) return "All paid up";
  const diffMs = ts * 1000 - Date.now();
  if (diffMs <= 0) return "Overdue";
  const h = Math.round(diffMs / 3_600_000);
  if (h < 24) return `Due in ${h} hour${h === 1 ? "" : "s"}`;
  const d = Math.round(h / 24);
  return `Due in ${d} day${d === 1 ? "" : "s"}`;
}

function pct(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export function Dashboard() {
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
        subtitle="Save together"
        action={
          <div className="flex min-w-0 items-center gap-1">
            <ThemeToggle />
            <ConnectButton />
          </div>
        }
      />

      <DatePill date={new Date()} label="Today" />

      <DashboardGate />
    </main>
  );
}

/**
 * Gate the entire connected dashboard on Privy's auth state — the SAME signal
 * the header's ConnectButton uses. We deliberately do NOT gate on wagmi's
 * isConnected/address: wagmi can auto-reconnect to a previously-connected
 * injected wallet (e.g. Leap) in the background ~2s after load, independent of
 * Privy auth, which would flash the dashboard while the user is not signed in.
 */
function DashboardGate() {
  const configured = usePrivyConfigured();
  // Without Privy there is no real auth, so there's nothing to sign into.
  if (!configured) return <SignInGate />;
  return <PrivyGatedBody />;
}

// usePrivy may only be called inside <PrivyProvider>, which is mounted only when
// configured — so this lives in its own component rendered in that branch.
function PrivyGatedBody() {
  const { ready, authenticated } = usePrivy();
  // Wait for Privy to resolve (no flash) and require an actual sign-in. A
  // background-connected wallet alone never reaches here.
  if (!ready || !authenticated) return <SignInGate />;
  return <ConnectedDashboard />;
}

function ConnectedDashboard() {
  // Reads only run once the user is actually signed in (rendered here only when
  // Privy authenticated).
  const data = useUserTandas();
  return (
    <>
      <DefaulterBanner tandas={data.tandas} />
      <ReleaseBanner tandas={data.tandas} />
      <ClaimBanner tandas={data.tandas} />
      <DashboardBody data={data} />
      <CreatedTandasSection />
    </>
  );
}

/** Signed-out gate — the only thing shown when no wallet is connected. */
function SignInGate() {
  return (
    <div className="rounded-card bg-background-card p-8 text-center shadow-card">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-btn bg-background-muted text-foreground-muted">
        <Wallet className="size-6" />
      </div>
      <h2 className="text-h2">Sign in to get started</h2>
      <p className="mx-auto mt-2 max-w-xs text-body text-foreground-muted">
        Sign in to see your tandas, payments, and progress.
      </p>
      <div className="mt-4 flex justify-center">
        <ConnectButton />
      </div>
    </div>
  );
}

function DashboardBody({ data }: { data: DashboardData }) {
  switch (data.status) {
    case "disconnected":
      return (
        <EmptyCard
          icon={<Wallet className="size-6" />}
          title="Sign in to get started"
          body="Sign in to see your tandas, payments, and progress."
        />
      );
    case "loading":
      return <LoadingCard />;
    case "error":
      return (
        <EmptyCard
          icon={<Clock className="size-6" />}
          title="Couldn't reach the network"
          body={`We couldn't read your tandas from ${activeChain.name}. Check your connection and try again.`}
        />
      );
    case "empty":
      return <EmptyState />;
    case "ready":
      return <ReadyState data={data} />;
  }
}

function ReadyState({ data }: { data: DashboardData }) {
  const { primary, activeCount, joinedCount } = data;

  // The primary tanda's contribution token — render amounts in its symbol/decimals.
  const { token: tokenMeta } = useToken(primary?.tokenAddress);
  const symbol = tokenMeta?.symbol ?? "";
  const decimals = tokenMeta?.decimals ?? 6;
  const fmtUsdc = (v: bigint) => fmtToken(v, decimals);

  // Lead ring (blue): cycle progress on the primary tanda.
  const cyclesDone = primary?.cyclesCompleted ?? 0;
  const cyclesTotal = primary?.totalCycles ?? 0;

  // Next payment: how paid-up the user is on the primary tanda.
  const paidUntil = primary?.paidUntilCycle ?? 0;
  const fullyPaid = primary?.nextDueCycle == null;
  const perCycle = primary?.perCycle ?? 0n;

  return (
    <>
      <div className="rounded-card bg-background-card p-6 shadow-card">
        <h2 className="mb-4 text-h2">Mis Tandas</h2>
        <div className="flex justify-around">
          <StatRing
            percent={pct(cyclesDone, cyclesTotal)}
            label="Cycles"
            value={`${cyclesDone} / ${cyclesTotal}`}
            colorScheme="primary"
          />
          <StatRing
            percent={pct(paidUntil, cyclesTotal)}
            label="Paid"
            value={fullyPaid ? "Up to date" : `${fmtUsdc(perCycle)} ${symbol}`.trim()}
            colorScheme={fullyPaid ? "success" : "warning"}
          />
          <StatRing
            percent={pct(activeCount, joinedCount)}
            label="Active"
            value={`${activeCount} / ${joinedCount}`}
            colorScheme="success"
          />
        </div>
      </div>

      {primary && (
        <div className="space-y-3">
          <MetricCard
            title="Next Payment Due"
            value={Number(fmtUsdc(fullyPaid ? 0n : perCycle))}
            max={Number(fmtUsdc(perCycle)) || 1}
            unit={symbol}
            helperText={relativeDue(primary.nextDueTimestamp)}
            helperIcon={<Clock className="size-3.5" />}
          />
          {primary.claimable > 0n && (
            <ClaimButton
              tandaAddress={primary.address}
              amount={primary.claimable}
              token={primary.tokenAddress}
            />
          )}
          {!fullyPaid && (
            <PayTandaButton
              tanda={{
                address: primary.address,
                contribution: primary.contributionAmount,
                paidUntilCycle: primary.paidUntilCycle,
                totalCycles: primary.totalCycles,
                token: primary.tokenAddress,
                state: primary.state,
              }}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <CreateTandaButton />
        <JoinTandaButton />
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <>
      <div className="rounded-card bg-background-card p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-btn bg-primary-soft text-primary">
          <Plus className="size-6" />
        </div>
        <h2 className="text-h2">No tandas yet</h2>
        <p className="mx-auto mt-2 max-w-xs text-body text-foreground-muted">
          You don&apos;t have any tandas yet — create one to get started, or join
          one with an invite.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <CreateTandaButton />
        <JoinTandaButton />
      </div>
    </>
  );
}

function LoadingCard() {
  return (
    <div className="rounded-card bg-background-card p-6 shadow-card">
      <div className="mb-4 h-5 w-28 animate-pulse rounded-pill bg-background-muted" />
      <div className="flex justify-around">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="size-20 animate-pulse rounded-full bg-background-muted" />
            <div className="h-3 w-12 animate-pulse rounded-pill bg-background-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-card bg-background-card p-8 text-center shadow-card">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-btn bg-background-muted text-foreground-muted">
        {icon}
      </div>
      <h2 className="text-h2">{title}</h2>
      <p className="mx-auto mt-2 max-w-xs text-body text-foreground-muted">
        {body}
      </p>
    </div>
  );
}
