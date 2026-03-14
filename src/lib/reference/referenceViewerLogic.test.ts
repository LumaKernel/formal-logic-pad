import { describe, it, expect } from "vitest";
import type { ReferenceEntry } from "./referenceEntry";
import {
  buildReferenceViewerUrl,
  buildBreadcrumbs,
  buildViewerPageData,
  buildCategoryNavigation,
  buildGlobalNavigation,
  resolveEntryById,
} from "./referenceViewerLogic";

// --- テスト用データ ---

const sampleEntry: ReferenceEntry = {
  id: "axiom-a1",
  category: "axiom",
  title: { en: "Axiom A1", ja: "公理A1" },
  summary: {
    en: "The simplest axiom schema.",
    ja: "最も基本的な公理スキーマ。",
  },
  body: {
    en: ["First paragraph.", "Second paragraph."],
    ja: ["第1段落。", "第2段落。"],
  },
  formalNotation: "\\varphi \\to (\\psi \\to \\varphi)",
  relatedEntryIds: ["axiom-a2", "rule-mp"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Axiom",
      label: { en: "Wikipedia (EN)", ja: "Wikipedia（英語）" },
      documentLanguage: "en",
    },
  ],
  keywords: ["axiom", "a1"],
  order: 1,
};

const relatedEntry1: ReferenceEntry = {
  id: "axiom-a2",
  category: "axiom",
  title: { en: "Axiom A2", ja: "公理A2" },
  summary: { en: "Distribution axiom.", ja: "分配公理。" },
  body: { en: [], ja: [] },
  relatedEntryIds: [],
  externalLinks: [],
  keywords: [],
  order: 2,
};

const relatedEntry2: ReferenceEntry = {
  id: "rule-mp",
  category: "inference-rule",
  title: { en: "Modus Ponens", ja: "モーダスポネンス" },
  summary: { en: "The fundamental inference rule.", ja: "基本推論規則。" },
  body: { en: [], ja: [] },
  relatedEntryIds: [],
  externalLinks: [],
  keywords: [],
  order: 10,
};

const allEntries: readonly ReferenceEntry[] = [
  sampleEntry,
  relatedEntry1,
  relatedEntry2,
];

// --- buildReferenceViewerUrl ---

describe("buildReferenceViewerUrl", () => {
  it("エントリIDからURLを生成する", () => {
    expect(buildReferenceViewerUrl("axiom-a1")).toBe("/reference/axiom-a1");
  });

  it("特殊文字を含むIDをエンコードする", () => {
    expect(buildReferenceViewerUrl("test/entry")).toBe(
      "/reference/test%2Fentry",
    );
  });

  it("空のIDでもURLを生成する", () => {
    expect(buildReferenceViewerUrl("")).toBe("/reference/");
  });
});

// --- buildBreadcrumbs ---

describe("buildBreadcrumbs", () => {
  it("英語のパンくずを生成する", () => {
    const breadcrumbs = buildBreadcrumbs(sampleEntry, "en");
    expect(breadcrumbs).toEqual([
      { label: "Home", href: "/" },
      { label: "Reference", href: "/reference" },
      { label: "Axioms", href: undefined },
      { label: "Axiom A1", href: undefined },
    ]);
  });

  it("日本語のパンくずを生成する", () => {
    const breadcrumbs = buildBreadcrumbs(sampleEntry, "ja");
    expect(breadcrumbs).toEqual([
      { label: "Home", href: "/" },
      { label: "リファレンス", href: "/reference" },
      { label: "公理", href: undefined },
      { label: "公理A1", href: undefined },
    ]);
  });
});

// --- buildViewerPageData ---

