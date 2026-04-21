/**
 * WorkspaceState ↔ React Flow 変換アダプター。
 *
 * WorkspaceState の nodes/connections を React Flow の Node[]/Edge[] に変換し、
 * React Flow の NodeChange[] から WorkspaceState の位置更新を逆変換する。
 *
 * 純粋関数のみ。UIなし。
 *
 * 変更時は reactFlowAdapter.test.ts, index.ts も同期すること。
 */

import type { Node as RFNode, Edge as RFEdge, Viewport } from "@xyflow/react";
import type { WorkspaceNode, WorkspaceConnection } from "./workspaceState";
import type { Point } from "../infinite-canvas/types";
import type { NodeClassification } from "./nodeRoleLogic";
import { classifyNode } from "./nodeRoleLogic";
import {
  getNodeClassificationEdgeColor,
  getProofNodePorts,
} from "./proofNodeUI";
import type { ConnectorPort } from "../infinite-canvas/connector";
import type { InferenceEdge } from "./inferenceEdge";

// --- React Flow カスタムノード/エッジのデータ型 ---

/** React Flow ノードに埋め込むカスタムデータ */
export type ProofNodeData = {
  readonly workspaceNode: WorkspaceNode;
  readonly classification: NodeClassification;
  readonly ports: readonly ConnectorPort[];
};

/** React Flow エッジに埋め込むカスタムデータ */
export type ProofEdgeData = {
  readonly connection: WorkspaceConnection;
  readonly color: string;
  readonly inferenceEdge: InferenceEdge | undefined;
};

// --- ノード変換 ---

/**
 * 単一の WorkspaceNode を React Flow Node に変換する。
 */
export function workspaceNodeToRFNode(
  node: WorkspaceNode,
  connections: readonly WorkspaceConnection[],
): RFNode<ProofNodeData> {
  const classification = classifyNode(node, connections);
  const ports = getProofNodePorts(node.kind);
  return {
    id: node.id,
    type: "proofNode",
    position: { x: node.position.x, y: node.position.y },
    data: {
      workspaceNode: node,
      classification,
      ports,
    },
  };
}

/**
 * WorkspaceState の全ノードを React Flow Node[] に変換する。
 */
export function workspaceNodesToRFNodes(
  nodes: readonly WorkspaceNode[],
  connections: readonly WorkspaceConnection[],
): readonly RFNode<ProofNodeData>[] {
  return nodes.map((node) => workspaceNodeToRFNode(node, connections));
}

// --- エッジ変換 ---

/**
 * 単一の WorkspaceConnection を React Flow Edge に変換する。
 */
export function workspaceConnectionToRFEdge(
  connection: WorkspaceConnection,
  nodes: readonly WorkspaceNode[],
  connections: readonly WorkspaceConnection[],
  inferenceEdges: readonly InferenceEdge[],
): RFEdge<ProofEdgeData> {
  const fromNode = nodes.find((n) => n.id === connection.fromNodeId);
  const fromClassification = fromNode
    ? classifyNode(fromNode, connections)
    : ("root-unmarked" as const);
  const color = getNodeClassificationEdgeColor(fromClassification);
  const inferenceEdge = inferenceEdges.find(
    (e) => e.conclusionNodeId === connection.toNodeId,
  );

  return {
    id: connection.id,
    type: "proofEdge",
    source: connection.fromNodeId,
    target: connection.toNodeId,
    sourceHandle: connection.fromPortId,
    targetHandle: connection.toPortId,
    data: {
      connection,
      color,
      inferenceEdge,
    },
  };
}

/**
 * WorkspaceState の全コネクションを React Flow Edge[] に変換する。
 */
export function workspaceConnectionsToRFEdges(
  connections: readonly WorkspaceConnection[],
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
): readonly RFEdge<ProofEdgeData>[] {
  return connections.map((conn) =>
    workspaceConnectionToRFEdge(conn, nodes, connections, inferenceEdges),
  );
}

// --- 逆変換: 位置更新 ---

/**
 * React Flow のノード位置変更を WorkspaceNode[] に適用する。
 *
 * 変更のあったノードだけ position を更新し、新しい配列を返す。
 * 変更がなければ同じ参照を返す（参照等価性の維持）。
 */
export function applyRFNodePositions(
  nodes: readonly WorkspaceNode[],
  positionUpdates: ReadonlyMap<string, Point>,
): readonly WorkspaceNode[] {
  if (positionUpdates.size === 0) {
    return nodes;
  }

  let changed = false;
  const result = nodes.map((node) => {
    const newPos = positionUpdates.get(node.id);
    if (
      newPos !== undefined &&
      (newPos.x !== node.position.x || newPos.y !== node.position.y)
    ) {
      changed = true;
      return { ...node, position: newPos };
    }
    return node;
  });

  return changed ? result : nodes;
}

// --- Viewport 変換 ---

/**
 * ViewportState → React Flow Viewport に変換する。
 *
 * ViewportState: { offsetX, offsetY, scale }
 * RF Viewport: { x, y, zoom }
 *
 * ViewportState の offsetX/offsetY はキャンバスのスクリーン座標上のオフセット。
 * React Flow の x/y も同じ意味（パン位置）。
 */
export function viewportStateToRFViewport(viewportState: {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly scale: number;
}): Viewport {
  return {
    x: viewportState.offsetX,
    y: viewportState.offsetY,
    zoom: viewportState.scale,
  };
}

/**
 * React Flow Viewport → ViewportState に変換する。
 */
export function rfViewportToViewportState(viewport: Viewport): {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly scale: number;
} {
  return {
    offsetX: viewport.x,
    offsetY: viewport.y,
    scale: viewport.zoom,
  };
}
