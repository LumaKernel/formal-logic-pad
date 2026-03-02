import type { Point, Size } from "./types";

/** Configuration for edge scrolling behavior */
export type EdgeScrollConfig = {
  /** Distance in screen pixels from the viewport edge where scrolling begins */
  readonly threshold: number;
  /** Maximum pan speed in world-space pixels per second at the very edge */
  readonly maxSpeed: number;
};

/** Default edge scroll configuration */
export const DEFAULT_EDGE_SCROLL_CONFIG: EdgeScrollConfig = {
  threshold: 40,
  maxSpeed: 800,
};

/** Result of edge scroll computation */
export type EdgeScrollDelta = {
  /** Viewport offset delta X (screen pixels per second) */
  readonly dx: number;
  /** Viewport offset delta Y (screen pixels per second) */
  readonly dy: number;
};

/** The zero delta - no scrolling */
export const ZERO_DELTA: EdgeScrollDelta = { dx: 0, dy: 0 };

/**
 * Compute how far the cursor has penetrated into the edge zone on one axis.
 * Returns a value in [0, 1] where 0 means "at the threshold boundary" and
 * 1 means "at the very edge of the container".
 * Returns 0 if the cursor is not in an edge zone.
 *
 * @param cursorPos   Cursor position on this axis (screen px, relative to container)
 * @param containerLength  Container size on this axis (px)
 * @param threshold   Edge zone width (px)
 */
export function computeEdgePenetration(
  cursorPos: number,
  containerLength: number,
  threshold: number,
): number {
  if (threshold <= 0 || containerLength <= 0) return 0;

  // Near the start edge (left / top)
  if (cursorPos < threshold) {
    const depth = threshold - cursorPos;
    return Math.min(depth / threshold, 1);
  }

  // Near the end edge (right / bottom)
  if (cursorPos > containerLength - threshold) {
    const depth = cursorPos - (containerLength - threshold);
    return Math.min(depth / threshold, 1);
  }

  return 0;
}

/**
 * Compute the sign of the scroll direction on one axis.
 * Returns -1 (scroll viewport toward start), +1 (toward end), or 0 (no scroll).
 *
 * Note: "scroll toward start" means the viewport offset *increases* (content moves right/down)
 * because we're panning to reveal content on the left/top side.
 *
 * @param cursorPos       Cursor position (screen px, relative to container)
 * @param containerLength Container size (px)
 * @param threshold       Edge zone width (px)
 */
export function computeEdgeScrollDirection(
  cursorPos: number,
  containerLength: number,
  threshold: number,
): -1 | 0 | 1 {
  if (threshold <= 0 || containerLength <= 0) return 0;

  if (cursorPos < threshold) return 1; // near start → pan viewport offset positive (reveal left/top)
  if (cursorPos > containerLength - threshold) return -1; // near end → pan viewport offset negative (reveal right/bottom)
  return 0;
}

/**
 * Compute the edge scroll delta (viewport offset change per second).
 * When the cursor is near the edge of the container during a drag,
 * the viewport should automatically pan to reveal more content.
 *
 * The delta is in screen pixels per second. The caller should multiply
 * by the elapsed time (in seconds) to get the actual offset change.
 *
 * @param cursorScreen  Cursor position in screen coordinates relative to container
 * @param containerSize Container dimensions in screen pixels
 * @param config        Edge scroll configuration
 */
export function computeEdgeScrollDelta(
  cursorScreen: Point,
  containerSize: Size,
  config: EdgeScrollConfig,
): EdgeScrollDelta {
  const { threshold, maxSpeed } = config;

  const penetrationX = computeEdgePenetration(
    cursorScreen.x,
    containerSize.width,
    threshold,
  );
  const directionX = computeEdgeScrollDirection(
    cursorScreen.x,
    containerSize.width,
    threshold,
  );

  const penetrationY = computeEdgePenetration(
    cursorScreen.y,
    containerSize.height,
    threshold,
  );
  const directionY = computeEdgeScrollDirection(
    cursorScreen.y,
    containerSize.height,
    threshold,
  );

  // Quadratic easing: starts slow, accelerates toward the edge
  const speedX = penetrationX * penetrationX * maxSpeed;
  const speedY = penetrationY * penetrationY * maxSpeed;

  return {
    dx: directionX * speedX,
    dy: directionY * speedY,
  };
}

/**
 * Apply the edge scroll delta to a viewport offset.
 *
 * @param currentOffsetX  Current viewport offsetX
 * @param currentOffsetY  Current viewport offsetY
 * @param delta           Edge scroll delta (px/second)
 * @param elapsedSeconds  Elapsed time in seconds since last frame
 */
export function applyEdgeScrollDelta(
  currentOffsetX: number,
  currentOffsetY: number,
  delta: EdgeScrollDelta,
  elapsedSeconds: number,
): { readonly offsetX: number; readonly offsetY: number } {
  return {
    offsetX: currentOffsetX + delta.dx * elapsedSeconds,
    offsetY: currentOffsetY + delta.dy * elapsedSeconds,
  };
}

/**
 * Check whether the edge scroll delta is effectively zero (no scrolling needed).
 */
export function isEdgeScrollIdle(delta: EdgeScrollDelta): boolean {
  return delta.dx === 0 && delta.dy === 0;
}

/** Per-edge penetration values (0 = not in zone, 1 = at the very edge) */
export type EdgePenetration = {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
};

/** Zero penetration - no edges active */
export const ZERO_PENETRATION: EdgePenetration = {
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};

/**
 * Compute per-edge penetration values for all four edges.
 * Each value is in [0, 1] where 0 means "not in the edge zone" and
 * 1 means "at the very edge of the container".
 */
export function computePerEdgePenetration(
  cursorScreen: Point,
  containerSize: Size,
  config: EdgeScrollConfig,
): EdgePenetration {
  const { threshold } = config;

  if (threshold <= 0 || containerSize.width <= 0 || containerSize.height <= 0) {
    return ZERO_PENETRATION;
  }

  const left =
    cursorScreen.x < threshold
      ? Math.min((threshold - cursorScreen.x) / threshold, 1)
      : 0;
  const right =
    cursorScreen.x > containerSize.width - threshold
      ? Math.min(
          (cursorScreen.x - (containerSize.width - threshold)) / threshold,
          1,
        )
      : 0;
  const top =
    cursorScreen.y < threshold
      ? Math.min((threshold - cursorScreen.y) / threshold, 1)
      : 0;
  const bottom =
    cursorScreen.y > containerSize.height - threshold
      ? Math.min(
          (cursorScreen.y - (containerSize.height - threshold)) / threshold,
          1,
        )
      : 0;

  return { left, right, top, bottom };
}

/**
 * Check whether any edge has non-zero penetration.
 */
export function isEdgePenetrationIdle(penetration: EdgePenetration): boolean {
  return (
    penetration.left === 0 &&
    penetration.right === 0 &&
    penetration.top === 0 &&
    penetration.bottom === 0
  );
}