describe("buildViewerPageData", () => {
  it("英語のビューアーデータを生成する", () => {
    const data = buildViewerPageData(sampleEntry, allEntries, "en");
    expect(data.title).toBe("Axiom A1");
    expect(data.categoryLabel).toBe("Axioms");
    expect(data.summary).toBe("The simplest axiom schema.");
    expect(data.formalNotation).toBe("\\varphi \\to (\\psi \\to \\varphi)");
    expect(data.bodyParagraphs).toEqual([
      "First paragraph.",
      "Second paragraph.",
    ]);
  });

  it("日本語のビューアーデータを生成する", () => {
    const data = buildViewerPageData(sampleEntry, allEntries, "ja");
    expect(data.title).toBe("公理A1");
    expect(data.categoryLabel).toBe("公理");
    expect(data.summary).toBe("最も基本的な公理スキーマ。");
    expect(data.bodyParagraphs).toEqual(["第1段落。", "第2段落。"]);
  });

  it("関連エントリのリンクを含む", () => {
    const data = buildViewerPageData(sampleEntry, allEntries, "en");
    expect(data.relatedEntries).toEqual([
      { id: "axiom-a2", title: "Axiom A2", href: "/reference/axiom-a2" },
      { id: "rule-mp", title: "Modus Ponens", href: "/reference/rule-mp" },
    ]);
  });

  it("外部リンクを含む", () => {
    const data = buildViewerPageData(sampleEntry, allEntries, "en");
    expect(data.externalLinks).toEqual([
      {
        url: "https://en.wikipedia.org/wiki/Axiom",
        label: "Wikipedia (EN)",
        documentLanguage: "en",
      },
    ]);
  });

  it("パンくずを含む", () => {
    const data = buildViewerPageData(sampleEntry, allEntries, "en");
    expect(data.breadcrumbs).toHaveLength(4);
    expect(data.breadcrumbs[0]).toEqual({ label: "Home", href: "/" });
  });

  it("formalNotationがないエントリではundefined", () => {
    const noFormula: ReferenceEntry = {
      ...sampleEntry,
      formalNotation: undefined,
    };
    const data = buildViewerPageData(noFormula, allEntries, "en");
    expect(data.formalNotation).toBeUndefined();
  });

  it("関連エントリがない場合は空配列", () => {
    const noRelated: ReferenceEntry = {
      ...sampleEntry,
      relatedEntryIds: [],
    };
    const data = buildViewerPageData(noRelated, allEntries, "en");
    expect(data.relatedEntries).toEqual([]);
  });

  it("存在しない関連エントリIDは無視される", () => {
    const unknownRelated: ReferenceEntry = {
      ...sampleEntry,
      relatedEntryIds: ["nonexistent-id"],
    };
    const data = buildViewerPageData(unknownRelated, allEntries, "en");
    expect(data.relatedEntries).toEqual([]);
  });

  it("relatedQuestIdsを返す", () => {
    const entryWithQuests: ReferenceEntry = {
      ...sampleEntry,
      relatedQuestIds: ["prop-01", "prop-02"],
    };
    const data = buildViewerPageData(entryWithQuests, allEntries, "en");
    expect(data.relatedQuestIds).toEqual(["prop-01", "prop-02"]);
  });

  it("relatedQuestIdsがない場合は空配列を返す", () => {
    const data = buildViewerPageData(sampleEntry, allEntries, "en");
    expect(data.relatedQuestIds).toEqual([]);
  });
});

// --- resolveEntryById ---

describe("resolveEntryById", () => {
  it("存在するIDのエントリを返す", () => {
    const entry = resolveEntryById(allEntries, "axiom-a1");
    expect(entry).toBe(sampleEntry);
  });

  it("存在しないIDはundefined", () => {
    const entry = resolveEntryById(allEntries, "nonexistent");
    expect(entry).toBeUndefined();
  });
});

// --- ナビゲーション用追加データ ---

const axiomA3: ReferenceEntry = {
  id: "axiom-a3",
  category: "axiom",
  title: { en: "Axiom A3", ja: "公理A3" },
  summary: { en: "Contraposition axiom.", ja: "対偶の公理。" },
  body: { en: [], ja: [] },
  relatedEntryIds: [],
  externalLinks: [],
  keywords: [],
  order: 3,
};

const guideIntro: ReferenceEntry = {
  id: "guide-intro",
  category: "guide",
  title: { en: "Introduction", ja: "はじめに" },
  summary: { en: "Getting started.", ja: "はじめに。" },
  body: { en: [], ja: [] },
  relatedEntryIds: [],
  externalLinks: [],
  keywords: [],
  order: 1,
};

const navEntries: readonly ReferenceEntry[] = [
  guideIntro,
  sampleEntry, // axiom-a1, order:1
  relatedEntry1, // axiom-a2, order:2
  axiomA3, // axiom-a3, order:3
  relatedEntry2, // rule-mp, order:10
];

