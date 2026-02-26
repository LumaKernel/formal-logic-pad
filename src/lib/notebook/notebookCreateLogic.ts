/**
 * ノートブック新規作成の純粋ロジック。
 *
 * プリセット公理系の定義、フォームバリデーション、
 * 作成パラメータの組み立てを提供する。
 *
 * 変更時は notebookCreateLogic.test.ts も同期すること。
 */

import type { LogicSystem } from "../logic-core/inferenceRule";
import {
  minimalLogicSystem,
  lukasiewiczSystem,
  mendelsonSystem,
  predicateLogicSystem,
  equalityLogicSystem,
} from "../logic-core/inferenceRule";

// --- プリセット公理系 ---

/** プリセット公理系の定義 */
export type SystemPreset = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly system: LogicSystem;
};

/** 利用可能なプリセット公理系一覧 */
export const systemPresets: readonly SystemPreset[] = [
  {
    id: "minimal",
    label: "最小論理（Minimal Logic）",
    description:
      "A1, A2 + Modus Ponens。否定公理なしの最小体系。含意のみで閉じる。",
    system: minimalLogicSystem,
  },
  {
    id: "lukasiewicz",
    label: "Łukasiewicz（命題論理）",
    description: "A1, A2, A3 + Modus Ponens。命題論理の基本体系。",
    system: lukasiewiczSystem,
  },
  {
    id: "mendelson",
    label: "Mendelson（命題論理）",
    description:
      "A1, A2, M3 + Modus Ponens。背理法公理を使う命題論理体系。",
    system: mendelsonSystem,
  },
  {
    id: "predicate",
    label: "述語論理",
    description: "A1-A5 + MP + Gen。量化子（∀, ∃）を含む述語論理。",
    system: predicateLogicSystem,
  },
  {
    id: "equality",
    label: "等号付き述語論理",
    description: "A1-A5 + E1-E5 + MP + Gen。等号公理を含む体系。",
    system: equalityLogicSystem,
  },
] as const;

/** デフォルトのプリセットID */
export const defaultPresetId: string = "lukasiewicz";

/** プリセットIDからプリセットを検索する */
export function findPresetById(id: string): SystemPreset | undefined {
  return systemPresets.find((p) => p.id === id);
}

// --- フォームの状態 ---

/** ノート作成フォームの入力値 */
export type CreateFormValues = {
  readonly name: string;
  readonly systemPresetId: string;
};

/** フォームのデフォルト値 */
export function defaultCreateFormValues(): CreateFormValues {
  return {
    name: "",
    systemPresetId: defaultPresetId,
  };
}

// --- バリデーション ---

/** フォームのバリデーション結果 */
export type CreateFormValidation =
  | { readonly valid: true }
  | { readonly valid: false; readonly errors: readonly CreateFormError[] };

/** バリデーションエラーの種類 */
export type CreateFormError =
  | { readonly field: "name"; readonly message: string }
  | { readonly field: "systemPresetId"; readonly message: string };

/** フォーム値のバリデーション */
export function validateCreateForm(
  values: CreateFormValues,
): CreateFormValidation {
  const errors: CreateFormError[] = [];

  const trimmedName = values.name.trim();
  if (trimmedName === "") {
    errors.push({ field: "name", message: "名前を入力してください" });
  } else if (trimmedName.length > 100) {
    errors.push({
      field: "name",
      message: "名前は100文字以内にしてください",
    });
  }

  const preset = findPresetById(values.systemPresetId);
  if (preset === undefined) {
    errors.push({
      field: "systemPresetId",
      message: "公理系を選択してください",
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}

/** 特定フィールドのエラーメッセージを取得する */
export function getFieldError(
  validation: CreateFormValidation,
  field: CreateFormError["field"],
): string | undefined {
  if (validation.valid) return undefined;
  const found = validation.errors.find((e) => e.field === field);
  return found?.message;
}
