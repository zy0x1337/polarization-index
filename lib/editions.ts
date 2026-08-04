/**
 * Editions are the heart of the sourcing model. Each edition is a self
 * contained lens on the news: its own language, its own comparison axis
 * (the buckets we measure divergence across) and its own balanced source
 * set. Clustering runs per-edition, so we never try to match a headline in
 * one language against another.
 *
 * The World edition compares by PERSPECTIVE / ORIGIN rather than a national
 * left-right axis, because for events that affect everyone that is the more
 * honest ruler. National editions (Germany, US) will use Left/Center/Right.
 */

export type BucketId = string;

export interface BucketMeta {
  id: BucketId;
  label: string;
  color: string;
}

export interface SourceDef {
  name: string;
  url: string;
  bucket: BucketId;
  /** ISO 3166-1 alpha-2 country code, used to render a flag at runtime. */
  country: string;
  /** Marked at every headline so state narratives are never laundered. */
  stateControlled?: boolean;
}

export interface Edition {
  id: string;
  label: string;
  language: "en" | "de";
  /** What the axis measures, shown in the UI (e.g. "Perspective"). */
  axisLabel: string;
  /** Buckets in fixed display order; absence of a side is always shown. */
  buckets: BucketMeta[];
  sources: SourceDef[];
  stopWords: string[];
  /** Whether this edition is live yet (others are announced but disabled). */
  available: boolean;
}

const EN_STOPWORDS = [
  "the", "and", "for", "with", "that", "this", "from", "have", "will", "not",
  "but", "was", "are", "they", "you", "all", "can", "her", "has", "his", "out",
  "into", "over", "says", "said", "news", "report", "amid", "as", "at", "by",
  "in", "of", "on", "to", "up", "a", "an", "is", "it", "be", "or", "after",
  "amidst", "among", "how", "what", "when", "where", "why", "who", "new", "more",
  "than", "its", "their", "may", "one", "two", "get", "set", "off", "day",
];

export const WORLD: Edition = {
  id: "world",
  label: "World",
  language: "en",
  axisLabel: "Perspective",
  buckets: [
    { id: "west", label: "West", color: "#37618E" },
    { id: "global_south", label: "Global South", color: "#B0653A" },
    { id: "state", label: "State-aligned", color: "#2F7E6E" },
  ],
  sources: [
    // West: established Western mainstream, internally left -> right.
    { name: "The Guardian", url: "https://www.theguardian.com/world/rss", bucket: "west", country: "GB" },
    { name: "BBC", url: "https://feeds.bbci.co.uk/news/world/rss.xml", bucket: "west", country: "GB" },
    { name: "Deutsche Welle", url: "https://rss.dw.com/rdf/rss-en-all", bucket: "west", country: "DE" },
    { name: "The Telegraph", url: "https://www.telegraph.co.uk/world-news/rss.xml", bucket: "west", country: "GB" },
    // Global South: non-Western editorial perspective.
    { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all", bucket: "global_south", country: "QA" },
    { name: "The Hindu", url: "https://www.thehindu.com/news/international/feeder/default.rss", bucket: "global_south", country: "IN" },
    { name: "Daily Maverick", url: "https://www.dailymaverick.co.za/dmrss/", bucket: "global_south", country: "ZA" },
    // State-aligned: state-controlled outlets, always labelled as such.
    { name: "Global Times", url: "https://www.globaltimes.cn/rss/outbrain.xml", bucket: "state", country: "CN", stateControlled: true },
    { name: "TRT World", url: "https://www.trtworld.com/feed/", bucket: "state", country: "TR", stateControlled: true },
    { name: "Press TV", url: "https://www.presstv.ir/rss.xml", bucket: "state", country: "IR", stateControlled: true },
  ],
  stopWords: EN_STOPWORDS,
  available: true,
};

/** Placeholder for the next edition; announced in the UI but not yet live. */
export const GERMANY: Edition = {
  id: "germany",
  label: "Deutschland",
  language: "de",
  axisLabel: "Ausrichtung",
  buckets: [
    { id: "left", label: "Links", color: "#1D4ED8" },
    { id: "center", label: "Mitte", color: "#3F6B54" },
    { id: "right", label: "Rechts", color: "#9F1239" },
  ],
  sources: [],
  stopWords: [],
  available: false,
};

export const EDITIONS: Record<string, Edition> = {
  world: WORLD,
  germany: GERMANY,
};

export const DEFAULT_EDITION = "world";

export function getEdition(id?: string | null): Edition {
  if (id && EDITIONS[id] && EDITIONS[id].available) return EDITIONS[id];
  return WORLD;
}

/** Public, serialisable slice of an edition sent to the client. */
export interface EditionMeta {
  id: string;
  label: string;
  axisLabel: string;
  buckets: BucketMeta[];
}

export function editionMeta(e: Edition): EditionMeta {
  return { id: e.id, label: e.label, axisLabel: e.axisLabel, buckets: e.buckets };
}
