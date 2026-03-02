import { describe, it, expect } from "vitest";
import {
  startQuestAndCreateNotebook,
  getQuestIdForNotebook,
  getNotebookIdsForQuest,
} from "./questNotebookIntegration";
import {
  createEmptyCollection,
  createNotebook,
  createQuestNotebook,
  findNotebook,
} from "../notebook/notebookState";
import type { QuestDefinition, SystemPresetId } from "./questDefinition";
import { lukasiewiczSystem } from "../logic-core/inferenceRule";
import { lkSystem } from "../logic-core/deductionSystem";

// --- テスト用クエスト定義 ---

const testQuest: QuestDefinition = {
  id: "test-quest-01",
  category: "propositional-basics",
  title: "恒等律",
  description: "φ → φ を証明する",
  difficulty: 1,
  systemPresetId: "lukasiewicz",
  goals: [{ formulaText: "phi -> phi" }],
  hints: ["A1とA2を使う"],
  estimatedSteps: 5,
  learningPoint: "基本的なMP適用",
  order: 1,
  version: 1,
};

const testQuest2: QuestDefinition = {
  ...testQuest,
  id: "test-quest-02",
  title: "推移律",
  goals: [
    {
      formulaText: "(phi -> psi) -> (psi -> chi) -> (phi -> chi)",
    },
  ],
};

const testQuests: readonly QuestDefinition[] = [testQuest, testQuest2];

