/**
 * formatLaTeX のテスト。
 *
 * DSL仕様（dev/logic-reference/06-dsl-specification.md）セクション8に準拠。
 *
 * 変更時は formatLaTeX.ts も同期すること。
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
import { formatFormulaLaTeX, formatTermLaTeX } from "./formatLaTeX";

// ── 論理式フォーマット ────────────────────────────────────────

describe("formatFormulaLaTeX", () => {
  describe("メタ変数", () => {
    it("添字なし", () => {
      expect(formatFormulaLaTeX(metaVariable("φ"))).toBe("\\varphi");
    });

    it("添字1桁", () => {
      expect(formatFormulaLaTeX(metaVariable("φ", "1"))).toBe("\\varphi_{1}");
    });

    it("添字2桁", () => {
      expect(formatFormulaLaTeX(metaVariable("ψ", "01"))).toBe("\\psi_{01}");
    });

    it("添字3桁", () => {
      expect(formatFormulaLaTeX(metaVariable("χ", "123"))).toBe("\\chi_{123}");
    });

    it("添字0", () => {
      expect(formatFormulaLaTeX(metaVariable("α", "0"))).toBe("\\alpha_{0}");
    });

    it("全ギリシャ文字のLaTeX変換", () => {
      // 代表的なギリシャ文字のLaTeX変換を確認
      expect(formatFormulaLaTeX(metaVariable("ε"))).toBe("\\varepsilon");
      expect(formatFormulaLaTeX(metaVariable("θ"))).toBe("\\theta");
      expect(formatFormulaLaTeX(metaVariable("λ"))).toBe("\\lambda");
      expect(formatFormulaLaTeX(metaVariable("ω"))).toBe("\\omega");
    });
  });

  describe("否定", () => {
    it("単純な否定", () => {
      expect(formatFormulaLaTeX(negation(metaVariable("φ")))).toBe(
        "\\lnot \\varphi",
      );
    });

    it("否定の二重否定", () => {
      expect(formatFormulaLaTeX(negation(negation(metaVariable("φ"))))).toBe(
        "\\lnot \\lnot \\varphi",
      );
    });

    it("否定の内部が含意（括弧が必要）", () => {
      expect(
        formatFormulaLaTeX(
          negation(implication(metaVariable("φ"), metaVariable("ψ"))),
        ),
      ).toBe("\\lnot \\left(\\varphi \\to \\psi\\right)");
    });

    it("否定の内部が連言（括弧が必要）", () => {
      expect(
        formatFormulaLaTeX(
          negation(conjunction(metaVariable("φ"), metaVariable("ψ"))),
        ),
      ).toBe("\\lnot \\left(\\varphi \\land \\psi\\right)");
    });

    it("否定の内部が述語（括弧不要）", () => {
      expect(
        formatFormulaLaTeX(negation(predicate("P", [termVariable("x")]))),
      ).toBe("\\lnot P\\left(x\\right)");
    });
  });

  describe("二項論理演算", () => {
    it("含意", () => {
      expect(
        formatFormulaLaTeX(implication(metaVariable("φ"), metaVariable("ψ"))),
      ).toBe("\\varphi \\to \\psi");
    });

    it("連言", () => {
      expect(
        formatFormulaLaTeX(conjunction(metaVariable("φ"), metaVariable("ψ"))),
      ).toBe("\\varphi \\land \\psi");
    });

    it("選言", () => {
      expect(
        formatFormulaLaTeX(disjunction(metaVariable("φ"), metaVariable("ψ"))),
      ).toBe("\\varphi \\lor \\psi");
    });

    it("双条件", () => {
      expect(
        formatFormulaLaTeX(biconditional(metaVariable("φ"), metaVariable("ψ"))),
      ).toBe("\\varphi \\leftrightarrow \\psi");
    });
  });

  describe("優先順位と括弧", () => {
    it("∧ の中に ∨ がある場合（括弧が必要）", () => {
      expect(
        formatFormulaLaTeX(
          conjunction(
            metaVariable("φ"),
            disjunction(metaVariable("ψ"), metaVariable("χ")),
          ),
        ),
      ).toBe("\\varphi \\land \\left(\\psi \\lor \\chi\\right)");
    });

    it("∨ の中に ∧ がある場合（括弧不要）", () => {
      expect(
        formatFormulaLaTeX(
          disjunction(
            conjunction(metaVariable("φ"), metaVariable("ψ")),
            metaVariable("χ"),
          ),
        ),
      ).toBe("\\varphi \\land \\psi \\lor \\chi");
    });

    it("→ の右に → がある場合（右結合なので括弧不要）", () => {
      expect(
        formatFormulaLaTeX(
          implication(
            metaVariable("φ"),
            implication(metaVariable("ψ"), metaVariable("χ")),
          ),
        ),
      ).toBe("\\varphi \\to \\psi \\to \\chi");
    });

    it("→ の左に → がある場合（括弧が必要）", () => {
      expect(
        formatFormulaLaTeX(
          implication(
            implication(metaVariable("φ"), metaVariable("ψ")),
            metaVariable("χ"),
          ),
        ),
      ).toBe("\\left(\\varphi \\to \\psi\\right) \\to \\chi");
    });

    it("↔ の右に ↔（右結合なので括弧不要）", () => {
      expect(
        formatFormulaLaTeX(
          biconditional(
            metaVariable("φ"),
            biconditional(metaVariable("ψ"), metaVariable("χ")),
          ),
        ),
      ).toBe("\\varphi \\leftrightarrow \\psi \\leftrightarrow \\chi");
    });

    it("↔ の左に ↔（括弧が必要）", () => {
      expect(
        formatFormulaLaTeX(
          biconditional(
            biconditional(metaVariable("φ"), metaVariable("ψ")),
            metaVariable("χ"),
          ),
        ),
      ).toBe(
        "\\left(\\varphi \\leftrightarrow \\psi\\right) \\leftrightarrow \\chi",
      );
    });

    it("∧ は左結合（左に ∧ は括弧不要）", () => {
      expect(
        formatFormulaLaTeX(
          conjunction(
            conjunction(metaVariable("φ"), metaVariable("ψ")),
            metaVariable("χ"),
          ),
        ),
      ).toBe("\\varphi \\land \\psi \\land \\chi");
    });

    it("∧ の右に ∧ は括弧が必要", () => {
      expect(
        formatFormulaLaTeX(
          conjunction(
            metaVariable("φ"),
            conjunction(metaVariable("ψ"), metaVariable("χ")),
          ),
        ),
      ).toBe("\\varphi \\land \\left(\\psi \\land \\chi\\right)");
    });

    it("∨ は左結合（左に ∨ は括弧不要）", () => {
      expect(
        formatFormulaLaTeX(
          disjunction(
            disjunction(metaVariable("φ"), metaVariable("ψ")),
            metaVariable("χ"),
          ),
        ),
      ).toBe("\\varphi \\lor \\psi \\lor \\chi");
    });

    it("∨ の右に ∨ は括弧が必要", () => {
      expect(
        formatFormulaLaTeX(
          disjunction(
            metaVariable("φ"),
            disjunction(metaVariable("ψ"), metaVariable("χ")),
          ),
        ),
      ).toBe("\\varphi \\lor \\left(\\psi \\lor \\chi\\right)");
    });
  });

  describe("量化子", () => {
    it("全称量化", () => {
      expect(
        formatFormulaLaTeX(
          universal(termVariable("x"), predicate("P", [termVariable("x")])),
        ),
      ).toBe("\\forall x . P\\left(x\\right)");
    });

    it("存在量化", () => {
      expect(
        formatFormulaLaTeX(
          existential(termVariable("x"), predicate("Q", [termVariable("x")])),
        ),
      ).toBe("\\exists x . Q\\left(x\\right)");
    });

    it("量化子のスコープ限定（括弧が必要）", () => {
      expect(
        formatFormulaLaTeX(
          implication(
            universal(termVariable("x"), predicate("P", [termVariable("x")])),
            metaVariable("ψ"),
          ),
        ),
      ).toBe("\\left(\\forall x . P\\left(x\\right)\\right) \\to \\psi");
    });

    it("量化子がトップレベルなら括弧不要", () => {
      expect(
        formatFormulaLaTeX(
          universal(
            termVariable("x"),
            implication(
              predicate("P", [termVariable("x")]),
              predicate("Q", [termVariable("x")]),
            ),
          ),
        ),
      ).toBe("\\forall x . P\\left(x\\right) \\to Q\\left(x\\right)");
    });

    it("ネストした量化子", () => {
      expect(
        formatFormulaLaTeX(
          universal(
            termVariable("x"),
            existential(
              termVariable("y"),
              predicate("R", [termVariable("x"), termVariable("y")]),
            ),
          ),
        ),
      ).toBe("\\forall x . \\exists y . R\\left(x, y\\right)");
    });
  });

  describe("述語", () => {
    it("引数なし述語", () => {
      expect(formatFormulaLaTeX(predicate("P", []))).toBe("P");
    });

    it("単項述語", () => {
      expect(formatFormulaLaTeX(predicate("P", [termVariable("x")]))).toBe(
        "P\\left(x\\right)",
      );
    });

    it("二項述語", () => {
      expect(
        formatFormulaLaTeX(
          predicate("Q", [termVariable("x"), termVariable("y")]),
        ),
      ).toBe("Q\\left(x, y\\right)");
    });
  });

  describe("等号", () => {
    it("単純な等号", () => {
      expect(
        formatFormulaLaTeX(equality(termVariable("x"), termVariable("y"))),
      ).toBe("x = y");
    });

    it("等号の両側に項演算", () => {
      expect(
        formatFormulaLaTeX(
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
        formatFormulaLaTeX(
          formulaSubstitution(
            metaVariable("φ"),
            termMetaVariable("τ"),
            termVariable("x"),
          ),
        ),
      ).toBe("\\varphi[\\tau/x]");
    });

    it("複合式への置換 (φ → ψ)[τ/x]", () => {
      expect(
        formatFormulaLaTeX(
          formulaSubstitution(
            implication(metaVariable("φ"), metaVariable("ψ")),
            termMetaVariable("τ"),
            termVariable("x"),
          ),
        ),
      ).toBe("\\left(\\varphi \\to \\psi\\right)[\\tau/x]");
    });

    it("述語への置換 P(x)[τ/x]", () => {
      expect(
        formatFormulaLaTeX(
          formulaSubstitution(
            predicate("P", [termVariable("x")]),
            termMetaVariable("τ"),
            termVariable("x"),
          ),
        ),
      ).toBe("P\\left(x\\right)[\\tau/x]");
    });

    it("チェイン置換 φ[τ/x][σ/y]", () => {
      expect(
        formatFormulaLaTeX(
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
      ).toBe("\\varphi[\\tau/x][\\sigma/y]");
    });
  });

  describe("自由変数不在アサーション", () => {
    it("単純な φ[/x]", () => {
      expect(
        formatFormulaLaTeX(
          freeVariableAbsence(metaVariable("φ"), termVariable("x")),
        ),
      ).toBe("\\varphi[/x]");
    });

    it("複合式への適用 (φ → ψ)[/x]", () => {
      expect(
        formatFormulaLaTeX(
          freeVariableAbsence(
            implication(metaVariable("φ"), metaVariable("ψ")),
            termVariable("x"),
          ),
        ),
      ).toBe("\\left(\\varphi \\to \\psi\\right)[/x]");
    });

    it("チェイン φ[/x][/y]", () => {
      expect(
        formatFormulaLaTeX(
          freeVariableAbsence(
            freeVariableAbsence(metaVariable("φ"), termVariable("x")),
            termVariable("y"),
          ),
        ),
      ).toBe("\\varphi[/x][/y]");
    });
  });

  describe("複合式", () => {
    it("S公理", () => {
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
      expect(formatFormulaLaTeX(s)).toBe(
        "\\left(\\varphi \\to \\psi \\to \\chi\\right) \\to \\left(\\varphi \\to \\psi\\right) \\to \\varphi \\to \\chi",
      );
    });

    it("K公理", () => {
      const k = implication(
        metaVariable("φ"),
        implication(metaVariable("ψ"), metaVariable("φ")),
      );
      expect(formatFormulaLaTeX(k)).toBe("\\varphi \\to \\psi \\to \\varphi");
    });

    it("¬P(x) ∨ Q(x, y)", () => {
      const f = disjunction(
        negation(predicate("P", [termVariable("x")])),
        predicate("Q", [termVariable("x"), termVariable("y")]),
      );
      expect(formatFormulaLaTeX(f)).toBe(
        "\\lnot P\\left(x\\right) \\lor Q\\left(x, y\\right)",
      );
    });

    it("∀x. x + 0 = x", () => {
      const f = universal(
        termVariable("x"),
        equality(
          binaryOperation("+", termVariable("x"), constant("0")),
          termVariable("x"),
        ),
      );
      expect(formatFormulaLaTeX(f)).toBe("\\forall x . x + 0 = x");
    });
  });
});

// ── 項フォーマット ────────────────────────────────────────────

describe("formatTermLaTeX", () => {
  it("項変数", () => {
    expect(formatTermLaTeX(termVariable("x"))).toBe("x");
  });

  it("項メタ変数（添字なし）", () => {
    expect(formatTermLaTeX(termMetaVariable("τ"))).toBe("\\tau");
  });

  it("項メタ変数（添字あり）", () => {
    expect(formatTermLaTeX(termMetaVariable("σ", "1"))).toBe("\\sigma_{1}");
  });

  it("定数", () => {
    expect(formatTermLaTeX(constant("0"))).toBe("0");
  });

  it("関数適用（単項）", () => {
    expect(formatTermLaTeX(functionApplication("f", [termVariable("x")]))).toBe(
      "f\\left(x\\right)",
    );
  });

  it("関数適用（二項）", () => {
    expect(
      formatTermLaTeX(
        functionApplication("g", [termVariable("x"), termVariable("y")]),
      ),
    ).toBe("g\\left(x, y\\right)");
  });

  it("関数適用（引数なし）", () => {
    expect(formatTermLaTeX(functionApplication("c", []))).toBe(
      "c\\left(\\right)",
    );
  });

  describe("二項演算", () => {
    it("加算", () => {
      expect(
        formatTermLaTeX(
          binaryOperation("+", termVariable("x"), termVariable("y")),
        ),
      ).toBe("x + y");
    });

    it("減算", () => {
      expect(
        formatTermLaTeX(
          binaryOperation("-", termVariable("x"), termVariable("y")),
        ),
      ).toBe("x - y");
    });

    it("乗算", () => {
      expect(
        formatTermLaTeX(
          binaryOperation("*", termVariable("x"), termVariable("y")),
        ),
      ).toBe("x \\times y");
    });

    it("除算", () => {
      expect(
        formatTermLaTeX(
          binaryOperation("/", termVariable("x"), termVariable("y")),
        ),
      ).toBe("x \\div y");
    });

    it("べき乗", () => {
      expect(
        formatTermLaTeX(
          binaryOperation("^", termVariable("x"), termVariable("y")),
        ),
      ).toBe("x^{y}");
    });
  });

  describe("項の優先順位と括弧", () => {
    it("+ の中に * がある場合（括弧不要）", () => {
      expect(
        formatTermLaTeX(
          binaryOperation(
            "+",
            binaryOperation("*", termVariable("x"), termVariable("y")),
            termVariable("z"),
          ),
        ),
      ).toBe("x \\times y + z");
    });

    it("* の中に + がある場合（括弧が必要）", () => {
      expect(
        formatTermLaTeX(
          binaryOperation(
            "*",
            binaryOperation("+", termVariable("x"), termVariable("y")),
            termVariable("z"),
          ),
        ),
      ).toBe("\\left(x + y\\right) \\times z");
    });

    it("^ の右に ^ がある場合（右結合：x^{y^{z}}）", () => {
      expect(
        formatTermLaTeX(
          binaryOperation(
            "^",
            termVariable("x"),
            binaryOperation("^", termVariable("y"), termVariable("z")),
          ),
        ),
      ).toBe("x^{y^{z}}");
    });

    it("^ の左に ^ がある場合（括弧が必要）", () => {
      expect(
        formatTermLaTeX(
          binaryOperation(
            "^",
            binaryOperation("^", termVariable("x"), termVariable("y")),
            termVariable("z"),
          ),
        ),
      ).toBe("\\left(x^{y}\\right)^{z}");
    });

    it("+ は左結合（左に + は括弧不要）", () => {
      expect(
        formatTermLaTeX(
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
        formatTermLaTeX(
          binaryOperation(
            "+",
            termVariable("x"),
            binaryOperation("+", termVariable("y"), termVariable("z")),
          ),
        ),
      ).toBe("x + \\left(y + z\\right)");
    });

    it("ネストした関数適用", () => {
      expect(
        formatTermLaTeX(
          functionApplication("f", [
            termVariable("x"),
            functionApplication("g", [termVariable("y")]),
          ]),
        ),
      ).toBe("f\\left(x, g\\left(y\\right)\\right)");
    });

    it("べき乗の底が複合式", () => {
      expect(
        formatTermLaTeX(
          binaryOperation(
            "^",
            binaryOperation("+", termVariable("x"), termVariable("y")),
            constant("2"),
          ),
        ),
      ).toBe("\\left(x + y\\right)^{2}");
    });
  });
});
