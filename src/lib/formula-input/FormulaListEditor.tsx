/**
 * 論理式リスト編集コンポーネント。
 *
 * 各論理式をクリックで編集でき、追加・削除・並び替えが可能。
 * FormulaEditor を各行で利用する。
 *
 * 変更時は FormulaListEditor.test.tsx, FormulaListEditor.stories.tsx, formulaListLogic.ts, index.ts も同期すること。
 */

import type { CSSProperties } from "react";
import { useCallback } from "react";
import { FormulaEditor } from "./FormulaEditor";
import {
  addFormula,
  removeFormula,
  updateFormula,
  moveUp,
  moveDown,
} from "./formulaListLogic";

// --- Props ---

export interface FormulaListEditorProps {
  /** 論理式テキストの配列 */
  readonly formulas: readonly string[];
  /** 配列変更時のコールバック */
  readonly onChange: (formulas: readonly string[]) => void;
  /** 構文ヘルプを開くコールバック */
  readonly onOpenSyntaxHelp?: () => void;
  /** エラーメッセージ（外部バリデーション結果） */
  readonly error?: string;
  /** data-testid プレフィックス */
  readonly testId?: string;
}

// --- Styles ---

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const itemRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const editorWrapperStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const actionButtonStyle: CSSProperties = {
  background: "none",
  border: "1px solid var(--color-border, #ccc)",
  borderRadius: 4,
  cursor: "pointer",
  padding: "2px 6px",
  fontSize: 12,
  color: "var(--color-text-secondary, #666)",
  lineHeight: 1,
  transition: "background 0.15s, color 0.15s",
};

const actionButtonDisabledStyle: CSSProperties = {
  ...actionButtonStyle,
  opacity: 0.3,
  cursor: "default",
};

const removeButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  color: "var(--color-error-text, #991b1b)",
  borderColor: "var(--color-error, #d32f2f)",
};

const addButtonStyle: CSSProperties = {
  background: "none",
  border: "1px dashed var(--color-border, #ccc)",
  borderRadius: 4,
  cursor: "pointer",
  padding: "6px 12px",
  fontSize: 12,
  color: "var(--color-text-secondary, #666)",
  transition: "background 0.15s, color 0.15s",
};

const errorTextStyle: CSSProperties = {
  fontSize: 10,
  color: "var(--color-error-text, #991b1b)",
};

const emptyTextStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--color-text-secondary, #666)",
  fontStyle: "italic",
  padding: "4px 0",
};

// --- Component ---

export function FormulaListEditor({
  formulas,
  onChange,
  onOpenSyntaxHelp,
  error,
  testId = "formula-list",
}: FormulaListEditorProps): React.JSX.Element {
  const handleAdd = useCallback(() => {
    onChange(addFormula(formulas));
  }, [formulas, onChange]);

  const handleRemove = useCallback(
    (index: number) => {
      onChange(removeFormula(formulas, index));
    },
    [formulas, onChange],
  );

  const handleUpdate = useCallback(
    (index: number, value: string) => {
      onChange(updateFormula(formulas, index, value));
    },
    [formulas, onChange],
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      onChange(moveUp(formulas, index));
    },
    [formulas, onChange],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      onChange(moveDown(formulas, index));
    },
    [formulas, onChange],
  );

  return (
    <div style={containerStyle} data-testid={testId}>
      {formulas.length === 0 && (
        <div style={emptyTextStyle}>式を追加してください</div>
      )}
      {formulas.map((formula, index) => (
        <div
          key={`formula-${String(index) satisfies string}`}
          style={itemRowStyle}
          data-testid={`${testId satisfies string}-item-${String(index) satisfies string}`}
        >
          <div style={editorWrapperStyle}>
            <FormulaEditor
              value={formula}
              onChange={(value) => {
                handleUpdate(index, value);
              }}
              placeholder="論理式を入力..."
              fontSize={12}
              onOpenSyntaxHelp={onOpenSyntaxHelp}
              testId={`${testId satisfies string}-editor-${String(index) satisfies string}`}
            />
          </div>
          <button
            type="button"
            style={index > 0 ? actionButtonStyle : actionButtonDisabledStyle}
            onClick={() => {
              handleMoveUp(index);
            }}
            disabled={index === 0}
            title="上に移動"
            data-testid={`${testId satisfies string}-up-${String(index) satisfies string}`}
          >
            ↑
          </button>
          <button
            type="button"
            style={
              index < formulas.length - 1
                ? actionButtonStyle
                : actionButtonDisabledStyle
            }
            onClick={() => {
              handleMoveDown(index);
            }}
            disabled={index === formulas.length - 1}
            title="下に移動"
            data-testid={`${testId satisfies string}-down-${String(index) satisfies string}`}
          >
            ↓
          </button>
          <button
            type="button"
            style={removeButtonStyle}
            onClick={() => {
              handleRemove(index);
            }}
            title="削除"
            data-testid={`${testId satisfies string}-remove-${String(index) satisfies string}`}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        style={addButtonStyle}
        onClick={handleAdd}
        data-testid={`${testId satisfies string}-add`}
      >
        + 式を追加
      </button>
      {error !== undefined && (
        <span
          style={errorTextStyle}
          data-testid={`${testId satisfies string}-error`}
        >
          {error}
        </span>
      )}
    </div>
  );
}
