/**
 * 自然演繹 (Natural Deduction) のテスト。
 *
 * 戸次本 第8章に基づく。
 * NM = 最小論理の自然演繹版。
 *
 * 特徴:
 * - 公理なし、推論規則のみ（導入規則+除去規則のペア）
 * - 仮定の打ち消し(discharge)が核心
 * - DT(→I) + MP(→E) が基本
 */

import { describe, it, expect } from "vitest";
import {
  metaVariable,
  implication,
  conjunction,
  disjunction,
  negation,
} from "./formula";
import {
  assumption,
  implicationIntro,
  implicationElim,
  weakening,
  conjunctionIntro,
  conjunctionElimLeft,
  conjunctionElimRight,
  disjunctionIntroLeft,
  disjunctionIntroRight,
  disjunctionElim,
  efqRule,
  dneRule,
  type NdProofNode,
  getNdConclusion,
  getOpenAssumptions,
  validateNdProof,
  countNdNodes,
  ndProofDepth,
} from "./naturalDeduction";

// テスト用ヘルパー
const phi = metaVariable("φ");
const psi = metaVariable("ψ");
const chi = metaVariable("χ");

describe("naturalDeduction - 基本構造", () => {
  describe("assumption (仮定)", () => {
    it("仮定ノードを作成できる", () => {
      const node = assumption(phi, 1);
      expect(node._tag).toBe("NdAssumption");
      expect(getNdConclusion(node)).toEqual(phi);
    });

    it("仮定ノードの未打ち消し仮定セットにIDが含まれる", () => {
      const node = assumption(phi, 1);
      const open = getOpenAssumptions(node);
      expect(open).toEqual(new Set([1]));
    });
  });

  describe("implicationElim (→除去 = MP)", () => {
    it("φとφ→ψから→除去でψを導出できる", () => {
      const premiseLeft = assumption(phi, 1);
      const premiseRight = assumption(implication(phi, psi), 2);
      const result = implicationElim(premiseLeft, premiseRight);
      expect(result._tag).toBe("NdImplicationElim");
      expect(getNdConclusion(result)).toEqual(psi);
    });

    it("→除去の未打ち消し仮定は両前提の和集合", () => {
      const premiseLeft = assumption(phi, 1);
      const premiseRight = assumption(implication(phi, psi), 2);
      const result = implicationElim(premiseLeft, premiseRight);
      expect(getOpenAssumptions(result)).toEqual(new Set([1, 2]));
    });
  });

  describe("implicationIntro (→導入 = DT)", () => {
    it("仮定φの下でψが証明されたとき、φ→ψを導出して仮定を打ち消す", () => {
      // φ を仮定(id=1)、φ→ψ を仮定(id=2)、→Eでψ
      // →Iでφ→ψ（仮定id=1を打ち消し）
      const assumpPhi = assumption(phi, 1);
      const assumpImpl = assumption(implication(phi, psi), 2);
      const elim = implicationElim(assumpPhi, assumpImpl);
      const intro = implicationIntro(elim, phi, 1);

      expect(getNdConclusion(intro)).toEqual(implication(phi, psi));
      // id=1は打ち消し済み、id=2は残っている
      expect(getOpenAssumptions(intro)).toEqual(new Set([2]));
    });

    it("すべての仮定を打ち消すと空集合になる", () => {
      // φ→ψ の仮定(id=1) の下で、仮定(id=2)のφからψを導出
      // →Iで φ→ψ（id=2を打ち消し）
      // →Iで (φ→ψ)→(φ→ψ)（id=1を打ち消し）
      const assumpPhiImpl = assumption(implication(phi, psi), 1);
      const assumpPhi = assumption(phi, 2);
      const elim = implicationElim(assumpPhi, assumpPhiImpl);
      const intro1 = implicationIntro(elim, phi, 2);
      const intro2 = implicationIntro(intro1, implication(phi, psi), 1);

      expect(getNdConclusion(intro2)).toEqual(
        implication(implication(phi, psi), implication(phi, psi)),
      );
      expect(getOpenAssumptions(intro2)).toEqual(new Set());
    });
  });

  describe("weakening (弱化)", () => {
    it("2つの前提から一方を捨てて他方を結論とする", () => {
      const left = assumption(phi, 1);
      const right = assumption(psi, 2);
      const w = weakening(left, right);
      expect(getNdConclusion(w)).toEqual(phi);
      // 弱化では使わなかった側の仮定も残る（全前提の和集合）
      expect(getOpenAssumptions(w)).toEqual(new Set([1, 2]));
    });
  });
});

