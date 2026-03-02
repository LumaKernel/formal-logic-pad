/**
 * script-runner モジュールのパブリック API。
 *
 * サンドボックス化された JavaScript 実行環境を提供する。
 * JS-Interpreter (Neil Fraser) をラップし、安全なコード実行・ステップ実行・
 * 実行制限（ステップ数・時間）を提供する。
 *
 * 変更時は scriptRunner.ts, scriptRunner.test.ts も同期すること。
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
  type StepStatus,
  type ScriptRunnerInstance,
} from "./scriptRunner";
