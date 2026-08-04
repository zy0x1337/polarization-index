"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import type { PaneContent, ReaderAction, ReaderState, Snap } from "./types";

const initialState: ReaderState = {
  mode: "closed",
  background: null,
  overlay: null,
  snap: "half",
  splitRatio: 0.5,
};

const clamp = (n: number, lo = 0.2, hi = 0.8) => Math.min(hi, Math.max(lo, n));

function reducer(state: ReaderState, action: ReaderAction): ReaderState {
  switch (action.type) {
    case "OPEN":
      return { ...state, mode: "single", background: action.content, overlay: null };

    case "PEEK":
      // Nothing open yet -> treat as a plain open.
      if (!state.background) {
        return { ...state, mode: "single", background: action.content, overlay: null };
      }
      return { ...state, mode: "peek", overlay: action.content, snap: "half" };

    case "SET_SNAP":
      return { ...state, snap: action.snap };

    case "ARRANGE":
      if (!state.overlay) return state;
      return { ...state, mode: action.arrangement === "split" ? "split" : "peek" };

    case "PROMOTE":
      if (!state.overlay) return state;
      return { ...state, mode: "single", background: state.overlay, overlay: null };

    case "SPLIT":
      if (!state.overlay) return state;
      return { ...state, mode: "split", splitRatio: action.ratio ?? state.splitRatio };

    case "SET_RATIO":
      return { ...state, splitRatio: clamp(action.ratio) };

    case "SWAP":
      if (!state.overlay) return state;
      return { ...state, background: state.overlay, overlay: state.background };

    case "COLLAPSE_TO_SINGLE":
      return { ...state, mode: "single", overlay: null };

    case "CLOSE":
      return { ...initialState };

    default:
      return state;
  }
}

interface ReaderContextValue extends ReaderState {
  open: (content: PaneContent) => void;
  peek: (content: PaneContent) => void;
  setSnap: (snap: Snap) => void;
  arrange: (arrangement: "over" | "split") => void;
  promote: () => void;
  split: (ratio?: number) => void;
  setRatio: (ratio: number) => void;
  swap: () => void;
  collapse: () => void;
  close: () => void;
}

const ReaderContext = createContext<ReaderContextValue | null>(null);

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const open = useCallback((content: PaneContent) => dispatch({ type: "OPEN", content }), []);
  const peek = useCallback((content: PaneContent) => dispatch({ type: "PEEK", content }), []);
  const setSnap = useCallback((snap: Snap) => dispatch({ type: "SET_SNAP", snap }), []);
  const arrange = useCallback(
    (arrangement: "over" | "split") => dispatch({ type: "ARRANGE", arrangement }),
    []
  );
  const promote = useCallback(() => dispatch({ type: "PROMOTE" }), []);
  const split = useCallback((ratio?: number) => dispatch({ type: "SPLIT", ratio }), []);
  const setRatio = useCallback((ratio: number) => dispatch({ type: "SET_RATIO", ratio }), []);
  const swap = useCallback(() => dispatch({ type: "SWAP" }), []);
  const collapse = useCallback(() => dispatch({ type: "COLLAPSE_TO_SINGLE" }), []);
  const close = useCallback(() => dispatch({ type: "CLOSE" }), []);

  // Lock the page behind the reader so only pane content scrolls.
  useEffect(() => {
    const open = state.mode !== "closed";
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [state.mode]);

  // Escape steps back one layer at a time: split -> peek -> single -> closed.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (state.mode === "split") dispatch({ type: "COLLAPSE_TO_SINGLE" });
      else if (state.mode === "peek") dispatch({ type: "COLLAPSE_TO_SINGLE" });
      else if (state.mode === "single") dispatch({ type: "CLOSE" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.mode]);

  const value = useMemo<ReaderContextValue>(
    () => ({ ...state, open, peek, setSnap, arrange, promote, split, setRatio, swap, collapse, close }),
    [state, open, peek, setSnap, arrange, promote, split, setRatio, swap, collapse, close]
  );

  return <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>;
}

export function useReader() {
  const ctx = useContext(ReaderContext);
  if (!ctx) throw new Error("useReader must be used within a ReaderProvider");
  return ctx;
}
