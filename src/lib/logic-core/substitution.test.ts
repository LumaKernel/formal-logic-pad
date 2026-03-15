import { describe, expect, test } from "vitest";
import {
  substituteFormulaMetaVariables,
  substituteTermMetaVariablesInTerm,
  substituteTermMetaVariablesInFormula,
  substituteTermVariableInTerm,
  substituteTermVariableInFormula,
  substituteTermVariableChecked,
  isFreeFor,
  composeFormulaSubstitution,
  composeTermMetaSubstitution,
  buildFormulaSubstitutionMap,
  buildTermMetaSubstitutionMap,
  freshVariableName,
  resolveFormulaSubstitution,
  normalizeFormula,
} from "./substitution";
import { equalFormula, equalTerm, equivalentFormula } from "./equality";
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
import {
  termVariable,
  termMetaVariable,
  constant,
  functionApplication,
  binaryOperation,
} from "./term";

// ── freshVariableName ────────────────────────────────────────

describe("freshVariableName", () => {
  test("generates prime-suffixed name", () => {
    expect(freshVariableName("x", new Set(["x"]))).toBe("x'");
  });

  test("adds multiple primes if needed", () => {
    expect(freshVariableName("x", new Set(["x", "x'"]))).toBe("x''");
  });

  test("works with unused base", () => {
    // base + ' が使われていなければそれを返す
    expect(freshVariableName("y", new Set(["x"]))).toBe("y'");
  });
});

// ── 1. 論理式メタ変数代入 ──────────────────────────────────────

describe("substituteFormulaMetaVariables", () => {
  const phi = metaVariable("φ");
  const psi = metaVariable("ψ");
  const chi = metaVariable("χ");
  const px = predicate("P", [termVariable("x")]);
  const qxy = predicate("Q", [termVariable("x"), termVariable("y")]);

  test("empty substitution returns same formula", () => {
    const result = substituteFormulaMetaVariables(phi, new Map());
    expect(equalFormula(result, phi)).toBe(true);
  });

  test("substitute single MetaVariable", () => {
    const subst = buildFormulaSubstitutionMap([[phi, px]]);
    const result = substituteFormulaMetaVariables(phi, subst);
    expect(equalFormula(result, px)).toBe(true);
  });

  test("non-matching MetaVariable is unchanged", () => {
    const subst = buildFormulaSubstitutionMap([[phi, px]]);
    const result = substituteFormulaMetaVariables(psi, subst);
    expect(equalFormula(result, psi)).toBe(true);
  });

  test("substitute in Negation", () => {
    const f = negation(phi);
    const subst = buildFormulaSubstitutionMap([[phi, px]]);
    const result = substituteFormulaMetaVariables(f, subst);
    expect(equalFormula(result, negation(px))).toBe(true);
  });

  test("substitute in Implication", () => {
    const f = implication(phi, psi);
    const subst = buildFormulaSubstitutionMap([
      [phi, px],
      [psi, qxy],
    ]);
    const result = substituteFormulaMetaVariables(f, subst);
    expect(equalFormula(result, implication(px, qxy))).toBe(true);
  });

  test("substitute in Conjunction", () => {
    const f = conjunction(phi, psi);
    const subst = buildFormulaSubstitutionMap([
      [phi, px],
      [psi, qxy],
    ]);
    const result = substituteFormulaMetaVariables(f, subst);
    expect(equalFormula(result, conjunction(px, qxy))).toBe(true);
  });

  test("substitute in Disjunction", () => {
    const f = disjunction(phi, psi);
    const subst = buildFormulaSubstitutionMap([
      [phi, px],
      [psi, qxy],
    ]);
    const result = substituteFormulaMetaVariables(f, subst);
    expect(equalFormula(result, disjunction(px, qxy))).toBe(true);
  });

  test("substitute in Biconditional", () => {
    const f = biconditional(phi, psi);
    const subst = buildFormulaSubstitutionMap([
      [phi, px],
      [psi, qxy],
    ]);
    const result = substituteFormulaMetaVariables(f, subst);
    expect(equalFormula(result, biconditional(px, qxy))).toBe(true);
  });

  test("substitute passes through Universal quantifier", () => {
    // ∀x. φ [φ ↦ P(x)] = ∀x. P(x)
    const f = universal(termVariable("x"), phi);
    const subst = buildFormulaSubstitutionMap([[phi, px]]);
    const result = substituteFormulaMetaVariables(f, subst);
    expect(equalFormula(result, universal(termVariable("x"), px))).toBe(true);
  });

  test("substitute passes through Existential quantifier", () => {
    // ∃x. φ [φ ↦ P(x)] = ∃x. P(x)
    const f = existential(termVariable("x"), phi);
    const subst = buildFormulaSubstitutionMap([[phi, px]]);
    const result = substituteFormulaMetaVariables(f, subst);
    expect(equalFormula(result, existential(termVariable("x"), px))).toBe(true);
  });

  test("Predicate is unchanged by formula meta substitution", () => {
    const f = predicate("P", [termVariable("x")]);
    const subst = buildFormulaSubstitutionMap([[phi, px]]);
    const result = substituteFormulaMetaVariables(f, subst);
    expect(equalFormula(result, f)).toBe(true);
  });

  test("Equality is unchanged by formula meta substitution", () => {
    const f = equality(termVariable("x"), termVariable("y"));
    const subst = buildFormulaSubstitutionMap([[phi, px]]);
    const result = substituteFormulaMetaVariables(f, subst);
    expect(equalFormula(result, f)).toBe(true);
  });

  test("A1 axiom instantiation: φ→(ψ→φ)", () => {
    // {φ ↦ P(x), ψ ↦ Q(x,y)}
    const a1 = implication(phi, implication(psi, phi));
    const subst = buildFormulaSubstitutionMap([
      [phi, px],
      [psi, qxy],
    ]);
    const result = substituteFormulaMetaVariables(a1, subst);
    expect(equalFormula(result, implication(px, implication(qxy, px)))).toBe(
      true,
    );
  });

  test("simultaneous substitution (not sequential)", () => {
    // {φ ↦ ψ, ψ ↦ P(x)} applied to φ→ψ
    // Should give ψ→P(x), NOT P(x)→P(x) (which sequential would give)
    const f = implication(phi, psi);
    const subst = buildFormulaSubstitutionMap([
      [phi, psi],
      [psi, px],
    ]);
    const result = substituteFormulaMetaVariables(f, subst);
    expect(equalFormula(result, implication(psi, px))).toBe(true);
  });

  test("MetaVariable with subscript", () => {
    const phi1 = metaVariable("φ", "1");
    const phi01 = metaVariable("φ", "01");
    const f = implication(phi1, phi01);
    const subst = buildFormulaSubstitutionMap([[phi1, px]]);
    const result = substituteFormulaMetaVariables(f, subst);
    expect(equalFormula(result, implication(px, phi01))).toBe(true);
  });

  test("deeply nested substitution", () => {
    // ¬(φ ∧ (ψ ∨ χ)) with all three substituted
    const f = negation(conjunction(phi, disjunction(psi, chi)));
    const rz = predicate("R", [termVariable("z")]);
    const subst = buildFormulaSubstitutionMap([
      [phi, px],
      [psi, qxy],
      [chi, rz],
    ]);
    const result = substituteFormulaMetaVariables(f, subst);
    expect(
      equalFormula(result, negation(conjunction(px, disjunction(qxy, rz)))),
    ).toBe(true);
  });

  test("FormulaSubstitution: substitutes in formula part, preserves term and variable", () => {
    // φ[τ₁/x] with {φ ↦ P(x)} → P(x)[τ₁/x]
    const tau1 = termMetaVariable("τ");
    const fs = formulaSubstitution(phi, tau1, termVariable("x"));
    const subst = buildFormulaSubstitutionMap([[phi, px]]);
    const result = substituteFormulaMetaVariables(fs, subst);
    expect(
      equalFormula(result, formulaSubstitution(px, tau1, termVariable("x"))),
    ).toBe(true);
  });

  test("FormulaSubstitution: non-matching MetaVariable unchanged", () => {
    // ψ[τ/x] with {φ ↦ P(x)} → ψ[τ/x] (ψ not in substitution)
    const tau1 = termMetaVariable("τ");
    const fs = formulaSubstitution(psi, tau1, termVariable("x"));
    const subst = buildFormulaSubstitutionMap([[phi, px]]);
    const result = substituteFormulaMetaVariables(fs, subst);
    expect(
      equalFormula(result, formulaSubstitution(psi, tau1, termVariable("x"))),
    ).toBe(true);
  });
});

