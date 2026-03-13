/**
 * Hub ページのプレゼンテーション層。
 *
 * ルーター・localStorage 等の不純な依存を持たず、
 * props で状態とコールバックを受け取る。
 * Storybook でモックデータを注入して各状態を表示・テスト可能。
 *
 * 変更時は HubContent.tsx, HubPageView.stories.tsx も同期すること。
 */

import { useState, useRef, useCallback } from "react";
import {
  NotebookList,
  NotebookCreateForm,
  filterNotebooksByQuestId,
  type NotebookListItem,
} from "../lib/notebook";
import {
  QuestCatalog,
  CustomQuestList,
  type CustomQuestEditParams,
  type CategoryGroup,
  type QuestNotebookCounts,
  type QuestCatalogItem,
  type CreateCustomQuestParams,
} from "../lib/quest";
import type { QuestDefinition } from "../lib/quest/questDefinition";
import {
  ThemeToggle,
  type ThemeToggleLabels,
} from "../components/ThemeToggle/ThemeToggle";
import {
  LanguageToggle,
  type LanguageToggleProps,
} from "../components/LanguageToggle/LanguageToggle";
import type { DeductionSystem } from "../lib/logic-core/deductionSystem";
import {
  ProofCollectionPageView,
  type ProofCollectionPageViewProps,
} from "../lib/proof-collection";
import type { ReferenceEntry, Locale } from "../lib/reference/referenceEntry";
import { ReferenceBrowserComponent } from "../lib/reference/ReferenceBrowserComponent";
import type { QuestReferenceMap } from "../lib/quest/questReferenceMappingLogic";
import { Sigma } from "lucide-react";
import { useHubMessages } from "./HubMessagesContext";

// --- Types ---

export type HubTab =
  | "notebooks"
  | "quests"
  | "custom-quests"
  | "collection"
  | "reference";
type HubViewState = "list" | "create";

/** ランディングページに表示するおすすめクエスト */
export type RecommendedQuest = {
  readonly id: string;
  readonly title: string;
};

export type HubPageViewProps = {
  /** ノートブック一覧の表示用データ */
  readonly listItems: readonly NotebookListItem[];
  /** クエストカタログのカテゴリグループ */
  readonly groups: readonly CategoryGroup[];
  /** ノートブックを開く */
  readonly onOpenNotebook: (id: string) => void;
  /** ノートブックを削除する */
  readonly onDeleteNotebook: (id: string) => void;
  /** ノートブックを複製する */
  readonly onDuplicateNotebook: (id: string) => void;
  /** ノートブック名を変更する */
  readonly onRenameNotebook: (id: string, newName: string) => void;
  /** クエストモードを自由帳モードに変換する */
  readonly onConvertToFree: (id: string) => void;
  /** ノートブックをエクスポートする */
  readonly onExportNotebook?: (id: string) => void;
  /** JSONからノートブックをインポートする */
  readonly onImportNotebook?: (jsonString: string) => void;
  /** クエストを開始する */
  readonly onStartQuest: (questId: string) => void;
  /** ノートブックを作成する */
  readonly onCreateNotebook: (params: {
    readonly name: string;
    readonly deductionSystem: DeductionSystem;
  }) => void;
  /** 自作クエストのカタログアイテム一覧 */
  readonly customQuestItems?: readonly QuestCatalogItem[];
  /** 自作クエストを複製する */
  readonly onDuplicateCustomQuest?: (questId: string) => void;
  /** 自作クエストを削除する */
  readonly onDeleteCustomQuest?: (questId: string) => void;
  /** 自作クエストを編集する */
  readonly onEditCustomQuest?: (edit: CustomQuestEditParams) => void;
  /** 自作クエストを新規作成する */
  readonly onCreateCustomQuest?: (params: CreateCustomQuestParams) => void;
  /** ビルトインクエストを自作クエストに複製する */
  readonly onDuplicateBuiltinToCustom?: (questId: string) => void;
  /** 自作クエストをJSONエクスポートする */
  readonly onExportCustomQuest?: (questId: string) => void;
  /** JSONから自作クエストをインポートする */
  readonly onImportCustomQuest?: (jsonString: string) => void;
  /** クエストをURL形式で共有する（クリップボードにコピー） */
  readonly onShareQuestUrl?: (questId: string) => void;
  /** 現在のタブ */
  readonly tab: HubTab;
  /** タブ変更コールバック */
  readonly onTabChange: (tab: HubTab) => void;
  /** 言語切り替え（指定時に LanguageToggle を表示） */
  readonly languageToggle?: LanguageToggleProps;
  /** クエストIDごとのノートブック数（クエストカタログに表示） */
  readonly notebookCounts?: QuestNotebookCounts;
  /** URL共有で受け取ったクエスト（ダイアログ表示用） */
  readonly sharedQuest?: QuestDefinition | null;
  /** 共有クエストを開始する */
  readonly onSharedQuestStart?: () => void;
  /** 共有クエストを自作に追加する */
  readonly onSharedQuestAddToCollection?: () => void;
  /** 共有クエストダイアログを閉じる */
  readonly onSharedQuestDismiss?: () => void;
  /** 模範解答を表示するコールバック */
  readonly onShowModelAnswer?: (questId: string) => void;
  /** テーマトグルのi18nラベル */
  readonly themeLabels?: ThemeToggleLabels;
  /** ランディングページを表示するかどうか */
  readonly showLanding?: boolean;
  /** ランディングページに表示するおすすめクエスト */
  readonly recommendedQuests?: readonly RecommendedQuest[];
  /** 証明コレクションのプロパティ（collectionタブ用） */
  readonly collectionProps?: Omit<
    ProofCollectionPageViewProps,
    "messages" | "testId"
  >;
  /** リファレンスエントリ一覧（referenceタブ用） */
  readonly referenceEntries?: readonly ReferenceEntry[];
  /** リファレンス表示用ロケール */
  readonly referenceLocale?: Locale;
  /** クエストIDからリファレンスエントリIDへの逆マッピング（クエストカタログに表示） */
  readonly questReferenceMap?: QuestReferenceMap;
  /** クエストのドキュメントバッジクリック時のコールバック */
  readonly onShowReference?: (questId: string) => void;
};

