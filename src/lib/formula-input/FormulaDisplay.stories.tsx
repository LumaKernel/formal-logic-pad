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
import { FormulaDisplay } from "./FormulaDisplay";

const meta = {
  title: "FormulaInput/FormulaDisplay",
  component: FormulaDisplay,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof FormulaDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── ヘルパー: よく使う論理式パターン ──────────────────────

const phi = metaVariable("φ");
const psi = metaVariable("ψ");
const chi = metaVariable("χ");

// ── ストーリー ───────────────────────────────────────────

/**
 * 基本的なメタ変数と否定の表示。
 */
export const BasicFormulas: Story = {
  args: {
    formula: phi,
    testId: "formula-display",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByTestId("formula-display");
    await expect(el).toBeInTheDocument();
    await expect(el).toHaveTextContent("φ");
    await expect(el).toHaveAttribute("role", "math");
  },
};

/**
 * 添字付きメタ変数の表示。
 */
export const SubscriptedVariables: Story = {
  args: {
    formula: implication(metaVariable("φ", "1"), metaVariable("ψ", "02")),
    testId: "formula-display",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByTestId("formula-display");
    await expect(el).toHaveTextContent("φ₁ → ψ₀₂");
  },
};

/**
 * 命題論理の各種結合子: →, ∧, ∨, ↔, ¬
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
                color: "#888",
                minWidth: 80,
              }}
            >
              {label}
            </span>
            <FormulaDisplay
              formula={formula}
              fontSize={18}
              testId={`formula-${label satisfies string}`}
            />
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("formula-含意")).toHaveTextContent("φ → ψ");
    await expect(canvas.getByTestId("formula-連言")).toHaveTextContent("φ ∧ ψ");
    await expect(canvas.getByTestId("formula-選言")).toHaveTextContent("φ ∨ ψ");
    await expect(canvas.getByTestId("formula-双条件")).toHaveTextContent(
      "φ ↔ ψ",
    );
    await expect(canvas.getByTestId("formula-否定")).toHaveTextContent("¬φ");
    await expect(canvas.getByTestId("formula-二重否定")).toHaveTextContent(
      "¬¬φ",
    );
  },
};

/**
 * 量化子: ∀, ∃
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
                color: "#888",
                minWidth: 80,
              }}
            >
              {label}
            </span>
            <FormulaDisplay
              formula={formula}
              fontSize={18}
              testId={`formula-${label satisfies string}`}
            />
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("formula-全称")).toHaveTextContent(
      "∀x.P(x)",
    );
    await expect(canvas.getByTestId("formula-存在")).toHaveTextContent(
      "∃x.Q(x)",
    );
    await expect(canvas.getByTestId("formula-ネスト")).toHaveTextContent(
      "∀x.∃y.R(x, y)",
    );
  },
};

/**
 * 述語・等号・項演算を含む式。
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
        label: "二項演算+等号",
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
                color: "#888",
                minWidth: 120,
              }}
            >
              {label}
            </span>
            <FormulaDisplay
              formula={formula}
              fontSize={18}
              testId={`formula-${label satisfies string}`}
            />
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("formula-述語")).toHaveTextContent(
      "P(x, y)",
    );
    await expect(canvas.getByTestId("formula-等号")).toHaveTextContent("x = y");
    await expect(canvas.getByTestId("formula-二項演算+等号")).toHaveTextContent(
      "x + 0 = x",
    );
    await expect(canvas.getByTestId("formula-関数適用")).toHaveTextContent(
      "f(x) = g(y)",
    );
  },
};

/**
 * 証明でよく使う複合的な論理式。
 */
export const ComplexFormulas: Story = {
  args: { formula: phi },
  render: () => {
    // φ → φ (I combinator)
    const iCombinator = implication(phi, phi);

    // K公理: φ → (ψ → φ)
    const kAxiom = implication(phi, implication(psi, phi));

    // S公理: (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))
    const sAxiom = implication(
      implication(phi, implication(psi, chi)),
      implication(implication(phi, psi), implication(phi, chi)),
    );

    // ∀ζ.P(ζ) ∧ ∃ξ.Q(ξ)
    const mixedQuantifiers = conjunction(
      universal(termVariable("ζ"), predicate("P", [termVariable("ζ")])),
      existential(termVariable("ξ"), predicate("Q", [termVariable("ξ")])),
    );

    // ∀x. x + 0 = x
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
                color: "#888",
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {label}
            </div>
            <FormulaDisplay
              formula={formula}
              fontSize={20}
              testId={`formula-${label satisfies string}`}
            />
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("formula-I combinator")).toHaveTextContent(
      "φ → φ",
    );
    await expect(canvas.getByTestId("formula-K公理")).toHaveTextContent(
      "φ → ψ → φ",
    );
    await expect(canvas.getByTestId("formula-S公理")).toHaveTextContent(
      "(φ → ψ → χ) → (φ → ψ) → φ → χ",
    );
    await expect(canvas.getByTestId("formula-混合量化子")).toHaveTextContent(
      "(∀ζ.P(ζ)) ∧ (∃ξ.Q(ξ))",
    );
    await expect(canvas.getByTestId("formula-算術公理")).toHaveTextContent(
      "∀x.x + 0 = x",
    );
  },
};

