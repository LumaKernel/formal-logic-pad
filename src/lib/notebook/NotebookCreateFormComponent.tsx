/**
 * ノートブック新規作成フォームUIコンポーネント。
 *
 * 名前入力、公理系選択を提供する。
 * クエストモードはクエストマップから自動開始されるため、このフォームでは選択しない。
 * 制御コンポーネント: バリデーションは notebookCreateLogic に委譲する。
 *
 * 変更時は NotebookCreateFormComponent.test.tsx, NotebookCreateFormComponent.stories.tsx も同期すること。
 */

import { useState, useRef, useCallback, type CSSProperties } from "react";
import {
  systemPresets,
  defaultCreateFormValues,
  validateCreateForm,
  shouldShowFieldError,
  getFirstErrorField,
  findPresetById,
  getPresetReferenceEntryId,
  type CreateFormValues,
} from "./notebookCreateLogic";
import type { DeductionSystem } from "../logic-core/deductionSystem";
import { getDeductionStyleLabel } from "../logic-core/deductionSystem";
import type { ReferenceEntry, Locale } from "../reference/referenceEntry";
import { findEntryById } from "../reference/referenceEntry";
import { ReferencePopover } from "../reference/ReferencePopover";

// --- Props ---

export type NotebookCreateFormProps = {
  /** フォーム送信時のコールバック */
  readonly onSubmit: (params: {
    readonly name: string;
    readonly deductionSystem: DeductionSystem;
  }) => void;
  /** キャンセル時のコールバック */
  readonly onCancel: () => void;
  /** リファレンスエントリ一覧（指定時にポップオーバーを表示） */
  readonly referenceEntries?: readonly ReferenceEntry[];
  /** ロケール（リファレンスポップオーバーの表示言語） */
  readonly locale?: Locale;
  /** リファレンス詳細表示のコールバック */
  readonly onOpenReferenceDetail?: (entryId: string) => void;
  /** テスト用ID */
  readonly testId?: string;
};

// --- Styles ---

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  padding: 24,
  maxWidth: 480,
  fontFamily: "var(--font-ui)",
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
  border: "1px solid var(--color-error, #d32f2f)",
};

const errorTextStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--color-error, #d32f2f)",
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
  border: "2px solid var(--color-accent, #555ab9)",
  background: "var(--color-surface-selected, #ebf8ff)",
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
  background: "var(--color-accent, #555ab9)",
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
  referenceEntries,
  locale,
  onOpenReferenceDetail,
  testId,
}: NotebookCreateFormProps) {
  const [values, setValues] = useState<CreateFormValues>(
    defaultCreateFormValues,
  );
  const [submitted, setSubmitted] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const validation = validateCreateForm(values);
  const nameError = shouldShowFieldError({
    touched: nameTouched,
    submitted,
    validation,
    field: "name",
  });
  const systemError = shouldShowFieldError({
    touched: false,
    submitted,
    validation,
    field: "systemPresetId",
  });

  const handleNameBlur = useCallback(() => {
    setNameTouched(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!validation.valid) {
      const firstErrorField = getFirstErrorField(validation);
      if (firstErrorField === "name" && nameInputRef.current !== null) {
        nameInputRef.current.scrollIntoView?.({ behavior: "smooth", block: "center" });
        nameInputRef.current.focus();
      }
      return;
    }

    const preset = findPresetById(values.systemPresetId);
    /* v8 ignore start -- 防御的コード: validateCreateForm通過後は到達不能 */
    if (preset === undefined) return;
    /* v8 ignore stop */

    onSubmit({
      name: values.name.trim(),
      deductionSystem: preset.deductionSystem,
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
          ref={nameInputRef}
          id="notebook-name"
          data-testid="create-name-input"
          style={nameError !== undefined ? inputErrorStyle : inputStyle}
          type="text"
          placeholder="新しいノート"
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          onBlur={handleNameBlur}
          aria-invalid={nameError !== undefined}
          aria-describedby={nameError !== undefined ? "create-name-error-msg" : undefined}
          autoFocus
        />
        {nameError !== undefined && (
          <span
            id="create-name-error-msg"
            style={errorTextStyle}
            data-testid="create-name-error"
            role="alert"
          >
            {nameError}
          </span>
        )}
      </div>

      {/* 体系選択 */}
      <div style={fieldGroupStyle}>
        <span style={labelStyle}>体系</span>
        <div
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
          data-testid="create-system-list"
        >
          {systemPresets.map((preset) => {
            const refEntryId = getPresetReferenceEntryId(preset.id);
            const refEntry =
              refEntryId !== undefined && referenceEntries !== undefined
                ? findEntryById(referenceEntries, refEntryId)
                : undefined;
            return (
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
                <div
                  style={{
                    ...systemCardLabelStyle,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      padding: "1px 6px",
                      borderRadius: 4,
                      background:
                        preset.deductionSystem.style === "hilbert"
                          ? "var(--color-accent-light, #e8e9f5)"
                          : "var(--color-warning-light, #fff3e0)",
                      color:
                        preset.deductionSystem.style === "hilbert"
                          ? "var(--color-accent, #555ab9)"
                          : "var(--color-warning, #e65100)",
                      marginRight: 6,
                    }}
                  >
                    {getDeductionStyleLabel(preset.deductionSystem.style)}
                  </span>
                  {preset.label}
                  {refEntry !== undefined && locale !== undefined && (
                    <span
                      role="presentation"
                      onClick={(e) => e.stopPropagation()}
                      style={{ marginLeft: 4 }}
                    >
                      <ReferencePopover
                        entry={refEntry}
                        locale={locale}
                        onOpenDetail={onOpenReferenceDetail}
                        testId={
                          testId !== undefined
                            ? `${testId satisfies string}-preset-${preset.id satisfies string}-ref`
                            : undefined
                        }
                      />
                    </span>
                  )}
                </div>
                <div style={systemCardDescStyle}>{preset.description}</div>
              </div>
            );
          })}
        </div>
        {systemError !== undefined && (
          <span style={errorTextStyle} data-testid="create-system-error" role="alert">
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
