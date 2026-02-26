/**
 * ノートブック新規作成の純粋ロジック。
 *
 * プリセット公理系の定義、フォームバリデーション、
 * 作成パラメータの組み立てを提供する。
 *
 * 変更時は notebookCreateLogic.test.ts も同期すること。
 */

import type { DeductionSystem } from "../logic-core/deductionSystem";
import {
  hilbertDeduction,
  naturalDeduction,
  sequentCalculusDeduction,
  nmSystem,
  njSystem,
  nkSystem,
  lmSystem,
  ljSystem,
  lkSystem,
} from "../logic-core/deductionSystem";
import {
  skSystem,
  minimalLogicSystem,
  intuitionisticSystem,
  classicalLogicSystem,
  lukasiewiczSystem,
  mendelsonSystem,
  predicateLogicSystem,
  equalityLogicSystem,
} from "../logic-core/inferenceRule";

// --- プリセット公理系 ---

/**
 * プリセット体系の定義。
 *
 * `deductionSystem` は Hilbert流・自然演繹など統一的な体系情報を持つ。
 *
 * 新しいプリセット追加時の同期ポイント:
 * - ここに追加
 * - questDefinition.ts の SystemPresetId に追加
 * - questStartLogic.test.ts に全プリセット解決テスト追加
 * - notebookCreateLogic.test.ts のテスト追加
 */
export type SystemPreset = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly deductionSystem: DeductionSystem;
};

/**
 * 利用可能なプリセット体系一覧。
 *
 * ヒルベルト流証明論:
 *   SK = HM ⊆ HJ ⊆ HK
 *   SK = HM ⊆ Łukasiewicz = HK（古典論理として等価）
 *   SK = HM ⊆ Mendelson = HK（古典論理として等価）
 *
 * 自然演繹:
 *   NM ⊆ NJ (NM + EFQ)
 *   NM ⊆ NK (NM + DNE)
 *
 * シーケント計算:
 *   LM ⊂ LJ (LM + ⊥⇒ + ⇒w)
 *   LJ ⊂ LK (右辺制限解除)
 *
 * @see 戸次大介『数理論理学』第7章, 第8章, 第10章
 */
export const systemPresets: readonly SystemPreset[] = [
  {
    id: "sk",
    label: "体系SK（基本命題計算）",
    description:
      "Hilbert流: (S)(K) + MP。含意→のみの最も基本的な体系。戸次『数理論理学』§7.2。",
    deductionSystem: hilbertDeduction(skSystem),
  },
  {
    id: "minimal",
    label: "最小論理（HM）",
    description:
      "Hilbert流: A1(K), A2(S) + MP。否定公理なしの最小体系。SK と同一。HM ⊆ HJ ⊆ HK。",
    deductionSystem: hilbertDeduction(minimalLogicSystem),
  },
  {
    id: "intuitionistic",
    label: "直観主義論理（HJ）",
    description:
      "Hilbert流: HM + EFQ（爆発原理）。¬φ → (φ → ψ)。二重否定除去は成り立たない。",
    deductionSystem: hilbertDeduction(intuitionisticSystem),
  },
  {
    id: "classical",
    label: "古典論理（HK）",
    description:
      "Hilbert流: HM + DNE（二重否定除去）。¬¬φ → φ。最も広い命題論理体系。",
    deductionSystem: hilbertDeduction(classicalLogicSystem),
  },
  {
    id: "lukasiewicz",
    label: "Łukasiewicz体系",
    description:
      "Hilbert流: A1, A2, A3（対偶）+ MP。古典論理(HK)と等価。戸次『数理論理学』§7.2。",
    deductionSystem: hilbertDeduction(lukasiewiczSystem),
  },
  {
    id: "mendelson",
    label: "Mendelson体系",
    description:
      "Hilbert流: A1, A2, M3（背理法）+ MP。古典論理(HK)と等価。異なる公理化。",
    deductionSystem: hilbertDeduction(mendelsonSystem),
  },
  {
    id: "predicate",
    label: "述語論理",
    description: "Hilbert流: A1-A5 + MP + Gen。量化子（∀, ∃）を含む述語論理。",
    deductionSystem: hilbertDeduction(predicateLogicSystem),
  },
  {
    id: "equality",
    label: "等号付き述語論理",
    description: "Hilbert流: A1-A5 + E1-E5 + MP + Gen。等号公理を含む体系。",
    deductionSystem: hilbertDeduction(equalityLogicSystem),
  },
  {
    id: "nd-nm",
    label: "NM（最小論理）",
    description:
      "自然演繹: 基本規則のみ（→I/→E, ∧I/∧E, ∨I/∨E, 弱化）。戸次『数理論理学』§8.2。",
    deductionSystem: naturalDeduction(nmSystem),
  },
  {
    id: "nd-nj",
    label: "NJ（直観主義論理）",
    description:
      "自然演繹: NM + EFQ（爆発律）。矛盾から任意の命題を導出可能。戸次『数理論理学』§8.3。",
    deductionSystem: naturalDeduction(njSystem),
  },
  {
    id: "nd-nk",
    label: "NK（古典論理）",
    description:
      "自然演繹: NM + DNE（二重否定除去）。最も広い古典論理の自然演繹体系。戸次『数理論理学』§8.3。",
    deductionSystem: naturalDeduction(nkSystem),
  },
  {
    id: "sc-lm",
    label: "LM（最小論理）",
    description:
      "ゲンツェン流: LJから(⊥⇒)と(⇒w)を除いた体系。右辺は常に1つ。NMと等価。戸次『数理論理学』§10.3。",
    deductionSystem: sequentCalculusDeduction(lmSystem),
  },
  {
    id: "sc-lj",
    label: "LJ（直観主義論理）",
    description:
      "ゲンツェン流: 右辺が高々1に制限。(⊥⇒)を含む。NJと等価。戸次『数理論理学』§10.2。",
    deductionSystem: sequentCalculusDeduction(ljSystem),
  },
  {
    id: "sc-lk",
    label: "LK（古典論理）",
    description:
      "ゲンツェン流: 完全対称体系。左右両辺が0個以上。NKと等価。戸次『数理論理学』§10.1。",
    deductionSystem: sequentCalculusDeduction(lkSystem),
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
