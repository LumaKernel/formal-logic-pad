import { describe, expect, it } from "vitest";
import type { ConnectorPortOnItem } from "./connector";
import {
  computeConnectionPath,
  computeEdgePoint,
  computePortConnectionPath,
  computeSmartConnectionPath,
  cubicBezierPoint,
  determineConnectionDirections,
  edgeMidpoint,
  endpointCenter,
  segmentIntersectsRect,
} from "./connectionPath";
import type { ConnectionEndpoint, Obstacle } from "./connectionPath";
import type { ViewportState } from "./types";

describe("endpointCenter", () => {
  it("computes center of an endpoint", () => {
    const ep: ConnectionEndpoint = {
      position: { x: 100, y: 200 },
      width: 80,
      height: 40,
    };
    expect(endpointCenter(ep)).toEqual({ x: 140, y: 220 });
  });

  it("handles zero-size endpoint", () => {
    const ep: ConnectionEndpoint = {
      position: { x: 50, y: 50 },
      width: 0,
      height: 0,
    };
    expect(endpointCenter(ep)).toEqual({ x: 50, y: 50 });
  });
});

describe("computeEdgePoint", () => {
  const item: ConnectionEndpoint = {
    position: { x: 0, y: 0 },
    width: 100,
    height: 60,
  };
  // center = (50, 30)

  it("returns center when target is at center", () => {
    expect(computeEdgePoint(item, { x: 50, y: 30 })).toEqual({
      x: 50,
      y: 30,
    });
  });

  it("returns right edge point when target is to the right", () => {
    const result = computeEdgePoint(item, { x: 200, y: 30 });
    expect(result.x).toBe(100); // right edge
    expect(result.y).toBe(30); // same y as center since target is level
  });

  it("returns left edge point when target is to the left", () => {
    const result = computeEdgePoint(item, { x: -100, y: 30 });
    expect(result.x).toBe(0); // left edge
    expect(result.y).toBe(30);
  });

  it("returns bottom edge point when target is below", () => {
    const result = computeEdgePoint(item, { x: 50, y: 200 });
    expect(result.x).toBe(50);
    expect(result.y).toBe(60); // bottom edge
  });

  it("returns top edge point when target is above", () => {
    const result = computeEdgePoint(item, { x: 50, y: -100 });
    expect(result.x).toBe(50);
    expect(result.y).toBe(0); // top edge
  });

  it("handles diagonal target (right-bottom)", () => {
    // Target at 45-degree angle relative to center
    const result = computeEdgePoint(item, { x: 200, y: 180 });
    // dx = 150, dy = 150, halfW = 50, halfH = 30
    // absDx * halfH = 150 * 30 = 4500 > absDy * halfW = 150 * 50 = 7500? No
    // So it intersects top/bottom edge
    expect(result.y).toBe(60); // bottom edge
    expect(result.x).toBeGreaterThan(50);
  });

  it("handles wide item with vertical target", () => {
    const wideItem: ConnectionEndpoint = {
      position: { x: 0, y: 0 },
      width: 200,
      height: 20,
    };
    // center = (100, 10)
    const result = computeEdgePoint(wideItem, { x: 100, y: 100 });
    expect(result.x).toBe(100);
    expect(result.y).toBe(20); // bottom edge
  });
});

describe("edgeMidpoint", () => {
  const ep: ConnectionEndpoint = {
    position: { x: 100, y: 200 },
    width: 80,
    height: 40,
  };
  // center = (140, 220)

  it("returns top edge midpoint", () => {
    expect(edgeMidpoint(ep, "top")).toEqual({ x: 140, y: 200 });
  });

  it("returns bottom edge midpoint", () => {
    expect(edgeMidpoint(ep, "bottom")).toEqual({ x: 140, y: 240 });
  });

  it("returns left edge midpoint", () => {
    expect(edgeMidpoint(ep, "left")).toEqual({ x: 100, y: 220 });
  });

  it("returns right edge midpoint", () => {
    expect(edgeMidpoint(ep, "right")).toEqual({ x: 180, y: 220 });
  });
});

