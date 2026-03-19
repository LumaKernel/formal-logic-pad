import type { Point, Size, ViewportState } from "./types";

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

/** Wheel event input for classification. */
export type WheelEventInput = {
  readonly ctrlKey: boolean;
};

/** Classification result for a wheel event. */
export type WheelAction = "zoom" | "pan";

/** Classify a wheel event as zoom or pan.
 *  On macOS, trackpad pinch-to-zoom fires wheel events with ctrlKey=true.
 *  Regular two-finger scroll fires wheel events with ctrlKey=false.
 *  Pure function. */
export function classifyWheelEvent(event: WheelEventInput): WheelAction {
  if (event.ctrlKey) {
    return "zoom";
  }
  return "pan";
}

/** Default zoom step factor for button-based zoom in/out.
 *  Each step multiplies (zoom in) or divides (zoom out) by this factor. */
export const ZOOM_STEP_FACTOR = 1.2;

/** Predefined zoom presets as scale values. */
export const ZOOM_PRESETS: readonly number[] = [
  0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5,
] as const;

/** Compute the new scale after a "zoom in" step.
 *  Multiplies by ZOOM_STEP_FACTOR. Pure function. */
export function computeZoomInScale(
  currentScale: number,
  stepFactor: number = ZOOM_STEP_FACTOR,
): number {
  return currentScale * stepFactor;
}

/** Compute the new scale after a "zoom out" step.
 *  Divides by ZOOM_STEP_FACTOR. Pure function. */
export function computeZoomOutScale(
  currentScale: number,
  stepFactor: number = ZOOM_STEP_FACTOR,
): number {
  return currentScale / stepFactor;
}

/** Compute a reset viewport (scale=1, centered on origin). Pure function. */
export function computeResetViewport(): ViewportState {
  return { offsetX: 0, offsetY: 0, scale: 1 };
}

/** Bounding box for items on the canvas. */
export type ZoomItemBounds = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** Default maximum zoom scale for fit-to-content (100% = no zoom beyond actual size) */
export const FIT_MAX_SCALE = 1;

/** Compute a viewport that fits all items within the container.
 *  Adds padding around the content. Returns a reset viewport if no items.
 *  maxScale defaults to FIT_MAX_SCALE (1) so content is never zoomed beyond 100%.
 *  Pure function. */
export function computeFitToContentViewport(
  items: readonly ZoomItemBounds[],
  containerSize: Size,
  padding: number = 40,
  minScale: number = MIN_SCALE,
  maxScale: number = FIT_MAX_SCALE,
): ViewportState {
  if (items.length === 0) {
    return computeResetViewport();
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const item of items) {
    minX = Math.min(minX, item.x);
    minY = Math.min(minY, item.y);
    maxX = Math.max(maxX, item.x + item.width);
    maxY = Math.max(maxY, item.y + item.height);
  }

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  const availableWidth = Math.max(1, containerSize.width - padding * 2);
  const availableHeight = Math.max(1, containerSize.height - padding * 2);

  const scaleX = availableWidth / Math.max(1, contentWidth);
  const scaleY = availableHeight / Math.max(1, contentHeight);
  const scale = clampScale(Math.min(scaleX, scaleY), minScale, maxScale);

  const centerWorldX = (minX + maxX) / 2;
  const centerWorldY = (minY + maxY) / 2;

  const offsetX = containerSize.width / 2 - centerWorldX * scale;
  const offsetY = containerSize.height / 2 - centerWorldY * scale;

  return { offsetX, offsetY, scale };
}

/** Format a scale value as a zoom percentage string. Pure function.
 *  e.g. 1.0 → "100%", 0.5 → "50%", 2.0 → "200%" */
export function formatZoomPercent(scale: number): string {
  return `${Math.round(scale * 100) satisfies number}%`;
}

/** Find the nearest preset scale value. Pure function. */
export function findNearestPreset(
  scale: number,
  presets: readonly number[] = ZOOM_PRESETS,
): number {
  let nearest = presets[0]!;
  let minDiff = Math.abs(scale - nearest);
  for (const preset of presets) {
    const diff = Math.abs(scale - preset);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = preset;
    }
  }
  return nearest;
}

/** Snap to the next preset scale going up (zoom in). Returns current scale if already at max preset.
 *  Pure function. */
export function nextPresetUp(
  currentScale: number,
  presets: readonly number[] = ZOOM_PRESETS,
): number {
  for (const preset of presets) {
    if (preset > currentScale + 0.001) {
      return preset;
    }
  }
  return currentScale;
}

/** Snap to the next preset scale going down (zoom out). Returns current scale if already at min preset.
 *  Pure function. */
export function nextPresetDown(
  currentScale: number,
  presets: readonly number[] = ZOOM_PRESETS,
): number {
  for (let i = presets.length - 1; i >= 0; i--) {
    if (presets[i]! < currentScale - 0.001) {
      return presets[i]!;
    }
  }
  return currentScale;
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
