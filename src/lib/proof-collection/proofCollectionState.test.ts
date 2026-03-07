import { describe, it, expect } from "vitest";
import type {
  WorkspaceNode,
  WorkspaceConnection,
} from "../proof-pad/workspaceState";
import type { InferenceEdge } from "../proof-pad/inferenceEdge";
import {
  createEmptyProofCollection,
  addProofEntry,
  removeProofEntry,
  renameProofEntry,
  updateProofEntryMemo,
  moveProofEntry,
  findProofEntry,
  listEntriesInFolder,
  listEntriesByUpdatedAt,
  createProofFolder,
  removeProofFolder,
  renameProofFolder,
  findProofFolder,
  listFolders,
  extractProofData,
  collectUsedAxiomIds,
  prepareProofSaveParams,
  importProofEntry,
  type AddEntryParams,
  type ProofEntry,
} from "./proofCollectionState";
import { createEmptyWorkspace, addNode } from "../proof-pad/workspaceState";
import { minimalLogicSystem } from "../logic-core/inferenceRule";

// --- テスト用ヘルパー ---

const createTestParams = (
  overrides?: Partial<AddEntryParams>,
): AddEntryParams => ({
  name: "テスト証明",
  nodes: [
    {
      originalId: "node-1",
      kind: "axiom",
      label: "公理",
      formulaText: "phi -> phi",
      relativePosition: { x: 0, y: 0 },
    },
  ],
  connections: [],
  inferenceEdges: [],
  deductionStyle: "hilbert",
  usedAxiomIds: ["A1", "A2"],
  now: 1000,
  ...overrides,
});

describe("createEmptyProofCollection", () => {
  it("空のコレクションを作成する", () => {
    const collection = createEmptyProofCollection();
    expect(collection.entries).toEqual([]);
    expect(collection.folders).toEqual([]);
    expect(collection.nextEntryId).toBe(1);
    expect(collection.nextFolderId).toBe(1);
  });
});

describe("addProofEntry", () => {
  it("エントリを追加する", () => {
    const collection = createEmptyProofCollection();
    const result = addProofEntry(collection, createTestParams());

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]?.id).toBe("proof-1");
    expect(result.entries[0]?.name).toBe("テスト証明");
    expect(result.entries[0]?.memo).toBe("");
    expect(result.entries[0]?.folderId).toBeUndefined();
    expect(result.entries[0]?.createdAt).toBe(1000);
    expect(result.entries[0]?.updatedAt).toBe(1000);
    expect(result.entries[0]?.deductionStyle).toBe("hilbert");
    expect(result.entries[0]?.usedAxiomIds).toEqual(["A1", "A2"]);
    expect(result.nextEntryId).toBe(2);
  });

  it("フォルダ指定でエントリを追加する", () => {
    let collection = createEmptyProofCollection();
    collection = createProofFolder(collection, "フォルダ1", 500);
    const result = addProofEntry(
      collection,
      createTestParams({ folderId: "folder-1" }),
    );

    expect(result.entries[0]?.folderId).toBe("folder-1");
  });

  it("複数のエントリを追加するとIDがインクリメントされる", () => {
    let collection = createEmptyProofCollection();
    collection = addProofEntry(collection, createTestParams({ now: 1000 }));
    collection = addProofEntry(
      collection,
      createTestParams({ name: "2つ目", now: 2000 }),
    );

    expect(collection.entries).toHaveLength(2);
    expect(collection.entries[0]?.id).toBe("proof-1");
    expect(collection.entries[1]?.id).toBe("proof-2");
    expect(collection.nextEntryId).toBe(3);
  });

  it("元のコレクションを変更しない（イミュータブル）", () => {
    const original = createEmptyProofCollection();
    const updated = addProofEntry(original, createTestParams());

    expect(original.entries).toHaveLength(0);
    expect(updated.entries).toHaveLength(1);
  });
});

