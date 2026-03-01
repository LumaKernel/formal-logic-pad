import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import type { Term } from "../logic-core/term";
import { TermInput } from "./TermInput";

// --- Wrapper: 制御コンポーネント用ステート管理 ---

function TermInputWrapper({
  initialValue = "",
  onOpenSyntaxHelp,
  ...props
}: {
  readonly initialValue?: string;
  readonly placeholder?: string;
  readonly fontSize?: number;
  readonly onOpenSyntaxHelp?: () => void;
  readonly testId?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [parsedTag, setParsedTag] = useState<string>("");

  const handleParsed = (term: Term) => {
    setParsedTag(term._tag);
  };

  return (
    <div style={{ width: 400 }}>
      <TermInput
        value={value}
        onChange={setValue}
        onParsed={handleParsed}
        onOpenSyntaxHelp={onOpenSyntaxHelp}
        {...props}
      />
      {parsedTag && (
        <div
          data-testid="parsed-tag"
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "var(--color-text-secondary, #888)",
            fontFamily: "var(--font-mono)",
          }}
        >
          AST: {parsedTag}
        </div>
      )}
    </div>
  );
}

const meta = {
  title: "FormulaInput/TermInput",
  component: TermInput,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof TermInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- ストーリー ---

/**
 * 正常な項の入力。プレビューが表示される。
 */
export const ValidInput: Story = {
  args: {
    value: "x + y",
    onChange: () => {},
    testId: "ti",
  },
  render: () => <TermInputWrapper initialValue="x + y" testId="ti" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // プレビューが表示されている
    const preview = canvas.getByTestId("ti-preview");
    await expect(preview).toBeInTheDocument();

    // TermDisplayでレンダリングされている
    const term = canvas.getByTestId("ti-term");
    await expect(term).toHaveTextContent("x + y");

    // エラーが表示されていない
    const errors = canvas.queryByTestId("ti-errors");
    await expect(errors).not.toBeInTheDocument();

    // aria-invalid が false
    const input = canvas.getByTestId("ti-input");
    await expect(input).toHaveAttribute("aria-invalid", "false");
  },
};

/**
 * エラーのある入力。エラーメッセージが表示される。
 */
export const ErrorInput: Story = {
  args: {
    value: "→",
    onChange: () => {},
    testId: "ti",
  },
  render: () => <TermInputWrapper initialValue="→" testId="ti" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エラーが表示されている
    const errors = canvas.getByTestId("ti-errors");
    await expect(errors).toBeInTheDocument();
    await expect(errors).toHaveAttribute("role", "alert");

    // エラーメッセージにフォーマットが含まれている
    const error0 = canvas.getByTestId("ti-error-0");
    await expect(error0).toBeInTheDocument();

    // プレビューが表示されていない
    const preview = canvas.queryByTestId("ti-preview");
    await expect(preview).not.toBeInTheDocument();

    // aria-invalid が true
    const input = canvas.getByTestId("ti-input");
    await expect(input).toHaveAttribute("aria-invalid", "true");

    // ハイライトが表示されている
    const highlights = canvas.getByTestId("ti-highlights");
    await expect(highlights).toBeInTheDocument();
  },
};

/**
 * リアルタイム編集。入力して結果がリアルタイムに変わる。
 */
export const RealtimeEditing: Story = {
  args: {
    value: "",
    onChange: () => {},
    testId: "ti",
  },
  render: () => <TermInputWrapper testId="ti" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId("ti-input");

    // 初期状態: 空なのでプレビューもエラーもない
    await expect(canvas.queryByTestId("ti-preview")).not.toBeInTheDocument();
    await expect(canvas.queryByTestId("ti-errors")).not.toBeInTheDocument();

    // x を入力
    await userEvent.type(input, "x");
    // パース成功 → プレビュー表示
    await expect(canvas.getByTestId("ti-preview")).toBeInTheDocument();
    await expect(canvas.getByTestId("ti-term")).toHaveTextContent("x");

    // " + y" を追加
    await userEvent.type(input, " + y");
    await expect(canvas.getByTestId("ti-term")).toHaveTextContent("x + y");

    // AST種類が表示されている
    await expect(canvas.getByTestId("parsed-tag")).toHaveTextContent(
      "AST: BinaryOperation",
    );
  },
};

/**
 * 関数適用の複雑な項入力。
 */
export const FunctionApplication: Story = {
  args: {
    value: "f(x, g(y))",
    onChange: () => {},
    testId: "ti",
  },
  render: () => <TermInputWrapper initialValue="f(x, g(y))" testId="ti" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const preview = canvas.getByTestId("ti-preview");
    await expect(preview).toBeInTheDocument();

    const term = canvas.getByTestId("ti-term");
    await expect(term).toBeInTheDocument();
    await expect(term).toHaveAttribute("role", "math");
  },
};

/**
 * 空の入力欄。プレースホルダーが表示される。
 */
export const EmptyInput: Story = {
  args: {
    value: "",
    onChange: () => {},
    testId: "ti",
  },
  render: () => <TermInputWrapper testId="ti" placeholder="項を入力..." />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId("ti-input");
    await expect(input).toHaveAttribute("placeholder", "項を入力...");
    await expect(canvas.queryByTestId("ti-preview")).not.toBeInTheDocument();
    await expect(canvas.queryByTestId("ti-errors")).not.toBeInTheDocument();
  },
};

/**
 * フォントサイズのカスタマイズ。
 */
export const CustomFontSize: Story = {
  args: {
    value: "x + y",
    onChange: () => {},
    testId: "ti",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <TermInputWrapper initialValue="x + y" testId="ti-small" fontSize={14} />
      <TermInputWrapper initialValue="x + y" testId="ti-large" fontSize={24} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 小さいサイズ
    const small = canvas.getByTestId("ti-small");
    await expect(small.style.fontSize).toBe("14px");

    // 大きいサイズ
    const large = canvas.getByTestId("ti-large");
    await expect(large.style.fontSize).toBe("24px");
  },
};

/**
 * エラーから正常入力への遷移。
 */
export const ErrorToValid: Story = {
  args: {
    value: "→",
    onChange: () => {},
    testId: "ti",
  },
  render: () => <TermInputWrapper initialValue="→" testId="ti" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId("ti-input");

    // 初期状態: エラー
    await expect(canvas.getByTestId("ti-errors")).toBeInTheDocument();
    await expect(input).toHaveAttribute("aria-invalid", "true");

    // テキストをクリアして有効な項を入力
    await userEvent.clear(input);
    await userEvent.type(input, "x");

    // エラーが消えてプレビューが表示される
    await expect(canvas.queryByTestId("ti-errors")).not.toBeInTheDocument();
    await expect(canvas.getByTestId("ti-preview")).toBeInTheDocument();
    await expect(canvas.getByTestId("ti-term")).toHaveTextContent("x");
  },
};

/**
 * 構文ヘルプボタン付きの入力欄。?ボタンが右端に表示される。
 */
export const WithSyntaxHelp: Story = {
  args: {
    value: "x + y",
    onChange: () => {},
    testId: "ti",
  },
  render: () => (
    <TermInputWrapper
      initialValue="x + y"
      testId="ti"
      onOpenSyntaxHelp={() => alert("Syntax help opened")}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ?ボタンが表示されている
    const helpBtn = canvas.getByTestId("ti-syntax-help");
    await expect(helpBtn).toBeInTheDocument();
    await expect(helpBtn).toHaveTextContent("?");

    // 入力欄も正常に表示されている
    const input = canvas.getByTestId("ti-input");
    await expect(input).toBeInTheDocument();
  },
};
