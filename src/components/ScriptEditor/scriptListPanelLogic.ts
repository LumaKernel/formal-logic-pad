/**
 * スクリプト一覧パネルの純粋ロジック。
 *
 * Hub ページの Scripts タブに表示するスクリプト一覧の
 * 表示用データ変換を担う。
 *
 * 変更時は scriptListPanelLogic.test.ts, ScriptListPanel.tsx も同期すること。
 */

import type { SavedScript } from "./savedScriptsLogic";

// ── 型定義 ─────────────────────────────────────────────────────

export interface ScriptListItem {
  readonly id: string;
  readonly title: string;
  readonly savedAtLabel: string;
}

// ── 変換関数 ───────────────────────────────────────────────────

/**
 * 保存日時をラベル文字列に変換する。
 * now との差分から相対表示を生成。
 */
export const formatSavedAtLabel = (savedAt: number, now: number): string => {
  const diffMs = now - savedAt;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${String(diffMin) satisfies string}m ago`;
  if (diffHour < 24) return `${String(diffHour) satisfies string}h ago`;
  return `${String(diffDay) satisfies string}d ago`;
};

/**
 * SavedScript[] → ScriptListItem[] への変換。
 * 新しい順にソートする。
 */
export const toScriptListItems = (
  scripts: readonly SavedScript[],
  now: number,
): readonly ScriptListItem[] =>
  [...scripts]
    .sort((a, b) => b.savedAt - a.savedAt)
    .map(
      (s): ScriptListItem => ({
        id: s.id,
        title: s.title,
        savedAtLabel: formatSavedAtLabel(s.savedAt, now),
      }),
    );
