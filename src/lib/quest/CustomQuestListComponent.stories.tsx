import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, within, userEvent, fireEvent } from "storybook/test";
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
      goals: [
        { formulaText: "~(p & q) -> (~p | ~q)" },
        { formulaText: "(~p | ~q) -> ~(p & q)" },
      ],
      hints: ["ヒント1: 対偶を使う", "ヒント2: ド・モルガンの変換"],
      learningPoint: "ド・モルガンの法則の理解",
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
    onDuplicateQuest: fn(),
    onDeleteQuest: fn(),
    onEditQuest: fn(),
    onCreateQuest: fn(),
    onExportQuest: fn(),
    onImportQuest: fn(),
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
    // 編集・エクスポート・複製・削除ボタンが表示されていること
    await expect(
      canvas.getByTestId("custom-quest-edit-btn-custom-1001"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("custom-quest-export-btn-custom-1001"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("custom-quest-duplicate-btn-custom-1001"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("custom-quest-delete-btn-custom-1001"),
    ).toBeInTheDocument();
    // インポートボタンがヘッダーに表示されていること
    await expect(
      canvas.getByTestId("custom-quest-import-btn"),
    ).toBeInTheDocument();
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

export const DuplicateQuest: Story = {
  args: {
    items: sampleItems,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByTestId("custom-quest-duplicate-btn-custom-1002"),
    );
    await expect(args.onDuplicateQuest).toHaveBeenCalledWith("custom-1002");
    // onStartQuest は呼ばれていないこと（stopPropagation）
    await expect(args.onStartQuest).not.toHaveBeenCalled();
  },
};

export const DeleteQuest: Story = {
  args: {
    items: sampleItems,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByTestId("custom-quest-delete-btn-custom-1003"),
    );
    await expect(args.onDeleteQuest).toHaveBeenCalledWith("custom-1003");
    // onStartQuest は呼ばれていないこと（stopPropagation）
    await expect(args.onStartQuest).not.toHaveBeenCalled();
  },
};

export const WithoutActions: Story = {
  args: {
    items: sampleItems,
    onDuplicateQuest: undefined,
    onDeleteQuest: undefined,
    onEditQuest: undefined,
    onExportQuest: undefined,
    onImportQuest: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 編集・エクスポート・複製・削除ボタンが表示されないこと
    await expect(
      canvas.queryByTestId("custom-quest-edit-btn-custom-1001"),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByTestId("custom-quest-export-btn-custom-1001"),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByTestId("custom-quest-duplicate-btn-custom-1001"),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByTestId("custom-quest-delete-btn-custom-1001"),
    ).not.toBeInTheDocument();
    // インポートボタンも非表示
    await expect(
      canvas.queryByTestId("custom-quest-import-btn"),
    ).not.toBeInTheDocument();
  },
};

export const EditQuest: Story = {
  args: {
    items: sampleItems,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 編集ボタンをクリックしてフォームを開く
    await userEvent.click(
      canvas.getByTestId("custom-quest-edit-btn-custom-1002"),
    );
    // onStartQuest は呼ばれていないこと（stopPropagation）
    await expect(args.onStartQuest).not.toHaveBeenCalled();

    // 編集フォームが表示されること
    await expect(
      canvas.getByTestId("custom-quest-edit-form-custom-1002"),
    ).toBeInTheDocument();

    // フォームに既存値が入っていること
    const titleInput = canvas.getByTestId("edit-title-input");
    await expect(titleInput).toHaveValue("ド・モルガンの法則");

    const goalsInput = canvas.getByTestId("edit-goals-input");
    await expect(goalsInput).toHaveValue(
      "~(p & q) -> (~p | ~q)\n(~p | ~q) -> ~(p & q)",
    );

    const hintsInput = canvas.getByTestId("edit-hints-input");
    await expect(hintsInput).toHaveValue(
      "ヒント1: 対偶を使う\nヒント2: ド・モルガンの変換",
    );

    // タイトルを変更して保存する
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "ド・モルガン（修正版）");
    await userEvent.click(canvas.getByTestId("edit-save-btn"));

    // onEditQuest が正しいパラメータで呼ばれること
    await expect(args.onEditQuest).toHaveBeenCalledWith(
      expect.objectContaining({
        questId: "custom-1002",
        params: expect.objectContaining({
          title: "ド・モルガン（修正版）",
        }),
      }),
    );

    // フォームが閉じること
    await expect(
      canvas.queryByTestId("custom-quest-edit-form-custom-1002"),
    ).not.toBeInTheDocument();
  },
};

export const EditQuestCancel: Story = {
  args: {
    items: sampleItems,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 編集ボタンをクリック
    await userEvent.click(
      canvas.getByTestId("custom-quest-edit-btn-custom-1001"),
    );

    // フォームが表示される
    await expect(
      canvas.getByTestId("custom-quest-edit-form-custom-1001"),
    ).toBeInTheDocument();

    // キャンセルボタンをクリック
    await userEvent.click(canvas.getByTestId("edit-cancel-btn"));

    // フォームが閉じること
    await expect(
      canvas.queryByTestId("custom-quest-edit-form-custom-1001"),
    ).not.toBeInTheDocument();

    // onEditQuest は呼ばれていないこと
    await expect(args.onEditQuest).not.toHaveBeenCalled();
  },
};

