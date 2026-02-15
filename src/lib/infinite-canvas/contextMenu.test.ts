import { describe, expect, it } from "vitest";
import {
  CONTEXT_MENU_CLOSED,
  clampMenuPosition,
  closeContextMenu,
  openContextMenu,
} from "./contextMenu";

describe("openContextMenu", () => {
  it("returns open state with screen position", () => {
    const state = openContextMenu(100, 200);
    expect(state).toEqual({
      open: true,
      screenPosition: { x: 100, y: 200 },
    });
  });
});

describe("closeContextMenu", () => {
  it("returns the closed singleton", () => {
    const state = closeContextMenu();
    expect(state).toBe(CONTEXT_MENU_CLOSED);
    expect(state).toEqual({ open: false });
  });
});

describe("CONTEXT_MENU_CLOSED", () => {
  it("has open: false", () => {
    expect(CONTEXT_MENU_CLOSED.open).toBe(false);
  });
});

describe("clampMenuPosition", () => {
  it("returns position as-is when menu fits within viewport", () => {
    const result = clampMenuPosition({ x: 50, y: 50 }, 100, 80, 800, 600);
    expect(result).toEqual({ x: 50, y: 50 });
  });

  it("clamps x when menu overflows right edge", () => {
    const result = clampMenuPosition({ x: 750, y: 50 }, 100, 80, 800, 600);
    expect(result).toEqual({ x: 700, y: 50 });
  });

  it("clamps y when menu overflows bottom edge", () => {
    const result = clampMenuPosition({ x: 50, y: 550 }, 100, 80, 800, 600);
    expect(result).toEqual({ x: 50, y: 520 });
  });

  it("clamps both x and y when needed", () => {
    const result = clampMenuPosition({ x: 780, y: 580 }, 100, 80, 800, 600);
    expect(result).toEqual({ x: 700, y: 520 });
  });

  it("clamps negative x to 0", () => {
    const result = clampMenuPosition({ x: -10, y: 50 }, 100, 80, 800, 600);
    expect(result).toEqual({ x: 0, y: 50 });
  });

  it("clamps negative y to 0", () => {
    const result = clampMenuPosition({ x: 50, y: -20 }, 100, 80, 800, 600);
    expect(result).toEqual({ x: 50, y: 0 });
  });

  it("handles menu larger than viewport", () => {
    const result = clampMenuPosition({ x: 50, y: 50 }, 1000, 800, 800, 600);
    // x: min(50, 800-1000) = min(50, -200) = -200 → max(0, -200) = 0
    // y: min(50, 600-800) = min(50, -200) = -200 → max(0, -200) = 0
    expect(result).toEqual({ x: 0, y: 0 });
  });
});
