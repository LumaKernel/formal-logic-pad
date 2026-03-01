import { describe, it, expect } from "vitest";
import {
  MARQUEE_INACTIVE,
  startMarquee,
  updateMarquee,
  endMarquee,
  computeMarqueeRect,
  screenToWorld,
  marqueeRectToWorld,
  rectsOverlap,
  findItemsInMarquee,
  addToSelection,
  replaceSelection,
  selectAll,
  computeMultiDragPositions,
  type MarqueeState,
  type SelectableItem,
} from "./multiSelection";

// --- マーキー状態管理 ---

describe("マーキー状態管理", () => {
  it("MARQUEE_INACTIVEは非アクティブ", () => {
    expect(MARQUEE_INACTIVE.active).toBe(false);
  });

  it("startMarqueeでアクティブになる", () => {
    const state = startMarquee(100, 200);
    expect(state.active).toBe(true);
    expect(state.startScreen).toEqual({ x: 100, y: 200 });
    expect(state.currentScreen).toEqual({ x: 100, y: 200 });
  });

  it("updateMarqueeで現在位置を更新する", () => {
    const state = startMarquee(100, 200);
    const updated = updateMarquee(state, 300, 400);
    expect(updated.active).toBe(true);
    expect(updated.startScreen).toEqual({ x: 100, y: 200 });
    expect(updated.currentScreen).toEqual({ x: 300, y: 400 });
  });

  it("updateMarqueeは非アクティブ時に状態を変更しない", () => {
    const state = MARQUEE_INACTIVE;
    const updated = updateMarquee(state, 300, 400);
    expect(updated).toBe(state);
  });

  it("endMarqueeで非アクティブに戻る", () => {
    const ended = endMarquee();
    expect(ended.active).toBe(false);
  });
});

// --- マーキー矩形の計算 ---

describe("computeMarqueeRect", () => {
  it("非アクティブ時はnullを返す", () => {
    expect(computeMarqueeRect(MARQUEE_INACTIVE)).toBe(null);
  });

  it("左上→右下ドラッグで正しい矩形を計算する", () => {
    const state = updateMarquee(startMarquee(100, 100), 300, 250);
    const rect = computeMarqueeRect(state);
    expect(rect).toEqual({ x: 100, y: 100, width: 200, height: 150 });
  });

  it("右下→左上ドラッグでも正規化された矩形を返す", () => {
    const state = updateMarquee(startMarquee(300, 250), 100, 100);
    const rect = computeMarqueeRect(state);
    expect(rect).toEqual({ x: 100, y: 100, width: 200, height: 150 });
  });

  it("開始位置=現在位置で幅高さ0の矩形を返す", () => {
    const state = startMarquee(100, 200);
    const rect = computeMarqueeRect(state);
    expect(rect).toEqual({ x: 100, y: 200, width: 0, height: 0 });
  });
});

// --- 座標変換 ---

describe("screenToWorld", () => {
  it("スケール1.0、オフセット0でそのまま返す", () => {
    const viewport = { offsetX: 0, offsetY: 0, scale: 1 };
    expect(screenToWorld(viewport, { x: 100, y: 200 })).toEqual({
      x: 100,
      y: 200,
    });
  });

  it("オフセットを考慮する", () => {
    const viewport = { offsetX: 50, offsetY: 100, scale: 1 };
    expect(screenToWorld(viewport, { x: 150, y: 300 })).toEqual({
      x: 100,
      y: 200,
    });
  });

  it("スケールを考慮する", () => {
    const viewport = { offsetX: 0, offsetY: 0, scale: 2 };
    expect(screenToWorld(viewport, { x: 200, y: 400 })).toEqual({
      x: 100,
      y: 200,
    });
  });

  it("オフセットとスケールの両方を考慮する", () => {
    const viewport = { offsetX: 50, offsetY: 100, scale: 2 };
    expect(screenToWorld(viewport, { x: 250, y: 500 })).toEqual({
      x: 100,
      y: 200,
    });
  });
});

