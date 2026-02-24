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
  findNode,
  removeNode,
  addConnection,
  removeConnection,
  changeSystem,
} from "./workspaceState";
export type {
  WorkspaceNode,
  WorkspaceConnection,
  WorkspaceState,
} from "./workspaceState";
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
