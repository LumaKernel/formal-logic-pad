import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProofCollection } from "./useProofCollection";
import {
  loadProofCollection,
  saveProofCollection,
  PROOF_COLLECTION_STORAGE_KEY,
} from "./useProofCollection";
import {
  createEmptyProofCollection,
  addProofEntry,
} from "./proofCollectionState";
import { serializeProofCollection } from "./proofCollectionSerialization";
import type { SavedNode, SavedConnection } from "./proofCollectionState";
import type { InferenceEdge } from "../proof-pad/inferenceEdge";

// --- テスト用ヘルパー ---

function createGetNow(): () => number {
  let counter = 1000;
  return () => counter++;
}

const sampleNodes: readonly SavedNode[] = [
  {
    originalId: "n1",
    kind: "axiom",
    label: "",
    formulaText: "phi -> psi",
    relativePosition: { x: 0, y: 0 },
  },
];

const sampleConnections: readonly SavedConnection[] = [];
const sampleInferenceEdges: readonly InferenceEdge[] = [];

describe("localStorage adapter", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = globalThis.localStorage;
    storage.clear();
  });

  it("loadProofCollectionは保存データがない場合空コレクションを返す", () => {
    const result = loadProofCollection(storage);
    expect(result).toEqual(createEmptyProofCollection());
  });

  it("saveProofCollection → loadProofCollection でラウンドトリップできる", () => {
    const col = addProofEntry(createEmptyProofCollection(), {
      name: "テスト証明",
      nodes: sampleNodes,
      connections: sampleConnections,
      inferenceEdges: sampleInferenceEdges,
      deductionStyle: "hilbert",
      usedAxiomIds: ["A1"],
      now: 1000,
    });
    saveProofCollection(storage, col);
    const loaded = loadProofCollection(storage);
    expect(loaded.entries.length).toBe(1);
    expect(loaded.entries[0]?.name).toBe("テスト証明");
  });

  it("不正なデータが保存されている場合空コレクションを返す", () => {
    storage.setItem(PROOF_COLLECTION_STORAGE_KEY, "invalid");
    const result = loadProofCollection(storage);
    expect(result).toEqual(createEmptyProofCollection());
  });
});

