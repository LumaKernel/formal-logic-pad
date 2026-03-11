/**
 * 自作クエスト編集フォームの純粋ロジック。
 *
 * フォーム値のバリデーション、初期値変換、エラー表示判定を提供する。
 * notebookCreateLogic.ts のパターンに準拠。
 *
 * 変更時は customQuestEditLogic.test.ts, index.ts も同期すること。
 */

import type { QuestGoalDefinition } from "../proof-pad/workspaceState";
import type {
  QuestDefinition,
  DifficultyLevel,
  SystemPresetId,
} from "./questDefinition";

// --- フォームの状態 ---

/**
 * 編集フォームの入力値。
 * category はビルトインクエスト専用なのでフォームには含まない。
 */
export type EditFormValues = {
  readonly title: string;
  readonly description: string;
  readonly difficulty: DifficultyLevel;
  readonly systemPresetId: SystemPresetId;
  readonly goalsText: string;
  readonly hints: string;
  readonly estimatedSteps: string;
  readonly learningPoint: string;
};

/** 新規作成用の空のフォーム初期値を生成する */
export function createEmptyEditFormValues(): EditFormValues {
  return {
    title: "",
    description: "",
    difficulty: 1,
    systemPresetId: "lukasiewicz",
    goalsText: "",
    hints: "",
    estimatedSteps: "",
    learningPoint: "",
  };
}

/** QuestDefinition から EditFormValues に変換する */
export function questToEditFormValues(quest: QuestDefinition): EditFormValues {
  return {
    title: quest.title,
    description: quest.description,
    difficulty: quest.difficulty,
    systemPresetId: quest.systemPresetId,
    goalsText: quest.goals.map((g) => g.formulaText).join("\n"),
    hints: quest.hints.join("\n"),
    estimatedSteps:
      quest.estimatedSteps !== undefined ? String(quest.estimatedSteps) : "",
    learningPoint: quest.learningPoint,
  };
}

// --- バリデーション ---

/** 編集フォームのバリデーション結果 */
export type EditFormValidation =
  | { readonly valid: true }
  | { readonly valid: false; readonly errors: readonly EditFormError[] };

/** バリデーションエラーの種類 */
export type EditFormError =
  | { readonly field: "title"; readonly message: string }
  | { readonly field: "goalsText"; readonly message: string }
  | { readonly field: "estimatedSteps"; readonly message: string };

/** フォーム値のバリデーション */
export function validateEditForm(values: EditFormValues): EditFormValidation {
  const errors: EditFormError[] = [];

  if (values.title.trim() === "") {
    errors.push({ field: "title", message: "タイトルを入力してください" });
  } else if (values.title.trim().length > 100) {
    errors.push({
      field: "title",
      message: "タイトルは100文字以内にしてください",
    });
  }

  const goalLines = parseGoalLines(values.goalsText);
  if (goalLines.length === 0) {
    errors.push({
      field: "goalsText",
      message: "ゴール式を1つ以上入力してください",
    });
  }

  // 空文字列は「未指定」として許可
  if (values.estimatedSteps.trim() !== "") {
    const steps = Number(values.estimatedSteps);
    if (!Number.isFinite(steps) || steps < 1 || !Number.isInteger(steps)) {
      errors.push({
        field: "estimatedSteps",
        message: "推定ステップ数は1以上の整数で入力してください",
      });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}

/** 特定フィールドのエラーメッセージを取得する */
export function getEditFieldError(
  validation: EditFormValidation,
  field: EditFormError["field"],
): string | undefined {
  if (validation.valid) return undefined;
  const found = validation.errors.find((e) => e.field === field);
  return found?.message;
}

/**
 * フィールドのエラーを表示すべきかどうかを判定する。
 * notebookCreateLogic.ts の shouldShowFieldError と同じパターン。
 */
export function shouldShowEditFieldError(params: {
  readonly touched: boolean;
  readonly submitted: boolean;
  readonly validation: EditFormValidation;
  readonly field: EditFormError["field"];
}): string | undefined {
  const { touched, submitted, validation, field } = params;
  if (!touched && !submitted) return undefined;
  return getEditFieldError(validation, field);
}

/**
 * バリデーションエラーがある最初のフィールド名を返す。
 */
export function getFirstEditErrorField(
  validation: EditFormValidation,
): EditFormError["field"] | undefined {
  if (validation.valid) return undefined;
  return validation.errors[0]?.field;
}

// --- ゴール式パース ---

/** goalsText（改行区切り）からゴール定義の配列に変換する */
export function parseGoalLines(goalsText: string): readonly string[] {
  return goalsText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

/** ゴール式テキストからQuestGoalDefinition配列に変換する */
export function goalsTextToDefinitions(
  goalsText: string,
): readonly QuestGoalDefinition[] {
  return parseGoalLines(goalsText).map((formulaText) => ({ formulaText }));
}

/** フォームの推定ステップ数文字列を number | undefined に変換する */
export function parseEstimatedSteps(text: string): number | undefined {
  if (text.trim() === "") return undefined;
  return Number(text);
}

/** ヒントテキスト（改行区切り）からヒント配列に変換する */
export function parseHintLines(hintsText: string): readonly string[] {
  return hintsText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}
