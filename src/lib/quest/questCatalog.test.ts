import { describe, it, expect } from "vitest";
import {
  computeRating,
  toCatalogItem,
  buildCatalog,
  buildCatalogByCategory,
  filterByDifficulty,
  filterIncomplete,
  filterCompleted,
  findQuestById,
} from "./questCatalog";
import type { QuestDefinition, QuestCategory } from "./questDefinition";
import { createEmptyProgress, recordCompletion } from "./questProgress";

// --- テストヘルパー ---

function makeQuest(
  overrides: Partial<QuestDefinition> & {
    readonly id: string;
    readonly category: QuestCategory;
    readonly order: number;
  },
): QuestDefinition {
  return {
    title: "Test Quest",
    description: "Test description",
    difficulty: 1,
    systemPresetId: "lukasiewicz",
    goals: [
      {
        formulaText: "phi -> phi",
      },
    ],
    hints: ["hint1"],
    estimatedSteps: 5,
    learningPoint: "test learning point",
    version: 1,
    ...overrides,
  };
}

// --- computeRating ---

describe("computeRating", () => {
  it("未完了の場合は'not-completed'", () => {
    expect(computeRating(undefined, 5)).toBe("not-completed");
  });

  it("推定ステップ数以下は'perfect'", () => {
    expect(computeRating(5, 5)).toBe("perfect");
    expect(computeRating(3, 5)).toBe("perfect");
  });

  it("推定ステップ数の1.5倍以下は'good'", () => {
    expect(computeRating(6, 5)).toBe("good");
    expect(computeRating(7, 5)).toBe("good");
  });

  it("推定ステップ数の1.5倍超は'completed'", () => {
    expect(computeRating(8, 5)).toBe("completed");
    expect(computeRating(100, 5)).toBe("completed");
  });

  it("境界値: ちょうど1.5倍は'good'", () => {
    // 5 * 1.5 = 7.5
    expect(computeRating(7, 5)).toBe("good");
  });

  it("推定ステップ1の場合", () => {
    expect(computeRating(1, 1)).toBe("perfect");
    expect(computeRating(2, 1)).toBe("completed");
  });
});

// --- toCatalogItem ---

describe("toCatalogItem", () => {
  it("未完了クエストのカタログアイテム", () => {
    const quest = makeQuest({
      id: "q1",
      category: "propositional-basics",
      order: 1,
      estimatedSteps: 5,
    });
    const progress = createEmptyProgress();
    const item = toCatalogItem(quest, progress);
    expect(item.quest).toBe(quest);
    expect(item.completed).toBe(false);
    expect(item.completionCount).toBe(0);
    expect(item.bestStepCount).toBeUndefined();
    expect(item.rating).toBe("not-completed");
  });

  it("完了済みクエストのカタログアイテム", () => {
    const quest = makeQuest({
      id: "q1",
      category: "propositional-basics",
      order: 1,
      estimatedSteps: 5,
    });
    let progress = createEmptyProgress();
    progress = recordCompletion(progress, "q1", {
      completedAt: 1000,
      stepCount: 5,
    });
    const item = toCatalogItem(quest, progress);
    expect(item.completed).toBe(true);
    expect(item.completionCount).toBe(1);
    expect(item.bestStepCount).toBe(5);
    expect(item.rating).toBe("perfect");
  });

  it("複数回完了のベスト記録が反映される", () => {
    const quest = makeQuest({
      id: "q1",
      category: "propositional-basics",
      order: 1,
      estimatedSteps: 5,
    });
    let progress = createEmptyProgress();
    progress = recordCompletion(progress, "q1", {
      completedAt: 1000,
      stepCount: 10,
    });
    progress = recordCompletion(progress, "q1", {
      completedAt: 2000,
      stepCount: 4,
    });
    const item = toCatalogItem(quest, progress);
    expect(item.completionCount).toBe(2);
    expect(item.bestStepCount).toBe(4);
    expect(item.rating).toBe("perfect");
  });
});

// --- buildCatalog ---

describe("buildCatalog", () => {
  it("ソート済みのカタログアイテム一覧を返す", () => {
    const quests = [
      makeQuest({
        id: "q2",
        category: "predicate-basics",
        order: 1,
      }),
      makeQuest({
        id: "q1",
        category: "propositional-basics",
        order: 1,
      }),
    ];
    const progress = createEmptyProgress();
    const catalog = buildCatalog(quests, progress);
    expect(catalog).toHaveLength(2);
    expect(catalog[0]!.quest.id).toBe("q1");
    expect(catalog[1]!.quest.id).toBe("q2");
  });

  it("空のクエスト一覧に対しては空配列を返す", () => {
    const catalog = buildCatalog([], createEmptyProgress());
    expect(catalog).toEqual([]);
  });
});

// --- buildCatalogByCategory ---

