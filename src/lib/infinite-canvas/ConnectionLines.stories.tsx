import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { useState } from "react";
import { CanvasItem } from "./CanvasItem";
import { Connection } from "./Connection";
import type { ConnectionEndpoint, Obstacle } from "./connectionPath";
import { InfiniteCanvas } from "./InfiniteCanvas";
import type { Point, ViewportState } from "./types";

interface ItemData {
  readonly id: string;
  readonly position: Point;
  readonly label: string;
  readonly color: string;
  readonly width: number;
  readonly height: number;
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
    id: "a",
    position: { x: 50, y: 120 },
    label: "Node A",
    color: "#4a90d9",
    width: 90 + ITEM_PADDING_X,
    height: 20 + ITEM_PADDING_Y,
  },
  {
    id: "b",
    position: { x: 350, y: 50 },
    label: "Node B",
    color: "#d94a4a",
    width: 88 + ITEM_PADDING_X,
    height: 20 + ITEM_PADDING_Y,
  },
  {
    id: "c",
    position: { x: 350, y: 250 },
    label: "Node C",
    color: "#4ad94a",
    width: 88 + ITEM_PADDING_X,
    height: 20 + ITEM_PADDING_Y,
  },
];

const INITIAL_CONNECTIONS: readonly ConnectionData[] = [
  { id: "ab", fromId: "a", toId: "b", color: "#4a90d9" },
  { id: "ac", fromId: "a", toId: "c", color: "#4ad94a" },
  { id: "bc", fromId: "b", toId: "c", color: "#d94a4a" },
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

function ConnectionLinesDemo() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [items, setItems] = useState<readonly ItemData[]>(INITIAL_ITEMS);

  const handlePositionChange = (id: string, newPosition: Point) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, position: newPosition } : item,
      ),
    );
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
        scale: {viewport.scale.toFixed(2)} | offset: (
        {viewport.offsetX.toFixed(0)}, {viewport.offsetY.toFixed(0)})
      </div>
    </div>
  );
}

const meta = {
  title: "InfiniteCanvas/ConnectionLines",
  component: ConnectionLinesDemo,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ConnectionLinesDemo>;

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

    // Verify connection lines are rendered
    const connections = canvas.getAllByTestId("connection");
    await expect(connections).toHaveLength(3);

    // Verify SVG paths exist
    const paths = canvas.getAllByTestId("connection-path");
    await expect(paths).toHaveLength(3);

    // Verify items are draggable
    const canvasItemA = itemA.closest("[data-testid='canvas-item']");
    await expect(canvasItemA).toHaveStyle({ cursor: "grab" });
  },
};
