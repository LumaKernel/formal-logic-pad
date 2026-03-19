import { describe, expect, it } from "vitest";
import {
  FIT_MAX_SCALE,
  MAX_SCALE,
  MIN_SCALE,
  ZOOM_PRESETS,
  ZOOM_STEP_FACTOR,
  applyZoom,
  clampScale,
  classifyWheelEvent,
  computeFitToContentViewport,
  computeResetViewport,
  computeScaleFromWheel,
  computeZoomInScale,
  computeZoomOutScale,
  findNearestPreset,
  formatZoomPercent,
  nextPresetDown,
  nextPresetUp,
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

describe("computeZoomInScale", () => {
  it("returns scale multiplied by step factor", () => {
    expect(computeZoomInScale(1)).toBe(ZOOM_STEP_FACTOR);
  });

  it("works at different scales", () => {
    expect(computeZoomInScale(2)).toBe(2 * ZOOM_STEP_FACTOR);
    expect(computeZoomInScale(0.5)).toBe(0.5 * ZOOM_STEP_FACTOR);
  });

  it("respects custom step factor", () => {
    expect(computeZoomInScale(1, 2)).toBe(2);
    expect(computeZoomInScale(1.5, 1.5)).toBe(2.25);
  });
});

describe("computeZoomOutScale", () => {
  it("returns scale divided by step factor", () => {
    expect(computeZoomOutScale(1)).toBe(1 / ZOOM_STEP_FACTOR);
  });

  it("works at different scales", () => {
    expect(computeZoomOutScale(2)).toBe(2 / ZOOM_STEP_FACTOR);
    expect(computeZoomOutScale(0.5)).toBe(0.5 / ZOOM_STEP_FACTOR);
  });

  it("respects custom step factor", () => {
    expect(computeZoomOutScale(4, 2)).toBe(2);
  });

  it("zoom in then out returns original scale", () => {
    const original = 1.5;
    const zoomed = computeZoomInScale(original);
    const back = computeZoomOutScale(zoomed);
    expect(back).toBeCloseTo(original, 10);
  });
});

describe("computeResetViewport", () => {
  it("returns default viewport", () => {
    const result = computeResetViewport();
    expect(result).toEqual({ offsetX: 0, offsetY: 0, scale: 1 });
  });
});

describe("computeFitToContentViewport", () => {
  const containerSize = { width: 800, height: 600 };

  it("returns reset viewport for empty items", () => {
    expect(computeFitToContentViewport([], containerSize)).toEqual(
      computeResetViewport(),
    );
  });

  it("fits a single item centered", () => {
    const items = [{ x: 100, y: 100, width: 200, height: 150 }];
    const result = computeFitToContentViewport(items, containerSize);

    // Content center: (200, 175)
    // The content should be centered in the container
    const centerScreenX = containerSize.width / 2;
    const centerScreenY = containerSize.height / 2;
    const contentCenterX = 200;
    const contentCenterY = 175;

    // Verify center alignment
    const screenCenterX = contentCenterX * result.scale + result.offsetX;
    const screenCenterY = contentCenterY * result.scale + result.offsetY;
    expect(screenCenterX).toBeCloseTo(centerScreenX, 5);
    expect(screenCenterY).toBeCloseTo(centerScreenY, 5);
  });

  it("fits multiple items clamped to FIT_MAX_SCALE when computed scale exceeds 1", () => {
    const items = [
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 500, y: 400, width: 100, height: 100 },
    ];
    const result = computeFitToContentViewport(items, containerSize);

    // Content bounds: (0,0) to (600,500)
    // Available: (720, 520) after padding
    // scaleX = 720/600 = 1.2, scaleY = 520/500 = 1.04
    // min(1.2, 1.04) = 1.04, clamped to FIT_MAX_SCALE (1)
    expect(result.scale).toBe(FIT_MAX_SCALE);
  });

  it("fits large content below 100% without clamping", () => {
    const items = [{ x: 0, y: 0, width: 1600, height: 1200 }];
    const result = computeFitToContentViewport(items, containerSize);

    // Available: (720, 520) after padding
    // scaleX = 720/1600 = 0.45, scaleY = 520/1200 ≈ 0.433
    // min = 0.433, below FIT_MAX_SCALE so not clamped
    expect(result.scale).toBeCloseTo(0.433, 2);
  });

  it("clamps scale to FIT_MAX_SCALE when content is very small", () => {
    const items = [{ x: 0, y: 0, width: 1, height: 1 }];
    const result = computeFitToContentViewport(items, containerSize);
    expect(result.scale).toBe(FIT_MAX_SCALE);
  });

  it("clamps scale to min when content is very large", () => {
    const items = [{ x: 0, y: 0, width: 100000, height: 100000 }];
    const result = computeFitToContentViewport(items, containerSize);
    expect(result.scale).toBe(MIN_SCALE);
  });

  it("respects custom padding", () => {
    // Use large content so both scales are below FIT_MAX_SCALE (1)
    const items = [{ x: 0, y: 0, width: 1600, height: 1200 }];
    const noPadding = computeFitToContentViewport(items, containerSize, 0);
    const withPadding = computeFitToContentViewport(items, containerSize, 100);
    // With more padding, scale should be smaller
    expect(withPadding.scale).toBeLessThan(noPadding.scale);
  });

  it("respects custom min/max scale", () => {
    const items = [{ x: 0, y: 0, width: 1, height: 1 }];
    const result = computeFitToContentViewport(
      items,
      containerSize,
      40,
      0.5,
      2,
    );
    expect(result.scale).toBe(2);
  });
});

