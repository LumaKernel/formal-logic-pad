/**
 * 自作クエストのカタログ表示用ロジック。
 *
 * 自作クエストを QuestCatalogItem に変換し、一覧表示に必要なデータを生成する。
 * questCatalog.ts の toCatalogItem を再利用する。
 *
 * 変更時は customQuestCatalogLogic.test.ts, index.ts も同期すること。
 */

import type { QuestDefinition } from "./questDefinition";
import type { QuestCatalogItem } from "./questCatalog";
import { toCatalogItem } from "./questCatalog";
import type { QuestProgressState } from "./questProgress";
import type { CustomQuestCollection } from "./customQuestState";
import { listCustomQuests } from "./customQuestState";

/**
 * 自作クエストコレクションからカタログアイテム一覧を生成する。
 * ビルトインと同じ toCatalogItem で変換し、追加順に返す。
 */
export function buildCustomQuestCatalogItems(
  collection: CustomQuestCollection,
  progress: QuestProgressState,
): readonly QuestCatalogItem[] {
  const quests: readonly QuestDefinition[] = listCustomQuests(collection);
  return quests.map((q) => toCatalogItem(q, progress));
}

/** 自作クエストカタログアイテムの件数を返す */
export function getCustomQuestCatalogCount(
  items: readonly QuestCatalogItem[],
): number {
  return items.length;
}

/** 自作クエストカタログの完了数を返す */
export function getCustomQuestCompletedCount(
  items: readonly QuestCatalogItem[],
): number {
  return items.filter((i) => i.completed).length;
}

/** 自作クエストの進捗テキスト（例: "2 / 5"） */
export function customQuestProgressText(
  completedCount: number,
  totalCount: number,
): string {
  return `${String(completedCount) satisfies string} / ${String(totalCount) satisfies string}`;
}
