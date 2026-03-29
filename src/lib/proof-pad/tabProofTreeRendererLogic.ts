/**
 * TAB証明木のタブロースタイルレンダリング用純粋ロジック。
 *
 * ワークスペースのノード＋TabInferenceEdgesからタブロースタイル（上から下）の
 * 証明木表示データに変換する。
 *
 * SCのGentzenスタイル（下から上）とは逆方向で、タブロー法の自然な表示方式。
 * - ルート（初期シーケント）が最上部
 * - 規則適用で下方に分解
 * - 公理（BS, ⊥）で枝が閉じる（×マーク）
 *
 * 変更時は tabProofTreeRendererLogic.test.ts, TabProofTreePanel.tsx, index.ts も同期すること。
 */

import type { TabInferenceEdge } from "./inferenceEdge";
import { getInferenceEdgeLabel, isTabInferenceEdge } from "./inferenceEdge";
import type { InferenceEdge } from "./inferenceEdge";
import type { WorkspaceNode } from "./workspaceState";
import { splitByTopLevelComma } from "./tabApplicationLogic";

// --- タブロー証明木表示用データ構造 ---

/** タブロー証明木の枝の状態 */
export type TabBranchStatus = "closed" | "open";

/** タブロースタイル証明木の1ノード */
export type TabTreeDisplayNode = {
  /** ユニークID */
  readonly id: string;
  /** シーケントのテキスト（例: "¬P, P"）— formulaTexts.join(", ") から導出 */
  readonly sequentText: string;
  /** 論理式テキストの配列（ソースオブトゥルース）。例: ["¬P", "P"] */
  readonly formulaTexts: readonly string[];
  /** 適用された規則のラベル（例: "∧", "¬∨"）。ルートノードはundefined */
  readonly ruleLabel: string | undefined;
  /** 子ノードのID配列（0=葉, 1=単項規則, 2=分岐規則） */
  readonly childIds: readonly string[];
  /** 枝の状態: 公理ノードならclosed、それ以外でさらに子がなければopen */
  readonly branchStatus: TabBranchStatus | undefined;
  /** ツリーの深さ（ルートが0） */
  readonly depth: number;
  /** ワークスペースノードID（対応がある場合） */
  readonly workspaceNodeId: string | undefined;
};

/** タブロー証明木全体の表示データ */
export type TabTreeDisplayData = {
  /** ルートノードID */
  readonly rootId: string;
  /** 全ノード（idでアクセス可能） */
  readonly nodes: ReadonlyMap<string, TabTreeDisplayNode>;
};

/** タブロー証明木の統計情報 */
export type TabTreeStats = {
  /** 総ノード数 */
  readonly totalNodes: number;
  /** 最大深さ */
  readonly maxDepth: number;
  /** 閉じた枝の数 */
  readonly closedBranches: number;
  /** 開いた枝の数 */
  readonly openBranches: number;
  /** 使用されている規則の種類 */
  readonly usedRules: readonly string[];
};

// --- ワークスペースグラフ → タブロー証明木変換 ---

/**
 * ワークスペースグラフの解析に必要な中間データ。
 */
type TabGraphAnalysis = {
  /** nodeId → そのノードを結論として持つTABエッジ（ノードから下向きに適用された規則） */
  readonly outgoingEdge: ReadonlyMap<string, TabInferenceEdge>;
  /** nodeId → 表示用テキスト（formulaTexts.join(", ") から導出） */
  readonly nodeTexts: ReadonlyMap<string, string>;
  /** nodeId → そのノードのformulaTexts（ソースオブトゥルース） */
  readonly nodeFormulaTexts: ReadonlyMap<string, readonly string[]>;
  /** ルートノードのID（他のエッジの前提になっていないノード） */
  readonly rootNodeIds: readonly string[];
};

/**
 * TABエッジのみをフィルタしてTabInferenceEdgeとして返す。
 */
