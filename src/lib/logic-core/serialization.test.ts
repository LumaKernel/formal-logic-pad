import { describe, it, expect } from "vitest";
import { Either } from "effect";
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
  termVariable,
  termMetaVariable,
  constant,
  functionApplication,
  binaryOperation,
  equalFormula,
  equalTerm,
} from "./index";
import type { Formula, Term } from "./index";
import {
  decodeFormula,
  encodeFormula,
  decodeTerm,
  encodeTerm,
} from "./serialization";

// ── helpers ────────────────────────────────────────────────

/** encode → decode のラウンドトリップが元と等価であることを検証 */
const formulaRoundTrip = (f: Formula): void => {
  const encoded = encodeFormula(f);
  const decoded = decodeFormula(encoded);
  expect(Either.isRight(decoded)).toBe(true);
  if (Either.isRight(decoded)) {
    expect(equalFormula(decoded.right, f)).toBe(true);
  }
};

const termRoundTrip = (t: Term): void => {
  const encoded = encodeTerm(t);
  const decoded = decodeTerm(encoded);
  expect(Either.isRight(decoded)).toBe(true);
  if (Either.isRight(decoded)) {
    expect(equalTerm(decoded.right, t)).toBe(true);
  }
};

// ── Term encode/decode ─────────────────────────────────────

describe("Term serialization", () => {
  describe("TermVariable", () => {
    it("ラウンドトリップ: 基本的な変数", () => {
      termRoundTrip(termVariable("x"));
    });

    it("encodeされた値はJSON互換のプレーンオブジェクト", () => {
      const encoded = encodeTerm(termVariable("x"));
      const json = JSON.stringify(encoded);
      const parsed: unknown = JSON.parse(json);
      const decoded = decodeTerm(parsed);
      expect(Either.isRight(decoded)).toBe(true);
      if (Either.isRight(decoded)) {
        expect(equalTerm(decoded.right, termVariable("x"))).toBe(true);
      }
    });
  });

  describe("TermMetaVariable", () => {
    it("ラウンドトリップ: 添字なし", () => {
      termRoundTrip(termMetaVariable("τ"));
    });

    it("ラウンドトリップ: 添字あり", () => {
      termRoundTrip(termMetaVariable("σ", "1"));
    });

    it("ラウンドトリップ: 添字 01 と 1 は区別される", () => {
      const t01 = termMetaVariable("τ", "01");
      const t1 = termMetaVariable("τ", "1");
      termRoundTrip(t01);
      termRoundTrip(t1);
      // 区別されることを確認
      const enc01 = encodeTerm(t01);
      const enc1 = encodeTerm(t1);
      expect(JSON.stringify(enc01)).not.toBe(JSON.stringify(enc1));
    });
  });

  describe("Constant", () => {
    it("ラウンドトリップ", () => {
      termRoundTrip(constant("0"));
    });
  });

  describe("FunctionApplication", () => {
    it("ラウンドトリップ: 引数なし", () => {
      termRoundTrip(functionApplication("f", []));
    });

    it("ラウンドトリップ: 引数あり", () => {
      termRoundTrip(
        functionApplication("f", [termVariable("x"), constant("0")]),
      );
    });

    it("ラウンドトリップ: ネストした関数適用", () => {
      termRoundTrip(
        functionApplication("g", [
          functionApplication("f", [termVariable("x")]),
          termVariable("y"),
        ]),
      );
    });
  });

  describe("BinaryOperation", () => {
    it("ラウンドトリップ: 各演算子", () => {
      const ops = ["+", "-", "*", "/", "^"] as const;
      for (const op of ops) {
        termRoundTrip(
          binaryOperation(op, termVariable("x"), termVariable("y")),
        );
      }
    });

    it("ラウンドトリップ: ネストした演算", () => {
      termRoundTrip(
        binaryOperation(
          "+",
          binaryOperation("*", termVariable("x"), constant("2")),
          termVariable("y"),
        ),
      );
    });
  });

  describe("エラーケース", () => {
    it("null入力はエラー", () => {
      const result = decodeTerm(null);
      expect(Either.isLeft(result)).toBe(true);
    });

    it("_tagが不正なオブジェクトはエラー", () => {
      const result = decodeTerm({ _tag: "Unknown", name: "x" });
      expect(Either.isLeft(result)).toBe(true);
    });

    it("フィールドが欠落したオブジェクトはエラー", () => {
      const result = decodeTerm({ _tag: "TermVariable" });
      expect(Either.isLeft(result)).toBe(true);
    });

    it("型が不正なフィールドはエラー", () => {
      const result = decodeTerm({ _tag: "TermVariable", name: 123 });
      expect(Either.isLeft(result)).toBe(true);
    });

    it("数値入力はエラー", () => {
      const result = decodeTerm(42);
      expect(Either.isLeft(result)).toBe(true);
    });

    it("文字列入力はエラー", () => {
      const result = decodeTerm("hello");
      expect(Either.isLeft(result)).toBe(true);
    });
  });
});

