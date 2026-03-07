/**
 * script-runner モジュールのパブリック API。
 *
 * サンドボックス化された JavaScript 実行環境を提供する。
 * JS-Interpreter (Neil Fraser) をラップし、安全なコード実行・ステップ実行・
 * 実行制限（ステップ数・時間）を提供する。
 * 証明操作 API ブリッジも提供する。
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
} from "./scriptRunner";
export {
  createProofBridges,
  PROOF_BRIDGE_API_DEFS,
  generateProofBridgeTypeDefs,
  type ProofBridgeApiDef,
} from "./proofBridge";
export {
  createWorkspaceBridges,
  WORKSPACE_BRIDGE_API_DEFS,
  generateWorkspaceBridgeTypeDefs,
  type WorkspaceCommandHandler,
  type WorkspaceNodeInfo,
} from "./workspaceBridge";
