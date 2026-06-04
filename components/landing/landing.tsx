"use client";

import type { ReactNode } from "react";
import {
  UsersRound,
  Lock,
  ShieldCheck,
  Eye,
  Zap,
  BadgeCheck,
  ArrowRight,
  Check,
} from "lucide-react";

import { Wordmark } from "@/components/mt/wordmark";
import { useT } from "@/lib/i18n";
import { LandingNav } from "./landing-nav";
import { SkyBackdrop } from "./sky-backdrop";
import { GlowCard } from "./glow-card";
import { CircleVisual } from "./circle-visual";
import { RotatingArrows } from "./rotating-arrows";

/**
 * MiTanda promo / landing page. A bright, trustworthy "sky" aesthetic: drifting
 * clouds and brand-blue glow behind frosted-glass cards. Warm, plain-spoken,
 * and easy to follow — bank-safe but friendly. Fully bilingual (ES default /
 * EN) via useT(); every primary action leads into the app at /dashboard.
 */
export function Landing() {
  return (
    <div id="top" className="relative min-h-screen text-foreground">
      <SkyBackdrop />
      <LandingNav />
      <Hero />
      <WhatsATanda />
      <HowItWorks />
      <WhySafe />
      <RealMoney />
      <WhoItsFor />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}

/* ─────────────────────────────────────────────── shared building blocks ── */

function PrimaryCta({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#3333ff] to-[#0000ff] px-7 py-4 text-lg font-semibold text-white shadow-[0_14px_36px_-10px_rgba(0,0,255,0.6)] ring-1 ring-inset ring-white/20 transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_46px_-10px_rgba(0,0,255,0.72)] ${className}`}
    >
      {children}
      <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}

function SecondaryCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-[#0000ff]/25 bg-white/70 px-7 py-4 text-lg font-semibold text-[#0000ff] shadow-[0_10px_30px_-14px_rgba(6,10,80,0.3)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-[#7db0ff] dark:hover:bg-white/15"
    >
      {children}
    </a>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-1.5 text-sm font-semibold text-[#0000ff] shadow-[0_6px_20px_-10px_rgba(6,10,80,0.3)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:text-[#7db0ff]">
      {children}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  eyebrowIcon,
  title,
  subtitle,
}: {
  eyebrow: string;
  eyebrowIcon?: ReactNode;
  title: ReactNode;
  subtitle: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Eyebrow>
        {eyebrowIcon}
        {eyebrow}
      </Eyebrow>
      <h2 className="mt-5 text-balance text-[2.25rem] font-bold leading-[1.1] tracking-tight sm:text-[2.85rem]">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-foreground-muted">
        {subtitle}
      </p>
    </div>
  );
}

function GradientIcon({ children }: { children: ReactNode }) {
  return (
    <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0000ff] to-[#3c8aff] text-white shadow-[0_12px_26px_-8px_rgba(0,0,255,0.55)]">
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── 1. Hero ─── */

function Hero() {
  const t = useT();
  const trust = [
    { icon: <RotatingArrows className="size-4" />, label: t("land.trustMade") },
    { icon: <Lock className="size-4" />, label: t("land.trustNoOrg") },
    { icon: <ShieldCheck className="size-4" />, label: t("land.trustDeposit") },
    { icon: <Eye className="size-4" />, label: t("land.trustVerifiable") },
  ];
  return (
    <section className="relative px-6 pb-16 pt-32 sm:pt-40 lg:px-12">
      <div className="mx-auto grid w-full max-w-[90rem] items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="text-left">
          <h1 className="text-balance text-[3.25rem] font-bold leading-[1.02] tracking-tight sm:text-[4.25rem] lg:text-[5rem]">
            {t("land.heroTitle1")}{" "}
            <span className="bg-gradient-to-br from-[#0000ff] to-[#3c8aff] bg-clip-text text-transparent">
              {t("land.heroTitle2")}
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-pretty text-2xl leading-relaxed text-foreground-muted">
            {t("land.heroSubhead")}
          </p>

          <div className="mt-9 flex flex-col items-start gap-3.5 sm:flex-row">
            <PrimaryCta href="/dashboard">{t("land.ctaStart")}</PrimaryCta>
            <SecondaryCta href="/dashboard">{t("land.ctaJoin")}</SecondaryCta>
          </div>

          {/* Trust strip. */}
          <ul className="mt-9 flex flex-wrap items-center justify-start gap-2.5">
            {trust.map((item) => (
              <li
                key={item.label}
                className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-3.5 py-2 text-sm font-medium text-foreground-muted shadow-[0_6px_18px_-12px_rgba(6,10,80,0.3)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]"
              >
                <span className="text-[#0000ff] dark:text-[#7db0ff]">{item.icon}</span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <CircleVisual className="mx-auto w-full max-w-md" />
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────── 1b. What's a tanda? ── */

function WhatsATanda() {
  const t = useT();
  const points = [
    { title: t("land.watP1t"), body: t("land.watP1b") },
    { title: t("land.watP2t"), body: t("land.watP2b") },
    { title: t("land.watP3t"), body: t("land.watP3b") },
  ];
  return (
    <Section id="whats-a-tanda">
      <SectionHeading
        eyebrow={t("land.watEyebrow")}
        title={t("land.watTitle")}
        subtitle={t("land.watSubtitle")}
      />
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {points.map((p, i) => (
          <div key={p.title} className="text-center md:text-left">
            <div className="flex items-center justify-center gap-3 md:justify-start">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#3333ff] to-[#0000ff] text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(0,0,255,0.6)]">
                {i + 1}
              </span>
              <h3 className="text-xl font-semibold tracking-tight">{p.title}</h3>
            </div>
            <p className="mt-3 text-pretty text-base text-foreground-muted">
              {p.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ───────────────────────────────────────────────────── 2. How it works ── */

function HowItWorks() {
  const t = useT();
  const steps = [
    { n: "01", title: t("land.howS1t"), body: t("land.howS1b") },
    { n: "02", title: t("land.howS2t"), body: t("land.howS2b") },
    { n: "03", title: t("land.howS3t"), body: t("land.howS3b") },
    { n: "04", title: t("land.howS4t"), body: t("land.howS4b") },
  ];
  return (
    <Section id="how-it-works">
      <SectionHeading
        eyebrow={t("land.navHow")}
        title={t("land.howTitle")}
        subtitle={t("land.howSubtitle")}
      />
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <GlowCard key={s.n}>
            <span className="text-4xl font-bold text-[#0000ff]/20 dark:text-white/20">
              {s.n}
            </span>
            <h3 className="mt-4 text-xl font-semibold tracking-tight">{s.title}</h3>
            <p className="mt-2.5 text-base text-foreground-muted">{s.body}</p>
          </GlowCard>
        ))}
      </div>
    </Section>
  );
}

/* ───────────────────────────────────────────────────── 3. Why it's safe ── */

function WhySafe() {
  const t = useT();
  const cards = [
    { icon: <Lock className="size-7" />, title: t("land.safeC1t"), body: t("land.safeC1b") },
    { icon: <ShieldCheck className="size-7" />, title: t("land.safeC2t"), body: t("land.safeC2b") },
    { icon: <Eye className="size-7" />, title: t("land.safeC3t"), body: t("land.safeC3b") },
  ];
  return (
    <section id="why-safe" className="px-5 py-16 sm:px-8 sm:py-24">
      <div
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(10,26,255,0.9), rgba(0,0,255,0.92), rgba(28,77,255,0.9))",
        }}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/20 px-6 py-14 shadow-[0_22px_64px_-34px_rgba(0,0,255,0.42)] backdrop-blur-xl sm:px-12"
      >
        <RotatingArrows className="pointer-events-none absolute -right-16 -top-16 size-72 text-white/[0.07]" />
        <RotatingArrows className="pointer-events-none absolute -bottom-20 -left-16 size-72 text-white/[0.07]" />

        <div className="relative mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur">
            <ShieldCheck className="size-4" />
            {t("land.navSafe")}
          </span>
          <h2 className="mt-5 text-balance text-[2.25rem] font-bold leading-[1.1] tracking-tight text-white sm:text-[2.85rem]">
            {t("land.safeTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-white/75">
            {t("land.safeSubtitle")}
          </p>
        </div>

        <div className="relative mt-14 grid gap-6 md:grid-cols-3">
          {cards.map((c) => (
            <div
              key={c.title}
              className="rounded-[26px] border border-white/15 bg-white/[0.08] p-7 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="flex size-14 items-center justify-center rounded-2xl bg-white/15 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]">
                {c.icon}
              </div>
              <h3 className="mt-6 text-2xl font-semibold tracking-tight text-white">
                {c.title}
              </h3>
              <p className="mt-2.5 text-lg text-white/75">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────── 4. Built for real money ── */

function RealMoney() {
  const t = useT();
  return (
    <Section id="real-money">
      <SectionHeading
        eyebrow={t("land.moneyEyebrow")}
        title={t("land.moneyTitle")}
        subtitle={t("land.moneySubtitle")}
      />
      <div className="mt-14 grid gap-7 sm:grid-cols-2">
        <CurrencyCard
          flag="🇲🇽"
          chip="MXNB"
          title={t("land.moneyPesosTitle")}
          body={t("land.moneyPesosBody")}
        />
        <CurrencyCard
          flag="🇺🇸"
          chip="USDC"
          title={t("land.moneyDollarsTitle")}
          body={t("land.moneyDollarsBody")}
        />
        <GlowCard glow="accent">
          <GradientIcon>
            <Zap className="size-7" />
          </GradientIcon>
          <h3 className="mt-6 text-2xl font-semibold tracking-tight">
            {t("land.moneyInstantTitle")}
          </h3>
          <p className="mt-2.5 text-lg text-foreground-muted">
            {t("land.moneyInstantBody")}
          </p>
        </GlowCard>
        <GlowCard glow="accent">
          <GradientIcon>
            <BadgeCheck className="size-7" />
          </GradientIcon>
          <h3 className="mt-6 text-2xl font-semibold tracking-tight">
            {t("land.moneyFeesTitle")}
          </h3>
          <p className="mt-2.5 text-lg text-foreground-muted">
            {t("land.moneyFeesBody")}
          </p>
        </GlowCard>
      </div>
    </Section>
  );
}

function CurrencyCard({
  flag,
  chip,
  title,
  body,
}: {
  flag: string;
  chip: string;
  title: string;
  body: string;
}) {
  return (
    <GlowCard>
      <div className="flex items-center justify-between">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-white/80 text-3xl shadow-[0_8px_20px_-10px_rgba(6,10,80,0.3)] dark:bg-white/10">
          {flag}
        </span>
        <span className="rounded-full bg-gradient-to-b from-[#3333ff] to-[#0000ff] px-3.5 py-1.5 text-sm font-bold text-white shadow-[0_8px_20px_-10px_rgba(0,0,255,0.6)]">
          {chip}
        </span>
      </div>
      <h3 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2.5 text-lg text-foreground-muted">{body}</p>
    </GlowCard>
  );
}

/* ──────────────────────────────────────────────────────── 5. Who it's for ── */

function WhoItsFor() {
  const t = useT();
  const chips = [t("land.whoChip1"), t("land.whoChip2"), t("land.whoChip3")];
  return (
    <section id="who-its-for" className="px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <GlowCard hover={false} className="items-center px-8 py-14 text-center sm:px-16">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0000ff] to-[#3c8aff] text-white shadow-[0_14px_30px_-8px_rgba(0,0,255,0.55)]">
            <UsersRound className="size-8" />
          </div>
          <h2 className="mt-7 text-balance text-[2rem] font-bold leading-[1.12] tracking-tight sm:text-[2.6rem]">
            {t("land.whoTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-xl text-foreground-muted">
            {t("land.whoBody")}
          </p>
          <ul className="mx-auto mt-8 flex flex-wrap justify-center gap-3">
            {chips.map((chip) => (
              <li
                key={chip}
                className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-base font-medium shadow-[0_6px_18px_-12px_rgba(6,10,80,0.3)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]"
              >
                <Check className="size-4 text-[#16a34a]" strokeWidth={3} />
                {chip}
              </li>
            ))}
          </ul>
        </GlowCard>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── 6. Final CTA ── */

function FinalCta() {
  const t = useT();
  return (
    <section className="px-5 pb-20 sm:px-8">
      <div
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(28,77,255,0.9), rgba(0,0,255,0.92), rgba(10,26,255,0.9))",
        }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/20 px-6 py-14 text-center shadow-[0_22px_64px_-34px_rgba(0,0,255,0.42)] backdrop-blur-xl sm:px-12 sm:py-16"
      >
        <RotatingArrows className="pointer-events-none absolute -right-14 -top-14 size-64 text-white/[0.08]" />
        <RotatingArrows className="pointer-events-none absolute -bottom-16 -left-14 size-64 text-white/[0.08]" />
        <div className="relative">
          <h2 className="text-balance text-[2.25rem] font-bold leading-[1.1] tracking-tight text-white sm:text-[3rem]">
            {t("land.finalTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-pretty text-xl text-white/80">
            {t("land.finalBody")}
          </p>
          <div className="mt-9 flex justify-center">
            <a
              href="/dashboard"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-[#0000ff] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.4)] transition-all hover:-translate-y-0.5"
            >
              {t("land.ctaStart")}
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────── 7. Footer ── */

function SiteFooter() {
  const t = useT();
  const links = [
    { label: t("land.openApp"), href: "/dashboard" },
    { label: t("land.navHow"), href: "#how-it-works" },
    { label: t("land.footFaq"), href: "#faq" },
    { label: t("land.footContact"), href: "mailto:hello@mitanda.app" },
  ];
  return (
    <footer className="border-t border-white/50 bg-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-12 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div className="md:max-w-sm">
          <div className="text-2xl font-semibold tracking-tight">
            <Wordmark />
          </div>
          <p className="mt-2 text-base text-foreground-muted">
            {t("land.footTagline")}
          </p>
          <p className="mt-4 text-sm text-foreground-muted">
            {t("land.footCopyright", { year: YEAR })}
          </p>
        </div>

        <div className="flex flex-col gap-5 md:items-end md:text-right">
          <nav className="flex flex-wrap gap-x-8 gap-y-3 md:justify-end">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-base font-medium text-foreground-muted transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <span className="flex items-center gap-1.5 text-sm text-foreground-muted">
            <RotatingArrows className="size-4 text-[#0000ff] dark:text-[#7db0ff]" />
            {t("land.footPowered")}
          </span>
        </div>
      </div>
    </footer>
  );
}

// Static copyright year — the page is fully static, so a build-time constant
// avoids a hydration mismatch from new Date() running on client + server.
const YEAR = 2026;

/* ──────────────────────────────────────────────────────── section wrapper ── */

function Section({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <section id={id} className="px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}
