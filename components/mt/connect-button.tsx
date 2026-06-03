"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { LogOut, Wallet, ChevronDown } from "lucide-react";

import { usePrivyConfigured } from "@/app/providers";

function truncate(addr: string) {
  return `${addr.slice(0, 5)}…${addr.slice(-4)}`;
}

// Privy hooks may only be called inside <PrivyProvider>, which is only mounted
// when an App ID is configured — so this lives in its own component that's
// rendered only in the configured branch.
function PrivyConnect() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { address } = useAccount();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  if (!ready) {
    return (
      <span className="flex h-10 items-center rounded-btn bg-background-muted px-3 text-caption font-medium text-foreground-muted">
        …
      </span>
    );
  }

  if (!authenticated) {
    return (
      <button
        type="button"
        onClick={() => login()}
        className="flex h-10 items-center gap-1.5 rounded-btn bg-primary px-3 text-caption font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        <Wallet className="size-4" />
        <span>Sign in</span>
      </button>
    );
  }

  // Connected: one compact pill (status dot + short address + chevron) that
  // opens a small menu with the full address and Disconnect — keeps the header
  // narrow so the brand name never truncates.
  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex h-10 min-w-0 items-center gap-1.5 rounded-btn bg-background-muted pl-2 pr-1.5 text-foreground transition-colors hover:bg-border-soft"
      >
        <span className="size-2 shrink-0 rounded-full bg-success" aria-hidden />
        <span className="min-w-0 truncate font-mono text-caption font-medium">
          {address ? truncate(address) : "Wallet"}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-foreground-muted" />
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-52 rounded-btn border border-border bg-background-card p-1 shadow-card-hover"
        >
          {address && (
            <div className="px-2 py-1.5">
              <div className="text-caption text-foreground-subtle">
                Connected wallet
              </div>
              <div className="break-all font-mono text-caption text-foreground">
                {address}
              </div>
            </div>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
            className="mt-0.5 flex w-full items-center gap-2 rounded-[10px] px-2 py-2 text-caption font-medium text-danger transition-colors hover:bg-background-muted"
          >
            <LogOut className="size-3.5" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

// Icon-only when Privy isn't configured, so it doesn't crowd the header title.
function UnconfiguredConnect() {
  return (
    <button
      type="button"
      disabled
      aria-label="Wallet login unavailable"
      title="Set NEXT_PUBLIC_PRIVY_APP_ID in .env.local to enable wallet login"
      className="flex size-10 cursor-not-allowed items-center justify-center rounded-btn bg-background-muted text-foreground-subtle opacity-70"
    >
      <Wallet className="size-4" />
    </button>
  );
}

/** Wallet connect / login entry point for the dashboard header. */
export function ConnectButton() {
  const configured = usePrivyConfigured();
  return configured ? <PrivyConnect /> : <UnconfiguredConnect />;
}
