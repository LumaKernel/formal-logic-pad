import { describe, it, expect } from "vitest";
import {
  createInitialPanelState,
  startEditing,
  updateEditingValue,
  cancelEditing,
  isEditing,
} from "./proofCollectionPanelLogic";

describe("proofCollectionPanelLogic", () => {
  describe("createInitialPanelState", () => {
    it("初期状態は編集なし", () => {
      const state = createInitialPanelState();
      expect(state.editing).toBeUndefined();
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
});
