import type { ReactNode } from "react";

interface HeaderCardProps {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}

/**
 * Top-of-screen identity card: logo + wordmark + subtitle on the left, an
 * action slot on the right. The brand block is `shrink-0` and the wordmark is
 * `whitespace-nowrap`, so the wordmark NEVER truncates — if space is tight, the
 * action area (e.g. the wallet pill) shrinks instead.
 */
export function HeaderCard({ icon, title, subtitle, action }: HeaderCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-card bg-background-card p-6 shadow-card">
      {icon ? (
        // Transparent — the mark sits directly on the card (no white chip).
        <div className="flex size-12 shrink-0 items-center justify-center">
          {icon}
        </div>
      ) : null}
      <div className="shrink-0">
        <h1 className="whitespace-nowrap text-h1 text-foreground">{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 whitespace-nowrap text-body text-foreground-muted">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="flex min-w-0 flex-1 items-center justify-end">
          {action}
        </div>
      ) : null}
    </div>
  );
}
