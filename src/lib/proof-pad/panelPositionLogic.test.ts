import { describe, it, expect } from "vitest";
import {
  clampToContainer,
  snapToEdges,
  rectsOverlap,
  findNonOverlappingPosition,
  computeDragPosition,
  computeInitialPosition,
  defaultDragOptions,
  type PanelPosition,
  type PanelSize,
  type ContainerSize,
  type PanelRect,
  type DragStartInfo,
} from "./panelPositionLogic";

// --- テスト用定数 ---

const container: ContainerSize = { width: 800, height: 600 };
const panelSize: PanelSize = { width: 200, height: 150 };
const margin = 8;

// --- clampToContainer ---

describe("clampToContainer", () => {
  it("コンテナ内の位置はそのまま返す", () => {
    const pos: PanelPosition = { x: 100, y: 100 };
    const result = clampToContainer(pos, panelSize, container, margin);
    expect(result).toEqual({ x: 100, y: 100 });
  });

  it("左上に飛び出した位置をクランプする", () => {
    const pos: PanelPosition = { x: -50, y: -30 };
    const result = clampToContainer(pos, panelSize, container, margin);
    expect(result).toEqual({ x: margin, y: margin });
  });

  it("右下に飛び出した位置をクランプする", () => {
    const pos: PanelPosition = { x: 700, y: 500 };
    const result = clampToContainer(pos, panelSize, container, margin);
    // maxX = 800 - 200 - 8 = 592, maxY = 600 - 150 - 8 = 442
    expect(result).toEqual({ x: 592, y: 442 });
  });

  it("パネルがコンテナより大きい場合はmarginに固定", () => {
    const largePanel: PanelSize = { width: 900, height: 700 };
    const pos: PanelPosition = { x: 100, y: 100 };
    const result = clampToContainer(pos, largePanel, container, margin);
    // maxX = max(8, 800-900-8) = max(8, -108) = 8
    expect(result).toEqual({ x: margin, y: margin });
  });

  it("境界ちょうどの位置はそのまま", () => {
    const pos: PanelPosition = { x: margin, y: margin };
    const result = clampToContainer(pos, panelSize, container, margin);
    expect(result).toEqual({ x: margin, y: margin });
  });

  it("右下境界ちょうどの位置はそのまま", () => {
    const pos: PanelPosition = { x: 592, y: 442 };
    const result = clampToContainer(pos, panelSize, container, margin);
    expect(result).toEqual({ x: 592, y: 442 });
  });
});

// --- snapToEdges ---

