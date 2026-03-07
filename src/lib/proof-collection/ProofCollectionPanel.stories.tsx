import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, within, userEvent } from "storybook/test";
import { ProofCollectionPanel } from "./ProofCollectionPanel";
import type { ProofEntry } from "./proofCollectionState";
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

const meta: Meta<typeof ProofCollectionPanel> = {
  title: "ProofCollection/ProofCollectionPanel",
  component: ProofCollectionPanel,
  args: {
    messages: defaultProofMessages,
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
