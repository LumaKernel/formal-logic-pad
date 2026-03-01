import { describe, it, expect } from "vitest";
import {
  questCategories,
  findCategoryById,
  validateUniqueIds,
  groupByCategory,
  sortQuests,
  type QuestDefinition,
  type QuestCategory,
} from "./questDefinition";

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

// --- questCategories ---

describe("questCategories", () => {
  it("13個のカテゴリが定義されている", () => {
    expect(questCategories).toHaveLength(13);
  });

  it("各カテゴリにはid, label, description, orderがある", () => {
    for (const cat of questCategories) {
      expect(cat.id).toBeTruthy();
      expect(cat.label).toBeTruthy();
      expect(cat.description).toBeTruthy();
      expect(typeof cat.order).toBe("number");
    }
  });

  it("カテゴリIDが一意である", () => {
    const ids = new Set(questCategories.map((c) => c.id));
    expect(ids.size).toBe(questCategories.length);
  });

  it("orderが昇順である", () => {
    for (let i = 1; i < questCategories.length; i++) {
      expect(questCategories[i]!.order).toBeGreaterThan(
        questCategories[i - 1]!.order,
      );
    }
  });
});

// --- findCategoryById ---

describe("findCategoryById", () => {
  it("存在するIDで検索できる", () => {
    const result = findCategoryById("propositional-basics");
    expect(result).toBeDefined();
    expect(result?.id).toBe("propositional-basics");
    expect(result?.label).toBe("命題論理の基礎");
  });

  it("全カテゴリが検索可能", () => {
    for (const cat of questCategories) {
      const result = findCategoryById(cat.id);
      expect(result).toBeDefined();
      expect(result?.id).toBe(cat.id);
    }
  });
});

// --- validateUniqueIds ---

describe("validateUniqueIds", () => {
  it("一意なIDの場合trueを返す", () => {
    const quests = [
      makeQuest({ id: "q1", category: "propositional-basics", order: 1 }),
      makeQuest({ id: "q2", category: "propositional-basics", order: 2 }),
      makeQuest({ id: "q3", category: "predicate-basics", order: 1 }),
    ];
    expect(validateUniqueIds(quests)).toBe(true);
  });

  it("重複IDがある場合falseを返す", () => {
    const quests = [
      makeQuest({ id: "q1", category: "propositional-basics", order: 1 }),
      makeQuest({ id: "q1", category: "propositional-basics", order: 2 }),
    ];
    expect(validateUniqueIds(quests)).toBe(false);
  });

  it("空配列の場合trueを返す", () => {
    expect(validateUniqueIds([])).toBe(true);
  });

  it("1要素の場合trueを返す", () => {
    const quests = [
      makeQuest({ id: "q1", category: "propositional-basics", order: 1 }),
    ];
    expect(validateUniqueIds(quests)).toBe(true);
  });
});

// --- groupByCategory ---

describe("groupByCategory", () => {
  it("カテゴリごとにグループ化される", () => {
    const quests = [
      makeQuest({ id: "q1", category: "propositional-basics", order: 1 }),
      makeQuest({ id: "q2", category: "propositional-basics", order: 2 }),
      makeQuest({ id: "q3", category: "predicate-basics", order: 1 }),
    ];
    const groups = groupByCategory(quests);
    expect(groups.size).toBe(2);
    expect(groups.get("propositional-basics")).toHaveLength(2);
    expect(groups.get("predicate-basics")).toHaveLength(1);
  });

  it("空配列の場合は空のMapを返す", () => {
    const groups = groupByCategory([]);
    expect(groups.size).toBe(0);
  });

  it("1カテゴリのみの場合", () => {
    const quests = [
      makeQuest({ id: "q1", category: "equality-basics", order: 1 }),
      makeQuest({ id: "q2", category: "equality-basics", order: 2 }),
    ];
    const groups = groupByCategory(quests);
    expect(groups.size).toBe(1);
    expect(groups.get("equality-basics")).toHaveLength(2);
  });
});

// --- sortQuests ---

describe("sortQuests", () => {
  it("カテゴリ順にソートされる", () => {
    const quests = [
      makeQuest({ id: "q3", category: "predicate-basics", order: 1 }),
      makeQuest({ id: "q1", category: "propositional-basics", order: 1 }),
      makeQuest({ id: "q4", category: "equality-basics", order: 1 }),
    ];
    const sorted = sortQuests(quests);
    expect(sorted[0]!.id).toBe("q1");
    expect(sorted[1]!.id).toBe("q3");
    expect(sorted[2]!.id).toBe("q4");
  });

  it("同カテゴリ内ではorder順にソートされる", () => {
    const quests = [
      makeQuest({ id: "q2", category: "propositional-basics", order: 3 }),
      makeQuest({ id: "q1", category: "propositional-basics", order: 1 }),
      makeQuest({ id: "q3", category: "propositional-basics", order: 2 }),
    ];
    const sorted = sortQuests(quests);
    expect(sorted[0]!.id).toBe("q1");
    expect(sorted[1]!.id).toBe("q3");
    expect(sorted[2]!.id).toBe("q2");
  });

  it("空配列の場合は空配列を返す", () => {
    expect(sortQuests([])).toEqual([]);
  });

  it("元の配列を変更しない（イミュータブル）", () => {
    const quests = [
      makeQuest({ id: "q2", category: "propositional-basics", order: 2 }),
      makeQuest({ id: "q1", category: "propositional-basics", order: 1 }),
    ];
    const original = [...quests];
    sortQuests(quests);
    expect(quests).toEqual(original);
  });

  it("未知のカテゴリはフォールバック順序999でソートされる", () => {
    const quests = [
      makeQuest({
        id: "q1",
        category: "unknown-category" as QuestCategory,
        order: 1,
      }),
      makeQuest({ id: "q2", category: "propositional-basics", order: 1 }),
    ];
    const sorted = sortQuests(quests);
    // propositional-basics (order=1) が先、unknown-category (order=999) が後
    expect(sorted[0]!.id).toBe("q2");
    expect(sorted[1]!.id).toBe("q1");
  });

  it("両方とも未知のカテゴリの場合はorder順でソートされる", () => {
    const quests = [
      makeQuest({
        id: "q2",
        category: "unknown-b" as QuestCategory,
        order: 2,
      }),
      makeQuest({
        id: "q1",
        category: "unknown-b" as QuestCategory,
        order: 1,
      }),
    ];
    const sorted = sortQuests(quests);
    expect(sorted[0]!.id).toBe("q1");
    expect(sorted[1]!.id).toBe("q2");
  });
});
