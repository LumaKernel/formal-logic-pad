/**
 * 証明コレクションの純粋な状態管理ロジック。
 *
 * ユーザーが保存した証明図のエントリとフォルダを管理する。
 * 証明はワークスペースから抽出したサブグラフ（ノード・接続・推論エッジ）を保存する。
 *
 * 変更時は proofCollectionState.test.ts, proofCollectionSerialization.ts, index.ts も同期すること。
 */

import type { Point } from "../infinite-canvas/types";
import type {
  WorkspaceNode,
  WorkspaceConnection,
  WorkspaceState,
} from "../proof-pad/workspaceState";
import type { InferenceEdge } from "../proof-pad/inferenceEdge";
import { getInferenceEdgePremiseNodeIds } from "../proof-pad/inferenceEdge";
import { remapEdgeNodeIds } from "../proof-pad/inferenceEdge";
import { getProofNodeIds } from "../proof-pad/dependencyLogic";
import type { DeductionStyle } from "../logic-core/deductionSystem";

// --- 証明エントリの型定義 ---

/** 証明エントリの一意識別子 */
export type ProofEntryId = string;

/** フォルダの一意識別子 */
export type ProofFolderId = string;

/**
 * 保存された証明のノードデータ。
 * copyPasteLogicのCopiedNodeと同様の構造。
 */
export type SavedNode = {
  readonly originalId: string;
  readonly kind: WorkspaceNode["kind"];
  readonly label: string;
  readonly formulaText: string;
  readonly relativePosition: Point;
  readonly role?: WorkspaceNode["role"];
};

/**
 * 保存された証明の接続データ。
 */
export type SavedConnection = {
  readonly fromOriginalNodeId: string;
  readonly fromPortId: string;
  readonly toOriginalNodeId: string;
  readonly toPortId: string;
};

/**
 * 保存された証明エントリ。
 * 証明サブグラフ（ノード・接続・推論エッジ）とメタデータを持つ。
 */
export type ProofEntry = {
  readonly id: ProofEntryId;
  readonly name: string;
  readonly memo: string;
  readonly folderId: ProofFolderId | undefined;
  readonly createdAt: number;
  readonly updatedAt: number;
  /** 証明サブグラフのノード群（相対位置で保存） */
  readonly nodes: readonly SavedNode[];
  /** 証明サブグラフの接続群 */
  readonly connections: readonly SavedConnection[];
  /** 証明サブグラフの推論エッジ群 */
  readonly inferenceEdges: readonly InferenceEdge[];
  /** 保存元の証明スタイル */
  readonly deductionStyle: DeductionStyle;
  /**
   * 使用されている公理IDのリスト。
   * 互換性チェック時に、ターゲットの体系がこれらの公理をサポートしているか確認する。
   */
  readonly usedAxiomIds: readonly string[];
};

/** フォルダ */
export type ProofFolder = {
  readonly id: ProofFolderId;
  readonly name: string;
  readonly createdAt: number;
};

/** 証明コレクション全体 */
export type ProofCollection = {
  readonly entries: readonly ProofEntry[];
  readonly folders: readonly ProofFolder[];
  readonly nextEntryId: number;
  readonly nextFolderId: number;
};

// --- 初期状態 ---

/** 空のコレクションを作成する */
export function createEmptyProofCollection(): ProofCollection {
  return {
    entries: [],
    folders: [],
    nextEntryId: 1,
    nextFolderId: 1,
  };
}

// --- エントリ操作 ---

export type AddEntryParams = {
  readonly name: string;
  readonly nodes: readonly SavedNode[];
  readonly connections: readonly SavedConnection[];
  readonly inferenceEdges: readonly InferenceEdge[];
  readonly deductionStyle: DeductionStyle;
  readonly usedAxiomIds: readonly string[];
  readonly now: number;
  readonly folderId?: ProofFolderId;
};

