import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
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
import type { Formula } from "../logic-core/formula";
import {
  binaryOperation,
  constant,
  functionApplication,
  termVariable,
} from "../logic-core/term";
import { FormulaKaTeX } from "./FormulaKaTeX";

const meta = {
  title: "FormulaInput/FormulaKaTeX",
  component: FormulaKaTeX,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof FormulaKaTeX>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── ヘルパー: よく使う論理式パターン ──────────────────────

const phi = metaVariable("φ");
const psi = metaVariable("ψ");
const chi = metaVariable("χ");

// ── ストーリー ───────────────────────────────────────────

/**
 * 基本的なメタ変数の KaTeX レンダリング。
 */
export const BasicFormulas: Story = {
  args: {
    formula: phi,
    testId: "katex-display",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByTestId("katex-display");
    await expect(el).toBeInTheDocument();
    await expect(el).toHaveAttribute("role", "math");
    // KaTeX の .katex クラスが出力に含まれる
    await expect(el.querySelector(".katex")).not.toBeNull();
  },
};

/**
 * 添字付きメタ変数の KaTeX レンダリング。
 */
export const SubscriptedVariables: Story = {
  args: {
    formula: implication(metaVariable("φ", "1"), metaVariable("ψ", "02")),
    testId: "katex-display",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByTestId("katex-display");
    await expect(el.querySelector(".katex")).not.toBeNull();
    await expect(el).toHaveAttribute(
      "aria-label",
      "\\varphi_{1} \\to \\psi_{02}",
    );
  },
};

/**
 * 命題論理の各種結合子を KaTeX で表示。
 */
export const PropositionalConnectives: Story = {
  args: { formula: phi },
  render: () => {
    const formulas: readonly {
      readonly label: string;
      readonly formula: Formula;
    }[] = [
      { label: "含意", formula: implication(phi, psi) },
      { label: "連言", formula: conjunction(phi, psi) },
      { label: "選言", formula: disjunction(phi, psi) },
      { label: "双条件", formula: biconditional(phi, psi) },
      { label: "否定", formula: negation(phi) },
      { label: "二重否定", formula: negation(negation(phi)) },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {formulas.map(({ label, formula }) => (
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
            <FormulaKaTeX
              formula={formula}
              testId={`katex-${label satisfies string}`}
            />
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 各結合子が KaTeX でレンダリングされている
    for (const label of [
      "含意",
      "連言",
      "選言",
      "双条件",
      "否定",
      "二重否定",
    ]) {
      const el = canvas.getByTestId(`katex-${label satisfies string}`);
      await expect(el.querySelector(".katex")).not.toBeNull();
    }
  },
};

/**
 * 量化子の KaTeX レンダリング。
 */
export const Quantifiers: Story = {
  args: { formula: phi },
  render: () => {
    const formulas: readonly {
      readonly label: string;
      readonly formula: Formula;
    }[] = [
      {
        label: "全称",
        formula: universal(
          termVariable("x"),
          predicate("P", [termVariable("x")]),
        ),
      },
      {
        label: "存在",
        formula: existential(
          termVariable("x"),
          predicate("Q", [termVariable("x")]),
        ),
      },
      {
        label: "ネスト",
        formula: universal(
          termVariable("x"),
          existential(
            termVariable("y"),
            predicate("R", [termVariable("x"), termVariable("y")]),
          ),
        ),
      },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {formulas.map(({ label, formula }) => (
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
            <FormulaKaTeX
              formula={formula}
              testId={`katex-${label satisfies string}`}
            />
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const label of ["全称", "存在", "ネスト"]) {
      const el = canvas.getByTestId(`katex-${label satisfies string}`);
      await expect(el.querySelector(".katex")).not.toBeNull();
    }
  },
};

/**
 * 述語・等号・項演算の KaTeX レンダリング。
 */
export const PredicatesAndEquality: Story = {
  args: { formula: phi },
  render: () => {
    const formulas: readonly {
      readonly label: string;
      readonly formula: Formula;
    }[] = [
      {
        label: "述語",
        formula: predicate("P", [termVariable("x"), termVariable("y")]),
      },
      {
        label: "等号",
        formula: equality(termVariable("x"), termVariable("y")),
      },
      {
        label: "二項演算",
        formula: equality(
          binaryOperation("+", termVariable("x"), constant("0")),
          termVariable("x"),
        ),
      },
      {
        label: "関数適用",
        formula: equality(
          functionApplication("f", [termVariable("x")]),
          functionApplication("g", [termVariable("y")]),
        ),
      },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {formulas.map(({ label, formula }) => (
          <div
            key={label}
            style={{ display: "flex", alignItems: "center", gap: 16 }}
          >
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 12,
                color: "#666",
                minWidth: 120,
              }}
            >
              {label}
            </span>
            <FormulaKaTeX
              formula={formula}
              testId={`katex-${label satisfies string}`}
            />
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const label of ["述語", "等号", "二項演算", "関数適用"]) {
      const el = canvas.getByTestId(`katex-${label satisfies string}`);
      await expect(el.querySelector(".katex")).not.toBeNull();
    }
  },
};

/**
 * 証明でよく使う複合的な論理式の KaTeX レンダリング。
 */
export const ComplexFormulas: Story = {
  args: { formula: phi },
  render: () => {
    const iCombinator = implication(phi, phi);
    const kAxiom = implication(phi, implication(psi, phi));
    const sAxiom = implication(
      implication(phi, implication(psi, chi)),
      implication(implication(phi, psi), implication(phi, chi)),
    );
    const mixedQuantifiers = conjunction(
      universal(termVariable("ζ"), predicate("P", [termVariable("ζ")])),
      existential(termVariable("ξ"), predicate("Q", [termVariable("ξ")])),
    );
    const arithmetic = universal(
      termVariable("x"),
      equality(
        binaryOperation("+", termVariable("x"), constant("0")),
        termVariable("x"),
      ),
    );

    const formulas: readonly {
      readonly label: string;
      readonly formula: Formula;
    }[] = [
      { label: "I combinator", formula: iCombinator },
      { label: "K公理", formula: kAxiom },
      { label: "S公理", formula: sAxiom },
      { label: "混合量化子", formula: mixedQuantifiers },
      { label: "算術公理", formula: arithmetic },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {formulas.map(({ label, formula }) => (
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
            <FormulaKaTeX
              formula={formula}
              testId={`katex-${label satisfies string}`}
            />
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const label of [
      "I combinator",
      "K公理",
      "S公理",
      "混合量化子",
      "算術公理",
    ]) {
      const el = canvas.getByTestId(`katex-${label satisfies string}`);
      await expect(el.querySelector(".katex")).not.toBeNull();
    }
  },
};

/**
 * インラインモードとブロックモードの比較。
 */
export const DisplayModes: Story = {
  args: { formula: phi },
  render: () => {
    const formula = implication(phi, implication(psi, phi));
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
            Text before <FormulaKaTeX formula={formula} testId="katex-inline" />{" "}
            text after
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
          <FormulaKaTeX
            formula={formula}
            displayMode={true}
            testId="katex-block"
          />
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
  args: { formula: phi },
  render: () => {
    const formula = implication(phi, implication(psi, phi));
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FormulaKaTeX formula={formula} fontSize={14} testId="katex-small" />
        <FormulaKaTeX formula={formula} fontSize={24} testId="katex-medium" />
        <FormulaKaTeX formula={formula} fontSize={36} testId="katex-large" />
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