// ── 2. 項メタ変数代入 ──────────────────────────────────────────

describe("substituteTermMetaVariablesInTerm", () => {
  const tau = termMetaVariable("τ");
  const sigma = termMetaVariable("σ");
  const fx0 = functionApplication("f", [termVariable("x"), constant("0")]);

  test("empty substitution returns same term", () => {
    const result = substituteTermMetaVariablesInTerm(tau, new Map());
    expect(equalTerm(result, tau)).toBe(true);
  });

  test("substitute single TermMetaVariable", () => {
    const subst = buildTermMetaSubstitutionMap([[tau, fx0]]);
    const result = substituteTermMetaVariablesInTerm(tau, subst);
    expect(equalTerm(result, fx0)).toBe(true);
  });

  test("non-matching TermMetaVariable unchanged", () => {
    const subst = buildTermMetaSubstitutionMap([[tau, fx0]]);
    const result = substituteTermMetaVariablesInTerm(sigma, subst);
    expect(equalTerm(result, sigma)).toBe(true);
  });

  test("TermVariable unchanged", () => {
    const subst = buildTermMetaSubstitutionMap([[tau, fx0]]);
    const result = substituteTermMetaVariablesInTerm(termVariable("x"), subst);
    expect(equalTerm(result, termVariable("x"))).toBe(true);
  });

  test("Constant unchanged", () => {
    const subst = buildTermMetaSubstitutionMap([[tau, fx0]]);
    const result = substituteTermMetaVariablesInTerm(constant("0"), subst);
    expect(equalTerm(result, constant("0"))).toBe(true);
  });

  test("substitute in FunctionApplication", () => {
    const t = functionApplication("g", [tau, termVariable("y")]);
    const subst = buildTermMetaSubstitutionMap([[tau, fx0]]);
    const result = substituteTermMetaVariablesInTerm(t, subst);
    expect(
      equalTerm(result, functionApplication("g", [fx0, termVariable("y")])),
    ).toBe(true);
  });

  test("substitute in BinaryOperation", () => {
    const t = binaryOperation("+", tau, termVariable("y"));
    const subst = buildTermMetaSubstitutionMap([[tau, fx0]]);
    const result = substituteTermMetaVariablesInTerm(t, subst);
    expect(
      equalTerm(result, binaryOperation("+", fx0, termVariable("y"))),
    ).toBe(true);
  });
});

describe("substituteTermMetaVariablesInFormula", () => {
  const tau = termMetaVariable("τ");
  const fx0 = functionApplication("f", [termVariable("x"), constant("0")]);
  const subst = buildTermMetaSubstitutionMap([[tau, fx0]]);

  test("empty substitution", () => {
    const f = predicate("P", [tau]);
    const result = substituteTermMetaVariablesInFormula(f, new Map());
    expect(equalFormula(result, f)).toBe(true);
  });

  test("MetaVariable unchanged", () => {
    const f = metaVariable("φ");
    const result = substituteTermMetaVariablesInFormula(f, subst);
    expect(equalFormula(result, f)).toBe(true);
  });

  test("Predicate: substitutes in args", () => {
    const f = predicate("P", [tau]);
    const result = substituteTermMetaVariablesInFormula(f, subst);
    expect(equalFormula(result, predicate("P", [fx0]))).toBe(true);
  });

  test("Equality: substitutes in both sides", () => {
    const f = equality(tau, termVariable("y"));
    const result = substituteTermMetaVariablesInFormula(f, subst);
    expect(equalFormula(result, equality(fx0, termVariable("y")))).toBe(true);
  });

  test("Negation: recurses into body", () => {
    const f = negation(predicate("P", [tau]));
    const result = substituteTermMetaVariablesInFormula(f, subst);
    expect(equalFormula(result, negation(predicate("P", [fx0])))).toBe(true);
  });

  test("Implication: recurses into both sides", () => {
    const f = implication(predicate("P", [tau]), predicate("Q", [tau]));
    const result = substituteTermMetaVariablesInFormula(f, subst);
    expect(
      equalFormula(
        result,
        implication(predicate("P", [fx0]), predicate("Q", [fx0])),
      ),
    ).toBe(true);
  });

  test("Conjunction: recurses", () => {
    const f = conjunction(predicate("P", [tau]), predicate("Q", [tau]));
    const result = substituteTermMetaVariablesInFormula(f, subst);
    expect(
      equalFormula(
        result,
        conjunction(predicate("P", [fx0]), predicate("Q", [fx0])),
      ),
    ).toBe(true);
  });

  test("Disjunction: recurses", () => {
    const f = disjunction(predicate("P", [tau]), predicate("Q", [tau]));
    const result = substituteTermMetaVariablesInFormula(f, subst);
    expect(
      equalFormula(
        result,
        disjunction(predicate("P", [fx0]), predicate("Q", [fx0])),
      ),
    ).toBe(true);
  });

  test("Biconditional: recurses", () => {
    const f = biconditional(predicate("P", [tau]), predicate("Q", [tau]));
    const result = substituteTermMetaVariablesInFormula(f, subst);
    expect(
      equalFormula(
        result,
        biconditional(predicate("P", [fx0]), predicate("Q", [fx0])),
      ),
    ).toBe(true);
  });

  test("Universal: recurses into body, variable unchanged", () => {
    const f = universal(termVariable("x"), predicate("P", [tau]));
    const result = substituteTermMetaVariablesInFormula(f, subst);
    expect(
      equalFormula(result, universal(termVariable("x"), predicate("P", [fx0]))),
    ).toBe(true);
  });

  test("Existential: recurses into body", () => {
    const f = existential(termVariable("x"), predicate("P", [tau]));
    const result = substituteTermMetaVariablesInFormula(f, subst);
    expect(
      equalFormula(
        result,
        existential(termVariable("x"), predicate("P", [fx0])),
      ),
    ).toBe(true);
  });

  test("P(τ) → P(τ) with τ ↦ f(x,0)", () => {
    const f = implication(predicate("P", [tau]), predicate("P", [tau]));
    const result = substituteTermMetaVariablesInFormula(f, subst);
    expect(
      equalFormula(
        result,
        implication(predicate("P", [fx0]), predicate("P", [fx0])),
      ),
    ).toBe(true);
  });

  test("FormulaSubstitution: substitutes in both formula and term parts", () => {
    // P(τ)[τ/x] with {τ ↦ f(x,0)} → P(f(x,0))[f(x,0)/x]
    const fs = formulaSubstitution(
      predicate("P", [tau]),
      tau,
      termVariable("x"),
    );
    const result = substituteTermMetaVariablesInFormula(fs, subst);
    expect(
      equalFormula(
        result,
        formulaSubstitution(predicate("P", [fx0]), fx0, termVariable("x")),
      ),
    ).toBe(true);
  });

  test("FormulaSubstitution: variable unchanged by term meta substitution", () => {
    // φ[τ/y] with {τ ↦ f(x,0)} → φ[f(x,0)/y], variable y stays
    const phi = metaVariable("φ");
    const fs = formulaSubstitution(phi, tau, termVariable("y"));
    const result = substituteTermMetaVariablesInFormula(fs, subst);
    expect(
      equalFormula(result, formulaSubstitution(phi, fx0, termVariable("y"))),
    ).toBe(true);
  });
});

// ── 3. 代入可能性チェック (isFreeFor) ──────────────────────────

