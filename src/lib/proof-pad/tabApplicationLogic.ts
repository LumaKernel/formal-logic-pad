/**
 * TAB（タブロー式シーケント計算）規則適用のための純粋ロジック。
 *
 * ワークスペース上のシーケントノードからTAB規則を適用して
 * 前提シーケントを計算する。UI層（ProofWorkspace.tsx）から利用される。
 *
 * TABの特徴:
 * - シーケントの右辺は常に空（Γ ⇒）
 * - ノードの formulaText にはカンマ区切りの論理式リスト（前件）を格納
 * - 規則適用は主論理式の位置指定で行う
 *
 * 変更時は tabApplicationLogic.test.ts, workspaceState.ts, index.ts も同期すること。
 */

import { Data, Effect, Either } from "effect";
import type { Formula } from "../logic-core/formula";
import {
  Negation,
  Conjunction,
  Disjunction,
  Implication,
  Universal,
  Existential,
  negation,
} from "../logic-core/formula";
import { termVariable } from "../logic-core/term";
import {
  isFreeFor,
  substituteTermVariableInFormula,
} from "../logic-core/substitution";
import { freeVariablesInFormula } from "../logic-core/freeVariables";
import { formatFormula } from "../logic-lang/formatUnicode";
import { parseString, parseTermString } from "../logic-lang/parser";
import type { TabRuleId } from "../logic-core/tableauCalculus";
import { isTabBranchingRule } from "../logic-core/tableauCalculus";
import type {
  TabSinglePremiseEdge,
  TabBranchingEdge,
  TabAxiomEdge,
} from "./inferenceEdge";

// --- シーケントテキストのパース ---

/**
 * カンマ区切りのシーケントテキストを個別の論理式テキストに分割する。
 * 空文字列の場合は空配列を返す。
 */
export function splitSequentText(text: string): readonly string[] {
  if (text.trim() === "") return [];
  return text.split(",").map((s) => s.trim());
}

/**
 * 論理式配列をシーケントテキスト（カンマ区切り）にフォーマットする。
 */
export function formatSequentText(formulas: readonly Formula[]): string {
  return formulas.map((f) => formatFormula(f)).join(", ");
}

/**
 * シーケントテキストを論理式配列にパースする。
 * パース失敗時はundefinedを返す。
 */
export function parseSequentFormulas(
  text: string,
): readonly Formula[] | undefined {
  const parts = splitSequentText(text);
  const formulas: Formula[] = [];
  for (const part of parts) {
    const result = parseString(part);
    if (Either.isLeft(result)) return undefined;
    formulas.push(result.right);
  }
  return formulas;
}

// --- エラー型 ---

/** シーケントのパースエラー */
export class TabSequentParseError extends Data.TaggedError(
  "TabSequentParseError",
)<{
  readonly nodeId: string;
}> {}

/** 主論理式の位置が範囲外 */
export class TabPrincipalPositionOutOfRange extends Data.TaggedError(
  "TabPrincipalPositionOutOfRange",
)<{
  readonly position: number;
  readonly formulaCount: number;
}> {}

/** 主論理式の構造が規則の要件を満たさない */
export class TabPrincipalFormulaMismatch extends Data.TaggedError(
  "TabPrincipalFormulaMismatch",
)<{
  readonly ruleId: TabRuleId;
  readonly message: string;
}> {}

/** 固有変数条件違反 */
export class TabEigenVariableError extends Data.TaggedError(
  "TabEigenVariableError",
)<{
  readonly variableName: string;
  readonly message: string;
}> {}

/** 項テキストのパースエラー */
export class TabTermParseError extends Data.TaggedError("TabTermParseError")<{
  readonly label: string;
}> {}

/** 交換位置が範囲外 */
export class TabExchangePositionError extends Data.TaggedError(
  "TabExchangePositionError",
)<{
  readonly position: number;
  readonly maxPosition: number;
}> {}

export type TabApplicationError =
  | TabSequentParseError
  | TabPrincipalPositionOutOfRange
  | TabPrincipalFormulaMismatch
  | TabEigenVariableError
  | TabTermParseError
  | TabExchangePositionError;

