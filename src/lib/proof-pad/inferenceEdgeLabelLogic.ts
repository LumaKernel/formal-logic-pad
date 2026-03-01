/**
 * 推論エッジラベルの表示ロジック。
 *
 * 接続線上に表示する推論規則ラベルのデータを計算する純粋関数群。
 * InferenceEdge情報から表示用のラベルテキストとバッジ色を生成する。
 *
 * 変更時は inferenceEdgeLabelLogic.test.ts も同期すること。
 */

import type { InferenceEdge } from "./inferenceEdge";
import {
  getInferenceEdgeLabel,
  isHilbertInferenceEdge,
  isTabInferenceEdge,
} from "./inferenceEdge";

// --- ラベルバッジ色 ---

/** ND推論規則のデフォルトバッジ色 */
const ND_BADGE_COLOR = "var(--color-badge-nd, #0984e3)";

/** TAB推論規則のデフォルトバッジ色 */
const TAB_BADGE_COLOR = "var(--color-badge-tab, #d63031)";

/** 推論規則の種別に応じたバッジ背景色 */
export function getInferenceEdgeBadgeColor(edge: InferenceEdge): string {
  if (isTabInferenceEdge(edge)) {
    return TAB_BADGE_COLOR;
  }
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

// --- 前提ロール判定 ---

/**
 * 前提ノードの役割を表す文字列型。
 * 2前提以上のエッジで、各コネクションの意味を区別するために使う。
 */
export type PremiseRole =
  | "left"
  | "right"
  | "disjunction"
  | "leftCase"
  | "rightCase"
  | "kept"
  | "discarded"
  | "existential"
  | "case"
  | "premise";

/**
 * コネクションの前提ノードIDがエッジのどの前提ロールに対応するかを判定する。
 * 1前提エッジでは "premise" を返す。
 * マッチしない場合はundefinedを返す。
 */
export function getPremiseRole(
  edge: InferenceEdge,
  premiseNodeId: string,
): PremiseRole | undefined {
  switch (edge._tag) {
    // 2前提系: left/right
    case "mp":
    case "nd-implication-elim":
    case "nd-conjunction-intro":
      if (edge.leftPremiseNodeId === premiseNodeId) return "left";
      if (edge.rightPremiseNodeId === premiseNodeId) return "right";
      return undefined;
    // 2前提系: kept/discarded
    case "nd-weakening":
      if (edge.keptPremiseNodeId === premiseNodeId) return "kept";
      if (edge.discardedPremiseNodeId === premiseNodeId) return "discarded";
      return undefined;
    // 2前提系: existential/case
    case "nd-existential-elim":
      if (edge.existentialPremiseNodeId === premiseNodeId) return "existential";
      if (edge.casePremiseNodeId === premiseNodeId) return "case";
      return undefined;
    // 3前提系: disjunction/leftCase/rightCase
    case "nd-disjunction-elim":
      if (edge.disjunctionPremiseNodeId === premiseNodeId) return "disjunction";
      if (edge.leftCasePremiseNodeId === premiseNodeId) return "leftCase";
      if (edge.rightCasePremiseNodeId === premiseNodeId) return "rightCase";
      return undefined;
    // 1前提系
    case "gen":
    case "substitution":
    case "nd-implication-intro":
    case "nd-conjunction-elim-left":
    case "nd-conjunction-elim-right":
    case "nd-disjunction-intro-left":
    case "nd-disjunction-intro-right":
    case "nd-efq":
    case "nd-dne":
    case "nd-universal-intro":
    case "nd-universal-elim":
    case "nd-existential-intro":
      if (edge.premiseNodeId === premiseNodeId) return "premise";
      return undefined;
    // TAB 1前提系
    case "tab-single":
      if (edge.premiseNodeId === premiseNodeId) return "premise";
      return undefined;
    // TAB 2前提（分岐）系
    case "tab-branching":
      if (edge.leftPremiseNodeId === premiseNodeId) return "left";
      if (edge.rightPremiseNodeId === premiseNodeId) return "right";
      return undefined;
    // TAB 公理（0前提）
    case "tab-axiom":
      return undefined;
  }
}

/**
 * エッジラベルに前提ロール情報を付与する。
 * 2前提以上のエッジではロールを接尾辞として追加。
 * 1前提エッジではラベルをそのまま返す。
 */
export function getInferenceEdgeLabelForConnection(
  edge: InferenceEdge,
  premiseNodeId: string,
): string {
  const baseLabel = getInferenceEdgeLabel(edge);
  const role = getPremiseRole(edge, premiseNodeId);
  if (role === undefined || role === "premise") return baseLabel;

  switch (edge._tag) {
    // MP系: φ(antecedent) / →(conditional)
    case "mp":
    case "nd-implication-elim":
      return role === "left"
        ? `${baseLabel satisfies string}:φ`
        : `${baseLabel satisfies string}:→`;
    // ∧I: L / R
    case "nd-conjunction-intro":
      return role === "left"
        ? `${baseLabel satisfies string}:L`
        : `${baseLabel satisfies string}:R`;
    // w: ✓(kept) / ✗(discarded)
    case "nd-weakening":
      return role === "kept"
        ? `${baseLabel satisfies string}:✓`
        : `${baseLabel satisfies string}:✗`;
    // ∃E: ∃(existential) / φ(case)
    case "nd-existential-elim":
      return role === "existential"
        ? `${baseLabel satisfies string}:∃`
        : `${baseLabel satisfies string}:φ`;
    // ∨E: ∨(disjunction) / L(leftCase) / R(rightCase)
    case "nd-disjunction-elim":
      if (role === "disjunction") return `${baseLabel satisfies string}:∨`;
      if (role === "leftCase") return `${baseLabel satisfies string}:L`;
      return `${baseLabel satisfies string}:R`;
    /* v8 ignore start */
    default:
      return baseLabel;
    /* v8 ignore stop */
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

/**
 * 特定のコネクション（前提ノード）に対するラベルデータを計算する。
 * 2前提以上のエッジではロール付きラベルを生成する。
 */
export function computeInferenceEdgeLabelDataForConnection(
  edge: InferenceEdge,
  premiseNodeId: string,
): InferenceEdgeLabelData {
  return {
    label: getInferenceEdgeLabelForConnection(edge, premiseNodeId),
    badgeColor: getInferenceEdgeBadgeColor(edge),
    tag: edge._tag,
  };
}
