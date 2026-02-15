import type { Point } from "./types";

/** A single menu item in a context menu */
export type ContextMenuItem = {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
};

/** State of the context menu */
export type ContextMenuState =
  | { readonly open: false }
  | {
      readonly open: true;
      /** Position in screen-space (clientX, clientY) */
      readonly screenPosition: Point;
    };

/** The closed state singleton for referential equality */
export const CONTEXT_MENU_CLOSED: ContextMenuState = { open: false };

/** Open the context menu at the given screen-space position */
export function openContextMenu(
  screenX: number,
  screenY: number,
): ContextMenuState {
  return {
    open: true,
    screenPosition: { x: screenX, y: screenY },
  };
}

/** Close the context menu */
export function closeContextMenu(): ContextMenuState {
  return CONTEXT_MENU_CLOSED;
}

/** Clamp a menu position so it stays within viewport bounds.
 *  @param position   The desired top-left corner of the menu (screen px)
 *  @param menuWidth  Measured width of the menu element
 *  @param menuHeight Measured height of the menu element
 *  @param viewportWidth  Viewport width
 *  @param viewportHeight Viewport height
 */
export function clampMenuPosition(
  position: Point,
  menuWidth: number,
  menuHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): Point {
  const x = Math.min(position.x, viewportWidth - menuWidth);
  const y = Math.min(position.y, viewportHeight - menuHeight);
  return { x: Math.max(0, x), y: Math.max(0, y) };
}
