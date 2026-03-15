/**
 * 項の編集/表示モード切替コンポーネント。
 *
 * 項を美しいレンダリングで表示しつつ、クリックで編集モードに切り替える。
 * パースエラー時は編集モードに留まる。
 * FormulaEditor の Term 版。
 *
 * 変更時は TermEditor.test.tsx, TermEditor.stories.tsx, editorLogic.ts, index.ts も同期すること。
 */

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Term } from "../logic-core/term";
import { formatTerm } from "../logic-lang/formatUnicode";
import { TermDisplay } from "./TermDisplay";
import { computeTermParseState, TermInput } from "./TermInput";
import { TermKaTeX } from "./TermKaTeX";
import type { DisplayRenderer, EditTrigger, EditorMode } from "./editorLogic";
import { computeExitAction } from "./editorLogic";

// --- Props ---

export interface TermEditorProps {
  /** 現在の入力テキスト */
  readonly value: string;
  /** テキスト変更時のコールバック */
  readonly onChange: (value: string) => void;
  /** パース成功時にTerm ASTを通知するコールバック */
  readonly onParsed?: (term: Term) => void;
  /** モード変更時のコールバック */
  readonly onModeChange?: (mode: EditorMode) => void;
  /** 表示レンダラーの種類 */
  readonly displayRenderer?: DisplayRenderer;
  /** プレースホルダーテキスト（空の場合の表示モード表示と入力欄） */
  readonly placeholder?: string;
  /** フォントサイズ (CSS値) */
  readonly fontSize?: CSSProperties["fontSize"];
  /** 追加の className */
  readonly className?: string;
  /** 追加のスタイル（コンテナ） */
  readonly style?: CSSProperties;
  /** 編集モードに入るトリガー（デフォルト: "click"） */
  readonly editTrigger?: EditTrigger;
  /** 構文ヘルプを開くコールバック（指定時に編集モードで?ボタンを表示） */
  readonly onOpenSyntaxHelp?: () => void;
  /** 外部から編集モードを強制的に開始するフラグ */
  readonly forceEditMode?: boolean;
  /** data-testid */
  readonly testId?: string;
}

// --- スタイル ---

const containerBaseStyle: CSSProperties = {
  position: "relative",
  minHeight: 32,
  cursor: "text",
};

const displayContainerStyle: CSSProperties = {
  padding: "6px 8px",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "transparent",
  borderRadius: 4,
  minHeight: 24,
  cursor: "text",
  transition: "opacity 0.15s ease-in-out",
};

const displayContainerHoverStyle: CSSProperties = {
  ...displayContainerStyle,
  borderColor: "currentColor",
  borderStyle: "dashed",
  opacity: 0.8,
};

/* v8 ignore start -- style constant */
const placeholderStyle: CSSProperties = {
  color: "#a0aec0",
  fontStyle: "italic",
};
/* v8 ignore stop */

const editContainerStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 4,
  transition: "opacity 0.15s ease-in-out",
};

