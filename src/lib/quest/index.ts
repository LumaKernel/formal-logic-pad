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
  computeNotebookQuestProgress,
  enrichListItemsWithQuestProgress,
} from "./questNotebookIntegration";

export {
  computeStepCount,
  checkQuestGoals,
  checkQuestGoalsEffect,
  checkQuestGoalsWithAxioms,
  checkQuestGoalsWithAxiomsEffect,
  computeViolatingAxiomIds,
  computeViolatingRuleIds,
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

export {
  CustomQuestList,
  type CustomQuestListProps,
  type CustomQuestEditParams,
} from "./CustomQuestListComponent";

export {
  type ModelAnswerStep,
  type ModelAnswer,
  type BuildModelAnswerResult,
  type ValidateModelAnswerResult,
  buildModelAnswerWorkspace,
  validateModelAnswer,
} from "./modelAnswer";

export {
  builtinModelAnswers,
  modelAnswerRegistry,
} from "./builtinModelAnswers";

export {
  buildCustomQuestCatalogItems,
  getCustomQuestCatalogCount,
  getCustomQuestCompletedCount,
  customQuestProgressText,
} from "./customQuestCatalogLogic";

export {
  type UseCustomQuestCollectionResult,
  useCustomQuestCollection,
  loadCustomQuestsEffect,
  saveCustomQuestsEffect,
} from "./useCustomQuestCollection";

export {
  CUSTOM_QUEST_ID_PREFIX,
  CUSTOM_QUEST_STORAGE_KEY,
  isCustomQuestId,
  generateCustomQuestId,
  createEmptyCustomQuestCollection,
  validateCreateParams,
  validateNoDuplicateId,
  addCustomQuest,
  updateCustomQuest,
  removeCustomQuest,
  duplicateAsCustomQuest,
  findCustomQuestById,
  listCustomQuests,
  getCustomQuestCount,
  mergeWithBuiltinQuests,
  serializeCustomQuestCollection,
  deserializeCustomQuestCollection,
  type CustomQuestCollection,
  type CreateCustomQuestParams,
  type CustomQuestValidation,
  type CustomQuestResult,
  type SerializedCustomQuestCollection,
  type SerializedCustomQuest,
} from "./customQuestState";

export {
  type EditFormValues,
  type EditFormValidation,
  type EditFormError,
  createEmptyEditFormValues,
  questToEditFormValues,
  validateEditForm,
  getEditFieldError,
  shouldShowEditFieldError,
  getFirstEditErrorField,
  parseGoalLines,
  goalsTextToDefinitions,
  parseHintLines,
} from "./customQuestEditLogic";