describe("startQuestAndCreateNotebook", () => {
  it("クエストIDからノートブックを作成する", () => {
    const collection = createEmptyCollection();
    const result = startQuestAndCreateNotebook(
      testQuests,
      "test-quest-01",
      collection,
      1000,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.notebookId).toBe("notebook-1");
    expect(result.questId).toBe("test-quest-01");
    expect(result.collection.notebooks).toHaveLength(1);
  });

  it("作成されたノートブックがクエストモードである", () => {
    const collection = createEmptyCollection();
    const result = startQuestAndCreateNotebook(
      testQuests,
      "test-quest-01",
      collection,
      1000,
    );

    if (!result.ok) return;
    const nb = findNotebook(result.collection, result.notebookId);
    expect(nb).toBeDefined();
    expect(nb?.workspace.mode).toBe("quest");
  });

  it("ノートブックにクエストIDが紐付けられる", () => {
    const collection = createEmptyCollection();
    const result = startQuestAndCreateNotebook(
      testQuests,
      "test-quest-01",
      collection,
      1000,
    );

    if (!result.ok) return;
    const nb = findNotebook(result.collection, result.notebookId);
    expect(nb?.questId).toBe("test-quest-01");
  });

  it("ノートブック名がクエストタイトルと一致する", () => {
    const collection = createEmptyCollection();
    const result = startQuestAndCreateNotebook(
      testQuests,
      "test-quest-01",
      collection,
      1000,
    );

    if (!result.ok) return;
    const nb = findNotebook(result.collection, result.notebookId);
    expect(nb?.meta.name).toBe("恒等律");
  });

  it("ゴールがworkspace.goalsに作成される", () => {
    const collection = createEmptyCollection();
    const result = startQuestAndCreateNotebook(
      testQuests,
      "test-quest-01",
      collection,
      1000,
    );

    if (!result.ok) return;
    const nb = findNotebook(result.collection, result.notebookId);
    expect(nb?.workspace.goals).toHaveLength(1);
  });

  it("既存のコレクションに追加できる", () => {
    let collection = createEmptyCollection();
    collection = createNotebook(collection, {
      name: "既存ノート",
      system: lukasiewiczSystem,
      now: 500,
    });

    const result = startQuestAndCreateNotebook(
      testQuests,
      "test-quest-01",
      collection,
      1000,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.collection.notebooks).toHaveLength(2);
    expect(result.notebookId).toBe("notebook-2");
  });

  it("同じクエストで複数のノートブックを作成できる", () => {
    const collection = createEmptyCollection();
    const first = startQuestAndCreateNotebook(
      testQuests,
      "test-quest-01",
      collection,
      1000,
    );
    if (!first.ok) return;

    const second = startQuestAndCreateNotebook(
      testQuests,
      "test-quest-01",
      first.collection,
      2000,
    );
    if (!second.ok) return;

    expect(second.collection.notebooks).toHaveLength(2);
    expect(second.notebookId).toBe("notebook-2");
    // 両方とも同じクエストIDを持つ
    expect(findNotebook(second.collection, "notebook-1")?.questId).toBe(
      "test-quest-01",
    );
    expect(findNotebook(second.collection, "notebook-2")?.questId).toBe(
      "test-quest-01",
    );
  });

  it("シーケント計算クエストのノートブックを作成できる", () => {
    const scQuest: QuestDefinition = {
      ...testQuest,
      id: "sc-quest-01",
      title: "カットの基本",
      systemPresetId: "sc-lk",
      goals: [{ formulaText: "phi ⇒ phi" }],
    };
    const collection = createEmptyCollection();
    const result = startQuestAndCreateNotebook(
      [scQuest],
      "sc-quest-01",
      collection,
      1000,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const nb = findNotebook(result.collection, result.notebookId);
    expect(nb).toBeDefined();
    expect(nb?.workspace.mode).toBe("quest");
    expect(nb?.workspace.deductionSystem.style).toBe("sequent-calculus");
    expect(nb?.workspace.deductionSystem.system).toBe(lkSystem);
  });

  it("存在しないクエストIDでquest-not-foundエラー", () => {
    const collection = createEmptyCollection();
    const result = startQuestAndCreateNotebook(
      testQuests,
      "nonexistent",
      collection,
      1000,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("quest-not-found");
  });

  it("不正なプリセットIDのクエストでpreset-not-foundエラー", () => {
    const invalidQuests: readonly QuestDefinition[] = [
      {
        ...testQuest,
        systemPresetId: "invalid" as SystemPresetId,
      },
    ];
    const collection = createEmptyCollection();
    const result = startQuestAndCreateNotebook(
      invalidQuests,
      "test-quest-01",
      collection,
      1000,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("preset-not-found");
  });

  it("エラー時にコレクションは変更されない", () => {
    const collection = createEmptyCollection();
    const result = startQuestAndCreateNotebook(
      testQuests,
      "nonexistent",
      collection,
      1000,
    );

    // エラー時はcollectionプロパティがないことを確認
    expect(result.ok).toBe(false);
    // 元のコレクションは不変
    expect(collection.notebooks).toHaveLength(0);
  });

  it("時刻がメタデータに正しく設定される", () => {
    const collection = createEmptyCollection();
    const result = startQuestAndCreateNotebook(
      testQuests,
      "test-quest-01",
      collection,
      12345,
    );

    if (!result.ok) return;
    const nb = findNotebook(result.collection, result.notebookId);
    expect(nb?.meta.createdAt).toBe(12345);
    expect(nb?.meta.updatedAt).toBe(12345);
  });

  it("ノートブックにクエストのバージョンが記録される", () => {
    const collection = createEmptyCollection();
    const result = startQuestAndCreateNotebook(
      testQuests,
      "test-quest-01",
      collection,
      1000,
    );

    if (!result.ok) return;
    const nb = findNotebook(result.collection, result.notebookId);
    expect(nb?.questVersion).toBe(1);
  });

  it("バージョンが異なるクエストで正しいバージョンが記録される", () => {
    const questsWithVersions: readonly QuestDefinition[] = [
      { ...testQuest, version: 3 },
      { ...testQuest2, version: 5 },
    ];
    const collection = createEmptyCollection();
    const result = startQuestAndCreateNotebook(
      questsWithVersions,
      "test-quest-02",
      collection,
      1000,
    );

    if (!result.ok) return;
    const nb = findNotebook(result.collection, result.notebookId);
    expect(nb?.questVersion).toBe(5);
  });
});

describe("getQuestIdForNotebook", () => {
  it("クエストノートブックのクエストIDを返す", () => {
    const collection = createQuestNotebook(createEmptyCollection(), {
      name: "Quest Note",
      system: lukasiewiczSystem,
      goals: [{ formulaText: "phi -> phi" }],
      now: 1000,
      questId: "q-01",
    });

    expect(getQuestIdForNotebook(collection, "notebook-1")).toBe("q-01");
  });

  it("自由帳ノートブックではundefinedを返す", () => {
    const collection = createNotebook(createEmptyCollection(), {
      name: "Free Note",
      system: lukasiewiczSystem,
      now: 1000,
    });

    expect(getQuestIdForNotebook(collection, "notebook-1")).toBeUndefined();
  });

  it("存在しないノートブックIDではundefinedを返す", () => {
    const collection = createEmptyCollection();
    expect(getQuestIdForNotebook(collection, "notebook-999")).toBeUndefined();
  });
});

describe("getNotebookIdsForQuest", () => {
  it("特定クエストに紐付けられたノートブックIDを返す", () => {
    let collection = createEmptyCollection();
    collection = createQuestNotebook(collection, {
      name: "Quest 1",
      system: lukasiewiczSystem,
      goals: [{ formulaText: "phi -> phi" }],
      now: 1000,
      questId: "q-01",
    });
    collection = createQuestNotebook(collection, {
      name: "Quest 2",
      system: lukasiewiczSystem,
      goals: [{ formulaText: "phi -> phi" }],
      now: 2000,
      questId: "q-02",
    });
    collection = createQuestNotebook(collection, {
      name: "Quest 1 again",
      system: lukasiewiczSystem,
      goals: [{ formulaText: "phi -> phi" }],
      now: 3000,
      questId: "q-01",
    });

    const ids = getNotebookIdsForQuest(collection, "q-01");
    expect(ids).toEqual(["notebook-1", "notebook-3"]);
  });

  it("紐付けのないクエストIDでは空配列を返す", () => {
    const collection = createEmptyCollection();
    expect(getNotebookIdsForQuest(collection, "q-99")).toEqual([]);
  });

  it("自由帳ノートブックは含まれない", () => {
    let collection = createEmptyCollection();
    collection = createNotebook(collection, {
      name: "Free",
      system: lukasiewiczSystem,
      now: 1000,
    });
    collection = createQuestNotebook(collection, {
      name: "Quest",
      system: lukasiewiczSystem,
      goals: [{ formulaText: "phi -> phi" }],
      now: 2000,
      questId: "q-01",
    });

    const ids = getNotebookIdsForQuest(collection, "q-01");
    expect(ids).toEqual(["notebook-2"]);
  });
});