describe("formatZoomPercent", () => {
  it("formats 100%", () => {
    expect(formatZoomPercent(1)).toBe("100%");
  });

  it("formats 50%", () => {
    expect(formatZoomPercent(0.5)).toBe("50%");
  });

  it("formats 200%", () => {
    expect(formatZoomPercent(2)).toBe("200%");
  });

  it("rounds to nearest integer", () => {
    expect(formatZoomPercent(0.333)).toBe("33%");
    expect(formatZoomPercent(1.666)).toBe("167%");
  });

  it("formats 10% (min)", () => {
    expect(formatZoomPercent(0.1)).toBe("10%");
  });

  it("formats 500% (max)", () => {
    expect(formatZoomPercent(5)).toBe("500%");
  });
});

describe("findNearestPreset", () => {
  it("returns exact match", () => {
    expect(findNearestPreset(1)).toBe(1);
    expect(findNearestPreset(0.5)).toBe(0.5);
  });

  it("returns nearest preset for in-between values", () => {
    expect(findNearestPreset(0.9)).toBe(1);
    expect(findNearestPreset(1.1)).toBe(1);
    expect(findNearestPreset(0.6)).toBe(0.5);
  });

  it("returns first preset for very small values", () => {
    expect(findNearestPreset(0.01)).toBe(ZOOM_PRESETS[0]);
  });

  it("returns last preset for very large values", () => {
    expect(findNearestPreset(100)).toBe(ZOOM_PRESETS[ZOOM_PRESETS.length - 1]);
  });

  it("respects custom presets", () => {
    expect(findNearestPreset(0.7, [0.5, 1, 2])).toBe(0.5);
    expect(findNearestPreset(0.8, [0.5, 1, 2])).toBe(1);
  });
});

describe("nextPresetUp", () => {
  it("returns next higher preset", () => {
    expect(nextPresetUp(1)).toBe(1.5);
    expect(nextPresetUp(0.5)).toBe(0.75);
  });

  it("returns current scale when at max preset", () => {
    expect(nextPresetUp(5)).toBe(5);
    expect(nextPresetUp(6)).toBe(6);
  });

  it("snaps to next preset when exactly at a preset", () => {
    // When exactly at 1.0, next up should be 1.5
    expect(nextPresetUp(1)).toBe(1.5);
    // When slightly above, still snaps to next
    expect(nextPresetUp(1.01)).toBe(1.5);
  });

  it("returns next preset when between presets", () => {
    expect(nextPresetUp(0.6)).toBe(0.75);
    expect(nextPresetUp(1.2)).toBe(1.5);
  });
});

describe("nextPresetDown", () => {
  it("returns next lower preset", () => {
    expect(nextPresetDown(1)).toBe(0.75);
    expect(nextPresetDown(2)).toBe(1.5);
  });

  it("returns current scale when at min preset", () => {
    expect(nextPresetDown(0.1)).toBe(0.1);
    expect(nextPresetDown(0.05)).toBe(0.05);
  });

  it("snaps to next preset when exactly at a preset", () => {
    // When exactly at 1.0, next down should be 0.75
    expect(nextPresetDown(1)).toBe(0.75);
    // When slightly below, still snaps to previous
    expect(nextPresetDown(0.99)).toBe(0.75);
  });
});