// ── Formula encode/decode ──────────────────────────────────

describe("Formula serialization", () => {
  describe("MetaVariable", () => {
    it("ラウンドトリップ: 添字なし", () => {
      formulaRoundTrip(metaVariable("φ"));
    });

    it("ラウンドトリップ: 添字あり", () => {
      formulaRoundTrip(metaVariable("ψ", "42"));
    });
  });

  describe("Negation", () => {
    it("ラウンドトリップ", () => {
      formulaRoundTrip(negation(metaVariable("φ")));
    });

    it("ラウンドトリップ: 二重否定", () => {
      formulaRoundTrip(negation(negation(metaVariable("φ"))));
    });
  });

  describe("Implication", () => {
    it("ラウンドトリップ", () => {
      formulaRoundTrip(implication(metaVariable("φ"), metaVariable("ψ")));
    });

    it("ラウンドトリップ: ネスト (右結合)", () => {
      formulaRoundTrip(
        implication(
          metaVariable("φ"),
          implication(metaVariable("ψ"), metaVariable("χ")),
        ),
      );
    });
  });

  describe("Conjunction", () => {
    it("ラウンドトリップ", () => {
      formulaRoundTrip(conjunction(metaVariable("φ"), metaVariable("ψ")));
    });
  });

  describe("Disjunction", () => {
    it("ラウンドトリップ", () => {
      formulaRoundTrip(disjunction(metaVariable("φ"), metaVariable("ψ")));
    });
  });

  describe("Biconditional", () => {
    it("ラウンドトリップ", () => {
      formulaRoundTrip(biconditional(metaVariable("φ"), metaVariable("ψ")));
    });
  });

  describe("Universal", () => {
    it("ラウンドトリップ", () => {
      formulaRoundTrip(
        universal(termVariable("x"), predicate("P", [termVariable("x")])),
      );
    });
  });

  describe("Existential", () => {
    it("ラウンドトリップ", () => {
      formulaRoundTrip(
        existential(termVariable("x"), predicate("Q", [termVariable("x")])),
      );
    });
  });

  describe("Predicate", () => {
    it("ラウンドトリップ: 引数なし", () => {
      formulaRoundTrip(predicate("P", []));
    });

    it("ラウンドトリップ: 複数引数", () => {
      formulaRoundTrip(
        predicate("R", [
          termVariable("x"),
          constant("0"),
          functionApplication("f", [termVariable("y")]),
        ]),
      );
    });
  });

  describe("Equality", () => {
    it("ラウンドトリップ", () => {
      formulaRoundTrip(equality(termVariable("x"), termVariable("y")));
    });

    it("ラウンドトリップ: 複雑な項", () => {
      formulaRoundTrip(
        equality(
          functionApplication("f", [termVariable("x")]),
          binaryOperation("+", termVariable("y"), constant("1")),
        ),
      );
    });
  });

  describe("FormulaSubstitution", () => {
    it("ラウンドトリップ", () => {
      formulaRoundTrip(
        formulaSubstitution(
          metaVariable("φ"),
          functionApplication("f", [termVariable("x")]),
          termVariable("y"),
        ),
      );
    });
  });

  describe("FreeVariableAbsence", () => {
    it("ラウンドトリップ", () => {
      formulaRoundTrip(
        freeVariableAbsence(metaVariable("φ"), termVariable("x")),
      );
    });

    it("ラウンドトリップ: ネストした式", () => {
      formulaRoundTrip(
        freeVariableAbsence(
          predicate("P", [termVariable("x"), termVariable("y")]),
          termVariable("x"),
        ),
      );
    });

    it("ラウンドトリップ: チェイン", () => {
      formulaRoundTrip(
        freeVariableAbsence(
          freeVariableAbsence(metaVariable("φ"), termVariable("x")),
          termVariable("y"),
        ),
      );
    });
  });

  describe("複雑な組み合わせ", () => {
    it("ラウンドトリップ: ∀ζ.P(ζ) ∧ ∃ξ.Q(ξ)", () => {
      formulaRoundTrip(
        conjunction(
          universal(termVariable("ζ"), predicate("P", [termVariable("ζ")])),
          existential(termVariable("ξ"), predicate("Q", [termVariable("ξ")])),
        ),
      );
    });

    it("ラウンドトリップ: φ → (ψ → φ) (K公理)", () => {
      formulaRoundTrip(
        implication(
          metaVariable("φ"),
          implication(metaVariable("ψ"), metaVariable("φ")),
        ),
      );
    });

    it("ラウンドトリップ: (φ→ψ→χ)→(φ→ψ)→φ→χ (S公理)", () => {
      formulaRoundTrip(
        implication(
          implication(
            metaVariable("φ"),
            implication(metaVariable("ψ"), metaVariable("χ")),
          ),
          implication(
            implication(metaVariable("φ"), metaVariable("ψ")),
            implication(metaVariable("φ"), metaVariable("χ")),
          ),
        ),
      );
    });

    it("ラウンドトリップ: ∀x. x + 0 = x", () => {
      formulaRoundTrip(
        universal(
          termVariable("x"),
          equality(
            binaryOperation("+", termVariable("x"), constant("0")),
            termVariable("x"),
          ),
        ),
      );
    });
  });

  describe("JSON経由のラウンドトリップ", () => {
    it("JSON.stringify/JSON.parse を挟んでも復元可能", () => {
      const original = implication(
        universal(termVariable("x"), predicate("P", [termVariable("x")])),
        existential(
          termVariable("y"),
          negation(predicate("P", [termVariable("y")])),
        ),
      );
      const encoded = encodeFormula(original);
      const json = JSON.stringify(encoded);
      const parsed: unknown = JSON.parse(json);
      const decoded = decodeFormula(parsed);
      expect(Either.isRight(decoded)).toBe(true);
      if (Either.isRight(decoded)) {
        expect(equalFormula(decoded.right, original)).toBe(true);
      }
    });
  });

  describe("エラーケース", () => {
    it("null入力はエラー", () => {
      const result = decodeFormula(null);
      expect(Either.isLeft(result)).toBe(true);
    });

    it("_tagが不正なオブジェクトはエラー", () => {
      const result = decodeFormula({ _tag: "Unknown" });
      expect(Either.isLeft(result)).toBe(true);
    });

    it("フィールドが欠落したオブジェクトはエラー", () => {
      const result = decodeFormula({ _tag: "MetaVariable" });
      expect(Either.isLeft(result)).toBe(true);
    });

    it("GreekLetterが不正", () => {
      const result = decodeFormula({ _tag: "MetaVariable", name: "invalid" });
      expect(Either.isLeft(result)).toBe(true);
    });

    it("ネストしたフィールドが不正", () => {
      const result = decodeFormula({
        _tag: "Negation",
        formula: { _tag: "Unknown" },
      });
      expect(Either.isLeft(result)).toBe(true);
    });

    it("配列入力はエラー", () => {
      const result = decodeFormula([1, 2, 3]);
      expect(Either.isLeft(result)).toBe(true);
    });

    it("undefinedはエラー", () => {
      const result = decodeFormula(undefined);
      expect(Either.isLeft(result)).toBe(true);
    });
  });
});
