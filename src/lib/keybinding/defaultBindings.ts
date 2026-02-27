/**
 * Default keybinding definitions for the canvas workspace.
 *
 * These declarations correspond to the shortcuts currently implemented in
 * `keyboardShortcuts.ts`, expressed in the structured keybinding format.
 *
 * To add a new shortcut:
 * 1. Add a new value to CanvasAction
 * 2. Add entries to DEFAULT_CANVAS_BINDINGS
 * 3. Update the exhaustive switch in the consumer (useKeyboardShortcuts)
 */

import type { KeyBindingMap } from "./keybinding";
import { charKey, specialKey, codeKey } from "./keybinding";

// --- Canvas actions ---

/** All actions available in the canvas workspace.
 *  When adding a new action, also add a binding entry below. */
export type CanvasAction =
  | "delete-selected"
  | "pan-up"
  | "pan-down"
  | "pan-left"
  | "pan-right"
  | "pan-up-large"
  | "pan-down-large"
  | "pan-left-large"
  | "pan-right-large"
  | "zoom-in"
  | "zoom-out"
  | "zoom-to-selection"
  | "open-search"
  | "open-command-palette"
  | "enter-space-pan";

/** Default keybinding map for the canvas workspace.
 *
 *  Order matters: first match wins. Place more specific bindings before
 *  general ones (e.g., Shift+Arrow before Arrow).
 *
 *  The "mod" modifier maps to Cmd on macOS, Ctrl on Windows/Linux.
 */
export const DEFAULT_CANVAS_BINDINGS: KeyBindingMap<CanvasAction> = [
  // Delete / Backspace
  { action: "delete-selected", binding: specialKey("delete") },
  { action: "delete-selected", binding: specialKey("backspace") },

  // Pan with Shift+Arrow (large step) — must come before plain arrow
  { action: "pan-up-large", binding: specialKey("arrowUp", "shift") },
  { action: "pan-down-large", binding: specialKey("arrowDown", "shift") },
  { action: "pan-left-large", binding: specialKey("arrowLeft", "shift") },
  { action: "pan-right-large", binding: specialKey("arrowRight", "shift") },

  // Pan with Arrow keys
  { action: "pan-up", binding: specialKey("arrowUp") },
  { action: "pan-down", binding: specialKey("arrowDown") },
  { action: "pan-left", binding: specialKey("arrowLeft") },
  { action: "pan-right", binding: specialKey("arrowRight") },

  // Zoom
  { action: "zoom-in", binding: charKey("+", "mod") },
  { action: "zoom-in", binding: charKey("=", "mod") },
  { action: "zoom-out", binding: charKey("-", "mod") },

  // Zoom to selection (Shift+2, layout-independent via code)
  { action: "zoom-to-selection", binding: codeKey("Digit2", "shift") },

  // Search
  { action: "open-search", binding: charKey("f", "mod") },

  // Command palette
  { action: "open-command-palette", binding: charKey("/") },

  // Space pan mode
  { action: "enter-space-pan", binding: specialKey("space") },
];
