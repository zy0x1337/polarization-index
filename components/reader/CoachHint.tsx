"use client";

import { useEffect, useState } from "react";

const KEY = "pi-reader-coached-v1";

/**
 * A single, sober, one-time hint that teaches the two gestures behind the
 * pane system. Once dismissed (or after it has been seen), it never returns.
 */
export default function CoachHint({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* storage unavailable -> just skip the hint */
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return (
    <div className="flex items-center gap-2 px-4 pb-2 pt-1">
      <span className="flex-1 font-sans text-[11px] leading-snug text-faint">{text}</span>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
      >
        Got it
      </button>
    </div>
  );
}
