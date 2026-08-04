"use client";

import type { PaneContent } from "./types";
import StoryPane from "./StoryPane";
import ArticlePane from "./ArticlePane";

/** Renders whichever content a pane is currently holding. */
export default function PaneRenderer({ content }: { content: PaneContent }) {
  if (content.kind === "story") return <StoryPane story={content.story} />;
  return <ArticlePane article={content.article} story={content.story} />;
}