describe("removeProofEntry", () => {
  it("エントリを削除する", () => {
    let collection = createEmptyProofCollection();
    collection = addProofEntry(collection, createTestParams());
    const result = removeProofEntry(collection, "proof-1");

    expect(result.entries).toHaveLength(0);
  });

  it("存在しないIDで削除しても変化しない", () => {
    let collection = createEmptyProofCollection();
    collection = addProofEntry(collection, createTestParams());
    const result = removeProofEntry(collection, "nonexistent");

    expect(result.entries).toHaveLength(1);
  });
});

describe("renameProofEntry", () => {
  it("エントリの名前を変更する", () => {
    let collection = createEmptyProofCollection();
    collection = addProofEntry(collection, createTestParams());
    const result = renameProofEntry(collection, "proof-1", "新しい名前", 2000);

    expect(result.entries[0]?.name).toBe("新しい名前");
    expect(result.entries[0]?.updatedAt).toBe(2000);
  });

  it("存在しないIDの名前変更は無視される", () => {
    let collection = createEmptyProofCollection();
    collection = addProofEntry(collection, createTestParams());
    const result = renameProofEntry(
      collection,
      "nonexistent",
      "新しい名前",
      2000,
    );

    expect(result.entries[0]?.name).toBe("テスト証明");
  });
});

describe("updateProofEntryMemo", () => {
  it("エントリのメモを更新する", () => {
    let collection = createEmptyProofCollection();
    collection = addProofEntry(collection, createTestParams());
    const result = updateProofEntryMemo(
      collection,
      "proof-1",
      "メモの内容",
      2000,
    );

    expect(result.entries[0]?.memo).toBe("メモの内容");
    expect(result.entries[0]?.updatedAt).toBe(2000);
  });

  it("他のエントリは影響を受けない", () => {
    let collection = createEmptyProofCollection();
    collection = addProofEntry(collection, createTestParams({ now: 1000 }));
    collection = addProofEntry(
      collection,
      createTestParams({ name: "other", now: 1500 }),
    );
    const result = updateProofEntryMemo(collection, "proof-1", "メモ", 2000);

    expect(result.entries[0]?.memo).toBe("メモ");
    expect(result.entries[1]?.memo).toBe("");
    expect(result.entries[1]?.updatedAt).toBe(1500);
  });
});

describe("moveProofEntry", () => {
  it("エントリをフォルダに移動する（他のエントリは影響なし）", () => {
    let collection = createEmptyProofCollection();
    collection = createProofFolder(collection, "フォルダ1", 500);
    collection = addProofEntry(collection, createTestParams());
    collection = addProofEntry(
      collection,
      createTestParams({ name: "other", now: 1500 }),
    );
    const result = moveProofEntry(collection, "proof-1", "folder-1", 2000);

    expect(result.entries[0]?.folderId).toBe("folder-1");
    expect(result.entries[1]?.folderId).toBeUndefined();
    expect(result.entries[0]?.updatedAt).toBe(2000);
  });

  it("エントリをルートに移動する（folderId=undefined）", () => {
    let collection = createEmptyProofCollection();
    collection = createProofFolder(collection, "フォルダ1", 500);
    collection = addProofEntry(
      collection,
      createTestParams({ folderId: "folder-1" }),
    );
    const result = moveProofEntry(collection, "proof-1", undefined, 2000);

    expect(result.entries[0]?.folderId).toBeUndefined();
  });
});

describe("findProofEntry", () => {
  it("IDでエントリを検索する", () => {
    let collection = createEmptyProofCollection();
    collection = addProofEntry(collection, createTestParams());
    const entry = findProofEntry(collection, "proof-1");

    expect(entry).toBeDefined();
    expect(entry?.name).toBe("テスト証明");
  });

  it("存在しないIDはundefinedを返す", () => {
    const collection = createEmptyProofCollection();
    const entry = findProofEntry(collection, "nonexistent");

    expect(entry).toBeUndefined();
  });
});

