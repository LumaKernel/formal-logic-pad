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
  addSubstEditEntry,
  removeSubstEditEntry,
  updateSubstEditEntry,
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

    it("returns substitution edit state for Substitution edge", () => {
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
      });
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
    describe("toSubstEditEntries", () => {
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

    describe("addSubstEditEntry", () => {
      it("adds a new default entry", () => {
        const entries = [
          { kind: "formula" as const, metaVar: "φ", value: "alpha" },
        ];
        const result = addSubstEditEntry(entries);
        expect(result).toHaveLength(2);
        expect(result[1]).toEqual({
          kind: "formula",
          metaVar: "",
          value: "",
        });
      });
    });

    describe("removeSubstEditEntry", () => {
      it("removes entry at specified index", () => {
        const entries = [
          { kind: "formula" as const, metaVar: "φ", value: "alpha" },
          { kind: "term" as const, metaVar: "τ", value: "S(0)" },
        ];
        const result = removeSubstEditEntry(entries, 0);
        expect(result).toEqual([{ kind: "term", metaVar: "τ", value: "S(0)" }]);
      });

      it("does not remove if only one entry", () => {
        const entries = [
          { kind: "formula" as const, metaVar: "φ", value: "alpha" },
        ];
        const result = removeSubstEditEntry(entries, 0);
        expect(result).toHaveLength(1);
      });
    });

    describe("updateSubstEditEntry", () => {
      it("updates metaVar at index", () => {
        const entries = [
          { kind: "formula" as const, metaVar: "φ", value: "alpha" },
        ];
        const result = updateSubstEditEntry(entries, 0, "metaVar", "ψ");
        expect(result[0]!.metaVar).toBe("ψ");
        expect(result[0]!.value).toBe("alpha");
      });

      it("updates value at index", () => {
        const entries = [
          { kind: "formula" as const, metaVar: "φ", value: "alpha" },
        ];
        const result = updateSubstEditEntry(entries, 0, "value", "beta");
        expect(result[0]!.metaVar).toBe("φ");
        expect(result[0]!.value).toBe("beta");
      });

      it("updates kind at index", () => {
        const entries = [
          { kind: "formula" as const, metaVar: "φ", value: "alpha" },
        ];
        const result = updateSubstEditEntry(entries, 0, "kind", "term");
        expect(result[0]!.kind).toBe("term");
      });

      it("does not affect other entries", () => {
        const entries = [
          { kind: "formula" as const, metaVar: "φ", value: "alpha" },
          { kind: "term" as const, metaVar: "τ", value: "S(0)" },
        ];
        const result = updateSubstEditEntry(entries, 0, "value", "beta");
        expect(result[1]).toEqual(entries[1]);
      });
    });
  });
});
