/**
 * ゴール一覧パネルの純粋ロジック。
 *
 * WorkspaceGoal と GoalCheckResult を元に、
 * パネルに表示するためのデータを整形する。
 *
 * 変更時は goalPanelLogic.test.ts, GoalPanel.tsx, index.ts も同期すること。
 */

import type { GoalCheckResult, GoalStatus } from "./goalCheckLogic";
import type { WorkspaceGoal } from "./workspaceState";
import { parseGoalFormula } from "./goalCheckLogic";

// --- ゴールパネル表示データ ---

/** 個別ゴールの表示データ */
export type GoalPanelItem = {
  /** ゴールID */
  readonly id: string;
  /** ゴール式のDSLテキスト */
  readonly formulaText: string;
  /** 表示ラベル（ゴールに設定されていれば） */
  readonly label: string | undefined;
  /** 許可された公理IDのリスト（制限がなければundefined） */
  readonly allowedAxiomIds: readonly string[] | undefined;
  /** 達成状態 */
  readonly status: GoalPanelItemStatus;
};

/** ゴールの達成状態 */
export type GoalPanelItemStatus = "achieved" | "not-achieved" | "parse-error";

/** ゴールパネル全体の表示データ */
export type GoalPanelData = {
  /** ゴール一覧 */
  readonly items: readonly GoalPanelItem[];
  /** 達成済みゴール数 */
  readonly achievedCount: number;
  /** 総ゴール数 */
  readonly totalCount: number;
};

// --- ゴールパネルデータ生成 ---

/**
 * GoalStatus から GoalPanelItemStatus を算出する。
 */
function toItemStatus(goalStatus: GoalStatus): GoalPanelItemStatus {
  if (goalStatus.achieved) return "achieved";
  if (goalStatus.goalFormula === undefined) return "parse-error";
  return "not-achieved";
}

/**
 * WorkspaceGoal と GoalCheckResult からパネル表示データを生成する。
 *
 * @param goals ワークスペースのゴール一覧
 * @param checkResult ゴールチェック結果
 * @returns パネル表示データ
 */
export function computeGoalPanelData(
  goals: readonly WorkspaceGoal[],
  checkResult: GoalCheckResult,
): GoalPanelData {
  if (goals.length === 0) {
    return {
      items: [],
      achievedCount: 0,
      totalCount: 0,
    };
  }

  switch (checkResult._tag) {
    case "GoalNotSet":
      return {
        items: [],
        achievedCount: 0,
        totalCount: 0,
      };

    case "GoalAllAchieved": {
      const items: GoalPanelItem[] = goals.map((goal) => ({
        id: goal.id,
        formulaText: goal.formulaText,
        label: goal.label,
        allowedAxiomIds: goal.allowedAxiomIds,
        status: "achieved" as const,
      }));
      return {
        items,
        achievedCount: goals.length,
        totalCount: goals.length,
      };
    }

    case "GoalPartiallyAchieved": {
      const statusMap = new Map(
        checkResult.goalStatuses.map((gs) => [gs.goalId, gs]),
      );
      const items: GoalPanelItem[] = goals.map((goal) => {
        const gs = statusMap.get(goal.id);
        return {
          id: goal.id,
          formulaText: goal.formulaText,
          label: goal.label,
          allowedAxiomIds: goal.allowedAxiomIds,
          status:
            gs !== undefined ? toItemStatus(gs) : computeFallbackStatus(goal),
        };
      });
      return {
        items,
        achievedCount: checkResult.achievedCount,
        totalCount: checkResult.totalCount,
      };
    }
  }
}

/**
 * GoalStatus が見つからなかった場合のフォールバック。
 * ゴール式のパース可否で状態を判定する。
 */
function computeFallbackStatus(goal: WorkspaceGoal): GoalPanelItemStatus {
  const parsed = parseGoalFormula(goal.formulaText);
  if (parsed === undefined) return "parse-error";
  return "not-achieved";
}
