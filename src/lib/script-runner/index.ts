/**
 * script-runner モジュールのパブリック API。
 *
 * サンドボックス化された JavaScript 実行環境を提供する。
 * JS-Interpreter (Neil Fraser) をラップし、安全なコード実行・ステップ実行・
 * 実行制限（ステップ数・時間）を提供する。
 * 証明操作 API ブリッジも提供する。
 *
 * 型定義は builtin-api.d.ts に統合済み（?raw インポートで使用）。
 *
 * 変更時は scriptRunner.ts, proofBridge.ts, *.test.ts も同期すること。
 */

export {
  createScriptRunner,
  isScriptRunResult,
  type NativeFunctionBridge,
  type ScriptRunnerConfig,
  type ScriptRunResultOk,
  type ScriptRunResultError,
  type ScriptRunResult,
  type ScriptRunError,
  type StepLocation,
  type StepStatus,
  type ScriptRunnerInstance,
  type RunAsyncAbortSignal,
  type RunAsyncCallbacks,
  type ScopeVariable,
} from "./scriptRunner";
export {
  createProofBridges,
  PROOF_BRIDGE_API_DEFS,
  type ProofBridgeApiDef,
} from "./proofBridge";
export {
  createWorkspaceBridges,
  WORKSPACE_BRIDGE_API_DEFS,
  type WorkspaceCommandHandler,
  type WorkspaceNodeInfo,
} from "./workspaceBridge";
export {
  createCutEliminationBridges,
  CUT_ELIMINATION_BRIDGE_API_DEFS,
  encodeScProofNode,
  decodeScProofNode,
} from "./cutEliminationBridge";
export {
  createHilbertProofBridges,
  HILBERT_PROOF_BRIDGE_API_DEFS,
  encodeProofNode,
  decodeProofNode,
} from "./hilbertProofBridge";
export { createEitherBridges, EITHER_BRIDGE_API_DEFS } from "./eitherBridge";
