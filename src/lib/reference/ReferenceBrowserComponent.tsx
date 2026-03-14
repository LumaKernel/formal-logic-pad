/**
 * リファレンスブラウザコンポーネント。
 *
 * カテゴリフィルタ・テキスト検索・エントリ一覧を表示し、
 * エントリクリックでReferenceModalを開く。
 *
 * 変更時は ReferenceBrowserComponent.test.tsx も同期すること。
 */

import { useState, useCallback, useMemo } from "react";
import type { CSSProperties } from "react";
import type { ReferenceEntry, Locale } from "./referenceEntry";
import { ReferenceModal, type RelatedQuestInfo } from "./ReferenceModal";
import {
  filterEntries,
  buildCategoryBadges,
  buildEntryListItems,
  buildGuideCards,
  isInitialState,
  setSearchQuery,
  toggleCategory,
  initialBrowserState,
  type ReferenceBrowserState,
} from "./referenceBrowserLogic";
import { InlineMarkdown } from "./InlineMarkdown";

// --- Styles ---

const rootStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const guideSectionStyle: Readonly<CSSProperties> = {
  borderRadius: "12px",
  border: "1px solid var(--ui-border)",
  backgroundColor: "var(--ui-card)",
  padding: "16px",
};

const guideTitleStyle: Readonly<CSSProperties> = {
  fontSize: "13px",
  fontWeight: 700,
  color: "var(--ui-foreground)",
  marginBottom: "2px",
};

const guideDescStyle: Readonly<CSSProperties> = {
  fontSize: "11px",
  color: "var(--ui-muted-foreground)",
  marginBottom: "12px",
};

const guideListStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const guideCardButtonStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  paddingLeft: "12px",
  paddingRight: "12px",
  paddingTop: "10px",
  paddingBottom: "10px",
  borderRadius: "8px",
  cursor: "pointer",
  border: "1px solid var(--ui-border)",
  backgroundColor: "var(--ui-background)",
  transitionProperty: "color, background-color, border-color",
  transitionDuration: "100ms",
  textAlign: "left",
  width: "100%",
};

const guideNumberStyle: Readonly<CSSProperties> = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "24px",
  height: "24px",
  borderRadius: "9999px",
  backgroundColor: "var(--ui-primary)",
  color: "var(--ui-primary-foreground)",
  fontSize: "11px",
  fontWeight: 700,
  flexShrink: 0,
  marginTop: "2px",
};

const guideCardContentStyle: Readonly<CSSProperties> = {
  minWidth: 0,
};

const guideCardTitleStyle: Readonly<CSSProperties> = {
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--ui-foreground)",
};

const guideCardSummaryStyle: Readonly<CSSProperties> = {
  fontSize: "11px",
  color: "var(--ui-muted-foreground)",
  lineHeight: 1.625,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const searchBarStyle: Readonly<CSSProperties> = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
};

const searchInputStyle: Readonly<CSSProperties> = {
  flex: 1,
  paddingLeft: "14px",
  paddingRight: "14px",
  paddingTop: "10px",
  paddingBottom: "10px",
  fontSize: "13px",
  border: "1px solid var(--ui-border)",
  borderRadius: "8px",
  backgroundColor: "var(--ui-card)",
  color: "var(--ui-foreground)",
  outline: "none",
};

const categoryWrapStyle: Readonly<CSSProperties> = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap",
};

const categoryBadgeBaseStyle: Readonly<CSSProperties> = {
  paddingLeft: "12px",
  paddingRight: "12px",
  paddingTop: "4px",
  paddingBottom: "4px",
  fontSize: "11px",
  fontWeight: 600,
  borderRadius: "9999px",
  cursor: "pointer",
  transitionProperty: "all",
  transitionDuration: "150ms",
};

const categoryBadgeSelectedStyle: Readonly<CSSProperties> = {
  ...categoryBadgeBaseStyle,
  border: "1px solid var(--ui-primary)",
  backgroundColor: "var(--ui-primary)",
  color: "var(--ui-primary-foreground)",
};

const categoryBadgeUnselectedStyle: Readonly<CSSProperties> = {
  ...categoryBadgeBaseStyle,
  border: "1px solid var(--ui-border)",
  backgroundColor: "var(--ui-card)",
  color: "var(--ui-muted-foreground)",
};

