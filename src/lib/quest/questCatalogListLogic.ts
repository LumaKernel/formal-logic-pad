/**
 * クエストカタログ一覧UIの純粋ロジック。
 *
 * カタログ表示に必要なフィルタ状態管理、表示用テキスト生成を提供する。
 * questCatalog.ts のフィルタ関数と組み合わせて使う。
 *
 * 変更時は questCatalogListLogic.test.ts も同期すること。
 */

import type { Locale } from "../../i18n/config";
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
export function ratingLabel(rating: QuestRating, locale: Locale): string {
  if (rating === "perfect") return "Perfect!";
  if (rating === "good") return "Good";
  if (rating === "completed") return locale === "ja" ? "クリア" : "Clear";
  // rating: "not-completed" (TypeScript narrowing)
  return locale === "ja" ? "未クリア" : "Not Cleared";
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
  estimatedSteps: number | undefined,
  locale: Locale,
): string {
  if (bestStepCount === undefined && estimatedSteps === undefined) {
    return "";
  }
  const est = locale === "ja" ? "目安" : "Est.";
  const best = locale === "ja" ? "ベスト" : "Best";
  const steps = locale === "ja" ? "ステップ" : " steps";
  if (bestStepCount === undefined) {
    return `${est satisfies string}: ${String(estimatedSteps) satisfies string}${steps satisfies string}`;
  }
  if (estimatedSteps === undefined) {
    return `${best satisfies string}: ${String(bestStepCount) satisfies string}${steps satisfies string}`;
  }
  return `${best satisfies string}: ${String(bestStepCount) satisfies string} / ${est satisfies string}: ${String(estimatedSteps) satisfies string}`;
}

// --- UIラベル ---

/** 難易度フィルタのラベル */
export function difficultyFilterLabel(locale: Locale): string {
  return locale === "ja" ? "難易度:" : "Difficulty:";
}

/** 完了状態フィルタのラベル */
export function completionFilterLabel(locale: Locale): string {
  return locale === "ja" ? "状態:" : "Status:";
}

/** クエスト開始ボタンのラベル */
export function startButtonLabel(completed: boolean, locale: Locale): string {
  if (completed) return locale === "ja" ? "再挑戦" : "Retry";
  return locale === "ja" ? "開始" : "Start";
}

// --- 完了状態フィルタの選択肢 ---

/** 完了状態フィルタの選択肢型 */
export type CompletionFilterOption = {
  readonly value: CompletionFilter;
  readonly label: string;
};

/** 完了状態フィルタの選択肢 */
export function completionFilterOptions(
  locale: Locale,
): readonly CompletionFilterOption[] {
  return [
    { value: "all", label: locale === "ja" ? "すべて" : "All" },
    { value: "completed", label: locale === "ja" ? "クリア済み" : "Cleared" },
    {
      value: "incomplete",
      label: locale === "ja" ? "未クリア" : "Not Cleared",
    },
  ];
}

/** 難易度フィルタの選択肢型 */
export type DifficultyFilterOption = {
  readonly value: DifficultyLevel | null;
  readonly label: string;
};

/** 難易度フィルタの選択肢（nullで全表示） */
export function difficultyFilterOptions(
  locale: Locale,
): readonly DifficultyFilterOption[] {
  return [
    {
      value: null,
      label: locale === "ja" ? "全難易度" : "All Levels",
    },
    { value: 1, label: "★" },
    { value: 2, label: "★★" },
    { value: 3, label: "★★★" },
    { value: 4, label: "★★★★" },
    { value: 5, label: "★★★★★" },
  ];
}
