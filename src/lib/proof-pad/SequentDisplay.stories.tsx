import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import {
  metaVariable,
  implication,
  conjunction,
  negation,
} from "../logic-core/formula";
import type { Sequent } from "../logic-core/sequentCalculus";
import { SequentDisplay } from "./SequentDisplay";

const meta = {
  title: "ProofPad/SequentDisplay",
  component: SequentDisplay,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof SequentDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── ヘルパー ─────────────────────────────────────────────

const phi = metaVariable("φ");
const psi = metaVariable("ψ");
const chi = metaVariable("χ");

// ── テキストベースのストーリー ────────────────────────────

/**
 * 基本的なシーケント表示: テキストからパース。
 */
export const BasicText: Story = {
  args: {
    text: "phi ⇒ psi",
    testId: "seq",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByTestId("seq");
    await expect(el).toBeInTheDocument();
    await expect(el).toHaveAttribute("role", "math");
    // ⇒ セパレータが表示される
    const turnstile = canvas.getByTestId("seq-turnstile");
    await expect(turnstile).toHaveTextContent("⇒");
    // 前件と後件が表示される
    const ant = canvas.getByTestId("seq-ant-0");
    await expect(ant).toBeInTheDocument();
    const suc = canvas.getByTestId("seq-suc-0");
    await expect(suc).toBeInTheDocument();
  },
};

/**
 * 複数の前件と後件。
 */
export const MultipleParts: Story = {
  args: {
    text: "phi, psi, chi ⇒ phi, psi",
    testId: "seq-multi",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 3つの前件
    await expect(canvas.getByTestId("seq-multi-ant-0")).toBeInTheDocument();
    await expect(canvas.getByTestId("seq-multi-ant-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("seq-multi-ant-2")).toBeInTheDocument();
    // 2つの後件
    await expect(canvas.getByTestId("seq-multi-suc-0")).toBeInTheDocument();
    await expect(canvas.getByTestId("seq-multi-suc-1")).toBeInTheDocument();
  },
};

/**
 * 前件なし（空の前件）。
 */
export const EmptyAntecedent: Story = {
  args: {
    text: "⇒ psi",
    testId: "seq-empty-ant",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByTestId("seq-empty-ant-turnstile"),
    ).toHaveTextContent("⇒");
    await expect(canvas.getByTestId("seq-empty-ant-suc-0")).toBeInTheDocument();
    // 前件のtestIdは存在しない
    expect(canvas.queryByTestId("seq-empty-ant-ant-0")).toBeNull();
  },
};

/**
 * 後件なし（空の後件）。
 */
export const EmptySuccedent: Story = {
  args: {
    text: "phi ⇒",
    testId: "seq-empty-suc",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("seq-empty-suc-ant-0")).toBeInTheDocument();
    expect(canvas.queryByTestId("seq-empty-suc-suc-0")).toBeNull();
  },
};

// ── Sequent型ベースのストーリー ──────────────────────────

/**
 * Sequent型オブジェクトからの表示（シンタックスハイライト付き）。
 */
export const FromSequentObject: Story = {
  args: {
    sequent: {
      antecedents: [phi, implication(phi, psi)],
      succedents: [psi],
    } satisfies Sequent,
    testId: "seq-obj",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByTestId("seq-obj");
    await expect(el).toBeInTheDocument();
    // 2つの前件
    await expect(canvas.getByTestId("seq-obj-ant-0")).toBeInTheDocument();
    await expect(canvas.getByTestId("seq-obj-ant-1")).toBeInTheDocument();
    // 1つの後件
    await expect(canvas.getByTestId("seq-obj-suc-0")).toBeInTheDocument();
  },
};

/**
 * 複雑な式を含むSequent。
 */
export const ComplexFormulas: Story = {
  args: {
    sequent: {
      antecedents: [conjunction(phi, psi), negation(chi)],
      succedents: [implication(phi, chi)],
    } satisfies Sequent,
    testId: "seq-complex",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("seq-complex-ant-0")).toBeInTheDocument();
    await expect(canvas.getByTestId("seq-complex-ant-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("seq-complex-suc-0")).toBeInTheDocument();
  },
};

/**
 * 空のSequent（前件も後件もなし）。
 */
export const EmptySequent: Story = {
  args: {
    sequent: {
      antecedents: [],
      succedents: [],
    } satisfies Sequent,
    testId: "seq-empty",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("seq-empty")).toBeInTheDocument();
    await expect(canvas.getByTestId("seq-empty-turnstile")).toHaveTextContent(
      "⇒",
    );
  },
};
