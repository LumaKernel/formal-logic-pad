import { describe, it, expect } from "vitest";
import {
  computeInitialRect,
  computeDragPosition,
  computeResizeSize,
  constrainToViewport,
  MIN_WIDTH,
  MIN_HEIGHT,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  VIEWPORT_MARGIN,
} from "./floatingWindowLogic";

describe("computeInitialRect", () => {
  it("画面右側中央付近に配置する", () => {
    const rect = computeInitialRect({ width: 1024, height: 768 });
    expect(rect.width).toBe(DEFAULT_WIDTH);
    expect(rect.height).toBe(DEFAULT_HEIGHT);
    // 右端寄り
    expect(rect.x).toBe(1024 - DEFAULT_WIDTH - VIEWPORT_MARGIN);
    // 中央付近
    expect(rect.y).toBe(Math.round((768 - DEFAULT_HEIGHT) / 2));
  });

  it("小さいビューポートではサイズが制約される", () => {
    const rect = computeInitialRect({ width: 200, height: 200 });
    const maxW = 200 - VIEWPORT_MARGIN * 2;
    const maxH = 200 - VIEWPORT_MARGIN * 2;
    expect(rect.width).toBe(maxW);
    expect(rect.height).toBe(maxH);
    expect(rect.x).toBe(VIEWPORT_MARGIN);
    expect(rect.y).toBe(VIEWPORT_MARGIN);
  });
});

describe("computeDragPosition", () => {
  const drag = {
    startMouseX: 100,
    startMouseY: 100,
    startWindowX: 200,
    startWindowY: 150,
  };
  const viewport = { width: 1024, height: 768 };

  it("マウス移動に追従する", () => {
    const pos = computeDragPosition(drag, 150, 120, 400, 300, viewport);
    expect(pos.x).toBe(250);
    expect(pos.y).toBe(170);
  });

  it("ビューポート左端に制約される", () => {
    const pos = computeDragPosition(drag, -200, 100, 400, 300, viewport);
    expect(pos.x).toBe(VIEWPORT_MARGIN);
  });

  it("ビューポート右端に制約される", () => {
    const pos = computeDragPosition(drag, 2000, 100, 400, 300, viewport);
    expect(pos.x).toBe(viewport.width - 400 - VIEWPORT_MARGIN);
  });

  it("ビューポート上端に制約される", () => {
    const pos = computeDragPosition(drag, 100, -200, 400, 300, viewport);
    expect(pos.y).toBe(VIEWPORT_MARGIN);
  });

  it("ビューポート下端に制約される", () => {
    const pos = computeDragPosition(drag, 100, 2000, 400, 300, viewport);
    expect(pos.y).toBe(viewport.height - 300 - VIEWPORT_MARGIN);
  });
});

describe("computeResizeSize", () => {
  const resize = {
    startMouseX: 500,
    startMouseY: 500,
    startWidth: 400,
    startHeight: 300,
  };
  const viewport = { width: 1024, height: 768 };

  it("マウス移動に追従する", () => {
    const size = computeResizeSize(resize, 550, 530, 100, 100, viewport);
    expect(size.width).toBe(450);
    expect(size.height).toBe(330);
  });

  it("最小サイズに制約される", () => {
    const size = computeResizeSize(resize, 0, 0, 100, 100, viewport);
    expect(size.width).toBe(MIN_WIDTH);
    expect(size.height).toBe(MIN_HEIGHT);
  });

  it("ビューポート右端に制約される", () => {
    // windowX=400 → maxWidth = 1024-400-16 = 608
    const size = computeResizeSize(resize, 2000, 500, 400, 100, viewport);
    expect(size.width).toBe(viewport.width - 400 - VIEWPORT_MARGIN);
  });

  it("ビューポート下端に制約される", () => {
    // windowY=200 → maxHeight = 768-200-16 = 552
    const size = computeResizeSize(resize, 500, 2000, 100, 200, viewport);
    expect(size.height).toBe(viewport.height - 200 - VIEWPORT_MARGIN);
  });
});

describe("constrainToViewport", () => {
  it("ビューポート内のウィンドウはそのまま", () => {
    const rect = { x: 100, y: 100, width: 400, height: 300 };
    const viewport = { width: 1024, height: 768 };
    expect(constrainToViewport(rect, viewport)).toEqual(rect);
  });

  it("右にはみ出したウィンドウが修正される", () => {
    const rect = { x: 800, y: 100, width: 400, height: 300 };
    const viewport = { width: 1024, height: 768 };
    const result = constrainToViewport(rect, viewport);
    expect(result.x).toBe(viewport.width - 400 - VIEWPORT_MARGIN);
  });

  it("下にはみ出したウィンドウが修正される", () => {
    const rect = { x: 100, y: 600, width: 400, height: 300 };
    const viewport = { width: 1024, height: 768 };
    const result = constrainToViewport(rect, viewport);
    expect(result.y).toBe(viewport.height - 300 - VIEWPORT_MARGIN);
  });

  it("ビューポートより大きいウィンドウが縮小される", () => {
    const rect = { x: 0, y: 0, width: 2000, height: 2000 };
    const viewport = { width: 400, height: 300 };
    const result = constrainToViewport(rect, viewport);
    expect(result.width).toBe(400 - VIEWPORT_MARGIN * 2);
    expect(result.height).toBe(300 - VIEWPORT_MARGIN * 2);
    expect(result.x).toBe(VIEWPORT_MARGIN);
    expect(result.y).toBe(VIEWPORT_MARGIN);
  });
});
