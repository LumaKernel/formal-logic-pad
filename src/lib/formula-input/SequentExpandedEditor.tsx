/**
 * シーケント拡大編集モーダルコンポーネント。
 *
 * 前件（Γ）と後件（Δ）をそれぞれ FormulaListEditor で編集し、
 * "Γ ⇒ Δ" 形式のシーケントテキストを生成する。
 * BaseExpandedEditor を使い、モーダルシェル（オーバーレイ、ヘッダー、クローズ）を委譲する。
 *
 * 変更時は SequentExpandedEditor.stories.tsx, sequentEditorLogic.ts, index.ts も同期すること。
 */

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BaseExpandedEditor } from "./BaseExpandedEditor";
import { FormulaListEditor } from "./FormulaListEditor";
import { SequentPreview } from "./SequentPreview";
import { splitSequentToLists, composeSequentText } from "./sequentEditorLogic";
import { previewSectionStyle, previewLabelStyle } from "./expandedEditorStyles";

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
  /**
   * 前件テキスト配列の初期値（指定時は value の再パースをスキップ）。
   * WorkspaceNode.sequentTexts.antecedentTexts から渡す。
   */
  readonly initialAntecedents?: readonly string[];
  /**
   * ���件テキスト配列の初期値��指定時は value の再パースをスキップ）。
   * WorkspaceNode.sequentTexts.succedentTexts から渡す���
   */
  readonly initialSuccedents?: readonly string[];
  /** data-testid */
  readonly testId?: string;
}

// --- Sequent-specific Styles ---

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

// --- Component ---

export function SequentExpandedEditor({
  value,
  onChange,
  onClose,
  onOpenSyntaxHelp,
  initialAntecedents,
  initialSuccedents,
  testId,
}: SequentExpandedEditorProps) {
  // onChange を ref で保持（useEffect の依存から外し無限ループ防止）
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // 初期化時にシーケントテキストを分割（初回のみ）
  // initialAntecedents/initialSuccedents が指定されていればパースをスキップ
  const [antecedents, setAntecedents] = useState<readonly string[]>(() => {
    if (initialAntecedents !== undefined) {
      return initialAntecedents.length > 0 ? initialAntecedents : [""];
    }
    const parts = splitSequentToLists(value);
    return parts.antecedents.length > 0 ? parts.antecedents : [""];
  });
  const [succedents, setSuccedents] = useState<readonly string[]>(() => {
    if (initialSuccedents !== undefined) {
      return initialSuccedents.length > 0 ? initialSuccedents : [""];
    }
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

  // --- 前件操作 ---
  const handleAntecedentChange = useCallback((formulas: readonly string[]) => {
    setAntecedents(formulas);
  }, []);

  // --- 後件操作 ---
  const handleSuccedentChange = useCallback((formulas: readonly string[]) => {
    setSuccedents(formulas);
  }, []);

  return (
    <BaseExpandedEditor
      title="シーケントエディタ"
      ariaLabel="シーケントエディタ"
      onClose={onClose}
      onOpenSyntaxHelp={onOpenSyntaxHelp}
      testId={testId}
      bodyGap={16}
    >
      {/* 前件 (Γ) */}
      <div style={sectionStyle}>
        <div
          style={sectionLabelStyle}
          data-testid={
            testId ? `${testId satisfies string}-antecedent-label` : undefined
          }
        >
          前件 (Γ)
        </div>
        <FormulaListEditor
          formulas={antecedents}
          onChange={handleAntecedentChange}
          onOpenSyntaxHelp={onOpenSyntaxHelp}
          testId={testId ? `${testId satisfies string}-antecedents` : undefined}
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
            testId ? `${testId satisfies string}-succedent-label` : undefined
          }
        >
          後件 (Δ)
        </div>
        <FormulaListEditor
          formulas={succedents}
          onChange={handleSuccedentChange}
          onOpenSyntaxHelp={onOpenSyntaxHelp}
          testId={testId ? `${testId satisfies string}-succedents` : undefined}
        />
      </div>

      {/* プレビュー */}
      <div
        style={previewSectionStyle}
        data-testid={testId ? `${testId satisfies string}-preview` : undefined}
      >
        <div style={previewLabelStyle}>プレビュー</div>
        <SequentPreview
          antecedents={antecedents}
          succedents={succedents}
          testId={
            testId ? `${testId satisfies string}-preview-sequent` : undefined
          }
        />
      </div>
    </BaseExpandedEditor>
  );
}
