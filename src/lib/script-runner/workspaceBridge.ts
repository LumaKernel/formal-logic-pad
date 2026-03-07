/**
 * ワークスペース操作 API のサンドボックスブリッジ。
 *
 * スクリプトからワークスペースのノード追加・式変更・MP接続などを行う。
 * コールバック方式で WorkspaceState を間接的に操作する。
 *
 * 変更時は workspaceBridge.test.ts, index.ts, proofBridge.ts も同期すること。
 */

import type { NativeFunctionBridge } from "./scriptRunner";
import type { ProofBridgeApiDef } from "./proofBridge";

// ── ワークスペースコマンド型 ─────────────────────────────────

/** ノード情報（サンドボックスへの返却用） */
export interface WorkspaceNodeInfo {
  readonly id: string;
  readonly formulaText: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
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
  readonly connectMP: (
    antecedentId: string,
    conditionalId: string,
  ) => string;
  /** ゴール式を設定する */
  readonly addGoal: (formulaText: string) => void;
  /** ノードを削除する */
  readonly removeNode: (nodeId: string) => void;
  /** ノードの役割を公理に設定する */
  readonly setNodeRoleAxiom: (nodeId: string) => void;
  /** ツリーレイアウトを適用する */
  readonly applyLayout: () => void;
}

// ── ブリッジ関数の実装 ────────────────────────────────────────

const createAddNodeFn =
  (handler: WorkspaceCommandHandler) =>
  (formulaText: unknown): unknown => {
    if (typeof formulaText !== "string") {
      const t = typeof formulaText satisfies string;
      throw new Error(
        `addNode: expected string, got ${t satisfies string}`,
      );
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

const createGetNodesFn =
  (handler: WorkspaceCommandHandler) => (): unknown => {
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

const createAddGoalFn =
  (handler: WorkspaceCommandHandler) =>
  (formulaText: unknown): unknown => {
    if (typeof formulaText !== "string") {
      const t = typeof formulaText satisfies string;
      throw new Error(
        `addGoal: expected string, got ${t satisfies string}`,
      );
    }
    handler.addGoal(formulaText);
    return undefined;
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

// ── ブリッジ生成 ──────────────────────────────────────────────

/**
 * ワークスペース操作 API の NativeFunctionBridge 配列を生成する。
 *
 * サンドボックス内で以下の関数が利用可能になる:
 * - addNode(formulaText) → nodeId
 * - setNodeFormula(nodeId, formulaText)
 * - getNodes() → WorkspaceNodeInfo[]
 * - connectMP(antecedentId, conditionalId) → nodeId
 * - addGoal(formulaText)
 * - removeNode(nodeId)
 * - setNodeRoleAxiom(nodeId)
 * - applyLayout()
 */
export const createWorkspaceBridges = (
  handler: WorkspaceCommandHandler,
): readonly NativeFunctionBridge[] => [
  { name: "addNode", fn: createAddNodeFn(handler) },
  { name: "setNodeFormula", fn: createSetNodeFormulaFn(handler) },
  { name: "getNodes", fn: createGetNodesFn(handler) },
  { name: "connectMP", fn: createConnectMPFn(handler) },
  { name: "addGoal", fn: createAddGoalFn(handler) },
  { name: "removeNode", fn: createRemoveNodeFn(handler) },
  { name: "setNodeRoleAxiom", fn: createSetNodeRoleAxiomFn(handler) },
  { name: "applyLayout", fn: createApplyLayoutFn(handler) },
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
    signature:
      "(antecedentId: string, conditionalId: string) => string",
    description:
      "Modus Ponens で2つのノードを接続し、結論ノードを作成する。結論ノードIDを返す。",
  },
  {
    name: "addGoal",
    signature: "(formulaText: string) => void",
    description: "ワークスペースにゴール（証明すべき目標）を追加する。",
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
    description:
      "ワークスペース上のノードにツリーレイアウトを自動適用する。",
  },
];

/**
 * ワークスペースブリッジ API の TypeScript 型定義テキストを生成する。
 * Monaco Editor の addExtraLib に渡す。
 */
export const generateWorkspaceBridgeTypeDefs = (): string => {
  const lines = WORKSPACE_BRIDGE_API_DEFS.map((def) => {
    const desc = def.description satisfies string;
    const name = def.name satisfies string;
    const sig = def.signature.replace(/^\(/, "(") satisfies string;
    return `/** ${desc satisfies string} */\ndeclare function ${name satisfies string}${sig satisfies string};\n`;
  });
  return lines.join("\n");
};
