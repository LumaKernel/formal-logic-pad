/**
 * スクリプトエディタのキーボードショートカット純粋ロジック。
 *
 * キーボードイベントを分類し、アクションを返す。
 * DOM依存なし・副作用なし。
 *
 * 変更時は scriptEditorKeyboardShortcuts.test.ts, ScriptEditorComponent.tsx, index.ts も同期すること。
 */

import type { TabSource } from "./scriptWorkspaceState";

// ── アクション型 ──────────────────────────────────────────────────

/** スクリプトエディタのキーボードショートカットアクション */
export type ScriptEditorKeyboardAction =
  | { readonly type: "save-new" }
  | { readonly type: "save-overwrite" }
  | { readonly type: "none" };

// ── イベント入力型 ────────────────────────────────────────────────

/** キーボードイベントの最小入力（テスト可能にするためDOMに依存しない） */
export type ScriptEditorKeyEventInput = {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
};

// ── タブコンテキスト型 ────────────────────────────────────────────

/** ショートカット判定に必要なアクティブタブの情報 */
export type ActiveTabContext = {
  readonly source: TabSource;
  readonly readonly: boolean;
};

// ── 純粋関数 ──────────────────────────────────────────────────────

/**
 * キーボードイベントを分類し、スクリプトエディタアクションを返す。
 *
 * - Ctrl/Cmd+S:
 *   - readonlyタブ → none
 *   - unnamedタブ → save-new（ダイアログを開く）
 *   - savedタブ → save-overwrite（上書き保存）
 * - それ以外 → none
 */
export const classifyScriptEditorKeyDown = (
  event: ScriptEditorKeyEventInput,
  activeTab: ActiveTabContext | undefined,
): ScriptEditorKeyboardAction => {
  if (activeTab === undefined) return { type: "none" };

  const mod = event.ctrlKey || event.metaKey;

  // Ctrl/Cmd+S → save
  if (mod && event.key.toLowerCase() === "s" && !event.shiftKey) {
    if (activeTab.readonly) return { type: "none" };
    if (activeTab.source === "unnamed") return { type: "save-new" };
    if (activeTab.source === "saved") return { type: "save-overwrite" };
    return { type: "none" };
  }

  return { type: "none" };
};