describe("listEntriesInFolder", () => {
  it("フォルダ内のエントリを取得する", () => {
    let collection = createEmptyProofCollection();
    collection = createProofFolder(collection, "F1", 500);
    collection = addProofEntry(
      collection,
      createTestParams({ name: "ルート", now: 1000 }),
    );
    collection = addProofEntry(
      collection,
      createTestParams({ name: "F1内", folderId: "folder-1", now: 2000 }),
    );

    const rootEntries = listEntriesInFolder(collection, undefined);
    expect(rootEntries).toHaveLength(1);
    expect(rootEntries[0]?.name).toBe("ルート");

    const folderEntries = listEntriesInFolder(collection, "folder-1");
    expect(folderEntries).toHaveLength(1);
    expect(folderEntries[0]?.name).toBe("F1内");
  });
});

describe("listEntriesByUpdatedAt", () => {
  it("更新日降順でエントリを取得する", () => {
    let collection = createEmptyProofCollection();
    collection = addProofEntry(
      collection,
      createTestParams({ name: "古い", now: 1000 }),
    );
    collection = addProofEntry(
      collection,
      createTestParams({ name: "新しい", now: 3000 }),
    );
    collection = addProofEntry(
      collection,
      createTestParams({ name: "中間", now: 2000 }),
    );

    const sorted = listEntriesByUpdatedAt(collection);
    expect(sorted.map((e) => e.name)).toEqual(["新しい", "中間", "古い"]);
  });
});

describe("createProofFolder", () => {
  it("フォルダを作成する", () => {
    const collection = createEmptyProofCollection();
    const result = createProofFolder(collection, "マイフォルダ", 1000);

    expect(result.folders).toHaveLength(1);
    expect(result.folders[0]?.id).toBe("folder-1");
    expect(result.folders[0]?.name).toBe("マイフォルダ");
    expect(result.folders[0]?.createdAt).toBe(1000);
    expect(result.nextFolderId).toBe(2);
  });

  it("複数フォルダのIDがインクリメントされる", () => {
    let collection = createEmptyProofCollection();
    collection = createProofFolder(collection, "F1", 1000);
    collection = createProofFolder(collection, "F2", 2000);

    expect(collection.folders).toHaveLength(2);
    expect(collection.folders[0]?.id).toBe("folder-1");
    expect(collection.folders[1]?.id).toBe("folder-2");
    expect(collection.nextFolderId).toBe(3);
  });
});

describe("removeProofFolder", () => {
  it("フォルダを削除し、中のエントリはルートに移動する", () => {
    let collection = createEmptyProofCollection();
    collection = createProofFolder(collection, "F1", 500);
    collection = addProofEntry(
      collection,
      createTestParams({ name: "F1内", folderId: "folder-1", now: 1000 }),
    );

    const result = removeProofFolder(collection, "folder-1");

    expect(result.folders).toHaveLength(0);
    expect(result.entries[0]?.folderId).toBeUndefined();
  });

  it("他のフォルダのエントリは影響を受けない", () => {
    let collection = createEmptyProofCollection();
    collection = createProofFolder(collection, "F1", 500);
    collection = createProofFolder(collection, "F2", 600);
    collection = addProofEntry(
      collection,
      createTestParams({ name: "F2内", folderId: "folder-2", now: 1000 }),
    );

    const result = removeProofFolder(collection, "folder-1");

    expect(result.entries[0]?.folderId).toBe("folder-2");
  });
});

describe("renameProofFolder", () => {
  it("フォルダの名前を変更する（他のフォルダは影響なし）", () => {
    let collection = createEmptyProofCollection();
    collection = createProofFolder(collection, "旧名", 1000);
    collection = createProofFolder(collection, "別フォルダ", 2000);
    const result = renameProofFolder(collection, "folder-1", "新名");

    expect(result.folders[0]?.name).toBe("新名");
    expect(result.folders[1]?.name).toBe("別フォルダ");
  });
});

