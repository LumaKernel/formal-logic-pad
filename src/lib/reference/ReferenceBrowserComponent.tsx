/**
 * リファレンスブラウザコンポーネント。
 *
 * カテゴリフィルタ・テキスト検索・エントリ一覧を表示し、
 * エントリクリックでReferenceModalを開く。
 *
 * 変更時は ReferenceBrowserComponent.test.tsx も同期すること。
 */

import { useState, useCallback, useMemo, type CSSProperties } from "react";
import type { ReferenceEntry, Locale } from "./referenceEntry";
import { ReferenceModal } from "./ReferenceModal";
import {
  filterEntries,
  buildCategoryBadges,
  buildEntryListItems,
  setSearchQuery,
  toggleCategory,
  initialBrowserState,
  type ReferenceBrowserState,
} from "./referenceBrowserLogic";

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
  /** data-testid */
  readonly testId?: string;
};

// --- Styles ---

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const searchBarStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const searchInputStyle: CSSProperties = {
  flex: 1,
  padding: "10px 14px",
  fontSize: 14,
  border: "1px solid var(--color-border, #e0e0e0)",
  borderRadius: 8,
  background: "var(--color-surface, #fff)",
  color: "var(--color-text-primary, #333)",
  outline: "none",
  fontFamily: "var(--font-ui)",
};

const categoryBarStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const categoryBadgeBaseStyle: CSSProperties = {
  padding: "5px 12px",
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 16,
  cursor: "pointer",
  border: "1px solid var(--color-border, #ddd)",
  background: "var(--color-surface, #fff)",
  color: "var(--color-text-secondary, #666)",
  transition: "all 0.15s",
  fontFamily: "var(--font-ui)",
};

const categoryBadgeSelectedStyle: CSSProperties = {
  ...categoryBadgeBaseStyle,
  background: "var(--color-accent, #555ab9)",
  color: "#fff",
  border: "1px solid var(--color-accent, #555ab9)",
};

const countBadgeStyle: CSSProperties = {
  display: "inline-block",
  marginLeft: 4,
  fontSize: 10,
  opacity: 0.7,
};

const entryListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const entryItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  padding: "12px 14px",
  borderRadius: 8,
  cursor: "pointer",
  border: "1px solid var(--color-border, #e0e0e0)",
  background: "var(--color-surface, #fff)",
  transition: "background-color 0.1s, border-color 0.1s",
  textAlign: "left",
  fontFamily: "var(--font-ui)",
  width: "100%",
};

const entryTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--color-text-primary, #333)",
  marginBottom: 2,
};

const entrySummaryStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--color-text-secondary, #666)",
  lineHeight: 1.5,
};

const entryCategoryStyle: CSSProperties = {
  display: "inline-block",
  fontSize: 10,
  fontWeight: 600,
  color: "var(--color-badge-text, #718096)",
  backgroundColor: "var(--color-badge-bg, #e8eaf0)",
  borderRadius: 4,
  padding: "2px 6px",
  whiteSpace: "nowrap",
  flexShrink: 0,
  marginTop: 2,
};

const emptyStyle: CSSProperties = {
  textAlign: "center",
  padding: "40px 20px",
  color: "var(--color-text-secondary, #666)",
  fontSize: 14,
};

const resultCountStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--color-text-secondary, #999)",
  marginBottom: 4,
};

// --- Component ---

export function ReferenceBrowserComponent({
  entries,
  locale,
  searchPlaceholder = "Search reference…",
  emptyMessage = "No matching entries found.",
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

  const detailEntry = useMemo(
    () =>
      detailEntryId !== null
        ? entries.find((e) => e.id === detailEntryId)
        : undefined,
    [entries, detailEntryId],
  );

  return (
    <div style={containerStyle} data-testid={testId}>
      {/* Search bar */}
      <div style={searchBarStyle}>
        <input
          type="text"
          value={state.searchQuery}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
          style={searchInputStyle}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-search`
              : undefined
          }
        />
      </div>

      {/* Category filter badges */}
      <div style={categoryBarStyle}>
        {categoryBadges.map((badge) => (
          <button
            key={badge.id}
            type="button"
            style={
              badge.isSelected
                ? categoryBadgeSelectedStyle
                : categoryBadgeBaseStyle
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
            <span style={countBadgeStyle}>({badge.count})</span>
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
              style={entryItemStyle}
              onClick={() => {
                handleEntryClick(item.id);
              }}
              data-testid={
                testId !== undefined
                  ? `${testId satisfies string}-entry-${item.id satisfies string}`
                  : undefined
              }
            >
              <span style={entryCategoryStyle}>{item.categoryLabel}</span>
              <div>
                <div style={entryTitleStyle}>{item.title}</div>
                <div style={entrySummaryStyle}>{item.summary}</div>
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
