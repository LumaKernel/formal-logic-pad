/**
 * コピー＆ペーストの純粋ロジック。
 *
 * 選択されたノード群と内部接続をシリアライズ（コピー）し、
 * 新しいIDで復元（ペースト）する機能を提供する。
 *
 * 変更時は copyPasteLogic.test.ts, workspaceState.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import type { Point } from "../infinite-canvas/types";
import type { WorkspaceNode, WorkspaceConnection } from "./workspaceState";
import type { InferenceEdge } from "./inferenceEdge";
import {
  getInferenceEdgePremiseNodeIds,
  isAtInferenceEdge,
  isHilbertInferenceEdge,
  isNdInferenceEdge,
  isScInferenceEdge,
  isTabInferenceEdge,
  remapEdgeNodeIds,
} from "./inferenceEdge";
import type { DeductionStyle } from "../logic-core/deductionSystem";

// --- クリップボードデータ型 ---

/**
 * コピーされたノードのデータ。
 * IDはペースト時に再割り当てされるため、元のIDは参照用のみ。
 */
export type CopiedNode = {
  readonly originalId: string;
  readonly kind: WorkspaceNode["kind"];
  readonly label: string;
  readonly formulaText: string;
  /** コピー元ノード群の中心からの相対位置 */
  readonly relativePosition: Point;
  readonly role?: WorkspaceNode["role"];
  // protection は意図的に含めない（コピーしたものは保護されない）
};

/**
 * コピーされた接続のデータ。
 * ノードIDはコピー元のIDを参照し、ペースト時にマッピングされる。
 */
export type CopiedConnection = {
  readonly fromOriginalNodeId: string;
  readonly fromPortId: string;
  readonly toOriginalNodeId: string;
  readonly toPortId: string;
};

/**
 * クリップボードに保存するデータ。
 * JSONシリアライズ可能な構造。
 */
export type ClipboardData = {
  readonly _tag: "ProofPadClipboard";
  readonly version: 1;
  readonly nodes: readonly CopiedNode[];
  readonly connections: readonly CopiedConnection[];
  /** コピーされたInferenceEdge（derivedノード用）。省略時は空配列として扱う。 */
  readonly inferenceEdges?: readonly InferenceEdge[];
  /** コピー元ワークスペースの証明スタイル。ペースト互換性チェックに使用。 */
  readonly sourceDeductionStyle?: DeductionStyle;
};

// --- コピー ---

/**
 * 選択ノードの中心座標を計算する。
 */
