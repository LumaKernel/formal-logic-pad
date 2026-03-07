import { describe, it, expect } from "vitest";
import {
  createInitialPanelState,
  startEditing,
  updateEditingValue,
  cancelEditing,
  isEditing,
  toggleFolderExpanded,
  isFolderExpanded,
  startFolderEditing,
  updateFolderEditingValue,
  cancelFolderEditing,
  isFolderEditing,
  startCreatingFolder,
  updateCreatingFolderValue,
  cancelCreatingFolder,
  getCompatibilityBadge,
} from "./proofCollectionPanelLogic";
import type { CompatibilityResult } from "./proofCollectionCompatibility";

describe("proofCollectionPanelLogic", () => {
  describe("createInitialPanelState", () => {
    it("初期状態は編集なし", () => {
      const state = createInitialPanelState();
      expect(state.editing).toBeUndefined();
      expect(state.expandedFolderIds.size).toBe(0);
      expect(state.folderEditing).toBeUndefined();
      expect(state.creatingFolder).toBeUndefined();
    });
  });

  describe("startEditing", () => {
    it("名前編集を開始できる", () => {
      const state = createInitialPanelState();
      const next = startEditing(state, "entry-1", "name", "Old Name");
      expect(next.editing).toEqual({
        entryId: "entry-1",
        field: "name",
        value: "Old Name",
      });
    });

    it("メモ編集を開始できる", () => {
      const state = createInitialPanelState();
      const next = startEditing(state, "entry-2", "memo", "Some memo");
      expect(next.editing).toEqual({
        entryId: "entry-2",
        field: "memo",
        value: "Some memo",
      });
    });

    it("既存の編集を上書きできる", () => {
      let state = createInitialPanelState();
      state = startEditing(state, "entry-1", "name", "Name");
      state = startEditing(state, "entry-2", "memo", "Memo");
      expect(state.editing?.entryId).toBe("entry-2");
      expect(state.editing?.field).toBe("memo");
    });

    it("エントリ編集開始でフォルダ編集とフォルダ作成がキャンセルされる", () => {
      let state = createInitialPanelState();
      state = startFolderEditing(state, "folder-1", "Folder Name");
      state = startEditing(state, "entry-1", "name", "Name");
      expect(state.editing).toBeDefined();
      expect(state.folderEditing).toBeUndefined();
      expect(state.creatingFolder).toBeUndefined();
    });
  });

  describe("updateEditingValue", () => {
    it("編集中の値を更新できる", () => {
      let state = createInitialPanelState();
      state = startEditing(state, "entry-1", "name", "Old");
      state = updateEditingValue(state, "New");
      expect(state.editing?.value).toBe("New");
    });

    it("編集中でなければ何も変わらない", () => {
      const state = createInitialPanelState();
      const next = updateEditingValue(state, "value");
      expect(next).toBe(state);
    });
  });

  describe("cancelEditing", () => {
    it("編集を取り消せる", () => {
      let state = createInitialPanelState();
      state = startEditing(state, "entry-1", "name", "Name");
      state = cancelEditing(state);
      expect(state.editing).toBeUndefined();
    });
  });

  describe("isEditing", () => {
    it("特定のエントリ・フィールドが編集中か判定できる", () => {
      let state = createInitialPanelState();
      state = startEditing(state, "entry-1", "name", "Name");
      expect(isEditing(state, "entry-1", "name")).toBe(true);
      expect(isEditing(state, "entry-1", "memo")).toBe(false);
      expect(isEditing(state, "entry-2", "name")).toBe(false);
    });

    it("編集中でなければfalse", () => {
      const state = createInitialPanelState();
      expect(isEditing(state, "entry-1", "name")).toBe(false);
    });
  });

  describe("toggleFolderExpanded", () => {
    it("フォルダを展開できる", () => {
      const state = createInitialPanelState();
      const next = toggleFolderExpanded(state, "folder-1");
      expect(isFolderExpanded(next, "folder-1")).toBe(true);
    });

    it("展開済みフォルダを折りたためる", () => {
      let state = createInitialPanelState();
      state = toggleFolderExpanded(state, "folder-1");
      state = toggleFolderExpanded(state, "folder-1");
      expect(isFolderExpanded(state, "folder-1")).toBe(false);
    });

    it("複数フォルダを独立に展開できる", () => {
      let state = createInitialPanelState();
      state = toggleFolderExpanded(state, "folder-1");
      state = toggleFolderExpanded(state, "folder-2");
      expect(isFolderExpanded(state, "folder-1")).toBe(true);
      expect(isFolderExpanded(state, "folder-2")).toBe(true);
    });
  });

  describe("isFolderExpanded", () => {
    it("未展開フォルダはfalse", () => {
      const state = createInitialPanelState();
      expect(isFolderExpanded(state, "folder-1")).toBe(false);
    });
  });

  describe("startFolderEditing", () => {
    it("フォルダ名編集を開始できる", () => {
      const state = createInitialPanelState();
      const next = startFolderEditing(state, "folder-1", "My Folder");
      expect(next.folderEditing).toEqual({
        folderId: "folder-1",
        value: "My Folder",
      });
    });

    it("フォルダ編集開始でエントリ編集とフォルダ作成がキャンセルされる", () => {
      let state = createInitialPanelState();
      state = startEditing(state, "entry-1", "name", "Name");
      state = startFolderEditing(state, "folder-1", "Folder");
      expect(state.folderEditing).toBeDefined();
      expect(state.editing).toBeUndefined();
      expect(state.creatingFolder).toBeUndefined();
    });
  });

  describe("updateFolderEditingValue", () => {
    it("フォルダ編集中の値を更新できる", () => {
      let state = createInitialPanelState();
      state = startFolderEditing(state, "folder-1", "Old");
      state = updateFolderEditingValue(state, "New");
      expect(state.folderEditing?.value).toBe("New");
    });

    it("フォルダ編集中でなければ何も変わらない", () => {
      const state = createInitialPanelState();
      const next = updateFolderEditingValue(state, "value");
      expect(next).toBe(state);
    });
  });

  describe("cancelFolderEditing", () => {
    it("フォルダ編集を取り消せる", () => {
      let state = createInitialPanelState();
      state = startFolderEditing(state, "folder-1", "Folder");
      state = cancelFolderEditing(state);
      expect(state.folderEditing).toBeUndefined();
    });
  });

  describe("isFolderEditing", () => {
    it("特定のフォルダが編集中か判定できる", () => {
      let state = createInitialPanelState();
      state = startFolderEditing(state, "folder-1", "Folder");
      expect(isFolderEditing(state, "folder-1")).toBe(true);
      expect(isFolderEditing(state, "folder-2")).toBe(false);
    });

    it("フォルダ編集中でなければfalse", () => {
      const state = createInitialPanelState();
      expect(isFolderEditing(state, "folder-1")).toBe(false);
    });
  });

  describe("startCreatingFolder", () => {
    it("フォルダ作成モードに入れる", () => {
      const state = createInitialPanelState();
      const next = startCreatingFolder(state);
      expect(next.creatingFolder).toBe("");
    });

    it("フォルダ作成開始でエントリ編集とフォルダ編集がキャンセルされる", () => {
      let state = createInitialPanelState();
      state = startEditing(state, "entry-1", "name", "Name");
      state = startCreatingFolder(state);
      expect(state.creatingFolder).toBe("");
      expect(state.editing).toBeUndefined();
      expect(state.folderEditing).toBeUndefined();
    });
  });

  describe("updateCreatingFolderValue", () => {
    it("フォルダ作成中の値を更新できる", () => {
      let state = createInitialPanelState();
      state = startCreatingFolder(state);
      state = updateCreatingFolderValue(state, "New Folder");
      expect(state.creatingFolder).toBe("New Folder");
    });

    it("フォルダ作成中でなければ何も変わらない", () => {
      const state = createInitialPanelState();
      const next = updateCreatingFolderValue(state, "value");
      expect(next).toBe(state);
    });
  });

  describe("cancelCreatingFolder", () => {
    it("フォルダ作成を取り消せる", () => {
      let state = createInitialPanelState();
      state = startCreatingFolder(state);
      state = cancelCreatingFolder(state);
      expect(state.creatingFolder).toBeUndefined();
    });
  });

  describe("getCompatibilityBadge", () => {
    it("FullyCompatibleでvariant=okを返す", () => {
      const result: CompatibilityResult = { _tag: "FullyCompatible" };
      const badge = getCompatibilityBadge(result);
      expect(badge.variant).toBe("ok");
    });

    it("CompatibleWithAxiomWarningsでvariant=axiom-warningを返す", () => {
      const result: CompatibilityResult = {
        _tag: "CompatibleWithAxiomWarnings",
        missingAxiomIds: ["A1", "A2"],
      };
      const badge = getCompatibilityBadge(result);
      expect(badge.variant).toBe("axiom-warning");
      if (badge.variant === "axiom-warning") {
        expect(badge.missingAxiomIds).toEqual(["A1", "A2"]);
      }
    });

    it("IncompatibleStyleでvariant=style-mismatchを返す", () => {
      const result: CompatibilityResult = {
        _tag: "IncompatibleStyle",
        sourceStyle: "hilbert",
        targetStyle: "natural-deduction",
      };
      const badge = getCompatibilityBadge(result);
      expect(badge.variant).toBe("style-mismatch");
      if (badge.variant === "style-mismatch") {
        expect(badge.sourceStyle).toBe("hilbert");
        expect(badge.targetStyle).toBe("natural-deduction");
      }
    });
  });
});
