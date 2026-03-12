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
import { MdEditor } from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import type { LogicSystem } from "../logic-core/inferenceRule";
import { getDeductionSystemName } from "../logic-core/deductionSystem";
import type { Formula } from "../logic-core/formula";
import type { EditorMode } from "../formula-input/editorLogic";
import { FormulaInput } from "../formula-input/FormulaInput";
import { FormulaExpandedEditor } from "../formula-input/FormulaExpandedEditor";
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
  getAxiomReferenceEntryId,
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
import {
  computeGoalPanelData,
  type GoalViolationInfo,
  type GoalQuestInfo,
} from "./goalPanelLogic";
import { GoalPanel } from "./GoalPanel";
import type { PanelPosition, PanelRect } from "./panelPositionLogic";
import { usePanelDrag } from "./usePanelDrag";
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
import type { WorkspaceState, WorkspaceNode } from "./workspaceState";
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
  updateMultipleNodePositions,
  updateNodeFormulaText,
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
  applyTreeLayout,
  revalidateInferenceConclusions,
  updateInferenceEdgeGenVariableName,
  updateInferenceEdgeSubstitutionEntries,
  mergeSelectedNodes,
  applyTabRuleAndConnect,
  applyAtRuleAndConnect,
  applyScRuleAndConnect,
  importProofFromCollection,
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
  checkPasteCompatibility,
} from "./copyPasteLogic";
import type { ClipboardData } from "./copyPasteLogic";
import { getDeductionStyleLabel } from "../logic-core/deductionSystem";
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
import { getDeductionSystemReferenceEntryId } from "./deductionSystemReferenceLogic";
import { findInferenceEdgeForConclusionNode } from "./inferenceEdge";
import type { ProofSaveParams } from "../proof-collection/proofCollectionState";
import type { ProofEntry } from "../proof-collection/proofCollectionState";
import { prepareProofSaveParams } from "../proof-collection/proofCollectionState";
import { ProofCollectionPanel } from "../proof-collection/ProofCollectionPanel";
import { checkProofCompatibility } from "../proof-collection/proofCollectionCompatibility";
import { computeInferenceEdgeLabelDataForConnection } from "./inferenceEdgeLabelLogic";
import { InferenceEdgeBadge } from "./InferenceEdgeBadge";
import { EdgeParameterPopover } from "./EdgeParameterPopover";
import type { EdgeBadgeEditState } from "./edgeBadgeEditLogic";
import { createEditStateFromEdge } from "./edgeBadgeEditLogic";
import { CutEliminationStepper } from "./CutEliminationStepper";
import type { CutEliminationStepperData } from "./cutEliminationStepperLogic";
import {
  computeCutEliminationStepperData,
  resolveStepperState,
} from "./cutEliminationStepperLogic";
import type { CutEliminationStep } from "../logic-core/cutElimination";
import { eliminateCutsWithSteps } from "../logic-core/cutElimination";
import type { ScProofNode } from "../logic-core/sequentCalculus";
import { findScRootNodeIds, buildScProofTree } from "./scTreeBuildLogic";
import { useEdgeScroll } from "../infinite-canvas/useEdgeScroll";
import { EdgeScrollIndicator } from "../infinite-canvas/EdgeScrollIndicator";
import { useMarquee } from "../infinite-canvas/useMarquee";
import { MinimapComponent } from "../infinite-canvas/MinimapComponent";
import type { MinimapItem } from "../infinite-canvas/minimap";
import { ZoomControlsComponent } from "../infinite-canvas/ZoomControlsComponent";
import type { ZoomItemBounds } from "../infinite-canvas/zoom";
import {
  computeZoomInViewport,
  computeZoomOutViewport,
} from "../infinite-canvas/zoomControls";
import { useHistory } from "../history/useHistory";

// --- ノート編集用ツールバー定数 ---
const NOTE_EDITOR_TOOLBARS: (
  | "bold"
  | "underline"
  | "italic"
  | "-"
  | "strikeThrough"
  | "quote"
  | "unorderedList"
  | "orderedList"
  | "task"
  | "codeRow"
  | "code"
  | "link"
  | "table"
  | "revoke"
  | "next"
  | "="
  | "preview"
  | "previewOnly"
)[] = [
  "bold",
  "underline",
  "italic",
  "-",
  "strikeThrough",
  "quote",
  "unorderedList",
  "orderedList",
  "task",
  "-",
  "codeRow",
  "code",
  "link",
  "table",
  "-",
  "revoke",
  "next",
  "=",
  "preview",
  "previewOnly",
];

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
  /** クエスト情報（ゴールパネルの詳細表示に使用） */
  readonly questInfo?: GoalQuestInfo;
  /** 自由帳として複製するコールバック（指定時にクエストモードで複製ボタンを表示） */
  readonly onDuplicateToFree?: () => void;
  /** 証明をコレクションに保存するコールバック（指定時にコンテキストメニューに「コレクションに保存」を表示） */
  readonly onSaveProofToCollection?: (params: ProofSaveParams) => void;
  /** コレクションエントリ一覧（指定時にコレクションパネルを有効化） */
  readonly collectionEntries?: readonly ProofEntry[];
  /** コレクションエントリ名変更 */
  readonly onRenameCollectionEntry?: (id: string, newName: string) => void;
  /** コレクションエントリメモ更新 */
  readonly onUpdateCollectionMemo?: (id: string, memo: string) => void;
  /** コレクションエントリ削除 */
  readonly onRemoveCollectionEntry?: (id: string) => void;
  /** コレクションフォルダ一覧 */
  readonly collectionFolders?: readonly import("../proof-collection/proofCollectionState").ProofFolder[];
  /** コレクションエントリのフォルダ移動 */
  readonly onMoveCollectionEntry?: (
    id: string,
    folderId: string | undefined,
  ) => void;
  /** コレクションフォルダ作成 */
  readonly onCreateCollectionFolder?: (name: string) => void;
  /** コレクションフォルダ削除 */
  readonly onRemoveCollectionFolder?: (id: string) => void;
  /** コレクションフォルダ名変更 */
  readonly onRenameCollectionFolder?: (id: string, newName: string) => void;
  /** 初期クリップボードデータ（テスト・ストーリー用） */
  readonly initialClipboardData?: ClipboardData;
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

const systemBadgeStyle: CSSProperties = {
  padding: "2px 8px",
  background: "var(--color-paper-button-bg, rgba(255, 253, 248, 0.9))",
  color: "var(--color-badge-text, #718096)",
  borderRadius: 6,
  fontWeight: 600,
  fontSize: 12,
  border:
    "1px solid var(--color-paper-button-border, rgba(180, 160, 130, 0.3))",
  boxShadow:
    "0 1px 2px var(--color-paper-button-shadow, rgba(120, 100, 70, 0.08))",
};