describe("naturalDeduction - NMでの証明例 (戸次本 例8.12)", () => {
  it("(K) φ→(ψ→φ) がNMで証明可能", () => {
    // 例8.12: φとψを仮定、(w)でψを捨てる、→Iでψ→φ（ψ打ち消し）、→Iでφ→(ψ→φ)（φ打ち消し）
    const assumpPhi = assumption(phi, 1);
    const assumpPsi = assumption(psi, 2);
    const w = weakening(assumpPhi, assumpPsi);
    const intro1 = implicationIntro(w, psi, 2);
    const intro2 = implicationIntro(intro1, phi, 1);

    expect(getNdConclusion(intro2)).toEqual(
      implication(phi, implication(psi, phi)),
    );
    expect(getOpenAssumptions(intro2)).toEqual(new Set());
  });
});

describe("naturalDeduction - NMでの(S)の証明 (戸次本 8.2)", () => {
  it("(S) (φ→ψ→χ)→((φ→ψ)→(φ→χ)) がNMで証明可能", () => {
    // 前提: φ→ψ→χ(id=1), φ→ψ(id=2), φ(id=3)
    const phiToImplPsiChi = implication(phi, implication(psi, chi));
    const phiToPsi = implication(phi, psi);

    const a1 = assumption(phiToImplPsiChi, 1);
    const a2 = assumption(phiToPsi, 2);
    const a3 = assumption(phi, 3);

    // φ, φ→ψ から →E で ψ
    const step1 = implicationElim(a3, a2);

    // φ, φ→(ψ→χ) から →E で ψ→χ
    const step2 = implicationElim(a3, a1);

    // ψ, ψ→χ から →E で χ
    const step3 = implicationElim(step1, step2);

    // →I でφ→χ（id=3を打ち消し）
    const step4 = implicationIntro(step3, phi, 3);

    // →I で (φ→ψ)→(φ→χ)（id=2を打ち消し）
    const step5 = implicationIntro(step4, phiToPsi, 2);

    // →I で (φ→(ψ→χ))→((φ→ψ)→(φ→χ))（id=1を打ち消し）
    const step6 = implicationIntro(step5, phiToImplPsiChi, 1);

    expect(getNdConclusion(step6)).toEqual(
      implication(
        phiToImplPsiChi,
        implication(phiToPsi, implication(phi, chi)),
      ),
    );
    expect(getOpenAssumptions(step6)).toEqual(new Set());
  });
});

describe("naturalDeduction - ∧規則", () => {
  describe("conjunctionIntro (∧導入)", () => {
    it("φとψからφ∧ψを導出する", () => {
      const left = assumption(phi, 1);
      const right = assumption(psi, 2);
      const result = conjunctionIntro(left, right);
      expect(getNdConclusion(result)).toEqual(conjunction(phi, psi));
      expect(getOpenAssumptions(result)).toEqual(new Set([1, 2]));
    });
  });

  describe("conjunctionElimLeft (∧除去左)", () => {
    it("φ∧ψからφを導出する", () => {
      const a = assumption(conjunction(phi, psi), 1);
      const result = conjunctionElimLeft(a);
      expect(getNdConclusion(result)).toEqual(phi);
      expect(getOpenAssumptions(result)).toEqual(new Set([1]));
    });
  });

  describe("conjunctionElimRight (∧除去右)", () => {
    it("φ∧ψからψを導出する", () => {
      const a = assumption(conjunction(phi, psi), 1);
      const result = conjunctionElimRight(a);
      expect(getNdConclusion(result)).toEqual(psi);
      expect(getOpenAssumptions(result)).toEqual(new Set([1]));
    });
  });
});

