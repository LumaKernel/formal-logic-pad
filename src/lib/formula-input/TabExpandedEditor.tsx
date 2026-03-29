/**
 * タブロー拡大編集モーダルコンポーネント。
 *
 * 論理式のリストを FormulaListEditor で編集し、
 * カンマ区切りテキストを生成する。
 * BaseExpandedEditor を使い、モーダルシェル（オーバーレイ、ヘッダー、クローズ）を委譲する。
 *
 * 変更時は TabExpandedEditor.stories.tsx, index.ts も同期すること。
 */

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BaseExpandedEditor } from "./BaseExpandedEditor";
import { FormulaListEditor } from "./FormulaListEditor";
import { FormulaDisplay } from "./FormulaDisplay";
import { parseString } from "../logic-lang/parser";
import { Either } from "effect";
import { previewSectionStyle, previewLabelStyle } from "./expandedEditorStyles";

// --- Props ---

export interface TabExpandedEditorProps {
  /** 現在のカンマ区切り論理式テキスト */
  readonly value: string;
  /** テキスト変更時のコールバック */
  readonly onChange: (value: string) => void;
  /** 閉じるコールバック */
  readonly onClose: () => void;
  /** 構文ヘルプを開くコールバック */
  readonly onOpenSyntaxHelp?: () => void;
  /**
   * 論理式テキスト配列の初期値（指定時は value の再パースをスキップ）。
   * WorkspaceNode.formulaTexts から渡す。
   */
  readonly initialFormulas?: readonly string[];
  /** data-testid */
  readonly testId?: string;
}

// --- Styles ---

const sectionLabelStyle: CSSProperties = {
  fontSize: "var(--font-size-sm, 12px)",
  fontWeight: 600,
  color: "var(--color-text-secondary, #666666)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 8,
};

const previewFormulaContainerStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "4px 8px",
  alignItems: "baseline",
  fontFamily: "var(--font-formula)",
  fontStyle: "italic",
};

const previewCommaStyle: CSSProperties = {
  fontStyle: "normal",
  color: "var(--color-text-secondary, #666)",
};

const previewFallbackStyle: CSSProperties = {
  fontFamily: "var(--font-formula)",
  fontStyle: "italic",
  color: "var(--color-text-tertiary, #767676)",
};

// --- Helper ---

function splitFormulaList(text: string): readonly string[] {
  if (text.trim() === "") return [];
  return text.split(",").map((s) => s.trim()).filter((s) => s !== "");
}

function composeFormulaList(formulas: readonly string[]): string {
  return formulas.filter((s) => s.trim() !== "").join(", ");
}

// --- Component ---

export function TabExpandedEditor({
  value,
  onChange,
  onClose,
  onOpenSyntaxHelp,
  initialFormulas,
  testId,
}: TabExpandedEditorProps) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // 初期化時に論理式テキストを分割（初回のみ）
  // initialFormulas が指定されていればパースをスキップ
  const [formulas, setFormulas] = useState<readonly string[]>(() => {
    if (initialFormulas !== undefined) {
      return initialFormulas.length > 0 ? initialFormulas : [""];
    }
    const parts = splitFormulaList(value);
    return parts.length > 0 ? parts : [""];
  });

  // 論理式リストの変更をカンマ区切りテキストに反映
  useEffect(() => {
    const composed = composeFormulaList(formulas);
    onChangeRef.current(composed);
  }, [formulas]);

  const handleFormulasChange = useCallback(
    (newFormulas: readonly string[]) => {
      setFormulas(newFormulas);
    },
    [],
  );

  return (
    <BaseExpandedEditor
      title="論理式リストエディタ"
      ariaLabel="論理式リストエディタ"
      onClose={onClose}
      onOpenSyntaxHelp={onOpenSyntaxHelp}
      testId={testId}
      bodyGap={16}
    >
      {/* 論理式リスト */}
      <div>
        <div
          style={sectionLabelStyle}
          data-testid={
            testId ? `${testId satisfies string}-formulas-label` : undefined
          }
        >
          論理式
        </div>
        <FormulaListEditor
          formulas={formulas}
          onChange={handleFormulasChange}
          onOpenSyntaxHelp={onOpenSyntaxHelp}
          testId={testId ? `${testId satisfies string}-formulas` : undefined}
        />
      </div>

      {/* プレビュー */}
      <div
        style={previewSectionStyle}
        data-testid={testId ? `${testId satisfies string}-preview` : undefined}
      >
        <div style={previewLabelStyle}>プレビュー</div>
        <div
          style={previewFormulaContainerStyle}
          data-testid={
            testId
              ? `${testId satisfies string}-preview-formulas`
              : undefined
          }
        >
          {formulas
            .filter((s) => s.trim() !== "")
            .map((text, i) => {
              const parsed = parseString(text.trim());
              return (
                <span
                  key={i}
                  style={{ display: "inline-flex", alignItems: "baseline" }}
                >
                  {i > 0 ? (
                    <span style={previewCommaStyle}>,&nbsp;</span>
                  ) : null}
                  {Either.isRight(parsed) ? (
                    <FormulaDisplay
                      formula={parsed.right}
                      fontSize={14}
                      testId={
                        testId
                          ? `${testId satisfies string}-preview-formula-${String(i) satisfies string}`
                          : undefined
                      }
                    />
                  ) : (
                    <span
                      style={previewFallbackStyle}
                      data-testid={
                        testId
                          ? `${testId satisfies string}-preview-formula-${String(i) satisfies string}`
                          : undefined
                      }
                    >
                      {text.trim()}
                    </span>
                  )}
                </span>
              );
            })}
          {formulas.filter((s) => s.trim() !== "").length === 0 ? (
            <span style={previewFallbackStyle}>（空）</span>
          ) : null}
        </div>
      </div>
    </BaseExpandedEditor>
  );
}
