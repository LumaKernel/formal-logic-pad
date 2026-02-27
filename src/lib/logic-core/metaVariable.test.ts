import { describe, it, expect } from "vitest";
import {
  isFormulaMetaVariable,
  isTermMetaVariable,
  metaVariableKey,
  termMetaVariableKey,
  equalMetaVariable,
  equalTermMetaVariable,
  matchesMetaVariable,
  matchesTermMetaVariable,
  collectFormulaMetaVariables,
  collectTermMetaVariables,
  collectTermMetaVariablesInFormula,
  collectUniqueFormulaMetaVariables,
  collectUniqueTermMetaVariables,
  collectUniqueTermMetaVariablesInFormula,
} from "./metaVariable";
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
import {
  termVariable,
  termMetaVariable,
  constant,
  functionApplication,
  binaryOperation,
} from "./term";
import { greekLetters } from "./greekLetters";

describe("isFormulaMetaVariable", () => {
  it("returns true for MetaVariable", () => {
    expect(isFormulaMetaVariable(metaVariable("φ"))).toBe(true);
    expect(isFormulaMetaVariable(metaVariable("ψ", "1"))).toBe(true);
  });

  it("returns false for other formula types", () => {
    expect(isFormulaMetaVariable(negation(metaVariable("φ")))).toBe(false);
    expect(
      isFormulaMetaVariable(implication(metaVariable("φ"), metaVariable("ψ"))),
    ).toBe(false);
    expect(isFormulaMetaVariable(predicate("P", [termVariable("x")]))).toBe(
      false,
    );
  });
});

describe("isTermMetaVariable", () => {
  it("returns true for TermMetaVariable", () => {
    expect(isTermMetaVariable(termMetaVariable("τ"))).toBe(true);
    expect(isTermMetaVariable(termMetaVariable("σ", "01"))).toBe(true);
  });

  it("returns false for other term types", () => {
    expect(isTermMetaVariable(termVariable("x"))).toBe(false);
    expect(isTermMetaVariable(constant("0"))).toBe(false);
    expect(
      isTermMetaVariable(functionApplication("f", [termVariable("x")])),
    ).toBe(false);
  });
});

describe("metaVariableKey", () => {
  it("returns name for MetaVariable without subscript", () => {
    expect(metaVariableKey(metaVariable("φ"))).toBe("φ");
  });

  it("returns name_subscript for MetaVariable with subscript", () => {
    expect(metaVariableKey(metaVariable("φ", "1"))).toBe("φ_1");
    expect(metaVariableKey(metaVariable("φ", "01"))).toBe("φ_01");
    expect(metaVariableKey(metaVariable("φ", "001"))).toBe("φ_001");
  });

  it("produces different keys for different subscripts", () => {
    const key1 = metaVariableKey(metaVariable("φ", "1"));
    const key01 = metaVariableKey(metaVariable("φ", "01"));
    const key001 = metaVariableKey(metaVariable("φ", "001"));
    expect(key1).not.toBe(key01);
    expect(key01).not.toBe(key001);
    expect(key1).not.toBe(key001);
  });

  it("produces different keys for different names", () => {
    expect(metaVariableKey(metaVariable("φ"))).not.toBe(
      metaVariableKey(metaVariable("ψ")),
    );
  });
});

describe("termMetaVariableKey", () => {
  it("returns name for TermMetaVariable without subscript", () => {
    expect(termMetaVariableKey(termMetaVariable("τ"))).toBe("τ");
  });

  it("returns name_subscript for TermMetaVariable with subscript", () => {
    expect(termMetaVariableKey(termMetaVariable("τ", "42"))).toBe("τ_42");
  });
});

describe("equalMetaVariable", () => {
  it("returns true for identical MetaVariables", () => {
    expect(equalMetaVariable(metaVariable("φ"), metaVariable("φ"))).toBe(true);
    expect(
      equalMetaVariable(metaVariable("φ", "1"), metaVariable("φ", "1")),
    ).toBe(true);
  });

  it("returns false for different names", () => {
    expect(equalMetaVariable(metaVariable("φ"), metaVariable("ψ"))).toBe(false);
  });

  it("returns false for different subscripts", () => {
    expect(
      equalMetaVariable(metaVariable("φ", "1"), metaVariable("φ", "01")),
    ).toBe(false);
  });

  it("returns false for subscript vs no subscript", () => {
    expect(equalMetaVariable(metaVariable("φ"), metaVariable("φ", "1"))).toBe(
      false,
    );
  });

  it("works for all Greek letters", () => {
    for (const letter of greekLetters) {
      expect(
        equalMetaVariable(metaVariable(letter), metaVariable(letter)),
      ).toBe(true);
    }
  });
});

