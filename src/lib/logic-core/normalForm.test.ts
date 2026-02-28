import { describe, expect, it } from "vitest";
import { equalFormula } from "./equality";
import { isTautology } from "./evaluation";
import {
  type Formula,
  biconditional,
  conjunction,
  disjunction,
  implication,
  metaVariable,
  negation,
  predicate,
  universal,
} from "./formula";
import { isCNF, isDNF, isNNF, toCNF, toDNF, toNNF } from "./normalForm";
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
