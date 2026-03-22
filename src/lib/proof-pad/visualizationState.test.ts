/**
 * visualizationState の純粋ロジックテスト。
 */
import { describe, it, expect } from "vitest";
import {
  emptyVisualizationState,
  addHighlight,
  removeHighlight,
  clearHighlights,
  addAnnotation,
  removeAnnotation,
  clearAnnotations,
  addLog,
  clearLogs,
  clearAll,
  isHighlightColor,
  type NodeHighlight,
  type NodeAnnotation,
  type VisualizationLogEntry,
} from "./visualizationState";

describe("visualizationState", () => {
  // ── emptyVisualizationState ──

  describe("emptyVisualizationState", () => {
    it("空のハイライト・アノテーション・ログを持つ", () => {
      expect(emptyVisualizationState.highlights.size).toBe(0);
      expect(emptyVisualizationState.annotations.size).toBe(0);
      expect(emptyVisualizationState.logs).toEqual([]);
    });
  });

  // ── isHighlightColor ──

  describe("isHighlightColor", () => {
    it("有効な色に対して true を返す", () => {
      expect(isHighlightColor("red")).toBe(true);
      expect(isHighlightColor("blue")).toBe(true);
      expect(isHighlightColor("green")).toBe(true);
      expect(isHighlightColor("yellow")).toBe(true);
      expect(isHighlightColor("purple")).toBe(true);
      expect(isHighlightColor("orange")).toBe(true);
    });

    it("無効な色に対して false を返す", () => {
      expect(isHighlightColor("pink")).toBe(false);
      expect(isHighlightColor("")).toBe(false);
      expect(isHighlightColor(42)).toBe(false);
      expect(isHighlightColor(null)).toBe(false);
      expect(isHighlightColor(undefined)).toBe(false);
    });
  });

  // ── ハイライト操作 ──

  describe("addHighlight", () => {
    it("ハイライトを追加する", () => {
      const h: NodeHighlight = { nodeId: "n1", color: "red" };
      const next = addHighlight(emptyVisualizationState, h);
      expect(next.highlights.size).toBe(1);
      expect(next.highlights.get("n1")).toEqual(h);
    });

    it("同じnodeIdで上書きする", () => {
      const h1: NodeHighlight = { nodeId: "n1", color: "red" };
      const h2: NodeHighlight = { nodeId: "n1", color: "blue", label: "new" };
      const s1 = addHighlight(emptyVisualizationState, h1);
      const s2 = addHighlight(s1, h2);
      expect(s2.highlights.size).toBe(1);
      expect(s2.highlights.get("n1")).toEqual(h2);
    });

    it("複数ノードにハイライトを追加する", () => {
      const h1: NodeHighlight = { nodeId: "n1", color: "red" };
      const h2: NodeHighlight = { nodeId: "n2", color: "blue" };
      const s1 = addHighlight(emptyVisualizationState, h1);
      const s2 = addHighlight(s1, h2);
      expect(s2.highlights.size).toBe(2);
    });

    it("他の状態フィールドに影響しない", () => {
      const h: NodeHighlight = { nodeId: "n1", color: "green" };
      const withLog = addLog(emptyVisualizationState, {
        message: "test",
        level: "info",
        timestamp: 0,
      });
      const next = addHighlight(withLog, h);
      expect(next.logs).toEqual(withLog.logs);
      expect(next.annotations).toBe(withLog.annotations);
    });
  });

  describe("removeHighlight", () => {
    it("ハイライトを除去する", () => {
      const h: NodeHighlight = { nodeId: "n1", color: "red" };
      const s1 = addHighlight(emptyVisualizationState, h);
      const s2 = removeHighlight(s1, "n1");
      expect(s2.highlights.size).toBe(0);
    });

    it("存在しないnodeIdを指定してもエラーにならない", () => {
      const next = removeHighlight(emptyVisualizationState, "nonexistent");
      expect(next.highlights.size).toBe(0);
    });
  });

  describe("clearHighlights", () => {
    it("全ハイライトをクリアする", () => {
      const h1: NodeHighlight = { nodeId: "n1", color: "red" };
      const h2: NodeHighlight = { nodeId: "n2", color: "blue" };
      const s = addHighlight(addHighlight(emptyVisualizationState, h1), h2);
      const next = clearHighlights(s);
      expect(next.highlights.size).toBe(0);
    });

    it("アノテーション・ログに影響しない", () => {
      const ann: NodeAnnotation = { id: "a1", nodeId: "n1", text: "hello" };
      const s = addAnnotation(
        addHighlight(emptyVisualizationState, {
          nodeId: "n1",
          color: "red",
        }),
        ann,
      );
      const next = clearHighlights(s);
      expect(next.annotations.size).toBe(1);
    });
  });

  // ── アノテーション操作 ──

  describe("addAnnotation", () => {
    it("アノテーションを追加する", () => {
      const ann: NodeAnnotation = { id: "a1", nodeId: "n1", text: "note" };
      const next = addAnnotation(emptyVisualizationState, ann);
      expect(next.annotations.size).toBe(1);
      expect(next.annotations.get("a1")).toEqual(ann);
    });

    it("同じIDで上書きする", () => {
      const a1: NodeAnnotation = { id: "a1", nodeId: "n1", text: "old" };
      const a2: NodeAnnotation = { id: "a1", nodeId: "n1", text: "new" };
      const s1 = addAnnotation(emptyVisualizationState, a1);
      const s2 = addAnnotation(s1, a2);
      expect(s2.annotations.size).toBe(1);
      expect(s2.annotations.get("a1")?.text).toBe("new");
    });
  });

  describe("removeAnnotation", () => {
    it("アノテーションを除去する", () => {
      const ann: NodeAnnotation = { id: "a1", nodeId: "n1", text: "note" };
      const s1 = addAnnotation(emptyVisualizationState, ann);
      const s2 = removeAnnotation(s1, "a1");
      expect(s2.annotations.size).toBe(0);
    });

    it("存在しないIDでもエラーにならない", () => {
      const next = removeAnnotation(emptyVisualizationState, "nonexistent");
      expect(next.annotations.size).toBe(0);
    });
  });

  describe("clearAnnotations", () => {
    it("全アノテーションをクリアする", () => {
      const a1: NodeAnnotation = { id: "a1", nodeId: "n1", text: "note1" };
      const a2: NodeAnnotation = { id: "a2", nodeId: "n2", text: "note2" };
      const s = addAnnotation(addAnnotation(emptyVisualizationState, a1), a2);
      const next = clearAnnotations(s);
      expect(next.annotations.size).toBe(0);
    });
  });

  // ── ログ操作 ──

  describe("addLog", () => {
    it("ログエントリを追加する", () => {
      const entry: VisualizationLogEntry = {
        message: "hello",
        level: "info",
        timestamp: 1000,
      };
      const next = addLog(emptyVisualizationState, entry);
      expect(next.logs).toHaveLength(1);
      expect(next.logs[0]).toEqual(entry);
    });

    it("ログは時系列で追加される", () => {
      const e1: VisualizationLogEntry = {
        message: "first",
        level: "info",
        timestamp: 1000,
      };
      const e2: VisualizationLogEntry = {
        message: "second",
        level: "warn",
        timestamp: 2000,
      };
      const s = addLog(addLog(emptyVisualizationState, e1), e2);
      expect(s.logs).toHaveLength(2);
      expect(s.logs[0]?.message).toBe("first");
      expect(s.logs[1]?.message).toBe("second");
    });
  });

  describe("clearLogs", () => {
    it("ログをクリアする", () => {
      const entry: VisualizationLogEntry = {
        message: "test",
        level: "error",
        timestamp: 0,
      };
      const s = addLog(emptyVisualizationState, entry);
      const next = clearLogs(s);
      expect(next.logs).toEqual([]);
    });
  });

  // ── 全クリア ──

  describe("clearAll", () => {
    it("全状態をクリアする", () => {
      const h: NodeHighlight = { nodeId: "n1", color: "red" };
      const ann: NodeAnnotation = { id: "a1", nodeId: "n1", text: "note" };
      const log: VisualizationLogEntry = {
        message: "test",
        level: "info",
        timestamp: 0,
      };
      addLog(addAnnotation(addHighlight(emptyVisualizationState, h), ann), log);
      const next = clearAll();
      expect(next.highlights.size).toBe(0);
      expect(next.annotations.size).toBe(0);
      expect(next.logs).toEqual([]);
    });

    it("emptyVisualizationStateを返す", () => {
      const next = clearAll();
      expect(next).toBe(emptyVisualizationState);
    });
  });
});
