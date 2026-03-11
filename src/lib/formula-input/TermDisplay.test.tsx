import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  binaryOperation,
  constant,
  functionApplication,
  termMetaVariable,
  termVariable,
} from "../logic-core/term";
import { TermDisplay } from "./TermDisplay";

describe("TermDisplay", () => {
  describe("基本的なレンダリング", () => {
    it("変数 x を表示する", () => {
      render(<TermDisplay term={termVariable("x")} testId="term" />);
      const el = screen.getByTestId("term");
      expect(el).toHaveTextContent("x");
      expect(el).toHaveAttribute("role", "math");
      expect(el).toHaveAttribute("aria-label", "x");
    });

    it("メタ変数 τ を表示する", () => {
      render(<TermDisplay term={termMetaVariable("τ")} testId="term" />);
      expect(screen.getByTestId("term")).toHaveTextContent("τ");
    });

    it("添字付きメタ変数 σ₁ を表示する", () => {
      render(<TermDisplay term={termMetaVariable("σ", "1")} testId="term" />);
      expect(screen.getByTestId("term")).toHaveTextContent("σ₁");
    });

    it("定数 0 を表示する", () => {
      render(<TermDisplay term={constant("0")} testId="term" />);
      expect(screen.getByTestId("term")).toHaveTextContent("0");
    });

    it("関数適用 f(x) を表示する", () => {
      render(
        <TermDisplay
          term={functionApplication("f", [termVariable("x")])}
          testId="term"
        />,
      );
      expect(screen.getByTestId("term")).toHaveTextContent("f(x)");
    });

    it("複数引数の関数適用 g(x, y) を表示する", () => {
      render(
        <TermDisplay
          term={functionApplication("g", [
            termVariable("x"),
            termVariable("y"),
          ])}
          testId="term"
        />,
      );
      expect(screen.getByTestId("term")).toHaveTextContent("g(x, y)");
    });

    it("引数なしの関数適用 c() を表示する", () => {
      render(<TermDisplay term={functionApplication("c", [])} testId="term" />);
      expect(screen.getByTestId("term")).toHaveTextContent("c()");
    });
  });

  describe("二項演算子", () => {
    it("加算 x + y を表示する", () => {
      render(
        <TermDisplay
          term={binaryOperation("+", termVariable("x"), termVariable("y"))}
          testId="term"
        />,
      );
      expect(screen.getByTestId("term")).toHaveTextContent("x + y");
    });

    it("減算 x − y を表示する", () => {
      render(
        <TermDisplay
          term={binaryOperation("-", termVariable("x"), termVariable("y"))}
          testId="term"
        />,
      );
      expect(screen.getByTestId("term")).toHaveTextContent("x − y");
    });

    it("乗算 x × y を表示する", () => {
      render(
        <TermDisplay
          term={binaryOperation("*", termVariable("x"), termVariable("y"))}
          testId="term"
        />,
      );
      expect(screen.getByTestId("term")).toHaveTextContent("x × y");
    });

    it("除算 x ÷ y を表示する", () => {
      render(
        <TermDisplay
          term={binaryOperation("/", termVariable("x"), termVariable("y"))}
          testId="term"
        />,
      );
      expect(screen.getByTestId("term")).toHaveTextContent("x ÷ y");
    });

    it("べき乗 x ^ y を表示する", () => {
      render(
        <TermDisplay
          term={binaryOperation("^", termVariable("x"), termVariable("y"))}
          testId="term"
        />,
      );
      expect(screen.getByTestId("term")).toHaveTextContent("x ^ y");
    });
  });

  describe("複合式", () => {
    it("ネストした二項演算 (x + y) * z を表示する", () => {
      render(
        <TermDisplay
          term={binaryOperation(
            "*",
            binaryOperation("+", termVariable("x"), termVariable("y")),
            termVariable("z"),
          )}
          testId="term"
        />,
      );
      expect(screen.getByTestId("term")).toHaveTextContent("(x + y) × z");
    });

    it("関数適用と二項演算の組合せ f(x) + g(y) を表示する", () => {
      render(
        <TermDisplay
          term={binaryOperation(
            "+",
            functionApplication("f", [termVariable("x")]),
            functionApplication("g", [termVariable("y")]),
          )}
          testId="term"
        />,
      );
      expect(screen.getByTestId("term")).toHaveTextContent("f(x) + g(y)");
    });
  });

  describe("スタイルprops", () => {
    it("fontSize を適用する", () => {
      render(
        <TermDisplay term={termVariable("x")} fontSize={24} testId="term" />,
      );
      const el = screen.getByTestId("term");
      expect(el.style.fontSize).toBe("24px");
    });

    it("color を適用する", () => {
      render(
        <TermDisplay term={termVariable("x")} color="red" testId="term" />,
      );
      const el = screen.getByTestId("term");
      expect(el.style.color).toBe("red");
    });

    it("className を適用する", () => {
      render(
        <TermDisplay
          term={termVariable("x")}
          className="custom-class"
          testId="term"
        />,
      );
      const el = screen.getByTestId("term");
      expect(el).toHaveClass("custom-class");
    });

    it("追加 style を適用する", () => {
      render(
        <TermDisplay
          term={termVariable("x")}
          style={{ letterSpacing: 2 }}
          testId="term"
        />,
      );
      const el = screen.getByTestId("term");
      expect(el.style.letterSpacing).toBe("2px");
    });

    it("デフォルトスタイルが適用される", () => {
      render(<TermDisplay term={termVariable("x")} testId="term" />);
      const el = screen.getByTestId("term");
      expect(el.style.fontFamily).toBe("var(--font-formula)");
      expect(el.style.fontStyle).toBe("italic");
      expect(el.style.whiteSpace).toBe("nowrap");
    });
  });

  describe("シンタックスハイライト", () => {
    it("highlight=false（デフォルト）ではプレーンテキスト", () => {
      render(
        <TermDisplay
          term={binaryOperation("+", termVariable("x"), termVariable("y"))}
          testId="term"
        />,
      );
      const el = screen.getByTestId("term");
      expect(el.children).toHaveLength(0);
      expect(el).toHaveTextContent("x + y");
    });

    it("highlight=true では各トークンが<span>でラップされる", () => {
      render(
        <TermDisplay
          term={binaryOperation("+", termVariable("x"), termVariable("y"))}
          highlight
          testId="term"
        />,
      );
      const el = screen.getByTestId("term");
      // x, " ", +, " ", y の5トークン → 5つの子span
      expect(el.children).toHaveLength(5);
      expect(el).toHaveTextContent("x + y");
    });

    it("変数に色CSS変数が設定される", () => {
      render(<TermDisplay term={termVariable("x")} highlight testId="term" />);
      const el = screen.getByTestId("term");
      const children = Array.from(el.children) as HTMLSpanElement[];
      expect(children[0]?.style.color).toBe("var(--color-syntax-variable)");
    });

    it("定数に色CSS変数が設定される", () => {
      render(<TermDisplay term={constant("0")} highlight testId="term" />);
      const el = screen.getByTestId("term");
      const children = Array.from(el.children) as HTMLSpanElement[];
      expect(children[0]?.style.color).toBe("var(--color-syntax-constant)");
    });

    it("関数名に色CSS変数が設定される", () => {
      render(
        <TermDisplay
          term={functionApplication("f", [termVariable("x")])}
          highlight
          testId="term"
        />,
      );
      const el = screen.getByTestId("term");
      const children = Array.from(el.children) as HTMLSpanElement[];
      expect(children[0]?.textContent).toBe("f");
      expect(children[0]?.style.color).toBe("var(--color-syntax-function)");
    });
  });
});