describe("determineConnectionDirections", () => {
  it("chooses right-left when target is to the right with gap", () => {
    const from: ConnectionEndpoint = {
      position: { x: 0, y: 0 },
      width: 100,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 300, y: 0 },
      width: 100,
      height: 50,
    };
    const dirs = determineConnectionDirections(from, to);
    expect(dirs.fromDir).toBe("right");
    expect(dirs.toDir).toBe("left");
  });

  it("chooses left-right when target is to the left with gap", () => {
    const from: ConnectionEndpoint = {
      position: { x: 300, y: 0 },
      width: 100,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 0, y: 0 },
      width: 100,
      height: 50,
    };
    const dirs = determineConnectionDirections(from, to);
    expect(dirs.fromDir).toBe("left");
    expect(dirs.toDir).toBe("right");
  });

  it("chooses bottom-top when target is below with gap", () => {
    const from: ConnectionEndpoint = {
      position: { x: 100, y: 0 },
      width: 50,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 100, y: 200 },
      width: 50,
      height: 50,
    };
    const dirs = determineConnectionDirections(from, to);
    expect(dirs.fromDir).toBe("bottom");
    expect(dirs.toDir).toBe("top");
  });

  it("chooses top-bottom when target is above with gap", () => {
    const from: ConnectionEndpoint = {
      position: { x: 100, y: 200 },
      width: 50,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 100, y: 0 },
      width: 50,
      height: 50,
    };
    const dirs = determineConnectionDirections(from, to);
    expect(dirs.fromDir).toBe("top");
    expect(dirs.toDir).toBe("bottom");
  });

  it("chooses right-left when horizontal gap is larger than vertical", () => {
    const from: ConnectionEndpoint = {
      position: { x: 0, y: 0 },
      width: 100,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 200, y: 80 },
      width: 100,
      height: 50,
    };
    // dx = 250, gapX = 250 - 50 - 50 = 150
    // dy = 80+25-25 = 80, gapY = 80 - 25 - 25 = 30
    const dirs = determineConnectionDirections(from, to);
    expect(dirs.fromDir).toBe("right");
    expect(dirs.toDir).toBe("left");
  });

  it("handles overlapping nodes with right bias", () => {
    const from: ConnectionEndpoint = {
      position: { x: 0, y: 0 },
      width: 100,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 50, y: 10 },
      width: 100,
      height: 50,
    };
    const dirs = determineConnectionDirections(from, to);
    // Overlapping: gapX and gapY are both negative
    // dx = 50, dy = 10 => absDx > absDy => horizontal
    expect(dirs.fromDir).toBe("right");
    expect(dirs.toDir).toBe("left");
  });

  it("handles overlapping nodes with left bias", () => {
    const from: ConnectionEndpoint = {
      position: { x: 50, y: 10 },
      width: 100,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 0, y: 0 },
      width: 100,
      height: 50,
    };
    const dirs = determineConnectionDirections(from, to);
    // Overlapping: gapX and gapY are both negative
    // dx = -50, dy = -10 => absDx > absDy => horizontal, dx < 0 => left
    expect(dirs.fromDir).toBe("left");
    expect(dirs.toDir).toBe("right");
  });

  it("handles overlapping nodes with vertical dominance downward", () => {
    const from: ConnectionEndpoint = {
      position: { x: 0, y: 0 },
      width: 100,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 10, y: 20 },
      width: 100,
      height: 50,
    };
    const dirs = determineConnectionDirections(from, to);
    // Overlapping: dx = 10, dy = 20 => absDy > absDx => vertical
    // gapX = 10 - 50 - 50 = -90, gapY = 20 - 25 - 25 = -30
    // Both negative => overlapping fallback
    // absDx(10) < absDy(20) => vertical, dy >= 0 => bottom
    expect(dirs.fromDir).toBe("bottom");
    expect(dirs.toDir).toBe("top");
  });

  it("handles overlapping nodes with vertical dominance upward", () => {
    const from: ConnectionEndpoint = {
      position: { x: 10, y: 20 },
      width: 100,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 0, y: 0 },
      width: 100,
      height: 50,
    };
    const dirs = determineConnectionDirections(from, to);
    // dx = -10, dy = -20 => absDy > absDx => vertical, dy < 0 => top
    expect(dirs.fromDir).toBe("top");
    expect(dirs.toDir).toBe("bottom");
  });

  it("handles same position nodes", () => {
    const ep: ConnectionEndpoint = {
      position: { x: 100, y: 100 },
      width: 50,
      height: 50,
    };
    const dirs = determineConnectionDirections(ep, ep);
    // dx = 0, dy = 0 => absDx >= absDy => right/left
    expect(dirs.fromDir).toBe("right");
    expect(dirs.toDir).toBe("left");
  });
});

