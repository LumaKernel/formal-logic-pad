/**
 * ノートブック（証明ワークスペースの集合）の純粋な状態管理ロジック。
 *
 * 個々のノート（Notebook）の作成・複製・削除・名前変更と、
 * ノートの一覧管理（NotebookCollection）を提供する。
 *
 * 変更時は notebookState.test.ts も同期すること。
 */

import type { LogicSystem } from "../logic-core/inferenceRule";
import type { DeductionSystem } from "../logic-core/deductionSystem";
import {
  createEmptyWorkspace,
  createQuestWorkspace,
  convertToFreeMode,
  type WorkspaceState,
  type QuestGoalDefinition,
} from "../proof-pad/workspaceState";

// --- ノートブックの型定義 ---

/** ノートブックの一意識別子 */
export type NotebookId = string;

/** ノートブックのメタデータ */
export type NotebookMeta = {
  readonly id: NotebookId;
  readonly name: string;
  readonly createdAt: number;
  readonly updatedAt: number;
};

/** ノートブック（メタデータ + ワークスペース状態） */
export type Notebook = {
  readonly meta: NotebookMeta;
  readonly workspace: WorkspaceState;
  /** クエストから作成された場合のクエストID（自由帳の場合はundefined） */
  readonly questId?: string;
  /** クエスト作成時のクエスト定義バージョン（自由帳の場合はundefined） */
  readonly questVersion?: number;
};

/** ノートブックのコレクション */
export type NotebookCollection = {
  readonly notebooks: readonly Notebook[];
  readonly nextId: number;
};

// --- 初期状態 ---

/** 空のコレクションを作成する */
export function createEmptyCollection(): NotebookCollection {
  return {
    notebooks: [],
    nextId: 1,
  };
}

// --- ノートブック作成 ---

/** 新しいノートブックを作成するためのパラメータ */
export type CreateNotebookParams = {
  readonly name: string;
  readonly system: LogicSystem | DeductionSystem;
  readonly now: number;
};

/** 新しいノートブックを作成してコレクションに追加する */
export function createNotebook(
  collection: NotebookCollection,
  params: CreateNotebookParams,
): NotebookCollection {
  const id = `notebook-${String(collection.nextId) satisfies string}`;
  const notebook: Notebook = {
    meta: {
      id,
      name: params.name,
      createdAt: params.now,
      updatedAt: params.now,
    },
    workspace: createEmptyWorkspace(params.system),
  };
  return {
    notebooks: [...collection.notebooks, notebook],
    nextId: collection.nextId + 1,
  };
}

/** クエストノートブックを作成するためのパラメータ */
export type CreateQuestNotebookParams = {
  readonly name: string;
  readonly system: LogicSystem | DeductionSystem;
  readonly goals: readonly QuestGoalDefinition[];
  readonly now: number;
  /** 紐付けるクエストID（進捗記録に使用） */
  readonly questId?: string;
  /** クエスト定義のバージョン番号 */
  readonly questVersion?: number;
};

/** クエストモードのノートブックを作成してコレクションに追加する */
export function createQuestNotebook(
  collection: NotebookCollection,
  params: CreateQuestNotebookParams,
): NotebookCollection {
  const id = `notebook-${String(collection.nextId) satisfies string}`;
  const notebook: Notebook = {
    meta: {
      id,
      name: params.name,
      createdAt: params.now,
      updatedAt: params.now,
    },
    workspace: createQuestWorkspace(params.system, params.goals),
    questId: params.questId,
    questVersion: params.questVersion,
  };
  return {
    notebooks: [...collection.notebooks, notebook],
    nextId: collection.nextId + 1,
  };
}

// --- ノートブック検索 ---

/** IDでノートブックを検索する */
export function findNotebook(
  collection: NotebookCollection,
  id: NotebookId,
): Notebook | undefined {
  return collection.notebooks.find((n) => n.meta.id === id);
}

