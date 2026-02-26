import { describe, expect, it } from "vitest";
import { allReferenceEntries } from "./referenceContent";
import {
  allCategories,
  allLocales,
  filterByCategory,
  findEntryById,
  searchEntries,
  validateUniqueIds,
} from "./referenceEntry";
import type { Locale, ReferenceEntry } from "./referenceEntry";

describe("allReferenceEntries", () => {
  it("すべてのエントリIDが一意である", () => {
    expect(validateUniqueIds(allReferenceEntries)).toBe(true);
  });

  it("エントリ数が期待通り", () => {
    // 公理11 + 推論規則2 + 論理体系5 + 概念3 + 理論2 = 23
    expect(allReferenceEntries).toHaveLength(23);
  });

  it("少なくとも1つのエントリが各カテゴリに存在する", () => {
    const usedCategories = [
      "axiom",
      "inference-rule",
      "logic-system",
      "concept",
      "theory",
    ] as const;
    for (const category of usedCategories) {
      const entries = filterByCategory(allReferenceEntries, category);
      expect(entries.length).toBeGreaterThan(0);
    }
  });
});

describe("多言語テキストの完全性", () => {
  it.each(allReferenceEntries.map((e) => [e.id, e]))(
    "%s: title が全ロケールで非空",
    (_id, entry) => {
      const e = entry as ReferenceEntry;
      for (const locale of allLocales) {
        expect(e.title[locale]).toBeTruthy();
      }
    },
  );

  it.each(allReferenceEntries.map((e) => [e.id, e]))(
    "%s: summary が全ロケールで非空",
    (_id, entry) => {
      const e = entry as ReferenceEntry;
      for (const locale of allLocales) {
        expect(e.summary[locale]).toBeTruthy();
      }
    },
  );

  it.each(allReferenceEntries.map((e) => [e.id, e]))(
    "%s: body が全ロケールでパラグラフを持つ",
    (_id, entry) => {
      const e = entry as ReferenceEntry;
      for (const locale of allLocales) {
        expect(e.body[locale].length).toBeGreaterThan(0);
        for (const paragraph of e.body[locale]) {
          expect(paragraph).toBeTruthy();
        }
      }
    },
  );

  it.each(allReferenceEntries.map((e) => [e.id, e]))(
    "%s: en/ja の body パラグラフ数が同じ",
    (_id, entry) => {
      const e = entry as ReferenceEntry;
      expect(e.body.en.length).toBe(e.body.ja.length);
    },
  );
});

describe("外部リンクの整合性", () => {
  it.each(allReferenceEntries.map((e) => [e.id, e]))(
    "%s: 外部リンクのURLが有効な形式",
    (_id, entry) => {
      const e = entry as ReferenceEntry;
      for (const link of e.externalLinks) {
        expect(link.url).toMatch(/^https?:\/\//);
        expect(link.label.en).toBeTruthy();
        expect(link.label.ja).toBeTruthy();
      }
    },
  );
});

describe("関連エントリの整合性", () => {
  const allIds = new Set(allReferenceEntries.map((e) => e.id));

  it.each(allReferenceEntries.map((e) => [e.id, e]))(
    "%s: 関連エントリIDがすべて存在する",
    (_id, entry) => {
      const e = entry as ReferenceEntry;
      for (const relatedId of e.relatedEntryIds) {
        expect(allIds.has(relatedId)).toBe(true);
      }
    },
  );

  it.each(allReferenceEntries.map((e) => [e.id, e]))(
    "%s: 自分自身を関連エントリに含まない",
    (_id, entry) => {
      const e = entry as ReferenceEntry;
      expect(e.relatedEntryIds).not.toContain(e.id);
    },
  );
});

describe("公理エントリの個別チェック", () => {
  const axiomIds = [
    "axiom-a1",
    "axiom-a2",
    "axiom-a3",
    "axiom-m3",
    "axiom-efq",
    "axiom-dne",
    "axiom-a4",
    "axiom-a5",
    "axiom-e1",
    "axiom-e2",
    "axiom-e3",
  ];

  it("全公理エントリが存在する", () => {
    for (const id of axiomIds) {
      const entry = findEntryById(allReferenceEntries, id);
      expect(entry).toBeDefined();
      expect(entry?.category).toBe("axiom");
    }
  });

  it("公理エントリには formalNotation がある", () => {
    for (const id of axiomIds) {
      const entry = findEntryById(allReferenceEntries, id);
      expect(entry?.formalNotation).toBeTruthy();
    }
  });
});

describe("推論規則エントリの個別チェック", () => {
  it("MP エントリが存在する", () => {
    const entry = findEntryById(allReferenceEntries, "rule-mp");
    expect(entry).toBeDefined();
    expect(entry?.category).toBe("inference-rule");
    expect(entry?.formalNotation).toBeTruthy();
  });

  it("Gen エントリが存在する", () => {
    const entry = findEntryById(allReferenceEntries, "rule-gen");
    expect(entry).toBeDefined();
    expect(entry?.category).toBe("inference-rule");
    expect(entry?.formalNotation).toBeTruthy();
  });
});

describe("論理体系エントリの個別チェック", () => {
  const systemIds = [
    "system-lukasiewicz",
    "system-mendelson",
    "system-minimal",
    "system-intuitionistic",
    "system-classical",
  ];

  it("全論理体系エントリが存在する", () => {
    for (const id of systemIds) {
      const entry = findEntryById(allReferenceEntries, id);
      expect(entry).toBeDefined();
      expect(entry?.category).toBe("logic-system");
    }
  });
});

describe("検索の動作確認", () => {
  it("英語で公理を検索できる", () => {
    const result = searchEntries(allReferenceEntries, "axiom", "en");
    expect(result.length).toBeGreaterThan(0);
  });

  it("日本語で公理を検索できる", () => {
    const result = searchEntries(allReferenceEntries, "公理", "ja");
    expect(result.length).toBeGreaterThan(0);
  });

  it("キーワードで検索できる", () => {
    const result = searchEntries(allReferenceEntries, "Łukasiewicz", "en");
    expect(result.length).toBeGreaterThan(0);
  });

  it("MPをキーワードで検索できる", () => {
    const result = searchEntries(allReferenceEntries, "modus ponens", "en");
    expect(result.length).toBeGreaterThanOrEqual(1);
    // rule-mpが含まれている
    expect(result.some((e) => e.id === "rule-mp")).toBe(true);
  });

  it("各ロケールでの検索が動作する", () => {
    for (const locale of allLocales) {
      const result = searchEntries(allReferenceEntries, "A1", locale as Locale);
      expect(result.length).toBeGreaterThan(0);
    }
  });
});
