"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useNotebookCollection, toNotebookListItems } from "../lib/notebook";
import {
  useQuestProgress,
  useCustomQuestCollection,
  builtinQuests,
  buildCatalogByCategory,
  buildCustomQuestCatalogItems,
  computeQuestNotebookCounts,
  enrichListItemsWithQuestProgress,
  mergeWithBuiltinQuests,
  findQuestById,
  addCustomQuest,
  duplicateAsCustomQuest,
  removeCustomQuest,
  updateCustomQuest,
  findCustomQuestById,
  type CustomQuestEditParams,
  type CreateCustomQuestParams,
} from "../lib/quest";
import { ThemeProvider } from "../lib/theme/ThemeProvider";
import type { DeductionSystem } from "../lib/logic-core/deductionSystem";
import { prepareQuestStart } from "../lib/quest/questStartLogic";
import { isLocale } from "../components/LanguageToggle/languageToggleLogic";
import {
  useLocaleSwitch,
  getBrowserLocaleSwitchDeps,
} from "../components/LanguageToggle/useLocaleSwitch";
import { HubPageView } from "./HubPageView";
import type { HubMessages } from "./hubMessages";
import { HubMessagesProvider } from "./HubMessagesContext";

// eslint-disable-next-line @luma-dev/luma-ts/no-date
const getNow = (): number => Date.now();

/** next-intl の翻訳から HubMessages オブジェクトを構築するフック */
function useHubMessagesFromIntl(): HubMessages {
  const t = useTranslations("HubPage");
  return useMemo(
    (): HubMessages => ({
      tabNotebooks: String(t.raw("tabNotebooks")),
      tabQuests: String(t.raw("tabQuests")),
      newNotebook: String(t.raw("newNotebook")),
      emptyTitle: String(t.raw("emptyTitle")),
      emptyDescription: String(t.raw("emptyDescription")),
      questFilterCount: String(t.raw("questFilterCount")),
      questFilterClear: String(t.raw("questFilterClear")),
      questFilterEmpty: String(t.raw("questFilterEmpty")),
    }),
    [t],
  );
}

function HubInner() {
  const router = useRouter();
  const notebookCollection = useNotebookCollection();
  const questProgress = useQuestProgress();
  const customQuestCollection = useCustomQuestCollection();
  const hubMessages = useHubMessagesFromIntl();
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ?? "en";
  const localeSwitchDeps = useMemo(() => getBrowserLocaleSwitchDeps(), []);
  const { switchLocale } = useLocaleSwitch(localeSwitchDeps);

  // Build quest catalog groups
  const groups = useMemo(
    () => buildCatalogByCategory(builtinQuests, questProgress.progress),
    [questProgress.progress],
  );

  // Build custom quest catalog items
  const customQuestItems = useMemo(
    () =>
      buildCustomQuestCatalogItems(
        customQuestCollection.collection,
        questProgress.progress,
      ),
    [customQuestCollection.collection, questProgress.progress],
  );

  // Merge builtin + custom quests for quest lookup
  const allQuests = useMemo(
    () =>
      mergeWithBuiltinQuests(builtinQuests, customQuestCollection.collection),
    [customQuestCollection.collection],
  );

  // Build notebook list items with quest progress
  const listItems = useMemo(
    () =>
      enrichListItemsWithQuestProgress(
        toNotebookListItems(notebookCollection.notebooks, getNow()),
        notebookCollection.notebooks,
      ),
    [notebookCollection.notebooks],
  );

  // Compute notebook counts per quest
  const notebookCounts = useMemo(
    () => computeQuestNotebookCounts(notebookCollection.collection),
    [notebookCollection.collection],
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
      const result = prepareQuestStart(allQuests, questId);
      if (!result.ok) return;
      const quest = findQuestById(allQuests, questId);
      const { params } = result;
      const nextId = predictNextNotebookId();
      notebookCollection.createQuest(
        params.name,
        params.deductionSystem,
        params.goals,
        questId,
        quest?.version,
      );
      router.push(`/workspace/${nextId satisfies string}`);
    },
    [allQuests, notebookCollection, router, predictNextNotebookId],
  );

  // Create notebook
  const handleCreateNotebook = useCallback(
    (params: {
      readonly name: string;
      readonly deductionSystem: DeductionSystem;
    }) => {
      // シーケント計算・タブロー法はUI未対応
      if (
        params.deductionSystem.style === "sequent-calculus" ||
        params.deductionSystem.style === "tableau-calculus"
      ) {
        return;
      }
      const nextId = predictNextNotebookId();
      notebookCollection.create(params.name, params.deductionSystem);
      router.push(`/workspace/${nextId satisfies string}`);
    },
    [notebookCollection, router, predictNextNotebookId],
  );

  const handleConvertToFree = useCallback(
    (id: string) => {
      const newId = notebookCollection.convertToFree(id);
      if (newId !== undefined) {
        router.push(`/workspace/${newId satisfies string}`);
      }
    },
    [notebookCollection, router],
  );

  // Duplicate custom quest
  const handleDuplicateCustomQuest = useCallback(
    (questId: string) => {
      const source = findCustomQuestById(
        customQuestCollection.collection,
        questId,
      );
      if (source === undefined) return;
      const result = duplicateAsCustomQuest(
        customQuestCollection.collection,
        source,
        getNow(),
      );
      if (!result.ok) return;
      customQuestCollection.setCollection(result.value.collection);
    },
    [customQuestCollection],
  );

  // Delete custom quest
  const handleDeleteCustomQuest = useCallback(
    (questId: string) => {
      const updated = removeCustomQuest(
        customQuestCollection.collection,
        questId,
      );
      customQuestCollection.setCollection(updated);
    },
    [customQuestCollection],
  );

  // Create custom quest
  const handleCreateCustomQuest = useCallback(
    (params: CreateCustomQuestParams) => {
      const result = addCustomQuest(
        customQuestCollection.collection,
        params,
        getNow(),
      );
      if (!result.ok) return;
      customQuestCollection.setCollection(result.value.collection);
    },
    [customQuestCollection],
  );

  // Edit custom quest
  const handleEditCustomQuest = useCallback(
    (edit: CustomQuestEditParams) => {
      const result = updateCustomQuest(
        customQuestCollection.collection,
        edit.questId,
        edit.params,
      );
      if (!result.ok) return;
      customQuestCollection.setCollection(result.value.collection);
    },
    [customQuestCollection],
  );

  return (
    <HubMessagesProvider messages={hubMessages}>
      <HubPageView
        listItems={listItems}
        groups={groups}
        onOpenNotebook={handleOpenNotebook}
        onDeleteNotebook={notebookCollection.remove}
        onDuplicateNotebook={notebookCollection.duplicate}
        onRenameNotebook={notebookCollection.rename}
        onConvertToFree={handleConvertToFree}
        onStartQuest={handleStartQuest}
        onCreateNotebook={handleCreateNotebook}
        customQuestItems={customQuestItems}
        onDuplicateCustomQuest={handleDuplicateCustomQuest}
        onDeleteCustomQuest={handleDeleteCustomQuest}
        onEditCustomQuest={handleEditCustomQuest}
        onCreateCustomQuest={handleCreateCustomQuest}
        languageToggle={{ locale, onLocaleChange: switchLocale }}
        notebookCounts={notebookCounts}
      />
    </HubMessagesProvider>
  );
}

export default function HubContent() {
  return (
    <ThemeProvider>
      <HubInner />
    </ThemeProvider>
  );
}
