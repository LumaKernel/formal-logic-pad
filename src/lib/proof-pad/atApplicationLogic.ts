/**
 * 分析的タブロー（AT）規則適用のための純粋ロジック。
 *
 * ワークスペース上の署名付き論理式ノードからAT規則を適用して
 * 結果ノードを計算する。UI層から利用される。
 *
 * ATの特徴:
 * - ノードは署名付き論理式（T:φ または F:φ）
 * - 1ノード = 1論理式（TABのシーケントとは異なる）
 * - α規則（非分岐）: 1-2個の結論を同一枝上に追加
 * - β規則（分岐）: 2つの枝に分岐
 * - γ規則（全称）: 任意の項で代入
 * - δ規則（存在）: 固有変数で代入
 * - closure: 枝上に T(φ) と F(φ) が存在 → 閉じる
 *
 * 変更時は atApplicationLogic.test.ts, workspaceState.ts, index.ts も同期すること。
 */

import { Data, Effect, Either } from "effect";
import { parseString, parseTermString } from "../logic-lang/parser";
import { formatFormula } from "../logic-lang/formatUnicode";
import type {
  Sign,
  SignedFormula,
  AtRuleId,
} from "../logic-core/analyticTableau";
import {
  signedFormula,
  applyAlphaRule,
  applyBetaRule,
  applyGammaRule,
  applyDeltaRule,
  classifySignedFormula,
  isAlphaRule,
  isBetaRule,
  isGammaRule,
  isDeltaRule,
  isClosureRule,
  checkEigenVariableCondition,
} from "../logic-core/analyticTableau";
import type {
  AtAlphaEdge,
  AtBetaEdge,
  AtGammaEdge,
  AtDeltaEdge,
  AtClosedEdge,
} from "./inferenceEdge";

// --- 署名付き論理式テキストのパース/フォーマット ---

/**
 * 署名付き論理式テキストのフォーマット: "T:φ" または "F:φ"。
 * 符号と論理式をコロンで区切る。
 */
export function formatSignedFormulaText(sf: SignedFormula): string {
  return `${sf.sign satisfies string}:${formatFormula(sf.formula) satisfies string}`;
}

/**
 * 署名付き論理式テキストをパースする。
 * "T:φ" → { sign: "T", formula: parse(φ) }
 * パース失敗時はundefinedを返す。
 */
export function parseSignedFormulaText(
  text: string,
): SignedFormula | undefined {
  const trimmed = text.trim();
  // "T:" or "F:" prefix
  if (trimmed.length < 3) return undefined;
  const prefix = trimmed.slice(0, 2);
  if (prefix !== "T:" && prefix !== "F:") return undefined;
  const sign: Sign = prefix === "T:" ? "T" : "F";
  const formulaText = trimmed.slice(2).trim();
  /* v8 ignore start -- trimmedは末尾空白なし(trim済み)かつlength>=3なので、slice(2)は必ず非空白文字を含む。防御的ガード */
  if (formulaText === "") return undefined;
  /* v8 ignore stop */
  const result = parseString(formulaText);
  if (Either.isLeft(result)) return undefined;
  return signedFormula(sign, result.right);
}

// --- エラー型 ---

/** 署名付き論理式のパースエラー */
export class AtFormulaParseError extends Data.TaggedError(
  "AtFormulaParseError",
)<{
  readonly nodeId: string;
}> {}

/** 主論理式の構造が規則の要件を満たさない */
export class AtPrincipalFormulaMismatch extends Data.TaggedError(
  "AtPrincipalFormulaMismatch",
)<{
  readonly ruleId: AtRuleId;
  readonly message: string;
}> {}

/** 固有変数条件違反 */
export class AtEigenVariableError extends Data.TaggedError(
  "AtEigenVariableError",
)<{
  readonly variableName: string;
  readonly message: string;
}> {}

/** 項テキストのパースエラー */
export class AtTermParseError extends Data.TaggedError("AtTermParseError")<{
  readonly label: string;
}> {}

/** 矛盾ノードのパースエラー */
export class AtContradictionError extends Data.TaggedError(
  "AtContradictionError",
)<{
  readonly message: string;
}> {}

export type AtApplicationError =
  | AtFormulaParseError
  | AtPrincipalFormulaMismatch
  | AtEigenVariableError
  | AtTermParseError
  | AtContradictionError;

// --- 成功結果型 ---

/** α規則（非分岐）の適用結果 */
export type AtAlphaResult = {
  readonly _tag: "at-alpha-result";
  readonly ruleId: AtRuleId;
  /** 1つ目の結論テキスト */
  readonly resultText: string;
  /** 2つ目の結論テキスト（2個結論の場合） */
  readonly secondResultText: string | undefined;
};

