import { describe, expect, it } from "vitest";
import {
  getInferenceEdgeBadgeColor,
  computeInferenceEdgeLabelData,
  getPremiseRole,
  getInferenceEdgeLabelForConnection,
  computeInferenceEdgeLabelDataForConnection,
} from "./inferenceEdgeLabelLogic";
import type {
  MPEdge,
  GenEdge,
  SubstitutionEdge,
  NdInferenceEdge,
  NdImplicationElimEdge,
  NdConjunctionIntroEdge,
  NdWeakeningEdge,
  NdDisjunctionElimEdge,
  NdExistentialElimEdge,
  TabSinglePremiseEdge,
  TabBranchingEdge,
  TabAxiomEdge,
} from "./inferenceEdge";

describe("inferenceEdgeLabelLogic", () => {
  describe("getInferenceEdgeBadgeColor", () => {
    it("returns purple-ish color for MP edge", () => {
      const edge: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "mp-1",
        leftPremiseNodeId: "a",
        rightPremiseNodeId: "b",
        conclusionText: "",
      };
      expect(getInferenceEdgeBadgeColor(edge)).toContain("--color-badge-mp");
    });

    it("returns green-ish color for Gen edge", () => {
      const edge: GenEdge = {
        _tag: "gen",
        conclusionNodeId: "gen-1",
        premiseNodeId: "a",
        variableName: "x",
        conclusionText: "",
      };
      expect(getInferenceEdgeBadgeColor(edge)).toContain("--color-badge-gen");
    });

    it("returns orange-ish color for Substitution edge", () => {
      const edge: SubstitutionEdge = {
        _tag: "substitution",
        conclusionNodeId: "subst-1",
        premiseNodeId: "a",
        entries: [],
        conclusionText: "",
      };
      expect(getInferenceEdgeBadgeColor(edge)).toContain("--color-badge-subst");
    });
  });

  describe("computeInferenceEdgeLabelData", () => {
    it("returns label data for MP edge", () => {
      const edge: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "mp-1",
        leftPremiseNodeId: "a",
        rightPremiseNodeId: "b",
        conclusionText: "",
      };
      const result = computeInferenceEdgeLabelData(edge);
      expect(result.label).toBe("MP");
      expect(result.tag).toBe("mp");
      expect(result.badgeColor).toContain("--color-badge-mp");
    });

    it("returns label data for Gen edge with variable", () => {
      const edge: GenEdge = {
        _tag: "gen",
        conclusionNodeId: "gen-1",
        premiseNodeId: "a",
        variableName: "y",
        conclusionText: "",
      };
      const result = computeInferenceEdgeLabelData(edge);
      expect(result.label).toBe("Gen(y)");
      expect(result.tag).toBe("gen");
      expect(result.badgeColor).toContain("--color-badge-gen");
    });

    it("returns label data for Substitution edge with entries", () => {
      const edge: SubstitutionEdge = {
        _tag: "substitution",
        conclusionNodeId: "subst-1",
        premiseNodeId: "a",
        entries: [
          {
            _tag: "FormulaSubstitution",
            metaVariableName: "φ",
            formulaText: "p",
          },
        ],
        conclusionText: "",
      };
      const result = computeInferenceEdgeLabelData(edge);
      expect(result.label).toBe("Subst(1)");
      expect(result.tag).toBe("substitution");
      expect(result.badgeColor).toContain("--color-badge-subst");
    });

    it("returns ND badge color for all ND edges", () => {
      const ndEdges: readonly NdInferenceEdge[] = [
        {
          _tag: "nd-implication-intro",
          conclusionNodeId: "c",
          premiseNodeId: "p",
          dischargedFormulaText: "A",
          dischargedAssumptionId: 1,
          conclusionText: "A → B",
        },
        {
          _tag: "nd-implication-elim",
          conclusionNodeId: "c",
          leftPremiseNodeId: "p1",
          rightPremiseNodeId: "p2",
          conclusionText: "B",
        },
        {
          _tag: "nd-conjunction-intro",
          conclusionNodeId: "c",
          leftPremiseNodeId: "p1",
          rightPremiseNodeId: "p2",
          conclusionText: "A ∧ B",
        },
        {
          _tag: "nd-dne",
          conclusionNodeId: "c",
          premiseNodeId: "p",
          conclusionText: "A",
        },
      ];
      for (const edge of ndEdges) {
        const result = computeInferenceEdgeLabelData(edge);
        expect(result.badgeColor).toContain("--color-badge-nd");
      }
    });

    it("returns correct label and tag for ND →I edge", () => {
      const edge: NdInferenceEdge = {
        _tag: "nd-implication-intro",
        conclusionNodeId: "c",
        premiseNodeId: "p",
        dischargedFormulaText: "A",
        dischargedAssumptionId: 1,
        conclusionText: "A → B",
      };
      const result = computeInferenceEdgeLabelData(edge);
      expect(result.label).toBe("→I");
      expect(result.tag).toBe("nd-implication-intro");
    });
  });

  describe("getPremiseRole", () => {
    it("returns 'left' for MP left premise", () => {
      const edge: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "c",
        leftPremiseNodeId: "a",
        rightPremiseNodeId: "b",
        conclusionText: "",
      };
      expect(getPremiseRole(edge, "a")).toBe("left");
    });

    it("returns 'right' for MP right premise", () => {
      const edge: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "c",
        leftPremiseNodeId: "a",
        rightPremiseNodeId: "b",
        conclusionText: "",
      };
      expect(getPremiseRole(edge, "b")).toBe("right");
    });

    it("returns undefined for unrelated node in MP", () => {
      const edge: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "c",
        leftPremiseNodeId: "a",
        rightPremiseNodeId: "b",
        conclusionText: "",
      };
      expect(getPremiseRole(edge, "x")).toBeUndefined();
    });

    it("returns 'premise' for 1-premise Gen edge", () => {
      const edge: GenEdge = {
        _tag: "gen",
        conclusionNodeId: "c",
        premiseNodeId: "a",
        variableName: "x",
        conclusionText: "",
      };
      expect(getPremiseRole(edge, "a")).toBe("premise");
    });

    it("returns 'left'/'right' for →E edge", () => {
      const edge: NdImplicationElimEdge = {
        _tag: "nd-implication-elim",
        conclusionNodeId: "c",
        leftPremiseNodeId: "p1",
        rightPremiseNodeId: "p2",
        conclusionText: "",
      };
      expect(getPremiseRole(edge, "p1")).toBe("left");
      expect(getPremiseRole(edge, "p2")).toBe("right");
    });

    it("returns 'left'/'right' for ∧I edge", () => {
      const edge: NdConjunctionIntroEdge = {
        _tag: "nd-conjunction-intro",
        conclusionNodeId: "c",
        leftPremiseNodeId: "p1",
        rightPremiseNodeId: "p2",
        conclusionText: "",
      };
      expect(getPremiseRole(edge, "p1")).toBe("left");
      expect(getPremiseRole(edge, "p2")).toBe("right");
    });

    it("returns 'kept'/'discarded' for w edge", () => {
      const edge: NdWeakeningEdge = {
        _tag: "nd-weakening",
        conclusionNodeId: "c",
        keptPremiseNodeId: "k",
        discardedPremiseNodeId: "d",
        conclusionText: "",
      };
      expect(getPremiseRole(edge, "k")).toBe("kept");
      expect(getPremiseRole(edge, "d")).toBe("discarded");
    });

    it("returns 'existential'/'case' for ∃E edge", () => {
      const edge: NdExistentialElimEdge = {
        _tag: "nd-existential-elim",
        conclusionNodeId: "c",
        existentialPremiseNodeId: "e",
        casePremiseNodeId: "p",
        dischargedAssumptionId: 1,
        dischargedFormulaText: "A",
        conclusionText: "",
      };
      expect(getPremiseRole(edge, "e")).toBe("existential");
      expect(getPremiseRole(edge, "p")).toBe("case");
    });

    it("returns 'disjunction'/'leftCase'/'rightCase' for ∨E edge", () => {
      const edge: NdDisjunctionElimEdge = {
        _tag: "nd-disjunction-elim",
        conclusionNodeId: "c",
        disjunctionPremiseNodeId: "d",
        leftCasePremiseNodeId: "l",
        leftDischargedAssumptionId: 1,
        rightCasePremiseNodeId: "r",
        rightDischargedAssumptionId: 2,
        conclusionText: "",
      };
      expect(getPremiseRole(edge, "d")).toBe("disjunction");
      expect(getPremiseRole(edge, "l")).toBe("leftCase");
      expect(getPremiseRole(edge, "r")).toBe("rightCase");
    });

    it("returns undefined for MP with undefined premises", () => {
      const edge: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "c",
        leftPremiseNodeId: undefined,
        rightPremiseNodeId: undefined,
        conclusionText: "",
      };
      expect(getPremiseRole(edge, "a")).toBeUndefined();
    });

    it("returns undefined for unrelated node in w edge", () => {
      const edge: NdWeakeningEdge = {
        _tag: "nd-weakening",
        conclusionNodeId: "c",
        keptPremiseNodeId: "k",
        discardedPremiseNodeId: "d",
        conclusionText: "",
      };
      expect(getPremiseRole(edge, "x")).toBeUndefined();
    });

    it("returns undefined for unrelated node in ∃E edge", () => {
      const edge: NdExistentialElimEdge = {
        _tag: "nd-existential-elim",
        conclusionNodeId: "c",
        existentialPremiseNodeId: "e",
        casePremiseNodeId: "p",
        dischargedAssumptionId: 1,
        dischargedFormulaText: "A",
        conclusionText: "",
      };
      expect(getPremiseRole(edge, "x")).toBeUndefined();
    });

    it("returns undefined for unrelated node in ∨E edge", () => {
      const edge: NdDisjunctionElimEdge = {
        _tag: "nd-disjunction-elim",
        conclusionNodeId: "c",
        disjunctionPremiseNodeId: "d",
        leftCasePremiseNodeId: "l",
        leftDischargedAssumptionId: 1,
        rightCasePremiseNodeId: "r",
        rightDischargedAssumptionId: 2,
        conclusionText: "",
      };
      expect(getPremiseRole(edge, "x")).toBeUndefined();
    });

    it("returns undefined for unrelated node in 1-premise Gen edge", () => {
      const edge: GenEdge = {
        _tag: "gen",
        conclusionNodeId: "c",
        premiseNodeId: "a",
        variableName: "x",
        conclusionText: "",
      };
      expect(getPremiseRole(edge, "x")).toBeUndefined();
    });
  });

  describe("getInferenceEdgeLabelForConnection", () => {
    it("returns 'MP:φ' for MP left premise", () => {
      const edge: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "c",
        leftPremiseNodeId: "a",
        rightPremiseNodeId: "b",
        conclusionText: "",
      };
      expect(getInferenceEdgeLabelForConnection(edge, "a")).toBe("MP:φ");
    });

    it("returns 'MP:→' for MP right premise", () => {
      const edge: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "c",
        leftPremiseNodeId: "a",
        rightPremiseNodeId: "b",
        conclusionText: "",
      };
      expect(getInferenceEdgeLabelForConnection(edge, "b")).toBe("MP:→");
    });

    it("returns 'MP' for unknown premise in MP edge", () => {
      const edge: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "c",
        leftPremiseNodeId: "a",
        rightPremiseNodeId: "b",
        conclusionText: "",
      };
      expect(getInferenceEdgeLabelForConnection(edge, "x")).toBe("MP");
    });

    it("returns '→E:φ' and '→E:→' for ND →E", () => {
      const edge: NdImplicationElimEdge = {
        _tag: "nd-implication-elim",
        conclusionNodeId: "c",
        leftPremiseNodeId: "p1",
        rightPremiseNodeId: "p2",
        conclusionText: "",
      };
      expect(getInferenceEdgeLabelForConnection(edge, "p1")).toBe("→E:φ");
      expect(getInferenceEdgeLabelForConnection(edge, "p2")).toBe("→E:→");
    });

    it("returns '∧I:L' and '∧I:R' for ND ∧I", () => {
      const edge: NdConjunctionIntroEdge = {
        _tag: "nd-conjunction-intro",
        conclusionNodeId: "c",
        leftPremiseNodeId: "p1",
        rightPremiseNodeId: "p2",
        conclusionText: "",
      };
      expect(getInferenceEdgeLabelForConnection(edge, "p1")).toBe("∧I:L");
      expect(getInferenceEdgeLabelForConnection(edge, "p2")).toBe("∧I:R");
    });

    it("returns 'w:✓' and 'w:✗' for ND w", () => {
      const edge: NdWeakeningEdge = {
        _tag: "nd-weakening",
        conclusionNodeId: "c",
        keptPremiseNodeId: "k",
        discardedPremiseNodeId: "d",
        conclusionText: "",
      };
      expect(getInferenceEdgeLabelForConnection(edge, "k")).toBe("w:✓");
      expect(getInferenceEdgeLabelForConnection(edge, "d")).toBe("w:✗");
    });

    it("returns '∨E:∨', '∨E:L', '∨E:R' for ND ∨E", () => {
      const edge: NdDisjunctionElimEdge = {
        _tag: "nd-disjunction-elim",
        conclusionNodeId: "c",
        disjunctionPremiseNodeId: "d",
        leftCasePremiseNodeId: "l",
        leftDischargedAssumptionId: 1,
        rightCasePremiseNodeId: "r",
        rightDischargedAssumptionId: 2,
        conclusionText: "",
      };
      expect(getInferenceEdgeLabelForConnection(edge, "d")).toBe("∨E:∨");
      expect(getInferenceEdgeLabelForConnection(edge, "l")).toBe("∨E:L");
      expect(getInferenceEdgeLabelForConnection(edge, "r")).toBe("∨E:R");
    });

    it("returns '∃E:∃' and '∃E:φ' for ND ∃E", () => {
      const edge: NdExistentialElimEdge = {
        _tag: "nd-existential-elim",
        conclusionNodeId: "c",
        existentialPremiseNodeId: "e",
        casePremiseNodeId: "p",
        dischargedAssumptionId: 1,
        dischargedFormulaText: "A",
        conclusionText: "",
      };
      expect(getInferenceEdgeLabelForConnection(edge, "e")).toBe("∃E:∃");
      expect(getInferenceEdgeLabelForConnection(edge, "p")).toBe("∃E:φ");
    });

    it("returns base label for 1-premise Gen edge", () => {
      const edge: GenEdge = {
        _tag: "gen",
        conclusionNodeId: "c",
        premiseNodeId: "a",
        variableName: "x",
        conclusionText: "",
      };
      expect(getInferenceEdgeLabelForConnection(edge, "a")).toBe("Gen(x)");
    });

    it("returns base label for 1-premise Subst edge", () => {
      const edge: SubstitutionEdge = {
        _tag: "substitution",
        conclusionNodeId: "c",
        premiseNodeId: "a",
        entries: [],
        conclusionText: "",
      };
      expect(getInferenceEdgeLabelForConnection(edge, "a")).toBe("Subst");
    });
  });

  describe("computeInferenceEdgeLabelDataForConnection", () => {
    it("returns role-annotated label data for MP left premise", () => {
      const edge: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "c",
        leftPremiseNodeId: "a",
        rightPremiseNodeId: "b",
        conclusionText: "",
      };
      const result = computeInferenceEdgeLabelDataForConnection(edge, "a");
      expect(result.label).toBe("MP:φ");
      expect(result.tag).toBe("mp");
      expect(result.badgeColor).toContain("--color-badge-mp");
    });

    it("returns role-annotated label data for MP right premise", () => {
      const edge: MPEdge = {
        _tag: "mp",
        conclusionNodeId: "c",
        leftPremiseNodeId: "a",
        rightPremiseNodeId: "b",
        conclusionText: "",
      };
      const result = computeInferenceEdgeLabelDataForConnection(edge, "b");
      expect(result.label).toBe("MP:→");
      expect(result.tag).toBe("mp");
      expect(result.badgeColor).toContain("--color-badge-mp");
    });
  });

  // --- TABエッジ ---

  describe("TAB badge color", () => {
    it("TAB 1前提エッジのバッジ色を返す", () => {
      const edge: TabSinglePremiseEdge = {
        _tag: "tab-single",
        ruleId: "double-negation",
        conclusionNodeId: "c1",
        premiseNodeId: "p1",
        conclusionText: "¬¬φ",
      };
      expect(getInferenceEdgeBadgeColor(edge)).toContain("--color-badge-tab");
    });

    it("TAB 分岐エッジのバッジ色を返す", () => {
      const edge: TabBranchingEdge = {
        _tag: "tab-branching",
        ruleId: "neg-conjunction",
        conclusionNodeId: "c1",
        leftPremiseNodeId: "p1",
        rightPremiseNodeId: "p2",
        leftConclusionText: "¬φ",
        rightConclusionText: "¬ψ",
        conclusionText: "¬(φ∧ψ)",
      };
      expect(getInferenceEdgeBadgeColor(edge)).toContain("--color-badge-tab");
    });

    it("TAB 公理エッジのバッジ色を返す", () => {
      const edge: TabAxiomEdge = {
        _tag: "tab-axiom",
        ruleId: "bs",
        conclusionNodeId: "c1",
        conclusionText: "¬φ, φ",
      };
      expect(getInferenceEdgeBadgeColor(edge)).toContain("--color-badge-tab");
    });
  });

  describe("TAB premise role", () => {
    it("TAB 1前提の premise ロールを返す", () => {
      const edge: TabSinglePremiseEdge = {
        _tag: "tab-single",
        ruleId: "conjunction",
        conclusionNodeId: "c1",
        premiseNodeId: "p1",
        conclusionText: "φ∧ψ",
      };
      expect(getPremiseRole(edge, "p1")).toBe("premise");
      expect(getPremiseRole(edge, "unknown")).toBeUndefined();
    });

    it("TAB 分岐の left/right ロールを返す", () => {
      const edge: TabBranchingEdge = {
        _tag: "tab-branching",
        ruleId: "disjunction",
        conclusionNodeId: "c1",
        leftPremiseNodeId: "p1",
        rightPremiseNodeId: "p2",
        leftConclusionText: "φ",
        rightConclusionText: "ψ",
        conclusionText: "φ∨ψ",
      };
      expect(getPremiseRole(edge, "p1")).toBe("left");
      expect(getPremiseRole(edge, "p2")).toBe("right");
      expect(getPremiseRole(edge, "unknown")).toBeUndefined();
    });

    it("TAB 公理は undefined を返す", () => {
      const edge: TabAxiomEdge = {
        _tag: "tab-axiom",
        ruleId: "bs",
        conclusionNodeId: "c1",
        conclusionText: "¬φ, φ",
      };
      expect(getPremiseRole(edge, "c1")).toBeUndefined();
      expect(getPremiseRole(edge, "p1")).toBeUndefined();
    });
  });
});