describe("equalTermMetaVariable", () => {
  it("returns true for identical TermMetaVariables", () => {
    expect(
      equalTermMetaVariable(termMetaVariable("τ"), termMetaVariable("τ")),
    ).toBe(true);
    expect(
      equalTermMetaVariable(
        termMetaVariable("τ", "1"),
        termMetaVariable("τ", "1"),
      ),
    ).toBe(true);
  });

  it("returns false for different names", () => {
    expect(
      equalTermMetaVariable(termMetaVariable("τ"), termMetaVariable("σ")),
    ).toBe(false);
  });

  it("returns false for different subscripts", () => {
    expect(
      equalTermMetaVariable(
        termMetaVariable("τ", "1"),
        termMetaVariable("τ", "2"),
      ),
    ).toBe(false);
  });
});

describe("matchesMetaVariable", () => {
  it("matches without subscript", () => {
    expect(matchesMetaVariable(metaVariable("φ"), "φ")).toBe(true);
  });

  it("matches with subscript", () => {
    expect(matchesMetaVariable(metaVariable("φ", "1"), "φ", "1")).toBe(true);
  });

  it("does not match different name", () => {
    expect(matchesMetaVariable(metaVariable("φ"), "ψ")).toBe(false);
  });

  it("does not match different subscript", () => {
    expect(matchesMetaVariable(metaVariable("φ", "1"), "φ", "2")).toBe(false);
  });

  it("does not match when subscript expected but not present", () => {
    expect(matchesMetaVariable(metaVariable("φ"), "φ", "1")).toBe(false);
  });

  it("does not match when no subscript expected but present", () => {
    expect(matchesMetaVariable(metaVariable("φ", "1"), "φ")).toBe(false);
  });
});

describe("matchesTermMetaVariable", () => {
  it("matches without subscript", () => {
    expect(matchesTermMetaVariable(termMetaVariable("τ"), "τ")).toBe(true);
  });

  it("matches with subscript", () => {
    expect(matchesTermMetaVariable(termMetaVariable("τ", "1"), "τ", "1")).toBe(
      true,
    );
  });

  it("does not match different name", () => {
    expect(matchesTermMetaVariable(termMetaVariable("τ"), "σ")).toBe(false);
  });
});

describe("collectFormulaMetaVariables", () => {
  it("collects single MetaVariable", () => {
    const result = collectFormulaMetaVariables(metaVariable("φ"));
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("φ");
  });

  it("collects from Negation", () => {
    const result = collectFormulaMetaVariables(negation(metaVariable("φ")));
    expect(result).toHaveLength(1);
  });

  it("collects from Implication", () => {
    const result = collectFormulaMetaVariables(
      implication(metaVariable("φ"), metaVariable("ψ")),
    );
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("φ");
    expect(result[1].name).toBe("ψ");
  });

  it("collects from Conjunction", () => {
    const result = collectFormulaMetaVariables(
      conjunction(metaVariable("φ"), metaVariable("φ")),
    );
    expect(result).toHaveLength(2);
  });

  it("collects from Disjunction", () => {
    const result = collectFormulaMetaVariables(
      disjunction(metaVariable("φ"), metaVariable("ψ")),
    );
    expect(result).toHaveLength(2);
  });

  it("collects from Biconditional", () => {
    const result = collectFormulaMetaVariables(
      biconditional(metaVariable("φ"), metaVariable("ψ")),
    );
    expect(result).toHaveLength(2);
  });

  it("collects from Universal", () => {
    const result = collectFormulaMetaVariables(
      universal(termVariable("x"), metaVariable("φ")),
    );
    expect(result).toHaveLength(1);
  });

  it("collects from Existential", () => {
    const result = collectFormulaMetaVariables(
      existential(termVariable("x"), metaVariable("φ")),
    );
    expect(result).toHaveLength(1);
  });

  it("returns empty for Predicate (no FormulaMetaVariables in terms)", () => {
    const result = collectFormulaMetaVariables(
      predicate("P", [termVariable("x"), termMetaVariable("τ")]),
    );
    expect(result).toHaveLength(0);
  });

  it("returns empty for Equality (no FormulaMetaVariables in terms)", () => {
    const result = collectFormulaMetaVariables(
      equality(termVariable("x"), termVariable("y")),
    );
    expect(result).toHaveLength(0);
  });

  it("collects duplicates from K axiom: φ→(ψ→φ)", () => {
    const k = implication(
      metaVariable("φ"),
      implication(metaVariable("ψ"), metaVariable("φ")),
    );
    const result = collectFormulaMetaVariables(k);
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("φ");
    expect(result[1].name).toBe("ψ");
    expect(result[2].name).toBe("φ");
  });

  it("handles deeply nested formulas", () => {
    // ¬(φ ∧ ψ) ↔ (¬φ ∨ ¬ψ)
    const deMorgan = biconditional(
      negation(conjunction(metaVariable("φ"), metaVariable("ψ"))),
      disjunction(negation(metaVariable("φ")), negation(metaVariable("ψ"))),
    );
    const result = collectFormulaMetaVariables(deMorgan);
    expect(result).toHaveLength(4);
  });
});

