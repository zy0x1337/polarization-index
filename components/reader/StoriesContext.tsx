"use client";

import { createContext, useContext } from "react";
import type { Story } from "@/lib/types";

/** All currently loaded stories, so any pane can offer "more right now". */
const StoriesContext = createContext<Story[]>([]);

export const StoriesProvider = StoriesContext.Provider;

export function useStories() {
  return useContext(StoriesContext);
}
