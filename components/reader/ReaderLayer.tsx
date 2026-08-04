"use client";

import { AnimatePresence, motion } from "framer-motion";
import { computeStoryStats } from "@/lib/types";
import { useReader } from "./ReaderProvider";
import { useEdition } from "./EditionContext";
import { paneKey, type PaneContent } from "./types";
import PaneRenderer from "./PaneRenderer";
import PeekSheet from "./PeekSheet";
import SplitContainer from "./SplitContainer";
import { Spectrum } from "./ui";

function titleFor(content: PaneContent): string {
  return content.kind === "story"
    ? content.story.keywords.slice(0, 3).join(", ")
    : content.article.title;
}

function TopBar() {
  const { background, close, mode } = useReader();
  const { buckets } = useEdition();
  if (!background) return null;

  const coverage =
    background.kind === "story"
      ? computeStoryStats(background.story, buckets).coverage
      : [background.article.bucket];

  return (
    <div
      className="flex shrink-0 items-center gap-3 border-b border-border bg-canvas/90 px-4 backdrop-blur"
      style={{ paddingTop: "max(0.5rem, var(--safe-top))", paddingBottom: "0.5rem" }}
    >
      <button
        type="button"
        onClick={close}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-ink hover:text-ink"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Feed
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-ink">
          {titleFor(background)}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Spectrum coverage={coverage} size={7} />
        <span className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-faint sm:inline">
          {mode}
        </span>
      </div>
    </div>
  );
}

export default function ReaderLayer() {
  const { mode, background, overlay } = useReader();
  const open = mode !== "closed" && !!background;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="reader"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-40 flex h-dvh flex-col bg-canvas"
        >
          <TopBar />
          <div className="relative min-h-0 flex-1">
            {mode === "split" && overlay ? (
              <SplitContainer />
            ) : (
              <>
                <div className="no-scrollbar h-full overflow-y-auto">
                  {background && (
                    <PaneRenderer key={paneKey(background)} content={background} />
                  )}
                </div>
                {mode === "peek" && <PeekSheet />}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
