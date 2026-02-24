import { describe, expect, it } from "vitest";
import {
  computeConnectionLabelPlacement,
  computeLabelScreenPosition,
} from "./connectionLabel";
import { cubicBezierPoint } from "./connectionPath";

describe("cubicBezierPoint", () => {
  it("returns p0 at t=0", () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 10, y: 20 };
    const p2 = { x: 30, y: 20 };
    const p3 = { x: 40, y: 0 };
    const result = cubicBezierPoint(p0, p1, p2, p3, 0);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0);
  });

  it("returns p3 at t=1", () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 10, y: 20 };
    const p2 = { x: 30, y: 20 };
    const p3 = { x: 40, y: 0 };
    const result = cubicBezierPoint(p0, p1, p2, p3, 1);
    expect(result.x).toBeCloseTo(40);
    expect(result.y).toBeCloseTo(0);
  });

  it("returns midpoint at t=0.5 for a symmetric curve", () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 0, y: 100 };
    const p2 = { x: 100, y: 100 };
    const p3 = { x: 100, y: 0 };
    const result = cubicBezierPoint(p0, p1, p2, p3, 0.5);
    expect(result.x).toBeCloseTo(50);
    expect(result.y).toBeCloseTo(75);
  });

  it("computes correct midpoint for a straight line", () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 33.3, y: 0 };
    const p2 = { x: 66.6, y: 0 };
    const p3 = { x: 100, y: 0 };
    const result = cubicBezierPoint(p0, p1, p2, p3, 0.5);
    expect(result.x).toBeCloseTo(50, 0);
    expect(result.y).toBeCloseTo(0);
  });

  it("handles negative coordinates", () => {
    const p0 = { x: -100, y: -50 };
    const p1 = { x: -50, y: 50 };
    const p2 = { x: 50, y: 50 };
    const p3 = { x: 100, y: -50 };
    const result = cubicBezierPoint(p0, p1, p2, p3, 0.5);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(25);
  });
});

describe("computeConnectionLabelPlacement", () => {
  it("places label at midpoint with default offset", () => {
    const midpoint = { x: 200, y: 100 };
    const placement = computeConnectionLabelPlacement(midpoint);
    expect(placement.position).toEqual({ x: 200, y: 100 });
    expect(placement.offset).toEqual({ x: 0, y: -20 });
  });

  it("uses custom vertical offset", () => {
    const midpoint = { x: 150, y: 80 };
    const placement = computeConnectionLabelPlacement(midpoint, -30);
    expect(placement.offset).toEqual({ x: 0, y: -30 });
  });

  it("accepts positive offset (below the line)", () => {
    const midpoint = { x: 100, y: 50 };
    const placement = computeConnectionLabelPlacement(midpoint, 10);
    expect(placement.offset).toEqual({ x: 0, y: 10 });
  });
});

describe("computeLabelScreenPosition", () => {
  it("combines position and offset", () => {
    const result = computeLabelScreenPosition({
      position: { x: 200, y: 100 },
      offset: { x: 0, y: -20 },
    });
    expect(result).toEqual({ x: 200, y: 80 });
  });

  it("handles both x and y offsets", () => {
    const result = computeLabelScreenPosition({
      position: { x: 150, y: 75 },
      offset: { x: 10, y: -15 },
    });
    expect(result).toEqual({ x: 160, y: 60 });
  });

  it("handles zero offset", () => {
    const result = computeLabelScreenPosition({
      position: { x: 100, y: 50 },
      offset: { x: 0, y: 0 },
    });
    expect(result).toEqual({ x: 100, y: 50 });
  });
});
