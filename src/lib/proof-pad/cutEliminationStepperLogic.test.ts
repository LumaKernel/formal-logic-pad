import { describe, expect, it } from "vitest";
import {
  computeCutEliminationStepperData,
  resolveStepperState,
  applyStepperAction,
  canStepForward,
  canStepBackward,
  formatSequentText,
  type StepperAction,
} from "./cutEliminationStepperLogic";
import { eliminateCutsWithSteps } from "../logic-core/cutElimination";
import {
  sequent,
  scIdentity,
  scCut,
  scWeakeningRight,
} from "../logic-core/sequentCalculus";
import { metaVariable, implication } from "../logic-core/formula";

// --- テスト用ヘルパー ---

const phi = metaVariable("\u03C6");
const psi = metaVariable("\u03C8");
const phiImplPsi = implication(phi, psi);

// カットフリーな単純な証明: φ ⊢ φ
function makeIdentityProof() {
  return scIdentity(sequent([phi], [phi]));
}

// カットを1つ含む証明: (φ ⊢ φ) CUT (φ ⊢ φ) => φ ⊢ φ
// 正しいカットの形: left: Γ ⊢ Δ, φ  right: φ, Γ' ⊢ Δ'  => Γ, Γ' ⊢ Δ, Δ'
// scCut(left, right, cutFormula, conclusion)
function makeSimpleCutProof() {
  const leftProof = scIdentity(sequent([phi], [phi]));
  const rightProof = scIdentity(sequent([phi], [phi]));
  return scCut(leftProof, rightProof, phi, sequent([phi], [phi]));
}

// rank 0のカット（片方の前提に主式がない）
function makeRank0CutProof() {
  // left: φ ⊢ φ（右辺にψがない）→ WeakeningRight で φ ⊢ φ, ψ を作る
  const leftBase = scIdentity(sequent([phi], [phi]));
  const leftProof = scWeakeningRight(leftBase, psi, sequent([phi], [phi, psi]));
  // right: ψ ⊢ ψ
  const rightProof = scIdentity(sequent([psi], [psi]));
  // CUT on ψ: (φ ⊢ φ, ψ) CUT (ψ ⊢ ψ) => φ, ... ⊢ φ, ψ
  return scCut(leftProof, rightProof, psi, sequent([phi], [phi, psi]));
}

// --- テスト ---

describe("formatSequentText", () => {
  it("\u5358\u4E00\u306E\u8AD6\u7406\u5F0F\u3092\u30D5\u30A9\u30FC\u30DE\u30C3\u30C8\u3059\u308B", () => {
    const seq = sequent([phi], [phi]);
    const text = formatSequentText(seq);
    expect(text).toBe("\u03C6 \u22A2 \u03C6");
  });

  it("\u8907\u6570\u306E\u8AD6\u7406\u5F0F\u3092\u30AB\u30F3\u30DE\u533A\u5207\u308A\u3067\u30D5\u30A9\u30FC\u30DE\u30C3\u30C8\u3059\u308B", () => {
    const seq = sequent([phi, psi], [phi, psi]);
    const text = formatSequentText(seq);
    expect(text).toBe("\u03C6, \u03C8 \u22A2 \u03C6, \u03C8");
  });

  it("\u542B\u610F\u3092\u542B\u3080\u30B7\u30FC\u30B1\u30F3\u30C8\u3092\u30D5\u30A9\u30FC\u30DE\u30C3\u30C8\u3059\u308B", () => {
    const seq = sequent([phiImplPsi], [psi]);
    const text = formatSequentText(seq);
    expect(text).toContain("\u2192");
    expect(text).toContain("\u22A2");
  });

  it("\u7A7A\u306E\u5148\u884C\u5F0F\u5217", () => {
    const seq = sequent([], [phi]);
    const text = formatSequentText(seq);
    expect(text).toBe(" \u22A2 \u03C6");
  });

  it("\u7A7A\u306E\u5F8C\u4EF6\u5F0F\u5217", () => {
    const seq = sequent([phi], []);
    const text = formatSequentText(seq);
    expect(text).toBe("\u03C6 \u22A2 ");
  });
});

