import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within, userEvent } from "storybook/test";
import { useCallback, useMemo, useState } from "react";
import { CanvasItem } from "./CanvasItem";
import { InfiniteCanvas } from "./InfiniteCanvas";
import { ZoomControlsComponent } from "./ZoomControlsComponent";
import { computeFitToContentViewport } from "./zoom";
import type { ZoomItemBounds } from "./zoom";
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
];

function toZoomItems(nodes: readonly NodeData[]): readonly ZoomItemBounds[] {
  return nodes.map((n) => ({
    x: n.position.x,
    y: n.position.y,
    width: n.width,
    height: n.height,
  }));
}

function ZoomControlsDemo() {
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

  const zoomItems = toZoomItems(nodes);

  return (
    <div
      ref={containerCallbackRef}
      data-testid="zoom-controls-demo-container"
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
        <ZoomControlsComponent
          viewport={viewport}
          containerSize={containerSize}
          items={zoomItems}
          onViewportChange={setViewport}
        />
      </InfiniteCanvas>
    </div>
  );
}

function ZoomControlsTopRight() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [containerSize] = useState<Size>({ width: 800, height: 600 });

  return (
    <div
      data-testid="zoom-controls-demo-container"
      style={{ width: "100vw", height: "100vh" }}
    >
      <InfiniteCanvas viewport={viewport} onViewportChange={setViewport}>
        <CanvasItem position={{ x: 100, y: 100 }} viewport={viewport}>
          <div
            style={{
              padding: "10px 16px",
              background: "#4a90d9",
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
            Sample Node
          </div>
        </CanvasItem>
        <ZoomControlsComponent
          viewport={viewport}
          containerSize={containerSize}
          onViewportChange={setViewport}
          position="top-right"
        />
      </InfiniteCanvas>
    </div>
  );
}

function ZoomControlsMinimal() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [containerSize] = useState<Size>({ width: 800, height: 600 });

  return (
    <div
      data-testid="zoom-controls-demo-container"
      style={{ width: "100vw", height: "100vh" }}
    >
      <InfiniteCanvas viewport={viewport} onViewportChange={setViewport}>
        <ZoomControlsComponent
          viewport={viewport}
          containerSize={containerSize}
          onViewportChange={setViewport}
          showFitButton={false}
          showResetButton={false}
          showPresets={false}
        />
      </InfiniteCanvas>
    </div>
  );
}

const meta = {
  title: "InfiniteCanvas/ZoomControls",
  component: ZoomControlsDemo,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ZoomControlsDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Zoom controls should be visible
    const controls = canvas.getByTestId("zoom-controls");
    await expect(controls).toBeInTheDocument();
    // All buttons should be present
    await expect(canvas.getByTestId("zoom-in-button")).toBeInTheDocument();
    await expect(canvas.getByTestId("zoom-out-button")).toBeInTheDocument();
    await expect(canvas.getByTestId("zoom-percentage")).toBeInTheDocument();
    await expect(canvas.getByTestId("zoom-reset-button")).toBeInTheDocument();
    await expect(canvas.getByTestId("zoom-fit-button")).toBeInTheDocument();
    // Initial zoom should be 100%
    await expect(canvas.getByTestId("zoom-percentage")).toHaveTextContent(
      "100%",
    );
    // Items should be visible
    await expect(canvas.getByTestId("demo-node-node1")).toBeInTheDocument();
  },
};

export const ZoomInOut: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    // Click zoom in
    await user.click(canvas.getByTestId("zoom-in-button"));
    const percentAfterIn = canvas.getByTestId("zoom-percentage").textContent;
    // Should be > 100%
    const numAfterIn = parseInt(percentAfterIn ?? "0", 10);
    await expect(numAfterIn).toBeGreaterThan(100);
    // Click zoom out twice to go below 100%
    await user.click(canvas.getByTestId("zoom-out-button"));
    await user.click(canvas.getByTestId("zoom-out-button"));
    const percentAfterOut = canvas.getByTestId("zoom-percentage").textContent;
    const numAfterOut = parseInt(percentAfterOut ?? "0", 10);
    await expect(numAfterOut).toBeLessThan(100);
  },
};

export const PresetDropdown: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    // Open preset dropdown
    await user.click(canvas.getByTestId("zoom-percentage"));
    const dropdown = canvas.getByTestId("zoom-preset-dropdown");
    await expect(dropdown).toBeInTheDocument();
    // Select 200%
    await user.click(canvas.getByTestId("zoom-preset-200"));
    await expect(canvas.getByTestId("zoom-percentage")).toHaveTextContent(
      "200%",
    );
    // Dropdown should be closed
    await expect(
      canvas.queryByTestId("zoom-preset-dropdown"),
    ).not.toBeInTheDocument();
  },
};

export const TopRightPosition: Story = {
  render: () => <ZoomControlsTopRight />,
  args: {} as Record<string, never>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const controls = canvas.getByTestId("zoom-controls");
    await expect(controls).toBeInTheDocument();
  },
};

export const MinimalControls: Story = {
  render: () => <ZoomControlsMinimal />,
  args: {} as Record<string, never>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("zoom-controls")).toBeInTheDocument();
    // Fit and Reset buttons should not be present
    await expect(
      canvas.queryByTestId("zoom-fit-button"),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByTestId("zoom-reset-button"),
    ).not.toBeInTheDocument();
  },
};

function ZoomToSelectionDemo() {
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
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );

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

  const zoomItems = toZoomItems(nodes);
  const selectedItems = useMemo(
    () => zoomItems.filter((_, i) => selectedIds.has(INITIAL_NODES[i]!.id)),
    [zoomItems, selectedIds],
  );

  const handleZoomToSelection = useCallback(() => {
    if (selectedItems.length === 0) return;
    const newViewport = computeFitToContentViewport(
      selectedItems,
      containerSize,
    );
    setViewport(newViewport);
  }, [selectedItems, containerSize]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <div
      ref={containerCallbackRef}
      data-testid="zoom-controls-demo-container"
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
              onClick={(e) => {
                e.stopPropagation();
                toggleSelection(node.id);
              }}
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
                outline: selectedIds.has(node.id)
                  ? "3px solid #3b82f6"
                  : "none",
                outlineOffset: "2px",
              }}
            >
              {node.label}
            </div>
          </CanvasItem>
        ))}
        <ZoomControlsComponent
          viewport={viewport}
          containerSize={containerSize}
          items={zoomItems}
          onViewportChange={setViewport}
          selectedItems={selectedItems}
          onZoomToSelection={handleZoomToSelection}
        />
      </InfiniteCanvas>
    </div>
  );
}

export const ZoomToSelection: Story = {
  render: () => <ZoomToSelectionDemo />,
  args: {} as Record<string, never>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Initially, zoom-to-selection button should not be visible (no selection)
    await expect(
      canvas.queryByTestId("zoom-to-selection-button"),
    ).not.toBeInTheDocument();

    // Click on a node to select it
    await user.click(canvas.getByTestId("demo-node-node1"));

    // Now the zoom-to-selection button should appear
    await expect(
      canvas.getByTestId("zoom-to-selection-button"),
    ).toBeInTheDocument();

    // Click zoom-to-selection
    await user.click(canvas.getByTestId("zoom-to-selection-button"));

    // Zoom percentage should be exactly 100% (FIT_MAX_SCALE caps at 1)
    const percentText = canvas.getByTestId("zoom-percentage").textContent ?? "";
    const num = parseInt(percentText, 10);
    await expect(num).toBe(100);
  },
};
