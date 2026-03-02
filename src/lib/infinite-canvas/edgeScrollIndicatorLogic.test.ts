import { describe, it, expect } from "vitest";
import { computeEdgeScrollShadow } from "./edgeScrollIndicatorLogic";
import { ZERO_PENETRATION } from "./edgeScrollLogic";

describe("computeEdgeScrollShadow", () => {
  it("returns not visible when penetration is null", () => {
    const result = computeEdgeScrollShadow(null);
    expect(result.visible).toBe(false);
    expect(result.boxShadow).toBe("none");
  });

  it("returns not visible when all penetrations are zero", () => {
    const result = computeEdgeScrollShadow(ZERO_PENETRATION);
    expect(result.visible).toBe(false);
    expect(result.boxShadow).toBe("none");
  });

  it("returns left shadow when left penetration is active", () => {
    const result = computeEdgeScrollShadow({
      left: 0.5,
      right: 0,
      top: 0,
      bottom: 0,
    });
    expect(result.visible).toBe(true);
    expect(result.boxShadow).toContain("inset");
    expect(result.boxShadow).not.toContain("-12px");
    // Left shadow: positive x offset
    expect(result.boxShadow).toMatch(/inset 12px 0/);
  });

  it("returns right shadow when right penetration is active", () => {
    const result = computeEdgeScrollShadow({
      left: 0,
      right: 0.5,
      top: 0,
      bottom: 0,
    });
    expect(result.visible).toBe(true);
    expect(result.boxShadow).toMatch(/inset -12px 0/);
  });

  it("returns top shadow when top penetration is active", () => {
    const result = computeEdgeScrollShadow({
      left: 0,
      right: 0,
      top: 0.5,
      bottom: 0,
    });
    expect(result.visible).toBe(true);
    expect(result.boxShadow).toMatch(/inset 0 12px/);
  });

  it("returns bottom shadow when bottom penetration is active", () => {
    const result = computeEdgeScrollShadow({
      left: 0,
      right: 0,
      top: 0,
      bottom: 0.5,
    });
    expect(result.visible).toBe(true);
    expect(result.boxShadow).toMatch(/inset 0 -12px/);
  });

  it("combines multiple shadows for corner case", () => {
    const result = computeEdgeScrollShadow({
      left: 1,
      right: 0,
      top: 1,
      bottom: 0,
    });
    expect(result.visible).toBe(true);
    // Should contain both left and top shadows (two "inset" occurrences)
    const insetCount = (result.boxShadow.match(/inset/g) ?? []).length;
    expect(insetCount).toBe(2);
  });

  it("shadow intensity scales with penetration", () => {
    const half = computeEdgeScrollShadow({
      left: 0.5,
      right: 0,
      top: 0,
      bottom: 0,
    });
    const full = computeEdgeScrollShadow({
      left: 1,
      right: 0,
      top: 0,
      bottom: 0,
    });
    // Full penetration: 24px spread, half: 12px spread
    expect(full.boxShadow).toMatch(/inset 24px/);
    expect(half.boxShadow).toMatch(/inset 12px/);
  });

  it("respects custom color parameter", () => {
    const result = computeEdgeScrollShadow(
      { left: 1, right: 0, top: 0, bottom: 0 },
      "255, 0, 0",
    );
    expect(result.boxShadow).toContain("rgba(255, 0, 0,");
  });

  it("respects custom maxSpread parameter", () => {
    const result = computeEdgeScrollShadow(
      { left: 1, right: 0, top: 0, bottom: 0 },
      "100, 149, 237",
      48,
    );
    expect(result.boxShadow).toMatch(/inset 48px/);
  });

  it("respects custom maxOpacity parameter", () => {
    const result = computeEdgeScrollShadow(
      { left: 1, right: 0, top: 0, bottom: 0 },
      "100, 149, 237",
      24,
      0.8,
    );
    expect(result.boxShadow).toContain("0.8)");
  });
});
