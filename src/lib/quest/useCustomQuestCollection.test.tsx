import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { Effect } from "effect";
import { useCustomQuestCollection } from "./useCustomQuestCollection";
import {
  loadCustomQuestsEffect,
  saveCustomQuestsEffect,
} from "./useCustomQuestCollection";
import {
  createEmptyCustomQuestCollection,
  addCustomQuest,
  serializeCustomQuestCollection,
  CUSTOM_QUEST_STORAGE_KEY,
} from "./customQuestState";
import type { CreateCustomQuestParams } from "./customQuestState";
import { createInMemoryStorageLayer } from "./storageService";

// --- ヘルパー ---

const sampleParams: CreateCustomQuestParams = {
  title: "テストクエスト",
  description: "テスト用",
  category: "propositional-basics",
  difficulty: 1,
  systemPresetId: "lukasiewicz",
  goals: [{ formulaText: "p -> p" }],
  hints: [],
  estimatedSteps: 5,
  learningPoint: "テスト",
};

// --- Effect 版テスト ---

describe("loadCustomQuestsEffect / saveCustomQuestsEffect", () => {
  it("空のストレージからロードすると空のコレクションを返す", () => {
    const { layer } = createInMemoryStorageLayer();
    const result = Effect.runSync(
      Effect.provide(loadCustomQuestsEffect, layer),
    );
    expect(result.quests.size).toBe(0);
  });

  it("saveCustomQuestsEffect → loadCustomQuestsEffect でラウンドトリップできる", () => {
    const { layer } = createInMemoryStorageLayer();
    const empty = createEmptyCustomQuestCollection();
    const addResult = addCustomQuest(empty, sampleParams, 1000);
    expect(addResult.ok).toBe(true);
    if (!addResult.ok) return;

    Effect.runSync(
      Effect.provide(saveCustomQuestsEffect(addResult.value.collection), layer),
    );
    const loaded = Effect.runSync(
      Effect.provide(loadCustomQuestsEffect, layer),
    );
    expect(loaded.quests.size).toBe(1);
    expect(loaded.quests.get("custom-1000")?.title).toBe("テストクエスト");
  });

  it("不正なJSONが保存されている場合空のコレクションを返す", () => {
    const { layer } = createInMemoryStorageLayer({
      [CUSTOM_QUEST_STORAGE_KEY]: "invalid-json",
    });
    const result = Effect.runSync(
      Effect.provide(loadCustomQuestsEffect, layer),
    );
    expect(result.quests.size).toBe(0);
  });

  it("構造的に不正なデータが保存されている場合空のコレクションを返す", () => {
    const { layer } = createInMemoryStorageLayer({
      [CUSTOM_QUEST_STORAGE_KEY]: JSON.stringify({ wrong: true }),
    });
    const result = Effect.runSync(
      Effect.provide(loadCustomQuestsEffect, layer),
    );
    expect(result.quests.size).toBe(0);
  });

  it("ストア内容を getStore で確認できる", () => {
    const { layer, getStore } = createInMemoryStorageLayer();
    const empty = createEmptyCustomQuestCollection();
    const addResult = addCustomQuest(empty, sampleParams, 2000);
    expect(addResult.ok).toBe(true);
    if (!addResult.ok) return;

    Effect.runSync(
      Effect.provide(saveCustomQuestsEffect(addResult.value.collection), layer),
    );
    const store = getStore();
    expect(store.has(CUSTOM_QUEST_STORAGE_KEY)).toBe(true);
    const parsed = JSON.parse(store.get(CUSTOM_QUEST_STORAGE_KEY)!);
    expect(parsed.quests).toHaveLength(1);
    expect(parsed.quests[0].id).toBe("custom-2000");
  });
});

// --- hook テスト ---

describe("useCustomQuestCollection hook", () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it("初期状態は空のコレクション", () => {
    const { result } = renderHook(() => useCustomQuestCollection());
    expect(result.current.collection.quests.size).toBe(0);
  });

  it("localStorageに保存済みデータがあれば復元される", () => {
    const empty = createEmptyCustomQuestCollection();
    const addResult = addCustomQuest(empty, sampleParams, 1000);
    expect(addResult.ok).toBe(true);
    if (!addResult.ok) return;

    globalThis.localStorage.setItem(
      CUSTOM_QUEST_STORAGE_KEY,
      JSON.stringify(
        serializeCustomQuestCollection(addResult.value.collection),
      ),
    );

    const { result } = renderHook(() => useCustomQuestCollection());
    expect(result.current.collection.quests.size).toBe(1);
    expect(result.current.collection.quests.get("custom-1000")?.title).toBe(
      "テストクエスト",
    );
  });

  it("setCollectionでコレクションを更新できる", () => {
    const { result } = renderHook(() => useCustomQuestCollection());
    const empty = createEmptyCustomQuestCollection();
    const addResult = addCustomQuest(empty, sampleParams, 3000);
    expect(addResult.ok).toBe(true);
    if (!addResult.ok) return;

    act(() => {
      result.current.setCollection(addResult.value.collection);
    });

    expect(result.current.collection.quests.size).toBe(1);
    expect(result.current.collection.quests.get("custom-3000")?.title).toBe(
      "テストクエスト",
    );
  });

  it("更新後にlocalStorageへ永続化される", () => {
    const { result } = renderHook(() => useCustomQuestCollection());
    const empty = createEmptyCustomQuestCollection();
    const addResult = addCustomQuest(empty, sampleParams, 4000);
    expect(addResult.ok).toBe(true);
    if (!addResult.ok) return;

    act(() => {
      result.current.setCollection(addResult.value.collection);
    });

    const stored = globalThis.localStorage.getItem(CUSTOM_QUEST_STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(stored).toContain("custom-4000");
    expect(stored).toContain("テストクエスト");
  });

  it("空コレクションに戻すとlocalStorageも更新される", () => {
    const { result } = renderHook(() => useCustomQuestCollection());
    const empty = createEmptyCustomQuestCollection();
    const addResult = addCustomQuest(empty, sampleParams, 5000);
    expect(addResult.ok).toBe(true);
    if (!addResult.ok) return;

    act(() => {
      result.current.setCollection(addResult.value.collection);
    });

    act(() => {
      result.current.setCollection(createEmptyCustomQuestCollection());
    });

    const stored = globalThis.localStorage.getItem(CUSTOM_QUEST_STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.quests).toEqual([]);
  });
});
