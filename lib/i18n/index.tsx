"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { dict, type Lang, type TKey } from "./dict";

type Vars = Record<string, string | number>;
type TFn = (key: TKey, vars?: Vars) => string;

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: TFn;
}

const Ctx = createContext<LangCtx>({
  lang: "es",
  setLang: () => {},
  t: (k) => String(k),
});

function interpolate(s: string, vars?: Vars): string {
  if (!vars) return s;
  let out = s;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return out;
}

/**
 * App language. Default is Spanish; English when toggled. Initial render is
 * deterministic ("es") on both server and first client paint to avoid a
 * hydration mismatch, then we sync to the saved choice in an effect. The app is
 * mostly client-gated (spinners), so the post-hydration switch isn't visible.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    // Sync to the saved choice after hydration. Initial render is deterministic
    // ("es") on server + client to avoid a mismatch; this is the intended
    // mount-time read, so the set-state-in-effect rule is suppressed here.
    try {
      const saved = localStorage.getItem("lang");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "en" || saved === "es") setLangState(saved);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback<TFn>(
    (key, vars) => {
      const entry = dict[key];
      const s = entry ? (entry[lang] ?? entry.en) : String(key);
      return interpolate(s, vars);
    },
    [lang],
  );

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}

/** Convenience: just the translate function. */
export function useT() {
  return useContext(Ctx).t;
}

/** Translatable payout-interval label (seconds → friendly string). */
export function useIntervalLabel() {
  const t = useT();
  return useCallback(
    (seconds: bigint) => {
      const days = Number(seconds) / 86400;
      if (days === 7) return t("interval.weekly");
      if (days === 14) return t("interval.biweekly");
      if (days === 30) return t("interval.monthly");
      if (Number.isInteger(days)) return t("interval.everyNDays", { n: days });
      return t("interval.everyNHours", { n: Math.round(Number(seconds) / 3600) });
    },
    [t],
  );
}