/** β規則（分岐）の適用結果 */
export type AtBetaResult = {
  readonly _tag: "at-beta-result";
  readonly ruleId: AtRuleId;
  /** 左枝結論テキスト */
  readonly leftResultText: string;
  /** 右枝結論テキスト */
  readonly rightResultText: string;
};

/** γ規則の適用結果 */
export type AtGammaResult = {
  readonly _tag: "at-gamma-result";
  readonly ruleId: AtRuleId;
  /** 結論テキスト */
  readonly resultText: string;
  /** 使用した代入項テキスト */
  readonly termText: string;
};

/** δ規則の適用結果 */
export type AtDeltaResult = {
  readonly _tag: "at-delta-result";
  readonly ruleId: AtRuleId;
  /** 結論テキスト */
  readonly resultText: string;
  /** 使用した固有変数名 */
  readonly eigenVariable: string;
};

/** closure の適用結果 */
export type AtClosedResult = {
  readonly _tag: "at-closed-result";
};

export type AtApplicationSuccess =
  | AtAlphaResult
  | AtBetaResult
  | AtGammaResult
  | AtDeltaResult
  | AtClosedResult;

export type AtApplicationResult = Either.Either<
  AtApplicationSuccess,
  AtApplicationError
>;

// --- バリデーションパラメータ ---

/** AT規則適用のパラメータ */
export type AtRuleApplicationParams = {
  /** 適用する規則 */
  readonly ruleId: AtRuleId;
  /** 署名付き論理式のテキスト（"T:φ" or "F:φ"） */
  readonly signedFormulaText: string;
  /** 固有変数名（δ規則用） */
  readonly eigenVariable?: string;
  /** 代入項テキスト（γ規則用） */
  readonly termText?: string;
  /** 矛盾ノードの署名付き論理式テキスト（closure用） */
  readonly contradictionFormulaText?: string;
  /** δ規則: 枝上の全署名付き論理式テキスト（固有変数条件チェック用） */
  readonly branchFormulaTexts?: readonly string[];
};

// --- バリデーション ---

/**
 * AT規則適用のバリデーション（Effect版）。
 */
export const validateAtApplicationEffect = (
  params: AtRuleApplicationParams,
): Effect.Effect<AtApplicationSuccess, AtApplicationError> =>
  Effect.gen(function* () {
    // closure は特別処理
    if (isClosureRule(params.ruleId)) {
      return yield* validateClosureEffect(params);
    }

    // 署名付き論理式のパース
    const sf = parseSignedFormulaText(params.signedFormulaText);
    if (sf === undefined) {
      return yield* Effect.fail(
        new AtFormulaParseError({ nodeId: "conclusion" }),
      );
    }

    // 規則が適用可能かチェック
    const classified = classifySignedFormula(sf);
    if (classified !== params.ruleId) {
      return yield* Effect.fail(
        new AtPrincipalFormulaMismatch({
          ruleId: params.ruleId,
          message: `Rule ${params.ruleId satisfies string} cannot be applied to this formula`,
        }),
      );
    }

    // α規則
    if (isAlphaRule(params.ruleId)) {
      return yield* validateAlphaEffect(sf, params.ruleId);
    }

    // β規則
    if (isBetaRule(params.ruleId)) {
      return yield* validateBetaEffect(sf, params.ruleId);
    }

    // γ規則
    if (isGammaRule(params.ruleId)) {
      return yield* validateGammaEffect(
        sf,
        params.ruleId,
        params.termText ?? "",
      );
    }

    // δ規則
    if (isDeltaRule(params.ruleId)) {
      return yield* validateDeltaEffect(
        sf,
        params.ruleId,
        params.eigenVariable ?? "",
        params.branchFormulaTexts ?? [],
      );
    }

    /* v8 ignore start */
    return yield* Effect.fail(
      new AtPrincipalFormulaMismatch({
        ruleId: params.ruleId,
        message: `Unknown rule: ${params.ruleId satisfies string}`,
      }),
    );
    /* v8 ignore stop */
  });

/**
 * α規則のバリデーション。
 */
