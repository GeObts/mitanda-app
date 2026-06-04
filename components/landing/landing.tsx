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
import { LandingNav } from "./landing-nav";
import { SkyBackdrop } from "./sky-backdrop";
import { GlowCard } from "./glow-card";
import { CircleVisual } from "./circle-visual";
import { RotatingArrows } from "./rotating-arrows";

/**
 * MiTanda promo / landing page. A bright, trustworthy "sky" aesthetic: drifting
 * clouds and brand-blue glow behind frosted-glass cards. Warm, plain-spoken,
 * and easy to follow — bank-safe but friendly. Every primary action leads into
 * the app at /dashboard.
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
  return (
    <section className="relative px-6 pb-16 pt-32 sm:pt-40 lg:px-12">
      <div className="mx-auto grid w-full max-w-[90rem] items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="text-left">
          <h1 className="text-balance text-[3.25rem] font-bold leading-[1.02] tracking-tight sm:text-[4.25rem] lg:text-[5rem]">
            The savings circle you grew up with,{" "}
            <span className="bg-gradient-to-br from-[#0000ff] to-[#3c8aff] bg-clip-text text-transparent">
              improved for modern times.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-pretty text-2xl leading-relaxed text-foreground-muted">
            Save together with people you trust. Everyone chips in each round,
            and each round one person takes home the whole pot — held and paid
            out safely, automatically.
          </p>

          <div className="mt-9 flex flex-col items-start gap-3.5 sm:flex-row">
            <PrimaryCta href="/dashboard">Start a tanda</PrimaryCta>
            <SecondaryCta href="/dashboard">Join a circle</SecondaryCta>
          </div>

          {/* Trust strip — the "made safe" tagline now lives here as the first
              bubble, alongside the rest. */}
          <ul className="mt-9 flex flex-wrap items-center justify-start gap-2.5">
            {[
              { icon: <RotatingArrows className="size-4" />, label: "Rotating savings circles, made safe" },
              { icon: <Lock className="size-4" />, label: "No organizer holds the money" },
              { icon: <ShieldCheck className="size-4" />, label: "Refundable deposit" },
              { icon: <Eye className="size-4" />, label: "Publicly verifiable" },
            ].map((t) => (
              <li
                key={t.label}
                className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-3.5 py-2 text-sm font-medium text-foreground-muted shadow-[0_6px_18px_-12px_rgba(6,10,80,0.3)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]"
              >
                <span className="text-[#0000ff] dark:text-[#7db0ff]">{t.icon}</span>
                {t.label}
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
  const points = [
    {
      title: "Everyone chips in",
      body: "A group agrees on a fixed amount and contributes it every round.",
    },
    {
      title: "One person takes the pot",
      body: "Each round, the full pot goes to a single member of the circle.",
    },
    {
      title: "It rotates until all are paid",
      body: "The turn passes along until everyone has received once — then it ends.",
    },
  ];
  return (
    <Section id="whats-a-tanda">
      <SectionHeading
        eyebrow="A tradition, honored"
        title="What's a tanda?"
        subtitle="A tanda — also called a cundina — is a rotating savings circle that families and communities have trusted for generations. The idea is simple: save together, take turns, and help each other reach a goal sooner."
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
  const steps = [
    {
      n: "01",
      title: "Create or join a tanda",
      body: "Start your own circle or join one. Make it public, or keep it private with an invite link for friends and family.",
    },
    {
      n: "02",
      title: "Everyone contributes USDC",
      body: "Each cycle, every member puts in the same fixed amount. The smart contract collects and holds it — no organizer touches the money.",
    },
    {
      n: "03",
      title: "One member gets the full pot",
      body: "Each cycle, the entire pot goes to one person in the circle. It could be for rent, a goal, or a rainy day.",
    },
    {
      n: "04",
      title: "Rotate until everyone is paid",
      body: "The payout passes from member to member each cycle. Once everyone has had a turn, the tanda completes.",
    },
  ];
  return (
    <Section id="how-it-works">
      <SectionHeading
        eyebrow="How it works"
        title="Four simple steps, start to finish"
        subtitle="The same rhythm as the tanda you already know — with much more convenience and security."
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
  const cards = [
    {
      icon: <Lock className="size-7" />,
      title: "Held by code, not a person",
      body: "The money is held and released automatically by code — so no organizer can ever run off with the funds.",
    },
    {
      icon: <ShieldCheck className="size-7" />,
      title: "Protected against no-shows",
      body: "A small refundable deposit covers the circle if someone stops paying, so honest members always stay whole.",
    },
    {
      icon: <Eye className="size-7" />,
      title: "Fully transparent",
      body: "Every contribution and every payout is publicly verifiable — anyone in your circle can check, anytime.",
    },
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
        {/* Motif watermarks. */}
        <RotatingArrows className="pointer-events-none absolute -right-16 -top-16 size-72 text-white/[0.07]" />
        <RotatingArrows className="pointer-events-none absolute -bottom-20 -left-16 size-72 text-white/[0.07]" />

        <div className="relative mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur">
            <ShieldCheck className="size-4" />
            Why it&apos;s safe
          </span>
          <h2 className="mt-5 text-balance text-[2.25rem] font-bold leading-[1.1] tracking-tight text-white sm:text-[2.85rem]">
            Built so honest members are always protected
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-white/75">
            The trust of a tanda, with guardrails that don&apos;t depend on
            anyone keeping their word.
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
  return (
    <Section id="real-money">
      <SectionHeading
        eyebrow="Built for real money"
        title="Real money, in and out — instantly"
        subtitle="Save in the currency you already use, and get your pot the moment it's your turn."
      />
      <div className="mt-14 grid gap-7 sm:grid-cols-2">
        <CurrencyCard
          flag="🇲🇽"
          chip="MXNB"
          title="Digital pesos"
          body="Save in pesos with MXNB — the same value as the cash you already use, ready to send and receive."
        />
        <CurrencyCard
          flag="🇺🇸"
          chip="USDC"
          title="Digital dollars"
          body="Prefer dollars? Run your circle in USDC instead. Your circle, your currency — you choose."
        />
        <GlowCard glow="accent">
          <GradientIcon>
            <Zap className="size-7" />
          </GradientIcon>
          <h3 className="mt-6 text-2xl font-semibold tracking-tight">
            Instant payouts
          </h3>
          <p className="mt-2.5 text-lg text-foreground-muted">
            When it&apos;s your turn, the full pot arrives right away — no
            waiting and no chasing anyone down.
          </p>
        </GlowCard>
        <GlowCard glow="accent">
          <GradientIcon>
            <BadgeCheck className="size-7" />
          </GradientIcon>
          <h3 className="mt-6 text-2xl font-semibold tracking-tight">
            Small, clear fees
          </h3>
          <p className="mt-2.5 text-lg text-foreground-muted">
            Only small, transparent fees — shown to you up front, with nothing
            hidden and no surprises.
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
  return (
    <section id="who-its-for" className="px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <GlowCard hover={false} className="items-center px-8 py-14 text-center sm:px-16">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0000ff] to-[#3c8aff] text-white shadow-[0_14px_30px_-8px_rgba(0,0,255,0.55)]">
            <UsersRound className="size-8" />
          </div>
          <h2 className="mt-7 text-balance text-[2rem] font-bold leading-[1.12] tracking-tight sm:text-[2.6rem]">
            Made for circles of people who trust each other
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-xl text-foreground-muted">
            If you&apos;ve ever been in a tanda or cundina, you already know how
            this works. If you haven&apos;t, it&apos;s the easiest way to save
            with people you trust.
          </p>
          <ul className="mx-auto mt-8 flex flex-wrap justify-center gap-3">
            {["Family and friends", "Coworkers and neighbors", "First-timers welcome"].map(
              (t) => (
                <li
                  key={t}
                  className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-base font-medium shadow-[0_6px_18px_-12px_rgba(6,10,80,0.3)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]"
                >
                  <Check className="size-4 text-[#16a34a]" strokeWidth={3} />
                  {t}
                </li>
              ),
            )}
          </ul>
        </GlowCard>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── 6. Final CTA ── */

function FinalCta() {
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
            Start your first tanda today
          </h2>
          <p className="mx-auto mt-4 max-w-md text-pretty text-xl text-white/80">
            Gather your circle, set your amount, and let everyone save
            together — safely.
          </p>
          <div className="mt-9 flex justify-center">
            <a
              href="/dashboard"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-[#0000ff] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.4)] transition-all hover:-translate-y-0.5"
            >
              Start a tanda
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
  const links = [
    { label: "App", href: "/dashboard" },
    { label: "How it works", href: "#how-it-works" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "mailto:hello@mitanda.app" },
  ];
  return (
    <footer className="border-t border-white/50 bg-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-12 sm:px-8 md:flex-row md:items-start md:justify-between">
        {/* Brand, tagline + copyright — all the way left. */}
        <div className="md:max-w-sm">
          <div className="text-2xl font-semibold tracking-tight">
            <Wordmark />
          </div>
          <p className="mt-2 text-base text-foreground-muted">
            The familiar way to save together — now held safely by code.
          </p>
          <p className="mt-4 text-sm text-foreground-muted">
            © {YEAR} MiTanda. Save together, safely.
          </p>
        </div>

        {/* Links + chain credit — all the way right. */}
        <div className="flex flex-col gap-5 md:items-end md:text-right">
          <nav className="flex flex-wrap gap-x-8 gap-y-3 md:justify-end">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-base font-medium text-foreground-muted transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <span className="flex items-center gap-1.5 text-sm text-foreground-muted">
            <RotatingArrows className="size-4 text-[#0000ff] dark:text-[#7db0ff]" />
            Powered by Arbitrum &amp; Base, with Bitso&apos;s MXNB
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
