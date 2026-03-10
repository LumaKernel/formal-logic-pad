import { describe, expect, it } from "vitest";
import {
  DEFERRED_SNAP_DURATION_MS,
  DEFERRED_SNAP_MIN_DISTANCE,
  easeOutCubic,
  interpolatePosition,
  isSnapAnimationNeeded,
} from "./deferredSnap";

describe("easeOutCubic", () => {
  it("returns 0 at t=0", () => {
    expect(easeOutCubic(0)).toBe(0);
  });

  it("returns 1 at t=1", () => {
    expect(easeOutCubic(1)).toBe(1);
  });

  it("returns 0.5 at approximately t=0.2063", () => {
    // 1 - (1-t)^3 = 0.5 → (1-t)^3 = 0.5 → t ≈ 0.2063
    const t = 1 - Math.cbrt(0.5);
    expect(easeOutCubic(t)).toBeCloseTo(0.5, 10);
  });

  it("is monotonically increasing", () => {
    const steps = 100;
    let prev = easeOutCubic(0);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const current = easeOutCubic(t);
      expect(current).toBeGreaterThanOrEqual(prev);
      prev = current;
    }
  });

  it("decelerates (second half progress > first half)", () => {
    const firstHalf = easeOutCubic(0.5);
    // At t=0.5, easeOutCubic = 1 - 0.5^3 = 1 - 0.125 = 0.875
    // The first half covers 87.5% of the distance
    expect(firstHalf).toBeGreaterThan(0.5);
    expect(firstHalf).toBeCloseTo(0.875, 10);
  });

  it("handles t=0.25", () => {
    // 1 - (0.75)^3 = 1 - 0.421875 = 0.578125
    expect(easeOutCubic(0.25)).toBeCloseTo(0.578125, 10);
  });
});

describe("interpolatePosition", () => {
  it("returns 'from' at t=0", () => {
    const from = { x: 10, y: 20 };
    const to = { x: 100, y: 200 };
    expect(interpolatePosition(from, to, 0)).toEqual({ x: 10, y: 20 });
  });

  it("returns 'to' at t=1", () => {
    const from = { x: 10, y: 20 };
    const to = { x: 100, y: 200 };
    expect(interpolatePosition(from, to, 1)).toEqual({ x: 100, y: 200 });
  });

  it("returns midpoint at t=0.5", () => {
    const from = { x: 0, y: 0 };
    const to = { x: 100, y: 200 };
    expect(interpolatePosition(from, to, 0.5)).toEqual({ x: 50, y: 100 });
  });

  it("returns 25% interpolation at t=0.25", () => {
    const from = { x: 0, y: 0 };
    const to = { x: 100, y: 200 };
    expect(interpolatePosition(from, to, 0.25)).toEqual({ x: 25, y: 50 });
  });

  it("handles negative coordinates", () => {
    const from = { x: -100, y: -200 };
    const to = { x: 100, y: 200 };
    expect(interpolatePosition(from, to, 0.5)).toEqual({ x: 0, y: 0 });
  });

  it("works when from equals to", () => {
    const point = { x: 42, y: 73 };
    expect(interpolatePosition(point, point, 0.5)).toEqual({ x: 42, y: 73 });
  });
});

describe("isSnapAnimationNeeded", () => {
  it("returns false when points are identical", () => {
    const p = { x: 10, y: 20 };
    expect(isSnapAnimationNeeded(p, p, DEFERRED_SNAP_MIN_DISTANCE)).toBe(false);
  });

  it("returns false when distance is below threshold", () => {
    const from = { x: 10, y: 20 };
    const to = { x: 10.1, y: 20.1 };
    expect(isSnapAnimationNeeded(from, to, DEFERRED_SNAP_MIN_DISTANCE)).toBe(
      false,
    );
  });

  it("returns true when distance exceeds threshold", () => {
    const from = { x: 10, y: 20 };
    const to = { x: 15, y: 25 };
    expect(isSnapAnimationNeeded(from, to, DEFERRED_SNAP_MIN_DISTANCE)).toBe(
      true,
    );
  });

  it("respects custom minDistance", () => {
    const from = { x: 0, y: 0 };
    const to = { x: 3, y: 4 }; // distance = 5
    expect(isSnapAnimationNeeded(from, to, 10)).toBe(false);
    expect(isSnapAnimationNeeded(from, to, 4)).toBe(true);
  });

  it("uses DEFERRED_SNAP_MIN_DISTANCE constant correctly", () => {
    const from = { x: 0, y: 0 };
    // Just above the default threshold
    const d = DEFERRED_SNAP_MIN_DISTANCE + 0.1;
    const to = { x: d, y: 0 };
    expect(isSnapAnimationNeeded(from, to, DEFERRED_SNAP_MIN_DISTANCE)).toBe(
      true,
    );
  });
});

describe("constants", () => {
  it("DEFERRED_SNAP_DURATION_MS is reasonable", () => {
    expect(DEFERRED_SNAP_DURATION_MS).toBeGreaterThan(0);
    expect(DEFERRED_SNAP_DURATION_MS).toBeLessThanOrEqual(500);
  });

  it("DEFERRED_SNAP_MIN_DISTANCE is reasonable", () => {
    expect(DEFERRED_SNAP_MIN_DISTANCE).toBeGreaterThan(0);
    expect(DEFERRED_SNAP_MIN_DISTANCE).toBeLessThanOrEqual(5);
  });
});
