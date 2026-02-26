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
    // 公理13 + 推論規則2 + 論理体系5 + 概念3 + 理論2 = 25
    expect(allReferenceEntries).toHaveLength(25);
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
    "axiom-e4",
    "axiom-e5",
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

describe("等号公理E4/E5の個別チェック", () => {
  it("E4 (Function Congruence) エントリが存在する", () => {
    const entry = findEntryById(allReferenceEntries, "axiom-e4");
    expect(entry).toBeDefined();
    expect(entry?.category).toBe("axiom");
    expect(entry?.formalNotation).toBeTruthy();
    expect(entry?.keywords).toContain("E4");
  });

  it("E5 (Predicate Congruence) エントリが存在する", () => {
    const entry = findEntryById(allReferenceEntries, "axiom-e5");
    expect(entry).toBeDefined();
    expect(entry?.category).toBe("axiom");
    expect(entry?.formalNotation).toBeTruthy();
    expect(entry?.keywords).toContain("E5");
  });

  it("E4の解説にスキーマ族であることが記載されている", () => {
    const entry = findEntryById(allReferenceEntries, "axiom-e4");
    expect(entry?.body.en.some((p) => p.includes("schema family"))).toBe(true);
    expect(entry?.body.ja.some((p) => p.includes("スキーマ族"))).toBe(true);
  });

  it("E5の解説にライプニッツ原理が記載されている", () => {
    const entry = findEntryById(allReferenceEntries, "axiom-e5");
    expect(entry?.body.en.some((p) => p.includes("Leibniz"))).toBe(true);
    expect(entry?.body.ja.some((p) => p.includes("ライプニッツ"))).toBe(true);
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

  it("合同律をキーワードで検索できる", () => {
    const result = searchEntries(allReferenceEntries, "congruence", "en");
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.some((e) => e.id === "axiom-e4")).toBe(true);
    expect(result.some((e) => e.id === "axiom-e5")).toBe(true);
  });

  it("日本語で合同律を検索できる", () => {
    const result = searchEntries(allReferenceEntries, "合同律", "ja");
    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});