describe("isFreeFor", () => {
  test("atomic formula: always free for", () => {
    const f = predicate("P", [termVariable("x"), termVariable("y")]);
    expect(isFreeFor(termVariable("z"), termVariable("x"), f)).toBe(true);
  });

  test("MetaVariable: always free for", () => {
    const f = metaVariable("φ");
    expect(isFreeFor(termVariable("z"), termVariable("x"), f)).toBe(true);
  });

  test("Equality: always free for", () => {
    const f = equality(termVariable("x"), termVariable("y"));
    expect(isFreeFor(termVariable("z"), termVariable("x"), f)).toBe(true);
  });

  test("no quantifiers → always free for", () => {
    const f = implication(
      predicate("P", [termVariable("x")]),
      predicate("Q", [termVariable("x")]),
    );
    expect(isFreeFor(termVariable("y"), termVariable("x"), f)).toBe(true);
  });

  test("∀y.Q(x,y) with [z/x] → free for (z ∉ {y})", () => {
    const f = universal(
      termVariable("y"),
      predicate("Q", [termVariable("x"), termVariable("y")]),
    );
    expect(isFreeFor(termVariable("z"), termVariable("x"), f)).toBe(true);
  });

  test("∀y.Q(x,y) with [y/x] → NOT free for (y ∈ FV(y) ∩ bound vars)", () => {
    const f = universal(
      termVariable("y"),
      predicate("Q", [termVariable("x"), termVariable("y")]),
    );
    expect(isFreeFor(termVariable("y"), termVariable("x"), f)).toBe(false);
  });

  test("∀y.Q(x,y) with [f(y)/x] → NOT free for (y ∈ FV(f(y)))", () => {
    const f = universal(
      termVariable("y"),
      predicate("Q", [termVariable("x"), termVariable("y")]),
    );
    const fy = functionApplication("f", [termVariable("y")]);
    expect(isFreeFor(fy, termVariable("x"), f)).toBe(false);
  });

  test("∀y.∃z.R(x,y,z) with [g(y,z)/x] → NOT free for", () => {
    const f = universal(
      termVariable("y"),
      existential(
        termVariable("z"),
        predicate("R", [
          termVariable("x"),
          termVariable("y"),
          termVariable("z"),
        ]),
      ),
    );
    const gyz = functionApplication("g", [
      termVariable("y"),
      termVariable("z"),
    ]);
    expect(isFreeFor(gyz, termVariable("x"), f)).toBe(false);
  });

  test("(∀y.P(y))→Q(x) with [y/x] → free for (x ∉ FV(∀y.P(y)))", () => {
    const f = implication(
      universal(termVariable("y"), predicate("P", [termVariable("y")])),
      predicate("Q", [termVariable("x")]),
    );
    expect(isFreeFor(termVariable("y"), termVariable("x"), f)).toBe(true);
  });

  test("∀y.(P(y)→Q(x)) with [y/x] → NOT free for (x ∈ FV, y bound)", () => {
    const f = universal(
      termVariable("y"),
      implication(
        predicate("P", [termVariable("y")]),
        predicate("Q", [termVariable("x")]),
      ),
    );
    expect(isFreeFor(termVariable("y"), termVariable("x"), f)).toBe(false);
  });

  test("x not free in formula → always free for", () => {
    // ∀y.P(y) has no free x, so [anything/x] is always free for
    const f = universal(termVariable("y"), predicate("P", [termVariable("y")]));
    const t = functionApplication("f", [termVariable("y")]);
    expect(isFreeFor(t, termVariable("x"), f)).toBe(true);
  });

  test("Negation: recurses into body", () => {
    const f = negation(
      universal(
        termVariable("y"),
        predicate("Q", [termVariable("x"), termVariable("y")]),
      ),
    );
    expect(isFreeFor(termVariable("y"), termVariable("x"), f)).toBe(false);
  });

  test("Conjunction: checks both sides", () => {
    const f = conjunction(
      predicate("P", [termVariable("x")]),
      universal(
        termVariable("y"),
        predicate("Q", [termVariable("x"), termVariable("y")]),
      ),
    );
    expect(isFreeFor(termVariable("y"), termVariable("x"), f)).toBe(false);
  });

  test("Disjunction: checks both sides", () => {
    const f = disjunction(
      predicate("P", [termVariable("x")]),
      universal(
        termVariable("y"),
        predicate("Q", [termVariable("x"), termVariable("y")]),
      ),
    );
    expect(isFreeFor(termVariable("y"), termVariable("x"), f)).toBe(false);
  });

  test("Biconditional: checks both sides", () => {
    const f = biconditional(
      predicate("P", [termVariable("x")]),
      universal(
        termVariable("y"),
        predicate("Q", [termVariable("x"), termVariable("y")]),
      ),
    );
    expect(isFreeFor(termVariable("y"), termVariable("x"), f)).toBe(false);
  });

  test("Existential: same logic as Universal", () => {
    const f = existential(
      termVariable("y"),
      predicate("Q", [termVariable("x"), termVariable("y")]),
    );
    expect(isFreeFor(termVariable("y"), termVariable("x"), f)).toBe(false);
  });

  test("FormulaSubstitution: y == x → always free for", () => {
    // P(x)[τ/x] with [z/x] → x is bound by the substitution, so always free
    const fs = formulaSubstitution(
      predicate("P", [termVariable("x")]),
      termVariable("y"),
      termVariable("x"),
    );
    expect(isFreeFor(termVariable("z"), termVariable("x"), fs)).toBe(true);
  });

  test("FormulaSubstitution: y != x, no capture → free for", () => {
    // P(x)[τ/y] with [z/x] → y not in FV(z), so no capture
    const fs = formulaSubstitution(
      predicate("P", [termVariable("x")]),
      termVariable("a"),
      termVariable("y"),
    );
    expect(isFreeFor(termVariable("z"), termVariable("x"), fs)).toBe(true);
  });

  test("FormulaSubstitution: y != x, y in FV(t), x free in φ → NOT free for", () => {
    // P(x)[τ/y] with [y/x] → y is in FV(y) and x is free in P(x), so capture
    const fs = formulaSubstitution(
      predicate("P", [termVariable("x")]),
      termVariable("a"),
      termVariable("y"),
    );
    expect(isFreeFor(termVariable("y"), termVariable("x"), fs)).toBe(false);
  });

  test("FormulaSubstitution: y != x, y in FV(t), x NOT free in φ → free for", () => {
    // P(z)[τ/y] with [y/x] → y is in FV(y) but x is NOT free in P(z), so OK
    const fs = formulaSubstitution(
      predicate("P", [termVariable("z")]),
      termVariable("a"),
      termVariable("y"),
    );
    expect(isFreeFor(termVariable("y"), termVariable("x"), fs)).toBe(true);
  });

  test("FreeVariableAbsence: delegates to inner formula", () => {
    // P(x)[/y] with [a/x] → isFreeFor checks the inner P(x)
    const fva = freeVariableAbsence(
      predicate("P", [termVariable("x")]),
      termVariable("y"),
    );
    expect(isFreeFor(termVariable("a"), termVariable("x"), fva)).toBe(true);
  });

  test("FreeVariableAbsence: bound variable in inner formula blocks substitution", () => {
    // (∀y.P(x,y))[/z] with [y/x] → y is captured by ∀y in inner formula
    const fva = freeVariableAbsence(
      universal(
        termVariable("y"),
        predicate("P", [termVariable("x"), termVariable("y")]),
      ),
      termVariable("z"),
    );
    expect(isFreeFor(termVariable("y"), termVariable("x"), fva)).toBe(false);
  });
});

// ── 4. 項変数代入（項内） ──────────────────────────────────────

