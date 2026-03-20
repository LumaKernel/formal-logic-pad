import { describe, it, expect } from "vitest";
import { createTabEdgeDetailData } from "./tabEdgeDetailLogic";
import type {
  TabSinglePremiseEdge,
  TabBranchingEdge,
  TabAxiomEdge,
} from "./inferenceEdge";

describe("createTabEdgeDetailData", () => {
  describe("tab-single edges", () => {
    it("基本的なsingleエッジの詳細を生成する", () => {
      const edge: TabSinglePremiseEdge = {
        _tag: "tab-single",
        ruleId: "conjunction",
        conclusionNodeId: "n1",
        premiseNodeId: "n2",
        conclusionText: "P ∧ Q",
      };
      const result = createTabEdgeDetailData(edge);
      expect(result.ruleName).toBe("∧");
      expect(result.edgeTag).toBe("tab-single");
      expect(result.entries).toEqual([
        { labelKey: "tabDetailConclusion", value: "P ∧ Q" },
      ]);
    });

    it("eigenVariable付きのsingleエッジの詳細を生成する", () => {
      const edge: TabSinglePremiseEdge = {
        _tag: "tab-single",
        ruleId: "neg-universal",
        conclusionNodeId: "n1",
        premiseNodeId: "n2",
        conclusionText: "¬∀x.P(x)",
        eigenVariable: "y",
      };
      const result = createTabEdgeDetailData(edge);
      expect(result.ruleName).toBe("¬∀");
      expect(result.entries).toEqual([
        { labelKey: "tabDetailConclusion", value: "¬∀x.P(x)" },
        { labelKey: "tabDetailEigenVariable", value: "y" },
      ]);
    });

    it("termText付きのsingleエッジの詳細を生成する", () => {
      const edge: TabSinglePremiseEdge = {
        _tag: "tab-single",
        ruleId: "universal",
        conclusionNodeId: "n1",
        premiseNodeId: "n2",
        conclusionText: "∀x.P(x)",
        termText: "f(a)",
      };
      const result = createTabEdgeDetailData(edge);
      expect(result.ruleName).toBe("∀");
      expect(result.entries).toEqual([
        { labelKey: "tabDetailConclusion", value: "∀x.P(x)" },
        { labelKey: "tabDetailTerm", value: "f(a)" },
      ]);
    });

    it("exchangePosition付きのsingleエッジの詳細を生成する", () => {
      const edge: TabSinglePremiseEdge = {
        _tag: "tab-single",
        ruleId: "exchange",
        conclusionNodeId: "n1",
        premiseNodeId: "n2",
        conclusionText: "P, Q",
        exchangePosition: 1,
      };
      const result = createTabEdgeDetailData(edge);
      expect(result.ruleName).toBe("e");
      expect(result.entries).toEqual([
        { labelKey: "tabDetailConclusion", value: "P, Q" },
        { labelKey: "tabDetailExchangePosition", value: "1" },
      ]);
    });

    it("全パラメータ付きのsingleエッジの詳細を生成する", () => {
      const edge: TabSinglePremiseEdge = {
        _tag: "tab-single",
        ruleId: "existential",
        conclusionNodeId: "n1",
        premiseNodeId: "n2",
        conclusionText: "∃x.P(x)",
        eigenVariable: "c",
        termText: "t",
        exchangePosition: 0,
      };
      const result = createTabEdgeDetailData(edge);
      expect(result.entries).toHaveLength(4);
      expect(result.entries[0]).toEqual({
        labelKey: "tabDetailConclusion",
        value: "∃x.P(x)",
      });
      expect(result.entries[1]).toEqual({
        labelKey: "tabDetailEigenVariable",
        value: "c",
      });
      expect(result.entries[2]).toEqual({
        labelKey: "tabDetailTerm",
        value: "t",
      });
      expect(result.entries[3]).toEqual({
        labelKey: "tabDetailExchangePosition",
        value: "0",
      });
    });
  });

  describe("tab-branching edges", () => {
    it("branchingエッジの詳細を生成する", () => {
      const edge: TabBranchingEdge = {
        _tag: "tab-branching",
        ruleId: "disjunction",
        conclusionNodeId: "n1",
        leftPremiseNodeId: "n2",
        rightPremiseNodeId: "n3",
        leftConclusionText: "P",
        rightConclusionText: "Q",
        conclusionText: "P ∨ Q",
      };
      const result = createTabEdgeDetailData(edge);
      expect(result.ruleName).toBe("∨");
      expect(result.edgeTag).toBe("tab-branching");
      expect(result.entries).toEqual([
        { labelKey: "tabDetailConclusion", value: "P ∨ Q" },
        { labelKey: "tabDetailLeftPremise", value: "P" },
        { labelKey: "tabDetailRightPremise", value: "Q" },
      ]);
    });
  });

  describe("tab-axiom edges", () => {
    it("axiomエッジの詳細を生成する", () => {
      const edge: TabAxiomEdge = {
        _tag: "tab-axiom",
        ruleId: "bs",
        conclusionNodeId: "n1",
        conclusionText: "P, ¬P",
      };
      const result = createTabEdgeDetailData(edge);
      expect(result.ruleName).toBe("BS");
      expect(result.edgeTag).toBe("tab-axiom");
      expect(result.entries).toEqual([
        { labelKey: "tabDetailConclusion", value: "P, ¬P" },
      ]);
    });

    it("bottomのaxiomエッジの詳細を生成する", () => {
      const edge: TabAxiomEdge = {
        _tag: "tab-axiom",
        ruleId: "bottom",
        conclusionNodeId: "n1",
        conclusionText: "⊥",
      };
      const result = createTabEdgeDetailData(edge);
      expect(result.ruleName).toBe("⊥");
      expect(result.entries).toEqual([
        { labelKey: "tabDetailConclusion", value: "⊥" },
      ]);
    });
  });
});
