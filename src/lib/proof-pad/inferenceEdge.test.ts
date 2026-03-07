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
  isAtInferenceEdge,
  isScInferenceEdge,
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
  type AtAlphaEdge,
  type AtBetaEdge,
  type AtGammaEdge,
  type AtDeltaEdge,
  type AtClosedEdge,
  type ScSinglePremiseEdge,
  type ScBranchingEdge,
  type ScAxiomEdge,
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

    it("returns '∀I' for nd-universal-intro with empty variableName", () => {
      const edge: NdUniversalIntroEdge = {
        _tag: "nd-universal-intro",
        conclusionNodeId: "c",
        premiseNodeId: "p",
        variableName: "",
        conclusionText: "",
      };
      expect(getInferenceEdgeLabel(edge)).toBe("∀I");
    });

    it("returns '∀E' for nd-universal-elim with empty termText", () => {
      const edge: NdUniversalElimEdge = {
        _tag: "nd-universal-elim",
        conclusionNodeId: "c",
        premiseNodeId: "p",
        termText: "",
        conclusionText: "",
      };
      expect(getInferenceEdgeLabel(edge)).toBe("∀E");
    });

    it("returns '∃I' for nd-existential-intro with empty variableName", () => {
      const edge: NdExistentialIntroEdge = {
        _tag: "nd-existential-intro",
        conclusionNodeId: "c",
        premiseNodeId: "p",
        variableName: "",
        termText: "t",
        conclusionText: "",
      };
      expect(getInferenceEdgeLabel(edge)).toBe("∃I");
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

      it("handles left undefined for →E edge", () => {
        const edge: NdImplicationElimEdge = {
          _tag: "nd-implication-elim",
          conclusionNodeId: "c",
          leftPremiseNodeId: undefined,
          rightPremiseNodeId: "p",
          conclusionText: "",
        };
        expect(getInferenceEdgePremiseNodeIds(edge)).toEqual(["p"]);
      });

      it("handles right undefined for →E edge", () => {
        const edge: NdImplicationElimEdge = {
          _tag: "nd-implication-elim",
          conclusionNodeId: "c",
          leftPremiseNodeId: "p",
          rightPremiseNodeId: undefined,
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

  // ── AT edge tests ──

  describe("isAtInferenceEdge", () => {
    const atAlpha: AtAlphaEdge = {
      _tag: "at-alpha",
      ruleId: "alpha-conj",
      conclusionNodeId: "c1",
      resultNodeId: "r1",
      secondResultNodeId: "r2",
      conclusionText: "T:P ∧ Q",
      resultText: "T:P",
      secondResultText: "T:Q",
    };
    const atBeta: AtBetaEdge = {
      _tag: "at-beta",
      ruleId: "beta-disj",
      conclusionNodeId: "c1",
      leftResultNodeId: "l1",
      rightResultNodeId: "r1",
      conclusionText: "T:P ∨ Q",
      leftResultText: "T:P",
      rightResultText: "T:Q",
    };
    const atGamma: AtGammaEdge = {
      _tag: "at-gamma",
      ruleId: "gamma-univ",
      conclusionNodeId: "c1",
      resultNodeId: "r1",
      conclusionText: "T:∀x.P(x)",
      resultText: "T:P(y)",
      termText: "y",
    };
    const atDelta: AtDeltaEdge = {
      _tag: "at-delta",
      ruleId: "delta-exist",
      conclusionNodeId: "c1",
      resultNodeId: "r1",
      conclusionText: "T:∃x.P(x)",
      resultText: "T:P(z)",
      eigenVariable: "z",
    };
    const atClosed: AtClosedEdge = {
      _tag: "at-closed",
      ruleId: "closure",
      conclusionNodeId: "c1",
      contradictionNodeId: "c2",
      conclusionText: "T:P",
    };

    it("returns true for AT edges", () => {
      expect(isAtInferenceEdge(atAlpha)).toBe(true);
      expect(isAtInferenceEdge(atBeta)).toBe(true);
      expect(isAtInferenceEdge(atGamma)).toBe(true);
      expect(isAtInferenceEdge(atDelta)).toBe(true);
      expect(isAtInferenceEdge(atClosed)).toBe(true);
    });

    it("returns false for non-AT edges", () => {
      const mp: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "c1",
        leftPremiseNodeId: "a",
        rightPremiseNodeId: "b",
        conclusionText: "",
      };
      expect(isAtInferenceEdge(mp)).toBe(false);
      expect(isHilbertInferenceEdge(atAlpha)).toBe(false);
      expect(isNdInferenceEdge(atAlpha)).toBe(false);
      expect(isTabInferenceEdge(atAlpha)).toBe(false);
    });

    describe("getInferenceEdgeLabel for AT edges", () => {
      it("returns display name for at-alpha", () => {
        expect(getInferenceEdgeLabel(atAlpha)).toBe("T(∧)");
      });
      it("returns display name for at-beta", () => {
        expect(getInferenceEdgeLabel(atBeta)).toBe("T(∨)");
      });
      it("returns display name for at-gamma", () => {
        expect(getInferenceEdgeLabel(atGamma)).toBe("T(∀)");
      });
      it("returns display name for at-delta", () => {
        expect(getInferenceEdgeLabel(atDelta)).toBe("T(∃)");
      });
      it("returns display name for at-closed", () => {
        expect(getInferenceEdgeLabel(atClosed)).toBe("×");
      });
    });

    describe("getInferenceEdgePremiseNodeIds for AT edges", () => {
      it("returns result node IDs for at-alpha (2 results)", () => {
        expect(getInferenceEdgePremiseNodeIds(atAlpha)).toEqual(["r1", "r2"]);
      });
      it("returns result node IDs for at-alpha (1 result)", () => {
        const singleAlpha: AtAlphaEdge = {
          ...atAlpha,
          secondResultNodeId: undefined,
        };
        expect(getInferenceEdgePremiseNodeIds(singleAlpha)).toEqual(["r1"]);
      });
      it("returns result node IDs for at-beta", () => {
        expect(getInferenceEdgePremiseNodeIds(atBeta)).toEqual(["l1", "r1"]);
      });
      it("returns result node IDs for at-gamma", () => {
        expect(getInferenceEdgePremiseNodeIds(atGamma)).toEqual(["r1"]);
      });
      it("returns result node IDs for at-delta", () => {
        expect(getInferenceEdgePremiseNodeIds(atDelta)).toEqual(["r1"]);
      });
      it("returns contradiction node ID for at-closed", () => {
        expect(getInferenceEdgePremiseNodeIds(atClosed)).toEqual(["c2"]);
      });
      it("returns empty for at-alpha with undefined result nodes", () => {
        const noResults: AtAlphaEdge = {
          ...atAlpha,
          resultNodeId: undefined,
          secondResultNodeId: undefined,
        };
        expect(getInferenceEdgePremiseNodeIds(noResults)).toEqual([]);
      });
      it("returns empty for at-beta with undefined result nodes", () => {
        const noResults: AtBetaEdge = {
          ...atBeta,
          leftResultNodeId: undefined,
          rightResultNodeId: undefined,
        };
        expect(getInferenceEdgePremiseNodeIds(noResults)).toEqual([]);
      });
      it("returns empty for at-gamma with undefined result node", () => {
        const noResult: AtGammaEdge = { ...atGamma, resultNodeId: undefined };
        expect(getInferenceEdgePremiseNodeIds(noResult)).toEqual([]);
      });
      it("returns empty for at-delta with undefined result node", () => {
        const noResult: AtDeltaEdge = { ...atDelta, resultNodeId: undefined };
        expect(getInferenceEdgePremiseNodeIds(noResult)).toEqual([]);
      });
    });

    describe("remapEdgeNodeIds for AT edges", () => {
      it("remaps at-alpha edge node IDs", () => {
        const result = remapEdgeNodeIds(
          atAlpha,
          (id) => `new-${id satisfies string}`,
        );
        expect(result).toEqual({
          ...atAlpha,
          conclusionNodeId: "new-c1",
          resultNodeId: "new-r1",
          secondResultNodeId: "new-r2",
        });
      });
      it("remaps at-beta edge node IDs", () => {
        const result = remapEdgeNodeIds(
          atBeta,
          (id) => `new-${id satisfies string}`,
        );
        expect(result).toEqual({
          ...atBeta,
          conclusionNodeId: "new-c1",
          leftResultNodeId: "new-l1",
          rightResultNodeId: "new-r1",
        });
      });
      it("remaps at-gamma edge node IDs", () => {
        const result = remapEdgeNodeIds(
          atGamma,
          (id) => `new-${id satisfies string}`,
        );
        expect(result).toEqual({
          ...atGamma,
          conclusionNodeId: "new-c1",
          resultNodeId: "new-r1",
        });
      });
      it("remaps at-delta edge node IDs", () => {
        const result = remapEdgeNodeIds(
          atDelta,
          (id) => `new-${id satisfies string}`,
        );
        expect(result).toEqual({
          ...atDelta,
          conclusionNodeId: "new-c1",
          resultNodeId: "new-r1",
        });
      });
      it("remaps at-closed edge node IDs", () => {
        const result = remapEdgeNodeIds(
          atClosed,
          (id) => `new-${id satisfies string}`,
        );
        expect(result).toEqual({
          ...atClosed,
          conclusionNodeId: "new-c1",
          contradictionNodeId: "new-c2",
        });
      });
    });
  });

  // ─── undefined前提のブランチカバレッジ追加テスト ─────────

  describe("getInferenceEdgePremiseNodeIds - undefined前提の追加分岐", () => {
    it("handles nd-existential-elim with all undefined premises", () => {
      const edge: NdExistentialElimEdge = {
        _tag: "nd-existential-elim",
        conclusionNodeId: "c",
        existentialPremiseNodeId: undefined,
        casePremiseNodeId: undefined,
        dischargedAssumptionId: 1,
        dischargedFormulaText: "A(x)",
        conclusionText: "",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual([]);
    });

    it("handles nd-existential-elim with only casePremise defined", () => {
      const edge: NdExistentialElimEdge = {
        _tag: "nd-existential-elim",
        conclusionNodeId: "c",
        existentialPremiseNodeId: undefined,
        casePremiseNodeId: "p1",
        dischargedAssumptionId: 1,
        dischargedFormulaText: "A(x)",
        conclusionText: "",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual(["p1"]);
    });

    it("handles nd-disjunction-elim with only leftCase undefined", () => {
      const edge: NdDisjunctionElimEdge = {
        _tag: "nd-disjunction-elim",
        conclusionNodeId: "c",
        disjunctionPremiseNodeId: "p1",
        leftCasePremiseNodeId: undefined,
        leftDischargedAssumptionId: 1,
        rightCasePremiseNodeId: "p2",
        rightDischargedAssumptionId: 2,
        conclusionText: "",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual(["p1", "p2"]);
    });

    it("handles tab-branching with all undefined premises", () => {
      const edge: TabBranchingEdge = {
        _tag: "tab-branching",
        ruleId: "implication",
        conclusionNodeId: "c",
        leftPremiseNodeId: undefined,
        rightPremiseNodeId: undefined,
        leftConclusionText: "",
        rightConclusionText: "",
        conclusionText: "",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual([]);
    });

    it("handles tab-branching with only left premise defined", () => {
      const edge: TabBranchingEdge = {
        _tag: "tab-branching",
        ruleId: "implication",
        conclusionNodeId: "c",
        leftPremiseNodeId: "p1",
        rightPremiseNodeId: undefined,
        leftConclusionText: "",
        rightConclusionText: "",
        conclusionText: "",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual(["p1"]);
    });

    it("handles sc-single with premiseNodeId defined", () => {
      const edge: ScSinglePremiseEdge = {
        _tag: "sc-single",
        ruleId: "weakening-left",
        conclusionNodeId: "c",
        premiseNodeId: "p1",
        conclusionText: "φ ⇒ ψ",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual(["p1"]);
    });

    it("handles sc-single with premiseNodeId undefined", () => {
      const edge: ScSinglePremiseEdge = {
        _tag: "sc-single",
        ruleId: "weakening-left",
        conclusionNodeId: "c",
        premiseNodeId: undefined,
        conclusionText: "φ ⇒ ψ",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual([]);
    });

    it("handles sc-branching with both premises defined", () => {
      const edge: ScBranchingEdge = {
        _tag: "sc-branching",
        ruleId: "cut",
        conclusionNodeId: "c",
        leftPremiseNodeId: "p1",
        rightPremiseNodeId: "p2",
        leftConclusionText: "",
        rightConclusionText: "",
        conclusionText: "",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual(["p1", "p2"]);
    });

    it("handles sc-branching with all undefined premises", () => {
      const edge: ScBranchingEdge = {
        _tag: "sc-branching",
        ruleId: "cut",
        conclusionNodeId: "c",
        leftPremiseNodeId: undefined,
        rightPremiseNodeId: undefined,
        leftConclusionText: "",
        rightConclusionText: "",
        conclusionText: "",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual([]);
    });

    it("handles sc-branching with only left premise defined", () => {
      const edge: ScBranchingEdge = {
        _tag: "sc-branching",
        ruleId: "cut",
        conclusionNodeId: "c",
        leftPremiseNodeId: "p1",
        rightPremiseNodeId: undefined,
        leftConclusionText: "",
        rightConclusionText: "",
        conclusionText: "",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual(["p1"]);
    });

    it("handles sc-axiom with no premises", () => {
      const edge: ScAxiomEdge = {
        _tag: "sc-axiom",
        ruleId: "identity",
        conclusionNodeId: "c",
        conclusionText: "φ ⇒ φ",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual([]);
    });

    // ND 1前提エッジのundefined premise
    it.each([
      {
        name: "nd-implication-intro",
        edge: {
          _tag: "nd-implication-intro",
          conclusionNodeId: "c",
          premiseNodeId: undefined,
          dischargedFormulaText: "A",
          dischargedAssumptionId: 1,
          conclusionText: "",
        } satisfies NdImplicationIntroEdge,
      },
      {
        name: "nd-conjunction-elim-left",
        edge: {
          _tag: "nd-conjunction-elim-left",
          conclusionNodeId: "c",
          premiseNodeId: undefined,
          conclusionText: "",
        } satisfies NdConjunctionElimLeftEdge,
      },
      {
        name: "nd-conjunction-elim-right",
        edge: {
          _tag: "nd-conjunction-elim-right",
          conclusionNodeId: "c",
          premiseNodeId: undefined,
          conclusionText: "",
        } satisfies NdConjunctionElimRightEdge,
      },
      {
        name: "nd-disjunction-intro-left",
        edge: {
          _tag: "nd-disjunction-intro-left",
          conclusionNodeId: "c",
          premiseNodeId: undefined,
          addedRightText: "B",
          conclusionText: "",
        } satisfies NdDisjunctionIntroLeftEdge,
      },
      {
        name: "nd-disjunction-intro-right",
        edge: {
          _tag: "nd-disjunction-intro-right",
          conclusionNodeId: "c",
          premiseNodeId: undefined,
          addedLeftText: "A",
          conclusionText: "",
        } satisfies NdDisjunctionIntroRightEdge,
      },
      {
        name: "nd-efq",
        edge: {
          _tag: "nd-efq",
          conclusionNodeId: "c",
          premiseNodeId: undefined,
          conclusionText: "",
        } satisfies NdEfqEdge,
      },
      {
        name: "nd-universal-intro",
        edge: {
          _tag: "nd-universal-intro",
          conclusionNodeId: "c",
          premiseNodeId: undefined,
          variableName: "x",
          conclusionText: "",
        } satisfies NdUniversalIntroEdge,
      },
      {
        name: "nd-universal-elim",
        edge: {
          _tag: "nd-universal-elim",
          conclusionNodeId: "c",
          premiseNodeId: undefined,
          termText: "t",
          conclusionText: "",
        } satisfies NdUniversalElimEdge,
      },
      {
        name: "nd-existential-intro",
        edge: {
          _tag: "nd-existential-intro",
          conclusionNodeId: "c",
          premiseNodeId: undefined,
          variableName: "x",
          termText: "t",
          conclusionText: "",
        } satisfies NdExistentialIntroEdge,
      },
    ] as const)("handles $name with undefined premise", ({ edge }) => {
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual([]);
    });

    // ND 2前提エッジのundefined premises
    it("handles nd-conjunction-intro with all undefined premises", () => {
      const edge: NdConjunctionIntroEdge = {
        _tag: "nd-conjunction-intro",
        conclusionNodeId: "c",
        leftPremiseNodeId: undefined,
        rightPremiseNodeId: undefined,
        conclusionText: "",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual([]);
    });

    it("handles nd-conjunction-intro with only right premise", () => {
      const edge: NdConjunctionIntroEdge = {
        _tag: "nd-conjunction-intro",
        conclusionNodeId: "c",
        leftPremiseNodeId: undefined,
        rightPremiseNodeId: "p",
        conclusionText: "",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual(["p"]);
    });

    it("handles nd-weakening with all undefined premises", () => {
      const edge: NdWeakeningEdge = {
        _tag: "nd-weakening",
        conclusionNodeId: "c",
        keptPremiseNodeId: undefined,
        discardedPremiseNodeId: undefined,
        conclusionText: "",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual([]);
    });

    it("handles nd-weakening with only discarded premise", () => {
      const edge: NdWeakeningEdge = {
        _tag: "nd-weakening",
        conclusionNodeId: "c",
        keptPremiseNodeId: undefined,
        discardedPremiseNodeId: "p",
        conclusionText: "",
      };
      expect(getInferenceEdgePremiseNodeIds(edge)).toEqual(["p"]);
    });
  });

  describe("isScInferenceEdge", () => {
    const scSingle: ScSinglePremiseEdge = {
      _tag: "sc-single",
      ruleId: "weakening-left",
      conclusionNodeId: "c1",
      premiseNodeId: "p1",
      conclusionText: "φ ⇒ ψ",
    };
    const scBranching: ScBranchingEdge = {
      _tag: "sc-branching",
      ruleId: "cut",
      conclusionNodeId: "c1",
      leftPremiseNodeId: "l1",
      rightPremiseNodeId: "r1",
      leftConclusionText: "",
      rightConclusionText: "",
      conclusionText: "",
    };
    const scAxiom: ScAxiomEdge = {
      _tag: "sc-axiom",
      ruleId: "identity",
      conclusionNodeId: "c1",
      conclusionText: "φ ⇒ φ",
    };

    it("returns true for SC edges", () => {
      expect(isScInferenceEdge(scSingle)).toBe(true);
      expect(isScInferenceEdge(scBranching)).toBe(true);
      expect(isScInferenceEdge(scAxiom)).toBe(true);
    });

    it("returns false for non-SC edges", () => {
      const mp: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "c1",
        leftPremiseNodeId: "a",
        rightPremiseNodeId: "b",
        conclusionText: "",
      };
      expect(isScInferenceEdge(mp)).toBe(false);
      expect(isHilbertInferenceEdge(scSingle)).toBe(false);
      expect(isNdInferenceEdge(scSingle)).toBe(false);
      expect(isTabInferenceEdge(scSingle)).toBe(false);
      expect(isAtInferenceEdge(scSingle)).toBe(false);
    });

    describe("getInferenceEdgeLabel for SC edges", () => {
      it("returns display name for sc-single", () => {
        expect(getInferenceEdgeLabel(scSingle)).toBe("左弱化 (w⇒)");
      });
      it("returns display name for sc-branching", () => {
        expect(getInferenceEdgeLabel(scBranching)).toBe("カット (CUT)");
      });
      it("returns display name for sc-axiom", () => {
        expect(getInferenceEdgeLabel(scAxiom)).toBe("公理 (ID)");
      });
    });

    describe("remapEdgeNodeIds for SC edges", () => {
      it("remaps sc-single edge node ids", () => {
        const mapped = remapEdgeNodeIds(scSingle, (id) =>
          id === "c1" ? "new-c" : id === "p1" ? "new-p" : id,
        );
        expect(mapped).toEqual({
          ...scSingle,
          conclusionNodeId: "new-c",
          premiseNodeId: "new-p",
        });
      });

      it("remaps sc-single edge with undefined premiseNodeId", () => {
        const edge: ScSinglePremiseEdge = {
          ...scSingle,
          premiseNodeId: undefined,
        };
        const mapped = remapEdgeNodeIds(edge, (id) =>
          id === "c1" ? "new-c" : id,
        );
        expect(mapped).toEqual({
          ...edge,
          conclusionNodeId: "new-c",
          premiseNodeId: undefined,
        });
      });

      it("remaps sc-branching edge node ids", () => {
        const mapped = remapEdgeNodeIds(scBranching, (id) =>
          id === "c1"
            ? "new-c"
            : id === "l1"
              ? "new-l"
              : id === "r1"
                ? "new-r"
                : id,
        );
        expect(mapped).toEqual({
          ...scBranching,
          conclusionNodeId: "new-c",
          leftPremiseNodeId: "new-l",
          rightPremiseNodeId: "new-r",
        });
      });

      it("remaps sc-branching edge with undefined premise ids", () => {
        const edge: ScBranchingEdge = {
          ...scBranching,
          leftPremiseNodeId: undefined,
          rightPremiseNodeId: undefined,
        };
        const mapped = remapEdgeNodeIds(edge, (id) =>
          id === "c1" ? "new-c" : id,
        );
        expect(mapped).toEqual({
          ...edge,
          conclusionNodeId: "new-c",
          leftPremiseNodeId: undefined,
          rightPremiseNodeId: undefined,
        });
      });

      it("remaps sc-axiom edge node ids", () => {
        const mapped = remapEdgeNodeIds(scAxiom, (id) =>
          id === "c1" ? "new-c" : id,
        );
        expect(mapped).toEqual({
          ...scAxiom,
          conclusionNodeId: "new-c",
        });
      });
    });

    describe("replaceNodeIdInEdge for SC edges", () => {
      it("replaces conclusionNodeId in sc-single", () => {
        const replaced = replaceNodeIdInEdge(scSingle, "c1", "replaced");
        expect(replaced.conclusionNodeId).toBe("replaced");
      });

      it("replaces premiseNodeId in sc-single", () => {
        const replaced = replaceNodeIdInEdge(scSingle, "p1", "replaced");
        expect((replaced as ScSinglePremiseEdge).premiseNodeId).toBe(
          "replaced",
        );
      });

      it("replaces leftPremiseNodeId in sc-branching", () => {
        const replaced = replaceNodeIdInEdge(scBranching, "l1", "replaced");
        expect((replaced as ScBranchingEdge).leftPremiseNodeId).toBe(
          "replaced",
        );
      });

      it("replaces rightPremiseNodeId in sc-branching", () => {
        const replaced = replaceNodeIdInEdge(scBranching, "r1", "replaced");
        expect((replaced as ScBranchingEdge).rightPremiseNodeId).toBe(
          "replaced",
        );
      });

      it("replaces conclusionNodeId in sc-axiom", () => {
        const replaced = replaceNodeIdInEdge(scAxiom, "c1", "replaced");
        expect(replaced.conclusionNodeId).toBe("replaced");
      });
    });
  });
});
