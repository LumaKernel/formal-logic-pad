import { describe, expect, it } from "vitest";
import { screenToWorld, worldToScreen } from "./coordinate";

describe("worldToScreen", () => {
  it("returns world point at origin with identity viewport", () => {
    const result = worldToScreen(
      { offsetX: 0, offsetY: 0, scale: 1 },
      { x: 0, y: 0 },
    );
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it("scales world coordinates by viewport scale", () => {
    const result = worldToScreen(
      { offsetX: 0, offsetY: 0, scale: 2 },
      { x: 50, y: 100 },
    );
    expect(result).toEqual({ x: 100, y: 200 });
  });

  it("applies viewport offset", () => {
    const result = worldToScreen(
      { offsetX: 30, offsetY: -20, scale: 1 },
      { x: 10, y: 10 },
    );
    expect(result).toEqual({ x: 40, y: -10 });
  });

  it("combines scale and offset", () => {
    const result = worldToScreen(
      { offsetX: 100, offsetY: 50, scale: 0.5 },
      { x: 200, y: 100 },
    );
    expect(result).toEqual({ x: 200, y: 100 });
  });

  it("handles negative world coordinates", () => {
    const result = worldToScreen(
      { offsetX: 0, offsetY: 0, scale: 1 },
      { x: -50, y: -30 },
    );
    expect(result).toEqual({ x: -50, y: -30 });
  });
});

describe("screenToWorld", () => {
  it("returns screen point at origin with identity viewport", () => {
    const result = screenToWorld(
      { offsetX: 0, offsetY: 0, scale: 1 },
      { x: 0, y: 0 },
    );
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it("divides screen coordinates by viewport scale", () => {
    const result = screenToWorld(
      { offsetX: 0, offsetY: 0, scale: 2 },
      { x: 100, y: 200 },
    );
    expect(result).toEqual({ x: 50, y: 100 });
  });

  it("subtracts viewport offset before dividing by scale", () => {
    const result = screenToWorld(
      { offsetX: 30, offsetY: -20, scale: 1 },
      { x: 40, y: -10 },
    );
    expect(result).toEqual({ x: 10, y: 10 });
  });

  it("combines scale and offset", () => {
    const result = screenToWorld(
      { offsetX: 100, offsetY: 50, scale: 0.5 },
      { x: 200, y: 100 },
    );
    expect(result).toEqual({ x: 200, y: 100 });
  });

  it("handles negative screen coordinates", () => {
    const result = screenToWorld(
      { offsetX: 0, offsetY: 0, scale: 1 },
      { x: -50, y: -30 },
    );
    expect(result).toEqual({ x: -50, y: -30 });
  });

  it("is inverse of worldToScreen", () => {
    const viewport = { offsetX: 30, offsetY: 60, scale: 1.5 };
    const worldPoint = { x: 100, y: 200 };
    const screen = worldToScreen(viewport, worldPoint);
    const result = screenToWorld(viewport, screen);
    expect(result.x).toBeCloseTo(worldPoint.x);
    expect(result.y).toBeCloseTo(worldPoint.y);
  });
});
