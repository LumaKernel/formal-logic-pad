/**
 * リファレンスブラウザコンポーネント。
 *
 * カテゴリフィルタ・テキスト検索・エントリ一覧を表示し、
 * エントリクリックでReferenceModalを開く。
 *
 * 変更時は ReferenceBrowserComponent.test.tsx も同期すること。
 */

import { useState, useCallback, useMemo } from "react";
import type { ReferenceEntry, Locale } from "./referenceEntry";
import { ReferenceModal, type RelatedQuestInfo } from "./ReferenceModal";
import {
  filterEntries,
  buildCategoryBadges,
  buildEntryListItems,
  setSearchQuery,
  toggleCategory,
  initialBrowserState,
  type ReferenceBrowserState,
} from "./referenceBrowserLogic";
import { InlineMarkdown } from "./InlineMarkdown";

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
    <div className="flex flex-col gap-4" data-testid={testId}>
      {/* Search bar */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={state.searchQuery}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
          className="flex-1 px-3.5 py-2.5 text-sm border border-ui-border rounded-lg bg-card text-foreground outline-none focus:ring-2 focus:ring-ring"
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-search`
              : undefined
          }
        />
      </div>

      {/* Category filter badges */}
      <div className="flex gap-1.5 flex-wrap">
        {categoryBadges.map((badge) => (
          <button
            key={badge.id}
            type="button"
            className={
              badge.isSelected
                ? "px-3 py-1 text-xs font-semibold rounded-full cursor-pointer border border-primary bg-primary text-primary-foreground transition-all duration-150"
                : "px-3 py-1 text-xs font-semibold rounded-full cursor-pointer border border-ui-border bg-card text-muted-foreground transition-all duration-150 hover:bg-muted"
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
            <span className="inline-block ml-1 text-[10px] opacity-70">
              ({badge.count})
            </span>
          </button>
        ))}
      </div>

      {/* Result count */}
      <div
        className="text-xs text-muted-foreground mb-1"
        data-testid={
          testId !== undefined ? `${testId satisfies string}-count` : undefined
        }
      >
        {entryItems.length} / {entries.length}
      </div>

      {/* Entry list */}
      {entryItems.length === 0 ? (
        <div
          className="text-center py-10 px-5 text-muted-foreground text-sm"
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-empty`
              : undefined
          }
        >
          {emptyMessage}
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {entryItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex items-start gap-3 px-3.5 py-3 rounded-lg cursor-pointer border border-ui-border bg-card transition-colors duration-100 text-left w-full hover:bg-muted"
              onClick={() => {
                handleEntryClick(item.id);
              }}
              data-testid={
                testId !== undefined
                  ? `${testId satisfies string}-entry-${item.id satisfies string}`
                  : undefined
              }
            >
              <span className="inline-block text-[10px] font-semibold text-muted-foreground bg-muted rounded px-1.5 py-0.5 whitespace-nowrap shrink-0 mt-0.5">
                {item.categoryLabel}
              </span>
              <div>
                <div className="text-sm font-semibold text-foreground mb-0.5">
                  {item.title}
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">
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