describe("segmentIntersectsRect", () => {
  const rect: Obstacle = {
    position: { x: 100, y: 100 },
    width: 50,
    height: 50,
  };

  it("returns true when segment passes through rect", () => {
    expect(
      segmentIntersectsRect({ x: 0, y: 125 }, { x: 300, y: 125 }, rect),
    ).toBe(true);
  });

  it("returns false when segment is far from rect", () => {
    expect(segmentIntersectsRect({ x: 0, y: 0 }, { x: 50, y: 0 }, rect)).toBe(
      false,
    );
  });

  it("returns true when segment touches margin around rect", () => {
    // rect extends from (100,100) to (150,150), margin=10 extends to (90,90)-(160,160)
    expect(
      segmentIntersectsRect({ x: 0, y: 95 }, { x: 200, y: 95 }, rect, 10),
    ).toBe(true);
  });

  it("returns false when segment is just outside margin", () => {
    expect(
      segmentIntersectsRect({ x: 0, y: 85 }, { x: 200, y: 85 }, rect, 10),
    ).toBe(false);
  });

  it("returns true for diagonal segment through rect", () => {
    expect(
      segmentIntersectsRect({ x: 80, y: 80 }, { x: 170, y: 170 }, rect),
    ).toBe(true);
  });

  it("returns true when segment starts inside rect", () => {
    expect(
      segmentIntersectsRect({ x: 120, y: 120 }, { x: 300, y: 300 }, rect),
    ).toBe(true);
  });

  it("handles zero-length segment inside rect", () => {
    expect(
      segmentIntersectsRect({ x: 125, y: 125 }, { x: 125, y: 125 }, rect),
    ).toBe(true);
  });

  it("handles zero-length segment outside rect", () => {
    expect(segmentIntersectsRect({ x: 0, y: 0 }, { x: 0, y: 0 }, rect)).toBe(
      false,
    );
  });

  it("handles vertical segment through rect", () => {
    expect(
      segmentIntersectsRect({ x: 125, y: 0 }, { x: 125, y: 200 }, rect),
    ).toBe(true);
  });

  it("handles vertical segment missing rect", () => {
    expect(
      segmentIntersectsRect({ x: 50, y: 0 }, { x: 50, y: 200 }, rect),
    ).toBe(false);
  });
});

