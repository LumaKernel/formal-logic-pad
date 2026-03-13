/**
 * 自作クエスト一覧UIコンポーネント。
 *
 * ビルトインクエストとは分離された、フラットリスト形式の自作クエスト一覧。
 * QuestCatalogComponent と同様のアイテム表示だが、カテゴリグループ化なし。
 * 編集ボタンで各クエストのインライン編集フォームを表示する。
 *
 * 変更時は CustomQuestListComponent.stories.tsx, index.ts も同期すること。
 */

import { useState, useRef, useEffect, type CSSProperties } from "react";
import { FormulaListEditor } from "../formula-input/FormulaListEditor";
import type { QuestCatalogItem } from "./questCatalog";
import type {
  QuestId,
  DifficultyLevel,
  SystemPresetId,
  QuestDefinition,
} from "./questDefinition";
import {
  difficultyShortLabel,
  ratingLabel,
  ratingCssVars,
  stepCountText,
  difficultyStars,
} from "./questCatalogListLogic";
import {
  getCustomQuestCatalogCount,
  getCustomQuestCompletedCount,
  customQuestProgressText,
} from "./customQuestCatalogLogic";
import { systemPresets } from "../notebook/notebookCreateLogic";
import {
  createEmptyEditFormValues,
  questToEditFormValues,
  validateEditForm,
  shouldShowEditFieldError,
  getFirstEditErrorField,
  goalFormulasToDefinitions,
  parseHintLines,
  parseEstimatedSteps,
  type EditFormValues,
} from "./customQuestEditLogic";
import type { CreateCustomQuestParams } from "./customQuestState";

// --- Props ---

export type CustomQuestEditParams = {
  readonly questId: QuestId;
  readonly params: CreateCustomQuestParams;
};

export type CustomQuestListProps = {
  readonly items: readonly QuestCatalogItem[];
  readonly onStartQuest: (questId: QuestId) => void;
  readonly onDuplicateQuest?: (questId: QuestId) => void;
  readonly onDeleteQuest?: (questId: QuestId) => void;
  readonly onEditQuest?: (edit: CustomQuestEditParams) => void;
  readonly onCreateQuest?: (params: CreateCustomQuestParams) => void;
  readonly onExportQuest?: (questId: QuestId) => void;
  readonly onImportQuest?: (jsonString: string) => void;
  readonly onShareQuestUrl?: (questId: QuestId) => void;
};

// --- Styles ---

const sectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 0,
  marginTop: 24,
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  borderRadius: "8px 8px 0 0",
  background: "var(--color-quest-chapter-bg)",
  borderTop: "1px solid var(--color-quest-chapter-border)",
  borderRight: "1px solid var(--color-quest-chapter-border)",
  borderLeft: "1px solid var(--color-quest-chapter-border)",
  borderBottom: "2px solid var(--color-quest-chapter-rule)",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: "var(--color-text-primary, #333)",
};

const sectionProgressStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--color-text-secondary, #666)",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const questListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 0,
  borderRight: "1px solid var(--color-quest-card-border)",
  borderBottom: "1px solid var(--color-quest-card-border)",
  borderLeft: "1px solid var(--color-quest-card-border)",
  borderRadius: "0 0 8px 8px",
  overflow: "hidden",
};

const questItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "10px 14px",
  background: "var(--color-quest-card-bg)",
  cursor: "pointer",
  transition: "background 0.15s, box-shadow 0.15s",
  gap: 10,
  borderBottom: "1px solid var(--color-quest-card-border)",
};

const questItemHoverStyle: CSSProperties = {
  ...questItemStyle,
  background: "var(--color-quest-card-hover-bg)",
  boxShadow: "inset 3px 0 0 var(--color-quest-filter-active-bg)",
};

const questInfoStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const questTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--color-text-primary, #333)",
};

const questDescStyle: CSSProperties = {
  fontSize: 11,
  color: "var(--color-text-secondary, #888)",
  marginTop: 2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const questMetaStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  marginTop: 4,
};

const difficultyBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 3,
  fontSize: 10,
  padding: "2px 6px",
  borderRadius: 10,
  fontWeight: 600,
  background: "var(--color-quest-difficulty-bg)",
  color: "var(--color-quest-difficulty-text)",
};

const starStyle: CSSProperties = {
  fontSize: 9,
  lineHeight: 1,
};

