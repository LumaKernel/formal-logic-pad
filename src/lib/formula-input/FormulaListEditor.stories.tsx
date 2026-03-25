import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { FormulaListEditor } from "./FormulaListEditor";

// --- Wrapper ---

function FormulaListEditorWrapper({
  initialFormulas = [],
  testId = "formula-list",
  error,
}: {
  readonly initialFormulas?: readonly string[];
  readonly testId?: string;
  readonly error?: string;
}) {
  const [formulas, setFormulas] = useState<readonly string[]>(initialFormulas);

  return (
    <div style={{ width: 400, padding: 16 }}>
      <FormulaListEditor
        formulas={formulas}
        onChange={setFormulas}
        testId={testId}
        error={error}
      />
      <div
        data-testid="debug-count"
        style={{
          marginTop: 12,
          fontSize: 11,
          color: "var(--color-text-secondary, #666)",
        }}
      >
        {`${String(formulas.length) satisfies string} 件`}
      </div>
    </div>
  );
}

const meta: Meta<typeof FormulaListEditorWrapper> = {
  title: "formula-input/FormulaListEditor",
  component: FormulaListEditorWrapper,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FormulaListEditorWrapper>;

export const Default: Story = {
  args: {
    initialFormulas: ["phi → psi", "psi → chi"],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 2つのアイテム行が表示されている
    await expect(canvas.getByTestId("formula-list-item-0")).toBeInTheDocument();
    await expect(canvas.getByTestId("formula-list-item-1")).toBeInTheDocument();
    // 追加ボタンが表示されている
    await expect(canvas.getByTestId("formula-list-add")).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: {
    initialFormulas: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 空メッセージが表示されている
    await expect(canvas.getByText("式を追加してください")).toBeInTheDocument();
    // 0件
    await expect(canvas.getByTestId("debug-count")).toHaveTextContent("0 件");
  },
};

export const AddFormula: Story = {
  args: {
    initialFormulas: ["phi"],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("debug-count")).toHaveTextContent("1 件");
    // 追加ボタンをクリック
    await userEvent.click(canvas.getByTestId("formula-list-add"));
    await expect(canvas.getByTestId("debug-count")).toHaveTextContent("2 件");
    await expect(canvas.getByTestId("formula-list-item-1")).toBeInTheDocument();
  },
};

export const RemoveFormula: Story = {
  args: {
    initialFormulas: ["phi", "psi", "chi"],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("debug-count")).toHaveTextContent("3 件");
    // 中間の要素を削除
    await userEvent.click(canvas.getByTestId("formula-list-remove-1"));
    await expect(canvas.getByTestId("debug-count")).toHaveTextContent("2 件");
  },
};

export const MoveFormula: Story = {
  args: {
    initialFormulas: ["phi", "psi", "chi"],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 先頭の↑は無効
    const upButton0 = canvas.getByTestId("formula-list-up-0");
    await expect(upButton0).toBeDisabled();
    // 2番目を上に移動
    await userEvent.click(canvas.getByTestId("formula-list-up-1"));
    // 末尾の↓は無効（移動後は chi が末尾）
    const downButton2 = canvas.getByTestId("formula-list-down-2");
    await expect(downButton2).toBeDisabled();
  },
};

export const WithError: Story = {
  args: {
    initialFormulas: [],
    error: "ゴール式を1つ以上入力してください",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("formula-list-error")).toBeInTheDocument();
    await expect(
      canvas.getByText("ゴール式を1つ以上入力してください"),
    ).toBeInTheDocument();
  },
};