const badgeCountStyle: Readonly<CSSProperties> = {
  display: "inline-block",
  marginLeft: "4px",
  fontSize: "10px",
  opacity: 0.7,
};

const resultCountStyle: Readonly<CSSProperties> = {
  fontSize: "11px",
  color: "var(--ui-muted-foreground)",
  marginBottom: "4px",
};

const emptyStyle: Readonly<CSSProperties> = {
  textAlign: "center",
  paddingTop: "40px",
  paddingBottom: "40px",
  paddingLeft: "20px",
  paddingRight: "20px",
  color: "var(--ui-muted-foreground)",
  fontSize: "13px",
};

const entryListStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
};

const entryButtonStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  paddingLeft: "14px",
  paddingRight: "14px",
  paddingTop: "12px",
  paddingBottom: "12px",
  borderRadius: "8px",
  cursor: "pointer",
  border: "1px solid var(--ui-border)",
  backgroundColor: "var(--ui-card)",
  transitionProperty: "color, background-color, border-color",
  transitionDuration: "100ms",
  textAlign: "left",
  width: "100%",
};

const entryCategoryBadgeStyle: Readonly<CSSProperties> = {
  display: "inline-block",
  fontSize: "10px",
  fontWeight: 600,
  color: "var(--ui-muted-foreground)",
  backgroundColor: "var(--ui-muted)",
  borderRadius: "4px",
  paddingLeft: "6px",
  paddingRight: "6px",
  paddingTop: "2px",
  paddingBottom: "2px",
  whiteSpace: "nowrap",
  flexShrink: 0,
  marginTop: "2px",
};

const entryTitleStyle: Readonly<CSSProperties> = {
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--ui-foreground)",
  marginBottom: "2px",
};

const entrySummaryStyle: Readonly<CSSProperties> = {
  fontSize: "11px",
  color: "var(--ui-muted-foreground)",
  lineHeight: 1.625,
};

// --- Props ---

export type ReferenceBrowserProps = {
  /** 全リファレンスエントリ */
  readonly entries: readonly ReferenceEntry[];
  /** ロケール */
  readonly locale: Locale;
  /** 検索プレースホルダー */
  readonly searchPlaceholder?: string;
  /** 結果なしメッセージ */
  readonly emptyMessage?: string;
  /** ガイドセクションのタイトル */
  readonly guideSectionTitle?: string;
  /** ガイドセクションの説明文 */
  readonly guideSectionDescription?: string;
  /** クエストIDからタイトルを解決する関数（undefinedなら非表示） */
  readonly resolveQuestTitle?: (questId: string) => string | undefined;
  /** クエスト開始コールバック */
  readonly onStartQuest?: (questId: string) => void;
  /** data-testid */
  readonly testId?: string;
};

// --- Component ---

