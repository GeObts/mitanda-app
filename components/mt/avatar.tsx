"use client";

import { useAvatar } from "@/lib/hooks/use-avatar";

/**
 * A wallet's profile photo. Shows the uploaded image when one exists, otherwise
 * a deterministic two-tone gradient derived from the address — clean and
 * distinct per wallet (Linear/Mercury-style), no noisy blockie. Sized in px.
 */
export function Avatar({
  address,
  size = 32,
  ring = false,
  className = "",
}: {
  address?: string;
  size?: number;
  /** White hairline ring — for overlapping stacks / on-card placement. */
  ring?: boolean;
  className?: string;
}) {
  const { url } = useAvatar(address);
  const ringCls = ring ? "ring-2 ring-background" : "";
  const dims = { width: size, height: size };

  if (!address) {
    return (
      <div
        aria-hidden
        style={dims}
        className={`rounded-full bg-background-muted ${ringCls} ${className}`}
      />
    );
  }

  if (url) {
    return (
      // Data-URL / dynamic src — next/image adds no value here.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        style={dims}
        className={`rounded-full object-cover ${ringCls} ${className}`}
      />
    );
  }

  return (
    <div
      aria-hidden
      style={{ ...dims, backgroundImage: gradientFor(address) }}
      className={`rounded-full ${ringCls} ${className}`}
    />
  );
}

/**
 * Overlapping row of member avatars (+N overflow), e.g. on a tanda card so the
 * circle can see who's in it.
 */
export function AvatarStack({
  addresses,
  max = 4,
  size = 28,
}: {
  addresses: string[];
  max?: number;
  size?: number;
}) {
  const shown = addresses.slice(0, max);
  const extra = addresses.length - shown.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((a) => (
          <Avatar key={a} address={a} size={size} ring />
        ))}
      </div>
      {extra > 0 && (
        <span
          className="ml-1.5 text-caption font-medium text-foreground-muted"
          aria-label={`${extra} more`}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}

/** Deterministic two-tone gradient from the address bytes. */
function gradientFor(address: string): string {
  const a = address.toLowerCase().replace(/^0x/, "").padEnd(10, "0");
  const h1 = parseInt(a.slice(0, 4), 16) % 360;
  const h2 = (h1 + 35 + (parseInt(a.slice(4, 6), 16) % 70)) % 360;
  const angle = parseInt(a.slice(6, 8), 16) % 360;
  return `linear-gradient(${angle}deg, hsl(${h1} 68% 56%), hsl(${h2} 72% 44%))`;
}
