/**
 * ワークスペース操作 API のサンドボックスブリッジ。
 *
 * スクリプトからワークスペースのノード追加・式変更・MP接続などを行う。
 * コールバック方式で WorkspaceState を間接的に操作する。
 *
 * 変更時は workspaceBridge.test.ts, index.ts, proofBridge.ts も同期すること。
 */

import { makeConstMapWithReturnType } from "@luma/const-map";
import type { NativeFunctionBridge } from "./scriptRunner";
import type { ProofBridgeApiDef } from "./proofBridge";
import { decodeScProofNode } from "./cutEliminationBridge";
import { formatFormula } from "../logic-lang/formatUnicode";
import type { ScProofNode } from "../logic-core/sequentCalculus";

// ── ワークスペースコマンド型 ─────────────────────────────────

/** ノード情報（サンドボックスへの返却用） */
export interface WorkspaceNodeInfo {
  readonly id: string;
  readonly formulaText: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
}

/** ノード詳細状態（getNodeState の返却用） */
export interface WorkspaceNodeState {
  readonly id: string;
  readonly kind: string;
  readonly formulaText: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  /** ノード分類: "root-axiom" | "root-goal" | "root-unmarked" | "derived" */
  readonly classification: string;
  /** このノードへの接続 */
  readonly incomingConnections: readonly {
    readonly fromNodeId: string;
    readonly fromPortId: string;
    readonly toPortId: string;
  }[];
  /** このノードからの接続 */
  readonly outgoingConnections: readonly {
    readonly toNodeId: string;
    readonly fromPortId: string;
    readonly toPortId: string;
  }[];
  /** このノードに関連する推論エッジ */
  readonly inferenceEdges: readonly {
    readonly tag: string;
    readonly role: "conclusion" | "premise";
  }[];
}

/** ワークスペース操作ハンドラー。各操作の実装を外部から注入する。 */
export interface WorkspaceCommandHandler {
  /** ノードを追加して ID を返す */
  readonly addNode: (formulaText: string) => string;
  /** ノードの式テキストを更新する */
  readonly setNodeFormula: (nodeId: string, formulaText: string) => void;
  /** 全ノード一覧を返す */
  readonly getNodes: () => readonly WorkspaceNodeInfo[];
  /** MP 適用でノードを接続。結論ノードの ID を返す。失敗時は throw */
  readonly connectMP: (antecedentId: string, conditionalId: string) => string;
  /** ノードを削除する */
  readonly removeNode: (nodeId: string) => void;
  /** ノードの役割を公理に設定する */
  readonly setNodeRoleAxiom: (nodeId: string) => void;
  /** ツリーレイアウトを適用する */
  readonly applyLayout: () => void;
  /** ワークスペース上の全ノードを削除する */
  readonly clearWorkspace: () => void;
  /** 現在選択中のノードID一覧を返す */
  readonly getSelectedNodeIds: () => readonly string[];
  /** 現在の演繹体系情報を返す */
  readonly getDeductionSystemInfo: () => {
    readonly style: string;
    readonly systemName: string;
    readonly isHilbertStyle: boolean;
    readonly rules: readonly string[];
  };
  /**
   * 現在の Hilbert 体系の LogicSystem JSON を返す。
   * identifyAxiom / applyGen にそのまま渡せる形式。
   * Hilbert 体系でない場合は throw。
   */
  readonly getLogicSystem: () => {
    readonly name: string;
    readonly propositionalAxioms: readonly string[];
    readonly predicateLogic: boolean;
    readonly equalityLogic: boolean;
    readonly generalization: boolean;
    readonly theoryAxioms?: readonly unknown[];
  };
  /**
   * ワークスペースからSC証明木を抽出する。
   * rootNodeIdを指定しない場合はルートを自動検出する。
   * SC体系でない場合、証明木構築に失敗した場合はthrow。
   * 返却値はencodeScProofNode済みのJSON互換オブジェクト。
   */
  readonly extractScProof: (rootNodeId?: string) => unknown;
  /**
   * ワークスペースからHilbert証明木を抽出する。
   * rootNodeIdを指定しない場合はルートを自動検出する。
   * Hilbert系でない場合、証明木構築に失敗した場合はthrow。
   * 返却値はencodeProofNode済みのJSON互換オブジェクト。
   */
  readonly extractHilbertProof: (rootNodeId?: string) => unknown;
  /** 指定ノードの詳細な内部状態を返す。存在しない場合は throw */
  readonly getNodeState: (nodeId: string) => WorkspaceNodeState;
}

// ── ブリッジ関数の実装 ────────────────────────────────────────

const createAddNodeFn =
  (handler: WorkspaceCommandHandler) =>
  (formulaText: unknown): unknown => {
    if (typeof formulaText !== "string") {
      const t = typeof formulaText satisfies string;
      throw new Error(`addNode: expected string, got ${t satisfies string}`);
    }
    return handler.addNode(formulaText);
  };