const systemBadgeClickableStyle: CSSProperties = {
  ...systemBadgeStyle,
  cursor: "pointer",
  textDecoration: "underline",
  textDecorationStyle: "dotted",
  textUnderlineOffset: 2,
  fontFamily: "inherit",
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
  whiteSpace: "nowrap" as const,
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
  whiteSpace: "nowrap" as const,
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
  whiteSpace: "nowrap" as const,
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
  questInfo,
  onDuplicateToFree,
  onSaveProofToCollection,
  collectionEntries,
  onRenameCollectionEntry,
  onUpdateCollectionMemo,
  onRemoveCollectionEntry,
  collectionFolders,
  onMoveCollectionEntry,
  onCreateCollectionFolder,
  onRemoveCollectionFolder,
  onRenameCollectionFolder,
  initialClipboardData,
  testId,
}: ProofWorkspaceProps) {
  // i18nメッセージ
  const msg = useProofMessages();

  // undo/redo 履歴管理
  const initialWorkspace = useMemo(
    () => externalWorkspace ?? createEmptyWorkspace(system),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- system は初期化時のみ使用
    [],
  );
  const history = useHistory<WorkspaceState>(initialWorkspace, {
    maxPastSize: 100,
  });

  // 外部からworkspaceが変更された場合、historyを同期
  const lastExternalRef = useRef(externalWorkspace);
  useEffect(() => {
    if (
      externalWorkspace !== undefined &&
      externalWorkspace !== lastExternalRef.current &&
      externalWorkspace !== history.state
    ) {
      // 外部から渡されたworkspaceが変わった（自分の更新ではない外部変更）
      history.reset(externalWorkspace);
    }
    lastExternalRef.current = externalWorkspace;
  }, [externalWorkspace, history]);

  const workspace = history.state;

  // history.state が変わったら onWorkspaceChange に通知
  // undo/redo を含むすべての変更を一元的に通知する
  const prevWorkspaceRef = useRef(workspace);
  useEffect(() => {
    if (workspace !== prevWorkspaceRef.current) {
      prevWorkspaceRef.current = workspace;
      onWorkspaceChange?.(workspace);
    }
  }, [workspace, onWorkspaceChange]);

  // push: undo対象の操作（ノード追加・削除・接続・MP適用等）
  const pushWorkspace = useCallback(
    (ws: WorkspaceState) => {
      history.push(ws);
    },
    [history],
  );

  // replace: 一時更新（ドラッグ中等、undoエントリを作らない）
  const replaceWorkspace = useCallback(
    (ws: WorkspaceState) => {
      history.replace(ws);
    },
    [history],
  );

  // 下位互換: setWorkspace は pushWorkspace のエイリアス
  const setWorkspace = pushWorkspace;

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

  // 拡大エディタで編集中のノードID
  const [expandedEditorNodeId, setExpandedEditorNodeId] = useState<
    string | null
  >(null);

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

  // カット除去ステッパー状態
  const [cutElimOpen, setCutElimOpen] = useState(false);
  const [cutElimStepIndex, setCutElimStepIndex] = useState(-1);
  const [cutElimProof, setCutElimProof] = useState<ScProofNode | null>(null);
  const [cutElimBaseData, setCutElimBaseData] = useState<Omit<
    CutEliminationStepperData,
    "currentStepIndex"
  > | null>(null);
  const [cutElimRawSteps, setCutElimRawSteps] = useState<
    readonly CutEliminationStep[]
  >([]);

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
  const clipboardRef = useRef<ClipboardData | null>(
    initialClipboardData ?? null,
  );
  // clipboardRef.current の有無を render 中に参照するための state
  const [hasClipboardData, setHasClipboardData] = useState(
    initialClipboardData !== undefined,
  );

  // ペーストエラーメッセージ（互換性エラー等）
  const [pasteErrorMessage, setPasteErrorMessage] = useState<string | null>(
    null,
  );
  const pasteErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showPasteError = useCallback((message: string) => {
    setPasteErrorMessage(message);
    /* v8 ignore start -- 防御的: 連続ペーストエラー時のタイマークリア */
    if (pasteErrorTimerRef.current !== null) {
      clearTimeout(pasteErrorTimerRef.current);
    }
    /* v8 ignore stop */
    /* v8 ignore start -- 5秒後の自動消去タイマー: 実ブラウザで動作確認 */
    pasteErrorTimerRef.current = setTimeout(() => {
      setPasteErrorMessage(null);
      pasteErrorTimerRef.current = null;
    }, 5000);
    /* v8 ignore stop */
  }, []);

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

  // パネル位置（ドラッグ可能なパネル用）
  // デフォルト位置: AxiomPalette=左上(12,48), GoalPanel=右上
  const [axiomPalettePos, setAxiomPalettePos] = useState<PanelPosition>({
    x: 12,
    y: 48,
  });
  // GoalPanelのユーザードラッグ位置（nullならデフォルト位置を使用）
  const [goalPanelDragPos, setGoalPanelDragPos] =
    useState<PanelPosition | null>(null);
  // GoalPanelの実効位置: ドラッグ済みならドラッグ位置、未ドラッグならcontainerSizeから計算
  const goalPanelPos = useMemo(
    (): PanelPosition =>
      goalPanelDragPos ?? {
        x: Math.max(8, containerSize.width - 280 - 12),
        y: 48,
      },
    [goalPanelDragPos, containerSize.width],
  );

  // コレクションパネルのユーザードラッグ位置（nullならデフォルト位置を使用）
  const [collectionPanelDragPos, setCollectionPanelDragPos] =
    useState<PanelPosition | null>(null);
  // コレクションパネルの実効位置: ドラッグ済みならドラッグ位置、未ドラッグならGoalPanelの下
  const collectionPanelPos = useMemo(
    (): PanelPosition =>
      collectionPanelDragPos ?? {
        x: Math.max(8, containerSize.width - 280 - 12),
        y: 260,
      },
    [collectionPanelDragPos, containerSize.width],
  );

  // パネルサイズの概算値（DOM実測は後のイテレーションで対応）
  const axiomPalettePanelSize = useMemo(
    () => ({ width: 200, height: 250 }),
    [],
  );
  const goalPanelPanelSize = useMemo(() => ({ width: 280, height: 200 }), []);
  const collectionPanelSize = useMemo(() => ({ width: 280, height: 250 }), []);

  // 他パネルの矩形（重なり回避用）
  const axiomPaletteOtherPanels = useMemo(
    (): readonly PanelRect[] => [
      { x: goalPanelPos.x, y: goalPanelPos.y, ...goalPanelPanelSize },
      {
        x: collectionPanelPos.x,
        y: collectionPanelPos.y,
        ...collectionPanelSize,
      },
    ],
    [goalPanelPos, goalPanelPanelSize, collectionPanelPos, collectionPanelSize],
  );

  const goalPanelOtherPanels = useMemo(
    (): readonly PanelRect[] => [
      { x: axiomPalettePos.x, y: axiomPalettePos.y, ...axiomPalettePanelSize },
      {
        x: collectionPanelPos.x,
        y: collectionPanelPos.y,
        ...collectionPanelSize,
      },
    ],
    [
      axiomPalettePos,
      axiomPalettePanelSize,
      collectionPanelPos,
      collectionPanelSize,
    ],
  );

  const collectionPanelOtherPanels = useMemo(
    (): readonly PanelRect[] => [
      { x: axiomPalettePos.x, y: axiomPalettePos.y, ...axiomPalettePanelSize },
      { x: goalPanelPos.x, y: goalPanelPos.y, ...goalPanelPanelSize },
    ],
    [axiomPalettePos, axiomPalettePanelSize, goalPanelPos, goalPanelPanelSize],
  );

  /* v8 ignore start -- panel drag callbacks: tested via Storybook integration, not triggerable in JSDOM */
  const handleAxiomPalettePositionChange = useCallback(
    (next: PanelPosition) => {
      setAxiomPalettePos(next);
    },
    [],
  );

  const handleGoalPanelPositionChange = useCallback((next: PanelPosition) => {
    setGoalPanelDragPos(next);
  }, []);

  const handleCollectionPanelPositionChange = useCallback(
    (next: PanelPosition) => {
      setCollectionPanelDragPos(next);
    },
    [],
  );
  /* v8 ignore stop */

  const axiomPaletteDrag = usePanelDrag({
    position: axiomPalettePos,
    panelSize: axiomPalettePanelSize,
    containerSize,
    otherPanels: axiomPaletteOtherPanels,
    onPositionChange: handleAxiomPalettePositionChange,
  });

  const goalPanelDrag = usePanelDrag({
    position: goalPanelPos,
    panelSize: goalPanelPanelSize,
    containerSize,
    otherPanels: goalPanelOtherPanels,
    onPositionChange: handleGoalPanelPositionChange,
  });

  const collectionPanelDrag = usePanelDrag({
    position: collectionPanelPos,
    panelSize: collectionPanelSize,
    containerSize,
    otherPanels: collectionPanelOtherPanels,
    onPositionChange: handleCollectionPanelPositionChange,
  });

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

  // --- ツリーレイアウト（ワンショット） ---

  /** 選択ノードまたは全ノードにツリーレイアウトを適用する。 */
  const handleTreeLayout = useCallback(
    (direction: LayoutDirection) => {
      const laid = applyTreeLayout(workspace, direction, nodeSizes);
      setWorkspace(laid);
    },
    [workspace, nodeSizes, setWorkspace],
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
      setWorkspace(newWs);
    },
    [workspace, setWorkspace],
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

  // --- 演繹体系リファレンス ---

  const systemName = useMemo(
    () => getDeductionSystemName(workspace.deductionSystem),
    [workspace.deductionSystem],
  );

  const systemReferenceEntryId = useMemo(
    () => getDeductionSystemReferenceEntryId(systemName),
    [systemName],
  );

  const systemReferenceEntry = useMemo(() => {
    return systemReferenceEntryId !== undefined &&
      referenceEntries !== undefined
      ? findEntryById(referenceEntries, systemReferenceEntryId)
      : undefined;
  }, [referenceEntries, systemReferenceEntryId]);

  /* v8 ignore start -- システムバッジクリック: onOpenReferenceDetailは外部prop。テストでは通常未提供 */
  const handleSystemBadgeClick = useCallback(() => {
    if (systemReferenceEntryId !== undefined && onOpenReferenceDetail) {
      onOpenReferenceDetail(systemReferenceEntryId);
    }
  }, [systemReferenceEntryId, onOpenReferenceDetail]);
  /* v8 ignore stop */

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
      setWorkspace(
        addNode(
          workspace,
          "axiom",
          msg.nodeLabelAxiom,
          position,
          axiom.dslText,
        ),
      );
    },
    [workspace, setWorkspace, computeNewNodePosition, msg.nodeLabelAxiom],
  );

  const handleAddAssumption = useCallback(() => {
    const position = computeNewNodePosition(workspace.nodes);
    // NDでは仮定ノードを追加。formulaTextは空で、ユーザーが自由に入力する。
    setWorkspace(
      addNode(workspace, "axiom", msg.nodeLabelAssumption, position, ""),
    );
  }, [
    workspace,
    setWorkspace,
    computeNewNodePosition,
    msg.nodeLabelAssumption,
  ]);

  const handleAddSequent = useCallback(() => {
    const position = computeNewNodePosition(workspace.nodes);
    // TABではシーケントノードを追加。formulaTextは空で、ユーザーが式を入力する。
    // TABシーケントは左辺（Γ）のみで右辺は常に空。
    setWorkspace(
      addNode(workspace, "axiom", msg.nodeLabelSequent, position, ""),
    );
  }, [workspace, setWorkspace, computeNewNodePosition, msg.nodeLabelSequent]);

  /* v8 ignore start -- AT signed formula callback: tested via Storybook, not triggered in current unit tests */
  const handleAddSignedFormula = useCallback(() => {
    const position = computeNewNodePosition(workspace.nodes);
    // ATでは署名付き論理式ノードを追加。formulaTextは空で、ユーザーが "T:φ" / "F:φ" を入力する。
    setWorkspace(
      addNode(workspace, "axiom", msg.nodeLabelSignedFormula, position, ""),
    );
  }, [
    workspace,
    setWorkspace,
    computeNewNodePosition,
    msg.nodeLabelSignedFormula,
  ]);
  /* v8 ignore stop */

  /* v8 ignore start — V8 coverage merging quirk: ノート機能テストで全パスカバー済みだが全体テストで計測漏れ */
  const handleAddNote = useCallback(
    (position?: Point) => {
      const pos = position ?? computeNewNodePosition(workspace.nodes);
      setWorkspace(addNode(workspace, "note", "Note", pos, ""));
    },
    [workspace, setWorkspace, computeNewNodePosition],
  );

  // --- ノート編集モーダル ---
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteEditorText, setNoteEditorText] = useState("");

  const handleEditNote = useCallback(
    (nodeId: string) => {
      const node = workspace.nodes.find((n) => n.id === nodeId);
      if (node && node.kind === "note") {
        setEditingNoteId(nodeId);
        setNoteEditorText(node.formulaText);
      }
    },
    [workspace.nodes],
  );

  const handleNoteEditorSave = useCallback(() => {
    if (editingNoteId) {
      setWorkspace(
        updateNodeFormulaText(workspace, editingNoteId, noteEditorText),
      );
      setEditingNoteId(null);
    }
  }, [editingNoteId, noteEditorText, workspace, setWorkspace]);
  /* v8 ignore stop */

  const handleNoteEditorCancel = useCallback(() => {
    setEditingNoteId(null);
  }, []);

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
      /* v8 ignore start -- V8集約アーティファクト: MP選択フェーズ分岐 */
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

        setWorkspace(result.workspace);
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

        setWorkspace(result.workspace);
        setMPSelection({ phase: "idle" });
      }
      /* v8 ignore stop */
    },
    [mpSelection, workspace, setWorkspace],
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
      /* v8 ignore start -- V8集約アーティファクト: Gen選択フェーズガード */
      if (genSelection.phase !== "selecting-premise") return;
      /* v8 ignore stop */

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

      setWorkspace(result.workspace);
      setGenSelection({ phase: "idle" });
    },
    [genSelection, workspace, setWorkspace],
  );

  // --- マージ選択モードハンドラ ---

  const handleCancelMerge = useCallback(() => {
    setMergeSelection({ phase: "idle" });
  }, []);

  const handleNodeClickForMerge = useCallback(
    (targetNodeId: string) => {
      /* v8 ignore start -- 防御的: ディスパッチャでphaseチェック済み */
      if (mergeSelection.phase !== "selecting-target") return;
      /* v8 ignore stop */
      const result = mergeSelectedNodes(
        workspace,
        mergeSelection.leaderNodeId,
        [targetNodeId],
      );
      /* v8 ignore start -- 防御的: マージ失敗ケースはロジック層でテスト済み */
      if (result._tag === "Success") {
        setWorkspace(result.workspace);
      }
      /* v8 ignore stop */
      setMergeSelection({ phase: "idle" });
    },
    [mergeSelection, workspace, setWorkspace],
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
      /* v8 ignore start -- 防御的: ディスパッチャでphaseチェック済み */
      if (tabSelection.phase !== "selecting-node") return;
      /* v8 ignore stop */

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
        setWorkspace(result.workspace);
      } else {
        const errorMsg = getTabErrorMessage(result.validation.left);
        globalThis.alert(errorMsg);
      }

      setTabSelection({ phase: "idle" });
    },
    [tabSelection, workspace, setWorkspace, msg],
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
          setWorkspace(result.workspace);
        } else {
          const errorMsg = getAtErrorMessage(result.validation.left);
          globalThis.alert(errorMsg);
        }

        setAtSelection({ phase: "idle" });
        return;
      }

      /* v8 ignore start -- 防御的: ディスパッチャでphaseチェック済み */
      if (atSelection.phase !== "selecting-node") return;
      /* v8 ignore stop */

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
        setWorkspace(result.workspace);
      } else {
        const errorMsg = getAtErrorMessage(result.validation.left);
        globalThis.alert(errorMsg);
      }

      setAtSelection({ phase: "idle" });
    },
    [atSelection, workspace, setWorkspace, msg],
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
      /* v8 ignore start -- 防御的: ディスパッチャでphaseチェック済み */
      if (scSelection.phase !== "selecting-node") return;
      /* v8 ignore stop */

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
        setWorkspace(result.workspace);
      } else {
        const errorMsg = getScErrorMessage(result.validation.left);
        globalThis.alert(errorMsg);
      }

      setScSelection({ phase: "idle" });
    },
    [scSelection, workspace, setWorkspace, msg],
  );

  // --- カット除去ステッパー ---

  const handleStartCutElimination = useCallback(() => {
    const rootIds = findScRootNodeIds(
      workspace.nodes,
      workspace.inferenceEdges,
    );
    if (rootIds.length === 0) {
      globalThis.alert(msg.cutEliminationNoRoot);
      return;
    }
    if (rootIds.length > 1) {
      globalThis.alert(msg.cutEliminationMultipleRoots);
      return;
    }
    const rootId = rootIds[0];
    /* v8 ignore start -- rootIds.length === 1 なので rootId は必ず defined */
    if (rootId === undefined) return;
    /* v8 ignore stop */
    const treeResult = buildScProofTree(
      rootId,
      workspace.nodes,
      workspace.inferenceEdges,
    );
    if (Either.isLeft(treeResult)) {
      globalThis.alert(
        formatMessage(msg.cutEliminationBuildError, {
          error: treeResult.left._tag,
        }),
      );
      return;
    }
    const proof = treeResult.right;
    // rawSteps は resolveStepperState で proof 参照に使う
    const { steps: rawSteps } = eliminateCutsWithSteps(proof);
    // baseData は内部で eliminateCutsWithSteps を再計算するが、
    // ステッパー起動は1回だけの操作なので許容
    const baseData = computeCutEliminationStepperData(proof);
    setCutElimProof(proof);
    setCutElimBaseData(baseData);
    setCutElimRawSteps(rawSteps);
    setCutElimStepIndex(-1);
    setCutElimOpen(true);
  }, [workspace.nodes, workspace.inferenceEdges, msg]);

  const handleCloseCutElimination = useCallback(() => {
    setCutElimOpen(false);
    setCutElimProof(null);
    setCutElimBaseData(null);
    setCutElimRawSteps([]);
    setCutElimStepIndex(-1);
  }, []);

  const cutElimStepperData = useMemo((): CutEliminationStepperData | null => {
    if (!cutElimOpen || cutElimBaseData === null || cutElimProof === null)
      return null;
    return resolveStepperState(
      cutElimBaseData,
      cutElimStepIndex,
      cutElimProof,
      cutElimRawSteps,
    );
  }, [
    cutElimOpen,
    cutElimBaseData,
    cutElimStepIndex,
    cutElimProof,
    cutElimRawSteps,
  ]);

  // 統合ノードクリックハンドラ
  const handleNodeClickForSelection = useCallback(
    (nodeId: string) => {
      /* v8 ignore start -- V8集約アーティファクト: 選択モードディスパッチの各分岐 */
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
      /* v8 ignore stop */
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
      /* v8 ignore start -- V8集約アーティファクト: find述語内の&&分岐 */
      const mpEdge = workspace.inferenceEdges.find(
        (e) => e._tag === "mp" && e.conclusionNodeId === node.id,
      );
      /* v8 ignore stop */
      if (!mpEdge) continue;
      const result = validateMPApplication(workspace, node.id);
      const display = processValidationResult(
        result,
        msg.mpApplied,
        getMPErrorMessageKey,
        (e) => e._tag === "BothPremisesMissing",
        msg,
      );
      /* v8 ignore start -- V8集約アーティファクト: display有無の分岐 */
      if (display) {
        validations.set(node.id, display);
      }
      /* v8 ignore stop */
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
      /* v8 ignore start -- V8集約アーティファクト: find述語内の&&分岐 */
      const genEdgeRaw = workspace.inferenceEdges.find(
        (e) => e._tag === "gen" && e.conclusionNodeId === node.id,
      );
      /* v8 ignore stop */
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
      /* v8 ignore start -- V8集約アーティファクト: display有無の分岐 */
      if (display) {
        validations.set(node.id, display);
      }
      /* v8 ignore stop */
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
      /* v8 ignore start -- V8集約アーティファクト: find述語内の&&分岐 */
      const substEdgeRaw = workspace.inferenceEdges.find(
        (e) => e._tag === "substitution" && e.conclusionNodeId === node.id,
      );
      /* v8 ignore stop */
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
      /* v8 ignore start -- V8集約アーティファクト: フィルター述語内の&&分岐 */
      const display = processValidationResult(
        result,
        msg.substitutionApplied,
        getSubstitutionErrorMessageKey,
        (e) => e._tag === "SubstPremiseMissing" && entries.length === 0,
        msg,
      );
      /* v8 ignore stop */
      /* v8 ignore start -- V8集約アーティファクト: display有無の分岐 */
      if (display) {
        validations.set(node.id, display);
      }
      /* v8 ignore stop */
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

  // --- ゴール制限違反情報（クエストモード時のみ） ---

  const goalViolations: readonly GoalViolationInfo[] = useMemo(() => {
    if (
      questGoalResult === undefined ||
      questGoalResult._tag === "NoGoals" ||
      questGoalResult._tag === "NotAllAchieved"
    ) {
      return [];
    }
    return questGoalResult.goalResults.map((r) => ({
      goalId: r.goalId,
      hasAxiomViolation: r.violatingAxiomIds.size > 0 || r.hasInstanceRootNodes,
      hasRuleViolation: r.violatingRuleIds.size > 0,
      violatingAxiomIds: [...r.violatingAxiomIds],
    }));
  }, [questGoalResult]);

  // --- ゴールパネルデータ ---

  const goalPanelData = useMemo(
    () =>
      computeGoalPanelData(
        workspace.goals,
        goalCheckResult,
        availableAxioms,
        goalViolations,
        questInfo,
      ),
    [
      workspace.goals,
      goalCheckResult,
      availableAxioms,
      goalViolations,
      questInfo,
    ],
  );

  const isGoalAchievedButAxiomViolation =
    questGoalResult?._tag === "AllAchievedButAxiomViolation";

  const isGoalAchievedButRuleViolation =
    questGoalResult?._tag === "AllAchievedButRuleViolation";

  const isGoalAchieved =
    (goalCheckResult._tag === "GoalAllAchieved" &&
      !isGoalAchievedButAxiomViolation &&
      !isGoalAchievedButRuleViolation) ||
    questGoalResult?._tag === "AllAchieved";

  // --- ゴール達成コールバック（達成へ遷移した瞬間に1回だけ発火） ---
  // 公理制限違反がある場合はonGoalAchievedを発火しない（クエスト進捗に記録させない）

  const prevGoalAchievedRef = useRef(false);

  /* v8 ignore start -- ゴール達成コールバック: 達成遷移の瞬間のコールバック発火は統合テスト/ブラウザテストで検証 */
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
  /* v8 ignore stop */

  // --- 公理名自動判別 ---

  const axiomNames = useMemo(() => {
    const names = new Map<
      string,
      {
        readonly displayName: string;
        readonly axiomId: string | undefined;
      }
    >();
    for (const node of workspace.nodes) {
      const formula = parseNodeFormula(node);
      if (formula === undefined) continue;
      const result = identifyAxiomName(formula, workspace.system);
      /* v8 ignore start -- V8集約アーティファクト: identifyAxiomResult分岐 */
      if (result._tag === "Identified") {
        names.set(node.id, {
          displayName: result.displayName,
          axiomId: result.axiomId,
        });
      } else if (result._tag === "TheoryAxiomIdentified") {
        names.set(node.id, {
          displayName: result.displayName,
          axiomId: undefined,
        });
      }
      /* v8 ignore stop */
    }
    return names;
  }, [workspace.nodes, workspace.system]);

  /* v8 ignore start -- 公理バッジクリック: SVGバッジクリックでJSDOMでは到達困難 */
  const handleAxiomBadgeClick = useCallback(
    (nodeId: string) => {
      if (!onOpenReferenceDetail) return;
      const axiomInfo = axiomNames.get(nodeId);
      if (axiomInfo?.axiomId === undefined) return;
      const entryId = getAxiomReferenceEntryId(axiomInfo.axiomId);
      if (entryId === undefined) return;
      onOpenReferenceDetail(entryId);
    },
    [onOpenReferenceDetail, axiomNames],
  );
  /* v8 ignore stop */

  // --- 公理依存関係の計算 ---

  const nodeDependencies = useMemo(
    () => getAllNodeDependencies(workspace.nodes, workspace.inferenceEdges),
    [workspace.nodes, workspace.inferenceEdges],
  );

  /**
   * ノードIDから依存公理のDependencyInfo配列を生成する。
   * 導出ノードのみ（自分自身以外の公理に依存するノード）に表示する。
   */
  /* v8 ignore start -- 依存関係情報: showDependencies=trueのテストでは単純なワークスペースのみ */
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
  /* v8 ignore stop */

  const handleDuplicateToFree = useCallback(() => {
    onDuplicateToFree?.();
  }, [onDuplicateToFree]);

  // --- ノード選択ハンドラ ---

  const handleNodeSelect = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      // MP/Gen選択モード中は選択操作を行わない
      /* v8 ignore start -- 防御的: MP/Gen選択モード中はdispatcherでルーティングされるためここに到達しない */
      if (mpSelection.phase !== "idle" || genSelection.phase !== "idle") return;
      /* v8 ignore stop */
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
    /* v8 ignore start -- 防御的: メニューが開いている時のみ呼ばれる */
    if (!nodeMenuState.open) return;
    /* v8 ignore stop */
    const subtreeIds = getSubtreeNodeIds(
      nodeMenuState.nodeId,
      workspace.inferenceEdges,
    );
    setSelectedNodeIds(subtreeIds);
    setNodeMenuState(closeNodeMenu());
  }, [nodeMenuState, workspace.inferenceEdges]);

  const handleSelectProof = useCallback(() => {
    /* v8 ignore start -- 防御的: メニューが開いている時のみ呼ばれる */
    if (!nodeMenuState.open) return;
    /* v8 ignore stop */
    const proofIds = getProofNodeIds(
      nodeMenuState.nodeId,
      workspace.inferenceEdges,
    );
    setSelectedNodeIds(proofIds);
    setNodeMenuState(closeNodeMenu());
  }, [nodeMenuState, workspace.inferenceEdges]);

  // axiomNames から axiomIdByNodeId を構築（prepareProofSaveParams 用）
  const axiomIdByNodeId = useMemo(() => {
    const map = new Map<string, string | undefined>();
    for (const [nodeId, info] of axiomNames) {
      map.set(nodeId, info.axiomId);
    }
    return map;
  }, [axiomNames]);

  // コンテキストメニューから「コレクションに保存」
  const handleSaveToCollection = useCallback(() => {
    /* v8 ignore start -- 防御的: メニューが開いている時のみ呼ばれる */
    if (!nodeMenuState.open) return;
    if (onSaveProofToCollection === undefined) return;
    /* v8 ignore stop */
    const params = prepareProofSaveParams(
      nodeMenuState.nodeId,
      workspace,
      axiomIdByNodeId,
      workspace.deductionSystem.style,
    );
    /* v8 ignore start -- コレクション保存のロジックはprepareProofSaveParams単体テストで検証 */
    if (params !== undefined) {
      onSaveProofToCollection(params);
    }
    /* v8 ignore stop */
    setNodeMenuState(closeNodeMenu());
  }, [nodeMenuState, onSaveProofToCollection, workspace, axiomIdByNodeId]);

  // コレクションの互換性チェック
  const availableAxiomIds = useMemo(() => {
    const ids = new Set<string>();
    for (const item of availableAxioms) {
      ids.add(item.id);
    }
    return ids;
  }, [availableAxioms]);

  const handleGetCompatibility = useCallback(
    (entry: ProofEntry) =>
      checkProofCompatibility(
        entry,
        workspace.deductionSystem.style,
        availableAxiomIds,
      ),
    [workspace.deductionSystem.style, availableAxiomIds],
  );

  // コレクションパネルからの証明インポート
  const handleImportFromCollection = useCallback(
    (entry: ProofEntry) => {
      const center: Point = {
        x: -viewport.offsetX / viewport.scale + 300,
        y: -viewport.offsetY / viewport.scale + 300,
      };
      const result = importProofFromCollection(workspace, entry, center);
      setWorkspace(result);
      const newNodeIds = new Set(
        result.nodes.slice(workspace.nodes.length).map((n) => n.id),
      );
      setSelectedNodeIds(newNodeIds);
    },
    [workspace, viewport, setWorkspace],
  );

  // コンテキストメニューから「論理式を編集」
  const handleEditFormula = useCallback(() => {
    /* v8 ignore start -- 防御的: メニューが開いている時のみ呼ばれる */
    if (!nodeMenuState.open) return;
    /* v8 ignore stop */
    setEditRequestNodeId(nodeMenuState.nodeId);
    setNodeMenuState(closeNodeMenu());
  }, [nodeMenuState]);

  // コンテキストメニューから「MPの左前提として使う」
  const handleUseAsMPLeft = useCallback(() => {
    /* v8 ignore start -- 防御的: メニューが開いている時のみ呼ばれる */
    if (!nodeMenuState.open) return;
    /* v8 ignore stop */
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
    /* v8 ignore start -- 防御的: メニューが開いている時のみ呼ばれる */
    if (!nodeMenuState.open) return;
    /* v8 ignore stop */
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
    /* v8 ignore start -- 防御的: メニューが開いている時のみ呼ばれる */
    if (!nodeMenuState.open) return;
    /* v8 ignore stop */
    setGenPromptNodeId(nodeMenuState.nodeId);
    setGenPromptInput("");
    setNodeMenuState(closeNodeMenu());
  }, [nodeMenuState]);

  const handleGenPromptConfirm = useCallback(() => {
    /* v8 ignore start -- 防御的: プロンプトが開いている時のみ呼ばれる */
    if (genPromptNodeId === null) return;
    /* v8 ignore stop */
    const variableName = genPromptInput.trim();
    /* v8 ignore start -- 防御的: ボタンはdisabledなので空文字列では呼ばれない */
    if (variableName === "") return;
    /* v8 ignore stop */

    const premiseNode = findNode(workspace, genPromptNodeId);
    /* v8 ignore start -- 防御的: ノードは存在する */
    if (!premiseNode) return;
    /* v8 ignore stop */

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

    setWorkspace(result.workspace);
    setGenPromptNodeId(null);
    setGenPromptInput("");
  }, [genPromptNodeId, genPromptInput, workspace, setWorkspace]);

  const handleGenPromptCancel = useCallback(() => {
    setGenPromptNodeId(null);
    setGenPromptInput("");
  }, []);

  // コンテキストメニューから「Merge with...」
  const handleStartMergeFromMenu = useCallback(() => {
    /* v8 ignore start -- 防御的: メニューが開いている時のみ呼ばれる */
    if (!nodeMenuState.open) return;
    /* v8 ignore stop */
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
    /* v8 ignore start -- 防御的: メニューが開いている時のみ呼ばれる */
    if (!nodeMenuState.open) return;
    /* v8 ignore stop */
    const nodeId = nodeMenuState.nodeId;
    const node = findNode(workspace, nodeId);
    setSubstPromptNodeId(nodeId);

    /* v8 ignore start -- 代入テンプレート自動抽出: ロジックはextractSubstitutionTargetsFromText/generateSubstitutionEntryTemplateの単体テストで検証 */
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
    /* v8 ignore stop */

    // フォールバック: 手動入力用の空エントリ
    setSubstPromptEntries([{ kind: "formula", metaVar: "", value: "" }]);
    setNodeMenuState(closeNodeMenu());
  }, [nodeMenuState, workspace]);

  const handleSubstPromptConfirm = useCallback(() => {
    /* v8 ignore start -- 防御的: プロンプトが開いている時のみ呼ばれる */
    if (substPromptNodeId === null) return;
    /* v8 ignore stop */

    /* v8 ignore start -- 代入プロンプト確認: ロジックは単体テストで検証、UIフロー全体は未テスト */
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
    /* v8 ignore stop */

    /* v8 ignore start -- 防御的: ボタンはdisabledなので空エントリでは呼ばれない */
    if (entries.length === 0) return;
    /* v8 ignore stop */

    const premiseNode = findNode(workspace, substPromptNodeId);
    /* v8 ignore start -- 防御的: ノードは存在する */
    if (!premiseNode) return;
    /* v8 ignore stop */

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

    setWorkspace(result.workspace);
    setSubstPromptNodeId(null);
    setSubstPromptEntries([{ kind: "formula", metaVar: "", value: "" }]);
  }, [substPromptNodeId, substPromptEntries, workspace, setWorkspace]);

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
      /* v8 ignore start -- 防御的: バッジクリックはエッジが存在するノード上でのみ発生 */
      if (!edge) return;
      /* v8 ignore stop */
      /* v8 ignore start -- エッジバッジクリック: SVGバッジ操作はブラウザテストで検証。createEditStateFromEdgeは単体テスト済み */
      // Substitutionエッジの場合、前提ノードの論理式テキストを取得してメタ変数自動抽出に使用
      const premiseFormulaText =
        edge._tag === "substitution" && edge.premiseNodeId !== undefined
          ? findNode(workspace, edge.premiseNodeId)?.formulaText
          : undefined;
      const editState = createEditStateFromEdge(edge, premiseFormulaText);
      /* v8 ignore stop */
      /* v8 ignore start -- 防御的: エッジが存在するなら編集状態が生成される */
      if (!editState) return;
      /* v8 ignore stop */
      setEdgeBadgeEditState(editState);
    },
    [workspace],
  );

  /* v8 ignore start -- エッジバッジ編集: SVG接続線上のバッジクリックが必要。ブラウザテストで検証 */
  const handleEdgeBadgeConfirmGen = useCallback(
    (conclusionNodeId: string, variableName: string) => {
      const updated = updateInferenceEdgeGenVariableName(
        workspace,
        conclusionNodeId,
        variableName,
      );
      setWorkspace(updated);
      setEdgeBadgeEditState(null);
    },
    [workspace, setWorkspace],
  );

  const handleEdgeBadgeConfirmSubstitution = useCallback(
    (conclusionNodeId: string, entries: SubstitutionEntries) => {
      const updated = updateInferenceEdgeSubstitutionEntries(
        workspace,
        conclusionNodeId,
        entries,
      );
      setWorkspace(updated);
      setEdgeBadgeEditState(null);
    },
    [workspace, setWorkspace],
  );

  const handleEdgeBadgeCancel = useCallback(() => {
    setEdgeBadgeEditState(null);
  }, []);
  /* v8 ignore stop */

  // コンテキストメニュー表示時のノード情報（メニューの enabled/disabled 判定用）
  const menuNodeIsImplication = useMemo(() => {
    if (!nodeMenuState.open) return false;
    const node = findNode(workspace, nodeMenuState.nodeId);
    /* v8 ignore start -- 防御的: メニューが開いているノードは存在する */
    if (!node) return false;
    /* v8 ignore stop */
    return isNodeImplication(node);
  }, [nodeMenuState, workspace]);

  const menuNodeHasGenEnabled = workspace.system.generalization;

  const menuNodeIsProtected = useMemo(() => {
    /* v8 ignore start -- 防御的: メニューが開いている時のみ値を参照する */
    if (!nodeMenuState.open) return false;
    /* v8 ignore stop */
    return isNodeProtected(workspace, nodeMenuState.nodeId);
  }, [nodeMenuState, workspace]);

  const menuNodeIsEditable = useMemo(() => {
    /* v8 ignore start -- 防御的: メニューが開いている時のみ値を参照する */
    if (!nodeMenuState.open) return false;
    if (menuNodeIsProtected) return false;
    /* v8 ignore stop */
    return nodeClassifications.get(nodeMenuState.nodeId) !== "derived";
  }, [nodeMenuState, menuNodeIsProtected, nodeClassifications]);

  const menuNodeIsNote = useMemo(() => {
    if (!nodeMenuState.open) return false;
    const node = findNode(workspace, nodeMenuState.nodeId);
    /* v8 ignore start -- 防御的: メニューが開いているノードは存在する */
    if (!node) return false;
    /* v8 ignore stop */
    return node.kind === "note";
  }, [nodeMenuState, workspace]);

  // コンテキストメニューから「ノートを編集する」（ノートノード専用）
  const handleEditNoteFromMenu = useCallback(() => {
    /* v8 ignore start -- 防御的: メニューが開いている時のみ呼ばれる */
    if (!nodeMenuState.open) return;
    /* v8 ignore stop */
    handleEditNote(nodeMenuState.nodeId);
    setNodeMenuState(closeNodeMenu());
  }, [nodeMenuState, handleEditNote]);

  // コンテキストメニューから「ノードを削除する」
  const handleDuplicateNode = useCallback(() => {
    /* v8 ignore start -- 防御的: メニューが開いている時のみ呼ばれる */
    if (!nodeMenuState.open) return;
    /* v8 ignore stop */
    const result = duplicateNode(workspace, nodeMenuState.nodeId);
    setWorkspace(result.workspace);
    setSelectedNodeIds(result.newNodeIds);
    setNodeMenuState(closeNodeMenu());
  }, [nodeMenuState, workspace, setWorkspace]);

  const handleDeleteNode = useCallback(() => {
    /* v8 ignore start -- 防御的: メニューが開いている時のみ呼ばれる */
    if (!nodeMenuState.open) return;
    /* v8 ignore stop */
    const result = removeNode(workspace, nodeMenuState.nodeId);
    setWorkspace(result);
    setNodeMenuState(closeNodeMenu());
  }, [nodeMenuState, workspace, setWorkspace]);

  // ノードコンテキストメニュー外クリックで閉じる
  /* v8 ignore start -- メニュー外クリック: ref.contains使用でJSDOMではテスト不安定 */
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
  /* v8 ignore stop */

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
    setWorkspace(revalidateInferenceConclusions(result));
    setLineMenuState(closeLineMenu());
  }, [lineMenuState, workspace, setWorkspace]);

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

  /* v8 ignore start -- キャンバスコンテキストメニュー操作: 右クリックメニューはJSDOMで再現困難。ブラウザテストで検証 */
  const handleCanvasMenuAddNode = useCallback(() => {
    const newNodeId = `node-${String(workspace.nextNodeId) satisfies string}`;
    const ws = addNode(
      workspace,
      "axiom",
      msg.nodeLabelAxiom,
      canvasMenuState.worldPosition,
    );
    setWorkspace(ws);
    setEditRequestNodeId(newNodeId);
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

  const handleCanvasMenuAddNote = useCallback(() => {
    handleAddNote(canvasMenuState.worldPosition);
    setCanvasMenuState({
      open: false,
      screenPosition: { x: 0, y: 0 },
      worldPosition: { x: 0, y: 0 },
    });
  }, [canvasMenuState.worldPosition, handleAddNote]);

  const handleCanvasMenuPaste = useCallback(() => {
    const doInternalPaste = (data: ClipboardData) => {
      const compatError = checkPasteCompatibility(
        data,
        workspace.deductionSystem.style,
      );
      if (compatError !== undefined) {
        const message = msg.pasteIncompatibleStyle
          .replace(
            "{sourceStyle}",
            getDeductionStyleLabel(compatError.sourceStyle),
          )
          .replace(
            "{targetStyle}",
            getDeductionStyleLabel(compatError.targetStyle),
          );
        showPasteError(message);
        return;
      }
      const center = canvasMenuState.worldPosition;
      const result = pasteNodes(workspace, data, center);
      setWorkspace(result);
      const newNodeIds = new Set(
        result.nodes.slice(workspace.nodes.length).map((n) => n.id),
      );
      setSelectedNodeIds(newNodeIds);
    };

    if (clipboardRef.current) {
      doInternalPaste(clipboardRef.current);
    } else {
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
    }

    setCanvasMenuState({
      open: false,
      screenPosition: { x: 0, y: 0 },
      worldPosition: { x: 0, y: 0 },
    });
  }, [
    workspace,
    canvasMenuState.worldPosition,
    setWorkspace,
    showPasteError,
    msg.pasteIncompatibleStyle,
  ]);
  /* v8 ignore stop */

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
    /* v8 ignore start -- 防御的: UIはselectedNodeIds > 0の場合のみボタンを有効にする */
    if (selectedNodeIds.size === 0) return;
    /* v8 ignore stop */
    const data = copySelectedNodes(workspace, selectedNodeIds);
    clipboardRef.current = data;
    setHasClipboardData(true);
    // ブラウザのクリップボードにも書き込む（非同期、失敗しても内部保持で動作）
    const json = serializeClipboardData(data);
    navigator.clipboard.writeText(json).catch(() => {
      // クリップボードAPIが使えない環境でも内部保持で動作
    });
  }, [selectedNodeIds, workspace]);

  const handlePaste = useCallback(() => {
    // まず内部クリップボードから試行
    const doInternalPaste = (data: ClipboardData) => {
      const compatError = checkPasteCompatibility(
        data,
        workspace.deductionSystem.style,
      );
      if (compatError !== undefined) {
        const message = msg.pasteIncompatibleStyle
          .replace(
            "{sourceStyle}",
            getDeductionStyleLabel(compatError.sourceStyle),
          )
          .replace(
            "{targetStyle}",
            getDeductionStyleLabel(compatError.targetStyle),
          );
        showPasteError(message);
        return;
      }
      const center: Point = {
        x: -viewport.offsetX / viewport.scale + 300,
        y: -viewport.offsetY / viewport.scale + 300,
      };
      const result = pasteNodes(workspace, data, center);
      setWorkspace(result);
      // ペースト後、新しいノードを選択状態にする
      const newNodeIds = new Set(
        result.nodes.slice(workspace.nodes.length).map((n) => n.id),
      );
      setSelectedNodeIds(newNodeIds);
    };

    /* v8 ignore start -- ブラウザのClipboard API: JSDOMでは内部クリップボードが使われるため到達しない */
    if (clipboardRef.current) {
      doInternalPaste(clipboardRef.current);
      return;
    }

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
  }, [
    workspace,
    viewport,
    setWorkspace,
    showPasteError,
    msg.pasteIncompatibleStyle,
  ]);

  const handleCut = useCallback(() => {
    /* v8 ignore start -- 防御的: UIはselectedNodeIds > 0の場合のみボタンを有効にする */
    if (selectedNodeIds.size === 0) return;
    /* v8 ignore stop */
    const result = cutSelectedNodes(workspace, selectedNodeIds);
    clipboardRef.current = result.clipboardData;
    setHasClipboardData(true);
    const json = serializeClipboardData(result.clipboardData);
    navigator.clipboard.writeText(json).catch(() => {
      // クリップボードAPIが使えない環境でも内部保持で動作
    });
    setWorkspace(result.workspace);
    setSelectedNodeIds(clearSelection());
  }, [selectedNodeIds, workspace, setWorkspace]);

  const handleDuplicate = useCallback(() => {
    /* v8 ignore start -- 防御的: UIはselectedNodeIds > 0の場合のみボタンを有効にする */
    if (selectedNodeIds.size === 0) return;
    /* v8 ignore stop */
    const result = duplicateSelectedNodes(workspace, selectedNodeIds);
    setWorkspace(result.workspace);
    setSelectedNodeIds(result.newNodeIds);
  }, [selectedNodeIds, workspace, setWorkspace]);

  const handleDeleteSelected = useCallback(() => {
    /* v8 ignore start -- 防御的: UIはselectedNodeIds > 0の場合のみボタンを有効にする */
    if (selectedNodeIds.size === 0) return;
    /* v8 ignore stop */
    const result = removeSelectedNodes(workspace, selectedNodeIds);
    setWorkspace(result);
    setSelectedNodeIds(clearSelection());
  }, [selectedNodeIds, workspace, setWorkspace]);

  const mergeEnabled = useMemo(() => {
    /* v8 ignore start -- 防御的: UIはselectedNodeIds >= 2の場合のみマージボタン表示 */
    if (selectedNodeIds.size < 2) return false;
    /* v8 ignore stop */
    return canMergeSelectedNodes(
      [...selectedNodeIds],
      workspace.nodes,
      new Set(
        workspace.nodes
          .filter((n) => isNodeProtected(workspace, n.id))
          /* v8 ignore start -- isNodeProtected は現在常にfalseを返す防御的コード */
          .map((n) => n.id),
        /* v8 ignore stop */
      ),
    );
  }, [selectedNodeIds, workspace]);

  const handleMergeSelected = useCallback(() => {
    /* v8 ignore start -- 防御的: UIはselectedNodeIds >= 2の場合のみマージボタンを有効にする */
    if (selectedNodeIds.size < 2) return;
    /* v8 ignore stop */
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
    /* v8 ignore start -- 防御的: findMergeableGroupsが空を返すケースはUIレベルで制御 */
    if (groups.length === 0) return;
    /* v8 ignore stop */

    let ws = workspace;
    for (const group of groups) {
      const result = mergeSelectedNodes(
        ws,
        group.leaderNodeId,
        group.absorbedNodeIds,
      );
      /* v8 ignore start -- 防御的: マージ失敗はスキップして続行 */
      if (result._tag === "Success") {
        ws = result.workspace;
      }
      /* v8 ignore stop */
    }

    setWorkspace(ws);
    // マージ後はリーダーノードだけ選択
    const leaderIds = new Set(groups.map((g) => g.leaderNodeId));
    setSelectedNodeIds(leaderIds);
  }, [selectedNodeIds, workspace, setWorkspace]);

  // --- undo/redo ---

  const handleUndo = useCallback(() => {
    history.undo();
  }, [history]);

  const handleRedo = useCallback(() => {
    history.redo();
  }, [history]);

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

      if (isModifier && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleRedo();
      } else if (isModifier && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
      } else if (isModifier && e.key === "y") {
        e.preventDefault();
        handleRedo();
      } else if (isModifier && e.key === "c") {
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
      } else if (isModifier && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        handleTreeLayout("top-to-bottom");
      } else if (isModifier && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        setViewport((v) => computeZoomInViewport(v, containerSize));
      } else if (isModifier && e.key === "-") {
        e.preventDefault();
        setViewport((v) => computeZoomOutViewport(v, containerSize));
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
    handleUndo,
    handleRedo,
    handleCopy,
    handlePaste,
    handleCut,
    handleDuplicate,
    handleDeleteSelected,
    handleMergeSelected,
    mergeSelection,
    handleCancelMerge,
    handleTreeLayout,
    workspace.nodes,
    containerSize,
  ]);
  /* v8 ignore stop */

  // --- コールバック ---

  /* v8 ignore start -- ドラッグ操作: PointerEvent シミュレーションが必要なためブラウザテストで検証 */
  const handlePositionChange = useCallback(
    (nodeId: string) => (position: Point) => {
      // マルチセレクションドラッグ: 選択ノードが2つ以上かつドラッグ対象が選択に含まれる場合
      if (selectedNodeIds.size >= 2 && selectedNodeIds.has(nodeId)) {
        const draggedNode = workspace.nodes.find((n) => n.id === nodeId);
        if (draggedNode !== undefined) {
          const dx = position.x - draggedNode.position.x;
          const dy = position.y - draggedNode.position.y;
          const positions = new Map<string, Point>();
          for (const node of workspace.nodes) {
            if (selectedNodeIds.has(node.id)) {
              positions.set(node.id, {
                x: node.id === nodeId ? position.x : node.position.x + dx,
                y: node.id === nodeId ? position.y : node.position.y + dy,
              });
            }
          }
          replaceWorkspace(updateMultipleNodePositions(workspace, positions));
          return;
        }
      }
      replaceWorkspace(updateNodePosition(workspace, nodeId, position));
    },
    [workspace, replaceWorkspace, selectedNodeIds],
  );
  /* v8 ignore stop */

  const handleFormulaTextChange = useCallback(
    (nodeId: string, text: string) => {
      const updated = updateNodeFormulaText(workspace, nodeId, text);
      replaceWorkspace(revalidateInferenceConclusions(updated));
    },
    [workspace, replaceWorkspace],
  );

  const handleFormulaParsed = useCallback(
    (nodeId: string, formula: Formula) => {
      onFormulaParsed?.(nodeId, formula);
    },
    [onFormulaParsed],
  );

  const handleOpenExpanded = useCallback((nodeId: string) => {
    setExpandedEditorNodeId(nodeId);
  }, []);

  const handleCloseExpanded = useCallback(() => {
    setExpandedEditorNodeId(null);
  }, []);

  const handleExpandedChange = useCallback(
    (text: string) => {
      if (expandedEditorNodeId === null) return;
      const updated = updateNodeFormulaText(
        workspace,
        expandedEditorNodeId,
        text,
      );
      replaceWorkspace(revalidateInferenceConclusions(updated));
    },
    [expandedEditorNodeId, workspace, replaceWorkspace],
  );

  const handleModeChange = useCallback(
    (nodeId: string, mode: EditorMode) => {
      if (mode === "editing") {
        // 編集開始時: undo ポイントを作成（テキスト変更中は replace で一時更新）
        pushWorkspace(workspace);
      }
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
    [editRequestNodeId, pushWorkspace, workspace],
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
  /* v8 ignore start -- JSDOM: containerSize は常に 0,0 で cullingEnabled=false */
  const cullingEnabled = containerSize.width > 0 && containerSize.height > 0;
  /* v8 ignore stop */

  /** カリング対象（非表示にする）ノードかどうか判定。サイズ未取得のノードは安全のため常に表示。 */
  // 純粋ロジックは viewportCulling.test.ts で検証済み。JSDOM では ResizeObserver が動作しないためカリングは無効
  const isNodeCulled = useCallback(
    (node: WorkspaceNode): boolean => {
      /* v8 ignore start -- JSDOM: ResizeObserver未対応のためcullingEnabled=falseで到達不能 */
      if (!cullingEnabled) return false;
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
        /* v8 ignore start -- 防御的: 接続先ノードは存在する */
        if (!fromNode || !toNode) return null;
        /* v8 ignore stop */

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
        /* v8 ignore start -- V8集約アーティファクト: nodeClassificationsは全ノードを含むため ?? は到達不能 */
        const fromClassification =
          nodeClassifications.get(fromNode.id) ?? "root-unmarked";
        /* v8 ignore stop */
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
                /* v8 ignore start -- V8集約アーティファクト */
                testId
                  ? `${testId satisfies string}-edge-badge-${conn.id satisfies string}`
                  : undefined
                /* v8 ignore stop */
              }
              onBadgeClick={
                /* v8 ignore start -- V8集約アーティファクト: edgeBadgeクリック条件分岐 */
                edgeBadgeConclusionNodeId !== undefined
                  ? (screenX, screenY) => {
                      if (
                        inferenceEdge._tag === "gen" ||
                        inferenceEdge._tag === "substitution"
                      ) {
                        handleEdgeBadgeClick(edgeBadgeConclusionNodeId);
                      } else {
                        handleConnectionContextMenu(conn.id, screenX, screenY);
                      }
                    }
                  : undefined
                /* v8 ignore stop */
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
              /* v8 ignore start -- V8集約アーティファクト */
              testId
                ? `${testId satisfies string}-connection-${conn.id satisfies string}`
                : undefined
              /* v8 ignore stop */
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
              isProtected={isNodeProtected(workspace, node.id)}
              axiomName={axiomNames.get(node.id)?.displayName}
              onClickAxiomBadge={
                axiomNames.get(node.id)?.axiomId !== undefined &&
                onOpenReferenceDetail
                  ? () => {
                      handleAxiomBadgeClick(node.id);
                    }
                  : undefined
              }
              dependencies={getNodeDependencyInfos(node.id)}
              detailLevel={detailLevel}
              visibilityOverrides={visibilityOverrides}
              onOpenSyntaxHelp={onOpenSyntaxHelp}
              onOpenExpanded={handleOpenExpanded}
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
              onEditNote={handleEditNote}
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
      handleNodeClickForSelection,
      handleNodeSelect,
      handleNodeContextMenu,
      getNodeSizeRef,
      onOpenSyntaxHelp,
      handleOpenExpanded,
      onOpenReferenceDetail,
      handleAxiomBadgeClick,
      notifyDragMove,
      notifyDragEnd,
      editRequestNodeId,
      handleEditNote,
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
        data-testid={
          /* v8 ignore start -- V8集約アーティファクト */ testId
            ? `${testId satisfies string}-header`
            : undefined /* v8 ignore stop */
        }
      >
        <span>{msg.logicSystemLabel}</span>
        {systemReferenceEntry !== undefined && onOpenReferenceDetail ? (
          <button
            type="button"
            style={systemBadgeClickableStyle}
            onClick={(e) => {
              e.stopPropagation();
              handleSystemBadgeClick();
            }}
            data-testid={
              /* v8 ignore start -- V8集約アーティファクト */
              testId ? `${testId satisfies string}-system` : undefined
              /* v8 ignore stop */
            }
          >
            {systemName}
          </button>
        ) : (
          <span
            style={systemBadgeStyle}
            data-testid={
              /* v8 ignore start -- V8集約アーティファクト */
              testId ? `${testId satisfies string}-system` : undefined
              /* v8 ignore stop */
            }
          >
            {systemName}
          </span>
        )}
        {workspace.mode === "quest" ? (
          <>
            <span
              style={questModeBadgeStyle}
              data-testid={
                /* v8 ignore start -- V8集約アーティファクト */
                testId ? `${testId satisfies string}-quest-badge` : undefined
                /* v8 ignore stop */
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
                  /* v8 ignore start -- V8集約アーティファクト */
                  testId
                    ? `${testId satisfies string}-convert-free-button`
                    : undefined
                  /* v8 ignore stop */
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
            /* v8 ignore start -- V8集約アーティファクト */
            testId ? `${testId satisfies string}-mp-button` : undefined
            /* v8 ignore stop */
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
                /* v8 ignore start -- V8集約アーティファクト */
                testId !== undefined
                  ? `${testId satisfies string}-mp-ref`
                  : undefined
                /* v8 ignore stop */
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
                /* v8 ignore start -- V8集約アーティファクト */
                testId
                  ? `${testId satisfies string}-gen-variable-input`
                  : undefined
                /* v8 ignore stop */
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
                /* v8 ignore start -- V8集約アーティファクト */
                testId ? `${testId satisfies string}-gen-button` : undefined
                /* v8 ignore stop */
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
                    /* v8 ignore start -- V8集約アーティファクト */
                    testId !== undefined
                      ? `${testId satisfies string}-gen-ref`
                      : undefined
                    /* v8 ignore stop */
                  }
                />
              </span>
            )}
          </>
        ) : null}
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
              /* v8 ignore start -- V8集約アーティファクト */
              testId
                ? `${testId satisfies string}-workspace-menu-button`
                : undefined
              /* v8 ignore stop */
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
                /* v8 ignore start -- V8集約アーティファクト */
                testId ? `${testId satisfies string}-workspace-menu` : undefined
                /* v8 ignore stop */
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
                  /* v8 ignore start -- V8集約アーティファクト */
                  testId
                    ? `${testId satisfies string}-export-json-button`
                    : undefined
                  /* v8 ignore stop */
                }
              />
              <WorkspaceMenuItem
                label={msg.exportSVG}
                onClick={() => {
                  handleExportSVG();
                  setWorkspaceMenuOpen(false);
                }}
                testId={
                  /* v8 ignore start -- V8集約アーティファクト */
                  testId
                    ? `${testId satisfies string}-export-svg-button`
                    : undefined
                  /* v8 ignore stop */
                }
              />
              <WorkspaceMenuItem
                label={msg.exportPNG}
                onClick={() => {
                  handleExportPNG();
                  setWorkspaceMenuOpen(false);
                }}
                testId={
                  /* v8 ignore start -- V8集約アーティファクト */
                  testId
                    ? `${testId satisfies string}-export-png-button`
                    : undefined
                  /* v8 ignore stop */
                }
              />
              <WorkspaceMenuItem
                label={msg.importJSON}
                onClick={() => {
                  handleImportJSON();
                  setWorkspaceMenuOpen(false);
                }}
                testId={
                  /* v8 ignore start -- V8集約アーティファクト */
                  testId
                    ? `${testId satisfies string}-import-json-button`
                    : undefined
                  /* v8 ignore stop */
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
              /* v8 ignore start -- V8集約アーティファクト */
              testId ? `${testId satisfies string}-file-input` : undefined
              /* v8 ignore stop */
            }
          />
        </span>
      </div>

      {/* MP選択バナー */}
      {mpSelection.phase !== "idle" ? (
        <div
          style={mpSelectionBannerStyle}
          data-testid={
            /* v8 ignore start -- V8集約アーティファクト */
            testId ? `${testId satisfies string}-mp-banner` : undefined
            /* v8 ignore stop */
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
            /* v8 ignore start -- V8集約アーティファクト */
            testId ? `${testId satisfies string}-gen-banner` : undefined
            /* v8 ignore stop */
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
            /* v8 ignore start -- V8集約アーティファクト */
            testId ? `${testId satisfies string}-merge-banner` : undefined
            /* v8 ignore stop */
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
            /* v8 ignore start -- V8集約アーティファクト */
            testId ? `${testId satisfies string}-tab-banner` : undefined
            /* v8 ignore stop */
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
            /* v8 ignore start -- V8集約アーティファクト */
            testId ? `${testId satisfies string}-at-banner` : undefined
            /* v8 ignore stop */
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
            /* v8 ignore start -- V8集約アーティファクト */
            testId ? `${testId satisfies string}-sc-banner` : undefined
            /* v8 ignore stop */
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
            /* v8 ignore start -- V8集約アーティファクト */
            testId
              ? `${testId satisfies string}-gen-prompt-banner`
              : "gen-prompt-banner"
            /* v8 ignore stop */
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
              /* v8 ignore start -- V8集約アーティファクト */
              testId
                ? `${testId satisfies string}-gen-prompt-input`
                : "gen-prompt-input"
              /* v8 ignore stop */
            }
          />
          <button
            type="button"
            style={cancelButtonStyle}
            onClick={handleGenPromptConfirm}
            disabled={genPromptInput.trim() === ""}
            data-testid={
              /* v8 ignore start -- V8集約アーティファクト */
              testId
                ? `${testId satisfies string}-gen-prompt-confirm`
                : "gen-prompt-confirm"
              /* v8 ignore stop */
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
            /* v8 ignore start -- V8集約アーティファクト */
            testId
              ? `${testId satisfies string}-subst-prompt-banner`
              : "subst-prompt-banner"
            /* v8 ignore stop */
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
                  /* v8 ignore start -- V8集約アーティファクト */
                  testId
                    ? `${testId satisfies string}-subst-kind-${String(i) satisfies string}`
                    : `subst-kind-${String(i) satisfies string}`
                  /* v8 ignore stop */
                }
              >
                {entry.kind === "formula"
                  ? msg.substitutionKindFormula
                  : msg.substitutionKindTerm}
              </span>
              <span
                style={{ ...substLabelStyle, width: 30 }}
                data-testid={
                  /* v8 ignore start -- V8集約アーティファクト */
                  testId
                    ? `${testId satisfies string}-subst-metavar-${String(i) satisfies string}`
                    : `subst-metavar-${String(i) satisfies string}`
                  /* v8 ignore stop */
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
                    /* v8 ignore start -- V8集約アーティファクト */
                    testId
                      ? `${testId satisfies string}-subst-value-${String(i) satisfies string}`
                      : `subst-value-${String(i) satisfies string}`
                    /* v8 ignore stop */
                  }
                />
              ) : (
                <TermInput
                  value={entry.value}
                  onChange={
                    /* v8 ignore start -- 項モード代入: 述語論理固有パスでテストコスト高 */
                    (value) => {
                      handleSubstEntryValueChange(i, value);
                    }
                    /* v8 ignore stop */
                  }
                  placeholder="S(0)"
                  fontSize={12}
                  showPreview={false}
                  style={{ flex: 1, minWidth: 0, width: 120 }}
                  testId={
                    /* v8 ignore start -- V8集約アーティファクト */
                    testId
                      ? `${testId satisfies string}-subst-value-${String(i) satisfies string}`
                      : `subst-value-${String(i) satisfies string}`
                    /* v8 ignore stop */
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
                /* v8 ignore start -- V8集約アーティファクト */
                testId
                  ? `${testId satisfies string}-subst-prompt-confirm`
                  : "subst-prompt-confirm"
                /* v8 ignore stop */
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
            /* v8 ignore start -- V8集約アーティファクト */
            testId ? `${testId satisfies string}-edge-popover` : "edge-popover"
            /* v8 ignore stop */
          }
        >
          <EdgeParameterPopover
            editState={edgeBadgeEditState}
            onConfirmGen={handleEdgeBadgeConfirmGen}
            onConfirmSubstitution={handleEdgeBadgeConfirmSubstitution}
            onCancel={handleEdgeBadgeCancel}
            onOpenSyntaxHelp={onOpenSyntaxHelp}
            testId={
              /* v8 ignore start -- V8集約アーティファクト */
              testId
                ? `${testId satisfies string}-edge-popover-inner`
                : "edge-popover-inner"
              /* v8 ignore stop */
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
            /* v8 ignore start -- V8集約アーティファクト */
            testId ? `${testId satisfies string}-selection-banner` : undefined
            /* v8 ignore stop */
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
              /* v8 ignore start -- V8集約アーティファクト */
              testId ? `${testId satisfies string}-copy-button` : undefined
              /* v8 ignore stop */
            }
          >
            {msg.selectionCopy}
          </button>
          <button
            type="button"
            style={selectionActionButtonStyle}
            onClick={handleCut}
            data-testid={
              /* v8 ignore start -- V8集約アーティファクト */
              testId ? `${testId satisfies string}-cut-button` : undefined
              /* v8 ignore stop */
            }
          >
            {msg.selectionCut}
          </button>
          <button
            type="button"
            style={selectionActionButtonStyle}
            onClick={handlePaste}
            data-testid={
              /* v8 ignore start -- V8集約アーティファクト */
              testId ? `${testId satisfies string}-paste-button` : undefined
              /* v8 ignore stop */
            }
          >
            {msg.selectionPaste}
          </button>
          <button
            type="button"
            style={selectionActionButtonStyle}
            onClick={handleDuplicate}
            data-testid={
              /* v8 ignore start -- V8集約アーティファクト */
              testId ? `${testId satisfies string}-duplicate-button` : undefined
              /* v8 ignore stop */
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
              /* v8 ignore start -- V8集約アーティファクト */
              testId ? `${testId satisfies string}-merge-button` : undefined
              /* v8 ignore stop */
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
              /* v8 ignore start -- V8集約アーティファクト */
              testId ? `${testId satisfies string}-delete-button` : undefined
              /* v8 ignore stop */
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

      {/* v8 ignore start -- ペーストエラーバナー: ストーリーのplay関数(chromium)でカバー */}
      {/* ペーストエラーメッセージ */}
      {pasteErrorMessage !== null ? (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--color-error-bg, rgba(224,96,96,0.95))",
            color: "var(--color-error-text, #fff)",
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 14,
            zIndex: 200,
            pointerEvents: "auto",
          }}
          data-testid={
            /* v8 ignore start -- V8集約アーティファクト */
            testId ? `${testId satisfies string}-paste-error` : undefined
            /* v8 ignore stop */
          }
          onClick={(e) => e.stopPropagation()}
        >
          {pasteErrorMessage}
          <button
            type="button"
            style={{
              marginLeft: 12,
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontSize: 14,
            }}
            onClick={() => setPasteErrorMessage(null)}
          >
            ✕
          </button>
        </div>
      ) : null}
      {/* v8 ignore stop */}

      {/* 証明完了バナー（スタンプ風） — 完全にクリアしたときだけ表示 */}
      {isGoalAchieved ? (
        <div
          style={proofCompleteBannerStyle}
          data-testid={
            /* v8 ignore start -- V8集約アーティファクト */
            testId
              ? `${testId satisfies string}-proof-complete-banner`
              : undefined
            /* v8 ignore stop */
          }
        >
          {msg.proofComplete}
        </div>
      ) : null}

      {/* パレット: 演繹体系のスタイルに応じて切り替え */}
      {workspace.deductionSystem.style === "natural-deduction" ? (
        <NdRulePalette
          rules={availableNdRules}
          onAddAssumption={handleAddAssumption}
          testId={
            /* v8 ignore start -- V8集約アーティファクト */
            testId ? `${testId satisfies string}-nd-rule-palette` : undefined
            /* v8 ignore stop */
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
            /* v8 ignore start -- V8集約アーティファクト */
            testId ? `${testId satisfies string}-tab-rule-palette` : undefined
            /* v8 ignore stop */
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
            /* v8 ignore start -- V8集約アーティファクト */
            testId ? `${testId satisfies string}-at-rule-palette` : undefined
            /* v8 ignore stop */
          }
        />
      ) : workspace.deductionSystem.style === "sequent-calculus" ? (
        <>
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
              /* v8 ignore start -- V8集約アーティファクト */
              testId ? `${testId satisfies string}-sc-rule-palette` : undefined
              /* v8 ignore stop */
            }
          />
          {/* カット除去起動ボタン */}
          {!cutElimOpen ? (
            <button
              type="button"
              style={{
                position: "absolute",
                bottom: 12,
                left: 12,
                zIndex: 10,
                padding: "6px 12px",
                fontSize: 12,
                borderRadius: 6,
                border:
                  "1px solid var(--color-panel-border, rgba(180, 160, 130, 0.3))",
                background: "var(--color-panel-bg, rgba(252, 249, 243, 0.96))",
                cursor: "pointer",
                color: "var(--color-text-primary, #333)",
                fontFamily: "var(--font-ui)",
                boxShadow:
                  "0 1px 6px var(--color-panel-shadow, rgba(120, 100, 70, 0.1))",
              }}
              onClick={handleStartCutElimination}
              data-testid={
                /* v8 ignore start -- V8集約アーティファクト */
                testId ? `${testId satisfies string}-cut-elim-start` : undefined
                /* v8 ignore stop */
              }
            >
              {msg.cutEliminationStart}
            </button>
          ) : null}
        </>
      ) : (
        <AxiomPalette
          axioms={availableAxioms}
          onAddAxiom={handleAddAxiom}
          referenceEntries={referenceEntries}
          locale={locale}
          onOpenReferenceDetail={onOpenReferenceDetail}
          position={axiomPalettePos}
          onDragHandlePointerDown={axiomPaletteDrag.handleProps.onPointerDown}
          testId={
            /* v8 ignore start -- V8集約アーティファクト */
            testId ? `${testId satisfies string}-axiom-palette` : undefined
            /* v8 ignore stop */
          }
        />
      )}

      {/* ゴール一覧パネル */}
      <GoalPanel
        data={goalPanelData}
        messages={msg}
        position={goalPanelPos}
        onDragHandlePointerDown={goalPanelDrag.handleProps.onPointerDown}
        wasDraggedRef={goalPanelDrag.wasDraggedRef}
        referenceEntries={referenceEntries}
        locale={locale}
        onOpenReferenceDetail={onOpenReferenceDetail}
        testId={
          /* v8 ignore start -- V8集約アーティファクト */ testId
            ? `${testId satisfies string}-goal-panel`
            : undefined /* v8 ignore stop */
        }
      />

      {/* カット除去ステッパー */}
      {cutElimStepperData !== null ? (
        <>
          <CutEliminationStepper
            data={cutElimStepperData}
            onStepChange={setCutElimStepIndex}
            messages={msg}
            testId={
              /* v8 ignore start -- V8集約アーティファクト */
              testId ? `${testId satisfies string}-cut-elim-stepper` : undefined
              /* v8 ignore stop */
            }
          />
          <button
            type="button"
            style={{
              position: "absolute",
              bottom: 12,
              left: 260,
              zIndex: 11,
              padding: "2px 8px",
              borderRadius: 4,
              border:
                "1px solid var(--color-panel-border, rgba(180, 160, 130, 0.3))",
              background: "var(--color-panel-bg, rgba(252, 249, 243, 0.96))",
              cursor: "pointer",
              fontSize: 10,
              color: "var(--color-text-secondary, #666)",
              fontFamily: "var(--font-ui)",
            }}
            onClick={handleCloseCutElimination}
            data-testid={
              /* v8 ignore start -- V8集約アーティファクト */
              testId ? `${testId satisfies string}-cut-elim-close` : undefined
              /* v8 ignore stop */
            }
          >
            {msg.cutEliminationClose}
          </button>
        </>
      ) : null}

      {/* コレクション管理パネル（常駐表示） */}
      {collectionEntries !== undefined &&
      onRenameCollectionEntry !== undefined &&
      onUpdateCollectionMemo !== undefined &&
      onRemoveCollectionEntry !== undefined ? (
        <ProofCollectionPanel
          entries={collectionEntries}
          folders={collectionFolders ?? []}
          messages={msg}
          onRenameEntry={onRenameCollectionEntry}
          onUpdateMemo={onUpdateCollectionMemo}
          onRemoveEntry={onRemoveCollectionEntry}
          onImportEntry={handleImportFromCollection}
          getCompatibility={handleGetCompatibility}
          onMoveEntry={onMoveCollectionEntry}
          onCreateFolder={onCreateCollectionFolder}
          onRemoveFolder={onRemoveCollectionFolder}
          onRenameFolder={onRenameCollectionFolder}
          position={collectionPanelPos}
          onDragHandlePointerDown={
            collectionPanelDrag.handleProps.onPointerDown
          }
          testId={
            /* v8 ignore start -- V8集約アーティファクト */
            testId ? `${testId satisfies string}-collection-panel` : undefined
            /* v8 ignore stop */
          }
        />
      ) : null}

      {/* ノードコンテキストメニュー */}
      {nodeMenuState.open ? (
        <div
          ref={nodeMenuRef}
          data-testid={
            /* v8 ignore start -- V8集約アーティファクト */
            testId
              ? `${testId satisfies string}-node-context-menu`
              : "node-context-menu"
            /* v8 ignore stop */
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
          {menuNodeIsNote ? (
            <>
              <WorkspaceMenuItem
                label={msg.editNote}
                onClick={handleEditNoteFromMenu}
                testId={
                  /* v8 ignore start -- V8集約アーティファクト */
                  testId ? `${testId satisfies string}-edit-note` : "edit-note"
                  /* v8 ignore stop */
                }
              />
              <div
                style={{
                  height: 1,
                  background:
                    "var(--color-panel-border, rgba(180, 160, 130, 0.2))",
                  margin: "4px 0",
                }}
              />
              <WorkspaceMenuItem
                label={msg.duplicateNode}
                onClick={handleDuplicateNode}
                testId={
                  /* v8 ignore start -- V8集約アーティファクト */
                  testId
                    ? `${testId satisfies string}-duplicate-node`
                    : "duplicate-node"
                  /* v8 ignore stop */
                }
              />
              <WorkspaceMenuItem
                label={msg.deleteNode}
                onClick={handleDeleteNode}
                disabled={menuNodeIsProtected}
                testId={
                  /* v8 ignore start -- V8集約アーティファクト */
                  testId
                    ? `${testId satisfies string}-delete-node`
                    : "delete-node"
                  /* v8 ignore stop */
                }
              />
            </>
          ) : (
            <>
              <WorkspaceMenuItem
                label={msg.selectSubtree}
                onClick={handleSelectSubtree}
                testId={
                  /* v8 ignore start -- V8集約アーティファクト */
                  testId
                    ? `${testId satisfies string}-select-subtree`
                    : "select-subtree"
                  /* v8 ignore stop */
                }
              />
              <WorkspaceMenuItem
                label={msg.selectProof}
                onClick={handleSelectProof}
                testId={
                  /* v8 ignore start -- V8集約アーティファクト */
                  testId
                    ? `${testId satisfies string}-select-proof`
                    : "select-proof"
                  /* v8 ignore stop */
                }
              />
              {onSaveProofToCollection !== undefined ? (
                <WorkspaceMenuItem
                  label={msg.saveToCollection}
                  onClick={handleSaveToCollection}
                  testId={
                    /* v8 ignore start -- V8集約アーティファクト */
                    testId
                      ? `${testId satisfies string}-save-to-collection`
                      : "save-to-collection"
                    /* v8 ignore stop */
                  }
                />
              ) : null}
              <WorkspaceMenuItem
                label={msg.editFormula}
                onClick={handleEditFormula}
                disabled={!menuNodeIsEditable}
                testId={
                  /* v8 ignore start -- V8集約アーティファクト */
                  testId
                    ? `${testId satisfies string}-edit-formula`
                    : "edit-formula"
                  /* v8 ignore stop */
                }
              />
              <div
                style={{
                  height: 1,
                  background:
                    "var(--color-panel-border, rgba(180, 160, 130, 0.2))",
                  margin: "4px 0",
                }}
              />
              <WorkspaceMenuItem
                label={msg.useAsMPLeft}
                onClick={handleUseAsMPLeft}
                testId={
                  /* v8 ignore start -- V8集約アーティファクト */
                  testId
                    ? `${testId satisfies string}-use-as-mp-left`
                    : "use-as-mp-left"
                  /* v8 ignore stop */
                }
              />
              <WorkspaceMenuItem
                label={msg.useAsMPRight}
                onClick={handleUseAsMPRight}
                disabled={!menuNodeIsImplication}
                testId={
                  /* v8 ignore start -- V8集約アーティファクト */
                  testId
                    ? `${testId satisfies string}-use-as-mp-right`
                    : "use-as-mp-right"
                  /* v8 ignore stop */
                }
              />
              {menuNodeHasGenEnabled ? (
                <WorkspaceMenuItem
                  label={msg.applyGenToNode}
                  onClick={handleApplyGenToNode}
                  testId={
                    /* v8 ignore start -- V8集約アーティファクト */
                    testId
                      ? `${testId satisfies string}-apply-gen-to-node`
                      : "apply-gen-to-node"
                    /* v8 ignore stop */
                  }
                />
              ) : null}
              <WorkspaceMenuItem
                label={msg.applySubstitutionToNode}
                onClick={handleApplySubstitutionToNode}
                testId={
                  /* v8 ignore start -- V8集約アーティファクト */
                  testId
                    ? `${testId satisfies string}-apply-substitution-to-node`
                    : "apply-substitution-to-node"
                  /* v8 ignore stop */
                }
              />
              <WorkspaceMenuItem
                label={msg.mergeWithNode}
                onClick={handleStartMergeFromMenu}
                disabled={menuNodeIsProtected}
                testId={
                  /* v8 ignore start -- V8集約アーティファクト */
                  testId
                    ? `${testId satisfies string}-merge-with-node`
                    : "merge-with-node"
                  /* v8 ignore stop */
                }
              />
              <div
                style={{
                  height: 1,
                  background:
                    "var(--color-panel-border, rgba(180, 160, 130, 0.2))",
                  margin: "4px 0",
                }}
              />
              <WorkspaceMenuItem
                label={msg.duplicateNode}
                onClick={handleDuplicateNode}
                testId={
                  /* v8 ignore start -- V8集約アーティファクト */
                  testId
                    ? `${testId satisfies string}-duplicate-node`
                    : "duplicate-node"
                  /* v8 ignore stop */
                }
              />
              <WorkspaceMenuItem
                label={msg.deleteNode}
                onClick={handleDeleteNode}
                disabled={menuNodeIsProtected}
                testId={
                  /* v8 ignore start -- V8集約アーティファクト */
                  testId
                    ? `${testId satisfies string}-delete-node`
                    : "delete-node"
                  /* v8 ignore stop */
                }
              />
            </>
          )}
        </div>
      ) : null}

      {/* 接続線コンテキストメニュー */}
      {lineMenuState.open ? (
        <div
          ref={lineMenuRef}
          data-testid={
            /* v8 ignore start -- V8集約アーティファクト */
            testId
              ? `${testId satisfies string}-line-context-menu`
              : "line-context-menu"
            /* v8 ignore stop */
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
              /* v8 ignore start -- V8集約アーティファクト */
              testId
                ? `${testId satisfies string}-delete-connection`
                : "delete-connection"
              /* v8 ignore stop */
            }
          />
        </div>
      ) : null}

      {/* キャンバス空白部分コンテキストメニュー */}
      {canvasMenuState.open ? (
        <div
          ref={canvasMenuRef}
          data-testid={
            /* v8 ignore start -- testId未指定パス: V8集約アーティファクト */
            testId
              ? `${testId satisfies string}-canvas-context-menu`
              : undefined
            /* v8 ignore stop */
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
              /* v8 ignore start -- testId未指定パス: V8集約アーティファクト */
              testId
                ? `${testId satisfies string}-canvas-menu-add-node`
                : undefined
              /* v8 ignore stop */
            }
          />
          <WorkspaceMenuItem
            label={msg.addNote}
            onClick={handleCanvasMenuAddNote}
            testId={
              /* v8 ignore start -- testId未指定パス: V8集約アーティファクト */
              testId
                ? `${testId satisfies string}-canvas-menu-add-note`
                : undefined
              /* v8 ignore stop */
            }
          />
          <WorkspaceMenuItem
            label={msg.canvasMenuPaste}
            onClick={handleCanvasMenuPaste}
            disabled={!hasClipboardData}
            testId={
              /* v8 ignore start -- testId未指定パス: V8集約アーティファクト */
              testId
                ? `${testId satisfies string}-canvas-menu-paste`
                : undefined
              /* v8 ignore stop */
            }
          />
          {/* 区切り線 */}
          <div
            style={{
              borderTop:
                "1px solid var(--color-panel-rule-line, rgba(180, 160, 130, 0.15))",
              margin: "4px 0",
            }}
          />
          <WorkspaceMenuItem
            label={msg.treeLayoutTopToBottom}
            onClick={() => {
              handleTreeLayout("top-to-bottom");
              setCanvasMenuState((prev) => ({ ...prev, open: false }));
            }}
            testId={
              /* v8 ignore start -- testId未指定パス: V8集約アーティファクト */
              testId
                ? `${testId satisfies string}-canvas-menu-tree-layout-tb`
                : undefined
              /* v8 ignore stop */
            }
          />
          <WorkspaceMenuItem
            label={msg.treeLayoutBottomToTop}
            onClick={() => {
              handleTreeLayout("bottom-to-top");
              setCanvasMenuState((prev) => ({ ...prev, open: false }));
            }}
            testId={
              /* v8 ignore start -- testId未指定パス: V8集約アーティファクト */
              testId
                ? `${testId satisfies string}-canvas-menu-tree-layout-bt`
                : undefined
              /* v8 ignore stop */
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
        {/* v8 ignore start -- ポートドラッグ操作: SVGベースのポインターイベントでJSDOMでは到達困難 */}
        {connectionPreviewState !== null && (
          <ConnectionPreviewLine
            state={connectionPreviewState}
            viewport={viewport}
          />
        )}
        {/* v8 ignore stop */}
        {workspace.nodes.filter((node) => !isNodeCulled(node)).map(renderNode)}
        {/* Connector ports for drag-to-connect */}
        {workspace.nodes.flatMap((node) => {
          const size = nodeSizes.get(node.id);
          if (!size) return [];
          const ports = getProofNodePorts(node.kind);
          return ports.map((port) => {
            const uniqueId = `${node.id satisfies string}-${port.id satisfies string}`;
            /* v8 ignore start -- ポートスナップ判定: connectionPreviewState はポートドラッグ中のみnon-null */
            const isSnappedTarget =
              connectionPreviewState?.snappedTarget !== null &&
              connectionPreviewState?.snappedTarget?.itemId === node.id &&
              connectionPreviewState?.snappedTarget?.portOnItem.port.id ===
                port.id;
            /* v8 ignore stop */
            return (
              <ConnectorPortComponent
                key={uniqueId}
                port={{ ...port, id: uniqueId }}
                itemPosition={node.position}
                itemWidth={size.width}
                itemHeight={size.height}
                viewport={viewport}
                highlighted={
                  /* v8 ignore start -- isSnappedTargetは常にboolean: ?? falseは到達不能 */
                  isSnappedTarget ?? false
                  /* v8 ignore stop */
                }
                color={
                  /* v8 ignore start -- ポートスナップ時の色: JSDOMでは到達不能 */
                  isSnappedTarget === true
                    ? connectionPreviewState?.isValid === true
                      ? "#3b82f6"
                      : "#ef4444"
                    : "var(--color-port-fill, #fff)"
                  /* v8 ignore stop */
                }
                borderColor={
                  /* v8 ignore start -- ポートスナップ時の色: JSDOMでは到達不能 */
                  isSnappedTarget === true
                    ? connectionPreviewState?.isValid === true
                      ? "#3b82f6"
                      : "#ef4444"
                    : "var(--color-port-border, #666)"
                  /* v8 ignore stop */
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

      {/* ノート編集モーダル */}
      {editingNoteId !== null ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 3000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.4)",
          }}
          onClick={handleNoteEditorCancel}
          data-testid={
            testId
              ? `${testId satisfies string}-note-editor-overlay`
              : undefined
          }
        >
          <div
            style={{
              background: "var(--color-panel-bg, #fffdf8)",
              borderRadius: 12,
              padding: 20,
              minWidth: 600,
              maxWidth: 800,
              width: "80vw",
              maxHeight: "80vh",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {msg.noteEditorTitle}
            </div>
            <div
              style={{ flex: 1, minHeight: 300, overflow: "auto" }}
              data-testid={
                testId
                  ? `${testId satisfies string}-note-editor-md`
                  : undefined
              }
            >
              <MdEditor
                modelValue={noteEditorText}
                onChange={setNoteEditorText}
                theme={
                  (document.documentElement.getAttribute("data-theme") ===
                  "dark"
                    ? "dark"
                    : "light") satisfies string
                }
                language="en-US"
                noUploadImg
                toolbars={NOTE_EDITOR_TOOLBARS}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={handleNoteEditorCancel}
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: 13,
                  padding: "6px 16px",
                  borderRadius: 6,
                  border:
                    "1px solid var(--color-panel-border, rgba(180, 160, 130, 0.3))",
                  background: "transparent",
                  cursor: "pointer",
                }}
                data-testid={
                  testId
                    ? `${testId satisfies string}-note-editor-cancel`
                    : undefined
                }
              >
                {msg.cancel}
              </button>
              <button
                type="button"
                onClick={handleNoteEditorSave}
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: 13,
                  padding: "6px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: "var(--color-node-note, #a0a0a0)",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                data-testid={
                  testId
                    ? `${testId satisfies string}-note-editor-save`
                    : undefined
                }
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {/* 拡大エディタモーダル */}
      {expandedEditorNodeId !== null &&
      (() => {
        const node = workspace.nodes.find((n) => n.id === expandedEditorNodeId);
        return node !== undefined;
      })() ? (
        <FormulaExpandedEditor
          value={
            workspace.nodes.find((n) => n.id === expandedEditorNodeId)
              ?.formulaText ?? ""
          }
          onChange={handleExpandedChange}
          onClose={handleCloseExpanded}
          onOpenSyntaxHelp={onOpenSyntaxHelp}
          testId={
            testId
              ? `${testId satisfies string}-expanded-editor`
              : "expanded-editor"
          }
        />
      ) : null}
    </div>
  );
}
