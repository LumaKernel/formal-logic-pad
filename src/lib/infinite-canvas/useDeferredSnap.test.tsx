import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SnapConfig } from "./snap";
import type { Point } from "./types";
import {
  DEFERRED_SNAP_CONFIG_DISABLED,
  type DeferredSnapConfig,
  useDeferredSnap,
} from "./useDeferredSnap";

function TestHarness({
  rawPosition,
  config,
  onPositionChange,
  triggerSnapAt,
}: {
  readonly rawPosition: Point;
  readonly config: DeferredSnapConfig;
  readonly onPositionChange: (pos: Point) => void;
  readonly triggerSnapAt?: Point;
}) {
  const state = useDeferredSnap(rawPosition, config, onPositionChange);

  return (
    <div data-testid="deferred-snap">
      <span data-testid="snap-target">
        {state.snapTarget !== null
          ? `${state.snapTarget.x.toFixed(2) satisfies string},${state.snapTarget.y.toFixed(2) satisfies string}`
          : "null"}
      </span>
      <span data-testid="is-animating">
        {state.isAnimating ? "true" : "false"}
      </span>
      <button
        data-testid="trigger-snap"
        onClick={() => {
          state.triggerSnap(triggerSnapAt ?? rawPosition);
        }}
      />
    </div>
  );
}

const GRID_SNAP_CONFIG: SnapConfig = { enabled: true, gridSpacing: 20 };
const DEFERRED_CONFIG: DeferredSnapConfig = {
  snapConfig: GRID_SNAP_CONFIG,
  durationMs: 150,
};

describe("useDeferredSnap", () => {
  it("returns null snap target when snap is disabled", () => {
    render(
      <TestHarness
        rawPosition={{ x: 13, y: 27 }}
        config={DEFERRED_SNAP_CONFIG_DISABLED}
        onPositionChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("snap-target").textContent).toBe("null");
    expect(screen.getByTestId("is-animating").textContent).toBe("false");
  });

  it("computes snap target when snap is enabled", () => {
    render(
      <TestHarness
        rawPosition={{ x: 13, y: 27 }}
        config={DEFERRED_CONFIG}
        onPositionChange={vi.fn()}
      />,
    );

    // Snap target: 13 → 20, 27 → 20
    expect(screen.getByTestId("snap-target").textContent).toBe("20.00,20.00");
  });

  it("updates snap target as position changes", () => {
    const { rerender } = render(
      <TestHarness
        rawPosition={{ x: 13, y: 27 }}
        config={DEFERRED_CONFIG}
        onPositionChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("snap-target").textContent).toBe("20.00,20.00");

    rerender(
      <TestHarness
        rawPosition={{ x: 35, y: 45 }}
        config={DEFERRED_CONFIG}
        onPositionChange={vi.fn()}
      />,
    );

    // Snap target: 35 → 40, 45 → 40
    expect(screen.getByTestId("snap-target").textContent).toBe("40.00,40.00");
  });

  it("starts animation when triggerSnap is called with distant position", () => {
    const onPositionChange = vi.fn();

    // Mock requestAnimationFrame
    let rafCallback: ((time: number) => void) | null = null;
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });
    vi.spyOn(globalThis, "cancelAnimationFrame").mockImplementation(vi.fn());

    render(
      <TestHarness
        rawPosition={{ x: 13, y: 27 }}
        config={DEFERRED_CONFIG}
        onPositionChange={onPositionChange}
        triggerSnapAt={{ x: 13, y: 27 }}
      />,
    );

    // Trigger snap via button click
    act(() => {
      screen.getByTestId("trigger-snap").click();
    });

    // Animation should have been requested
    expect(globalThis.requestAnimationFrame).toHaveBeenCalled();
    expect(screen.getByTestId("is-animating").textContent).toBe("true");

    // Simulate animation frame at halfway point
    const now = performance.now();
    act(() => {
      rafCallback?.(now + 75); // 50% progress
    });

    // onPositionChange should have been called with intermediate position
    expect(onPositionChange).toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it("snaps immediately when distance is negligible", () => {
    const onPositionChange = vi.fn();

    render(
      <TestHarness
        rawPosition={{ x: 20.1, y: 20.1 }}
        config={DEFERRED_CONFIG}
        onPositionChange={onPositionChange}
        triggerSnapAt={{ x: 20.1, y: 20.1 }}
      />,
    );

    // Trigger snap
    act(() => {
      screen.getByTestId("trigger-snap").click();
    });

    // Should snap immediately without animation
    expect(onPositionChange).toHaveBeenCalledWith({ x: 20, y: 20 });
    expect(screen.getByTestId("is-animating").textContent).toBe("false");
  });

  it("does not animate when snap is disabled", () => {
    const onPositionChange = vi.fn();

    render(
      <TestHarness
        rawPosition={{ x: 13, y: 27 }}
        config={DEFERRED_SNAP_CONFIG_DISABLED}
        onPositionChange={onPositionChange}
        triggerSnapAt={{ x: 13, y: 27 }}
      />,
    );

    act(() => {
      screen.getByTestId("trigger-snap").click();
    });

    expect(onPositionChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("is-animating").textContent).toBe("false");
  });

  it("cancels previous animation when triggerSnap is called again", () => {
    const onPositionChange = vi.fn();
    const cancelSpy = vi
      .spyOn(globalThis, "cancelAnimationFrame")
      .mockImplementation(vi.fn());
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation(() => 42);

    render(
      <TestHarness
        rawPosition={{ x: 13, y: 27 }}
        config={DEFERRED_CONFIG}
        onPositionChange={onPositionChange}
        triggerSnapAt={{ x: 13, y: 27 }}
      />,
    );

    // First snap
    act(() => {
      screen.getByTestId("trigger-snap").click();
    });

    // Second snap should cancel first
    act(() => {
      screen.getByTestId("trigger-snap").click();
    });

    expect(cancelSpy).toHaveBeenCalledWith(42);

    vi.restoreAllMocks();
  });

  it("completes animation at exact snap position", () => {
    const onPositionChange = vi.fn();

    let rafCallback: ((time: number) => void) | null = null;
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });
    vi.spyOn(globalThis, "cancelAnimationFrame").mockImplementation(vi.fn());

    render(
      <TestHarness
        rawPosition={{ x: 13, y: 27 }}
        config={DEFERRED_CONFIG}
        onPositionChange={onPositionChange}
        triggerSnapAt={{ x: 13, y: 27 }}
      />,
    );

    act(() => {
      screen.getByTestId("trigger-snap").click();
    });

    // Simulate animation completion (beyond duration)
    const now = performance.now();
    act(() => {
      rafCallback?.(now + 200); // past 150ms duration
    });

    // Should have been called with exact snap position
    const lastCall =
      onPositionChange.mock.calls[onPositionChange.mock.calls.length - 1];
    expect(lastCall?.[0]).toEqual({ x: 20, y: 20 });

    vi.restoreAllMocks();
  });
});
