import { Either } from "effect";
import { describe, expect, it } from "vitest";
import { parseString, parseTermString } from "./parser";
import type { Formula } from "../logic-core/formula";
import { equalFormula } from "../logic-core/equality";
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
} from "../logic-core/formula";
import {
  termVariable,
  termMetaVariable,
  constant,
  functionApplication,
  binaryOperation,
} from "../logic-core/term";

import type { Term } from "../logic-core/term";
import { equalTerm } from "../logic-core/equality";

// ヘルパー: 成功パース結果を取得
const parseOk = (input: string): Formula => {
  const result = parseString(input);
  if (Either.isLeft(result)) {
    throw new Error(
      `Parse failed: ${result.left.map((e) => e.message).join("; ") satisfies string}`,
    );
  }
  return result.right;
};

// ヘルパー: 項の成功パース結果を取得
const parseTermOk = (input: string): Term => {
  const result = parseTermString(input);
  if (Either.isLeft(result)) {
    throw new Error(
      `Parse failed: ${result.left.map((e) => e.message).join("; ") satisfies string}`,
    );
  }
  return result.right;
};

// ヘルパー: エラーパース結果を取得
const parseErr = (input: string) => {
  const result = parseString(input);
  expect(Either.isLeft(result)).toBe(true);
  if (Either.isRight(result)) throw new Error("Expected error");
  return result.left;
};

// ヘルパー: AST比較
const assertFormula = (input: string, expected: Formula) => {
  const actual = parseOk(input);
  expect(equalFormula(actual, expected)).toBe(true);
};