const createSetNodeFormulaFn =
  (handler: WorkspaceCommandHandler) =>
  (nodeId: unknown, formulaText: unknown): unknown => {
    if (typeof nodeId !== "string") {
      const t = typeof nodeId satisfies string;
      throw new Error(
        `setNodeFormula: nodeId must be string, got ${t satisfies string}`,
      );
    }
    if (typeof formulaText !== "string") {
      const t = typeof formulaText satisfies string;
      throw new Error(
        `setNodeFormula: formulaText must be string, got ${t satisfies string}`,
      );
    }
    handler.setNodeFormula(nodeId, formulaText);
    return undefined;
  };

const createGetNodesFn = (handler: WorkspaceCommandHandler) => (): unknown => {
  return handler.getNodes();
};

const createConnectMPFn =
  (handler: WorkspaceCommandHandler) =>
  (antecedentId: unknown, conditionalId: unknown): unknown => {
    if (typeof antecedentId !== "string") {
      const t = typeof antecedentId satisfies string;
      throw new Error(
        `connectMP: antecedentId must be string, got ${t satisfies string}`,
      );
    }
    if (typeof conditionalId !== "string") {
      const t = typeof conditionalId satisfies string;
      throw new Error(
        `connectMP: conditionalId must be string, got ${t satisfies string}`,
      );
    }
    return handler.connectMP(antecedentId, conditionalId);
  };

const createRemoveNodeFn =
  (handler: WorkspaceCommandHandler) =>
  (nodeId: unknown): unknown => {
    if (typeof nodeId !== "string") {
      const t = typeof nodeId satisfies string;
      throw new Error(
        `removeNode: nodeId must be string, got ${t satisfies string}`,
      );
    }
    handler.removeNode(nodeId);
    return undefined;
  };

const createSetNodeRoleAxiomFn =
  (handler: WorkspaceCommandHandler) =>
  (nodeId: unknown): unknown => {
    if (typeof nodeId !== "string") {
      const t = typeof nodeId satisfies string;
      throw new Error(
        `setNodeRoleAxiom: nodeId must be string, got ${t satisfies string}`,
      );
    }
    handler.setNodeRoleAxiom(nodeId);
    return undefined;
  };

const createApplyLayoutFn =
  (handler: WorkspaceCommandHandler) => (): unknown => {
    handler.applyLayout();
    return undefined;
  };

const createClearWorkspaceFn =
  (handler: WorkspaceCommandHandler) => (): unknown => {
    handler.clearWorkspace();
    return undefined;
  };

const createGetSelectedNodeIdsFn =
  (handler: WorkspaceCommandHandler) => (): unknown => {
    return handler.getSelectedNodeIds();
  };

const createGetDeductionSystemInfoFn =
  (handler: WorkspaceCommandHandler) => (): unknown => {
    return handler.getDeductionSystemInfo();
  };

const createGetLogicSystemFn =
  (handler: WorkspaceCommandHandler) => (): unknown => {
    return handler.getLogicSystem();
  };

const createExtractScProofFn =
  (handler: WorkspaceCommandHandler) =>
  (rootNodeId?: unknown): unknown => {
    if (rootNodeId !== undefined && typeof rootNodeId !== "string") {
      const t = typeof rootNodeId satisfies string;
      throw new Error(
        `extractScProof: rootNodeId must be string or undefined, got ${t satisfies string}`,
      );
    }
    return handler.extractScProof(
      typeof rootNodeId === "string" ? rootNodeId : undefined,
    );
  };

const createExtractHilbertProofFn =
  (handler: WorkspaceCommandHandler) =>
  (rootNodeId?: unknown): unknown => {
    if (rootNodeId !== undefined && typeof rootNodeId !== "string") {
      const t = typeof rootNodeId satisfies string;
      throw new Error(
        `extractHilbertProof: rootNodeId must be string or undefined, got ${t satisfies string}`,
      );
    }
    return handler.extractHilbertProof(
      typeof rootNodeId === "string" ? rootNodeId : undefined,
    );
  };

const createGetNodeStateFn =
  (handler: WorkspaceCommandHandler) =>
  (nodeId: unknown): unknown => {
    if (typeof nodeId !== "string") {
      const t = typeof nodeId satisfies string;
      throw new Error(
        `getNodeState: nodeId must be string, got ${t satisfies string}`,
      );
    }
    return handler.getNodeState(nodeId);
  };

// ── SC証明木のフラット展開 ──────────────────────────────────

/**
 * SC証明ノードの推論規則名を取得する。
 * makeConstMapWithReturnTypeにより、既知のSCタグ以外が渡された場合はエラーとなる。
 * 新しいSCルール追加時はこのマップも更新すること。
 */
