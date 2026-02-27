import { describe, expect, it } from "vitest";
import { lukasiewiczSystem } from "../logic-core/inferenceRule";
import {
  createEmptyWorkspace,
  addNode,
  addConnection,
  updateNodeGenVariableName,
  updateNodeSubstitutionEntries,
} from "./workspaceState";
import type { SubstitutionEntries } from "./substitutionApplicationLogic";
import {
  extractInferenceEdges,
  findInferenceEdgesForNode,
  getInferenceEdgeConclusionNodeId,
  getInferenceEdgePremiseNodeIds,
  type InferenceEdge,
  type MPEdge,
  type GenEdge,
  type SubstitutionEdge,
} from "./inferenceEdge";

describe("inferenceEdge", () => {
  describe("extractInferenceEdges", () => {
    it("returns empty array for empty workspace", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const edges = extractInferenceEdges(ws);
      expect(edges).toEqual([]);
    });

    it("returns empty array for axiom-only workspace", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 }, "psi");
      const edges = extractInferenceEdges(ws);
      expect(edges).toEqual([]);
    });

    it("ignores conclusion nodes", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "conclusion", "Conclusion", { x: 0, y: 0 });
      const edges = extractInferenceEdges(ws);
      expect(edges).toEqual([]);
    });

    describe("MP edges", () => {
      it("extracts MP edge with no premises connected", () => {
        let ws = createEmptyWorkspace(lukasiewiczSystem);
        ws = addNode(ws, "mp", "MP", { x: 0, y: 0 });
        const edges = extractInferenceEdges(ws);
        expect(edges).toHaveLength(1);
        expect(edges[0]).toEqual({
          _tag: "mp",
          conclusionNodeId: "node-1",
          leftPremiseNodeId: undefined,
          rightPremiseNodeId: undefined,
          conclusionText: "",
        } satisfies MPEdge);
      });

      it("extracts MP edge with left premise only", () => {
        let ws = createEmptyWorkspace(lukasiewiczSystem);
        ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
        ws = addNode(ws, "mp", "MP", { x: 100, y: 100 });
        ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");
        const edges = extractInferenceEdges(ws);
        expect(edges).toHaveLength(1);
        expect(edges[0]).toEqual({
          _tag: "mp",
          conclusionNodeId: "node-2",
          leftPremiseNodeId: "node-1",
          rightPremiseNodeId: undefined,
          conclusionText: "",
        } satisfies MPEdge);
      });

      it("extracts MP edge with both premises", () => {
        let ws = createEmptyWorkspace(lukasiewiczSystem);
        ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
        ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 }, "phi -> psi");
        ws = addNode(ws, "mp", "MP", { x: 100, y: 150 });
        ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
        ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");
        const edges = extractInferenceEdges(ws);
        expect(edges).toHaveLength(1);
        expect(edges[0]).toEqual({
          _tag: "mp",
          conclusionNodeId: "node-3",
          leftPremiseNodeId: "node-1",
          rightPremiseNodeId: "node-2",
          conclusionText: "",
        } satisfies MPEdge);
      });

      it("captures conclusion text from MP node", () => {
        let ws = createEmptyWorkspace(lukasiewiczSystem);
        ws = addNode(ws, "mp", "MP", { x: 0, y: 0 }, "psi");
        const edges = extractInferenceEdges(ws);
        expect(edges[0]?._tag).toBe("mp");
        const mpEdge = edges[0] as MPEdge;
        expect(mpEdge.conclusionText).toBe("psi");
      });
    });

    describe("Gen edges", () => {
      it("extracts Gen edge with no premise connected", () => {
        let ws = createEmptyWorkspace(lukasiewiczSystem);
        ws = addNode(ws, "gen", "Gen", { x: 0, y: 0 });
        const edges = extractInferenceEdges(ws);
        expect(edges).toHaveLength(1);
        expect(edges[0]).toEqual({
          _tag: "gen",
          conclusionNodeId: "node-1",
          premiseNodeId: undefined,
          variableName: "",
          conclusionText: "",
        } satisfies GenEdge);
      });

      it("extracts Gen edge with premise and variable name", () => {
        let ws = createEmptyWorkspace(lukasiewiczSystem);
        ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
        ws = addNode(ws, "gen", "Gen", { x: 100, y: 100 });
        ws = updateNodeGenVariableName(ws, "node-2", "x");
        ws = addConnection(ws, "node-1", "out", "node-2", "premise");
        const edges = extractInferenceEdges(ws);
        expect(edges).toHaveLength(1);
        expect(edges[0]).toEqual({
          _tag: "gen",
          conclusionNodeId: "node-2",
          premiseNodeId: "node-1",
          variableName: "x",
          conclusionText: "",
        } satisfies GenEdge);
      });

      it("captures conclusion text from Gen node", () => {
        let ws = createEmptyWorkspace(lukasiewiczSystem);
        ws = addNode(ws, "gen", "Gen", { x: 0, y: 0 }, "∀x.φ");
        ws = updateNodeGenVariableName(ws, "node-1", "x");
        const edges = extractInferenceEdges(ws);
        expect(edges[0]?._tag).toBe("gen");
        const genEdge = edges[0] as GenEdge;
        expect(genEdge.conclusionText).toBe("∀x.φ");
        expect(genEdge.variableName).toBe("x");
      });
    });

    describe("Substitution edges", () => {
      it("extracts Substitution edge with no premise connected", () => {
        let ws = createEmptyWorkspace(lukasiewiczSystem);
        ws = addNode(ws, "substitution", "Subst", { x: 0, y: 0 });
        const edges = extractInferenceEdges(ws);
        expect(edges).toHaveLength(1);
        expect(edges[0]).toEqual({
          _tag: "substitution",
          conclusionNodeId: "node-1",
          premiseNodeId: undefined,
          entries: [],
          conclusionText: "",
        } satisfies SubstitutionEdge);
      });

      it("extracts Substitution edge with premise and entries", () => {
        const entries: SubstitutionEntries = [
          {
            _tag: "FormulaSubstitution",
            metaVariableName: "φ",
            formulaText: "p -> q",
          },
        ];
        let ws = createEmptyWorkspace(lukasiewiczSystem);
        ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> phi");
        ws = addNode(ws, "substitution", "Subst", { x: 100, y: 100 });
        ws = updateNodeSubstitutionEntries(ws, "node-2", entries);
        ws = addConnection(ws, "node-1", "out", "node-2", "premise");
        const edges = extractInferenceEdges(ws);
        expect(edges).toHaveLength(1);
        expect(edges[0]).toEqual({
          _tag: "substitution",
          conclusionNodeId: "node-2",
          premiseNodeId: "node-1",
          entries,
          conclusionText: "",
        } satisfies SubstitutionEdge);
      });

      it("captures conclusion text from Substitution node", () => {
        let ws = createEmptyWorkspace(lukasiewiczSystem);
        ws = addNode(
          ws,
          "substitution",
          "Subst",
          { x: 0, y: 0 },
          "(p -> q) -> (p -> q)",
        );
        const edges = extractInferenceEdges(ws);
        expect(edges[0]?._tag).toBe("substitution");
        const substEdge = edges[0] as SubstitutionEdge;
        expect(substEdge.conclusionText).toBe("(p -> q) -> (p -> q)");
      });
    });

    describe("mixed workspace", () => {
      it("extracts edges from workspace with multiple inference nodes", () => {
        let ws = createEmptyWorkspace(lukasiewiczSystem);
        // axiom nodes
        ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
        ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 }, "phi -> psi");
        // mp node
        ws = addNode(ws, "mp", "MP", { x: 100, y: 150 });
        ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
        ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");
        // gen node
        ws = addNode(ws, "gen", "Gen", { x: 100, y: 300 });
        ws = updateNodeGenVariableName(ws, "node-4", "x");
        ws = addConnection(ws, "node-3", "out", "node-4", "premise");
        // substitution node
        ws = addNode(ws, "substitution", "Subst", { x: 300, y: 150 });
        ws = addConnection(ws, "node-1", "out", "node-5", "premise");

        const edges = extractInferenceEdges(ws);
        expect(edges).toHaveLength(3);

        // MP edge
        expect(edges[0]).toEqual({
          _tag: "mp",
          conclusionNodeId: "node-3",
          leftPremiseNodeId: "node-1",
          rightPremiseNodeId: "node-2",
          conclusionText: "",
        } satisfies MPEdge);

        // Gen edge
        expect(edges[1]).toEqual({
          _tag: "gen",
          conclusionNodeId: "node-4",
          premiseNodeId: "node-3",
          variableName: "x",
          conclusionText: "",
        } satisfies GenEdge);

        // Substitution edge
        expect(edges[2]).toEqual({
          _tag: "substitution",
          conclusionNodeId: "node-5",
          premiseNodeId: "node-1",
          entries: [],
          conclusionText: "",
        } satisfies SubstitutionEdge);
      });

      it("preserves order matching node order", () => {
        let ws = createEmptyWorkspace(lukasiewiczSystem);
        ws = addNode(ws, "gen", "Gen", { x: 0, y: 0 });
        ws = addNode(ws, "mp", "MP", { x: 100, y: 0 });
        ws = addNode(ws, "substitution", "Subst", { x: 200, y: 0 });
        const edges = extractInferenceEdges(ws);
        expect(edges).toHaveLength(3);
        expect(edges[0]?._tag).toBe("gen");
        expect(edges[1]?._tag).toBe("mp");
        expect(edges[2]?._tag).toBe("substitution");
      });
    });
  });

  describe("findInferenceEdgesForNode", () => {
    it("returns empty array when no edges involve the node", () => {
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "mp",
          conclusionNodeId: "mp-1",
          leftPremiseNodeId: "a",
          rightPremiseNodeId: "b",
          conclusionText: "",
        },
      ];
      expect(findInferenceEdgesForNode(edges, "unrelated")).toEqual([]);
    });

    it("finds edges where node is the rule node", () => {
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "mp",
          conclusionNodeId: "mp-1",
          leftPremiseNodeId: "a",
          rightPremiseNodeId: "b",
          conclusionText: "",
        },
      ];
      expect(findInferenceEdgesForNode(edges, "mp-1")).toHaveLength(1);
    });

    it("finds MP edges where node is left premise", () => {
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "mp",
          conclusionNodeId: "mp-1",
          leftPremiseNodeId: "a",
          rightPremiseNodeId: "b",
          conclusionText: "",
        },
      ];
      expect(findInferenceEdgesForNode(edges, "a")).toHaveLength(1);
    });

    it("finds MP edges where node is right premise", () => {
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "mp",
          conclusionNodeId: "mp-1",
          leftPremiseNodeId: "a",
          rightPremiseNodeId: "b",
          conclusionText: "",
        },
      ];
      expect(findInferenceEdgesForNode(edges, "b")).toHaveLength(1);
    });

    it("finds Gen edges where node is premise", () => {
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "gen",
          conclusionNodeId: "gen-1",
          premiseNodeId: "a",
          variableName: "x",
          conclusionText: "",
        },
      ];
      expect(findInferenceEdgesForNode(edges, "a")).toHaveLength(1);
    });

    it("finds Substitution edges where node is premise", () => {
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "substitution",
          conclusionNodeId: "subst-1",
          premiseNodeId: "a",
          entries: [],
          conclusionText: "",
        },
      ];
      expect(findInferenceEdgesForNode(edges, "a")).toHaveLength(1);
    });

    it("finds multiple edges involving the same node", () => {
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "mp",
          conclusionNodeId: "mp-1",
          leftPremiseNodeId: "a",
          rightPremiseNodeId: "b",
          conclusionText: "",
        },
        {
          _tag: "gen",
          conclusionNodeId: "gen-1",
          premiseNodeId: "a",
          variableName: "x",
          conclusionText: "",
        },
        {
          _tag: "substitution",
          conclusionNodeId: "subst-1",
          premiseNodeId: "c",
          entries: [],
          conclusionText: "",
        },
      ];
      // "a" is referenced in both MP (as left premise) and Gen (as premise)
      expect(findInferenceEdgesForNode(edges, "a")).toHaveLength(2);
    });

    it("handles undefined premise node IDs correctly", () => {
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "mp",
          conclusionNodeId: "mp-1",
          leftPremiseNodeId: undefined,
          rightPremiseNodeId: undefined,
          conclusionText: "",
        },
        {
          _tag: "gen",
          conclusionNodeId: "gen-1",
          premiseNodeId: undefined,
          variableName: "x",
          conclusionText: "",
        },
      ];
      // Only the rule node itself should match
      expect(findInferenceEdgesForNode(edges, "mp-1")).toHaveLength(1);
      expect(findInferenceEdgesForNode(edges, "gen-1")).toHaveLength(1);
      // undefined premises should not match any node
      expect(findInferenceEdgesForNode(edges, "undefined")).toEqual([]);
    });
  });

  describe("getInferenceEdgeConclusionNodeId", () => {
    it("returns conclusionNodeId for MP edge", () => {
      const edge: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "mp-1",
        leftPremiseNodeId: "a",
        rightPremiseNodeId: "b",
        conclusionText: "psi",
      };
      expect(getInferenceEdgeConclusionNodeId(edge)).toBe("mp-1");
    });

    it("returns conclusionNodeId for Gen edge", () => {
      const edge: GenEdge = {
        _tag: "gen",
        conclusionNodeId: "gen-1",
        premiseNodeId: "a",
        variableName: "x",
        conclusionText: "∀x.φ",
      };
      expect(getInferenceEdgeConclusionNodeId(edge)).toBe("gen-1");
    });

    it("returns conclusionNodeId for Substitution edge", () => {
      const edge: SubstitutionEdge = {
        _tag: "substitution",
        conclusionNodeId: "subst-1",
        premiseNodeId: "a",
        entries: [],
        conclusionText: "p -> p",
      };
      expect(getInferenceEdgeConclusionNodeId(edge)).toBe("subst-1");
    });
  });

  describe("getInferenceEdgePremiseNodeIds", () => {
    it("returns both premises for MP edge", () => {
      const edge: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "mp-1",
        leftPremiseNodeId: "a",
        rightPremiseNodeId: "b",
        conclusionText: "",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual(["a", "b"]);
    });

    it("returns only left premise when right is undefined for MP edge", () => {
      const edge: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "mp-1",
        leftPremiseNodeId: "a",
        rightPremiseNodeId: undefined,
        conclusionText: "",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual(["a"]);
    });

    it("returns only right premise when left is undefined for MP edge", () => {
      const edge: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "mp-1",
        leftPremiseNodeId: undefined,
        rightPremiseNodeId: "b",
        conclusionText: "",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual(["b"]);
    });

    it("returns empty array when both premises are undefined for MP edge", () => {
      const edge: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "mp-1",
        leftPremiseNodeId: undefined,
        rightPremiseNodeId: undefined,
        conclusionText: "",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual([]);
    });

    it("returns premise for Gen edge", () => {
      const edge: GenEdge = {
        _tag: "gen",
        conclusionNodeId: "gen-1",
        premiseNodeId: "a",
        variableName: "x",
        conclusionText: "",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual(["a"]);
    });

    it("returns empty array when premise is undefined for Gen edge", () => {
      const edge: GenEdge = {
        _tag: "gen",
        conclusionNodeId: "gen-1",
        premiseNodeId: undefined,
        variableName: "x",
        conclusionText: "",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual([]);
    });

    it("returns premise for Substitution edge", () => {
      const edge: SubstitutionEdge = {
        _tag: "substitution",
        conclusionNodeId: "subst-1",
        premiseNodeId: "a",
        entries: [],
        conclusionText: "",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual(["a"]);
    });

    it("returns empty array when premise is undefined for Substitution edge", () => {
      const edge: SubstitutionEdge = {
        _tag: "substitution",
        conclusionNodeId: "subst-1",
        premiseNodeId: undefined,
        entries: [],
        conclusionText: "",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual([]);
    });
  });
});
