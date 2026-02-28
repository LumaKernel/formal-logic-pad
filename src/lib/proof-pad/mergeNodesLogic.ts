/**
 * ノードマージの純粋ロジック。
 *
 * 同一の論理式を持つ複数ノードを1つに統合する。
 * リーダーノード（先に選択された方）が保持され、
 * 吸収されるノードのコネクション（定理として利用されている立場）は
 * リーダーに付け替えられる。
 *
 * 変更時は mergeNodesLogic.test.ts, workspaceState.ts, index.ts も同期すること。
 */

import type { InferenceEdge } from "./inferenceEdge";
import { replaceNodeIdInEdge } from "./inferenceEdge";
import type { WorkspaceNode, WorkspaceConnection } from "./workspaceState";

// --- マージ結果型 ---

/** マージ不可理由 */
export type MergeError =
  | { readonly _tag: "NotEnoughNodes" }
  | { readonly _tag: "FormulaTextMismatch" }
  | { readonly _tag: "ProtectedNode"; readonly nodeId: string };

/** マージ結果 */
export type MergeResult =
  | { readonly _tag: "Error"; readonly error: MergeError }
  | {
      readonly _tag: "Success";
      /** マージ後のノード一覧 */
      readonly nodes: readonly WorkspaceNode[];
      /** マージ後のコネクション一覧 */
      readonly connections: readonly WorkspaceConnection[];
      /** マージ後のInferenceEdge一覧 */
      readonly inferenceEdges: readonly InferenceEdge[];
      /** 保持されたリーダーノードのID */
      readonly leaderNodeId: string;
      /** 吸収されたノードのID一覧 */
      readonly absorbedNodeIds: readonly string[];
    };

// --- ユーティリティ ---

/**
 * コネクションIDを再計算する。
 * ノードIDが変わった場合にコネクションIDも更新する必要がある。
 */
function regenerateConnectionId(conn: WorkspaceConnection): string {
  return `conn-${conn.fromNodeId satisfies string}-${conn.fromPortId satisfies string}-${conn.toNodeId satisfies string}-${conn.toPortId satisfies string}`;
}

/** @see replaceNodeIdInEdge in inferenceEdge.ts */

// --- メインロジック ---

/**
 * 複数ノードを1つにマージする。
 *
 * @param leaderNodeId リーダーノードのID（このノードが保持される）
 * @param absorbedNodeIds 吸収されるノードのID一覧
 * @param allNodes 全ノード
 * @param allConnections 全コネクション
 * @param allInferenceEdges 全InferenceEdge
 * @param protectedNodeIds 保護されたノードID（マージ対象に含められない）
 * @returns マージ結果
 */
