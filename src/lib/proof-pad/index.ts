export { EditableProofNode } from "./EditableProofNode";
export type {
  EditableProofNodeProps,
  DependencyInfo,
} from "./EditableProofNode";
export { AxiomPalette } from "./AxiomPalette";
export type { AxiomPaletteProps } from "./AxiomPalette";
export { NdRulePalette } from "./NdRulePalette";
export type { NdRulePaletteProps } from "./NdRulePalette";
export { TabRulePalette } from "./TabRulePalette";
export type { TabRulePaletteProps } from "./TabRulePalette";
export { AtRulePalette } from "./AtRulePalette";
export type { AtRulePaletteProps } from "./AtRulePalette";
export { ScRulePalette } from "./ScRulePalette";
export type { ScRulePaletteProps } from "./ScRulePalette";
export {
  getAvailableAxioms,
  getAvailableNdRules,
  getAvailableTabRules,
  getAvailableAtRules,
  getAvailableScRules,
  getAxiomReferenceEntryId,
} from "./axiomPaletteLogic";
export type {
  AxiomPaletteItem,
  NdRulePaletteItem,
  TabRulePaletteItem,
  AtRulePaletteItem,
  ScRulePaletteItem,
} from "./axiomPaletteLogic";
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
  updateNodeRole,
  findNode,
  removeNode,
  addConnection,
  removeConnection,
  changeSystem,
  applyMPAndConnect,
  applyGenAndConnect,
  applySubstitutionAndConnect,
  applyTabRuleAndConnect,
  applyAtRuleAndConnect,
  applyScRuleAndConnect,
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
  ApplyTabRuleResult,
  ApplyAtRuleResult,
  ApplyScRuleResult,
  MergeNodesResult,
} from "./workspaceState";
export {
  mergeNodes,
  findMergeableGroups,
  canMergeSelectedNodes,
  findMergeTargets,
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
  validateMPApplicationEffect,
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
  validateGenApplicationEffect,
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
  validateSubstitutionApplicationEffect,
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
  validateNdApplicationEffect,
  validateNdApplication,
  getNdErrorMessage,
  isNdEfqValidResult,
  NdPremiseMissing,
  NdPremiseParseError,
  NdAdditionalFormulaParseError,
  NdStructuralError,
  NdDischargedFormulaParseError,
  NdCaseConclusionMismatch,
} from "./ndApplicationLogic";
export type {
  NdApplicationSuccess,
  NdEfqValidResult,
  NdValidationSuccess,
  NdApplicationError,
  NdApplicationResult,
} from "./ndApplicationLogic";
export {
  splitSequentText,
  formatSequentText,
  parseSequentFormulas,
  validateTabApplicationEffect,
  validateTabApplication,
  createTabEdgeFromResult,
  isTabAxiomRule,
  isTabSinglePremiseRule,
  getTabErrorMessage,
  TabSequentParseError,
  TabPrincipalPositionOutOfRange,
  TabPrincipalFormulaMismatch,
  TabEigenVariableError,
  TabTermParseError,
  TabExchangePositionError,
} from "./tabApplicationLogic";
export type {
  TabRuleApplicationParams,
  TabSinglePremiseResult,
  TabBranchingResult,
  TabAxiomResult,
  TabApplicationSuccess,
  TabApplicationError,
  TabApplicationResult,
} from "./tabApplicationLogic";
export {
  formatSignedFormulaText,
  parseSignedFormulaText,
  validateAtApplicationEffect,
  validateAtApplication,
  createAtEdgeFromResult,
  getAtErrorMessage,
  AtFormulaParseError,
  AtPrincipalFormulaMismatch,
  AtEigenVariableError,
  AtTermParseError,
  AtContradictionError,
} from "./atApplicationLogic";
export type {
  AtRuleApplicationParams,
  AtAlphaResult,
  AtBetaResult,
  AtGammaResult,
  AtDeltaResult,
  AtClosedResult,
  AtApplicationSuccess,
  AtApplicationError,
  AtApplicationResult,
} from "./atApplicationLogic";
export {
  splitSequentTextParts,
  parseSequentText,
  formatSequentTextFromFormulas,
  validateScApplicationEffect,
  validateScApplication,
  createScEdgeFromResult,
  isScAxiomRule,
  isScSinglePremiseRule,
  isScBranchingRule,
  getScErrorMessage,
  ScSequentParseError,
  ScPrincipalPositionOutOfRange,
  ScPrincipalFormulaMismatch,
  ScEigenVariableError,
  ScTermParseError,
  ScExchangePositionError,
  ScComponentIndexError,
} from "./scApplicationLogic";
export type {
  SequentTextParts,
  ParsedSequent,
  ScRuleApplicationParams,
  ScSinglePremiseResult,
  ScBranchingResult,
  ScAxiomResult,
  ScApplicationSuccess,
  ScApplicationError,
  ScApplicationResult,
} from "./scApplicationLogic";
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
export { computeGoalPanelData } from "./goalPanelLogic";
export type {
  GoalPanelItem,
  GoalPanelItemStatus,
  GoalPanelData,
  AllowedAxiomDetail,
} from "./goalPanelLogic";
export { GoalPanel } from "./GoalPanel";
export type { GoalPanelProps } from "./GoalPanel";
export {
  computeCutEliminationStepperData,
  resolveStepperState,
  applyStepperAction,
  canStepForward,
  canStepBackward,
  formatSequentText as formatSequentTextForStepper,
} from "./cutEliminationStepperLogic";
export type {
  StepperStepInfo,
  CutEliminationStepperData,
  StepperAction,
} from "./cutEliminationStepperLogic";
export { CutEliminationStepper } from "./CutEliminationStepper";
export type { CutEliminationStepperProps } from "./CutEliminationStepper";
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
  getProofNodeIds,
  getNodeAxiomIds,
  validateRootNodes,
  getInstanceRootNodeIds,
  hasInstanceRoots,
  deduplicateDependencyInfos,
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
  remapEdgeNodeIds,
  replaceNodeIdInEdge,
  isHilbertInferenceEdge,
  isNdInferenceEdge,
  isTabInferenceEdge,
  isAtInferenceEdge,
} from "./inferenceEdge";
export type {
  MPEdge,
  GenEdge,
  SubstitutionEdge,
  HilbertInferenceEdge,
  NdImplicationIntroEdge,
  NdImplicationElimEdge,
  NdConjunctionIntroEdge,
  NdConjunctionElimLeftEdge,
  NdConjunctionElimRightEdge,
  NdDisjunctionIntroLeftEdge,
  NdDisjunctionIntroRightEdge,
  NdDisjunctionElimEdge,
  NdWeakeningEdge,
  NdEfqEdge,
  NdDneEdge,
  NdInferenceEdge,
  TabSinglePremiseEdge,
  TabBranchingEdge,
  TabAxiomEdge,
  TabInferenceEdge,
  AtAlphaEdge,
  AtBetaEdge,
  AtGammaEdge,
  AtDeltaEdge,
  AtClosedEdge,
  AtInferenceEdge,
  InferenceEdge,
} from "./inferenceEdge";
