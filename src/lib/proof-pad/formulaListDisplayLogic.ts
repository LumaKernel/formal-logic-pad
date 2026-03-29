/**
 * 論理式リスト（TAB用）の表示ロジック。
 *
 * 論理式テキスト配列をFormulaSlot配列に変換する。
 * SequentDisplayのFormulaSlotを再利用。
 *
 * 変更時は formulaListDisplayLogic.test.ts, FormulaListDisplay.tsx, index.ts も同期すること。
 */

import type { FormulaSlot } from "./sequentDisplayLogic";
import { textToFormulaSlot } from "./sequentDisplayLogic";

/** 論理式リスト表示データ */
export type FormulaListDisplayData = {
  readonly formulas: readonly FormulaSlot[];
};

/**
 * 論理式テキスト配列からFormulaListDisplayDataに変換する。
 * 空テキストはフィルタする。
 */
export function formulaTextsToDisplayData(
  texts: readonly string[],
): FormulaListDisplayData {
  return {
    formulas: texts
      .filter((s) => s.trim() !== "")
      .map((s) => textToFormulaSlot(s)),
  };
}

/**
 * テキストがTAB用の論理式リスト形式かどうかを判定する。
 * カンマを含み、シーケント形式（⇒を含む）でなく、
 * 署名付き論理式形式（T:/F:で始まる）でない場合にtrue。
 *
 * 注意: 単一の論理式はFormulaDisplayで表示すべきなので
 * カンマを含まない場合はfalse。
 */
export function isFormulaListText(text: string): boolean {
  if (text.includes("⇒")) return false;
  if (/^[TF]:/.test(text)) return false;
  return text.includes(",");
}
