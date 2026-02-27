/**
 * 証明ワークスペースの純粋な状態管理ロジック。
 *
 * ワークスペース上のノード（公理/MP/結論）の配置、接続、論理体系設定を管理する。
 * UIコンポーネント（ProofWorkspace.tsx）から利用される。
 *
 * 変更時は workspaceState.test.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import type { LogicSystem, AxiomId } from "../logic-core/inferenceRule";
import type { Point } from "../infinite-canvas/types";
import type { ProofNodeKind } from "./proofNodeUI";
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
  /** Gen規則で使用する量化変数名（genノードのみ） */
  readonly genVariableName?: string;
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
};

// --- 初期状態 ---

/** 空のワークスペースを作成する */
export function createEmptyWorkspace(system: LogicSystem): WorkspaceState {
  return {
    system,
    nodes: [],
    connections: [],
    nextNodeId: 1,
    mode: "free",
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
  return {
    ...state,
    nodes: [...state.nodes, newNode],
    nextNodeId: state.nextNodeId + 1,
  };
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
  return {
    ...state,
    nodes: state.nodes.map((node) =>
      node.id === nodeId ? { ...node, formulaText } : node,
    ),
  };
}

/** ノードのGen変数名を更新する */
export function updateNodeGenVariableName(
  state: WorkspaceState,
  nodeId: string,
  genVariableName: string,
): WorkspaceState {
  return {
    ...state,
    nodes: state.nodes.map((node) =>
      node.id === nodeId ? { ...node, genVariableName } : node,
    ),
  };
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
  return {
    ...state,
    nodes: state.nodes.filter((n) => n.id !== nodeId),
    connections: state.connections.filter(
      (c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId,
    ),
  };
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
  return {
    ...state,
    connections: [...state.connections, newConnection],
  };
}

/** 接続を削除する */
export function removeConnection(
  state: WorkspaceState,
  connectionId: string,
): WorkspaceState {
  return {
    ...state,
    connections: state.connections.filter((c) => c.id !== connectionId),
  };
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

// --- MP適用（ノード作成 + 接続 + 結論自動生成） ---

/** MP適用結果 */
export type ApplyMPResult = {
  readonly workspace: WorkspaceState;
  readonly mpNodeId: string;
  readonly validation: MPApplicationResult;
};

/**
 * 2つのソースノードを接続してMPノードを作成し、MP適用を検証する。
 *
 * @param state 現在のワークスペース状態
 * @param leftNodeId antecedent（φ）ノードのID
 * @param rightNodeId conditional（φ→ψ）ノードのID
 * @param position MPノードの配置位置
 * @returns 新しいワークスペース状態、MPノードID、検証結果
 */
export function applyMPAndConnect(
  state: WorkspaceState,
  leftNodeId: string,
  rightNodeId: string,
  position: Point,
): ApplyMPResult {
  // MPノードを追加
  let ws = addNode(state, "mp", "MP", position);
  const mpNodeId = `node-${String(state.nextNodeId) satisfies string}`;

  // 接続を追加（left → premise-left, right → premise-right）
  ws = addConnection(ws, leftNodeId, "out", mpNodeId, "premise-left");
  ws = addConnection(ws, rightNodeId, "out", mpNodeId, "premise-right");

  // MP適用を検証
  const validation = validateMPApplication(ws, mpNodeId);

  // 成功時は結論テキストをMPノードに設定
  if (validation._tag === "Success") {
    ws = updateNodeFormulaText(ws, mpNodeId, validation.conclusionText);
  }

  return { workspace: ws, mpNodeId, validation };
}

// --- Gen適用（ノード作成 + 接続 + 結論自動生成） ---

/** Gen適用結果 */
export type ApplyGenResult = {
  readonly workspace: WorkspaceState;
  readonly genNodeId: string;
  readonly validation: GenApplicationResult;
};

/**
 * ソースノードを接続してGenノードを作成し、Gen適用を検証する。
 *
 * @param state 現在のワークスペース状態
 * @param premiseNodeId 前提（φ）ノードのID
 * @param variableName 量化する変数名
 * @param position Genノードの配置位置
 * @returns 新しいワークスペース状態、GenノードID、検証結果
 */
export function applyGenAndConnect(
  state: WorkspaceState,
  premiseNodeId: string,
  variableName: string,
  position: Point,
): ApplyGenResult {
  // Genノードを追加
  let ws = addNode(state, "gen", "Gen", position);
  const genNodeId = `node-${String(state.nextNodeId) satisfies string}`;

  // Gen変数名を設定
  ws = updateNodeGenVariableName(ws, genNodeId, variableName);

  // 接続を追加（premise → premise）
  ws = addConnection(ws, premiseNodeId, "out", genNodeId, "premise");

  // Gen適用を検証
  const validation = validateGenApplication(ws, genNodeId, variableName);

  // 成功時は結論テキストをGenノードに設定
  if (validation._tag === "Success") {
    ws = updateNodeFormulaText(ws, genNodeId, validation.conclusionText);
  }

  return { workspace: ws, genNodeId, validation };
}

// --- コピー＆ペースト ---

/**
 * 選択されたノードをコピーしてClipboardDataを構築する。
 */
export function copySelectedNodes(
  state: WorkspaceState,
  selectedNodeIds: ReadonlySet<string>,
): ClipboardData {
  return buildClipboardData(selectedNodeIds, state.nodes, state.connections);
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
  return {
    ...state,
    nodes: [...state.nodes, ...result.newNodes],
    connections: [...state.connections, ...result.newConnections],
    nextNodeId: result.nextNodeId,
  };
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

  return {
    ...state,
    nodes: state.nodes.filter((n) => !removableIds.has(n.id)),
    connections: state.connections.filter(
      (c) => !removableIds.has(c.fromNodeId) && !removableIds.has(c.toNodeId),
    ),
  };
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
  const newNodeIds = new Set(result.newNodes.map((n) => n.id));
  return {
    workspace: {
      ...state,
      nodes: [...state.nodes, ...result.newNodes],
      connections: [...state.connections, ...result.newConnections],
      nextNodeId: result.nextNodeId,
    },
    newNodeIds,
  };
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
 * 全MP/Genノードの結論テキストを前提ノードの現在の値から再計算する。
 *
 * 検証成功時は結論テキストをformulaTextに設定し、
 * 失敗時はformulaTextを空文字にクリアする。
 * 前提の変更が下流のMP/Genノードに伝播するよう、
 * 変更がなくなるまで反復する（fixed-point）。
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

    const newNodes = current.nodes.map((node) => {
      if (node.kind === "mp") {
        const result = validateMPApplication(current, node.id);
        const newText =
          result._tag === "Success" ? result.conclusionText : "";
        if (newText !== node.formulaText) {
          changed = true;
          return { ...node, formulaText: newText };
        }
        return node;
      }
      if (node.kind === "gen") {
        const variableName = node.genVariableName ?? "";
        const result = validateGenApplication(
          current,
          node.id,
          variableName,
        );
        const newText =
          result._tag === "Success" ? result.conclusionText : "";
        if (newText !== node.formulaText) {
          changed = true;
          return { ...node, formulaText: newText };
        }
        return node;
      }
      return node;
    });

    if (!changed) break;
    current = { ...current, nodes: newNodes };
  }

  return current;
}
