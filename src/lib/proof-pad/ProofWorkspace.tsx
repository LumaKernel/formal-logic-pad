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

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { validateMPApplication } from "./mpApplicationLogic";
import { validateGenApplication } from "./genApplicationLogic";
import {
  getMPErrorMessageKey,
  getGenErrorMessageKey,
  formatMessage,
} from "./proofMessages";
import { useProofMessages } from "./ProofMessagesContext";
import { checkGoal } from "./goalCheckLogic";
import {
  computeStepCount,
  checkQuestGoalsWithAxioms,
} from "../quest/questCompletionLogic";
import { classifyAllNodes } from "./nodeRoleLogic";
import { identifyAxiomName } from "./axiomNameLogic";
import { parseNodeFormula } from "./mpApplicationLogic";
import { getAllNodeDependencies, getSubtreeNodeIds } from "./dependencyLogic";
import type { DependencyInfo } from "./EditableProofNode";
import type { NodeRole } from "./nodeRoleLogic";
import type { WorkspaceState, WorkspaceNode } from "./workspaceState";
import {
  type NodeMenuState,
  NODE_MENU_CLOSED,
  openNodeMenu,
  closeNodeMenu,
} from "../infinite-canvas/nodeMenu";
import {
  createEmptyWorkspace,
  convertToFreeMode,
  isNodeProtected,
  addNode,
  updateNodePosition,
  updateNodeFormulaText,
  updateNodeRole,
  findNode,
  applyMPAndConnect,
  applyGenAndConnect,
  copySelectedNodes,
  pasteNodes,
  removeSelectedNodes,
  duplicateSelectedNodes,
  cutSelectedNodes,
  applyIncrementalLayout,
  revalidateInferenceConclusions,
} from "./workspaceState";
import type { LayoutDirection } from "./treeLayoutLogic";
import {
  toggleNodeSelection,
  selectSingleNode,
  clearSelection,
  serializeClipboardData,
  deserializeClipboardData,
} from "./copyPasteLogic";
import type { ClipboardData } from "./copyPasteLogic";
import {
  computeDetailLevel,
  DEFAULT_THRESHOLDS,
  type DetailVisibilityOverrides,
} from "./levelOfDetail";
import {
  computeViewportBounds,
  isItemVisible,
  isConnectionVisible,
} from "../infinite-canvas/viewportCulling";
import {
  exportWorkspaceToJSON,
  importWorkspaceFromJSON,
  generateExportFileName,
} from "./workspaceExport";
import {
  generateExportSVG,
  generateImageExportFileName,
} from "./workspaceImageExport";
import type { ReferenceEntry, Locale } from "../reference/referenceEntry";
import { findEntryById } from "../reference/referenceEntry";
import { ReferencePopover } from "../reference/ReferencePopover";
import { getInferenceRuleReferenceEntryId } from "./inferenceRuleReferenceLogic";

// --- Props ---

/** ゴール達成時に通知されるデータ */
export type GoalAchievedInfo = {
  /** ゴール式に一致したノードのID */
  readonly matchingNodeId: string;
  /** ステップ数（公理+MP+Genノードの合計、ゴールノードを除く） */
  readonly stepCount: number;
};

export interface ProofWorkspaceProps {
  /** 論理体系 */
  readonly system: LogicSystem;
  /** 外部からワークスペース状態を制御する場合 */
  readonly workspace?: WorkspaceState;
  /** ワークスペース状態変更時のコールバック */
  readonly onWorkspaceChange?: (workspace: WorkspaceState) => void;
  /** 論理式パース成功時のコールバック */
  readonly onFormulaParsed?: (nodeId: string, formula: Formula) => void;
  /** ゴール達成時のコールバック（達成へ遷移した瞬間に1回だけ呼ばれる） */
  readonly onGoalAchieved?: (info: GoalAchievedInfo) => void;
  /** リファレンスエントリ一覧（省略時はリファレンスポップオーバー非表示） */
  readonly referenceEntries?: readonly ReferenceEntry[];
  /** ロケール（リファレンス表示用） */
  readonly locale?: Locale;
  /** リファレンス詳細モーダルを開くコールバック */
  readonly onOpenReferenceDetail?: (entryId: string) => void;
  /** ノード内の依存情報(Depends on)表示を制御する（undefined = DetailLevelの自動判定に従う） */
  readonly showDependencies?: boolean;
  /** data-testid */
  readonly testId?: string;
}

// --- MP選択モードの状態 ---

type MPSelectionState =
  | { readonly phase: "idle" }
  | { readonly phase: "selecting-left" }
  | { readonly phase: "selecting-right"; readonly leftNodeId: string };

// --- Gen選択モードの状態 ---

type GenSelectionState =
  | { readonly phase: "idle" }
  | {
      readonly phase: "selecting-premise";
      readonly variableName: string;
    };

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
  background: "var(--color-panel-bg, rgba(252, 249, 243, 0.96))",
  borderRadius: 8,
  border: "1px solid var(--color-panel-border, rgba(180, 160, 130, 0.2))",
  boxShadow: "0 1px 6px var(--color-panel-shadow, rgba(120, 100, 70, 0.1))",
  fontSize: 13,
  fontFamily: "var(--font-ui)",
  pointerEvents: "auto" as const,
  color: "var(--color-text-primary, #171717)",
};

const systemBadgeStyle = {
  padding: "2px 8px",
  background: "var(--color-paper-button-bg, rgba(255, 253, 248, 0.9))",
  color: "var(--color-badge-text, #718096)",
  borderRadius: 6,
  fontWeight: 600 as const,
  fontSize: 12,
  border:
    "1px solid var(--color-paper-button-border, rgba(180, 160, 130, 0.3))",
  boxShadow:
    "0 1px 2px var(--color-paper-button-shadow, rgba(120, 100, 70, 0.08))",
};

const mpButtonStyle = {
  padding: "4px 12px",
  background: "var(--color-mp-button, #d9944a)",
  color: "var(--color-node-text, #fff)",
  border: "1px solid var(--color-node-border, rgba(255,255,255,0.3))",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600 as const,
  fontSize: 12,
  fontFamily: "var(--font-ui)",
};

const mpButtonActiveStyle = {
  ...mpButtonStyle,
  background: "var(--color-mp-button-active, #b5752e)",
  boxShadow: "0 0 0 2px var(--color-mp-button-shadow, rgba(217,148,74,0.5))",
};

