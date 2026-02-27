import { describe, expect, it } from "vitest";
import {
  findInferenceEdgesForNode,
  findInferenceEdgeForConclusionNode,
  getInferenceEdgeConclusionNodeId,
  getInferenceEdgeLabel,
  getInferenceEdgePremiseNodeIds,
  type InferenceEdge,
  type MPEdge,
  type GenEdge,
  type SubstitutionEdge,
} from "./inferenceEdge";

describe("inferenceEdge", () => {
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

  describe("getInferenceEdgeLabel", () => {
    it("returns 'MP' for MP edge", () => {
      const edge: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "mp-1",
        leftPremiseNodeId: "a",
        rightPremiseNodeId: "b",
        conclusionText: "",
      };
      expect(getInferenceEdgeLabel(edge)).toBe("MP");
    });

    it("returns 'Gen(x)' for Gen edge with variable name", () => {
      const edge: GenEdge = {
        _tag: "gen",
        conclusionNodeId: "gen-1",
        premiseNodeId: "a",
        variableName: "x",
        conclusionText: "",
      };
      expect(getInferenceEdgeLabel(edge)).toBe("Gen(x)");
    });

    it("returns 'Gen' for Gen edge with empty variable name", () => {
      const edge: GenEdge = {
        _tag: "gen",
        conclusionNodeId: "gen-1",
        premiseNodeId: "a",
        variableName: "",
        conclusionText: "",
      };
      expect(getInferenceEdgeLabel(edge)).toBe("Gen");
    });

    it("returns 'Subst(N)' for Substitution edge with entries", () => {
      const edge: SubstitutionEdge = {
        _tag: "substitution",
        conclusionNodeId: "subst-1",
        premiseNodeId: "a",
        entries: [
          {
            _tag: "FormulaSubstitution",
            metaVariableName: "φ",
            formulaText: "p → q",
          },
          {
            _tag: "FormulaSubstitution",
            metaVariableName: "ψ",
            formulaText: "r",
          },
        ],
        conclusionText: "",
      };
      expect(getInferenceEdgeLabel(edge)).toBe("Subst(2)");
    });

    it("returns 'Subst' for Substitution edge with empty entries", () => {
      const edge: SubstitutionEdge = {
        _tag: "substitution",
        conclusionNodeId: "subst-1",
        premiseNodeId: "a",
        entries: [],
        conclusionText: "",
      };
      expect(getInferenceEdgeLabel(edge)).toBe("Subst");
    });
  });

  describe("findInferenceEdgeForConclusionNode", () => {
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
        premiseNodeId: "c",
        variableName: "x",
        conclusionText: "",
      },
    ];

    it("finds MP edge by conclusion node ID", () => {
      const result = findInferenceEdgeForConclusionNode(edges, "mp-1");
      expect(result).toBeDefined();
      expect(result?._tag).toBe("mp");
    });

    it("finds Gen edge by conclusion node ID", () => {
      const result = findInferenceEdgeForConclusionNode(edges, "gen-1");
      expect(result).toBeDefined();
      expect(result?._tag).toBe("gen");
    });

    it("returns undefined for non-existent conclusion node ID", () => {
      const result = findInferenceEdgeForConclusionNode(edges, "unknown");
      expect(result).toBeUndefined();
    });
  });
});
