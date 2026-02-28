export {
  type QuestId,
  type DifficultyLevel,
  type QuestCategory,
  type QuestCategoryMeta,
  type SystemPresetId,
  type QuestDefinition,
  questCategories,
  findCategoryById,
  validateUniqueIds,
  groupByCategory,
  sortQuests,
} from "./questDefinition";

export {
  type QuestCompletionRecord,
  type QuestProgressEntry,
  type QuestProgressState,
  type SerializedQuestProgress,
  createEmptyProgress,
  isQuestCompleted,
  getCompletionCount,
  getBestStepCount,
  getLatestCompletion,
  recordCompletion,
  resetQuestProgress,
  resetAllProgress,
  countCompletedQuests,
  serializeProgress,
  deserializeProgress,
} from "./questProgress";

export {
  type QuestCatalogItem,
  type QuestRating,
  type CategoryGroup,
  computeRating,
  toCatalogItem,
  buildCatalog,
  buildCatalogByCategory,
  filterByDifficulty,
  filterIncomplete,
  filterCompleted,
  findQuestById,
} from "./questCatalog";

export { builtinQuests } from "./builtinQuests";

export {
  type CompletionFilter,
  type CatalogFilterState,
  defaultFilterState,
  applyFilters,
  applyFiltersToGroups,
  difficultyLabel,
  difficultyShortLabel,
  ratingLabel,
  ratingColor,
  categoryProgressText,
  stepCountText,
  completionFilterOptions,
  difficultyFilterOptions,
} from "./questCatalogListLogic";

export {
  type QuestStartParams,
  type QuestStartResult,
  type QuestStartError,
  resolveSystemPreset,
  buildQuestStartParams,
  prepareQuestStart,
} from "./questStartLogic";

export {
  type UseQuestProgressResult,
  useQuestProgress,
  loadProgress,
  saveProgress,
  loadProgressEffect,
  saveProgressEffect,
  QUEST_PROGRESS_STORAGE_KEY,
} from "./useQuestProgress";

export {
  StorageService,
  BrowserStorageLayer,
  createInMemoryStorageLayer,
} from "./storageService";

export {
  type StartQuestResult,
  type QuestStartSuccess,
  type QuestStartFailure,
  startQuestAndCreateNotebook,
  getQuestIdForNotebook,
  getNotebookIdsForQuest,
} from "./questNotebookIntegration";

export {
  computeStepCount,
  checkQuestGoals,
  checkQuestGoalsWithAxioms,
  computeViolatingAxiomIds,
  type QuestGoalCheckResult,
  type QuestGoalCheckWithAxiomsResult,
  type GoalAxiomCheckResult,
} from "./questCompletionLogic";

export {
  type QuestVersionStatus,
  checkQuestVersion,
  needsVersionWarning,
  getVersionWarningMessage,
} from "./questVersionLogic";

export {
  type QuestNotebookCounts,
  computeQuestNotebookCounts,
  getNotebookCountForQuest,
  notebookCountText,
} from "./questNotebookFilterLogic";

export { QuestCatalog, type QuestCatalogProps } from "./QuestCatalogComponent";
