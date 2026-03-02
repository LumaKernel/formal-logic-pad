/**
 * 証明ワークスペースの純粋な状態管理ロジック。
 *
 * ワークスペース上のノード（公理/導出/結論）の配置、接続、論理体系設定を管理する。
 * 推論規則（MP/Gen/Substitution/ND規則）はInferenceEdgeで管理される。
 * UIコンポーネント（ProofWorkspace.tsx）から利用される。
 *
 * 変更時は workspaceState.test.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import type { LogicSystem, AxiomId } from "../logic-core/inferenceRule";
import {
  type DeductionSystem,
  hilbertDeduction,
} from "../logic-core/deductionSystem";
import type { Point } from "../infinite-canvas/types";
import { type ProofNodeKind, getProofNodeKindLabel } from "./proofNodeUI";
import type { InferenceEdge } from "./inferenceEdge";
import {
  isHilbertInferenceEdge,
  isNdInferenceEdge,
  isTabInferenceEdge,
  isAtInferenceEdge,
  isScInferenceEdge,
} from "./inferenceEdge";
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
import { validateNdApplication } from "./ndApplicationLogic";
import {
  validateTabApplication,
  createTabEdgeFromResult,
  type TabRuleApplicationParams,
  type TabApplicationResult,
} from "./tabApplicationLogic";
import {
  validateAtApplication,
  createAtEdgeFromResult,
  type AtRuleApplicationParams,
  type AtApplicationResult,
} from "./atApplicationLogic";
import {
  validateScApplication,
  createScEdgeFromResult,
  type ScRuleApplicationParams,
  type ScApplicationResult,
} from "./scApplicationLogic";
import { Either } from "effect";
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
import {
  mergeNodes as mergeNodesLogic,
  type MergeError,
} from "./mergeNodesLogic";

// --- ノードの明示的な役割マーク ---

/**
 * ユーザーが明示的に設定するノードの役割。
 * - "axiom": 公理としてマーク（証明不要であることを宣言）
 * - undefined: 自動判定（デフォルト、ルートノードは暗黙的に公理）
 *
 * ゴールはノードのroleではなくWorkspaceState.goalsで管理される。
 */
export type NodeRole = "axiom";

// --- ワークスペースゴール ---

/**
 * ワークスペース上のゴール（証明すべき目標）。
 * ノードとは独立したデータとしてWorkspaceState.goalsで管理される。
 * キャンバス上のどこかのノードの式がゴール式と一致すれば達成。
 */
export type WorkspaceGoal = {
  /** ゴールの一意ID */
  readonly id: string;
  /** ゴール式のDSLテキスト */
  readonly formulaText: string;
  /** 表示ラベル */
  readonly label?: string;
  /**
   * このゴールを達成するために使ってよい公理スキーマIDのリスト。
   * undefined の場合はシステムの全公理を許可する。
   */
  readonly allowedAxiomIds?: readonly AxiomId[];
};

// --- ワークスペースモード ---

/**
 * ワークスペースのモード。
 * - "free": 自由帳モード（すべてのノードが編集・削除可能）
 * - "quest": クエストモード（保護されたゴールノードが存在し、編集・削除不可）
 */
export type WorkspaceMode = "free" | "quest";

// --- ワークスペースノード ---

/**
 * ワークスペース上の証明ノード。
 *
 * Gen変数名・代入エントリはInferenceEdgeが唯一のsource of truth。
 * ノードにはこれらの情報を保持しない。
 */
