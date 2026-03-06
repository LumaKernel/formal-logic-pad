import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNotebookCollection } from "./useNotebookCollection";
import {
  loadCollection,
  saveCollection,
  NOTEBOOK_STORAGE_KEY,
} from "./useNotebookCollection";
import { lukasiewiczSystem } from "../logic-core/inferenceRule";
import { createEmptyCollection, createNotebook } from "./notebookState";
import { serializeCollection } from "./notebookSerialization";

describe("localStorage adapter", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = globalThis.localStorage;
    storage.clear();
  });

  it("loadCollectionは保存データがない場合空コレクションを返す", () => {
    const result = loadCollection(storage);
    expect(result).toEqual(createEmptyCollection());
  });

  it("saveCollection → loadCollection でラウンドトリップできる", () => {
    const col = createNotebook(createEmptyCollection(), {
      name: "test",
      system: lukasiewiczSystem,
      now: 1000,
    });
    saveCollection(storage, col);
    const loaded = loadCollection(storage);
    expect(loaded.notebooks.length).toBe(1);
    expect(loaded.notebooks[0]?.meta.name).toBe("test");
  });

  it("不正なデータが保存されている場合空コレクションを返す", () => {
    storage.setItem(NOTEBOOK_STORAGE_KEY, "invalid");
    const result = loadCollection(storage);
    expect(result).toEqual(createEmptyCollection());
  });
});

