import { describe, it, expect } from "vitest";
import {
  classifyKeyDown,
  classifyKeyUp,
  computeArrowPanDelta,
  PAN_STEP,
  PAN_STEP_LARGE,
} from "./keyboardShortcuts";
import type { KeyEventInput } from "./keyboardShortcuts";
import type { Size, ViewportState } from "./types";

const DEFAULT_VIEWPORT: ViewportState = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
};

const CONTAINER_SIZE: Size = { width: 800, height: 600 };

function makeKeyEvent(overrides: Partial<KeyEventInput> = {}): KeyEventInput {
  return {
    key: "",
    code: "",
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    repeat: false,
    ...overrides,
  };
}

describe("computeArrowPanDelta", () => {
  it("ArrowUpで上にパン（正のy）", () => {
    const delta = computeArrowPanDelta("ArrowUp", false);
    expect(delta).toEqual({ x: 0, y: PAN_STEP });
  });

  it("ArrowDownで下にパン（負のy）", () => {
    const delta = computeArrowPanDelta("ArrowDown", false);
    expect(delta).toEqual({ x: 0, y: -PAN_STEP });
  });

  it("ArrowLeftで左にパン（正のx）", () => {
    const delta = computeArrowPanDelta("ArrowLeft", false);
    expect(delta).toEqual({ x: PAN_STEP, y: 0 });
  });

  it("ArrowRightで右にパン（負のx）", () => {
    const delta = computeArrowPanDelta("ArrowRight", false);
    expect(delta).toEqual({ x: -PAN_STEP, y: 0 });
  });

  it("Shift+ArrowUpで大きなステップ", () => {
    const delta = computeArrowPanDelta("ArrowUp", true);
    expect(delta).toEqual({ x: 0, y: PAN_STEP_LARGE });
  });

  it("Shift+ArrowDownで大きなステップ", () => {
    const delta = computeArrowPanDelta("ArrowDown", true);
    expect(delta).toEqual({ x: 0, y: -PAN_STEP_LARGE });
  });

  it("Shift+ArrowLeftで大きなステップ", () => {
    const delta = computeArrowPanDelta("ArrowLeft", true);
    expect(delta).toEqual({ x: PAN_STEP_LARGE, y: 0 });
  });

  it("Shift+ArrowRightで大きなステップ", () => {
    const delta = computeArrowPanDelta("ArrowRight", true);
    expect(delta).toEqual({ x: -PAN_STEP_LARGE, y: 0 });
  });

  it("矢印キー以外ではnull", () => {
    expect(computeArrowPanDelta("a", false)).toBe(null);
    expect(computeArrowPanDelta("Enter", false)).toBe(null);
    expect(computeArrowPanDelta(" ", false)).toBe(null);
  });
});

