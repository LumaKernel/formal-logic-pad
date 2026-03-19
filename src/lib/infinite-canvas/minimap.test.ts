import { describe, expect, it } from "vitest";
import {
  computeItemsBoundingBox,
  computeMinimapPlacementStyle,
  computeMinimapTransform,
  computeViewportRect,
  minimapClickToViewportOffset,
  worldToMinimap,
} from "./minimap";
import type { MinimapItem } from "./minimap";

describe("computeItemsBoundingBox", () => {
  it("returns null for empty items", () => {
    expect(computeItemsBoundingBox([])).toBe(null);
  });

  it("returns bounding box for single item", () => {
    const items: readonly MinimapItem[] = [
      { id: "a", position: { x: 10, y: 20 }, size: { width: 100, height: 50 } },
    ];
    expect(computeItemsBoundingBox(items)).toEqual({
      minX: 10,
      minY: 20,
      maxX: 110,
      maxY: 70,
    });
  });

  it("returns bounding box covering all items", () => {
    const items: readonly MinimapItem[] = [
      { id: "a", position: { x: 0, y: 0 }, size: { width: 50, height: 50 } },
      {
        id: "b",
        position: { x: 200, y: 300 },
        size: { width: 100, height: 80 },
      },
      {
        id: "c",
        position: { x: -50, y: 100 },
        size: { width: 30, height: 30 },
      },
    ];
    expect(computeItemsBoundingBox(items)).toEqual({
      minX: -50,
      minY: 0,
      maxX: 300,
      maxY: 380,
    });
  });

  it("handles items with zero size", () => {
    const items: readonly MinimapItem[] = [
      { id: "a", position: { x: 5, y: 10 }, size: { width: 0, height: 0 } },
    ];
    expect(computeItemsBoundingBox(items)).toEqual({
      minX: 5,
      minY: 10,
      maxX: 5,
      maxY: 10,
    });
  });

  it("handles negative positions", () => {
    const items: readonly MinimapItem[] = [
      {
        id: "a",
        position: { x: -200, y: -100 },
        size: { width: 50, height: 50 },
      },
      {
        id: "b",
        position: { x: -50, y: -30 },
        size: { width: 100, height: 80 },
      },
    ];
    expect(computeItemsBoundingBox(items)).toEqual({
      minX: -200,
      minY: -100,
      maxX: 50,
      maxY: 50,
    });
  });
});