describe("snapToEdges", () => {
  const threshold = 16;

  it("辺に近くない場合はスナップしない", () => {
    const pos: PanelPosition = { x: 100, y: 100 };
    const result = snapToEdges(pos, panelSize, container, threshold, margin);
    expect(result.position).toEqual({ x: 100, y: 100 });
    expect(result.snappedEdges).toEqual([]);
  });

  it("左辺にスナップする", () => {
    const pos: PanelPosition = { x: 20, y: 100 };
    const result = snapToEdges(pos, panelSize, container, threshold, margin);
    expect(result.position.x).toBe(margin);
    expect(result.snappedEdges).toContain("left");
  });

  it("右辺にスナップする", () => {
    // rightSnapTarget = 800 - 200 - 8 = 592
    const pos: PanelPosition = { x: 580, y: 100 };
    const result = snapToEdges(pos, panelSize, container, threshold, margin);
    expect(result.position.x).toBe(592);
    expect(result.snappedEdges).toContain("right");
  });

  it("上辺にスナップする", () => {
    const pos: PanelPosition = { x: 100, y: 20 };
    const result = snapToEdges(pos, panelSize, container, threshold, margin);
    expect(result.position.y).toBe(margin);
    expect(result.snappedEdges).toContain("top");
  });

  it("下辺にスナップする", () => {
    // bottomSnapTarget = 600 - 150 - 8 = 442
    const pos: PanelPosition = { x: 100, y: 430 };
    const result = snapToEdges(pos, panelSize, container, threshold, margin);
    expect(result.position.y).toBe(442);
    expect(result.snappedEdges).toContain("bottom");
  });

  it("左上角に同時スナップする", () => {
    const pos: PanelPosition = { x: 15, y: 15 };
    const result = snapToEdges(pos, panelSize, container, threshold, margin);
    expect(result.position).toEqual({ x: margin, y: margin });
    expect(result.snappedEdges).toContain("left");
    expect(result.snappedEdges).toContain("top");
  });

  it("右下角に同時スナップする", () => {
    const pos: PanelPosition = { x: 585, y: 435 };
    const result = snapToEdges(pos, panelSize, container, threshold, margin);
    expect(result.position).toEqual({ x: 592, y: 442 });
    expect(result.snappedEdges).toContain("right");
    expect(result.snappedEdges).toContain("bottom");
  });

  it("threshold境界ちょうどの位置でスナップする", () => {
    // 左辺: |pos.x - margin| = |24 - 8| = 16 = threshold → スナップ
    const pos: PanelPosition = { x: 24, y: 100 };
    const result = snapToEdges(pos, panelSize, container, threshold, margin);
    expect(result.position.x).toBe(margin);
    expect(result.snappedEdges).toContain("left");
  });

  it("thresholdを超えた位置ではスナップしない", () => {
    // 左辺: |pos.x - margin| = |25 - 8| = 17 > threshold → スナップしない
    const pos: PanelPosition = { x: 25, y: 100 };
    const result = snapToEdges(pos, panelSize, container, threshold, margin);
    expect(result.position.x).toBe(25);
    expect(result.snappedEdges).not.toContain("left");
  });

  it("コンテナが小さくてスナップ先が不正になる場合はスナップしない", () => {
    const smallContainer: ContainerSize = { width: 100, height: 80 };
    // rightSnapTarget = 100 - 200 - 8 = -108 < margin → スナップ対象外
    const pos: PanelPosition = { x: 20, y: 20 };
    const result = snapToEdges(
      pos,
      panelSize,
      smallContainer,
      threshold,
      margin,
    );
    expect(result.snappedEdges).not.toContain("right");
    expect(result.snappedEdges).not.toContain("bottom");
  });
});

// --- rectsOverlap ---

describe("rectsOverlap", () => {
  it("重なる矩形を検出する", () => {
    const a: PanelRect = { x: 0, y: 0, width: 100, height: 100 };
    const b: PanelRect = { x: 50, y: 50, width: 100, height: 100 };
    expect(rectsOverlap(a, b, 0)).toBe(true);
  });

  it("離れた矩形は重ならない", () => {
    const a: PanelRect = { x: 0, y: 0, width: 100, height: 100 };
    const b: PanelRect = { x: 200, y: 200, width: 100, height: 100 };
    expect(rectsOverlap(a, b, 0)).toBe(false);
  });

  it("ちょうど接する矩形はgap=0で重ならない", () => {
    const a: PanelRect = { x: 0, y: 0, width: 100, height: 100 };
    const b: PanelRect = { x: 100, y: 0, width: 100, height: 100 };
    expect(rectsOverlap(a, b, 0)).toBe(false);
  });

  it("gap付きで近接矩形を重なりとみなす", () => {
    const a: PanelRect = { x: 0, y: 0, width: 100, height: 100 };
    const b: PanelRect = { x: 105, y: 0, width: 100, height: 100 };
    // gap=8: a.x + a.width + gap = 108 > b.x = 105 → 重なり
    expect(rectsOverlap(a, b, 8)).toBe(true);
  });

  it("gap付きでも十分離れていれば重ならない", () => {
    const a: PanelRect = { x: 0, y: 0, width: 100, height: 100 };
    const b: PanelRect = { x: 120, y: 0, width: 100, height: 100 };
    // gap=8: a.x + a.width + gap = 108 < b.x = 120 → 重ならない
    expect(rectsOverlap(a, b, 8)).toBe(false);
  });

  it("垂直方向のみ重なる場合は重ならない", () => {
    const a: PanelRect = { x: 0, y: 0, width: 100, height: 100 };
    const b: PanelRect = { x: 200, y: 50, width: 100, height: 100 };
    expect(rectsOverlap(a, b, 0)).toBe(false);
  });

  it("水平方向のみ重なる場合は重ならない", () => {
    const a: PanelRect = { x: 50, y: 0, width: 100, height: 100 };
    const b: PanelRect = { x: 0, y: 200, width: 100, height: 100 };
    expect(rectsOverlap(a, b, 0)).toBe(false);
  });

  it("bがaの右側に離れている場合は重ならない（条件1がfalse）", () => {
    // a.x < b.x + b.width + gap が false
    const a: PanelRect = { x: 300, y: 0, width: 100, height: 100 };
    const b: PanelRect = { x: 0, y: 0, width: 100, height: 100 };
    expect(rectsOverlap(a, b, 0)).toBe(false);
  });

  it("bがaの上方に離れている場合は重ならない（条件3がfalse）", () => {
    // 条件1,2はtrue、条件3: a.y < b.y + b.height + gap が false
    const a: PanelRect = { x: 50, y: 300, width: 100, height: 100 };
    const b: PanelRect = { x: 50, y: 0, width: 100, height: 100 };
    expect(rectsOverlap(a, b, 0)).toBe(false);
  });

  it("bがaの下方に離れている場合は重ならない（条件4がfalse）", () => {
    // 条件1,2,3はtrue、条件4: a.y + a.height + gap > b.y が false
    const a: PanelRect = { x: 50, y: 0, width: 100, height: 100 };
    const b: PanelRect = { x: 50, y: 100, width: 100, height: 100 };
    expect(rectsOverlap(a, b, 0)).toBe(false);
  });
});

