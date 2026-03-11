/**
 * SC（ゲンツェン流シーケント計算）規則適用のための純粋ロジック。
 *
 * ワークスペース上のシーケントノードからSC規則を適用して
 * 前提シーケントを計算する。UI層（ProofWorkspace.tsx）から利用される。
 *
 * SCの特徴:
 * - シーケント Γ ⇒ Δ が基本単位
 * - LK: 右辺0個以上、LJ: 右辺高々1、LM: 右辺常に1
 * - ノードの formulaText にはシーケントテキスト（"φ, ψ ⇒ χ, δ"）を格納
 *
 * 変更時は scApplicationLogic.test.ts, workspaceState.ts, index.ts も同期すること。
 */

import { Data, Effect, Either } from "effect";
import type { Formula } from "../logic-core/formula";
import {
  Conjunction,
  Disjunction,
  Implication,
  Negation,
  Universal,
  Existential,
} from "../logic-core/formula";
import { termVariable } from "../logic-core/term";
import {
  isFreeFor,
  substituteTermVariableInFormula,
} from "../logic-core/substitution";
import { freeVariablesInFormula } from "../logic-core/freeVariables";
import { formatFormula } from "../logic-lang/formatUnicode";
import { parseString, parseTermString } from "../logic-lang/parser";
import type { ScRuleId } from "../logic-core/deductionSystem";
import { isScBranchingRule } from "../logic-core/deductionSystem";
import type {
  ScSinglePremiseEdge,
  ScBranchingEdge,
  ScAxiomEdge,
} from "./inferenceEdge";

// --- シーケントテキストのパース ---

/**
 * シーケントテキストの構造。
 * "φ, ψ ⇒ χ, δ" → { antecedentTexts: ["φ", "ψ"], succedentTexts: ["χ", "δ"] }
 */
export type SequentTextParts = {
  readonly antecedentTexts: readonly string[];
  readonly succedentTexts: readonly string[];
};

/**
 * シーケントテキストを左辺と右辺に分割する。
 * "⇒" がなければ全体を左辺とし右辺は空とみなす。
 * 空の側は空配列。
 */
export function splitSequentTextParts(text: string): SequentTextParts {
  const arrowIndex = text.indexOf("⇒");
  if (arrowIndex === -1) {
    // ⇒ なし: 互換性のために全体を左辺として扱う（TABとの互換）
    const parts =
      text.trim() === "" ? [] : text.split(",").map((s) => s.trim());
    return { antecedentTexts: parts, succedentTexts: [] };
  }
  const leftStr = text.slice(0, arrowIndex).trim();
  const rightStr = text.slice(arrowIndex + 1).trim();
  const antecedentTexts =
    leftStr === "" ? [] : leftStr.split(",").map((s) => s.trim());
  const succedentTexts =
    rightStr === "" ? [] : rightStr.split(",").map((s) => s.trim());
  return { antecedentTexts, succedentTexts };
}

/**
 * シーケントの左辺・右辺を論理式配列にパースする。
 * いずれかの論理式パースに失敗した場合はundefinedを返す。
 */
export type ParsedSequent = {
  readonly antecedents: readonly Formula[];
  readonly succedents: readonly Formula[];
};

export function parseSequentText(text: string): ParsedSequent | undefined {
  const parts = splitSequentTextParts(text);
  const antecedents: Formula[] = [];
  for (const t of parts.antecedentTexts) {
    const result = parseString(t);
    if (Either.isLeft(result)) return undefined;
    antecedents.push(result.right);
  }
  const succedents: Formula[] = [];
  for (const t of parts.succedentTexts) {
    const result = parseString(t);
    if (Either.isLeft(result)) return undefined;
    succedents.push(result.right);
  }
  return { antecedents, succedents };
}

/**
 * 論理式配列からシーケントテキストを生成する。
 */
export function formatSequentTextFromFormulas(
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
): string {
  const left = antecedents.map((f) => formatFormula(f)).join(", ");
  const right = succedents.map((f) => formatFormula(f)).join(", ");
  return `${left satisfies string} ⇒ ${right satisfies string}`;
}

// --- エラー型 ---

/** シーケントテキストのパースエラー */
export class ScSequentParseError extends Data.TaggedError(
  "ScSequentParseError",
)<{
  readonly nodeId: string;
}> {}

/** 主論理式の位置が範囲外 */
export class ScPrincipalPositionOutOfRange extends Data.TaggedError(
  "ScPrincipalPositionOutOfRange",
)<{
  readonly side: "left" | "right";
  readonly position: number;
  readonly formulaCount: number;
}> {}

/** 主論理式の構造が規則の要件を満たさない */
export class ScPrincipalFormulaMismatch extends Data.TaggedError(
  "ScPrincipalFormulaMismatch",
)<{
  readonly ruleId: ScRuleId;
  readonly message: string;
}> {}

/** 固有変数条件違反 */
export class ScEigenVariableError extends Data.TaggedError(
  "ScEigenVariableError",
)<{
  readonly variableName: string;
  readonly message: string;
}> {}

/** 項テキストのパースエラー */
export class ScTermParseError extends Data.TaggedError("ScTermParseError")<{
  readonly label: string;
}> {}

/** 交換位置が範囲外 */
export class ScExchangePositionError extends Data.TaggedError(
  "ScExchangePositionError",
)<{
  readonly side: "left" | "right";
  readonly position: number;
  readonly maxPosition: number;
}> {}

/** 成分インデックスが不正 */
export class ScComponentIndexError extends Data.TaggedError(
  "ScComponentIndexError",
)<{
  readonly message: string;
}> {}

export type ScApplicationError =
  | ScSequentParseError
  | ScPrincipalPositionOutOfRange
  | ScPrincipalFormulaMismatch
  | ScEigenVariableError
  | ScTermParseError
  | ScExchangePositionError
  | ScComponentIndexError;