const validateAlphaEffect = (
  sf: SignedFormula,
  ruleId: AtRuleId,
): Effect.Effect<AtAlphaResult, AtApplicationError> =>
  Effect.gen(function* () {
    const result = applyAlphaRule(sf);
    // 防御的コード: classifySignedFormula が既にα規則であることを確認済みのため到達不能
    /* v8 ignore start */
    if (result === undefined) {
      return yield* Effect.fail(
        new AtPrincipalFormulaMismatch({
          ruleId,
          message: "Alpha rule cannot be applied to this formula",
        }),
      );
    }
    /* v8 ignore stop */
    const firstResult = formatSignedFormulaText(result.results[0]);
    const secondResult =
      result.results.length === 2
        ? formatSignedFormulaText(result.results[1])
        : undefined;
    return {
      _tag: "at-alpha-result",
      ruleId: result.ruleId,
      resultText: firstResult,
      secondResultText: secondResult,
    };
  });

/**
 * β規則のバリデーション。
 */
const validateBetaEffect = (
  sf: SignedFormula,
  ruleId: AtRuleId,
): Effect.Effect<AtBetaResult, AtApplicationError> =>
  Effect.gen(function* () {
    const result = applyBetaRule(sf);
    // 防御的コード: classifySignedFormula が既にβ規則であることを確認済みのため到達不能
    /* v8 ignore start */
    if (result === undefined) {
      return yield* Effect.fail(
        new AtPrincipalFormulaMismatch({
          ruleId,
          message: "Beta rule cannot be applied to this formula",
        }),
      );
    }
    /* v8 ignore stop */
    return {
      _tag: "at-beta-result",
      ruleId: result.ruleId,
      leftResultText: formatSignedFormulaText(result.left),
      rightResultText: formatSignedFormulaText(result.right),
    };
  });

/**
 * γ規則のバリデーション。
 */
const validateGammaEffect = (
  sf: SignedFormula,
  ruleId: AtRuleId,
  termText: string,
): Effect.Effect<AtGammaResult, AtApplicationError> =>
  Effect.gen(function* () {
    if (termText.trim() === "") {
      return yield* Effect.fail(
        new AtTermParseError({ label: "substitution term (τ)" }),
      );
    }
    const termResult = parseTermString(termText.trim());
    if (Either.isLeft(termResult)) {
      return yield* Effect.fail(
        new AtTermParseError({ label: "substitution term (τ)" }),
      );
    }
    const result = applyGammaRule(sf, termResult.right);
    // 防御的コード: classifySignedFormula が既にγ規則であることを確認済みのため到達不能
    /* v8 ignore start */
    if (result === undefined) {
      return yield* Effect.fail(
        new AtPrincipalFormulaMismatch({
          ruleId,
          message: "Gamma rule cannot be applied to this formula",
        }),
      );
    }
    /* v8 ignore stop */
    return {
      _tag: "at-gamma-result",
      ruleId: result.ruleId,
      resultText: formatSignedFormulaText(result.result),
      termText: termText.trim(),
    };
  });

/**
 * δ規則のバリデーション。
 */
const validateDeltaEffect = (
  sf: SignedFormula,
  ruleId: AtRuleId,
  eigenVariable: string,
  branchFormulaTexts: readonly string[],
): Effect.Effect<AtDeltaResult, AtApplicationError> =>
  Effect.gen(function* () {
    if (eigenVariable.trim() === "") {
      return yield* Effect.fail(
        new AtEigenVariableError({
          variableName: "",
          message: "Eigen variable name is required",
        }),
      );
    }
    const zeta = eigenVariable.trim();

    // 枝上の署名付き論理式をパースして固有変数条件をチェック
    const branchFormulas: SignedFormula[] = [];
    for (const text of branchFormulaTexts) {
      const parsed = parseSignedFormulaText(text);
      if (parsed !== undefined) {
        branchFormulas.push(parsed);
      }
    }
    // 適用元の論理式も枝に含める
    branchFormulas.push(sf);

    if (!checkEigenVariableCondition(zeta, branchFormulas)) {
      return yield* Effect.fail(
        new AtEigenVariableError({
          variableName: zeta,
          message: `Eigen variable ${zeta satisfies string} must not occur free in any formula on the branch`,
        }),
      );
    }

    const result = applyDeltaRule(sf, zeta);
    // 防御的コード: classifySignedFormula が既にδ規則であることを確認済みのため到達不能
    /* v8 ignore start */
    if (result === undefined) {
      return yield* Effect.fail(
        new AtPrincipalFormulaMismatch({
          ruleId,
          message: "Delta rule cannot be applied to this formula",
        }),
      );
    }
    /* v8 ignore stop */
    return {
      _tag: "at-delta-result",
      ruleId: result.ruleId,
      resultText: formatSignedFormulaText(result.result),
      eigenVariable: zeta,
    };
  });

