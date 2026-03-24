/**
 * スクリプトファイルエクスプローラーの純粋ロジック。
 *
 * 保存済みスクリプトをVSCode Explorer風に表示・操作するための
 * 状態管理・表示データ計算を担う。
 *
 * 変更時は scriptFileExplorerLogic.test.ts, ScriptFileExplorer.tsx, index.ts も同期すること。
 */

import type { SavedScript } from "./savedScriptsLogic";
import { timestampToLocalDateComponents } from "../../lib/_unsafe/unsafeDate";

// ── 型定義 ─────────────────────────────────────────────────────

/** ファイルエクスプローラーの状態 */
export interface FileExplorerState {
  /** リネーム中のスクリプトID（null = リネーム中ではない） */
  readonly renamingId: string | null;
  /** リネーム中の入力値 */
  readonly renameValue: string;
  /** 削除確認中のスクリプトID（null = 確認中ではない） */
  readonly confirmDeleteId: string | null;
}

/** ファイル一覧アイテムの表示データ */
export interface FileExplorerItem {
  readonly id: string;
  readonly title: string;
  readonly savedAt: number;
  readonly isRenaming: boolean;
  readonly isConfirmingDelete: boolean;
}

// ── 初期状態 ──────────────────────────────────────────────────

export const initialFileExplorerState: FileExplorerState = {
  renamingId: null,
  renameValue: "",
  confirmDeleteId: null,
};

// ── 状態更新（純粋関数） ──────────────────────────────────────

/** リネームモードに入る */
export const startRename = (
  state: FileExplorerState,
  scriptId: string,
  currentTitle: string,
): FileExplorerState => ({
  ...state,
  renamingId: scriptId,
  renameValue: currentTitle,
  confirmDeleteId: null,
});

/** リネーム入力値を更新 */
export const updateRenameValue = (
  state: FileExplorerState,
  value: string,
): FileExplorerState => ({
  ...state,
  renameValue: value,
});

/** リネームをキャンセル */
export const cancelRename = (state: FileExplorerState): FileExplorerState => ({
  ...state,
  renamingId: null,
  renameValue: "",
});

/**
 * リネームを確定する。
 * 新しいタイトルが空または元と同じ場合はキャンセル扱い。
 * 戻り値: { state, newTitle } — newTitle が null ならリネーム不要。
 */
export const confirmRename = (
  state: FileExplorerState,
  currentTitle: string,
): { readonly state: FileExplorerState; readonly newTitle: string | null } => {
  const trimmed = state.renameValue.trim();
  if (trimmed === "" || trimmed === currentTitle) {
    return { state: cancelRename(state), newTitle: null };
  }
  return {
    state: { ...state, renamingId: null, renameValue: "" },
    newTitle: trimmed,
  };
};

/** 削除確認モードに入る */
export const startDeleteConfirm = (
  state: FileExplorerState,
  scriptId: string,
): FileExplorerState => ({
  ...state,
  confirmDeleteId: scriptId,
  renamingId: null,
  renameValue: "",
});

/** 削除確認をキャンセル */
export const cancelDeleteConfirm = (
  state: FileExplorerState,
): FileExplorerState => ({
  ...state,
  confirmDeleteId: null,
});

// ── 表示データ計算（純粋関数） ─────────────────────────────────

/** 保存済みスクリプトをファイルエクスプローラー表示用に変換する */
export const computeFileExplorerItems = (
  scripts: readonly SavedScript[],
  state: FileExplorerState,
): readonly FileExplorerItem[] =>
  [...scripts]
    .sort((a, b) => b.savedAt - a.savedAt)
    .map((s) => ({
      id: s.id,
      title: s.title,
      savedAt: s.savedAt,
      isRenaming: state.renamingId === s.id,
      isConfirmingDelete: state.confirmDeleteId === s.id,
    }));

/** 保存日時をフォーマットする */
export const formatSavedAt = (timestamp: number): string => {
  const { year, month, day, hour, minute } =
    timestampToLocalDateComponents(timestamp);
  const y = String(year);
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  const h = String(hour).padStart(2, "0");
  const min = String(minute).padStart(2, "0");
  return `${y satisfies string}/${m satisfies string}/${d satisfies string} ${h satisfies string}:${min satisfies string}`;
};
