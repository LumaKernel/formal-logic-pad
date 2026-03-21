/**
 * ゴミ箱の状態管理 React hook。
 *
 * localStorage への永続化と期限切れアイテムの自動パージを含む。
 * 純粋ロジック (trashState.ts) に依存。
 *
 * 変更時は useTrash.test.ts, index.ts も同期すること。
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TrashItem, TrashItemKind, TrashState } from "./trashState";
import {
  createEmptyTrash,
  addToTrash,
  getTrashItem,
  permanentlyDelete,
  emptyTrash,
  purgeExpiredItems,
  getTrashItemsByKind,
  getTrashItemCount,
  serializeTrashState,
  deserializeTrashState,
} from "./trashState";

// --- localStorage adapter ---

export const TRASH_STORAGE_KEY = "trash-state";

export function loadTrashState(storage: Storage): TrashState {
  const stored = storage.getItem(TRASH_STORAGE_KEY);
  if (stored === null) {
    return createEmptyTrash();
  }
  return deserializeTrashState(stored) ?? createEmptyTrash();
}

export function saveTrashState(storage: Storage, state: TrashState): void {
  storage.setItem(TRASH_STORAGE_KEY, serializeTrashState(state));
}

// --- hook ---

/** 現在時刻を取得する関数の型（テスト時にモック可能） */
export type GetNow = () => number;

export type UseTrashResult = {
  /** ゴミ箱内の全アイテム */
  readonly items: readonly TrashItem[];
  /** ゴミ箱内のアイテム数 */
  readonly count: number;
  /** アイテムをゴミ箱に追加する */
  readonly moveToTrash: (
    kind: TrashItemKind,
    originalId: string,
    displayName: string,
    serializedData: string,
  ) => void;
  /** ゴミ箱からアイテムを取得する（復元前の確認用） */
  readonly findItem: (trashId: string) => TrashItem | undefined;
  /** ゴミ箱からアイテムを除去する（復元時に使用） */
  readonly removeFromTrash: (trashId: string) => void;
  /** ゴミ箱からアイテムを完全削除する */
  readonly deletePermanently: (trashId: string) => void;
  /** ゴミ箱を空にする */
  readonly empty: () => void;
  /** 種別でフィルタリングしたアイテム一覧 */
  readonly getItemsByKind: (kind: TrashItemKind) => readonly TrashItem[];
};

export type UseTrashOptions = {
  /** 現在時刻取得関数（テスト用DI） */
  readonly getNow?: GetNow;
};

/* v8 ignore start */
function defaultGetNow(): number {
  // eslint-disable-next-line @luma-dev/luma-ts/no-date
  return Date.now();
}
/* v8 ignore stop */

export function useTrash(options?: UseTrashOptions): UseTrashResult {
  const getNow = options?.getNow ?? defaultGetNow;

  const [state, setState] = useState<TrashState>(() => {
    /* v8 ignore start */
    if (typeof window === "undefined") return createEmptyTrash();
    /* v8 ignore stop */
    const loaded = loadTrashState(window.localStorage);
    // 初期化時に期限切れアイテムをパージ
    return purgeExpiredItems(loaded, getNow());
  });

  // Persist to localStorage when state changes
  useEffect(() => {
    /* v8 ignore start */
    if (typeof window === "undefined") return;
    /* v8 ignore stop */
    saveTrashState(window.localStorage, state);
  }, [state]);

  const moveToTrash = useCallback(
    (
      kind: TrashItemKind,
      originalId: string,
      displayName: string,
      serializedData: string,
    ) => {
      setState((prev) =>
        addToTrash(
          prev,
          kind,
          originalId,
          displayName,
          serializedData,
          getNow(),
        ),
      );
    },
    [getNow],
  );

  const findItem = useCallback(
    (trashId: string): TrashItem | undefined => getTrashItem(state, trashId),
    [state],
  );

  const removeFromTrash = useCallback((trashId: string) => {
    setState((prev) => permanentlyDelete(prev, trashId));
  }, []);

  const deletePermanently = useCallback((trashId: string) => {
    setState((prev) => permanentlyDelete(prev, trashId));
  }, []);

  const empty = useCallback(() => {
    setState((prev) => emptyTrash(prev));
  }, []);

  const getItemsByKind = useCallback(
    (kind: TrashItemKind): readonly TrashItem[] =>
      getTrashItemsByKind(state, kind),
    [state],
  );

  const count = useMemo(() => getTrashItemCount(state), [state]);

  return useMemo(
    () => ({
      items: state.items,
      count,
      moveToTrash,
      findItem,
      removeFromTrash,
      deletePermanently,
      empty,
      getItemsByKind,
    }),
    [
      state.items,
      count,
      moveToTrash,
      findItem,
      removeFromTrash,
      deletePermanently,
      empty,
      getItemsByKind,
    ],
  );
}
