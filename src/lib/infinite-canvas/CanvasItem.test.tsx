import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CanvasItem } from "./CanvasItem";
import type { ContextMenuItem } from "./contextMenu";
import type { SnapConfig } from "./snap";

describe("CanvasItem", () => {
  it("renders children", () => {
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
      >
        <span data-testid="child-content">Hello</span>
      </CanvasItem>,
    );
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("positions at screen coordinates derived from world position", () => {
    render(
      <CanvasItem
        position={{ x: 100, y: 200 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
      >
        <span>Item</span>
      </CanvasItem>,
    );
    const item = screen.getByTestId("canvas-item");
    expect(item.style.left).toBe("100px");
    expect(item.style.top).toBe("200px");
  });

  it("applies viewport offset to position", () => {
    render(
      <CanvasItem
        position={{ x: 50, y: 50 }}
        viewport={{ offsetX: 30, offsetY: -10, scale: 1 }}
      >
        <span>Item</span>
      </CanvasItem>,
    );
    const item = screen.getByTestId("canvas-item");
    expect(item.style.left).toBe("80px");
    expect(item.style.top).toBe("40px");
  });

  it("applies viewport scale to position", () => {
    render(
      <CanvasItem
        position={{ x: 100, y: 100 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 2 }}
      >
        <span>Item</span>
      </CanvasItem>,
    );
    const item = screen.getByTestId("canvas-item");
    expect(item.style.left).toBe("200px");
    expect(item.style.top).toBe("200px");
  });

  it("scales children content via CSS transform", () => {
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1.5 }}
      >
        <span>Item</span>
      </CanvasItem>,
    );
    const item = screen.getByTestId("canvas-item");
    expect(item.style.transform).toBe("scale(1.5)");
    expect(item.style.transformOrigin).toBe("0 0");
  });

  it("uses absolute positioning", () => {
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
      >
        <span>Item</span>
      </CanvasItem>,
    );
    const item = screen.getByTestId("canvas-item");
    expect(item.style.position).toBe("absolute");
  });

  it("prevents text wrapping with whiteSpace nowrap", () => {
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
      >
        <span>Item</span>
      </CanvasItem>,
    );
    const item = screen.getByTestId("canvas-item");
    expect(item.style.whiteSpace).toBe("nowrap");
  });

  it("allows pointer events on the item", () => {
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
      >
        <span>Item</span>
      </CanvasItem>,
    );
    const item = screen.getByTestId("canvas-item");
    expect(item.style.pointerEvents).toBe("auto");
  });

  it("combines scale and offset correctly", () => {
    render(
      <CanvasItem
        position={{ x: 100, y: 50 }}
        viewport={{ offsetX: 20, offsetY: 10, scale: 0.5 }}
      >
        <span>Item</span>
      </CanvasItem>,
    );
    const item = screen.getByTestId("canvas-item");
    // x: 100 * 0.5 + 20 = 70, y: 50 * 0.5 + 10 = 35
    expect(item.style.left).toBe("70px");
    expect(item.style.top).toBe("35px");
    expect(item.style.transform).toBe("scale(0.5)");
  });

  it("handles negative world coordinates", () => {
    render(
      <CanvasItem
        position={{ x: -50, y: -30 }}
        viewport={{ offsetX: 200, offsetY: 200, scale: 1 }}
      >
        <span>Item</span>
      </CanvasItem>,
    );
    const item = screen.getByTestId("canvas-item");
    expect(item.style.left).toBe("150px");
    expect(item.style.top).toBe("170px");
  });
});

