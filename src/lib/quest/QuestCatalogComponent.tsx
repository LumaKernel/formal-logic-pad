/**
 * クエストカタログ一覧UIコンポーネント。
 *
 * カテゴリ別にグループ化されたクエスト一覧を表示する。
 * 難易度フィルタ・完了状態フィルタ機能付き。
 * 制御コンポーネント: カタログデータは外部で生成して渡す。
 *
 * 変更時は QuestCatalogComponent.test.tsx, QuestCatalogComponent.stories.tsx も同期すること。
 */

import { useState, type CSSProperties } from "react";
import type { QuestCatalogItem, CategoryGroup } from "./questCatalog";
import type { QuestId, DifficultyLevel } from "./questDefinition";
import {
  applyFiltersToGroups,
  defaultFilterState,
  difficultyShortLabel,
  ratingLabel,
  ratingCssVars,
  categoryProgressText,
  stepCountText,
  completionFilterOptions,
  difficultyFilterOptions,
  difficultyStars,
  type CatalogFilterState,
  type CompletionFilter,
} from "./questCatalogListLogic";
import {
  getNotebookCountForQuest,
  notebookCountText,
  type QuestNotebookCounts,
} from "./questNotebookFilterLogic";

// --- Props ---

export type QuestCatalogProps = {
  readonly groups: readonly CategoryGroup[];
  readonly onStartQuest: (questId: QuestId) => void;
  /** クエストIDごとのノートブック数（指定するとノートブック数バッジを表示） */
  readonly notebookCounts?: QuestNotebookCounts;
  /** ノートブック数クリック時のコールバック（ノート一覧を絞り込み表示） */
  readonly onShowQuestNotebooks?: (questId: QuestId) => void;
};

// --- Styles ---

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
  padding: 16,
  fontFamily: "var(--font-ui)",
};

const filterBarStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  alignItems: "center",
  padding: "10px 14px",
  borderRadius: 8,
  background: "var(--color-quest-chapter-bg)",
  border: "1px solid var(--color-quest-chapter-border)",
};

const filterLabelStyle: CSSProperties = {
  fontSize: 11,
  color: "var(--color-text-secondary, #888)",
  fontWeight: 700,
  letterSpacing: "0.03em",
  textTransform: "uppercase" as const,
};

const filterButtonStyle: CSSProperties = {
  padding: "4px 10px",
  fontSize: 11,
  borderRadius: 10,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "var(--color-quest-filter-border)",
  background: "var(--color-quest-filter-bg)",
  color: "var(--color-text-primary, #333)",
  cursor: "pointer",
  transition: "all 0.15s",
  fontWeight: 500,
};

const filterButtonActiveStyle: CSSProperties = {
  ...filterButtonStyle,
  background: "var(--color-quest-filter-active-bg)",
  color: "#fff",
  borderColor: "var(--color-quest-filter-active-border)",
  fontWeight: 600,
};

const categoryContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 0,
};

const categoryHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  borderRadius: "8px 8px 0 0",
  background: "var(--color-quest-chapter-bg)",
  border: "1px solid var(--color-quest-chapter-border)",
  borderBottom: "2px solid var(--color-quest-chapter-rule)",
};

const chapterNumberStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "var(--color-quest-chapter-number)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 700,
  marginRight: 10,
  flexShrink: 0,
};

const categoryTitleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: "var(--color-text-primary, #333)",
};

const categoryDescStyle: CSSProperties = {
  fontSize: 11,
  color: "var(--color-text-secondary, #888)",
  marginTop: 2,
};

const progressContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 4,
  flexShrink: 0,
};

const categoryProgressStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--color-text-secondary, #666)",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const progressBarOuterStyle: CSSProperties = {
  width: 60,
  height: 4,
  borderRadius: 2,
  background: "var(--color-quest-progress-bar-bg)",
  overflow: "hidden",
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

const notebookCountBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 3,
  fontSize: 10,
  fontWeight: 600,
  padding: "2px 8px",
  borderRadius: 10,
  background: "var(--color-quest-notebook-badge-bg, #e8eaf6)",
  color: "var(--color-quest-notebook-badge-text, #3949ab)",
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "background 0.15s",
  border: "none",
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

const emptyStyle: CSSProperties = {
  textAlign: "center",
  padding: 32,
  color: "var(--color-text-secondary, #999)",
  fontSize: 13,
  background: "var(--color-quest-empty-bg)",
  borderRadius: 8,
  border: "1px solid var(--color-quest-chapter-border)",
};

// --- Sub-components ---

