import type { Point, Size, ViewportState } from "./types";

/** Item representation for minimap rendering */
export type MinimapItem = {
  readonly id: string;
  readonly position: Point;
  readonly size: Size;
};

/** Bounding box in world space */
export type BoundingBox = {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
};

/** Transform from world space to minimap space */
export type MinimapTransform = {
  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
};

/** The viewport indicator rectangle in minimap space */
export type ViewportRect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** Position options for minimap placement */
export type MinimapPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";

/** Default minimap padding in pixels */
const DEFAULT_PADDING = 20;

/** Default margin around items in world space */
const DEFAULT_WORLD_MARGIN = 100;

/** Compute bounding box of all items in world space.
 *  Returns null if no items. */
export function computeItemsBoundingBox(
  items: readonly MinimapItem[],
): BoundingBox | null {
  if (items.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const item of items) {
    const left = item.position.x;
    const top = item.position.y;
    const right = left + item.size.width;
    const bottom = top + item.size.height;
    if (left < minX) minX = left;
    if (top < minY) minY = top;
    if (right > maxX) maxX = right;
    if (bottom > maxY) maxY = bottom;
  }

  return { minX, minY, maxX, maxY };
}

/** Expand bounding box to include a viewport area (visible area in world space). */
export function expandBoundingBoxWithViewport(
  box: BoundingBox | null,
  viewport: ViewportState,
  containerSize: Size,
): BoundingBox {
  // Calculate visible world area from viewport
  const worldLeft = -viewport.offsetX / viewport.scale;
  const worldTop = -viewport.offsetY / viewport.scale;
  const worldRight = worldLeft + containerSize.width / viewport.scale;
  const worldBottom = worldTop + containerSize.height / viewport.scale;

  if (box === null) {
    return {
      minX: worldLeft,
      minY: worldTop,
      maxX: worldRight,
      maxY: worldBottom,
    };
  }

  return {
    minX: Math.min(box.minX, worldLeft),
    minY: Math.min(box.minY, worldTop),
    maxX: Math.max(box.maxX, worldRight),
    maxY: Math.max(box.maxY, worldBottom),
  };
}

/** Compute the transform from world space to minimap pixel space.
 *  Fits the bounding box (with margin) into the minimap area. */
export function computeMinimapTransform(
  boundingBox: BoundingBox,
  minimapSize: Size,
  worldMargin: number = DEFAULT_WORLD_MARGIN,
  padding: number = DEFAULT_PADDING,
): MinimapTransform {
  const availableWidth = minimapSize.width - padding * 2;
  const availableHeight = minimapSize.height - padding * 2;

  if (availableWidth <= 0 || availableHeight <= 0) {
    return { scale: 1, offsetX: 0, offsetY: 0 };
  }

  const worldWidth = boundingBox.maxX - boundingBox.minX + worldMargin * 2;
  const worldHeight = boundingBox.maxY - boundingBox.minY + worldMargin * 2;

  if (worldWidth <= 0 || worldHeight <= 0) {
    return { scale: 1, offsetX: padding, offsetY: padding };
  }

  const scaleX = availableWidth / worldWidth;
  const scaleY = availableHeight / worldHeight;
  const scale = Math.min(scaleX, scaleY);

  // Center the content within the minimap
  const contentWidth = worldWidth * scale;
  const contentHeight = worldHeight * scale;
  const offsetX =
    padding +
    (availableWidth - contentWidth) / 2 -
    (boundingBox.minX - worldMargin) * scale;
  const offsetY =
    padding +
    (availableHeight - contentHeight) / 2 -
    (boundingBox.minY - worldMargin) * scale;

  return { scale, offsetX, offsetY };
}

/** Convert a world-space point to minimap pixel coordinates. */
export function worldToMinimap(
  transform: MinimapTransform,
  worldPoint: Point,
): Point {
  return {
    x: worldPoint.x * transform.scale + transform.offsetX,
    y: worldPoint.y * transform.scale + transform.offsetY,
  };
}

/** Compute the viewport indicator rectangle in minimap space.
 *  Shows where the main canvas viewport is relative to all items. */
export function computeViewportRect(
  mainViewport: ViewportState,
  containerSize: Size,
  minimapTransform: MinimapTransform,
): ViewportRect {
  // Visible world area from the main viewport
  const worldLeft = -mainViewport.offsetX / mainViewport.scale;
  const worldTop = -mainViewport.offsetY / mainViewport.scale;
  const worldWidth = containerSize.width / mainViewport.scale;
  const worldHeight = containerSize.height / mainViewport.scale;

  // Transform to minimap space
  const topLeft = worldToMinimap(minimapTransform, {
    x: worldLeft,
    y: worldTop,
  });
  const bottomRight = worldToMinimap(minimapTransform, {
    x: worldLeft + worldWidth,
    y: worldTop + worldHeight,
  });

  return {
    x: topLeft.x,
    y: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };
}

/** Convert a click position on the minimap to a new viewport offset.
 *  The click point becomes the center of the viewport. */
export function minimapClickToViewportOffset(
  clickPos: Point,
  minimapTransform: MinimapTransform,
  containerSize: Size,
  currentScale: number,
): ViewportState {
  // Convert minimap click to world coordinates
  const worldX =
    (clickPos.x - minimapTransform.offsetX) / minimapTransform.scale;
  const worldY =
    (clickPos.y - minimapTransform.offsetY) / minimapTransform.scale;

  // Set this world point as the center of the viewport
  const offsetX = -worldX * currentScale + containerSize.width / 2;
  const offsetY = -worldY * currentScale + containerSize.height / 2;

  return {
    offsetX,
    offsetY,
    scale: currentScale,
  };
}

/** Compute CSS position properties for minimap placement. */
export function computeMinimapPlacementStyle(
  position: MinimapPosition,
  margin: number = 12,
): {
  readonly top?: string;
  readonly bottom?: string;
  readonly left?: string;
  readonly right?: string;
} {
  const px = `${margin satisfies number}px`;
  if (position === "bottom-right") {
    return { bottom: px, right: px };
  }
  if (position === "bottom-left") {
    return { bottom: px, left: px };
  }
  if (position === "top-right") {
    return { top: px, right: px };
  }
  // top-left: fall-through (TypeScript narrowing guarantees this is the only remaining case)
  return { top: px, left: px };
}