/** コレクション内のノートブック数を返す */
export function notebookCount(collection: NotebookCollection): number {
  return collection.notebooks.length;
}

// --- ノートブック更新 ---

/** ノートブックの名前を変更する */
export function renameNotebook(
  collection: NotebookCollection,
  id: NotebookId,
  newName: string,
  now: number,
): NotebookCollection {
  return {
    ...collection,
    notebooks: collection.notebooks.map((n) =>
      n.meta.id === id
        ? { ...n, meta: { ...n.meta, name: newName, updatedAt: now } }
        : n,
    ),
  };
}

/** ノートブックのワークスペース状態を更新する */
export function updateNotebookWorkspace(
  collection: NotebookCollection,
  id: NotebookId,
  workspace: WorkspaceState,
  now: number,
): NotebookCollection {
  return {
    ...collection,
    notebooks: collection.notebooks.map((n) =>
      n.meta.id === id
        ? { ...n, meta: { ...n.meta, updatedAt: now }, workspace }
        : n,
    ),
  };
}

// --- ノートブック削除 ---

/** ノートブックを削除する */
export function removeNotebook(
  collection: NotebookCollection,
  id: NotebookId,
): NotebookCollection {
  return {
    ...collection,
    notebooks: collection.notebooks.filter((n) => n.meta.id !== id),
  };
}

// --- ノートブック複製 ---

/** ノートブックを複製する */
export function duplicateNotebook(
  collection: NotebookCollection,
  id: NotebookId,
  now: number,
): NotebookCollection {
  const source = findNotebook(collection, id);
  if (source === undefined) {
    return collection;
  }
  const newId = `notebook-${String(collection.nextId) satisfies string}`;
  const duplicated: Notebook = {
    meta: {
      id: newId,
      name: `${source.meta.name satisfies string} (copy)`,
      createdAt: now,
      updatedAt: now,
    },
    workspace: source.workspace,
  };
  return {
    notebooks: [...collection.notebooks, duplicated],
    nextId: collection.nextId + 1,
  };
}

// --- モード変換 ---

/** 自由帳への変換結果 */
export type ConvertToFreeModeResult = {
  readonly collection: NotebookCollection;
  /** 新しく作成された自由帳ノートブックのID（変換が行われなかった場合はundefined） */
  readonly newNotebookId: NotebookId | undefined;
};

/**
 * クエストモードのノートブックを複製して自由帳モードに変換する。
 * 元のクエストノートブックは保持される。
 */
export function convertNotebookToFreeMode(
  collection: NotebookCollection,
  id: NotebookId,
  now: number,
): ConvertToFreeModeResult {
  const source = findNotebook(collection, id);
  if (source === undefined) {
    return { collection, newNotebookId: undefined };
  }
  if (source.workspace.mode === "free") {
    return { collection, newNotebookId: undefined };
  }
  const newId = `notebook-${String(collection.nextId) satisfies string}`;
  const converted = convertToFreeMode(source.workspace);
  const newNotebook: Notebook = {
    meta: {
      id: newId,
      name: `${source.meta.name satisfies string} (自由帳)`,
      createdAt: now,
      updatedAt: now,
    },
    workspace: converted,
  };
  return {
    collection: {
      ...collection,
      notebooks: [...collection.notebooks, newNotebook],
      nextId: collection.nextId + 1,
    },
    newNotebookId: newId,
  };
}

// --- ソート ---

/** 更新日時の降順でソートされたノートブック一覧を返す */
export function listNotebooksByUpdatedAt(
  collection: NotebookCollection,
): readonly Notebook[] {
  return [...collection.notebooks].sort(
    (a, b) => b.meta.updatedAt - a.meta.updatedAt,
  );
}

/** 作成日時の降順でソートされたノートブック一覧を返す */
export function listNotebooksByCreatedAt(
  collection: NotebookCollection,
): readonly Notebook[] {
  return [...collection.notebooks].sort(
    (a, b) => b.meta.createdAt - a.meta.createdAt,
  );
}
