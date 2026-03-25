"use client";

import { useCallback, useMemo, useState } from "react";
import { getCurrentTimestamp } from "@/lib/_unsafe/unsafeDate";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { resolveTabFromPath, resolvePathFromTab } from "./hubRouting";
import {
  useNotebookCollection,
  toNotebookListItems,
  findNotebook,
  exportNotebookAsJson,
  importNotebookFromJson,
  generateExportFilename,
} from "../lib/notebook";
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
  localizeCategoryGroups,
  localizeQuest,
  questTranslationsEn,
  categoryTranslationsEn,
  addCustomQuest,
  duplicateAsCustomQuest,
  removeCustomQuest,
  updateCustomQuest,
  findCustomQuestById,
  exportCustomQuestAsJson,
  importCustomQuestFromJson,
  encodeQuestToUrlParam,
  decodeQuestFromUrlParam,
  QUEST_URL_PARAM,
  prepareUrlQuestForImport,
  modelAnswerRegistry,
  buildModelAnswerWorkspace,
  type CustomQuestEditParams,
  type CreateCustomQuestParams,
} from "../lib/quest";
import { ThemeProvider } from "../lib/theme/ThemeProvider";
import type { DeductionSystem } from "../lib/logic-core/deductionSystem";
import type { QuestDefinition } from "../lib/quest/questDefinition";
import { prepareQuestStart } from "../lib/quest/questStartLogic";
import { isLocale } from "../components/LanguageToggle/languageToggleLogic";
import {
  useLocaleSwitch,
  getBrowserLocaleSwitchDeps,
} from "../components/LanguageToggle/useLocaleSwitch";
import type { ThemeToggleLabels } from "../components/ThemeToggle/ThemeToggle";
import { allReferenceEntries } from "../lib/reference/referenceContent";
import type { Locale as ReferenceLocale } from "../lib/reference/referenceEntry";
import { buildQuestToReferenceMap } from "../lib/quest/questReferenceMappingLogic";
import { HubPageView, type HubTab, type RecommendedQuest } from "./HubPageView";
import type { HubMessages } from "./hubMessages";
import { HubMessagesProvider } from "./HubMessagesContext";
import {
  shouldShowLandingPage,
  updateHasEverHadNotebooks,
  recommendedQuestIds,
} from "./landingPageLogic";
import { useProofCollection, findProofEntry } from "../lib/proof-collection";
import { useTrash, type TrashPanelMessages } from "../lib/trash";
import {
  deserializeSavedScripts,
  serializeSavedScripts,
  removeScript,
  renameScript,
  findScript,
  initialSavedScriptsState,
  STORAGE_KEY as SCRIPT_STORAGE_KEY,
  type SavedScriptsState,
} from "../components/ScriptEditor/savedScriptsLogic";
import { toScriptListItems } from "../components/ScriptEditor/scriptListPanelLogic";

const getNow = (): number => getCurrentTimestamp();

/** sessionStorage key: セッション中にタブ遷移したか */
const SESSION_NAV_KEY = "hasNavigatedInSession";

/** next-intl の翻訳から ThemeToggleLabels を構築するフック */
function useThemeLabelsFromIntl(): ThemeToggleLabels {
  const t = useTranslations("Workspace");
  return useMemo(
    (): ThemeToggleLabels => ({
      light: t("themeLight"),
      dark: t("themeDark"),
      system: t("themeSystem"),
      ariaLabel: t("themeSelectionAriaLabel"),
      switchAriaLabelTemplate: String(t.raw("switchThemeAriaLabel")),
    }),
    [t],
  );
}

