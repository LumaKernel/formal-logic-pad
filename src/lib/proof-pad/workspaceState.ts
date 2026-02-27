/**
 * 証明ワークスペースの純粋な状態管理ロジック。
 *
 * ワークスペース上のノード（公理/導出/結論）の配置、接続、論理体系設定を管理する。
 * 推論規則（MP/Gen/Substitution）はInferenceEdgeで管理される。
 * UIコンポーネント（ProofWorkspace.tsx）から利用される。
 *
 * 変更時は workspaceState.test.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import type { LogicSystem, AxiomId } from "../logic-core/inferenceRule";
import type { Point } from "../infinite-canvas/types";
import type { ProofNodeKind } from "./proofNodeUI";
import type { InferenceEdge } from "./inferenceEdge";
import type { NodeRole } from "./nodeRoleLogic";
import {
  validateMPApplication,
  type MPApplicationResult,
} from "./mpApplicationLogic";
import {
  validateGenApplication,
  type GenApplicationResult,
} from "./genApplicationLogic";
import {
  validateSubstitutionApplication,
  type SubstitutionApplicationResult,
  type SubstitutionEntries,
} from "./substitutionApplicationLogic";
import {
  buildClipboardData,
  computeCentroid,
  pasteClipboardData,
  type ClipboardData,
} from "./copyPasteLogic";
import {
  computeTreeLayout,
  computeLayoutDiff,
  type LayoutConfig,
  type LayoutDirection,
} from "./treeLayoutLogic";
import type { Size } from "../infinite-canvas/types";

// --- ワークスペースモード ---

/**
 * ワークスペースのモード。
 * - "free": 自由帳モード（すべてのノードが編集・削除可能）
 * - "quest": クエストモード（保護されたゴールノードが存在し、編集・削除不可）
 */
export type WorkspaceMode = "free" | "quest";

// --- ノード保護 ---

/**
 * ノードの保護状態。
 * - "quest-goal": クエストモードのゴールノード（編集・削除不可）
 * - undefined: 保護なし（通常ノード）
 */
export type NodeProtection = "quest-goal";

// --- ワークスペースノード ---

/** ワークスペース上の証明ノード */
export type WorkspaceNode = {
  readonly id: string;
  readonly kind: ProofNodeKind;
  readonly label: string;
  readonly formulaText: string;
  readonly position: Point;
  /** Gen規則で使用する量化変数名（InferenceEdge経由で管理、後方互換用に保持） */
  readonly genVariableName?: string;
  /** 代入操作のエントリリスト（InferenceEdge経由で管理、後方互換用に保持） */
  readonly substitutionEntries?: SubstitutionEntries;
  /** ユーザーが明示的に設定した役割（"axiom" | "goal" | undefined） */
  readonly role?: NodeRole;
  /** ノードの保護状態（クエストモードのゴールノードなど） */
  readonly protection?: NodeProtection;
  /**
   * このゴールノードを達成するために使ってよい公理スキーマIDのリスト。
   * ゴールノード（protection: "quest-goal"）でのみ使用。
   * undefined の場合はシステムの全公理を許可する。
   */
  readonly allowedAxiomIds?: readonly AxiomId[];
};

/** ワークスペース上の接続（ポートベース） */
export type WorkspaceConnection = {
  readonly id: string;
  readonly fromNodeId: string;
  readonly fromPortId: string;
  readonly toNodeId: string;
  readonly toPortId: string;
};

/** ワークスペースの状態 */
export type WorkspaceState = {
  readonly system: LogicSystem;
  readonly nodes: readonly WorkspaceNode[];
  readonly connections: readonly WorkspaceConnection[];
  readonly nextNodeId: number;
  /** ワークスペースのモード（デフォルト: "free"） */
  readonly mode: WorkspaceMode;
  /**
   * 推論エッジ（source of truth）。
   * ノード/接続変更時に自動的に再構築される。
   * derivedノードの推論情報はInferenceEdgeに直接保持される。
   */
  readonly inferenceEdges: readonly InferenceEdge[];
};

// --- 推論エッジ同期 ---

/**
 * ワークスペース状態のinferenceEdgesを現在のノード・接続から再構築する。
 * ノードや接続を変更した後に呼ぶ。
 *
 * 結論ノードが存在するInferenceEdgeのみ保持し、
 * conclusionTextをノードのformulaTextと同期する。
 */
