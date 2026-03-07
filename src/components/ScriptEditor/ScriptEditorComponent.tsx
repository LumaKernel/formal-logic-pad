/**
 * Monaco Editor ベースのスクリプトエディタコンポーネント。
 *
 * 証明操作 API (proofBridge) の補完・型情報付きで JavaScript を編集し、
 * サンドボックス内でのスクリプト実行・ステップ実行を提供する。
 *
 * 変更時は scriptEditorLogic.ts, scriptEditorLogic.test.ts, index.ts も同期すること。
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import type { OnMount, BeforeMount } from "@monaco-editor/react";
import {
  createScriptRunner,
  createProofBridges,
  generateProofBridgeTypeDefs,
  isScriptRunResult,
  createWorkspaceBridges,
  generateWorkspaceBridgeTypeDefs,
} from "@/lib/script-runner";
import type {
  NativeFunctionBridge,
  ScriptRunnerInstance,
  WorkspaceCommandHandler,
} from "@/lib/script-runner";
import {
  initialScriptEditorState,
  updateCode,
  startExecution,
  startStepping,
  recordStep,
  appendConsole,
  setRunResult,
  resetExecution,
  executionStatusLabel,
  updateAutoPlayInterval,
  sliderToIntervalMs,
  intervalMsToSlider,
  extractErrorLocation,
  adjustStepLocationLine,
  defaultEditorOptions,
} from "./scriptEditorLogic";
import type { ScriptEditorState } from "./scriptEditorLogic";
import styles from "./ScriptEditorComponent.module.css";

// ── Props ─────────────────────────────────────────────────────

export interface ScriptEditorComponentProps {
  /** 初期コード (省略時はデフォルトテンプレート) */
  readonly initialCode?: string;
  /** エディタの高さ (CSS値) */
  readonly height?: string;
  /** コード変更時コールバック */
  readonly onCodeChange?: (code: string) => void;
  /** 実行完了時コールバック */
  readonly onRunComplete?: (result: ScriptEditorState) => void;
  /** ワークスペース操作ハンドラー（証明図リアルタイム反映用） */
  readonly workspaceCommandHandler?: WorkspaceCommandHandler;
}

// ── Component ─────────────────────────────────────────────────

