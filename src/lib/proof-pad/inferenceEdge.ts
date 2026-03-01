/**
 * 推論エッジの型定義とユーティリティ。
 *
 * 推論規則をノードではなくエッジとして表現するデータモデル。
 * InferenceEdgeはWorkspaceState.inferenceEdgesに直接保持され、
 * ノードの種別（ProofNodeKind）からは独立して管理される。
 *
 * Hilbert系: MP, Gen, Substitution
 * 自然演繹(ND): →I, →E, ∧I, ∧E_L, ∧E_R, ∨I_L, ∨I_R, ∨E, w, EFQ, DNE, ∀I, ∀E, ∃I, ∃E
 * 分析的タブロー(AT): α規則, β規則, γ規則, δ規則, 閉じ
 *
 * 変更時は inferenceEdge.test.ts も同期すること。
 * InferenceEdge union型のメンバー追加時は以下のswitch文すべてを更新:
 *   - inferenceEdge.ts の各ユーティリティ関数
 *   - inferenceEdgeLabelLogic.ts の getInferenceEdgeBadgeColor
 *   - edgeBadgeEditLogic.ts の createEditStateFromEdge
 *   - mergeNodesLogic.ts の replaceNodeIdInInferenceEdge
 *   - copyPasteLogic.ts の remapInferenceEdges
 *   - workspaceState.ts の revalidateInferenceConclusions
 */

import type { SubstitutionEntries } from "./substitutionApplicationLogic";
import type { AssumptionId } from "../logic-core/naturalDeduction";
import {
  type TabRuleId,
  getTabRuleDisplayName,
} from "../logic-core/tableauCalculus";
import {
  type AtRuleId,
  getAtRuleDisplayName,
} from "../logic-core/analyticTableau";

// ─── Hilbert系 推論エッジ型 ─────────────────────────────────

/**
 * Modus Ponens エッジ。
 * 2つの前提ノード（antecedent + conditional）から結論ノードへの関係。
 */
export type MPEdge = {
  readonly _tag: "mp";
  /** 結論ノードのID（derivedノード） */
  readonly conclusionNodeId: string;
  /** antecedent（φ）のノードID */
  readonly leftPremiseNodeId: string | undefined;
  /** conditional（φ→ψ）のノードID */
  readonly rightPremiseNodeId: string | undefined;
  /** 結論の論理式テキスト */
  readonly conclusionText: string;
};

/**
 * Generalization エッジ。
 * 1つの前提ノードから ∀x.φ を導出する関係。
 */
export type GenEdge = {
  readonly _tag: "gen";
  /** 結論ノードのID（derivedノード） */
  readonly conclusionNodeId: string;
  /** 前提（φ）のノードID */
  readonly premiseNodeId: string | undefined;
  /** 量化変数名 */
  readonly variableName: string;
  /** 結論の論理式テキスト */
  readonly conclusionText: string;
};

/**
 * Substitution エッジ。
 * 1つの前提ノードにメタ変数代入を適用する関係。
 */
export type SubstitutionEdge = {
  readonly _tag: "substitution";
  /** 結論ノードのID（derivedノード） */
  readonly conclusionNodeId: string;
  /** 前提のノードID */
  readonly premiseNodeId: string | undefined;
  /** 代入エントリリスト */
  readonly entries: SubstitutionEntries;
  /** 結論の論理式テキスト */
  readonly conclusionText: string;
};

/** Hilbert系推論エッジのunion型 */
export type HilbertInferenceEdge = MPEdge | GenEdge | SubstitutionEdge;

// ─── 自然演繹(ND) 推論エッジ型 ─────────────────────────────

/**
 * ND →導入 (→I) エッジ。
 * 仮定φの下でψが証明されたとき、φ→ψを導出し仮定を打ち消す。
 * 1前提 + discharged仮定情報。
 */
export type NdImplicationIntroEdge = {
  readonly _tag: "nd-implication-intro";
  readonly conclusionNodeId: string;
  /** ψを証明する前提ノードのID */
  readonly premiseNodeId: string | undefined;
  /** 打ち消す仮定の論理式テキスト */
  readonly dischargedFormulaText: string;
  /** 打ち消す仮定のID */
  readonly dischargedAssumptionId: AssumptionId;
  readonly conclusionText: string;
};

