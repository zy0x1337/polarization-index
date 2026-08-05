/**
 * Relation-based story clustering.
 *
 * The old approach merged two articles as soon as they shared a single
 * keyword, which produced spurious matches on common words. This module
 * instead builds a weighted term vector per article and merges articles by
 * cosine similarity, so the code decides whether two headlines are really
 * about the same event.
 *
 * Signal sources, strongest first:
 *   - named entities   (capitalised runs in the original title: "Gaza",
 *                        "Interest Rates", "European Union")
 *   - bigrams          (adjacent title tokens: "interest rates")
 *   - unigrams         (title weighted higher than description)
 * Each term is weighted by TF x IDF, so distinctive words dominate and
 * boilerplate ("world", "report") barely counts.
 *
 * It is generic over the article shape: it only reads id/title/description/
 * date/source and carries every other field (bucket, country, ...) through
 * untouched, so it slots into any edition.
 */

/** The minimum an article must provide to be clustered. */
export interface ArticleLike {
  id: string;
  title: string;
  description: string;
  date: string;
  source: string;
}

/** Back-compat alias for callers that imported RawArticle. */
export type RawArticle = ArticleLike;

export interface ClusteredStory<T extends ArticleLike> {
  id: string;
  keywords: string[];
  date: string;
  articles: T[];
}

export interface ClusterOptions {
  simThreshold?: number;
  strongIdf?: number;
  /** Edition-specific stop words, merged with the built-in English set. */
  stopWords?: string[];
}

/* ------------------------------------------------------------------ */
/*  Tuning constants (see clustering.test in scratchpad for rationale) */
/* ------------------------------------------------------------------ */

const TIME_WINDOW_MS = 48 * 3600 * 1000;
// The strong-term gate below is the real guard against false merges, so the
// cosine floor can stay low enough to link same-event headlines that use
// different wording (e.g. "Federal Reserve" vs "central bank" vs "Fed").
const SIM_THRESHOLD = 0.06; // minimum cosine similarity to merge
const STRONG_IDF = 1.2; // a term this distinctive counts as a real link
const MIN_TOKEN_LEN = 3;

const BASE_STOP_WORDS = [
  "the", "and", "for", "with", "that", "this", "from", "have", "will", "not",
  "but", "was", "are", "they", "you", "all", "can", "her", "has", "his", "out",
  "into", "over", "says", "said", "news", "report", "reports", "amid", "after",
  "before", "amidst", "among", "how", "what", "when", "where", "why", "who",
  "its", "their", "there", "here", "than", "then", "them", "been", "being",
  "were", "your", "our", "about", "would", "could", "should", "may", "might",
  "new", "latest", "update", "live", "video", "watch", "read", "more", "get",
  "one", "two", "day", "days", "year", "years", "week", "time", "make", "made",
  "set", "off", "now", "top", "way", "big", "own", "per", "via", "amp",
];

/* ------------------------------------------------------------------ */
/*  Tokenisation & feature extraction                                  */
/* ------------------------------------------------------------------ */

function tokenize(text: string, stop: Set<string>): string[] {
  return text
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(" ")
    .filter((w) => w.length >= MIN_TOKEN_LEN && !stop.has(w) && !/^\d+$/.test(w));
}

/** Capitalised word runs in the original casing, lowered and underscored. */
function extractEntities(title: string, stop: Set<string>): string[] {
  const re = /\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\b/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(title)) !== null) {
    const phrase = m[0];
    const isMultiWord = /\s/.test(phrase);
    // A lone capitalised word at the very start of the title is almost always
    // just sentence casing ("Record turnout..."), not an entity. Drop it;
    // keep multi-word runs ("European Union said...") which are real entities.
    if (m.index === 0 && !isMultiWord) continue;
    const parts = phrase
      .split(/\s+/)
      .filter((p) => !stop.has(p.toLowerCase()) && p.length >= MIN_TOKEN_LEN);
    if (parts.length === 0) continue;
    out.push(parts.map((p) => p.toLowerCase()).join("_"));
  }
  return out;
}

/** Weighted raw term-frequency map for one article (before IDF). */
function rawFeatures(a: ArticleLike, stop: Set<string>): Map<string, number> {
  const tf = new Map<string, number>();
  const add = (term: string, w: number) => tf.set(term, (tf.get(term) || 0) + w);

  const titleTokens = tokenize(a.title, stop);
  titleTokens.forEach((t) => add(t, 1.0));

  // Title bigrams: strong topic signal.
  for (let i = 0; i < titleTokens.length - 1; i++) {
    add(`${titleTokens[i]}_${titleTokens[i + 1]}`, 1.6);
  }

  // Description adds recall but is noisier -> lower weight, title only.
  tokenize(a.description, stop).forEach((t) => add(t, 0.4));

  // Named entities dominate.
  for (const e of extractEntities(a.title, stop)) {
    add(e, e.includes("_") ? 3.0 : 2.0);
  }

  return tf;
}

/* ------------------------------------------------------------------ */
/*  Vector helpers                                                     */
/* ------------------------------------------------------------------ */

