import { describe, it, expect } from "vitest";
import type { ReferenceEntry } from "./referenceEntry";
import {
  filterEntries,
  computeCategoryCounts,
  buildCategoryBadges,
  buildGuideCards,
  isInitialState,
  setSearchQuery,
  toggleCategory,
  resetFilters,
  buildEntryListItems,
  initialBrowserState,
  type ReferenceBrowserState,
} from "./referenceBrowserLogic";

// --- Test Data ---

const makeEntry = (
  overrides: Partial<ReferenceEntry> & Pick<ReferenceEntry, "id" | "category">,
): ReferenceEntry => ({
  title: {
    en: `Title ${overrides.id satisfies string}`,
    ja: `タイトル ${overrides.id satisfies string}`,
  },
  summary: {
    en: `Summary ${overrides.id satisfies string}`,
    ja: `要約 ${overrides.id satisfies string}`,
  },
  body: { en: ["body"], ja: ["本文"] },
  relatedEntryIds: [],
  externalLinks: [],
  keywords: [],
  order: 0,
  ...overrides,
});

const sampleEntries: readonly ReferenceEntry[] = [
  makeEntry({ id: "axiom-a1", category: "axiom", order: 1 }),
  makeEntry({ id: "axiom-a2", category: "axiom", order: 2 }),
  makeEntry({ id: "rule-mp", category: "inference-rule", order: 1 }),
  makeEntry({
    id: "system-luk",
    category: "logic-system",
    order: 1,
    title: { en: "Łukasiewicz System", ja: "ウカシェヴィチ体系" },
  }),
  makeEntry({
    id: "notation-impl",
    category: "notation",
    order: 1,
    formalNotation: "\\to",
  }),
  makeEntry({ id: "concept-sub", category: "concept", order: 1 }),
  makeEntry({ id: "theory-pa", category: "theory", order: 1 }),
];

// --- filterEntries ---

describe("filterEntries", () => {
  it("フィルタなしで全エントリをorder順に返す", () => {
    const result = filterEntries(sampleEntries, initialBrowserState, "en");
    expect(result).toHaveLength(sampleEntries.length);
  });

  it("カテゴリフィルタで絞り込む", () => {
    const state: ReferenceBrowserState = {
      searchQuery: "",
      selectedCategory: "axiom",
    };
    const result = filterEntries(sampleEntries, state, "en");
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.category === "axiom")).toBe(true);
  });

  it("テキスト検索で絞り込む", () => {
    const state: ReferenceBrowserState = {
      searchQuery: "Łukasiewicz",
      selectedCategory: null,
    };
    const result = filterEntries(sampleEntries, state, "en");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("system-luk");
  });

  it("日本語ロケールでテキスト検索", () => {
    const state: ReferenceBrowserState = {
      searchQuery: "ウカシェ",
      selectedCategory: null,
    };
    const result = filterEntries(sampleEntries, state, "ja");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("system-luk");
  });

  it("カテゴリ＋テキスト検索の組み合わせ", () => {
    const state: ReferenceBrowserState = {
      searchQuery: "a1",
      selectedCategory: "axiom",
    };
    const result = filterEntries(sampleEntries, state, "en");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("axiom-a1");
  });

  it("該当なしで空配列を返す", () => {
    const state: ReferenceBrowserState = {
      searchQuery: "nonexistent",
      selectedCategory: null,
    };
    const result = filterEntries(sampleEntries, state, "en");
    expect(result).toHaveLength(0);
  });

  it("order順でソートされる", () => {
    const entries: readonly ReferenceEntry[] = [
      makeEntry({ id: "b", category: "axiom", order: 3 }),
      makeEntry({ id: "a", category: "axiom", order: 1 }),
      makeEntry({ id: "c", category: "axiom", order: 2 }),
    ];
    const result = filterEntries(entries, initialBrowserState, "en");
    expect(result.map((e) => e.id)).toEqual(["a", "c", "b"]);
  });
});

// --- computeCategoryCounts ---

describe("computeCategoryCounts", () => {
  it("各カテゴリのエントリ数を返す", () => {
    const counts = computeCategoryCounts(sampleEntries);
    expect(counts.get("axiom")).toBe(2);
    expect(counts.get("inference-rule")).toBe(1);
    expect(counts.get("logic-system")).toBe(1);
    expect(counts.get("notation")).toBe(1);
    expect(counts.get("concept")).toBe(1);
    expect(counts.get("theory")).toBe(1);
  });

  it("空エントリで全カテゴリ0を返す", () => {
    const counts = computeCategoryCounts([]);
    expect(counts.get("axiom")).toBe(0);
    expect(counts.get("inference-rule")).toBe(0);
    expect(counts.get("theory")).toBe(0);
  });
});

// --- buildCategoryBadges ---

describe("buildCategoryBadges", () => {
  it("カテゴリバッジ一覧を生成する", () => {
    const badges = buildCategoryBadges(sampleEntries, null, "en");
    expect(badges).toHaveLength(7);
    // "guide" is now the first category in categoryMetas
    expect(badges[0]?.label).toBe("Guides");
    expect(badges[0]?.count).toBe(0); // No guide entries in sampleEntries
    // "axiom" is now the second category
    expect(badges[1]?.label).toBe("Axioms");
    expect(badges[1]?.count).toBe(2);
    expect(badges[1]?.isSelected).toBe(false);
  });

  it("選択されたカテゴリのisSelectedがtrue", () => {
    const badges = buildCategoryBadges(sampleEntries, "axiom", "en");
    const axiomBadge = badges.find((b) => b.id === "axiom");
    expect(axiomBadge?.isSelected).toBe(true);
    const ruleBadge = badges.find((b) => b.id === "inference-rule");
    expect(ruleBadge?.isSelected).toBe(false);
  });

  it("日本語ロケールでラベルが日本語", () => {
    const badges = buildCategoryBadges(sampleEntries, null, "ja");
    expect(badges[0]?.label).toBe("ガイド"); // "guide" is first
    expect(badges[1]?.label).toBe("公理"); // "axiom" is second
  });
});