// --- 成功結果型 ---

/** 1前提規則の適用結果 */
export type ScSinglePremiseResult = {
  readonly _tag: "sc-single-result";
  readonly premiseText: string;
};

/** 分岐（2前提）規則の適用結果 */
export type ScBranchingResult = {
  readonly _tag: "sc-branching-result";
  readonly leftPremiseText: string;
  readonly rightPremiseText: string;
};

/** 公理（0前提）の適用結果 */
export type ScAxiomResult = {
  readonly _tag: "sc-axiom-result";
};

export type ScApplicationSuccess =
  | ScSinglePremiseResult
  | ScBranchingResult
  | ScAxiomResult;

export type ScApplicationResult = Either.Either<
  ScApplicationSuccess,
  ScApplicationError
>;

// --- ヘルパー ---

/**
 * 配列から指定位置の要素を除いた残りを返す。
 */
function removeAtIndex<T>(arr: readonly T[], index: number): readonly T[] {
  return [...arr.slice(0, index), ...arr.slice(index + 1)];
}

/**
 * 配列の指定位置に要素を挿入する。
 */
function insertAtIndex<T>(
  arr: readonly T[],
  index: number,
  item: T,
): readonly T[] {
  return [...arr.slice(0, index), item, ...arr.slice(index)];
}

// --- 公理規則 ---

/**
 * identity (ID): φ ⇒ φ（0前提）。
 * 結論の左辺と右辺にそれぞれ少なくとも1つの同じ論理式がある必要がある。
 * ワークスペースでは構造的な公理マークのみ（完全なチェックは後で）。
 */
const validateIdentityEffect = (
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
): Effect.Effect<ScAxiomResult, ScApplicationError> =>
  Effect.gen(function* () {
    if (antecedents.length < 1 || succedents.length < 1) {
      return yield* Effect.fail(
        new ScPrincipalFormulaMismatch({
          ruleId: "identity",
          message: "Identity axiom requires at least 1 formula on each side",
        }),
      );
    }
    return { _tag: "sc-axiom-result" };
  });

/**
 * bottom-left (⊥⇒): ⊥ が左辺にある（0前提）。
 * ワークスペース上では公理マークのみ。⊥の検証は証明チェッカーに委譲。
 * （パーサーが⊥を直接パースできないため、構造チェックは省略）
 */
const validateBottomLeftEffect = (
  antecedents: readonly Formula[],
): Effect.Effect<ScAxiomResult, ScApplicationError> =>
  Effect.gen(function* () {
    if (antecedents.length < 1) {
      return yield* Effect.fail(
        new ScPrincipalFormulaMismatch({
          ruleId: "bottom-left",
          message: "⊥ axiom requires at least 1 formula in antecedents",
        }),
      );
    }
    return { _tag: "sc-axiom-result" };
  });

// --- 構造規則 ---

/**
 * weakening-left (w⇒): Γ ⇒ Δ から φ,Γ ⇒ Δ を導出。
 * 前提は結論から先頭の論理式を除いたもの。
 * principalPosition は追加された論理式の位置。
 */
const validateWeakeningLeftEffect = (
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
  principalPosition: number,
): Effect.Effect<ScSinglePremiseResult, ScApplicationError> =>
  Effect.gen(function* () {
    if (antecedents.length < 1) {
      return yield* Effect.fail(
        new ScPrincipalFormulaMismatch({
          ruleId: "weakening-left",
          message: "Weakening left requires at least 1 formula in antecedents",
        }),
      );
    }
    if (principalPosition < 0 || principalPosition >= antecedents.length) {
      return yield* Effect.fail(
        new ScPrincipalPositionOutOfRange({
          side: "left",
          position: principalPosition,
          formulaCount: antecedents.length,
        }),
      );
    }
    const premiseAntecedents = removeAtIndex(antecedents, principalPosition);
    return {
      _tag: "sc-single-result",
      premiseText: formatSequentTextFromFormulas(
        premiseAntecedents,
        succedents,
      ),
    };
  });

/**
 * weakening-right (⇒w): Γ ⇒ Δ から Γ ⇒ Δ,φ を導出。
 * principalPosition は追加された論理式の位置（右辺内）。
 */
const validateWeakeningRightEffect = (
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
  principalPosition: number,
): Effect.Effect<ScSinglePremiseResult, ScApplicationError> =>
  Effect.gen(function* () {
    if (succedents.length < 1) {
      return yield* Effect.fail(
        new ScPrincipalFormulaMismatch({
          ruleId: "weakening-right",
          message: "Weakening right requires at least 1 formula in succedents",
        }),
      );
    }
    if (principalPosition < 0 || principalPosition >= succedents.length) {
      return yield* Effect.fail(
        new ScPrincipalPositionOutOfRange({
          side: "right",
          position: principalPosition,
          formulaCount: succedents.length,
        }),
      );
    }
    const premiseSuccedents = removeAtIndex(succedents, principalPosition);
    return {
      _tag: "sc-single-result",
      premiseText: formatSequentTextFromFormulas(
        antecedents,
        premiseSuccedents,
      ),
    };
  });

/**
 * contraction-left (c⇒): φ,φ,Γ ⇒ Δ から φ,Γ ⇒ Δ を導出。
 * 前提は結論の指定位置に同じ論理式を複製したもの。
 * principalPosition は縮約される論理式の位置。
 */
const validateContractionLeftEffect = (
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
  principalPosition: number,
): Effect.Effect<ScSinglePremiseResult, ScApplicationError> =>
  Effect.gen(function* () {
    if (antecedents.length < 1) {
      return yield* Effect.fail(
        new ScPrincipalFormulaMismatch({
          ruleId: "contraction-left",
          message:
            "Contraction left requires at least 1 formula in antecedents",
        }),
      );
    }
    if (principalPosition < 0 || principalPosition >= antecedents.length) {
      return yield* Effect.fail(
        new ScPrincipalPositionOutOfRange({
          side: "left",
          position: principalPosition,
          formulaCount: antecedents.length,
        }),
      );
    }
    // 前提: 指定位置の論理式を複製
    const premiseAntecedents = insertAtIndex(
      antecedents,
      principalPosition,
      antecedents[principalPosition]!,
    );
    return {
      _tag: "sc-single-result",
      premiseText: formatSequentTextFromFormulas(
        premiseAntecedents,
        succedents,
      ),
    };
  });