const mpSelectionBannerStyle = {
  position: "absolute" as const,
  top: 50,
  left: "50%" as const,
  transform: "translateX(-50%)",
  zIndex: 20,
  padding: "8px 16px",
  background: "var(--color-mp-banner, rgba(217,148,74,0.95))",
  color: "var(--color-node-text, #fff)",
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "var(--font-ui)",
  fontWeight: 500 as const,
  boxShadow: "0 2px 8px var(--color-node-shadow, rgba(0,0,0,0.2))",
  pointerEvents: "auto" as const,
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const cancelButtonStyle = {
  padding: "2px 8px",
  background: "rgba(255,255,255,0.2)",
  color: "var(--color-node-text, #fff)",
  border: "1px solid var(--color-node-border, rgba(255,255,255,0.3))",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 11,
  fontFamily: "var(--font-ui)",
};

const genButtonStyle = {
  ...mpButtonStyle,
  background: "var(--color-gen-button, #9b59b6)",
};

const genButtonActiveStyle = {
  ...genButtonStyle,
  background: "var(--color-gen-button-active, #7d3c98)",
  boxShadow: "0 0 0 2px var(--color-gen-button-shadow, rgba(155,89,182,0.5))",
};

const genSelectionBannerStyle = {
  ...mpSelectionBannerStyle,
  background: "var(--color-gen-banner, rgba(155,89,182,0.95))",
};

const genVariableInputStyle = {
  padding: "2px 6px",
  border: "1px solid rgba(255,255,255,0.5)",
  borderRadius: 4,
  fontSize: 12,
  fontFamily: "var(--font-formula)",
  width: 40,
  outline: "none",
  background: "rgba(255,255,255,0.2)",
  color: "var(--color-node-text, #fff)",
};

// --- ゴール関連スタイル ---

const proofCompleteBannerStyle: CSSProperties = {
  position: "absolute",
  bottom: 40,
  left: "50%",
  transform: "translateX(-50%) rotate(-3deg)",
  zIndex: 30,
  padding: "10px 32px",
  background: "var(--color-proof-complete-bg, rgba(255,253,248,0.95))",
  color: "var(--color-proof-complete-text, #1a7a3a)",
  borderRadius: 4,
  fontSize: 20,
  fontFamily: "var(--font-formula)",
  fontWeight: 700,
  fontVariant: "small-caps",
  border: "3px solid var(--color-proof-complete-border, #2ecc71)",
  boxShadow: `2px 3px 8px var(--color-proof-complete-shadow, rgba(46,204,113,0.2))`,
  pointerEvents: "none",
  textAlign: "center",
  letterSpacing: 2,
  animation: "stamp-appear 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
};

const proofCompleteAxiomViolationBannerStyle: CSSProperties = {
  ...proofCompleteBannerStyle,
  color: "var(--color-proof-complete-axiom-text, #8a5a1e)",
  background: "var(--color-proof-complete-axiom-bg, rgba(255,253,248,0.95))",
  border: "3px solid var(--color-proof-complete-axiom-border, #d9944a)",
  boxShadow: `2px 3px 8px var(--color-proof-complete-axiom-shadow, rgba(217,148,74,0.2))`,
};

const questModeBadgeStyle = {
  padding: "2px 8px",
  background: "var(--color-warning-bg, rgba(255,215,0,0.3))",
  borderRadius: 4,
  fontWeight: 600 as const,
  fontSize: 12,
  color: "var(--color-warning, #b8860b)",
  border: "1px solid var(--color-warning-border, rgba(255,215,0,0.5))",
};

const paperButtonStyle = {
  padding: "3px 8px",
  background: "var(--color-paper-button-bg, rgba(255, 253, 248, 0.9))",
  color: "var(--color-text-primary, #171717)",
  border:
    "1px solid var(--color-paper-button-border, rgba(180, 160, 130, 0.3))",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 11,
  fontFamily: "var(--font-ui)",
  boxShadow:
    "0 1px 2px var(--color-paper-button-shadow, rgba(120, 100, 70, 0.08))",
};

const convertToFreeButtonStyle = {
  ...paperButtonStyle,
  padding: "4px 10px",
};

const selectionBannerStyle = {
  ...mpSelectionBannerStyle,
  background: "var(--color-selection-banner, rgba(59,130,246,0.95))",
};

const selectionActionButtonStyle = {
  padding: "2px 8px",
  background: "rgba(255,255,255,0.2)",
  color: "var(--color-node-text, #fff)",
  border: "1px solid var(--color-node-border, rgba(255,255,255,0.3))",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 11,
  fontFamily: "var(--font-ui)",
};

// --- コンポーネント ---

export function ProofWorkspace({
  system,
  workspace: externalWorkspace,
  onWorkspaceChange,
  onFormulaParsed,
  onGoalAchieved,
  referenceEntries,
  locale,
  onOpenReferenceDetail,
  showDependencies,
  testId,
}: ProofWorkspaceProps) {
  // i18nメッセージ
  const msg = useProofMessages();

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

  // Gen選択モード
  const [genSelection, setGenSelection] = useState<GenSelectionState>({
    phase: "idle",
  });

  // Gen変数名入力
  const [genVariableInput, setGenVariableInput] = useState("");

  // ノード選択状態（コピペ・削除用）
  const [selectedNodeIds, setSelectedNodeIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  // ノードコンテキストメニュー
  const [nodeMenuState, setNodeMenuState] =
    useState<NodeMenuState>(NODE_MENU_CLOSED);
  const nodeMenuRef = useRef<HTMLDivElement>(null);

  // クリップボードデータ（内部保持用、navigator.clipboard フォールバック）
  const clipboardRef = useRef<ClipboardData | null>(null);

  // コンテナref（キーボードイベント用）
  const containerRef = useRef<HTMLDivElement>(null);

  // ファイルインポート用の隠しinput
  const fileInputRef = useRef<HTMLInputElement>(null);

  // コンテナサイズ（Viewport Culling用）
  const [containerSize, setContainerSize] = useState<Size>({
    width: 0,
    height: 0,
  });

  /* v8 ignore start -- ResizeObserver: ブラウザAPIのためJSDOMでは検証不可 */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);
  /* v8 ignore stop */

  // 自動レイアウト機能
  const [autoLayout, setAutoLayout] = useState(false);
  const [autoLayoutDirection, setAutoLayoutDirection] =
    useState<LayoutDirection>("top-to-bottom");

  /** setWorkspace のラッパー。ノード数/接続数が変化した場合にインクリメンタルレイアウトを適用する。 */
  const setWorkspaceWithAutoLayout = useCallback(
    (ws: WorkspaceState) => {
      if (!autoLayout) {
        setWorkspace(ws);
        return;
      }
      const nodeCountChanged = ws.nodes.length !== workspace.nodes.length;
      const connectionCountChanged =
        ws.connections.length !== workspace.connections.length;
      if (nodeCountChanged || connectionCountChanged) {
        const laid = applyIncrementalLayout(ws, autoLayoutDirection, nodeSizes);
        setWorkspace(laid);
      } else {
        setWorkspace(ws);
      }
    },
    [autoLayout, autoLayoutDirection, workspace, nodeSizes, setWorkspace],
  );

  // --- 公理パレット ---

  const availableAxioms = useMemo(
    () => getAvailableAxioms(workspace.system),
    [workspace.system],
  );

  // --- 推論規則リファレンス ---

  const mpReferenceEntry = useMemo(() => {
    const entryId = getInferenceRuleReferenceEntryId("mp");
    return entryId !== undefined && referenceEntries !== undefined
      ? findEntryById(referenceEntries, entryId)
      : undefined;
  }, [referenceEntries]);

  const genReferenceEntry = useMemo(() => {
    const entryId = getInferenceRuleReferenceEntryId("gen");
    return entryId !== undefined && referenceEntries !== undefined
      ? findEntryById(referenceEntries, entryId)
      : undefined;
  }, [referenceEntries]);

  /** 新しいノードの配置位置を計算する（パレット右側にオフセット配置） */
  const computeNewNodePosition = useCallback(
    (existingNodes: readonly WorkspaceNode[]): Point => {
      // パレット（left:12 + minWidth:200 + margin）の右側に配置
      const baseX = -viewport.offsetX / viewport.scale + 250;
      // ヘッダー（top:12 + height ~36px + margin）の下に配置
      const baseY = -viewport.offsetY / viewport.scale + 60;
      const offset = existingNodes.length * 30;
      return { x: baseX + offset, y: baseY + offset };
    },
    [viewport],
  );

  const handleAddAxiom = useCallback(
    (axiom: AxiomPaletteItem) => {
      const position = computeNewNodePosition(workspace.nodes);
      setWorkspaceWithAutoLayout(
        addNode(workspace, "axiom", axiom.displayName, position, axiom.dslText),
      );
    },
    [workspace, setWorkspaceWithAutoLayout, computeNewNodePosition],
  );

  // --- MP選択モードハンドラ ---

  const handleStartMPSelection = useCallback(() => {
    setMPSelection({ phase: "selecting-left" });
    setGenSelection({ phase: "idle" });
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

        setWorkspaceWithAutoLayout(result.workspace);
        setMPSelection({ phase: "idle" });
      }
    },
    [mpSelection, workspace, setWorkspaceWithAutoLayout],
  );

  // --- Gen選択モードハンドラ ---

  const handleStartGenSelection = useCallback(() => {
    if (genVariableInput.trim() === "") return;
    setGenSelection({
      phase: "selecting-premise",
      variableName: genVariableInput.trim(),
    });
    setMPSelection({ phase: "idle" });
  }, [genVariableInput]);

  const handleCancelGenSelection = useCallback(() => {
    setGenSelection({ phase: "idle" });
  }, []);

  const handleNodeClickForGen = useCallback(
    (nodeId: string) => {
      if (genSelection.phase !== "selecting-premise") return;

      const premiseNode = findNode(workspace, nodeId);
      if (!premiseNode) return;

      const genPosition: Point = {
        x: premiseNode.position.x,
        y: premiseNode.position.y + 150,
      };

      const result = applyGenAndConnect(
        workspace,
        nodeId,
        genSelection.variableName,
        genPosition,
      );

      setWorkspaceWithAutoLayout(result.workspace);
      setGenSelection({ phase: "idle" });
    },
    [genSelection, workspace, setWorkspaceWithAutoLayout],
  );

  // 統合ノードクリックハンドラ
  const handleNodeClickForSelection = useCallback(
    (nodeId: string) => {
      if (mpSelection.phase !== "idle") {
        handleNodeClickForMP(nodeId);
      } else if (genSelection.phase !== "idle") {
        handleNodeClickForGen(nodeId);
      }
    },
    [mpSelection, genSelection, handleNodeClickForMP, handleNodeClickForGen],
  );

  const isSelectionActive =
    mpSelection.phase !== "idle" || genSelection.phase !== "idle";

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
        validations.set(node.id, { message: msg.mpApplied, type: "success" });
      } else if (result._tag !== "BothPremisesMissing") {
        const key = getMPErrorMessageKey(result);
        validations.set(node.id, {
          message: msg[key],
          type: "error",
        });
      }
    }
    return validations;
  }, [workspace, msg]);

  // --- Genノードの検証状態を計算 ---

  const genValidations = useMemo(() => {
    const validations = new Map<
      string,
      { readonly message: string; readonly type: "error" | "success" }
    >();
    for (const node of workspace.nodes) {
      if (node.kind !== "gen") continue;
      const variableName = node.genVariableName ?? "";
      const result = validateGenApplication(workspace, node.id, variableName);
      if (result._tag === "Success") {
        validations.set(node.id, { message: msg.genApplied, type: "success" });
      } else if (result._tag !== "PremiseMissing") {
        const key = getGenErrorMessageKey(result);
        validations.set(node.id, {
          message: msg[key],
          type: "error",
        });
      }
    }
    return validations;
  }, [workspace, msg]);

  // --- ゴールチェック（ノードrole="goal"ベース） ---

  const goalCheckResult = useMemo(
    () => checkGoal(workspace.nodes),
    [workspace.nodes],
  );

  // --- クエストゴールチェック（クエストモード: 保護ノードベース、公理制限付き） ---

  const questGoalResult = useMemo(
    () =>
      workspace.mode === "quest"
        ? checkQuestGoalsWithAxioms(
            workspace.nodes,
            workspace.connections,
            workspace.system,
          )
        : undefined,
    [workspace.mode, workspace.nodes, workspace.connections, workspace.system],
  );

  const isGoalAchieved =
    goalCheckResult._tag === "GoalAllAchieved" ||
    questGoalResult?._tag === "AllAchieved";

  const isGoalAchievedButAxiomViolation =
    questGoalResult?._tag === "AllAchievedButAxiomViolation";

  // --- ゴール達成コールバック（達成へ遷移した瞬間に1回だけ発火） ---

  const prevGoalAchievedRef = useRef(false);

  const isAnyGoalComplete = isGoalAchieved || isGoalAchievedButAxiomViolation;

  useEffect(() => {
    if (isAnyGoalComplete && !prevGoalAchievedRef.current) {
      if (onGoalAchieved) {
        if (
          questGoalResult?._tag === "AllAchieved" ||
          questGoalResult?._tag === "AllAchievedButAxiomViolation"
        ) {
          onGoalAchieved({
            matchingNodeId: "",
            stepCount: questGoalResult.stepCount,
          });
        } else if (goalCheckResult._tag === "GoalAllAchieved") {
          onGoalAchieved({
            matchingNodeId:
              goalCheckResult.achievedGoals[0]?.matchingNodeId ?? "",
            stepCount: computeStepCount(workspace.nodes),
          });
        }
      }
    }
    prevGoalAchievedRef.current = isAnyGoalComplete;
  }, [
    isAnyGoalComplete,
    goalCheckResult,
    questGoalResult,
    onGoalAchieved,
    workspace.nodes,
  ]);

  // --- ノード分類 ---

  const nodeClassifications = useMemo(
    () => classifyAllNodes(workspace.nodes, workspace.connections),
    [workspace.nodes, workspace.connections],
  );

  // --- 公理名自動判別 ---

  const axiomNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const node of workspace.nodes) {
      const formula = parseNodeFormula(node);
      if (formula === undefined) continue;
      const result = identifyAxiomName(formula, workspace.system);
      if (
        result._tag === "Identified" ||
        result._tag === "TheoryAxiomIdentified"
      ) {
        names.set(node.id, result.displayName);
      }
    }
    return names;
  }, [workspace.nodes, workspace.system]);

  // --- 公理依存関係の計算 ---

  const nodeDependencies = useMemo(
    () => getAllNodeDependencies(workspace.nodes, workspace.connections),
    [workspace.nodes, workspace.connections],
  );

  /**
   * ノードIDから依存公理のDependencyInfo配列を生成する。
   * 導出ノードのみ（自分自身以外の公理に依存するノード）に表示する。
   */
  const getNodeDependencyInfos = useCallback(
    (nodeId: string): readonly DependencyInfo[] | undefined => {
      const deps = nodeDependencies.get(nodeId);
      if (deps === undefined) return undefined;
      // ルートノードは自分自身のみに依存 → 表示不要
      if (deps.size === 1 && deps.has(nodeId)) return undefined;
      // 依存公理がない（接続が不完全など）→ 表示不要
      if (deps.size === 0) return undefined;

      return [...deps].map((depId): DependencyInfo => {
        const axName = axiomNames.get(depId);
        const depNode = findNode(workspace, depId);
        return {
          nodeId: depId,
          displayName: axName ?? depNode?.label ?? depId,
        };
      });
    },
    [nodeDependencies, axiomNames, workspace],
  );

  const handleRoleChange = useCallback(
    (nodeId: string, role: NodeRole | undefined) => {
      setWorkspace(updateNodeRole(workspace, nodeId, role));
    },
    [workspace, setWorkspace],
  );

  const handleConvertToFreeMode = useCallback(() => {
    setWorkspace(convertToFreeMode(workspace));
  }, [workspace, setWorkspace]);

  // --- ノード選択ハンドラ ---

  const handleNodeSelect = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      // MP/Gen選択モード中は選択操作を行わない
      if (mpSelection.phase !== "idle" || genSelection.phase !== "idle") return;
      // 編集中ノードのクリックは選択しない
      if (editingNodeIds.has(nodeId)) return;

      if (e.metaKey || e.ctrlKey) {
        // Ctrl/Cmd+クリック: トグル選択
        setSelectedNodeIds((prev) => toggleNodeSelection(prev, nodeId));
      } else {
        // 通常クリック: 単一選択
        setSelectedNodeIds(selectSingleNode(nodeId));
      }
    },
    [mpSelection.phase, genSelection.phase, editingNodeIds],
  );

  // --- JSON エクスポート/インポート ---

  /* v8 ignore start -- ブラウザAPI(Blob, URL.createObjectURL, FileReader, Date)のためJSDOMでは検証不可 */
  const handleExportJSON = useCallback(() => {
    const json = exportWorkspaceToJSON(workspace);
    // eslint-disable-next-line @luma-dev/luma-ts/no-date -- 不純なUI層でのみ使用
    const d = new Date();
    const fileName = generateExportFileName(workspace.system.name, {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
      hour: d.getUTCHours(),
      minute: d.getUTCMinutes(),
    });
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [workspace]);

  const handleExportSVG = useCallback(() => {
    const svgStr = generateExportSVG(workspace, { nodeSizes });
    // eslint-disable-next-line @luma-dev/luma-ts/no-date -- 不純なUI層でのみ使用
    const d = new Date();
    const fileName = generateImageExportFileName(
      workspace.system.name,
      {
        year: d.getUTCFullYear(),
        month: d.getUTCMonth() + 1,
        day: d.getUTCDate(),
        hour: d.getUTCHours(),
        minute: d.getUTCMinutes(),
      },
      "svg",
    );
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [workspace, nodeSizes]);

  const handleExportPNG = useCallback(() => {
    const svgStr = generateExportSVG(workspace, { nodeSizes });
    // SVG → Canvas → PNG
    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml" });
    const svgUrl = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx === null) {
        URL.revokeObjectURL(svgUrl);
        return;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(svgUrl);

      canvas.toBlob((pngBlob) => {
        if (pngBlob === null) return;
        // eslint-disable-next-line @luma-dev/luma-ts/no-date -- 不純なUI層でのみ使用
        const d = new Date();
        const fileName = generateImageExportFileName(
          workspace.system.name,
          {
            year: d.getUTCFullYear(),
            month: d.getUTCMonth() + 1,
            day: d.getUTCDate(),
            hour: d.getUTCHours(),
            minute: d.getUTCMinutes(),
          },
          "png",
        );
        const url = URL.createObjectURL(pngBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    };
    img.src = svgUrl;
  }, [workspace, nodeSizes]);

  const handleImportJSON = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        if (typeof text !== "string") return;
        const result = importWorkspaceFromJSON(text);
        if (result._tag === "Success") {
          setWorkspace(result.workspace);
        }
      };
      reader.readAsText(file);
      // 同じファイルを再度選択できるようにリセット
      e.target.value = "";
    },
    [setWorkspace],
  );
  /* v8 ignore stop */

  const handleCanvasClick = useCallback(() => {
    // キャンバスの空白部分クリックで選択解除
    if (selectedNodeIds.size > 0) {
      setSelectedNodeIds(clearSelection());
    }
    // コンテキストメニューを閉じる（useEffectのpointerdownが先に閉じるため通常は到達しないが防御的に残す）
    /* v8 ignore start */
    if (nodeMenuState.open) {
      setNodeMenuState(closeNodeMenu());
    }
    /* v8 ignore stop */
  }, [selectedNodeIds, nodeMenuState.open]);

  // --- ノードコンテキストメニュー ---

  const handleNodeContextMenu = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setNodeMenuState(openNodeMenu(nodeId, e.clientX, e.clientY));
    },
    [],
  );

  const handleSelectSubtree = useCallback(() => {
    if (!nodeMenuState.open) return;
    const subtreeIds = getSubtreeNodeIds(
      nodeMenuState.nodeId,
      workspace.connections,
    );
    setSelectedNodeIds(subtreeIds);
    setNodeMenuState(closeNodeMenu());
  }, [nodeMenuState, workspace.connections]);

  // コンテキストメニュー外クリックで閉じる
  useEffect(() => {
    if (!nodeMenuState.open) return;
    const handleClickOutside = (e: PointerEvent) => {
      if (
        nodeMenuRef.current !== null &&
        !nodeMenuRef.current.contains(e.target as Node)
      ) {
        setNodeMenuState(closeNodeMenu());
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [nodeMenuState.open]);

  // --- コピー＆ペースト ---

  const handleCopy = useCallback(() => {
    if (selectedNodeIds.size === 0) return;
    const data = copySelectedNodes(workspace, selectedNodeIds);
    clipboardRef.current = data;
    // ブラウザのクリップボードにも書き込む（非同期、失敗しても内部保持で動作）
    const json = serializeClipboardData(data);
    navigator.clipboard.writeText(json).catch(() => {
      // クリップボードAPIが使えない環境でも内部保持で動作
    });
  }, [selectedNodeIds, workspace]);

  const handlePaste = useCallback(() => {
    // まず内部クリップボードから試行
    const doInternalPaste = (data: ClipboardData) => {
      const center: Point = {
        x: -viewport.offsetX / viewport.scale + 300,
        y: -viewport.offsetY / viewport.scale + 300,
      };
      const result = pasteNodes(workspace, data, center);
      setWorkspaceWithAutoLayout(result);
      // ペースト後、新しいノードを選択状態にする
      const newNodeIds = new Set(
        result.nodes.slice(workspace.nodes.length).map((n) => n.id),
      );
      setSelectedNodeIds(newNodeIds);
    };

    if (clipboardRef.current) {
      doInternalPaste(clipboardRef.current);
      return;
    }

    /* v8 ignore start -- ブラウザのClipboard API: JSDOMでは内部クリップボードが使われるため到達しない */
    navigator.clipboard
      .readText()
      .then((text) => {
        const data = deserializeClipboardData(text);
        if (data) {
          doInternalPaste(data);
        }
      })
      .catch(() => {
        // クリップボードAPIが使えない環境では何もしない
      });
    /* v8 ignore stop */
  }, [workspace, viewport, setWorkspaceWithAutoLayout]);

  const handleCut = useCallback(() => {
    if (selectedNodeIds.size === 0) return;
    const result = cutSelectedNodes(workspace, selectedNodeIds);
    clipboardRef.current = result.clipboardData;
    const json = serializeClipboardData(result.clipboardData);
    navigator.clipboard.writeText(json).catch(() => {
      // クリップボードAPIが使えない環境でも内部保持で動作
    });
    setWorkspaceWithAutoLayout(result.workspace);
    setSelectedNodeIds(clearSelection());
  }, [selectedNodeIds, workspace, setWorkspaceWithAutoLayout]);

  const handleDuplicate = useCallback(() => {
    if (selectedNodeIds.size === 0) return;
    const result = duplicateSelectedNodes(workspace, selectedNodeIds);
    setWorkspaceWithAutoLayout(result.workspace);
    setSelectedNodeIds(result.newNodeIds);
  }, [selectedNodeIds, workspace, setWorkspaceWithAutoLayout]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeIds.size === 0) return;
    const result = removeSelectedNodes(workspace, selectedNodeIds);
    setWorkspaceWithAutoLayout(result);
    setSelectedNodeIds(clearSelection());
  }, [selectedNodeIds, workspace, setWorkspaceWithAutoLayout]);

  // --- キーボードショートカット ---
  /* v8 ignore start -- キーボードイベント: JSDOMではfocus制御が不安定なためブラウザテストで検証 */

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 入力フィールドにフォーカスがある場合はスキップ
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      // フォーミュラ編集中はスキップ
      if (editingNodeIds.size > 0) return;

      const isModifier = e.metaKey || e.ctrlKey;

      if (isModifier && e.key === "c") {
        e.preventDefault();
        handleCopy();
      } else if (isModifier && e.key === "v") {
        e.preventDefault();
        handlePaste();
      } else if (isModifier && e.key === "x") {
        e.preventDefault();
        handleCut();
      } else if (isModifier && e.key === "d") {
        e.preventDefault();
        handleDuplicate();
      } else if (isModifier && e.key === "a") {
        e.preventDefault();
        // Ctrl/Cmd+A: 全選択
        setSelectedNodeIds(new Set(workspace.nodes.map((n) => n.id)));
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteSelected();
      } else if (e.key === "Escape") {
        setSelectedNodeIds(clearSelection());
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [
    editingNodeIds,
    handleCopy,
    handlePaste,
    handleCut,
    handleDuplicate,
    handleDeleteSelected,
    workspace.nodes,
  ]);
  /* v8 ignore stop */

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
      const updated = updateNodeFormulaText(workspace, nodeId, text);
      setWorkspace(revalidateInferenceConclusions(updated));
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

  // --- Viewport Culling ---

  const viewportBounds = useMemo(
    () => computeViewportBounds(viewport, containerSize),
    [viewport, containerSize],
  );

  /** コンテナサイズが取得できているか（未取得ならカリング無効） */
  const cullingEnabled = containerSize.width > 0 && containerSize.height > 0;

  /** カリング対象（非表示にする）ノードかどうか判定。サイズ未取得のノードは安全のため常に表示。 */
  // 純粋ロジックは viewportCulling.test.ts で検証済み。JSDOM では ResizeObserver が動作しないためカリングは無効
  const isNodeCulled = useCallback(
    (node: WorkspaceNode): boolean => {
      if (!cullingEnabled) return false;
      /* v8 ignore start -- JSDOM: ResizeObserver未対応のためcullingEnabled=falseで到達不能 */
      const size = nodeSizes.get(node.id);
      if (!size) return false; // サイズ不明なら常に表示
      return !isItemVisible({ position: node.position, size }, viewportBounds);
      /* v8 ignore stop */
    },
    [cullingEnabled, nodeSizes, viewportBounds],
  );

  // --- 接続線のレンダリングデータ ---

  // Hand-drawn filter is only applied at high zoom (full detail) for performance
  const handDrawnConnections = viewport.scale >= DEFAULT_THRESHOLDS.fullAbove;

  const connectionElements = useMemo(
    () =>
      workspace.connections.map((conn) => {
        const fromNode = findNode(workspace, conn.fromNodeId);
        const toNode = findNode(workspace, conn.toNodeId);
        if (!fromNode || !toNode) return null;

        const fromSize = nodeSizes.get(conn.fromNodeId) ?? DEFAULT_NODE_SIZE;
        const toSize = nodeSizes.get(conn.toNodeId) ?? DEFAULT_NODE_SIZE;

        // Viewport Culling: 接続の両端ノードAABBがビューポート外なら非表示
        // 純粋ロジックは viewportCulling.test.ts で検証済み。JSDOM では ResizeObserver が動作しないためカリングは無効
        /* v8 ignore start -- JSDOM: ResizeObserver未対応のためcullingEnabled=false */
        if (
          cullingEnabled &&
          !isConnectionVisible(
            {
              fromPosition: fromNode.position,
              fromSize,
              toPosition: toNode.position,
              toSize,
            },
            viewportBounds,
          )
        ) {
          return null;
        }
        /* v8 ignore stop */

        const fromPorts = getProofNodePorts(fromNode.kind);
        const toPorts = getProofNodePorts(toNode.kind);
        const fromPort = findPort(fromPorts, conn.fromPortId);
        const toPort = findPort(toPorts, conn.toPortId);
        if (!fromPort || !toPort) return null;

        // MP/Genノードへの接続: 検証状態に応じて色を変える
        const nodeValidation =
          mpValidations.get(conn.toNodeId) ?? genValidations.get(conn.toNodeId);
        const color = nodeValidation
          ? nodeValidation.type === "error"
            ? "var(--color-error, #e06060)"
            : "var(--color-success, #60c060)"
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
            handDrawn={handDrawnConnections}
          />
        );
      }),
    [
      workspace,
      nodeSizes,
      viewport,
      cullingEnabled,
      viewportBounds,
      mpValidations,
      genValidations,
      handDrawnConnections,
    ],
  );

  // --- Level-of-Detail ---

  const detailLevel = useMemo(
    () => computeDetailLevel(viewport.scale),
    [viewport.scale],
  );

  const visibilityOverrides: DetailVisibilityOverrides | undefined = useMemo(
    () =>
      showDependencies !== undefined ? { showDependencies } : undefined,
    [showDependencies],
  );

  // --- ノードのレンダリング ---

  const renderNode = useCallback(
    (node: WorkspaceNode) => {
      const isDragEnabled = !editingNodeIds.has(node.id) && !isSelectionActive;
      const isSelectedLeft =
        mpSelection.phase === "selecting-right" &&
        mpSelection.leftNodeId === node.id;
      const isNodeSelected = selectedNodeIds.has(node.id);

      // ノードの検証状態（MPまたはGen）
      const nodeValidation =
        mpValidations.get(node.id) ?? genValidations.get(node.id);

      // 選択モードの視覚的ハイライト色
      const selectionColor =
        mpSelection.phase !== "idle"
          ? "var(--color-mp-button-shadow, rgba(217,148,74,0.6))"
          : genSelection.phase !== "idle"
            ? "var(--color-gen-button-shadow, rgba(155,89,182,0.6))"
            : undefined;

      // アウトラインスタイルの決定
      const outlineStyle = isSelectedLeft
        ? `3px solid var(--color-mp-button, #d9944a)`
        : isNodeSelected
          ? "2px solid var(--color-accent, #3b82f6)"
          : isSelectionActive && selectionColor
            ? `2px dashed ${selectionColor satisfies string}`
            : undefined;

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
            onClick={(e) => {
              if (isSelectionActive) {
                e.stopPropagation();
                handleNodeClickForSelection(node.id);
              } else {
                e.stopPropagation();
                handleNodeSelect(node.id, e);
              }
            }}
            onContextMenu={(e) => {
              handleNodeContextMenu(node.id, e);
            }}
            style={{
              cursor: isSelectionActive ? "pointer" : undefined,
              outline: outlineStyle,
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
              editable={node.kind !== "mp" && node.kind !== "gen"}
              statusMessage={nodeValidation?.message}
              statusType={nodeValidation?.type}
              classification={nodeClassifications.get(node.id)}
              onRoleChange={handleRoleChange}
              isProtected={isNodeProtected(workspace, node.id)}
              axiomName={axiomNames.get(node.id)}
              dependencies={getNodeDependencyInfos(node.id)}
              detailLevel={detailLevel}
              visibilityOverrides={visibilityOverrides}
              testId={`proof-node-${node.id satisfies string}`}
            />
          </div>
        </CanvasItem>
      );
    },
    [
      workspace,
      viewport,
      detailLevel,
      visibilityOverrides,
      editingNodeIds,
      isSelectionActive,
      selectedNodeIds,
      mpSelection,
      genSelection,
      mpValidations,
      genValidations,
      nodeClassifications,
      axiomNames,
      getNodeDependencyInfos,
      handlePositionChange,
      handleFormulaTextChange,
      handleFormulaParsed,
      handleModeChange,
      handleRoleChange,
      handleNodeClickForSelection,
      handleNodeSelect,
      handleNodeContextMenu,
      getNodeSizeRef,
    ],
  );

  return (
    <div
      ref={containerRef}
      data-testid={testId}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        outline: "none",
      }}
      tabIndex={-1}
      onClick={handleCanvasClick}
    >
      {/* 体系情報ヘッダー */}
      <div
        style={headerStyle}
        data-testid={testId ? `${testId satisfies string}-header` : undefined}
      >
        <span>{msg.logicSystemLabel}</span>
        <span
          style={systemBadgeStyle}
          data-testid={testId ? `${testId satisfies string}-system` : undefined}
        >
          {workspace.system.name}
        </span>
        {workspace.mode === "quest" ? (
          <>
            <span
              style={questModeBadgeStyle}
              data-testid={
                testId ? `${testId satisfies string}-quest-badge` : undefined
              }
            >
              {msg.questBadge}
            </span>
            <button
              type="button"
              style={convertToFreeButtonStyle}
              onClick={handleConvertToFreeMode}
              data-testid={
                testId
                  ? `${testId satisfies string}-convert-free-button`
                  : undefined
              }
            >
              {msg.convertToFree}
            </button>
          </>
        ) : null}
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
          {mpSelection.phase !== "idle" ? msg.mpCancel : msg.mpApply}
        </button>
        {mpReferenceEntry !== undefined && locale !== undefined && (
          <span role="presentation" onClick={(e) => e.stopPropagation()}>
            <ReferencePopover
              entry={mpReferenceEntry}
              locale={locale}
              onOpenDetail={onOpenReferenceDetail}
              testId={
                testId !== undefined
                  ? `${testId satisfies string}-mp-ref`
                  : undefined
              }
            />
          </span>
        )}
        {workspace.system.generalization ? (
          <>
            <input
              type="text"
              value={genVariableInput}
              onChange={(e) => setGenVariableInput(e.target.value)}
              placeholder="x"
              style={{
                ...genVariableInputStyle,
                ...(genSelection.phase !== "idle"
                  ? { border: "1px solid var(--color-gen-button, #9b59b6)" }
                  : {}),
              }}
              data-testid={
                testId
                  ? `${testId satisfies string}-gen-variable-input`
                  : undefined
              }
            />
            <button
              type="button"
              style={
                genSelection.phase !== "idle"
                  ? genButtonActiveStyle
                  : genButtonStyle
              }
              onClick={
                genSelection.phase !== "idle"
                  ? handleCancelGenSelection
                  : handleStartGenSelection
              }
              data-testid={
                testId ? `${testId satisfies string}-gen-button` : undefined
              }
            >
              {genSelection.phase !== "idle" ? msg.genCancel : msg.genApply}
            </button>
            {genReferenceEntry !== undefined && locale !== undefined && (
              <span role="presentation" onClick={(e) => e.stopPropagation()}>
                <ReferencePopover
                  entry={genReferenceEntry}
                  locale={locale}
                  onOpenDetail={onOpenReferenceDetail}
                  testId={
                    testId !== undefined
                      ? `${testId satisfies string}-gen-ref`
                      : undefined
                  }
                />
              </span>
            )}
          </>
        ) : null}
        {/* 自動レイアウトトグル */}
        <span
          style={{
            borderLeft:
              "1px solid var(--color-panel-rule-line, rgba(180, 160, 130, 0.15))",
            paddingLeft: 8,
            marginLeft: 4,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              fontSize: 12,
            }}
            data-testid={
              testId
                ? `${testId satisfies string}-auto-layout-label`
                : undefined
            }
          >
            <input
              type="checkbox"
              checked={autoLayout}
              onChange={(e) => setAutoLayout(e.target.checked)}
              data-testid={
                testId
                  ? `${testId satisfies string}-auto-layout-toggle`
                  : undefined
              }
            />
            {msg.autoLayout}
          </label>
          {autoLayout ? (
            <select
              value={autoLayoutDirection}
              onChange={(e) =>
                setAutoLayoutDirection(e.target.value as LayoutDirection)
              }
              style={{
                fontSize: 11,
                padding: "1px 4px",
                borderRadius: 6,
                border:
                  "1px solid var(--color-paper-button-border, rgba(180, 160, 130, 0.3))",
                background:
                  "var(--color-paper-button-bg, rgba(255, 253, 248, 0.9))",
                color: "var(--color-text-primary, #171717)",
              }}
              data-testid={
                testId
                  ? `${testId satisfies string}-auto-layout-direction`
                  : undefined
              }
            >
              <option value="top-to-bottom">{msg.layoutTopToBottom}</option>
              <option value="bottom-to-top">{msg.layoutBottomToTop}</option>
            </select>
          ) : null}
        </span>
        {/* エクスポート/インポート */}
        <span
          style={{
            borderLeft:
              "1px solid var(--color-panel-rule-line, rgba(180, 160, 130, 0.15))",
            paddingLeft: 8,
            marginLeft: 4,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <button
            type="button"
            style={paperButtonStyle}
            onClick={handleExportJSON}
            data-testid={
              testId
                ? `${testId satisfies string}-export-json-button`
                : undefined
            }
          >
            {msg.exportJSON}
          </button>
          <button
            type="button"
            style={paperButtonStyle}
            onClick={handleExportSVG}
            data-testid={
              testId
                ? `${testId satisfies string}-export-svg-button`
                : undefined
            }
          >
            {msg.exportSVG}
          </button>
          <button
            type="button"
            style={paperButtonStyle}
            onClick={handleExportPNG}
            data-testid={
              testId
                ? `${testId satisfies string}-export-png-button`
                : undefined
            }
          >
            {msg.exportPNG}
          </button>
          <button
            type="button"
            style={paperButtonStyle}
            onClick={handleImportJSON}
            data-testid={
              testId
                ? `${testId satisfies string}-import-json-button`
                : undefined
            }
          >
            {msg.importJSON}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={handleFileChange}
            data-testid={
              testId ? `${testId satisfies string}-file-input` : undefined
            }
          />
        </span>
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
              ? msg.mpBannerSelectLeft
              : msg.mpBannerSelectRight}
          </span>
          <button
            type="button"
            style={cancelButtonStyle}
            onClick={handleCancelMPSelection}
          >
            {msg.cancel}
          </button>
        </div>
      ) : null}

      {/* Gen選択バナー */}
      {genSelection.phase !== "idle" ? (
        <div
          style={genSelectionBannerStyle}
          data-testid={
            testId ? `${testId satisfies string}-gen-banner` : undefined
          }
        >
          <span>
            {formatMessage(msg.genBannerSelectPremise, {
              variableName: genSelection.variableName,
            })}
          </span>
          <button
            type="button"
            style={cancelButtonStyle}
            onClick={handleCancelGenSelection}
          >
            {msg.cancel}
          </button>
        </div>
      ) : null}

      {/* 選択バナー */}
      {selectedNodeIds.size > 0 &&
      mpSelection.phase === "idle" &&
      genSelection.phase === "idle" ? (
        <div
          style={selectionBannerStyle}
          data-testid={
            testId ? `${testId satisfies string}-selection-banner` : undefined
          }
          onClick={(e) => e.stopPropagation()}
        >
          <span>
            {formatMessage(msg.selectionCount, {
              count: String(selectedNodeIds.size),
            })}
          </span>
          <button
            type="button"
            style={selectionActionButtonStyle}
            onClick={handleCopy}
            data-testid={
              testId ? `${testId satisfies string}-copy-button` : undefined
            }
          >
            {msg.selectionCopy}
          </button>
          <button
            type="button"
            style={selectionActionButtonStyle}
            onClick={handleCut}
            data-testid={
              testId ? `${testId satisfies string}-cut-button` : undefined
            }
          >
            {msg.selectionCut}
          </button>
          <button
            type="button"
            style={selectionActionButtonStyle}
            onClick={handlePaste}
            data-testid={
              testId ? `${testId satisfies string}-paste-button` : undefined
            }
          >
            {msg.selectionPaste}
          </button>
          <button
            type="button"
            style={selectionActionButtonStyle}
            onClick={handleDuplicate}
            data-testid={
              testId ? `${testId satisfies string}-duplicate-button` : undefined
            }
          >
            {msg.selectionDuplicate}
          </button>
          <button
            type="button"
            style={{
              ...selectionActionButtonStyle,
              background: "var(--color-error-bg, rgba(224,96,96,0.3))",
            }}
            onClick={handleDeleteSelected}
            data-testid={
              testId ? `${testId satisfies string}-delete-button` : undefined
            }
          >
            {msg.selectionDelete}
          </button>
          <button
            type="button"
            style={cancelButtonStyle}
            onClick={() => setSelectedNodeIds(clearSelection())}
          >
            {msg.selectionClear}
          </button>
        </div>
      ) : null}

      {/* 証明完了バナー（スタンプ風） */}
      {isGoalAchieved ? (
        <div
          style={proofCompleteBannerStyle}
          data-testid={
            testId
              ? `${testId satisfies string}-proof-complete-banner`
              : undefined
          }
        >
          {msg.proofComplete}
        </div>
      ) : isGoalAchievedButAxiomViolation ? (
        <div
          style={proofCompleteAxiomViolationBannerStyle}
          data-testid={
            testId
              ? `${testId satisfies string}-proof-complete-banner-axiom-violation`
              : undefined
          }
        >
          <div>{msg.proofCompleteButAxiomViolation}</div>
          {questGoalResult?._tag === "AllAchievedButAxiomViolation" ? (
            <div
              style={{
                fontSize: 13,
                fontWeight: 400,
                marginTop: 4,
                fontVariant: "normal" as const,
              }}
            >
              {formatMessage(msg.axiomViolationDetail, {
                axiomIds: questGoalResult.goalResults
                  .flatMap((r) => [...r.violatingAxiomIds])
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .join(", "),
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* 公理パレット */}
      <AxiomPalette
        axioms={availableAxioms}
        onAddAxiom={handleAddAxiom}
        referenceEntries={referenceEntries}
        locale={locale}
        onOpenReferenceDetail={onOpenReferenceDetail}
        testId={testId ? `${testId satisfies string}-axiom-palette` : undefined}
      />

      {/* ノードコンテキストメニュー */}
      {nodeMenuState.open ? (
        <div
          ref={nodeMenuRef}
          data-testid={
            testId
              ? `${testId satisfies string}-node-context-menu`
              : "node-context-menu"
          }
          style={{
            position: "fixed",
            left: nodeMenuState.screenPosition.x,
            top: nodeMenuState.screenPosition.y,
            zIndex: 2000,
            minWidth: 140,
            background: "var(--color-panel-bg, rgba(252, 249, 243, 0.96))",
            border:
              "1px solid var(--color-panel-border, rgba(180, 160, 130, 0.2))",
            borderRadius: 8,
            boxShadow:
              "0 4px 16px var(--color-panel-shadow, rgba(120, 100, 70, 0.1))",
            padding: "4px 0",
            fontFamily: "var(--font-ui)",
            fontSize: 13,
            userSelect: "none",
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            data-testid={
              testId
                ? `${testId satisfies string}-select-subtree`
                : "select-subtree"
            }
            onClick={handleSelectSubtree}
            /* v8 ignore start - hover visual effect only */
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "var(--color-surface-hover, #f0f0f0)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            /* v8 ignore stop */
            style={{
              display: "block",
              width: "100%",
              padding: "6px 16px",
              border: "none",
              background: "transparent",
              textAlign: "left",
              cursor: "pointer",
              color: "var(--color-text-primary, #333)",
              fontSize: 13,
              lineHeight: "1.4",
            }}
          >
            {msg.selectSubtree}
          </button>
        </div>
      ) : null}

      {/* InfiniteCanvas */}
      <InfiniteCanvas viewport={viewport} onViewportChange={setViewport}>
        {connectionElements}
        {workspace.nodes.filter((node) => !isNodeCulled(node)).map(renderNode)}
      </InfiniteCanvas>
    </div>
  );
}
