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

export { QuestCatalog, type QuestCatalogProps } from "./QuestCatalogComponent";
