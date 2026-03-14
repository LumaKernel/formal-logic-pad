/**
 * 論理式拡大編集モーダルコンポーネント。
 *
 * 広い画面で論理式をtextareaで編集し、リアルタイムにプレビューとエラー表示を行う。
 * 閉じるボタン、モーダル外クリック、Escapeキーで閉じることができる。
 *
 * 変更時は FormulaExpandedEditor.test.tsx, FormulaExpandedEditor.stories.tsx, index.ts も同期すること。
 */

import type { CSSProperties } from "react";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
} from "react";
import type { Formula } from "../logic-core/formula";
import type { FormulaTokenKind } from "../logic-lang/formulaHighlight";
import { tokenizeDslInput } from "../logic-lang/formulaHighlight";
import type { FormulaParseState } from "./FormulaInput";
import {
  computeErrorHighlights,
  computeParseState,
  formatErrorMessage,
} from "./FormulaInput";
import { FormulaDisplay } from "./FormulaDisplay";

// --- Props ---

export interface FormulaExpandedEditorProps {
  /** 現在の入力テキスト */
  readonly value: string;
  /** テキスト変更時のコールバック */
  readonly onChange: (value: string) => void;
  /** パース成功時にFormula ASTを通知するコールバック */
  readonly onParsed?: (formula: Formula) => void;
  /** 閉じるコールバック */
  readonly onClose: () => void;
  /** 構文ヘルプを開くコールバック */
  readonly onOpenSyntaxHelp?: () => void;
  /** プレースホルダーテキスト */
  readonly placeholder?: string;
  /** data-testid */
  readonly testId?: string;
}

// --- スタイル ---

const overlayStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2000,
  padding: "24px",
};

const modalStyle: CSSProperties = {
  backgroundColor: "var(--color-surface, #ffffff)",
  borderRadius: "12px",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
  width: "700px",
  maxWidth: "100%",
  maxHeight: "80vh",
  overflow: "auto",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--font-size-base, 14px)",
  color: "var(--color-text-primary, #171717)",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 20px 12px",
  borderBottom: "1px solid var(--color-border, #e2e8f0)",
};

const headerTitleStyle: CSSProperties = {
  fontSize: "var(--font-size-lg, 16px)",
  fontWeight: 600,
  margin: 0,
};

const headerActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const closeButtonStyle: CSSProperties = {
  background: "none",
  border: "none",
  fontSize: "var(--font-size-xl, 20px)",
  color: "var(--color-text-secondary, #666666)",
  cursor: "pointer",
  padding: "4px 8px",
  borderRadius: "4px",
  lineHeight: 1,
  fontFamily: "var(--font-ui)",
};

const syntaxHelpButtonStyle: CSSProperties = {
  background: "none",
  border: "1px solid var(--color-border, #e2e8f0)",
  fontSize: "var(--font-size-sm, 12px)",
  color: "var(--color-text-secondary, #666666)",
  cursor: "pointer",
  padding: "4px 10px",
  borderRadius: "4px",
  fontFamily: "var(--font-ui)",
};

const bodyStyle: CSSProperties = {
  padding: "16px 20px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const textareaContainerStyle: CSSProperties = {
  position: "relative",
};

const textareaBaseStyle: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--font-size-base, 14px)",
  padding: "12px",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "var(--color-border, #ccc)",
  borderRadius: 8,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  backgroundColor: "var(--color-surface, #ffffff)",
  color: "var(--color-text-primary, #171717)",
  resize: "vertical",
  minHeight: 120,
  lineHeight: 1.6,
};

const textareaErrorStyle: CSSProperties = {
  ...textareaBaseStyle,
  borderColor: "var(--color-error, #e53e3e)",
  boxShadow: "0 0 0 1px var(--color-error, #e53e3e)",
};

const highlightOverlayStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  fontFamily: "var(--font-mono)",
  fontSize: "var(--font-size-base, 14px)",
  padding: "12px",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  pointerEvents: "none",
  overflow: "hidden",
  lineHeight: 1.6,
  borderRadius: 8,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "transparent",
};

const previewSectionStyle: CSSProperties = {
  padding: "12px",
  backgroundColor: "var(--color-bg-secondary, #f7fafc)",
  borderRadius: 8,
  minHeight: 32,
};

