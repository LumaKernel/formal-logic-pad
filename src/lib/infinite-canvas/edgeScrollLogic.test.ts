import { describe, it, expect } from "vitest";
import {
  computeEdgePenetration,
  computeEdgeScrollDelta,
  computeEdgeScrollDirection,
  applyEdgeScrollDelta,
  isEdgeScrollIdle,
  computePerEdgePenetration,
  isEdgePenetrationIdle,
  DEFAULT_EDGE_SCROLL_CONFIG,
  ZERO_DELTA,
  ZERO_PENETRATION,
} from "./edgeScrollLogic";
import type { EdgeScrollConfig } from "./edgeScrollLogic";

describe("computeEdgePenetration", () => {
  it("returns 0 when cursor is in the center", () => {
    expect(computeEdgePenetration(200, 400, 40)).toBe(0);
  });

  it("returns 0 at exactly the threshold boundary (start)", () => {
    expect(computeEdgePenetration(40, 400, 40)).toBe(0);
  });

  it("returns 0 at exactly the threshold boundary (end)", () => {
    expect(computeEdgePenetration(360, 400, 40)).toBe(0);
  });

  it("returns positive when cursor is inside start edge zone", () => {
    const result = computeEdgePenetration(20, 400, 40);
    expect(result).toBe(0.5); // 20px into a 40px zone
  });

  it("returns 1 at the very start edge", () => {
    expect(computeEdgePenetration(0, 400, 40)).toBe(1);
  });

  it("returns positive when cursor is inside end edge zone", () => {
    const result = computeEdgePenetration(380, 400, 40);
    expect(result).toBe(0.5); // 20px into a 40px zone
  });

  it("returns 1 at the very end edge", () => {
    expect(computeEdgePenetration(400, 400, 40)).toBe(1);
  });

  it("clamps to 1 when cursor is beyond the container edge", () => {
    expect(computeEdgePenetration(-10, 400, 40)).toBe(1);
    expect(computeEdgePenetration(410, 400, 40)).toBe(1);
  });

  it("returns 0 for zero threshold", () => {
    expect(computeEdgePenetration(0, 400, 0)).toBe(0);
  });

  it("returns 0 for zero container length", () => {
    expect(computeEdgePenetration(0, 0, 40)).toBe(0);
  });
});

describe("computeEdgeScrollDirection", () => {
  it("returns 0 when cursor is in the center", () => {
    expect(computeEdgeScrollDirection(200, 400, 40)).toBe(0);
  });

  it("returns 1 (positive pan) when near start edge", () => {
    expect(computeEdgeScrollDirection(10, 400, 40)).toBe(1);
  });

  it("returns -1 (negative pan) when near end edge", () => {
    expect(computeEdgeScrollDirection(390, 400, 40)).toBe(-1);
  });

  it("returns 0 when exactly at threshold boundary", () => {
    expect(computeEdgeScrollDirection(40, 400, 40)).toBe(0);
    expect(computeEdgeScrollDirection(360, 400, 40)).toBe(0);
  });

  it("returns 0 for zero threshold", () => {
    expect(computeEdgeScrollDirection(0, 400, 0)).toBe(0);
  });

  it("returns 0 for zero container length", () => {
    expect(computeEdgeScrollDirection(0, 0, 40)).toBe(0);
  });
});