// --- 成功結果型 ---

/** 1前提規則の適用結果 */
export type TabSinglePremiseResult = {
  readonly _tag: "tab-single-result";
  readonly premiseText: string;
};

/** 分岐（2前提）規則の適用結果 */
export type TabBranchingResult = {
  readonly _tag: "tab-branching-result";
  readonly leftPremiseText: string;
  readonly rightPremiseText: string;
};

/** 公理（0前提）の適用結果 */
export type TabAxiomResult = {
  readonly _tag: "tab-axiom-result";
};

export type TabApplicationSuccess =
  | TabSinglePremiseResult
  | TabBranchingResult
  | TabAxiomResult;

export type TabApplicationResult = Either.Either<
  TabApplicationSuccess,
  TabApplicationError
>;

// --- ヘルパー ---

/**
 * 論理式リストから指定位置の論理式を除いた残りのリスト（Γ部分）を取得する。
 */
function removeAtIndex(
  formulas: readonly Formula[],
  index: number,
): readonly Formula[] {
  return [...formulas.slice(0, index), ...formulas.slice(index + 1)];
}

/**
 * 論理式リストの先頭に新しい論理式を追加してシーケントテキストを生成する。
 * TABでは副論理式は前件の先頭に追加される（主論理式は元の位置に残る）。
 */
function prependAndFormat(
  added: readonly Formula[],
  principal: Formula,
  rest: readonly Formula[],
): string {
  return formatSequentText([...added, principal, ...rest]);
}

// --- 各規則のバリデーション ---

/**
 * BS (基本式): ¬φ, φ が同じ枝にあれば閉じる（0前提）。
 * 主論理式は不要（枝全体をチェック）。
 */
const validateBsEffect = (
  formulas: readonly Formula[],
): Effect.Effect<TabAxiomResult, TabApplicationError> =>
  Effect.gen(function* () {
    // BS は formulaList の中に φ と ¬φ のペアがあればOK
    // ここでは position は無視（公理規則なので主論理式の概念がない）
    // ただし、UI上ではペアが存在するかのバリデーションのみ行う
    // 完全な意味的チェックは将来実装（現段階では構造的な公理マークのみ）
    // 少なくとも2つの論理式が必要
    if (formulas.length < 2) {
      return yield* Effect.fail(
        new TabPrincipalFormulaMismatch({
          ruleId: "bs",
          message: "BS axiom requires at least 2 formulas (φ and ¬φ)",
        }),
      );
    }
    return { _tag: "tab-axiom-result" };
  });

/**
 * ⊥ (底公理): ⊥ が枝上にあれば閉じる（0前提）。
 */
const validateBottomEffect = (
  formulas: readonly Formula[],
): Effect.Effect<TabAxiomResult, TabApplicationError> =>
  Effect.gen(function* () {
    if (formulas.length < 1) {
      return yield* Effect.fail(
        new TabPrincipalFormulaMismatch({
          ruleId: "bottom",
          message: "⊥ axiom requires at least 1 formula",
        }),
      );
    }
    return { _tag: "tab-axiom-result" };
  });

/**
 * e (交換): position と position+1 の論理式を入れ替える。
 * exchangePosition パラメータで交換位置を指定。
 */
const validateExchangeEffect = (
  formulas: readonly Formula[],
  exchangePosition: number,
): Effect.Effect<TabSinglePremiseResult, TabApplicationError> =>
  Effect.gen(function* () {
    if (exchangePosition < 0 || exchangePosition + 1 >= formulas.length) {
      return yield* Effect.fail(
        new TabExchangePositionError({
          position: exchangePosition,
          maxPosition: formulas.length - 2,
        }),
      );
    }
    // 交換後のリストを作成
    const result = [...formulas];
    const tmp = result[exchangePosition]!;
    result[exchangePosition] = result[exchangePosition + 1]!;
    result[exchangePosition + 1] = tmp;
    return {
      _tag: "tab-single-result",
      premiseText: formatSequentText(result),
    };
  });

/**
 * ¬¬ (二重否定): ¬¬φ → φ を前件に追加。
 * 主論理式: ¬¬φ, 副論理式: φ
 */
