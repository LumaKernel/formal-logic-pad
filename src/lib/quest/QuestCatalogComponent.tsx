/**
 * クエストカタログ一覧UIコンポーネント。
 *
 * カテゴリ別にグループ化されたクエスト一覧を表示する。
 * 難易度フィルタ・完了状態フィルタ機能付き。
 * 制御コンポーネント: カタログデータは外部で生成して渡す。
 *
 * 変更時は QuestCatalogComponent.test.tsx, QuestCatalogComponent.stories.tsx も同期すること。
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type CSSProperties,
} from "react";
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
import {
  getQuestReferenceCount,
  type QuestReferenceMap,
} from "./questReferenceMappingLogic";

// --- Props ---

export type QuestCatalogProps = {
  readonly groups: readonly CategoryGroup[];
  readonly onStartQuest: (questId: QuestId) => void;
  /** クエストIDごとのノートブック数（指定するとノートブック数バッジを表示） */
  readonly notebookCounts?: QuestNotebookCounts;
  /** ノートブック数クリック時のコールバック（ノート一覧を絞り込み表示） */
  readonly onShowQuestNotebooks?: (questId: QuestId) => void;
  /** ビルトインクエストを自作クエストに複製するコールバック */
  readonly onDuplicateToCustom?: (questId: QuestId) => void;
  /** 模範解答を表示するコールバック */
  readonly onShowModelAnswer?: (questId: QuestId) => void;
  /** クエストIDからリファレンスエントリIDへの逆マッピング（指定するとドキュメントバッジを表示） */
  readonly questReferenceMap?: QuestReferenceMap;
  /** ドキュメントバッジクリック時のコールバック（リファレンスを表示） */
  readonly onShowReference?: (questId: QuestId) => void;
};

// --- Styles ---

const containerStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
  padding: 16,
  fontFamily: "var(--font-ui)",
};

const filterBarStyle: Readonly<CSSProperties> = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  alignItems: "center",
  padding: "10px 14px",
  borderRadius: 8,
  background: "var(--color-quest-chapter-bg)",
  border: "1px solid var(--color-quest-chapter-border)",
};

const filterLabelStyle: Readonly<CSSProperties> = {
  fontSize: 11,
  color: "var(--color-text-secondary, #888)",
  fontWeight: 700,
  letterSpacing: "0.03em",
  textTransform: "uppercase",
};

const filterButtonStyle: Readonly<CSSProperties> = {
  padding: "4px 10px",
  fontSize: "11px",
  borderRadius: "9999px",
  border: "1px solid var(--color-quest-filter-border)",
  background: "var(--color-quest-filter-bg)",
  color: "var(--ui-foreground)",
  cursor: "pointer",
  transitionProperty: "all",
  transitionDuration: "150ms",
  fontWeight: 500,
};

const filterButtonActiveStyle: Readonly<CSSProperties> = {
  padding: "4px 10px",
  fontSize: "11px",
  borderRadius: "9999px",
  border: "1px solid var(--color-quest-filter-active-border)",
  background: "var(--color-quest-filter-active-bg)",
  color: "white",
  cursor: "pointer",
  transitionProperty: "all",
  transitionDuration: "150ms",
  fontWeight: 600,
};

const categoryContainerStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  gap: 0,
};