// --- setSearchQuery ---

describe("setSearchQuery", () => {
  it("検索クエリを更新する", () => {
    const result = setSearchQuery(initialBrowserState, "test");
    expect(result.searchQuery).toBe("test");
    expect(result.selectedCategory).toBeNull();
  });
});

// --- toggleCategory ---

describe("toggleCategory", () => {
  it("カテゴリを選択する", () => {
    const result = toggleCategory(initialBrowserState, "axiom");
    expect(result.selectedCategory).toBe("axiom");
  });

  it("同じカテゴリをトグルすると解除", () => {
    const state: ReferenceBrowserState = {
      searchQuery: "",
      selectedCategory: "axiom",
    };
    const result = toggleCategory(state, "axiom");
    expect(result.selectedCategory).toBeNull();
  });

  it("別のカテゴリに切り替え", () => {
    const state: ReferenceBrowserState = {
      searchQuery: "",
      selectedCategory: "axiom",
    };
    const result = toggleCategory(state, "concept");
    expect(result.selectedCategory).toBe("concept");
  });

  it("検索クエリは維持される", () => {
    const state: ReferenceBrowserState = {
      searchQuery: "test",
      selectedCategory: null,
    };
    const result = toggleCategory(state, "axiom");
    expect(result.searchQuery).toBe("test");
  });
});

// --- resetFilters ---

describe("resetFilters", () => {
  it("初期状態に戻す", () => {
    const result = resetFilters();
    expect(result).toEqual(initialBrowserState);
  });
});

// --- buildEntryListItems ---

describe("buildEntryListItems", () => {
  it("エントリ一覧データを生成する", () => {
    const items = buildEntryListItems(sampleEntries, "en");
    expect(items).toHaveLength(sampleEntries.length);

    const first = items[0];
    expect(first?.id).toBe("axiom-a1");
    expect(first?.title).toBe("Title axiom-a1");
    expect(first?.summary).toBe("Summary axiom-a1");
    expect(first?.categoryLabel).toBe("Axioms");
    expect(first?.category).toBe("axiom");
    expect(first?.hasFormalNotation).toBe(false);
  });

  it("formalNotationがあるエントリはhasFormalNotation=true", () => {
    const items = buildEntryListItems(sampleEntries, "en");
    const notation = items.find((i) => i.id === "notation-impl");
    expect(notation?.hasFormalNotation).toBe(true);
  });

  it("日本語ロケールでタイトル・サマリーが日本語", () => {
    const items = buildEntryListItems(sampleEntries, "ja");
    const first = items[0];
    expect(first?.title).toBe("タイトル axiom-a1");
    expect(first?.summary).toBe("要約 axiom-a1");
    expect(first?.categoryLabel).toBe("公理");
  });
});

// --- buildGuideCards ---

describe("buildGuideCards", () => {
  const entriesWithGuides: readonly ReferenceEntry[] = [
    ...sampleEntries,
    makeEntry({
      id: "guide-intro",
      category: "guide",
      order: 2,
      title: { en: "Intro Guide", ja: "入門ガイド" },
      summary: { en: "Intro summary", ja: "入門要約" },
    }),
    makeEntry({
      id: "guide-first",
      category: "guide",
      order: 1,
      title: { en: "First Guide", ja: "最初のガイド" },
      summary: { en: "First summary", ja: "最初の要約" },
    }),
  ];

  it("guideカテゴリのエントリのみ抽出する", () => {
    const cards = buildGuideCards(entriesWithGuides, "en");
    expect(cards).toHaveLength(2);
    expect(cards.every((c) => c.id.startsWith("guide-"))).toBe(true);
  });

  it("order順にソートされる", () => {
    const cards = buildGuideCards(entriesWithGuides, "en");
    expect(cards[0]?.id).toBe("guide-first");
    expect(cards[1]?.id).toBe("guide-intro");
  });

  it("ローカライズされたタイトル・サマリーを返す", () => {
    const cards = buildGuideCards(entriesWithGuides, "ja");
    expect(cards[0]?.title).toBe("最初のガイド");
    expect(cards[0]?.summary).toBe("最初の要約");
  });

  it("guideエントリがなければ空配列を返す", () => {
    const cards = buildGuideCards(sampleEntries, "en");
    expect(cards).toHaveLength(0);
  });
});

// --- isInitialState ---

describe("isInitialState", () => {
  it("初期状態でtrue", () => {
    expect(isInitialState(initialBrowserState)).toBe(true);
  });

  it("検索クエリがあるとfalse", () => {
    expect(
      isInitialState({ searchQuery: "test", selectedCategory: null }),
    ).toBe(false);
  });

  it("カテゴリが選択されているとfalse", () => {
    expect(isInitialState({ searchQuery: "", selectedCategory: "axiom" })).toBe(
      false,
    );
  });
});
