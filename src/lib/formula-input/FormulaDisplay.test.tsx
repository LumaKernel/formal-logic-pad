import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  biconditional,
  conjunction,
  disjunction,
  equality,
  existential,
  implication,
  metaVariable,
  negation,
  predicate,
  universal,
} from "../logic-core/formula";
import {
  binaryOperation,
  constant,
  functionApplication,
  termVariable,
} from "../logic-core/term";
import { FormulaDisplay } from "./FormulaDisplay";

describe("FormulaDisplay", () => {
  describe("基本的なレンダリング", () => {
    it("メタ変数 φ を表示する", () => {
      render(<FormulaDisplay formula={metaVariable("φ")} testId="formula" />);
      const el = screen.getByTestId("formula");
      expect(el).toHaveTextContent("φ");
      expect(el).toHaveAttribute("role", "math");
      expect(el).toHaveAttribute("aria-label", "φ");
    });

    it("添字付きメタ変数 φ₁ を表示する", () => {
      render(
        <FormulaDisplay formula={metaVariable("φ", "1")} testId="formula" />,
      );
      expect(screen.getByTestId("formula")).toHaveTextContent("φ₁");
    });

    it("否定 ¬φ を表示する", () => {
      render(
        <FormulaDisplay
          formula={negation(metaVariable("φ"))}
          testId="formula"
        />,
      );
      expect(screen.getByTestId("formula")).toHaveTextContent("¬φ");
    });

    it("含意 φ → ψ を表示する", () => {
      render(
        <FormulaDisplay
          formula={implication(metaVariable("φ"), metaVariable("ψ"))}
          testId="formula"
        />,
      );
      expect(screen.getByTestId("formula")).toHaveTextContent("φ → ψ");
    });

    it("連言 φ ∧ ψ を表示する", () => {
      render(
        <FormulaDisplay
          formula={conjunction(metaVariable("φ"), metaVariable("ψ"))}
          testId="formula"
        />,
      );
      expect(screen.getByTestId("formula")).toHaveTextContent("φ ∧ ψ");
    });

    it("選言 φ ∨ ψ を表示する", () => {
      render(
        <FormulaDisplay
          formula={disjunction(metaVariable("φ"), metaVariable("ψ"))}
          testId="formula"
        />,
      );
      expect(screen.getByTestId("formula")).toHaveTextContent("φ ∨ ψ");
    });

    it("双条件 φ ↔ ψ を表示する", () => {
      render(
        <FormulaDisplay
          formula={biconditional(metaVariable("φ"), metaVariable("ψ"))}
          testId="formula"
        />,
      );
      expect(screen.getByTestId("formula")).toHaveTextContent("φ ↔ ψ");
    });

    it("全称量化 ∀x.φ を表示する", () => {
      render(
        <FormulaDisplay
          formula={universal(termVariable("x"), metaVariable("φ"))}
          testId="formula"
        />,
      );
      expect(screen.getByTestId("formula")).toHaveTextContent("∀x.φ");
    });

    it("存在量化 ∃x.φ を表示する", () => {
      render(
        <FormulaDisplay
          formula={existential(termVariable("x"), metaVariable("φ"))}
          testId="formula"
        />,
      );
      expect(screen.getByTestId("formula")).toHaveTextContent("∃x.φ");
    });

    it("述語 P(x, y) を表示する", () => {
      render(
        <FormulaDisplay
          formula={predicate("P", [termVariable("x"), termVariable("y")])}
          testId="formula"
        />,
      );
      expect(screen.getByTestId("formula")).toHaveTextContent("P(x, y)");
    });

    it("等号 x = y を表示する", () => {
      render(
        <FormulaDisplay
          formula={equality(termVariable("x"), termVariable("y"))}
          testId="formula"
        />,
      );
      expect(screen.getByTestId("formula")).toHaveTextContent("x = y");
    });
  });

  describe("複合式", () => {
    it("φ → φ（I combinator）を表示する", () => {
      const phi = metaVariable("φ");
      render(
        <FormulaDisplay formula={implication(phi, phi)} testId="formula" />,
      );
      expect(screen.getByTestId("formula")).toHaveTextContent("φ → φ");
    });

    it("∀ζ.P(ζ) ∧ ∃ξ.Q(ξ) を表示する", () => {
      const formula = conjunction(
        universal(termVariable("ζ"), predicate("P", [termVariable("ζ")])),
        existential(termVariable("ξ"), predicate("Q", [termVariable("ξ")])),
      );
      render(<FormulaDisplay formula={formula} testId="formula" />);
      expect(screen.getByTestId("formula")).toHaveTextContent(
        "(∀ζ.P(ζ)) ∧ (∃ξ.Q(ξ))",
      );
    });

    it("等号と二項演算: f(x) + g(y) = h(z) を表示する", () => {
      const formula = equality(
        binaryOperation(
          "+",
          functionApplication("f", [termVariable("x")]),
          functionApplication("g", [termVariable("y")]),
        ),
        functionApplication("h", [termVariable("z")]),
      );
      render(<FormulaDisplay formula={formula} testId="formula" />);
      expect(screen.getByTestId("formula")).toHaveTextContent(
        "f(x) + g(y) = h(z)",
      );
    });

    it("∀x. x + 0 = x を表示する", () => {
      const formula = universal(
        termVariable("x"),
        equality(
          binaryOperation("+", termVariable("x"), constant("0")),
          termVariable("x"),
        ),
      );
      render(<FormulaDisplay formula={formula} testId="formula" />);
      expect(screen.getByTestId("formula")).toHaveTextContent("∀x.x + 0 = x");
    });
  });

  describe("スタイルprops", () => {
    it("fontSize を適用する", () => {
      render(
        <FormulaDisplay
          formula={metaVariable("φ")}
          fontSize={24}
          testId="formula"
        />,
      );
      const el = screen.getByTestId("formula");
      expect(el.style.fontSize).toBe("24px");
    });

    it("color を適用する", () => {
      render(
        <FormulaDisplay
          formula={metaVariable("φ")}
          color="red"
          testId="formula"
        />,
      );
      const el = screen.getByTestId("formula");
      expect(el.style.color).toBe("red");
    });

    it("className を適用する", () => {
      render(
        <FormulaDisplay
          formula={metaVariable("φ")}
          className="custom-class"
          testId="formula"
        />,
      );
      const el = screen.getByTestId("formula");
      expect(el).toHaveClass("custom-class");
    });

    it("追加 style を適用する", () => {
      render(
        <FormulaDisplay
          formula={metaVariable("φ")}
          style={{ letterSpacing: 2 }}
          testId="formula"
        />,
      );
      const el = screen.getByTestId("formula");
      expect(el.style.letterSpacing).toBe("2px");
    });

    it("デフォルトスタイルが適用される", () => {
      render(<FormulaDisplay formula={metaVariable("φ")} testId="formula" />);
      const el = screen.getByTestId("formula");
      expect(el.style.fontFamily).toBe("var(--font-formula)");
      expect(el.style.fontStyle).toBe("italic");
      expect(el.style.whiteSpace).toBe("nowrap");
    });
  });

  describe("シンタックスハイライト", () => {
    it("highlight=false（デフォルト）ではプレーンテキスト", () => {
      render(
        <FormulaDisplay
          formula={implication(metaVariable("φ"), metaVariable("ψ"))}
          testId="formula"
        />,
      );
      const el = screen.getByTestId("formula");
      // 子要素がないプレーンテキスト
      expect(el.children).toHaveLength(0);
      expect(el).toHaveTextContent("φ → ψ");
    });

    it("highlight=true では各トークンが<span>でラップされる", () => {
      render(
        <FormulaDisplay
          formula={implication(metaVariable("φ"), metaVariable("ψ"))}
          highlight
          testId="formula"
        />,
      );
      const el = screen.getByTestId("formula");
      // φ, " ", →, " ", ψ の5トークン → 5つの子span
      expect(el.children).toHaveLength(5);
      // テキスト全体は同じ
      expect(el).toHaveTextContent("φ → ψ");
      expect(el).toHaveAttribute("aria-label", "φ → ψ");
    });

    it("highlight=true のトークンに色CSS変数が設定される", () => {
      render(
        <FormulaDisplay
          formula={implication(metaVariable("φ"), metaVariable("ψ"))}
          highlight
          testId="formula"
        />,
      );
      const el = screen.getByTestId("formula");
      const children = Array.from(el.children) as HTMLSpanElement[];
      // φ = metaVariable → --color-syntax-metaVariable
      expect(children[0]?.style.color).toBe("var(--color-syntax-metaVariable)");
      // → = connective → --color-syntax-connective
      expect(children[2]?.style.color).toBe("var(--color-syntax-connective)");
      // ψ = metaVariable
      expect(children[4]?.style.color).toBe("var(--color-syntax-metaVariable)");
    });

    it("複合式 (φ → ψ) ∧ χ のハイライトが正しい", () => {
      render(
        <FormulaDisplay
          formula={conjunction(
            implication(metaVariable("φ"), metaVariable("ψ")),
            metaVariable("χ"),
          )}
          highlight
          testId="formula"
        />,
      );
      const el = screen.getByTestId("formula");
      expect(el).toHaveTextContent("(φ → ψ) ∧ χ");
      // 括弧 punctuation の色確認
      const children = Array.from(el.children) as HTMLSpanElement[];
      expect(children[0]?.textContent).toBe("(");
      expect(children[0]?.style.color).toBe("var(--color-syntax-punctuation)");
    });

    it("量化子のハイライト", () => {
      render(
        <FormulaDisplay
          formula={universal(termVariable("x"), metaVariable("φ"))}
          highlight
          testId="formula"
        />,
      );
      const el = screen.getByTestId("formula");
      const children = Array.from(el.children) as HTMLSpanElement[];
      // ∀ = quantifier
      expect(children[0]?.textContent).toBe("∀");
      expect(children[0]?.style.color).toBe("var(--color-syntax-quantifier)");
      // x = variable
      expect(children[1]?.textContent).toBe("x");
      expect(children[1]?.style.color).toBe("var(--color-syntax-variable)");
    });

    it("否定のハイライト", () => {
      render(
        <FormulaDisplay
          formula={negation(metaVariable("φ"))}
          highlight
          testId="formula"
        />,
      );
      const el = screen.getByTestId("formula");
      const children = Array.from(el.children) as HTMLSpanElement[];
      expect(children[0]?.textContent).toBe("¬");
      expect(children[0]?.style.color).toBe("var(--color-syntax-negation)");
    });

    it("等号のハイライト", () => {
      render(
        <FormulaDisplay
          formula={equality(termVariable("x"), termVariable("y"))}
          highlight
          testId="formula"
        />,
      );
      const el = screen.getByTestId("formula");
      const children = Array.from(el.children) as HTMLSpanElement[];
      const eqToken = children.find((c) => c.textContent === "=");
      expect(eqToken?.style.color).toBe("var(--color-syntax-equality)");
    });

    it("述語のハイライト", () => {
      render(
        <FormulaDisplay
          formula={predicate("P", [termVariable("x")])}
          highlight
          testId="formula"
        />,
      );
      const el = screen.getByTestId("formula");
      const children = Array.from(el.children) as HTMLSpanElement[];
      expect(children[0]?.textContent).toBe("P");
      expect(children[0]?.style.color).toBe("var(--color-syntax-predicate)");
    });
  });
});
