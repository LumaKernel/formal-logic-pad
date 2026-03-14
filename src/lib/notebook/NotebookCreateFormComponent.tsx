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

const formStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  padding: "24px",
  maxWidth: "480px",
  fontFamily: "var(--font-ui)",
};

const fieldGroupStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const labelStyle: Readonly<CSSProperties> = {
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--ui-foreground)",
};

const inputStyle: Readonly<CSSProperties> = {
  fontSize: "15px",
  padding: "8px 12px",
  border: "1px solid var(--ui-border)",
  borderRadius: "6px",
  outline: "none",
  background: "var(--ui-card)",
  color: "var(--ui-foreground)",
};

const inputErrorStyle: Readonly<CSSProperties> = {
  fontSize: "15px",
  padding: "8px 12px",
  border: "1px solid var(--ui-destructive)",
  borderRadius: "6px",
  outline: "none",
  background: "var(--ui-card)",
  color: "var(--ui-foreground)",
};

const errorTextStyle: Readonly<CSSProperties> = {
  fontSize: "0.75rem",
  color: "var(--ui-destructive)",
};

const systemCardStyle: Readonly<CSSProperties> = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "2px solid var(--ui-border)",
  cursor: "pointer",
  transitionProperty: "border-color, background",
  transitionDuration: "150ms",
  background: "var(--ui-card)",
};

const systemCardSelectedStyle: Readonly<CSSProperties> = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "2px solid var(--ui-primary)",
  cursor: "pointer",
  transitionProperty: "border-color, background",
  transitionDuration: "150ms",
  background: "color-mix(in srgb, var(--ui-primary) 5%, transparent)",
};

const systemCardLabelStyle: Readonly<CSSProperties> = {
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "var(--ui-foreground)",
  display: "flex",
  alignItems: "center",
};

const systemCardDescStyle: Readonly<CSSProperties> = {
  fontSize: "0.75rem",
  color: "var(--ui-muted-foreground)",
  marginTop: "2px",
};

const buttonRowStyle: Readonly<CSSProperties> = {
  display: "flex",
  gap: "8px",
  justifyContent: "flex-end",
  marginTop: "8px",
};

const submitButtonStyle: Readonly<CSSProperties> = {
  padding: "8px 20px",
  fontSize: "0.875rem",
  fontWeight: 600,
  borderRadius: "6px",
  border: "none",
  background: "var(--ui-primary)",
  color: "var(--ui-primary-foreground)",
  cursor: "pointer",
};

const cancelButtonStyle: Readonly<CSSProperties> = {
  padding: "8px 20px",
  fontSize: "0.875rem",
  borderRadius: "6px",
  border: "1px solid var(--ui-border)",
  background: "var(--ui-card)",
  color: "var(--ui-foreground)",
  cursor: "pointer",
};

const categoryDetailsStyle: Readonly<CSSProperties> = {
  borderRadius: "8px",
  border: "1px solid var(--ui-border)",
  overflow: "hidden",
};

const categorySummaryStyle: Readonly<CSSProperties> = {
  padding: "8px 12px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  background: "var(--ui-muted)",
  color: "var(--ui-foreground)",
  listStyle: "none",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const categoryDescStyle: Readonly<CSSProperties> = {
  fontSize: "11px",
  fontWeight: 400,
  color: "var(--ui-muted-foreground)",
};

const categoryPresetsContainerStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  padding: "8px 10px",
};

const deductionStyleBadgeBaseStyle: Readonly<CSSProperties> = {
  fontSize: "10px",
  fontWeight: 500,
  padding: "1px 6px",
  borderRadius: "4px",
  marginRight: "6px",
};

const hilbertBadgeStyle: Readonly<CSSProperties> = {
  ...deductionStyleBadgeBaseStyle,
  background: "var(--color-accent-light, #e8e9f5)",
  color: "var(--color-accent, #555ab9)",
};

const ndBadgeStyle: Readonly<CSSProperties> = {
  ...deductionStyleBadgeBaseStyle,
  background: "var(--color-warning-light, #fff3e0)",
  color: "var(--color-warning, #e65100)",
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
      <div style={systemCardLabelStyle}>
        <span
          style={
            preset.deductionSystem.style === "hilbert"
              ? hilbertBadgeStyle
              : ndBadgeStyle
          }
        >
          {getDeductionStyleLabel(preset.deductionSystem.style)}
        </span>
        {preset.label}
        {refEntry !== undefined && locale !== undefined && (
          <span
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            style={{ marginLeft: "4px" }}
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
          style={{ display: "flex", flexDirection: "column", gap: "8px" }}
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