function filterTabEdges(
  edges: readonly InferenceEdge[],
): readonly TabInferenceEdge[] {
  return edges.filter(isTabInferenceEdge) as readonly TabInferenceEdge[];
}

/**
 * TABエッジから子ノードID（前提ノード）を取得する。
 */
function getTabChildNodeIds(edge: TabInferenceEdge): readonly string[] {
  if (edge._tag === "tab-single") {
    return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
  }
  if (edge._tag === "tab-branching") {
    const ids: string[] = [];
    if (edge.leftPremiseNodeId !== undefined) {
      ids.push(edge.leftPremiseNodeId);
    }
    if (edge.rightPremiseNodeId !== undefined) {
      ids.push(edge.rightPremiseNodeId);
    }
    return ids;
  }
  // tab-axiom: no children
  return [];
}

/**
 * ワークスペースのノードとTABエッジからグラフ解析データを構築する。
 */
function analyzeTabWorkspaceGraph(
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
): TabGraphAnalysis {
  const tabEdges = filterTabEdges(inferenceEdges);

  // nodeId → outgoing edge (rule applied FROM this node)
  const outgoingEdge = new Map<string, TabInferenceEdge>();
  for (const edge of tabEdges) {
    outgoingEdge.set(edge.conclusionNodeId, edge);
  }

  // nodeId → formulaTexts（ソースオブトゥルース。なければformulaTextからフォールバック分割）
  const nodeFormulaTexts = new Map<string, readonly string[]>();
  // nodeId → 表示用テキスト（formulaTexts から導出）
  const nodeTexts = new Map<string, string>();
  for (const node of nodes) {
    const texts = node.formulaTexts ?? splitByTopLevelComma(node.formulaText);
    nodeFormulaTexts.set(node.id, texts);
    nodeTexts.set(node.id, texts.join(", "));
  }

  // 前提として使われているノードIDの集合
  const childNodeIds = new Set<string>();
  for (const edge of tabEdges) {
    for (const childId of getTabChildNodeIds(edge)) {
      childNodeIds.add(childId);
    }
  }

  // TABに関与するすべてのノードID
  const tabNodeIds = new Set<string>();
  for (const edge of tabEdges) {
    tabNodeIds.add(edge.conclusionNodeId);
    for (const childId of getTabChildNodeIds(edge)) {
      tabNodeIds.add(childId);
    }
  }

  // ルートノード = TABに関与し、他のエッジの前提になっていないノード
  const rootNodeIds: string[] = [];
  for (const nodeId of tabNodeIds) {
    if (!childNodeIds.has(nodeId)) {
      rootNodeIds.push(nodeId);
    }
  }

  return { outgoingEdge, nodeTexts, nodeFormulaTexts, rootNodeIds };
}

/**
 * 指定されたノードIDを起点に、子方向へ再帰的にタブローツリーを構築する。
 * 循環参照は visitedSet で検出して停止する。
 */