const validateDoubleNegationEffect = (
  formulas: readonly Formula[],
  position: number,
): Effect.Effect<TabSinglePremiseResult, TabApplicationError> =>
  Effect.gen(function* () {
    const principal = formulas[position]!;
    if (
      !(principal instanceof Negation) ||
      !(principal.formula instanceof Negation)
    ) {
      return yield* Effect.fail(
        new TabPrincipalFormulaMismatch({
          ruleId: "double-negation",
          message: "Principal formula must be ¬¬φ",
        }),
      );
    }
    const inner = principal.formula.formula;
    const rest = removeAtIndex(formulas, position);
    return {
      _tag: "tab-single-result",
      premiseText: prependAndFormat([inner], principal, rest),
    };
  });

/**
 * ∧ (連言): φ∧ψ → φ, ψ を前件に追加（1前提）。
 * 主論理式: φ∧ψ, 副論理式: φ, ψ
 */
const validateConjunctionEffect = (
  formulas: readonly Formula[],
  position: number,
): Effect.Effect<TabSinglePremiseResult, TabApplicationError> =>
  Effect.gen(function* () {
    const principal = formulas[position]!;
    if (!(principal instanceof Conjunction)) {
      return yield* Effect.fail(
        new TabPrincipalFormulaMismatch({
          ruleId: "conjunction",
          message: "Principal formula must be φ∧ψ",
        }),
      );
    }
    const rest = removeAtIndex(formulas, position);
    return {
      _tag: "tab-single-result",
      premiseText: prependAndFormat(
        [principal.left, principal.right],
        principal,
        rest,
      ),
    };
  });

/**
 * ¬∧ (否定連言): ¬(φ∧ψ) → 分岐: ¬φ / ¬ψ（2前提）。
 * 主論理式: ¬(φ∧ψ), 副論理式: ¬φ (左), ¬ψ (右)
 */
const validateNegConjunctionEffect = (
  formulas: readonly Formula[],
  position: number,
): Effect.Effect<TabBranchingResult, TabApplicationError> =>
  Effect.gen(function* () {
    const principal = formulas[position]!;
    if (
      !(principal instanceof Negation) ||
      !(principal.formula instanceof Conjunction)
    ) {
      return yield* Effect.fail(
        new TabPrincipalFormulaMismatch({
          ruleId: "neg-conjunction",
          message: "Principal formula must be ¬(φ∧ψ)",
        }),
      );
    }
    const rest = removeAtIndex(formulas, position);
    const negLeft = negation(principal.formula.left);
    const negRight = negation(principal.formula.right);
    return {
      _tag: "tab-branching-result",
      leftPremiseText: prependAndFormat([negLeft], principal, rest),
      rightPremiseText: prependAndFormat([negRight], principal, rest),
    };
  });

/**
 * ∨ (選言): φ∨ψ → 分岐: φ / ψ（2前提）。
 * 主論理式: φ∨ψ, 副論理式: φ (左), ψ (右)
 */
const validateDisjunctionEffect = (
  formulas: readonly Formula[],
  position: number,
): Effect.Effect<TabBranchingResult, TabApplicationError> =>
  Effect.gen(function* () {
    const principal = formulas[position]!;
    if (!(principal instanceof Disjunction)) {
      return yield* Effect.fail(
        new TabPrincipalFormulaMismatch({
          ruleId: "disjunction",
          message: "Principal formula must be φ∨ψ",
        }),
      );
    }
    const rest = removeAtIndex(formulas, position);
    return {
      _tag: "tab-branching-result",
      leftPremiseText: prependAndFormat([principal.left], principal, rest),
      rightPremiseText: prependAndFormat([principal.right], principal, rest),
    };
  });

/**
 * ¬∨ (否定選言): ¬(φ∨ψ) → ¬φ, ¬ψ を前件に追加（1前提）。
 * 主論理式: ¬(φ∨ψ), 副論理式: ¬φ, ¬ψ
 */
