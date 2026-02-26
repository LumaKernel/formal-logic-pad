import { describe, it, expect } from "vitest";
import {
  applyFilters,
  applyFiltersToGroups,
  defaultFilterState,
  difficultyLabel,
  difficultyShortLabel,
  ratingLabel,
  ratingColor,
  ratingCssVars,
  difficultyStars,
  categoryProgressText,
  stepCountText,
  completionFilterOptions,
  difficultyFilterOptions,
  type CatalogFilterState,
} from "./questCatalogListLogic";
import type {
  QuestCatalogItem,
  CategoryGroup,
  QuestRating,
} from "./questCatalog";
import type { QuestDefinition } from "./questDefinition";

// --- テストヘルパー ---

function makeQuest(overrides: Partial<QuestDefinition> = {}): QuestDefinition {
  return {
    id: "test-01",
    category: "propositional-basics",
    title: "テスト問題",
    description: "テスト",
    difficulty: 1,
    systemPresetId: "lukasiewicz",
    goals: [],
    hints: [],
    estimatedSteps: 5,
    learningPoint: "テスト",
    order: 1,
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

function makeGroup(
  overrides: Partial<CategoryGroup> & {
    readonly items?: readonly QuestCatalogItem[];
  } = {},
): CategoryGroup {
  const items = overrides.items ?? [makeItem()];
  return {
    category: {
      id: "propositional-basics",
      label: "命題論理の基礎",
      description: "テスト",
      order: 1,
    },
    items,
    completedCount: items.filter((i) => i.completed).length,
    totalCount: items.length,
    ...overrides,
  };
}

// --- デフォルト状態 ---

describe("defaultFilterState", () => {
  it("difficulty=null, completion=all", () => {
    expect(defaultFilterState).toEqual({
      difficulty: null,
      completion: "all",
    });
  });
});

// --- applyFilters ---

describe("applyFilters", () => {
  const items: readonly QuestCatalogItem[] = [
    makeItem({
      questOverrides: { id: "q1", difficulty: 1 },
      completed: true,
      rating: "perfect",
    }),
    makeItem({
      questOverrides: { id: "q2", difficulty: 2 },
      completed: false,
      rating: "not-completed",
    }),
    makeItem({
      questOverrides: { id: "q3", difficulty: 1 },
      completed: true,
      rating: "good",
    }),
    makeItem({
      questOverrides: { id: "q4", difficulty: 2 },
      completed: true,
      rating: "completed",
    }),
  ];

  it("デフォルトフィルタでは全件返す", () => {
    expect(applyFilters(items, defaultFilterState)).toHaveLength(4);
  });

  it("難易度フィルタで絞り込む", () => {
    const filter: CatalogFilterState = { difficulty: 1, completion: "all" };
    const result = applyFilters(items, filter);
    expect(result).toHaveLength(2);
    expect(result.every((i) => i.quest.difficulty === 1)).toBe(true);
  });

  it("完了フィルタ: completed", () => {
    const filter: CatalogFilterState = {
      difficulty: null,
      completion: "completed",
    };
    const result = applyFilters(items, filter);
    expect(result).toHaveLength(3);
    expect(result.every((i) => i.completed)).toBe(true);
  });

  it("完了フィルタ: incomplete", () => {
    const filter: CatalogFilterState = {
      difficulty: null,
      completion: "incomplete",
    };
    const result = applyFilters(items, filter);
    expect(result).toHaveLength(1);
    expect(result[0]?.quest.id).toBe("q2");
  });

  it("難易度と完了の両方で絞り込む", () => {
    const filter: CatalogFilterState = {
      difficulty: 1,
      completion: "completed",
    };
    const result = applyFilters(items, filter);
    expect(result).toHaveLength(2);
    expect(result.every((i) => i.quest.difficulty === 1 && i.completed)).toBe(
      true,
    );
  });

  it("空のリストに適用しても空", () => {
    expect(applyFilters([], defaultFilterState)).toEqual([]);
  });
});

// --- applyFiltersToGroups ---

describe("applyFiltersToGroups", () => {
  const group1Items: readonly QuestCatalogItem[] = [
    makeItem({
      questOverrides: { id: "g1-q1", difficulty: 1 },
      completed: true,
      rating: "perfect",
    }),
    makeItem({
      questOverrides: { id: "g1-q2", difficulty: 2 },
      completed: false,
      rating: "not-completed",
    }),
  ];

  const group2Items: readonly QuestCatalogItem[] = [
    makeItem({
      questOverrides: {
        id: "g2-q1",
        difficulty: 2,
        category: "propositional-negation",
      },
      completed: false,
      rating: "not-completed",
    }),
  ];

  const groups: readonly CategoryGroup[] = [
    makeGroup({ items: group1Items }),
    makeGroup({
      category: {
        id: "propositional-negation",
        label: "否定",
        description: "テスト",
        order: 2,
      },
      items: group2Items,
    }),
  ];

  it("デフォルトフィルタでは全グループ返す", () => {
    const result = applyFiltersToGroups(groups, defaultFilterState);
    expect(result).toHaveLength(2);
  });

  it("フィルタ後に空になったグループは除外される", () => {
    const filter: CatalogFilterState = { difficulty: 1, completion: "all" };
    const result = applyFiltersToGroups(groups, filter);
    expect(result).toHaveLength(1);
    expect(result[0]?.items).toHaveLength(1);
  });

  it("completedCountとtotalCountが再計算される", () => {
    const filter: CatalogFilterState = {
      difficulty: null,
      completion: "completed",
    };
    const result = applyFiltersToGroups(groups, filter);
    expect(result).toHaveLength(1);
    expect(result[0]?.completedCount).toBe(1);
    expect(result[0]?.totalCount).toBe(1);
  });
});

// --- 表示用テキスト ---

describe("difficultyLabel", () => {
  it("レベル1は★", () => {
    expect(difficultyLabel(1)).toBe("★");
  });

  it("レベル5は★★★★★", () => {
    expect(difficultyLabel(5)).toBe("★★★★★");
  });

  it("全レベル分存在する", () => {
    const levels = [1, 2, 3, 4, 5] as const;
    for (const level of levels) {
      expect(difficultyLabel(level)).toHaveLength(level);
    }
  });
});

describe("difficultyShortLabel", () => {
  it("Lv.Nの形式", () => {
    expect(difficultyShortLabel(1)).toBe("Lv.1");
    expect(difficultyShortLabel(3)).toBe("Lv.3");
  });
});

describe("ratingLabel", () => {
  it("各評価にラベルが対応する", () => {
    expect(ratingLabel("perfect")).toBe("Perfect!");
    expect(ratingLabel("good")).toBe("Good");
    expect(ratingLabel("completed")).toBe("Clear");
    expect(ratingLabel("not-completed")).toBe("未クリア");
  });
});

describe("ratingColor", () => {
  it("各評価にカラーが対応する", () => {
    const ratings: readonly QuestRating[] = [
      "perfect",
      "good",
      "completed",
      "not-completed",
    ];
    for (const rating of ratings) {
      expect(ratingColor(rating)).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it("perfectはゴールド", () => {
    expect(ratingColor("perfect")).toBe("#FFD700");
  });
});

describe("categoryProgressText", () => {
  it("進捗テキストの形式", () => {
    expect(categoryProgressText(3, 5)).toBe("3 / 5");
  });

  it("0 / 0", () => {
    expect(categoryProgressText(0, 0)).toBe("0 / 0");
  });
});

describe("stepCountText", () => {
  it("未完了の場合は目安のみ表示", () => {
    expect(stepCountText(undefined, 5)).toBe("目安: 5ステップ");
  });

  it("完了の場合はベストと目安を表示", () => {
    expect(stepCountText(3, 5)).toBe("ベスト: 3 / 目安: 5");
  });
});

// --- フィルタ選択肢 ---

describe("completionFilterOptions", () => {
  it("3つの選択肢がある", () => {
    expect(completionFilterOptions).toHaveLength(3);
  });

  it("all, completed, incompleteの値を持つ", () => {
    const values = completionFilterOptions.map((o) => o.value);
    expect(values).toEqual(["all", "completed", "incomplete"]);
  });
});

describe("difficultyFilterOptions", () => {
  it("6つの選択肢がある (null + 1-5)", () => {
    expect(difficultyFilterOptions).toHaveLength(6);
  });

  it("最初はnull（全難易度）", () => {
    expect(difficultyFilterOptions[0]?.value).toBeNull();
  });
});

// --- ratingCssVars ---

describe("ratingCssVars", () => {
  it("perfectはCSS変数ペアを返す", () => {
    const vars = ratingCssVars("perfect");
    expect(vars.bg).toContain("--color-quest-rating-perfect-bg");
    expect(vars.text).toContain("--color-quest-rating-perfect-text");
  });

  it("goodはCSS変数ペアを返す", () => {
    const vars = ratingCssVars("good");
    expect(vars.bg).toContain("--color-quest-rating-good-bg");
    expect(vars.text).toContain("--color-quest-rating-good-text");
  });

  it("completedはCSS変数ペアを返す", () => {
    const vars = ratingCssVars("completed");
    expect(vars.bg).toContain("--color-quest-rating-clear-bg");
    expect(vars.text).toContain("--color-quest-rating-clear-text");
  });

  it("not-completedはCSS変数ペアを返す", () => {
    const vars = ratingCssVars("not-completed");
    expect(vars.bg).toContain("--color-quest-rating-none-bg");
    expect(vars.text).toContain("--color-quest-rating-none-text");
  });
});

// --- difficultyStars ---

describe("difficultyStars", () => {
  it("難易度1で最初だけtrue、残りfalse", () => {
    const stars = difficultyStars(1);
    expect(stars).toEqual([true, false, false, false, false]);
  });

  it("難易度3で前3つがtrue", () => {
    const stars = difficultyStars(3);
    expect(stars).toEqual([true, true, true, false, false]);
  });

  it("難易度5で全部true", () => {
    const stars = difficultyStars(5);
    expect(stars).toEqual([true, true, true, true, true]);
  });

  it("常に5要素の配列を返す", () => {
    expect(difficultyStars(1)).toHaveLength(5);
    expect(difficultyStars(2)).toHaveLength(5);
    expect(difficultyStars(4)).toHaveLength(5);
  });
});
