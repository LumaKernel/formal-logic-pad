export { EditableProofNode } from "./EditableProofNode";
export type { EditableProofNodeProps } from "./EditableProofNode";
export { AxiomPalette } from "./AxiomPalette";
export type { AxiomPaletteProps } from "./AxiomPalette";
export { getAvailableAxioms } from "./axiomPaletteLogic";
export type { AxiomPaletteItem } from "./axiomPaletteLogic";
export { ProofWorkspace } from "./ProofWorkspace";
export type { ProofWorkspaceProps } from "./ProofWorkspace";
export {
  createEmptyWorkspace,
  addNode,
  updateNodePosition,
  updateNodeFormulaText,
  updateGoalFormulaText,
  findNode,
  removeNode,
  addConnection,
  removeConnection,
  changeSystem,
  applyMPAndConnect,
} from "./workspaceState";
export type {
  WorkspaceNode,
  WorkspaceConnection,
  WorkspaceState,
  ApplyMPResult,
} from "./workspaceState";
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
  PROOF_NODE_KINDS,
  AXIOM_PORTS,
  MP_PORTS,
  CONCLUSION_PORTS,
  getProofNodeStyle,
  getProofNodePorts,
  getProofEdgeColor,
} from "./proofNodeUI";
export type { ProofNodeKind, ProofNodeStyle } from "./proofNodeUI";
export { parseGoalFormula, checkGoal } from "./goalCheckLogic";
export type {
  GoalNotSet,
  GoalParseError,
  GoalNotAchieved,
  GoalAchieved,
  GoalCheckResult,
} from "./goalCheckLogic";
