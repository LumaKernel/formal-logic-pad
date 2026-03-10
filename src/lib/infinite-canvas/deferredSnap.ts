import type { Point } from "./types";

/** Easing function: ease-out cubic.
 *  Fast at start, decelerating to a smooth stop.
 *  t should be in [0, 1]. */
export function easeOutCubic(t: number): number {
  const t1 = 1 - t;
  return 1 - t1 * t1 * t1;
}

/** Linearly interpolate between two points by factor t ∈ [0, 1]. */
export function interpolatePosition(from: Point, to: Point, t: number): Point {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
  };
}

/** Default animation duration for deferred snap (ms). */
export const DEFERRED_SNAP_DURATION_MS = 150;

/** Minimum distance threshold below which snap animation is skipped (world units). */
export const DEFERRED_SNAP_MIN_DISTANCE = 0.5;

/** Check if two points are far enough apart to warrant animation. */
export function isSnapAnimationNeeded(
  from: Point,
  to: Point,
  minDistance: number,
): boolean {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return dx * dx + dy * dy > minDistance * minDistance;
}
