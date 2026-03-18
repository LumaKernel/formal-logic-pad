import { describe, it, expect } from "vitest";
import {
  initialFileExplorerState,
  startRename,
  updateRenameValue,
  cancelRename,
  confirmRename,
  startDeleteConfirm,
  cancelDeleteConfirm,
  computeFileExplorerItems,
  formatSavedAt,
} from "./scriptFileExplorerLogic";
import type { SavedScript } from "./savedScriptsLogic";

const script1: SavedScript = {
  id: "s1",
  title: "Script A",
  code: "console.log(1)",
  savedAt: 1000,
};
const script2: SavedScript = {
  id: "s2",
  title: "Script B",
  code: "console.log(2)",
  savedAt: 2000,
};
const script3: SavedScript = {
  id: "s3",
  title: "Script C",
  code: "console.log(3)",
  savedAt: 1500,
};

describe("FileExplorerState", () => {
  describe("startRename", () => {
    it("sets renamingId and renameValue", () => {
      const state = startRename(initialFileExplorerState, "s1", "Script A");
      expect(state.renamingId).toBe("s1");
      expect(state.renameValue).toBe("Script A");
    });

    it("cancels delete confirm when starting rename", () => {
      const withDelete = startDeleteConfirm(initialFileExplorerState, "s2");
      const state = startRename(withDelete, "s1", "Script A");
      expect(state.confirmDeleteId).toBeNull();
    });
  });

  describe("updateRenameValue", () => {
    it("updates the rename input value", () => {
      const renaming = startRename(initialFileExplorerState, "s1", "Script A");
      const state = updateRenameValue(renaming, "New Name");
      expect(state.renameValue).toBe("New Name");
    });
  });

  describe("cancelRename", () => {
    it("clears renamingId and renameValue", () => {
      const renaming = startRename(initialFileExplorerState, "s1", "Script A");
      const state = cancelRename(renaming);
      expect(state.renamingId).toBeNull();
      expect(state.renameValue).toBe("");
    });
  });

  describe("confirmRename", () => {
    it("returns newTitle when value differs from current", () => {
      const renaming = startRename(initialFileExplorerState, "s1", "Script A");
      const updated = updateRenameValue(renaming, "New Name");
      const { state, newTitle } = confirmRename(updated, "Script A");
      expect(newTitle).toBe("New Name");
      expect(state.renamingId).toBeNull();
    });

    it("returns null and cancels when value is same as current", () => {
      const renaming = startRename(initialFileExplorerState, "s1", "Script A");
      const { state, newTitle } = confirmRename(renaming, "Script A");
      expect(newTitle).toBeNull();
      expect(state.renamingId).toBeNull();
    });

    it("returns null and cancels when value is empty", () => {
      const renaming = startRename(initialFileExplorerState, "s1", "Script A");
      const updated = updateRenameValue(renaming, "   ");
      const { state, newTitle } = confirmRename(updated, "Script A");
      expect(newTitle).toBeNull();
      expect(state.renamingId).toBeNull();
    });

    it("trims whitespace from newTitle", () => {
      const renaming = startRename(initialFileExplorerState, "s1", "Script A");
      const updated = updateRenameValue(renaming, "  New Name  ");
      const { newTitle } = confirmRename(updated, "Script A");
      expect(newTitle).toBe("New Name");
    });
  });

  describe("startDeleteConfirm", () => {
    it("sets confirmDeleteId", () => {
      const state = startDeleteConfirm(initialFileExplorerState, "s2");
      expect(state.confirmDeleteId).toBe("s2");
    });

    it("cancels rename when starting delete confirm", () => {
      const renaming = startRename(initialFileExplorerState, "s1", "Script A");
      const state = startDeleteConfirm(renaming, "s2");
      expect(state.renamingId).toBeNull();
      expect(state.renameValue).toBe("");
    });
  });

  describe("cancelDeleteConfirm", () => {
    it("clears confirmDeleteId", () => {
      const withDelete = startDeleteConfirm(initialFileExplorerState, "s2");
      const state = cancelDeleteConfirm(withDelete);
      expect(state.confirmDeleteId).toBeNull();
    });
  });
});

describe("computeFileExplorerItems", () => {
  it("sorts by savedAt descending (newest first)", () => {
    const items = computeFileExplorerItems(
      [script1, script2, script3],
      initialFileExplorerState,
    );
    expect(items.map((i) => i.id)).toEqual(["s2", "s3", "s1"]);
  });

  it("marks renaming item correctly", () => {
    const renaming = startRename(initialFileExplorerState, "s1", "Script A");
    const items = computeFileExplorerItems([script1, script2], renaming);
    const s1 = items.find((i) => i.id === "s1");
    const s2 = items.find((i) => i.id === "s2");
    expect(s1?.isRenaming).toBe(true);
    expect(s2?.isRenaming).toBe(false);
  });

  it("marks confirming delete item correctly", () => {
    const deleting = startDeleteConfirm(initialFileExplorerState, "s2");
    const items = computeFileExplorerItems([script1, script2], deleting);
    const s1 = items.find((i) => i.id === "s1");
    const s2 = items.find((i) => i.id === "s2");
    expect(s1?.isConfirmingDelete).toBe(false);
    expect(s2?.isConfirmingDelete).toBe(true);
  });

  it("returns empty array for empty scripts", () => {
    expect(computeFileExplorerItems([], initialFileExplorerState)).toEqual([]);
  });
});

describe("formatSavedAt", () => {
  it("formats timestamp to readable date", () => {
    // Use a known UTC timestamp and check the output format pattern
    const ts = 1000; // 1970-01-01 00:00:01 UTC (locale-dependent)
    const result = formatSavedAt(ts);
    // Just verify format is YYYY/MM/DD HH:MM
    expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
  });

  it("returns different results for different timestamps", () => {
    const r1 = formatSavedAt(1_000_000_000_000); // 2001-09-09
    const r2 = formatSavedAt(1_700_000_000_000); // 2023-11-14
    expect(r1).not.toBe(r2);
    expect(r1).toMatch(/^2001\//);
    expect(r2).toMatch(/^2023\//);
  });
});
