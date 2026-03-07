import { describe, it, expect } from "vitest";
import {
  initialSavedScriptsState,
  addScript,
  removeScript,
  renameScript,
  updateScriptCode,
  findScript,
  serializeSavedScripts,
  deserializeSavedScripts,
  generateScriptId,
  STORAGE_KEY,
} from "./savedScriptsLogic";
import type { SavedScriptsState } from "./savedScriptsLogic";

describe("savedScriptsLogic", () => {
  describe("initialSavedScriptsState", () => {
    it("空のスクリプト一覧で初期化される", () => {
      expect(initialSavedScriptsState.scripts).toEqual([]);
    });
  });

  describe("STORAGE_KEY", () => {
    it("キーが定義されている", () => {
      expect(STORAGE_KEY).toBe("script-editor-saved-scripts");
    });
  });

  describe("addScript", () => {
    it("スクリプトを追加する", () => {
      const result = addScript(
        initialSavedScriptsState,
        "id-1",
        "My Script",
        "console.log('hello');",
        1000,
      );
      expect(result.scripts).toHaveLength(1);
      expect(result.scripts[0]).toEqual({
        id: "id-1",
        title: "My Script",
        code: "console.log('hello');",
        savedAt: 1000,
      });
    });

    it("既存のスクリプトに追加する", () => {
      const state: SavedScriptsState = {
        scripts: [{ id: "id-1", title: "First", code: "1", savedAt: 1000 }],
      };
      const result = addScript(state, "id-2", "Second", "2", 2000);
      expect(result.scripts).toHaveLength(2);
      expect(result.scripts[0]?.id).toBe("id-1");
      expect(result.scripts[1]?.id).toBe("id-2");
    });
  });

  describe("removeScript", () => {
    it("指定IDのスクリプトを削除する", () => {
      const state: SavedScriptsState = {
        scripts: [
          { id: "id-1", title: "First", code: "1", savedAt: 1000 },
          { id: "id-2", title: "Second", code: "2", savedAt: 2000 },
        ],
      };
      const result = removeScript(state, "id-1");
      expect(result.scripts).toHaveLength(1);
      expect(result.scripts[0]?.id).toBe("id-2");
    });

    it("存在しないIDを指定してもエラーにならない", () => {
      const state: SavedScriptsState = {
        scripts: [{ id: "id-1", title: "First", code: "1", savedAt: 1000 }],
      };
      const result = removeScript(state, "id-999");
      expect(result.scripts).toHaveLength(1);
    });

    it("空の状態から削除してもエラーにならない", () => {
      const result = removeScript(initialSavedScriptsState, "id-1");
      expect(result.scripts).toHaveLength(0);
    });
  });

  describe("renameScript", () => {
    it("指定IDのスクリプト名を変更する", () => {
      const state: SavedScriptsState = {
        scripts: [{ id: "id-1", title: "Old Name", code: "1", savedAt: 1000 }],
      };
      const result = renameScript(state, "id-1", "New Name");
      expect(result.scripts[0]?.title).toBe("New Name");
      expect(result.scripts[0]?.code).toBe("1");
    });

    it("存在しないIDを指定しても他のスクリプトに影響しない", () => {
      const state: SavedScriptsState = {
        scripts: [{ id: "id-1", title: "Keep", code: "1", savedAt: 1000 }],
      };
      const result = renameScript(state, "id-999", "New");
      expect(result.scripts[0]?.title).toBe("Keep");
    });
  });

  describe("updateScriptCode", () => {
    it("指定IDのスクリプトコードと保存時刻を更新する", () => {
      const state: SavedScriptsState = {
        scripts: [
          { id: "id-1", title: "My Script", code: "old code", savedAt: 1000 },
        ],
      };
      const result = updateScriptCode(state, "id-1", "new code", 2000);
      expect(result.scripts[0]?.code).toBe("new code");
      expect(result.scripts[0]?.savedAt).toBe(2000);
      expect(result.scripts[0]?.title).toBe("My Script");
    });

    it("存在しないIDを指定しても他のスクリプトに影響しない", () => {
      const state: SavedScriptsState = {
        scripts: [{ id: "id-1", title: "Keep", code: "keep", savedAt: 1000 }],
      };
      const result = updateScriptCode(state, "id-999", "new", 2000);
      expect(result.scripts[0]?.code).toBe("keep");
    });
  });

  describe("findScript", () => {
    it("指定IDのスクリプトを見つける", () => {
      const state: SavedScriptsState = {
        scripts: [
          { id: "id-1", title: "First", code: "1", savedAt: 1000 },
          { id: "id-2", title: "Second", code: "2", savedAt: 2000 },
        ],
      };
      const found = findScript(state, "id-2");
      expect(found?.title).toBe("Second");
    });

    it("存在しないIDではundefinedを返す", () => {
      const found = findScript(initialSavedScriptsState, "id-999");
      expect(found).toBeUndefined();
    });
  });

  describe("serializeSavedScripts / deserializeSavedScripts", () => {
    it("空の状態をラウンドトリップできる", () => {
      const json = serializeSavedScripts(initialSavedScriptsState);
      const restored = deserializeSavedScripts(json);
      expect(restored).toEqual(initialSavedScriptsState);
    });

    it("複数スクリプトをラウンドトリップできる", () => {
      const state: SavedScriptsState = {
        scripts: [
          {
            id: "id-1",
            title: "First",
            code: "console.log(1);",
            savedAt: 1000,
          },
          {
            id: "id-2",
            title: "Second",
            code: "console.log(2);",
            savedAt: 2000,
          },
        ],
      };
      const json = serializeSavedScripts(state);
      const restored = deserializeSavedScripts(json);
      expect(restored).toEqual(state);
    });

    it("不正なJSONではinitialStateを返す", () => {
      const restored = deserializeSavedScripts("not json");
      expect(restored).toEqual(initialSavedScriptsState);
    });

    it("構造が不正な場合はinitialStateを返す", () => {
      const restored = deserializeSavedScripts(JSON.stringify({ foo: "bar" }));
      expect(restored).toEqual(initialSavedScriptsState);
    });

    it("scriptsが配列でない場合はinitialStateを返す", () => {
      const restored = deserializeSavedScripts(
        JSON.stringify({ scripts: "not array" }),
      );
      expect(restored).toEqual(initialSavedScriptsState);
    });

    it("不正なスクリプトエントリはフィルタされる", () => {
      const json = JSON.stringify({
        scripts: [
          { id: "id-1", title: "Valid", code: "1", savedAt: 1000 },
          { id: 123, title: "Invalid id type", code: "2", savedAt: 2000 },
          { id: "id-3", title: null, code: "3", savedAt: 3000 },
          "not an object",
          null,
        ],
      });
      const restored = deserializeSavedScripts(json);
      expect(restored.scripts).toHaveLength(1);
      expect(restored.scripts[0]?.id).toBe("id-1");
    });

    it("空文字列ではinitialStateを返す", () => {
      const restored = deserializeSavedScripts("");
      expect(restored).toEqual(initialSavedScriptsState);
    });
  });

  describe("generateScriptId", () => {
    it("タイムスタンプを含むIDを生成する", () => {
      const id = generateScriptId(1234567890);
      expect(id).toBe("user-script-1234567890");
    });

    it("異なるタイムスタンプで異なるIDを生成する", () => {
      const id1 = generateScriptId(1000);
      const id2 = generateScriptId(2000);
      expect(id1).not.toBe(id2);
    });
  });
});
