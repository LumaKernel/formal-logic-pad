import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocaleSwitch, type UseLocaleSwitchDeps } from "./useLocaleSwitch";

function createMockDeps(): UseLocaleSwitchDeps & {
  readonly cookieValues: string[];
  readonly reloadCalls: number[];
} {
  const cookieValues: string[] = [];
  const reloadCalls: number[] = [];
  return {
    cookieValues,
    reloadCalls,
    getCookie: vi.fn(() => ""),
    setCookie: vi.fn((value: string) => {
      cookieValues.push(value);
    }),
    reload: vi.fn(() => {
      reloadCalls.push(1);
    }),
  };
}

describe("useLocaleSwitch", () => {
  it("sets cookie and reloads when switching to en", () => {
    const deps = createMockDeps();
    const { result } = renderHook(() => useLocaleSwitch(deps));

    act(() => {
      result.current.switchLocale("en");
    });

    expect(deps.cookieValues).toEqual([
      "locale=en;path=/;max-age=31536000;samesite=lax",
    ]);
    expect(deps.reloadCalls).toEqual([1]);
  });

  it("sets cookie and reloads when switching to ja", () => {
    const deps = createMockDeps();
    const { result } = renderHook(() => useLocaleSwitch(deps));

    act(() => {
      result.current.switchLocale("ja");
    });

    expect(deps.cookieValues).toEqual([
      "locale=ja;path=/;max-age=31536000;samesite=lax",
    ]);
    expect(deps.reloadCalls).toEqual([1]);
  });

  it("returns stable switchLocale reference", () => {
    const deps = createMockDeps();
    const { result, rerender } = renderHook(() => useLocaleSwitch(deps));

    const first = result.current.switchLocale;
    rerender();
    expect(result.current.switchLocale).toBe(first);
  });
});
