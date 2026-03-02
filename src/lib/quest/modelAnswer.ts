/**
 * クエスト模範解答の型定義・ビルダー・バリデーション。
 *
 * 模範解答は証明図の構造として保持し、ワークスペースへの変換は純粋関数で行う。
 * ノート自体ではなく、ステップのDAG構造で表現する。
 *
 * 変更時は modelAnswer.test.ts, builtinModelAnswers.ts も同期すること。
 */

import * as Either from "effect/Either";
import type { QuestDefinition, QuestId } from "./questDefinition";
import { resolveSystemPreset } from "./questStartLogic";
import {
  type WorkspaceState,
  createQuestWorkspace,
  addNode,
  applyMPAndConnect,
  applyGenAndConnect,
  applyTreeLayout,
} from "../proof-pad/workspaceState";
import {
  checkQuestGoalsWithAxioms,
  type QuestGoalCheckWithAxiomsResult,
} from "./questCompletionLogic";

// --- ステップ定義 ---

/**
 * 模範解答の1ステップ。
 *
 * - axiom: 公理インスタンスを直接記述（ユーザーがタイプする形）
 * - mp: 既存2ステップにMPを適用（leftIndex: 前件, rightIndex: 条件式）
 * - gen: 既存ステップにGen（汎化）を適用（premiseIndex: 前提, variableName: 束縛変数名）
 */
export type ModelAnswerStep =
  | {
      readonly _tag: "axiom";
      /** 公理インスタンスの式テキスト（DSL形式） */
      readonly formulaText: string;
    }
  | {
      readonly _tag: "mp";
      /** 前件ノードのステップインデックス（0始まり） */
      readonly leftIndex: number;
      /** 条件式ノードのステップインデックス（0始まり） */
      readonly rightIndex: number;
    }
  | {
      readonly _tag: "gen";
      /** 前提ノードのステップインデックス（0始まり） */
      readonly premiseIndex: number;
      /** 汎化する変数名 */
      readonly variableName: string;
    };

// --- 模範解答定義 ---

/** クエストの模範解答（イミュータブル） */
export type ModelAnswer = {
  /** 対応するクエストID */
  readonly questId: QuestId;
  /** ステップ列（インデックスで前ステップを参照するDAG） */
  readonly steps: readonly ModelAnswerStep[];
};

// --- ビルダー ---

/** ビルド結果 */
export type BuildModelAnswerResult =
  | {
      readonly _tag: "Ok";
      readonly workspace: WorkspaceState;
      readonly goalCheck: QuestGoalCheckWithAxiomsResult;
    }
  | {
      readonly _tag: "PresetNotFound";
      readonly presetId: string;
    }
  | {
      readonly _tag: "StepError";
      readonly stepIndex: number;
      readonly reason: string;
    };

/**
 * ModelAnswer から WorkspaceState を純粋に構築する。
 *
 * 1. resolveSystemPreset でDeductionSystemを取得
 * 2. createQuestWorkspace でゴール付きワークスペースを作成
 * 3. ステップを順に適用（addNode + applyMPAndConnect）
 * 4. applyTreeLayout で自動配置
 * 5. checkQuestGoalsWithAxioms でゴール達成を検証
 */
