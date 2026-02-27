/**
 * 推論エッジの型定義と既存ノードベースからの抽出ユーティリティ。
 *
 * 推論規則（MP, Gen, Substitution）をノードではなくエッジとして表現するための
 * 新しいデータモデル。段階的移行の第一歩として、既存のWorkspaceStateから
 * InferenceEdgeを抽出する純粋関数を提供する。
 *
 * 変更時は inferenceEdge.test.ts も同期すること。
 */

import type { SubstitutionEntries } from "./substitutionApplicationLogic";
import type { WorkspaceState, WorkspaceNode } from "./workspaceState";

// --- 推論エッジ型 ---

/**
 * Modus Ponens エッジ。
 * 2つの前提ノード（antecedent + conditional）から結論ノードへの関係。
 */
export type MPEdge = {
  readonly _tag: "mp";
  /** MPノードID（現在のノードベースとの対応付け用。将来的に廃止） */
  readonly ruleNodeId: string;
  /** antecedent（φ）のノードID */
  readonly leftPremiseNodeId: string | undefined;
  /** conditional（φ→ψ）のノードID */
  readonly rightPremiseNodeId: string | undefined;
  /** 結論の論理式テキスト（MPノードのformulaText） */
  readonly conclusionText: string;
};

/**
 * Generalization エッジ。
 * 1つの前提ノードから ∀x.φ を導出する関係。
 */
export type GenEdge = {
  readonly _tag: "gen";
  /** GenノードID（現在のノードベースとの対応付け用。将来的に廃止） */
  readonly ruleNodeId: string;
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
  /** 代入ノードID（現在のノードベースとの対応付け用。将来的に廃止） */
  readonly ruleNodeId: string;
  /** 前提のノードID */
  readonly premiseNodeId: string | undefined;
  /** 代入エントリリスト */
  readonly entries: SubstitutionEntries;
  /** 結論の論理式テキスト */
  readonly conclusionText: string;
};

/** 推論エッジの union 型 */
export type InferenceEdge = MPEdge | GenEdge | SubstitutionEdge;

// --- 既存ノードベースからの抽出 ---

/**
 * MPノードからMPEdgeを抽出する。
 * 接続からpremise-left/premise-rightのノードIDを探索する。
 */
function extractMPEdge(node: WorkspaceNode, state: WorkspaceState): MPEdge {
  let leftPremiseNodeId: string | undefined;
  let rightPremiseNodeId: string | undefined;

  for (const conn of state.connections) {
    if (conn.toNodeId === node.id) {
      if (conn.toPortId === "premise-left") {
        leftPremiseNodeId = conn.fromNodeId;
      } else if (conn.toPortId === "premise-right") {
        rightPremiseNodeId = conn.fromNodeId;
      }
    }
  }

  return {
    _tag: "mp",
    ruleNodeId: node.id,
    leftPremiseNodeId,
    rightPremiseNodeId,
    conclusionText: node.formulaText,
  };
}

/**
 * GenノードからGenEdgeを抽出する。
 * 接続からpremiseのノードIDを探索する。
 */
function extractGenEdge(node: WorkspaceNode, state: WorkspaceState): GenEdge {
  let premiseNodeId: string | undefined;

  for (const conn of state.connections) {
    if (conn.toNodeId === node.id && conn.toPortId === "premise") {
      premiseNodeId = conn.fromNodeId;
    }
  }

  return {
    _tag: "gen",
    ruleNodeId: node.id,
    premiseNodeId,
    variableName: node.genVariableName ?? "",
    conclusionText: node.formulaText,
  };
}

/**
 * SubstitutionノードからSubstitutionEdgeを抽出する。
 * 接続からpremiseのノードIDを探索する。
 */
function extractSubstitutionEdge(
  node: WorkspaceNode,
  state: WorkspaceState,
): SubstitutionEdge {
  let premiseNodeId: string | undefined;

  for (const conn of state.connections) {
    if (conn.toNodeId === node.id && conn.toPortId === "premise") {
      premiseNodeId = conn.fromNodeId;
    }
  }

  return {
    _tag: "substitution",
    ruleNodeId: node.id,
    premiseNodeId,
    entries: node.substitutionEntries ?? [],
    conclusionText: node.formulaText,
  };
}

/**
 * 既存のWorkspaceStateから推論エッジを抽出する純粋関数。
 *
 * 現在のノードベース表現（kind: "mp" / "gen" / "substitution"）を走査し、
 * 各推論ノードと接続からInferenceEdgeを構築する。
 *
 * 段階的移行の橋渡し: 既存データ → 新しいエッジベース表現。
 */
export function extractInferenceEdges(
  state: WorkspaceState,
): readonly InferenceEdge[] {
  const edges: InferenceEdge[] = [];

  for (const node of state.nodes) {
    switch (node.kind) {
      case "mp":
        edges.push(extractMPEdge(node, state));
        break;
      case "gen":
        edges.push(extractGenEdge(node, state));
        break;
      case "substitution":
        edges.push(extractSubstitutionEdge(node, state));
        break;
      case "axiom":
      case "conclusion":
        // 推論規則ではないノードはスキップ
        break;
    }
  }

  return edges;
}

/**
 * 指定ノードIDに関連する推論エッジを検索する。
 * ノードが前提として使われている推論エッジ、または
 * ノード自身が推論ノードである場合のエッジを返す。
 */
export function findInferenceEdgesForNode(
  edges: readonly InferenceEdge[],
  nodeId: string,
): readonly InferenceEdge[] {
  return edges.filter((edge) => {
    // 推論ノード自身
    if (edge.ruleNodeId === nodeId) return true;

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
 * 推論エッジから結論ノードID（現在の推論ノードID）を取得する。
 * 段階的移行中は推論ノードが結論を保持しているため、ruleNodeIdを返す。
 */
export function getInferenceEdgeConclusionNodeId(edge: InferenceEdge): string {
  return edge.ruleNodeId;
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
