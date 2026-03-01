/**
 * 真理値表コンポーネント。
 *
 * 命題論理式の真理値表を表形式で表示し、
 * 恒真・充足可能・矛盾の判定結果をバッジで表示する。
 *
 * 変更時は TruthTableComponent.test.tsx, TruthTableComponent.stories.tsx も同期すること。
 */

import { useMemo } from "react";
import type { Formula } from "../logic-core/formula";
import { FormulaKaTeX } from "../formula-input/FormulaKaTeX";
import {
  buildTruthTableDisplayData,
  formatTruthValue,
  getClassificationLabel,
} from "./truthTableLogic";
import type { FormulaClassification } from "./truthTableLogic";
import styles from "./TruthTableComponent.module.css";

export interface TruthTableComponentProps {
  /** 表示する命題論理式 */
  readonly formula: Formula;
  /** ロケール */
  readonly locale?: "ja" | "en";
  /** data-testid */
  readonly testId?: string;
}

// 防御的コード: テスト環境(vitest)ではCSSモジュールがundefinedを返すため、
// ?? "" のフォールバックは本番では到達しない（常に文字列が返る）。
/* v8 ignore start */
const badgeClassNames: Record<FormulaClassification, string> = {
  tautology: [styles["badge"] ?? "", styles["badgeTautology"] ?? ""].join(" "),
  satisfiable: [styles["badge"] ?? "", styles["badgeSatisfiable"] ?? ""].join(
    " ",
  ),
  contradiction: [
    styles["badge"] ?? "",
    styles["badgeContradiction"] ?? "",
  ].join(" "),
};
/* v8 ignore stop */

const badgeClassName = (classification: FormulaClassification): string =>
  badgeClassNames[classification];

/**
 * 命題論理式の真理値表を表形式で表示するコンポーネント。
 */
export function TruthTableComponent({
  formula,
  locale = "ja",
  testId,
}: TruthTableComponentProps) {
  const displayData = useMemo(
    () => buildTruthTableDisplayData(formula),
    [formula],
  );

  const classificationLabel = useMemo(
    () => getClassificationLabel(displayData.classification, locale),
    [displayData.classification, locale],
  );

  const badgeTestId = testId !== undefined ? testId + "-badge" : undefined;
  const tableTestId = testId !== undefined ? testId + "-table" : undefined;

  // 防御的コード: テスト環境(vitest)ではCSSモジュールがundefinedを返すため、
  // ?? "" のフォールバックは本番では到達しない。
  /* v8 ignore start */
  const resultCellClassName = (result: boolean): string =>
    [
      styles["resultCell"] ?? "",
      result ? (styles["trueValue"] ?? "") : (styles["falseValue"] ?? ""),
    ].join(" ");
  /* v8 ignore stop */

  return (
    <div className={styles["container"]} data-testid={testId}>
      <div>
        <span
          className={badgeClassName(displayData.classification)}
          data-testid={badgeTestId}
        >
          {classificationLabel}
        </span>
      </div>
      <table className={styles["table"]} data-testid={tableTestId}>
        <thead>
          <tr>
            {displayData.variables.map((v) => (
              <th key={v}>{v}</th>
            ))}
            <th className={styles["resultHeader"]}>
              <FormulaKaTeX formula={formula} fontSize="0.85em" />
            </th>
          </tr>
        </thead>
        <tbody>
          {displayData.rows.map((row, i) => (
            <tr key={i}>
              {row.values.map((v, j) => (
                <td
                  key={j}
                  className={v ? styles["trueValue"] : styles["falseValue"]}
                >
                  {formatTruthValue(v)}
                </td>
              ))}
              <td className={resultCellClassName(row.result)}>
                {formatTruthValue(row.result)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
