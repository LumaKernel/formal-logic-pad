import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useContextMenu, useLongPress } from "./useContextMenu";

function TestContextMenu() {
  const { menuState, onContextMenu, open, close, menuRef } = useContextMenu();
  return (
    <div>
      <div data-testid="target" onContextMenu={onContextMenu}>
        Right-click me
      </div>
      <button
        data-testid="open-btn"
        onClick={() => {
          open(100, 200);
        }}
      >
        Open
      </button>
      <button data-testid="close-btn" onClick={close}>
        Close
      </button>
      {menuState.open && (
        <div data-testid="menu" ref={menuRef}>
          Menu at ({menuState.screenPosition.x}, {menuState.screenPosition.y})
        </div>
      )}
      <div data-testid="state">{menuState.open ? "open" : "closed"}</div>
    </div>
  );
}

describe("useContextMenu", () => {
  it("starts with closed state", () => {
    render(<TestContextMenu />);
    expect(screen.getByTestId("state").textContent).toBe("closed");
    expect(screen.queryByTestId("menu")).toBeNull();
  });

  it("opens on right-click", () => {
    render(<TestContextMenu />);
    const target = screen.getByTestId("target");

    fireEvent.contextMenu(target, { clientX: 150, clientY: 250 });

    expect(screen.getByTestId("state").textContent).toBe("open");
    expect(screen.getByTestId("menu")).toBeInTheDocument();
    expect(screen.getByTestId("menu").textContent).toBe("Menu at (150, 250)");
  });

  it("opens programmatically via open()", () => {
    render(<TestContextMenu />);
    const openBtn = screen.getByTestId("open-btn");

    fireEvent.click(openBtn);

    expect(screen.getByTestId("state").textContent).toBe("open");
    expect(screen.getByTestId("menu").textContent).toBe("Menu at (100, 200)");
  });

  it("closes via close()", () => {
    render(<TestContextMenu />);
    const openBtn = screen.getByTestId("open-btn");
    const closeBtn = screen.getByTestId("close-btn");

    fireEvent.click(openBtn);
    expect(screen.getByTestId("state").textContent).toBe("open");

    fireEvent.click(closeBtn);
    expect(screen.getByTestId("state").textContent).toBe("closed");
  });

  it("closes on outside pointerdown", async () => {
    render(<TestContextMenu />);
    const openBtn = screen.getByTestId("open-btn");

    fireEvent.click(openBtn);
    expect(screen.getByTestId("state").textContent).toBe("open");

    // Advance rAF so the listener is attached
    await act(async () => {
      await new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
    });

    // Click outside the menu
    fireEvent.pointerDown(document.body);

    expect(screen.getByTestId("state").textContent).toBe("closed");
  });

  it("does not close when clicking inside the menu", async () => {
    render(<TestContextMenu />);
    const openBtn = screen.getByTestId("open-btn");

    fireEvent.click(openBtn);

    await act(async () => {
      await new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
    });

    // Click inside the menu
    fireEvent.pointerDown(screen.getByTestId("menu"));

    expect(screen.getByTestId("state").textContent).toBe("open");
  });

  it("prevents default on contextmenu event", () => {
    render(<TestContextMenu />);
    const target = screen.getByTestId("target");

    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 100,
    });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    act(() => {
      target.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});

describe("useLongPress", () => {
  function TestLongPress({
    onLongPress,
  }: {
    readonly onLongPress: (x: number, y: number) => void;
  }) {
    const { onPointerDown, onPointerMove, onPointerUp } =
      useLongPress(onLongPress);
    return (
      <div
        data-testid="longpress-target"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        Long press me
      </div>
    );
  }

  it("triggers callback after long press duration", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    render(<TestLongPress onLongPress={onLongPress} />);

    const target = screen.getByTestId("longpress-target");
    fireEvent.pointerDown(target, {
      pointerType: "touch",
      clientX: 100,
      clientY: 200,
    });

    expect(onLongPress).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);

    expect(onLongPress).toHaveBeenCalledWith(100, 200);
    vi.useRealTimers();
  });

  it("does not trigger for non-touch pointerType", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    render(<TestLongPress onLongPress={onLongPress} />);

    const target = screen.getByTestId("longpress-target");
    fireEvent.pointerDown(target, {
      pointerType: "mouse",
      clientX: 100,
      clientY: 200,
    });

    vi.advanceTimersByTime(600);
    expect(onLongPress).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("cancels on pointer up before duration", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    render(<TestLongPress onLongPress={onLongPress} />);

    const target = screen.getByTestId("longpress-target");
    fireEvent.pointerDown(target, {
      pointerType: "touch",
      clientX: 100,
      clientY: 200,
    });

    vi.advanceTimersByTime(200);
    fireEvent.pointerUp(target);
    vi.advanceTimersByTime(400);

    expect(onLongPress).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("cancels when pointer moves beyond tolerance", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    render(<TestLongPress onLongPress={onLongPress} />);

    const target = screen.getByTestId("longpress-target");
    fireEvent.pointerDown(target, {
      pointerType: "touch",
      clientX: 100,
      clientY: 200,
    });

    // Move beyond tolerance (10px)
    fireEvent.pointerMove(target, {
      clientX: 115,
      clientY: 200,
    });

    vi.advanceTimersByTime(600);
    expect(onLongPress).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("does not cancel for small movement within tolerance", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    render(<TestLongPress onLongPress={onLongPress} />);

    const target = screen.getByTestId("longpress-target");
    fireEvent.pointerDown(target, {
      pointerType: "touch",
      clientX: 100,
      clientY: 200,
    });

    // Small movement within tolerance
    fireEvent.pointerMove(target, {
      clientX: 105,
      clientY: 203,
    });

    vi.advanceTimersByTime(500);
    expect(onLongPress).toHaveBeenCalledWith(100, 200);
    vi.useRealTimers();
  });
});