describe("findProofFolder", () => {
  it("IDでフォルダを検索する", () => {
    let collection = createEmptyProofCollection();
    collection = createProofFolder(collection, "F1", 1000);
    const folder = findProofFolder(collection, "folder-1");

    expect(folder).toBeDefined();
    expect(folder?.name).toBe("F1");
  });

  it("存在しないIDはundefinedを返す", () => {
    const collection = createEmptyProofCollection();
    expect(findProofFolder(collection, "nonexistent")).toBeUndefined();
  });
});

describe("listFolders", () => {
  it("名前順でフォルダを取得する", () => {
    let collection = createEmptyProofCollection();
    collection = createProofFolder(collection, "C", 1000);
    collection = createProofFolder(collection, "A", 2000);
    collection = createProofFolder(collection, "B", 3000);

    const sorted = listFolders(collection);
    expect(sorted.map((f) => f.name)).toEqual(["A", "B", "C"]);
  });
});

describe("extractProofData", () => {
  const nodes: readonly WorkspaceNode[] = [
    {
      id: "node-1",
      kind: "axiom",
      label: "公理1",
      formulaText: "phi",
      position: { x: 100, y: 200 },
      role: "axiom",
    },
    {
      id: "node-2",
      kind: "conclusion",
      label: "結論",
      formulaText: "psi",
      position: { x: 300, y: 200 },
    },
    {
      id: "node-3",
      kind: "axiom",
      label: "公理2",
      formulaText: "chi",
      position: { x: 200, y: 100 },
    },
  ];

  const connections: readonly WorkspaceConnection[] = [
    {
      id: "conn-1",
      fromNodeId: "node-1",
      fromPortId: "bottom",
      toNodeId: "node-2",
      toPortId: "top-left",
    },
    {
      id: "conn-2",
      fromNodeId: "node-3",
      fromPortId: "bottom",
      toNodeId: "node-2",
      toPortId: "top-right",
    },
  ];

  const mpEdge: InferenceEdge = {
    _tag: "mp",
    conclusionNodeId: "node-2",
    leftPremiseNodeId: "node-1",
    rightPremiseNodeId: "node-3",
    conclusionText: "psi",
  };

  it("選択ノードからデータを抽出する", () => {
    const selected = new Set(["node-1", "node-2"]);
    const result = extractProofData(selected, nodes, connections, [mpEdge]);

    expect(result.nodes).toHaveLength(2);
    expect(result.nodes.map((n) => n.originalId)).toEqual(["node-1", "node-2"]);

    // 相対位置が計算されている（中心は (200, 200)）
    expect(result.nodes[0]?.relativePosition).toEqual({ x: -100, y: 0 });
    expect(result.nodes[1]?.relativePosition).toEqual({ x: 100, y: 0 });
  });

  it("選択ノード間の接続のみ含める", () => {
    const selected = new Set(["node-1", "node-2"]);
    const result = extractProofData(selected, nodes, connections, []);

    // node-1 → node-2 の接続のみ含まれる（node-3は選択外）
    expect(result.connections).toHaveLength(1);
    expect(result.connections[0]?.fromOriginalNodeId).toBe("node-1");
  });

  it("全前提が選択範囲内のInferenceEdgeのみ含める", () => {
    const selected = new Set(["node-1", "node-2"]);
    const result = extractProofData(selected, nodes, connections, [mpEdge]);

    // node-3（右前提）が選択外なのでMPエッジは含まれない
    expect(result.inferenceEdges).toHaveLength(0);
  });

  it("全ノードが選択されている場合はInferenceEdgeも含まれる", () => {
    const selected = new Set(["node-1", "node-2", "node-3"]);
    const result = extractProofData(selected, nodes, connections, [mpEdge]);

    expect(result.inferenceEdges).toHaveLength(1);
    expect(result.inferenceEdges[0]?._tag).toBe("mp");
  });

  it("空の選択セットの場合は空のデータを返す", () => {
    const selected = new Set<string>();
    const result = extractProofData(selected, nodes, connections, [mpEdge]);

    expect(result.nodes).toHaveLength(0);
    expect(result.connections).toHaveLength(0);
    expect(result.inferenceEdges).toHaveLength(0);
  });

  it("roleが設定されたノードはroleも含まれる", () => {
    const selected = new Set(["node-1"]);
    const result = extractProofData(selected, nodes, connections, []);

    expect(result.nodes[0]?.role).toBe("axiom");
  });

  it("roleが未設定のノードはroleが含まれない", () => {
    const selected = new Set(["node-2"]);
    const result = extractProofData(selected, nodes, connections, []);

    expect(result.nodes[0]?.role).toBeUndefined();
  });
});

