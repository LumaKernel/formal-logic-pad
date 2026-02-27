import { describe, it, expect } from "vitest";
import {
  getAvailableAxioms,
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
      expect(a5?.dslText).toBe(
        "all x. (phi -> psi) -> (phi -> all x. psi)",
      );
    });

    it("A4 shows schematic unicode display", () => {
      const items = getAvailableAxioms(predicateLogicSystem);
      const a4 = items.find((i) => i.id === "A4");
      expect(a4?.unicodeDisplay).toBe("∀x.φ → φ[t/x]");
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
});
