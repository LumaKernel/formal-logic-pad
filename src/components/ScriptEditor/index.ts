export { ScriptEditorComponent } from "./ScriptEditorComponent";
export type { ScriptEditorComponentProps } from "./ScriptEditorComponent";
export {
  initialScriptEditorState,
  updateCode,
  startExecution,
  startStepping,
  recordStep,
  appendConsole,
  setRunResult,
  resetExecution,
  formatRunError,
  executionStatusLabel,
  defaultEditorOptions,
} from "./scriptEditorLogic";
export type {
  ExecutionStatus,
  ConsoleEntry,
  ScriptEditorState,
} from "./scriptEditorLogic";
