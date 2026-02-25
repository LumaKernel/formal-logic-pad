"use client";

import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  useNotebookCollection,
  NotebookList,
  NotebookCreateForm,
  toNotebookListItems,
} from "../lib/notebook";
import {
  useQuestProgress,
  builtinQuests,
  buildCatalogByCategory,
  QuestCatalog,
} from "../lib/quest";
import { ThemeProvider } from "../lib/theme/ThemeProvider";
import { ThemeToggle } from "../components/ThemeToggle/ThemeToggle";
import type { LogicSystem } from "../lib/logic-core/inferenceRule";
import { prepareQuestStart } from "../lib/quest/questStartLogic";

// --- Types ---

type HubTab = "notebooks" | "quests";
type HubView = "list" | "create";

// --- Styles ---

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "var(--color-bg-primary)",
  color: "var(--color-text-primary)",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
  borderBottom: "2px solid transparent",
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

// eslint-disable-next-line @luma-dev/luma-ts/no-date
const getNow = (): number => Date.now();

function HubInner() {
  const router = useRouter();
  const notebookCollection = useNotebookCollection();
  const questProgress = useQuestProgress();
  const [tab, setTab] = useState<HubTab>("notebooks");
  const [view, setView] = useState<HubView>("list");

  // Build quest catalog groups
  const groups = useMemo(
    () => buildCatalogByCategory(builtinQuests, questProgress.progress),
    [questProgress.progress],
  );

  // Build notebook list items
  const listItems = useMemo(
    () => toNotebookListItems(notebookCollection.notebooks, getNow()),
    [notebookCollection.notebooks],
  );

  // Navigate to workspace
  const handleOpenNotebook = useCallback(
    (id: string) => {
      router.push(`/workspace/${id satisfies string}`);
    },
    [router],
  );

  // Predict the next notebook ID from the collection's nextId counter.
  // This avoids relying on the return value of setState updater functions.
  const predictNextNotebookId = useCallback(
    () =>
      `notebook-${String(notebookCollection.collection.nextId) satisfies string}`,
    [notebookCollection.collection.nextId],
  );

  // Start quest: resolve quest definition -> create notebook -> navigate
  const handleStartQuest = useCallback(
    (questId: string) => {
      const result = prepareQuestStart(builtinQuests, questId);
      if (!result.ok) return;
      const { params } = result;
      const nextId = predictNextNotebookId();
      notebookCollection.createQuest(
        params.name,
        params.system,
        params.goals,
        questId,
      );
      router.push(`/workspace/${nextId satisfies string}`);
    },
    [notebookCollection, router, predictNextNotebookId],
  );

  // Create notebook
  const handleCreateNotebook = useCallback(
    (params: {
      readonly name: string;
      readonly mode: "free" | "quest";
      readonly system: LogicSystem;
    }) => {
      const nextId = predictNextNotebookId();
      notebookCollection.create(params.name, params.system);
      setView("list");
      router.push(`/workspace/${nextId satisfies string}`);
    },
    [notebookCollection, router, predictNextNotebookId],
  );

  return (
    <div style={pageStyle}>
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
                onOpen={handleOpenNotebook}
                onDelete={notebookCollection.remove}
                onDuplicate={notebookCollection.duplicate}
                onRename={notebookCollection.rename}
                onConvertToFree={notebookCollection.convertToFree}
              />
            )}
          </>
        )}

        {tab === "notebooks" && view === "create" && (
          <NotebookCreateForm
            onSubmit={handleCreateNotebook}
            onCancel={() => setView("list")}
          />
        )}

        {tab === "quests" && (
          <QuestCatalog groups={groups} onStartQuest={handleStartQuest} />
        )}
      </div>
    </div>
  );
}

export default function HubContent() {
  return (
    <ThemeProvider>
      <HubInner />
    </ThemeProvider>
  );
}