describe("classifyKeyDown", () => {
  describe("Delete/Backspace", () => {
    it("Delete で選択アイテム削除", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "Delete" }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        true,
      );
      expect(action).toEqual({ type: "delete-selected" });
    });

    it("Backspace で選択アイテム削除", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "Backspace" }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        true,
      );
      expect(action).toEqual({ type: "delete-selected" });
    });

    it("選択なしでは Delete は none", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "Delete" }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({ type: "none" });
    });

    it("Ctrl+Delete は none（修飾キー付き）", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "Delete", ctrlKey: true }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        true,
      );
      expect(action).toEqual({ type: "none" });
    });

    it("Cmd+Backspace は none（修飾キー付き）", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "Backspace", metaKey: true }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        true,
      );
      expect(action).toEqual({ type: "none" });
    });
  });

  describe("矢印キーでパン", () => {
    it("ArrowUp でビューポートが上にパン", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "ArrowUp" }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({
        type: "pan",
        viewport: { offsetX: 0, offsetY: PAN_STEP, scale: 1 },
      });
    });

    it("ArrowDown でビューポートが下にパン", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "ArrowDown" }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({
        type: "pan",
        viewport: { offsetX: 0, offsetY: -PAN_STEP, scale: 1 },
      });
    });

    it("ArrowLeft でビューポートが左にパン", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "ArrowLeft" }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({
        type: "pan",
        viewport: { offsetX: PAN_STEP, offsetY: 0, scale: 1 },
      });
    });

    it("ArrowRight でビューポートが右にパン", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "ArrowRight" }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({
        type: "pan",
        viewport: { offsetX: -PAN_STEP, offsetY: 0, scale: 1 },
      });
    });

    it("Shift+ArrowUp で大きなステップ", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "ArrowUp", shiftKey: true }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({
        type: "pan",
        viewport: { offsetX: 0, offsetY: PAN_STEP_LARGE, scale: 1 },
      });
    });

    it("既存のオフセットに加算される", () => {
      const viewport: ViewportState = { offsetX: 100, offsetY: 200, scale: 2 };
      const action = classifyKeyDown(
        makeKeyEvent({ key: "ArrowUp" }),
        viewport,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({
        type: "pan",
        viewport: { offsetX: 100, offsetY: 200 + PAN_STEP, scale: 2 },
      });
    });

    it("Ctrl+ArrowUp は none（修飾キー付き）", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "ArrowUp", ctrlKey: true }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({ type: "none" });
    });
  });

  describe("ズーム", () => {
    it("Ctrl + '+' でズームイン", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "+", ctrlKey: true }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action.type).toBe("zoom-in");
      if (action.type === "zoom-in") {
        expect(action.viewport.scale).toBeGreaterThan(1);
      }
    });

    it("Ctrl + '=' でズームイン（USキーボード）", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "=", ctrlKey: true }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action.type).toBe("zoom-in");
    });

    it("Meta + '+' でズームイン（macOS）", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "+", metaKey: true }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action.type).toBe("zoom-in");
    });

    it("Ctrl + '-' でズームアウト", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "-", ctrlKey: true }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action.type).toBe("zoom-out");
      if (action.type === "zoom-out") {
        expect(action.viewport.scale).toBeLessThan(1);
      }
    });

    it("Meta + '-' でズームアウト（macOS）", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "-", metaKey: true }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action.type).toBe("zoom-out");
    });

    it("ズームはコンテナ中心を基準に行われる", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "+", ctrlKey: true }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      // ビューポート原点(0,0)でscale=1、コンテナ中心(400,300)でズームイン
      // 中心固定なのでoffsetが変わる
      if (action.type === "zoom-in") {
        expect(action.viewport.offsetX).not.toBe(0);
        expect(action.viewport.offsetY).not.toBe(0);
      }
    });

    it("修飾キーなしの '+' は none", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "+" }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({ type: "none" });
    });

    it("修飾キーなしの '-' は none", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "-" }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({ type: "none" });
    });
  });

  describe("Shift+2（選択範囲にズーム）", () => {
    it("Shift+Digit2 で zoom-to-selection（選択あり）", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "@", code: "Digit2", shiftKey: true }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        true,
      );
      expect(action).toEqual({ type: "zoom-to-selection" });
    });

    it("選択なしでは none", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "@", code: "Digit2", shiftKey: true }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({ type: "none" });
    });

    it("Ctrl+Shift+2 は none（修飾キー付き）", () => {
      const action = classifyKeyDown(
        makeKeyEvent({
          key: "@",
          code: "Digit2",
          shiftKey: true,
          ctrlKey: true,
        }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        true,
      );
      expect(action).toEqual({ type: "none" });
    });

    it("Shift なしの Digit2 は none", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "2", code: "Digit2" }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        true,
      );
      expect(action).toEqual({ type: "none" });
    });
  });

  describe("Ctrl/Cmd+F（検索）", () => {
    it("Ctrl+F で open-search", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "f", ctrlKey: true }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({ type: "open-search" });
    });

    it("Meta+F で open-search（macOS）", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "f", metaKey: true }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({ type: "open-search" });
    });

    it("大文字 F でも open-search", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "F", ctrlKey: true }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({ type: "open-search" });
    });

    it("Ctrl+Shift+F は none（Shiftあり）", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "f", ctrlKey: true, shiftKey: true }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({ type: "none" });
    });

    it("修飾キーなしの f は none", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "f" }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({ type: "none" });
    });
  });

  describe("/キー（コマンドパレット）", () => {
    it("/ で open-command-palette", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "/" }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({ type: "open-command-palette" });
    });

    it("/ リピートでは none", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "/", repeat: true }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({ type: "none" });
    });

    it("Ctrl+/ は none", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "/", ctrlKey: true }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({ type: "none" });
    });

    it("Shift+/ は none", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "/", shiftKey: true }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({ type: "none" });
    });
  });

  describe("スペースキー（パンモード）", () => {
    it("Space で enter-space-pan", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: " " }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({ type: "enter-space-pan" });
    });

    it("Space リピートでは none", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: " ", repeat: true }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({ type: "none" });
    });

    it("Ctrl+Space は none", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: " ", ctrlKey: true }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({ type: "none" });
    });
  });

  describe("無関係なキー", () => {
    it("'a' は none", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "a" }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({ type: "none" });
    });

    it("Enter は none", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "Enter" }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({ type: "none" });
    });

    it("Tab は none", () => {
      const action = classifyKeyDown(
        makeKeyEvent({ key: "Tab" }),
        DEFAULT_VIEWPORT,
        CONTAINER_SIZE,
        false,
      );
      expect(action).toEqual({ type: "none" });
    });
  });
});

describe("classifyKeyUp", () => {
  it("Space で exit-space-pan", () => {
    const action = classifyKeyUp(makeKeyEvent({ key: " " }));
    expect(action).toEqual({ type: "exit-space-pan" });
  });

  it("他のキーは none", () => {
    expect(classifyKeyUp(makeKeyEvent({ key: "a" }))).toEqual({ type: "none" });
    expect(classifyKeyUp(makeKeyEvent({ key: "Delete" }))).toEqual({
      type: "none",
    });
    expect(classifyKeyUp(makeKeyEvent({ key: "ArrowUp" }))).toEqual({
      type: "none",
    });
  });
});
