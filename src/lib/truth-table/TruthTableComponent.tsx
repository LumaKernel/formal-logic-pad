/**
 * 真理値表コンポーネント。
 *
 * 命題論理式の真理値表を表形式で表示し、
 * 恒真・充足可能・矛盾の判定結果をバッジで表示する。
 *
 * 変更時は TruthTableComponent.test.tsx, TruthTableComponent.stories.tsx も同期すること。
 */

import type { CSSProperties } from "react";
import { useMemo } from "react";
import type { Formula } from "../logic-core/formula";
import { FormulaKaTeX } from "../formula-input/FormulaKaTeX";
import {
  buildTruthTableDisplayData,
  formatTruthValue,
  getClassificationLabel,
} from "./truthTableLogic";
import type { FormulaClassification } from "./truthTableLogic";

export interface TruthTableComponentProps {
  /** 表示する命題論理式 */
  readonly formula: Formula;
  /** ロケール */
  readonly locale?: "ja" | "en";
  /** data-testid */
  readonly testId?: string;
}

const themeTransition =
  "background-color var(--theme-transition-duration,0s) ease-in-out, border-color var(--theme-transition-duration,0s) ease-in-out, color var(--theme-transition-duration,0s) ease-in-out";

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  fontFamily: "var(--font-ui)",
};

const badgeBaseStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "2px 8px",
  borderRadius: "4px",
  fontSize: "var(--font-size-sm)",
  fontWeight: 500,
};

const badgeStyles: Readonly<Record<FormulaClassification, CSSProperties>> = {
  tautology: {
    ...badgeBaseStyle,
    backgroundColor: "var(--color-success-bg,#dcfce7)",
    color: "var(--color-success,#16a34a)",
  },
  satisfiable: {
    ...badgeBaseStyle,
    backgroundColor: "var(--color-warning-bg,#fef9c3)",
    color: "var(--color-warning,#ca8a04)",
  },
  contradiction: {
    ...badgeBaseStyle,
    backgroundColor: "var(--color-error-bg,#fee2e2)",
    color: "var(--color-error,#dc2626)",
  },
};

const tableStyle: CSSProperties = {
  borderCollapse: "collapse",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--font-size-sm)",
};

const cellBaseStyle: CSSProperties = {
  padding: "4px 12px",
  textAlign: "center",
  border: "1px solid var(--color-border,#e2e8f0)",
  transition: themeTransition,
};

const thStyle: CSSProperties = {
  ...cellBaseStyle,
  backgroundColor: "var(--color-bg-secondary,#f5f5f5)",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const thResultStyle: CSSProperties = {
  ...thStyle,
  borderLeft: "2px solid var(--color-text-secondary,#666666)",
};

const tdResultBaseStyle: CSSProperties = {
  ...cellBaseStyle,
  borderLeft: "2px solid var(--color-text-secondary,#666666)",
  fontWeight: 600,
};

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

  return (
    <div style={containerStyle} data-testid={testId}>
      <div>
        <span
          style={badgeStyles[displayData.classification]}
          data-testid={badgeTestId}
        >
          {classificationLabel}
        </span>
      </div>
      <table style={tableStyle} data-testid={tableTestId}>
        <thead>
          <tr>
            {displayData.variables.map((v) => (
              <th key={v} style={thStyle}>
                {v}
              </th>
            ))}
            <th style={thResultStyle}>
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
                  style={{
                    ...cellBaseStyle,
                    color: v
                      ? "var(--color-success,#16a34a)"
                      : "var(--color-error,#dc2626)",
                  }}
                >
                  {formatTruthValue(v)}
                </td>
              ))}
              <td
                style={{
                  ...tdResultBaseStyle,
                  color: row.result
                    ? "var(--color-success,#16a34a)"
                    : "var(--color-error,#dc2626)",
                }}
              >
                {formatTruthValue(row.result)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
