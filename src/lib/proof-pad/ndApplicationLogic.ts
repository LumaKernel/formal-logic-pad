/**
 * 自然演繹(ND)規則適用のための純粋ロジック。
 *
 * ワークスペース上のノードから論理式をパースし、ND規則を適用して結果を返す。
 * UI層（ProofWorkspace.tsx）から利用される。
 *
 * 各ND規則は前提の論理式から結論の論理式を自動計算する。
 * - 導入規則(I): 構造を組み立てて結論を生成
 * - 除去規則(E): 構造を分解して結論を取り出す
 *
 * 変更時は ndApplicationLogic.test.ts, workspaceState.ts, index.ts も同期すること。
 */

import { Data, Effect, Either } from "effect";
import type { Formula } from "../logic-core/formula";
import {
  Implication,
  Conjunction,
  Disjunction,
  Negation,
  implication,
  conjunction,
  disjunction,
} from "../logic-core/formula";
import { equalFormula } from "../logic-core/equality";
import { formatFormula } from "../logic-lang/formatUnicode";
import { parseString } from "../logic-lang/parser";
import { parseNodeFormula } from "./mpApplicationLogic";
import type { WorkspaceState, WorkspaceNode } from "./workspaceState";
import type { NdInferenceEdge } from "./inferenceEdge";

// --- ND適用の結果型 ---

/** ND適用の成功結果（結論が計算された） */
export type NdApplicationSuccess = {
  readonly _tag: "nd-success";
  readonly conclusion: Formula;
  readonly conclusionText: string;
};

// --- ND適用のエラー型 ---

/** 前提が未接続 */
export class NdPremiseMissing extends Data.TaggedError("NdPremiseMissing")<{
  readonly premiseLabel: string;
}> {}

/** 前提のパースエラー */
export class NdPremiseParseError extends Data.TaggedError(
  "NdPremiseParseError",
)<{
  readonly premiseLabel: string;
  readonly nodeId: string;
}> {}

/** 追加論理式のパースエラー（∨I の追加辺等） */
export class NdAdditionalFormulaParseError extends Data.TaggedError(
  "NdAdditionalFormulaParseError",
)<{
  readonly label: string;
}> {}

/** 前提の構造が規則の要件を満たさない */
export class NdStructuralError extends Data.TaggedError("NdStructuralError")<{
  readonly message: string;
}> {}

/** 仮定打ち消しの論理式パースエラー */
export class NdDischargedFormulaParseError extends Data.TaggedError(
  "NdDischargedFormulaParseError",
)<Record<string, never>> {}

/** ∨E で左右のケースの結論が一致しない */
export class NdCaseConclusionMismatch extends Data.TaggedError(
  "NdCaseConclusionMismatch",
)<{
  readonly leftConclusionText: string;
  readonly rightConclusionText: string;
}> {}

export type NdApplicationError =
  | NdPremiseMissing
  | NdPremiseParseError
  | NdAdditionalFormulaParseError
  | NdStructuralError
  | NdDischargedFormulaParseError
  | NdCaseConclusionMismatch;

/**
 * EFQ規則の検証成功結果。
 * EFQは結論を自動計算できないため、結論テキストの更新は行わない。
 */
export type NdEfqValidResult = {
  readonly _tag: "efq-valid";
};

/** ND適用の成功結果: 通常の結論計算 or EFQの検証成功 */
export type NdValidationSuccess = NdApplicationSuccess | NdEfqValidResult;

/** ND適用の結果型（Either: Right=成功, Left=エラー） */
export type NdApplicationResult = Either.Either<
  NdValidationSuccess,
  NdApplicationError
>;

// --- ヘルパー ---

/**
 * テキストから論理式をパースする。
 */
function parseFormulaText(text: string): Formula | undefined {
  if (text.trim() === "") return undefined;
  const result = parseString(text);
  if (Either.isLeft(result)) return undefined;
  return result.right;
}

/**
 * 前提ノードを取得・パースする共通処理。
 */
function resolvePremise(
  state: WorkspaceState,
  premiseNodeId: string | undefined,
  premiseLabel: string,
): Effect.Effect<
  { readonly node: WorkspaceNode; readonly formula: Formula },
  NdPremiseMissing | NdPremiseParseError
