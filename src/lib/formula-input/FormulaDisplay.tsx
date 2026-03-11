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
import type { FormulaTokenKind } from "../logic-lang/formulaHighlight";
import { tokenizeFormula, tokensToText } from "../logic-lang/formulaHighlight";
import { formatFormula } from "../logic-lang/formatUnicode";

/**
 * FormulaTokenKind → CSS変数名の対応。
 */
const tokenKindToVar: Readonly<Record<FormulaTokenKind, string>> = {
  connective: "var(--color-syntax-connective)",
  quantifier: "var(--color-syntax-quantifier)",
  variable: "var(--color-syntax-variable)",
  metaVariable: "var(--color-syntax-metaVariable)",
  predicate: "var(--color-syntax-predicate)",
  function: "var(--color-syntax-function)",
  constant: "var(--color-syntax-constant)",
  subscript: "var(--color-syntax-subscript)",
  equality: "var(--color-syntax-equality)",
  punctuation: "var(--color-syntax-punctuation)",
  negation: "var(--color-syntax-negation)",
  substitution: "var(--color-syntax-substitution)",
};

export interface FormulaDisplayProps {
  /** 表示する論理式 AST */
  readonly formula: Formula;
  /** フォントサイズ (CSS値) */
  readonly fontSize?: CSSProperties["fontSize"];
  /** テキスト色 (CSS値) */
  readonly color?: CSSProperties["color"];
  /** シンタックスハイライトを有効にする */
  readonly highlight?: boolean;
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
  highlight = false,
  className,
  style,
  testId,
}: FormulaDisplayProps) {
  const tokens = useMemo(
    () => (highlight ? tokenizeFormula(formula) : null),
    [formula, highlight],
  );
  const text = useMemo(
    () => (tokens !== null ? tokensToText(tokens) : formatFormula(formula)),
    [formula, tokens],
  );

  const mergedStyle: CSSProperties = useMemo(
    () => ({
      fontFamily: "var(--font-formula)",
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
      {highlight && tokens !== null
        ? tokens.map((token, i) => (
            <span key={i} style={{ color: tokenKindToVar[token.kind] }}>
              {token.text}
            </span>
          ))
        : text}
    </span>
  );
}
