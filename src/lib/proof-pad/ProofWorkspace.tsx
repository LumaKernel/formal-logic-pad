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

import { Either } from "effect";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LogicSystem } from "../logic-core/inferenceRule";
import { getDeductionSystemName } from "../logic-core/deductionSystem";
import type { Formula } from "../logic-core/formula";
import type { EditorMode } from "../formula-input/editorLogic";
import { FormulaInput } from "../formula-input/FormulaInput";
import { TermInput } from "../formula-input/TermInput";
import { InfiniteCanvas } from "../infinite-canvas/InfiniteCanvas";
import { CanvasItem } from "../infinite-canvas/CanvasItem";
import { PortConnection } from "../infinite-canvas/PortConnection";
import { ConnectorPortComponent } from "../infinite-canvas/ConnectorPortComponent";
import { ConnectionPreviewLine } from "../infinite-canvas/ConnectionPreviewLine";
import { findPort } from "../infinite-canvas/connector";
import type { ConnectorPortOnItem } from "../infinite-canvas/connector";
import type { ViewportState, Point, Size } from "../infinite-canvas/types";
import { screenToWorld } from "../infinite-canvas/multiSelection";
import type { SelectableItem } from "../infinite-canvas/multiSelection";
import { useConnectionPreview } from "../infinite-canvas/useConnectionPreview";
import { buildPortCandidates } from "../infinite-canvas/connectionPreview";
import { EditableProofNode } from "./EditableProofNode";
import {
  getProofNodePorts,
  getNodeClassificationEdgeColor,
} from "./proofNodeUI";
import { AxiomPalette } from "./AxiomPalette";
import {
  getAvailableAxioms,
  getAvailableNdRules,
  getAvailableTabRules,
  getAvailableAtRules,
  getAvailableScRules,
  type AxiomPaletteItem,
} from "./axiomPaletteLogic";
import { NdRulePalette } from "./NdRulePalette";
import { TabRulePalette } from "./TabRulePalette";
import { AtRulePalette } from "./AtRulePalette";
import { ScRulePalette } from "./ScRulePalette";
import type { TabRuleId } from "../logic-core/tableauCalculus";
import { getTabRuleDisplayName } from "../logic-core/tableauCalculus";
import type { AtRuleId } from "../logic-core/analyticTableau";
import {
  getAtRuleDisplayName,
  isGammaRule as isAtGammaRule,
  isDeltaRule as isAtDeltaRule,
  isClosureRule as isAtClosureRule,
} from "../logic-core/analyticTableau";
import { getTabErrorMessage, isTabAxiomRule } from "./tabApplicationLogic";
import { getAtErrorMessage } from "./atApplicationLogic";
import type { ScRuleId } from "../logic-core/deductionSystem";
import { getScRuleDisplayName } from "../logic-core/deductionSystem";
import { getScErrorMessage, isScAxiomRule } from "./scApplicationLogic";
import {
  validateMPApplication,
  computeMPCompatibleNodeIds,
  computeMPLeftCompatibleNodeIds,
  isNodeImplication,
} from "./mpApplicationLogic";
import { validateGenApplication } from "./genApplicationLogic";
import {
  validateSubstitutionApplication,
  extractSubstitutionTargetsFromText,
  generateSubstitutionEntryTemplate,
} from "./substitutionApplicationLogic";
import type { SubstitutionEntries } from "./substitutionApplicationLogic";
import {
  getMPErrorMessageKey,
  getGenErrorMessageKey,
  getSubstitutionErrorMessageKey,
  processValidationResult,
  formatMessage,
} from "./proofMessages";
import { useProofMessages } from "./ProofMessagesContext";
import { checkGoal } from "./goalCheckLogic";
import { computeGoalPanelData } from "./goalPanelLogic";
import { GoalPanel } from "./GoalPanel";
import {
  computeStepCount,
  checkQuestGoalsWithAxioms,
} from "../quest/questCompletionLogic";
import { classifyAllNodes } from "./nodeRoleLogic";
import { identifyAxiomName } from "./axiomNameLogic";
import { parseNodeFormula } from "./mpApplicationLogic";
import {
  getAllNodeDependencies,
  getSubtreeNodeIds,
  getProofNodeIds,
  deduplicateDependencyInfos,
} from "./dependencyLogic";
import type { DependencyInfo } from "./EditableProofNode";
import type { WorkspaceState, WorkspaceNode, NodeRole } from "./workspaceState";
import {
  type NodeMenuState,
  NODE_MENU_CLOSED,
  openNodeMenu,
  closeNodeMenu,
} from "../infinite-canvas/nodeMenu";
import {
  type LineMenuState,
  LINE_MENU_CLOSED,
  openLineMenu,
  closeLineMenu,
} from "../infinite-canvas/lineMenu";
import {
  createEmptyWorkspace,
  isNodeProtected,
  addNode,
  addConnection,
  updateNodePosition,
  updateNodeFormulaText,
  updateNodeRole,
  findNode,
  applyMPAndConnect,
  applyGenAndConnect,
  copySelectedNodes,
  pasteNodes,
  removeNode,
  removeConnection,
  removeSelectedNodes,
  duplicateSelectedNodes,
  duplicateNode,
  cutSelectedNodes,
  applySubstitutionAndConnect,
  applyIncrementalLayout,
  revalidateInferenceConclusions,
  updateInferenceEdgeGenVariableName,
  updateInferenceEdgeSubstitutionEntries,
  mergeSelectedNodes,
  applyTabRuleAndConnect,
  applyAtRuleAndConnect,
  applyScRuleAndConnect,
} from "./workspaceState";
import {
  findMergeableGroups,
  canMergeSelectedNodes,
  findMergeTargets,
} from "./mergeNodesLogic";
import { validateDragConnection } from "./portConnectionLogic";
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
import { findInferenceEdgeForConclusionNode } from "./inferenceEdge";
import { computeInferenceEdgeLabelDataForConnection } from "./inferenceEdgeLabelLogic";
import { InferenceEdgeBadge } from "./InferenceEdgeBadge";
import { EdgeParameterPopover } from "./EdgeParameterPopover";
import type { EdgeBadgeEditState } from "./edgeBadgeEditLogic";
import { createEditStateFromEdge } from "./edgeBadgeEditLogic";
import { useEdgeScroll } from "../infinite-canvas/useEdgeScroll";
import { EdgeScrollIndicator } from "../infinite-canvas/EdgeScrollIndicator";
import { useMarquee } from "../infinite-canvas/useMarquee";
import { MinimapComponent } from "../infinite-canvas/MinimapComponent";
import type { MinimapItem } from "../infinite-canvas/minimap";
import { ZoomControlsComponent } from "../infinite-canvas/ZoomControlsComponent";
import type { ZoomItemBounds } from "../infinite-canvas/zoom";

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
  /** 構文ヘルプを開くコールバック（指定時に数式編集モードで?ボタンを表示） */
  readonly onOpenSyntaxHelp?: () => void;
  /** 自由帳として複製するコールバック（指定時にクエストモードで複製ボタンを表示） */
  readonly onDuplicateToFree?: () => void;
  /** data-testid */
  readonly testId?: string;
}

// --- MP選択モードの状態 ---

type MPSelectionState =
  | { readonly phase: "idle" }
  | { readonly phase: "selecting-left" }
  | { readonly phase: "selecting-right"; readonly leftNodeId: string }
  | {
      readonly phase: "selecting-left-for-right";
      readonly rightNodeId: string;
    };

// --- Gen選択モードの状態 ---

type GenSelectionState =
  | { readonly phase: "idle" }
  | {
      readonly phase: "selecting-premise";
      readonly variableName: string;
    };

// --- マージ選択モードの状態 ---

type MergeSelectionState =
  | { readonly phase: "idle" }
  | {
      readonly phase: "selecting-target";
      readonly leaderNodeId: string;
    };

// --- TAB規則選択モードの状態 ---

type TabSelectionState =
  | { readonly phase: "idle" }
  | {
      readonly phase: "selecting-node";
      readonly ruleId: TabRuleId;
    };

// --- AT規則選択モードの状態 ---

type AtSelectionState =
  | { readonly phase: "idle" }
  | {
      readonly phase: "selecting-node";
      readonly ruleId: AtRuleId;
    }
  | {
      readonly phase: "selecting-contradiction";
      readonly ruleId: AtRuleId;
      readonly principalNodeId: string;
    };

// --- SC規則選択モードの状態 ---

