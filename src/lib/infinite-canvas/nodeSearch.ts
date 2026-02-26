import type { Size, ViewportState } from "./types";
import { computeFitToContentViewport } from "./zoom";

// --- Types ---

/** An item that can be searched. Minimal interface for pure logic. */
export type SearchableItem = {
  readonly id: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** A single search match result. */
export type SearchMatch = {
  readonly itemId: string;
  readonly itemLabel: string;
  readonly matchStart: number;
  readonly matchEnd: number;
};

/** Full search result state. */
export type SearchResult = {
  readonly query: string;
  readonly matches: readonly SearchMatch[];
  readonly currentIndex: number;
};

/** Empty search result for initial state. */
export const EMPTY_SEARCH_RESULT: SearchResult = {
  query: "",
  matches: [],
  currentIndex: -1,
};

// --- Pure logic functions ---

/** Perform case-insensitive search across all items.
 *  Returns matches in item order (by original array index).
 *  Pure function. */
export function searchItems(
  items: readonly SearchableItem[],
  query: string,
): readonly SearchMatch[] {
  if (query === "") {
    return [];
  }
  const lowerQuery = query.toLowerCase();
  const matches: SearchMatch[] = [];
  for (const item of items) {
    const lowerLabel = item.label.toLowerCase();
    const idx = lowerLabel.indexOf(lowerQuery);
    if (idx !== -1) {
      matches.push({
        itemId: item.id,
        itemLabel: item.label,
        matchStart: idx,
        matchEnd: idx + query.length,
      });
    }
  }
  return matches;
}

/** Create a new SearchResult from a query and items.
 *  If matches exist, currentIndex defaults to 0.
 *  Pure function. */
export function createSearchResult(
  items: readonly SearchableItem[],
  query: string,
): SearchResult {
  const matches = searchItems(items, query);
  return {
    query,
    matches,
    currentIndex: matches.length > 0 ? 0 : -1,
  };
}

/** Navigate to the next match. Wraps around at the end.
 *  Pure function. */
export function nextMatch(result: SearchResult): SearchResult {
  if (result.matches.length === 0) {
    return result;
  }
  return {
    ...result,
    currentIndex: (result.currentIndex + 1) % result.matches.length,
  };
}

/** Navigate to the previous match. Wraps around at the beginning.
 *  Pure function. */
export function previousMatch(result: SearchResult): SearchResult {
  if (result.matches.length === 0) {
    return result;
  }
  return {
    ...result,
    currentIndex:
      (result.currentIndex - 1 + result.matches.length) % result.matches.length,
  };
}

/** Compute viewport to focus on a specific item.
 *  Zooms to fit the item with padding, maintaining min/max scale bounds.
 *  Pure function. */
export function computeFocusViewport(
  item: SearchableItem,
  containerSize: Size,
  padding: number = 80,
  minScale?: number,
  maxScale?: number,
): ViewportState {
  return computeFitToContentViewport(
    [{ x: item.x, y: item.y, width: item.width, height: item.height }],
    containerSize,
    padding,
    minScale,
    maxScale,
  );
}

/** Get the current match's item id, or null if no match.
 *  Pure function. */
export function getCurrentMatchItemId(result: SearchResult): string | null {
  if (result.currentIndex < 0 || result.currentIndex >= result.matches.length) {
    return null;
  }
  return result.matches[result.currentIndex]!.itemId;
}