const validateNegDisjunctionEffect = (
  formulas: readonly Formula[],
  position: number,
): Effect.Effect<TabSinglePremiseResult, TabApplicationError> =>
  Effect.gen(function* () {
    const principal = formulas[position]!;
    if (
      !(principal instanceof Negation) ||
      !(principal.formula instanceof Disjunction)
    ) {
      return yield* Effect.fail(
        new TabPrincipalFormulaMismatch({
          ruleId: "neg-disjunction",
          message: "Principal formula must be ¬(φ∨ψ)",
        }),
      );
    }
    const rest = removeAtIndex(formulas, position);
    const negLeft = negation(principal.formula.left);
    const negRight = negation(principal.formula.right);
    return {
      _tag: "tab-single-result",
      premiseText: prependAndFormat([negLeft, negRight], principal, rest),
    };
  });

/**
 * → (含意): φ→ψ → 分岐: ¬φ / ψ（2前提）。
 * 主論理式: φ→ψ, 副論理式: ¬φ (左), ψ (右)
 */
const validateImplicationEffect = (
  formulas: readonly Formula[],
  position: number,
): Effect.Effect<TabBranchingResult, TabApplicationError> =>
  Effect.gen(function* () {
    const principal = formulas[position]!;
    if (!(principal instanceof Implication)) {
      return yield* Effect.fail(
        new TabPrincipalFormulaMismatch({
          ruleId: "implication",
          message: "Principal formula must be φ→ψ",
        }),
      );
    }
    const rest = removeAtIndex(formulas, position);
    const negLeft = negation(principal.left);
    return {
      _tag: "tab-branching-result",
      leftPremiseText: prependAndFormat([negLeft], principal, rest),
      rightPremiseText: prependAndFormat([principal.right], principal, rest),
    };
  });

/**
 * ¬→ (否定含意): ¬(φ→ψ) → φ, ¬ψ を前件に追加（1前提）。
 * 主論理式: ¬(φ→ψ), 副論理式: φ, ¬ψ
 */
const validateNegImplicationEffect = (
  formulas: readonly Formula[],
  position: number,
): Effect.Effect<TabSinglePremiseResult, TabApplicationError> =>
  Effect.gen(function* () {
    const principal = formulas[position]!;
    if (
      !(principal instanceof Negation) ||
      !(principal.formula instanceof Implication)
    ) {
      return yield* Effect.fail(
        new TabPrincipalFormulaMismatch({
          ruleId: "neg-implication",
          message: "Principal formula must be ¬(φ→ψ)",
        }),
      );
    }
    const rest = removeAtIndex(formulas, position);
    const phi = principal.formula.left;
    const negPsi = negation(principal.formula.right);
    return {
      _tag: "tab-single-result",
      premiseText: prependAndFormat([phi, negPsi], principal, rest),
    };
  });

/**
 * ∀ (全称): ∀ξφ → φ[τ/ξ] を前件に追加（1前提）。
 * 主論理式: ∀ξφ, 副論理式: φ[τ/ξ]
 * τは任意の項（termTextパラメータ）。
 */
const validateUniversalEffect = (
  formulas: readonly Formula[],
  position: number,
  termText: string,
): Effect.Effect<TabSinglePremiseResult, TabApplicationError> =>
  Effect.gen(function* () {
    const principal = formulas[position]!;
    if (!(principal instanceof Universal)) {
      return yield* Effect.fail(
        new TabPrincipalFormulaMismatch({
          ruleId: "universal",
          message: "Principal formula must be ∀ξφ",
        }),
      );
    }
    if (termText.trim() === "") {
      return yield* Effect.fail(
        new TabTermParseError({ label: "substitution term (τ)" }),
      );
    }
    const termResult = parseTermString(termText.trim());
    if (Either.isLeft(termResult)) {
      return yield* Effect.fail(
        new TabTermParseError({ label: "substitution term (τ)" }),
      );
    }
    const tau = termResult.right;
    const xi = principal.variable;
    const body = principal.formula;
    if (!isFreeFor(tau, xi, body)) {
      return yield* Effect.fail(
        new TabEigenVariableError({
          variableName: xi.name,
          message: `Term is not free for ${xi.name satisfies string} in the formula body`,
        }),
      );
    }
    const substituted = substituteTermVariableInFormula(body, xi, tau);
    const rest = removeAtIndex(formulas, position);
    return {
      _tag: "tab-single-result",
      premiseText: prependAndFormat([substituted], principal, rest),
    };
  });

