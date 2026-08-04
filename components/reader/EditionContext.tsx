"use client";

import { createContext, useContext } from "react";
import type { BucketId, BucketMeta, EditionMeta } from "@/lib/editions";

const FALLBACK: EditionMeta = {
  id: "world",
  label: "World",
  axisLabel: "Perspective",
  buckets: [
    { id: "west", label: "West", color: "#37618E" },
    { id: "global_south", label: "Global South", color: "#B0653A" },
    { id: "state", label: "State-aligned", color: "#2F7E6E" },
  ],
};

const EditionContext = createContext<EditionMeta>(FALLBACK);

export const EditionProvider = EditionContext.Provider;

export function useEdition() {
  return useContext(EditionContext);
}

/** Resolves a bucket's display metadata within the active edition. */
export function useBucket(id: BucketId): BucketMeta {
  const edition = useEdition();
  return (
    edition.buckets.find((b) => b.id === id) ?? {
      id,
      label: id,
      color: "#6B6B6B",
    }
  );
}
