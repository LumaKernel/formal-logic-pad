/**
 * Unicode 項レンダラー。
 *
 * Logic Core の Term AST を Unicode 文字列で表示する React コンポーネント。
 * Logic Lang の formatTerm() を使用して AST → Unicode 変換を行う。
 *
 * 変更時は TermDisplay.test.tsx, TermDisplay.stories.tsx, index.ts も同期すること。
 */

import type { CSSProperties } from "react";
import { useMemo } from "react";
import type { Term } from "../logic-core/term";
import type { FormulaTokenKind } from "../logic-lang/formulaHighlight";
import { tokenizeTerm, tokensToText } from "../logic-lang/formulaHighlight";
import { formatTerm } from "../logic-lang/formatUnicode";

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

export interface TermDisplayProps {
  /** 表示する項 AST */
  readonly term: Term;
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
 * Term AST を Unicode 文字列で表示するコンポーネント。
 *
 * 二項演算子（+, −, ×, ÷, ^）、関数適用、定数、変数を正しく表示し、
 * 最小限の括弧のみ使用する。
 */
export function TermDisplay({
  term,
  fontSize,
  color,
  highlight = false,
  className,
  style,
  testId,
}: TermDisplayProps) {
  /* v8 ignore start — V8 coverage merging quirk: useMemo内の三項演算子は個別テストで全ブランチカバー済み */
  const tokens = useMemo(
    () => (highlight ? tokenizeTerm(term) : null),
    [term, highlight],
  );
  const text = useMemo(
    () => (tokens !== null ? tokensToText(tokens) : formatTerm(term)),
    [term, tokens],
  );
  /* v8 ignore stop */

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