describe("computeCutEliminationStepperData", () => {
  describe("\u30AB\u30C3\u30C8\u30D5\u30EA\u30FC\u306A\u8A3C\u660E", () => {
    it("\u30AB\u30C3\u30C8\u304C\u306A\u3044\u5834\u5408\u306F\u30B9\u30C6\u30C3\u30D7\u6570\u304C0", () => {
      const proof = makeIdentityProof();
      const data = computeCutEliminationStepperData(proof);

      expect(data.initialInfo.cutCount).toBe(0);
      expect(data.initialInfo.isCutFree).toBe(true);
      expect(data.totalSteps).toBe(0);
      expect(data.steps).toHaveLength(0);
      expect(data.result._tag).toBe("Success");
    });

    it("\u7D50\u8AD6\u30B7\u30FC\u30B1\u30F3\u30C8\u304C\u6B63\u3057\u304F\u30D5\u30A9\u30FC\u30DE\u30C3\u30C8\u3055\u308C\u308B", () => {
      const proof = makeIdentityProof();
      const data = computeCutEliminationStepperData(proof);
      expect(data.initialInfo.conclusionText).toBe("\u03C6 \u22A2 \u03C6");
    });
  });

  describe("\u30AB\u30C3\u30C8\u3092\u542B\u3080\u8A3C\u660E", () => {
    it("\u30AB\u30C3\u30C8\u6570\u304C\u6B63\u3057\u304F\u8A08\u7B97\u3055\u308C\u308B", () => {
      const proof = makeSimpleCutProof();
      const data = computeCutEliminationStepperData(proof);

      expect(data.initialInfo.cutCount).toBe(1);
      expect(data.initialInfo.isCutFree).toBe(false);
    });

    it("\u30B9\u30C6\u30C3\u30D7\u304C1\u4EE5\u4E0A\u751F\u6210\u3055\u308C\u308B", () => {
      const proof = makeSimpleCutProof();
      const data = computeCutEliminationStepperData(proof);

      expect(data.totalSteps).toBeGreaterThan(0);
      expect(data.steps.length).toBe(data.totalSteps);
    });

    it("\u7D50\u679C\u304CSuccess\u3067\u3042\u308B", () => {
      const proof = makeSimpleCutProof();
      const data = computeCutEliminationStepperData(proof);
      expect(data.result._tag).toBe("Success");
    });

    it("\u5404\u30B9\u30C6\u30C3\u30D7\u306Bdescription/depth/rank\u304C\u3042\u308B", () => {
      const proof = makeSimpleCutProof();
      const data = computeCutEliminationStepperData(proof);

      for (const step of data.steps) {
        expect(step.description).toBeTruthy();
        expect(typeof step.depth).toBe("number");
        expect(typeof step.rank).toBe("number");
        expect(typeof step.cutCount).toBe("number");
        expect(typeof step.conclusionText).toBe("string");
      }
    });

    it("\u30B9\u30C6\u30C3\u30D7\u306Eindex\u304C0\u59CB\u307E\u308A\u3067\u9023\u7D9A", () => {
      const proof = makeSimpleCutProof();
      const data = computeCutEliminationStepperData(proof);

      data.steps.forEach((step, i) => {
        expect(step.index).toBe(i);
      });
    });
  });

  describe("rank 0 \u306E\u30AB\u30C3\u30C8", () => {
    it("rank 0\u306E\u30AB\u30C3\u30C8\u304C\u6B63\u3057\u304F\u9664\u53BB\u3055\u308C\u308B", () => {
      const proof = makeRank0CutProof();
      const data = computeCutEliminationStepperData(proof);

      expect(data.initialInfo.cutCount).toBe(1);
      expect(data.result._tag).toBe("Success");
    });
  });
});

describe("resolveStepperState", () => {
  it("\u521D\u671F\u72B6\u614B\uFF08stepIndex=-1\uFF09\u3067\u306F\u5143\u306E\u8A3C\u660E\u3092\u8FD4\u3059", () => {
    const proof = makeSimpleCutProof();
    const baseData = computeCutEliminationStepperData(proof);
    const { steps } = eliminateCutsWithSteps(proof);

    const state = resolveStepperState(baseData, -1, proof, steps);
    expect(state.currentStepIndex).toBe(-1);
    expect(state.currentCutCount).toBe(baseData.initialInfo.cutCount);
  });

  it("\u30B9\u30C6\u30C3\u30D70\u3067\u306F\u6700\u521D\u306E\u30B9\u30C6\u30C3\u30D7\u306E\u8A3C\u660E\u3092\u8FD4\u3059", () => {
    const proof = makeSimpleCutProof();
    const baseData = computeCutEliminationStepperData(proof);
    const { steps } = eliminateCutsWithSteps(proof);

    if (steps.length > 0) {
      const state = resolveStepperState(baseData, 0, proof, steps);
      expect(state.currentStepIndex).toBe(0);
    }
  });

  it("\u7BC4\u56F2\u5916\u306E\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u306F\u30AF\u30E9\u30F3\u30D7\u3055\u308C\u308B", () => {
    const proof = makeSimpleCutProof();
    const baseData = computeCutEliminationStepperData(proof);
    const { steps } = eliminateCutsWithSteps(proof);

    // 大きすぎるインデックス
    const state1 = resolveStepperState(baseData, 9999, proof, steps);
    expect(state1.currentStepIndex).toBe(baseData.totalSteps - 1);

    // 小さすぎるインデックス
    const state2 = resolveStepperState(baseData, -100, proof, steps);
    expect(state2.currentStepIndex).toBe(-1);
  });

  it("\u30AB\u30C3\u30C8\u30D5\u30EA\u30FC\u8A3C\u660E\u3067\u306Fstep\u304C0\u306A\u306E\u3067-1\u306E\u307F", () => {
    const proof = makeIdentityProof();
    const baseData = computeCutEliminationStepperData(proof);
    const { steps } = eliminateCutsWithSteps(proof);

    const state = resolveStepperState(baseData, -1, proof, steps);
    expect(state.currentStepIndex).toBe(-1);
    expect(state.currentCutCount).toBe(0);
  });
});