/** next-intl の翻訳から HubMessages オブジェクトを構築するフック */
function useHubMessagesFromIntl(): HubMessages {
  const t = useTranslations("HubPage");
  return useMemo(
    (): HubMessages => ({
      tabNotebooks: String(t.raw("tabNotebooks")),
      tabQuests: String(t.raw("tabQuests")),
      tabCustomQuests: String(t.raw("tabCustomQuests")),
      tabCollection: String(t.raw("tabCollection")),
      newNotebook: String(t.raw("newNotebook")),
      importNotebook: String(t.raw("importNotebook")),
      emptyTitle: String(t.raw("emptyTitle")),
      emptyDescription: String(t.raw("emptyDescription")),
      questFilterCount: String(t.raw("questFilterCount")),
      questFilterClear: String(t.raw("questFilterClear")),
      questFilterEmpty: String(t.raw("questFilterEmpty")),
      sharedQuestStart: t("sharedQuestStart"),
      sharedQuestAddToCollection: t("sharedQuestAddToCollection"),
      sharedQuestCancel: t("sharedQuestCancel"),
      sharedQuestMeta: String(t.raw("sharedQuestMeta")),
      landingTitle: String(t.raw("landingTitle")),
      landingSubtitle: String(t.raw("landingSubtitle")),
      landingDescription: String(t.raw("landingDescription")),
      landingStartFreeProof: String(t.raw("landingStartFreeProof")),
      landingExploreQuests: String(t.raw("landingExploreQuests")),
      landingRecommendedQuests: String(t.raw("landingRecommendedQuests")),
      landingQuickQuestDescription: String(
        t.raw("landingQuickQuestDescription"),
      ),
      landingGettingStartedTitle: String(t.raw("landingGettingStartedTitle")),
      landingGettingStartedDescription: String(
        t.raw("landingGettingStartedDescription"),
      ),
      landingGettingStartedLink: String(t.raw("landingGettingStartedLink")),
      // Reference
      tabReference: String(t.raw("tabReference")),
      referenceSearchPlaceholder: String(t.raw("referenceSearchPlaceholder")),
      referenceEmpty: String(t.raw("referenceEmpty")),
      referenceGuideTitle: String(t.raw("referenceGuideTitle")),
      referenceGuideDescription: String(t.raw("referenceGuideDescription")),
      referenceRelatedTopics: String(t.raw("referenceRelatedTopics")),
      // Scripts
      tabScripts: String(t.raw("tabScripts")),
      scriptsEmpty: String(t.raw("scriptsEmpty")),
      scriptsEmptyDescription: String(t.raw("scriptsEmptyDescription")),
      scriptsDelete: String(t.raw("scriptsDelete")),
      scriptsRename: String(t.raw("scriptsRename")),
      scriptsExport: String(t.raw("scriptsExport")),
      scriptsDocsLink: String(t.raw("scriptsDocsLink")),
      // Trash
      tabTrash: String(t.raw("tabTrash")),
      trashEmpty: String(t.raw("trashEmpty")),
      trashEmptyDescription: String(t.raw("trashEmptyDescription")),
      trashRestore: String(t.raw("trashRestore")),
      trashDelete: String(t.raw("trashDelete")),
      trashEmptyTrash: String(t.raw("trashEmptyTrash")),
      trashRemainingDays: String(t.raw("trashRemainingDays")),
      trashFilterAll: String(t.raw("trashFilterAll")),
      trashKindNotebook: String(t.raw("trashKindNotebook")),
      trashKindCustomQuest: String(t.raw("trashKindCustomQuest")),
      trashKindScript: String(t.raw("trashKindScript")),
      trashKindProofEntry: String(t.raw("trashKindProofEntry")),
      trashConfirmEmptyTitle: String(t.raw("trashConfirmEmptyTitle")),
      trashConfirmEmptyDescription: String(
        t.raw("trashConfirmEmptyDescription"),
      ),
      trashConfirmEmptyOk: String(t.raw("trashConfirmEmptyOk")),
      trashConfirmEmptyCancel: String(t.raw("trashConfirmEmptyCancel")),
      // Collection
      collectionEmpty: String(t.raw("collectionEmpty")),
      collectionEntryCount: String(t.raw("collectionEntryCount")),
      collectionDelete: String(t.raw("collectionDelete")),
      collectionMemoPlaceholder: String(t.raw("collectionMemoPlaceholder")),
      collectionCreateFolder: String(t.raw("collectionCreateFolder")),
      collectionFolderNamePlaceholder: String(
        t.raw("collectionFolderNamePlaceholder"),
      ),
      collectionFolderDelete: String(t.raw("collectionFolderDelete")),
      collectionFolderRename: String(t.raw("collectionFolderRename")),
      collectionMoveToFolder: String(t.raw("collectionMoveToFolder")),
      collectionMoveToRoot: String(t.raw("collectionMoveToRoot")),
      collectionRootEntries: String(t.raw("collectionRootEntries")),
      collectionFolderEntryCount: String(t.raw("collectionFolderEntryCount")),
    }),
    [t],
  );
}