/**
 * contraction-right (⇒c): Γ ⇒ Δ,φ,φ から Γ ⇒ Δ,φ を導出。
 * principalPosition は縮約される論理式の位置（右辺内）。
 */
const validateContractionRightEffect = (
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
  principalPosition: number,
): Effect.Effect<ScSinglePremiseResult, ScApplicationError> =>
  Effect.gen(function* () {
    if (succedents.length < 1) {
      return yield* Effect.fail(
        new ScPrincipalFormulaMismatch({
          ruleId: "contraction-right",
          message:
            "Contraction right requires at least 1 formula in succedents",
        }),
      );
    }
    if (principalPosition < 0 || principalPosition >= succedents.length) {
      return yield* Effect.fail(
        new ScPrincipalPositionOutOfRange({
          side: "right",
          position: principalPosition,
          formulaCount: succedents.length,
        }),
      );
    }
    const premiseSuccedents = insertAtIndex(
      succedents,
      principalPosition,
      succedents[principalPosition]!,
    );
    return {
      _tag: "sc-single-result",
      premiseText: formatSequentTextFromFormulas(
        antecedents,
        premiseSuccedents,
      ),
    };
  });

/**
 * exchange-left (e⇒): Γ,ψ,φ,Σ ⇒ Δ から Γ,φ,ψ,Σ ⇒ Δ を導出。
 * exchangePosition: 交換する位置（position と position+1 を入れ替え）。
 */
const validateExchangeLeftEffect = (
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
  exchangePosition: number,
): Effect.Effect<ScSinglePremiseResult, ScApplicationError> =>
  Effect.gen(function* () {
    if (exchangePosition < 0 || exchangePosition + 1 >= antecedents.length) {
      return yield* Effect.fail(
        new ScExchangePositionError({
          side: "left",
          position: exchangePosition,
          maxPosition: antecedents.length - 2,
        }),
      );
    }
    const result = [...antecedents];
    const tmp = result[exchangePosition]!;
    result[exchangePosition] = result[exchangePosition + 1]!;
    result[exchangePosition + 1] = tmp;
    return {
      _tag: "sc-single-result",
      premiseText: formatSequentTextFromFormulas(result, succedents),
    };
  });

/**
 * exchange-right (⇒e): Γ ⇒ Δ,ψ,φ,Σ から Γ ⇒ Δ,φ,ψ,Σ を導出。
 * exchangePosition: 交換する位置（右辺内）。
 */
const validateExchangeRightEffect = (
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
  exchangePosition: number,
): Effect.Effect<ScSinglePremiseResult, ScApplicationError> =>
  Effect.gen(function* () {
    if (exchangePosition < 0 || exchangePosition + 1 >= succedents.length) {
      return yield* Effect.fail(
        new ScExchangePositionError({
          side: "right",
          position: exchangePosition,
          maxPosition: succedents.length - 2,
        }),
      );
    }
    const result = [...succedents];
    const tmp = result[exchangePosition]!;
    result[exchangePosition] = result[exchangePosition + 1]!;
    result[exchangePosition + 1] = tmp;
    return {
      _tag: "sc-single-result",
      premiseText: formatSequentTextFromFormulas(antecedents, result),
    };
  });

// --- 論理規則 ---

/**
 * implication-right (⇒→): φ,Γ ⇒ Δ,ψ から Γ ⇒ Δ,φ→ψ を導出。
 * principalPosition は結論右辺での φ→ψ の位置。
 */
const validateImplicationRightEffect = (
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
  principalPosition: number,
): Effect.Effect<ScSinglePremiseResult, ScApplicationError> =>
  Effect.gen(function* () {
    if (principalPosition < 0 || principalPosition >= succedents.length) {
      return yield* Effect.fail(
        new ScPrincipalPositionOutOfRange({
          side: "right",
          position: principalPosition,
          formulaCount: succedents.length,
        }),
      );
    }
    const principal = succedents[principalPosition]!;
    if (!(principal instanceof Implication)) {
      return yield* Effect.fail(
        new ScPrincipalFormulaMismatch({
          ruleId: "implication-right",
          message: "Principal formula must be φ→ψ",
        }),
      );
    }
    // 前提: φ,Γ ⇒ Δ,ψ
    const premiseAntecedents = [principal.left, ...antecedents];
    const premiseSuccedents = [
      ...succedents.slice(0, principalPosition),
      principal.right,
      ...succedents.slice(principalPosition + 1),
    ];
    return {
      _tag: "sc-single-result",
      premiseText: formatSequentTextFromFormulas(
        premiseAntecedents,
        premiseSuccedents,
      ),
    };
  });

/**
 * implication-left (→⇒): 分岐規則。
 *   左前提: Γ ⇒ Π,φ
 *   右前提: ψ,Σ ⇒ Δ
 *   結論: Γ,φ→ψ,Σ ⇒ Π,Δ
 *
 * principalPosition は結論左辺での φ→ψ の位置。
 */
