import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import type {
  KeyboardShortcutCallbacks,
  KeyboardEventLike,
} from "./useKeyboardShortcuts";
import type { Size, ViewportState } from "./types";
import { PAN_STEP, PAN_STEP_LARGE } from "./keyboardShortcuts";

const DEFAULT_VIEWPORT: ViewportState = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
};

const CONTAINER_SIZE: Size = { width: 800, height: 600 };

function createKeyboardEvent(
  key: string,
  opts: {
    code?: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    repeat?: boolean;
  } = {},
): KeyboardEventLike {
  return {
    key,
    code: opts.code ?? "",
    ctrlKey: opts.ctrlKey ?? false,
    metaKey: opts.metaKey ?? false,
    shiftKey: opts.shiftKey ?? false,
    repeat: opts.repeat ?? false,
    preventDefault: vi.fn(),
  };
}

describe("useKeyboardShortcuts", () => {
  it("初期状態ではスペースパンは非アクティブ", () => {
    const callbacks: KeyboardShortcutCallbacks = {};
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, false, callbacks),
    );
    expect(result.current.isSpacePanActive).toBe(false);
  });

  it("Delete で onDeleteSelected が呼ばれる", () => {
    const onDeleteSelected = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, true, {
        onDeleteSelected,
      }),
    );

    act(() => {
      result.current.onKeyDown(createKeyboardEvent("Delete"));
    });

    expect(onDeleteSelected).toHaveBeenCalledTimes(1);
  });

  it("Backspace で onDeleteSelected が呼ばれる", () => {
    const onDeleteSelected = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, true, {
        onDeleteSelected,
      }),
    );

    act(() => {
      result.current.onKeyDown(createKeyboardEvent("Backspace"));
    });

    expect(onDeleteSelected).toHaveBeenCalledTimes(1);
  });

  it("選択なしでは Delete が onDeleteSelected を呼ばない", () => {
    const onDeleteSelected = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, false, {
        onDeleteSelected,
      }),
    );

    act(() => {
      result.current.onKeyDown(createKeyboardEvent("Delete"));
    });

    expect(onDeleteSelected).not.toHaveBeenCalled();
  });

  it("ArrowUp で onViewportChange が呼ばれる", () => {
    const onViewportChange = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, false, {
        onViewportChange,
      }),
    );

    act(() => {
      result.current.onKeyDown(createKeyboardEvent("ArrowUp"));
    });

    expect(onViewportChange).toHaveBeenCalledTimes(1);
    expect(onViewportChange).toHaveBeenCalledWith({
      offsetX: 0,
      offsetY: PAN_STEP,
      scale: 1,
    });
  });

  it("ArrowLeft で左パン", () => {
    const onViewportChange = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, false, {
        onViewportChange,
      }),
    );

    act(() => {
      result.current.onKeyDown(createKeyboardEvent("ArrowLeft"));
    });

    expect(onViewportChange).toHaveBeenCalledWith({
      offsetX: PAN_STEP,
      offsetY: 0,
      scale: 1,
    });
  });

  it("ArrowRight で右パン", () => {
    const onViewportChange = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, false, {
        onViewportChange,
      }),
    );

    act(() => {
      result.current.onKeyDown(createKeyboardEvent("ArrowRight"));
    });

    expect(onViewportChange).toHaveBeenCalledWith({
      offsetX: -PAN_STEP,
      offsetY: 0,
      scale: 1,
    });
  });

  it("Shift+ArrowDown で大きなステップのパン", () => {
    const onViewportChange = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, false, {
        onViewportChange,
      }),
    );

    act(() => {
      result.current.onKeyDown(
        createKeyboardEvent("ArrowDown", { shiftKey: true }),
      );
    });

    expect(onViewportChange).toHaveBeenCalledWith({
      offsetX: 0,
      offsetY: -PAN_STEP_LARGE,
      scale: 1,
    });
  });

  it("Ctrl+'+' で zoom-in の onViewportChange が呼ばれる", () => {
    const onViewportChange = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, false, {
        onViewportChange,
      }),
    );

    act(() => {
      result.current.onKeyDown(createKeyboardEvent("+", { ctrlKey: true }));
    });

    expect(onViewportChange).toHaveBeenCalledTimes(1);
    const newViewport = onViewportChange.mock.calls[0]![0] as ViewportState;
    expect(newViewport.scale).toBeGreaterThan(1);
  });

  it("Ctrl+'-' で zoom-out の onViewportChange が呼ばれる", () => {
    const onViewportChange = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, false, {
        onViewportChange,
      }),
    );

    act(() => {
      result.current.onKeyDown(createKeyboardEvent("-", { ctrlKey: true }));
    });

    expect(onViewportChange).toHaveBeenCalledTimes(1);
    const newViewport = onViewportChange.mock.calls[0]![0] as ViewportState;
    expect(newViewport.scale).toBeLessThan(1);
  });

  it("Space キーでスペースパンモードに入る", () => {
    const onSpacePanChange = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, false, {
        onSpacePanChange,
      }),
    );

    act(() => {
      result.current.onKeyDown(createKeyboardEvent(" "));
    });

    expect(result.current.isSpacePanActive).toBe(true);
    expect(onSpacePanChange).toHaveBeenCalledWith(true);
  });

  it("Space リリースでスペースパンモードから抜ける", () => {
    const onSpacePanChange = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, false, {
        onSpacePanChange,
      }),
    );

    act(() => {
      result.current.onKeyDown(createKeyboardEvent(" "));
    });
    expect(result.current.isSpacePanActive).toBe(true);

    act(() => {
      result.current.onKeyUp(createKeyboardEvent(" "));
    });
    expect(result.current.isSpacePanActive).toBe(false);
    expect(onSpacePanChange).toHaveBeenCalledWith(false);
  });

  it("Space リピートではスペースパンモードに入らない", () => {
    const onSpacePanChange = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, false, {
        onSpacePanChange,
      }),
    );

    act(() => {
      result.current.onKeyDown(createKeyboardEvent(" ", { repeat: true }));
    });

    expect(result.current.isSpacePanActive).toBe(false);
    expect(onSpacePanChange).not.toHaveBeenCalled();
  });

  it("マッチしたアクションでpreventDefaultが呼ばれる", () => {
    const onViewportChange = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, false, {
        onViewportChange,
      }),
    );

    const event = createKeyboardEvent("ArrowUp");
    act(() => {
      result.current.onKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("マッチしないキーではpreventDefaultが呼ばれない", () => {
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, false, {}),
    );

    const event = createKeyboardEvent("a");
    act(() => {
      result.current.onKeyDown(event);
    });

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("keyUp でマッチしないキーはpreventDefaultを呼ばない", () => {
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, false, {}),
    );

    const event = createKeyboardEvent("a");
    act(() => {
      result.current.onKeyUp(event);
    });

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("Shift+2 で onZoomToSelection が呼ばれる（選択あり）", () => {
    const onZoomToSelection = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, true, {
        onZoomToSelection,
      }),
    );

    act(() => {
      result.current.onKeyDown(
        createKeyboardEvent("@", { code: "Digit2", shiftKey: true }),
      );
    });

    expect(onZoomToSelection).toHaveBeenCalledTimes(1);
  });

  it("選択なしでは Shift+2 で onZoomToSelection が呼ばれない", () => {
    const onZoomToSelection = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, false, {
        onZoomToSelection,
      }),
    );

    act(() => {
      result.current.onKeyDown(
        createKeyboardEvent("@", { code: "Digit2", shiftKey: true }),
      );
    });

    expect(onZoomToSelection).not.toHaveBeenCalled();
  });

  it("Ctrl+F で onOpenSearch が呼ばれる", () => {
    const onOpenSearch = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, false, {
        onOpenSearch,
      }),
    );

    act(() => {
      result.current.onKeyDown(createKeyboardEvent("f", { ctrlKey: true }));
    });

    expect(onOpenSearch).toHaveBeenCalledTimes(1);
  });

  it("/ で onOpenCommandPalette が呼ばれる", () => {
    const onOpenCommandPalette = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, false, {
        onOpenCommandPalette,
      }),
    );

    act(() => {
      result.current.onKeyDown(createKeyboardEvent("/"));
    });

    expect(onOpenCommandPalette).toHaveBeenCalledTimes(1);
  });

  it("Ctrl+Shift+L で onTreeLayout が呼ばれる", () => {
    const onTreeLayout = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, false, {
        onTreeLayout,
      }),
    );

    act(() => {
      result.current.onKeyDown(
        createKeyboardEvent("l", { ctrlKey: true, shiftKey: true }),
      );
    });

    expect(onTreeLayout).toHaveBeenCalledTimes(1);
  });

  it("コールバック未設定でもエラーにならない", () => {
    const { result } = renderHook(() =>
      useKeyboardShortcuts(DEFAULT_VIEWPORT, CONTAINER_SIZE, true, {}),
    );

    // delete with no callback
    act(() => {
      result.current.onKeyDown(createKeyboardEvent("Delete"));
    });
    // pan with no callback
    act(() => {
      result.current.onKeyDown(createKeyboardEvent("ArrowUp"));
    });
    // zoom with no callback
    act(() => {
      result.current.onKeyDown(createKeyboardEvent("+", { ctrlKey: true }));
    });
    // zoom-to-selection with no callback
    act(() => {
      result.current.onKeyDown(
        createKeyboardEvent("@", { code: "Digit2", shiftKey: true }),
      );
    });
    // tree-layout with no callback
    act(() => {
      result.current.onKeyDown(
        createKeyboardEvent("l", { ctrlKey: true, shiftKey: true }),
      );
    });
    // space pan with no pan callback
    act(() => {
      result.current.onKeyDown(createKeyboardEvent(" "));
    });
    act(() => {
      result.current.onKeyUp(createKeyboardEvent(" "));
    });
    // No error thrown
  });
});
