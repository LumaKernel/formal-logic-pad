import { describe, it, expect } from "vitest";
import {
  CUSTOM_QUEST_ID_PREFIX,
  isCustomQuestId,
  generateCustomQuestId,
  createEmptyCustomQuestCollection,
  validateCreateParams,
  validateNoDuplicateId,
  addCustomQuest,
  updateCustomQuest,
  removeCustomQuest,
  duplicateAsCustomQuest,
  findCustomQuestById,
  listCustomQuests,
  getCustomQuestCount,
  mergeWithBuiltinQuests,
  serializeCustomQuestCollection,
  deserializeCustomQuestCollection,
  exportCustomQuestAsJson,
  importCustomQuestFromJson,
  parseCustomQuestFromRaw,
  CUSTOM_QUEST_STORAGE_KEY,
  type CreateCustomQuestParams,
  type CustomQuestCollection,
  type ExportedCustomQuest,
} from "./customQuestState";
import type { QuestDefinition } from "./questDefinition";

// --- テストヘルパー ---

const sampleParams: CreateCustomQuestParams = {
  title: "テストクエスト",
  description: "テストの説明",
  difficulty: 2,
  systemPresetId: "lukasiewicz",
  goals: [{ formulaText: "phi -> phi" }],
  hints: ["ヒント1"],
  estimatedSteps: 5,
  learningPoint: "テスト学習ポイント",
};

const sampleBuiltinQuest: QuestDefinition = {
  id: "prop-01",
  category: "propositional-basics",
  title: "恒等関数",
  description: "φ→φを証明せよ",
  difficulty: 1,
  systemPresetId: "lukasiewicz",
  goals: [{ formulaText: "phi -> phi" }],
  hints: ["A1とA2を使う"],
  estimatedSteps: 5,
  learningPoint: "基本",
  order: 1,
  version: 1,
};

// --- テスト ---

