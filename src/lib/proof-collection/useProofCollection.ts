/**
 * 証明コレクションの状態管理 React hook。
 *
 * localStorage への永続化を含む。
 * 純粋ロジック (proofCollectionState.ts) と シリアライズ (proofCollectionSerialization.ts) に依存。
 *
 * 変更時は useProofCollection.test.tsx, index.ts も同期すること。
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ProofCollection,
  ProofEntryId,
  ProofFolderId,
  ProofEntry,
  ProofFolder,
  AddEntryParams,
} from "./proofCollectionState";
import {
  createEmptyProofCollection,
  addProofEntry,
  removeProofEntry,
  renameProofEntry,
  updateProofEntryMemo,
  moveProofEntry,
  listEntriesByUpdatedAt,
  createProofFolder,
  removeProofFolder,
  renameProofFolder,
  listFolders,
} from "./proofCollectionState";
import {
  serializeProofCollection,
  deserializeProofCollection,
} from "./proofCollectionSerialization";

// --- localStorage adapter (pure functions operating on Storage interface) ---

export const PROOF_COLLECTION_STORAGE_KEY = "proof-collection";

export function loadProofCollection(storage: Storage): ProofCollection {
  const stored = storage.getItem(PROOF_COLLECTION_STORAGE_KEY);
  if (stored === null) {
    return createEmptyProofCollection();
  }
  return deserializeProofCollection(stored);
}

export function saveProofCollection(
  storage: Storage,
  collection: ProofCollection,
): void {
  storage.setItem(
    PROOF_COLLECTION_STORAGE_KEY,
    serializeProofCollection(collection),
  );
}

// --- hook ---

/** 現在時刻を取得する関数の型（テスト時にモック可能） */
export type GetNow = () => number;

export interface UseProofCollectionResult {
  /** 更新日時順でソートされたエントリ一覧 */
  readonly entries: readonly ProofEntry[];
  /** 名前順でソートされたフォルダ一覧 */
  readonly folders: readonly ProofFolder[];
  /** コレクション全体 */
  readonly collection: ProofCollection;
  /** 証明エントリを追加する */
  readonly addEntry: (params: Omit<AddEntryParams, "now">) => ProofEntryId;
  /** 証明エントリを削除する */
  readonly removeEntry: (id: ProofEntryId) => void;
  /** 証明エントリの名前を変更する */
  readonly renameEntry: (id: ProofEntryId, newName: string) => void;
  /** 証明エントリのメモを更新する */
  readonly updateMemo: (id: ProofEntryId, memo: string) => void;
  /** 証明エントリのフォルダを変更する */
  readonly moveEntry: (
    id: ProofEntryId,
    targetFolderId: ProofFolderId | undefined,
  ) => void;
  /** フォルダを作成する */
  readonly createFolder: (name: string) => ProofFolderId;
  /** フォルダを削除する（中のエントリはルートに移動） */
  readonly removeFolder: (id: ProofFolderId) => void;
  /** フォルダの名前を変更する */
  readonly renameFolder: (id: ProofFolderId, newName: string) => void;
}

export interface UseProofCollectionOptions {
  /** 現在時刻取得関数（テスト用DI） */
  readonly getNow?: GetNow;
}

/* v8 ignore start */
function defaultGetNow(): number {
  // eslint-disable-next-line @luma-dev/luma-ts/no-date
  return Date.now();
}
/* v8 ignore stop */

export function useProofCollection(
  options?: UseProofCollectionOptions,
): UseProofCollectionResult {
  const getNow = options?.getNow ?? defaultGetNow;

  const [collection, setCollection] = useState<ProofCollection>(() =>
    /* v8 ignore start */
    typeof window === "undefined"
      ? createEmptyProofCollection()
      : /* v8 ignore stop */
        loadProofCollection(window.localStorage),
  );

  // Persist to localStorage when collection changes
  useEffect(() => {
    /* v8 ignore start */
    if (typeof window === "undefined") return;
    /* v8 ignore stop */
    saveProofCollection(window.localStorage, collection);
  }, [collection]);

  const addEntry = useCallback(
    (params: Omit<AddEntryParams, "now">): ProofEntryId => {
      const now = getNow();
      let newId: ProofEntryId = "";
      setCollection((prev) => {
        const next = addProofEntry(prev, { ...params, now });
        const added = next.entries[next.entries.length - 1];
        // 防御コード: addProofEntryは必ずエントリを追加するためundefinedにはならない
        /* v8 ignore start */
        if (added !== undefined) {
          /* v8 ignore stop */
          newId = added.id;
        }
        return next;
      });
      return newId;
    },
    [getNow],
  );

  const removeEntry = useCallback((id: ProofEntryId) => {
    setCollection((prev) => removeProofEntry(prev, id));
  }, []);

  const renameEntryFn = useCallback(
    (id: ProofEntryId, newName: string) => {
      setCollection((prev) => renameProofEntry(prev, id, newName, getNow()));
    },
    [getNow],
  );

  const updateMemo = useCallback(
    (id: ProofEntryId, memo: string) => {
      setCollection((prev) => updateProofEntryMemo(prev, id, memo, getNow()));
    },
    [getNow],
  );

  const moveEntry = useCallback(
    (id: ProofEntryId, targetFolderId: ProofFolderId | undefined) => {
      setCollection((prev) =>
        moveProofEntry(prev, id, targetFolderId, getNow()),
      );
    },
    [getNow],
  );

  const createFolderFn = useCallback(
    (name: string): ProofFolderId => {
      const now = getNow();
      let newId: ProofFolderId = "";
      setCollection((prev) => {
        const next = createProofFolder(prev, name, now);
        const added = next.folders[next.folders.length - 1];
        // 防御コード: createProofFolderは必ずフォルダを追加するためundefinedにはならない
        /* v8 ignore start */
        if (added !== undefined) {
          /* v8 ignore stop */
          newId = added.id;
        }
        return next;
      });
      return newId;
    },
    [getNow],
  );

  const removeFolderFn = useCallback((id: ProofFolderId) => {
    setCollection((prev) => removeProofFolder(prev, id));
  }, []);

  const renameFolderFn = useCallback((id: ProofFolderId, newName: string) => {
    setCollection((prev) => renameProofFolder(prev, id, newName));
  }, []);

  const entries = useMemo(
    () => listEntriesByUpdatedAt(collection),
    [collection],
  );

  const folders = useMemo(() => listFolders(collection), [collection]);

  return useMemo(
    () => ({
      entries,
      folders,
      collection,
      addEntry,
      removeEntry,
      renameEntry: renameEntryFn,
      updateMemo,
      moveEntry,
      createFolder: createFolderFn,
      removeFolder: removeFolderFn,
      renameFolder: renameFolderFn,
    }),
    [
      entries,
      folders,
      collection,
      addEntry,
      removeEntry,
      renameEntryFn,
      updateMemo,
      moveEntry,
      createFolderFn,
      removeFolderFn,
      renameFolderFn,
    ],
  );
}
