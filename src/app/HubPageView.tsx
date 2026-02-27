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
  type NotebookListItem,
} from "../lib/notebook";
import { QuestCatalog, type CategoryGroup } from "../lib/quest";
import { ThemeToggle } from "../components/ThemeToggle/ThemeToggle";
import type { DeductionSystem } from "../lib/logic-core/deductionSystem";

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
  /** 初期タブ（テスト用） */
  readonly initialTab?: HubTab;
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
  initialTab = "notebooks",
}: HubPageViewProps) {
  const [tab, setTab] = useState<HubTab>(initialTab);
  const [view, setView] = useState<HubViewState>("list");

  return (
    <div style={pageStyle} data-testid="hub-page">
      {/* Header */}
      <header style={headerStyle}>
        <span style={titleStyle}>Formal Logic Pad</span>
        <div style={headerActionsStyle}>
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
          }}
        >
          Notebooks
        </button>
        <button
          type="button"
          style={tab === "quests" ? tabActiveStyle : tabStyle}
          onClick={() => {
            setTab("quests");
            setView("list");
          }}
        >
          Quests
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
                + New Notebook
              </button>
            </div>
            {listItems.length === 0 ? (
              <div style={emptyHeroStyle}>
                <div style={emptyHeroTitleStyle}>No notebooks yet</div>
                <p style={emptyHeroDescStyle}>
                  Create a new notebook to start building formal proofs, or try
                  a quest to learn the basics.
                </p>
                <button
                  type="button"
                  style={createButtonStyle}
                  onClick={() => setView("create")}
                >
                  + New Notebook
                </button>
              </div>
            ) : (
              <NotebookList
                items={listItems}
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
          <QuestCatalog groups={groups} onStartQuest={onStartQuest} />
        )}
      </div>
    </div>
  );
}
