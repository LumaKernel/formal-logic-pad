import { describe, expect, it } from "vitest";
import { applyDragDelta } from "./drag";

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
