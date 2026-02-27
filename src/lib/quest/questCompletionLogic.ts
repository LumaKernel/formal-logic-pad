/**
 * クエスト完了検出の純粋ロジック。
 *
 * ワークスペースの状態からステップ数を計算し、
 * クエスト完了を判定するための純粋関数を提供する。
 *
 * 変更時は questCompletionLogic.test.ts も同期すること。
 */

import type { WorkspaceNode } from "../proof-pad/workspaceState";
import type { InferenceEdge } from "../proof-pad/inferenceEdge";
import type { ProofNodeKind } from "../proof-pad/proofNodeUI";
import type { LogicSystem, AxiomId } from "../logic-core/inferenceRule";
import { equalFormula } from "../logic-core/equality";
import { parseString } from "../logic-lang/parser";
import { getNodeAxiomIds } from "../proof-pad/dependencyLogic";

// --- ステップ数計算 ---

/**
 * ステップとしてカウントするノード種別。
 * 公理ノードと推論結果（derived）ノードがそれぞれ1ステップとなる。
 */
const STEP_NODE_KINDS: ReadonlySet<ProofNodeKind> = new Set([
  "axiom",
  "derived",
]);

/**
 * ワークスペース上のノードからステップ数を計算する。
 *
 * ステップ数 = 公理ノード + MPノード + Genノードの合計。
 * conclusionノードやゴールノードはカウントしない。
 *
 * @param nodes ワークスペース上のノード一覧
 * @returns ステップ数
 */
export function computeStepCount(nodes: readonly WorkspaceNode[]): number {
  return nodes.filter(
    (node) =>
      STEP_NODE_KINDS.has(node.kind) &&
      node.protection !== "quest-goal" &&
      node.role !== "goal",
  ).length;
}

// --- クエストゴール達成チェック ---

/** クエストゴール達成結果 */
export type QuestGoalCheckResult =
  | { readonly _tag: "NoGoals" }
  | {
      readonly _tag: "NotAllAchieved";
      readonly achievedCount: number;
      readonly totalCount: number;
    }
  | { readonly _tag: "AllAchieved"; readonly stepCount: number };

/**
 * クエストモードのワークスペースで、すべてのゴールが達成されているかチェックする。
 *
 * ゴールノード（protection: "quest-goal"）の各formulaが、
 * 非保護ノードのいずれかのformulaと一致すれば「達成」とみなす。
 *
 * @param nodes ワークスペース上のノード一覧
 * @returns クエストゴール達成チェック結果
 */
export function checkQuestGoals(
  nodes: readonly WorkspaceNode[],
): QuestGoalCheckResult {
  const goalNodes = nodes.filter((n) => n.protection === "quest-goal");
  if (goalNodes.length === 0) {
    return { _tag: "NoGoals" };
  }

  const workNodes = nodes.filter((n) => n.protection !== "quest-goal");

  let achievedCount = 0;
  for (const goal of goalNodes) {
    const goalParsed = parseString(goal.formulaText.trim());
    if (!goalParsed.ok) continue;

    const isAchieved = workNodes.some((work) => {
      const workParsed = parseString(work.formulaText.trim());
      if (!workParsed.ok) return false;
      return equalFormula(goalParsed.formula, workParsed.formula);
    });

    if (isAchieved) {
      achievedCount += 1;
    }
  }

  if (achievedCount >= goalNodes.length) {
    return {
      _tag: "AllAchieved",
      stepCount: computeStepCount(nodes),
    };
  }

  return {
    _tag: "NotAllAchieved",
    achievedCount,
    totalCount: goalNodes.length,
  };
}

// --- 公理制限付きゴール達成チェック ---

/** 公理制限チェック結果: ゴールごとの使用公理と制限違反 */
export type GoalAxiomCheckResult = {
  /** ゴールノードID */
  readonly goalNodeId: string;
  /** 一致したワークノードID（未達成の場合はundefined） */
  readonly matchingNodeId: string | undefined;
  /** 使用された公理スキーマIDの集合 */
  readonly usedAxiomIds: ReadonlySet<AxiomId>;
  /** このゴールで許可された公理スキーマID（undefinedは制限なし） */
  readonly allowedAxiomIds: readonly AxiomId[] | undefined;
  /** 制限違反の公理スキーマID（制限なしまたは制限内の場合は空） */
  readonly violatingAxiomIds: ReadonlySet<AxiomId>;
};

