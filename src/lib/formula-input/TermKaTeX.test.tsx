import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  binaryOperation,
  constant,
  functionApplication,
  termMetaVariable,
  termVariable,
} from "../logic-core/term";
import { TermKaTeX } from "./TermKaTeX";

describe("TermKaTeX", () => {
  describe("基本的なレンダリング", () => {
    it("変数 x を KaTeX でレンダリングする", () => {
      render(<TermKaTeX term={termVariable("x")} testId="katex" />);
      const el = screen.getByTestId("katex");
      expect(el).toBeInTheDocument();
      expect(el).toHaveAttribute("role", "math");
      expect(el).toHaveAttribute("aria-label", "x");
    });

    it("KaTeX の .katex クラスが出力に含まれる", () => {
      render(<TermKaTeX term={termVariable("x")} testId="katex" />);
      const el = screen.getByTestId("katex");
      expect(el.querySelector(".katex")).not.toBeNull();
    });

    it("メタ変数 τ を KaTeX でレンダリングする", () => {
      render(<TermKaTeX term={termMetaVariable("τ")} testId="katex" />);
      const el = screen.getByTestId("katex");
      expect(el).toHaveAttribute("aria-label", "\\tau");
    });

    it("添字付きメタ変数 σ₁ を KaTeX でレンダリングする", () => {
      render(<TermKaTeX term={termMetaVariable("σ", "1")} testId="katex" />);
      const el = screen.getByTestId("katex");
      expect(el).toHaveAttribute("aria-label", "\\sigma_{1}");
    });

    it("定数 0 をレンダリングする", () => {
      render(<TermKaTeX term={constant("0")} testId="katex" />);
      const el = screen.getByTestId("katex");
      expect(el).toHaveAttribute("aria-label", "0");
    });

    it("関数適用 f(x) をレンダリングする", () => {
      render(
        <TermKaTeX
          term={functionApplication("f", [termVariable("x")])}
          testId="katex"
        />,
      );
      const el = screen.getByTestId("katex");
      expect(el).toHaveAttribute("aria-label", "f\\left(x\\right)");
    });

    it("複数引数の関数適用 g(x, y) をレンダリングする", () => {
      render(
        <TermKaTeX
          term={functionApplication("g", [
            termVariable("x"),
            termVariable("y"),
          ])}
          testId="katex"
        />,
      );
      const el = screen.getByTestId("katex");
      expect(el).toHaveAttribute("aria-label", "g\\left(x, y\\right)");
    });
  });

  describe("二項演算子", () => {
    it("加算 x + y をレンダリングする", () => {
      render(
        <TermKaTeX
          term={binaryOperation("+", termVariable("x"), termVariable("y"))}
          testId="katex"
        />,
      );
      const el = screen.getByTestId("katex");
      expect(el).toHaveAttribute("aria-label", "x + y");
    });

    it("減算 x - y をレンダリングする", () => {
      render(
        <TermKaTeX
          term={binaryOperation("-", termVariable("x"), termVariable("y"))}
          testId="katex"
        />,
      );
      const el = screen.getByTestId("katex");
      expect(el).toHaveAttribute("aria-label", "x - y");
    });

    it("乗算 x \\times y をレンダリングする", () => {
      render(
        <TermKaTeX
          term={binaryOperation("*", termVariable("x"), termVariable("y"))}
          testId="katex"
        />,
      );
      const el = screen.getByTestId("katex");
      expect(el).toHaveAttribute("aria-label", "x \\times y");
    });

    it("除算 x \\div y をレンダリングする", () => {
      render(
        <TermKaTeX
          term={binaryOperation("/", termVariable("x"), termVariable("y"))}
          testId="katex"
        />,
      );
      const el = screen.getByTestId("katex");
      expect(el).toHaveAttribute("aria-label", "x \\div y");
    });

    it("べき乗 x ^ y をレンダリングする", () => {
      render(
        <TermKaTeX
          term={binaryOperation("^", termVariable("x"), termVariable("y"))}
          testId="katex"
        />,
      );
      const el = screen.getByTestId("katex");
      expect(el).toHaveAttribute("aria-label", "x^{y}");
    });
  });

  describe("表示モード", () => {
    it("デフォルトはインラインモード", () => {
      render(<TermKaTeX term={termVariable("x")} testId="katex" />);
      const el = screen.getByTestId("katex");
      expect(el.querySelector(".katex-display")).toBeNull();
    });

    it("displayMode=true でブロックモードになる", () => {
      render(
        <TermKaTeX
          term={termVariable("x")}
          displayMode={true}
          testId="katex"
        />,
      );
      const el = screen.getByTestId("katex");
      expect(el.querySelector(".katex-display")).not.toBeNull();
    });
  });

  describe("複合式", () => {
    it("ネストした二項演算をレンダリングする", () => {
      render(
        <TermKaTeX
          term={binaryOperation(
            "*",
            binaryOperation("+", termVariable("x"), termVariable("y")),
            termVariable("z"),
          )}
          testId="katex"
        />,
      );
      const el = screen.getByTestId("katex");
      expect(el.querySelector(".katex")).not.toBeNull();
    });

    it("関数適用と二項演算の組合せをレンダリングする", () => {
      render(
        <TermKaTeX
          term={binaryOperation(
            "+",
            functionApplication("f", [termVariable("x")]),
            functionApplication("g", [termVariable("y")]),
          )}
          testId="katex"
        />,
      );
      const el = screen.getByTestId("katex");
      expect(el.querySelector(".katex")).not.toBeNull();
    });
  });

  describe("スタイルprops", () => {
    it("fontSize を適用する", () => {
      render(
        <TermKaTeX term={termVariable("x")} fontSize={24} testId="katex" />,
      );
      const el = screen.getByTestId("katex");
      expect(el.style.fontSize).toBe("24px");
    });

    it("className を適用する", () => {
      render(
        <TermKaTeX
          term={termVariable("x")}
          className="custom-class"
          testId="katex"
        />,
      );
      const el = screen.getByTestId("katex");
      expect(el).toHaveClass("custom-class");
    });

    it("追加 style を適用する", () => {
      render(
        <TermKaTeX
          term={termVariable("x")}
          style={{ letterSpacing: 2 }}
          testId="katex"
        />,
      );
      const el = screen.getByTestId("katex");
      expect(el.style.letterSpacing).toBe("2px");
    });
  });
});
