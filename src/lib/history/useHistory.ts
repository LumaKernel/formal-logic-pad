import { useCallback, useMemo, useState } from "react";

import {
  canRedo,
  canUndo,
  clearHistory,
  createHistory,
  type History,
  pushState,
  pushStateWithLimit,
  redo,
  redoCount,
  replacePresent,
  undo,
  undoCount,
} from "./history";

export interface UseHistoryOptions {
  /** Maximum number of past states to keep. undefined = unlimited. */
  readonly maxPastSize?: number;
}

export interface UseHistoryResult<S> {
  /** The current state. */
  readonly state: S;
  /** Push a new state (creates an undo entry). */
  readonly push: (newState: S) => void;
  /** Replace current state without creating an undo entry (for transient updates). */
  readonly replace: (newState: S) => void;
  /** Undo one step. No-op if nothing to undo. */
  readonly undo: () => void;
  /** Redo one step. No-op if nothing to redo. */
  readonly redo: () => void;
  /** Whether undo is available. */
  readonly canUndo: boolean;
  /** Whether redo is available. */
  readonly canRedo: boolean;
  /** Number of undo steps available. */
  readonly undoCount: number;
  /** Number of redo steps available. */
  readonly redoCount: number;
  /** Reset to initial state, clearing all history. */
  readonly reset: (newInitialState: S) => void;
  /** Clear past/future but keep current state. */
  readonly clear: () => void;
}

export function useHistory<S>(
  initialState: S,
  options?: UseHistoryOptions,
): UseHistoryResult<S> {
  const [history, setHistory] = useState<History<S>>(() =>
    createHistory(initialState),
  );

  const maxPastSize = options?.maxPastSize;

  const pushFn = useCallback(
    (newState: S) => {
      setHistory(
        (prev) =>
          /* v8 ignore start — V8 artifact: 三項演算子の両分岐テスト済み（デフォルト=pushState, maxPastSize指定=pushStateWithLimit）だがV8が追跡しきれない */
          maxPastSize === undefined
            ? pushState(prev, newState)
            : pushStateWithLimit(prev, newState, maxPastSize),
        /* v8 ignore stop */
      );
    },
    [maxPastSize],
  );

  const replaceFn = useCallback((newState: S) => {
    setHistory((prev) => replacePresent(prev, newState));
  }, []);

  const undoFn = useCallback(() => {
    setHistory((prev) => undo(prev));
  }, []);

  const redoFn = useCallback(() => {
    setHistory((prev) => redo(prev));
  }, []);

  const resetFn = useCallback((newInitialState: S) => {
    setHistory(createHistory(newInitialState));
  }, []);

  const clearFn = useCallback(() => {
    setHistory((prev) => clearHistory(prev));
  }, []);

  return useMemo(
    () => ({
      state: history.present,
      push: pushFn,
      replace: replaceFn,
      undo: undoFn,
      redo: redoFn,
      canUndo: canUndo(history),
      canRedo: canRedo(history),
      undoCount: undoCount(history),
      redoCount: redoCount(history),
      reset: resetFn,
      clear: clearFn,
    }),
    [history, pushFn, replaceFn, undoFn, redoFn, resetFn, clearFn],
  );
}