/** 公理制限付きゴールチェック結果 */
export type QuestGoalCheckWithAxiomsResult =
  | { readonly _tag: "NoGoals" }
  | {
      readonly _tag: "NotAllAchieved";
      readonly achievedCount: number;
      readonly totalCount: number;
      readonly goalResults: readonly GoalAxiomCheckResult[];
    }
  | {
      readonly _tag: "AllAchieved";
      readonly stepCount: number;
      readonly goalResults: readonly GoalAxiomCheckResult[];
    }
  | {
      readonly _tag: "AllAchievedButAxiomViolation";
      readonly stepCount: number;
      readonly goalResults: readonly GoalAxiomCheckResult[];
    };

/**
 * 公理制限付きでクエストゴールの達成状況をチェックする。
 *
 * 基本的な達成判定に加えて、各ゴールに対して:
 * 1. 一致するワークノードを探す
 * 2. 一致したノードが依存する公理スキーマIDを特定
 * 3. ゴールの allowedAxiomIds と比較して制限違反をチェック
 *
 * @param nodes ワークスペース上のノード一覧
 * @param inferenceEdges ワークスペース上の推論エッジ一覧
 * @param system 論理体系設定
 * @returns 公理制限付きゴールチェック結果
 */
export function checkQuestGoalsWithAxioms(
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
  system: LogicSystem,
): QuestGoalCheckWithAxiomsResult {
  const goalNodes = nodes.filter((n) => n.protection === "quest-goal");
  if (goalNodes.length === 0) {
    return { _tag: "NoGoals" };
  }

  const workNodes = nodes.filter((n) => n.protection !== "quest-goal");

  const goalResults: GoalAxiomCheckResult[] = [];
  let achievedCount = 0;
  let hasAxiomViolation = false;

  for (const goal of goalNodes) {
    const goalParsed = parseString(goal.formulaText.trim());
    if (!goalParsed.ok) {
      goalResults.push({
        goalNodeId: goal.id,
        matchingNodeId: undefined,
        usedAxiomIds: new Set(),
        allowedAxiomIds: goal.allowedAxiomIds,
        violatingAxiomIds: new Set(),
      });
      continue;
    }

    // 一致するワークノードを探す
    let matchingNode: WorkspaceNode | undefined;
    for (const work of workNodes) {
      const workParsed = parseString(work.formulaText.trim());
      if (!workParsed.ok) continue;
      if (equalFormula(goalParsed.formula, workParsed.formula)) {
        matchingNode = work;
        break;
      }
    }

    if (matchingNode === undefined) {
      goalResults.push({
        goalNodeId: goal.id,
        matchingNodeId: undefined,
        usedAxiomIds: new Set(),
        allowedAxiomIds: goal.allowedAxiomIds,
        violatingAxiomIds: new Set(),
      });
      continue;
    }

    achievedCount += 1;

    // 使用された公理を特定
    const usedAxiomIds = getNodeAxiomIds(
      matchingNode.id,
      nodes,
      inferenceEdges,
      system,
    );

    // 制限違反をチェック
    const violatingAxiomIds = computeViolatingAxiomIds(
      usedAxiomIds,
      goal.allowedAxiomIds,
    );

    if (violatingAxiomIds.size > 0) {
      hasAxiomViolation = true;
    }

    goalResults.push({
      goalNodeId: goal.id,
      matchingNodeId: matchingNode.id,
      usedAxiomIds,
      allowedAxiomIds: goal.allowedAxiomIds,
      violatingAxiomIds,
    });
  }

  if (achievedCount < goalNodes.length) {
    return {
      _tag: "NotAllAchieved",
      achievedCount,
      totalCount: goalNodes.length,
      goalResults,
    };
  }

  if (hasAxiomViolation) {
    return {
      _tag: "AllAchievedButAxiomViolation",
      stepCount: computeStepCount(nodes),
      goalResults,
    };
  }

  return {
    _tag: "AllAchieved",
    stepCount: computeStepCount(nodes),
    goalResults,
  };
}

/**
 * 使用された公理IDのうち、許可されていないものを返す。
 *
 * @param usedAxiomIds 使用された公理スキーマIDの集合
 * @param allowedAxiomIds 許可された公理スキーマIDのリスト（undefinedは制限なし）
 * @returns 制限違反の公理スキーマIDの集合
 */
export function computeViolatingAxiomIds(
  usedAxiomIds: ReadonlySet<AxiomId>,
  allowedAxiomIds: readonly AxiomId[] | undefined,
): ReadonlySet<AxiomId> {
  if (allowedAxiomIds === undefined) {
    return new Set();
  }
  const allowedSet = new Set(allowedAxiomIds);
  const violations = new Set<AxiomId>();
  for (const axiomId of usedAxiomIds) {
    if (!allowedSet.has(axiomId)) {
      violations.add(axiomId);
    }
  }
  return violations;
}