function syncInferenceEdges(state: WorkspaceState): WorkspaceState {
  // ノードIDとformulaTextのマップを構築
  const nodeMap = new Map(state.nodes.map((n) => [n.id, n]));

  // InferenceEdge を保持（結論ノードが存在するもののみ）
  // conclusionText をノードの formulaText と同期する
  const edges = state.inferenceEdges
    .filter((edge) => {
      const conclusionNode = nodeMap.get(edge.conclusionNodeId);
      // 結論ノードが存在しない場合は削除
      return conclusionNode !== undefined;
    })
    .map((edge) => {
      // conclusionText をノードの formulaText と同期
      const conclusionNode = nodeMap.get(edge.conclusionNodeId);
      const currentText = conclusionNode?.formulaText ?? "";
      if (currentText !== edge.conclusionText) {
        return { ...edge, conclusionText: currentText };
      }
      return edge;
    });

  return {
    ...state,
    inferenceEdges: edges,
  };
}

/**
 * ワークスペースのinferenceEdgesを取得する。
 */
export function getInferenceEdges(
  state: WorkspaceState,
): readonly InferenceEdge[] {
  return state.inferenceEdges;
}

/**
 * 推論エッジを直接追加する。
 * derivedノードの推論情報をInferenceEdgeとして管理する。
 */
function addInferenceEdge(
  state: WorkspaceState,
  edge: InferenceEdge,
): WorkspaceState {
  return {
    ...state,
    inferenceEdges: [...state.inferenceEdges, edge],
  };
}

// --- 初期状態 ---

/** 空のワークスペースを作成する */
export function createEmptyWorkspace(system: LogicSystem): WorkspaceState {
  return {
    system,
    nodes: [],
    connections: [],
    nextNodeId: 1,
    mode: "free",
    inferenceEdges: [],
  };
}

/** クエスト用ゴールノードの定義 */
export type QuestGoalDefinition = {
  /** ゴール式のDSLテキスト */
  readonly formulaText: string;
  /** 表示ラベル（省略時はデフォルト） */
  readonly label?: string;
  /** 配置位置 */
  readonly position: Point;
  /**
   * このゴールを達成するために使ってよい公理スキーマIDのリスト。
   * undefined の場合はシステムの全公理を許可する。
   */
  readonly allowedAxiomIds?: readonly AxiomId[];
};

/**
 * クエストモードのワークスペースを作成する。
 * ゴール定義から保護されたゴールノードを自動生成する。
 */
export function createQuestWorkspace(
  system: LogicSystem,
  goals: readonly QuestGoalDefinition[],
): WorkspaceState {
  let state: WorkspaceState = {
    system,
    nodes: [],
    connections: [],
    nextNodeId: 1,
    mode: "quest",
    inferenceEdges: [],
  };

  for (const goal of goals) {
    const id = `node-${String(state.nextNodeId) satisfies string}`;
    const newNode: WorkspaceNode = {
      id,
      kind: "axiom",
      label: goal.label ?? "Quest Goal",
      formulaText: goal.formulaText,
      position: goal.position,
      role: "goal",
      protection: "quest-goal",
      allowedAxiomIds: goal.allowedAxiomIds,
    };
    state = {
      ...state,
      nodes: [...state.nodes, newNode],
      nextNodeId: state.nextNodeId + 1,
    };
  }

  return state;
}

/**
 * クエストモードから自由帳モードに変換する。
 * 保護されたノードの保護状態を解除する。
 */
export function convertToFreeMode(state: WorkspaceState): WorkspaceState {
  if (state.mode === "free") return state;
  return {
    ...state,
    mode: "free",
    nodes: state.nodes.map((node) =>
      node.protection !== undefined ? { ...node, protection: undefined } : node,
    ),
  };
}

/**
 * ノードが保護されているかを判定する。
 * クエストモードで protection が設定されているノードは保護される。
 */
export function isNodeProtected(
  state: WorkspaceState,
  nodeId: string,
): boolean {
  if (state.mode === "free") return false;
  const node = state.nodes.find((n) => n.id === nodeId);
  return node?.protection !== undefined;
}

// --- ノード操作 ---

/** ノードを追加する */
export function addNode(
  state: WorkspaceState,
  kind: ProofNodeKind,
  label: string,
  position: Point,
  formulaText?: string,
): WorkspaceState {
  const id = `node-${String(state.nextNodeId) satisfies string}`;
  const newNode: WorkspaceNode = {
    id,
    kind,
    label,
    formulaText: formulaText ?? "",
    position,
  };
  return syncInferenceEdges({
    ...state,
    nodes: [...state.nodes, newNode],
    nextNodeId: state.nextNodeId + 1,
  });
}

