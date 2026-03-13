/**
 * クエストとリファレンスエントリの逆マッピングロジック。
 *
 * referenceContent.ts の relatedQuestIds（reference → quest）を逆引きして、
 * quest → reference のマッピングを構築する純粋関数群。
 *
 * 変更時は questReferenceMappingLogic.test.ts も同期すること。
 */

import type {
  ReferenceEntry,
  ReferenceEntryId,
} from "../reference/referenceEntry";

// --- 型定義 ---

/** クエストIDからリファレンスエントリIDへのマッピング */
export type QuestReferenceMap = ReadonlyMap<
  string,
  readonly ReferenceEntryId[]
>;

// --- 逆マッピング構築 ---

/**
 * リファレンスエントリ群から questId → referenceEntryId[] の逆マッピングを構築する。
 *
 * referenceEntry.relatedQuestIds に含まれるクエストIDごとに、
 * そのエントリのIDを集約する。
 */
export function buildQuestToReferenceMap(
  entries: readonly ReferenceEntry[],
): QuestReferenceMap {
  const map = new Map<string, ReferenceEntryId[]>();
  for (const entry of entries) {
    const questIds = entry.relatedQuestIds;
    if (questIds === undefined) continue;
    for (const questId of questIds) {
      const existing = map.get(questId);
      if (existing !== undefined) {
        existing.push(entry.id);
      } else {
        map.set(questId, [entry.id]);
      }
    }
  }
  return map;
}

/**
 * クエストIDに関連するリファレンスエントリ数を取得する。
 * マッピングに含まれない場合は 0 を返す。
 */
export function getQuestReferenceCount(
  map: QuestReferenceMap,
  questId: string,
): number {
  return map.get(questId)?.length ?? 0;
}

/**
 * クエストIDに関連するリファレンスエントリIDを取得する。
 * マッピングに含まれない場合は空配列を返す。
 */
export function getQuestReferenceIds(
  map: QuestReferenceMap,
  questId: string,
): readonly ReferenceEntryId[] {
  return map.get(questId) ?? [];
}
