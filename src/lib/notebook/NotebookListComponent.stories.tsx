import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, within, userEvent } from "storybook/test";
import { NotebookList } from "./NotebookListComponent";
import type { NotebookListItem } from "./notebookListLogic";

const makeItem = (
  id: string,
  name: string,
  mode: "free" | "quest" = "free",
  systemName = "Łukasiewicz",
  updatedAtLabel = "たった今",
  createdAtLabel = "1日前",
): NotebookListItem => ({
  id,
  name,
  systemName,
  mode,
  updatedAtLabel,
  createdAtLabel,
});

const meta = {
  title: "Notebook/NotebookList",
  component: NotebookList,
  args: {
    onOpen: fn(),
    onDelete: fn(),
    onDuplicate: fn(),
    onRename: fn(),
    onConvertToFree: fn(),
  },
} satisfies Meta<typeof NotebookList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    items: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("notebook-list-empty")).toBeInTheDocument();
    await expect(canvas.getByText(/ノートがありません/)).toBeInTheDocument();
  },
};

export const SingleItem: Story = {
  args: {
    items: [makeItem("nb-1", "はじめてのノート")],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("はじめてのノート")).toBeInTheDocument();
    await expect(canvas.getByText("Łukasiewicz")).toBeInTheDocument();
    await expect(canvas.getByText("自由帳")).toBeInTheDocument();
  },
};

export const MultipleItems: Story = {
  args: {
    items: [
      makeItem("nb-1", "命題論理の証明", "free", "Łukasiewicz", "5分前"),
      makeItem(
        "nb-2",
        "述語論理チャレンジ",
        "quest",
        "Predicate Logic",
        "1時間前",
      ),
      makeItem(
        "nb-3",
        "等号付き論理",
        "free",
        "Predicate Logic with Equality",
        "3日前",
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("命題論理の証明")).toBeInTheDocument();
    await expect(canvas.getByText("述語論理チャレンジ")).toBeInTheDocument();
    await expect(canvas.getByText("等号付き論理")).toBeInTheDocument();
    // クエストモードには自由帳化ボタンがある
    await expect(canvas.getByTestId("convert-btn-nb-2")).toBeInTheDocument();
  },
};

export const DeleteAction: Story = {
  args: {
    items: [makeItem("nb-1", "削除対象ノート")],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // 削除ボタンクリックで確認UIが表示される
    await userEvent.click(canvas.getByTestId("delete-btn-nb-1"));
    await expect(canvas.getByTestId("delete-confirm-nb-1")).toBeInTheDocument();
    await expect(canvas.getByText("本当に削除しますか？")).toBeInTheDocument();
    // まだ削除されていない
    await expect(args.onDelete).not.toHaveBeenCalled();
    // 確認ボタンで削除
    await userEvent.click(canvas.getByTestId("delete-confirm-btn-nb-1"));
    await expect(args.onDelete).toHaveBeenCalledWith("nb-1");
  },
};

export const DeleteCancel: Story = {
  args: {
    items: [makeItem("nb-1", "キャンセルテスト")],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // 削除ボタンクリックで確認UIが表示される
    await userEvent.click(canvas.getByTestId("delete-btn-nb-1"));
    await expect(canvas.getByTestId("delete-confirm-nb-1")).toBeInTheDocument();
    // キャンセルで確認UIが消える
    await userEvent.click(canvas.getByTestId("delete-cancel-btn-nb-1"));
    await expect(canvas.queryByTestId("delete-confirm-nb-1")).toBeNull();
    await expect(args.onDelete).not.toHaveBeenCalled();
  },
};

export const DuplicateAction: Story = {
  args: {
    items: [makeItem("nb-1", "複製対象ノート")],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId("duplicate-btn-nb-1"));
    await expect(args.onDuplicate).toHaveBeenCalledWith("nb-1");
  },
};

export const RenameAction: Story = {
  args: {
    items: [makeItem("nb-1", "名前変更テスト")],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // 名前変更ボタンをクリック
    await userEvent.click(canvas.getByTestId("rename-btn-nb-1"));
    // 入力フィールドが表示される
    const input = canvas.getByTestId("rename-input");
    await expect(input).toBeInTheDocument();
    // 新しい名前を入力
    await userEvent.clear(input);
    await userEvent.type(input, "新しい名前");
    await userEvent.keyboard("{Enter}");
    await expect(args.onRename).toHaveBeenCalledWith("nb-1", "新しい名前");
  },
};

export const OpenAction: Story = {
  args: {
    items: [makeItem("nb-1", "開くテスト")],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId("notebook-item-nb-1"));
    await expect(args.onOpen).toHaveBeenCalledWith("nb-1");
  },
};
