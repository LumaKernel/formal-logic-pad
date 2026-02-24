import { describe, expect, it } from "vitest";
import {
  MAX_SCALE,
  MIN_SCALE,
  applyZoom,
  clampScale,
  classifyWheelEvent,
  computeScaleFromWheel,
} from "./zoom";

describe("clampScale", () => {
  it("returns value when within range", () => {
    expect(clampScale(1)).toBe(1);
    expect(clampScale(2.5)).toBe(2.5);
  });

  it("clamps to minimum", () => {
    expect(clampScale(0.01)).toBe(MIN_SCALE);
    expect(clampScale(-1)).toBe(MIN_SCALE);
  });

  it("clamps to maximum", () => {
    expect(clampScale(10)).toBe(MAX_SCALE);
    expect(clampScale(100)).toBe(MAX_SCALE);
  });

  it("returns exact boundary values", () => {
    expect(clampScale(MIN_SCALE)).toBe(MIN_SCALE);
    expect(clampScale(MAX_SCALE)).toBe(MAX_SCALE);
  });

  it("respects custom min/max", () => {
    expect(clampScale(0.5, 1, 3)).toBe(1);
    expect(clampScale(4, 1, 3)).toBe(3);
    expect(clampScale(2, 1, 3)).toBe(2);
  });
});

describe("applyZoom", () => {
  it("zooms in centered on a point", () => {
    const viewport = { offsetX: 0, offsetY: 0, scale: 1 };
    const center = { x: 200, y: 150 };
    const result = applyZoom(viewport, center, 2);

    // World point under cursor at scale 1: (200, 150)
    // After zoom to 2: newOffsetX = 200 - 200 * 2 = -200
    expect(result.scale).toBe(2);
    expect(result.offsetX).toBe(-200);
    expect(result.offsetY).toBe(-150);
  });

  it("zooms out centered on a point", () => {
    const viewport = { offsetX: 0, offsetY: 0, scale: 2 };
    const center = { x: 200, y: 150 };
    const result = applyZoom(viewport, center, 1);

    // ratio = 1/2 = 0.5
    // newOffsetX = 200 - (200 - 0) * 0.5 = 200 - 100 = 100
    expect(result.scale).toBe(1);
    expect(result.offsetX).toBe(100);
    expect(result.offsetY).toBe(75);
  });

  it("preserves world point under cursor", () => {
    const viewport = { offsetX: 50, offsetY: 30, scale: 1.5 };
    const center = { x: 300, y: 200 };

    // World point under cursor before zoom
    const worldX = (center.x - viewport.offsetX) / viewport.scale;
    const worldY = (center.y - viewport.offsetY) / viewport.scale;

    const result = applyZoom(viewport, center, 2.5);

    // Screen position of same world point after zoom
    const screenX = worldX * result.scale + result.offsetX;
    const screenY = worldY * result.scale + result.offsetY;

    expect(screenX).toBeCloseTo(center.x, 10);
    expect(screenY).toBeCloseTo(center.y, 10);
  });

  it("clamps scale to min", () => {
    const viewport = { offsetX: 0, offsetY: 0, scale: 0.2 };
    const result = applyZoom(viewport, { x: 100, y: 100 }, 0.01);
    expect(result.scale).toBe(MIN_SCALE);
  });

  it("clamps scale to max", () => {
    const viewport = { offsetX: 0, offsetY: 0, scale: 4 };
    const result = applyZoom(viewport, { x: 100, y: 100 }, 10);
    expect(result.scale).toBe(MAX_SCALE);
  });

  it("returns same viewport when already at min and zooming out", () => {
    const viewport = { offsetX: 10, offsetY: 20, scale: MIN_SCALE };
    const result = applyZoom(viewport, { x: 100, y: 100 }, 0.01);
    expect(result).toBe(viewport);
  });

  it("returns same viewport when already at max and zooming in", () => {
    const viewport = { offsetX: 10, offsetY: 20, scale: MAX_SCALE };
    const result = applyZoom(viewport, { x: 100, y: 100 }, 10);
    expect(result).toBe(viewport);
  });

  it("respects custom min/max scale", () => {
    const viewport = { offsetX: 0, offsetY: 0, scale: 1 };
    const result = applyZoom(viewport, { x: 0, y: 0 }, 0.3, 0.5, 3);
    expect(result.scale).toBe(0.5);
  });

  it("zooms at origin with no offset change when center is (0,0)", () => {
    const viewport = { offsetX: 0, offsetY: 0, scale: 1 };
    const result = applyZoom(viewport, { x: 0, y: 0 }, 2);
    expect(result.offsetX).toBe(0);
    expect(result.offsetY).toBe(0);
    expect(result.scale).toBe(2);
  });
});

describe("classifyWheelEvent", () => {
  it("returns 'zoom' when ctrlKey is true (trackpad pinch)", () => {
    expect(classifyWheelEvent({ ctrlKey: true })).toBe("zoom");
  });

  it("returns 'pan' when ctrlKey is false (trackpad two-finger scroll)", () => {
    expect(classifyWheelEvent({ ctrlKey: false })).toBe("pan");
  });
});

describe("computeScaleFromWheel", () => {
  it("zooms in with negative deltaY", () => {
    const result = computeScaleFromWheel(1, -100);
    expect(result).toBeGreaterThan(1);
  });

  it("zooms out with positive deltaY", () => {
    const result = computeScaleFromWheel(1, 100);
    expect(result).toBeLessThan(1);
  });

  it("returns same scale for zero deltaY", () => {
    expect(computeScaleFromWheel(2, 0)).toBe(2);
  });

  it("scales proportionally to current scale", () => {
    const factor1 = computeScaleFromWheel(1, -100) / 1;
    const factor2 = computeScaleFromWheel(2, -100) / 2;
    expect(factor1).toBeCloseTo(factor2, 10);
  });

  it("respects sensitivity parameter", () => {
    const slow = computeScaleFromWheel(1, -100, 0.0005);
    const fast = computeScaleFromWheel(1, -100, 0.002);
    // Both should zoom in, but fast should zoom more
    expect(fast).toBeGreaterThan(slow);
    expect(slow).toBeGreaterThan(1);
  });
});
