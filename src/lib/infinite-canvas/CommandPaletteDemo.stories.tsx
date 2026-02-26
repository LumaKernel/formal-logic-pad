import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { useCallback, useRef, useState } from "react";
import { CanvasItem } from "./CanvasItem";
import { InfiniteCanvas } from "./InfiniteCanvas";
import type { Point, Size, ViewportState } from "./types";
import { useCommandPalette } from "./useCommandPalette";
import { CommandPaletteComponent } from "./CommandPaletteComponent";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import type { CommandItem } from "./commandPalette";

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
];

const COMMAND_ITEMS: readonly CommandItem[] = [
  {
    id: "a1",
    label: "A1 (K)",
    description: "φ → (ψ → φ)",
    category: "公理",
  },
  {
    id: "a2",
    label: "A2 (S)",
    description: "(φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))",
    category: "公理",
  },
  {
    id: "a3",
    label: "A3",
    description: "(¬φ → ¬ψ) → (ψ → φ)",
    category: "公理",
  },
  {
    id: "mp",
    label: "MP",
    description: "Modus Ponens を適用",
    category: "操作",
  },
  {
    id: "gen",
    label: "Gen",
    description: "汎化規則を適用",
    category: "操作",
  },
];

const CONTAINER_SIZE: Size = { width: 800, height: 600 };

function CommandPaletteDemoComponent() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [items] = useState<readonly ItemData[]>(INITIAL_ITEMS);
  const [lastExecuted, setLastExecuted] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const commandPalette = useCommandPalette(COMMAND_ITEMS, {
    onExecute: (item) => {
      setLastExecuted(item.id);
    },
  });

  const { onKeyDown: shortcutKeyDown, onKeyUp } = useKeyboardShortcuts(
    viewport,
    CONTAINER_SIZE,
    false,
    {
      onViewportChange: setViewport,
      onOpenCommandPalette: commandPalette.open,
    },
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Don't trigger shortcuts when command palette is open
      if (!commandPalette.isOpen) {
        shortcutKeyDown(e);
      }
    },
    [shortcutKeyDown, commandPalette.isOpen],
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
              }}
            >
              {item.label}
            </div>
          </CanvasItem>
        ))}
      </InfiniteCanvas>

      <CommandPaletteComponent
        isOpen={commandPalette.isOpen}
        paletteState={commandPalette.paletteState}
        onQueryChange={commandPalette.setQuery}
        onNext={commandPalette.goToNext}
        onPrevious={commandPalette.goToPrevious}
        onExecute={commandPalette.executeSelected}
        onClose={commandPalette.close}
      />

      <div
        data-testid="palette-info"
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
          Palette:{" "}
          {commandPalette.isOpen ? "open" : ("closed" satisfies string)}
        </div>
        <div style={{ marginTop: 2 }}>
          Last executed: {lastExecuted ?? ("none" satisfies string)}
        </div>
        <div style={{ marginTop: 4, fontSize: 9, opacity: 0.7 }}>
          / : open command palette | Esc: close
        </div>
        <div style={{ fontSize: 9, opacity: 0.7 }}>
          Arrow Up/Down: navigate | Enter: execute
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: "InfiniteCanvas/CommandPalette",
  component: CommandPaletteDemoComponent,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof CommandPaletteDemoComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Items are visible
    await expect(canvas.getByTestId("item-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("item-2")).toBeInTheDocument();

    // Command palette is not visible initially
    expect(canvas.queryByTestId("command-palette-overlay")).toBeNull();

    // Info overlay is present
    const info = canvas.getByTestId("palette-info");
    await expect(info).toHaveTextContent("Palette: closed");
    await expect(info).toHaveTextContent("Last executed: none");
  },
};

export const PaletteInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Focus the container first
    const container = canvasElement.querySelector("[tabindex]")!;
    (container as HTMLElement).focus();

    // Open palette with / key
    await userEvent.keyboard("/");

    // Palette should be visible
    const overlay = canvas.getByTestId("command-palette-overlay");
    await expect(overlay).toBeInTheDocument();

    // All 5 items should be listed
    await expect(
      canvas.getByTestId("command-palette-item-a1"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("command-palette-item-mp"),
    ).toBeInTheDocument();

    // First item should be selected
    await expect(
      canvas.getByTestId("command-palette-item-a1"),
    ).toHaveAttribute("aria-selected", "true");

    // Type to filter
    const input = canvas.getByTestId("command-palette-input");
    await userEvent.type(input, "MP");

    // Only MP should be visible
    await expect(
      canvas.getByTestId("command-palette-item-mp"),
    ).toBeInTheDocument();
    expect(canvas.queryByTestId("command-palette-item-a1")).toBeNull();

    // Execute with Enter
    await userEvent.keyboard("{Enter}");

    // Palette should close
    expect(canvas.queryByTestId("command-palette-overlay")).toBeNull();

    // Last executed should be "mp"
    const info = canvas.getByTestId("palette-info");
    await expect(info).toHaveTextContent("Last executed: mp");
  },
};
