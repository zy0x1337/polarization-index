"use client";

import { useCallback, useRef, useState } from "react";
import { useReader } from "./ReaderProvider";
import { useIsDesktop } from "./useMediaQuery";
import { paneKey, type PaneContent } from "./types";
import PaneRenderer from "./PaneRenderer";
import PaneControls from "./PaneControls";
import { Kicker } from "./ui";

function paneTitle(content: PaneContent): string {
  return content.kind === "story"
    ? content.story.keywords.slice(0, 2).join(", ")
    : content.article.source;
}

function SplitPane({
  content,
  label,
  onMaximize,
}: {
  content: PaneContent;
  label: string;
  onMaximize: () => void;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-canvas">
      <div className="flex shrink-0 items-center justify-between border-b border-hairline px-4 py-2">
        <div className="flex items-center gap-2 truncate">
          <Kicker>{label}</Kicker>
          <span className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
            {paneTitle(content)}
          </span>
        </div>
        <button
          type="button"
          onClick={onMaximize}
          aria-label="Maximize this pane"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint transition-colors hover:text-ink"
        >
          Maximize
        </button>
      </div>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        <PaneRenderer key={paneKey(content)} content={content} />
      </div>
    </div>
  );
}

export default function SplitContainer() {
  const { background, overlay, splitRatio, setRatio, promote, collapse } = useReader();
  const isDesktop = useIsDesktop();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const onDividerDown = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
  }, []);

  const onDividerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const ratio = isDesktop
        ? (e.clientX - rect.left) / rect.width
        : (e.clientY - rect.top) / rect.height;
      setRatio(ratio);
    },
    [dragging, isDesktop, setRatio]
  );

  const onDividerUp = useCallback(() => setDragging(false), []);

  if (!background || !overlay) return null;

  const first = `${splitRatio * 100}%`;
  const second = `${(1 - splitRatio) * 100}%`;

  return (
    <div className="flex h-full flex-col">
      {/* Split control strip */}
      <div className="shrink-0 border-b border-hairline bg-canvas px-4 py-2.5">
        <PaneControls context="split" />
      </div>

      <div
        ref={containerRef}
        className={`flex min-h-0 flex-1 ${isDesktop ? "flex-row" : "flex-col"} ${
          dragging ? "dragging select-none" : ""
        }`}
      >
        <div style={{ flexBasis: first }} className="flex min-h-0 min-w-0">
          <SplitPane content={background} label="Pane A" onMaximize={collapse} />
        </div>

        {/* Draggable divider */}
        <div
          onPointerDown={onDividerDown}
          onPointerMove={onDividerMove}
          onPointerUp={onDividerUp}
          className={`drag-handle group relative flex shrink-0 items-center justify-center bg-border ${
            isDesktop ? "w-px cursor-col-resize" : "h-px cursor-row-resize"
          }`}
        >
          {/* Enlarged hit area + grip */}
          <span
            className={`absolute ${
              isDesktop ? "inset-y-0 -inset-x-2" : "inset-x-0 -inset-y-2"
            }`}
          />
          <span
            className={`rounded-full bg-muted/40 transition-colors group-hover:bg-ink ${
              isDesktop ? "h-8 w-1" : "h-1 w-8"
            }`}
          />
        </div>

        <div style={{ flexBasis: second }} className="flex min-h-0 min-w-0">
          <SplitPane content={overlay} label="Pane B" onMaximize={promote} />
        </div>
      </div>
    </div>
  );
}
