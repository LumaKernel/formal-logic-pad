import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProofCollectionPanel } from "./ProofCollectionPanel";
import type { ProofEntry, ProofFolder } from "./proofCollectionState";
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

function createTestFolder(overrides: Partial<ProofFolder> = {}): ProofFolder {
  return {
    id: "folder-1",
    name: "Test Folder",
    createdAt: 1000,
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
          folders={[]}
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
          folders={[]}
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
          folders={[]}
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
          folders={[]}
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
          folders={[]}
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
          folders={[]}
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
          folders={[]}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          onRenameEntry={onRenameEntry}
          testId="panel"
        />,
      );
      fireEvent.click(screen.getByText("Old Name"));
      const input = screen.getByDisplayValue("Old Name");
      expect(input).toBeDefined();
      fireEvent.change(input, { target: { value: "New Name" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onRenameEntry).toHaveBeenCalledWith("e1", "New Name");
    });

    it("空の名前では確定しない", () => {
      const onRenameEntry = vi.fn();
      const entries = [createTestEntry({ id: "e1", name: "Name" })];
      render(
        <ProofCollectionPanel
          entries={entries}
          folders={[]}
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
          folders={[]}
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
          folders={[]}
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
          folders={[]}
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
          folders={[]}
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
          folders={[]}
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
          folders={[]}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          testId="panel"
        />,
      );
      expect(screen.getByText("2 proofs")).toBeDefined();
    });
  });

  describe("インポート", () => {
    it("onImportEntry指定時にインポートボタンを表示する", () => {
      const entries = [createTestEntry({ id: "e1" })];
      render(
        <ProofCollectionPanel
          entries={entries}
          folders={[]}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          onImportEntry={vi.fn()}
          testId="panel"
        />,
      );
      expect(screen.getByTestId("panel-entry-e1-import")).toBeDefined();
      expect(
        screen.getByText(defaultProofMessages.collectionEntryImport),
      ).toBeDefined();
    });

    it("インポートボタンクリックでonImportEntryが呼ばれる", () => {
      const onImportEntry = vi.fn();
      const entry = createTestEntry({ id: "e1", name: "My Proof" });
      render(
        <ProofCollectionPanel
          entries={[entry]}
          folders={[]}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          onImportEntry={onImportEntry}
          testId="panel"
        />,
      );
      fireEvent.click(screen.getByTestId("panel-entry-e1-import"));
      expect(onImportEntry).toHaveBeenCalledWith(entry);
    });

    it("onImportEntry未指定時にはインポートボタンを表示しない", () => {
      const entries = [createTestEntry({ id: "e1" })];
      render(
        <ProofCollectionPanel
          entries={entries}
          folders={[]}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          testId="panel"
        />,
      );
      expect(screen.queryByTestId("panel-entry-e1-import")).toBeNull();
    });
  });

  describe("フォルダ表示", () => {
    it("フォルダがある場合はフォルダヘッダーを表示する", () => {
      const folders = [createTestFolder({ id: "f1", name: "My Folder" })];
      render(
        <ProofCollectionPanel
          entries={[]}
          folders={folders}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          testId="panel"
        />,
      );
      expect(screen.getByText("My Folder")).toBeDefined();
      expect(screen.getByTestId("panel-folder-f1")).toBeDefined();
    });

    it("フォルダ展開でフォルダ内エントリが表示される", () => {
      const folders = [createTestFolder({ id: "f1", name: "My Folder" })];
      const entries = [
        createTestEntry({
          id: "e1",
          name: "Proof in Folder",
          folderId: "f1",
        }),
      ];
      render(
        <ProofCollectionPanel
          entries={entries}
          folders={folders}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          testId="panel"
        />,
      );
      // 最初は折りたたまれている
      expect(screen.queryByText("Proof in Folder")).toBeNull();
      // フォルダをクリックして展開
      fireEvent.click(screen.getByTestId("panel-folder-f1-toggle"));
      expect(screen.getByText("Proof in Folder")).toBeDefined();
    });

    it("フォルダ内エントリ数を表示する", () => {
      const folders = [createTestFolder({ id: "f1", name: "My Folder" })];
      const entries = [
        createTestEntry({ id: "e1", folderId: "f1" }),
        createTestEntry({ id: "e2", folderId: "f1" }),
      ];
      render(
        <ProofCollectionPanel
          entries={entries}
          folders={folders}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          testId="panel"
        />,
      );
      expect(screen.getByText("2")).toBeDefined();
    });

    it("ルートエントリはフォルダ外に表示される", () => {
      const folders = [createTestFolder({ id: "f1", name: "My Folder" })];
      const entries = [
        createTestEntry({ id: "e1", name: "Root Proof", folderId: undefined }),
        createTestEntry({
          id: "e2",
          name: "Folder Proof",
          folderId: "f1",
        }),
      ];
      render(
        <ProofCollectionPanel
          entries={entries}
          folders={folders}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          testId="panel"
        />,
      );
      expect(screen.getByText("Root Proof")).toBeDefined();
      expect(screen.getByTestId("panel-root-section")).toBeDefined();
    });
  });

  describe("フォルダ作成", () => {
    it("onCreateFolder指定時にフォルダ作成ボタンを表示する", () => {
      render(
        <ProofCollectionPanel
          entries={[]}
          folders={[]}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          onCreateFolder={vi.fn()}
          testId="panel"
        />,
      );
      expect(screen.getByTestId("panel-create-folder")).toBeDefined();
    });

    it("フォルダ作成ボタンクリックで入力フォームが表示される", () => {
      render(
        <ProofCollectionPanel
          entries={[]}
          folders={[]}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          onCreateFolder={vi.fn()}
          testId="panel"
        />,
      );
      fireEvent.click(screen.getByTestId("panel-create-folder"));
      expect(screen.getByTestId("panel-create-folder-input")).toBeDefined();
    });

    it("フォルダ名入力してEnterでonCreateFolderが呼ばれる", () => {
      const onCreateFolder = vi.fn();
      render(
        <ProofCollectionPanel
          entries={[]}
          folders={[]}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          onCreateFolder={onCreateFolder}
          testId="panel"
        />,
      );
      fireEvent.click(screen.getByTestId("panel-create-folder"));
      const input = screen.getByTestId("panel-create-folder-input");
      fireEvent.change(input, { target: { value: "New Folder" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onCreateFolder).toHaveBeenCalledWith("New Folder");
    });
  });

  describe("フォルダ削除", () => {
    it("onRemoveFolder指定時にフォルダ削除ボタンを表示する", () => {
      const folders = [createTestFolder({ id: "f1", name: "My Folder" })];
      render(
        <ProofCollectionPanel
          entries={[]}
          folders={folders}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          onRemoveFolder={vi.fn()}
          testId="panel"
        />,
      );
      expect(screen.getByTestId("panel-folder-f1-delete")).toBeDefined();
    });

    it("フォルダ削除ボタンクリックでonRemoveFolderが呼ばれる", () => {
      const onRemoveFolder = vi.fn();
      const folders = [createTestFolder({ id: "f1", name: "My Folder" })];
      render(
        <ProofCollectionPanel
          entries={[]}
          folders={folders}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          onRemoveFolder={onRemoveFolder}
          testId="panel"
        />,
      );
      fireEvent.click(screen.getByTestId("panel-folder-f1-delete"));
      expect(onRemoveFolder).toHaveBeenCalledWith("f1");
    });
  });

  describe("フォルダ名変更", () => {
    it("フォルダ名変更ボタンクリックで編集モードに入る", () => {
      const folders = [createTestFolder({ id: "f1", name: "My Folder" })];
      render(
        <ProofCollectionPanel
          entries={[]}
          folders={folders}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          onRenameFolder={vi.fn()}
          testId="panel"
        />,
      );
      fireEvent.click(screen.getByTestId("panel-folder-f1-rename"));
      expect(screen.getByTestId("panel-folder-f1-name-input")).toBeDefined();
    });

    it("フォルダ名編集してEnterでonRenameFolderが呼ばれる", () => {
      const onRenameFolder = vi.fn();
      const folders = [createTestFolder({ id: "f1", name: "My Folder" })];
      render(
        <ProofCollectionPanel
          entries={[]}
          folders={folders}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          onRenameFolder={onRenameFolder}
          testId="panel"
        />,
      );
      fireEvent.click(screen.getByTestId("panel-folder-f1-rename"));
      const input = screen.getByTestId("panel-folder-f1-name-input");
      fireEvent.change(input, { target: { value: "Renamed Folder" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onRenameFolder).toHaveBeenCalledWith("f1", "Renamed Folder");
    });
  });

  describe("エントリ移動", () => {
    it("onMoveEntry指定時にフォルダ選択UIを表示する", () => {
      const folders = [createTestFolder({ id: "f1", name: "My Folder" })];
      const entries = [createTestEntry({ id: "e1" })];
      render(
        <ProofCollectionPanel
          entries={entries}
          folders={folders}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          onMoveEntry={vi.fn()}
          testId="panel"
        />,
      );
      expect(screen.getByTestId("panel-entry-e1-move")).toBeDefined();
    });

    it("フォルダ選択変更でonMoveEntryが呼ばれる", () => {
      const onMoveEntry = vi.fn();
      const folders = [createTestFolder({ id: "f1", name: "My Folder" })];
      const entries = [createTestEntry({ id: "e1" })];
      render(
        <ProofCollectionPanel
          entries={entries}
          folders={folders}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          onMoveEntry={onMoveEntry}
          testId="panel"
        />,
      );
      fireEvent.change(screen.getByTestId("panel-entry-e1-move"), {
        target: { value: "f1" },
      });
      expect(onMoveEntry).toHaveBeenCalledWith("e1", "f1");
    });

    it("ルートに戻すとonMoveEntryがundefinedで呼ばれる", () => {
      const onMoveEntry = vi.fn();
      const folders = [createTestFolder({ id: "f1", name: "My Folder" })];
      const entries = [createTestEntry({ id: "e1", folderId: "f1" })];
      render(
        <ProofCollectionPanel
          entries={entries}
          folders={folders}
          messages={defaultProofMessages}
          {...defaultCallbacks}
          onMoveEntry={onMoveEntry}
          testId="panel"
        />,
      );
      fireEvent.click(screen.getByTestId("panel-folder-f1-toggle"));
      fireEvent.change(screen.getByTestId("panel-entry-e1-move"), {
        target: { value: "" },
      });
      expect(onMoveEntry).toHaveBeenCalledWith("e1", undefined);
    });
  });
});
