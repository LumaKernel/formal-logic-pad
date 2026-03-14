/**
 * Hub ページのプレゼンテーション層。
 *
 * ルーター・localStorage 等の不純な依存を持たず、
 * props で状態とコールバックを受け取る。
 * Storybook でモックデータを注入して各状態を表示・テスト可能。
 *
 * 変更時は HubContent.tsx, HubPageView.stories.tsx も同期すること。
 */

import { useState, useRef, useCallback, type CSSProperties } from "react";
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
import { ScriptListPanel } from "../components/ScriptEditor/ScriptListPanel";
import type { ScriptListItem } from "../components/ScriptEditor/scriptListPanelLogic";
import { useHubMessages } from "./HubMessagesContext";

// --- Types ---

export type HubTab =
  | "notebooks"
  | "quests"
  | "custom-quests"
  | "collection"
  | "reference"
  | "scripts";
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
  /** スクリプト一覧（scriptsタブ用） */
  readonly scriptItems?: readonly ScriptListItem[];
  /** スクリプト削除 */
  readonly onDeleteScript?: (id: string) => void;
  /** スクリプトリネーム */
  readonly onRenameScript?: (id: string, newTitle: string) => void;
  /** スクリプトエクスポート */
  readonly onExportScript?: (id: string) => void;
};

// --- Inline styles ---

const pageStyle: Readonly<CSSProperties> = {
  minHeight: "100vh",
  backgroundColor: "var(--ui-background)",
  color: "var(--ui-foreground)",
};

const headerStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingLeft: "24px",
  paddingRight: "24px",
  paddingTop: "16px",
  paddingBottom: "16px",
  borderBottom: "1px solid var(--ui-border)",
  backgroundColor: "var(--ui-card)",
};

const brandStyle: Readonly<CSSProperties> = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "1.125rem",
  fontWeight: 600,
  letterSpacing: "-0.025em",
  color: "var(--ui-foreground)",
  userSelect: "none",
};

const brandIconStyle: Readonly<CSSProperties> = {
  width: "1.25rem",
  height: "1.25rem",
  color: "var(--ui-primary)",
};

const headerActionsStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const githubLinkStyle: Readonly<CSSProperties> = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1.75rem",
  height: "1.75rem",
  borderRadius: "6px",
  color: "var(--ui-muted-foreground)",
  opacity: 0.6,
  transitionProperty: "opacity",
  transitionDuration: "150ms",
};

const tabBarStyle: Readonly<CSSProperties> = {
  display: "flex",
  borderBottom: "1px solid var(--ui-border)",
  paddingLeft: "24px",
  paddingRight: "24px",
  backgroundColor: "var(--ui-card)",
};

const tabBaseStyle: Readonly<CSSProperties> = {
  paddingLeft: "20px",
  paddingRight: "20px",
  paddingTop: "12px",
  paddingBottom: "12px",
  fontSize: "0.875rem",
  fontWeight: 600,
  cursor: "pointer",
  borderBottom: "2px solid transparent",
  backgroundColor: "transparent",
  color: "var(--ui-muted-foreground)",
  transitionProperty: "color, background-color, border-color",
  transitionDuration: "150ms",
};

const tabActiveStyle: Readonly<CSSProperties> = {
  ...tabBaseStyle,
  borderBottom: "2px solid var(--ui-primary)",
  color: "var(--ui-primary)",
};

const contentStyle: Readonly<CSSProperties> = {
  maxWidth: "800px",
  marginLeft: "auto",
  marginRight: "auto",
  paddingTop: "24px",
  paddingBottom: "24px",
  paddingLeft: "16px",
  paddingRight: "16px",
};

const actionBarStyle: Readonly<CSSProperties> = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
  marginBottom: "16px",
};

const createButtonStyle: Readonly<CSSProperties> = {
  paddingTop: "8px",
  paddingBottom: "8px",
  paddingLeft: "20px",
  paddingRight: "20px",
  fontSize: "0.875rem",
  fontWeight: 600,
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  backgroundColor: "var(--ui-primary)",
  color: "var(--ui-primary-foreground)",
  transitionProperty: "opacity",
  transitionDuration: "150ms",
};

const importButtonStyle: Readonly<CSSProperties> = {
  paddingTop: "8px",
  paddingBottom: "8px",
  paddingLeft: "20px",
  paddingRight: "20px",
  fontSize: "0.875rem",
  fontWeight: 600,
  borderRadius: "8px",
  cursor: "pointer",
  border: "1px solid var(--ui-border)",
  backgroundColor: "transparent",
  color: "var(--ui-muted-foreground)",
  transitionProperty: "color, background-color, border-color",
  transitionDuration: "150ms",
};

