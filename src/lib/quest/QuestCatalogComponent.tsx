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
  difficultyLabel,
  difficultyShortLabel,
  ratingLabel,
  ratingColor,
  categoryProgressText,
  stepCountText,
  completionFilterOptions,
  difficultyFilterOptions,
  type CatalogFilterState,
  type CompletionFilter,
} from "./questCatalogListLogic";

// --- Props ---

export type QuestCatalogProps = {
  readonly groups: readonly CategoryGroup[];
  readonly onStartQuest: (questId: QuestId) => void;
};

// --- Styles ---

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  padding: 16,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const filterBarStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

const filterLabelStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--color-text-secondary, #888)",
  fontWeight: 600,
};

const filterButtonStyle: CSSProperties = {
  padding: "4px 10px",
  fontSize: 12,
  borderRadius: 12,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "var(--color-border, #ddd)",
  background: "var(--color-surface, #fff)",
  color: "var(--color-text-primary, #333)",
  cursor: "pointer",
  transition: "all 0.15s",
};

const filterButtonActiveStyle: CSSProperties = {
  ...filterButtonStyle,
  background: "var(--color-primary, #1976d2)",
  color: "#fff",
  borderColor: "var(--color-primary, #1976d2)",
};

const categoryHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 12px",
  borderRadius: 8,
  background: "var(--color-surface-alt, #f5f5f5)",
};

const categoryTitleStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: "var(--color-text-primary, #333)",
};

const categoryDescStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--color-text-secondary, #888)",
  marginTop: 2,
};

const categoryProgressStyle: CSSProperties = {
  fontSize: 13,
  color: "var(--color-text-secondary, #666)",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const questListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  paddingLeft: 8,
};

const questItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid var(--color-border, #e0e0e0)",
  background: "var(--color-surface, #fff)",
  cursor: "pointer",
  transition: "background 0.15s",
  gap: 10,
};

const questItemHoverStyle: CSSProperties = {
  ...questItemStyle,
  background: "var(--color-surface-hover, #f5f5f5)",
};

const questInfoStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const questTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--color-text-primary, #333)",
};

const questDescStyle: CSSProperties = {
  fontSize: 12,
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
  fontSize: 10,
  padding: "2px 6px",
  borderRadius: 4,
  fontWeight: 600,
  background: "var(--color-badge-difficulty-bg, #e3f2fd)",
  color: "var(--color-badge-difficulty-text, #1565c0)",
};

const stepTextStyle: CSSProperties = {
  fontSize: 11,
  color: "var(--color-text-secondary, #999)",
};

const ratingBadgeBaseStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  padding: "2px 8px",
  borderRadius: 4,
  whiteSpace: "nowrap",
};

const startButtonStyle: CSSProperties = {
  padding: "6px 14px",
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 6,
  border: "none",
  background: "var(--color-primary, #1976d2)",
  color: "#fff",
  cursor: "pointer",
  flexShrink: 0,
  transition: "opacity 0.15s",
};

const emptyStyle: CSSProperties = {
  textAlign: "center",
  padding: 32,
  color: "var(--color-text-secondary, #999)",
  fontSize: 14,
};

// --- Sub-components ---

function RatingBadge({
  rating,
}: {
  readonly rating: QuestCatalogItem["rating"];
}) {
  const color = ratingColor(rating);
  const style: CSSProperties = {
    ...ratingBadgeBaseStyle,
    color,
    background:
      rating === "not-completed"
        ? "var(--color-surface-alt, #f5f5f5)"
        : `${color satisfies string}20`,
  };
  return (
    <span data-testid="rating-badge" style={style}>
      {ratingLabel(rating)}
    </span>
  );
}

function QuestItem({
  item,
  onStart,
}: {
  readonly item: QuestCatalogItem;
  readonly onStart: (questId: QuestId) => void;
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
          <span style={difficultyBadgeStyle}>
            {difficultyShortLabel(item.quest.difficulty)}{" "}
            {difficultyLabel(item.quest.difficulty)}
          </span>
          <span style={stepTextStyle}>
            {stepCountText(item.bestStepCount, item.quest.estimatedSteps)}
          </span>
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
  onStart,
}: {
  readonly group: CategoryGroup;
  readonly onStart: (questId: QuestId) => void;
}) {
  return (
    <div data-testid={`category-${group.category.id satisfies string}`}>
      <div style={categoryHeaderStyle}>
        <div>
          <div style={categoryTitleStyle}>{group.category.label}</div>
          <div style={categoryDescStyle}>{group.category.description}</div>
        </div>
        <div style={categoryProgressStyle}>
          {categoryProgressText(group.completedCount, group.totalCount)}
        </div>
      </div>
      <div style={questListStyle}>
        {group.items.map((item) => (
          <QuestItem key={item.quest.id} item={item} onStart={onStart} />
        ))}
      </div>
    </div>
  );
}

// --- Main component ---

export function QuestCatalog({ groups, onStartQuest }: QuestCatalogProps) {
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
        <span style={{ ...filterLabelStyle, marginLeft: 8 }}>状態:</span>
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
        filteredGroups.map((group) => (
          <CategorySection
            key={group.category.id}
            group={group}
            onStart={onStartQuest}
          />
        ))
      )}
    </div>
  );
}
