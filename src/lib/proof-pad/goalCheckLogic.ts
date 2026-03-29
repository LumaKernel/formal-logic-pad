/**
 * 証明目標（ゴール）達成判定の純粋ロジック。
 *
 * WorkspaceState.goals のゴール式がキャンバス上のどこかのノードで
 * 導出されているかを判定する。接続は不要。
 *
 * 変更時は goalCheckLogic.test.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { Either } from "effect";
import { equivalentFormula } from "../logic-core/equality";
import type { LogicSystem } from "../logic-core/inferenceRule";
import { identifyAxiom } from "../logic-core/inferenceRule";
import { parseString } from "../logic-lang/parser";
import type { Formula } from "../logic-core/formula";
import type { InferenceEdge } from "./inferenceEdge";
import { getInferenceEdgePremiseNodeIds } from "./inferenceEdge";
import type { WorkspaceNode, WorkspaceGoal } from "./workspaceState";
import {
  splitSequentTextParts,
  type SequentTextParts,
} from "./scApplicationLogic";

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
  if (Either.isLeft(result)) return undefined;
  return result.right;
}

// --- ノード式のパース ---

/**
 * ノードのformulaTextからFormulaを抽出する。
 *
 * 1. まず直接パースを試みる（通常の論理式）
 * 2. 失敗した場合、AT署名付き論理式（"T:φ" / "F:φ" 形式）として解析し、
 *    符号を除去した論理式部分を返す（ATのゴール判定: ルートF:φの枝が全閉→φが定理）
 * 3. 失敗した場合、シーケントテキスト（"Γ ⇒ Δ" 形式）として解析し、
 *    前件が空で後件が1つの場合にその論理式を返す（SC/TABの定理表現）
 *
 * @param sequentTexts SCノードの構造化データ（指定時は splitSequentTextParts の再パースをスキップ）
 */
export function parseNodeFormula(
  formulaText: string,
  sequentTexts?: SequentTextParts,
): Formula | undefined {
  const trimmed = formulaText.trim();
  if (trimmed === "") return undefined;

  // 直接パースを試みる
  const directResult = parseString(trimmed);
  if (Either.isRight(directResult)) return directResult.right;

  // AT署名付き論理式として解析（"T:φ" / "F:φ"）
  if (
    trimmed.length >= 3 &&
    (trimmed.startsWith("T:") || trimmed.startsWith("F:"))
  ) {
    const formulaPart = trimmed.slice(2).trim();
    if (formulaPart !== "") {
      const signedResult = parseString(formulaPart);
      if (Either.isRight(signedResult)) return signedResult.right;
    }
  }

  // シーケントテキストとして解析（sequentTexts があればそれを直接利用）
  const parts =
    sequentTexts ??
    (trimmed.includes("⇒") ? splitSequentTextParts(trimmed) : undefined);
  if (parts !== undefined) {
    // 前件が空で後件が1つの場合: " ⇒ φ" → φ が定理
    if (
      parts.antecedentTexts.length === 0 &&
      parts.succedentTexts.length === 1
    ) {
      const succText = parts.succedentTexts[0];
      /* v8 ignore start -- 防御的: length === 1 で保証されるため succText は常に存在する */
      if (succText !== undefined) {
        /* v8 ignore stop */
        const succResult = parseString(succText);
        if (Either.isRight(succResult)) return succResult.right;
      }
    }
  }

  return undefined;
}

// --- 公理テンプレート一致判定 ---

/**
 * 論理式が体系の公理インスタンス（代入込み）であるかを判定する。
 * identifyAxiom は代入マッチングを行うため、テンプレートそのものだけでなく
 * 具体的なインスタンス（例: A3[phi:=psi, psi:=phi]）も認識する。
 */
function isRecognizedAxiom(formula: Formula, system: LogicSystem): boolean {
  const result = identifyAxiom(formula, system);
  return result._tag === "Ok" || result._tag === "TheoryAxiom";
}

// --- ゴール達成チェック ---

/**
 * ワークスペースのゴールが全て証明されているかチェックする。
 *
 * ゴール式と構造的に一致する式を持つノードがキャンバス上に存在すれば「達成」。
 * ゴールノードへの接続は不要（キャンバス上のどこかに一致するノードがあればよい）。
 *
 * SC（シーケント計算）では、ノードのformulaTextがシーケント形式（" ⇒ φ"）の場合、
 * 前件が空で後件が1つなら、その後件がゴール式と一致するかをチェックする。
 *
 * @param goals ワークスペースのゴール一覧
 * @param nodes ワークスペース上のノード一覧
 * @param inferenceEdges 推論エッジ一覧（指定時はルートノードの公理検証を行う）
 * @param system 論理体系設定（inferenceEdges と併せて指定）
 * @returns ゴールチェック結果
 */
export function checkGoal(
  goals: readonly WorkspaceGoal[],
  nodes: readonly WorkspaceNode[],
  inferenceEdges?: readonly InferenceEdge[],
  system?: LogicSystem,
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
    // inferenceEdges が指定されていれば、孤立ノード（推論エッジに未参加）をスキップする。
    // Hilbert系では公理テンプレートに一致する孤立ノードのみ許可。
    // SC/TAB/ND/AT系では孤立ノードは一律スキップ（推論エッジに参加していないと達成扱いしない）。
    const hasAxiomSystem =
      system !== undefined &&
      (system.propositionalAxioms.size > 0 ||
        system.predicateLogic ||
        (system.theoryAxioms?.length ?? 0) > 0);
    const doStandaloneCheck = inferenceEdges !== undefined;
    let matchingNodeId: string | undefined;
    for (const node of nodes) {
      if (node.formulaText.trim() === "") continue;
      const nodeFormula = parseNodeFormula(node.formulaText, node.sequentTexts);
      if (nodeFormula === undefined) continue;
      if (equivalentFormula(goalFormula, nodeFormula)) {
        // 孤立ノード検証: どの推論エッジにも参加していないノード（結論でも前提でもない）は
        // 公理テンプレートに一致しない限り「未証明」としてスキップ。
        // これにより「ゴール式を手動入力しただけ」のケースを排除しつつ、
        // SC/TABのルートノード（前提として参加）やMP結論（結論として参加）は許可する。
        if (doStandaloneCheck) {
          const isConnected = inferenceEdges.some(
            (e) =>
              e.conclusionNodeId === node.id ||
              getInferenceEdgePremiseNodeIds(e).includes(node.id),
          );
          if (
            !isConnected &&
            !(hasAxiomSystem && isRecognizedAxiom(nodeFormula, system))
          ) {
            continue;
          }
        }
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
