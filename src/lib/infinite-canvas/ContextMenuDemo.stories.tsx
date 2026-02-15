import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { useState } from "react";
import { CanvasItem } from "./CanvasItem";
import type { ContextMenuItem } from "./contextMenu";
import { InfiniteCanvas } from "./InfiniteCanvas";
import type { Point, ViewportState } from "./types";

interface ItemData {
  readonly id: string;
  readonly position: Point;
  readonly label: string;
  readonly color: string;
  readonly menuItems: readonly ContextMenuItem[];
}

const INITIAL_ITEMS: readonly ItemData[] = [
  {
    id: "a",
    position: { x: 100, y: 100 },
    label: "Node A",
    color: "#4a90d9",
    menuItems: [
      { id: "edit", label: "Edit" },
      { id: "duplicate", label: "Duplicate" },
      { id: "delete", label: "Delete" },
    ],
  },
  {
    id: "b",
    position: { x: 350, y: 100 },
    label: "Node B",
    color: "#d94a4a",
    menuItems: [
      { id: "edit", label: "Edit" },
      { id: "info", label: "Info" },
      { id: "disabled-action", label: "Cannot Delete", disabled: true },
    ],
  },
  {
    id: "c",
    position: { x: 200, y: 280 },
    label: "Node C",
    color: "#4ad94a",
    menuItems: [
      { id: "rename", label: "Rename" },
      { id: "delete", label: "Delete" },
    ],
  },
];

function ContextMenuDemo() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [items, setItems] = useState<readonly ItemData[]>(INITIAL_ITEMS);
  const [lastAction, setLastAction] = useState<string>("");

  const handlePositionChange = (id: string, newPosition: Point) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, position: newPosition } : item,
      ),
    );
  };

  const handleContextMenuSelect = (itemId: string, actionId: string) => {
    setLastAction(`${itemId satisfies string}: ${actionId satisfies string}`);
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <InfiniteCanvas viewport={viewport} onViewportChange={setViewport}>
        {items.map((item) => (
          <CanvasItem
            key={item.id}
            position={item.position}
            viewport={viewport}
            onPositionChange={(pos) => {
              handlePositionChange(item.id, pos);
            }}
            contextMenuItems={item.menuItems}
            onContextMenuSelect={(actionId) => {
              handleContextMenuSelect(item.id, actionId);
            }}
          >
            <div
              data-testid={`item-${item.id satisfies string}`}
              style={{
                padding: "12px 16px",
                background: item.color,
                color: "#fff",
                borderRadius: 8,
                fontFamily: "sans-serif",
                fontSize: 14,
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                whiteSpace: "nowrap",
                userSelect: "none",
              }}
            >
              {item.label}
            </div>
          </CanvasItem>
        ))}
      </InfiniteCanvas>
      <div
        data-testid="last-action"
        style={{
          position: "fixed",
          top: 8,
          left: 8,
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          padding: "4px 8px",
          borderRadius: 4,
          fontSize: 12,
          fontFamily: "monospace",
          pointerEvents: "none",
        }}
      >
        {lastAction !== ""
          ? `Last action: ${lastAction satisfies string}`
          : "Right-click a node to open context menu"}
      </div>
    </div>
  );
}

const meta = {
  title: "InfiniteCanvas/ContextMenu",
  component: ContextMenuDemo,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ContextMenuDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify all items are rendered
    const itemA = canvas.getByTestId("item-a");
    const itemB = canvas.getByTestId("item-b");
    const itemC = canvas.getByTestId("item-c");
    await expect(itemA).toBeInTheDocument();
    await expect(itemB).toBeInTheDocument();
    await expect(itemC).toBeInTheDocument();

    // Right-click to open context menu on Node A
    await userEvent.pointer({
      keys: "[MouseRight]",
      target: itemA,
    });

    // Verify context menu appears
    const contextMenu = canvas.getByTestId("context-menu");
    await expect(contextMenu).toBeInTheDocument();

    // Verify menu items
    const editItem = canvas.getByTestId("context-menu-item-edit");
    await expect(editItem).toBeInTheDocument();
    await expect(editItem).toHaveTextContent("Edit");

    // Click the Edit item
    await userEvent.click(editItem);

    // Menu should close after selection
    await expect(canvas.queryByTestId("context-menu")).not.toBeInTheDocument();

    // Last action should be updated
    const lastAction = canvas.getByTestId("last-action");
    await expect(lastAction).toHaveTextContent("Last action: a: edit");

    // Verify items are still draggable
    const canvasItemA = itemA.closest("[data-testid='canvas-item']");
    await expect(canvasItemA).toHaveStyle({ cursor: "grab" });
  },
};
