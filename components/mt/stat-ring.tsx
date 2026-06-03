interface StatRingProps {
  percent: number; // 0-100
  label: string; // "Protein", "Cycles", etc.
  value: string; // "0g / 110g", "1 / 3", etc.
  // Base "rhythm, not rainbow": lead the main ring in `primary` (Base Blue).
  // `success` = genuinely complete / on-track, `warning` = due soon,
  // `neutral` = inactive. `accent` (Cerulean) is reserved for support.
  colorScheme?: "primary" | "accent" | "success" | "warning" | "neutral";
}

const SIZE = 80;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const strokeClass: Record<NonNullable<StatRingProps["colorScheme"]>, string> = {
  // Base Blue in light; Cerulean in dark — pure Base Blue (#0000ff) on the
  // Gray-80 dark card is ~1.5:1 and nearly invisible as a thin stroke.
  primary: "stroke-primary dark:stroke-accent",
  accent: "stroke-accent",
  success: "stroke-success",
  warning: "stroke-warning",
  neutral: "stroke-foreground-subtle",
};

/**
 * Circular progress ring. Matches Bento's macro rings ("Protein 0% / 0g / 110g"):
 * an SVG ring with the percentage centered, a label below, and a caption value.
 */
export function StatRing({
  percent,
  label,
  value,
  colorScheme = "primary",
}: StatRingProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-border"
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className={strokeClass[colorScheme]}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-h3 text-foreground">
          {clamped}%
        </span>
      </div>
      <div className="text-center">
        <div className="text-caption font-medium text-foreground">{label}</div>
        <div className="text-caption text-foreground-subtle">{value}</div>
      </div>
    </div>
  );
}
