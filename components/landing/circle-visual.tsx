import { Gift, Check } from "lucide-react";
import { RotatingArrows } from "./rotating-arrows";

/**
 * Hero illustration: a circle of friends around a glowing, rotating pot. It
 * teaches the whole idea at a glance — everyone's in the circle, the pot is in
 * the middle, and this round it's one member's turn ("Sofía"). Warm and human,
 * deliberately not a crypto cliché. Avatars are initials on soft, varied tints
 * standing in for a diverse circle, placed on the six points of a hexagon and
 * centered on each point via translate(-50%, -50%).
 */
const MEMBERS = [
  { initials: "SP", name: "Sofía", tint: "bg-[#dbe7ff] text-[#0000ff]", top: "6%", left: "50%", turn: true },
  { initials: "JL", tint: "bg-[#ffe2ec] text-[#c43d6b]", top: "28%", left: "90%", paid: true },
  { initials: "RC", tint: "bg-[#fff0d6] text-[#9a6a00]", top: "72%", left: "90%", paid: true },
  { initials: "TG", tint: "bg-[#d9f2e0] text-[#1d8a4c]", top: "94%", left: "50%" },
  { initials: "MA", tint: "bg-[#e6e1ff] text-[#5b46d1]", top: "72%", left: "10%" },
  { initials: "BV", tint: "bg-[#d6eeff] text-[#0b6fb8]", top: "28%", left: "10%" },
];

export function CircleVisual({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Glow bloom behind the whole visual. */}
      <div
        aria-hidden="true"
        className="mt-glow absolute inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-[#0000ff]/30 via-[#3c8aff]/25 to-[#0000ff]/15 blur-3xl"
      />

      {/* Glass stage. */}
      <div className="relative mx-auto aspect-square w-full max-w-md rounded-[2.5rem] border border-white/70 bg-white/55 p-6 shadow-[0_24px_70px_-24px_rgba(6,10,80,0.4)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
        <div className="relative size-full">
          {/* The rotating pot at the center. */}
          <div className="absolute inset-[32%] flex flex-col items-center justify-center rounded-full border border-white/70 bg-white/80 shadow-[0_10px_40px_-8px_rgba(0,0,255,0.45)] backdrop-blur-xl dark:border-white/15 dark:bg-white/10">
            <RotatingArrows className="mb-1 size-7 text-[#0000ff] dark:text-[#3c8aff]" />
            <span className="text-xl font-bold tracking-tight text-foreground">$3,000</span>
            <span className="text-[0.7rem] font-medium text-foreground-muted">this round</span>
          </div>

          {/* Members around the ring. */}
          {MEMBERS.map((m) => (
            <div
              key={m.initials}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ top: m.top, left: m.left }}
            >
              <div className="relative">
                <div
                  className={`flex size-[3.25rem] items-center justify-center rounded-full text-base font-bold shadow-[0_6px_18px_-6px_rgba(6,10,80,0.4)] ring-4 ring-white/80 dark:ring-white/10 ${m.tint} ${
                    m.turn ? "outline outline-[3px] outline-offset-2 outline-[#0000ff]" : ""
                  }`}
                >
                  {m.initials}
                </div>
                {m.turn ? (
                  <span className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-[#0000ff] text-white shadow-md">
                    <Gift className="size-3.5" />
                  </span>
                ) : null}
                {m.paid ? (
                  <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#16a34a] text-white shadow-md ring-2 ring-white">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating caption — teaches the rotation in one line. */}
      <div className="mt-float absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold shadow-[0_12px_30px_-10px_rgba(6,10,80,0.35)] backdrop-blur-xl dark:border-white/15 dark:bg-white/10">
        <span className="text-[#0000ff] dark:text-[#3c8aff]">Round 3 of 6</span>
        <span className="text-foreground-muted"> · Sofía&apos;s turn</span>
      </div>
    </div>
  );
}
