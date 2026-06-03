"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface DatePillProps {
  date: Date;
  label?: string; // defaults to the weekday name (e.g. "Friday")
  onPrev?: () => void;
  onNext?: () => void;
}

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});
const weekdayFmt = new Intl.DateTimeFormat("en-US", { weekday: "long" });

/**
 * Horizontal date selector. Matches Bento's "← Today / May 29, 2026 →" pill:
 * mint background, chevron buttons on each end, label + date stacked in the
 * center.
 */
export function DatePill({ date, label, onPrev, onNext }: DatePillProps) {
  return (
    <div className="flex items-center justify-between rounded-pill bg-mint px-3 py-2 text-mint-text">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous"
        className="flex size-8 items-center justify-center rounded-pill transition-colors hover:bg-mint-text/10"
      >
        <ChevronLeft className="size-5" />
      </button>
      <div className="text-center">
        <div className="text-caption font-medium opacity-80">
          {label ?? weekdayFmt.format(date)}
        </div>
        <div className="text-h3">{dateFmt.format(date)}</div>
      </div>
      <button
        type="button"
        onClick={onNext}
        aria-label="Next"
        className="flex size-8 items-center justify-center rounded-pill transition-colors hover:bg-mint-text/10"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
