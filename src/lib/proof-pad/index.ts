export { EditableProofNode } from "./EditableProofNode";
export type {
  EditableProofNodeProps,
  DependencyInfo,
} from "./EditableProofNode";
export { AxiomPalette } from "./AxiomPalette";
export type { AxiomPaletteProps } from "./AxiomPalette";
export {
  getAvailableAxioms,
  getAxiomReferenceEntryId,
} from "./axiomPaletteLogic";
export type { AxiomPaletteItem } from "./axiomPaletteLogic";
export { getInferenceRuleReferenceEntryId } from "./inferenceRuleReferenceLogic";
export { ProofWorkspace } from "./ProofWorkspace";
export type { ProofWorkspaceProps, GoalAchievedInfo } from "./ProofWorkspace";
export {
  createEmptyWorkspace,
  createQuestWorkspace,
  convertToFreeMode,
  isNodeProtected,
  addNode,
  updateNodePosition,
  updateNodeFormulaText,
  updateNodeGenVariableName,
  updateNodeRole,
  findNode,
  removeNode,
  addConnection,
  removeConnection,
  changeSystem,
  applyMPAndConnect,
  applyGenAndConnect,
  applySubstitutionAndConnect,
  updateNodeSubstitutionEntries,
  copySelectedNodes,
  pasteNodes,
  removeSelectedNodes,
  applyTreeLayout,
  applyIncrementalLayout,
} from "./workspaceState";
export type {
  WorkspaceMode,
  NodeProtection,
  WorkspaceNode,
  WorkspaceConnection,
  WorkspaceState,
  QuestGoalDefinition,
  ApplyMPResult,
  ApplyGenResult,
  ApplySubstitutionResult,
} from "./workspaceState";
export {
  computeCentroid,
  buildClipboardData,
  serializeClipboardData,
  deserializeClipboardData,
  pasteClipboardData,
  toggleNodeSelection,
  selectSingleNode,
  clearSelection,
} from "./copyPasteLogic";
export type {
  CopiedNode,
  CopiedConnection,
  ClipboardData,
  PasteResult,
} from "./copyPasteLogic";
export {
  getMPPremises,
  parseNodeFormula,
  validateMPApplication,
  getMPErrorMessage,
} from "./mpApplicationLogic";
export type {
  MPPremiseState,
  MPApplicationSuccess,
  MPApplicationError,
  MPApplicationResult,
} from "./mpApplicationLogic";
export {
  getGenPremise,
  validateGenApplication,
  getGenErrorMessage,
} from "./genApplicationLogic";
export type {
  GenApplicationSuccess,
  GenApplicationError,
  GenApplicationResult,
} from "./genApplicationLogic";
export {
  getSubstitutionPremise,
  validateSubstitutionApplication,
  getSubstitutionErrorMessage,
  buildFormulaSubstitutionMap,
  buildTermSubstitutionMap,
} from "./substitutionApplicationLogic";
export type {
  FormulaSubstitutionEntry,
  TermSubstitutionEntry,
  SubstitutionEntry,
  SubstitutionEntries,
  SubstitutionApplicationSuccess,
  SubstitutionApplicationError,
  SubstitutionApplicationResult,
} from "./substitutionApplicationLogic";
export {
  PROOF_NODE_KINDS,
  AXIOM_PORTS,
  MP_PORTS,
  GEN_PORTS,
  SUBSTITUTION_PORTS,
  CONCLUSION_PORTS,
  getProofNodeStyle,
  getProofNodePorts,
  getProofEdgeColor,
} from "./proofNodeUI";
export type { ProofNodeKind, ProofNodeStyle } from "./proofNodeUI";
export {
  isRootNode,
  classifyNode,
  classifyAllNodes,
  getGoalNodeIds,
  getAxiomNodeIds,
} from "./nodeRoleLogic";
export type { NodeRole, NodeClassification } from "./nodeRoleLogic";
export {
  computeDetailLevel,
  getDetailVisibility,
  DEFAULT_THRESHOLDS,
} from "./levelOfDetail";
export type {
  DetailLevel,
  DetailLevelThresholds,
  DetailVisibility,
  DetailVisibilityOverrides,
} from "./levelOfDetail";
export { identifyAxiomName, getAxiomDisplayName } from "./axiomNameLogic";
export type { AxiomNameResult } from "./axiomNameLogic";
export { parseGoalFormula, checkGoal } from "./goalCheckLogic";
export type {
  GoalNotSet,
  GoalAllAchieved,
  GoalPartiallyAchieved,
  GoalStatus,
  AchievedGoalInfo,
  GoalCheckResult,
} from "./goalCheckLogic";
export {
  getNodeDependencies,
  getAllNodeDependencies,
  getSubtreeNodeIds,
  getNodeAxiomIds,
} from "./dependencyLogic";
export {
  computeTreeLayout,
  computeLayoutDiff,
  buildAdjacencyLists,
  buildForest,
  findRootNodes,
  findLeafNodes,
  computeLevelHeights,
  computeTotalHeight,
  flipYPositions,
  DEFAULT_LAYOUT_CONFIG,
} from "./treeLayoutLogic";
export type {
  LayoutNode,
  LayoutEdge,
  LayoutDirection,
  LayoutConfig,
  LayoutResult,
} from "./treeLayoutLogic";
export {
  exportWorkspaceToJSON,
  importWorkspaceFromJSON,
  generateExportFileName,
} from "./workspaceExport";
export type {
  WorkspaceExportData,
  DateComponents,
  ImportResult,
} from "./workspaceExport";
export {
  computeExportBounds,
  generateExportSVG,
  generateImageExportFileName,
} from "./workspaceImageExport";
export type {
  BoundingBox,
  NodeSizeMap,
  SVGExportOptions,
} from "./workspaceImageExport";
export {
  isOutputPort,
  isInputPort,
  isInputPortOccupied,
  validatePortConnection,
  validateDragConnection,
} from "./portConnectionLogic";
export {
  defaultProofMessages,
  getMPErrorMessageKey,
  getGenErrorMessageKey,
  getSubstitutionErrorMessageKey,
  formatMessage,
} from "./proofMessages";
export type { ProofMessages } from "./proofMessages";
export {
  ProofMessagesProvider,
  useProofMessages,
} from "./ProofMessagesContext";
export type { ProofMessagesProviderProps } from "./ProofMessagesContext";