describe("Parser", () => {
  // --- DSL仕様の例題 ---

  describe("spec examples", () => {
    it("example 1: φ → φ", () => {
      const φ = metaVariable("φ");
      assertFormula("φ → φ", implication(φ, φ));
    });

    it("example 1 (ASCII): phi -> phi", () => {
      const φ = metaVariable("φ");
      assertFormula("phi -> phi", implication(φ, φ));
    });

    it("example 2: ∀ζ. P(ζ) ∧ ∃ξ. Q(ξ)", () => {
      // 量化子のスコープはドットの右側全体
      // ∀ζ. (P(ζ) ∧ (∃ξ. Q(ξ)))
      const ζ = termVariable("ζ");
      const ξ = termVariable("ξ");
      assertFormula(
        "∀ζ. P(ζ) ∧ ∃ξ. Q(ξ)",
        universal(
          ζ,
          conjunction(predicate("P", [ζ]), existential(ξ, predicate("Q", [ξ]))),
        ),
      );
    });

    it("example 3: f(x) + g(y) = h(z)", () => {
      assertFormula(
        "f(x) + g(y) = h(z)",
        equality(
          binaryOperation(
            "+",
            functionApplication("f", [termVariable("x")]),
            functionApplication("g", [termVariable("y")]),
          ),
          functionApplication("h", [termVariable("z")]),
        ),
      );
    });

    it("example 4: ∀x. x + 0 = x", () => {
      const x = termVariable("x");
      assertFormula(
        "∀x. x + 0 = x",
        universal(x, equality(binaryOperation("+", x, constant("0")), x)),
      );
    });

    it("example 5: phi1 -> phi_1 (same meta variable)", () => {
      const φ1 = metaVariable("φ", "1");
      assertFormula("phi1 -> phi_1", implication(φ1, φ1));
    });

    it("example 6: phi1 -> phi01 (different meta variables)", () => {
      const φ1 = metaVariable("φ", "1");
      const φ01 = metaVariable("φ", "01");
      assertFormula("phi1 -> phi01", implication(φ1, φ01));
    });

    it("example 7: ¬P(x) ∨ Q(x, y)", () => {
      assertFormula(
        "¬P(x) ∨ Q(x, y)",
        disjunction(
          negation(predicate("P", [termVariable("x")])),
          predicate("Q", [termVariable("x"), termVariable("y")]),
        ),
      );
    });

    it("example 8: (φ → ψ) → (φ → χ) → (φ → (ψ → χ))", () => {
      // → は右結合
      const φ = metaVariable("φ");
      const ψ = metaVariable("ψ");
      const χ = metaVariable("χ");
      assertFormula(
        "(φ → ψ) → (φ → χ) → (φ → (ψ → χ))",
        implication(
          implication(φ, ψ),
          implication(implication(φ, χ), implication(φ, implication(ψ, χ))),
        ),
      );
    });

    it("example 9: x ^ y ^ z (right associative)", () => {
      // ^ は右結合 → x ^ (y ^ z)
      const x = termVariable("x");
      const y = termVariable("y");
      const z = termVariable("z");
      assertFormula(
        "x ^ y ^ z = x",
        equality(binaryOperation("^", x, binaryOperation("^", y, z)), x),
      );
    });

    it("example 10: ∀x. ∃y. x + y = 0", () => {
      const x = termVariable("x");
      const y = termVariable("y");
      assertFormula(
        "∀x. ∃y. x + y = 0",
        universal(
          x,
          existential(y, equality(binaryOperation("+", x, y), constant("0"))),
        ),
      );
    });

    it("example 11: P(f(x, g(y)), z)", () => {
      assertFormula(
        "P(f(x, g(y)), z)",
        predicate("P", [
          functionApplication("f", [
            termVariable("x"),
            functionApplication("g", [termVariable("y")]),
          ]),
          termVariable("z"),
        ]),
      );
    });

    it("example 12: φ ↔ ψ ↔ χ (right associative)", () => {
      const φ = metaVariable("φ");
      const ψ = metaVariable("ψ");
      const χ = metaVariable("χ");
      assertFormula("φ ↔ ψ ↔ χ", biconditional(φ, biconditional(ψ, χ)));
    });
  });

  // --- 演算子の優先順位と結合性 ---

  describe("operator precedence and associativity", () => {
    it("¬ binds tighter than ∧", () => {
      // ¬φ ∧ ψ = (¬φ) ∧ ψ
      const φ = metaVariable("φ");
      const ψ = metaVariable("ψ");
      assertFormula("¬φ ∧ ψ", conjunction(negation(φ), ψ));
    });

    it("∧ binds tighter than ∨", () => {
      // φ ∨ ψ ∧ χ = φ ∨ (ψ ∧ χ)
      const φ = metaVariable("φ");
      const ψ = metaVariable("ψ");
      const χ = metaVariable("χ");
      assertFormula("φ ∨ ψ ∧ χ", disjunction(φ, conjunction(ψ, χ)));
    });

    it("∨ binds tighter than →", () => {
      // φ → ψ ∨ χ = φ → (ψ ∨ χ)
      const φ = metaVariable("φ");
      const ψ = metaVariable("ψ");
      const χ = metaVariable("χ");
      assertFormula("φ → ψ ∨ χ", implication(φ, disjunction(ψ, χ)));
    });

    it("→ binds tighter than ↔", () => {
      // φ ↔ ψ → χ = φ ↔ (ψ → χ)
      const φ = metaVariable("φ");
      const ψ = metaVariable("ψ");
      const χ = metaVariable("χ");
      assertFormula("φ ↔ ψ → χ", biconditional(φ, implication(ψ, χ)));
    });

    it("→ is right associative", () => {
      // φ → ψ → χ = φ → (ψ → χ)
      const φ = metaVariable("φ");
      const ψ = metaVariable("ψ");
      const χ = metaVariable("χ");
      assertFormula("φ → ψ → χ", implication(φ, implication(ψ, χ)));
    });

    it("∧ is left associative", () => {
      // φ ∧ ψ ∧ χ = (φ ∧ ψ) ∧ χ
      const φ = metaVariable("φ");
      const ψ = metaVariable("ψ");
      const χ = metaVariable("χ");
      assertFormula("φ ∧ ψ ∧ χ", conjunction(conjunction(φ, ψ), χ));
    });

    it("∨ is left associative", () => {
      const φ = metaVariable("φ");
      const ψ = metaVariable("ψ");
      const χ = metaVariable("χ");
      assertFormula("φ ∨ ψ ∨ χ", disjunction(disjunction(φ, ψ), χ));
    });

    it("↔ is right associative", () => {
      const φ = metaVariable("φ");
      const ψ = metaVariable("ψ");
      const χ = metaVariable("χ");
      assertFormula("φ ↔ ψ ↔ χ", biconditional(φ, biconditional(ψ, χ)));
    });

    it("term: + is left associative", () => {
      const x = termVariable("x");
      const y = termVariable("y");
      const z = termVariable("z");
      assertFormula(
        "x + y + z = x",
        equality(binaryOperation("+", binaryOperation("+", x, y), z), x),
      );
    });

    it("term: * binds tighter than +", () => {
      const x = termVariable("x");
      const y = termVariable("y");
      const z = termVariable("z");
      assertFormula(
        "x + y * z = x",
        equality(binaryOperation("+", x, binaryOperation("*", y, z)), x),
      );
    });

    it("term: ^ binds tighter than *", () => {
      const x = termVariable("x");
      const y = termVariable("y");
      const z = termVariable("z");
      assertFormula(
        "x * y ^ z = x",
        equality(binaryOperation("*", x, binaryOperation("^", y, z)), x),
      );
    });
  });

  // --- 量化子 ---

  describe("quantifiers", () => {
    it("∀x. φ → ψ parses as ∀x.(φ → ψ)", () => {
      const φ = metaVariable("φ");
      const ψ = metaVariable("ψ");
      assertFormula(
        "∀x. φ → ψ",
        universal(termVariable("x"), implication(φ, ψ)),
      );
    });

    it("nested quantifiers", () => {
      const x = termVariable("x");
      const y = termVariable("y");
      assertFormula(
        "∀x. ∃y. P(x, y)",
        universal(x, existential(y, predicate("P", [x, y]))),
      );
    });

    it("quantifier with ASCII keywords", () => {
      assertFormula(
        "all x. P(x)",
        universal(termVariable("x"), predicate("P", [termVariable("x")])),
      );
    });

    it("exists keyword", () => {
      assertFormula(
        "exists x. P(x)",
        existential(termVariable("x"), predicate("P", [termVariable("x")])),
      );
    });

    it("ex keyword", () => {
      assertFormula(
        "ex x. P(x)",
        existential(termVariable("x"), predicate("P", [termVariable("x")])),
      );
    });

    it("bound Greek letter in equality", () => {
      // ∀ζ. ζ = x → ζ は項位置でTermVariable
      const ζ = termVariable("ζ");
      assertFormula("∀ζ. ζ = x", universal(ζ, equality(ζ, termVariable("x"))));
    });

    it("bound Greek letter as standalone formula-level meta", () => {
      // ∀ζ. ζ → P は ∀ζ. (ζ → P) で、ζは論理式位置なのでMetaVariable
      const ζmeta = metaVariable("ζ");
      assertFormula(
        "∀ζ. ζ → P",
        universal(termVariable("ζ"), implication(ζmeta, predicate("P", []))),
      );
    });

    it("forall keyword", () => {
      assertFormula(
        "forall x. P(x)",
        universal(termVariable("x"), predicate("P", [termVariable("x")])),
      );
    });

    it("quantifier scope: (∀x.P(x)) → Q has limited scope", () => {
      assertFormula(
        "(∀x. P(x)) → Q",
        implication(
          universal(termVariable("x"), predicate("P", [termVariable("x")])),
          predicate("Q", []),
        ),
      );
    });
  });

  // --- 述語 ---

  describe("predicates", () => {
    it("zero-arity predicate", () => {
      assertFormula("P", predicate("P", []));
    });

    it("unary predicate", () => {
      assertFormula("P(x)", predicate("P", [termVariable("x")]));
    });

    it("binary predicate", () => {
      assertFormula(
        "Q(x, y)",
        predicate("Q", [termVariable("x"), termVariable("y")]),
      );
    });

    it("predicate with complex arguments", () => {
      assertFormula(
        "P(f(x), y + z)",
        predicate("P", [
          functionApplication("f", [termVariable("x")]),
          binaryOperation("+", termVariable("y"), termVariable("z")),
        ]),
      );
    });
  });

  // --- 等号 ---

  describe("equality", () => {
    it("simple equality", () => {
      assertFormula("x = y", equality(termVariable("x"), termVariable("y")));
    });

    it("equality with arithmetic", () => {
      assertFormula(
        "x + y = z",
        equality(
          binaryOperation("+", termVariable("x"), termVariable("y")),
          termVariable("z"),
        ),
      );
    });

    it("equality with functions", () => {
      assertFormula(
        "f(x) = g(y)",
        equality(
          functionApplication("f", [termVariable("x")]),
          functionApplication("g", [termVariable("y")]),
        ),
      );
    });

    it("equality with constants", () => {
      assertFormula("0 = 0", equality(constant("0"), constant("0")));
    });
  });

  // --- メタ変数 ---

  describe("meta variables", () => {
    it("simple meta variable", () => {
      assertFormula("φ", metaVariable("φ"));
    });

    it("meta variable with subscript", () => {
      assertFormula("φ1", metaVariable("φ", "1"));
    });

    it("meta variable with 2-digit subscript", () => {
      assertFormula("φ01", metaVariable("φ", "01"));
    });

    it("negation of meta variable", () => {
      assertFormula("¬φ", negation(metaVariable("φ")));
    });

    it("implication of meta variables", () => {
      assertFormula("φ → ψ", implication(metaVariable("φ"), metaVariable("ψ")));
    });
  });

  // --- ⊥ (bottom/falsum) ---

  describe("bottom (falsum)", () => {
    const bottom = predicate("⊥", []);

    it("⊥ をパースできる", () => {
      assertFormula("⊥", bottom);
    });

    it("¬⊥ をパースできる", () => {
      assertFormula("¬⊥", negation(bottom));
    });

    it("⊥ → φ をパースできる", () => {
      assertFormula("⊥ → φ", implication(bottom, metaVariable("φ")));
    });

    it("φ → ⊥ をパースできる", () => {
      assertFormula("φ → ⊥", implication(metaVariable("φ"), bottom));
    });
  });

  // --- 項メタ変数 ---

  describe("term meta variables", () => {
    it("meta variable in term position (equality)", () => {
      assertFormula(
        "τ = σ",
        equality(termMetaVariable("τ"), termMetaVariable("σ")),
      );
    });

    it("meta variable in function argument", () => {
      assertFormula("P(τ)", predicate("P", [termMetaVariable("τ")]));
    });

    it("meta variable with arithmetic", () => {
      assertFormula(
        "τ + σ = τ",
        equality(
          binaryOperation("+", termMetaVariable("τ"), termMetaVariable("σ")),
          termMetaVariable("τ"),
        ),
      );
    });
  });

  // --- 括弧 ---

  describe("parentheses", () => {
    it("override precedence with parens", () => {
      const φ = metaVariable("φ");
      const ψ = metaVariable("ψ");
      const χ = metaVariable("χ");
      assertFormula("φ ∧ (ψ ∨ χ)", conjunction(φ, disjunction(ψ, χ)));
    });

    it("override associativity with parens", () => {
      const φ = metaVariable("φ");
      const ψ = metaVariable("ψ");
      const χ = metaVariable("χ");
      assertFormula("(φ → ψ) → χ", implication(implication(φ, ψ), χ));
    });

    it("nested parens", () => {
      const φ = metaVariable("φ");
      assertFormula("((φ))", φ);
    });

    it("term parens", () => {
      const x = termVariable("x");
      const y = termVariable("y");
      const z = termVariable("z");
      assertFormula(
        "(x + y) * z = x",
        equality(binaryOperation("*", binaryOperation("+", x, y), z), x),
      );
    });

    it("term parens on right side of equality", () => {
      const x = termVariable("x");
      const y = termVariable("y");
      const z = termVariable("z");
      assertFormula("x = (y + z)", equality(x, binaryOperation("+", y, z)));
    });

    it("formula parens followed by logical operator", () => {
      const φ = metaVariable("φ");
      const ψ = metaVariable("ψ");
      const χ = metaVariable("χ");
      assertFormula("(φ ∧ ψ) ∨ χ", disjunction(conjunction(φ, ψ), χ));
    });

    it("meta variable in parens followed by term operator (backtrack to term)", () => {
      // (τ) + x = y → τ は括弧内で論理式としてパースされるが、
      // 閉じ括弧の後に+が続くため項としてバックトラック
      assertFormula(
        "(τ) + x = y",
        equality(
          binaryOperation("+", termMetaVariable("τ"), termVariable("x")),
          termVariable("y"),
        ),
      );
    });

    it("meta variable in parens followed by equals (backtrack to term)", () => {
      // (τ) = x → τ は括弧内で論理式としてパースされるが、
      // 閉じ括弧の後に=が続くため項としてバックトラック
      assertFormula(
        "(τ) = x",
        equality(termMetaVariable("τ"), termVariable("x")),
      );
    });
  });

  // --- ASCII入力 ---

  describe("ASCII input", () => {
    it("full ASCII expression", () => {
      const φ = metaVariable("φ");
      const ψ = metaVariable("ψ");
      assertFormula(
        "~phi /\\ psi \\/ phi -> psi <-> phi",
        biconditional(
          implication(disjunction(conjunction(negation(φ), ψ), φ), ψ),
          φ,
        ),
      );
    });

    it("all x. P(x) and exists y. Q(y)", () => {
      assertFormula(
        "all x. P(x) and exists y. Q(y)",
        universal(
          termVariable("x"),
          conjunction(
            predicate("P", [termVariable("x")]),
            existential(termVariable("y"), predicate("Q", [termVariable("y")])),
          ),
        ),
      );
    });
  });

  // --- 複合式 ---

  describe("complex expressions", () => {
    it("K axiom instance", () => {
      const φ = metaVariable("φ");
      const ψ = metaVariable("ψ");
      assertFormula("φ → (ψ → φ)", implication(φ, implication(ψ, φ)));
    });

    it("S axiom instance", () => {
      const φ = metaVariable("φ");
      const ψ = metaVariable("ψ");
      const χ = metaVariable("χ");
      assertFormula(
        "(φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))",
        implication(
          implication(φ, implication(ψ, χ)),
          implication(implication(φ, ψ), implication(φ, χ)),
        ),
      );
    });

    it("equality with nested terms in quantified formula", () => {
      const x = termVariable("x");
      const y = termVariable("y");
      assertFormula(
        "∀x. ∀y. f(x, y) = f(y, x)",
        universal(
          x,
          universal(
            y,
            equality(
              functionApplication("f", [x, y]),
              functionApplication("f", [y, x]),
            ),
          ),
        ),
      );
    });

    it("mixed logical and term operators", () => {
      const x = termVariable("x");
      assertFormula(
        "∀x. x + 0 = x ∧ 0 + x = x",
        universal(
          x,
          conjunction(
            equality(binaryOperation("+", x, constant("0")), x),
            equality(binaryOperation("+", constant("0"), x), x),
          ),
        ),
      );
    });
  });

  // --- 置換式 ---

  describe("formula substitution", () => {
    it("simple substitution φ[τ/x]", () => {
      const φ = metaVariable("φ");
      assertFormula(
        "φ[τ/x]",
        formulaSubstitution(φ, termMetaVariable("τ"), termVariable("x")),
      );
    });

    it("substitution with constant term φ[0/x]", () => {
      const φ = metaVariable("φ");
      assertFormula(
        "φ[0/x]",
        formulaSubstitution(φ, constant("0"), termVariable("x")),
      );
    });

    it("substitution with function term φ[S(y)/x]", () => {
      const φ = metaVariable("φ");
      assertFormula(
        "φ[S(y)/x]",
        formulaSubstitution(
          φ,
          functionApplication("S", [termVariable("y")]),
          termVariable("x"),
        ),
      );
    });

    it("substitution with complex term φ[x + y/z]", () => {
      const φ = metaVariable("φ");
      assertFormula(
        "φ[x + y/z]",
        formulaSubstitution(
          φ,
          binaryOperation("+", termVariable("x"), termVariable("y")),
          termVariable("z"),
        ),
      );
    });

    it("chained substitution φ[τ/x][σ/y]", () => {
      const φ = metaVariable("φ");
      assertFormula(
        "φ[τ/x][σ/y]",
        formulaSubstitution(
          formulaSubstitution(φ, termMetaVariable("τ"), termVariable("x")),
          termMetaVariable("σ"),
          termVariable("y"),
        ),
      );
    });

    it("substitution on predicate P(x)[τ/x]", () => {
      assertFormula(
        "P(x)[τ/x]",
        formulaSubstitution(
          predicate("P", [termVariable("x")]),
          termMetaVariable("τ"),
          termVariable("x"),
        ),
      );
    });

    it("substitution binds tighter than →", () => {
      // φ[τ/x] → ψ = (φ[τ/x]) → ψ
      const φ = metaVariable("φ");
      const ψ = metaVariable("ψ");
      assertFormula(
        "φ[τ/x] → ψ",
        implication(
          formulaSubstitution(φ, termMetaVariable("τ"), termVariable("x")),
          ψ,
        ),
      );
    });

    it("substitution on parenthesized formula (φ → ψ)[τ/x]", () => {
      const φ = metaVariable("φ");
      const ψ = metaVariable("ψ");
      assertFormula(
        "(φ → ψ)[τ/x]",
        formulaSubstitution(
          implication(φ, ψ),
          termMetaVariable("τ"),
          termVariable("x"),
        ),
      );
    });

    it("substitution with greek letter variable φ[τ/ζ]", () => {
      const φ = metaVariable("φ");
      assertFormula(
        "φ[τ/ζ]",
        formulaSubstitution(φ, termMetaVariable("τ"), termVariable("ζ")),
      );
    });

    it("free variable absence φ[/x]", () => {
      const φ = metaVariable("φ");
      assertFormula("φ[/x]", freeVariableAbsence(φ, termVariable("x")));
    });

    it("free variable absence on predicate P(x)[/y]", () => {
      assertFormula(
        "P(x)[/y]",
        freeVariableAbsence(
          predicate("P", [termVariable("x")]),
          termVariable("y"),
        ),
      );
    });

    it("chained free variable absence φ[/x][/y]", () => {
      const φ = metaVariable("φ");
      assertFormula(
        "φ[/x][/y]",
        freeVariableAbsence(
          freeVariableAbsence(φ, termVariable("x")),
          termVariable("y"),
        ),
      );
    });

    it("mixed substitution and free variable absence φ[τ/x][/y]", () => {
      const φ = metaVariable("φ");
      assertFormula(
        "φ[τ/x][/y]",
        freeVariableAbsence(
          formulaSubstitution(φ, termMetaVariable("τ"), termVariable("x")),
          termVariable("y"),
        ),
      );
    });

    it("free variable absence binds tighter than →", () => {
      const φ = metaVariable("φ");
      const ψ = metaVariable("ψ");
      assertFormula(
        "φ[/x] → ψ",
        implication(freeVariableAbsence(φ, termVariable("x")), ψ),
      );
    });

    it("free variable absence with meta-variable as variable name", () => {
      const φ = metaVariable("φ");
      assertFormula("φ[/τ]", freeVariableAbsence(φ, termVariable("τ")));
    });
  });

  // --- エラーケース ---

  describe("error cases", () => {
    it("unexpected EOF after →", () => {
      const errors = parseErr("φ →");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("unexpected operator at start", () => {
      const errors = parseErr("→ φ");
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors[0]!.message).toContain("expected formula");
    });

    it("double operator", () => {
      const errors = parseErr("φ ∧ ∧ ψ");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("unclosed paren", () => {
      const errors = parseErr("(φ → ψ");
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors[0]!.message).toContain(")");
    });

    it("missing variable after quantifier", () => {
      const errors = parseErr("∀. P(x)");
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors[0]!.message).toContain("variable");
    });

    it("missing dot after quantifier variable", () => {
      const errors = parseErr("∀x P(x)");
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors[0]!.message).toContain(".");
    });

    it("chained equality", () => {
      const errors = parseErr("x = y = z");
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors[0]!.message).toContain("Chained equality");
    });

    it("chained equality with meta variable", () => {
      // τ = σ = ρ → メタ変数パスでの連鎖等号エラー
      const errors = parseErr("τ = σ = ρ");
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors[0]!.message).toContain("Chained equality");
    });

    it("empty input", () => {
      const errors = parseErr("");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("trailing comma in predicate", () => {
      const errors = parseErr("P(x,)");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("unexpected character in input", () => {
      const errors = parseErr("φ § ψ");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("trailing tokens after valid formula", () => {
      // "φ ψ" → φ はパース成功するが、ψ が残る
      const errors = parseErr("φ ψ");
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors[0]!.message).toContain("expected end of input");
    });

    it("trailing LPAREN after valid formula", () => {
      // "φ (" → φ はパース成功するが、( が残る
      const errors = parseErr("φ (");
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors[0]!.message).toContain("(");
    });

    it("unclosed substitution bracket", () => {
      const errors = parseErr("φ[τ/x");
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors[0]!.message).toContain("]");
    });

    it("substitution missing variable after slash", () => {
      const errors = parseErr("φ[τ/]");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("free variable absence with invalid token after slash", () => {
      // φ[/→] → variable expected after '/'
      const errors = parseErr("φ[/→]");
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors[0]!.message).toContain("variable");
    });

    it("substitution missing slash", () => {
      const errors = parseErr("φ[τ x]");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("comma at start is unexpected", () => {
      const errors = parseErr(",");
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors[0]!.message).toContain(",");
    });

    it("meta variable with complex term without equals", () => {
      // "τ + σ" → 項はパースされるが等号がないのでエラー
      const errors = parseErr("τ + σ");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("upper-ident function missing RPAREN in formula context", () => {
      // "S(x = y" → S( の後にterm list [x] が成功するがRPAREN前に = が来るのでエラー
      const errors = parseErr("S(x = y");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("upper-ident function with invalid first arg in formula context", () => {
      // "S(~) = x" → S( の後に ~ は項としてパース不可、term listのfirstがundefined
      const errors = parseErr("S(~) = x");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("zero-arity function call", () => {
      // "f() = x" → f() は空引数リストの関数適用
      assertFormula(
        "f() = x",
        equality(functionApplication("f", []), termVariable("x")),
      );
    });

    it("equality with invalid RHS (term variable path)", () => {
      // "x = " → 等号の後に何もない → RHSパース失敗
      const errors = parseErr("x = ");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("equality with invalid RHS (meta variable path)", () => {
      // "τ = " → 等号の後に何もない → RHSパース失敗
      const errors = parseErr("τ = ");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("function application with invalid args in term context", () => {
      // "f(→) = x" → f( の後に → は項としてパース不可
      const errors = parseErr("f(→) = x");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("function application missing RPAREN in term context", () => {
      // "f(x = y" → f( の後に項リスト [x] 成功するがRPAREN前に = が来る
      const errors = parseErr("f(x = y");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("free variable absence missing closing bracket", () => {
      // "φ[/x" → [/x の後に ] がない
      const errors = parseErr("φ[/x");
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors[0]!.message).toContain("]");
    });

    it("upper-ident function with invalid args in term context", () => {
      // "S(→) = x" → S( の後に → は項としてパース不可 (term-only parser)
      const errors = parseErr("S(→) = x");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("upper-ident function missing RPAREN in term context", () => {
      // "S(x = y" → S( の後に項リスト [x] 成功するがRPAREN前に = が来る (term-only parser)
      const errors = parseErr("S(x = y");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("quantifier with non-variable token (forall)", () => {
      const errors = parseErr("∀→.P(x)");
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors[0]!.message).toContain("∀");
    });

    it("quantifier with non-variable token (exists)", () => {
      const errors = parseErr("∃→.P(x)");
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors[0]!.message).toContain("∃");
    });

    it("nested quantifier with same variable restores bound state", () => {
      // "∀x.∀x.P(x)" → 内側の ∀x で wasBound=true のため復元不要
      const result = parseString("∀x.∀x.P(x)");
      expect(Either.isRight(result)).toBe(true);
    });

    it("term binary operator with invalid RHS in formula context", () => {
      // "x + → y = z" → x + の後に → は項パース不可 (formula-context term parser)
      const errors = parseErr("x + → y = z");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("parenthesized term with invalid inner in formula context", () => {
      // "(→) = x" → 括弧内に → は項パース不可 (formula-context term parser)
      const errors = parseErr("(→) = x");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("substitution with invalid term (empty brackets)", () => {
      // "φ[]" → 置換項が空でtermパース失敗
      const errors = parseErr("φ[]");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("negation followed by EOF (line 295)", () => {
      // "¬" → 否定の後にフォーミュラがないのでパース失敗
      const errors = parseErr("¬");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("quantifier body is empty (line 345)", () => {
      // "∀x." → 量化子の本体が空でパース失敗
      const errors = parseErr("∀x.");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });
  });

  // --- parseString convenience ---

  describe("parseString", () => {
    it("should parse valid input", () => {
      const result = parseString("φ → ψ");
      expect(Either.isRight(result)).toBe(true);
    });

    it("should return errors for invalid input", () => {
      const result = parseString("→");
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should propagate lexer errors", () => {
      const result = parseString("§");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left[0]!.message).toContain("Unexpected character");
      }
    });
  });

  // --- 項の二項演算子の全種類 ---

  describe("all term binary operators", () => {
    it("minus operator", () => {
      assertFormula(
        "x - y = z",
        equality(
          binaryOperation("-", termVariable("x"), termVariable("y")),
          termVariable("z"),
        ),
      );
    });

    it("divide operator", () => {
      assertFormula(
        "x / y = z",
        equality(
          binaryOperation("/", termVariable("x"), termVariable("y")),
          termVariable("z"),
        ),
      );
    });

    it("power operator", () => {
      assertFormula(
        "x ^ y = z",
        equality(
          binaryOperation("^", termVariable("x"), termVariable("y")),
          termVariable("z"),
        ),
      );
    });
  });
});

// --- parseTermString テスト ---

describe("parseTermString", () => {
  const assertTermParses = (input: string, expected: Term): void => {
    const result = parseTermOk(input);
    expect(equalTerm(result, expected)).toBe(true);
  };

  describe("基本的な項", () => {
    it("変数をパースする", () => {
      assertTermParses("x", termVariable("x"));
    });

    it("定数をパースする", () => {
      assertTermParses("0", constant("0"));
    });

    it("メタ変数をパースする", () => {
      assertTermParses("τ", termMetaVariable("τ"));
    });

    it("添字付きメタ変数をパースする", () => {
      assertTermParses("σ1", termMetaVariable("σ", "1"));
    });
  });

  describe("関数適用", () => {
    it("単項関数をパースする", () => {
      assertTermParses("f(x)", functionApplication("f", [termVariable("x")]));
    });

    it("二項関数をパースする", () => {
      assertTermParses(
        "f(x, y)",
        functionApplication("f", [termVariable("x"), termVariable("y")]),
      );
    });

    it("0引数関数をパースする", () => {
      assertTermParses("c()", functionApplication("c", []));
    });

    it("ネストした関数をパースする", () => {
      assertTermParses(
        "f(g(x))",
        functionApplication("f", [
          functionApplication("g", [termVariable("x")]),
        ]),
      );
    });
  });

  describe("二項演算子", () => {
    it("加算をパースする", () => {
      assertTermParses(
        "x + y",
        binaryOperation("+", termVariable("x"), termVariable("y")),
      );
    });

    it("乗算をパースする", () => {
      assertTermParses(
        "x * y",
        binaryOperation("*", termVariable("x"), termVariable("y")),
      );
    });

    it("べき乗をパースする", () => {
      assertTermParses(
        "x ^ y",
        binaryOperation("^", termVariable("x"), termVariable("y")),
      );
    });

    it("演算子の優先順位を正しく処理する", () => {
      // x + y * z → x + (y * z)
      assertTermParses(
        "x + y * z",
        binaryOperation(
          "+",
          termVariable("x"),
          binaryOperation("*", termVariable("y"), termVariable("z")),
        ),
      );
    });

    it("低優先度演算子で上位再帰を終了する", () => {
      // x * y + z → (x * y) + z — parseTerm(4) が + (leftBP=1 < 4) で break
      assertTermParses(
        "x * y + z",
        binaryOperation(
          "+",
          binaryOperation("*", termVariable("x"), termVariable("y")),
          termVariable("z"),
        ),
      );
    });

    it("括弧で優先順位を変更する", () => {
      // (x + y) * z
      assertTermParses(
        "(x + y) * z",
        binaryOperation(
          "*",
          binaryOperation("+", termVariable("x"), termVariable("y")),
          termVariable("z"),
        ),
      );
    });
  });

  describe("エラーケース", () => {
    it("空文字列でエラーを返す", () => {
      const result = parseTermString("");
      expect(Either.isLeft(result)).toBe(true);
    });

    it("論理式を項として解析するとエラーを返す", () => {
      // "→" は項の開始トークンではない
      const result = parseTermString("→");
      expect(Either.isLeft(result)).toBe(true);
    });

    it("不完全な式でエラーを返す", () => {
      const result = parseTermString("x +");
      expect(Either.isLeft(result)).toBe(true);
    });

    it("余分なトークンでエラーを返す", () => {
      // "x y" は項の後に余分なトークンがある
      const result = parseTermString("x y");
      expect(Either.isLeft(result)).toBe(true);
    });

    it("レキサーエラーを返す", () => {
      const result = parseTermString("x # y");
      expect(Either.isLeft(result)).toBe(true);
    });

    it("閉じ括弧なしでエラーを返す", () => {
      const result = parseTermString("(x");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left.length).toBeGreaterThan(0);
      }
    });

    it("関数の閉じ括弧なしでエラーを返す", () => {
      const result = parseTermString("f(x");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left.length).toBeGreaterThan(0);
      }
    });

    it("コンマ後の不完全な引数でエラーを返す", () => {
      const result = parseTermString("f(x,)");
      expect(Either.isLeft(result)).toBe(true);
    });

    it("余分な閉じ括弧でエラーを返す", () => {
      const result = parseTermString("x)");
      expect(Either.isLeft(result)).toBe(true);
    });

    it("二項演算の後に論理演算子が来るとエラーを返す", () => {
      const result = parseTermString("x + →");
      expect(Either.isLeft(result)).toBe(true);
    });

    it("ドットが項の位置に来るとエラーを返す", () => {
      const result = parseTermString(".");
      expect(Either.isLeft(result)).toBe(true);
    });

    it("カンマが項の位置に来るとエラーを返す", () => {
      const result = parseTermString(",");
      expect(Either.isLeft(result)).toBe(true);
    });

    it("括弧内に不正なトークンがあるとエラーを返す", () => {
      const result = parseTermString("(→)");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left.length).toBeGreaterThan(0);
      }
    });

    it("関数引数の先頭が不正なトークンだとエラーを返す", () => {
      const result = parseTermString("f(→)");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left.length).toBeGreaterThan(0);
      }
    });

    it("大文字識別子を項コンテキストで関数適用としてパースする", () => {
      const result = parseTermString("S(x)");
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(
          equalTerm(
            result.right,
            functionApplication("S", [termVariable("x")]),
          ),
        ).toBe(true);
      }
    });

    it("大文字識別子を項コンテキストで定数としてパースする", () => {
      const result = parseTermString("N");
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(equalTerm(result.right, constant("N"))).toBe(true);
      }
    });

    it("大文字関数の引数が不正なトークンだとエラーを返す", () => {
      const result = parseTermString("S(→)");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left.length).toBeGreaterThan(0);
      }
    });

    it("大文字関数の閉じ括弧なしでエラーを返す", () => {
      const result = parseTermString("S(x");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left.length).toBeGreaterThan(0);
      }
    });

    it("大文字識別子のネストした関数適用をパースする", () => {
      const result = parseTermString("S(S(0))");
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(
          equalTerm(
            result.right,
            functionApplication("S", [
              functionApplication("S", [constant("0")]),
            ]),
          ),
        ).toBe(true);
      }
    });
  });
});

// --- PA公理式のパーステスト ---

describe("PA formula parsing", () => {
  it("PA1: all x. ~(S(x) = 0)", () => {
    const result = parseString("all x. ~(S(x) = 0)");
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(
        equalFormula(
          result.right,
          universal(
            termVariable("x"),
            negation(
              equality(
                functionApplication("S", [termVariable("x")]),
                constant("0"),
              ),
            ),
          ),
        ),
      ).toBe(true);
    }
  });

  it("PA3: all x. x + 0 = x", () => {
    const result = parseString("all x. x + 0 = x");
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(
        equalFormula(
          result.right,
          universal(
            termVariable("x"),
            equality(
              binaryOperation("+", termVariable("x"), constant("0")),
              termVariable("x"),
            ),
          ),
        ),
      ).toBe(true);
    }
  });

  it("PA4: all x. all y. x + S(y) = S(x + y)", () => {
    const result = parseString("all x. all y. x + S(y) = S(x + y)");
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(
        equalFormula(
          result.right,
          universal(
            termVariable("x"),
            universal(
              termVariable("y"),
              equality(
                binaryOperation(
                  "+",
                  termVariable("x"),
                  functionApplication("S", [termVariable("y")]),
                ),
                functionApplication("S", [
                  binaryOperation("+", termVariable("x"), termVariable("y")),
                ]),
              ),
            ),
          ),
        ),
      ).toBe(true);
    }
  });

  it("S(0) + 0 = S(0)", () => {
    const result = parseString("S(0) + 0 = S(0)");
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(
        equalFormula(
          result.right,
          equality(
            binaryOperation(
              "+",
              functionApplication("S", [constant("0")]),
              constant("0"),
            ),
            functionApplication("S", [constant("0")]),
          ),
        ),
      ).toBe(true);
    }
  });

  it("S(0) + S(0) = S(S(0)) (1+1=2)", () => {
    const result = parseString("S(0) + S(0) = S(S(0))");
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(
        equalFormula(
          result.right,
          equality(
            binaryOperation(
              "+",
              functionApplication("S", [constant("0")]),
              functionApplication("S", [constant("0")]),
            ),
            functionApplication("S", [
              functionApplication("S", [constant("0")]),
            ]),
          ),
        ),
      ).toBe(true);
    }
  });

  it("~(S(0) = 0)", () => {
    const result = parseString("~(S(0) = 0)");
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(
        equalFormula(
          result.right,
          negation(
            equality(functionApplication("S", [constant("0")]), constant("0")),
          ),
        ),
      ).toBe(true);
    }
  });

  it("大文字述語P(x)は引き続き述語としてパースされる", () => {
    const result = parseString("P(x)");
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(
        equalFormula(result.right, predicate("P", [termVariable("x")])),
      ).toBe(true);
    }
  });

  it("大文字の後に等号が続く場合は等号式として解釈する", () => {
    const result = parseString("S(x) = S(y)");
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(
        equalFormula(
          result.right,
          equality(
            functionApplication("S", [termVariable("x")]),
            functionApplication("S", [termVariable("y")]),
          ),
        ),
      ).toBe(true);
    }
  });

  it("大文字定数（引数なし）を項コンテキストでパースする", () => {
    // O = O のように、大文字識別子が引数なしの場合はconstantとして扱われる
    const result = parseString("O = O");
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(
        equalFormula(result.right, equality(constant("O"), constant("O"))),
      ).toBe(true);
    }
  });
});