export function ReferenceBrowserComponent({
  entries,
  locale,
  searchPlaceholder = "Search reference…",
  emptyMessage = "No matching entries found.",
  guideSectionTitle = "Getting Started",
  guideSectionDescription = "New to formal logic? Start here.",
  resolveQuestTitle,
  onStartQuest,
  testId,
}: ReferenceBrowserProps) {
  const [state, setState] =
    useState<ReferenceBrowserState>(initialBrowserState);
  const [detailEntryId, setDetailEntryId] = useState<string | null>(null);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setState((prev) => setSearchQuery(prev, e.target.value));
    },
    [],
  );

  const handleCategoryClick = useCallback((categoryId: string) => {
    setState((prev) =>
      toggleCategory(prev, categoryId as Parameters<typeof toggleCategory>[1]),
    );
  }, []);

  const handleEntryClick = useCallback((entryId: string) => {
    setDetailEntryId(entryId);
  }, []);

  const handleCloseModal = useCallback(() => {
    setDetailEntryId(null);
  }, []);

  const handleNavigate = useCallback((entryId: string) => {
    setDetailEntryId(entryId);
  }, []);

  // Computed data
  const filteredEntries = useMemo(
    () => filterEntries(entries, state, locale),
    [entries, state, locale],
  );

  const categoryBadges = useMemo(
    () => buildCategoryBadges(entries, state.selectedCategory, locale),
    [entries, state.selectedCategory, locale],
  );

  const entryItems = useMemo(
    () => buildEntryListItems(filteredEntries, locale),
    [filteredEntries, locale],
  );

  const guideCards = useMemo(
    () => buildGuideCards(entries, locale),
    [entries, locale],
  );

  const showGuideSection = isInitialState(state) && guideCards.length > 0;

  const detailEntry = useMemo(
    () =>
      detailEntryId !== null
        ? entries.find((e) => e.id === detailEntryId)
        : undefined,
    [entries, detailEntryId],
  );

  const relatedQuests: readonly RelatedQuestInfo[] | undefined = useMemo(() => {
    if (
      detailEntry === undefined ||
      resolveQuestTitle === undefined ||
      onStartQuest === undefined
    )
      return undefined;
    const questIds = detailEntry.relatedQuestIds ?? [];
    const resolved: RelatedQuestInfo[] = [];
    for (const qid of questIds) {
      const title = resolveQuestTitle(qid);
      if (title !== undefined) {
        resolved.push({ id: qid, title });
      }
    }
    return resolved.length > 0 ? resolved : undefined;
  }, [detailEntry, resolveQuestTitle, onStartQuest]);

  return (
    <div style={rootStyle} data-testid={testId}>
      {/* Guide section */}
      {showGuideSection && (
        <div
          style={guideSectionStyle}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-guide-section`
              : undefined
          }
        >
          <div style={guideTitleStyle}>{guideSectionTitle}</div>
          <div style={guideDescStyle}>{guideSectionDescription}</div>
          <div style={guideListStyle}>
            {guideCards.map((card, i) => (
              <button
                key={card.id}
                type="button"
                className="ref-browser-guide-card"
                style={guideCardButtonStyle}
                onClick={() => {
                  handleEntryClick(card.id);
                }}
                data-testid={
                  testId !== undefined
                    ? `${testId satisfies string}-guide-${card.id satisfies string}`
                    : undefined
                }
              >
                <span style={guideNumberStyle}>{i + 1}</span>
                <div style={guideCardContentStyle}>
                  <div style={guideCardTitleStyle}>{card.title}</div>
                  <div style={guideCardSummaryStyle}>
                    <InlineMarkdown text={card.summary} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search bar */}
      <div style={searchBarStyle}>
        <input
          type="text"
          value={state.searchQuery}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
          className="ref-browser-search-input"
          style={searchInputStyle}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-search`
              : undefined
          }
        />
      </div>

      {/* Category filter badges */}
      <div style={categoryWrapStyle}>
        {categoryBadges.map((badge) => (
          <button
            key={badge.id}
            type="button"
            className={
              badge.isSelected ? undefined : "ref-browser-category-badge"
            }
            style={
              badge.isSelected
                ? categoryBadgeSelectedStyle
                : categoryBadgeUnselectedStyle
            }
            onClick={() => {
              handleCategoryClick(badge.id);
            }}
            data-testid={
              testId !== undefined
                ? `${testId satisfies string}-category-${badge.id satisfies string}`
                : undefined
            }
          >
            {badge.label}
            <span style={badgeCountStyle}>({badge.count})</span>
          </button>
        ))}
      </div>

      {/* Result count */}
      <div
        style={resultCountStyle}
        data-testid={
          testId !== undefined ? `${testId satisfies string}-count` : undefined
        }
      >
        {entryItems.length} / {entries.length}
      </div>

      {/* Entry list */}
      {entryItems.length === 0 ? (
        <div
          style={emptyStyle}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-empty`
              : undefined
          }
        >
          {emptyMessage}
        </div>
      ) : (
        <div style={entryListStyle}>
          {entryItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="ref-browser-entry-card"
              style={entryButtonStyle}
              onClick={() => {
                handleEntryClick(item.id);
              }}
              data-testid={
                testId !== undefined
                  ? `${testId satisfies string}-entry-${item.id satisfies string}`
                  : undefined
              }
            >
              <span style={entryCategoryBadgeStyle}>{item.categoryLabel}</span>
              <div>
                <div style={entryTitleStyle}>{item.title}</div>
                <div style={entrySummaryStyle}>
                  <InlineMarkdown text={item.summary} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {detailEntry !== undefined && (
        <ReferenceModal
          entry={detailEntry}
          allEntries={entries}
          locale={locale}
          onClose={handleCloseModal}
          onNavigate={handleNavigate}
          relatedQuests={relatedQuests}
          onStartQuest={onStartQuest}
          testId={
            testId !== undefined
              ? `${testId satisfies string}-modal`
              : undefined
          }
        />
      )}
    </div>
  );
}
