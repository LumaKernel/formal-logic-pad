/**
 * 汎化規則（Gen）適用のための純粋ロジック。
 *
 * ワークスペース上のノードから論理式をパースし、Genを適用して結果を返す。
 * UI層（ProofWorkspace.tsx）から利用される。
 *
 * 変更時は genApplicationLogic.test.ts, ProofWorkspace.tsx, workspaceState.ts, index.ts も同期すること。
 */

import { Data, Either } from "effect";
import type { Formula } from "../logic-core/formula";
import { applyGeneralization } from "../logic-core/inferenceRule";
import { termVariable } from "../logic-core/term";
import { formatFormula } from "../logic-lang/formatUnicode";
import { parseNodeFormula } from "./mpApplicationLogic";
import type { WorkspaceState } from "./workspaceState";

// --- Genノードの検証結果型 ---

/** Gen適用の成功結果 */
export type GenApplicationSuccess = {
  readonly conclusion: Formula;
  readonly conclusionText: string;
};

/** Gen適用のエラー（Data.TaggedError） */
export class GenPremiseMissing extends Data.TaggedError(
  "GenPremiseMissing",
)<Record<string, never>> {}
export class GenPremiseParseError extends Data.TaggedError(
  "GenPremiseParseError",
)<{
  readonly nodeId: string;
}> {}
export class GenVariableNameEmpty extends Data.TaggedError(
  "GenVariableNameEmpty",
)<Record<string, never>> {}
export class GenGeneralizationNotEnabled extends Data.TaggedError(
  "GenGeneralizationNotEnabled",
)<Record<string, never>> {}
export class GenRuleError extends Data.TaggedError("GenRuleError")<{
  readonly message: string;
}> {}

export type GenApplicationError =
  | GenPremiseMissing
  | GenPremiseParseError
  | GenVariableNameEmpty
  | GenGeneralizationNotEnabled
  | GenRuleError;

/** Gen適用の結果型（Either: Right=成功, Left=エラー） */
export type GenApplicationResult = Either.Either<
  GenApplicationSuccess,
  GenApplicationError
>;

// --- Genノードの前提接続を取得 ---

/**
 * Genノード/derivedノードに関連する前提ノードのIDを取得する。
 * InferenceEdge（source of truth）から取得する。
 */
export function getGenPremise(
  state: WorkspaceState,
  genNodeId: string,
): string | undefined {
  const genEdge = state.inferenceEdges.find(
    (e) => e._tag === "gen" && e.conclusionNodeId === genNodeId,
  );
  if (genEdge && genEdge._tag === "gen") {
    return genEdge.premiseNodeId;
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
    return Either.left(new GenVariableNameEmpty({}));
  }

  const premiseNodeId = getGenPremise(state, genNodeId);

  if (premiseNodeId === undefined) {
    return Either.left(new GenPremiseMissing({}));
  }

  // ノードを取得
  const premiseNode = state.nodes.find((n) => n.id === premiseNodeId);

  /* v8 ignore start -- 防御的コード: 接続があるがノードが削除済みのケース（通常到達不能） */
  if (!premiseNode) {
    return Either.left(new GenPremiseMissing({}));
  }
  /* v8 ignore stop */

  // パース
  const premiseFormula = parseNodeFormula(premiseNode);
  if (!premiseFormula) {
    return Either.left(new GenPremiseParseError({ nodeId: premiseNodeId }));
  }

  // Gen適用
  const variable = termVariable(variableName.trim());
  const result = applyGeneralization(premiseFormula, variable, state.system);

  if (Either.isLeft(result)) {
    if (result.left._tag === "GeneralizationNotEnabled") {
      return Either.left(new GenGeneralizationNotEnabled({}));
    }
    /* v8 ignore start -- 防御的コード: GeneralizationNotEnabled以外のエラーは現時点では発生しない */
    return Either.left(new GenRuleError({ message: "Generalization failed" }));
    /* v8 ignore stop */
  }

  return Either.right({
    conclusion: result.right.conclusion,
    conclusionText: formatFormula(result.right.conclusion),
  });
}

// --- エラーメッセージ ---

/**
 * Gen適用エラーに対する人間向けメッセージを返す。
 */
export function getGenErrorMessage(error: GenApplicationError): string {
  switch (error._tag) {
    case "GenPremiseMissing":
      return "Connect a premise to apply Gen";
    case "GenPremiseParseError":
      return "Premise has invalid formula";
    case "GenVariableNameEmpty":
      return "Enter a variable name";
    case "GenGeneralizationNotEnabled":
      return "Gen is not enabled in this logic system";
    case "GenRuleError":
      return error.message;
  }
}