const validateImplicationLeftEffect = (
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
  principalPosition: number,
): Effect.Effect<ScBranchingResult, ScApplicationError> =>
  Effect.gen(function* () {
    if (principalPosition < 0 || principalPosition >= antecedents.length) {
      return yield* Effect.fail(
        new ScPrincipalPositionOutOfRange({
          side: "left",
          position: principalPosition,
          formulaCount: antecedents.length,
        }),
      );
    }
    const principal = antecedents[principalPosition]!;
    if (!(principal instanceof Implication)) {
      return yield* Effect.fail(
        new ScPrincipalFormulaMismatch({
          ruleId: "implication-left",
          message: "Principal formula must be φ→ψ",
        }),
      );
    }
    // Γ = antecedents[0..position), Σ = antecedents[position+1..)
    const gamma = antecedents.slice(0, principalPosition);
    const sigma = antecedents.slice(principalPosition + 1);
    // 簡略化: 結論の右辺を Π=[] / Δ=succedents と分割（UI上で位置を指定していない）
    // 左前提: Γ ⇒ φ  (Π=空で簡略化)
    // 右前提: ψ,Σ ⇒ Δ
    const leftPremiseText = formatSequentTextFromFormulas(gamma, [
      principal.left,
    ]);
    const rightPremiseText = formatSequentTextFromFormulas(
      [principal.right, ...sigma],
      succedents,
    );
    return {
      _tag: "sc-branching-result",
      leftPremiseText,
      rightPremiseText,
    };
  });

/**
 * negation-left (¬⇒): Γ ⇒ Δ,φ から ¬φ,Γ ⇒ Δ を導出。
 * principalPosition は結論左辺での ¬φ の位置。
 * 前件の ¬φ を除去し、その中身 φ を後件に追加する。
 */
const validateNegationLeftEffect = (
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
  principalPosition: number,
): Effect.Effect<ScSinglePremiseResult, ScApplicationError> =>
  Effect.gen(function* () {
    if (principalPosition < 0 || principalPosition >= antecedents.length) {
      return yield* Effect.fail(
        new ScPrincipalPositionOutOfRange({
          side: "left",
          position: principalPosition,
          formulaCount: antecedents.length,
        }),
      );
    }
    const principal = antecedents[principalPosition]!;
    if (!(principal instanceof Negation)) {
      return yield* Effect.fail(
        new ScPrincipalFormulaMismatch({
          ruleId: "negation-left",
          message: "Principal formula must be ¬φ",
        }),
      );
    }
    // 前提: Γ ⇒ Δ,φ（¬φを前件から除去し、φを後件の末尾に追加）
    const premiseAntecedents = [
      ...antecedents.slice(0, principalPosition),
      ...antecedents.slice(principalPosition + 1),
    ];
    const premiseSuccedents = [...succedents, principal.formula];
    return {
      _tag: "sc-single-result",
      premiseText: formatSequentTextFromFormulas(
        premiseAntecedents,
        premiseSuccedents,
      ),
    };
  });

/**
 * negation-right (⇒¬): φ,Γ ⇒ Δ から Γ ⇒ Δ,¬φ を導出。
 * principalPosition は結論右辺での ¬φ の位置。
 * 後件の ¬φ を除去し、その中身 φ を前件の先頭に追加する。
 */
const validateNegationRightEffect = (
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
  principalPosition: number,
): Effect.Effect<ScSinglePremiseResult, ScApplicationError> =>
  Effect.gen(function* () {
    if (principalPosition < 0 || principalPosition >= succedents.length) {
      return yield* Effect.fail(
        new ScPrincipalPositionOutOfRange({
          side: "right",
          position: principalPosition,
          formulaCount: succedents.length,
        }),
      );
    }
    const principal = succedents[principalPosition]!;
    if (!(principal instanceof Negation)) {
      return yield* Effect.fail(
        new ScPrincipalFormulaMismatch({
          ruleId: "negation-right",
          message: "Principal formula must be ¬φ",
        }),
      );
    }
    // 前提: φ,Γ ⇒ Δ（¬φを後件から除去し、φを前件の先頭に追加）
    const premiseAntecedents = [principal.formula, ...antecedents];
    const premiseSuccedents = [
      ...succedents.slice(0, principalPosition),
      ...succedents.slice(principalPosition + 1),
    ];
    return {
      _tag: "sc-single-result",
      premiseText: formatSequentTextFromFormulas(
        premiseAntecedents,
        premiseSuccedents,
      ),
    };
  });

/**
 * conjunction-left (∧⇒): φ_i,Γ ⇒ Δ から φ1∧φ2,Γ ⇒ Δ を導出。
 * principalPosition は結論左辺での φ1∧φ2 の位置。
 * componentIndex: 1 = 左成分(φ1)を使う, 2 = 右成分(φ2)を使う。
 */
const validateConjunctionLeftEffect = (
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
  principalPosition: number,
  componentIndex: 1 | 2,
): Effect.Effect<ScSinglePremiseResult, ScApplicationError> =>
  Effect.gen(function* () {
    if (principalPosition < 0 || principalPosition >= antecedents.length) {
      return yield* Effect.fail(
        new ScPrincipalPositionOutOfRange({
          side: "left",
          position: principalPosition,
          formulaCount: antecedents.length,
        }),
      );
    }
    const principal = antecedents[principalPosition]!;
    if (!(principal instanceof Conjunction)) {
      return yield* Effect.fail(
        new ScPrincipalFormulaMismatch({
          ruleId: "conjunction-left",
          message: "Principal formula must be φ∧ψ",
        }),
      );
    }
    const component = componentIndex === 1 ? principal.left : principal.right;
    const premiseAntecedents = [
      ...antecedents.slice(0, principalPosition),
      component,
      ...antecedents.slice(principalPosition + 1),
    ];
    return {
      _tag: "sc-single-result",
      premiseText: formatSequentTextFromFormulas(
        premiseAntecedents,
        succedents,
      ),
    };
  });

/**
 * conjunction-right (⇒∧): 分岐規則。
 *   左前提: Γ ⇒ Δ,φ1
 *   右前提: Γ ⇒ Δ,φ2
 *   結論: Γ ⇒ Δ,φ1∧φ2
 *
 * principalPosition は結論右辺での φ1∧φ2 の位置。
 */