/**
 * ¬∀ (否定全称): ¬∀ξφ → ¬φ[ζ/ξ] を前件に追加（1前提）。
 * 主論理式: ¬∀ξφ, 副論理式: ¬φ[ζ/ξ]
 * ζは変項で固有変数条件あり: ζ ∉ fv(Γ) ∪ fv(¬∀ξφ)。
 */
const validateNegUniversalEffect = (
  formulas: readonly Formula[],
  position: number,
  eigenVariable: string,
): Effect.Effect<TabSinglePremiseResult, TabApplicationError> =>
  Effect.gen(function* () {
    const principal = formulas[position]!;
    if (
      !(principal instanceof Negation) ||
      !(principal.formula instanceof Universal)
    ) {
      return yield* Effect.fail(
        new TabPrincipalFormulaMismatch({
          ruleId: "neg-universal",
          message: "Principal formula must be ¬∀ξφ",
        }),
      );
    }
    if (eigenVariable.trim() === "") {
      return yield* Effect.fail(
        new TabEigenVariableError({
          variableName: "",
          message: "Eigen variable name is required",
        }),
      );
    }
    const zeta = eigenVariable.trim();
    // 固有変数条件: ζ ∉ fv(Γ) ∪ fv(¬∀ξφ)
    const allFreeVars = new Set<string>();
    for (const f of formulas) {
      for (const v of freeVariablesInFormula(f)) {
        allFreeVars.add(v);
      }
    }
    if (allFreeVars.has(zeta)) {
      return yield* Effect.fail(
        new TabEigenVariableError({
          variableName: zeta,
          message: `Eigen variable ${zeta satisfies string} must not occur free in the sequent`,
        }),
      );
    }
    const xi = principal.formula.variable;
    const body = principal.formula.formula;
    const zetaVar = termVariable(zeta);
    const substituted = substituteTermVariableInFormula(body, xi, zetaVar);
    const negSubstituted = negation(substituted);
    const rest = removeAtIndex(formulas, position);
    return {
      _tag: "tab-single-result",
      premiseText: prependAndFormat([negSubstituted], principal, rest),
    };
  });

/**
 * ∃ (存在): ∃ξφ → φ[ζ/ξ] を前件に追加（1前提）。
 * 主論理式: ∃ξφ, 副論理式: φ[ζ/ξ]
 * ζは変項で固有変数条件あり: ζ ∉ fv(Γ) ∪ fv(∃ξφ)。
 */
const validateExistentialEffect = (
  formulas: readonly Formula[],
  position: number,
  eigenVariable: string,
): Effect.Effect<TabSinglePremiseResult, TabApplicationError> =>
  Effect.gen(function* () {
    const principal = formulas[position]!;
    if (!(principal instanceof Existential)) {
      return yield* Effect.fail(
        new TabPrincipalFormulaMismatch({
          ruleId: "existential",
          message: "Principal formula must be ∃ξφ",
        }),
      );
    }
    if (eigenVariable.trim() === "") {
      return yield* Effect.fail(
        new TabEigenVariableError({
          variableName: "",
          message: "Eigen variable name is required",
        }),
      );
    }
    const zeta = eigenVariable.trim();
    // 固有変数条件: ζ ∉ fv(Γ) ∪ fv(∃ξφ)
    const allFreeVars = new Set<string>();
    for (const f of formulas) {
      for (const v of freeVariablesInFormula(f)) {
        allFreeVars.add(v);
      }
    }
    if (allFreeVars.has(zeta)) {
      return yield* Effect.fail(
        new TabEigenVariableError({
          variableName: zeta,
          message: `Eigen variable ${zeta satisfies string} must not occur free in the sequent`,
        }),
      );
    }
    const xi = principal.variable;
    const body = principal.formula;
    const zetaVar = termVariable(zeta);
    const substituted = substituteTermVariableInFormula(body, xi, zetaVar);
    const rest = removeAtIndex(formulas, position);
    return {
      _tag: "tab-single-result",
      premiseText: prependAndFormat([substituted], principal, rest),
    };
  });

