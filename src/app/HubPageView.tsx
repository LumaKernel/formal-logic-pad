/**
 * Hub ページのプレゼンテーション層。
 *
 * ルーター・localStorage 等の不純な依存を持たず、
 * props で状態とコールバックを受け取る。
 * Storybook でモックデータを注入して各状態を表示・テスト可能。
 *
 * 変更時は HubContent.tsx, HubPageView.stories.tsx も同期すること。
 */

import { useState, type CSSProperties } from "react";
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
import { ThemeToggle } from "../components/ThemeToggle/ThemeToggle";
import {
  LanguageToggle,
  type LanguageToggleProps,
} from "../components/LanguageToggle/LanguageToggle";
import type { DeductionSystem } from "../lib/logic-core/deductionSystem";
import { useHubMessages } from "./HubMessagesContext";

// --- Types ---

type HubTab = "notebooks" | "quests";
type HubViewState = "list" | "create";

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
  /** 初期タブ（テスト用） */
  readonly initialTab?: HubTab;
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
};

// --- Styles ---

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "var(--color-bg-primary)",
  color: "var(--color-text-primary)",
  fontFamily: "var(--font-ui)",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 24px",
  borderBottom: "1px solid var(--color-border, #e0e0e0)",
  background: "var(--color-surface, #fff)",
};

const titleStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: -0.5,
};

const headerActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const tabBarStyle: CSSProperties = {
  display: "flex",
  gap: 0,
  borderBottom: "1px solid var(--color-border, #e0e0e0)",
  padding: "0 24px",
  background: "var(--color-surface, #fff)",
};

const tabStyle: CSSProperties = {
  padding: "12px 20px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  border: "none",
  background: "transparent",
  color: "var(--color-text-secondary, #666)",
  borderBottomWidth: 2,
  borderBottomStyle: "solid",
  borderBottomColor: "transparent",
  transition: "color 0.15s, border-color 0.15s",
};

const tabActiveStyle: CSSProperties = {
  ...tabStyle,
  color: "var(--color-accent, #555ab9)",
  borderBottomColor: "var(--color-accent, #555ab9)",
};

const contentStyle: CSSProperties = {
  maxWidth: 800,
  margin: "0 auto",
  padding: "24px 16px",
};

const actionBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: 16,
};

const createButtonStyle: CSSProperties = {
  padding: "8px 20px",
  fontSize: 14,
  fontWeight: 600,
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  background: "var(--color-accent, #555ab9)",
  color: "#fff",
  transition: "opacity 0.15s",
};

const emptyHeroStyle: CSSProperties = {
  textAlign: "center",
  padding: "60px 20px",
  color: "var(--color-text-secondary, #666)",
};

const emptyHeroTitleStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  marginBottom: 8,
  color: "var(--color-text-primary, #333)",
};

const emptyHeroDescStyle: CSSProperties = {
  fontSize: 15,
  marginBottom: 24,
  lineHeight: 1.6,
};

const filterBannerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 14px",
  marginBottom: 12,
  borderRadius: 8,
  background: "var(--color-quest-notebook-badge-bg, #e8eaf6)",
  color: "var(--color-quest-notebook-badge-text, #3949ab)",
  fontSize: 13,
  fontWeight: 600,
};

const clearFilterButtonStyle: CSSProperties = {
  padding: "3px 10px",
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 6,
  border: "1px solid currentColor",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  marginLeft: "auto",
};

const sharedQuestOverlayStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const sharedQuestDialogStyle: CSSProperties = {
  background: "var(--color-surface, #fff)",
  borderRadius: 12,
  padding: "24px",
  maxWidth: 480,
  width: "90%",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
};

const sharedQuestTitleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  marginBottom: 8,
  color: "var(--color-text-primary, #333)",
};

const sharedQuestDescStyle: CSSProperties = {
  fontSize: 14,
  color: "var(--color-text-secondary, #666)",
  marginBottom: 12,
  lineHeight: 1.5,
};

const sharedQuestMetaStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--color-text-secondary, #999)",
  marginBottom: 20,
  padding: "8px 12px",
  background: "var(--color-bg-secondary, #f5f5f5)",
  borderRadius: 6,
};

const sharedQuestActionsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
};

const sharedQuestStartButtonStyle: CSSProperties = {
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 600,
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  background: "var(--color-accent, #555ab9)",
  color: "#fff",
};

const sharedQuestAddButtonStyle: CSSProperties = {
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 6,
  cursor: "pointer",
  border: "1px solid var(--color-accent, #555ab9)",
  background: "transparent",
  color: "var(--color-accent, #555ab9)",
};

const sharedQuestCancelButtonStyle: CSSProperties = {
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 6,
  cursor: "pointer",
  border: "1px solid var(--color-border, #ccc)",
  background: "transparent",
  color: "var(--color-text-secondary, #666)",
};

