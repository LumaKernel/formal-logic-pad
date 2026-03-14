/**
 * リファレンスビューアーページの純粋ロジック。
 *
 * URL生成、ページデータ構築、パンくず生成を行う。
 * ビューアーページコンポーネント（ReferenceViewerPageView）から利用する。
 *
 * 変更時は referenceViewerLogic.test.ts も同期すること。
 */

import type { Locale, ReferenceCategory, ReferenceEntry } from "./referenceEntry";
import {
  filterByCategory,
  findCategoryMeta,
  findEntryById,
  getLocalizedParagraphs,
  getLocalizedText,
  sortByOrder,
} from "./referenceEntry";

// --- URL生成 ---

/** リファレンスビューアーページのURLを生成する */
export function buildReferenceViewerUrl(entryId: string): string {
  return `/reference/${encodeURIComponent(entryId) satisfies string}`;
}

// --- パンくず ---

/** パンくずアイテム */
export type BreadcrumbItem = {
  readonly label: string;
  readonly href: string | undefined;
};

/** パンくずデータを生成する */
export function buildBreadcrumbs(
  entry: ReferenceEntry,
  locale: Locale,
): readonly BreadcrumbItem[] {
  const categoryMeta = findCategoryMeta(entry.category);
  /* v8 ignore start -- defensive fallback for unknown category; all known categories have meta */
  const categoryLabel = categoryMeta
    ? getLocalizedText(categoryMeta.label, locale)
    : entry.category;
  /* v8 ignore stop */
  const title = getLocalizedText(entry.title, locale);

  return [
    { label: "Home", href: "/" },
    {
      label: locale === "ja" ? "リファレンス" : "Reference",
      href: "/reference",
    },
    { label: categoryLabel, href: undefined },
    { label: title, href: undefined },
  ];
}

// --- ビューアーページデータ ---

/** ビューアーページの表示用データ */
export type ViewerPageData = {
  readonly title: string;
  readonly categoryLabel: string;
  readonly summary: string;
  readonly formalNotation: string | readonly string[] | undefined;
  readonly bodyParagraphs: readonly string[];
  readonly relatedEntries: readonly {
    readonly id: string;
    readonly title: string;
    readonly href: string;
  }[];
  readonly relatedQuestIds: readonly string[];
  readonly externalLinks: readonly {
    readonly url: string;
    readonly label: string;
    readonly documentLanguage: Locale;
  }[];
  readonly breadcrumbs: readonly BreadcrumbItem[];
};

/** エントリからビューアーページデータを生成する */
export function buildViewerPageData(
  entry: ReferenceEntry,
  allEntries: readonly ReferenceEntry[],
  locale: Locale,
): ViewerPageData {
  const categoryMeta = findCategoryMeta(entry.category);
  const relatedIds = new Set(entry.relatedEntryIds);
  const relatedEntries = allEntries
    .filter((e) => relatedIds.has(e.id))
    .map((e) => ({
      id: e.id,
      title: getLocalizedText(e.title, locale),
      href: buildReferenceViewerUrl(e.id),
    }));

  const externalLinks = entry.externalLinks.map((link) => ({
    url: link.url,
    label: getLocalizedText(link.label, locale),
    documentLanguage: link.documentLanguage,
  }));

  /* v8 ignore start -- defensive fallback for unknown category; all known categories have meta */
  const categoryLabel = categoryMeta
    ? getLocalizedText(categoryMeta.label, locale)
    : entry.category;
  /* v8 ignore stop */

  return {
    title: getLocalizedText(entry.title, locale),
    categoryLabel,
    summary: getLocalizedText(entry.summary, locale),
    formalNotation: entry.formalNotation,
    bodyParagraphs: getLocalizedParagraphs(entry.body, locale),
    relatedEntries,
    relatedQuestIds: entry.relatedQuestIds ?? [],
    externalLinks,
    breadcrumbs: buildBreadcrumbs(entry, locale),
  };
}

/** IDからエントリを解決する（コントローラー層で使用） */
export function resolveEntryById(
  allEntries: readonly ReferenceEntry[],
  id: string,
): ReferenceEntry | undefined {
  return findEntryById(allEntries, id);
}

// --- カテゴリ内ナビゲーション ---

/** ナビゲーションリンク情報 */
export type NavigationLink = {
  readonly id: string;
  readonly title: string;
  readonly href: string;
};

/** prev/next ナビゲーションデータ */
export type NavigationData = {
  readonly previous: NavigationLink | undefined;
  readonly next: NavigationLink | undefined;
};

/**
 * 同一カテゴリ内での前後ナビゲーションデータを生成する。
 *
 * order順でソートし、現在エントリの前後を返す。
 */
export function buildCategoryNavigation(
  currentEntry: ReferenceEntry,
  allEntries: readonly ReferenceEntry[],
  locale: Locale,
): NavigationData {
  const sameCategory = sortByOrder(
    filterByCategory(allEntries, currentEntry.category),
  );
  const currentIndex = sameCategory.findIndex(
    (e) => e.id === currentEntry.id,
  );

  /* v8 ignore start -- defensive: currentEntry should always be found in allEntries */
  if (currentIndex === -1) {
    return { previous: undefined, next: undefined };
  }
  /* v8 ignore stop */

  const toLink = (entry: ReferenceEntry): NavigationLink => ({
    id: entry.id,
    title: getLocalizedText(entry.title, locale),
    href: buildReferenceViewerUrl(entry.id),
  });

  const previous =
    currentIndex > 0 ? toLink(sameCategory[currentIndex - 1]) : undefined;
  const next =
    currentIndex < sameCategory.length - 1
      ? toLink(sameCategory[currentIndex + 1])
      : undefined;

  return { previous, next };
}

/**
 * 全カテゴリを跨いだ前後ナビゲーションデータを生成する。
 *
 * allCategories の順序でカテゴリを並べ、各カテゴリ内は order 順。
 * カテゴリ境界を跨ぐナビゲーションも提供する。
 */
export function buildGlobalNavigation(
  currentEntry: ReferenceEntry,
  allEntries: readonly ReferenceEntry[],
  categoryOrder: readonly ReferenceCategory[],
  locale: Locale,
): NavigationData {
  // カテゴリ順 + 各カテゴリ内 order 順でフラット化
  const orderedEntries: readonly ReferenceEntry[] = categoryOrder.flatMap(
    (cat) => sortByOrder(filterByCategory(allEntries, cat)),
  );

  const currentIndex = orderedEntries.findIndex(
    (e) => e.id === currentEntry.id,
  );

  /* v8 ignore start -- defensive: currentEntry should always be found in allEntries */
  if (currentIndex === -1) {
    return { previous: undefined, next: undefined };
  }
  /* v8 ignore stop */

  const toLink = (entry: ReferenceEntry): NavigationLink => ({
    id: entry.id,
    title: getLocalizedText(entry.title, locale),
    href: buildReferenceViewerUrl(entry.id),
  });

  const previous =
    currentIndex > 0 ? toLink(orderedEntries[currentIndex - 1]) : undefined;
  const next =
    currentIndex < orderedEntries.length - 1
      ? toLink(orderedEntries[currentIndex + 1])
      : undefined;

  return { previous, next };
}