function DifficultyStars({ level }: { readonly level: DifficultyLevel }) {
  const stars = difficultyStars(level);
  return (
    <span data-testid="difficulty-stars" style={difficultyBadgeStyle}>
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
  return (
    <span data-testid="rating-badge" style={style}>
      {ratingLabel(rating)}
    </span>
  );
}

function ProgressBar({
  completed,
  total,
}: {
  readonly completed: number;
  readonly total: number;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div style={progressBarOuterStyle} data-testid="progress-bar">
      <div
        style={{
          width: `${String(pct) satisfies string}%`,
          height: "100%",
          borderRadius: 2,
          background: "var(--color-quest-progress-bar-fill)",
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}

function NotebookCountBadge({
  count,
  questId,
  onShow,
}: {
  readonly count: number;
  readonly questId: QuestId;
  readonly onShow?: (questId: QuestId) => void;
}) {
  const text = notebookCountText(count);
  if (text === "") {
    return null;
  }
  return (
    <button
      data-testid={`notebook-count-${questId satisfies string}`}
      style={notebookCountBadgeStyle}
      onClick={(e) => {
        e.stopPropagation();
        onShow?.(questId);
      }}
      title={`このクエストのノート: ${text satisfies string}`}
    >
      {text}
    </button>
  );
}

function QuestItem({
  item,
  onStart,
  notebookCount,
  onShowNotebooks,
}: {
  readonly item: QuestCatalogItem;
  readonly onStart: (questId: QuestId) => void;
  readonly notebookCount: number;
  readonly onShowNotebooks?: (questId: QuestId) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      data-testid={`quest-item-${item.quest.id satisfies string}`}
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
          <NotebookCountBadge
            count={notebookCount}
            questId={item.quest.id}
            onShow={onShowNotebooks}
          />
        </div>
      </div>
      <RatingBadge rating={item.rating} />
      <button
        data-testid={`start-btn-${item.quest.id satisfies string}`}
        style={startButtonStyle}
        onClick={(e) => {
          e.stopPropagation();
          onStart(item.quest.id);
        }}
        title={item.completed ? "再挑戦" : "開始"}
      >
        {item.completed ? "再挑戦" : "開始"}
      </button>
    </div>
  );
}

function CategorySection({
  group,
  chapterNumber,
  onStart,
  notebookCounts,
  onShowNotebooks,
}: {
  readonly group: CategoryGroup;
  readonly chapterNumber: number;
  readonly onStart: (questId: QuestId) => void;
  readonly notebookCounts?: QuestNotebookCounts;
  readonly onShowNotebooks?: (questId: QuestId) => void;
}) {
  return (
    <div
      data-testid={`category-${group.category.id satisfies string}`}
      style={categoryContainerStyle}
    >
      <div style={categoryHeaderStyle}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span
            style={chapterNumberStyle}
            data-testid={`chapter-number-${String(chapterNumber) satisfies string}`}
          >
            {chapterNumber}
          </span>
          <div>
            <div style={categoryTitleStyle}>{group.category.label}</div>
            <div style={categoryDescStyle}>{group.category.description}</div>
          </div>
        </div>
        <div style={progressContainerStyle}>
          <div style={categoryProgressStyle}>
            {categoryProgressText(group.completedCount, group.totalCount)}
          </div>
          <ProgressBar
            completed={group.completedCount}
            total={group.totalCount}
          />
        </div>
      </div>
      <div style={questListStyle}>
        {group.items.map((item) => (
          <QuestItem
            key={item.quest.id}
            item={item}
            onStart={onStart}
            notebookCount={
              notebookCounts
                ? getNotebookCountForQuest(notebookCounts, item.quest.id)
                : 0
            }
            onShowNotebooks={onShowNotebooks}
          />
        ))}
      </div>
    </div>
  );
}

// --- Main component ---

export function QuestCatalog({
  groups,
  onStartQuest,
  notebookCounts,
  onShowQuestNotebooks,
}: QuestCatalogProps) {
  const [filter, setFilter] = useState<CatalogFilterState>(defaultFilterState);

  const filteredGroups = applyFiltersToGroups(groups, filter);

  const handleDifficultyChange = (difficulty: DifficultyLevel | null) => {
    setFilter((prev) => ({ ...prev, difficulty }));
  };

  const handleCompletionChange = (completion: CompletionFilter) => {
    setFilter((prev) => ({ ...prev, completion }));
  };

  return (
    <div style={containerStyle} data-testid="quest-catalog">
      {/* フィルタバー */}
      <div style={filterBarStyle} data-testid="filter-bar">
        <span style={filterLabelStyle}>難易度:</span>
        {difficultyFilterOptions.map((opt) => (
          <button
            key={String(opt.value)}
            data-testid={`difficulty-filter-${String(opt.value) satisfies string}`}
            style={
              filter.difficulty === opt.value
                ? filterButtonActiveStyle
                : filterButtonStyle
            }
            onClick={() => handleDifficultyChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
        <span style={{ ...filterLabelStyle, marginLeft: 12 }}>状態:</span>
        {completionFilterOptions.map((opt) => (
          <button
            key={opt.value}
            data-testid={`completion-filter-${opt.value satisfies string}`}
            style={
              filter.completion === opt.value
                ? filterButtonActiveStyle
                : filterButtonStyle
            }
            onClick={() => handleCompletionChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* カテゴリ別クエスト一覧 */}
      {filteredGroups.length === 0 ? (
        <div style={emptyStyle} data-testid="quest-catalog-empty">
          条件に合うクエストがありません。
        </div>
      ) : (
        filteredGroups.map((group, index) => (
          <CategorySection
            key={group.category.id}
            group={group}
            chapterNumber={index + 1}
            onStart={onStartQuest}
            notebookCounts={notebookCounts}
            onShowNotebooks={onShowQuestNotebooks}
          />
        ))
      )}
    </div>
  );
}
