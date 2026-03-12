/**
 * リファレンスエントリの型定義と純粋ロジック。
 *
 * 多言語対応の構造化リファレンスシステムを提供する。
 * テキストはパラグラフ単位のマークダウンで管理し、
 * 英語・日本語の同期を取りやすくする。
 *
 * 変更時は referenceEntry.test.ts, referenceContent.ts も同期すること。
 */

// --- ロケール ---

/** サポートするロケール */
export type Locale = "en" | "ja";

/** 全サポートロケール一覧 */
export const allLocales: readonly Locale[] = ["en", "ja"] as const;

// --- 多言語テキスト ---

/**
 * 多言語テキスト。各ロケールに対応する文字列を持つ。
 * パラグラフ単位のマークダウン対応。
 */
export type LocalizedText = {
  readonly [K in Locale]: string;
};

/**
 * 多言語テキストの配列（パラグラフ単位）。
 * 各パラグラフが対応するロケールのテキストを持つことで、
 * 翻訳の同期を容易にする。
 */
export type LocalizedParagraphs = {
  readonly [K in Locale]: readonly string[];
};

// --- リファレンスカテゴリ ---

/**
 * リファレンスエントリのカテゴリ。
 * - "axiom": 公理（A1, A2, A3, M3, EFQ, DNE, A4, A5, E1-E5）
 * - "inference-rule": 推論規則（MP, Gen, 自然演繹ルール, シーケント計算ルール）
 * - "logic-system": 論理体系（Łukasiewicz, Mendelson, 直観主義, 古典, etc.）
 * - "notation": 記法・記号（→, ∧, ∨, ¬, ∀, ∃, =）
 * - "concept": 概念（代入, ユニフィケーション, 証明図, etc.）
 * - "theory": 理論（ペアノ算術, 群論, etc.）
 */
export type ReferenceCategory =
  | "axiom"
  | "inference-rule"
  | "logic-system"
  | "notation"
  | "concept"
  | "theory";

/** 全カテゴリ一覧 */
export const allCategories: readonly ReferenceCategory[] = [
  "axiom",
  "inference-rule",
  "logic-system",
  "notation",
  "concept",
  "theory",
] as const;

/** カテゴリの多言語メタデータ */
export type ReferenceCategoryMeta = {
  readonly id: ReferenceCategory;
  readonly label: LocalizedText;
  readonly description: LocalizedText;
};

/** カテゴリメタデータ定義 */
export const categoryMetas: readonly ReferenceCategoryMeta[] = [
  {
    id: "axiom",
    label: { en: "Axioms", ja: "公理" },
    description: {
      en: "Axiom schemas used in formal proof systems.",
      ja: "形式証明体系で使用される公理スキーマ。",
    },
  },
  {
    id: "inference-rule",
    label: { en: "Inference Rules", ja: "推論規則" },
    description: {
      en: "Rules for deriving new formulas from existing ones.",
      ja: "既存の論理式から新しい論理式を導出する規則。",
    },
  },
  {
    id: "logic-system",
    label: { en: "Logic Systems", ja: "論理体系" },
    description: {
      en: "Axiomatic systems and their properties.",
      ja: "公理系とその性質。",
    },
  },
  {
    id: "notation",
    label: { en: "Notation", ja: "記法" },
    description: {
      en: "Symbols and notation conventions.",
      ja: "記号と記法の規約。",
    },
  },
  {
    id: "concept",
    label: { en: "Concepts", ja: "概念" },
    description: {
      en: "Fundamental concepts in formal logic.",
      ja: "形式論理学の基本概念。",
    },
  },
  {
    id: "theory",
    label: { en: "Theories", ja: "理論" },
    description: {
      en: "Mathematical theories built on formal logic.",
      ja: "形式論理学上に構築される数学的理論。",
    },
  },
] as const;

// --- 外部リンク ---

/** 外部リンクの種類 */
export type ExternalLinkType =
  | "wikipedia-en"
  | "wikipedia-ja"
  | "mathworld"
  | "nlab"
  | "paper"
  | "other";

/** 外部リンク */
export type ExternalLink = {
  readonly type: ExternalLinkType;
  readonly url: string;
  readonly label: LocalizedText;
  /** リンク先ドキュメントの言語 */
  readonly documentLanguage: Locale;
};

// --- リファレンスエントリ ---

/** リファレンスエントリの一意識別子 */
export type ReferenceEntryId = string;

/**
 * リファレンスエントリ。
 *
 * 公理、推論規則、論理体系、記法、概念などの
 * 多言語対応の解説を提供する。
 */
