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
import { TermKaTeX } from "./TermKaTeX";

const meta = {
  title: "FormulaInput/TermKaTeX",
  component: TermKaTeX,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof TermKaTeX>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── ストーリー ───────────────────────────────────────────

/**
 * 基本的な項の KaTeX レンダリング。
 */
export const BasicTerms: Story = {
  args: {
    term: termVariable("x"),
    testId: "katex-display",
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
                color: "#666",
                minWidth: 140,
              }}
            >
              {label}
            </span>
            <TermKaTeX term={term} testId={`katex-${label satisfies string}`} />
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const label of ["変数", "定数", "メタ変数", "添字付きメタ変数"]) {
      const el = canvas.getByTestId(`katex-${label satisfies string}`);
      await expect(el.querySelector(".katex")).not.toBeNull();
      await expect(el).toHaveAttribute("role", "math");
    }
  },
};

/**
 * 関数適用の KaTeX レンダリング。
 */
export const FunctionApplications: Story = {
  args: {
    term: functionApplication("f", [termVariable("x")]),
    testId: "katex-display",
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
                color: "#666",
                minWidth: 100,
              }}
            >
              {label}
            </span>
            <TermKaTeX term={term} testId={`katex-${label satisfies string}`} />
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const label of ["単項関数", "二項関数", "引数なし", "ネスト"]) {
      const el = canvas.getByTestId(`katex-${label satisfies string}`);
      await expect(el.querySelector(".katex")).not.toBeNull();
    }
  },
};

/**
 * 二項演算子の KaTeX レンダリング。
 */
export const BinaryOperations: Story = {
  args: {
    term: binaryOperation("+", termVariable("x"), termVariable("y")),
    testId: "katex-display",
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
                color: "#666",
                minWidth: 80,
              }}
            >
              {label}
            </span>
            <TermKaTeX term={term} testId={`katex-${label satisfies string}`} />
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const label of ["加算", "減算", "乗算", "除算", "べき乗"]) {
      const el = canvas.getByTestId(`katex-${label satisfies string}`);
      await expect(el.querySelector(".katex")).not.toBeNull();
    }
  },
};

/**
 * 複合的な項の KaTeX レンダリング。
 */
export const ComplexTerms: Story = {
  args: {
    term: termVariable("x"),
    testId: "katex-display",
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
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {terms.map(({ label, term }) => (
          <div key={label}>
            <div
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 11,
                color: "#666",
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {label}
            </div>
            <TermKaTeX term={term} testId={`katex-${label satisfies string}`} />
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const label of ["(x + y) × z", "f(x) + g(y)"]) {
      const el = canvas.getByTestId(`katex-${label satisfies string}`);
      await expect(el.querySelector(".katex")).not.toBeNull();
    }
  },
};

/**
 * インラインモードとブロックモードの比較。
 */
export const DisplayModes: Story = {
  args: {
    term: termVariable("x"),
    testId: "katex-display",
  },
  render: () => {
    const term = binaryOperation(
      "+",
      functionApplication("f", [termVariable("x")]),
      constant("0"),
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <div
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: 11,
              color: "#666",
              marginBottom: 4,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Inline Mode (default)
          </div>
          <div>
            Text before <TermKaTeX term={term} testId="katex-inline" /> text
            after
          </div>
        </div>
        <div>
          <div
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: 11,
              color: "#666",
              marginBottom: 4,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Block (Display) Mode
          </div>
          <TermKaTeX term={term} displayMode={true} testId="katex-block" />
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const inlineEl = canvas.getByTestId("katex-inline");
    await expect(inlineEl.querySelector(".katex")).not.toBeNull();
    await expect(inlineEl.querySelector(".katex-display")).toBeNull();

    const blockEl = canvas.getByTestId("katex-block");
    await expect(blockEl.querySelector(".katex")).not.toBeNull();
    await expect(blockEl.querySelector(".katex-display")).not.toBeNull();
  },
};

/**
 * フォントサイズのカスタマイズ。
 */
export const CustomSizing: Story = {
  args: {
    term: termVariable("x"),
    testId: "katex-display",
  },
  render: () => {
    const term = binaryOperation(
      "+",
      functionApplication("f", [termVariable("x")]),
      constant("0"),
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <TermKaTeX term={term} fontSize={14} testId="katex-small" />
        <TermKaTeX term={term} fontSize={24} testId="katex-medium" />
        <TermKaTeX term={term} fontSize={36} testId="katex-large" />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const small = canvas.getByTestId("katex-small");
    await expect(small.style.fontSize).toBe("14px");

    const medium = canvas.getByTestId("katex-medium");
    await expect(medium.style.fontSize).toBe("24px");

    const large = canvas.getByTestId("katex-large");
    await expect(large.style.fontSize).toBe("36px");
  },
};
