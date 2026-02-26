import { useCallback, useState } from "react";
import type { Size, ViewportState } from "./types";
import {
  classifyKeyDown,
  classifyKeyUp,
  type KeyboardAction,
} from "./keyboardShortcuts";

/** Callbacks for keyboard shortcut actions */
export type KeyboardShortcutCallbacks = {
  /** Called when Delete/Backspace is pressed with selected items */
  readonly onDeleteSelected?: () => void;
  /** Called when the viewport should change (pan, zoom) */
  readonly onViewportChange?: (viewport: ViewportState) => void;
  /** Called when space-pan mode is entered/exited */
  readonly onSpacePanChange?: (active: boolean) => void;
  /** Called when zoom-to-selection is triggered (Shift+2) */
  readonly onZoomToSelection?: () => void;
  /** Called when search is triggered (Ctrl/Cmd+F) */
  readonly onOpenSearch?: () => void;
  /** Called when command palette is triggered (/) */
  readonly onOpenCommandPalette?: () => void;
};

/** Minimal keyboard event interface used by the hook.
 *  Compatible with React.KeyboardEvent but also testable with plain objects. */
export type KeyboardEventLike = {
  readonly key: string;
  readonly code: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly repeat: boolean;
  preventDefault(): void;
};

/** Result of the useKeyboardShortcuts hook */
export type UseKeyboardShortcutsResult = {
  /** Whether space-pan mode is currently active */
  readonly isSpacePanActive: boolean;
  /** Keyboard event handler for keydown — attach to container's onKeyDown */
  readonly onKeyDown: (e: KeyboardEventLike) => void;
  /** Keyboard event handler for keyup — attach to container's onKeyUp */
  readonly onKeyUp: (e: KeyboardEventLike) => void;
};

/** Hook that wires keyboard shortcut pure logic to React event handlers.
 *
 *  @param viewport - Current viewport state
 *  @param containerSize - Container size for zoom center calculation
 *  @param hasSelection - Whether any items are selected
 *  @param callbacks - Action callbacks
 *  @param minScale - Min zoom scale
 *  @param maxScale - Max zoom scale
 */
export function useKeyboardShortcuts(
  viewport: ViewportState,
  containerSize: Size,
  hasSelection: boolean,
  callbacks: KeyboardShortcutCallbacks,
  minScale?: number,
  maxScale?: number,
): UseKeyboardShortcutsResult {
  const [isSpacePanActive, setIsSpacePanActive] = useState(false);

  const handleAction = useCallback(
    (action: KeyboardAction) => {
      switch (action.type) {
        case "delete-selected":
          callbacks.onDeleteSelected?.();
          return true;
        case "pan":
        case "zoom-in":
        case "zoom-out":
          callbacks.onViewportChange?.(action.viewport);
          return true;
        case "zoom-to-selection":
          callbacks.onZoomToSelection?.();
          return true;
        case "open-search":
          callbacks.onOpenSearch?.();
          return true;
        case "open-command-palette":
          callbacks.onOpenCommandPalette?.();
          return true;
        case "enter-space-pan":
          setIsSpacePanActive(true);
          callbacks.onSpacePanChange?.(true);
          return true;
        case "exit-space-pan":
          setIsSpacePanActive(false);
          callbacks.onSpacePanChange?.(false);
          return true;
        case "none":
          return false;
      }
    },
    [callbacks],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEventLike) => {
      const action = classifyKeyDown(
        {
          key: e.key,
          code: e.code,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          shiftKey: e.shiftKey,
          repeat: e.repeat,
        },
        viewport,
        containerSize,
        hasSelection,
        minScale,
        maxScale,
      );
      if (handleAction(action)) {
        e.preventDefault();
      }
    },
    [viewport, containerSize, hasSelection, minScale, maxScale, handleAction],
  );

  const onKeyUp = useCallback(
    (e: KeyboardEventLike) => {
      const action = classifyKeyUp({
        key: e.key,
        code: e.code,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
        repeat: e.repeat,
      });
      if (handleAction(action)) {
        e.preventDefault();
      }
    },
    [handleAction],
  );

  return { isSpacePanActive, onKeyDown, onKeyUp };
}
