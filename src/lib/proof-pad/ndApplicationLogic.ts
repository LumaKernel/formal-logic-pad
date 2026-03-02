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
  Predicate,
  Universal,
  Existential,
  implication,
  conjunction,
  disjunction,
  negation,
  predicate,
  universal,
  existential,
} from "../logic-core/formula";
import { TermVariable, termVariable } from "../logic-core/term";
import { equalFormula } from "../logic-core/equality";
import {
  isFreeFor,
  substituteTermVariableInFormula,
} from "../logic-core/substitution";
import { formatFormula } from "../logic-lang/formatUnicode";
import { parseString, parseTermString } from "../logic-lang/parser";
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

/** 固有変数条件違反 */
export class NdEigenvariableViolation extends Data.TaggedError(
  "NdEigenvariableViolation",
)<{
  readonly variableName: string;
  readonly message: string;
}> {}

/** 項テキストのパースエラー（∀E, ∃Iの代入項用） */
export class NdTermParseError extends Data.TaggedError("NdTermParseError")<{
  readonly label: string;
}> {}

export type NdApplicationError =
  | NdPremiseMissing
  | NdPremiseParseError
  | NdAdditionalFormulaParseError
  | NdStructuralError
  | NdDischargedFormulaParseError
  | NdCaseConclusionMismatch
  | NdEigenvariableViolation
  | NdTermParseError;

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

// --- ⊥ (falsum) ---

/**
 * ⊥ (falsum) を表す述語。Predicate("⊥", []) で表現する。
 * 自然演繹で ¬φ = φ→⊥ と解釈し、→E/→I で使用する。
 */
const BOTTOM: Formula = predicate("⊥", []);

/** 論理式が ⊥ かどうかを判定する */
function isBottom(f: Formula) {
  return f instanceof Predicate && f.name === "⊥" && f.args.length === 0;
}

// --- 各ND規則のバリデーション ---

/**
 * →I (Implication Intro): 前提ψの証明 + 打ち消し仮定φ → φ→ψ
 * 特殊ケース: 前提が⊥の場合、¬φ（Negation）を生成する。
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
    // 前提が⊥の場合: φ→⊥ ではなく ¬φ を生成
    const conclusion = isBottom(premise.formula)
      ? negation(dischargedFormula)
      : implication(dischargedFormula, premise.formula);
    return makeSuccess(conclusion);
  });

/**
 * →E (Implication Elim = MP): φ と φ→ψ → ψ
 * 特殊ケース: ¬φ（Negation）は φ→⊥ と解釈し、φ と ¬φ から ⊥ を導出する。
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
      "right premise (φ→ψ or ¬φ)",
    );
    // ¬φ を φ→⊥ と解釈
    if (right.formula instanceof Negation) {
      if (!equalFormula(left.formula, right.formula.formula)) {
        return yield* Effect.fail(
          new NdStructuralError({
            message:
              "Left premise does not match negated formula of right premise",
          }),
        );
      }
      return makeSuccess(BOTTOM);
    }
    if (!(right.formula instanceof Implication)) {
      return yield* Effect.fail(
        new NdStructuralError({
          message:
            "Right premise must be an implication (φ→ψ) or negation (¬φ)",
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

/**
 * ∀I (Universal Intro): φ → ∀x.φ
 * 1前提 + 量化変数名。
 * 固有変数条件チェックはこのバリデーション層では行わない
 * （仮定追跡が必要なため）。
 */
const validateNdUniversalIntroEffect = (
  state: WorkspaceState,
  edge: Extract<NdInferenceEdge, { readonly _tag: "nd-universal-intro" }>,
): Effect.Effect<NdApplicationSuccess, NdApplicationError> =>
  Effect.gen(function* () {
    const premise = yield* resolvePremise(
      state,
      edge.premiseNodeId,
      "premise (φ)",
    );
    if (edge.variableName.trim() === "") {
      return yield* Effect.fail(
        new NdStructuralError({ message: "Variable name is required" }),
      );
    }
    const variable = termVariable(edge.variableName.trim());
    const conclusion = universal(variable, premise.formula);
    return makeSuccess(conclusion);
  });

/**
 * ∀E (Universal Elim): ∀x.φ → φ[t/x]
 * 1前提（∀x.φ） + 代入項テキスト。
 * 代入可能性条件 (free-for) を検証する。
 */
