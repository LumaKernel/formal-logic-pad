/**
 * 論理式簡約（Normalize）操作のための純粋ロジック。
 *
 * ノードの論理式を正規化（置換解決・FreeVariableAbsence簡約）し、
 * 簡約後のテキストに置き換える。
 * UI層（ProofWorkspace.tsx）から利用される。
 *
 * 変更時は normalizeApplicationLogic.test.ts, ProofWorkspace.tsx, workspaceState.ts,
 * proofMessages.ts, index.ts も同期すること。
 */

import { Data, Effect, Either } from "effect";
import type { Formula } from "../logic-core/formula";
import { normalizeFormula } from "../logic-core/substitution";
import { equalFormula } from "../logic-core/equality";
import { parseString } from "../logic-lang/parser";
import { formatFormula } from "../logic-lang/formatUnicode";

// --- 簡約操作の結果型 ---

/** 簡約操作の成功結果 */
export type NormalizeApplicationSuccess = {
  readonly normalizedFormula: Formula;
  readonly normalizedText: string;
};

/** 簡約操作のエラー（Data.TaggedError） */
export class NormalizeParseError extends Data.TaggedError(
  "NormalizeParseError",
)<Record<string, never>> {}
export class NormalizeNoChange extends Data.TaggedError("NormalizeNoChange")<
  Record<string, never>
> {}
export class NormalizeEmptyFormula extends Data.TaggedError(
  "NormalizeEmptyFormula",
)<Record<string, never>> {}

export type NormalizeApplicationError =
  | NormalizeParseError
  | NormalizeNoChange
  | NormalizeEmptyFormula;

/** 簡約操作の結果型（Either: Right=成功, Left=エラー） */
export type NormalizeApplicationResult = Either.Either<
  NormalizeApplicationSuccess,
  NormalizeApplicationError
>;

// --- 簡約操作のバリデーション ---

/**
 * 論理式テキストを簡約（正規化）するバリデーション（Effect版）。
 *
 * 1. 論理式テキストをパース
 * 2. normalizeFormula で正規化
 * 3. 元の式と比較し、変化があれば成功を返す
 *
 * @returns Effect<NormalizeApplicationSuccess, NormalizeApplicationError>
 */
export const validateNormalizeApplicationEffect = (
  formulaText: string,
): Effect.Effect<NormalizeApplicationSuccess, NormalizeApplicationError> =>
  Effect.gen(function* () {
    const trimmed = formulaText.trim();
    if (trimmed === "") {
      return yield* Effect.fail(new NormalizeEmptyFormula({}));
    }

    const parseResult = parseString(trimmed);
    if (Either.isLeft(parseResult)) {
      return yield* Effect.fail(new NormalizeParseError({}));
    }

    const original = parseResult.right;
    const normalized = normalizeFormula(original);

    if (equalFormula(original, normalized)) {
      return yield* Effect.fail(new NormalizeNoChange({}));
    }

    return {
      normalizedFormula: normalized,
      normalizedText: formatFormula(normalized),
    };
  });

/**
 * 論理式テキストを簡約（正規化）するバリデーション（Either を返す同期版）。
 */
export const validateNormalizeApplication = (
  formulaText: string,
): NormalizeApplicationResult =>
  Effect.runSync(
    Effect.either(validateNormalizeApplicationEffect(formulaText)),
  );
