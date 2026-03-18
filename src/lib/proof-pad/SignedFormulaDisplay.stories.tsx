import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { SignedFormulaDisplay } from "./SignedFormulaDisplay";

const meta = {
  title: "ProofPad/SignedFormulaDisplay",
  component: SignedFormulaDisplay,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof SignedFormulaDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── ストーリー ─────────────────────────────────────────────

/**
 * T符号の基本的な署名付き論理式表示。
 */
export const TrueFormula: Story = {
  args: {
    text: "T:phi ∧ psi",
    testId: "sf",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByTestId("sf");
    await expect(el).toBeInTheDocument();
    await expect(el).toHaveAttribute("role", "math");
    // 符号バッジが表示される
    const sign = canvas.getByTestId("sf-sign");
    await expect(sign).toHaveTextContent("T");
    // 論理式部分が表示される
    const formula = canvas.getByTestId("sf-formula");
    await expect(formula).toBeInTheDocument();
  },
};

/**
 * F符号の署名付き論理式表示。
 */
export const FalseFormula: Story = {
  args: {
    text: "F:phi → psi",
    testId: "sf-false",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sign = canvas.getByTestId("sf-false-sign");
    await expect(sign).toHaveTextContent("F");
    const formula = canvas.getByTestId("sf-false-formula");
    await expect(formula).toBeInTheDocument();
  },
};

/**
 * パース失敗時のフォールバック表示（テキストスロット）。
 */
export const ParseError: Story = {
  args: {
    text: "T:???invalid",
    testId: "sf-err",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 符号バッジは表示される
    const sign = canvas.getByTestId("sf-err-sign");
    await expect(sign).toHaveTextContent("T");
    // 論理式部分はテキストフォールバック
    const formula = canvas.getByTestId("sf-err-formula");
    await expect(formula).toBeInTheDocument();
    await expect(formula).toHaveTextContent("???invalid");
  },
};

/**
 * 量化子を含む署名付き論理式。
 */
export const QuantifiedFormula: Story = {
  args: {
    text: "T:(all x. P(x))",
    testId: "sf-quant",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sign = canvas.getByTestId("sf-quant-sign");
    await expect(sign).toHaveTextContent("T");
    const formula = canvas.getByTestId("sf-quant-formula");
    await expect(formula).toBeInTheDocument();
  },
};

/**
 * 否定を含むF署名付き式。
 */
export const NegationFormula: Story = {
  args: {
    text: "F:¬phi",
    testId: "sf-neg",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sign = canvas.getByTestId("sf-neg-sign");
    await expect(sign).toHaveTextContent("F");
    const formula = canvas.getByTestId("sf-neg-formula");
    await expect(formula).toBeInTheDocument();
  },
};

/**
 * 非署名付きテキスト — フォールバック表示。
 */
export const PlainTextFallback: Story = {
  args: {
    text: "phi ∧ psi",
    testId: "sf-plain",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // フォールバック: 全体がプレーンテキスト表示
    const el = canvas.getByTestId("sf-plain");
    await expect(el).toBeInTheDocument();
    await expect(el).toHaveTextContent("phi ∧ psi");
    // 符号バッジは存在しない
    expect(canvas.queryByTestId("sf-plain-sign")).toBeNull();
  },
};
