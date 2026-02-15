import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CanvasItem } from "./CanvasItem";

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
