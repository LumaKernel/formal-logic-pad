import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import type { Formula } from "../logic-core/formula";
import { FormulaInput } from "./FormulaInput";

// --- Wrapper: 制御コンポーネント用ステート管理 ---

function FormulaInputWrapper({
  initialValue = "",
  ...props
}: {
  readonly initialValue?: string;
  readonly placeholder?: string;
  readonly fontSize?: number;
  readonly testId?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [parsedTag, setParsedTag] = useState<string>("");

  const handleParsed = (formula: Formula) => {
    setParsedTag(formula._tag);
  };

  return (
    <div style={{ width: 400 }}>
      <FormulaInput
        value={value}
        onChange={setValue}
        onParsed={handleParsed}
        {...props}
      />
      {parsedTag && (
        <div
          data-testid="parsed-tag"
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "#888",
            fontFamily: "monospace",
          }}
        >
          AST: {parsedTag}
        </div>
      )}
    </div>
  );
}

const meta = {
  title: "FormulaInput/FormulaInput",
  component: FormulaInput,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof FormulaInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- ストーリー ---

/**
 * 正常な論理式の入力。プレビューが表示される。
 */
export const ValidInput: Story = {
  args: {
    value: "φ → ψ",
    onChange: () => {},
    testId: "fi",
  },
  render: () => <FormulaInputWrapper initialValue="φ → ψ" testId="fi" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // プレビューが表示されている
    const preview = canvas.getByTestId("fi-preview");
    await expect(preview).toBeInTheDocument();

    // FormulaDisplayでレンダリングされている
    const formula = canvas.getByTestId("fi-formula");
    await expect(formula).toHaveTextContent("φ → ψ");

    // エラーが表示されていない
    const errors = canvas.queryByTestId("fi-errors");
    await expect(errors).not.toBeInTheDocument();

    // aria-invalid が false
    const input = canvas.getByTestId("fi-input");
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
    testId: "fi",
  },
  render: () => <FormulaInputWrapper initialValue="→" testId="fi" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エラーが表示されている
    const errors = canvas.getByTestId("fi-errors");
    await expect(errors).toBeInTheDocument();
    await expect(errors).toHaveAttribute("role", "alert");

    // エラーメッセージにフォーマットが含まれている
    const error0 = canvas.getByTestId("fi-error-0");
    await expect(error0).toBeInTheDocument();

    // プレビューが表示されていない
    const preview = canvas.queryByTestId("fi-preview");
    await expect(preview).not.toBeInTheDocument();

    // aria-invalid が true
    const input = canvas.getByTestId("fi-input");
    await expect(input).toHaveAttribute("aria-invalid", "true");

    // ハイライトが表示されている
    const highlights = canvas.getByTestId("fi-highlights");
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
    testId: "fi",
  },
  render: () => <FormulaInputWrapper testId="fi" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId("fi-input");

    // 初期状態: 空なのでプレビューもエラーもない
    await expect(canvas.queryByTestId("fi-preview")).not.toBeInTheDocument();
    await expect(canvas.queryByTestId("fi-errors")).not.toBeInTheDocument();

    // φ を入力
    await userEvent.type(input, "φ");
    // パース成功 → プレビュー表示
    await expect(canvas.getByTestId("fi-preview")).toBeInTheDocument();
    await expect(canvas.getByTestId("fi-formula")).toHaveTextContent("φ");

    // " → ψ" を追加
    await userEvent.type(input, " → ψ");
    await expect(canvas.getByTestId("fi-formula")).toHaveTextContent("φ → ψ");

    // AST種類が表示されている
    await expect(canvas.getByTestId("parsed-tag")).toHaveTextContent(
      "AST: Implication",
    );
  },
};

/**
 * 量化子付きの複雑な式の入力。
 */
export const ComplexFormula: Story = {
  args: {
    value: "∀x. P(x) → ∃y. Q(x, y)",
    onChange: () => {},
    testId: "fi",
  },
  render: () => (
    <FormulaInputWrapper initialValue="∀x. P(x) → ∃y. Q(x, y)" testId="fi" />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const preview = canvas.getByTestId("fi-preview");
    await expect(preview).toBeInTheDocument();

    const formula = canvas.getByTestId("fi-formula");
    await expect(formula).toBeInTheDocument();
    // パースされて正しく表示されることを確認
    await expect(formula).toHaveAttribute("role", "math");
  },
};

/**
 * 空の入力欄。プレースホルダーが表示される。
 */
export const EmptyInput: Story = {
  args: {
    value: "",
    onChange: () => {},
    testId: "fi",
  },
  render: () => (
    <FormulaInputWrapper testId="fi" placeholder="論理式を入力..." />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId("fi-input");
    await expect(input).toHaveAttribute("placeholder", "論理式を入力...");
    await expect(canvas.queryByTestId("fi-preview")).not.toBeInTheDocument();
    await expect(canvas.queryByTestId("fi-errors")).not.toBeInTheDocument();
  },
};

/**
 * フォントサイズのカスタマイズ。
 */
export const CustomFontSize: Story = {
  args: {
    value: "φ → ψ",
    onChange: () => {},
    testId: "fi",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <FormulaInputWrapper
        initialValue="φ → ψ"
        testId="fi-small"
        fontSize={14}
      />
      <FormulaInputWrapper
        initialValue="φ → ψ"
        testId="fi-large"
        fontSize={24}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 小さいサイズ
    const small = canvas.getByTestId("fi-small");
    await expect(small.style.fontSize).toBe("14px");

    // 大きいサイズ
    const large = canvas.getByTestId("fi-large");
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
    testId: "fi",
  },
  render: () => <FormulaInputWrapper initialValue="→" testId="fi" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId("fi-input");

    // 初期状態: エラー
    await expect(canvas.getByTestId("fi-errors")).toBeInTheDocument();
    await expect(input).toHaveAttribute("aria-invalid", "true");

    // テキストをクリアして有効な式を入力
    await userEvent.clear(input);
    await userEvent.type(input, "φ");

    // エラーが消えてプレビューが表示される
    await expect(canvas.queryByTestId("fi-errors")).not.toBeInTheDocument();
    await expect(canvas.getByTestId("fi-preview")).toBeInTheDocument();
    await expect(canvas.getByTestId("fi-formula")).toHaveTextContent("φ");
  },
};