function buildTabTreeFromNode(
  nodeId: string,
  analysis: TabGraphAnalysis,
  depth: number,
  nodes: Map<string, TabTreeDisplayNode>,
  visited: Set<string>,
  nextIdRef: { value: number },
  ruleLabel: string | undefined,
): string {
  const id = `tabtree-${String(nextIdRef.value++) satisfies string}`;
  const formulaTexts = analysis.nodeFormulaTexts.get(nodeId) ?? [];
  const sequentText = analysis.nodeTexts.get(nodeId) ?? nodeId;

  // 循環参照ガード
  if (visited.has(nodeId)) {
    nodes.set(id, {
      id,
      sequentText,
      formulaTexts,
      ruleLabel,
      childIds: [],
      branchStatus: undefined,
      depth,
      workspaceNodeId: nodeId,
    });
    return id;
  }
  visited.add(nodeId);

  const edge = analysis.outgoingEdge.get(nodeId);

  if (edge === undefined) {
    // 葉ノード（規則未適用 = 開いた枝）
    nodes.set(id, {
      id,
      sequentText,
      formulaTexts,
      ruleLabel,
      childIds: [],
      branchStatus: "open",
      depth,
      workspaceNodeId: nodeId,
    });
    return id;
  }

  // 公理ノード（BS, ⊥）
  if (edge._tag === "tab-axiom") {
    nodes.set(id, {
      id,
      sequentText,
      formulaTexts,
      ruleLabel,
      childIds: [],
      branchStatus: "closed",
      depth,
      workspaceNodeId: nodeId,
    });
    return id;
  }

  // 子ノードを再帰的に構築
  const childNodeIds = getTabChildNodeIds(edge);
  const childLabel = getInferenceEdgeLabel(edge);
  const childDisplayIds = childNodeIds.map((childId) =>
    buildTabTreeFromNode(
      childId,
      analysis,
      depth + 1,
      nodes,
      visited,
      nextIdRef,
      childLabel,
    ),
  );

  nodes.set(id, {
    id,
    sequentText,
    formulaTexts,
    ruleLabel,
    childIds: childDisplayIds,
    branchStatus: undefined,
    depth,
    workspaceNodeId: nodeId,
  });

  return id;
}

/**
 * ワークスペースの特定ノードを起点にTABタブロー証明木の表示データを構築する。
 */
export function convertTabWorkspaceToTreeDisplay(
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
  rootNodeId: string,
): TabTreeDisplayData {
  const analysis = analyzeTabWorkspaceGraph(nodes, inferenceEdges);
  const displayNodes = new Map<string, TabTreeDisplayNode>();
  const visited = new Set<string>();
  const nextIdRef = { value: 0 };

  const rootId = buildTabTreeFromNode(
    rootNodeId,
    analysis,
    0,
    displayNodes,
    visited,
    nextIdRef,
    undefined,
  );

  return { rootId, nodes: displayNodes };
}

/**
 * ワークスペースから自動的にルートノードを検出し、タブロー証明木を構築する。
 * 複数のルートがある場合は最初のものを使用。見つからない場合はnullを返す。
 */
export function convertTabWorkspaceToTreeDisplayAuto(
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
): TabTreeDisplayData | null {
  const analysis = analyzeTabWorkspaceGraph(nodes, inferenceEdges);

  if (analysis.rootNodeIds.length === 0) return null;

  const rootNodeId = analysis.rootNodeIds[0]!;

  const displayNodes = new Map<string, TabTreeDisplayNode>();
  const visited = new Set<string>();
  const nextIdRef = { value: 0 };

  const rootId = buildTabTreeFromNode(
    rootNodeId,
    analysis,
    0,
    displayNodes,
    visited,
    nextIdRef,
    undefined,
  );

  return { rootId, nodes: displayNodes };
}

/**
 * ワークスペースからTABタブロー証明木のルートノードID一覧を返す。
 */
export function findTabTreeRoots(
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
): readonly string[] {
  const analysis = analyzeTabWorkspaceGraph(nodes, inferenceEdges);
  return analysis.rootNodeIds;
}

// --- ツリー統計 ---

/**
 * タブロー証明木の統計情報を計算する。
 */
export function computeTabTreeStats(data: TabTreeDisplayData): TabTreeStats {
  let maxDepth = 0;
  let closedBranches = 0;
  let openBranches = 0;
  const usedRulesSet = new Set<string>();

  for (const node of data.nodes.values()) {
    if (node.depth > maxDepth) maxDepth = node.depth;
    if (node.ruleLabel !== undefined) {
      usedRulesSet.add(node.ruleLabel);
    }
    if (node.branchStatus === "closed") closedBranches++;
    if (node.branchStatus === "open") openBranches++;
  }

  return {
    totalNodes: data.nodes.size,
    maxDepth,
    closedBranches,
    openBranches,
    usedRules: [...usedRulesSet].sort(),
  };
}
