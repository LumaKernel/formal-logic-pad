import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, within, userEvent } from "storybook/test";
import { CustomQuestList } from "./CustomQuestListComponent";
import type { QuestCatalogItem } from "./questCatalog";
import type { QuestDefinition } from "./questDefinition";

// --- ヘルパー ---

function makeQuest(overrides: Partial<QuestDefinition> = {}): QuestDefinition {
  return {
    id: "custom-1000",
    category: "propositional-basics",
    title: "テストクエスト",
    description: "テスト用の自作クエスト。",
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

const sampleItems: readonly QuestCatalogItem[] = [
  makeItem({
    questOverrides: {
      id: "custom-1001",
      title: "恒等律の練習",
      description: "φ → φ を証明せよ。自作バージョン。",
      difficulty: 1,
      estimatedSteps: 5,
    },
    completed: true,
    completionCount: 2,
    bestStepCount: 4,
    rating: "perfect",
  }),
  makeItem({
    questOverrides: {
      id: "custom-1002",
      title: "ド・モルガンの法則",
      description: "¬(p ∧ q) → (¬p ∨ ¬q) を証明せよ。",
      difficulty: 3,
      estimatedSteps: 12,
    },
  }),
  makeItem({
    questOverrides: {
      id: "custom-1003",
      title: "対偶",
      description: "(p → q) → (¬q → ¬p) を証明せよ。",
      difficulty: 2,
      estimatedSteps: 8,
    },
    completed: true,
    completionCount: 1,
    bestStepCount: 10,
    rating: "good",
  }),
];

// --- Meta ---

const meta = {
  title: "Quest/CustomQuestList",
  component: CustomQuestList,
  args: {
    onStartQuest: fn(),
  },
} satisfies Meta<typeof CustomQuestList>;

export default meta;

type Story = StoryObj<typeof meta>;

// --- Stories ---

export const Default: Story = {
  args: {
    items: sampleItems,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("custom-quest-list")).toBeInTheDocument();
    await expect(canvas.getByText("自作クエスト")).toBeInTheDocument();
    await expect(canvas.getByText("2 / 3")).toBeInTheDocument();
    await expect(canvas.getByText("恒等律の練習")).toBeInTheDocument();
    await expect(canvas.getByText("ド・モルガンの法則")).toBeInTheDocument();
    await expect(canvas.getByText("対偶")).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: {
    items: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByTestId("custom-quest-list-empty"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByText("自作クエストはまだありません。"),
    ).toBeInTheDocument();
    await expect(canvas.getByText("0 / 0")).toBeInTheDocument();
  },
};

export const StartQuest: Story = {
  args: {
    items: sampleItems,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByTestId("custom-quest-start-btn-custom-1002"),
    );
    await expect(args.onStartQuest).toHaveBeenCalledWith("custom-1002");
  },
};

export const ClickQuestItem: Story = {
  args: {
    items: sampleItems,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId("custom-quest-item-custom-1003"));
    await expect(args.onStartQuest).toHaveBeenCalledWith("custom-1003");
  },
};
