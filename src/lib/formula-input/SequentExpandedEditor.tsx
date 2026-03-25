/**
 * シーケント拡大編集モーダルコンポーネント。
 *
 * 前件（Γ）と後件（Δ）をそれぞれ FormulaListEditor で編集し、
 * "Γ ⇒ Δ" 形式のシーケントテキストを生成する。
 *
 * 変更時は SequentExpandedEditor.stories.tsx, sequentEditorLogic.ts, index.ts も同期すること。
 */

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FormulaListEditor } from "./FormulaListEditor";
import { SequentPreview } from "./SequentPreview";
import { splitSequentToLists, composeSequentText } from "./sequentEditorLogic";

// --- Props ---

export interface SequentExpandedEditorProps {
  /** 現在のシーケントテキスト（"Γ ⇒ Δ" 形式） */
  readonly value: string;
  /** テキスト変更時のコールバック */
  readonly onChange: (value: string) => void;
  /** 閉じるコールバック */
  readonly onClose: () => void;
  /** 構文ヘルプを開くコールバック */
  readonly onOpenSyntaxHelp?: () => void;
  /** data-testid */
  readonly testId?: string;
}

// --- Styles ---

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
  gap: 16,
};

const sectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const sectionLabelStyle: CSSProperties = {
  fontSize: "var(--font-size-sm, 12px)",
  fontWeight: 600,
  color: "var(--color-text-secondary, #666666)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const turnstileSeparatorStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 24,
  fontWeight: 700,
  color: "var(--color-text-secondary, #666666)",
  padding: "4px 0",
};

const previewSectionStyle: CSSProperties = {
  padding: "12px",
  backgroundColor: "var(--color-bg-secondary, #f7fafc)",
  borderRadius: 8,
  minHeight: 32,
};

const previewLabelStyle: CSSProperties = {
  fontSize: "var(--font-size-xs, 11px)",
  color: "var(--color-text-tertiary, #767676)",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

// --- Component ---

export function SequentExpandedEditor({
  value,
  onChange,
  onClose,
  onOpenSyntaxHelp,
  testId,
}: SequentExpandedEditorProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // onChange を ref で保持（useEffect の依存から外し無限ループ防止）
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // 初期化時にシーケントテキストを分割（初回のみ）
  const [antecedents, setAntecedents] = useState<readonly string[]>(() => {
    const parts = splitSequentToLists(value);
    return parts.antecedents.length > 0 ? parts.antecedents : [""];
  });
  const [succedents, setSuccedents] = useState<readonly string[]>(() => {
    const parts = splitSequentToLists(value);
    return parts.succedents.length > 0 ? parts.succedents : [""];
  });

  // 前件・後件の変更をシーケントテキストに反映
  useEffect(() => {
    const composed = composeSequentText({
      antecedents,
      succedents,
    });
    onChangeRef.current(composed);
  }, [antecedents, succedents]);

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

  // --- 前件操作 ---
  const handleAntecedentChange = useCallback((formulas: readonly string[]) => {
    setAntecedents(formulas);
  }, []);

  // --- 後件操作 ---
  const handleSuccedentChange = useCallback((formulas: readonly string[]) => {
    setSuccedents(formulas);
  }, []);

  return createPortal(
    <div
      style={overlayStyle}
      onClick={handleOverlayClick}
      data-testid={testId}
      role="dialog"
      aria-modal="true"
      aria-label="シーケントエディタ"
    >
      <div ref={modalRef} style={modalStyle}>
        {/* ヘッダー */}
        <div style={headerStyle}>
          <h2 style={headerTitleStyle}>シーケントエディタ</h2>
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
          {/* 前件 (Γ) */}
          <div style={sectionStyle}>
            <div
              style={sectionLabelStyle}
              data-testid={
                testId
                  ? `${testId satisfies string}-antecedent-label`
                  : undefined
              }
            >
              前件 (Γ)
            </div>
            <FormulaListEditor
              formulas={antecedents}
              onChange={handleAntecedentChange}
              onOpenSyntaxHelp={onOpenSyntaxHelp}
              testId={
                testId ? `${testId satisfies string}-antecedents` : undefined
              }
            />
          </div>

          {/* ⇒ セパレータ */}
          <div
            style={turnstileSeparatorStyle}
            data-testid={
              testId ? `${testId satisfies string}-turnstile` : undefined
            }
          >
            ⇒
          </div>

          {/* 後件 (Δ) */}
          <div style={sectionStyle}>
            <div
              style={sectionLabelStyle}
              data-testid={
                testId
                  ? `${testId satisfies string}-succedent-label`
                  : undefined
              }
            >
              後件 (Δ)
            </div>
            <FormulaListEditor
              formulas={succedents}
              onChange={handleSuccedentChange}
              onOpenSyntaxHelp={onOpenSyntaxHelp}
              testId={
                testId ? `${testId satisfies string}-succedents` : undefined
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
            <SequentPreview
              antecedents={antecedents}
              succedents={succedents}
              testId={
                testId
                  ? `${testId satisfies string}-preview-sequent`
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