/** ノードの位置を更新する */
export function updateNodePosition(
  state: WorkspaceState,
  nodeId: string,
  position: Point,
): WorkspaceState {
  return {
    ...state,
    nodes: state.nodes.map((node) =>
      node.id === nodeId ? { ...node, position } : node,
    ),
  };
}

/** ノードの論理式テキストを更新する（保護ノードは更新不可） */
export function updateNodeFormulaText(
  state: WorkspaceState,
  nodeId: string,
  formulaText: string,
): WorkspaceState {
  if (isNodeProtected(state, nodeId)) return state;
  return syncInferenceEdges({
    ...state,
    nodes: state.nodes.map((node) =>
      node.id === nodeId ? { ...node, formulaText } : node,
    ),
  });
}

/** ノードのGen変数名を更新する */
export function updateNodeGenVariableName(
  state: WorkspaceState,
  nodeId: string,
  genVariableName: string,
): WorkspaceState {
  return syncInferenceEdges({
    ...state,
    nodes: state.nodes.map((node) =>
      node.id === nodeId ? { ...node, genVariableName } : node,
    ),
  });
}

/** ノードの代入エントリを更新する */
export function updateNodeSubstitutionEntries(
  state: WorkspaceState,
  nodeId: string,
  substitutionEntries: SubstitutionEntries,
): WorkspaceState {
  return syncInferenceEdges({
    ...state,
    nodes: state.nodes.map((node) =>
      node.id === nodeId ? { ...node, substitutionEntries } : node,
    ),
  });
}

/**
 * GenEdgeの量化変数名を直接更新する。
 * エッジのvariableNameを変更し、結論テキストを再計算する。
 *
 * @param state 現在のワークスペース状態
 * @param conclusionNodeId Gen結論ノードのID
 * @param variableName 新しい量化変数名
 */
export function updateInferenceEdgeGenVariableName(
  state: WorkspaceState,
  conclusionNodeId: string,
  variableName: string,
): WorkspaceState {
  const updated = {
    ...state,
    inferenceEdges: state.inferenceEdges.map((edge) =>
      edge._tag === "gen" && edge.conclusionNodeId === conclusionNodeId
        ? { ...edge, variableName }
        : edge,
    ),
  };
  return revalidateInferenceConclusions(updated);
}

/**
 * SubstitutionEdgeの代入エントリを直接更新する。
 * エッジのentriesを変更し、結論テキストを再計算する。
 *
 * @param state 現在のワークスペース状態
 * @param conclusionNodeId Substitution結論ノードのID
 * @param entries 新しい代入エントリリスト
 */
export function updateInferenceEdgeSubstitutionEntries(
  state: WorkspaceState,
  conclusionNodeId: string,
  entries: SubstitutionEntries,
): WorkspaceState {
  const updated = {
    ...state,
    inferenceEdges: state.inferenceEdges.map((edge) =>
      edge._tag === "substitution" && edge.conclusionNodeId === conclusionNodeId
        ? { ...edge, entries }
        : edge,
    ),
  };
  return revalidateInferenceConclusions(updated);
}

/** ノードの役割を更新する（保護ノードは更新不可） */
export function updateNodeRole(
  state: WorkspaceState,
  nodeId: string,
  role: NodeRole | undefined,
): WorkspaceState {
  if (isNodeProtected(state, nodeId)) return state;
  return {
    ...state,
    nodes: state.nodes.map((node) =>
      node.id === nodeId ? { ...node, role } : node,
    ),
  };
}

/** ノードをIDで検索する */
export function findNode(
  state: WorkspaceState,
  nodeId: string,
): WorkspaceNode | undefined {
  return state.nodes.find((n) => n.id === nodeId);
}

