/**
 * Simplify Formula（論理式簡約ノード作成）のための純粋ロジック。
 *
 * ノードの論理式を正規化（FormulaSubstitution解決等）し、
 * 変化があれば新しいノードを作成してSimplificationEdgeで接続する。
 * normalizeApplicationLogic（in-place置換）とは異なり、新ノードを作る。
 *
 * 変更時は simplifyFormulaLogic.test.ts, workspaceState.ts,
 * proofMessages.ts, menuActionDefinition.ts, index.ts も同期すること。
 */

import { Data, Effect, Either } from "effect";
import type { Formula } from "../logic-core/formula";
import { normalizeFormula } from "../logic-core/substitution";
import { equalFormula } from "../logic-core/equality";
import { parseString } from "../logic-lang/parser";
import { formatFormula } from "../logic-lang/formatUnicode";

// --- 成功型 ---

export type SimplifyFormulaSuccess = {
  readonly simplifiedFormula: Formula;
  readonly simplifiedText: string;
};

// --- エラー型 ---

export class SimplifyFormulaParseError extends Data.TaggedError(
  "SimplifyFormulaParseError",
)<Record<string, never>> {}

export class SimplifyFormulaNoChange extends Data.TaggedError(
  "SimplifyFormulaNoChange",
)<Record<string, never>> {}

export class SimplifyFormulaEmpty extends Data.TaggedError(
  "SimplifyFormulaEmpty",
)<Record<string, never>> {}

export type SimplifyFormulaError =
  | SimplifyFormulaParseError
  | SimplifyFormulaNoChange
  | SimplifyFormulaEmpty;

/** 結果型 */
export type SimplifyFormulaResult = Either.Either<
  SimplifyFormulaSuccess,
  SimplifyFormulaError
>;

// --- バリデーション ---

/**
 * 論理式テキストを簡約し、変化があれば成功を返す（Effect版）。
 *
 * normalizeFormula で FormulaSubstitution 解決・FreeVariableAbsence 簡約を行い、
 * 元の式と構造的に異なる場合のみ成功（新ノード作成の根拠）。
 */
export const validateSimplifyFormulaEffect = (
  formulaText: string,
): Effect.Effect<SimplifyFormulaSuccess, SimplifyFormulaError> =>
  Effect.gen(function* () {
    const trimmed = formulaText.trim();
    if (trimmed === "") {
      return yield* Effect.fail(new SimplifyFormulaEmpty({}));
    }

    const parseResult = parseString(trimmed);
    if (Either.isLeft(parseResult)) {
      return yield* Effect.fail(new SimplifyFormulaParseError({}));
    }

    const original = parseResult.right;
    const simplified = normalizeFormula(original);

    if (equalFormula(original, simplified)) {
      return yield* Effect.fail(new SimplifyFormulaNoChange({}));
    }

    return {
      simplifiedFormula: simplified,
      simplifiedText: formatFormula(simplified),
    };
  });

/**
 * 論理式テキストを簡約し、変化があれば成功を返す（Either版、公開API）。
 */
export const validateSimplifyFormula = (
  formulaText: string,
): SimplifyFormulaResult =>
  Effect.runSync(Effect.either(validateSimplifyFormulaEffect(formulaText)));

// --- エラーメッセージ ---

export function getSimplifyFormulaErrorMessage(
  error: SimplifyFormulaError,
): string {
  switch (error._tag) {
    case "SimplifyFormulaParseError":
      return "Formula cannot be parsed";
    case "SimplifyFormulaNoChange":
      return "Formula is already simplified";
    case "SimplifyFormulaEmpty":
      return "Formula is empty";
  }
}
