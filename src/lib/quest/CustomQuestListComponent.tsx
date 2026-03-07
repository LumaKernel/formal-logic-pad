/**
 * 自作クエスト一覧UIコンポーネント。
 *
 * ビルトインクエストとは分離された、フラットリスト形式の自作クエスト一覧。
 * QuestCatalogComponent と同様のアイテム表示だが、カテゴリグループ化なし。
 * 編集ボタンで各クエストのインライン編集フォームを表示する。
 *
 * 変更時は CustomQuestListComponent.stories.tsx, index.ts も同期すること。
 */

import { useState, useRef, type CSSProperties } from "react";
import type { QuestCatalogItem } from "./questCatalog";
import type {
  QuestId,
  DifficultyLevel,
  QuestCategory,
  SystemPresetId,
  QuestDefinition,
} from "./questDefinition";
import { questCategories } from "./questDefinition";
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
  goalsTextToDefinitions,
  parseHintLines,
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
  border: "1px solid var(--color-quest-chapter-border)",
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
  border: "1px solid var(--color-quest-card-border)",
  borderTop: "none",
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

const startButtonStyle: CSSProperties = {
  padding: "5px 12px",
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 6,
  border: "none",
  background: "var(--color-quest-start-bg)",
  color: "#fff",
  cursor: "pointer",
  flexShrink: 0,
  transition: "background 0.15s",
};

const actionButtonStyle: CSSProperties = {
  padding: "4px 8px",
  fontSize: 10,
  fontWeight: 600,
  borderRadius: 4,
  border: "1px solid var(--color-border, #ccc)",
  background: "transparent",
  color: "var(--color-text-secondary, #666)",
  cursor: "pointer",
  flexShrink: 0,
  transition: "background 0.15s, color 0.15s",
};

const deleteButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  color: "var(--color-error, #d32f2f)",
  borderColor: "var(--color-error, #d32f2f)",
};

const actionGroupStyle: CSSProperties = {
  display: "flex",
  gap: 4,
  alignItems: "center",
};

const createButtonStyle: CSSProperties = {
  padding: "5px 14px",
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 4,
  border: "none",
  background: "var(--color-quest-start-bg)",
  color: "#fff",
  cursor: "pointer",
  flexShrink: 0,
  transition: "background 0.15s",
};

