import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, within, userEvent } from "storybook/test";
import { NotebookCreateForm } from "./NotebookCreateFormComponent";
import { allReferenceEntries } from "../reference/referenceContent";

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
    // デフォルトでŁukasiewicz選択
    await expect(
      canvas.getByTestId("system-preset-lukasiewicz"),
    ).toHaveAttribute("aria-checked", "true");
    // 5つのカテゴリグループが表示
    await expect(
      canvas.getByTestId("preset-category-hilbert-propositional"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("preset-category-hilbert-predicate"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("preset-category-hilbert-theory"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("preset-category-natural-deduction"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("preset-category-sequent-calculus"),
    ).toBeInTheDocument();
    // 公理系カードが表示
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
    const errorEl = canvas.getByTestId("create-name-error");
    await expect(errorEl).toHaveTextContent("名前を入力してください");
    // role="alert" でアクセシブル
    await expect(errorEl).toHaveAttribute("role", "alert");
    // inputにフォーカスが移る
    const input = canvas.getByTestId("create-name-input");
    await expect(input).toHaveFocus();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    // onSubmitは呼ばれない
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const BlurValidation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId("create-name-input");

    // 初期状態: エラーなし
    await expect(
      canvas.queryByTestId("create-name-error"),
    ).not.toBeInTheDocument();

    // フォーカスしてblur → エラー表示
    await userEvent.click(input);
    await userEvent.tab();
    await expect(canvas.getByTestId("create-name-error")).toHaveTextContent(
      "名前を入力してください",
    );

    // 有効な値を入力 → エラーが消える
    await userEvent.click(input);
    await userEvent.type(input, "テストノート");
    await expect(
      canvas.queryByTestId("create-name-error"),
    ).not.toBeInTheDocument();
  },
};

export const CancelAction: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId("create-cancel-btn"));
    await expect(args.onCancel).toHaveBeenCalledOnce();
  },
};

export const WithReference: Story = {
  args: {
    referenceEntries: allReferenceEntries,
    locale: "ja",
    onOpenReferenceDetail: fn(),
    testId: "form",
    onSubmit: fn(),
    onCancel: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Łukasiewiczプリセットに(?)ボタンが表示される
    await expect(
      canvas.getByTestId("form-preset-lukasiewicz-ref-trigger"),
    ).toBeInTheDocument();
    // predicateプリセットには(?)が表示されない
    await expect(
      canvas.queryByTestId("form-preset-predicate-ref-trigger"),
    ).not.toBeInTheDocument();
    // (?)クリックでポップオーバーが開く
    await userEvent.click(
      canvas.getByTestId("form-preset-lukasiewicz-ref-trigger"),
    );
    await expect(
      canvas.getByTestId("form-preset-lukasiewicz-ref-popover"),
    ).toBeInTheDocument();
  },
};
