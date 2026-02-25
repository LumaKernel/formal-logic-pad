/**
 * ノートブック新規作成フォームUIコンポーネント。
 *
 * 名前入力、モード選択（自由帳/クエスト）、公理系選択を提供する。
 * 制御コンポーネント: バリデーションは notebookCreateLogic に委譲する。
 *
 * 変更時は NotebookCreateFormComponent.test.tsx, NotebookCreateFormComponent.stories.tsx も同期すること。
 */

import { useState, type CSSProperties } from "react";
import {
  systemPresets,
  defaultCreateFormValues,
  validateCreateForm,
  getFieldError,
  findPresetById,
  type CreateMode,
  type CreateFormValues,
} from "./notebookCreateLogic";
import type { LogicSystem } from "../logic-core/inferenceRule";

// --- Props ---

export type NotebookCreateFormProps = {
  /** フォーム送信時のコールバック */
  readonly onSubmit: (params: {
    readonly name: string;
    readonly mode: CreateMode;
    readonly system: LogicSystem;
  }) => void;
  /** キャンセル時のコールバック */
  readonly onCancel: () => void;
};

// --- Styles ---

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  padding: 24,
  maxWidth: 480,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const fieldGroupStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--color-text-primary, #333)",
};

const inputStyle: CSSProperties = {
  fontSize: 15,
  padding: "8px 12px",
  border: "1px solid var(--color-border, #ccc)",
  borderRadius: 6,
  outline: "none",
  background: "var(--color-surface, #fff)",
  color: "var(--color-text-primary, #333)",
};

const inputErrorStyle: CSSProperties = {
  ...inputStyle,
  border: "1px solid var(--color-danger, #d32f2f)",
};

const errorTextStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--color-danger, #d32f2f)",
};

const radioGroupStyle: CSSProperties = {
  display: "flex",
  gap: 12,
};

const radioLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 14,
  cursor: "pointer",
  color: "var(--color-text-primary, #333)",
};

const systemCardStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "2px solid var(--color-border, #e0e0e0)",
  cursor: "pointer",
  transition: "border-color 0.15s, background 0.15s",
  background: "var(--color-surface, #fff)",
};

const systemCardSelectedStyle: CSSProperties = {
  ...systemCardStyle,
  border: "2px solid var(--color-primary, #1976d2)",
  background: "var(--color-primary-surface, #e3f2fd)",
};

const systemCardLabelStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--color-text-primary, #333)",
};

const systemCardDescStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--color-text-secondary, #666)",
  marginTop: 2,
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
  marginTop: 8,
};

const submitButtonStyle: CSSProperties = {
  padding: "8px 20px",
  fontSize: 14,
  fontWeight: 600,
  borderRadius: 6,
  border: "none",
  background: "var(--color-primary, #1976d2)",
  color: "#fff",
  cursor: "pointer",
};

const cancelButtonStyle: CSSProperties = {
  padding: "8px 20px",
  fontSize: 14,
  borderRadius: 6,
  border: "1px solid var(--color-border, #ccc)",
  background: "var(--color-surface, #fff)",
  color: "var(--color-text-primary, #333)",
  cursor: "pointer",
};

// --- Component ---

export function NotebookCreateForm({
  onSubmit,
  onCancel,
}: NotebookCreateFormProps) {
  const [values, setValues] = useState<CreateFormValues>(
    defaultCreateFormValues,
  );
  const [submitted, setSubmitted] = useState(false);

  const validation = validateCreateForm(values);
  const nameError = submitted ? getFieldError(validation, "name") : undefined;
  const systemError = submitted
    ? getFieldError(validation, "systemPresetId")
    : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!validation.valid) return;

    const preset = findPresetById(values.systemPresetId);
    /* v8 ignore start -- 防御的コード: validateCreateForm通過後は到達不能 */
    if (preset === undefined) return;
    /* v8 ignore stop */

    onSubmit({
      name: values.name.trim(),
      mode: values.mode,
      system: preset.system,
    });
  };

  return (
    <form
      style={formStyle}
      onSubmit={handleSubmit}
      data-testid="notebook-create-form"
    >
      {/* 名前入力 */}
      <div style={fieldGroupStyle}>
        <label style={labelStyle} htmlFor="notebook-name">
          ノート名
        </label>
        <input
          id="notebook-name"
          data-testid="create-name-input"
          style={nameError !== undefined ? inputErrorStyle : inputStyle}
          type="text"
          placeholder="新しいノート"
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          autoFocus
        />
        {nameError !== undefined && (
          <span style={errorTextStyle} data-testid="create-name-error">
            {nameError}
          </span>
        )}
      </div>

      {/* モード選択 */}
      <div style={fieldGroupStyle}>
        <span style={labelStyle}>モード</span>
        <div style={radioGroupStyle}>
          <label style={radioLabelStyle}>
            <input
              type="radio"
              name="mode"
              value="free"
              checked={values.mode === "free"}
              onChange={() => setValues({ ...values, mode: "free" })}
              data-testid="create-mode-free"
            />
            自由帳
          </label>
          <label style={radioLabelStyle}>
            <input
              type="radio"
              name="mode"
              value="quest"
              checked={values.mode === "quest"}
              onChange={() => setValues({ ...values, mode: "quest" })}
              data-testid="create-mode-quest"
            />
            クエスト
          </label>
        </div>
      </div>

      {/* 公理系選択 */}
      <div style={fieldGroupStyle}>
        <span style={labelStyle}>公理系</span>
        <div
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
          data-testid="create-system-list"
        >
          {systemPresets.map((preset) => (
            <div
              key={preset.id}
              data-testid={`system-preset-${preset.id satisfies string}`}
              style={
                values.systemPresetId === preset.id
                  ? systemCardSelectedStyle
                  : systemCardStyle
              }
              onClick={() =>
                setValues({ ...values, systemPresetId: preset.id })
              }
              role="radio"
              aria-checked={values.systemPresetId === preset.id}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setValues({ ...values, systemPresetId: preset.id });
                }
              }}
            >
              <div style={systemCardLabelStyle}>{preset.label}</div>
              <div style={systemCardDescStyle}>{preset.description}</div>
            </div>
          ))}
        </div>
        {systemError !== undefined && (
          <span style={errorTextStyle} data-testid="create-system-error">
            {systemError}
          </span>
        )}
      </div>

      {/* ボタン */}
      <div style={buttonRowStyle}>
        <button
          type="button"
          style={cancelButtonStyle}
          onClick={onCancel}
          data-testid="create-cancel-btn"
        >
          キャンセル
        </button>
        <button
          type="submit"
          style={submitButtonStyle}
          data-testid="create-submit-btn"
        >
          作成
        </button>
      </div>
    </form>
  );
}
