/**
 * formatUnicode のテスト。
 *
 * DSL仕様（dev/logic-reference/06-dsl-specification.md）セクション7に準拠。
 *
 * 変更時は formatUnicode.ts も同期すること。
 */

import { describe, expect, it } from "vitest";
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
import { Either } from "effect";
import { formatFormula, formatTerm } from "./formatUnicode";
import { parseString } from "./parser";

// ── ヘルパー ──────────────────────────────────────────────

/** parse → format のラウンドトリップを検証 */
const roundTrip = (input: string, expected: string): void => {
  const result = parseString(input);
  if (Either.isLeft(result)) {
    throw new Error(
      `Parse failed: ${result.left.map((e) => e.message).join("; ") satisfies string}`,
    );
  }
  expect(formatFormula(result.right)).toBe(expected);
};

// ── 論理式フォーマット ────────────────────────────────────

describe("formatFormula", () => {
  describe("メタ変数", () => {
    it("添字なし", () => {
      expect(formatFormula(metaVariable("φ"))).toBe("φ");
    });

    it("添字1桁", () => {
      expect(formatFormula(metaVariable("φ", "1"))).toBe("φ₁");
    });

    it("添字2桁", () => {
      expect(formatFormula(metaVariable("ψ", "01"))).toBe("ψ₀₁");
    });

    it("添字3桁", () => {
      expect(formatFormula(metaVariable("χ", "123"))).toBe("χ₁₂₃");
    });

    it("添字0", () => {
      expect(formatFormula(metaVariable("α", "0"))).toBe("α₀");
    });
  });

  describe("否定", () => {
    it("単純な否定", () => {
      expect(formatFormula(negation(metaVariable("φ")))).toBe("¬φ");
    });

    it("否定の二重否定", () => {
      expect(formatFormula(negation(negation(metaVariable("φ"))))).toBe("¬¬φ");
    });

    it("否定の内部が含意（括弧が必要）", () => {
      expect(
        formatFormula(
          negation(implication(metaVariable("φ"), metaVariable("ψ"))),
        ),
      ).toBe("¬(φ → ψ)");
    });

    it("否定の内部が連言（括弧が必要）", () => {
      expect(
        formatFormula(
          negation(conjunction(metaVariable("φ"), metaVariable("ψ"))),
        ),
      ).toBe("¬(φ ∧ ψ)");
    });

    it("否定の内部が述語（括弧不要）", () => {
      expect(formatFormula(negation(predicate("P", [termVariable("x")])))).toBe(
        "¬P(x)",
      );
    });
  });

  describe("二項論理演算", () => {
    it("含意", () => {
      expect(
        formatFormula(implication(metaVariable("φ"), metaVariable("ψ"))),
      ).toBe("φ → ψ");
    });

    it("連言", () => {
      expect(
        formatFormula(conjunction(metaVariable("φ"), metaVariable("ψ"))),
      ).toBe("φ ∧ ψ");
    });

    it("選言", () => {
      expect(
        formatFormula(disjunction(metaVariable("φ"), metaVariable("ψ"))),
      ).toBe("φ ∨ ψ");
    });

    it("双条件", () => {
      expect(
        formatFormula(biconditional(metaVariable("φ"), metaVariable("ψ"))),
      ).toBe("φ ↔ ψ");
    });
  });

  describe("優先順位と括弧", () => {
    it("∧ の中に ∨ がある場合（括弧が必要）", () => {
      expect(
        formatFormula(
          conjunction(
            metaVariable("φ"),
            disjunction(metaVariable("ψ"), metaVariable("χ")),
          ),
        ),
      ).toBe("φ ∧ (ψ ∨ χ)");
    });

    it("∨ の中に ∧ がある場合（括弧不要）", () => {
      expect(
        formatFormula(
          disjunction(
            conjunction(metaVariable("φ"), metaVariable("ψ")),
            metaVariable("χ"),
          ),
        ),
      ).toBe("φ ∧ ψ ∨ χ");
    });

    it("→ の右に → がある場合（右結合なので括弧不要）", () => {
      expect(
        formatFormula(
          implication(
            metaVariable("φ"),
            implication(metaVariable("ψ"), metaVariable("χ")),
          ),
        ),
      ).toBe("φ → ψ → χ");
    });

    it("→ の左に → がある場合（括弧が必要）", () => {
      expect(
        formatFormula(
          implication(
            implication(metaVariable("φ"), metaVariable("ψ")),
            metaVariable("χ"),
          ),
        ),
      ).toBe("(φ → ψ) → χ");
    });

    it("↔ の右に ↔（右結合なので括弧不要）", () => {
      expect(
        formatFormula(
          biconditional(
            metaVariable("φ"),
            biconditional(metaVariable("ψ"), metaVariable("χ")),
          ),
        ),
      ).toBe("φ ↔ ψ ↔ χ");
    });

    it("↔ の左に ↔（括弧が必要）", () => {
      expect(
        formatFormula(
          biconditional(
            biconditional(metaVariable("φ"), metaVariable("ψ")),
            metaVariable("χ"),
          ),
        ),
      ).toBe("(φ ↔ ψ) ↔ χ");
    });

    it("∧ は左結合（左に ∧ は括弧不要）", () => {
      expect(
        formatFormula(
          conjunction(
            conjunction(metaVariable("φ"), metaVariable("ψ")),
            metaVariable("χ"),
          ),
        ),
      ).toBe("φ ∧ ψ ∧ χ");
    });

    it("∧ の右に ∧ は括弧が必要", () => {
      expect(
        formatFormula(
          conjunction(
            metaVariable("φ"),
            conjunction(metaVariable("ψ"), metaVariable("χ")),
          ),
        ),
      ).toBe("φ ∧ (ψ ∧ χ)");
    });

    it("∨ は左結合（左に ∨ は括弧不要）", () => {
      expect(
        formatFormula(
          disjunction(
            disjunction(metaVariable("φ"), metaVariable("ψ")),
            metaVariable("χ"),
          ),
        ),
      ).toBe("φ ∨ ψ ∨ χ");
    });

    it("∨ の右に ∨ は括弧が必要", () => {
      expect(
        formatFormula(
          disjunction(
            metaVariable("φ"),
            disjunction(metaVariable("ψ"), metaVariable("χ")),
          ),
        ),
      ).toBe("φ ∨ (ψ ∨ χ)");
    });
  });

  describe("量化子", () => {
    it("全称量化", () => {
      expect(
        formatFormula(
          universal(termVariable("x"), predicate("P", [termVariable("x")])),
        ),
      ).toBe("∀x.P(x)");
    });

    it("存在量化", () => {
      expect(
        formatFormula(
          existential(termVariable("x"), predicate("Q", [termVariable("x")])),
        ),
      ).toBe("∃x.Q(x)");
    });

    it("量化子のスコープ限定（括弧が必要）", () => {
      // (∀x.P(x)) → Q を表現するとき、括弧なしだと ∀x.(P(x) → Q) と解釈される
      expect(
        formatFormula(
          implication(
            universal(termVariable("x"), predicate("P", [termVariable("x")])),
            metaVariable("ψ"),
          ),
        ),
      ).toBe("(∀x.P(x)) → ψ");
    });

    it("量化子がトップレベルなら括弧不要", () => {
      expect(
        formatFormula(
          universal(
            termVariable("x"),
            implication(
              predicate("P", [termVariable("x")]),
              predicate("Q", [termVariable("x")]),
            ),
          ),
        ),
      ).toBe("∀x.P(x) → Q(x)");
    });

    it("ネストした量化子", () => {
      expect(
        formatFormula(
          universal(
            termVariable("x"),
            existential(
              termVariable("y"),
              predicate("R", [termVariable("x"), termVariable("y")]),
            ),
          ),
        ),
      ).toBe("∀x.∃y.R(x, y)");
    });
  });

  describe("述語", () => {
    it("引数なし述語", () => {
      expect(formatFormula(predicate("P", []))).toBe("P");
    });

    it("単項述語", () => {
      expect(formatFormula(predicate("P", [termVariable("x")]))).toBe("P(x)");
    });

    it("二項述語", () => {
      expect(
        formatFormula(predicate("Q", [termVariable("x"), termVariable("y")])),
      ).toBe("Q(x, y)");
    });
  });

  describe("等号", () => {
    it("単純な等号", () => {
      expect(
        formatFormula(equality(termVariable("x"), termVariable("y"))),
      ).toBe("x = y");
    });

    it("等号の両側に項演算", () => {
      expect(
        formatFormula(
          equality(
            binaryOperation("+", termVariable("x"), termVariable("y")),
            termVariable("z"),
          ),
        ),
      ).toBe("x + y = z");
    });
  });

  describe("置換式", () => {
    it("単純な置換 φ[τ/x]", () => {
      expect(
        formatFormula(
          formulaSubstitution(
            metaVariable("φ"),
            termMetaVariable("τ"),
            termVariable("x"),
          ),
        ),
      ).toBe("φ[τ/x]");
    });

    it("複合式への置換 (φ → ψ)[τ/x]", () => {
      expect(
        formatFormula(
          formulaSubstitution(
            implication(metaVariable("φ"), metaVariable("ψ")),
            termMetaVariable("τ"),
            termVariable("x"),
          ),
        ),
      ).toBe("(φ → ψ)[τ/x]");
    });

    it("否定への置換 (¬φ)[τ/x]", () => {
      expect(
        formatFormula(
          formulaSubstitution(
            negation(metaVariable("φ")),
            termMetaVariable("τ"),
            termVariable("x"),
          ),
        ),
      ).toBe("(¬φ)[τ/x]");
    });

    it("述語への置換 P(x)[τ/x]", () => {
      expect(
        formatFormula(
          formulaSubstitution(
            predicate("P", [termVariable("x")]),
            termMetaVariable("τ"),
            termVariable("x"),
          ),
        ),
      ).toBe("P(x)[τ/x]");
    });

    it("チェイン置換 φ[τ/x][σ/y]", () => {
      expect(
        formatFormula(
          formulaSubstitution(
            formulaSubstitution(
              metaVariable("φ"),
              termMetaVariable("τ"),
              termVariable("x"),
            ),
            termMetaVariable("σ"),
            termVariable("y"),
          ),
        ),
      ).toBe("φ[τ/x][σ/y]");
    });

    it("複合項での置換 φ[S(y)/x]", () => {
      expect(
        formatFormula(
          formulaSubstitution(
            metaVariable("φ"),
            functionApplication("S", [termVariable("y")]),
            termVariable("x"),
          ),
        ),
      ).toBe("φ[S(y)/x]");
    });
  });

  describe("自由変数不在アサーション", () => {
    it("単純な φ[/x]", () => {
      expect(
        formatFormula(
          freeVariableAbsence(metaVariable("φ"), termVariable("x")),
        ),
      ).toBe("φ[/x]");
    });

    it("複合式への適用 (φ → ψ)[/x]", () => {
      expect(
        formatFormula(
          freeVariableAbsence(
            implication(metaVariable("φ"), metaVariable("ψ")),
            termVariable("x"),
          ),
        ),
      ).toBe("(φ → ψ)[/x]");
    });

    it("チェイン φ[/x][/y]", () => {
      expect(
        formatFormula(
          freeVariableAbsence(
            freeVariableAbsence(metaVariable("φ"), termVariable("x")),
            termVariable("y"),
          ),
        ),
      ).toBe("φ[/x][/y]");
    });

    it("置換と混合 φ[τ/x][/y]", () => {
      expect(
        formatFormula(
          freeVariableAbsence(
            formulaSubstitution(
              metaVariable("φ"),
              termMetaVariable("τ"),
              termVariable("x"),
            ),
            termVariable("y"),
          ),
        ),
      ).toBe("φ[τ/x][/y]");
    });
  });

  describe("複合式", () => {
    it("S公理: (φ → ψ → χ) → (φ → ψ) → (φ → χ)", () => {
      const s = implication(
        implication(
          metaVariable("φ"),
          implication(metaVariable("ψ"), metaVariable("χ")),
        ),
        implication(
          implication(metaVariable("φ"), metaVariable("ψ")),
          implication(metaVariable("φ"), metaVariable("χ")),
        ),
      );
      expect(formatFormula(s)).toBe("(φ → ψ → χ) → (φ → ψ) → φ → χ");
    });

    it("K公理: φ → ψ → φ", () => {
      const k = implication(
        metaVariable("φ"),
        implication(metaVariable("ψ"), metaVariable("φ")),
      );
      expect(formatFormula(k)).toBe("φ → ψ → φ");
    });

    it("¬P(x) ∨ Q(x, y)", () => {
      const f = disjunction(
        negation(predicate("P", [termVariable("x")])),
        predicate("Q", [termVariable("x"), termVariable("y")]),
      );
      expect(formatFormula(f)).toBe("¬P(x) ∨ Q(x, y)");
    });

    it("∀x. x + 0 = x", () => {
      const f = universal(
        termVariable("x"),
        equality(
          binaryOperation("+", termVariable("x"), constant("0")),
          termVariable("x"),
        ),
      );
      expect(formatFormula(f)).toBe("∀x.x + 0 = x");
    });
  });
});

