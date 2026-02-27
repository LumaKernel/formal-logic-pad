import { describe, expect, it } from "vitest";
import {
  lukasiewiczSystem,
  predicateLogicSystem,
} from "../logic-core/inferenceRule";
import { createEmptyWorkspace, addNode, addConnection } from "./workspaceState";
import {
  getGenPremise,
  validateGenApplication,
  getGenErrorMessage,
} from "./genApplicationLogic";

describe("genApplicationLogic", () => {
  describe("getGenPremise", () => {
    it("returns undefined when no connections", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "gen", "Gen", { x: 0, y: 0 });
      const premiseId = getGenPremise(ws, "node-1");
      expect(premiseId).toBeUndefined();
    });

    it("returns premise node id when connected", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "gen", "Gen", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise");
      const premiseId = getGenPremise(ws, "node-2");
      expect(premiseId).toBe("node-1");
    });

    it("ignores connections to other ports", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "gen", "Gen", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "out");
      const premiseId = getGenPremise(ws, "node-2");
      expect(premiseId).toBeUndefined();
    });

    it("ignores connections to other nodes", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "gen", "Gen-1", { x: 100, y: 100 });
      ws = addNode(ws, "gen", "Gen-2", { x: 200, y: 200 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise");
      const premiseId = getGenPremise(ws, "node-3");
      expect(premiseId).toBeUndefined();
    });
  });

  describe("validateGenApplication", () => {
    it("returns VariableNameEmpty when variable name is empty", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "gen", "Gen", { x: 0, y: 0 });
      const result = validateGenApplication(ws, "node-1", "");
      expect(result._tag).toBe("VariableNameEmpty");
    });

    it("returns VariableNameEmpty when variable name is whitespace", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "gen", "Gen", { x: 0, y: 0 });
      const result = validateGenApplication(ws, "node-1", "   ");
      expect(result._tag).toBe("VariableNameEmpty");
    });

    it("returns PremiseMissing when no premise is connected", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "gen", "Gen", { x: 0, y: 0 });
      const result = validateGenApplication(ws, "node-1", "x");
      expect(result._tag).toBe("PremiseMissing");
    });

    it("returns PremiseParseError when premise formula is invalid", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "-> ->");
      ws = addNode(ws, "gen", "Gen", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise");
      const result = validateGenApplication(ws, "node-2", "x");
      expect(result._tag).toBe("PremiseParseError");
    });

    it("returns PremiseParseError when premise formula is empty", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "");
      ws = addNode(ws, "gen", "Gen", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise");
      const result = validateGenApplication(ws, "node-2", "x");
      expect(result._tag).toBe("PremiseParseError");
    });

    it("returns GeneralizationNotEnabled when system does not support Gen", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "gen", "Gen", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise");
      const result = validateGenApplication(ws, "node-2", "x");
      expect(result._tag).toBe("GeneralizationNotEnabled");
    });

    it("returns Success with conclusion when Gen is valid", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "gen", "Gen", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise");
      const result = validateGenApplication(ws, "node-2", "x");
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(result.conclusion._tag).toBe("Universal");
        expect(result.conclusionText).toBe("∀x.φ");
      }
    });

    it("returns Success with complex formula", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> psi");
      ws = addNode(ws, "gen", "Gen", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise");
      const result = validateGenApplication(ws, "node-2", "y");
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(result.conclusionText).toBe("∀y.φ → ψ");
      }
    });

    it("handles predicate formula with Gen", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "P(x) -> Q(x)");
      ws = addNode(ws, "gen", "Gen", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise");
      const result = validateGenApplication(ws, "node-2", "x");
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(result.conclusionText).toBe("∀x.P(x) → Q(x)");
      }
    });

    it("trims variable name whitespace", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "gen", "Gen", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise");
      const result = validateGenApplication(ws, "node-2", "  x  ");
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(result.conclusionText).toBe("∀x.φ");
      }
    });
  });

  describe("getGenErrorMessage", () => {
    it("returns message for PremiseMissing", () => {
      expect(getGenErrorMessage({ _tag: "PremiseMissing" })).toBe(
        "Connect a premise to apply Gen",
      );
    });

    it("returns message for PremiseParseError", () => {
      expect(
        getGenErrorMessage({ _tag: "PremiseParseError", nodeId: "node-1" }),
      ).toBe("Premise has invalid formula");
    });

    it("returns message for VariableNameEmpty", () => {
      expect(getGenErrorMessage({ _tag: "VariableNameEmpty" })).toBe(
        "Enter a variable name",
      );
    });

    it("returns message for GeneralizationNotEnabled", () => {
      expect(getGenErrorMessage({ _tag: "GeneralizationNotEnabled" })).toBe(
        "Gen is not enabled in this logic system",
      );
    });

    it("returns message for RuleError", () => {
      expect(
        getGenErrorMessage({
          _tag: "RuleError",
          message: "Generalization failed",
        }),
      ).toBe("Generalization failed");
    });
  });
});
