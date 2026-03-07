/**
 * クエストカタログ一覧UIの純粋ロジック。
 *
 * カタログ表示に必要なフィルタ状態管理、表示用テキスト生成を提供する。
 * questCatalog.ts のフィルタ関数と組み合わせて使う。
 *
 * 変更時は questCatalogListLogic.test.ts も同期すること。
 */

import type { DifficultyLevel } from "./questDefinition";
import type {
  QuestCatalogItem,
  QuestRating,
  CategoryGroup,
} from "./questCatalog";
import {
  filterByDifficulty,
  filterIncomplete,
  filterCompleted,
} from "./questCatalog";

// --- フィルタ状態 ---

/** 完了状態フィルタ */
export type CompletionFilter = "all" | "completed" | "incomplete";

/** フィルタ状態 */
export type CatalogFilterState = {
  readonly difficulty: DifficultyLevel | null;
  readonly completion: CompletionFilter;
};

/** デフォルトのフィルタ状態 */
export const defaultFilterState: CatalogFilterState = {
  difficulty: null,
  completion: "all",
};

// --- フィルタ適用 ---

/** フィルタ状態をアイテム一覧に適用する */
export function applyFilters(
  items: readonly QuestCatalogItem[],
  filter: CatalogFilterState,
): readonly QuestCatalogItem[] {
  let result = items;

  if (filter.difficulty !== null) {
    result = filterByDifficulty(result, filter.difficulty);
  }

  if (filter.completion === "completed") {
    result = filterCompleted(result);
  } else if (filter.completion === "incomplete") {
    result = filterIncomplete(result);
  }
  // "all": no filtering needed

  return result;
}

/** カテゴリグループにフィルタを適用する */
export function applyFiltersToGroups(
  groups: readonly CategoryGroup[],
  filter: CatalogFilterState,
): readonly CategoryGroup[] {
  return groups
    .map((g) => {
      const filteredItems = applyFilters(g.items, filter);
      return {
        ...g,
        items: filteredItems,
        completedCount: filteredItems.filter((i) => i.completed).length,
        totalCount: filteredItems.length,
      };
    })
    .filter((g) => g.totalCount > 0);
}

// --- 表示用テキスト ---

/** 難易度の表示ラベル */
export function difficultyLabel(level: DifficultyLevel): string {
  const labels: Record<DifficultyLevel, string> = {
    1: "★",
    2: "★★",
    3: "★★★",
    4: "★★★★",
    5: "★★★★★",
  };
  return labels[level];
}

/** 難易度の短い表示ラベル */
export function difficultyShortLabel(level: DifficultyLevel): string {
  return `Lv.${String(level) satisfies string}`;
}

/** 評価の表示ラベル */
export function ratingLabel(rating: QuestRating): string {
  if (rating === "perfect") return "Perfect!";
  if (rating === "good") return "Good";
  if (rating === "completed") return "Clear";
  // rating: "not-completed" (TypeScript narrowing)
  return "未クリア";
}

/** 評価のアクセントカラー */
export function ratingColor(rating: QuestRating): string {
  if (rating === "perfect") return "#FFD700";
  if (rating === "good") return "#4CAF50";
  if (rating === "completed") return "#2196F3";
  // rating: "not-completed" (TypeScript narrowing)
  return "#9E9E9E";
}

/** 評価のCSS変数ペア（bg, text） */
export function ratingCssVars(rating: QuestRating): {
  readonly bg: string;
  readonly text: string;
} {
  if (rating === "perfect")
    return {
      bg: "var(--color-quest-rating-perfect-bg)",
      text: "var(--color-quest-rating-perfect-text)",
    };
  if (rating === "good")
    return {
      bg: "var(--color-quest-rating-good-bg)",
      text: "var(--color-quest-rating-good-text)",
    };
  if (rating === "completed")
    return {
      bg: "var(--color-quest-rating-clear-bg)",
      text: "var(--color-quest-rating-clear-text)",
    };
  // rating: "not-completed" (TypeScript narrowing)
  return {
    bg: "var(--color-quest-rating-none-bg)",
    text: "var(--color-quest-rating-none-text)",
  };
}

/** 難易度の星を filled/empty 配列で返す */
export function difficultyStars(level: DifficultyLevel): readonly boolean[] {
  const maxStars = 5;
  return Array.from({ length: maxStars }, (_, i) => i < level);
}

/** カテゴリの進捗テキスト（例: "3 / 5"） */
export function categoryProgressText(
  completedCount: number,
  totalCount: number,
): string {
  return `${String(completedCount) satisfies string} / ${String(totalCount) satisfies string}`;
}

/** ステップ数の表示テキスト */
export function stepCountText(
  bestStepCount: number | undefined,
  estimatedSteps: number,
): string {
  if (bestStepCount === undefined) {
    return `目安: ${String(estimatedSteps) satisfies string}ステップ`;
  }
  return `ベスト: ${String(bestStepCount) satisfies string} / 目安: ${String(estimatedSteps) satisfies string}`;
}

// --- 完了状態フィルタの選択肢 ---

/** 完了状態フィルタの選択肢 */
export const completionFilterOptions: readonly {
  readonly value: CompletionFilter;
  readonly label: string;
}[] = [
  { value: "all", label: "すべて" },
  { value: "completed", label: "クリア済み" },
  { value: "incomplete", label: "未クリア" },
];

/** 難易度フィルタの選択肢（nullで全表示） */
export const difficultyFilterOptions: readonly {
  readonly value: DifficultyLevel | null;
  readonly label: string;
}[] = [
  { value: null, label: "全難易度" },
  { value: 1, label: "★" },
  { value: 2, label: "★★" },
  { value: 3, label: "★★★" },
  { value: 4, label: "★★★★" },
  { value: 5, label: "★★★★★" },
];
