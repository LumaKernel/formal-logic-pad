/**
 * 推論エッジの型定義とユーティリティ。
 *
 * 推論規則（MP, Gen, Substitution）をノードではなくエッジとして表現するデータモデル。
 * InferenceEdgeはWorkspaceState.inferenceEdgesに直接保持され、
 * ノードの種別（ProofNodeKind）からは独立して管理される。
 *
 * 変更時は inferenceEdge.test.ts も同期すること。
 */

import type { SubstitutionEntries } from "./substitutionApplicationLogic";

// --- 推論エッジ型 ---

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

/** 推論エッジの union 型 */
export type InferenceEdge = MPEdge | GenEdge | SubstitutionEdge;

// --- ユーティリティ ---

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
    switch (edge._tag) {
      case "mp":
        return (
          edge.leftPremiseNodeId === nodeId ||
          edge.rightPremiseNodeId === nodeId
        );
      case "gen":
        return edge.premiseNodeId === nodeId;
      case "substitution":
        return edge.premiseNodeId === nodeId;
    }
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
 * MP: "MP"
 * Gen: "Gen(x)" （xは量化変数名）
 * Substitution: "Subst" + エントリ数
 */
export function getInferenceEdgeLabel(edge: InferenceEdge): string {
  switch (edge._tag) {
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
  }
}
