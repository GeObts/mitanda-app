"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { LogOut, Wallet, ChevronDown, Copy, Check } from "lucide-react";

import { useAuthMode } from "@/app/providers";
import { useT } from "@/lib/i18n";

function truncate(addr: string) {
  return `${addr.slice(0, 5)}…${addr.slice(-4)}`;
}

/**
 * Connected-state pill (status dot + short address + chevron) with a menu that
 * shows the full address and a Disconnect action. Shared by the Privy and Base
 * Account flows so the header looks identical in both builds.
 */
function ConnectedPill({
  address,
  onDisconnect,
}: {
  address?: `0x${string}`;
  onDisconnect: () => void;
}) {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
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

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — no-op
    }
  }

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
          className="absolute right-0 top-11 z-50 w-56 rounded-btn border border-border bg-background-card p-1 shadow-card-hover"
        >
          {address && (
            <div className="px-2 py-1.5">
              <div className="text-caption text-foreground-subtle">
                {t("connect.connectedWallet")}
              </div>
              <div className="break-all font-mono text-caption text-foreground">
                {address}
              </div>
            </div>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={copyAddress}
            className="flex w-full items-center gap-2 rounded-[10px] px-2 py-2 text-caption font-medium text-foreground transition-colors hover:bg-background-muted"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-success" />
                <span className="text-success">{t("connect.copied")}</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5 text-foreground-muted" />
                {t("connect.copyAddress")}
              </>
            )}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onDisconnect();
            }}
            className="flex w-full items-center gap-2 rounded-[10px] px-2 py-2 text-caption font-medium text-danger transition-colors hover:bg-background-muted"
          >
            <LogOut className="size-3.5" />
            {t("connect.disconnect")}
          </button>
        </div>
      )}
    </div>
  );
}

function SignInButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 items-center gap-1.5 rounded-btn bg-primary px-3 text-caption font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
    >
      <Wallet className="size-4" />
      <span>{t("common.signIn")}</span>
    </button>
  );
}

// Privy hooks may only be called inside <PrivyProvider>, which is only mounted
// in the web build — so this lives in its own component rendered only there.
function PrivyConnect() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { address } = useAccount();

  if (!ready) {
    return (
      <span className="flex h-10 items-center rounded-btn bg-background-muted px-3 text-caption font-medium text-foreground-muted">
        …
      </span>
    );
  }

  if (!authenticated) return <SignInButton onClick={() => login()} />;

  return <ConnectedPill address={address} onDisconnect={() => logout()} />;
}

// Base App build: connect via the Base Account / mini-app wallet. Inside the
// Base App the host wallet auto-connects (see BaseAutoConnect in providers), so
// the connected pill shows immediately; in a normal browser the button triggers
// "Sign in with Base".
function BaseConnect() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isReconnecting) {
    return (
      <span className="flex h-10 items-center rounded-btn bg-background-muted px-3 text-caption font-medium text-foreground-muted">
        …
      </span>
    );
  }

  if (!isConnected) {
    // Prefer the Base Account connector for the in-browser sign-in flow.
    const connector =
      connectors.find((c) => c.id === "baseAccount") ?? connectors[0];
    return (
      <SignInButton
        onClick={() => connector && connect({ connector })}
        disabled={isConnecting || isPending}
      />
    );
  }

  return <ConnectedPill address={address} onDisconnect={() => disconnect()} />;
}

// Icon-only when no auth is available (web build with no Privy App ID), so it
// doesn't crowd the header title.
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
  const mode = useAuthMode();
  if (mode === "base") return <BaseConnect />;
  if (mode === "privy") return <PrivyConnect />;
  return <UnconfiguredConnect />;
}
