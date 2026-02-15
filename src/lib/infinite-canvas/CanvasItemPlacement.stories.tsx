import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { useState } from "react";
import { CanvasItem } from "./CanvasItem";
import { InfiniteCanvas } from "./InfiniteCanvas";
import type { Point, ViewportState } from "./types";

interface ItemData {
  readonly id: string;
  readonly position: Point;
  readonly label: string;
  readonly color: string;
}

const INITIAL_ITEMS: readonly ItemData[] = [
  { id: "1", position: { x: 100, y: 100 }, label: "Node A", color: "#4a90d9" },
  { id: "2", position: { x: 300, y: 200 }, label: "Node B", color: "#d94a4a" },
  { id: "3", position: { x: 200, y: 350 }, label: "Node C", color: "#4ad94a" },
];

function CanvasItemPlacementDemo() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [items] = useState<readonly ItemData[]>(INITIAL_ITEMS);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <InfiniteCanvas viewport={viewport} onViewportChange={setViewport}>
        {items.map((item) => (
          <CanvasItem
            key={item.id}
            position={item.position}
            viewport={viewport}
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
  title: "InfiniteCanvas/CanvasItemPlacement",
  component: CanvasItemPlacementDemo,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof CanvasItemPlacementDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const itemA = canvas.getByTestId("item-1");
    const itemB = canvas.getByTestId("item-2");
    const itemC = canvas.getByTestId("item-3");

    await expect(itemA).toBeInTheDocument();
    await expect(itemB).toBeInTheDocument();
    await expect(itemC).toBeInTheDocument();

    await expect(itemA).toHaveTextContent("Node A");
    await expect(itemB).toHaveTextContent("Node B");
    await expect(itemC).toHaveTextContent("Node C");
  },
};
