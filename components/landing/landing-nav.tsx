"use client";

import Image from "next/image";
import { ThemeToggle } from "@/components/mt/theme-toggle";
import { LangToggle } from "@/components/mt/lang-toggle";
import { Wordmark } from "@/components/mt/wordmark";
import { useT } from "@/lib/i18n";

/**
 * Floating frosted-glass nav pill. It hovers a little below the top of the
 * viewport and stays fixed while scrolling, so the sky and clouds blur softly
 * through it. Logo + wordmark on the left, section anchors in the middle, the
 * theme toggle and one filled "Open app" action on the right.
 */
export function LandingNav() {
  const t = useT();
  const navLinks: [string, string][] = [
    [t("land.navHow"), "#how-it-works"],
    [t("land.navSafe"), "#why-safe"],
    [t("land.navWho"), "#who-its-for"],
  ];
  return (
    <header className="fixed inset-x-0 top-3 z-50 px-4 sm:top-4">
      <nav className="mx-auto flex max-w-5xl items-center gap-3 rounded-full border border-white/60 bg-white/60 px-3 py-2 shadow-[0_10px_40px_-14px_rgba(6,10,80,0.28)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] sm:px-4">
        <a href="#top" className="flex shrink-0 items-center gap-2 pl-1">
          <Image
            src="/mitanda-mark.png"
            alt="MiTanda logo"
            width={30}
            height={30}
            priority
            className="size-7 object-contain"
          />
          <span className="text-lg font-semibold tracking-tight">
            <Wordmark />
          </span>
        </a>

        <div className="mx-auto hidden items-center gap-7 md:flex">
          {navLinks.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <LangToggle />
          <ThemeToggle />
          <a
            href="/dashboard"
            className="rounded-full bg-gradient-to-b from-[#3333ff] to-[#0000ff] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgba(0,0,255,0.6)] ring-1 ring-inset ring-white/20 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(0,0,255,0.7)]"
          >
            {t("land.openApp")}
          </a>
        </div>
      </nav>
    </header>
  );
}