describe("applyStepperAction", () => {
  it("next\u3067\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u304C1\u9032\u3080", () => {
    expect(applyStepperAction(-1, 5, { type: "next" })).toBe(0);
    expect(applyStepperAction(0, 5, { type: "next" })).toBe(1);
    expect(applyStepperAction(3, 5, { type: "next" })).toBe(4);
  });

  it("next\u3067\u6700\u5927\u5024\u3092\u8D85\u3048\u306A\u3044", () => {
    expect(applyStepperAction(4, 5, { type: "next" })).toBe(4);
  });

  it("prev\u3067\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u304C1\u623B\u308B", () => {
    expect(applyStepperAction(4, 5, { type: "prev" })).toBe(3);
    expect(applyStepperAction(0, 5, { type: "prev" })).toBe(-1);
  });

  it("prev\u3067-1\u3092\u4E0B\u56DE\u3089\u306A\u3044", () => {
    expect(applyStepperAction(-1, 5, { type: "prev" })).toBe(-1);
  });

  it("first\u3067-1\u306B\u623B\u308B", () => {
    expect(applyStepperAction(3, 5, { type: "first" })).toBe(-1);
  });

  it("last\u3067\u6700\u5F8C\u306E\u30B9\u30C6\u30C3\u30D7\u3078", () => {
    expect(applyStepperAction(-1, 5, { type: "last" })).toBe(4);
  });

  it("goto\u3067\u6307\u5B9A\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u3078", () => {
    expect(applyStepperAction(0, 5, { type: "goto", index: 3 })).toBe(3);
  });

  it("goto\u3067\u7BC4\u56F2\u5916\u306F\u30AF\u30E9\u30F3\u30D7", () => {
    expect(applyStepperAction(0, 5, { type: "goto", index: 10 })).toBe(4);
    expect(applyStepperAction(0, 5, { type: "goto", index: -5 })).toBe(-1);
  });

  it("\u30B9\u30C6\u30C3\u30D7\u6570\u304C0\u306E\u5834\u5408", () => {
    expect(applyStepperAction(-1, 0, { type: "next" })).toBe(-1);
    expect(applyStepperAction(-1, 0, { type: "last" })).toBe(-1);
  });

  describe("exhaustive action types", () => {
    const actions: readonly StepperAction[] = [
      { type: "next" },
      { type: "prev" },
      { type: "first" },
      { type: "last" },
      { type: "goto", index: 0 },
    ];
    for (const action of actions) {
      it(`${action.type satisfies string}\u304C\u6570\u5024\u3092\u8FD4\u3059`, () => {
        expect(typeof applyStepperAction(0, 5, action)).toBe("number");
      });
    }
  });
});

describe("canStepForward", () => {
  it("\u6700\u5F8C\u306E\u30B9\u30C6\u30C3\u30D7\u3067\u306Afalse", () => {
    expect(canStepForward(4, 5)).toBe(false);
  });

  it("\u6700\u5F8C\u3088\u308A\u524D\u306E\u30B9\u30C6\u30C3\u30D7\u3067\u306Atrue", () => {
    expect(canStepForward(-1, 5)).toBe(true);
    expect(canStepForward(0, 5)).toBe(true);
    expect(canStepForward(3, 5)).toBe(true);
  });

  it("\u30B9\u30C6\u30C3\u30D7\u6570\u304C0\u306E\u5834\u5408\u306Ffalse", () => {
    expect(canStepForward(-1, 0)).toBe(false);
  });
});

describe("canStepBackward", () => {
  it("\u521D\u671F\u72B6\u614B(-1)\u3067\u306Ffalse", () => {
    expect(canStepBackward(-1)).toBe(false);
  });

  it("\u30B9\u30C6\u30C3\u30D70\u4EE5\u4E0A\u3067\u306Ftrue", () => {
    expect(canStepBackward(0)).toBe(true);
    expect(canStepBackward(3)).toBe(true);
  });
});