/** ノードを削除する（関連する接続も削除）。保護ノードは削除不可。 */
export function removeNode(
  state: WorkspaceState,
  nodeId: string,
): WorkspaceState {
  if (isNodeProtected(state, nodeId)) return state;
  return syncInferenceEdges({
    ...state,
    nodes: state.nodes.filter((n) => n.id !== nodeId),
    connections: state.connections.filter(
      (c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId,
    ),
  });
}

// --- 接続操作 ---

/** 接続を追加する */
export function addConnection(
  state: WorkspaceState,
  fromNodeId: string,
  fromPortId: string,
  toNodeId: string,
  toPortId: string,
): WorkspaceState {
  const id = `conn-${fromNodeId satisfies string}-${fromPortId satisfies string}-${toNodeId satisfies string}-${toPortId satisfies string}`;
  const newConnection: WorkspaceConnection = {
    id,
    fromNodeId,
    fromPortId,
    toNodeId,
    toPortId,
  };
  return syncInferenceEdges({
    ...state,
    connections: [...state.connections, newConnection],
  });
}

/** 接続を削除する */
export function removeConnection(
  state: WorkspaceState,
  connectionId: string,
): WorkspaceState {
  return syncInferenceEdges({
    ...state,
    connections: state.connections.filter((c) => c.id !== connectionId),
  });
}

// --- 体系変更 ---

/** 論理体系を変更する */
export function changeSystem(
  state: WorkspaceState,
  system: LogicSystem,
): WorkspaceState {
  return {
    ...state,
    system,
  };
}

// --- MP適用（ノード作成 + InferenceEdge + 結論自動生成） ---

/** MP適用結果 */
export type ApplyMPResult = {
  readonly workspace: WorkspaceState;
  readonly mpNodeId: string;
  readonly validation: MPApplicationResult;
};

/**
 * 2つのソースノードからMP適用を行い、derived結論ノードを作成する。
 * InferenceEdge（MPEdge）を追加し、前提→結論の関係を管理する。
 *
 * @param state 現在のワークスペース状態
 * @param leftNodeId antecedent（φ）ノードのID
 * @param rightNodeId conditional（φ→ψ）ノードのID
 * @param position 結論ノードの配置位置
 * @returns 新しいワークスペース状態、結論ノードID、検証結果
 */
export function applyMPAndConnect(
  state: WorkspaceState,
  leftNodeId: string,
  rightNodeId: string,
  position: Point,
): ApplyMPResult {
  // derived結論ノードを追加
  let ws = addNode(state, "derived", "MP", position);
  const mpNodeId = `node-${String(state.nextNodeId) satisfies string}`;

  // MPEdge を追加（InferenceEdge として直接管理）
  const mpEdge: InferenceEdge = {
    _tag: "mp",
    conclusionNodeId: mpNodeId,
    leftPremiseNodeId: leftNodeId,
    rightPremiseNodeId: rightNodeId,
    conclusionText: "",
  };
  ws = addInferenceEdge(ws, mpEdge);

  // 互換性: レガシーの接続も追加（依存関係追跡・UI等で利用される）
  ws = addConnection(ws, leftNodeId, "out", mpNodeId, "premise-left");
  ws = addConnection(ws, rightNodeId, "out", mpNodeId, "premise-right");

  // MP適用を検証
  const validation = validateMPApplication(ws, mpNodeId);

  // 成功時は結論テキストをderivedノードに設定
  if (validation._tag === "Success") {
    ws = updateNodeFormulaText(ws, mpNodeId, validation.conclusionText);
  }

  return { workspace: ws, mpNodeId, validation };
}

// --- Gen適用（ノード作成 + InferenceEdge + 結論自動生成） ---

/** Gen適用結果 */
export type ApplyGenResult = {
  readonly workspace: WorkspaceState;
  readonly genNodeId: string;
  readonly validation: GenApplicationResult;
};

/**
 * ソースノードからGen適用を行い、derived結論ノードを作成する。
 * InferenceEdge（GenEdge）を追加し、前提→結論の関係を管理する。
 *
 * @param state 現在のワークスペース状態
 * @param premiseNodeId 前提（φ）ノードのID
 * @param variableName 量化する変数名
 * @param position 結論ノードの配置位置
 * @returns 新しいワークスペース状態、結論ノードID、検証結果
 */
export function applyGenAndConnect(
  state: WorkspaceState,
  premiseNodeId: string,
  variableName: string,
  position: Point,
): ApplyGenResult {
  // derived結論ノードを追加
  let ws = addNode(state, "derived", "Gen", position);
  const genNodeId = `node-${String(state.nextNodeId) satisfies string}`;

  // GenEdge を追加（InferenceEdge として直接管理）
  const genEdge: InferenceEdge = {
    _tag: "gen",
    conclusionNodeId: genNodeId,
    premiseNodeId,
    variableName,
    conclusionText: "",
  };
  ws = addInferenceEdge(ws, genEdge);

  // 互換性: レガシーの接続も追加（依存関係追跡・UI等で利用される）
  ws = addConnection(ws, premiseNodeId, "out", genNodeId, "premise");

  // Gen適用を検証
  const validation = validateGenApplication(ws, genNodeId, variableName);

  // 成功時は結論テキストをderivedノードに設定
  if (validation._tag === "Success") {
    ws = updateNodeFormulaText(ws, genNodeId, validation.conclusionText);
  }

  return { workspace: ws, genNodeId, validation };
}

// --- 代入操作適用（ノード作成 + InferenceEdge + 結論自動生成） ---

/** 代入操作適用結果 */
export type ApplySubstitutionResult = {
  readonly workspace: WorkspaceState;
  readonly substitutionNodeId: string;
  readonly validation: SubstitutionApplicationResult;
};

/**
 * ソースノードから代入適用を行い、derived結論ノードを作成する。
 * InferenceEdge（SubstitutionEdge）を追加し、前提→結論の関係を管理する。
 *
 * @param state 現在のワークスペース状態
 * @param premiseNodeId 前提（公理スキーマ等）ノードのID
 * @param entries 代入エントリのリスト
 * @param position 結論ノードの配置位置
 * @returns 新しいワークスペース状態、結論ノードID、検証結果
 */
export function applySubstitutionAndConnect(
  state: WorkspaceState,
  premiseNodeId: string,
  entries: SubstitutionEntries,
  position: Point,
): ApplySubstitutionResult {
  // derived結論ノードを追加
  let ws = addNode(state, "derived", "Subst", position);
  const substitutionNodeId = `node-${String(state.nextNodeId) satisfies string}`;

  // SubstitutionEdge を追加（InferenceEdge として直接管理）
  const substEdge: InferenceEdge = {
    _tag: "substitution",
    conclusionNodeId: substitutionNodeId,
    premiseNodeId,
    entries,
    conclusionText: "",
  };
  ws = addInferenceEdge(ws, substEdge);

  // 互換性: レガシーの接続も追加（依存関係追跡・UI等で利用される）
  ws = addConnection(ws, premiseNodeId, "out", substitutionNodeId, "premise");

  // 代入適用を検証
  const validation = validateSubstitutionApplication(
    ws,
    substitutionNodeId,
    entries,
  );

  // 成功時は結論テキストをderivedノードに設定
  if (validation._tag === "Success") {
    ws = updateNodeFormulaText(
      ws,
      substitutionNodeId,
      validation.conclusionText,
    );
  }

  return { workspace: ws, substitutionNodeId, validation };
}

// --- コピー＆ペースト ---

/**
 * 選択されたノードをコピーしてClipboardDataを構築する。
 */
export function copySelectedNodes(
  state: WorkspaceState,
  selectedNodeIds: ReadonlySet<string>,
): ClipboardData {
  return buildClipboardData(
    selectedNodeIds,
    state.nodes,
    state.connections,
    state.inferenceEdges,
  );
}

/**
 * ClipboardDataからノードと接続をワークスペースにペーストする。
 * 新しいIDを割り当て、指定位置を中心に配置する。
 */
export function pasteNodes(
  state: WorkspaceState,
  clipboardData: ClipboardData,
  targetCenter: Point,
): WorkspaceState {
  const result = pasteClipboardData(
    clipboardData,
    targetCenter,
    state.nextNodeId,
  );
  return syncInferenceEdges({
    ...state,
    nodes: [...state.nodes, ...result.newNodes],
    connections: [...state.connections, ...result.newConnections],
    inferenceEdges: [...state.inferenceEdges, ...result.newInferenceEdges],
    nextNodeId: result.nextNodeId,
  });
}

/**
 * 選択されたノードを削除する（保護ノードはスキップ）。
 * 関連する接続も自動的に削除される。
 */
export function removeSelectedNodes(
  state: WorkspaceState,
  selectedNodeIds: ReadonlySet<string>,
): WorkspaceState {
  // 保護ノードを除外
  const removableIds = new Set(
    [...selectedNodeIds].filter((id) => !isNodeProtected(state, id)),
  );
  if (removableIds.size === 0) return state;

  return syncInferenceEdges({
    ...state,
    nodes: state.nodes.filter((n) => !removableIds.has(n.id)),
    connections: state.connections.filter(
      (c) => !removableIds.has(c.fromNodeId) && !removableIds.has(c.toNodeId),
    ),
  });
}

// --- 複製＆カット ---

/** 複製のオフセット量（ピクセル） */
const DUPLICATE_OFFSET = 30;

/**
 * 選択されたノードを複製する（コピー＋即ペースト、オフセット付き）。
 * 複製されたノードの新しいIDセットも返す。
 */
export type DuplicateResult = {
  readonly workspace: WorkspaceState;
  readonly newNodeIds: ReadonlySet<string>;
};

/**
 * 複製されたノードからゴールroleを除去する。
 * ゴールが複製されまくるのを防ぐため、複製先は通常の中間定理になる。
 */
function stripGoalRole(node: WorkspaceNode): WorkspaceNode {
  if (node.role === "goal") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { role: _removed, ...rest } = node;
    return rest;
  }
  return node;
}

