import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, within, userEvent } from "storybook/test";
import { NotebookCreateForm } from "./NotebookCreateFormComponent";

const meta = {
  title: "Notebook/NotebookCreateForm",
  component: NotebookCreateForm,
  args: {
    onSubmit: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof NotebookCreateForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // フォームが表示される
    await expect(
      canvas.getByTestId("notebook-create-form"),
    ).toBeInTheDocument();
    // 名前入力欄が空
    await expect(canvas.getByTestId("create-name-input")).toHaveValue("");
    // デフォルトで自由帳モード
    await expect(canvas.getByTestId("create-mode-free")).toBeChecked();
    // デフォルトでŁukasiewicz選択
    await expect(
      canvas.getByTestId("system-preset-lukasiewicz"),
    ).toHaveAttribute("aria-checked", "true");
    // 3つの公理系カードが表示
    await expect(
      canvas.getByTestId("system-preset-lukasiewicz"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("system-preset-predicate"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("system-preset-equality"),
    ).toBeInTheDocument();
  },
};

export const SubmitWithName: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // 名前を入力
    await userEvent.type(
      canvas.getByTestId("create-name-input"),
      "テストノート",
    );
    // 送信
    await userEvent.click(canvas.getByTestId("create-submit-btn"));
    await expect(args.onSubmit).toHaveBeenCalledOnce();
  },
};

export const SelectQuestMode: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // クエストモードを選択
    await userEvent.click(canvas.getByTestId("create-mode-quest"));
    await expect(canvas.getByTestId("create-mode-quest")).toBeChecked();
    await expect(canvas.getByTestId("create-mode-free")).not.toBeChecked();
  },
};

export const SelectPredicateSystem: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 述語論理を選択
    await userEvent.click(canvas.getByTestId("system-preset-predicate"));
    await expect(canvas.getByTestId("system-preset-predicate")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(
      canvas.getByTestId("system-preset-lukasiewicz"),
    ).toHaveAttribute("aria-checked", "false");
  },
};

export const ValidationError: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // 名前を入力せずに送信
    await userEvent.click(canvas.getByTestId("create-submit-btn"));
    // エラーメッセージが表示される
    await expect(canvas.getByTestId("create-name-error")).toHaveTextContent(
      "名前を入力してください",
    );
    // onSubmitは呼ばれない
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const CancelAction: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId("create-cancel-btn"));
    await expect(args.onCancel).toHaveBeenCalledOnce();
  },
};
