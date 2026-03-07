import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNodeSearch } from "./useNodeSearch";
import type { NodeSearchCallbacks } from "./useNodeSearch";
import type { SearchableItem } from "./nodeSearch";
import type { Size } from "./types";

const CONTAINER_SIZE: Size = { width: 800, height: 600 };

const items: readonly SearchableItem[] = [
  { id: "1", label: "φ → ψ", x: 0, y: 0, width: 100, height: 50 },
  { id: "2", label: "ψ → χ", x: 200, y: 0, width: 100, height: 50 },
  { id: "3", label: "φ → χ", x: 100, y: 100, width: 100, height: 50 },
  { id: "4", label: "¬φ", x: 300, y: 100, width: 80, height: 50 },
];

describe("useNodeSearch", () => {
  it("初期状態ではクローズ状態", () => {
    const { result } = renderHook(() =>
      useNodeSearch(items, CONTAINER_SIZE, {}),
    );
    expect(result.current.isOpen).toBe(false);
    expect(result.current.searchResult.matches).toHaveLength(0);
    expect(result.current.highlightedItemId).toBeNull();
  });

  it("openで検索パネルが開く", () => {
    const { result } = renderHook(() =>
      useNodeSearch(items, CONTAINER_SIZE, {}),
    );
    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
  });

  it("closeで検索パネルが閉じ、検索結果がクリアされる", () => {
    const onHighlightItem = vi.fn();
    const { result } = renderHook(() =>
      useNodeSearch(items, CONTAINER_SIZE, { onHighlightItem }),
    );

    act(() => {
      result.current.open();
      result.current.setQuery("→");
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.searchResult.matches.length).toBeGreaterThan(0);

    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
    expect(result.current.searchResult.matches).toHaveLength(0);
    expect(onHighlightItem).toHaveBeenCalledWith(null);
  });

  it("setQueryで検索結果が更新される", () => {
    const onHighlightItem = vi.fn();
    const onViewportChange = vi.fn();
    const { result } = renderHook(() =>
      useNodeSearch(items, CONTAINER_SIZE, {
        onHighlightItem,
        onViewportChange,
      }),
    );

    act(() => {
      result.current.setQuery("→");
    });
    expect(result.current.searchResult.matches).toHaveLength(3);
    expect(result.current.searchResult.currentIndex).toBe(0);
    expect(result.current.highlightedItemId).toBe("1");
    expect(onHighlightItem).toHaveBeenCalledWith("1");
    expect(onViewportChange).toHaveBeenCalled();
  });

  it("マッチがない場合はハイライトがnull", () => {
    const onHighlightItem = vi.fn();
    const { result } = renderHook(() =>
      useNodeSearch(items, CONTAINER_SIZE, { onHighlightItem }),
    );

    act(() => {
      result.current.setQuery("nonexistent");
    });
    expect(result.current.searchResult.matches).toHaveLength(0);
    expect(result.current.highlightedItemId).toBeNull();
    expect(onHighlightItem).toHaveBeenCalledWith(null);
  });

  it("goToNextで次のマッチに移動", () => {
    const onHighlightItem = vi.fn();
    const onViewportChange = vi.fn();
    const { result } = renderHook(() =>
      useNodeSearch(items, CONTAINER_SIZE, {
        onHighlightItem,
        onViewportChange,
      }),
    );

    act(() => {
      result.current.setQuery("→");
    });
    expect(result.current.highlightedItemId).toBe("1");

    act(() => {
      result.current.goToNext();
    });
    expect(result.current.searchResult.currentIndex).toBe(1);
    expect(result.current.highlightedItemId).toBe("2");
  });

  it("goToPreviousで前のマッチに移動", () => {
    const onHighlightItem = vi.fn();
    const { result } = renderHook(() =>
      useNodeSearch(items, CONTAINER_SIZE, { onHighlightItem }),
    );

    act(() => {
      result.current.setQuery("→");
    });

    act(() => {
      result.current.goToPrevious();
    });
    // 0 → wrap to 2
    expect(result.current.searchResult.currentIndex).toBe(2);
    expect(result.current.highlightedItemId).toBe("3");
  });

  it("goToNextはマッチなしの場合何もしない", () => {
    const { result } = renderHook(() =>
      useNodeSearch(items, CONTAINER_SIZE, {}),
    );

    act(() => {
      result.current.setQuery("nonexistent");
    });

    act(() => {
      result.current.goToNext();
    });
    expect(result.current.searchResult.currentIndex).toBe(-1);
  });

  it("goToPreviousはマッチなしの場合何もしない", () => {
    const { result } = renderHook(() =>
      useNodeSearch(items, CONTAINER_SIZE, {}),
    );

    act(() => {
      result.current.setQuery("nonexistent");
    });

    act(() => {
      result.current.goToPrevious();
    });
    expect(result.current.searchResult.currentIndex).toBe(-1);
  });

  it("setQueryでフォーカスビューポートが計算される", () => {
    const onViewportChange = vi.fn();
    const callbacks: NodeSearchCallbacks = { onViewportChange };
    const { result } = renderHook(() =>
      useNodeSearch(items, CONTAINER_SIZE, callbacks),
    );

    act(() => {
      result.current.setQuery("¬");
    });

    expect(onViewportChange).toHaveBeenCalledTimes(1);
    const viewport = onViewportChange.mock.calls[0]![0]!;
    expect(viewport).toHaveProperty("offsetX");
    expect(viewport).toHaveProperty("offsetY");
    expect(viewport).toHaveProperty("scale");
  });

  it("空クエリにするとハイライトがクリアされる", () => {
    const onHighlightItem = vi.fn();
    const { result } = renderHook(() =>
      useNodeSearch(items, CONTAINER_SIZE, { onHighlightItem }),
    );

    act(() => {
      result.current.setQuery("→");
    });
    expect(onHighlightItem).toHaveBeenCalledWith("1");

    act(() => {
      result.current.setQuery("");
    });
    expect(result.current.searchResult.matches).toHaveLength(0);
    expect(onHighlightItem).toHaveBeenCalledWith(null);
  });

  it("goToNextが循環する", () => {
    const { result } = renderHook(() =>
      useNodeSearch(items, CONTAINER_SIZE, {}),
    );

    act(() => {
      result.current.setQuery("→");
    });
    // 3 matches, start at 0
    act(() => {
      result.current.goToNext();
    });
    act(() => {
      result.current.goToNext();
    });
    expect(result.current.searchResult.currentIndex).toBe(2);
    act(() => {
      result.current.goToNext();
    });
    expect(result.current.searchResult.currentIndex).toBe(0);
  });

  it("items変更後にマッチIDが見つからない場合はビューポート変更しない", () => {
    const onViewportChange = vi.fn();
    const onHighlightItem = vi.fn();
    const { result, rerender } = renderHook(
      ({ searchItems }: { readonly searchItems: readonly SearchableItem[] }) =>
        useNodeSearch(searchItems, CONTAINER_SIZE, {
          onViewportChange,
          onHighlightItem,
        }),
      { initialProps: { searchItems: items } },
    );

    // 検索して最初のマッチを得る
    act(() => {
      result.current.setQuery("¬");
    });
    expect(result.current.highlightedItemId).toBe("4");
    const callCountAfterSearch = onViewportChange.mock.calls.length;

    // itemsを空にして再レンダリング（マッチIDが見つからなくなる）
    rerender({ searchItems: [] });

    // goToNextでfocusOnCurrentMatchが呼ばれるが、itemが見つからないのでビューポート変更しない
    act(() => {
      result.current.goToNext();
    });
    expect(onViewportChange.mock.calls.length).toBe(callCountAfterSearch);
  });
});