> {
  return Effect.gen(function* () {
    if (premiseNodeId === undefined) {
      return yield* Effect.fail(new NdPremiseMissing({ premiseLabel }));
    }
    const node = state.nodes.find((n) => n.id === premiseNodeId);
    /* v8 ignore start -- 防御的コード: 接続があるがノードが削除済み */
    if (!node) {
      return yield* Effect.fail(new NdPremiseMissing({ premiseLabel }));
    }
    /* v8 ignore stop */
    const formula = parseNodeFormula(node);
    if (!formula) {
      return yield* Effect.fail(
        new NdPremiseParseError({ premiseLabel, nodeId: premiseNodeId }),
      );
    }
    return { node, formula };
  });
}

/**
 * 成功結果を作成する共通処理。
 */
function makeSuccess(conclusion: Formula): NdApplicationSuccess {
  return {
    _tag: "nd-success",
    conclusion,
    conclusionText: formatFormula(conclusion),
  };
}

// --- 各ND規則のバリデーション ---

/**
 * →I (Implication Intro): 前提ψの証明 + 打ち消し仮定φ → φ→ψ
 */
const validateNdImplicationIntroEffect = (
  state: WorkspaceState,
  edge: Extract<NdInferenceEdge, { readonly _tag: "nd-implication-intro" }>,
): Effect.Effect<NdApplicationSuccess, NdApplicationError> =>
  Effect.gen(function* () {
    const premise = yield* resolvePremise(state, edge.premiseNodeId, "premise");
    const dischargedFormula = parseFormulaText(edge.dischargedFormulaText);
    if (!dischargedFormula) {
      return yield* Effect.fail(new NdDischargedFormulaParseError({}));
    }
    const conclusion = implication(dischargedFormula, premise.formula);
    return makeSuccess(conclusion);
  });

/**
 * →E (Implication Elim = MP): φ と φ→ψ → ψ
 */
const validateNdImplicationElimEffect = (
  state: WorkspaceState,
  edge: Extract<NdInferenceEdge, { readonly _tag: "nd-implication-elim" }>,
): Effect.Effect<NdApplicationSuccess, NdApplicationError> =>
  Effect.gen(function* () {
    const left = yield* resolvePremise(
      state,
      edge.leftPremiseNodeId,
      "left premise (φ)",
    );
    const right = yield* resolvePremise(
      state,
      edge.rightPremiseNodeId,
      "right premise (φ→ψ)",
    );
    if (!(right.formula instanceof Implication)) {
      return yield* Effect.fail(
        new NdStructuralError({
          message: "Right premise must be an implication (φ→ψ)",
        }),
      );
    }
    if (!equalFormula(left.formula, right.formula.left)) {
      return yield* Effect.fail(
        new NdStructuralError({
          message: "Left premise does not match antecedent of right premise",
        }),
      );
    }
    return makeSuccess(right.formula.right);
  });

/**
 * ∧I (Conjunction Intro): φ と ψ → φ∧ψ
 */
const validateNdConjunctionIntroEffect = (
  state: WorkspaceState,
  edge: Extract<NdInferenceEdge, { readonly _tag: "nd-conjunction-intro" }>,
): Effect.Effect<NdApplicationSuccess, NdApplicationError> =>
  Effect.gen(function* () {
    const left = yield* resolvePremise(
      state,
      edge.leftPremiseNodeId,
      "left premise (φ)",
    );
    const right = yield* resolvePremise(
      state,
      edge.rightPremiseNodeId,
      "right premise (ψ)",
    );
    const conclusion = conjunction(left.formula, right.formula);
    return makeSuccess(conclusion);
  });

/**
 * ∧E_L (Conjunction Elim Left): φ∧ψ → φ
 */
const validateNdConjunctionElimLeftEffect = (
  state: WorkspaceState,
  edge: Extract<NdInferenceEdge, { readonly _tag: "nd-conjunction-elim-left" }>,
): Effect.Effect<NdApplicationSuccess, NdApplicationError> =>
  Effect.gen(function* () {
    const premise = yield* resolvePremise(
      state,
      edge.premiseNodeId,
      "premise (φ∧ψ)",
    );
    if (!(premise.formula instanceof Conjunction)) {
      return yield* Effect.fail(
        new NdStructuralError({
          message: "Premise must be a conjunction (φ∧ψ)",
        }),
      );
    }
    return makeSuccess(premise.formula.left);
  });

/**
 * ∧E_R (Conjunction Elim Right): φ∧ψ → ψ
 */
