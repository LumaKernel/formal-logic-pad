import { describe, it, expect } from "vitest";
import type { ProofCollection } from "./proofCollectionState";
import {
  createEmptyProofCollection,
  addProofEntry,
  createProofFolder,
} from "./proofCollectionState";
import {
  serializeProofCollection,
  deserializeProofCollection,
} from "./proofCollectionSerialization";

// --- テスト用ヘルパー ---

function createPopulatedCollection(): ProofCollection {
  let collection = createEmptyProofCollection();
  collection = createProofFolder(collection, "フォルダA", 500);
  collection = addProofEntry(collection, {
    name: "証明1",
    nodes: [
      {
        originalId: "node-1",
        kind: "axiom",
        label: "公理",
        formulaText: "phi -> phi",
        relativePosition: { x: 0, y: 0 },
        role: "axiom",
      },
    ],
    connections: [
      {
        fromOriginalNodeId: "node-1",
        fromPortId: "bottom",
        toOriginalNodeId: "node-2",
        toPortId: "top",
      },
    ],
    inferenceEdges: [],
    deductionStyle: "hilbert",
    usedAxiomIds: ["A1", "A2"],
    now: 1000,
  });
  collection = addProofEntry(collection, {
    name: "証明2",
    nodes: [],
    connections: [],
    inferenceEdges: [],
    deductionStyle: "natural-deduction",
    usedAxiomIds: [],
    now: 2000,
    folderId: "folder-1",
  });
  return collection;
}