describe("naturalDeduction - ∨規則", () => {
  describe("disjunctionIntroLeft (∨導入左)", () => {
    it("φからφ∨ψを導出する", () => {
      const a = assumption(phi, 1);
      const result = disjunctionIntroLeft(a, psi);
      expect(getNdConclusion(result)).toEqual(disjunction(phi, psi));
      expect(getOpenAssumptions(result)).toEqual(new Set([1]));
    });
  });

  describe("disjunctionIntroRight (∨導入右)", () => {
    it("ψからφ∨ψを導出する", () => {
      const a = assumption(psi, 1);
      const result = disjunctionIntroRight(phi, a);
      expect(getNdConclusion(result)).toEqual(disjunction(phi, psi));
      expect(getOpenAssumptions(result)).toEqual(new Set([1]));
    });
  });

  describe("disjunctionElim (∨除去)", () => {
    it("φ∨ψと各ケースからの証明でχを導出する", () => {
      // φ∨ψ(id=1)、φの仮定(id=2)からχ、ψの仮定(id=3)からχ
      const disj = assumption(disjunction(phi, psi), 1);
      // 簡略化: 直接χを仮定して左右ケースとする
      const chiFromLeft = assumption(chi, 4);
      const chiFromRight = assumption(chi, 5);
      const result = disjunctionElim(disj, chiFromLeft, 2, chiFromRight, 3);
      expect(getNdConclusion(result)).toEqual(chi);
      // id=2,3は打ち消し済み、id=1,4,5は残る
      expect(getOpenAssumptions(result)).toEqual(new Set([1, 4, 5]));
    });
  });
});

describe("naturalDeduction - NJ/NK拡張", () => {
  describe("efqRule (EFQ = 爆発律)", () => {
    it("前提から任意のφを導出する（NJの追加規則）", () => {
      // EFQは ⊥ からどんな式でも導出可能
      // ここでは前提をそのまま受け取り、任意の結論を導出
      const a = assumption(phi, 1);
      const result = efqRule(a, psi);
      expect(getNdConclusion(result)).toEqual(psi);
      expect(getOpenAssumptions(result)).toEqual(new Set([1]));
    });
  });

  describe("dneRule (DNE = 二重否定除去)", () => {
    it("¬¬φからφを導出する（NKの追加規則）", () => {
      const a = assumption(negation(negation(phi)), 1);
      const result = dneRule(a);
      expect(getNdConclusion(result)).toEqual(phi);
      expect(getOpenAssumptions(result)).toEqual(new Set([1]));
    });
  });
});

