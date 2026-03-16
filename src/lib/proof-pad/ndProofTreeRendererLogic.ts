/**
 * ND証明木のGentzenスタイルレンダリング用純粋ロジック。
 *
 * ワークスペースのノード＋InferenceEdgesからGentzenスタイル証明木の表示データに変換する。
 * SCの scProofTreeRendererLogic.ts と同じ ProofTreeDisplayData 型を出力し、
 * UIコンポーネントを共有できるようにする。
 *
 * 変更時は ndProofTreeRendererLogic.test.ts, NdProofTreePanel.tsx, index.ts も同期すること。
 */

import type { NdInferenceEdge } from "./inferenceEdge";
import {
  getInferenceEdgeLabel,
  getInferenceEdgePremiseNodeIds,
  isNdInferenceEdge,
} from "./inferenceEdge";
import type { InferenceEdge } from "./inferenceEdge";
import type { WorkspaceNode } from "./workspaceState";
import type {
  ProofTreeDisplayData,
  ProofTreeDisplayNode,
  ProofTreeStats,
} from "./scProofTreeRendererLogic";
import { computeProofTreeStats } from "./scProofTreeRendererLogic";

// re-export for convenience
export { computeProofTreeStats };
export type { ProofTreeDisplayData, ProofTreeDisplayNode, ProofTreeStats };

// --- ND規則のGentzenスタイルラベル ---

/**
 * NDのInferenceEdgeからGentzen証明木で使う規則ラベルに変換する。
 * getInferenceEdgeLabelのラッパーだが、discharge情報を含む簡潔な形式。
 */
export function getNdRuleLabel(edge: NdInferenceEdge): string {
  return getInferenceEdgeLabel(edge);
}

// --- ワークスペースグラフ → 証明木変換 ---

/**
 * ワークスペースグラフの解析に必要な中間データ。
 */
type GraphAnalysis = {
  /** nodeId → そのノードを結論として持つNDエッジ */
  readonly derivingEdge: ReadonlyMap<string, NdInferenceEdge>;
  /** nodeId → そのノードのformulaText */
  readonly nodeTexts: ReadonlyMap<string, string>;
  /** ゴールノードのID一覧（推論の結論であり、他のエッジの前提に使われていないノード） */
  readonly leafNodeIds: readonly string[];
};

/**
 * ワークスペースのノードとNDエッジからグラフ解析データを構築する。
 */
function analyzeWorkspaceGraph(
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
): GraphAnalysis {
  const ndEdges = inferenceEdges.filter(isNdInferenceEdge);

  // nodeId → deriving edge
  const derivingEdge = new Map<string, NdInferenceEdge>();
  for (const edge of ndEdges) {
    derivingEdge.set(edge.conclusionNodeId, edge);
  }

  // nodeId → formulaText
  const nodeTexts = new Map<string, string>();
  for (const node of nodes) {
    nodeTexts.set(node.id, node.formulaText);
  }

  // 前提として使われているノードIDの集合
  const premiseNodeIds = new Set<string>();
  for (const edge of ndEdges) {
    for (const pid of getInferenceEdgePremiseNodeIds(edge)) {
      premiseNodeIds.add(pid);
    }
  }

  // リーフノード = 推論の結論であり、他のエッジの前提に使われていないノード
  // OR ゴール関連ノード（推論結果ノードのうち末端）
  const derivedNodeIds = new Set(derivingEdge.keys());
  const leafNodeIds: string[] = [];
  for (const nodeId of derivedNodeIds) {
    if (!premiseNodeIds.has(nodeId)) {
      leafNodeIds.push(nodeId);
    }
  }

  return { derivingEdge, nodeTexts, leafNodeIds };
}

/**
 * 指定されたノードIDを起点に、前提方向へ再帰的にツリーを構築する。
 * 循環参照は visitedSet で検出して停止する。
 */
function buildTreeFromNode(
  nodeId: string,
  analysis: GraphAnalysis,
  depth: number,
  nodes: Map<string, ProofTreeDisplayNode>,
  visited: Set<string>,
  nextIdRef: { value: number },
): string {
  const id = `ndtree-${String(nextIdRef.value++) satisfies string}`;

  // 循環参照ガード
  if (visited.has(nodeId)) {
    nodes.set(id, {
      id,
      conclusionText: analysis.nodeTexts.get(nodeId) ?? nodeId,
      ruleLabel: "…",
      premiseIds: [],
      depth,
    });
    return id;
  }
  visited.add(nodeId);

  const edge = analysis.derivingEdge.get(nodeId);

  if (edge === undefined) {
    // 仮定ノード（推論されていない＝葉）
    nodes.set(id, {
      id,
      conclusionText: analysis.nodeTexts.get(nodeId) ?? nodeId,
      ruleLabel: "Asm",
      premiseIds: [],
      depth,
    });
    return id;
  }

  // 前提ノードを再帰的に構築
  const premiseNodeIds = getInferenceEdgePremiseNodeIds(edge);
  const premiseDisplayIds = premiseNodeIds.map((pid) =>
    buildTreeFromNode(pid, analysis, depth + 1, nodes, visited, nextIdRef),
  );

  nodes.set(id, {
    id,
    conclusionText: analysis.nodeTexts.get(nodeId) ?? nodeId,
    ruleLabel: getNdRuleLabel(edge),
    premiseIds: premiseDisplayIds,
    depth,
  });

  return id;
}

/**
 * ワークスペースの特定ノードを起点にND証明木の表示データを構築する。
 *
 * rootNodeId から前提方向へ再帰的にツリーを辿り、
 * Gentzenスタイルの証明木表示データに変換する。
 */
export function convertNdWorkspaceToProofTree(
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
  rootNodeId: string,
): ProofTreeDisplayData {
  const analysis = analyzeWorkspaceGraph(nodes, inferenceEdges);
  const displayNodes = new Map<string, ProofTreeDisplayNode>();
  const visited = new Set<string>();
  const nextIdRef = { value: 0 };

  const rootId = buildTreeFromNode(
    rootNodeId,
    analysis,
    0,
    displayNodes,
    visited,
    nextIdRef,
  );

  return { rootId, nodes: displayNodes };
}

/**
 * ワークスペースから自動的にルートノードを検出し、証明木を構築する。
 *
 * ルートノード = 推論結果であり、他のエッジの前提に使われていないノード。
 * 複数ある場合は最初のものを使用。見つからない場合はnullを返す。
 */
export function convertNdWorkspaceToProofTreeAuto(
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
): ProofTreeDisplayData | null {
  const analysis = analyzeWorkspaceGraph(nodes, inferenceEdges);

  if (analysis.leafNodeIds.length === 0) return null;

  // 最初のリーフノードをルートとして使用
  const rootNodeId = analysis.leafNodeIds[0]!;

  const displayNodes = new Map<string, ProofTreeDisplayNode>();
  const visited = new Set<string>();
  const nextIdRef = { value: 0 };

  const rootId = buildTreeFromNode(
    rootNodeId,
    analysis,
    0,
    displayNodes,
    visited,
    nextIdRef,
  );

  return { rootId, nodes: displayNodes };
}

/**
 * ワークスペースからND証明木の候補ルートノードID一覧を返す。
 * 推論結果であり、他のエッジの前提に使われていないノード。
 */
export function findNdProofTreeRoots(
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
): readonly string[] {
  const analysis = analyzeWorkspaceGraph(nodes, inferenceEdges);
  return analysis.leafNodeIds;
}
