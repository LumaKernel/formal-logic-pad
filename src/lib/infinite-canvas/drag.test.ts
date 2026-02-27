import { describe, expect, it } from "vitest";
import { applyDragDelta, computeDragPosition, computeGrabOffset } from "./drag";
import type { ViewportState } from "./types";

describe("applyDragDelta", () => {
  it("moves position by delta at scale 1", () => {
    const result = applyDragDelta({ x: 100, y: 200 }, { x: 10, y: -20 }, 1);
    expect(result).toEqual({ x: 110, y: 180 });
  });

  it("divides screen delta by scale to get world delta", () => {
    const result = applyDragDelta({ x: 50, y: 50 }, { x: 20, y: 40 }, 2);
    expect(result).toEqual({ x: 60, y: 70 });
  });

  it("handles fractional scale", () => {
    const result = applyDragDelta({ x: 0, y: 0 }, { x: 10, y: 10 }, 0.5);
    expect(result).toEqual({ x: 20, y: 20 });
  });

  it("returns same coordinates when delta is zero", () => {
    const result = applyDragDelta({ x: 42, y: 99 }, { x: 0, y: 0 }, 1);
    expect(result).toEqual({ x: 42, y: 99 });
  });

  it("handles negative position and delta", () => {
    const result = applyDragDelta({ x: -10, y: -20 }, { x: -5, y: -15 }, 1);
    expect(result).toEqual({ x: -15, y: -35 });
  });
});

describe("computeGrabOffset", () => {
  const VIEWPORT_1X: ViewportState = { offsetX: 0, offsetY: 0, scale: 1 };

  it("computes offset at scale 1 with no viewport pan", () => {
    const result = computeGrabOffset(
      VIEWPORT_1X,
      { x: 150, y: 200 },
      { x: 100, y: 150 },
    );
    expect(result).toEqual({ x: 50, y: 50 });
  });

  it("accounts for viewport offset", () => {
    const viewport: ViewportState = { offsetX: 100, offsetY: 200, scale: 1 };
    const result = computeGrabOffset(
      viewport,
      { x: 250, y: 400 },
      { x: 100, y: 150 },
    );
    // cursor world = (250-100, 400-200) = (150, 200)
    // offset = (150-100, 200-150) = (50, 50)
    expect(result).toEqual({ x: 50, y: 50 });
  });

  it("accounts for viewport scale", () => {
    const viewport: ViewportState = { offsetX: 0, offsetY: 0, scale: 2 };
    const result = computeGrabOffset(
      viewport,
      { x: 200, y: 300 },
      { x: 50, y: 100 },
    );
    // cursor world = (200/2, 300/2) = (100, 150)
    // offset = (100-50, 150-100) = (50, 50)
    expect(result).toEqual({ x: 50, y: 50 });
  });

  it("handles viewport with both offset and scale", () => {
    const viewport: ViewportState = { offsetX: 50, offsetY: 100, scale: 0.5 };
    const result = computeGrabOffset(
      viewport,
      { x: 75, y: 150 },
      { x: 30, y: 80 },
    );
    // cursor world = ((75-50)/0.5, (150-100)/0.5) = (50, 100)
    // offset = (50-30, 100-80) = (20, 20)
    expect(result).toEqual({ x: 20, y: 20 });
  });

  it("returns zero when cursor is at item origin", () => {
    const result = computeGrabOffset(
      VIEWPORT_1X,
      { x: 100, y: 200 },
      { x: 100, y: 200 },
    );
    expect(result).toEqual({ x: 0, y: 0 });
  });
});

describe("computeDragPosition", () => {
  const VIEWPORT_1X: ViewportState = { offsetX: 0, offsetY: 0, scale: 1 };

  it("computes position from cursor and offset at scale 1", () => {
    const result = computeDragPosition(
      VIEWPORT_1X,
      { x: 180, y: 230 },
      { x: 50, y: 50 },
    );
    expect(result).toEqual({ x: 130, y: 180 });
  });

  it("accounts for viewport offset", () => {
    const viewport: ViewportState = { offsetX: 100, offsetY: 200, scale: 1 };
    const result = computeDragPosition(
      viewport,
      { x: 250, y: 450 },
      { x: 50, y: 50 },
    );
    // cursor world = (250-100, 450-200) = (150, 250)
    // pos = (150-50, 250-50) = (100, 200)
    expect(result).toEqual({ x: 100, y: 200 });
  });

  it("accounts for viewport scale", () => {
    const viewport: ViewportState = { offsetX: 0, offsetY: 0, scale: 2 };
    const result = computeDragPosition(
      viewport,
      { x: 300, y: 400 },
      { x: 50, y: 50 },
    );
    // cursor world = (300/2, 400/2) = (150, 200)
    // pos = (150-50, 200-50) = (100, 150)
    expect(result).toEqual({ x: 100, y: 150 });
  });

  it("roundtrip: grab → drag returns same position when cursor unmoved", () => {
    const viewport: ViewportState = { offsetX: 30, offsetY: 60, scale: 1.5 };
    const itemPos = { x: 100, y: 200 };
    const cursorScreen = { x: 250, y: 400 };

    const offset = computeGrabOffset(viewport, cursorScreen, itemPos);
    const result = computeDragPosition(viewport, cursorScreen, offset);

    expect(result.x).toBeCloseTo(itemPos.x);
    expect(result.y).toBeCloseTo(itemPos.y);
  });

  it("correctly handles viewport change between grab and drag (edge scroll)", () => {
    const viewport1: ViewportState = { offsetX: 0, offsetY: 0, scale: 1 };
    const viewport2: ViewportState = { offsetX: 50, offsetY: 50, scale: 1 };
    const itemPos = { x: 100, y: 200 };
    const cursorScreen = { x: 150, y: 250 };

    // Grab with viewport1
    const offset = computeGrabOffset(viewport1, cursorScreen, itemPos);
    // offset = (150-100, 250-200) = (50, 50)

    // Drag with viewport2 (viewport changed due to edge scroll), cursor unmoved
    const result = computeDragPosition(viewport2, cursorScreen, offset);
    // cursor world with viewport2 = ((150-50)/1, (250-50)/1) = (100, 200)
    // pos = (100-50, 200-50) = (50, 150)
    // Item moved left/up because viewport panned right/down
    expect(result).toEqual({ x: 50, y: 150 });
  });
});
