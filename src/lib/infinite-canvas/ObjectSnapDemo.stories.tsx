import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlignmentGuidesComponent } from "./AlignmentGuidesComponent";
import { CanvasItem } from "./CanvasItem";
import {
  DEFERRED_SNAP_DURATION_MS,
  DEFERRED_SNAP_MIN_DISTANCE,
  easeOutCubic,
  interpolatePosition,
  isSnapAnimationNeeded,
} from "./deferredSnap";
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

/** Guide opacity for preview during drag (faint glow). */
const PREVIEW_GUIDE_OPACITY = 0.35;

function ObjectSnapDemo() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [items, setItems] = useState<readonly ItemData[]>(INITIAL_ITEMS);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [guides, setGuides] = useState<readonly AlignmentGuide[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const animationRef = useRef<number | null>(null);

  const snapConfig: ObjectSnapConfig = useMemo(
    () => ({
      enabled: snapEnabled,
      threshold: DEFAULT_OBJECT_SNAP_THRESHOLD,
    }),
    [snapEnabled],
  );

  const getSnapTargets = useCallback(
    (): readonly SnapTargetRect[] =>
      items.map((item) => ({
        id: item.id,
        position: item.position,
        size: item.size,
      })),
    [items],
  );

  // During drag: move item freely, show snap preview guides
  const handlePositionChange = useCallback(
    (id: string, newPosition: Point) => {
      const item = items.find((i) => i.id === id);
      if (item === undefined) return;

      setIsDragging(true);

      // Compute snap preview (guides only, don't snap position)
      const result = computeObjectSnap(
        newPosition,
        item.size,
        id,
        getSnapTargets(),
        snapConfig,
      );

      // Show guides as preview but keep raw position
      setGuides(result.guides);
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, position: newPosition } : it,
        ),
      );
    },
    [items, getSnapTargets, snapConfig],
  );

  // On drag end: animate to snap position
  const handleDragEnd = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      if (item === undefined) return;

      setIsDragging(false);

      if (!snapConfig.enabled) {
        setGuides([]);
        return;
      }

      const snapTargets = getSnapTargets();
      const result = computeObjectSnap(
        item.position,
        item.size,
        id,
        snapTargets,
        snapConfig,
      );

      const from = item.position;
      const to = result.snappedPosition;

      if (!isSnapAnimationNeeded(from, to, DEFERRED_SNAP_MIN_DISTANCE)) {
        // Snap immediately if distance is negligible
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, position: to } : it)),
        );
        setGuides([]);
        return;
      }

      // Show guides at full opacity during animation
      setGuides(result.guides);
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
          // Ensure exact final position
          setItems((prev) =>
            prev.map((it) => (it.id === id ? { ...it, position: to } : it)),
          );
          animationRef.current = null;
          setIsAnimating(false);
          setGuides([]);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    [items, getSnapTargets, snapConfig],
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

  // Guide opacity: faint during drag preview, full during snap animation
  const guideOpacity = isDragging ? PREVIEW_GUIDE_OPACITY : 1;

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
                width: item.size.width,
                height: item.size.height,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
            </div>
          </CanvasItem>
        ))}
        <AlignmentGuidesComponent
          guides={guides}
          viewport={viewport}
          color={`rgba(249, 115, 22, ${String(guideOpacity) satisfies string})`}
        />
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
        <div>
          Animating:{" "}
          <span data-testid="animating-state">
            {isAnimating ? "yes" : "no"}
          </span>
        </div>
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

    // Animating state display visible
    const animState = canvas.getByTestId("animating-state");
    await expect(animState).toHaveTextContent("no");

    // Items have grab cursor
    const canvasItemA = itemA.closest("[data-testid='canvas-item']");
    await expect(canvasItemA).toHaveStyle({ cursor: "grab" });
  },
};
