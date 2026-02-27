/**
 * 証明目標（ゴール）達成判定の純粋ロジック。
 *
 * ノードの role === "goal" をゴールとして扱い、
 * ゴールノードへの incoming connection があり、
 * 接続元ノードが同じ式を導出していれば達成とみなす。
 *
 * 変更時は goalCheckLogic.test.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { equalFormula } from "../logic-core/equality";
import { parseString } from "../logic-lang/parser";
import type { Formula } from "../logic-core/formula";
import type { WorkspaceNode, WorkspaceConnection } from "./workspaceState";

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
 * ゴールノードに incoming connection があり、その接続元ノードの式が
 * ゴール式と構造的に一致していれば「達成」とみなす。
 * ゴールノードに接続がない場合は式が一致するノードが存在しても未達成。
 *
 * @param nodes ワークスペース上のノード一覧
 * @param connections ワークスペース上の接続一覧
 * @returns ゴールチェック結果
 */
export function checkGoal(
  nodes: readonly WorkspaceNode[],
  connections: readonly WorkspaceConnection[],
): GoalCheckResult {
  const goalNodes = nodes.filter((n) => n.role === "goal");
  if (goalNodes.length === 0) {
    return { _tag: "GoalNotSet" };
  }

  // ノードIDからノードを引くMap
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

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

    // ゴールノードへの incoming connection の接続元ノードから一致するものを探す
    const incomingConnections = connections.filter(
      (c) => c.toNodeId === goalNode.id,
    );

    let matchingNodeId: string | undefined;
    for (const conn of incomingConnections) {
      const sourceNode = nodeById.get(conn.fromNodeId);
      if (sourceNode === undefined) continue;
      if (sourceNode.formulaText.trim() === "") continue;
      const sourceResult = parseString(sourceNode.formulaText);
      if (!sourceResult.ok) continue;
      if (equalFormula(goalFormula, sourceResult.formula)) {
        matchingNodeId = sourceNode.id;
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