export function mergeNodes(
  leaderNodeId: string,
  absorbedNodeIds: readonly string[],
  allNodes: readonly WorkspaceNode[],
  allConnections: readonly WorkspaceConnection[],
  allInferenceEdges: readonly InferenceEdge[],
  protectedNodeIds: ReadonlySet<string>,
): MergeResult {
  // --- バリデーション ---

  if (absorbedNodeIds.length === 0) {
    return { _tag: "Error", error: { _tag: "NotEnoughNodes" } };
  }

  const leaderNode = allNodes.find((n) => n.id === leaderNodeId);
  if (!leaderNode) {
    return { _tag: "Error", error: { _tag: "NotEnoughNodes" } };
  }

  // 保護ノードチェック
  if (protectedNodeIds.has(leaderNodeId)) {
    return {
      _tag: "Error",
      error: { _tag: "ProtectedNode", nodeId: leaderNodeId },
    };
  }

  const absorbedNodes: WorkspaceNode[] = [];
  for (const id of absorbedNodeIds) {
    if (protectedNodeIds.has(id)) {
      return { _tag: "Error", error: { _tag: "ProtectedNode", nodeId: id } };
    }
    const node = allNodes.find((n) => n.id === id);
    if (!node) {
      return { _tag: "Error", error: { _tag: "NotEnoughNodes" } };
    }
    absorbedNodes.push(node);
  }

  // 論理式テキストの一致チェック
  for (const absorbed of absorbedNodes) {
    if (absorbed.formulaText !== leaderNode.formulaText) {
      return { _tag: "Error", error: { _tag: "FormulaTextMismatch" } };
    }
  }

  const absorbedIdSet = new Set(absorbedNodeIds);

  // --- ノードの統合 ---

  // 吸収されるノードを除外
  const mergedNodes = allNodes.filter((n) => !absorbedIdSet.has(n.id));

  // --- InferenceEdgeの統合 ---

  // 吸収されたノードが結論(conclusionNodeId)であるInferenceEdgeは削除
  // （リーダーが自分のInferenceEdgeを持っている場合はそれを保持）
  // 吸収されたノードが前提(premiseNodeId等)であるInferenceEdgeはリーダーに付替え
  let mergedEdges = allInferenceEdges.filter(
    (edge) => !absorbedIdSet.has(edge.conclusionNodeId),
  );

  // 前提ノードIDの付替え: absorbed → leader
  for (const absorbedId of absorbedNodeIds) {
    mergedEdges = mergedEdges.map((edge) =>
      replaceNodeIdInEdge(edge, absorbedId, leaderNodeId),
    );
  }

  // --- コネクションの統合 ---

  // 1. 吸収されたノードへの入力コネクション（derive元）は削除
  //    （リーダーは自分のderiveを保持）
  // 2. 吸収されたノードからの出力コネクション（定理として利用）は
  //    リーダーからの出力に付替え

  const mergedConnections: WorkspaceConnection[] = [];
  const seenConnectionKeys = new Set<string>();

  // リーダーの既存コネクションキーを先に登録（重複排除）
  for (const conn of allConnections) {
    if (!absorbedIdSet.has(conn.fromNodeId) && !absorbedIdSet.has(conn.toNodeId)) {
      const key = `${conn.fromNodeId satisfies string}-${conn.fromPortId satisfies string}-${conn.toNodeId satisfies string}-${conn.toPortId satisfies string}`;
      seenConnectionKeys.add(key);
      mergedConnections.push(conn);
    }
  }

  // 吸収されたノードのコネクションを処理
  for (const conn of allConnections) {
    const isFromAbsorbed = absorbedIdSet.has(conn.fromNodeId);
    const isToAbsorbed = absorbedIdSet.has(conn.toNodeId);

    if (!isFromAbsorbed && !isToAbsorbed) {
      // 無関係 → 既に追加済み
      continue;
    }

    if (isToAbsorbed) {
      // 入力コネクション（derive元） → 削除
      // リーダーは自分のderiveを既に持っている
      continue;
    }

    if (isFromAbsorbed) {
      // 出力コネクション（定理として使われている） → リーダーに付替え
      const rewired: WorkspaceConnection = {
        ...conn,
        fromNodeId: leaderNodeId,
      };
      const newId = regenerateConnectionId(rewired);
      const key = `${rewired.fromNodeId satisfies string}-${rewired.fromPortId satisfies string}-${rewired.toNodeId satisfies string}-${rewired.toPortId satisfies string}`;

      // 重複チェック（リーダーが既に同じ接続を持っている場合はスキップ）
      if (!seenConnectionKeys.has(key)) {
        seenConnectionKeys.add(key);
        mergedConnections.push({ ...rewired, id: newId });
      }
    }
  }

  return {
    _tag: "Success",
    nodes: mergedNodes,
    connections: mergedConnections,
    inferenceEdges: mergedEdges,
    leaderNodeId,
    absorbedNodeIds,
  };
}

/**
 * マージ可能かどうかを判定する。
 *
 * 選択されたノード群の中で同一のformulaTextを持つノードがあればマージ可能。
 * @returns マージ可能なグループ（leaderNodeId + absorbedNodeIds）のリスト、
 *          またはマージ不可の場合は空配列。
 */
export function findMergeableGroups(
  selectedNodeIds: readonly string[],
  allNodes: readonly WorkspaceNode[],
  protectedNodeIds: ReadonlySet<string>,
): readonly {
  readonly leaderNodeId: string;
  readonly absorbedNodeIds: readonly string[];
}[] {
  if (selectedNodeIds.length < 2) return [];

  // 選択されたノードをformulaTextでグループ化
  const groups = new Map<string, string[]>();
  for (const nodeId of selectedNodeIds) {
    if (protectedNodeIds.has(nodeId)) continue;
    const node = allNodes.find((n) => n.id === nodeId);
    if (!node) continue;
    const existing = groups.get(node.formulaText);
    if (existing) {
      existing.push(nodeId);
    } else {
      groups.set(node.formulaText, [nodeId]);
    }
  }

  // 2つ以上のノードがあるグループのみ返す
  const result: {
    readonly leaderNodeId: string;
    readonly absorbedNodeIds: readonly string[];
  }[] = [];
  for (const [, nodeIds] of groups) {
    if (nodeIds.length >= 2) {
      // 先頭がリーダー（選択順序が反映される前提）
      const [leader, ...absorbed] = nodeIds;
      result.push({ leaderNodeId: leader, absorbedNodeIds: absorbed });
    }
  }

  return result;
}

/**
 * 選択されたノード群がマージ可能かどうかを判定する。
 * マージ可能なグループが1つでもあればtrue。
 */
export function canMergeSelectedNodes(
  selectedNodeIds: readonly string[],
  allNodes: readonly WorkspaceNode[],
  protectedNodeIds: ReadonlySet<string>,
): boolean {
  return (
    findMergeableGroups(selectedNodeIds, allNodes, protectedNodeIds).length > 0
  );
}
