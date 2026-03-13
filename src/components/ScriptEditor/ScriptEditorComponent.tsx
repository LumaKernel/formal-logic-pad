/**
 * Monaco Editor ベースのスクリプトエディタコンポーネント。
 *
 * 証明操作 API (proofBridge) の補完・型情報付きで JavaScript を編集し、
 * サンドボックス内でのスクリプト実行・ステップ実行を提供する。
 *
 * 変更時は scriptEditorLogic.ts, scriptEditorLogic.test.ts,
 * savedScriptsLogic.ts, savedScriptsLogic.test.ts, index.ts も同期すること。
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
  createCutEliminationBridges,
  generateCutEliminationBridgeTypeDefs,
} from "@/lib/script-runner";
import { BUILTIN_TEMPLATES } from "@/lib/script-runner/templates";
import type { ScriptTemplate } from "@/lib/script-runner/templates";
import type {
  NativeFunctionBridge,
  ScriptRunnerInstance,
  WorkspaceCommandHandler,
  RunAsyncAbortSignal,
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
  computeSlowdownInterval,
} from "./scriptEditorLogic";
import type { ScriptEditorState } from "./scriptEditorLogic";
import {
  initialSavedScriptsState,
  addScript,
  removeScript,
  serializeSavedScripts,
  deserializeSavedScripts,
  generateScriptId,
  STORAGE_KEY,
} from "./savedScriptsLogic";
import type { SavedScriptsState } from "./savedScriptsLogic";
import { cn } from "@/lib/utils";

// ── Tailwind class constants ──────────────────────────────────

const barBg =
  "bg-[var(--color-badge-bg,#e8eaf0)] border-t border-[var(--color-border,#e2e8f0)]";

const templateBtnCls =
  "inline-flex items-center px-2.5 py-1 border border-[var(--color-border,#e2e8f0)] rounded bg-[var(--color-surface,#ffffff)] text-[var(--color-text-primary,#171717)] cursor-pointer text-[length:var(--font-size-xs,11px)] font-medium leading-none whitespace-nowrap transition-[background-color,border-color] duration-150 hover:bg-[var(--color-surface-hover,#f0f0f0)] hover:border-[var(--color-accent,#555ab9)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent,#555ab9)] focus-visible:outline-offset-[-2px]";

const toolbarBtnCls =
  "inline-flex items-center gap-1 px-3 py-1.5 border border-[var(--color-border,#e2e8f0)] rounded-md bg-[var(--color-surface,#ffffff)] text-[var(--color-text-primary,#171717)] cursor-pointer text-[length:var(--font-size-sm,13px)] font-medium leading-none transition-[background-color,border-color] duration-150 hover:bg-[var(--color-surface-hover,#f0f0f0)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent,#555ab9)] focus-visible:outline-offset-[-2px] disabled:opacity-50 disabled:cursor-not-allowed";

const statusBadgeBase =
  "inline-flex items-center px-2 py-1 rounded text-[length:var(--font-size-xs,11px)] font-medium bg-[var(--color-badge-bg,#e8eaf0)] text-[var(--color-text-secondary,#666666)]";

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
  /** 現在時刻取得関数（DI用。デフォルト: Date.now） */
  readonly getNow?: () => number;
}

// ── Component ─────────────────────────────────────────────────