/**
 * ND →除去 (→E) エッジ。
 * φ と φ→ψ から ψ を導出する。（MPと同等）
 * 2前提。
 */
export type NdImplicationElimEdge = {
  readonly _tag: "nd-implication-elim";
  readonly conclusionNodeId: string;
  /** antecedent（φ）のノードID */
  readonly leftPremiseNodeId: string | undefined;
  /** conditional（φ→ψ）のノードID */
  readonly rightPremiseNodeId: string | undefined;
  readonly conclusionText: string;
};

/**
 * ND ∧導入 (∧I) エッジ。
 * φ と ψ から φ∧ψ を導出する。
 * 2前提。
 */
export type NdConjunctionIntroEdge = {
  readonly _tag: "nd-conjunction-intro";
  readonly conclusionNodeId: string;
  /** 左辺（φ）のノードID */
  readonly leftPremiseNodeId: string | undefined;
  /** 右辺（ψ）のノードID */
  readonly rightPremiseNodeId: string | undefined;
  readonly conclusionText: string;
};

/**
 * ND ∧除去左 (∧E_L) エッジ。
 * φ∧ψ から φ を導出する。
 * 1前提。
 */
export type NdConjunctionElimLeftEdge = {
  readonly _tag: "nd-conjunction-elim-left";
  readonly conclusionNodeId: string;
  /** 前提（φ∧ψ）のノードID */
  readonly premiseNodeId: string | undefined;
  readonly conclusionText: string;
};

/**
 * ND ∧除去右 (∧E_R) エッジ。
 * φ∧ψ から ψ を導出する。
 * 1前提。
 */
export type NdConjunctionElimRightEdge = {
  readonly _tag: "nd-conjunction-elim-right";
  readonly conclusionNodeId: string;
  /** 前提（φ∧ψ）のノードID */
  readonly premiseNodeId: string | undefined;
  readonly conclusionText: string;
};

/**
 * ND ∨導入左 (∨I_L) エッジ。
 * φ から φ∨ψ を導出する。
 * 1前提 + 追加する右辺の論理式テキスト。
 */
export type NdDisjunctionIntroLeftEdge = {
  readonly _tag: "nd-disjunction-intro-left";
  readonly conclusionNodeId: string;
  /** 前提（φ）のノードID */
  readonly premiseNodeId: string | undefined;
  /** 追加する右辺の論理式テキスト */
  readonly addedRightText: string;
  readonly conclusionText: string;
};

/**
 * ND ∨導入右 (∨I_R) エッジ。
 * ψ から φ∨ψ を導出する。
 * 1前提 + 追加する左辺の論理式テキスト。
 */
export type NdDisjunctionIntroRightEdge = {
  readonly _tag: "nd-disjunction-intro-right";
  readonly conclusionNodeId: string;
  /** 前提（ψ）のノードID */
  readonly premiseNodeId: string | undefined;
  /** 追加する左辺の論理式テキスト */
  readonly addedLeftText: string;
  readonly conclusionText: string;
};

/**
 * ND ∨除去 (∨E) エッジ。
 * φ∨ψ と、φからχの証明、ψからχの証明から、χを導出する。
 * 3前提 + 2つのdischarged仮定。
 */
export type NdDisjunctionElimEdge = {
  readonly _tag: "nd-disjunction-elim";
  readonly conclusionNodeId: string;
  /** 前提: φ∨ψ のノードID */
  readonly disjunctionPremiseNodeId: string | undefined;
  /** 前提: φからχの証明のノードID */
  readonly leftCasePremiseNodeId: string | undefined;
  /** 打ち消す左仮定のID */
  readonly leftDischargedAssumptionId: AssumptionId;
  /** 前提: ψからχの証明のノードID */
  readonly rightCasePremiseNodeId: string | undefined;
  /** 打ち消す右仮定のID */
  readonly rightDischargedAssumptionId: AssumptionId;
  readonly conclusionText: string;
};

/**
 * ND 弱化 (w) エッジ。
 * φ と ψ から φ を導出する（ψを捨てる）。
 * 2前提。
 */