describe("collectTermMetaVariables", () => {
  it("returns empty for TermVariable", () => {
    expect(collectTermMetaVariables(termVariable("x"))).toHaveLength(0);
  });

  it("returns empty for Constant", () => {
    expect(collectTermMetaVariables(constant("0"))).toHaveLength(0);
  });

  it("collects single TermMetaVariable", () => {
    const result = collectTermMetaVariables(termMetaVariable("τ"));
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("τ");
  });

  it("collects from FunctionApplication", () => {
    const result = collectTermMetaVariables(
      functionApplication("f", [termMetaVariable("τ"), termVariable("x")]),
    );
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("τ");
  });

  it("collects from BinaryOperation", () => {
    const result = collectTermMetaVariables(
      binaryOperation("+", termMetaVariable("τ"), termMetaVariable("σ")),
    );
    expect(result).toHaveLength(2);
  });

  it("collects from nested terms", () => {
    const nested = functionApplication("f", [
      binaryOperation("+", termMetaVariable("τ"), termMetaVariable("σ")),
      termMetaVariable("τ"),
    ]);
    const result = collectTermMetaVariables(nested);
    expect(result).toHaveLength(3);
  });
});

describe("collectTermMetaVariablesInFormula", () => {
  it("returns empty for MetaVariable", () => {
    expect(collectTermMetaVariablesInFormula(metaVariable("φ"))).toHaveLength(
      0,
    );
  });

  it("returns empty for Negation of MetaVariable", () => {
    expect(
      collectTermMetaVariablesInFormula(negation(metaVariable("φ"))),
    ).toHaveLength(0);
  });

  it("collects from Predicate args", () => {
    const result = collectTermMetaVariablesInFormula(
      predicate("P", [termMetaVariable("τ"), termVariable("x")]),
    );
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("τ");
  });

  it("collects from Equality terms", () => {
    const result = collectTermMetaVariablesInFormula(
      equality(termMetaVariable("τ"), termMetaVariable("σ")),
    );
    expect(result).toHaveLength(2);
  });

  it("collects from Implication with Predicates", () => {
    const result = collectTermMetaVariablesInFormula(
      implication(
        predicate("P", [termMetaVariable("τ")]),
        predicate("Q", [termMetaVariable("σ")]),
      ),
    );
    expect(result).toHaveLength(2);
  });

  it("collects from Conjunction", () => {
    const result = collectTermMetaVariablesInFormula(
      conjunction(predicate("P", [termMetaVariable("τ")]), metaVariable("φ")),
    );
    expect(result).toHaveLength(1);
  });

  it("collects from Disjunction", () => {
    const result = collectTermMetaVariablesInFormula(
      disjunction(predicate("P", [termMetaVariable("τ")]), metaVariable("φ")),
    );
    expect(result).toHaveLength(1);
  });

  it("collects from Biconditional", () => {
    const result = collectTermMetaVariablesInFormula(
      biconditional(
        predicate("P", [termMetaVariable("τ")]),
        predicate("Q", [termMetaVariable("σ")]),
      ),
    );
    expect(result).toHaveLength(2);
  });

  it("collects from Universal", () => {
    const result = collectTermMetaVariablesInFormula(
      universal(termVariable("x"), predicate("P", [termMetaVariable("τ")])),
    );
    expect(result).toHaveLength(1);
  });

  it("collects from Existential", () => {
    const result = collectTermMetaVariablesInFormula(
      existential(termVariable("x"), predicate("P", [termMetaVariable("τ")])),
    );
    expect(result).toHaveLength(1);
  });
});

