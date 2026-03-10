import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CanvasItem } from "./CanvasItem";
import {
  DEFERRED_SNAP_DURATION_MS,
  DEFERRED_SNAP_MIN_DISTANCE,
  easeOutCubic,
  interpolatePosition,
  isSnapAnimationNeeded,
} from "./deferredSnap";
import { InfiniteCanvas } from "./InfiniteCanvas";
import { applySnap, type SnapConfig } from "./snap";
import type { Point, ViewportState } from "./types";

interface ItemData {
  readonly id: string;
  readonly position: Point;
  readonly label: string;
  readonly color: string;
}

const GRID_SPACING = 20;

const INITIAL_ITEMS: readonly ItemData[] = [
  {
    id: "snap",
    position: { x: 100, y: 100 },
    label: "Snap to Grid",
    color: "#4a90d9",
  },
  {
    id: "free",
    position: { x: 300, y: 200 },
    label: "Free Move",
    color: "#d94a4a",
  },
];

function GridSnapDemo() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [items, setItems] = useState<readonly ItemData[]>(INITIAL_ITEMS);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);

  const snapConfig: SnapConfig = useMemo(
    () => ({
      enabled: snapEnabled,
      gridSpacing: GRID_SPACING,
    }),
    [snapEnabled],
  );

  // During drag: move freely (no snap applied)
  const handlePositionChange = (id: string, newPosition: Point) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, position: newPosition } : item,
      ),
    );
  };

  // On drag end: animate to snap position
  const handleDragEnd = useCallback(
    (id: string) => {
      if (!snapConfig.enabled || id !== "snap") return;

      const item = items.find((i) => i.id === id);
      if (item === undefined) return;

      const from = item.position;
      const to = applySnap(from, snapConfig);

      if (!isSnapAnimationNeeded(from, to, DEFERRED_SNAP_MIN_DISTANCE)) {
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, position: to } : it)),
        );
        return;
      }

      setIsAnimating(true);
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / DEFERRED_SNAP_DURATION_MS, 1);
        const eased = easeOutCubic(progress);
        const pos = interpolatePosition(from, to, eased);

        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, position: pos } : it)),
        );

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setItems((prev) =>
            prev.map((it) => (it.id === id ? { ...it, position: to } : it)),
          );
          animationRef.current = null;
          setIsAnimating(false);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    [items, snapConfig],
  );

  // Cleanup animation on unmount
  useEffect(
    () => () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    },
    [],
  );

  const snapItem = items.find((i) => i.id === "snap");
  const freeItem = items.find((i) => i.id === "free");

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
            onDragEnd={() => {
              handleDragEnd(item.id);
            }}
          >
            <div
              data-testid={`item-${item.id satisfies string}`}
              style={{
                padding: "12px 16px",
                background: item.color,
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
              {item.label}
              {item.id === "snap" ? (snapEnabled ? " (ON)" : " (OFF)") : ""}
            </div>
          </CanvasItem>
        ))}
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
          fontFamily: "var(--font-mono)",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          pointerEvents: "auto",
        }}
      >
        <div>
          Grid Snap (deferred):{" "}
          <button
            data-testid="toggle-snap"
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
        <div>Grid: {String(GRID_SPACING) satisfies string}px</div>
        <div>
          Animating:{" "}
          <span data-testid="animating-state">
            {isAnimating ? "yes" : "no"}
          </span>
        </div>
        {snapItem !== undefined && (
          <div data-testid="snap-position">
            Snap: ({snapItem.position.x.toFixed(0)},{" "}
            {snapItem.position.y.toFixed(0)})
          </div>
        )}
        {freeItem !== undefined && (
          <div data-testid="free-position">
            Free: ({freeItem.position.x.toFixed(0)},{" "}
            {freeItem.position.y.toFixed(0)})
          </div>
        )}
      </div>
    </div>
  );
}

const meta = {
  title: "InfiniteCanvas/GridSnapDemo",
  component: GridSnapDemo,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GridSnapDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Both items are visible
    const snapItem = canvas.getByTestId("item-snap");
    const freeItem = canvas.getByTestId("item-free");
    await expect(snapItem).toBeInTheDocument();
    await expect(freeItem).toBeInTheDocument();

    // Snap item shows ON label
    await expect(snapItem).toHaveTextContent("Snap to Grid (ON)");
    await expect(freeItem).toHaveTextContent("Free Move");

    // Toggle button is visible
    const toggleBtn = canvas.getByTestId("toggle-snap");
    await expect(toggleBtn).toBeInTheDocument();
    await expect(toggleBtn).toHaveTextContent("ON");

    // Animating state display visible
    const animState = canvas.getByTestId("animating-state");
    await expect(animState).toHaveTextContent("no");

    // Position displays are visible
    const snapPos = canvas.getByTestId("snap-position");
    const freePos = canvas.getByTestId("free-position");
    await expect(snapPos).toBeInTheDocument();
    await expect(freePos).toBeInTheDocument();

    // Items have grab cursor (draggable)
    const canvasItemSnap = snapItem.closest("[data-testid='canvas-item']");
    await expect(canvasItemSnap).toHaveStyle({ cursor: "grab" });
  },
};