describe("substituteTermVariableInTerm", () => {
  const x = termVariable("x");
  const y = termVariable("y");
  const z = termVariable("z");
  const s = functionApplication("f", [y, constant("0")]);

  test("substitute matching variable", () => {
    const result = substituteTermVariableInTerm(x, x, s);
    expect(equalTerm(result, s)).toBe(true);
  });

  test("non-matching variable unchanged", () => {
    const result = substituteTermVariableInTerm(y, x, s);
    expect(equalTerm(result, y)).toBe(true);
  });

  test("TermMetaVariable unchanged", () => {
    const tau = termMetaVariable("τ");
    const result = substituteTermVariableInTerm(tau, x, s);
    expect(equalTerm(result, tau)).toBe(true);
  });

  test("Constant unchanged", () => {
    const c = constant("0");
    const result = substituteTermVariableInTerm(c, x, s);
    expect(equalTerm(result, c)).toBe(true);
  });

  test("FunctionApplication: recursive substitution", () => {
    const t = functionApplication("g", [x, z]);
    const result = substituteTermVariableInTerm(t, x, s);
    expect(equalTerm(result, functionApplication("g", [s, z]))).toBe(true);
  });

  test("BinaryOperation: recursive substitution", () => {
    const t = binaryOperation("+", x, y);
    const result = substituteTermVariableInTerm(t, x, s);
    expect(equalTerm(result, binaryOperation("+", s, y))).toBe(true);
  });
});

// ── 5. 項変数代入（論理式内） ──────────────────────────────────

describe("substituteTermVariableInFormula", () => {
  const x = termVariable("x");
  const y = termVariable("y");
  const z = termVariable("z");

  test("MetaVariable unchanged", () => {
    const f = metaVariable("φ");
    const result = substituteTermVariableInFormula(f, x, y);
    expect(equalFormula(result, f)).toBe(true);
  });

  test("Predicate: substitutes in args", () => {
    const f = predicate("P", [x, y]);
    const result = substituteTermVariableInFormula(f, x, z);
    expect(equalFormula(result, predicate("P", [z, y]))).toBe(true);
  });

  test("Equality: substitutes in both sides", () => {
    const f = equality(x, y);
    const result = substituteTermVariableInFormula(f, x, z);
    expect(equalFormula(result, equality(z, y))).toBe(true);
  });

  test("Negation: recurses", () => {
    const f = negation(predicate("P", [x]));
    const result = substituteTermVariableInFormula(f, x, z);
    expect(equalFormula(result, negation(predicate("P", [z])))).toBe(true);
  });

  test("Implication: recurses", () => {
    const f = implication(predicate("P", [x]), predicate("Q", [x]));
    const result = substituteTermVariableInFormula(f, x, z);
    expect(
      equalFormula(
        result,
        implication(predicate("P", [z]), predicate("Q", [z])),
      ),
    ).toBe(true);
  });

  test("Conjunction: recurses", () => {
    const f = conjunction(predicate("P", [x]), predicate("Q", [x]));
    const result = substituteTermVariableInFormula(f, x, z);
    expect(
      equalFormula(
        result,
        conjunction(predicate("P", [z]), predicate("Q", [z])),
      ),
    ).toBe(true);
  });

  test("Disjunction: recurses", () => {
    const f = disjunction(predicate("P", [x]), predicate("Q", [x]));
    const result = substituteTermVariableInFormula(f, x, z);
    expect(
      equalFormula(
        result,
        disjunction(predicate("P", [z]), predicate("Q", [z])),
      ),
    ).toBe(true);
  });

  test("Biconditional: recurses", () => {
    const f = biconditional(predicate("P", [x]), predicate("Q", [x]));
    const result = substituteTermVariableInFormula(f, x, z);
    expect(
      equalFormula(
        result,
        biconditional(predicate("P", [z]), predicate("Q", [z])),
      ),
    ).toBe(true);
  });

  test("Universal: bound variable = x → no substitution", () => {
    // ∀x. P(x) [z/x] = ∀x. P(x) (x is bound)
    const f = universal(x, predicate("P", [x]));
    const result = substituteTermVariableInFormula(f, x, z);
    expect(equalFormula(result, f)).toBe(true);
  });

  test("Existential: bound variable = x → no substitution", () => {
    const f = existential(x, predicate("P", [x]));
    const result = substituteTermVariableInFormula(f, x, z);
    expect(equalFormula(result, f)).toBe(true);
  });

  test("Universal: different bound variable, no capture", () => {
    // ∀y. P(x, y) [z/x] = ∀y. P(z, y)
    const f = universal(y, predicate("P", [x, y]));
    const result = substituteTermVariableInFormula(f, x, z);
    expect(equalFormula(result, universal(y, predicate("P", [z, y])))).toBe(
      true,
    );
  });

  test("Existential: different bound variable, no capture", () => {
    const f = existential(y, predicate("P", [x, y]));
    const result = substituteTermVariableInFormula(f, x, z);
    expect(equalFormula(result, existential(y, predicate("P", [z, y])))).toBe(
      true,
    );
  });

  test("Universal: α-conversion to avoid capture", () => {
    // ∀y. (x = y) [y/x] → need α-conversion
    // ∀y. (x = y) → ∀y'. (x = y') → ∀y'. (y = y')
    const f = universal(y, equality(x, y));
    const result = substituteTermVariableInFormula(f, x, y);
    // The bound variable should be renamed (y')
    expect(result._tag).toBe("Universal");
    if (result._tag === "Universal") {
      expect(result.variable.name).not.toBe("y");
      expect(result.variable.name).not.toBe("x");
      // The body should have y substituted for x, and bound var renamed
      expect(result.formula._tag).toBe("Equality");
      if (result.formula._tag === "Equality") {
        expect(equalTerm(result.formula.left, y)).toBe(true);
        expect(equalTerm(result.formula.right, result.variable)).toBe(true);
      }
    }
  });

  test("Existential: α-conversion to avoid capture", () => {
    // ∃y. (x = y) [y/x]
    const f = existential(y, equality(x, y));
    const result = substituteTermVariableInFormula(f, x, y);
    expect(result._tag).toBe("Existential");
    if (result._tag === "Existential") {
      expect(result.variable.name).not.toBe("y");
      expect(result.variable.name).not.toBe("x");
    }
  });

  test("α-conversion with complex replacement term", () => {
    // ∀y. Q(x, y) [f(y)/x] → α-convert y
    const fy = functionApplication("f", [y]);
    const f = universal(y, predicate("Q", [x, y]));
    const result = substituteTermVariableInFormula(f, x, fy);
    expect(result._tag).toBe("Universal");
    if (result._tag === "Universal") {
      // Bound variable renamed to avoid y
      expect(result.variable.name).not.toBe("y");
      expect(result.variable.name).not.toBe("x");
    }
  });

  test("nested quantifiers with capture", () => {
    // ∀y. ∃z. R(x, y, z) [g(y,z)/x]
    const gyz = functionApplication("g", [y, z]);
    const f = universal(y, existential(z, predicate("R", [x, y, z])));
    const result = substituteTermVariableInFormula(f, x, gyz);
    // Both y and z need α-conversion
    expect(result._tag).toBe("Universal");
    if (result._tag === "Universal") {
      expect(result.variable.name).not.toBe("y");
    }
  });

  test("variable rename: [y/x] with no capture", () => {
    // P(x) [y/x] = P(y)
    const f = predicate("P", [x]);
    const result = substituteTermVariableInFormula(f, x, y);
    expect(equalFormula(result, predicate("P", [y]))).toBe(true);
  });

  test("reference example: (∀y.P(y))→Q(x) with [y/x]", () => {
    // x ∉ FV(∀y.P(y)), so ∀y part stays. Q(x) → Q(y)
    const f = implication(
      universal(y, predicate("P", [y])),
      predicate("Q", [x]),
    );
    const result = substituteTermVariableInFormula(f, x, y);
    expect(
      equalFormula(
        result,
        implication(universal(y, predicate("P", [y])), predicate("Q", [y])),
      ),
    ).toBe(true);
  });

  test("FormulaSubstitution: y == x → only substitute in term", () => {
    // P(x, a)[τ/x] with [z/x] → P(x, a)[τ[z/x]/x]
    // The formula part is NOT substituted (x is bound by the FormulaSubstitution)
    const a = constant("a");
    const tau = functionApplication("f", [x]);
    const fs = formulaSubstitution(predicate("P", [x, a]), tau, x);
    const result = substituteTermVariableInFormula(fs, x, z);
    // formula stays: P(x, a), term: f(x)[z/x] = f(z), variable: x
    expect(
      equalFormula(
        result,
        formulaSubstitution(
          predicate("P", [x, a]),
          functionApplication("f", [z]),
          x,
        ),
      ),
    ).toBe(true);
  });

  test("FormulaSubstitution: y != x, no capture → recurse into both", () => {
    // P(x)[τ/y] with [z/x] → P(z)[τ[z/x]/y]
    const tau = functionApplication("f", [x]);
    const fs = formulaSubstitution(predicate("P", [x]), tau, y);
    const result = substituteTermVariableInFormula(fs, x, z);
    expect(
      equalFormula(
        result,
        formulaSubstitution(
          predicate("P", [z]),
          functionApplication("f", [z]),
          y,
        ),
      ),
    ).toBe(true);
  });

  test("FreeVariableAbsence: substitutes in inner formula, preserves wrapper", () => {
    // P(x)[/y] with [z/x] → P(z)[/y]
    const fva = freeVariableAbsence(predicate("P", [x]), y);
    const result = substituteTermVariableInFormula(fva, x, z);
    expect(result._tag).toBe("FreeVariableAbsence");
    if (result._tag === "FreeVariableAbsence") {
      expect(equalFormula(result.formula, predicate("P", [z]))).toBe(true);
      expect(result.variable.name).toBe("y");
    }
  });

  test("FormulaSubstitution: y != x, capture → α-conversion", () => {
    // P(x)[τ/y] with [y/x] → y is in FV(y) and x is free in P(x)
    // Need α-conversion: rename y to fresh variable
    const tau = termVariable("a");
    const fs = formulaSubstitution(predicate("P", [x]), tau, y);
    const result = substituteTermVariableInFormula(fs, x, y);
    // After α-conversion: P(y)[a/y'] for some fresh y'
    expect(result._tag).toBe("FormulaSubstitution");
    if (result._tag === "FormulaSubstitution") {
      // The variable should be renamed (not y, not x)
      expect(result.variable.name).not.toBe("y");
      expect(result.variable.name).not.toBe("x");
    }
  });
});