// --- findNonOverlappingPosition ---

describe("findNonOverlappingPosition", () => {
  const gap = 8;

  it("重なりがない場合はそのまま返す", () => {
    const pos: PanelPosition = { x: 100, y: 100 };
    const result = findNonOverlappingPosition(
      pos,
      panelSize,
      [],
      container,
      margin,
      gap,
    );
    expect(result).toEqual({ x: 100, y: 100 });
  });

  it("単一パネルとの重なりを回避する", () => {
    const pos: PanelPosition = { x: 100, y: 100 };
    const other: PanelRect = { x: 80, y: 80, width: 200, height: 150 };
    const result = findNonOverlappingPosition(
      pos,
      panelSize,
      [other],
      container,
      margin,
      gap,
    );
    // 結果は元の位置から離れていて、重ならないはず
    const resultRect: PanelRect = {
      ...result,
      width: panelSize.width,
      height: panelSize.height,
    };
    expect(rectsOverlap(resultRect, other, gap)).toBe(false);
  });

  it("複数パネルとの重なりを回避する", () => {
    const pos: PanelPosition = { x: 100, y: 100 };
    const others: readonly PanelRect[] = [
      { x: 80, y: 80, width: 200, height: 150 },
      { x: 300, y: 80, width: 200, height: 150 },
    ];
    const result = findNonOverlappingPosition(
      pos,
      panelSize,
      others,
      container,
      margin,
      gap,
    );
    const resultRect: PanelRect = {
      ...result,
      width: panelSize.width,
      height: panelSize.height,
    };
    for (const other of others) {
      expect(rectsOverlap(resultRect, other, gap)).toBe(false);
    }
  });

  it("コンテナが小さくどの方向にも押し出せない場合はベストエフォートで返す", () => {
    // コンテナがパネルとほぼ同じサイズで、他パネルが全面を占有
    const tinyContainer: ContainerSize = { width: 220, height: 170 };
    const pos: PanelPosition = { x: 10, y: 10 };
    const other: PanelRect = { x: 0, y: 0, width: 220, height: 170 };
    // どの方向に押し出してもclamp後に元に戻る → breakして終了
    const result = findNonOverlappingPosition(
      pos,
      panelSize,
      [other],
      tinyContainer,
      margin,
      gap,
    );
    // ベストエフォート: 何らかの位置を返す（エラーにはならない）
    expect(result).toBeDefined();
  });

  it("コンテナ内に収まる位置を返す", () => {
    const pos: PanelPosition = { x: 10, y: 10 };
    const other: PanelRect = { x: 0, y: 0, width: 300, height: 300 };
    const result = findNonOverlappingPosition(
      pos,
      panelSize,
      [other],
      container,
      margin,
      gap,
    );
    expect(result.x).toBeGreaterThanOrEqual(margin);
    expect(result.y).toBeGreaterThanOrEqual(margin);
    expect(result.x + panelSize.width + margin).toBeLessThanOrEqual(
      container.width,
    );
    expect(result.y + panelSize.height + margin).toBeLessThanOrEqual(
      container.height,
    );
  });
});

// --- computeDragPosition ---