/**
 * シンタックスハイライト: 各トークンが色分けされた表示。
 */
export const SyntaxHighlight: Story = {
  args: { formula: phi },
  render: () => {
    // 様々な種類のトークンを含む式
    const formulas: readonly {
      readonly label: string;
      readonly formula: Formula;
    }[] = [
      {
        label: "メタ変数+結合子",
        formula: implication(phi, conjunction(psi, chi)),
      },
      {
        label: "量化子+述語",
        formula: universal(
          termVariable("x"),
          predicate("P", [termVariable("x")]),
        ),
      },
      {
        label: "等号+定数+関数",
        formula: universal(
          termVariable("x"),
          equality(
            functionApplication("S", [termVariable("x")]),
            binaryOperation("+", termVariable("x"), constant("1")),
          ),
        ),
      },
      { label: "否定+双条件", formula: negation(biconditional(phi, psi)) },
      {
        label: "S公理",
        formula: implication(
          implication(phi, implication(psi, chi)),
          implication(implication(phi, psi), implication(phi, chi)),
        ),
      },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {formulas.map(({ label, formula }) => (
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
            <FormulaDisplay
              formula={formula}
              fontSize={20}
              highlight
              testId={`highlight-${label satisfies string}`}
            />
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // テキスト内容が正しいこと
    await expect(
      canvas.getByTestId("highlight-メタ変数+結合子"),
    ).toHaveTextContent("φ → ψ ∧ χ");
    await expect(canvas.getByTestId("highlight-量化子+述語")).toHaveTextContent(
      "∀x.P(x)",
    );
    await expect(
      canvas.getByTestId("highlight-等号+定数+関数"),
    ).toHaveTextContent("∀x.S(x) = x + 1");
    // 子span（ハイライトトークン）が存在すること
    const el = canvas.getByTestId("highlight-メタ変数+結合子");
    await expect(el.children.length).toBeGreaterThan(0);
  },
};

/**
 * フォントサイズと色のカスタマイズ。
 */
export const CustomStyling: Story = {
  args: { formula: phi },
  render: () => {
    const formula = implication(phi, implication(psi, phi));
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FormulaDisplay
          formula={formula}
          fontSize={14}
          color="#666"
          highlight={false}
          testId="formula-small"
        />
        <FormulaDisplay
          formula={formula}
          fontSize={24}
          color="#2c3e50"
          highlight={false}
          testId="formula-medium"
        />
        <FormulaDisplay
          formula={formula}
          fontSize={36}
          color="#e74c3c"
          highlight={false}
          testId="formula-large"
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const small = canvas.getByTestId("formula-small");
    await expect(small).toHaveTextContent("φ → ψ → φ");
    await expect(small.style.fontSize).toBe("14px");

    const medium = canvas.getByTestId("formula-medium");
    await expect(medium.style.fontSize).toBe("24px");

    const large = canvas.getByTestId("formula-large");
    await expect(large.style.fontSize).toBe("36px");
    await expect(large.style.color).toBe("rgb(231, 76, 60)");
  },
};