describe("computeEdgeScrollDelta", () => {
  const config: EdgeScrollConfig = { threshold: 40, maxSpeed: 800 };

  it("returns zero delta when cursor is in the center", () => {
    const delta = computeEdgeScrollDelta(
      { x: 400, y: 300 },
      { width: 800, height: 600 },
      config,
    );
    expect(delta.dx).toBe(0);
    expect(delta.dy).toBe(0);
  });

  it("returns positive dx when cursor is near left edge", () => {
    const delta = computeEdgeScrollDelta(
      { x: 0, y: 300 },
      { width: 800, height: 600 },
      config,
    );
    expect(delta.dx).toBeGreaterThan(0); // pan right to reveal left content
    expect(delta.dy).toBe(0);
  });

  it("returns negative dx when cursor is near right edge", () => {
    const delta = computeEdgeScrollDelta(
      { x: 800, y: 300 },
      { width: 800, height: 600 },
      config,
    );
    expect(delta.dx).toBeLessThan(0); // pan left to reveal right content
    expect(delta.dy).toBe(0);
  });

  it("returns positive dy when cursor is near top edge", () => {
    const delta = computeEdgeScrollDelta(
      { x: 400, y: 0 },
      { width: 800, height: 600 },
      config,
    );
    expect(delta.dx).toBe(0);
    expect(delta.dy).toBeGreaterThan(0); // pan down to reveal top content
  });

  it("returns negative dy when cursor is near bottom edge", () => {
    const delta = computeEdgeScrollDelta(
      { x: 400, y: 600 },
      { width: 800, height: 600 },
      config,
    );
    expect(delta.dx).toBe(0);
    expect(delta.dy).toBeLessThan(0);
  });

  it("applies quadratic easing (deeper = faster)", () => {
    const halfPenetration = computeEdgeScrollDelta(
      { x: 20, y: 300 },
      { width: 800, height: 600 },
      config,
    );
    const fullPenetration = computeEdgeScrollDelta(
      { x: 0, y: 300 },
      { width: 800, height: 600 },
      config,
    );
    // At half penetration (0.5^2 = 0.25), speed = 200
    expect(halfPenetration.dx).toBe(0.25 * 800);
    // At full penetration (1^2 = 1), speed = 800
    expect(fullPenetration.dx).toBe(800);
  });

  it("handles diagonal (corner) case", () => {
    const delta = computeEdgeScrollDelta(
      { x: 0, y: 0 },
      { width: 800, height: 600 },
      config,
    );
    expect(delta.dx).toBeGreaterThan(0);
    expect(delta.dy).toBeGreaterThan(0);
  });
});

describe("applyEdgeScrollDelta", () => {
  it("applies delta proportional to elapsed time", () => {
    const result = applyEdgeScrollDelta(100, 200, { dx: -400, dy: 600 }, 0.016);
    expect(result.offsetX).toBeCloseTo(100 + -400 * 0.016);
    expect(result.offsetY).toBeCloseTo(200 + 600 * 0.016);
  });

  it("does not change offset when delta is zero", () => {
    const result = applyEdgeScrollDelta(100, 200, ZERO_DELTA, 0.016);
    expect(result.offsetX).toBe(100);
    expect(result.offsetY).toBe(200);
  });

  it("does not change offset when elapsed time is zero", () => {
    const result = applyEdgeScrollDelta(100, 200, { dx: -400, dy: 600 }, 0);
    expect(result.offsetX).toBe(100);
    expect(result.offsetY).toBe(200);
  });
});

describe("isEdgeScrollIdle", () => {
  it("returns true for zero delta", () => {
    expect(isEdgeScrollIdle(ZERO_DELTA)).toBe(true);
    expect(isEdgeScrollIdle({ dx: 0, dy: 0 })).toBe(true);
  });

  it("returns false when dx is non-zero", () => {
    expect(isEdgeScrollIdle({ dx: 1, dy: 0 })).toBe(false);
  });

  it("returns false when dy is non-zero", () => {
    expect(isEdgeScrollIdle({ dx: 0, dy: -1 })).toBe(false);
  });
});

describe("DEFAULT_EDGE_SCROLL_CONFIG", () => {
  it("has sensible defaults", () => {
    expect(DEFAULT_EDGE_SCROLL_CONFIG.threshold).toBeGreaterThan(0);
    expect(DEFAULT_EDGE_SCROLL_CONFIG.maxSpeed).toBeGreaterThan(0);
  });
});

