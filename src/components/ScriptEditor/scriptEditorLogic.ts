/**
 * ScriptEditor の純粋ロジック。
 *
 * Monaco Editor の設定やスクリプト実行結果の整形を担う。
 * UI コンポーネント (ScriptEditorComponent.tsx) と一緒に変更すること。
 */

import type { ScriptRunResult, StepStatus } from "@/lib/script-runner";

// ── 実行状態 ─────────────────────────────────────────────────

export type ExecutionStatus =
  | "idle"
  | "running"
  | "stepping"
  | "done"
  | "error";

export interface ConsoleEntry {
  readonly type: "log" | "error" | "warn";
  readonly message: string;
}

export interface ScriptEditorState {
  readonly code: string;
  readonly executionStatus: ExecutionStatus;
  readonly consoleOutput: readonly ConsoleEntry[];
  readonly currentStep: number;
  readonly errorMessage: string | null;
}

export const initialScriptEditorState: ScriptEditorState = {
  code: `// Proof Bridge API が使えます\n// 例: const f = parseFormula("phi -> psi");\n`,
  executionStatus: "idle",
  consoleOutput: [],
  currentStep: 0,
  errorMessage: null,
};

// ── エラー表示（recordStep, setRunResult が依存）────────────

export const formatRunError = (result: ScriptRunResult): string => {
  if (result._tag === "Ok") return "";
  const err = result.error;
  switch (err._tag) {
    case "SyntaxError":
      return `SyntaxError: ${err.message satisfies string}`;
    case "RuntimeError":
      return `RuntimeError: ${err.message satisfies string}`;
    case "StepLimitExceeded":
      return `Step limit exceeded (${String(err.maxSteps) satisfies string} steps)`;
    case "TimeLimitExceeded":
      return `Time limit exceeded (${String(err.maxTimeMs) satisfies string}ms)`;
    default: {
      /* v8 ignore start */
      const _exhaustive: never = err;
      return String(_exhaustive);
      /* v8 ignore stop */
    }
  }
};

// ── 状態更新（純粋関数）───────────────────────────────────────

export const updateCode = (
  state: ScriptEditorState,
  code: string,
): ScriptEditorState => ({
  ...state,
  code,
});

export const startExecution = (
  state: ScriptEditorState,
): ScriptEditorState => ({
  ...state,
  executionStatus: "running",
  consoleOutput: [],
  currentStep: 0,
  errorMessage: null,
});

export const startStepping = (state: ScriptEditorState): ScriptEditorState => ({
  ...state,
  executionStatus: "stepping",
  consoleOutput: [],
  currentStep: 0,
  errorMessage: null,
});

export const recordStep = (
  state: ScriptEditorState,
  stepStatus: StepStatus,
): ScriptEditorState => {
  switch (stepStatus._tag) {
    case "Running":
      return {
        ...state,
        currentStep: stepStatus.steps,
      };
    case "Done":
      return {
        ...state,
        currentStep: stepStatus.steps,
        executionStatus: "done",
      };
    case "Error":
      return {
        ...state,
        currentStep: stepStatus.steps,
        executionStatus: "error",
        errorMessage: formatRunError({
          _tag: "Error",
          error: stepStatus.error,
          steps: stepStatus.steps,
          elapsedMs: 0,
        }),
      };
    default: {
      /* v8 ignore start */
      const _exhaustive: never = stepStatus;
      return _exhaustive;
      /* v8 ignore stop */
    }
  }
};

export const appendConsole = (
  state: ScriptEditorState,
  entry: ConsoleEntry,
): ScriptEditorState => ({
  ...state,
  consoleOutput: [...state.consoleOutput, entry],
});

export const setRunResult = (
  state: ScriptEditorState,
  result: ScriptRunResult,
): ScriptEditorState => {
  if (result._tag === "Ok") {
    return {
      ...state,
      executionStatus: "done",
      currentStep: result.steps,
      errorMessage: null,
    };
  }
  return {
    ...state,
    executionStatus: "error",
    currentStep: result.steps,
    errorMessage: formatRunError(result),
  };
};

export const resetExecution = (
  state: ScriptEditorState,
): ScriptEditorState => ({
  ...state,
  executionStatus: "idle",
  consoleOutput: [],
  currentStep: 0,
  errorMessage: null,
});

// ── 実行ステータスの表示文字列 ──────────────────────────────

export const executionStatusLabel = (status: ExecutionStatus): string => {
  switch (status) {
    case "idle":
      return "Ready";
    case "running":
      return "Running...";
    case "stepping":
      return "Stepping...";
    case "done":
      return "Done";
    case "error":
      return "Error";
    default: {
      /* v8 ignore start */
      const _exhaustive: never = status;
      return String(_exhaustive);
      /* v8 ignore stop */
    }
  }
};

// ── デフォルトのエディタオプション ────────────────────────────

export const defaultEditorOptions = {
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  fontSize: 14,
  tabSize: 2,
  wordWrap: "on" as const,
  lineNumbers: "on" as const,
} as const;