describe("naturalDeduction - ユーティリティ", () => {
  describe("countNdNodes", () => {
    it("仮定ノードは1", () => {
      expect(countNdNodes(assumption(phi, 1))).toBe(1);
    });

    it("→除去は子2つ+自身で3", () => {
      const a1 = assumption(phi, 1);
      const a2 = assumption(implication(phi, psi), 2);
      expect(countNdNodes(implicationElim(a1, a2))).toBe(3);
    });

    it("弱化は子2つ+自身で3", () => {
      const a1 = assumption(phi, 1);
      const a2 = assumption(psi, 2);
      expect(countNdNodes(weakening(a1, a2))).toBe(3);
    });

    it("∧導入は子2つ+自身で3", () => {
      const a1 = assumption(phi, 1);
      const a2 = assumption(psi, 2);
      expect(countNdNodes(conjunctionIntro(a1, a2))).toBe(3);
    });

    it("→導入は子1つ+自身で2", () => {
      const a = assumption(phi, 1);
      expect(countNdNodes(implicationIntro(a, phi, 1))).toBe(2);
    });

    it("∧除去は子1つ+自身で2", () => {
      const a = assumption(conjunction(phi, psi), 1);
      expect(countNdNodes(conjunctionElimLeft(a))).toBe(2);
      expect(countNdNodes(conjunctionElimRight(a))).toBe(2);
    });

    it("∨導入は子1つ+自身で2", () => {
      const a = assumption(phi, 1);
      expect(countNdNodes(disjunctionIntroLeft(a, psi))).toBe(2);
      expect(countNdNodes(disjunctionIntroRight(phi, a))).toBe(2);
    });

    it("∨除去は子3つ+自身で4", () => {
      const disj = assumption(disjunction(phi, psi), 1);
      const left = assumption(chi, 2);
      const right = assumption(chi, 3);
      expect(countNdNodes(disjunctionElim(disj, left, 10, right, 11))).toBe(4);
    });

    it("EFQは子1つ+自身で2", () => {
      const a = assumption(phi, 1);
      expect(countNdNodes(efqRule(a, psi))).toBe(2);
    });

    it("DNEは子1つ+自身で2", () => {
      const a = assumption(negation(negation(phi)), 1);
      expect(countNdNodes(dneRule(a))).toBe(2);
    });
  });

  describe("ndProofDepth", () => {
    it("仮定ノードの深さは0", () => {
      expect(ndProofDepth(assumption(phi, 1))).toBe(0);
    });

    it("→導入の深さは子の深さ+1", () => {
      const a = assumption(phi, 1);
      const intro = implicationIntro(a, phi, 1);
      expect(ndProofDepth(intro)).toBe(1);
    });

    it("弱化の深さは最大の子+1", () => {
      const a1 = assumption(phi, 1);
      const a2 = assumption(psi, 2);
      expect(ndProofDepth(weakening(a1, a2))).toBe(1);
    });

    it("→除去の深さは最大の子+1", () => {
      const a1 = assumption(phi, 1);
      const a2 = assumption(implication(phi, psi), 2);
      expect(ndProofDepth(implicationElim(a1, a2))).toBe(1);
    });

    it("∧導入の深さは最大の子+1", () => {
      const a1 = assumption(phi, 1);
      const a2 = assumption(psi, 2);
      expect(ndProofDepth(conjunctionIntro(a1, a2))).toBe(1);
    });

    it("∧除去の深さは子+1", () => {
      const a = assumption(conjunction(phi, psi), 1);
      expect(ndProofDepth(conjunctionElimLeft(a))).toBe(1);
      expect(ndProofDepth(conjunctionElimRight(a))).toBe(1);
    });

    it("∨導入の深さは子+1", () => {
      const a = assumption(phi, 1);
      expect(ndProofDepth(disjunctionIntroLeft(a, psi))).toBe(1);
      expect(ndProofDepth(disjunctionIntroRight(phi, a))).toBe(1);
    });

    it("∨除去の深さは最大の子+1", () => {
      const disj = assumption(disjunction(phi, psi), 1);
      const left = assumption(chi, 2);
      const right = assumption(chi, 3);
      const intro = implicationIntro(right, psi, 3);
      // right side: depth 1, others: depth 0
      expect(ndProofDepth(disjunctionElim(disj, left, 10, intro, 11))).toBe(2);
    });

    it("EFQの深さは子の深さ+1", () => {
      const a = assumption(phi, 1);
      expect(ndProofDepth(efqRule(a, psi))).toBe(1);
    });

    it("DNEの深さは子の深さ+1", () => {
      const a = assumption(negation(negation(phi)), 1);
      expect(ndProofDepth(dneRule(a))).toBe(1);
    });
  });
});

