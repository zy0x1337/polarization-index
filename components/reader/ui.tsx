"use client";

import type { BucketId } from "@/lib/editions";
import { useEdition, useBucket } from "./EditionContext";

/** Regional-indicator flag from an ISO country code, built at runtime. */
export function flag(cc: string): string {
  if (!cc || cc.length !== 2) return "";
  return cc
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

/**
 * The spectrum indicator always renders every bucket of the active edition
 * in fixed order. Covered buckets are solid; uncovered ones are shown as a
 * hairline ring. We never hide a missing side: the balance is the message.
 */
export function Spectrum({
  coverage,
  size = 8,
  gap = 5,
}: {
  coverage: BucketId[];
  size?: number;
  gap?: number;
}) {
  const { buckets } = useEdition();
  return (
    <span className="inline-flex items-center" style={{ gap }} aria-hidden>
      {buckets.map((bucket) => {
        const active = coverage.includes(bucket.id);
        return (
          <span
            key={bucket.id}
            style={{
              width: size,
              height: size,
              borderRadius: 999,
              backgroundColor: active ? bucket.color : "transparent",
              boxShadow: active ? "none" : `inset 0 0 0 1.5px ${bucket.color}55`,
            }}
          />
        );
      })}
    </span>
  );
}

export function BucketTag({
  bucket,
  stateControlled = false,
}: {
  bucket: BucketId;
  stateControlled?: boolean;
}) {
  const meta = useBucket(bucket);
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        <span style={{ backgroundColor: meta.color }} className="h-1.5 w-1.5 rounded-full" />
        {meta.label}
      </span>
      {stateControlled && <StateBadge />}
    </span>
  );
}

/** Unmissable marker so state narratives are never presented as neutral. */
export function StateBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-ink/25 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-ink/70">
      State-controlled
    </span>
  );
}

/**
 * A deliberately neutral meter. The fill is ink, never a bucket colour, so
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
