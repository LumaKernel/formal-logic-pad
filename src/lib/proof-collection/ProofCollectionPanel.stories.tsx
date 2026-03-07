import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, within, userEvent } from "storybook/test";
import { ProofCollectionPanel } from "./ProofCollectionPanel";
import type { ProofEntry, ProofFolder } from "./proofCollectionState";
import { defaultProofMessages } from "../proof-pad/proofMessages";

function createEntry(overrides: Partial<ProofEntry> = {}): ProofEntry {
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

function createFolder(overrides: Partial<ProofFolder> = {}): ProofFolder {
  return {
    id: "folder-1",
    name: "Test Folder",
    createdAt: 1000,
    ...overrides,
  };
}

const meta: Meta<typeof ProofCollectionPanel> = {
  title: "ProofCollection/ProofCollectionPanel",
  component: ProofCollectionPanel,
  args: {
    messages: defaultProofMessages,
    folders: [],
    onRenameEntry: fn(),
    onUpdateMemo: fn(),
    onRemoveEntry: fn(),
    onClose: fn(),
    testId: "panel",
  },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", width: 400, height: 500 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProofCollectionPanel>;

export const Empty: Story = {
  args: {
    entries: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("No saved proofs yet")).toBeInTheDocument();
    await expect(canvas.getByText("0 proofs")).toBeInTheDocument();
  },
};

export const SingleEntry: Story = {
  args: {
    entries: [createEntry({ id: "e1", name: "Modus Ponens Proof" })],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Modus Ponens Proof")).toBeInTheDocument();
    await expect(canvas.getByText("1 proofs")).toBeInTheDocument();
    await expect(canvas.getByText("hilbert")).toBeInTheDocument();
  },
};

export const MultipleEntries: Story = {
  args: {
    entries: [
      createEntry({
        id: "e1",
        name: "Proof of φ → φ",
        memo: "Identity proof using S and K",
        deductionStyle: "hilbert",
      }),
      createEntry({
        id: "e2",
        name: "Double Negation Elimination",
        memo: "",
        deductionStyle: "natural-deduction",
      }),
      createEntry({
        id: "e3",
        name: "Cut Elimination Example",
        memo: "Uses the Gentzen-style LK system",
        deductionStyle: "sequent-calculus",
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("3 proofs")).toBeInTheDocument();
    await expect(canvas.getByText("Proof of φ → φ")).toBeInTheDocument();
    await expect(
      canvas.getByText("Identity proof using S and K"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByText("Double Negation Elimination"),
    ).toBeInTheDocument();
  },
};

export const RenameEntry: Story = {
  args: {
    entries: [createEntry({ id: "e1", name: "Old Name" })],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // 名前をクリックして編集モードに入る
    await userEvent.click(canvas.getByText("Old Name"));
    // 入力フィールドが表示される
    const input = canvas.getByDisplayValue("Old Name");
    await expect(input).toBeInTheDocument();
    // 新しい名前を入力
    await userEvent.clear(input);
    await userEvent.type(input, "New Name{Enter}");
    await expect(args.onRenameEntry).toHaveBeenCalledWith("e1", "New Name");
  },
};

export const EditMemo: Story = {
  args: {
    entries: [createEntry({ id: "e1", name: "Proof", memo: "" })],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // メモプレースホルダーをクリックして編集モードに入る
    await userEvent.click(
      canvas.getByText(defaultProofMessages.collectionEntryMemoPlaceholder),
    );
    const input = canvas.getByDisplayValue("");
    await userEvent.type(input, "My important note{Enter}");
    await expect(args.onUpdateMemo).toHaveBeenCalledWith(
      "e1",
      "My important note",
    );
  },
};

export const DeleteEntry: Story = {
  args: {
    entries: [createEntry({ id: "e1", name: "Proof to Delete" })],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId("panel-entry-e1-delete"));
    await expect(args.onRemoveEntry).toHaveBeenCalledWith("e1");
  },
};

export const ClosePanel: Story = {
  args: {
    entries: [],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId("panel-close"));
    await expect(args.onClose).toHaveBeenCalledOnce();
  },
};

export const ImportEntry: Story = {
  args: {
    entries: [createEntry({ id: "e1", name: "Importable Proof" })],
    onImportEntry: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // インポートボタンが表示される
    const importButton = canvas.getByTestId("panel-entry-e1-import");
    await expect(importButton).toBeInTheDocument();
    await expect(
      canvas.getByText(defaultProofMessages.collectionEntryImport),
    ).toBeInTheDocument();
    // クリックでonImportEntryが呼ばれる
    await userEvent.click(importButton);
    await expect(args.onImportEntry).toHaveBeenCalled();
  },
};

export const WithoutImport: Story = {
  args: {
    entries: [createEntry({ id: "e1", name: "Non-importable Proof" })],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // onImportEntry未指定時はインポートボタンが表示されない
    await expect(canvas.getByText("Non-importable Proof")).toBeInTheDocument();
    await expect(
      canvas.queryByTestId("panel-entry-e1-import"),
    ).not.toBeInTheDocument();
  },
};

// --- フォルダ関連ストーリー ---

export const WithFolders: Story = {
  args: {
    folders: [
      createFolder({ id: "f1", name: "Logic Proofs" }),
      createFolder({ id: "f2", name: "Set Theory" }),
    ],
    entries: [
      createEntry({
        id: "e1",
        name: "Modus Ponens",
        folderId: "f1",
      }),
      createEntry({
        id: "e2",
        name: "Hypothetical Syllogism",
        folderId: "f1",
      }),
      createEntry({
        id: "e3",
        name: "ZFC Axiom of Choice",
        folderId: "f2",
      }),
      createEntry({
        id: "e4",
        name: "Uncategorized Proof",
        folderId: undefined,
      }),
    ],
    onCreateFolder: fn(),
    onRemoveFolder: fn(),
    onRenameFolder: fn(),
    onMoveEntry: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // フォルダヘッダーが表示される
    await expect(canvas.getByTestId("panel-folder-f1")).toBeInTheDocument();
    await expect(canvas.getByTestId("panel-folder-f2")).toBeInTheDocument();
    // ルートエントリが表示される
    await expect(canvas.getByText("Uncategorized Proof")).toBeInTheDocument();
    // フォルダ内エントリは最初非表示
    await expect(canvas.queryByText("Modus Ponens")).not.toBeInTheDocument();
    // フォルダを展開するとエントリが表示される
    await userEvent.click(canvas.getByTestId("panel-folder-f1-toggle"));
    await expect(canvas.getByText("Modus Ponens")).toBeInTheDocument();
    await expect(
      canvas.getByText("Hypothetical Syllogism"),
    ).toBeInTheDocument();
  },
};

export const CreateFolder: Story = {
  args: {
    entries: [],
    onCreateFolder: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // フォルダ作成ボタンをクリック
    await userEvent.click(canvas.getByTestId("panel-create-folder"));
    // 入力フィールドが表示される
    const input = canvas.getByTestId("panel-create-folder-input");
    await expect(input).toBeInTheDocument();
    // フォルダ名を入力してEnter
    await userEvent.type(input, "New Folder{Enter}");
    await expect(args.onCreateFolder).toHaveBeenCalledWith("New Folder");
  },
};

export const MoveEntryToFolder: Story = {
  args: {
    folders: [createFolder({ id: "f1", name: "Target Folder" })],
    entries: [
      createEntry({
        id: "e1",
        name: "Movable Proof",
        folderId: undefined,
      }),
    ],
    onMoveEntry: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // 移動セレクトが表示される
    const select = canvas.getByTestId("panel-entry-e1-move");
    await expect(select).toBeInTheDocument();
    // フォルダに移動
    await userEvent.selectOptions(select, "f1");
    await expect(args.onMoveEntry).toHaveBeenCalledWith("e1", "f1");
  },
};
