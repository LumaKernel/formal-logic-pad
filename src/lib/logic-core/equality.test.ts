import { describe, it, expect } from "vitest";
import { equalTerm, equalFormula, equivalentFormula } from "./equality";
import {
  termVariable,
  termMetaVariable,
  constant,
  functionApplication,
  binaryOperation,
} from "./term";
import {
  metaVariable,
  negation,
  implication,
  conjunction,
  disjunction,
  biconditional,
  universal,
  existential,
  predicate,
  equality,
  formulaSubstitution,
  freeVariableAbsence,
} from "./formula";

describe("equalTerm", () => {
  it("returns true for identical TermVariable", () => {
    expect(equalTerm(termVariable("x"), termVariable("x"))).toBe(true);
  });

  it("returns false for different TermVariable names", () => {
    expect(equalTerm(termVariable("x"), termVariable("y"))).toBe(false);
  });

  it("returns true for identical TermMetaVariable without subscript", () => {
    expect(equalTerm(termMetaVariable("τ"), termMetaVariable("τ"))).toBe(true);
  });

  it("returns true for identical TermMetaVariable with subscript", () => {
    expect(
      equalTerm(termMetaVariable("τ", "1"), termMetaVariable("τ", "1")),
    ).toBe(true);
  });

  it("returns false for different TermMetaVariable names", () => {
    expect(equalTerm(termMetaVariable("τ"), termMetaVariable("σ"))).toBe(false);
  });

  it("returns false for different TermMetaVariable subscripts", () => {
    expect(
      equalTerm(termMetaVariable("τ", "1"), termMetaVariable("τ", "01")),
    ).toBe(false);
  });

  it("returns false for TermMetaVariable with vs without subscript", () => {
    expect(equalTerm(termMetaVariable("τ", "1"), termMetaVariable("τ"))).toBe(
      false,
    );
  });

  it("returns true for identical Constant", () => {
    expect(equalTerm(constant("0"), constant("0"))).toBe(true);
  });

  it("returns false for different Constants", () => {
    expect(equalTerm(constant("0"), constant("1"))).toBe(false);
  });

  it("returns true for identical FunctionApplication", () => {
    const a = functionApplication("f", [termVariable("x"), termVariable("y")]);
    const b = functionApplication("f", [termVariable("x"), termVariable("y")]);
    expect(equalTerm(a, b)).toBe(true);
  });

  it("returns false for FunctionApplication with different name", () => {
    const a = functionApplication("f", [termVariable("x")]);
    const b = functionApplication("g", [termVariable("x")]);
    expect(equalTerm(a, b)).toBe(false);
  });

  it("returns false for FunctionApplication with different arg count", () => {
    const a = functionApplication("f", [termVariable("x")]);
    const b = functionApplication("f", [termVariable("x"), termVariable("y")]);
    expect(equalTerm(a, b)).toBe(false);
  });

  it("returns false for FunctionApplication with different args", () => {
    const a = functionApplication("f", [termVariable("x")]);
    const b = functionApplication("f", [termVariable("y")]);
    expect(equalTerm(a, b)).toBe(false);
  });

  it("returns true for identical BinaryOperation", () => {
    const a = binaryOperation("+", termVariable("x"), termVariable("y"));
    const b = binaryOperation("+", termVariable("x"), termVariable("y"));
    expect(equalTerm(a, b)).toBe(true);
  });

  it("returns false for BinaryOperation with different operator", () => {
    const a = binaryOperation("+", termVariable("x"), termVariable("y"));
    const b = binaryOperation("*", termVariable("x"), termVariable("y"));
    expect(equalTerm(a, b)).toBe(false);
  });

  it("returns false for BinaryOperation with different operands", () => {
    const a = binaryOperation("+", termVariable("x"), termVariable("y"));
    const b = binaryOperation("+", termVariable("y"), termVariable("x"));
    expect(equalTerm(a, b)).toBe(false);
  });

  it("returns false for different _tag", () => {
    expect(equalTerm(termVariable("x"), constant("x"))).toBe(false);
  });

  it("handles nested terms", () => {
    const a = functionApplication("f", [
      binaryOperation("+", termVariable("x"), constant("0")),
    ]);
    const b = functionApplication("f", [
      binaryOperation("+", termVariable("x"), constant("0")),
    ]);
    expect(equalTerm(a, b)).toBe(true);
  });

  it("detects difference in deeply nested terms", () => {
    const a = functionApplication("f", [
      binaryOperation("+", termVariable("x"), constant("0")),
    ]);
    const b = functionApplication("f", [
      binaryOperation("+", termVariable("x"), constant("1")),
    ]);
    expect(equalTerm(a, b)).toBe(false);
  });
});