const validateNdUniversalElimEffect = (
  state: WorkspaceState,
  edge: Extract<NdInferenceEdge, { readonly _tag: "nd-universal-elim" }>,
): Effect.Effect<NdApplicationSuccess, NdApplicationError> =>
  Effect.gen(function* () {
    const premise = yield* resolvePremise(
      state,
      edge.premiseNodeId,
      "premise (∀x.φ)",
    );
    if (!(premise.formula instanceof Universal)) {
      return yield* Effect.fail(
        new NdStructuralError({
          message: "Premise must be a universal quantification (∀x.φ)",
        }),
      );
    }
    if (edge.termText.trim() === "") {
      return yield* Effect.fail(
        new NdTermParseError({ label: "substitution term (t)" }),
      );
    }
    const termResult = parseTermString(edge.termText.trim());
    if (Either.isLeft(termResult)) {
      return yield* Effect.fail(
        new NdTermParseError({ label: "substitution term (t)" }),
      );
    }
    const t = termResult.right;
    const x = premise.formula.variable;
    const body = premise.formula.formula;
    if (!isFreeFor(t, x, body)) {
      return yield* Effect.fail(
        new NdEigenvariableViolation({
          variableName: x.name,
          message: `Term is not free for ${x.name satisfies string} in the formula body`,
        }),
      );
    }
    const conclusion = substituteTermVariableInFormula(body, x, t);
    return makeSuccess(conclusion);
  });

/**
 * ∃I (Existential Intro): φ[t/x] → ∃x.φ
 * 1前提 + 量化変数名 + 代入項テキスト。
 * 前提を φ[t/x] とみなし、t を x に置き換えて φ を復元し、∃x.φ を構築する。
 * 現在は t が単一変数の場合のみサポート。
 */
const validateNdExistentialIntroEffect = (
  state: WorkspaceState,
  edge: Extract<NdInferenceEdge, { readonly _tag: "nd-existential-intro" }>,
): Effect.Effect<NdApplicationSuccess, NdApplicationError> =>
  Effect.gen(function* () {
    const premise = yield* resolvePremise(
      state,
      edge.premiseNodeId,
      "premise (φ[t/x])",
    );
    if (edge.variableName.trim() === "") {
      return yield* Effect.fail(
        new NdStructuralError({ message: "Variable name is required" }),
      );
    }
    if (edge.termText.trim() === "") {
      return yield* Effect.fail(
        new NdTermParseError({ label: "witness term (t)" }),
      );
    }
    const termResult = parseTermString(edge.termText.trim());
    if (Either.isLeft(termResult)) {
      return yield* Effect.fail(
        new NdTermParseError({ label: "witness term (t)" }),
      );
    }
    const t = termResult.right;
    const x = termVariable(edge.variableName.trim());
    // t を x に置き換えて body φ を復元する。
    // 現在は t が TermVariable の場合のみサポート。
    if (!(t instanceof TermVariable)) {
      return yield* Effect.fail(
        new NdStructuralError({
          message: "Witness term must be a variable for ∃I",
        }),
      );
    }
    const body = substituteTermVariableInFormula(premise.formula, t, x);
    const conclusion = existential(x, body);
    return makeSuccess(conclusion);
  });

/**
 * ∃E (Existential Elim): ∃x.φ と χ（仮定φの下での証明）→ χ
 * 2前提: 存在量化式と、仮定の下でのケース証明。
 * 結論はケース前提の論理式。
 */
const validateNdExistentialElimEffect = (
  state: WorkspaceState,
  edge: Extract<NdInferenceEdge, { readonly _tag: "nd-existential-elim" }>,
): Effect.Effect<NdApplicationSuccess, NdApplicationError> =>
  Effect.gen(function* () {
    const existentialPremise = yield* resolvePremise(
      state,
      edge.existentialPremiseNodeId,
      "existential premise (∃x.φ)",
    );
    if (!(existentialPremise.formula instanceof Existential)) {
      return yield* Effect.fail(
        new NdStructuralError({
          message: "First premise must be an existential quantification (∃x.φ)",
        }),
      );
    }
    const casePremise = yield* resolvePremise(
      state,
      edge.casePremiseNodeId,
      "case premise (χ)",
    );
    // 結論はケース前提の論理式（χ）
    return makeSuccess(casePremise.formula);
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
    case "nd-universal-intro":
      return validateNdUniversalIntroEffect(state, edge);
    case "nd-universal-elim":
      return validateNdUniversalElimEffect(state, edge);
    case "nd-existential-intro":
      return validateNdExistentialIntroEffect(state, edge);
    case "nd-existential-elim":
      return validateNdExistentialElimEffect(state, edge);
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
    case "NdEigenvariableViolation":
      return error.message;
    case "NdTermParseError":
      return `Enter valid term for ${error.label satisfies string}`;
  }
}