export const ScriptEditorComponent: React.FC<ScriptEditorComponentProps> = ({
  initialCode,
  height = "400px",
  onCodeChange,
  onRunComplete,
  workspaceCommandHandler,
  getNow = Date.now,
}) => {
  const [state, setState] = useState<ScriptEditorState>(() =>
    initialCode
      ? updateCode(initialScriptEditorState, initialCode)
      : initialScriptEditorState,
  );

  const runnerRef = useRef<ScriptRunnerInstance | null>(null);
  const abortSignalRef = useRef<RunAsyncAbortSignal & { aborted: boolean }>({
    aborted: false,
  });
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const decorationsRef = useRef<ReturnType<
    Parameters<OnMount>[0]["createDecorationsCollection"]
  > | null>(null);

  // ── 保存スクリプト管理 ────────────────────────────────────────

  const [savedScripts, setSavedScripts] = useState<SavedScriptsState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored !== null
        ? deserializeSavedScripts(stored)
        : initialSavedScriptsState;
    } catch {
      return initialSavedScriptsState;
    }
  });

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const saveTitleInputRef = useRef<HTMLInputElement | null>(null);

  // localStorage への永続化
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, serializeSavedScripts(savedScripts));
    } catch {
      // localStorage がフルの場合等は無視
    }
  }, [savedScripts]);

  // ダイアログ開いたときにフォーカス
  useEffect(() => {
    if (saveDialogOpen) {
      saveTitleInputRef.current?.focus();
    }
  }, [saveDialogOpen]);

  const handleOpenSaveDialog = useCallback(() => {
    setSaveTitle("");
    setSaveDialogOpen(true);
  }, []);

  const handleCloseSaveDialog = useCallback(() => {
    setSaveDialogOpen(false);
    setSaveTitle("");
  }, []);

  const handleSaveScript = useCallback(() => {
    const trimmedTitle = saveTitle.trim();
    if (trimmedTitle === "") return;
    const now = getNow();
    const id = generateScriptId(now);
    setSavedScripts((prev) =>
      addScript(prev, id, trimmedTitle, state.code, now),
    );
    setSaveDialogOpen(false);
    setSaveTitle("");
  }, [saveTitle, state.code, getNow]);

  const handleDeleteSavedScript = useCallback((id: string) => {
    setSavedScripts((prev) => removeScript(prev, id));
  }, []);

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

  const buildAllBridges = useCallback((): readonly NativeFunctionBridge[] => {
    const all: NativeFunctionBridge[] = [
      ...createProofBridges(),
      ...createCutEliminationBridges(),
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
    const cutEliminationTypeDefs = generateCutEliminationBridgeTypeDefs();
    const consoleTypeDefs = `
declare var console: {
  log(...args: unknown[]): void;
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
};
`;
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      typeDefs + workspaceTypeDefs + cutEliminationTypeDefs + consoleTypeDefs,
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

  // ── Run (全実行 — 非同期チャンク) ───────────────────────────────

  const handleRun = useCallback(() => {
    // 中断シグナルを新規作成
    const signal: RunAsyncAbortSignal & { aborted: boolean } = {
      aborted: false,
    };
    abortSignalRef.current = signal;

    setState((prev) => startExecution(prev));

    const bridges = buildAllBridges();
    const fullCode = consoleShimCode + state.code;
    const result = createScriptRunner(fullCode, {
      bridges,
      maxSteps: 100_000,
      maxTimeMs: 10_000,
    });

    if (isScriptRunResult(result)) {
      setState((prev) => {
        const final = setRunResult(prev, result);
        setTimeout(() => onRunComplete?.(final), 0);
        return final;
      });
      return;
    }

    // ScriptRunnerInstance → runAsync で非同期チャンク実行
    runnerRef.current = result;
    void result
      .runAsync(signal, {
        onProgress: (steps) => {
          setState((prev) => ({
            ...prev,
            currentStep: steps,
          }));
        },
      })
      .then((runResult) => {
        runnerRef.current = null;
        setState((prev) => {
          const final = setRunResult(prev, runResult);
          onRunComplete?.(final);
          return final;
        });
      });
  }, [buildAllBridges, consoleShimCode, state.code, onRunComplete]);

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
  }, [state.executionStatus, state.code, buildAllBridges, consoleShimCode]);

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
  }, [state.executionStatus, state.code, buildAllBridges, consoleShimCode]);

  // ── Pause (自動再生停止) ─────────────────────────────────────

  const handlePause = useCallback(() => {
    setIsAutoPlaying(false);
  }, []);

  // ── 自動再生タイマー制御（プログレッシブスローダウン付き）────────

  const effectiveIntervalMs = computeSlowdownInterval(
    state.autoPlayIntervalMs,
    state.currentStep,
  );

  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayTimerRef.current = setInterval(
        executeOneStep,
        effectiveIntervalMs,
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
  }, [isAutoPlaying, effectiveIntervalMs, executeOneStep]);

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
    abortSignalRef.current.aborted = true;
    runnerRef.current = null;
    setState((prev) => resetExecution(prev));
  }, []);

  // ── 保存スクリプトのロード ─────────────────────────────────────

  const handleLoadSavedScript = useCallback(
    (code: string) => {
      handleReset();
      setState((prev) => updateCode(prev, code));
      onCodeChange?.(code);
    },
    [handleReset, onCodeChange],
  );

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

  // ── テンプレートロード ─────────────────────────────────────────

  const handleLoadTemplate = useCallback(
    (template: ScriptTemplate) => {
      handleReset();
      setState((prev) => updateCode(prev, template.code));
      onCodeChange?.(template.code);
    },
    [handleReset, onCodeChange],
  );

  // ── ステータスの CSS クラス ─────────────────────────────────────

  const statusClassName = (() => {
    switch (state.executionStatus) {
      case "done":
        return cn(
          statusBadgeBase,
          "bg-[var(--color-success-bg,#d4edda)] text-[var(--color-success-text,#155724)]",
        );
      case "error":
        return cn(
          statusBadgeBase,
          "bg-[var(--color-error-bg,#f8d7da)] text-[var(--color-error-text,#721c24)]",
        );
      case "running":
      case "stepping":
        return cn(
          statusBadgeBase,
          "bg-[var(--color-info-bg,#cce5ff)] text-[var(--color-info-text,#004085)]",
        );
      case "idle":
        return statusBadgeBase;
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
    <div
      className="flex flex-col h-full border border-[var(--color-border,#e2e8f0)] rounded-lg overflow-hidden bg-[var(--color-surface,#ffffff)]"
      data-testid="script-editor"
    >
      <div className="flex-1 min-h-[200px]" style={{ height }}>
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

      <div
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto",
          barBg,
        )}
        data-testid="template-bar"
      >
        <span className="text-[length:var(--font-size-xs,11px)] font-semibold text-[var(--color-text-secondary,#666666)] whitespace-nowrap">
          Templates:
        </span>
        {BUILTIN_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            type="button"
            className={templateBtnCls}
            onClick={() => handleLoadTemplate(tmpl)}
            title={tmpl.description}
            data-testid={`template-${tmpl.id satisfies string}`}
          >
            {tmpl.title}
          </button>
        ))}
        <span className="inline-block w-px h-4 bg-[var(--color-border,#e2e8f0)] mx-0.5" />
        <button
          type="button"
          className="inline-flex items-center px-2.5 py-1 border border-[var(--color-accent,#555ab9)] rounded bg-[var(--color-accent,#555ab9)] text-white cursor-pointer text-[length:var(--font-size-xs,11px)] font-semibold leading-none whitespace-nowrap transition-[background-color,border-color] duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-accent,#555ab9)] focus-visible:outline-offset-2"
          onClick={handleOpenSaveDialog}
          data-testid="save-script-button"
          title="現在のスクリプトを保存"
        >
          Save
        </button>
        {savedScripts.scripts.length > 0 && (
          <>
            <span className="text-[length:var(--font-size-xs,11px)] font-semibold text-[var(--color-text-secondary,#666666)] whitespace-nowrap">
              My Scripts:
            </span>
            {savedScripts.scripts.map((script) => (
              <span
                key={script.id}
                className="inline-flex items-center gap-0"
                data-testid={`saved-script-${script.id satisfies string}`}
              >
                <button
                  type="button"
                  className={cn(templateBtnCls, "rounded-r-none")}
                  onClick={() => handleLoadSavedScript(script.code)}
                  title={script.title}
                  data-testid={`load-saved-${script.id satisfies string}`}
                >
                  {script.title}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-5 h-5 p-0 border border-[var(--color-border,#e2e8f0)] border-l-0 rounded-r bg-[var(--color-surface,#ffffff)] text-[var(--color-text-secondary,#666666)] cursor-pointer text-xs leading-none transition-[background-color,color] duration-150 hover:bg-[var(--color-error-bg,#f8d7da)] hover:text-[var(--color-error-text,#721c24)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent,#555ab9)] focus-visible:outline-offset-[-2px]"
                  onClick={() => handleDeleteSavedScript(script.id)}
                  data-testid={`delete-saved-${script.id satisfies string}`}
                  title="削除"
                >
                  ×
                </button>
              </span>
            ))}
          </>
        )}
      </div>

      {saveDialogOpen && (
        <div
          className={cn("flex items-center gap-1.5 px-3 py-1.5", barBg)}
          data-testid="save-dialog"
        >
          <input
            ref={saveTitleInputRef}
            type="text"
            className="flex-1 px-2 py-1 border border-[var(--color-border,#e2e8f0)] rounded text-[length:var(--font-size-xs,11px)] bg-[var(--color-surface,#ffffff)] text-[var(--color-text-primary,#171717)] min-w-[120px] focus:outline-2 focus:outline-[var(--color-accent,#555ab9)] focus:outline-offset-[-2px]"
            placeholder="スクリプト名を入力..."
            value={saveTitle}
            onChange={(e) => setSaveTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveScript();
              if (e.key === "Escape") handleCloseSaveDialog();
            }}
            data-testid="save-title-input"
          />
          <button
            type="button"
            className={toolbarBtnCls}
            onClick={handleSaveScript}
            disabled={saveTitle.trim() === ""}
            data-testid="save-confirm-button"
          >
            Save
          </button>
          <button
            type="button"
            className={toolbarBtnCls}
            onClick={handleCloseSaveDialog}
            data-testid="save-cancel-button"
          >
            Cancel
          </button>
        </div>
      )}

      <div
        className={cn("flex items-center gap-2 px-3 py-2", barBg)}
        data-testid="script-editor-toolbar"
      >
        <button
          type="button"
          className={toolbarBtnCls}
          onClick={handleRun}
          disabled={isExecuting}
          data-testid="run-button"
        >
          Run
        </button>
        <button
          type="button"
          className={toolbarBtnCls}
          onClick={handleStep}
          disabled={state.executionStatus === "running" || isAutoPlaying}
          data-testid="step-button"
        >
          Step
        </button>
        {isAutoPlaying ? (
          <button
            type="button"
            className={toolbarBtnCls}
            onClick={handlePause}
            data-testid="pause-button"
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            className={toolbarBtnCls}
            onClick={handlePlay}
            disabled={state.executionStatus === "running"}
            data-testid="play-button"
          >
            Play
          </button>
        )}
        <button
          type="button"
          className={toolbarBtnCls}
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
            className="text-[length:var(--font-size-xs,11px)] text-[var(--color-text-secondary,#666666)] ml-auto"
            data-testid="step-count"
          >{`${String(state.currentStep) satisfies string} steps`}</span>
        )}
      </div>

      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1 text-[length:var(--font-size-xs,11px)]",
          barBg,
        )}
        data-testid="speed-bar"
      >
        <label
          className="text-[var(--color-text-secondary,#666666)] font-medium whitespace-nowrap"
          htmlFor="speed-slider"
        >
          Speed
        </label>
        <input
          id="speed-slider"
          type="range"
          min={0}
          max={100}
          value={intervalMsToSlider(state.autoPlayIntervalMs)}
          onChange={handleSpeedChange}
          className="flex-1 min-w-[80px] cursor-pointer"
          data-testid="speed-slider"
        />
        <span
          className="text-[var(--color-text-secondary,#666666)] min-w-[50px] text-right whitespace-nowrap"
          data-testid="speed-value"
        >{`${String(effectiveIntervalMs) satisfies string}ms`}</span>
        {effectiveIntervalMs > state.autoPlayIntervalMs && (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded-[3px] text-[length:var(--font-size-xs,11px)] font-medium bg-[var(--color-warn-bg,#fff3cd)] text-[var(--color-warn-text,#856404)] whitespace-nowrap"
            data-testid="slowdown-badge"
          >
            {`Slowdown x${String(Math.round(effectiveIntervalMs / state.autoPlayIntervalMs)) satisfies string}`}
          </span>
        )}
      </div>

      {state.errorMessage !== null && (
        <div
          className="px-3 py-1.5 bg-[var(--color-error-bg,#f8d7da)] text-[var(--color-error-text,#721c24)] text-[length:var(--font-size-xs,11px)] font-mono border-t border-[var(--color-border,#e2e8f0)]"
          data-testid="error-bar"
        >
          {state.errorMessage}
        </div>
      )}

      {state.consoleOutput.length > 0 && (
        <div
          className="max-h-[150px] overflow-y-auto px-3 py-2 border-t border-[var(--color-border,#e2e8f0)] bg-[var(--color-code-bg,#1e1e1e)] text-[var(--color-code-text,#d4d4d4)] font-mono text-[length:var(--font-size-xs,11px)] leading-relaxed"
          data-testid="console-output"
        >
          {state.consoleOutput.map((entry, i) => (
            <div
              key={i}
              className={cn(
                "whitespace-pre-wrap break-all",
                entry.type === "error" && "text-[#f44747]",
                entry.type === "warn" && "text-[#cca700]",
              )}
            >
              {entry.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