describe("naturalDeduction - バリデーション", () => {
  describe("validateNdProof", () => {
    it("正しい(K)の証明がValid", () => {
      const assumpPhi = assumption(phi, 1);
      const assumpPsi = assumption(psi, 2);
      const w = weakening(assumpPhi, assumpPsi);
      const intro1 = implicationIntro(w, psi, 2);
      const intro2 = implicationIntro(intro1, phi, 1);

      const result = validateNdProof(intro2);
      expect(result._tag).toBe("Valid");
    });

    it("→除去の形式が不正な場合はInvalid", () => {
      // φとψ（φ→ψではない）で→除去を適用 → 検証エラー
      const a1 = assumption(phi, 1);
      const a2 = assumption(psi, 2);
      // 不正なノードを直接構築
      const badNode: NdProofNode = {
        _tag: "NdImplicationElim",
        formula: chi, // 適当な結論
        left: a1,
        right: a2, // psiはImplicationではない
      };
      const result = validateNdProof(badNode);
      expect(result._tag).toBe("Invalid");
    });

    it("→導入で打ち消す仮定IDが存在しない場合もValidとする（vacuous discharge）", () => {
      // 戸次本 解説8.16: 仮定を一つも打ち消さなくてもよい（vacuous discharge）
      const a = assumption(phi, 1);
      const intro = implicationIntro(a, psi, 999); // 存在しないID
      // vacuous discharge: ψ→φ（ψは使われていないが導入可能）
      const result = validateNdProof(intro);
      expect(result._tag).toBe("Valid");
    });

    it("∧除去左で前提が∧でない場合はInvalid", () => {
      const a = assumption(phi, 1);
      const badNode: NdProofNode = {
        _tag: "NdConjunctionElimLeft",
        formula: phi,
        premise: a,
      };
      const result = validateNdProof(badNode);
      expect(result._tag).toBe("Invalid");
    });

    it("∧除去右で前提が∧でない場合はInvalid", () => {
      const a = assumption(phi, 1);
      const badNode: NdProofNode = {
        _tag: "NdConjunctionElimRight",
        formula: phi,
        premise: a,
      };
      const result = validateNdProof(badNode);
      expect(result._tag).toBe("Invalid");
    });

    it("∧除去左で結論が一致しない場合はInvalid", () => {
      const a = assumption(conjunction(phi, psi), 1);
      const badNode: NdProofNode = {
        _tag: "NdConjunctionElimLeft",
        formula: chi, // φではなくχ
        premise: a,
      };
      const result = validateNdProof(badNode);
      expect(result._tag).toBe("Invalid");
    });

    it("∧除去右で結論が一致しない場合はInvalid", () => {
      const a = assumption(conjunction(phi, psi), 1);
      const badNode: NdProofNode = {
        _tag: "NdConjunctionElimRight",
        formula: chi, // ψではなくχ
        premise: a,
      };
      const result = validateNdProof(badNode);
      expect(result._tag).toBe("Invalid");
    });

    it("→除去で前件が一致しない場合はInvalid", () => {
      const a1 = assumption(psi, 1); // ψ（φではない）
      const a2 = assumption(implication(phi, chi), 2); // φ→χ
      const badNode: NdProofNode = {
        _tag: "NdImplicationElim",
        formula: chi,
        left: a1, // ψ ≠ φ
        right: a2,
      };
      const result = validateNdProof(badNode);
      expect(result._tag).toBe("Invalid");
    });

    it("→除去で結論が一致しない場合はInvalid", () => {
      const a1 = assumption(phi, 1);
      const a2 = assumption(implication(phi, psi), 2);
      const badNode: NdProofNode = {
        _tag: "NdImplicationElim",
        formula: chi, // ψではなくχ
        left: a1,
        right: a2,
      };
      const result = validateNdProof(badNode);
      expect(result._tag).toBe("Invalid");
    });

    it("→導入で結論が一致しない場合はInvalid", () => {
      const a = assumption(phi, 1);
      const badNode: NdProofNode = {
        _tag: "NdImplicationIntro",
        formula: chi, // psi→φ ではなくχ
        premise: a,
        dischargedFormula: psi,
        dischargedId: 999,
      };
      const result = validateNdProof(badNode);
      expect(result._tag).toBe("Invalid");
    });

    it("弱化で結論が一致しない場合はInvalid", () => {
      const a1 = assumption(phi, 1);
      const a2 = assumption(psi, 2);
      const badNode: NdProofNode = {
        _tag: "NdWeakening",
        formula: chi, // φではなくχ
        kept: a1,
        discarded: a2,
      };
      const result = validateNdProof(badNode);
      expect(result._tag).toBe("Invalid");
    });

    it("∧導入で結論が一致しない場合はInvalid", () => {
      const a1 = assumption(phi, 1);
      const a2 = assumption(psi, 2);
      const badNode: NdProofNode = {
        _tag: "NdConjunctionIntro",
        formula: chi, // φ∧ψではなくχ
        left: a1,
        right: a2,
      };
      const result = validateNdProof(badNode);
      expect(result._tag).toBe("Invalid");
    });

    it("∨導入左で結論が一致しない場合はInvalid", () => {
      const a = assumption(phi, 1);
      const badNode: NdProofNode = {
        _tag: "NdDisjunctionIntroLeft",
        formula: chi, // φ∨ψではなくχ
        premise: a,
        addedRight: psi,
      };
      const result = validateNdProof(badNode);
      expect(result._tag).toBe("Invalid");
    });

    it("∨導入右で結論が一致しない場合はInvalid", () => {
      const a = assumption(psi, 1);
      const badNode: NdProofNode = {
        _tag: "NdDisjunctionIntroRight",
        formula: chi, // φ∨ψではなくχ
        premise: a,
        addedLeft: phi,
      };
      const result = validateNdProof(badNode);
      expect(result._tag).toBe("Invalid");
    });

    it("∨除去で前提が∨でない場合はInvalid", () => {
      const a = assumption(phi, 1);
      const left = assumption(chi, 2);
      const right = assumption(chi, 3);
      const badNode: NdProofNode = {
        _tag: "NdDisjunctionElim",
        formula: chi,
        disjunction: a, // φは∨ではない
        leftCase: left,
        leftDischargedId: 10,
        rightCase: right,
        rightDischargedId: 11,
      };
      const result = validateNdProof(badNode);
      expect(result._tag).toBe("Invalid");
    });

    it("∨除去で左右ケースの結論が一致しない場合はInvalid", () => {
      const disj = assumption(disjunction(phi, psi), 1);
      const left = assumption(chi, 2);
      const right = assumption(phi, 3); // χではなくφ
      const badNode: NdProofNode = {
        _tag: "NdDisjunctionElim",
        formula: chi,
        disjunction: disj,
        leftCase: left,
        leftDischargedId: 10,
        rightCase: right,
        rightDischargedId: 11,
      };
      const result = validateNdProof(badNode);
      expect(result._tag).toBe("Invalid");
    });

    it("DNEで前提が二重否定でない場合はInvalid", () => {
      const a = assumption(phi, 1); // ¬¬φではない
      const badNode: NdProofNode = {
        _tag: "NdDne",
        formula: phi,
        premise: a,
      };
      const result = validateNdProof(badNode);
      expect(result._tag).toBe("Invalid");
    });

    it("DNEで結論が一致しない場合はInvalid", () => {
      const a = assumption(negation(negation(phi)), 1);
      const badNode: NdProofNode = {
        _tag: "NdDne",
        formula: psi, // φではなくψ
        premise: a,
      };
      const result = validateNdProof(badNode);
      expect(result._tag).toBe("Invalid");
    });

    it("正しい(S)の証明がValid", () => {
      const phiToImplPsiChi = implication(phi, implication(psi, chi));
      const phiToPsi = implication(phi, psi);
      const a1 = assumption(phiToImplPsiChi, 1);
      const a2 = assumption(phiToPsi, 2);
      const a3 = assumption(phi, 3);
      const step1 = implicationElim(a3, a2);
      const step2 = implicationElim(a3, a1);
      const step3 = implicationElim(step1, step2);
      const step4 = implicationIntro(step3, phi, 3);
      const step5 = implicationIntro(step4, phiToPsi, 2);
      const step6 = implicationIntro(step5, phiToImplPsiChi, 1);
      expect(validateNdProof(step6)._tag).toBe("Valid");
    });

    it("正しいEFQノードがValid", () => {
      const a = assumption(phi, 1);
      const efq = efqRule(a, psi);
      expect(validateNdProof(efq)._tag).toBe("Valid");
    });

    it("正しい∧導入+∧除去左がValid", () => {
      const a1 = assumption(phi, 1);
      const a2 = assumption(psi, 2);
      const conj = conjunctionIntro(a1, a2);
      const elimL = conjunctionElimLeft(conj);
      expect(validateNdProof(elimL)._tag).toBe("Valid");
      expect(getNdConclusion(elimL)).toEqual(phi);
    });

    it("正しい∧導入+∧除去右がValid", () => {
      const a1 = assumption(phi, 1);
      const a2 = assumption(psi, 2);
      const conj = conjunctionIntro(a1, a2);
      const elimR = conjunctionElimRight(conj);
      expect(validateNdProof(elimR)._tag).toBe("Valid");
      expect(getNdConclusion(elimR)).toEqual(psi);
    });

    it("正しい∨導入右がValid", () => {
      const a = assumption(psi, 1);
      const introR = disjunctionIntroRight(phi, a);
      expect(validateNdProof(introR)._tag).toBe("Valid");
      expect(getNdConclusion(introR)).toEqual(disjunction(phi, psi));
    });

    it("正しいDNEがValid", () => {
      const a = assumption(negation(negation(phi)), 1);
      const dne = dneRule(a);
      expect(validateNdProof(dne)._tag).toBe("Valid");
      expect(getNdConclusion(dne)).toEqual(phi);
    });

    it("正しい∨導入+∨除去がValid", () => {
      // φ∨ψ を φ から導入し、両ケースでχを導出
      const aPhi = assumption(phi, 1);
      const disjNode = disjunctionIntroLeft(aPhi, psi);
      const chiFromPhi = assumption(chi, 2);
      const chiFromPsi = assumption(chi, 3);
      const elim = disjunctionElim(disjNode, chiFromPhi, 10, chiFromPsi, 11);
      expect(validateNdProof(elim)._tag).toBe("Valid");
    });
  });
});

