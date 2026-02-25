import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { useCallback, useState } from "react";
import { CanvasItem } from "./CanvasItem";
import { InfiniteCanvas } from "./InfiniteCanvas";
import { MinimapComponent } from "./MinimapComponent";
import type { MinimapItem } from "./minimap";
import type { Point, Size, ViewportState } from "./types";

interface NodeData {
  readonly id: string;
  readonly position: Point;
  readonly label: string;
  readonly color: string;
  readonly width: number;
  readonly height: number;
}

const INITIAL_NODES: readonly NodeData[] = [
  {
    id: "node1",
    position: { x: 50, y: 50 },
    label: "Alpha",
    color: "#4a90d9",
    width: 100,
    height: 40,
  },
  {
    id: "node2",
    position: { x: 300, y: 100 },
    label: "Beta",
    color: "#d9944a",
    width: 100,
    height: 40,
  },
  {
    id: "node3",
    position: { x: 150, y: 250 },
    label: "Gamma",
    color: "#9a4ad9",
    width: 100,
    height: 40,
  },
  {
    id: "node4",
    position: { x: 500, y: 300 },
    label: "Delta",
    color: "#4ad94a",
    width: 100,
    height: 40,
  },
  {
    id: "node5",
    position: { x: -100, y: 400 },
    label: "Epsilon",
    color: "#d94a4a",
    width: 100,
    height: 40,
  },
];

function toMinimapItems(nodes: readonly NodeData[]): readonly MinimapItem[] {
  return nodes.map((n) => ({
    id: n.id,
    position: n.position,
    size: { width: n.width, height: n.height },
  }));
}

function MinimapDemo() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [nodes, setNodes] = useState<readonly NodeData[]>(INITIAL_NODES);
  const [containerSize, setContainerSize] = useState<Size>({
    width: 800,
    height: 600,
  });

  const handlePositionChange = useCallback((id: string, newPosition: Point) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === id ? { ...node, position: newPosition } : node,
      ),
    );
  }, []);

  const containerCallbackRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      const rect = el.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    }
  }, []);

  const minimapItems = toMinimapItems(nodes);

  return (
    <div
      ref={containerCallbackRef}
      data-testid="minimap-demo-container"
      style={{ width: "100vw", height: "100vh" }}
    >
      <InfiniteCanvas viewport={viewport} onViewportChange={setViewport}>
        {nodes.map((node) => (
          <CanvasItem
            key={node.id}
            position={node.position}
            viewport={viewport}
            onPositionChange={(pos) => {
              handlePositionChange(node.id, pos);
            }}
          >
            <div
              data-testid={`demo-node-${node.id satisfies string}`}
              style={{
                padding: "10px 16px",
                background: node.color,
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
              {node.label}
            </div>
          </CanvasItem>
        ))}
        <MinimapComponent
          viewport={viewport}
          containerSize={containerSize}
          items={minimapItems}
          onViewportChange={setViewport}
        />
      </InfiniteCanvas>
    </div>
  );
}

function MinimapDemoTopLeft() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [nodes, setNodes] = useState<readonly NodeData[]>(INITIAL_NODES);
  const [containerSize] = useState<Size>({ width: 800, height: 600 });

  const handlePositionChange = useCallback((id: string, newPosition: Point) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === id ? { ...node, position: newPosition } : node,
      ),
    );
  }, []);

  const minimapItems = toMinimapItems(nodes);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <InfiniteCanvas viewport={viewport} onViewportChange={setViewport}>
        {nodes.map((node) => (
          <CanvasItem
            key={node.id}
            position={node.position}
            viewport={viewport}
            onPositionChange={(pos) => {
              handlePositionChange(node.id, pos);
            }}
          >
            <div
              style={{
                padding: "10px 16px",
                background: node.color,
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
              {node.label}
            </div>
          </CanvasItem>
        ))}
        <MinimapComponent
          viewport={viewport}
          containerSize={containerSize}
          items={minimapItems}
          onViewportChange={setViewport}
          position="top-left"
          width={200}
          height={130}
        />
      </InfiniteCanvas>
    </div>
  );
}

function MinimapDemoHidden() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [containerSize] = useState<Size>({ width: 800, height: 600 });

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <InfiniteCanvas viewport={viewport} onViewportChange={setViewport}>
        <MinimapComponent
          viewport={viewport}
          containerSize={containerSize}
          items={[]}
          visible={false}
        />
      </InfiniteCanvas>
    </div>
  );
}

const meta = {
  title: "InfiniteCanvas/Minimap",
  component: MinimapDemo,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof MinimapDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Minimap should be visible
    const minimap = canvas.getByTestId("minimap");
    await expect(minimap).toBeInTheDocument();
    // Viewport indicator should be visible
    const viewportEl = canvas.getByTestId("minimap-viewport");
    await expect(viewportEl).toBeInTheDocument();
    // All 5 items should have thumbnails
    for (const id of ["node1", "node2", "node3", "node4", "node5"]) {
      await expect(
        canvas.getByTestId(`minimap-item-${id satisfies string}`),
      ).toBeInTheDocument();
    }
    // Items on canvas should be visible
    await expect(canvas.getByTestId("demo-node-node1")).toBeInTheDocument();
  },
};

export const TopLeftPosition: Story = {
  render: () => <MinimapDemoTopLeft />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const minimap = canvas.getByTestId("minimap");
    await expect(minimap).toBeInTheDocument();
    // Verify position
    await expect(minimap).toHaveStyle({ top: "12px", left: "12px" });
  },
};

export const HiddenMinimap: Story = {
  render: () => <MinimapDemoHidden />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Minimap should not be rendered
    const minimapEl = canvas.queryByTestId("minimap");
    await expect(minimapEl).not.toBeInTheDocument();
  },
};
