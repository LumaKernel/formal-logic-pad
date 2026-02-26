import { useCallback, useMemo, useState } from "react";
import type { Size, ViewportState } from "./types";
import {
  createSearchResult,
  nextMatch,
  previousMatch,
  computeFocusViewport,
  getCurrentMatchItemId,
  EMPTY_SEARCH_RESULT,
  type SearchableItem,
  type SearchResult,
} from "./nodeSearch";

// --- Types ---

/** Callbacks for node search actions */
export type NodeSearchCallbacks = {
  /** Called when the viewport should change to focus on a matched item */
  readonly onViewportChange?: (viewport: ViewportState) => void;
  /** Called when a match is focused (for highlighting) */
  readonly onHighlightItem?: (itemId: string | null) => void;
};

/** Result of the useNodeSearch hook */
export type UseNodeSearchResult = {
  /** Whether the search panel is currently open */
  readonly isOpen: boolean;
  /** Current search result state */
  readonly searchResult: SearchResult;
  /** The id of the currently highlighted item, or null */
  readonly highlightedItemId: string | null;
  /** Open the search panel */
  readonly open: () => void;
  /** Close the search panel and clear search */
  readonly close: () => void;
  /** Update the search query */
  readonly setQuery: (query: string) => void;
  /** Go to the next match */
  readonly goToNext: () => void;
  /** Go to the previous match */
  readonly goToPrevious: () => void;
};

// --- Hook ---

/** Hook that manages node search state and navigation.
 *
 *  @param items - All searchable items in the canvas
 *  @param containerSize - Container size for viewport calculation
 *  @param callbacks - Action callbacks
 *  @param minScale - Min zoom scale
 *  @param maxScale - Max zoom scale
 */
export function useNodeSearch(
  items: readonly SearchableItem[],
  containerSize: Size,
  callbacks: NodeSearchCallbacks,
  minScale?: number,
  maxScale?: number,
): UseNodeSearchResult {
  const [isOpen, setIsOpen] = useState(false);
  const [searchResult, setSearchResult] =
    useState<SearchResult>(EMPTY_SEARCH_RESULT);

  const focusOnCurrentMatch = useCallback(
    (result: SearchResult) => {
      const itemId = getCurrentMatchItemId(result);
      callbacks.onHighlightItem?.(itemId);
      if (itemId !== null) {
        const item = items.find((i) => i.id === itemId);
        if (item !== undefined) {
          const viewport = computeFocusViewport(
            item,
            containerSize,
            80,
            minScale,
            maxScale,
          );
          callbacks.onViewportChange?.(viewport);
        }
      }
    },
    [items, containerSize, callbacks, minScale, maxScale],
  );

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSearchResult(EMPTY_SEARCH_RESULT);
    callbacks.onHighlightItem?.(null);
  }, [callbacks]);

  const setQuery = useCallback(
    (query: string) => {
      const result = createSearchResult(items, query);
      setSearchResult(result);
      focusOnCurrentMatch(result);
    },
    [items, focusOnCurrentMatch],
  );

  const goToNext = useCallback(() => {
    setSearchResult((prev) => {
      const result = nextMatch(prev);
      focusOnCurrentMatch(result);
      return result;
    });
  }, [focusOnCurrentMatch]);

  const goToPrevious = useCallback(() => {
    setSearchResult((prev) => {
      const result = previousMatch(prev);
      focusOnCurrentMatch(result);
      return result;
    });
  }, [focusOnCurrentMatch]);

  const highlightedItemId = useMemo(
    () => getCurrentMatchItemId(searchResult),
    [searchResult],
  );

  return {
    isOpen,
    searchResult,
    highlightedItemId,
    open,
    close,
    setQuery,
    goToNext,
    goToPrevious,
  };
}
