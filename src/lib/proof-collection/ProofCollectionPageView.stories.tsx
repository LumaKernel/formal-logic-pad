import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, within, userEvent } from "storybook/test";
import { ProofCollectionPageView } from "./ProofCollectionPageView";
import type { ProofEntry, ProofFolder } from "./proofCollectionState";
import { defaultHubMessages } from "../../app/hubMessages";

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

const collectionMessages = {
  collectionEmpty: defaultHubMessages.collectionEmpty,
  collectionEntryCount: defaultHubMessages.collectionEntryCount,
  collectionDelete: defaultHubMessages.collectionDelete,
  collectionMemoPlaceholder: defaultHubMessages.collectionMemoPlaceholder,
  collectionCreateFolder: defaultHubMessages.collectionCreateFolder,
  collectionFolderNamePlaceholder:
    defaultHubMessages.collectionFolderNamePlaceholder,
  collectionFolderDelete: defaultHubMessages.collectionFolderDelete,
  collectionFolderRename: defaultHubMessages.collectionFolderRename,
  collectionMoveToFolder: defaultHubMessages.collectionMoveToFolder,
  collectionMoveToRoot: defaultHubMessages.collectionMoveToRoot,
  collectionRootEntries: defaultHubMessages.collectionRootEntries,
  collectionFolderEntryCount: defaultHubMessages.collectionFolderEntryCount,
};

const meta: Meta<typeof ProofCollectionPageView> = {
  title: "ProofCollection/ProofCollectionPageView",
  component: ProofCollectionPageView,
  args: {
    messages: collectionMessages,
    folders: [],
    onRenameEntry: fn(),
    onUpdateMemo: fn(),
    onRemoveEntry: fn(),
    testId: "page",
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProofCollectionPageView>;

export const Empty: Story = {
  args: {
    entries: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(defaultHubMessages.collectionEmpty),
    ).toBeInTheDocument();
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
    await userEvent.click(canvas.getByText("Old Name"));
    const input = canvas.getByDisplayValue("Old Name");
    await expect(input).toBeInTheDocument();
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
    await userEvent.click(
      canvas.getByText(defaultHubMessages.collectionMemoPlaceholder),
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
    await userEvent.click(canvas.getByTestId("page-entry-e1-delete"));
    await expect(args.onRemoveEntry).toHaveBeenCalledWith("e1");
  },
};

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
    // Folder headers are displayed
    await expect(canvas.getByTestId("page-folder-f1")).toBeInTheDocument();
    await expect(canvas.getByTestId("page-folder-f2")).toBeInTheDocument();
    // Root entry is displayed
    await expect(canvas.getByText("Uncategorized Proof")).toBeInTheDocument();
    // Folder entries are initially hidden (collapsed)
    await expect(canvas.queryByText("Modus Ponens")).not.toBeInTheDocument();
    // Expand folder to see entries
    await userEvent.click(canvas.getByTestId("page-folder-f1-toggle"));
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
    await userEvent.click(canvas.getByTestId("page-create-folder"));
    const input = canvas.getByTestId("page-create-folder-input");
    await expect(input).toBeInTheDocument();
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
    const select = canvas.getByTestId("page-entry-e1-move");
    await expect(select).toBeInTheDocument();
    await userEvent.selectOptions(select, "f1");
    await expect(args.onMoveEntry).toHaveBeenCalledWith("e1", "f1");
  },
};