// ── 項フォーマット ────────────────────────────────────────

describe("formatTerm", () => {
  it("項変数", () => {
    expect(formatTerm(termVariable("x"))).toBe("x");
  });

  it("項メタ変数（添字なし）", () => {
    expect(formatTerm(termMetaVariable("τ"))).toBe("τ");
  });

  it("項メタ変数（添字あり）", () => {
    expect(formatTerm(termMetaVariable("σ", "1"))).toBe("σ₁");
  });

  it("定数", () => {
    expect(formatTerm(constant("0"))).toBe("0");
  });

  it("関数適用（単項）", () => {
    expect(formatTerm(functionApplication("f", [termVariable("x")]))).toBe(
      "f(x)",
    );
  });

  it("関数適用（二項）", () => {
    expect(
      formatTerm(
        functionApplication("g", [termVariable("x"), termVariable("y")]),
      ),
    ).toBe("g(x, y)");
  });

  it("関数適用（引数なし）", () => {
    expect(formatTerm(functionApplication("c", []))).toBe("c()");
  });

  describe("二項演算", () => {
    it("加算", () => {
      expect(
        formatTerm(binaryOperation("+", termVariable("x"), termVariable("y"))),
      ).toBe("x + y");
    });

    it("減算", () => {
      expect(
        formatTerm(binaryOperation("-", termVariable("x"), termVariable("y"))),
      ).toBe("x − y");
    });

    it("乗算", () => {
      expect(
        formatTerm(binaryOperation("*", termVariable("x"), termVariable("y"))),
      ).toBe("x × y");
    });

    it("除算", () => {
      expect(
        formatTerm(binaryOperation("/", termVariable("x"), termVariable("y"))),
      ).toBe("x ÷ y");
    });

    it("べき乗", () => {
      expect(
        formatTerm(binaryOperation("^", termVariable("x"), termVariable("y"))),
      ).toBe("x ^ y");
    });
  });

  describe("項の優先順位と括弧", () => {
    it("+ の中に * がある場合（括弧不要）", () => {
      expect(
        formatTerm(
          binaryOperation(
            "+",
            binaryOperation("*", termVariable("x"), termVariable("y")),
            termVariable("z"),
          ),
        ),
      ).toBe("x × y + z");
    });

    it("* の中に + がある場合（括弧が必要）", () => {
      expect(
        formatTerm(
          binaryOperation(
            "*",
            binaryOperation("+", termVariable("x"), termVariable("y")),
            termVariable("z"),
          ),
        ),
      ).toBe("(x + y) × z");
    });

    it("^ の右に ^ がある場合（右結合なので括弧不要）", () => {
      expect(
        formatTerm(
          binaryOperation(
            "^",
            termVariable("x"),
            binaryOperation("^", termVariable("y"), termVariable("z")),
          ),
        ),
      ).toBe("x ^ y ^ z");
    });

    it("^ の左に ^ がある場合（括弧が必要）", () => {
      expect(
        formatTerm(
          binaryOperation(
            "^",
            binaryOperation("^", termVariable("x"), termVariable("y")),
            termVariable("z"),
          ),
        ),
      ).toBe("(x ^ y) ^ z");
    });

    it("+ は左結合（左に + は括弧不要）", () => {
      expect(
        formatTerm(
          binaryOperation(
            "+",
            binaryOperation("+", termVariable("x"), termVariable("y")),
            termVariable("z"),
          ),
        ),
      ).toBe("x + y + z");
    });

    it("+ の右に + は括弧が必要", () => {
      expect(
        formatTerm(
          binaryOperation(
            "+",
            termVariable("x"),
            binaryOperation("+", termVariable("y"), termVariable("z")),
          ),
        ),
      ).toBe("x + (y + z)");
    });

    it("ネストした関数適用", () => {
      expect(
        formatTerm(
          functionApplication("f", [
            termVariable("x"),
            functionApplication("g", [termVariable("y")]),
          ]),
        ),
      ).toBe("f(x, g(y))");
    });
  });
});

