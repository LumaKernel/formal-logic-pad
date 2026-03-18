/**
 * スクリプトライブラリの純粋ロジック。
 *
 * ビルトインテンプレートと保存済みスクリプトを統合して
 * 検索・フィルタリング可能なライブラリを提供する。
 *
 * 変更時は scriptLibraryLogic.test.ts, ScriptLibraryPanel.tsx も同期すること。
 */

import type { ScriptTemplate } from "@/lib/script-runner/templates";
import type { DeductionStyle } from "@/lib/logic-core/deductionSystem";
import type { SavedScript } from "./savedScriptsLogic";

// ── 型定義 ─────────────────────────────────────────────────────

/**
 * ライブラリに表示するアイテムの種類。
 */
export type LibraryItemKind = "builtin" | "saved";

/**
 * ライブラリに表示する統一アイテム。
 */
export type LibraryItem = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly code: string;
  readonly kind: LibraryItemKind;
  /** ビルトインテンプレートの場合の互換スタイル */
  readonly compatibleStyles?: readonly DeductionStyle[];
};

/**
 * ライブラリの状態。
 */
export type ScriptLibraryState = {
  readonly searchQuery: string;
  readonly filterKind: LibraryItemKind | "all";
};

// ── 初期状態 ───────────────────────────────────────────────────

export const initialScriptLibraryState: ScriptLibraryState = {
  searchQuery: "",
  filterKind: "all",
};

// ── 変換関数 ───────────────────────────────────────────────────

/**
 * ビルトインテンプレートをライブラリアイテムに変換する。
 */
export const templateToLibraryItem = (
  template: ScriptTemplate,
): LibraryItem => ({
  id: template.id,
  title: template.title,
  description: template.description,
  code: template.code,
  kind: "builtin",
  compatibleStyles: template.compatibleStyles,
});

/**
 * 保存済みスクリプトをライブラリアイテムに変換する。
 */
export const savedScriptToLibraryItem = (script: SavedScript): LibraryItem => ({
  id: script.id,
  title: script.title,
  description: "",
  code: script.code,
  kind: "saved",
});

/**
 * テンプレートと保存済みスクリプトを統合してライブラリアイテム一覧を構築する。
 * ビルトインテンプレートは演繹スタイルでフィルタリングされる。
 */
export const buildLibraryItems = (
  templates: readonly ScriptTemplate[],
  savedScripts: readonly SavedScript[],
  deductionStyle: DeductionStyle | undefined,
): readonly LibraryItem[] => {
  const filteredTemplates = templates.filter(
    (t) =>
      deductionStyle === undefined ||
      t.compatibleStyles === undefined ||
      t.compatibleStyles.includes(deductionStyle),
  );
  return [
    ...filteredTemplates.map(templateToLibraryItem),
    ...savedScripts.map(savedScriptToLibraryItem),
  ];
};

// ── 検索・フィルタリング ─────────────────────────────────────────

/**
 * 検索クエリでライブラリアイテムをフィルタリングする。
 * タイトルと説明をcase-insensitiveで部分一致検索する。
 */
export const searchLibraryItems = (
  items: readonly LibraryItem[],
  query: string,
): readonly LibraryItem[] => {
  const trimmed = query.trim().toLowerCase();
  if (trimmed === "") return items;
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(trimmed) ||
      item.description.toLowerCase().includes(trimmed),
  );
};

/**
 * 種類でフィルタリングする。
 */
export const filterByKind = (
  items: readonly LibraryItem[],
  kind: LibraryItemKind | "all",
): readonly LibraryItem[] => {
  if (kind === "all") return items;
  return items.filter((item) => item.kind === kind);
};

/**
 * 検索クエリと種類フィルタを組み合わせてライブラリアイテムをフィルタリングする。
 */
export const filterLibraryItems = (
  items: readonly LibraryItem[],
  state: ScriptLibraryState,
): readonly LibraryItem[] =>
  filterByKind(searchLibraryItems(items, state.searchQuery), state.filterKind);

// ── 状態更新 ───────────────────────────────────────────────────

export const updateSearchQuery = (
  state: ScriptLibraryState,
  query: string,
): ScriptLibraryState => ({
  ...state,
  searchQuery: query,
});

export const updateFilterKind = (
  state: ScriptLibraryState,
  kind: LibraryItemKind | "all",
): ScriptLibraryState => ({
  ...state,
  filterKind: kind,
});