const syntaxHelpButtonStyle: CSSProperties = {
  flexShrink: 0,
  width: 18,
  height: 18,
  borderRadius: "50%",
  border: "1px solid currentColor",
  backgroundColor: "transparent",
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

// --- コンポーネント ---

export function TermEditor({
  value,
  onChange,
  onParsed,
  onModeChange,
  displayRenderer = "unicode",
  placeholder = "クリックして項を入力...",
  fontSize,
  className,
  style,
  editTrigger = "click",
  onOpenSyntaxHelp,
  forceEditMode,
  testId,
}: TermEditorProps) {
  const [mode, setModeInternal] = useState<EditorMode>("display");

  const setMode = useCallback(
    (nextMode: EditorMode) => {
      setModeInternal(nextMode);
      onModeChange?.(nextMode);
    },
    [onModeChange],
  );
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // パース状態を計算（表示モードでのTerm取得と、editモード離脱判定の両方に使う）
  const parseState = useMemo(() => computeTermParseState(value), [value]);

  // 現在のTerm AST（パース成功時のみ）
  const term: Term | null =
    parseState.status === "success" ? parseState.term : null;

  // --- イベントハンドラ ---

  const enterEditMode = useCallback(() => {
    setMode("editing");
  }, [setMode]);

  // 外部から編集モードを強制開始
  useEffect(() => {
    if (forceEditMode && mode !== "editing") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot event-driven transition
      enterEditMode();
    }
  }, [forceEditMode, mode, enterEditMode]);

  const tryExitEditMode = useCallback(() => {
    // forceEditMode が有効な場合は編集モードに留まる
    if (forceEditMode) return;
    const currentParseState = computeTermParseState(value);
    const result = computeExitAction(currentParseState);
    if (result !== null) {
      setMode(result);
    }
    // パースエラーの場合は何もしない（編集モードに留まる）
  }, [value, setMode, forceEditMode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        tryExitEditMode();
      }
    },
    [tryExitEditMode],
  );

  const handleDisplayClick = useCallback(() => {
    enterEditMode();
  }, [enterEditMode]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (mode === "editing") {
        e.stopPropagation();
      }
    },
    [mode],
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

  const handleDisplayKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        enterEditMode();
      }
    },
    [enterEditMode],
  );

  // 編集モードに入ったらinputにフォーカス
  useEffect(() => {
    if (mode === "editing") {
      const input = containerRef.current?.querySelector("input");
      /* v8 ignore start */
      if (!input) return;
      /* v8 ignore stop */
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, [mode]);

  const mergedContainerStyle: CSSProperties = useMemo(
    () => ({
      ...containerBaseStyle,
      ...style,
      ...(fontSize !== undefined ? { fontSize } : {}),
      ...(editTrigger === "none" ? { cursor: "default" } : {}),
    }),
    [style, fontSize, editTrigger],
  );

  // Unicode表示テキスト（表示モード用）
  const displayText = useMemo(
    () =>
      /* v8 ignore start -- term is typically always provided */
      term ? formatTerm(term) : null,
    /* v8 ignore stop */
    [term],
  );

  return (
    <div
      ref={containerRef}
      className={className}
      style={mergedContainerStyle}
      data-testid={testId}
      onKeyDown={mode === "editing" ? handleKeyDown : undefined}
      onPointerDown={handlePointerDown}
    >
      {mode === "display" ? (
        <div
          role="button"
          tabIndex={0}
          onClick={editTrigger === "click" ? handleDisplayClick : undefined}
          onDoubleClick={
            editTrigger === "dblclick" ? handleDisplayClick : undefined
          }
          onKeyDown={editTrigger !== "none" ? handleDisplayKeyDown : undefined}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={isHovered ? displayContainerHoverStyle : displayContainerStyle}
          data-testid={
            testId ? `${testId satisfies string}-display` : undefined
          }
          aria-label={
            displayText
              ? `${displayText satisfies string} - ${(editTrigger === "dblclick" ? "ダブルクリックして編集" : "クリックして編集") satisfies string}`
              : `${(editTrigger === "dblclick" ? "ダブルクリックして項を入力" : "クリックして項を入力") satisfies string}`
          }
        >
          {term ? (
            displayRenderer === "katex" ? (
              <TermKaTeX
                term={term}
                fontSize={fontSize}
                testId={testId ? `${testId satisfies string}-katex` : undefined}
              />
            ) : (
              <TermDisplay
                term={term}
                fontSize={fontSize}
                testId={
                  testId ? `${testId satisfies string}-unicode` : undefined
                }
              />
            )
          ) : (
            <span
              style={placeholderStyle}
              data-testid={
                testId ? `${testId satisfies string}-placeholder` : undefined
              }
            >
              {placeholder}
            </span>
          )}
        </div>
      ) : (
        <div
          style={editContainerStyle}
          data-testid={testId ? `${testId satisfies string}-edit` : undefined}
        >
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <TermInput
              value={value}
              onChange={onChange}
              onParsed={onParsed}
              placeholder={placeholder}
              fontSize={fontSize}
              testId={testId ? `${testId satisfies string}-input` : undefined}
              onBlur={tryExitEditMode}
              showPreview={false}
            />
          </div>
          {onOpenSyntaxHelp !== undefined && (
            <button
              type="button"
              style={syntaxHelpButtonStyle}
              onMouseDown={handleSyntaxHelpMouseDown}
              onClick={handleSyntaxHelpClick}
              aria-label="構文ヘルプ"
              data-testid={
                testId ? `${testId satisfies string}-syntax-help` : undefined
              }
            >
              ?
            </button>
          )}
        </div>
      )}
    </div>
  );
}
