/**
 * ScriptEditor の純粋ロジック。
 *
 * Monaco Editor の設定やスクリプト実行結果の整形を担う。
 * UI コンポーネント (ScriptEditorComponent.tsx) と一緒に変更すること。
 */

import type {
  ScriptRunResult,
  StepLocation,
  StepStatus,
} from "@/lib/script-runner";

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
  /** 自動再生のステップ間隔（ミリ秒）。スライダーで調整可能 */
  readonly autoPlayIntervalMs: number;
  /** 現在のステップ実行位置（ハイライト用）。null = 位置情報なし */
  readonly currentLocation: StepLocation | null;
}

/** デフォルトの自動再生間隔 (ms) */
export const DEFAULT_AUTO_PLAY_INTERVAL_MS = 200;

/** 自動再生間隔の最小値 (ms) */
export const MIN_AUTO_PLAY_INTERVAL_MS = 10;

/** 自動再生間隔の最大値 (ms) */
export const MAX_AUTO_PLAY_INTERVAL_MS = 2000;

export const initialScriptEditorState: ScriptEditorState = {
  code: `// Proof Bridge API が使えます\n// 例: const f = parseFormula("phi -> psi");\n`,
  executionStatus: "idle",
  consoleOutput: [],
  currentStep: 0,
  errorMessage: null,
  autoPlayIntervalMs: DEFAULT_AUTO_PLAY_INTERVAL_MS,
  currentLocation: null,
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
  currentLocation: null,
});

export const startStepping = (state: ScriptEditorState): ScriptEditorState => ({
  ...state,
  executionStatus: "stepping",
  consoleOutput: [],
  currentStep: 0,
  errorMessage: null,
  currentLocation: null,
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
        currentLocation: stepStatus.location,
      };
    case "Done":
      return {
        ...state,
        currentStep: stepStatus.steps,
        executionStatus: "done",
        currentLocation: null,
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
        currentLocation: null,
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
      currentLocation: null,
    };
  }
  return {
    ...state,
    executionStatus: "error",
    currentStep: result.steps,
    errorMessage: formatRunError(result),
    currentLocation: null,
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
  currentLocation: null,
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

// ── 自動再生速度 ────────────────────────────────────────────

export const updateAutoPlayInterval = (
  state: ScriptEditorState,
  intervalMs: number,
): ScriptEditorState => ({
  ...state,
  autoPlayIntervalMs: Math.max(
    MIN_AUTO_PLAY_INTERVAL_MS,
    Math.min(MAX_AUTO_PLAY_INTERVAL_MS, intervalMs),
  ),
});

/** スライダー値(0-100)を間隔(ms)に変換。0=最速、100=最遅 */
export const sliderToIntervalMs = (sliderValue: number): number => {
  const ratio = sliderValue / 100;
  return Math.round(
    MIN_AUTO_PLAY_INTERVAL_MS +
      ratio * (MAX_AUTO_PLAY_INTERVAL_MS - MIN_AUTO_PLAY_INTERVAL_MS),
  );
};

/** 間隔(ms)をスライダー値(0-100)に変換 */
export const intervalMsToSlider = (intervalMs: number): number => {
  const ratio =
    (intervalMs - MIN_AUTO_PLAY_INTERVAL_MS) /
    (MAX_AUTO_PLAY_INTERVAL_MS - MIN_AUTO_PLAY_INTERVAL_MS);
  return Math.round(ratio * 100);
};

// ── エラー位置の抽出 ──────────────────────────────────────────

export interface ErrorLocation {
  /** 1-indexed の行番号 */
  readonly line: number;
  /** 1-indexed の列番号 */
  readonly column: number;
}

/**
 * エラーメッセージから行・列情報を抽出する。
 *
 * JS-Interpreter の SyntaxError は "(行:列)" 形式の位置情報を含む。
 * consoleShimCode 等で先頭に挿入された行数分を lineOffset で差し引く。
 *
 * @param errorMessage エラーメッセージ文字列
 * @param lineOffset 先頭に挿入されたコードの行数（差し引く値）
 * @returns 抽出できた場合は ErrorLocation、できなかった場合は null
 */
export const extractErrorLocation = (
  errorMessage: string,
  lineOffset: number,
): ErrorLocation | null => {
  // JS-Interpreter SyntaxError: "Unexpected token (3:9)"
  const match = /\((\d+):(\d+)\)/.exec(errorMessage);
  if (match === null) return null;

  const rawLine = Number(match[1]);
  const rawColumn = Number(match[2]);
  const adjustedLine = rawLine - lineOffset;

  if (adjustedLine < 1) return null;

  return { line: adjustedLine, column: rawColumn + 1 };
};

// ── ステップ実行の行ハイライト位置計算 ─────────────────────────

/**
 * ステップ実行時の行番号を、consoleShimCode のオフセット分を差し引いて
 * ユーザーコード内の行番号に変換する。
 *
 * @param location StepLocation（JS-Interpreter が返す raw な行番号）
 * @param lineOffset 先頭に挿入されたコードの行数（差し引く値）
 * @returns ユーザーコード内の行番号（1-indexed）。null = 無効な位置
 */
export const adjustStepLocationLine = (
  location: StepLocation,
  lineOffset: number,
): number | null => {
  const adjustedLine = location.line - lineOffset;
  if (adjustedLine < 1) return null;
  return adjustedLine;
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
  glyphMargin: true,
} as const;
