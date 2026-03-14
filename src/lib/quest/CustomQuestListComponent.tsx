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

const sectionStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  gap: 0,
  marginTop: 24,
};

const sectionHeaderStyle: Readonly<CSSProperties> = {
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

const sectionTitleStyle: Readonly<CSSProperties> = {
  fontSize: 15,
  fontWeight: 700,
  color: "var(--color-text-primary, #333)",
};

const sectionProgressStyle: Readonly<CSSProperties> = {
  fontSize: 12,
  color: "var(--color-text-secondary, #666)",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const questListStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  gap: 0,
  borderRight: "1px solid var(--color-quest-card-border)",
  borderBottom: "1px solid var(--color-quest-card-border)",
  borderLeft: "1px solid var(--color-quest-card-border)",
  borderRadius: "0 0 8px 8px",
  overflow: "hidden",
};

const questItemStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "center",
  padding: "10px 14px",
  background: "var(--color-quest-card-bg)",
  cursor: "pointer",
  transition: "background 0.15s, box-shadow 0.15s",
  gap: 10,
  borderBottom: "1px solid var(--color-quest-card-border)",
};

const questItemHoverStyle: Readonly<CSSProperties> = {
  ...questItemStyle,
  background: "var(--color-quest-card-hover-bg)",
  boxShadow: "inset 3px 0 0 var(--color-quest-filter-active-bg)",
};

const questInfoStyle: Readonly<CSSProperties> = {
  flex: 1,
  minWidth: 0,
};

const questTitleStyle: Readonly<CSSProperties> = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--color-text-primary, #333)",
};

const questDescStyle: Readonly<CSSProperties> = {
  fontSize: 11,
  color: "var(--color-text-secondary, #888)",
  marginTop: 2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const questMetaStyle: Readonly<CSSProperties> = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  marginTop: 4,
};

const difficultyBadgeStyle: Readonly<CSSProperties> = {
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

const starStyle: Readonly<CSSProperties> = {
  fontSize: 9,
  lineHeight: 1,
};

const stepTextStyle: Readonly<CSSProperties> = {
  fontSize: 10,
  color: "var(--color-text-secondary, #999)",
};

const ratingBadgeBaseStyle: Readonly<CSSProperties> = {
  fontSize: 10,
  fontWeight: 700,
  padding: "2px 8px",
  borderRadius: 10,
  whiteSpace: "nowrap",
};

const startButtonStyle: Readonly<CSSProperties> = {
  padding: "6px 12px",
  fontSize: "11px",
  fontWeight: 600,
  borderRadius: "6px",
  border: "none",
  background: "var(--color-quest-start-bg)",
  color: "white",
  cursor: "pointer",
  flexShrink: 0,
  transitionProperty: "color, background-color, border-color",
  transitionDuration: "150ms",
};

const actionButtonStyle: Readonly<CSSProperties> = {
  padding: "4px 8px",
  fontSize: "10px",
  fontWeight: 600,
  borderRadius: "4px",
  border: "1px solid var(--ui-border)",
  background: "transparent",
  color: "var(--ui-muted-foreground)",
  cursor: "pointer",
  flexShrink: 0,
  transitionProperty: "color, background-color, border-color",
  transitionDuration: "150ms",
};

const deleteButtonStyle: Readonly<CSSProperties> = {
  padding: "4px 8px",
  fontSize: "10px",
  fontWeight: 600,
  borderRadius: "4px",
  border:
    "1px solid color-mix(in srgb, var(--ui-destructive) 60%, transparent)",
  background: "transparent",
  color: "var(--ui-destructive)",
  cursor: "pointer",
  flexShrink: 0,
  transitionProperty: "color, background-color, border-color",
  transitionDuration: "150ms",
};

const deleteConfirmOverlayStyle: Readonly<CSSProperties> = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  background: "var(--color-quest-card-bg, rgba(255,253,248,0.97))",
  zIndex: 1,
  padding: "0 18px",
};

const deleteConfirmTextStyle: Readonly<CSSProperties> = {
  fontSize: "13px",
  color: "var(--ui-destructive)",
  fontWeight: 600,
  flex: 1,
  textAlign: "center",
};

