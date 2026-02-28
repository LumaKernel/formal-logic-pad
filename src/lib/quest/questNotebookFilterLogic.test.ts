import { describe, it, expect } from "vitest";
import {
  computeQuestNotebookCounts,
  getNotebookCountForQuest,
  notebookCountText,
} from "./questNotebookFilterLogic";
import {
  createEmptyCollection,
  createNotebook,
  createQuestNotebook,
} from "../notebook/notebookState";
import { lukasiewiczSystem } from "../logic-core/inferenceRule";

// --- computeQuestNotebookCounts ---

describe("computeQuestNotebookCounts", () => {
  it("空のコレクションでは空のMapを返す", () => {
    const collection = createEmptyCollection();
    const counts = computeQuestNotebookCounts(collection);
    expect(counts.size).toBe(0);
  });

  it("自由帳のみの場合は空のMapを返す", () => {
    let collection = createEmptyCollection();
    collection = createNotebook(collection, {
      name: "Free 1",
      system: lukasiewiczSystem,
      now: 1000,
    });
    collection = createNotebook(collection, {
      name: "Free 2",
      system: lukasiewiczSystem,
      now: 2000,
    });
    const counts = computeQuestNotebookCounts(collection);
    expect(counts.size).toBe(0);
  });

  it("クエストノートブック1冊をカウントする", () => {
    let collection = createEmptyCollection();
    collection = createQuestNotebook(collection, {
      name: "Quest 1",
      system: lukasiewiczSystem,
      goals: [{ formulaText: "phi -> phi", position: { x: 0, y: 0 } }],
      now: 1000,
      questId: "q-01",
    });
    const counts = computeQuestNotebookCounts(collection);
    expect(counts.get("q-01")).toBe(1);
  });

  it("同じクエストの複数ノートブックを正しくカウントする", () => {
    let collection = createEmptyCollection();
    collection = createQuestNotebook(collection, {
      name: "Quest 1a",
      system: lukasiewiczSystem,
      goals: [{ formulaText: "phi -> phi", position: { x: 0, y: 0 } }],
      now: 1000,
      questId: "q-01",
    });
    collection = createQuestNotebook(collection, {
      name: "Quest 1b",
      system: lukasiewiczSystem,
      goals: [{ formulaText: "phi -> phi", position: { x: 0, y: 0 } }],
      now: 2000,
      questId: "q-01",
    });
    const counts = computeQuestNotebookCounts(collection);
    expect(counts.get("q-01")).toBe(2);
  });

  it("異なるクエストを個別にカウントする", () => {
    let collection = createEmptyCollection();
    collection = createQuestNotebook(collection, {
      name: "Quest A",
      system: lukasiewiczSystem,
      goals: [{ formulaText: "phi -> phi", position: { x: 0, y: 0 } }],
      now: 1000,
      questId: "q-01",
    });
    collection = createQuestNotebook(collection, {
      name: "Quest B",
      system: lukasiewiczSystem,
      goals: [{ formulaText: "phi -> phi", position: { x: 0, y: 0 } }],
      now: 2000,
      questId: "q-02",
    });
    collection = createQuestNotebook(collection, {
      name: "Quest A2",
      system: lukasiewiczSystem,
      goals: [{ formulaText: "phi -> phi", position: { x: 0, y: 0 } }],
      now: 3000,
      questId: "q-01",
    });
    const counts = computeQuestNotebookCounts(collection);
    expect(counts.get("q-01")).toBe(2);
    expect(counts.get("q-02")).toBe(1);
  });

  it("自由帳とクエストノートの混在で正しくカウントする", () => {
    let collection = createEmptyCollection();
    collection = createNotebook(collection, {
      name: "Free",
      system: lukasiewiczSystem,
      now: 500,
    });
    collection = createQuestNotebook(collection, {
      name: "Quest",
      system: lukasiewiczSystem,
      goals: [{ formulaText: "phi -> phi", position: { x: 0, y: 0 } }],
      now: 1000,
      questId: "q-01",
    });
    const counts = computeQuestNotebookCounts(collection);
    expect(counts.size).toBe(1);
    expect(counts.get("q-01")).toBe(1);
  });
});

// --- getNotebookCountForQuest ---

describe("getNotebookCountForQuest", () => {
  it("存在するクエストIDのカウントを返す", () => {
    const counts = new Map([
      ["q-01", 3],
      ["q-02", 1],
    ]);
    expect(getNotebookCountForQuest(counts, "q-01")).toBe(3);
    expect(getNotebookCountForQuest(counts, "q-02")).toBe(1);
  });

  it("存在しないクエストIDでは0を返す", () => {
    const counts = new Map([["q-01", 3]]);
    expect(getNotebookCountForQuest(counts, "q-99")).toBe(0);
  });

  it("空のMapでは0を返す", () => {
    const counts = new Map<string, number>();
    expect(getNotebookCountForQuest(counts, "q-01")).toBe(0);
  });
});

// --- notebookCountText ---

describe("notebookCountText", () => {
  it("0の場合は空文字列を返す", () => {
    expect(notebookCountText(0)).toBe("");
  });

  it("1の場合は「1冊」を返す", () => {
    expect(notebookCountText(1)).toBe("1冊");
  });

  it("複数の場合は「N冊」を返す", () => {
    expect(notebookCountText(5)).toBe("5冊");
  });
});
