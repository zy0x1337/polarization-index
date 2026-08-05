"use client";

import { useReader } from "./ReaderProvider";
import { useIsDesktop } from "./useMediaQuery";
import { RATIO_PRESETS } from "./types";

/* ------------------------------------------------------------------ */
/*  Layout diagrams: you pick the arrangement you can SEE              */
/* ------------------------------------------------------------------ */

function LayoutGlyph({
  variant,
  vertical,
}: {
  variant: "over" | "split" | "full";
  vertical: boolean; // split stacks vertically on mobile
}) {
  return (
    <svg width="26" height="18" viewBox="0 0 28 20" fill="none" aria-hidden>
      <rect x="1.5" y="1.5" width="25" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
      {variant === "full" && (
        <rect x="4" y="4" width="20" height="12" rx="1.5" fill="currentColor" opacity="0.9" />
      )}
      {variant === "over" && (
        <rect x="12" y="8" width="13" height="9.5" rx="1.5" fill="currentColor" opacity="0.9" />
      )}
      {variant === "split" &&
        (vertical ? (
          <>
            <line x1="1.5" y1="10" x2="26.5" y2="10" stroke="currentColor" strokeWidth="1.4" />
            <rect x="4" y="4" width="20" height="4" rx="1" fill="currentColor" opacity="0.85" />
          </>
        ) : (
          <>
            <line x1="14" y1="1.5" x2="14" y2="18.5" stroke="currentColor" strokeWidth="1.4" />
            <rect x="4" y="4" width="7" height="12" rx="1" fill="currentColor" opacity="0.85" />
          </>
        ))}
    </svg>
  );
}

function SegItem({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-colors ${
        active ? "bg-ink text-canvas" : "text-muted hover:text-ink"
      }`}
    >
      {children}
      <span className="font-mono text-[9px] uppercase tracking-[0.12em]">{label}</span>
    </button>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:border-ink hover:text-ink"
    >
      {children}
    </button>
  );
}

/**
 * One control vocabulary for both peek and split. The segmented control
 * shows the three things you can do with the pane you opened -- keep it
 * floating Over your page, Split the screen, or go Full into it -- as
 * diagrams that match the real layout, so the choice is self-explanatory.
 */
export default function PaneControls(_props: { context: "peek" | "split" }) {
  const { mode, arrange, promote, swap, collapse, splitRatio, setRatio } = useReader();
  const isDesktop = useIsDesktop();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-2xl border border-border bg-surface p-0.5">
          <SegItem active={mode === "peek"} label="Over" onClick={() => arrange("over")}>
            <LayoutGlyph variant="over" vertical={!isDesktop} />
          </SegItem>
          <SegItem active={mode === "split"} label="Split" onClick={() => arrange("split")}>
            <LayoutGlyph variant="split" vertical={!isDesktop} />
          </SegItem>
          <SegItem active={false} label="Full" onClick={promote}>
            <LayoutGlyph variant="full" vertical={!isDesktop} />
          </SegItem>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <IconBtn label="Swap the two panes" onClick={swap}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M7 7h11l-3-3" />
              <path d="M17 17H6l3 3" />
            </svg>
          </IconBtn>
          <IconBtn label="Close this pane" onClick={collapse}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </IconBtn>
        </div>
      </div>

      {/* Proportion presets, only meaningful while split. */}
      {mode === "split" && (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">Ratio</span>
          {RATIO_PRESETS.map((preset) => {
            const active = Math.abs(splitRatio - preset.value) < 0.03;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => setRatio(preset.value)}
                aria-label={`Split ${preset.label}`}
                className={`flex h-7 items-center rounded-lg border px-1.5 transition-colors ${
                  active ? "border-ink" : "border-border hover:border-muted"
                }`}
              >
                <RatioGlyph value={preset.value} vertical={!isDesktop} active={active} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RatioGlyph({ value, vertical, active }: { value: number; vertical: boolean; active: boolean }) {
  const color = active ? "#1A1A1A" : "#9A968C";
  if (vertical) {
    const h = Math.round(16 * value);
    return (
      <svg width="20" height="18" viewBox="0 0 20 18" fill="none" aria-hidden>
        <rect x="1" y="1" width="18" height="16" rx="1.5" stroke={color} strokeWidth="1.3" />
        <rect x="3" y="3" width="14" height={h - 4} rx="1" fill={color} opacity="0.8" />
      </svg>
    );
  }
  const w = Math.round(18 * value);
  return (
    <svg width="20" height="18" viewBox="0 0 20 18" fill="none" aria-hidden>
      <rect x="1" y="1" width="18" height="16" rx="1.5" stroke={color} strokeWidth="1.3" />
      <rect x="3" y="3" width={w - 4} height="12" rx="1" fill={color} opacity="0.8" />
    </svg>
  );
}
