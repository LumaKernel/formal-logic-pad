/**
 * visualizationHighlightLogic の純粋ロジックテスト。
 */
import { describe, it, expect } from "vitest";
import {
  getHighlightStyle,
  ALL_HIGHLIGHT_COLORS,
} from "./visualizationHighlightLogic";
import type { HighlightColor } from "./visualizationState";

describe("visualizationHighlightLogic", () => {
  describe("getHighlightStyle", () => {
    it.each(ALL_HIGHLIGHT_COLORS)(
      "%s に対して outline と boxShadow を返す",
      (color: HighlightColor) => {
        const style = getHighlightStyle(color);
        expect(style.outline).toContain("2px solid");
        expect(style.boxShadow).toContain("0 0 8px");
      },
    );

    it("red は赤系の色を返す", () => {
      const style = getHighlightStyle("red");
      expect(style.outline).toContain("239, 68, 68");
    });

    it("blue は青系の色を返す", () => {
      const style = getHighlightStyle("blue");
      expect(style.outline).toContain("59, 130, 246");
    });

    it("green は緑系の色を返す", () => {
      const style = getHighlightStyle("green");
      expect(style.outline).toContain("34, 197, 94");
    });

    it("yellow は黄系の色を返す", () => {
      const style = getHighlightStyle("yellow");
      expect(style.outline).toContain("234, 179, 8");
    });

    it("purple は紫系の色を返す", () => {
      const style = getHighlightStyle("purple");
      expect(style.outline).toContain("168, 85, 247");
    });

    it("orange はオレンジ系の色を返す", () => {
      const style = getHighlightStyle("orange");
      expect(style.outline).toContain("249, 115, 22");
    });
  });

  describe("ALL_HIGHLIGHT_COLORS", () => {
    it("6色を含む", () => {
      expect(ALL_HIGHLIGHT_COLORS).toHaveLength(6);
    });

    it("全色がユニーク", () => {
      expect(new Set(ALL_HIGHLIGHT_COLORS).size).toBe(
        ALL_HIGHLIGHT_COLORS.length,
      );
    });
  });
});
