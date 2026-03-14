import { describe, expect, test } from "vitest";
import {
  freeVariablesInTerm,
  freeVariablesInFormula,
  isFreeInFormula,
  allVariableNamesInFormula,
  allVariableNamesInTerm,
} from "./freeVariables";
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

describe("freeVariablesInTerm", () => {
  test("TermVariable", () => {
    expect(freeVariablesInTerm(termVariable("x"))).toEqual(new Set(["x"]));
  });

  test("TermMetaVariable has no free variables", () => {
    expect(freeVariablesInTerm(termMetaVariable("τ"))).toEqual(new Set());
  });

  test("Constant has no free variables", () => {
    expect(freeVariablesInTerm(constant("0"))).toEqual(new Set());
  });

  test("FunctionApplication", () => {
    const t = functionApplication("f", [
      termVariable("x"),
      termVariable("y"),
      constant("0"),
    ]);
    expect(freeVariablesInTerm(t)).toEqual(new Set(["x", "y"]));
  });

  test("BinaryOperation", () => {
    const t = binaryOperation("+", termVariable("x"), termVariable("y"));
    expect(freeVariablesInTerm(t)).toEqual(new Set(["x", "y"]));
  });

  test("nested FunctionApplication", () => {
    const t = functionApplication("g", [
      functionApplication("f", [termVariable("x")]),
      termVariable("z"),
    ]);
    expect(freeVariablesInTerm(t)).toEqual(new Set(["x", "z"]));
  });

  test("empty FunctionApplication", () => {
    const t = functionApplication("f", []);
    expect(freeVariablesInTerm(t)).toEqual(new Set());
  });
});

