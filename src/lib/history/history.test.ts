import { describe, expect, it } from "vitest";

import {
  canRedo,
  canUndo,
  clearHistory,
  createHistory,
  pushState,
  pushStateWithLimit,
  redo,
  redoCount,
  replacePresent,
  undo,
  undoCount,
} from "./history";

describe("createHistory", () => {
  it("creates a history with initial state as present", () => {
    const h = createHistory(42);
    expect(h.present).toBe(42);
    expect(h.past).toEqual([]);
    expect(h.future).toEqual([]);
  });

  it("works with object state", () => {
    const state = { readonly: true, x: 10, y: 20 };
    const h = createHistory(state);
    expect(h.present).toBe(state);
  });

  it("works with array state", () => {
    const state = [1, 2, 3] as const;
    const h = createHistory(state);
    expect(h.present).toBe(state);
  });
});

describe("canUndo / canRedo", () => {
  it("returns false for fresh history", () => {
    const h = createHistory("a");
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
  });

  it("canUndo returns true after pushState", () => {
    const h = pushState(createHistory("a"), "b");
    expect(canUndo(h)).toBe(true);
    expect(canRedo(h)).toBe(false);
  });

  it("canRedo returns true after undo", () => {
    const h = undo(pushState(createHistory("a"), "b"));
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(true);
  });
});

describe("pushState", () => {
  it("moves present to past and sets new present", () => {
    const h0 = createHistory("a");
    const h1 = pushState(h0, "b");
    expect(h1.present).toBe("b");
    expect(h1.past).toEqual(["a"]);
    expect(h1.future).toEqual([]);
  });

  it("accumulates past entries", () => {
    let h = createHistory(0);
    h = pushState(h, 1);
    h = pushState(h, 2);
    h = pushState(h, 3);
    expect(h.past).toEqual([0, 1, 2]);
    expect(h.present).toBe(3);
  });

  it("clears future on push", () => {
    let h = createHistory("a");
    h = pushState(h, "b");
    h = pushState(h, "c");
    h = undo(h); // present = "b", future = ["c"]
    expect(canRedo(h)).toBe(true);

    h = pushState(h, "d");
    expect(h.present).toBe("d");
    expect(h.future).toEqual([]);
    expect(canRedo(h)).toBe(false);
  });

  it("preserves referential equality of past entries", () => {
    const obj1 = { x: 1 };
    const obj2 = { x: 2 };
    const h = pushState(pushState(createHistory(obj1), obj2), { x: 3 });
    expect(h.past[0]).toBe(obj1);
    expect(h.past[1]).toBe(obj2);
  });
});

describe("pushStateWithLimit", () => {
  it("trims past when exceeding limit", () => {
    let h = createHistory(0);
    h = pushStateWithLimit(h, 1, 2);
    h = pushStateWithLimit(h, 2, 2);
    h = pushStateWithLimit(h, 3, 2);
    // past should be [1, 2], not [0, 1, 2]
    expect(h.past).toEqual([1, 2]);
    expect(h.present).toBe(3);
  });

  it("does not trim when under limit", () => {
    let h = createHistory(0);
    h = pushStateWithLimit(h, 1, 10);
    h = pushStateWithLimit(h, 2, 10);
    expect(h.past).toEqual([0, 1]);
    expect(h.present).toBe(2);
  });

  it("clears future on push", () => {
    let h = createHistory("a");
    h = pushStateWithLimit(h, "b", 5);
    h = pushStateWithLimit(h, "c", 5);
    h = undo(h);
    h = pushStateWithLimit(h, "d", 5);
    expect(h.future).toEqual([]);
  });

  it("handles limit of 0 (no past kept)", () => {
    let h = createHistory(0);
    h = pushStateWithLimit(h, 1, 0);
    h = pushStateWithLimit(h, 2, 0);
    expect(h.past).toEqual([]);
    expect(h.present).toBe(2);
    expect(canUndo(h)).toBe(false);
  });

  it("handles limit of 1", () => {
    let h = createHistory(0);
    h = pushStateWithLimit(h, 1, 1);
    h = pushStateWithLimit(h, 2, 1);
    h = pushStateWithLimit(h, 3, 1);
    expect(h.past).toEqual([2]);
    expect(h.present).toBe(3);
  });
});

describe("undo", () => {
  it("restores previous state", () => {
    const h0 = createHistory("a");
    const h1 = pushState(h0, "b");
    const h2 = undo(h1);
    expect(h2.present).toBe("a");
    expect(h2.past).toEqual([]);
    expect(h2.future).toEqual(["b"]);
  });

  it("returns same history if past is empty", () => {
    const h = createHistory("a");
    const result = undo(h);
    expect(result).toBe(h);
  });

  it("supports multiple undo steps", () => {
    let h = createHistory(0);
    h = pushState(h, 1);
    h = pushState(h, 2);
    h = pushState(h, 3);

    h = undo(h);
    expect(h.present).toBe(2);
    expect(h.future).toEqual([3]);

    h = undo(h);
    expect(h.present).toBe(1);
    expect(h.future).toEqual([2, 3]);

    h = undo(h);
    expect(h.present).toBe(0);
    expect(h.future).toEqual([1, 2, 3]);

    // no more undo
    const same = undo(h);
    expect(same).toBe(h);
  });

  it("preserves referential equality after no-op undo", () => {
    const h = createHistory({ x: 1 });
    expect(undo(h)).toBe(h);
  });
});