export type ReferenceEntry = {
  /** 一意識別子（例: "axiom-a1", "rule-mp", "system-lukasiewicz"） */
  readonly id: ReferenceEntryId;
  /** カテゴリ */
  readonly category: ReferenceCategory;
  /** 表示名 */
  readonly title: LocalizedText;
  /** 短い要約（ポップオーバー用） */
  readonly summary: LocalizedText;
  /** 本文（パラグラフ単位のマークダウン） */
  readonly body: LocalizedParagraphs;
  /** 形式的な表記（LaTeX文字列、数式表現用）。なければundefined */
  readonly formalNotation?: string;
  /** 関連するリファレンスエントリID */
  readonly relatedEntryIds: readonly ReferenceEntryId[];
  /** 外部リンク */
  readonly externalLinks: readonly ExternalLink[];
  /** 検索用キーワード（ロケール非依存） */
  readonly keywords: readonly string[];
  /** 表示順 */
  readonly order: number;
};

// --- 検索・フィルタリング ---

/** ロケール指定でテキストを取得する */
export function getLocalizedText(text: LocalizedText, locale: Locale): string {
  return text[locale];
}

/** ロケール指定でパラグラフを取得する */
export function getLocalizedParagraphs(
  paragraphs: LocalizedParagraphs,
  locale: Locale,
): readonly string[] {
  return paragraphs[locale];
}

/** カテゴリIDからカテゴリメタデータを検索する */
export function findCategoryMeta(
  category: ReferenceCategory,
): ReferenceCategoryMeta | undefined {
  return categoryMetas.find((m) => m.id === category);
}

/** カテゴリでフィルタリングする */
export function filterByCategory(
  entries: readonly ReferenceEntry[],
  category: ReferenceCategory,
): readonly ReferenceEntry[] {
  return entries.filter((e) => e.category === category);
}

/** 複数カテゴリでフィルタリングする */
export function filterByCategories(
  entries: readonly ReferenceEntry[],
  categories: readonly ReferenceCategory[],
): readonly ReferenceEntry[] {
  const categorySet = new Set(categories);
  return entries.filter((e) => categorySet.has(e.category));
}

/**
 * テキスト検索でフィルタリングする。
 *
 * title, summary, body のいずれかに指定ロケールで
 * クエリ文字列が含まれるエントリを返す。
 * keywords のマッチも含む。
 * 大文字小文字は区別しない。
 */
export function searchEntries(
  entries: readonly ReferenceEntry[],
  query: string,
  locale: Locale,
): readonly ReferenceEntry[] {
  const normalizedQuery = query.toLowerCase();
  if (normalizedQuery === "") return entries;

  return entries.filter((entry) => {
    const title = getLocalizedText(entry.title, locale).toLowerCase();
    if (title.includes(normalizedQuery)) return true;

    const summary = getLocalizedText(entry.summary, locale).toLowerCase();
    if (summary.includes(normalizedQuery)) return true;

    const bodyParagraphs = getLocalizedParagraphs(entry.body, locale);
    for (const paragraph of bodyParagraphs) {
      if (paragraph.toLowerCase().includes(normalizedQuery)) return true;
    }

    for (const keyword of entry.keywords) {
      if (keyword.toLowerCase().includes(normalizedQuery)) return true;
    }

    return false;
  });
}

/** カテゴリでグループ化する */
export function groupByCategory(
  entries: readonly ReferenceEntry[],
): ReadonlyMap<ReferenceCategory, readonly ReferenceEntry[]> {
  const map = new Map<ReferenceCategory, ReferenceEntry[]>();
  for (const entry of entries) {
    const existing = map.get(entry.category);
    if (existing !== undefined) {
      existing.push(entry);
    } else {
      map.set(entry.category, [entry]);
    }
  }
  return map;
}

/** order順にソートする */
export function sortByOrder(
  entries: readonly ReferenceEntry[],
): readonly ReferenceEntry[] {
  return [...entries].sort((a, b) => a.order - b.order);
}

/** IDからエントリを検索する */
export function findEntryById(
  entries: readonly ReferenceEntry[],
  id: ReferenceEntryId,
): ReferenceEntry | undefined {
  return entries.find((e) => e.id === id);
}

/** 関連エントリを取得する */
export function getRelatedEntries(
  allEntries: readonly ReferenceEntry[],
  entry: ReferenceEntry,
): readonly ReferenceEntry[] {
  const relatedIds = new Set(entry.relatedEntryIds);
  return allEntries.filter((e) => relatedIds.has(e.id));
}

/** エントリIDの一意性を検証する */
export function validateUniqueIds(entries: readonly ReferenceEntry[]): boolean {
  const ids = new Set(entries.map((e) => e.id));
  return ids.size === entries.length;
}
