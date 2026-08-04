"use client";

import { useEffect, useState } from "react";
import type { Story } from "@/lib/types";
import { ReaderProvider } from "./reader/ReaderProvider";
import { StoriesProvider } from "./reader/StoriesContext";
import ReaderLayer from "./reader/ReaderLayer";
import Feed from "./Feed";

/**
 * Client root: owns the story data and wires the feed to the reader so any
 * pane (feed card, related rail, source card) can drive the same pane system.
 */
export default function NewsApp() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/news")
      .then((res) => (res.ok ? res.json() : Promise.resolve([])))
      .then((data: Story[]) => {
        if (!alive) return;
        const sorted = [...data].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setStories(sorted);
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <ReaderProvider>
      <StoriesProvider value={stories}>
        <Feed stories={stories} loading={loading} />
        <ReaderLayer />
      </StoriesProvider>
    </ReaderProvider>
  );
}