export type NdWeakeningEdge = {
  readonly _tag: "nd-weakening";
  readonly conclusionNodeId: string;
  /** 残す方の前提ノードID */
  readonly keptPremiseNodeId: string | undefined;
  /** 捨てる方の前提ノードID */
  readonly discardedPremiseNodeId: string | undefined;
  readonly conclusionText: string;
};

/**
 * ND EFQ (爆発律) エッジ。
 * ⊥ から任意のφを導出する。NJの追加規則。
 * 1前提。
 */
export type NdEfqEdge = {
  readonly _tag: "nd-efq";
  readonly conclusionNodeId: string;
  /** 前提（⊥の証明）のノードID */
  readonly premiseNodeId: string | undefined;
  readonly conclusionText: string;
};

/**
 * ND DNE (二重否定除去) エッジ。
 * ¬¬φ から φ を導出する。NKの追加規則。
 * 1前提。
 */
export type NdDneEdge = {
  readonly _tag: "nd-dne";
  readonly conclusionNodeId: string;
  /** 前提（¬¬φ）のノードID */
  readonly premiseNodeId: string | undefined;
  readonly conclusionText: string;
};

/**
 * ND ∀導入 (∀I) エッジ。
 * φ から ∀x.φ を導出する。
 * 固有変数条件: x は未打ち消し仮定の自由変数に現れてはならない。
 * 1前提 + 量化変数名。
 */
export type NdUniversalIntroEdge = {
  readonly _tag: "nd-universal-intro";
  readonly conclusionNodeId: string;
  /** 前提（φ）のノードID */
  readonly premiseNodeId: string | undefined;
  /** 量化変数名 */
  readonly variableName: string;
  readonly conclusionText: string;
};

/**
 * ND ∀除去 (∀E) エッジ。
 * ∀x.φ から φ[t/x] を導出する。
 * 代入可能性条件: t は φ において x に対して自由 (free-for)。
 * 1前提 + 代入項テキスト。
 */
export type NdUniversalElimEdge = {
  readonly _tag: "nd-universal-elim";
  readonly conclusionNodeId: string;
  /** 前提（∀x.φ）のノードID */
  readonly premiseNodeId: string | undefined;
  /** 代入する項のテキスト */
  readonly termText: string;
  readonly conclusionText: string;
};

/**
 * ND ∃導入 (∃I) エッジ。
 * φ[t/x] から ∃x.φ を導出する。
 * 1前提 + 量化変数名 + 代入項テキスト。
 * 前提が φ[t/x] の形であることを確認し、∃x.φ を構築する。
 */
export type NdExistentialIntroEdge = {
  readonly _tag: "nd-existential-intro";
  readonly conclusionNodeId: string;
  /** 前提（φ[t/x]）のノードID */
  readonly premiseNodeId: string | undefined;
  /** 量化変数名 */
  readonly variableName: string;
  /** 代入する項のテキスト（前提中で一般化される項） */
  readonly termText: string;
  readonly conclusionText: string;
};

/**
 * ND ∃除去 (∃E) エッジ。
 * ∃x.φ と仮定φの下でのχの証明から、χを導出する。
 * 固有変数条件: x は χ にも未打ち消し仮定にも自由に現れてはならない。
 * 2前提 + discharged仮定情報 + 量化変数名。
 */
export type NdExistentialElimEdge = {
  readonly _tag: "nd-existential-elim";
  readonly conclusionNodeId: string;
  /** 前提: ∃x.φ のノードID */
  readonly existentialPremiseNodeId: string | undefined;
  /** 前提: φの仮定の下でのχの証明のノードID */
  readonly casePremiseNodeId: string | undefined;
  /** 打ち消す仮定のID（φに対応） */
  readonly dischargedAssumptionId: AssumptionId;
  /** 打ち消す仮定の論理式テキスト */
  readonly dischargedFormulaText: string;
  readonly conclusionText: string;
};

