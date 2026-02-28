/**
 * 真理値表の表示用ロジック。
 *
 * evaluation.ts の TruthTable データを UI 表示に適した形に変換する純粋関数群。
 * React や DOM には依存しない。
 *
 * 変更時は truthTableLogic.test.ts も同期すること。
 */

import type { Formula } from "../logic-core/formula";
import type { TruthTable } from "../logic-core/evaluation";
import {
  generateTruthTable,
  isTautology,
  isSatisfiable,
} from "../logic-core/evaluation";

// ── 型定義 ───────────────────────────────────────────────

/**
 * 真理値表の論理的分類
 */
export type FormulaClassification =
  | "tautology"
  | "satisfiable"
  | "contradiction";

/**
 * 表示用の真理値表データ（1行分）
 */
export interface TruthTableDisplayRow {
  /** 各変数の真理値（variables の順序と同じ） */
  readonly values: readonly boolean[];
  /** 結果の真理値 */
  readonly result: boolean;
}

/**
 * 真理値表の表示用データ
 */
export interface TruthTableDisplayData {
  /** 変数名リスト（ヘッダー） */
  readonly variables: readonly string[];
  /** 表の行データ */
  readonly rows: readonly TruthTableDisplayRow[];
  /** 論理式の分類 */
  readonly classification: FormulaClassification;
}

// ── 変換ロジック ───────────────────────────────────────────

/**
 * 命題論理式の分類を判定する。
 *
 * - tautology: すべての割当で真
 * - contradiction: すべての割当で偽
 * - satisfiable: 一部の割当で真（恒真でも矛盾でもない）
 */
export const classifyFormula = (formula: Formula): FormulaClassification => {
  if (isTautology(formula)) return "tautology";
  if (!isSatisfiable(formula)) return "contradiction";
  return "satisfiable";
};

/**
 * TruthTable を表示用データに変換する。
 *
 * TruthAssignment (Map) を配列形式に変換し、UI で扱いやすくする。
 */
export const toDisplayData = (
  table: TruthTable,
  classification: FormulaClassification,
): TruthTableDisplayData => {
  const rows: TruthTableDisplayRow[] = table.rows.map((row) => ({
    values: table.variables.map((v) => {
      const value = row.assignment.get(v);
      if (value === undefined) {
        throw new Error(
          `Missing assignment for variable: ${v satisfies string}`,
        );
      }
      return value;
    }),
    result: row.result,
  }));
  return {
    variables: table.variables,
    rows,
    classification,
  };
};

/**
 * 命題論理式から表示用の真理値表データを生成する。
 *
 * generateTruthTable + classifyFormula + toDisplayData をまとめたユーティリティ。
 */
export const buildTruthTableDisplayData = (
  formula: Formula,
): TruthTableDisplayData => {
  const table = generateTruthTable(formula);
  const classification = classifyFormula(formula);
  return toDisplayData(table, classification);
};

/**
 * 真理値表の分類に対応するi18nキーを返す。
 */
export const getClassificationLabelKey = (
  classification: FormulaClassification,
): string => {
  switch (classification) {
    case "tautology":
      return "truthTable.tautology";
    case "satisfiable":
      return "truthTable.satisfiable";
    case "contradiction":
      return "truthTable.contradiction";
  }
  /* v8 ignore start */
  classification satisfies never;
  throw new Error("Unreachable");
  /* v8 ignore stop */
};

/**
 * 分類に対応する表示用ラベルを返す（日本語/英語）。
 */
export const getClassificationLabel = (
  classification: FormulaClassification,
  locale: "ja" | "en",
): string => {
  switch (classification) {
    case "tautology":
      return locale === "ja" ? "恒真（トートロジー）" : "Tautology";
    case "satisfiable":
      return locale === "ja" ? "充足可能" : "Satisfiable";
    case "contradiction":
      return locale === "ja" ? "矛盾（充足不可能）" : "Contradiction";
  }
  /* v8 ignore start */
  classification satisfies never;
  throw new Error("Unreachable");
  /* v8 ignore stop */
};

/**
 * 真理値の表示文字列を返す。
 */
export const formatTruthValue = (value: boolean): string => (value ? "T" : "F");