type ScSelectionState =
  | { readonly phase: "idle" }
  | {
      readonly phase: "selecting-node";
      readonly ruleId: ScRuleId;
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

const mergeSelectionBannerStyle = {
  ...mpSelectionBannerStyle,
  background: "var(--color-merge-banner, rgba(74,148,217,0.95))",
};

const tabSelectionBannerStyle = {
  ...mpSelectionBannerStyle,
  background: "var(--color-tab-banner, rgba(100, 140, 80, 0.95))",
};

const atSelectionBannerStyle = {
  ...mpSelectionBannerStyle,
  background: "var(--color-at-banner, rgba(140, 100, 160, 0.95))",
};

const scSelectionBannerStyle = {
  ...mpSelectionBannerStyle,
  background: "var(--color-sc-banner, rgba(39, 174, 96, 0.95))",
};

const substBannerStyle = {
  ...mpSelectionBannerStyle,
  background: "var(--color-subst-banner, rgba(52,152,219,0.95))",
  display: "flex",
  flexDirection: "column" as const,
  gap: 6,
  alignItems: "stretch" as const,
  maxWidth: 420,
};

const substEntryRowStyle = {
  display: "flex",
  gap: 4,
  alignItems: "center" as const,
};

const substLabelStyle = {
  padding: "2px 0",
  fontSize: 12,
  fontFamily: "var(--font-formula)",
  fontWeight: 600 as const,
  color: "var(--color-node-text, #fff)",
};

const substKindLabelStyle = {
  padding: "2px 0",
  fontSize: 11,
  color: "rgba(255,255,255,0.7)",
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

// --- ワークスペースメニュー項目 ---

function WorkspaceMenuItem({
  label,
  onClick,
  testId,
  disabled,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly testId: string | undefined;
  readonly disabled?: boolean;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      /* v8 ignore start - hover visual effect only */
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background =
            "var(--color-surface-hover, #f0f0f0)";
        }
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
        textAlign: "left" as const,
        cursor: disabled ? "default" : "pointer",
        color: disabled
          ? "var(--color-text-disabled, #999)"
          : "var(--color-text-primary, #333)",
        fontSize: 13,
        lineHeight: "1.4",
        whiteSpace: "nowrap" as const,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}

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
  onOpenSyntaxHelp,
  onDuplicateToFree,
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

  // コンテキストメニューから「論理式を編集」で指定されたノードID
  const [editRequestNodeId, setEditRequestNodeId] = useState<string | null>(
    null,
  );

  // MP選択モード
  const [mpSelection, setMPSelection] = useState<MPSelectionState>({
    phase: "idle",
  });

  // Gen選択モード
  const [genSelection, setGenSelection] = useState<GenSelectionState>({
    phase: "idle",
  });

  // マージ選択モード
  const [mergeSelection, setMergeSelection] = useState<MergeSelectionState>({
    phase: "idle",
  });

  // TAB規則選択モード
  const [tabSelection, setTabSelection] = useState<TabSelectionState>({
    phase: "idle",
  });

  // AT規則選択モード
  const [atSelection, setAtSelection] = useState<AtSelectionState>({
    phase: "idle",
  });

  // SC規則選択モード
  const [scSelection, setScSelection] = useState<ScSelectionState>({
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

  // 接続線コンテキストメニュー
  const [lineMenuState, setLineMenuState] =
    useState<LineMenuState>(LINE_MENU_CLOSED);
  const lineMenuRef = useRef<HTMLDivElement>(null);

  // クリップボードデータ（内部保持用、navigator.clipboard フォールバック）
  const clipboardRef = useRef<ClipboardData | null>(null);

  // コンテナref（キーボードイベント用）
  const containerRef = useRef<HTMLDivElement>(null);

  // マーキー完了後のclickイベント抑制用ref
  const suppressNextClickRef = useRef(false);

  // ファイルインポート用の隠しinput
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ワークスペース操作メニュー（Export/Import）
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const workspaceMenuButtonRef = useRef<HTMLButtonElement>(null);

  // キャンバス空白部分コンテキストメニュー
  const [canvasMenuState, setCanvasMenuState] = useState<{
    readonly open: boolean;
    readonly screenPosition: Point;
    readonly worldPosition: Point;
  }>({
    open: false,
    screenPosition: { x: 0, y: 0 },
    worldPosition: { x: 0, y: 0 },
  });
  const canvasMenuRef = useRef<HTMLDivElement>(null);

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

  // エッジスクロール（ドラッグ中にキャンバス端で自動パン）
  const { notifyDragMove, notifyDragEnd, edgePenetration } = useEdgeScroll(
    viewport,
    containerSize,
    setViewport,
  );

  // ミニマップ用アイテム一覧
  const minimapItems: readonly MinimapItem[] = useMemo(
    () =>
      workspace.nodes.map((node) => ({
        id: node.id,
        position: node.position,
        size: nodeSizes.get(node.id) ?? DEFAULT_NODE_SIZE,
      })),
    [workspace.nodes, nodeSizes],
  );

  // ズームコントロール用アイテム一覧（MinimapItem → ZoomItemBounds変換）
  const zoomItems: readonly ZoomItemBounds[] = useMemo(
    () =>
      minimapItems.map((item) => ({
        x: item.position.x,
        y: item.position.y,
        width: item.size.width,
        height: item.size.height,
      })),
    [minimapItems],
  );

  // 選択中ノードのズーム対象バウンズ
  const selectedZoomItems: readonly ZoomItemBounds[] = useMemo(
    () =>
      minimapItems
        .filter((item) => selectedNodeIds.has(item.id))
        .map((item) => ({
          x: item.position.x,
          y: item.position.y,
          width: item.size.width,
          height: item.size.height,
        })),
    [minimapItems, selectedNodeIds],
  );

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

  // --- ノード分類 ---

  const nodeClassifications = useMemo(
    () => classifyAllNodes(workspace.nodes, workspace.connections),
    [workspace.nodes, workspace.connections],
  );

  // --- ポートドラッグ接続 ---

  const portCandidates = useMemo(
    () =>
      buildPortCandidates(
        workspace.nodes
          .map((node) => {
            const size = nodeSizes.get(node.id);
            if (!size) return null;
            return {
              id: node.id,
              position: node.position,
              width: size.width,
              height: size.height,
              ports: [...getProofNodePorts(node.kind)],
            };
          })
          .filter((x) => x !== null),
      ),
    [workspace.nodes, nodeSizes],
  );

  /* v8 ignore start -- ポートドラッグ接続: 実座標ベースのDOM操作が必要でJSDOMではテスト不可。ブラウザテストで検証 */
  const handleValidateConnection = useCallback(
    (
      sourceItemId: string,
      sourcePortId: string,
      targetItemId: string,
      targetPortId: string,
    ): boolean => {
      const result = validateDragConnection(
        workspace,
        sourceItemId,
        sourcePortId,
        targetItemId,
        targetPortId,
      );
      return result.valid;
    },
    [workspace],
  );

  const handleConnectionComplete = useCallback(
    (
      sourceItemId: string,
      sourcePortId: string,
      targetItemId: string,
      targetPortId: string,
    ) => {
      const result = validateDragConnection(
        workspace,
        sourceItemId,
        sourcePortId,
        targetItemId,
        targetPortId,
      );
      if (!result.valid) return;
      let newWs = addConnection(
        workspace,
        result.fromNodeId,
        result.fromPortId,
        result.toNodeId,
        result.toPortId,
      );
      newWs = revalidateInferenceConclusions(newWs);
      setWorkspaceWithAutoLayout(newWs);
    },
    [workspace, setWorkspaceWithAutoLayout],
  );
  /* v8 ignore stop */

  const {
    previewState: connectionPreviewState,
    startDrag: startConnectionDrag,
    updateDrag: updateConnectionDrag,
    endDrag: endConnectionDrag,
  } = useConnectionPreview(
    viewport,
    portCandidates,
    handleValidateConnection,
    handleConnectionComplete,
  );

  // マーキー選択（Shift+ドラッグで矩形選択）
  const [isShiftMarqueeActive, setIsShiftMarqueeActive] = useState(false);

  const selectableItems: readonly SelectableItem[] = minimapItems;

  /* v8 ignore start -- マーキー選択: useMarqueeコールバック。実ポインタ操作が必要 */
  const handleMarqueeSelectionChange = useCallback(
    (ids: ReadonlySet<string>) => {
      setSelectedNodeIds(ids);
      // マーキーで選択した直後のclickイベントで選択解除されるのを防ぐ
      suppressNextClickRef.current = true;
    },
    [],
  );
  /* v8 ignore stop */

  const {
    marqueeRect,
    onPointerDown: marqueePointerDown,
    onPointerMove: marqueePointerMove,
    onPointerUp: marqueePointerUp,
  } = useMarquee(
    viewport,
    selectableItems,
    selectedNodeIds,
    handleMarqueeSelectionChange,
    containerRef,
  );

  /** マーキーモードが有効かどうか（Shift押下中 かつ ポートドラッグ中でない） */
  const marqueeEnabled =
    isShiftMarqueeActive && connectionPreviewState === null;

  /* v8 ignore start -- マーキー中エッジスクロール: 実ポインタ操作が必要 */
  /** マーキー選択中にエッジスクロールも通知するラッパー */
  const handleMarqueePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      marqueePointerMove(e);
      const el = containerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        notifyDragMove({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    },
    [marqueePointerMove, notifyDragMove],
  );

  const handleMarqueePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      marqueePointerUp(e);
      notifyDragEnd();
    },
    [marqueePointerUp, notifyDragEnd],
  );
  /* v8 ignore stop */

  /* v8 ignore start -- ポートドラッグ開始・移動・完了: 実座標ベースのDOM操作が必要。ブラウザテストで検証 */
  const handlePortDragStart = useCallback(
    (nodeId: string) => (portId: string, screenX: number, screenY: number) => {
      const size = nodeSizes.get(nodeId);
      const node = workspace.nodes.find((n) => n.id === nodeId);
      if (!size || !node) return;
      const ports = getProofNodePorts(node.kind);
      const port = ports.find((p) => p.id === portId);
      if (!port) return;

      const portOnItem: ConnectorPortOnItem = {
        port,
        itemPosition: node.position,
        itemWidth: size.width,
        itemHeight: size.height,
      };
      startConnectionDrag(nodeId, portOnItem, screenX, screenY);
    },
    [workspace.nodes, nodeSizes, startConnectionDrag],
  );

  const handleConnectionPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (connectionPreviewState !== null) {
        updateConnectionDrag(e.clientX, e.clientY);
      }
    },
    [connectionPreviewState, updateConnectionDrag],
  );

  const handleConnectionPointerUp = useCallback(() => {
    if (connectionPreviewState !== null) {
      endConnectionDrag();
    }
  }, [connectionPreviewState, endConnectionDrag]);
  /* v8 ignore stop */

  // --- 公理パレット ---

  const availableAxioms = useMemo(
    () => getAvailableAxioms(workspace.system),
    [workspace.system],
  );

  const availableNdRules = useMemo(
    () =>
      workspace.deductionSystem.style === "natural-deduction"
        ? getAvailableNdRules(workspace.deductionSystem.system)
        : [],
    [workspace.deductionSystem],
  );

  const availableTabRules = useMemo(
    () =>
      workspace.deductionSystem.style === "tableau-calculus"
        ? getAvailableTabRules(workspace.deductionSystem.system)
        : [],
    [workspace.deductionSystem],
  );

  const availableAtRules = useMemo(
    () =>
      workspace.deductionSystem.style === "analytic-tableau"
        ? getAvailableAtRules(workspace.deductionSystem.system)
        : [],
    [workspace.deductionSystem],
  );

  const availableScRules = useMemo(
    () =>
      workspace.deductionSystem.style === "sequent-calculus"
        ? getAvailableScRules(workspace.deductionSystem.system)
        : [],
    [workspace.deductionSystem],
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
      // ラベルは汎用的な "Axiom" を使用。具体的な公理名(A1, A2等)は
      // formulaText から自動計算される axiomName バッジで表示する。
      setWorkspaceWithAutoLayout(
        addNode(
          workspace,
          "axiom",
          msg.nodeLabelAxiom,
          position,
          axiom.dslText,
        ),
      );
    },
    [
      workspace,
      setWorkspaceWithAutoLayout,
      computeNewNodePosition,
      msg.nodeLabelAxiom,
    ],
  );

  const handleAddAssumption = useCallback(() => {
    const position = computeNewNodePosition(workspace.nodes);
    // NDでは仮定ノードを追加。formulaTextは空で、ユーザーが自由に入力する。
    setWorkspaceWithAutoLayout(
      addNode(workspace, "axiom", msg.nodeLabelAssumption, position, ""),
    );
  }, [
    workspace,
    setWorkspaceWithAutoLayout,
    computeNewNodePosition,
    msg.nodeLabelAssumption,
  ]);

  const handleAddSequent = useCallback(() => {
    const position = computeNewNodePosition(workspace.nodes);
    // TABではシーケントノードを追加。formulaTextは空で、ユーザーが式を入力する。
    // TABシーケントは左辺（Γ）のみで右辺は常に空。
    setWorkspaceWithAutoLayout(
      addNode(workspace, "axiom", msg.nodeLabelSequent, position, ""),
    );
  }, [
    workspace,
    setWorkspaceWithAutoLayout,
    computeNewNodePosition,
    msg.nodeLabelSequent,
  ]);

  const handleAddSignedFormula = useCallback(() => {
    const position = computeNewNodePosition(workspace.nodes);
    // ATでは署名付き論理式ノードを追加。formulaTextは空で、ユーザーが "T:φ" / "F:φ" を入力する。
    setWorkspaceWithAutoLayout(
      addNode(workspace, "axiom", msg.nodeLabelSignedFormula, position, ""),
    );
  }, [
    workspace,
    setWorkspaceWithAutoLayout,
    computeNewNodePosition,
    msg.nodeLabelSignedFormula,
  ]);

  // --- MP選択モードハンドラ ---

  const handleStartMPSelection = useCallback(() => {
    setMPSelection({ phase: "selecting-left" });
    setGenSelection({ phase: "idle" });
    setMergeSelection({ phase: "idle" });
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
        /* v8 ignore start -- 防御的: クリックされたノードはワークスペースに存在する */
        if (!leftNode || !rightNode) return;
        /* v8 ignore stop */

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
      } else if (mpSelection.phase === "selecting-left-for-right") {
        // Right premise was pre-selected, now left is clicked
        const leftNode = findNode(workspace, nodeId);
        const rightNode = findNode(workspace, mpSelection.rightNodeId);
        /* v8 ignore start -- 防御的: クリックされたノードはワークスペースに存在する */
        if (!leftNode || !rightNode) return;
        /* v8 ignore stop */

        const mpPosition: Point = {
          x: (leftNode.position.x + rightNode.position.x) / 2,
          y: Math.max(leftNode.position.y, rightNode.position.y) + 150,
        };

        const result = applyMPAndConnect(
          workspace,
          nodeId,
          mpSelection.rightNodeId,
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
    setMergeSelection({ phase: "idle" });
  }, [genVariableInput]);

  const handleCancelGenSelection = useCallback(() => {
    setGenSelection({ phase: "idle" });
  }, []);

  const handleNodeClickForGen = useCallback(
    (nodeId: string) => {
      if (genSelection.phase !== "selecting-premise") return;

      const premiseNode = findNode(workspace, nodeId);
      /* v8 ignore start -- 防御的: クリックされたノードはワークスペースに存在する */
      if (!premiseNode) return;
      /* v8 ignore stop */

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

  // --- マージ選択モードハンドラ ---

  const handleCancelMerge = useCallback(() => {
    setMergeSelection({ phase: "idle" });
  }, []);

  const handleNodeClickForMerge = useCallback(
    (targetNodeId: string) => {
      if (mergeSelection.phase !== "selecting-target") return;
      const result = mergeSelectedNodes(
        workspace,
        mergeSelection.leaderNodeId,
        [targetNodeId],
      );
      if (result._tag === "Success") {
        setWorkspaceWithAutoLayout(result.workspace);
      }
      setMergeSelection({ phase: "idle" });
    },
    [mergeSelection, workspace, setWorkspaceWithAutoLayout],
  );

  // --- TAB規則選択モードハンドラ ---

  const handleStartTabRuleSelection = useCallback((ruleId: TabRuleId) => {
    // 公理規則（BS, ⊥）は直接ノード選択なしで適用不可 → ノード選択に進む
    setTabSelection({ phase: "selecting-node", ruleId });
    setMPSelection({ phase: "idle" });
    setGenSelection({ phase: "idle" });
    setMergeSelection({ phase: "idle" });
    setAtSelection({ phase: "idle" });
    setScSelection({ phase: "idle" });
  }, []);

  const handleCancelTabSelection = useCallback(() => {
    setTabSelection({ phase: "idle" });
  }, []);

  const handleNodeClickForTab = useCallback(
    (nodeId: string) => {
      if (tabSelection.phase !== "selecting-node") return;

      const conclusionNode = findNode(workspace, nodeId);
      /* v8 ignore start -- 防御的: クリックされたノードはワークスペースに存在する */
      if (!conclusionNode) return;
      /* v8 ignore stop */

      const { ruleId } = tabSelection;

      // 規則に応じて追加パラメータを収集
      let principalPosition = 0;
      let eigenVariable: string | undefined;
      let termText: string | undefined;
      let exchangePosition: number | undefined;

      // 交換規則: 位置入力
      if (ruleId === "exchange") {
        const input = globalThis.prompt(msg.tabExchangePositionPrompt, "0");
        if (input === null) {
          setTabSelection({ phase: "idle" });
          return;
        }
        exchangePosition = parseInt(input, 10);
        if (Number.isNaN(exchangePosition)) {
          setTabSelection({ phase: "idle" });
          return;
        }
      }

      // 公理規則以外: 主論理式の位置入力（デフォルト0）
      if (!isTabAxiomRule(ruleId) && ruleId !== "exchange") {
        const input = globalThis.prompt(msg.tabPositionPrompt, "0");
        if (input === null) {
          setTabSelection({ phase: "idle" });
          return;
        }
        principalPosition = parseInt(input, 10);
        if (Number.isNaN(principalPosition)) {
          setTabSelection({ phase: "idle" });
          return;
        }
      }

      // 量化子規則: 追加パラメータ入力
      if (ruleId === "universal" || ruleId === "neg-existential") {
        const input = globalThis.prompt(msg.tabTermPrompt, "");
        if (input === null) {
          setTabSelection({ phase: "idle" });
          return;
        }
        termText = input;
      }
      if (ruleId === "neg-universal" || ruleId === "existential") {
        const input = globalThis.prompt(msg.tabEigenVariablePrompt, "");
        if (input === null) {
          setTabSelection({ phase: "idle" });
          return;
        }
        eigenVariable = input;
      }

      // 前提ノードの位置計算
      const premisePositions: Point[] = [];
      premisePositions.push({
        x: conclusionNode.position.x - 100,
        y: conclusionNode.position.y - 150,
      });
      premisePositions.push({
        x: conclusionNode.position.x + 100,
        y: conclusionNode.position.y - 150,
      });

      const result = applyTabRuleAndConnect(
        workspace,
        nodeId,
        {
          ruleId,
          sequentText: conclusionNode.formulaText,
          principalPosition,
          eigenVariable,
          termText,
          exchangePosition,
        },
        premisePositions,
      );

      if (Either.isRight(result.validation)) {
        setWorkspaceWithAutoLayout(result.workspace);
      } else {
        const errorMsg = getTabErrorMessage(result.validation.left);
        globalThis.alert(errorMsg);
      }

      setTabSelection({ phase: "idle" });
    },
    [tabSelection, workspace, setWorkspaceWithAutoLayout, msg],
  );

  // --- AT規則選択モードハンドラ ---

  const handleStartAtRuleSelection = useCallback((ruleId: AtRuleId) => {
    if (isAtClosureRule(ruleId)) {
      // closure はまず主ノードを選択
      setAtSelection({ phase: "selecting-node", ruleId });
    } else {
      setAtSelection({ phase: "selecting-node", ruleId });
    }
    setMPSelection({ phase: "idle" });
    setGenSelection({ phase: "idle" });
    setMergeSelection({ phase: "idle" });
    setTabSelection({ phase: "idle" });
    setScSelection({ phase: "idle" });
  }, []);

  const handleCancelAtSelection = useCallback(() => {
    setAtSelection({ phase: "idle" });
  }, []);

  const handleNodeClickForAt = useCallback(
    (nodeId: string) => {
      if (atSelection.phase === "selecting-contradiction") {
        // closure: 矛盾ノード選択 → 適用
        const principalNode = findNode(workspace, atSelection.principalNodeId);
        /* v8 ignore start -- 防御的コード: クリックされたノードが存在しないケースは通常到達不能 */
        if (!principalNode) {
          setAtSelection({ phase: "idle" });
          return;
        }
        /* v8 ignore stop */
        const contradictionNode = findNode(workspace, nodeId);
        /* v8 ignore start -- 防御的コード */
        if (!contradictionNode) {
          setAtSelection({ phase: "idle" });
          return;
        }
        /* v8 ignore stop */

        const result = applyAtRuleAndConnect(
          workspace,
          atSelection.principalNodeId,
          {
            ruleId: atSelection.ruleId,
            signedFormulaText: principalNode.formulaText,
            contradictionFormulaText: contradictionNode.formulaText,
          },
          [],
          nodeId,
        );

        if (Either.isRight(result.validation)) {
          setWorkspaceWithAutoLayout(result.workspace);
        } else {
          const errorMsg = getAtErrorMessage(result.validation.left);
          globalThis.alert(errorMsg);
        }

        setAtSelection({ phase: "idle" });
        return;
      }

      if (atSelection.phase !== "selecting-node") return;

      const conclusionNode = findNode(workspace, nodeId);
      /* v8 ignore start -- 防御的: クリックされたノードはワークスペースに存在する */
      if (!conclusionNode) return;
      /* v8 ignore stop */

      const { ruleId } = atSelection;

      // closure: 主ノード選択後、矛盾ノード選択に遷移
      if (isAtClosureRule(ruleId)) {
        setAtSelection({
          phase: "selecting-contradiction",
          ruleId,
          principalNodeId: nodeId,
        });
        return;
      }

      // γ規則: 代入項入力
      let termText: string | undefined;
      if (isAtGammaRule(ruleId)) {
        const input = globalThis.prompt(msg.atTermPrompt, "");
        if (input === null) {
          setAtSelection({ phase: "idle" });
          return;
        }
        termText = input;
      }

      // δ規則: 固有変数入力
      let eigenVariable: string | undefined;
      if (isAtDeltaRule(ruleId)) {
        const input = globalThis.prompt(msg.atEigenVariablePrompt, "");
        if (input === null) {
          setAtSelection({ phase: "idle" });
          return;
        }
        eigenVariable = input;
      }

      // 結果ノードの配置位置計算
      const resultPositions: Point[] = [];
      resultPositions.push({
        x: conclusionNode.position.x - 100,
        y: conclusionNode.position.y - 150,
      });
      resultPositions.push({
        x: conclusionNode.position.x + 100,
        y: conclusionNode.position.y - 150,
      });

      const result = applyAtRuleAndConnect(
        workspace,
        nodeId,
        {
          ruleId,
          signedFormulaText: conclusionNode.formulaText,
          eigenVariable,
          termText,
        },
        resultPositions,
      );

      if (Either.isRight(result.validation)) {
        setWorkspaceWithAutoLayout(result.workspace);
      } else {
        const errorMsg = getAtErrorMessage(result.validation.left);
        globalThis.alert(errorMsg);
      }

      setAtSelection({ phase: "idle" });
    },
    [atSelection, workspace, setWorkspaceWithAutoLayout, msg],
  );

  // --- SC規則選択モードハンドラ ---

  const handleStartScRuleSelection = useCallback((ruleId: ScRuleId) => {
    setScSelection({ phase: "selecting-node", ruleId });
    setMPSelection({ phase: "idle" });
    setGenSelection({ phase: "idle" });
    setMergeSelection({ phase: "idle" });
    setTabSelection({ phase: "idle" });
    setAtSelection({ phase: "idle" });
  }, []);

  const handleCancelScSelection = useCallback(() => {
    setScSelection({ phase: "idle" });
  }, []);

  const handleNodeClickForSc = useCallback(
    (nodeId: string) => {
      if (scSelection.phase !== "selecting-node") return;

      const conclusionNode = findNode(workspace, nodeId);
      /* v8 ignore start -- 防御的: クリックされたノードはワークスペースに存在する */
      if (!conclusionNode) return;
      /* v8 ignore stop */

      const { ruleId } = scSelection;

      // 規則に応じて追加パラメータを収集
      let principalPosition = 0;
      let eigenVariable: string | undefined;
      let termText: string | undefined;
      let exchangePosition: number | undefined;
      let componentIndex: 1 | 2 | undefined;
      let cutFormulaText: string | undefined;

      // 交換規則: 位置入力
      if (ruleId === "exchange-left" || ruleId === "exchange-right") {
        const input = globalThis.prompt(msg.scExchangePositionPrompt, "0");
        if (input === null) {
          setScSelection({ phase: "idle" });
          return;
        }
        exchangePosition = parseInt(input, 10);
        if (Number.isNaN(exchangePosition)) {
          setScSelection({ phase: "idle" });
          return;
        }
      }

      // カット規則: カット式入力
      if (ruleId === "cut") {
        const input = globalThis.prompt(msg.scCutFormulaPrompt, "");
        if (input === null) {
          setScSelection({ phase: "idle" });
          return;
        }
        cutFormulaText = input;
      }

      // 公理・交換・カット以外: 主論理式の位置入力
      if (
        !isScAxiomRule(ruleId) &&
        ruleId !== "exchange-left" &&
        ruleId !== "exchange-right" &&
        ruleId !== "cut"
      ) {
        const input = globalThis.prompt(msg.scPositionPrompt, "0");
        if (input === null) {
          setScSelection({ phase: "idle" });
          return;
        }
        principalPosition = parseInt(input, 10);
        if (Number.isNaN(principalPosition)) {
          setScSelection({ phase: "idle" });
          return;
        }
      }

      // ∧左/∨右: 成分インデックス入力
      if (ruleId === "conjunction-left" || ruleId === "disjunction-right") {
        const input = globalThis.prompt(msg.scComponentIndexPrompt, "1");
        if (input === null) {
          setScSelection({ phase: "idle" });
          return;
        }
        const idx = parseInt(input, 10);
        if (idx !== 1 && idx !== 2) {
          setScSelection({ phase: "idle" });
          return;
        }
        componentIndex = idx;
      }

      // ∀左/∃右: 項テキスト入力
      if (ruleId === "universal-left" || ruleId === "existential-right") {
        const input = globalThis.prompt(msg.scTermPrompt, "");
        if (input === null) {
          setScSelection({ phase: "idle" });
          return;
        }
        termText = input;
      }

      // ⇒∀/∃⇒: 固有変数入力
      if (ruleId === "universal-right" || ruleId === "existential-left") {
        const input = globalThis.prompt(msg.scEigenVariablePrompt, "");
        if (input === null) {
          setScSelection({ phase: "idle" });
          return;
        }
        eigenVariable = input;
      }

      // 前提ノードの位置計算
      const premisePositions: Point[] = [];
      premisePositions.push({
        x: conclusionNode.position.x - 100,
        y: conclusionNode.position.y - 150,
      });
      premisePositions.push({
        x: conclusionNode.position.x + 100,
        y: conclusionNode.position.y - 150,
      });

      const result = applyScRuleAndConnect(
        workspace,
        nodeId,
        {
          ruleId,
          sequentText: conclusionNode.formulaText,
          principalPosition,
          eigenVariable,
          termText,
          exchangePosition,
          componentIndex,
          cutFormulaText,
        },
        premisePositions,
      );

      if (Either.isRight(result.validation)) {
        setWorkspaceWithAutoLayout(result.workspace);
      } else {
        const errorMsg = getScErrorMessage(result.validation.left);
        globalThis.alert(errorMsg);
      }

      setScSelection({ phase: "idle" });
    },
    [scSelection, workspace, setWorkspaceWithAutoLayout, msg],
  );

  // 統合ノードクリックハンドラ
  const handleNodeClickForSelection = useCallback(
    (nodeId: string) => {
      if (mpSelection.phase !== "idle") {
        handleNodeClickForMP(nodeId);
      } else if (genSelection.phase !== "idle") {
        handleNodeClickForGen(nodeId);
      } else if (mergeSelection.phase !== "idle") {
        handleNodeClickForMerge(nodeId);
      } else if (tabSelection.phase !== "idle") {
        handleNodeClickForTab(nodeId);
      } else if (atSelection.phase !== "idle") {
        handleNodeClickForAt(nodeId);
      } else if (scSelection.phase !== "idle") {
        handleNodeClickForSc(nodeId);
      }
    },
    [
      mpSelection,
      genSelection,
      mergeSelection,
      tabSelection,
      atSelection,
      scSelection,
      handleNodeClickForMP,
      handleNodeClickForGen,
      handleNodeClickForMerge,
      handleNodeClickForTab,
      handleNodeClickForAt,
      handleNodeClickForSc,
    ],
  );

  const isSelectionActive =
    mpSelection.phase !== "idle" ||
    genSelection.phase !== "idle" ||
    mergeSelection.phase !== "idle" ||
    tabSelection.phase !== "idle" ||
    atSelection.phase !== "idle" ||
    scSelection.phase !== "idle";

  // --- MP互換ノードIDセット（ハイライト用） ---

  const mpCompatibleNodeIds: ReadonlySet<string> = useMemo(
    () =>
      mpSelection.phase === "selecting-right"
        ? computeMPCompatibleNodeIds(workspace.nodes, mpSelection.leftNodeId)
        : mpSelection.phase === "selecting-left-for-right"
          ? computeMPLeftCompatibleNodeIds(
              workspace.nodes,
              mpSelection.rightNodeId,
            )
          : new Set<string>(),
    [mpSelection, workspace.nodes],
  );

  // --- マージ対象ノードIDセット（ハイライト用） ---

  const mergeTargetNodeIds: ReadonlySet<string> = useMemo(() => {
    if (mergeSelection.phase !== "selecting-target") return new Set<string>();
    /* v8 ignore start -- isNodeProtected always returns false (design: goals separated from nodes) */
    const protectedIds = new Set(
      workspace.nodes
        .filter((n) => isNodeProtected(workspace, n.id))
        .map((n) => n.id),
    );
    /* v8 ignore stop */
    return findMergeTargets(
      mergeSelection.leaderNodeId,
      workspace.nodes,
      protectedIds,
    );
  }, [mergeSelection, workspace]);

  // --- MPノードの検証状態を計算 ---

  const mpValidations = useMemo(() => {
    const validations = new Map<
      string,
      { readonly message: string; readonly type: "error" | "success" }
    >();
    for (const node of workspace.nodes) {
      // InferenceEdge経由で結論ノードかどうかを判定（kindではなくInferenceEdgeで判定）
      const mpEdge = workspace.inferenceEdges.find(
        (e) => e._tag === "mp" && e.conclusionNodeId === node.id,
      );
      if (!mpEdge) continue;
      const result = validateMPApplication(workspace, node.id);
      const display = processValidationResult(
        result,
        msg.mpApplied,
        getMPErrorMessageKey,
        (e) => e._tag === "BothPremisesMissing",
        msg,
      );
      if (display) {
        validations.set(node.id, display);
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
      // InferenceEdge経由で結論ノードかどうかを判定（kindではなくInferenceEdgeで判定）
      const genEdgeRaw = workspace.inferenceEdges.find(
        (e) => e._tag === "gen" && e.conclusionNodeId === node.id,
      );
      if (!genEdgeRaw) continue;
      /* v8 ignore start -- 防御的: find述語でe._tag === "gen"チェック済み、else分岐は到達不能 */
      const variableName =
        genEdgeRaw._tag === "gen" ? genEdgeRaw.variableName : "";
      /* v8 ignore stop */
      const result = validateGenApplication(workspace, node.id, variableName);
      const display = processValidationResult(
        result,
        msg.genApplied,
        getGenErrorMessageKey,
        (e) => e._tag === "GenPremiseMissing",
        msg,
      );
      if (display) {
        validations.set(node.id, display);
      }
    }
    return validations;
  }, [workspace, msg]);

  // --- Substitutionノードの検証状態を計算 ---

  const substitutionValidations = useMemo(() => {
    const validations = new Map<
      string,
      { readonly message: string; readonly type: "error" | "success" }
    >();
    for (const node of workspace.nodes) {
      // InferenceEdge経由で結論ノードかどうかを判定（kindではなくInferenceEdgeで判定）
      const substEdgeRaw = workspace.inferenceEdges.find(
        (e) => e._tag === "substitution" && e.conclusionNodeId === node.id,
      );
      if (!substEdgeRaw) continue;
      /* v8 ignore start -- 防御的: find述語でe._tag === "substitution"チェック済み、else分岐は到達不能 */
      const entries =
        substEdgeRaw._tag === "substitution" ? substEdgeRaw.entries : [];
      /* v8 ignore stop */
      const result = validateSubstitutionApplication(
        workspace,
        node.id,
        entries,
      );
      // SubstPremiseMissing はエントリが空のときのみスキップ
      // （エントリがある場合は前提未接続をエラーとして表示する）
      const display = processValidationResult(
        result,
        msg.substitutionApplied,
        getSubstitutionErrorMessageKey,
        (e) => e._tag === "SubstPremiseMissing" && entries.length === 0,
        msg,
      );
      if (display) {
        validations.set(node.id, display);
      }
    }
    return validations;
  }, [workspace, msg]);

  // --- ゴールチェック（workspace.goalsベース） ---

  const goalCheckResult = useMemo(
    () => checkGoal(workspace.goals, workspace.nodes),
    [workspace.goals, workspace.nodes],
  );

  // --- クエストゴールチェック（クエストモード: 保護ノードベース、公理制限付き） ---

  const questGoalResult = useMemo(
    () =>
      workspace.mode === "quest"
        ? checkQuestGoalsWithAxioms(
            workspace.goals,
            workspace.nodes,
            workspace.inferenceEdges,
            workspace.system,
          )
        : undefined,
    [
      workspace.mode,
      workspace.goals,
      workspace.nodes,
      workspace.inferenceEdges,
      workspace.system,
    ],
  );

  // --- ゴールパネルデータ ---

  const goalPanelData = useMemo(
    () =>
      computeGoalPanelData(workspace.goals, goalCheckResult, availableAxioms),
    [workspace.goals, goalCheckResult, availableAxioms],
  );

  const isGoalAchievedButAxiomViolation =
    questGoalResult?._tag === "AllAchievedButAxiomViolation";

  const isGoalAchieved =
    (goalCheckResult._tag === "GoalAllAchieved" &&
      !isGoalAchievedButAxiomViolation) ||
    questGoalResult?._tag === "AllAchieved";

  // --- ゴール達成コールバック（達成へ遷移した瞬間に1回だけ発火） ---
  // 公理制限違反がある場合はonGoalAchievedを発火しない（クエスト進捗に記録させない）

  const prevGoalAchievedRef = useRef(false);

  useEffect(() => {
    if (isGoalAchieved && !prevGoalAchievedRef.current) {
      if (onGoalAchieved) {
        if (questGoalResult?._tag === "AllAchieved") {
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
    prevGoalAchievedRef.current = isGoalAchieved;
  }, [
    isGoalAchieved,
    goalCheckResult,
    questGoalResult,
    onGoalAchieved,
    workspace.nodes,
  ]);

  // --- 公理名自動判別 ---

  const axiomNames = useMemo(() => {
    const names = new Map<
      string,
      {
        readonly displayName: string;
      }
    >();
    for (const node of workspace.nodes) {
      const formula = parseNodeFormula(node);
      if (formula === undefined) continue;
      const result = identifyAxiomName(formula, workspace.system);
      if (
        result._tag === "Identified" ||
        result._tag === "TheoryAxiomIdentified"
      ) {
        names.set(node.id, {
          displayName: result.displayName,
        });
      }
    }
    return names;
  }, [workspace.nodes, workspace.system]);

  // --- 公理依存関係の計算 ---

  const nodeDependencies = useMemo(
    () => getAllNodeDependencies(workspace.nodes, workspace.inferenceEdges),
    [workspace.nodes, workspace.inferenceEdges],
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

      const infos = [...deps].map((depId): DependencyInfo => {
        const axInfo = axiomNames.get(depId);
        const depNode = findNode(workspace, depId);
        return {
          nodeId: depId,
          displayName: axInfo?.displayName ?? depNode?.label ?? depId,
        };
      });
      return deduplicateDependencyInfos(infos);
    },
    [nodeDependencies, axiomNames, workspace],
  );

  const handleRoleChange = useCallback(
    (nodeId: string, role: NodeRole | undefined) => {
      setWorkspace(updateNodeRole(workspace, nodeId, role));
    },
    [workspace, setWorkspace],
  );

  const handleDuplicateToFree = useCallback(() => {
    onDuplicateToFree?.();
  }, [onDuplicateToFree]);

  // --- ノード選択ハンドラ ---

  const handleNodeSelect = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      // MP/Gen選択モード中は選択操作を行わない
      if (mpSelection.phase !== "idle" || genSelection.phase !== "idle") return;
      // 編集中ノードのクリックは選択しない
      if (editingNodeIds.has(nodeId)) return;

      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        // Shift/Ctrl/Cmd+クリック: トグル選択
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
    const fileName = generateExportFileName(
      getDeductionSystemName(workspace.deductionSystem),
      {
        year: d.getUTCFullYear(),
        month: d.getUTCMonth() + 1,
        day: d.getUTCDate(),
        hour: d.getUTCHours(),
        minute: d.getUTCMinutes(),
      },
    );
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
      getDeductionSystemName(workspace.deductionSystem),
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
          getDeductionSystemName(workspace.deductionSystem),
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
    // マーキー選択直後のclickイベントはスキップ
    /* v8 ignore start -- マーキー操作後のclick抑制: JSDOMではマーキー操作が再現不可 */
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    /* v8 ignore stop */
    // キャンバスの空白部分クリックで選択解除
    if (selectedNodeIds.size > 0) {
      setSelectedNodeIds(clearSelection());
    }
    // コンテキストメニューを閉じる（useEffectのpointerdownが先に閉じるため通常は到達しないが防御的に残す）
    /* v8 ignore start */
    if (nodeMenuState.open) {
      setNodeMenuState(closeNodeMenu());
    }
    if (lineMenuState.open) {
      setLineMenuState(closeLineMenu());
    }
    /* v8 ignore stop */
  }, [selectedNodeIds, nodeMenuState.open, lineMenuState.open]);

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
      workspace.inferenceEdges,
    );
    setSelectedNodeIds(subtreeIds);
    setNodeMenuState(closeNodeMenu());
  }, [nodeMenuState, workspace.inferenceEdges]);

  const handleSelectProof = useCallback(() => {
    if (!nodeMenuState.open) return;
    const proofIds = getProofNodeIds(
      nodeMenuState.nodeId,
      workspace.inferenceEdges,
    );
    setSelectedNodeIds(proofIds);
    setNodeMenuState(closeNodeMenu());
  }, [nodeMenuState, workspace.inferenceEdges]);

  // コンテキストメニューから「論理式を編集」
  const handleEditFormula = useCallback(() => {
    if (!nodeMenuState.open) return;
    setEditRequestNodeId(nodeMenuState.nodeId);
    setNodeMenuState(closeNodeMenu());
  }, [nodeMenuState]);

  // コンテキストメニューから「MPの左前提として使う」
  const handleUseAsMPLeft = useCallback(() => {
    if (!nodeMenuState.open) return;
    setMPSelection({
      phase: "selecting-right",
      leftNodeId: nodeMenuState.nodeId,
    });
    setGenSelection({ phase: "idle" });
    setMergeSelection({ phase: "idle" });
    setNodeMenuState(closeNodeMenu());
  }, [nodeMenuState]);

  // コンテキストメニューから「MPの右前提として使う」
  const handleUseAsMPRight = useCallback(() => {
    if (!nodeMenuState.open) return;
    setMPSelection({
      phase: "selecting-left-for-right",
      rightNodeId: nodeMenuState.nodeId,
    });
    setGenSelection({ phase: "idle" });
    setMergeSelection({ phase: "idle" });
    setNodeMenuState(closeNodeMenu());
  }, [nodeMenuState]);

  // コンテキストメニューから「Genを適用する」（変数名入力付き）
  const [genPromptNodeId, setGenPromptNodeId] = useState<string | null>(null);
  const [genPromptInput, setGenPromptInput] = useState("");

  const handleApplyGenToNode = useCallback(() => {
    if (!nodeMenuState.open) return;
    setGenPromptNodeId(nodeMenuState.nodeId);
    setGenPromptInput("");
    setNodeMenuState(closeNodeMenu());
  }, [nodeMenuState]);

  const handleGenPromptConfirm = useCallback(() => {
    if (genPromptNodeId === null) return;
    const variableName = genPromptInput.trim();
    if (variableName === "") return;

    const premiseNode = findNode(workspace, genPromptNodeId);
    if (!premiseNode) return;

    const genPosition: Point = {
      x: premiseNode.position.x,
      y: premiseNode.position.y + 150,
    };

    const result = applyGenAndConnect(
      workspace,
      genPromptNodeId,
      variableName,
      genPosition,
    );

    setWorkspaceWithAutoLayout(result.workspace);
    setGenPromptNodeId(null);
    setGenPromptInput("");
  }, [genPromptNodeId, genPromptInput, workspace, setWorkspaceWithAutoLayout]);

  const handleGenPromptCancel = useCallback(() => {
    setGenPromptNodeId(null);
    setGenPromptInput("");
  }, []);

  // コンテキストメニューから「Merge with...」
  const handleStartMergeFromMenu = useCallback(() => {
    if (!nodeMenuState.open) return;
    const nodeId = nodeMenuState.nodeId;
    setMergeSelection({ phase: "selecting-target", leaderNodeId: nodeId });
    setMPSelection({ phase: "idle" });
    setGenSelection({ phase: "idle" });
    setNodeMenuState(closeNodeMenu());
  }, [nodeMenuState]);

  // コンテキストメニューから「Substitutionを適用する」
  const [substPromptNodeId, setSubstPromptNodeId] = useState<string | null>(
    null,
  );
  type SubstPromptEntry = {
    readonly kind: "formula" | "term";
    readonly metaVar: string;
    readonly value: string;
  };
  const [substPromptEntries, setSubstPromptEntries] = useState<
    readonly SubstPromptEntry[]
  >([{ kind: "formula", metaVar: "", value: "" }]);

  const handleApplySubstitutionToNode = useCallback(() => {
    if (!nodeMenuState.open) return;
    const nodeId = nodeMenuState.nodeId;
    const node = findNode(workspace, nodeId);
    setSubstPromptNodeId(nodeId);

    // 論理式からメタ変数を自動抽出してテンプレート生成
    if (node?.formulaText) {
      const targets = extractSubstitutionTargetsFromText(node.formulaText);
      if (targets !== null) {
        const template = generateSubstitutionEntryTemplate(targets);
        if (template.length > 0) {
          setSubstPromptEntries(
            template.map((entry) =>
              entry._tag === "FormulaSubstitution"
                ? {
                    kind: "formula" as const,
                    metaVar:
                      entry.metaVariableSubscript !== undefined
                        ? `${entry.metaVariableName satisfies string}_${entry.metaVariableSubscript satisfies string}`
                        : `${entry.metaVariableName satisfies string}`,
                    value: "",
                  }
                : {
                    kind: "term" as const,
                    metaVar:
                      entry.metaVariableSubscript !== undefined
                        ? `${entry.metaVariableName satisfies string}_${entry.metaVariableSubscript satisfies string}`
                        : `${entry.metaVariableName satisfies string}`,
                    value: "",
                  },
            ),
          );
          setNodeMenuState(closeNodeMenu());
          return;
        }
      }
    }

    // フォールバック: 手動入力用の空エントリ
    setSubstPromptEntries([{ kind: "formula", metaVar: "", value: "" }]);
    setNodeMenuState(closeNodeMenu());
  }, [nodeMenuState, workspace]);

  const handleSubstPromptConfirm = useCallback(() => {
    if (substPromptNodeId === null) return;

    const entries: SubstitutionEntries = substPromptEntries
      .filter((e) => e.metaVar.trim() !== "" && e.value.trim() !== "")
      .map((e) =>
        e.kind === "formula"
          ? {
              _tag: "FormulaSubstitution" as const,
              metaVariableName:
                e.metaVar.trim() as import("../logic-core/greekLetters").GreekLetter,
              formulaText: e.value.trim(),
            }
          : {
              _tag: "TermSubstitution" as const,
              metaVariableName:
                e.metaVar.trim() as import("../logic-core/greekLetters").GreekLetter,
              termText: e.value.trim(),
            },
      );

    if (entries.length === 0) return;

    const premiseNode = findNode(workspace, substPromptNodeId);
    if (!premiseNode) return;

    const substPosition: Point = {
      x: premiseNode.position.x,
      y: premiseNode.position.y + 150,
    };

    const result = applySubstitutionAndConnect(
      workspace,
      substPromptNodeId,
      entries,
      substPosition,
    );

    setWorkspaceWithAutoLayout(result.workspace);
    setSubstPromptNodeId(null);
    setSubstPromptEntries([{ kind: "formula", metaVar: "", value: "" }]);
  }, [
    substPromptNodeId,
    substPromptEntries,
    workspace,
    setWorkspaceWithAutoLayout,
  ]);

  const handleSubstPromptCancel = useCallback(() => {
    setSubstPromptNodeId(null);
    setSubstPromptEntries([{ kind: "formula", metaVar: "", value: "" }]);
  }, []);

  const handleSubstEntryValueChange = useCallback(
    (index: number, val: string) => {
      setSubstPromptEntries((prev) =>
        prev.map((entry, i) =>
          i === index ? { ...entry, value: val } : entry,
        ),
      );
    },
    [],
  );

  // --- エッジバッジ編集（ポップオーバー） ---
  const [edgeBadgeEditState, setEdgeBadgeEditState] =
    useState<EdgeBadgeEditState | null>(null);

  const handleEdgeBadgeClick = useCallback(
    (conclusionNodeId: string) => {
      const edge = workspace.inferenceEdges.find(
        (e) => e.conclusionNodeId === conclusionNodeId,
      );
      if (!edge) return;
      // Substitutionエッジの場合、前提ノードの論理式テキストを取得してメタ変数自動抽出に使用
      const premiseFormulaText =
        edge._tag === "substitution" && edge.premiseNodeId !== undefined
          ? findNode(workspace, edge.premiseNodeId)?.formulaText
          : undefined;
      const editState = createEditStateFromEdge(edge, premiseFormulaText);
      if (!editState) return;
      setEdgeBadgeEditState(editState);
    },
    [workspace],
  );

  const handleEdgeBadgeConfirmGen = useCallback(
    (conclusionNodeId: string, variableName: string) => {
      const updated = updateInferenceEdgeGenVariableName(
        workspace,
        conclusionNodeId,
        variableName,
      );
      setWorkspaceWithAutoLayout(updated);
      setEdgeBadgeEditState(null);
    },
    [workspace, setWorkspaceWithAutoLayout],
  );

  const handleEdgeBadgeConfirmSubstitution = useCallback(
    /* v8 ignore start -- エッジバッジ編集: SVG接続線上のバッジクリックが必要。ブラウザテストで検証 */
    (conclusionNodeId: string, entries: SubstitutionEntries) => {
      const updated = updateInferenceEdgeSubstitutionEntries(
        workspace,
        conclusionNodeId,
        entries,
      );
      setWorkspaceWithAutoLayout(updated);
      setEdgeBadgeEditState(null);
    },
    [workspace, setWorkspaceWithAutoLayout],
  );

  const handleEdgeBadgeCancel = useCallback(() => {
    setEdgeBadgeEditState(null);
  }, []);
  /* v8 ignore stop */

  // コンテキストメニュー表示時のノード情報（メニューの enabled/disabled 判定用）
  const menuNodeIsImplication = useMemo(() => {
    if (!nodeMenuState.open) return false;
    const node = findNode(workspace, nodeMenuState.nodeId);
    if (!node) return false;
    return isNodeImplication(node);
  }, [nodeMenuState, workspace]);

  const menuNodeHasGenEnabled = workspace.system.generalization;

  const menuNodeIsProtected = useMemo(() => {
    if (!nodeMenuState.open) return false;
    return isNodeProtected(workspace, nodeMenuState.nodeId);
  }, [nodeMenuState, workspace]);

  const menuNodeIsEditable = useMemo(() => {
    if (!nodeMenuState.open) return false;
    if (menuNodeIsProtected) return false;
    return nodeClassifications.get(nodeMenuState.nodeId) !== "derived";
  }, [nodeMenuState, menuNodeIsProtected, nodeClassifications]);

  // コンテキストメニューから「ノードを削除する」
  const handleDuplicateNode = useCallback(() => {
    if (!nodeMenuState.open) return;
    const result = duplicateNode(workspace, nodeMenuState.nodeId);
    setWorkspaceWithAutoLayout(result.workspace);
    setSelectedNodeIds(result.newNodeIds);
    setNodeMenuState(closeNodeMenu());
  }, [nodeMenuState, workspace, setWorkspaceWithAutoLayout]);

  const handleDeleteNode = useCallback(() => {
    if (!nodeMenuState.open) return;
    const result = removeNode(workspace, nodeMenuState.nodeId);
    setWorkspaceWithAutoLayout(result);
    setNodeMenuState(closeNodeMenu());
  }, [nodeMenuState, workspace, setWorkspaceWithAutoLayout]);

  // ノードコンテキストメニュー外クリックで閉じる
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

  // --- 接続線コンテキストメニュー ---

  const handleConnectionContextMenu = useCallback(
    (connectionId: string, screenX: number, screenY: number) => {
      setLineMenuState(openLineMenu(connectionId, screenX, screenY));
    },
    [],
  );

  /* v8 ignore start -- 接続線コンテキストメニュー: SVG上の右クリック操作が必要。ブラウザテストで検証 */
  const handleDeleteConnection = useCallback(() => {
    if (!lineMenuState.open) return;
    const result = removeConnection(workspace, lineMenuState.connectionId);
    setWorkspaceWithAutoLayout(revalidateInferenceConclusions(result));
    setLineMenuState(closeLineMenu());
  }, [lineMenuState, workspace, setWorkspaceWithAutoLayout]);

  // 接続線コンテキストメニュー外クリックで閉じる
  useEffect(() => {
    if (!lineMenuState.open) return;
    const handleClickOutside = (e: PointerEvent) => {
      if (
        lineMenuRef.current !== null &&
        !lineMenuRef.current.contains(e.target as Node)
      ) {
        setLineMenuState(closeLineMenu());
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [lineMenuState.open]);
  /* v8 ignore stop */

  // ワークスペース操作メニュー外クリックで閉じる
  useEffect(() => {
    if (!workspaceMenuOpen) return;
    const handleClickOutside = (e: PointerEvent) => {
      if (
        workspaceMenuRef.current !== null &&
        !workspaceMenuRef.current.contains(e.target as Node) &&
        workspaceMenuButtonRef.current !== null &&
        !workspaceMenuButtonRef.current.contains(e.target as Node)
      ) {
        setWorkspaceMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [workspaceMenuOpen]);

  // --- キャンバス空白部分コンテキストメニュー ---

  const handleCanvasContextMenu = useCallback(
    (e: React.MouseEvent) => {
      // ノード上の右クリックは handleNodeContextMenu で処理済み
      // ここではキャンバスの空白部分のみ
      e.preventDefault();
      const worldPos = screenToWorld(viewport, {
        x: e.clientX,
        y: e.clientY,
      });
      setCanvasMenuState({
        open: true,
        screenPosition: { x: e.clientX, y: e.clientY },
        worldPosition: worldPos,
      });
    },
    [viewport],
  );

  const handleCanvasMenuAddNode = useCallback(() => {
    const ws = addNode(
      workspace,
      "axiom",
      msg.nodeLabelAxiom,
      canvasMenuState.worldPosition,
    );
    setWorkspace(ws);
    setCanvasMenuState({
      open: false,
      screenPosition: { x: 0, y: 0 },
      worldPosition: { x: 0, y: 0 },
    });
  }, [
    workspace,
    canvasMenuState.worldPosition,
    setWorkspace,
    msg.nodeLabelAxiom,
  ]);

  /* v8 ignore start -- キャンバスコンテキストメニュー外クリック: ref.contains使用でJSDOMではテスト不安定 */
  // キャンバスコンテキストメニュー外クリックで閉じる
  useEffect(() => {
    if (!canvasMenuState.open) return;
    const handleClickOutside = (e: PointerEvent) => {
      if (
        canvasMenuRef.current !== null &&
        !canvasMenuRef.current.contains(e.target as Node)
      ) {
        setCanvasMenuState((prev) => ({ ...prev, open: false }));
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [canvasMenuState.open]);
  /* v8 ignore stop */

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

  const mergeEnabled = useMemo(() => {
    if (selectedNodeIds.size < 2) return false;
    return canMergeSelectedNodes(
      [...selectedNodeIds],
      workspace.nodes,
      new Set(
        workspace.nodes
          .filter((n) => isNodeProtected(workspace, n.id))
          // v8 ignore: isNodeProtected currently always returns false (defensive code)
          /* v8 ignore next */
          .map((n) => n.id),
      ),
    );
  }, [selectedNodeIds, workspace]);

  const handleMergeSelected = useCallback(() => {
    if (selectedNodeIds.size < 2) return;
    const protectedIds = new Set(
      workspace.nodes
        .filter((n) => isNodeProtected(workspace, n.id))
        // v8 ignore: isNodeProtected currently always returns false (defensive code)
        /* v8 ignore next */
        .map((n) => n.id),
    );
    const groups = findMergeableGroups(
      [...selectedNodeIds],
      workspace.nodes,
      protectedIds,
    );
    if (groups.length === 0) return;

    let ws = workspace;
    for (const group of groups) {
      const result = mergeSelectedNodes(
        ws,
        group.leaderNodeId,
        group.absorbedNodeIds,
      );
      if (result._tag === "Success") {
        ws = result.workspace;
      }
    }

    setWorkspaceWithAutoLayout(ws);
    // マージ後はリーダーノードだけ選択
    const leaderIds = new Set(groups.map((g) => g.leaderNodeId));
    setSelectedNodeIds(leaderIds);
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
      } else if (isModifier && e.key === "m") {
        e.preventDefault();
        handleMergeSelected();
      } else if (isModifier && e.key === "a") {
        e.preventDefault();
        // Ctrl/Cmd+A: 全選択
        setSelectedNodeIds(new Set(workspace.nodes.map((n) => n.id)));
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteSelected();
      } else if (e.key === "Escape") {
        if (mergeSelection.phase !== "idle") {
          handleCancelMerge();
        } else {
          setSelectedNodeIds(clearSelection());
        }
      } else if (e.key === "Shift" && !e.repeat) {
        // Shiftキー押下でマーキー（矩形選択）モード有効化
        setIsShiftMarqueeActive(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftMarqueeActive(false);
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    container.addEventListener("keyup", handleKeyUp);
    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      container.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    editingNodeIds,
    handleCopy,
    handlePaste,
    handleCut,
    handleDuplicate,
    handleDeleteSelected,
    handleMergeSelected,
    mergeSelection,
    handleCancelMerge,
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

  const handleModeChange = useCallback(
    (nodeId: string, mode: EditorMode) => {
      setEditingNodeIds((prev) => {
        const next = new Set(prev);
        if (mode === "editing") {
          next.add(nodeId);
        } else {
          next.delete(nodeId);
        }
        return next;
      });
      // 編集モードに入ったら editRequest をクリア
      if (mode === "editing" && editRequestNodeId === nodeId) {
        setEditRequestNodeId(null);
      }
    },
    [editRequestNodeId],
  );

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

  // 接続済みポートのキー集合（未接続ポートを dimmed にするため）
  const connectedPortKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const conn of workspace.connections) {
      keys.add(
        `${conn.fromNodeId satisfies string}-${conn.fromPortId satisfies string}`,
      );
      keys.add(
        `${conn.toNodeId satisfies string}-${conn.toPortId satisfies string}`,
      );
    }
    return keys;
  }, [workspace.connections]);

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
          mpValidations.get(conn.toNodeId) ??
          genValidations.get(conn.toNodeId) ??
          substitutionValidations.get(conn.toNodeId);
        const fromClassification =
          nodeClassifications.get(fromNode.id) ?? "root-unmarked";
        const color = nodeValidation
          ? nodeValidation.type === "error"
            ? "var(--color-error, #e06060)"
            : "var(--color-success, #60c060)"
          : getNodeClassificationEdgeColor(fromClassification);

        // 推論エッジラベル: derivedノードへの接続にInferenceEdgeバッジを表示
        const inferenceEdge = findInferenceEdgeForConclusionNode(
          workspace.inferenceEdges,
          conn.toNodeId,
        );
        const edgeBadgeConclusionNodeId = inferenceEdge?.conclusionNodeId;
        const edgeLabel =
          inferenceEdge !== undefined ? (
            <InferenceEdgeBadge
              labelData={computeInferenceEdgeLabelDataForConnection(
                inferenceEdge,
                conn.fromNodeId,
              )}
              testId={
                testId
                  ? `${testId satisfies string}-edge-badge-${conn.id satisfies string}`
                  : undefined
              }
              onBadgeClick={
                edgeBadgeConclusionNodeId !== undefined
                  ? () => handleEdgeBadgeClick(edgeBadgeConclusionNodeId)
                  : undefined
              }
            />
          ) : undefined;

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
            label={edgeLabel}
            labelOffsetY={-12}
            onContextMenu={(screenX, screenY) => {
              handleConnectionContextMenu(conn.id, screenX, screenY);
            }}
            testId={
              testId
                ? `${testId satisfies string}-connection-${conn.id satisfies string}`
                : undefined
            }
          />
        );
      }),
    [
      workspace,
      nodeSizes,
      nodeClassifications,
      viewport,
      cullingEnabled,
      viewportBounds,
      mpValidations,
      genValidations,
      substitutionValidations,
      handDrawnConnections,
      handleConnectionContextMenu,
      handleEdgeBadgeClick,
      testId,
    ],
  );

  // --- Level-of-Detail ---

  const detailLevel = useMemo(
    () => computeDetailLevel(viewport.scale),
    [viewport.scale],
  );

  const visibilityOverrides: DetailVisibilityOverrides | undefined = useMemo(
    () => (showDependencies !== undefined ? { showDependencies } : undefined),
    [showDependencies],
  );

  // --- ノードのレンダリング ---

  const renderNode = useCallback(
    (node: WorkspaceNode) => {
      const isDragEnabled = !editingNodeIds.has(node.id) && !isSelectionActive;
      const isSelectedLeft =
        mpSelection.phase === "selecting-right" &&
        mpSelection.leftNodeId === node.id;
      const isSelectedRight =
        mpSelection.phase === "selecting-left-for-right" &&
        mpSelection.rightNodeId === node.id;
      const isPreSelectedNode = isSelectedLeft || isSelectedRight;
      const isNodeSelected = selectedNodeIds.has(node.id);

      // MP互換候補の判定（右前提候補 or 左前提候補）
      const isMPFiltering =
        mpSelection.phase === "selecting-right" ||
        mpSelection.phase === "selecting-left-for-right";
      const isMPCompatible =
        isMPFiltering && !isPreSelectedNode && mpCompatibleNodeIds.has(node.id);
      const isMPIncompatible =
        isMPFiltering &&
        !isPreSelectedNode &&
        !mpCompatibleNodeIds.has(node.id);

      // マージ候補の判定
      const isMergeLeader =
        mergeSelection.phase === "selecting-target" &&
        mergeSelection.leaderNodeId === node.id;
      const isMergeTarget =
        mergeSelection.phase === "selecting-target" &&
        !isMergeLeader &&
        mergeTargetNodeIds.has(node.id);
      const isMergeIncompatible =
        mergeSelection.phase === "selecting-target" &&
        !isMergeLeader &&
        !mergeTargetNodeIds.has(node.id);

      // ノードの検証状態（MPまたはGen）
      const ruleValidation =
        mpValidations.get(node.id) ??
        genValidations.get(node.id) ??
        substitutionValidations.get(node.id);

      const nodeValidation:
        | {
            readonly message: string;
            readonly type: "error" | "warning" | "success";
          }
        | undefined = ruleValidation;

      // 選択モードの視覚的ハイライト色
      const mergeHighlightColor =
        "var(--color-merge-highlight, rgba(74,148,217,0.6))";
      const selectionColor =
        mpSelection.phase !== "idle"
          ? "var(--color-mp-button-shadow, rgba(217,148,74,0.6))"
          : genSelection.phase !== "idle"
            ? "var(--color-gen-button-shadow, rgba(155,89,182,0.6))"
            : mergeSelection.phase !== "idle"
              ? mergeHighlightColor
              : undefined;

      // アウトラインスタイルの決定
      const outlineStyle = isPreSelectedNode
        ? `3px solid var(--color-mp-button, #d9944a)`
        : isMPCompatible
          ? `2px solid var(--color-mp-button, #d9944a)`
          : isMergeLeader
            ? `3px solid ${mergeHighlightColor satisfies string}`
            : isMergeTarget
              ? `2px solid ${mergeHighlightColor satisfies string}`
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
          onDragMove={notifyDragMove}
          onDragEnd={notifyDragEnd}
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
              opacity:
                isMPIncompatible || isMergeIncompatible ? 0.35 : undefined,
              transition: "opacity 0.15s ease",
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
              editable={nodeClassifications.get(node.id) !== "derived"}
              editTrigger="dblclick"
              statusMessage={nodeValidation?.message}
              statusType={nodeValidation?.type}
              classification={nodeClassifications.get(node.id)}
              onRoleChange={handleRoleChange}
              isProtected={isNodeProtected(workspace, node.id)}
              axiomName={axiomNames.get(node.id)?.displayName}
              dependencies={getNodeDependencyInfos(node.id)}
              detailLevel={detailLevel}
              visibilityOverrides={visibilityOverrides}
              onOpenSyntaxHelp={onOpenSyntaxHelp}
              substitutionEntries={(() => {
                const edge = workspace.inferenceEdges.find(
                  (e) =>
                    e._tag === "substitution" && e.conclusionNodeId === node.id,
                );
                return edge && edge._tag === "substitution"
                  ? edge.entries
                  : undefined;
              })()}
              forceEditMode={editRequestNodeId === node.id}
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
      mpCompatibleNodeIds,
      genSelection,
      mergeSelection,
      mergeTargetNodeIds,
      mpValidations,
      genValidations,
      substitutionValidations,
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
      onOpenSyntaxHelp,
      notifyDragMove,
      notifyDragEnd,
      editRequestNodeId,
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
      onContextMenu={handleCanvasContextMenu}
      onPointerMove={handleConnectionPointerMove}
      onPointerUp={handleConnectionPointerUp}
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
          {getDeductionSystemName(workspace.deductionSystem)}
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
            {onDuplicateToFree !== undefined ? (
              <button
                type="button"
                style={convertToFreeButtonStyle}
                onClick={handleDuplicateToFree}
                data-testid={
                  testId
                    ? `${testId satisfies string}-convert-free-button`
                    : undefined
                }
              >
                {msg.duplicateToFree}
              </button>
            ) : null}
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
        {/* ワークスペース操作メニュー（Export/Import） */}
        <span
          style={{
            borderLeft:
              "1px solid var(--color-panel-rule-line, rgba(180, 160, 130, 0.15))",
            paddingLeft: 8,
            marginLeft: 4,
            display: "inline-flex",
            alignItems: "center",
            position: "relative",
          }}
        >
          <button
            ref={workspaceMenuButtonRef}
            type="button"
            style={paperButtonStyle}
            onClick={() => setWorkspaceMenuOpen((prev) => !prev)}
            data-testid={
              testId
                ? `${testId satisfies string}-workspace-menu-button`
                : undefined
            }
            aria-label={msg.workspaceMenuAriaLabel}
            aria-expanded={workspaceMenuOpen}
          >
            ⋯
          </button>
          {workspaceMenuOpen ? (
            <div
              ref={workspaceMenuRef}
              data-testid={
                testId ? `${testId satisfies string}-workspace-menu` : undefined
              }
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 4,
                zIndex: 2000,
                minWidth: 150,
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
              <WorkspaceMenuItem
                label={msg.exportJSON}
                onClick={() => {
                  handleExportJSON();
                  setWorkspaceMenuOpen(false);
                }}
                testId={
                  testId
                    ? `${testId satisfies string}-export-json-button`
                    : undefined
                }
              />
              <WorkspaceMenuItem
                label={msg.exportSVG}
                onClick={() => {
                  handleExportSVG();
                  setWorkspaceMenuOpen(false);
                }}
                testId={
                  testId
                    ? `${testId satisfies string}-export-svg-button`
                    : undefined
                }
              />
              <WorkspaceMenuItem
                label={msg.exportPNG}
                onClick={() => {
                  handleExportPNG();
                  setWorkspaceMenuOpen(false);
                }}
                testId={
                  testId
                    ? `${testId satisfies string}-export-png-button`
                    : undefined
                }
              />
              <WorkspaceMenuItem
                label={msg.importJSON}
                onClick={() => {
                  handleImportJSON();
                  setWorkspaceMenuOpen(false);
                }}
                testId={
                  testId
                    ? `${testId satisfies string}-import-json-button`
                    : undefined
                }
              />
            </div>
          ) : null}
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
              : mpSelection.phase === "selecting-left-for-right"
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

      {/* マージ選択バナー */}
      {mergeSelection.phase !== "idle" ? (
        <div
          style={mergeSelectionBannerStyle}
          data-testid={
            testId ? `${testId satisfies string}-merge-banner` : undefined
          }
        >
          <span>{msg.mergeBannerSelectTarget}</span>
          <button
            type="button"
            style={cancelButtonStyle}
            onClick={handleCancelMerge}
          >
            {msg.mergeCancel}
          </button>
        </div>
      ) : null}

      {/* TAB規則選択バナー */}
      {tabSelection.phase !== "idle" ? (
        <div
          style={tabSelectionBannerStyle}
          data-testid={
            testId ? `${testId satisfies string}-tab-banner` : undefined
          }
        >
          <span>
            {formatMessage(msg.tabBannerSelectNode, {
              ruleName: getTabRuleDisplayName(tabSelection.ruleId),
            })}
          </span>
          <button
            type="button"
            style={cancelButtonStyle}
            onClick={handleCancelTabSelection}
          >
            {msg.tabCancel}
          </button>
        </div>
      ) : null}

      {/* AT規則選択バナー */}
      {atSelection.phase !== "idle" ? (
        <div
          style={atSelectionBannerStyle}
          data-testid={
            testId ? `${testId satisfies string}-at-banner` : undefined
          }
        >
          <span>
            {atSelection.phase === "selecting-contradiction"
              ? msg.atClosureBannerSelectContradiction
              : formatMessage(msg.atBannerSelectNode, {
                  ruleName: getAtRuleDisplayName(atSelection.ruleId),
                })}
          </span>
          <button
            type="button"
            style={cancelButtonStyle}
            onClick={handleCancelAtSelection}
          >
            {msg.atCancel}
          </button>
        </div>
      ) : null}

      {/* SC規則選択バナー */}
      {scSelection.phase !== "idle" ? (
        <div
          style={scSelectionBannerStyle}
          data-testid={
            testId ? `${testId satisfies string}-sc-banner` : undefined
          }
        >
          <span>
            {formatMessage(msg.scBannerSelectNode, {
              ruleName: getScRuleDisplayName(scSelection.ruleId),
            })}
          </span>
          <button
            type="button"
            style={cancelButtonStyle}
            onClick={handleCancelScSelection}
          >
            {msg.scCancel}
          </button>
        </div>
      ) : null}

      {/* Gen変数名入力プロンプト（コンテキストメニューから起動） */}
      {genPromptNodeId !== null ? (
        <div
          style={genSelectionBannerStyle}
          data-testid={
            testId
              ? `${testId satisfies string}-gen-prompt-banner`
              : "gen-prompt-banner"
          }
          onClick={(e) => e.stopPropagation()}
        >
          <span>{msg.genVariablePrompt}</span>
          <input
            type="text"
            value={genPromptInput}
            onChange={(e) => {
              setGenPromptInput(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleGenPromptConfirm();
              } else if (e.key === "Escape") {
                handleGenPromptCancel();
              }
            }}
            autoFocus
            style={genVariableInputStyle}
            data-testid={
              testId
                ? `${testId satisfies string}-gen-prompt-input`
                : "gen-prompt-input"
            }
          />
          <button
            type="button"
            style={cancelButtonStyle}
            onClick={handleGenPromptConfirm}
            disabled={genPromptInput.trim() === ""}
            data-testid={
              testId
                ? `${testId satisfies string}-gen-prompt-confirm`
                : "gen-prompt-confirm"
            }
          >
            {msg.genApply}
          </button>
          <button
            type="button"
            style={cancelButtonStyle}
            onClick={handleGenPromptCancel}
          >
            {msg.cancel}
          </button>
        </div>
      ) : null}

      {/* 代入プロンプトバナー */}
      {substPromptNodeId !== null ? (
        <div
          style={substBannerStyle}
          data-testid={
            testId
              ? `${testId satisfies string}-subst-prompt-banner`
              : "subst-prompt-banner"
          }
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              handleSubstPromptCancel();
            }
          }}
        >
          <span>{msg.substEntryPrompt}</span>
          {substPromptEntries.map((entry, i) => (
            <div key={i} style={substEntryRowStyle}>
              <span
                style={substKindLabelStyle}
                data-testid={
                  testId
                    ? `${testId satisfies string}-subst-kind-${String(i) satisfies string}`
                    : `subst-kind-${String(i) satisfies string}`
                }
              >
                {entry.kind === "formula"
                  ? msg.substitutionKindFormula
                  : msg.substitutionKindTerm}
              </span>
              <span
                style={{ ...substLabelStyle, width: 30 }}
                data-testid={
                  testId
                    ? `${testId satisfies string}-subst-metavar-${String(i) satisfies string}`
                    : `subst-metavar-${String(i) satisfies string}`
                }
              >
                {entry.metaVar}
              </span>
              <span style={{ color: "var(--color-node-text, #fff)" }}>:=</span>
              {entry.kind === "formula" ? (
                <FormulaInput
                  value={entry.value}
                  onChange={(value) => {
                    handleSubstEntryValueChange(i, value);
                  }}
                  placeholder="alpha -> beta"
                  fontSize={12}
                  showPreview={false}
                  style={{ flex: 1, minWidth: 0, width: 120 }}
                  testId={
                    testId
                      ? `${testId satisfies string}-subst-value-${String(i) satisfies string}`
                      : `subst-value-${String(i) satisfies string}`
                  }
                />
              ) : (
                <TermInput
                  value={entry.value}
                  onChange={(value) => {
                    handleSubstEntryValueChange(i, value);
                  }}
                  placeholder="S(0)"
                  fontSize={12}
                  showPreview={false}
                  style={{ flex: 1, minWidth: 0, width: 120 }}
                  testId={
                    testId
                      ? `${testId satisfies string}-subst-value-${String(i) satisfies string}`
                      : `subst-value-${String(i) satisfies string}`
                  }
                />
              )}
            </div>
          ))}
          <div style={{ display: "flex", gap: 4 }}>
            <button
              type="button"
              style={cancelButtonStyle}
              onClick={handleSubstPromptConfirm}
              disabled={substPromptEntries.every(
                (e) => e.metaVar.trim() === "" || e.value.trim() === "",
              )}
              data-testid={
                testId
                  ? `${testId satisfies string}-subst-prompt-confirm`
                  : "subst-prompt-confirm"
              }
            >
              {msg.applySubstitution}
            </button>
            <button
              type="button"
              style={cancelButtonStyle}
              onClick={handleSubstPromptCancel}
            >
              {msg.cancel}
            </button>
          </div>
        </div>
      ) : null}

      {/* エッジバッジ編集ポップオーバー */}
      {edgeBadgeEditState !== null ? (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
          }}
          data-testid={
            testId ? `${testId satisfies string}-edge-popover` : "edge-popover"
          }
        >
          <EdgeParameterPopover
            editState={edgeBadgeEditState}
            onConfirmGen={handleEdgeBadgeConfirmGen}
            onConfirmSubstitution={handleEdgeBadgeConfirmSubstitution}
            onCancel={handleEdgeBadgeCancel}
            onOpenSyntaxHelp={onOpenSyntaxHelp}
            testId={
              testId
                ? `${testId satisfies string}-edge-popover-inner`
                : "edge-popover-inner"
            }
          />
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
              opacity: mergeEnabled ? 1 : 0.4,
            }}
            onClick={handleMergeSelected}
            disabled={!mergeEnabled}
            data-testid={
              testId ? `${testId satisfies string}-merge-button` : undefined
            }
          >
            {msg.selectionMerge}
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
              {(() => {
                const violatingIds = questGoalResult.goalResults
                  .flatMap((r) => [...r.violatingAxiomIds])
                  .filter((v, i, a) => a.indexOf(v) === i);
                const hasInstanceRoots = questGoalResult.goalResults.some(
                  (r) => r.hasInstanceRootNodes,
                );
                return (
                  <>
                    {violatingIds.length > 0
                      ? formatMessage(msg.axiomViolationDetail, {
                          axiomIds: violatingIds.join(", "),
                        })
                      : null}
                    {hasInstanceRoots ? (
                      <div style={{ marginTop: 2 }}>
                        {msg.instanceRootViolationDetail}
                      </div>
                    ) : null}
                  </>
                );
              })()}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* パレット: 演繹体系のスタイルに応じて切り替え */}
      {workspace.deductionSystem.style === "natural-deduction" ? (
        <NdRulePalette
          rules={availableNdRules}
          onAddAssumption={handleAddAssumption}
          testId={
            testId ? `${testId satisfies string}-nd-rule-palette` : undefined
          }
        />
      ) : workspace.deductionSystem.style === "tableau-calculus" ? (
        <TabRulePalette
          rules={availableTabRules}
          onAddSequent={handleAddSequent}
          onRuleClick={handleStartTabRuleSelection}
          selectedRuleId={
            tabSelection.phase === "selecting-node"
              ? tabSelection.ruleId
              : undefined
          }
          testId={
            testId ? `${testId satisfies string}-tab-rule-palette` : undefined
          }
        />
      ) : workspace.deductionSystem.style === "analytic-tableau" ? (
        <AtRulePalette
          rules={availableAtRules}
          onAddFormula={handleAddSignedFormula}
          onRuleClick={handleStartAtRuleSelection}
          selectedRuleId={
            atSelection.phase !== "idle" ? atSelection.ruleId : undefined
          }
          testId={
            testId ? `${testId satisfies string}-at-rule-palette` : undefined
          }
        />
      ) : workspace.deductionSystem.style === "sequent-calculus" ? (
        <ScRulePalette
          rules={availableScRules}
          onAddSequent={handleAddSequent}
          onRuleClick={handleStartScRuleSelection}
          selectedRuleId={
            scSelection.phase === "selecting-node"
              ? scSelection.ruleId
              : undefined
          }
          testId={
            testId ? `${testId satisfies string}-sc-rule-palette` : undefined
          }
        />
      ) : (
        <AxiomPalette
          axioms={availableAxioms}
          onAddAxiom={handleAddAxiom}
          referenceEntries={referenceEntries}
          locale={locale}
          onOpenReferenceDetail={onOpenReferenceDetail}
          testId={
            testId ? `${testId satisfies string}-axiom-palette` : undefined
          }
        />
      )}

      {/* ゴール一覧パネル */}
      <GoalPanel
        data={goalPanelData}
        messages={msg}
        testId={testId ? `${testId satisfies string}-goal-panel` : undefined}
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
          <WorkspaceMenuItem
            label={msg.selectSubtree}
            onClick={handleSelectSubtree}
            testId={
              testId
                ? `${testId satisfies string}-select-subtree`
                : "select-subtree"
            }
          />
          <WorkspaceMenuItem
            label={msg.selectProof}
            onClick={handleSelectProof}
            testId={
              testId
                ? `${testId satisfies string}-select-proof`
                : "select-proof"
            }
          />
          <WorkspaceMenuItem
            label={msg.editFormula}
            onClick={handleEditFormula}
            disabled={!menuNodeIsEditable}
            testId={
              testId
                ? `${testId satisfies string}-edit-formula`
                : "edit-formula"
            }
          />
          <div
            style={{
              height: 1,
              background: "var(--color-panel-border, rgba(180, 160, 130, 0.2))",
              margin: "4px 0",
            }}
          />
          <WorkspaceMenuItem
            label={msg.useAsMPLeft}
            onClick={handleUseAsMPLeft}
            testId={
              testId
                ? `${testId satisfies string}-use-as-mp-left`
                : "use-as-mp-left"
            }
          />
          <WorkspaceMenuItem
            label={msg.useAsMPRight}
            onClick={handleUseAsMPRight}
            disabled={!menuNodeIsImplication}
            testId={
              testId
                ? `${testId satisfies string}-use-as-mp-right`
                : "use-as-mp-right"
            }
          />
          {menuNodeHasGenEnabled ? (
            <WorkspaceMenuItem
              label={msg.applyGenToNode}
              onClick={handleApplyGenToNode}
              testId={
                testId
                  ? `${testId satisfies string}-apply-gen-to-node`
                  : "apply-gen-to-node"
              }
            />
          ) : null}
          <WorkspaceMenuItem
            label={msg.applySubstitutionToNode}
            onClick={handleApplySubstitutionToNode}
            testId={
              testId
                ? `${testId satisfies string}-apply-substitution-to-node`
                : "apply-substitution-to-node"
            }
          />
          <WorkspaceMenuItem
            label={msg.mergeWithNode}
            onClick={handleStartMergeFromMenu}
            disabled={menuNodeIsProtected}
            testId={
              testId
                ? `${testId satisfies string}-merge-with-node`
                : "merge-with-node"
            }
          />
          <div
            style={{
              height: 1,
              background: "var(--color-panel-border, rgba(180, 160, 130, 0.2))",
              margin: "4px 0",
            }}
          />
          <WorkspaceMenuItem
            label={msg.duplicateNode}
            onClick={handleDuplicateNode}
            testId={
              testId
                ? `${testId satisfies string}-duplicate-node`
                : "duplicate-node"
            }
          />
          <WorkspaceMenuItem
            label={msg.deleteNode}
            onClick={handleDeleteNode}
            disabled={menuNodeIsProtected}
            testId={
              testId ? `${testId satisfies string}-delete-node` : "delete-node"
            }
          />
        </div>
      ) : null}

      {/* 接続線コンテキストメニュー */}
      {lineMenuState.open ? (
        <div
          ref={lineMenuRef}
          data-testid={
            testId
              ? `${testId satisfies string}-line-context-menu`
              : "line-context-menu"
          }
          style={{
            position: "fixed",
            left: lineMenuState.screenPosition.x,
            top: lineMenuState.screenPosition.y,
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
          <WorkspaceMenuItem
            label={msg.deleteConnection}
            onClick={handleDeleteConnection}
            testId={
              testId
                ? `${testId satisfies string}-delete-connection`
                : "delete-connection"
            }
          />
        </div>
      ) : null}

      {/* キャンバス空白部分コンテキストメニュー */}
      {canvasMenuState.open ? (
        <div
          ref={canvasMenuRef}
          data-testid={
            testId
              ? `${testId satisfies string}-canvas-context-menu`
              : undefined
          }
          style={{
            position: "fixed",
            left: canvasMenuState.screenPosition.x,
            top: canvasMenuState.screenPosition.y,
            zIndex: 2000,
            minWidth: 160,
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
          <WorkspaceMenuItem
            label={msg.addNode}
            onClick={handleCanvasMenuAddNode}
            testId={
              testId
                ? `${testId satisfies string}-canvas-menu-add-node`
                : undefined
            }
          />
        </div>
      ) : null}

      {/* InfiniteCanvas */}
      <InfiniteCanvas
        viewport={viewport}
        onViewportChange={setViewport}
        panEnabled={connectionPreviewState === null && !marqueeEnabled}
        onEmptyAreaPointerDown={marqueeEnabled ? marqueePointerDown : undefined}
        onEmptyAreaPointerMove={
          marqueeEnabled ? handleMarqueePointerMove : undefined
        }
        onEmptyAreaPointerUp={
          marqueeEnabled ? handleMarqueePointerUp : undefined
        }
        onEmptyAreaClick={handleCanvasClick}
        marqueeRect={marqueeRect}
      >
        {connectionElements}
        {/* Connection preview line (shown during port drag) */}
        {connectionPreviewState !== null && (
          <ConnectionPreviewLine
            state={connectionPreviewState}
            viewport={viewport}
          />
        )}
        {workspace.nodes.filter((node) => !isNodeCulled(node)).map(renderNode)}
        {/* Connector ports for drag-to-connect */}
        {workspace.nodes.flatMap((node) => {
          const size = nodeSizes.get(node.id);
          if (!size) return [];
          const ports = getProofNodePorts(node.kind);
          return ports.map((port) => {
            const uniqueId = `${node.id satisfies string}-${port.id satisfies string}`;
            const isSnappedTarget =
              connectionPreviewState?.snappedTarget !== null &&
              connectionPreviewState?.snappedTarget?.itemId === node.id &&
              connectionPreviewState?.snappedTarget?.portOnItem.port.id ===
                port.id;
            return (
              <ConnectorPortComponent
                key={uniqueId}
                port={{ ...port, id: uniqueId }}
                itemPosition={node.position}
                itemWidth={size.width}
                itemHeight={size.height}
                viewport={viewport}
                highlighted={isSnappedTarget ?? false}
                color={
                  isSnappedTarget === true
                    ? connectionPreviewState?.isValid === true
                      ? "#3b82f6"
                      : "#ef4444"
                    : "var(--color-port-fill, #fff)"
                }
                borderColor={
                  isSnappedTarget === true
                    ? connectionPreviewState?.isValid === true
                      ? "#3b82f6"
                      : "#ef4444"
                    : "var(--color-port-border, #666)"
                }
                dimmed={
                  connectionPreviewState === null &&
                  !connectedPortKeys.has(uniqueId)
                }
                onPortDragStart={handlePortDragStart(node.id)}
              />
            );
          });
        })}
        <ZoomControlsComponent
          viewport={viewport}
          containerSize={containerSize}
          onViewportChange={setViewport}
          items={zoomItems}
          selectedItems={
            selectedZoomItems.length > 0 ? selectedZoomItems : undefined
          }
          position="bottom-left"
        />
        <MinimapComponent
          viewport={viewport}
          containerSize={containerSize}
          items={minimapItems}
          onViewportChange={setViewport}
          position="bottom-right"
        />
      </InfiniteCanvas>
      <EdgeScrollIndicator edgePenetration={edgePenetration} />
    </div>
  );
}
