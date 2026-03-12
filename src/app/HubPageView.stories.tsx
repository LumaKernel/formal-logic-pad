import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, within, userEvent } from "storybook/test";
import { allReferenceEntries } from "../lib/reference/referenceContent";
import { HubPageView, type HubTab, type RecommendedQuest } from "./HubPageView";
import type { NotebookListItem } from "../lib/notebook";
import type {
  CategoryGroup,
  QuestNotebookCounts,
  QuestCatalogItem,
} from "../lib/quest";
import { builtinQuests, buildCatalogByCategory } from "../lib/quest";
import { createEmptyProgress } from "../lib/quest";
import type { QuestDefinition } from "../lib/quest";
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
    questProgress: { achievedCount: 1, totalCount: 3 },
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

const sampleRecommendedQuests: readonly RecommendedQuest[] = [
  { id: "prop-01", title: "φ → φ を証明しよう" },
  { id: "prop-03", title: "公理のインスタンス化" },
  { id: "prop-05", title: "K公理の二重適用" },
];

// CI上でのタイムアウト防止のため、ストーリーには先頭20件のみ使用
const sampleQuests = builtinQuests.slice(0, 20);
const sampleGroups: readonly CategoryGroup[] = buildCatalogByCategory(
  sampleQuests,
  createEmptyProgress(),
);

function makeCustomQuest(
  overrides: Partial<QuestDefinition> = {},
): QuestDefinition {
  return {
    id: "custom-1000",
    category: "propositional-basics",
    title: "自作クエスト",
    description: "自作テスト。",
    difficulty: 1,
    systemPresetId: "lukasiewicz",
    goals: [{ formulaText: "p -> p" }],
    hints: [],
    estimatedSteps: 5,
    learningPoint: "テスト",
    order: 0,
    version: 1,
    ...overrides,
  };
}

function makeCustomItem(
  overrides: Partial<QuestCatalogItem> & {
    readonly questOverrides?: Partial<QuestDefinition>;
  } = {},
): QuestCatalogItem {
  const { questOverrides, ...rest } = overrides;
  return {
    quest: makeCustomQuest(questOverrides),
    completed: false,
    completionCount: 0,
    bestStepCount: undefined,
    rating: "not-completed",
    ...rest,
  };
}

const sampleCustomQuestItems: readonly QuestCatalogItem[] = [
  makeCustomItem({
    questOverrides: {
      id: "custom-1001",
      title: "恒等律の練習（自作）",
      description: "φ → φ を証明せよ。自作バージョン。",
      difficulty: 1,
      estimatedSteps: 5,
    },
    completed: true,
    completionCount: 1,
    bestStepCount: 4,
    rating: "perfect",
  }),
  makeCustomItem({
    questOverrides: {
      id: "custom-1002",
      title: "ド・モルガンの法則（自作）",
      description: "¬(p ∧ q) → (¬p ∨ ¬q) を証明せよ。",
      difficulty: 3,
      estimatedSteps: 12,
    },
  }),
];

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
    tab: "notebooks",
    onTabChange: fn(),
    onOpenNotebook: fn(),
    onDeleteNotebook: fn(),
    onDuplicateNotebook: fn(),
    onRenameNotebook: fn(),
    onConvertToFree: fn(),
    onStartQuest: fn(),
    onCreateNotebook: fn(),
    onDuplicateCustomQuest: fn(),
    onDeleteCustomQuest: fn(),
    onEditCustomQuest: fn(),
    onCreateCustomQuest: fn(),
    onDuplicateBuiltinToCustom: fn(),
    onExportNotebook: fn(),
    onImportNotebook: fn(),
    onExportCustomQuest: fn(),
    onImportCustomQuest: fn(),
    onShareQuestUrl: fn(),
    onShowModelAnswer: fn(),
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
    await expect(canvas.getByText("Custom Quests")).toBeInTheDocument();
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

/** ノートブック一覧でクエスト進捗バッジが表示される */
export const WithQuestProgress: Story = {
  args: {
    listItems: [
      ...sampleNotebooks,
      {
        id: "notebook-4",
        name: "Completed Quest",
        systemName: "Lukasiewicz",
        mode: "quest" as const,
        questId: "prop-02",
        updatedAtLabel: "3 days ago",
        createdAtLabel: "1 week ago",
        questProgress: { achievedCount: 2, totalCount: 2 },
      },
    ],
    groups: sampleGroups,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 部分達成バッジ（1/3）
    await expect(canvas.getByText("1/3")).toBeInTheDocument();
    // 全達成バッジ（達成済み）
    await expect(canvas.getByText("達成済み")).toBeInTheDocument();
    // 自由帳にはバッジなし
    await expect(canvas.getByText("My First Proof")).toBeInTheDocument();
  },
};

