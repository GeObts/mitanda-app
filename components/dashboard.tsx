"use client";

import { Plus, Clock, Wallet, Loader2 } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";

import { useAuthMode } from "@/app/providers";
import { AppBar } from "@/components/mt/app-bar";
import { StatRing } from "@/components/mt/stat-ring";
import { MetricCard } from "@/components/mt/metric-card";
import { ConnectButton } from "@/components/mt/connect-button";
import { CreateTandaButton } from "@/components/create-tanda-dialog";
import { JoinTandaButton } from "@/components/join-tanda-dialog";
import { PayTandaButton } from "@/components/pay-tanda-dialog";
import { CreatedTandasSection } from "@/components/created-tandas-section";
import { ClaimBanner, ClaimButton } from "@/components/claim";
import { ReleaseBanner } from "@/components/release";
import { DefaulterBanner } from "@/components/defaulter";
import { TandaSummaryCard } from "@/components/tanda-summary-card";
import { PublicTandasStrip } from "@/components/public-tandas-strip";
import { useUserTandas, type DashboardData } from "@/lib/hooks/use-user-tandas";
import { useToken } from "@/lib/hooks/use-token";
import { fmtToken, activeChain } from "@/lib/contracts";
import { useT } from "@/lib/i18n";
import type { TKey } from "@/lib/i18n/dict";

type TFn = (key: TKey, vars?: Record<string, string | number>) => string;

function relativeDue(ts: number | null, t: TFn): string {
  if (ts === null) return t("due.allPaid");
  const diffMs = ts * 1000 - Date.now();
  if (diffMs <= 0) return t("due.overdue");
  const h = Math.round(diffMs / 3_600_000);
  if (h < 24) return t(h === 1 ? "due.inHour" : "due.inHours", { n: h });
  const d = Math.round(h / 24);
  return t(d === 1 ? "due.inDay" : "due.inDays", { n: d });
}

function pct(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/**
 * The app home. A persistent top app bar over a responsive shell: a single
 * column at mobile / mini-app width (max-w-md), expanding to a wide bento grid
 * on desktop (max-w-7xl). Auth gating, data, and the underlying cards are shared
 * across both — only the layout responds.
 */
export function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <AppBar />
      <main className="mx-auto w-full max-w-md px-5 py-6 md:max-w-7xl md:px-8 md:py-10">
        <DashboardGate />
      </main>
    </div>
  );
}

/**
 * Gate the connected dashboard on the active auth stack:
 *   - web (Privy): gate on Privy's auth state — the SAME signal the header's
 *     ConnectButton uses. We deliberately do NOT gate on wagmi's
 *     isConnected/address here, because wagmi can auto-reconnect a
 *     previously-connected injected wallet in the background, independent of
 *     Privy auth, which would flash the dashboard while signed out.
 *   - Base App (Base Account): there IS no Privy — the wagmi connection (the
 *     host wallet, auto-connected inside the Base App) IS the auth signal, so
 *     we gate on isConnected.
 */
function DashboardGate() {
  const mode = useAuthMode();
  if (mode === "base") return <BaseGatedBody />;
  // No Privy App ID (web build) → no real auth; show the signed-out view (which
  // still surfaces public discovery).
  if (mode !== "privy") return <SignedOutView />;
  return <PrivyGatedBody />;
}

// usePrivy may only be called inside <PrivyProvider>, mounted only in the web
// build — so this lives in its own component rendered in that branch.
function PrivyGatedBody() {
  const { ready, authenticated } = usePrivy();
  if (!ready) return <CenteredSpinner />;
  if (!authenticated) return <SignedOutView />;
  return <ConnectedDashboard />;
}

// Base App build: the wagmi connection (auto-connected host wallet) is the auth
// signal. Show a spinner while the connector is (re)connecting on first load.
function BaseGatedBody() {
  const { isConnected, status } = useAccount();
  if (status === "connecting" || status === "reconnecting") {
    return <CenteredSpinner />;
  }
  if (!isConnected) return <SignedOutView />;
  return <ConnectedDashboard />;
}

/** Signed-out: the sign-in prompt plus public discovery (no wallet needed). */
function SignedOutView() {
  return (
    <div className="space-y-8 md:space-y-12">
      <SignInGate />
      <PublicTandasStrip />
    </div>
  );
}

function ConnectedDashboard() {
  // Reads only run once the user is actually signed in (rendered here only when
  // Privy authenticated).
  const data = useUserTandas();
  return (
    <div className="space-y-6 md:space-y-8">
      <DefaulterBanner tandas={data.tandas} />
      <ReleaseBanner tandas={data.tandas} />
      <ClaimBanner tandas={data.tandas} />
      <DashboardBody data={data} />
      <CreatedTandasSection />
      <PublicTandasStrip />
    </div>
  );
}

/** Signed-out gate card. */
function SignInGate() {
  const t = useT();
  return (
    <div className="mx-auto max-w-xl rounded-card bg-background-card p-8 text-center shadow-card md:p-12">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-btn bg-primary-soft text-primary dark:text-accent">
        <Wallet className="size-6" />
      </div>
      <h2 className="text-h1">{t("dash.signInTitle")}</h2>
      <p className="mx-auto mt-2 max-w-sm text-body text-foreground-muted">
        {t("dash.signInBody")}
      </p>
      <div className="mt-5 flex justify-center">
        <ConnectButton />
      </div>
    </div>
  );
}

