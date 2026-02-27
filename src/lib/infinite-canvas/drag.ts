import type { Point, ViewportState } from "./types";

/** Compute the new world-space position of an item after a screen-space drag delta.
 *  Divides the delta by scale to convert screen pixels to world units.
 *  Pure function — no side effects. */
export function applyDragDelta(
  currentPosition: Point,
  screenDelta: Point,
  scale: number,
): Point {
  return {
    x: currentPosition.x + screenDelta.x / scale,
    y: currentPosition.y + screenDelta.y / scale,
  };
}

/** Compute the grab offset: the world-space distance between the cursor and the item origin.
 *  This offset is recorded at drag start and used throughout the drag to maintain
 *  the relative position between cursor and item.
 *  Pure function — no side effects. */
export function computeGrabOffset(
  viewport: ViewportState,
  screenCursor: Point,
  itemWorldPosition: Point,
): Point {
  const cursorWorldX =
    (screenCursor.x - viewport.offsetX) / viewport.scale;
  const cursorWorldY =
    (screenCursor.y - viewport.offsetY) / viewport.scale;
  return {
    x: cursorWorldX - itemWorldPosition.x,
    y: cursorWorldY - itemWorldPosition.y,
  };
}

/** Compute the item's world position from the current cursor screen position and grab offset.
 *  This approach ensures the cursor-to-item offset remains constant throughout the drag,
 *  regardless of snap or viewport changes (e.g. edge scroll).
 *  Pure function — no side effects. */
export function computeDragPosition(
  viewport: ViewportState,
  screenCursor: Point,
  grabOffset: Point,
): Point {
  const cursorWorldX =
    (screenCursor.x - viewport.offsetX) / viewport.scale;
  const cursorWorldY =
    (screenCursor.y - viewport.offsetY) / viewport.scale;
  return {
    x: cursorWorldX - grabOffset.x,
    y: cursorWorldY - grabOffset.y,
  };
}