describe("equalFormula", () => {
  it("returns true for identical MetaVariable without subscript", () => {
    expect(equalFormula(metaVariable("φ"), metaVariable("φ"))).toBe(true);
  });

  it("returns true for identical MetaVariable with subscript", () => {
    expect(equalFormula(metaVariable("φ", "1"), metaVariable("φ", "1"))).toBe(
      true,
    );
  });

  it("returns false for different MetaVariable names", () => {
    expect(equalFormula(metaVariable("φ"), metaVariable("ψ"))).toBe(false);
  });

  it("returns false for different MetaVariable subscripts", () => {
    expect(equalFormula(metaVariable("φ", "1"), metaVariable("φ", "01"))).toBe(
      false,
    );
  });

  it("distinguishes φ vs φ1 vs φ01 vs φ001", () => {
    const phi = metaVariable("φ");
    const phi1 = metaVariable("φ", "1");
    const phi01 = metaVariable("φ", "01");
    const phi001 = metaVariable("φ", "001");
    expect(equalFormula(phi, phi1)).toBe(false);
    expect(equalFormula(phi1, phi01)).toBe(false);
    expect(equalFormula(phi01, phi001)).toBe(false);
    expect(equalFormula(phi, phi001)).toBe(false);
  });

  it("returns true for identical Negation", () => {
    expect(
      equalFormula(negation(metaVariable("φ")), negation(metaVariable("φ"))),
    ).toBe(true);
  });

  it("returns false for Negation with different inner formula", () => {
    expect(
      equalFormula(negation(metaVariable("φ")), negation(metaVariable("ψ"))),
    ).toBe(false);
  });

  it("returns true for identical Implication", () => {
    const a = implication(metaVariable("φ"), metaVariable("ψ"));
    const b = implication(metaVariable("φ"), metaVariable("ψ"));
    expect(equalFormula(a, b)).toBe(true);
  });

  it("returns false for Implication with swapped sides", () => {
    const a = implication(metaVariable("φ"), metaVariable("ψ"));
    const b = implication(metaVariable("ψ"), metaVariable("φ"));
    expect(equalFormula(a, b)).toBe(false);
  });

  it("returns true for identical Conjunction", () => {
    const a = conjunction(metaVariable("φ"), metaVariable("ψ"));
    const b = conjunction(metaVariable("φ"), metaVariable("ψ"));
    expect(equalFormula(a, b)).toBe(true);
  });

  it("returns true for identical Disjunction", () => {
    const a = disjunction(metaVariable("φ"), metaVariable("ψ"));
    const b = disjunction(metaVariable("φ"), metaVariable("ψ"));
    expect(equalFormula(a, b)).toBe(true);
  });

  it("returns true for identical Biconditional", () => {
    const a = biconditional(metaVariable("φ"), metaVariable("ψ"));
    const b = biconditional(metaVariable("φ"), metaVariable("ψ"));
    expect(equalFormula(a, b)).toBe(true);
  });

  it("returns true for identical Universal", () => {
    const a = universal(termVariable("x"), metaVariable("φ"));
    const b = universal(termVariable("x"), metaVariable("φ"));
    expect(equalFormula(a, b)).toBe(true);
  });

  it("returns false for Universal with different variable", () => {
    const a = universal(termVariable("x"), metaVariable("φ"));
    const b = universal(termVariable("y"), metaVariable("φ"));
    expect(equalFormula(a, b)).toBe(false);
  });

  it("returns true for identical Existential", () => {
    const a = existential(termVariable("x"), metaVariable("φ"));
    const b = existential(termVariable("x"), metaVariable("φ"));
    expect(equalFormula(a, b)).toBe(true);
  });

  it("returns true for identical Predicate", () => {
    const a = predicate("P", [termVariable("x"), termVariable("y")]);
    const b = predicate("P", [termVariable("x"), termVariable("y")]);
    expect(equalFormula(a, b)).toBe(true);
  });

  it("returns false for Predicate with different name", () => {
    const a = predicate("P", [termVariable("x")]);
    const b = predicate("Q", [termVariable("x")]);
    expect(equalFormula(a, b)).toBe(false);
  });

  it("returns false for Predicate with different args", () => {
    const a = predicate("P", [termVariable("x")]);
    const b = predicate("P", [termVariable("y")]);
    expect(equalFormula(a, b)).toBe(false);
  });

  it("returns false for Predicate with different arg count", () => {
    const a = predicate("P", [termVariable("x")]);
    const b = predicate("P", [termVariable("x"), termVariable("y")]);
    expect(equalFormula(a, b)).toBe(false);
  });

  it("returns true for identical Equality", () => {
    const a = equality(termVariable("x"), termVariable("y"));
    const b = equality(termVariable("x"), termVariable("y"));
    expect(equalFormula(a, b)).toBe(true);
  });

  it("returns false for Equality with swapped sides", () => {
    const a = equality(termVariable("x"), termVariable("y"));
    const b = equality(termVariable("y"), termVariable("x"));
    expect(equalFormula(a, b)).toBe(false);
  });

  it("returns false for different _tag", () => {
    expect(equalFormula(metaVariable("φ"), negation(metaVariable("φ")))).toBe(
      false,
    );
  });

  it("handles K axiom: φ→(ψ→φ)", () => {
    const k1 = implication(
      metaVariable("φ"),
      implication(metaVariable("ψ"), metaVariable("φ")),
    );
    const k2 = implication(
      metaVariable("φ"),
      implication(metaVariable("ψ"), metaVariable("φ")),
    );
    expect(equalFormula(k1, k2)).toBe(true);
  });

  it("handles S axiom: (φ→(ψ→χ))→((φ→ψ)→(φ→χ))", () => {
    const s1 = implication(
      implication(
        metaVariable("φ"),
        implication(metaVariable("ψ"), metaVariable("χ")),
      ),
      implication(
        implication(metaVariable("φ"), metaVariable("ψ")),
        implication(metaVariable("φ"), metaVariable("χ")),
      ),
    );
    const s2 = implication(
      implication(
        metaVariable("φ"),
        implication(metaVariable("ψ"), metaVariable("χ")),
      ),
      implication(
        implication(metaVariable("φ"), metaVariable("ψ")),
        implication(metaVariable("φ"), metaVariable("χ")),
      ),
    );
    expect(equalFormula(s1, s2)).toBe(true);
  });

  it("detects difference in complex formula", () => {
    const a = implication(
      metaVariable("φ"),
      implication(metaVariable("ψ"), metaVariable("φ")),
    );
    const b = implication(
      metaVariable("φ"),
      implication(metaVariable("ψ"), metaVariable("ψ")),
    );
    expect(equalFormula(a, b)).toBe(false);
  });

  it("handles ∀x. P(x) = ∀x. P(x)", () => {
    const a = universal(termVariable("x"), predicate("P", [termVariable("x")]));
    const b = universal(termVariable("x"), predicate("P", [termVariable("x")]));
    expect(equalFormula(a, b)).toBe(true);
  });

  it("returns true for identical FormulaSubstitution", () => {
    const a = formulaSubstitution(
      metaVariable("φ"),
      termVariable("y"),
      termVariable("x"),
    );
    const b = formulaSubstitution(
      metaVariable("φ"),
      termVariable("y"),
      termVariable("x"),
    );
    expect(equalFormula(a, b)).toBe(true);
  });

  it("returns false for FormulaSubstitution with different variable", () => {
    const a = formulaSubstitution(
      metaVariable("φ"),
      termVariable("y"),
      termVariable("x"),
    );
    const b = formulaSubstitution(
      metaVariable("φ"),
      termVariable("y"),
      termVariable("z"),
    );
    expect(equalFormula(a, b)).toBe(false);
  });

  it("returns true for identical FreeVariableAbsence", () => {
    const a = freeVariableAbsence(metaVariable("φ"), termVariable("x"));
    const b = freeVariableAbsence(metaVariable("φ"), termVariable("x"));
    expect(equalFormula(a, b)).toBe(true);
  });

  it("returns false for FreeVariableAbsence with different formula", () => {
    const a = freeVariableAbsence(metaVariable("φ"), termVariable("x"));
    const b = freeVariableAbsence(metaVariable("ψ"), termVariable("x"));
    expect(equalFormula(a, b)).toBe(false);
  });

  it("returns false for FreeVariableAbsence with different variable", () => {
    const a = freeVariableAbsence(metaVariable("φ"), termVariable("x"));
    const b = freeVariableAbsence(metaVariable("φ"), termVariable("y"));
    expect(equalFormula(a, b)).toBe(false);
  });

  it("returns false for FreeVariableAbsence vs FormulaSubstitution", () => {
    const a = freeVariableAbsence(metaVariable("φ"), termVariable("x"));
    const b = formulaSubstitution(
      metaVariable("φ"),
      termVariable("y"),
      termVariable("x"),
    );
    expect(equalFormula(a, b)).toBe(false);
  });
});

