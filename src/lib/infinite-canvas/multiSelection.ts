/**
 * マルチセレクション（矩形選択/マーキー）の純粋ロジック。
 *
 * マーキー矩形の計算、アイテムのヒット判定、選択状態の操作を提供する。
 * UIコンポーネント（InfiniteCanvas.tsx, useMarquee.ts）から利用される。
 *
 * 変更時は multiSelection.test.ts, useMarquee.ts, InfiniteCanvas.tsx, index.ts も同期すること。
 */

import { screenToWorld } from "./coordinate";
import type { Point, Size, ViewportState } from "./types";

// Re-export for backward compatibility
export { screenToWorld };

// --- マーキー矩形 ---

/** マーキー矩形（スクリーン座標） */
export type MarqueeRect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** マーキーの状態 */
export type MarqueeState = {
  /** マーキーがアクティブ（ドラッグ中）かどうか */
  readonly active: boolean;
  /** マーキーの開始位置（スクリーン座標） */
  readonly startScreen: Point;
  /** マーキーの現在位置（スクリーン座標） */
  readonly currentScreen: Point;
};

/** マーキー非アクティブ状態 */
export const MARQUEE_INACTIVE: MarqueeState = {
  active: false,
  startScreen: { x: 0, y: 0 },
  currentScreen: { x: 0, y: 0 },
};

/** マーキーを開始する */
export function startMarquee(screenX: number, screenY: number): MarqueeState {
  return {
    active: true,
    startScreen: { x: screenX, y: screenY },
    currentScreen: { x: screenX, y: screenY },
  };
}

/** マーキーの現在位置を更新する */
export function updateMarquee(
  state: MarqueeState,
  screenX: number,
  screenY: number,
): MarqueeState {
  if (!state.active) return state;
  return {
    ...state,
    currentScreen: { x: screenX, y: screenY },
  };
}

/** マーキーを終了する */
export function endMarquee(): MarqueeState {
  return MARQUEE_INACTIVE;
}

/** MarqueeStateからスクリーン座標の正規化されたMarqueeRectを計算する */
export function computeMarqueeRect(state: MarqueeState): MarqueeRect | null {
  if (!state.active) return null;
  const { startScreen, currentScreen } = state;
  const x = Math.min(startScreen.x, currentScreen.x);
  const y = Math.min(startScreen.y, currentScreen.y);
  const width = Math.abs(currentScreen.x - startScreen.x);
  const height = Math.abs(currentScreen.y - startScreen.y);
  return { x, y, width, height };
}

// --- 座標変換 ---

/** マーキー矩形（スクリーン座標）をワールド座標に変換 */
export function marqueeRectToWorld(
  viewport: ViewportState,
  rect: MarqueeRect,
): MarqueeRect {
  const topLeft = screenToWorld(viewport, { x: rect.x, y: rect.y });
  const bottomRight = screenToWorld(viewport, {
    x: rect.x + rect.width,
    y: rect.y + rect.height,
  });
  return {
    x: topLeft.x,
    y: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };
}

// --- ヒット判定 ---

/** 選択可能なアイテム（位置 + サイズ） */
export type SelectableItem = {
  readonly id: string;
  readonly position: Point;
  readonly size: Size;
};

/** 矩形同士の重なり判定（ワールド座標） */
export function rectsOverlap(
  a: MarqueeRect,
  b: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  },
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** マーキー矩形（ワールド座標）内のアイテムIDセットを返す */
export function findItemsInMarquee(
  marqueeWorld: MarqueeRect,
  items: readonly SelectableItem[],
): ReadonlySet<string> {
  const result = new Set<string>();
  for (const item of items) {
    const itemRect = {
      x: item.position.x,
      y: item.position.y,
      width: item.size.width,
      height: item.size.height,
    };
    if (rectsOverlap(marqueeWorld, itemRect)) {
      result.add(item.id);
    }
  }
  return result;
}

// --- 選択操作 ---

/** 選択にアイテムセットを追加（Shift+マーキーで使用） */
export function addToSelection(
  current: ReadonlySet<string>,
  itemIds: ReadonlySet<string>,
): ReadonlySet<string> {
  const result = new Set(current);
  for (const id of itemIds) {
    result.add(id);
  }
  return result;
}

/** 選択をアイテムセットで置換 */
export function replaceSelection(
  itemIds: ReadonlySet<string>,
): ReadonlySet<string> {
  return new Set(itemIds);
}

/** 全アイテムを選択 */
export function selectAll(
  items: readonly SelectableItem[],
): ReadonlySet<string> {
  return new Set(items.map((item) => item.id));
}

// --- 一括ドラッグ ---

/** 選択中アイテムの一括移動差分を計算（ワールド座標） */
export function computeMultiDragPositions(
  items: readonly SelectableItem[],
  selectedIds: ReadonlySet<string>,
  screenDelta: Point,
  scale: number,
): ReadonlyMap<string, Point> {
  const worldDelta: Point = {
    x: screenDelta.x / scale,
    y: screenDelta.y / scale,
  };
  const result = new Map<string, Point>();
  for (const item of items) {
    if (selectedIds.has(item.id)) {
      result.set(item.id, {
        x: item.position.x + worldDelta.x,
        y: item.position.y + worldDelta.y,
      });
    }
  }
  return result;
}
