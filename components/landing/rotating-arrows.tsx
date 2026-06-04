/**
 * The rotating-pot motif: three arrows chasing one another around a circle —
 * the visual shorthand for "the pot rotates until everyone has been paid." Pure
 * SVG, inherits `currentColor` for both the arcs and the arrowheads, so callers
 * style it with text color. Each arc references an auto-oriented <marker>, which
 * keeps the arrowheads tangent to the circle no matter the radius.
 */
export function RotatingArrows({ className }: { className?: string }) {
  // A unique-enough marker id; the motif can render multiple times per page and
  // duplicate ids are harmless, but a stable id keeps the markup tidy.
  const markerId = "mt-rotating-arrowhead";
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="3"
          markerHeight="3"
          orient="auto-start-reverse"
        >
          <path d="M0,1 L9,5 L0,9 z" fill="currentColor" />
        </marker>
      </defs>
      {/* Three 80° arcs (radius 36), each rotated 120° apart, leaving a gap for
          the arrowhead that chases the next arc. */}
      <g
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        markerEnd={`url(#${markerId})`}
      >
        <path d="M83.83 37.69 A36 36 0 0 0 43.75 14.55" />
        <path d="M22.42 26.87 A36 36 0 0 0 22.42 73.13" />
        <path d="M43.75 85.45 A36 36 0 0 0 83.83 62.31" />
      </g>
    </svg>
  );
}
