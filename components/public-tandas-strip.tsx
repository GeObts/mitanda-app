"use client";

import { useState } from "react";
import { Users, Clock, Compass, BadgeCheck, Crown } from "lucide-react";

import { usePublicTandas, type PublicTanda } from "@/lib/hooks/use-public-tandas";
import { useToken } from "@/lib/hooks/use-token";
import { fmtToken } from "@/lib/contracts";
import { JoinTandaDialog } from "@/components/join-tanda-dialog";
import { CreateTandaButton } from "@/components/create-tanda-dialog";
import { AvatarStack } from "@/components/mt/avatar";
import { useT, useIntervalLabel } from "@/lib/i18n";

/**
 * "Public tandas you can join" — a horizontal strip of open, public tandas with
 * seats remaining, read live from the chain (see usePublicTandas). Each card
 * shows the contribution, seats filled, and payout cadence, with a Join button
 * that opens the existing public-join flow (JoinTandaDialog, preset to that
 * clone). Tandas the user already joined or created are badged, not hidden.
 */
export function PublicTandasStrip() {
  const t = useT();
  const { tandas, isLoading, isError } = usePublicTandas();
  const [joinTarget, setJoinTarget] = useState<{
    address: `0x${string}`;
    id: bigint;
  } | null>(null);

  return (
    <section id="discover" aria-labelledby="discover-heading">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-btn bg-primary-soft text-primary dark:text-accent">
          <Compass className="size-4" />
        </span>
        <div>
          <h2 id="discover-heading" className="text-h2">
            {t("discover.title")}
          </h2>
          <p className="text-caption text-foreground-muted">
            {t("discover.subtitle")}
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingStrip />
      ) : isError ? (
        <EmptyState
          title={t("discover.errTitle")}
          body={t("discover.errBody")}
        />
      ) : tandas.length === 0 ? (
        <EmptyState
          title={t("discover.emptyTitle")}
          body={t("discover.emptyBody")}
          showCreate
        />
      ) : (
        <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
          {tandas.map((t) => (
            <PublicTandaCard
              key={t.id}
              tanda={t}
              onJoin={() =>
                setJoinTarget({ address: t.address, id: BigInt(t.id) })
              }
            />
          ))}
        </div>
      )}

      {joinTarget && (
        <JoinTandaDialog
          open={!!joinTarget}
          onOpenChange={(o) => {
            if (!o) setJoinTarget(null);
          }}
          presetAddress={joinTarget.address}
          presetId={joinTarget.id}
        />
      )}
    </section>
  );
}

function PublicTandaCard({
  tanda,
  onJoin,
}: {
  tanda: PublicTanda;
  onJoin: () => void;
}) {
  const t = useT();
  const intervalLabel = useIntervalLabel();
  const { token } = useToken(tanda.tokenAddress);
  const symbol = token?.symbol ?? "";
  const decimals = token?.decimals ?? 6;
  const seatsLeft = tanda.seatsTarget - tanda.seatsFilled;

  return (
    <article className="flex w-72 shrink-0 snap-start flex-col rounded-card border border-border bg-background-card p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <span className="text-h3 text-foreground">Tanda #{tanda.id}</span>
        {tanda.isCreator ? (
          <Badge icon={<Crown className="size-3" />} tone="accent">
            {t("discover.yours")}
          </Badge>
        ) : tanda.alreadyJoined ? (
          <Badge icon={<BadgeCheck className="size-3" />} tone="success">
            {t("discover.joined")}
          </Badge>
        ) : (
          <Badge tone="primary">{t("discover.left", { n: seatsLeft })}</Badge>
        )}
      </div>

      <div className="mt-4">
        <div className="text-caption text-foreground-subtle">
          {t("discover.contribution")}
        </div>
        <div className="text-h2 text-foreground">
          {fmtToken(tanda.contributionAmount, decimals)}{" "}
          <span className="text-h3 text-foreground-muted">{symbol}</span>
        </div>
        <div className="text-caption text-foreground-subtle">
          {t("discover.perRound")}
        </div>
      </div>

      <dl className="mt-4 space-y-2 text-caption">
        <Row
          icon={<Users className="size-3.5" />}
          label={t("discover.seatsFilled")}
          value={`${tanda.seatsFilled}/${tanda.seatsTarget}`}
        />
        <Row
          icon={<Clock className="size-3.5" />}
          label={t("card.payout")}
          value={intervalLabel(tanda.payoutInterval)}
        />
      </dl>

      {/* Seats progress */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-pill bg-background-muted">
        <div
          className="h-full rounded-pill bg-primary transition-[width] duration-300 dark:bg-accent"
          style={{
            width: `${
              tanda.seatsTarget > 0
                ? (tanda.seatsFilled / tanda.seatsTarget) * 100
                : 0
            }%`,
          }}
        />
      </div>

      {/* Members so far */}
      {tanda.memberAddrs.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <AvatarStack addresses={tanda.memberAddrs} size={26} />
          <span className="text-caption text-foreground-subtle">
            {t("discover.inCircle")}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={onJoin}
        className="mt-5 flex w-full items-center justify-center rounded-btn bg-primary px-4 py-2.5 text-body font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        {tanda.alreadyJoined ? t("discover.view") : t("discover.joinCircle")}
      </button>
    </article>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-foreground-subtle">
        {icon}
        {label}
      </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function Badge({
  children,
  icon,
  tone,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  tone: "primary" | "success" | "accent";
}) {
  const cls = {
    primary: "bg-primary-soft text-primary dark:text-accent",
    success: "bg-success/15 text-success",
    accent: "bg-accent-soft text-foreground-muted",
  }[tone];
  return (
    <span
      className={`flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-caption font-medium ${cls}`}
    >
      {icon}
      {children}
    </span>
  );
}

function LoadingStrip() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-60 w-72 shrink-0 animate-pulse rounded-card bg-background-muted"
        />
      ))}
    </div>
  );
}

function EmptyState({
  title,
  body,
  showCreate,
}: {
  title: string;
  body: string;
  showCreate?: boolean;
}) {
  return (
    <div className="rounded-card border border-dashed border-border bg-background-card p-8 text-center shadow-card">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-btn bg-primary-soft text-primary dark:text-accent">
        <Compass className="size-6" />
      </div>
      <h3 className="text-h3">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-body text-foreground-muted">
        {body}
      </p>
      {showCreate ? (
        <div className="mx-auto mt-4 max-w-xs">
          <CreateTandaButton />
        </div>
      ) : null}
    </div>
  );
}