// ── equivalentFormula ───────────────────────────────────────

describe("equivalentFormula", () => {
  const x = termVariable("x");
  const y = termVariable("y");
  const a = constant("a");

  it("構造的に等しい式は等価", () => {
    const f = predicate("P", [x]);
    expect(equivalentFormula(f, f)).toBe(true);
  });

  it("P(x)[a/x] ≡ P(a) — 置換の解決", () => {
    const withSubst = formulaSubstitution(predicate("P", [x]), a, x);
    const resolved = predicate("P", [a]);
    expect(equivalentFormula(withSubst, resolved)).toBe(true);
  });

  it("P(y)[/x] ≡ P(y) — 自明なFreeVariableAbsenceの除去", () => {
    const withAbsence = freeVariableAbsence(predicate("P", [y]), x);
    const plain = predicate("P", [y]);
    expect(equivalentFormula(withAbsence, plain)).toBe(true);
  });

  it("P(x)[/x] ≢ P(x) — 自由な変数のFreeVariableAbsenceは除去されない", () => {
    const withAbsence = freeVariableAbsence(predicate("P", [x]), x);
    const plain = predicate("P", [x]);
    expect(equivalentFormula(withAbsence, plain)).toBe(false);
  });

  it("P(x)[a/x][/x] ≡ P(a) — 置換解決後にFreeVariableAbsence除去", () => {
    const inner = formulaSubstitution(predicate("P", [x]), a, x);
    const withAbsence = freeVariableAbsence(inner, x);
    const resolved = predicate("P", [a]);
    expect(equivalentFormula(withAbsence, resolved)).toBe(true);
  });

  it("両辺に置換がある場合: P(x)[a/x] ≡ Q(x)[a/x] は P(a)≡Q(a) と同じ", () => {
    const left = formulaSubstitution(predicate("P", [x]), a, x);
    const right = formulaSubstitution(predicate("Q", [x]), a, x);
    expect(equivalentFormula(left, right)).toBe(false);
  });

  it("対称性: a ≡ b ⟺ b ≡ a", () => {
    const withSubst = formulaSubstitution(predicate("P", [x]), a, x);
    const resolved = predicate("P", [a]);
    expect(equivalentFormula(resolved, withSubst)).toBe(true);
  });

  it("含意内の等価性: (P(x)[a/x] → Q(y)) ≡ (P(a) → Q(y))", () => {
    const left = implication(
      formulaSubstitution(predicate("P", [x]), a, x),
      predicate("Q", [y]),
    );
    const right = implication(predicate("P", [a]), predicate("Q", [y]));
    expect(equivalentFormula(left, right)).toBe(true);
  });
});