const emptyStyle: CSSProperties = {
  textAlign: "center",
  padding: 32,
  color: "var(--color-text-secondary, #999)",
  fontSize: 13,
  background: "var(--color-quest-empty-bg)",
  borderRadius: "0 0 8px 8px",
  border: "1px solid var(--color-quest-chapter-border)",
  borderTop: "none",
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

const editTextareaErrorStyle: CSSProperties = {
  ...editTextareaStyle,
  border: "1px solid var(--color-error, #d32f2f)",
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

const editSaveButtonStyle: CSSProperties = {
  padding: "5px 14px",
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 4,
  border: "none",
  background: "var(--color-quest-start-bg)",
  color: "#fff",
  cursor: "pointer",
};

const editCancelButtonStyle: CSSProperties = {
  padding: "5px 14px",
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 4,
  border: "1px solid var(--color-border, #ccc)",
  background: "transparent",
  color: "var(--color-text-secondary, #666)",
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
  const [goalsTouched, setGoalsTouched] = useState(false);
  const [stepsTouched, setStepsTouched] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const goalsRef = useRef<HTMLTextAreaElement>(null);
  const stepsRef = useRef<HTMLInputElement>(null);

  const validation = validateEditForm(values);

  const titleError = shouldShowEditFieldError({
    touched: titleTouched,
    submitted,
    validation,
    field: "title",
  });
  const goalsError = shouldShowEditFieldError({
    touched: goalsTouched,
    submitted,
    validation,
    field: "goalsText",
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
      if (firstField === "title") titleRef.current?.focus();
      else if (firstField === "goalsText") goalsRef.current?.focus();
      else if (firstField === "estimatedSteps") stepsRef.current?.focus();
      return;
    }

    onSave({
      questId: quest.id,
      params: {
        title: values.title,
        description: values.description,
        category: values.category,
        difficulty: values.difficulty,
        systemPresetId: values.systemPresetId,
        goals: goalsTextToDefinitions(values.goalsText),
        hints: parseHintLines(values.hints),
        estimatedSteps: Number(values.estimatedSteps),
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

        {/* カテゴリ・難易度 */}
        <div style={editRowStyle}>
          <div style={{ ...editFieldGroupStyle, flex: 1 }}>
            <label style={editLabelStyle}>カテゴリ</label>
            <select
              data-testid="edit-category-select"
              style={editSelectStyle}
              value={values.category}
              onChange={(e) =>
                setValues({
                  ...values,
                  category: e.target.value as QuestCategory,
                })
              }
            >
              {questCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ ...editFieldGroupStyle, flex: 0, minWidth: 100 }}>
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
          <label style={editLabelStyle}>ゴール式（1行に1つ）</label>
          <textarea
            ref={goalsRef}
            data-testid="edit-goals-input"
            style={
              goalsError !== undefined
                ? editTextareaErrorStyle
                : editTextareaStyle
            }
            value={values.goalsText}
            onChange={(e) =>
              setValues({ ...values, goalsText: e.target.value })
            }
            onBlur={() => setGoalsTouched(true)}
            rows={3}
          />
          {goalsError !== undefined && (
            <span style={editErrorTextStyle} data-testid="edit-goals-error">
              {goalsError}
            </span>
          )}
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
            <label style={editLabelStyle}>推定ステップ数</label>
            <input
              ref={stepsRef}
              data-testid="edit-steps-input"
              style={
                stepsError !== undefined ? editInputErrorStyle : editInputStyle
              }
              type="number"
              min="1"
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
  const [goalsTouched, setGoalsTouched] = useState(false);
  const [stepsTouched, setStepsTouched] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const goalsRef = useRef<HTMLTextAreaElement>(null);
  const stepsRef = useRef<HTMLInputElement>(null);

  const validation = validateEditForm(values);

  const titleError = shouldShowEditFieldError({
    touched: titleTouched,
    submitted,
    validation,
    field: "title",
  });
  const goalsError = shouldShowEditFieldError({
    touched: goalsTouched,
    submitted,
    validation,
    field: "goalsText",
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
      if (firstField === "title") titleRef.current?.focus();
      else if (firstField === "goalsText") goalsRef.current?.focus();
      else if (firstField === "estimatedSteps") stepsRef.current?.focus();
      return;
    }

    onSave({
      title: values.title,
      description: values.description,
      category: values.category,
      difficulty: values.difficulty,
      systemPresetId: values.systemPresetId,
      goals: goalsTextToDefinitions(values.goalsText),
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

        {/* カテゴリ・難易度 */}
        <div style={editRowStyle}>
          <div style={{ ...editFieldGroupStyle, flex: 1 }}>
            <label style={editLabelStyle}>カテゴリ</label>
            <select
              data-testid="create-category-select"
              style={editSelectStyle}
              value={values.category}
              onChange={(e) =>
                setValues({
                  ...values,
                  category: e.target.value as QuestCategory,
                })
              }
            >
              {questCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ ...editFieldGroupStyle, flex: 0, minWidth: 100 }}>
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
          <label style={editLabelStyle}>ゴール式（1行に1つ）</label>
          <textarea
            ref={goalsRef}
            data-testid="create-goals-input"
            style={
              goalsError !== undefined
                ? editTextareaErrorStyle
                : editTextareaStyle
            }
            value={values.goalsText}
            onChange={(e) =>
              setValues({ ...values, goalsText: e.target.value })
            }
            onBlur={() => setGoalsTouched(true)}
            rows={3}
          />
          {goalsError !== undefined && (
            <span style={editErrorTextStyle} data-testid="create-goals-error">
              {goalsError}
            </span>
          )}
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
            <label style={editLabelStyle}>推定ステップ数</label>
            <input
              ref={stepsRef}
              data-testid="create-steps-input"
              style={
                stepsError !== undefined ? editInputErrorStyle : editInputStyle
              }
              type="number"
              min="1"
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

  return (
    <>
      <div
        data-testid={`custom-quest-item-${item.quest.id satisfies string}`}
        style={isHovered ? questItemHoverStyle : questItemStyle}
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
          {onExport !== undefined && (
            <button
              data-testid={`custom-quest-export-btn-${item.quest.id satisfies string}`}
              style={actionButtonStyle}
              onClick={(e) => {
                e.stopPropagation();
                onExport(item.quest.id);
              }}
              title="エクスポート"
            >
              JSON
            </button>
          )}
          {onShareUrl !== undefined && (
            <button
              data-testid={`custom-quest-share-btn-${item.quest.id satisfies string}`}
              style={actionButtonStyle}
              onClick={(e) => {
                e.stopPropagation();
                onShareUrl(item.quest.id);
              }}
              title="URL共有"
            >
              URL
            </button>
          )}
          {onDuplicate !== undefined && (
            <button
              data-testid={`custom-quest-duplicate-btn-${item.quest.id satisfies string}`}
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
              style={deleteButtonStyle}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.quest.id);
              }}
              title="削除"
            >
              削除
            </button>
          )}
        </div>
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
      if (typeof text === "string") {
        setJsonText(text);
      }
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
    if (onImportQuest === undefined) return;
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
