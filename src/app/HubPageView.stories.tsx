import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, within, userEvent } from "storybook/test";
import { HubPageView } from "./HubPageView";
import type { NotebookListItem } from "../lib/notebook";
import type { CategoryGroup, QuestNotebookCounts } from "../lib/quest";
import { builtinQuests, buildCatalogByCategory } from "../lib/quest";
import { createEmptyProgress } from "../lib/quest";
import { ThemeProvider } from "../lib/theme/ThemeProvider";

// --- Sample Data ---

const sampleNotebooks: readonly NotebookListItem[] = [
  {
    id: "notebook-1",
    name: "My First Proof",
    systemName: "Lukasiewicz",
    mode: "free",
    updatedAtLabel: "2 hours ago",
    createdAtLabel: "3 days ago",
  },
  {
    id: "notebook-2",
    name: "PA Arithmetic Practice",
    systemName: "PA (Standard)",
    mode: "quest",
    questId: "prop-01",
    updatedAtLabel: "1 day ago",
    createdAtLabel: "1 week ago",
  },
  {
    id: "notebook-3",
    name: "Group Theory Exploration",
    systemName: "Group (Left)",
    mode: "free",
    updatedAtLabel: "5 minutes ago",
    createdAtLabel: "Today",
  },
];

const sampleNotebookCounts: QuestNotebookCounts = new Map([
  ["prop-01", 1],
  ["prop-02", 2],
]);

const sampleGroups: readonly CategoryGroup[] = buildCatalogByCategory(
  builtinQuests,
  createEmptyProgress(),
);

// --- Meta ---

const meta: Meta<typeof HubPageView> = {
  title: "Pages/Hub",
  component: HubPageView,
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onOpenNotebook: fn(),
    onDeleteNotebook: fn(),
    onDuplicateNotebook: fn(),
    onRenameNotebook: fn(),
    onConvertToFree: fn(),
    onStartQuest: fn(),
    onCreateNotebook: fn(),
    languageToggle: { locale: "en", onLocaleChange: fn() },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// --- Stories ---

/** 空のノートブック一覧。ヒーローメッセージが表示される */
export const EmptyNotebooks: Story = {
  args: {
    listItems: [],
    groups: sampleGroups,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // ヒーローメッセージの確認
    await expect(canvas.getByText("No notebooks yet")).toBeInTheDocument();
    await expect(canvas.getByText("Formal Logic Pad")).toBeInTheDocument();
    // タブが表示されている
    await expect(canvas.getByText("Notebooks")).toBeInTheDocument();
    await expect(canvas.getByText("Quests")).toBeInTheDocument();
  },
};

/** ノートブック一覧に複数のノートがある状態 */
export const WithNotebooks: Story = {
  args: {
    listItems: sampleNotebooks,
    groups: sampleGroups,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // ノートブック名が表示される
    await expect(canvas.getByText("My First Proof")).toBeInTheDocument();
    await expect(
      canvas.getByText("PA Arithmetic Practice"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByText("Group Theory Exploration"),
    ).toBeInTheDocument();
  },
};

/** クエストタブに切り替える */
export const QuestsTab: Story = {
  args: {
    listItems: sampleNotebooks,
    groups: sampleGroups,
    initialTab: "quests",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // クエストカタログが表示される（カテゴリ名の確認）
    // builtinQuests に含まれるカテゴリが表示されているはず
    await expect(canvas.getByText("Quests")).toBeInTheDocument();
  },
};

/** タブ切り替えのインタラクション */
export const TabSwitch: Story = {
  args: {
    listItems: sampleNotebooks,
    groups: sampleGroups,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 最初はNotebooksタブ
    await expect(canvas.getByText("My First Proof")).toBeInTheDocument();

    // Questsタブに切り替え
    await userEvent.click(canvas.getByText("Quests"));
    // ノートブック一覧は非表示になる
    await expect(canvas.queryByText("My First Proof")).not.toBeInTheDocument();

    // Notebooksタブに戻す
    await userEvent.click(canvas.getByText("Notebooks"));
    await expect(canvas.getByText("My First Proof")).toBeInTheDocument();
  },
};

/** 新規作成フォームへの遷移 */
export const CreateNotebookForm: Story = {
  args: {
    listItems: [],
    groups: sampleGroups,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // "+ New Notebook" ボタンをクリック
    const buttons = canvas.getAllByText("+ New Notebook");
    // ヒーロー内にもボタンがあるので最初のものをクリック
    await userEvent.click(buttons[0]!);

    // 作成フォームが表示される（キャンセルボタンの確認）
    await expect(canvas.getByTestId("create-cancel-btn")).toBeInTheDocument();
  },
};

/** クエストタブからノートブックフィルタ表示（notebookCounts付き） */
export const QuestNotebookFilter: Story = {
  args: {
    listItems: sampleNotebooks,
    groups: sampleGroups,
    initialTab: "quests",
    notebookCounts: sampleNotebookCounts,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // クエストタブでノートブック数バッジが表示される
    await expect(canvas.getByTestId("quest-catalog")).toBeInTheDocument();
    // prop-01のノート数バッジをクリック→ノートブックタブに切り替わりフィルタ表示
    const badge = canvas.getByTestId("notebook-count-prop-01");
    await userEvent.click(badge);
    // フィルタバナーが表示される
    await expect(
      canvas.getByTestId("quest-filter-banner"),
    ).toBeInTheDocument();
    // フィルタされたノートブックが表示（prop-01に紐づくnotebook-2のみ）
    await expect(
      canvas.getByText("PA Arithmetic Practice"),
    ).toBeInTheDocument();
    await expect(canvas.queryByText("My First Proof")).not.toBeInTheDocument();
    // フィルタ解除で全ノートブックが表示される
    await userEvent.click(canvas.getByTestId("clear-quest-filter"));
    await expect(canvas.queryByTestId("quest-filter-banner")).toBeNull();
    await expect(canvas.getByText("My First Proof")).toBeInTheDocument();
  },
};