describe("computeSmartConnectionPath", () => {
  const viewport: ViewportState = { offsetX: 0, offsetY: 0, scale: 1 };

  it("returns a valid SVG path string", () => {
    const from: ConnectionEndpoint = {
      position: { x: 0, y: 0 },
      width: 100,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 300, y: 0 },
      width: 100,
      height: 50,
    };
    const result = computeSmartConnectionPath(from, to, viewport);
    expect(result.d).toMatch(/^M\s/);
    expect(result.d).toContain("C ");
  });

  it("uses right-left direction for horizontally separated nodes", () => {
    const from: ConnectionEndpoint = {
      position: { x: 0, y: 0 },
      width: 100,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 300, y: 0 },
      width: 100,
      height: 50,
    };
    const result = computeSmartConnectionPath(from, to, viewport);
    // Start should be at right edge midpoint of from: (100, 25)
    expect(result.start.x).toBe(100);
    expect(result.start.y).toBe(25);
    // End should be at left edge midpoint of to: (300, 25)
    expect(result.end.x).toBe(300);
    expect(result.end.y).toBe(25);
  });

  it("uses bottom-top direction for vertically separated nodes", () => {
    const from: ConnectionEndpoint = {
      position: { x: 100, y: 0 },
      width: 50,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 100, y: 200 },
      width: 50,
      height: 50,
    };
    const result = computeSmartConnectionPath(from, to, viewport);
    // Start should be at bottom edge midpoint: (125, 50)
    expect(result.start.x).toBe(125);
    expect(result.start.y).toBe(50);
    // End should be at top edge midpoint: (125, 200)
    expect(result.end.x).toBe(125);
    expect(result.end.y).toBe(200);
  });

  it("applies viewport offset", () => {
    const from: ConnectionEndpoint = {
      position: { x: 0, y: 0 },
      width: 100,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 300, y: 0 },
      width: 100,
      height: 50,
    };
    const offsetViewport: ViewportState = {
      offsetX: 50,
      offsetY: 20,
      scale: 1,
    };
    const result = computeSmartConnectionPath(from, to, offsetViewport);
    expect(result.start.x).toBe(150);
    expect(result.start.y).toBe(45);
  });

  it("applies viewport scale", () => {
    const from: ConnectionEndpoint = {
      position: { x: 0, y: 0 },
      width: 100,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 300, y: 0 },
      width: 100,
      height: 50,
    };
    const scaledViewport: ViewportState = {
      offsetX: 0,
      offsetY: 0,
      scale: 2,
    };
    const result = computeSmartConnectionPath(from, to, scaledViewport);
    expect(result.start.x).toBe(200);
    expect(result.start.y).toBe(50);
    expect(result.end.x).toBe(600);
    expect(result.end.y).toBe(50);
  });

  it("deflects path when obstacle is in the way", () => {
    const from: ConnectionEndpoint = {
      position: { x: 0, y: 100 },
      width: 100,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 400, y: 100 },
      width: 100,
      height: 50,
    };
    const obstacle: Obstacle = {
      position: { x: 200, y: 100 },
      width: 80,
      height: 50,
    };
    const withoutObstacle = computeSmartConnectionPath(from, to, viewport);
    const withObstacle = computeSmartConnectionPath(from, to, viewport, [
      obstacle,
    ]);
    // The path should be different when obstacle is present
    expect(withObstacle.d).not.toBe(withoutObstacle.d);
  });

  it("does not deflect when obstacle does not intersect path", () => {
    const from: ConnectionEndpoint = {
      position: { x: 0, y: 0 },
      width: 100,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 300, y: 0 },
      width: 100,
      height: 50,
    };
    const farObstacle: Obstacle = {
      position: { x: 0, y: 500 },
      width: 80,
      height: 50,
    };
    const withoutObstacle = computeSmartConnectionPath(from, to, viewport);
    const withObstacle = computeSmartConnectionPath(from, to, viewport, [
      farObstacle,
    ]);
    expect(withObstacle.d).toBe(withoutObstacle.d);
  });

  it("excludes source and target from obstacle checking", () => {
    const from: ConnectionEndpoint = {
      position: { x: 0, y: 0 },
      width: 100,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 300, y: 0 },
      width: 100,
      height: 50,
    };
    // Pass from and to as obstacles - they should be excluded
    const withSelfObstacles = computeSmartConnectionPath(from, to, viewport, [
      from,
      to,
    ]);
    const withoutObstacles = computeSmartConnectionPath(from, to, viewport);
    expect(withSelfObstacles.d).toBe(withoutObstacles.d);
  });

  it("handles same position nodes gracefully", () => {
    const ep: ConnectionEndpoint = {
      position: { x: 100, y: 100 },
      width: 50,
      height: 50,
    };
    const result = computeSmartConnectionPath(ep, ep, viewport);
    expect(result.d).toMatch(/^M\s/);
    expect(result.d).toContain("C ");
  });

  it("returns midpoint on the bezier curve", () => {
    const from: ConnectionEndpoint = {
      position: { x: 0, y: 0 },
      width: 100,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 300, y: 0 },
      width: 100,
      height: 50,
    };
    const result = computeSmartConnectionPath(from, to, viewport);
    // Midpoint should be between start and end
    expect(result.midpoint.x).toBeGreaterThan(result.start.x);
    expect(result.midpoint.x).toBeLessThan(result.end.x);
    // For horizontal connection, y should be close to start.y
    expect(result.midpoint.y).toBeCloseTo(result.start.y, 0);
  });
});

