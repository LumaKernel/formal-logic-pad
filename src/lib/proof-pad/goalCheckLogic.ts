/**
 * 証明目標（ゴール）達成判定の純粋ロジック。
 *
 * WorkspaceState.goals のゴール式がキャンバス上のどこかのノードで
 * 導出されているかを判定する。接続は不要。
 *
 * 変更時は goalCheckLogic.test.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { equalFormula } from "../logic-core/equality";
import { parseString } from "../logic-lang/parser";
import type { Formula } from "../logic-core/formula";
import type { WorkspaceNode, WorkspaceGoal } from "./workspaceState";

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
  if (!result.ok) return undefined;
  return result.formula;
}

// --- ゴール達成チェック ---

/**
 * ワークスペースのゴールが全て証明されているかチェックする。
 *
 * ゴール式と構造的に一致する式を持つノードがキャンバス上に存在すれば「達成」。
 * ゴールノードへの接続は不要（キャンバス上のどこかに一致するノードがあればよい）。
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
      const nodeResult = parseString(node.formulaText);
      if (!nodeResult.ok) continue;
      if (equalFormula(goalFormula, nodeResult.formula)) {
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
