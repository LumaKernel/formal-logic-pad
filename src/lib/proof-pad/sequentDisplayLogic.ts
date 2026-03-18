/**
 * シーケント分解表示の純粋ロジック。
 *
 * シーケントテキスト（"φ, ψ ⇒ χ"）をパースし、
 * 各論理式を個別にFormulaDisplay可能な形に分解する。
 *
 * 変更時は sequentDisplayLogic.test.ts, SequentDisplay.tsx, index.ts も同期すること。
 */

import type { Formula } from "../logic-core/formula";
import type { Sequent } from "../logic-core/sequentCalculus";
import { parseString } from "../logic-lang/parser";
import { Either } from "effect";

// --- 表示データ型 ---

/** 個別の論理式スロットの表示データ */
export type FormulaSlot =
  | {
      readonly _tag: "parsed";
      readonly formula: Formula;
      readonly text: string;
    }
  | { readonly _tag: "text"; readonly text: string };

/** シーケント分解表示データ */
export type SequentDisplayData = {
  readonly antecedents: readonly FormulaSlot[];
  readonly succedents: readonly FormulaSlot[];
};

// --- 変換関数 ---

/**
 * 論理式テキストをFormulaSlotに変換する。
 * パース成功ならparsed、失敗ならtextとして保持。
 */
export function textToFormulaSlot(text: string): FormulaSlot {
  const trimmed = text.trim();
  if (trimmed === "") return { _tag: "text", text: trimmed };
  const result = parseString(trimmed);
  if (Either.isRight(result)) {
    return { _tag: "parsed", formula: result.right, text: trimmed };
  }
  return { _tag: "text", text: trimmed };
}

/**
 * シーケントテキストをSequentDisplayDataに変換する。
 * "⇒" で前件と後件を分割し、各論理式を個別にパースする。
 */
export function parseSequentDisplayData(text: string): SequentDisplayData {
  const arrowIndex = text.indexOf("⇒");
  if (arrowIndex === -1) {
    // ⇒ なし: 全体を前件として扱う
    const parts =
      text.trim() === ""
        ? []
        : text.split(",").map((s) => textToFormulaSlot(s));
    return { antecedents: parts, succedents: [] };
  }
  const leftStr = text.slice(0, arrowIndex).trim();
  const rightStr = text.slice(arrowIndex + 1).trim();
  const antecedents =
    leftStr === "" ? [] : leftStr.split(",").map((s) => textToFormulaSlot(s));
  const succedents =
    rightStr === "" ? [] : rightStr.split(",").map((s) => textToFormulaSlot(s));
  return { antecedents, succedents };
}

/**
 * Sequent型（Formula配列）からSequentDisplayDataに変換する。
 * すべてparsedスロットになる。
 */
export function sequentToDisplayData(seq: Sequent): SequentDisplayData {
  const formulaToSlot = (f: Formula): FormulaSlot => {
    // formatFormulaは循環依存を避けるためここでは使わない。
    // 呼び出し側がformatFormulaした結果をtextに入れるか、
    // またはFormulaDisplayで直接描画するため不要。
    return { _tag: "parsed", formula: f, text: "" };
  };
  return {
    antecedents: seq.antecedents.map(formulaToSlot),
    succedents: seq.succedents.map(formulaToSlot),
  };
}

/**
 * テキストがシーケント形式（"⇒" を含む）かどうかを判定する。
 */
export function isSequentText(text: string): boolean {
  return text.includes("⇒");
}