export function buildModelAnswerWorkspace(
  quest: QuestDefinition,
  answer: ModelAnswer,
): BuildModelAnswerResult {
  const preset = resolveSystemPreset(quest.systemPresetId);
  if (preset === undefined) {
    return { _tag: "PresetNotFound", presetId: quest.systemPresetId };
  }

  // ゴールのallowedAxiomIdsをクエスト定義から引き継ぐ
  /* v8 ignore start — allowedAxiomIds付きクエストの模範解答は後続イテレーションで追加 */
  const goals =
    quest.allowedAxiomIds !== undefined
      ? quest.goals.map((g) => ({
          ...g,
          allowedAxiomIds: g.allowedAxiomIds ?? quest.allowedAxiomIds,
        }))
      : quest.goals;
  /* v8 ignore stop */

  let ws = createQuestWorkspace(preset.deductionSystem, goals);

  // ステップインデックス → ノードID のマッピング
  const stepNodeIds: string[] = [];

  for (let i = 0; i < answer.steps.length; i++) {
    const step = answer.steps[i];
    /* v8 ignore start — 防御的ガード: 正常な配列アクセスでは到達しない */
    if (step === undefined) {
      return { _tag: "StepError", stepIndex: i, reason: "undefined step" };
    }
    /* v8 ignore stop */

    switch (step._tag) {
      case "axiom": {
        const nodeId = `node-${String(ws.nextNodeId) satisfies string}`;
        ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, step.formulaText);
        stepNodeIds.push(nodeId);
        break;
      }
      case "mp": {
        const leftNodeId = stepNodeIds[step.leftIndex];
        const rightNodeId = stepNodeIds[step.rightIndex];
        if (leftNodeId === undefined || rightNodeId === undefined) {
          return {
            _tag: "StepError",
            stepIndex: i,
            reason: `invalid index: left=${String(step.leftIndex) satisfies string}, right=${String(step.rightIndex) satisfies string}`,
          };
        }
        const result = applyMPAndConnect(ws, leftNodeId, rightNodeId, {
          x: 0,
          y: 0,
        });
        ws = result.workspace;
        if (Either.isLeft(result.validation)) {
          return {
            _tag: "StepError",
            stepIndex: i,
            reason: `MP validation failed`,
          };
        }
        stepNodeIds.push(result.mpNodeId);
        break;
      }
      case "gen": {
        const premiseNodeId = stepNodeIds[step.premiseIndex];
        if (premiseNodeId === undefined) {
          return {
            _tag: "StepError",
            stepIndex: i,
            reason: `invalid index: premise=${String(step.premiseIndex) satisfies string}`,
          };
        }
        const genResult = applyGenAndConnect(
          ws,
          premiseNodeId,
          step.variableName,
          { x: 0, y: 0 },
        );
        ws = genResult.workspace;
        if (Either.isLeft(genResult.validation)) {
          return {
            _tag: "StepError",
            stepIndex: i,
            reason: `Gen validation failed`,
          };
        }
        stepNodeIds.push(genResult.genNodeId);
        break;
      }
      /* v8 ignore start — exhaustive check */
      default: {
        const _: never = step;
        return {
          _tag: "StepError",
          stepIndex: i,
          reason: `unknown step type: ${String((_ as { readonly _tag: string })._tag) satisfies string}`,
        };
      }
      /* v8 ignore stop */
    }
  }

  // 自動配置
  ws = applyTreeLayout(ws, "bottom-to-top");

  // ゴール達成チェック
  const goalCheck = checkQuestGoalsWithAxioms(
    ws.goals,
    ws.nodes,
    ws.inferenceEdges,
    ws.system,
  );

  return { _tag: "Ok", workspace: ws, goalCheck };
}

// --- バリデータ ---

/** バリデーション結果 */
export type ValidateModelAnswerResult =
  | { readonly _tag: "Valid" }
  | { readonly _tag: "BuildError"; readonly error: BuildModelAnswerResult }
  | {
      readonly _tag: "GoalNotAchieved";
      readonly goalCheck: QuestGoalCheckWithAxiomsResult;
    };

/**
 * 模範解答がクエストのゴールを正しく達成しているか検証する。
 * テスト用の純粋関数。
 *
 * AllAchieved と AllAchievedButAxiomViolation の両方を Valid として扱う。
 * 模範解答は公理インスタンスを直接記述するため、SubstitutionEdge を経由しない。
 * そのため hasInstanceRootNodes が true になるが、これは正常な挙動。
 */
export function validateModelAnswer(
  quest: QuestDefinition,
  answer: ModelAnswer,
): ValidateModelAnswerResult {
  const buildResult = buildModelAnswerWorkspace(quest, answer);

  if (buildResult._tag !== "Ok") {
    return { _tag: "BuildError", error: buildResult };
  }

  if (
    buildResult.goalCheck._tag !== "AllAchieved" &&
    buildResult.goalCheck._tag !== "AllAchievedButAxiomViolation"
  ) {
    return { _tag: "GoalNotAchieved", goalCheck: buildResult.goalCheck };
  }

  return { _tag: "Valid" };
}