/** 証明エントリを追加する */
export function addProofEntry(
  collection: ProofCollection,
  params: AddEntryParams,
): ProofCollection {
  const entryId: ProofEntryId = `proof-${String(collection.nextEntryId) satisfies string}`;
  const entry: ProofEntry = {
    id: entryId,
    name: params.name,
    memo: "",
    folderId: params.folderId,
    createdAt: params.now,
    updatedAt: params.now,
    nodes: params.nodes,
    connections: params.connections,
    inferenceEdges: params.inferenceEdges,
    deductionStyle: params.deductionStyle,
    usedAxiomIds: params.usedAxiomIds,
  };
  return {
    ...collection,
    entries: [...collection.entries, entry],
    nextEntryId: collection.nextEntryId + 1,
  };
}

/** 証明エントリを削除する */
export function removeProofEntry(
  collection: ProofCollection,
  entryId: ProofEntryId,
): ProofCollection {
  return {
    ...collection,
    entries: collection.entries.filter((e) => e.id !== entryId),
  };
}

/** 証明エントリの名前を変更する */
export function renameProofEntry(
  collection: ProofCollection,
  entryId: ProofEntryId,
  newName: string,
  now: number,
): ProofCollection {
  return {
    ...collection,
    entries: collection.entries.map((e) =>
      e.id === entryId ? { ...e, name: newName, updatedAt: now } : e,
    ),
  };
}

/** 証明エントリのメモを更新する */
export function updateProofEntryMemo(
  collection: ProofCollection,
  entryId: ProofEntryId,
  memo: string,
  now: number,
): ProofCollection {
  return {
    ...collection,
    entries: collection.entries.map((e) =>
      e.id === entryId ? { ...e, memo, updatedAt: now } : e,
    ),
  };
}

/** 証明エントリのフォルダを変更する */
export function moveProofEntry(
  collection: ProofCollection,
  entryId: ProofEntryId,
  targetFolderId: ProofFolderId | undefined,
  now: number,
): ProofCollection {
  return {
    ...collection,
    entries: collection.entries.map((e) =>
      e.id === entryId ? { ...e, folderId: targetFolderId, updatedAt: now } : e,
    ),
  };
}

/** 証明エントリを検索する */
export function findProofEntry(
  collection: ProofCollection,
  entryId: ProofEntryId,
): ProofEntry | undefined {
  return collection.entries.find((e) => e.id === entryId);
}

/** フォルダ内のエントリを取得する（undefinedはルート） */
export function listEntriesInFolder(
  collection: ProofCollection,
  folderId: ProofFolderId | undefined,
): readonly ProofEntry[] {
  return collection.entries.filter((e) => e.folderId === folderId);
}

/** 全エントリを更新日順（降順）で取得する */
export function listEntriesByUpdatedAt(
  collection: ProofCollection,
): readonly ProofEntry[] {
  return [...collection.entries].sort((a, b) => b.updatedAt - a.updatedAt);
}

// --- フォルダ操作 ---

/** フォルダを作成する */
export function createProofFolder(
  collection: ProofCollection,
  name: string,
  now: number,
): ProofCollection {
  const folderId: ProofFolderId = `folder-${String(collection.nextFolderId) satisfies string}`;
  const folder: ProofFolder = {
    id: folderId,
    name,
    createdAt: now,
  };
  return {
    ...collection,
    folders: [...collection.folders, folder],
    nextFolderId: collection.nextFolderId + 1,
  };
}

/** フォルダを削除する（中のエントリはルートに移動する） */
export function removeProofFolder(
  collection: ProofCollection,
  folderId: ProofFolderId,
): ProofCollection {
  return {
    ...collection,
    folders: collection.folders.filter((f) => f.id !== folderId),
    entries: collection.entries.map((e) =>
      e.folderId === folderId ? { ...e, folderId: undefined } : e,
    ),
  };
}

/** フォルダの名前を変更する */
export function renameProofFolder(
  collection: ProofCollection,
  folderId: ProofFolderId,
  newName: string,
): ProofCollection {
  return {
    ...collection,
    folders: collection.folders.map((f) =>
      f.id === folderId ? { ...f, name: newName } : f,
    ),
  };
}

/** フォルダを検索する */
export function findProofFolder(
  collection: ProofCollection,
  folderId: ProofFolderId,
): ProofFolder | undefined {
  return collection.folders.find((f) => f.id === folderId);
}

/** 全フォルダを名前順で取得する */
export function listFolders(
  collection: ProofCollection,
): readonly ProofFolder[] {
  return [...collection.folders].sort((a, b) => a.name.localeCompare(b.name));
}