const categoryHeaderStyle: Readonly<CSSProperties> = {
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

const chapterNumberStyle: Readonly<CSSProperties> = {
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

const categoryTitleStyle: Readonly<CSSProperties> = {
  fontSize: 15,
  fontWeight: 700,
  color: "var(--color-text-primary, #333)",
};

const categoryDescStyle: Readonly<CSSProperties> = {
  fontSize: 11,
  color: "var(--color-text-secondary, #888)",
  marginTop: 2,
};

const progressContainerStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 4,
  flexShrink: 0,
};

const categoryProgressStyle: Readonly<CSSProperties> = {
  fontSize: 12,
  color: "var(--color-text-secondary, #666)",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const progressBarOuterStyle: Readonly<CSSProperties> = {
  width: 60,
  height: 4,
  borderRadius: 2,
  background: "var(--color-quest-progress-bar-bg)",
  overflow: "hidden",
};

const questListStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  gap: 0,
  borderRight: "1px solid var(--color-quest-card-border)",
  borderBottom: "1px solid var(--color-quest-card-border)",
  borderLeft: "1px solid var(--color-quest-card-border)",
  borderRadius: "0 0 8px 8px",
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

const notebookCountBadgeStyle: Readonly<CSSProperties> = {
  display: "inline-flex",
  alignItems: "center",
  gap: "2px",
  fontSize: "10px",
  fontWeight: 600,
  padding: "2px 8px",
  borderRadius: "9999px",
  background: "var(--color-quest-notebook-badge-bg, #e8eaf6)",
  color: "var(--color-quest-notebook-badge-text, #3949ab)",
  cursor: "pointer",
  whiteSpace: "nowrap",
  transitionProperty: "color, background-color, border-color",
  transitionDuration: "150ms",
  border: "none",
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

const moreButtonStyle: Readonly<CSSProperties> = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  borderRadius: "9999px",
  border: "none",
  background: "transparent",
  color: "var(--ui-muted-foreground)",
  cursor: "pointer",
  flexShrink: 0,
  fontSize: "1rem",
  lineHeight: 1,
  transitionProperty: "color, background-color, border-color",
  transitionDuration: "150ms",
};

const moreMenuStyle: Readonly<CSSProperties> = {
  position: "absolute",
  right: 0,
  top: "100%",
  zIndex: 1000,
  minWidth: "140px",
  background: "var(--ui-card)",
  border: "1px solid var(--ui-border)",
  borderRadius: "6px",
  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
  padding: "4px 0",
};

const moreMenuItemStyle: Readonly<CSSProperties> = {
  display: "block",
  width: "100%",
  padding: "6px 14px",
  fontSize: "0.75rem",
  fontWeight: 500,
  border: "none",
  background: "transparent",
  color: "var(--ui-foreground)",
  cursor: "pointer",
  textAlign: "left",
  transitionProperty: "color, background-color, border-color",
  transitionDuration: "150ms",
  whiteSpace: "nowrap",
};

const emptyStyle: Readonly<CSSProperties> = {
  textAlign: "center",
  padding: 32,
  color: "var(--color-text-secondary, #999)",
  fontSize: 13,
  background: "var(--color-quest-empty-bg)",
  borderRadius: 8,
  border: "1px solid var(--color-quest-chapter-border)",
};

const referenceDocBadgeStyle: Readonly<CSSProperties> = {
  display: "inline-flex",
  alignItems: "center",
  gap: "2px",
  fontSize: "10px",
  fontWeight: 600,
  padding: "2px 8px",
  borderRadius: "9999px",
  background: "var(--color-quest-reference-badge-bg, #e8f5e9)",
  color: "var(--color-quest-reference-badge-text, #2e7d32)",
  cursor: "pointer",
  whiteSpace: "nowrap",
  transitionProperty: "color, background-color, border-color",
  transitionDuration: "150ms",
  border: "none",
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
  /* v8 ignore start -- 防御的コード: applyFiltersToGroupsがtotal=0のグループを除外するため到達不能 */
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  /* v8 ignore stop */
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

function ReferenceDocBadge({
  count,
  questId,
  onShow,
}: {
  readonly count: number;
  readonly questId: QuestId;
  readonly onShow?: (questId: QuestId) => void;
}) {
  if (count === 0) {
    return null;
  }
  return (
    <button
      data-testid={`reference-doc-${questId satisfies string}`}
      style={referenceDocBadgeStyle}
      onClick={(e) => {
        e.stopPropagation();
        onShow?.(questId);
      }}
      title={`関連ドキュメント: ${String(count) satisfies string}件`}
    >
      {"\uD83D\uDCC4"}
      {String(count) satisfies string}
    </button>
  );
}

function QuestItemMoreMenu({
  questId,
  onDuplicateToCustom,
  onShowModelAnswer,
}: {
  readonly questId: QuestId;
  readonly onDuplicateToCustom?: (questId: QuestId) => void;
  readonly onShowModelAnswer?: (questId: QuestId) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const hasActions =
    onDuplicateToCustom !== undefined || onShowModelAnswer !== undefined;

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  }, []);

  // 外側クリックで閉じる
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current !== null &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!hasActions) return null;

  return (
    <div
      ref={menuRef}
      style={{ position: "relative", flexShrink: 0 }}
      data-testid={`quest-more-menu-${questId satisfies string}`}
    >
      <button
        data-testid={`quest-more-btn-${questId satisfies string}`}
        className="quest-more-btn"
        style={moreButtonStyle}
        onClick={handleToggle}
        title="その他のアクション"
        aria-label="その他のアクション"
      >
        {"\u22EE"}
      </button>
      {open && (
        <div
          style={moreMenuStyle}
          data-testid={`quest-more-dropdown-${questId satisfies string}`}
        >
          {onShowModelAnswer !== undefined && (
            <button
              data-testid={`show-model-answer-btn-${questId satisfies string}`}
              className="quest-more-menu-item"
              style={moreMenuItemStyle}
              onClick={(e) => {
                e.stopPropagation();
                onShowModelAnswer(questId);
                setOpen(false);
              }}
            >
              模範解答を表示
            </button>
          )}
          {onDuplicateToCustom !== undefined && (
            <button
              data-testid={`duplicate-to-custom-btn-${questId satisfies string}`}
              className="quest-more-menu-item"
              style={moreMenuItemStyle}
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateToCustom(questId);
                setOpen(false);
              }}
            >
              自作に複製
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function QuestItem({
  item,
  onStart,
  notebookCount,
  onShowNotebooks,
  onDuplicateToCustom,
  onShowModelAnswer,
  referenceCount,
  onShowReference,
  isLast,
}: {
  readonly item: QuestCatalogItem;
  readonly onStart: (questId: QuestId) => void;
  readonly notebookCount: number;
  readonly onShowNotebooks?: (questId: QuestId) => void;
  readonly onDuplicateToCustom?: (questId: QuestId) => void;
  readonly onShowModelAnswer?: (questId: QuestId) => void;
  readonly referenceCount: number;
  readonly onShowReference?: (questId: QuestId) => void;
  readonly isLast: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const baseStyle = isHovered ? questItemHoverStyle : questItemStyle;
  const style: CSSProperties = isLast
    ? { ...baseStyle, borderRadius: "0 0 8px 8px" }
    : baseStyle;

  return (
    <div
      data-testid={`quest-item-${item.quest.id satisfies string}`}
      style={style}
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
          <ReferenceDocBadge
            count={referenceCount}
            questId={item.quest.id}
            onShow={onShowReference}
          />
        </div>
      </div>
      <RatingBadge rating={item.rating} />
      <QuestItemMoreMenu
        questId={item.quest.id}
        onDuplicateToCustom={onDuplicateToCustom}
        onShowModelAnswer={onShowModelAnswer}
      />
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
  onDuplicateToCustom,
  onShowModelAnswer,
  questReferenceMap,
  onShowReference,
}: {
  readonly group: CategoryGroup;
  readonly chapterNumber: number;
  readonly onStart: (questId: QuestId) => void;
  readonly notebookCounts?: QuestNotebookCounts;
  readonly onShowNotebooks?: (questId: QuestId) => void;
  readonly onDuplicateToCustom?: (questId: QuestId) => void;
  readonly onShowModelAnswer?: (questId: QuestId) => void;
  readonly questReferenceMap?: QuestReferenceMap;
  readonly onShowReference?: (questId: QuestId) => void;
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
        {group.items.map((item, index) => (
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
            onDuplicateToCustom={onDuplicateToCustom}
            onShowModelAnswer={onShowModelAnswer}
            referenceCount={
              questReferenceMap
                ? getQuestReferenceCount(questReferenceMap, item.quest.id)
                : 0
            }
            onShowReference={onShowReference}
            isLast={index === group.items.length - 1}
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
  onDuplicateToCustom,
  onShowModelAnswer,
  questReferenceMap,
  onShowReference,
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
            onDuplicateToCustom={onDuplicateToCustom}
            onShowModelAnswer={onShowModelAnswer}
            questReferenceMap={questReferenceMap}
            onShowReference={onShowReference}
          />
        ))
      )}
    </div>
  );
}
