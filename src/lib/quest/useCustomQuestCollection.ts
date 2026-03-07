/**
 * 自作クエストコレクションの状態管理 React hook。
 *
 * localStorage への永続化を含む。
 * 純粋ロジック (customQuestState.ts) に依存。
 * ストレージアクセスは StorageService Layer で抽象化。
 *
 * 変更時は useCustomQuestCollection.test.tsx, index.ts も同期すること。
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Effect } from "effect";
import type { CustomQuestCollection } from "./customQuestState";
import {
  createEmptyCustomQuestCollection,
  serializeCustomQuestCollection,
  deserializeCustomQuestCollection,
  CUSTOM_QUEST_STORAGE_KEY,
} from "./customQuestState";
import { StorageService, BrowserStorageLayer } from "./storageService";

// --- Effect 版 (StorageService 依存) ---

/** StorageService を使って自作クエストをロードする Effect */
export const loadCustomQuestsEffect = Effect.gen(function* () {
  const storage = yield* StorageService;
  const stored = yield* storage.getItem(CUSTOM_QUEST_STORAGE_KEY);
  if (stored === null) {
    return createEmptyCustomQuestCollection();
  }
  try {
    const parsed: unknown = JSON.parse(stored);
    return deserializeCustomQuestCollection(parsed);
  } catch {
    return createEmptyCustomQuestCollection();
  }
});

/** StorageService を使って自作クエストを保存する Effect */
export const saveCustomQuestsEffect = (collection: CustomQuestCollection) =>
  Effect.gen(function* () {
    const storage = yield* StorageService;
    yield* storage.setItem(
      CUSTOM_QUEST_STORAGE_KEY,
      JSON.stringify(serializeCustomQuestCollection(collection)),
    );
  });

// --- hook ---

export interface UseCustomQuestCollectionResult {
  /** 現在の自作クエストコレクション */
  readonly collection: CustomQuestCollection;
  /** コレクションを直接更新する */
  readonly setCollection: (collection: CustomQuestCollection) => void;
}

export function useCustomQuestCollection(): UseCustomQuestCollectionResult {
  const [state, setState] = useState<CustomQuestCollection>(() =>
    /* v8 ignore start */
    typeof window === "undefined"
      ? createEmptyCustomQuestCollection()
      : /* v8 ignore stop */
        Effect.runSync(
          Effect.provide(loadCustomQuestsEffect, BrowserStorageLayer),
        ),
  );

  // Persist to localStorage when state changes
  useEffect(() => {
    /* v8 ignore start */
    if (typeof window === "undefined") return;
    /* v8 ignore stop */
    Effect.runSync(
      Effect.provide(saveCustomQuestsEffect(state), BrowserStorageLayer),
    );
  }, [state]);

  const setCollection = useCallback((collection: CustomQuestCollection) => {
    setState(collection);
  }, []);

  return useMemo(
    () => ({
      collection: state,
      setCollection,
    }),
    [state, setCollection],
  );
}
