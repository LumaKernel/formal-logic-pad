import { describe, expect, it } from "vitest";
import {
  computeGridDots,
  computeGridLinePatternParams,
  computeGridPatternParams,
} from "./grid";

describe("computeGridDots", () => {
  it("returns dots covering the container", () => {
    const dots = computeGridDots(
      { offsetX: 0, offsetY: 0, scale: 1 },
      { width: 40, height: 40 },
      20,
    );
    // 3 cols (0, 20, 40) x 3 rows (0, 20, 40) = 9 dots
    expect(dots).toHaveLength(9);
    expect(dots[0]).toEqual({ x: 0, y: 0 });
    expect(dots[8]).toEqual({ x: 40, y: 40 });
  });

  it("adjusts dot positions by viewport offset", () => {
    const dots = computeGridDots(
      { offsetX: 10, offsetY: 5, scale: 1 },
      { width: 40, height: 40 },
      20,
    );
    // Offset is 10 % 20 = 10, 5 % 20 = 5
    expect(dots[0]).toEqual({ x: 10, y: 5 });
  });

  it("scales dot spacing by viewport scale", () => {
    const dots = computeGridDots(
      { offsetX: 0, offsetY: 0, scale: 2 },
      { width: 80, height: 80 },
      20,
    );
    // spacing = 20 * 2 = 40, so 3 cols (0, 40, 80) x 3 rows = 9
    expect(dots).toHaveLength(9);
    expect(dots[1]).toEqual({ x: 40, y: 0 });
  });

  it("returns empty array when spacing is zero or negative", () => {
    expect(
      computeGridDots(
        { offsetX: 0, offsetY: 0, scale: 0 },
        { width: 100, height: 100 },
        20,
      ),
    ).toEqual([]);
  });

  it("handles large offsets via modulo", () => {
    const dots = computeGridDots(
      { offsetX: 1000, offsetY: 1000, scale: 1 },
      { width: 20, height: 20 },
      20,
    );
    // 1000 % 20 = 0, so same as zero offset
    expect(dots[0]).toEqual({ x: 0, y: 0 });
  });
});

describe("computeGridPatternParams", () => {
  it("returns correct pattern size at scale 1", () => {
    const result = computeGridPatternParams(
      { offsetX: 0, offsetY: 0, scale: 1 },
      20,
    );
    expect(result.patternSize).toBe(20);
    expect(result.patternOffsetX).toBe(0);
    expect(result.patternOffsetY).toBe(0);
    expect(result.dotRadius).toBe(1);
  });

  it("scales pattern size with viewport scale", () => {
    const result = computeGridPatternParams(
      { offsetX: 0, offsetY: 0, scale: 2 },
      20,
    );
    expect(result.patternSize).toBe(40);
    expect(result.dotRadius).toBe(2);
  });

  it("computes offset modulo pattern size", () => {
    const result = computeGridPatternParams(
      { offsetX: 25, offsetY: 35, scale: 1 },
      20,
    );
    expect(result.patternOffsetX).toBe(5);
    expect(result.patternOffsetY).toBe(15);
  });

  it("clamps pattern size to minimum 1 when scale is zero", () => {
    const result = computeGridPatternParams(
      { offsetX: 0, offsetY: 0, scale: 0 },
      20,
    );
    expect(result.patternSize).toBe(1);
    expect(result.dotRadius).toBe(0.5);
  });

  it("uses default spacing when not specified", () => {
    const result = computeGridPatternParams({
      offsetX: 0,
      offsetY: 0,
      scale: 1,
    });
    expect(result.patternSize).toBe(20);
  });
});

describe("computeGridLinePatternParams", () => {
  it("returns pattern size = dotSpacing * majorGridEvery * scale", () => {
    const result = computeGridLinePatternParams(
      { offsetX: 0, offsetY: 0, scale: 1 },
      20,
      5,
    );
    // 20 * 5 * 1 = 100
    expect(result.patternSize).toBe(100);
    expect(result.patternOffsetX).toBe(0);
    expect(result.patternOffsetY).toBe(0);
  });

  it("scales pattern size with viewport scale", () => {
    const result = computeGridLinePatternParams(
      { offsetX: 0, offsetY: 0, scale: 2 },
      20,
      5,
    );
    // 20 * 5 * 2 = 200
    expect(result.patternSize).toBe(200);
  });

  it("computes offset modulo pattern size", () => {
    const result = computeGridLinePatternParams(
      { offsetX: 150, offsetY: 250, scale: 1 },
      20,
      5,
    );
    // 150 % 100 = 50, 250 % 100 = 50
    expect(result.patternOffsetX).toBe(50);
    expect(result.patternOffsetY).toBe(50);
  });

  it("clamps pattern size to minimum 1 when scale is zero", () => {
    const result = computeGridLinePatternParams(
      { offsetX: 0, offsetY: 0, scale: 0 },
      20,
      5,
    );
    expect(result.patternSize).toBe(1);
  });

  it("uses default values when not specified", () => {
    const result = computeGridLinePatternParams({
      offsetX: 0,
      offsetY: 0,
      scale: 1,
    });
    // 20 * 5 * 1 = 100
    expect(result.patternSize).toBe(100);
  });

  it("handles different majorGridEvery values", () => {
    const result = computeGridLinePatternParams(
      { offsetX: 0, offsetY: 0, scale: 1 },
      20,
      10,
    );
    // 20 * 10 * 1 = 200
    expect(result.patternSize).toBe(200);
  });
});
