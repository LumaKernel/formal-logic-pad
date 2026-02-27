/**
 * パラメトリック公理（A4/A5）のスキーマインスタンス生成ロジックのテスト。
 */

import { describe, it, expect } from "vitest";
import { parseString as parseFormula } from "../logic-lang/parser";
import { matchAxiomA4, matchAxiomA5 } from "../logic-core/inferenceRule";
import {
  generateA4Instance,
  generateA5Instance,
  validateUniversalFormula,
  validateA5Antecedent,
  getA4ErrorMessage,
  getA5ErrorMessage,
} from "./parametricAxiomLogic";

// --- A4 テスト ---

describe("generateA4Instance", () => {
  it("generates instance from simple universal formula", () => {
    const result = generateA4Instance({
      universalFormulaText: "all x. x + 0 = x",
    });
    expect(result._tag).toBe("Success");
    if (result._tag !== "Success") return;
    // (∀x. x + 0 = x) → τ + 0 = τ
    expect(result.dslText).toContain("→");
    expect(result.dslText).toContain("τ");
    expect(result.boundVariableName).toBe("x");
    expect(result.termMetaVariableName).toBe("τ");
  });

  it("generates instance from ∀x. ¬(S(x) = 0)", () => {
    const result = generateA4Instance({
      universalFormulaText: "all x. ~(S(x) = 0)",
    });
    expect(result._tag).toBe("Success");
    if (result._tag !== "Success") return;
    // (∀x. ¬(S(x) = 0)) → ¬(S(τ) = 0)
    expect(result.dslText).toContain("τ");
    expect(result.dslText).toContain("¬");
  });

  it("generates instance from ∀x. ∀y. x = y → y = x", () => {
    // 外側の∀だけが対象
    const result = generateA4Instance({
      universalFormulaText: "all x. all y. x = y -> y = x",
    });
    expect(result._tag).toBe("Success");
    if (result._tag !== "Success") return;
    // (∀x. ∀y. x = y → y = x) → ∀y. τ = y → y = τ
    expect(result.dslText).toContain("τ");
    expect(result.boundVariableName).toBe("x");
  });

  it("returns ParseError for invalid formula", () => {
    const result = generateA4Instance({
      universalFormulaText: "invalid @@@ formula",
    });
    expect(result._tag).toBe("ParseError");
  });

  it("returns NotUniversalFormula for non-universal formula", () => {
    const result = generateA4Instance({
      universalFormulaText: "phi -> psi",
    });
    expect(result._tag).toBe("NotUniversalFormula");
  });

  it("returns NotUniversalFormula for existential formula", () => {
    const result = generateA4Instance({
      universalFormulaText: "exists x. P(x)",
    });
    expect(result._tag).toBe("NotUniversalFormula");
  });

  it("handles formula where variable does not appear in body", () => {
    const result = generateA4Instance({
      universalFormulaText: "all x. phi",
    });
    expect(result._tag).toBe("Success");
    if (result._tag !== "Success") return;
    // 変数が本体に出現しないので、φ[τ/x] = φ
    expect(result.boundVariableName).toBe("x");
  });

  it("generated dslText is re-parseable and matches A4 pattern", () => {
    const result = generateA4Instance({
      universalFormulaText: "all x. x + 0 = x",
    });
    expect(result._tag).toBe("Success");
    if (result._tag !== "Success") return;

    // dslText をパーサーに通す
    const parsed = parseFormula(result.dslText);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    // メタ変数τをそのまま含むので、A4マッチャーはメタ変数を項変数として扱えない
    // ただし「パースが成功する」ことと「構造が正しい」ことを確認
    expect(parsed.formula._tag).toBe("Implication");
    if (parsed.formula._tag !== "Implication") return;
    expect(parsed.formula.left._tag).toBe("Universal");
  });

  it("round-trip: after term substitution, result is valid A4 instance", () => {
    const result = generateA4Instance({
      universalFormulaText: "all x. x + 0 = x",
    });
    expect(result._tag).toBe("Success");
    if (result._tag !== "Success") return;

    // τ を 0 で置換した結果をパースし、A4マッチャーで検証
    const substitutedText = result.dslText.replaceAll("τ", "0");
    const parsed = parseFormula(substitutedText);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const a4match = matchAxiomA4(parsed.formula);
    expect(a4match._tag).toBe("Ok");
  });
});

// --- A5 テスト ---