describe("marqueeRectToWorld", () => {
  it("スケール1.0でオフセットのみ適用", () => {
    const viewport = { offsetX: 50, offsetY: 100, scale: 1 };
    const rect = { x: 150, y: 200, width: 100, height: 50 };
    const world = marqueeRectToWorld(viewport, rect);
    expect(world).toEqual({ x: 100, y: 100, width: 100, height: 50 });
  });

  it("スケール2.0でサイズが半分になる", () => {
    const viewport = { offsetX: 0, offsetY: 0, scale: 2 };
    const rect = { x: 0, y: 0, width: 200, height: 100 };
    const world = marqueeRectToWorld(viewport, rect);
    expect(world).toEqual({ x: 0, y: 0, width: 100, height: 50 });
  });
});

// --- ヒット判定 ---

describe("rectsOverlap", () => {
  it("重なるとtrue", () => {
    expect(
      rectsOverlap(
        { x: 0, y: 0, width: 100, height: 100 },
        { x: 50, y: 50, width: 100, height: 100 },
      ),
    ).toBe(true);
  });

  it("完全に含むとtrue", () => {
    expect(
      rectsOverlap(
        { x: 0, y: 0, width: 200, height: 200 },
        { x: 50, y: 50, width: 50, height: 50 },
      ),
    ).toBe(true);
  });

  it("離れているとfalse", () => {
    expect(
      rectsOverlap(
        { x: 0, y: 0, width: 50, height: 50 },
        { x: 100, y: 100, width: 50, height: 50 },
      ),
    ).toBe(false);
  });

  it("辺だけ接触するとfalse（開区間）", () => {
    expect(
      rectsOverlap(
        { x: 0, y: 0, width: 100, height: 100 },
        { x: 100, y: 0, width: 100, height: 100 },
      ),
    ).toBe(false);
  });

  it("X方向のみ重なりがあっても、Y方向が離れていればfalse", () => {
    expect(
      rectsOverlap(
        { x: 0, y: 0, width: 100, height: 50 },
        { x: 50, y: 100, width: 100, height: 50 },
      ),
    ).toBe(false);
  });

  it("Y方向のみ重なりがあっても、X方向が離れていればfalse", () => {
    expect(
      rectsOverlap(
        { x: 0, y: 0, width: 50, height: 100 },
        { x: 100, y: 50, width: 50, height: 100 },
      ),
    ).toBe(false);
  });

  it("bがaの左側にある場合はfalse", () => {
    expect(
      rectsOverlap(
        { x: 100, y: 0, width: 50, height: 50 },
        { x: 0, y: 0, width: 50, height: 50 },
      ),
    ).toBe(false);
  });

  it("bがaの上側にある場合はfalse", () => {
    expect(
      rectsOverlap(
        { x: 0, y: 100, width: 50, height: 50 },
        { x: 0, y: 0, width: 50, height: 50 },
      ),
    ).toBe(false);
  });
});

describe("findItemsInMarquee", () => {
  const items: readonly SelectableItem[] = [
    { id: "a", position: { x: 0, y: 0 }, size: { width: 100, height: 50 } },
    {
      id: "b",
      position: { x: 200, y: 200 },
      size: { width: 100, height: 50 },
    },
    {
      id: "c",
      position: { x: 50, y: 10 },
      size: { width: 100, height: 50 },
    },
  ];

  it("マーキー内のアイテムを検出する", () => {
    const marquee = { x: 0, y: 0, width: 120, height: 80 };
    const result = findItemsInMarquee(marquee, items);
    expect(result).toEqual(new Set(["a", "c"]));
  });

  it("全アイテムを含む大きなマーキー", () => {
    const marquee = { x: -100, y: -100, width: 500, height: 500 };
    const result = findItemsInMarquee(marquee, items);
    expect(result).toEqual(new Set(["a", "b", "c"]));
  });

  it("アイテムがないマーキー", () => {
    const marquee = { x: 500, y: 500, width: 100, height: 100 };
    const result = findItemsInMarquee(marquee, items);
    expect(result).toEqual(new Set());
  });

  it("空のアイテムリストでは空セットを返す", () => {
    const marquee = { x: 0, y: 0, width: 100, height: 100 };
    const result = findItemsInMarquee(marquee, []);
    expect(result).toEqual(new Set());
  });
});

