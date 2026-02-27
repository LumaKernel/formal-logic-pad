import { describe, it, expect } from "vitest";
import {
  serializeCollection,
  deserializeCollection,
} from "./notebookSerialization";
import {
  createEmptyCollection,
  createNotebook,
  createQuestNotebook,
} from "./notebookState";
import {
  minimalLogicSystem,
  intuitionisticSystem,
  lukasiewiczSystem,
  mendelsonSystem,
  classicalLogicSystem,
} from "../logic-core/inferenceRule";

describe("notebookSerialization", () => {
  describe("serializeCollection / deserializeCollection ラウンドトリップ", () => {
    it("空コレクションをラウンドトリップできる", () => {
      const original = createEmptyCollection();
      const json = serializeCollection(original);
      const restored = deserializeCollection(json);
      expect(restored).toEqual(original);
    });

    it("ノートブック1件を含むコレクションをラウンドトリップできる", () => {
      const col = createNotebook(createEmptyCollection(), {
        name: "テストノート",
        system: lukasiewiczSystem,
        now: 1000,
      });
      const json = serializeCollection(col);
      const restored = deserializeCollection(json);

      expect(restored.notebooks.length).toBe(1);
      expect(restored.notebooks[0]?.meta.name).toBe("テストノート");
      expect(restored.notebooks[0]?.workspace.system.name).toBe("Łukasiewicz");
      expect(
        restored.notebooks[0]?.workspace.system.propositionalAxioms,
      ).toBeInstanceOf(Set);
      expect(
        restored.notebooks[0]?.workspace.system.propositionalAxioms.has("A1"),
      ).toBe(true);
      expect(
        restored.notebooks[0]?.workspace.system.propositionalAxioms.has("A2"),
      ).toBe(true);
      expect(
        restored.notebooks[0]?.workspace.system.propositionalAxioms.has("A3"),
      ).toBe(true);
      expect(restored.nextId).toBe(col.nextId);
    });

    it("最小論理体系のノートブックをラウンドトリップできる", () => {
      const col = createNotebook(createEmptyCollection(), {
        name: "最小論理ノート",
        system: minimalLogicSystem,
        now: 1000,
      });
      const json = serializeCollection(col);
      const restored = deserializeCollection(json);

      expect(restored.notebooks.length).toBe(1);
      expect(restored.notebooks[0]?.workspace.system.name).toBe(
        "Minimal Logic",
      );
      expect(
        restored.notebooks[0]?.workspace.system.propositionalAxioms.has("A1"),
      ).toBe(true);
      expect(
        restored.notebooks[0]?.workspace.system.propositionalAxioms.has("A2"),
      ).toBe(true);
      expect(
        restored.notebooks[0]?.workspace.system.propositionalAxioms.has("A3"),
      ).toBe(false);
      expect(
        restored.notebooks[0]?.workspace.system.propositionalAxioms.has("M3"),
      ).toBe(false);
      expect(
        restored.notebooks[0]?.workspace.system.propositionalAxioms.size,
      ).toBe(2);
    });

    it("Mendelson体系のノートブックをラウンドトリップできる", () => {
      const col = createNotebook(createEmptyCollection(), {
        name: "Mendelsonノート",
        system: mendelsonSystem,
        now: 1000,
      });
      const json = serializeCollection(col);
      const restored = deserializeCollection(json);

      expect(restored.notebooks.length).toBe(1);
      expect(restored.notebooks[0]?.workspace.system.name).toBe("Mendelson");
      expect(
        restored.notebooks[0]?.workspace.system.propositionalAxioms.has("A1"),
      ).toBe(true);
      expect(
        restored.notebooks[0]?.workspace.system.propositionalAxioms.has("A2"),
      ).toBe(true);
      expect(
        restored.notebooks[0]?.workspace.system.propositionalAxioms.has("M3"),
      ).toBe(true);
      expect(
        restored.notebooks[0]?.workspace.system.propositionalAxioms.has("A3"),
      ).toBe(false);
    });

    it("直観主義論理体系のノートブックをラウンドトリップできる", () => {
      const col = createNotebook(createEmptyCollection(), {
        name: "直観主義ノート",
        system: intuitionisticSystem,
        now: 1000,
      });
      const json = serializeCollection(col);
      const restored = deserializeCollection(json);

      expect(restored.notebooks.length).toBe(1);
      expect(restored.notebooks[0]?.workspace.system.name).toBe(
        "Intuitionistic Logic",
      );
      expect(
        restored.notebooks[0]?.workspace.system.propositionalAxioms.has("A1"),
      ).toBe(true);
      expect(
        restored.notebooks[0]?.workspace.system.propositionalAxioms.has("A2"),
      ).toBe(true);
      expect(
        restored.notebooks[0]?.workspace.system.propositionalAxioms.has("EFQ"),
      ).toBe(true);
      expect(
        restored.notebooks[0]?.workspace.system.propositionalAxioms.has("A3"),
      ).toBe(false);
    });

    it("古典論理体系のノートブックをラウンドトリップできる", () => {
      const col = createNotebook(createEmptyCollection(), {
        name: "古典論理ノート",
        system: classicalLogicSystem,
        now: 1000,
      });
      const json = serializeCollection(col);
      const restored = deserializeCollection(json);

      expect(restored.notebooks.length).toBe(1);
      expect(restored.notebooks[0]?.workspace.system.name).toBe(
        "Classical Logic (HK)",
      );
      expect(
        restored.notebooks[0]?.workspace.system.propositionalAxioms.has("A1"),
      ).toBe(true);
      expect(
        restored.notebooks[0]?.workspace.system.propositionalAxioms.has("A2"),
      ).toBe(true);
      expect(
        restored.notebooks[0]?.workspace.system.propositionalAxioms.has("DNE"),
      ).toBe(true);
      expect(
        restored.notebooks[0]?.workspace.system.propositionalAxioms.has("EFQ"),
      ).toBe(false);
    });

    it("複数ノートブックを含むコレクションをラウンドトリップできる", () => {
      let col = createEmptyCollection();
      col = createNotebook(col, {
        name: "ノート1",
        system: lukasiewiczSystem,
        now: 1000,
      });
      col = createNotebook(col, {
        name: "ノート2",
        system: lukasiewiczSystem,
        now: 2000,
      });
      const json = serializeCollection(col);
      const restored = deserializeCollection(json);

      expect(restored.notebooks.length).toBe(2);
      expect(restored.notebooks[0]?.meta.name).toBe("ノート1");
      expect(restored.notebooks[1]?.meta.name).toBe("ノート2");
      expect(restored.nextId).toBe(3);
    });

    it("クエストノートブックをラウンドトリップできる", () => {
      const col = createQuestNotebook(createEmptyCollection(), {
        name: "クエスト",
        system: lukasiewiczSystem,
        goals: [{ formulaText: "phi -> phi", position: { x: 0, y: 0 } }],
        now: 1000,
      });
      const json = serializeCollection(col);
      const restored = deserializeCollection(json);

      expect(restored.notebooks.length).toBe(1);
      expect(restored.notebooks[0]?.workspace.mode).toBe("quest");
      expect(restored.notebooks[0]?.workspace.nodes.length).toBe(1);
    });

    it("questId付きクエストノートブックをラウンドトリップできる", () => {
      const col = createQuestNotebook(createEmptyCollection(), {
        name: "クエスト",
        system: lukasiewiczSystem,
        goals: [{ formulaText: "phi -> phi", position: { x: 0, y: 0 } }],
        now: 1000,
        questId: "prop-01",
      });
      const json = serializeCollection(col);
      const restored = deserializeCollection(json);

      expect(restored.notebooks.length).toBe(1);
      expect(restored.notebooks[0]?.questId).toBe("prop-01");
    });

    it("questIdがないノートブックではquestIdがundefinedのまま", () => {
      const col = createNotebook(createEmptyCollection(), {
        name: "自由帳",
        system: lukasiewiczSystem,
        now: 1000,
      });
      const json = serializeCollection(col);
      const restored = deserializeCollection(json);

      expect(restored.notebooks[0]?.questId).toBeUndefined();
    });
  });

  describe("deserializeCollection の不正入力処理", () => {
    it("不正なJSON文字列では空コレクションを返す", () => {
      const result = deserializeCollection("invalid json{{{");
      expect(result).toEqual(createEmptyCollection());
    });

    it("nullでは空コレクションを返す", () => {
      const result = deserializeCollection("null");
      expect(result).toEqual(createEmptyCollection());
    });

    it("空文字列では空コレクションを返す", () => {
      const result = deserializeCollection("");
      expect(result).toEqual(createEmptyCollection());
    });

    it("notebooksフィールドがない場合は空コレクションを返す", () => {
      const result = deserializeCollection(JSON.stringify({ nextId: 1 }));
      expect(result).toEqual(createEmptyCollection());
    });

    it("nextIdが数値でない場合は空コレクションを返す", () => {
      const result = deserializeCollection(
        JSON.stringify({ notebooks: [], nextId: "abc" }),
      );
      expect(result).toEqual(createEmptyCollection());
    });

    it("nextIdがInfinityの場合は空コレクションを返す", () => {
      const result = deserializeCollection(
        JSON.stringify({ notebooks: [], nextId: Infinity }),
      );
      // InfinityはJSON.stringifyでnullになるため
      expect(result).toEqual(createEmptyCollection());
    });

    it("不正なLogicSystemのノートブックは除外される", () => {
      const json = JSON.stringify({
        notebooks: [
          {
            meta: {
              id: "notebook-1",
              name: "valid",
              createdAt: 1000,
              updatedAt: 1000,
            },
            workspace: {
              system: {
                name: "test",
                propositionalAxioms: ["A1"],
                predicateLogic: false,
                equalityLogic: false,
                generalization: false,
              },
              nodes: [],
              connections: [],
              nextNodeId: 1,
              mode: "free",
            },
          },
          {
            meta: {
              id: "notebook-2",
              name: "invalid",
              createdAt: 2000,
              updatedAt: 2000,
            },
            workspace: {
              system: { name: "bad", propositionalAxioms: "not-array" },
              nodes: [],
              connections: [],
              nextNodeId: 1,
              mode: "free",
            },
          },
        ],
        nextId: 3,
      });
      const result = deserializeCollection(json);
      expect(result.notebooks.length).toBe(1);
      expect(result.notebooks[0]?.meta.name).toBe("valid");
    });

    it("workspaceがnullのノートブックは除外される", () => {
      const json = JSON.stringify({
        notebooks: [
          {
            meta: {
              id: "notebook-1",
              name: "no-workspace",
              createdAt: 1000,
              updatedAt: 1000,
            },
            workspace: null,
          },
        ],
        nextId: 2,
      });
      const result = deserializeCollection(json);
      expect(result.notebooks.length).toBe(0);
    });

    it("metaがないノートブックは除外される", () => {
      const json = JSON.stringify({
        notebooks: [
          {
            workspace: {
              system: {
                name: "test",
                propositionalAxioms: ["A1"],
                predicateLogic: false,
                equalityLogic: false,
                generalization: false,
              },
              nodes: [],
              connections: [],
              nextNodeId: 1,
              mode: "free",
            },
          },
        ],
        nextId: 2,
      });
      const result = deserializeCollection(json);
      expect(result.notebooks.length).toBe(0);
    });

    it("ノートブック要素がプリミティブの場合は除外される", () => {
      const json = JSON.stringify({
        notebooks: [42, "string", null],
        nextId: 2,
      });
      const result = deserializeCollection(json);
      expect(result.notebooks.length).toBe(0);
    });

    it("不正な公理IDを含むノートブックは除外される", () => {
      const json = JSON.stringify({
        notebooks: [
          {
            meta: {
              id: "notebook-1",
              name: "bad axiom",
              createdAt: 1000,
              updatedAt: 1000,
            },
            workspace: {
              system: {
                name: "test",
                propositionalAxioms: ["A1", "INVALID"],
                predicateLogic: false,
                equalityLogic: false,
                generalization: false,
              },
              nodes: [],
              connections: [],
              nextNodeId: 1,
              mode: "free",
            },
          },
        ],
        nextId: 2,
      });
      const result = deserializeCollection(json);
      expect(result.notebooks.length).toBe(0);
    });

    it("predicateLogicがbooleanでない場合は除外される", () => {
      const json = JSON.stringify({
        notebooks: [
          {
            meta: {
              id: "notebook-1",
              name: "bad-predicate",
              createdAt: 1000,
              updatedAt: 1000,
            },
            workspace: {
              system: {
                name: "test",
                propositionalAxioms: ["A1"],
                predicateLogic: "not-boolean",
                equalityLogic: false,
                generalization: false,
              },
              nodes: [],
              connections: [],
              nextNodeId: 1,
              mode: "free",
            },
          },
        ],
        nextId: 2,
      });
      const result = deserializeCollection(json);
      expect(result.notebooks.length).toBe(0);
    });

    it("equalityLogicがbooleanでない場合は除外される", () => {
      const json = JSON.stringify({
        notebooks: [
          {
            meta: {
              id: "notebook-1",
              name: "bad-equality",
              createdAt: 1000,
              updatedAt: 1000,
            },
            workspace: {
              system: {
                name: "test",
                propositionalAxioms: ["A1"],
                predicateLogic: false,
                equalityLogic: 42,
                generalization: false,
              },
              nodes: [],
              connections: [],
              nextNodeId: 1,
              mode: "free",
            },
          },
        ],
        nextId: 2,
      });
      const result = deserializeCollection(json);
      expect(result.notebooks.length).toBe(0);
    });

    it("generalizationがbooleanでない場合は除外される", () => {
      const json = JSON.stringify({
        notebooks: [
          {
            meta: {
              id: "notebook-1",
              name: "bad-gen",
              createdAt: 1000,
              updatedAt: 1000,
            },
            workspace: {
              system: {
                name: "test",
                propositionalAxioms: ["A1"],
                predicateLogic: false,
                equalityLogic: false,
                generalization: "yes",
              },
              nodes: [],
              connections: [],
              nextNodeId: 1,
              mode: "free",
            },
          },
        ],
        nextId: 2,
      });
      const result = deserializeCollection(json);
      expect(result.notebooks.length).toBe(0);
    });

    it("nameがstringでない場合は除外される", () => {
      const json = JSON.stringify({
        notebooks: [
          {
            meta: {
              id: "notebook-1",
              name: "bad-name",
              createdAt: 1000,
              updatedAt: 1000,
            },
            workspace: {
              system: {
                name: 42,
                propositionalAxioms: ["A1"],
                predicateLogic: false,
                equalityLogic: false,
                generalization: false,
              },
              nodes: [],
              connections: [],
              nextNodeId: 1,
              mode: "free",
            },
          },
        ],
        nextId: 2,
      });
      const result = deserializeCollection(json);
      expect(result.notebooks.length).toBe(0);
    });

    it("systemがnullの場合は除外される", () => {
      const json = JSON.stringify({
        notebooks: [
          {
            meta: {
              id: "notebook-1",
              name: "null-system",
              createdAt: 1000,
              updatedAt: 1000,
            },
            workspace: {
              system: null,
              nodes: [],
              connections: [],
              nextNodeId: 1,
              mode: "free",
            },
          },
        ],
        nextId: 2,
      });
      const result = deserializeCollection(json);
      expect(result.notebooks.length).toBe(0);
    });

    it("systemがプリミティブの場合は除外される", () => {
      const json = JSON.stringify({
        notebooks: [
          {
            meta: {
              id: "notebook-1",
              name: "primitive-system",
              createdAt: 1000,
              updatedAt: 1000,
            },
            workspace: {
              system: "not-an-object",
              nodes: [],
              connections: [],
              nextNodeId: 1,
              mode: "free",
            },
          },
        ],
        nextId: 2,
      });
      const result = deserializeCollection(json);
      expect(result.notebooks.length).toBe(0);
    });

    it("公理IDにnon-string値がある場合は除外される", () => {
      const json = JSON.stringify({
        notebooks: [
          {
            meta: {
              id: "notebook-1",
              name: "non-string-axiom",
              createdAt: 1000,
              updatedAt: 1000,
            },
            workspace: {
              system: {
                name: "test",
                propositionalAxioms: [42],
                predicateLogic: false,
                equalityLogic: false,
                generalization: false,
              },
              nodes: [],
              connections: [],
              nextNodeId: 1,
              mode: "free",
            },
          },
        ],
        nextId: 2,
      });
      const result = deserializeCollection(json);
      expect(result.notebooks.length).toBe(0);
    });
  });

  describe("InferenceEdge シリアライゼーション", () => {
    it("InferenceEdgesを含むワークスペースをラウンドトリップできる", () => {
      let col = createNotebook(createEmptyCollection(), {
        name: "推論エッジテスト",
        system: lukasiewiczSystem,
        now: 1000,
      });
      // InferenceEdgesを直接追加
      const notebook = col.notebooks[0];
      if (notebook === undefined) throw new Error("notebook not found");
      col = {
        ...col,
        notebooks: [
          {
            ...notebook,
            workspace: {
              ...notebook.workspace,
              inferenceEdges: [
                {
                  _tag: "mp",
                  conclusionNodeId: "node-2",
                  leftPremiseNodeId: "node-1",
                  rightPremiseNodeId: undefined,
                  conclusionText: "psi",
                },
                {
                  _tag: "gen",
                  conclusionNodeId: "node-3",
                  premiseNodeId: "node-1",
                  variableName: "x",
                  conclusionText: "all x. phi",
                },
                {
                  _tag: "substitution",
                  conclusionNodeId: "node-4",
                  premiseNodeId: "node-1",
                  entries: [
                    {
                      _tag: "FormulaSubstitution",
                      metaVariableName: "φ",
                      formulaText: "p -> q",
                    },
                  ],
                  conclusionText: "(p -> q) -> (psi -> (p -> q))",
                },
              ],
            },
          },
        ],
      };

      const json = serializeCollection(col);
      const restored = deserializeCollection(json);

      expect(restored.notebooks.length).toBe(1);
      const ws = restored.notebooks[0]?.workspace;
      expect(ws?.inferenceEdges).toHaveLength(3);
      expect(ws?.inferenceEdges[0]?._tag).toBe("mp");
      expect(ws?.inferenceEdges[1]?._tag).toBe("gen");
      expect(ws?.inferenceEdges[2]?._tag).toBe("substitution");
    });

    it("旧フォーマット互換: inferenceEdgesがないデータでは空配列が設定される", () => {
      // inferenceEdges フィールドを含まない旧フォーマットを手動構築
      const oldFormatJson = JSON.stringify({
        notebooks: [
          {
            meta: {
              id: "notebook-1",
              name: "旧フォーマット",
              createdAt: 1000,
              updatedAt: 1000,
            },
            workspace: {
              system: {
                name: "Łukasiewicz",
                propositionalAxioms: ["A1", "A2", "A3"],
                predicateLogic: false,
                equalityLogic: false,
                generalization: false,
              },
              nodes: [],
              connections: [],
              nextNodeId: 1,
              mode: "free",
            },
          },
        ],
        nextId: 2,
      });

      const result = deserializeCollection(oldFormatJson);
      expect(result.notebooks.length).toBe(1);
      expect(result.notebooks[0]?.workspace.inferenceEdges).toEqual([]);
    });

    it("空のinferenceEdgesがラウンドトリップできる", () => {
      const col = createNotebook(createEmptyCollection(), {
        name: "空エッジ",
        system: lukasiewiczSystem,
        now: 1000,
      });
      const json = serializeCollection(col);
      const restored = deserializeCollection(json);

      expect(restored.notebooks[0]?.workspace.inferenceEdges).toEqual([]);
    });
  });

  describe("serializeCollection の出力形式", () => {
    it("propositionalAxiomsがArrayとしてシリアライズされる", () => {
      const col = createNotebook(createEmptyCollection(), {
        name: "test",
        system: lukasiewiczSystem,
        now: 1000,
      });
      const json = serializeCollection(col);
      const parsed = JSON.parse(json) as {
        notebooks: readonly {
          workspace: {
            system: { propositionalAxioms: readonly string[] };
          };
        }[];
      };
      expect(
        Array.isArray(
          parsed.notebooks[0]?.workspace.system.propositionalAxioms,
        ),
      ).toBe(true);
      expect(parsed.notebooks[0]?.workspace.system.propositionalAxioms).toEqual(
        ["A1", "A2", "A3"],
      );
    });

    it("Mendelson体系のpropositionalAxiomsがArrayとしてシリアライズされる", () => {
      const col = createNotebook(createEmptyCollection(), {
        name: "test",
        system: mendelsonSystem,
        now: 1000,
      });
      const json = serializeCollection(col);
      const parsed = JSON.parse(json) as {
        notebooks: readonly {
          workspace: {
            system: { propositionalAxioms: readonly string[] };
          };
        }[];
      };
      expect(parsed.notebooks[0]?.workspace.system.propositionalAxioms).toEqual(
        ["A1", "A2", "M3"],
      );
    });
  });
});
