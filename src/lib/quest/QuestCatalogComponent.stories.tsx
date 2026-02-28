import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, within, userEvent } from "storybook/test";
import { QuestCatalog } from "./QuestCatalogComponent";
import type { CategoryGroup, QuestCatalogItem } from "./questCatalog";
import type { QuestDefinition } from "./questDefinition";
import type { QuestNotebookCounts } from "./questNotebookFilterLogic";

// --- ヘルパー ---

function makeQuest(overrides: Partial<QuestDefinition> = {}): QuestDefinition {
  return {
    id: "q1",
    category: "propositional-basics",
    title: "恒等律 (Identity)",
    description: "φ → φ を証明せよ。",
    difficulty: 1,
    systemPresetId: "lukasiewicz",
    goals: [],
    hints: [],
    estimatedSteps: 5,
    learningPoint: "テスト",
    order: 1,
    version: 1,
    ...overrides,
  };
}

function makeItem(
  overrides: Partial<QuestCatalogItem> & {
    readonly questOverrides?: Partial<QuestDefinition>;
  } = {},
): QuestCatalogItem {
  const { questOverrides, ...rest } = overrides;
  return {
    quest: makeQuest(questOverrides),
    completed: false,
    completionCount: 0,
    bestStepCount: undefined,
    rating: "not-completed",
    ...rest,
  };
}

// --- サンプルデータ ---

const sampleGroups: readonly CategoryGroup[] = [
  {
    category: {
      id: "propositional-basics",
      label: "命題論理の基礎",
      description: "A1, A2, A3 + MP を使った基本的な証明。",
      order: 1,
    },
    items: [
      makeItem({
        questOverrides: {
          id: "prop-01",
          title: "恒等律 (Identity)",
          description: "φ → φ を証明せよ。SKK = I の対応を体験する。",
          difficulty: 1,
          estimatedSteps: 5,
        },
        completed: true,
        completionCount: 3,
        bestStepCount: 5,
        rating: "perfect",
      }),
      makeItem({
        questOverrides: {
          id: "prop-02",
          title: "定数関数の合成",
          description: "ψ → (φ → φ) を証明せよ。",
          difficulty: 1,
          estimatedSteps: 7,
        },
        completed: true,
        completionCount: 1,
        bestStepCount: 9,
        rating: "good",
      }),
      makeItem({
        questOverrides: {
          id: "prop-03",
          title: "推移律の準備",
          description: "(φ → ψ) → ((ψ → χ) → (φ → ψ)) を証明せよ。",
          difficulty: 1,
          estimatedSteps: 1,
        },
        completed: true,
        completionCount: 1,
        bestStepCount: 1,
        rating: "perfect",
      }),
      makeItem({
        questOverrides: {
          id: "prop-04",
          title: "推移律 (Hypothetical Syllogism)",
          description: "(φ → ψ) → ((ψ → χ) → (φ → χ)) を証明せよ。",
          difficulty: 2,
          estimatedSteps: 11,
        },
      }),
      makeItem({
        questOverrides: {
          id: "prop-05",
          title: "含意の弱化",
          description: "φ → (ψ → (χ → ψ)) を証明せよ。",
          difficulty: 2,
          estimatedSteps: 3,
        },
        completed: true,
        completionCount: 1,
        bestStepCount: 5,
        rating: "completed",
      }),
    ],
    completedCount: 4,
    totalCount: 5,
  },
  {
    category: {
      id: "propositional-negation",
      label: "否定を含む命題論理",
      description: "否定公理 A3 を活用する証明。",
      order: 2,
    },
    items: [
      makeItem({
        questOverrides: {
          id: "neg-01",
          title: "二重否定除去",
          description: "¬¬φ → φ を証明せよ。",
          difficulty: 3,
          category: "propositional-negation",
          estimatedSteps: 15,
        },
      }),
    ],
    completedCount: 0,
    totalCount: 1,
  },
];

// --- Meta ---

const sampleNotebookCounts: QuestNotebookCounts = new Map([
  ["prop-01", 3],
  ["prop-02", 1],
  ["neg-01", 0],
]);

const meta = {
  title: "Quest/QuestCatalog",
  component: QuestCatalog,
  args: {
    onStartQuest: fn(),
    onShowQuestNotebooks: fn(),
  },
} satisfies Meta<typeof QuestCatalog>;

