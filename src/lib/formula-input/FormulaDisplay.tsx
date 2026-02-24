/**
 * Unicode 論理式レンダラー。
 *
 * Logic Core の Formula AST を Unicode 文字列で表示する React コンポーネント。
 * Logic Lang の formatFormula() を使用して AST → Unicode 変換を行う。
 *
 * 変更時は FormulaDisplay.test.tsx, FormulaDisplay.stories.tsx, index.ts も同期すること。
 */

import type { CSSProperties } from "react";
import { useMemo } from "react";
import type { Formula } from "../logic-core/formula";
import { formatFormula } from "../logic-lang/formatUnicode";

export interface FormulaDisplayProps {
  /** 表示する論理式 AST */
  readonly formula: Formula;
  /** フォントサイズ (CSS値) */
  readonly fontSize?: CSSProperties["fontSize"];
  /** テキスト色 (CSS値) */
  readonly color?: CSSProperties["color"];
  /** 追加の className */
  readonly className?: string;
  /** 追加のスタイル */
  readonly style?: CSSProperties;
  /** data-testid */
  readonly testId?: string;
}

/**
 * Formula AST を Unicode 文字列で表示するコンポーネント。
 *
 * 論理記号（→, ∧, ∨, ¬, ∀, ∃）と添字（₀₁₂...）を正しく表示し、
 * 最小限の括弧のみ使用する。
 */
export function FormulaDisplay({
  formula,
  fontSize,
  color,
  className,
  style,
  testId,
}: FormulaDisplayProps) {
  const text = useMemo(() => formatFormula(formula), [formula]);

  const mergedStyle: CSSProperties = useMemo(
    () => ({
      fontFamily: "serif, 'Times New Roman', Times",
      fontStyle: "italic",
      whiteSpace: "nowrap",
      ...style,
      ...(fontSize !== undefined ? { fontSize } : {}),
      ...(color !== undefined ? { color } : {}),
    }),
    [style, fontSize, color],
  );

  return (
    <span
      className={className}
      style={mergedStyle}
      data-testid={testId}
      role="math"
      aria-label={text}
    >
      {text}
    </span>
  );
}
