import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { useHistory } from "./useHistory";

interface DemoState {
  readonly items: readonly string[];
}

function UndoRedoDemoComponent() {
  const history = useHistory<DemoState>({ items: [] });

  const addItem = () => {
    const nextNumber = String(history.state.items.length + 1);
    const newItem = `Item ${nextNumber satisfies string}`;
    history.push({ items: [...history.state.items, newItem] });
  };

  const removeLastItem = () => {
    if (history.state.items.length === 0) return;
    history.push({ items: history.state.items.slice(0, -1) });
  };

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "var(--font-ui)",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Undo/Redo Demo</h2>

      <div
        style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}
      >
        <button data-testid="add-btn" onClick={addItem} type="button">
          Add Item
        </button>
        <button
          data-testid="remove-btn"
          onClick={removeLastItem}
          disabled={history.state.items.length === 0}
          type="button"
        >
          Remove Last
        </button>
        <button
          data-testid="undo-btn"
          onClick={history.undo}
          disabled={!history.canUndo}
          type="button"
        >
          Undo ({String(history.undoCount) satisfies string})
        </button>
        <button
          data-testid="redo-btn"
          onClick={history.redo}
          disabled={!history.canRedo}
          type="button"
        >
          Redo ({String(history.redoCount) satisfies string})
        </button>
        <button data-testid="clear-btn" onClick={history.clear} type="button">
          Clear History
        </button>
      </div>

      <div
        data-testid="item-count"
        style={{
          marginBottom: 12,
          fontSize: 14,
          color: "#666",
        }}
      >
        {String(history.state.items.length) satisfies string} items | Undo:{" "}
        {String(history.undoCount) satisfies string} | Redo:{" "}
        {String(history.redoCount) satisfies string}
      </div>

      <ul data-testid="item-list" style={{ listStyle: "none", padding: 0 }}>
        {history.state.items.map((item, i) => (
          <li
            key={String(i) satisfies string}
            style={{
              padding: "8px 12px",
              marginBottom: 4,
              background: "#f0f4ff",
              borderRadius: 4,
              fontSize: 14,
            }}
          >
            {item}
          </li>
        ))}
        {history.state.items.length === 0 && (
          <li
            style={{
              padding: "8px 12px",
              color: "#666",
              fontStyle: "italic",
              fontSize: 14,
            }}
          >
            No items yet. Click &quot;Add Item&quot; to start.
          </li>
        )}
      </ul>
    </div>
  );
}

const meta = {
  title: "History/UndoRedoDemo",
  component: UndoRedoDemoComponent,
} satisfies Meta<typeof UndoRedoDemoComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initial state
    const addBtn = canvas.getByTestId("add-btn");
    const undoBtn = canvas.getByTestId("undo-btn");
    const redoBtn = canvas.getByTestId("redo-btn");

    await expect(undoBtn).toBeDisabled();
    await expect(redoBtn).toBeDisabled();

    // Add items
    await userEvent.click(addBtn);
    await userEvent.click(addBtn);
    await userEvent.click(addBtn);

    await expect(canvas.getByTestId("item-count")).toHaveTextContent("3 items");
    await expect(undoBtn).not.toBeDisabled();

    // Undo
    await userEvent.click(undoBtn);
    await expect(canvas.getByTestId("item-count")).toHaveTextContent("2 items");
    await expect(redoBtn).not.toBeDisabled();

    // Redo
    await userEvent.click(redoBtn);
    await expect(canvas.getByTestId("item-count")).toHaveTextContent("3 items");

    // Undo twice, then add new (clears redo)
    await userEvent.click(undoBtn);
    await userEvent.click(undoBtn);
    await expect(canvas.getByTestId("item-count")).toHaveTextContent("1 items");

    await userEvent.click(addBtn);
    await expect(redoBtn).toBeDisabled();
  },
};
