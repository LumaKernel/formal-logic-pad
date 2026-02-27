import { describe, expect, it } from "vitest";
import {
  getInferenceEdgeBadgeColor,
  computeInferenceEdgeLabelData,
} from "./inferenceEdgeLabelLogic";
import type { MPEdge, GenEdge, SubstitutionEdge } from "./inferenceEdge";

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
  });
});
