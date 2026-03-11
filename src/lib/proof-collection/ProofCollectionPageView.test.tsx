import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProofCollectionPageView } from "./ProofCollectionPageView";
import type { CollectionMessages } from "./ProofCollectionPageView";
import type { ProofEntry, ProofFolder } from "./proofCollectionState";

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

const testMessages: CollectionMessages = {
  collectionEmpty: "No saved proofs yet.",
  collectionEntryCount: "{count} proofs",
  collectionDelete: "Delete",
  collectionMemoPlaceholder: "Add a memo…",
  collectionCreateFolder: "+ New Folder",
  collectionFolderNamePlaceholder: "Folder name",
  collectionFolderDelete: "Delete Folder",
  collectionFolderRename: "Rename",
  collectionMoveToFolder: "Move to…",
  collectionMoveToRoot: "(Root)",
  collectionRootEntries: "Uncategorized",
  collectionFolderEntryCount: "{count}",
};

const defaultCallbacks = {
  onRenameEntry: vi.fn(),
  onUpdateMemo: vi.fn(),
  onRemoveEntry: vi.fn(),
};

describe("ProofCollectionPageView", () => {
  describe("空状態", () => {
    it("エントリがない場合は空メッセージを表示", () => {
      render(
        <ProofCollectionPageView
          entries={[]}
          folders={[]}
          messages={testMessages}
          {...defaultCallbacks}
          testId="page"
        />,
      );
      expect(screen.getByText(testMessages.collectionEmpty)).toBeDefined();
    });

    it("空状態のdata-testidが設定される", () => {
      render(
        <ProofCollectionPageView
          entries={[]}
          folders={[]}
          messages={testMessages}
          {...defaultCallbacks}
          testId="page"
        />,
      );
      expect(screen.getByTestId("page-empty")).toBeDefined();
    });
  });

  describe("エントリ表示", () => {
    it("エントリ名を表示する", () => {
      const entries = [createTestEntry({ id: "e1", name: "My Proof" })];
      render(
        <ProofCollectionPageView
          entries={entries}
          folders={[]}
          messages={testMessages}
          {...defaultCallbacks}
          testId="page"
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
        <ProofCollectionPageView
          entries={entries}
          folders={[]}
          messages={testMessages}
          {...defaultCallbacks}
          testId="page"
        />,
      );
      expect(screen.getByText("Proof A")).toBeDefined();
      expect(screen.getByText("Proof B")).toBeDefined();
    });

    it("エントリ数が表示される", () => {
      const entries = [
        createTestEntry({ id: "e1", name: "Proof A" }),
        createTestEntry({ id: "e2", name: "Proof B" }),
      ];
      render(
        <ProofCollectionPageView
          entries={entries}
          folders={[]}
          messages={testMessages}
          {...defaultCallbacks}
          testId="page"
        />,
      );
      expect(screen.getByText("2 proofs")).toBeDefined();
    });

    it("deductionStyleバッジを表示する", () => {
      const entries = [
        createTestEntry({ id: "e1", deductionStyle: "hilbert" }),
      ];
      render(
        <ProofCollectionPageView
          entries={entries}
          folders={[]}
          messages={testMessages}
          {...defaultCallbacks}
          testId="page"
        />,
      );
      expect(screen.getByText("hilbert")).toBeDefined();
    });
  });

  describe("名前編集", () => {
    it("名前クリックで編集モードに入り、Enter確定でonRenameEntryが呼ばれる", () => {
      const onRename = vi.fn();
      const entries = [createTestEntry({ id: "e1", name: "Old Name" })];
      render(
        <ProofCollectionPageView
          entries={entries}
          folders={[]}
          messages={testMessages}
          onRenameEntry={onRename}
          onUpdateMemo={vi.fn()}
          onRemoveEntry={vi.fn()}
          testId="page"
        />,
      );
      fireEvent.click(screen.getByTestId("page-entry-e1-name"));
      const input = screen.getByTestId("page-entry-e1-name");
      expect(input.tagName).toBe("INPUT");
      fireEvent.change(input, { target: { value: "New Name" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onRename).toHaveBeenCalledWith("e1", "New Name");
    });

    it("空の名前では確定しない", () => {
      const onRename = vi.fn();
      const entries = [createTestEntry({ id: "e1", name: "Old Name" })];
      render(
        <ProofCollectionPageView
          entries={entries}
          folders={[]}
          messages={testMessages}
          onRenameEntry={onRename}
          onUpdateMemo={vi.fn()}
          onRemoveEntry={vi.fn()}
          testId="page"
        />,
      );
      fireEvent.click(screen.getByTestId("page-entry-e1-name"));
      const input = screen.getByTestId("page-entry-e1-name");
      fireEvent.change(input, { target: { value: "   " } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onRename).not.toHaveBeenCalled();
    });
  });

  describe("メモ編集", () => {
    it("メモクリックで編集モードに入り、blur確定でonUpdateMemoが呼ばれる", () => {
      const onUpdateMemo = vi.fn();
      const entries = [createTestEntry({ id: "e1", memo: "" })];
      render(
        <ProofCollectionPageView
          entries={entries}
          folders={[]}
          messages={testMessages}
          onRenameEntry={vi.fn()}
          onUpdateMemo={onUpdateMemo}
          onRemoveEntry={vi.fn()}
          testId="page"
        />,
      );
      fireEvent.click(screen.getByTestId("page-entry-e1-memo"));
      const input = screen.getByTestId("page-entry-e1-memo");
      fireEvent.change(input, { target: { value: "My note" } });
      fireEvent.blur(input);
      expect(onUpdateMemo).toHaveBeenCalledWith("e1", "My note");
    });
  });

  describe("削除", () => {
    it("削除ボタンでonRemoveEntryが呼ばれる", () => {
      const onRemove = vi.fn();
      const entries = [createTestEntry({ id: "e1" })];
      render(
        <ProofCollectionPageView
          entries={entries}
          folders={[]}
          messages={testMessages}
          onRenameEntry={vi.fn()}
          onUpdateMemo={vi.fn()}
          onRemoveEntry={onRemove}
          testId="page"
        />,
      );
      fireEvent.click(screen.getByTestId("page-entry-e1-delete"));
      expect(onRemove).toHaveBeenCalledWith("e1");
    });
  });

  describe("フォルダ管理", () => {
    it("フォルダ作成ボタンを表示する", () => {
      render(
        <ProofCollectionPageView
          entries={[]}
          folders={[]}
          messages={testMessages}
          {...defaultCallbacks}
          onCreateFolder={vi.fn()}
          testId="page"
        />,
      );
      expect(screen.getByTestId("page-create-folder")).toBeDefined();
    });

    it("フォルダ作成ボタンクリックで入力フィールドが表示される", () => {
      render(
        <ProofCollectionPageView
          entries={[]}
          folders={[]}
          messages={testMessages}
          {...defaultCallbacks}
          onCreateFolder={vi.fn()}
          testId="page"
        />,
      );
      fireEvent.click(screen.getByTestId("page-create-folder"));
      expect(screen.getByTestId("page-create-folder-input")).toBeDefined();
    });

    it("フォルダ作成入力でEnter確定するとonCreateFolderが呼ばれる", () => {
      const onCreateFolder = vi.fn();
      render(
        <ProofCollectionPageView
          entries={[]}
          folders={[]}
          messages={testMessages}
          {...defaultCallbacks}
          onCreateFolder={onCreateFolder}
          testId="page"
        />,
      );
      fireEvent.click(screen.getByTestId("page-create-folder"));
      const input = screen.getByTestId("page-create-folder-input");
      fireEvent.change(input, { target: { value: "New Folder" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onCreateFolder).toHaveBeenCalledWith("New Folder");
    });

    it("フォルダヘッダーを表示する", () => {
      const folders = [createTestFolder({ id: "f1", name: "My Folder" })];
      const entries = [
        createTestEntry({ id: "e1", folderId: "f1", name: "In Folder" }),
      ];
      render(
        <ProofCollectionPageView
          entries={entries}
          folders={folders}
          messages={testMessages}
          {...defaultCallbacks}
          testId="page"
        />,
      );
      expect(screen.getByText("My Folder")).toBeDefined();
    });

    it("フォルダ展開/折りたたみが機能する", () => {
      const folders = [createTestFolder({ id: "f1", name: "My Folder" })];
      const entries = [
        createTestEntry({ id: "e1", folderId: "f1", name: "In Folder" }),
      ];
      render(
        <ProofCollectionPageView
          entries={entries}
          folders={folders}
          messages={testMessages}
          {...defaultCallbacks}
          testId="page"
        />,
      );
      // Initially collapsed
      expect(screen.queryByText("In Folder")).toBeNull();
      // Expand
      fireEvent.click(screen.getByTestId("page-folder-f1-toggle"));
      expect(screen.getByText("In Folder")).toBeDefined();
      // Collapse
      fireEvent.click(screen.getByTestId("page-folder-f1-toggle"));
      expect(screen.queryByText("In Folder")).toBeNull();
    });

    it("フォルダ名前変更ボタンで編集モードに入る", () => {
      const onRenameFolder = vi.fn();
      const folders = [createTestFolder({ id: "f1", name: "My Folder" })];
      render(
        <ProofCollectionPageView
          entries={[]}
          folders={folders}
          messages={testMessages}
          {...defaultCallbacks}
          onRenameFolder={onRenameFolder}
          testId="page"
        />,
      );
      fireEvent.click(screen.getByTestId("page-folder-f1-rename"));
      const input = screen.getByTestId("page-folder-f1-name-input");
      expect(input).toBeDefined();
      fireEvent.change(input, { target: { value: "Renamed" } });
      fireEvent.blur(input);
      expect(onRenameFolder).toHaveBeenCalledWith("f1", "Renamed");
    });

    it("フォルダ削除ボタンでonRemoveFolderが呼ばれる", () => {
      const onRemoveFolder = vi.fn();
      const folders = [createTestFolder({ id: "f1", name: "My Folder" })];
      render(
        <ProofCollectionPageView
          entries={[]}
          folders={folders}
          messages={testMessages}
          {...defaultCallbacks}
          onRemoveFolder={onRemoveFolder}
          testId="page"
        />,
      );
      fireEvent.click(screen.getByTestId("page-folder-f1-delete"));
      expect(onRemoveFolder).toHaveBeenCalledWith("f1");
    });

    it("ルートエントリとフォルダエントリが分離表示される", () => {
      const folders = [createTestFolder({ id: "f1", name: "Folder" })];
      const entries = [
        createTestEntry({ id: "e1", folderId: "f1", name: "In Folder" }),
        createTestEntry({ id: "e2", folderId: undefined, name: "Root Entry" }),
      ];
      render(
        <ProofCollectionPageView
          entries={entries}
          folders={folders}
          messages={testMessages}
          {...defaultCallbacks}
          testId="page"
        />,
      );
      // Root section label should appear
      expect(screen.getByTestId("page-root-section")).toBeDefined();
      expect(screen.getByText("Root Entry")).toBeDefined();
    });
  });

  describe("移動", () => {
    it("フォルダがある場合、移動セレクトが表示される", () => {
      const onMoveEntry = vi.fn();
      const folders = [createTestFolder({ id: "f1", name: "Folder" })];
      const entries = [createTestEntry({ id: "e1", folderId: undefined })];
      render(
        <ProofCollectionPageView
          entries={entries}
          folders={folders}
          messages={testMessages}
          {...defaultCallbacks}
          onMoveEntry={onMoveEntry}
          testId="page"
        />,
      );
      // Expand folder first, then check root entry move selector
      const select = screen.getByTestId("page-entry-e1-move");
      expect(select).toBeDefined();
    });

    it("移動セレクト変更でonMoveEntryが呼ばれる", () => {
      const onMoveEntry = vi.fn();
      const folders = [createTestFolder({ id: "f1", name: "Folder" })];
      const entries = [createTestEntry({ id: "e1", folderId: undefined })];
      render(
        <ProofCollectionPageView
          entries={entries}
          folders={folders}
          messages={testMessages}
          {...defaultCallbacks}
          onMoveEntry={onMoveEntry}
          testId="page"
        />,
      );
      const select = screen.getByTestId("page-entry-e1-move");
      fireEvent.change(select, { target: { value: "f1" } });
      expect(onMoveEntry).toHaveBeenCalledWith("e1", "f1");
    });
  });

  describe("Escapeキーでキャンセル", () => {
    it("名前編集中にEscapeで元の値に戻る", () => {
      const onRename = vi.fn();
      const entries = [createTestEntry({ id: "e1", name: "Old Name" })];
      render(
        <ProofCollectionPageView
          entries={entries}
          folders={[]}
          messages={testMessages}
          onRenameEntry={onRename}
          onUpdateMemo={vi.fn()}
          onRemoveEntry={vi.fn()}
          testId="page"
        />,
      );
      fireEvent.click(screen.getByTestId("page-entry-e1-name"));
      const input = screen.getByTestId("page-entry-e1-name");
      fireEvent.change(input, { target: { value: "New Name" } });
      fireEvent.keyDown(input, { key: "Escape" });
      expect(onRename).not.toHaveBeenCalled();
      // Display mode should be restored
      expect(screen.getByText("Old Name")).toBeDefined();
    });

    it("フォルダ名編集中にblurで空文字の場合はonRenameFolderが呼ばれない", () => {
      const onRenameFolder = vi.fn();
      const folders = [createTestFolder({ id: "f1", name: "My Folder" })];
      render(
        <ProofCollectionPageView
          entries={[]}
          folders={folders}
          messages={testMessages}
          {...defaultCallbacks}
          onRenameFolder={onRenameFolder}
          testId="page"
        />,
      );
      fireEvent.click(screen.getByTestId("page-folder-f1-rename"));
      const input = screen.getByTestId("page-folder-f1-name-input");
      fireEvent.change(input, { target: { value: "   " } });
      fireEvent.blur(input);
      expect(onRenameFolder).not.toHaveBeenCalled();
    });

    it("フォルダ作成入力でblurするとキャンセルされる", () => {
      const onCreateFolder = vi.fn();
      render(
        <ProofCollectionPageView
          entries={[]}
          folders={[]}
          messages={testMessages}
          {...defaultCallbacks}
          onCreateFolder={onCreateFolder}
          testId="page"
        />,
      );
      fireEvent.click(screen.getByTestId("page-create-folder"));
      const input = screen.getByTestId("page-create-folder-input");
      fireEvent.change(input, { target: { value: "New" } });
      fireEvent.blur(input);
      // blur cancels folder creation
      expect(onCreateFolder).not.toHaveBeenCalled();
      // Input should be gone
      expect(screen.queryByTestId("page-create-folder-input")).toBeNull();
    });
  });
});
