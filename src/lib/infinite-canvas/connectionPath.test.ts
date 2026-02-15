import { describe, expect, it } from "vitest";
import {
  computeConnectionPath,
  computeEdgePoint,
  endpointCenter,
} from "./connectionPath";
import type { ConnectionEndpoint } from "./connectionPath";
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

describe("computeConnectionPath", () => {
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
    // from center = (50, 25), to center = (350, 25)
    // from right edge = (100, 25)
    expect(result.start.x).toBe(100);
    expect(result.start.y).toBe(25);
    // to left edge = (300, 25)
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
    // from edge = (100, 25) + offset → (150, 45)
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
    // from edge = (100, 25) * 2 → (200, 50)
    expect(result.start.x).toBe(200);
    expect(result.start.y).toBe(50);
    // to edge = (300, 25) * 2 → (600, 50)
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
    // Both centers are the same, so computeEdgePoint returns center
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
    // from center = (125, 25), to center = (125, 225)
    // Same x so edge points are on bottom/top edges
    expect(result.start.x).toBe(125);
    expect(result.start.y).toBe(50); // bottom edge of from
    expect(result.end.x).toBe(125);
    expect(result.end.y).toBe(200); // top edge of to
  });
});