const validateConjunctionRightEffect = (
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
  principalPosition: number,
): Effect.Effect<ScBranchingResult, ScApplicationError> =>
  Effect.gen(function* () {
    if (principalPosition < 0 || principalPosition >= succedents.length) {
      return yield* Effect.fail(
        new ScPrincipalPositionOutOfRange({
          side: "right",
          position: principalPosition,
          formulaCount: succedents.length,
        }),
      );
    }
    const principal = succedents[principalPosition]!;
    if (!(principal instanceof Conjunction)) {
      return yield* Effect.fail(
        new ScPrincipalFormulaMismatch({
          ruleId: "conjunction-right",
          message: "Principal formula must be φ∧ψ",
        }),
      );
    }
    const restSuccedents = removeAtIndex(succedents, principalPosition);
    const leftPremiseText = formatSequentTextFromFormulas(antecedents, [
      ...restSuccedents,
      principal.left,
    ]);
    const rightPremiseText = formatSequentTextFromFormulas(antecedents, [
      ...restSuccedents,
      principal.right,
    ]);
    return {
      _tag: "sc-branching-result",
      leftPremiseText,
      rightPremiseText,
    };
  });

/**
 * disjunction-right (⇒∨): Γ ⇒ Δ,φ_i から Γ ⇒ Δ,φ1∨φ2 を導出。
 * principalPosition は結論右辺での φ1∨φ2 の位置。
 * componentIndex: 1 = 左成分(φ1), 2 = 右成分(φ2)。
 */
const validateDisjunctionRightEffect = (
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
  principalPosition: number,
  componentIndex: 1 | 2,
): Effect.Effect<ScSinglePremiseResult, ScApplicationError> =>
  Effect.gen(function* () {
    if (principalPosition < 0 || principalPosition >= succedents.length) {
      return yield* Effect.fail(
        new ScPrincipalPositionOutOfRange({
          side: "right",
          position: principalPosition,
          formulaCount: succedents.length,
        }),
      );
    }
    const principal = succedents[principalPosition]!;
    if (!(principal instanceof Disjunction)) {
      return yield* Effect.fail(
        new ScPrincipalFormulaMismatch({
          ruleId: "disjunction-right",
          message: "Principal formula must be φ∨ψ",
        }),
      );
    }
    const component = componentIndex === 1 ? principal.left : principal.right;
    const premiseSuccedents = [
      ...succedents.slice(0, principalPosition),
      component,
      ...succedents.slice(principalPosition + 1),
    ];
    return {
      _tag: "sc-single-result",
      premiseText: formatSequentTextFromFormulas(
        antecedents,
        premiseSuccedents,
      ),
    };
  });

/**
 * disjunction-left (∨⇒): 分岐規則。
 *   左前提: φ1,Γ ⇒ Δ
 *   右前提: φ2,Γ ⇒ Δ
 *   結論: φ1∨φ2,Γ ⇒ Δ
 *
 * principalPosition は結論左辺での φ1∨φ2 の位置。
 */
const validateDisjunctionLeftEffect = (
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
  principalPosition: number,
): Effect.Effect<ScBranchingResult, ScApplicationError> =>
  Effect.gen(function* () {
    if (principalPosition < 0 || principalPosition >= antecedents.length) {
      return yield* Effect.fail(
        new ScPrincipalPositionOutOfRange({
          side: "left",
          position: principalPosition,
          formulaCount: antecedents.length,
        }),
      );
    }
    const principal = antecedents[principalPosition]!;
    if (!(principal instanceof Disjunction)) {
      return yield* Effect.fail(
        new ScPrincipalFormulaMismatch({
          ruleId: "disjunction-left",
          message: "Principal formula must be φ∨ψ",
        }),
      );
    }
    const restAntecedents = removeAtIndex(antecedents, principalPosition);
    const leftPremiseText = formatSequentTextFromFormulas(
      [principal.left, ...restAntecedents],
      succedents,
    );
    const rightPremiseText = formatSequentTextFromFormulas(
      [principal.right, ...restAntecedents],
      succedents,
    );
    return {
      _tag: "sc-branching-result",
      leftPremiseText,
      rightPremiseText,
    };
  });

/**
 * cut (CUT): 分岐規則。
 *   左前提: Γ ⇒ Π,φ
 *   右前提: φ,Σ ⇒ Δ
 *   結論: Γ,Σ ⇒ Π,Δ
 *
 * cutFormulaText: カット式のテキスト。
 */
const validateCutEffect = (
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
  cutFormulaText: string,
): Effect.Effect<ScBranchingResult, ScApplicationError> =>
  Effect.gen(function* () {
    if (cutFormulaText.trim() === "") {
      return yield* Effect.fail(
        new ScPrincipalFormulaMismatch({
          ruleId: "cut",
          message: "Cut formula text is required",
        }),
      );
    }
    const cutFormulaResult = parseString(cutFormulaText.trim());
    if (Either.isLeft(cutFormulaResult)) {
      return yield* Effect.fail(
        new ScSequentParseError({ nodeId: "cut-formula" }),
      );
    }
    const cutFormula = cutFormulaResult.right;
    // 簡略化: Γ=antecedents, Σ=[], Π=[], Δ=succedents
    // 左前提: Γ ⇒ φ
    // 右前提: φ ⇒ Δ
    const leftPremiseText = formatSequentTextFromFormulas(antecedents, [
      cutFormula,
    ]);
    const rightPremiseText = formatSequentTextFromFormulas(
      [cutFormula],
      succedents,
    );
    return {
      _tag: "sc-branching-result",
      leftPremiseText,
      rightPremiseText,
    };
  });

// --- 量化子規則 ---

/**
 * universal-left (∀⇒): φ[τ/ξ],Γ ⇒ Δ から ∀ξφ,Γ ⇒ Δ を導出。
 * principalPosition は結論左辺での ∀ξφ の位置。
 * termText は代入する項のテキスト。
 */
