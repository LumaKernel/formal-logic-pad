/**
 * 編集可能な証明ノードコンポーネント。
 *
 * FormulaEditor を使って、公理ノードなどの論理式を編集可能にする。
 * ノード種別に応じた色分け・ラベル・ポートを表示する。
 *
 * 変更時は EditableProofNode.test.tsx, EditableProofNode.stories.tsx, proofNodeUI.ts, index.ts も同期すること。
 */

import type { CSSProperties } from "react";
import { useCallback, useMemo } from "react";
import type { Formula } from "../logic-core/formula";
import type { EditorMode } from "../formula-input/editorLogic";
import { FormulaEditor } from "../formula-input/FormulaEditor";
import type { ProofNodeKind } from "./proofNodeUI";
import { getProofNodeStyle } from "./proofNodeUI";

// --- Props ---

export interface EditableProofNodeProps {
  /** ノードの一意識別子 */
  readonly id: string;
  /** ノードの種類 */
  readonly kind: ProofNodeKind;
  /** ノードのラベル（例: "A1", "A2", "MP"） */
  readonly label: string;
  /** 論理式のテキスト（DSL形式） */
  readonly formulaText: string;
  /** テキスト変更時のコールバック */
  readonly onFormulaTextChange: (id: string, text: string) => void;
  /** パース成功時にFormula ASTを通知するコールバック */
  readonly onFormulaParsed?: (id: string, formula: Formula) => void;
  /** 編集モード変更時のコールバック */
  readonly onModeChange?: (id: string, mode: EditorMode) => void;
  /** 編集を許可するか（デフォルト: true） */
  readonly editable?: boolean;
  /** data-testid */
  readonly testId?: string;
}

// --- スタイル ---

const labelStyle: CSSProperties = {
  fontSize: 10,
  fontFamily: "sans-serif",
  fontWeight: 700,
  opacity: 0.8,
  marginBottom: 2,
  letterSpacing: 1,
  textTransform: "uppercase",
};

const formulaContainerReadonlyStyle: CSSProperties = {
  fontFamily: "serif, 'Times New Roman', Times",
  fontStyle: "italic",
  whiteSpace: "nowrap",
  fontSize: 13,
};

// --- コンポーネント ---

export function EditableProofNode({
  id,
  kind,
  label,
  formulaText,
  onFormulaTextChange,
  onFormulaParsed,
  onModeChange,
  editable = true,
  testId,
}: EditableProofNodeProps) {
  const nodeStyle = useMemo(() => getProofNodeStyle(kind), [kind]);

  const containerStyle: CSSProperties = useMemo(
    () => ({
      padding: "8px 12px",
      background: nodeStyle.backgroundColor,
      color: nodeStyle.textColor,
      borderRadius: nodeStyle.borderRadius,
      fontFamily: "serif, 'Times New Roman', Times",
      fontSize: 13,
      boxShadow: nodeStyle.boxShadow,
      minWidth: 80,
      textAlign: "center" as const,
      border: nodeStyle.border,
    }),
    [nodeStyle],
  );

  const handleFormulaChange = useCallback(
    (text: string) => {
      onFormulaTextChange(id, text);
    },
    [id, onFormulaTextChange],
  );

  const handleFormulaParsed = useCallback(
    (formula: Formula) => {
      onFormulaParsed?.(id, formula);
    },
    [id, onFormulaParsed],
  );

  const handleModeChange = useCallback(
    (mode: EditorMode) => {
      onModeChange?.(id, mode);
    },
    [id, onModeChange],
  );

  return (
    <div data-testid={testId} style={containerStyle}>
      <div style={labelStyle}>{label}</div>
      {editable ? (
        <FormulaEditor
          value={formulaText}
          onChange={handleFormulaChange}
          onParsed={handleFormulaParsed}
          onModeChange={handleModeChange}
          displayRenderer="unicode"
          placeholder="Click to edit formula..."
          testId={testId ? `${testId satisfies string}-editor` : undefined}
          style={{
            color: nodeStyle.textColor,
            minHeight: 20,
          }}
        />
      ) : (
        <div
          style={formulaContainerReadonlyStyle}
          data-testid={
            testId ? `${testId satisfies string}-formula` : undefined
          }
        >
          {formulaText}
        </div>
      )}
    </div>
  );
}
