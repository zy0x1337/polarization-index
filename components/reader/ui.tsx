"use client";

import { BIAS_HEX, BIAS_LABEL, BIAS_ORDER, type Bias } from "@/lib/types";

/**
 * The spectrum indicator always renders all three positions in the same
 * order. Covered sides are solid; uncovered sides are shown as a hairline
 * ring. We never hide a missing side: the balance itself is the message.
 */
export function Spectrum({
  coverage,
  size = 8,
  gap = 5,
}: {
  coverage: Bias[];
  size?: number;
  gap?: number;
}) {
  return (
    <span className="inline-flex items-center" style={{ gap }} aria-hidden>
      {BIAS_ORDER.map((bias) => {
        const active = coverage.includes(bias);
        return (
          <span
            key={bias}
            style={{
              width: size,
              height: size,
              borderRadius: 999,
              backgroundColor: active ? BIAS_HEX[bias] : "transparent",
              boxShadow: active ? "none" : `inset 0 0 0 1.5px ${BIAS_HEX[bias]}55`,
            }}
          />
        );
      })}
    </span>
  );
}

export function BiasTag({ bias }: { bias: Bias }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
      <span
        style={{ backgroundColor: BIAS_HEX[bias] }}
        className="h-1.5 w-1.5 rounded-full"
      />
      {BIAS_LABEL[bias]}
    </span>
  );
}

/**
 * A deliberately neutral meter. The fill is ink, never a bias colour, so
 * that "more charged language" is not visually equated with any one side.
 */
export function RageMeter({ score, className = "" }: { score: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative h-[3px] w-16 overflow-hidden rounded-full bg-border">
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-ink transition-[width] duration-500"
          style={{ width: `${score}%` }}
        />
      </span>
      <span className="font-mono text-[10px] tabular-nums text-muted">{score}</span>
    </span>
  );
}

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
      {children}
    </span>
  );
}

export function IconButton({
  label,
  onClick,
  children,
  active = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
        active
          ? "border-ink bg-ink text-canvas"
          : "border-border bg-surface text-muted hover:border-ink hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