describe("collectUsedAxiomIds", () => {
  it("証明サブグラフの公理IDを収集する", () => {
    const proofNodeIds = new Set(["n1", "n2", "n3"]);
    const axiomIdByNodeId = new Map<string, string | undefined>([
      ["n1", "A1"],
      ["n2", undefined],
      ["n3", "A2"],
    ]);

    const result = collectUsedAxiomIds(proofNodeIds, axiomIdByNodeId);
    expect(result).toEqual(["A1", "A2"]);
  });

  it("重複する公理IDは1つにまとめる", () => {
    const proofNodeIds = new Set(["n1", "n2", "n3"]);
    const axiomIdByNodeId = new Map<string, string | undefined>([
      ["n1", "A1"],
      ["n2", "A1"],
      ["n3", "A2"],
    ]);

    const result = collectUsedAxiomIds(proofNodeIds, axiomIdByNodeId);
    expect(result).toEqual(["A1", "A2"]);
  });

  it("公理IDがない場合は空配列を返す", () => {
    const proofNodeIds = new Set(["n1", "n2"]);
    const axiomIdByNodeId = new Map<string, string | undefined>([
      ["n1", undefined],
    ]);

    const result = collectUsedAxiomIds(proofNodeIds, axiomIdByNodeId);
    expect(result).toEqual([]);
  });

  it("空の証明サブグラフの場合は空配列を返す", () => {
    const proofNodeIds = new Set<string>();
    const axiomIdByNodeId = new Map<string, string | undefined>();

    const result = collectUsedAxiomIds(proofNodeIds, axiomIdByNodeId);
    expect(result).toEqual([]);
  });

  it("公理IDはソートされる", () => {
    const proofNodeIds = new Set(["n1", "n2", "n3"]);
    const axiomIdByNodeId = new Map<string, string | undefined>([
      ["n1", "DNE"],
      ["n2", "A2"],
      ["n3", "A1"],
    ]);

    const result = collectUsedAxiomIds(proofNodeIds, axiomIdByNodeId);
    expect(result).toEqual(["A1", "A2", "DNE"]);
  });
});

