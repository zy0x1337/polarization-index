"use client";

import { computeStoryStats, relativeTime, type Story } from "@/lib/types";
import { useReader } from "./reader/ReaderProvider";
import { Kicker, RageMeter, Spectrum } from "./reader/ui";

const DOT = "·";

export default function Feed({ stories, loading }: { stories: Story[]; loading: boolean }) {
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
      <section className="mx-auto max-w-5xl px-5 pb-10 pt-12 md:px-8 md:pt-20">
        <h1 className="font-serif text-5xl leading-[0.95] tracking-tight md:text-7xl">
          Every side.
          <br />
          <span className="text-muted">Same event.</span>
        </h1>
        <p className="mt-6 max-w-md font-sans text-[15px] leading-relaxed text-muted md:text-base">
          No bias, no ranking of truth. We gather how left, center, and right
          report the same story, and hand you every version at once.
        </p>
        <div className="mt-6 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-ink" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
            Live {DOT} refreshed every 30 min
          </span>
        </div>
      </section>

      {/* Feed */}
      <section className="mx-auto max-w-5xl px-5 pb-24 md:px-8">
        <div className="mb-5 flex items-center justify-between border-b border-hairline pb-3">
          <Kicker>Stories covered across the spectrum</Kicker>
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
            No cross-spectrum stories right now.
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
  const stats = computeStoryStats(story);

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
            {stats.coverage.length}/3 sides {DOT} {stats.sourceCount} outlets
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