export const ScriptEditorComponent: React.FC<ScriptEditorComponentProps> = ({
  initialCode,
  height = "400px",
  onCodeChange,
  onRunComplete,
  workspaceCommandHandler,
}) => {
  const [state, setState] = useState<ScriptEditorState>(() =>
    initialCode
      ? updateCode(initialScriptEditorState, initialCode)
      : initialScriptEditorState,
  );

  const runnerRef = useRef<ScriptRunnerInstance | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const decorationsRef = useRef<ReturnType<
    Parameters<OnMount>[0]["createDecorationsCollection"]
  > | null>(null);

  // ── console.log ブリッジ ────────────────────────────────────

  const createConsoleBridges =
    useCallback((): readonly NativeFunctionBridge[] => {
      const logFn = (...args: readonly unknown[]) => {
        const message = args.map((a) => String(a)).join(" ");
        setState((prev) => appendConsole(prev, { type: "log", message }));
      };
      const errorFn = (...args: readonly unknown[]) => {
        const message = args.map((a) => String(a)).join(" ");
        setState((prev) => appendConsole(prev, { type: "error", message }));
      };
      const warnFn = (...args: readonly unknown[]) => {
        const message = args.map((a) => String(a)).join(" ");
        setState((prev) => appendConsole(prev, { type: "warn", message }));
      };
      return [
        { name: "console_log", fn: logFn },
        { name: "console_error", fn: errorFn },
        { name: "console_warn", fn: warnFn },
      ];
    }, []);

  // ── 全ブリッジ構築 ────────────────────────────────────────

  const buildAllBridges =
    useCallback((): readonly NativeFunctionBridge[] => {
      const all: NativeFunctionBridge[] = [
        ...createProofBridges(),
        ...createConsoleBridges(),
      ];
      if (workspaceCommandHandler) {
        all.push(...createWorkspaceBridges(workspaceCommandHandler));
      }
      return all;
    }, [createConsoleBridges, workspaceCommandHandler]);

  // ── コンソール初期化コード ────────────────────────────────

  const consoleShimCode = `var console = { log: console_log, error: console_error, warn: console_warn };\n`;

  /** consoleShimCode が挿入する行数（エラー行番号のオフセット補正用） */
  const consoleShimLineCount = 1;

  // ── Monaco beforeMount: 型定義を注入 ────────────────────────

  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      allowJs: true,
      noEmit: true,
    });

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    const typeDefs = generateProofBridgeTypeDefs();
    const workspaceTypeDefs = generateWorkspaceBridgeTypeDefs();
    const consoleTypeDefs = `
declare var console: {
  log(...args: unknown[]): void;
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
};
`;
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      typeDefs + workspaceTypeDefs + consoleTypeDefs,
      "file:///proof-bridge.d.ts",
    );
  }, []);

  // ── Monaco onMount ────────────────────────────────────────────

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  }, []);

  // ── コード変更 ───────────────────────────────────────────────

  const handleChange = useCallback(
    (value: string | undefined) => {
      const code = value ?? "";
      setState((prev) => updateCode(prev, code));
      onCodeChange?.(code);
    },
    [onCodeChange],
  );

  // ── Run (全実行) ──────────────────────────────────────────────

  const handleRun = useCallback(() => {
    setState((prev) => {
      const next = startExecution(prev);
      const bridges = buildAllBridges();
      const fullCode = consoleShimCode + prev.code;
      const result = createScriptRunner(fullCode, {
        bridges,
        maxSteps: 100_000,
        maxTimeMs: 10_000,
      });

      if (isScriptRunResult(result)) {
        const final = setRunResult(next, result);
        // 非同期ではないが次のレンダーでonRunCompleteを呼ぶ
        setTimeout(() => onRunComplete?.(final), 0);
        return final;
      }

      // ScriptRunnerInstance が返った場合は run() で全実行
      const runResult = result.run();
      const final = setRunResult(next, runResult);
      setTimeout(() => onRunComplete?.(final), 0);
      return final;
    });
  }, [buildAllBridges, consoleShimCode, onRunComplete]);

  // ── Step (ステップ実行開始/続行) ──────────────────────────────

  const handleStep = useCallback(() => {
    if (state.executionStatus === "done" || state.executionStatus === "error") {
      // 完了/エラー後にStepを押したらリセットして新規開始
      runnerRef.current = null;
    }

    if (runnerRef.current === null) {
      // 新規ステップ実行開始 — state.code を直接参照
      const bridges = buildAllBridges();
      const fullCode = consoleShimCode + state.code;
      const result = createScriptRunner(fullCode, {
        bridges,
        maxSteps: 100_000,
        maxTimeMs: 10_000,
      });

      if (isScriptRunResult(result)) {
        // すでに完了（構文エラー等）
        setState((prev) => setRunResult(startStepping(prev), result));
        return;
      }

      runnerRef.current = result;
      setState((prev) => startStepping(prev));
    }

    // 1ステップ実行
    const runner = runnerRef.current;
    if (runner) {
      const stepStatus = runner.step();
      setState((prev) => {
        const next = recordStep(prev, stepStatus);
        if (stepStatus._tag === "Done" || stepStatus._tag === "Error") {
          runnerRef.current = null;
        }
        return next;
      });
    }
  }, [
    state.executionStatus,
    state.code,
    buildAllBridges,
    consoleShimCode,
  ]);

  // ── 自動再生の1ステップ実行 ──────────────────────────────────

  const executeOneStep = useCallback(() => {
    const runner = runnerRef.current;
    if (!runner) {
      setIsAutoPlaying(false);
      return;
    }
    const stepStatus = runner.step();
    setState((prev) => {
      const next = recordStep(prev, stepStatus);
      if (stepStatus._tag === "Done" || stepStatus._tag === "Error") {
        runnerRef.current = null;
        setIsAutoPlaying(false);
      }
      return next;
    });
  }, []);

  // ── Play (自動ステップ実行開始) ──────────────────────────────

  const handlePlay = useCallback(() => {
    if (state.executionStatus === "done" || state.executionStatus === "error") {
      runnerRef.current = null;
    }

    if (runnerRef.current === null) {
      const bridges = buildAllBridges();
      const fullCode = consoleShimCode + state.code;
      const result = createScriptRunner(fullCode, {
        bridges,
        maxSteps: 100_000,
        maxTimeMs: 10_000,
      });

      if (isScriptRunResult(result)) {
        setState((prev) => setRunResult(startStepping(prev), result));
        return;
      }

      runnerRef.current = result;
      setState((prev) => startStepping(prev));
    }

    setIsAutoPlaying(true);
  }, [
    state.executionStatus,
    state.code,
    buildAllBridges,
    consoleShimCode,
  ]);

  // ── Pause (自動再生停止) ─────────────────────────────────────

  const handlePause = useCallback(() => {
    setIsAutoPlaying(false);
  }, []);

  // ── 自動再生タイマー制御 ─────────────────────────────────────

  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayTimerRef.current = setInterval(
        executeOneStep,
        state.autoPlayIntervalMs,
      );
    } else if (autoPlayTimerRef.current !== null) {
      clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    return () => {
      if (autoPlayTimerRef.current !== null) {
        clearInterval(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    };
  }, [isAutoPlaying, state.autoPlayIntervalMs, executeOneStep]);

  // ── 速度スライダー ──────────────────────────────────────────

  const handleSpeedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const sliderValue = Number(e.target.value);
      const intervalMs = sliderToIntervalMs(sliderValue);
      setState((prev) => updateAutoPlayInterval(prev, intervalMs));
    },
    [],
  );

  // ── Reset ──────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setIsAutoPlaying(false);
    runnerRef.current = null;
    setState((prev) => resetExecution(prev));
  }, []);

  // ── エラーマーカーの更新 ──────────────────────────────────────

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const model = editor.getModel();
    if (!model) return;

    if (state.errorMessage !== null) {
      const loc = extractErrorLocation(
        state.errorMessage,
        consoleShimLineCount,
      );
      if (loc !== null) {
        monaco.editor.setModelMarkers(model, "script-runner", [
          {
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: loc.line,
            startColumn: loc.column,
            endLineNumber: loc.line,
            endColumn: loc.column + 1,
            message: state.errorMessage,
          },
        ]);
      } else {
        // 位置情報がない場合もエラーメッセージをマーカーとして先頭行に表示
        monaco.editor.setModelMarkers(model, "script-runner", [
          {
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 1,
            message: state.errorMessage,
          },
        ]);
      }
    } else {
      monaco.editor.setModelMarkers(model, "script-runner", []);
    }
  }, [state.errorMessage, consoleShimLineCount]);

  // ── 実行行ハイライトの更新 ──────────────────────────────────────

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (state.currentLocation !== null) {
      const adjustedLine = adjustStepLocationLine(
        state.currentLocation,
        consoleShimLineCount,
      );
      if (adjustedLine !== null) {
        if (decorationsRef.current === null) {
          decorationsRef.current = editor.createDecorationsCollection([]);
        }
        decorationsRef.current.set([
          {
            range: {
              startLineNumber: adjustedLine,
              startColumn: 1,
              endLineNumber: adjustedLine,
              endColumn: 1,
            },
            options: {
              isWholeLine: true,
              className: "currentLineHighlight",
              glyphMarginClassName: "currentLineGlyph",
            },
          },
        ]);
        editor.revealLineInCenterIfOutsideViewport(adjustedLine);
        return;
      }
    }

    // ハイライトをクリア
    if (decorationsRef.current !== null) {
      decorationsRef.current.clear();
    }
  }, [state.currentLocation, consoleShimLineCount]);

  // ── ステータスの CSS クラス ─────────────────────────────────────

  const statusClassName = (() => {
    switch (state.executionStatus) {
      case "done":
        return `${styles["statusBadge"] satisfies string} ${styles["statusDone"] satisfies string}`;
      case "error":
        return `${styles["statusBadge"] satisfies string} ${styles["statusError"] satisfies string}`;
      case "running":
      case "stepping":
        return `${styles["statusBadge"] satisfies string} ${styles["statusRunning"] satisfies string}`;
      case "idle":
        return styles["statusBadge"] ?? "";
      default: {
        /* v8 ignore start */
        const _exhaustive: never = state.executionStatus;
        return String(_exhaustive);
        /* v8 ignore stop */
      }
    }
  })();

  const isExecuting =
    state.executionStatus === "running" || state.executionStatus === "stepping";

  return (
    <div className={styles["container"]} data-testid="script-editor">
      <div className={styles["editorArea"]} style={{ height }}>
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={state.code}
          theme="vs-dark"
          beforeMount={handleBeforeMount}
          onMount={handleEditorMount}
          onChange={handleChange}
          options={defaultEditorOptions}
        />
      </div>

      <div className={styles["toolbar"]} data-testid="script-editor-toolbar">
        <button
          type="button"
          className={styles["button"]}
          onClick={handleRun}
          disabled={isExecuting}
          data-testid="run-button"
        >
          Run
        </button>
        <button
          type="button"
          className={styles["button"]}
          onClick={handleStep}
          disabled={state.executionStatus === "running" || isAutoPlaying}
          data-testid="step-button"
        >
          Step
        </button>
        {isAutoPlaying ? (
          <button
            type="button"
            className={styles["button"]}
            onClick={handlePause}
            data-testid="pause-button"
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            className={styles["button"]}
            onClick={handlePlay}
            disabled={state.executionStatus === "running"}
            data-testid="play-button"
          >
            Play
          </button>
        )}
        <button
          type="button"
          className={styles["button"]}
          onClick={handleReset}
          disabled={state.executionStatus === "idle"}
          data-testid="reset-button"
        >
          Reset
        </button>
        <span className={statusClassName} data-testid="execution-status">
          {executionStatusLabel(state.executionStatus)}
        </span>
        {state.currentStep > 0 && (
          <span
            className={styles["stepCount"]}
            data-testid="step-count"
          >{`${String(state.currentStep) satisfies string} steps`}</span>
        )}
      </div>

      <div className={styles["speedBar"]} data-testid="speed-bar">
        <label className={styles["speedLabel"]} htmlFor="speed-slider">
          Speed
        </label>
        <input
          id="speed-slider"
          type="range"
          min={0}
          max={100}
          value={intervalMsToSlider(state.autoPlayIntervalMs)}
          onChange={handleSpeedChange}
          className={styles["speedSlider"]}
          data-testid="speed-slider"
        />
        <span
          className={styles["speedValue"]}
          data-testid="speed-value"
        >{`${String(state.autoPlayIntervalMs) satisfies string}ms`}</span>
      </div>

      {state.errorMessage !== null && (
        <div className={styles["errorBar"]} data-testid="error-bar">
          {state.errorMessage}
        </div>
      )}

      {state.consoleOutput.length > 0 && (
        <div className={styles["consoleArea"]} data-testid="console-output">
          {state.consoleOutput.map((entry, i) => {
            const typeClass =
              entry.type === "error"
                ? ` ${styles["consoleError"] satisfies string}`
                : entry.type === "warn"
                  ? ` ${styles["consoleWarn"] satisfies string}`
                  : "";
            return (
              <div
                key={i}
                className={`${styles["consoleEntry"] satisfies string}${typeClass satisfies string}`}
              >
                {entry.message}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
