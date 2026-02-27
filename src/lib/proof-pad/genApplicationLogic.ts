/**
 * 汎化規則（Gen）適用のための純粋ロジック。
 *
 * ワークスペース上のノードから論理式をパースし、Genを適用して結果を返す。
 * UI層（ProofWorkspace.tsx）から利用される。
 *
 * 変更時は genApplicationLogic.test.ts, ProofWorkspace.tsx, workspaceState.ts, index.ts も同期すること。
 */

import type { Formula } from "../logic-core/formula";
import { applyGeneralization } from "../logic-core/inferenceRule";
import { termVariable } from "../logic-core/term";
import { formatFormula } from "../logic-lang/formatUnicode";
import { parseNodeFormula } from "./mpApplicationLogic";
import type { WorkspaceState } from "./workspaceState";

// --- Genノードの検証結果型 ---

/** Gen適用の成功結果 */
export type GenApplicationSuccess = {
  readonly _tag: "Success";
  readonly conclusion: Formula;
  readonly conclusionText: string;
};

/** Gen適用のエラー */
export type GenApplicationError =
  | { readonly _tag: "PremiseMissing" }
  | { readonly _tag: "PremiseParseError"; readonly nodeId: string }
  | { readonly _tag: "VariableNameEmpty" }
  | { readonly _tag: "GeneralizationNotEnabled" }
  | {
      readonly _tag: "RuleError";
      readonly message: string;
    };

/** Gen適用の結果型 */
export type GenApplicationResult = GenApplicationSuccess | GenApplicationError;

// --- Genノードの前提接続を取得 ---

/**
 * Genノード/derivedノードに関連する前提ノードのIDを取得する。
 *
 * 優先: InferenceEdge（source of truth）から取得。
 * フォールバック: レガシーのポートベース接続（premise）から取得。
 */
export function getGenPremise(
  state: WorkspaceState,
  genNodeId: string,
): string | undefined {
  // InferenceEdge から取得
  const genEdge = state.inferenceEdges.find(
    (e) => e._tag === "gen" && e.conclusionNodeId === genNodeId,
  );
  if (genEdge && genEdge._tag === "gen") {
    return genEdge.premiseNodeId;
  }

  // レガシーフォールバック: ポートベース接続
  for (const conn of state.connections) {
    if (conn.toNodeId === genNodeId && conn.toPortId === "premise") {
      return conn.fromNodeId;
    }
  }
  return undefined;
}

// --- Gen適用のバリデーション ---

/**
 * Genノードの接続状態を検証し、適用結果を返す。
 *
 * premise: 前提 φ
 * variableName: 量化する変数名 x
 *
 * 前提が接続され、パース可能であればGen適用を試み、
 * 成功時は結論式（∀x.φ）とそのテキスト表現を返す。
 */
export function validateGenApplication(
  state: WorkspaceState,
  genNodeId: string,
  variableName: string,
): GenApplicationResult {
  if (variableName.trim() === "") {
    return { _tag: "VariableNameEmpty" };
  }

  const premiseNodeId = getGenPremise(state, genNodeId);

  if (premiseNodeId === undefined) {
    return { _tag: "PremiseMissing" };
  }

  // ノードを取得
  const premiseNode = state.nodes.find((n) => n.id === premiseNodeId);

  /* v8 ignore start -- 防御的コード: 接続があるがノードが削除済みのケース（通常到達不能） */
  if (!premiseNode) {
    return { _tag: "PremiseMissing" };
  }
  /* v8 ignore stop */

  // パース
  const premiseFormula = parseNodeFormula(premiseNode);
  if (!premiseFormula) {
    return { _tag: "PremiseParseError", nodeId: premiseNodeId };
  }

  // Gen適用
  const variable = termVariable(variableName.trim());
  const result = applyGeneralization(premiseFormula, variable, state.system);

  if (result._tag === "Error") {
    if (result.error._tag === "GeneralizationNotEnabled") {
      return { _tag: "GeneralizationNotEnabled" };
    }
    /* v8 ignore start -- 防御的コード: GeneralizationNotEnabled以外のエラーは現時点では発生しない */
    return { _tag: "RuleError", message: "Generalization failed" };
    /* v8 ignore stop */
  }

  return {
    _tag: "Success",
    conclusion: result.conclusion,
    conclusionText: formatFormula(result.conclusion),
  };
}

// --- エラーメッセージ ---

/**
 * Gen適用エラーに対する人間向けメッセージを返す。
 */
export function getGenErrorMessage(error: GenApplicationError): string {
  switch (error._tag) {
    case "PremiseMissing":
      return "Connect a premise to apply Gen";
    case "PremiseParseError":
      return "Premise has invalid formula";
    case "VariableNameEmpty":
      return "Enter a variable name";
    case "GeneralizationNotEnabled":
      return "Gen is not enabled in this logic system";
    case "RuleError":
      return error.message;
  }
}
