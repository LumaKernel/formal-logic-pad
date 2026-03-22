/**
 * 可視化ハイライトの表示ロジック（純粋関数）。
 *
 * HighlightColor → CSS スタイルへの変換を行う。
 *
 * 変更時は visualizationHighlightLogic.test.ts も同期すること。
 */

import type { HighlightColor } from "./visualizationState";

// ── 色定義 ─────────────────────────────────────────────────

interface HighlightStyle {
  readonly outline: string;
  readonly boxShadow: string;
}

const HIGHLIGHT_STYLES: ReadonlyMap<HighlightColor, HighlightStyle> = new Map<
  HighlightColor,
  HighlightStyle
>([
  [
    "red",
    {
      outline: "2px solid rgba(239, 68, 68, 0.9)",
      boxShadow: "0 0 8px rgba(239, 68, 68, 0.5)",
    },
  ],
  [
    "blue",
    {
      outline: "2px solid rgba(59, 130, 246, 0.9)",
      boxShadow: "0 0 8px rgba(59, 130, 246, 0.5)",
    },
  ],
  [
    "green",
    {
      outline: "2px solid rgba(34, 197, 94, 0.9)",
      boxShadow: "0 0 8px rgba(34, 197, 94, 0.5)",
    },
  ],
  [
    "yellow",
    {
      outline: "2px solid rgba(234, 179, 8, 0.9)",
      boxShadow: "0 0 8px rgba(234, 179, 8, 0.5)",
    },
  ],
  [
    "purple",
    {
      outline: "2px solid rgba(168, 85, 247, 0.9)",
      boxShadow: "0 0 8px rgba(168, 85, 247, 0.5)",
    },
  ],
  [
    "orange",
    {
      outline: "2px solid rgba(249, 115, 22, 0.9)",
      boxShadow: "0 0 8px rgba(249, 115, 22, 0.5)",
    },
  ],
]);

/**
 * HighlightColor に対応する CSS スタイルを取得する。
 */
export const getHighlightStyle = (color: HighlightColor): HighlightStyle => {
  const style = HIGHLIGHT_STYLES.get(color);
  /* v8 ignore start */
  if (!style) {
    // 型レベルでは到達不能（exhaustive map）
    return { outline: "2px solid yellow", boxShadow: "0 0 8px yellow" };
  }
  /* v8 ignore stop */
  return style;
};

/**
 * 全 HighlightColor の一覧。
 */
export const ALL_HIGHLIGHT_COLORS: readonly HighlightColor[] = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "orange",
];
