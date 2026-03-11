/**
 * 論理式リスト操作の純粋ロジック。
 *
 * add / remove / reorder / move / validate の関数を提供する。
 * FormulaListEditor と customQuestEditLogic から利用される。
 *
 * 変更時は formulaListLogic.test.ts, index.ts も同期すること。
 */

// --- 操作関数 ---

/** リストの末尾に空の論理式を追加する */
export function addFormula(formulas: readonly string[]): readonly string[] {
  return [...formulas, ""];
}

/** 指定インデックスの論理式を削除する */
export function removeFormula(
  formulas: readonly string[],
  index: number,
): readonly string[] {
  if (index < 0 || index >= formulas.length) return formulas;
  return formulas.filter((_, i) => i !== index);
}

/** 指定インデックスの論理式テキストを更新する */
export function updateFormula(
  formulas: readonly string[],
  index: number,
  value: string,
): readonly string[] {
  if (index < 0 || index >= formulas.length) return formulas;
  return formulas.map((f, i) => (i === index ? value : f));
}

/** 指定インデックスの論理式を1つ上に移動する */
export function moveUp(
  formulas: readonly string[],
  index: number,
): readonly string[] {
  if (index <= 0 || index >= formulas.length) return formulas;
  const result = [...formulas];
  const tmp = result[index - 1]!;
  result[index - 1] = result[index]!;
  result[index] = tmp;
  return result;
}

/** 指定インデックスの論理式を1つ下に移動する */
export function moveDown(
  formulas: readonly string[],
  index: number,
): readonly string[] {
  if (index < 0 || index >= formulas.length - 1) return formulas;
  const result = [...formulas];
  const tmp = result[index + 1]!;
  result[index + 1] = result[index]!;
  result[index] = tmp;
  return result;
}

// --- バリデーション ---

export type FormulaListValidation =
  | { readonly valid: true }
  | { readonly valid: false; readonly message: string };

/** 論理式リストが空でないことを検証する */
export function validateFormulaList(
  formulas: readonly string[],
): FormulaListValidation {
  const nonEmpty = formulas.filter((f) => f.trim() !== "");
  if (nonEmpty.length === 0) {
    return { valid: false, message: "ゴール式を1つ以上入力してください" };
  }
  return { valid: true };
}

/** 空でない論理式テキストだけを抽出する（保存時に使用） */
export function extractNonEmptyFormulas(
  formulas: readonly string[],
): readonly string[] {
  return formulas.filter((f) => f.trim() !== "").map((f) => f.trim());
}
