import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { FormulaListDisplay } from "./FormulaListDisplay";

const meta = {
  title: "ProofPad/FormulaListDisplay",
  component: FormulaListDisplay,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof FormulaListDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── テキストベースのストーリー ────────────────────────────

/**
 * 基本的な論理式リスト表示: テキストからパース。
 */
export const BasicText: Story = {
  args: {
    text: "phi, psi",
    testId: "flist",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByTestId("flist");
    await expect(el).toBeInTheDocument();
    await expect(el).toHaveAttribute("role", "math");
    // 2つの論理式が表示される
    const f0 = canvas.getByTestId("flist-formula-0");
    await expect(f0).toBeInTheDocument();
    const f1 = canvas.getByTestId("flist-formula-1");
    await expect(f1).toBeInTheDocument();
  },
};

/**
 * 複数の論理式（含意を含む）。
 */
export const MultipleFormulas: Story = {
  args: {
    text: "phi -> psi, chi, phi",
    testId: "flist",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByTestId("flist");
    await expect(el).toBeInTheDocument();
    // 3つの論理式が表示される
    await expect(canvas.getByTestId("flist-formula-0")).toBeInTheDocument();
    await expect(canvas.getByTestId("flist-formula-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("flist-formula-2")).toBeInTheDocument();
  },
};

// ── formulaTexts配列ベースのストーリー ─────────────────────

/**
 * formulaTexts配列から表示（再パースをスキップ）。
 */
export const FromFormulaTexts: Story = {
  args: {
    formulaTexts: ["phi", "psi -> chi", "phi /\\ psi"],
    testId: "flist",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByTestId("flist");
    await expect(el).toBeInTheDocument();
    // 3つの論理式が表示される
    await expect(canvas.getByTestId("flist-formula-0")).toBeInTheDocument();
    await expect(canvas.getByTestId("flist-formula-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("flist-formula-2")).toBeInTheDocument();
  },
};

/**
 * 単一の論理式。
 */
export const SingleFormula: Story = {
  args: {
    formulaTexts: ["phi -> psi"],
    testId: "flist",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("flist-formula-0")).toBeInTheDocument();
  },
};

/**
 * パース失敗を含むケース。
 */
export const WithParseError: Story = {
  args: {
    formulaTexts: ["phi ->", "psi"],
    testId: "flist",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // パース失敗のテキストもフォールバックで表示される
    await expect(canvas.getByTestId("flist-formula-0")).toBeInTheDocument();
    await expect(canvas.getByTestId("flist-formula-1")).toBeInTheDocument();
  },
};

/**
 * 空の論理式リスト。
 */
export const Empty: Story = {
  args: {
    formulaTexts: [],
    testId: "flist",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByTestId("flist");
    await expect(el).toBeInTheDocument();
    // 空なので子要素は空
    await expect(el.children).toHaveLength(0);
  },
};
