export { ScriptEditorComponent } from "./ScriptEditorComponent";
export type { ScriptEditorComponentProps } from "./ScriptEditorComponent";
export {
  initialScriptEditorState,
  updateCode,
  startExecution,
  startStepping,
  recordStep,
  appendConsole,
  setRunResult,
  resetExecution,
  formatRunError,
  executionStatusLabel,
  updateAutoPlayInterval,
  sliderToIntervalMs,
  intervalMsToSlider,
  extractErrorLocation,
  DEFAULT_AUTO_PLAY_INTERVAL_MS,
  MIN_AUTO_PLAY_INTERVAL_MS,
  MAX_AUTO_PLAY_INTERVAL_MS,
  defaultEditorOptions,
} from "./scriptEditorLogic";
export type {
  ExecutionStatus,
  ConsoleEntry,
  ErrorLocation,
  ScriptEditorState,
} from "./scriptEditorLogic";
export { ScriptApiReferencePanel } from "./ScriptApiReferencePanel";
export type { ScriptApiReferencePanelProps } from "./ScriptApiReferencePanel";
export { ScriptLibraryPanel } from "./ScriptLibraryPanel";
export type { ScriptLibraryPanelProps } from "./ScriptLibraryPanel";
export {
  buildLibraryItems,
  searchLibraryItems,
  filterLibraryItems,
  filterByKind,
  templateToLibraryItem,
  savedScriptToLibraryItem,
  initialScriptLibraryState,
  updateSearchQuery,
  updateFilterKind,
} from "./scriptLibraryLogic";
export type {
  LibraryItem,
  LibraryItemKind,
  ScriptLibraryState,
} from "./scriptLibraryLogic";
export {
  API_CATEGORIES,
  filterApis,
  filterCategories,
  getTotalApiCount,
} from "./scriptApiReferenceLogic";
export type { ApiCategory, ApiCategoryInfo } from "./scriptApiReferenceLogic";
export {
  initialWorkspaceState,
  generateTabId,
  createUnnamedTab,
  openLibraryTab,
  openSavedTab,
  setActiveTab,
  closeTab,
  updateTabCode,
  updateTabTitle,
  getActiveTab,
  isTabModified,
  hasModifiedTabs,
  findTabBySourceId,
  duplicateAsUnnamed,
  markTabAsSaved,
  markTabSynced,
} from "./scriptWorkspaceState";
export type {
  TabSource,
  WorkspaceTab,
  WorkspaceState,
} from "./scriptWorkspaceState";