/** ND推論エッジのunion型 */
export type NdInferenceEdge =
  | NdImplicationIntroEdge
  | NdImplicationElimEdge
  | NdConjunctionIntroEdge
  | NdConjunctionElimLeftEdge
  | NdConjunctionElimRightEdge
  | NdDisjunctionIntroLeftEdge
  | NdDisjunctionIntroRightEdge
  | NdDisjunctionElimEdge
  | NdWeakeningEdge
  | NdEfqEdge
  | NdDneEdge
  | NdUniversalIntroEdge
  | NdUniversalElimEdge
  | NdExistentialIntroEdge
  | NdExistentialElimEdge;

// ─── TAB (タブロー式シーケント計算) 推論エッジ型 ─────────

/**
 * TAB 1前提規則エッジ。
 * 結論シーケントノードから、1つの前提シーケントノードへの関係。
 * 対象規則: e, ¬¬, ∧, ¬∨, ¬→, ∀, ¬∀, ∃, ¬∃
 */
export type TabSinglePremiseEdge = {
  readonly _tag: "tab-single";
  /** 適用された規則 */
  readonly ruleId: TabRuleId;
  /** 結論シーケントノードのID */
  readonly conclusionNodeId: string;
  /** 前提シーケントノードのID */
  readonly premiseNodeId: string | undefined;
  /** 前提シーケントのテキスト（自動計算結果） */
  readonly conclusionText: string;
  /** 追加パラメータ: 固有変数名（¬∀, ∃規則用） */
  readonly eigenVariable?: string;
  /** 追加パラメータ: 代入項テキスト（∀, ¬∃規則用） */
  readonly termText?: string;
  /** 追加パラメータ: 交換位置（e規則用） */
  readonly exchangePosition?: number;
};

/**
 * TAB 2前提（分岐）規則エッジ。
 * 結論シーケントノードから、2つの前提シーケントノードへの関係。
 * 対象規則: ¬∧, ∨, →
 */
export type TabBranchingEdge = {
  readonly _tag: "tab-branching";
  /** 適用された規則 */
  readonly ruleId: TabRuleId;
  /** 結論シーケントノードのID */
  readonly conclusionNodeId: string;
  /** 左前提シーケントノードのID */
  readonly leftPremiseNodeId: string | undefined;
  /** 右前提シーケントノードのID */
  readonly rightPremiseNodeId: string | undefined;
  /** 左前提シーケントのテキスト */
  readonly leftConclusionText: string;
  /** 右前提シーケントのテキスト */
  readonly rightConclusionText: string;
  /** conclusionTextは左前提テキストをフォールバックとして使用 */
  readonly conclusionText: string;
};

/**
 * TAB 公理（0前提）マークエッジ。
 * シーケントノードが公理（BS or ⊥）であることを示す。
 * 前提なし。
 * 対象規則: bs, bottom
 */
export type TabAxiomEdge = {
  readonly _tag: "tab-axiom";
  /** 適用された規則 */
  readonly ruleId: TabRuleId;
  /** 公理ノードのID */
  readonly conclusionNodeId: string;
  /** 公理テキスト */
  readonly conclusionText: string;
};

/** TAB推論エッジのunion型 */
export type TabInferenceEdge =
  | TabSinglePremiseEdge
  | TabBranchingEdge
  | TabAxiomEdge;

// ─── 分析的タブロー(AT) 推論エッジ型 ─────────────────────

/**
 * AT α規則エッジ（非分岐）。
 * 規則適用元のノード（conclusionNodeId）から1-2個の結論ノードを同一枝上に追加する。
 * conclusionNodeId = 規則が適用されるノード（既存のInferenceEdgeの慣例に合わせる）。
 * 生成されるノード: resultNodeId（1つ目）、secondResultNodeId（2つ目、ある場合）。
 */
export type AtAlphaEdge = {
  readonly _tag: "at-alpha";
  /** 適用された規則 */
  readonly ruleId: AtRuleId;
  /** 規則適用元ノード（署名付き論理式）のID */
  readonly conclusionNodeId: string;
  /** 生成されたノードのID（1つ目） */
  readonly resultNodeId: string | undefined;
  /** 生成されたノードのID（2つ目、2個結論の場合） */
  readonly secondResultNodeId: string | undefined;
  /** 結論テキスト（規則適用元の署名付き論理式テキスト） */
  readonly conclusionText: string;
  /** 生成された結論テキスト（1つ目） */
  readonly resultText: string;
  /** 生成された結論テキスト（2つ目） */
  readonly secondResultText: string | undefined;
};