// ── 6. 検証付き項変数代入 ───────────────────────────────────────

describe("substituteTermVariableChecked", () => {
  const x = termVariable("x");
  const y = termVariable("y");
  const z = termVariable("z");

  test("successful substitution returns Ok", () => {
    const f = predicate("P", [x]);
    const result = substituteTermVariableChecked(f, x, z);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(equalFormula(result.value, predicate("P", [z]))).toBe(true);
    }
  });

  test("capture returns Error with NotFreeFor", () => {
    const f = universal(y, predicate("Q", [x, y]));
    const result = substituteTermVariableChecked(f, x, y);
    expect(result._tag).toBe("Error");
    if (result._tag === "Error") {
      expect(result.error._tag).toBe("NotFreeFor");
    }
  });

  test("no capture with bound same variable", () => {
    // ∀x. P(x) [y/x] → x is bound, no substitution happens
    const f = universal(x, predicate("P", [x]));
    const result = substituteTermVariableChecked(f, x, y);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(equalFormula(result.value, f)).toBe(true);
    }
  });
});

// ── 7. 代入の合成 ──────────────────────────────────────────────

describe("composeFormulaSubstitution", () => {
  const phi = metaVariable("φ");
  const psi = metaVariable("ψ");
  const px = predicate("P", [termVariable("x")]);

  test("σ1 ∘ ε = σ1", () => {
    const sigma1 = buildFormulaSubstitutionMap([[phi, px]]);
    const result = composeFormulaSubstitution(sigma1, new Map());
    expect(result.size).toBe(1);
    expect(result.has("φ")).toBe(true);
  });

  test("ε ∘ σ2 = σ2", () => {
    const sigma2 = buildFormulaSubstitutionMap([[phi, px]]);
    const result = composeFormulaSubstitution(new Map(), sigma2);
    expect(result.size).toBe(1);
    expect(result.has("φ")).toBe(true);
  });

  test("basic composition: σ1={φ↦P(x)}, σ2={ψ↦φ→φ}", () => {
    // σ1 ∘ σ2 = {ψ ↦ P(x)→P(x), φ ↦ P(x)}
    const sigma1 = buildFormulaSubstitutionMap([[phi, px]]);
    const sigma2 = buildFormulaSubstitutionMap([[psi, implication(phi, phi)]]);
    const composed = composeFormulaSubstitution(sigma1, sigma2);

    // Check {ψ ↦ P(x)→P(x)}
    const psiResult = composed.get("ψ");
    expect(psiResult).toBeDefined();
    expect(equalFormula(psiResult!, implication(px, px))).toBe(true);

    // Check {φ ↦ P(x)} (from σ1, not in σ2 domain)
    const phiResult = composed.get("φ");
    expect(phiResult).toBeDefined();
    expect(equalFormula(phiResult!, px)).toBe(true);
  });

  test("overlapping domains: σ1 variable overridden by σ2", () => {
    // σ1 = {φ ↦ P(x)}, σ2 = {φ ↦ ψ}
    // σ1 ∘ σ2 = {φ ↦ σ1(ψ) = ψ}  (because φ is in σ2's domain)
    // But φ ∈ dom(σ2), so σ1's φ entry is not included separately
    const sigma1 = buildFormulaSubstitutionMap([[phi, px]]);
    const sigma2 = buildFormulaSubstitutionMap([[phi, psi]]);
    const composed = composeFormulaSubstitution(sigma1, sigma2);

    // {φ ↦ ψ} (σ2's φ entry with σ1 applied to ψ → ψ unchanged since ψ∉dom(σ1))
    const phiResult = composed.get("φ");
    expect(phiResult).toBeDefined();
    expect(equalFormula(phiResult!, psi)).toBe(true);
  });

  test("identity mapping removed: σ2 maps φ→φ after σ1 application", () => {
    // σ1 = {}, σ2 = {φ ↦ φ}
    // σ1(φ) = φ, which equals φ itself → should be removed
    const sigma1 = new Map<string, typeof phi>();
    const sigma2 = buildFormulaSubstitutionMap([[phi, phi]]);
    const composed = composeFormulaSubstitution(sigma1, sigma2);
    expect(composed.size).toBe(0);
  });

  test("composition with applied formula: verify correctness", () => {
    // σ1 = {φ ↦ P(x)}, σ2 = {ψ ↦ φ→φ}
    // Test: (φ→ψ) with σ2 → (φ→(φ→φ)), then σ1 → (P(x)→(P(x)→P(x)))
    // Composed: should give same result when applied to (φ→ψ)
    const sigma1 = buildFormulaSubstitutionMap([[phi, px]]);
    const sigma2 = buildFormulaSubstitutionMap([[psi, implication(phi, phi)]]);
    const composed = composeFormulaSubstitution(sigma1, sigma2);

    const formula = implication(phi, psi);

    // Sequential application: σ2 then σ1
    const step1 = substituteFormulaMetaVariables(formula, sigma2);
    const sequential = substituteFormulaMetaVariables(step1, sigma1);

    // Composed application
    const composedResult = substituteFormulaMetaVariables(formula, composed);

    expect(equalFormula(sequential, composedResult)).toBe(true);
  });
});

describe("composeTermMetaSubstitution", () => {
  const tau = termMetaVariable("τ");
  const sigma = termMetaVariable("σ");
  const fx = functionApplication("f", [termVariable("x")]);

  test("basic composition", () => {
    const sigma1 = buildTermMetaSubstitutionMap([[tau, fx]]);
    const sigma2 = buildTermMetaSubstitutionMap([
      [sigma, binaryOperation("+", tau, constant("0"))],
    ]);
    const composed = composeTermMetaSubstitution(sigma1, sigma2);

    // {σ ↦ f(x)+0, τ ↦ f(x)}
    const sigmaResult = composed.get("σ");
    expect(sigmaResult).toBeDefined();
    expect(
      equalTerm(sigmaResult!, binaryOperation("+", fx, constant("0"))),
    ).toBe(true);

    const tauResult = composed.get("τ");
    expect(tauResult).toBeDefined();
    expect(equalTerm(tauResult!, fx)).toBe(true);
  });

  test("identity mapping removed", () => {
    const sigma1 = new Map<string, typeof tau>();
    const sigma2 = buildTermMetaSubstitutionMap([[tau, tau]]);
    const composed = composeTermMetaSubstitution(sigma1, sigma2);
    expect(composed.size).toBe(0);
  });
});

