/**
 * FormulaEditor の純粋ロジック。
 *
 * モード遷移の判定とテキスト⇔AST変換の状態管理。
 *
 * 変更時は editorLogic.test.ts, FormulaEditor.tsx, FormulaEditor.stories.tsx, index.ts も同期すること。
 */

import type { FormulaParseState } from "./FormulaInput";

// --- モード遷移ロジック ---

/**
 * 編集モードを離れられるかどうかを判定する。
 * パースエラー時は編集モードに留まらなければならない。
 */
export const canExitEditMode = (parseState: FormulaParseState): boolean => {
  switch (parseState.status) {
    case "empty":
      return true;
    case "success":
      return true;
    case "error":
      return false;
  }
};

// --- エディタの表示モード ---

export type DisplayRenderer = "unicode" | "katex";

export type EditorMode = "display" | "editing";

/**
 * 編集モードに入るトリガーの種類。
 * - "click": シングルクリックで即座に編集開始（デフォルト）
 * - "dblclick": ダブルクリックで編集開始
 * - "none": クリックでは編集しない（外部から制御する場合）
 */
export type EditTrigger = "click" | "dblclick" | "none";

/**
 * 編集終了アクション（blur/Escape/Enter）時の結果を計算する。
 * パースエラーの場合はnull（モード遷移しない）を返す。
 */
export const computeExitAction = (
  parseState: FormulaParseState,
): EditorMode | null => {
  if (canExitEditMode(parseState)) {
    return "display";
  }
  return null;
};