describe("customQuestState", () => {
  describe("ID管理", () => {
    it("CUSTOM_QUEST_ID_PREFIX が定義されている", () => {
      expect(CUSTOM_QUEST_ID_PREFIX).toBe("custom-");
    });

    it("isCustomQuestId はカスタムIDをtrueと判定する", () => {
      expect(isCustomQuestId("custom-12345")).toBe(true);
      expect(isCustomQuestId("custom-abc")).toBe(true);
    });

    it("isCustomQuestId はビルトインIDをfalseと判定する", () => {
      expect(isCustomQuestId("prop-01")).toBe(false);
      expect(isCustomQuestId("pred-01")).toBe(false);
      expect(isCustomQuestId("")).toBe(false);
    });

    it("generateCustomQuestId はプレフィックス付きIDを生成する", () => {
      const id = generateCustomQuestId(1234567890);
      expect(id).toBe("custom-1234567890");
      expect(isCustomQuestId(id)).toBe(true);
    });

    it("generateCustomQuestId は異なるnowで異なるIDを生成する", () => {
      const id1 = generateCustomQuestId(1000);
      const id2 = generateCustomQuestId(2000);
      expect(id1).not.toBe(id2);
    });
  });

  describe("コレクション生成", () => {
    it("空のコレクションを作成できる", () => {
      const collection = createEmptyCustomQuestCollection();
      expect(collection.quests.size).toBe(0);
    });
  });

  describe("バリデーション", () => {
    it("有効なパラメータはValidを返す", () => {
      const result = validateCreateParams(sampleParams);
      expect(result._tag).toBe("Valid");
    });

    it("空のタイトルはEmptyTitleを返す", () => {
      const result = validateCreateParams({
        ...sampleParams,
        title: "",
      });
      expect(result._tag).toBe("EmptyTitle");
    });

    it("空白のみのタイトルはEmptyTitleを返す", () => {
      const result = validateCreateParams({
        ...sampleParams,
        title: "   ",
      });
      expect(result._tag).toBe("EmptyTitle");
    });

    it("空のゴールはEmptyGoalsを返す", () => {
      const result = validateCreateParams({
        ...sampleParams,
        goals: [],
      });
      expect(result._tag).toBe("EmptyGoals");
    });

    it("存在しないIDはValidを返す", () => {
      const collection = createEmptyCustomQuestCollection();
      const result = validateNoDuplicateId(collection, "custom-999");
      expect(result._tag).toBe("Valid");
    });

    it("重複IDはDuplicateIdを返す", () => {
      const addResult = addCustomQuest(
        createEmptyCustomQuestCollection(),
        sampleParams,
        1000,
      );
      expect(addResult.ok).toBe(true);
      if (!addResult.ok) return;

      const result = validateNoDuplicateId(
        addResult.value.collection,
        addResult.value.questId,
      );
      expect(result._tag).toBe("DuplicateId");
    });
  });

  describe("addCustomQuest", () => {
    it("有効なパラメータでクエストを追加できる", () => {
      const collection = createEmptyCustomQuestCollection();
      const result = addCustomQuest(collection, sampleParams, 1000);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.questId).toBe("custom-1000");
      expect(result.value.collection.quests.size).toBe(1);

      const quest = result.value.collection.quests.get(result.value.questId);
      expect(quest).toBeDefined();
      expect(quest?.title).toBe("テストクエスト");
      expect(quest?.version).toBe(1);
      expect(quest?.order).toBe(0);
    });

    it("タイトルの前後空白がトリムされる", () => {
      const result = addCustomQuest(
        createEmptyCustomQuestCollection(),
        { ...sampleParams, title: "  前後空白  " },
        1000,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const quest = result.value.collection.quests.get(result.value.questId);
      expect(quest?.title).toBe("前後空白");
    });

    it("説明の前後空白がトリムされる", () => {
      const result = addCustomQuest(
        createEmptyCustomQuestCollection(),
        { ...sampleParams, description: "  説明  " },
        1000,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const quest = result.value.collection.quests.get(result.value.questId);
      expect(quest?.description).toBe("説明");
    });

    it("空タイトルではエラーを返す", () => {
      const result = addCustomQuest(
        createEmptyCustomQuestCollection(),
        { ...sampleParams, title: "" },
        1000,
      );
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.reason._tag).toBe("EmptyTitle");
    });

    it("空ゴールではエラーを返す", () => {
      const result = addCustomQuest(
        createEmptyCustomQuestCollection(),
        { ...sampleParams, goals: [] },
        1000,
      );
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.reason._tag).toBe("EmptyGoals");
    });

    it("複数のクエストを追加できる", () => {
      const empty = createEmptyCustomQuestCollection();
      const r1 = addCustomQuest(empty, sampleParams, 1000);
      expect(r1.ok).toBe(true);
      if (!r1.ok) return;

      const r2 = addCustomQuest(
        r1.value.collection,
        { ...sampleParams, title: "2つ目" },
        2000,
      );
      expect(r2.ok).toBe(true);
      if (!r2.ok) return;

      expect(r2.value.collection.quests.size).toBe(2);
    });

    it("元のコレクションは変更されない（イミュータブル）", () => {
      const original = createEmptyCustomQuestCollection();
      const result = addCustomQuest(original, sampleParams, 1000);
      expect(result.ok).toBe(true);
      expect(original.quests.size).toBe(0);
    });

    it("同じnowでの追加はID重複エラーを返す", () => {
      const r1 = addCustomQuest(
        createEmptyCustomQuestCollection(),
        sampleParams,
        1000,
      );
      expect(r1.ok).toBe(true);
      if (!r1.ok) return;

      const r2 = addCustomQuest(r1.value.collection, sampleParams, 1000);
      expect(r2.ok).toBe(false);
      if (r2.ok) return;
      expect(r2.reason._tag).toBe("DuplicateId");
    });
  });

  describe("updateCustomQuest", () => {
    it("既存クエストを更新できる", () => {
      const r1 = addCustomQuest(
        createEmptyCustomQuestCollection(),
        sampleParams,
        1000,
      );
      expect(r1.ok).toBe(true);
      if (!r1.ok) return;

      const result = updateCustomQuest(r1.value.collection, r1.value.questId, {
        ...sampleParams,
        title: "更新後タイトル",
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const quest = result.value.collection.quests.get(r1.value.questId);
      expect(quest?.title).toBe("更新後タイトル");
    });

    it("バージョンが自動インクリメントされる", () => {
      const r1 = addCustomQuest(
        createEmptyCustomQuestCollection(),
        sampleParams,
        1000,
      );
      expect(r1.ok).toBe(true);
      if (!r1.ok) return;

      const r2 = updateCustomQuest(r1.value.collection, r1.value.questId, {
        ...sampleParams,
        title: "更新1",
      });
      expect(r2.ok).toBe(true);
      if (!r2.ok) return;

      const quest = r2.value.collection.quests.get(r1.value.questId);
      expect(quest?.version).toBe(2);

      const r3 = updateCustomQuest(r2.value.collection, r1.value.questId, {
        ...sampleParams,
        title: "更新2",
      });
      expect(r3.ok).toBe(true);
      if (!r3.ok) return;

      const quest2 = r3.value.collection.quests.get(r1.value.questId);
      expect(quest2?.version).toBe(3);
    });

    it("存在しないIDではエラーを返す", () => {
      const result = updateCustomQuest(
        createEmptyCustomQuestCollection(),
        "custom-9999",
        sampleParams,
      );
      expect(result.ok).toBe(false);
    });

    it("空タイトルではエラーを返す", () => {
      const r1 = addCustomQuest(
        createEmptyCustomQuestCollection(),
        sampleParams,
        1000,
      );
      expect(r1.ok).toBe(true);
      if (!r1.ok) return;

      const result = updateCustomQuest(r1.value.collection, r1.value.questId, {
        ...sampleParams,
        title: "",
      });
      expect(result.ok).toBe(false);
    });

    it("IDとorderは変更されない", () => {
      const r1 = addCustomQuest(
        createEmptyCustomQuestCollection(),
        sampleParams,
        1000,
      );
      expect(r1.ok).toBe(true);
      if (!r1.ok) return;

      const result = updateCustomQuest(r1.value.collection, r1.value.questId, {
        ...sampleParams,
        title: "更新",
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const quest = result.value.collection.quests.get(r1.value.questId);
      expect(quest?.id).toBe(r1.value.questId);
      expect(quest?.order).toBe(0);
    });
  });

  describe("removeCustomQuest", () => {
    it("既存クエストを削除できる", () => {
      const r1 = addCustomQuest(
        createEmptyCustomQuestCollection(),
        sampleParams,
        1000,
      );
      expect(r1.ok).toBe(true);
      if (!r1.ok) return;

      const result = removeCustomQuest(r1.value.collection, r1.value.questId);
      expect(result.quests.size).toBe(0);
    });

    it("存在しないIDでは元のコレクションを返す", () => {
      const collection = createEmptyCustomQuestCollection();
      const result = removeCustomQuest(collection, "custom-9999");
      expect(result).toBe(collection);
    });

    it("元のコレクションは変更されない（イミュータブル）", () => {
      const r1 = addCustomQuest(
        createEmptyCustomQuestCollection(),
        sampleParams,
        1000,
      );
      expect(r1.ok).toBe(true);
      if (!r1.ok) return;

      const before = r1.value.collection;
      removeCustomQuest(before, r1.value.questId);
      expect(before.quests.size).toBe(1);
    });
  });

  describe("duplicateAsCustomQuest", () => {
    it("ビルトインクエストを複製できる", () => {
      const result = duplicateAsCustomQuest(
        createEmptyCustomQuestCollection(),
        sampleBuiltinQuest,
        5000,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.questId).toBe("custom-5000");
      const quest = result.value.collection.quests.get(result.value.questId);
      expect(quest).toBeDefined();
      expect(quest?.title).toBe(sampleBuiltinQuest.title);
      expect(quest?.description).toBe(sampleBuiltinQuest.description);
      expect(quest?.goals).toBe(sampleBuiltinQuest.goals);
    });

    it("複製はバージョン1にリセットされる", () => {
      const source: QuestDefinition = { ...sampleBuiltinQuest, version: 5 };
      const result = duplicateAsCustomQuest(
        createEmptyCustomQuestCollection(),
        source,
        5000,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const quest = result.value.collection.quests.get(result.value.questId);
      expect(quest?.version).toBe(1);
    });

    it("複製はカスタムIDを持つ", () => {
      const result = duplicateAsCustomQuest(
        createEmptyCustomQuestCollection(),
        sampleBuiltinQuest,
        5000,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(isCustomQuestId(result.value.questId)).toBe(true);
    });

    it("同じnowで複製するとID重複エラーを返す", () => {
      const r1 = duplicateAsCustomQuest(
        createEmptyCustomQuestCollection(),
        sampleBuiltinQuest,
        5000,
      );
      expect(r1.ok).toBe(true);
      if (!r1.ok) return;

      const r2 = duplicateAsCustomQuest(
        r1.value.collection,
        sampleBuiltinQuest,
        5000,
      );
      expect(r2.ok).toBe(false);
      if (r2.ok) return;
      expect(r2.reason._tag).toBe("DuplicateId");
    });
  });

  describe("クエリ", () => {
    function setupCollection(): {
      readonly collection: CustomQuestCollection;
      readonly questId: string;
    } {
      const r = addCustomQuest(
        createEmptyCustomQuestCollection(),
        sampleParams,
        1000,
      );
      if (!r.ok) throw new Error("setup failed");
      return { collection: r.value.collection, questId: r.value.questId };
    }

    it("findCustomQuestById で見つかる", () => {
      const { collection, questId } = setupCollection();
      const quest = findCustomQuestById(collection, questId);
      expect(quest).toBeDefined();
      expect(quest?.title).toBe("テストクエスト");
    });

    it("findCustomQuestById で見つからない場合はundefined", () => {
      const { collection } = setupCollection();
      const quest = findCustomQuestById(collection, "custom-9999");
      expect(quest).toBeUndefined();
    });

    it("listCustomQuests は全クエストの配列を返す", () => {
      const { collection } = setupCollection();
      const list = listCustomQuests(collection);
      expect(list).toHaveLength(1);
      expect(list[0]?.title).toBe("テストクエスト");
    });

    it("listCustomQuests は空コレクションで空配列を返す", () => {
      const list = listCustomQuests(createEmptyCustomQuestCollection());
      expect(list).toHaveLength(0);
    });

    it("getCustomQuestCount はクエスト数を返す", () => {
      const { collection } = setupCollection();
      expect(getCustomQuestCount(collection)).toBe(1);
    });

    it("getCustomQuestCount は空コレクションで0を返す", () => {
      expect(getCustomQuestCount(createEmptyCustomQuestCollection())).toBe(0);
    });
  });

  describe("mergeWithBuiltinQuests", () => {
    it("ビルトインと自作を統合できる", () => {
      const r = addCustomQuest(
        createEmptyCustomQuestCollection(),
        sampleParams,
        1000,
      );
      expect(r.ok).toBe(true);
      if (!r.ok) return;

      const merged = mergeWithBuiltinQuests(
        [sampleBuiltinQuest],
        r.value.collection,
      );
      expect(merged).toHaveLength(2);
      expect(merged[0]?.id).toBe("prop-01");
      expect(merged[1]?.id).toBe("custom-1000");
    });

    it("空の自作コレクションでもビルトインを返す", () => {
      const merged = mergeWithBuiltinQuests(
        [sampleBuiltinQuest],
        createEmptyCustomQuestCollection(),
      );
      expect(merged).toHaveLength(1);
      expect(merged[0]?.id).toBe("prop-01");
    });

    it("空のビルトインでも自作を返す", () => {
      const r = addCustomQuest(
        createEmptyCustomQuestCollection(),
        sampleParams,
        1000,
      );
      expect(r.ok).toBe(true);
      if (!r.ok) return;

      const merged = mergeWithBuiltinQuests([], r.value.collection);
      expect(merged).toHaveLength(1);
    });
  });

  describe("シリアライゼーション", () => {
    it("空コレクションをシリアライズ/デシリアライズできる", () => {
      const collection = createEmptyCustomQuestCollection();
      const serialized = serializeCustomQuestCollection(collection);
      expect(serialized.quests).toHaveLength(0);

      const deserialized = deserializeCustomQuestCollection(serialized);
      expect(deserialized.quests.size).toBe(0);
    });

    it("クエスト付きコレクションをラウンドトリップできる", () => {
      const r = addCustomQuest(
        createEmptyCustomQuestCollection(),
        sampleParams,
        1000,
      );
      expect(r.ok).toBe(true);
      if (!r.ok) return;

      const serialized = serializeCustomQuestCollection(r.value.collection);
      const json = JSON.parse(JSON.stringify(serialized)) as unknown;
      const deserialized = deserializeCustomQuestCollection(json);

      expect(deserialized.quests.size).toBe(1);
      const quest = deserialized.quests.get("custom-1000");
      expect(quest).toBeDefined();
      expect(quest?.title).toBe("テストクエスト");
      expect(quest?.description).toBe("テストの説明");
      expect(quest?.category).toBe("propositional-basics");
      expect(quest?.difficulty).toBe(2);
      expect(quest?.systemPresetId).toBe("lukasiewicz");
      expect(quest?.goals).toHaveLength(1);
      expect(quest?.goals[0]?.formulaText).toBe("phi -> phi");
      expect(quest?.hints).toEqual(["ヒント1"]);
      expect(quest?.estimatedSteps).toBe(5);
      expect(quest?.learningPoint).toBe("テスト学習ポイント");
      expect(quest?.version).toBe(1);
    });

    it("allowedAxiomIds付きクエストをラウンドトリップできる", () => {
      const paramsWithAxioms: CreateCustomQuestParams = {
        ...sampleParams,
        goals: [
          {
            formulaText: "phi -> phi",
            label: "Goal",
            allowedAxiomIds: ["A1", "A2"],
          },
        ],
      };
      const r = addCustomQuest(
        createEmptyCustomQuestCollection(),
        paramsWithAxioms,
        1000,
      );
      expect(r.ok).toBe(true);
      if (!r.ok) return;

      const serialized = serializeCustomQuestCollection(r.value.collection);
      const json = JSON.parse(JSON.stringify(serialized)) as unknown;
      const deserialized = deserializeCustomQuestCollection(json);

      const quest = deserialized.quests.get("custom-1000");
      expect(quest?.goals[0]?.allowedAxiomIds).toEqual(["A1", "A2"]);
    });

    it("allowedRuleIds付きゴールをラウンドトリップできる", () => {
      const paramsWithRules: CreateCustomQuestParams = {
        ...sampleParams,
        goals: [
          {
            formulaText: "phi -> phi",
            allowedRuleIds: ["mp", "gen"],
          },
        ],
      };
      const r = addCustomQuest(
        createEmptyCustomQuestCollection(),
        paramsWithRules,
        1000,
      );
      expect(r.ok).toBe(true);
      if (!r.ok) return;

      const serialized = serializeCustomQuestCollection(r.value.collection);
      const json = JSON.parse(JSON.stringify(serialized)) as unknown;
      const deserialized = deserializeCustomQuestCollection(json);

      const quest = deserialized.quests.get("custom-1000");
      expect(quest?.goals[0]?.allowedRuleIds).toEqual(["mp", "gen"]);
    });

    it("estimatedStepsがundefinedのクエストをラウンドトリップできる", () => {
      const paramsUndefinedSteps: CreateCustomQuestParams = {
        ...sampleParams,
        estimatedSteps: undefined,
      };
      const r = addCustomQuest(
        createEmptyCustomQuestCollection(),
        paramsUndefinedSteps,
        1000,
      );
      expect(r.ok).toBe(true);
      if (!r.ok) return;

      const quest = r.value.collection.quests.get("custom-1000");
      expect(quest?.estimatedSteps).toBeUndefined();

      const serialized = serializeCustomQuestCollection(r.value.collection);
      const json = JSON.parse(JSON.stringify(serialized)) as unknown;
      const deserialized = deserializeCustomQuestCollection(json);

      const roundTripped = deserialized.quests.get("custom-1000");
      expect(roundTripped?.estimatedSteps).toBeUndefined();
    });

    it("quest-level allowedAxiomIds付きクエストをシリアライズ/デシリアライズできる", () => {
      // allowedAxiomIds付きビルトインクエストを複製して、シリアライズに含める
      const sourceWithAxiomIds: QuestDefinition = {
        ...sampleBuiltinQuest,
        allowedAxiomIds: ["A1", "A2", "A3"],
      };
      const r = duplicateAsCustomQuest(
        createEmptyCustomQuestCollection(),
        sourceWithAxiomIds,
        1000,
      );
      expect(r.ok).toBe(true);
      if (!r.ok) return;

      const serialized = serializeCustomQuestCollection(r.value.collection);
      expect(serialized.quests[0]?.allowedAxiomIds).toEqual(["A1", "A2", "A3"]);

      const json = JSON.parse(JSON.stringify(serialized)) as unknown;
      const deserialized = deserializeCustomQuestCollection(json);
      const quest = deserialized.quests.get("custom-1000");
      expect(quest?.allowedAxiomIds).toEqual(["A1", "A2", "A3"]);
    });

    it("不正なデータでは空コレクションを返す", () => {
      expect(deserializeCustomQuestCollection(null).quests.size).toBe(0);
      expect(deserializeCustomQuestCollection(undefined).quests.size).toBe(0);
      expect(deserializeCustomQuestCollection("string").quests.size).toBe(0);
      expect(deserializeCustomQuestCollection(42).quests.size).toBe(0);
      expect(deserializeCustomQuestCollection({}).quests.size).toBe(0);
    });

    it("不正なクエストエントリはスキップされる", () => {
      const data = {
        quests: [
          { id: "not-custom-prefix", title: "invalid" },
          null,
          42,
          "string",
        ],
      };
      const result = deserializeCustomQuestCollection(data);
      expect(result.quests.size).toBe(0);
    });

    it("不正なゴールがあるクエストはスキップされる", () => {
      const data = {
        quests: [
          {
            id: "custom-1000",
            category: "propositional-basics",
            title: "test",
            description: "desc",
            difficulty: 1,
            systemPresetId: "lukasiewicz",
            goals: [{ noFormulaText: true }],
            hints: [],
            estimatedSteps: 5,
            learningPoint: "lp",
            order: 0,
            version: 1,
          },
        ],
      };
      const result = deserializeCustomQuestCollection(data);
      expect(result.quests.size).toBe(0);
    });

    it("ゴール配列にnullが含まれるクエストはスキップされる", () => {
      const data = {
        quests: [
          {
            id: "custom-1000",
            category: "propositional-basics",
            title: "test",
            description: "desc",
            difficulty: 1,
            systemPresetId: "lukasiewicz",
            goals: [null, { formulaText: "phi -> phi" }],
            hints: [],
            estimatedSteps: 5,
            learningPoint: "lp",
            order: 0,
            version: 1,
          },
        ],
      };
      const result = deserializeCustomQuestCollection(data);
      expect(result.quests.size).toBe(0);
    });

    it("ゴール配列にプリミティブ値が含まれるクエストはスキップされる", () => {
      const data = {
        quests: [
          {
            id: "custom-1000",
            category: "propositional-basics",
            title: "test",
            description: "desc",
            difficulty: 1,
            systemPresetId: "lukasiewicz",
            goals: [42, "string"],
            hints: [],
            estimatedSteps: 5,
            learningPoint: "lp",
            order: 0,
            version: 1,
          },
        ],
      };
      const result = deserializeCustomQuestCollection(data);
      expect(result.quests.size).toBe(0);
    });

    it("不正なヒント（非文字列）があるクエストはスキップされる", () => {
      const data = {
        quests: [
          {
            id: "custom-1000",
            category: "propositional-basics",
            title: "test",
            description: "desc",
            difficulty: 1,
            systemPresetId: "lukasiewicz",
            goals: [{ formulaText: "phi -> phi" }],
            hints: [42],
            estimatedSteps: 5,
            learningPoint: "lp",
            order: 0,
            version: 1,
          },
        ],
      };
      const result = deserializeCustomQuestCollection(data);
      expect(result.quests.size).toBe(0);
    });

    it("orderが欠けている場合はデフォルト0になる", () => {
      const data = {
        quests: [
          {
            id: "custom-1000",
            category: "propositional-basics",
            title: "test",
            description: "desc",
            difficulty: 1,
            systemPresetId: "lukasiewicz",
            goals: [{ formulaText: "phi -> phi" }],
            hints: [],
            estimatedSteps: 5,
            learningPoint: "lp",
            version: 1,
          },
        ],
      };
      const result = deserializeCustomQuestCollection(data);
      expect(result.quests.size).toBe(1);
      expect(result.quests.get("custom-1000")?.order).toBe(0);
    });

    it("quest-level allowedAxiomIdsをラウンドトリップできる", () => {
      // allowedAxiomIdsをQuestDefinition直接のプロパティとして持つケース
      const data = {
        quests: [
          {
            id: "custom-2000",
            category: "propositional-basics",
            title: "axiom restricted",
            description: "desc",
            difficulty: 2,
            systemPresetId: "lukasiewicz",
            goals: [{ formulaText: "phi -> phi" }],
            hints: ["hint"],
            estimatedSteps: 3,
            learningPoint: "lp",
            order: 1,
            version: 1,
            allowedAxiomIds: ["A1", "A2"],
          },
        ],
      };
      const result = deserializeCustomQuestCollection(data);
      expect(result.quests.size).toBe(1);
      const quest = result.quests.get("custom-2000");
      expect(quest?.allowedAxiomIds).toEqual(["A1", "A2"]);
    });

    it("goalsのlabel付きをデシリアライズできる", () => {
      const data = {
        quests: [
          {
            id: "custom-3000",
            category: "propositional-basics",
            title: "labeled",
            description: "desc",
            difficulty: 1,
            systemPresetId: "lukasiewicz",
            goals: [
              { formulaText: "phi -> phi", label: "Goal 1" },
              { formulaText: "psi -> psi" },
            ],
            hints: [],
            estimatedSteps: 5,
            learningPoint: "lp",
            order: 0,
            version: 1,
          },
        ],
      };
      const result = deserializeCustomQuestCollection(data);
      expect(result.quests.size).toBe(1);
      const quest = result.quests.get("custom-3000");
      expect(quest?.goals).toHaveLength(2);
      expect(quest?.goals[0]?.label).toBe("Goal 1");
      expect(quest?.goals[1]?.label).toBeUndefined();
    });

    it("必須フィールドが欠けたクエストはスキップされる", () => {
      // category欠落
      const data1 = {
        quests: [
          {
            id: "custom-1000",
            title: "test",
            description: "desc",
            difficulty: 1,
            systemPresetId: "lukasiewicz",
            goals: [{ formulaText: "phi" }],
            hints: [],
            estimatedSteps: 5,
            learningPoint: "lp",
            version: 1,
          },
        ],
      };
      expect(deserializeCustomQuestCollection(data1).quests.size).toBe(0);

      // title欠落
      const data2 = {
        quests: [
          {
            id: "custom-1000",
            category: "propositional-basics",
            description: "desc",
            difficulty: 1,
            systemPresetId: "lukasiewicz",
            goals: [{ formulaText: "phi" }],
            hints: [],
            estimatedSteps: 5,
            learningPoint: "lp",
            version: 1,
          },
        ],
      };
      expect(deserializeCustomQuestCollection(data2).quests.size).toBe(0);

      // difficulty欠落
      const data3 = {
        quests: [
          {
            id: "custom-1000",
            category: "propositional-basics",
            title: "test",
            description: "desc",
            systemPresetId: "lukasiewicz",
            goals: [{ formulaText: "phi" }],
            hints: [],
            estimatedSteps: 5,
            learningPoint: "lp",
            version: 1,
          },
        ],
      };
      expect(deserializeCustomQuestCollection(data3).quests.size).toBe(0);

      // systemPresetId欠落
      const data4 = {
        quests: [
          {
            id: "custom-1000",
            category: "propositional-basics",
            title: "test",
            description: "desc",
            difficulty: 1,
            goals: [{ formulaText: "phi" }],
            hints: [],
            estimatedSteps: 5,
            learningPoint: "lp",
            version: 1,
          },
        ],
      };
      expect(deserializeCustomQuestCollection(data4).quests.size).toBe(0);

      // description欠落
      const data5a = {
        quests: [
          {
            id: "custom-1000",
            category: "propositional-basics",
            title: "test",
            difficulty: 1,
            systemPresetId: "lukasiewicz",
            goals: [{ formulaText: "phi" }],
            hints: [],
            estimatedSteps: 5,
            learningPoint: "lp",
            version: 1,
          },
        ],
      };
      expect(deserializeCustomQuestCollection(data5a).quests.size).toBe(0);

      // hints欠落
      const data5b = {
        quests: [
          {
            id: "custom-1000",
            category: "propositional-basics",
            title: "test",
            description: "desc",
            difficulty: 1,
            systemPresetId: "lukasiewicz",
            goals: [{ formulaText: "phi" }],
            estimatedSteps: 5,
            learningPoint: "lp",
            version: 1,
          },
        ],
      };
      expect(deserializeCustomQuestCollection(data5b).quests.size).toBe(0);

      // estimatedSteps欠落 → undefinedとして有効
      const data5c = {
        quests: [
          {
            id: "custom-1000",
            category: "propositional-basics",
            title: "test",
            description: "desc",
            difficulty: 1,
            systemPresetId: "lukasiewicz",
            goals: [{ formulaText: "phi" }],
            hints: [],
            learningPoint: "lp",
            version: 1,
          },
        ],
      };
      const col5c = deserializeCustomQuestCollection(data5c);
      expect(col5c.quests.size).toBe(1);
      expect(col5c.quests.get("custom-1000")?.estimatedSteps).toBeUndefined();

      // estimatedStepsが不正な型の場合は無効
      const data5c2 = {
        quests: [
          {
            id: "custom-1000",
            category: "propositional-basics",
            title: "test",
            description: "desc",
            difficulty: 1,
            systemPresetId: "lukasiewicz",
            goals: [{ formulaText: "phi" }],
            hints: [],
            estimatedSteps: "not-a-number",
            learningPoint: "lp",
            version: 1,
          },
        ],
      };
      expect(deserializeCustomQuestCollection(data5c2).quests.size).toBe(0);

      // learningPoint欠落
      const data5d = {
        quests: [
          {
            id: "custom-1000",
            category: "propositional-basics",
            title: "test",
            description: "desc",
            difficulty: 1,
            systemPresetId: "lukasiewicz",
            goals: [{ formulaText: "phi" }],
            hints: [],
            estimatedSteps: 5,
            version: 1,
          },
        ],
      };
      expect(deserializeCustomQuestCollection(data5d).quests.size).toBe(0);

      // version欠落
      const data5 = {
        quests: [
          {
            id: "custom-1000",
            category: "propositional-basics",
            title: "test",
            description: "desc",
            difficulty: 1,
            systemPresetId: "lukasiewicz",
            goals: [{ formulaText: "phi" }],
            hints: [],
            estimatedSteps: 5,
            learningPoint: "lp",
          },
        ],
      };
      expect(deserializeCustomQuestCollection(data5).quests.size).toBe(0);
    });

    it("goals配列がないクエストはスキップされる", () => {
      const data = {
        quests: [
          {
            id: "custom-1000",
            category: "propositional-basics",
            title: "test",
            description: "desc",
            difficulty: 1,
            systemPresetId: "lukasiewicz",
            goals: "not-array",
            hints: [],
            estimatedSteps: 5,
            learningPoint: "lp",
            version: 1,
          },
        ],
      };
      expect(deserializeCustomQuestCollection(data).quests.size).toBe(0);
    });

    it("allowedAxiomIds内の非文字列はフィルタされる", () => {
      const data = {
        quests: [
          {
            id: "custom-1000",
            category: "propositional-basics",
            title: "test",
            description: "desc",
            difficulty: 1,
            systemPresetId: "lukasiewicz",
            goals: [
              { formulaText: "phi -> phi", allowedAxiomIds: ["A1", 42, "A2"] },
            ],
            hints: [],
            estimatedSteps: 5,
            learningPoint: "lp",
            order: 0,
            version: 1,
          },
        ],
      };
      const result = deserializeCustomQuestCollection(data);
      expect(result.quests.size).toBe(1);
      // parseStringArrayは非文字列があるとundefinedを返す
      // spreadでは { allowedAxiomIds: undefined } となるのでプロパティ自体は存在する
      const quest = result.quests.get("custom-1000");
      expect(quest?.goals[0]?.allowedAxiomIds).toBeUndefined();
    });
  });

  describe("ストレージキー", () => {
    it("CUSTOM_QUEST_STORAGE_KEY が定義されている", () => {
      expect(CUSTOM_QUEST_STORAGE_KEY).toBe("custom-quests");
    });
  });

  describe("parseCustomQuestFromRaw", () => {
    it("有効なrawデータからクエスト定義をパースできる", () => {
      const raw = {
        id: "custom-1000",
        category: "propositional-basics",
        title: "test",
        description: "desc",
        difficulty: 1,
        systemPresetId: "lukasiewicz",
        goals: [{ formulaText: "phi -> phi" }],
        hints: ["hint"],
        estimatedSteps: 5,
        learningPoint: "lp",
        order: 0,
        version: 1,
      };
      const result = parseCustomQuestFromRaw(raw);
      expect(result).toBeDefined();
      expect(result?.id).toBe("custom-1000");
      expect(result?.title).toBe("test");
    });

    it("nullはundefinedを返す", () => {
      expect(parseCustomQuestFromRaw(null)).toBeUndefined();
    });

    it("文字列はundefinedを返す", () => {
      expect(parseCustomQuestFromRaw("string")).toBeUndefined();
    });

    it("非カスタムIDはundefinedを返す", () => {
      const raw = {
        id: "prop-01",
        category: "propositional-basics",
        title: "test",
        description: "desc",
        difficulty: 1,
        systemPresetId: "lukasiewicz",
        goals: [{ formulaText: "phi -> phi" }],
        hints: [],
        estimatedSteps: 5,
        learningPoint: "lp",
        version: 1,
      };
      expect(parseCustomQuestFromRaw(raw)).toBeUndefined();
    });
  });

  describe("exportCustomQuestAsJson", () => {
    it("クエストをJSON文字列にエクスポートできる", () => {
      const r = addCustomQuest(
        createEmptyCustomQuestCollection(),
        sampleParams,
        1000,
      );
      expect(r.ok).toBe(true);
      if (!r.ok) return;

      const quest = r.value.collection.quests.get(r.value.questId);
      expect(quest).toBeDefined();
      if (quest === undefined) return;

      const json = exportCustomQuestAsJson(quest);
      const parsed = JSON.parse(json) as ExportedCustomQuest;

      expect(parsed._format).toBe("intro-formal-proof-quest");
      expect(parsed._version).toBe(1);
      expect(parsed.quest.id).toBe("custom-1000");
      expect(parsed.quest.title).toBe("テストクエスト");
      expect(parsed.quest.goals).toHaveLength(1);
      expect(parsed.quest.goals[0]?.formulaText).toBe("phi -> phi");
    });

    it("allowedAxiomIds付きクエストをエクスポートできる", () => {
      const r = addCustomQuest(
        createEmptyCustomQuestCollection(),
        {
          ...sampleParams,
          goals: [
            {
              formulaText: "phi -> phi",
              label: "Goal 1",
              allowedAxiomIds: ["A1", "A2"],
            },
          ],
        },
        1000,
      );
      expect(r.ok).toBe(true);
      if (!r.ok) return;

      const quest = r.value.collection.quests.get(r.value.questId);
      if (quest === undefined) return;

      const json = exportCustomQuestAsJson(quest);
      const parsed = JSON.parse(json) as ExportedCustomQuest;

      expect(parsed.quest.goals[0]?.label).toBe("Goal 1");
      expect(parsed.quest.goals[0]?.allowedAxiomIds).toEqual(["A1", "A2"]);
    });

    it("allowedRuleIds付きクエストをエクスポートできる", () => {
      const r = addCustomQuest(
        createEmptyCustomQuestCollection(),
        {
          ...sampleParams,
          goals: [
            {
              formulaText: "phi -> phi",
              allowedRuleIds: ["mp", "gen"],
            },
          ],
        },
        1000,
      );
      expect(r.ok).toBe(true);
      if (!r.ok) return;

      const quest = r.value.collection.quests.get(r.value.questId);
      if (quest === undefined) return;

      const json = exportCustomQuestAsJson(quest);
      const parsed = JSON.parse(json) as ExportedCustomQuest;

      expect(parsed.quest.goals[0]?.allowedRuleIds).toEqual(["mp", "gen"]);
    });

    it("quest-level allowedAxiomIds付きクエストをエクスポートできる", () => {
      const questWithAxiomIds: QuestDefinition = {
        ...sampleBuiltinQuest,
        id: "custom-3000",
        allowedAxiomIds: ["A1", "A3"],
      };

      const json = exportCustomQuestAsJson(questWithAxiomIds);
      const parsed = JSON.parse(json) as ExportedCustomQuest;

      expect(parsed.quest.allowedAxiomIds).toEqual(["A1", "A3"]);
    });

    it("エクスポートJSONは整形済み（pretty-printed）", () => {
      const r = addCustomQuest(
        createEmptyCustomQuestCollection(),
        sampleParams,
        1000,
      );
      if (!r.ok) return;

      const quest = r.value.collection.quests.get(r.value.questId);
      if (quest === undefined) return;

      const json = exportCustomQuestAsJson(quest);
      expect(json).toContain("\n");
      expect(json).toContain("  ");
    });

    it("estimatedStepsがundefinedのクエストをエクスポートするとestimatedStepsが含まれない", () => {
      const r = addCustomQuest(
        createEmptyCustomQuestCollection(),
        {
          ...sampleParams,
          estimatedSteps: undefined,
        },
        1000,
      );
      expect(r.ok).toBe(true);
      if (!r.ok) return;

      const quest = r.value.collection.quests.get(r.value.questId);
      if (quest === undefined) return;

      const json = exportCustomQuestAsJson(quest);
      const parsed = JSON.parse(json) as ExportedCustomQuest;

      expect(parsed.quest.estimatedSteps).toBeUndefined();
      expect("estimatedSteps" in parsed.quest).toBe(false);
    });
  });

  describe("importCustomQuestFromJson", () => {
    function createExportedJson(
      overrides: Record<string, unknown> = {},
    ): string {
      const base = {
        _format: "intro-formal-proof-quest",
        _version: 1,
        quest: {
          id: "custom-1000",
          category: "propositional-basics",
          title: "インポートテスト",
          description: "説明",
          difficulty: 2,
          systemPresetId: "lukasiewicz",
          goals: [{ formulaText: "phi -> phi" }],
          hints: ["ヒント"],
          estimatedSteps: 5,
          learningPoint: "学習ポイント",
          order: 0,
          version: 1,
        },
        ...overrides,
      };
      return JSON.stringify(base);
    }

    it("有効なJSONからクエストをインポートできる", () => {
      const collection = createEmptyCustomQuestCollection();
      const json = createExportedJson();
      const result = importCustomQuestFromJson(collection, json, 2000);

      expect(result._tag).toBe("Ok");
      if (result._tag !== "Ok") return;

      expect(result.questId).toBe("custom-2000");
      expect(result.collection.quests.size).toBe(1);

      const quest = result.collection.quests.get(result.questId);
      expect(quest?.title).toBe("インポートテスト");
      expect(quest?.description).toBe("説明");
      expect(quest?.goals[0]?.formulaText).toBe("phi -> phi");
    });

    it("インポートされたクエストは新しいIDを取得する", () => {
      const collection = createEmptyCustomQuestCollection();
      const json = createExportedJson();
      const result = importCustomQuestFromJson(collection, json, 5000);

      expect(result._tag).toBe("Ok");
      if (result._tag !== "Ok") return;

      // 元のID (custom-1000) ではなく新しいID (custom-5000)
      expect(result.questId).toBe("custom-5000");
      expect(result.collection.quests.has("custom-1000")).toBe(false);
    });

    it("インポートされたクエストはバージョン1にリセットされる", () => {
      const json = createExportedJson({
        quest: {
          id: "custom-1000",
          category: "propositional-basics",
          title: "test",
          description: "desc",
          difficulty: 1,
          systemPresetId: "lukasiewicz",
          goals: [{ formulaText: "phi -> phi" }],
          hints: [],
          estimatedSteps: 5,
          learningPoint: "lp",
          order: 0,
          version: 5,
        },
      });

      const result = importCustomQuestFromJson(
        createEmptyCustomQuestCollection(),
        json,
        2000,
      );
      expect(result._tag).toBe("Ok");
      if (result._tag !== "Ok") return;

      const quest = result.collection.quests.get(result.questId);
      expect(quest?.version).toBe(1);
    });

    it("不正なJSON文字列ではInvalidJsonを返す", () => {
      const result = importCustomQuestFromJson(
        createEmptyCustomQuestCollection(),
        "not json",
        1000,
      );
      expect(result._tag).toBe("InvalidJson");
    });

    it("JSON nullではInvalidFormatを返す", () => {
      const result = importCustomQuestFromJson(
        createEmptyCustomQuestCollection(),
        "null",
        1000,
      );
      expect(result._tag).toBe("InvalidFormat");
    });

    it("_formatが異なるとInvalidFormatを返す", () => {
      const json = createExportedJson({ _format: "wrong-format" });
      const result = importCustomQuestFromJson(
        createEmptyCustomQuestCollection(),
        json,
        1000,
      );
      expect(result._tag).toBe("InvalidFormat");
    });

    it("_formatが欠けているとInvalidFormatを返す", () => {
      const json = JSON.stringify({
        _version: 1,
        quest: {
          id: "custom-1000",
          category: "propositional-basics",
          title: "test",
          description: "desc",
          difficulty: 1,
          systemPresetId: "lukasiewicz",
          goals: [{ formulaText: "phi" }],
          hints: [],
          estimatedSteps: 5,
          learningPoint: "lp",
          version: 1,
        },
      });
      const result = importCustomQuestFromJson(
        createEmptyCustomQuestCollection(),
        json,
        1000,
      );
      expect(result._tag).toBe("InvalidFormat");
    });

    it("_versionが異なるとInvalidFormatを返す", () => {
      const json = createExportedJson({ _version: 2 });
      const result = importCustomQuestFromJson(
        createEmptyCustomQuestCollection(),
        json,
        1000,
      );
      expect(result._tag).toBe("InvalidFormat");
    });

    it("questデータが不正だとInvalidQuestを返す", () => {
      const json = createExportedJson({
        quest: { id: "not-custom", title: "bad" },
      });
      const result = importCustomQuestFromJson(
        createEmptyCustomQuestCollection(),
        json,
        1000,
      );
      expect(result._tag).toBe("InvalidQuest");
    });

    it("ID重複時はDuplicateIdを返す", () => {
      // まず1つ追加
      const r1 = addCustomQuest(
        createEmptyCustomQuestCollection(),
        sampleParams,
        2000,
      );
      expect(r1.ok).toBe(true);
      if (!r1.ok) return;

      // 同じnowでインポート → ID重複
      const json = createExportedJson();
      const result = importCustomQuestFromJson(r1.value.collection, json, 2000);
      expect(result._tag).toBe("DuplicateId");
    });

    it("エクスポート→インポートのラウンドトリップが成功する", () => {
      // エクスポート
      const r1 = addCustomQuest(
        createEmptyCustomQuestCollection(),
        {
          ...sampleParams,
          goals: [
            {
              formulaText: "phi -> phi",
              label: "Goal 1",
              allowedAxiomIds: ["A1"],
              allowedRuleIds: ["mp"],
            },
          ],
        },
        1000,
      );
      expect(r1.ok).toBe(true);
      if (!r1.ok) return;

      const quest = r1.value.collection.quests.get(r1.value.questId);
      if (quest === undefined) return;

      const json = exportCustomQuestAsJson(quest);

      // インポート（別のコレクションに）
      const result = importCustomQuestFromJson(
        createEmptyCustomQuestCollection(),
        json,
        3000,
      );

      expect(result._tag).toBe("Ok");
      if (result._tag !== "Ok") return;

      const imported = result.collection.quests.get(result.questId);
      expect(imported?.title).toBe("テストクエスト");
      expect(imported?.description).toBe("テストの説明");
      expect(imported?.category).toBe("propositional-basics");
      expect(imported?.difficulty).toBe(2);
      expect(imported?.systemPresetId).toBe("lukasiewicz");
      expect(imported?.goals[0]?.formulaText).toBe("phi -> phi");
      expect(imported?.goals[0]?.label).toBe("Goal 1");
      expect(imported?.goals[0]?.allowedAxiomIds).toEqual(["A1"]);
      expect(imported?.goals[0]?.allowedRuleIds).toEqual(["mp"]);
      expect(imported?.hints).toEqual(["ヒント1"]);
      expect(imported?.estimatedSteps).toBe(5);
      expect(imported?.learningPoint).toBe("テスト学習ポイント");
    });

    it("既存のコレクションにインポートを追加できる", () => {
      const r1 = addCustomQuest(
        createEmptyCustomQuestCollection(),
        sampleParams,
        1000,
      );
      expect(r1.ok).toBe(true);
      if (!r1.ok) return;

      const json = createExportedJson();
      const result = importCustomQuestFromJson(r1.value.collection, json, 2000);

      expect(result._tag).toBe("Ok");
      if (result._tag !== "Ok") return;

      expect(result.collection.quests.size).toBe(2);
      expect(result.collection.quests.has("custom-1000")).toBe(true);
      expect(result.collection.quests.has("custom-2000")).toBe(true);
    });

    it("元のコレクションは変更されない（イミュータブル）", () => {
      const original = createEmptyCustomQuestCollection();
      const json = createExportedJson();
      const result = importCustomQuestFromJson(original, json, 2000);

      expect(result._tag).toBe("Ok");
      expect(original.quests.size).toBe(0);
    });
  });

  describe("複合シナリオ", () => {
    it("追加→更新→削除の一連の操作", () => {
      const empty = createEmptyCustomQuestCollection();

      // 追加
      const r1 = addCustomQuest(empty, sampleParams, 1000);
      expect(r1.ok).toBe(true);
      if (!r1.ok) return;
      expect(r1.value.collection.quests.size).toBe(1);

      // 更新
      const r2 = updateCustomQuest(r1.value.collection, r1.value.questId, {
        ...sampleParams,
        title: "更新タイトル",
      });
      expect(r2.ok).toBe(true);
      if (!r2.ok) return;

      const updated = findCustomQuestById(
        r2.value.collection,
        r1.value.questId,
      );
      expect(updated?.title).toBe("更新タイトル");
      expect(updated?.version).toBe(2);

      // 削除
      const final = removeCustomQuest(r2.value.collection, r1.value.questId);
      expect(final.quests.size).toBe(0);
    });

    it("ビルトイン複製→編集→マージ", () => {
      const empty = createEmptyCustomQuestCollection();

      // 複製
      const r1 = duplicateAsCustomQuest(empty, sampleBuiltinQuest, 1000);
      expect(r1.ok).toBe(true);
      if (!r1.ok) return;

      // 編集
      const r2 = updateCustomQuest(r1.value.collection, r1.value.questId, {
        ...sampleParams,
        title: "カスタム版: 恒等関数",
        difficulty: 3,
      });
      expect(r2.ok).toBe(true);
      if (!r2.ok) return;

      // マージ
      const merged = mergeWithBuiltinQuests(
        [sampleBuiltinQuest],
        r2.value.collection,
      );
      expect(merged).toHaveLength(2);

      const customInMerged = merged.find((q) => q.id === r1.value.questId);
      expect(customInMerged?.title).toBe("カスタム版: 恒等関数");
      expect(customInMerged?.difficulty).toBe(3);
    });

    it("シリアライズ→デシリアライズ後も操作可能", () => {
      // 作成
      const r1 = addCustomQuest(
        createEmptyCustomQuestCollection(),
        sampleParams,
        1000,
      );
      expect(r1.ok).toBe(true);
      if (!r1.ok) return;

      // シリアライズ→デシリアライズ
      const serialized = serializeCustomQuestCollection(r1.value.collection);
      const json = JSON.parse(JSON.stringify(serialized)) as unknown;
      const restored = deserializeCustomQuestCollection(json);

      // デシリアライズ後のコレクションに追加
      const r2 = addCustomQuest(
        restored,
        { ...sampleParams, title: "追加クエスト" },
        2000,
      );
      expect(r2.ok).toBe(true);
      if (!r2.ok) return;

      expect(r2.value.collection.quests.size).toBe(2);
    });
  });
});
