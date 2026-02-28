/**
 * バリデーション結果 → UI表示変換の共通ユーティリティ。
 *
 * Either<Success, Error> を統一的にUI表示データに変換する汎用関数群。
 * 各ドメイン（proof-pad, quest等）がこのモジュールを利用して
 * エラー→メッセージ変換パターンを統一する。
 *
 * 変更時は validationDisplay.test.ts も同期すること。
 */

import { Either } from "effect";

/**
 * バリデーション結果のUI表示データ。
 * 成功時はsuccessメッセージ、失敗時はエラーメッセージを持つ。
 * undefined は表示不要（前提未接続など、エラーを表示する段階ではないケース）。
 */
export type ValidationDisplay = {
  readonly message: string;
  readonly type: "error" | "success";
};

/**
 * バリデーション結果を統一的にUI表示データに変換する汎用関数。
 *
 * メッセージマップ M はドメインごとに定義する（例: ProofMessages）。
 * getErrorKey は M のキーを返し、msg[key] から表示メッセージを取得する。
 *
 * @param result - `Either<Success, Error>` のバリデーション結果
 * @param successMessage - 成功時に表示するメッセージ
 * @param getErrorKey - エラー → メッセージマップのキーに変換する関数
 * @param shouldSkipError - エラーを表示しないかどうか判定する関数（trueなら非表示）
 * @param msg - ロケール対応のメッセージオブジェクト
 * @returns 表示データ、またはundefined（非表示）
 */
export function processValidationResult<
  E extends { readonly _tag: string },
  M extends Readonly<Record<string, string>>,
>(
  result: Either.Either<unknown, E>,
  successMessage: string,
  getErrorKey: (error: E) => keyof M & string,
  shouldSkipError: (error: E) => boolean,
  msg: M,
): ValidationDisplay | undefined {
  if (Either.isRight(result)) {
    return { message: successMessage, type: "success" };
  }
  if (shouldSkipError(result.left)) {
    return undefined;
  }
  const key = getErrorKey(result.left);
  return { message: msg[key], type: "error" };
}

/**
 * メッセージテンプレート内のプレースホルダーを置換する。
 * `{key}` 形式のプレースホルダーを `params[key]` の値で置換する。
 */
export function formatMessage(
  template: string,
  params: Readonly<Record<string, string>>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`{${key satisfies string}}`, value);
  }
  return result;
}