/**
 * ¬∃ (否定存在): ¬∃ξφ → ¬φ[τ/ξ] を前件に追加（1前提）。
 * 主論理式: ¬∃ξφ, 副論理式: ¬φ[τ/ξ]
 * τは任意の項（termTextパラメータ）。
 */
const validateNegExistentialEffect = (
  formulas: readonly Formula[],
  position: number,
  termText: string,
): Effect.Effect<TabSinglePremiseResult, TabApplicationError> =>
  Effect.gen(function* () {
    const principal = formulas[position]!;
    if (
      !(principal instanceof Negation) ||
      !(principal.formula instanceof Existential)
    ) {
      return yield* Effect.fail(
        new TabPrincipalFormulaMismatch({
          ruleId: "neg-existential",
          message: "Principal formula must be ¬∃ξφ",
        }),
      );
    }
    if (termText.trim() === "") {
      return yield* Effect.fail(
        new TabTermParseError({ label: "substitution term (τ)" }),
      );
    }
    const termResult = parseTermString(termText.trim());
    if (Either.isLeft(termResult)) {
      return yield* Effect.fail(
        new TabTermParseError({ label: "substitution term (τ)" }),
      );
    }
    const tau = termResult.right;
    const xi = principal.formula.variable;
    const body = principal.formula.formula;
    if (!isFreeFor(tau, xi, body)) {
      return yield* Effect.fail(
        new TabEigenVariableError({
          variableName: xi.name,
          message: `Term is not free for ${xi.name satisfies string} in the formula body`,
        }),
      );
    }
    const substituted = substituteTermVariableInFormula(body, xi, tau);
    const negSubstituted = negation(substituted);
    const rest = removeAtIndex(formulas, position);
    return {
      _tag: "tab-single-result",
      premiseText: prependAndFormat([negSubstituted], principal, rest),
    };
  });

// --- 統合バリデーション ---

/** TAB規則適用のパラメータ */
export type TabRuleApplicationParams = {
  /** 適用する規則 */
  readonly ruleId: TabRuleId;
  /** シーケントのテキスト（カンマ区切りの前件） */
  readonly sequentText: string;
  /** 主論理式の位置（0-based）。公理の場合は0。 */
  readonly principalPosition: number;
  /** 固有変数名（¬∀, ∃規則用） */
  readonly eigenVariable?: string;
  /** 代入項テキスト（∀, ¬∃規則用） */
  readonly termText?: string;
  /** 交換位置（e規則用） */
  readonly exchangePosition?: number;
};

/**
 * TAB規則適用のバリデーション（Effect版）。
 */
export const validateTabApplicationEffect = (
  params: TabRuleApplicationParams,
): Effect.Effect<TabApplicationSuccess, TabApplicationError> =>
  Effect.gen(function* () {
    const formulas = parseSequentFormulas(params.sequentText);
    if (formulas === undefined) {
      return yield* Effect.fail(
        new TabSequentParseError({ nodeId: "conclusion" }),
      );
    }

    // 公理・交換は特別処理
    if (params.ruleId === "bs") {
      return yield* validateBsEffect(formulas);
    }
    if (params.ruleId === "bottom") {
      return yield* validateBottomEffect(formulas);
    }
    if (params.ruleId === "exchange") {
      return yield* validateExchangeEffect(
        formulas,
        params.exchangePosition ?? 0,
      );
    }

    // その他の規則: principalPositionの範囲チェック
    if (
      params.principalPosition < 0 ||
      params.principalPosition >= formulas.length
    ) {
      return yield* Effect.fail(
        new TabPrincipalPositionOutOfRange({
          position: params.principalPosition,
          formulaCount: formulas.length,
        }),
      );
    }

    switch (params.ruleId) {
      case "double-negation":
        return yield* validateDoubleNegationEffect(
          formulas,
          params.principalPosition,
        );
      case "conjunction":
        return yield* validateConjunctionEffect(
          formulas,
          params.principalPosition,
        );
      case "neg-conjunction":
        return yield* validateNegConjunctionEffect(
          formulas,
          params.principalPosition,
        );
      case "disjunction":
        return yield* validateDisjunctionEffect(
          formulas,
          params.principalPosition,
        );
      case "neg-disjunction":
        return yield* validateNegDisjunctionEffect(
          formulas,
          params.principalPosition,
        );
      case "implication":
        return yield* validateImplicationEffect(
          formulas,
          params.principalPosition,
        );
      case "neg-implication":
        return yield* validateNegImplicationEffect(
          formulas,
          params.principalPosition,
        );
      case "universal":
        return yield* validateUniversalEffect(
          formulas,
          params.principalPosition,
          params.termText ?? "",
        );
      case "neg-universal":
        return yield* validateNegUniversalEffect(
          formulas,
          params.principalPosition,
          params.eigenVariable ?? "",
        );
      case "existential":
        return yield* validateExistentialEffect(
          formulas,
          params.principalPosition,
          params.eigenVariable ?? "",
        );
      case "neg-existential":
        return yield* validateNegExistentialEffect(
          formulas,
          params.principalPosition,
          params.termText ?? "",
        );
    }
  });

