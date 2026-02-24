/**
 * 証明ワークスペースコンポーネント。
 *
 * InfiniteCanvas上に証明ノードを配置し、接続線で結ぶ証明構築画面。
 * 論理体系（LogicSystem）を設定でき、公理パレットから公理をキャンバスに追加できる。
 * MPボタンで2つのノードを選択し、Modus Ponensを適用して新しいノードを生成する。
 * 目標式を設定し、達成判定と完了演出を行う。
 *
 * 変更時は ProofWorkspace.test.tsx, ProofWorkspace.stories.tsx, workspaceState.ts, goalCheckLogic.ts, index.ts も同期すること。
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
import { validateMPApplication, getMPErrorMessage } from "./mpApplicationLogic";
import { checkGoal } from "./goalCheckLogic";
import type { WorkspaceState, WorkspaceNode } from "./workspaceState";
import {
  createEmptyWorkspace,
  addNode,
  updateNodePosition,
  updateNodeFormulaText,
  updateGoalFormulaText,
  findNode,
  applyMPAndConnect,
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

// --- MP選択モードの状態 ---

type MPSelectionState =
  | { readonly phase: "idle" }
  | { readonly phase: "selecting-left" }
  | { readonly phase: "selecting-right"; readonly leftNodeId: string };

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

const mpButtonStyle = {
  padding: "4px 12px",
  background: "#d9944a",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.3)",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600 as const,
  fontSize: 12,
  fontFamily: "sans-serif",
};

const mpButtonActiveStyle = {
  ...mpButtonStyle,
  background: "#b5752e",
  boxShadow: "0 0 0 2px rgba(217,148,74,0.5)",
};

const mpSelectionBannerStyle = {
  position: "absolute" as const,
  top: 50,
  left: "50%" as const,
  transform: "translateX(-50%)",
  zIndex: 20,
  padding: "8px 16px",
  background: "rgba(217,148,74,0.95)",
  color: "#fff",
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "sans-serif",
  fontWeight: 500 as const,
  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  pointerEvents: "auto" as const,
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const cancelButtonStyle = {
  padding: "2px 8px",
  background: "rgba(255,255,255,0.2)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.3)",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 11,
  fontFamily: "sans-serif",
};

// --- ゴール関連スタイル ---

const goalContainerStyle = {
  position: "absolute" as const,
  top: 12,
  right: 12,
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

const goalInputStyle = {
  padding: "3px 8px",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: 13,
  fontFamily: "serif, 'Times New Roman', Times",
  fontStyle: "italic" as const,
  width: 180,
  outline: "none",
  background: "#fff",
};

const goalInputErrorStyle = {
  ...goalInputStyle,
  border: "1px solid #e06060",
  background: "rgba(255,96,96,0.05)",
};

const proofCompleteBannerStyle = {
  position: "absolute" as const,
  bottom: 40,
  left: "50%" as const,
  transform: "translateX(-50%)",
  zIndex: 30,
  padding: "12px 28px",
  background: "linear-gradient(135deg, #4ad97a, #2ecc71)",
  color: "#fff",
  borderRadius: 12,
  fontSize: 18,
  fontFamily: "sans-serif",
  fontWeight: 700 as const,
  boxShadow: "0 4px 20px rgba(74,217,122,0.5)",
  pointerEvents: "none" as const,
  textAlign: "center" as const,
  letterSpacing: 1,
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

  // MP選択モード
  const [mpSelection, setMPSelection] = useState<MPSelectionState>({
    phase: "idle",
  });

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

  // --- MP選択モードハンドラ ---

  const handleStartMPSelection = useCallback(() => {
    setMPSelection({ phase: "selecting-left" });
  }, []);

  const handleCancelMPSelection = useCallback(() => {
    setMPSelection({ phase: "idle" });
  }, []);

  const handleNodeClickForMP = useCallback(
    (nodeId: string) => {
      if (mpSelection.phase === "selecting-left") {
        setMPSelection({ phase: "selecting-right", leftNodeId: nodeId });
      } else if (mpSelection.phase === "selecting-right") {
        // Both nodes selected, apply MP
        const leftNode = findNode(workspace, mpSelection.leftNodeId);
        const rightNode = findNode(workspace, nodeId);
        if (!leftNode || !rightNode) return;

        // Compute position: midpoint below the two nodes
        const mpPosition: Point = {
          x: (leftNode.position.x + rightNode.position.x) / 2,
          y: Math.max(leftNode.position.y, rightNode.position.y) + 150,
        };

        const result = applyMPAndConnect(
          workspace,
          mpSelection.leftNodeId,
          nodeId,
          mpPosition,
        );

        setWorkspace(result.workspace);
        setMPSelection({ phase: "idle" });
      }
    },
    [mpSelection, workspace, setWorkspace],
  );

  // --- MPノードの検証状態を計算 ---

  const mpValidations = useMemo(() => {
    const validations = new Map<
      string,
      { readonly message: string; readonly type: "error" | "success" }
    >();
    for (const node of workspace.nodes) {
      if (node.kind !== "mp") continue;
      const result = validateMPApplication(workspace, node.id);
      if (result._tag === "Success") {
        validations.set(node.id, { message: "MP applied", type: "success" });
      } else if (result._tag !== "BothPremisesMissing") {
        validations.set(node.id, {
          message: getMPErrorMessage(result),
          type: "error",
        });
      }
    }
    return validations;
  }, [workspace]);

  // --- ゴールチェック ---

  const goalCheckResult = useMemo(
    () => checkGoal(workspace.goalFormulaText, workspace.nodes),
    [workspace.goalFormulaText, workspace.nodes],
  );

  const isGoalAchieved = goalCheckResult._tag === "GoalAchieved";

  const handleGoalTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setWorkspace(updateGoalFormulaText(workspace, e.target.value));
    },
    [workspace, setWorkspace],
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

        // MPノードへの接続: 検証状態に応じて色を変える
        const mpValidation = mpValidations.get(conn.toNodeId);
        const color = mpValidation
          ? mpValidation.type === "error"
            ? "#e06060"
            : "#60c060"
          : getProofEdgeColor(fromNode.kind);

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
            color={color}
            strokeWidth={2}
          />
        );
      }),
    [workspace, nodeSizes, viewport, mpValidations],
  );

  // --- ノードのレンダリング ---

  const renderNode = useCallback(
    (node: WorkspaceNode) => {
      const isDragEnabled =
        !editingNodeIds.has(node.id) && mpSelection.phase === "idle";
      const isSelecting = mpSelection.phase !== "idle";
      const isSelectedLeft =
        mpSelection.phase === "selecting-right" &&
        mpSelection.leftNodeId === node.id;

      // MPノードの検証状態
      const mpValidation = mpValidations.get(node.id);

      return (
        <CanvasItem
          key={node.id}
          position={node.position}
          viewport={viewport}
          onPositionChange={handlePositionChange(node.id)}
          dragEnabled={isDragEnabled}
        >
          <div
            ref={getNodeSizeRef(node.id)}
            onClick={
              isSelecting
                ? (e) => {
                    e.stopPropagation();
                    handleNodeClickForMP(node.id);
                  }
                : undefined
            }
            style={{
              cursor: isSelecting ? "pointer" : undefined,
              outline: isSelectedLeft
                ? "3px solid #d9944a"
                : isSelecting
                  ? "2px dashed rgba(217,148,74,0.6)"
                  : undefined,
              outlineOffset: 2,
              borderRadius: 10,
            }}
          >
            <EditableProofNode
              id={node.id}
              kind={node.kind}
              label={node.label}
              formulaText={node.formulaText}
              onFormulaTextChange={handleFormulaTextChange}
              onFormulaParsed={handleFormulaParsed}
              onModeChange={handleModeChange}
              editable={node.kind !== "mp"}
              statusMessage={mpValidation?.message}
              statusType={mpValidation?.type}
              testId={`proof-node-${node.id satisfies string}`}
            />
          </div>
        </CanvasItem>
      );
    },
    [
      viewport,
      editingNodeIds,
      mpSelection,
      mpValidations,
      handlePositionChange,
      handleFormulaTextChange,
      handleFormulaParsed,
      handleModeChange,
      handleNodeClickForMP,
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
        <button
          type="button"
          style={
            mpSelection.phase !== "idle" ? mpButtonActiveStyle : mpButtonStyle
          }
          onClick={
            mpSelection.phase !== "idle"
              ? handleCancelMPSelection
              : handleStartMPSelection
          }
          data-testid={
            testId ? `${testId satisfies string}-mp-button` : undefined
          }
        >
          {mpSelection.phase !== "idle" ? "Cancel MP" : "Apply MP"}
        </button>
      </div>

      {/* MP選択バナー */}
      {mpSelection.phase !== "idle" ? (
        <div
          style={mpSelectionBannerStyle}
          data-testid={
            testId ? `${testId satisfies string}-mp-banner` : undefined
          }
        >
          <span>
            {mpSelection.phase === "selecting-left"
              ? "Click the left premise (φ)"
              : "Click the right premise (φ→ψ)"}
          </span>
          <button
            type="button"
            style={cancelButtonStyle}
            onClick={handleCancelMPSelection}
          >
            Cancel
          </button>
        </div>
      ) : null}

      {/* ゴール入力 */}
      <div
        style={goalContainerStyle}
        data-testid={testId ? `${testId satisfies string}-goal` : undefined}
      >
        <span>Goal:</span>
        <input
          type="text"
          value={workspace.goalFormulaText}
          onChange={handleGoalTextChange}
          placeholder="e.g. phi -> phi"
          style={
            goalCheckResult._tag === "GoalParseError"
              ? goalInputErrorStyle
              : goalInputStyle
          }
          data-testid={
            testId ? `${testId satisfies string}-goal-input` : undefined
          }
        />
        {goalCheckResult._tag === "GoalAchieved" ? (
          <span
            style={{ color: "#2ecc71", fontWeight: 700 }}
            data-testid={
              testId ? `${testId satisfies string}-goal-achieved` : undefined
            }
          >
            Proved!
          </span>
        ) : goalCheckResult._tag === "GoalNotAchieved" ? (
          <span
            style={{ color: "#999" }}
            data-testid={
              testId
                ? `${testId satisfies string}-goal-not-achieved`
                : undefined
            }
          >
            Not yet
          </span>
        ) : goalCheckResult._tag === "GoalParseError" ? (
          <span
            style={{ color: "#e06060", fontSize: 11 }}
            data-testid={
              testId ? `${testId satisfies string}-goal-parse-error` : undefined
            }
          >
            Invalid formula
          </span>
        ) : null}
      </div>

      {/* 証明完了バナー */}
      {isGoalAchieved ? (
        <div
          style={proofCompleteBannerStyle}
          data-testid={
            testId
              ? `${testId satisfies string}-proof-complete-banner`
              : undefined
          }
        >
          Proof Complete!
        </div>
      ) : null}

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
