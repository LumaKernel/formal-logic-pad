import { describe, it, expect } from "vitest";
import {
  WORKSPACE_STORAGE_KEY,
  serializeWorkspace,
  deserializeWorkspace,
} from "./scriptWorkspacePersistence";
import {
  initialWorkspaceState,
  createUnnamedTab,
  openLibraryTab,
  openSavedTab,
  updateTabCode,
} from "./scriptWorkspaceState";
import type { ScriptTemplate } from "@/lib/script-runner/templates";

const sampleTemplates: readonly ScriptTemplate[] = [
  {
    id: "tpl-1",
    title: "Template One",
    description: "First template",
    code: "// template 1 code",
    compatibleStyles: ["sequent-calculus"],
  },
  {
    id: "tpl-2",
    title: "Template Two",
    description: "Second template",
    code: "// template 2 code",
  },
];

describe("scriptWorkspacePersistence", () => {
  describe("WORKSPACE_STORAGE_KEY", () => {
    it("キーが定義されている", () => {
      expect(WORKSPACE_STORAGE_KEY).toBe("script-editor-workspace");
    });
  });

  describe("serializeWorkspace / deserializeWorkspace", () => {
    it("空の状態をラウンドトリップできる", () => {
      const json = serializeWorkspace(initialWorkspaceState);
      const restored = deserializeWorkspace(json, sampleTemplates);
      expect(restored.tabs).toEqual([]);
      expect(restored.activeTabId).toBeUndefined();
      expect(restored.nextUnnamedCounter).toBe(1);
    });

    it("Unnamedタブをラウンドトリップできる", () => {
      let state = createUnnamedTab(initialWorkspaceState, 1000);
      state = updateTabCode(state, state.tabs[0]?.id ?? "", "my code");
      const json = serializeWorkspace(state);
      const restored = deserializeWorkspace(json, sampleTemplates);
      expect(restored.tabs).toHaveLength(1);
      expect(restored.tabs[0]?.source).toBe("unnamed");
      expect(restored.tabs[0]?.code).toBe("my code");
      expect(restored.tabs[0]?.readonly).toBe(false);
      expect(restored.activeTabId).toBe(restored.tabs[0]?.id);
    });

    it("Savedタブをラウンドトリップできる", () => {
      let state = openSavedTab(
        initialWorkspaceState,
        "script-1",
        "My Script",
        "saved code",
        1000,
      );
      state = updateTabCode(state, state.tabs[0]?.id ?? "", "modified code");
      const json = serializeWorkspace(state);
      const restored = deserializeWorkspace(json, sampleTemplates);
      expect(restored.tabs).toHaveLength(1);
      expect(restored.tabs[0]?.source).toBe("saved");
      expect(restored.tabs[0]?.code).toBe("modified code");
      expect(restored.tabs[0]?.originalCode).toBe("saved code");
      expect(restored.tabs[0]?.sourceId).toBe("script-1");
    });

    it("Libraryタブはテンプレートから復元される", () => {
      const state = openLibraryTab(
        initialWorkspaceState,
        "tpl-1",
        "Template One",
        "// template 1 code",
        1000,
      );
      const json = serializeWorkspace(state);
      // コードは保存されていないことを確認
      const parsed = JSON.parse(json) as {
        readonly tabs: readonly { readonly code: string }[];
      };
      expect(parsed.tabs[0]?.code).toBe("");

      const restored = deserializeWorkspace(json, sampleTemplates);
      expect(restored.tabs).toHaveLength(1);
      expect(restored.tabs[0]?.source).toBe("library");
      expect(restored.tabs[0]?.code).toBe("// template 1 code");
      expect(restored.tabs[0]?.originalCode).toBe("// template 1 code");
      expect(restored.tabs[0]?.title).toBe("Template One");
      expect(restored.tabs[0]?.readonly).toBe(true);
    });

    it("存在しないテンプレートのLibraryタブは除外される", () => {
      const state = openLibraryTab(
        initialWorkspaceState,
        "tpl-deleted",
        "Deleted Template",
        "code",
        1000,
      );
      const json = serializeWorkspace(state);
      const restored = deserializeWorkspace(json, sampleTemplates);
      expect(restored.tabs).toHaveLength(0);
    });

    it("複数タブ混合のラウンドトリップ", () => {
      let state = createUnnamedTab(initialWorkspaceState, 1000);
      state = openLibraryTab(
        state,
        "tpl-1",
        "Template One",
        "// template 1 code",
        2000,
      );
      state = openSavedTab(state, "script-1", "Script", "saved", 3000);
      const json = serializeWorkspace(state);
      const restored = deserializeWorkspace(json, sampleTemplates);
      expect(restored.tabs).toHaveLength(3);
      expect(restored.tabs[0]?.source).toBe("unnamed");
      expect(restored.tabs[1]?.source).toBe("library");
      expect(restored.tabs[2]?.source).toBe("saved");
      expect(restored.activeTabId).toBe(restored.tabs[2]?.id);
    });

    it("nextUnnamedCounterが保持される", () => {
      let state = createUnnamedTab(initialWorkspaceState, 1000);
      state = createUnnamedTab(state, 2000);
      state = createUnnamedTab(state, 3000);
      expect(state.nextUnnamedCounter).toBe(4);
      const json = serializeWorkspace(state);
      const restored = deserializeWorkspace(json, sampleTemplates);
      expect(restored.nextUnnamedCounter).toBe(4);
    });
  });

  describe("deserializeWorkspace エラーハンドリング", () => {
    it("不正なJSONではinitialStateを返す", () => {
      const restored = deserializeWorkspace("not json", sampleTemplates);
      expect(restored).toEqual(initialWorkspaceState);
    });

    it("空文字列ではinitialStateを返す", () => {
      const restored = deserializeWorkspace("", sampleTemplates);
      expect(restored).toEqual(initialWorkspaceState);
    });

    it("nullではinitialStateを返す", () => {
      const restored = deserializeWorkspace("null", sampleTemplates);
      expect(restored).toEqual(initialWorkspaceState);
    });

    it("配列ではinitialStateを返す", () => {
      const restored = deserializeWorkspace("[]", sampleTemplates);
      expect(restored).toEqual(initialWorkspaceState);
    });

    it("tabsが配列でなければinitialStateを返す", () => {
      const restored = deserializeWorkspace(
        JSON.stringify({
          tabs: "not array",
          activeTabId: null,
          nextUnnamedCounter: 1,
        }),
        sampleTemplates,
      );
      expect(restored).toEqual(initialWorkspaceState);
    });

    it("nextUnnamedCounterが数値でなければinitialStateを返す", () => {
      const restored = deserializeWorkspace(
        JSON.stringify({
          tabs: [],
          activeTabId: null,
          nextUnnamedCounter: "bad",
        }),
        sampleTemplates,
      );
      expect(restored).toEqual(initialWorkspaceState);
    });

    it("nextUnnamedCounterがInfinityならinitialStateを返す", () => {
      // JSON.stringify converts Infinity to null, test with NaN scenario
      const restored = deserializeWorkspace(
        JSON.stringify({
          tabs: [],
          activeTabId: null,
          nextUnnamedCounter: null,
        }),
        sampleTemplates,
      );
      expect(restored).toEqual(initialWorkspaceState);
    });

    it("不正なタブエントリはフィルタされる", () => {
      const json = JSON.stringify({
        tabs: [
          {
            id: "tab-1",
            source: "unnamed",
            title: "Valid",
            code: "code",
            originalCode: "",
            sourceId: null,
            readonly: false,
          },
          { id: 123, source: "unnamed" }, // id not string
          {
            id: "tab-3",
            source: "invalid-source",
            title: "Bad",
            code: "",
            originalCode: "",
            sourceId: null,
            readonly: false,
          },
          null,
          "not an object",
        ],
        activeTabId: "tab-1",
        nextUnnamedCounter: 2,
      });
      const restored = deserializeWorkspace(json, sampleTemplates);
      expect(restored.tabs).toHaveLength(1);
      expect(restored.tabs[0]?.id).toBe("tab-1");
    });

    it("activeTabIdが存在しないタブIDなら最初のタブにフォールバック", () => {
      const state = createUnnamedTab(initialWorkspaceState, 1000);
      const json = serializeWorkspace(state);
      // activeTabIdを書き換え
      const parsed = JSON.parse(json) as Record<string, unknown>;
      parsed["activeTabId"] = "nonexistent-id";
      const restored = deserializeWorkspace(
        JSON.stringify(parsed),
        sampleTemplates,
      );
      expect(restored.activeTabId).toBe(restored.tabs[0]?.id);
    });

    it("LibraryタブのsourceIdがnullなら除外される", () => {
      const json = JSON.stringify({
        tabs: [
          {
            id: "lib-1",
            source: "library",
            title: "No Source",
            code: "",
            originalCode: "",
            sourceId: null,
            readonly: true,
          },
        ],
        activeTabId: "lib-1",
        nextUnnamedCounter: 1,
      });
      const restored = deserializeWorkspace(json, sampleTemplates);
      expect(restored.tabs).toHaveLength(0);
    });
  });
});