describe("freeVariablesInFormula", () => {
  test("MetaVariable has no free term variables", () => {
    expect(freeVariablesInFormula(metaVariable("φ"))).toEqual(new Set());
  });

  test("Predicate with variables", () => {
    const f = predicate("P", [termVariable("x"), termVariable("y")]);
    expect(freeVariablesInFormula(f)).toEqual(new Set(["x", "y"]));
  });

  test("Equality with variables", () => {
    const f = equality(termVariable("x"), termVariable("y"));
    expect(freeVariablesInFormula(f)).toEqual(new Set(["x", "y"]));
  });

  test("Negation passes through", () => {
    const f = negation(predicate("P", [termVariable("x")]));
    expect(freeVariablesInFormula(f)).toEqual(new Set(["x"]));
  });

  test("Implication combines both sides", () => {
    const f = implication(
      predicate("P", [termVariable("x")]),
      predicate("Q", [termVariable("y")]),
    );
    expect(freeVariablesInFormula(f)).toEqual(new Set(["x", "y"]));
  });

  test("Conjunction combines both sides", () => {
    const f = conjunction(
      predicate("P", [termVariable("x")]),
      predicate("Q", [termVariable("y")]),
    );
    expect(freeVariablesInFormula(f)).toEqual(new Set(["x", "y"]));
  });

  test("Disjunction combines both sides", () => {
    const f = disjunction(
      predicate("P", [termVariable("x")]),
      predicate("Q", [termVariable("y")]),
    );
    expect(freeVariablesInFormula(f)).toEqual(new Set(["x", "y"]));
  });

  test("Biconditional combines both sides", () => {
    const f = biconditional(
      predicate("P", [termVariable("x")]),
      predicate("Q", [termVariable("y")]),
    );
    expect(freeVariablesInFormula(f)).toEqual(new Set(["x", "y"]));
  });

  test("Universal removes bound variable", () => {
    // ∀x. P(x, y) → FV = {y}
    const f = universal(
      termVariable("x"),
      predicate("P", [termVariable("x"), termVariable("y")]),
    );
    expect(freeVariablesInFormula(f)).toEqual(new Set(["y"]));
  });

  test("Existential removes bound variable", () => {
    // ∃x. P(x, y) → FV = {y}
    const f = existential(
      termVariable("x"),
      predicate("P", [termVariable("x"), termVariable("y")]),
    );
    expect(freeVariablesInFormula(f)).toEqual(new Set(["y"]));
  });

  test("nested quantifiers", () => {
    // ∀x. ∃y. P(x, y, z) → FV = {z}
    const f = universal(
      termVariable("x"),
      existential(
        termVariable("y"),
        predicate("P", [
          termVariable("x"),
          termVariable("y"),
          termVariable("z"),
        ]),
      ),
    );
    expect(freeVariablesInFormula(f)).toEqual(new Set(["z"]));
  });

  test("variable bound in inner scope free in outer", () => {
    // (∀x. P(x)) → Q(x) → FV = {x}
    const f = implication(
      universal(termVariable("x"), predicate("P", [termVariable("x")])),
      predicate("Q", [termVariable("x")]),
    );
    expect(freeVariablesInFormula(f)).toEqual(new Set(["x"]));
  });

  test("all variables bound", () => {
    // ∀x. ∀y. P(x, y) → FV = {}
    const f = universal(
      termVariable("x"),
      universal(
        termVariable("y"),
        predicate("P", [termVariable("x"), termVariable("y")]),
      ),
    );
    expect(freeVariablesInFormula(f)).toEqual(new Set());
  });

  test("FormulaSubstitution: x free in φ includes τ's free vars", () => {
    // P(x, y)[f(z)/x] → FV = (FV(P(x,y)) \ {x}) ∪ FV(f(z)) = {y} ∪ {z} = {y, z}
    const phi = predicate("P", [termVariable("x"), termVariable("y")]);
    const tau = functionApplication("f", [termVariable("z")]);
    const f = formulaSubstitution(phi, tau, termVariable("x"));
    expect(freeVariablesInFormula(f)).toEqual(new Set(["y", "z"]));
  });

  test("FormulaSubstitution: x NOT free in φ excludes τ's free vars", () => {
    // P(y)[f(z)/x] → FV = FV(P(y)) \ {x} = {y} (x not free, so τ vars not added)
    const phi = predicate("P", [termVariable("y")]);
    const tau = functionApplication("f", [termVariable("z")]);
    const f = formulaSubstitution(phi, tau, termVariable("x"));
    expect(freeVariablesInFormula(f)).toEqual(new Set(["y"]));
  });

  test("FormulaSubstitution: x free, τ is constant → removes x", () => {
    // P(x)[0/x] → FV = {}, since x is removed and constant has no free vars
    const phi = predicate("P", [termVariable("x")]);
    const tau = constant("0");
    const f = formulaSubstitution(phi, tau, termVariable("x"));
    expect(freeVariablesInFormula(f)).toEqual(new Set());
  });

  test("FormulaSubstitution: nested formula with bound x", () => {
    // (∀x. P(x))[y/x] → FV = {} (x is bound in ∀x.P(x), so x is not free)
    const phi = universal(
      termVariable("x"),
      predicate("P", [termVariable("x")]),
    );
    const f = formulaSubstitution(phi, termVariable("y"), termVariable("x"));
    expect(freeVariablesInFormula(f)).toEqual(new Set());
  });

  test("FreeVariableAbsence: removes x from free variables", () => {
    // P(x, y)[/x] → FV = FV(P(x,y)) \ {x} = {y}
    const phi = predicate("P", [termVariable("x"), termVariable("y")]);
    const f = freeVariableAbsence(phi, termVariable("x"));
    expect(freeVariablesInFormula(f)).toEqual(new Set(["y"]));
  });

  test("FreeVariableAbsence: removing non-free variable is no-op", () => {
    // P(y)[/x] → FV = {y} (x is already not free)
    const phi = predicate("P", [termVariable("y")]);
    const f = freeVariableAbsence(phi, termVariable("x"));
    expect(freeVariablesInFormula(f)).toEqual(new Set(["y"]));
  });

  test("FreeVariableAbsence: chained removal", () => {
    // P(x, y)[/x][/y] → FV = {}
    const phi = predicate("P", [termVariable("x"), termVariable("y")]);
    const f = freeVariableAbsence(
      freeVariableAbsence(phi, termVariable("x")),
      termVariable("y"),
    );
    expect(freeVariablesInFormula(f)).toEqual(new Set());
  });
});

describe("isFreeInFormula", () => {
  test("free variable returns true", () => {
    const f = predicate("P", [termVariable("x")]);
    expect(isFreeInFormula(termVariable("x"), f)).toBe(true);
  });

  test("non-occurring variable returns false", () => {
    const f = predicate("P", [termVariable("x")]);
    expect(isFreeInFormula(termVariable("y"), f)).toBe(false);
  });

  test("bound variable returns false", () => {
    const f = universal(termVariable("x"), predicate("P", [termVariable("x")]));
    expect(isFreeInFormula(termVariable("x"), f)).toBe(false);
  });
});