describe("computeMinimapTransform", () => {
  it("fits bounding box into minimap area", () => {
    const box = { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
    const minimapSize = { width: 150, height: 100 };
    const transform = computeMinimapTransform(box, minimapSize, 0, 0);
    // World size = 1000x1000, minimap = 150x100
    // scaleX = 150/1000 = 0.15, scaleY = 100/1000 = 0.1
    // scale = min(0.15, 0.1) = 0.1
    expect(transform.scale).toBeCloseTo(0.1);
  });

  it("centers content in minimap", () => {
    const box = { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
    const minimapSize = { width: 200, height: 200 };
    const transform = computeMinimapTransform(box, minimapSize, 0, 10);
    // Available: 180x180, world: 1000x1000
    // scale = 180/1000 = 0.18
    // contentWidth = 1000 * 0.18 = 180, centered offset = 10 + (180-180)/2 - 0 = 10
    expect(transform.scale).toBeCloseTo(0.18);
    expect(transform.offsetX).toBeCloseTo(10);
    expect(transform.offsetY).toBeCloseTo(10);
  });

  it("applies world margin", () => {
    const box = { minX: 0, minY: 0, maxX: 800, maxY: 600 };
    const minimapSize = { width: 150, height: 100 };
    const transform = computeMinimapTransform(box, minimapSize, 100, 0);
    // World size with margin = 1000x800
    // scaleX = 150/1000 = 0.15, scaleY = 100/800 = 0.125
    // scale = min(0.15, 0.125) = 0.125
    expect(transform.scale).toBeCloseTo(0.125);
  });

  it("returns default for zero-width world", () => {
    const box = { minX: 5, minY: 5, maxX: 5, maxY: 5 };
    const minimapSize = { width: 150, height: 100 };
    // worldWidth = 0 + 0*2 = 0 (with margin=0)
    const transform = computeMinimapTransform(box, minimapSize, 0, 10);
    expect(transform.scale).toBe(1);
    expect(transform.offsetX).toBe(10);
    expect(transform.offsetY).toBe(10);
  });

  it("returns default for zero-size minimap", () => {
    const box = { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    const minimapSize = { width: 0, height: 0 };
    const transform = computeMinimapTransform(box, minimapSize);
    expect(transform.scale).toBe(1);
  });

  it("returns default when padding exceeds minimap size", () => {
    const box = { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    const minimapSize = { width: 30, height: 30 };
    const transform = computeMinimapTransform(box, minimapSize, 0, 20);
    expect(transform.scale).toBe(1);
  });
});

describe("worldToMinimap", () => {
  it("transforms origin correctly", () => {
    const transform = { scale: 0.1, offsetX: 10, offsetY: 10 };
    expect(worldToMinimap(transform, { x: 0, y: 0 })).toEqual({
      x: 10,
      y: 10,
    });
  });

  it("applies scale and offset", () => {
    const transform = { scale: 0.5, offsetX: 20, offsetY: 30 };
    expect(worldToMinimap(transform, { x: 100, y: 200 })).toEqual({
      x: 70,
      y: 130,
    });
  });

  it("handles negative world coordinates", () => {
    const transform = { scale: 0.1, offsetX: 50, offsetY: 50 };
    expect(worldToMinimap(transform, { x: -100, y: -200 })).toEqual({
      x: 40,
      y: 30,
    });
  });
});

describe("computeViewportRect", () => {
  it("computes viewport rectangle at scale 1 with no offset", () => {
    const mainViewport = { offsetX: 0, offsetY: 0, scale: 1 };
    const containerSize = { width: 800, height: 600 };
    const minimapTransform = { scale: 0.1, offsetX: 10, offsetY: 10 };
    const rect = computeViewportRect(
      mainViewport,
      containerSize,
      minimapTransform,
    );
    // worldLeft=0, worldTop=0, worldWidth=800, worldHeight=600
    // topLeft = (0*0.1+10, 0*0.1+10) = (10, 10)
    // bottomRight = (800*0.1+10, 600*0.1+10) = (90, 70)
    expect(rect).toEqual({ x: 10, y: 10, width: 80, height: 60 });
  });

  it("computes viewport rectangle with panned viewport", () => {
    const mainViewport = { offsetX: -200, offsetY: -100, scale: 1 };
    const containerSize = { width: 800, height: 600 };
    const minimapTransform = { scale: 0.1, offsetX: 0, offsetY: 0 };
    const rect = computeViewportRect(
      mainViewport,
      containerSize,
      minimapTransform,
    );
    // worldLeft=200, worldTop=100
    expect(rect.x).toBeCloseTo(20);
    expect(rect.y).toBeCloseTo(10);
    expect(rect.width).toBeCloseTo(80);
    expect(rect.height).toBeCloseTo(60);
  });

  it("computes viewport rectangle with zoomed viewport", () => {
    const mainViewport = { offsetX: 0, offsetY: 0, scale: 2 };
    const containerSize = { width: 800, height: 600 };
    const minimapTransform = { scale: 0.1, offsetX: 0, offsetY: 0 };
    const rect = computeViewportRect(
      mainViewport,
      containerSize,
      minimapTransform,
    );
    // worldLeft=0, worldTop=0, worldWidth=400, worldHeight=300
    expect(rect.x).toBeCloseTo(0);
    expect(rect.y).toBeCloseTo(0);
    expect(rect.width).toBeCloseTo(40);
    expect(rect.height).toBeCloseTo(30);
  });

  it("viewport shrinks as main canvas zooms in", () => {
    const containerSize = { width: 800, height: 600 };
    const minimapTransform = { scale: 0.1, offsetX: 0, offsetY: 0 };
    const rectZoom1 = computeViewportRect(
      { offsetX: 0, offsetY: 0, scale: 1 },
      containerSize,
      minimapTransform,
    );
    const rectZoom2 = computeViewportRect(
      { offsetX: 0, offsetY: 0, scale: 2 },
      containerSize,
      minimapTransform,
    );
    expect(rectZoom2.width).toBeLessThan(rectZoom1.width);
    expect(rectZoom2.height).toBeLessThan(rectZoom1.height);
  });
});

describe("minimapClickToViewportOffset", () => {
  it("centers viewport on clicked world point", () => {
    const minimapTransform = { scale: 0.1, offsetX: 10, offsetY: 10 };
    const containerSize = { width: 800, height: 600 };
    // Click at minimap (60, 40) → world (500, 300)
    const result = minimapClickToViewportOffset(
      { x: 60, y: 40 },
      minimapTransform,
      containerSize,
      1,
    );
    // offsetX = -500*1 + 800/2 = -100
    // offsetY = -300*1 + 600/2 = 0
    expect(result.offsetX).toBeCloseTo(-100);
    expect(result.offsetY).toBeCloseTo(0);
    expect(result.scale).toBe(1);
  });

  it("preserves scale when navigating", () => {
    const minimapTransform = { scale: 0.1, offsetX: 0, offsetY: 0 };
    const containerSize = { width: 800, height: 600 };
    const result = minimapClickToViewportOffset(
      { x: 50, y: 50 },
      minimapTransform,
      containerSize,
      2,
    );
    expect(result.scale).toBe(2);
    // worldX = 50/0.1 = 500, worldY = 50/0.1 = 500
    // offsetX = -500*2 + 400 = -600
    expect(result.offsetX).toBeCloseTo(-600);
    expect(result.offsetY).toBeCloseTo(-700);
  });

  it("clicking center of items centers viewport there", () => {
    const minimapTransform = { scale: 0.1, offsetX: 20, offsetY: 20 };
    const containerSize = { width: 800, height: 600 };
    // Click at minimap center of transform origin: (20, 20) → world (0, 0)
    const result = minimapClickToViewportOffset(
      { x: 20, y: 20 },
      minimapTransform,
      containerSize,
      1,
    );
    // worldX = (20-20)/0.1 = 0, worldY = 0
    // offsetX = 0 + 400 = 400
    expect(result.offsetX).toBeCloseTo(400);
    expect(result.offsetY).toBeCloseTo(300);
  });
});

describe("computeMinimapPlacementStyle", () => {
  it("returns bottom-right styles", () => {
    expect(computeMinimapPlacementStyle("bottom-right")).toEqual({
      bottom: "12px",
      right: "12px",
    });
  });

  it("returns bottom-left styles", () => {
    expect(computeMinimapPlacementStyle("bottom-left")).toEqual({
      bottom: "12px",
      left: "12px",
    });
  });

  it("returns top-right styles", () => {
    expect(computeMinimapPlacementStyle("top-right")).toEqual({
      top: "12px",
      right: "12px",
    });
  });

  it("returns top-left styles", () => {
    expect(computeMinimapPlacementStyle("top-left")).toEqual({
      top: "12px",
      left: "12px",
    });
  });

  it("uses custom margin", () => {
    expect(computeMinimapPlacementStyle("bottom-right", 20)).toEqual({
      bottom: "20px",
      right: "20px",
    });
  });
});
