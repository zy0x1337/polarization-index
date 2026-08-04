"use client";

import { useEffect, useState } from "react";
import type { Story } from "@/lib/types";
import type { EditionMeta } from "@/lib/editions";
import { editionMeta, WORLD } from "@/lib/editions";
import { ReaderProvider } from "./reader/ReaderProvider";
import { StoriesProvider } from "./reader/StoriesContext";
import { EditionProvider } from "./reader/EditionContext";
import ReaderLayer from "./reader/ReaderLayer";
import Feed from "./Feed";

interface NewsResponse {
  edition: EditionMeta;
  stories: Story[];
}

/**
 * Client root: owns the active edition and its story data, and wires the feed
 * to the reader so any pane can drive the same pane system.
 */
export default function NewsApp() {
  const [editionId, setEditionId] = useState(WORLD.id);
  const [edition, setEdition] = useState<EditionMeta>(editionMeta(WORLD));
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/news?edition=${editionId}`)
      .then((res) => (res.ok ? res.json() : Promise.resolve(null)))
      .then((data: NewsResponse | null) => {
        if (!alive || !data) return;
        if (data.edition) setEdition(data.edition);
        const sorted = [...(data.stories ?? [])].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setStories(sorted);
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [editionId]);

  return (
    <ReaderProvider>
      <EditionProvider value={edition}>
        <StoriesProvider value={stories}>
          <Feed
            stories={stories}
            loading={loading}
            editionId={editionId}
            onEdition={setEditionId}
          />
          <ReaderLayer />
        </StoriesProvider>
      </EditionProvider>
    </ReaderProvider>
  );
}
