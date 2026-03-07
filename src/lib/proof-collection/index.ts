/**
 * 証明コレクションモジュールの公開API。
 *
 * ユーザーが保存した証明図のコレクション管理を提供する。
 *
 * 変更時はこのファイルのエクスポートを確認すること。
 */

// --- 型定義 ---
export type {
  ProofEntryId,
  ProofFolderId,
  SavedNode,
  SavedConnection,
  ProofEntry,
  ProofFolder,
  ProofCollection,
  AddEntryParams,
  ProofSaveParams,
} from "./proofCollectionState";

// --- 状態管理 ---
export {
  createEmptyProofCollection,
  addProofEntry,
  removeProofEntry,
  renameProofEntry,
  updateProofEntryMemo,
  moveProofEntry,
  findProofEntry,
  listEntriesInFolder,
  listEntriesByUpdatedAt,
  createProofFolder,
  removeProofFolder,
  renameProofFolder,
  findProofFolder,
  listFolders,
  extractProofData,
  collectUsedAxiomIds,
  prepareProofSaveParams,
} from "./proofCollectionState";

// --- 互換性チェック ---
export type {
  FullyCompatible,
  CompatibleWithAxiomWarnings,
  IncompatibleStyle,
  CompatibilityResult,
} from "./proofCollectionCompatibility";

export {
  checkProofCompatibility,
  isCallable,
  hasWarnings,
} from "./proofCollectionCompatibility";

// --- シリアライゼーション ---
export {
  serializeProofCollection,
  deserializeProofCollection,
} from "./proofCollectionSerialization";

// --- React hook ---
export type {
  UseProofCollectionResult,
  UseProofCollectionOptions,
  GetNow,
} from "./useProofCollection";

export {
  useProofCollection,
  loadProofCollection,
  saveProofCollection,
  PROOF_COLLECTION_STORAGE_KEY,
} from "./useProofCollection";

// --- パネルロジック ---
export type {
  EditingField,
  EditingState,
  PanelState,
} from "./proofCollectionPanelLogic";

export {
  createInitialPanelState,
  startEditing,
  updateEditingValue,
  cancelEditing,
  isEditing,
} from "./proofCollectionPanelLogic";

// --- パネルUI ---
export { ProofCollectionPanel } from "./ProofCollectionPanel";
export type { ProofCollectionPanelProps } from "./ProofCollectionPanel";
