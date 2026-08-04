"use client";

import { useReader } from "./ReaderProvider";
import { RATIO_PRESETS } from "./types";

function Icon({ path }: { path: React.ReactNode }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {path}
    </svg>
  );
}

const icons = {
  open: <Icon path={<><path d="M4 4h16v16H4z" opacity="0.25" /><path d="M14 4h6v6" /><path d="M20 4l-8 8" /></>} />,
  split: <Icon path={<><rect x="3" y="4" width="18" height="16" rx="1.5" /><path d="M12 4v16" /></>} />,
  swap: <Icon path={<><path d="M7 7h11l-3-3" /><path d="M17 17H6l3 3" /></>} />,
  close: <Icon path={<><path d="M6 6l12 12M18 6L6 18" /></>} />,
};

function Pill({
  onClick,
  active = false,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
        active
          ? "border-ink bg-ink text-canvas"
          : "border-border bg-surface text-muted hover:border-ink hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * The action bar that turns a peeked pane into a promotion, a split, or a
 * swap. Same vocabulary in both contexts so the gesture model stays learnable.
 */
export default function PaneControls({ context }: { context: "peek" | "split" }) {
  const { promote, split, swap, collapse, splitRatio, setRatio } = useReader();

  if (context === "peek") {
    return (
      <div className="flex items-center gap-2">
        <Pill onClick={promote}>{icons.open} Open</Pill>
        <Pill onClick={() => split()}>{icons.split} Split</Pill>
        <Pill onClick={swap}>{icons.swap} Swap</Pill>
        <div className="ml-auto">
          <Pill onClick={collapse}>{icons.close}</Pill>
        </div>
      </div>
    );
  }

  // Split context: ratio presets + swap + exit.
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-full border border-border bg-surface p-0.5">
        {RATIO_PRESETS.map((preset) => {
          const active = Math.abs(splitRatio - preset.value) < 0.03;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => setRatio(preset.value)}
              className={`h-7 rounded-full px-2.5 font-mono text-[10px] tracking-[0.1em] transition-colors ${
                active ? "bg-ink text-canvas" : "text-muted hover:text-ink"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <Pill onClick={swap}>{icons.swap} Swap</Pill>
      <div className="ml-auto">
        <Pill onClick={collapse}>{icons.close} Exit</Pill>
      </div>
    </div>
  );
}