const stepTextStyle: CSSProperties = {
  fontSize: 10,
  color: "var(--color-text-secondary, #999)",
};

const ratingBadgeBaseStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  padding: "2px 8px",
  borderRadius: 10,
  whiteSpace: "nowrap",
};

const startButtonClassName =
  "py-1.5 px-3 text-[11px] font-semibold rounded-md border-none bg-[var(--color-quest-start-bg)] text-white cursor-pointer shrink-0 transition-colors";

const actionButtonClassName =
  "py-1 px-2 text-[10px] font-semibold rounded border border-ui-border bg-transparent text-muted-foreground cursor-pointer shrink-0 transition-colors hover:bg-muted";

const deleteButtonClassName =
  "py-1 px-2 text-[10px] font-semibold rounded border border-destructive/60 bg-transparent text-destructive cursor-pointer shrink-0 transition-colors hover:bg-destructive/5";

const deleteConfirmOverlayClassName =
  "absolute inset-0 flex items-center justify-center gap-2 bg-[var(--color-quest-card-bg,rgba(255,253,248,0.97))] z-[1] px-4.5";

const deleteConfirmTextClassName =
  "text-[13px] text-destructive font-semibold flex-1 text-center";

const deleteConfirmBtnClassName =
  "py-1.5 px-3.5 text-xs rounded-md border border-destructive/40 bg-destructive text-destructive-foreground cursor-pointer font-semibold";

const deleteCancelBtnClassName =
  "py-1.5 px-3.5 text-xs rounded-md border border-ui-border bg-card text-foreground cursor-pointer";

const sharePanelOverlayClassName =
  "absolute inset-0 flex items-center justify-center gap-2 bg-[var(--color-quest-card-bg,rgba(255,253,248,0.97))] z-[1] px-4.5";

const sharePanelTitleClassName =
  "text-xs font-semibold text-foreground shrink-0";

const sharePanelBtnClassName =
  "py-1.5 px-3.5 text-xs rounded-md border border-ui-border bg-card text-foreground cursor-pointer font-semibold transition-colors";

const sharePanelCopiedBtnClassName =
  "py-1.5 px-3.5 text-xs rounded-md border border-[var(--color-quest-start-bg,#4caf50)] bg-[var(--color-quest-start-bg,#4caf50)] text-white cursor-pointer font-semibold transition-colors";

const sharePanelCloseBtnClassName =
  "py-1.5 px-2.5 text-xs rounded-md border border-ui-border bg-transparent text-muted-foreground cursor-pointer";

const actionGroupClassName = "flex gap-1 items-center";

const createButtonClassName =
  "py-1.5 px-3.5 text-[11px] font-semibold rounded border-none bg-[var(--color-quest-start-bg)] text-white cursor-pointer shrink-0 transition-colors";

const emptyStyle: CSSProperties = {
  textAlign: "center",
  padding: 32,
  color: "var(--color-text-secondary, #999)",
  fontSize: 13,
  background: "var(--color-quest-empty-bg)",
  borderRadius: "0 0 8px 8px",
  borderRight: "1px solid var(--color-quest-chapter-border)",
  borderBottom: "1px solid var(--color-quest-chapter-border)",
  borderLeft: "1px solid var(--color-quest-chapter-border)",
};

// --- Edit form styles ---

const editFormOverlayStyle: CSSProperties = {
  padding: "16px 14px",
  background: "var(--color-surface, #fff)",
  borderBottom: "1px solid var(--color-quest-card-border)",
};

const editFormStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const editFieldGroupStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
};

const editLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--color-text-secondary, #666)",
};

const editInputStyle: CSSProperties = {
  fontSize: 12,
  padding: "6px 10px",
  border: "1px solid var(--color-border, #ccc)",
  borderRadius: 4,
  outline: "none",
  background: "var(--color-surface, #fff)",
  color: "var(--color-text-primary, #333)",
};

const editInputErrorStyle: CSSProperties = {
  ...editInputStyle,
  border: "1px solid var(--color-error, #d32f2f)",
};

const editTextareaStyle: CSSProperties = {
  ...editInputStyle,
  resize: "vertical" as const,
  minHeight: 60,
  fontFamily: "inherit",
};

const editSelectStyle: CSSProperties = {
  ...editInputStyle,
  cursor: "pointer",
};

const editErrorTextStyle: CSSProperties = {
  fontSize: 10,
  color: "var(--color-error, #d32f2f)",
};

