import { describe, it, expect } from "vitest";
import {
  buildCustomQuestCatalogItems,
  getCustomQuestCatalogCount,
  getCustomQuestCompletedCount,
  customQuestProgressText,
} from "./customQuestCatalogLogic";
import type { CustomQuestCollection } from "./customQuestState";
import { createEmptyCustomQuestCollection } from "./customQuestState";
import { createEmptyProgress, recordCompletion } from "./questProgress";
import type { QuestDefinition } from "./questDefinition";

// --- ヘルパー ---

function makeCustomQuest(
  overrides: Partial<QuestDefinition> = {},
): QuestDefinition {
  return {
    id: "custom-1000",
    category: "propositional-basics",
    title: "テストクエスト",
    description: "テスト用の自作クエスト",
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

function makeCollection(
  quests: readonly QuestDefinition[],
): CustomQuestCollection {
  const map = new Map(quests.map((q) => [q.id, q]));
  return { quests: map };
}

// --- テスト ---

describe("buildCustomQuestCatalogItems", () => {
  it("空コレクションから空配列を返す", () => {
    const collection = createEmptyCustomQuestCollection();
    const progress = createEmptyProgress();
    const items = buildCustomQuestCatalogItems(collection, progress);
    expect(items).toEqual([]);
  });

  it("自作クエストをカタログアイテムに変換する", () => {
    const quest = makeCustomQuest();
    const collection = makeCollection([quest]);
    const progress = createEmptyProgress();
    const items = buildCustomQuestCatalogItems(collection, progress);

    expect(items).toHaveLength(1);
    expect(items[0]!.quest.id).toBe("custom-1000");
    expect(items[0]!.quest.title).toBe("テストクエスト");
    expect(items[0]!.completed).toBe(false);
    expect(items[0]!.rating).toBe("not-completed");
  });

  it("完了済み自作クエストの進捗が反映される", () => {
    const quest = makeCustomQuest({ estimatedSteps: 5 });
    const collection = makeCollection([quest]);
    const progress = recordCompletion(createEmptyProgress(), "custom-1000", {
      stepCount: 4,
      completedAt: 1000,
    });
    const items = buildCustomQuestCatalogItems(collection, progress);

    expect(items[0]!.completed).toBe(true);
    expect(items[0]!.bestStepCount).toBe(4);
    expect(items[0]!.rating).toBe("perfect");
  });

  it("複数の自作クエストを変換する", () => {
    const q1 = makeCustomQuest({ id: "custom-1000", title: "クエスト1" });
    const q2 = makeCustomQuest({ id: "custom-2000", title: "クエスト2" });
    const q3 = makeCustomQuest({ id: "custom-3000", title: "クエスト3" });
    const collection = makeCollection([q1, q2, q3]);
    const progress = createEmptyProgress();
    const items = buildCustomQuestCatalogItems(collection, progress);

    expect(items).toHaveLength(3);
    expect(items.map((i) => i.quest.title)).toEqual([
      "クエスト1",
      "クエスト2",
      "クエスト3",
    ]);
  });
});

describe("getCustomQuestCatalogCount", () => {
  it("アイテム数を返す", () => {
    const collection = makeCollection([
      makeCustomQuest({ id: "custom-1" }),
      makeCustomQuest({ id: "custom-2" }),
    ]);
    const items = buildCustomQuestCatalogItems(
      collection,
      createEmptyProgress(),
    );
    expect(getCustomQuestCatalogCount(items)).toBe(2);
  });

  it("空の場合は0を返す", () => {
    expect(getCustomQuestCatalogCount([])).toBe(0);
  });
});

describe("getCustomQuestCompletedCount", () => {
  it("完了数を返す", () => {
    const q1 = makeCustomQuest({ id: "custom-1" });
    const q2 = makeCustomQuest({ id: "custom-2" });
    const collection = makeCollection([q1, q2]);
    let progress = createEmptyProgress();
    progress = recordCompletion(progress, "custom-1", {
      stepCount: 3,
      completedAt: 1000,
    });
    const items = buildCustomQuestCatalogItems(collection, progress);
    expect(getCustomQuestCompletedCount(items)).toBe(1);
  });
});

describe("customQuestProgressText", () => {
  it("進捗テキストを生成する", () => {
    expect(customQuestProgressText(2, 5)).toBe("2 / 5");
  });

  it("0/0の場合", () => {
    expect(customQuestProgressText(0, 0)).toBe("0 / 0");
  });
});
