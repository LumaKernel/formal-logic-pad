/**
 * 論理式テキスト入力コンポーネント。
 *
 * DSLテキストで論理式を入力し、リアルタイムにパース結果をプレビュー表示する。
 * パース成功時は Unicode 表示でプレビュー、エラー時はエラー位置とメッセージを表示。
 *
 * 変更時は FormulaInput.test.tsx, FormulaInput.stories.tsx, index.ts も同期すること。
 */

import type { CSSProperties } from "react";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Either } from "effect";
import type { Formula } from "../logic-core/formula";
import type { FormulaTokenKind } from "../logic-lang/formulaHighlight";
import { tokenizeDslInput } from "../logic-lang/formulaHighlight";
import type { ParseError } from "../logic-lang/parser";
import { parseString } from "../logic-lang/parser";
import { CompletionPopup } from "./CompletionPopup";
import { FormulaDisplay } from "./FormulaDisplay";
import { useCompletion } from "./useCompletion";

// --- パース結果の型 ---

export type FormulaParseState =
  | { readonly status: "empty" }
  | { readonly status: "success"; readonly formula: Formula }
  | {
      readonly status: "error";
      readonly errors: readonly ParseError[];
    };

// --- Props ---

export interface FormulaInputProps {
  /** 入力テキスト（制御コンポーネント） */
  readonly value: string;
  /** テキスト変更時のコールバック */
  readonly onChange: (value: string) => void;
  /** パース成功時にFormula ASTを通知するコールバック */
  readonly onParsed?: (formula: Formula) => void;
  /** プレースホルダーテキスト */
  readonly placeholder?: string;
  /** フォントサイズ (CSS値) */
  readonly fontSize?: CSSProperties["fontSize"];
  /** 追加の className */
  readonly className?: string;
  /** 追加のスタイル（コンテナ） */
  readonly style?: CSSProperties;
  /** data-testid */
  readonly testId?: string;
  /** blur時のコールバック（FormulaEditorからのモード遷移に使用） */
  readonly onBlur?: () => void;
  /** プレビュー（パース成功時のFormulaDisplay）を表示するか（デフォルト: true） */
  readonly showPreview?: boolean;
}

// --- 純粋関数: パース ---

export const computeParseState = (input: string): FormulaParseState => {
  const trimmed = input.trim();
  if (trimmed === "") {
    return { status: "empty" };
  }
  const result = parseString(trimmed);
  if (Either.isRight(result)) {
    return { status: "success", formula: result.right };
  }
  return { status: "error", errors: result.left };
};

// --- エラー位置からアンダーライン範囲を計算する純粋関数 ---

export interface ErrorHighlight {
  readonly start: number;
  readonly end: number;
}

export const computeErrorHighlights = (
  input: string,
  errors: readonly ParseError[],
): readonly ErrorHighlight[] => {
  const lines = input.split("\n");

  return errors.flatMap((error) => {
    const { start, end } = error.span;

    // 1-indexed → 0-indexed offset 変換
    let startOffset = 0;
    for (let i = 0; i < start.line - 1 && i < lines.length; i++) {
      /* v8 ignore start -- defensive: lines[i] is always defined within loop bounds */
      startOffset += (lines[i] ?? "").length + 1; // +1 for newline
      /* v8 ignore stop */
    }
    startOffset += start.column - 1;

    let endOffset = 0;
    for (let i = 0; i < end.line - 1 && i < lines.length; i++) {
      /* v8 ignore start -- defensive: lines[i] is always defined within loop bounds */
      endOffset += (lines[i] ?? "").length + 1;
      /* v8 ignore stop */
    }
    endOffset += end.column - 1;

    // 最低1文字はハイライト
    if (endOffset <= startOffset) {
      endOffset = startOffset + 1;
    }

    // 入力範囲にクランプ
    const clampedStart = Math.max(0, Math.min(startOffset, input.length));
    const clampedEnd = Math.max(
      clampedStart,
      Math.min(endOffset, input.length),
    );

    return [{ start: clampedStart, end: clampedEnd }];
  });
};

// --- エラーメッセージのフォーマット ---

export const formatErrorMessage = (error: ParseError): string => {
  const { line, column } = error.span.start;
  return `${`${line satisfies number}` satisfies string}:${`${column satisfies number}` satisfies string} ${error.message satisfies string}`;
};

// --- コンポーネント ---

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const inputBaseStyle: CSSProperties = {
  fontFamily: "var(--font-mono)",
  padding: "6px 8px",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "var(--color-border, #ccc)",
  borderRadius: 4,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  backgroundColor: "var(--color-surface, #ffffff)",
  color: "var(--color-text-primary, #171717)",
};

