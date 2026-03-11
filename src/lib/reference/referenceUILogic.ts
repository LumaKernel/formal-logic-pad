/**
 * リファレンスUIの純粋ロジック。
 *
 * マークダウンの簡易パース、表示用データ構造の生成を行う。
 * UIコンポーネント（ReferencePopover, ReferenceModal）から利用する。
 *
 * 変更時は referenceUILogic.test.ts も同期すること。
 */

import type { ExternalLink, Locale, ReferenceEntry } from "./referenceEntry";
import {
  findCategoryMeta,
  getLocalizedParagraphs,
  getLocalizedText,
} from "./referenceEntry";

// --- 簡易マークダウンパース ---

/**
 * インラインマークダウンの要素。
 * テキスト、ボールド（**...**）、またはイタリック（*...*）のいずれか。
 */
export type InlineElement =
  | { readonly type: "text"; readonly content: string }
  | { readonly type: "bold"; readonly content: string }
  | { readonly type: "italic"; readonly content: string };

/**
 * 簡易インラインマークダウンをパースする。
 * **bold** と *italic* をサポート。
 */
export function parseInlineMarkdown(text: string): readonly InlineElement[] {
  const result: InlineElement[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const boldStart = remaining.indexOf("**");
    const italicStart = remaining.indexOf("*");

    // * がまったくない場合 → 残り全部テキスト
    if (italicStart === -1) {
      result.push({ type: "text", content: remaining });
      break;
    }

    // ** が見つかり、* の位置と一致する場合 → bold を優先
    if (boldStart === italicStart) {
      // bold の処理
      if (boldStart > 0) {
        result.push({
          type: "text",
          content: remaining.slice(0, boldStart),
        });
      }

      const boldEnd = remaining.indexOf("**", boldStart + 2);
      if (boldEnd === -1) {
        // 閉じ ** がない場合はそのままテキストとして扱う
        result.push({ type: "text", content: remaining.slice(boldStart) });
        break;
      }

      const boldContent = remaining.slice(boldStart + 2, boldEnd);
      if (boldContent.length > 0) {
        result.push({ type: "bold", content: boldContent });
      }

      remaining = remaining.slice(boldEnd + 2);
      continue;
    }

    // * はあるが ** ではない、または * が ** より前にある → italic の処理
    if (italicStart > 0) {
      result.push({
        type: "text",
        content: remaining.slice(0, italicStart),
      });
    }

    // 閉じ * を探す（** を避ける）
    const afterOpen = remaining.slice(italicStart + 1);
    let italicEnd = -1;
    let searchPos = 0;
    while (searchPos < afterOpen.length) {
      const nextStar = afterOpen.indexOf("*", searchPos);
      if (nextStar === -1) {
        break;
      }
      // ** の場合はスキップ（bold marker）
      if (
        nextStar + 1 < afterOpen.length &&
        afterOpen[nextStar + 1] === "*"
      ) {
        searchPos = nextStar + 2;
        continue;
      }
      italicEnd = nextStar;
      break;
    }

    if (italicEnd === -1) {
      // 閉じ * がない場合はそのままテキストとして扱う
      result.push({ type: "text", content: remaining.slice(italicStart) });
      break;
    }

    const italicContent = afterOpen.slice(0, italicEnd);
    if (italicContent.length > 0) {
      result.push({ type: "italic", content: italicContent });
    }

    remaining = afterOpen.slice(italicEnd + 1);
  }

  return result;
}

// --- ポップオーバー用データ ---

/** ポップオーバー表示用のデータ */
export type PopoverData = {
  readonly title: string;
  readonly categoryLabel: string;
  readonly summary: string;
  readonly formalNotation: string | undefined;
  readonly hasDetail: boolean;
};

/** エントリからポップオーバー表示用データを生成する */
export function buildPopoverData(
  entry: ReferenceEntry,
  locale: Locale,
): PopoverData {
  const categoryMeta = findCategoryMeta(entry.category);
  return {
    title: getLocalizedText(entry.title, locale),
    categoryLabel: categoryMeta
      ? getLocalizedText(categoryMeta.label, locale)
      : entry.category,
    summary: getLocalizedText(entry.summary, locale),
    formalNotation: entry.formalNotation,
    hasDetail:
      getLocalizedParagraphs(entry.body, locale).length > 0 ||
      entry.relatedEntryIds.length > 0 ||
      entry.externalLinks.length > 0,
  };
}

// --- モーダル用データ ---

/** モーダル表示用のデータ */
export type ModalData = {
  readonly title: string;
  readonly categoryLabel: string;
  readonly summary: string;
  readonly formalNotation: string | undefined;
  readonly bodyParagraphs: readonly string[];
  readonly relatedEntries: readonly {
    readonly id: string;
    readonly title: string;
  }[];
  readonly externalLinks: readonly {
    readonly url: string;
    readonly label: string;
  }[];
};

/** エントリからモーダル表示用データを生成する */
export function buildModalData(
  entry: ReferenceEntry,
  allEntries: readonly ReferenceEntry[],
  locale: Locale,
): ModalData {
  const categoryMeta = findCategoryMeta(entry.category);
  const relatedIds = new Set(entry.relatedEntryIds);
  const relatedEntries = allEntries
    .filter((e) => relatedIds.has(e.id))
    .map((e) => ({
      id: e.id,
      title: getLocalizedText(e.title, locale),
    }));

  const externalLinks: readonly {
    readonly url: string;
    readonly label: string;
  }[] = entry.externalLinks.map((link: ExternalLink) => ({
    url: link.url,
    label: getLocalizedText(link.label, locale),
  }));

  return {
    title: getLocalizedText(entry.title, locale),
    categoryLabel: categoryMeta
      ? getLocalizedText(categoryMeta.label, locale)
      : entry.category,
    summary: getLocalizedText(entry.summary, locale),
    formalNotation: entry.formalNotation,
    bodyParagraphs: getLocalizedParagraphs(entry.body, locale),
    relatedEntries,
    externalLinks,
  };
}
