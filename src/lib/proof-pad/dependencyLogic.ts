/**
 * ノードの依存関係・サブツリーを追跡する純粋ロジック。
 *
 * - getNodeDependencies: InferenceEdgeを逆方向に遡り、ルートノード（公理）を特定
 * - getSubtreeNodeIds: InferenceEdgeを順方向に辿り、子孫ノードを収集
 * - getNodeAxiomIds: ノードが依存する公理スキーマIDを特定
 *
 * 変更時は dependencyLogic.test.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import type { LogicSystem, AxiomId } from "../logic-core/inferenceRule";
import { identifyAxiom } from "../logic-core/inferenceRule";
import { parseString } from "../logic-lang/parser";
import type { WorkspaceNode } from "./workspaceState";
import type { InferenceEdge } from "./inferenceEdge";
import { getInferenceEdgePremiseNodeIds } from "./inferenceEdge";

/**
 * あるノードが依存するルートノード（公理）のID集合を返す。
 *
 * InferenceEdgeを逆方向に辿り、前提のないルートノードに到達するまで再帰的に探索する。
 * ルートノード自身は自分自身のIDのみを含む集合を返す。
 * 循環参照がある場合は訪問済みノードをスキップして無限ループを防止する。
 *
 * @param nodeId 対象ノードのID
 * @param nodes ワークスペースの全ノード
 * @param inferenceEdges ワークスペースの全推論エッジ
 * @returns 依存するルートノードIDの集合（ReadonlySet）
 */
export function getNodeDependencies(
  nodeId: string,
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
): ReadonlySet<string> {
  const result = new Set<string>();
  const visited = new Set<string>();

  // conclusionNodeId → InferenceEdge のマップを構築
  const edgeByConclusionId = new Map<string, InferenceEdge>();
  for (const edge of inferenceEdges) {
    edgeByConclusionId.set(edge.conclusionNodeId, edge);
  }

  function traverse(currentId: string): void {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    // このノードを結論とする InferenceEdge を探す
    const edge = edgeByConclusionId.get(currentId);
    if (edge === undefined) {
      // InferenceEdge がない = ルートノード（前提なし）
      result.add(currentId);
      return;
    }

    // 前提ノードIDを取得して再帰的に辿る
    const premiseIds = getInferenceEdgePremiseNodeIds(edge);
    if (premiseIds.length === 0) {
      // 前提が未設定（undefined）のエッジ → ルートとして扱う
      result.add(currentId);
      return;
    }

    for (const premiseId of premiseIds) {
      traverse(premiseId);
    }
  }

  // ノードが存在するか確認
  const node = nodes.find((n) => n.id === nodeId);
  if (node === undefined) return result;

  traverse(nodeId);
  return result;
}

/**
 * ワークスペース上のすべてのノードの公理依存関係を計算する。
 *
 * @param nodes ワークスペースの全ノード
 * @param inferenceEdges ワークスペースの全推論エッジ
 * @returns ノードID → 依存するルートノードIDの集合のMap
 */
export function getAllNodeDependencies(
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
): ReadonlyMap<string, ReadonlySet<string>> {
  const result = new Map<string, ReadonlySet<string>>();
  for (const node of nodes) {
    result.set(node.id, getNodeDependencies(node.id, nodes, inferenceEdges));
  }
  return result;
}

/**
 * あるノードとその全子孫（サブツリー）のID集合を返す。
 *
 * InferenceEdgeを順方向（前提 → 結論）に辿り、
 * 指定ノードから到達可能なすべてのノードを収集する。
 * DAG構造で共有されたノード（複数の親を持つ）も含む。
 * 循環参照がある場合は訪問済みノードをスキップして無限ループを防止する。
 *
 * @param nodeId 起点ノードのID
 * @param inferenceEdges ワークスペースの全推論エッジ
 * @returns サブツリーに含まれるノードIDの集合（起点ノード自身を含む）
 */
export function getSubtreeNodeIds(
  nodeId: string,
  inferenceEdges: readonly InferenceEdge[],
): ReadonlySet<string> {
  const result = new Set<string>([nodeId]);

  // premiseNodeId → 結論ノードIDのマッピングを構築
  const conclusionsByPremise = new Map<string, string[]>();
  for (const edge of inferenceEdges) {
    const premiseIds = getInferenceEdgePremiseNodeIds(edge);
    for (const premiseId of premiseIds) {
      const existing = conclusionsByPremise.get(premiseId);
      if (existing !== undefined) {
        existing.push(edge.conclusionNodeId);
      } else {
        conclusionsByPremise.set(premiseId, [edge.conclusionNodeId]);
      }
    }
  }

  function traverse(currentId: string): void {
    const conclusions = conclusionsByPremise.get(currentId);
    if (conclusions === undefined) return;
    for (const conclusionId of conclusions) {
      if (!result.has(conclusionId)) {
        result.add(conclusionId);
        traverse(conclusionId);
      }
    }
  }

  traverse(nodeId);
  return result;
}

// --- 公理スキーマID依存関係 ---

/**
 * あるノードが依存する公理スキーマID（A1, A2, A3, ...）の集合を返す。
 *
 * 1. getNodeDependencies でルートノードIDを取得
 * 2. 各ルートノードの formulaText をパースして identifyAxiom で公理スキーマIDを特定
 * 3. 特定できなかったノードは結果に含まない
 *
 * @param nodeId 対象ノードのID
 * @param nodes ワークスペースの全ノード
 * @param inferenceEdges ワークスペースの全推論エッジ
 * @param system 論理体系設定
 * @returns 依存する公理スキーマIDの集合
 */
export function getNodeAxiomIds(
  nodeId: string,
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
  system: LogicSystem,
): ReadonlySet<AxiomId> {
  const rootNodeIds = getNodeDependencies(nodeId, nodes, inferenceEdges);
  const result = new Set<AxiomId>();

  for (const rootId of rootNodeIds) {
    const node = nodes.find((n) => n.id === rootId);
    if (node === undefined) continue;

    const trimmed = node.formulaText.trim();
    if (trimmed === "") continue;

    const parsed = parseString(trimmed);
    if (!parsed.ok) continue;

    const identification = identifyAxiom(parsed.formula, system);
    if (identification._tag === "Ok") {
      result.add(identification.axiomId);
    }
  }

  return result;
}
