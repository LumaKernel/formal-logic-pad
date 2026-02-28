/**
 * クエスト→ノートブック絞り込みの純粋ロジック。
 *
 * クエスト一覧にノートブック数を表示し、
 * 特定クエストに紐付くノートブックを絞り込むための計算を提供する。
 *
 * 変更時は questNotebookFilterLogic.test.ts も同期すること。
 */

import type { NotebookCollection } from "../notebook/notebookState";
import type { QuestId } from "./questDefinition";

// --- ノートブック数の計算 ---

/** クエストIDごとのノートブック数マップ */
export type QuestNotebookCounts = ReadonlyMap<QuestId, number>;

/**
 * コレクション内のノートブックを走査し、クエストIDごとのノートブック数を計算する。
 *
 * @param collection ノートブックコレクション
 * @returns クエストIDをキー、ノートブック数を値とするMap
 */
export function computeQuestNotebookCounts(
  collection: NotebookCollection,
): QuestNotebookCounts {
  const counts = new Map<QuestId, number>();
  for (const notebook of collection.notebooks) {
    if (notebook.questId !== undefined) {
      const current = counts.get(notebook.questId) ?? 0;
      counts.set(notebook.questId, current + 1);
    }
  }
  return counts;
}

/**
 * 特定クエストのノートブック数を取得する。
 *
 * @param counts 事前計算済みのカウントマップ
 * @param questId クエストID
 * @returns ノートブック数（0以上）
 */
export function getNotebookCountForQuest(
  counts: QuestNotebookCounts,
  questId: QuestId,
): number {
  return counts.get(questId) ?? 0;
}

// --- ノートブック数の表示テキスト ---

/**
 * ノートブック数の表示テキストを生成する。
 *
 * @param count ノートブック数
 * @returns 表示テキスト（0の場合は空文字列）
 */
export function notebookCountText(count: number): string {
  if (count === 0) {
    return "";
  }
  return `${String(count) satisfies string}冊`;
}
