import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { TermExpandedEditor } from "./TermExpandedEditor";

// --- Wrapper ---

function ExpandedEditorWrapper({
  initialValue = "",
  testId = "expanded",
  onOpenSyntaxHelp,
}: {
  readonly initialValue?: string;
  readonly testId?: string;
  readonly onOpenSyntaxHelp?: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [closed, setClosed] = useState(false);

  if (closed) {
    return (
      <div data-testid="closed-state" style={{ padding: 24 }}>
        エディタは閉じられました（最終値: {value}）
      </div>
    );
  }

  return (
    <TermExpandedEditor
      value={value}
      onChange={setValue}
      onClose={() => setClosed(true)}
      onOpenSyntaxHelp={onOpenSyntaxHelp}
      testId={testId}
    />
  );
}

const meta = {
  title: "FormulaInput/TermExpandedEditor",
  component: TermExpandedEditor,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TermExpandedEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- ストーリー ---

/**
 * デフォルト: 空の拡大エディタ。
 */
export const Default: Story = {
  args: {
    value: "",
    onChange: () => {},
    onClose: () => {},
    testId: "expanded",
  },
  render: () => <ExpandedEditorWrapper testId="expanded" />,
  play: async ({ canvasElement }) => {
    const root = within(canvasElement.ownerDocument.body);

    await expect(root.getByTestId("expanded")).toBeInTheDocument();
    await expect(root.getByTestId("expanded-textarea")).toBeInTheDocument();
    await expect(root.getByTestId("expanded-preview")).toBeInTheDocument();
    await expect(root.getByTestId("expanded-close")).toBeInTheDocument();
  },
};

/**
 * 項入力済み: プレビューが表示される。
 */
export const WithTerm: Story = {
  args: {
    value: "f(x, y)",
    onChange: () => {},
    onClose: () => {},
    testId: "expanded",
  },
  render: () => (
    <ExpandedEditorWrapper initialValue="f(x, y)" testId="expanded" />
  ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement.ownerDocument.body);

    const textarea = root.getByTestId("expanded-textarea");
    await expect(textarea).toHaveValue("f(x, y)");

    // プレビューが表示される
    await waitFor(() => {
      expect(root.getByTestId("expanded-preview-term")).toBeInTheDocument();
    });
  },
};

/**
 * エラー表示: パースエラーの場合。
 */
export const WithError: Story = {
  args: {
    value: "f(",
    onChange: () => {},
    onClose: () => {},
    testId: "expanded",
  },
  render: () => <ExpandedEditorWrapper initialValue="f(" testId="expanded" />,
  play: async ({ canvasElement }) => {
    const root = within(canvasElement.ownerDocument.body);

    await waitFor(() => {
      expect(root.getByTestId("expanded-errors")).toBeInTheDocument();
    });

    // textareaにエラースタイルが適用される
    const textarea = root.getByTestId("expanded-textarea");
    await expect(textarea).toHaveAttribute("aria-invalid", "true");
  },
};

/**
 * インタラクティブ: 入力→プレビュー更新→閉じるフロー。
 */
export const Interactive: Story = {
  args: {
    value: "",
    onChange: () => {},
    onClose: () => {},
    testId: "expanded",
  },
  render: () => <ExpandedEditorWrapper testId="expanded" />,
  play: async ({ canvasElement }) => {
    const root = within(canvasElement.ownerDocument.body);

    // テキストを入力
    const textarea = root.getByTestId("expanded-textarea");
    await userEvent.type(textarea, "f(x)");

    // プレビューが表示される
    await waitFor(() => {
      expect(root.getByTestId("expanded-preview-term")).toBeInTheDocument();
    });

    // 閉じるボタンでモーダルを閉じる
    await userEvent.click(root.getByTestId("expanded-close"));

    // 閉じた状態の表示
    await waitFor(() => {
      expect(root.getByTestId("closed-state")).toBeInTheDocument();
    });
  },
};

/**
 * 構文ヘルプボタン付き。
 */
export const WithSyntaxHelp: Story = {
  args: {
    value: "",
    onChange: () => {},
    onClose: () => {},
    testId: "expanded",
  },
  render: () => (
    <ExpandedEditorWrapper
      testId="expanded"
      onOpenSyntaxHelp={() => {
        /* noop for story */
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement.ownerDocument.body);

    // 構文ヘルプボタンが表示される
    await expect(root.getByTestId("expanded-syntax-help")).toBeInTheDocument();
  },
};

/**
 * シンタックスハイライト: 正しい入力でハイライトが表示される。
 */
export const SyntaxHighlight: Story = {
  args: {
    value: "f(x, g(y))",
    onChange: () => {},
    onClose: () => {},
    testId: "expanded",
  },
  render: () => (
    <ExpandedEditorWrapper initialValue="f(x, g(y))" testId="expanded" />
  ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement.ownerDocument.body);

    // シンタックスハイライトが表示される
    await waitFor(() => {
      expect(root.getByTestId("expanded-syntax-highlight")).toBeInTheDocument();
    });
  },
};