/** クエストタブに切り替える */
export const QuestsTab: Story = {
  args: {
    listItems: sampleNotebooks,
    groups: sampleGroups,
    tab: "quests",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // クエストカタログが表示される（カテゴリ名の確認）
    // builtinQuests に含まれるカテゴリが表示されているはず
    await expect(canvas.getByText("Quests")).toBeInTheDocument();
  },
};

/** タブ切り替えのインタラクション（3タブ） */
export const TabSwitch: Story = {
  args: {
    listItems: sampleNotebooks,
    groups: sampleGroups,
    customQuestItems: sampleCustomQuestItems,
  },
  render: (args) => {
    const [currentTab, setCurrentTab] = useState<HubTab>("notebooks");
    return (
      <HubPageView {...args} tab={currentTab} onTabChange={setCurrentTab} />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 最初はNotebooksタブ
    await expect(canvas.getByText("My First Proof")).toBeInTheDocument();

    // Questsタブに切り替え
    await userEvent.click(canvas.getByText("Quests"));
    // ノートブック一覧は非表示になる
    await expect(canvas.queryByText("My First Proof")).not.toBeInTheDocument();
    // クエストカタログが表示される
    await expect(canvas.getByTestId("quest-catalog")).toBeInTheDocument();

    // Custom Questsタブに切り替え
    await userEvent.click(canvas.getByText("Custom Quests"));
    // クエストカタログは非表示になる
    await expect(canvas.queryByTestId("quest-catalog")).not.toBeInTheDocument();
    // 自作クエストリストが表示される
    await expect(canvas.getByTestId("custom-quest-list")).toBeInTheDocument();

    // Notebooksタブに戻す
    await userEvent.click(canvas.getByText("Notebooks"));
    await expect(canvas.getByText("My First Proof")).toBeInTheDocument();
    await expect(
      canvas.queryByTestId("custom-quest-list"),
    ).not.toBeInTheDocument();
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
    tab: "quests",
    notebookCounts: sampleNotebookCounts,
  },
  render: (args) => {
    const [currentTab, setCurrentTab] = useState<HubTab>("quests");
    return (
      <HubPageView {...args} tab={currentTab} onTabChange={setCurrentTab} />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // クエストタブでノートブック数バッジが表示される
    await expect(canvas.getByTestId("quest-catalog")).toBeInTheDocument();
    // prop-01のノート数バッジをクリック→ノートブックタブに切り替わりフィルタ表示
    const badge = canvas.getByTestId("notebook-count-prop-01");
    await userEvent.click(badge);
    // フィルタバナーが表示される
    await expect(canvas.getByTestId("quest-filter-banner")).toBeInTheDocument();
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

/** ノートブック操作のインタラクション（削除・複製・リネーム・自由帳化） */
export const NotebookActions: Story = {
  args: {
    listItems: sampleNotebooks,
    groups: sampleGroups,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // --- 複製（三点メニュー経由） ---
    await userEvent.click(canvas.getByTestId("more-btn-notebook-1"));
    await userEvent.click(canvas.getByTestId("duplicate-btn-notebook-1"));
    await expect(args.onDuplicateNotebook).toHaveBeenCalledWith("notebook-1");

    // --- リネーム（三点メニュー経由） ---
    await userEvent.click(canvas.getByTestId("more-btn-notebook-1"));
    await userEvent.click(canvas.getByTestId("rename-btn-notebook-1"));
    const renameInput = canvas.getByTestId("rename-input");
    await userEvent.clear(renameInput);
    await userEvent.type(renameInput, "Renamed Proof");
    await userEvent.keyboard("{Enter}");
    await expect(args.onRenameNotebook).toHaveBeenCalledWith(
      "notebook-1",
      "Renamed Proof",
    );

    // --- 自由帳として複製（三点メニュー経由、questモードのnotebook-2のみ表示） ---
    await userEvent.click(canvas.getByTestId("more-btn-notebook-2"));
    await userEvent.click(canvas.getByTestId("convert-btn-notebook-2"));
    await expect(args.onConvertToFree).toHaveBeenCalledWith("notebook-2");

    // --- 削除（三点メニュー経由、確認ダイアログ付き） ---
    await userEvent.click(canvas.getByTestId("more-btn-notebook-3"));
    await userEvent.click(canvas.getByTestId("delete-btn-notebook-3"));
    // 確認ダイアログが表示される
    await expect(
      canvas.getByTestId("delete-confirm-notebook-3"),
    ).toBeInTheDocument();
    // キャンセルで閉じる
    await userEvent.click(canvas.getByTestId("delete-cancel-btn-notebook-3"));
    await expect(
      canvas.queryByTestId("delete-confirm-notebook-3"),
    ).not.toBeInTheDocument();

    // 再度削除→今度は確定（三点メニュー経由）
    await userEvent.click(canvas.getByTestId("more-btn-notebook-3"));
    await userEvent.click(canvas.getByTestId("delete-btn-notebook-3"));
    await userEvent.click(canvas.getByTestId("delete-confirm-btn-notebook-3"));
    await expect(args.onDeleteNotebook).toHaveBeenCalledWith("notebook-3");
  },
};

/** クエスト開始のインタラクション */
export const QuestStart: Story = {
  args: {
    listItems: sampleNotebooks,
    groups: sampleGroups,
    tab: "quests",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // クエストカタログが表示される
    await expect(canvas.getByTestId("quest-catalog")).toBeInTheDocument();
    // 最初のクエスト開始ボタンをクリック
    const startBtn = canvas.getByTestId("start-btn-prop-01");
    await userEvent.click(startBtn);
    await expect(args.onStartQuest).toHaveBeenCalledWith("prop-01");
  },
};

/** 自作クエストタブに自作クエストが表示される */
export const WithCustomQuests: Story = {
  args: {
    listItems: sampleNotebooks,
    groups: sampleGroups,
    customQuestItems: sampleCustomQuestItems,
    tab: "custom-quests",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // 自作クエストセクションが表示される
    await expect(canvas.getByTestId("custom-quest-list")).toBeInTheDocument();
    await expect(canvas.getByText("自作クエスト")).toBeInTheDocument();
    await expect(canvas.getByText("1 / 2")).toBeInTheDocument();
    // 自作クエストのアイテムが表示される
    await expect(canvas.getByText("恒等律の練習（自作）")).toBeInTheDocument();
    await expect(
      canvas.getByText("ド・モルガンの法則（自作）"),
    ).toBeInTheDocument();
    // 自作クエストの開始ボタンが動作する
    await userEvent.click(
      canvas.getByTestId("custom-quest-start-btn-custom-1002"),
    );
    await expect(args.onStartQuest).toHaveBeenCalledWith("custom-1002");
    // 編集・複製・削除ボタンが表示されている
    await expect(
      canvas.getByTestId("custom-quest-edit-btn-custom-1001"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("custom-quest-duplicate-btn-custom-1001"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("custom-quest-delete-btn-custom-1001"),
    ).toBeInTheDocument();
    // 新規作成ボタンが表示されている
    await expect(
      canvas.getByTestId("custom-quest-create-btn"),
    ).toBeInTheDocument();
  },
};

/** クエストタブでビルトインクエストの「自作に複製」が動作する */
export const DuplicateBuiltinToCustom: Story = {
  args: {
    listItems: sampleNotebooks,
    groups: sampleGroups,
    customQuestItems: sampleCustomQuestItems,
    tab: "quests",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // ビルトインクエストの三点リーダーメニューを開く
    await userEvent.click(canvas.getByTestId("quest-more-btn-prop-01"));
    // メニュー内の「自作に複製」ボタンが表示される
    await expect(
      canvas.getByTestId("duplicate-to-custom-btn-prop-01"),
    ).toBeInTheDocument();
    // 「自作に複製」ボタンをクリック
    await userEvent.click(
      canvas.getByTestId("duplicate-to-custom-btn-prop-01"),
    );
    await expect(args.onDuplicateBuiltinToCustom).toHaveBeenCalledWith(
      "prop-01",
    );
  },
};

/** 自作クエストが空の状態 */
export const WithEmptyCustomQuests: Story = {
  args: {
    listItems: sampleNotebooks,
    groups: sampleGroups,
    customQuestItems: [],
    tab: "custom-quests",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("custom-quest-list")).toBeInTheDocument();
    await expect(
      canvas.getByTestId("custom-quest-list-empty"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByText("自作クエストはまだありません。"),
    ).toBeInTheDocument();
  },
};

/** URL共有で受け取ったクエストのダイアログ表示 */
export const SharedQuestDialog: Story = {
  args: {
    listItems: sampleNotebooks,
    groups: sampleGroups,
    sharedQuest: makeCustomQuest({
      id: "custom-shared-1",
      title: "共有されたクエスト",
      description: "URLで共有された自作クエスト。",
      difficulty: 2,
      estimatedSteps: 8,
      goals: [{ formulaText: "p -> p" }, { formulaText: "(p -> q) -> p -> q" }],
    }),
    onSharedQuestStart: fn(),
    onSharedQuestAddToCollection: fn(),
    onSharedQuestDismiss: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // ダイアログが表示されること
    await expect(canvas.getByTestId("shared-quest-dialog")).toBeInTheDocument();
    // タイトルが表示される
    await expect(canvas.getByText("共有されたクエスト")).toBeInTheDocument();
    // 説明が表示される
    await expect(
      canvas.getByText("URLで共有された自作クエスト。"),
    ).toBeInTheDocument();
    // 3つのアクションボタンが表示される
    await expect(
      canvas.getByTestId("shared-quest-start-btn"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("shared-quest-add-btn"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("shared-quest-dismiss-btn"),
    ).toBeInTheDocument();
  },
};

/** 共有クエストダイアログのアクション（開始） */
export const SharedQuestStart: Story = {
  args: {
    listItems: sampleNotebooks,
    groups: sampleGroups,
    sharedQuest: makeCustomQuest({
      id: "custom-shared-2",
      title: "開始テスト",
      description: "テスト。",
    }),
    onSharedQuestStart: fn(),
    onSharedQuestAddToCollection: fn(),
    onSharedQuestDismiss: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId("shared-quest-start-btn"));
    await expect(args.onSharedQuestStart).toHaveBeenCalled();
  },
};

/** 共有クエストダイアログのアクション（自作に追加） */
export const SharedQuestAddToCollection: Story = {
  args: {
    listItems: sampleNotebooks,
    groups: sampleGroups,
    sharedQuest: makeCustomQuest({
      id: "custom-shared-3",
      title: "追加テスト",
      description: "テスト。",
    }),
    onSharedQuestStart: fn(),
    onSharedQuestAddToCollection: fn(),
    onSharedQuestDismiss: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId("shared-quest-add-btn"));
    await expect(args.onSharedQuestAddToCollection).toHaveBeenCalled();
  },
};

/** 共有クエストダイアログのアクション（閉じる） */
export const SharedQuestDismiss: Story = {
  args: {
    listItems: sampleNotebooks,
    groups: sampleGroups,
    sharedQuest: makeCustomQuest({
      id: "custom-shared-4",
      title: "キャンセルテスト",
      description: "テスト。",
    }),
    onSharedQuestStart: fn(),
    onSharedQuestAddToCollection: fn(),
    onSharedQuestDismiss: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId("shared-quest-dismiss-btn"));
    await expect(args.onSharedQuestDismiss).toHaveBeenCalled();
  },
};

/** ノートブック一覧でエクスポートメニューが動作する */
export const NotebookExport: Story = {
  args: {
    listItems: sampleNotebooks,
    groups: sampleGroups,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // 三点メニューを開いてエクスポートを確認
    await userEvent.click(canvas.getByTestId("more-btn-notebook-1"));
    await expect(
      canvas.getByTestId("export-btn-notebook-1"),
    ).toBeInTheDocument();
    await userEvent.click(canvas.getByTestId("export-btn-notebook-1"));
    await expect(args.onExportNotebook).toHaveBeenCalledWith("notebook-1");
  },
};

/** インポートボタンが表示される */
export const NotebookImport: Story = {
  args: {
    listItems: sampleNotebooks,
    groups: sampleGroups,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // インポートボタンが表示される
    await expect(canvas.getByTestId("import-notebook-btn")).toBeInTheDocument();
  },
};

/** ノートブック作成フォームの送信 */
export const CreateNotebookSubmit: Story = {
  args: {
    listItems: [],
    groups: sampleGroups,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // ヒーローの作成ボタンをクリック
    const buttons = canvas.getAllByText("+ New Notebook");
    await userEvent.click(buttons[0]!);

    // フォームが表示される
    await expect(
      canvas.getByTestId("notebook-create-form"),
    ).toBeInTheDocument();

    // 名前を入力
    const nameInput = canvas.getByTestId("create-name-input");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "New Logic Proof");

    // 送信
    await userEvent.click(canvas.getByTestId("create-submit-btn"));
    await expect(args.onCreateNotebook).toHaveBeenCalled();
  },
};

/** ランディングページ表示（ノートブック0件・初回訪問） */
export const Landing: Story = {
  args: {
    listItems: [],
    groups: sampleGroups,
    showLanding: true,
    recommendedQuests: sampleRecommendedQuests,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // ランディングページが表示される
    await expect(canvas.getByTestId("landing-page")).toBeInTheDocument();
    // タイトルが表示される（ヘッダーとランディングの両方に存在）
    const titles = canvas.getAllByText("Formal Logic Pad");
    await expect(titles.length).toBeGreaterThanOrEqual(2);
    // アクションボタンが表示される
    await expect(canvas.getByTestId("landing-start-free")).toBeInTheDocument();
    await expect(
      canvas.getByTestId("landing-explore-quests"),
    ).toBeInTheDocument();
    // おすすめクエストが表示される
    await expect(
      canvas.getByTestId("landing-quest-prop-01"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("landing-quest-prop-03"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("landing-quest-prop-05"),
    ).toBeInTheDocument();
    // タブバーは表示されない（ランディング表示中）
    await expect(canvas.queryByText("Notebooks")).not.toBeInTheDocument();
    await expect(canvas.queryByText("Quests")).not.toBeInTheDocument();
  },
};

/** ランディングページから「自由に証明する」をクリック → 作成フォーム表示 */
export const LandingStartFreeProof: Story = {
  args: {
    listItems: [],
    groups: sampleGroups,
    showLanding: true,
    recommendedQuests: sampleRecommendedQuests,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 「自由に証明する」ボタンをクリック
    await userEvent.click(canvas.getByTestId("landing-start-free"));
    // 作成フォームが表示される
    await expect(
      canvas.getByTestId("notebook-create-form"),
    ).toBeInTheDocument();
  },
};

/** ランディングページから「クエストを探索する」をクリック → onTabChange呼び出し */
export const LandingExploreQuests: Story = {
  args: {
    listItems: [],
    groups: sampleGroups,
    showLanding: true,
    recommendedQuests: sampleRecommendedQuests,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // 「クエストを探索する」ボタンをクリック
    await userEvent.click(canvas.getByTestId("landing-explore-quests"));
    // onTabChange("quests") が呼ばれる
    await expect(args.onTabChange).toHaveBeenCalledWith("quests");
  },
};

/** ランディングページからおすすめクエストをクリック → onStartQuest呼び出し */
export const LandingRecommendedQuest: Story = {
  args: {
    listItems: [],
    groups: sampleGroups,
    showLanding: true,
    recommendedQuests: sampleRecommendedQuests,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // おすすめクエストボタンをクリック
    await userEvent.click(canvas.getByTestId("landing-quest-prop-01"));
    await expect(args.onStartQuest).toHaveBeenCalledWith("prop-01");
  },
};

/** リファレンスタブ: カテゴリフィルタ・検索・エントリ一覧 */
export const ReferenceTab: Story = {
  args: {
    listItems: sampleNotebooks,
    groups: sampleGroups,
    tab: "reference",
    referenceEntries: allReferenceEntries,
    referenceLocale: "en",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Referenceタブがアクティブ
    await expect(canvas.getByText("Reference")).toBeInTheDocument();
    // ブラウザが表示されている
    await expect(canvas.getByTestId("reference-browser")).toBeInTheDocument();
    // 検索バーが表示
    await expect(
      canvas.getByTestId("reference-browser-search"),
    ).toBeInTheDocument();
    // カテゴリバッジが表示
    await expect(
      canvas.getByTestId("reference-browser-category-axiom"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("reference-browser-category-concept"),
    ).toBeInTheDocument();
    // エントリが表示されている
    await expect(
      canvas.getByTestId("reference-browser-count"),
    ).toBeInTheDocument();
    // 検索でフィルタ
    await userEvent.type(
      canvas.getByTestId("reference-browser-search"),
      "modus ponens",
    );
    // フィルタ後のカウントが変わっている
    const count = canvas.getByTestId("reference-browser-count");
    const totalCount = String(allReferenceEntries.length);
    await expect(count.textContent).not.toBe(
      `${totalCount satisfies string} / ${totalCount satisfies string}`,
    );
    // 検索をクリア
    await userEvent.clear(canvas.getByTestId("reference-browser-search"));
    // カテゴリフィルタをクリック
    await userEvent.click(
      canvas.getByTestId("reference-browser-category-axiom"),
    );
    // 公理だけが表示されている
    const countAfterFilter = canvas.getByTestId("reference-browser-count");
    await expect(countAfterFilter.textContent).toContain(
      `/ ${totalCount satisfies string}`,
    );
  },
};
