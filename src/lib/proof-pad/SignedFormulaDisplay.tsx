/**
 * 署名付き論理式（AT）の視覚的表示コンポーネント。
 *
 * "T:φ" / "F:φ" をパースし、符号（T/F）を色付きバッジで、
 * 論理式をFormulaDisplayでシンタックスハイライト付きで表示する。
 *
 * - T（真）: 緑系バッジ
 * - F（偽）: 赤系バッジ
 * - コロン区切り: 控えめな表示
 * - 論理式部分: FormulaDisplay でトークナイズ＋ハイライト
 *
 * 変更時は SignedFormulaDisplay.stories.tsx, signedFormulaDisplayLogic.ts, index.ts も同期すること。
 */

import type { CSSProperties } from "react";
import { useMemo } from "react";
import { FormulaDisplay } from "../formula-input/FormulaDisplay";
import type { SignedFormulaDisplayData } from "./signedFormulaDisplayLogic";
import { parseSignedFormulaDisplayData } from "./signedFormulaDisplayLogic";

// --- Props ---

export type SignedFormulaDisplayProps = {
  /** 署名付き論理式テキスト（"T:φ" or "F:φ"） */
  readonly text: string;
  /** フォントサイズ */
  readonly fontSize?: CSSProperties["fontSize"];
  /** テキスト色 */
  readonly color?: CSSProperties["color"];
  /** data-testid */
  readonly testId?: string;
};

// --- スタイル ---

const containerStyle: Readonly<CSSProperties> = {
  display: "inline-flex",
  alignItems: "baseline",
  gap: 0,
  fontFamily: "var(--font-formula)",
  fontStyle: "italic",
  whiteSpace: "nowrap",
};

const signBadgeBaseStyle: Readonly<CSSProperties> = {
  fontStyle: "normal",
  fontWeight: 700,
  fontSize: "0.85em",
  padding: "0 3px",
  borderRadius: 3,
  letterSpacing: 0.5,
  lineHeight: 1,
};

const trueSignStyle: Readonly<CSSProperties> = {
  ...signBadgeBaseStyle,
  color: "var(--color-at-sign-true-text, #166534)",
  background: "var(--color-at-sign-true-bg, rgba(34, 197, 94, 0.15))",
};

const falseSignStyle: Readonly<CSSProperties> = {
  ...signBadgeBaseStyle,
  color: "var(--color-at-sign-false-text, #991b1b)",
  background: "var(--color-at-sign-false-bg, rgba(239, 68, 68, 0.15))",
};

const colonStyle: Readonly<CSSProperties> = {
  fontStyle: "normal",
  padding: "0 2px",
  color: "var(--color-text-secondary, #666)",
};

const fallbackTextStyle: Readonly<CSSProperties> = {
  fontFamily: "var(--font-formula)",
  fontStyle: "italic",
};

// --- メインコンポーネント ---

export function SignedFormulaDisplay({
  text,
  fontSize,
  color,
  testId,
}: SignedFormulaDisplayProps) {
  const displayData: SignedFormulaDisplayData | undefined = useMemo(
    () => parseSignedFormulaDisplayData(text),
    [text],
  );

  const mergedContainerStyle: CSSProperties = useMemo(
    () => ({
      ...containerStyle,
      ...(fontSize !== undefined ? { fontSize } : {}),
      ...(color !== undefined ? { color } : {}),
    }),
    [fontSize, color],
  );

  // パース失敗時はプレーンテキスト表示
  if (displayData === undefined) {
    return (
      <span
        style={{
          ...fallbackTextStyle,
          ...(fontSize !== undefined ? { fontSize } : {}),
          ...(color !== undefined ? { color } : {}),
        }}
        data-testid={testId}
      >
        {text}
      </span>
    );
  }

  const signStyle = displayData.sign === "T" ? trueSignStyle : falseSignStyle;

  return (
    <span
      style={mergedContainerStyle}
      role="math"
      aria-label={text}
      data-testid={testId}
    >
      {/* 符号バッジ */}
      <span
        style={signStyle}
        data-testid={
          testId !== undefined ? `${testId satisfies string}-sign` : undefined
        }
      >
        {displayData.sign}
      </span>

      {/* コロン区切り */}
      <span style={colonStyle}>:</span>

      {/* 論理式部分 */}
      {displayData.formulaSlot._tag === "parsed" ? (
        <FormulaDisplay
          formula={displayData.formulaSlot.formula}
          fontSize={fontSize}
          color={color}
          testId={
            testId !== undefined
              ? `${testId satisfies string}-formula`
              : undefined
          }
        />
      ) : (
        <span
          style={{
            ...fallbackTextStyle,
            ...(fontSize !== undefined ? { fontSize } : {}),
            ...(color !== undefined ? { color } : {}),
          }}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-formula`
              : undefined
          }
        >
          {displayData.formulaSlot.text}
        </span>
      )}
    </span>
  );
}
