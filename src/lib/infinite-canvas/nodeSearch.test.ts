import { describe, it, expect } from "vitest";
import {
  searchItems,
  createSearchResult,
  nextMatch,
  previousMatch,
  computeFocusViewport,
  getCurrentMatchItemId,
  EMPTY_SEARCH_RESULT,
  type SearchableItem,
} from "./nodeSearch";

// --- Test data ---

const items: readonly SearchableItem[] = [
  { id: "1", label: "φ → ψ", x: 0, y: 0, width: 100, height: 50 },
  { id: "2", label: "ψ → χ", x: 200, y: 0, width: 100, height: 50 },
  { id: "3", label: "φ → χ", x: 100, y: 100, width: 100, height: 50 },
  { id: "4", label: "¬φ", x: 300, y: 100, width: 80, height: 50 },
  { id: "5", label: "φ ∧ ψ", x: 0, y: 200, width: 100, height: 50 },
];

// --- searchItems ---

describe("searchItems", () => {
  it("returns empty array for empty query", () => {
    expect(searchItems(items, "")).toEqual([]);
  });

  it("finds a single match", () => {
    const matches = searchItems(items, "¬");
    expect(matches).toHaveLength(1);
    expect(matches[0]!.itemId).toBe("4");
    expect(matches[0]!.matchStart).toBe(0);
    expect(matches[0]!.matchEnd).toBe(1);
  });

  it("finds multiple matches", () => {
    const matches = searchItems(items, "→");
    expect(matches).toHaveLength(3);
    expect(matches.map((m) => m.itemId)).toEqual(["1", "2", "3"]);
  });

  it("is case-insensitive for ASCII", () => {
    const asciiItems: readonly SearchableItem[] = [
      { id: "a", label: "Alpha", x: 0, y: 0, width: 50, height: 50 },
      { id: "b", label: "BETA", x: 0, y: 0, width: 50, height: 50 },
    ];
    const matches = searchItems(asciiItems, "alpha");
    expect(matches).toHaveLength(1);
    expect(matches[0]!.itemId).toBe("a");
  });

  it("returns empty array when no match", () => {
    expect(searchItems(items, "nonexistent")).toEqual([]);
  });

  it("records correct match positions", () => {
    const matches = searchItems(items, "ψ");
    expect(matches).toHaveLength(3);
    // "φ → ψ" - ψ at index 4
    expect(matches[0]!.matchStart).toBe(4);
    expect(matches[0]!.matchEnd).toBe(5);
    // "ψ → χ" - ψ at index 0
    expect(matches[1]!.matchStart).toBe(0);
    expect(matches[1]!.matchEnd).toBe(1);
    // "φ ∧ ψ" - ψ at index 4
    expect(matches[2]!.matchStart).toBe(4);
    expect(matches[2]!.matchEnd).toBe(5);
  });

  it("returns empty array when items is empty", () => {
    expect(searchItems([], "test")).toEqual([]);
  });

  it("finds first occurrence in label only", () => {
    const multiItems: readonly SearchableItem[] = [
      { id: "x", label: "φ → φ → φ", x: 0, y: 0, width: 50, height: 50 },
    ];
    const matches = searchItems(multiItems, "φ");
    expect(matches).toHaveLength(1);
    expect(matches[0]!.matchStart).toBe(0);
    expect(matches[0]!.matchEnd).toBe(1);
  });
});

// --- createSearchResult ---

describe("createSearchResult", () => {
  it("creates a result with matches and currentIndex 0", () => {
    const result = createSearchResult(items, "→");
    expect(result.query).toBe("→");
    expect(result.matches).toHaveLength(3);
    expect(result.currentIndex).toBe(0);
  });

  it("creates an empty result for no matches", () => {
    const result = createSearchResult(items, "nonexistent");
    expect(result.query).toBe("nonexistent");
    expect(result.matches).toHaveLength(0);
    expect(result.currentIndex).toBe(-1);
  });

  it("creates an empty result for empty query", () => {
    const result = createSearchResult(items, "");
    expect(result.query).toBe("");
    expect(result.matches).toHaveLength(0);
    expect(result.currentIndex).toBe(-1);
  });
});