const clearFilterButtonStyle: Readonly<CSSProperties> = {
  paddingTop: "2px",
  paddingBottom: "2px",
  paddingLeft: "10px",
  paddingRight: "10px",
  fontSize: "11px",
  fontWeight: 600,
  borderRadius: "6px",
  border: "1px solid currentColor",
  backgroundColor: "transparent",
  color: "inherit",
  cursor: "pointer",
  marginLeft: "auto",
};

const landingContainerStyle: Readonly<CSSProperties> = {
  maxWidth: "640px",
  marginLeft: "auto",
  marginRight: "auto",
  paddingTop: "80px",
  paddingBottom: "60px",
  paddingLeft: "24px",
  paddingRight: "24px",
  textAlign: "center",
};

const landingTitleStyle: Readonly<CSSProperties> = {
  fontSize: "32px",
  fontWeight: 800,
  letterSpacing: "-0.025em",
  marginBottom: "8px",
  color: "var(--ui-foreground)",
};

const landingSubtitleStyle: Readonly<CSSProperties> = {
  fontSize: "1rem",
  fontWeight: 500,
  color: "var(--ui-primary)",
  marginBottom: "20px",
};

const landingDescriptionStyle: Readonly<CSSProperties> = {
  fontSize: "15px",
  lineHeight: 1.625,
  color: "var(--ui-muted-foreground)",
  marginBottom: "36px",
};

const landingButtonsStyle: Readonly<CSSProperties> = {
  display: "flex",
  gap: "12px",
  justifyContent: "center",
  marginBottom: "40px",
};

const landingStartFreeStyle: Readonly<CSSProperties> = {
  paddingTop: "12px",
  paddingBottom: "12px",
  paddingLeft: "28px",
  paddingRight: "28px",
  fontSize: "15px",
  fontWeight: 700,
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  backgroundColor: "var(--ui-primary)",
  color: "var(--ui-primary-foreground)",
  transitionProperty: "opacity",
  transitionDuration: "150ms",
};

const landingExploreQuestsStyle: Readonly<CSSProperties> = {
  paddingTop: "12px",
  paddingBottom: "12px",
  paddingLeft: "28px",
  paddingRight: "28px",
  fontSize: "15px",
  fontWeight: 700,
  borderRadius: "10px",
  cursor: "pointer",
  border: "2px solid var(--ui-primary)",
  backgroundColor: "transparent",
  color: "var(--ui-primary)",
  transitionProperty: "opacity",
  transitionDuration: "150ms",
};

const landingRecommendedLabelStyle: Readonly<CSSProperties> = {
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--ui-muted-foreground)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: "12px",
};

const landingRecommendedListStyle: Readonly<CSSProperties> = {
  display: "flex",
  gap: "10px",
  justifyContent: "center",
  flexWrap: "wrap",
};

const landingQuestButtonStyle: Readonly<CSSProperties> = {
  paddingTop: "8px",
  paddingBottom: "8px",
  paddingLeft: "18px",
  paddingRight: "18px",
  fontSize: "13px",
  fontWeight: 600,
  borderRadius: "8px",
  cursor: "pointer",
  border: "1px solid var(--ui-border)",
  backgroundColor: "var(--ui-card)",
  color: "var(--ui-foreground)",
  transitionProperty: "color, background-color, border-color",
  transitionDuration: "150ms",
};

const questFilterBannerStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  paddingTop: "8px",
  paddingBottom: "8px",
  paddingLeft: "14px",
  paddingRight: "14px",
  marginBottom: "12px",
  borderRadius: "8px",
  backgroundColor: "var(--color-quest-notebook-badge-bg, #e8eaf6)",
  color: "var(--color-quest-notebook-badge-text, #3949ab)",
  fontSize: "13px",
  fontWeight: 600,
};

const emptyStateStyle: Readonly<CSSProperties> = {
  textAlign: "center",
  paddingTop: "60px",
  paddingBottom: "60px",
  paddingLeft: "20px",
  paddingRight: "20px",
  color: "var(--ui-muted-foreground)",
};

const emptyTitleBaseStyle: Readonly<CSSProperties> = {
  fontWeight: 700,
  marginBottom: "8px",
  color: "var(--ui-foreground)",
};

const emptyTitleFilterStyle: Readonly<CSSProperties> = {
  ...emptyTitleBaseStyle,
  fontSize: "1rem",
};

const emptyTitleNoFilterStyle: Readonly<CSSProperties> = {
  ...emptyTitleBaseStyle,
  fontSize: "1.5rem",
};

