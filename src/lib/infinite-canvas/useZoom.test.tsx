import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ViewportState } from "./types";
import { useZoom } from "./useZoom";

/** Test harness component that exposes useZoom result */
function ZoomTestHarness({
  viewport,
  onViewportChange,
  minScale,
  maxScale,
}: {
  readonly viewport: ViewportState;
  readonly onViewportChange: (v: ViewportState) => void;
  readonly minScale?: number;
  readonly maxScale?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const result = useZoom(
    viewport,
    onViewportChange,
    containerRef,
    minScale,
    maxScale,
  );

  return (
    <div
      ref={containerRef}
      data-testid="zoom-container"
      onWheel={result.onWheel}
      onPointerDown={result.onPinchPointerDown}
      onPointerMove={result.onPinchPointerMove}
      onPointerUp={result.onPinchPointerUp}
    />
  );
}

describe("useZoom - wheel", () => {
  it("calls onViewportChange on wheel event", () => {
    const onViewportChange = vi.fn();
    render(
      <ZoomTestHarness
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onViewportChange={onViewportChange}
      />,
    );
    const container = screen.getByTestId("zoom-container");

    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
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

    fireEvent.wheel(container, { deltaY: -100, clientX: 400, clientY: 300 });
    expect(onViewportChange).toHaveBeenCalledTimes(1);
    const newVp = onViewportChange.mock.calls[0]![0];
    expect(newVp.scale).toBeGreaterThan(1);
  });

  it("does not call onViewportChange if containerRef has no element", () => {
    const onViewportChange = vi.fn();
    // Render without ref by using a custom harness that doesn't set ref
    function NoRefHarness() {
      const containerRef = useRef<HTMLDivElement>(null);
      const result = useZoom(
        { offsetX: 0, offsetY: 0, scale: 1 },
        onViewportChange,
        containerRef,
      );
      // Don't assign ref to the div
      return <div data-testid="no-ref-container" onWheel={result.onWheel} />;
    }

    render(<NoRefHarness />);
    const container = screen.getByTestId("no-ref-container");
    fireEvent.wheel(container, { deltaY: -100, clientX: 100, clientY: 100 });
    expect(onViewportChange).not.toHaveBeenCalled();
  });
});

describe("useZoom - pinch", () => {
  beforeEach(() => {
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
  });

  it("zooms on two-finger pinch gesture", () => {
    const onViewportChange = vi.fn();
    render(
      <ZoomTestHarness
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onViewportChange={onViewportChange}
      />,
    );
    const container = screen.getByTestId("zoom-container");

    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
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

    // Two fingers down
    fireEvent.pointerDown(container, {
      pointerId: 1,
      clientX: 200,
      clientY: 300,
    });
    fireEvent.pointerDown(container, {
      pointerId: 2,
      clientX: 400,
      clientY: 300,
    });

    // Move fingers apart (zoom in)
    fireEvent.pointerMove(container, {
      pointerId: 1,
      clientX: 100,
      clientY: 300,
    });

    expect(onViewportChange).toHaveBeenCalled();
    const newVp = onViewportChange.mock.calls[0]![0];
    // Fingers moved farther apart, so scale should increase
    expect(newVp.scale).toBeGreaterThan(1);
  });

  it("does not zoom with only one finger", () => {
    const onViewportChange = vi.fn();
    render(
      <ZoomTestHarness
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onViewportChange={onViewportChange}
      />,
    );
    const container = screen.getByTestId("zoom-container");

    // One finger down
    fireEvent.pointerDown(container, {
      pointerId: 1,
      clientX: 200,
      clientY: 300,
    });

    // Move it
    fireEvent.pointerMove(container, {
      pointerId: 1,
      clientX: 300,
      clientY: 400,
    });

    // onViewportChange should not be called (single finger = no pinch)
    expect(onViewportChange).not.toHaveBeenCalled();
  });

  it("stops pinch zoom when a finger is lifted", () => {
    const onViewportChange = vi.fn();
    render(
      <ZoomTestHarness
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onViewportChange={onViewportChange}
      />,
    );
    const container = screen.getByTestId("zoom-container");

    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
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

    // Two fingers down
    fireEvent.pointerDown(container, {
      pointerId: 1,
      clientX: 200,
      clientY: 300,
    });
    fireEvent.pointerDown(container, {
      pointerId: 2,
      clientX: 400,
      clientY: 300,
    });

    // Lift one finger
    fireEvent.pointerUp(container, {
      pointerId: 2,
      clientX: 400,
      clientY: 300,
    });

    onViewportChange.mockClear();

    // Move remaining finger - should not zoom
    fireEvent.pointerMove(container, {
      pointerId: 1,
      clientX: 100,
      clientY: 200,
    });

    expect(onViewportChange).not.toHaveBeenCalled();
  });

  it("handles pointer move without container rect gracefully", () => {
    const onViewportChange = vi.fn();

    function NoRefPinchHarness() {
      const containerRef = useRef<HTMLDivElement>(null);
      const result = useZoom(
        { offsetX: 0, offsetY: 0, scale: 1 },
        onViewportChange,
        containerRef,
      );
      return (
        <div
          data-testid="no-ref-pinch"
          onPointerDown={result.onPinchPointerDown}
          onPointerMove={result.onPinchPointerMove}
          onPointerUp={result.onPinchPointerUp}
        />
      );
    }

    render(<NoRefPinchHarness />);
    const container = screen.getByTestId("no-ref-pinch");

    fireEvent.pointerDown(container, {
      pointerId: 1,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerDown(container, {
      pointerId: 2,
      clientX: 200,
      clientY: 200,
    });
    fireEvent.pointerMove(container, {
      pointerId: 1,
      clientX: 50,
      clientY: 50,
    });

    expect(onViewportChange).not.toHaveBeenCalled();
  });

  it("handles zero distance pinch gracefully", () => {
    const onViewportChange = vi.fn();
    render(
      <ZoomTestHarness
        viewport={{ offsetX: 0, offsetY: 0, scale: 1 }}
        onViewportChange={onViewportChange}
      />,
    );
    const container = screen.getByTestId("zoom-container");

    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
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

    // Two fingers at the same position
    fireEvent.pointerDown(container, {
      pointerId: 1,
      clientX: 300,
      clientY: 300,
    });
    fireEvent.pointerDown(container, {
      pointerId: 2,
      clientX: 300,
      clientY: 300,
    });

    // Move one finger - currentDist or lastDist is 0, should bail out
    fireEvent.pointerMove(container, {
      pointerId: 1,
      clientX: 301,
      clientY: 300,
    });

    // Should not crash; may or may not call onChange depending on zero check
    // The key is no crash
  });
});