/**
 * AT β規則エッジ（分岐）。
 * 規則適用元のノードから2つの枝に分岐する。
 */
export type AtBetaEdge = {
  readonly _tag: "at-beta";
  /** 適用された規則 */
  readonly ruleId: AtRuleId;
  /** 規則適用元ノード（署名付き論理式）のID */
  readonly conclusionNodeId: string;
  /** 左枝結論ノードのID */
  readonly leftResultNodeId: string | undefined;
  /** 右枝結論ノードのID */
  readonly rightResultNodeId: string | undefined;
  /** 結論テキスト（規則適用元の署名付き論理式テキスト） */
  readonly conclusionText: string;
  /** 左枝結論テキスト */
  readonly leftResultText: string;
  /** 右枝結論テキスト */
  readonly rightResultText: string;
};

/**
 * AT γ規則エッジ（全称量化子、任意項で代入）。
 * 規則適用元のノードから1つの結論ノードを生成する。
 */
export type AtGammaEdge = {
  readonly _tag: "at-gamma";
  /** 適用された規則 */
  readonly ruleId: AtRuleId;
  /** 規則適用元ノードのID */
  readonly conclusionNodeId: string;
  /** 生成されたノードのID */
  readonly resultNodeId: string | undefined;
  /** 結論テキスト（規則適用元） */
  readonly conclusionText: string;
  /** 生成された結論テキスト */
  readonly resultText: string;
  /** 代入項テキスト */
  readonly termText: string;
};

/**
 * AT δ規則エッジ（存在量化子、固有変数条件）。
 * 規則適用元のノードから1つの結論ノードを生成する。
 */
export type AtDeltaEdge = {
  readonly _tag: "at-delta";
  /** 適用された規則 */
  readonly ruleId: AtRuleId;
  /** 規則適用元ノードのID */
  readonly conclusionNodeId: string;
  /** 生成されたノードのID */
  readonly resultNodeId: string | undefined;
  /** 結論テキスト（規則適用元） */
  readonly conclusionText: string;
  /** 生成された結論テキスト */
  readonly resultText: string;
  /** 固有変数名 */
  readonly eigenVariable: string;
};

/**
 * AT 閉じマークエッジ（公理に相当）。
 * 枝上に T(φ) と F(φ) が存在することを示す。
 * conclusionNodeIdは閉じマークを付けるノード。
 */
export type AtClosedEdge = {
  readonly _tag: "at-closed";
  /** 適用された規則 */
  readonly ruleId: "closure";
  /** 閉じマークを付けるノードのID */
  readonly conclusionNodeId: string;
  /** 矛盾の相手ノードのID */
  readonly contradictionNodeId: string;
  /** 結論テキスト（他のエッジとの整合性のため） */
  readonly conclusionText: string;
};

/** AT推論エッジのunion型 */
export type AtInferenceEdge =
  | AtAlphaEdge
  | AtBetaEdge
  | AtGammaEdge
  | AtDeltaEdge
  | AtClosedEdge;

// ─── 統合union型 ─────────────────────────────────────────

/** 推論エッジの union 型（Hilbert系 + ND + TAB + AT） */
export type InferenceEdge =
  | HilbertInferenceEdge
  | NdInferenceEdge
  | TabInferenceEdge
  | AtInferenceEdge;

// ─── 判別ヘルパー ────────────────────────────────────────

/** Hilbert系のエッジかどうかを判定する */
export function isHilbertInferenceEdge(edge: InferenceEdge) {
  return (
    edge._tag === "mp" || edge._tag === "gen" || edge._tag === "substitution"
  );
}

/** NDのエッジかどうかを判定する */
export function isNdInferenceEdge(edge: InferenceEdge) {
  return (
    edge._tag === "nd-implication-intro" ||
    edge._tag === "nd-implication-elim" ||
    edge._tag === "nd-conjunction-intro" ||
    edge._tag === "nd-conjunction-elim-left" ||
    edge._tag === "nd-conjunction-elim-right" ||
    edge._tag === "nd-disjunction-intro-left" ||
    edge._tag === "nd-disjunction-intro-right" ||
    edge._tag === "nd-disjunction-elim" ||
    edge._tag === "nd-weakening" ||
    edge._tag === "nd-efq" ||
    edge._tag === "nd-dne" ||
    edge._tag === "nd-universal-intro" ||
    edge._tag === "nd-universal-elim" ||
    edge._tag === "nd-existential-intro" ||
    edge._tag === "nd-existential-elim"
  );
}