export function HubPageView({
  listItems,
  groups,
  onOpenNotebook,
  onDeleteNotebook,
  onDuplicateNotebook,
  onRenameNotebook,
  onConvertToFree,
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
  initialTab = "notebooks",
  languageToggle,
  notebookCounts,
  sharedQuest,
  onSharedQuestStart,
  onSharedQuestAddToCollection,
  onSharedQuestDismiss,
}: HubPageViewProps) {
  const m = useHubMessages();
  const [tab, setTab] = useState<HubTab>(initialTab);
  const [view, setView] = useState<HubViewState>("list");
  const [questFilter, setQuestFilter] = useState<string | null>(null);

  const handleShowQuestNotebooks = (questId: string) => {
    setQuestFilter(questId);
    setTab("notebooks");
    setView("list");
  };

  const displayedItems =
    questFilter !== null
      ? filterNotebooksByQuestId(listItems, questFilter)
      : listItems;

  return (
    <div style={pageStyle} data-testid="hub-page">
      {/* Header */}
      <header style={headerStyle}>
        <span style={titleStyle}>Formal Logic Pad</span>
        <div style={headerActionsStyle}>
          {languageToggle ? (
            <LanguageToggle
              locale={languageToggle.locale}
              onLocaleChange={languageToggle.onLocaleChange}
            />
          ) : null}
          <ThemeToggle />
        </div>
      </header>

      {/* Tab Bar */}
      <nav style={tabBarStyle}>
        <button
          type="button"
          style={tab === "notebooks" ? tabActiveStyle : tabStyle}
          onClick={() => {
            setTab("notebooks");
            setView("list");
            setQuestFilter(null);
          }}
        >
          {m.tabNotebooks}
        </button>
        <button
          type="button"
          style={tab === "quests" ? tabActiveStyle : tabStyle}
          onClick={() => {
            setTab("quests");
            setView("list");
          }}
        >
          {m.tabQuests}
        </button>
      </nav>

      {/* Content */}
      <div style={contentStyle}>
        {tab === "notebooks" && view === "list" && (
          <>
            <div style={actionBarStyle}>
              <button
                type="button"
                style={createButtonStyle}
                onClick={() => setView("create")}
              >
                {m.newNotebook}
              </button>
            </div>
            {questFilter !== null && (
              <div style={filterBannerStyle} data-testid="quest-filter-banner">
                <span>
                  {m.questFilterCount.replace(
                    "{count}",
                    String(displayedItems.length),
                  )}
                </span>
                <button
                  type="button"
                  style={clearFilterButtonStyle}
                  data-testid="clear-quest-filter"
                  onClick={() => setQuestFilter(null)}
                >
                  {m.questFilterClear}
                </button>
              </div>
            )}
            {displayedItems.length === 0 ? (
              questFilter !== null ? (
                <div style={emptyHeroStyle}>
                  <div
                    style={{
                      ...emptyHeroTitleStyle,
                      fontSize: 16,
                    }}
                  >
                    {m.questFilterEmpty}
                  </div>
                  <button
                    type="button"
                    style={clearFilterButtonStyle}
                    onClick={() => setQuestFilter(null)}
                  >
                    {m.questFilterClear}
                  </button>
                </div>
              ) : (
                <div style={emptyHeroStyle}>
                  <div style={emptyHeroTitleStyle}>{m.emptyTitle}</div>
                  <p style={emptyHeroDescStyle}>{m.emptyDescription}</p>
                  <button
                    type="button"
                    style={createButtonStyle}
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
          <>
            <QuestCatalog
              groups={groups}
              onStartQuest={onStartQuest}
              notebookCounts={notebookCounts}
              onShowQuestNotebooks={handleShowQuestNotebooks}
              onDuplicateToCustom={onDuplicateBuiltinToCustom}
            />
            {customQuestItems !== undefined && (
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
          </>
        )}
      </div>

      {/* Shared Quest Dialog */}
      {sharedQuest !== undefined &&
        sharedQuest !== null &&
        onSharedQuestDismiss !== undefined && (
          <div
            style={sharedQuestOverlayStyle}
            data-testid="shared-quest-dialog"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                onSharedQuestDismiss();
              }
            }}
          >
            <div style={sharedQuestDialogStyle}>
              <h3 style={sharedQuestTitleStyle}>
                {sharedQuest.title}
              </h3>
              <p style={sharedQuestDescStyle}>{sharedQuest.description}</p>
              <div style={sharedQuestMetaStyle}>
                <span>
                  {`${sharedQuest.systemPresetId satisfies string} | ${`${sharedQuest.goals.length satisfies number}` satisfies string} goal(s) | est. ${`${sharedQuest.estimatedSteps satisfies number}` satisfies string} steps`}
                </span>
              </div>
              <div style={sharedQuestActionsStyle}>
                {onSharedQuestStart !== undefined && (
                  <button
                    type="button"
                    style={sharedQuestStartButtonStyle}
                    data-testid="shared-quest-start-btn"
                    onClick={onSharedQuestStart}
                  >
                    Start Quest
                  </button>
                )}
                {onSharedQuestAddToCollection !== undefined && (
                  <button
                    type="button"
                    style={sharedQuestAddButtonStyle}
                    data-testid="shared-quest-add-btn"
                    onClick={onSharedQuestAddToCollection}
                  >
                    Add to My Quests
                  </button>
                )}
                <button
                  type="button"
                  style={sharedQuestCancelButtonStyle}
                  data-testid="shared-quest-dismiss-btn"
                  onClick={onSharedQuestDismiss}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
