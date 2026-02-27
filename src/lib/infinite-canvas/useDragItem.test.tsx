import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SnapConfig } from "./snap";
import type { ViewportState } from "./types";
import { useDragItem } from "./useDragItem";

function TestHarness({
  positionX,
  positionY,
  viewport,
  onPositionChange,
  snapConfig,
}: {
  readonly positionX: number;
  readonly positionY: number;
  readonly viewport: ViewportState;
  readonly onPositionChange: (p: {
    readonly x: number;
    readonly y: number;
  }) => void;
  readonly snapConfig?: SnapConfig;
}) {
  const { isDragging, onPointerDown, onPointerMove, onPointerUp } = useDragItem(
    { x: positionX, y: positionY },
    viewport,
    onPositionChange,
    snapConfig,
  );

  return (
    <div
      data-testid="drag-target"
      data-dragging={isDragging ? "true" : "false"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  );
}

const DEFAULT_VIEWPORT: ViewportState = { offsetX: 0, offsetY: 0, scale: 1 };

describe("useDragItem", () => {
  beforeEach(() => {
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
  });

  it("is not dragging initially", () => {
    render(
      <TestHarness
        positionX={0}
        positionY={0}
        viewport={DEFAULT_VIEWPORT}
        onPositionChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId("drag-target").dataset["dragging"]).toBe("false");
  });

  it("starts dragging on pointerDown", () => {
    render(
      <TestHarness
        positionX={0}
        positionY={0}
        viewport={DEFAULT_VIEWPORT}
        onPositionChange={vi.fn()}
      />,
    );
    const target = screen.getByTestId("drag-target");
    fireEvent.pointerDown(target, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    expect(target.dataset["dragging"]).toBe("true");
  });

  it("calls onPositionChange on drag move at scale 1", () => {
    const onPositionChange = vi.fn();
    render(
      <TestHarness
        positionX={50}
        positionY={50}
        viewport={DEFAULT_VIEWPORT}
        onPositionChange={onPositionChange}
      />,
    );
    const target = screen.getByTestId("drag-target");

    fireEvent.pointerDown(target, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerMove(target, {
      clientX: 120,
      clientY: 130,
      pointerId: 1,
    });

    // grab offset = cursor(100,100) - item(50,50) = (50,50)
    // new pos = cursor(120,130) - grabOffset(50,50) = (70,80)
    expect(onPositionChange).toHaveBeenCalledWith({ x: 70, y: 80 });
  });

  it("scales screen coordinates by viewport scale", () => {
    const onPositionChange = vi.fn();
    const viewport: ViewportState = { offsetX: 0, offsetY: 0, scale: 2 };
    render(
      <TestHarness
        positionX={0}
        positionY={0}
        viewport={viewport}
        onPositionChange={onPositionChange}
      />,
    );
    const target = screen.getByTestId("drag-target");

    fireEvent.pointerDown(target, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerMove(target, {
      clientX: 120,
      clientY: 140,
      pointerId: 1,
    });

    // grab offset = (100/2 - 0, 100/2 - 0) = (50, 50)
    // new pos = (120/2 - 50, 140/2 - 50) = (10, 20)
    expect(onPositionChange).toHaveBeenCalledWith({ x: 10, y: 20 });
  });

  it("stops dragging on pointerUp", () => {
    render(
      <TestHarness
        positionX={0}
        positionY={0}
        viewport={DEFAULT_VIEWPORT}
        onPositionChange={vi.fn()}
      />,
    );
    const target = screen.getByTestId("drag-target");

    fireEvent.pointerDown(target, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    expect(target.dataset["dragging"]).toBe("true");

    fireEvent.pointerUp(target, {
      clientX: 120,
      clientY: 120,
      pointerId: 1,
    });
    expect(target.dataset["dragging"]).toBe("false");
  });

  it("does not move when not dragging", () => {
    const onPositionChange = vi.fn();
    render(
      <TestHarness
        positionX={0}
        positionY={0}
        viewport={DEFAULT_VIEWPORT}
        onPositionChange={onPositionChange}
      />,
    );
    const target = screen.getByTestId("drag-target");

    fireEvent.pointerMove(target, {
      clientX: 120,
      clientY: 130,
      pointerId: 1,
    });

    expect(onPositionChange).not.toHaveBeenCalled();
  });

  it("ignores right-click", () => {
    render(
      <TestHarness
        positionX={0}
        positionY={0}
        viewport={DEFAULT_VIEWPORT}
        onPositionChange={vi.fn()}
      />,
    );
    const target = screen.getByTestId("drag-target");

    fireEvent.pointerDown(target, {
      button: 2,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    expect(target.dataset["dragging"]).toBe("false");
  });

  it("captures and releases pointer", () => {
    render(
      <TestHarness
        positionX={0}
        positionY={0}
        viewport={DEFAULT_VIEWPORT}
        onPositionChange={vi.fn()}
      />,
    );
    const target = screen.getByTestId("drag-target");

    fireEvent.pointerDown(target, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 7,
    });
    expect(Element.prototype.setPointerCapture).toHaveBeenCalledWith(7);

    fireEvent.pointerUp(target, {
      clientX: 100,
      clientY: 100,
      pointerId: 7,
    });
    expect(Element.prototype.releasePointerCapture).toHaveBeenCalledWith(7);
  });

  it("stops propagation on pointerDown to prevent canvas pan", () => {
    const onPositionChange = vi.fn();
    const parentHandler = vi.fn();
    render(
      <div onPointerDown={parentHandler}>
        <TestHarness
          positionX={0}
          positionY={0}
          viewport={DEFAULT_VIEWPORT}
          onPositionChange={onPositionChange}
        />
      </div>,
    );
    const target = screen.getByTestId("drag-target");

    fireEvent.pointerDown(target, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });

    expect(parentHandler).not.toHaveBeenCalled();
  });

  it("does not release pointer capture when not dragging", () => {
    render(
      <TestHarness
        positionX={0}
        positionY={0}
        viewport={DEFAULT_VIEWPORT}
        onPositionChange={vi.fn()}
      />,
    );
    const target = screen.getByTestId("drag-target");

    fireEvent.pointerUp(target, {
      clientX: 100,
      clientY: 100,
      pointerId: 7,
    });
    expect(Element.prototype.releasePointerCapture).not.toHaveBeenCalled();
  });

  it("snaps position to grid when snap is enabled", () => {
    const onPositionChange = vi.fn();
    const snapConfig: SnapConfig = { enabled: true, gridSpacing: 20 };
    render(
      <TestHarness
        positionX={0}
        positionY={0}
        viewport={DEFAULT_VIEWPORT}
        onPositionChange={onPositionChange}
        snapConfig={snapConfig}
      />,
    );
    const target = screen.getByTestId("drag-target");

    fireEvent.pointerDown(target, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    // grab offset = (100 - 0, 100 - 0) = (100, 100)
    // Move to (112, 118) → raw pos = (112 - 100, 118 - 100) = (12, 18) → snap to (20, 20)
    fireEvent.pointerMove(target, {
      clientX: 112,
      clientY: 118,
      pointerId: 1,
    });

    expect(onPositionChange).toHaveBeenCalledWith({ x: 20, y: 20 });
  });

  it("does not snap when snap is disabled (default)", () => {
    const onPositionChange = vi.fn();
    render(
      <TestHarness
        positionX={0}
        positionY={0}
        viewport={DEFAULT_VIEWPORT}
        onPositionChange={onPositionChange}
      />,
    );
    const target = screen.getByTestId("drag-target");

    fireEvent.pointerDown(target, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerMove(target, {
      clientX: 112,
      clientY: 118,
      pointerId: 1,
    });

    // grab offset = (100, 100), new pos = (112-100, 118-100) = (12, 18)
    expect(onPositionChange).toHaveBeenCalledWith({ x: 12, y: 18 });
  });

  it("snaps with custom grid spacing", () => {
    const onPositionChange = vi.fn();
    const snapConfig: SnapConfig = { enabled: true, gridSpacing: 50 };
    render(
      <TestHarness
        positionX={0}
        positionY={0}
        viewport={DEFAULT_VIEWPORT}
        onPositionChange={onPositionChange}
        snapConfig={snapConfig}
      />,
    );
    const target = screen.getByTestId("drag-target");

    fireEvent.pointerDown(target, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    // grab offset = (100, 100), raw pos = (130-100, 180-100) = (30, 80) → snap to (50, 100) with gridSpacing=50
    fireEvent.pointerMove(target, {
      clientX: 130,
      clientY: 180,
      pointerId: 1,
    });

    expect(onPositionChange).toHaveBeenCalledWith({ x: 50, y: 100 });
  });

  it("maintains cursor-to-item offset with viewport offset", () => {
    const onPositionChange = vi.fn();
    // Viewport with pan offset: item at world (50,50) appears at screen (150,250)
    const viewport: ViewportState = { offsetX: 100, offsetY: 200, scale: 1 };
    render(
      <TestHarness
        positionX={50}
        positionY={50}
        viewport={viewport}
        onPositionChange={onPositionChange}
      />,
    );
    const target = screen.getByTestId("drag-target");

    // Start drag at screen (160, 260) → world cursor = (160-100, 260-200) = (60, 60)
    // grab offset = (60-50, 60-50) = (10, 10)
    fireEvent.pointerDown(target, {
      button: 0,
      clientX: 160,
      clientY: 260,
      pointerId: 1,
    });
    // Move to screen (180, 290) → world cursor = (180-100, 290-200) = (80, 90)
    // new pos = (80-10, 90-10) = (70, 80)
    fireEvent.pointerMove(target, {
      clientX: 180,
      clientY: 290,
      pointerId: 1,
    });

    expect(onPositionChange).toHaveBeenCalledWith({ x: 70, y: 80 });
  });

  it("snap does not accumulate offset drift across multiple moves", () => {
    const onPositionChange = vi.fn();
    const snapConfig: SnapConfig = { enabled: true, gridSpacing: 20 };
    render(
      <TestHarness
        positionX={0}
        positionY={0}
        viewport={DEFAULT_VIEWPORT}
        onPositionChange={onPositionChange}
        snapConfig={snapConfig}
      />,
    );
    const target = screen.getByTestId("drag-target");

    // grab at screen (50, 50) → world cursor = (50, 50), grab offset = (50, 50)
    fireEvent.pointerDown(target, {
      button: 0,
      clientX: 50,
      clientY: 50,
      pointerId: 1,
    });

    // Move 1: screen (55, 55) → raw (5, 5) → snap to (0, 0)
    fireEvent.pointerMove(target, { clientX: 55, clientY: 55, pointerId: 1 });
    expect(onPositionChange).toHaveBeenLastCalledWith({ x: 0, y: 0 });

    // Move 2: screen (60, 60) → raw (10, 10) → snap to (20, 20)
    fireEvent.pointerMove(target, { clientX: 60, clientY: 60, pointerId: 1 });
    expect(onPositionChange).toHaveBeenLastCalledWith({ x: 20, y: 20 });

    // Move 3: screen (65, 65) → raw (15, 15) → snap to (20, 20)
    fireEvent.pointerMove(target, { clientX: 65, clientY: 65, pointerId: 1 });
    expect(onPositionChange).toHaveBeenLastCalledWith({ x: 20, y: 20 });

    // Move 4: screen (80, 80) → raw (30, 30) → snap to (40, 40) [Math.round(30/20)=2, 2*20=40]
    fireEvent.pointerMove(target, { clientX: 80, clientY: 80, pointerId: 1 });
    expect(onPositionChange).toHaveBeenLastCalledWith({ x: 40, y: 40 });

    // Move 5: screen (90, 90) → raw (40, 40) → snap to (40, 40)
    fireEvent.pointerMove(target, { clientX: 90, clientY: 90, pointerId: 1 });
    expect(onPositionChange).toHaveBeenLastCalledWith({ x: 40, y: 40 });
  });
});
