/**
 * Modus Ponens適用のための純粋ロジック。
 *
 * ワークスペース上のノードから論理式をパースし、MPを適用して結果を返す。
 * UI層（ProofWorkspace.tsx）から利用される。
 *
 * 変更時は mpApplicationLogic.test.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { Data, Either } from "effect";
import type { Formula } from "../logic-core/formula";
import { equalFormula } from "../logic-core/equality";
import type { RuleApplicationError } from "../logic-core/inferenceRule";
import { applyModusPonens } from "../logic-core/inferenceRule";
import { parseString } from "../logic-lang/parser";
import { formatFormula } from "../logic-lang/formatUnicode";
import type { WorkspaceState, WorkspaceNode } from "./workspaceState";

// --- MPノードの検証結果型 ---

/** MPノードの前提接続の状態 */
export type MPPremiseState = {
  readonly leftNodeId: string | undefined;
  readonly rightNodeId: string | undefined;
};

/** MP適用の成功結果 */
export type MPApplicationSuccess = {
  readonly conclusion: Formula;
  readonly conclusionText: string;
};

/** MP適用のエラー（Data.TaggedError） */
export class LeftPremiseMissing extends Data.TaggedError(
  "LeftPremiseMissing",
)<Record<string, never>> {}
export class RightPremiseMissing extends Data.TaggedError(
  "RightPremiseMissing",
)<Record<string, never>> {}
export class BothPremisesMissing extends Data.TaggedError(
  "BothPremisesMissing",
)<Record<string, never>> {}
export class LeftParseError extends Data.TaggedError("LeftParseError")<{
  readonly nodeId: string;
}> {}
export class RightParseError extends Data.TaggedError("RightParseError")<{
  readonly nodeId: string;
}> {}
export class MPRuleError extends Data.TaggedError("MPRuleError")<{
  readonly error: RuleApplicationError;
}> {}

export type MPApplicationError =
  | LeftPremiseMissing
  | RightPremiseMissing
  | BothPremisesMissing
  | LeftParseError
  | RightParseError
  | MPRuleError;

/** MP適用の結果型（Either: Right=成功, Left=エラー） */
export type MPApplicationResult = Either.Either<
  MPApplicationSuccess,
  MPApplicationError
>;

// --- MPノードの前提接続を取得 ---

/**
 * MPノード/derivedノードに関連する前提ノードのIDを取得する。
 * InferenceEdge（source of truth）から取得する。
 */
export function getMPPremises(
  state: WorkspaceState,
  mpNodeId: string,
): MPPremiseState {
  const mpEdge = state.inferenceEdges.find(
    (e) => e._tag === "mp" && e.conclusionNodeId === mpNodeId,
  );
  if (mpEdge && mpEdge._tag === "mp") {
    return {
      leftNodeId: mpEdge.leftPremiseNodeId,
      rightNodeId: mpEdge.rightPremiseNodeId,
    };
  }

  return { leftNodeId: undefined, rightNodeId: undefined };
}

// --- ノードから論理式をパース ---

/**
 * ノードの formulaText を解析して Formula を返す。
 * パース失敗時は undefined。
 */
export function parseNodeFormula(node: WorkspaceNode): Formula | undefined {
  if (node.formulaText.trim() === "") return undefined;
  const result = parseString(node.formulaText);
  if (!result.ok) return undefined;
  return result.formula;
}

// --- MP適用のバリデーション ---

/**
 * MPノードの接続状態を検証し、適用結果を返す。
 *
 * premise-left: antecedent φ
 * premise-right: conditional φ→ψ
 *
 * 両方の前提が接続され、パース可能であればMP適用を試み、
 * 成功時は結論式（ψ）とそのテキスト表現を返す。
 */
