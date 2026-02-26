import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NodeSearchComponent, formatMatchCount } from "./NodeSearchComponent";
import { EMPTY_SEARCH_RESULT, type SearchResult } from "./nodeSearch";

afterEach(cleanup);

const defaultProps = {
  isOpen: true,
  searchResult: EMPTY_SEARCH_RESULT,
  onQueryChange: vi.fn(),
  onNext: vi.fn(),
  onPrevious: vi.fn(),
  onClose: vi.fn(),
};

function createSearchResult(
  query: string,
  matchCount: number,
  currentIndex: number,
): SearchResult {
  return {
    query,
    matches: Array.from({ length: matchCount }, (_, i) => ({
      itemId: `item-${String(i) satisfies string}`,
      itemLabel: `label-${String(i) satisfies string}`,
      matchStart: 0,
      matchEnd: query.length,
    })),
    currentIndex,
  };
}

// --- formatMatchCount ---

describe("formatMatchCount", () => {
  it("formats zero matches", () => {
    expect(formatMatchCount(-1, 0)).toBe("0/0");
  });

  it("formats first of multiple", () => {
    expect(formatMatchCount(0, 3)).toBe("1/3");
  });

  it("formats last of multiple", () => {
    expect(formatMatchCount(2, 3)).toBe("3/3");
  });
});

// --- NodeSearchComponent ---

describe("NodeSearchComponent", () => {
  it("renders nothing when closed", () => {
    render(<NodeSearchComponent {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId("node-search-panel")).toBeNull();
  });

  it("renders search panel when open", () => {
    render(<NodeSearchComponent {...defaultProps} />);
    expect(screen.getByTestId("node-search-panel")).toBeTruthy();
    expect(screen.getByTestId("node-search-input")).toBeTruthy();
    expect(screen.getByTestId("node-search-prev")).toBeTruthy();
    expect(screen.getByTestId("node-search-next")).toBeTruthy();
    expect(screen.getByTestId("node-search-close")).toBeTruthy();
  });

  it("does not show match count when query is empty", () => {
    render(<NodeSearchComponent {...defaultProps} />);
    expect(screen.queryByTestId("node-search-count")).toBeNull();
  });

  it("shows match count when there is a query", () => {
    const result = createSearchResult("test", 3, 0);
    render(<NodeSearchComponent {...defaultProps} searchResult={result} />);
    expect(screen.getByTestId("node-search-count").textContent).toBe("1/3");
  });

  it("shows 0/0 when query has no matches", () => {
    const result: SearchResult = {
      query: "nomatch",
      matches: [],
      currentIndex: -1,
    };
    render(<NodeSearchComponent {...defaultProps} searchResult={result} />);
    expect(screen.getByTestId("node-search-count").textContent).toBe("0/0");
  });

  it("calls onQueryChange on input change", () => {
    const onQueryChange = vi.fn();
    render(
      <NodeSearchComponent {...defaultProps} onQueryChange={onQueryChange} />,
    );
    fireEvent.change(screen.getByTestId("node-search-input"), {
      target: { value: "φ" },
    });
    expect(onQueryChange).toHaveBeenCalledWith("φ");
  });

  it("calls onClose on Escape key", () => {
    const onClose = vi.fn();
    render(<NodeSearchComponent {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(screen.getByTestId("node-search-input"), {
      key: "Escape",
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onNext on Enter key", () => {
    const onNext = vi.fn();
    render(<NodeSearchComponent {...defaultProps} onNext={onNext} />);
    fireEvent.keyDown(screen.getByTestId("node-search-input"), {
      key: "Enter",
    });
    expect(onNext).toHaveBeenCalledOnce();
  });

  it("calls onPrevious on Shift+Enter", () => {
    const onPrevious = vi.fn();
    render(<NodeSearchComponent {...defaultProps} onPrevious={onPrevious} />);
    fireEvent.keyDown(screen.getByTestId("node-search-input"), {
      key: "Enter",
      shiftKey: true,
    });
    expect(onPrevious).toHaveBeenCalledOnce();
  });

  it("calls onNext on next button click", () => {
    const onNext = vi.fn();
    const result = createSearchResult("test", 3, 0);
    render(
      <NodeSearchComponent
        {...defaultProps}
        searchResult={result}
        onNext={onNext}
      />,
    );
    fireEvent.click(screen.getByTestId("node-search-next"));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it("calls onPrevious on prev button click", () => {
    const onPrevious = vi.fn();
    const result = createSearchResult("test", 3, 0);
    render(
      <NodeSearchComponent
        {...defaultProps}
        searchResult={result}
        onPrevious={onPrevious}
      />,
    );
    fireEvent.click(screen.getByTestId("node-search-prev"));
    expect(onPrevious).toHaveBeenCalledOnce();
  });

  it("calls onClose on close button click", () => {
    const onClose = vi.fn();
    render(<NodeSearchComponent {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("node-search-close"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("disables nav buttons when no matches", () => {
    render(<NodeSearchComponent {...defaultProps} />);
    expect(
      (screen.getByTestId("node-search-prev") as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByTestId("node-search-next") as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("enables nav buttons when matches exist", () => {
    const result = createSearchResult("test", 3, 0);
    render(<NodeSearchComponent {...defaultProps} searchResult={result} />);
    expect(
      (screen.getByTestId("node-search-prev") as HTMLButtonElement).disabled,
    ).toBe(false);
    expect(
      (screen.getByTestId("node-search-next") as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it("auto-focuses input when opened", () => {
    const { rerender } = render(
      <NodeSearchComponent {...defaultProps} isOpen={false} />,
    );
    rerender(<NodeSearchComponent {...defaultProps} isOpen={true} />);
    expect(document.activeElement).toBe(
      screen.getByTestId("node-search-input"),
    );
  });

  it("stopPropagation on pointerDown", () => {
    render(<NodeSearchComponent {...defaultProps} />);
    const panel = screen.getByTestId("node-search-panel");
    const event = new PointerEvent("pointerdown", { bubbles: true });
    const stopSpy = vi.spyOn(event, "stopPropagation");
    panel.dispatchEvent(event);
    expect(stopSpy).toHaveBeenCalled();
  });
});
