import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProofCollectionPanel } from "./ProofCollectionPanel";
import type { ProofEntry } from "./proofCollectionState";
import { defaultProofMessages } from "../proof-pad/proofMessages";

function createTestEntry(overrides: Partial<ProofEntry> = {}): ProofEntry {
  return {
    id: "entry-1",
    name: "Test Proof",
    memo: "",
    folderId: undefined,
    createdAt: 1000,
    updatedAt: 2000,
    nodes: [],
    connections: [],
    inferenceEdges: [],
    deductionStyle: "hilbert",
    usedAxiomIds: ["A1"],
    ...overrides,
  };
}

const defaultCallbacks = {
  onRenameEntry: vi.fn(),
  onUpdateMemo: vi.fn(),
  onRemoveEntry: vi.fn(),
  onClose: vi.fn(),
};

describe("ProofCollectionPanel", () => {
  describe("空状態", () => {
    it("エントリがない場合は空メッセージを表示", () => {
      render(
        <ProofCollectionPanel
          entries={[]}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          testId="panel"
        />,
      );
      expect(
        screen.getByText(defaultProofMessages.collectionEmpty),
      ).toBeDefined();
    });
  });

  describe("エントリ表示", () => {
    it("エントリ名を表示する", () => {
      const entries = [createTestEntry({ id: "e1", name: "My Proof" })];
      render(
        <ProofCollectionPanel
          entries={entries}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          testId="panel"
        />,
      );
      expect(screen.getByText("My Proof")).toBeDefined();
    });

    it("複数エントリを表示する", () => {
      const entries = [
        createTestEntry({ id: "e1", name: "Proof A" }),
        createTestEntry({ id: "e2", name: "Proof B" }),
      ];
      render(
        <ProofCollectionPanel
          entries={entries}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          testId="panel"
        />,
      );
      expect(screen.getByText("Proof A")).toBeDefined();
      expect(screen.getByText("Proof B")).toBeDefined();
    });

    it("メモがある場合はメモを表示する", () => {
      const entries = [
        createTestEntry({ id: "e1", name: "Proof", memo: "Important note" }),
      ];
      render(
        <ProofCollectionPanel
          entries={entries}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          testId="panel"
        />,
      );
      expect(screen.getByText("Important note")).toBeDefined();
    });

    it("メモが空の場合はプレースホルダーを表示する", () => {
      const entries = [createTestEntry({ id: "e1", memo: "" })];
      render(
        <ProofCollectionPanel
          entries={entries}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          testId="panel"
        />,
      );
      expect(
        screen.getByText(defaultProofMessages.collectionEntryMemoPlaceholder),
      ).toBeDefined();
    });

    it("deductionStyleバッジを表示する", () => {
      const entries = [createTestEntry({ id: "e1" })];
      render(
        <ProofCollectionPanel
          entries={entries}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          testId="panel"
        />,
      );
      expect(screen.getByText("hilbert")).toBeDefined();
    });
  });

  describe("名前編集", () => {
    it("名前クリックで編集モードに入り、Enter確定でonRenameEntry呼び出し", () => {
      const onRenameEntry = vi.fn();
      const entries = [createTestEntry({ id: "e1", name: "Old Name" })];
      render(
        <ProofCollectionPanel
          entries={entries}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          onRenameEntry={onRenameEntry}
          testId="panel"
        />,
      );
      // 名前をクリックして編集開始
      fireEvent.click(screen.getByText("Old Name"));
      // 入力フィールドが表示される
      const input = screen.getByDisplayValue("Old Name");
      expect(input).toBeDefined();
      // 新しい名前を入力
      fireEvent.change(input, { target: { value: "New Name" } });
      // Enter で確定
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onRenameEntry).toHaveBeenCalledWith("e1", "New Name");
    });

    it("空の名前では確定しない", () => {
      const onRenameEntry = vi.fn();
      const entries = [createTestEntry({ id: "e1", name: "Name" })];
      render(
        <ProofCollectionPanel
          entries={entries}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          onRenameEntry={onRenameEntry}
          testId="panel"
        />,
      );
      fireEvent.click(screen.getByText("Name"));
      const input = screen.getByDisplayValue("Name");
      fireEvent.change(input, { target: { value: "  " } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onRenameEntry).not.toHaveBeenCalled();
    });

    it("Escapeでキャンセルできる", () => {
      const onRenameEntry = vi.fn();
      const entries = [createTestEntry({ id: "e1", name: "Name" })];
      render(
        <ProofCollectionPanel
          entries={entries}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          onRenameEntry={onRenameEntry}
          testId="panel"
        />,
      );
      fireEvent.click(screen.getByText("Name"));
      const input = screen.getByDisplayValue("Name");
      fireEvent.change(input, { target: { value: "Changed" } });
      fireEvent.keyDown(input, { key: "Escape" });
      // 元の名前が表示される
      expect(screen.getByText("Name")).toBeDefined();
      expect(onRenameEntry).not.toHaveBeenCalled();
    });
  });

  describe("メモ編集", () => {
    it("メモクリックで編集モードに入り、Enter確定でonUpdateMemo呼び出し", () => {
      const onUpdateMemo = vi.fn();
      const entries = [createTestEntry({ id: "e1", memo: "Old memo" })];
      render(
        <ProofCollectionPanel
          entries={entries}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          onUpdateMemo={onUpdateMemo}
          testId="panel"
        />,
      );
      fireEvent.click(screen.getByText("Old memo"));
      const input = screen.getByDisplayValue("Old memo");
      fireEvent.change(input, { target: { value: "New memo" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onUpdateMemo).toHaveBeenCalledWith("e1", "New memo");
    });

    it("空のメモでも確定できる（メモは空でもOK）", () => {
      const onUpdateMemo = vi.fn();
      const entries = [createTestEntry({ id: "e1", memo: "Some memo" })];
      render(
        <ProofCollectionPanel
          entries={entries}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          onUpdateMemo={onUpdateMemo}
          testId="panel"
        />,
      );
      fireEvent.click(screen.getByText("Some memo"));
      const input = screen.getByDisplayValue("Some memo");
      fireEvent.change(input, { target: { value: "" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onUpdateMemo).toHaveBeenCalledWith("e1", "");
    });
  });

  describe("削除", () => {
    it("削除ボタンクリックでonRemoveEntry呼び出し", () => {
      const onRemoveEntry = vi.fn();
      const entries = [createTestEntry({ id: "e1" })];
      render(
        <ProofCollectionPanel
          entries={entries}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          onRemoveEntry={onRemoveEntry}
          testId="panel"
        />,
      );
      fireEvent.click(screen.getByTestId("panel-entry-e1-delete"));
      expect(onRemoveEntry).toHaveBeenCalledWith("e1");
    });
  });

  describe("閉じる", () => {
    it("×ボタンクリックでonClose呼び出し", () => {
      const onClose = vi.fn();
      render(
        <ProofCollectionPanel
          entries={[]}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          onClose={onClose}
          testId="panel"
        />,
      );
      fireEvent.click(screen.getByTestId("panel-close"));
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe("ヘッダー", () => {
    it("エントリ数を表示する", () => {
      const entries = [
        createTestEntry({ id: "e1" }),
        createTestEntry({ id: "e2" }),
      ];
      render(
        <ProofCollectionPanel
          entries={entries}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          testId="panel"
        />,
      );
      expect(screen.getByText("2 proofs")).toBeDefined();
    });
  });
});