const validateUniversalLeftEffect = (
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
  principalPosition: number,
  termText: string,
): Effect.Effect<ScSinglePremiseResult, ScApplicationError> =>
  Effect.gen(function* () {
    if (principalPosition < 0 || principalPosition >= antecedents.length) {
      return yield* Effect.fail(
        new ScPrincipalPositionOutOfRange({
          side: "left",
          position: principalPosition,
          formulaCount: antecedents.length,
        }),
      );
    }
    const principal = antecedents[principalPosition]!;
    if (!(principal instanceof Universal)) {
      return yield* Effect.fail(
        new ScPrincipalFormulaMismatch({
          ruleId: "universal-left",
          message: "Principal formula must be ∀ξφ",
        }),
      );
    }
    if (termText.trim() === "") {
      return yield* Effect.fail(
        new ScTermParseError({ label: "substitution term (τ)" }),
      );
    }
    const termResult = parseTermString(termText.trim());
    if (Either.isLeft(termResult)) {
      return yield* Effect.fail(
        new ScTermParseError({ label: "substitution term (τ)" }),
      );
    }
    const tau = termResult.right;
    const xi = principal.variable;
    const body = principal.formula;
    if (!isFreeFor(tau, xi, body)) {
      return yield* Effect.fail(
        new ScEigenVariableError({
          variableName: xi.name,
          message: `Term is not free for ${xi.name satisfies string} in the formula body`,
        }),
      );
    }
    const substituted = substituteTermVariableInFormula(body, xi, tau);
    const premiseAntecedents = [
      ...antecedents.slice(0, principalPosition),
      substituted,
      ...antecedents.slice(principalPosition + 1),
    ];
    return {
      _tag: "sc-single-result",
      premiseText: formatSequentTextFromFormulas(
        premiseAntecedents,
        succedents,
      ),
    };
  });

/**
 * universal-right (⇒∀): Γ ⇒ Δ,φ[ζ/ξ] から Γ ⇒ Δ,∀ξφ を導出。
 * principalPosition は結論右辺での ∀ξφ の位置。
 * eigenVariable は固有変数名。ζ ∉ fv(Γ) ∪ fv(Δ) ∪ fv(∀ξφ)。
 */
const validateUniversalRightEffect = (
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
  principalPosition: number,
  eigenVariable: string,
): Effect.Effect<ScSinglePremiseResult, ScApplicationError> =>
  Effect.gen(function* () {
    if (principalPosition < 0 || principalPosition >= succedents.length) {
      return yield* Effect.fail(
        new ScPrincipalPositionOutOfRange({
          side: "right",
          position: principalPosition,
          formulaCount: succedents.length,
        }),
      );
    }
    const principal = succedents[principalPosition]!;
    if (!(principal instanceof Universal)) {
      return yield* Effect.fail(
        new ScPrincipalFormulaMismatch({
          ruleId: "universal-right",
          message: "Principal formula must be ∀ξφ",
        }),
      );
    }
    if (eigenVariable.trim() === "") {
      return yield* Effect.fail(
        new ScEigenVariableError({
          variableName: "",
          message: "Eigen variable name is required",
        }),
      );
    }
    const zeta = eigenVariable.trim();
    // 固有変数条件: ζ ∉ fv(Γ) ∪ fv(Δ) ∪ fv(∀ξφ)
    const allFreeVars = new Set<string>();
    for (const f of antecedents) {
      for (const v of freeVariablesInFormula(f)) {
        allFreeVars.add(v);
      }
    }
    for (const f of succedents) {
      for (const v of freeVariablesInFormula(f)) {
        allFreeVars.add(v);
      }
    }
    if (allFreeVars.has(zeta)) {
      return yield* Effect.fail(
        new ScEigenVariableError({
          variableName: zeta,
          message: `Eigen variable ${zeta satisfies string} must not occur free in the sequent`,
        }),
      );
    }
    const xi = principal.variable;
    const body = principal.formula;
    const zetaVar = termVariable(zeta);
    const substituted = substituteTermVariableInFormula(body, xi, zetaVar);
    const premiseSuccedents = [
      ...succedents.slice(0, principalPosition),
      substituted,
      ...succedents.slice(principalPosition + 1),
    ];
    return {
      _tag: "sc-single-result",
      premiseText: formatSequentTextFromFormulas(
        antecedents,
        premiseSuccedents,
      ),
    };
  });

/**
 * existential-left (∃⇒): φ[ζ/ξ],Γ ⇒ Δ から ∃ξφ,Γ ⇒ Δ を導出。
 * principalPosition は結論左辺での ∃ξφ の位置。
 * eigenVariable は固有変数名。ζ ∉ fv(∃ξφ) ∪ fv(Γ) ∪ fv(Δ)。
 */
const validateExistentialLeftEffect = (
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
  principalPosition: number,
  eigenVariable: string,
): Effect.Effect<ScSinglePremiseResult, ScApplicationError> =>
  Effect.gen(function* () {
    if (principalPosition < 0 || principalPosition >= antecedents.length) {
      return yield* Effect.fail(
        new ScPrincipalPositionOutOfRange({
          side: "left",
          position: principalPosition,
          formulaCount: antecedents.length,
        }),
      );
    }
    const principal = antecedents[principalPosition]!;
    if (!(principal instanceof Existential)) {
      return yield* Effect.fail(
        new ScPrincipalFormulaMismatch({
          ruleId: "existential-left",
          message: "Principal formula must be ∃ξφ",
        }),
      );
    }
    if (eigenVariable.trim() === "") {
      return yield* Effect.fail(
        new ScEigenVariableError({
          variableName: "",
          message: "Eigen variable name is required",
        }),
      );
    }
    const zeta = eigenVariable.trim();
    const allFreeVars = new Set<string>();
    for (const f of antecedents) {
      for (const v of freeVariablesInFormula(f)) {
        allFreeVars.add(v);
      }
    }
    for (const f of succedents) {
      for (const v of freeVariablesInFormula(f)) {
        allFreeVars.add(v);
      }
    }
    if (allFreeVars.has(zeta)) {
      return yield* Effect.fail(
        new ScEigenVariableError({
          variableName: zeta,
          message: `Eigen variable ${zeta satisfies string} must not occur free in the sequent`,
        }),
      );
    }
    const xi = principal.variable;
    const body = principal.formula;
    const zetaVar = termVariable(zeta);
    const substituted = substituteTermVariableInFormula(body, xi, zetaVar);
    const premiseAntecedents = [
      ...antecedents.slice(0, principalPosition),
      substituted,
      ...antecedents.slice(principalPosition + 1),
    ];
    return {
      _tag: "sc-single-result",
      premiseText: formatSequentTextFromFormulas(
        premiseAntecedents,
        succedents,
      ),
    };
  });

