import type { ReactNode } from "react";

/**
 * Frosted-glass card with a soft brand-colored glow blooming from behind it —
 * the core surface of the landing page. The glow is a blurred gradient sized
 * slightly larger than the card; it brightens on hover so the cards feel alive
 * without being noisy. Content sits on translucent white (light) / white-tint
 * (dark) glass with a hairline border and a deep, soft shadow.
 */
export function GlowCard({
  children,
  className = "",
  glow = "primary",
  hover = true,
}: {
  children: ReactNode;
  className?: string;
  glow?: "primary" | "accent";
  hover?: boolean;
}) {
  const glowGradient =
    glow === "accent"
      ? "from-[#3c8aff]/45 via-[#0000ff]/30 to-[#3c8aff]/20"
      : "from-[#0000ff]/40 via-[#3c8aff]/30 to-[#0000ff]/15";

  return (
    <div className="group relative h-full">
      <div
        aria-hidden="true"
        className={`absolute -inset-1.5 -z-10 rounded-[30px] bg-gradient-to-br ${glowGradient} opacity-45 blur-2xl transition-opacity duration-500 ${
          hover ? "group-hover:opacity-80" : ""
        }`}
      />
      <div
        className={`relative flex h-full flex-col rounded-[28px] border border-white/70 bg-white/65 p-7 shadow-[0_12px_44px_-14px_rgba(6,10,80,0.22)] backdrop-blur-xl transition-transform duration-300 dark:border-white/10 dark:bg-white/[0.06] ${
          hover ? "group-hover:-translate-y-1" : ""
        } ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
