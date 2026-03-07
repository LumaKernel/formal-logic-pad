/**
 * 証明コレクションパネルの純粋ロジック。
 *
 * パネル内のエントリ編集状態（名前編集中、メモ編集中）を管理する。
 *
 * 変更時は proofCollectionPanelLogic.test.ts, ProofCollectionPanel.tsx, index.ts も同期すること。
 */

import type { ProofEntryId } from "./proofCollectionState";

// --- 編集状態 ---

export type EditingField = "name" | "memo";

export type EditingState = {
  readonly entryId: ProofEntryId;
  readonly field: EditingField;
  readonly value: string;
};

export type PanelState = {
  readonly editing: EditingState | undefined;
};

// --- 状態操作 ---

export function createInitialPanelState(): PanelState {
  return { editing: undefined };
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