/**
 * existential-right (⇒∃): Γ ⇒ Δ,φ[τ/ξ] から Γ ⇒ Δ,∃ξφ を導出。
 * principalPosition は結論右辺での ∃ξφ の位置。
 * termText は代入する項のテキスト。
 */
const validateExistentialRightEffect = (
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
  principalPosition: number,
  termText: string,
): Effect.Effect<ScSinglePremiseResult, ScApplicationError> =>
  Effect.gen(function* () {
    if (principalPosition < 0 || principalPosition >= succedents.length) {
      return yield* Effect.fail(
        new ScPrincipalPositionOutOfRange({
          side: "right",
          position: principalPosition,
          formulaCount: succedents.length,
        }),
      );
    }
    const principal = succedents[principalPosition]!;
    if (!(principal instanceof Existential)) {
      return yield* Effect.fail(
        new ScPrincipalFormulaMismatch({
          ruleId: "existential-right",
          message: "Principal formula must be ∃ξφ",
        }),
      );
    }
    if (termText.trim() === "") {
      return yield* Effect.fail(
        new ScTermParseError({ label: "substitution term (τ)" }),
      );
    }
    const termResult = parseTermString(termText.trim());
    if (Either.isLeft(termResult)) {
      return yield* Effect.fail(
        new ScTermParseError({ label: "substitution term (τ)" }),
      );
    }
    const tau = termResult.right;
    const xi = principal.variable;
    const body = principal.formula;
    if (!isFreeFor(tau, xi, body)) {
      return yield* Effect.fail(
        new ScEigenVariableError({
          variableName: xi.name,
          message: `Term is not free for ${xi.name satisfies string} in the formula body`,
        }),
      );
    }
    const substituted = substituteTermVariableInFormula(body, xi, tau);
    const premiseSuccedents = [
      ...succedents.slice(0, principalPosition),
      substituted,
      ...succedents.slice(principalPosition + 1),
    ];
    return {
      _tag: "sc-single-result",
      premiseText: formatSequentTextFromFormulas(
        antecedents,
        premiseSuccedents,
      ),
    };
  });

// --- 否定規則（¬ を →⊥ として分解） ---
// SC では否定は ¬φ = φ→⊥ として扱うことが多い。
// しかし、否定の左規則・右規則は implication-left/right で自然にカバーされるため、
// 独立した否定規則は実装しない。

// --- 統合バリデーション ---

/** SC規則適用のパラメータ */
export type ScRuleApplicationParams = {
  /** 適用する規則 */
  readonly ruleId: ScRuleId;
  /** シーケントのテキスト（"Γ ⇒ Δ" 形式） */
  readonly sequentText: string;
  /** 主論理式の位置（0-based）。左辺または右辺内での位置。 */
  readonly principalPosition: number;
  /** 固有変数名（∀右規則, ∃左規則用） */
  readonly eigenVariable?: string;
  /** 代入項テキスト（∀左規則, ∃右規則用） */
  readonly termText?: string;
  /** 交換位置（e規則用） */
  readonly exchangePosition?: number;
  /** 成分インデックス（∧左規則, ∨右規則用: 1 or 2） */
  readonly componentIndex?: 1 | 2;
  /** カット式テキスト（cut規則用） */
  readonly cutFormulaText?: string;
};

/**
 * SC規則適用のバリデーション（Effect版）。
 */
