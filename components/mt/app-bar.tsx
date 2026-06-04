"use client";

import Image from "next/image";
import { useState } from "react";
import { useAccount } from "wagmi";

import { Wordmark } from "@/components/mt/wordmark";
import { ThemeToggle } from "@/components/mt/theme-toggle";
import { ConnectButton } from "@/components/mt/connect-button";
import { Avatar } from "@/components/mt/avatar";
import { AvatarUploadDialog } from "@/components/avatar-upload-dialog";
import { activeChain } from "@/lib/contracts";

/**
 * Persistent top app bar for the desktop app shell: MiTanda wordmark (left),
 * primary nav (center, hidden on mobile), and the active-chain indicator +
 * theme toggle + wallet/sign-in (right). Sticky so it stays in reach while the
 * dashboard scrolls. On mobile the nav links collapse out and only the brand +
 * wallet controls remain — keeping today's single-column feel.
 */
const NAV = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Discover", href: "#discover" },
  { label: "My passes", href: "/my-nfts" },
];

export function AppBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur-xl">
      {/* Full-bleed: the bar spans the whole viewport (wordmark flush far-left,
          wallet flush far-right). The contained grid lives in <main> below — the
          header deliberately breaks out of it. */}
      <div className="flex h-16 w-full items-center gap-4 px-6 md:px-8">
        <a
          href="/dashboard"
          className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80"
        >
          <Image
            src="/mitanda-mark.png"
            alt="MiTanda logo"
            width={32}
            height={32}
            priority
            className="size-8 object-contain"
          />
          <span className="text-h2 font-semibold tracking-tight">
            <Wordmark />
          </span>
        </a>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-btn px-3 py-2 text-body font-medium text-foreground-muted transition-colors hover:bg-background-muted hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-1.5">
          <ChainIndicator />
          <ThemeToggle />
          <HeaderAvatar />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}

/**
 * The connected wallet's profile photo, as a circle in the header. Clicking it
 * opens the upload dialog. Hidden until a wallet is connected.
 */
function HeaderAvatar() {
  const { address } = useAccount();
  const [open, setOpen] = useState(false);
  if (!address) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Edit profile photo"
        className="rounded-full ring-1 ring-border transition-transform hover:scale-105 hover:ring-primary/40"
      >
        <Avatar address={address} size={32} />
      </button>
      <AvatarUploadDialog open={open} onOpenChange={setOpen} address={address} />
    </>
  );
}

/**
 * Active-chain indicator. The app pins every read/write to a single active
 * chain (see lib/contracts), so this is a status pill rather than a free-form
 * network switcher — switching the wallet away from the active chain would only
 * break writes (which already prompt a switch-back where needed). Hidden on the
 * narrowest screens to protect the wallet pill's space.
 */
function ChainIndicator() {
  return (
    <span className="hidden h-10 items-center gap-1.5 rounded-btn bg-background-muted px-3 text-caption font-medium text-foreground-muted sm:flex">
      <span className="size-2 rounded-full bg-success" aria-hidden />
      <span className="max-w-[7.5rem] truncate">{activeChain.name}</span>
    </span>
  );
}