// --- ワークスペースからの証明抽出 ---

/**
 * ワークスペースの選択ノードから証明エントリ用のデータを抽出する。
 * copyPasteLogicのbuildClipboardDataと同様のロジックだが、
 * SavedNode/SavedConnection型で返す。
 */
export function extractProofData(
  selectedNodeIds: ReadonlySet<string>,
  allNodes: readonly WorkspaceNode[],
  allConnections: readonly WorkspaceConnection[],
  allInferenceEdges: readonly InferenceEdge[],
): {
  readonly nodes: readonly SavedNode[];
  readonly connections: readonly SavedConnection[];
  readonly inferenceEdges: readonly InferenceEdge[];
} {
  const selectedNodes = allNodes.filter((n) => selectedNodeIds.has(n.id));

  // 中心座標を計算
  const centroid =
    selectedNodes.length === 0
      ? { x: 0, y: 0 }
      : {
          x:
            selectedNodes.reduce((sum, n) => sum + n.position.x, 0) /
            selectedNodes.length,
          y:
            selectedNodes.reduce((sum, n) => sum + n.position.y, 0) /
            selectedNodes.length,
        };

  const nodes: readonly SavedNode[] = selectedNodes.map((n) => ({
    originalId: n.id,
    kind: n.kind,
    label: n.label,
    formulaText: n.formulaText,
    relativePosition: {
      x: n.position.x - centroid.x,
      y: n.position.y - centroid.y,
    },
    ...(n.role !== undefined ? { role: n.role } : {}),
  }));

  // 選択ノード間の接続のみ
  const connections: readonly SavedConnection[] = allConnections
    .filter(
      (c) =>
        selectedNodeIds.has(c.fromNodeId) && selectedNodeIds.has(c.toNodeId),
    )
    .map((c) => ({
      fromOriginalNodeId: c.fromNodeId,
      fromPortId: c.fromPortId,
      toOriginalNodeId: c.toNodeId,
      toPortId: c.toPortId,
    }));

  // 選択ノード内に完結するInferenceEdgeのみ
  const inferenceEdges = allInferenceEdges.filter((edge) => {
    if (!selectedNodeIds.has(edge.conclusionNodeId)) return false;
    const premiseIds = getInferenceEdgePremiseNodeIds(edge);
    return premiseIds.every((id) => selectedNodeIds.has(id));
  });

  return { nodes, connections, inferenceEdges };
}

// --- 公理ID収集 ---

/**
 * 証明サブグラフのノード群から使用されている公理IDを収集する。
 *
 * @param proofNodeIds 証明サブグラフに含まれるノードIDの集合
 * @param axiomIdByNodeId 各ノードIDに対応する公理ID（undefined = 公理でない）
 * @returns 一意な公理IDのリスト
 */
export function collectUsedAxiomIds(
  proofNodeIds: ReadonlySet<string>,
  axiomIdByNodeId: ReadonlyMap<string, string | undefined>,
): readonly string[] {
  const axiomIds = new Set<string>();
  for (const nodeId of proofNodeIds) {
    const axiomId = axiomIdByNodeId.get(nodeId);
    if (axiomId !== undefined) {
      axiomIds.add(axiomId);
    }
  }
  return [...axiomIds].sort();
}

// --- ワンクリック保存用のパラメータ準備 ---

/**
 * prepareProofSaveParams の結果。
 * AddEntryParams から now を除いた形。
 */
export type ProofSaveParams = Omit<AddEntryParams, "now">;

/**
 * 特定ノードの証明サブグラフから、コレクション保存用のパラメータを組み立てる。
 *
 * 1. getProofNodeIds で証明サブグラフのノードIDを収集
 * 2. extractProofData でノード・接続・推論エッジを抽出
 * 3. collectUsedAxiomIds で使用公理IDを収集
 * 4. デフォルト名をノードの formulaText から生成
 *
 * @param nodeId 証明の結論ノードID
 * @param workspace ワークスペースの状態
 * @param axiomIdByNodeId 各ノードの公理ID（ProofWorkspace の axiomNames から構築）
 * @param deductionStyle 演繹スタイル
 *
 * 変更時は proofCollectionState.test.ts, index.ts も同期すること。
 */