/**
 * closure のバリデーション。
 * 2つのノードが矛盾関係 (T(φ) と F(φ)) にあるかチェックする。
 */
const validateClosureEffect = (
  params: AtRuleApplicationParams,
): Effect.Effect<AtClosedResult, AtApplicationError> =>
  Effect.gen(function* () {
    const sf = parseSignedFormulaText(params.signedFormulaText);
    if (sf === undefined) {
      return yield* Effect.fail(
        new AtFormulaParseError({ nodeId: "conclusion" }),
      );
    }

    if (
      params.contradictionFormulaText === undefined ||
      params.contradictionFormulaText.trim() === ""
    ) {
      return yield* Effect.fail(
        new AtContradictionError({
          message: "Contradiction formula is required for closure",
        }),
      );
    }

    const contradictionSf = parseSignedFormulaText(
      params.contradictionFormulaText,
    );
    if (contradictionSf === undefined) {
      return yield* Effect.fail(
        new AtFormulaParseError({ nodeId: "contradiction" }),
      );
    }

    // 矛盾チェック: 同じ論理式で異なる符号
    const sfKey = JSON.stringify(sf.formula);
    const contradictionKey = JSON.stringify(contradictionSf.formula);
    if (sfKey !== contradictionKey || sf.sign === contradictionSf.sign) {
      return yield* Effect.fail(
        new AtContradictionError({
          message:
            "The two formulas must be the same formula with opposite signs (T/F)",
        }),
      );
    }

    return { _tag: "at-closed-result" };
  });

/**
 * AT規則適用のバリデーション（同期版: Either を返す）。
 */
export const validateAtApplication = (
  params: AtRuleApplicationParams,
): AtApplicationResult =>
  Effect.runSync(Effect.either(validateAtApplicationEffect(params)));

// --- エッジ生成ヘルパー ---

/**
 * バリデーション結果からAtInferenceEdgeを生成する。
 * conclusionNodeId にはAT規則が適用されるノードのIDを指定する。
 */
export function createAtEdgeFromResult(
  params: AtRuleApplicationParams,
  result: AtApplicationSuccess,
  conclusionNodeId: string,
  contradictionNodeId?: string,
): AtAlphaEdge | AtBetaEdge | AtGammaEdge | AtDeltaEdge | AtClosedEdge {
  switch (result._tag) {
    case "at-alpha-result":
      return {
        _tag: "at-alpha",
        ruleId: result.ruleId,
        conclusionNodeId,
        resultNodeId: undefined,
        secondResultNodeId: undefined,
        conclusionText: params.signedFormulaText,
        resultText: result.resultText,
        secondResultText: result.secondResultText,
      };
    case "at-beta-result":
      return {
        _tag: "at-beta",
        ruleId: result.ruleId,
        conclusionNodeId,
        leftResultNodeId: undefined,
        rightResultNodeId: undefined,
        conclusionText: params.signedFormulaText,
        leftResultText: result.leftResultText,
        rightResultText: result.rightResultText,
      };
    case "at-gamma-result":
      return {
        _tag: "at-gamma",
        ruleId: result.ruleId,
        conclusionNodeId,
        resultNodeId: undefined,
        conclusionText: params.signedFormulaText,
        resultText: result.resultText,
        termText: result.termText,
      };
    case "at-delta-result":
      return {
        _tag: "at-delta",
        ruleId: result.ruleId,
        conclusionNodeId,
        resultNodeId: undefined,
        conclusionText: params.signedFormulaText,
        resultText: result.resultText,
        eigenVariable: result.eigenVariable,
      };
    case "at-closed-result":
      return {
        _tag: "at-closed",
        ruleId: "closure",
        conclusionNodeId,
        /* v8 ignore start -- 防御的フォールバック: closureは常にcontradictionNodeIdが渡される */
        contradictionNodeId: contradictionNodeId ?? "",
        /* v8 ignore stop */
        conclusionText: params.signedFormulaText,
      };
  }
}

// --- エラーメッセージ ---

/**
 * AT適用エラーに対する人間向けメッセージを返す。
 */
export function getAtErrorMessage(error: AtApplicationError): string {
  switch (error._tag) {
    case "AtFormulaParseError":
      return "Cannot parse signed formula (expected format: T:φ or F:φ)";
    case "AtPrincipalFormulaMismatch":
      return error.message;
    case "AtEigenVariableError":
      return error.message;
    case "AtTermParseError":
      return `Enter valid term for ${error.label satisfies string}`;
    case "AtContradictionError":
      return error.message;
  }
}