const deleteConfirmBtnStyle: Readonly<CSSProperties> = {
  padding: "6px 14px",
  fontSize: "0.75rem",
  borderRadius: "6px",
  border:
    "1px solid color-mix(in srgb, var(--ui-destructive) 40%, transparent)",
  background: "var(--ui-destructive)",
  color: "var(--ui-destructive-foreground)",
  cursor: "pointer",
  fontWeight: 600,
};

const deleteCancelBtnStyle: Readonly<CSSProperties> = {
  padding: "6px 14px",
  fontSize: "0.75rem",
  borderRadius: "6px",
  border: "1px solid var(--ui-border)",
  background: "var(--ui-card)",
  color: "var(--ui-foreground)",
  cursor: "pointer",
};

const sharePanelOverlayStyle: Readonly<CSSProperties> = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  background: "var(--color-quest-card-bg, rgba(255,253,248,0.97))",
  zIndex: 1,
  padding: "0 18px",
};

const sharePanelTitleStyle: Readonly<CSSProperties> = {
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--ui-foreground)",
  flexShrink: 0,
};

const sharePanelBtnStyle: Readonly<CSSProperties> = {
  padding: "6px 14px",
  fontSize: "0.75rem",
  borderRadius: "6px",
  border: "1px solid var(--ui-border)",
  background: "var(--ui-card)",
  color: "var(--ui-foreground)",
  cursor: "pointer",
  fontWeight: 600,
  transitionProperty: "color, background-color, border-color",
  transitionDuration: "150ms",
};

const sharePanelCopiedBtnStyle: Readonly<CSSProperties> = {
  padding: "6px 14px",
  fontSize: "0.75rem",
  borderRadius: "6px",
  border: "1px solid var(--color-quest-start-bg, #4caf50)",
  background: "var(--color-quest-start-bg, #4caf50)",
  color: "white",
  cursor: "pointer",
  fontWeight: 600,
  transitionProperty: "color, background-color, border-color",
  transitionDuration: "150ms",
};

const sharePanelCloseBtnStyle: Readonly<CSSProperties> = {
  padding: "6px 10px",
  fontSize: "0.75rem",
  borderRadius: "6px",
  border: "1px solid var(--ui-border)",
  background: "transparent",
  color: "var(--ui-muted-foreground)",
  cursor: "pointer",
};

const actionGroupStyle: Readonly<CSSProperties> = {
  display: "flex",
  gap: "4px",
  alignItems: "center",
};

const createButtonStyle: Readonly<CSSProperties> = {
  padding: "6px 14px",
  fontSize: "11px",
  fontWeight: 600,
  borderRadius: "4px",
  border: "none",
  background: "var(--color-quest-start-bg)",
  color: "white",
  cursor: "pointer",
  flexShrink: 0,
  transitionProperty: "color, background-color, border-color",
  transitionDuration: "150ms",
};

const emptyStyle: Readonly<CSSProperties> = {
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

const editFormOverlayStyle: Readonly<CSSProperties> = {
  padding: "16px 14px",
  background: "var(--ui-card)",
  borderBottom: "1px solid var(--color-quest-card-border)",
};

const editFormStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const editFieldGroupStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
};

const editLabelStyle: Readonly<CSSProperties> = {
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--ui-muted-foreground)",
};

const editInputStyle: Readonly<CSSProperties> = {
  fontSize: "0.75rem",
  padding: "6px 10px",
  border: "1px solid var(--ui-border)",
  borderRadius: "4px",
  outline: "none",
  background: "var(--ui-card)",
  color: "var(--ui-foreground)",
};

const editInputErrorStyle: Readonly<CSSProperties> = {
  fontSize: "0.75rem",
  padding: "6px 10px",
  border: "1px solid var(--ui-destructive)",
  borderRadius: "4px",
  outline: "none",
  background: "var(--ui-card)",
  color: "var(--ui-foreground)",
};

const editTextareaStyle: Readonly<CSSProperties> = {
  fontSize: "0.75rem",
  padding: "6px 10px",
  border: "1px solid var(--ui-border)",
  borderRadius: "4px",
  outline: "none",
  background: "var(--ui-card)",
  color: "var(--ui-foreground)",
  resize: "vertical",
  minHeight: "60px",
  fontFamily: "inherit",
};

const editSelectStyle: Readonly<CSSProperties> = {
  fontSize: "0.75rem",
  padding: "6px 10px",
  border: "1px solid var(--ui-border)",
  borderRadius: "4px",
  outline: "none",
  background: "var(--ui-card)",
  color: "var(--ui-foreground)",
  cursor: "pointer",
};

