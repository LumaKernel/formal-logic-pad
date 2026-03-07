/**
 * 証明コレクションパネルの純粋ロジック。
 *
 * パネル内のエントリ編集状態（名前編集中、メモ編集中）とフォルダ展開状態を管理する。
 *
 * 変更時は proofCollectionPanelLogic.test.ts, ProofCollectionPanel.tsx, index.ts も同期すること。
 */

import type { ProofEntryId, ProofFolderId } from "./proofCollectionState";
import type { CompatibilityResult } from "./proofCollectionCompatibility";

// --- 編集状態 ---

export type EditingField = "name" | "memo";

export type EditingState = {
  readonly entryId: ProofEntryId;
  readonly field: EditingField;
  readonly value: string;
};

// --- フォルダ名編集状態 ---

export type FolderEditingState = {
  readonly folderId: ProofFolderId;
  readonly value: string;
};

// --- パネル状態 ---

export type PanelState = {
  readonly editing: EditingState | undefined;
  readonly expandedFolderIds: ReadonlySet<ProofFolderId>;
  readonly folderEditing: FolderEditingState | undefined;
  /** 新規フォルダ作成中の入力値（undefined = 作成UIを表示しない） */
  readonly creatingFolder: string | undefined;
};

// --- 状態操作 ---

export function createInitialPanelState(): PanelState {
  return {
    editing: undefined,
    expandedFolderIds: new Set(),
    folderEditing: undefined,
    creatingFolder: undefined,
  };
}

export function startEditing(
  state: PanelState,
  entryId: ProofEntryId,
  field: EditingField,
  currentValue: string,
): PanelState {
  return {
    ...state,
    editing: { entryId, field, value: currentValue },
    folderEditing: undefined,
    creatingFolder: undefined,
  };
}

export function updateEditingValue(
  state: PanelState,
  value: string,
): PanelState {
  if (state.editing === undefined) return state;
  return {
    ...state,
    editing: { ...state.editing, value },
  };
}

export function cancelEditing(state: PanelState): PanelState {
  return { ...state, editing: undefined };
}

export function isEditing(
  state: PanelState,
  entryId: ProofEntryId,
  field: EditingField,
): boolean {
  return (
    state.editing !== undefined &&
    state.editing.entryId === entryId &&
    state.editing.field === field
  );
}

// --- フォルダ展開状態 ---

export function toggleFolderExpanded(
  state: PanelState,
  folderId: ProofFolderId,
): PanelState {
  const next = new Set(state.expandedFolderIds);
  if (next.has(folderId)) {
    next.delete(folderId);
  } else {
    next.add(folderId);
  }
  return { ...state, expandedFolderIds: next };
}

export function isFolderExpanded(
  state: PanelState,
  folderId: ProofFolderId,
): boolean {
  return state.expandedFolderIds.has(folderId);
}

// --- フォルダ名編集 ---

export function startFolderEditing(
  state: PanelState,
  folderId: ProofFolderId,
  currentName: string,
): PanelState {
  return {
    ...state,
    folderEditing: { folderId, value: currentName },
    editing: undefined,
    creatingFolder: undefined,
  };
}

export function updateFolderEditingValue(
  state: PanelState,
  value: string,
): PanelState {
  if (state.folderEditing === undefined) return state;
  return {
    ...state,
    folderEditing: { ...state.folderEditing, value },
  };
}

export function cancelFolderEditing(state: PanelState): PanelState {
  return { ...state, folderEditing: undefined };
}

export function isFolderEditing(
  state: PanelState,
  folderId: ProofFolderId,
): boolean {
  return (
    state.folderEditing !== undefined &&
    state.folderEditing.folderId === folderId
  );
}

// --- フォルダ作成 ---

export function startCreatingFolder(state: PanelState): PanelState {
  return {
    ...state,
    creatingFolder: "",
    editing: undefined,
    folderEditing: undefined,
  };
}

export function updateCreatingFolderValue(
  state: PanelState,
  value: string,
): PanelState {
  if (state.creatingFolder === undefined) return state;
  return { ...state, creatingFolder: value };
}

export function cancelCreatingFolder(state: PanelState): PanelState {
  return { ...state, creatingFolder: undefined };
}

// --- 互換性バッジ表示 ---

/**
 * 互換性チェック結果に基づくバッジ表示情報。
 *
 * - variant: "ok" → 互換性あり（バッジなし）
 * - variant: "axiom-warning" → 公理不足の警告
 * - variant: "style-mismatch" → スタイル不一致の警告
 */
export type CompatibilityBadge =
  | { readonly variant: "ok" }
  | {
      readonly variant: "axiom-warning";
      readonly missingAxiomIds: readonly string[];
    }
  | {
      readonly variant: "style-mismatch";
      readonly sourceStyle: string;
      readonly targetStyle: string;
    };

/**
 * 互換性チェック結果からバッジ表示情報を算出する。
 */
export function getCompatibilityBadge(
  result: CompatibilityResult,
): CompatibilityBadge {
  switch (result._tag) {
    case "FullyCompatible":
      return { variant: "ok" };
    case "CompatibleWithAxiomWarnings":
      return {
        variant: "axiom-warning",
        missingAxiomIds: result.missingAxiomIds,
      };
    case "IncompatibleStyle":
      return {
        variant: "style-mismatch",
        sourceStyle: result.sourceStyle,
        targetStyle: result.targetStyle,
      };
  }
}
