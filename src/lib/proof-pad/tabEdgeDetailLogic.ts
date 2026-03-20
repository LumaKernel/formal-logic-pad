/**
 * TABエッジ詳細表示の純粋ロジック。
 *
 * TABエッジバッジクリック時に表示する読み取り専用の詳細情報を生成する。
 *
 * 変更時は tabEdgeDetailLogic.test.ts も同期すること。
 */

import type {
  TabInferenceEdge,
  TabSinglePremiseEdge,
  TabBranchingEdge,
  TabAxiomEdge,
} from "./inferenceEdge";
import { getTabRuleDisplayName } from "../logic-core/tableauCalculus";

// --- 詳細データ型 ---

/** TABエッジ詳細の項目 */
export type TabEdgeDetailEntry = {
  readonly labelKey: string;
  readonly value: string;
};

/** TABエッジ詳細データ */
export type TabEdgeDetailData = {
  /** 規則の表示名（例: ∧, ∨, →） */
  readonly ruleName: string;
  /** エッジの種類タグ */
  readonly edgeTag: TabInferenceEdge["_tag"];
  /** 詳細項目のリスト */
  readonly entries: readonly TabEdgeDetailEntry[];
};

// --- 詳細データの生成 ---

function createSinglePremiseDetail(
  edge: TabSinglePremiseEdge,
): TabEdgeDetailData {
  const entries: TabEdgeDetailEntry[] = [
    { labelKey: "tabDetailConclusion", value: edge.conclusionText },
  ];

  if (edge.eigenVariable !== undefined) {
    entries.push({
      labelKey: "tabDetailEigenVariable",
      value: edge.eigenVariable,
    });
  }

  if (edge.termText !== undefined) {
    entries.push({ labelKey: "tabDetailTerm", value: edge.termText });
  }

  if (edge.exchangePosition !== undefined) {
    entries.push({
      labelKey: "tabDetailExchangePosition",
      value: String(edge.exchangePosition),
    });
  }

  return {
    ruleName: getTabRuleDisplayName(edge.ruleId),
    edgeTag: edge._tag,
    entries,
  };
}

function createBranchingDetail(edge: TabBranchingEdge): TabEdgeDetailData {
  return {
    ruleName: getTabRuleDisplayName(edge.ruleId),
    edgeTag: edge._tag,
    entries: [
      { labelKey: "tabDetailConclusion", value: edge.conclusionText },
      {
        labelKey: "tabDetailLeftPremise",
        value: edge.leftConclusionText,
      },
      {
        labelKey: "tabDetailRightPremise",
        value: edge.rightConclusionText,
      },
    ],
  };
}

function createAxiomDetail(edge: TabAxiomEdge): TabEdgeDetailData {
  return {
    ruleName: getTabRuleDisplayName(edge.ruleId),
    edgeTag: edge._tag,
    entries: [{ labelKey: "tabDetailConclusion", value: edge.conclusionText }],
  };
}

/**
 * TABエッジから詳細表示用データを生成する。
 */
export function createTabEdgeDetailData(
  edge: TabInferenceEdge,
): TabEdgeDetailData {
  if (edge._tag === "tab-single") {
    return createSinglePremiseDetail(edge);
  }
  if (edge._tag === "tab-branching") {
    return createBranchingDetail(edge);
  }
  // edge._tag === "tab-axiom"（TypeScript narrowingで型安全）
  return createAxiomDetail(edge);
}
