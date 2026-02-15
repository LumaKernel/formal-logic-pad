import type { Point, ViewportState } from "./types";

/** Default minimum zoom scale */
export const MIN_SCALE = 0.1;

/** Default maximum zoom scale */
export const MAX_SCALE = 5;

/** Clamp a scale value to the allowed range. Pure function. */
export function clampScale(
  scale: number,
  minScale: number = MIN_SCALE,
  maxScale: number = MAX_SCALE,
): number {
  return Math.min(maxScale, Math.max(minScale, scale));
}

/** Compute the new viewport state after zooming centered on a screen-space point.
 *
 *  The key insight: when zooming at a cursor position, the world-space point
 *  under the cursor should remain fixed on screen. This means we need to
 *  adjust the offset to compensate for the scale change.
 *
 *  Pure function — no side effects. */
export function applyZoom(
  viewport: ViewportState,
  /** The point in screen space to zoom toward (e.g. cursor position relative to canvas) */
  center: Point,
  /** The new scale factor (already clamped by caller or will be clamped here) */
  newScale: number,
  minScale: number = MIN_SCALE,
  maxScale: number = MAX_SCALE,
): ViewportState {
  const clampedScale = clampScale(newScale, minScale, maxScale);

  // If scale didn't change (e.g. already at min/max), return as-is
  if (clampedScale === viewport.scale) {
    return viewport;
  }

  // World-space point under the cursor before zoom:
  //   worldX = (centerX - offsetX) / oldScale
  // After zoom, we want the same world point to be at the same screen position:
  //   centerX = worldX * newScale + newOffsetX
  //   newOffsetX = centerX - worldX * newScale
  //            = centerX - (centerX - offsetX) / oldScale * newScale
  //            = centerX - (centerX - offsetX) * (newScale / oldScale)
  const ratio = clampedScale / viewport.scale;
  const newOffsetX = center.x - (center.x - viewport.offsetX) * ratio;
  const newOffsetY = center.y - (center.y - viewport.offsetY) * ratio;

  return {
    offsetX: newOffsetX,
    offsetY: newOffsetY,
    scale: clampedScale,
  };
}

/** Compute a new scale from a wheel deltaY value.
 *  Positive deltaY = zoom out, negative deltaY = zoom in.
 *  Uses multiplicative scaling for smooth zoom behavior.
 *  Pure function. */
export function computeScaleFromWheel(
  currentScale: number,
  deltaY: number,
  /** Sensitivity factor. Higher = faster zoom. */
  sensitivity: number = 0.001,
): number {
  // Multiplicative factor: e^(-deltaY * sensitivity)
  // This gives smooth, proportional zoom at any scale level
  const factor = Math.exp(-deltaY * sensitivity);
  return currentScale * factor;
}
