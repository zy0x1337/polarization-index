"use client";

import { computeStoryStats, relativeTime, type Story } from "@/lib/types";
import { EDITIONS } from "@/lib/editions";
import { useReader } from "./reader/ReaderProvider";
import { useEdition } from "./reader/EditionContext";
import { Kicker, RageMeter, Spectrum } from "./reader/ui";

const DOT = "·";
const EDITION_LIST = Object.values(EDITIONS);

export default function Feed({
  stories,
  loading,
  editionId,
  onEdition,
}: {
  stories: Story[];
  loading: boolean;
  editionId: string;
  onEdition: (id: string) => void;
}) {
  const { axisLabel, buckets } = useEdition();
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  return (
    <main className="min-h-dvh bg-canvas text-ink">
      {/* Masthead */}
      <header
        className="mx-auto max-w-5xl px-5 md:px-8"
        style={{ paddingTop: "max(1.25rem, var(--safe-top))" }}
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            The Polarization Index
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
            {today}
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-5 pb-8 pt-12 md:px-8 md:pt-20">
        <h1 className="font-serif text-5xl leading-[0.95] tracking-tight md:text-7xl">
          Every side.
          <br />
          <span className="text-muted">Same event.</span>
        </h1>
        <p className="mt-6 max-w-md font-sans text-[15px] leading-relaxed text-muted md:text-base">
          No bias, no ranking of truth. We gather how the world&apos;s
          perspectives report the same story, and hand you every version at once.
        </p>
      </section>

      {/* Edition switcher */}
      <nav className="mx-auto max-w-5xl px-5 md:px-8">
        <div className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
          {EDITION_LIST.map((ed) => {
            const active = ed.id === editionId;
            return (
              <button
                key={ed.id}
                type="button"
                disabled={!ed.available}
                onClick={() => ed.available && onEdition(ed.id)}
                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                  active
                    ? "border-ink bg-ink text-canvas"
                    : ed.available
                      ? "border-border bg-surface text-muted hover:border-ink hover:text-ink"
                      : "cursor-not-allowed border-hairline bg-transparent text-faint"
                }`}
              >
                {ed.label}
                {!ed.available && (
                  <span className="text-[8px] tracking-[0.12em]">soon</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Feed */}
      <section className="mx-auto max-w-5xl px-5 pb-24 pt-6 md:px-8">
        <div className="mb-5 flex items-center justify-between border-b border-hairline pb-3">
          <Kicker>
            Compared by {axisLabel} {DOT} {buckets.map((b) => b.label).join(" / ")}
          </Kicker>
          {!loading && (
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              {stories.length}
            </span>
          )}
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : stories.length === 0 ? (
          <p className="py-16 text-center font-mono text-xs uppercase tracking-[0.16em] text-faint">
            No cross-perspective stories right now.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-5xl border-t border-border px-5 py-10 md:px-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
            {new Date().getFullYear()} The Polarization Index
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
            No tracking {DOT} No cookies {DOT} Just divergence
          </span>
        </div>
      </footer>
    </main>
  );
}

function StoryCard({ story }: { story: Story }) {
  const { open } = useReader();
  const { buckets } = useEdition();
  const stats = computeStoryStats(story, buckets);

  return (
    <button
      type="button"
      onClick={() => open({ kind: "story", story })}
      className="group flex flex-col rounded-pane border border-hairline bg-surface p-5 text-left shadow-pane transition-colors hover:border-border"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Spectrum coverage={stats.coverage} size={8} />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            {stats.coverage.length}/{buckets.length} sides {DOT} {stats.sourceCount} outlets
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          {relativeTime(story.date)}
        </span>
      </div>

      <h2 className="mt-3 font-serif text-2xl capitalize leading-[1.08] tracking-tight text-ink">
        {story.keywords.slice(0, 4).join(", ")}
      </h2>

      <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          Framing spread {stats.rageSpread}
        </span>
        <RageMeter score={stats.avgRage} />
      </div>
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-pane border border-hairline bg-surface/60"
        />
      ))}
    </div>
  );
}