const emptyDescriptionStyle: Readonly<CSSProperties> = {
  fontSize: "15px",
  marginBottom: "24px",
  lineHeight: 1.625,
};

const dialogOverlayStyle: Readonly<CSSProperties> = {
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const dialogCardStyle: Readonly<CSSProperties> = {
  backgroundColor: "var(--ui-card)",
  borderRadius: "12px",
  padding: "24px",
  maxWidth: "480px",
  width: "90%",
  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
};

const dialogTitleStyle: Readonly<CSSProperties> = {
  fontSize: "1.125rem",
  fontWeight: 700,
  marginBottom: "8px",
  color: "var(--ui-foreground)",
};

const dialogDescriptionStyle: Readonly<CSSProperties> = {
  fontSize: "0.875rem",
  color: "var(--ui-muted-foreground)",
  marginBottom: "12px",
  lineHeight: "normal",
};

const dialogMetaStyle: Readonly<CSSProperties> = {
  fontSize: "0.75rem",
  color: "var(--ui-muted-foreground)",
  marginBottom: "20px",
  paddingTop: "8px",
  paddingBottom: "8px",
  paddingLeft: "12px",
  paddingRight: "12px",
  backgroundColor: "var(--ui-muted)",
  borderRadius: "6px",
};

const dialogActionsStyle: Readonly<CSSProperties> = {
  display: "flex",
  gap: "8px",
  justifyContent: "flex-end",
};

const dialogStartButtonStyle: Readonly<CSSProperties> = {
  paddingTop: "8px",
  paddingBottom: "8px",
  paddingLeft: "16px",
  paddingRight: "16px",
  fontSize: "13px",
  fontWeight: 600,
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  backgroundColor: "var(--ui-primary)",
  color: "var(--ui-primary-foreground)",
};

const dialogAddButtonStyle: Readonly<CSSProperties> = {
  paddingTop: "8px",
  paddingBottom: "8px",
  paddingLeft: "16px",
  paddingRight: "16px",
  fontSize: "13px",
  fontWeight: 600,
  borderRadius: "6px",
  cursor: "pointer",
  border: "1px solid var(--ui-primary)",
  backgroundColor: "transparent",
  color: "var(--ui-primary)",
};

const dialogDismissButtonStyle: Readonly<CSSProperties> = {
  paddingTop: "8px",
  paddingBottom: "8px",
  paddingLeft: "16px",
  paddingRight: "16px",
  fontSize: "13px",
  fontWeight: 600,
  borderRadius: "6px",
  cursor: "pointer",
  border: "1px solid var(--ui-border)",
  backgroundColor: "transparent",
  color: "var(--ui-muted-foreground)",
};

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
  scriptItems,
  onDeleteScript,
  onRenameScript,
  onExportScript,
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
    <div style={pageStyle} data-testid="hub-page">
      {/* Header */}
      <header style={headerStyle}>
        <span style={brandStyle}>
          <svg
            style={brandIconStyle}
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
          >
            <rect
              width="32"
              height="32"
              rx="7"
              fill="currentColor"
              opacity="0.12"
            />
            <path
              d="M10 7L10 25"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M10 16L23 16"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="23" cy="16" r="1.5" fill="currentColor" opacity="0.5" />
          </svg>
          Formal Logic Pad
        </span>
        <div style={headerActionsStyle}>
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
            className="hub-github-link"
            style={githubLinkStyle}
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
        <div style={landingContainerStyle} data-testid="landing-page">
          <h1 style={landingTitleStyle}>{m.landingTitle}</h1>
          <p style={landingSubtitleStyle}>{m.landingSubtitle}</p>
          <p style={landingDescriptionStyle}>{m.landingDescription}</p>
          <div style={landingButtonsStyle}>
            <button
              type="button"
              className="hub-hover-opacity-90"
              style={landingStartFreeStyle}
              data-testid="landing-start-free"
              onClick={() => setView("create")}
            >
              {m.landingStartFreeProof}
            </button>
            <button
              type="button"
              className="hub-hover-opacity-90"
              style={landingExploreQuestsStyle}
              data-testid="landing-explore-quests"
              onClick={() => onTabChange("quests")}
            >
              {m.landingExploreQuests}
            </button>
          </div>
          {recommendedQuests !== undefined && recommendedQuests.length > 0 && (
            <div style={{ textAlign: "center" }}>
              <div style={landingRecommendedLabelStyle}>
                {m.landingRecommendedQuests}
              </div>
              <div style={landingRecommendedListStyle}>
                {recommendedQuests.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    className="hub-hover-bg-muted"
                    style={landingQuestButtonStyle}
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
          <nav style={tabBarStyle}>
            <button
              type="button"
              style={tab === "notebooks" ? tabActiveStyle : tabBaseStyle}
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
              style={tab === "quests" ? tabActiveStyle : tabBaseStyle}
              onClick={() => {
                onTabChange("quests");
                setView("list");
              }}
            >
              {m.tabQuests}
            </button>
            <button
              type="button"
              style={tab === "custom-quests" ? tabActiveStyle : tabBaseStyle}
              onClick={() => {
                onTabChange("custom-quests");
                setView("list");
              }}
            >
              {m.tabCustomQuests}
            </button>
            <button
              type="button"
              style={tab === "collection" ? tabActiveStyle : tabBaseStyle}
              onClick={() => {
                onTabChange("collection");
                setView("list");
              }}
            >
              {m.tabCollection}
            </button>
            <button
              type="button"
              style={tab === "reference" ? tabActiveStyle : tabBaseStyle}
              onClick={() => {
                onTabChange("reference");
                setView("list");
              }}
            >
              {m.tabReference}
            </button>
            <button
              type="button"
              style={tab === "scripts" ? tabActiveStyle : tabBaseStyle}
              onClick={() => {
                onTabChange("scripts");
                setView("list");
              }}
            >
              {m.tabScripts}
            </button>
          </nav>

          {/* Content */}
          <div style={contentStyle}>
            {tab === "notebooks" && view === "list" && (
              <>
                <div style={actionBarStyle}>
                  <button
                    type="button"
                    className="hub-hover-opacity-90"
                    style={createButtonStyle}
                    onClick={() => setView("create")}
                  >
                    {m.newNotebook}
                  </button>
                  {onImportNotebook !== undefined && (
                    <>
                      <button
                        type="button"
                        className="hub-hover-bg-muted"
                        style={importButtonStyle}
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
                    style={questFilterBannerStyle}
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
                    <div style={emptyStateStyle}>
                      <div style={emptyTitleFilterStyle}>
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
                    <div style={emptyStateStyle}>
                      <div style={emptyTitleNoFilterStyle}>{m.emptyTitle}</div>
                      <p style={emptyDescriptionStyle}>{m.emptyDescription}</p>
                      <button
                        type="button"
                        className="hub-hover-opacity-90"
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
                guideSectionTitle={m.referenceGuideTitle}
                guideSectionDescription={m.referenceGuideDescription}
                relatedTopicsLabel={m.referenceRelatedTopics}
                resolveQuestTitle={resolveQuestTitle}
                onStartQuest={onStartQuest}
                testId="reference-browser"
              />
            )}

            {tab === "scripts" && scriptItems !== undefined && (
              <ScriptListPanel
                items={scriptItems}
                messages={{
                  emptyTitle: m.scriptsEmpty,
                  emptyDescription: m.scriptsEmptyDescription,
                  deleteButton: m.scriptsDelete,
                  renameButton: m.scriptsRename,
                  exportButton: m.scriptsExport,
                }}
                onDelete={onDeleteScript}
                onRename={onRenameScript}
                onExport={onExportScript}
                testId="script-list-panel"
              />
            )}
          </div>

          {/* Shared Quest Dialog */}
          {sharedQuest !== undefined &&
            sharedQuest !== null &&
            onSharedQuestDismiss !== undefined && (
              <div
                style={dialogOverlayStyle}
                data-testid="shared-quest-dialog"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    onSharedQuestDismiss();
                  }
                }}
              >
                <div style={dialogCardStyle}>
                  <h3 style={dialogTitleStyle}>{sharedQuest.title}</h3>
                  <p style={dialogDescriptionStyle}>
                    {sharedQuest.description}
                  </p>
                  <div style={dialogMetaStyle}>
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
                  <div style={dialogActionsStyle}>
                    {onSharedQuestStart !== undefined && (
                      <button
                        type="button"
                        style={dialogStartButtonStyle}
                        data-testid="shared-quest-start-btn"
                        onClick={onSharedQuestStart}
                      >
                        {m.sharedQuestStart}
                      </button>
                    )}
                    {onSharedQuestAddToCollection !== undefined && (
                      <button
                        type="button"
                        style={dialogAddButtonStyle}
                        data-testid="shared-quest-add-btn"
                        onClick={onSharedQuestAddToCollection}
                      >
                        {m.sharedQuestAddToCollection}
                      </button>
                    )}
                    <button
                      type="button"
                      style={dialogDismissButtonStyle}
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
