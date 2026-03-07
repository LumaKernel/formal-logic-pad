/**
 * クエスト→ノートブック統合の純粋ロジック。
 *
 * クエストIDから、ノートブック作成に必要な全パラメータを組み立て、
 * NotebookCollectionに新しいクエストノートブックを作成する一連の処理を提供する。
 *
 * 変更時は questNotebookIntegration.test.ts も同期すること。
 */

import type { NotebookCollection, NotebookId } from "../notebook/notebookState";
import { createQuestNotebook, findNotebook } from "../notebook/notebookState";
import type {
  NotebookListItem,
  QuestProgressInfo,
} from "../notebook/notebookListLogic";
import type { Notebook } from "../notebook/notebookState";
import type { QuestDefinition } from "./questDefinition";
import type { QuestStartError } from "./questStartLogic";
import { prepareQuestStart } from "./questStartLogic";
import { checkQuestGoals } from "./questCompletionLogic";

// --- クエスト開始→ノートブック作成 結果型 ---

/** クエスト開始成功時の結果 */
export type QuestStartSuccess = {
  readonly ok: true;
  readonly notebookId: NotebookId;
  readonly questId: string;
  readonly collection: NotebookCollection;
};

/** クエスト開始失敗時の結果 */
export type QuestStartFailure = {
  readonly ok: false;
  readonly reason: QuestStartError;
};

/** クエスト開始→ノートブック作成の結果 */
export type StartQuestResult = QuestStartSuccess | QuestStartFailure;

/**
 * クエストIDからノートブックを作成する統合関数。
 *
 * 1. クエスト定義を検索
 * 2. 公理系プリセットを解決
 * 3. ノートブック作成パラメータを組み立て
 * 4. クエストノートブックをコレクションに追加
 *
 * @param quests クエスト定義一覧
 * @param questId 開始するクエストのID
 * @param collection 現在のノートブックコレクション
 * @param now 現在時刻（ミリ秒）
 * @returns 成功時は新しいコレクションとノートブックID、失敗時はエラー理由
 */
export function startQuestAndCreateNotebook(
  quests: readonly QuestDefinition[],
  questId: string,
  collection: NotebookCollection,
  now: number,
): StartQuestResult {
  const result = prepareQuestStart(quests, questId);
  if (!result.ok) {
    return result;
  }

  const quest = quests.find((q) => q.id === questId);
  const { name, deductionSystem, goals } = result.params;
  const newCollection = createQuestNotebook(collection, {
    name,
    system: deductionSystem,
    goals,
    now,
    questId,
    questVersion: quest?.version,
  });

  // 新しく追加されたノートブックのIDを取得
  const added = newCollection.notebooks[newCollection.notebooks.length - 1];
  /* v8 ignore start */
  if (added === undefined) {
    // 理論上到達しないが、防御的に処理
    return { ok: false, reason: "preset-not-found" };
  }
  /* v8 ignore stop */

  return {
    ok: true,
    notebookId: added.meta.id,
    questId,
    collection: newCollection,
  };
}

/**
 * ノートブックIDから紐付けられたクエストIDを取得する。
 *
 * @param collection ノートブックコレクション
 * @param notebookId ノートブックID
 * @returns クエストID（紐付けがない場合はundefined）
 */
export function getQuestIdForNotebook(
  collection: NotebookCollection,
  notebookId: NotebookId,
): string | undefined {
  const notebook = findNotebook(collection, notebookId);
  return notebook?.questId;
}

/**
 * 特定クエストに紐付けられたノートブックIDの一覧を取得する。
 *
 * @param collection ノートブックコレクション
 * @param questId クエストID
 * @returns そのクエストに紐付けられたノートブックID一覧
 */
export function getNotebookIdsForQuest(
  collection: NotebookCollection,
  questId: string,
): readonly NotebookId[] {
  return collection.notebooks
    .filter((n) => n.questId === questId)
    .map((n) => n.meta.id);
}

/**
 * 単一ノートブックのクエスト進捗を計算する。
 * クエストモードかつゴールがある場合のみ進捗情報を返す。
 */
export function computeNotebookQuestProgress(
  notebook: Notebook,
): QuestProgressInfo | undefined {
  if (notebook.workspace.mode !== "quest") return undefined;
  const { goals, nodes } = notebook.workspace;
  if (goals.length === 0) return undefined;
  const result = checkQuestGoals(goals, nodes);
  if (result._tag === "AllAchieved")
    return { achievedCount: goals.length, totalCount: goals.length };
  /* v8 ignore start -- result._tag === "NoGoals" は goals.length > 0 チェック後なので到達不能 */
  if (result._tag !== "NotAllAchieved") return undefined;
  /* v8 ignore stop */
  return {
    achievedCount: result.achievedCount,
    totalCount: result.totalCount,
  };
}

/**
 * NotebookListItemにクエスト進捗情報を付与する。
 * notebooksとlistItemsは同じ順序・同じ長さであること。
 */
export function enrichListItemsWithQuestProgress(
  listItems: readonly NotebookListItem[],
  notebooks: readonly Notebook[],
): readonly NotebookListItem[] {
  return listItems.map((item, i) => {
    const notebook = notebooks[i];
    if (notebook === undefined) return item;
    const questProgress = computeNotebookQuestProgress(notebook);
    if (questProgress === undefined) return item;
    return { ...item, questProgress };
  });
}
