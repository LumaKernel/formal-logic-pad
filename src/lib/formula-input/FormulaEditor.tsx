/**
 * 編集/表示モード切替コンポーネント。
 *
 * 論理式を美しいレンダリングで表示しつつ、クリックで編集モードに切り替える。
 * パースエラー時は編集モードに留まる。
 *
 * 変更時は FormulaEditor.test.tsx, FormulaEditor.stories.tsx, formulaEditor.ts, index.ts も同期すること。
 */

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Formula } from "../logic-core/formula";
import { formatFormula } from "../logic-lang/formatUnicode";
import { FormulaDisplay } from "./FormulaDisplay";
import { computeParseState, FormulaInput } from "./FormulaInput";
import { FormulaKaTeX } from "./FormulaKaTeX";
import type { DisplayRenderer, EditTrigger, EditorMode } from "./editorLogic";
import { computeExitAction } from "./editorLogic";

// --- Props ---

export interface FormulaEditorProps {
  /** 現在の入力テキスト */
  readonly value: string;
  /** テキスト変更時のコールバック */
  readonly onChange: (value: string) => void;
  /** パース成功時にFormula ASTを通知するコールバック */
  readonly onParsed?: (formula: Formula) => void;
  /** モード変更時のコールバック（CanvasItem統合時にドラッグ制御に使用） */
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

// --- コンポーネント ---

export function FormulaEditor({
  value,
  onChange,
  onParsed,
  onModeChange,
  displayRenderer = "unicode",
  placeholder = "クリックして論理式を入力...",
  fontSize,
  className,
  style,
  editTrigger = "click",
  onOpenSyntaxHelp,
  testId,
}: FormulaEditorProps) {
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

  // パース状態を計算（表示モードでのFormula取得と、editモード離脱判定の両方に使う）
  const parseState = useMemo(() => computeParseState(value), [value]);

  // 現在のFormula AST（パース成功時のみ）
  const formula: Formula | null =
    parseState.status === "success" ? parseState.formula : null;

  // --- イベントハンドラ ---

  const enterEditMode = useCallback(() => {
    setMode("editing");
  }, [setMode]);

  const tryExitEditMode = useCallback(() => {
    const currentParseState = computeParseState(value);
    const result = computeExitAction(currentParseState);
    if (result !== null) {
      setMode(result);
    }
    // パースエラーの場合は何もしない（編集モードに留まる）
  }, [value, setMode]);

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

  // CanvasItem内配置時: 編集モード中はPointerCaptureによるドラッグを防止するため
  // pointerDownの伝播を停止する。表示モードでは伝播を許可してドラッグ/クリックが
  // 親（CanvasItem）に伝わるようにする。
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (mode === "editing") {
        e.stopPropagation();
      }
    },
    [mode],
  );

  const handleSyntaxHelpMouseDown = useCallback((e: React.MouseEvent) => {
    // mousedownでpreventDefaultすることでinputのblurを防ぐ
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
      // DOM要素が見つからない場合は何もしない（防御コード）
      /* v8 ignore start */
      if (!input) return;
      /* v8 ignore stop */
      input.focus();
      // カーソルを末尾に
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
    () => (formula ? formatFormula(formula) : null),
    [formula],
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
              : `${(editTrigger === "dblclick" ? "ダブルクリックして論理式を入力" : "クリックして論理式を入力") satisfies string}`
          }
        >
          {formula ? (
            displayRenderer === "katex" ? (
              <FormulaKaTeX
                formula={formula}
                fontSize={fontSize}
                testId={testId ? `${testId satisfies string}-katex` : undefined}
              />
            ) : (
              <FormulaDisplay
                formula={formula}
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
            <FormulaInput
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