const scTagToRuleName = makeConstMapWithReturnType<string>()([
  ["ScIdentity", "ID"],
  ["ScBottomLeft", "⊥L"],
  ["ScCut", "Cut"],
  ["ScWeakeningLeft", "WL"],
  ["ScWeakeningRight", "WR"],
  ["ScContractionLeft", "CL"],
  ["ScContractionRight", "CR"],
  ["ScExchangeLeft", "XL"],
  ["ScExchangeRight", "XR"],
  ["ScImplicationLeft", "→L"],
  ["ScImplicationRight", "→R"],
  ["ScConjunctionLeft", "∧L"],
  ["ScConjunctionRight", "∧R"],
  ["ScDisjunctionLeft", "∨L"],
  ["ScDisjunctionRight", "∨R"],
  ["ScUniversalLeft", "∀L"],
  ["ScUniversalRight", "∀R"],
  ["ScExistentialLeft", "∃L"],
  ["ScExistentialRight", "∃R"],
  ["ScNegationLeft", "¬L"],
  ["ScNegationRight", "¬R"],
] as const)();

/**
 * シーケントを Unicode テキストとしてフォーマットする。
 */
const formatSequentForDisplay = (seq: ScProofNode["conclusion"]): string => {
  const left = seq.antecedents.map((f) => formatFormula(f)).join(", ");
  const right = seq.succedents.map((f) => formatFormula(f)).join(", ");
  return `${left satisfies string} ⇒ ${right satisfies string}`;
};

/**
 * SC証明ノードの直接前提を取得する。
 */
const getScPremises = (node: ScProofNode): readonly ScProofNode[] => {
  switch (node._tag) {
    case "ScIdentity":
    case "ScBottomLeft":
      return [];
    case "ScCut":
    case "ScImplicationLeft":
    case "ScConjunctionRight":
    case "ScDisjunctionLeft":
      return [node.left, node.right];
    case "ScWeakeningLeft":
    case "ScWeakeningRight":
    case "ScContractionLeft":
    case "ScContractionRight":
    case "ScExchangeLeft":
    case "ScExchangeRight":
    case "ScImplicationRight":
    case "ScConjunctionLeft":
    case "ScDisjunctionRight":
    case "ScUniversalLeft":
    case "ScUniversalRight":
    case "ScExistentialLeft":
    case "ScExistentialRight":
    case "ScNegationLeft":
    case "ScNegationRight":
      return [node.premise];
  }
  /* v8 ignore start */
  return [];
  /* v8 ignore stop */
};

/**
 * SC証明木を再帰的にトラバースし、ワークスペースにノードとして配置する。
 * 各ノードのテキストは「結論シーケント [規則名]」形式。
 */
const displayScProofRecursive = (
  handler: WorkspaceCommandHandler,
  node: ScProofNode,
): void => {
  // 前提を先に配置（ボトムアップ表示用）
  const premises = getScPremises(node);
  for (const premise of premises) {
    displayScProofRecursive(handler, premise);
  }

  // 結論ノードを配置
  const sequentText = formatSequentForDisplay(node.conclusion);
  const ruleName = scTagToRuleName(node._tag);
  handler.addNode(
    `${sequentText satisfies string} [${ruleName satisfies string}]`,
  );
};

const createDisplayScProofFn =
  (handler: WorkspaceCommandHandler) =>
  (proofJson: unknown): unknown => {
    const proof = decodeScProofNode(proofJson);

    // ワークスペースをクリアして証明木を展開
    handler.clearWorkspace();
    displayScProofRecursive(handler, proof);
    handler.applyLayout();

    return undefined;
  };

// ── ブリッジ生成 ──────────────────────────────────────────────

/**
 * ワークスペース操作 API の NativeFunctionBridge 配列を生成する。
 *
 * サンドボックス内で以下の関数が利用可能になる:
 * - addNode(formulaText) → nodeId
 * - setNodeFormula(nodeId, formulaText)
 * - getNodes() → WorkspaceNodeInfo[]
 * - connectMP(antecedentId, conditionalId) → nodeId
 * - removeNode(nodeId)
 * - setNodeRoleAxiom(nodeId)
 * - applyLayout()
 * - getSelectedNodeIds() → string[]
 * - getDeductionSystemInfo() → { style, systemName, isHilbertStyle, rules }
 * - getLogicSystem() → LogicSystemJson
 * - extractScProof(rootNodeId?) → ScProofNodeJson
 */
