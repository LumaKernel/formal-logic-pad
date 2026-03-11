import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import type { Term } from "../logic-core/term";
import {
  binaryOperation,
  constant,
  functionApplication,
  termMetaVariable,
  termVariable,
} from "../logic-core/term";
import { TermDisplay } from "./TermDisplay";

const meta = {
  title: "FormulaInput/TermDisplay",
  component: TermDisplay,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof TermDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── ストーリー ───────────────────────────────────────────

/**
 * 基本的な項の表示。変数、定数、メタ変数。
 */
export const BasicTerms: Story = {
  args: {
    term: termVariable("x"),
    testId: "term-display",
  },
  render: () => {
    const terms: readonly {
      readonly label: string;
      readonly term: Term;
    }[] = [
      { label: "変数", term: termVariable("x") },
      { label: "定数", term: constant("0") },
      { label: "メタ変数", term: termMetaVariable("τ") },
      { label: "添字付きメタ変数", term: termMetaVariable("σ", "1") },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {terms.map(({ label, term }) => (
          <div
            key={label}
            style={{ display: "flex", alignItems: "center", gap: 16 }}
          >
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 12,
                color: "#888",
                minWidth: 140,
              }}
            >
              {label}
            </span>
            <TermDisplay
              term={term}
              fontSize={18}
              testId={`term-${label satisfies string}`}
            />
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("term-変数")).toHaveTextContent("x");
    await expect(canvas.getByTestId("term-定数")).toHaveTextContent("0");
    await expect(canvas.getByTestId("term-メタ変数")).toHaveTextContent("τ");
    await expect(canvas.getByTestId("term-添字付きメタ変数")).toHaveTextContent(
      "σ₁",
    );
  },
};

/**
 * 関数適用の表示。
 */
export const FunctionApplications: Story = {
  args: {
    term: functionApplication("f", [termVariable("x")]),
    testId: "term-display",
  },
  render: () => {
    const terms: readonly {
      readonly label: string;
      readonly term: Term;
    }[] = [
      {
        label: "単項関数",
        term: functionApplication("f", [termVariable("x")]),
      },
      {
        label: "二項関数",
        term: functionApplication("g", [termVariable("x"), termVariable("y")]),
      },
      { label: "引数なし", term: functionApplication("c", []) },
      {
        label: "ネスト",
        term: functionApplication("f", [
          functionApplication("g", [termVariable("x")]),
        ]),
      },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {terms.map(({ label, term }) => (
          <div
            key={label}
            style={{ display: "flex", alignItems: "center", gap: 16 }}
          >
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 12,
                color: "#888",
                minWidth: 100,
              }}
            >
              {label}
            </span>
            <TermDisplay
              term={term}
              fontSize={18}
              testId={`term-${label satisfies string}`}
            />
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("term-単項関数")).toHaveTextContent("f(x)");
    await expect(canvas.getByTestId("term-二項関数")).toHaveTextContent(
      "g(x, y)",
    );
    await expect(canvas.getByTestId("term-引数なし")).toHaveTextContent("c()");
    await expect(canvas.getByTestId("term-ネスト")).toHaveTextContent(
      "f(g(x))",
    );
  },
};

/**
 * 二項演算子の表示。
 */
export const BinaryOperations: Story = {
  args: {
    term: binaryOperation("+", termVariable("x"), termVariable("y")),
    testId: "term-display",
  },
  render: () => {
    const terms: readonly {
      readonly label: string;
      readonly term: Term;
    }[] = [
      {
        label: "加算",
        term: binaryOperation("+", termVariable("x"), termVariable("y")),
      },
      {
        label: "減算",
        term: binaryOperation("-", termVariable("x"), termVariable("y")),
      },
      {
        label: "乗算",
        term: binaryOperation("*", termVariable("x"), termVariable("y")),
      },
      {
        label: "除算",
        term: binaryOperation("/", termVariable("x"), termVariable("y")),
      },
      {
        label: "べき乗",
        term: binaryOperation("^", termVariable("x"), termVariable("y")),
      },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {terms.map(({ label, term }) => (
          <div
            key={label}
            style={{ display: "flex", alignItems: "center", gap: 16 }}
          >
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 12,
                color: "#888",
                minWidth: 80,
              }}
            >
              {label}
            </span>
            <TermDisplay
              term={term}
              fontSize={18}
              testId={`term-${label satisfies string}`}
            />
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("term-加算")).toHaveTextContent("x + y");
    await expect(canvas.getByTestId("term-減算")).toHaveTextContent("x − y");
    await expect(canvas.getByTestId("term-乗算")).toHaveTextContent("x × y");
    await expect(canvas.getByTestId("term-除算")).toHaveTextContent("x ÷ y");
    await expect(canvas.getByTestId("term-べき乗")).toHaveTextContent("x ^ y");
  },
};

/**
 * 複合的な項の表示（ネスト・括弧）。
 */
export const ComplexTerms: Story = {
  args: {
    term: termVariable("x"),
    testId: "term-display",
  },
  render: () => {
    const terms: readonly {
      readonly label: string;
      readonly term: Term;
    }[] = [
      {
        label: "(x + y) × z",
        term: binaryOperation(
          "*",
          binaryOperation("+", termVariable("x"), termVariable("y")),
          termVariable("z"),
        ),
      },
      {
        label: "f(x) + g(y)",
        term: binaryOperation(
          "+",
          functionApplication("f", [termVariable("x")]),
          functionApplication("g", [termVariable("y")]),
        ),
      },
      {
        label: "x + y + z",
        term: binaryOperation(
          "+",
          binaryOperation("+", termVariable("x"), termVariable("y")),
          termVariable("z"),
        ),
      },
      {
        label: "x ^ y ^ z",
        term: binaryOperation(
          "^",
          termVariable("x"),
          binaryOperation("^", termVariable("y"), termVariable("z")),
        ),
      },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {terms.map(({ label, term }) => (
          <div key={label}>
            <div
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 11,
                color: "#888",
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {label}
            </div>
            <TermDisplay
              term={term}
              fontSize={20}
              testId={`term-${label satisfies string}`}
            />
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("term-(x + y) × z")).toHaveTextContent(
      "(x + y) × z",
    );
    await expect(canvas.getByTestId("term-f(x) + g(y)")).toHaveTextContent(
      "f(x) + g(y)",
    );
  },
};

/**
 * フォントサイズと色のカスタマイズ。
 */
export const CustomStyling: Story = {
  args: {
    term: termVariable("x"),
    testId: "term-display",
  },
  render: () => {
    const term = binaryOperation(
      "+",
      functionApplication("f", [termVariable("x")]),
      constant("0"),
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <TermDisplay
          term={term}
          fontSize={14}
          color="#666"
          highlight={false}
          testId="term-small"
        />
        <TermDisplay
          term={term}
          fontSize={24}
          color="#2c3e50"
          highlight={false}
          testId="term-medium"
        />
        <TermDisplay
          term={term}
          fontSize={36}
          color="#e74c3c"
          highlight={false}
          testId="term-large"
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const small = canvas.getByTestId("term-small");
    await expect(small).toHaveTextContent("f(x) + 0");
    await expect(small.style.fontSize).toBe("14px");

    const medium = canvas.getByTestId("term-medium");
    await expect(medium.style.fontSize).toBe("24px");

    const large = canvas.getByTestId("term-large");
    await expect(large.style.fontSize).toBe("36px");
    await expect(large.style.color).toBe("rgb(231, 76, 60)");
  },
};
