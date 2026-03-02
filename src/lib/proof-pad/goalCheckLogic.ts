/**
 * 証明目標（ゴール）達成判定の純粋ロジック。
 *
 * WorkspaceState.goals のゴール式がキャンバス上のどこかのノードで
 * 導出されているかを判定する。接続は不要。
 *
 * 変更時は goalCheckLogic.test.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { Either } from "effect";
import { equalFormula } from "../logic-core/equality";
import { parseString } from "../logic-lang/parser";
import type { Formula } from "../logic-core/formula";
import type { WorkspaceNode, WorkspaceGoal } from "./workspaceState";
import { splitSequentTextParts } from "./scApplicationLogic";

// --- ゴール達成チェックの結果型 ---

/** ゴールがまだ設定されていない（goals が空） */
export type GoalNotSet = {
  readonly _tag: "GoalNotSet";
};

/** すべてのゴールが達成された */
export type GoalAllAchieved = {
  readonly _tag: "GoalAllAchieved";
  readonly achievedGoals: readonly AchievedGoalInfo[];
};

/** 一部のゴールが未達成 */
export type GoalPartiallyAchieved = {
  readonly _tag: "GoalPartiallyAchieved";
  readonly achievedCount: number;
  readonly totalCount: number;
  readonly goalStatuses: readonly GoalStatus[];
};

/** 個別ゴールの状態 */
export type GoalStatus = {
  readonly goalId: string;
  readonly goalFormula: Formula | undefined;
  readonly achieved: boolean;
  readonly matchingNodeId: string | undefined;
};

/** 達成されたゴールの情報 */
export type AchievedGoalInfo = {
  readonly goalId: string;
  readonly goalFormula: Formula;
  readonly matchingNodeId: string;
};

/** ゴールチェック結果 */
export type GoalCheckResult =
  | GoalNotSet
  | GoalAllAchieved
  | GoalPartiallyAchieved;

// --- ゴール式のパース ---

/**
 * ゴールテキストをパースしてFormulaを返す。
 * 空文字列の場合はundefined（ゴール未設定）。
 * パース失敗時もundefined。
 */
export function parseGoalFormula(goalText: string): Formula | undefined {
  const trimmed = goalText.trim();
  if (trimmed === "") return undefined;
  const result = parseString(trimmed);
  if (Either.isLeft(result)) return undefined;
  return result.right;
}

// --- ノード式のパース ---

/**
 * ノードのformulaTextからFormulaを抽出する。
 *
 * 1. まず直接パースを試みる（通常の論理式）
 * 2. 失敗した場合、シーケントテキスト（"Γ ⇒ Δ" 形式）として解析し、
 *    前件が空で後件が1つの場合にその論理式を返す（SC/TABの定理表現）
 */
export function parseNodeFormula(formulaText: string): Formula | undefined {
  const trimmed = formulaText.trim();
  if (trimmed === "") return undefined;

  // 直接パースを試みる
  const directResult = parseString(trimmed);
  if (Either.isRight(directResult)) return directResult.right;

  // シーケントテキストとして解析
  if (trimmed.includes("⇒")) {
    const parts = splitSequentTextParts(trimmed);
    // 前件が空で後件が1つの場合: " ⇒ φ" → φ が定理
    if (
      parts.antecedentTexts.length === 0 &&
      parts.succedentTexts.length === 1
    ) {
      const succText = parts.succedentTexts[0];
      if (succText !== undefined) {
        const succResult = parseString(succText);
        if (Either.isRight(succResult)) return succResult.right;
      }
    }
  }

  return undefined;
}

// --- ゴール達成チェック ---

/**
 * ワークスペースのゴールが全て証明されているかチェックする。
 *
 * ゴール式と構造的に一致する式を持つノードがキャンバス上に存在すれば「達成」。
 * ゴールノードへの接続は不要（キャンバス上のどこかに一致するノードがあればよい）。
 *
 * SC（シーケント計算）では、ノードのformulaTextがシーケント形式（" ⇒ φ"）の場合、
 * 前件が空で後件が1つなら、その後件がゴール式と一致するかをチェックする。
 *
 * @param goals ワークスペースのゴール一覧
 * @param nodes ワークスペース上のノード一覧
 * @returns ゴールチェック結果
 */
export function checkGoal(
  goals: readonly WorkspaceGoal[],
  nodes: readonly WorkspaceNode[],
): GoalCheckResult {
  if (goals.length === 0) {
    return { _tag: "GoalNotSet" };
  }

  const goalStatuses: GoalStatus[] = [];
  const achievedGoals: AchievedGoalInfo[] = [];

  for (const goal of goals) {
    const goalFormula = parseGoalFormula(goal.formulaText);
    if (goalFormula === undefined) {
      goalStatuses.push({
        goalId: goal.id,
        goalFormula: undefined,
        achieved: false,
        matchingNodeId: undefined,
      });
      continue;
    }

    // キャンバス上のどこかのノードの式がゴール式と一致するか
    let matchingNodeId: string | undefined;
    for (const node of nodes) {
      if (node.formulaText.trim() === "") continue;
      const nodeFormula = parseNodeFormula(node.formulaText);
      if (nodeFormula === undefined) continue;
      if (equalFormula(goalFormula, nodeFormula)) {
        matchingNodeId = node.id;
        break;
      }
    }

    if (matchingNodeId !== undefined) {
      achievedGoals.push({
        goalId: goal.id,
        goalFormula,
        matchingNodeId,
      });
    }

    goalStatuses.push({
      goalId: goal.id,
      goalFormula,
      achieved: matchingNodeId !== undefined,
      matchingNodeId,
    });
  }

  if (achievedGoals.length >= goals.length) {
    return {
      _tag: "GoalAllAchieved",
      achievedGoals,
    };
  }

  return {
    _tag: "GoalPartiallyAchieved",
    achievedCount: achievedGoals.length,
    totalCount: goals.length,
    goalStatuses,
  };
}
