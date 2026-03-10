/**
 * ノートブックコレクションの状態管理 React hook。
 *
 * localStorage への永続化を含む。
 * 純粋ロジック (notebookState.ts) と シリアライズ (notebookSerialization.ts) に依存。
 *
 * 変更時は useNotebookCollection.test.tsx も同期すること。
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LogicSystem } from "../logic-core/inferenceRule";
import type { DeductionSystem } from "../logic-core/deductionSystem";
import type { WorkspaceState } from "../proof-pad/workspaceState";
import type { QuestGoalDefinition } from "../proof-pad/workspaceState";
import type { NotebookCollection, NotebookId } from "./notebookState";
import {
  createEmptyCollection,
  createNotebook,
  createQuestNotebook,
  removeNotebook,
  renameNotebook,
  duplicateNotebook,
  updateNotebookWorkspace,
  convertNotebookToFreeMode,
  listNotebooksByUpdatedAt,
} from "./notebookState";
import {
  serializeCollection,
  deserializeCollection,
} from "./notebookSerialization";

// --- localStorage adapter (pure functions operating on Storage interface) ---

export const NOTEBOOK_STORAGE_KEY = "notebook-collection";

export function loadCollection(storage: Storage): NotebookCollection {
  const stored = storage.getItem(NOTEBOOK_STORAGE_KEY);
  if (stored === null) {
    return createEmptyCollection();
  }
  return deserializeCollection(stored);
}

export function saveCollection(
  storage: Storage,
  collection: NotebookCollection,
): void {
  storage.setItem(NOTEBOOK_STORAGE_KEY, serializeCollection(collection));
}

// --- hook ---

/** 現在時刻を取得する関数の型（テスト時にモック可能） */
export type GetNow = () => number;

export interface UseNotebookCollectionResult {
  /** 更新日時順でソートされたノートブック一覧 */
  readonly notebooks: ReturnType<typeof listNotebooksByUpdatedAt>;
  /** コレクション全体 */
  readonly collection: NotebookCollection;
  /** ノートブックを新規作成する */
  readonly create: (
    name: string,
    system: LogicSystem | DeductionSystem,
  ) => NotebookId;
  /** クエストノートブックを新規作成する */
  readonly createQuest: (
    name: string,
    system: LogicSystem | DeductionSystem,
    goals: readonly QuestGoalDefinition[],
    questId?: string,
    questVersion?: number,
  ) => NotebookId;
  /** ノートブックを削除する */
  readonly remove: (id: NotebookId) => void;
  /** ノートブックの名前を変更する */
  readonly rename: (id: NotebookId, newName: string) => void;
  /** ノートブックを複製する */
  readonly duplicate: (id: NotebookId) => NotebookId;
  /** ノートブックのワークスペースを更新する */
  readonly updateWorkspace: (id: NotebookId, workspace: WorkspaceState) => void;
  /** クエストモードを複製して自由帳モードに変換する（新しいノートブックIDを返す） */
  readonly convertToFree: (id: NotebookId) => NotebookId | undefined;
  /** コレクション全体を直接設定する（インポート等で使用） */
  readonly setCollection: (collection: NotebookCollection) => void;
}

export interface UseNotebookCollectionOptions {
  /** 現在時刻取得関数（テスト用DI） */
  readonly getNow?: GetNow;
}

/* v8 ignore start */
function defaultGetNow(): number {
  // eslint-disable-next-line @luma-dev/luma-ts/no-date
  return Date.now();
}
/* v8 ignore stop */

export function useNotebookCollection(
  options?: UseNotebookCollectionOptions,
): UseNotebookCollectionResult {
  const getNow = options?.getNow ?? defaultGetNow;

  const [collection, setCollection] = useState<NotebookCollection>(() =>
    /* v8 ignore start */
    typeof window === "undefined"
      ? createEmptyCollection()
      : /* v8 ignore stop */
        loadCollection(window.localStorage),
  );

  // Persist to localStorage when collection changes
  useEffect(() => {
    /* v8 ignore start */
    if (typeof window === "undefined") return;
    /* v8 ignore stop */
    saveCollection(window.localStorage, collection);
  }, [collection]);

  const create = useCallback(
    (name: string, system: LogicSystem | DeductionSystem): NotebookId => {
      const now = getNow();
      let newId: NotebookId = "";
      setCollection((prev) => {
        const next = createNotebook(prev, { name, system, now });
        const added = next.notebooks[next.notebooks.length - 1];
        // 防御コード: createNotebookは必ずノートブックを追加するためundefinedにはならない
        /* v8 ignore start */
        if (added !== undefined) {
          /* v8 ignore stop */
          newId = added.meta.id;
        }
        return next;
      });
      return newId;
    },
    [getNow],
  );

  const createQuest = useCallback(
    (
      name: string,
      system: LogicSystem | DeductionSystem,
      goals: readonly QuestGoalDefinition[],
      questId?: string,
      questVersion?: number,
    ): NotebookId => {
      const now = getNow();
      let newId: NotebookId = "";
      setCollection((prev) => {
        const next = createQuestNotebook(prev, {
          name,
          system,
          goals,
          now,
          questId,
          questVersion,
        });
        const added = next.notebooks[next.notebooks.length - 1];
        // 防御コード: createQuestNotebookは必ずノートブックを追加するためundefinedにはならない
        /* v8 ignore start */
        if (added !== undefined) {
          /* v8 ignore stop */
          newId = added.meta.id;
        }
        return next;
      });
      return newId;
    },
    [getNow],
  );

  const remove = useCallback((id: NotebookId) => {
    setCollection((prev) => removeNotebook(prev, id));
  }, []);

  const rename = useCallback(
    (id: NotebookId, newName: string) => {
      setCollection((prev) => renameNotebook(prev, id, newName, getNow()));
    },
    [getNow],
  );

  const duplicate = useCallback(
    (id: NotebookId): NotebookId => {
      const now = getNow();
      let newId: NotebookId = "";
      setCollection((prev) => {
        const next = duplicateNotebook(prev, id, now);
        const added = next.notebooks[next.notebooks.length - 1];
        // 防御コード: duplicateNotebookは必ずノートブックを追加するためundefinedにはならない
        /* v8 ignore start */
        if (added !== undefined) {
          /* v8 ignore stop */
          newId = added.meta.id;
        }
        return next;
      });
      return newId;
    },
    [getNow],
  );

  const updateWorkspace = useCallback(
    (id: NotebookId, workspace: WorkspaceState) => {
      setCollection((prev) =>
        updateNotebookWorkspace(prev, id, workspace, getNow()),
      );
    },
    [getNow],
  );

  const convertToFree = useCallback(
    (id: NotebookId): NotebookId | undefined => {
      let newId: NotebookId | undefined;
      setCollection((prev) => {
        const result = convertNotebookToFreeMode(prev, id, getNow());
        newId = result.newNotebookId;
        return result.collection;
      });
      return newId;
    },
    [getNow],
  );

  const notebooks = useMemo(
    () => listNotebooksByUpdatedAt(collection),
    [collection],
  );

  return useMemo(
    () => ({
      notebooks,
      collection,
      create,
      createQuest,
      remove,
      rename,
      duplicate,
      updateWorkspace,
      convertToFree,
      setCollection,
    }),
    [
      notebooks,
      collection,
      create,
      createQuest,
      remove,
      rename,
      duplicate,
      updateWorkspace,
      convertToFree,
    ],
  );
}
