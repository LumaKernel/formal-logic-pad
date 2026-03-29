/**
 * シーケント分解表示コンポーネント。
 *
 * シーケント（Γ ⇒ Δ）を視覚的に分解し、各論理式を
 * FormulaDisplay でシンタックスハイライト付きで表示する。
 *
 * 変更時は SequentDisplay.stories.tsx, sequentDisplayLogic.ts, index.ts も同期すること。
 */

import type { CSSProperties } from "react";
import { useMemo } from "react";
import { FormulaDisplay } from "../formula-input/FormulaDisplay";
import type { SequentDisplayData, FormulaSlot } from "./sequentDisplayLogic";
import {
  parseSequentDisplayData,
  sequentToDisplayData,
  sequentTextsToDisplayData,
} from "./sequentDisplayLogic";
import type { Sequent } from "../logic-core/sequentCalculus";
import type { SequentTextParts } from "./scApplicationLogic";

// --- Props ---

export type SequentDisplayProps = {
  /** シーケントテキスト（"φ, ψ ⇒ χ"） */
  readonly text?: string;
  /** Sequent型オブジェクト（textより優先） */
  readonly sequent?: Sequent;
  /** 構造化された前件/後件テキスト配列（textの再パースをスキップ、sequentより低優先） */
  readonly sequentTexts?: SequentTextParts;
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

const turnstileStyle: Readonly<CSSProperties> = {
  fontStyle: "normal",
  fontWeight: 700,
  padding: "0 4px",
  color: "var(--color-syntax-connective, #6b21a8)",
  opacity: 0.8,
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

function FormulaList({
  slots,
  fontSize,
  color,
  side,
  testId,
}: {
  readonly slots: readonly FormulaSlot[];
  readonly fontSize?: CSSProperties["fontSize"];
  readonly color?: CSSProperties["color"];
  readonly side: "ant" | "suc";
  readonly testId: string | undefined;
}) {
  return (
    <>
      {slots.map((slot, i) => (
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
                ? `${testId satisfies string}-${side satisfies string}-${String(i) satisfies string}`
                : undefined
            }
          />
        </span>
      ))}
    </>
  );
}

// --- メインコンポーネント ---

export function SequentDisplay({
  text,
  sequent,
  sequentTexts,
  fontSize,
  color,
  testId,
}: SequentDisplayProps) {
  const displayData: SequentDisplayData = useMemo(() => {
    if (sequent !== undefined) return sequentToDisplayData(sequent);
    if (sequentTexts !== undefined)
      return sequentTextsToDisplayData(sequentTexts);
    if (text !== undefined) return parseSequentDisplayData(text);
    return { antecedents: [], succedents: [] };
  }, [text, sequent, sequentTexts]);

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
      aria-label={text ?? ""}
      data-testid={testId}
    >
      {/* 前件 */}
      <FormulaList
        slots={displayData.antecedents}
        fontSize={fontSize}
        color={color}
        side="ant"
        testId={testId}
      />

      {/* ⇒ セパレータ */}
      <span
        style={{
          ...turnstileStyle,
          ...(fontSize !== undefined
            ? {
                fontSize:
                  typeof fontSize === "number" ? fontSize * 1.1 : fontSize,
              }
            : {}),
        }}
        data-testid={
          testId !== undefined
            ? `${testId satisfies string}-turnstile`
            : undefined
        }
      >
        ⇒
      </span>

      {/* 後件 */}
      <FormulaList
        slots={displayData.succedents}
        fontSize={fontSize}
        color={color}
        side="suc"
        testId={testId}
      />
    </span>
  );
}