// ── 8. 統合テスト ──────────────────────────────────────────────

describe("integration: A1 axiom instantiation", () => {
  test("A1: φ→(ψ→φ) with {φ↦P(x), ψ↦Q(x,y)}", () => {
    const phi = metaVariable("φ");
    const psi = metaVariable("ψ");
    const px = predicate("P", [termVariable("x")]);
    const qxy = predicate("Q", [termVariable("x"), termVariable("y")]);

    const a1 = implication(phi, implication(psi, phi));
    const subst = buildFormulaSubstitutionMap([
      [phi, px],
      [psi, qxy],
    ]);
    const result = substituteFormulaMetaVariables(a1, subst);

    expect(equalFormula(result, implication(px, implication(qxy, px)))).toBe(
      true,
    );
  });
});

describe("integration: A2 axiom instantiation", () => {
  test("A2: (φ→(ψ→χ))→((φ→ψ)→(φ→χ)) S公理", () => {
    const phi = metaVariable("φ");
    const psi = metaVariable("ψ");
    const chi = metaVariable("χ");
    const px = predicate("P", [termVariable("x")]);
    const pxpx = implication(px, px);

    const a2 = implication(
      implication(phi, implication(psi, chi)),
      implication(implication(phi, psi), implication(phi, chi)),
    );
    const subst = buildFormulaSubstitutionMap([
      [phi, px],
      [psi, pxpx],
      [chi, px],
    ]);
    const result = substituteFormulaMetaVariables(a2, subst);

    const expected = implication(
      implication(px, implication(pxpx, px)),
      implication(implication(px, pxpx), implication(px, px)),
    );
    expect(equalFormula(result, expected)).toBe(true);
  });
});

describe("integration: A4 universal instantiation", () => {
  test("∀x. P(x)∧Q(x) with [a/x] → P(a)∧Q(a)", () => {
    const x = termVariable("x");
    const a = constant("a");
    const body = conjunction(predicate("P", [x]), predicate("Q", [x]));
    const result = substituteTermVariableInFormula(body, x, a);
    expect(
      equalFormula(
        result,
        conjunction(predicate("P", [a]), predicate("Q", [a])),
      ),
    ).toBe(true);
  });
});

// ── 9. resolveFormulaSubstitution ────────────────────────────────

describe("resolveFormulaSubstitution", () => {
  const x = termVariable("x");
  const y = termVariable("y");
  const z = termVariable("z");
  const a = constant("a");
  const b = constant("b");
  const phi = metaVariable("φ");

  test("FormulaSubstitutionがない論理式はそのまま返る", () => {
    const f = implication(predicate("P", [x]), predicate("Q", [y]));
    const result = resolveFormulaSubstitution(f);
    expect(equalFormula(result, f)).toBe(true);
  });

  test("基本的な置換: P(x)[a/x] → P(a)", () => {
    const f = formulaSubstitution(predicate("P", [x]), a, x);
    const result = resolveFormulaSubstitution(f);
    expect(equalFormula(result, predicate("P", [a]))).toBe(true);
  });

  test("対象でない変数は置換されない: P(y)[a/x] → P(y)", () => {
    const f = formulaSubstitution(predicate("P", [y]), a, x);
    const result = resolveFormulaSubstitution(f);
    expect(equalFormula(result, predicate("P", [y]))).toBe(true);
  });

  test("複数の出現: P(x,x)[a/x] → P(a,a)", () => {
    const f = formulaSubstitution(predicate("P", [x, x]), a, x);
    const result = resolveFormulaSubstitution(f);
    expect(equalFormula(result, predicate("P", [a, a]))).toBe(true);
  });

  test("連鎖置換: P(x)[a/x][b/y] → P(a)", () => {
    // P(x)[a/x] → P(a)、その結果にはyがないので[b/y]は変化なし
    const inner = formulaSubstitution(predicate("P", [x]), a, x);
    const f = formulaSubstitution(inner, b, y);
    const result = resolveFormulaSubstitution(f);
    expect(equalFormula(result, predicate("P", [a]))).toBe(true);
  });

  test("連鎖置換(効果あり): P(x,y)[a/x][b/y] → P(a,b)", () => {
    const inner = formulaSubstitution(predicate("P", [x, y]), a, x);
    const f = formulaSubstitution(inner, b, y);
    const result = resolveFormulaSubstitution(f);
    expect(equalFormula(result, predicate("P", [a, b]))).toBe(true);
  });

  test("否定内の置換: ¬(P(x)[a/x]) → ¬P(a)", () => {
    const f = negation(formulaSubstitution(predicate("P", [x]), a, x));
    const result = resolveFormulaSubstitution(f);
    expect(equalFormula(result, negation(predicate("P", [a])))).toBe(true);
  });

  test("含意内の置換: P(x)[a/x] → Q(y)[b/y] → P(a)→Q(b)", () => {
    const f = implication(
      formulaSubstitution(predicate("P", [x]), a, x),
      formulaSubstitution(predicate("Q", [y]), b, y),
    );
    const result = resolveFormulaSubstitution(f);
    expect(
      equalFormula(
        result,
        implication(predicate("P", [a]), predicate("Q", [b])),
      ),
    ).toBe(true);
  });

  test("連言内の置換", () => {
    const f = conjunction(
      formulaSubstitution(predicate("P", [x]), a, x),
      predicate("Q", [y]),
    );
    const result = resolveFormulaSubstitution(f);
    expect(
      equalFormula(
        result,
        conjunction(predicate("P", [a]), predicate("Q", [y])),
      ),
    ).toBe(true);
  });

  test("選言内の置換", () => {
    const f = disjunction(
      predicate("P", [y]),
      formulaSubstitution(predicate("Q", [x]), a, x),
    );
    const result = resolveFormulaSubstitution(f);
    expect(
      equalFormula(
        result,
        disjunction(predicate("P", [y]), predicate("Q", [a])),
      ),
    ).toBe(true);
  });

  test("双条件内の置換", () => {
    const f = biconditional(
      formulaSubstitution(predicate("P", [x]), a, x),
      formulaSubstitution(predicate("Q", [x]), b, x),
    );
    const result = resolveFormulaSubstitution(f);
    expect(
      equalFormula(
        result,
        biconditional(predicate("P", [a]), predicate("Q", [b])),
      ),
    ).toBe(true);
  });

  test("全称量化内の置換", () => {
    const f = universal(y, formulaSubstitution(predicate("P", [x, y]), a, x));
    const result = resolveFormulaSubstitution(f);
    expect(equalFormula(result, universal(y, predicate("P", [a, y])))).toBe(
      true,
    );
  });

  test("存在量化内の置換", () => {
    const f = existential(y, formulaSubstitution(predicate("P", [x, y]), a, x));
    const result = resolveFormulaSubstitution(f);
    expect(equalFormula(result, existential(y, predicate("P", [a, y])))).toBe(
      true,
    );
  });

  test("等号内はそのまま（FormulaSubstitutionを含まない）", () => {
    const f = equality(x, a);
    const result = resolveFormulaSubstitution(f);
    expect(equalFormula(result, f)).toBe(true);
  });

  test("メタ変数はそのまま", () => {
    const f = phi;
    const result = resolveFormulaSubstitution(f);
    expect(equalFormula(result, f)).toBe(true);
  });

  test("量化子の束縛変数と同じ場合: ∀x.P(x)[a/x] (全体が置換) → ∀x.P(a)", () => {
    // FormulaSubstitutionの内側の∀xは束縛するので、P(x)のxのうち∀xの下にあるものは置換されない
    // しかしこのテストでは FormulaSubstitution が外側にある
    // (∀x.P(x))[a/x] → substituteTermVariableInFormula(∀x.P(x), x, a) → ∀x.P(x) (束縛されているので変化なし)
    const f = formulaSubstitution(universal(x, predicate("P", [x])), a, x);
    const result = resolveFormulaSubstitution(f);
    expect(equalFormula(result, universal(x, predicate("P", [x])))).toBe(true);
  });

  test("変数捕獲回避(α変換): (∀y.P(x,y))[y/x] → ∀y'.P(y,y')", () => {
    // substituteTermVariableInFormulaがα変換を行う
    const f = formulaSubstitution(universal(y, predicate("P", [x, y])), y, x);
    const result = resolveFormulaSubstitution(f);
    const yPrime = termVariable("y'");
    expect(
      equalFormula(result, universal(yPrime, predicate("P", [y, yPrime]))),
    ).toBe(true);
  });

  test("関数項を代入: P(x)[f(a)/x] → P(f(a))", () => {
    const fa = functionApplication("f", [a]);
    const f = formulaSubstitution(predicate("P", [x]), fa, x);
    const result = resolveFormulaSubstitution(f);
    expect(equalFormula(result, predicate("P", [fa]))).toBe(true);
  });

  test("ネストされた FormulaSubstitution 内部の FormulaSubstitution も解決される", () => {
    // (P(x,y)[a/x])[b/y] → 内側を先に解決: P(a,y) → 次に[b/y]: P(a,b)
    const inner = formulaSubstitution(predicate("P", [x, y]), a, x);
    const f = formulaSubstitution(inner, b, y);
    const result = resolveFormulaSubstitution(f);
    expect(equalFormula(result, predicate("P", [a, b]))).toBe(true);
  });

  test("3段の連鎖: P(x,y,z)[a/x][b/y][constant/z]", () => {
    const c = constant("c");
    const step1 = formulaSubstitution(predicate("P", [x, y, z]), a, x);
    const step2 = formulaSubstitution(step1, b, y);
    const f = formulaSubstitution(step2, c, z);
    const result = resolveFormulaSubstitution(f);
    expect(equalFormula(result, predicate("P", [a, b, c]))).toBe(true);
  });

  test("メタ変数への置換は解決しない（メタ変数は自由変数ではない）", () => {
    // φ[a/x] → φのまま（φはメタ変数であり、xの自由出現はない）
    const f = formulaSubstitution(phi, a, x);
    const result = resolveFormulaSubstitution(f);
    expect(equalFormula(result, phi)).toBe(true);
  });

  test("FreeVariableAbsence: 内部のFormulaSubstitutionを解決しつつラッパーを保持", () => {
    // (P(x)[a/x])[/y] → P(a)[/y]
    const fva = freeVariableAbsence(
      formulaSubstitution(predicate("P", [x]), a, x),
      y,
    );
    const result = resolveFormulaSubstitution(fva);
    expect(result._tag).toBe("FreeVariableAbsence");
    if (result._tag === "FreeVariableAbsence") {
      expect(equalFormula(result.formula, predicate("P", [a]))).toBe(true);
      expect(result.variable.name).toBe("y");
    }
  });
});

