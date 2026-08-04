import type { NewsEvent, Story } from "@/lib/types";

/**
 * A pane can hold two kinds of content:
 *  - a whole "story" (the multi-source comparison of one event), or
 *  - a single "article" (one outlet's full framing of that event).
 * Both are openable/peekable/splittable through the exact same mechanism.
 */
export type PaneContent =
  | { kind: "story"; story: Story }
  | { kind: "article"; article: NewsEvent; story: Story };

export type ReaderMode = "closed" | "single" | "peek" | "split";

/** Bottom-sheet snap heights (fraction of the viewport) on mobile / floating on desktop. */
export type Snap = "peek" | "half" | "full";

export interface ReaderState {
  mode: ReaderMode;
  /** The base pane you are reading. */
  background: PaneContent | null;
  /** The pane opened "over" the background (peek) or the second split pane. */
  overlay: PaneContent | null;
  /** Sheet height while in peek mode. */
  snap: Snap;
  /** Fraction of space given to the first (background) pane in split mode, 0..1. */
  splitRatio: number;
}

export type ReaderAction =
  | { type: "OPEN"; content: PaneContent }        // from the feed -> single
  | { type: "PEEK"; content: PaneContent }        // open something over the current pane
  | { type: "SET_SNAP"; snap: Snap }
  | { type: "PROMOTE" }                            // overlay becomes the background
  | { type: "SPLIT"; ratio?: number }             // move peek -> split
  | { type: "SET_RATIO"; ratio: number }
  | { type: "SWAP" }                               // exchange background and overlay
  | { type: "COLLAPSE_TO_SINGLE" }                // drop overlay, keep background
  | { type: "CLOSE" };                            // leave the reader entirely

export const SNAP_FRACTION: Record<Snap, number> = {
  peek: 0.34,
  half: 0.62,
  full: 0.92,
};

/** Split ratio presets, expressed as the fraction for the first pane. */
export const RATIO_PRESETS: { label: string; value: number }[] = [
  { label: "1 : 1", value: 0.5 },
  { label: "2 : 1", value: 0.66 },
  { label: "1 : 2", value: 0.34 },
];

export function paneKey(content: PaneContent | null): string {
  if (!content) return "none";
  return content.kind === "story"
    ? `story:${content.story.id}`
    : `article:${content.article.id}`;
}
