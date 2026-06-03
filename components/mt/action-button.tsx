"use client";

import type { ReactNode } from "react";

interface ActionButtonProps {
  // "rhythm, not rainbow": `primary` is the one filled action (Base Blue);
  // `secondary` is an outline so it doesn't compete as a second colored fill.
  variant: "primary" | "secondary";
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
}

const variantClass: Record<ActionButtonProps["variant"], string> = {
  // Filled Base Blue, white text.
  primary:
    "border border-transparent bg-primary text-primary-foreground hover:bg-primary-hover",
  // Outline: Base Blue border + text in light, Cerulean in dark (Base Blue text
  // fails contrast on the dark background).
  secondary:
    "border border-primary bg-transparent text-primary hover:bg-primary/5 dark:border-accent dark:text-accent dark:hover:bg-accent/10",
};

/**
 * Chunky full-width action button. Matches Bento's bottom "Add Food / Add Liquid"
 * buttons: large padding, medium-rounded corners, icon + label centered.
 */
export function ActionButton({
  variant,
  icon,
  children,
  onClick,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2 rounded-btn px-5 py-4 text-h3 transition-colors ${variantClass[variant]}`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
