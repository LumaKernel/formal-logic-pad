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
});
