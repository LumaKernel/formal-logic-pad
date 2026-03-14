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

// --- インラインHTMLタグパース ---

/**
 * インラインHTMLタグの要素。
 * テキスト、ボールド（<b>...</b>）、イタリック（<i>...</i>）、
 * またはコード（<code>...</code>）のいずれか。
 */
export type InlineElement =
  | { readonly type: "text"; readonly content: string }
  | { readonly type: "bold"; readonly content: string }
  | { readonly type: "italic"; readonly content: string }
  | { readonly type: "code"; readonly content: string }
  | { readonly type: "subscript"; readonly content: string }
  | { readonly type: "math"; readonly content: string };

/** サポートするHTMLタグとInlineElement typeの対応 */
const tagTypeMap: ReadonlyMap<string, InlineElement["type"]> = new Map([
  ["b", "bold"],
  ["i", "italic"],
  ["code", "code"],
]);

/**
 * テキスト要素内の下付き文字（_XYZ）をパースする。
 * _に続くアルファベット・数字の連続を下付き文字として抽出する。
 */
function parseSubscriptsInText(content: string): readonly InlineElement[] {
  const result: InlineElement[] = [];
  const subscriptRegex = /_([A-Za-z0-9]+)/g;
  let lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = subscriptRegex.exec(content)) !== null) {
    // _の前のテキスト
    if (match.index > lastIndex) {
      result.push({
        type: "text",
        content: content.slice(lastIndex, match.index),
      });
    }

    result.push({ type: "subscript", content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  // 残りのテキスト
  if (lastIndex < content.length) {
    result.push({ type: "text", content: content.slice(lastIndex) });
  }

  return result;
}

/**
 * インラインHTMLタグおよびインライン数式をパースする。
 * <b>bold</b>, <i>italic</i>, <code>code</code>, $math$, _subscript をサポート。
 * ネストはサポートしない（フラットなインライン要素のみ）。
 *
 * 変更時は referenceUILogic.test.ts（parseInlineMarkdown）も同期すること。
 */
export function parseInlineMarkdown(text: string): readonly InlineElement[] {
  const rawElements: InlineElement[] = [];
  // HTMLタグまたは $...$ にマッチする正規表現
  // $...$ は非貪欲マッチで、$ の直後が空白でないものにマッチ
  const tokenRegex = /<(b|i|code)>|\$([^$]+?)\$/g;
  let lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(text)) !== null) {
    // $...$ 数式マッチ
    if (match[2] !== undefined) {
      // $の前のテキスト
      if (match.index > lastIndex) {
        rawElements.push({
          type: "text",
          content: text.slice(lastIndex, match.index),
        });
      }
      rawElements.push({ type: "math", content: match[2] });
      lastIndex = match.index + match[0].length;
      continue;
    }

    // HTMLタグマッチ
    const tagName = match[1];
    const closeTag = `</${tagName satisfies string}>`;
    const closeIndex = text.indexOf(closeTag, match.index + match[0].length);

    if (closeIndex === -1) {
      // 閉じタグがない場合はテキストとして扱う
      continue;
    }

    // 開きタグ前のテキスト
    if (match.index > lastIndex) {
      rawElements.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    const content = text.slice(match.index + match[0].length, closeIndex);
    const elementType = tagTypeMap.get(tagName);
    if (content.length > 0 && elementType !== undefined) {
      rawElements.push({ type: elementType, content });
    }

    lastIndex = closeIndex + closeTag.length;
    tokenRegex.lastIndex = lastIndex;
  }

  // 残りのテキスト
  if (lastIndex < text.length) {
    rawElements.push({ type: "text", content: text.slice(lastIndex) });
  }

  // テキスト要素内の下付き文字をパース（2nd pass）
  const result: InlineElement[] = [];
  for (const el of rawElements) {
    if (el.type === "text") {
      result.push(...parseSubscriptsInText(el.content));
    } else {
      result.push(el);
    }
  }

  return result;
}

// --- ポップオーバー用データ ---

/** ポップオーバー表示用のデータ */
export type PopoverData = {
  readonly title: string;
  readonly categoryLabel: string;
  readonly summary: string;
  readonly formalNotation: string | readonly string[] | undefined;
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
      (entry.relatedQuestIds ?? []).length > 0 ||
      entry.externalLinks.length > 0,
  };
}

// --- モーダル用データ ---

/** モーダル表示用のデータ */
export type ModalData = {
  readonly title: string;
  readonly categoryLabel: string;
  readonly summary: string;
  readonly formalNotation: string | readonly string[] | undefined;
  readonly bodyParagraphs: readonly string[];
  readonly relatedEntries: readonly {
    readonly id: string;
    readonly title: string;
  }[];
  readonly relatedQuestIds: readonly string[];
  readonly externalLinks: readonly {
    readonly url: string;
    readonly label: string;
    readonly documentLanguage: Locale;
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
    readonly documentLanguage: Locale;
  }[] = entry.externalLinks.map((link: ExternalLink) => ({
    url: link.url,
    label: getLocalizedText(link.label, locale),
    documentLanguage: link.documentLanguage,
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
    relatedQuestIds: entry.relatedQuestIds ?? [],
    externalLinks,
  };
}
