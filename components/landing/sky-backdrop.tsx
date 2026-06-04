/**
 * The full-page atmosphere the whole landing sits on: a soft sky gradient,
 * a few drifting clouds, and large blurred brand-blue glow blobs that bleed up
 * through the frosted-glass cards layered on top. It's `fixed` so it stays put
 * while the page scrolls, giving every glass surface something luminous to blur.
 * Decorative only — hidden from assistive tech.
 */
function Cloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 110" fill="currentColor" aria-hidden="true" className={className}>
      <circle cx="62" cy="74" r="34" />
      <circle cx="108" cy="52" r="44" />
      <circle cx="156" cy="72" r="32" />
      <rect x="58" y="70" width="104" height="38" rx="19" />
    </svg>
  );
}

export function SkyBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Sky gradient — bright day in light, deep night in dark. */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#e6efff] via-[#f3f8ff] to-white dark:from-[#05060d] dark:via-[#080a12] dark:to-[#0a0b0d]" />

      {/* Brand glow blobs — the "dim glow emanating" behind the page. */}
      <div className="mt-glow absolute -top-40 left-1/2 h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-[#0000ff]/20 blur-[130px] dark:bg-[#0000ff]/30" />
      <div className="mt-glow absolute top-[28%] -left-48 h-[36rem] w-[36rem] rounded-full bg-[#3c8aff]/25 blur-[130px] dark:bg-[#3c8aff]/20" />
      <div className="mt-glow absolute top-[62%] -right-48 h-[38rem] w-[38rem] rounded-full bg-[#0000ff]/12 blur-[130px] dark:bg-[#3c8aff]/15" />

      {/* Drifting clouds. */}
      <Cloud className="mt-drift-slow absolute -left-12 top-24 w-72 text-white/70 blur-md dark:text-white/[0.04]" />
      <Cloud className="mt-drift absolute right-0 top-44 w-[26rem] text-white/55 blur-lg dark:text-white/[0.03]" />
      <Cloud className="mt-drift-slow absolute left-[12%] top-[58%] w-80 text-white/45 blur-lg dark:text-white/[0.03]" />
      <Cloud className="mt-drift absolute right-[8%] top-[82%] w-72 text-white/40 blur-lg dark:text-white/[0.02]" />
    </div>
  );
}
