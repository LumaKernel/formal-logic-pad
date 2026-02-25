/**
 * ノードの公理依存関係を追跡する純粋ロジック。
 *
 * 接続グラフを遡って、各ノードがどのルートノード（公理）に依存しているかを計算する。
 * ルートノード自身は自分自身に依存する。
 *
 * 変更時は dependencyLogic.test.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import type { WorkspaceNode, WorkspaceConnection } from "./workspaceState";
import { isRootNode } from "./nodeRoleLogic";

/**
 * あるノードが依存するルートノード（公理）のID集合を返す。
 *
 * 接続グラフを逆方向に辿り、入力のないルートノードに到達するまで再帰的に探索する。
 * ルートノード自身は自分自身のIDのみを含む集合を返す。
 * 循環参照がある場合は訪問済みノードをスキップして無限ループを防止する。
 *
 * @param nodeId 対象ノードのID
 * @param nodes ワークスペースの全ノード
 * @param connections ワークスペースの全接続
 * @returns 依存するルートノードIDの集合（ReadonlySet）
 */
export function getNodeDependencies(
  nodeId: string,
  nodes: readonly WorkspaceNode[],
  connections: readonly WorkspaceConnection[],
): ReadonlySet<string> {
  const result = new Set<string>();
  const visited = new Set<string>();

  function traverse(currentId: string): void {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    if (isRootNode(currentId, connections)) {
      result.add(currentId);
      return;
    }

    // このノードへの入力接続を見つけて、ソースノードを再帰的に辿る
    const incomingConnections = connections.filter(
      (c) => c.toNodeId === currentId,
    );
    for (const conn of incomingConnections) {
      traverse(conn.fromNodeId);
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
 * @param connections ワークスペースの全接続
 * @returns ノードID → 依存するルートノードIDの集合のMap
 */
export function getAllNodeDependencies(
  nodes: readonly WorkspaceNode[],
  connections: readonly WorkspaceConnection[],
): ReadonlyMap<string, ReadonlySet<string>> {
  const result = new Map<string, ReadonlySet<string>>();
  for (const node of nodes) {
    result.set(
      node.id,
      getNodeDependencies(node.id, nodes, connections),
    );
  }
  return result;
}