// --- 選択操作 ---

describe("addToSelection", () => {
  it("既存の選択にアイテムを追加する", () => {
    const current = new Set(["a"]);
    const newItems = new Set(["b", "c"]);
    const result = addToSelection(current, newItems);
    expect(result).toEqual(new Set(["a", "b", "c"]));
  });

  it("重複アイテムは無視される", () => {
    const current = new Set(["a", "b"]);
    const newItems = new Set(["b", "c"]);
    const result = addToSelection(current, newItems);
    expect(result).toEqual(new Set(["a", "b", "c"]));
  });

  it("空のアイテムセットでは変化なし", () => {
    const current = new Set(["a"]);
    const result = addToSelection(current, new Set());
    expect(result).toEqual(new Set(["a"]));
  });
});

describe("replaceSelection", () => {
  it("新しいセットで置換する", () => {
    const result = replaceSelection(new Set(["x", "y"]));
    expect(result).toEqual(new Set(["x", "y"]));
  });

  it("空セットで置換するとクリアされる", () => {
    const result = replaceSelection(new Set());
    expect(result).toEqual(new Set());
  });
});

describe("selectAll", () => {
  it("全アイテムのIDを返す", () => {
    const items: readonly SelectableItem[] = [
      { id: "a", position: { x: 0, y: 0 }, size: { width: 10, height: 10 } },
      { id: "b", position: { x: 0, y: 0 }, size: { width: 10, height: 10 } },
      { id: "c", position: { x: 0, y: 0 }, size: { width: 10, height: 10 } },
    ];
    expect(selectAll(items)).toEqual(new Set(["a", "b", "c"]));
  });

  it("空のリストでは空セット", () => {
    expect(selectAll([])).toEqual(new Set());
  });
});

// --- 一括ドラッグ ---

describe("computeMultiDragPositions", () => {
  const items: readonly SelectableItem[] = [
    { id: "a", position: { x: 100, y: 100 }, size: { width: 50, height: 50 } },
    { id: "b", position: { x: 200, y: 200 }, size: { width: 50, height: 50 } },
    { id: "c", position: { x: 300, y: 300 }, size: { width: 50, height: 50 } },
  ];

  it("選択されたアイテムのみ移動する", () => {
    const selected = new Set(["a", "c"]);
    const delta = { x: 20, y: 10 };
    const result = computeMultiDragPositions(items, selected, delta, 1);
    expect(result.get("a")).toEqual({ x: 120, y: 110 });
    expect(result.get("c")).toEqual({ x: 320, y: 310 });
    expect(result.has("b")).toBe(false);
  });

  it("スケール2.0でデルタが半分になる", () => {
    const selected = new Set(["a"]);
    const delta = { x: 40, y: 20 };
    const result = computeMultiDragPositions(items, selected, delta, 2);
    expect(result.get("a")).toEqual({ x: 120, y: 110 });
  });

  it("選択なしでは空マップ", () => {
    const result = computeMultiDragPositions(
      items,
      new Set(),
      { x: 10, y: 10 },
      1,
    );
    expect(result.size).toBe(0);
  });
});

// --- エッジケース: MarqueeState型の直接操作 ---

describe("マーキー状態のエッジケース", () => {
  it("updateMarqueeを連続呼び出ししても開始位置は保持される", () => {
    let state: MarqueeState = startMarquee(10, 20);
    state = updateMarquee(state, 30, 40);
    state = updateMarquee(state, 50, 60);
    state = updateMarquee(state, 70, 80);
    expect(state.startScreen).toEqual({ x: 10, y: 20 });
    expect(state.currentScreen).toEqual({ x: 70, y: 80 });
  });

  it("endMarqueeの後にstartMarqueeで再開できる", () => {
    const ended = endMarquee();
    expect(ended.active).toBe(false);
    const restarted = startMarquee(50, 60);
    expect(restarted.active).toBe(true);
    expect(restarted.startScreen).toEqual({ x: 50, y: 60 });
  });
});