describe("CanvasItem dragging", () => {
  beforeEach(() => {
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
  });

  it("does not show grab cursor without onPositionChange", () => {
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
      >
        <span>Item</span>
      </CanvasItem>,
    );
    const item = screen.getByTestId("canvas-item");
    expect(item.style.cursor).toBe("");
  });

  it("shows grab cursor when draggable", () => {
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onPositionChange={vi.fn()}
      >
        <span>Item</span>
      </CanvasItem>,
    );
    const item = screen.getByTestId("canvas-item");
    expect(item.style.cursor).toBe("grab");
  });

  it("shows grabbing cursor while dragging", () => {
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onPositionChange={vi.fn()}
      >
        <span>Item</span>
      </CanvasItem>,
    );
    const item = screen.getByTestId("canvas-item");

    fireEvent.pointerDown(item, {
      button: 0,
      clientX: 10,
      clientY: 10,
      pointerId: 1,
    });

    expect(item.style.cursor).toBe("grabbing");
  });

  it("elevates z-index while dragging", () => {
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onPositionChange={vi.fn()}
      >
        <span>Item</span>
      </CanvasItem>,
    );
    const item = screen.getByTestId("canvas-item");
    expect(item.style.zIndex).toBe("");

    fireEvent.pointerDown(item, {
      button: 0,
      clientX: 10,
      clientY: 10,
      pointerId: 1,
    });

    expect(item.style.zIndex).toBe("1000");
  });

  it("calls onPositionChange with new world position on drag", () => {
    const onPositionChange = vi.fn();
    render(
      <CanvasItem
        position={{ x: 100, y: 200 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onPositionChange={onPositionChange}
      >
        <span>Item</span>
      </CanvasItem>,
    );
    const item = screen.getByTestId("canvas-item");

    fireEvent.pointerDown(item, {
      button: 0,
      clientX: 50,
      clientY: 50,
      pointerId: 1,
    });
    fireEvent.pointerMove(item, {
      clientX: 70,
      clientY: 80,
      pointerId: 1,
    });

    expect(onPositionChange).toHaveBeenCalledWith({ x: 120, y: 230 });
  });

  it("has touchAction none when draggable", () => {
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onPositionChange={vi.fn()}
      >
        <span>Item</span>
      </CanvasItem>,
    );
    const item = screen.getByTestId("canvas-item");
    expect(item.style.touchAction).toBe("none");
  });
});

describe("CanvasItem dragEnabled", () => {
  beforeEach(() => {
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
  });

  it("does not show grab cursor when dragEnabled is false", () => {
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onPositionChange={vi.fn()}
        dragEnabled={false}
      >
        <span>Item</span>
      </CanvasItem>,
    );
    const item = screen.getByTestId("canvas-item");
    expect(item.style.cursor).toBe("");
  });

  it("does not call onPositionChange when dragEnabled is false", () => {
    const onPositionChange = vi.fn();
    render(
      <CanvasItem
        position={{ x: 100, y: 200 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onPositionChange={onPositionChange}
        dragEnabled={false}
      >
        <span>Item</span>
      </CanvasItem>,
    );
    const item = screen.getByTestId("canvas-item");

    fireEvent.pointerDown(item, {
      button: 0,
      clientX: 50,
      clientY: 50,
      pointerId: 1,
    });
    fireEvent.pointerMove(item, {
      clientX: 70,
      clientY: 80,
      pointerId: 1,
    });

    expect(onPositionChange).not.toHaveBeenCalled();
  });

  it("shows grab cursor when dragEnabled is true (explicit)", () => {
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onPositionChange={vi.fn()}
        dragEnabled={true}
      >
        <span>Item</span>
      </CanvasItem>,
    );
    const item = screen.getByTestId("canvas-item");
    expect(item.style.cursor).toBe("grab");
  });

  it("still has touchAction none when dragEnabled is false (hasDragCallback)", () => {
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onPositionChange={vi.fn()}
        dragEnabled={false}
      >
        <span>Item</span>
      </CanvasItem>,
    );
    const item = screen.getByTestId("canvas-item");
    expect(item.style.touchAction).toBe("none");
  });
});

const MENU_ITEMS: readonly ContextMenuItem[] = [
  { id: "edit", label: "Edit" },
  { id: "delete", label: "Delete" },
];