function dot(a: Map<string, number>, b: Map<string, number>): number {
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  let s = 0;
  for (const [k, v] of small) {
    const w = large.get(k);
    if (w) s += v * w;
  }
  return s;
}

function magnitude(a: Map<string, number>): number {
  let s = 0;
  for (const v of a.values()) s += v * v;
  return Math.sqrt(s);
}

interface Vectorized<T> {
  article: T;
  vec: Map<string, number>; // unit-normalised tf-idf
  strong: Set<string>; // distinctive terms (idf >= STRONG_IDF)
  t: number; // timestamp
}

interface WorkingCluster<T> {
  sum: Map<string, number>; // running sum of member vectors
  sumNorm: number;
  strong: Set<string>;
  members: T[];
  sources: Set<string>;
  latest: number;
}

/* ------------------------------------------------------------------ */
/*  Main entry point                                                   */
/* ------------------------------------------------------------------ */

export function clusterArticles<T extends ArticleLike>(
  articles: T[],
  opts: ClusterOptions = {}
): ClusteredStory<T>[] {
  const simThreshold = opts.simThreshold ?? SIM_THRESHOLD;
  const strongIdf = opts.strongIdf ?? STRONG_IDF;
  const stop = new Set<string>([...BASE_STOP_WORDS, ...(opts.stopWords ?? [])]);
  const n = articles.length;
  if (n === 0) return [];

  // 1) Raw features + document frequency.
  const raws = articles.map((a) => rawFeatures(a, stop));
  const df = new Map<string, number>();
  for (const tf of raws) {
    for (const term of tf.keys()) df.set(term, (df.get(term) || 0) + 1);
  }
  const idf = (term: string) => Math.log((n + 1) / ((df.get(term) || 0) + 0.5));

  // 2) Unit-normalised tf-idf vectors + strong-term sets.
  const vectors: Vectorized<T>[] = articles.map((article, i) => {
    const vec = new Map<string, number>();
    const strong = new Set<string>();
    for (const [term, tf] of raws[i]) {
      const w = tf * idf(term);
      if (w <= 0) continue;
      vec.set(term, w);
      if (idf(term) >= strongIdf) strong.add(term);
    }
    const mag = magnitude(vec) || 1;
    for (const [k, v] of vec) vec.set(k, v / mag);
    return { article, vec, strong, t: new Date(article.date).getTime() };
  });

  // 3) Greedy clustering by cosine similarity within a time window.
  //    Newest first so a cluster's date tracks the freshest article.
  vectors.sort((a, b) => b.t - a.t);
  const clusters: WorkingCluster<T>[] = [];

  for (const v of vectors) {
    let best: WorkingCluster<T> | null = null;
    let bestSim = simThreshold;

    for (const c of clusters) {
      if (Math.abs(c.latest - v.t) > TIME_WINDOW_MS) continue;
      // Require at least one genuinely distinctive shared term.
      let sharesStrong = false;
      for (const s of v.strong) {
        if (c.strong.has(s)) { sharesStrong = true; break; }
      }
      if (!sharesStrong) continue;

      const sim = dot(v.vec, c.sum) / (c.sumNorm || 1);
      if (sim > bestSim) { bestSim = sim; best = c; }
    }

    if (best) {
      if (!best.sources.has(v.article.source)) {
        for (const [k, val] of v.vec) best.sum.set(k, (best.sum.get(k) || 0) + val);
        best.sumNorm = magnitude(best.sum);
        for (const s of v.strong) best.strong.add(s);
        best.members.push(v.article);
        best.sources.add(v.article.source);
        best.latest = Math.max(best.latest, v.t);
      }
    } else {
      clusters.push({
        sum: new Map(v.vec),
        sumNorm: magnitude(v.vec),
        strong: new Set(v.strong),
        members: [v.article],
        sources: new Set([v.article.source]),
        latest: v.t,
      });
    }
  }

  // 4) Shape output: display terms are the centroid's top distinctive terms.
  return clusters.map((c) => ({
    id: c.members[0].id + "-cl",
    keywords: topTerms(c.sum, 4),
    date: new Date(c.latest).toISOString(),
    articles: c.members.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  }));
}

/** Pick the strongest, non-redundant display terms from a centroid. */
function topTerms(sum: Map<string, number>, count: number): string[] {
  const sorted = [...sum.entries()].sort((a, b) => b[1] - a[1]);
  const chosen: string[] = [];
  const usedWords = new Set<string>();

  // Prefer multi-word entities/bigrams first, then fill with unigrams.
  const passes = [
    (term: string) => term.includes("_"),
    (term: string) => !term.includes("_"),
  ];

  for (const pass of passes) {
    for (const [term] of sorted) {
      if (chosen.length >= count) break;
      if (!pass(term)) continue;
      const words = term.split("_");
      // Skip a unigram already represented inside a chosen phrase, and skip
      // phrases whose words are all already shown.
      if (words.every((w) => usedWords.has(w))) continue;
      chosen.push(words.join(" "));
      words.forEach((w) => usedWords.add(w));
    }
  }

  return chosen.slice(0, count);
}
