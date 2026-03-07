/**
 * 自作クエスト一覧UIコンポーネント。
 *
 * ビルトインクエストとは分離された、フラットリスト形式の自作クエスト一覧。
 * QuestCatalogComponent と同様のアイテム表示だが、カテゴリグループ化なし。
 *
 * 変更時は CustomQuestListComponent.test.tsx, index.ts も同期すること。
 */

import { useState, type CSSProperties } from "react";
import type { QuestCatalogItem } from "./questCatalog";
import type { QuestId, DifficultyLevel } from "./questDefinition";
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

// --- Props ---

export type CustomQuestListProps = {
  readonly items: readonly QuestCatalogItem[];
  readonly onStartQuest: (questId: QuestId) => void;
  readonly onDuplicateQuest?: (questId: QuestId) => void;
  readonly onDeleteQuest?: (questId: QuestId) => void;
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

function CustomQuestItem({
  item,
  onStart,
  onDuplicate,
  onDelete,
}: {
  readonly item: QuestCatalogItem;
  readonly onStart: (questId: QuestId) => void;
  readonly onDuplicate?: (questId: QuestId) => void;
  readonly onDelete?: (questId: QuestId) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
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
  );
}

// --- Main component ---

export function CustomQuestList({
  items,
  onStartQuest,
  onDuplicateQuest,
  onDeleteQuest,
}: CustomQuestListProps) {
  const totalCount = getCustomQuestCatalogCount(items);
  const completedCount = getCustomQuestCompletedCount(items);

  return (
    <div style={sectionStyle} data-testid="custom-quest-list">
      <div style={sectionHeaderStyle}>
        <div style={sectionTitleStyle}>自作クエスト</div>
        <div style={sectionProgressStyle}>
          {customQuestProgressText(completedCount, totalCount)}
        </div>
      </div>
      {items.length === 0 ? (
        <div style={emptyStyle} data-testid="custom-quest-list-empty">
          自作クエストはまだありません。
        </div>
      ) : (
        <div style={questListStyle}>
          {items.map((item) => (
            <CustomQuestItem
              key={item.quest.id}
              item={item}
              onStart={onStartQuest}
              onDuplicate={onDuplicateQuest}
              onDelete={onDeleteQuest}
            />
          ))}
        </div>
      )}
    </div>
  );
}
