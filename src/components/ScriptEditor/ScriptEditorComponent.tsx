/**
 * Monaco Editor ベースのスクリプトエディタコンポーネント。
 *
 * 証明操作 API (proofBridge) の補完・型情報付きで JavaScript を編集し、
 * サンドボックス内でのスクリプト実行・ステップ実行を提供する。
 *
 * 変更時は scriptEditorLogic.ts, scriptEditorLogic.test.ts, index.ts も同期すること。
 */
"use client";

import { useCallback, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import type { OnMount, BeforeMount } from "@monaco-editor/react";
import {
  createScriptRunner,
  createProofBridges,
  generateProofBridgeTypeDefs,
  isScriptRunResult,
} from "@/lib/script-runner";
import type {
  NativeFunctionBridge,
  ScriptRunnerInstance,
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
}

// ── Component ─────────────────────────────────────────────────

export const ScriptEditorComponent: React.FC<ScriptEditorComponentProps> = ({
  initialCode,
  height = "400px",
  onCodeChange,
  onRunComplete,
}) => {
  const [state, setState] = useState<ScriptEditorState>(() =>
    initialCode
      ? updateCode(initialScriptEditorState, initialCode)
      : initialScriptEditorState,
  );

  const runnerRef = useRef<ScriptRunnerInstance | null>(null);

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

  // ── コンソール初期化コード ────────────────────────────────

  const consoleShimCode = `var console = { log: console_log, error: console_error, warn: console_warn };\n`;

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
    const consoleTypeDefs = `
declare var console: {
  log(...args: unknown[]): void;
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
};
`;
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      typeDefs + consoleTypeDefs,
      "file:///proof-bridge.d.ts",
    );
  }, []);

  // ── Monaco onMount ────────────────────────────────────────────

  const handleEditorMount: OnMount = useCallback(() => {
    // 将来的にエディタインスタンスを保存してステップ実行の行ハイライトに使う
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
      const bridges = [...createProofBridges(), ...createConsoleBridges()];
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
  }, [createConsoleBridges, consoleShimCode, onRunComplete]);

  // ── Step (ステップ実行開始/続行) ──────────────────────────────

  const handleStep = useCallback(() => {
    if (state.executionStatus === "done" || state.executionStatus === "error") {
      // 完了/エラー後にStepを押したらリセットして新規開始
      runnerRef.current = null;
    }

    if (runnerRef.current === null) {
      // 新規ステップ実行開始 — state.code を直接参照
      const bridges = [...createProofBridges(), ...createConsoleBridges()];
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
    createConsoleBridges,
    consoleShimCode,
  ]);

  // ── Reset ──────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    runnerRef.current = null;
    setState((prev) => resetExecution(prev));
  }, []);

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
          disabled={state.executionStatus === "running"}
          data-testid="step-button"
        >
          Step
        </button>
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
