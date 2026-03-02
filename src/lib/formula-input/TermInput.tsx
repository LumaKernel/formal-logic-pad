/**
 * 項テキスト入力コンポーネント。
 *
 * DSLテキストで項（Term）を入力し、リアルタイムにパース結果をプレビュー表示する。
 * FormulaInput と同様のUI/UXだが、パーサーは項専用（parseTermString）を使用。
 *
 * 変更時は TermInput.test.tsx, TermInput.stories.tsx, index.ts も同期すること。
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
import type { Term } from "../logic-core/term";
import type { ParseError } from "../logic-lang/parser";
import { parseTermString } from "../logic-lang/parser";
import { CompletionPopup } from "./CompletionPopup";
import type { ErrorHighlight } from "./FormulaInput";
import { computeErrorHighlights, formatErrorMessage } from "./FormulaInput";
import { TermDisplay } from "./TermDisplay";
import { useCompletion } from "./useCompletion";

// --- パース結果の型 ---

export type TermParseState =
  | { readonly status: "empty" }
  | { readonly status: "success"; readonly term: Term }
  | {
      readonly status: "error";
      readonly errors: readonly ParseError[];
    };

// --- Props ---

export interface TermInputProps {
  /** 入力テキスト（制御コンポーネント） */
  readonly value: string;
  /** テキスト変更時のコールバック */
  readonly onChange: (value: string) => void;
  /** パース成功時にTerm ASTを通知するコールバック */
  readonly onParsed?: (term: Term) => void;
  /** プレースホルダーテキスト */
  readonly placeholder?: string;
  /** フォントサイズ (CSS値) */
  readonly fontSize?: CSSProperties["fontSize"];
  /** 追加の className */
  readonly className?: string;
  /** 追加のスタイル（コンテナ） */
  readonly style?: CSSProperties;
  /** 構文ヘルプを開くコールバック（指定時に?ボタンを表示） */
  readonly onOpenSyntaxHelp?: () => void;
  /** data-testid */
  readonly testId?: string;
  /** プレビュー（パース成功時のTermDisplay）を表示するか（デフォルト: true） */
  readonly showPreview?: boolean;
  /** blur時のコールバック */
  readonly onBlur?: () => void;
}

// --- 純粋関数: パース ---

export const computeTermParseState = (input: string): TermParseState => {
  const trimmed = input.trim();
  if (trimmed === "") {
    return { status: "empty" };
  }
  const result = parseTermString(trimmed);
  if (Either.isRight(result)) {
    return { status: "success", term: result.right };
  }
  return { status: "error", errors: result.left };
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

/* v8 ignore start -- style constant, not worth testing */
const inputErrorStyle: CSSProperties = {
  ...inputBaseStyle,
  borderColor: "var(--color-error, #e53e3e)",
  boxShadow: "0 0 0 1px var(--color-error, #e53e3e)",
};
/* v8 ignore stop */

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

const syntaxHelpButtonStyle: CSSProperties = {
  flexShrink: 0,
  width: 18,
  height: 18,
  borderRadius: "50%",
  border: "1px solid currentColor",
  background: "transparent",
  color: "inherit",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  opacity: 0.6,
  marginTop: 6,
};

export function TermInput({
  value,
  onChange,
  onParsed,
  placeholder = "f(x, y)",
  fontSize,
  className,
  style,
  onOpenSyntaxHelp,
  testId,
  showPreview = true,
  onBlur,
}: TermInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // useDeferredValue でパースをデバウンス
  const deferredValue = useDeferredValue(value);
  const parseState = useMemo(
    () => computeTermParseState(deferredValue),
    [deferredValue],
  );

  // 入力補完
  const comp = useCompletion(value);

  // パース成功時に onParsed を呼ぶ
  useEffect(() => {
    if (parseState.status === "success" && onParsed) {
      onParsed(parseState.term);
    }
  }, [parseState, onParsed]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      const cursorPos = e.target.selectionStart ?? newValue.length;
      comp.update(newValue, cursorPos);
    },
    [onChange, comp],
  );

  const handleCompletionSelect = useCallback(
    (candidate: Parameters<typeof comp.selectCandidate>[0]) => {
      const result = comp.selectCandidate(candidate);
      if (result) {
        onChange(result.text);
        requestAnimationFrame(() => {
          // inputRef.current may be null if component unmounts before rAF fires
          /* v8 ignore start */
          inputRef.current?.setSelectionRange(
            result.cursorPos,
            result.cursorPos,
          );
          /* v8 ignore stop */
        });
      }
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

  const errorHighlights: readonly ErrorHighlight[] = useMemo(
    () =>
      parseState.status === "error"
        ? computeErrorHighlights(deferredValue, parseState.errors)
        : [],
    [parseState, deferredValue],
  );

  const handleSyntaxHelpMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleSyntaxHelpClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onOpenSyntaxHelp?.();
    },
    [onOpenSyntaxHelp],
  );

  return (
    <div
      className={className}
      style={mergedContainerStyle}
      data-testid={testId}
    >
      {/* 入力欄 + エラーハイライトオーバーレイ + 補完ポップアップ + ?ボタン */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
        <div style={{ position: "relative", flex: 1 }}>
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
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            style={{
              ...currentInputStyle,
              ...(fontSize !== undefined ? { fontSize } : {}),
              ...(errorHighlights.length > 0
                ? {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    background: "transparent",
                  }
                : {}),
            }}
            data-testid={
              testId ? `${testId satisfies string}-input` : undefined
            }
            aria-invalid={parseState.status === "error"}
            aria-describedby={
              parseState.status === "error" && testId
                ? `${testId satisfies string}-errors`
                : undefined
            }
            onBlur={onBlur}
          />
          {/* ハイライトがないときの高さ確保 */}
          {errorHighlights.length > 0 && (
            <div style={{ visibility: "hidden", ...highlightContainerStyle }}>
              {deferredValue || placeholder}
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
        {onOpenSyntaxHelp !== undefined ? (
          <button
            type="button"
            style={syntaxHelpButtonStyle}
            onMouseDown={handleSyntaxHelpMouseDown}
            onClick={handleSyntaxHelpClick}
            title="Syntax help"
            data-testid={
              testId ? `${testId satisfies string}-syntax-help` : undefined
            }
          >
            ?
          </button>
        ) : null}
      </div>

      {/* プレビュー（パース成功時、showPreview=trueの場合のみ） */}
      {showPreview && parseState.status === "success" && (
        <div
          style={previewStyle}
          data-testid={
            testId ? `${testId satisfies string}-preview` : undefined
          }
        >
          <TermDisplay
            term={parseState.term}
            fontSize={fontSize}
            testId={testId ? `${testId satisfies string}-term` : undefined}
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
    // 防御的マージ: パーサーが重複範囲を生成することは通常ないが、安全のため
    /* v8 ignore start */
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
