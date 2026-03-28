import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { useCallback, useRef, useState } from "react";
import { CanvasItem } from "./CanvasItem";
import { InfiniteCanvas } from "./InfiniteCanvas";
import type { Point, Size, ViewportState } from "./types";
import { useMarquee } from "./useMarquee";
import { selectAll, type SelectableItem } from "./multiSelection";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { formatZoomPercent } from "./zoom";

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
    color: "#2e6da3",
    size: { width: 100, height: 40 },
  },
  {
    id: "2",
    position: { x: 250, y: 100 },
    label: "Item B",
    color: "#b53d3d",
    size: { width: 100, height: 40 },
  },
  {
    id: "3",
    position: { x: 150, y: 250 },
    label: "Item C",
    color: "#267026",
    size: { width: 100, height: 40 },
  },
  {
    id: "4",
    position: { x: 400, y: 300 },
    label: "Item D",
    color: "#876228",
    size: { width: 100, height: 40 },
  },
];

const CONTAINER_SIZE: Size = { width: 800, height: 600 };

function KeyboardShortcutsDemoComponent() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [items, setItems] = useState<readonly ItemData[]>(INITIAL_ITEMS);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleDeleteSelected = useCallback(() => {
    setItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));
    setSelectedIds(new Set());
  }, [selectedIds]);

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

  const { isSpacePanActive, onKeyDown, onKeyUp } = useKeyboardShortcuts(
    viewport,
    CONTAINER_SIZE,
    selectedIds.size > 0,
    {
      onDeleteSelected: handleDeleteSelected,
      onViewportChange: setViewport,
    },
  );

  const handleSelectAll = useCallback(() => {
    setSelectedIds(selectAll(selectableItems));
  }, [selectableItems]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Escape で選択解除
      if (e.key === "Escape") {
        setSelectedIds(new Set());
        e.preventDefault();
        return;
      }
      // Ctrl/Cmd+A で全選択
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        handleSelectAll();
        return;
      }
      // その他のショートカット
      onKeyDown(e);
    },
    [handleSelectAll, onKeyDown],
  );

  // panEnabled: スペースパンモード中はパン有効、そうでなければマーキーモード
  const panEnabled = isSpacePanActive;

  return (
    <div
      style={{ width: "100vw", height: "100vh" }}
      ref={containerRef}
      onKeyDown={handleKeyDown}
      onKeyUp={onKeyUp}
      tabIndex={0}
    >
      <InfiniteCanvas
        viewport={viewport}
        onViewportChange={setViewport}
        panEnabled={panEnabled}
        onEmptyAreaPointerDown={panEnabled ? undefined : onPointerDown}
        onEmptyAreaPointerMove={panEnabled ? undefined : onPointerMove}
        onEmptyAreaPointerUp={panEnabled ? undefined : onPointerUp}
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
      <div
        data-testid="shortcut-info"
        style={{
          position: "fixed",
          top: 8,
          left: 8,
          background: "rgba(0,0,0,0.8)",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: 6,
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          pointerEvents: "none",
          zIndex: 10000,
          maxWidth: 300,
        }}
      >
        <div>
          Items: {String(items.length) satisfies string} | Selected:{" "}
          {String(selectedIds.size) satisfies string} | Zoom:{" "}
          {formatZoomPercent(viewport.scale)}
        </div>
        <div style={{ marginTop: 2 }}>
          Space Pan: {isSpacePanActive ? "ON" : "OFF"}
        </div>
        <div style={{ marginTop: 4, fontSize: 9, opacity: 0.7 }}>
          Del: delete | Arrows: pan | Shift+Arrows: fast pan
        </div>
        <div style={{ fontSize: 9, opacity: 0.7 }}>
          Ctrl+/-: zoom | Space+drag: pan | Ctrl+A: select all
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: "InfiniteCanvas/KeyboardShortcuts",
  component: KeyboardShortcutsDemoComponent,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof KeyboardShortcutsDemoComponent>;

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

    // Shortcut info overlay shows initial state
    const info = canvas.getByTestId("shortcut-info");
    await expect(info).toHaveTextContent("Items: 4");
    await expect(info).toHaveTextContent("Selected: 0");
    await expect(info).toHaveTextContent("Zoom: 100%");
    await expect(info).toHaveTextContent("Space Pan: OFF");

    // Click Item A to select it
    await userEvent.click(canvas.getByTestId("item-1"));
    await expect(info).toHaveTextContent("Selected: 1");

    // Click Item B to add to selection
    await userEvent.click(canvas.getByTestId("item-2"));
    await expect(info).toHaveTextContent("Selected: 2");

    // Escape to deselect all
    await userEvent.keyboard("{Escape}");
    await expect(info).toHaveTextContent("Selected: 0");

    // Ctrl+A to select all items
    await userEvent.keyboard("{Control>}a{/Control}");
    await expect(info).toHaveTextContent("Selected: 4");

    // Delete to remove selected items
    await userEvent.keyboard("{Delete}");
    await expect(info).toHaveTextContent("Items: 0");
    await expect(info).toHaveTextContent("Selected: 0");
  },
};