export function duplicateSelectedNodes(
  state: WorkspaceState,
  selectedNodeIds: ReadonlySet<string>,
): DuplicateResult {
  if (selectedNodeIds.size === 0) {
    return { workspace: state, newNodeIds: new Set() };
  }
  const clipboardData = copySelectedNodes(state, selectedNodeIds);
  if (clipboardData.nodes.length === 0) {
    return { workspace: state, newNodeIds: new Set() };
  }
  // 選択ノードの中心を計算し、オフセットして配置
  const selectedNodes = state.nodes.filter((n) => selectedNodeIds.has(n.id));
  const centroid = computeCentroid(selectedNodes);
  const targetCenter: Point = {
    x: centroid.x + DUPLICATE_OFFSET,
    y: centroid.y + DUPLICATE_OFFSET,
  };
  const result = pasteClipboardData(
    clipboardData,
    targetCenter,
    state.nextNodeId,
  );
  // ゴールroleを除去（複製されたゴールは通常の中間定理になる）
  const strippedNodes = result.newNodes.map(stripGoalRole);
  const newNodeIds = new Set(strippedNodes.map((n) => n.id));
  return {
    workspace: syncInferenceEdges({
      ...state,
      nodes: [...state.nodes, ...strippedNodes],
      connections: [...state.connections, ...result.newConnections],
      nextNodeId: result.nextNodeId,
    }),
    newNodeIds,
  };
}

