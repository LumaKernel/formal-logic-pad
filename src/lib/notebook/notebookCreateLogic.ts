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
import type { ReferenceEntryId } from "../reference/referenceEntry";
import {
  skSystem,
  minimalLogicSystem,
  intuitionisticSystem,
  classicalLogicSystem,
  lukasiewiczSystem,
  mendelsonSystem,
  predicateLogicSystem,
  equalityLogicSystem,
  peanoArithmeticSystem,
  robinsonArithmeticSystem,
  peanoArithmeticHKSystem,
  peanoArithmeticMendelsonSystem,
  heytingArithmeticSystem,
  groupTheoryLeftSystem,
  groupTheoryFullSystem,
  abelianGroupSystem,
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
    id: "peano",
    label: "ペアノ算術（PA）",
    description:
      "Hilbert流: Łukasiewicz基盤（A3:対偶）+ 等号付き述語論理 + PA1-PA6。一階算術の標準的な公理系。",
    deductionSystem: hilbertDeduction(peanoArithmeticSystem),
  },
  {
    id: "robinson",
    label: "Robinson算術（Q）",
    description:
      "Hilbert流: PA1-PA6 + Q7（後者の全射性）。帰納法スキーマなしの弱い算術体系。Gödelの不完全性定理の基礎。",
    deductionSystem: hilbertDeduction(robinsonArithmeticSystem),
  },
  {
    id: "peano-hk",
    label: "ペアノ算術（PA-HK）",
    description:
      "Hilbert流: HK基盤（DNE:二重否定除去）+ 等号付き述語論理 + PA1-PA6。戸次『数理論理学』§7.8の古典論理。",
    deductionSystem: hilbertDeduction(peanoArithmeticHKSystem),
  },
  {
    id: "peano-mendelson",
    label: "ペアノ算術（PA-Mendelson）",
    description:
      "Hilbert流: Mendelson基盤（M3:背理法）+ 等号付き述語論理 + PA1-PA6。Mendelson教科書の体系。",
    deductionSystem: hilbertDeduction(peanoArithmeticMendelsonSystem),
  },
  {
    id: "heyting",
    label: "ヘイティング算術（HA）",
    description:
      "Hilbert流: 直観主義論理（EFQ:爆発原理）+ 等号付き述語論理 + PA1-PA6。二重否定除去は使えない構成的算術。",
    deductionSystem: hilbertDeduction(heytingArithmeticSystem),
  },
  {
    id: "group-left",
    label: "群論（左公理系）",
    description:
      "Hilbert流: 等号付き述語論理 + G1(結合律) + G2L(左単位元) + G3L(左逆元)。最小限の群公理化。右性質は定理として導出可能。",
    deductionSystem: hilbertDeduction(groupTheoryLeftSystem),
  },
  {
    id: "group-full",
    label: "群論（両側公理系）",
    description:
      "Hilbert流: 等号付き述語論理 + G1 + G2L + G2R + G3L + G3R。冗長だが直感的な群公理化。初学者向け。",
    deductionSystem: hilbertDeduction(groupTheoryFullSystem),
  },
  {
    id: "abelian-group",
    label: "アーベル群",
    description:
      "Hilbert流: 等号付き述語論理 + 両側群公理 + G4(可換律)。可換群の公理系。",
    deductionSystem: hilbertDeduction(abelianGroupSystem),
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

// --- プリセットのカテゴリグルーピング ---

/**
 * プリセットをグルーピングするカテゴリID。
 *
 * 新しいカテゴリ追加時の同期ポイント:
 * - ここにIDを追加
 * - presetCategoryDefinitions にラベル定義追加
 * - classifyPresetCategory のロジック更新
 * - notebookCreateLogic.test.ts のテスト追加
 */
export type PresetCategoryId =
  | "hilbert-propositional"
  | "hilbert-predicate"
  | "hilbert-theory"
  | "natural-deduction"
  | "sequent-calculus";

/** カテゴリの表示情報 */
export type PresetCategoryDefinition = {
  readonly id: PresetCategoryId;
  readonly label: string;
  readonly description: string;
};

/** カテゴリ定義一覧（表示順序を規定する） */
export const presetCategoryDefinitions: readonly PresetCategoryDefinition[] = [
  {
    id: "hilbert-propositional",
    label: "Hilbert流 命題論理",
    description: "公理と Modus Ponens による命題論理の証明体系",
  },
  {
    id: "hilbert-predicate",
    label: "Hilbert流 述語論理",
    description: "量化子・等号を含む述語論理",
  },
  {
    id: "hilbert-theory",
    label: "Hilbert流 理論",
    description: "述語論理に非論理的公理を追加した理論",
  },
  {
    id: "natural-deduction",
    label: "自然演繹",
    description: "仮定の導入と解消による証明体系",
  },
  {
    id: "sequent-calculus",
    label: "シーケント計算",
    description: "ゲンツェン流のシーケントによる証明体系",
  },
];

/** Hilbert述語論理系プリセットIDの集合 */
const hilbertPredicateIds: ReadonlySet<string> = new Set([
  "predicate",
  "equality",
]);

/** Hilbert理論系プリセットIDの集合 */
const hilbertTheoryIds: ReadonlySet<string> = new Set([
  "peano",
  "robinson",
  "peano-hk",
  "peano-mendelson",
  "heyting",
  "group-left",
  "group-full",
  "abelian-group",
]);

/**
 * プリセットのカテゴリを判定する純粋関数。
 */
export function classifyPresetCategory(preset: SystemPreset): PresetCategoryId {
  const style = preset.deductionSystem.style;
  if (style === "natural-deduction") return "natural-deduction";
  if (style === "sequent-calculus") return "sequent-calculus";
  // Hilbert 系の場合はIDで細分類
  if (hilbertPredicateIds.has(preset.id)) return "hilbert-predicate";
  if (hilbertTheoryIds.has(preset.id)) return "hilbert-theory";
  return "hilbert-propositional";
}

/** カテゴリごとにグルーピングされたプリセット */
export type PresetGroup = {
  readonly category: PresetCategoryDefinition;
  readonly presets: readonly SystemPreset[];
};

/**
 * プリセットをカテゴリ別にグルーピングする。
 * 表示順序は presetCategoryDefinitions に従う。
 * 空のカテゴリは含めない。
 */
export function groupPresetsByCategory(
  presets: readonly SystemPreset[],
): readonly PresetGroup[] {
  const grouped = new Map<PresetCategoryId, SystemPreset[]>();
  for (const preset of presets) {
    const categoryId = classifyPresetCategory(preset);
    const existing = grouped.get(categoryId);
    if (existing !== undefined) {
      existing.push(preset);
    } else {
      grouped.set(categoryId, [preset]);
    }
  }

  const result: PresetGroup[] = [];
  for (const definition of presetCategoryDefinitions) {
    const categoryPresets = grouped.get(definition.id);
    if (categoryPresets !== undefined && categoryPresets.length > 0) {
      result.push({ category: definition, presets: categoryPresets });
    }
  }
  return result;
}

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

/**
 * フィールドのエラーを表示すべきかどうかを判定する。
 *
 * blurバリデーション（touched）+ submit バリデーション（submitted）の組み合わせ。
 * - フィールドが touched かつバリデーションエラーがある → 表示
 * - フォームが submitted かつバリデーションエラーがある → 表示
 * - それ以外 → 非表示
 */
export function shouldShowFieldError(params: {
  readonly touched: boolean;
  readonly submitted: boolean;
  readonly validation: CreateFormValidation;
  readonly field: CreateFormError["field"];
}): string | undefined {
  const { touched, submitted, validation, field } = params;
  if (!touched && !submitted) return undefined;
  return getFieldError(validation, field);
}

/**
 * バリデーションエラーがある最初のフィールド名を返す。
 * submit時のフォーカス管理に使用。
 */
export function getFirstErrorField(
  validation: CreateFormValidation,
): CreateFormError["field"] | undefined {
  if (validation.valid) return undefined;
  return validation.errors[0]?.field;
}

// --- プリセットID → リファレンスエントリID マッピング ---

/**
 * プリセットIDからリファレンスエントリIDへのマッピング。
 *
 * 各プリセットに対して最も関連の強いリファレンスエントリを1つ対応させる。
 * - 命題論理体系プリセット → 対応する論理体系エントリ
 * - 自然演繹プリセット → 自然演繹概要エントリ
 * - シーケント計算プリセット → シーケント計算概要エントリ
 * - 算術系プリセット → ペアノ算術理論エントリ
 * - 群論系プリセット → 群論理論エントリ
 *
 * 新しいプリセット追加時は referenceContent.ts のエントリも確認すること。
 */
const presetIdToReferenceEntryId: ReadonlyMap<string, ReferenceEntryId> =
  new Map([
    // Hilbert流 命題論理
    ["sk", "system-minimal"],
    ["minimal", "system-minimal"],
    ["intuitionistic", "system-intuitionistic"],
    ["classical", "system-classical"],
    ["lukasiewicz", "system-lukasiewicz"],
    ["mendelson", "system-mendelson"],
    // 算術系
    ["peano", "theory-peano"],
    ["robinson", "theory-peano"],
    ["peano-hk", "theory-peano"],
    ["peano-mendelson", "theory-peano"],
    ["heyting", "theory-peano"],
    // 群論系
    ["group-left", "theory-group"],
    ["group-full", "theory-group"],
    ["abelian-group", "theory-group"],
    // 自然演繹
    ["nd-nm", "rule-nd-overview"],
    ["nd-nj", "rule-nd-overview"],
    ["nd-nk", "rule-nd-overview"],
    // シーケント計算
    ["sc-lm", "rule-sc-overview"],
    ["sc-lj", "rule-sc-overview"],
    ["sc-lk", "rule-sc-overview"],
  ]);

/**
 * プリセットIDに対応するリファレンスエントリIDを返す。
 * 対応するエントリがない場合はundefinedを返す。
 */
export function getPresetReferenceEntryId(
  presetId: string,
): ReferenceEntryId | undefined {
  return presetIdToReferenceEntryId.get(presetId);
}
