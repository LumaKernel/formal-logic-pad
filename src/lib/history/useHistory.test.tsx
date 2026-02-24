import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useHistory } from "./useHistory";

describe("useHistory hook", () => {
  it("initializes with the given state", () => {
    const { result } = renderHook(() => useHistory("initial"));
    expect(result.current.state).toBe("initial");
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.undoCount).toBe(0);
    expect(result.current.redoCount).toBe(0);
  });

  it("push creates undo entry", () => {
    const { result } = renderHook(() => useHistory(0));

    act(() => {
      result.current.push(1);
    });

    expect(result.current.state).toBe(1);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.undoCount).toBe(1);
  });

  it("undo restores previous state", () => {
    const { result } = renderHook(() => useHistory("a"));

    act(() => {
      result.current.push("b");
    });
    act(() => {
      result.current.undo();
    });

    expect(result.current.state).toBe("a");
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it("redo restores undone state", () => {
    const { result } = renderHook(() => useHistory("a"));

    act(() => {
      result.current.push("b");
    });
    act(() => {
      result.current.undo();
    });
    act(() => {
      result.current.redo();
    });

    expect(result.current.state).toBe("b");
    expect(result.current.canRedo).toBe(false);
  });

  it("push after undo clears redo stack", () => {
    const { result } = renderHook(() => useHistory(0));

    act(() => {
      result.current.push(1);
    });
    act(() => {
      result.current.push(2);
    });
    act(() => {
      result.current.undo();
    });
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.push(3);
    });
    expect(result.current.canRedo).toBe(false);
    expect(result.current.state).toBe(3);
  });

  it("replace does not create undo entry", () => {
    const { result } = renderHook(() => useHistory({ x: 0 }));

    act(() => {
      result.current.push({ x: 10 });
    });
    act(() => {
      result.current.replace({ x: 15 });
    });
    act(() => {
      result.current.replace({ x: 20 });
    });

    expect(result.current.state).toEqual({ x: 20 });
    expect(result.current.undoCount).toBe(1);

    act(() => {
      result.current.undo();
    });
    expect(result.current.state).toEqual({ x: 0 });
  });

  it("undo is no-op when nothing to undo", () => {
    const { result } = renderHook(() => useHistory("only"));

    act(() => {
      result.current.undo();
    });
    expect(result.current.state).toBe("only");
  });

  it("redo is no-op when nothing to redo", () => {
    const { result } = renderHook(() => useHistory("only"));

    act(() => {
      result.current.redo();
    });
    expect(result.current.state).toBe("only");
  });

  it("reset clears everything and sets new initial state", () => {
    const { result } = renderHook(() => useHistory(0));

    act(() => {
      result.current.push(1);
    });
    act(() => {
      result.current.push(2);
    });
    act(() => {
      result.current.reset(100);
    });

    expect(result.current.state).toBe(100);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("clear keeps present but clears past/future", () => {
    const { result } = renderHook(() => useHistory(0));

    act(() => {
      result.current.push(1);
    });
    act(() => {
      result.current.push(2);
    });
    act(() => {
      result.current.undo();
    });
    // present=1, past=[0], future=[2]

    act(() => {
      result.current.clear();
    });

    expect(result.current.state).toBe(1);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  describe("maxPastSize option", () => {
    it("limits the number of undo steps", () => {
      const { result } = renderHook(() => useHistory(0, { maxPastSize: 2 }));

      act(() => {
        result.current.push(1);
      });
      act(() => {
        result.current.push(2);
      });
      act(() => {
        result.current.push(3);
      });

      expect(result.current.undoCount).toBe(2);
      expect(result.current.state).toBe(3);

      act(() => {
        result.current.undo();
      });
      expect(result.current.state).toBe(2);

      act(() => {
        result.current.undo();
      });
      expect(result.current.state).toBe(1);

      // cannot undo further (0 was dropped)
      expect(result.current.canUndo).toBe(false);
    });
  });

  it("handles multiple undo/redo cycles", () => {
    const { result } = renderHook(() => useHistory("a"));

    act(() => {
      result.current.push("b");
    });
    act(() => {
      result.current.push("c");
    });

    // undo all
    act(() => {
      result.current.undo();
    });
    act(() => {
      result.current.undo();
    });
    expect(result.current.state).toBe("a");
    expect(result.current.redoCount).toBe(2);

    // redo one
    act(() => {
      result.current.redo();
    });
    expect(result.current.state).toBe("b");

    // push new, discards "c" from redo
    act(() => {
      result.current.push("d");
    });
    expect(result.current.state).toBe("d");
    expect(result.current.canRedo).toBe(false);
    expect(result.current.undoCount).toBe(2); // ["a", "b"]
  });

  it("works with complex object state", () => {
    interface AppState {
      readonly nodes: readonly string[];
      readonly selectedId: string | null;
    }

    const initial: AppState = { nodes: [], selectedId: null };
    const { result } = renderHook(() => useHistory(initial));

    const state1: AppState = { nodes: ["n1"], selectedId: "n1" };
    act(() => {
      result.current.push(state1);
    });

    const state2: AppState = { nodes: ["n1", "n2"], selectedId: "n2" };
    act(() => {
      result.current.push(state2);
    });

    act(() => {
      result.current.undo();
    });
    expect(result.current.state).toBe(state1);
    expect(result.current.state.nodes).toEqual(["n1"]);
  });
});
