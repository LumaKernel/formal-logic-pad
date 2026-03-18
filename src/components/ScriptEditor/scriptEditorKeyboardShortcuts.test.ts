import { describe, it, expect } from "vitest";
import {
  classifyScriptEditorKeyDown,
  type ScriptEditorKeyEventInput,
  type ActiveTabContext,
} from "./scriptEditorKeyboardShortcuts";

const makeEvent = (
  overrides: Partial<ScriptEditorKeyEventInput> = {},
): ScriptEditorKeyEventInput => ({
  key: "a",
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  ...overrides,
});

const ctrlS = makeEvent({ key: "s", ctrlKey: true });
const metaS = makeEvent({ key: "s", metaKey: true });
const ctrlShiftS = makeEvent({ key: "s", ctrlKey: true, shiftKey: true });
const plainS = makeEvent({ key: "s" });
const ctrlA = makeEvent({ key: "a", ctrlKey: true });

describe("classifyScriptEditorKeyDown", () => {
  describe("Ctrl/Cmd+S on unnamed tab", () => {
    const tab: ActiveTabContext = { source: "unnamed", readonly: false };

    it("Ctrl+S → save-new", () => {
      expect(classifyScriptEditorKeyDown(ctrlS, tab)).toEqual({
        type: "save-new",
      });
    });

    it("Cmd+S → save-new", () => {
      expect(classifyScriptEditorKeyDown(metaS, tab)).toEqual({
        type: "save-new",
      });
    });
  });

  describe("Ctrl/Cmd+S on saved tab", () => {
    const tab: ActiveTabContext = { source: "saved", readonly: false };

    it("Ctrl+S → save-overwrite", () => {
      expect(classifyScriptEditorKeyDown(ctrlS, tab)).toEqual({
        type: "save-overwrite",
      });
    });

    it("Cmd+S → save-overwrite", () => {
      expect(classifyScriptEditorKeyDown(metaS, tab)).toEqual({
        type: "save-overwrite",
      });
    });
  });

  describe("Ctrl/Cmd+S on readonly (library) tab", () => {
    const tab: ActiveTabContext = { source: "library", readonly: true };

    it("Ctrl+S → none", () => {
      expect(classifyScriptEditorKeyDown(ctrlS, tab)).toEqual({
        type: "none",
      });
    });

    it("Cmd+S → none", () => {
      expect(classifyScriptEditorKeyDown(metaS, tab)).toEqual({
        type: "none",
      });
    });
  });

  describe("no active tab", () => {
    it("returns none when activeTab is undefined", () => {
      expect(classifyScriptEditorKeyDown(ctrlS, undefined)).toEqual({
        type: "none",
      });
    });
  });

  describe("non-matching keys", () => {
    const tab: ActiveTabContext = { source: "unnamed", readonly: false };

    it("Ctrl+Shift+S → none", () => {
      expect(classifyScriptEditorKeyDown(ctrlShiftS, tab)).toEqual({
        type: "none",
      });
    });

    it("plain S (no modifier) → none", () => {
      expect(classifyScriptEditorKeyDown(plainS, tab)).toEqual({
        type: "none",
      });
    });

    it("Ctrl+A → none", () => {
      expect(classifyScriptEditorKeyDown(ctrlA, tab)).toEqual({
        type: "none",
      });
    });
  });

  describe("uppercase S key", () => {
    const tab: ActiveTabContext = { source: "unnamed", readonly: false };

    it("Ctrl+S (uppercase key value) → save-new", () => {
      const event = makeEvent({ key: "S", ctrlKey: true });
      expect(classifyScriptEditorKeyDown(event, tab)).toEqual({
        type: "save-new",
      });
    });
  });
});
