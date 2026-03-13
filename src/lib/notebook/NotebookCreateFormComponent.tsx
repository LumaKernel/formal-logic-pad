/**
 * ノートブック新規作成フォームUIコンポーネント。
 *
 * 名前入力、公理系選択を提供する。
 * クエストモードはクエストマップから自動開始されるため、このフォームでは選択しない。
 * 制御コンポーネント: バリデーションは notebookCreateLogic に委譲する。
 *
 * 変更時は NotebookCreateFormComponent.test.tsx, NotebookCreateFormComponent.stories.tsx も同期すること。
 */

import { useState, useRef, useCallback } from "react";
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

const formClassName =
  "flex flex-col gap-4 p-6 max-w-[480px] font-[var(--font-ui)]";

const fieldGroupClassName = "flex flex-col gap-1";

const labelClassName = "text-[13px] font-semibold text-foreground";

const inputClassName =
  "text-[15px] py-2 px-3 border border-ui-border rounded-md outline-none bg-card text-foreground";

const inputErrorClassName =
  "text-[15px] py-2 px-3 border border-destructive rounded-md outline-none bg-card text-foreground";

const errorTextClassName = "text-xs text-destructive";

const systemCardClassName =
  "py-2.5 px-3.5 rounded-lg border-2 border-ui-border cursor-pointer transition-[border-color,background] duration-150 bg-card";

const systemCardSelectedClassName =
  "py-2.5 px-3.5 rounded-lg border-2 border-primary cursor-pointer transition-[border-color,background] duration-150 bg-primary/5";

const systemCardLabelClassName = "text-sm font-semibold text-foreground";

const systemCardDescClassName = "text-xs text-muted-foreground mt-0.5";

const buttonRowClassName = "flex gap-2 justify-end mt-2";

const submitButtonClassName =
  "py-2 px-5 text-sm font-semibold rounded-md border-none bg-primary text-primary-foreground cursor-pointer";

const cancelButtonClassName =
  "py-2 px-5 text-sm rounded-md border border-ui-border bg-card text-foreground cursor-pointer";

const categoryDetailsClassName =
  "rounded-lg border border-ui-border overflow-hidden";

const categorySummaryClassName =
  "py-2 px-3 text-[13px] font-semibold cursor-pointer bg-muted text-foreground list-none flex items-center gap-2";

const categoryDescClassName = "text-[11px] font-normal text-muted-foreground";

const categoryPresetsContainerClassName = "flex flex-col gap-1.5 py-2 px-2.5";

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
      className={selected ? systemCardSelectedClassName : systemCardClassName}
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
        className={`${systemCardLabelClassName satisfies string} flex items-center`}
      >
        <span
          className={`text-[10px] font-medium py-px px-1.5 rounded mr-1.5 ${
            (preset.deductionSystem.style === "hilbert"
              ? "bg-[var(--color-accent-light,#e8e9f5)] text-[var(--color-accent,#555ab9)]"
              : "bg-[var(--color-warning-light,#fff3e0)] text-[var(--color-warning,#e65100)]") satisfies string
          }`}
        >
          {getDeductionStyleLabel(preset.deductionSystem.style)}
        </span>
        {preset.label}
        {refEntry !== undefined && locale !== undefined && (
          <span
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            className="ml-1"
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
      <div className={systemCardDescClassName}>{preset.description}</div>
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
      className={formClassName}
      onSubmit={handleSubmit}
      data-testid="notebook-create-form"
    >
      {/* 名前入力 */}
      <div className={fieldGroupClassName}>
        <label className={labelClassName} htmlFor="notebook-name">
          ノート名
        </label>
        <input
          ref={nameInputRef}
          id="notebook-name"
          data-testid="create-name-input"
          className={
            nameError !== undefined ? inputErrorClassName : inputClassName
          }
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
            className={errorTextClassName}
            data-testid="create-name-error"
            role="alert"
          >
            {nameError}
          </span>
        )}
      </div>

      {/* 体系選択 */}
      <div className={fieldGroupClassName}>
        <span className={labelClassName}>体系</span>
        <div className="flex flex-col gap-2" data-testid="create-system-list">
          {presetGroups.map((group) => (
            <details
              key={group.category.id}
              open
              className={categoryDetailsClassName}
              data-testid={`preset-category-${group.category.id satisfies string}`}
            >
              <summary className={categorySummaryClassName}>
                <span>{group.category.label}</span>
                <span className={categoryDescClassName}>
                  {group.category.description}
                </span>
              </summary>
              <div className={categoryPresetsContainerClassName}>
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
            className={errorTextClassName}
            data-testid="create-system-error"
            role="alert"
          >
            {systemError}
          </span>
        )}
        {/* v8 ignore stop */}
      </div>

      {/* ボタン */}
      <div className={buttonRowClassName}>
        <button
          type="button"
          className={cancelButtonClassName}
          onClick={onCancel}
          data-testid="create-cancel-btn"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className={submitButtonClassName}
          data-testid="create-submit-btn"
        >
          作成
        </button>
      </div>
    </form>
  );
}