/** TABのエッジかどうかを判定する */
export function isTabInferenceEdge(edge: InferenceEdge) {
  return (
    edge._tag === "tab-single" ||
    edge._tag === "tab-branching" ||
    edge._tag === "tab-axiom"
  );
}

/** ATのエッジかどうかを判定する */
export function isAtInferenceEdge(edge: InferenceEdge) {
  return (
    edge._tag === "at-alpha" ||
    edge._tag === "at-beta" ||
    edge._tag === "at-gamma" ||
    edge._tag === "at-delta" ||
    edge._tag === "at-closed"
  );
}

// ─── ユーティリティ ──────────────────────────────────────

/**
 * 指定ノードIDに関連する推論エッジを検索する。
 * ノードが前提として使われている推論エッジ、または
 * ノード自身が結論ノードである場合のエッジを返す。
 */
export function findInferenceEdgesForNode(
  edges: readonly InferenceEdge[],
  nodeId: string,
): readonly InferenceEdge[] {
  return edges.filter((edge) => {
    // 結論ノード自身
    if (edge.conclusionNodeId === nodeId) return true;

    // 前提として使われている
    return getInferenceEdgePremiseNodeIds(edge).includes(nodeId);
  });
}

/**
 * 推論エッジから結論ノードIDを取得する。
 */
export function getInferenceEdgeConclusionNodeId(edge: InferenceEdge): string {
  return edge.conclusionNodeId;
}

/**
 * 推論エッジの表示ラベル（規則名）を返す。
 */
export function getInferenceEdgeLabel(edge: InferenceEdge): string {
  switch (edge._tag) {
    // Hilbert系
    case "mp":
      return "MP";
    case "gen":
      return edge.variableName !== ""
        ? `Gen(${edge.variableName satisfies string})`
        : "Gen";
    case "substitution":
      return edge.entries.length > 0
        ? `Subst(${String(edge.entries.length) satisfies string})`
        : "Subst";
    // ND
    case "nd-implication-intro":
      return "→I";
    case "nd-implication-elim":
      return "→E";
    case "nd-conjunction-intro":
      return "∧I";
    case "nd-conjunction-elim-left":
      return "∧E_L";
    case "nd-conjunction-elim-right":
      return "∧E_R";
    case "nd-disjunction-intro-left":
      return "∨I_L";
    case "nd-disjunction-intro-right":
      return "∨I_R";
    case "nd-disjunction-elim":
      return "∨E";
    case "nd-weakening":
      return "w";
    case "nd-efq":
      return "EFQ";
    case "nd-dne":
      return "DNE";
    case "nd-universal-intro":
      return edge.variableName !== ""
        ? `∀I(${edge.variableName satisfies string})`
        : "∀I";
    case "nd-universal-elim":
      return edge.termText !== ""
        ? `∀E(${edge.termText satisfies string})`
        : "∀E";
    case "nd-existential-intro":
      return edge.variableName !== ""
        ? `∃I(${edge.variableName satisfies string})`
        : "∃I";
    case "nd-existential-elim":
      return "∃E";
    // TAB
    case "tab-single":
      return getTabRuleDisplayName(edge.ruleId);
    case "tab-branching":
      return getTabRuleDisplayName(edge.ruleId);
    case "tab-axiom":
      return getTabRuleDisplayName(edge.ruleId);
    // AT
    case "at-alpha":
      return getAtRuleDisplayName(edge.ruleId);
    case "at-beta":
      return getAtRuleDisplayName(edge.ruleId);
    case "at-gamma":
      return getAtRuleDisplayName(edge.ruleId);
    case "at-delta":
      return getAtRuleDisplayName(edge.ruleId);
    case "at-closed":
      return getAtRuleDisplayName(edge.ruleId);
  }
}

