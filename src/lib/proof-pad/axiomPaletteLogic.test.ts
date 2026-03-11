import { describe, it, expect } from "vitest";
import {
  getAvailableAxioms,
  getAvailableNdRules,
  getAvailableTabRules,
  getAvailableAtRules,
  getAvailableScRules,
  getAxiomReferenceEntryId,
} from "./axiomPaletteLogic";
import {
  minimalLogicSystem,
  intuitionisticSystem,
  lukasiewiczSystem,
  mendelsonSystem,
  classicalLogicSystem,
  predicateLogicSystem,
  equalityLogicSystem,
  peanoArithmeticSystem,
} from "../logic-core/inferenceRule";
import type { LogicSystem } from "../logic-core/inferenceRule";
import {
  nmSystem,
  njSystem,
  nkSystem,
  tabSystem,
  tabPropSystem,
  atSystem,
  atPropSystem,
  lmSystem,
  ljSystem,
  lkSystem,
} from "../logic-core/deductionSystem";
import type {
  TableauCalculusSystem,
  AnalyticTableauSystem,
  SequentCalculusSystem,
  ScRuleId,
} from "../logic-core/deductionSystem";
import type { TabRuleId } from "../logic-core/tableauCalculus";
import type { AtRuleId } from "../logic-core/analyticTableau";

