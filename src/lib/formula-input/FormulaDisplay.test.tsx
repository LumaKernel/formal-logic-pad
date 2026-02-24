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
      expect(el.style.fontFamily).toContain("serif");
      expect(el.style.fontStyle).toBe("italic");
      expect(el.style.whiteSpace).toBe("nowrap");
    });
  });
});