describe("computePortConnectionPath", () => {
  const viewport: ViewportState = { offsetX: 0, offsetY: 0, scale: 1 };

  const fromPort: ConnectorPortOnItem = {
    port: { id: "right", edge: "right", position: 0.5 },
    itemPosition: { x: 0, y: 0 },
    itemWidth: 100,
    itemHeight: 50,
  };

  const toPort: ConnectorPortOnItem = {
    port: { id: "left", edge: "left", position: 0.5 },
    itemPosition: { x: 300, y: 0 },
    itemWidth: 100,
    itemHeight: 50,
  };

  it("returns a valid SVG path string", () => {
    const result = computePortConnectionPath(fromPort, toPort, viewport);
    expect(result.d).toMatch(/^M\s/);
    expect(result.d).toContain("C ");
  });

  it("start point is at the from port position", () => {
    const result = computePortConnectionPath(fromPort, toPort, viewport);
    // Right edge center of item at (0,0) w=100, h=50: (100, 25)
    expect(result.start).toEqual({ x: 100, y: 25 });
  });

  it("end point is at the to port position", () => {
    const result = computePortConnectionPath(fromPort, toPort, viewport);
    // Left edge center of item at (300,0) w=100, h=50: (300, 25)
    expect(result.end).toEqual({ x: 300, y: 25 });
  });

  it("uses explicit port directions, not auto-determined", () => {
    // Force bottom-to-top connection even though nodes are side by side
    const bottomPort: ConnectorPortOnItem = {
      port: { id: "bottom", edge: "bottom", position: 0.5 },
      itemPosition: { x: 0, y: 0 },
      itemWidth: 100,
      itemHeight: 50,
    };
    const topPort: ConnectorPortOnItem = {
      port: { id: "top", edge: "top", position: 0.5 },
      itemPosition: { x: 300, y: 0 },
      itemWidth: 100,
      itemHeight: 50,
    };
    const result = computePortConnectionPath(bottomPort, topPort, viewport);
    // Start at bottom center: (50, 50)
    expect(result.start).toEqual({ x: 50, y: 50 });
    // End at top center: (350, 0)
    expect(result.end).toEqual({ x: 350, y: 0 });
  });

  it("applies viewport offset", () => {
    const vpOffset: ViewportState = { offsetX: 100, offsetY: 50, scale: 1 };
    const result = computePortConnectionPath(fromPort, toPort, vpOffset);
    // Right edge center: (100, 25) -> screen: (200, 75)
    expect(result.start).toEqual({ x: 200, y: 75 });
  });

  it("applies viewport scale", () => {
    const vpScale: ViewportState = { offsetX: 0, offsetY: 0, scale: 2 };
    const result = computePortConnectionPath(fromPort, toPort, vpScale);
    // (100, 25) * 2 = (200, 50)
    expect(result.start).toEqual({ x: 200, y: 50 });
    // (300, 25) * 2 = (600, 50)
    expect(result.end).toEqual({ x: 600, y: 50 });
  });

  it("deflects path when obstacle is in the way", () => {
    const obstacle: Obstacle = {
      position: { x: 180, y: 0 },
      width: 40,
      height: 50,
    };
    const without = computePortConnectionPath(fromPort, toPort, viewport);
    const with_ = computePortConnectionPath(fromPort, toPort, viewport, [
      obstacle,
    ]);
    expect(with_.d).not.toBe(without.d);
  });

  it("excludes source and target items from obstacles", () => {
    const selfObstacles: readonly Obstacle[] = [
      { position: { x: 0, y: 0 }, width: 100, height: 50 },
      { position: { x: 300, y: 0 }, width: 100, height: 50 },
    ];
    const withSelf = computePortConnectionPath(
      fromPort,
      toPort,
      viewport,
      selfObstacles,
    );
    const without = computePortConnectionPath(fromPort, toPort, viewport);
    expect(withSelf.d).toBe(without.d);
  });

  it("returns midpoint on the bezier curve", () => {
    const result = computePortConnectionPath(fromPort, toPort, viewport);
    expect(result.midpoint.x).toBeGreaterThan(result.start.x);
    expect(result.midpoint.x).toBeLessThan(result.end.x);
  });

  it("handles custom port positions along edges", () => {
    const rightTopPort: ConnectorPortOnItem = {
      port: { id: "right-top", edge: "right", position: 0.25 },
      itemPosition: { x: 0, y: 0 },
      itemWidth: 100,
      itemHeight: 80,
    };
    const leftBottomPort: ConnectorPortOnItem = {
      port: { id: "left-bottom", edge: "left", position: 0.75 },
      itemPosition: { x: 300, y: 0 },
      itemWidth: 100,
      itemHeight: 80,
    };
    const result = computePortConnectionPath(
      rightTopPort,
      leftBottomPort,
      viewport,
    );
    // right edge at position 0.25: (100, 20)
    expect(result.start).toEqual({ x: 100, y: 20 });
    // left edge at position 0.75: (300, 60)
    expect(result.end).toEqual({ x: 300, y: 60 });
  });
});