describe("serializeProofCollection", () => {
  it("JSONに変換できる", () => {
    const collection = createPopulatedCollection();
    const json = serializeProofCollection(collection);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

describe("deserializeProofCollection", () => {
  it("ラウンドトリップ: serialize → deserialize → 元と一致", () => {
    const original = createPopulatedCollection();
    const json = serializeProofCollection(original);
    const restored = deserializeProofCollection(json);

    expect(restored.entries).toHaveLength(2);
    expect(restored.folders).toHaveLength(1);
    expect(restored.nextEntryId).toBe(original.nextEntryId);
    expect(restored.nextFolderId).toBe(original.nextFolderId);

    // エントリの内容チェック
    expect(restored.entries[0]?.name).toBe("証明1");
    expect(restored.entries[0]?.deductionStyle).toBe("hilbert");
    expect(restored.entries[0]?.usedAxiomIds).toEqual(["A1", "A2"]);
    expect(restored.entries[0]?.nodes).toHaveLength(1);
    expect(restored.entries[0]?.connections).toHaveLength(1);
    expect(restored.entries[0]?.folderId).toBeUndefined();

    expect(restored.entries[1]?.name).toBe("証明2");
    expect(restored.entries[1]?.deductionStyle).toBe("natural-deduction");
    expect(restored.entries[1]?.folderId).toBe("folder-1");

    // フォルダの内容チェック
    expect(restored.folders[0]?.name).toBe("フォルダA");
    expect(restored.folders[0]?.id).toBe("folder-1");
  });

  it("空のコレクションのラウンドトリップ", () => {
    const original = createEmptyProofCollection();
    const json = serializeProofCollection(original);
    const restored = deserializeProofCollection(json);

    expect(restored).toEqual(original);
  });

  describe("不正なJSON", () => {
    it("不正なJSON文字列は空コレクションを返す", () => {
      const result = deserializeProofCollection("not json");
      expect(result).toEqual(createEmptyProofCollection());
    });

    it("空文字列は空コレクションを返す", () => {
      const result = deserializeProofCollection("");
      expect(result).toEqual(createEmptyProofCollection());
    });

    it("nullは空コレクションを返す", () => {
      const result = deserializeProofCollection("null");
      expect(result).toEqual(createEmptyProofCollection());
    });

    it("配列は空コレクションを返す", () => {
      const result = deserializeProofCollection("[]");
      expect(result).toEqual(createEmptyProofCollection());
    });

    it("数値は空コレクションを返す", () => {
      const result = deserializeProofCollection("42");
      expect(result).toEqual(createEmptyProofCollection());
    });
  });

  describe("部分的に不正なデータ", () => {
    it("不正なエントリはスキップされる", () => {
      const json = JSON.stringify({
        entries: [
          {
            id: "valid",
            name: "OK",
            memo: "",
            createdAt: 1,
            updatedAt: 1,
            nodes: [],
            connections: [],
            inferenceEdges: [],
            deductionStyle: "hilbert",
            usedAxiomIds: [],
          },
          { id: 123 }, // idが数値（不正）
          "not an object",
        ],
        folders: [],
        nextEntryId: 3,
        nextFolderId: 1,
      });
      const result = deserializeProofCollection(json);

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]?.id).toBe("valid");
    });

    it("不正なフォルダはスキップされる", () => {
      const json = JSON.stringify({
        entries: [],
        folders: [
          { id: "f-1", name: "OK", createdAt: 1 },
          { id: 123 }, // idが数値（不正）
        ],
        nextEntryId: 1,
        nextFolderId: 3,
      });
      const result = deserializeProofCollection(json);

      expect(result.folders).toHaveLength(1);
      expect(result.folders[0]?.id).toBe("f-1");
    });

    it("entriesが存在しない場合は空配列として扱う", () => {
      const json = JSON.stringify({
        folders: [],
        nextEntryId: 1,
        nextFolderId: 1,
      });
      const result = deserializeProofCollection(json);

      expect(result.entries).toEqual([]);
    });

    it("foldersが存在しない場合は空配列として扱う", () => {
      const json = JSON.stringify({
        entries: [],
        nextEntryId: 1,
        nextFolderId: 1,
      });
      const result = deserializeProofCollection(json);

      expect(result.folders).toEqual([]);
    });

    it("nextEntryIdが存在しない場合は1をデフォルトとする", () => {
      const json = JSON.stringify({
        entries: [],
        folders: [],
        nextFolderId: 1,
      });
      const result = deserializeProofCollection(json);

      expect(result.nextEntryId).toBe(1);
    });

    it("nextFolderIdが存在しない場合は1をデフォルトとする", () => {
      const json = JSON.stringify({ entries: [], folders: [], nextEntryId: 1 });
      const result = deserializeProofCollection(json);

      expect(result.nextFolderId).toBe(1);
    });
  });

  describe("deductionStyleのバリデーション", () => {
    const validStyles = [
      "hilbert",
      "natural-deduction",
      "sequent-calculus",
      "tableau-calculus",
      "analytic-tableau",
    ];

    for (const style of validStyles) {
      it(`"${style satisfies string}" は有効なスタイルとして受け入れる`, () => {
        const json = JSON.stringify({
          entries: [
            {
              id: "p-1",
              name: "test",
              memo: "",
              createdAt: 1,
              updatedAt: 1,
              nodes: [],
              connections: [],
              inferenceEdges: [],
              deductionStyle: style,
              usedAxiomIds: [],
            },
          ],
          folders: [],
          nextEntryId: 2,
          nextFolderId: 1,
        });
        const result = deserializeProofCollection(json);
        expect(result.entries).toHaveLength(1);
      });
    }

    it("無効なスタイルのエントリはスキップされる", () => {
      const json = JSON.stringify({
        entries: [
          {
            id: "p-1",
            name: "test",
            memo: "",
            createdAt: 1,
            updatedAt: 1,
            nodes: [],
            connections: [],
            inferenceEdges: [],
            deductionStyle: "invalid-style",
            usedAxiomIds: [],
          },
        ],
        folders: [],
        nextEntryId: 2,
        nextFolderId: 1,
      });
      const result = deserializeProofCollection(json);
      expect(result.entries).toHaveLength(0);
    });
  });

  describe("エントリフィールドのバリデーション", () => {
    const validEntry = {
      id: "p-1",
      name: "test",
      memo: "",
      createdAt: 1,
      updatedAt: 1,
      nodes: [],
      connections: [],
      inferenceEdges: [],
      deductionStyle: "hilbert",
      usedAxiomIds: [],
    };

    const fieldsToOmit = [
      "name",
      "memo",
      "createdAt",
      "updatedAt",
      "nodes",
      "connections",
      "inferenceEdges",
      "usedAxiomIds",
    ];

    for (const field of fieldsToOmit) {
      it(`"${field satisfies string}" が欠けているエントリはスキップされる`, () => {
        const entry = { ...validEntry };
        delete (entry as Record<string, unknown>)[field];
        const json = JSON.stringify({
          entries: [entry],
          folders: [],
          nextEntryId: 2,
          nextFolderId: 1,
        });
        const result = deserializeProofCollection(json);
        expect(result.entries).toHaveLength(0);
      });
    }

    it("deductionStyleが数値の場合はスキップされる", () => {
      const json = JSON.stringify({
        entries: [{ ...validEntry, deductionStyle: 42 }],
        folders: [],
        nextEntryId: 2,
        nextFolderId: 1,
      });
      const result = deserializeProofCollection(json);
      expect(result.entries).toHaveLength(0);
    });
  });

  describe("フォルダフィールドのバリデーション", () => {
    it("フォルダがオブジェクトでない場合はスキップされる", () => {
      const json = JSON.stringify({
        entries: [],
        folders: ["not-an-object", null, 42],
        nextEntryId: 1,
        nextFolderId: 1,
      });
      const result = deserializeProofCollection(json);
      expect(result.folders).toHaveLength(0);
    });

    it("nameが欠けているフォルダはスキップされる", () => {
      const json = JSON.stringify({
        entries: [],
        folders: [{ id: "f-1", createdAt: 1 }],
        nextEntryId: 1,
        nextFolderId: 1,
      });
      const result = deserializeProofCollection(json);
      expect(result.folders).toHaveLength(0);
    });

    it("createdAtが欠けているフォルダはスキップされる", () => {
      const json = JSON.stringify({
        entries: [],
        folders: [{ id: "f-1", name: "test" }],
        nextEntryId: 1,
        nextFolderId: 1,
      });
      const result = deserializeProofCollection(json);
      expect(result.folders).toHaveLength(0);
    });
  });

  describe("folderIdのバリデーション", () => {
    it("folderId: null は undefined として扱う", () => {
      const json = JSON.stringify({
        entries: [
          {
            id: "p-1",
            name: "test",
            memo: "",
            folderId: null,
            createdAt: 1,
            updatedAt: 1,
            nodes: [],
            connections: [],
            inferenceEdges: [],
            deductionStyle: "hilbert",
            usedAxiomIds: [],
          },
        ],
        folders: [],
        nextEntryId: 2,
        nextFolderId: 1,
      });
      const result = deserializeProofCollection(json);
      expect(result.entries[0]?.folderId).toBeUndefined();
    });

    it("folderId: 数値 は不正でエントリがスキップされる", () => {
      const json = JSON.stringify({
        entries: [
          {
            id: "p-1",
            name: "test",
            memo: "",
            folderId: 123,
            createdAt: 1,
            updatedAt: 1,
            nodes: [],
            connections: [],
            inferenceEdges: [],
            deductionStyle: "hilbert",
            usedAxiomIds: [],
          },
        ],
        folders: [],
        nextEntryId: 2,
        nextFolderId: 1,
      });
      const result = deserializeProofCollection(json);
      expect(result.entries).toHaveLength(0);
    });
  });
});
