import { useCallback, useEffect, useRef, useState } from "react";
import {
  closeContextMenu,
  CONTEXT_MENU_CLOSED,
  openContextMenu,
  type ContextMenuState,
} from "./contextMenu";

export type UseContextMenuResult = {
  /** Current state of the context menu */
  readonly menuState: ContextMenuState;
  /** Attach to the element's onContextMenu event */
  readonly onContextMenu: (e: React.MouseEvent<HTMLElement>) => void;
  /** Open the menu programmatically at given screen coordinates */
  readonly open: (screenX: number, screenY: number) => void;
  /** Close the menu (e.g. after an item is clicked) */
  readonly close: () => void;
  /** Ref to attach to the menu container for outside-click detection */
  readonly menuRef: React.RefObject<HTMLDivElement | null>;
};

const LONG_PRESS_DURATION_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE = 10;

export type UseLongPressResult = {
  /** Attach to the element's onPointerDown */
  readonly onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  /** Attach to the element's onPointerMove */
  readonly onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  /** Attach to the element's onPointerUp */
  readonly onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
};

/** Hook for long-press detection (touch devices).
 *  Calls the callback with screen coordinates when a long press is detected.
 */
export function useLongPress(
  onLongPress: (screenX: number, screenY: number) => void,
): UseLongPressResult {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ readonly x: number; readonly y: number } | null>(
    null,
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      // Only track single touch for long press
      if (e.pointerType !== "touch") return;

      startPosRef.current = { x: e.clientX, y: e.clientY };
      const screenX = e.clientX;
      const screenY = e.clientY;
      timerRef.current = setTimeout(() => {
        onLongPress(screenX, screenY);
        timerRef.current = null;
        startPosRef.current = null;
      }, LONG_PRESS_DURATION_MS);
    },
    [onLongPress],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (startPosRef.current === null) return;
      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > LONG_PRESS_MOVE_TOLERANCE) {
        clearTimer();
      }
    },
    [clearTimer],
  );

  const onPointerUp = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  return { onPointerDown, onPointerMove, onPointerUp };
}

/** Hook that manages context menu open/close state.
 *  Handles right-click and outside-click-to-close. */
export function useContextMenu(): UseContextMenuResult {
  const [menuState, setMenuState] =
    useState<ContextMenuState>(CONTEXT_MENU_CLOSED);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const onContextMenu = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuState(openContextMenu(e.clientX, e.clientY));
  }, []);

  const open = useCallback((screenX: number, screenY: number) => {
    setMenuState(openContextMenu(screenX, screenY));
  }, []);

  const close = useCallback(() => {
    setMenuState(closeContextMenu());
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!menuState.open) return;

    const handleClick = (e: MouseEvent) => {
      const menu = menuRef.current;
      if (menu === null) return;
      const target = e.target;
      if (target instanceof Node && menu.contains(target)) return;
      setMenuState(closeContextMenu());
    };

    // Use a rAF to avoid the same click that opened the menu also closing it
    const frameId = requestAnimationFrame(() => {
      document.addEventListener("pointerdown", handleClick);
    });

    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener("pointerdown", handleClick);
    };
  }, [menuState.open]);

  return {
    menuState,
    onContextMenu,
    open,
    close,
    menuRef,
  };
}
