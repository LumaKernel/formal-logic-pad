/**
 * 証明目標（ゴール）達成判定の純粋ロジック。
 *
 * ワークスペース上のノードが目標式と一致するかを検査する。
 * UI層（ProofWorkspace.tsx）から利用される。
 *
 * 変更時は goalCheckLogic.test.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { equalFormula } from "../logic-core/equality";
import { parseString } from "../logic-lang/parser";
import type { Formula } from "../logic-core/formula";
import type { WorkspaceNode } from "./workspaceState";

// --- ゴール達成チェックの結果型 ---

/** ゴールがまだ設定されていない */
export type GoalNotSet = {
  readonly _tag: "GoalNotSet";
};

/** ゴール式のパースに失敗 */
export type GoalParseError = {
  readonly _tag: "GoalParseError";
};

/** ゴール未達成（ワークスペース上に一致するノードがない） */
export type GoalNotAchieved = {
  readonly _tag: "GoalNotAchieved";
  readonly goalFormula: Formula;
};

/** ゴール達成（一致するノードが見つかった） */
export type GoalAchieved = {
  readonly _tag: "GoalAchieved";
  readonly goalFormula: Formula;
  readonly matchingNodeId: string;
};

/** ゴールチェック結果 */
export type GoalCheckResult =
  | GoalNotSet
  | GoalParseError
  | GoalNotAchieved
  | GoalAchieved;

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
 * ワークスペース上のノードからゴール式と一致するものを探す。
 *
 * @param goalText ゴールのDSLテキスト
 * @param nodes ワークスペース上のノード一覧
 * @returns ゴールチェック結果
 */
export function checkGoal(
  goalText: string,
  nodes: readonly WorkspaceNode[],
): GoalCheckResult {
  const trimmed = goalText.trim();
  if (trimmed === "") {
    return { _tag: "GoalNotSet" };
  }

  const goalFormula = parseGoalFormula(trimmed);
  if (goalFormula === undefined) {
    return { _tag: "GoalParseError" };
  }

  // ノードの論理式をパースして比較
  for (const node of nodes) {
    if (node.formulaText.trim() === "") continue;
    const nodeResult = parseString(node.formulaText);
    if (!nodeResult.ok) continue;

    if (equalFormula(goalFormula, nodeResult.formula)) {
      return {
        _tag: "GoalAchieved",
        goalFormula,
        matchingNodeId: node.id,
      };
    }
  }

  return {
    _tag: "GoalNotAchieved",
    goalFormula,
  };
}
