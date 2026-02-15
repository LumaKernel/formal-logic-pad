import { worldToScreen } from "./coordinate";
import type { Point, ViewportState } from "./types";

/** Specification for one end of a connection */
export type ConnectionEndpoint = {
  /** Top-left position in world-space (same as CanvasItem position) */
  readonly position: Point;
  /** Width of the item in world-space pixels */
  readonly width: number;
  /** Height of the item in world-space pixels */
  readonly height: number;
};

/** Computed SVG path data for a bezier connection */
export type ConnectionPathData = {
  /** SVG path `d` attribute string */
  readonly d: string;
  /** Start point in screen-space */
  readonly start: Point;
  /** End point in screen-space */
  readonly end: Point;
};

/**
 * Compute the center point of a rectangular endpoint in world-space.
 */
export function endpointCenter(ep: ConnectionEndpoint): Point {
  return {
    x: ep.position.x + ep.width / 2,
    y: ep.position.y + ep.height / 2,
  };
}

/**
 * Determine the edge point of a rectangular item closest to a target point.
 * Uses ray-box intersection from the item center toward the target.
 * All coordinates are in world-space.
 */
export function computeEdgePoint(
  item: ConnectionEndpoint,
  target: Point,
): Point {
  const center = endpointCenter(item);
  const dx = target.x - center.x;
  const dy = target.y - center.y;

  if (dx === 0 && dy === 0) {
    return center;
  }

  const halfW = item.width / 2;
  const halfH = item.height / 2;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx * halfH > absDy * halfW) {
    // Intersects left or right edge
    const sign = dx > 0 ? 1 : -1;
    const t = halfW / absDx;
    return { x: center.x + sign * halfW, y: center.y + dy * t };
  } else {
    // Intersects top or bottom edge
    const sign = dy > 0 ? 1 : -1;
    const t = halfH / absDy;
    return { x: center.x + dx * t, y: center.y + sign * halfH };
  }
}

/**
 * Compute a cubic bezier SVG path connecting two rectangular endpoints.
 * The curve exits/enters at the edge points and uses horizontal control points
 * for a smooth, aesthetically pleasing connection.
 */
export function computeConnectionPath(
  from: ConnectionEndpoint,
  to: ConnectionEndpoint,
  viewport: ViewportState,
): ConnectionPathData {
  const fromCenter = endpointCenter(from);
  const toCenter = endpointCenter(to);

  const startWorld = computeEdgePoint(from, toCenter);
  const endWorld = computeEdgePoint(to, fromCenter);

  const start = worldToScreen(viewport, startWorld);
  const end = worldToScreen(viewport, endWorld);

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const cpOffset = Math.max(50 * viewport.scale, dist * 0.3);

  const cp1: Point = { x: start.x + cpOffset, y: start.y };
  const cp2: Point = { x: end.x - cpOffset, y: end.y };

  const d = [
    `M ${String(start.x) satisfies string} ${String(start.y) satisfies string}`,
    `C ${String(cp1.x) satisfies string} ${String(cp1.y) satisfies string},`,
    `${String(cp2.x) satisfies string} ${String(cp2.y) satisfies string},`,
    `${String(end.x) satisfies string} ${String(end.y) satisfies string}`,
  ].join(" ");

  return { d, start, end };
}