// --- Style class names ---

const pageClassName =
  "min-h-screen bg-background text-foreground";

const headerClassName =
  "flex items-center justify-between px-6 py-4 border-b border-ui-border bg-card";

const brandClassName =
  "inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground select-none";

const brandIconClassName = "size-5 text-primary";

const headerActionsClassName = "flex items-center gap-2";

const githubLinkClassName =
  "inline-flex items-center justify-center size-7 rounded-md text-muted-foreground opacity-60 transition-opacity duration-150 hover:opacity-100";

const tabBarClassName = "flex border-b border-ui-border px-6 bg-card";

const tabClassName =
  "px-5 py-3 text-sm font-semibold cursor-pointer border-b-2 border-transparent bg-transparent text-muted-foreground transition-colors duration-150";

const tabActiveClassName =
  "px-5 py-3 text-sm font-semibold cursor-pointer border-b-2 border-primary text-primary bg-transparent transition-colors duration-150";

const contentClassName = "max-w-[800px] mx-auto py-6 px-4";

const actionBarClassName = "flex justify-end gap-2 mb-4";

const createButtonClassName =
  "py-2 px-5 text-sm font-semibold border-none rounded-lg cursor-pointer bg-primary text-primary-foreground transition-opacity hover:opacity-90";

const importButtonClassName =
  "py-2 px-5 text-sm font-semibold rounded-lg cursor-pointer border border-ui-border bg-transparent text-muted-foreground hover:bg-muted";

const clearFilterButtonClassName =
  "py-0.5 px-2.5 text-[11px] font-semibold rounded-md border border-current bg-transparent text-inherit cursor-pointer ml-auto";