export const CreateNewQuest: Story = {
  args: {
    items: sampleItems,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 新規作成ボタンが表示されていること
    const createBtn = canvas.getByTestId("custom-quest-create-btn");
    await expect(createBtn).toBeInTheDocument();
    await expect(createBtn).toHaveTextContent("新規作成");

    // 新規作成ボタンをクリックしてフォームを開く
    await userEvent.click(createBtn);

    // フォームが表示されること
    await expect(
      canvas.getByTestId("custom-quest-create-form"),
    ).toBeInTheDocument();

    // ボタンのテキストが「閉じる」に変わること
    await expect(createBtn).toHaveTextContent("閉じる");

    // フォームに値を入力
    await userEvent.type(
      canvas.getByTestId("create-title-input"),
      "新しいクエスト",
    );
    await userEvent.type(
      canvas.getByTestId("create-goals-input"),
      "phi -> phi",
    );

    // 保存ボタンをクリック
    await userEvent.click(canvas.getByTestId("create-save-btn"));

    // onCreateQuest が正しいパラメータで呼ばれること
    await expect(args.onCreateQuest).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "新しいクエスト",
        goals: [{ formulaText: "phi -> phi" }],
      }),
    );

    // フォームが閉じること
    await expect(
      canvas.queryByTestId("custom-quest-create-form"),
    ).not.toBeInTheDocument();
  },
};

export const CreateNewQuestValidation: Story = {
  args: {
    items: [],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 新規作成ボタンをクリック
    await userEvent.click(canvas.getByTestId("custom-quest-create-btn"));

    // フォームが表示される
    await expect(
      canvas.getByTestId("custom-quest-create-form"),
    ).toBeInTheDocument();

    // 空のまま保存をクリック
    await userEvent.click(canvas.getByTestId("create-save-btn"));

    // バリデーションエラーが表示されること
    await expect(canvas.getByTestId("create-title-error")).toBeInTheDocument();
    await expect(canvas.getByTestId("create-goals-error")).toBeInTheDocument();

    // onCreateQuest は呼ばれていないこと
    await expect(args.onCreateQuest).not.toHaveBeenCalled();
  },
};

export const CreateNewQuestCancel: Story = {
  args: {
    items: sampleItems,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 新規作成ボタンをクリック
    await userEvent.click(canvas.getByTestId("custom-quest-create-btn"));

    // フォームが表示される
    await expect(
      canvas.getByTestId("custom-quest-create-form"),
    ).toBeInTheDocument();

    // キャンセルボタンをクリック
    await userEvent.click(canvas.getByTestId("create-cancel-btn"));

    // フォームが閉じること
    await expect(
      canvas.queryByTestId("custom-quest-create-form"),
    ).not.toBeInTheDocument();

    // onCreateQuest は呼ばれていないこと
    await expect(args.onCreateQuest).not.toHaveBeenCalled();
  },
};

export const ExportQuest: Story = {
  args: {
    items: sampleItems,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // JSONエクスポートボタンが表示されていること
    const exportBtn = canvas.getByTestId("custom-quest-export-btn-custom-1001");
    await expect(exportBtn).toBeInTheDocument();
    await expect(exportBtn).toHaveTextContent("JSON");

    // クリックするとonExportQuestが呼ばれる
    await userEvent.click(exportBtn);
    await expect(args.onExportQuest).toHaveBeenCalledWith("custom-1001");

    // onStartQuestは呼ばれないこと（stopPropagation）
    await expect(args.onStartQuest).not.toHaveBeenCalled();
  },
};

export const ImportQuest: Story = {
  args: {
    items: sampleItems,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // インポートボタンが表示されていること
    const importBtn = canvas.getByTestId("custom-quest-import-btn");
    await expect(importBtn).toBeInTheDocument();
    await expect(importBtn).toHaveTextContent("インポート");

    // インポートボタンをクリックしてフォームを開く
    await userEvent.click(importBtn);

    // フォームが表示されること
    await expect(
      canvas.getByTestId("custom-quest-import-form"),
    ).toBeInTheDocument();

    // ボタンのテキストが「閉じる」に変わること
    await expect(importBtn).toHaveTextContent("閉じる");

    // JSONテキストを入力（userEvent.typeは{を特殊文字として解釈するためfireEventを使用）
    const jsonInput = canvas.getByTestId(
      "import-json-input",
    ) as HTMLTextAreaElement;
    const jsonText =
      '{"_format":"intro-formal-proof-quest","_version":1,"quest":{"id":"custom-9999","category":"propositional-basics","title":"test","description":"desc","difficulty":1,"systemPresetId":"lukasiewicz","goals":[{"formulaText":"phi -> phi"}],"hints":[],"estimatedSteps":3,"learningPoint":"lp","order":0,"version":1}}';
    fireEvent.change(jsonInput, { target: { value: jsonText } });

    // インポートボタンをクリック
    await userEvent.click(canvas.getByTestId("import-submit-btn"));

    // onImportQuestが呼ばれること
    await expect(args.onImportQuest).toHaveBeenCalled();

    // フォームが閉じること
    await expect(
      canvas.queryByTestId("custom-quest-import-form"),
    ).not.toBeInTheDocument();
  },
};

export const ImportQuestCancel: Story = {
  args: {
    items: sampleItems,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // インポートフォームを開く
    await userEvent.click(canvas.getByTestId("custom-quest-import-btn"));
    await expect(
      canvas.getByTestId("custom-quest-import-form"),
    ).toBeInTheDocument();

    // キャンセルボタンをクリック
    await userEvent.click(canvas.getByTestId("import-cancel-btn"));

    // フォームが閉じること
    await expect(
      canvas.queryByTestId("custom-quest-import-form"),
    ).not.toBeInTheDocument();

    // onImportQuestは呼ばれないこと
    await expect(args.onImportQuest).not.toHaveBeenCalled();
  },
};