const validateNdConjunctionElimRightEffect = (
  state: WorkspaceState,
  edge: Extract<
    NdInferenceEdge,
    { readonly _tag: "nd-conjunction-elim-right" }
  >,
): Effect.Effect<NdApplicationSuccess, NdApplicationError> =>
  Effect.gen(function* () {
    const premise = yield* resolvePremise(
      state,
      edge.premiseNodeId,
      "premise (φ∧ψ)",
    );
    if (!(premise.formula instanceof Conjunction)) {
      return yield* Effect.fail(
        new NdStructuralError({
          message: "Premise must be a conjunction (φ∧ψ)",
        }),
      );
    }
    return makeSuccess(premise.formula.right);
  });

/**
 * ∨I_L (Disjunction Intro Left): φ → φ∨ψ
 * addedRightText からψをパースして付加。
 */
const validateNdDisjunctionIntroLeftEffect = (
  state: WorkspaceState,
  edge: Extract<
    NdInferenceEdge,
    { readonly _tag: "nd-disjunction-intro-left" }
  >,
): Effect.Effect<NdApplicationSuccess, NdApplicationError> =>
  Effect.gen(function* () {
    const premise = yield* resolvePremise(
      state,
      edge.premiseNodeId,
      "premise (φ)",
    );
    const addedRight = parseFormulaText(edge.addedRightText);
    if (!addedRight) {
      return yield* Effect.fail(
        new NdAdditionalFormulaParseError({ label: "right disjunct (ψ)" }),
      );
    }
    const conclusion = disjunction(premise.formula, addedRight);
    return makeSuccess(conclusion);
  });

/**
 * ∨I_R (Disjunction Intro Right): ψ → φ∨ψ
 * addedLeftText からφをパースして付加。
 */
const validateNdDisjunctionIntroRightEffect = (
  state: WorkspaceState,
  edge: Extract<
    NdInferenceEdge,
    { readonly _tag: "nd-disjunction-intro-right" }
  >,
): Effect.Effect<NdApplicationSuccess, NdApplicationError> =>
  Effect.gen(function* () {
    const premise = yield* resolvePremise(
      state,
      edge.premiseNodeId,
      "premise (ψ)",
    );
    const addedLeft = parseFormulaText(edge.addedLeftText);
    if (!addedLeft) {
      return yield* Effect.fail(
        new NdAdditionalFormulaParseError({ label: "left disjunct (φ)" }),
      );
    }
    const conclusion = disjunction(addedLeft, premise.formula);
    return makeSuccess(conclusion);
  });

/**
 * ∨E (Disjunction Elim):
 * φ∨ψ と φ→χ の証明 と ψ→χ の証明 → χ
 */
const validateNdDisjunctionElimEffect = (
  state: WorkspaceState,
  edge: Extract<NdInferenceEdge, { readonly _tag: "nd-disjunction-elim" }>,
): Effect.Effect<NdApplicationSuccess, NdApplicationError> =>
  Effect.gen(function* () {
    const disjPremise = yield* resolvePremise(
      state,
      edge.disjunctionPremiseNodeId,
      "disjunction premise (φ∨ψ)",
    );
    if (!(disjPremise.formula instanceof Disjunction)) {
      return yield* Effect.fail(
        new NdStructuralError({
          message: "Disjunction premise must be a disjunction (φ∨ψ)",
        }),
      );
    }
    const leftCase = yield* resolvePremise(
      state,
      edge.leftCasePremiseNodeId,
      "left case premise (φ→χ)",
    );
    const rightCase = yield* resolvePremise(
      state,
      edge.rightCasePremiseNodeId,
      "right case premise (ψ→χ)",
    );
    // 左右のケースの結論が一致するか検証
    if (!equalFormula(leftCase.formula, rightCase.formula)) {
      return yield* Effect.fail(
        new NdCaseConclusionMismatch({
          leftConclusionText: formatFormula(leftCase.formula),
          rightConclusionText: formatFormula(rightCase.formula),
        }),
      );
    }
    return makeSuccess(leftCase.formula);
  });

/**
 * w (Weakening): φ と ψ → φ（ψを捨てる）
 */
const validateNdWeakeningEffect = (
  state: WorkspaceState,
  edge: Extract<NdInferenceEdge, { readonly _tag: "nd-weakening" }>,
): Effect.Effect<NdApplicationSuccess, NdApplicationError> =>
  Effect.gen(function* () {
    const kept = yield* resolvePremise(
      state,
      edge.keptPremiseNodeId,
      "kept premise (φ)",
    );
    // discarded 前提は存在確認のみ（結論には使わないが、接続は必要）
    yield* resolvePremise(
      state,
      edge.discardedPremiseNodeId,
      "discarded premise (ψ)",
    );
    return makeSuccess(kept.formula);
  });

