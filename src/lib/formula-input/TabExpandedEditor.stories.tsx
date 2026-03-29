/**
 * タブロー拡大エディタのストーリー。
 *
 * 論理式リストを FormulaListEditor で編集し、リアルタイムプレビュー付きで構成する。
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { TabExpandedEditor } from "./TabExpandedEditor";

// --- Wrapper ---

function TabEditorWrapper({
  initialValue = "",
  testId = "tab-editor",
  onOpenSyntaxHelp,
  initialFormulas,
}: {
  readonly initialValue?: string;
  readonly testId?: string;
  readonly onOpenSyntaxHelp?: () => void;
  readonly initialFormulas?: readonly string[];
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
    <TabExpandedEditor
      value={value}
      onChange={setValue}
      onClose={() => {
        setClosed(true);
      }}
      onOpenSyntaxHelp={onOpenSyntaxHelp}
      initialFormulas={initialFormulas}
      testId={testId}
    />
  );
}

const meta = {
  title: "FormulaInput/TabExpandedEditor",
  component: TabEditorWrapper,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TabEditorWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- ストーリー ---

/** 空の状態 */
export const Empty: Story = {
  render: () => <TabEditorWrapper />,
  play: async ({ canvasElement }) => {
    const root = within(canvasElement.ownerDocument.body);
    // 論理式セクションが表示されている
    await expect(
      root.getByTestId("tab-editor-formulas-label"),
    ).toBeInTheDocument();
    // プレビューが表示されている
    await expect(root.getByTestId("tab-editor-preview")).toBeInTheDocument();
  },
};

/** 既存の論理式リストを編集 */
export const WithExistingFormulas: Story = {
  render: () => (
    <TabEditorWrapper initialValue="phi -> psi, psi -> chi, phi -> chi" />
  ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement.ownerDocument.body);
    // 3つの論理式がリストにある
    await expect(
      root.getByTestId("tab-editor-formulas-item-0"),
    ).toBeInTheDocument();
    await expect(
      root.getByTestId("tab-editor-formulas-item-1"),
    ).toBeInTheDocument();
    await expect(
      root.getByTestId("tab-editor-formulas-item-2"),
    ).toBeInTheDocument();
    // プレビューに論理式が表示されている
    await expect(
      root.getByTestId("tab-editor-preview-formulas"),
    ).toBeInTheDocument();
  },
};

/** initialFormulas prop を使用（パースをスキップ） */
export const WithInitialFormulas: Story = {
  render: () => (
    <TabEditorWrapper
      initialValue="phi, psi"
      initialFormulas={["phi", "psi"]}
    />
  ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement.ownerDocument.body);
    // 2つの論理式がリストにある
    await expect(
      root.getByTestId("tab-editor-formulas-item-0"),
    ).toBeInTheDocument();
    await expect(
      root.getByTestId("tab-editor-formulas-item-1"),
    ).toBeInTheDocument();
  },
};

/** 閉じるボタンで閉じる */
export const CloseButton: Story = {
  render: () => <TabEditorWrapper />,
  play: async ({ canvasElement }) => {
    const root = within(canvasElement.ownerDocument.body);
    const canvas = within(canvasElement);
    const closeButton = root.getByTestId("tab-editor-close");
    await userEvent.click(closeButton);
    await waitFor(() => {
      expect(canvas.getByTestId("closed-state")).toBeInTheDocument();
    });
  },
};

/** Escapeキーでモーダルを閉じる */
export const EscapeToClose: Story = {
  render: () => <TabEditorWrapper />,
  play: async ({ canvasElement }) => {
    const root = within(canvasElement.ownerDocument.body);
    const canvas = within(canvasElement);
    await expect(
      root.getByTestId("tab-editor-formulas-label"),
    ).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(canvas.getByTestId("closed-state")).toBeInTheDocument();
    });
  },
};

/** オーバーレイクリックで閉じる */
export const OverlayClickToClose: Story = {
  render: () => <TabEditorWrapper />,
  play: async ({ canvasElement }) => {
    const root = within(canvasElement.ownerDocument.body);
    const canvas = within(canvasElement);
    const overlay = root.getByTestId("tab-editor");
    await userEvent.click(overlay);
    await waitFor(() => {
      expect(canvas.getByTestId("closed-state")).toBeInTheDocument();
    });
  },
};

/** 構文ヘルプボタン付き */
export const WithSyntaxHelp: Story = {
  render: () => (
    <TabEditorWrapper
      onOpenSyntaxHelp={() => {
        /* noop for story */
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement.ownerDocument.body);
    const syntaxHelpButton = root.getByTestId("tab-editor-syntax-help");
    await expect(syntaxHelpButton).toBeInTheDocument();
    await userEvent.click(syntaxHelpButton);
  },
};

/** testIdなしで描画 */
export const WithoutTestId: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <TabExpandedEditor value={value} onChange={setValue} onClose={() => {}} />
    );
  },
  play: async ({ canvasElement }) => {
    const root = within(canvasElement.ownerDocument.body);
    const dialog = root.getByRole("dialog");
    await expect(dialog).toBeInTheDocument();
    await expect(dialog).toHaveAttribute("aria-label", "論理式リストエディタ");
  },
};