/**
 * 接続先ノードIDに対応する推論エッジを検索する。
 * 結論ノードIDが一致するエッジを返す。
 */
export function findInferenceEdgeForConclusionNode(
  edges: readonly InferenceEdge[],
  conclusionNodeId: string,
): InferenceEdge | undefined {
  return edges.find((e) => e.conclusionNodeId === conclusionNodeId);
}

/**
 * 推論エッジの前提ノードIDを全て取得する。
 * undefinedの前提は除外する。
 */
export function getInferenceEdgePremiseNodeIds(
  edge: InferenceEdge,
): readonly string[] {
  switch (edge._tag) {
    // Hilbert系
    case "mp": {
      const ids: string[] = [];
      if (edge.leftPremiseNodeId !== undefined) {
        ids.push(edge.leftPremiseNodeId);
      }
      if (edge.rightPremiseNodeId !== undefined) {
        ids.push(edge.rightPremiseNodeId);
      }
      return ids;
    }
    case "gen":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    case "substitution":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    // ND 1前提系
    case "nd-implication-intro":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    case "nd-conjunction-elim-left":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    case "nd-conjunction-elim-right":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    case "nd-disjunction-intro-left":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    case "nd-disjunction-intro-right":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    case "nd-efq":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    case "nd-dne":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    case "nd-universal-intro":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    case "nd-universal-elim":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    case "nd-existential-intro":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    // ND 2前提系
    case "nd-implication-elim": {
      const ids: string[] = [];
      if (edge.leftPremiseNodeId !== undefined) {
        ids.push(edge.leftPremiseNodeId);
      }
      if (edge.rightPremiseNodeId !== undefined) {
        ids.push(edge.rightPremiseNodeId);
      }
      return ids;
    }
    case "nd-conjunction-intro": {
      const ids: string[] = [];
      if (edge.leftPremiseNodeId !== undefined) {
        ids.push(edge.leftPremiseNodeId);
      }
      if (edge.rightPremiseNodeId !== undefined) {
        ids.push(edge.rightPremiseNodeId);
      }
      return ids;
    }
    case "nd-weakening": {
      const ids: string[] = [];
      if (edge.keptPremiseNodeId !== undefined) {
        ids.push(edge.keptPremiseNodeId);
      }
      if (edge.discardedPremiseNodeId !== undefined) {
        ids.push(edge.discardedPremiseNodeId);
      }
      return ids;
    }
    case "nd-existential-elim": {
      const ids: string[] = [];
      if (edge.existentialPremiseNodeId !== undefined) {
        ids.push(edge.existentialPremiseNodeId);
      }
      if (edge.casePremiseNodeId !== undefined) {
        ids.push(edge.casePremiseNodeId);
      }
      return ids;
    }
    // ND 3前提系
    case "nd-disjunction-elim": {
      const ids: string[] = [];
      if (edge.disjunctionPremiseNodeId !== undefined) {
        ids.push(edge.disjunctionPremiseNodeId);
      }
      if (edge.leftCasePremiseNodeId !== undefined) {
        ids.push(edge.leftCasePremiseNodeId);
      }
      if (edge.rightCasePremiseNodeId !== undefined) {
        ids.push(edge.rightCasePremiseNodeId);
      }
      return ids;
    }
    // TAB
    case "tab-single":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    case "tab-branching": {
      const ids: string[] = [];
      if (edge.leftPremiseNodeId !== undefined) {
        ids.push(edge.leftPremiseNodeId);
      }
      if (edge.rightPremiseNodeId !== undefined) {
        ids.push(edge.rightPremiseNodeId);
      }
      return ids;
    }
    case "tab-axiom":
      return [];
    // AT: conclusionNodeId = 規則適用元ノード、生成ノードが結果
    // 生成ノードは premiseNodeIds ではなく結果ノード
    case "at-alpha": {
      const ids: string[] = [];
      if (edge.resultNodeId !== undefined) ids.push(edge.resultNodeId);
      if (edge.secondResultNodeId !== undefined)
        ids.push(edge.secondResultNodeId);
      return ids;
    }
    case "at-beta": {
      const ids: string[] = [];
      if (edge.leftResultNodeId !== undefined) ids.push(edge.leftResultNodeId);
      if (edge.rightResultNodeId !== undefined)
        ids.push(edge.rightResultNodeId);
      return ids;
    }
    case "at-gamma":
      return edge.resultNodeId !== undefined ? [edge.resultNodeId] : [];
    case "at-delta":
      return edge.resultNodeId !== undefined ? [edge.resultNodeId] : [];
    case "at-closed":
      return [edge.contradictionNodeId];
  }
}

