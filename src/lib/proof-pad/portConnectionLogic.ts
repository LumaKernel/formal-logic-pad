/**
 * ポートドラッグ接続の純粋バリデーションロジック。
 *
 * ドラッグによるポート間接続の妥当性を検証する。
 * 変更時は portConnectionLogic.test.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import type { WorkspaceState, WorkspaceConnection } from "./workspaceState";
import { getProofNodePorts } from "./proofNodeUI";
import { findNode } from "./workspaceState";

/**
 * ポートが出力ポート（bottom edge）かどうかを判定する。
 * ProofWorkspaceのポート定義では、bottom edge のポートが出力、top edge のポートが入力。
 */
export function isOutputPort(nodeKind: string, portId: string): boolean {
  // "out" ポートIDは常に出力ポート
  return portId === "out";
}

/**
 * ポートが入力ポート（top edge）かどうかを判定する。
 */
export function isInputPort(nodeKind: string, portId: string): boolean {
  return !isOutputPort(nodeKind, portId);
}

/**
 * 入力ポートが既に接続済みかどうかを判定する。
 * 入力ポートは1つのソースのみ受け付ける。
 */
export function isInputPortOccupied(
  connections: readonly WorkspaceConnection[],
  targetNodeId: string,
  targetPortId: string,
): boolean {
  return connections.some(
    (c) => c.toNodeId === targetNodeId && c.toPortId === targetPortId,
  );
}

/**
 * 2つのポート間の接続が有効かどうかを検証する。
 *
 * ルール:
 * 1. 自己接続不可
 * 2. output → input の方向のみ（逆方向は無効）
 * 3. 入力ポートが既に接続済みの場合は無効
 * 4. 完全に同一の接続は無効（重複防止）
 */
export function validatePortConnection(
  workspace: WorkspaceState,
  sourceNodeId: string,
  sourcePortId: string,
  targetNodeId: string,
  targetPortId: string,
): boolean {
  // 1. 自己接続不可
  if (sourceNodeId === targetNodeId) return false;

  // ノード存在確認
  const sourceNode = findNode(workspace, sourceNodeId);
  const targetNode = findNode(workspace, targetNodeId);
  if (!sourceNode || !targetNode) return false;

  // ポート存在確認
  const sourcePorts = getProofNodePorts(sourceNode.kind);
  const targetPorts = getProofNodePorts(targetNode.kind);
  if (!sourcePorts.some((p) => p.id === sourcePortId)) return false;
  if (!targetPorts.some((p) => p.id === targetPortId)) return false;

  // 2. output → input の方向のみ
  if (!isOutputPort(sourceNode.kind, sourcePortId)) return false;
  if (!isInputPort(targetNode.kind, targetPortId)) return false;

  // 3. 入力ポートが既に接続済みの場合は無効
  if (isInputPortOccupied(workspace.connections, targetNodeId, targetPortId))
    return false;

  // 4. 完全に同一の接続は重複防止（入力ポートの占有チェックで通常は弾かれるが、防御的に残す）
  /* v8 ignore start -- occupiedチェックで先に弾かれるため到達不能だが防御的コード */
  if (
    workspace.connections.some(
      (c) =>
        c.fromNodeId === sourceNodeId &&
        c.fromPortId === sourcePortId &&
        c.toNodeId === targetNodeId &&
        c.toPortId === targetPortId,
    )
  )
    return false;
  /* v8 ignore stop */

  return true;
}

/**
 * ドラッグ接続のバリデーション。
 * ドラッグ元がinputポートの場合は方向を反転して検証する。
 * これにより、inputポートからドラッグを開始してoutputポートにドロップする操作もサポートする。
 *
 * @returns 検証結果。有効な場合は正規化された接続方向（常に output → input）を返す。
 */
export function validateDragConnection(
  workspace: WorkspaceState,
  dragSourceNodeId: string,
  dragSourcePortId: string,
  dragTargetNodeId: string,
  dragTargetPortId: string,
):
  | {
      readonly valid: true;
      readonly fromNodeId: string;
      readonly fromPortId: string;
      readonly toNodeId: string;
      readonly toPortId: string;
    }
  | { readonly valid: false } {
  // ノード存在確認
  const sourceNode = findNode(workspace, dragSourceNodeId);
  const targetNode = findNode(workspace, dragTargetNodeId);
  if (!sourceNode || !targetNode) return { valid: false };

  // ドラッグ元が出力ポートの場合: そのまま検証
  if (isOutputPort(sourceNode.kind, dragSourcePortId)) {
    if (
      validatePortConnection(
        workspace,
        dragSourceNodeId,
        dragSourcePortId,
        dragTargetNodeId,
        dragTargetPortId,
      )
    ) {
      return {
        valid: true,
        fromNodeId: dragSourceNodeId,
        fromPortId: dragSourcePortId,
        toNodeId: dragTargetNodeId,
        toPortId: dragTargetPortId,
      };
    }
    return { valid: false };
  }

  // ドラッグ元が入力ポートの場合: 方向を反転して検証
  if (
    validatePortConnection(
      workspace,
      dragTargetNodeId,
      dragTargetPortId,
      dragSourceNodeId,
      dragSourcePortId,
    )
  ) {
    return {
      valid: true,
      fromNodeId: dragTargetNodeId,
      fromPortId: dragTargetPortId,
      toNodeId: dragSourceNodeId,
      toPortId: dragSourcePortId,
    };
  }
  return { valid: false };
}
