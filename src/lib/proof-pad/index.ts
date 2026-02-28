export { EditableProofNode } from "./EditableProofNode";
export type {
  EditableProofNodeProps,
  DependencyInfo,
} from "./EditableProofNode";
export { AxiomPalette } from "./AxiomPalette";
export type { AxiomPaletteProps } from "./AxiomPalette";
export {
  getAvailableAxioms,
  getAvailableNdRules,
  getAxiomReferenceEntryId,
} from "./axiomPaletteLogic";
export type { AxiomPaletteItem, NdRulePaletteItem } from "./axiomPaletteLogic";
export { getInferenceRuleReferenceEntryId } from "./inferenceRuleReferenceLogic";
export { ProofWorkspace } from "./ProofWorkspace";
export type { ProofWorkspaceProps, GoalAchievedInfo } from "./ProofWorkspace";
export {
  createEmptyWorkspace,
  createQuestWorkspace,
  convertToFreeMode,
  extractLogicSystem,
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
  updateInferenceEdgeGenVariableName,
  updateInferenceEdgeSubstitutionEntries,
  copySelectedNodes,
  pasteNodes,
  removeSelectedNodes,
  applyTreeLayout,
  applyIncrementalLayout,
  getInferenceEdges,
  addGoal,
  removeGoal,
  updateGoalFormulaText,
  mergeSelectedNodes,
} from "./workspaceState";
export type {
  WorkspaceMode,
  NodeRole,
  WorkspaceGoal,
  WorkspaceNode,
  WorkspaceConnection,
  WorkspaceState,
  QuestGoalDefinition,
  ApplyMPResult,
  ApplyGenResult,
  ApplySubstitutionResult,
  MergeNodesResult,
} from "./workspaceState";
export {
  mergeNodes,
  findMergeableGroups,
  canMergeSelectedNodes,
} from "./mergeNodesLogic";
export type { MergeResult, MergeError } from "./mergeNodesLogic";
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
  LeftPremiseMissing,
  RightPremiseMissing,
  BothPremisesMissing,
  LeftParseError,
  RightParseError,
  MPRuleError,
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
  GenPremiseMissing,
  GenPremiseParseError,
  GenVariableNameEmpty,
  GenGeneralizationNotEnabled,
  GenRuleError,
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
  SubstPremiseMissing,
  SubstPremiseParseError,
  SubstNoEntries,
  SubstFormulaParseError,
  SubstTermParseError,
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
  DERIVED_PORTS,
  CONCLUSION_PORTS,
  getProofNodeStyle,
  getProofNodePorts,
  getProofEdgeColor,
  getProofNodeKindLabel,
} from "./proofNodeUI";
export type { ProofNodeKind, ProofNodeStyle } from "./proofNodeUI";
export {
  isRootNode,
  classifyNode,
  classifyAllNodes,
  getAxiomNodeIds,
} from "./nodeRoleLogic";
export type { NodeClassification } from "./nodeRoleLogic";
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
export {
  identifyAxiomName,
  getAxiomDisplayName,
  isTrivialFormulaSubstitution,
  isTrivialTermSubstitution,
  isTrivialAxiomSubstitution,
} from "./axiomNameLogic";
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
  validateRootNodes,
  getInstanceRootNodeIds,
  hasInstanceRoots,
} from "./dependencyLogic";
export type { RootNodeValidation } from "./dependencyLogic";
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
export {
  findInferenceEdgesForNode,
  findInferenceEdgeForConclusionNode,
  getInferenceEdgeConclusionNodeId,
  getInferenceEdgeLabel,
  getInferenceEdgePremiseNodeIds,
} from "./inferenceEdge";
export type {
  MPEdge,
  GenEdge,
  SubstitutionEdge,
  InferenceEdge,
} from "./inferenceEdge";