function HubInner() {
  const router = useRouter();
  const pathname = usePathname();
  const notebookCollection = useNotebookCollection();
  const questProgress = useQuestProgress();
  const customQuestCollection = useCustomQuestCollection();
  const proofCollection = useProofCollection();
  const trash = useTrash();

  // Saved scripts state (localStorage-backed)
  const [savedScripts, setSavedScripts] = useState<SavedScriptsState>(() => {
    try {
      const json = localStorage.getItem(SCRIPT_STORAGE_KEY);
      if (json === null) return initialSavedScriptsState;
      return deserializeSavedScripts(json);
    } catch {
      return initialSavedScriptsState;
    }
  });

  const persistScripts = useCallback((next: SavedScriptsState) => {
    setSavedScripts(next);
    try {
      localStorage.setItem(SCRIPT_STORAGE_KEY, serializeSavedScripts(next));
    } catch {
      // localStorage full — silently ignore
    }
  }, []);

  const handleDeleteScript = useCallback(
    (id: string) => {
      const script = findScript(savedScripts, id);
      if (script !== undefined) {
        trash.moveToTrash("script", id, script.title, JSON.stringify(script));
      }
      persistScripts(removeScript(savedScripts, id));
    },
    [savedScripts, persistScripts, trash],
  );

  const handleRenameScript = useCallback(
    (id: string, newTitle: string) => {
      persistScripts(renameScript(savedScripts, id, newTitle));
    },
    [savedScripts, persistScripts],
  );

  const handleExportScript = useCallback(
    (id: string) => {
      const script = findScript(savedScripts, id);
      if (script === undefined) return;
      const blob = new Blob([script.code], { type: "text/javascript" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${script.title.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF_-]/g, "-") satisfies string}.js`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [savedScripts],
  );

  const scriptItems = useMemo(
    () => toScriptListItems(savedScripts.scripts, getNow()),
    [savedScripts.scripts],
  );

  const hubMessages = useHubMessagesFromIntl();
  const themeLabels = useThemeLabelsFromIntl();
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ?? "en";
  const refLocale: ReferenceLocale = rawLocale === "ja" ? "ja" : "en";
  const localeSwitchDeps = useMemo(() => getBrowserLocaleSwitchDeps(), []);
  const { switchLocale } = useLocaleSwitch(localeSwitchDeps);

  // Route-based tab state (derived from pathname)
  const tab = resolveTabFromPath(pathname) ?? "notebooks";

  const handleTabChange = useCallback(
    (newTab: HubTab) => {
      try {
        sessionStorage.setItem(SESSION_NAV_KEY, "1");
      } catch {
        // sessionStorage unavailable — silently ignore
      }
      router.push(resolvePathFromTab(newTab));
    },
    [router],
  );

  // Build quest catalog groups (localized)
  const groups = useMemo(
    () =>
      localizeCategoryGroups(
        buildCatalogByCategory(builtinQuests, questProgress.progress),
        locale,
        questTranslationsEn,
        categoryTranslationsEn,
      ),
    [questProgress.progress, locale],
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

  // Landing page logic: track if session has ever had notebooks
  // setState during render (React-supported pattern for derived state)
  const [hasEverHadNotebooks, setHasEverHadNotebooks] = useState(false);
  const nextHasEver = updateHasEverHadNotebooks(
    hasEverHadNotebooks,
    listItems.length,
  );
  if (nextHasEver !== hasEverHadNotebooks) {
    setHasEverHadNotebooks(nextHasEver);
  }

  // セッション中にタブ遷移したかを sessionStorage で追跡
  // （リロードでリセットされる。notebooks以外のタブに来た＝遷移済み）
  // NOTE: pathname は初回マウント時のみ評価される（useState初期化関数）
  const [hasNavigatedInSession] = useState(() => {
    try {
      if (resolveTabFromPath(pathname) !== "notebooks") {
        sessionStorage.setItem(SESSION_NAV_KEY, "1");
        return true;
      }
      return sessionStorage.getItem(SESSION_NAV_KEY) === "1";
    } catch {
      return false;
    }
  });

  // ランディングページはnotebooksタブ（ルート/）でのみ表示
  const showLanding =
    tab === "notebooks" &&
    shouldShowLandingPage(
      listItems.length,
      hasEverHadNotebooks,
      hasNavigatedInSession,
    );

  // Build recommended quests for landing page (localized)
  const recommendedQuests = useMemo(
    (): readonly RecommendedQuest[] =>
      recommendedQuestIds.flatMap((id) => {
        const quest = findQuestById(allQuests, id);
        if (quest === undefined) return [];
        const localized = localizeQuest(quest, locale, questTranslationsEn);
        return [{ id: localized.id, title: localized.title }];
      }),
    [allQuests, locale],
  );

  // Compute notebook counts per quest
  const notebookCounts = useMemo(
    () => computeQuestNotebookCounts(notebookCollection.collection),
    [notebookCollection.collection],
  );

  // Build quest → reference reverse mapping
  const questReferenceMap = useMemo(
    () => buildQuestToReferenceMap(allReferenceEntries),
    [],
  );

  // Show reference: switch to reference tab
  const handleShowReference = useCallback(() => {
    handleTabChange("reference");
  }, [handleTabChange]);

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
      // Localize notebook name
      const localizedQuest =
        quest !== undefined
          ? localizeQuest(quest, locale, questTranslationsEn)
          : undefined;
      const notebookName = localizedQuest?.title ?? params.name;
      notebookCollection.createQuest(
        notebookName,
        params.deductionSystem,
        params.goals,
        questId,
        quest?.version,
      );
      router.push(`/workspace/${nextId satisfies string}`);
    },
    [allQuests, notebookCollection, router, predictNextNotebookId, locale],
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

  // Duplicate builtin quest to custom
  const handleDuplicateBuiltinToCustom = useCallback(
    (questId: string) => {
      const source = findQuestById(allQuests, questId);
      if (source === undefined) return;
      const result = duplicateAsCustomQuest(
        customQuestCollection.collection,
        source,
        getNow(),
      );
      if (!result.ok) return;
      customQuestCollection.setCollection(result.value.collection);
    },
    [allQuests, customQuestCollection],
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

  // Export custom quest as JSON file download
  const handleExportCustomQuest = useCallback(
    (questId: string) => {
      const quest = findCustomQuestById(
        customQuestCollection.collection,
        questId,
      );
      if (quest === undefined) return;
      const json = exportCustomQuestAsJson(quest);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quest-${quest.title.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, "-") satisfies string}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [customQuestCollection.collection],
  );

  // Import custom quest from JSON string
  const handleImportCustomQuest = useCallback(
    (jsonString: string) => {
      const result = importCustomQuestFromJson(
        customQuestCollection.collection,
        jsonString,
        getNow(),
      );
      if (result._tag !== "Ok") return;
      customQuestCollection.setCollection(result.collection);
    },
    [customQuestCollection],
  );

  // Show model answer: build workspace and navigate
  const handleShowModelAnswer = useCallback(
    (questId: string) => {
      const quest = findQuestById(allQuests, questId);
      if (quest === undefined) return;
      const answer = modelAnswerRegistry.get(questId);
      if (answer === undefined) return;
      const result = buildModelAnswerWorkspace(quest, answer);
      if (result._tag !== "Ok") return;
      // 模範解答ノートブックを作成してワークスペースに遷移
      const nextId = predictNextNotebookId();
      const localized = localizeQuest(quest, locale, questTranslationsEn);
      const modelAnswerSuffix = locale === "ja" ? "模範解答" : "Model Answer";
      notebookCollection.createQuest(
        `${localized.title satisfies string} (${modelAnswerSuffix satisfies string})`,
        result.workspace.system,
        quest.goals,
        questId,
        quest.version,
      );
      // 作成直後のノートブックに模範解答のワークスペースを設定
      notebookCollection.updateWorkspace(nextId, result.workspace);
      router.push(`/workspace/${nextId satisfies string}`);
    },
    [allQuests, notebookCollection, router, predictNextNotebookId, locale],
  );

  // Share quest via URL (copy to clipboard)
  const handleShareQuestUrl = useCallback(
    (questId: string) => {
      const quest =
        findCustomQuestById(customQuestCollection.collection, questId) ??
        findQuestById(allQuests, questId);
      if (quest === undefined) return;
      const param = encodeQuestToUrlParam(quest);
      const baseUrl = window.location.origin + window.location.pathname;
      const shareUrl = `${baseUrl satisfies string}?${QUEST_URL_PARAM satisfies string}=${param satisfies string}`;
      void navigator.clipboard.writeText(shareUrl);
    },
    [customQuestCollection.collection, allQuests],
  );

  // URL quest receive: derive from ?quest= param (pure derivation, no effect)
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  const sharedQuest = useMemo((): QuestDefinition | null => {
    if (dismissed) return null;
    const questParam = searchParams.get(QUEST_URL_PARAM);
    if (questParam === null) return null;
    const result = decodeQuestFromUrlParam(questParam);
    if (result._tag === "Ok") return result.quest;
    return null;
  }, [searchParams, dismissed]);

  // Clear URL param helper (impure)
  const clearQuestUrlParam = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete(QUEST_URL_PARAM);
    window.history.replaceState({}, "", url.toString());
    setDismissed(true);
  }, []);

  // Handle shared quest actions
  const handleSharedQuestStart = useCallback(() => {
    if (sharedQuest === null) return;
    // Add to custom quests first, then start
    const params = prepareUrlQuestForImport(sharedQuest);
    const addResult = addCustomQuest(
      customQuestCollection.collection,
      params,
      getNow(),
    );
    if (!addResult.ok) return;
    customQuestCollection.setCollection(addResult.value.collection);
    clearQuestUrlParam();
    // Start the quest
    handleStartQuest(addResult.value.questId);
  }, [
    sharedQuest,
    customQuestCollection,
    handleStartQuest,
    clearQuestUrlParam,
  ]);

  const handleSharedQuestAddToCollection = useCallback(() => {
    if (sharedQuest === null) return;
    const params = prepareUrlQuestForImport(sharedQuest);
    const addResult = addCustomQuest(
      customQuestCollection.collection,
      params,
      getNow(),
    );
    if (!addResult.ok) return;
    customQuestCollection.setCollection(addResult.value.collection);
    clearQuestUrlParam();
  }, [sharedQuest, customQuestCollection, clearQuestUrlParam]);

  const handleSharedQuestDismiss = useCallback(() => {
    clearQuestUrlParam();
  }, [clearQuestUrlParam]);

  // Export notebook as JSON file download
  const handleExportNotebook = useCallback(
    (id: string) => {
      const notebook = findNotebook(notebookCollection.collection, id);
      if (notebook === undefined) return;
      const json = exportNotebookAsJson(notebook);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${generateExportFilename(notebook.meta.name) satisfies string}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [notebookCollection.collection],
  );

  // Import notebook from JSON string
  const handleImportNotebook = useCallback(
    (jsonString: string) => {
      const result = importNotebookFromJson(
        notebookCollection.collection,
        jsonString,
        getNow(),
      );
      if (result._tag !== "Ok") return;
      notebookCollection.setCollection(result.collection);
    },
    [notebookCollection],
  );

  // --- ゴミ箱統合: 削除 → ゴミ箱移動 ---

  const handleDeleteNotebook = useCallback(
    (id: string) => {
      const notebook = findNotebook(notebookCollection.collection, id);
      if (notebook !== undefined) {
        trash.moveToTrash(
          "notebook",
          id,
          notebook.meta.name,
          exportNotebookAsJson(notebook),
        );
      }
      notebookCollection.remove(id);
    },
    [notebookCollection, trash],
  );

  const handleDeleteCustomQuestToTrash = useCallback(
    (questId: string) => {
      const quest = findCustomQuestById(
        customQuestCollection.collection,
        questId,
      );
      if (quest !== undefined) {
        trash.moveToTrash(
          "custom-quest",
          questId,
          quest.title,
          exportCustomQuestAsJson(quest),
        );
      }
      const updated = removeCustomQuest(
        customQuestCollection.collection,
        questId,
      );
      customQuestCollection.setCollection(updated);
    },
    [customQuestCollection, trash],
  );

  const handleRemoveProofEntry = useCallback(
    (entryId: string) => {
      const entry = findProofEntry(proofCollection.collection, entryId);
      if (entry !== undefined) {
        trash.moveToTrash(
          "proof-entry",
          entryId,
          entry.name,
          JSON.stringify(entry),
        );
      }
      proofCollection.removeEntry(entryId);
    },
    [proofCollection, trash],
  );

  // --- ゴミ箱パネル用 props ---

  const trashPanelMessages = useMemo(
    (): TrashPanelMessages => ({
      emptyTitle: hubMessages.trashEmpty,
      emptyDescription: hubMessages.trashEmptyDescription,
      restoreButton: hubMessages.trashRestore,
      deleteButton: hubMessages.trashDelete,
      emptyTrashButton: hubMessages.trashEmptyTrash,
      remainingDaysTemplate: hubMessages.trashRemainingDays,
      filterAll: hubMessages.trashFilterAll,
      kindLabels: {
        notebook: hubMessages.trashKindNotebook,
        "custom-quest": hubMessages.trashKindCustomQuest,
        script: hubMessages.trashKindScript,
        "proof-entry": hubMessages.trashKindProofEntry,
      },
      confirmEmptyTitle: hubMessages.trashConfirmEmptyTitle,
      confirmEmptyDescription: hubMessages.trashConfirmEmptyDescription,
      confirmEmptyOk: hubMessages.trashConfirmEmptyOk,
      confirmEmptyCancel: hubMessages.trashConfirmEmptyCancel,
    }),
    [hubMessages],
  );

  const handleTrashRestore = useCallback(
    (trashId: string) => {
      // 復元: ゴミ箱からアイテムデータを取得し、ゴミ箱から除去
      // NOTE: 実際のコレクションへの復元は将来的に実装
      // 現時点ではゴミ箱からの除去のみ
      trash.removeFromTrash(trashId);
    },
    [trash],
  );

  return (
    <HubMessagesProvider messages={hubMessages}>
      <HubPageView
        tab={tab}
        onTabChange={handleTabChange}
        listItems={listItems}
        groups={groups}
        onOpenNotebook={handleOpenNotebook}
        onDeleteNotebook={handleDeleteNotebook}
        onDuplicateNotebook={notebookCollection.duplicate}
        onRenameNotebook={notebookCollection.rename}
        onConvertToFree={handleConvertToFree}
        onExportNotebook={handleExportNotebook}
        onImportNotebook={handleImportNotebook}
        onStartQuest={handleStartQuest}
        onCreateNotebook={handleCreateNotebook}
        customQuestItems={customQuestItems}
        onDuplicateCustomQuest={handleDuplicateCustomQuest}
        onDeleteCustomQuest={handleDeleteCustomQuestToTrash}
        onEditCustomQuest={handleEditCustomQuest}
        onCreateCustomQuest={handleCreateCustomQuest}
        onDuplicateBuiltinToCustom={handleDuplicateBuiltinToCustom}
        onExportCustomQuest={handleExportCustomQuest}
        onImportCustomQuest={handleImportCustomQuest}
        onShareQuestUrl={handleShareQuestUrl}
        onShowModelAnswer={handleShowModelAnswer}
        languageToggle={{ locale, onLocaleChange: switchLocale }}
        notebookCounts={notebookCounts}
        sharedQuest={sharedQuest}
        onSharedQuestStart={handleSharedQuestStart}
        onSharedQuestAddToCollection={handleSharedQuestAddToCollection}
        onSharedQuestDismiss={handleSharedQuestDismiss}
        themeLabels={themeLabels}
        showLanding={showLanding}
        recommendedQuests={recommendedQuests}
        referenceEntries={allReferenceEntries}
        referenceLocale={refLocale}
        questReferenceMap={questReferenceMap}
        onShowReference={handleShowReference}
        scriptItems={scriptItems}
        onDeleteScript={handleDeleteScript}
        onRenameScript={handleRenameScript}
        onExportScript={handleExportScript}
        onShowScriptDocs={handleShowReference}
        trashProps={{
          items: trash.items,
          now: getNow(),
          messages: trashPanelMessages,
          onRestore: handleTrashRestore,
          onDeletePermanently: trash.deletePermanently,
          onEmptyTrash: trash.empty,
        }}
        collectionProps={{
          entries: proofCollection.entries,
          folders: proofCollection.folders,
          onRenameEntry: proofCollection.renameEntry,
          onUpdateMemo: proofCollection.updateMemo,
          onRemoveEntry: handleRemoveProofEntry,
          onMoveEntry: proofCollection.moveEntry,
          onCreateFolder: proofCollection.createFolder,
          onRemoveFolder: proofCollection.removeFolder,
          onRenameFolder: proofCollection.renameFolder,
        }}
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
