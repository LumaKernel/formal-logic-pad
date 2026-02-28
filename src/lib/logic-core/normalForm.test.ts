import { describe, expect, it } from "vitest";
import { equalFormula } from "./equality";
import { isTautology } from "./evaluation";
import {
  type Formula,
  biconditional,
  conjunction,
  disjunction,
  existential,
  implication,
  metaVariable,
  negation,
  predicate,
  universal,
  equality,
  formulaSubstitution,
} from "./formula";
import {
  isCNF,
  isDNF,
  isNNF,
  isPNF,
  toCNF,
  toDNF,
  toNNF,
  toPNF,
  toPredicateNNF,
} from "./normalForm";
import { freeVariablesInFormula } from "./freeVariables";
import { termVariable } from "./term";

// ── テスト用ヘルパー ────────────────────────────────────

const p = metaVariable("φ");
const q = metaVariable("ψ");
const r = metaVariable("χ");

/**
 * 変換前後の論理的等価性を検証する。
 * A ↔ B が恒真であることを確認。
 */
const assertEquivalent = (original: Formula, converted: Formula): void => {
  expect(isTautology(biconditional(original, converted))).toBe(true);
};

// ── NNF (否定標準形) ────────────────────────────────────

describe("toNNF", () => {
  describe("原子命題", () => {
    it("メタ変数はそのまま返る", () => {
      expect(equalFormula(toNNF(p), p)).toBe(true);
    });
  });

  describe("否定", () => {
    it("原子命題の否定はそのまま", () => {
      const formula = negation(p);
      const result = toNNF(formula);
      expect(result._tag).toBe("Negation");
      assertEquivalent(formula, result);
    });

    it("二重否定を除去する: ¬¬φ → φ", () => {
      const formula = negation(negation(p));
      const result = toNNF(formula);
      expect(equalFormula(result, p)).toBe(true);
    });

    it("三重否定を処理する: ¬¬¬φ → ¬φ", () => {
      const formula = negation(negation(negation(p)));
      const result = toNNF(formula);
      expect(equalFormula(result, negation(p))).toBe(true);
    });

    it("四重否定を処理する: ¬¬¬¬φ → φ", () => {
      const formula = negation(negation(negation(negation(p))));
      const result = toNNF(formula);
      expect(equalFormula(result, p)).toBe(true);
    });
  });

  describe("De Morgan 則", () => {
    it("¬(φ ∧ ψ) → ¬φ ∨ ¬ψ", () => {
      const formula = negation(conjunction(p, q));
      const result = toNNF(formula);
      expect(isNNF(result)).toBe(true);
      assertEquivalent(formula, result);
      expect(equalFormula(result, disjunction(negation(p), negation(q)))).toBe(
        true,
      );
    });

    it("¬(φ ∨ ψ) → ¬φ ∧ ¬ψ", () => {
      const formula = negation(disjunction(p, q));
      const result = toNNF(formula);
      expect(isNNF(result)).toBe(true);
      assertEquivalent(formula, result);
      expect(equalFormula(result, conjunction(negation(p), negation(q)))).toBe(
        true,
      );
    });

    it("ネストした De Morgan: ¬(¬φ ∧ ψ) → φ ∨ ¬ψ", () => {
      const formula = negation(conjunction(negation(p), q));
      const result = toNNF(formula);
      expect(isNNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });
  });

  describe("含意の除去", () => {
    it("φ → ψ を ¬φ ∨ ψ に変換する", () => {
      const formula = implication(p, q);
      const result = toNNF(formula);
      expect(isNNF(result)).toBe(true);
      assertEquivalent(formula, result);
      expect(equalFormula(result, disjunction(negation(p), q))).toBe(true);
    });

    it("¬(φ → ψ) → φ ∧ ¬ψ", () => {
      const formula = negation(implication(p, q));
      const result = toNNF(formula);
      expect(isNNF(result)).toBe(true);
      assertEquivalent(formula, result);
      expect(equalFormula(result, conjunction(p, negation(q)))).toBe(true);
    });
  });

  describe("双条件の除去", () => {
    it("φ ↔ ψ を (φ ∧ ψ) ∨ (¬φ ∧ ¬ψ) に変換する", () => {
      const formula = biconditional(p, q);
      const result = toNNF(formula);
      expect(isNNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });

    it("¬(φ ↔ ψ) → (φ ∧ ¬ψ) ∨ (¬φ ∧ ψ)", () => {
      const formula = negation(biconditional(p, q));
      const result = toNNF(formula);
      expect(isNNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });
  });

  describe("複合的な式", () => {
    it("(φ → ψ) → χ の NNF 変換", () => {
      const formula = implication(implication(p, q), r);
      const result = toNNF(formula);
      expect(isNNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });

    it("¬(φ → (ψ ∧ χ)) の NNF 変換", () => {
      const formula = negation(implication(p, conjunction(q, r)));
      const result = toNNF(formula);
      expect(isNNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });

    it("(φ ↔ ψ) ∧ (ψ → χ) の NNF 変換", () => {
      const formula = conjunction(biconditional(p, q), implication(q, r));
      const result = toNNF(formula);
      expect(isNNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });

    it("φ ∧ ψ はそのまま維持される（NNF のまま）", () => {
      const formula = conjunction(p, q);
      const result = toNNF(formula);
      expect(equalFormula(result, formula)).toBe(true);
    });

    it("φ ∨ ψ はそのまま維持される（NNF のまま）", () => {
      const formula = disjunction(p, q);
      const result = toNNF(formula);
      expect(equalFormula(result, formula)).toBe(true);
    });
  });

  describe("エラーケース", () => {
    it("全称量化子を含む式でエラー", () => {
      const formula = universal(termVariable("x"), p);
      expect(() => toNNF(formula)).toThrow("non-propositional");
    });

    it("述語を含む式でエラー", () => {
      const formula = predicate("P", [termVariable("x")]);
      expect(() => toNNF(formula)).toThrow("non-propositional");
    });

    it("¬(∀x.φ) でもエラー", () => {
      const formula = negation(universal(termVariable("x"), p));
      expect(() => toNNF(formula)).toThrow("non-propositional");
    });
  });
});

// ── CNF (連言標準形) ────────────────────────────────────

describe("toCNF", () => {
  describe("単純なケース", () => {
    it("原子命題はそのまま CNF", () => {
      const result = toCNF(p);
      expect(isCNF(result)).toBe(true);
      assertEquivalent(p, result);
    });

    it("¬φ はそのまま CNF", () => {
      const formula = negation(p);
      const result = toCNF(formula);
      expect(isCNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });

    it("φ ∧ ψ はそのまま CNF", () => {
      const formula = conjunction(p, q);
      const result = toCNF(formula);
      expect(isCNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });

    it("φ ∨ ψ はそのまま CNF", () => {
      const formula = disjunction(p, q);
      const result = toCNF(formula);
      expect(isCNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });
  });

  describe("分配法則", () => {
    it("φ ∨ (ψ ∧ χ) → (φ ∨ ψ) ∧ (φ ∨ χ)", () => {
      const formula = disjunction(p, conjunction(q, r));
      const result = toCNF(formula);
      expect(isCNF(result)).toBe(true);
      assertEquivalent(formula, result);
      expect(
        equalFormula(result, conjunction(disjunction(p, q), disjunction(p, r))),
      ).toBe(true);
    });

    it("(φ ∧ ψ) ∨ χ → (φ ∨ χ) ∧ (ψ ∨ χ)", () => {
      const formula = disjunction(conjunction(p, q), r);
      const result = toCNF(formula);
      expect(isCNF(result)).toBe(true);
      assertEquivalent(formula, result);
      expect(
        equalFormula(result, conjunction(disjunction(p, r), disjunction(q, r))),
      ).toBe(true);
    });

    it("(φ ∧ ψ) ∨ (χ ∧ ¬φ) — 両側に ∧ がある場合", () => {
      const formula = disjunction(
        conjunction(p, q),
        conjunction(r, negation(p)),
      );
      const result = toCNF(formula);
      expect(isCNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });
  });

  describe("含意・双条件からの変換", () => {
    it("φ → ψ を CNF に変換", () => {
      const formula = implication(p, q);
      const result = toCNF(formula);
      expect(isCNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });

    it("φ ↔ ψ を CNF に変換", () => {
      const formula = biconditional(p, q);
      const result = toCNF(formula);
      expect(isCNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });
  });

  describe("複合的な式", () => {
    it("(φ → ψ) ∧ (ψ → χ) の CNF", () => {
      const formula = conjunction(implication(p, q), implication(q, r));
      const result = toCNF(formula);
      expect(isCNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });

    it("¬(φ ∧ ψ) の CNF", () => {
      const formula = negation(conjunction(p, q));
      const result = toCNF(formula);
      expect(isCNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });

    it("¬(φ ∨ ψ) の CNF", () => {
      const formula = negation(disjunction(p, q));
      const result = toCNF(formula);
      expect(isCNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });
  });

  describe("エラーケース", () => {
    it("量化子を含む式でエラー", () => {
      const formula = universal(termVariable("x"), p);
      expect(() => toCNF(formula)).toThrow("non-propositional");
    });
  });
});

// ── DNF (選言標準形) ────────────────────────────────────

describe("toDNF", () => {
  describe("単純なケース", () => {
    it("原子命題はそのまま DNF", () => {
      const result = toDNF(p);
      expect(isDNF(result)).toBe(true);
      assertEquivalent(p, result);
    });

    it("¬φ はそのまま DNF", () => {
      const formula = negation(p);
      const result = toDNF(formula);
      expect(isDNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });

    it("φ ∧ ψ はそのまま DNF", () => {
      const formula = conjunction(p, q);
      const result = toDNF(formula);
      expect(isDNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });

    it("φ ∨ ψ はそのまま DNF", () => {
      const formula = disjunction(p, q);
      const result = toDNF(formula);
      expect(isDNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });
  });

  describe("分配法則", () => {
    it("φ ∧ (ψ ∨ χ) → (φ ∧ ψ) ∨ (φ ∧ χ)", () => {
      const formula = conjunction(p, disjunction(q, r));
      const result = toDNF(formula);
      expect(isDNF(result)).toBe(true);
      assertEquivalent(formula, result);
      expect(
        equalFormula(result, disjunction(conjunction(p, q), conjunction(p, r))),
      ).toBe(true);
    });

    it("(φ ∨ ψ) ∧ χ → (φ ∧ χ) ∨ (ψ ∧ χ)", () => {
      const formula = conjunction(disjunction(p, q), r);
      const result = toDNF(formula);
      expect(isDNF(result)).toBe(true);
      assertEquivalent(formula, result);
      expect(
        equalFormula(result, disjunction(conjunction(p, r), conjunction(q, r))),
      ).toBe(true);
    });

    it("(φ ∨ ψ) ∧ (χ ∨ ¬φ) — 両側に ∨ がある場合", () => {
      const formula = conjunction(
        disjunction(p, q),
        disjunction(r, negation(p)),
      );
      const result = toDNF(formula);
      expect(isDNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });
  });

  describe("含意・双条件からの変換", () => {
    it("φ → ψ を DNF に変換", () => {
      const formula = implication(p, q);
      const result = toDNF(formula);
      expect(isDNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });

    it("φ ↔ ψ を DNF に変換", () => {
      const formula = biconditional(p, q);
      const result = toDNF(formula);
      expect(isDNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });
  });

  describe("複合的な式", () => {
    it("(φ → ψ) ∧ (ψ → χ) の DNF", () => {
      const formula = conjunction(implication(p, q), implication(q, r));
      const result = toDNF(formula);
      expect(isDNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });

    it("¬(φ ∧ ψ) の DNF", () => {
      const formula = negation(conjunction(p, q));
      const result = toDNF(formula);
      expect(isDNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });

    it("¬(φ ∨ ψ) の DNF", () => {
      const formula = negation(disjunction(p, q));
      const result = toDNF(formula);
      expect(isDNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });
  });

  describe("エラーケース", () => {
    it("量化子を含む式でエラー", () => {
      const formula = universal(termVariable("x"), p);
      expect(() => toDNF(formula)).toThrow("non-propositional");
    });
  });
});

// ── isNNF ────────────────────────────────────────────────

describe("isNNF", () => {
  it("原子命題は NNF", () => {
    expect(isNNF(p)).toBe(true);
  });

  it("原子命題の否定は NNF", () => {
    expect(isNNF(negation(p))).toBe(true);
  });

  it("二重否定は NNF ではない", () => {
    expect(isNNF(negation(negation(p)))).toBe(false);
  });

  it("連言の否定は NNF ではない", () => {
    expect(isNNF(negation(conjunction(p, q)))).toBe(false);
  });

  it("∧ と ∨ のみの式は NNF", () => {
    expect(isNNF(conjunction(disjunction(p, negation(q)), r))).toBe(true);
  });

  it("含意を含む式は NNF ではない", () => {
    expect(isNNF(implication(p, q))).toBe(false);
  });

  it("双条件を含む式は NNF ではない", () => {
    expect(isNNF(biconditional(p, q))).toBe(false);
  });

  it("量化子でエラー", () => {
    expect(() => isNNF(universal(termVariable("x"), p))).toThrow(
      "non-propositional",
    );
  });
});

// ── isCNF ────────────────────────────────────────────────

describe("isCNF", () => {
  it("原子命題は CNF", () => {
    expect(isCNF(p)).toBe(true);
  });

  it("リテラルの否定は CNF", () => {
    expect(isCNF(negation(p))).toBe(true);
  });

  it("リテラルの選言は CNF（単一節）", () => {
    expect(isCNF(disjunction(p, negation(q)))).toBe(true);
  });

  it("節の連言は CNF", () => {
    expect(
      isCNF(conjunction(disjunction(p, q), disjunction(negation(p), r))),
    ).toBe(true);
  });

  it("連言の選言は CNF ではない", () => {
    // (p ∧ q) ∨ r — 節内に ∧ がある
    expect(isCNF(disjunction(conjunction(p, q), r))).toBe(false);
  });

  it("含意は CNF ではない", () => {
    expect(isCNF(implication(p, q))).toBe(false);
  });

  it("二重否定は CNF ではない", () => {
    expect(isCNF(negation(negation(p)))).toBe(false);
  });

  it("リテラルの連言は CNF（各節がリテラル）", () => {
    expect(isCNF(conjunction(p, negation(q)))).toBe(true);
  });
});

// ── isDNF ────────────────────────────────────────────────

describe("isDNF", () => {
  it("原子命題は DNF", () => {
    expect(isDNF(p)).toBe(true);
  });

  it("リテラルの否定は DNF", () => {
    expect(isDNF(negation(p))).toBe(true);
  });

  it("リテラルの連言は DNF（単一項）", () => {
    expect(isDNF(conjunction(p, negation(q)))).toBe(true);
  });

  it("項の選言は DNF", () => {
    expect(
      isDNF(disjunction(conjunction(p, q), conjunction(negation(p), r))),
    ).toBe(true);
  });

  it("選言の連言は DNF ではない", () => {
    // (p ∨ q) ∧ r — 項内に ∨ がある
    expect(isDNF(conjunction(disjunction(p, q), r))).toBe(false);
  });

  it("含意は DNF ではない", () => {
    expect(isDNF(implication(p, q))).toBe(false);
  });

  it("二重否定は DNF ではない", () => {
    expect(isDNF(negation(negation(p)))).toBe(false);
  });

  it("リテラルの選言は DNF（各項がリテラル）", () => {
    expect(isDNF(disjunction(p, negation(q)))).toBe(true);
  });
});

// ── 恒等変換の検証 ──────────────────────────────────────

describe("恒等変換の検証（変換結果は元の式と論理的に等価）", () => {
  const formulas: readonly {
    readonly name: string;
    readonly formula: Formula;
  }[] = [
    { name: "φ", formula: p },
    { name: "¬φ", formula: negation(p) },
    { name: "φ ∧ ψ", formula: conjunction(p, q) },
    { name: "φ ∨ ψ", formula: disjunction(p, q) },
    { name: "φ → ψ", formula: implication(p, q) },
    { name: "φ ↔ ψ", formula: biconditional(p, q) },
    { name: "¬(φ ∧ ψ)", formula: negation(conjunction(p, q)) },
    { name: "¬(φ ∨ ψ)", formula: negation(disjunction(p, q)) },
    { name: "¬(φ → ψ)", formula: negation(implication(p, q)) },
    { name: "¬(φ ↔ ψ)", formula: negation(biconditional(p, q)) },
    {
      name: "(φ → ψ) ∧ (ψ → χ)",
      formula: conjunction(implication(p, q), implication(q, r)),
    },
    {
      name: "(φ ∨ ψ) ∧ (χ ∨ ¬φ)",
      formula: conjunction(disjunction(p, q), disjunction(r, negation(p))),
    },
    {
      name: "φ ↔ (ψ ∧ χ)",
      formula: biconditional(p, conjunction(q, r)),
    },
    {
      name: "¬(φ ↔ (ψ → χ))",
      formula: negation(biconditional(p, implication(q, r))),
    },
  ];

  for (const { name, formula } of formulas) {
    it(`NNF: ${name satisfies string}`, () => {
      const result = toNNF(formula);
      expect(isNNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });

    it(`CNF: ${name satisfies string}`, () => {
      const result = toCNF(formula);
      expect(isCNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });

    it(`DNF: ${name satisfies string}`, () => {
      const result = toDNF(formula);
      expect(isDNF(result)).toBe(true);
      assertEquivalent(formula, result);
    });
  }
});

// ── 述語論理テスト用ヘルパー ──────────────────────────────

const x = termVariable("x");
const y = termVariable("y");

// P(x), Q(x), R(x,y) など述語
const Px = predicate("P", [x]);
const Qx = predicate("Q", [x]);
const Qy = predicate("Q", [y]);
const Rxy = predicate("R", [x, y]);

// ── toPredicateNNF (述語論理の NNF) ────────────────────

describe("toPredicateNNF", () => {
  describe("原子式", () => {
    it("述語はそのまま返る", () => {
      expect(equalFormula(toPredicateNNF(Px), Px)).toBe(true);
    });

    it("等号はそのまま返る", () => {
      const eq = equality(x, y);
      expect(equalFormula(toPredicateNNF(eq), eq)).toBe(true);
    });

    it("メタ変数はそのまま返る", () => {
      expect(equalFormula(toPredicateNNF(p), p)).toBe(true);
    });
  });

  describe("否定の変換", () => {
    it("¬P(x) はそのまま", () => {
      const formula = negation(Px);
      const result = toPredicateNNF(formula);
      expect(result._tag).toBe("Negation");
    });

    it("¬¬P(x) → P(x) (二重否定除去)", () => {
      const formula = negation(negation(Px));
      const result = toPredicateNNF(formula);
      expect(equalFormula(result, Px)).toBe(true);
    });

    it("¬(P(x) ∧ Q(x)) → ¬P(x) ∨ ¬Q(x) (De Morgan)", () => {
      const formula = negation(conjunction(Px, Qx));
      const result = toPredicateNNF(formula);
      expect(
        equalFormula(result, disjunction(negation(Px), negation(Qx))),
      ).toBe(true);
    });

    it("¬(P(x) ∨ Q(x)) → ¬P(x) ∧ ¬Q(x) (De Morgan)", () => {
      const formula = negation(disjunction(Px, Qx));
      const result = toPredicateNNF(formula);
      expect(
        equalFormula(result, conjunction(negation(Px), negation(Qx))),
      ).toBe(true);
    });
  });

  describe("量化子の否定", () => {
    it("¬∀x.P(x) → ∃x.¬P(x)", () => {
      const formula = negation(universal(x, Px));
      const result = toPredicateNNF(formula);
      expect(equalFormula(result, existential(x, negation(Px)))).toBe(true);
    });

    it("¬∃x.P(x) → ∀x.¬P(x)", () => {
      const formula = negation(existential(x, Px));
      const result = toPredicateNNF(formula);
      expect(equalFormula(result, universal(x, negation(Px)))).toBe(true);
    });

    it("¬¬∀x.P(x) → ∀x.P(x)", () => {
      const formula = negation(negation(universal(x, Px)));
      const result = toPredicateNNF(formula);
      expect(equalFormula(result, universal(x, Px))).toBe(true);
    });

    it("¬∀x.¬P(x) → ∃x.P(x)", () => {
      const formula = negation(universal(x, negation(Px)));
      const result = toPredicateNNF(formula);
      expect(equalFormula(result, existential(x, Px))).toBe(true);
    });
  });

  describe("含意・双条件の除去", () => {
    it("∀x.(P(x) → Q(x)) → ∀x.(¬P(x) ∨ Q(x))", () => {
      const formula = universal(x, implication(Px, Qx));
      const result = toPredicateNNF(formula);
      expect(
        equalFormula(result, universal(x, disjunction(negation(Px), Qx))),
      ).toBe(true);
    });

    it("¬(P(x) → Q(x)) → P(x) ∧ ¬Q(x)", () => {
      const formula = negation(implication(Px, Qx));
      const result = toPredicateNNF(formula);
      expect(equalFormula(result, conjunction(Px, negation(Qx)))).toBe(true);
    });

    it("¬(P(x) ↔ Q(x)) を NNF に変換", () => {
      const formula = negation(biconditional(Px, Qx));
      const result = toPredicateNNF(formula);
      // (P ∧ ¬Q) ∨ (¬P ∧ Q)
      const expected = disjunction(
        conjunction(Px, negation(Qx)),
        conjunction(negation(Px), Qx),
      );
      expect(equalFormula(result, expected)).toBe(true);
    });
  });

  describe("量化子の保存", () => {
    it("∀x.P(x) はそのまま", () => {
      const formula = universal(x, Px);
      expect(equalFormula(toPredicateNNF(formula), formula)).toBe(true);
    });

    it("∃x.P(x) はそのまま", () => {
      const formula = existential(x, Px);
      expect(equalFormula(toPredicateNNF(formula), formula)).toBe(true);
    });

    it("∀x.∃y.R(x,y) はそのまま", () => {
      const formula = universal(x, existential(y, Rxy));
      expect(equalFormula(toPredicateNNF(formula), formula)).toBe(true);
    });
  });

  describe("複合的な式", () => {
    it("¬(∀x.P(x) ∧ ∃y.Q(y)) → ∃x.¬P(x) ∨ ∀y.¬Q(y)", () => {
      const formula = negation(conjunction(universal(x, Px), existential(y, Qy)));
      const result = toPredicateNNF(formula);
      const expected = disjunction(
        existential(x, negation(Px)),
        universal(y, negation(Qy)),
      );
      expect(equalFormula(result, expected)).toBe(true);
    });

    it("¬(∀x.P(x) → ∃y.Q(y)) → ∀x.P(x) ∧ ∀y.¬Q(y)", () => {
      const formula = negation(implication(universal(x, Px), existential(y, Qy)));
      const result = toPredicateNNF(formula);
      const expected = conjunction(
        universal(x, Px),
        universal(y, negation(Qy)),
      );
      expect(equalFormula(result, expected)).toBe(true);
    });
  });

  describe("エラーケース", () => {
    it("FormulaSubstitution を含む式でエラー", () => {
      const formula = formulaSubstitution(Px, y, x);
      expect(() => toPredicateNNF(formula)).toThrow("FormulaSubstitution");
    });

    it("¬FormulaSubstitution でもエラー", () => {
      const formula = negation(formulaSubstitution(Px, y, x));
      expect(() => toPredicateNNF(formula)).toThrow("FormulaSubstitution");
    });
  });
});

// ── toPNF (冠頭標準形) ─────────────────────────────────

describe("toPNF", () => {
  describe("量化子なしの式", () => {
    it("P(x) はそのまま PNF", () => {
      const result = toPNF(Px);
      expect(isPNF(result)).toBe(true);
      expect(equalFormula(result, Px)).toBe(true);
    });

    it("P(x) ∧ Q(x) はそのまま PNF", () => {
      const formula = conjunction(Px, Qx);
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
    });

    it("¬P(x) はそのまま PNF", () => {
      const formula = negation(Px);
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
    });

    it("メタ変数はそのまま PNF", () => {
      const result = toPNF(p);
      expect(isPNF(result)).toBe(true);
    });
  });

  describe("単一量化子", () => {
    it("∀x.P(x) はそのまま PNF", () => {
      const formula = universal(x, Px);
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
      expect(equalFormula(result, formula)).toBe(true);
    });

    it("∃x.P(x) はそのまま PNF", () => {
      const formula = existential(x, Px);
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
      expect(equalFormula(result, formula)).toBe(true);
    });
  });

  describe("ネストした量化子", () => {
    it("∀x.∃y.R(x,y) はそのまま PNF", () => {
      const formula = universal(x, existential(y, Rxy));
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
      expect(equalFormula(result, formula)).toBe(true);
    });
  });

  describe("量化子の持ち上げ（変数衝突なし）", () => {
    it("(∀x.P(x)) ∧ Q(y) → ∀x.(P(x) ∧ Q(y))", () => {
      const formula = conjunction(universal(x, Px), Qy);
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
      // x は Q(y) で自由でないので α変換なし
      expect(result._tag).toBe("Universal");
      if (result._tag === "Universal") {
        expect(result.variable.name).toBe("x");
      }
    });

    it("Q(y) ∧ (∃x.P(x)) → ∃x.(Q(y) ∧ P(x))", () => {
      const formula = conjunction(Qy, existential(x, Px));
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
      expect(result._tag).toBe("Existential");
      if (result._tag === "Existential") {
        expect(result.variable.name).toBe("x");
      }
    });

    it("(∀x.P(x)) ∨ Q(y) → ∀x.(P(x) ∨ Q(y))", () => {
      const formula = disjunction(universal(x, Px), Qy);
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
      expect(result._tag).toBe("Universal");
    });

    it("Q(y) ∨ (∃x.P(x)) → ∃x.(Q(y) ∨ P(x))", () => {
      const formula = disjunction(Qy, existential(x, Px));
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
      expect(result._tag).toBe("Existential");
    });
  });

  describe("量化子の持ち上げ（α変換が必要）", () => {
    it("(∀x.P(x)) ∧ P(x) → ∀x'.(P(x') ∧ P(x))  (x が右辺で自由)", () => {
      const formula = conjunction(universal(x, Px), Px);
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
      // α変換により x' に改名されるはず
      expect(result._tag).toBe("Universal");
      if (result._tag === "Universal") {
        expect(result.variable.name).not.toBe("x");
        // x は行列部分で自由に出現する（元の Px からの参照）
        const matrixFree = freeVariablesInFormula(result.formula);
        expect(matrixFree.has("x")).toBe(true);
      }
    });

    it("P(x) ∧ (∃x.Q(x)) → ∃x'.(P(x) ∧ Q(x'))  (x が左辺で自由)", () => {
      const formula = conjunction(Px, existential(x, Qx));
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
      expect(result._tag).toBe("Existential");
      if (result._tag === "Existential") {
        expect(result.variable.name).not.toBe("x");
      }
    });

    it("(∀x.P(x)) ∨ P(x) → ∀x'.(P(x') ∨ P(x))", () => {
      const formula = disjunction(universal(x, Px), Px);
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
      expect(result._tag).toBe("Universal");
      if (result._tag === "Universal") {
        expect(result.variable.name).not.toBe("x");
      }
    });

    it("P(x) ∨ (∃x.Q(x)) → ∃x'.(P(x) ∨ Q(x'))", () => {
      const formula = disjunction(Px, existential(x, Qx));
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
      expect(result._tag).toBe("Existential");
      if (result._tag === "Existential") {
        expect(result.variable.name).not.toBe("x");
      }
    });
  });

  describe("両辺に量化子がある場合", () => {
    it("(∀x.P(x)) ∧ (∃y.Q(y)) → ∀x.∃y.(P(x) ∧ Q(y))", () => {
      const formula = conjunction(universal(x, Px), existential(y, Qy));
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
      // 量化子が2つ先頭に来る
      expect(result._tag).toBe("Universal");
      if (result._tag === "Universal") {
        expect(result.formula._tag).toBe("Existential");
      }
    });

    it("(∃x.P(x)) ∨ (∀y.Q(y)) → ∃x.∀y.(P(x) ∨ Q(y))", () => {
      const formula = disjunction(existential(x, Px), universal(y, Qy));
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
      expect(result._tag).toBe("Existential");
      if (result._tag === "Existential") {
        expect(result.formula._tag).toBe("Universal");
      }
    });

    it("(∀x.P(x)) ∧ (∃x.Q(x)) → α変換して量化子を持ち上げ", () => {
      // 両辺が x を使うので一方が α変換される
      const formula = conjunction(universal(x, Px), existential(x, Qx));
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
      // 2つの量化子が先頭に来る
      expect(
        result._tag === "Universal" || result._tag === "Existential",
      ).toBe(true);
    });
  });

  describe("→ と ↔ の除去を含む PNF 変換", () => {
    it("∀x.P(x) → ∃y.Q(y) を PNF に変換", () => {
      const formula = implication(universal(x, Px), existential(y, Qy));
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
    });

    it("¬(∀x.P(x) → Q(y)) を PNF に変換", () => {
      const formula = negation(implication(universal(x, Px), Qy));
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
    });

    it("P(x) ↔ ∀y.Q(y) を PNF に変換", () => {
      const formula = biconditional(Px, universal(y, Qy));
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
    });
  });

  describe("複合的な式", () => {
    it("(∀x.P(x)) ∧ (∀y.Q(y)) ∧ R(x,y) を PNF に変換", () => {
      const formula = conjunction(
        conjunction(universal(x, Px), universal(y, Qy)),
        Rxy,
      );
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
    });

    it("¬(∀x.P(x) ∧ ∃y.Q(y)) を PNF に変換", () => {
      const formula = negation(
        conjunction(universal(x, Px), existential(y, Qy)),
      );
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
    });

    it("∀x.(P(x) ∨ ∃y.R(x,y)) を PNF に変換", () => {
      const formula = universal(x, disjunction(Px, existential(y, Rxy)));
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
    });

    it("(∀x.P(x)) → (∀x.Q(x)) を PNF に変換", () => {
      const formula = implication(universal(x, Px), universal(x, Qx));
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
    });

    it("三重量化子: ∀x.(∃y.(P(x) ∧ Q(y))) ∨ R(x,y) を PNF に変換", () => {
      const formula = disjunction(
        universal(x, existential(y, conjunction(Px, Qy))),
        Rxy,
      );
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
    });
  });

  describe("等号を含む式", () => {
    it("∀x.(x = x) はそのまま PNF", () => {
      const formula = universal(x, equality(x, x));
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
      expect(equalFormula(result, formula)).toBe(true);
    });

    it("¬∀x.(x = y) → ∃x.¬(x = y)", () => {
      const formula = negation(universal(x, equality(x, y)));
      const result = toPNF(formula);
      expect(isPNF(result)).toBe(true);
      expect(result._tag).toBe("Existential");
    });
  });

  describe("エラーケース", () => {
    it("FormulaSubstitution を含む式でエラー", () => {
      const formula = formulaSubstitution(Px, y, x);
      expect(() => toPNF(formula)).toThrow("FormulaSubstitution");
    });
  });
});

// ── isPNF ──────────────────────────────────────────────

describe("isPNF", () => {
  describe("PNF の式", () => {
    it("原子式は PNF", () => {
      expect(isPNF(Px)).toBe(true);
    });

    it("等号は PNF", () => {
      expect(isPNF(equality(x, y))).toBe(true);
    });

    it("メタ変数は PNF", () => {
      expect(isPNF(p)).toBe(true);
    });

    it("¬P(x) は PNF", () => {
      expect(isPNF(negation(Px))).toBe(true);
    });

    it("P(x) ∧ Q(x) は PNF", () => {
      expect(isPNF(conjunction(Px, Qx))).toBe(true);
    });

    it("P(x) ∨ Q(x) は PNF", () => {
      expect(isPNF(disjunction(Px, Qx))).toBe(true);
    });

    it("P(x) → Q(x) は PNF（行列部に量化子がなければ OK）", () => {
      expect(isPNF(implication(Px, Qx))).toBe(true);
    });

    it("∀x.P(x) は PNF", () => {
      expect(isPNF(universal(x, Px))).toBe(true);
    });

    it("∃x.P(x) は PNF", () => {
      expect(isPNF(existential(x, Px))).toBe(true);
    });

    it("∀x.∃y.R(x,y) は PNF", () => {
      expect(isPNF(universal(x, existential(y, Rxy)))).toBe(true);
    });

    it("∀x.∃y.(P(x) ∧ Q(y)) は PNF", () => {
      expect(
        isPNF(universal(x, existential(y, conjunction(Px, Qy)))),
      ).toBe(true);
    });

    it("∀x.(P(x) ∧ ¬Q(x)) は PNF", () => {
      expect(isPNF(universal(x, conjunction(Px, negation(Qx))))).toBe(true);
    });
  });

  describe("PNF でない式", () => {
    it("P(x) ∧ ∀y.Q(y) は PNF ではない（行列部に量化子）", () => {
      expect(isPNF(conjunction(Px, universal(y, Qy)))).toBe(false);
    });

    it("∀x.P(x) ∨ Q(x) は PNF ではない（量化子の後に二項結合子の外側に量化子）", () => {
      // 注: これは ∀x.(P(x)) ∨ Q(x) — 量化子は左辺のみにかかる
      expect(isPNF(disjunction(universal(x, Px), Qx))).toBe(false);
    });

    it("¬∀x.P(x) は PNF ではない（¬の下に量化子）", () => {
      expect(isPNF(negation(universal(x, Px)))).toBe(false);
    });

    it("∀x.(P(x) ∧ ∃y.Q(y)) は PNF ではない（行列部に量化子）", () => {
      expect(
        isPNF(universal(x, conjunction(Px, existential(y, Qy)))),
      ).toBe(false);
    });

    it("(∀x.P(x)) → (∃y.Q(y)) は PNF ではない", () => {
      expect(
        isPNF(implication(universal(x, Px), existential(y, Qy))),
      ).toBe(false);
    });
  });

  describe("エラーケース", () => {
    it("FormulaSubstitution でエラー", () => {
      expect(() => isPNF(formulaSubstitution(Px, y, x))).toThrow(
        "FormulaSubstitution",
      );
    });

    it("ネストした FormulaSubstitution でエラー", () => {
      expect(() =>
        isPNF(conjunction(Px, formulaSubstitution(Qx, y, x))),
      ).toThrow("FormulaSubstitution");
    });
  });
});

// ── PNF 変換の一貫性テスト ──────────────────────────────

describe("PNF 変換の一貫性", () => {
  it("既に PNF な式は変換後も同じ構造", () => {
    const formula = universal(x, existential(y, conjunction(Px, Qy)));
    const result = toPNF(formula);
    expect(isPNF(result)).toBe(true);
    expect(equalFormula(result, formula)).toBe(true);
  });

  it("PNF 変換は冪等: toPNF(toPNF(φ)) = toPNF(φ)", () => {
    const formula = conjunction(universal(x, Px), existential(y, Qy));
    const once = toPNF(formula);
    const twice = toPNF(once);
    expect(equalFormula(once, twice)).toBe(true);
  });

  it("変換後の自由変数は保存される", () => {
    // ∀x.P(x) ∧ R(x,y) — x, y が自由だが x は ∀x 内で束縛
    // 全体の自由変数: x（右辺の R(x,y) 由来）, y
    const formula = conjunction(universal(x, Px), Rxy);
    const originalFree = freeVariablesInFormula(formula);
    const result = toPNF(formula);
    const resultFree = freeVariablesInFormula(result);
    // PNF 変換では α変換が起きうるが、自由変数セットは保存される
    expect(resultFree.has("x")).toBe(originalFree.has("x"));
    expect(resultFree.has("y")).toBe(originalFree.has("y"));
  });

  it("複数回の α変換が必要な場合も正しく動作", () => {
    // (∀x.P(x)) ∧ P(x) ∧ P(x) のような式
    const formula = conjunction(
      conjunction(universal(x, Px), Px),
      Px,
    );
    const result = toPNF(formula);
    expect(isPNF(result)).toBe(true);
  });

  it("深いネストの量化子も正しく持ち上がる", () => {
    // ((∀x.P(x)) ∧ (∃y.Q(y))) ∨ R(x,y)
    const formula = disjunction(
      conjunction(universal(x, Px), existential(y, Qy)),
      Rxy,
    );
    const result = toPNF(formula);
    expect(isPNF(result)).toBe(true);
  });

  it("α変換で x' も衝突する場合 x'' に改名される", () => {
    // x' という変数名が既に使われているケース
    const xPrime = termVariable("x'");
    const PxPrime = predicate("P", [xPrime]);
    // (∀x.P(x)) ∧ (P(x) ∧ P(x')) — x も x' も使われている
    const formula = conjunction(
      universal(x, Px),
      conjunction(Px, PxPrime),
    );
    const result = toPNF(formula);
    expect(isPNF(result)).toBe(true);
    // α変換で x'' が使われるはず
    expect(result._tag).toBe("Universal");
    if (result._tag === "Universal") {
      expect(result.variable.name).toBe("x''");
    }
  });

  it("z 変数を含む式でのα変換", () => {
    // (∀x.R(x,y)) ∧ (∃x.P(x)) — 同じ x を使うので α変換必要
    const formula = conjunction(
      universal(x, Rxy),
      existential(x, Px),
    );
    const result = toPNF(formula);
    expect(isPNF(result)).toBe(true);
    // 2つの量化子が先頭に
    expect(
      result._tag === "Universal" || result._tag === "Existential",
    ).toBe(true);
    if (result._tag === "Universal" || result._tag === "Existential") {
      expect(
        result.formula._tag === "Universal" ||
          result.formula._tag === "Existential",
      ).toBe(true);
    }
  });
});
