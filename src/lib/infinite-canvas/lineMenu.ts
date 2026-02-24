import type { Point } from "./types";

/** Line menu state — closed or open at a specific connection + screen position. */
export type LineMenuState =
  | { readonly open: false }
  | {
      readonly open: true;
      /** ID of the connection whose menu is open */
      readonly connectionId: string;
      /** Screen-space position where the menu should appear */
      readonly screenPosition: Point;
    };

/** Singleton closed state for referential equality. */
export const LINE_MENU_CLOSED: LineMenuState = { open: false };

/** Open a line menu for the given connection at the given screen position. */
export function openLineMenu(
  connectionId: string,
  screenX: number,
  screenY: number,
): LineMenuState {
  return {
    open: true,
    connectionId,
    screenPosition: { x: screenX, y: screenY },
  };
}

/** Close the line menu. */
export function closeLineMenu(): LineMenuState {
  return LINE_MENU_CLOSED;
}