export type WorkspaceNode = {
  readonly id: string;
  readonly kind: ProofNodeKind;
  readonly label: string;
  readonly formulaText: string;
  readonly position: Point;
  /** ユーザーが明示的に設定した役割（"axiom" | undefined） */
  readonly role?: NodeRole;
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
  /**
   * 演繹体系（統一型）。
   * Hilbert流・自然演繹・シーケント計算を区別する。
   * 未設定時は system からHilbert流として推定される。
   */
  readonly deductionSystem: DeductionSystem;
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
  /**
   * ワークスペースのゴール（証明すべき目標）。
   * ノードとは独立したデータとして管理される。
   * キャンバス上のどこかのノードの式がゴール式と一致すれば達成。
   */
  readonly goals: readonly WorkspaceGoal[];
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
      // conclusionNode は先行の filter で undefined を除外済みだが、
      // TypeScript の Array.filter は narrowing しないため ?. と ?? が必要
      const currentText =
        /* v8 ignore next -- always defined after filter */ conclusionNode?.formulaText ??
        "";
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

// --- DeductionSystem → LogicSystem 変換 ---

/**
 * ND/SC用のダミーLogicSystem。
 * system フィールドの後方互換性のために使用する。
 * Hilbert固有の機能（MP, Gen等）は使えない。
 */
export const emptyLogicSystem: LogicSystem = {
  name: "Empty (non-Hilbert)",
  propositionalAxioms: new Set(),
  predicateLogic: false,
  equalityLogic: false,
  generalization: false,
};

/**
 * DeductionSystem から LogicSystem を抽出する。
 * Hilbert流の場合はそのまま返し、ND/SC の場合はダミーを返す。
 */
export function extractLogicSystem(ds: DeductionSystem): LogicSystem {
  if (ds.style === "hilbert") return ds.system;
  return emptyLogicSystem;
}

// --- 初期状態 ---

/** 空のワークスペースを作成する（DeductionSystem版） */
export function createEmptyWorkspace(
  systemOrDeduction: LogicSystem | DeductionSystem,
): WorkspaceState {
  // DeductionSystem かどうかを判別（style プロパティの有無）
  const deductionSystem: DeductionSystem =
    "style" in systemOrDeduction
      ? systemOrDeduction
      : hilbertDeduction(systemOrDeduction);
  const system = extractLogicSystem(deductionSystem);
  return {
    system,
    deductionSystem,
    nodes: [],
    connections: [],
    nextNodeId: 1,
    mode: "free",
    inferenceEdges: [],
    goals: [],
  };
}

/** クエスト用ゴールの定義 */
export type QuestGoalDefinition = {
  /** ゴール式のDSLテキスト */
  readonly formulaText: string;
  /** 表示ラベル（省略時はデフォルト） */
  readonly label?: string;
  /**
   * このゴールを達成するために使ってよい公理スキーマIDのリスト。
   * undefined の場合はシステムの全公理を許可する。
   */
  readonly allowedAxiomIds?: readonly AxiomId[];
};

/**
 * クエストモードのワークスペースを作成する。
 * ゴール定義からWorkspaceGoalを生成する（ノードとしてキャンバスには配置しない）。
 */
export function createQuestWorkspace(
  systemOrDeduction: LogicSystem | DeductionSystem,
  goals: readonly QuestGoalDefinition[],
): WorkspaceState {
  const deductionSystem: DeductionSystem =
    "style" in systemOrDeduction
      ? systemOrDeduction
      : hilbertDeduction(systemOrDeduction);
  const system = extractLogicSystem(deductionSystem);
  const workspaceGoals: WorkspaceGoal[] = goals.map((goal, i) => ({
    id: `goal-${String(i + 1) satisfies string}`,
    formulaText: goal.formulaText,
    label: goal.label,
    allowedAxiomIds: goal.allowedAxiomIds,
  }));

  return {
    system,
    deductionSystem,
    nodes: [],
    connections: [],
    nextNodeId: 1,
    mode: "quest",
    inferenceEdges: [],
    goals: workspaceGoals,
  };
}

/**
 * クエストモードから自由帳モードに変換する。
 * ゴールは保持される（自由帳でもゴールは表示可能）。
 */
export function convertToFreeMode(state: WorkspaceState): WorkspaceState {
  if (state.mode === "free") return state;
  return {
    ...state,
    mode: "free",
  };
}

/**
 * ノードが保護されているかを判定する。
 * ゴールがノードから分離されたため、保護されるノードは存在しない。
 * 後方互換のために関数自体は残すが、常にfalseを返す。
 */
export function isNodeProtected(
  _state: WorkspaceState,
  _nodeId: string,
): boolean {
  void _state;
  void _nodeId;
  return false;
}

// --- ゴール操作 ---

/** ゴールを追加する */
export function addGoal(
  state: WorkspaceState,
  formulaText: string,
  options?: {
    readonly label?: string;
    readonly allowedAxiomIds?: readonly AxiomId[];
  },
): WorkspaceState {
  const nextId = state.goals.length + 1;
  const id = `goal-${String(nextId) satisfies string}`;
  const newGoal: WorkspaceGoal = {
    id,
    formulaText,
    label: options?.label,
    allowedAxiomIds: options?.allowedAxiomIds,
  };
  return {
    ...state,
    goals: [...state.goals, newGoal],
  };
}

/** ゴールを削除する */
export function removeGoal(
  state: WorkspaceState,
  goalId: string,
): WorkspaceState {
  return {
    ...state,
    goals: state.goals.filter((g) => g.id !== goalId),
  };
}

/** ゴールの式テキストを更新する */
export function updateGoalFormulaText(
  state: WorkspaceState,
  goalId: string,
  formulaText: string,
): WorkspaceState {
  return {
    ...state,
    goals: state.goals.map((g) =>
      g.id === goalId ? { ...g, formulaText } : g,
    ),
  };
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
  /* v8 ignore start -- isNodeProtected always returns false (design: goals separated from nodes) */
  if (isNodeProtected(state, nodeId)) return state;
  /* v8 ignore stop */
  return syncInferenceEdges({
    ...state,
    nodes: state.nodes.map((node) =>
      node.id === nodeId ? { ...node, formulaText } : node,
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

/** ノードの役割を更新する */
export function updateNodeRole(
  state: WorkspaceState,
  nodeId: string,
  role: NodeRole | undefined,
): WorkspaceState {
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
  /* v8 ignore start -- isNodeProtected always returns false (design: goals separated from nodes) */
  if (isNodeProtected(state, nodeId)) return state;
  /* v8 ignore stop */
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

/**
 * 接続を削除する。
 *
 * 削除するコネクションの toNodeId に対応する InferenceEdge が存在する場合、
 * 同じ結論ノードへの他のコネクションもすべて連動削除し、
 * InferenceEdge も削除する。
 * これにより、MPノードへの片方のコネクションを消すと
 * もう片方も消え、ノードが derived ではなくなる。
 */
export function removeConnection(
  state: WorkspaceState,
  connectionId: string,
): WorkspaceState {
  const targetConnection = state.connections.find((c) => c.id === connectionId);
  if (!targetConnection) {
    return state;
  }

  const toNodeId = targetConnection.toNodeId;

  // 削除対象のコネクションの toNodeId に対応する InferenceEdge を探す
  const relatedEdge = state.inferenceEdges.find(
    (e) => e.conclusionNodeId === toNodeId,
  );

  if (relatedEdge) {
    // InferenceEdge が存在する場合:
    // 同じ結論ノードへの全コネクションを削除し、InferenceEdge も削除する
    // 結論ノードのラベルをデフォルトに戻す（"MP"/"Gen"/"Subst"などのステート残留を防ぐ）
    const targetNode = state.nodes.find((n) => n.id === toNodeId);
    return syncInferenceEdges({
      ...state,
      nodes: targetNode
        ? state.nodes.map((n) =>
            n.id === toNodeId
              ? { ...n, label: getProofNodeKindLabel(n.kind) }
              : n,
          )
        : /* v8 ignore next -- defensive: node should always exist when InferenceEdge references it */
          state.nodes,
      connections: state.connections.filter((c) => c.toNodeId !== toNodeId),
      inferenceEdges: state.inferenceEdges.filter(
        (e) => e.conclusionNodeId !== toNodeId,
      ),
    });
  }

  // InferenceEdge がない場合: そのコネクションだけ削除
  return syncInferenceEdges({
    ...state,
    connections: state.connections.filter((c) => c.id !== connectionId),
  });
}

// --- 体系変更 ---

/** 論理体系を変更する */
export function changeSystem(
  state: WorkspaceState,
  systemOrDeduction: LogicSystem | DeductionSystem,
): WorkspaceState {
  const deductionSystem: DeductionSystem =
    "style" in systemOrDeduction
      ? systemOrDeduction
      : hilbertDeduction(systemOrDeduction);
  const system = extractLogicSystem(deductionSystem);
  return {
    ...state,
    system,
    deductionSystem,
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
  // 結論ノードを追加（derivedかどうかはInferenceEdgeで計算される）
  let ws = addNode(state, "axiom", "MP", position);
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
  if (Either.isRight(validation)) {
    ws = updateNodeFormulaText(ws, mpNodeId, validation.right.conclusionText);
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
  // 結論ノードを追加（derivedかどうかはInferenceEdgeで計算される）
  let ws = addNode(state, "axiom", "Gen", position);
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
  if (Either.isRight(validation)) {
    ws = updateNodeFormulaText(ws, genNodeId, validation.right.conclusionText);
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
  // 結論ノードを追加（derivedかどうかはInferenceEdgeで計算される）
  let ws = addNode(state, "axiom", "Subst", position);
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
  if (Either.isRight(validation)) {
    ws = updateNodeFormulaText(
      ws,
      substitutionNodeId,
      validation.right.conclusionText,
    );
  }

  return { workspace: ws, substitutionNodeId, validation };
}

// --- TAB規則適用（ノード作成 + InferenceEdge + 前提シーケント自動生成） ---

/** TAB規則適用結果 */
export type ApplyTabRuleResult = {
  readonly workspace: WorkspaceState;
  /** 結論ノードID（規則適用元のシーケントノード） */
  readonly conclusionNodeId: string;
  /** 生成された前提ノードのID（公理なら空、1前提なら1つ、分岐なら2つ） */
  readonly premiseNodeIds: readonly string[];
  readonly validation: TabApplicationResult;
};

/**
 * シーケントノードにTAB規則を適用し、前提ノードを作成する。
 * InferenceEdge（TabEdge）を追加し、結論→前提の関係を管理する。
 *
 * @param state 現在のワークスペース状態
 * @param conclusionNodeId 規則を適用するシーケントノード（結論側）のID
 * @param params TAB規則適用パラメータ
 * @param premisePositions 前提ノードの配置位置（1前提: [pos], 分岐: [leftPos, rightPos], 公理: []）
 * @returns 新しいワークスペース状態、前提ノードID群、検証結果
 */
export function applyTabRuleAndConnect(
  state: WorkspaceState,
  conclusionNodeId: string,
  params: TabRuleApplicationParams,
  premisePositions: readonly Point[],
): ApplyTabRuleResult {
  // バリデーション実行
  const validation = validateTabApplication(params);

  if (Either.isLeft(validation)) {
    return {
      workspace: state,
      conclusionNodeId,
      premiseNodeIds: [],
      validation,
    };
  }

  const result = validation.right;
  let ws = state;
  const premiseNodeIds: string[] = [];

  // 結果に応じてノードとエッジを生成
  const edge = createTabEdgeFromResult(params, result, conclusionNodeId);

  switch (result._tag) {
    case "tab-axiom-result": {
      // 公理: 前提ノードなし
      ws = addInferenceEdge(ws, edge);
      break;
    }
    case "tab-single-result": {
      // 1前提: 前提ノードを1つ作成
      /* v8 ignore start -- 防御的: premisePositions[0]は呼び出し元で保証 */
      const pos = premisePositions[0] ?? { x: 0, y: 0 };
      /* v8 ignore stop */
      const premiseId = `node-${String(ws.nextNodeId) satisfies string}`;
      ws = addNode(ws, "axiom", "", pos, result.premiseText);
      premiseNodeIds.push(premiseId);

      // エッジの premiseNodeId を設定
      const singleEdge = { ...edge, premiseNodeId: premiseId } as typeof edge;
      ws = addInferenceEdge(ws, singleEdge);

      // 接続追加
      ws = addConnection(ws, conclusionNodeId, "out", premiseId, "premise");
      break;
    }
    case "tab-branching-result": {
      // 2前提: 前提ノードを2つ作成
      /* v8 ignore start -- 防御的: premisePositions[0/1]は呼び出し元で保証 */
      const leftPos = premisePositions[0] ?? { x: 0, y: 0 };
      const rightPos = premisePositions[1] ?? { x: 0, y: 0 };
      /* v8 ignore stop */

      const leftId = `node-${String(ws.nextNodeId) satisfies string}`;
      ws = addNode(ws, "axiom", "", leftPos, result.leftPremiseText);
      premiseNodeIds.push(leftId);

      const rightId = `node-${String(ws.nextNodeId) satisfies string}`;
      ws = addNode(ws, "axiom", "", rightPos, result.rightPremiseText);
      premiseNodeIds.push(rightId);

      // エッジの前提ノードIDを設定
      const branchEdge = {
        ...edge,
        leftPremiseNodeId: leftId,
        rightPremiseNodeId: rightId,
      } as typeof edge;
      ws = addInferenceEdge(ws, branchEdge);

      // 接続追加
      ws = addConnection(ws, conclusionNodeId, "out", leftId, "premise-left");
      ws = addConnection(ws, conclusionNodeId, "out", rightId, "premise-right");
      break;
    }
  }

  return {
    workspace: ws,
    conclusionNodeId,
    premiseNodeIds,
    validation,
  };
}

// --- AT規則適用（ノード作成 + InferenceEdge + 結果ノード自動生成） ---

/** AT規則適用結果 */
export type ApplyAtRuleResult = {
  readonly workspace: WorkspaceState;
  /** 結論ノードID（規則適用元のノード） */
  readonly conclusionNodeId: string;
  /** 生成された結果ノードのID（closureなら空、α/γ/δなら1-2つ、βなら2つ） */
  readonly resultNodeIds: readonly string[];
  readonly validation: AtApplicationResult;
};

/**
 * 署名付き論理式ノードにAT規則を適用し、結果ノードを作成する。
 * InferenceEdge（AtEdge）を追加し、適用元→結果の関係を管理する。
 *
 * @param state 現在のワークスペース状態
 * @param conclusionNodeId 規則を適用するノード（署名付き論理式）のID
 * @param params AT規則適用パラメータ
 * @param resultPositions 結果ノードの配置位置
 * @param contradictionNodeId 矛盾ノードのID（closure用）
 * @returns 新しいワークスペース状態、結果ノードID群、検証結果
 */
export function applyAtRuleAndConnect(
  state: WorkspaceState,
  conclusionNodeId: string,
  params: AtRuleApplicationParams,
  resultPositions: readonly Point[],
  contradictionNodeId?: string,
): ApplyAtRuleResult {
  // バリデーション実行
  const validation = validateAtApplication(params);

  if (Either.isLeft(validation)) {
    return {
      workspace: state,
      conclusionNodeId,
      resultNodeIds: [],
      validation,
    };
  }

  const result = validation.right;
  let ws = state;
  const resultNodeIds: string[] = [];

  // エッジ生成
  const edge = createAtEdgeFromResult(
    params,
    result,
    conclusionNodeId,
    contradictionNodeId,
  );

  switch (result._tag) {
    case "at-closed-result": {
      // closure: 結果ノードなし
      ws = addInferenceEdge(ws, edge);
      // 矛盾ノードとの接続
      if (contradictionNodeId !== undefined) {
        ws = addConnection(
          ws,
          conclusionNodeId,
          "out",
          contradictionNodeId,
          "contradiction",
        );
      }
      break;
    }
    case "at-alpha-result": {
      // α規則: 1-2個の結果ノードを作成
      /* v8 ignore start -- 防御的: resultPositions[0]は呼び出し元で保証 */
      const pos1 = resultPositions[0] ?? { x: 0, y: 0 };
      /* v8 ignore stop */
      const resultId1 = `node-${String(ws.nextNodeId) satisfies string}`;
      ws = addNode(ws, "axiom", "", pos1, result.resultText);
      resultNodeIds.push(resultId1);

      let resultId2: string | undefined;
      if (result.secondResultText !== undefined) {
        /* v8 ignore start -- 防御的: resultPositions[1]は呼び出し元で保証 */
        const pos2 = resultPositions[1] ?? { x: 0, y: 0 };
        /* v8 ignore stop */
        resultId2 = `node-${String(ws.nextNodeId) satisfies string}`;
        ws = addNode(ws, "axiom", "", pos2, result.secondResultText);
        resultNodeIds.push(resultId2);
      }

      const alphaEdge = {
        ...edge,
        resultNodeId: resultId1,
        secondResultNodeId: resultId2,
      } as typeof edge;
      ws = addInferenceEdge(ws, alphaEdge);

      // 接続追加
      ws = addConnection(ws, conclusionNodeId, "out", resultId1, "result");
      if (resultId2 !== undefined) {
        ws = addConnection(ws, conclusionNodeId, "out", resultId2, "result-2");
      }
      break;
    }
    case "at-beta-result": {
      // β規則: 左右2つの枝を作成
      /* v8 ignore start -- 防御的: resultPositions[0/1]は呼び出し元で保証 */
      const leftPos = resultPositions[0] ?? { x: 0, y: 0 };
      const rightPos = resultPositions[1] ?? { x: 0, y: 0 };
      /* v8 ignore stop */

      const leftId = `node-${String(ws.nextNodeId) satisfies string}`;
      ws = addNode(ws, "axiom", "", leftPos, result.leftResultText);
      resultNodeIds.push(leftId);

      const rightId = `node-${String(ws.nextNodeId) satisfies string}`;
      ws = addNode(ws, "axiom", "", rightPos, result.rightResultText);
      resultNodeIds.push(rightId);

      const betaEdge = {
        ...edge,
        leftResultNodeId: leftId,
        rightResultNodeId: rightId,
      } as typeof edge;
      ws = addInferenceEdge(ws, betaEdge);

      // 接続追加
      ws = addConnection(ws, conclusionNodeId, "out", leftId, "result-left");
      ws = addConnection(ws, conclusionNodeId, "out", rightId, "result-right");
      break;
    }
    case "at-gamma-result":
    case "at-delta-result": {
      // γ/δ規則: 1つの結果ノードを作成
      /* v8 ignore start -- 防御的: resultPositions[0]は呼び出し元で保証 */
      const pos = resultPositions[0] ?? { x: 0, y: 0 };
      /* v8 ignore stop */
      const resultId = `node-${String(ws.nextNodeId) satisfies string}`;
      ws = addNode(ws, "axiom", "", pos, result.resultText);
      resultNodeIds.push(resultId);

      const gdEdge = {
        ...edge,
        resultNodeId: resultId,
      } as typeof edge;
      ws = addInferenceEdge(ws, gdEdge);

      // 接続追加
      ws = addConnection(ws, conclusionNodeId, "out", resultId, "result");
      break;
    }
  }

  return {
    workspace: ws,
    conclusionNodeId,
    resultNodeIds,
    validation,
  };
}

// --- SC規則適用（ノード作成 + InferenceEdge + 前提シーケント自動生成） ---

/** SC規則適用結果 */
export type ApplyScRuleResult = {
  readonly workspace: WorkspaceState;
  /** 結論ノードID（規則適用元のシーケントノード） */
  readonly conclusionNodeId: string;
  /** 生成された前提ノードのID（公理なら空、1前提なら1つ、分岐なら2つ） */
  readonly premiseNodeIds: readonly string[];
  readonly validation: ScApplicationResult;
};

/**
 * シーケントノードにSC規則を適用し、前提ノードを作成する。
 * InferenceEdge（ScEdge）を追加し、結論→前提の関係を管理する。
 *
 * @param state 現在のワークスペース状態
 * @param conclusionNodeId 規則を適用するシーケントノード（結論側）のID
 * @param params SC規則適用パラメータ
 * @param premisePositions 前提ノードの配置位置（1前提: [pos], 分岐: [leftPos, rightPos], 公理: []）
 * @returns 新しいワークスペース状態、前提ノードID群、検証結果
 */
export function applyScRuleAndConnect(
  state: WorkspaceState,
  conclusionNodeId: string,
  params: ScRuleApplicationParams,
  premisePositions: readonly Point[],
): ApplyScRuleResult {
  // バリデーション実行
  const validation = validateScApplication(params);

  if (Either.isLeft(validation)) {
    return {
      workspace: state,
      conclusionNodeId,
      premiseNodeIds: [],
      validation,
    };
  }

  const result = validation.right;
  let ws = state;
  const premiseNodeIds: string[] = [];

  // 結果に応じてノードとエッジを生成
  const edge = createScEdgeFromResult(params, result, conclusionNodeId);

  switch (result._tag) {
    case "sc-axiom-result": {
      // 公理: 前提ノードなし
      ws = addInferenceEdge(ws, edge);
      break;
    }
    case "sc-single-result": {
      // 1前提: 前提ノードを1つ作成
      /* v8 ignore start -- 防御的: premisePositions[0]は呼び出し元で保証 */
      const pos = premisePositions[0] ?? { x: 0, y: 0 };
      /* v8 ignore stop */
      const premiseId = `node-${String(ws.nextNodeId) satisfies string}`;
      ws = addNode(ws, "axiom", "", pos, result.premiseText);
      premiseNodeIds.push(premiseId);

      // エッジの premiseNodeId を設定
      const singleEdge = { ...edge, premiseNodeId: premiseId } as typeof edge;
      ws = addInferenceEdge(ws, singleEdge);

      // 接続追加
      ws = addConnection(ws, conclusionNodeId, "out", premiseId, "premise");
      break;
    }
    case "sc-branching-result": {
      // 2前提: 前提ノードを2つ作成
      /* v8 ignore start -- 防御的: premisePositions[0/1]は呼び出し元で保証 */
      const leftPos = premisePositions[0] ?? { x: 0, y: 0 };
      const rightPos = premisePositions[1] ?? { x: 0, y: 0 };
      /* v8 ignore stop */

      const leftId = `node-${String(ws.nextNodeId) satisfies string}`;
      ws = addNode(ws, "axiom", "", leftPos, result.leftPremiseText);
      premiseNodeIds.push(leftId);

      const rightId = `node-${String(ws.nextNodeId) satisfies string}`;
      ws = addNode(ws, "axiom", "", rightPos, result.rightPremiseText);
      premiseNodeIds.push(rightId);

      // エッジの前提ノードIDを設定
      const branchEdge = {
        ...edge,
        leftPremiseNodeId: leftId,
        rightPremiseNodeId: rightId,
      } as typeof edge;
      ws = addInferenceEdge(ws, branchEdge);

      // 接続追加
      ws = addConnection(ws, conclusionNodeId, "out", leftId, "premise-left");
      ws = addConnection(ws, conclusionNodeId, "out", rightId, "premise-right");
      break;
    }
  }

  return {
    workspace: ws,
    conclusionNodeId,
    premiseNodeIds,
    validation,
  };
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
    workspace: syncInferenceEdges({
      ...state,
      nodes: [...state.nodes, ...result.newNodes],
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
      if (newPos !== undefined) {
        return { ...node, position: newPos };
      }
      /* v8 ignore start -- computeTreeLayout は全ノードにpositionを返すため、この分岐は到達不能（防御的） */
      return node;
      /* v8 ignore stop */
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

      if (isHilbertInferenceEdge(edge)) {
        switch (edge._tag) {
          case "mp": {
            const result = validateMPApplication(current, node.id);
            const newText = Either.isRight(result)
              ? result.right.conclusionText
              : "";
            if (newText !== node.formulaText) {
              changed = true;
              return { ...node, formulaText: newText };
            }
            return node;
          }
          case "gen": {
            const variableName = edge.variableName;
            const result = validateGenApplication(
              current,
              node.id,
              variableName,
            );
            const newText = Either.isRight(result)
              ? result.right.conclusionText
              : "";
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
            const newText = Either.isRight(result)
              ? result.right.conclusionText
              : "";
            if (newText !== node.formulaText) {
              changed = true;
              return { ...node, formulaText: newText };
            }
            return node;
          }
        }
      }

      if (isNdInferenceEdge(edge)) {
        const ndResult = validateNdApplication(current, edge);
        if (Either.isRight(ndResult)) {
          const success = ndResult.right;
          // EFQは結論を自動計算できないため、結論テキストを更新しない
          if (success._tag === "efq-valid") return node;
          const newText = success.conclusionText;
          if (newText !== node.formulaText) {
            changed = true;
            return { ...node, formulaText: newText };
          }
        } else {
          // バリデーションエラー時は結論テキストをクリア
          if (node.formulaText !== "") {
            changed = true;
            return { ...node, formulaText: "" };
          }
        }
        return node;
      }

      // TABエッジはシーケント操作のため、formulaTextの自動計算は行わない
      // TABの前提シーケントは規則適用時に計算済み
      if (isTabInferenceEdge(edge)) {
        return node;
      }

      // ATエッジは署名付き論理式操作のため、formulaTextの自動計算は行わない
      // ATの結果ノードは規則適用時に計算済み
      if (isAtInferenceEdge(edge)) {
        return node;
      }

      // SCエッジはシーケント操作のため、formulaTextの自動計算は行わない
      // SCの前提シーケントは規則適用時に計算済み
      /* v8 ignore start -- SCは上流のチェック(Hilbert/ND/TAB/AT)を通過した残りなので、else分岐は到達不能 */
      if (isScInferenceEdge(edge)) {
        return node;
      }

      // exhaustive check: 新しいエッジ型が追加された場合にコンパイルエラーを発生させる
      return node;
      /* v8 ignore stop */
    });

    if (!changed) break;
    current = { ...current, nodes: newNodes };
  }

  // ノード変更があった場合のみエッジを再構築
  if (current === state) return state;
  return syncInferenceEdges(current);
}

// --- ノードマージ ---

/** ノードマージ結果 */
export type MergeNodesResult =
  | { readonly _tag: "Error"; readonly error: MergeError }
  | {
      readonly _tag: "Success";
      readonly workspace: WorkspaceState;
      readonly leaderNodeId: string;
      readonly absorbedNodeIds: readonly string[];
    };

/**
 * 選択されたノードのうち、同一のformulaTextを持つノードをマージする。
 * リーダーノード（先に選択されたノード）が保持され、
 * 吸収されるノードの出力コネクション（定理として利用されている立場）は
 * リーダーに付替えられる。
 *
 * @param state 現在のワークスペース状態
 * @param leaderNodeId リーダーノードのID
 * @param absorbedNodeIds 吸収されるノードのID一覧
 * @returns マージ結果
 */
export function mergeSelectedNodes(
  state: WorkspaceState,
  leaderNodeId: string,
  absorbedNodeIds: readonly string[],
): MergeNodesResult {
  // 保護ノードIDを収集
  const protectedIds = new Set(
    state.nodes.filter((n) => isNodeProtected(state, n.id)).map((n) => n.id),
  );

  const result = mergeNodesLogic(
    leaderNodeId,
    absorbedNodeIds,
    state.nodes,
    state.connections,
    state.inferenceEdges,
    protectedIds,
  );

  if (result._tag === "Error") {
    return result;
  }

  // 新しいワークスペース状態を構築し、推論結論を再検証
  const newState = revalidateInferenceConclusions(
    syncInferenceEdges({
      ...state,
      nodes: result.nodes,
      connections: result.connections,
      inferenceEdges: result.inferenceEdges,
    }),
  );

  return {
    _tag: "Success",
    workspace: newState,
    leaderNodeId: result.leaderNodeId,
    absorbedNodeIds: result.absorbedNodeIds,
  };
}