describe("integration: combined meta + term substitution", () => {
  test("A4 schema → instance: meta subst then term subst", () => {
    // A4 schema: ∀x. φ → φ[t/x]
    // Step 1: meta subst {φ ↦ P(x) ∧ Q(x)} gives ∀x.(P(x)∧Q(x)) → (P(x)∧Q(x))[t/x]
    // Step 2: term subst [a/x] on the body
    const phi = metaVariable("φ");
    const x = termVariable("x");
    const a = constant("a");

    const body = conjunction(predicate("P", [x]), predicate("Q", [x]));

    // Step 1: φ → P(x)∧Q(x)
    const metaSubst = buildFormulaSubstitutionMap([[phi, body]]);
    const phiSubstituted = substituteFormulaMetaVariables(phi, metaSubst);

    // Step 2: [a/x]
    const result = substituteTermVariableInFormula(phiSubstituted, x, a);

    expect(
      equalFormula(
        result,
        conjunction(predicate("P", [a]), predicate("Q", [a])),
      ),
    ).toBe(true);
  });
});

// ── 10. normalizeFormula ────────────────────────────────────────

describe("normalizeFormula", () => {
  const x = termVariable("x");
  const y = termVariable("y");
  const z = termVariable("z");
  const a = constant("a");
  const b = constant("b");

  // --- FormulaSubstitution の解決 ---

  test("FormulaSubstitutionがない論理式はそのまま返る", () => {
    const f = implication(predicate("P", [x]), predicate("Q", [y]));
    const result = normalizeFormula(f);
    expect(equalFormula(result, f)).toBe(true);
  });

  test("基本的な置換: P(x)[a/x] → P(a)", () => {
    const f = formulaSubstitution(predicate("P", [x]), a, x);
    const result = normalizeFormula(f);
    expect(equalFormula(result, predicate("P", [a]))).toBe(true);
  });

  test("連鎖置換: P(x,y)[a/x][b/y] → P(a,b)", () => {
    const inner = formulaSubstitution(predicate("P", [x, y]), a, x);
    const f = formulaSubstitution(inner, b, y);
    const result = normalizeFormula(f);
    expect(equalFormula(result, predicate("P", [a, b]))).toBe(true);
  });

  // --- FreeVariableAbsence の簡約 ---

  test("FreeVariableAbsence: 変数が自由でない場合は除去 — P(y)[/x] → P(y)", () => {
    const f = freeVariableAbsence(predicate("P", [y]), x);
    const result = normalizeFormula(f);
    expect(equalFormula(result, predicate("P", [y]))).toBe(true);
  });

  test("FreeVariableAbsence: 変数が自由な場合は保持 — P(x)[/x]", () => {
    const f = freeVariableAbsence(predicate("P", [x]), x);
    const result = normalizeFormula(f);
    expect(result._tag).toBe("FreeVariableAbsence");
    expect(equalFormula(result, f)).toBe(true);
  });

  test("FreeVariableAbsence: 束縛変数と同じ場合は除去 — (∀x.P(x))[/x] → ∀x.P(x)", () => {
    const f = freeVariableAbsence(universal(x, predicate("P", [x])), x);
    const result = normalizeFormula(f);
    expect(equalFormula(result, universal(x, predicate("P", [x])))).toBe(true);
    expect(result._tag).toBe("Universal");
  });

  test("FreeVariableAbsence: 置換解決後に簡約 — P(x)[a/x][/x] → P(a)", () => {
    const inner = formulaSubstitution(predicate("P", [x]), a, x);
    const f = freeVariableAbsence(inner, x);
    const result = normalizeFormula(f);
    expect(equalFormula(result, predicate("P", [a]))).toBe(true);
  });

  test("FreeVariableAbsence: 複数変数で一方のみ自由 — P(x,y)[/x]", () => {
    const f = freeVariableAbsence(predicate("P", [x, y]), x);
    const result = normalizeFormula(f);
    expect(result._tag).toBe("FreeVariableAbsence");
  });

  // --- 複合ケース ---

  test("否定内のFreeVariableAbsence: ¬(P(y)[/x]) → ¬P(y)", () => {
    const f = negation(freeVariableAbsence(predicate("P", [y]), x));
    const result = normalizeFormula(f);
    expect(equalFormula(result, negation(predicate("P", [y])))).toBe(true);
  });

  test("含意内の正規化: P(y)[/x] → Q(x)[a/x] → P(y) → Q(a)", () => {
    const f = implication(
      freeVariableAbsence(predicate("P", [y]), x),
      formulaSubstitution(predicate("Q", [x]), a, x),
    );
    const result = normalizeFormula(f);
    expect(
      equalFormula(
        result,
        implication(predicate("P", [y]), predicate("Q", [a])),
      ),
    ).toBe(true);
  });

  test("連言内の正規化", () => {
    const f = conjunction(
      freeVariableAbsence(predicate("P", [y]), x),
      predicate("Q", [z]),
    );
    const result = normalizeFormula(f);
    expect(
      equalFormula(
        result,
        conjunction(predicate("P", [y]), predicate("Q", [z])),
      ),
    ).toBe(true);
  });

  test("選言内の正規化", () => {
    const f = disjunction(
      predicate("P", [y]),
      freeVariableAbsence(predicate("Q", [z]), x),
    );
    const result = normalizeFormula(f);
    expect(
      equalFormula(
        result,
        disjunction(predicate("P", [y]), predicate("Q", [z])),
      ),
    ).toBe(true);
  });

  test("双条件内の正規化", () => {
    const f = biconditional(
      freeVariableAbsence(predicate("P", [y]), x),
      freeVariableAbsence(predicate("Q", [z]), x),
    );
    const result = normalizeFormula(f);
    expect(
      equalFormula(
        result,
        biconditional(predicate("P", [y]), predicate("Q", [z])),
      ),
    ).toBe(true);
  });

  test("全称量化内の正規化", () => {
    const f = universal(y, freeVariableAbsence(predicate("P", [y]), x));
    const result = normalizeFormula(f);
    expect(equalFormula(result, universal(y, predicate("P", [y])))).toBe(true);
  });

  test("存在量化内の正規化", () => {
    const f = existential(y, freeVariableAbsence(predicate("P", [y]), x));
    const result = normalizeFormula(f);
    expect(equalFormula(result, existential(y, predicate("P", [y])))).toBe(
      true,
    );
  });

  test("等号はそのまま", () => {
    const f = equality(x, a);
    const result = normalizeFormula(f);
    expect(equalFormula(result, f)).toBe(true);
  });

  test("メタ変数はそのまま", () => {
    const phi = metaVariable("φ");
    const result = normalizeFormula(phi);
    expect(equalFormula(result, phi)).toBe(true);
  });

  test("述語(引数なし)はそのまま", () => {
    const f = predicate("P", []);
    const result = normalizeFormula(f);
    expect(equalFormula(result, f)).toBe(true);
  });

  test("α変換を伴う正規化: (∀y.P(x,y))[y/x] → ∀y'.P(y,y')", () => {
    const f = formulaSubstitution(universal(y, predicate("P", [x, y])), y, x);
    const result = normalizeFormula(f);
    const yPrime = termVariable("y'");
    expect(
      equalFormula(result, universal(yPrime, predicate("P", [y, yPrime]))),
    ).toBe(true);
  });

  // --- MetaVariable ベースの置換チェーン正規化 ---

  test("MetaVariable上の置換は保持される: φ[a/x] → φ[a/x]", () => {
    const phi = metaVariable("φ");
    const f = formulaSubstitution(phi, a, x);
    const result = normalizeFormula(f);
    expect(result._tag).toBe("FormulaSubstitution");
    expect(equalFormula(result, f)).toBe(true);
  });

  test("MetaVariable上の独立した置換の交換律: φ[a/x][b/y] ≡ φ[b/y][a/x]", () => {
    const phi = metaVariable("φ");
    const lhs = formulaSubstitution(formulaSubstitution(phi, a, x), b, y);
    const rhs = formulaSubstitution(formulaSubstitution(phi, b, y), a, x);
    // 正規化後が同じ形になることを確認
    const normalizedLhs = normalizeFormula(lhs);
    const normalizedRhs = normalizeFormula(rhs);
    expect(equalFormula(normalizedLhs, normalizedRhs)).toBe(true);
    // equivalentFormula でも等価
    expect(equivalentFormula(lhs, rhs)).toBe(true);
  });

  test("MetaVariable上の置換チェーンは変数名でソートされる", () => {
    const phi = metaVariable("φ");
    // φ[b/y][a/x] → φ[a/x][b/y] （x < y なのでソート）
    const f = formulaSubstitution(formulaSubstitution(phi, b, y), a, x);
    const result = normalizeFormula(f);
    // 外側は [b/y]、内側は φ[a/x] のはず
    expect(result._tag).toBe("FormulaSubstitution");
    if (result._tag === "FormulaSubstitution") {
      expect(result.variable.name).toBe("y");
      expect(result.formula._tag).toBe("FormulaSubstitution");
      if (result.formula._tag === "FormulaSubstitution") {
        expect(result.formula.variable.name).toBe("x");
        expect(result.formula.formula._tag).toBe("MetaVariable");
      }
    }
  });

  test("MetaVariable上のFreeVariableAbsenceは後続の同変数置換で除去: (φ[/y])[a/x][b/y] ≡ φ[a/x][b/y]", () => {
    const phi = metaVariable("φ");
    const lhs = formulaSubstitution(
      formulaSubstitution(freeVariableAbsence(phi, y), a, x),
      b,
      y,
    );
    const rhs = formulaSubstitution(formulaSubstitution(phi, a, x), b, y);
    expect(equivalentFormula(lhs, rhs)).toBe(true);
  });

  test("MetaVariable上のFreeVariableAbsenceは後続置換がなければ保持: φ[/x]", () => {
    const phi = metaVariable("φ");
    const f = freeVariableAbsence(phi, x);
    const result = normalizeFormula(f);
    expect(result._tag).toBe("FreeVariableAbsence");
  });

  test("MetaVariable上のFreeVariableAbsenceと置換の混合ソート", () => {
    const phi = metaVariable("φ");
    // φ[/z][a/x] → φ[a/x][/z] (ソート: x < z)
    const f = formulaSubstitution(freeVariableAbsence(phi, z), a, x);
    const result = normalizeFormula(f);
    expect(result._tag).toBe("FreeVariableAbsence");
    if (result._tag === "FreeVariableAbsence") {
      expect(result.variable.name).toBe("z");
      expect(result.formula._tag).toBe("FormulaSubstitution");
    }
  });

  test("MetaVariable上の同一変数複数置換マージ: φ[a/x][b/x] → φ[a[b/x]/x]", () => {
    const phi = metaVariable("φ");
    // a は定数なので a[b/x] = a（x は a に出現しない）
    const f = formulaSubstitution(formulaSubstitution(phi, a, x), b, x);
    const result = normalizeFormula(f);
    // a[b/x] = a なので結果は φ[a/x]
    expect(result._tag).toBe("FormulaSubstitution");
    if (result._tag === "FormulaSubstitution") {
      expect(result.variable.name).toBe("x");
      expect(equalTerm(result.term, a)).toBe(true);
    }
  });

  test("MetaVariable上の依存置換: φ[y/x][b/y] → 伝搬して φ[b/x][b/y]", () => {
    const phi = metaVariable("φ");
    // φ[y/x][b/y]: y/x の項 y に [b/y] を適用すると b になる
    const f = formulaSubstitution(formulaSubstitution(phi, y, x), b, y);
    const result = normalizeFormula(f);
    // 同時代入: x↦y[b/y]=b, y↦b → φ[b/x][b/y] (x < y でソート)
    expect(result._tag).toBe("FormulaSubstitution");
    if (result._tag === "FormulaSubstitution") {
      expect(result.variable.name).toBe("y");
      expect(equalTerm(result.term, b)).toBe(true);
      if (result.formula._tag === "FormulaSubstitution") {
        expect(result.formula.variable.name).toBe("x");
        expect(equalTerm(result.formula.term, b)).toBe(true);
      }
    }
  });

  test("FreeVariableAbsenceが置換より後にある場合は保持: φ[a/x][/x]", () => {
    const phi = metaVariable("φ");
    // φ[a/x][/x]: [a/x] の後に [/x] — [/x] は冗長ではない（先行する subst なので除去しない）
    const f = freeVariableAbsence(formulaSubstitution(phi, a, x), x);
    const result = normalizeFormula(f);
    // 正規化後も [a/x] と [/x] の両方が保持される
    expect(result._tag).toBe("FreeVariableAbsence");
    if (result._tag === "FreeVariableAbsence") {
      expect(result.variable.name).toBe("x");
      expect(result.formula._tag).toBe("FormulaSubstitution");
    }
  });

  test("同変数のsubstとabsenceがソートで隣接: φ[a/x][/x] ソート", () => {
    const phi = metaVariable("φ");
    // φ[a/x][/x] — 同変数の subst が先、absence が後
    const f = freeVariableAbsence(formulaSubstitution(phi, a, x), x);
    const result = normalizeFormula(f);
    // ソート順: subst(x) < absence(x)
    // 外側: absence(x), 内側: subst(x)
    expect(result._tag).toBe("FreeVariableAbsence");
    if (result._tag === "FreeVariableAbsence") {
      expect(result.variable.name).toBe("x");
    }
  });
});