describe("computeDragPosition", () => {
  it("ドラッグ開始位置からの相対移動を計算する", () => {
    const dragStart: DragStartInfo = {
      pointerPosition: { x: 150, y: 120 },
      panelPosition: { x: 100, y: 100 },
    };
    // ポインタが (200, 170) に移動 → パネルは (+50, +50)
    const result = computeDragPosition(
      dragStart,
      { x: 200, y: 170 },
      panelSize,
      container,
      [],
      { ...defaultDragOptions, snapThreshold: 0 },
    );
    expect(result.position).toEqual({ x: 150, y: 150 });
  });

  it("コンテナ外への移動をクランプする", () => {
    const dragStart: DragStartInfo = {
      pointerPosition: { x: 100, y: 100 },
      panelPosition: { x: 50, y: 50 },
    };
    // ポインタが大きく左上に → クランプ
    const result = computeDragPosition(
      dragStart,
      { x: -200, y: -200 },
      panelSize,
      container,
      [],
      { ...defaultDragOptions, snapThreshold: 0 },
    );
    expect(result.position.x).toBeGreaterThanOrEqual(
      defaultDragOptions.edgeMargin,
    );
    expect(result.position.y).toBeGreaterThanOrEqual(
      defaultDragOptions.edgeMargin,
    );
  });

  it("端に近い場合にスナップする", () => {
    const dragStart: DragStartInfo = {
      pointerPosition: { x: 100, y: 100 },
      panelPosition: { x: 50, y: 50 },
    };
    // ポインタを移動して左辺近くに
    const result = computeDragPosition(
      dragStart,
      { x: 70, y: 100 },
      panelSize,
      container,
      [],
      defaultDragOptions,
    );
    // x = 50 + (70 - 100) = 20 → margin(8)までの距離12 < threshold(16) → スナップ
    expect(result.position.x).toBe(defaultDragOptions.edgeMargin);
    expect(result.snappedEdges).toContain("left");
  });

  it("他パネルとの重なりを回避する", () => {
    const dragStart: DragStartInfo = {
      pointerPosition: { x: 200, y: 200 },
      panelPosition: { x: 150, y: 150 },
    };
    const otherPanel: PanelRect = { x: 140, y: 140, width: 200, height: 150 };
    const result = computeDragPosition(
      dragStart,
      { x: 200, y: 200 },
      panelSize,
      container,
      [otherPanel],
      { ...defaultDragOptions, snapThreshold: 0 },
    );
    const resultRect: PanelRect = {
      ...result.position,
      width: panelSize.width,
      height: panelSize.height,
    };
    expect(
      rectsOverlap(resultRect, otherPanel, defaultDragOptions.panelGap),
    ).toBe(false);
  });

  it("デフォルトオプションで動作する", () => {
    const dragStart: DragStartInfo = {
      pointerPosition: { x: 200, y: 200 },
      panelPosition: { x: 150, y: 150 },
    };
    const result = computeDragPosition(
      dragStart,
      { x: 250, y: 250 },
      panelSize,
      container,
      [],
    );
    // デフォルトオプション使用: 中央付近なのでスナップなし
    expect(result.position).toEqual({ x: 200, y: 200 });
    expect(result.snappedEdges).toEqual([]);
  });
});

// --- computeInitialPosition ---

describe("computeInitialPosition", () => {
  const gap = 8;

  it("重なりがなければ好み位置をそのまま返す", () => {
    const result = computeInitialPosition(
      { x: 100, y: 100 },
      panelSize,
      [],
      container,
      margin,
      gap,
    );
    expect(result).toEqual({ x: 100, y: 100 });
  });

  it("コンテナ外の好み位置をクランプする", () => {
    const result = computeInitialPosition(
      { x: -50, y: -50 },
      panelSize,
      [],
      container,
      margin,
      gap,
    );
    expect(result).toEqual({ x: margin, y: margin });
  });

  it("他パネルと重なる場合に回避する", () => {
    const others: readonly PanelRect[] = [
      { x: 90, y: 90, width: 200, height: 150 },
    ];
    const result = computeInitialPosition(
      { x: 100, y: 100 },
      panelSize,
      others,
      container,
      margin,
      gap,
    );
    const resultRect: PanelRect = {
      ...result,
      width: panelSize.width,
      height: panelSize.height,
    };
    expect(rectsOverlap(resultRect, others[0]!, gap)).toBe(false);
  });
});