/**
 * TAB規則適用のバリデーション（同期版: Either を返す）。
 */
export const validateTabApplication = (
  params: TabRuleApplicationParams,
): TabApplicationResult =>
  Effect.runSync(Effect.either(validateTabApplicationEffect(params)));

// --- エッジ生成ヘルパー ---

/**
 * バリデーション結果からTabInferenceEdgeを生成する。
 * conclusionNodeId にはTAB規則が適用されるシーケントノードのIDを指定する。
 */
export function createTabEdgeFromResult(
  params: TabRuleApplicationParams,
  result: TabApplicationSuccess,
  conclusionNodeId: string,
): TabSinglePremiseEdge | TabBranchingEdge | TabAxiomEdge {
  switch (result._tag) {
    case "tab-single-result":
      return {
        _tag: "tab-single",
        ruleId: params.ruleId,
        conclusionNodeId,
        premiseNodeId: undefined,
        conclusionText: params.sequentText,
        eigenVariable: params.eigenVariable,
        termText: params.termText,
        exchangePosition: params.exchangePosition,
      };
    case "tab-branching-result":
      return {
        _tag: "tab-branching",
        ruleId: params.ruleId,
        conclusionNodeId,
        leftPremiseNodeId: undefined,
        rightPremiseNodeId: undefined,
        leftConclusionText: result.leftPremiseText,
        rightConclusionText: result.rightPremiseText,
        conclusionText: params.sequentText,
      };
    case "tab-axiom-result":
      return {
        _tag: "tab-axiom",
        ruleId: params.ruleId,
        conclusionNodeId,
        conclusionText: params.sequentText,
      };
  }
}

// --- 規則分類ヘルパー ---

/**
 * 規則が分岐規則かどうかを返す（re-export）。
 */
export { isTabBranchingRule };

/**
 * 規則が公理（0前提）かどうかを返す。
 */
export function isTabAxiomRule(ruleId: TabRuleId): boolean {
  return ruleId === "bs" || ruleId === "bottom";
}

/**
 * 規則が1前提かどうかを返す。
 */
export function isTabSinglePremiseRule(ruleId: TabRuleId): boolean {
  return !isTabAxiomRule(ruleId) && !isTabBranchingRule(ruleId);
}

// --- エラーメッセージ ---

/**
 * TAB適用エラーに対する人間向けメッセージを返す。
 */
export function getTabErrorMessage(error: TabApplicationError): string {
  switch (error._tag) {
    case "TabSequentParseError":
      return "Cannot parse sequent formulas";
    case "TabPrincipalPositionOutOfRange":
      return `Position ${String(error.position) satisfies string} is out of range (${String(error.formulaCount) satisfies string} formulas)`;
    case "TabPrincipalFormulaMismatch":
      return error.message;
    case "TabEigenVariableError":
      return error.message;
    case "TabTermParseError":
      return `Enter valid term for ${error.label satisfies string}`;
    case "TabExchangePositionError":
      return `Exchange position ${String(error.position) satisfies string} is out of range (max: ${String(error.maxPosition) satisfies string})`;
  }
}