export function HubPageView({
  listItems,
  groups,
  onOpenNotebook,
  onDeleteNotebook,
  onDuplicateNotebook,
  onRenameNotebook,
  onConvertToFree,
  onExportNotebook,
  onImportNotebook,
  onStartQuest,
  onCreateNotebook,
  customQuestItems,
  onDuplicateCustomQuest,
  onDeleteCustomQuest,
  onEditCustomQuest,
  onCreateCustomQuest,
  onDuplicateBuiltinToCustom,
  onExportCustomQuest,
  onImportCustomQuest,
  onShareQuestUrl,
  tab,
  onTabChange,
  languageToggle,
  notebookCounts,
  sharedQuest,
  onSharedQuestStart,
  onSharedQuestAddToCollection,
  onSharedQuestDismiss,
  onShowModelAnswer,
  themeLabels,
  showLanding,
  recommendedQuests,
  collectionProps,
  referenceEntries,
  referenceLocale = "en",
  questReferenceMap,
  onShowReference,
}: HubPageViewProps) {
  const m = useHubMessages();
  const [view, setView] = useState<HubViewState>("list");
  const [questFilter, setQuestFilter] = useState<string | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const handleImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file === undefined || onImportNotebook === undefined) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          onImportNotebook(reader.result);
        }
      };
      reader.readAsText(file);
      // 同じファイルを再選択可能にする
      e.target.value = "";
    },
    [onImportNotebook],
  );

  const handleShowQuestNotebooks = (questId: string) => {
    setQuestFilter(questId);
    onTabChange("notebooks");
    setView("list");
  };

  const displayedItems =
    questFilter !== null
      ? filterNotebooksByQuestId(listItems, questFilter)
      : listItems;

  const resolveQuestTitle = useCallback(
    (questId: string): string | undefined => {
      for (const group of groups) {
        for (const item of group.items) {
          if (item.quest.id === questId) {
            return item.quest.title;
          }
        }
      }
      return undefined;
    },
    [groups],
  );

  return (
    <div className={pageClassName} data-testid="hub-page">
      {/* Header */}
      <header className={headerClassName}>
        <span className={brandClassName}>
          <Sigma className={brandIconClassName} aria-hidden="true" />
          Formal Logic Pad
        </span>
        <div className={headerActionsClassName}>
          {languageToggle ? (
            <LanguageToggle
              locale={languageToggle.locale}
              onLocaleChange={languageToggle.onLocaleChange}
            />
          ) : null}
          <ThemeToggle labels={themeLabels} />
          <a
            href="https://github.com/LumaKernel/formal-logic-pad"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className={githubLinkClassName}
            data-testid="github-link"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
            </svg>
          </a>
        </div>
      </header>

      {/* Landing Page */}
      {showLanding === true ? (
        <div className="max-w-[640px] mx-auto pt-20 pb-15 px-6 text-center" data-testid="landing-page">
          <h1 className="text-[32px] font-extrabold -tracking-wide mb-2 text-foreground">{m.landingTitle}</h1>
          <p className="text-base font-medium text-primary mb-5">{m.landingSubtitle}</p>
          <p className="text-[15px] leading-relaxed text-muted-foreground mb-9">{m.landingDescription}</p>
          <div className="flex gap-3 justify-center mb-10">
            <button
              type="button"
              className="py-3 px-7 text-[15px] font-bold border-none rounded-[10px] cursor-pointer bg-primary text-primary-foreground transition-opacity hover:opacity-90"
              data-testid="landing-start-free"
              onClick={() => setView("create")}
            >
              {m.landingStartFreeProof}
            </button>
            <button
              type="button"
              className="py-3 px-7 text-[15px] font-bold rounded-[10px] cursor-pointer border-2 border-primary bg-transparent text-primary transition-opacity hover:opacity-90"
              data-testid="landing-explore-quests"
              onClick={() => onTabChange("quests")}
            >
              {m.landingExploreQuests}
            </button>
          </div>
          {recommendedQuests !== undefined && recommendedQuests.length > 0 && (
            <div className="text-center">
              <div className="text-[13px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                {m.landingRecommendedQuests}
              </div>
              <div className="flex gap-2.5 justify-center flex-wrap">
                {recommendedQuests.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    className="py-2 px-4.5 text-[13px] font-semibold rounded-lg cursor-pointer border border-ui-border bg-card text-foreground transition-colors hover:bg-muted"
                    data-testid={`landing-quest-${q.id satisfies string}`}
                    onClick={() => onStartQuest(q.id)}
                  >
                    {q.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Landing view=create: show form instead of landing */}
          {view === "create" && (
            <div style={{ marginTop: 32, textAlign: "left" }}>
              <NotebookCreateForm
                onSubmit={onCreateNotebook}
                onCancel={() => setView("list")}
              />
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Tab Bar */}
          <nav className={tabBarClassName}>
            <button
              type="button"
              className={
                tab === "notebooks" ? tabActiveClassName : tabClassName
              }
              onClick={() => {
                onTabChange("notebooks");
                setView("list");
                setQuestFilter(null);
              }}
            >
              {m.tabNotebooks}
            </button>
            <button
              type="button"
              className={tab === "quests" ? tabActiveClassName : tabClassName}
              onClick={() => {
                onTabChange("quests");
                setView("list");
              }}
            >
              {m.tabQuests}
            </button>
            <button
              type="button"
              className={
                tab === "custom-quests" ? tabActiveClassName : tabClassName
              }
              onClick={() => {
                onTabChange("custom-quests");
                setView("list");
              }}
            >
              {m.tabCustomQuests}
            </button>
            <button
              type="button"
              className={
                tab === "collection" ? tabActiveClassName : tabClassName
              }
              onClick={() => {
                onTabChange("collection");
                setView("list");
              }}
            >
              {m.tabCollection}
            </button>
            <button
              type="button"
              className={
                tab === "reference" ? tabActiveClassName : tabClassName
              }
              onClick={() => {
                onTabChange("reference");
                setView("list");
              }}
            >
              {m.tabReference}
            </button>
          </nav>

          {/* Content */}
          <div className={contentClassName}>
            {tab === "notebooks" && view === "list" && (
              <>
                <div className={actionBarClassName}>
                  <button
                    type="button"
                    className={createButtonClassName}
                    onClick={() => setView("create")}
                  >
                    {m.newNotebook}
                  </button>
                  {onImportNotebook !== undefined && (
                    <>
                      <button
                        type="button"
                        className={importButtonClassName}
                        data-testid="import-notebook-btn"
                        onClick={() => importFileRef.current?.click()}
                      >
                        {m.importNotebook}
                      </button>
                      <input
                        ref={importFileRef}
                        type="file"
                        accept=".json"
                        style={{ display: "none" }}
                        data-testid="import-notebook-file-input"
                        onChange={handleImportFile}
                      />
                    </>
                  )}
                </div>
                {questFilter !== null && (
                  <div
                    className="flex items-center gap-2 py-2 px-3.5 mb-3 rounded-lg bg-[var(--color-quest-notebook-badge-bg,#e8eaf6)] text-[var(--color-quest-notebook-badge-text,#3949ab)] text-[13px] font-semibold"
                    data-testid="quest-filter-banner"
                  >
                    <span>
                      {m.questFilterCount.replace(
                        "{count}",
                        String(displayedItems.length),
                      )}
                    </span>
                    <button
                      type="button"
                      className={clearFilterButtonClassName}
                      data-testid="clear-quest-filter"
                      onClick={() => setQuestFilter(null)}
                    >
                      {m.questFilterClear}
                    </button>
                  </div>
                )}
                {displayedItems.length === 0 ? (
                  questFilter !== null ? (
                    <div className="text-center py-15 px-5 text-muted-foreground">
                      <div className="text-base font-bold mb-2 text-foreground">
                        {m.questFilterEmpty}
                      </div>
                      <button
                        type="button"
                        className={clearFilterButtonClassName}
                        onClick={() => setQuestFilter(null)}
                      >
                        {m.questFilterClear}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-15 px-5 text-muted-foreground">
                      <div className="text-2xl font-bold mb-2 text-foreground">{m.emptyTitle}</div>
                      <p className="text-[15px] mb-6 leading-relaxed">{m.emptyDescription}</p>
                      <button
                        type="button"
                        className={createButtonClassName}
                        onClick={() => setView("create")}
                      >
                        {m.newNotebook}
                      </button>
                    </div>
                  )
                ) : (
                  <NotebookList
                    items={displayedItems}
                    onOpen={onOpenNotebook}
                    onDelete={onDeleteNotebook}
                    onDuplicate={onDuplicateNotebook}
                    onRename={onRenameNotebook}
                    onConvertToFree={onConvertToFree}
                    onExport={onExportNotebook}
                  />
                )}
              </>
            )}

            {tab === "notebooks" && view === "create" && (
              <NotebookCreateForm
                onSubmit={onCreateNotebook}
                onCancel={() => setView("list")}
              />
            )}

            {tab === "quests" && (
              <QuestCatalog
                groups={groups}
                onStartQuest={onStartQuest}
                notebookCounts={notebookCounts}
                onShowQuestNotebooks={handleShowQuestNotebooks}
                onDuplicateToCustom={onDuplicateBuiltinToCustom}
                onShowModelAnswer={onShowModelAnswer}
                questReferenceMap={questReferenceMap}
                onShowReference={onShowReference}
              />
            )}

            {tab === "custom-quests" && customQuestItems !== undefined && (
              <CustomQuestList
                items={customQuestItems}
                onStartQuest={onStartQuest}
                onDuplicateQuest={onDuplicateCustomQuest}
                onDeleteQuest={onDeleteCustomQuest}
                onEditQuest={onEditCustomQuest}
                onCreateQuest={onCreateCustomQuest}
                onExportQuest={onExportCustomQuest}
                onImportQuest={onImportCustomQuest}
                onShareQuestUrl={onShareQuestUrl}
              />
            )}

            {tab === "collection" && collectionProps !== undefined && (
              <ProofCollectionPageView
                entries={collectionProps.entries}
                folders={collectionProps.folders}
                messages={m}
                onRenameEntry={collectionProps.onRenameEntry}
                onUpdateMemo={collectionProps.onUpdateMemo}
                onRemoveEntry={collectionProps.onRemoveEntry}
                onMoveEntry={collectionProps.onMoveEntry}
                onCreateFolder={collectionProps.onCreateFolder}
                onRemoveFolder={collectionProps.onRemoveFolder}
                onRenameFolder={collectionProps.onRenameFolder}
                testId="collection-page"
              />
            )}

            {tab === "reference" && referenceEntries !== undefined && (
              <ReferenceBrowserComponent
                entries={referenceEntries}
                locale={referenceLocale}
                searchPlaceholder={m.referenceSearchPlaceholder}
                emptyMessage={m.referenceEmpty}
                resolveQuestTitle={resolveQuestTitle}
                onStartQuest={onStartQuest}
                testId="reference-browser"
              />
            )}
          </div>

          {/* Shared Quest Dialog */}
          {sharedQuest !== undefined &&
            sharedQuest !== null &&
            onSharedQuestDismiss !== undefined && (
              <div
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
                data-testid="shared-quest-dialog"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    onSharedQuestDismiss();
                  }
                }}
              >
                <div className="bg-card rounded-xl p-6 max-w-[480px] w-[90%] shadow-2xl">
                  <h3 className="text-lg font-bold mb-2 text-foreground">{sharedQuest.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 leading-normal">{sharedQuest.description}</p>
                  <div className="text-xs text-muted-foreground mb-5 py-2 px-3 bg-muted rounded-md">
                    <span>
                      {m.sharedQuestMeta
                        .replace("{systemPresetId}", sharedQuest.systemPresetId)
                        .replace(
                          "{goalCount}",
                          `${sharedQuest.goals.length satisfies number}`,
                        )
                        .replace(
                          "{estimatedSteps}",
                          sharedQuest.estimatedSteps !== undefined
                            ? `${sharedQuest.estimatedSteps satisfies number}`
                            : "-",
                        )}
                    </span>
                  </div>
                  <div className="flex gap-2 justify-end">
                    {onSharedQuestStart !== undefined && (
                      <button
                        type="button"
                        className="py-2 px-4 text-[13px] font-semibold border-none rounded-md cursor-pointer bg-primary text-primary-foreground"
                        data-testid="shared-quest-start-btn"
                        onClick={onSharedQuestStart}
                      >
                        {m.sharedQuestStart}
                      </button>
                    )}
                    {onSharedQuestAddToCollection !== undefined && (
                      <button
                        type="button"
                        className="py-2 px-4 text-[13px] font-semibold rounded-md cursor-pointer border border-primary bg-transparent text-primary"
                        data-testid="shared-quest-add-btn"
                        onClick={onSharedQuestAddToCollection}
                      >
                        {m.sharedQuestAddToCollection}
                      </button>
                    )}
                    <button
                      type="button"
                      className="py-2 px-4 text-[13px] font-semibold rounded-md cursor-pointer border border-ui-border bg-transparent text-muted-foreground"
                      data-testid="shared-quest-dismiss-btn"
                      onClick={onSharedQuestDismiss}
                    >
                      {m.sharedQuestCancel}
                    </button>
                  </div>
                </div>
              </div>
            )}
        </>
      )}
    </div>
  );
}
