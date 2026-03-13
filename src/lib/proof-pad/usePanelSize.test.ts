/**
 * usePanelSize フックのテスト。
 *
 * JSDOM環境ではResizeObserverが利用不可のため、
 * getBoundingClientRect による初回計測とフォールバック動作をテストする。
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePanelSize } from "./usePanelSize";

describe("usePanelSize", () => {
  it("returns fallback size initially", () => {
    const fallback = { width: 200, height: 150 };
    const { result } = renderHook(() => usePanelSize(fallback));
    expect(result.current.size).toEqual(fallback);
  });

  it("returns a ref callback function", () => {
    const { result } = renderHook(() =>
      usePanelSize({ width: 100, height: 100 }),
    );
    expect(typeof result.current.ref).toBe("function");
  });

  it("measures size from getBoundingClientRect when ref is called", () => {
    const { result } = renderHook(() =>
      usePanelSize({ width: 100, height: 100 }),
    );

    const mockElement = document.createElement("div");
    Object.defineProperty(mockElement, "getBoundingClientRect", {
      value: () => ({
        width: 250,
        height: 180,
        x: 0,
        y: 0,
        top: 0,
        right: 250,
        bottom: 180,
        left: 0,
        toJSON: () => undefined,
      }),
    });

    act(() => {
      result.current.ref(mockElement);
    });

    expect(result.current.size).toEqual({ width: 250, height: 180 });
  });

  it("resets to fallback-like behavior when ref is called with null", () => {
    const fallback = { width: 100, height: 100 };
    const { result } = renderHook(() => usePanelSize(fallback));

    const mockElement = document.createElement("div");
    Object.defineProperty(mockElement, "getBoundingClientRect", {
      value: () => ({
        width: 300,
        height: 200,
        x: 0,
        y: 0,
        top: 0,
        right: 300,
        bottom: 200,
        left: 0,
        toJSON: () => undefined,
      }),
    });

    act(() => {
      result.current.ref(mockElement);
    });
    expect(result.current.size).toEqual({ width: 300, height: 200 });

    // Passing null should not crash
    act(() => {
      result.current.ref(null);
    });
    // Size remains at last measured value (no reset to fallback)
    expect(result.current.size).toEqual({ width: 300, height: 200 });
  });

  it("ref callback identity is stable across renders", () => {
    const { result, rerender } = renderHook(() =>
      usePanelSize({ width: 100, height: 100 }),
    );
    const ref1 = result.current.ref;
    rerender();
    const ref2 = result.current.ref;
    expect(ref1).toBe(ref2);
  });
});
