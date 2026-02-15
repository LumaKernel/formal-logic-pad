import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDragItem } from "./useDragItem";

function TestHarness({
  positionX,
  positionY,
  scale,
  onPositionChange,
}: {
  readonly positionX: number;
  readonly positionY: number;
  readonly scale: number;
  readonly onPositionChange: (p: {
    readonly x: number;
    readonly y: number;
  }) => void;
}) {
  const { isDragging, onPointerDown, onPointerMove, onPointerUp } = useDragItem(
    { x: positionX, y: positionY },
    scale,
    onPositionChange,
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
        scale={1}
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
        scale={1}
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
        scale={1}
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

    expect(onPositionChange).toHaveBeenCalledWith({ x: 70, y: 80 });
  });

  it("scales screen delta by viewport scale", () => {
    const onPositionChange = vi.fn();
    render(
      <TestHarness
        positionX={0}
        positionY={0}
        scale={2}
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

    // delta is (20, 40), divided by scale 2 → (10, 20)
    expect(onPositionChange).toHaveBeenCalledWith({ x: 10, y: 20 });
  });

  it("stops dragging on pointerUp", () => {
    render(
      <TestHarness
        positionX={0}
        positionY={0}
        scale={1}
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
        scale={1}
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
        scale={1}
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
        scale={1}
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
          scale={1}
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
        scale={1}
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
});
