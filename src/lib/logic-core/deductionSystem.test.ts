import { describe, it, expect } from "vitest";
import {
  type DeductionStyle,
  type DeductionSystem,
  nmSystem,
  njSystem,
  nkSystem,
  lmSystem,
  ljSystem,
  lkSystem,
  tabSystem,
  tabPropSystem,
  atSystem,
  atPropSystem,
  hilbertDeduction,
  naturalDeduction,
  sequentCalculusDeduction,
  tableauCalculusDeduction,
  analyticTableauDeduction,
  getDeductionSystemName,
  getDeductionStyleLabel,
  isNdRuleEnabled,
  allNdRuleIds,
  getNdRuleDisplayName,
  isScRuleEnabled,
  allScRuleIds,
  getScRuleDisplayName,
  isTabRuleEnabled,
  isAtRuleEnabled,
} from "./deductionSystem";
import { allTabRuleIds } from "./tableauCalculus";
import { minimalLogicSystem, classicalLogicSystem } from "./inferenceRule";

// ── NM/NJ/NK体系のテスト ───────────────────────────────────

describe("NM (最小論理)", () => {
  it("名前が正しい", () => {
    expect(nmSystem.name).toBe("Natural Deduction NM");
  });

  it("基本規則13種を含む", () => {
    expect(nmSystem.rules.size).toBe(13);
  });

  it("→I, →E を含む", () => {
    expect(nmSystem.rules.has("implication-intro")).toBe(true);
    expect(nmSystem.rules.has("implication-elim")).toBe(true);
  });

  it("∧I, ∧E_L, ∧E_R を含む", () => {
    expect(nmSystem.rules.has("conjunction-intro")).toBe(true);
    expect(nmSystem.rules.has("conjunction-elim-left")).toBe(true);
    expect(nmSystem.rules.has("conjunction-elim-right")).toBe(true);
  });

  it("∨I_L, ∨I_R, ∨E を含む", () => {
    expect(nmSystem.rules.has("disjunction-intro-left")).toBe(true);
    expect(nmSystem.rules.has("disjunction-intro-right")).toBe(true);
    expect(nmSystem.rules.has("disjunction-elim")).toBe(true);
  });

  it("弱化を含む", () => {
    expect(nmSystem.rules.has("weakening")).toBe(true);
  });

  it("∀I, ∀E, ∃I, ∃E を含む", () => {
    expect(nmSystem.rules.has("universal-intro")).toBe(true);
    expect(nmSystem.rules.has("universal-elim")).toBe(true);
    expect(nmSystem.rules.has("existential-intro")).toBe(true);
    expect(nmSystem.rules.has("existential-elim")).toBe(true);
  });

  it("EFQを含まない", () => {
    expect(nmSystem.rules.has("efq")).toBe(false);
  });

  it("DNEを含まない", () => {
    expect(nmSystem.rules.has("dne")).toBe(false);
  });
});

describe("NJ (直観主義論理)", () => {
  it("名前が正しい", () => {
    expect(njSystem.name).toBe("Natural Deduction NJ");
  });

  it("NMの基本規則 + EFQ = 14種", () => {
    expect(njSystem.rules.size).toBe(14);
  });

  it("EFQを含む", () => {
    expect(njSystem.rules.has("efq")).toBe(true);
  });

  it("DNEを含まない", () => {
    expect(njSystem.rules.has("dne")).toBe(false);
  });

  it("NMの基本規則をすべて含む", () => {
    for (const rule of nmSystem.rules) {
      expect(njSystem.rules.has(rule)).toBe(true);
    }
  });
});