export function prepareProofSaveParams(
  nodeId: string,
  workspace: WorkspaceState,
  axiomIdByNodeId: ReadonlyMap<string, string | undefined>,
  deductionStyle: DeductionStyle,
): ProofSaveParams | undefined {
  const node = workspace.nodes.find((n) => n.id === nodeId);
  if (node === undefined) return undefined;

  const proofNodeIds = getProofNodeIds(nodeId, workspace.inferenceEdges);
  const extracted = extractProofData(
    proofNodeIds,
    workspace.nodes,
    workspace.connections,
    workspace.inferenceEdges,
  );
  const usedAxiomIds = collectUsedAxiomIds(proofNodeIds, axiomIdByNodeId);

  return {
    name: node.formulaText || "Untitled Proof",
    nodes: extracted.nodes,
    connections: extracted.connections,
    inferenceEdges: extracted.inferenceEdges,
    deductionStyle,
    usedAxiomIds,
  };
}

// --- 証明エントリのインポート ---

/**
 * インポート結果。新しいノード・接続・推論エッジを返す。
 * copyPasteLogicのPasteResultと同様の構造。
 *
 * 変更時は proofCollectionState.test.ts, workspaceState.ts, index.ts も同期すること。
 */
export type ImportProofResult = {
  readonly newNodes: readonly WorkspaceNode[];
  readonly newConnections: readonly WorkspaceConnection[];
  readonly newInferenceEdges: readonly InferenceEdge[];
  readonly nextNodeId: number;
};

/**
 * 保存された証明エントリからワークスペースノード・接続・推論エッジを復元する。
 * 新しいIDを割り当て、指定位置を中心に配置する。
 *
 * pasteClipboardData と同様のパターン:
 * - SavedNode → WorkspaceNode（新IDを割り当て、相対位置→絶対位置に変換）
 * - SavedConnection → WorkspaceConnection（新IDにリマップ）
 * - InferenceEdge → InferenceEdge（ノードIDを新IDにリマップ）
 *
 * @param entry インポートする証明エントリ
 * @param targetCenter ペースト先の中心座標
 * @param startNodeId 新しいノードIDの開始番号
 */
export function importProofEntry(
  entry: ProofEntry,
  targetCenter: Point,
  startNodeId: number,
): ImportProofResult {
  const idMap = new Map<string, string>();
  let currentNodeId = startNodeId;

  const newNodes: readonly WorkspaceNode[] = entry.nodes.map((savedNode) => {
    const newId = `node-${String(currentNodeId) satisfies string}`;
    idMap.set(savedNode.originalId, newId);
    currentNodeId++;

    return {
      id: newId,
      kind: savedNode.kind,
      label: savedNode.label,
      formulaText: savedNode.formulaText,
      position: {
        x: targetCenter.x + savedNode.relativePosition.x,
        y: targetCenter.y + savedNode.relativePosition.y,
      },
      ...(savedNode.role !== undefined ? { role: savedNode.role } : {}),
    };
  });

  const newConnections: readonly WorkspaceConnection[] = entry.connections
    .map((savedConn) => {
      const fromId = idMap.get(savedConn.fromOriginalNodeId);
      const toId = idMap.get(savedConn.toOriginalNodeId);
      if (fromId === undefined || toId === undefined) return undefined;

      return {
        id: `conn-${fromId satisfies string}-${savedConn.fromPortId satisfies string}-${toId satisfies string}-${savedConn.toPortId satisfies string}`,
        fromNodeId: fromId,
        fromPortId: savedConn.fromPortId,
        toNodeId: toId,
        toPortId: savedConn.toPortId,
      };
    })
    .filter((c) => c !== undefined);

  const newInferenceEdges: readonly InferenceEdge[] = entry.inferenceEdges
    .map((edge): InferenceEdge | undefined => {
      const newConclusionId = idMap.get(edge.conclusionNodeId);
      if (newConclusionId === undefined) return undefined;
      return remapEdgeNodeIds(edge, (id) => idMap.get(id));
    })
    .filter((e) => e !== undefined);

  return {
    newNodes,
    newConnections,
    newInferenceEdges,
    nextNodeId: currentNodeId,
  };
}