/**
 * EFQ (爆発律): ⊥ → 任意のφ
 * EFQは結論式を自動計算できない（任意の式を導出可能）。
 * 前提が接続されていることのみ検証する。
 * 結論テキストは呼び出し側で既存テキストを保持する（_tag: "efq-valid"）。
 */
const validateNdEfqEffect = (
  state: WorkspaceState,
  edge: Extract<NdInferenceEdge, { readonly _tag: "nd-efq" }>,
): Effect.Effect<NdEfqValidResult, NdApplicationError> =>
  Effect.gen(function* () {
    // 前提が接続・パース可能であることのみ検証
    yield* resolvePremise(state, edge.premiseNodeId, "premise (⊥)");
    return { _tag: "efq-valid" };
  });

/**
 * DNE (二重否定除去): ¬¬φ → φ
 */
const validateNdDneEffect = (
  state: WorkspaceState,
  edge: Extract<NdInferenceEdge, { readonly _tag: "nd-dne" }>,
): Effect.Effect<NdApplicationSuccess, NdApplicationError> =>
  Effect.gen(function* () {
    const premise = yield* resolvePremise(
      state,
      edge.premiseNodeId,
      "premise (¬¬φ)",
    );
    if (
      !(premise.formula instanceof Negation) ||
      !(premise.formula.formula instanceof Negation)
    ) {
      return yield* Effect.fail(
        new NdStructuralError({
          message: "Premise must be a double negation (¬¬φ)",
        }),
      );
    }
    return makeSuccess(premise.formula.formula.formula);
  });

// --- 統合バリデーション ---

/**
 * ND推論エッジのバリデーション（Effect版）。
 * エッジの _tag に基づいて適切な規則バリデーションを呼び出す。
 */
export const validateNdApplicationEffect = (
  state: WorkspaceState,
  edge: NdInferenceEdge,
): Effect.Effect<NdValidationSuccess, NdApplicationError> => {
  switch (edge._tag) {
    case "nd-implication-intro":
      return validateNdImplicationIntroEffect(state, edge);
    case "nd-implication-elim":
      return validateNdImplicationElimEffect(state, edge);
    case "nd-conjunction-intro":
      return validateNdConjunctionIntroEffect(state, edge);
    case "nd-conjunction-elim-left":
      return validateNdConjunctionElimLeftEffect(state, edge);
    case "nd-conjunction-elim-right":
      return validateNdConjunctionElimRightEffect(state, edge);
    case "nd-disjunction-intro-left":
      return validateNdDisjunctionIntroLeftEffect(state, edge);
    case "nd-disjunction-intro-right":
      return validateNdDisjunctionIntroRightEffect(state, edge);
    case "nd-disjunction-elim":
      return validateNdDisjunctionElimEffect(state, edge);
    case "nd-weakening":
      return validateNdWeakeningEffect(state, edge);
    case "nd-efq":
      return validateNdEfqEffect(state, edge);
    case "nd-dne":
      return validateNdDneEffect(state, edge);
  }
};

/**
 * ND推論エッジのバリデーション（同期版: Either を返す）。
 */
export const validateNdApplication = (
  state: WorkspaceState,
  edge: NdInferenceEdge,
): NdApplicationResult =>
  Effect.runSync(Effect.either(validateNdApplicationEffect(state, edge)));

// --- 結果判別ヘルパー ---

/**
 * ND適用の成功結果がEFQ検証成功かどうかを判定する。
 * EFQの場合は結論テキストの更新を行わない。
 */
export function isNdEfqValidResult(result: NdValidationSuccess) {
  return result._tag === "efq-valid";
}

// --- エラーメッセージ ---

/**
 * ND適用エラーに対する人間向けメッセージを返す。
 */
export function getNdErrorMessage(error: NdApplicationError): string {
  switch (error._tag) {
    case "NdPremiseMissing":
      return `Connect ${error.premiseLabel satisfies string}`;
    case "NdPremiseParseError":
      return `${error.premiseLabel satisfies string} has invalid formula`;
    case "NdAdditionalFormulaParseError":
      return `Enter valid formula for ${error.label satisfies string}`;
    case "NdStructuralError":
      return error.message;
    case "NdDischargedFormulaParseError":
      return "Enter valid discharged assumption formula";
    case "NdCaseConclusionMismatch":
      return `Left case (${error.leftConclusionText satisfies string}) and right case (${error.rightConclusionText satisfies string}) conclusions must match`;
  }
}
