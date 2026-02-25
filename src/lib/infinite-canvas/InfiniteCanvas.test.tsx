import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InfiniteCanvas } from "./InfiniteCanvas";

describe("InfiniteCanvas", () => {
  it("renders a container element", () => {
    render(<InfiniteCanvas />);
    const canvas = screen.getByTestId("infinite-canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("fills its parent with 100% width and height", () => {
    render(<InfiniteCanvas />);
    const canvas = screen.getByTestId("infinite-canvas");
    expect(canvas.style.width).toBe("100%");
    expect(canvas.style.height).toBe("100%");
  });

  it("renders an SVG with a dot pattern", () => {
    render(<InfiniteCanvas />);
    const canvas = screen.getByTestId("infinite-canvas");
    const svg = canvas.querySelector("svg");
    expect(svg).not.toBeNull();
    const pattern = svg?.querySelector("pattern");
    expect(pattern).not.toBeNull();
    const circle = pattern?.querySelector("circle");
    expect(circle).not.toBeNull();
  });

  it("uses CSS variable as default dot color", () => {
    render(<InfiniteCanvas />);
    const canvas = screen.getByTestId("infinite-canvas");
    const circle = canvas.querySelector("circle");
    expect(circle?.getAttribute("fill")).toBe(
      "var(--color-canvas-dot, #c0c0c0)",
    );
  });

  it("uses CSS variable as default background color", () => {
    render(<InfiniteCanvas />);
    const canvas = screen.getByTestId("infinite-canvas");
    expect(canvas.style.backgroundColor).toBe(
      "var(--color-canvas-bg, #ffffff)",
    );
  });

  it("uses custom dot color when provided via props", () => {
    render(<InfiniteCanvas dotColor="#ff0000" />);
    const canvas = screen.getByTestId("infinite-canvas");
    const circle = canvas.querySelector("circle");
    expect(circle?.getAttribute("fill")).toBe("#ff0000");
  });

  it("uses custom background color when provided via props", () => {
    render(<InfiniteCanvas backgroundColor="rgb(0, 0, 0)" />);
    const canvas = screen.getByTestId("infinite-canvas");
    expect(canvas.style.backgroundColor).toBe("rgb(0, 0, 0)");
  });

  it("renders children", () => {
    render(
      <InfiniteCanvas>
        <div data-testid="child">Hello</div>
      </InfiniteCanvas>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("applies viewport offset to pattern position", () => {
    render(
      <InfiniteCanvas viewport={{ offsetX: 30, offsetY: 50, scale: 1 }} />,
    );
    const canvas = screen.getByTestId("infinite-canvas");
    const pattern = canvas.querySelector("pattern");
    // 30 % 20 = 10, 50 % 20 = 10
    expect(pattern?.getAttribute("x")).toBe("10");
    expect(pattern?.getAttribute("y")).toBe("10");
  });

  it("applies viewport scale to pattern size", () => {
    render(<InfiniteCanvas viewport={{ offsetX: 0, offsetY: 0, scale: 2 }} />);
    const canvas = screen.getByTestId("infinite-canvas");
    const pattern = canvas.querySelector("pattern");
    // 20 * 2 = 40
    expect(pattern?.getAttribute("width")).toBe("40");
    expect(pattern?.getAttribute("height")).toBe("40");
  });

  it("hides the SVG from accessibility tree", () => {
    render(<InfiniteCanvas />);
    const canvas = screen.getByTestId("infinite-canvas");
    const svg = canvas.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("InfiniteCanvas panning", () => {
  beforeEach(() => {
    // jsdom does not implement pointer capture methods
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
  });

  it("shows grab cursor by default", () => {
    render(<InfiniteCanvas />);
    const canvas = screen.getByTestId("infinite-canvas");
    expect(canvas.style.cursor).toBe("grab");
  });

  it("has touch-action none for pointer event handling", () => {
    render(<InfiniteCanvas />);
    const canvas = screen.getByTestId("infinite-canvas");
    expect(canvas.style.touchAction).toBe("none");
  });

  it("calls onViewportChange when dragging", () => {
    const onViewportChange = vi.fn();
    render(
      <InfiniteCanvas
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onViewportChange={onViewportChange}
      />,
    );
    const canvas = screen.getByTestId("infinite-canvas");

    fireEvent.pointerDown(canvas, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerMove(canvas, {
      clientX: 150,
      clientY: 120,
      pointerId: 1,
    });

    expect(onViewportChange).toHaveBeenCalledWith({
      offsetX: 50,
      offsetY: 20,
      scale: 1,
    });
  });

  it("does not pan on right-click", () => {
    const onViewportChange = vi.fn();
    render(
      <InfiniteCanvas
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onViewportChange={onViewportChange}
      />,
    );
    const canvas = screen.getByTestId("infinite-canvas");

    fireEvent.pointerDown(canvas, {
      button: 2,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerMove(canvas, {
      clientX: 150,
      clientY: 120,
      pointerId: 1,
    });

    expect(onViewportChange).not.toHaveBeenCalled();
  });

  it("stops panning on pointerUp", () => {
    const onViewportChange = vi.fn();
    render(
      <InfiniteCanvas
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onViewportChange={onViewportChange}
      />,
    );
    const canvas = screen.getByTestId("infinite-canvas");

    fireEvent.pointerDown(canvas, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerUp(canvas, {
      clientX: 150,
      clientY: 120,
      pointerId: 1,
    });
    fireEvent.pointerMove(canvas, {
      clientX: 200,
      clientY: 200,
      pointerId: 1,
    });

    // Should not be called after pointerUp (only before)
    expect(onViewportChange).not.toHaveBeenCalled();
  });

  it("does not call onViewportChange when moving without pressing", () => {
    const onViewportChange = vi.fn();
    render(
      <InfiniteCanvas
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onViewportChange={onViewportChange}
      />,
    );
    const canvas = screen.getByTestId("infinite-canvas");

    fireEvent.pointerMove(canvas, {
      clientX: 150,
      clientY: 120,
      pointerId: 1,
    });

    expect(onViewportChange).not.toHaveBeenCalled();
  });

  it("registers pointer events on the container", () => {
    render(<InfiniteCanvas />);
    const canvas = screen.getByTestId("infinite-canvas");
    // The container should be interactive (has pointer event handlers attached via React)
    // We verify by confirming pointer events work (no crash)
    fireEvent.pointerDown(canvas, {
      button: 0,
      clientX: 0,
      clientY: 0,
      pointerId: 1,
    });
    fireEvent.pointerMove(canvas, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 10, clientY: 10, pointerId: 1 });
  });

  it("captures and releases pointer on drag", () => {
    render(
      <InfiniteCanvas
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onViewportChange={vi.fn()}
      />,
    );
    const canvas = screen.getByTestId("infinite-canvas");

    fireEvent.pointerDown(canvas, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 42,
    });

    expect(Element.prototype.setPointerCapture).toHaveBeenCalledWith(42);

    fireEvent.pointerUp(canvas, {
      clientX: 100,
      clientY: 100,
      pointerId: 42,
    });

    expect(Element.prototype.releasePointerCapture).toHaveBeenCalledWith(42);
  });

  it("does not release pointer capture when not dragging", () => {
    render(
      <InfiniteCanvas
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onViewportChange={vi.fn()}
      />,
    );
    const canvas = screen.getByTestId("infinite-canvas");

    // pointerUp without prior pointerDown should not call releasePointerCapture
    fireEvent.pointerUp(canvas, {
      clientX: 100,
      clientY: 100,
      pointerId: 42,
    });

    expect(Element.prototype.releasePointerCapture).not.toHaveBeenCalled();
  });
});

describe("InfiniteCanvas zooming (ctrlKey=true, trackpad pinch)", () => {
  beforeEach(() => {
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
  });

  it("zooms on wheel with ctrlKey (trackpad pinch)", () => {
    const onViewportChange = vi.fn();
    render(
      <InfiniteCanvas
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onViewportChange={onViewportChange}
      />,
    );
    const canvas = screen.getByTestId("infinite-canvas");

    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.wheel(canvas, {
      deltaY: -100,
      clientX: 400,
      clientY: 300,
      ctrlKey: true,
    });

    expect(onViewportChange).toHaveBeenCalledTimes(1);
    const newViewport = onViewportChange.mock.calls[0]![0];
    expect(newViewport.scale).toBeGreaterThan(1);
  });

  it("zooms centered on cursor position", () => {
    const onViewportChange = vi.fn();
    render(
      <InfiniteCanvas
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onViewportChange={onViewportChange}
      />,
    );
    const canvas = screen.getByTestId("infinite-canvas");

    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.wheel(canvas, {
      deltaY: -100,
      clientX: 0,
      clientY: 0,
      ctrlKey: true,
    });

    expect(onViewportChange).toHaveBeenCalledTimes(1);
    const newViewport = onViewportChange.mock.calls[0]![0];
    expect(newViewport.offsetX).toBeCloseTo(0);
    expect(newViewport.offsetY).toBeCloseTo(0);
  });

  it("respects minScale prop", () => {
    const onViewportChange = vi.fn();
    render(
      <InfiniteCanvas
        viewport={{ offsetX: 0, offsetY: 0, scale: 0.5 }}
        onViewportChange={onViewportChange}
        minScale={0.5}
      />,
    );
    const canvas = screen.getByTestId("infinite-canvas");

    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.wheel(canvas, {
      deltaY: 100,
      clientX: 400,
      clientY: 300,
      ctrlKey: true,
    });

    expect(onViewportChange).not.toHaveBeenCalled();
  });

  it("respects maxScale prop", () => {
    const onViewportChange = vi.fn();
    render(
      <InfiniteCanvas
        viewport={{ offsetX: 0, offsetY: 0, scale: 3 }}
        onViewportChange={onViewportChange}
        maxScale={3}
      />,
    );
    const canvas = screen.getByTestId("infinite-canvas");

    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.wheel(canvas, {
      deltaY: -100,
      clientX: 400,
      clientY: 300,
      ctrlKey: true,
    });

    expect(onViewportChange).not.toHaveBeenCalled();
  });

  it("attaches onWheel handler to the container", () => {
    render(<InfiniteCanvas />);
    const canvas = screen.getByTestId("infinite-canvas");
    fireEvent.wheel(canvas, {
      deltaY: 100,
      clientX: 0,
      clientY: 0,
      ctrlKey: true,
    });
  });
});

describe("InfiniteCanvas trackpad two-finger scroll (pan)", () => {
  beforeEach(() => {
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
  });

  it("pans on wheel without ctrlKey (two-finger scroll)", () => {
    const onViewportChange = vi.fn();
    render(
      <InfiniteCanvas
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onViewportChange={onViewportChange}
      />,
    );
    const canvas = screen.getByTestId("infinite-canvas");

    fireEvent.wheel(canvas, {
      deltaX: 30,
      deltaY: 50,
      clientX: 400,
      clientY: 300,
      ctrlKey: false,
    });

    expect(onViewportChange).toHaveBeenCalledTimes(1);
    const newViewport = onViewportChange.mock.calls[0]![0];
    expect(newViewport.scale).toBe(1);
    expect(newViewport.offsetX).toBe(-30);
    expect(newViewport.offsetY).toBe(-50);
  });

  it("does not zoom on regular wheel scroll", () => {
    const onViewportChange = vi.fn();
    render(
      <InfiniteCanvas
        viewport={{ offsetX: 0, offsetY: 0, scale: 2 }}
        onViewportChange={onViewportChange}
      />,
    );
    const canvas = screen.getByTestId("infinite-canvas");

    fireEvent.wheel(canvas, {
      deltaY: -100,
      clientX: 400,
      clientY: 300,
      ctrlKey: false,
    });

    expect(onViewportChange).toHaveBeenCalledTimes(1);
    const newViewport = onViewportChange.mock.calls[0]![0];
    // Scale should remain unchanged
    expect(newViewport.scale).toBe(2);
  });
});