describe("axiomPalette", () => {
  describe("getAvailableAxioms", () => {
    it("returns A1, A2, A3 for Łukasiewicz system", () => {
      const items = getAvailableAxioms(lukasiewiczSystem);
      const ids = items.map((i) => i.id);
      expect(ids).toEqual(["A1", "A2", "A3"]);
    });

    it("returns A1, A2 only for minimal logic system", () => {
      const items = getAvailableAxioms(minimalLogicSystem);
      const ids = items.map((i) => i.id);
      expect(ids).toEqual(["A1", "A2"]);
    });

    it("returns A1, A2, M3 for Mendelson system", () => {
      const items = getAvailableAxioms(mendelsonSystem);
      const ids = items.map((i) => i.id);
      expect(ids).toEqual(["A1", "A2", "M3"]);
    });

    it("provides correct displayName for Mendelson axioms", () => {
      const items = getAvailableAxioms(mendelsonSystem);
      expect(items[0].displayName).toBe("A1 (K)");
      expect(items[1].displayName).toBe("A2 (S)");
      expect(items[2].displayName).toBe("M3");
    });

    it("provides dslText for M3", () => {
      const items = getAvailableAxioms(mendelsonSystem);
      const m3 = items.find((i) => i.id === "M3");
      expect(m3?.dslText).toBe("(~phi -> ~psi) -> ((~phi -> psi) -> phi)");
    });

    it("returns A1, A2, EFQ for intuitionistic system", () => {
      const items = getAvailableAxioms(intuitionisticSystem);
      const ids = items.map((i) => i.id);
      expect(ids).toEqual(["A1", "A2", "EFQ"]);
    });

    it("provides correct displayName for intuitionistic axioms", () => {
      const items = getAvailableAxioms(intuitionisticSystem);
      expect(items[0].displayName).toBe("A1 (K)");
      expect(items[1].displayName).toBe("A2 (S)");
      expect(items[2].displayName).toBe("EFQ");
    });

    it("provides dslText for EFQ", () => {
      const items = getAvailableAxioms(intuitionisticSystem);
      const efq = items.find((i) => i.id === "EFQ");
      expect(efq?.dslText).toBe("~phi -> (phi -> psi)");
    });

    it("returns A1, A2, DNE for classical logic system", () => {
      const items = getAvailableAxioms(classicalLogicSystem);
      const ids = items.map((i) => i.id);
      expect(ids).toEqual(["A1", "A2", "DNE"]);
    });

    it("provides correct displayName for classical axioms", () => {
      const items = getAvailableAxioms(classicalLogicSystem);
      expect(items[0].displayName).toBe("A1 (K)");
      expect(items[1].displayName).toBe("A2 (S)");
      expect(items[2].displayName).toBe("DNE");
    });

    it("provides dslText for DNE", () => {
      const items = getAvailableAxioms(classicalLogicSystem);
      const dne = items.find((i) => i.id === "DNE");
      expect(dne?.dslText).toBe("~~phi -> phi");
    });

    it("returns A1-A5 for predicate logic system", () => {
      const items = getAvailableAxioms(predicateLogicSystem);
      const ids = items.map((i) => i.id);
      expect(ids).toEqual(["A1", "A2", "A3", "A4", "A5"]);
    });

    it("returns A1-A5, E1-E3 for equality logic system", () => {
      const items = getAvailableAxioms(equalityLogicSystem);
      const ids = items.map((i) => i.id);
      expect(ids).toEqual(["A1", "A2", "A3", "A4", "A5", "E1", "E2", "E3"]);
    });

    it("provides correct displayName for each axiom", () => {
      const items = getAvailableAxioms(lukasiewiczSystem);
      expect(items[0].displayName).toBe("A1 (K)");
      expect(items[1].displayName).toBe("A2 (S)");
      expect(items[2].displayName).toBe("A3");
    });

    it("provides unicodeDisplay for propositional axioms", () => {
      const items = getAvailableAxioms(lukasiewiczSystem);
      // A1: φ → (ψ → φ)
      expect(items[0].unicodeDisplay).toContain("→");
      // A2: (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))
      expect(items[1].unicodeDisplay).toContain("→");
      // A3: (¬φ → ¬ψ) → (ψ → φ)
      expect(items[2].unicodeDisplay).toContain("¬");
    });

    it("provides dslText for propositional axioms", () => {
      const items = getAvailableAxioms(lukasiewiczSystem);
      expect(items[0].dslText).toBe("phi -> (psi -> phi)");
      expect(items[1].dslText).toBe(
        "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
      );
      expect(items[2].dslText).toBe("(~phi -> ~psi) -> (psi -> phi)");
    });

    it("A4 and A5 have schematic dslText as default", () => {
      const items = getAvailableAxioms(predicateLogicSystem);
      const a4 = items.find((i) => i.id === "A4");
      const a5 = items.find((i) => i.id === "A5");
      expect(a4?.dslText).toBe("(all x. phi) -> phi");
      expect(a5?.dslText).toBe("(all x. (phi -> psi)) -> (phi -> all x. psi)");
    });

    it("A4 shows schematic unicode display", () => {
      const items = getAvailableAxioms(predicateLogicSystem);
      const a4 = items.find((i) => i.id === "A4");
      expect(a4?.unicodeDisplay).toBe("(∀x.φ) → φ");
    });

    it("A5 shows schematic unicode display", () => {
      const items = getAvailableAxioms(predicateLogicSystem);
      const a5 = items.find((i) => i.id === "A5");
      expect(a5?.unicodeDisplay).toBe("(∀x.φ → ψ) → φ → (∀x.ψ)");
    });

    it("equality axioms have dslText", () => {
      const items = getAvailableAxioms(equalityLogicSystem);
      const e1 = items.find((i) => i.id === "E1");
      const e2 = items.find((i) => i.id === "E2");
      const e3 = items.find((i) => i.id === "E3");
      expect(e1?.dslText).toBe("all x. x = x");
      expect(e2?.dslText).toBe("all x. all y. x = y -> y = x");
      expect(e3?.dslText).toBe(
        "all x. all y. all z. x = y -> (y = z -> x = z)",
      );
    });

    it("returns empty list for system with no axioms", () => {
      const emptySystem: LogicSystem = {
        name: "Empty",
        propositionalAxioms: new Set(),
        predicateLogic: false,
        equalityLogic: false,
        generalization: false,
      };
      const items = getAvailableAxioms(emptySystem);
      expect(items).toEqual([]);
    });

    it("respects partial propositional axiom sets", () => {
      const partialSystem: LogicSystem = {
        name: "Partial",
        propositionalAxioms: new Set(["A1", "A3"]),
        predicateLogic: false,
        equalityLogic: false,
        generalization: false,
      };
      const items = getAvailableAxioms(partialSystem);
      const ids = items.map((i) => i.id);
      expect(ids).toEqual(["A1", "A3"]);
    });

    it("each item has a template Formula AST", () => {
      const items = getAvailableAxioms(lukasiewiczSystem);
      for (const item of items) {
        expect(item.template._tag).toBeDefined();
      }
    });

    describe("theory axioms", () => {
      it("includes PA1-PA6 for peano arithmetic system", () => {
        const items = getAvailableAxioms(peanoArithmeticSystem);
        const ids = items.map((i) => i.id);
        expect(ids).toContain("PA1");
        expect(ids).toContain("PA2");
        expect(ids).toContain("PA3");
        expect(ids).toContain("PA4");
        expect(ids).toContain("PA5");
        expect(ids).toContain("PA6");
      });

      it("theory axioms have dslText", () => {
        const items = getAvailableAxioms(peanoArithmeticSystem);
        const pa1 = items.find((i) => i.id === "PA1");
        const pa3 = items.find((i) => i.id === "PA3");
        expect(pa1?.dslText).toBe("all x. ~(S(x) = 0)");
        expect(pa3?.dslText).toBe("all x. x + 0 = x");
      });

      it("theory axioms have unicodeDisplay", () => {
        const items = getAvailableAxioms(peanoArithmeticSystem);
        const pa1 = items.find((i) => i.id === "PA1");
        expect(pa1?.unicodeDisplay).toContain("¬");
      });

      it("theory axioms appear after logic axioms", () => {
        const items = getAvailableAxioms(peanoArithmeticSystem);
        const ids = items.map((i) => i.id);
        // 論理公理が先、理論公理が後
        const a1Index = ids.indexOf("A1");
        const pa1Index = ids.indexOf("PA1");
        expect(pa1Index).toBeGreaterThan(a1Index);
      });

      it("does not include theory axioms for system without theoryAxioms", () => {
        const items = getAvailableAxioms(equalityLogicSystem);
        const ids = items.map((i) => i.id);
        expect(ids).not.toContain("PA1");
      });
    });
  });

  describe("getAvailableNdRules", () => {
    it("NMの基本規則9つを返す", () => {
      const items = getAvailableNdRules(nmSystem);
      const ids = items.map((i) => i.id);
      expect(ids).toEqual([
        "implication-intro",
        "implication-elim",
        "conjunction-intro",
        "conjunction-elim-left",
        "conjunction-elim-right",
        "disjunction-intro-left",
        "disjunction-intro-right",
        "disjunction-elim",
        "weakening",
        "universal-intro",
        "universal-elim",
        "existential-intro",
        "existential-elim",
      ]);
    });

    it("NJはNM+EFQの14規則を返す", () => {
      const items = getAvailableNdRules(njSystem);
      const ids = items.map((i) => i.id);
      expect(ids).toContain("efq");
      expect(ids).not.toContain("dne");
      expect(ids).toHaveLength(14);
    });

    it("NKはNM+DNEの14規則を返す", () => {
      const items = getAvailableNdRules(nkSystem);
      const ids = items.map((i) => i.id);
      expect(ids).toContain("dne");
      expect(ids).not.toContain("efq");
      expect(ids).toHaveLength(14);
    });

    it("各アイテムにdisplayNameがある", () => {
      const items = getAvailableNdRules(nmSystem);
      for (const item of items) {
        expect(item.displayName).toBeTruthy();
      }
    });

    it("allNdRuleIdsの順序で返される", () => {
      const items = getAvailableNdRules(njSystem);
      const ids = items.map((i) => i.id);
      // implication-intro が conjunction-intro より前
      expect(ids.indexOf("implication-intro")).toBeLessThan(
        ids.indexOf("conjunction-intro"),
      );
      // efq が最後から2番目（weakening の次）
      expect(ids.indexOf("weakening")).toBeLessThan(ids.indexOf("efq"));
    });
  });

  describe("getAvailableTabRules", () => {
    it("TAB全体系の14規則すべてを返す", () => {
      const items = getAvailableTabRules(tabSystem);
      expect(items).toHaveLength(14);
    });

    it("TAB命題論理体系の10規則を返す", () => {
      const items = getAvailableTabRules(tabPropSystem);
      expect(items).toHaveLength(10);
    });

    it("TAB命題論理体系には量化子規則が含まれない", () => {
      const items = getAvailableTabRules(tabPropSystem);
      const ids = items.map((i) => i.id);
      expect(ids).not.toContain("universal");
      expect(ids).not.toContain("neg-universal");
      expect(ids).not.toContain("existential");
      expect(ids).not.toContain("neg-existential");
    });

    it("allTabRuleIdsの順序で返される", () => {
      const items = getAvailableTabRules(tabSystem);
      const ids = items.map((i) => i.id);
      expect(ids.indexOf("bs")).toBeLessThan(ids.indexOf("conjunction"));
      expect(ids.indexOf("conjunction")).toBeLessThan(
        ids.indexOf("implication"),
      );
    });

    it("各アイテムにdisplayNameがある", () => {
      const items = getAvailableTabRules(tabSystem);
      for (const item of items) {
        expect(item.displayName).toBeTruthy();
      }
    });

    it("分岐規則が正しくマークされる", () => {
      const items = getAvailableTabRules(tabSystem);
      const branchingIds = items.filter((i) => i.isBranching).map((i) => i.id);
      expect(branchingIds).toEqual([
        "neg-conjunction",
        "disjunction",
        "implication",
      ]);
    });

    it("非分岐規則が正しくマークされる", () => {
      const items = getAvailableTabRules(tabSystem);
      const nonBranchingIds = items
        .filter((i) => !i.isBranching)
        .map((i) => i.id);
      expect(nonBranchingIds).toContain("bs");
      expect(nonBranchingIds).toContain("conjunction");
      expect(nonBranchingIds).toContain("double-negation");
    });

    it("空の規則セットで空リストを返す", () => {
      const emptySystem: TableauCalculusSystem = {
        name: "Empty",
        rules: new Set<TabRuleId>(),
      };
      const items = getAvailableTabRules(emptySystem);
      expect(items).toEqual([]);
    });

    it("部分的な規則セットを正しく処理する", () => {
      const partialSystem: TableauCalculusSystem = {
        name: "Partial",
        rules: new Set<TabRuleId>(["bs", "bottom", "conjunction"]),
      };
      const items = getAvailableTabRules(partialSystem);
      const ids = items.map((i) => i.id);
      expect(ids).toEqual(["bs", "bottom", "conjunction"]);
    });
  });

  describe("getAvailableAtRules", () => {
    it("AT全体系で15規則を返す", () => {
      const items = getAvailableAtRules(atSystem);
      expect(items).toHaveLength(15);
    });

    it("AT命題論理体系で11規則を返す", () => {
      const items = getAvailableAtRules(atPropSystem);
      expect(items).toHaveLength(11);
    });

    it("AT命題論理体系に量化子規則が含まれない", () => {
      const items = getAvailableAtRules(atPropSystem);
      const ids = items.map((i) => i.id);
      expect(ids).not.toContain("gamma-univ");
      expect(ids).not.toContain("gamma-neg-exist");
      expect(ids).not.toContain("delta-neg-univ");
      expect(ids).not.toContain("delta-exist");
    });

    it("β規則のisBranchingがtrueになる", () => {
      const items = getAvailableAtRules(atSystem);
      const betaItems = items.filter((i) => i.isBranching);
      const betaIds = betaItems.map((i) => i.id);
      expect(betaIds).toContain("beta-neg-conj");
      expect(betaIds).toContain("beta-disj");
      expect(betaIds).toContain("beta-impl");
    });

    it("α規則のisBranchingがfalseになる", () => {
      const items = getAvailableAtRules(atSystem);
      const alphaItem = items.find((i) => i.id === "alpha-conj");
      expect(alphaItem).toBeDefined();
      expect(alphaItem!.isBranching).toBe(false);
    });

    it("displayNameが非空文字列", () => {
      const items = getAvailableAtRules(atSystem);
      for (const item of items) {
        expect(item.displayName.length).toBeGreaterThan(0);
      }
    });

    it("空の規則セットで空リストを返す", () => {
      const emptySystem: AnalyticTableauSystem = {
        name: "Empty",
        rules: new Set<AtRuleId>(),
      };
      const items = getAvailableAtRules(emptySystem);
      expect(items).toEqual([]);
    });

    it("部分的な規則セットを正しく処理する", () => {
      const partialSystem: AnalyticTableauSystem = {
        name: "Partial",
        rules: new Set<AtRuleId>(["alpha-conj", "beta-disj", "closure"]),
      };
      const items = getAvailableAtRules(partialSystem);
      const ids = items.map((i) => i.id);
      expect(ids).toEqual(["alpha-conj", "beta-disj", "closure"]);
    });
  });

  describe("getAxiomReferenceEntryId", () => {
    it("maps A1 to axiom-a1", () => {
      expect(getAxiomReferenceEntryId("A1")).toBe("axiom-a1");
    });

    it("maps A2 to axiom-a2", () => {
      expect(getAxiomReferenceEntryId("A2")).toBe("axiom-a2");
    });

    it("maps A3 to axiom-a3", () => {
      expect(getAxiomReferenceEntryId("A3")).toBe("axiom-a3");
    });

    it("maps M3 to axiom-m3", () => {
      expect(getAxiomReferenceEntryId("M3")).toBe("axiom-m3");
    });

    it("maps EFQ to axiom-efq", () => {
      expect(getAxiomReferenceEntryId("EFQ")).toBe("axiom-efq");
    });

    it("maps DNE to axiom-dne", () => {
      expect(getAxiomReferenceEntryId("DNE")).toBe("axiom-dne");
    });

    it("maps A4 to axiom-a4", () => {
      expect(getAxiomReferenceEntryId("A4")).toBe("axiom-a4");
    });

    it("maps A5 to axiom-a5", () => {
      expect(getAxiomReferenceEntryId("A5")).toBe("axiom-a5");
    });

    it("maps E1 to axiom-e1", () => {
      expect(getAxiomReferenceEntryId("E1")).toBe("axiom-e1");
    });

    it("maps E2 to axiom-e2", () => {
      expect(getAxiomReferenceEntryId("E2")).toBe("axiom-e2");
    });

    it("maps E3 to axiom-e3", () => {
      expect(getAxiomReferenceEntryId("E3")).toBe("axiom-e3");
    });

    it("returns undefined for unknown axiom ID", () => {
      expect(getAxiomReferenceEntryId("UNKNOWN")).toBeUndefined();
    });

    it("returns undefined for theory axiom ID (PA1)", () => {
      expect(getAxiomReferenceEntryId("PA1")).toBeUndefined();
    });

    it("covers all standard axiom IDs", () => {
      const standardAxiomIds = [
        "A1",
        "A2",
        "A3",
        "M3",
        "EFQ",
        "DNE",
        "A4",
        "A5",
        "E1",
        "E2",
        "E3",
      ];
      for (const id of standardAxiomIds) {
        expect(getAxiomReferenceEntryId(id)).toBeDefined();
      }
    });
  });

  describe("getAvailableScRules", () => {
    it("LK全体系の21規則すべてを返す", () => {
      const items = getAvailableScRules(lkSystem);
      expect(items).toHaveLength(21);
    });

    it("LJ全体系の21規則すべてを返す", () => {
      const items = getAvailableScRules(ljSystem);
      expect(items).toHaveLength(21);
    });

    it("LM体系の19規則を返す", () => {
      const items = getAvailableScRules(lmSystem);
      expect(items).toHaveLength(19);
    });

    it("LM体系には⊥公理と右弱化が含まれない", () => {
      const items = getAvailableScRules(lmSystem);
      const ids = items.map((i) => i.id);
      expect(ids).not.toContain("bottom-left");
      expect(ids).not.toContain("weakening-right");
    });

    it("allScRuleIdsの順序で返される", () => {
      const items = getAvailableScRules(lkSystem);
      const ids = items.map((i) => i.id);
      expect(ids.indexOf("identity")).toBeLessThan(ids.indexOf("cut"));
      expect(ids.indexOf("cut")).toBeLessThan(ids.indexOf("implication-left"));
    });

    it("各アイテムにdisplayNameがある", () => {
      const items = getAvailableScRules(lkSystem);
      for (const item of items) {
        expect(item.displayName).toBeTruthy();
      }
    });

    it("分岐規則が正しくマークされる", () => {
      const items = getAvailableScRules(lkSystem);
      const branchingIds = items.filter((i) => i.isBranching).map((i) => i.id);
      expect(branchingIds).toEqual([
        "cut",
        "implication-left",
        "conjunction-right",
        "disjunction-left",
      ]);
    });

    it("非分岐規則が正しくマークされる", () => {
      const items = getAvailableScRules(lkSystem);
      const nonBranchingIds = items
        .filter((i) => !i.isBranching)
        .map((i) => i.id);
      expect(nonBranchingIds).toContain("identity");
      expect(nonBranchingIds).toContain("weakening-left");
      expect(nonBranchingIds).toContain("implication-right");
    });

    it("空の規則セットで空リストを返す", () => {
      const emptySystem: SequentCalculusSystem = {
        name: "Empty",
        rules: new Set<ScRuleId>(),
      };
      const items = getAvailableScRules(emptySystem);
      expect(items).toEqual([]);
    });

    it("部分的な規則セットを正しく処理する", () => {
      const partialSystem: SequentCalculusSystem = {
        name: "Partial",
        rules: new Set<ScRuleId>(["identity", "cut", "implication-left"]),
      };
      const items = getAvailableScRules(partialSystem);
      const ids = items.map((i) => i.id);
      expect(ids).toEqual(["identity", "cut", "implication-left"]);
    });
  });
});
