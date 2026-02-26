import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { useCallback, useMemo, useRef, useState } from "react";
import { AlignmentGuidesComponent } from "./AlignmentGuidesComponent";
import { CanvasItem } from "./CanvasItem";
import { InfiniteCanvas } from "./InfiniteCanvas";
import {
  computeObjectSnap,
  DEFAULT_OBJECT_SNAP_THRESHOLD,
  type AlignmentGuide,
  type ObjectSnapConfig,
  type SnapTargetRect,
} from "./objectSnap";
import type { Point, Size, ViewportState } from "./types";

interface ItemData {
  readonly id: string;
  readonly position: Point;
  readonly size: Size;
  readonly label: string;
  readonly color: string;
}

const INITIAL_ITEMS: readonly ItemData[] = [
  {
    id: "a",
    position: { x: 100, y: 100 },
    size: { width: 120, height: 50 },
    label: "Item A",
    color: "#4a90d9",
  },
  {
    id: "b",
    position: { x: 350, y: 100 },
    size: { width: 120, height: 50 },
    label: "Item B",
    color: "#d94a4a",
  },
  {
    id: "c",
    position: { x: 220, y: 280 },
    size: { width: 120, height: 50 },
    label: "Item C",
    color: "#4ad94a",
  },
];

function ObjectSnapDemo() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [items, setItems] = useState<readonly ItemData[]>(INITIAL_ITEMS);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [guides, setGuides] = useState<readonly AlignmentGuide[]>([]);
  const draggingIdRef = useRef<string | null>(null);

  const snapConfig: ObjectSnapConfig = useMemo(
    () => ({
      enabled: snapEnabled,
      threshold: DEFAULT_OBJECT_SNAP_THRESHOLD,
    }),
    [snapEnabled],
  );

  const snapTargets: readonly SnapTargetRect[] = items.map((item) => ({
    id: item.id,
    position: item.position,
    size: item.size,
  }));

  const handlePositionChange = useCallback(
    (id: string, newPosition: Point) => {
      const item = items.find((i) => i.id === id);
      if (item === undefined) return;

      draggingIdRef.current = id;

      const result = computeObjectSnap(
        newPosition,
        item.size,
        id,
        snapTargets,
        snapConfig,
      );

      setGuides(result.guides);
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, position: result.snappedPosition } : it,
        ),
      );
    },
    [items, snapTargets, snapConfig],
  );

  const handlePointerUp = useCallback(() => {
    draggingIdRef.current = null;
    setGuides([]);
  }, []);

  return (
    <div
      style={{ width: "100vw", height: "100vh" }}
      onPointerUp={handlePointerUp}
    >
      <InfiniteCanvas viewport={viewport} onViewportChange={setViewport}>
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
                width: item.size.width,
                height: item.size.height,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
        <AlignmentGuidesComponent guides={guides} viewport={viewport} />
      </InfiniteCanvas>
      <div
        style={{
          position: "fixed",
          top: 8,
          left: 8,
          background: "rgba(0,0,0,0.85)",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: 6,
          fontSize: 12,
          fontFamily: "monospace",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          pointerEvents: "auto",
        }}
      >
        <div>
          Object Snap:{" "}
          <button
            data-testid="toggle-object-snap"
            onClick={() => {
              setSnapEnabled((prev) => !prev);
            }}
            style={{
              background: snapEnabled ? "#4caf50" : "#f44336",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "2px 8px",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {snapEnabled ? "ON" : "OFF"}
          </button>
        </div>
        <div>
          Threshold: {String(DEFAULT_OBJECT_SNAP_THRESHOLD) satisfies string}px
        </div>
        <div>Guides: {String(guides.length) satisfies string}</div>
        {items.map((item) => (
          <div key={item.id} data-testid={`pos-${item.id satisfies string}`}>
            {item.label}: ({item.position.x.toFixed(0)},{" "}
            {item.position.y.toFixed(0)})
          </div>
        ))}
      </div>
    </div>
  );
}

const meta = {
  title: "InfiniteCanvas/ObjectSnapDemo",
  component: ObjectSnapDemo,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ObjectSnapDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // All items are visible
    const itemA = canvas.getByTestId("item-a");
    const itemB = canvas.getByTestId("item-b");
    const itemC = canvas.getByTestId("item-c");
    await expect(itemA).toBeInTheDocument();
    await expect(itemB).toBeInTheDocument();
    await expect(itemC).toBeInTheDocument();

    // Toggle button visible
    const toggleBtn = canvas.getByTestId("toggle-object-snap");
    await expect(toggleBtn).toBeInTheDocument();
    await expect(toggleBtn).toHaveTextContent("ON");

    // Position displays visible
    const posA = canvas.getByTestId("pos-a");
    const posB = canvas.getByTestId("pos-b");
    const posC = canvas.getByTestId("pos-c");
    await expect(posA).toBeInTheDocument();
    await expect(posB).toBeInTheDocument();
    await expect(posC).toBeInTheDocument();

    // Items have grab cursor
    const canvasItemA = itemA.closest("[data-testid='canvas-item']");
    await expect(canvasItemA).toHaveStyle({ cursor: "grab" });
  },
};
