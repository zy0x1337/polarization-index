"use client";

import { computeStoryStats, relativeTime, type NewsEvent, type Story } from "@/lib/types";
import { useReader } from "./ReaderProvider";
import { useStories } from "./StoriesContext";
import { useEdition } from "./EditionContext";
import { BucketTag, Kicker, RageMeter, Spectrum, flag } from "./ui";

const DOT = "·";
const ARROW = "↗";

export default function StoryPane({ story }: { story: Story }) {
  const { peek } = useReader();
  const { buckets, axisLabel } = useEdition();
  const stats = computeStoryStats(story, buckets);
  const topic = story.keywords.slice(0, 4).join(` ${DOT} `);

  return (
    <article className="mx-auto w-full max-w-2xl px-5 pb-24 pt-6 md:px-8">
      {/* Masthead */}
      <header className="border-b border-hairline pb-6">
        <div className="flex items-center justify-between">
          <Kicker>Same event {DOT} {stats.sourceCount} outlets</Kicker>
          <Kicker>{relativeTime(story.date)}</Kicker>
        </div>
        <h1 className="mt-3 font-serif text-3xl capitalize leading-[1.05] tracking-tight text-ink md:text-4xl">
          {topic}
        </h1>
        <div className="mt-5 flex items-center gap-3">
          <Spectrum coverage={stats.coverage} size={9} />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
            {stats.coverage.length} of {buckets.length} {axisLabel} sides
          </span>
        </div>
      </header>

      {/* Neutral divergence read-out */}
      <section className="grid grid-cols-2 gap-x-6 gap-y-5 border-b border-hairline py-6">
        <Metric label="Framing spread" value={`${stats.rageSpread}`} note="calmest to hottest" />
        <Metric label="Avg. intensity" value={`${stats.avgRage}`} note="of 100" />
        <div className="col-span-2 space-y-3 pt-1">
          <FramingRow tag="Calmest framing" article={stats.calmest} />
          <FramingRow tag="Hottest framing" article={stats.hottest} />
        </div>
      </section>

      {/* All sides, in the edition's fixed bucket order */}
      <section className="pt-6">
        <Kicker>Every side, side by side</Kicker>
        <div className="mt-4 space-y-3">
          {stats.byBucket.map((group) =>
            group.articles.map((article) => (
              <SourceCard
                key={article.id}
                article={article}
                onFocus={() => peek({ kind: "article", article, story })}
              />
            ))
          )}
        </div>
      </section>

      <RelatedRail currentId={story.id} />

      <p className="mt-8 max-w-md font-sans text-[13px] leading-relaxed text-faint">
        We rank nothing as true. We only measure how far the language diverges
        across the spectrum, and put every version in front of you.
      </p>
    </article>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div>
      <Kicker>{label}</Kicker>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="font-serif text-3xl tabular-nums text-ink">{value}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          {note}
        </span>
      </div>
    </div>
  );
}

function FramingRow({ tag, article }: { tag: string; article: NewsEvent }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
          {tag} {DOT} {article.source}
        </span>
        <p className="mt-1 truncate font-sans text-sm text-ink">{article.title}</p>
      </div>
      <RageMeter score={article.rageScore} className="mt-1 shrink-0" />
    </div>
  );
}

function SourceCard({ article, onFocus }: { article: NewsEvent; onFocus: () => void }) {
  return (
    <div className="group rounded-2xl border border-hairline bg-surface p-4 transition-colors hover:border-border">
      <div className="flex items-center justify-between gap-2">
        <BucketTag bucket={article.bucket} stateControlled={article.stateControlled} />
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          {flag(article.country)} {article.source}
        </span>
      </div>
      <h3 className="mt-2 font-serif text-lg leading-snug text-ink">{article.title}</h3>
      {article.description && (
        <p className="mt-2 line-clamp-2 font-sans text-[13px] leading-relaxed text-muted">
          {article.description}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between">
        <RageMeter score={article.rageScore} />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onFocus}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
          >
            Focus
          </button>
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
          >
            Source {ARROW}
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * "More right now" is where the multi-pane model earns its keep: peek another
 * event over this one, then promote it, split them, or swap between the two.
 */
function RelatedRail({ currentId }: { currentId: string }) {
  const stories = useStories();
  const { peek } = useReader();
  const { buckets } = useEdition();
  const related = stories.filter((s) => s.id !== currentId).slice(0, 6);
  if (related.length === 0) return null;

  return (
    <section className="mt-8 border-t border-hairline pt-6">
      <Kicker>More right now {DOT} peek to compare</Kicker>
      <div className="mt-4 space-y-2">
        {related.map((s) => {
          const stats = computeStoryStats(s, buckets);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => peek({ kind: "story", story: s })}
              className="flex w-full items-center gap-3 rounded-xl border border-transparent px-2 py-2 text-left transition-colors hover:border-hairline hover:bg-surface"
            >
              <Spectrum coverage={stats.coverage} size={7} />
              <span className="min-w-0 flex-1 truncate font-sans text-sm capitalize text-ink">
                {s.keywords.slice(0, 3).join(", ")}
              </span>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                Peek
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
