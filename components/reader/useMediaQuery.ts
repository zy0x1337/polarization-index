"use client";

import { useEffect, useState } from "react";

/** SSR-safe matchMedia hook. Defaults to `false` until mounted. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}

/** True on tablet/desktop widths, where panes float and split horizontally. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 768px)");
}
