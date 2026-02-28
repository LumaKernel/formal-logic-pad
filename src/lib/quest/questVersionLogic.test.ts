import { describe, it, expect } from "vitest";
import {
  checkQuestVersion,
  needsVersionWarning,
  getVersionWarningMessage,
} from "./questVersionLogic";
import type { QuestVersionStatus } from "./questVersionLogic";
import type { Notebook } from "../notebook/notebookState";
import type { QuestDefinition } from "./questDefinition";
import { lukasiewiczSystem } from "../logic-core/inferenceRule";
import { createEmptyWorkspace } from "../proof-pad/workspaceState";

// --- テストヘルパー ---

function makeNotebook(overrides: Partial<Notebook> = {}): Notebook {
  return {
    meta: {
      id: "notebook-1",
      name: "Test Notebook",
      createdAt: 1000,
      updatedAt: 1000,
    },
    workspace: {
      ...createEmptyWorkspace(lukasiewiczSystem),
      mode: "quest",
    },
    questId: "q-01",
    questVersion: 1,
    ...overrides,
  };
}

function makeQuest(
  overrides: Partial<QuestDefinition> & {
    readonly id: string;
  },
): QuestDefinition {
  return {
    category: "propositional-basics",
    title: "Test Quest",
    description: "Test",
    difficulty: 1,
    systemPresetId: "lukasiewicz",
    goals: [{ formulaText: "phi -> phi" }],
    hints: [],
    estimatedSteps: 5,
    learningPoint: "test",
    order: 1,
    version: 1,
    ...overrides,
  };
}

const testQuests: readonly QuestDefinition[] = [
  makeQuest({ id: "q-01", version: 2 }),
  makeQuest({ id: "q-02", version: 1 }),
];

// --- checkQuestVersion ---

describe("checkQuestVersion", () => {
  it("自由帳ノートブックはNotQuestを返す", () => {
    const notebook = makeNotebook({
      questId: undefined,
      questVersion: undefined,
    });
    const result = checkQuestVersion(notebook, testQuests);
    expect(result._tag).toBe("NotQuest");
  });

  it("存在しないクエストIDはQuestNotFoundを返す", () => {
    const notebook = makeNotebook({ questId: "nonexistent" });
    const result = checkQuestVersion(notebook, testQuests);
    expect(result._tag).toBe("QuestNotFound");
    if (result._tag === "QuestNotFound") {
      expect(result.questId).toBe("nonexistent");
    }
  });

  it("バージョン情報なしのノートブックはVersionUnknownを返す", () => {
    const notebook = makeNotebook({ questId: "q-01", questVersion: undefined });
    const result = checkQuestVersion(notebook, testQuests);
    expect(result._tag).toBe("VersionUnknown");
    if (result._tag === "VersionUnknown") {
      expect(result.questId).toBe("q-01");
      expect(result.currentVersion).toBe(2);
    }
  });

  it("最新バージョンのノートブックはUpToDateを返す", () => {
    const notebook = makeNotebook({ questId: "q-01", questVersion: 2 });
    const result = checkQuestVersion(notebook, testQuests);
    expect(result._tag).toBe("UpToDate");
    if (result._tag === "UpToDate") {
      expect(result.questId).toBe("q-01");
      expect(result.version).toBe(2);
    }
  });

  it("古いバージョンのノートブックはOutdatedを返す", () => {
    const notebook = makeNotebook({ questId: "q-01", questVersion: 1 });
    const result = checkQuestVersion(notebook, testQuests);
    expect(result._tag).toBe("Outdated");
    if (result._tag === "Outdated") {
      expect(result.questId).toBe("q-01");
      expect(result.notebookVersion).toBe(1);
      expect(result.currentVersion).toBe(2);
    }
  });

  it("バージョンが同じならUpToDate", () => {
    const notebook = makeNotebook({ questId: "q-02", questVersion: 1 });
    const result = checkQuestVersion(notebook, testQuests);
    expect(result._tag).toBe("UpToDate");
  });

  it("空のクエスト配列はQuestNotFoundを返す", () => {
    const notebook = makeNotebook({ questId: "q-01" });
    const result = checkQuestVersion(notebook, []);
    expect(result._tag).toBe("QuestNotFound");
  });
});

// --- needsVersionWarning ---

describe("needsVersionWarning", () => {
  it("NotQuestは警告不要", () => {
    const status: QuestVersionStatus = { _tag: "NotQuest" };
    expect(needsVersionWarning(status)).toBe(false);
  });

  it("QuestNotFoundは警告不要", () => {
    const status: QuestVersionStatus = {
      _tag: "QuestNotFound",
      questId: "q-01",
    };
    expect(needsVersionWarning(status)).toBe(false);
  });

  it("UpToDateは警告不要", () => {
    const status: QuestVersionStatus = {
      _tag: "UpToDate",
      questId: "q-01",
      version: 1,
    };
    expect(needsVersionWarning(status)).toBe(false);
  });

  it("VersionUnknownは警告必要", () => {
    const status: QuestVersionStatus = {
      _tag: "VersionUnknown",
      questId: "q-01",
      currentVersion: 2,
    };
    expect(needsVersionWarning(status)).toBe(true);
  });

  it("Outdatedは警告必要", () => {
    const status: QuestVersionStatus = {
      _tag: "Outdated",
      questId: "q-01",
      notebookVersion: 1,
      currentVersion: 2,
    };
    expect(needsVersionWarning(status)).toBe(true);
  });
});

// --- getVersionWarningMessage ---

describe("getVersionWarningMessage", () => {
  it("NotQuestはundefined", () => {
    const status: QuestVersionStatus = { _tag: "NotQuest" };
    expect(getVersionWarningMessage(status)).toBeUndefined();
  });

  it("QuestNotFoundはundefined", () => {
    const status: QuestVersionStatus = {
      _tag: "QuestNotFound",
      questId: "q-01",
    };
    expect(getVersionWarningMessage(status)).toBeUndefined();
  });

  it("UpToDateはundefined", () => {
    const status: QuestVersionStatus = {
      _tag: "UpToDate",
      questId: "q-01",
      version: 1,
    };
    expect(getVersionWarningMessage(status)).toBeUndefined();
  });

  it("VersionUnknownはバージョン情報なしメッセージ", () => {
    const status: QuestVersionStatus = {
      _tag: "VersionUnknown",
      questId: "q-01",
      currentVersion: 3,
    };
    const msg = getVersionWarningMessage(status);
    expect(msg).toContain("バージョン情報が記録されていません");
    expect(msg).toContain("v3");
  });

  it("Outdatedは古いバージョンメッセージ", () => {
    const status: QuestVersionStatus = {
      _tag: "Outdated",
      questId: "q-01",
      notebookVersion: 1,
      currentVersion: 3,
    };
    const msg = getVersionWarningMessage(status);
    expect(msg).toContain("古いバージョン");
    expect(msg).toContain("v1");
    expect(msg).toContain("v3");
  });
});
