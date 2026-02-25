import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { FormulaInput } from "./FormulaInput";
import { TermInput } from "./TermInput";

// --- Wrappers ---

function FormulaCompletionWrapper({
  initialValue = "",
  testId = "fi",
}: {
  readonly initialValue?: string;
  readonly testId?: string;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <div style={{ width: 400 }}>
      <FormulaInput value={value} onChange={setValue} testId={testId} />
    </div>
  );
}

function TermCompletionWrapper({
  initialValue = "",
  testId = "ti",
}: {
  readonly initialValue?: string;
  readonly testId?: string;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <div style={{ width: 400 }}>
      <TermInput value={value} onChange={setValue} testId={testId} />
    </div>
  );
}

const meta = {
  title: "FormulaInput/InputCompletion",
  component: FormulaInput,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof FormulaInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- ストーリー ---

/**
 * ギリシャ文字の補完。"ph" と入力すると φ の候補が表示される。
 */
export const GreekLetterCompletion: Story = {
  args: {
    value: "",
    onChange: () => {},
    testId: "fi",
  },
  render: () => <FormulaCompletionWrapper testId="fi" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId("fi-input");

    // "ph" を入力
    await userEvent.type(input, "ph");

    // 補完ポップアップが表示される
    const completion = canvas.getByTestId("fi-completion");
    await expect(completion).toBeInTheDocument();
    await expect(completion).toHaveAttribute("role", "listbox");

    // φ の候補が含まれている
    const item0 = canvas.getByTestId("fi-completion-item-0");
    await expect(item0).toBeInTheDocument();
    await expect(item0).toHaveTextContent("φ");
  },
};

/**
 * Tab キーで補完を確定。"phi" → Tab で φ に変換される。
 */
export const TabToComplete: Story = {
  args: {
    value: "",
    onChange: () => {},
    testId: "fi",
  },
  render: () => <FormulaCompletionWrapper testId="fi" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId("fi-input");

    // "phi" を入力
    await userEvent.type(input, "phi");

    // 補完ポップアップが表示される
    await expect(canvas.getByTestId("fi-completion")).toBeInTheDocument();

    // Tab で確定
    await userEvent.keyboard("{Tab}");

    // 入力値が φ に変わる
    await expect(input).toHaveValue("φ");

    // ポップアップが閉じる
    await expect(canvas.queryByTestId("fi-completion")).not.toBeInTheDocument();
  },
};

/**
 * 演算子の補完。"->" と入力すると → の候補が表示される。
 */
export const OperatorCompletion: Story = {
  args: {
    value: "",
    onChange: () => {},
    testId: "fi",
  },
  render: () => <FormulaCompletionWrapper testId="fi" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId("fi-input");

    // "φ " を入力してから "->" を入力
    await userEvent.type(input, "φ ->");

    // 補完ポップアップが表示される
    const completion = canvas.getByTestId("fi-completion");
    await expect(completion).toBeInTheDocument();

    // → の候補が含まれている
    const item0 = canvas.getByTestId("fi-completion-item-0");
    await expect(item0).toHaveTextContent("→");

    // Tab で確定
    await userEvent.keyboard("{Tab}");

    // 入力値が "φ →" に変わる
    await expect(input).toHaveValue("φ →");
  },
};

/**
 * Escape キーで補完をキャンセル。
 */
export const EscapeToCancel: Story = {
  args: {
    value: "",
    onChange: () => {},
    testId: "fi",
  },
  render: () => <FormulaCompletionWrapper testId="fi" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId("fi-input");

    // "ph" を入力
    await userEvent.type(input, "ph");

    // 補完ポップアップが表示される
    await expect(canvas.getByTestId("fi-completion")).toBeInTheDocument();

    // Escape でキャンセル
    await userEvent.keyboard("{Escape}");

    // ポップアップが閉じる
    await expect(canvas.queryByTestId("fi-completion")).not.toBeInTheDocument();

    // 入力値はそのまま
    await expect(input).toHaveValue("ph");
  },
};

/**
 * 矢印キーで候補を移動。
 */
export const ArrowKeyNavigation: Story = {
  args: {
    value: "",
    onChange: () => {},
    testId: "fi",
  },
  render: () => <FormulaCompletionWrapper testId="fi" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId("fi-input");

    // "al" を入力 (alpha, all の候補)
    await userEvent.type(input, "al");

    // 補完ポップアップが表示される
    const completion = canvas.getByTestId("fi-completion");
    await expect(completion).toBeInTheDocument();

    // 最初の候補が選択されている
    const item0 = canvas.getByTestId("fi-completion-item-0");
    await expect(item0).toHaveAttribute("aria-selected", "true");

    // ArrowDown で次の候補に移動
    await userEvent.keyboard("{ArrowDown}");
    const item1 = canvas.getByTestId("fi-completion-item-1");
    await expect(item1).toHaveAttribute("aria-selected", "true");
    await expect(item0).toHaveAttribute("aria-selected", "false");
  },
};

/**
 * TermInput でも補完が動作する。
 */
export const TermInputCompletion: Story = {
  args: {
    value: "",
    onChange: () => {},
    testId: "ti",
  },
  render: () => <TermCompletionWrapper testId="ti" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId("ti-input");

    // "al" を入力
    await userEvent.type(input, "al");

    // 補完ポップアップが表示される
    const completion = canvas.getByTestId("ti-completion");
    await expect(completion).toBeInTheDocument();
  },
};

/**
 * 量化子の補完。"all" と入力すると ∀ の候補が表示される。
 */
export const QuantifierCompletion: Story = {
  args: {
    value: "",
    onChange: () => {},
    testId: "fi",
  },
  render: () => <FormulaCompletionWrapper testId="fi" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId("fi-input");

    // "all" を入力
    await userEvent.type(input, "all");

    // 補完ポップアップが表示される
    const completion = canvas.getByTestId("fi-completion");
    await expect(completion).toBeInTheDocument();

    // ∀ の候補が含まれている
    const items = completion.querySelectorAll("[role=option]");
    const texts = [...items].map((el) => el.textContent);
    const hasForall = texts.some((t) => t?.includes("∀"));
    await expect(hasForall).toBe(true);
  },
};
