import { describe, expect, it } from "vitest";
import {
  defaultScriptEditorMessages,
  getStatusMessage,
} from "./scriptEditorMessages";
import type { ExecutionStatus } from "./scriptEditorLogic";

describe("getStatusMessage", () => {
  const msg = defaultScriptEditorMessages;

  it("returns Ready for idle status", () => {
    expect(getStatusMessage(msg, "idle")).toBe("Ready");
  });

  it("returns Running... for running status", () => {
    expect(getStatusMessage(msg, "running")).toBe("Running...");
  });

  it("returns Stepping... for stepping status", () => {
    expect(getStatusMessage(msg, "stepping")).toBe("Stepping...");
  });

  it("returns Done for done status", () => {
    expect(getStatusMessage(msg, "done")).toBe("Done");
  });

  it("returns Error for error status", () => {
    expect(getStatusMessage(msg, "error")).toBe("Error");
  });

  it("uses custom messages", () => {
    const custom = { ...msg, statusReady: "準備完了" };
    expect(getStatusMessage(custom, "idle")).toBe("準備完了");
  });

  it("covers all ExecutionStatus values", () => {
    const statuses: readonly ExecutionStatus[] = [
      "idle",
      "running",
      "stepping",
      "done",
      "error",
    ];
    for (const status of statuses) {
      expect(typeof getStatusMessage(msg, status)).toBe("string");
    }
  });
});

describe("defaultScriptEditorMessages", () => {
  it("stepsCount formats correctly", () => {
    expect(defaultScriptEditorMessages.stepsCount(5)).toBe("5 steps");
  });

  it("slowdown formats correctly", () => {
    expect(defaultScriptEditorMessages.slowdown(2)).toBe("Slowdown x2");
  });
});
