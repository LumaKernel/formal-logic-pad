import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { useCallback, useRef, useState } from "react";
import { CanvasItem } from "./CanvasItem";
import { InfiniteCanvas } from "./InfiniteCanvas";
import { EdgeScrollIndicator } from "./EdgeScrollIndicator";
import { useEdgeScroll } from "./useEdgeScroll";
import type { Point, Size, ViewportState } from "./types";
import { useMarquee } from "./useMarquee";
import { selectAll, type SelectableItem } from "./multiSelection";

interface ItemData {
  readonly id: string;
  readonly position: Point;
  readonly label: string;
  readonly color: string;
  readonly size: { readonly width: number; readonly height: number };
}

const INITIAL_ITEMS: readonly ItemData[] = [
  {
    id: "1",
    position: { x: 50, y: 50 },
    label: "Item A",
    color: "#4a90d9",
    size: { width: 100, height: 40 },
  },
  {
    id: "2",
    position: { x: 250, y: 100 },
    label: "Item B",
    color: "#d94a4a",
    size: { width: 100, height: 40 },
  },
  {
    id: "3",
    position: { x: 150, y: 250 },
    label: "Item C",
    color: "#4ad94a",
    size: { width: 100, height: 40 },
  },
  {
    id: "4",
    position: { x: 400, y: 300 },
    label: "Item D",
    color: "#d9a54a",
    size: { width: 100, height: 40 },
  },
];

function MultiSelectionDemoComponent() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [items, setItems] = useState<readonly ItemData[]>(INITIAL_ITEMS);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [marqueeMode, setMarqueeMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<Size>({
    width: 0,
    height: 0,
  });

  const containerCallbackRef = useCallback((el: HTMLDivElement | null) => {
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current =
      el;
    if (el) {
      const rect = el.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    }
  }, []);

  const { notifyDragMove, notifyDragEnd, edgePenetration } = useEdgeScroll(
    viewport,
    containerSize,
    setViewport,
  );

  const selectableItems: readonly SelectableItem[] = items.map((item) => ({
    id: item.id,
    position: item.position,
    size: item.size,
  }));

  const { marqueeRect, onPointerDown, onPointerMove, onPointerUp } = useMarquee(
    viewport,
    selectableItems,
    selectedIds,
    setSelectedIds,
    containerRef,
  );

  /** マーキー中にエッジスクロールも通知するラッパー */
  const handleMarqueePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      onPointerMove(e);
      const el = containerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        notifyDragMove({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    },
    [onPointerMove, notifyDragMove],
  );

  const handleMarqueePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      onPointerUp(e);
      notifyDragEnd();
    },
    [onPointerUp, notifyDragEnd],
  );

  /** ノードドラッグ時のエッジスクロール通知 */
  const handleDragMove = useCallback(
    (screenPoint: Point) => {
      const el = containerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        notifyDragMove({
          x: screenPoint.x - rect.left,
          y: screenPoint.y - rect.top,
        });
      } else {
        notifyDragMove(screenPoint);
      }
    },
    [notifyDragMove],
  );

  const handlePositionChange = useCallback((id: string, newPosition: Point) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, position: newPosition } : item,
      ),
    );
  }, []);

  const handleItemClick = useCallback((id: string) => {
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

  const handleEmptyAreaClick = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(selectAll(selectableItems));
  }, [selectableItems]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedIds(new Set());
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        handleSelectAll();
      }
    },
    [handleSelectAll],
  );

  return (
    <div
      style={{ width: "100vw", height: "100vh", position: "relative" }}
      ref={containerCallbackRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <InfiniteCanvas
        viewport={viewport}
        onViewportChange={setViewport}
        panEnabled={!marqueeMode}
        onEmptyAreaPointerDown={marqueeMode ? onPointerDown : undefined}
        onEmptyAreaPointerMove={
          marqueeMode ? handleMarqueePointerMove : undefined
        }
        onEmptyAreaPointerUp={marqueeMode ? handleMarqueePointerUp : undefined}
        onEmptyAreaClick={handleEmptyAreaClick}
        marqueeRect={marqueeRect}
      >
        {items.map((item) => (
          <CanvasItem
            key={item.id}
            position={item.position}
            viewport={viewport}
            onPositionChange={(pos) => {
              handlePositionChange(item.id, pos);
            }}
            onDragMove={handleDragMove}
            onDragEnd={notifyDragEnd}
            onClick={() => {
              handleItemClick(item.id);
            }}
          >
            <div
              data-testid={`item-${item.id satisfies string}`}
              style={{
                padding: "8px 16px",
                background: item.color,
                color: "#fff",
                borderRadius: 6,
                fontFamily: "var(--font-ui)",
                fontSize: 14,
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                whiteSpace: "nowrap",
                userSelect: "none",
                width: item.size.width,
                height: item.size.height,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                outline: selectedIds.has(item.id)
                  ? "3px solid #fff"
                  : undefined,
                outlineOffset: selectedIds.has(item.id) ? 2 : undefined,
              }}
            >
              {item.label}
            </div>
          </CanvasItem>
        ))}
      </InfiniteCanvas>
      <EdgeScrollIndicator edgePenetration={edgePenetration} />
      <div
        data-testid="selection-info"
        style={{
          position: "fixed",
          top: 8,
          left: 8,
          background: "rgba(0,0,0,0.8)",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: 6,
          fontSize: 12,
          fontFamily: "var(--font-mono)",
          pointerEvents: "none",
          zIndex: 10000,
        }}
      >
        <div>
          Mode: {marqueeMode ? "Marquee" : "Pan"} | Selected:{" "}
          {String(selectedIds.size) satisfies string}
        </div>
        <div style={{ marginTop: 4, fontSize: 10, opacity: 0.7 }}>
          Click toggle button to switch mode
        </div>
      </div>
      <button
        data-testid="toggle-mode"
        onClick={() => {
          setMarqueeMode((m) => !m);
        }}
        style={{
          position: "fixed",
          top: 8,
          right: 8,
          background: marqueeMode ? "#3b82f6" : "#666",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "8px 16px",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          zIndex: 10000,
        }}
      >
        {marqueeMode ? "Marquee Mode" : "Pan Mode"}
      </button>
    </div>
  );
}

const meta = {
  title: "InfiniteCanvas/MultiSelection",
  component: MultiSelectionDemoComponent,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof MultiSelectionDemoComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // All 4 items are visible
    await expect(canvas.getByTestId("item-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("item-2")).toBeInTheDocument();
    await expect(canvas.getByTestId("item-3")).toBeInTheDocument();
    await expect(canvas.getByTestId("item-4")).toBeInTheDocument();

    // Toggle button exists
    const toggleBtn = canvas.getByTestId("toggle-mode");
    await expect(toggleBtn).toBeInTheDocument();
    await expect(toggleBtn).toHaveTextContent("Pan Mode");

    // Selection info shows 0 selected
    const info = canvas.getByTestId("selection-info");
    await expect(info).toHaveTextContent("Selected: 0");
  },
};
