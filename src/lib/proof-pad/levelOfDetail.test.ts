import { describe, it, expect } from "vitest";
import {
  computeDetailLevel,
  getDetailVisibility,
  DEFAULT_THRESHOLDS,
} from "./levelOfDetail";
import type { DetailLevel, DetailLevelThresholds } from "./levelOfDetail";

describe("computeDetailLevel", () => {
  describe("デフォルト閾値", () => {
    it("scale=1.0でfullを返す", () => {
      expect(computeDetailLevel(1.0)).toBe("full");
    });

    it("scale=0.5（境界）でfullを返す", () => {
      expect(computeDetailLevel(0.5)).toBe("full");
    });

    it("scale=0.49でcompactを返す", () => {
      expect(computeDetailLevel(0.49)).toBe("compact");
    });

    it("scale=0.3（境界）でcompactを返す", () => {
      expect(computeDetailLevel(0.3)).toBe("compact");
    });

    it("scale=0.29でminimalを返す", () => {
      expect(computeDetailLevel(0.29)).toBe("minimal");
    });

    it("scale=0.1でminimalを返す", () => {
      expect(computeDetailLevel(0.1)).toBe("minimal");
    });

    it("scale=5.0でfullを返す", () => {
      expect(computeDetailLevel(5.0)).toBe("full");
    });
  });

  describe("カスタム閾値", () => {
    const custom: DetailLevelThresholds = {
      fullAbove: 0.8,
      compactAbove: 0.4,
    };

    it("scale=0.8でfullを返す", () => {
      expect(computeDetailLevel(0.8, custom)).toBe("full");
    });

    it("scale=0.79でcompactを返す", () => {
      expect(computeDetailLevel(0.79, custom)).toBe("compact");
    });

    it("scale=0.4でcompactを返す", () => {
      expect(computeDetailLevel(0.4, custom)).toBe("compact");
    });

    it("scale=0.39でminimalを返す", () => {
      expect(computeDetailLevel(0.39, custom)).toBe("minimal");
    });
  });

  describe("デフォルト閾値定数", () => {
    it("DEFAULT_THRESHOLDSが正しい値を持つ", () => {
      expect(DEFAULT_THRESHOLDS).toEqual({
        fullAbove: 0.5,
        compactAbove: 0.3,
      });
    });
  });
});

describe("getDetailVisibility", () => {
  it("fullレベルですべてtrueを返す", () => {
    const vis = getDetailVisibility("full");
    expect(vis).toEqual({
      showFormula: true,
      showStatus: true,
      showRoleBadge: true,
      showAxiomName: true,
      showProtectedBadge: true,
      showDependencies: true,
    });
  });

  it("compactレベルでformulaのみtrue", () => {
    const vis = getDetailVisibility("compact");
    expect(vis.showFormula).toBe(true);
    expect(vis.showStatus).toBe(false);
    expect(vis.showRoleBadge).toBe(false);
    expect(vis.showAxiomName).toBe(false);
    expect(vis.showProtectedBadge).toBe(false);
    expect(vis.showDependencies).toBe(false);
  });

  it("minimalレベルですべてfalse", () => {
    const vis = getDetailVisibility("minimal");
    expect(vis.showFormula).toBe(false);
    expect(vis.showStatus).toBe(false);
    expect(vis.showRoleBadge).toBe(false);
    expect(vis.showAxiomName).toBe(false);
    expect(vis.showProtectedBadge).toBe(false);
    expect(vis.showDependencies).toBe(false);
  });

  it("すべてのDetailLevelに対してDetailVisibilityを返す（exhaustive確認）", () => {
    const levels: readonly DetailLevel[] = ["full", "compact", "minimal"];
    for (const level of levels) {
      const vis = getDetailVisibility(level);
      expect(typeof vis.showFormula).toBe("boolean");
      expect(typeof vis.showStatus).toBe("boolean");
      expect(typeof vis.showRoleBadge).toBe("boolean");
      expect(typeof vis.showAxiomName).toBe("boolean");
      expect(typeof vis.showProtectedBadge).toBe("boolean");
      expect(typeof vis.showDependencies).toBe("boolean");
    }
  });

  describe("overrides", () => {
    it("overrides未指定時はデフォルト動作と同じ", () => {
      const vis = getDetailVisibility("full", undefined);
      expect(vis.showDependencies).toBe(true);
    });

    it("fullレベルでshowDependencies: falseをオーバーライドできる", () => {
      const vis = getDetailVisibility("full", { showDependencies: false });
      expect(vis.showDependencies).toBe(false);
      // 他のフィールドはfullのデフォルト値を維持
      expect(vis.showFormula).toBe(true);
      expect(vis.showStatus).toBe(true);
      expect(vis.showRoleBadge).toBe(true);
      expect(vis.showAxiomName).toBe(true);
      expect(vis.showProtectedBadge).toBe(true);
    });

    it("compactレベルでshowDependencies: trueをオーバーライドできる", () => {
      const vis = getDetailVisibility("compact", { showDependencies: true });
      expect(vis.showDependencies).toBe(true);
      // 他のフィールドはcompactのデフォルト値を維持
      expect(vis.showFormula).toBe(true);
      expect(vis.showStatus).toBe(false);
    });

    it("minimalレベルでshowDependencies: trueをオーバーライドできる", () => {
      const vis = getDetailVisibility("minimal", { showDependencies: true });
      expect(vis.showDependencies).toBe(true);
      // 他のフィールドはminimalのデフォルト値を維持
      expect(vis.showFormula).toBe(false);
    });

    it("空のoverridesオブジェクトではデフォルト動作", () => {
      const vis = getDetailVisibility("full", {});
      expect(vis.showDependencies).toBe(true);
    });

    it("showDependencies: undefinedではデフォルト動作", () => {
      const vis = getDetailVisibility("full", {
        showDependencies: undefined,
      });
      expect(vis.showDependencies).toBe(true);
    });
  });
});
