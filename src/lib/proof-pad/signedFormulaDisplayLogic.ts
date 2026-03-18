/**
 * 署名付き論理式（AT）の表示ロジック。
 *
 * "T:φ" / "F:φ" 形式のテキストをパースし、
 * 符号（T/F）と論理式を分離して表示可能な形にする。
 *
 * 変更時は signedFormulaDisplayLogic.test.ts, SignedFormulaDisplay.tsx, index.ts も同期すること。
 */

import type { Formula } from "../logic-core/formula";
import type { Sign } from "../logic-core/analyticTableau";
import type { FormulaSlot } from "./sequentDisplayLogic";
import { textToFormulaSlot } from "./sequentDisplayLogic";

// --- 表示データ型 ---

/** 署名付き論理式の表示データ */
export type SignedFormulaDisplayData = {
  readonly sign: Sign;
  readonly formulaSlot: FormulaSlot;
};

// --- 判定関数 ---

/**
 * テキストが署名付き論理式形式（"T:..." または "F:..."）かどうかを判定する。
 */
export function isSignedFormulaText(text: string): boolean {
  const trimmed = text.trim();
  return (
    trimmed.length >= 3 &&
    (trimmed.startsWith("T:") || trimmed.startsWith("F:"))
  );
}

// --- 変換関数 ---

/**
 * 署名付き論理式テキストをSignedFormulaDisplayDataに変換する。
 * "T:φ" → { sign: "T", formulaSlot: FormulaSlot }
 * 非署名付き形式の場合はundefinedを返す。
 */
export function parseSignedFormulaDisplayData(
  text: string,
): SignedFormulaDisplayData | undefined {
  const trimmed = text.trim();
  if (!isSignedFormulaText(trimmed)) return undefined;
  const sign: Sign = trimmed[0] === "T" ? "T" : "F";
  const formulaText = trimmed.slice(2).trim();
  if (formulaText === "") return undefined;
  return {
    sign,
    formulaSlot: textToFormulaSlot(formulaText),
  };
}

/**
 * SignedFormula型（Formula AST付き）からSignedFormulaDisplayDataに変換する。
 * すべてparsedスロットになる。
 */
export function signedFormulaToDisplayData(
  sign: Sign,
  formula: Formula,
): SignedFormulaDisplayData {
  return {
    sign,
    formulaSlot: { _tag: "parsed", formula, text: "" },
  };
}
