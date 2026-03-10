import { describe, it, expect } from "vitest";
import {
  exportNotebookAsJson,
  importNotebookFromJson,
  generateExportFilename,
  type ExportedNotebook,
} from "./notebookExportLogic";
import {
  createEmptyCollection,
  createNotebook,
  createQuestNotebook,
} from "./notebookState";
import {
  lukasiewiczSystem,
  minimalLogicSystem,
  classicalLogicSystem,
} from "../logic-core/inferenceRule";

// --- テストヘルパー ---

function createTestNotebook() {
  const col = createNotebook(createEmptyCollection(), {
    name: "テストノート",
    system: lukasiewiczSystem,
    now: 1000,
  });
  return col.notebooks[0]!;
}

function createTestQuestNotebook() {
  const col = createQuestNotebook(createEmptyCollection(), {
    name: "クエストノート",
    system: minimalLogicSystem,
    goals: [{ formulaText: "φ → φ" }],
    now: 2000,
    questId: "prop-01",
    questVersion: 1,
  });
  return col.notebooks[0]!;
}

describe("notebookExportLogic", () => {
  describe("exportNotebookAsJson", () => {
    it("バージョン情報を含むJSON文字列を返す", () => {
      const notebook = createTestNotebook();
      const json = exportNotebookAsJson(notebook);
      const parsed = JSON.parse(json) as ExportedNotebook;

      expect(parsed._format).toBe("intro-formal-proof-notebook");
      expect(parsed._version).toBe(1);
      expect(parsed.notebook).toBeDefined();
    });

    it("ノートブックのメタデータが含まれる", () => {
      const notebook = createTestNotebook();
      const json = exportNotebookAsJson(notebook);
      const parsed = JSON.parse(json) as ExportedNotebook;
      const nb = parsed.notebook as Record<string, unknown>;
      const meta = nb["meta"] as Record<string, unknown>;

      expect(meta["name"]).toBe("テストノート");
      expect(meta["id"]).toBe("notebook-1");
      expect(meta["createdAt"]).toBe(1000);
      expect(meta["updatedAt"]).toBe(1000);
    });

    it("ワークスペースの体系情報が含まれる", () => {
      const notebook = createTestNotebook();
      const json = exportNotebookAsJson(notebook);
      const parsed = JSON.parse(json) as ExportedNotebook;
      const nb = parsed.notebook as Record<string, unknown>;
      const ws = nb["workspace"] as Record<string, unknown>;
      const system = ws["system"] as Record<string, unknown>;

      expect(system["name"]).toBe("Łukasiewicz");
      // SetはArrayにシリアライズされる
      expect(Array.isArray(system["propositionalAxioms"])).toBe(true);
    });

    it("クエストノートブックのquestId/questVersionが含まれる", () => {
      const notebook = createTestQuestNotebook();
      const json = exportNotebookAsJson(notebook);
      const parsed = JSON.parse(json) as ExportedNotebook;
      const nb = parsed.notebook as Record<string, unknown>;

      expect(nb["questId"]).toBe("prop-01");
      expect(nb["questVersion"]).toBe(1);
    });

    it("自由帳ノートブックにはquestIdが含まれない", () => {
      const notebook = createTestNotebook();
      const json = exportNotebookAsJson(notebook);
      const parsed = JSON.parse(json) as ExportedNotebook;
      const nb = parsed.notebook as Record<string, unknown>;

      expect(nb["questId"]).toBeUndefined();
      expect(nb["questVersion"]).toBeUndefined();
    });

    it("整形されたJSON文字列を返す（indent 2）", () => {
      const notebook = createTestNotebook();
      const json = exportNotebookAsJson(notebook);

      // インデント付きJSON（改行あり）
      expect(json).toContain("\n");
      expect(json).toContain("  ");
    });
  });

  describe("importNotebookFromJson ラウンドトリップ", () => {
    it("エクスポートしたノートブックをインポートできる", () => {
      const notebook = createTestNotebook();
      const json = exportNotebookAsJson(notebook);
      const collection = createEmptyCollection();
      const result = importNotebookFromJson(collection, json, 5000);

      expect(result._tag).toBe("Ok");
      if (result._tag !== "Ok") return;

      expect(result.collection.notebooks.length).toBe(1);
      const imported = result.collection.notebooks[0]!;

      // 新しいIDが割り当てられる
      expect(imported.meta.id).toBe("notebook-1");
      // 名前に " (import)" が付く
      expect(imported.meta.name).toBe("テストノート (import)");
      // タイムスタンプが更新される
      expect(imported.meta.createdAt).toBe(5000);
      expect(imported.meta.updatedAt).toBe(5000);
      // 体系情報が保持される
      expect(imported.workspace.system.name).toBe("Łukasiewicz");
      expect(imported.workspace.system.propositionalAxioms).toBeInstanceOf(Set);
      expect(imported.workspace.system.propositionalAxioms.has("A1")).toBe(true);
    });

    it("クエストノートブックのquestId/questVersionが保持される", () => {
      const notebook = createTestQuestNotebook();
      const json = exportNotebookAsJson(notebook);
      const collection = createEmptyCollection();
      const result = importNotebookFromJson(collection, json, 5000);

      expect(result._tag).toBe("Ok");
      if (result._tag !== "Ok") return;

      const imported = result.collection.notebooks[0]!;
      expect(imported.questId).toBe("prop-01");
      expect(imported.questVersion).toBe(1);
    });

    it("既存コレクションに追加される", () => {
      const existingCol = createNotebook(createEmptyCollection(), {
        name: "既存ノート",
        system: classicalLogicSystem,
        now: 1000,
      });

      const notebook = createTestNotebook();
      const json = exportNotebookAsJson(notebook);
      const result = importNotebookFromJson(existingCol, json, 5000);

      expect(result._tag).toBe("Ok");
      if (result._tag !== "Ok") return;

      expect(result.collection.notebooks.length).toBe(2);
      expect(result.collection.notebooks[0]!.meta.name).toBe("既存ノート");
      expect(result.collection.notebooks[1]!.meta.name).toBe(
        "テストノート (import)",
      );
      expect(result.collection.nextId).toBe(existingCol.nextId + 1);
    });

    it("notebookIdを返す", () => {
      const notebook = createTestNotebook();
      const json = exportNotebookAsJson(notebook);
      const collection = createEmptyCollection();
      const result = importNotebookFromJson(collection, json, 5000);

      expect(result._tag).toBe("Ok");
      if (result._tag !== "Ok") return;

      expect(result.notebookId).toBe("notebook-1");
    });
  });

  describe("importNotebookFromJson エラーケース", () => {
    it("不正なJSONでInvalidJsonを返す", () => {
      const result = importNotebookFromJson(
        createEmptyCollection(),
        "not json {{{",
        5000,
      );
      expect(result._tag).toBe("InvalidJson");
    });

    it("null JSONでInvalidFormatを返す", () => {
      const result = importNotebookFromJson(
        createEmptyCollection(),
        "null",
        5000,
      );
      expect(result._tag).toBe("InvalidFormat");
    });

    it("配列JSONでInvalidFormatを返す", () => {
      const result = importNotebookFromJson(
        createEmptyCollection(),
        "[]",
        5000,
      );
      expect(result._tag).toBe("InvalidFormat");
    });

    it("_formatが異なる場合InvalidFormatを返す", () => {
      const result = importNotebookFromJson(
        createEmptyCollection(),
        JSON.stringify({ _format: "wrong-format", _version: 1, notebook: {} }),
        5000,
      );
      expect(result._tag).toBe("InvalidFormat");
    });

    it("_formatがない場合InvalidFormatを返す", () => {
      const result = importNotebookFromJson(
        createEmptyCollection(),
        JSON.stringify({ _version: 1, notebook: {} }),
        5000,
      );
      expect(result._tag).toBe("InvalidFormat");
    });

    it("_versionが異なる場合InvalidFormatを返す", () => {
      const result = importNotebookFromJson(
        createEmptyCollection(),
        JSON.stringify({
          _format: "intro-formal-proof-notebook",
          _version: 99,
          notebook: {},
        }),
        5000,
      );
      expect(result._tag).toBe("InvalidFormat");
    });

    it("notebookがnullの場合InvalidNotebookを返す", () => {
      const result = importNotebookFromJson(
        createEmptyCollection(),
        JSON.stringify({
          _format: "intro-formal-proof-notebook",
          _version: 1,
          notebook: null,
        }),
        5000,
      );
      expect(result._tag).toBe("InvalidNotebook");
    });

    it("notebookがプリミティブの場合InvalidNotebookを返す", () => {
      const result = importNotebookFromJson(
        createEmptyCollection(),
        JSON.stringify({
          _format: "intro-formal-proof-notebook",
          _version: 1,
          notebook: "string",
        }),
        5000,
      );
      expect(result._tag).toBe("InvalidNotebook");
    });

    it("notebookの中身が不正な場合InvalidNotebookを返す", () => {
      const result = importNotebookFromJson(
        createEmptyCollection(),
        JSON.stringify({
          _format: "intro-formal-proof-notebook",
          _version: 1,
          notebook: { invalid: "data" },
        }),
        5000,
      );
      expect(result._tag).toBe("InvalidNotebook");
    });

    it("workspace.systemが不正な場合InvalidNotebookを返す", () => {
      const result = importNotebookFromJson(
        createEmptyCollection(),
        JSON.stringify({
          _format: "intro-formal-proof-notebook",
          _version: 1,
          notebook: {
            meta: { id: "x", name: "x", createdAt: 0, updatedAt: 0 },
            workspace: { system: "invalid" },
          },
        }),
        5000,
      );
      expect(result._tag).toBe("InvalidNotebook");
    });
  });

  describe("generateExportFilename", () => {
    it("通常の名前からファイル名を生成する", () => {
      expect(generateExportFilename("テストノート")).toBe(
        "notebook-テストノート",
      );
    });

    it("英数字・ハイフン・アンダースコアはそのまま保持する", () => {
      expect(generateExportFilename("test-note_1")).toBe(
        "notebook-test-note_1",
      );
    });

    it("スペースやスラッシュなどの特殊文字をハイフンに置換する", () => {
      expect(generateExportFilename("my note / test")).toBe(
        "notebook-my-note---test",
      );
    });

    it("ひらがな・カタカナ・漢字は保持する", () => {
      expect(generateExportFilename("証明ノート")).toBe("notebook-証明ノート");
    });

    it("空文字列の場合", () => {
      expect(generateExportFilename("")).toBe("notebook-");
    });
  });
});
