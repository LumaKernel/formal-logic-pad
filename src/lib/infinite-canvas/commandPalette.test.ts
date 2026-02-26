import { describe, it, expect } from "vitest";
import {
  filterItems,
  createCommandPaletteState,
  selectNext,
  selectPrevious,
  getSelectedItem,
  EMPTY_COMMAND_PALETTE_STATE,
  type CommandItem,
} from "./commandPalette";

// --- Test data ---

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

// --- filterItems ---

describe("filterItems", () => {
  it("returns all items for empty query", () => {
    const result = filterItems(items, "");
    expect(result).toEqual(items);
  });

  it("filters by label (case-insensitive)", () => {
    const result = filterItems(items, "a1");
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("a1");
  });

  it("filters by description (case-insensitive)", () => {
    const result = filterItems(items, "modus");
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("mp");
  });

  it("returns empty array when nothing matches", () => {
    const result = filterItems(items, "zzz");
    expect(result).toHaveLength(0);
  });

  it("matches partial substring in label", () => {
    const result = filterItems(items, "(K)");
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("a1");
  });

  it("matches partial substring in description", () => {
    const result = filterItems(items, "汎化");
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("gen");
  });

  it("matches multiple items", () => {
    const result = filterItems(items, "A");
    // A1, A2, A3 match label; none match only description
    expect(result.length).toBeGreaterThanOrEqual(3);
  });

  it("is case-insensitive for both label and description", () => {
    const result = filterItems(items, "MP");
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("mp");

    const result2 = filterItems(items, "mp");
    expect(result2).toHaveLength(1);
    expect(result2[0]!.id).toBe("mp");
  });
});

// --- createCommandPaletteState ---

describe("createCommandPaletteState", () => {
  it("creates state with all items for empty query", () => {
    const state = createCommandPaletteState(items, "");
    expect(state.query).toBe("");
    expect(state.filteredItems).toEqual(items);
    expect(state.selectedIndex).toBe(0);
  });

  it("creates state with filtered items for non-empty query", () => {
    const state = createCommandPaletteState(items, "MP");
    expect(state.query).toBe("MP");
    expect(state.filteredItems).toHaveLength(1);
    expect(state.selectedIndex).toBe(0);
  });

  it("creates state with selectedIndex -1 when no matches", () => {
    const state = createCommandPaletteState(items, "zzz");
    expect(state.filteredItems).toHaveLength(0);
    expect(state.selectedIndex).toBe(-1);
  });

  it("creates state with empty items list", () => {
    const state = createCommandPaletteState([], "any");
    expect(state.filteredItems).toHaveLength(0);
    expect(state.selectedIndex).toBe(-1);
  });
});

// --- selectNext ---

describe("selectNext", () => {
  it("moves to next item", () => {
    const state = createCommandPaletteState(items, "");
    expect(state.selectedIndex).toBe(0);
    const next = selectNext(state);
    expect(next.selectedIndex).toBe(1);
  });

  it("wraps around at end", () => {
    const state = createCommandPaletteState(items, "");
    let current = state;
    for (let i = 0; i < items.length; i++) {
      current = selectNext(current);
    }
    expect(current.selectedIndex).toBe(0);
  });

  it("returns same state when no items", () => {
    const state = createCommandPaletteState(items, "zzz");
    const next = selectNext(state);
    expect(next).toBe(state);
  });
});

// --- selectPrevious ---

describe("selectPrevious", () => {
  it("wraps to last item from first", () => {
    const state = createCommandPaletteState(items, "");
    expect(state.selectedIndex).toBe(0);
    const prev = selectPrevious(state);
    expect(prev.selectedIndex).toBe(items.length - 1);
  });

  it("moves to previous item", () => {
    const state = createCommandPaletteState(items, "");
    const next = selectNext(state);
    expect(next.selectedIndex).toBe(1);
    const prev = selectPrevious(next);
    expect(prev.selectedIndex).toBe(0);
  });

  it("returns same state when no items", () => {
    const state = createCommandPaletteState(items, "zzz");
    const prev = selectPrevious(state);
    expect(prev).toBe(state);
  });
});

// --- getSelectedItem ---

describe("getSelectedItem", () => {
  it("returns selected item", () => {
    const state = createCommandPaletteState(items, "");
    const item = getSelectedItem(state);
    expect(item).toEqual(items[0]);
  });

  it("returns null when selectedIndex is -1", () => {
    const item = getSelectedItem(EMPTY_COMMAND_PALETTE_STATE);
    expect(item).toBeNull();
  });

  it("returns null when selectedIndex is out of bounds", () => {
    const state: import("./commandPalette").CommandPaletteState = {
      query: "",
      filteredItems: [],
      selectedIndex: 5,
    };
    const item = getSelectedItem(state);
    expect(item).toBeNull();
  });

  it("returns correct item after navigation", () => {
    const state = createCommandPaletteState(items, "");
    const next = selectNext(state);
    const item = getSelectedItem(next);
    expect(item).toEqual(items[1]);
  });
});

// --- EMPTY_COMMAND_PALETTE_STATE ---

describe("EMPTY_COMMAND_PALETTE_STATE", () => {
  it("has correct initial values", () => {
    expect(EMPTY_COMMAND_PALETTE_STATE.query).toBe("");
    expect(EMPTY_COMMAND_PALETTE_STATE.filteredItems).toHaveLength(0);
    expect(EMPTY_COMMAND_PALETTE_STATE.selectedIndex).toBe(-1);
  });
});