export function validateMPApplication(
  state: WorkspaceState,
  mpNodeId: string,
): MPApplicationResult {
  const premises = getMPPremises(state, mpNodeId);

  // 両方欠けている場合
  if (premises.leftNodeId === undefined && premises.rightNodeId === undefined) {
    return Either.left(new BothPremisesMissing({}));
  }

  // 片方が欠けている場合
  if (premises.leftNodeId === undefined) {
    return Either.left(new LeftPremiseMissing({}));
  }
  if (premises.rightNodeId === undefined) {
    return Either.left(new RightPremiseMissing({}));
  }

  // ノードを取得
  const leftNode = state.nodes.find((n) => n.id === premises.leftNodeId);
  const rightNode = state.nodes.find((n) => n.id === premises.rightNodeId);

  /* v8 ignore start -- 防御的コード: 接続があるがノードが削除済みのケース（通常到達不能） */
  if (!leftNode) {
    return Either.left(new LeftPremiseMissing({}));
  }
  if (!rightNode) {
    return Either.left(new RightPremiseMissing({}));
  }
  /* v8 ignore stop */

  // パース
  const leftFormula = parseNodeFormula(leftNode);
  if (!leftFormula) {
    return Either.left(new LeftParseError({ nodeId: premises.leftNodeId }));
  }

  const rightFormula = parseNodeFormula(rightNode);
  if (!rightFormula) {
    return Either.left(new RightParseError({ nodeId: premises.rightNodeId }));
  }

  // MP適用
  const result = applyModusPonens(leftFormula, rightFormula);

  if (Either.isLeft(result)) {
    return Either.left(new MPRuleError({ error: result.left }));
  }

  return Either.right({
    conclusion: result.right.conclusion,
    conclusionText: formatFormula(result.right.conclusion),
  });
}

// --- MP互換ノード判定（ハイライト用） ---

/**
 * MP選択モードで左前提が選択済みの場合に、
 * 右前提として互換性のあるノードのIDセットを返す。
 *
 * 右前提は Implication(φ→ψ) の形で、かつ antecedent(φ) が
 * 左前提の formula と構造的に等しいノード。
 *
 * leftNodeId のノード自身は結果に含まれない。
 */
export function computeMPCompatibleNodeIds(
  nodes: readonly WorkspaceNode[],
  leftNodeId: string,
): ReadonlySet<string> {
  const leftNode = nodes.find((n) => n.id === leftNodeId);
  if (!leftNode) return new Set();

  const leftFormula = parseNodeFormula(leftNode);
  if (!leftFormula) return new Set();

  const compatible = new Set<string>();
  for (const node of nodes) {
    if (node.id === leftNodeId) continue;
    const formula = parseNodeFormula(node);
    if (!formula) continue;
    if (formula._tag !== "Implication") continue;
    if (equalFormula(leftFormula, formula.left)) {
      compatible.add(node.id);
    }
  }
  return compatible;
}

/**
 * MP選択モードで右前提が選択済みの場合に、
 * 左前提として互換性のあるノードのIDセットを返す。
 *
 * 右前提は Implication(φ→ψ) の形で、かつ antecedent(φ) が
 * 左前提候補ノードの formula と構造的に等しいノード。
 *
 * rightNodeId のノード自身は結果に含まれない。
 * 右前提のノードがImplicationでない場合は空セットを返す。
 */
export function computeMPLeftCompatibleNodeIds(
  nodes: readonly WorkspaceNode[],
  rightNodeId: string,
): ReadonlySet<string> {
  const rightNode = nodes.find((n) => n.id === rightNodeId);
  if (!rightNode) return new Set();

  const rightFormula = parseNodeFormula(rightNode);
  if (!rightFormula) return new Set();
  if (rightFormula._tag !== "Implication") return new Set();

  const antecedent = rightFormula.left;
  const compatible = new Set<string>();
  for (const node of nodes) {
    if (node.id === rightNodeId) continue;
    const formula = parseNodeFormula(node);
    if (!formula) continue;
    if (equalFormula(formula, antecedent)) {
      compatible.add(node.id);
    }
  }
  return compatible;
}

/**
 * ノードの論理式がImplication形式(φ→ψ)かどうかを判定する。
 * パース不能な場合はfalseを返す。
 */
export function isNodeImplication(node: WorkspaceNode): boolean {
  const formula = parseNodeFormula(node);
  if (!formula) return false;
  return formula._tag === "Implication";
}

// --- エラーメッセージ ---

/**
 * MP適用エラーに対する人間向けメッセージを返す。
 */
export function getMPErrorMessage(error: MPApplicationError): string {
  switch (error._tag) {
    case "BothPremisesMissing":
      return "Connect premises to apply MP";
    case "LeftPremiseMissing":
      return "Left premise (φ) not connected";
    case "RightPremiseMissing":
      return "Right premise (φ→ψ) not connected";
    case "LeftParseError":
      return "Left premise has invalid formula";
    case "RightParseError":
      return "Right premise has invalid formula";
    case "MPRuleError": {
      switch (error.error._tag) {
        case "NotAnImplication":
          return "Right premise must be an implication (φ→ψ)";
        case "PremiseMismatch":
          return "Left premise does not match antecedent of right premise";
        /* v8 ignore start -- exhaustive check: other error types not reachable from applyModusPonens */
        default:
          return "MP application failed";
        /* v8 ignore stop */
      }
    }
  }
}
