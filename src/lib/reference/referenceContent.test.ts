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
    // 公理13 + 推論規則9 + 論理体系5 + 概念3 + 理論2 = 32
    expect(allReferenceEntries).toHaveLength(32);
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
  const ruleIds = [
    "rule-mp",
    "rule-gen",
    "rule-nd-overview",
    "rule-nd-implication",
    "rule-nd-conjunction",
    "rule-nd-disjunction",
    "rule-sc-overview",
    "rule-sc-structural",
    "rule-sc-logical",
  ];

  it("全推論規則エントリが存在する", () => {
    for (const id of ruleIds) {
      const entry = findEntryById(allReferenceEntries, id);
      expect(entry).toBeDefined();
      expect(entry?.category).toBe("inference-rule");
    }
  });

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

  it("自然演繹の概要エントリにNM/NJ/NKの記載がある", () => {
    const entry = findEntryById(allReferenceEntries, "rule-nd-overview");
    expect(entry?.body.en.some((p) => p.includes("NM"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("NJ"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("NK"))).toBe(true);
  });

  it("自然演繹の含意規則に→I/→Eが記載されている", () => {
    const entry = findEntryById(allReferenceEntries, "rule-nd-implication");
    expect(entry?.body.en.some((p) => p.includes("→I"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("→E"))).toBe(true);
    expect(entry?.formalNotation).toBeTruthy();
  });

  it("自然演繹の連言規則に∧I/∧Eが記載されている", () => {
    const entry = findEntryById(allReferenceEntries, "rule-nd-conjunction");
    expect(entry?.body.en.some((p) => p.includes("∧I"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("∧E"))).toBe(true);
    expect(entry?.formalNotation).toBeTruthy();
  });

  it("自然演繹の選言規則に∨I/∨Eが記載されている", () => {
    const entry = findEntryById(allReferenceEntries, "rule-nd-disjunction");
    expect(entry?.body.en.some((p) => p.includes("∨I"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("∨E"))).toBe(true);
    expect(entry?.formalNotation).toBeTruthy();
  });

  it("シーケント計算の概要にLM/LJ/LKの記載がある", () => {
    const entry = findEntryById(allReferenceEntries, "rule-sc-overview");
    expect(entry?.body.en.some((p) => p.includes("LM"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("LJ"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("LK"))).toBe(true);
  });

  it("シーケント計算の概要にカット除去定理が記載されている", () => {
    const entry = findEntryById(allReferenceEntries, "rule-sc-overview");
    expect(entry?.body.en.some((p) => p.includes("cut elimination"))).toBe(
      true,
    );
    expect(entry?.body.ja.some((p) => p.includes("カット除去"))).toBe(true);
  });

  it("構造規則にカット・弱化・縮約・交換が記載されている", () => {
    const entry = findEntryById(allReferenceEntries, "rule-sc-structural");
    expect(entry?.body.en.some((p) => p.includes("Cut"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("Weakening"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("Contraction"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("Exchange"))).toBe(true);
    expect(entry?.formalNotation).toBeTruthy();
  });

  it("論理規則に全結合子の記載がある", () => {
    const entry = findEntryById(allReferenceEntries, "rule-sc-logical");
    expect(entry?.body.en.some((p) => p.includes("Implication"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("Conjunction"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("Disjunction"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("Universal"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("Existential"))).toBe(true);
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

  it("Łukasiewicz体系にA1, A2, A3, MPへの言及がある", () => {
    const entry = findEntryById(allReferenceEntries, "system-lukasiewicz");
    expect(entry?.body.en.some((p) => p.includes("A1"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("A2"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("A3"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("Modus Ponens"))).toBe(true);
  });

  it("Łukasiewicz体系に健全性・完全性の記載がある", () => {
    const entry = findEntryById(allReferenceEntries, "system-lukasiewicz");
    expect(entry?.body.en.some((p) => p.includes("sound and complete"))).toBe(
      true,
    );
    expect(entry?.body.ja.some((p) => p.includes("健全かつ完全"))).toBe(true);
  });

  it("Łukasiewicz体系に他の結合子の定義が記載されている", () => {
    const entry = findEntryById(allReferenceEntries, "system-lukasiewicz");
    expect(entry?.body.en.some((p) => p.includes("≡"))).toBe(true);
  });

  it("Łukasiewicz体系にアプリ内での拡張方法が記載されている", () => {
    const entry = findEntryById(allReferenceEntries, "system-lukasiewicz");
    expect(
      entry?.body.en.some((p) => p.includes("predicate logic axioms")),
    ).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("equality axioms"))).toBe(
      true,
    );
    expect(entry?.body.ja.some((p) => p.includes("述語論理公理"))).toBe(true);
  });

  it("Mendelson体系にM3とA3の互換性の記載がある", () => {
    const entry = findEntryById(allReferenceEntries, "system-mendelson");
    expect(entry?.body.en.some((p) => p.includes("interderivable"))).toBe(true);
    expect(entry?.body.ja.some((p) => p.includes("相互導出可能"))).toBe(true);
  });

  it("Mendelson体系にŁukasiewiczとの比較がある", () => {
    const entry = findEntryById(allReferenceEntries, "system-mendelson");
    expect(entry?.body.en.some((p) => p.includes("Comparison"))).toBe(true);
    expect(entry?.body.ja.some((p) => p.includes("比較"))).toBe(true);
  });

  it("最小論理にNM/LMへの対応が記載されている", () => {
    const entry = findEntryById(allReferenceEntries, "system-minimal");
    expect(entry?.body.en.some((p) => p.includes("NM"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("LM"))).toBe(true);
    expect(entry?.body.ja.some((p) => p.includes("NM"))).toBe(true);
    expect(entry?.body.ja.some((p) => p.includes("LM"))).toBe(true);
  });

  it("最小論理にCurry-Howard対応の記載がある", () => {
    const entry = findEntryById(allReferenceEntries, "system-minimal");
    expect(entry?.body.en.some((p) => p.includes("Curry-Howard"))).toBe(true);
    expect(entry?.body.ja.some((p) => p.includes("Curry-Howard"))).toBe(true);
  });

  it("最小論理に体系の階層が記載されている", () => {
    const entry = findEntryById(allReferenceEntries, "system-minimal");
    expect(entry?.body.en.some((p) => p.includes("⊂"))).toBe(true);
    expect(entry?.body.ja.some((p) => p.includes("⊂"))).toBe(true);
  });

  it("直観主義論理にBHK解釈の記載がある", () => {
    const entry = findEntryById(allReferenceEntries, "system-intuitionistic");
    expect(entry?.body.en.some((p) => p.includes("BHK"))).toBe(true);
    expect(entry?.body.ja.some((p) => p.includes("BHK"))).toBe(true);
  });

  it("直観主義論理にNJ/LJへの対応が記載されている", () => {
    const entry = findEntryById(allReferenceEntries, "system-intuitionistic");
    expect(entry?.body.en.some((p) => p.includes("NJ"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("LJ"))).toBe(true);
    expect(entry?.body.ja.some((p) => p.includes("NJ"))).toBe(true);
    expect(entry?.body.ja.some((p) => p.includes("LJ"))).toBe(true);
  });

  it("直観主義論理にHeyting算術の記載がある", () => {
    const entry = findEntryById(allReferenceEntries, "system-intuitionistic");
    expect(entry?.body.en.some((p) => p.includes("Heyting Arithmetic"))).toBe(
      true,
    );
    expect(entry?.body.ja.some((p) => p.includes("ヘイティング算術"))).toBe(
      true,
    );
  });

  it("直観主義論理にEFQの記載がある", () => {
    const entry = findEntryById(allReferenceEntries, "system-intuitionistic");
    expect(entry?.body.en.some((p) => p.includes("ex falso quodlibet"))).toBe(
      true,
    );
    expect(entry?.body.ja.some((p) => p.includes("爆発律"))).toBe(true);
  });

  it("古典論理にNK/LKへの対応が記載されている", () => {
    const entry = findEntryById(allReferenceEntries, "system-classical");
    expect(entry?.body.en.some((p) => p.includes("NK"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("LK"))).toBe(true);
    expect(entry?.body.ja.some((p) => p.includes("NK"))).toBe(true);
    expect(entry?.body.ja.some((p) => p.includes("LK"))).toBe(true);
  });

  it("古典論理に複数の同値な定式化が記載されている", () => {
    const entry = findEntryById(allReferenceEntries, "system-classical");
    expect(entry?.body.en.some((p) => p.includes("A3"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("M3"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("DNE"))).toBe(true);
    expect(entry?.body.en.some((p) => p.includes("excluded middle"))).toBe(
      true,
    );
    expect(entry?.body.en.some((p) => p.includes("Peirce"))).toBe(true);
  });

  it("古典論理に完全性定理の記載がある", () => {
    const entry = findEntryById(allReferenceEntries, "system-classical");
    expect(entry?.body.en.some((p) => p.includes("completeness theorem"))).toBe(
      true,
    );
    expect(entry?.body.ja.some((p) => p.includes("完全性定理"))).toBe(true);
  });

  it("古典論理に体系の階層が記載されている", () => {
    const entry = findEntryById(allReferenceEntries, "system-classical");
    expect(entry?.body.en.some((p) => p.includes("⊂"))).toBe(true);
    expect(entry?.body.ja.some((p) => p.includes("⊂"))).toBe(true);
  });

  it("古典論理に二値性の記載がある", () => {
    const entry = findEntryById(allReferenceEntries, "system-classical");
    expect(entry?.body.en.some((p) => p.includes("bivalence"))).toBe(true);
    expect(entry?.body.ja.some((p) => p.includes("二値性"))).toBe(true);
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

  it("自然演繹を検索できる", () => {
    const resultEn = searchEntries(
      allReferenceEntries,
      "natural deduction",
      "en",
    );
    expect(resultEn.some((e) => e.id === "rule-nd-overview")).toBe(true);
    const resultJa = searchEntries(allReferenceEntries, "自然演繹", "ja");
    expect(resultJa.some((e) => e.id === "rule-nd-overview")).toBe(true);
  });

  it("シーケント計算を検索できる", () => {
    const resultEn = searchEntries(
      allReferenceEntries,
      "sequent calculus",
      "en",
    );
    expect(resultEn.some((e) => e.id === "rule-sc-overview")).toBe(true);
    const resultJa = searchEntries(allReferenceEntries, "シーケント計算", "ja");
    expect(resultJa.some((e) => e.id === "rule-sc-overview")).toBe(true);
  });

  it("カット除去を検索できる", () => {
    const result = searchEntries(allReferenceEntries, "カット除去", "ja");
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});
