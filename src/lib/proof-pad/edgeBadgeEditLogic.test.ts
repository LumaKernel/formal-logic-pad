import { describe, expect, it } from "vitest";
import type { InferenceEdge } from "./inferenceEdge";
import type { SubstitutionEntries } from "./substitutionApplicationLogic";
import {
  createEditStateFromEdge,
  updateGenEditVariableName,
  canConfirmGenEdit,
  toSubstEditEntries,
  fromSubstEditEntries,
  canConfirmSubstEdit,
  updateSubstEditEntryValue,
} from "./edgeBadgeEditLogic";

describe("edgeBadgeEditLogic", () => {
  describe("createEditStateFromEdge", () => {
    it("returns undefined for MP edge", () => {
      const mpEdge: InferenceEdge = {
        _tag: "mp",
        conclusionNodeId: "n1",
        leftPremiseNodeId: "n2",
        rightPremiseNodeId: "n3",
        conclusionText: "ψ",
      };
      expect(createEditStateFromEdge(mpEdge)).toBeUndefined();
    });

    it("returns gen edit state for Gen edge", () => {
      const genEdge: InferenceEdge = {
        _tag: "gen",
        conclusionNodeId: "n1",
        premiseNodeId: "n2",
        variableName: "x",
        conclusionText: "∀x.φ",
      };
      const state = createEditStateFromEdge(genEdge);
      expect(state).toEqual({
        _tag: "gen",
        conclusionNodeId: "n1",
        variableName: "x",
      });
    });

    it("returns substitution edit state for Substitution edge without premiseFormulaText", () => {
      const entries: SubstitutionEntries = [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "φ",
          formulaText: "alpha",
        },
      ];
      const substEdge: InferenceEdge = {
        _tag: "substitution",
        conclusionNodeId: "n1",
        premiseNodeId: "n2",
        entries,
        conclusionText: "α → (ψ → α)",
      };
      const state = createEditStateFromEdge(substEdge);
      expect(state).toEqual({
        _tag: "substitution",
        conclusionNodeId: "n1",
        entries,
        premiseFormulaText: undefined,
      });
    });

    it("returns substitution edit state with premiseFormulaText", () => {
      const entries: SubstitutionEntries = [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "φ",
          formulaText: "alpha",
        },
      ];
      const substEdge: InferenceEdge = {
        _tag: "substitution",
        conclusionNodeId: "n1",
        premiseNodeId: "n2",
        entries,
        conclusionText: "α → (ψ → α)",
      };
      const state = createEditStateFromEdge(substEdge, "phi -> (psi -> phi)");
      expect(state).toEqual({
        _tag: "substitution",
        conclusionNodeId: "n1",
        entries,
        premiseFormulaText: "phi -> (psi -> phi)",
      });
    });

    it("returns undefined for TAB edges (no parameter editing)", () => {
      const tabEdges: readonly InferenceEdge[] = [
        {
          _tag: "tab-single",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          ruleId: "conjunction",
          conclusionText: "P ∧ Q ⊢",
        },
        {
          _tag: "tab-branching",
          conclusionNodeId: "n1",
          leftPremiseNodeId: "n2",
          rightPremiseNodeId: "n3",
          ruleId: "neg-conjunction",
          leftConclusionText: "¬P ⊢",
          rightConclusionText: "¬Q ⊢",
          conclusionText: "¬(P ∧ Q) ⊢",
        },
        {
          _tag: "tab-axiom",
          conclusionNodeId: "n1",
          ruleId: "bs",
          conclusionText: "P ⊢ P",
        },
      ];
      for (const edge of tabEdges) {
        expect(createEditStateFromEdge(edge)).toBeUndefined();
      }
    });

    it("returns undefined for AT edges (no parameter editing)", () => {
      const atEdges: readonly InferenceEdge[] = [
        {
          _tag: "at-alpha",
          conclusionNodeId: "n1",
          resultNodeId: "n2",
          secondResultNodeId: undefined,
          ruleId: "alpha-double-neg-t",
          resultText: "T:P",
          secondResultText: undefined,
          conclusionText: "T:¬¬P",
        },
        {
          _tag: "at-beta",
          conclusionNodeId: "n1",
          leftResultNodeId: "n2",
          rightResultNodeId: "n3",
          ruleId: "beta-impl",
          conclusionText: "T:P→Q",
          leftResultText: "F:P",
          rightResultText: "T:Q",
        },
        {
          _tag: "at-closed",
          conclusionNodeId: "n1",
          ruleId: "closure",
          contradictionNodeId: "n2",
          conclusionText: "closed",
        },
      ];
      for (const edge of atEdges) {
        expect(createEditStateFromEdge(edge)).toBeUndefined();
      }
    });

    it("returns undefined for all ND edges (no parameter editing)", () => {
      const ndEdges: readonly InferenceEdge[] = [
        {
          _tag: "nd-implication-intro",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          dischargedFormulaText: "A",
          dischargedAssumptionId: 1,
          conclusionText: "A → B",
        },
        {
          _tag: "nd-implication-elim",
          conclusionNodeId: "n1",
          leftPremiseNodeId: "n2",
          rightPremiseNodeId: "n3",
          conclusionText: "B",
        },
        {
          _tag: "nd-conjunction-intro",
          conclusionNodeId: "n1",
          leftPremiseNodeId: "n2",
          rightPremiseNodeId: "n3",
          conclusionText: "A ∧ B",
        },
        {
          _tag: "nd-conjunction-elim-left",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "A",
        },
        {
          _tag: "nd-conjunction-elim-right",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "B",
        },
        {
          _tag: "nd-disjunction-intro-left",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          addedRightText: "B",
          conclusionText: "A ∨ B",
        },
        {
          _tag: "nd-disjunction-intro-right",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          addedLeftText: "A",
          conclusionText: "A ∨ B",
        },
        {
          _tag: "nd-disjunction-elim",
          conclusionNodeId: "n1",
          disjunctionPremiseNodeId: "n2",
          leftCasePremiseNodeId: "n3",
          leftDischargedAssumptionId: 1,
          rightCasePremiseNodeId: "n4",
          rightDischargedAssumptionId: 2,
          conclusionText: "C",
        },
        {
          _tag: "nd-weakening",
          conclusionNodeId: "n1",
          keptPremiseNodeId: "n2",
          discardedPremiseNodeId: "n3",
          conclusionText: "A",
        },
        {
          _tag: "nd-efq",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "A",
        },
        {
          _tag: "nd-dne",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "A",
        },
      ];
      for (const edge of ndEdges) {
        expect(createEditStateFromEdge(edge)).toBeUndefined();
      }
    });
  });

  describe("Gen edit operations", () => {
    it("updateGenEditVariableName updates the variable name", () => {
      const state = {
        _tag: "gen" as const,
        conclusionNodeId: "n1",
        variableName: "x",
      };
      const updated = updateGenEditVariableName(state, "y");
      expect(updated.variableName).toBe("y");
      expect(updated.conclusionNodeId).toBe("n1");
    });

    it("canConfirmGenEdit returns true for non-empty name", () => {
      expect(
        canConfirmGenEdit({
          _tag: "gen",
          conclusionNodeId: "n1",
          variableName: "x",
        }),
      ).toBe(true);
    });

    it("canConfirmGenEdit returns false for empty name", () => {
      expect(
        canConfirmGenEdit({
          _tag: "gen",
          conclusionNodeId: "n1",
          variableName: "",
        }),
      ).toBe(false);
    });

    it("canConfirmGenEdit returns false for whitespace-only name", () => {
      expect(
        canConfirmGenEdit({
          _tag: "gen",
          conclusionNodeId: "n1",
          variableName: "  ",
        }),
      ).toBe(false);
    });
  });

  describe("Substitution edit operations", () => {
    describe("toSubstEditEntries (without premiseFormulaText)", () => {
      it("converts formula substitution entries", () => {
        const entries: SubstitutionEntries = [
          {
            _tag: "FormulaSubstitution",
            metaVariableName: "φ",
            formulaText: "alpha",
          },
        ];
        const result = toSubstEditEntries(entries);
        expect(result).toEqual([
          { kind: "formula", metaVar: "φ", value: "alpha" },
        ]);
      });

      it("converts term substitution entries", () => {
        const entries: SubstitutionEntries = [
          {
            _tag: "TermSubstitution",
            metaVariableName: "τ",
            termText: "S(0)",
          },
        ];
        const result = toSubstEditEntries(entries);
        expect(result).toEqual([{ kind: "term", metaVar: "τ", value: "S(0)" }]);
      });

      it("returns default entry for empty entries", () => {
        const result = toSubstEditEntries([]);
        expect(result).toEqual([{ kind: "formula", metaVar: "", value: "" }]);
      });

      it("converts mixed entries", () => {
        const entries: SubstitutionEntries = [
          {
            _tag: "FormulaSubstitution",
            metaVariableName: "φ",
            formulaText: "alpha",
          },
          {
            _tag: "TermSubstitution",
            metaVariableName: "τ",
            termText: "S(0)",
          },
        ];
        const result = toSubstEditEntries(entries);
        expect(result).toEqual([
          { kind: "formula", metaVar: "φ", value: "alpha" },
          { kind: "term", metaVar: "τ", value: "S(0)" },
        ]);
      });
    });

    describe("toSubstEditEntries (with premiseFormulaText)", () => {
      it("auto-extracts meta-variables from premise formula", () => {
        const result = toSubstEditEntries([], "phi -> (psi -> phi)");
        expect(result).toEqual([
          { kind: "formula", metaVar: "φ", value: "" },
          { kind: "formula", metaVar: "ψ", value: "" },
        ]);
      });

      it("merges existing entry values with extracted meta-variables", () => {
        const entries: SubstitutionEntries = [
          {
            _tag: "FormulaSubstitution",
            metaVariableName: "φ",
            formulaText: "alpha",
          },
        ];
        const result = toSubstEditEntries(entries, "phi -> (psi -> phi)");
        expect(result).toEqual([
          { kind: "formula", metaVar: "φ", value: "alpha" },
          { kind: "formula", metaVar: "ψ", value: "" },
        ]);
      });

      it("extracts term meta-variables as well", () => {
        const result = toSubstEditEntries([], "(all x. phi) -> phi");
        // phi is formula metavar; no term metavar in this formula
        expect(result).toEqual([{ kind: "formula", metaVar: "φ", value: "" }]);
      });

      it("extracts both formula and term meta-variables", () => {
        // Formula with both formula meta-variable and term meta-variable
        const result = toSubstEditEntries([], "all x. P(x) -> P(tau)");
        // τ is a term meta-variable
        expect(result).toEqual([{ kind: "term", metaVar: "τ", value: "" }]);
      });

      it("merges existing term entry values with extracted term meta-variables", () => {
        const entries: SubstitutionEntries = [
          {
            _tag: "TermSubstitution",
            metaVariableName: "τ",
            termText: "S(0)",
          },
        ];
        const result = toSubstEditEntries(entries, "all x. P(x) -> P(tau)");
        expect(result).toEqual([{ kind: "term", metaVar: "τ", value: "S(0)" }]);
      });

      it("falls back to existing entries if premise formula is invalid", () => {
        const entries: SubstitutionEntries = [
          {
            _tag: "FormulaSubstitution",
            metaVariableName: "φ",
            formulaText: "alpha",
          },
        ];
        const result = toSubstEditEntries(entries, "invalid!!!");
        expect(result).toEqual([
          { kind: "formula", metaVar: "φ", value: "alpha" },
        ]);
      });

      it("extracts Greek letter names written in Latin as meta-variables", () => {
        // In the parser, "alpha" is parsed as the Greek letter α (meta-variable)
        const result = toSubstEditEntries([], "alpha -> beta");
        expect(result).toEqual([
          { kind: "formula", metaVar: "α", value: "" },
          { kind: "formula", metaVar: "β", value: "" },
        ]);
      });

      it("falls back to empty default if premise has no meta-variables and entries are empty", () => {
        // A formula with only bound/free variables but no meta-variables
        // Use a concrete propositional variable name that is NOT a Greek letter
        const result = toSubstEditEntries([], "p -> q");
        expect(result).toEqual([{ kind: "formula", metaVar: "", value: "" }]);
      });
    });

    describe("fromSubstEditEntries", () => {
      it("converts formula edit entries", () => {
        const editEntries = [
          { kind: "formula" as const, metaVar: "φ", value: "alpha" },
        ];
        const result = fromSubstEditEntries(editEntries);
        expect(result).toEqual([
          {
            _tag: "FormulaSubstitution",
            metaVariableName: "φ",
            formulaText: "alpha",
          },
        ]);
      });

      it("converts term edit entries", () => {
        const editEntries = [
          { kind: "term" as const, metaVar: "τ", value: "S(0)" },
        ];
        const result = fromSubstEditEntries(editEntries);
        expect(result).toEqual([
          {
            _tag: "TermSubstitution",
            metaVariableName: "τ",
            termText: "S(0)",
          },
        ]);
      });

      it("filters out empty entries", () => {
        const editEntries = [
          { kind: "formula" as const, metaVar: "", value: "" },
          { kind: "formula" as const, metaVar: "φ", value: "alpha" },
          { kind: "term" as const, metaVar: "", value: "S(0)" },
        ];
        const result = fromSubstEditEntries(editEntries);
        expect(result).toEqual([
          {
            _tag: "FormulaSubstitution",
            metaVariableName: "φ",
            formulaText: "alpha",
          },
        ]);
      });

      it("filters out entries with invalid Greek letter metaVar", () => {
        const editEntries = [
          { kind: "formula" as const, metaVar: "x", value: "alpha" },
          { kind: "formula" as const, metaVar: "φ", value: "beta" },
        ];
        const result = fromSubstEditEntries(editEntries);
        expect(result).toEqual([
          {
            _tag: "FormulaSubstitution",
            metaVariableName: "φ",
            formulaText: "beta",
          },
        ]);
      });

      it("trims whitespace", () => {
        const editEntries = [
          { kind: "formula" as const, metaVar: " φ ", value: " alpha " },
        ];
        const result = fromSubstEditEntries(editEntries);
        expect(result).toEqual([
          {
            _tag: "FormulaSubstitution",
            metaVariableName: "φ",
            formulaText: "alpha",
          },
        ]);
      });
    });

    describe("canConfirmSubstEdit", () => {
      it("returns true when at least one entry is valid", () => {
        expect(
          canConfirmSubstEdit([
            { kind: "formula", metaVar: "φ", value: "alpha" },
          ]),
        ).toBe(true);
      });

      it("returns false when all entries are empty", () => {
        expect(
          canConfirmSubstEdit([{ kind: "formula", metaVar: "", value: "" }]),
        ).toBe(false);
      });

      it("returns true when at least one of multiple entries is valid", () => {
        expect(
          canConfirmSubstEdit([
            { kind: "formula", metaVar: "", value: "" },
            { kind: "formula", metaVar: "φ", value: "alpha" },
          ]),
        ).toBe(true);
      });

      it("returns false when metaVar is empty", () => {
        expect(
          canConfirmSubstEdit([
            { kind: "formula", metaVar: "", value: "alpha" },
          ]),
        ).toBe(false);
      });

      it("returns false when value is empty", () => {
        expect(
          canConfirmSubstEdit([{ kind: "formula", metaVar: "φ", value: "" }]),
        ).toBe(false);
      });
    });

    describe("toSubstEditEntries (with subscripted meta-variables)", () => {
      it("auto-extracts subscripted formula meta-variables from premise", () => {
        const result = toSubstEditEntries([], "phi1 -> (psi -> phi1)");
        expect(result).toEqual([
          { kind: "formula", metaVar: "φ_1", value: "" },
          { kind: "formula", metaVar: "ψ", value: "" },
        ]);
      });

      it("auto-extracts subscripted term meta-variables from premise", () => {
        const result = toSubstEditEntries([], "all x. P(x) -> P(tau1)");
        expect(result).toEqual([{ kind: "term", metaVar: "τ_1", value: "" }]);
      });

      it("handles valid premise with no meta-variables and existing entries", () => {
        // "p -> q" has no Greek letter meta-variables (p, q are lower idents / term variables)
        // so extractedEntries.length === 0, fallback to existing entries
        const entries: SubstitutionEntries = [
          {
            _tag: "FormulaSubstitution",
            metaVariableName: "φ",
            formulaText: "alpha",
          },
        ];
        const result = toSubstEditEntries(entries, "p -> q");
        expect(result).toEqual([
          { kind: "formula", metaVar: "φ", value: "alpha" },
        ]);
      });
    });

    describe("updateSubstEditEntryValue", () => {
      it("updates value at index", () => {
        const entries = [
          { kind: "formula" as const, metaVar: "φ", value: "alpha" },
        ];
        const result = updateSubstEditEntryValue(entries, 0, "beta");
        expect(result[0]!.metaVar).toBe("φ");
        expect(result[0]!.value).toBe("beta");
        expect(result[0]!.kind).toBe("formula");
      });

      it("does not affect other entries", () => {
        const entries = [
          { kind: "formula" as const, metaVar: "φ", value: "alpha" },
          { kind: "term" as const, metaVar: "τ", value: "S(0)" },
        ];
        const result = updateSubstEditEntryValue(entries, 0, "beta");
        expect(result[1]).toEqual(entries[1]);
      });
    });
  });
});
