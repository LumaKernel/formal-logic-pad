/**
 * ノードの役割（公理/ゴール）分類の純粋ロジック。
 *
 * ワークスペース上のノードが公理かゴールかを判定する。
 * - ルートノード（前提への入力接続がないノード）は暗黙的に公理
 * - 明示的にマークされたノードはその役割を優先
 * - 未証明で公理マークされていないルートノードはゴール候補
 *
 * 変更時は nodeRoleLogic.test.ts, workspaceState.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import type { WorkspaceNode, WorkspaceConnection } from "./workspaceState";

// --- ノードの明示的な役割マーク ---

/**
 * ユーザーが明示的に設定するノードの役割。
 * - "axiom": 公理としてマーク（証明不要であることを宣言）
 * - "goal": ゴールとしてマーク（証明すべき対象であることを宣言）
 * - undefined: 自動判定（デフォルト）
 */
export type NodeRole = "axiom" | "goal";

// --- 推論されるノードの状態 ---

/**
 * ノードの推論された分類。
 * - "root-axiom": ルートノードで公理としてマーク/自動判定
 * - "root-goal": ルートノードでゴールとしてマーク
 * - "root-unmarked": ルートノードで未マーク（公理パレットから追加されたaxiom kindノードなどは暗黙公理）
 * - "derived": 他のノードから導出された（前提接続あり）
 */
export type NodeClassification =
  | "root-axiom"
  | "root-goal"
  | "root-unmarked"
  | "derived";

/**
 * ノードがルート（前提への入力接続がない）かどうかを判定する。
 *
 * ルートノード = どのノードからも入力を受けていないノード。
 * つまり、toNodeId がそのノードであるような接続が存在しない。
 */
export function isRootNode(
  nodeId: string,
  connections: readonly WorkspaceConnection[],
): boolean {
  return !connections.some((c) => c.toNodeId === nodeId);
}

/**
 * ノードの分類を推論する。
 *
 * @param node ワークスペースノード
 * @param connections ワークスペースの全接続
 * @returns ノードの分類
 */
export function classifyNode(
  node: WorkspaceNode,
  connections: readonly WorkspaceConnection[],
): NodeClassification {
  // kind: "derived" は常に derived（InferenceEdge経由で前提を持つ）
  if (node.kind === "derived") {
    return "derived";
  }

  const isRoot = isRootNode(node.id, connections);

  if (!isRoot) {
    return "derived";
  }

  // ルートノードの場合: 明示的マークを確認
  if (node.role === "axiom") {
    return "root-axiom";
  }
  if (node.role === "goal") {
    return "root-goal";
  }

  // 未マーク: axiom kind のノードは暗黙的に公理
  return "root-unmarked";
}

/**
 * ワークスペース上のすべてのノードを分類する。
 *
 * @param nodes ワークスペースの全ノード
 * @param connections ワークスペースの全接続
 * @returns ノードID → 分類のMap
 */
export function classifyAllNodes(
  nodes: readonly WorkspaceNode[],
  connections: readonly WorkspaceConnection[],
): ReadonlyMap<string, NodeClassification> {
  const result = new Map<string, NodeClassification>();
  for (const node of nodes) {
    result.set(node.id, classifyNode(node, connections));
  }
  return result;
}

/**
 * ゴールとして分類されたノードのIDリストを返す。
 * 明示的にゴールとしてマークされたルートノードのみ。
 */
export function getGoalNodeIds(
  nodes: readonly WorkspaceNode[],
  connections: readonly WorkspaceConnection[],
): readonly string[] {
  return nodes
    .filter((node) => classifyNode(node, connections) === "root-goal")
    .map((node) => node.id);
}

/**
 * 公理として扱われるノードのIDリストを返す。
 * 明示的にマークされた公理 + 未マークのルートノード（暗黙公理）。
 */
export function getAxiomNodeIds(
  nodes: readonly WorkspaceNode[],
  connections: readonly WorkspaceConnection[],
): readonly string[] {
  return nodes
    .filter((node) => {
      const classification = classifyNode(node, connections);
      return (
        classification === "root-axiom" || classification === "root-unmarked"
      );
    })
    .map((node) => node.id);
}
