"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Users,
  Clock,
  Coins,
  CircleDollarSign,
  Gift,
  Check,
  Crown,
  MessageCircle,
  Lock,
  ShieldCheck,
} from "lucide-react";

import { AppBar } from "@/components/mt/app-bar";
import { Avatar, MemberName, AvatarStack } from "@/components/mt/avatar";
import { ClaimButton } from "@/components/claim";
import { PayTandaButton } from "@/components/pay-tanda-dialog";
import { ReleaseBanner } from "@/components/release";
import { DefaulterBanner } from "@/components/defaulter";
import { JoinTandaDialog } from "@/components/join-tanda-dialog";
import { YieldSection } from "@/components/yield-section";
import { fmtToken, TandaState } from "@/lib/contracts";
import { useToken } from "@/lib/hooks/use-token";
import { useProfiles } from "@/lib/hooks/use-avatar";
import { useUserTandas } from "@/lib/hooks/use-user-tandas";
import {
  useTandaDetail,
  type TandaDetail,
  type RosterMember,
} from "@/lib/hooks/use-tanda-detail";
import { useT, useIntervalLabel } from "@/lib/i18n";

export function TandaRoom({ tandaId }: { tandaId: number }) {
  const t = useT();
  const detail = useTandaDetail(tandaId);

  return (
    <div className="min-h-screen bg-background">
      <AppBar />
      <main className="mx-auto w-full max-w-md px-5 py-6 md:max-w-6xl md:px-8 md:py-10">
        <Link
          href="/dashboard"
          className="mb-5 inline-flex items-center gap-1.5 text-body font-medium text-foreground-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {t("nav.dashboard")}
        </Link>

        {detail.status === "loading" && <RoomSkeleton />}
        {detail.status === "notfound" && (
          <Notice title={t("room.notFoundTitle")} body={t("room.notFoundBody")} />
        )}
        {detail.status === "error" && (
          <Notice title={t("room.errTitle")} body={t("room.errBody")} />
        )}
        {detail.status === "ready" &&
          (detail.viewerIsMember ? (
            <MemberRoom detail={detail} />
          ) : (
            <NonMemberView detail={detail} />
          ))}
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── member room ── */

export function MemberRoom({ detail }: { detail: TandaDetail }) {
  // Seed the profile cache for the whole roster in one request.
  useProfiles(detail.members.map((m) => m.address));

  // The viewer's fully-derived tanda (for the contextual actions/banners).
  const { tandas } = useUserTandas();
  const viewer = tandas.find((t) => t.id === detail.id);

  // Token metadata for the Etherfuse yield panel (decimals/symbol).
  const { token } = useToken(detail.tokenAddress);

  return (
    <div className="space-y-6">
      <RoomHeader detail={detail} />

      {viewer && (
        <div className="space-y-3">
          <DefaulterBanner tandas={[viewer]} />
          <ReleaseBanner tandas={[viewer]} />
        </div>
      )}

      <WhoseTurn detail={detail} />

      {viewer && <ViewerActions detail={detail} viewer={viewer} />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
        <Roster detail={detail} unpaid={pastGraceSet(detail)} />
        <PaymentGrid detail={detail} />
      </div>

      {detail.address && (
        <YieldSection
          tandaAddress={detail.address}
          contributionAmount={detail.contributionAmount}
          participantCount={detail.participantCount}
          totalCycles={detail.totalCycles}
          tokenDecimals={token?.decimals ?? 6}
          tokenSymbol={token?.symbol ?? ""}
        />
      )}

      <ChatStub />
    </div>
  );
}

/** Addresses past grace this cycle (from the same clock the dashboard uses). */
function pastGraceSet(detail: TandaDetail): Set<string> {
  const s = new Set<string>();
  if (detail.state !== TandaState.ACTIVE) return s;
  const readyAt =
    detail.startTimestamp > 0n
      ? Number(detail.startTimestamp) +
        detail.currentCycle * Number(detail.payoutInterval)
      : 0;
  const graceEnds = readyAt > 0 ? readyAt + Number(detail.gracePeriod) : 0;
  const nowSec = Math.floor(Date.now() / 1000);
  if (graceEnds > 0 && nowSec > graceEnds) {
    for (const m of detail.members) {
      if (m.isActive && !m.paidThisCycle) s.add(m.address.toLowerCase());
    }
  }
  return s;
}

/* ───────────────────────────────────────────────────────────────── header ── */

function RoomHeader({ detail }: { detail: TandaDetail }) {
  const t = useT();
  const intervalLabel = useIntervalLabel();
  const { token } = useToken(detail.tokenAddress);
  const symbol = token?.symbol ?? "";
  const decimals = token?.decimals ?? 6;

  const progress =
    detail.state === TandaState.OPEN
      ? t("room.seatsFilled", { n: detail.seatsFilled, m: detail.participantCount })
      : detail.state === TandaState.ACTIVE
        ? t("room.cycleOf", { x: detail.currentCycle, n: detail.totalCycles })
        : t("room.roundsComplete", { n: detail.totalCycles });

  return (
    <div className="rounded-card bg-background-card p-6 shadow-card md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-h1 text-foreground">Tanda #{detail.id}</h1>
          <StatusBadge state={detail.state} />
          {!detail.isPublic && (
            <span className="inline-flex items-center gap-1 rounded-pill bg-background-muted px-2.5 py-0.5 text-caption font-medium text-foreground-muted">
              <Lock className="size-3" /> {t("room.private")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <AvatarStack addresses={detail.members.map((m) => m.address)} size={28} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Term
          icon={<Coins className="size-4" />}
          label={t("room.perCycle")}
          value={`${fmtToken(detail.contributionAmount, decimals)} ${symbol}`.trim()}
        />
        <Term
          icon={<CircleDollarSign className="size-4" />}
          label={t("room.potSize")}
          value={`${fmtToken(detail.potSize, decimals)} ${symbol}`.trim()}
        />
        <Term
          icon={<Clock className="size-4" />}
          label={t("room.payout")}
          value={intervalLabel(detail.payoutInterval)}
        />
        <Term
          icon={<Users className="size-4" />}
          label={t("room.progress")}
          value={progress}
        />
      </div>

      {detail.state !== TandaState.OPEN && (
        <div className="mt-5">
          <div className="h-1.5 w-full overflow-hidden rounded-pill bg-background-muted">
            <div
              className="h-full rounded-pill bg-primary transition-[width] duration-300 dark:bg-accent"
              style={{
                width: `${
                  detail.totalCycles > 0
                    ? (detail.cyclesCompleted / detail.totalCycles) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Term({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-caption text-foreground-subtle">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-h3 text-foreground">{value}</div>
    </div>
  );
}

function StatusBadge({ state }: { state: TandaState }) {
  const t = useT();
  const meta = {
    [TandaState.OPEN]: { key: "status.filling", cls: "bg-primary-soft text-primary dark:text-accent" },
    [TandaState.ACTIVE]: { key: "status.active", cls: "bg-success/15 text-success" },
    [TandaState.COMPLETED]: { key: "status.completed", cls: "bg-background-muted text-foreground-muted" },
  }[state] as { key: "status.filling" | "status.active" | "status.completed"; cls: string };
  return (
    <span className={`rounded-pill px-3 py-1 text-caption font-semibold ${meta.cls}`}>
      {t(meta.key)}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────── whose turn ── */

function WhoseTurn({ detail }: { detail: TandaDetail }) {
  const t = useT();
  if (detail.state === TandaState.OPEN) {
    return (
      <InfoStrip
        icon={<Users className="size-5" />}
        title={t("room.fillsTitle")}
        body={t("room.fillsBody")}
      />
    );
  }
  if (detail.state === TandaState.COMPLETED) {
    return (
      <InfoStrip
        icon={<Check className="size-5" />}
        title={t("room.completeTitle")}
        body={t("room.completeBody")}
        tone="success"
      />
    );
  }
  const recipient = detail.currentRecipient;
  return (
    <div className="flex items-center gap-4 rounded-card border border-primary/20 bg-primary-soft p-5 shadow-card">
      {recipient ? <Avatar address={recipient} size={48} /> : null}
      <div className="min-w-0">
        <div className="text-caption font-medium text-primary dark:text-accent">
          {t("room.theirTurn", { x: detail.currentCycle, n: detail.totalCycles })}
        </div>
        <div className="truncate text-h2 text-foreground">
          {recipient ? (
            <MemberName
              address={recipient}
              you={recipient.toLowerCase() === viewerOf(detail)}
            />
          ) : (
            t("room.settingOrder")
          )}
        </div>
      </div>
      <Gift className="ml-auto hidden size-8 shrink-0 text-primary dark:text-accent sm:block" />
    </div>
  );
}

function viewerOf(detail: TandaDetail): string {
  return detail.members.find((m) => m.isViewer)?.address.toLowerCase() ?? "";
}

/* ─────────────────────────────────────────────────────── viewer actions ── */

function ViewerActions({
  detail,
  viewer,
}: {
  detail: TandaDetail;
  viewer: ReturnType<typeof useUserTandas>["tandas"][number];
}) {
  const t = useT();
  const { token } = useToken(detail.tokenAddress);
  const symbol = token?.symbol ?? "";
  const decimals = token?.decimals ?? 6;
  const fullyPaid = viewer.nextDueCycle == null;

  const nothingToDo =
    detail.state !== TandaState.ACTIVE || (fullyPaid && viewer.claimable === 0n);

  return (
    <div className="rounded-card bg-background-card p-6 shadow-card">
      <h2 className="text-h2">{t("room.yourParticipation")}</h2>
      <p className="mt-1 text-caption text-foreground-muted">
        {detail.state === TandaState.OPEN
          ? t("room.partOpen")
          : fullyPaid
            ? t("room.partPaidUp")
            : t("room.partOwe", {
                n: viewer.nextDueCycle ?? 0,
                amt: fmtToken(viewer.perCycle, decimals),
                sym: symbol,
              })}
      </p>

      {viewer.claimable > 0n && (
        <div className="mt-4 flex items-center gap-1.5 rounded-btn bg-success/10 px-3 py-2 text-caption font-medium text-success">
          <Gift className="size-3.5" />
          {t("common.readyToClaim", {
            amt: fmtToken(viewer.claimable, decimals),
            sym: symbol,
          })}
        </div>
      )}

      {!nothingToDo && (
        <div className="mt-4 grid gap-3 sm:max-w-md sm:grid-cols-2">
          {viewer.claimable > 0n && (
            <ClaimButton
              tandaAddress={viewer.address}
              amount={viewer.claimable}
              token={viewer.tokenAddress}
              variant="compact"
            />
          )}
          {!fullyPaid && (
            <PayTandaButton
              tanda={{
                address: viewer.address,
                contribution: viewer.contributionAmount,
                paidUntilCycle: viewer.paidUntilCycle,
                totalCycles: viewer.totalCycles,
                token: viewer.tokenAddress,
                state: viewer.state,
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── roster ── */

function Roster({
  detail,
  unpaid,
}: {
  detail: TandaDetail;
  unpaid: Set<string>;
}) {
  const t = useT();
  return (
    <section className="rounded-card bg-background-card p-6 shadow-card">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-h2">{t("room.members")}</h2>
        <span className="text-caption text-foreground-muted">
          {detail.seatsFilled}
          {detail.state === TandaState.OPEN ? ` / ${detail.participantCount}` : ""}
        </span>
      </div>
      <ul className="space-y-2.5">
        {detail.members.map((m) => (
          <RosterRow
            key={m.address}
            member={m}
            state={detail.state}
            behind={unpaid.has(m.address.toLowerCase())}
          />
        ))}
        {Array.from({
          length: Math.max(0, detail.participantCount - detail.seatsFilled),
        }).map((_, i) => (
          <EmptySeat key={`empty-${i}`} />
        ))}
      </ul>
    </section>
  );
}

function RosterRow({
  member,
  state,
  behind,
}: {
  member: RosterMember;
  state: TandaState;
  behind: boolean;
}) {
  const t = useT();
  return (
    <li className="flex items-center gap-3 rounded-btn border border-border-soft bg-background p-3">
      <Avatar address={member.address} size={40} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-body font-semibold text-foreground">
          <MemberName address={member.address} you={member.isViewer} />
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {member.rotationCycle != null ? (
            <Tag tone="neutral">{t("room.round", { n: member.rotationCycle })}</Tag>
          ) : (
            <Tag tone="neutral">{t("room.orderTBD")}</Tag>
          )}
          {!member.isActive && <Tag tone="danger">{t("room.removed")}</Tag>}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {member.funded ? (
          <Tag tone="success" icon={<Check className="size-3" strokeWidth={3} />}>
            {t("room.gotPot")}
          </Tag>
        ) : member.isCurrentRecipient ? (
          <Tag tone="primary" icon={<Crown className="size-3" />}>
            {t("room.upNext")}
          </Tag>
        ) : null}
        {state === TandaState.ACTIVE &&
          member.isActive &&
          (member.paidThisCycle ? (
            <Tag tone="success">{t("room.paid")}</Tag>
          ) : behind ? (
            <Tag tone="danger">{t("room.pastGrace")}</Tag>
          ) : (
            <Tag tone="warning">{t("room.due")}</Tag>
          ))}
      </div>
    </li>
  );
}

function EmptySeat() {
  const t = useT();
  return (
    <li className="flex items-center gap-3 rounded-btn border border-dashed border-border p-3 text-foreground-subtle">
      <div className="flex size-10 items-center justify-center rounded-full bg-background-muted">
        <Users className="size-4" />
      </div>
      <span className="text-caption">{t("room.openSeat")}</span>
    </li>
  );
}

function Tag({
  children,
  tone,
  icon,
}: {
  children: React.ReactNode;
  tone: "neutral" | "success" | "warning" | "danger" | "primary";
  icon?: React.ReactNode;
}) {
  const cls = {
    neutral: "bg-background-muted text-foreground-muted",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-foreground",
    danger: "bg-danger/10 text-danger",
    primary: "bg-primary-soft text-primary dark:text-accent",
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[0.7rem] font-medium ${cls}`}
    >
      {icon}
      {children}
    </span>
  );
}

/* ────────────────────────────────────────────────────── per-cycle grid ── */

function PaymentGrid({ detail }: { detail: TandaDetail }) {
  const t = useT();
  const cycles = useMemo(
    () => Array.from({ length: detail.totalCycles }, (_, i) => i + 1),
    [detail.totalCycles],
  );

  if (detail.state === TandaState.OPEN) {
    return (
      <section className="rounded-card bg-background-card p-6 shadow-card">
        <h2 className="text-h2">{t("room.paymentsByRound")}</h2>
        <p className="mt-2 text-body text-foreground-muted">
          {t("room.gridOpenBody")}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-card bg-background-card p-6 shadow-card">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="text-h2">{t("room.paymentsByRound")}</h2>
      </div>
      <p className="mb-4 text-caption text-foreground-muted">
        {t("room.gridSubtitle")}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-center">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-background-card text-left text-caption font-medium text-foreground-subtle">
                {t("room.member")}
              </th>
              {cycles.map((c) => (
                <th
                  key={c}
                  className={`min-w-9 text-caption font-medium ${
                    c === detail.currentCycle
                      ? "text-primary dark:text-accent"
                      : "text-foreground-subtle"
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {detail.members.map((m) => (
              <tr key={m.address}>
                <td className="sticky left-0 z-10 bg-background-card py-1 pr-3 text-left">
                  <div className="flex items-center gap-2">
                    <Avatar address={m.address} size={24} />
                    <span className="max-w-[7rem] truncate text-caption text-foreground">
                      <MemberName address={m.address} you={m.isViewer} />
                    </span>
                  </div>
                </td>
                {cycles.map((c) => (
                  <GridCell
                    key={c}
                    paid={m.paidUntilCycle >= c}
                    isRecipient={
                      detail.orderAssigned &&
                      detail.payoutOrder[c - 1] === m.index
                    }
                    funded={
                      detail.orderAssigned &&
                      detail.payoutOrder[c - 1] === m.index &&
                      (detail.state === TandaState.COMPLETED ||
                        c < detail.currentCycle)
                    }
                    due={
                      detail.state === TandaState.ACTIVE &&
                      c <= detail.currentCycle &&
                      m.isActive
                    }
                    isCurrent={c === detail.currentCycle}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Legend />
    </section>
  );
}

function GridCell({
  paid,
  isRecipient,
  funded,
  due,
  isCurrent,
}: {
  paid: boolean;
  isRecipient: boolean;
  funded: boolean;
  due: boolean;
  isCurrent: boolean;
}) {
  const bg = paid
    ? "bg-success/15"
    : due
      ? "bg-danger/10"
      : "bg-background-muted/60";
  const ring = isCurrent ? "ring-1 ring-primary/40 dark:ring-accent/40" : "";
  return (
    <td>
      <div
        className={`mx-auto flex size-7 items-center justify-center rounded-md ${bg} ${ring}`}
      >
        {isRecipient ? (
          <Gift
            className={`size-3.5 ${
              funded ? "text-primary dark:text-accent" : "text-foreground-subtle"
            }`}
          />
        ) : paid ? (
          <Check className="size-3.5 text-success" strokeWidth={3} />
        ) : (
          <span className="size-1 rounded-full bg-foreground-subtle/40" />
        )}
      </div>
    </td>
  );
}

function Legend() {
  const t = useT();
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-caption text-foreground-muted">
      <span className="inline-flex items-center gap-1.5">
        <Check className="size-3.5 text-success" strokeWidth={3} /> {t("room.paid")}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Gift className="size-3.5 text-primary dark:text-accent" /> {t("room.legendReceived")}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-3 rounded bg-danger/20" /> {t("room.legendDue")}
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── chat stub ── */

function ChatStub() {
  const t = useT();
  return (
    <section className="rounded-card border border-dashed border-border bg-background-card/50 p-6 shadow-card">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-btn bg-background-muted text-foreground-muted">
          <MessageCircle className="size-5" />
        </span>
        <div>
          <h2 className="text-h3 text-foreground">{t("room.chatTitle")}</h2>
          <p className="text-caption text-foreground-muted">{t("room.chatSoon")}</p>
        </div>
      </div>
      <div className="mt-4 flex h-36 items-center justify-center rounded-btn bg-background-muted/50 text-caption text-foreground-subtle">
        {t("room.chatBody")}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────── non-member view ── */

function NonMemberView({ detail }: { detail: TandaDetail }) {
  const t = useT();
  const [joinOpen, setJoinOpen] = useState(false);
  const { token } = useToken(detail.tokenAddress);
  const symbol = token?.symbol ?? "";
  const decimals = token?.decimals ?? 6;
  const seatsLeft = detail.participantCount - detail.seatsFilled;
  const joinable =
    detail.state === TandaState.OPEN && detail.isPublic && seatsLeft > 0;

  const body = joinable
    ? t(seatsLeft === 1 ? "room.joinBodyOne" : "room.joinBody", {
        n: seatsLeft,
        amt: fmtToken(detail.contributionAmount, decimals),
        sym: symbol,
      })
    : detail.state !== TandaState.OPEN
      ? t("room.notOpenBody")
      : !detail.isPublic
        ? t("room.privateBody")
        : t("room.fullBody");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <RoomHeader detail={detail} />

      <div className="rounded-card bg-background-card p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-btn bg-primary-soft text-primary dark:text-accent">
          <ShieldCheck className="size-6" />
        </div>
        <h2 className="text-h2">
          {joinable ? t("room.joinTitle") : t("room.notMemberTitle")}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-body text-foreground-muted">
          {body}
        </p>
        {detail.members.length > 0 && (
          <div className="mt-4 flex justify-center">
            <AvatarStack addresses={detail.members.map((m) => m.address)} size={32} />
          </div>
        )}
        {joinable && (
          <button
            type="button"
            onClick={() => setJoinOpen(true)}
            className="mx-auto mt-6 flex items-center justify-center gap-2 rounded-btn bg-primary px-6 py-3 text-h3 text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            {t("discover.joinCircle")}
          </button>
        )}
      </div>

      {detail.address && (
        <JoinTandaDialog
          open={joinOpen}
          onOpenChange={setJoinOpen}
          presetAddress={detail.address}
          presetId={BigInt(detail.id)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── shared / states ── */

function InfoStrip({
  icon,
  title,
  body,
  tone = "primary",
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone?: "primary" | "success";
}) {
  const iconCls =
    tone === "success"
      ? "bg-success/15 text-success"
      : "bg-primary-soft text-primary dark:text-accent";
  return (
    <div className="flex items-center gap-4 rounded-card bg-background-card p-5 shadow-card">
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-btn ${iconCls}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="text-h3 text-foreground">{title}</h2>
        <p className="mt-0.5 text-caption text-foreground-muted">{body}</p>
      </div>
    </div>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  const t = useT();
  return (
    <div className="mx-auto max-w-md rounded-card bg-background-card p-8 text-center shadow-card">
      <h2 className="text-h1">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-body text-foreground-muted">{body}</p>
      <Link
        href="/dashboard"
        className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-btn bg-primary px-5 py-2.5 text-body font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        {t("common.backToDashboard")}
      </Link>
    </div>
  );
}

function RoomSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-44 animate-pulse rounded-card bg-background-muted" />
      <div className="h-20 animate-pulse rounded-card bg-background-muted" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-card bg-background-muted" />
        <div className="h-80 animate-pulse rounded-card bg-background-muted" />
      </div>
    </div>
  );
}