/**
 * 単一ノードを複製する（コンテキストメニュー用）。
 * ゴールノードは通常の中間定理として複製される。
 */
export function duplicateNode(
  state: WorkspaceState,
  nodeId: string,
): DuplicateResult {
  return duplicateSelectedNodes(state, new Set([nodeId]));
}

/**
 * 選択されたノードをカットする（コピー＋削除）。
 * ClipboardDataを返す（UIでクリップボードに格納するため）。
 */
export type CutResult = {
  readonly workspace: WorkspaceState;
  readonly clipboardData: ClipboardData;
};

export function cutSelectedNodes(
  state: WorkspaceState,
  selectedNodeIds: ReadonlySet<string>,
): CutResult {
  const clipboardData = copySelectedNodes(state, selectedNodeIds);
  const newState = removeSelectedNodes(state, selectedNodeIds);
  return {
    workspace: newState,
    clipboardData,
  };
}

// --- ツリー自動レイアウト ---

/** デフォルトのノードサイズ（実測値が不明な場合） */
const DEFAULT_NODE_SIZE: Size = { width: 180, height: 60 };

/** ワークスペースにツリー自動レイアウトを適用する。
 *
 *  ノードとコネクションからツリー構造を抽出し、各ノードの位置を再計算する。
 *  nodeSizes マップで実際のノードサイズを渡すと、より正確なレイアウトになる。
 *
 *  純粋関数 — 副作用なし。 */
export function applyTreeLayout(
  state: WorkspaceState,
  direction: LayoutDirection,
  nodeSizes?: ReadonlyMap<string, Size>,
  config?: Partial<LayoutConfig>,
): WorkspaceState {
  const layoutNodes = state.nodes.map((node) => ({
    id: node.id,
    size: nodeSizes?.get(node.id) ?? DEFAULT_NODE_SIZE,
  }));

  const layoutEdges = state.connections.map((conn) => ({
    fromNodeId: conn.fromNodeId,
    toNodeId: conn.toNodeId,
  }));

  const layoutConfig: LayoutConfig = {
    horizontalGap: config?.horizontalGap ?? 40,
    verticalGap: config?.verticalGap ?? 80,
    direction,
  };

  const positions = computeTreeLayout(layoutNodes, layoutEdges, layoutConfig);

  return {
    ...state,
    nodes: state.nodes.map((node) => {
      const newPos = positions.get(node.id);
      return newPos !== undefined ? { ...node, position: newPos } : node;
    }),
  };
}