describe("buildCatalogByCategory", () => {
  it("カテゴリ別にグループ化される", () => {
    const quests = [
      makeQuest({
        id: "q1",
        category: "propositional-basics",
        order: 1,
      }),
      makeQuest({
        id: "q2",
        category: "propositional-basics",
        order: 2,
      }),
      makeQuest({
        id: "q3",
        category: "predicate-basics",
        order: 1,
      }),
    ];
    const progress = createEmptyProgress();
    const groups = buildCatalogByCategory(quests, progress);
    expect(groups).toHaveLength(2);
    expect(groups[0]!.category.id).toBe("propositional-basics");
    expect(groups[0]!.items).toHaveLength(2);
    expect(groups[1]!.category.id).toBe("predicate-basics");
    expect(groups[1]!.items).toHaveLength(1);
  });

  it("完了数が正しく集計される", () => {
    const quests = [
      makeQuest({
        id: "q1",
        category: "propositional-basics",
        order: 1,
      }),
      makeQuest({
        id: "q2",
        category: "propositional-basics",
        order: 2,
      }),
    ];
    let progress = createEmptyProgress();
    progress = recordCompletion(progress, "q1", {
      completedAt: 1000,
      stepCount: 5,
    });
    const groups = buildCatalogByCategory(quests, progress);
    expect(groups[0]!.completedCount).toBe(1);
    expect(groups[0]!.totalCount).toBe(2);
  });

  it("空クエストの場合は空配列を返す", () => {
    const groups = buildCatalogByCategory([], createEmptyProgress());
    expect(groups).toEqual([]);
  });

  it("カテゴリ順で並ぶ", () => {
    const quests = [
      makeQuest({
        id: "q3",
        category: "equality-basics",
        order: 1,
      }),
      makeQuest({
        id: "q1",
        category: "propositional-basics",
        order: 1,
      }),
      makeQuest({
        id: "q2",
        category: "predicate-basics",
        order: 1,
      }),
    ];
    const groups = buildCatalogByCategory(quests, createEmptyProgress());
    expect(groups[0]!.category.id).toBe("propositional-basics");
    expect(groups[1]!.category.id).toBe("predicate-basics");
    expect(groups[2]!.category.id).toBe("equality-basics");
  });
});

// --- フィルタリング ---

describe("filterByDifficulty", () => {
  it("指定難易度のアイテムのみ返す", () => {
    const quests = [
      makeQuest({
        id: "q1",
        category: "propositional-basics",
        order: 1,
        difficulty: 1,
      }),
      makeQuest({
        id: "q2",
        category: "propositional-basics",
        order: 2,
        difficulty: 2,
      }),
      makeQuest({
        id: "q3",
        category: "propositional-basics",
        order: 3,
        difficulty: 1,
      }),
    ];
    const catalog = buildCatalog(quests, createEmptyProgress());
    const filtered = filterByDifficulty(catalog, 1);
    expect(filtered).toHaveLength(2);
    expect(filtered.every((i) => i.quest.difficulty === 1)).toBe(true);
  });

  it("該当なしの場合は空配列", () => {
    const quests = [
      makeQuest({
        id: "q1",
        category: "propositional-basics",
        order: 1,
        difficulty: 1,
      }),
    ];
    const catalog = buildCatalog(quests, createEmptyProgress());
    const filtered = filterByDifficulty(catalog, 3);
    expect(filtered).toEqual([]);
  });
});

describe("filterIncomplete", () => {
  it("未完了のアイテムのみ返す", () => {
    const quests = [
      makeQuest({
        id: "q1",
        category: "propositional-basics",
        order: 1,
      }),
      makeQuest({
        id: "q2",
        category: "propositional-basics",
        order: 2,
      }),
    ];
    let progress = createEmptyProgress();
    progress = recordCompletion(progress, "q1", {
      completedAt: 1000,
      stepCount: 5,
    });
    const catalog = buildCatalog(quests, progress);
    const filtered = filterIncomplete(catalog);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]!.quest.id).toBe("q2");
  });
});

describe("filterCompleted", () => {
  it("完了済みのアイテムのみ返す", () => {
    const quests = [
      makeQuest({
        id: "q1",
        category: "propositional-basics",
        order: 1,
      }),
      makeQuest({
        id: "q2",
        category: "propositional-basics",
        order: 2,
      }),
    ];
    let progress = createEmptyProgress();
    progress = recordCompletion(progress, "q1", {
      completedAt: 1000,
      stepCount: 5,
    });
    const catalog = buildCatalog(quests, progress);
    const filtered = filterCompleted(catalog);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]!.quest.id).toBe("q1");
  });
});

// --- findQuestById ---

describe("findQuestById", () => {
  it("存在するIDで検索できる", () => {
    const quests = [
      makeQuest({
        id: "q1",
        category: "propositional-basics",
        order: 1,
      }),
      makeQuest({
        id: "q2",
        category: "propositional-basics",
        order: 2,
      }),
    ];
    const found = findQuestById(quests, "q2");
    expect(found).toBeDefined();
    expect(found?.id).toBe("q2");
  });

  it("存在しないIDはundefined", () => {
    const quests = [
      makeQuest({
        id: "q1",
        category: "propositional-basics",
        order: 1,
      }),
    ];
    expect(findQuestById(quests, "nonexistent")).toBeUndefined();
  });

  it("空配列はundefined", () => {
    expect(findQuestById([], "q1")).toBeUndefined();
  });
});
