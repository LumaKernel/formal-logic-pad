import { Either } from "effect";
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
  GenPremiseMissing,
  GenPremiseParseError,
  GenVariableNameEmpty,
  GenGeneralizationNotEnabled,
  GenRuleError,
} from "./genApplicationLogic";
import type { InferenceEdge } from "./inferenceEdge";

describe("genApplicationLogic", () => {
  describe("getGenPremise", () => {
    it("returns undefined when no inferenceEdges", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Gen", { x: 0, y: 0 });
      const premiseId = getGenPremise(ws, "node-1");
      expect(premiseId).toBeUndefined();
    });

    it("returns premise node id when GenEdge exists", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Gen", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise");
      const genEdge: InferenceEdge = {
        _tag: "gen",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        variableName: "x",
        conclusionText: "",
      };
      ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, genEdge] };
      const premiseId = getGenPremise(ws, "node-2");
      expect(premiseId).toBe("node-1");
    });

    it("returns undefined when no GenEdge for this node", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Gen", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "out");
      // No GenEdge added — connection alone does not suffice
      const premiseId = getGenPremise(ws, "node-2");
      expect(premiseId).toBeUndefined();
    });

    it("ignores GenEdges for other nodes", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Gen-1", { x: 100, y: 100 });
      ws = addNode(ws, "axiom", "Gen-2", { x: 200, y: 200 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise");
      const genEdge: InferenceEdge = {
        _tag: "gen",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        variableName: "x",
        conclusionText: "",
      };
      ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, genEdge] };
      // node-3 has no GenEdge
      const premiseId = getGenPremise(ws, "node-3");
      expect(premiseId).toBeUndefined();
    });
  });

  describe("validateGenApplication", () => {
    it("returns GenVariableNameEmpty when variable name is empty", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Gen", { x: 0, y: 0 });
      const result = validateGenApplication(ws, "node-1", "");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("GenVariableNameEmpty");
      }
    });

    it("returns GenVariableNameEmpty when variable name is whitespace", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Gen", { x: 0, y: 0 });
      const result = validateGenApplication(ws, "node-1", "   ");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("GenVariableNameEmpty");
      }
    });

    it("returns GenPremiseMissing when no GenEdge is present", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Gen", { x: 0, y: 0 });
      const result = validateGenApplication(ws, "node-1", "x");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("GenPremiseMissing");
      }
    });

    it("returns GenPremiseParseError when premise formula is invalid", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "-> ->");
      ws = addNode(ws, "axiom", "Gen", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise");
      const genEdge: InferenceEdge = {
        _tag: "gen",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        variableName: "x",
        conclusionText: "",
      };
      ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, genEdge] };
      const result = validateGenApplication(ws, "node-2", "x");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("GenPremiseParseError");
      }
    });

    it("returns GenPremiseParseError when premise formula is empty", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "");
      ws = addNode(ws, "axiom", "Gen", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise");
      const genEdge: InferenceEdge = {
        _tag: "gen",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        variableName: "x",
        conclusionText: "",
      };
      ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, genEdge] };
      const result = validateGenApplication(ws, "node-2", "x");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("GenPremiseParseError");
      }
    });

    it("returns GenGeneralizationNotEnabled when system does not support Gen", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Gen", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise");
      const genEdge: InferenceEdge = {
        _tag: "gen",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        variableName: "x",
        conclusionText: "",
      };
      ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, genEdge] };
      const result = validateGenApplication(ws, "node-2", "x");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("GenGeneralizationNotEnabled");
      }
    });

    it("returns Success with conclusion when Gen is valid", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Gen", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise");
      const genEdge: InferenceEdge = {
        _tag: "gen",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        variableName: "x",
        conclusionText: "",
      };
      ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, genEdge] };
      const result = validateGenApplication(ws, "node-2", "x");
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right.conclusion._tag).toBe("Universal");
        expect(result.right.conclusionText).toBe("∀x.φ");
      }
    });

    it("returns Success with complex formula", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> psi");
      ws = addNode(ws, "axiom", "Gen", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise");
      const genEdge: InferenceEdge = {
        _tag: "gen",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        variableName: "y",
        conclusionText: "",
      };
      ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, genEdge] };
      const result = validateGenApplication(ws, "node-2", "y");
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right.conclusionText).toBe("∀y.φ → ψ");
      }
    });

    it("handles predicate formula with Gen", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "P(x) -> Q(x)");
      ws = addNode(ws, "axiom", "Gen", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise");
      const genEdge: InferenceEdge = {
        _tag: "gen",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        variableName: "x",
        conclusionText: "",
      };
      ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, genEdge] };
      const result = validateGenApplication(ws, "node-2", "x");
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right.conclusionText).toBe("∀x.P(x) → Q(x)");
      }
    });

    it("trims variable name whitespace", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Gen", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise");
      const genEdge: InferenceEdge = {
        _tag: "gen",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        variableName: "x",
        conclusionText: "",
      };
      ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, genEdge] };
      const result = validateGenApplication(ws, "node-2", "  x  ");
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right.conclusionText).toBe("∀x.φ");
      }
    });
  });

  describe("getGenErrorMessage", () => {
    it("returns message for GenPremiseMissing", () => {
      expect(getGenErrorMessage(new GenPremiseMissing({}))).toBe(
        "Connect a premise to apply Gen",
      );
    });

    it("returns message for GenPremiseParseError", () => {
      expect(
        getGenErrorMessage(new GenPremiseParseError({ nodeId: "node-1" })),
      ).toBe("Premise has invalid formula");
    });

    it("returns message for GenVariableNameEmpty", () => {
      expect(getGenErrorMessage(new GenVariableNameEmpty({}))).toBe(
        "Enter a variable name",
      );
    });

    it("returns message for GenGeneralizationNotEnabled", () => {
      expect(
        getGenErrorMessage(new GenGeneralizationNotEnabled({})),
      ).toBe("Gen is not enabled in this logic system");
    });

    it("returns message for GenRuleError", () => {
      expect(
        getGenErrorMessage(
          new GenRuleError({ message: "Generalization failed" }),
        ),
      ).toBe("Generalization failed");
    });
  });
});