const editErrorTextStyle: Readonly<CSSProperties> = {
  fontSize: "10px",
  color: "var(--ui-destructive)",
};

const editRowStyle: Readonly<CSSProperties> = {
  display: "flex",
  gap: "8px",
};

const editActionsStyle: Readonly<CSSProperties> = {
  display: "flex",
  gap: "6px",
  justifyContent: "flex-end",
  marginTop: "4px",
};

const editSaveButtonStyle: Readonly<CSSProperties> = {
  padding: "6px 14px",
  fontSize: "11px",
  fontWeight: 600,
  borderRadius: "4px",
  border: "none",
  background: "var(--color-quest-start-bg)",
  color: "white",
  cursor: "pointer",
};

const editCancelButtonStyle: Readonly<CSSProperties> = {
  padding: "6px 14px",
  fontSize: "11px",
  fontWeight: 600,
  borderRadius: "4px",
  border: "1px solid var(--ui-border)",
  background: "transparent",
  color: "var(--ui-muted-foreground)",
  cursor: "pointer",
};

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
          <div
            style={{ ...editFieldGroupStyle, flexShrink: 0, minWidth: "120px" }}
          >
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
            style={editCancelButtonStyle}
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
            style={editSaveButtonStyle}
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
          <div
            style={{ ...editFieldGroupStyle, flexShrink: 0, minWidth: "120px" }}
          >
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
            style={editCancelButtonStyle}
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
            style={editSaveButtonStyle}
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
          position: "relative",
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
        <div style={actionGroupStyle}>
          <button
            data-testid={`custom-quest-start-btn-${item.quest.id satisfies string}`}
            style={startButtonStyle}
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
              className="custom-quest-action-btn"
              style={actionButtonStyle}
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
              className="custom-quest-action-btn"
              style={actionButtonStyle}
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
              className="custom-quest-action-btn"
              style={actionButtonStyle}
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
              className="custom-quest-delete-btn"
              style={deleteButtonStyle}
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
            style={sharePanelOverlayStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <span style={sharePanelTitleStyle}>共有</span>
            {onExport !== undefined && (
              <button
                data-testid={`custom-quest-share-export-btn-${item.quest.id satisfies string}`}
                style={sharePanelBtnStyle}
                onClick={handleShareExport}
              >
                JSONエクスポート
              </button>
            )}
            {onShareUrl !== undefined && (
              <button
                data-testid={`custom-quest-share-url-btn-${item.quest.id satisfies string}`}
                style={
                  urlCopied ? sharePanelCopiedBtnStyle : sharePanelBtnStyle
                }
                onClick={handleShareUrl}
              >
                {urlCopied ? "コピーしました!" : "URLをコピー"}
              </button>
            )}
            <button
              data-testid={`custom-quest-share-close-btn-${item.quest.id satisfies string}`}
              style={sharePanelCloseBtnStyle}
              onClick={handleShareClose}
            >
              閉じる
            </button>
          </div>
        )}
        {isDeleteConfirming && (
          <div
            data-testid={`custom-quest-delete-confirm-${item.quest.id satisfies string}`}
            style={deleteConfirmOverlayStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <span style={deleteConfirmTextStyle}>本当に削除しますか？</span>
            <button
              data-testid={`custom-quest-delete-cancel-btn-${item.quest.id satisfies string}`}
              style={deleteCancelBtnStyle}
              onClick={handleDeleteCancel}
            >
              キャンセル
            </button>
            <button
              data-testid={`custom-quest-delete-confirm-btn-${item.quest.id satisfies string}`}
              style={deleteConfirmBtnStyle}
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

const importFormOverlayStyle: Readonly<CSSProperties> = {
  padding: "16px 14px",
  background: "var(--ui-card)",
  borderBottom: "1px solid var(--color-quest-card-border)",
};

const importFormStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
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
            style={{ fontSize: "0.75rem" }}
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
            style={editCancelButtonStyle}
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
            style={editSaveButtonStyle}
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
              className="custom-quest-action-btn"
              style={actionButtonStyle}
              onClick={handleToggleImport}
            >
              {isImporting ? "閉じる" : "インポート"}
            </button>
          )}
          {onCreateQuest !== undefined && (
            <button
              type="button"
              data-testid="custom-quest-create-btn"
              style={createButtonStyle}
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