describe("collectUniqueFormulaMetaVariables", () => {
  it("deduplicates MetaVariables from K axiom: φ→(ψ→φ)", () => {
    const k = implication(
      metaVariable("φ"),
      implication(metaVariable("ψ"), metaVariable("φ")),
    );
    const result = collectUniqueFormulaMetaVariables(k);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("φ");
    expect(result[1].name).toBe("ψ");
  });

  it("treats φ and φ1 as different", () => {
    const f = implication(metaVariable("φ"), metaVariable("φ", "1"));
    const result = collectUniqueFormulaMetaVariables(f);
    expect(result).toHaveLength(2);
  });

  it("returns single for identical MetaVariable", () => {
    const f = conjunction(metaVariable("φ"), metaVariable("φ"));
    const result = collectUniqueFormulaMetaVariables(f);
    expect(result).toHaveLength(1);
  });
});

describe("collectUniqueTermMetaVariables", () => {
  it("deduplicates TermMetaVariables", () => {
    const t = binaryOperation(
      "+",
      termMetaVariable("τ"),
      termMetaVariable("τ"),
    );
    const result = collectUniqueTermMetaVariables(t);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("τ");
  });

  it("treats τ and τ1 as different", () => {
    const t = binaryOperation(
      "+",
      termMetaVariable("τ"),
      termMetaVariable("τ", "1"),
    );
    const result = collectUniqueTermMetaVariables(t);
    expect(result).toHaveLength(2);
  });

  it("collects from nested function", () => {
    const t = functionApplication("f", [
      termMetaVariable("τ"),
      functionApplication("g", [termMetaVariable("σ"), termMetaVariable("τ")]),
    ]);
    const result = collectUniqueTermMetaVariables(t);
    expect(result).toHaveLength(2);
  });
});

describe("collectUniqueTermMetaVariablesInFormula", () => {
  it("returns empty for formula with no term meta-variables", () => {
    const result = collectUniqueTermMetaVariablesInFormula(
      implication(metaVariable("φ"), metaVariable("ψ")),
    );
    expect(result).toHaveLength(0);
  });

  it("collects unique term meta-variables from predicates", () => {
    const f = implication(
      predicate("P", [termMetaVariable("τ")]),
      predicate("Q", [termMetaVariable("σ")]),
    );
    const result = collectUniqueTermMetaVariablesInFormula(f);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("τ");
    expect(result[1].name).toBe("σ");
  });

  it("deduplicates term meta-variables across formula", () => {
    const f = conjunction(
      predicate("P", [termMetaVariable("τ")]),
      predicate("Q", [termMetaVariable("τ"), termMetaVariable("σ")]),
    );
    const result = collectUniqueTermMetaVariablesInFormula(f);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("τ");
    expect(result[1].name).toBe("σ");
  });

  it("collects from equality terms", () => {
    const f = equality(termMetaVariable("τ"), termMetaVariable("τ"));
    const result = collectUniqueTermMetaVariablesInFormula(f);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("τ");
  });

  it("treats τ and τ₁ as different", () => {
    const f = predicate("P", [
      termMetaVariable("τ"),
      termMetaVariable("τ", "1"),
    ]);
    const result = collectUniqueTermMetaVariablesInFormula(f);
    expect(result).toHaveLength(2);
  });
});

describe("MetaVariable with all Greek letters", () => {
  it("creates MetaVariable for all 23 Greek letters", () => {
    for (const letter of greekLetters) {
      const mv = metaVariable(letter);
      expect(isFormulaMetaVariable(mv)).toBe(true);
      expect(mv.name).toBe(letter);
    }
  });

  it("creates MetaVariable with subscripts for all Greek letters", () => {
    for (const letter of greekLetters) {
      const mv1 = metaVariable(letter, "0");
      const mv2 = metaVariable(letter, "42");
      const mv3 = metaVariable(letter, "999");
      expect(mv1.subscript).toBe("0");
      expect(mv2.subscript).toBe("42");
      expect(mv3.subscript).toBe("999");
    }
  });

  it("creates TermMetaVariable for all 23 Greek letters", () => {
    for (const letter of greekLetters) {
      const tmv = termMetaVariable(letter);
      expect(isTermMetaVariable(tmv)).toBe(true);
      expect(tmv.name).toBe(letter);
    }
  });
});
