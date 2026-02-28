/**
 * 推論エッジラベルの表示ロジック。
 *
 * 接続線上に表示する推論規則ラベルのデータを計算する純粋関数群。
 * InferenceEdge情報から表示用のラベルテキストとバッジ色を生成する。
 *
 * 変更時は inferenceEdgeLabelLogic.test.ts も同期すること。
 */

import type { InferenceEdge } from "./inferenceEdge";
import { getInferenceEdgeLabel, isHilbertInferenceEdge } from "./inferenceEdge";

// --- ラベルバッジ色 ---

/** ND推論規則のデフォルトバッジ色 */
const ND_BADGE_COLOR = "var(--color-badge-nd, #0984e3)";

/** 推論規則の種別に応じたバッジ背景色 */
export function getInferenceEdgeBadgeColor(edge: InferenceEdge): string {
  if (!isHilbertInferenceEdge(edge)) {
    return ND_BADGE_COLOR;
  }
  switch (edge._tag) {
    case "mp":
      return "var(--color-badge-mp, #6c5ce7)";
    case "gen":
      return "var(--color-badge-gen, #00b894)";
    case "substitution":
      return "var(--color-badge-subst, #e17055)";
  }
}

// --- ラベルデータ ---

export type InferenceEdgeLabelData = {
  /** 表示ラベルテキスト */
  readonly label: string;
  /** バッジ背景色 */
  readonly badgeColor: string;
  /** 推論規則の種別 */
  readonly tag: InferenceEdge["_tag"];
};

/**
 * InferenceEdgeから表示用のラベルデータを計算する。
 */
export function computeInferenceEdgeLabelData(
  edge: InferenceEdge,
): InferenceEdgeLabelData {
  return {
    label: getInferenceEdgeLabel(edge),
    badgeColor: getInferenceEdgeBadgeColor(edge),
    tag: edge._tag,
  };
}