describe("NK (古典論理)", () => {
  it("名前が正しい", () => {
    expect(nkSystem.name).toBe("Natural Deduction NK");
  });

  it("NMの基本規則 + DNE = 14種", () => {
    expect(nkSystem.rules.size).toBe(14);
  });

  it("DNEを含む", () => {
    expect(nkSystem.rules.has("dne")).toBe(true);
  });

  it("EFQを含まない（NKではEFQは証明可能だが規則としては不要）", () => {
    expect(nkSystem.rules.has("efq")).toBe(false);
  });

  it("NMの基本規則をすべて含む", () => {
    for (const rule of nmSystem.rules) {
      expect(nkSystem.rules.has(rule)).toBe(true);
    }
  });
});

// ── DeductionSystem（統一型）のテスト ────────────────────────

describe("DeductionSystem", () => {
  it("hilbertDeduction でHilbert流体系を作成できる", () => {
    const ds = hilbertDeduction(minimalLogicSystem);
    expect(ds.style).toBe("hilbert");
    expect(ds.system).toBe(minimalLogicSystem);
  });

  it("naturalDeduction で自然演繹体系を作成できる", () => {
    const ds = naturalDeduction(nmSystem);
    expect(ds.style).toBe("natural-deduction");
    expect(ds.system).toBe(nmSystem);
  });

  it("getDeductionSystemName でHilbert流の名前を取得できる", () => {
    const ds = hilbertDeduction(classicalLogicSystem);
    expect(getDeductionSystemName(ds)).toBe("Classical Logic (HK)");
  });

  it("getDeductionSystemName で自然演繹の名前を取得できる", () => {
    const ds = naturalDeduction(njSystem);
    expect(getDeductionSystemName(ds)).toBe("Natural Deduction NJ");
  });
});

// ── DeductionStyleのテスト ──────────────────────────────────

describe("getDeductionStyleLabel", () => {
  it("hilbert → Hilbert流", () => {
    expect(getDeductionStyleLabel("hilbert")).toBe("Hilbert流");
  });

  it("natural-deduction → 自然演繹", () => {
    expect(getDeductionStyleLabel("natural-deduction")).toBe("自然演繹");
  });

  it("tableau-calculus → タブロー法", () => {
    expect(getDeductionStyleLabel("tableau-calculus")).toBe("タブロー法");
  });

  it("analytic-tableau → 分析的タブロー", () => {
    expect(getDeductionStyleLabel("analytic-tableau")).toBe("分析的タブロー");
  });
});

// ── isNdRuleEnabled のテスト ────────────────────────────────

describe("isNdRuleEnabled", () => {
  it("NMでimplication-introは有効", () => {
    expect(isNdRuleEnabled(nmSystem, "implication-intro")).toBe(true);
  });

  it("NMでefqは無効", () => {
    expect(isNdRuleEnabled(nmSystem, "efq")).toBe(false);
  });

  it("NJでefqは有効", () => {
    expect(isNdRuleEnabled(njSystem, "efq")).toBe(true);
  });

  it("NKでdneは有効", () => {
    expect(isNdRuleEnabled(nkSystem, "dne")).toBe(true);
  });

  it("NKでefqは無効", () => {
    expect(isNdRuleEnabled(nkSystem, "efq")).toBe(false);
  });
});

// ── allNdRuleIds のテスト ───────────────────────────────────

describe("allNdRuleIds", () => {
  it("15種の規則IDを含む", () => {
    expect(allNdRuleIds).toHaveLength(15);
  });

  it("重複がない", () => {
    const unique = new Set(allNdRuleIds);
    expect(unique.size).toBe(allNdRuleIds.length);
  });

  it("NMの全規則を含む", () => {
    for (const rule of nmSystem.rules) {
      expect(allNdRuleIds).toContain(rule);
    }
  });

  it("efq と dne を含む", () => {
    expect(allNdRuleIds).toContain("efq");
    expect(allNdRuleIds).toContain("dne");
  });
});

// ── getNdRuleDisplayName のテスト ────────────────────────────

