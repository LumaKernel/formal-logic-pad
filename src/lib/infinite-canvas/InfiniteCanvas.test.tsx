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
      "var(--color-canvas-dot, #c8bfb0)",
    );
  });

  it("uses CSS variable as default background color", () => {
    render(<InfiniteCanvas />);
    const canvas = screen.getByTestId("infinite-canvas");
    expect(canvas.style.backgroundColor).toBe(
      "var(--color-canvas-bg, #f5f0e8)",
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

  it("disables browser native text selection", () => {
    render(<InfiniteCanvas />);
    const canvas = screen.getByTestId("infinite-canvas");
    expect(canvas.style.userSelect).toBe("none");
  });
});

describe("InfiniteCanvas grid lines", () => {
  it("renders grid line pattern by default (majorGridEvery=5)", () => {
    render(<InfiniteCanvas />);
    const canvas = screen.getByTestId("infinite-canvas");
    const patterns = canvas.querySelectorAll("pattern");
    // Two patterns: dot pattern + grid line pattern
    expect(patterns).toHaveLength(2);
    const gridLinePattern = patterns[1];
    const lines = gridLinePattern?.querySelectorAll("line");
    // Two lines: horizontal + vertical
    expect(lines).toHaveLength(2);
  });

  it("uses CSS variable as default grid line color", () => {
    render(<InfiniteCanvas />);
    const canvas = screen.getByTestId("infinite-canvas");
    const patterns = canvas.querySelectorAll("pattern");
    const gridLinePattern = patterns[1];
    const lines = gridLinePattern?.querySelectorAll("line");
    expect(lines?.[0]?.getAttribute("stroke")).toBe(
      "var(--color-canvas-grid-line, rgba(80, 60, 40, 0.08))",
    );
    expect(lines?.[1]?.getAttribute("stroke")).toBe(
      "var(--color-canvas-grid-line, rgba(80, 60, 40, 0.08))",
    );
  });

  it("uses custom grid line color when provided via props", () => {
    render(<InfiniteCanvas gridLineColor="#ff0000" />);
    const canvas = screen.getByTestId("infinite-canvas");
    const patterns = canvas.querySelectorAll("pattern");
    const gridLinePattern = patterns[1];
    const lines = gridLinePattern?.querySelectorAll("line");
    expect(lines?.[0]?.getAttribute("stroke")).toBe("#ff0000");
  });

  it("uses custom grid line width when provided via props", () => {
    render(<InfiniteCanvas gridLineWidth={2} />);
    const canvas = screen.getByTestId("infinite-canvas");
    const patterns = canvas.querySelectorAll("pattern");
    const gridLinePattern = patterns[1];
    const lines = gridLinePattern?.querySelectorAll("line");
    expect(lines?.[0]?.getAttribute("stroke-width")).toBe("2");
  });

  it("sets grid line pattern size to dotSpacing * majorGridEvery * scale", () => {
    render(
      <InfiniteCanvas
        dotSpacing={20}
        majorGridEvery={5}
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
      />,
    );
    const canvas = screen.getByTestId("infinite-canvas");
    const patterns = canvas.querySelectorAll("pattern");
    const gridLinePattern = patterns[1];
    // 20 * 5 * 1 = 100
    expect(gridLinePattern?.getAttribute("width")).toBe("100");
    expect(gridLinePattern?.getAttribute("height")).toBe("100");
  });

  it("scales grid line pattern with viewport scale", () => {
    render(
      <InfiniteCanvas
        dotSpacing={20}
        majorGridEvery={5}
        viewport={{ offsetX: 0, offsetY: 0, scale: 2 }}
      />,
    );
    const canvas = screen.getByTestId("infinite-canvas");
    const patterns = canvas.querySelectorAll("pattern");
    const gridLinePattern = patterns[1];
    // 20 * 5 * 2 = 200
    expect(gridLinePattern?.getAttribute("width")).toBe("200");
    expect(gridLinePattern?.getAttribute("height")).toBe("200");
  });

  it("does not render grid lines when majorGridEvery is 0", () => {
    render(<InfiniteCanvas majorGridEvery={0} />);
    const canvas = screen.getByTestId("infinite-canvas");
    const patterns = canvas.querySelectorAll("pattern");
    // Only dot pattern, no grid line pattern
    expect(patterns).toHaveLength(1);
    const rects = canvas.querySelectorAll("rect");
    // Two rects: dot pattern fill + paper texture overlay
    expect(rects).toHaveLength(2);
  });

  it("applies viewport offset to grid line pattern position", () => {
    render(
      <InfiniteCanvas
        dotSpacing={20}
        majorGridEvery={5}
        viewport={{ offsetX: 150, offsetY: 250, scale: 1 }}
      />,
    );
    const canvas = screen.getByTestId("infinite-canvas");
    const patterns = canvas.querySelectorAll("pattern");
    const gridLinePattern = patterns[1];
    // 150 % 100 = 50, 250 % 100 = 50
    expect(gridLinePattern?.getAttribute("x")).toBe("50");
    expect(gridLinePattern?.getAttribute("y")).toBe("50");
  });

  it("renders three rect fills when grid lines are enabled", () => {
    render(<InfiniteCanvas />);
    const canvas = screen.getByTestId("infinite-canvas");
    const rects = canvas.querySelectorAll("rect");
    // Three rects: dot pattern fill + grid line pattern fill + paper texture overlay
    expect(rects).toHaveLength(3);
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

describe("InfiniteCanvas theme transitions", () => {
  it("applies background-color transition to the container", () => {
    render(<InfiniteCanvas />);
    const canvas = screen.getByTestId("infinite-canvas");
    expect(canvas.style.transition).toBe(
      "background-color var(--theme-transition-duration, 0s) ease",
    );
  });

  it("applies fill transition to dot circles", () => {
    render(<InfiniteCanvas />);
    const canvas = screen.getByTestId("infinite-canvas");
    const circle = canvas.querySelector("circle");
    expect(circle?.style.transition).toBe(
      "fill var(--theme-transition-duration, 0s) ease",
    );
  });

  it("applies stroke transition to grid lines", () => {
    render(<InfiniteCanvas />);
    const canvas = screen.getByTestId("infinite-canvas");
    const lines = canvas.querySelectorAll("line");
    expect(lines.length).toBe(2);
    for (const line of lines) {
      expect(line.style.transition).toBe(
        "stroke var(--theme-transition-duration, 0s) ease",
      );
    }
  });

  it("does not apply grid line transitions when grid lines are disabled", () => {
    render(<InfiniteCanvas majorGridEvery={0} />);
    const canvas = screen.getByTestId("infinite-canvas");
    const lines = canvas.querySelectorAll("line");
    expect(lines.length).toBe(0);
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

describe("InfiniteCanvas panEnabled prop", () => {
  beforeEach(() => {
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
  });

  it("disables panning when panEnabled is false", () => {
    const onViewportChange = vi.fn();
    render(
      <InfiniteCanvas
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onViewportChange={onViewportChange}
        panEnabled={false}
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
      clientX: 200,
      clientY: 200,
      pointerId: 1,
    });
    fireEvent.pointerUp(canvas, {
      clientX: 200,
      clientY: 200,
      pointerId: 1,
    });

    // Pan should not happen
    expect(onViewportChange).not.toHaveBeenCalled();
  });

  it("shows crosshair cursor when panEnabled is false", () => {
    render(<InfiniteCanvas panEnabled={false} />);
    const canvas = screen.getByTestId("infinite-canvas");
    expect(canvas.style.cursor).toBe("crosshair");
  });

  it("shows grab cursor when panEnabled is true (default)", () => {
    render(<InfiniteCanvas />);
    const canvas = screen.getByTestId("infinite-canvas");
    expect(canvas.style.cursor).toBe("grab");
  });
});

describe("InfiniteCanvas empty area event handlers", () => {
  beforeEach(() => {
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
  });

  it("calls onEmptyAreaPointerDown on pointerDown", () => {
    const handler = vi.fn();
    render(
      <InfiniteCanvas onEmptyAreaPointerDown={handler} panEnabled={false} />,
    );
    const canvas = screen.getByTestId("infinite-canvas");

    fireEvent.pointerDown(canvas, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("calls onEmptyAreaPointerMove on pointerMove", () => {
    const handler = vi.fn();
    render(
      <InfiniteCanvas onEmptyAreaPointerMove={handler} panEnabled={false} />,
    );
    const canvas = screen.getByTestId("infinite-canvas");

    fireEvent.pointerMove(canvas, {
      clientX: 200,
      clientY: 200,
      pointerId: 1,
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("calls onEmptyAreaPointerUp on pointerUp", () => {
    const handler = vi.fn();
    render(
      <InfiniteCanvas onEmptyAreaPointerUp={handler} panEnabled={false} />,
    );
    const canvas = screen.getByTestId("infinite-canvas");

    fireEvent.pointerUp(canvas, {
      clientX: 200,
      clientY: 200,
      pointerId: 1,
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("calls onEmptyAreaClick when click (not drag) on empty area", () => {
    const handler = vi.fn();
    render(<InfiniteCanvas onEmptyAreaClick={handler} />);
    const canvas = screen.getByTestId("infinite-canvas");

    fireEvent.pointerDown(canvas, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerUp(canvas, {
      button: 0,
      clientX: 102,
      clientY: 101,
      pointerId: 1,
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not call onEmptyAreaClick when drag (not click)", () => {
    const handler = vi.fn();
    render(<InfiniteCanvas onEmptyAreaClick={handler} />);
    const canvas = screen.getByTestId("infinite-canvas");

    fireEvent.pointerDown(canvas, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerUp(canvas, {
      button: 0,
      clientX: 200,
      clientY: 200,
      pointerId: 1,
    });

    expect(handler).not.toHaveBeenCalled();
  });
});

describe("InfiniteCanvas marquee rendering", () => {
  it("renders marquee overlay when marqueeRect is provided", () => {
    render(
      <InfiniteCanvas
        marqueeRect={{ x: 50, y: 60, width: 200, height: 150 }}
      />,
    );
    const overlay = screen.getByTestId("marquee-overlay");
    expect(overlay).toBeInTheDocument();
    const rect = overlay.querySelector("rect");
    expect(rect).not.toBeNull();
    expect(rect?.getAttribute("x")).toBe("50");
    expect(rect?.getAttribute("y")).toBe("60");
    expect(rect?.getAttribute("width")).toBe("200");
    expect(rect?.getAttribute("height")).toBe("150");
  });

  it("does not render marquee overlay when marqueeRect is null", () => {
    render(<InfiniteCanvas marqueeRect={null} />);
    expect(screen.queryByTestId("marquee-overlay")).toBeNull();
  });

  it("does not render marquee overlay for tiny rectangles (1px or less)", () => {
    render(
      <InfiniteCanvas marqueeRect={{ x: 50, y: 60, width: 1, height: 1 }} />,
    );
    expect(screen.queryByTestId("marquee-overlay")).toBeNull();
  });

  it("renders marquee with custom color", () => {
    render(
      <InfiniteCanvas
        marqueeRect={{ x: 0, y: 0, width: 100, height: 100 }}
        marqueeColor="#ff0000"
      />,
    );
    const overlay = screen.getByTestId("marquee-overlay");
    const rect = overlay.querySelector("rect");
    expect(rect?.getAttribute("stroke")).toBe("#ff0000");
  });
});