export default meta;

type Story = StoryObj<typeof meta>;

// --- Stories ---

export const Default: Story = {
  args: {
    groups: sampleGroups,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("quest-catalog")).toBeInTheDocument();
    await expect(
      canvas.getByTestId("category-propositional-basics"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("category-propositional-negation"),
    ).toBeInTheDocument();
    await expect(canvas.getByText("命題論理の基礎")).toBeInTheDocument();
    await expect(canvas.getByText("4 / 5")).toBeInTheDocument();
    // チャプター番号が表示される
    await expect(canvas.getByTestId("chapter-number-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("chapter-number-2")).toBeInTheDocument();
    // プログレスバーが表示される
    const bars = canvas.getAllByTestId("progress-bar");
    await expect(bars.length).toBe(2);
    // 難易度星が表示される
    const stars = canvas.getAllByTestId("difficulty-stars");
    await expect(stars.length).toBeGreaterThan(0);
  },
};

export const Empty: Story = {
  args: {
    groups: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("quest-catalog-empty")).toBeInTheDocument();
    await expect(
      canvas.getByText("条件に合うクエストがありません。"),
    ).toBeInTheDocument();
  },
};

export const StartQuest: Story = {
  args: {
    groups: sampleGroups,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId("start-btn-prop-04"));
    await expect(args.onStartQuest).toHaveBeenCalledWith("prop-04");
  },
};

export const FilterByDifficulty: Story = {
  args: {
    groups: sampleGroups,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 難易度1に絞る
    await userEvent.click(canvas.getByTestId("difficulty-filter-1"));
    // 難易度1のクエストのみ表示される
    await expect(canvas.getByTestId("quest-item-prop-01")).toBeInTheDocument();
    await expect(canvas.getByTestId("quest-item-prop-02")).toBeInTheDocument();
    await expect(canvas.getByTestId("quest-item-prop-03")).toBeInTheDocument();
    // 難易度2,3は非表示
    await expect(canvas.queryByTestId("quest-item-prop-04")).toBeNull();
    await expect(canvas.queryByTestId("quest-item-neg-01")).toBeNull();
  },
};

export const FilterByCompletion: Story = {
  args: {
    groups: sampleGroups,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 未クリアに絞る
    await userEvent.click(canvas.getByTestId("completion-filter-incomplete"));
    await expect(canvas.getByTestId("quest-item-prop-04")).toBeInTheDocument();
    await expect(canvas.getByTestId("quest-item-neg-01")).toBeInTheDocument();
    // クリア済みは非表示
    await expect(canvas.queryByTestId("quest-item-prop-01")).toBeNull();
  },
};

export const WithNotebookCounts: Story = {
  args: {
    groups: sampleGroups,
    notebookCounts: sampleNotebookCounts,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // prop-01: 3冊バッジが表示される
    const badge = canvas.getByTestId("notebook-count-prop-01");
    await expect(badge).toBeInTheDocument();
    await expect(badge.textContent).toContain("3");
    // prop-02: 1冊バッジが表示される
    await expect(
      canvas.getByTestId("notebook-count-prop-02"),
    ).toBeInTheDocument();
    // neg-01: 0冊はバッジ非表示
    await expect(
      canvas.queryByTestId("notebook-count-neg-01"),
    ).not.toBeInTheDocument();
    // バッジクリックで onShowQuestNotebooks が呼ばれる
    await userEvent.click(badge);
    await expect(args.onShowQuestNotebooks).toHaveBeenCalledWith("prop-01");
  },
};

export const RatingBadges: Story = {
  args: {
    groups: sampleGroups,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Perfect!バッジ
    const q1 = canvas.getByTestId("quest-item-prop-01");
    await expect(within(q1).getByText("Perfect!")).toBeInTheDocument();
    // Goodバッジ
    const q2 = canvas.getByTestId("quest-item-prop-02");
    await expect(within(q2).getByText("Good")).toBeInTheDocument();
    // 未クリアバッジ
    const q4 = canvas.getByTestId("quest-item-prop-04");
    await expect(within(q4).getByText("未クリア")).toBeInTheDocument();
  },
};