describe("redo", () => {
  it("restores future state", () => {
    let h = createHistory("a");
    h = pushState(h, "b");
    h = undo(h);
    h = redo(h);
    expect(h.present).toBe("b");
    expect(h.past).toEqual(["a"]);
    expect(h.future).toEqual([]);
  });

  it("returns same history if future is empty", () => {
    const h = createHistory("a");
    const result = redo(h);
    expect(result).toBe(h);
  });

  it("supports multiple redo steps", () => {
    let h = createHistory(0);
    h = pushState(h, 1);
    h = pushState(h, 2);
    h = undo(h);
    h = undo(h);

    // present=0, future=[1, 2]
    h = redo(h);
    expect(h.present).toBe(1);
    expect(h.future).toEqual([2]);

    h = redo(h);
    expect(h.present).toBe(2);
    expect(h.future).toEqual([]);

    // no more redo
    const same = redo(h);
    expect(same).toBe(h);
  });

  it("preserves referential equality after no-op redo", () => {
    const h = pushState(createHistory({ a: 1 }), { a: 2 });
    expect(redo(h)).toBe(h);
  });
});

describe("undo/redo round-trip", () => {
  it("undo then redo returns to same state value", () => {
    let h = createHistory("start");
    h = pushState(h, "end");
    h = undo(h);
    h = redo(h);
    expect(h.present).toBe("end");
    expect(h.past).toEqual(["start"]);
    expect(h.future).toEqual([]);
  });

  it("multiple undo/redo cycles work correctly", () => {
    let h = createHistory(0);
    h = pushState(h, 1);
    h = pushState(h, 2);

    // undo all
    h = undo(h);
    h = undo(h);
    expect(h.present).toBe(0);

    // redo all
    h = redo(h);
    h = redo(h);
    expect(h.present).toBe(2);

    // undo one, push new
    h = undo(h);
    expect(h.present).toBe(1);
    h = pushState(h, 3);
    expect(h.present).toBe(3);
    expect(h.future).toEqual([]);
    expect(canRedo(h)).toBe(false);
  });
});

describe("clearHistory", () => {
  it("clears past and future, keeps present", () => {
    let h = createHistory(0);
    h = pushState(h, 1);
    h = pushState(h, 2);
    h = undo(h);
    // past=[0], present=1, future=[2]

    const cleared = clearHistory(h);
    expect(cleared.present).toBe(1);
    expect(cleared.past).toEqual([]);
    expect(cleared.future).toEqual([]);
  });

  it("is identity for fresh history", () => {
    const h = createHistory("x");
    const cleared = clearHistory(h);
    expect(cleared.present).toBe("x");
    expect(cleared.past).toEqual([]);
    expect(cleared.future).toEqual([]);
  });
});

describe("replacePresent", () => {
  it("replaces present without affecting past/future", () => {
    let h = createHistory("a");
    h = pushState(h, "b");
    h = pushState(h, "c");
    h = undo(h);
    // past=["a"], present="b", future=["c"]

    const replaced = replacePresent(h, "b-modified");
    expect(replaced.present).toBe("b-modified");
    expect(replaced.past).toEqual(["a"]);
    expect(replaced.future).toEqual(["c"]);
  });

  it("allows transient update without undo entry", () => {
    let h = createHistory({ x: 0, y: 0 });
    h = pushState(h, { x: 10, y: 10 });
    // simulate drag (transient updates)
    h = replacePresent(h, { x: 11, y: 11 });
    h = replacePresent(h, { x: 12, y: 12 });

    // only one undo step to get back to origin
    expect(undoCount(h)).toBe(1);
    h = undo(h);
    expect(h.present).toEqual({ x: 0, y: 0 });
  });
});

describe("undoCount / redoCount", () => {
  it("returns 0 for fresh history", () => {
    const h = createHistory("a");
    expect(undoCount(h)).toBe(0);
    expect(redoCount(h)).toBe(0);
  });

  it("tracks counts correctly through operations", () => {
    let h = createHistory(0);
    h = pushState(h, 1);
    h = pushState(h, 2);
    h = pushState(h, 3);
    expect(undoCount(h)).toBe(3);
    expect(redoCount(h)).toBe(0);

    h = undo(h);
    expect(undoCount(h)).toBe(2);
    expect(redoCount(h)).toBe(1);

    h = undo(h);
    expect(undoCount(h)).toBe(1);
    expect(redoCount(h)).toBe(2);
  });
});

describe("type safety with complex state", () => {
  it("works with nested readonly objects", () => {
    interface CanvasState {
      readonly nodes: readonly {
        readonly id: string;
        readonly x: number;
        readonly y: number;
      }[];
      readonly connections: readonly {
        readonly from: string;
        readonly to: string;
      }[];
    }

    const initial: CanvasState = { nodes: [], connections: [] };
    let h = createHistory(initial);

    const withNode: CanvasState = {
      nodes: [{ id: "n1", x: 0, y: 0 }],
      connections: [],
    };
    h = pushState(h, withNode);

    const withConnection: CanvasState = {
      nodes: [{ id: "n1", x: 0, y: 0 }],
      connections: [{ from: "n1", to: "n2" }],
    };
    h = pushState(h, withConnection);

    h = undo(h);
    expect(h.present.connections).toEqual([]);
    expect(h.present.nodes).toHaveLength(1);

    h = undo(h);
    expect(h.present.nodes).toEqual([]);
  });
});
