import { describe, expect, it } from "vitest";

import { lukasiewiczSystem } from "../logic-core/inferenceRule";
import {
  createEmptyCollection,
  createNotebook,
  createQuestNotebook,
  findNotebook,
  notebookCount,
  renameNotebook,
  updateNotebookWorkspace,
  removeNotebook,
  duplicateNotebook,
  convertNotebookToFreeMode,
  listNotebooksByUpdatedAt,
  listNotebooksByCreatedAt,
  isQuestNotebook,
  isFreeNotebook,
  type NotebookCollection,
} from "./notebookState";
import { createEmptyWorkspace } from "../proof-pad/workspaceState";

describe("notebookState", () => {
  const system = lukasiewiczSystem;
  const now1 = 1000;
  const now2 = 2000;
  const now3 = 3000;

  describe("createEmptyCollection", () => {
    it("returns an empty collection", () => {
      const col = createEmptyCollection();
      expect(col.notebooks).toEqual([]);
      expect(col.nextId).toBe(1);
    });
  });

  describe("createNotebook", () => {
    it("creates a new notebook with correct metadata", () => {
      const col = createEmptyCollection();
      const result = createNotebook(col, {
        name: "Test Note",
        system,
        now: now1,
      });

      expect(result.notebooks).toHaveLength(1);
      expect(result.nextId).toBe(2);

      const nb = result.notebooks[0]!;
      expect(nb.meta.id).toBe("notebook-1");
      expect(nb.meta.name).toBe("Test Note");
      expect(nb.meta.createdAt).toBe(now1);
      expect(nb.meta.updatedAt).toBe(now1);
      expect(nb.workspace.mode).toBe("free");
      expect(nb.workspace.system).toBe(system);
    });

    it("assigns sequential IDs", () => {
      let col = createEmptyCollection();
      col = createNotebook(col, { name: "First", system, now: now1 });
      col = createNotebook(col, { name: "Second", system, now: now2 });

      expect(col.notebooks).toHaveLength(2);
      expect(col.notebooks[0]!.meta.id).toBe("notebook-1");
      expect(col.notebooks[1]!.meta.id).toBe("notebook-2");
      expect(col.nextId).toBe(3);
    });

    it("creates an empty workspace for the given system", () => {
      const col = createNotebook(createEmptyCollection(), {
        name: "Note",
        system,
        now: now1,
      });

      const nb = col.notebooks[0]!;
      expect(nb.workspace.nodes).toEqual([]);
      expect(nb.workspace.connections).toEqual([]);
    });
  });

  describe("createQuestNotebook", () => {
    it("creates a quest-mode notebook with goal nodes", () => {
      const col = createQuestNotebook(createEmptyCollection(), {
        name: "Quest 1",
        system,
        goals: [{ formulaText: "phi -> phi" }],
        now: now1,
      });

      expect(col.notebooks).toHaveLength(1);
      const nb = col.notebooks[0]!;
      expect(nb.meta.name).toBe("Quest 1");
      expect(nb.workspace.mode).toBe("quest");
      expect(nb.workspace.nodes).toHaveLength(0);
      expect(nb.workspace.goals).toHaveLength(1);
    });

    it("stores questId when provided", () => {
      const col = createQuestNotebook(createEmptyCollection(), {
        name: "Quest 1",
        system,
        goals: [{ formulaText: "phi -> phi" }],
        now: now1,
        questId: "q-01",
      });

      expect(col.notebooks[0]!.questId).toBe("q-01");
    });

    it("questId is undefined when not provided", () => {
      const col = createQuestNotebook(createEmptyCollection(), {
        name: "Quest 1",
        system,
        goals: [{ formulaText: "phi -> phi" }],
        now: now1,
      });

      expect(col.notebooks[0]!.questId).toBeUndefined();
    });

    it("stores questVersion when provided", () => {
      const col = createQuestNotebook(createEmptyCollection(), {
        name: "Quest Versioned",
        system,
        goals: [{ formulaText: "phi -> phi" }],
        now: now1,
        questId: "q-01",
        questVersion: 3,
      });

      expect(col.notebooks[0]!.questVersion).toBe(3);
    });

    it("questVersion is undefined when not provided", () => {
      const col = createQuestNotebook(createEmptyCollection(), {
        name: "Quest No Version",
        system,
        goals: [{ formulaText: "phi -> phi" }],
        now: now1,
        questId: "q-01",
      });

      expect(col.notebooks[0]!.questVersion).toBeUndefined();
    });
  });

  describe("findNotebook", () => {
    it("returns the notebook when found", () => {
      let col = createEmptyCollection();
      col = createNotebook(col, { name: "Target", system, now: now1 });
      col = createNotebook(col, { name: "Other", system, now: now2 });

      const found = findNotebook(col, "notebook-1");
      expect(found).toBeDefined();
      expect(found!.meta.name).toBe("Target");
    });

    it("returns undefined when not found", () => {
      const col = createEmptyCollection();
      expect(findNotebook(col, "notebook-999")).toBeUndefined();
    });
  });

  describe("notebookCount", () => {
    it("returns 0 for empty collection", () => {
      expect(notebookCount(createEmptyCollection())).toBe(0);
    });

    it("returns the number of notebooks", () => {
      let col = createEmptyCollection();
      col = createNotebook(col, { name: "A", system, now: now1 });
      col = createNotebook(col, { name: "B", system, now: now2 });
      expect(notebookCount(col)).toBe(2);
    });
  });

  describe("renameNotebook", () => {
    it("renames the specified notebook", () => {
      let col = createEmptyCollection();
      col = createNotebook(col, { name: "Old Name", system, now: now1 });

      const result = renameNotebook(col, "notebook-1", "New Name", now2);
      const nb = findNotebook(result, "notebook-1");
      expect(nb!.meta.name).toBe("New Name");
      expect(nb!.meta.updatedAt).toBe(now2);
    });

    it("does not affect other notebooks", () => {
      let col = createEmptyCollection();
      col = createNotebook(col, { name: "First", system, now: now1 });
      col = createNotebook(col, { name: "Second", system, now: now2 });

      const result = renameNotebook(col, "notebook-1", "Renamed", now3);
      const other = findNotebook(result, "notebook-2");
      expect(other!.meta.name).toBe("Second");
      expect(other!.meta.updatedAt).toBe(now2);
    });

    it("preserves createdAt", () => {
      let col = createEmptyCollection();
      col = createNotebook(col, { name: "Note", system, now: now1 });

      const result = renameNotebook(col, "notebook-1", "Renamed", now3);
      expect(findNotebook(result, "notebook-1")!.meta.createdAt).toBe(now1);
    });
  });

  describe("updateNotebookWorkspace", () => {
    it("updates the workspace of the specified notebook", () => {
      let col = createEmptyCollection();
      col = createNotebook(col, { name: "Note", system, now: now1 });

      const newWorkspace = createEmptyWorkspace(system);
      const updated = { ...newWorkspace, nextNodeId: 42 };

      const result = updateNotebookWorkspace(col, "notebook-1", updated, now2);
      const nb = findNotebook(result, "notebook-1");
      expect(nb!.workspace.nextNodeId).toBe(42);
      expect(nb!.meta.updatedAt).toBe(now2);
    });

    it("does not affect other notebooks", () => {
      let col = createEmptyCollection();
      col = createNotebook(col, { name: "Target", system, now: now1 });
      col = createNotebook(col, { name: "Other", system, now: now2 });

      const newWorkspace = createEmptyWorkspace(system);
      const updated = { ...newWorkspace, nextNodeId: 99 };

      const result = updateNotebookWorkspace(col, "notebook-1", updated, now3);
      const other = findNotebook(result, "notebook-2");
      expect(other!.workspace.nextNodeId).toBe(1);
      expect(other!.meta.updatedAt).toBe(now2);
    });
  });

  describe("removeNotebook", () => {
    it("removes the specified notebook", () => {
      let col = createEmptyCollection();
      col = createNotebook(col, { name: "A", system, now: now1 });
      col = createNotebook(col, { name: "B", system, now: now2 });

      const result = removeNotebook(col, "notebook-1");
      expect(result.notebooks).toHaveLength(1);
      expect(result.notebooks[0]!.meta.id).toBe("notebook-2");
    });

    it("does not change nextId", () => {
      let col = createEmptyCollection();
      col = createNotebook(col, { name: "A", system, now: now1 });

      const result = removeNotebook(col, "notebook-1");
      expect(result.nextId).toBe(2);
    });

    it("returns unchanged collection when ID not found", () => {
      let col = createEmptyCollection();
      col = createNotebook(col, { name: "A", system, now: now1 });

      const result = removeNotebook(col, "notebook-999");
      expect(result.notebooks).toHaveLength(1);
    });
  });

  describe("duplicateNotebook", () => {
    it("duplicates the notebook with a new ID and name", () => {
      let col = createEmptyCollection();
      col = createNotebook(col, { name: "Original", system, now: now1 });

      const result = duplicateNotebook(col, "notebook-1", now2);
      expect(result.notebooks).toHaveLength(2);
      expect(result.nextId).toBe(3);

      const dup = result.notebooks[1]!;
      expect(dup.meta.id).toBe("notebook-2");
      expect(dup.meta.name).toBe("Original (copy)");
      expect(dup.meta.createdAt).toBe(now2);
      expect(dup.meta.updatedAt).toBe(now2);
    });

    it("copies the workspace state", () => {
      let col = createEmptyCollection();
      col = createNotebook(col, { name: "Source", system, now: now1 });

      // ワークスペースを更新してから複製
      const ws = {
        ...col.notebooks[0]!.workspace,
        nextNodeId: 77,
      };
      col = updateNotebookWorkspace(col, "notebook-1", ws, now2);

      const result = duplicateNotebook(col, "notebook-1", now3);
      const dup = result.notebooks[1]!;
      expect(dup.workspace.nextNodeId).toBe(77);
    });

    it("returns unchanged collection when source not found", () => {
      const col = createEmptyCollection();
      const result = duplicateNotebook(col, "notebook-999", now1);
      expect(result.notebooks).toHaveLength(0);
    });
  });

  describe("convertNotebookToFreeMode", () => {
    it("duplicates a quest notebook as free mode, preserving original", () => {
      const col = createQuestNotebook(createEmptyCollection(), {
        name: "Quest",
        system,
        goals: [{ formulaText: "phi -> phi" }],
        now: now1,
      });

      const result = convertNotebookToFreeMode(col, "notebook-1", now2);
      // 元のクエストノートブックが残っている
      const original = findNotebook(result.collection, "notebook-1");
      expect(original!.workspace.mode).toBe("quest");
      expect(original!.meta.updatedAt).toBe(now1);

      // 新しいノートブックが free mode で追加されている
      expect(result.newNotebookId).toBe("notebook-2");
      const duplicated = findNotebook(result.collection, "notebook-2");
      expect(duplicated!.workspace.mode).toBe("free");
      expect(duplicated!.meta.name).toBe("Quest (自由帳)");
      expect(duplicated!.meta.createdAt).toBe(now2);
      expect(duplicated!.meta.updatedAt).toBe(now2);
      // questId は複製先には含まれない
      expect(duplicated!.questId).toBeUndefined();
      // ゴールは複製先で消去される
      expect(duplicated!.workspace.goals).toHaveLength(0);
      // nextId が更新されている
      expect(result.collection.nextId).toBe(3);
      expect(result.collection.notebooks).toHaveLength(2);
    });

    it("returns unchanged collection for already free notebook", () => {
      let col = createEmptyCollection();
      col = createNotebook(col, { name: "Free", system, now: now1 });

      const result = convertNotebookToFreeMode(col, "notebook-1", now2);
      // freeモードは変換不要なのでそのまま
      expect(result.newNotebookId).toBeUndefined();
      const nb = findNotebook(result.collection, "notebook-1");
      expect(nb!.workspace.mode).toBe("free");
      expect(nb!.meta.updatedAt).toBe(now1);
      expect(result.collection.notebooks).toHaveLength(1);
    });

    it("returns unchanged collection when notebook not found", () => {
      const col = createEmptyCollection();
      const result = convertNotebookToFreeMode(col, "notebook-999", now1);
      expect(result.newNotebookId).toBeUndefined();
      expect(result.collection.notebooks).toHaveLength(0);
    });

    it("converted notebook is recognized as free by type guard", () => {
      const col = createQuestNotebook(createEmptyCollection(), {
        name: "Quest",
        system,
        goals: [{ formulaText: "phi -> phi" }],
        now: now1,
        questId: "prop-01",
      });

      const result = convertNotebookToFreeMode(col, "notebook-1", now2);
      const converted = findNotebook(result.collection, "notebook-2");
      expect(converted).toBeDefined();
      expect(isFreeNotebook(converted!)).toBe(true);
      expect(isQuestNotebook(converted!)).toBe(false);
    });
  });

  describe("isQuestNotebook / isFreeNotebook", () => {
    it("returns true for quest notebook with questId", () => {
      const col = createQuestNotebook(createEmptyCollection(), {
        name: "Quest",
        system,
        goals: [{ formulaText: "phi" }],
        now: now1,
        questId: "prop-01",
      });
      const nb = findNotebook(col, "notebook-1");
      expect(nb).toBeDefined();
      expect(isQuestNotebook(nb!)).toBe(true);
      expect(isFreeNotebook(nb!)).toBe(false);
    });

    it("returns true for free notebook without questId", () => {
      const col = createNotebook(createEmptyCollection(), {
        name: "Free",
        system,
        now: now1,
      });
      const nb = findNotebook(col, "notebook-1");
      expect(nb).toBeDefined();
      expect(isFreeNotebook(nb!)).toBe(true);
      expect(isQuestNotebook(nb!)).toBe(false);
    });

    it("quest notebook without questId is free", () => {
      const col = createQuestNotebook(createEmptyCollection(), {
        name: "Quest without ID",
        system,
        goals: [{ formulaText: "phi" }],
        now: now1,
      });
      const nb = findNotebook(col, "notebook-1");
      expect(nb).toBeDefined();
      // questIdなしで作成されたクエストモードノートブックは、型としてはFreeNotebook
      expect(isFreeNotebook(nb!)).toBe(true);
      expect(nb!.questId).toBeUndefined();
    });
  });

  describe("listNotebooksByUpdatedAt", () => {
    it("returns notebooks sorted by updatedAt descending", () => {
      let col = createEmptyCollection();
      col = createNotebook(col, { name: "Old", system, now: 1000 });
      col = createNotebook(col, { name: "New", system, now: 3000 });
      col = createNotebook(col, { name: "Mid", system, now: 2000 });

      const sorted = listNotebooksByUpdatedAt(col);
      expect(sorted.map((n) => n.meta.name)).toEqual(["New", "Mid", "Old"]);
    });

    it("returns empty array for empty collection", () => {
      expect(listNotebooksByUpdatedAt(createEmptyCollection())).toEqual([]);
    });

    it("reflects name changes in sort order", () => {
      let col = createEmptyCollection();
      col = createNotebook(col, { name: "A", system, now: 1000 });
      col = createNotebook(col, { name: "B", system, now: 2000 });
      // Aの名前を変更するとupdatedAtが更新される
      col = renameNotebook(col, "notebook-1", "A-renamed", 5000);

      const sorted = listNotebooksByUpdatedAt(col);
      expect(sorted[0]!.meta.name).toBe("A-renamed");
    });
  });

  describe("listNotebooksByCreatedAt", () => {
    it("returns notebooks sorted by createdAt descending", () => {
      let col = createEmptyCollection();
      col = createNotebook(col, { name: "First", system, now: 1000 });
      col = createNotebook(col, { name: "Third", system, now: 3000 });
      col = createNotebook(col, { name: "Second", system, now: 2000 });

      const sorted = listNotebooksByCreatedAt(col);
      expect(sorted.map((n) => n.meta.name)).toEqual([
        "Third",
        "Second",
        "First",
      ]);
    });

    it("ignores updatedAt for sort order", () => {
      let col = createEmptyCollection();
      col = createNotebook(col, { name: "Old", system, now: 1000 });
      col = createNotebook(col, { name: "New", system, now: 2000 });
      // Oldを更新してもcreatedAtの順は変わらない
      col = renameNotebook(col, "notebook-1", "Old-renamed", 9999);

      const sorted = listNotebooksByCreatedAt(col);
      expect(sorted[0]!.meta.name).toBe("New");
      expect(sorted[1]!.meta.name).toBe("Old-renamed");
    });
  });

  describe("immutability", () => {
    it("does not mutate the original collection on create", () => {
      const original = createEmptyCollection();
      createNotebook(original, { name: "New", system, now: now1 });
      expect(original.notebooks).toHaveLength(0);
    });

    it("does not mutate the original collection on remove", () => {
      let col: NotebookCollection = createEmptyCollection();
      col = createNotebook(col, { name: "A", system, now: now1 });
      const before = col.notebooks.length;
      removeNotebook(col, "notebook-1");
      expect(col.notebooks.length).toBe(before);
    });

    it("does not mutate the original collection on rename", () => {
      let col: NotebookCollection = createEmptyCollection();
      col = createNotebook(col, { name: "Before", system, now: now1 });
      renameNotebook(col, "notebook-1", "After", now2);
      expect(findNotebook(col, "notebook-1")!.meta.name).toBe("Before");
    });
  });
});