describe("getNdRuleDisplayName", () => {
  it("全規則の表示名が空でない", () => {
    for (const ruleId of allNdRuleIds) {
      const name = getNdRuleDisplayName(ruleId);
      expect(name).not.toBe("");
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it("→導入の表示名", () => {
    expect(getNdRuleDisplayName("implication-intro")).toBe("→導入 (→I)");
  });

  it("→除去の表示名", () => {
    expect(getNdRuleDisplayName("implication-elim")).toBe("→除去 (→E)");
  });

  it("爆発律の表示名", () => {
    expect(getNdRuleDisplayName("efq")).toBe("爆発律 (EFQ)");
  });

  it("二重否定除去の表示名", () => {
    expect(getNdRuleDisplayName("dne")).toBe("二重否定除去 (DNE)");
  });

  it("弱化の表示名", () => {
    expect(getNdRuleDisplayName("weakening")).toBe("弱化 (w)");
  });

  it("∀導入の表示名", () => {
    expect(getNdRuleDisplayName("universal-intro")).toBe("∀導入 (∀I)");
  });

  it("∀除去の表示名", () => {
    expect(getNdRuleDisplayName("universal-elim")).toBe("∀除去 (∀E)");
  });

  it("∃導入の表示名", () => {
    expect(getNdRuleDisplayName("existential-intro")).toBe("∃導入 (∃I)");
  });

  it("∃除去の表示名", () => {
    expect(getNdRuleDisplayName("existential-elim")).toBe("∃除去 (∃E)");
  });
});

// ── LM/LJ/LK体系のテスト ──────────────────────────────────

describe("LM (シーケント計算・最小論理)", () => {
  it("名前が正しい", () => {
    expect(lmSystem.name).toBe("Sequent Calculus LM");
  });

  it("基本規則17種を含む", () => {
    expect(lmSystem.rules.size).toBe(17);
  });

  it("公理(ID)とカット(CUT)を含む", () => {
    expect(lmSystem.rules.has("identity")).toBe(true);
    expect(lmSystem.rules.has("cut")).toBe(true);
  });

  it("左構造規則を含む", () => {
    expect(lmSystem.rules.has("weakening-left")).toBe(true);
    expect(lmSystem.rules.has("contraction-left")).toBe(true);
    expect(lmSystem.rules.has("exchange-left")).toBe(true);
  });

  it("右構造規則(c⇒,e⇒)を含む", () => {
    expect(lmSystem.rules.has("contraction-right")).toBe(true);
    expect(lmSystem.rules.has("exchange-right")).toBe(true);
  });

  it("論理規則を含む", () => {
    expect(lmSystem.rules.has("implication-left")).toBe(true);
    expect(lmSystem.rules.has("implication-right")).toBe(true);
    expect(lmSystem.rules.has("conjunction-left")).toBe(true);
    expect(lmSystem.rules.has("conjunction-right")).toBe(true);
    expect(lmSystem.rules.has("disjunction-left")).toBe(true);
    expect(lmSystem.rules.has("disjunction-right")).toBe(true);
    expect(lmSystem.rules.has("universal-left")).toBe(true);
    expect(lmSystem.rules.has("universal-right")).toBe(true);
    expect(lmSystem.rules.has("existential-left")).toBe(true);
    expect(lmSystem.rules.has("existential-right")).toBe(true);
  });

  it("⊥公理を含まない", () => {
    expect(lmSystem.rules.has("bottom-left")).toBe(false);
  });

  it("右弱化を含まない", () => {
    expect(lmSystem.rules.has("weakening-right")).toBe(false);
  });

  it("右辺の最大長が1", () => {
    expect(lmSystem.maxSuccedentLength).toBe(1);
  });
});

describe("LJ (シーケント計算・直観主義論理)", () => {
  it("名前が正しい", () => {
    expect(ljSystem.name).toBe("Sequent Calculus LJ");
  });

  it("LMの基本規則 + ⊥公理 + 右弱化 = 19種", () => {
    expect(ljSystem.rules.size).toBe(19);
  });

  it("⊥公理を含む", () => {
    expect(ljSystem.rules.has("bottom-left")).toBe(true);
  });

  it("右弱化を含む", () => {
    expect(ljSystem.rules.has("weakening-right")).toBe(true);
  });

  it("LMの全規則を含む", () => {
    for (const rule of lmSystem.rules) {
      expect(ljSystem.rules.has(rule)).toBe(true);
    }
  });

  it("右辺の最大長が1", () => {
    expect(ljSystem.maxSuccedentLength).toBe(1);
  });
});

describe("LK (シーケント計算・古典論理)", () => {
  it("名前が正しい", () => {
    expect(lkSystem.name).toBe("Sequent Calculus LK");
  });

  it("LJと同じ19種の規則を含む", () => {
    expect(lkSystem.rules.size).toBe(19);
  });

  it("LJの全規則を含む", () => {
    for (const rule of ljSystem.rules) {
      expect(lkSystem.rules.has(rule)).toBe(true);
    }
  });

  it("右辺の最大長が制限なし(undefined)", () => {
    expect(lkSystem.maxSuccedentLength).toBeUndefined();
  });
});

// ── DeductionSystemのシーケント計算テスト ────────────────────

describe("DeductionSystem (sequent-calculus)", () => {
  it("sequentCalculusDeduction でシーケント計算体系を作成できる", () => {
    const ds = sequentCalculusDeduction(lmSystem);
    expect(ds.style).toBe("sequent-calculus");
    expect(ds.system).toBe(lmSystem);
  });

  it("getDeductionSystemName でシーケント計算の名前を取得できる", () => {
    const ds = sequentCalculusDeduction(ljSystem);
    expect(getDeductionSystemName(ds)).toBe("Sequent Calculus LJ");
  });
});

// ── isScRuleEnabled のテスト ────────────────────────────────

describe("isScRuleEnabled", () => {
  it("LMでidentityは有効", () => {
    expect(isScRuleEnabled(lmSystem, "identity")).toBe(true);
  });

  it("LMでbottom-leftは無効", () => {
    expect(isScRuleEnabled(lmSystem, "bottom-left")).toBe(false);
  });

  it("LMでweakening-rightは無効", () => {
    expect(isScRuleEnabled(lmSystem, "weakening-right")).toBe(false);
  });

  it("LJでbottom-leftは有効", () => {
    expect(isScRuleEnabled(ljSystem, "bottom-left")).toBe(true);
  });

  it("LJでweakening-rightは有効", () => {
    expect(isScRuleEnabled(ljSystem, "weakening-right")).toBe(true);
  });

  it("LKでbottom-leftは有効", () => {
    expect(isScRuleEnabled(lkSystem, "bottom-left")).toBe(true);
  });
});

// ── allScRuleIds のテスト ───────────────────────────────────

describe("allScRuleIds", () => {
  it("19種の規則IDを含む", () => {
    expect(allScRuleIds).toHaveLength(19);
  });

  it("重複がない", () => {
    const unique = new Set(allScRuleIds);
    expect(unique.size).toBe(allScRuleIds.length);
  });

  it("LMの全規則を含む", () => {
    for (const rule of lmSystem.rules) {
      expect(allScRuleIds).toContain(rule);
    }
  });

  it("bottom-left と weakening-right を含む", () => {
    expect(allScRuleIds).toContain("bottom-left");
    expect(allScRuleIds).toContain("weakening-right");
  });
});

// ── getScRuleDisplayName のテスト ────────────────────────────

describe("getScRuleDisplayName", () => {
  it("全規則の表示名が空でない", () => {
    for (const ruleId of allScRuleIds) {
      const name = getScRuleDisplayName(ruleId);
      expect(name).not.toBe("");
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it("公理の表示名", () => {
    expect(getScRuleDisplayName("identity")).toBe("公理 (ID)");
  });

  it("⊥公理の表示名", () => {
    expect(getScRuleDisplayName("bottom-left")).toBe("⊥公理 (⊥⇒)");
  });

  it("カットの表示名", () => {
    expect(getScRuleDisplayName("cut")).toBe("カット (CUT)");
  });

  it("左弱化の表示名", () => {
    expect(getScRuleDisplayName("weakening-left")).toBe("左弱化 (w⇒)");
  });

  it("右弱化の表示名", () => {
    expect(getScRuleDisplayName("weakening-right")).toBe("右弱化 (⇒w)");
  });
});

// ── TAB体系のテスト ──────────────────────────────────────────

describe("TAB (タブロー式シーケント計算)", () => {
  it("名前が正しい", () => {
    expect(tabSystem.name).toBe("Tableau Calculus TAB");
  });

  it("全14規則を含む", () => {
    expect(tabSystem.rules.size).toBe(14);
  });

  it("公理規則を含む", () => {
    expect(tabSystem.rules.has("bs")).toBe(true);
    expect(tabSystem.rules.has("bottom")).toBe(true);
  });

  it("構造規則を含む", () => {
    expect(tabSystem.rules.has("exchange")).toBe(true);
  });

  it("命題論理規則を含む", () => {
    expect(tabSystem.rules.has("double-negation")).toBe(true);
    expect(tabSystem.rules.has("conjunction")).toBe(true);
    expect(tabSystem.rules.has("neg-conjunction")).toBe(true);
    expect(tabSystem.rules.has("disjunction")).toBe(true);
    expect(tabSystem.rules.has("neg-disjunction")).toBe(true);
    expect(tabSystem.rules.has("implication")).toBe(true);
    expect(tabSystem.rules.has("neg-implication")).toBe(true);
  });

  it("量化子規則を含む", () => {
    expect(tabSystem.rules.has("universal")).toBe(true);
    expect(tabSystem.rules.has("neg-universal")).toBe(true);
    expect(tabSystem.rules.has("existential")).toBe(true);
    expect(tabSystem.rules.has("neg-existential")).toBe(true);
  });
});

describe("TAB-Prop (タブロー命題論理)", () => {
  it("名前が正しい", () => {
    expect(tabPropSystem.name).toBe("Tableau Calculus TAB (Propositional)");
  });

  it("命題論理10規則を含む", () => {
    expect(tabPropSystem.rules.size).toBe(10);
  });

  it("量化子規則を含まない", () => {
    expect(tabPropSystem.rules.has("universal")).toBe(false);
    expect(tabPropSystem.rules.has("neg-universal")).toBe(false);
    expect(tabPropSystem.rules.has("existential")).toBe(false);
    expect(tabPropSystem.rules.has("neg-existential")).toBe(false);
  });

  it("命題論理規則はすべて含む", () => {
    expect(tabPropSystem.rules.has("bs")).toBe(true);
    expect(tabPropSystem.rules.has("bottom")).toBe(true);
    expect(tabPropSystem.rules.has("exchange")).toBe(true);
    expect(tabPropSystem.rules.has("double-negation")).toBe(true);
    expect(tabPropSystem.rules.has("conjunction")).toBe(true);
    expect(tabPropSystem.rules.has("neg-conjunction")).toBe(true);
    expect(tabPropSystem.rules.has("disjunction")).toBe(true);
    expect(tabPropSystem.rules.has("neg-disjunction")).toBe(true);
    expect(tabPropSystem.rules.has("implication")).toBe(true);
    expect(tabPropSystem.rules.has("neg-implication")).toBe(true);
  });
});

// ── DeductionSystemのTABテスト ────────────────────────────

describe("DeductionSystem (tableau-calculus)", () => {
  it("tableauCalculusDeduction でTAB体系を作成できる", () => {
    const ds = tableauCalculusDeduction(tabSystem);
    expect(ds.style).toBe("tableau-calculus");
    expect(ds.system).toBe(tabSystem);
  });

  it("getDeductionSystemName でTABの名前を取得できる", () => {
    const ds = tableauCalculusDeduction(tabSystem);
    expect(getDeductionSystemName(ds)).toBe("Tableau Calculus TAB");
  });
});

// ── DeductionSystemのATテスト ────────────────────────────

describe("DeductionSystem (analytic-tableau)", () => {
  it("analyticTableauDeduction でAT体系を作成できる", () => {
    const ds = analyticTableauDeduction(atSystem);
    expect(ds.style).toBe("analytic-tableau");
    expect(ds.system).toBe(atSystem);
  });

  it("getDeductionSystemName でATの名前を取得できる", () => {
    const ds = analyticTableauDeduction(atSystem);
    expect(getDeductionSystemName(ds)).toBe("Analytic Tableau");
  });

  it("atSystem has 15 rules", () => {
    expect(atSystem.rules.size).toBe(15);
  });

  it("atPropSystem has 11 rules (no quantifiers)", () => {
    expect(atPropSystem.rules.size).toBe(11);
    expect(atPropSystem.rules.has("gamma-univ")).toBe(false);
    expect(atPropSystem.rules.has("gamma-neg-exist")).toBe(false);
    expect(atPropSystem.rules.has("delta-neg-univ")).toBe(false);
    expect(atPropSystem.rules.has("delta-exist")).toBe(false);
  });
});

// ── isAtRuleEnabled のテスト ────────────────────────────────

describe("isAtRuleEnabled", () => {
  it("ATでalpha-conjは有効", () => {
    expect(isAtRuleEnabled(atSystem, "alpha-conj")).toBe(true);
  });

  it("AT-Propでgamma-univは無効", () => {
    expect(isAtRuleEnabled(atPropSystem, "gamma-univ")).toBe(false);
  });

  it("ATでgamma-univは有効", () => {
    expect(isAtRuleEnabled(atSystem, "gamma-univ")).toBe(true);
  });

  it("ATでclosureは有効", () => {
    expect(isAtRuleEnabled(atSystem, "closure")).toBe(true);
  });
});

// ── isTabRuleEnabled のテスト ────────────────────────────────

describe("isTabRuleEnabled", () => {
  it("TABでbsは有効", () => {
    expect(isTabRuleEnabled(tabSystem, "bs")).toBe(true);
  });

  it("TAB-Propでuniversalは無効", () => {
    expect(isTabRuleEnabled(tabPropSystem, "universal")).toBe(false);
  });

  it("TABでuniversalは有効", () => {
    expect(isTabRuleEnabled(tabSystem, "universal")).toBe(true);
  });
});

// ── 型の網羅性テスト ────────────────────────────────────────

describe("型の網羅性", () => {
  it("DeductionStyle の全バリアントを網羅している", () => {
    const styles: readonly DeductionStyle[] = [
      "hilbert",
      "natural-deduction",
      "sequent-calculus",
      "tableau-calculus",
      "analytic-tableau",
    ];
    for (const style of styles) {
      expect(typeof getDeductionStyleLabel(style)).toBe("string");
    }
  });

  it("NdRuleId の全バリアントを網羅している", () => {
    for (const ruleId of allNdRuleIds) {
      expect(typeof getNdRuleDisplayName(ruleId)).toBe("string");
    }
  });

  it("ScRuleId の全バリアントを網羅している", () => {
    for (const ruleId of allScRuleIds) {
      expect(typeof getScRuleDisplayName(ruleId)).toBe("string");
    }
  });

  it("DeductionSystem の全バリアントを getDeductionSystemName が網羅している", () => {
    const systems: readonly DeductionSystem[] = [
      hilbertDeduction(minimalLogicSystem),
      naturalDeduction(nmSystem),
      sequentCalculusDeduction(lmSystem),
      tableauCalculusDeduction(tabSystem),
    ];
    for (const ds of systems) {
      expect(typeof getDeductionSystemName(ds)).toBe("string");
    }
  });

  it("TabRuleId の全バリアントを網羅している", () => {
    for (const ruleId of allTabRuleIds) {
      expect(isTabRuleEnabled(tabSystem, ruleId)).toBe(true);
    }
  });
});