// ── ラウンドトリップ ──────────────────────────────────────

describe("ラウンドトリップ (parse → format → parse)", () => {
  it("φ → φ", () => {
    roundTrip("φ → φ", "φ → φ");
  });

  it("φ ∧ ψ ∨ χ", () => {
    roundTrip("φ ∧ ψ ∨ χ", "φ ∧ ψ ∨ χ");
  });

  it("¬φ → ψ", () => {
    roundTrip("¬φ → ψ", "¬φ → ψ");
  });

  it("∀x.P(x) → Q(x)", () => {
    roundTrip("∀x.P(x) → Q(x)", "∀x.P(x) → Q(x)");
  });

  it("f(x) + g(y) = h(z)", () => {
    roundTrip("f(x) + g(y) = h(z)", "f(x) + g(y) = h(z)");
  });

  it("∀x. ∃y. x + y = 0", () => {
    roundTrip("∀x. ∃y. x + y = 0", "∀x.∃y.x + y = 0");
  });

  it("(φ → ψ) → χ", () => {
    roundTrip("(φ → ψ) → χ", "(φ → ψ) → χ");
  });

  it("φ ↔ ψ ↔ χ", () => {
    roundTrip("φ ↔ ψ ↔ χ", "φ ↔ ψ ↔ χ");
  });

  it("x ^ y ^ z = w", () => {
    roundTrip("x ^ y ^ z = w", "x ^ y ^ z = w");
  });

  it("P(f(x, g(y)), z)", () => {
    roundTrip("P(f(x, g(y)), z)", "P(f(x, g(y)), z)");
  });

  it("φ₁ → φ₀₁", () => {
    roundTrip("φ₁ → φ₀₁", "φ₁ → φ₀₁");
  });

  it("(∀x.P(x)) → Q", () => {
    roundTrip("(∀x.P(x)) → Q", "(∀x.P(x)) → Q");
  });

  it("¬(φ ∧ ψ) → χ", () => {
    roundTrip("¬(φ ∧ ψ) → χ", "¬(φ ∧ ψ) → χ");
  });

  it("(x + y) * z = x", () => {
    roundTrip("(x + y) * z = x", "(x + y) × z = x");
  });

  it("φ[τ/x]", () => {
    roundTrip("φ[τ/x]", "φ[τ/x]");
  });

  it("(φ → ψ)[τ/x]", () => {
    roundTrip("(φ → ψ)[τ/x]", "(φ → ψ)[τ/x]");
  });

  it("φ[τ/x][σ/y]", () => {
    roundTrip("φ[τ/x][σ/y]", "φ[τ/x][σ/y]");
  });

  it("φ[S(y)/x]", () => {
    roundTrip("φ[S(y)/x]", "φ[S(y)/x]");
  });

  it("φ[τ/x] → ψ", () => {
    roundTrip("φ[τ/x] → ψ", "φ[τ/x] → ψ");
  });

  it("φ[/x]", () => {
    roundTrip("φ[/x]", "φ[/x]");
  });

  it("φ[/x][/y]", () => {
    roundTrip("φ[/x][/y]", "φ[/x][/y]");
  });

  it("φ[τ/x][/y]", () => {
    roundTrip("φ[τ/x][/y]", "φ[τ/x][/y]");
  });

  it("format → parse ラウンドトリップ", () => {
    // format → parse → format で同じ結果が得られることを検証
    const formula = implication(
      conjunction(metaVariable("φ"), metaVariable("ψ")),
      disjunction(metaVariable("χ"), negation(metaVariable("ω"))),
    );
    const formatted = formatFormula(formula);
    const result = parseString(formatted);
    if (Either.isLeft(result)) {
      throw new Error(
        `Parse failed: ${result.left.map((e) => e.message).join("; ") satisfies string}`,
      );
    }
    expect(formatFormula(result.right)).toBe(formatted);
  });
});
