import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import type { Formula } from "../logic-core/formula";
import { FormulaEditor } from "./FormulaEditor";

// --- Wrapper: 制御コンポーネント用ステート管理 ---

function FormulaEditorWrapper({
  initialValue = "",
  displayRenderer,
  placeholder,
  testId = "editor",
}: {
  readonly initialValue?: string;
  readonly displayRenderer?: "unicode" | "katex";
  readonly placeholder?: string;
  readonly testId?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [parsedTag, setParsedTag] = useState<string>("");

  const handleParsed = (formula: Formula) => {
    setParsedTag(formula._tag);
  };

  return (
    <div style={{ width: 400 }}>
      <FormulaEditor
        value={value}
        onChange={setValue}
        onParsed={handleParsed}
        displayRenderer={displayRenderer}
        placeholder={placeholder}
        testId={testId}
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
  title: "FormulaInput/FormulaEditor",
  component: FormulaEditor,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof FormulaEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- ストーリー ---

/**
 * Unicode表示モードの初期状態。クリックで編集モードに切り替わる。
 */
export const UnicodeDisplay: Story = {
  args: {
    value: "φ → ψ",
    onChange: () => {},
    testId: "editor",
  },
  render: () => (
    <FormulaEditorWrapper initialValue="φ → ψ" testId="editor" />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 表示モードで Unicode レンダラーが表示されている
    const display = canvas.getByTestId("editor-display");
    await expect(display).toBeInTheDocument();

    const unicode = canvas.getByTestId("editor-unicode");
    await expect(unicode).toHaveTextContent("φ → ψ");

    // クリックで編集モードに切り替わる
    await userEvent.click(display);
    await expect(canvas.getByTestId("editor-edit")).toBeInTheDocument();

    // 入力欄にフォーカスが当たっている
    const input = canvas.getByTestId("editor-input-input");
    await expect(input).toHaveValue("φ → ψ");
  },
};

/**
 * KaTeX表示モード。
 */
export const KaTeXDisplay: Story = {
  args: {
    value: "φ → ψ",
    onChange: () => {},
    testId: "editor",
  },
  render: () => (
    <FormulaEditorWrapper
      initialValue="∀x. P(x) → ∃y. Q(x, y)"
      displayRenderer="katex"
      testId="editor"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 表示モードで KaTeX レンダラーが表示されている
    const display = canvas.getByTestId("editor-display");
    await expect(display).toBeInTheDocument();

    const katex = canvas.getByTestId("editor-katex");
    await expect(katex).toBeInTheDocument();
  },
};

/**
 * モード切替フロー: 表示→編集→入力→表示。
 */
export const ModeToggle: Story = {
  args: {
    value: "φ",
    onChange: () => {},
    testId: "editor",
  },
  render: () => <FormulaEditorWrapper initialValue="φ" testId="editor" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1. 表示モード
    const display = canvas.getByTestId("editor-display");
    await expect(display).toBeInTheDocument();

    // 2. クリックで編集モードに
    await userEvent.click(display);
    const edit = canvas.getByTestId("editor-edit");
    await expect(edit).toBeInTheDocument();

    // 3. テキストを変更
    const input = canvas.getByTestId("editor-input-input");
    await userEvent.clear(input);
    await userEvent.type(input, "φ → ψ");

    // 4. Tabで外に移動（blur発火）
    await userEvent.tab();

    // 5. 表示モードに戻る
    await expect(canvas.getByTestId("editor-display")).toBeInTheDocument();
    await expect(canvas.getByTestId("editor-unicode")).toHaveTextContent("φ → ψ");
  },
};

/**
 * エラー時の挙動: パースエラーでは編集モードに留まる。
 */
export const ErrorStaysInEditMode: Story = {
  args: {
    value: "φ",
    onChange: () => {},
    testId: "editor",
  },
  render: () => <FormulaEditorWrapper initialValue="φ" testId="editor" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 編集モードに入る
    const display = canvas.getByTestId("editor-display");
    await userEvent.click(display);

    // エラーのある入力にする
    const input = canvas.getByTestId("editor-input-input");
    await userEvent.clear(input);
    await userEvent.type(input, "→");

    // blur（Tab）
    await userEvent.tab();

    // パースエラーなので編集モードに留まる
    await expect(canvas.getByTestId("editor-edit")).toBeInTheDocument();
  },
};

/**
 * 空の状態。プレースホルダーが表示される。
 */
export const EmptyState: Story = {
  args: {
    value: "",
    onChange: () => {},
    testId: "editor",
  },
  render: () => <FormulaEditorWrapper testId="editor" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // プレースホルダーが表示されている
    const placeholder = canvas.getByTestId("editor-placeholder");
    await expect(placeholder).toBeInTheDocument();
    await expect(placeholder).toHaveTextContent("クリックして論理式を入力...");

    // クリックで編集モードに入れる
    const display = canvas.getByTestId("editor-display");
    await userEvent.click(display);
    await expect(canvas.getByTestId("editor-edit")).toBeInTheDocument();
  },
};

/**
 * Escapeキーでのモード切替。
 */
export const EscapeToDisplay: Story = {
  args: {
    value: "φ → ψ",
    onChange: () => {},
    testId: "editor",
  },
  render: () => (
    <FormulaEditorWrapper initialValue="φ → ψ" testId="editor" />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 編集モードに入る
    const display = canvas.getByTestId("editor-display");
    await userEvent.click(display);
    await expect(canvas.getByTestId("editor-edit")).toBeInTheDocument();

    // Escapeで表示モードに戻る
    await userEvent.keyboard("{Escape}");
    await expect(canvas.getByTestId("editor-display")).toBeInTheDocument();
  },
};

/**
 * onParsedコールバック連携。
 */
export const WithParsedCallback: Story = {
  args: {
    value: "",
    onChange: () => {},
    testId: "editor",
  },
  render: () => <FormulaEditorWrapper testId="editor" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 編集モードに入る
    await userEvent.click(canvas.getByTestId("editor-display"));

    // 論理式を入力
    const input = canvas.getByTestId("editor-input-input");
    await userEvent.type(input, "φ → ψ");

    // AST種類が表示される
    await expect(canvas.getByTestId("parsed-tag")).toHaveTextContent(
      "AST: Implication",
    );

    // blur で表示モードに戻る
    await userEvent.tab();
    await expect(canvas.getByTestId("editor-display")).toBeInTheDocument();
  },
};