export const createWorkspaceBridges = (
  handler: WorkspaceCommandHandler,
): readonly NativeFunctionBridge[] => [
  { name: "addNode", fn: createAddNodeFn(handler) },
  { name: "setNodeFormula", fn: createSetNodeFormulaFn(handler) },
  { name: "getNodes", fn: createGetNodesFn(handler) },
  { name: "connectMP", fn: createConnectMPFn(handler) },
  { name: "removeNode", fn: createRemoveNodeFn(handler) },
  { name: "setNodeRoleAxiom", fn: createSetNodeRoleAxiomFn(handler) },
  { name: "applyLayout", fn: createApplyLayoutFn(handler) },
  { name: "clearWorkspace", fn: createClearWorkspaceFn(handler) },
  { name: "displayScProof", fn: createDisplayScProofFn(handler) },
  { name: "getSelectedNodeIds", fn: createGetSelectedNodeIdsFn(handler) },
  {
    name: "getDeductionSystemInfo",
    fn: createGetDeductionSystemInfoFn(handler),
  },
  { name: "getLogicSystem", fn: createGetLogicSystemFn(handler) },
  { name: "extractScProof", fn: createExtractScProofFn(handler) },
  {
    name: "extractHilbertProof",
    fn: createExtractHilbertProofFn(handler),
  },
  { name: "getNodeState", fn: createGetNodeStateFn(handler) },
];

// ── API 定義（Monaco Editor 補完用）──────────────────────────

export const WORKSPACE_BRIDGE_API_DEFS: readonly ProofBridgeApiDef[] = [
  {
    name: "addNode",
    signature: "(formulaText: string) => string",
    description:
      "ワークスペースにノードを追加する。論理式テキストを指定し、ノードIDを返す。",
  },
  {
    name: "setNodeFormula",
    signature: "(nodeId: string, formulaText: string) => void",
    description: "指定ノードの論理式テキストを更新する。",
  },
  {
    name: "getNodes",
    signature:
      "() => Array<{ id: string; formulaText: string; label: string; x: number; y: number }>",
    description: "ワークスペース上の全ノード一覧を返す。",
  },
  {
    name: "connectMP",
    signature: "(antecedentId: string, conditionalId: string) => string",
    description:
      "Modus Ponens で2つのノードを接続し、結論ノードを作成する。結論ノードIDを返す。",
  },
  {
    name: "removeNode",
    signature: "(nodeId: string) => void",
    description: "指定ノードをワークスペースから削除する。",
  },
  {
    name: "setNodeRoleAxiom",
    signature: "(nodeId: string) => void",
    description: "指定ノードの役割を公理に設定する。",
  },
  {
    name: "applyLayout",
    signature: "() => void",
    description: "ワークスペース上のノードにツリーレイアウトを自動適用する。",
  },
  {
    name: "clearWorkspace",
    signature: "() => void",
    description: "ワークスペース上の全ノードを削除する。",
  },
  {
    name: "displayScProof",
    signature: "(proof: ScProofNodeJson) => void",
    description:
      "SC証明木をワークスペースに表示する。既存ノードをクリアし、証明木の各ノードをシーケントテキストとして配置する。",
  },
  {
    name: "getSelectedNodeIds",
    signature: "() => string[]",
    description: "現在選択中のノードID一覧を返す。",
  },
  {
    name: "getDeductionSystemInfo",
    signature:
      "() => { style: string; systemName: string; isHilbertStyle: boolean; rules: string[] }",
    description:
      "現在の演繹体系の情報を返す。style（証明スタイル）、systemName（体系名）、isHilbertStyle（Hilbert流かどうか）、rules（有効な推論規則一覧）を含む。",
  },
  {
    name: "getLogicSystem",
    signature: "() => LogicSystemJson",
    description:
      "現在のHilbert体系のLogicSystem JSONを返す。identifyAxiom / applyGen にそのまま渡せる。Hilbert体系でない場合はエラーをthrowする。",
  },
  {
    name: "extractScProof",
    signature: "(rootNodeId?: string) => ScProofNodeJson",
    description:
      "ワークスペースからSC証明木を抽出する。rootNodeIdを省略するとルートを自動検出する。SC体系でない場合や証明木構築に失敗した場合はエラーをthrowする。",
  },
  {
    name: "extractHilbertProof",
    signature: "(rootNodeId?: string) => ProofNodeJson",
    description:
      "ワークスペースからHilbert証明木を抽出する。rootNodeIdを省略するとルートを自動検出する。Hilbert系でない場合や証明木構築に失敗した場合はエラーをthrowする。",
  },
  {
    name: "getNodeState",
    signature:
      "(nodeId: string) => { id: string; kind: string; formulaText: string; label: string; x: number; y: number; classification: string; incomingConnections: Array<{ fromNodeId: string; fromPortId: string; toPortId: string }>; outgoingConnections: Array<{ toNodeId: string; fromPortId: string; toPortId: string }>; inferenceEdges: Array<{ tag: string; role: 'conclusion' | 'premise' }> }",
    description:
      "指定ノードの詳細な内部状態を返す。分類（root-axiom/root-goal/root-unmarked/derived）、接続、推論エッジを含む。存在しないノードIDを指定するとエラーをthrowする。",
  },
];
