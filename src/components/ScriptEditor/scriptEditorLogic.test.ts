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
  updateAutoPlayInterval,
  sliderToIntervalMs,
  intervalMsToSlider,
  extractErrorLocation,
  adjustStepLocationLine,
  DEFAULT_AUTO_PLAY_INTERVAL_MS,
  MIN_AUTO_PLAY_INTERVAL_MS,
  MAX_AUTO_PLAY_INTERVAL_MS,
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
      expect(initialScriptEditorState.autoPlayIntervalMs).toBe(
        DEFAULT_AUTO_PLAY_INTERVAL_MS,
      );
      expect(initialScriptEditorState.currentLocation).toBeNull();
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
        currentLocation: { line: 3, column: 0 },
      };
      const result = startExecution(state);
      expect(result.executionStatus).toBe("running");
      expect(result.consoleOutput).toEqual([]);
      expect(result.currentStep).toBe(0);
      expect(result.errorMessage).toBeNull();
      expect(result.currentLocation).toBeNull();
    });
  });

  describe("startStepping", () => {
    it("ステップ実行状態にリセットする", () => {
      const state: ScriptEditorState = {
        ...initialScriptEditorState,
        consoleOutput: [{ type: "log", message: "old" }],
        currentStep: 5,
        errorMessage: "old error",
        currentLocation: { line: 2, column: 5 },
      };
      const result = startStepping(state);
      expect(result.executionStatus).toBe("stepping");
      expect(result.consoleOutput).toEqual([]);
      expect(result.currentStep).toBe(0);
      expect(result.errorMessage).toBeNull();
      expect(result.currentLocation).toBeNull();
    });
  });

  describe("recordStep", () => {
    it("Running でステップカウントが反映される", () => {
      const state: ScriptEditorState = {
        ...initialScriptEditorState,
        executionStatus: "stepping",
        currentStep: 3,
      };
      const result = recordStep(state, {
        _tag: "Running",
        steps: 4,
        location: { line: 2, column: 0 },
      });
      expect(result.currentStep).toBe(4);
      expect(result.executionStatus).toBe("stepping");
      expect(result.currentLocation).toEqual({ line: 2, column: 0 });
    });

    it("Running で location が null の場合、currentLocation も null になる", () => {
      const state: ScriptEditorState = {
        ...initialScriptEditorState,
        executionStatus: "stepping",
      };
      const result = recordStep(state, {
        _tag: "Running",
        steps: 1,
        location: null,
      });
      expect(result.currentLocation).toBeNull();
    });

    it("Done で完了状態になり currentLocation がクリアされる", () => {
      const state: ScriptEditorState = {
        ...initialScriptEditorState,
        executionStatus: "stepping",
        currentStep: 10,
        currentLocation: { line: 3, column: 0 },
      };
      const result = recordStep(state, {
        _tag: "Done",
        value: undefined,
        steps: 11,
      });
      expect(result.currentStep).toBe(11);
      expect(result.executionStatus).toBe("done");
      expect(result.currentLocation).toBeNull();
    });

    it("Error でエラー状態になり currentLocation がクリアされる", () => {
      const state: ScriptEditorState = {
        ...initialScriptEditorState,
        executionStatus: "stepping",
        currentStep: 5,
        currentLocation: { line: 4, column: 0 },
      };
      const result = recordStep(state, {
        _tag: "Error",
        error: { _tag: "RuntimeError", message: "test error" },
        steps: 6,
      });
      expect(result.currentStep).toBe(6);
      expect(result.executionStatus).toBe("error");
      expect(result.errorMessage).toBe("RuntimeError: test error");
      expect(result.currentLocation).toBeNull();
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
    it("Ok 結果で done 状態になり currentLocation がクリアされる", () => {
      const stateWithLocation: ScriptEditorState = {
        ...initialScriptEditorState,
        currentLocation: { line: 3, column: 0 },
      };
      const okResult: ScriptRunResult = {
        _tag: "Ok",
        value: 42,
        steps: 100,
        elapsedMs: 50,
      };
      const result = setRunResult(stateWithLocation, okResult);
      expect(result.executionStatus).toBe("done");
      expect(result.currentStep).toBe(100);
      expect(result.errorMessage).toBeNull();
      expect(result.currentLocation).toBeNull();
    });

    it("Error 結果で error 状態になり currentLocation がクリアされる", () => {
      const stateWithLocation: ScriptEditorState = {
        ...initialScriptEditorState,
        currentLocation: { line: 4, column: 2 },
      };
      const errorResult: ScriptRunResult = {
        _tag: "Error",
        error: { _tag: "RuntimeError", message: "boom" },
        steps: 50,
        elapsedMs: 30,
      };
      const result = setRunResult(stateWithLocation, errorResult);
      expect(result.executionStatus).toBe("error");
      expect(result.currentStep).toBe(50);
      expect(result.errorMessage).toBe("RuntimeError: boom");
      expect(result.currentLocation).toBeNull();
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
        currentLocation: { line: 5, column: 3 },
      };
      const result = resetExecution(state);
      expect(result.executionStatus).toBe("idle");
      expect(result.consoleOutput).toEqual([]);
      expect(result.currentStep).toBe(0);
      expect(result.errorMessage).toBeNull();
      expect(result.currentLocation).toBeNull();
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

  describe("updateAutoPlayInterval", () => {
    it("間隔を更新する", () => {
      const result = updateAutoPlayInterval(initialScriptEditorState, 500);
      expect(result.autoPlayIntervalMs).toBe(500);
    });

    it("最小値でクランプされる", () => {
      const result = updateAutoPlayInterval(initialScriptEditorState, 1);
      expect(result.autoPlayIntervalMs).toBe(MIN_AUTO_PLAY_INTERVAL_MS);
    });

    it("最大値でクランプされる", () => {
      const result = updateAutoPlayInterval(initialScriptEditorState, 99999);
      expect(result.autoPlayIntervalMs).toBe(MAX_AUTO_PLAY_INTERVAL_MS);
    });

    it("他の状態を保持する", () => {
      const state: ScriptEditorState = {
        ...initialScriptEditorState,
        executionStatus: "stepping",
        currentStep: 42,
      };
      const result = updateAutoPlayInterval(state, 300);
      expect(result.executionStatus).toBe("stepping");
      expect(result.currentStep).toBe(42);
      expect(result.autoPlayIntervalMs).toBe(300);
    });
  });

  describe("sliderToIntervalMs", () => {
    it("0 で最速（最小間隔）", () => {
      expect(sliderToIntervalMs(0)).toBe(MIN_AUTO_PLAY_INTERVAL_MS);
    });

    it("100 で最遅（最大間隔）", () => {
      expect(sliderToIntervalMs(100)).toBe(MAX_AUTO_PLAY_INTERVAL_MS);
    });

    it("50 で中間値", () => {
      const expected = Math.round(
        MIN_AUTO_PLAY_INTERVAL_MS +
          0.5 * (MAX_AUTO_PLAY_INTERVAL_MS - MIN_AUTO_PLAY_INTERVAL_MS),
      );
      expect(sliderToIntervalMs(50)).toBe(expected);
    });
  });

  describe("intervalMsToSlider", () => {
    it("最小間隔で 0", () => {
      expect(intervalMsToSlider(MIN_AUTO_PLAY_INTERVAL_MS)).toBe(0);
    });

    it("最大間隔で 100", () => {
      expect(intervalMsToSlider(MAX_AUTO_PLAY_INTERVAL_MS)).toBe(100);
    });

    it("往復変換が一致する", () => {
      const slider = 42;
      const interval = sliderToIntervalMs(slider);
      expect(intervalMsToSlider(interval)).toBe(slider);
    });
  });

  describe("extractErrorLocation", () => {
    it("SyntaxError の (行:列) パターンを抽出する", () => {
      const result = extractErrorLocation("Unexpected token (3:9)", 1);
      expect(result).toEqual({ line: 2, column: 10 });
    });

    it("行オフセットを差し引く", () => {
      const result = extractErrorLocation("Unexpected token (5:0)", 2);
      expect(result).toEqual({ line: 3, column: 1 });
    });

    it("オフセット0で行番号がそのまま返る", () => {
      const result = extractErrorLocation("Unexpected token (1:4)", 0);
      expect(result).toEqual({ line: 1, column: 5 });
    });

    it("位置情報がないメッセージではnullを返す", () => {
      const result = extractErrorLocation(
        "Cannot read property 'x' of null",
        1,
      );
      expect(result).toBeNull();
    });

    it("オフセット差し引き後に行番号が0以下ならnullを返す", () => {
      const result = extractErrorLocation("Unexpected token (1:0)", 2);
      expect(result).toBeNull();
    });

    it("空文字列ではnullを返す", () => {
      const result = extractErrorLocation("", 0);
      expect(result).toBeNull();
    });

    it("SyntaxError プレフィックス付きメッセージから抽出する", () => {
      const result = extractErrorLocation(
        "SyntaxError: Unexpected token (2:5)",
        1,
      );
      expect(result).toEqual({ line: 1, column: 6 });
    });
  });

  describe("adjustStepLocationLine", () => {
    it("オフセットを差し引いた行番号を返す", () => {
      const result = adjustStepLocationLine({ line: 3, column: 0 }, 1);
      expect(result).toBe(2);
    });

    it("オフセット0ならそのまま返す", () => {
      const result = adjustStepLocationLine({ line: 5, column: 4 }, 0);
      expect(result).toBe(5);
    });

    it("差し引き後に0以下ならnullを返す", () => {
      const result = adjustStepLocationLine({ line: 1, column: 0 }, 2);
      expect(result).toBeNull();
    });

    it("ちょうど0になる場合もnullを返す", () => {
      const result = adjustStepLocationLine({ line: 1, column: 0 }, 1);
      expect(result).toBeNull();
    });

    it("ちょうど1になる場合は1を返す", () => {
      const result = adjustStepLocationLine({ line: 2, column: 0 }, 1);
      expect(result).toBe(1);
    });
  });

  describe("defaultEditorOptions", () => {
    it("必要なオプションが含まれる", () => {
      expect(defaultEditorOptions.minimap.enabled).toBe(false);
      expect(defaultEditorOptions.automaticLayout).toBe(true);
      expect(defaultEditorOptions.fontSize).toBe(14);
      expect(defaultEditorOptions.glyphMargin).toBe(true);
    });
  });
});
