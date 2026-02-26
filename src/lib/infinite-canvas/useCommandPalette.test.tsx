import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCommandPalette } from "./useCommandPalette";
import type { CommandItem } from "./commandPalette";

const items: readonly CommandItem[] = [
  { id: "a1", label: "A1 (K)", description: "φ → (ψ → φ)", category: "公理" },
  {
    id: "a2",
    label: "A2 (S)",
    description: "(φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))",
    category: "公理",
  },
  { id: "a3", label: "A3", description: "(¬φ → ¬ψ) → (ψ → φ)", category: "公理" },
  { id: "mp", label: "MP", description: "Modus Ponens を適用", category: "操作" },
  { id: "gen", label: "Gen", description: "汎化規則を適用", category: "操作" },
];

describe("useCommandPalette", () => {
  it("初期状態ではクローズ状態", () => {
    const { result } = renderHook(() => useCommandPalette(items, {}));
    expect(result.current.isOpen).toBe(false);
    expect(result.current.paletteState.filteredItems).toHaveLength(0);
  });

  it("openでパレットが開き、全アイテムが表示される", () => {
    const { result } = renderHook(() => useCommandPalette(items, {}));
    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.paletteState.filteredItems).toHaveLength(5);
    expect(result.current.paletteState.selectedIndex).toBe(0);
  });

  it("closeでパレットが閉じ、状態がクリアされる", () => {
    const { result } = renderHook(() => useCommandPalette(items, {}));
    act(() => {
      result.current.open();
      result.current.setQuery("MP");
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
    expect(result.current.paletteState.filteredItems).toHaveLength(0);
    expect(result.current.paletteState.selectedIndex).toBe(-1);
  });

  it("setQueryでフィルタが適用される", () => {
    const { result } = renderHook(() => useCommandPalette(items, {}));
    act(() => {
      result.current.open();
    });

    act(() => {
      result.current.setQuery("A1");
    });
    expect(result.current.paletteState.query).toBe("A1");
    expect(result.current.paletteState.filteredItems).toHaveLength(1);
    expect(result.current.paletteState.filteredItems[0]!.id).toBe("a1");
  });

  it("goToNextで次のアイテムに移動", () => {
    const { result } = renderHook(() => useCommandPalette(items, {}));
    act(() => {
      result.current.open();
    });
    expect(result.current.paletteState.selectedIndex).toBe(0);

    act(() => {
      result.current.goToNext();
    });
    expect(result.current.paletteState.selectedIndex).toBe(1);
  });

  it("goToPreviousで前のアイテムに移動（ラップアラウンド）", () => {
    const { result } = renderHook(() => useCommandPalette(items, {}));
    act(() => {
      result.current.open();
    });
    expect(result.current.paletteState.selectedIndex).toBe(0);

    act(() => {
      result.current.goToPrevious();
    });
    expect(result.current.paletteState.selectedIndex).toBe(4);
  });

  it("executeSelectedでonExecuteが呼ばれ、パレットが閉じる", () => {
    const onExecute = vi.fn();
    const { result } = renderHook(() =>
      useCommandPalette(items, { onExecute }),
    );
    act(() => {
      result.current.open();
    });

    act(() => {
      result.current.executeSelected();
    });
    expect(onExecute).toHaveBeenCalledTimes(1);
    expect(onExecute).toHaveBeenCalledWith(items[0]);
    expect(result.current.isOpen).toBe(false);
  });

  it("executeSelectedで選択なしの場合はonExecuteが呼ばれない", () => {
    const onExecute = vi.fn();
    const { result } = renderHook(() =>
      useCommandPalette(items, { onExecute }),
    );
    act(() => {
      result.current.open();
      result.current.setQuery("zzz");
    });
    expect(result.current.paletteState.selectedIndex).toBe(-1);

    act(() => {
      result.current.executeSelected();
    });
    expect(onExecute).not.toHaveBeenCalled();
    expect(result.current.isOpen).toBe(true);
  });

  it("executeSelectedでフィルタ後の正しいアイテムが渡される", () => {
    const onExecute = vi.fn();
    const { result } = renderHook(() =>
      useCommandPalette(items, { onExecute }),
    );
    act(() => {
      result.current.open();
      result.current.setQuery("MP");
    });
    expect(result.current.paletteState.filteredItems).toHaveLength(1);
    expect(result.current.paletteState.selectedIndex).toBe(0);

    act(() => {
      result.current.executeSelected();
    });
    expect(onExecute).toHaveBeenCalledWith(
      expect.objectContaining({ id: "mp" }),
    );
  });

  it("goToNextは空の場合何もしない", () => {
    const { result } = renderHook(() => useCommandPalette(items, {}));
    act(() => {
      result.current.open();
      result.current.setQuery("zzz");
    });

    act(() => {
      result.current.goToNext();
    });
    expect(result.current.paletteState.selectedIndex).toBe(-1);
  });

  it("goToPreviousは空の場合何もしない", () => {
    const { result } = renderHook(() => useCommandPalette(items, {}));
    act(() => {
      result.current.open();
      result.current.setQuery("zzz");
    });

    act(() => {
      result.current.goToPrevious();
    });
    expect(result.current.paletteState.selectedIndex).toBe(-1);
  });

  it("onExecuteコールバックなしでもexecuteSelectedがクラッシュしない", () => {
    const { result } = renderHook(() => useCommandPalette(items, {}));
    act(() => {
      result.current.open();
    });

    act(() => {
      result.current.executeSelected();
    });
    expect(result.current.isOpen).toBe(false);
  });
});
