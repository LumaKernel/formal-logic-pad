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
import { cn } from "@/lib/utils";
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

const badgeBase =
  "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[length:var(--font-size-sm)] font-medium";

const badgeClassNames: Record<FormulaClassification, string> = {
  tautology: cn(
    badgeBase,
    "bg-[var(--color-success-bg,#dcfce7)] text-[var(--color-success,#16a34a)]",
  ),
  satisfiable: cn(
    badgeBase,
    "bg-[var(--color-warning-bg,#fef9c3)] text-[var(--color-warning,#ca8a04)]",
  ),
  contradiction: cn(
    badgeBase,
    "bg-[var(--color-error-bg,#fee2e2)] text-[var(--color-error,#dc2626)]",
  ),
};

const badgeClassName = (classification: FormulaClassification): string =>
  badgeClassNames[classification];

const themeTransition =
  "transition-[background-color,border-color,color] duration-[var(--theme-transition-duration,0s)] ease-in-out";

const cellBase = cn(
  "px-3 py-1 text-center border border-[var(--color-border,#e2e8f0)]",
  themeTransition,
);

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
    <div
      className="flex flex-col gap-2 font-[family-name:var(--font-ui)]"
      data-testid={testId}
    >
      <div>
        <span
          className={badgeClassName(displayData.classification)}
          data-testid={badgeTestId}
        >
          {classificationLabel}
        </span>
      </div>
      <table
        className="border-collapse font-[family-name:var(--font-mono)] text-[length:var(--font-size-sm)]"
        data-testid={tableTestId}
      >
        <thead>
          <tr>
            {displayData.variables.map((v) => (
              <th
                key={v}
                className={cn(
                  cellBase,
                  "bg-[var(--color-bg-secondary,#f5f5f5)] font-semibold whitespace-nowrap",
                )}
              >
                {v}
              </th>
            ))}
            <th
              className={cn(
                cellBase,
                "bg-[var(--color-bg-secondary,#f5f5f5)] font-semibold whitespace-nowrap border-l-2 border-l-[var(--color-text-secondary,#666666)]",
              )}
            >
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
                  className={cn(
                    cellBase,
                    v
                      ? "text-[var(--color-success,#16a34a)]"
                      : "text-[var(--color-error,#dc2626)]",
                  )}
                >
                  {formatTruthValue(v)}
                </td>
              ))}
              <td
                className={cn(
                  cellBase,
                  "border-l-2 border-l-[var(--color-text-secondary,#666666)] font-semibold",
                  row.result
                    ? "text-[var(--color-success,#16a34a)]"
                    : "text-[var(--color-error,#dc2626)]",
                )}
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
