/**
 * 論理式リスト（TAB用）の表示コンポーネント。
 *
 * カンマ区切りの論理式リストを、各論理式を
 * FormulaDisplay でシンタックスハイライト付きで表示する。
 *
 * 変更時は FormulaListDisplay.stories.tsx, formulaListDisplayLogic.ts, index.ts も同期すること。
 */

import type { CSSProperties } from "react";
import { useMemo } from "react";
import { FormulaDisplay } from "../formula-input/FormulaDisplay";
import type { FormulaSlot } from "./sequentDisplayLogic";
import type { FormulaListDisplayData } from "./formulaListDisplayLogic";
import { formulaTextsToDisplayData } from "./formulaListDisplayLogic";
import { splitByTopLevelComma } from "./tabApplicationLogic";

// --- Props ---

export type FormulaListDisplayProps = {
  /** カンマ区切りの論理式テキスト（"φ, ψ ∧ χ"） */
  readonly text?: string;
  /** 構造化された論理式テキスト配列（textの再パースをスキップ） */
  readonly formulaTexts?: readonly string[];
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

const commaStyle: Readonly<CSSProperties> = {
  fontStyle: "normal",
  padding: "0 1px",
  color: "var(--color-text-secondary, #666)",
};

const fallbackTextStyle: Readonly<CSSProperties> = {
  fontFamily: "var(--font-formula)",
  fontStyle: "italic",
};

// --- 内部コンポーネント ---

function FormulaSlotView({
  slot,
  fontSize,
  color,
  testId,
}: {
  readonly slot: FormulaSlot;
  readonly fontSize?: CSSProperties["fontSize"];
  readonly color?: CSSProperties["color"];
  readonly testId?: string;
}) {
  if (slot._tag === "parsed") {
    return (
      <FormulaDisplay
        formula={slot.formula}
        fontSize={fontSize}
        color={color}
        testId={testId}
      />
    );
  }
  return (
    <span
      style={{
        ...fallbackTextStyle,
        ...(fontSize !== undefined ? { fontSize } : {}),
        ...(color !== undefined ? { color } : {}),
      }}
      data-testid={testId}
    >
      {slot.text}
    </span>
  );
}

// --- メインコンポーネント ---

export function FormulaListDisplay({
  text,
  formulaTexts,
  fontSize,
  color,
  testId,
}: FormulaListDisplayProps) {
  const displayData: FormulaListDisplayData = useMemo(() => {
    if (formulaTexts !== undefined) return formulaTextsToDisplayData(formulaTexts);
    if (text !== undefined)
      return formulaTextsToDisplayData(splitByTopLevelComma(text));
    return { formulas: [] };
  }, [text, formulaTexts]);

  const mergedContainerStyle: CSSProperties = useMemo(
    () => ({
      ...containerStyle,
      ...(fontSize !== undefined ? { fontSize } : {}),
      ...(color !== undefined ? { color } : {}),
    }),
    [fontSize, color],
  );

  return (
    <span
      style={mergedContainerStyle}
      role="math"
      aria-label={text ?? formulaTexts?.join(", ") ?? ""}
      data-testid={testId}
    >
      {displayData.formulas.map((slot, i) => (
        <span
          key={i}
          style={{ display: "inline-flex", alignItems: "baseline" }}
        >
          {i > 0 ? <span style={commaStyle}>,</span> : null}
          <FormulaSlotView
            slot={slot}
            fontSize={fontSize}
            color={color}
            testId={
              testId !== undefined
                ? `${testId satisfies string}-formula-${String(i) satisfies string}`
                : undefined
            }
          />
        </span>
      ))}
    </span>
  );
}
