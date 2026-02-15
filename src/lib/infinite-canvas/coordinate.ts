import type { Point, ViewportState } from "./types";

/** Convert a world-space point to screen-space coordinates given a viewport. */
export function worldToScreen(
  viewport: ViewportState,
  worldPoint: Point,
): Point {
  return {
    x: worldPoint.x * viewport.scale + viewport.offsetX,
    y: worldPoint.y * viewport.scale + viewport.offsetY,
  };
}