describe("useProofCollection hook", () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it("初期状態は空コレクション", () => {
    const { result } = renderHook(() => useProofCollection());
    expect(result.current.entries).toEqual([]);
    expect(result.current.folders).toEqual([]);
    expect(result.current.collection.nextEntryId).toBe(1);
  });

  it("localStorageに保存済みデータがあれば復元される", () => {
    const col = addProofEntry(createEmptyProofCollection(), {
      name: "保存済み証明",
      nodes: sampleNodes,
      connections: sampleConnections,
      inferenceEdges: sampleInferenceEdges,
      deductionStyle: "hilbert",
      usedAxiomIds: [],
      now: 1000,
    });
    globalThis.localStorage.setItem(
      PROOF_COLLECTION_STORAGE_KEY,
      serializeProofCollection(col),
    );

    const { result } = renderHook(() => useProofCollection());
    expect(result.current.entries.length).toBe(1);
    expect(result.current.entries[0]?.name).toBe("保存済み証明");
  });

  it("addEntryでエントリを追加できる", () => {
    const getNow = createGetNow();
    const { result } = renderHook(() => useProofCollection({ getNow }));

    let id = "";
    act(() => {
      id = result.current.addEntry({
        name: "新しい証明",
        nodes: sampleNodes,
        connections: sampleConnections,
        inferenceEdges: sampleInferenceEdges,
        deductionStyle: "hilbert",
        usedAxiomIds: ["A1"],
      });
    });

    expect(id).toBe("proof-1");
    expect(result.current.entries.length).toBe(1);
    expect(result.current.entries[0]?.name).toBe("新しい証明");
  });

  it("removeEntryでエントリを削除できる", () => {
    const getNow = createGetNow();
    const { result } = renderHook(() => useProofCollection({ getNow }));

    let id = "";
    act(() => {
      id = result.current.addEntry({
        name: "削除対象",
        nodes: sampleNodes,
        connections: sampleConnections,
        inferenceEdges: sampleInferenceEdges,
        deductionStyle: "hilbert",
        usedAxiomIds: [],
      });
    });

    expect(result.current.entries.length).toBe(1);

    act(() => {
      result.current.removeEntry(id);
    });

    expect(result.current.entries.length).toBe(0);
  });

  it("renameEntryでエントリ名を変更できる", () => {
    const getNow = createGetNow();
    const { result } = renderHook(() => useProofCollection({ getNow }));

    let id = "";
    act(() => {
      id = result.current.addEntry({
        name: "元の名前",
        nodes: sampleNodes,
        connections: sampleConnections,
        inferenceEdges: sampleInferenceEdges,
        deductionStyle: "hilbert",
        usedAxiomIds: [],
      });
    });

    act(() => {
      result.current.renameEntry(id, "新しい名前");
    });

    expect(result.current.entries[0]?.name).toBe("新しい名前");
  });

  it("updateMemoでメモを更新できる", () => {
    const getNow = createGetNow();
    const { result } = renderHook(() => useProofCollection({ getNow }));

    let id = "";
    act(() => {
      id = result.current.addEntry({
        name: "メモ付き証明",
        nodes: sampleNodes,
        connections: sampleConnections,
        inferenceEdges: sampleInferenceEdges,
        deductionStyle: "hilbert",
        usedAxiomIds: [],
      });
    });

    expect(result.current.entries[0]?.memo).toBe("");

    act(() => {
      result.current.updateMemo(id, "重要な証明");
    });

    expect(result.current.entries[0]?.memo).toBe("重要な証明");
  });

  it("moveEntryでフォルダに移動できる", () => {
    const getNow = createGetNow();
    const { result } = renderHook(() => useProofCollection({ getNow }));

    let entryId = "";
    let folderId = "";
    act(() => {
      entryId = result.current.addEntry({
        name: "移動対象",
        nodes: sampleNodes,
        connections: sampleConnections,
        inferenceEdges: sampleInferenceEdges,
        deductionStyle: "hilbert",
        usedAxiomIds: [],
      });
      folderId = result.current.createFolder("フォルダ1");
    });

    act(() => {
      result.current.moveEntry(entryId, folderId);
    });

    expect(result.current.collection.entries[0]?.folderId).toBe(folderId);
  });

  it("moveEntryでルートに戻せる", () => {
    const getNow = createGetNow();
    const { result } = renderHook(() => useProofCollection({ getNow }));

    // エントリを追加
    let entryId = "";
    act(() => {
      entryId = result.current.addEntry({
        name: "移動対象",
        nodes: sampleNodes,
        connections: sampleConnections,
        inferenceEdges: sampleInferenceEdges,
        deductionStyle: "hilbert",
        usedAxiomIds: [],
      });
    });

    // フォルダを作成
    let folderId = "";
    act(() => {
      folderId = result.current.createFolder("フォルダ");
    });

    // フォルダに移動
    act(() => {
      result.current.moveEntry(entryId, folderId);
    });

    expect(result.current.collection.entries[0]?.folderId).toBe(folderId);

    // ルートに戻す
    act(() => {
      result.current.moveEntry(entryId, undefined);
    });

    expect(result.current.collection.entries[0]?.folderId).toBeUndefined();
  });

  it("createFolderでフォルダを作成できる", () => {
    const getNow = createGetNow();
    const { result } = renderHook(() => useProofCollection({ getNow }));

    let id = "";
    act(() => {
      id = result.current.createFolder("新しいフォルダ");
    });

    expect(id).toBe("folder-1");
    expect(result.current.folders.length).toBe(1);
    expect(result.current.folders[0]?.name).toBe("新しいフォルダ");
  });

  it("removeFolderでフォルダを削除できる（エントリはルートに移動）", () => {
    const getNow = createGetNow();
    const { result } = renderHook(() => useProofCollection({ getNow }));

    let folderId = "";
    act(() => {
      folderId = result.current.createFolder("削除対象フォルダ");
      result.current.addEntry({
        name: "フォルダ内の証明",
        nodes: sampleNodes,
        connections: sampleConnections,
        inferenceEdges: sampleInferenceEdges,
        deductionStyle: "hilbert",
        usedAxiomIds: [],
        folderId,
      });
    });

    expect(result.current.collection.entries[0]?.folderId).toBe(folderId);

    act(() => {
      result.current.removeFolder(folderId);
    });

    expect(result.current.folders.length).toBe(0);
    expect(result.current.collection.entries[0]?.folderId).toBeUndefined();
  });

  it("renameFolderでフォルダ名を変更できる", () => {
    const getNow = createGetNow();
    const { result } = renderHook(() => useProofCollection({ getNow }));

    let id = "";
    act(() => {
      id = result.current.createFolder("元のフォルダ名");
    });

    act(() => {
      result.current.renameFolder(id, "新しいフォルダ名");
    });

    expect(result.current.folders[0]?.name).toBe("新しいフォルダ名");
  });

  it("entriesは更新日時順（降順）でソートされる", () => {
    const getNow = createGetNow();
    const { result } = renderHook(() => useProofCollection({ getNow }));

    act(() => {
      result.current.addEntry({
        name: "古い証明",
        nodes: sampleNodes,
        connections: sampleConnections,
        inferenceEdges: sampleInferenceEdges,
        deductionStyle: "hilbert",
        usedAxiomIds: [],
      });
      result.current.addEntry({
        name: "新しい証明",
        nodes: sampleNodes,
        connections: sampleConnections,
        inferenceEdges: sampleInferenceEdges,
        deductionStyle: "hilbert",
        usedAxiomIds: [],
      });
    });

    // 新しい方が先
    expect(result.current.entries[0]?.name).toBe("新しい証明");
    expect(result.current.entries[1]?.name).toBe("古い証明");
  });

  it("foldersは名前順でソートされる", () => {
    const getNow = createGetNow();
    const { result } = renderHook(() => useProofCollection({ getNow }));

    act(() => {
      result.current.createFolder("Zフォルダ");
      result.current.createFolder("Aフォルダ");
    });

    expect(result.current.folders[0]?.name).toBe("Aフォルダ");
    expect(result.current.folders[1]?.name).toBe("Zフォルダ");
  });

  it("状態変更がlocalStorageに永続化される", () => {
    const getNow = createGetNow();
    const { result } = renderHook(() => useProofCollection({ getNow }));

    act(() => {
      result.current.addEntry({
        name: "永続化テスト",
        nodes: sampleNodes,
        connections: sampleConnections,
        inferenceEdges: sampleInferenceEdges,
        deductionStyle: "hilbert",
        usedAxiomIds: [],
      });
    });

    // localStorageから直接復元してみる
    const stored = globalThis.localStorage.getItem(
      PROOF_COLLECTION_STORAGE_KEY,
    );
    expect(stored).not.toBeNull();

    const loaded = loadProofCollection(globalThis.localStorage);
    expect(loaded.entries.length).toBe(1);
    expect(loaded.entries[0]?.name).toBe("永続化テスト");
  });

  it("getNow DIで時刻を制御できる", () => {
    let now = 5000;
    const getNow = () => now++;
    const { result } = renderHook(() => useProofCollection({ getNow }));

    act(() => {
      result.current.addEntry({
        name: "時刻テスト",
        nodes: sampleNodes,
        connections: sampleConnections,
        inferenceEdges: sampleInferenceEdges,
        deductionStyle: "hilbert",
        usedAxiomIds: [],
      });
    });

    expect(result.current.entries[0]?.createdAt).toBe(5000);
    expect(result.current.entries[0]?.updatedAt).toBe(5000);
  });
});