function DashboardBody({ data }: { data: DashboardData }) {
  const t = useT();
  switch (data.status) {
    case "disconnected":
      return (
        <EmptyCard
          icon={<Wallet className="size-6" />}
          title={t("dash.signInTitle")}
          body={t("dash.signInBody")}
        />
      );
    case "loading":
      return <LoadingState />;
    case "error":
      return (
        <EmptyCard
          icon={<Clock className="size-6" />}
          title={t("dash.netErrTitle")}
          body={t("dash.netErrBody", { chain: activeChain.name })}
        />
      );
    case "empty":
      return <EmptyState />;
    case "ready":
      return <ReadyState data={data} />;
  }
}

function ReadyState({ data }: { data: DashboardData }) {
  const t = useT();
  const { primary, activeCount, joinedCount } = data;

  // The primary tanda's contribution token — render amounts in its symbol/decimals.
  const { token: tokenMeta } = useToken(primary?.tokenAddress);
  const symbol = tokenMeta?.symbol ?? "";
  const decimals = tokenMeta?.decimals ?? 6;
  const fmtUsdc = (v: bigint) => fmtToken(v, decimals);

  const cyclesDone = primary?.cyclesCompleted ?? 0;
  const cyclesTotal = primary?.totalCycles ?? 0;
  const paidUntil = primary?.paidUntilCycle ?? 0;
  const fullyPaid = primary?.nextDueCycle == null;
  const perCycle = primary?.perCycle ?? 0n;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Summary row: headline stats + the single most useful next action. */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Hero stats — the one place a single, static, very subtle ambient
            accent is allowed (no pulse, no neon). */}
        <div className="relative overflow-hidden rounded-card bg-background-card p-6 shadow-card">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/5 blur-3xl dark:bg-accent/10"
          />
          <h2 className="relative mb-4 text-h2">{t("dash.overview")}</h2>
          <div className="relative flex justify-around">
            <StatRing
              percent={pct(cyclesDone, cyclesTotal)}
              label={t("dash.cycles")}
              value={`${cyclesDone} / ${cyclesTotal}`}
              colorScheme="primary"
            />
            <StatRing
              percent={pct(paidUntil, cyclesTotal)}
              label={t("dash.paid")}
              value={fullyPaid ? t("dash.upToDate") : `${fmtUsdc(perCycle)} ${symbol}`.trim()}
              colorScheme={fullyPaid ? "success" : "warning"}
            />
            <StatRing
              percent={pct(activeCount, joinedCount)}
              label={t("dash.activeStat")}
              value={`${activeCount} / ${joinedCount}`}
              colorScheme="success"
            />
          </div>
        </div>

        {primary ? (
          <div className="space-y-3">
            <MetricCard
              title={t("dash.nextPaymentDue")}
              value={Number(fmtUsdc(fullyPaid ? 0n : perCycle))}
              max={Number(fmtUsdc(perCycle)) || 1}
              unit={symbol}
              helperText={`Tanda #${primary.id} · ${relativeDue(primary.nextDueTimestamp, t)}`}
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
        ) : null}
      </div>

      {/* Your tandas — joined + created — plus quick-action cards so the grid
          always fills the width with intent (no empty columns). */}
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-h2">{t("dash.yourTandas")}</h2>
          <span className="text-caption text-foreground-muted">
            {t("dash.total", { n: joinedCount })}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.tandas.map((tanda) => (
            <TandaSummaryCard key={tanda.id} tanda={tanda} />
          ))}
          <QuickActionCard
            icon={<Plus className="size-5" />}
            title={t("dash.startCircle")}
            body={t("dash.startCircleBody")}
          >
            <CreateTandaButton />
          </QuickActionCard>
          <QuickActionCard
            icon={<Wallet className="size-5" />}
            title={t("dash.joinIdInvite")}
            body={t("dash.joinIdInviteBody")}
          >
            <JoinTandaButton />
          </QuickActionCard>
        </div>
      </section>
    </div>
  );
}

/** Dashed call-to-action tile that hosts an existing modal trigger button. */
function QuickActionCard({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-card border border-dashed border-border bg-background-card/50 p-5 transition-colors hover:border-border-strong">
      <div className="mb-3 flex size-10 items-center justify-center rounded-btn bg-primary-soft text-primary dark:text-accent">
        {icon}
      </div>
      <h3 className="text-h3">{title}</h3>
      <p className="mt-1 mb-4 text-caption text-foreground-muted">{body}</p>
      <div className="mt-auto">{children}</div>
    </div>
  );
}

function EmptyState() {
  const t = useT();
  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-xl rounded-card bg-background-card p-8 text-center shadow-card md:p-12">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-btn bg-primary-soft text-primary dark:text-accent">
          <Plus className="size-6" />
        </div>
        <h2 className="text-h1">{t("dash.noTandasTitle")}</h2>
        <p className="mx-auto mt-2 max-w-sm text-body text-foreground-muted">
          {t("dash.noTandasBody")}
        </p>
        <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-3">
          <CreateTandaButton />
          <JoinTandaButton />
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
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
        <div className="h-40 animate-pulse rounded-card bg-background-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-56 animate-pulse rounded-card bg-background-muted"
          />
        ))}
      </div>
    </div>
  );
}

function CenteredSpinner() {
  return (
    <div className="flex justify-center py-20">
      <Loader2 className="size-8 animate-spin text-primary dark:text-accent" />
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
    <div className="mx-auto max-w-xl rounded-card bg-background-card p-8 text-center shadow-card md:p-12">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-btn bg-background-muted text-foreground-muted">
        {icon}
      </div>
      <h2 className="text-h1">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-body text-foreground-muted">
        {body}
      </p>
    </div>
  );
}