const editRowStyle: CSSProperties = {
  display: "flex",
  gap: 8,
};

const editActionsStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  justifyContent: "flex-end",
  marginTop: 4,
};

const editSaveButtonClassName =
  "py-1.5 px-3.5 text-[11px] font-semibold rounded border-none bg-[var(--color-quest-start-bg)] text-white cursor-pointer";

const editCancelButtonClassName =
  "py-1.5 px-3.5 text-[11px] font-semibold rounded border border-ui-border bg-transparent text-muted-foreground cursor-pointer";

// --- Sub-components ---

function DifficultyStars({ level }: { readonly level: DifficultyLevel }) {
  const stars = difficultyStars(level);
  return (
    <span style={difficultyBadgeStyle}>
      <span style={{ fontSize: 10, fontWeight: 600 }}>
        {difficultyShortLabel(level)}
      </span>
      {stars.map((filled, i) => (
        <span
          key={i}
          style={{
            ...starStyle,
            color: filled
              ? "var(--color-quest-star-filled)"
              : "var(--color-quest-star-empty)",
          }}
        >
          {"\u2605"}
        </span>
      ))}
    </span>
  );
}

function RatingBadge({
  rating,
}: {
  readonly rating: QuestCatalogItem["rating"];
}) {
  const vars = ratingCssVars(rating);
  const style: CSSProperties = {
    ...ratingBadgeBaseStyle,
    color: vars.text,
    background: vars.bg,
  };
  return <span style={style}>{ratingLabel(rating)}</span>;
}

// --- Edit form ---

