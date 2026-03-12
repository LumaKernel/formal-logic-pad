/**
 * リファレンスブラウザの純粋ロジック。
 *
 * カテゴリフィルタ・テキスト検索・エントリの絞り込みなど、
 * ReferenceBrowserComponent で使用する状態変換を提供する。
 *
 * 変更時は referenceBrowserLogic.test.ts も同期すること。
 */

import {
  type ReferenceCategory,
  type ReferenceEntry,
  type Locale,
  allCategories,
  categoryMetas,
  filterByCategory,
  searchEntries,
  sortByOrder,
  getLocalizedText,
} from "./referenceEntry";

// --- State ---

/** ブラウザの検索・フィルタ状態 */
export type ReferenceBrowserState = {
  /** テキスト検索クエリ */
  readonly searchQuery: string;
  /** 選択されたカテゴリフィルタ（nullの場合は全カテゴリ） */
  readonly selectedCategory: ReferenceCategory | null;
};

/** 初期状態 */
export const initialBrowserState: ReferenceBrowserState = {
  searchQuery: "",
  selectedCategory: null,
};

// --- Pure Logic ---

/** カテゴリフィルタを適用した後、テキスト検索を適用する */
export function filterEntries(
  entries: readonly ReferenceEntry[],
  state: ReferenceBrowserState,
  locale: Locale,
): readonly ReferenceEntry[] {
  const filtered =
    state.selectedCategory !== null
      ? filterByCategory(entries, state.selectedCategory)
      : entries;

  const searched = searchEntries(filtered, state.searchQuery, locale);
  return sortByOrder(searched);
}

/** カテゴリごとのエントリ数を計算する（フィルタ前の全エントリ対象） */
export function computeCategoryCounts(
  entries: readonly ReferenceEntry[],
): ReadonlyMap<ReferenceCategory, number> {
  const counts = new Map<ReferenceCategory, number>();
  for (const category of allCategories) {
    counts.set(category, 0);
  }
  for (const entry of entries) {
    const current = counts.get(entry.category) ?? 0;
    counts.set(entry.category, current + 1);
  }
  return counts;
}

/** カテゴリバッジ用のデータを生成する */
export type CategoryBadgeData = {
  readonly id: ReferenceCategory;
  readonly label: string;
  readonly count: number;
  readonly isSelected: boolean;
};

export function buildCategoryBadges(
  entries: readonly ReferenceEntry[],
  selectedCategory: ReferenceCategory | null,
  locale: Locale,
): readonly CategoryBadgeData[] {
  const counts = computeCategoryCounts(entries);
  return categoryMetas.map(
    (meta): CategoryBadgeData => ({
      id: meta.id,
      label: getLocalizedText(meta.label, locale),
      count: counts.get(meta.id) ?? 0,
      isSelected: meta.id === selectedCategory,
    }),
  );
}

/** 検索クエリの変更を適用 */
export function setSearchQuery(
  state: ReferenceBrowserState,
  query: string,
): ReferenceBrowserState {
  return { ...state, searchQuery: query };
}

/** カテゴリフィルタのトグル（同じカテゴリをクリックすると解除） */
export function toggleCategory(
  state: ReferenceBrowserState,
  category: ReferenceCategory,
): ReferenceBrowserState {
  return {
    ...state,
    selectedCategory: state.selectedCategory === category ? null : category,
  };
}

/** フィルタをすべてリセットする */
export function resetFilters(): ReferenceBrowserState {
  return initialBrowserState;
}

/** エントリリスト表示用のサマリーデータ */
export type EntryListItemData = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly categoryLabel: string;
  readonly category: ReferenceCategory;
  readonly hasFormalNotation: boolean;
};

/** エントリ一覧用のデータを生成 */
export function buildEntryListItems(
  entries: readonly ReferenceEntry[],
  locale: Locale,
): readonly EntryListItemData[] {
  return entries.map((entry): EntryListItemData => {
    const categoryMeta = categoryMetas.find((m) => m.id === entry.category);
    return {
      id: entry.id,
      title: getLocalizedText(entry.title, locale),
      summary: getLocalizedText(entry.summary, locale),
      categoryLabel: categoryMeta
        ? getLocalizedText(categoryMeta.label, locale)
        : entry.category,
      category: entry.category,
      hasFormalNotation: entry.formalNotation !== undefined,
    };
  });
}
