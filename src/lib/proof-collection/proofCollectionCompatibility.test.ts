import { describe, it, expect } from "vitest";
import type { ProofEntry } from "./proofCollectionState";
import {
  checkProofCompatibility,
  isCallable,
  hasWarnings,
  type CompatibilityResult,
} from "./proofCollectionCompatibility";

// --- テスト用ヘルパー ---

const createTestEntry = (overrides?: Partial<ProofEntry>): ProofEntry => ({
  id: "proof-1",
  name: "テスト証明",
  memo: "",
  folderId: undefined,
  createdAt: 1000,
  updatedAt: 1000,
  nodes: [],
  connections: [],
  inferenceEdges: [],
  deductionStyle: "hilbert",
  usedAxiomIds: ["A1", "A2"],
  ...overrides,
});

describe("checkProofCompatibility", () => {
  describe("スタイル一致", () => {
    it("公理がすべてターゲットにある場合はFullyCompatible", () => {
      const entry = createTestEntry({ usedAxiomIds: ["A1", "A2"] });
      const targetAxioms = new Set(["A1", "A2", "A3"]);

      const result = checkProofCompatibility(entry, "hilbert", targetAxioms);
      expect(result._tag).toBe("FullyCompatible");
    });

    it("公理が空の場合はFullyCompatible", () => {
      const entry = createTestEntry({ usedAxiomIds: [] });
      const targetAxioms = new Set(["A1"]);

      const result = checkProofCompatibility(entry, "hilbert", targetAxioms);
      expect(result._tag).toBe("FullyCompatible");
    });

    it("一部の公理がターゲットにない場合はCompatibleWithAxiomWarnings", () => {
      const entry = createTestEntry({ usedAxiomIds: ["A1", "A2", "DNE"] });
      const targetAxioms = new Set(["A1", "A2"]);

      const result = checkProofCompatibility(entry, "hilbert", targetAxioms);
      expect(result._tag).toBe("CompatibleWithAxiomWarnings");
      if (result._tag === "CompatibleWithAxiomWarnings") {
        expect(result.missingAxiomIds).toEqual(["DNE"]);
      }
    });

    it("複数の公理がターゲットにない場合", () => {
      const entry = createTestEntry({ usedAxiomIds: ["A1", "DNE", "EFQ"] });
      const targetAxioms = new Set(["A1"]);

      const result = checkProofCompatibility(entry, "hilbert", targetAxioms);
      expect(result._tag).toBe("CompatibleWithAxiomWarnings");
      if (result._tag === "CompatibleWithAxiomWarnings") {
        expect(result.missingAxiomIds).toEqual(["DNE", "EFQ"]);
      }
    });

    it("ターゲット公理が空の場合、すべての公理がmissing", () => {
      const entry = createTestEntry({ usedAxiomIds: ["A1", "A2"] });
      const targetAxioms = new Set<string>();

      const result = checkProofCompatibility(entry, "hilbert", targetAxioms);
      expect(result._tag).toBe("CompatibleWithAxiomWarnings");
      if (result._tag === "CompatibleWithAxiomWarnings") {
        expect(result.missingAxiomIds).toEqual(["A1", "A2"]);
      }
    });
  });

  describe("スタイル不一致", () => {
    it("Hilbert → NDは IncompatibleStyle", () => {
      const entry = createTestEntry({ deductionStyle: "hilbert" });
      const targetAxioms = new Set(["A1", "A2"]);

      const result = checkProofCompatibility(
        entry,
        "natural-deduction",
        targetAxioms,
      );
      expect(result._tag).toBe("IncompatibleStyle");
      if (result._tag === "IncompatibleStyle") {
        expect(result.sourceStyle).toBe("hilbert");
        expect(result.targetStyle).toBe("natural-deduction");
      }
    });

    it("ND → SCは IncompatibleStyle", () => {
      const entry = createTestEntry({ deductionStyle: "natural-deduction" });
      const targetAxioms = new Set<string>();

      const result = checkProofCompatibility(
        entry,
        "sequent-calculus",
        targetAxioms,
      );
      expect(result._tag).toBe("IncompatibleStyle");
    });

    it("SC → Hilbertは IncompatibleStyle", () => {
      const entry = createTestEntry({ deductionStyle: "sequent-calculus" });
      const targetAxioms = new Set<string>();

      const result = checkProofCompatibility(entry, "hilbert", targetAxioms);
      expect(result._tag).toBe("IncompatibleStyle");
    });
  });

  describe("全5スタイルの同一スタイルチェック", () => {
    const styles = [
      "hilbert",
      "natural-deduction",
      "sequent-calculus",
      "tableau-calculus",
      "analytic-tableau",
    ] as const;

    for (const style of styles) {
      it(`${style satisfies string} → ${style satisfies string} はスタイル互換`, () => {
        const entry = createTestEntry({
          deductionStyle: style,
          usedAxiomIds: [],
        });
        const result = checkProofCompatibility(entry, style, new Set());
        expect(result._tag).toBe("FullyCompatible");
      });
    }
  });
});

describe("isCallable", () => {
  it("FullyCompatibleは呼び出し可能", () => {
    const result: CompatibilityResult = { _tag: "FullyCompatible" };
    expect(isCallable(result)).toBe(true);
  });

  it("CompatibleWithAxiomWarningsは呼び出し可能", () => {
    const result: CompatibilityResult = {
      _tag: "CompatibleWithAxiomWarnings",
      missingAxiomIds: ["DNE"],
    };
    expect(isCallable(result)).toBe(true);
  });

  it("IncompatibleStyleも呼び出し可能（仕様通り）", () => {
    const result: CompatibilityResult = {
      _tag: "IncompatibleStyle",
      sourceStyle: "hilbert",
      targetStyle: "natural-deduction",
    };
    expect(isCallable(result)).toBe(true);
  });
});

describe("hasWarnings", () => {
  it("FullyCompatibleは警告なし", () => {
    const result: CompatibilityResult = { _tag: "FullyCompatible" };
    expect(hasWarnings(result)).toBe(false);
  });

  it("CompatibleWithAxiomWarningsは警告あり", () => {
    const result: CompatibilityResult = {
      _tag: "CompatibleWithAxiomWarnings",
      missingAxiomIds: ["DNE"],
    };
    expect(hasWarnings(result)).toBe(true);
  });

  it("IncompatibleStyleは警告あり", () => {
    const result: CompatibilityResult = {
      _tag: "IncompatibleStyle",
      sourceStyle: "hilbert",
      targetStyle: "natural-deduction",
    };
    expect(hasWarnings(result)).toBe(true);
  });
});
