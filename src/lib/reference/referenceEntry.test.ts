import { describe, expect, it } from "vitest";
import {
  allCategories,
  allLocales,
  categoryMetas,
  filterByCategories,
  filterByCategory,
  findCategoryMeta,
  findEntryById,
  getLocalizedParagraphs,
  getLocalizedText,
  getRelatedEntries,
  groupByCategory,
  searchEntries,
  sortByOrder,
  validateUniqueIds,
} from "./referenceEntry";
import type { ReferenceEntry } from "./referenceEntry";

// --- テスト用データ ---

const sampleEntry1: ReferenceEntry = {
  id: "axiom-a1",
  category: "axiom",
  title: { en: "Axiom A1 (K)", ja: "公理 A1 (K)" },
  summary: {
    en: "The K axiom: φ → (ψ → φ)",
    ja: "K公理: φ → (ψ → φ)",
  },
  body: {
    en: [
      "Axiom A1, also known as the K combinator axiom.",
      "It states that a true proposition remains true regardless of another proposition.",
    ],
    ja: [
      "公理A1は、Kコンビネータ公理とも呼ばれます。",
      "真である命題は、他の命題に関わらず真であることを述べます。",
    ],
  },
  formalNotation: "\\varphi \\to (\\psi \\to \\varphi)",
  relatedEntryIds: ["axiom-a2", "rule-mp"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Hilbert_system",
      label: { en: "Hilbert system", ja: "ヒルベルト体系" },
      documentLanguage: "en",
    },
  ],
  keywords: ["K", "K axiom", "weakening"],
  order: 1,
};

const sampleEntry2: ReferenceEntry = {
  id: "axiom-a2",
  category: "axiom",
  title: { en: "Axiom A2 (S)", ja: "公理 A2 (S)" },
  summary: {
    en: "The S axiom: (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))",
    ja: "S公理: (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))",
  },
  body: {
    en: [
      "Axiom A2, also known as the S combinator axiom.",
      "It distributes implication over itself.",
    ],
    ja: [
      "公理A2は、Sコンビネータ公理とも呼ばれます。",
      "含意を自身に分配します。",
    ],
  },
  formalNotation:
    "(\\varphi \\to (\\psi \\to \\chi)) \\to ((\\varphi \\to \\psi) \\to (\\varphi \\to \\chi))",
  relatedEntryIds: ["axiom-a1", "rule-mp"],
  externalLinks: [],
  keywords: ["S", "S axiom", "distribution"],
  order: 2,
};

const sampleEntry3: ReferenceEntry = {
  id: "rule-mp",
  category: "inference-rule",
  title: { en: "Modus Ponens (MP)", ja: "モーダスポネンス (MP)" },
  summary: {
    en: "From φ and φ → ψ, derive ψ.",
    ja: "φ と φ → ψ から ψ を導出する。",
  },
  body: {
    en: [
      "Modus ponens is the fundamental inference rule.",
      "If we know φ is true, and φ implies ψ, then ψ must be true.",
    ],
    ja: [
      "モーダスポネンスは基本的な推論規則です。",
      "φが真であり、φがψを含意するなら、ψは真でなければなりません。",
    ],
  },
  relatedEntryIds: ["axiom-a1", "axiom-a2"],
  externalLinks: [],
  keywords: ["modus ponens", "MP", "detachment"],
  order: 1,
};

const sampleEntry4: ReferenceEntry = {
  id: "system-lukasiewicz",
  category: "logic-system",
  title: { en: "Łukasiewicz System", ja: "ウカシェヴィチ体系" },
  summary: {
    en: "A classical propositional logic system with A1, A2, A3 + MP.",
    ja: "A1, A2, A3 + MP による古典命題論理体系。",
  },
  body: {
    en: ["The Łukasiewicz system uses the contraposition axiom A3."],
    ja: ["ウカシェヴィチ体系は対偶公理A3を使用します。"],
  },
  relatedEntryIds: ["axiom-a1", "axiom-a2"],
  externalLinks: [],
  keywords: ["Łukasiewicz", "classical", "propositional"],
  order: 1,
};

