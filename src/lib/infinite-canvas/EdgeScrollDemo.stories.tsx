import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { useCallback, useState } from "react";
import { CanvasItem } from "./CanvasItem";
import { InfiniteCanvas } from "./InfiniteCanvas";
import { useEdgeScroll } from "./useEdgeScroll";
import { EdgeScrollIndicator } from "./EdgeScrollIndicator";
import type { EdgeScrollConfig } from "./edgeScrollLogic";
import type { Point, Size, ViewportState } from "./types";

interface NodeData {
  readonly id: string;
  readonly position: Point;
  readonly label: string;
  readonly color: string;
}

const INITIAL_NODES: readonly NodeData[] = [
  {
    id: "center",
    position: { x: 300, y: 250 },
    label: "Drag me to edges!",
    color: "#4a90d9",
  },
  {
    id: "top-left",
    position: { x: -200, y: -200 },
    label: "Far Top-Left",
    color: "#d9944a",
  },
  {
    id: "bottom-right",
    position: { x: 800, y: 600 },
    label: "Far Bottom-Right",
    color: "#9a4ad9",
  },
  {
    id: "far-left",
    position: { x: -500, y: 200 },
    label: "Far Left",
    color: "#4ad9a5",
  },
  {
    id: "far-right",
    position: { x: 1200, y: 200 },
    label: "Far Right",
    color: "#d94a7a",
  },
];

const EDGE_SCROLL_CONFIG: EdgeScrollConfig = {
  threshold: 40,
  maxSpeed: 600,
};

function EdgeScrollDemo() {
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
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);

  const { notifyDragMove, notifyDragEnd, edgePenetration } = useEdgeScroll(
    viewport,
    containerSize,
    setViewport,
    EDGE_SCROLL_CONFIG,
  );

  const handlePositionChange = useCallback((id: string, newPosition: Point) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === id ? { ...node, position: newPosition } : node,
      ),
    );
  }, []);

  const handleDragMove = useCallback(
    (screenPoint: Point) => {
      // Convert clientX/clientY to container-relative coordinates
      if (containerEl === null) {
        notifyDragMove(screenPoint);
        return;
      }
      const rect = containerEl.getBoundingClientRect();
      notifyDragMove({
        x: screenPoint.x - rect.left,
        y: screenPoint.y - rect.top,
      });
    },
    [notifyDragMove, containerEl],
  );

  const handleDragEnd = useCallback(() => {
    notifyDragEnd();
  }, [notifyDragEnd]);

  const containerCallbackRef = useCallback((el: HTMLDivElement | null) => {
    setContainerEl(el);
    if (el) {
      const rect = el.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    }
  }, []);

  return (
    <div
      ref={containerCallbackRef}
      data-testid="edge-scroll-demo-container"
      style={{ width: "100vw", height: "100vh", position: "relative" }}
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
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            <div
              data-testid={`node-${node.id satisfies string}`}
              style={{
                padding: "10px 16px",
                background: node.color,
                color: "#fff",
                borderRadius: 8,
                fontFamily: "var(--font-ui)",
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
      </InfiniteCanvas>
      {/* Shadow glow indicator for edge scroll zones */}
      <EdgeScrollIndicator edgePenetration={edgePenetration} />
      <div
        data-testid="edge-scroll-info"
        style={{
          position: "fixed",
          top: 8,
          left: 8,
          background: "rgba(0,0,0,0.85)",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: 6,
          fontSize: 12,
          fontFamily: "var(--font-mono)",
          pointerEvents: "none",
          zIndex: 10000,
        }}
      >
        <div>Edge Scroll Demo</div>
        <div>Drag a node to the viewport edge to auto-pan</div>
        <div>
          Threshold: {String(EDGE_SCROLL_CONFIG.threshold) satisfies string}px
        </div>
        <div>
          Viewport: ({viewport.offsetX.toFixed(0)},{" "}
          {viewport.offsetY.toFixed(0)}) @ {(viewport.scale * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: "InfiniteCanvas/EdgeScrollDemo",
  component: EdgeScrollDemo,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof EdgeScrollDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Canvas and nodes are visible
    const container = canvas.getByTestId("edge-scroll-demo-container");
    await expect(container).toBeInTheDocument();

    const centerNode = canvas.getByTestId("node-center");
    await expect(centerNode).toBeInTheDocument();
    await expect(centerNode).toHaveTextContent("Drag me to edges!");

    // Info panel is visible
    const info = canvas.getByTestId("edge-scroll-info");
    await expect(info).toBeInTheDocument();
    await expect(info).toHaveTextContent("Edge Scroll Demo");

    // Shadow indicator is not visible when not dragging
    await expect(
      canvas.queryByTestId("edge-scroll-indicator"),
    ).not.toBeInTheDocument();
  },
};
