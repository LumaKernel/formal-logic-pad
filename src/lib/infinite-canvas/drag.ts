import type { Point } from "./types";

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
