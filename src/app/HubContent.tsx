"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useNotebookCollection, toNotebookListItems } from "../lib/notebook";
import {
  useQuestProgress,
  builtinQuests,
  buildCatalogByCategory,
} from "../lib/quest";
import { ThemeProvider } from "../lib/theme/ThemeProvider";
import type { DeductionSystem } from "../lib/logic-core/deductionSystem";
import { prepareQuestStart } from "../lib/quest/questStartLogic";
import { HubPageView } from "./HubPageView";

// eslint-disable-next-line @luma-dev/luma-ts/no-date
const getNow = (): number => Date.now();

function HubInner() {
  const router = useRouter();
  const notebookCollection = useNotebookCollection();
  const questProgress = useQuestProgress();

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
      readonly deductionSystem: DeductionSystem;
    }) => {
      // 現在はHilbert流のみワークスペース対応
      if (params.deductionSystem.style !== "hilbert") {
        return;
      }
      const nextId = predictNextNotebookId();
      notebookCollection.create(params.name, params.deductionSystem.system);
      router.push(`/workspace/${nextId satisfies string}`);
    },
    [notebookCollection, router, predictNextNotebookId],
  );

  return (
    <HubPageView
      listItems={listItems}
      groups={groups}
      onOpenNotebook={handleOpenNotebook}
      onDeleteNotebook={notebookCollection.remove}
      onDuplicateNotebook={notebookCollection.duplicate}
      onRenameNotebook={notebookCollection.rename}
      onConvertToFree={notebookCollection.convertToFree}
      onStartQuest={handleStartQuest}
      onCreateNotebook={handleCreateNotebook}
    />
  );
}

export default function HubContent() {
  return (
    <ThemeProvider>
      <HubInner />
    </ThemeProvider>
  );
}