// --- nextMatch ---

describe("nextMatch", () => {
  it("advances to next match", () => {
    const result = createSearchResult(items, "→");
    const next = nextMatch(result);
    expect(next.currentIndex).toBe(1);
  });

  it("wraps around at the end", () => {
    const result = createSearchResult(items, "→");
    const after2 = nextMatch(nextMatch(result));
    expect(after2.currentIndex).toBe(2);
    const wrapped = nextMatch(after2);
    expect(wrapped.currentIndex).toBe(0);
  });

  it("returns same result when no matches", () => {
    const result = createSearchResult(items, "nonexistent");
    const next = nextMatch(result);
    expect(next).toBe(result);
  });
});

// --- previousMatch ---

describe("previousMatch", () => {
  it("goes to previous match", () => {
    const result = createSearchResult(items, "→");
    const advanced = nextMatch(result);
    const prev = previousMatch(advanced);
    expect(prev.currentIndex).toBe(0);
  });

  it("wraps around at the beginning", () => {
    const result = createSearchResult(items, "→");
    const wrapped = previousMatch(result);
    expect(wrapped.currentIndex).toBe(2);
  });

  it("returns same result when no matches", () => {
    const result = createSearchResult(items, "nonexistent");
    const prev = previousMatch(result);
    expect(prev).toBe(result);
  });
});

// --- computeFocusViewport ---

describe("computeFocusViewport", () => {
  const containerSize = { width: 800, height: 600 };

  it("computes viewport centered on item", () => {
    const item: SearchableItem = {
      id: "1",
      label: "test",
      x: 500,
      y: 500,
      width: 100,
      height: 50,
    };
    const vp = computeFocusViewport(item, containerSize);
    // Item center = (550, 525), should be near container center
    expect(vp.scale).toBeGreaterThan(0);
    // Verify the item center maps approximately to container center
    const worldCenterX = 550;
    const worldCenterY = 525;
    const screenX = worldCenterX * vp.scale + vp.offsetX;
    const screenY = worldCenterY * vp.scale + vp.offsetY;
    expect(screenX).toBeCloseTo(400, 0);
    expect(screenY).toBeCloseTo(300, 0);
  });

  it("respects max scale for small items", () => {
    const item: SearchableItem = {
      id: "1",
      label: "test",
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    };
    const vp = computeFocusViewport(item, containerSize, 80, 0.1, 5);
    expect(vp.scale).toBeLessThanOrEqual(5);
  });
});

// --- getCurrentMatchItemId ---

describe("getCurrentMatchItemId", () => {
  it("returns item id for valid index", () => {
    const result = createSearchResult(items, "→");
    expect(getCurrentMatchItemId(result)).toBe("1");
  });

  it("returns null for no matches", () => {
    expect(getCurrentMatchItemId(EMPTY_SEARCH_RESULT)).toBeNull();
  });

  it("returns correct id after navigation", () => {
    const result = createSearchResult(items, "→");
    const next = nextMatch(result);
    expect(getCurrentMatchItemId(next)).toBe("2");
  });

  it("returns null for negative index", () => {
    const result = createSearchResult(items, "nonexistent");
    expect(getCurrentMatchItemId(result)).toBeNull();
  });
});

// --- EMPTY_SEARCH_RESULT ---

describe("EMPTY_SEARCH_RESULT", () => {
  it("has empty query", () => {
    expect(EMPTY_SEARCH_RESULT.query).toBe("");
  });

  it("has no matches", () => {
    expect(EMPTY_SEARCH_RESULT.matches).toHaveLength(0);
  });

  it("has currentIndex -1", () => {
    expect(EMPTY_SEARCH_RESULT.currentIndex).toBe(-1);
  });
});
