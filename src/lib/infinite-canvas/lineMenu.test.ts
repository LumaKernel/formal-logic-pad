import { describe, expect, it } from "vitest";
import { closeLineMenu, LINE_MENU_CLOSED, openLineMenu } from "./lineMenu";

describe("LINE_MENU_CLOSED", () => {
  it("has open: false", () => {
    expect(LINE_MENU_CLOSED).toEqual({ open: false });
  });
});

describe("openLineMenu", () => {
  it("returns an open state with the given connectionId and screen position", () => {
    const state = openLineMenu("conn-1", 100, 200);
    expect(state).toEqual({
      open: true,
      connectionId: "conn-1",
      screenPosition: { x: 100, y: 200 },
    });
  });

  it("creates distinct objects for different calls", () => {
    const a = openLineMenu("a", 0, 0);
    const b = openLineMenu("b", 10, 20);
    expect(a).not.toBe(b);
    expect(a.open && a.connectionId).toBe("a");
    expect(b.open && b.connectionId).toBe("b");
  });
});

describe("closeLineMenu", () => {
  it("returns the singleton closed state", () => {
    expect(closeLineMenu()).toBe(LINE_MENU_CLOSED);
  });
});