export function computeCentroid(nodes: readonly WorkspaceNode[]): Point {
  if (nodes.length === 0) return { x: 0, y: 0 };
  const sum = nodes.reduce(
    (acc, n) => ({ x: acc.x + n.position.x, y: acc.y + n.position.y }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / nodes.length, y: sum.y / nodes.length };
}

/**
 * 選択されたノードIDセットから、コピー用データを構築する。
 * 選択ノード間の接続のみを含める。
 * InferenceEdgeも、結論・前提が全て選択範囲内にあるもののみ含める。
 */
export function buildClipboardData(
  selectedNodeIds: ReadonlySet<string>,
  allNodes: readonly WorkspaceNode[],
  allConnections: readonly WorkspaceConnection[],
  allInferenceEdges: readonly InferenceEdge[] = [],
  sourceDeductionStyle?: DeductionStyle,
): ClipboardData {
  const selectedNodes = allNodes.filter((n) => selectedNodeIds.has(n.id));
  const centroid = computeCentroid(selectedNodes);

  const copiedNodes: readonly CopiedNode[] = selectedNodes.map((n) => ({
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
  const copiedConnections: readonly CopiedConnection[] = allConnections
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
  const copiedInferenceEdges = allInferenceEdges.filter((edge) => {
    if (!selectedNodeIds.has(edge.conclusionNodeId)) return false;
    const premiseIds = getInferenceEdgePremiseNodeIds(edge);
    return premiseIds.every((id) => selectedNodeIds.has(id));
  });

  return {
    _tag: "ProofPadClipboard",
    version: 1,
    nodes: copiedNodes,
    connections: copiedConnections,
    ...(copiedInferenceEdges.length > 0
      ? { inferenceEdges: copiedInferenceEdges }
      : {}),
    ...(sourceDeductionStyle !== undefined ? { sourceDeductionStyle } : {}),
  };
}

// --- シリアライズ/デシリアライズ ---

/**
 * ClipboardData を JSON 文字列にシリアライズする。
 */
export function serializeClipboardData(data: ClipboardData): string {
  return JSON.stringify(data);
}

/**
 * JSON 文字列を ClipboardData にデシリアライズする。
 * 不正なデータの場合は undefined を返す。
 */
export function deserializeClipboardData(
  json: string,
): ClipboardData | undefined {
  try {
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) return undefined;
    const obj = parsed as Record<string, unknown>;
    if (
      obj["_tag"] !== "ProofPadClipboard" ||
      obj["version"] !== 1 ||
      !Array.isArray(obj["nodes"]) ||
      !Array.isArray(obj["connections"])
    ) {
      return undefined;
    }
    return parsed as ClipboardData;
  } catch {
    return undefined;
  }
}

// --- ペースト ---

/**
 * ペースト結果。新しいノードと接続を返す。
 */
export type PasteResult = {
  /** ペーストで追加された新しいノード群 */
  readonly newNodes: readonly WorkspaceNode[];
  /** ペーストで追加された新しい接続群 */
  readonly newConnections: readonly WorkspaceConnection[];
  /** ペーストで追加された新しいInferenceEdge群 */
  readonly newInferenceEdges: readonly InferenceEdge[];
  /** 次のノードID番号 */
  readonly nextNodeId: number;
};

/**
 * ClipboardData からノードと接続を復元する。
 * 新しいIDを割り当て、指定位置を中心に配置する。
 *
 * @param data クリップボードデータ
 * @param targetCenter ペースト先の中心座標
 * @param startNodeId 新しいノードIDの開始番号
 */
export function pasteClipboardData(
  data: ClipboardData,
  targetCenter: Point,
  startNodeId: number,
): PasteResult {
  // 旧ID → 新IDのマッピング
  const idMap = new Map<string, string>();
  let currentNodeId = startNodeId;

  const newNodes: WorkspaceNode[] = data.nodes.map((copiedNode) => {
    const newId = `node-${String(currentNodeId) satisfies string}`;
    idMap.set(copiedNode.originalId, newId);
    currentNodeId++;

    return {
      id: newId,
      kind: copiedNode.kind,
      label: copiedNode.label,
      formulaText: copiedNode.formulaText,
      position: {
        x: targetCenter.x + copiedNode.relativePosition.x,
        y: targetCenter.y + copiedNode.relativePosition.y,
      },
      ...(copiedNode.role !== undefined ? { role: copiedNode.role } : {}),
      // protection は意図的に含めない
    };
  });

  const newConnections: WorkspaceConnection[] = data.connections
    .map((copiedConn) => {
      const fromId = idMap.get(copiedConn.fromOriginalNodeId);
      const toId = idMap.get(copiedConn.toOriginalNodeId);
      if (fromId === undefined || toId === undefined) return undefined;

      return {
        id: `conn-${fromId satisfies string}-${copiedConn.fromPortId satisfies string}-${toId satisfies string}-${copiedConn.toPortId satisfies string}`,
        fromNodeId: fromId,
        fromPortId: copiedConn.fromPortId,
        toNodeId: toId,
        toPortId: copiedConn.toPortId,
      };
    })
    .filter((c) => c !== undefined);

  // InferenceEdge のノードIDを新IDにマッピング
  const newInferenceEdges: InferenceEdge[] = (data.inferenceEdges ?? [])
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

// --- 選択操作の純粋関数 ---

/**
 * 選択状態にノードを追加する（トグル）。
 */
export function toggleNodeSelection(
  selectedNodeIds: ReadonlySet<string>,
  nodeId: string,
): ReadonlySet<string> {
  const next = new Set(selectedNodeIds);
  if (next.has(nodeId)) {
    next.delete(nodeId);
  } else {
    next.add(nodeId);
  }
  return next;
}

/**
 * 単一ノードを選択する（他の選択を解除）。
 */
export function selectSingleNode(nodeId: string): ReadonlySet<string> {
  return new Set([nodeId]);
}

/**
 * すべての選択を解除する。
 */
export function clearSelection(): ReadonlySet<string> {
  return new Set();
}

// --- ペースト互換性チェック ---

/**
 * InferenceEdgeからそのエッジが属する証明スタイルを推定する。
 */
export function getDeductionStyleForEdge(
  edge: InferenceEdge,
): DeductionStyle | undefined {
  if (isHilbertInferenceEdge(edge)) return "hilbert";
  if (isNdInferenceEdge(edge)) return "natural-deduction";
  if (isTabInferenceEdge(edge)) return "tableau-calculus";
  if (isAtInferenceEdge(edge)) return "analytic-tableau";
  /* v8 ignore start — 防御的コード: InferenceEdge union の全メンバーは上記で網羅済み。SCチェックのfalseパスは到達不能 */
  if (isScInferenceEdge(edge)) return "sequent-calculus";
  return undefined;
  /* v8 ignore stop */
}

/**
 * ペースト互換性エラーの型。
 */
export type PasteCompatibilityError = {
  readonly _tag: "IncompatibleStyle";
  readonly sourceStyle: DeductionStyle;
  readonly targetStyle: DeductionStyle;
};

/**
 * クリップボードデータとターゲットワークスペースの互換性をチェックする。
 *
 * - InferenceEdgeがない場合: 常に互換（ノードのみのペースト）
 * - sourceDeductionStyleが明示されている場合: targetと比較
 * - sourceDeductionStyleがない場合: InferenceEdgeから推定
 *
 * @returns undefined（互換）またはPasteCompatibilityError（非互換）
 */
export function checkPasteCompatibility(
  data: ClipboardData,
  targetStyle: DeductionStyle,
): PasteCompatibilityError | undefined {
  const edges = data.inferenceEdges ?? [];

  // InferenceEdgeがなければ常に互換（ノードのみのペースト）
  if (edges.length === 0) return undefined;

  // sourceDeductionStyleが明示されていればそれを使う
  if (data.sourceDeductionStyle !== undefined) {
    if (data.sourceDeductionStyle !== targetStyle) {
      return {
        _tag: "IncompatibleStyle",
        sourceStyle: data.sourceDeductionStyle,
        targetStyle,
      };
    }
    return undefined;
  }

  // sourceDeductionStyleがない場合はInferenceEdgeから推定
  for (const edge of edges) {
    const edgeStyle = getDeductionStyleForEdge(edge);
    if (edgeStyle !== undefined && edgeStyle !== targetStyle) {
      return {
        _tag: "IncompatibleStyle",
        sourceStyle: edgeStyle,
        targetStyle,
      };
    }
  }

  return undefined;
}
