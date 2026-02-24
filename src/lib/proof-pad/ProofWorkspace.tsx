/**
 * 証明ワークスペースコンポーネント。
 *
 * InfiniteCanvas上に証明ノードを配置し、接続線で結ぶ証明構築画面。
 * 論理体系（LogicSystem）を設定でき、公理パレットから公理をキャンバスに追加できる。
 *
 * 変更時は ProofWorkspace.test.tsx, ProofWorkspace.stories.tsx, workspaceState.ts, index.ts も同期すること。
 */

import { useCallback, useMemo, useState } from "react";
import type { LogicSystem } from "../logic-core/inferenceRule";
import type { Formula } from "../logic-core/formula";
import type { EditorMode } from "../formula-input/editorLogic";
import { InfiniteCanvas } from "../infinite-canvas/InfiniteCanvas";
import { CanvasItem } from "../infinite-canvas/CanvasItem";
import { PortConnection } from "../infinite-canvas/PortConnection";
import { findPort } from "../infinite-canvas/connector";
import type { ViewportState, Point, Size } from "../infinite-canvas/types";
import { EditableProofNode } from "./EditableProofNode";
import { getProofNodePorts, getProofEdgeColor } from "./proofNodeUI";
import { AxiomPalette } from "./AxiomPalette";
import { getAvailableAxioms, type AxiomPaletteItem } from "./axiomPaletteLogic";
import type { WorkspaceState, WorkspaceNode } from "./workspaceState";
import {
  createEmptyWorkspace,
  addNode,
  updateNodePosition,
  updateNodeFormulaText,
  findNode,
} from "./workspaceState";

// --- Props ---

export interface ProofWorkspaceProps {
  /** 論理体系 */
  readonly system: LogicSystem;
  /** 外部からワークスペース状態を制御する場合 */
  readonly workspace?: WorkspaceState;
  /** ワークスペース状態変更時のコールバック */
  readonly onWorkspaceChange?: (workspace: WorkspaceState) => void;
  /** 論理式パース成功時のコールバック */
  readonly onFormulaParsed?: (nodeId: string, formula: Formula) => void;
  /** data-testid */
  readonly testId?: string;
}

// --- デフォルトノードサイズ（ポート位置計算に必要） ---

const DEFAULT_NODE_SIZE: Size = { width: 180, height: 60 };

// --- ヘッダースタイル ---

const headerStyle = {
  position: "absolute" as const,
  top: 12,
  left: 12,
  zIndex: 10,
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 12px",
  background: "rgba(255, 255, 255, 0.9)",
  borderRadius: 8,
  boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  fontSize: 13,
  fontFamily: "sans-serif",
  pointerEvents: "auto" as const,
};

const systemBadgeStyle = {
  padding: "2px 8px",
  background: "#e8eaf0",
  borderRadius: 4,
  fontWeight: 600 as const,
  fontSize: 12,
};

// --- コンポーネント ---

