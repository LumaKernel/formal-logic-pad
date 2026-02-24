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

/** Cardinal direction for connection exit/entry */
export type ConnectionDirection = "top" | "right" | "bottom" | "left";

/** Pair of directions for a connection */
export type ConnectionDirections = {
  readonly fromDir: ConnectionDirection;
  readonly toDir: ConnectionDirection;
};

/** Rectangular obstacle in world-space (same shape as ConnectionEndpoint) */
export type Obstacle = {
  readonly position: Point;
  readonly width: number;
  readonly height: number;
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
 * Compute the edge midpoint for a given direction.
 */
export function edgeMidpoint(
  ep: ConnectionEndpoint,
  dir: ConnectionDirection,
): Point {
  const center = endpointCenter(ep);
  const halfW = ep.width / 2;
  const halfH = ep.height / 2;
  switch (dir) {
    case "top":
      return { x: center.x, y: center.y - halfH };
    case "bottom":
      return { x: center.x, y: center.y + halfH };
    case "left":
      return { x: center.x - halfW, y: center.y };
    case "right":
      return { x: center.x + halfW, y: center.y };
  }
}

/**
 * Direction vector for a cardinal direction (unit-length outward normal).
 */
function directionVector(dir: ConnectionDirection): Point {
  switch (dir) {
    case "top":
      return { x: 0, y: -1 };
    case "bottom":
      return { x: 0, y: 1 };
    case "left":
      return { x: -1, y: 0 };
    case "right":
      return { x: 1, y: 0 };
  }
}

/**
 * Determine the best exit/entry directions for a connection based on
 * the relative positions of the two endpoints. Chooses directions that
 * minimize path length and avoid crossing through the nodes themselves.
 */
export function determineConnectionDirections(
  from: ConnectionEndpoint,
  to: ConnectionEndpoint,
): ConnectionDirections {
  const fromC = endpointCenter(from);
  const toC = endpointCenter(to);
  const dx = toC.x - fromC.x;
  const dy = toC.y - fromC.y;

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Gap between the two endpoints in each axis
  const gapX = absDx - from.width / 2 - to.width / 2;
  const gapY = absDy - from.height / 2 - to.height / 2;

  // If there's enough horizontal gap, use left/right routing
  if (gapX > 0 && gapX >= gapY) {
    if (dx > 0) {
      return { fromDir: "right", toDir: "left" };
    }
    return { fromDir: "left", toDir: "right" };
  }

  // If there's enough vertical gap, use top/bottom routing
  if (gapY > 0 && gapY > gapX) {
    if (dy > 0) {
      return { fromDir: "bottom", toDir: "top" };
    }
    return { fromDir: "top", toDir: "bottom" };
  }

  // Overlapping/close nodes: pick the dominant axis direction
  if (absDx >= absDy) {
    if (dx >= 0) {
      return { fromDir: "right", toDir: "left" };
    }
    return { fromDir: "left", toDir: "right" };
  }
  if (dy >= 0) {
    return { fromDir: "bottom", toDir: "top" };
  }
  return { fromDir: "top", toDir: "bottom" };
}

/**
 * Check if a line segment from p1 to p2 intersects a rectangle (obstacle).
 * Uses AABB segment intersection with margin.
 */
export function segmentIntersectsRect(
  p1: Point,
  p2: Point,
  rect: Obstacle,
  margin: number = 10,
): boolean {
  const minX = rect.position.x - margin;
  const maxX = rect.position.x + rect.width + margin;
  const minY = rect.position.y - margin;
  const maxY = rect.position.y + rect.height + margin;

  // Parametric clipping (Liang-Barsky simplified for AABB)
  const dxSeg = p2.x - p1.x;
  const dySeg = p2.y - p1.y;

  let tMin = 0;
  let tMax = 1;

  const edges: readonly (readonly [number, number])[] = [
    [-dxSeg, p1.x - minX],
    [dxSeg, maxX - p1.x],
    [-dySeg, p1.y - minY],
    [dySeg, maxY - p1.y],
  ];

  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) {
        tMin = Math.max(tMin, t);
      } else {
        tMax = Math.min(tMax, t);
      }
      if (tMin > tMax) return false;
    }
  }

  return true;
}

