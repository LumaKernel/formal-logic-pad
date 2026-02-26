import { describe, it, expect } from "vitest";
import { getAvailableAxioms } from "./axiomPaletteLogic";
import {
  minimalLogicSystem,
  lukasiewiczSystem,
  mendelsonSystem,
  predicateLogicSystem,
  equalityLogicSystem,
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

    it("A4 and A5 have empty dslText (user fills in specific instance)", () => {
      const items = getAvailableAxioms(predicateLogicSystem);
      const a4 = items.find((i) => i.id === "A4");
      const a5 = items.find((i) => i.id === "A5");
      expect(a4?.dslText).toBe("");
      expect(a5?.dslText).toBe("");
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
  });
});