export function ProofWorkspace({
  system,
  workspace: externalWorkspace,
  onWorkspaceChange,
  onFormulaParsed,
  testId,
}: ProofWorkspaceProps) {
  // 内部状態（外部制御がない場合）
  const [internalWorkspace, setInternalWorkspace] = useState<WorkspaceState>(
    () => createEmptyWorkspace(system),
  );

  const workspace = externalWorkspace ?? internalWorkspace;
  const setWorkspace = useCallback(
    (ws: WorkspaceState) => {
      if (onWorkspaceChange) {
        onWorkspaceChange(ws);
      } else {
        setInternalWorkspace(ws);
      }
    },
    [onWorkspaceChange],
  );

  // ビューポート状態
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });

  // ノードサイズ管理（ポート位置計算に必要）
  const [nodeSizes, setNodeSizes] = useState<ReadonlyMap<string, Size>>(
    () => new Map(),
  );

  // ドラッグ中の編集モード管理
  const [editingNodeIds, setEditingNodeIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  // --- 公理パレット ---

  const availableAxioms = useMemo(
    () => getAvailableAxioms(workspace.system),
    [workspace.system],
  );

  /** 新しいノードの配置位置を計算する（ビューポート中心付近にオフセット配置） */
  const computeNewNodePosition = useCallback(
    (existingNodes: readonly WorkspaceNode[]): Point => {
      const baseX = -viewport.offsetX / viewport.scale + 100;
      const baseY = -viewport.offsetY / viewport.scale + 100;
      const offset = existingNodes.length * 30;
      return { x: baseX + offset, y: baseY + offset };
    },
    [viewport],
  );

  const handleAddAxiom = useCallback(
    (axiom: AxiomPaletteItem) => {
      const position = computeNewNodePosition(workspace.nodes);
      setWorkspace(
        addNode(workspace, "axiom", axiom.displayName, position, axiom.dslText),
      );
    },
    [workspace, setWorkspace, computeNewNodePosition],
  );

  // --- コールバック ---

  /* v8 ignore start -- ドラッグ操作: PointerEvent シミュレーションが必要なためブラウザテストで検証 */
  const handlePositionChange = useCallback(
    (nodeId: string) => (position: Point) => {
      setWorkspace(updateNodePosition(workspace, nodeId, position));
    },
    [workspace, setWorkspace],
  );
  /* v8 ignore stop */

  const handleFormulaTextChange = useCallback(
    (nodeId: string, text: string) => {
      setWorkspace(updateNodeFormulaText(workspace, nodeId, text));
    },
    [workspace, setWorkspace],
  );

  const handleFormulaParsed = useCallback(
    (nodeId: string, formula: Formula) => {
      onFormulaParsed?.(nodeId, formula);
    },
    [onFormulaParsed],
  );

  const handleModeChange = useCallback((nodeId: string, mode: EditorMode) => {
    setEditingNodeIds((prev) => {
      const next = new Set(prev);
      if (mode === "editing") {
        next.add(nodeId);
      } else {
        next.delete(nodeId);
      }
      return next;
    });
  }, []);

  // --- ノードサイズ参照コールバック ---

  const getNodeSizeRef = useCallback(
    (nodeId: string) => (el: HTMLDivElement | null) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        const size: Size = {
          width: rect.width / viewport.scale,
          height: rect.height / viewport.scale,
        };
        setNodeSizes((prev) => {
          const prevSize = prev.get(nodeId);
          if (
            prevSize &&
            prevSize.width === size.width &&
            prevSize.height === size.height
          ) {
            return prev;
          }
          const next = new Map(prev);
          next.set(nodeId, size);
          return next;
        });
      }
    },
    [viewport.scale],
  );

  // --- 接続線のレンダリングデータ ---

  const connectionElements = useMemo(
    () =>
      workspace.connections.map((conn) => {
        const fromNode = findNode(workspace, conn.fromNodeId);
        const toNode = findNode(workspace, conn.toNodeId);
        if (!fromNode || !toNode) return null;

        const fromSize = nodeSizes.get(conn.fromNodeId) ?? DEFAULT_NODE_SIZE;
        const toSize = nodeSizes.get(conn.toNodeId) ?? DEFAULT_NODE_SIZE;
        const fromPorts = getProofNodePorts(fromNode.kind);
        const toPorts = getProofNodePorts(toNode.kind);
        const fromPort = findPort(fromPorts, conn.fromPortId);
        const toPort = findPort(toPorts, conn.toPortId);
        if (!fromPort || !toPort) return null;

        return (
          <PortConnection
            key={conn.id}
            from={{
              port: fromPort,
              itemPosition: fromNode.position,
              itemWidth: fromSize.width,
              itemHeight: fromSize.height,
            }}
            to={{
              port: toPort,
              itemPosition: toNode.position,
              itemWidth: toSize.width,
              itemHeight: toSize.height,
            }}
            viewport={viewport}
            color={getProofEdgeColor(fromNode.kind)}
            strokeWidth={2}
          />
        );
      }),
    [workspace, nodeSizes, viewport],
  );

  // --- ノードのレンダリング ---

  const renderNode = useCallback(
    (node: WorkspaceNode) => {
      const isDragEnabled = !editingNodeIds.has(node.id);
      return (
        <CanvasItem
          key={node.id}
          position={node.position}
          viewport={viewport}
          onPositionChange={handlePositionChange(node.id)}
          dragEnabled={isDragEnabled}
        >
          <div ref={getNodeSizeRef(node.id)}>
            <EditableProofNode
              id={node.id}
              kind={node.kind}
              label={node.label}
              formulaText={node.formulaText}
              onFormulaTextChange={handleFormulaTextChange}
              onFormulaParsed={handleFormulaParsed}
              onModeChange={handleModeChange}
              testId={`proof-node-${node.id satisfies string}`}
            />
          </div>
        </CanvasItem>
      );
    },
    [
      viewport,
      editingNodeIds,
      handlePositionChange,
      handleFormulaTextChange,
      handleFormulaParsed,
      handleModeChange,
      getNodeSizeRef,
    ],
  );

  return (
    <div
      data-testid={testId}
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      {/* 体系情報ヘッダー */}
      <div
        style={headerStyle}
        data-testid={testId ? `${testId satisfies string}-header` : undefined}
      >
        <span>Logic System:</span>
        <span
          style={systemBadgeStyle}
          data-testid={testId ? `${testId satisfies string}-system` : undefined}
        >
          {workspace.system.name}
        </span>
      </div>

      {/* 公理パレット */}
      <AxiomPalette
        axioms={availableAxioms}
        onAddAxiom={handleAddAxiom}
        testId={testId ? `${testId satisfies string}-axiom-palette` : undefined}
      />

      {/* InfiniteCanvas */}
      <InfiniteCanvas viewport={viewport} onViewportChange={setViewport}>
        {connectionElements}
        {workspace.nodes.map(renderNode)}
      </InfiniteCanvas>
    </div>
  );
}