/** ワークスペースにインクリメンタルなツリー自動レイアウトを適用する。
 *
 *  現在の位置と理想レイアウトとの差分（`computeLayoutDiff`）を計算し、
 *  閾値以上移動するノードのみ位置を更新する。
 *  ノード追加/削除時に手動配置を大きく崩さず再整列するためのもの。
 *
 *  純粋関数 — 副作用なし。 */
export function applyIncrementalLayout(
  state: WorkspaceState,
  direction: LayoutDirection,
  nodeSizes?: ReadonlyMap<string, Size>,
  config?: Partial<LayoutConfig>,
  threshold?: number,
): WorkspaceState {
  const layoutNodes = state.nodes.map((node) => ({
    id: node.id,
    size: nodeSizes?.get(node.id) ?? DEFAULT_NODE_SIZE,
  }));

  const layoutEdges = state.connections.map((conn) => ({
    fromNodeId: conn.fromNodeId,
    toNodeId: conn.toNodeId,
  }));

  const layoutConfig: LayoutConfig = {
    horizontalGap: config?.horizontalGap ?? 40,
    verticalGap: config?.verticalGap ?? 80,
    direction,
  };

  const currentPositions = new Map(
    state.nodes.map((node) => [node.id, node.position]),
  );

  const diff = computeLayoutDiff(
    layoutNodes,
    layoutEdges,
    currentPositions,
    layoutConfig,
    threshold,
  );

  if (diff.size === 0) return state;

  return {
    ...state,
    nodes: state.nodes.map((node) => {
      const newPos = diff.get(node.id);
      return newPos !== undefined ? { ...node, position: newPos } : node;
    }),
  };
}

// --- 推論結論の再検証・再計算 ---

/**
 * 推論エッジに関連する結論ノードのformulaTextを再計算する。
 *
 * InferenceEdge（source of truth）を走査し、各結論ノードを再検証する。
 *
 * 検証成功時は結論テキストをformulaTextに設定し、
 * 失敗時はformulaTextを空文字にクリアする。
 * 前提の変更が下流に伝播するよう、変更がなくなるまで反復する（fixed-point）。
 *
 * 純粋関数 — 副作用なし。
 *
 * 変更時は workspaceState.test.ts も同期すること。
 */
export function revalidateInferenceConclusions(
  state: WorkspaceState,
): WorkspaceState {
  const MAX_ITERATIONS = state.nodes.length + 1;
  let current = state;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let changed = false;

    // InferenceEdge から結論ノードIDとエッジ情報のマップを構築
    const edgeByConclusion = new Map<string, InferenceEdge>();
    for (const edge of current.inferenceEdges) {
      edgeByConclusion.set(edge.conclusionNodeId, edge);
    }

    const newNodes = current.nodes.map((node) => {
      const edge = edgeByConclusion.get(node.id);
      if (!edge) return node;

      switch (edge._tag) {
        case "mp": {
          const result = validateMPApplication(current, node.id);
          const newText =
            result._tag === "Success" ? result.conclusionText : "";
          if (newText !== node.formulaText) {
            changed = true;
            return { ...node, formulaText: newText };
          }
          return node;
        }
        case "gen": {
          const variableName = edge.variableName;
          const result = validateGenApplication(current, node.id, variableName);
          const newText =
            result._tag === "Success" ? result.conclusionText : "";
          if (newText !== node.formulaText) {
            changed = true;
            return { ...node, formulaText: newText };
          }
          return node;
        }
        case "substitution": {
          const entries = edge.entries;
          const result = validateSubstitutionApplication(
            current,
            node.id,
            entries,
          );
          const newText =
            result._tag === "Success" ? result.conclusionText : "";
          if (newText !== node.formulaText) {
            changed = true;
            return { ...node, formulaText: newText };
          }
          return node;
        }
      }
    });

    if (!changed) break;
    current = { ...current, nodes: newNodes };
  }

  // ノード変更があった場合のみエッジを再構築
  if (current === state) return state;
  return syncInferenceEdges(current);
}