describe("useNotebookCollection hook", () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it("初期状態は空コレクション", () => {
    const { result } = renderHook(() => useNotebookCollection());
    expect(result.current.notebooks).toEqual([]);
    expect(result.current.collection.nextId).toBe(1);
  });

  it("localStorageに保存済みデータがあれば復元される", () => {
    const col = createNotebook(createEmptyCollection(), {
      name: "保存済み",
      system: lukasiewiczSystem,
      now: 1000,
    });
    globalThis.localStorage.setItem(
      NOTEBOOK_STORAGE_KEY,
      serializeCollection(col),
    );

    const { result } = renderHook(() => useNotebookCollection());
    expect(result.current.notebooks.length).toBe(1);
    expect(result.current.notebooks[0]?.meta.name).toBe("保存済み");
  });

  it("createでノートブックを作成できる", () => {
    const { result } = renderHook(() => useNotebookCollection());

    let id: string = "";
    act(() => {
      id = result.current.create("新しいノート", lukasiewiczSystem);
    });

    expect(id).toMatch(/^notebook-/);
    expect(result.current.notebooks.length).toBe(1);
    expect(result.current.notebooks[0]?.meta.name).toBe("新しいノート");
  });

  it("createQuestでクエストノートブックを作成できる", () => {
    const { result } = renderHook(() => useNotebookCollection());

    act(() => {
      result.current.createQuest("クエスト", lukasiewiczSystem, [
        { formulaText: "phi -> phi" },
      ]);
    });

    expect(result.current.notebooks.length).toBe(1);
    expect(result.current.notebooks[0]?.workspace.mode).toBe("quest");
  });

  it("removeでノートブックを削除できる", () => {
    const { result } = renderHook(() => useNotebookCollection());

    let id: string = "";
    act(() => {
      id = result.current.create("削除対象", lukasiewiczSystem);
    });
    expect(result.current.notebooks.length).toBe(1);

    act(() => {
      result.current.remove(id);
    });
    expect(result.current.notebooks.length).toBe(0);
  });

  it("renameでノートブック名を変更できる", () => {
    const { result } = renderHook(() => useNotebookCollection());

    let id: string = "";
    act(() => {
      id = result.current.create("旧名前", lukasiewiczSystem);
    });

    act(() => {
      result.current.rename(id, "新名前");
    });

    expect(result.current.notebooks[0]?.meta.name).toBe("新名前");
  });

  it("duplicateでノートブックを複製できる", () => {
    const { result } = renderHook(() => useNotebookCollection());

    act(() => {
      result.current.create("元ノート", lukasiewiczSystem);
    });
    const originalId = result.current.notebooks[0]?.meta.id ?? "";

    let duplicatedId: string = "";
    act(() => {
      duplicatedId = result.current.duplicate(originalId);
    });

    expect(result.current.notebooks.length).toBe(2);
    expect(duplicatedId).not.toBe(originalId);
    // 複製名は "(copy)" 付き
    const names = result.current.notebooks.map((n) => n.meta.name);
    expect(names).toContain("元ノート (copy)");
  });

  it("convertToFreeでクエストを複製して自由帳モードのノートブックを作成する", () => {
    let counter = 1000;
    const getNow = () => counter++;
    const { result } = renderHook(() =>
      useNotebookCollection({ getNow }),
    );

    let id: string = "";
    act(() => {
      id = result.current.createQuest("クエスト", lukasiewiczSystem, [
        { formulaText: "phi -> phi" },
      ]);
    });
    expect(result.current.notebooks).toHaveLength(1);
    expect(result.current.notebooks[0]?.workspace.mode).toBe("quest");

    act(() => {
      result.current.convertToFree(id);
    });
    // 元のクエストノートブックが残り、新しい自由帳が追加される
    expect(result.current.notebooks).toHaveLength(2);
    // 最新の更新日時順なので新しい方が先
    expect(result.current.notebooks[0]?.workspace.mode).toBe("free");
    expect(result.current.notebooks[0]?.meta.name).toBe("クエスト (自由帳)");
    expect(result.current.notebooks[1]?.workspace.mode).toBe("quest");
  });

  it("updateWorkspaceでワークスペースを更新できる", () => {
    const { result } = renderHook(() => useNotebookCollection());

    let id: string = "";
    act(() => {
      id = result.current.create("テスト", lukasiewiczSystem);
    });

    const originalWorkspace = result.current.notebooks[0]?.workspace;
    expect(originalWorkspace).toBeTruthy();

    // ワークスペース状態を更新
    const updatedWorkspace = {
      ...originalWorkspace!,
      nextNodeId: 42,
    };
    act(() => {
      result.current.updateWorkspace(id, updatedWorkspace);
    });

    expect(result.current.notebooks[0]?.workspace.nextNodeId).toBe(42);
  });

  it("notebooksは更新日時順でソートされている", () => {
    let clock = 1000;
    const getNow = () => clock++;
    const { result } = renderHook(() => useNotebookCollection({ getNow }));

    // ノート1を作成 (time=1000)
    act(() => {
      result.current.create("ノート1", lukasiewiczSystem);
    });

    // ノート2を作成 (time=1001)
    act(() => {
      result.current.create("ノート2", lukasiewiczSystem);
    });

    // ノート2の方が新しいので先頭に来る
    expect(result.current.notebooks[0]?.meta.name).toBe("ノート2");
    expect(result.current.notebooks[1]?.meta.name).toBe("ノート1");
  });

  it("操作後にlocalStorageへ永続化される", () => {
    const { result } = renderHook(() => useNotebookCollection());

    act(() => {
      result.current.create("永続化テスト", lukasiewiczSystem);
    });

    const stored = globalThis.localStorage.getItem(NOTEBOOK_STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(stored).toContain("永続化テスト");
  });

  it("createQuestでquestId付きクエストノートブックを作成できる", () => {
    const { result } = renderHook(() => useNotebookCollection());

    let id: string = "";
    act(() => {
      id = result.current.createQuest(
        "クエスト",
        lukasiewiczSystem,
        [{ formulaText: "phi -> phi" }],
        "prop-01",
      );
    });

    expect(id).toMatch(/^notebook-/);
    expect(result.current.notebooks.length).toBe(1);
    const notebook = result.current.collection.notebooks[0];
    expect(notebook?.questId).toBe("prop-01");
    expect(notebook?.workspace.mode).toBe("quest");
  });

  it("getNowオプションで時刻注入できる", () => {
    let clock = 5000;
    const getNow = () => clock++;
    const { result } = renderHook(() => useNotebookCollection({ getNow }));

    act(() => {
      result.current.create("カスタム時刻", lukasiewiczSystem);
    });

    expect(result.current.notebooks[0]?.meta.createdAt).toBe(5000);
  });
});