/**
 * Compute a smart connection path that adapts to node positions and avoids obstacles.
 * Uses direction-aware bezier curves with obstacle avoidance.
 * All obstacle coordinates are in world-space.
 */
export function computeSmartConnectionPath(
  from: ConnectionEndpoint,
  to: ConnectionEndpoint,
  viewport: ViewportState,
  obstacles: readonly Obstacle[] = [],
): ConnectionPathData {
  const dirs = determineConnectionDirections(from, to);
  const startWorld = edgeMidpoint(from, dirs.fromDir);
  const endWorld = edgeMidpoint(to, dirs.toDir);

  const start = worldToScreen(viewport, startWorld);
  const end = worldToScreen(viewport, endWorld);

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const baseOffset = Math.max(40 * viewport.scale, dist * 0.3);

  const fromVec = directionVector(dirs.fromDir);
  const toVec = directionVector(dirs.toDir);

  // Base control points along exit/entry directions
  let cp1: Point = {
    x: start.x + fromVec.x * baseOffset,
    y: start.y + fromVec.y * baseOffset,
  };
  let cp2: Point = {
    x: end.x + toVec.x * baseOffset,
    y: end.y + toVec.y * baseOffset,
  };

  // Obstacle avoidance: check if the straight-line path intersects any obstacle
  const relevantObstacles = obstacles.filter(
    (obs) =>
      !(
        obs.position.x === from.position.x &&
        obs.position.y === from.position.y &&
        obs.width === from.width &&
        obs.height === from.height
      ) &&
      !(
        obs.position.x === to.position.x &&
        obs.position.y === to.position.y &&
        obs.width === to.width &&
        obs.height === to.height
      ),
  );

  if (relevantObstacles.length > 0) {
    // Check midpoint of the bezier for obstacle collision (approximate)
    const midWorld: Point = {
      x: (startWorld.x + endWorld.x) / 2,
      y: (startWorld.y + endWorld.y) / 2,
    };

    for (const obs of relevantObstacles) {
      if (segmentIntersectsRect(startWorld, endWorld, obs)) {
        // Determine avoidance direction: deflect perpendicular to the connection
        const obsCenter: Point = {
          x: obs.position.x + obs.width / 2,
          y: obs.position.y + obs.height / 2,
        };
        const toMidDx = midWorld.x - obsCenter.x;
        const toMidDy = midWorld.y - obsCenter.y;

        // Deflection amount: enough to clear the obstacle
        const deflection =
          (Math.max(obs.width, obs.height) / 2 + 30) * viewport.scale;

        // Perpendicular direction to the connection line
        const connLen = Math.sqrt(
          (endWorld.x - startWorld.x) ** 2 + (endWorld.y - startWorld.y) ** 2,
        );
        if (connLen > 0) {
          const perpX = -(endWorld.y - startWorld.y) / connLen;
          const perpY = (endWorld.x - startWorld.x) / connLen;

          // Pick the side away from the obstacle center
          const dot = toMidDx * perpX + toMidDy * perpY;
          const sign = dot >= 0 ? 1 : -1;

          cp1 = {
            x: cp1.x + sign * perpX * deflection,
            y: cp1.y + sign * perpY * deflection,
          };
          cp2 = {
            x: cp2.x + sign * perpX * deflection,
            y: cp2.y + sign * perpY * deflection,
          };
        }
        break; // Handle one obstacle at a time for simplicity
      }
    }
  }

  const d = [
    `M ${String(start.x) satisfies string} ${String(start.y) satisfies string}`,
    `C ${String(cp1.x) satisfies string} ${String(cp1.y) satisfies string},`,
    `${String(cp2.x) satisfies string} ${String(cp2.y) satisfies string},`,
    `${String(end.x) satisfies string} ${String(end.y) satisfies string}`,
  ].join(" ");

  return { d, start, end };
}

/**
 * Compute a cubic bezier SVG path connecting two rectangular endpoints.
 * The curve exits/enters at the edge points and uses horizontal control points
 * for a smooth, aesthetically pleasing connection.
 * @deprecated Use computeSmartConnectionPath for direction-aware routing
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