const allSamples: readonly ReferenceEntry[] = [
  sampleEntry1,
  sampleEntry2,
  sampleEntry3,
  sampleEntry4,
];

// --- テスト ---

describe("LocalizedText", () => {
  it("英語テキストを取得できる", () => {
    expect(getLocalizedText(sampleEntry1.title, "en")).toBe("Axiom A1 (K)");
  });

  it("日本語テキストを取得できる", () => {
    expect(getLocalizedText(sampleEntry1.title, "ja")).toBe("公理 A1 (K)");
  });
});

describe("LocalizedParagraphs", () => {
  it("英語パラグラフを取得できる", () => {
    const paragraphs = getLocalizedParagraphs(sampleEntry1.body, "en");
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toContain("K combinator");
  });

  it("日本語パラグラフを取得できる", () => {
    const paragraphs = getLocalizedParagraphs(sampleEntry1.body, "ja");
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toContain("Kコンビネータ");
  });
});

describe("allLocales", () => {
  it("en と ja を含む", () => {
    expect(allLocales).toContain("en");
    expect(allLocales).toContain("ja");
    expect(allLocales).toHaveLength(2);
  });
});

describe("allCategories", () => {
  it("全カテゴリを含む", () => {
    expect(allCategories).toContain("axiom");
    expect(allCategories).toContain("inference-rule");
    expect(allCategories).toContain("logic-system");
    expect(allCategories).toContain("notation");
    expect(allCategories).toContain("concept");
    expect(allCategories).toContain("theory");
    expect(allCategories).toHaveLength(6);
  });
});

describe("categoryMetas", () => {
  it("全カテゴリのメタデータが定義されている", () => {
    for (const category of allCategories) {
      const meta = categoryMetas.find((m) => m.id === category);
      expect(meta).toBeDefined();
      expect(meta?.label.en).toBeTruthy();
      expect(meta?.label.ja).toBeTruthy();
      expect(meta?.description.en).toBeTruthy();
      expect(meta?.description.ja).toBeTruthy();
    }
  });
});

describe("findCategoryMeta", () => {
  it("存在するカテゴリのメタデータを返す", () => {
    const meta = findCategoryMeta("axiom");
    expect(meta).toBeDefined();
    expect(meta?.label.en).toBe("Axioms");
    expect(meta?.label.ja).toBe("公理");
  });
});

describe("filterByCategory", () => {
  it("指定カテゴリのエントリのみ返す", () => {
    const axioms = filterByCategory(allSamples, "axiom");
    expect(axioms).toHaveLength(2);
    expect(axioms.every((e) => e.category === "axiom")).toBe(true);
  });

  it("inference-ruleカテゴリのエントリを返す", () => {
    const rules = filterByCategory(allSamples, "inference-rule");
    expect(rules).toHaveLength(1);
    expect(rules[0]?.id).toBe("rule-mp");
  });

  it("該当なしの場合は空配列を返す", () => {
    const notations = filterByCategory(allSamples, "notation");
    expect(notations).toHaveLength(0);
  });
});

describe("filterByCategories", () => {
  it("複数カテゴリでフィルタリングできる", () => {
    const result = filterByCategories(allSamples, ["axiom", "inference-rule"]);
    expect(result).toHaveLength(3);
  });

  it("空のカテゴリリストで空配列を返す", () => {
    const result = filterByCategories(allSamples, []);
    expect(result).toHaveLength(0);
  });
});

