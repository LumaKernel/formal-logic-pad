import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommandPaletteComponent } from "./CommandPaletteComponent";
import type { CommandPaletteState } from "./commandPalette";

// --- Test data ---

const stateWithItems: CommandPaletteState = {
  query: "",
  filteredItems: [
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
      id: "mp",
      label: "MP",
      description: "Modus Ponens を適用",
      category: "操作",
    },
  ],
  selectedIndex: 0,
};

const emptyState: CommandPaletteState = {
  query: "zzz",
  filteredItems: [],
  selectedIndex: -1,
};

const defaultProps = {
  onQueryChange: vi.fn(),
  onNext: vi.fn(),
  onPrevious: vi.fn(),
  onExecute: vi.fn(),
  onClose: vi.fn(),
};

describe("CommandPaletteComponent", () => {
  it("renders nothing when not open", () => {
    render(
      <CommandPaletteComponent
        isOpen={false}
        paletteState={stateWithItems}
        {...defaultProps}
      />,
    );
    expect(screen.queryByTestId("command-palette-overlay")).toBeNull();
  });

  it("renders overlay and panel when open", () => {
    render(
      <CommandPaletteComponent
        isOpen={true}
        paletteState={stateWithItems}
        {...defaultProps}
      />,
    );
    expect(screen.getByTestId("command-palette-overlay")).toBeDefined();
    expect(screen.getByTestId("command-palette-panel")).toBeDefined();
    expect(screen.getByTestId("command-palette-input")).toBeDefined();
    expect(screen.getByTestId("command-palette-list")).toBeDefined();
  });

  it("renders items with labels and descriptions", () => {
    render(
      <CommandPaletteComponent
        isOpen={true}
        paletteState={stateWithItems}
        {...defaultProps}
      />,
    );
    expect(screen.getByTestId("command-palette-item-a1")).toBeDefined();
    expect(screen.getByTestId("command-palette-item-a2")).toBeDefined();
    expect(screen.getByTestId("command-palette-item-mp")).toBeDefined();
    expect(screen.getByText("A1 (K)")).toBeDefined();
    expect(screen.getByText("Modus Ponens を適用")).toBeDefined();
  });

  it("marks selected item with aria-selected", () => {
    render(
      <CommandPaletteComponent
        isOpen={true}
        paletteState={stateWithItems}
        {...defaultProps}
      />,
    );
    const item = screen.getByTestId("command-palette-item-a1");
    expect(item.getAttribute("aria-selected")).toBe("true");

    const item2 = screen.getByTestId("command-palette-item-a2");
    expect(item2.getAttribute("aria-selected")).toBe("false");
  });

  it("displays empty message when no matches", () => {
    render(
      <CommandPaletteComponent
        isOpen={true}
        paletteState={emptyState}
        {...defaultProps}
      />,
    );
    expect(screen.getByText("No matching commands")).toBeDefined();
  });

  it("displays 'No commands available' when query is empty and no items", () => {
    const noItemsState: CommandPaletteState = {
      query: "",
      filteredItems: [],
      selectedIndex: -1,
    };
    render(
      <CommandPaletteComponent
        isOpen={true}
        paletteState={noItemsState}
        {...defaultProps}
      />,
    );
    expect(screen.getByText("No commands available")).toBeDefined();
  });

  it("calls onQueryChange on input change", async () => {
    const onQueryChange = vi.fn();
    render(
      <CommandPaletteComponent
        isOpen={true}
        paletteState={stateWithItems}
        {...defaultProps}
        onQueryChange={onQueryChange}
      />,
    );
    const input = screen.getByTestId("command-palette-input");
    await userEvent.type(input, "x");
    expect(onQueryChange).toHaveBeenCalled();
  });

  it("calls onClose on Escape key", async () => {
    const onClose = vi.fn();
    render(
      <CommandPaletteComponent
        isOpen={true}
        paletteState={stateWithItems}
        {...defaultProps}
        onClose={onClose}
      />,
    );
    const input = screen.getByTestId("command-palette-input");
    await userEvent.type(input, "{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onExecute on Enter key", async () => {
    const onExecute = vi.fn();
    render(
      <CommandPaletteComponent
        isOpen={true}
        paletteState={stateWithItems}
        {...defaultProps}
        onExecute={onExecute}
      />,
    );
    const input = screen.getByTestId("command-palette-input");
    await userEvent.type(input, "{Enter}");
    expect(onExecute).toHaveBeenCalledTimes(1);
  });

  it("calls onNext on ArrowDown key", async () => {
    const onNext = vi.fn();
    render(
      <CommandPaletteComponent
        isOpen={true}
        paletteState={stateWithItems}
        {...defaultProps}
        onNext={onNext}
      />,
    );
    const input = screen.getByTestId("command-palette-input");
    await userEvent.type(input, "{ArrowDown}");
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("calls onPrevious on ArrowUp key", async () => {
    const onPrevious = vi.fn();
    render(
      <CommandPaletteComponent
        isOpen={true}
        paletteState={stateWithItems}
        {...defaultProps}
        onPrevious={onPrevious}
      />,
    );
    const input = screen.getByTestId("command-palette-input");
    await userEvent.type(input, "{ArrowUp}");
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking overlay background", async () => {
    const onClose = vi.fn();
    render(
      <CommandPaletteComponent
        isOpen={true}
        paletteState={stateWithItems}
        {...defaultProps}
        onClose={onClose}
      />,
    );
    const overlay = screen.getByTestId("command-palette-overlay");
    await userEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when clicking inside the panel", async () => {
    const onClose = vi.fn();
    render(
      <CommandPaletteComponent
        isOpen={true}
        paletteState={stateWithItems}
        {...defaultProps}
        onClose={onClose}
      />,
    );
    const panel = screen.getByTestId("command-palette-panel");
    await userEvent.click(panel);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders category badges", () => {
    render(
      <CommandPaletteComponent
        isOpen={true}
        paletteState={stateWithItems}
        {...defaultProps}
      />,
    );
    expect(screen.getAllByText("公理").length).toBe(2);
    expect(screen.getByText("操作")).toBeDefined();
  });

  it("calls onExecute when clicking an item", async () => {
    const onExecute = vi.fn();
    render(
      <CommandPaletteComponent
        isOpen={true}
        paletteState={stateWithItems}
        {...defaultProps}
        onExecute={onExecute}
      />,
    );
    const item = screen.getByTestId("command-palette-item-mp");
    await userEvent.click(item);
    expect(onExecute).toHaveBeenCalledTimes(1);
  });
});