describe("CanvasItem context menu", () => {
  beforeEach(() => {
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
  });

  it("does not show context menu without contextMenuItems", () => {
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
      >
        <span>Item</span>
      </CanvasItem>,
    );

    const item = screen.getByTestId("canvas-item");
    fireEvent.contextMenu(item, { clientX: 100, clientY: 200 });

    expect(screen.queryByTestId("context-menu")).toBeNull();
  });

  it("shows context menu on right-click when items are provided", () => {
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        contextMenuItems={MENU_ITEMS}
        onContextMenuSelect={vi.fn()}
      >
        <span>Item</span>
      </CanvasItem>,
    );

    const item = screen.getByTestId("canvas-item");
    fireEvent.contextMenu(item, { clientX: 100, clientY: 200 });

    expect(screen.getByTestId("context-menu")).toBeInTheDocument();
    expect(screen.getByTestId("context-menu-item-edit")).toBeInTheDocument();
    expect(screen.getByTestId("context-menu-item-delete")).toBeInTheDocument();
  });

  it("calls onContextMenuSelect when a menu item is clicked", () => {
    const onContextMenuSelect = vi.fn();
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        contextMenuItems={MENU_ITEMS}
        onContextMenuSelect={onContextMenuSelect}
      >
        <span>Item</span>
      </CanvasItem>,
    );

    const item = screen.getByTestId("canvas-item");
    fireEvent.contextMenu(item, { clientX: 100, clientY: 200 });
    fireEvent.click(screen.getByTestId("context-menu-item-edit"));

    expect(onContextMenuSelect).toHaveBeenCalledWith("edit");
  });

  it("closes context menu after item selection", () => {
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        contextMenuItems={MENU_ITEMS}
        onContextMenuSelect={vi.fn()}
      >
        <span>Item</span>
      </CanvasItem>,
    );

    const item = screen.getByTestId("canvas-item");
    fireEvent.contextMenu(item, { clientX: 100, clientY: 200 });
    expect(screen.getByTestId("context-menu")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("context-menu-item-edit"));
    expect(screen.queryByTestId("context-menu")).toBeNull();
  });

  it("has touchAction none when context menu items are provided", () => {
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        contextMenuItems={MENU_ITEMS}
      >
        <span>Item</span>
      </CanvasItem>,
    );
    const item = screen.getByTestId("canvas-item");
    expect(item.style.touchAction).toBe("none");
  });

  it("supports both drag and context menu on same item", () => {
    const onPositionChange = vi.fn();
    const onContextMenuSelect = vi.fn();
    render(
      <CanvasItem
        position={{ x: 100, y: 200 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onPositionChange={onPositionChange}
        contextMenuItems={MENU_ITEMS}
        onContextMenuSelect={onContextMenuSelect}
      >
        <span>Item</span>
      </CanvasItem>,
    );

    const item = screen.getByTestId("canvas-item");

    // Verify drag still works
    fireEvent.pointerDown(item, {
      button: 0,
      clientX: 50,
      clientY: 50,
      pointerId: 1,
    });
    fireEvent.pointerMove(item, { clientX: 70, clientY: 80, pointerId: 1 });
    fireEvent.pointerUp(item, { pointerId: 1 });
    expect(onPositionChange).toHaveBeenCalled();

    // Verify context menu still works
    fireEvent.contextMenu(item, { clientX: 100, clientY: 200 });
    expect(screen.getByTestId("context-menu")).toBeInTheDocument();
  });

  it("opens context menu on touch long press", () => {
    vi.useFakeTimers();
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        contextMenuItems={MENU_ITEMS}
        onContextMenuSelect={vi.fn()}
      >
        <span>Item</span>
      </CanvasItem>,
    );

    const item = screen.getByTestId("canvas-item");

    fireEvent.pointerDown(item, {
      pointerType: "touch",
      clientX: 100,
      clientY: 200,
      button: 0,
      pointerId: 1,
    });

    // Long press duration (500ms)
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByTestId("context-menu")).toBeInTheDocument();
    vi.useRealTimers();
  });
});

describe("CanvasItem onClick", () => {
  beforeEach(() => {
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
  });

  it("calls onClick when item is clicked without dragging", () => {
    const onClick = vi.fn();
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onClick={onClick}
      >
        <span>Item</span>
      </CanvasItem>,
    );

    const item = screen.getByTestId("canvas-item");

    fireEvent.pointerDown(item, {
      button: 0,
      clientX: 100,
      clientY: 200,
      pointerId: 1,
    });
    fireEvent.pointerUp(item, { clientX: 100, clientY: 200, pointerId: 1 });

    expect(onClick).toHaveBeenCalledWith(100, 200);
  });

  it("does not call onClick when pointer moves beyond threshold", () => {
    const onClick = vi.fn();
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onPositionChange={vi.fn()}
        onClick={onClick}
      >
        <span>Item</span>
      </CanvasItem>,
    );

    const item = screen.getByTestId("canvas-item");

    fireEvent.pointerDown(item, {
      button: 0,
      clientX: 100,
      clientY: 200,
      pointerId: 1,
    });
    fireEvent.pointerMove(item, { clientX: 120, clientY: 220, pointerId: 1 });
    fireEvent.pointerUp(item, { clientX: 120, clientY: 220, pointerId: 1 });

    expect(onClick).not.toHaveBeenCalled();
  });

  it("shows pointer cursor when onClick is provided", () => {
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onClick={vi.fn()}
      >
        <span>Item</span>
      </CanvasItem>,
    );

    const item = screen.getByTestId("canvas-item");
    expect(item.style.cursor).toBe("pointer");
  });

  it("prefers grab cursor over pointer cursor when draggable", () => {
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onPositionChange={vi.fn()}
        onClick={vi.fn()}
      >
        <span>Item</span>
      </CanvasItem>,
    );

    const item = screen.getByTestId("canvas-item");
    expect(item.style.cursor).toBe("grab");
  });

  it("does not call onClick on right-click", () => {
    const onClick = vi.fn();
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onClick={onClick}
      >
        <span>Item</span>
      </CanvasItem>,
    );

    const item = screen.getByTestId("canvas-item");

    fireEvent.pointerDown(item, {
      button: 2,
      clientX: 100,
      clientY: 200,
      pointerId: 1,
    });
    fireEvent.pointerUp(item, { clientX: 100, clientY: 200, pointerId: 1 });

    expect(onClick).not.toHaveBeenCalled();
  });

  it("has touchAction none when onClick is provided", () => {
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onClick={vi.fn()}
      >
        <span>Item</span>
      </CanvasItem>,
    );

    const item = screen.getByTestId("canvas-item");
    expect(item.style.touchAction).toBe("none");
  });
});

