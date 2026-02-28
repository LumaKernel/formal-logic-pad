/**
 * クエスト完了検出の純粋ロジック。
 *
 * ワークスペースの状態からステップ数を計算し、
 * クエスト完了を判定するための純粋関数を提供する。
 *
 * Effect版（checkQuestGoalsEffect / checkQuestGoalsWithAxiomsEffect）と
 * 同期ラッパー（checkQuestGoals / checkQuestGoalsWithAxioms）を提供する。
 *
 * 変更時は questCompletionLogic.test.ts も同期すること。
 */

import { Either, Effect } from "effect";
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

// --- ゴール一致判定ヘルパー ---

/**
 * ゴール式に一致するワークノードを探す。
 * パース不能なゴールはundefinedを返す。
 */
function findMatchingNode(
  goal: WorkspaceGoal,
  nodes: readonly WorkspaceNode[],
): WorkspaceNode | undefined {
  const goalParsed = parseString(goal.formulaText.trim());
  if (Either.isLeft(goalParsed)) return undefined;

  for (const work of nodes) {
    const workParsed = parseString(work.formulaText.trim());
    if (Either.isLeft(workParsed)) continue;
    if (equalFormula(goalParsed.right, workParsed.right)) {
      return work;
    }
  }
  return undefined;
}

/**
 * ゴール式が達成されているかチェックする。
 * パース不能なゴールはfalseを返す。
 */
function isGoalAchieved(
  goal: WorkspaceGoal,
  nodes: readonly WorkspaceNode[],
): boolean {
  return findMatchingNode(goal, nodes) !== undefined;
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
 * Effect版。
 *
 * goals配列の各ゴール式が、ノードのいずれかの式と一致すれば「達成」とみなす。
 *
 * @param goals ワークスペースのゴール一覧
 * @param nodes ワークスペース上のノード一覧
 * @returns Effect<QuestGoalCheckResult>
 */
export const checkQuestGoalsEffect = (
  goals: readonly WorkspaceGoal[],
  nodes: readonly WorkspaceNode[],
): Effect.Effect<QuestGoalCheckResult> =>
  Effect.gen(function* () {
    if (goals.length === 0) {
      return { _tag: "NoGoals" } as const;
    }

    const achievedResults = yield* Effect.all(
      goals.map((goal) => Effect.sync(() => isGoalAchieved(goal, nodes))),
    );

    const achievedCount = achievedResults.filter(Boolean).length;

    if (achievedCount >= goals.length) {
      return {
        _tag: "AllAchieved",
        stepCount: computeStepCount(nodes),
      } as const;
    }

    return {
      _tag: "NotAllAchieved",
      achievedCount,
      totalCount: goals.length,
    } as const;
  });

/**
 * 同期ラッパー。
 */
export function checkQuestGoals(
  goals: readonly WorkspaceGoal[],
  nodes: readonly WorkspaceNode[],
): QuestGoalCheckResult {
  return Effect.runSync(checkQuestGoalsEffect(goals, nodes));
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
 * 単一ゴールの公理制限チェックを実行する。
 * 結果としてGoalAxiomCheckResultを返す。
 */
const checkSingleGoalWithAxioms = (
  goal: WorkspaceGoal,
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
  system: LogicSystem,
): Effect.Effect<GoalAxiomCheckResult> =>
  Effect.gen(function* () {
    const matchingNode = yield* Effect.sync(() =>
      findMatchingNode(goal, nodes),
    );

    if (matchingNode === undefined) {
      return {
        goalId: goal.id,
        matchingNodeId: undefined,
        usedAxiomIds: new Set<AxiomId>(),
        allowedAxiomIds: goal.allowedAxiomIds,
        violatingAxiomIds: new Set<AxiomId>(),
        hasInstanceRootNodes: false,
      };
    }

    // 使用された公理を特定
    const usedAxiomIds = yield* Effect.sync(() =>
      getNodeAxiomIds(matchingNode.id, nodes, inferenceEdges, system),
    );

    // 制限違反をチェック
    const violatingAxiomIds = yield* Effect.sync(() =>
      computeViolatingAxiomIds(usedAxiomIds, goal.allowedAxiomIds),
    );

    // ルートノードのインスタンス直接配置をチェック
    const goalHasInstanceRoots = yield* Effect.sync(() => {
      const rootValidations = validateRootNodes(
        matchingNode.id,
        nodes,
        inferenceEdges,
        system,
      );
      return hasInstanceRoots(rootValidations);
    });

    return {
      goalId: goal.id,
      matchingNodeId: matchingNode.id,
      usedAxiomIds,
      allowedAxiomIds: goal.allowedAxiomIds,
      violatingAxiomIds,
      hasInstanceRootNodes: goalHasInstanceRoots,
    };
  });

/**
 * 公理制限付きでクエストゴールの達成状況をチェックする。
 * Effect版。
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
 * @returns Effect<QuestGoalCheckWithAxiomsResult>
 */
export const checkQuestGoalsWithAxiomsEffect = (
  goals: readonly WorkspaceGoal[],
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
  system: LogicSystem,
): Effect.Effect<QuestGoalCheckWithAxiomsResult> =>
  Effect.gen(function* () {
    if (goals.length === 0) {
      return { _tag: "NoGoals" } as const;
    }

    // 各ゴールのチェックを Effect.all で集約
    const goalResults = yield* Effect.all(
      goals.map((goal) =>
        checkSingleGoalWithAxioms(goal, nodes, inferenceEdges, system),
      ),
    );

    const achievedCount = goalResults.filter(
      (r) => r.matchingNodeId !== undefined,
    ).length;

    const hasAxiomViolation = goalResults.some(
      (r) => r.violatingAxiomIds.size > 0 || r.hasInstanceRootNodes,
    );

    if (achievedCount < goals.length) {
      return {
        _tag: "NotAllAchieved",
        achievedCount,
        totalCount: goals.length,
        goalResults,
      } as const;
    }

    if (hasAxiomViolation) {
      return {
        _tag: "AllAchievedButAxiomViolation",
        stepCount: computeStepCount(nodes),
        goalResults,
      } as const;
    }

    return {
      _tag: "AllAchieved",
      stepCount: computeStepCount(nodes),
      goalResults,
    } as const;
  });

/**
 * 同期ラッパー。
 */
export function checkQuestGoalsWithAxioms(
  goals: readonly WorkspaceGoal[],
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
  system: LogicSystem,
): QuestGoalCheckWithAxiomsResult {
  return Effect.runSync(
    checkQuestGoalsWithAxiomsEffect(goals, nodes, inferenceEdges, system),
  );
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
