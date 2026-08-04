import type { BucketId, BucketMeta } from "./editions";

export interface NewsEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  link: string;
  source: string;
  /** Which axis bucket this outlet sits in for the active edition. */
  bucket: BucketId;
  /** True for state-controlled outlets; surfaced at every headline. */
  stateControlled: boolean;
  /** ISO 3166-1 alpha-2 country code of the outlet. */
  country: string;
  rageScore: number;
  rageWords: string[];
  keywords?: string[];
}

export interface Story {
  id: string;
  keywords: string[];
  date: string;
  articles: NewsEvent[];
}

export interface StoryStats {
  /** Buckets that covered the story, in the edition's fixed order. */
  coverage: BucketId[];
  /** Every distinct outlet that ran the story. */
  sourceCount: number;
  /** Article framed with the least sensational language. */
  calmest: NewsEvent;
  /** Article framed with the most sensational language. */
  hottest: NewsEvent;
  /** Spread between hottest and calmest rage scores (0 to 100). */
  rageSpread: number;
  /** Mean rage across all versions of the story. */
  avgRage: number;
  /** Articles grouped by bucket, in the edition's fixed order. */
  byBucket: { bucket: BucketId; articles: NewsEvent[] }[];
}

/**
 * Derives the neutral comparison metrics for a story, measured against the
 * active edition's bucket order. Everything here is descriptive: we measure
 * divergence, we never rank truth.
 */
export function computeStoryStats(story: Story, buckets: BucketMeta[]): StoryStats {
  const articles = story.articles;
  const sorted = [...articles].sort((a, b) => a.rageScore - b.rageScore);
  const calmest = sorted[0];
  const hottest = sorted[sorted.length - 1];

  const coverage = buckets
    .map((b) => b.id)
    .filter((id) => articles.some((a) => a.bucket === id));

  const sourceCount = new Set(articles.map((a) => a.source)).size;
  const avgRage = Math.round(
    articles.reduce((sum, a) => sum + a.rageScore, 0) / Math.max(articles.length, 1)
  );

  const byBucket = buckets
    .map((b) => ({ bucket: b.id, articles: articles.filter((a) => a.bucket === b.id) }))
    .filter((group) => group.articles.length > 0);

  return {
    coverage,
    sourceCount,
    calmest,
    hottest,
    rageSpread: hottest.rageScore - calmest.rageScore,
    avgRage,
    byBucket,
  };
}

/** Human-readable relative time, mobile-friendly and terse. */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMin = Math.round((now - then) / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  return `${diffD}d ago`;
}