describe("computeConnectionPath (legacy)", () => {
  const viewport: ViewportState = { offsetX: 0, offsetY: 0, scale: 1 };

  it("returns a valid SVG path string", () => {
    const from: ConnectionEndpoint = {
      position: { x: 0, y: 0 },
      width: 100,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 300, y: 100 },
      width: 100,
      height: 50,
    };
    const result = computeConnectionPath(from, to, viewport);
    expect(result.d).toMatch(/^M\s/);
    expect(result.d).toContain("C ");
  });

  it("start and end points are on item edges", () => {
    const from: ConnectionEndpoint = {
      position: { x: 0, y: 0 },
      width: 100,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 300, y: 0 },
      width: 100,
      height: 50,
    };
    const result = computeConnectionPath(from, to, viewport);
    expect(result.start.x).toBe(100);
    expect(result.start.y).toBe(25);
    expect(result.end.x).toBe(300);
    expect(result.end.y).toBe(25);
  });

  it("applies viewport offset to screen coordinates", () => {
    const from: ConnectionEndpoint = {
      position: { x: 0, y: 0 },
      width: 100,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 300, y: 0 },
      width: 100,
      height: 50,
    };
    const offsetViewport: ViewportState = {
      offsetX: 50,
      offsetY: 20,
      scale: 1,
    };
    const result = computeConnectionPath(from, to, offsetViewport);
    expect(result.start.x).toBe(150);
    expect(result.start.y).toBe(45);
  });

  it("applies viewport scale to screen coordinates", () => {
    const from: ConnectionEndpoint = {
      position: { x: 0, y: 0 },
      width: 100,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 300, y: 0 },
      width: 100,
      height: 50,
    };
    const scaledViewport: ViewportState = {
      offsetX: 0,
      offsetY: 0,
      scale: 2,
    };
    const result = computeConnectionPath(from, to, scaledViewport);
    expect(result.start.x).toBe(200);
    expect(result.start.y).toBe(50);
    expect(result.end.x).toBe(600);
    expect(result.end.y).toBe(50);
  });

  it("handles items at same position", () => {
    const from: ConnectionEndpoint = {
      position: { x: 100, y: 100 },
      width: 50,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 100, y: 100 },
      width: 50,
      height: 50,
    };
    const result = computeConnectionPath(from, to, viewport);
    expect(result.start).toEqual(result.end);
  });

  it("handles vertical connection", () => {
    const from: ConnectionEndpoint = {
      position: { x: 100, y: 0 },
      width: 50,
      height: 50,
    };
    const to: ConnectionEndpoint = {
      position: { x: 100, y: 200 },
      width: 50,
      height: 50,
    };
    const result = computeConnectionPath(from, to, viewport);
    expect(result.start.x).toBe(125);
    expect(result.start.y).toBe(50);
    expect(result.end.x).toBe(125);
    expect(result.end.y).toBe(200);
  });
});