describe("CanvasItem snapConfig", () => {
  beforeEach(() => {
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
  });

  it("snaps drag position to grid when snapConfig is enabled", () => {
    const onPositionChange = vi.fn();
    const snapConfig: SnapConfig = { enabled: true, gridSpacing: 20 };
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onPositionChange={onPositionChange}
        snapConfig={snapConfig}
      >
        <span>Item</span>
      </CanvasItem>,
    );

    const item = screen.getByTestId("canvas-item");

    fireEvent.pointerDown(item, {
      button: 0,
      clientX: 50,
      clientY: 50,
      pointerId: 1,
    });
    // Move by (12, 18) from origin → raw (12, 18) → snap to (20, 20)
    fireEvent.pointerMove(item, {
      clientX: 62,
      clientY: 68,
      pointerId: 1,
    });

    expect(onPositionChange).toHaveBeenCalledWith({ x: 20, y: 20 });
  });

  it("does not snap without snapConfig", () => {
    const onPositionChange = vi.fn();
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onPositionChange={onPositionChange}
      >
        <span>Item</span>
      </CanvasItem>,
    );

    const item = screen.getByTestId("canvas-item");

    fireEvent.pointerDown(item, {
      button: 0,
      clientX: 50,
      clientY: 50,
      pointerId: 1,
    });
    fireEvent.pointerMove(item, {
      clientX: 62,
      clientY: 68,
      pointerId: 1,
    });

    expect(onPositionChange).toHaveBeenCalledWith({ x: 12, y: 18 });
  });

  it("calls onDragMove with screen coordinates during drag", () => {
    const onDragMove = vi.fn();
    const onPositionChange = vi.fn();
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onPositionChange={onPositionChange}
        onDragMove={onDragMove}
      >
        <span>Draggable</span>
      </CanvasItem>,
    );

    const item = screen.getByTestId("canvas-item");

    fireEvent.pointerDown(item, {
      button: 0,
      clientX: 50,
      clientY: 50,
      pointerId: 1,
    });
    fireEvent.pointerMove(item, {
      clientX: 100,
      clientY: 150,
      pointerId: 1,
    });

    expect(onDragMove).toHaveBeenCalledWith({ x: 100, y: 150 });
  });

  it("calls onDragEnd when drag finishes", () => {
    const onDragEnd = vi.fn();
    const onPositionChange = vi.fn();
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onPositionChange={onPositionChange}
        onDragEnd={onDragEnd}
      >
        <span>Draggable</span>
      </CanvasItem>,
    );

    const item = screen.getByTestId("canvas-item");

    fireEvent.pointerDown(item, {
      button: 0,
      clientX: 50,
      clientY: 50,
      pointerId: 1,
    });
    fireEvent.pointerUp(item, {
      clientX: 60,
      clientY: 60,
      pointerId: 1,
    });

    expect(onDragEnd).toHaveBeenCalledOnce();
  });

  it("does not call onDragMove when not dragging", () => {
    const onDragMove = vi.fn();
    render(
      <CanvasItem
        position={{ x: 0, y: 0 }}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onDragMove={onDragMove}
      >
        <span>No drag</span>
      </CanvasItem>,
    );

    const item = screen.getByTestId("canvas-item");

    // No onPositionChange provided, so drag is disabled
    fireEvent.pointerDown(item, {
      button: 0,
      clientX: 50,
      clientY: 50,
      pointerId: 1,
    });
    fireEvent.pointerMove(item, {
      clientX: 100,
      clientY: 150,
      pointerId: 1,
    });

    expect(onDragMove).not.toHaveBeenCalled();
  });
});
