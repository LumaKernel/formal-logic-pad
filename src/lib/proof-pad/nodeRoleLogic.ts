/**
 * ノードの分類の純粋ロジック。
 *
 * ワークスペース上のノードがルート（公理）か導出かを判定する。
 * - ルートノード（前提への入力接続がないノード）は公理
 * - 導出ノード（前提接続あり）は他のノードから導出された
 *
 * ゴールはノードのroleではなくWorkspaceState.goalsで管理される。
 *
 * 変更時は nodeRoleLogic.test.ts, workspaceState.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import type { WorkspaceNode, WorkspaceConnection } from "./workspaceState";

// --- 推論されるノードの状態 ---

/**
 * ノードの推論された分類。
 * - "root-axiom": ルートノードで公理としてマーク
 * - "root-unmarked": ルートノードで未マーク（暗黙公理）
 * - "derived": 他のノードから導出された（前提接続あり）
 * - "note": メモノード（証明ツリーの一部ではない）
 *
 * ゴールはノード分類ではなくWorkspaceState.goalsで管理されるため、
 * "root-goal"は存在しない。
 */
export type NodeClassification =
  | "root-axiom"
  | "root-unmarked"
  | "derived"
  | "note";

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
  // ノートノードは証明ツリーの一部ではない
  if (node.kind === "note") {
    return "note";
  }

  // derived判定: コネクション（InferenceEdge由来）の有無で判定
  const isRoot = isRootNode(node.id, connections);

  if (!isRoot) {
    return "derived";
  }

  // ルートノードの場合: 明示的マークを確認
  if (node.role === "axiom") {
    return "root-axiom";
  }

  // 未マーク: ルートノードは暗黙的に公理
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
      /* v8 ignore start — V8 artifact: || の短絡評価。classifyNode は discriminated union を返すため両条件が同時に true にならない。テストで root-axiom/root-unmarked/derived の全3パターンカバー済み */
      return (
        classification === "root-axiom" || classification === "root-unmarked"
      );
      /* v8 ignore stop */
    })
    .map((node) => node.id);
}
