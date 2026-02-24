import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { useState } from "react";
import { CanvasItem } from "./CanvasItem";
import { Connection } from "./Connection";
import type { ConnectionEndpoint, Obstacle } from "./connectionPath";
import type { ContextMenuItem } from "./contextMenu";
import { InfiniteCanvas } from "./InfiniteCanvas";
import type { Point, ViewportState } from "./types";

interface ItemData {
  readonly id: string;
  readonly position: Point;
  readonly label: string;
  readonly color: string;
  readonly width: number;
  readonly height: number;
  readonly menuItems: readonly ContextMenuItem[];
}

interface ConnectionData {
  readonly id: string;
  readonly fromId: string;
  readonly toId: string;
  readonly color: string;
}

const ITEM_PADDING_X = 32;
const ITEM_PADDING_Y = 24;

const INITIAL_ITEMS: readonly ItemData[] = [
  {
    id: "input",
    position: { x: 50, y: 150 },
    label: "Input",
    color: "#4a90d9",
    width: 70 + ITEM_PADDING_X,
    height: 20 + ITEM_PADDING_Y,
    menuItems: [
      { id: "edit", label: "Edit" },
      { id: "duplicate", label: "Duplicate" },
    ],
  },
  {
    id: "process",
    position: { x: 300, y: 80 },
    label: "Process",
    color: "#d9944a",
    width: 90 + ITEM_PADDING_X,
    height: 20 + ITEM_PADDING_Y,
    menuItems: [
      { id: "edit", label: "Edit" },
      { id: "configure", label: "Configure" },
      { id: "disable", label: "Disable", disabled: true },
    ],
  },
  {
    id: "validate",
    position: { x: 300, y: 230 },
    label: "Validate",
    color: "#9a4ad9",
    width: 92 + ITEM_PADDING_X,
    height: 20 + ITEM_PADDING_Y,
    menuItems: [
      { id: "edit", label: "Edit" },
      { id: "skip", label: "Skip" },
    ],
  },
  {
    id: "output",
    position: { x: 570, y: 150 },
    label: "Output",
    color: "#4ad94a",
    width: 82 + ITEM_PADDING_X,
    height: 20 + ITEM_PADDING_Y,
    menuItems: [
      { id: "edit", label: "Edit" },
      { id: "delete", label: "Delete" },
    ],
  },
];

const INITIAL_CONNECTIONS: readonly ConnectionData[] = [
  { id: "input-process", fromId: "input", toId: "process", color: "#4a90d9" },
  {
    id: "input-validate",
    fromId: "input",
    toId: "validate",
    color: "#9a4ad9",
  },
  {
    id: "process-output",
    fromId: "process",
    toId: "output",
    color: "#d9944a",
  },
  {
    id: "validate-output",
    fromId: "validate",
    toId: "output",
    color: "#9a4ad9",
  },
];

function findItem(
  items: readonly ItemData[],
  id: string,
): ItemData | undefined {
  return items.find((item) => item.id === id);
}

function toEndpoint(item: ItemData): ConnectionEndpoint {
  return {
    position: item.position,
    width: item.width,
    height: item.height,
  };
}

function FullDemo() {
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

  const obstacles: readonly Obstacle[] = items.map((item) => ({
    position: item.position,
    width: item.width,
    height: item.height,
  }));

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <InfiniteCanvas viewport={viewport} onViewportChange={setViewport}>
        {INITIAL_CONNECTIONS.map((conn) => {
          const fromItem = findItem(items, conn.fromId);
          const toItem = findItem(items, conn.toId);
          if (!fromItem || !toItem) return null;
          return (
            <Connection
              key={conn.id}
              from={toEndpoint(fromItem)}
              to={toEndpoint(toItem)}
              viewport={viewport}
              color={conn.color}
              obstacles={obstacles}
            />
          );
        })}
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
        data-testid="status-bar"
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
        <div>
          scale: {viewport.scale.toFixed(2)} | offset: (
          {viewport.offsetX.toFixed(0)}, {viewport.offsetY.toFixed(0)})
        </div>
        <div data-testid="last-action">
          {lastAction !== ""
            ? `Action: ${lastAction satisfies string}`
            : "Pan, zoom, drag items, or right-click for menu"}
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: "InfiniteCanvas/FullDemo",
  component: FullDemo,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof FullDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify all items are rendered
    const inputNode = canvas.getByTestId("item-input");
    const processNode = canvas.getByTestId("item-process");
    const validateNode = canvas.getByTestId("item-validate");
    const outputNode = canvas.getByTestId("item-output");
    await expect(inputNode).toBeInTheDocument();
    await expect(processNode).toBeInTheDocument();
    await expect(validateNode).toBeInTheDocument();
    await expect(outputNode).toBeInTheDocument();

    // Verify connection lines are rendered (4 connections)
    const connections = canvas.getAllByTestId("connection");
    await expect(connections).toHaveLength(4);

    // Verify SVG paths exist
    const paths = canvas.getAllByTestId("connection-path");
    await expect(paths).toHaveLength(4);

    // Verify items are draggable
    const canvasItemInput = inputNode.closest("[data-testid='canvas-item']");
    await expect(canvasItemInput).toHaveStyle({ cursor: "grab" });

    // Open context menu on Process node
    await userEvent.pointer({
      keys: "[MouseRight]",
      target: processNode,
    });

    // Verify context menu appears with correct items
    const contextMenu = canvas.getByTestId("context-menu");
    await expect(contextMenu).toBeInTheDocument();
    const editItem = canvas.getByTestId("context-menu-item-edit");
    await expect(editItem).toHaveTextContent("Edit");
    const configureItem = canvas.getByTestId("context-menu-item-configure");
    await expect(configureItem).toHaveTextContent("Configure");
    const disableItem = canvas.getByTestId("context-menu-item-disable");
    await expect(disableItem).toBeDisabled();

    // Click Edit
    await userEvent.click(editItem);

    // Menu should close and action recorded
    await expect(canvas.queryByTestId("context-menu")).not.toBeInTheDocument();
    const lastAction = canvas.getByTestId("last-action");
    await expect(lastAction).toHaveTextContent("Action: process: edit");

    // Verify status bar shows viewport info
    const statusBar = canvas.getByTestId("status-bar");
    await expect(statusBar).toBeInTheDocument();
  },
};
