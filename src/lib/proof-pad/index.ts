export { EditableProofNode } from "./EditableProofNode";
export type {
  EditableProofNodeProps,
  DependencyInfo,
} from "./EditableProofNode";
export { AxiomPalette } from "./AxiomPalette";
export type { AxiomPaletteProps } from "./AxiomPalette";
export { getAvailableAxioms } from "./axiomPaletteLogic";
export type { AxiomPaletteItem } from "./axiomPaletteLogic";
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
  updateGoalFormulaText,
  updateNodeGenVariableName,
  updateNodeRole,
  findNode,
  removeNode,
  addConnection,
  removeConnection,
  changeSystem,
  applyMPAndConnect,
  applyGenAndConnect,
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
  PROOF_NODE_KINDS,
  AXIOM_PORTS,
  MP_PORTS,
  GEN_PORTS,
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
export { identifyAxiomName, getAxiomDisplayName } from "./axiomNameLogic";
export type { AxiomNameResult } from "./axiomNameLogic";
export { parseGoalFormula, checkGoal } from "./goalCheckLogic";
export type {
  GoalNotSet,
  GoalParseError,
  GoalNotAchieved,
  GoalAchieved,
  GoalCheckResult,
} from "./goalCheckLogic";
export {
  getNodeDependencies,
  getAllNodeDependencies,
  getSubtreeNodeIds,
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
