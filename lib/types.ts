export type Bias = "left" | "center" | "right";

export interface NewsEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  link: string;
  source: string;
  bias: Bias;
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

export const BIAS_ORDER: Bias[] = ["left", "center", "right"];

export const BIAS_LABEL: Record<Bias, string> = {
  left: "Left",
  center: "Center",
  right: "Right",
};

export const BIAS_HEX: Record<Bias, string> = {
  left: "#1D4ED8",
  center: "#3F6B54",
  right: "#9F1239",
};

export interface StoryStats {
  /** Distinct bias buckets that covered the story (0 to 3). */
  coverage: Bias[];
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
  /** Articles grouped by bias, in Left, Center, Right order. */
  byBias: { bias: Bias; articles: NewsEvent[] }[];
}

/**
 * Derives the neutral comparison metrics for a story from its raw articles.
 * Everything here is descriptive: we measure divergence, we never rank truth.
 */
export function computeStoryStats(story: Story): StoryStats {
  const articles = story.articles;
  const sorted = [...articles].sort((a, b) => a.rageScore - b.rageScore);
  const calmest = sorted[0];
  const hottest = sorted[sorted.length - 1];

  const coverage = BIAS_ORDER.filter((b) => articles.some((a) => a.bias === b));
  const sourceCount = new Set(articles.map((a) => a.source)).size;
  const avgRage = Math.round(
    articles.reduce((sum, a) => sum + a.rageScore, 0) / Math.max(articles.length, 1)
  );

  const byBias = BIAS_ORDER.map((bias) => ({
    bias,
    articles: articles.filter((a) => a.bias === bias),
  })).filter((group) => group.articles.length > 0);

  return {
    coverage,
    sourceCount,
    calmest,
    hottest,
    rageSpread: hottest.rageScore - calmest.rageScore,
    avgRage,
    byBias,
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