describe("generateA5Instance", () => {
  it("generates instance from valid inputs", () => {
    const result = generateA5Instance({
      variableName: "x",
      antecedentText: "P(a)",
      consequentText: "Q(x)",
    });
    expect(result._tag).toBe("Success");
    if (result._tag !== "Success") return;
    // ∀x.(P(a) → Q(x)) → (P(a) → ∀x.Q(x))
    expect(result.dslText).toContain("→");
    expect(result.dslText).toContain("∀");
  });

  it("generates instance with propositional antecedent", () => {
    const result = generateA5Instance({
      variableName: "x",
      antecedentText: "phi",
      consequentText: "P(x)",
    });
    expect(result._tag).toBe("Success");
    if (result._tag !== "Success") return;
    expect(result.dslText).toContain("φ");
  });

  it("returns VariableFreeInAntecedent when x is free in φ", () => {
    const result = generateA5Instance({
      variableName: "x",
      antecedentText: "P(x)",
      consequentText: "Q(x)",
    });
    expect(result._tag).toBe("VariableFreeInAntecedent");
  });

  it("returns AntecedentParseError for invalid antecedent", () => {
    const result = generateA5Instance({
      variableName: "x",
      antecedentText: "invalid @@@",
      consequentText: "Q(x)",
    });
    expect(result._tag).toBe("AntecedentParseError");
  });

  it("returns ConsequentParseError for invalid consequent", () => {
    const result = generateA5Instance({
      variableName: "x",
      antecedentText: "phi",
      consequentText: "invalid @@@",
    });
    expect(result._tag).toBe("ConsequentParseError");
  });

  it("returns EmptyVariableName for empty variable", () => {
    const result = generateA5Instance({
      variableName: "",
      antecedentText: "phi",
      consequentText: "psi",
    });
    expect(result._tag).toBe("EmptyVariableName");
  });

  it("returns EmptyVariableName for whitespace-only variable", () => {
    const result = generateA5Instance({
      variableName: "  ",
      antecedentText: "phi",
      consequentText: "psi",
    });
    expect(result._tag).toBe("EmptyVariableName");
  });

  it("generated dslText is re-parseable", () => {
    const result = generateA5Instance({
      variableName: "x",
      antecedentText: "P(a)",
      consequentText: "Q(x)",
    });
    expect(result._tag).toBe("Success");
    if (result._tag !== "Success") return;

    const parsed = parseFormula(result.dslText);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    // 構造チェック: A5マッチャーで検証
    const a5match = matchAxiomA5(parsed.formula);
    expect(a5match._tag).toBe("Ok");
  });
});

// --- validateUniversalFormula テスト ---

describe("validateUniversalFormula", () => {
  it("returns Valid for universal formula", () => {
    const result = validateUniversalFormula("all x. x + 0 = x");
    expect(result._tag).toBe("Valid");
    if (result._tag !== "Valid") return;
    expect(result.variable).toBe("x");
  });

  it("returns ParseError for invalid formula", () => {
    const result = validateUniversalFormula("@@@ invalid");
    expect(result._tag).toBe("ParseError");
  });

  it("returns NotUniversal for non-universal formula", () => {
    const result = validateUniversalFormula("phi -> psi");
    expect(result._tag).toBe("NotUniversal");
  });

  it("accepts Unicode syntax", () => {
    const result = validateUniversalFormula("∀x. x = x");
    expect(result._tag).toBe("Valid");
    if (result._tag !== "Valid") return;
    expect(result.variable).toBe("x");
  });
});

// --- validateA5Antecedent テスト ---

describe("validateA5Antecedent", () => {
  it("returns Valid when variable is not free in antecedent", () => {
    const result = validateA5Antecedent("P(a)", "x");
    expect(result._tag).toBe("Valid");
  });

  it("returns VariableFreeInAntecedent when variable is free", () => {
    const result = validateA5Antecedent("P(x)", "x");
    expect(result._tag).toBe("VariableFreeInAntecedent");
  });

  it("returns ParseError for invalid formula", () => {
    const result = validateA5Antecedent("@@@ invalid", "x");
    expect(result._tag).toBe("ParseError");
  });

  it("returns Valid when variable is bound in antecedent", () => {
    const result = validateA5Antecedent("all x. P(x)", "x");
    expect(result._tag).toBe("Valid");
  });
});

// --- エラーメッセージテスト ---

describe("getA4ErrorMessage", () => {
  it("returns message for ParseError", () => {
    expect(getA4ErrorMessage({ _tag: "ParseError", message: "test" })).toBe(
      "Invalid formula syntax",
    );
  });

  it("returns message for NotUniversalFormula", () => {
    expect(getA4ErrorMessage({ _tag: "NotUniversalFormula" })).toBe(
      "Formula must start with ∀ (universal quantifier)",
    );
  });
});

describe("getA5ErrorMessage", () => {
  it("returns message for AntecedentParseError", () => {
    expect(
      getA5ErrorMessage({ _tag: "AntecedentParseError", message: "test" }),
    ).toBe("Invalid antecedent formula syntax");
  });

  it("returns message for ConsequentParseError", () => {
    expect(
      getA5ErrorMessage({ _tag: "ConsequentParseError", message: "test" }),
    ).toBe("Invalid consequent formula syntax");
  });

  it("returns message for VariableFreeInAntecedent", () => {
    expect(getA5ErrorMessage({ _tag: "VariableFreeInAntecedent" })).toBe(
      "Variable must not be free in antecedent (φ)",
    );
  });

  it("returns message for EmptyVariableName", () => {
    expect(getA5ErrorMessage({ _tag: "EmptyVariableName" })).toBe(
      "Variable name is required",
    );
  });
});
