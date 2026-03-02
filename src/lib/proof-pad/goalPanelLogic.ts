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
import type { Formula } from "../logic-core/formula";
import type { AxiomPaletteItem } from "./axiomPaletteLogic";

// --- ゴールパネル表示データ ---

/** 許可された公理の詳細情報 */
export type AllowedAxiomDetail = {
  /** 公理ID */
  readonly id: string;
  /** 公理の表示名（例: "A1 (K)"） */
  readonly displayName: string;
  /** 公理テンプレートの論理式AST */
  readonly formula: Formula;
};

/** 個別ゴールの表示データ */
export type GoalPanelItem = {
  /** ゴールID */
  readonly id: string;
  /** ゴール式のDSLテキスト */
  readonly formulaText: string;
  /** パース済みの論理式AST（パース失敗時はundefined） */
  readonly formula: Formula | undefined;
  /** 表示ラベル（ゴールに設定されていれば） */
  readonly label: string | undefined;
  /** 許可された公理IDのリスト（制限がなければundefined） */
  readonly allowedAxiomIds: readonly string[] | undefined;
  /** 許可された公理の詳細情報（表示名・数式付き。制限がなければundefined） */
  readonly allowedAxiomDetails: readonly AllowedAxiomDetail[] | undefined;
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
 * allowedAxiomIds から公理の詳細情報を解決する。
 *
 * @param allowedAxiomIds 許可された公理IDのリスト（undefinedなら無制限）
 * @param availableAxioms 論理体系で利用可能な全公理
 * @returns 許可された公理の詳細情報（undefinedなら無制限）
 */
function resolveAllowedAxiomDetails(
  allowedAxiomIds: readonly string[] | undefined,
  availableAxioms: readonly AxiomPaletteItem[],
): readonly AllowedAxiomDetail[] | undefined {
  if (allowedAxiomIds === undefined) return undefined;
  const axiomMap = new Map(availableAxioms.map((a) => [a.id, a]));
  return allowedAxiomIds.flatMap((id) => {
    const axiom = axiomMap.get(id);
    if (axiom === undefined) return [];
    return [
      {
        id: axiom.id,
        displayName: axiom.displayName,
        formula: axiom.template,
      },
    ];
  });
}

/**
 * WorkspaceGoal と GoalCheckResult からパネル表示データを生成する。
 *
 * @param goals ワークスペースのゴール一覧
 * @param checkResult ゴールチェック結果
 * @param availableAxioms 論理体系で利用可能な全公理（公理詳細の解決に使用）
 * @returns パネル表示データ
 */
export function computeGoalPanelData(
  goals: readonly WorkspaceGoal[],
  checkResult: GoalCheckResult,
  availableAxioms: readonly AxiomPaletteItem[] = [],
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
      const achievedMap = new Map(
        checkResult.achievedGoals.map((ag) => [ag.goalId, ag.goalFormula]),
      );
      const items: GoalPanelItem[] = goals.map((goal) => ({
        id: goal.id,
        formulaText: goal.formulaText,
        formula: achievedMap.get(goal.id) ?? parseGoalFormula(goal.formulaText),
        label: goal.label,
        allowedAxiomIds: goal.allowedAxiomIds,
        allowedAxiomDetails: resolveAllowedAxiomDetails(
          goal.allowedAxiomIds,
          availableAxioms,
        ),
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
          formula: gs?.goalFormula ?? parseGoalFormula(goal.formulaText),
          label: goal.label,
          allowedAxiomIds: goal.allowedAxiomIds,
          allowedAxiomDetails: resolveAllowedAxiomDetails(
            goal.allowedAxiomIds,
            availableAxioms,
          ),
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