/**
 * 推論エッジ内の全ノードIDをマッピング関数で置換する。
 * conclusionNodeIdと全前提ノードIDに対してmapFnを適用する。
 * mapFnがundefinedを返した場合はそのIDのフィールドにはundefinedが設定される。
 */
export function remapEdgeNodeIds(
  edge: InferenceEdge,
  mapFn: (id: string) => string | undefined,
): InferenceEdge {
  const mapRequired = (id: string): string => mapFn(id) ?? id;
  const mapOpt = (id: string | undefined): string | undefined =>
    id !== undefined ? mapFn(id) : undefined;

  switch (edge._tag) {
    // Hilbert系
    case "mp":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        leftPremiseNodeId: mapOpt(edge.leftPremiseNodeId),
        rightPremiseNodeId: mapOpt(edge.rightPremiseNodeId),
      };
    case "gen":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    case "substitution":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    // ND 1前提系
    case "nd-implication-intro":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    case "nd-conjunction-elim-left":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    case "nd-conjunction-elim-right":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    case "nd-disjunction-intro-left":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    case "nd-disjunction-intro-right":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    case "nd-efq":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    case "nd-dne":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    case "nd-universal-intro":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    case "nd-universal-elim":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    case "nd-existential-intro":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    // ND 2前提系
    case "nd-implication-elim":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        leftPremiseNodeId: mapOpt(edge.leftPremiseNodeId),
        rightPremiseNodeId: mapOpt(edge.rightPremiseNodeId),
      };
    case "nd-conjunction-intro":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        leftPremiseNodeId: mapOpt(edge.leftPremiseNodeId),
        rightPremiseNodeId: mapOpt(edge.rightPremiseNodeId),
      };
    case "nd-weakening":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        keptPremiseNodeId: mapOpt(edge.keptPremiseNodeId),
        discardedPremiseNodeId: mapOpt(edge.discardedPremiseNodeId),
      };
    case "nd-existential-elim":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        existentialPremiseNodeId: mapOpt(edge.existentialPremiseNodeId),
        casePremiseNodeId: mapOpt(edge.casePremiseNodeId),
      };
    // ND 3前提系
    case "nd-disjunction-elim":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        disjunctionPremiseNodeId: mapOpt(edge.disjunctionPremiseNodeId),
        leftCasePremiseNodeId: mapOpt(edge.leftCasePremiseNodeId),
        rightCasePremiseNodeId: mapOpt(edge.rightCasePremiseNodeId),
      };
    // TAB
    case "tab-single":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    case "tab-branching":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        leftPremiseNodeId: mapOpt(edge.leftPremiseNodeId),
        rightPremiseNodeId: mapOpt(edge.rightPremiseNodeId),
      };
    case "tab-axiom":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
      };
    // AT
    case "at-alpha":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        resultNodeId: mapOpt(edge.resultNodeId),
        secondResultNodeId: mapOpt(edge.secondResultNodeId),
      };
    case "at-beta":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        leftResultNodeId: mapOpt(edge.leftResultNodeId),
        rightResultNodeId: mapOpt(edge.rightResultNodeId),
      };
    case "at-gamma":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        resultNodeId: mapOpt(edge.resultNodeId),
      };
    case "at-delta":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        resultNodeId: mapOpt(edge.resultNodeId),
      };
    case "at-closed":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        contradictionNodeId: mapRequired(edge.contradictionNodeId),
      };
  }
}

/**
 * 推論エッジ内のノードIDを置換する。
 * oldId → newId に置き換える。
 */
export function replaceNodeIdInEdge(
  edge: InferenceEdge,
  oldId: string,
  newId: string,
): InferenceEdge {
  return remapEdgeNodeIds(edge, (id) => (id === oldId ? newId : id));
}