describe("naturalDeduction - 仮定の複数使用", () => {
  it("同じ仮定IDを複数箇所で使える（前提の再利用）", () => {
    // 戸次本 8.2: 前提を複数回使える
    // φ(id=1) を2箇所で使う
    const a1 = assumption(phi, 1);
    const a2 = assumption(phi, 1); // 同じID=1
    const a3 = assumption(implication(phi, psi), 2);
    const elim = implicationElim(a1, a3);
    // 弱化でa2とelimを組み合わせる
    const w = weakening(elim, a2);
    expect(getOpenAssumptions(w)).toEqual(new Set([1, 2]));
  });

  it("→導入で同じIDの仮定がすべて打ち消される", () => {
    // φ(id=1)を2箇所で使い、→Iで打ち消す
    const a1 = assumption(phi, 1);
    const a2 = assumption(phi, 1);
    const a3 = assumption(implication(phi, implication(phi, psi)), 2);
    // φ, φ→(φ→ψ) →E → φ→ψ
    const step1 = implicationElim(a1, a3);
    // φ, φ→ψ →E → ψ
    const step2 = implicationElim(a2, step1);
    // →I(id=1): φ→ψ
    const intro = implicationIntro(step2, phi, 1);
    // id=1は打ち消し済み（両方の使用箇所から）
    expect(getOpenAssumptions(intro)).toEqual(new Set([2]));
  });
});
