import type { Size, ViewportState } from "./types";
import { applyPanDelta } from "./pan";
import { computeZoomInViewport, computeZoomOutViewport } from "./zoomControls";

// --- Constants ---

/** Pan step in pixels (screen space) for arrow key navigation */
export const PAN_STEP = 50;

/** Pan step in pixels (screen space) for Shift+arrow key navigation */
export const PAN_STEP_LARGE = 200;

// --- Action types ---

/** All keyboard shortcut actions that can be triggered */
export type KeyboardAction =
  | { readonly type: "delete-selected" }
  | { readonly type: "pan"; readonly viewport: ViewportState }
  | { readonly type: "zoom-in"; readonly viewport: ViewportState }
  | { readonly type: "zoom-out"; readonly viewport: ViewportState }
  | { readonly type: "zoom-to-selection" }
  | { readonly type: "open-search" }
  | { readonly type: "open-command-palette" }
  | { readonly type: "enter-space-pan" }
  | { readonly type: "exit-space-pan" }
  | { readonly type: "none" };

/** Minimal keyboard event data needed for classification (testable without DOM) */
export type KeyEventInput = {
  readonly key: string;
  readonly code: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly repeat: boolean;
};

// --- Pure logic functions ---

/** Compute the pan delta for an arrow key press.
 *  Returns the delta in screen-space pixels (positive = viewport moves right/down).
 *  Pure function. */
export function computeArrowPanDelta(
  key: string,
  shiftKey: boolean,
): { readonly x: number; readonly y: number } | null {
  const step = shiftKey ? PAN_STEP_LARGE : PAN_STEP;
  switch (key) {
    case "ArrowUp":
      return { x: 0, y: step };
    case "ArrowDown":
      return { x: 0, y: -step };
    case "ArrowLeft":
      return { x: step, y: 0 };
    case "ArrowRight":
      return { x: -step, y: 0 };
    default:
      return null;
  }
}

/** Classify a keydown event into a keyboard action.
 *  Returns the action to take, or { type: "none" } if no shortcut matches.
 *  Pure function — no side effects.
 *
 *  @param event - The keyboard event input
 *  @param viewport - Current viewport state
 *  @param containerSize - Container size for zoom center calculation
 *  @param hasSelection - Whether any items are currently selected
 *  @param minScale - Minimum zoom scale
 *  @param maxScale - Maximum zoom scale
 */
export function classifyKeyDown(
  event: KeyEventInput,
  viewport: ViewportState,
  containerSize: Size,
  hasSelection: boolean,
  minScale?: number,
  maxScale?: number,
): KeyboardAction {
  const { key, code, ctrlKey, metaKey, shiftKey, repeat } = event;
  const mod = ctrlKey || metaKey;

  // Delete/Backspace → delete selected items
  if ((key === "Delete" || key === "Backspace") && hasSelection && !mod) {
    return { type: "delete-selected" };
  }

  // Arrow keys → pan viewport
  const panDelta = computeArrowPanDelta(key, shiftKey);
  if (panDelta !== null && !mod) {
    const newViewport = applyPanDelta(viewport, panDelta);
    return { type: "pan", viewport: newViewport };
  }

  // Ctrl/Cmd + "+" or "=" → zoom in (= is unshifted + on US keyboards)
  if (mod && (key === "+" || key === "=")) {
    const newViewport = computeZoomInViewport(
      viewport,
      containerSize,
      minScale,
      maxScale,
    );
    return { type: "zoom-in", viewport: newViewport };
  }

  // Ctrl/Cmd + "-" → zoom out
  if (mod && key === "-") {
    const newViewport = computeZoomOutViewport(
      viewport,
      containerSize,
      minScale,
      maxScale,
    );
    return { type: "zoom-out", viewport: newViewport };
  }

  // Ctrl/Cmd+F → open search
  if (mod && key.toLowerCase() === "f" && !shiftKey) {
    return { type: "open-search" };
  }

  // Shift+2 → zoom to selection (only when items are selected)
  // Use code="Digit2" for keyboard-layout independence (Shift+2 produces "@" on US layout but varies by locale)
  if (shiftKey && code === "Digit2" && !mod && hasSelection) {
    return { type: "zoom-to-selection" };
  }

  // "/" key → open command palette (no modifier, not repeat)
  if (key === "/" && !mod && !shiftKey && !repeat) {
    return { type: "open-command-palette" };
  }

  // Space key → toggle space-pan mode (only on initial press, not repeat)
  if (key === " " && !repeat && !mod) {
    return { type: "enter-space-pan" };
  }

  return { type: "none" };
}

/** Classify a keyup event into a keyboard action.
 *  Only handles space key release for now.
 *  Pure function. */
export function classifyKeyUp(event: KeyEventInput): KeyboardAction {
  if (event.key === " ") {
    return { type: "exit-space-pan" };
  }
  return { type: "none" };
}
