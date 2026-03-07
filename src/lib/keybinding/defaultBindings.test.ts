import { describe, it, expect } from "vitest";
import { DEFAULT_CANVAS_BINDINGS, type CanvasAction } from "./defaultBindings";
import {
  INITIAL_CHORD_STATE,
  processKeyEvent,
  type KeyEventData,
} from "./keybinding";

function makeEvent(overrides: Partial<KeyEventData> = {}): KeyEventData {
  return {
    key: "",
    code: "",
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    repeat: false,
    ...overrides,
  };
}

function matchAction(
  event: Partial<KeyEventData>,
  os: "mac" | "windows" | "linux" = "mac",
): CanvasAction | null {
  return processKeyEvent(
    makeEvent(event),
    DEFAULT_CANVAS_BINDINGS,
    os,
    INITIAL_CHORD_STATE,
    1000,
  ).action;
}

describe("DEFAULT_CANVAS_BINDINGS", () => {
  it("Delete で delete-selected", () => {
    expect(matchAction({ key: "Delete" })).toBe("delete-selected");
  });

  it("Backspace で delete-selected", () => {
    expect(matchAction({ key: "Backspace" })).toBe("delete-selected");
  });

  it("ArrowUp で pan-up", () => {
    expect(matchAction({ key: "ArrowUp" })).toBe("pan-up");
  });

  it("ArrowDown で pan-down", () => {
    expect(matchAction({ key: "ArrowDown" })).toBe("pan-down");
  });

  it("ArrowLeft で pan-left", () => {
    expect(matchAction({ key: "ArrowLeft" })).toBe("pan-left");
  });

  it("ArrowRight で pan-right", () => {
    expect(matchAction({ key: "ArrowRight" })).toBe("pan-right");
  });

  it("Shift+ArrowUp で pan-up-large", () => {
    expect(matchAction({ key: "ArrowUp", shiftKey: true })).toBe(
      "pan-up-large",
    );
  });

  it("Shift+ArrowDown で pan-down-large", () => {
    expect(matchAction({ key: "ArrowDown", shiftKey: true })).toBe(
      "pan-down-large",
    );
  });

  it("Shift+ArrowLeft で pan-left-large", () => {
    expect(matchAction({ key: "ArrowLeft", shiftKey: true })).toBe(
      "pan-left-large",
    );
  });

  it("Shift+ArrowRight で pan-right-large", () => {
    expect(matchAction({ key: "ArrowRight", shiftKey: true })).toBe(
      "pan-right-large",
    );
  });

  it("Cmd+'+' で zoom-in (macOS)", () => {
    expect(matchAction({ key: "+", metaKey: true }, "mac")).toBe("zoom-in");
  });

  it("Ctrl+'+' で zoom-in (Windows)", () => {
    expect(matchAction({ key: "+", ctrlKey: true }, "windows")).toBe("zoom-in");
  });

  it("Cmd+'=' で zoom-in (macOS, USキーボード)", () => {
    expect(matchAction({ key: "=", metaKey: true }, "mac")).toBe("zoom-in");
  });

  it("Cmd+'-' で zoom-out (macOS)", () => {
    expect(matchAction({ key: "-", metaKey: true }, "mac")).toBe("zoom-out");
  });

  it("Ctrl+'-' で zoom-out (Windows)", () => {
    expect(matchAction({ key: "-", ctrlKey: true }, "windows")).toBe(
      "zoom-out",
    );
  });

  it("Shift+Digit2 で zoom-to-selection", () => {
    expect(matchAction({ key: "@", code: "Digit2", shiftKey: true })).toBe(
      "zoom-to-selection",
    );
  });

  it("Cmd+F で open-search (macOS)", () => {
    expect(matchAction({ key: "f", metaKey: true }, "mac")).toBe("open-search");
  });

  it("Ctrl+F で open-search (Windows)", () => {
    expect(matchAction({ key: "f", ctrlKey: true }, "windows")).toBe(
      "open-search",
    );
  });

  it("/ で open-command-palette", () => {
    expect(matchAction({ key: "/" })).toBe("open-command-palette");
  });

  it("Space で enter-space-pan", () => {
    expect(matchAction({ key: " " })).toBe("enter-space-pan");
  });

  it("Cmd+Shift+L で tree-layout (macOS)", () => {
    expect(
      matchAction({ key: "l", metaKey: true, shiftKey: true }, "mac"),
    ).toBe("tree-layout");
  });

  it("Ctrl+Shift+L で tree-layout (Windows)", () => {
    expect(
      matchAction({ key: "l", ctrlKey: true, shiftKey: true }, "windows"),
    ).toBe("tree-layout");
  });

  it("無関係なキーは null", () => {
    expect(matchAction({ key: "a" })).toBe(null);
    expect(matchAction({ key: "Enter" })).toBe(null);
    expect(matchAction({ key: "Tab" })).toBe(null);
  });

  it("修飾キー付き矢印は none (Ctrl+ArrowUp)", () => {
    expect(matchAction({ key: "ArrowUp", ctrlKey: true })).toBe(null);
  });

  it("修飾キーなしの '+' は null", () => {
    expect(matchAction({ key: "+" })).toBe(null);
  });

  it("修飾キーなしの '-' は null", () => {
    expect(matchAction({ key: "-" })).toBe(null);
  });
});
