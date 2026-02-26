import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { useCallback, useRef, useState } from "react";
import { CanvasItem } from "./CanvasItem";
import { InfiniteCanvas } from "./InfiniteCanvas";
import type { Point, Size, ViewportState } from "./types";
import { useNodeSearch } from "./useNodeSearch";
import { NodeSearchComponent } from "./NodeSearchComponent";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import type { SearchableItem } from "./nodeSearch";
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
    label: "φ → ψ",
    color: "#4a90d9",
    size: { width: 120, height: 40 },
  },
  {
    id: "2",
    position: { x: 300, y: 50 },
    label: "ψ → χ",
    color: "#d94a4a",
    size: { width: 120, height: 40 },
  },
  {
    id: "3",
    position: { x: 175, y: 150 },
    label: "φ → χ",
    color: "#4ad94a",
    size: { width: 120, height: 40 },
  },
  {
    id: "4",
    position: { x: 500, y: 150 },
    label: "¬φ",
    color: "#d9a54a",
    size: { width: 80, height: 40 },
  },
  {
    id: "5",
    position: { x: 50, y: 300 },
    label: "φ ∧ ψ",
    color: "#9b59b6",
    size: { width: 120, height: 40 },
  },
  {
    id: "6",
    position: { x: 400, y: 300 },
    label: "∀x P(x)",
    color: "#1abc9c",
    size: { width: 120, height: 40 },
  },
];

const CONTAINER_SIZE: Size = { width: 800, height: 600 };

function NodeSearchDemoComponent() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [items] = useState<readonly ItemData[]>(INITIAL_ITEMS);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchableItems: readonly SearchableItem[] = items.map((item) => ({
    id: item.id,
    label: item.label,
    x: item.position.x,
    y: item.position.y,
    width: item.size.width,
    height: item.size.height,
  }));

  const nodeSearch = useNodeSearch(searchableItems, CONTAINER_SIZE, {
    onViewportChange: setViewport,
    onHighlightItem: setHighlightedId,
  });

  const { onKeyDown: shortcutKeyDown, onKeyUp } = useKeyboardShortcuts(
    viewport,
    CONTAINER_SIZE,
    false,
    {
      onViewportChange: setViewport,
      onOpenSearch: nodeSearch.open,
    },
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      shortcutKeyDown(e);
    },
    [shortcutKeyDown],
  );

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
        panEnabled={true}
      >
        {items.map((item) => (
          <CanvasItem
            key={item.id}
            position={item.position}
            viewport={viewport}
          >
            <div
              data-testid={`item-${item.id satisfies string}`}
              style={{
                padding: "8px 16px",
                background: item.color,
                color: "#fff",
                borderRadius: 6,
                fontFamily: "sans-serif",
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
                outline:
                  highlightedId === item.id ? "3px solid #ff0" : undefined,
                outlineOffset: highlightedId === item.id ? 2 : undefined,
              }}
            >
              {item.label}
            </div>
          </CanvasItem>
        ))}
      </InfiniteCanvas>

      <NodeSearchComponent
        isOpen={nodeSearch.isOpen}
        searchResult={nodeSearch.searchResult}
        onQueryChange={nodeSearch.setQuery}
        onNext={nodeSearch.goToNext}
        onPrevious={nodeSearch.goToPrevious}
        onClose={nodeSearch.close}
      />

      <div
        data-testid="search-info"
        style={{
          position: "fixed",
          top: 8,
          left: 8,
          background: "rgba(0,0,0,0.8)",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: 6,
          fontSize: 11,
          fontFamily: "monospace",
          pointerEvents: "none",
          zIndex: 10000,
          maxWidth: 300,
        }}
      >
        <div>
          Items: {String(items.length) satisfies string} | Zoom:{" "}
          {formatZoomPercent(viewport.scale)}
        </div>
        <div style={{ marginTop: 2 }}>
          Highlighted: {highlightedId ?? "none"}
        </div>
        <div style={{ marginTop: 4, fontSize: 9, opacity: 0.7 }}>
          Ctrl/Cmd+F: open search | Esc: close search
        </div>
        <div style={{ fontSize: 9, opacity: 0.7 }}>
          Enter: next match | Shift+Enter: prev match
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: "InfiniteCanvas/NodeSearch",
  component: NodeSearchDemoComponent,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof NodeSearchDemoComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // All 6 items are visible
    await expect(canvas.getByTestId("item-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("item-2")).toBeInTheDocument();
    await expect(canvas.getByTestId("item-3")).toBeInTheDocument();
    await expect(canvas.getByTestId("item-4")).toBeInTheDocument();
    await expect(canvas.getByTestId("item-5")).toBeInTheDocument();
    await expect(canvas.getByTestId("item-6")).toBeInTheDocument();

    // Search panel is not visible initially
    expect(canvas.queryByTestId("node-search-panel")).toBeNull();

    // Info overlay is present
    const info = canvas.getByTestId("search-info");
    await expect(info).toHaveTextContent("Items: 6");
    await expect(info).toHaveTextContent("Highlighted: none");
  },
};

export const SearchInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Focus the container first
    const container = canvasElement.querySelector("[tabindex]")!;
    (container as HTMLElement).focus();

    // Open search with Ctrl+F
    await userEvent.keyboard("{Control>}f{/Control}");

    // Search panel should be visible
    const panel = canvas.getByTestId("node-search-panel");
    await expect(panel).toBeInTheDocument();

    // Type search query
    const input = canvas.getByTestId("node-search-input");
    await userEvent.type(input, "→");

    // Should show match count
    const count = canvas.getByTestId("node-search-count");
    await expect(count).toHaveTextContent("1/3");

    // Navigate to next match
    await userEvent.keyboard("{Enter}");
    await expect(count).toHaveTextContent("2/3");

    // Navigate to previous
    await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
    await expect(count).toHaveTextContent("1/3");
  },
};
