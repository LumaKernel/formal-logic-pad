import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MinimapComponent } from "./MinimapComponent";
import type { MinimapItem } from "./minimap";

beforeEach(() => {
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

afterEach(cleanup);

const DEFAULT_ITEMS: readonly MinimapItem[] = [
  { id: "a", position: { x: 0, y: 0 }, size: { width: 100, height: 50 } },
  { id: "b", position: { x: 200, y: 150 }, size: { width: 120, height: 60 } },
];

const DEFAULT_VIEWPORT = { offsetX: 0, offsetY: 0, scale: 1 };
const DEFAULT_CONTAINER = { width: 800, height: 600 };

function mockMinimapBoundingRect() {
  const minimap = screen.getByTestId("minimap");
  vi.spyOn(minimap, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    right: 150,
    bottom: 100,
    width: 150,
    height: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
  return minimap;
}

describe("MinimapComponent", () => {
  it("renders minimap container", () => {
    render(
      <MinimapComponent
        viewport={DEFAULT_VIEWPORT}
        containerSize={DEFAULT_CONTAINER}
        items={DEFAULT_ITEMS}
      />,
    );
    expect(screen.getByTestId("minimap")).toBeInTheDocument();
  });

  it("renders item thumbnails", () => {
    render(
      <MinimapComponent
        viewport={DEFAULT_VIEWPORT}
        containerSize={DEFAULT_CONTAINER}
        items={DEFAULT_ITEMS}
      />,
    );
    expect(screen.getByTestId("minimap-item-a")).toBeInTheDocument();
    expect(screen.getByTestId("minimap-item-b")).toBeInTheDocument();
  });

  it("renders viewport indicator", () => {
    render(
      <MinimapComponent
        viewport={DEFAULT_VIEWPORT}
        containerSize={DEFAULT_CONTAINER}
        items={DEFAULT_ITEMS}
      />,
    );
    expect(screen.getByTestId("minimap-viewport")).toBeInTheDocument();
  });

  it("does not render when visible is false", () => {
    render(
      <MinimapComponent
        viewport={DEFAULT_VIEWPORT}
        containerSize={DEFAULT_CONTAINER}
        items={DEFAULT_ITEMS}
        visible={false}
      />,
    );
    expect(screen.queryByTestId("minimap")).not.toBeInTheDocument();
  });

  it("applies custom width and height", () => {
    render(
      <MinimapComponent
        viewport={DEFAULT_VIEWPORT}
        containerSize={DEFAULT_CONTAINER}
        items={DEFAULT_ITEMS}
        width={200}
        height={150}
      />,
    );
    const minimap = screen.getByTestId("minimap");
    expect(minimap).toHaveStyle({ width: "200px", height: "150px" });
  });

  it("positions at bottom-right by default", () => {
    render(
      <MinimapComponent
        viewport={DEFAULT_VIEWPORT}
        containerSize={DEFAULT_CONTAINER}
        items={DEFAULT_ITEMS}
      />,
    );
    const minimap = screen.getByTestId("minimap");
    expect(minimap).toHaveStyle({
      position: "absolute",
      bottom: "12px",
      right: "12px",
    });
  });

  it("positions at top-left when specified", () => {
    render(
      <MinimapComponent
        viewport={DEFAULT_VIEWPORT}
        containerSize={DEFAULT_CONTAINER}
        items={DEFAULT_ITEMS}
        position="top-left"
      />,
    );
    const minimap = screen.getByTestId("minimap");
    expect(minimap).toHaveStyle({ top: "12px", left: "12px" });
  });

  it("calls onViewportChange on click", () => {
    const onChange = vi.fn();
    render(
      <MinimapComponent
        viewport={DEFAULT_VIEWPORT}
        containerSize={DEFAULT_CONTAINER}
        items={DEFAULT_ITEMS}
        onViewportChange={onChange}
      />,
    );
    const minimap = mockMinimapBoundingRect();

    fireEvent.pointerDown(minimap, {
      clientX: 75,
      clientY: 50,
      pointerId: 1,
    });

    expect(onChange).toHaveBeenCalledOnce();
    const result = onChange.mock.calls[0]?.[0];
    expect(result).toHaveProperty("offsetX");
    expect(result).toHaveProperty("offsetY");
    expect(result).toHaveProperty("scale", 1);
  });

  it("supports drag navigation on minimap", () => {
    const onChange = vi.fn();
    render(
      <MinimapComponent
        viewport={DEFAULT_VIEWPORT}
        containerSize={DEFAULT_CONTAINER}
        items={DEFAULT_ITEMS}
        onViewportChange={onChange}
      />,
    );
    const minimap = mockMinimapBoundingRect();

    fireEvent.pointerDown(minimap, {
      clientX: 50,
      clientY: 30,
      pointerId: 1,
    });
    fireEvent.pointerMove(minimap, {
      clientX: 75,
      clientY: 50,
      pointerId: 1,
    });
    fireEvent.pointerUp(minimap, {
      clientX: 75,
      clientY: 50,
      pointerId: 1,
    });

    // Called once on pointerDown and once on pointerMove
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("does not navigate on pointerMove without pointerDown", () => {
    const onChange = vi.fn();
    render(
      <MinimapComponent
        viewport={DEFAULT_VIEWPORT}
        containerSize={DEFAULT_CONTAINER}
        items={DEFAULT_ITEMS}
        onViewportChange={onChange}
      />,
    );

    const minimap = screen.getByTestId("minimap");
    fireEvent.pointerMove(minimap, {
      clientX: 75,
      clientY: 50,
      pointerId: 1,
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders with empty items", () => {
    render(
      <MinimapComponent
        viewport={DEFAULT_VIEWPORT}
        containerSize={DEFAULT_CONTAINER}
        items={[]}
      />,
    );
    expect(screen.getByTestId("minimap")).toBeInTheDocument();
    expect(screen.getByTestId("minimap-viewport")).toBeInTheDocument();
  });

  it("item thumbnails have minimum size of 2px", () => {
    const tinyItems: readonly MinimapItem[] = [
      {
        id: "tiny",
        position: { x: 0, y: 0 },
        size: { width: 1, height: 1 },
      },
    ];
    render(
      <MinimapComponent
        viewport={DEFAULT_VIEWPORT}
        containerSize={DEFAULT_CONTAINER}
        items={tinyItems}
      />,
    );
    const itemEl = screen.getByTestId("minimap-item-tiny");
    const w = Number(itemEl.getAttribute("width"));
    const h = Number(itemEl.getAttribute("height"));
    expect(w).toBeGreaterThanOrEqual(2);
    expect(h).toBeGreaterThanOrEqual(2);
  });

  it("viewport indicator updates with zoom", () => {
    const { rerender } = render(
      <MinimapComponent
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        containerSize={DEFAULT_CONTAINER}
        items={DEFAULT_ITEMS}
      />,
    );
    const rect1 = screen.getByTestId("minimap-viewport");
    const w1 = Number(rect1.getAttribute("width"));

    rerender(
      <MinimapComponent
        viewport={{ offsetX: 0, offsetY: 0, scale: 2 }}
        containerSize={DEFAULT_CONTAINER}
        items={DEFAULT_ITEMS}
      />,
    );
    const rect2 = screen.getByTestId("minimap-viewport");
    const w2 = Number(rect2.getAttribute("width"));

    // Zooming in should make viewport rect smaller
    expect(w2).toBeLessThan(w1);
  });

  it("stops event propagation on pointer events", () => {
    const parentHandler = vi.fn();
    render(
      <div onPointerDown={parentHandler}>
        <MinimapComponent
          viewport={DEFAULT_VIEWPORT}
          containerSize={DEFAULT_CONTAINER}
          items={DEFAULT_ITEMS}
          onViewportChange={vi.fn()}
        />
      </div>,
    );
    const minimap = mockMinimapBoundingRect();

    fireEvent.pointerDown(minimap, {
      clientX: 50,
      clientY: 30,
      pointerId: 1,
    });
    // Parent should not receive the event
    expect(parentHandler).not.toHaveBeenCalled();
  });

  it("pointerUp without pointerDown does nothing", () => {
    const onChange = vi.fn();
    render(
      <MinimapComponent
        viewport={DEFAULT_VIEWPORT}
        containerSize={DEFAULT_CONTAINER}
        items={DEFAULT_ITEMS}
        onViewportChange={onChange}
      />,
    );
    const minimap = screen.getByTestId("minimap");
    fireEvent.pointerUp(minimap, {
      clientX: 50,
      clientY: 30,
      pointerId: 1,
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});
