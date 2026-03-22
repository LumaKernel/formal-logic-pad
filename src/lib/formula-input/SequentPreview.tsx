/**
 * シーケントプレビューコンポーネント。
 *
 * 前件・後件のテキスト配列から、各論理式をパースして美しく表示する。
 * パース失敗の論理式はテキストフォールバック表示。
 *
 * 変更時は SequentExpandedEditor.tsx も同期すること。
 */

import type { CSSProperties } from "react";
import { useMemo } from "react";
import { Either } from "effect";
import { parseString } from "../logic-lang/parser";
import type { Formula } from "../logic-core/formula";
import { FormulaDisplay } from "./FormulaDisplay";

// --- Props ---

export interface SequentPreviewProps {
  /** 前件の論理式テキスト配列 */
  readonly antecedents: readonly string[];
  /** 後件の論理式テキスト配列 */
  readonly succedents: readonly string[];
  /** data-testid */
  readonly testId?: string;
}

// --- Styles ---

const containerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "wrap",
  fontFamily: "var(--font-formula)",
  fontStyle: "italic",
  fontSize: 14,
};

const turnstileStyle: CSSProperties = {
  fontWeight: 700,
  fontStyle: "normal",
  fontSize: 16,
  color: "var(--color-text-secondary, #666666)",
};

const commaStyle: CSSProperties = {
  fontStyle: "normal",
  color: "var(--color-text-tertiary, #999999)",
};

const errorTextStyle: CSSProperties = {
  color: "var(--color-error, #e53e3e)",
  fontFamily: "var(--font-mono)",
  fontStyle: "normal",
  fontSize: 12,
};

const emptyPlaceholderStyle: CSSProperties = {
  color: "var(--color-text-tertiary, #999999)",
  fontStyle: "italic",
  fontSize: 12,
};

// --- Helper ---

interface FormulaSlot {
  readonly text: string;
  readonly formula: Formula | null;
}

function parseFormulaSlot(text: string): FormulaSlot {
  const trimmed = text.trim();
  /* v8 ignore start */ // 呼び出し元で空文字列はフィルタ済みだが防御的チェック
  if (trimmed === "") return { text: trimmed, formula: null };
  /* v8 ignore stop */
  const result = parseString(trimmed);
  if (Either.isRight(result)) {
    return { text: trimmed, formula: result.right };
  }
  return { text: trimmed, formula: null };
}

// --- Component ---

export function SequentPreview({
  antecedents,
  succedents,
  testId,
}: SequentPreviewProps) {
  const antecedentSlots = useMemo(
    () =>
      antecedents
        .filter((t) => t.trim() !== "")
        .map((t) => parseFormulaSlot(t)),
    [antecedents],
  );
  const succedentSlots = useMemo(
    () =>
      succedents.filter((t) => t.trim() !== "").map((t) => parseFormulaSlot(t)),
    [succedents],
  );

  return (
    <div style={containerStyle} data-testid={testId}>
      {antecedentSlots.length === 0 ? (
        <span style={emptyPlaceholderStyle}>∅</span>
      ) : (
        antecedentSlots.map((slot, i) => (
          <span key={`a-${String(i) satisfies string}`}>
            {i > 0 && <span style={commaStyle}>, </span>}
            {slot.formula !== null ? (
              <FormulaDisplay formula={slot.formula} />
            ) : (
              <span style={errorTextStyle}>{slot.text}</span>
            )}
          </span>
        ))
      )}
      <span style={turnstileStyle}>⇒</span>
      {succedentSlots.length === 0 ? (
        <span style={emptyPlaceholderStyle}>∅</span>
      ) : (
        succedentSlots.map((slot, i) => (
          <span key={`s-${String(i) satisfies string}`}>
            {i > 0 && <span style={commaStyle}>, </span>}
            {slot.formula !== null ? (
              <FormulaDisplay formula={slot.formula} />
            ) : (
              <span style={errorTextStyle}>{slot.text}</span>
            )}
          </span>
        ))
      )}
    </div>
  );
}
