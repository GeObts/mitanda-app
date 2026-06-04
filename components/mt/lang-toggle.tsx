"use client";

import { useLang } from "@/lib/i18n";

/**
 * Compact ES/EN segmented toggle. Spanish is the default; switching to English
 * flips the whole UI. Persisted to localStorage by the provider.
 */
export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div
      role="group"
      aria-label="Language"
      className="flex h-10 items-center rounded-btn bg-background-muted p-0.5 text-caption font-semibold"
    >
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`flex h-9 items-center rounded-[10px] px-2.5 uppercase transition-colors ${
            lang === l
              ? "bg-background-card text-foreground shadow-card"
              : "text-foreground-muted hover:text-foreground"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