// --- buildCategoryNavigation ---

describe("buildCategoryNavigation", () => {
  it("中間エントリにはprevとnextがある", () => {
    const nav = buildCategoryNavigation(relatedEntry1, navEntries, "en");
    expect(nav.previous).toEqual({
      id: "axiom-a1",
      title: "Axiom A1",
      href: "/reference/axiom-a1",
    });
    expect(nav.next).toEqual({
      id: "axiom-a3",
      title: "Axiom A3",
      href: "/reference/axiom-a3",
    });
  });

  it("先頭エントリにはpreviousがない", () => {
    const nav = buildCategoryNavigation(sampleEntry, navEntries, "en");
    expect(nav.previous).toBeUndefined();
    expect(nav.next).toEqual({
      id: "axiom-a2",
      title: "Axiom A2",
      href: "/reference/axiom-a2",
    });
  });

  it("末尾エントリにはnextがない", () => {
    const nav = buildCategoryNavigation(axiomA3, navEntries, "en");
    expect(nav.previous).toEqual({
      id: "axiom-a2",
      title: "Axiom A2",
      href: "/reference/axiom-a2",
    });
    expect(nav.next).toBeUndefined();
  });

  it("カテゴリに1つしかないエントリにはprev/nextがない", () => {
    const nav = buildCategoryNavigation(relatedEntry2, navEntries, "en");
    expect(nav.previous).toBeUndefined();
    expect(nav.next).toBeUndefined();
  });

  it("日本語のタイトルを返す", () => {
    const nav = buildCategoryNavigation(relatedEntry1, navEntries, "ja");
    expect(nav.previous?.title).toBe("公理A1");
    expect(nav.next?.title).toBe("公理A3");
  });
});

// --- buildGlobalNavigation ---

describe("buildGlobalNavigation", () => {
  const categoryOrder = [
    "guide",
    "axiom",
    "inference-rule",
    "logic-system",
    "notation",
    "concept",
    "theory",
  ] as const;

  it("カテゴリ内の中間エントリにはprevとnextがある", () => {
    const nav = buildGlobalNavigation(
      relatedEntry1,
      navEntries,
      categoryOrder,
      "en",
    );
    expect(nav.previous).toEqual({
      id: "axiom-a1",
      title: "Axiom A1",
      href: "/reference/axiom-a1",
    });
    expect(nav.next).toEqual({
      id: "axiom-a3",
      title: "Axiom A3",
      href: "/reference/axiom-a3",
    });
  });

  it("カテゴリ境界を跨いでナビゲーションする", () => {
    // guide-intro (guide) → axiom-a1 (axiom)
    const nav = buildGlobalNavigation(
      guideIntro,
      navEntries,
      categoryOrder,
      "en",
    );
    expect(nav.previous).toBeUndefined();
    expect(nav.next).toEqual({
      id: "axiom-a1",
      title: "Axiom A1",
      href: "/reference/axiom-a1",
    });
  });

  it("先頭カテゴリの先頭エントリにはpreviousがない", () => {
    const nav = buildGlobalNavigation(
      guideIntro,
      navEntries,
      categoryOrder,
      "en",
    );
    expect(nav.previous).toBeUndefined();
  });

  it("末尾カテゴリの末尾エントリにはnextがない", () => {
    const nav = buildGlobalNavigation(
      relatedEntry2,
      navEntries,
      categoryOrder,
      "en",
    );
    expect(nav.next).toBeUndefined();
    expect(nav.previous).toEqual({
      id: "axiom-a3",
      title: "Axiom A3",
      href: "/reference/axiom-a3",
    });
  });

  it("カテゴリ末尾からnextで次のカテゴリ先頭に遷移する", () => {
    const nav = buildGlobalNavigation(
      axiomA3,
      navEntries,
      categoryOrder,
      "en",
    );
    expect(nav.next).toEqual({
      id: "rule-mp",
      title: "Modus Ponens",
      href: "/reference/rule-mp",
    });
  });

  it("日本語のタイトルを返す", () => {
    const nav = buildGlobalNavigation(
      guideIntro,
      navEntries,
      categoryOrder,
      "ja",
    );
    expect(nav.next?.title).toBe("公理A1");
  });
});
