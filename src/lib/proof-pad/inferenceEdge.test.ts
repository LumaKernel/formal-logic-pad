import { describe, expect, it } from "vitest";
import {
  findInferenceEdgesForNode,
  findInferenceEdgeForConclusionNode,
  getInferenceEdgeConclusionNodeId,
  getInferenceEdgeLabel,
  getInferenceEdgePremiseNodeIds,
  remapEdgeNodeIds,
  replaceNodeIdInEdge,
  isHilbertInferenceEdge,
  isNdInferenceEdge,
  isTabInferenceEdge,
  type InferenceEdge,
  type MPEdge,
  type GenEdge,
  type SubstitutionEdge,
  type NdImplicationIntroEdge,
  type NdImplicationElimEdge,
  type NdConjunctionIntroEdge,
  type NdConjunctionElimLeftEdge,
  type NdConjunctionElimRightEdge,
  type NdDisjunctionIntroLeftEdge,
  type NdDisjunctionIntroRightEdge,
  type NdDisjunctionElimEdge,
  type NdWeakeningEdge,
  type NdEfqEdge,
  type NdDneEdge,
  type NdUniversalIntroEdge,
  type NdUniversalElimEdge,
  type NdExistentialIntroEdge,
  type NdExistentialElimEdge,
  type TabSinglePremiseEdge,
  type TabBranchingEdge,
  type TabAxiomEdge,
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

  // ─── ND エッジのテストフィクスチャ ────────────────────────

  const ndImplicationIntro: NdImplicationIntroEdge = {
    _tag: "nd-implication-intro",
    conclusionNodeId: "c1",
    premiseNodeId: "p1",
    dischargedFormulaText: "A",
    dischargedAssumptionId: 1,
    conclusionText: "A → B",
  };

  const ndImplicationElim: NdImplicationElimEdge = {
    _tag: "nd-implication-elim",
    conclusionNodeId: "c2",
    leftPremiseNodeId: "p2",
    rightPremiseNodeId: "p3",
    conclusionText: "B",
  };

  const ndConjunctionIntro: NdConjunctionIntroEdge = {
    _tag: "nd-conjunction-intro",
    conclusionNodeId: "c3",
    leftPremiseNodeId: "p4",
    rightPremiseNodeId: "p5",
    conclusionText: "A ∧ B",
  };

  const ndConjunctionElimLeft: NdConjunctionElimLeftEdge = {
    _tag: "nd-conjunction-elim-left",
    conclusionNodeId: "c4",
    premiseNodeId: "p6",
    conclusionText: "A",
  };

  const ndConjunctionElimRight: NdConjunctionElimRightEdge = {
    _tag: "nd-conjunction-elim-right",
    conclusionNodeId: "c5",
    premiseNodeId: "p7",
    conclusionText: "B",
  };

  const ndDisjunctionIntroLeft: NdDisjunctionIntroLeftEdge = {
    _tag: "nd-disjunction-intro-left",
    conclusionNodeId: "c6",
    premiseNodeId: "p8",
    addedRightText: "B",
    conclusionText: "A ∨ B",
  };

  const ndDisjunctionIntroRight: NdDisjunctionIntroRightEdge = {
    _tag: "nd-disjunction-intro-right",
    conclusionNodeId: "c7",
    premiseNodeId: "p9",
    addedLeftText: "A",
    conclusionText: "A ∨ B",
  };

  const ndDisjunctionElim: NdDisjunctionElimEdge = {
    _tag: "nd-disjunction-elim",
    conclusionNodeId: "c8",
    disjunctionPremiseNodeId: "p10",
    leftCasePremiseNodeId: "p11",
    leftDischargedAssumptionId: 2,
    rightCasePremiseNodeId: "p12",
    rightDischargedAssumptionId: 3,
    conclusionText: "C",
  };

  const ndWeakening: NdWeakeningEdge = {
    _tag: "nd-weakening",
    conclusionNodeId: "c9",
    keptPremiseNodeId: "p13",
    discardedPremiseNodeId: "p14",
    conclusionText: "A",
  };

  const ndEfq: NdEfqEdge = {
    _tag: "nd-efq",
    conclusionNodeId: "c10",
    premiseNodeId: "p15",
    conclusionText: "A",
  };

  const ndDne: NdDneEdge = {
    _tag: "nd-dne",
    conclusionNodeId: "c11",
    premiseNodeId: "p16",
    conclusionText: "A",
  };

  const ndUniversalIntro: NdUniversalIntroEdge = {
    _tag: "nd-universal-intro",
    conclusionNodeId: "c12",
    premiseNodeId: "p17",
    variableName: "x",
    conclusionText: "∀x.A",
  };

  const ndUniversalElim: NdUniversalElimEdge = {
    _tag: "nd-universal-elim",
    conclusionNodeId: "c13",
    premiseNodeId: "p18",
    termText: "y",
    conclusionText: "A(y)",
  };

  const ndExistentialIntro: NdExistentialIntroEdge = {
    _tag: "nd-existential-intro",
    conclusionNodeId: "c14",
    premiseNodeId: "p19",
    variableName: "x",
    termText: "y",
    conclusionText: "∃x.A",
  };

  const ndExistentialElim: NdExistentialElimEdge = {
    _tag: "nd-existential-elim",
    conclusionNodeId: "c15",
    existentialPremiseNodeId: "p20",
    casePremiseNodeId: "p21",
    dischargedAssumptionId: 4,
    dischargedFormulaText: "A(x)",
    conclusionText: "B",
  };

  const allNdEdges: readonly InferenceEdge[] = [
    ndImplicationIntro,
    ndImplicationElim,
    ndConjunctionIntro,
    ndConjunctionElimLeft,
    ndConjunctionElimRight,
    ndDisjunctionIntroLeft,
    ndDisjunctionIntroRight,
    ndDisjunctionElim,
    ndWeakening,
    ndEfq,
    ndDne,
    ndUniversalIntro,
    ndUniversalElim,
    ndExistentialIntro,
    ndExistentialElim,
  ];

  // ─── isHilbertInferenceEdge / isNdInferenceEdge ──────────

  describe("isHilbertInferenceEdge", () => {
    it("returns true for MP edge", () => {
      const edge: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "mp-1",
        leftPremiseNodeId: "a",
        rightPremiseNodeId: "b",
        conclusionText: "",
      };
      expect(isHilbertInferenceEdge(edge)).toBe(true);
    });

    it("returns true for Gen edge", () => {
      const edge: GenEdge = {
        _tag: "gen",
        conclusionNodeId: "gen-1",
        premiseNodeId: "a",
        variableName: "x",
        conclusionText: "",
      };
      expect(isHilbertInferenceEdge(edge)).toBe(true);
    });

    it("returns true for Substitution edge", () => {
      const edge: SubstitutionEdge = {
        _tag: "substitution",
        conclusionNodeId: "subst-1",
        premiseNodeId: "a",
        entries: [],
        conclusionText: "",
      };
      expect(isHilbertInferenceEdge(edge)).toBe(true);
    });

    it("returns false for all ND edges", () => {
      for (const edge of allNdEdges) {
        expect(isHilbertInferenceEdge(edge)).toBe(false);
      }
    });
  });

  describe("isNdInferenceEdge", () => {
    it("returns false for Hilbert edges", () => {
      const hilbertEdges: readonly InferenceEdge[] = [
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
          premiseNodeId: "a",
          entries: [],
          conclusionText: "",
        },
      ];
      for (const edge of hilbertEdges) {
        expect(isNdInferenceEdge(edge)).toBe(false);
      }
    });

    it("returns true for all ND edges", () => {
      for (const edge of allNdEdges) {
        expect(isNdInferenceEdge(edge)).toBe(true);
      }
    });
  });

  // ─── ND getInferenceEdgeLabel ─────────────────────────────

  describe("getInferenceEdgeLabel (ND)", () => {
    it.each([
      { edge: ndImplicationIntro, expected: "→I" },
      { edge: ndImplicationElim, expected: "→E" },
      { edge: ndConjunctionIntro, expected: "∧I" },
      { edge: ndConjunctionElimLeft, expected: "∧E_L" },
      { edge: ndConjunctionElimRight, expected: "∧E_R" },
      { edge: ndDisjunctionIntroLeft, expected: "∨I_L" },
      { edge: ndDisjunctionIntroRight, expected: "∨I_R" },
      { edge: ndDisjunctionElim, expected: "∨E" },
      { edge: ndWeakening, expected: "w" },
      { edge: ndEfq, expected: "EFQ" },
      { edge: ndDne, expected: "DNE" },
      { edge: ndUniversalIntro, expected: "∀I(x)" },
      { edge: ndUniversalElim, expected: "∀E(y)" },
      { edge: ndExistentialIntro, expected: "∃I(x)" },
      { edge: ndExistentialElim, expected: "∃E" },
    ] as const)("returns '$expected' for $edge._tag", ({ edge, expected }) => {
      expect(getInferenceEdgeLabel(edge)).toBe(expected);
    });
  });

  // ─── ND getInferenceEdgePremiseNodeIds ────────────────────

  describe("getInferenceEdgePremiseNodeIds (ND)", () => {
    describe("1-premise ND edges", () => {
      it.each([
        { name: "→I", edge: ndImplicationIntro, expected: ["p1"] },
        { name: "∧E_L", edge: ndConjunctionElimLeft, expected: ["p6"] },
        { name: "∧E_R", edge: ndConjunctionElimRight, expected: ["p7"] },
        { name: "∨I_L", edge: ndDisjunctionIntroLeft, expected: ["p8"] },
        { name: "∨I_R", edge: ndDisjunctionIntroRight, expected: ["p9"] },
        { name: "EFQ", edge: ndEfq, expected: ["p15"] },
        { name: "DNE", edge: ndDne, expected: ["p16"] },
      ] as const)("returns premise for $name edge", ({ edge, expected }) => {
        expect(getInferenceEdgePremiseNodeIds(edge)).toEqual(expected);
      });

      it("returns empty for 1-premise edge with undefined premise", () => {
        const edge: NdDneEdge = {
          _tag: "nd-dne",
          conclusionNodeId: "c",
          premiseNodeId: undefined,
          conclusionText: "A",
        };
        expect(getInferenceEdgePremiseNodeIds(edge)).toEqual([]);
      });
    });

    describe("2-premise ND edges", () => {
      it("returns both premises for →E edge", () => {
        expect(getInferenceEdgePremiseNodeIds(ndImplicationElim)).toEqual([
          "p2",
          "p3",
        ]);
      });

      it("returns both premises for ∧I edge", () => {
        expect(getInferenceEdgePremiseNodeIds(ndConjunctionIntro)).toEqual([
          "p4",
          "p5",
        ]);
      });

      it("returns both premises for w edge", () => {
        expect(getInferenceEdgePremiseNodeIds(ndWeakening)).toEqual([
          "p13",
          "p14",
        ]);
      });

      it("handles undefined premises for 2-premise edge", () => {
        const edge: NdImplicationElimEdge = {
          _tag: "nd-implication-elim",
          conclusionNodeId: "c",
          leftPremiseNodeId: undefined,
          rightPremiseNodeId: "p",
          conclusionText: "",
        };
        expect(getInferenceEdgePremiseNodeIds(edge)).toEqual(["p"]);
      });
    });

    describe("3-premise ND edges", () => {
      it("returns all three premises for ∨E edge", () => {
        expect(getInferenceEdgePremiseNodeIds(ndDisjunctionElim)).toEqual([
          "p10",
          "p11",
          "p12",
        ]);
      });

      it("handles partial undefined premises for ∨E edge", () => {
        const edge: NdDisjunctionElimEdge = {
          _tag: "nd-disjunction-elim",
          conclusionNodeId: "c",
          disjunctionPremiseNodeId: undefined,
          leftCasePremiseNodeId: "p1",
          leftDischargedAssumptionId: 1,
          rightCasePremiseNodeId: undefined,
          rightDischargedAssumptionId: 2,
          conclusionText: "",
        };
        expect(getInferenceEdgePremiseNodeIds(edge)).toEqual(["p1"]);
      });
    });
  });

  // ─── ND getInferenceEdgeConclusionNodeId ──────────────────

  describe("getInferenceEdgeConclusionNodeId (ND)", () => {
    it("returns conclusionNodeId for all ND edge types", () => {
      for (const edge of allNdEdges) {
        expect(getInferenceEdgeConclusionNodeId(edge)).toBe(
          edge.conclusionNodeId,
        );
      }
    });
  });

  // ─── ND findInferenceEdgesForNode ─────────────────────────

  describe("findInferenceEdgesForNode (ND)", () => {
    it("finds ND edge where node is conclusion", () => {
      expect(findInferenceEdgesForNode(allNdEdges, "c1")).toHaveLength(1);
    });

    it("finds ND edge where node is premise", () => {
      expect(findInferenceEdgesForNode(allNdEdges, "p1")).toHaveLength(1);
    });

    it("finds ∨E edge by any of its three premises", () => {
      expect(
        findInferenceEdgesForNode([ndDisjunctionElim], "p10"),
      ).toHaveLength(1);
      expect(
        findInferenceEdgesForNode([ndDisjunctionElim], "p11"),
      ).toHaveLength(1);
      expect(
        findInferenceEdgesForNode([ndDisjunctionElim], "p12"),
      ).toHaveLength(1);
    });

    it("finds w edge by kept or discarded premise", () => {
      expect(findInferenceEdgesForNode([ndWeakening], "p13")).toHaveLength(1);
      expect(findInferenceEdgesForNode([ndWeakening], "p14")).toHaveLength(1);
    });
  });

  // ─── remapEdgeNodeIds ─────────────────────────────────────

  describe("remapEdgeNodeIds", () => {
    const mapFn = (id: string): string | undefined =>
      id.startsWith("p")
        ? `new-${id satisfies string}`
        : id.startsWith("c")
          ? `new-${id satisfies string}`
          : undefined;

    it("remaps MP edge node IDs", () => {
      const edge: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "c1",
        leftPremiseNodeId: "p1",
        rightPremiseNodeId: "p2",
        conclusionText: "ψ",
      };
      const result = remapEdgeNodeIds(edge, mapFn);
      expect(result).toEqual({
        ...edge,
        conclusionNodeId: "new-c1",
        leftPremiseNodeId: "new-p1",
        rightPremiseNodeId: "new-p2",
      });
    });

    it("remaps Gen edge node IDs", () => {
      const edge: GenEdge = {
        _tag: "gen",
        conclusionNodeId: "c1",
        premiseNodeId: "p1",
        variableName: "x",
        conclusionText: "∀x.φ",
      };
      const result = remapEdgeNodeIds(edge, mapFn);
      expect(result).toEqual({
        ...edge,
        conclusionNodeId: "new-c1",
        premiseNodeId: "new-p1",
      });
    });

    it("remaps Substitution edge node IDs", () => {
      const edge: SubstitutionEdge = {
        _tag: "substitution",
        conclusionNodeId: "c1",
        premiseNodeId: "p1",
        entries: [],
        conclusionText: "p → p",
      };
      const result = remapEdgeNodeIds(edge, mapFn);
      expect(result).toEqual({
        ...edge,
        conclusionNodeId: "new-c1",
        premiseNodeId: "new-p1",
      });
    });

    it("remaps 1-premise ND edge (→I)", () => {
      const result = remapEdgeNodeIds(ndImplicationIntro, mapFn);
      expect(result).toEqual({
        ...ndImplicationIntro,
        conclusionNodeId: "new-c1",
        premiseNodeId: "new-p1",
      });
    });

    it("remaps 2-premise ND edge (→E)", () => {
      const result = remapEdgeNodeIds(ndImplicationElim, mapFn);
      expect(result).toEqual({
        ...ndImplicationElim,
        conclusionNodeId: "new-c2",
        leftPremiseNodeId: "new-p2",
        rightPremiseNodeId: "new-p3",
      });
    });

    it("remaps w edge with named premise fields", () => {
      const result = remapEdgeNodeIds(ndWeakening, mapFn);
      expect(result).toEqual({
        ...ndWeakening,
        conclusionNodeId: "new-c9",
        keptPremiseNodeId: "new-p13",
        discardedPremiseNodeId: "new-p14",
      });
    });

    it("remaps 3-premise ND edge (∨E)", () => {
      const result = remapEdgeNodeIds(ndDisjunctionElim, mapFn);
      expect(result).toEqual({
        ...ndDisjunctionElim,
        conclusionNodeId: "new-c8",
        disjunctionPremiseNodeId: "new-p10",
        leftCasePremiseNodeId: "new-p11",
        rightCasePremiseNodeId: "new-p12",
      });
    });

    it("sets premise to undefined when mapFn returns undefined", () => {
      const alwaysUndefined = (): string | undefined => undefined;
      const result = remapEdgeNodeIds(ndImplicationElim, alwaysUndefined);
      expect(result).toEqual({
        ...ndImplicationElim,
        // conclusionNodeId keeps original (mapRequired fallback)
        conclusionNodeId: "c2",
        leftPremiseNodeId: undefined,
        rightPremiseNodeId: undefined,
      });
    });

    it("handles undefined premise fields gracefully", () => {
      const edge: NdImplicationIntroEdge = {
        _tag: "nd-implication-intro",
        conclusionNodeId: "c1",
        premiseNodeId: undefined,
        dischargedFormulaText: "A",
        dischargedAssumptionId: 1,
        conclusionText: "A → B",
      };
      const result = remapEdgeNodeIds(edge, mapFn);
      expect(result).toEqual({
        ...edge,
        conclusionNodeId: "new-c1",
        premiseNodeId: undefined,
      });
    });

    it("remaps all 1-premise ND edge types", () => {
      const onePremiseEdges: readonly InferenceEdge[] = [
        ndConjunctionElimLeft,
        ndConjunctionElimRight,
        ndDisjunctionIntroLeft,
        ndDisjunctionIntroRight,
        ndEfq,
        ndDne,
      ];
      for (const edge of onePremiseEdges) {
        const result = remapEdgeNodeIds(edge, mapFn);
        expect(result.conclusionNodeId).toMatch(/^new-/);
        // premiseNodeId は全て remapped されるはず
        const premiseIds = getInferenceEdgePremiseNodeIds(result);
        for (const id of premiseIds) {
          expect(id).toMatch(/^new-/);
        }
      }
    });

    it("remaps ∧I edge (2-premise)", () => {
      const result = remapEdgeNodeIds(ndConjunctionIntro, mapFn);
      expect(result).toEqual({
        ...ndConjunctionIntro,
        conclusionNodeId: "new-c3",
        leftPremiseNodeId: "new-p4",
        rightPremiseNodeId: "new-p5",
      });
    });

    it("remaps ∀I edge", () => {
      const result = remapEdgeNodeIds(ndUniversalIntro, mapFn);
      expect(result).toEqual({
        ...ndUniversalIntro,
        conclusionNodeId: "new-c12",
        premiseNodeId: "new-p17",
      });
    });

    it("remaps ∀E edge", () => {
      const result = remapEdgeNodeIds(ndUniversalElim, mapFn);
      expect(result).toEqual({
        ...ndUniversalElim,
        conclusionNodeId: "new-c13",
        premiseNodeId: "new-p18",
      });
    });

    it("remaps ∃I edge", () => {
      const result = remapEdgeNodeIds(ndExistentialIntro, mapFn);
      expect(result).toEqual({
        ...ndExistentialIntro,
        conclusionNodeId: "new-c14",
        premiseNodeId: "new-p19",
      });
    });

    it("remaps ∃E edge", () => {
      const result = remapEdgeNodeIds(ndExistentialElim, mapFn);
      expect(result).toEqual({
        ...ndExistentialElim,
        conclusionNodeId: "new-c15",
        existentialPremiseNodeId: "new-p20",
        casePremiseNodeId: "new-p21",
      });
    });
  });

  // ─── replaceNodeIdInEdge ──────────────────────────────────

  describe("replaceNodeIdInEdge", () => {
    it("replaces old ID with new ID in conclusion", () => {
      const result = replaceNodeIdInEdge(ndImplicationIntro, "c1", "new-c");
      expect(result.conclusionNodeId).toBe("new-c");
    });

    it("replaces old ID with new ID in premise", () => {
      const result = replaceNodeIdInEdge(ndImplicationIntro, "p1", "new-p");
      expect(result).toEqual({
        ...ndImplicationIntro,
        premiseNodeId: "new-p",
      });
    });

    it("does not change IDs that do not match", () => {
      const result = replaceNodeIdInEdge(ndImplicationIntro, "unknown", "x");
      expect(result).toEqual(ndImplicationIntro);
    });

    it("replaces in 3-premise ∨E edge", () => {
      const result = replaceNodeIdInEdge(ndDisjunctionElim, "p11", "new-p11");
      expect(result).toEqual({
        ...ndDisjunctionElim,
        leftCasePremiseNodeId: "new-p11",
      });
    });
  });

  // --- TAB エッジテスト ---

  describe("isTabInferenceEdge", () => {
    const tabSingle: TabSinglePremiseEdge = {
      _tag: "tab-single",
      ruleId: "double-negation",
      conclusionNodeId: "c1",
      premiseNodeId: "p1",
      conclusionText: "¬¬φ",
    };
    const tabBranching: TabBranchingEdge = {
      _tag: "tab-branching",
      ruleId: "neg-conjunction",
      conclusionNodeId: "c1",
      leftPremiseNodeId: "p1",
      rightPremiseNodeId: "p2",
      leftConclusionText: "¬φ",
      rightConclusionText: "¬ψ",
      conclusionText: "¬(φ∧ψ)",
    };
    const tabAxiom: TabAxiomEdge = {
      _tag: "tab-axiom",
      ruleId: "bs",
      conclusionNodeId: "c1",
      conclusionText: "¬φ, φ",
    };

    it("TABエッジを正しく判定する", () => {
      expect(isTabInferenceEdge(tabSingle)).toBe(true);
      expect(isTabInferenceEdge(tabBranching)).toBe(true);
      expect(isTabInferenceEdge(tabAxiom)).toBe(true);
    });

    it("非TABエッジを正しく判定する", () => {
      const mpEdge: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "c1",
        leftPremiseNodeId: "p1",
        rightPremiseNodeId: "p2",
        conclusionText: "",
      };
      expect(isTabInferenceEdge(mpEdge)).toBe(false);
      expect(isHilbertInferenceEdge(tabSingle)).toBe(false);
      expect(isNdInferenceEdge(tabSingle)).toBe(false);
    });

    describe("getInferenceEdgeLabel for TAB edges", () => {
      it("returns display name for tab-single", () => {
        expect(getInferenceEdgeLabel(tabSingle)).toBe("¬¬");
      });

      it("returns display name for tab-branching", () => {
        expect(getInferenceEdgeLabel(tabBranching)).toBe("¬∧");
      });

      it("returns display name for tab-axiom", () => {
        expect(getInferenceEdgeLabel(tabAxiom)).toBe("BS");
      });
    });

    describe("getInferenceEdgePremiseNodeIds for TAB edges", () => {
      it("returns premise for tab-single", () => {
        expect(getInferenceEdgePremiseNodeIds(tabSingle)).toEqual(["p1"]);
      });

      it("returns empty for tab-single with undefined premise", () => {
        const edge: TabSinglePremiseEdge = {
          ...tabSingle,
          premiseNodeId: undefined,
        };
        expect(getInferenceEdgePremiseNodeIds(edge)).toEqual([]);
      });

      it("returns both premises for tab-branching", () => {
        expect(getInferenceEdgePremiseNodeIds(tabBranching)).toEqual([
          "p1",
          "p2",
        ]);
      });

      it("returns empty for tab-axiom", () => {
        expect(getInferenceEdgePremiseNodeIds(tabAxiom)).toEqual([]);
      });
    });

    describe("remapEdgeNodeIds for TAB edges", () => {
      it("remaps tab-single edge node IDs", () => {
        const result = remapEdgeNodeIds(
          tabSingle,
          (id) => `new-${id satisfies string}`,
        );
        expect(result).toEqual({
          ...tabSingle,
          conclusionNodeId: "new-c1",
          premiseNodeId: "new-p1",
        });
      });

      it("remaps tab-branching edge node IDs", () => {
        const result = remapEdgeNodeIds(
          tabBranching,
          (id) => `new-${id satisfies string}`,
        );
        expect(result).toEqual({
          ...tabBranching,
          conclusionNodeId: "new-c1",
          leftPremiseNodeId: "new-p1",
          rightPremiseNodeId: "new-p2",
        });
      });

      it("remaps tab-axiom edge node IDs", () => {
        const result = remapEdgeNodeIds(
          tabAxiom,
          (id) => `new-${id satisfies string}`,
        );
        expect(result).toEqual({
          ...tabAxiom,
          conclusionNodeId: "new-c1",
        });
      });
    });
  });
});