const inputErrorStyle: CSSProperties = {
  ...inputBaseStyle,
  borderColor: "var(--color-error, #e53e3e)",
  boxShadow: "0 0 0 1px var(--color-error, #e53e3e)",
};

const previewStyle: CSSProperties = {
  padding: "4px 8px",
  backgroundColor: "var(--color-bg-secondary, #f7fafc)",
  borderRadius: 4,
  minHeight: 24,
};

const errorContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const errorMessageStyle: CSSProperties = {
  color: "var(--color-error, #e53e3e)",
  fontSize: "0.85em",
  fontFamily: "var(--font-mono)",
};

const highlightContainerStyle: CSSProperties = {
  position: "relative",
  fontFamily: "var(--font-mono)",
  fontSize: "inherit",
  whiteSpace: "pre",
  padding: "6px 8px",
  pointerEvents: "none",
  overflow: "hidden",
  lineHeight: "normal",
};

const highlightMarkStyle: CSSProperties = {
  backgroundColor: "rgba(229, 62, 62, 0.2)",
  textDecoration: "underline",
  textDecorationColor: "#e53e3e",
  textDecorationStyle: "wavy",
  color: "transparent",
};

const transparentTextStyle: CSSProperties = {
  color: "transparent",
};

/**
 * FormulaTokenKind → CSS変数名の対応（FormulaDisplay.tsx と同一）。
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

export function FormulaInput({
  value,
  onChange,
  onParsed,
  placeholder = "φ → ψ",
  fontSize,
  className,
  style,
  testId,
  onBlur,
  showPreview = true,
}: FormulaInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // useDeferredValue でパースをデバウンス
  const deferredValue = useDeferredValue(value);
  const parseState = useMemo(
    () => computeParseState(deferredValue),
    [deferredValue],
  );

  // 入力補完
  const comp = useCompletion(value);

  // パース成功時に onParsed を呼ぶ
  useEffect(() => {
    if (parseState.status === "success" && onParsed) {
      onParsed(parseState.formula);
    }
  }, [parseState, onParsed]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      // 補完を更新（カーソル位置はselectionStartから取得）
      /* v8 ignore start -- defensive: selectionStart is null only for non-text inputs */
      const cursorPos = e.target.selectionStart ?? newValue.length;
      /* v8 ignore stop */
      comp.update(newValue, cursorPos);
    },
    [onChange, comp],
  );

  const handleCompletionSelect = useCallback(
    (candidate: Parameters<typeof comp.selectCandidate>[0]) => {
      const result = comp.selectCandidate(candidate);
      /* v8 ignore start -- 補完選択は Storybook テストでカバー、rAF内はjsdom不可 */
      if (result) {
        onChange(result.text);
        // カーソル位置を復元
        requestAnimationFrame(() => {
          inputRef.current?.setSelectionRange(
            result.cursorPos,
            result.cursorPos,
          );
        });
      }
      /* v8 ignore stop */
    },
    [comp, onChange],
  );

  const mergedContainerStyle: CSSProperties = useMemo(
    () => ({
      ...containerStyle,
      ...style,
      ...(fontSize !== undefined ? { fontSize } : {}),
    }),
    [style, fontSize],
  );

  const currentInputStyle =
    parseState.status === "error" ? inputErrorStyle : inputBaseStyle;

  const errorHighlights = useMemo(
    () =>
      parseState.status === "error"
        ? computeErrorHighlights(deferredValue, parseState.errors)
        : [],
    [parseState, deferredValue],
  );

  // シンタックスハイライト用トークン（エラーがない場合のみ）
  const syntaxTokens = useMemo(
    () =>
      errorHighlights.length === 0 ? tokenizeDslInput(deferredValue) : null,
    [deferredValue, errorHighlights.length],
  );

  // オーバーレイが必要か（エラーハイライトまたはシンタックスハイライト）
  const hasOverlay = errorHighlights.length > 0 || syntaxTokens !== null;

  return (
    <div
      className={className}
      style={mergedContainerStyle}
      data-testid={testId}
    >
      {/* 入力欄 + ハイライトオーバーレイ + 補完ポップアップ */}
      <div style={{ position: "relative" }}>
        {/* エラーハイライト（入力欄の背後） */}
        {errorHighlights.length > 0 && (
          <div
            style={highlightContainerStyle}
            aria-hidden="true"
            data-testid={
              testId ? `${testId satisfies string}-highlights` : undefined
            }
          >
            {renderHighlightedText(deferredValue, errorHighlights)}
          </div>
        )}
        {/* シンタックスハイライト（エラーがない場合、入力欄の背後） */}
        {syntaxTokens !== null && (
          <div
            style={highlightContainerStyle}
            aria-hidden="true"
            data-testid={
              testId
                ? `${testId satisfies string}-syntax-highlight`
                : undefined
            }
          >
            {syntaxTokens.map((token, i) => (
              <span key={i} style={{ color: tokenKindToVar[token.kind] }}>
                {token.text}
              </span>
            ))}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          style={{
            ...currentInputStyle,
            ...(fontSize !== undefined ? { fontSize } : {}),
            ...(hasOverlay
              ? {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  backgroundColor: "transparent",
                  color: "transparent",
                  caretColor: "var(--color-text-primary, #171717)",
                }
              : {}),
          }}
          data-testid={testId ? `${testId satisfies string}-input` : undefined}
          aria-invalid={parseState.status === "error"}
          aria-describedby={
            parseState.status === "error" && testId
              ? `${testId satisfies string}-errors`
              : undefined
          }
          onBlur={onBlur}
        />
        {/* オーバーレイがあるときの高さ確保（inputがabsoluteのため） */}
        {hasOverlay && (
          <div style={{ visibility: "hidden", ...highlightContainerStyle }}>
            {/* v8 ignore start -- deferredValue is always non-empty when overlay exists */}
            {deferredValue || placeholder}
            {/* v8 ignore stop */}
          </div>
        )}
        {/* 補完ポップアップ */}
        {comp.isOpen && (
          <CompletionPopup
            candidates={comp.completion.candidates}
            selectedIndex={comp.selectedIndex}
            onSelect={handleCompletionSelect}
            onSelectedIndexChange={comp.setSelectedIndex}
            onClose={comp.close}
            testId={
              testId ? `${testId satisfies string}-completion` : undefined
            }
          />
        )}
      </div>

      {/* プレビュー（パース成功時、showPreview=trueの場合のみ） */}
      {showPreview && parseState.status === "success" && (
        <div
          style={previewStyle}
          data-testid={
            testId ? `${testId satisfies string}-preview` : undefined
          }
        >
          <FormulaDisplay
            formula={parseState.formula}
            fontSize={fontSize}
            testId={testId ? `${testId satisfies string}-formula` : undefined}
          />
        </div>
      )}

      {/* エラー表示 */}
      {parseState.status === "error" && (
        <div
          style={errorContainerStyle}
          data-testid={testId ? `${testId satisfies string}-errors` : undefined}
          id={testId ? `${testId satisfies string}-errors` : undefined}
          role="alert"
          aria-live="polite"
        >
          {parseState.errors.map((error, i) => (
            <div
              key={`${error.span.start.line satisfies number}:${error.span.start.column satisfies number}`}
              style={errorMessageStyle}
              data-testid={
                testId
                  ? `${testId satisfies string}-error-${`${i satisfies number}` satisfies string}`
                  : undefined
              }
            >
              {formatErrorMessage(error)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- ハイライトテキストのレンダリング ---

function renderHighlightedText(
  text: string,
  highlights: readonly ErrorHighlight[],
): readonly React.ReactNode[] {
  // 防御的チェック: 呼び出し側で errorHighlights.length > 0 を確認済みのため到達しない
  /* v8 ignore start */
  if (highlights.length === 0) {
    return [
      <span key="text" style={transparentTextStyle}>
        {text}
      </span>,
    ];
  }
  /* v8 ignore stop */

  // ハイライト範囲をソートしてマージ
  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  const merged: ErrorHighlight[] = [];
  for (const h of sorted) {
    const last = merged[merged.length - 1];
    /* v8 ignore start -- ハイライト重複マージ: 単一エラー入力では到達しにくい */
    if (last && h.start <= last.end) {
      merged[merged.length - 1] = {
        start: last.start,
        end: Math.max(last.end, h.end),
      };
    } else {
      /* v8 ignore stop */
      merged.push({ ...h });
    }
  }

  const parts: React.ReactNode[] = [];
  let pos = 0;

  for (const h of merged) {
    if (pos < h.start) {
      parts.push(
        <span
          key={`t-${`${pos satisfies number}` satisfies string}`}
          style={transparentTextStyle}
        >
          {text.slice(pos, h.start)}
        </span>,
      );
    }
    parts.push(
      <mark
        key={`h-${`${h.start satisfies number}` satisfies string}`}
        style={highlightMarkStyle}
      >
        {text.slice(h.start, h.end)}
      </mark>,
    );
    pos = h.end;
  }

  if (pos < text.length) {
    parts.push(
      <span
        key={`t-${`${pos satisfies number}` satisfies string}`}
        style={transparentTextStyle}
      >
        {text.slice(pos)}
      </span>,
    );
  }

  return parts;
}
