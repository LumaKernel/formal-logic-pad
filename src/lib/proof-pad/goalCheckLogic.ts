/**
 * 証明目標（ゴール）達成判定の純粋ロジック。
 *
 * ノードの role === "goal" をゴールとして扱い、
 * 他のノードが同じ式を導出していれば達成とみなす。
 *
 * 変更時は goalCheckLogic.test.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { equalFormula } from "../logic-core/equality";
import { parseString } from "../logic-lang/parser";
import type { Formula } from "../logic-core/formula";
import type { WorkspaceNode } from "./workspaceState";

// --- ゴール達成チェックの結果型 ---

/** ゴールがまだ設定されていない（role="goal" のノードがない） */
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
  readonly goalNodeId: string;
  readonly goalFormula: Formula | undefined;
  readonly achieved: boolean;
  readonly matchingNodeId: string | undefined;
};

/** 達成されたゴールの情報 */
export type AchievedGoalInfo = {
  readonly goalNodeId: string;
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
 * ワークスペース上の role="goal" ノードが全て証明されているかチェックする。
 *
 * ゴールノードの式と一致する式を持つ非ゴールノードが存在すれば「達成」とみなす。
 *
 * @param nodes ワークスペース上のノード一覧
 * @returns ゴールチェック結果
 */
export function checkGoal(
  nodes: readonly WorkspaceNode[],
): GoalCheckResult {
  const goalNodes = nodes.filter((n) => n.role === "goal");
  if (goalNodes.length === 0) {
    return { _tag: "GoalNotSet" };
  }

  // ゴールノード以外のノード（証明の根拠となるノード）
  const workNodes = nodes.filter((n) => n.role !== "goal");

  const goalStatuses: GoalStatus[] = [];
  const achievedGoals: AchievedGoalInfo[] = [];

  for (const goalNode of goalNodes) {
    const goalFormula = parseGoalFormula(goalNode.formulaText);
    if (goalFormula === undefined) {
      goalStatuses.push({
        goalNodeId: goalNode.id,
        goalFormula: undefined,
        achieved: false,
        matchingNodeId: undefined,
      });
      continue;
    }

    // ゴール式と一致するワークノードを探す
    let matchingNodeId: string | undefined;
    for (const work of workNodes) {
      if (work.formulaText.trim() === "") continue;
      const workResult = parseString(work.formulaText);
      if (!workResult.ok) continue;
      if (equalFormula(goalFormula, workResult.formula)) {
        matchingNodeId = work.id;
        break;
      }
    }

    if (matchingNodeId !== undefined) {
      achievedGoals.push({
        goalNodeId: goalNode.id,
        goalFormula,
        matchingNodeId,
      });
    }

    goalStatuses.push({
      goalNodeId: goalNode.id,
      goalFormula,
      achieved: matchingNodeId !== undefined,
      matchingNodeId,
    });
  }

  if (achievedGoals.length >= goalNodes.length) {
    return {
      _tag: "GoalAllAchieved",
      achievedGoals,
    };
  }

  return {
    _tag: "GoalPartiallyAchieved",
    achievedCount: achievedGoals.length,
    totalCount: goalNodes.length,
    goalStatuses,
  };
}
