"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useReader } from "./ReaderProvider";
import { useIsDesktop } from "./useMediaQuery";
import { SNAP_FRACTION, paneKey, type Snap } from "./types";
import PaneRenderer from "./PaneRenderer";
import PaneControls from "./PaneControls";

const FULL = SNAP_FRACTION.full;
const SNAP_ORDER: Snap[] = ["peek", "half", "full"];

/* ------------------------------------------------------------------ */
/*  Mobile: a physical bottom sheet with snap points and rubber-band   */
/* ------------------------------------------------------------------ */

function MobileSheet() {
  const { overlay, snap, setSnap, collapse } = useReader();
  const [vh, setVh] = useState(0);
  const [y, setY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ startY: number; startVal: number } | null>(null);

  const yFor = useCallback((s: Snap) => (FULL - SNAP_FRACTION[s]) * vh, [vh]);

  useEffect(() => {
    const measure = () => setVh(window.innerHeight);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Settle to the active snap whenever it changes (and we are not dragging).
  useEffect(() => {
    if (vh && !dragging) setY(yFor(snap));
  }, [snap, vh, dragging, yFor]);

  const minY = 0; // full
  const maxY = yFor("peek");

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, startVal: y };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const delta = e.clientY - drag.current.startY;
    let next = drag.current.startVal + delta;
    // Rubber-band beyond the travel range so the sheet never runs away.
    if (next < minY) next = minY + (next - minY) * 0.4;
    if (next > maxY) next = maxY + (next - maxY) * 0.55;
    setY(next);
  };

  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    // Dragged well past the lowest snap -> dismiss.
    if (y > maxY + vh * 0.12) {
      collapse();
      return;
    }
    // Otherwise settle to the nearest snap point.
    let nearest: Snap = "peek";
    let best = Infinity;
    for (const s of SNAP_ORDER) {
      const d = Math.abs(y - yFor(s));
      if (d < best) {
        best = d;
        nearest = s;
      }
    }
    setSnap(nearest);
    setY(yFor(nearest));
  };

  if (!overlay || !vh) return null;

  const revealed = 1 - y / (FULL * vh); // 0..1, how far the sheet is up
  const backdrop = Math.min(0.28, Math.max(0, revealed - 0.34) * 0.6);

  return (
    <>
      <div
        onClick={collapse}
        className="fixed inset-0 z-[55]"
        style={{ background: `rgba(26,26,26,${backdrop})`, pointerEvents: backdrop > 0.02 ? "auto" : "none" }}
      />
      <section
        className="fixed inset-x-0 bottom-0 z-[60] flex flex-col rounded-t-[22px] border-t border-border bg-canvas shadow-sheet"
        style={{
          height: `${FULL * 100}dvh`,
          transform: `translateY(${y}px)`,
          transition: dragging ? "none" : "transform 0.42s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Grab handle + controls */}
        <div
          className="drag-handle shrink-0 cursor-grab px-4 pb-2 pt-3 active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div className="mx-auto h-1 w-10 rounded-full bg-border" />
        </div>
        <div className="shrink-0 border-b border-hairline px-4 pb-3">
          <PaneControls context="peek" />
        </div>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <PaneRenderer key={paneKey(overlay)} content={overlay} />
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Desktop: a floating panel you can move and resize freely           */
/* ------------------------------------------------------------------ */

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function FloatingPanel() {
  const { overlay, collapse } = useReader();
  const [box, setBox] = useState<Box | null>(null);
  const gesture = useRef<{
    type: "move" | "resize";
    corner?: "sw" | "se";
    startX: number;
    startY: number;
    start: Box;
  } | null>(null);

  // Initial placement: right side, generous height.
  useEffect(() => {
    if (box) return;
    const w = Math.min(460, window.innerWidth - 48);
    const h = Math.min(window.innerHeight * 0.74, window.innerHeight - 96);
    setBox({ x: window.innerWidth - w - 24, y: 84, w, h });
  }, [box]);

  const clampBox = useCallback((b: Box): Box => {
    const maxW = window.innerWidth - 16;
    const maxH = window.innerHeight - 16;
    const w = Math.max(320, Math.min(b.w, maxW));
    const h = Math.max(300, Math.min(b.h, maxH));
    const x = Math.max(8, Math.min(b.x, window.innerWidth - w - 8));
    const y = Math.max(8, Math.min(b.y, window.innerHeight - h - 8));
    return { x, y, w, h };
  }, []);

  const begin =
    (type: "move" | "resize", corner?: "sw" | "se") => (e: React.PointerEvent) => {
      if (!box) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      gesture.current = { type, corner, startX: e.clientX, startY: e.clientY, start: box };
    };

  const onMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (g.type === "move") {
      setBox(clampBox({ ...g.start, x: g.start.x + dx, y: g.start.y + dy }));
    } else if (g.corner === "se") {
      setBox(clampBox({ ...g.start, w: g.start.w + dx, h: g.start.h + dy }));
    } else {
      // sw: grow left/down, so x and w both change.
      setBox(clampBox({ ...g.start, x: g.start.x + dx, w: g.start.w - dx, h: g.start.h + dy }));
    }
  };

  const end = () => {
    gesture.current = null;
  };

  if (!overlay || !box) return null;

  return (
    <section
      className="fixed z-[60] flex flex-col overflow-hidden rounded-pane border border-border bg-canvas shadow-float"
      style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
      onPointerMove={onMove}
      onPointerUp={end}
    >
      {/* Title bar = move handle */}
      <div
        className="drag-handle flex shrink-0 cursor-grab items-center gap-3 border-b border-hairline px-3 py-2.5 active:cursor-grabbing"
        onPointerDown={begin("move")}
      >
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
        </span>
        <div className="flex-1" onPointerDown={(e) => e.stopPropagation()}>
          <PaneControls context="peek" />
        </div>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        <PaneRenderer key={paneKey(overlay)} content={overlay} />
      </div>

      {/* Resize corners */}
      <div
        onPointerDown={begin("resize", "se")}
        className="drag-handle absolute bottom-0 right-0 h-6 w-6 cursor-se-resize"
        style={{ touchAction: "none" }}
      >
        <span className="absolute bottom-1.5 right-1.5 h-2 w-2 border-b border-r border-muted/50" />
      </div>
      <div
        onPointerDown={begin("resize", "sw")}
        className="drag-handle absolute bottom-0 left-0 h-6 w-6 cursor-sw-resize"
        style={{ touchAction: "none" }}
      >
        <span className="absolute bottom-1.5 left-1.5 h-2 w-2 border-b border-l border-muted/50" />
      </div>
    </section>
  );
}

export default function PeekSheet() {
  const isDesktop = useIsDesktop();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  // Portal to body so the sheet escapes the animated reader's transform
  // (a transformed ancestor becomes the containing block for fixed children).
  return createPortal(isDesktop ? <FloatingPanel /> : <MobileSheet />, document.body);
}
