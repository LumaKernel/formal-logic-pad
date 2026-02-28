/**
 * クエスト完了検出の純粋ロジック。
 *
 * ワークスペースの状態からステップ数を計算し、
 * クエスト完了を判定するための純粋関数を提供する。
 *
 * 変更時は questCompletionLogic.test.ts も同期すること。
 */

import { Either } from "effect";
import type { WorkspaceNode, WorkspaceGoal } from "../proof-pad/workspaceState";
import type { InferenceEdge } from "../proof-pad/inferenceEdge";
import type { ProofNodeKind } from "../proof-pad/proofNodeUI";
import type { LogicSystem, AxiomId } from "../logic-core/inferenceRule";
import { equalFormula } from "../logic-core/equality";
import { parseString } from "../logic-lang/parser";
import {
  getNodeAxiomIds,
  validateRootNodes,
  hasInstanceRoots,
} from "../proof-pad/dependencyLogic";

// --- ステップ数計算 ---

/**
 * ステップとしてカウントするノード種別。
 * 公理ノードと推論結果（derived）ノードがそれぞれ1ステップとなる。
 */
const STEP_NODE_KINDS: ReadonlySet<ProofNodeKind> = new Set(["axiom"]);

/**
 * ワークスペース上のノードからステップ数を計算する。
 *
 * ステップ数 = 公理ノード + MPノード + Genノードの合計。
 *
 * @param nodes ワークスペース上のノード一覧
 * @returns ステップ数
 */
export function computeStepCount(nodes: readonly WorkspaceNode[]): number {
  return nodes.filter((node) => STEP_NODE_KINDS.has(node.kind)).length;
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
 * goals配列の各ゴール式が、ノードのいずれかの式と一致すれば「達成」とみなす。
 *
 * @param goals ワークスペースのゴール一覧
 * @param nodes ワークスペース上のノード一覧
 * @returns クエストゴール達成チェック結果
 */
export function checkQuestGoals(
  goals: readonly WorkspaceGoal[],
  nodes: readonly WorkspaceNode[],
): QuestGoalCheckResult {
  if (goals.length === 0) {
    return { _tag: "NoGoals" };
  }

  let achievedCount = 0;
  for (const goal of goals) {
    const goalParsed = parseString(goal.formulaText.trim());
    if (Either.isLeft(goalParsed)) continue;

    const isAchieved = nodes.some((work) => {
      const workParsed = parseString(work.formulaText.trim());
      if (Either.isLeft(workParsed)) return false;
      return equalFormula(goalParsed.right, workParsed.right);
    });

    if (isAchieved) {
      achievedCount += 1;
    }
  }

  if (achievedCount >= goals.length) {
    return {
      _tag: "AllAchieved",
      stepCount: computeStepCount(nodes),
    };
  }

  return {
    _tag: "NotAllAchieved",
    achievedCount,
    totalCount: goals.length,
  };
}

// --- 公理制限付きゴール達成チェック ---

/** 公理制限チェック結果: ゴールごとの使用公理と制限違反 */
export type GoalAxiomCheckResult = {
  /** ゴールID */
  readonly goalId: string;
  /** 一致したワークノードID（未達成の場合はundefined） */
  readonly matchingNodeId: string | undefined;
  /** 使用された公理スキーマIDの集合 */
  readonly usedAxiomIds: ReadonlySet<AxiomId>;
  /** このゴールで許可された公理スキーマID（undefinedは制限なし） */
  readonly allowedAxiomIds: readonly AxiomId[] | undefined;
  /** 制限違反の公理スキーマID（制限なしまたは制限内の場合は空） */
  readonly violatingAxiomIds: ReadonlySet<AxiomId>;
  /**
   * 代入インスタンスが直接ルートノードに配置されているかどうか。
   * true の場合、公理スキーマ → SubstitutionEdge → インスタンスの形式で導出すべき。
   */
  readonly hasInstanceRootNodes: boolean;
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
 * goals配列から各ゴールについて:
 * 1. 一致するワークノードを探す
 * 2. 一致したノードが依存する公理スキーマIDを特定
 * 3. ゴールの allowedAxiomIds と比較して制限違反をチェック
 *
 * @param goals ワークスペースのゴール一覧
 * @param nodes ワークスペース上のノード一覧
 * @param inferenceEdges ワークスペース上の推論エッジ一覧
 * @param system 論理体系設定
 * @returns 公理制限付きゴールチェック結果
 */
export function checkQuestGoalsWithAxioms(
  goals: readonly WorkspaceGoal[],
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
  system: LogicSystem,
): QuestGoalCheckWithAxiomsResult {
  if (goals.length === 0) {
    return { _tag: "NoGoals" };
  }

  const goalResults: GoalAxiomCheckResult[] = [];
  let achievedCount = 0;
  let hasAxiomViolation = false;

  for (const goal of goals) {
    const goalParsed = parseString(goal.formulaText.trim());
    if (Either.isLeft(goalParsed)) {
      goalResults.push({
        goalId: goal.id,
        matchingNodeId: undefined,
        usedAxiomIds: new Set(),
        allowedAxiomIds: goal.allowedAxiomIds,
        violatingAxiomIds: new Set(),
        hasInstanceRootNodes: false,
      });
      continue;
    }

    // 一致するワークノードを探す
    let matchingNode: WorkspaceNode | undefined;
    for (const work of nodes) {
      const workParsed = parseString(work.formulaText.trim());
      if (Either.isLeft(workParsed)) continue;
      if (equalFormula(goalParsed.right, workParsed.right)) {
        matchingNode = work;
        break;
      }
    }

    if (matchingNode === undefined) {
      goalResults.push({
        goalId: goal.id,
        matchingNodeId: undefined,
        usedAxiomIds: new Set(),
        allowedAxiomIds: goal.allowedAxiomIds,
        violatingAxiomIds: new Set(),
        hasInstanceRootNodes: false,
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

    // ルートノードのインスタンス直接配置をチェック
    const rootValidations = validateRootNodes(
      matchingNode.id,
      nodes,
      inferenceEdges,
      system,
    );
    const goalHasInstanceRoots = hasInstanceRoots(rootValidations);

    if (goalHasInstanceRoots) {
      hasAxiomViolation = true;
    }

    goalResults.push({
      goalId: goal.id,
      matchingNodeId: matchingNode.id,
      usedAxiomIds,
      allowedAxiomIds: goal.allowedAxiomIds,
      violatingAxiomIds,
      hasInstanceRootNodes: goalHasInstanceRoots,
    });
  }

  if (achievedCount < goals.length) {
    return {
      _tag: "NotAllAchieved",
      achievedCount,
      totalCount: goals.length,
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
