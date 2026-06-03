import type { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: number;
  max: number;
  unit?: string;
  helperText?: string;
  helperIcon?: ReactNode;
}

/**
 * Single-metric progress card. Matches Bento's "Calorie Goal" card: title on the
 * top left, value / max on the top right, a progress bar, and helper text at the
 * bottom.
 */
export function MetricCard({
  title,
  value,
  max,
  unit,
  helperText,
  helperIcon,
}: MetricCardProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;

  return (
    <div className="rounded-card bg-background-card p-6 shadow-card">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-h3 text-foreground">{title}</h3>
        <div className="text-h3 text-foreground">
          {value}
          <span className="text-foreground-subtle"> / {max}</span>
          {unit ? (
            <span className="ml-1 text-caption text-foreground-muted">
              {unit}
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-pill bg-background-muted">
        <div
          className="h-full rounded-pill bg-primary transition-[width] dark:bg-accent"
          style={{ width: `${pct}%` }}
        />
      </div>
      {helperText ? (
        <div className="mt-3 flex items-center gap-1.5 text-caption text-foreground-muted">
          {helperIcon}
          <span>{helperText}</span>
        </div>
      ) : null}
    </div>
  );
}