describe("prepareProofSaveParams", () => {
  it("ノードの証明サブグラフからパラメータを組み立てる", () => {
    let workspace = createEmptyWorkspace(minimalLogicSystem);
    workspace = addNode(
      workspace,
      "axiom",
      "公理",
      { x: 0, y: 0 },
      "phi -> psi",
    );

    const axiomIdByNodeId = new Map<string, string | undefined>([
      ["node-1", "A1"],
    ]);

    const result = prepareProofSaveParams(
      "node-1",
      workspace,
      axiomIdByNodeId,
      "hilbert",
    );

    expect(result).toBeDefined();
    expect(result?.name).toBe("phi -> psi");
    expect(result?.nodes).toHaveLength(1);
    expect(result?.deductionStyle).toBe("hilbert");
    expect(result?.usedAxiomIds).toEqual(["A1"]);
  });

  it("存在しないノードIDの場合undefinedを返す", () => {
    const workspace = createEmptyWorkspace(minimalLogicSystem);
    const axiomIdByNodeId = new Map<string, string | undefined>();

    const result = prepareProofSaveParams(
      "nonexistent",
      workspace,
      axiomIdByNodeId,
      "hilbert",
    );

    expect(result).toBeUndefined();
  });

  it("formulaTextが空の場合デフォルト名を使う", () => {
    let workspace = createEmptyWorkspace(minimalLogicSystem);
    workspace = addNode(workspace, "axiom", "公理", { x: 0, y: 0 }, "");

    const axiomIdByNodeId = new Map<string, string | undefined>();

    const result = prepareProofSaveParams(
      "node-1",
      workspace,
      axiomIdByNodeId,
      "hilbert",
    );

    expect(result?.name).toBe("Untitled Proof");
  });

  it("推論エッジがある場合は前提ノードも含まれる", () => {
    let workspace = createEmptyWorkspace(minimalLogicSystem);
    workspace = addNode(workspace, "axiom", "", { x: 0, y: 0 }, "phi");
    workspace = addNode(workspace, "axiom", "", { x: 100, y: 0 }, "phi -> psi");
    // ノードを手動でMP適用（workspaceState.applyMPAndConnect は内部でedge作成する）
    // ここでは直接 inferenceEdge を設定してテスト
    const workspaceWithEdge: typeof workspace = {
      ...workspace,
      nodes: [
        ...workspace.nodes,
        {
          id: "node-3",
          kind: "conclusion",
          label: "",
          formulaText: "psi",
          position: { x: 50, y: 100 },
        },
      ],
      inferenceEdges: [
        {
          _tag: "mp",
          conclusionNodeId: "node-3",
          leftPremiseNodeId: "node-1",
          rightPremiseNodeId: "node-2",
          conclusionText: "psi",
        },
      ],
    };

    const axiomIdByNodeId = new Map<string, string | undefined>([
      ["node-1", "A1"],
      ["node-2", "A2"],
    ]);

    const result = prepareProofSaveParams(
      "node-3",
      workspaceWithEdge,
      axiomIdByNodeId,
      "hilbert",
    );

    expect(result).toBeDefined();
    expect(result?.name).toBe("psi");
    // 3ノード（node-1, node-2, node-3）が含まれる
    expect(result?.nodes).toHaveLength(3);
    expect(result?.usedAxiomIds).toEqual(["A1", "A2"]);
    expect(result?.inferenceEdges).toHaveLength(1);
  });
});

// --- importProofEntry テスト ---

const createTestEntry = (
  overrides?: Partial<ProofEntry>,
): ProofEntry => ({
  id: "proof-1",
  name: "テスト証明",
  memo: "",
  folderId: undefined,
  createdAt: 1000,
  updatedAt: 1000,
  nodes: [
    {
      originalId: "node-1",
      kind: "axiom",
      label: "公理",
      formulaText: "phi -> phi",
      relativePosition: { x: -50, y: 0 },
    },
    {
      originalId: "node-2",
      kind: "conclusion",
      label: "",
      formulaText: "phi",
      relativePosition: { x: 50, y: 0 },
    },
  ],
  connections: [
    {
      fromOriginalNodeId: "node-1",
      fromPortId: "out-0",
      toOriginalNodeId: "node-2",
      toPortId: "in-0",
    },
  ],
  inferenceEdges: [
    {
      _tag: "mp",
      conclusionNodeId: "node-2",
      leftPremiseNodeId: "node-1",
      rightPremiseNodeId: "node-1",
      conclusionText: "phi",
    },
  ],
  deductionStyle: "hilbert",
  usedAxiomIds: ["A1"],
  ...overrides,
});

