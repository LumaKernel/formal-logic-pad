/**
 * クエストカタログの純粋ロジック。
 *
 * ビルトインクエスト定義と進捗状態を組み合わせて、
 * UI表示用のデータ（カタログアイテム）を生成する。
 *
 * 変更時は questCatalog.test.ts も同期すること。
 */

import type {
  QuestDefinition,
  QuestId,
  QuestCategory,
  DifficultyLevel,
  QuestCategoryMeta,
} from "./questDefinition";
import { questCategories, sortQuests } from "./questDefinition";
import type { QuestProgressState } from "./questProgress";
import {
  isQuestCompleted,
  getBestStepCount,
  getCompletionCount,
} from "./questProgress";

// --- カタログアイテム ---

/** UI表示用のクエスト情報 */
export type QuestCatalogItem = {
  readonly quest: QuestDefinition;
  /** 完了済みかどうか */
  readonly completed: boolean;
  /** 完了回数 */
  readonly completionCount: number;
  /** ベストステップ数（未完了の場合はundefined） */
  readonly bestStepCount: number | undefined;
  /** 推定ステップ数と比較した評価 */
  readonly rating: QuestRating;
};

/**
 * ベストステップ数に基づく評価。
 * - "perfect": 推定ステップ数以下で完了
 * - "good": 推定ステップ数の1.5倍以下で完了
 * - "completed": それ以上で完了
 * - "not-completed": 未完了
 */
export type QuestRating = "perfect" | "good" | "completed" | "not-completed";

/** ベストステップ数と推定ステップ数から評価を算出する */
export function computeRating(
  bestStepCount: number | undefined,
  estimatedSteps: number | undefined,
): QuestRating {
  if (bestStepCount === undefined) return "not-completed";
  if (estimatedSteps === undefined) return "completed";
  if (bestStepCount <= estimatedSteps) return "perfect";
  if (bestStepCount <= estimatedSteps * 1.5) return "good";
  return "completed";
}

// --- カタログ生成 ---

/** クエスト定義と進捗状態からカタログアイテムを生成する */
export function toCatalogItem(
  quest: QuestDefinition,
  progress: QuestProgressState,
): QuestCatalogItem {
  const completed = isQuestCompleted(progress, quest.id);
  const completionCount = getCompletionCount(progress, quest.id);
  const bestStepCount = getBestStepCount(progress, quest.id);
  const rating = computeRating(bestStepCount, quest.estimatedSteps);
  return {
    quest,
    completed,
    completionCount,
    bestStepCount,
    rating,
  };
}

/** 全クエストからカタログアイテム一覧を生成する（ソート済み） */
export function buildCatalog(
  quests: readonly QuestDefinition[],
  progress: QuestProgressState,
): readonly QuestCatalogItem[] {
  const sorted = sortQuests(quests);
  return sorted.map((q) => toCatalogItem(q, progress));
}

// --- カテゴリ別カタログ ---

/** カテゴリとそのクエスト一覧のペア */
export type CategoryGroup = {
  readonly category: QuestCategoryMeta;
  readonly items: readonly QuestCatalogItem[];
  /** カテゴリ内の完了数 */
  readonly completedCount: number;
  /** カテゴリ内の合計数 */
  readonly totalCount: number;
};

/** カテゴリ別にグループ化されたカタログを生成する */
export function buildCatalogByCategory(
  quests: readonly QuestDefinition[],
  progress: QuestProgressState,
): readonly CategoryGroup[] {
  const catalog = buildCatalog(quests, progress);

  // カテゴリ別にグループ化
  const groupMap = new Map<QuestCategory, QuestCatalogItem[]>();
  for (const item of catalog) {
    const existing = groupMap.get(item.quest.category);
    if (existing !== undefined) {
      existing.push(item);
    } else {
      groupMap.set(item.quest.category, [item]);
    }
  }

  // カテゴリ順に並べる
  const result: CategoryGroup[] = [];
  for (const categoryMeta of questCategories) {
    const items = groupMap.get(categoryMeta.id);
    if (items !== undefined && items.length > 0) {
      result.push({
        category: categoryMeta,
        items,
        completedCount: items.filter((i) => i.completed).length,
        totalCount: items.length,
      });
    }
  }

  return result;
}

// --- フィルタリング ---

/** 難易度でフィルタする */
export function filterByDifficulty(
  items: readonly QuestCatalogItem[],
  difficulty: DifficultyLevel,
): readonly QuestCatalogItem[] {
  return items.filter((i) => i.quest.difficulty === difficulty);
}

/** 未完了のみフィルタする */
export function filterIncomplete(
  items: readonly QuestCatalogItem[],
): readonly QuestCatalogItem[] {
  return items.filter((i) => !i.completed);
}

/** 完了済みのみフィルタする */
export function filterCompleted(
  items: readonly QuestCatalogItem[],
): readonly QuestCatalogItem[] {
  return items.filter((i) => i.completed);
}

// --- 検索 ---

/** IDでクエスト定義を検索する */
export function findQuestById(
  quests: readonly QuestDefinition[],
  questId: QuestId,
): QuestDefinition | undefined {
  return quests.find((q) => q.id === questId);
}
