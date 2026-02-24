/**
 * History management - pure, immutable undo/redo data structure.
 *
 * Generic over state type S. No side effects, no React dependency.
 * Designed to be composed with any state management approach.
 */

/**
 * Immutable history structure for undo/redo.
 * - `past`: states before present (most recent last)
 * - `present`: current state
 * - `future`: states after present (undone states, most recent first)
 */
export interface History<S> {
  readonly past: readonly S[];
  readonly present: S;
  readonly future: readonly S[];
}

/** Create a fresh history with the given initial state. */
export function createHistory<S>(initialState: S): History<S> {
  return {
    past: [],
    present: initialState,
    future: [],
  };
}

/** Whether undo is possible (past is non-empty). */
export function canUndo<S>(history: History<S>): boolean {
  return history.past.length > 0;
}

/** Whether redo is possible (future is non-empty). */
export function canRedo<S>(history: History<S>): boolean {
  return history.future.length > 0;
}

/**
 * Push a new state, discarding the future (redo stack).
 * The current present becomes the most recent past entry.
 */
export function pushState<S>(history: History<S>, newState: S): History<S> {
  return {
    past: [...history.past, history.present],
    present: newState,
    future: [],
  };
}

/**
 * Push a new state with a maximum history size limit.
 * When the limit is exceeded, the oldest past entries are dropped.
 */
export function pushStateWithLimit<S>(
  history: History<S>,
  newState: S,
  maxPastSize: number,
): History<S> {
  const newPast = [...history.past, history.present];
  const trimmedPast =
    newPast.length > maxPastSize
      ? newPast.slice(newPast.length - maxPastSize)
      : newPast;
  return {
    past: trimmedPast,
    present: newState,
    future: [],
  };
}

/**
 * Undo one step. Returns the history unchanged if past is empty.
 * Moves present to future, and the most recent past entry becomes present.
 */
export function undo<S>(history: History<S>): History<S> {
  if (history.past.length === 0) {
    return history;
  }
  const newPast = history.past.slice(0, -1);
  const previousState = history.past[history.past.length - 1]!;
  return {
    past: newPast,
    present: previousState,
    future: [history.present, ...history.future],
  };
}

/**
 * Redo one step. Returns the history unchanged if future is empty.
 * Moves present to past, and the first future entry becomes present.
 */
export function redo<S>(history: History<S>): History<S> {
  if (history.future.length === 0) {
    return history;
  }
  const [nextState, ...remainingFuture] = history.future;
  return {
    past: [...history.past, history.present],
    present: nextState!,
    future: remainingFuture,
  };
}

/**
 * Clear past and future, keeping only the current present.
 */
export function clearHistory<S>(history: History<S>): History<S> {
  return {
    past: [],
    present: history.present,
    future: [],
  };
}

/**
 * Replace the present state without affecting history.
 * Useful for "transient" updates (e.g., drag-in-progress) that
 * should not create undo entries.
 */
export function replacePresent<S>(
  history: History<S>,
  newState: S,
): History<S> {
  return {
    past: history.past,
    present: newState,
    future: history.future,
  };
}

/** Number of undo steps available. */
export function undoCount<S>(history: History<S>): number {
  return history.past.length;
}

/** Number of redo steps available. */
export function redoCount<S>(history: History<S>): number {
  return history.future.length;
}
