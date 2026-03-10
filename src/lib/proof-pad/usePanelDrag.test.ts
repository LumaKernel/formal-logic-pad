import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePanelDrag } from "./usePanelDrag";
import type { UsePanelDragConfig } from "./usePanelDrag";

/**
 * usePanelDrag が PointerEvent から読み取るフィールドのみを持つ型。
 * テスト用に最小限のフィールドだけモックする。
 */
type PointerEventSubset = Pick<
  React.PointerEvent<HTMLElement>,
  "clientX" | "clientY" | "button"
> & {
  readonly stopPropagation: () => void;
  readonly preventDefault: () => void;
};

/** テストモック用: PointerEventSubset を React.PointerEvent として扱う */
function asPointerEvent(
  subset: PointerEventSubset,
): React.PointerEvent<HTMLElement> {
  // テスト用モック: hookが使うフィールドのみ含む部分オブジェクト
  return subset as never;
}

function createPointerEvent(
  clientX: number,
  clientY: number,
  opts: { readonly button?: number } = {},
): React.PointerEvent<HTMLElement> {
  return asPointerEvent({
    clientX,
    clientY,
    button: opts.button ?? 0,
    stopPropagation: vi.fn(),
    preventDefault: vi.fn(),
  });
}

describe("usePanelDrag", () => {
  const baseConfig: UsePanelDragConfig = {
    position: { x: 100, y: 100 },
    panelSize: { width: 200, height: 150 },
    containerSize: { width: 800, height: 600 },
    otherPanels: [],
    onPositionChange: vi.fn(),
  };

  it("初期状態ではドラッグ中でない", () => {
    const { result } = renderHook(() => usePanelDrag(baseConfig));
    expect(result.current.isDragging).toBe(false);
  });

  it("handlePropsにonPointerDownが含まれる", () => {
    const { result } = renderHook(() => usePanelDrag(baseConfig));
    expect(result.current.handleProps.onPointerDown).toBeTypeOf("function");
  });

  it("左ボタン以外のpointerdownは無視される", () => {
    const onPositionChange = vi.fn();
    const { result } = renderHook(() =>
      usePanelDrag({ ...baseConfig, onPositionChange }),
    );

    act(() => {
      result.current.handleProps.onPointerDown(
        createPointerEvent(150, 120, { button: 2 }),
      );
    });

    expect(result.current.isDragging).toBe(false);
  });

  it("左ボタンのpointerdownでドラッグ開始", () => {
    const onPositionChange = vi.fn();
    const { result } = renderHook(() =>
      usePanelDrag({ ...baseConfig, onPositionChange }),
    );

    act(() => {
      result.current.handleProps.onPointerDown(createPointerEvent(150, 120));
    });

    expect(result.current.isDragging).toBe(true);
  });

  it("pointermoveでonPositionChangeが呼ばれる", () => {
    const onPositionChange = vi.fn();
    const { result } = renderHook(() =>
      usePanelDrag({ ...baseConfig, onPositionChange }),
    );

    act(() => {
      result.current.handleProps.onPointerDown(createPointerEvent(150, 120));
    });

    // window pointermove をシミュレート
    act(() => {
      window.dispatchEvent(
        new PointerEvent("pointermove", { clientX: 200, clientY: 170 }),
      );
    });

    expect(onPositionChange).toHaveBeenCalled();
    const pos = onPositionChange.mock.calls[0]![0];
    // 移動量: clientX +50, clientY +50 → パネル位置 (150, 150)
    expect(pos.x).toBe(150);
    expect(pos.y).toBe(150);
  });

  it("pointerupでドラッグ終了", () => {
    const onPositionChange = vi.fn();
    const { result } = renderHook(() =>
      usePanelDrag({ ...baseConfig, onPositionChange }),
    );

    act(() => {
      result.current.handleProps.onPointerDown(createPointerEvent(150, 120));
    });

    expect(result.current.isDragging).toBe(true);

    act(() => {
      window.dispatchEvent(new PointerEvent("pointerup"));
    });

    expect(result.current.isDragging).toBe(false);
  });

  it("ドラッグ開始前のpointermoveは無視される", () => {
    const onPositionChange = vi.fn();
    renderHook(() => usePanelDrag({ ...baseConfig, onPositionChange }));

    act(() => {
      window.dispatchEvent(
        new PointerEvent("pointermove", { clientX: 200, clientY: 170 }),
      );
    });

    expect(onPositionChange).not.toHaveBeenCalled();
  });

  it("初期状態ではwasDraggedがfalse", () => {
    const { result } = renderHook(() => usePanelDrag(baseConfig));
    expect(result.current.wasDraggedRef.current).toBe(false);
  });

  it("pointermoveが発生するとwasDraggedがtrueになる", () => {
    const onPositionChange = vi.fn();
    const { result } = renderHook(() =>
      usePanelDrag({ ...baseConfig, onPositionChange }),
    );

    act(() => {
      result.current.handleProps.onPointerDown(createPointerEvent(150, 120));
    });

    expect(result.current.wasDraggedRef.current).toBe(false);

    act(() => {
      window.dispatchEvent(
        new PointerEvent("pointermove", { clientX: 200, clientY: 170 }),
      );
    });

    expect(result.current.wasDraggedRef.current).toBe(true);
  });

  it("次のpointerdownでwasDraggedがリセットされる", () => {
    const onPositionChange = vi.fn();
    const { result } = renderHook(() =>
      usePanelDrag({ ...baseConfig, onPositionChange }),
    );

    // 最初のドラッグ
    act(() => {
      result.current.handleProps.onPointerDown(createPointerEvent(150, 120));
    });
    act(() => {
      window.dispatchEvent(
        new PointerEvent("pointermove", { clientX: 200, clientY: 170 }),
      );
    });
    act(() => {
      window.dispatchEvent(new PointerEvent("pointerup"));
    });

    expect(result.current.wasDraggedRef.current).toBe(true);

    // 2回目のpointerdownでリセット
    act(() => {
      result.current.handleProps.onPointerDown(createPointerEvent(200, 170));
    });

    expect(result.current.wasDraggedRef.current).toBe(false);
  });

  it("pointermoveなしのpointerupではwasDraggedがfalseのまま", () => {
    const onPositionChange = vi.fn();
    const { result } = renderHook(() =>
      usePanelDrag({ ...baseConfig, onPositionChange }),
    );

    act(() => {
      result.current.handleProps.onPointerDown(createPointerEvent(150, 120));
    });

    act(() => {
      window.dispatchEvent(new PointerEvent("pointerup"));
    });

    expect(result.current.wasDraggedRef.current).toBe(false);
  });

  it("pointerup後はpointermoveが無視される", () => {
    const onPositionChange = vi.fn();
    const { result } = renderHook(() =>
      usePanelDrag({ ...baseConfig, onPositionChange }),
    );

    // ドラッグ開始
    act(() => {
      result.current.handleProps.onPointerDown(createPointerEvent(150, 120));
    });

    // ドラッグ終了
    act(() => {
      window.dispatchEvent(new PointerEvent("pointerup"));
    });

    onPositionChange.mockClear();

    // 終了後のpointermoveは無視される
    act(() => {
      window.dispatchEvent(
        new PointerEvent("pointermove", { clientX: 300, clientY: 300 }),
      );
    });

    expect(onPositionChange).not.toHaveBeenCalled();
  });
});