describe("importProofEntry", () => {
  it("SavedNodeをWorkspaceNodeに変換し新しいIDを割り当てる", () => {
    const entry = createTestEntry();
    const result = importProofEntry(entry, { x: 100, y: 200 }, 10);

    expect(result.newNodes).toHaveLength(2);
    expect(result.newNodes[0]?.id).toBe("node-10");
    expect(result.newNodes[0]?.kind).toBe("axiom");
    expect(result.newNodes[0]?.formulaText).toBe("phi -> phi");
    expect(result.newNodes[0]?.position).toEqual({ x: 50, y: 200 });
    expect(result.newNodes[1]?.id).toBe("node-11");
    expect(result.newNodes[1]?.position).toEqual({ x: 150, y: 200 });
    expect(result.nextNodeId).toBe(12);
  });

  it("SavedConnectionをWorkspaceConnectionに変換しIDをリマップする", () => {
    const entry = createTestEntry();
    const result = importProofEntry(entry, { x: 0, y: 0 }, 1);

    expect(result.newConnections).toHaveLength(1);
    expect(result.newConnections[0]?.fromNodeId).toBe("node-1");
    expect(result.newConnections[0]?.fromPortId).toBe("out-0");
    expect(result.newConnections[0]?.toNodeId).toBe("node-2");
    expect(result.newConnections[0]?.toPortId).toBe("in-0");
  });

  it("InferenceEdgeのノードIDをリマップする", () => {
    const entry = createTestEntry();
    const result = importProofEntry(entry, { x: 0, y: 0 }, 5);

    expect(result.newInferenceEdges).toHaveLength(1);
    const edge = result.newInferenceEdges[0];
    expect(edge?._tag).toBe("mp");
    expect(edge?.conclusionNodeId).toBe("node-6");
    if (edge?._tag === "mp") {
      expect(edge.leftPremiseNodeId).toBe("node-5");
      expect(edge.rightPremiseNodeId).toBe("node-5");
    }
  });

  it("空のエントリの場合は空の結果を返す", () => {
    const entry = createTestEntry({
      nodes: [],
      connections: [],
      inferenceEdges: [],
    });
    const result = importProofEntry(entry, { x: 0, y: 0 }, 1);

    expect(result.newNodes).toEqual([]);
    expect(result.newConnections).toEqual([]);
    expect(result.newInferenceEdges).toEqual([]);
    expect(result.nextNodeId).toBe(1);
  });

  it("roleが設定されたノードを正しくインポートする", () => {
    const entry = createTestEntry({
      nodes: [
        {
          originalId: "node-1",
          kind: "axiom",
          label: "公理",
          formulaText: "phi",
          relativePosition: { x: 0, y: 0 },
          role: "axiom",
        },
      ],
      connections: [],
      inferenceEdges: [],
    });
    const result = importProofEntry(entry, { x: 100, y: 100 }, 1);

    expect(result.newNodes[0]?.role).toBe("axiom");
  });

  it("roleがないノードはroleプロパティを持たない", () => {
    const entry = createTestEntry({
      nodes: [
        {
          originalId: "node-1",
          kind: "axiom",
          label: "公理",
          formulaText: "phi",
          relativePosition: { x: 0, y: 0 },
        },
      ],
      connections: [],
      inferenceEdges: [],
    });
    const result = importProofEntry(entry, { x: 0, y: 0 }, 1);

    expect("role" in (result.newNodes[0] ?? {})).toBe(false);
  });

  it("不正な接続（存在しないノードIDを参照）はフィルタされる", () => {
    const entry = createTestEntry({
      nodes: [
        {
          originalId: "node-1",
          kind: "axiom",
          label: "",
          formulaText: "phi",
          relativePosition: { x: 0, y: 0 },
        },
      ],
      connections: [
        {
          fromOriginalNodeId: "node-1",
          fromPortId: "out-0",
          toOriginalNodeId: "nonexistent",
          toPortId: "in-0",
        },
      ],
      inferenceEdges: [],
    });
    const result = importProofEntry(entry, { x: 0, y: 0 }, 1);

    expect(result.newConnections).toEqual([]);
  });
});
