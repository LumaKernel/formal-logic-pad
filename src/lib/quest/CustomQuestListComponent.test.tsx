import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomQuestList } from "./CustomQuestListComponent";
import type { QuestCatalogItem } from "./questCatalog";
import type { QuestDefinition } from "./questDefinition";

// --- テストヘルパー ---

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

const sampleItems: readonly QuestCatalogItem[] = [
  makeItem({
    questOverrides: {
      id: "custom-1001",
      title: "恒等律の練習",
      description: "φ → φ を証明せよ。",
      difficulty: 1,
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
    },
  }),
];

describe("CustomQuestListComponent", () => {
  describe("キーボードナビゲーション", () => {
    it("Enterキーでクエスト開始が呼ばれる", async () => {
      const onStartQuest = vi.fn();
      render(
        <CustomQuestList items={sampleItems} onStartQuest={onStartQuest} />,
      );

      const questItem = screen.getByTestId("custom-quest-item-custom-1001");
      questItem.focus();
      await userEvent.keyboard("{Enter}");

      expect(onStartQuest).toHaveBeenCalledWith("custom-1001");
    });

    it("Spaceキーでクエスト開始が呼ばれる", async () => {
      const onStartQuest = vi.fn();
      render(
        <CustomQuestList items={sampleItems} onStartQuest={onStartQuest} />,
      );

      const questItem = screen.getByTestId("custom-quest-item-custom-1002");
      questItem.focus();
      await userEvent.keyboard(" ");

      expect(onStartQuest).toHaveBeenCalledWith("custom-1002");
    });

    it("Tabキーではクエスト開始が呼ばれない", async () => {
      const onStartQuest = vi.fn();
      render(
        <CustomQuestList items={sampleItems} onStartQuest={onStartQuest} />,
      );

      const questItem = screen.getByTestId("custom-quest-item-custom-1001");
      questItem.focus();
      await userEvent.keyboard("{Tab}");

      expect(onStartQuest).not.toHaveBeenCalled();
    });
  });

  describe("ファイルインポート", () => {
    it("ファイル選択でJSONテキストがテキストエリアに反映される", async () => {
      const onImportQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onImportQuest={onImportQuest}
        />,
      );

      // インポートフォームを開く
      await userEvent.click(screen.getByTestId("custom-quest-import-btn"));

      // ファイル入力を取得
      const fileInput = screen.getByTestId(
        "import-file-input",
      ) as HTMLInputElement;

      // テスト用JSONファイルを作成
      const jsonContent = '{"_format":"intro-formal-proof-quest","_version":1}';
      const file = new File([jsonContent], "quest.json", {
        type: "application/json",
      });

      // ファイルをアップロード
      await userEvent.upload(fileInput, file);

      // FileReaderの非同期処理を待つ
      await waitFor(() => {
        const textarea = screen.getByTestId(
          "import-json-input",
        ) as HTMLTextAreaElement;
        expect(textarea.value).toBe(jsonContent);
      });
    });

    it("ファイルが選択されていない場合は何もしない", () => {
      const onImportQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onImportQuest={onImportQuest}
        />,
      );

      // インポートフォームを開く
      fireEvent.click(screen.getByTestId("custom-quest-import-btn"));

      // ファイル入力にファイルなしのchangeイベントを発火
      const fileInput = screen.getByTestId("import-file-input");
      fireEvent.change(fileInput, { target: { files: [] } });

      // テキストエリアは空のまま
      const textarea = screen.getByTestId(
        "import-json-input",
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe("");
    });

    it("空のJSONテキストではインポートボタンが無効", async () => {
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onImportQuest={vi.fn()}
        />,
      );

      await userEvent.click(screen.getByTestId("custom-quest-import-btn"));

      const submitBtn = screen.getByTestId("import-submit-btn");
      expect(submitBtn).toBeDisabled();
    });

    it("空のJSONテキストでsubmitしてもonImportQuestが呼ばれない", () => {
      const onImportQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onImportQuest={onImportQuest}
        />,
      );

      fireEvent.click(screen.getByTestId("custom-quest-import-btn"));

      // form submit を直接発火（空テキスト状態で）
      const form = screen.getByTestId("import-submit-btn").closest("form")!;
      fireEvent.submit(form);

      expect(onImportQuest).not.toHaveBeenCalled();
    });
  });
});
