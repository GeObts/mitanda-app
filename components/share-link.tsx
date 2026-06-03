"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";

export function joinLink(tandaId: bigint | number): string {
  const path = `/join/${tandaId.toString()}`;
  return typeof window !== "undefined"
    ? `${window.location.origin}${path}`
    : path;
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Full link box with a copy button (Create success panel). */
export function ShareLinkBox({ tandaId }: { tandaId: bigint }) {
  const [copied, setCopied] = useState(false);
  const link = joinLink(tandaId);
  return (
    <div className="flex items-stretch gap-2">
      <div className="min-w-0 flex-1 truncate rounded-btn border border-border bg-background-muted px-3 py-2.5 font-mono text-caption text-foreground">
        {link}
      </div>
      <button
        type="button"
        onClick={async () => {
          if (await copy(link)) {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }
        }}
        className="flex shrink-0 items-center gap-1.5 rounded-btn bg-primary px-3 text-caption font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

/** Compact "Share" button that copies the join link (list rows). */
export function ShareButton({ tandaId }: { tandaId: bigint }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copy(joinLink(tandaId))) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }
      }}
      className="flex h-11 items-center gap-1.5 rounded-btn border border-border px-4 text-body font-semibold text-foreground transition-colors hover:bg-background-muted"
    >
      {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
      {copied ? "Copied" : "Share"}
    </button>
  );
}