describe("allVariableNamesInTerm", () => {
  test("single variable", () => {
    expect(allVariableNamesInTerm(termVariable("x"))).toEqual(new Set(["x"]));
  });

  test("constant has no variables", () => {
    expect(allVariableNamesInTerm(constant("0"))).toEqual(new Set());
  });

  test("nested terms", () => {
    const t = binaryOperation("+", termVariable("x"), termVariable("y"));
    expect(allVariableNamesInTerm(t)).toEqual(new Set(["x", "y"]));
  });

  test("TermMetaVariable has no variable names", () => {
    expect(allVariableNamesInTerm(termMetaVariable("τ"))).toEqual(new Set());
  });
});

describe("allVariableNamesInFormula", () => {
  test("includes bound and free variables", () => {
    // ∀x. P(x, y) → allVars = {x, y}
    const f = universal(
      termVariable("x"),
      predicate("P", [termVariable("x"), termVariable("y")]),
    );
    expect(allVariableNamesInFormula(f)).toEqual(new Set(["x", "y"]));
  });

  test("MetaVariable has no variables", () => {
    expect(allVariableNamesInFormula(metaVariable("φ"))).toEqual(new Set());
  });

  test("Negation passes through", () => {
    expect(
      allVariableNamesInFormula(negation(predicate("P", [termVariable("x")]))),
    ).toEqual(new Set(["x"]));
  });

  test("Equality", () => {
    expect(
      allVariableNamesInFormula(equality(termVariable("x"), termVariable("y"))),
    ).toEqual(new Set(["x", "y"]));
  });

  test("Implication collects variables from both sides", () => {
    const f = implication(
      predicate("P", [termVariable("x")]),
      predicate("Q", [termVariable("y")]),
    );
    expect(allVariableNamesInFormula(f)).toEqual(new Set(["x", "y"]));
  });

  test("Conjunction collects variables from both sides", () => {
    const f = conjunction(
      predicate("P", [termVariable("a")]),
      predicate("Q", [termVariable("b")]),
    );
    expect(allVariableNamesInFormula(f)).toEqual(new Set(["a", "b"]));
  });

  test("Disjunction collects variables from both sides", () => {
    const f = disjunction(
      predicate("P", [termVariable("x")]),
      predicate("Q", [termVariable("y")]),
    );
    expect(allVariableNamesInFormula(f)).toEqual(new Set(["x", "y"]));
  });

  test("Biconditional collects variables from both sides", () => {
    const f = biconditional(
      predicate("P", [termVariable("x")]),
      predicate("Q", [termVariable("y")]),
    );
    expect(allVariableNamesInFormula(f)).toEqual(new Set(["x", "y"]));
  });

  test("Existential collects bound variable as well", () => {
    const f = existential(
      termVariable("x"),
      predicate("P", [termVariable("x"), termVariable("y")]),
    );
    expect(allVariableNamesInFormula(f)).toEqual(new Set(["x", "y"]));
  });

  test("Predicate with function application", () => {
    const f = predicate("P", [functionApplication("f", [termVariable("x")])]);
    expect(allVariableNamesInFormula(f)).toEqual(new Set(["x"]));
  });

  test("FormulaSubstitution collects from formula, term, and variable", () => {
    // P(y)[f(z)/x] → allVars = {y} ∪ {z} ∪ {x} = {x, y, z}
    const phi = predicate("P", [termVariable("y")]);
    const tau = functionApplication("f", [termVariable("z")]);
    const f = formulaSubstitution(phi, tau, termVariable("x"));
    expect(allVariableNamesInFormula(f)).toEqual(new Set(["x", "y", "z"]));
  });

  test("FormulaSubstitution with overlapping variables", () => {
    // P(x)[x/x] → allVars = {x} (all three contribute the same variable)
    const phi = predicate("P", [termVariable("x")]);
    const f = formulaSubstitution(phi, termVariable("x"), termVariable("x"));
    expect(allVariableNamesInFormula(f)).toEqual(new Set(["x"]));
  });

  test("FormulaSubstitution with constant term", () => {
    // P(x, y)[0/x] → allVars = {x, y} (variable from binding, formula vars)
    const phi = predicate("P", [termVariable("x"), termVariable("y")]);
    const f = formulaSubstitution(phi, constant("0"), termVariable("x"));
    expect(allVariableNamesInFormula(f)).toEqual(new Set(["x", "y"]));
  });

  test("FreeVariableAbsence collects from formula and variable", () => {
    // P(y)[/x] → allVars = {y} ∪ {x} = {x, y}
    const phi = predicate("P", [termVariable("y")]);
    const f = freeVariableAbsence(phi, termVariable("x"));
    expect(allVariableNamesInFormula(f)).toEqual(new Set(["x", "y"]));
  });
});