export const validateScApplicationEffect = (
  params: ScRuleApplicationParams,
): Effect.Effect<ScApplicationSuccess, ScApplicationError> =>
  Effect.gen(function* () {
    const parsed = parseSequentText(params.sequentText);
    if (parsed === undefined) {
      return yield* Effect.fail(
        new ScSequentParseError({ nodeId: "conclusion" }),
      );
    }
    const { antecedents, succedents } = parsed;

    switch (params.ruleId) {
      // 公理規則
      case "identity":
        return yield* validateIdentityEffect(antecedents, succedents);
      case "bottom-left":
        return yield* validateBottomLeftEffect(antecedents);

      // 構造規則
      case "weakening-left":
        return yield* validateWeakeningLeftEffect(
          antecedents,
          succedents,
          params.principalPosition,
        );
      case "weakening-right":
        return yield* validateWeakeningRightEffect(
          antecedents,
          succedents,
          params.principalPosition,
        );
      case "contraction-left":
        return yield* validateContractionLeftEffect(
          antecedents,
          succedents,
          params.principalPosition,
        );
      case "contraction-right":
        return yield* validateContractionRightEffect(
          antecedents,
          succedents,
          params.principalPosition,
        );
      case "exchange-left":
        return yield* validateExchangeLeftEffect(
          antecedents,
          succedents,
          params.exchangePosition ?? 0,
        );
      case "exchange-right":
        return yield* validateExchangeRightEffect(
          antecedents,
          succedents,
          params.exchangePosition ?? 0,
        );

      // カット規則
      case "cut":
        return yield* validateCutEffect(
          antecedents,
          succedents,
          params.cutFormulaText ?? "",
        );

      // 論理規則
      case "implication-right":
        return yield* validateImplicationRightEffect(
          antecedents,
          succedents,
          params.principalPosition,
        );
      case "implication-left":
        return yield* validateImplicationLeftEffect(
          antecedents,
          succedents,
          params.principalPosition,
        );
      case "conjunction-left":
        return yield* validateConjunctionLeftEffect(
          antecedents,
          succedents,
          params.principalPosition,
          /* v8 ignore start -- UI経由では常にcomponentIndexを明示的に指定 */
          params.componentIndex ?? 1,
          /* v8 ignore stop */
        );
      case "conjunction-right":
        return yield* validateConjunctionRightEffect(
          antecedents,
          succedents,
          params.principalPosition,
        );
      case "disjunction-right":
        return yield* validateDisjunctionRightEffect(
          antecedents,
          succedents,
          params.principalPosition,
          /* v8 ignore start -- UI経由では常にcomponentIndexを明示的に指定 */
          params.componentIndex ?? 1,
          /* v8 ignore stop */
        );
      case "disjunction-left":
        return yield* validateDisjunctionLeftEffect(
          antecedents,
          succedents,
          params.principalPosition,
        );
      case "negation-left":
        return yield* validateNegationLeftEffect(
          antecedents,
          succedents,
          params.principalPosition,
        );
      case "negation-right":
        return yield* validateNegationRightEffect(
          antecedents,
          succedents,
          params.principalPosition,
        );
      case "universal-left":
        return yield* validateUniversalLeftEffect(
          antecedents,
          succedents,
          params.principalPosition,
          /* v8 ignore start -- UI経由では常にtermTextを明示的に指定 */
          params.termText ?? "",
          /* v8 ignore stop */
        );
      case "universal-right":
        return yield* validateUniversalRightEffect(
          antecedents,
          succedents,
          params.principalPosition,
          /* v8 ignore start -- UI経由では常にeigenVariableを明示的に指定 */
          params.eigenVariable ?? "",
          /* v8 ignore stop */
        );
      case "existential-left":
        return yield* validateExistentialLeftEffect(
          antecedents,
          succedents,
          params.principalPosition,
          /* v8 ignore start -- UI経由では常にeigenVariableを明示的に指定 */
          params.eigenVariable ?? "",
          /* v8 ignore stop */
        );
      case "existential-right":
        return yield* validateExistentialRightEffect(
          antecedents,
          succedents,
          params.principalPosition,
          /* v8 ignore start -- UI経由では常にtermTextを明示的に指定 */
          params.termText ?? "",
          /* v8 ignore stop */
        );
    }
  });

/**
 * SC規則適用のバリデーション（同期版: Either を返す）。
 */
export const validateScApplication = (
  params: ScRuleApplicationParams,
): ScApplicationResult =>
  Effect.runSync(Effect.either(validateScApplicationEffect(params)));

// --- エッジ生成ヘルパー ---

/**
 * バリデーション結果からScInferenceEdgeを生成する。
 */
export function createScEdgeFromResult(
  params: ScRuleApplicationParams,
  result: ScApplicationSuccess,
  conclusionNodeId: string,
): ScSinglePremiseEdge | ScBranchingEdge | ScAxiomEdge {
  switch (result._tag) {
    case "sc-single-result":
      return {
        _tag: "sc-single",
        ruleId: params.ruleId,
        conclusionNodeId,
        premiseNodeId: undefined,
        conclusionText: params.sequentText,
        eigenVariable: params.eigenVariable,
        termText: params.termText,
        exchangePosition: params.exchangePosition,
        componentIndex: params.componentIndex,
        cutFormulaText: params.cutFormulaText,
      };
    case "sc-branching-result":
      return {
        _tag: "sc-branching",
        ruleId: params.ruleId,
        conclusionNodeId,
        leftPremiseNodeId: undefined,
        rightPremiseNodeId: undefined,
        leftConclusionText: result.leftPremiseText,
        rightConclusionText: result.rightPremiseText,
        conclusionText: params.sequentText,
      };
    case "sc-axiom-result":
      return {
        _tag: "sc-axiom",
        ruleId: params.ruleId,
        conclusionNodeId,
        conclusionText: params.sequentText,
      };
  }
}

// --- 規則分類ヘルパー ---

/** 規則が分岐規則かどうかを返す（re-export）。 */
export { isScBranchingRule };

/** 規則が公理（0前提）かどうかを返す。 */
export function isScAxiomRule(ruleId: ScRuleId): boolean {
  return ruleId === "identity" || ruleId === "bottom-left";
}

/** 規則が1前提かどうかを返す。 */
export function isScSinglePremiseRule(ruleId: ScRuleId): boolean {
  return !isScAxiomRule(ruleId) && !isScBranchingRule(ruleId);
}

// --- エラーメッセージ ---

/**
 * SC適用エラーに対する人間向けメッセージを返す。
 */
export function getScErrorMessage(error: ScApplicationError): string {
  switch (error._tag) {
    case "ScSequentParseError":
      return "Cannot parse sequent";
    case "ScPrincipalPositionOutOfRange":
      return `Position ${String(error.position) satisfies string} is out of range on ${error.side satisfies string} side (${String(error.formulaCount) satisfies string} formulas)`;
    case "ScPrincipalFormulaMismatch":
      return error.message;
    case "ScEigenVariableError":
      return error.message;
    case "ScTermParseError":
      return `Enter valid term for ${error.label satisfies string}`;
    case "ScExchangePositionError":
      return `Exchange position ${String(error.position) satisfies string} is out of range on ${error.side satisfies string} side (max: ${String(error.maxPosition) satisfies string})`;
    case "ScComponentIndexError":
      return error.message;
  }
}
