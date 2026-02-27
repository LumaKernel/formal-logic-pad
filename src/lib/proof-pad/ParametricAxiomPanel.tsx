/**
 * パラメトリック公理（A4/A5）のパラメータ入力パネル。
 *
 * A4/A5のスキーマインスタンスを生成するためのフォームUI。
 * 入力値に応じてリアルタイムにプレビューとバリデーションを表示する。
 *
 * 変更時は ParametricAxiomPanel.test.tsx, ProofWorkspace.tsx も同期すること。
 */

import { type CSSProperties, useCallback, useMemo, useState } from "react";
import {
  generateA4Instance,
  generateA5Instance,
  validateUniversalFormula,
  validateA5Antecedent,
  getA4ErrorMessage,
  getA5ErrorMessage,
  type A4InstanceResult,
  type A5InstanceResult,
} from "./parametricAxiomLogic";

// --- Props ---

export type ParametricAxiomPanelProps = {
  /** 対象公理ID ("A4" | "A5") */
  readonly axiomId: "A4" | "A5";
  /** 確定時のコールバック（生成されたDSLテキストとメタ変数名を受け取る） */
  readonly onConfirm: (params: {
    readonly dslText: string;
    readonly axiomDisplayName: string;
    readonly termMetaVariableName?: string;
  }) => void;
  /** キャンセル時のコールバック */
  readonly onCancel: () => void;
  /** data-testid */
  readonly testId?: string;
};

// --- Styles ---

const panelStyle: CSSProperties = {
  position: "absolute",
  top: 48,
  left: 12,
  zIndex: 11,
  background: "var(--color-panel-bg, rgba(252, 249, 243, 0.98))",
  borderRadius: 8,
  border: "1px solid var(--color-panel-border, rgba(180, 160, 130, 0.3))",
  boxShadow: "0 4px 20px var(--color-panel-shadow, rgba(120, 100, 70, 0.15))",
  padding: "12px 16px",
  fontFamily: "var(--font-ui)",
  fontSize: 12,
  minWidth: 320,
  maxWidth: 420,
  pointerEvents: "auto" as const,
};

const headerStyle: CSSProperties = {
  fontWeight: 700,
  fontSize: 13,
  color: "var(--color-text-primary, #333)",
  marginBottom: 12,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const labelStyle: CSSProperties = {
  display: "block",
  fontWeight: 600,
  fontSize: 11,
  color: "var(--color-text-secondary, #666)",
  marginBottom: 4,
  marginTop: 8,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid var(--color-panel-border, rgba(180, 160, 130, 0.3))",
  borderRadius: 4,
  fontFamily: "var(--font-formula, monospace)",
  fontSize: 12,
  outline: "none",
  background: "var(--color-input-bg, #fff)",
  color: "var(--color-text-primary, #333)",
  boxSizing: "border-box" as const,
};

const errorStyle: CSSProperties = {
  color: "var(--color-error, #c0392b)",
  fontSize: 10,
  marginTop: 2,
};

const previewLabelStyle: CSSProperties = {
  ...labelStyle,
  marginTop: 12,
};

const previewStyle: CSSProperties = {
  padding: "8px",
  background: "var(--color-preview-bg, rgba(230, 225, 215, 0.5))",
  borderRadius: 4,
  fontFamily: "var(--font-formula, monospace)",
  fontSize: 11,
  color: "var(--color-text-primary, #333)",
  wordBreak: "break-all" as const,
  minHeight: 24,
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 12,
  justifyContent: "flex-end",
};

const buttonBaseStyle: CSSProperties = {
  padding: "6px 16px",
  borderRadius: 4,
  fontFamily: "var(--font-ui)",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  border: "1px solid var(--color-panel-border, rgba(180, 160, 130, 0.3))",
};

const confirmButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  background: "var(--color-proof-complete-bg, #f0e6d0)",
  color: "var(--color-proof-complete-text, #6b4c1e)",
};

const confirmButtonDisabledStyle: CSSProperties = {
  ...confirmButtonStyle,
  opacity: 0.5,
  cursor: "not-allowed",
};

const cancelButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  background: "transparent",
  color: "var(--color-text-secondary, #666)",
};

// --- A4 Panel ---

function A4Panel({
  onConfirm,
  onCancel,
  testId,
}: {
  readonly onConfirm: ParametricAxiomPanelProps["onConfirm"];
  readonly onCancel: () => void;
  readonly testId?: string;
}) {
  const [universalText, setUniversalText] = useState("");

  const validation = useMemo(
    () => validateUniversalFormula(universalText),
    [universalText],
  );

  const result: A4InstanceResult | undefined = useMemo(() => {
    if (universalText.trim() === "") return undefined;
    return generateA4Instance({ universalFormulaText: universalText });
  }, [universalText]);

  const isValid = result !== undefined && result._tag === "Success";

  const handleConfirm = useCallback(() => {
    if (result === undefined || result._tag !== "Success") return;
    onConfirm({
      dslText: result.dslText,
      axiomDisplayName: "A4 (UI)",
      termMetaVariableName: result.termMetaVariableName,
    });
  }, [result, onConfirm]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && isValid) {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    },
    [isValid, handleConfirm, onCancel],
  );

  return (
    <div
      data-testid={testId}
      style={panelStyle}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
    >
      <div style={headerStyle}>
        <span>A4 (Universal Instantiation)</span>
        <button
          type="button"
          style={cancelButtonStyle}
          onClick={onCancel}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-close`
              : undefined
          }
        >
          ×
        </button>
      </div>

      <label style={labelStyle}>Universal formula (∀x. φ)</label>
      <input
        type="text"
        style={inputStyle}
        value={universalText}
        onChange={(e) => {
          setUniversalText(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder="all x. x + 0 = x"
        data-testid={
          testId !== undefined
            ? `${testId satisfies string}-universal-input`
            : undefined
        }
        autoFocus
      />
      {universalText.trim() !== "" && validation._tag === "ParseError" && (
        <div
          style={errorStyle}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-error`
              : undefined
          }
        >
          Invalid formula syntax
        </div>
      )}
      {universalText.trim() !== "" && validation._tag === "NotUniversal" && (
        <div
          style={errorStyle}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-error`
              : undefined
          }
        >
          Formula must start with ∀ (e.g., all x. ...)
        </div>
      )}

      {validation._tag === "Valid" && (
        <div
          style={{
            fontSize: 10,
            color: "var(--color-text-secondary, #999)",
            marginTop: 2,
          }}
        >
          Bound variable: <strong>{validation.variable}</strong>
        </div>
      )}

      <label style={previewLabelStyle}>Generated instance</label>
      <div
        style={previewStyle}
        data-testid={
          testId !== undefined
            ? `${testId satisfies string}-preview`
            : undefined
        }
      >
        {result === undefined
          ? "—"
          : result._tag === "Success"
            ? result.unicodeDisplay
            : getA4ErrorMessage(result)}
      </div>

      <div style={buttonRowStyle}>
        <button
          type="button"
          style={cancelButtonStyle}
          onClick={onCancel}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-cancel`
              : undefined
          }
        >
          Cancel
        </button>
        <button
          type="button"
          style={isValid ? confirmButtonStyle : confirmButtonDisabledStyle}
          onClick={handleConfirm}
          disabled={!isValid}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-confirm`
              : undefined
          }
        >
          Add Axiom
        </button>
      </div>
    </div>
  );
}

// --- A5 Panel ---

function A5Panel({
  onConfirm,
  onCancel,
  testId,
}: {
  readonly onConfirm: ParametricAxiomPanelProps["onConfirm"];
  readonly onCancel: () => void;
  readonly testId?: string;
}) {
  const [variableName, setVariableName] = useState("");
  const [antecedentText, setAntecedentText] = useState("");
  const [consequentText, setConsequentText] = useState("");

  const antecedentValidation = useMemo(
    () =>
      antecedentText.trim() !== "" && variableName.trim() !== ""
        ? validateA5Antecedent(antecedentText, variableName.trim())
        : undefined,
    [antecedentText, variableName],
  );

  const result: A5InstanceResult | undefined = useMemo(() => {
    if (
      variableName.trim() === "" ||
      antecedentText.trim() === "" ||
      consequentText.trim() === ""
    ) {
      return undefined;
    }
    return generateA5Instance({
      variableName,
      antecedentText,
      consequentText,
    });
  }, [variableName, antecedentText, consequentText]);

  const isValid = result !== undefined && result._tag === "Success";

  const handleConfirm = useCallback(() => {
    if (result === undefined || result._tag !== "Success") return;
    onConfirm({
      dslText: result.dslText,
      axiomDisplayName: "A5 (∀-Dist)",
    });
  }, [result, onConfirm]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && isValid) {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    },
    [isValid, handleConfirm, onCancel],
  );

  return (
    <div
      data-testid={testId}
      style={panelStyle}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
    >
      <div style={headerStyle}>
        <span>A5 (Universal Distribution)</span>
        <button
          type="button"
          style={cancelButtonStyle}
          onClick={onCancel}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-close`
              : undefined
          }
        >
          ×
        </button>
      </div>

      <label style={labelStyle}>Variable name (x)</label>
      <input
        type="text"
        style={{ ...inputStyle, width: 80 }}
        value={variableName}
        onChange={(e) => {
          setVariableName(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder="x"
        data-testid={
          testId !== undefined
            ? `${testId satisfies string}-variable-input`
            : undefined
        }
        autoFocus
      />

      <label style={labelStyle}>Antecedent φ (x must NOT be free)</label>
      <input
        type="text"
        style={inputStyle}
        value={antecedentText}
        onChange={(e) => {
          setAntecedentText(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder="P(a)"
        data-testid={
          testId !== undefined
            ? `${testId satisfies string}-antecedent-input`
            : undefined
        }
      />
      {antecedentValidation !== undefined &&
        antecedentValidation._tag === "VariableFreeInAntecedent" && (
          <div
            style={errorStyle}
            data-testid={
              testId !== undefined
                ? `${testId satisfies string}-antecedent-error`
                : undefined
            }
          >
            Variable &quot;{variableName.trim()}&quot; must not be free in φ
          </div>
        )}
      {antecedentValidation !== undefined &&
        antecedentValidation._tag === "ParseError" && (
          <div
            style={errorStyle}
            data-testid={
              testId !== undefined
                ? `${testId satisfies string}-antecedent-error`
                : undefined
            }
          >
            Invalid formula syntax
          </div>
        )}

      <label style={labelStyle}>Consequent ψ</label>
      <input
        type="text"
        style={inputStyle}
        value={consequentText}
        onChange={(e) => {
          setConsequentText(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Q(x)"
        data-testid={
          testId !== undefined
            ? `${testId satisfies string}-consequent-input`
            : undefined
        }
      />

      <label style={previewLabelStyle}>Generated instance</label>
      <div
        style={previewStyle}
        data-testid={
          testId !== undefined
            ? `${testId satisfies string}-preview`
            : undefined
        }
      >
        {result === undefined
          ? "—"
          : result._tag === "Success"
            ? result.unicodeDisplay
            : getA5ErrorMessage(result)}
      </div>

      <div style={buttonRowStyle}>
        <button
          type="button"
          style={cancelButtonStyle}
          onClick={onCancel}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-cancel`
              : undefined
          }
        >
          Cancel
        </button>
        <button
          type="button"
          style={isValid ? confirmButtonStyle : confirmButtonDisabledStyle}
          onClick={handleConfirm}
          disabled={!isValid}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-confirm`
              : undefined
          }
        >
          Add Axiom
        </button>
      </div>
    </div>
  );
}

// --- メインコンポーネント ---

export function ParametricAxiomPanel({
  axiomId,
  onConfirm,
  onCancel,
  testId,
}: ParametricAxiomPanelProps) {
  switch (axiomId) {
    case "A4":
      return (
        <A4Panel onConfirm={onConfirm} onCancel={onCancel} testId={testId} />
      );
    case "A5":
      return (
        <A5Panel onConfirm={onConfirm} onCancel={onCancel} testId={testId} />
      );
  }
}