describe("computePerEdgePenetration", () => {
  const config: EdgeScrollConfig = { threshold: 40, maxSpeed: 800 };
  const size = { width: 800, height: 600 };

  it("returns zero penetration when cursor is in center", () => {
    const result = computePerEdgePenetration({ x: 400, y: 300 }, size, config);
    expect(result).toEqual(ZERO_PENETRATION);
  });

  it("returns left penetration when cursor is near left edge", () => {
    const result = computePerEdgePenetration({ x: 20, y: 300 }, size, config);
    expect(result.left).toBe(0.5);
    expect(result.right).toBe(0);
    expect(result.top).toBe(0);
    expect(result.bottom).toBe(0);
  });

  it("returns right penetration when cursor is near right edge", () => {
    const result = computePerEdgePenetration({ x: 780, y: 300 }, size, config);
    expect(result.left).toBe(0);
    expect(result.right).toBe(0.5);
    expect(result.top).toBe(0);
    expect(result.bottom).toBe(0);
  });

  it("returns top penetration when cursor is near top edge", () => {
    const result = computePerEdgePenetration({ x: 400, y: 10 }, size, config);
    expect(result.left).toBe(0);
    expect(result.right).toBe(0);
    expect(result.top).toBe(0.75);
    expect(result.bottom).toBe(0);
  });

  it("returns bottom penetration when cursor is near bottom edge", () => {
    const result = computePerEdgePenetration({ x: 400, y: 590 }, size, config);
    expect(result.left).toBe(0);
    expect(result.right).toBe(0);
    expect(result.top).toBe(0);
    expect(result.bottom).toBe(0.75);
  });

  it("returns corner penetration (left + top)", () => {
    const result = computePerEdgePenetration({ x: 0, y: 0 }, size, config);
    expect(result.left).toBe(1);
    expect(result.right).toBe(0);
    expect(result.top).toBe(1);
    expect(result.bottom).toBe(0);
  });

  it("returns corner penetration (right + bottom)", () => {
    const result = computePerEdgePenetration({ x: 800, y: 600 }, size, config);
    expect(result.left).toBe(0);
    expect(result.right).toBe(1);
    expect(result.top).toBe(0);
    expect(result.bottom).toBe(1);
  });

  it("clamps to 1 when cursor is beyond container", () => {
    const result = computePerEdgePenetration({ x: -10, y: -10 }, size, config);
    expect(result.left).toBe(1);
    expect(result.top).toBe(1);
  });

  it("returns zero for invalid config", () => {
    expect(
      computePerEdgePenetration({ x: 0, y: 0 }, size, {
        threshold: 0,
        maxSpeed: 800,
      }),
    ).toEqual(ZERO_PENETRATION);
    expect(
      computePerEdgePenetration(
        { x: 0, y: 0 },
        { width: 0, height: 600 },
        config,
      ),
    ).toEqual(ZERO_PENETRATION);
    expect(
      computePerEdgePenetration(
        { x: 0, y: 0 },
        { width: 800, height: 0 },
        config,
      ),
    ).toEqual(ZERO_PENETRATION);
  });
});

describe("isEdgePenetrationIdle", () => {
  it("returns true for zero penetration", () => {
    expect(isEdgePenetrationIdle(ZERO_PENETRATION)).toBe(true);
  });

  it("returns false when left is non-zero", () => {
    expect(
      isEdgePenetrationIdle({ left: 0.5, right: 0, top: 0, bottom: 0 }),
    ).toBe(false);
  });

  it("returns false when right is non-zero", () => {
    expect(
      isEdgePenetrationIdle({ left: 0, right: 0.5, top: 0, bottom: 0 }),
    ).toBe(false);
  });

  it("returns false when top is non-zero", () => {
    expect(
      isEdgePenetrationIdle({ left: 0, right: 0, top: 0.5, bottom: 0 }),
    ).toBe(false);
  });

  it("returns false when bottom is non-zero", () => {
    expect(
      isEdgePenetrationIdle({ left: 0, right: 0, top: 0, bottom: 0.5 }),
    ).toBe(false);
  });
});
