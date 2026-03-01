/**
 * カット除去ステッパーの純粋ロジック。
 *
 * eliminateCutsWithSteps の結果を元に、
 * ステッパーUIに表示するためのデータを整形する。
 *
 * 変更時は cutEliminationStepperLogic.test.ts, CutEliminationStepper.tsx, index.ts も同期すること。
 */

import type {
  CutEliminationResult,
  CutEliminationStep,
  CutEliminationOptions,
} from "../logic-core/cutElimination";
import {
  eliminateCutsWithSteps,
  countCuts,
  isCutFree,
} from "../logic-core/cutElimination";
import type { ScProofNode, Sequent } from "../logic-core/sequentCalculus";
import { getScConclusion } from "../logic-core/sequentCalculus";
import { formatFormula } from "../logic-lang/formatUnicode";

// --- ステッパー表示データ ---

/** 各ステップの表示情報 */
export type StepperStepInfo = {
  /** ステップのインデックス（0始まり） */
  readonly index: number;
  /** ステップの説明テキスト */
  readonly description: string;
  /** このステップ時点のカット数 */
  readonly cutCount: number;
  /** このステップの depth パラメータ */
  readonly depth: number;
  /** このステップの rank パラメータ */
  readonly rank: number;
  /** 結論シーケントのフォーマット済みテキスト */
  readonly conclusionText: string;
};

/** ステッパー全体の表示データ */
export type CutEliminationStepperData = {
  /** 初期証明の情報 */
  readonly initialInfo: {
    /** 初期カット数 */
    readonly cutCount: number;
    /** 初期証明がカットフリーか */
    readonly isCutFree: boolean;
    /** 結論シーケントのフォーマット済みテキスト */
    readonly conclusionText: string;
  };
  /** ステップ一覧 */
  readonly steps: readonly StepperStepInfo[];
  /** 現在のステップインデックス（-1 = 初期状態、0以上 = ステップN） */
  readonly currentStepIndex: number;
  /** 総ステップ数 */
  readonly totalSteps: number;
  /** 結果 */
  readonly result: CutEliminationResult;
  /** 現在表示中の証明 */
  readonly currentProof: ScProofNode;
  /** 現在のカット数 */
  readonly currentCutCount: number;
};

// --- シーケントフォーマット ---

/**
 * シーケントを Unicode テキストとしてフォーマットする。
 */
export function formatSequentText(seq: Sequent): string {
  const antecedents = seq.antecedents.map(formatFormula).join(", ");
  const succedents = seq.succedents.map(formatFormula).join(", ");
  return `${antecedents satisfies string} \u22A2 ${succedents satisfies string}`;
}

// --- ステッパーデータ生成 ---

/**
 * ScProofNode からカット除去を実行し、ステッパー表示データを生成する。
 *
 * @param proof カットを含む可能性のある証明図
 * @param options カット除去オプション（ステップ上限など）
 * @returns ステッパー表示データ
 */
export function computeCutEliminationStepperData(
  proof: ScProofNode,
  options?: CutEliminationOptions,
): Omit<CutEliminationStepperData, "currentStepIndex"> {
  const initialCutCount = countCuts(proof);
  const initialIsCutFree = isCutFree(proof);
  const initialConclusion = getScConclusion(proof);
  const initialConclusionText = formatSequentText(initialConclusion);

  const { result, steps } = eliminateCutsWithSteps(proof, options);

  const stepInfos: readonly StepperStepInfo[] = steps.map((step, index) => ({
    index,
    description: step.description,
    cutCount: countCuts(step.proof),
    depth: step.depth,
    rank: step.rank,
    conclusionText: formatSequentText(getScConclusion(step.proof)),
  }));

  return {
    initialInfo: {
      cutCount: initialCutCount,
      isCutFree: initialIsCutFree,
      conclusionText: initialConclusionText,
    },
    steps: stepInfos,
    totalSteps: steps.length,
    result,
    currentProof: proof,
    currentCutCount: initialCutCount,
  };
}

/**
 * 現在のステップインデックスを元に、表示する証明と情報を解決する。
 *
 * @param baseData computeCutEliminationStepperData の結果
 * @param stepIndex 現在のステップインデックス（-1 = 初期状態）
 * @param originalProof 元の証明（ステップ -1 で表示）
 * @param rawSteps 生のステップ配列（proof 参照用）
 * @returns 完全なステッパーデータ
 */
export function resolveStepperState(
  baseData: Omit<CutEliminationStepperData, "currentStepIndex">,
  stepIndex: number,
  originalProof: ScProofNode,
  rawSteps: readonly CutEliminationStep[],
): CutEliminationStepperData {
  const clampedIndex = Math.max(
    -1,
    Math.min(stepIndex, baseData.totalSteps - 1),
  );

  let currentProof: ScProofNode;
  let currentCutCount: number;

  if (clampedIndex === -1) {
    currentProof = originalProof;
    currentCutCount = baseData.initialInfo.cutCount;
  } else {
    const step = rawSteps[clampedIndex];
    if (step !== undefined) {
      currentProof = step.proof;
      currentCutCount = countCuts(step.proof);
    } else {
      // フォールバック（到達不能だが防御的に）
      currentProof = originalProof;
      currentCutCount = baseData.initialInfo.cutCount;
    }
  }

  return {
    ...baseData,
    currentStepIndex: clampedIndex,
    currentProof,
    currentCutCount,
  };
}

// --- ステッパー操作 ---

/** ステッパー操作のアクション */
export type StepperAction =
  | { readonly type: "next" }
  | { readonly type: "prev" }
  | { readonly type: "first" }
  | { readonly type: "last" }
  | { readonly type: "goto"; readonly index: number };

/**
 * ステッパーアクションに基づいて次のステップインデックスを計算する。
 *
 * @param currentIndex 現在のステップインデックス
 * @param totalSteps 総ステップ数
 * @param action ステッパーアクション
 * @returns 次のステップインデックス
 */
export function applyStepperAction(
  currentIndex: number,
  totalSteps: number,
  action: StepperAction,
): number {
  switch (action.type) {
    case "next":
      return Math.min(currentIndex + 1, totalSteps - 1);
    case "prev":
      return Math.max(currentIndex - 1, -1);
    case "first":
      return -1;
    case "last":
      return totalSteps - 1;
    case "goto":
      return Math.max(-1, Math.min(action.index, totalSteps - 1));
  }
}

/**
 * 前に進めるかを判定する。
 */
export function canStepForward(
  currentIndex: number,
  totalSteps: number,
): boolean {
  return currentIndex < totalSteps - 1;
}

/**
 * 後ろに戻れるかを判定する。
 */
export function canStepBackward(currentIndex: number): boolean {
  return currentIndex > -1;
}