function CustomQuestEditForm({
  quest,
  onSave,
  onCancel,
}: {
  readonly quest: QuestDefinition;
  readonly onSave: (edit: CustomQuestEditParams) => void;
  readonly onCancel: () => void;
}) {
  const [values, setValues] = useState<EditFormValues>(() =>
    questToEditFormValues(quest),
  );
  const [submitted, setSubmitted] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  const [stepsTouched, setStepsTouched] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const stepsRef = useRef<HTMLInputElement>(null);

  const validation = validateEditForm(values);

  const titleError = shouldShowEditFieldError({
    touched: titleTouched,
    submitted,
    validation,
    field: "title",
  });
  const goalsError = shouldShowEditFieldError({
    touched: false,
    submitted,
    validation,
    field: "goalFormulas",
  });
  const stepsError = shouldShowEditFieldError({
    touched: stepsTouched,
    submitted,
    validation,
    field: "estimatedSteps",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSubmitted(true);

    if (!validation.valid) {
      const firstField = getFirstEditErrorField(validation);
      /* v8 ignore start -- focus routing: all branches tested but v8 inline callback artifact */
      if (firstField === "title") titleRef.current?.focus();
      else if (firstField === "estimatedSteps") stepsRef.current?.focus();
      /* v8 ignore stop */
      return;
    }

    onSave({
      questId: quest.id,
      params: {
        title: values.title,
        description: values.description,
        difficulty: values.difficulty,
        systemPresetId: values.systemPresetId,
        goals: goalFormulasToDefinitions(values.goalFormulas),
        hints: parseHintLines(values.hints),
        estimatedSteps: parseEstimatedSteps(values.estimatedSteps),
        learningPoint: values.learningPoint,
      },
    });
  };

  return (
    <div
      style={editFormOverlayStyle}
      data-testid={`custom-quest-edit-form-${quest.id satisfies string}`}
      onClick={(e) => e.stopPropagation()}
    >
      <form style={editFormStyle} onSubmit={handleSubmit}>
        {/* タイトル */}
        <div style={editFieldGroupStyle}>
          <label style={editLabelStyle}>タイトル</label>
          <input
            ref={titleRef}
            data-testid="edit-title-input"
            style={
              titleError !== undefined ? editInputErrorStyle : editInputStyle
            }
            value={values.title}
            onChange={(e) => setValues({ ...values, title: e.target.value })}
            onBlur={() => setTitleTouched(true)}
          />
          {titleError !== undefined && (
            <span style={editErrorTextStyle} data-testid="edit-title-error">
              {titleError}
            </span>
          )}
        </div>

        {/* 説明 */}
        <div style={editFieldGroupStyle}>
          <label style={editLabelStyle}>説明</label>
          <textarea
            data-testid="edit-description-input"
            style={editTextareaStyle}
            value={values.description}
            onChange={(e) =>
              setValues({ ...values, description: e.target.value })
            }
            rows={2}
          />
        </div>

        {/* 難易度 */}
        <div style={editFieldGroupStyle}>
          <label style={editLabelStyle}>難易度</label>
          <select
            data-testid="edit-difficulty-select"
            style={editSelectStyle}
            value={values.difficulty}
            onChange={(e) =>
              setValues({
                ...values,
                difficulty: Number(e.target.value) as DifficultyLevel,
              })
            }
          >
            {([1, 2, 3, 4, 5] as const).map((d) => (
              <option key={d} value={d}>
                {`${"★".repeat(d) satisfies string}${"☆".repeat(5 - d) satisfies string}`}
              </option>
            ))}
          </select>
        </div>

        {/* 体系 */}
        <div style={editFieldGroupStyle}>
          <label style={editLabelStyle}>体系</label>
          <select
            data-testid="edit-system-select"
            style={editSelectStyle}
            value={values.systemPresetId}
            onChange={(e) =>
              setValues({
                ...values,
                systemPresetId: e.target.value as SystemPresetId,
              })
            }
          >
            {systemPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        {/* ゴール式 */}
        <div style={editFieldGroupStyle}>
          <label style={editLabelStyle}>ゴール式</label>
          <FormulaListEditor
            formulas={values.goalFormulas}
            onChange={(goalFormulas) => setValues({ ...values, goalFormulas })}
            error={goalsError}
            testId="edit-goals"
          />
        </div>

        {/* ヒント */}
        <div style={editFieldGroupStyle}>
          <label style={editLabelStyle}>ヒント（1行に1つ、任意）</label>
          <textarea
            data-testid="edit-hints-input"
            style={editTextareaStyle}
            value={values.hints}
            onChange={(e) => setValues({ ...values, hints: e.target.value })}
            rows={2}
          />
        </div>

        {/* 推定ステップ数・学習ポイント */}
        <div style={editRowStyle}>
          <div style={{ ...editFieldGroupStyle, flex: 0, minWidth: 120 }}>
            <label style={editLabelStyle}>推定ステップ数（任意）</label>
            <input
              ref={stepsRef}
              data-testid="edit-steps-input"
              style={
                stepsError !== undefined ? editInputErrorStyle : editInputStyle
              }
              type="number"
              min="1"
              placeholder="未指定"
              value={values.estimatedSteps}
              onChange={(e) =>
                setValues({ ...values, estimatedSteps: e.target.value })
              }
              onBlur={() => setStepsTouched(true)}
            />
            {stepsError !== undefined && (
              <span style={editErrorTextStyle} data-testid="edit-steps-error">
                {stepsError}
              </span>
            )}
          </div>
          <div style={{ ...editFieldGroupStyle, flex: 1 }}>
            <label style={editLabelStyle}>学習ポイント</label>
            <input
              data-testid="edit-learning-point-input"
              style={editInputStyle}
              value={values.learningPoint}
              onChange={(e) =>
                setValues({ ...values, learningPoint: e.target.value })
              }
            />
          </div>
        </div>

        {/* ボタン */}
        <div style={editActionsStyle}>
          <button
            type="button"
            data-testid="edit-cancel-btn"
            className={editCancelButtonClassName}
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
          >
            キャンセル
          </button>
          <button
            type="submit"
            data-testid="edit-save-btn"
            className={editSaveButtonClassName}
          >
            保存
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Create form ---

function CustomQuestCreateForm({
  onSave,
  onCancel,
}: {
  readonly onSave: (params: CreateCustomQuestParams) => void;
  readonly onCancel: () => void;
}) {
  const [values, setValues] = useState<EditFormValues>(
    createEmptyEditFormValues,
  );
  const [submitted, setSubmitted] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  const [stepsTouched, setStepsTouched] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const stepsRef = useRef<HTMLInputElement>(null);

  const validation = validateEditForm(values);

  const titleError = shouldShowEditFieldError({
    touched: titleTouched,
    submitted,
    validation,
    field: "title",
  });
  const goalsError = shouldShowEditFieldError({
    touched: false,
    submitted,
    validation,
    field: "goalFormulas",
  });
  const stepsError = shouldShowEditFieldError({
    touched: stepsTouched,
    submitted,
    validation,
    field: "estimatedSteps",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSubmitted(true);

    if (!validation.valid) {
      const firstField = getFirstEditErrorField(validation);
      /* v8 ignore start -- focus routing: all branches tested but v8 inline callback artifact */
      if (firstField === "title") titleRef.current?.focus();
      else if (firstField === "estimatedSteps") stepsRef.current?.focus();
      /* v8 ignore stop */
      return;
    }

    onSave({
      title: values.title,
      description: values.description,
      difficulty: values.difficulty,
      systemPresetId: values.systemPresetId,
      goals: goalFormulasToDefinitions(values.goalFormulas),
      hints: parseHintLines(values.hints),
      estimatedSteps: Number(values.estimatedSteps),
      learningPoint: values.learningPoint,
    });
  };

  return (
    <div
      style={editFormOverlayStyle}
      data-testid="custom-quest-create-form"
      onClick={(e) => e.stopPropagation()}
    >
      <form style={editFormStyle} onSubmit={handleSubmit}>
        {/* タイトル */}
        <div style={editFieldGroupStyle}>
          <label style={editLabelStyle}>タイトル</label>
          <input
            ref={titleRef}
            data-testid="create-title-input"
            style={
              titleError !== undefined ? editInputErrorStyle : editInputStyle
            }
            value={values.title}
            onChange={(e) => setValues({ ...values, title: e.target.value })}
            onBlur={() => setTitleTouched(true)}
          />
          {titleError !== undefined && (
            <span style={editErrorTextStyle} data-testid="create-title-error">
              {titleError}
            </span>
          )}
        </div>

        {/* 説明 */}
        <div style={editFieldGroupStyle}>
          <label style={editLabelStyle}>説明</label>
          <textarea
            data-testid="create-description-input"
            style={editTextareaStyle}
            value={values.description}
            onChange={(e) =>
              setValues({ ...values, description: e.target.value })
            }
            rows={2}
          />
        </div>

        {/* 難易度 */}
        <div style={editFieldGroupStyle}>
          <label style={editLabelStyle}>難易度</label>
          <select
            data-testid="create-difficulty-select"
            style={editSelectStyle}
            value={values.difficulty}
            onChange={(e) =>
              setValues({
                ...values,
                difficulty: Number(e.target.value) as DifficultyLevel,
              })
            }
          >
            {([1, 2, 3, 4, 5] as const).map((d) => (
              <option key={d} value={d}>
                {`${"★".repeat(d) satisfies string}${"☆".repeat(5 - d) satisfies string}`}
              </option>
            ))}
          </select>
        </div>

        {/* 体系 */}
        <div style={editFieldGroupStyle}>
          <label style={editLabelStyle}>体系</label>
          <select
            data-testid="create-system-select"
            style={editSelectStyle}
            value={values.systemPresetId}
            onChange={(e) =>
              setValues({
                ...values,
                systemPresetId: e.target.value as SystemPresetId,
              })
            }
          >
            {systemPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        {/* ゴール式 */}
        <div style={editFieldGroupStyle}>
          <label style={editLabelStyle}>ゴール式</label>
          <FormulaListEditor
            formulas={values.goalFormulas}
            onChange={(goalFormulas) => setValues({ ...values, goalFormulas })}
            error={goalsError}
            testId="create-goals"
          />
        </div>

        {/* ヒント */}
        <div style={editFieldGroupStyle}>
          <label style={editLabelStyle}>ヒント（1行に1つ、任意）</label>
          <textarea
            data-testid="create-hints-input"
            style={editTextareaStyle}
            value={values.hints}
            onChange={(e) => setValues({ ...values, hints: e.target.value })}
            rows={2}
          />
        </div>

        {/* 推定ステップ数・学習ポイント */}
        <div style={editRowStyle}>
          <div style={{ ...editFieldGroupStyle, flex: 0, minWidth: 120 }}>
            <label style={editLabelStyle}>推定ステップ数（任意）</label>
            <input
              ref={stepsRef}
              data-testid="create-steps-input"
              style={
                stepsError !== undefined ? editInputErrorStyle : editInputStyle
              }
              type="number"
              min="1"
              placeholder="未指定"
              value={values.estimatedSteps}
              onChange={(e) =>
                setValues({ ...values, estimatedSteps: e.target.value })
              }
              onBlur={() => setStepsTouched(true)}
            />
            {stepsError !== undefined && (
              <span style={editErrorTextStyle} data-testid="create-steps-error">
                {stepsError}
              </span>
            )}
          </div>
          <div style={{ ...editFieldGroupStyle, flex: 1 }}>
            <label style={editLabelStyle}>学習ポイント</label>
            <input
              data-testid="create-learning-point-input"
              style={editInputStyle}
              value={values.learningPoint}
              onChange={(e) =>
                setValues({ ...values, learningPoint: e.target.value })
              }
            />
          </div>
        </div>

        {/* ボタン */}
        <div style={editActionsStyle}>
          <button
            type="button"
            data-testid="create-cancel-btn"
            className={editCancelButtonClassName}
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
          >
            キャンセル
          </button>
          <button
            type="submit"
            data-testid="create-save-btn"
            className={editSaveButtonClassName}
          >
            作成
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Quest item ---

function CustomQuestItem({
  item,
  onStart,
  onDuplicate,
  onDelete,
  onEdit,
  onExport,
  onShareUrl,
  isEditing,
  onToggleEdit,
}: {
  readonly item: QuestCatalogItem;
  readonly onStart: (questId: QuestId) => void;
  readonly onDuplicate?: (questId: QuestId) => void;
  readonly onDelete?: (questId: QuestId) => void;
  readonly onEdit?: (edit: CustomQuestEditParams) => void;
  readonly onExport?: (questId: QuestId) => void;
  readonly onShareUrl?: (questId: QuestId) => void;
  readonly isEditing: boolean;
  readonly onToggleEdit: (questId: QuestId) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const urlCopiedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(
    () => () => {
      if (urlCopiedTimerRef.current !== undefined) {
        clearTimeout(urlCopiedTimerRef.current);
      }
    },
    [],
  );

  const handleDeleteStart = () => {
    setIsDeleteConfirming(true);
    setIsShareOpen(false);
  };

  const handleDeleteConfirm = () => {
    /* v8 ignore start -- 防御的: onDeleteが存在する場合のみ削除ボタンが表示される */
    if (onDelete === undefined) return;
    /* v8 ignore stop */
    onDelete(item.quest.id);
    setIsDeleteConfirming(false);
  };

  const handleDeleteCancel = () => {
    setIsDeleteConfirming(false);
  };

  const handleShareOpen = () => {
    setIsShareOpen(true);
    setIsDeleteConfirming(false);
    setUrlCopied(false);
  };

  const handleShareClose = () => {
    setIsShareOpen(false);
    setUrlCopied(false);
  };

  const handleShareExport = () => {
    /* v8 ignore start -- 防御的: onExportが存在する場合のみ共有ボタンが表示される */
    if (onExport === undefined) return;
    /* v8 ignore stop */
    onExport(item.quest.id);
  };

  const handleShareUrl = () => {
    /* v8 ignore start -- 防御的: onShareUrlが存在する場合のみ共有ボタンが表示される */
    if (onShareUrl === undefined) return;
    /* v8 ignore stop */
    onShareUrl(item.quest.id);
    setUrlCopied(true);
    if (urlCopiedTimerRef.current !== undefined) {
      clearTimeout(urlCopiedTimerRef.current);
    }
    urlCopiedTimerRef.current = setTimeout(() => {
      setUrlCopied(false);
    }, 2000);
  };

  const hasShareActions = onExport !== undefined || onShareUrl !== undefined;

  return (
    <>
      <div
        data-testid={`custom-quest-item-${item.quest.id satisfies string}`}
        style={{
          ...(isHovered ? questItemHoverStyle : questItemStyle),
          position: "relative" as const,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onStart(item.quest.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onStart(item.quest.id);
          }
        }}
      >
        <div style={questInfoStyle}>
          <div style={questTitleStyle}>{item.quest.title}</div>
          <div style={questDescStyle}>{item.quest.description}</div>
          <div style={questMetaStyle}>
            <DifficultyStars level={item.quest.difficulty} />
            <span style={stepTextStyle}>
              {stepCountText(item.bestStepCount, item.quest.estimatedSteps)}
            </span>
          </div>
        </div>
        <RatingBadge rating={item.rating} />
        <div className={actionGroupClassName}>
          <button
            data-testid={`custom-quest-start-btn-${item.quest.id satisfies string}`}
            className={startButtonClassName}
            onClick={(e) => {
              e.stopPropagation();
              onStart(item.quest.id);
            }}
            title={item.completed ? "再挑戦" : "開始"}
          >
            {item.completed ? "再挑戦" : "開始"}
          </button>
          {onEdit !== undefined && (
            <button
              data-testid={`custom-quest-edit-btn-${item.quest.id satisfies string}`}
              className={actionButtonClassName}
              onClick={(e) => {
                e.stopPropagation();
                onToggleEdit(item.quest.id);
              }}
              title="編集"
            >
              編集
            </button>
          )}
          {hasShareActions && (
            <button
              data-testid={`custom-quest-share-btn-${item.quest.id satisfies string}`}
              className={actionButtonClassName}
              onClick={(e) => {
                e.stopPropagation();
                handleShareOpen();
              }}
              title="共有"
            >
              共有
            </button>
          )}
          {onDuplicate !== undefined && (
            <button
              data-testid={`custom-quest-duplicate-btn-${item.quest.id satisfies string}`}
              className={actionButtonClassName}
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(item.quest.id);
              }}
              title="複製"
            >
              複製
            </button>
          )}
          {onDelete !== undefined && (
            <button
              data-testid={`custom-quest-delete-btn-${item.quest.id satisfies string}`}
              className={deleteButtonClassName}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteStart();
              }}
              title="削除"
            >
              削除
            </button>
          )}
        </div>
        {isShareOpen && (
          <div
            data-testid={`custom-quest-share-panel-${item.quest.id satisfies string}`}
            className={sharePanelOverlayClassName}
            onClick={(e) => e.stopPropagation()}
          >
            <span className={sharePanelTitleClassName}>共有</span>
            {onExport !== undefined && (
              <button
                data-testid={`custom-quest-share-export-btn-${item.quest.id satisfies string}`}
                className={sharePanelBtnClassName}
                onClick={handleShareExport}
              >
                JSONエクスポート
              </button>
            )}
            {onShareUrl !== undefined && (
              <button
                data-testid={`custom-quest-share-url-btn-${item.quest.id satisfies string}`}
                className={
                  urlCopied ? sharePanelCopiedBtnClassName : sharePanelBtnClassName
                }
                onClick={handleShareUrl}
              >
                {urlCopied ? "コピーしました!" : "URLをコピー"}
              </button>
            )}
            <button
              data-testid={`custom-quest-share-close-btn-${item.quest.id satisfies string}`}
              className={sharePanelCloseBtnClassName}
              onClick={handleShareClose}
            >
              閉じる
            </button>
          </div>
        )}
        {isDeleteConfirming && (
          <div
            data-testid={`custom-quest-delete-confirm-${item.quest.id satisfies string}`}
            className={deleteConfirmOverlayClassName}
            onClick={(e) => e.stopPropagation()}
          >
            <span className={deleteConfirmTextClassName}>本当に削除しますか？</span>
            <button
              data-testid={`custom-quest-delete-cancel-btn-${item.quest.id satisfies string}`}
              className={deleteCancelBtnClassName}
              onClick={handleDeleteCancel}
            >
              キャンセル
            </button>
            <button
              data-testid={`custom-quest-delete-confirm-btn-${item.quest.id satisfies string}`}
              className={deleteConfirmBtnClassName}
              onClick={handleDeleteConfirm}
            >
              削除する
            </button>
          </div>
        )}
      </div>
      {isEditing && onEdit !== undefined && (
        <CustomQuestEditForm
          quest={item.quest}
          onSave={(edit) => {
            onEdit(edit);
            onToggleEdit(item.quest.id);
          }}
          onCancel={() => onToggleEdit(item.quest.id)}
        />
      )}
    </>
  );
}

// --- Main component ---

// --- Import form ---

const importFormOverlayStyle: CSSProperties = {
  padding: "16px 14px",
  background: "var(--color-surface, #fff)",
  borderBottom: "1px solid var(--color-quest-card-border)",
};

const importFormStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

function CustomQuestImportForm({
  onImport,
  onCancel,
}: {
  readonly onImport: (jsonString: string) => void;
  readonly onCancel: () => void;
}) {
  const [jsonText, setJsonText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file === undefined) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      /* v8 ignore start -- 防御的: readAsTextは常にstringを返す */
      if (typeof text !== "string") return;
      /* v8 ignore stop */
      setJsonText(text);
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (jsonText.trim() === "") return;
    onImport(jsonText);
  };

  return (
    <div
      style={importFormOverlayStyle}
      data-testid="custom-quest-import-form"
      onClick={(e) => e.stopPropagation()}
    >
      <form style={importFormStyle} onSubmit={handleSubmit}>
        <div style={editFieldGroupStyle}>
          <label style={editLabelStyle}>JSONファイルを選択</label>
          <input
            ref={fileInputRef}
            data-testid="import-file-input"
            type="file"
            accept=".json"
            onChange={handleFileChange}
            style={{ fontSize: 12 }}
          />
        </div>
        <div style={editFieldGroupStyle}>
          <label style={editLabelStyle}>またはJSONを貼り付け</label>
          <textarea
            data-testid="import-json-input"
            style={editTextareaStyle}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={5}
            placeholder={'{\n  "_format": "intro-formal-proof-quest",\n  ...'}
          />
        </div>
        <div style={editActionsStyle}>
          <button
            type="button"
            data-testid="import-cancel-btn"
            className={editCancelButtonClassName}
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
          >
            キャンセル
          </button>
          <button
            type="submit"
            data-testid="import-submit-btn"
            className={editSaveButtonClassName}
            disabled={jsonText.trim() === ""}
          >
            インポート
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Main component ---

export function CustomQuestList({
  items,
  onStartQuest,
  onDuplicateQuest,
  onDeleteQuest,
  onEditQuest,
  onCreateQuest,
  onExportQuest,
  onImportQuest,
  onShareQuestUrl,
}: CustomQuestListProps) {
  const totalCount = getCustomQuestCatalogCount(items);
  const completedCount = getCustomQuestCompletedCount(items);
  const [editingQuestId, setEditingQuestId] = useState<QuestId | undefined>(
    undefined,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleToggleEdit = (questId: QuestId) => {
    setEditingQuestId((prev) => (prev === questId ? undefined : questId));
    setIsCreating(false);
    setIsImporting(false);
  };

  const handleToggleCreate = () => {
    setIsCreating((prev) => !prev);
    setEditingQuestId(undefined);
    setIsImporting(false);
  };

  const handleToggleImport = () => {
    setIsImporting((prev) => !prev);
    setIsCreating(false);
    setEditingQuestId(undefined);
  };

  const handleImport = (jsonString: string) => {
    /* v8 ignore start -- 防御的: onImportQuestが存在する場合のみインポートボタンが表示される */
    if (onImportQuest === undefined) return;
    /* v8 ignore stop */
    onImportQuest(jsonString);
    setIsImporting(false);
  };

  return (
    <div style={sectionStyle} data-testid="custom-quest-list">
      <div style={sectionHeaderStyle}>
        <div style={sectionTitleStyle}>自作クエスト</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={sectionProgressStyle}>
            {customQuestProgressText(completedCount, totalCount)}
          </div>
          {onImportQuest !== undefined && (
            <button
              type="button"
              data-testid="custom-quest-import-btn"
              className={actionButtonClassName}
              onClick={handleToggleImport}
            >
              {isImporting ? "閉じる" : "インポート"}
            </button>
          )}
          {onCreateQuest !== undefined && (
            <button
              type="button"
              data-testid="custom-quest-create-btn"
              className={createButtonClassName}
              onClick={handleToggleCreate}
            >
              {isCreating ? "閉じる" : "新規作成"}
            </button>
          )}
        </div>
      </div>
      {isImporting && onImportQuest !== undefined && (
        <CustomQuestImportForm
          onImport={handleImport}
          onCancel={() => setIsImporting(false)}
        />
      )}
      {isCreating && onCreateQuest !== undefined && (
        <CustomQuestCreateForm
          onSave={(params) => {
            onCreateQuest(params);
            setIsCreating(false);
          }}
          onCancel={() => setIsCreating(false)}
        />
      )}
      {items.length === 0 && !isCreating && !isImporting ? (
        <div style={emptyStyle} data-testid="custom-quest-list-empty">
          自作クエストはまだありません。
        </div>
      ) : (
        items.length > 0 && (
          <div style={questListStyle}>
            {items.map((item) => (
              <CustomQuestItem
                key={item.quest.id}
                item={item}
                onStart={onStartQuest}
                onDuplicate={onDuplicateQuest}
                onDelete={onDeleteQuest}
                onEdit={onEditQuest}
                onExport={onExportQuest}
                onShareUrl={onShareQuestUrl}
                isEditing={editingQuestId === item.quest.id}
                onToggleEdit={handleToggleEdit}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