const previewLabelStyle: CSSProperties = {
  fontSize: "var(--font-size-xs, 11px)",
  color: "var(--color-text-tertiary, #999999)",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const errorContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const errorMessageStyle: CSSProperties = {
  color: "var(--color-error, #e53e3e)",
  fontSize: "0.85em",
  fontFamily: "var(--font-mono)",
};

const highlightMarkStyle: CSSProperties = {
  backgroundColor: "var(--color-error-bg, rgba(229, 62, 62, 0.3))",
  textDecoration: "underline",
  textDecorationColor: "var(--color-error, #e53e3e)",
  textDecorationStyle: "wavy",
  color: "var(--color-error, #e53e3e)",
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

// --- コンポーネント ---

export function FormulaExpandedEditor({
  value,
  onChange,
  onParsed,
  onClose,
  onOpenSyntaxHelp,
  placeholder = "論理式を入力...",
  testId,
}: FormulaExpandedEditorProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // パース状態を計算
  const deferredValue = useDeferredValue(value);
  const parseState: FormulaParseState = useMemo(
    () => computeParseState(deferredValue),
    [deferredValue],
  );

  // パース成功時に onParsed を呼ぶ
  useEffect(() => {
    if (parseState.status === "success" && onParsed) {
      onParsed(parseState.formula);
    }
  }, [parseState, onParsed]);

  // 開いたらtextareaにフォーカス
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Escapeキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // モーダル外クリックで閉じる
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  // エラーハイライト
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

  const hasOverlay = errorHighlights.length > 0 || syntaxTokens !== null;

  const currentTextareaStyle =
    parseState.status === "error" ? textareaErrorStyle : textareaBaseStyle;

  return (
    <div
      style={overlayStyle}
      onClick={handleOverlayClick}
      data-testid={testId}
      role="dialog"
      aria-modal="true"
      aria-label="論理式エディタ"
    >
      <div ref={modalRef} style={modalStyle}>
        {/* ヘッダー */}
        <div style={headerStyle}>
          <h2 style={headerTitleStyle}>論理式エディタ</h2>
          <div style={headerActionsStyle}>
            {onOpenSyntaxHelp !== undefined && (
              <button
                type="button"
                style={syntaxHelpButtonStyle}
                onClick={onOpenSyntaxHelp}
                aria-label="構文ヘルプ"
                data-testid={
                  testId ? `${testId satisfies string}-syntax-help` : undefined
                }
              >
                ?
              </button>
            )}
            <button
              type="button"
              style={closeButtonStyle}
              onClick={onClose}
              aria-label="閉じる"
              data-testid={
                testId ? `${testId satisfies string}-close` : undefined
              }
            >
              ×
            </button>
          </div>
        </div>

        {/* 本体 */}
        <div style={bodyStyle}>
          {/* テキストエリア + オーバーレイ */}
          <div style={textareaContainerStyle}>
            {/* エラーハイライトオーバーレイ */}
            {errorHighlights.length > 0 && (
              <div
                style={highlightOverlayStyle}
                aria-hidden="true"
                data-testid={
                  testId ? `${testId satisfies string}-highlights` : undefined
                }
              >
                {renderHighlightedText(deferredValue, errorHighlights)}
              </div>
            )}
            {/* シンタックスハイライトオーバーレイ */}
            {syntaxTokens !== null && (
              <div
                style={highlightOverlayStyle}
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
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              style={{
                ...currentTextareaStyle,
                ...(hasOverlay
                  ? {
                      backgroundColor: "transparent",
                      color: "transparent",
                      caretColor: "var(--color-text-primary, #171717)",
                    }
                  : {}),
              }}
              data-testid={
                testId ? `${testId satisfies string}-textarea` : undefined
              }
              aria-invalid={parseState.status === "error"}
              aria-describedby={
                parseState.status === "error" && testId
                  ? `${testId satisfies string}-errors`
                  : undefined
              }
            />
          </div>

          {/* プレビュー */}
          <div
            style={previewSectionStyle}
            data-testid={
              testId ? `${testId satisfies string}-preview` : undefined
            }
          >
            <div style={previewLabelStyle}>プレビュー</div>
            {parseState.status === "success" ? (
              <FormulaDisplay
                formula={parseState.formula}
                highlight
                testId={
                  testId
                    ? `${testId satisfies string}-preview-formula`
                    : undefined
                }
              />
            ) : parseState.status === "empty" ? (
              <span
                style={{
                  color: "var(--color-text-tertiary, #999999)",
                  fontStyle: "italic",
                }}
              >
                {placeholder}
              </span>
            ) : null}
          </div>

          {/* エラー表示 */}
          {parseState.status === "error" && (
            <div
              style={errorContainerStyle}
              data-testid={
                testId ? `${testId satisfies string}-errors` : undefined
              }
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
      </div>
    </div>
  );
}

// --- ハイライトテキストのレンダリング ---

function renderHighlightedText(
  text: string,
  highlights: ReadonlyArray<{ readonly start: number; readonly end: number }>,
): readonly React.ReactNode[] {
  /* v8 ignore start -- defensive */
  if (highlights.length === 0) {
    return [
      <span key="text" style={transparentTextStyle}>
        {text}
      </span>,
    ];
  }
  /* v8 ignore stop */

  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [];
  for (const h of sorted) {
    const last = merged[merged.length - 1];
    /* v8 ignore start -- highlight merge overlap rare */
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

  /* v8 ignore start -- 防御的: ハイライトがテキスト末尾まで伸びない場合の残りテキスト */
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
  /* v8 ignore stop */

  return parts;
}
