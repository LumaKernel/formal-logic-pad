import { describe, it, expect } from "vitest";
import {
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
import type {
  ScriptEditorState,
  ConsoleEntry,
  ExecutionStatus,
} from "./scriptEditorLogic";
import type { ScriptRunResult } from "@/lib/script-runner";

describe("scriptEditorLogic", () => {
  describe("initialScriptEditorState", () => {
    it("デフォルト状態が正しい", () => {
      expect(initialScriptEditorState.executionStatus).toBe("idle");
      expect(initialScriptEditorState.consoleOutput).toEqual([]);
      expect(initialScriptEditorState.currentStep).toBe(0);
      expect(initialScriptEditorState.errorMessage).toBeNull();
      expect(initialScriptEditorState.code).toContain("Proof Bridge API");
    });
  });

  describe("updateCode", () => {
    it("コードを更新する", () => {
      const result = updateCode(initialScriptEditorState, "new code");
      expect(result.code).toBe("new code");
      expect(result.executionStatus).toBe("idle");
    });
  });

  describe("startExecution", () => {
    it("実行状態をrunningにリセットする", () => {
      const state: ScriptEditorState = {
        ...initialScriptEditorState,
        consoleOutput: [{ type: "log", message: "old" }],
        currentStep: 5,
        errorMessage: "old error",
      };
      const result = startExecution(state);
      expect(result.executionStatus).toBe("running");
      expect(result.consoleOutput).toEqual([]);
      expect(result.currentStep).toBe(0);
      expect(result.errorMessage).toBeNull();
    });
  });

  describe("startStepping", () => {
    it("ステップ実行状態にリセットする", () => {
      const state: ScriptEditorState = {
        ...initialScriptEditorState,
        consoleOutput: [{ type: "log", message: "old" }],
        currentStep: 5,
        errorMessage: "old error",
      };
      const result = startStepping(state);
      expect(result.executionStatus).toBe("stepping");
      expect(result.consoleOutput).toEqual([]);
      expect(result.currentStep).toBe(0);
      expect(result.errorMessage).toBeNull();
    });
  });

  describe("recordStep", () => {
    it("Running でステップカウントが反映される", () => {
      const state: ScriptEditorState = {
        ...initialScriptEditorState,
        executionStatus: "stepping",
        currentStep: 3,
      };
      const result = recordStep(state, { _tag: "Running", steps: 4 });
      expect(result.currentStep).toBe(4);
      expect(result.executionStatus).toBe("stepping");
    });

    it("Done で完了状態になる", () => {
      const state: ScriptEditorState = {
        ...initialScriptEditorState,
        executionStatus: "stepping",
        currentStep: 10,
      };
      const result = recordStep(state, {
        _tag: "Done",
        value: undefined,
        steps: 11,
      });
      expect(result.currentStep).toBe(11);
      expect(result.executionStatus).toBe("done");
    });

    it("Error でエラー状態になる", () => {
      const state: ScriptEditorState = {
        ...initialScriptEditorState,
        executionStatus: "stepping",
        currentStep: 5,
      };
      const result = recordStep(state, {
        _tag: "Error",
        error: { _tag: "RuntimeError", message: "test error" },
        steps: 6,
      });
      expect(result.currentStep).toBe(6);
      expect(result.executionStatus).toBe("error");
      expect(result.errorMessage).toBe("RuntimeError: test error");
    });
  });

  describe("appendConsole", () => {
    it("コンソールエントリを追加する", () => {
      const entry: ConsoleEntry = { type: "log", message: "hello" };
      const result = appendConsole(initialScriptEditorState, entry);
      expect(result.consoleOutput).toEqual([entry]);
    });

    it("既存エントリに追加する", () => {
      const state: ScriptEditorState = {
        ...initialScriptEditorState,
        consoleOutput: [{ type: "log", message: "first" }],
      };
      const entry: ConsoleEntry = { type: "error", message: "second" };
      const result = appendConsole(state, entry);
      expect(result.consoleOutput).toHaveLength(2);
      expect(result.consoleOutput[1]).toEqual(entry);
    });
  });

  describe("setRunResult", () => {
    it("Ok 結果で done 状態になる", () => {
      const okResult: ScriptRunResult = {
        _tag: "Ok",
        value: 42,
        steps: 100,
        elapsedMs: 50,
      };
      const result = setRunResult(initialScriptEditorState, okResult);
      expect(result.executionStatus).toBe("done");
      expect(result.currentStep).toBe(100);
      expect(result.errorMessage).toBeNull();
    });

    it("Error 結果で error 状態になる", () => {
      const errorResult: ScriptRunResult = {
        _tag: "Error",
        error: { _tag: "RuntimeError", message: "boom" },
        steps: 50,
        elapsedMs: 30,
      };
      const result = setRunResult(initialScriptEditorState, errorResult);
      expect(result.executionStatus).toBe("error");
      expect(result.currentStep).toBe(50);
      expect(result.errorMessage).toBe("RuntimeError: boom");
    });
  });

  describe("resetExecution", () => {
    it("実行状態をリセットする", () => {
      const state: ScriptEditorState = {
        ...initialScriptEditorState,
        executionStatus: "error",
        consoleOutput: [{ type: "error", message: "boom" }],
        currentStep: 99,
        errorMessage: "some error",
      };
      const result = resetExecution(state);
      expect(result.executionStatus).toBe("idle");
      expect(result.consoleOutput).toEqual([]);
      expect(result.currentStep).toBe(0);
      expect(result.errorMessage).toBeNull();
      // コードはリセットされない
      expect(result.code).toBe(state.code);
    });
  });

  describe("formatRunError", () => {
    it("Ok 結果は空文字列", () => {
      const okResult: ScriptRunResult = {
        _tag: "Ok",
        value: null,
        steps: 1,
        elapsedMs: 1,
      };
      expect(formatRunError(okResult)).toBe("");
    });

    it("SyntaxError をフォーマットする", () => {
      const result: ScriptRunResult = {
        _tag: "Error",
        error: { _tag: "SyntaxError", message: "unexpected token" },
        steps: 0,
        elapsedMs: 0,
      };
      expect(formatRunError(result)).toBe("SyntaxError: unexpected token");
    });

    it("RuntimeError をフォーマットする", () => {
      const result: ScriptRunResult = {
        _tag: "Error",
        error: { _tag: "RuntimeError", message: "undefined is not a function" },
        steps: 10,
        elapsedMs: 5,
      };
      expect(formatRunError(result)).toBe(
        "RuntimeError: undefined is not a function",
      );
    });

    it("StepLimitExceeded をフォーマットする", () => {
      const result: ScriptRunResult = {
        _tag: "Error",
        error: { _tag: "StepLimitExceeded", maxSteps: 10000 },
        steps: 10000,
        elapsedMs: 500,
      };
      expect(formatRunError(result)).toBe("Step limit exceeded (10000 steps)");
    });

    it("TimeLimitExceeded をフォーマットする", () => {
      const result: ScriptRunResult = {
        _tag: "Error",
        error: { _tag: "TimeLimitExceeded", maxTimeMs: 5000 },
        steps: 8000,
        elapsedMs: 5000,
      };
      expect(formatRunError(result)).toBe("Time limit exceeded (5000ms)");
    });
  });

  describe("executionStatusLabel", () => {
    const cases: readonly (readonly [ExecutionStatus, string])[] = [
      ["idle", "Ready"],
      ["running", "Running..."],
      ["stepping", "Stepping..."],
      ["done", "Done"],
      ["error", "Error"],
    ];

    it.each(cases)("%s → %s", (status, expected) => {
      expect(executionStatusLabel(status)).toBe(expected);
    });
  });

  describe("defaultEditorOptions", () => {
    it("必要なオプションが含まれる", () => {
      expect(defaultEditorOptions.minimap.enabled).toBe(false);
      expect(defaultEditorOptions.automaticLayout).toBe(true);
      expect(defaultEditorOptions.fontSize).toBe(14);
    });
  });
});