describe("searchEntries", () => {
  it("英語タイトルで検索できる", () => {
    const result = searchEntries(allSamples, "Axiom A1", "en");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("axiom-a1");
  });

  it("日本語タイトルで検索できる", () => {
    const result = searchEntries(allSamples, "公理 A1", "ja");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("axiom-a1");
  });

  it("summaryで検索できる", () => {
    const result = searchEntries(allSamples, "K axiom", "en");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("axiom-a1");
  });

  it("bodyで検索できる", () => {
    const result = searchEntries(allSamples, "fundamental inference", "en");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("rule-mp");
  });

  it("keywordsで検索できる", () => {
    const result = searchEntries(allSamples, "detachment", "en");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("rule-mp");
  });

  it("大文字小文字を区別しない", () => {
    const result = searchEntries(allSamples, "modus ponens", "en");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("rule-mp");
  });

  it("空クエリで全件返す", () => {
    const result = searchEntries(allSamples, "", "en");
    expect(result).toHaveLength(allSamples.length);
  });

  it("マッチなしで空配列を返す", () => {
    const result = searchEntries(allSamples, "nonexistent", "en");
    expect(result).toHaveLength(0);
  });

  it("複数マッチを返す", () => {
    const result = searchEntries(allSamples, "axiom", "en");
    expect(result.length).toBeGreaterThan(1);
  });
});

describe("groupByCategory", () => {
  it("カテゴリごとにグループ化できる", () => {
    const groups = groupByCategory(allSamples);
    expect(groups.get("axiom")).toHaveLength(2);
    expect(groups.get("inference-rule")).toHaveLength(1);
    expect(groups.get("logic-system")).toHaveLength(1);
    expect(groups.has("notation")).toBe(false);
  });
});

describe("sortByOrder", () => {
  it("order順にソートする", () => {
    const reversed = [...allSamples].reverse();
    const sorted = sortByOrder(reversed);
    // axiomカテゴリ内ではorder: 1, 2の順
    const axioms = sorted.filter((e) => e.category === "axiom");
    expect(axioms[0]?.id).toBe("axiom-a1");
    expect(axioms[1]?.id).toBe("axiom-a2");
  });

  it("元配列を変更しない", () => {
    const original = [...allSamples];
    sortByOrder(allSamples);
    expect(allSamples).toEqual(original);
  });
});

describe("findEntryById", () => {
  it("存在するIDのエントリを返す", () => {
    const entry = findEntryById(allSamples, "axiom-a1");
    expect(entry).toBeDefined();
    expect(entry?.id).toBe("axiom-a1");
  });

  it("存在しないIDでundefinedを返す", () => {
    const entry = findEntryById(allSamples, "nonexistent");
    expect(entry).toBeUndefined();
  });
});

describe("getRelatedEntries", () => {
  it("関連エントリを取得できる", () => {
    const related = getRelatedEntries(allSamples, sampleEntry1);
    expect(related).toHaveLength(2);
    const relatedIds = related.map((e) => e.id);
    expect(relatedIds).toContain("axiom-a2");
    expect(relatedIds).toContain("rule-mp");
  });

  it("関連エントリがallEntriesに含まれない場合は除外される", () => {
    const partial = [sampleEntry1, sampleEntry2];
    const related = getRelatedEntries(partial, sampleEntry1);
    expect(related).toHaveLength(1);
    expect(related[0]?.id).toBe("axiom-a2");
  });

  it("関連エントリが空の場合は空配列を返す", () => {
    const entryWithNoRelated: ReferenceEntry = {
      ...sampleEntry1,
      relatedEntryIds: [],
    };
    const related = getRelatedEntries(allSamples, entryWithNoRelated);
    expect(related).toHaveLength(0);
  });
});

describe("validateUniqueIds", () => {
  it("ユニークなIDの場合trueを返す", () => {
    expect(validateUniqueIds(allSamples)).toBe(true);
  });

  it("重複IDの場合falseを返す", () => {
    const duplicated = [...allSamples, sampleEntry1];
    expect(validateUniqueIds(duplicated)).toBe(false);
  });

  it("空配列の場合trueを返す", () => {
    expect(validateUniqueIds([])).toBe(true);
  });
});
