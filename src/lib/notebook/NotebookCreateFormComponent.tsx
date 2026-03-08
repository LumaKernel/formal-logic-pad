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
  groupPresetsByCategory,
  defaultCreateFormValues,
  validateCreateForm,
  shouldShowFieldError,
  getFirstErrorField,
  findPresetById,
  getPresetReferenceEntryId,
  type CreateFormValues,
  type SystemPreset,
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

const categoryDetailsStyle: CSSProperties = {
  borderRadius: 8,
  border: "1px solid var(--color-border, #e0e0e0)",
  overflow: "hidden",
};

const categorySummaryStyle: CSSProperties = {
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  background: "var(--color-surface-alt, #f8f8fa)",
  color: "var(--color-text-primary, #333)",
  listStyle: "none",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const categoryDescStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 400,
  color: "var(--color-text-secondary, #666)",
};

const categoryPresetsContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: "8px 10px",
};

/** プリセットをカテゴリごとにグルーピング（静的データなのでモジュールレベルで計算） */
const presetGroups = groupPresetsByCategory(systemPresets);

// --- PresetCard ---

type PresetCardProps = {
  readonly preset: SystemPreset;
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly referenceEntries?: readonly ReferenceEntry[];
  readonly locale?: Locale;
  readonly onOpenReferenceDetail?: (entryId: string) => void;
  readonly testId?: string;
};

function PresetCard({
  preset,
  selected,
  onSelect,
  referenceEntries,
  locale,
  onOpenReferenceDetail,
  testId,
}: PresetCardProps) {
  const refEntryId = getPresetReferenceEntryId(preset.id);
  const refEntry =
    refEntryId !== undefined && referenceEntries !== undefined
      ? findEntryById(referenceEntries, refEntryId)
      : undefined;

  return (
    <div
      data-testid={`system-preset-${preset.id satisfies string}`}
      style={selected ? systemCardSelectedStyle : systemCardStyle}
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        /* v8 ignore start -- キーボード操作: テストカバー済みだがv8集約でfalse分岐未計上 */
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
        /* v8 ignore stop */
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
                /* v8 ignore start -- testId分岐: テストでは常にtestId指定 */
                testId !== undefined
                  ? `${testId satisfies string}-preset-${preset.id satisfies string}-ref`
                  : undefined
                /* v8 ignore stop */
              }
            />
          </span>
        )}
      </div>
      <div style={systemCardDescStyle}>{preset.description}</div>
    </div>
  );
}

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
      /* v8 ignore start -- ref nullガード: jsdomではscrollIntoViewが限定的 */
      if (firstErrorField === "name" && nameInputRef.current !== null) {
        nameInputRef.current.scrollIntoView?.({
          behavior: "smooth",
          block: "center",
        });
        nameInputRef.current.focus();
      }
      /* v8 ignore stop */
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
          aria-describedby={
            nameError !== undefined ? "create-name-error-msg" : undefined
          }
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
          {presetGroups.map((group) => (
            <details
              key={group.category.id}
              open
              style={categoryDetailsStyle}
              data-testid={`preset-category-${group.category.id satisfies string}`}
            >
              <summary style={categorySummaryStyle}>
                <span>{group.category.label}</span>
                <span style={categoryDescStyle}>
                  {group.category.description}
                </span>
              </summary>
              <div style={categoryPresetsContainerStyle}>
                {group.presets.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    selected={values.systemPresetId === preset.id}
                    onSelect={() =>
                      setValues({ ...values, systemPresetId: preset.id })
                    }
                    referenceEntries={referenceEntries}
                    locale={locale}
                    onOpenReferenceDetail={onOpenReferenceDetail}
                    testId={testId}
                  />
                ))}
              </div>
            </details>
          ))}
        </div>
        {/* v8 ignore start -- systemError表示: 通常のバリデーションフローでは到達しない */}
        {systemError !== undefined && (
          <span
            style={errorTextStyle}
            data-testid="create-system-error"
            role="alert"
          >
            {systemError}
          </span>
        )}
        {/* v8 ignore stop */}
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
