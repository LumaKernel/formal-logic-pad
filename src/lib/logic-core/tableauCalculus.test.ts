import { describe, it, expect } from "vitest";
import {
  tabSequent,
  tabBasicSequent,
  tabBottom,
  tabExchange,
  tabDoubleNegation,
  tabConjunction,
  tabNegConjunction,
  tabDisjunction,
  tabNegDisjunction,
  tabImplication,
  tabNegImplication,
  tabUniversal,
  tabNegUniversal,
  tabExistential,
  tabNegExistential,
  getTabConclusion,
  countTabNodes,
  tabProofDepth,
  validateTabProof,
  allTabRuleIds,
  getTabRuleDisplayName,
  tabNodeToRuleId,
  isTabBranchingRule,
  hasTabEigenVariableCondition,
} from "./tableauCalculus";
import type { TabRuleId } from "./tableauCalculus";
import {
  metaVariable,
  negation,
  conjunction,
  disjunction,
  implication,
  universal,
  existential,
  predicate,
} from "./formula";
import { termVariable } from "./term";

// ── テスト用ヘルパー ──────────────────────────────────────

const phi = metaVariable("φ");
const psi = metaVariable("ψ");
const negPhi = negation(phi);
const negPsi = negation(psi);
const phiAndPsi = conjunction(phi, psi);
const phiOrPsi = disjunction(phi, psi);
const phiImplPsi = implication(phi, psi);
const negPhiAndPsi = negation(phiAndPsi);
const negPhiOrPsi = negation(phiOrPsi);
const negPhiImplPsi = negation(phiImplPsi);
const doubleNegPhi = negation(negPhi);

const xVar = termVariable("x");
const Px = predicate("P", [xVar]);
const forallXPx = universal(xVar, Px);
const existsXPx = existential(xVar, Px);
const negForallXPx = negation(forallXPx);
const negExistsXPx = negation(existsXPx);

// ── tabSequent ──────────────────────────────────────────

describe("tabSequent", () => {
  it("右辺が空のシーケントを作成する", () => {
    const seq = tabSequent([phi, psi]);
    expect(seq.antecedents).toEqual([phi, psi]);
    expect(seq.succedents).toEqual([]);
  });

  it("空の左辺でもシーケントを作成できる", () => {
    const seq = tabSequent([]);
    expect(seq.antecedents).toEqual([]);
    expect(seq.succedents).toEqual([]);
  });
});

// ── ファクトリ関数 ──────────────────────────────────────────

describe("ファクトリ関数", () => {
  describe("tabBasicSequent (BS)", () => {
    it("基本式を作成する", () => {
      const seq = tabSequent([negPhi, phi]);
      const node = tabBasicSequent(seq);
      expect(node._tag).toBe("TabBasicSequent");
      expect(node.conclusion).toBe(seq);
    });
  });

  describe("tabBottom (⊥)", () => {
    it("⊥公理を作成する", () => {
      const bottom = predicate("⊥", []);
      const seq = tabSequent([bottom, phi]);
      const node = tabBottom(seq);
      expect(node._tag).toBe("TabBottom");
      expect(node.conclusion).toBe(seq);
    });
  });

  describe("tabExchange (e)", () => {
    it("交換規則を作成する", () => {
      const conclusion = tabSequent([phi, psi]);
      const premiseSeq = tabSequent([psi, phi]);
      const premiseNode = tabBasicSequent(premiseSeq);
      const node = tabExchange(premiseNode, 0, conclusion);
      expect(node._tag).toBe("TabExchange");
      expect(node.position).toBe(0);
    });
  });

  describe("tabDoubleNegation (¬¬)", () => {
    it("二重否定規則を作成する", () => {
      const conclusion = tabSequent([doubleNegPhi]);
      const premiseSeq = tabSequent([phi, doubleNegPhi]);
      const premiseNode = tabBasicSequent(premiseSeq);
      const node = tabDoubleNegation(premiseNode, conclusion);
      expect(node._tag).toBe("TabDoubleNegation");
    });
  });

  describe("tabConjunction (∧)", () => {
    it("連言規則を作成する", () => {
      const conclusion = tabSequent([phiAndPsi]);
      const premiseSeq = tabSequent([phi, psi, phiAndPsi]);
      const premiseNode = tabBasicSequent(premiseSeq);
      const node = tabConjunction(premiseNode, conclusion);
      expect(node._tag).toBe("TabConjunction");
    });
  });

  describe("tabNegConjunction (¬∧)", () => {
    it("否定連言規則（分岐あり）を作成する", () => {
      const conclusion = tabSequent([negPhiAndPsi]);
      const leftSeq = tabSequent([negPhi, negPhiAndPsi]);
      const rightSeq = tabSequent([negPsi, negPhiAndPsi]);
      const leftNode = tabBasicSequent(leftSeq);
      const rightNode = tabBasicSequent(rightSeq);
      const node = tabNegConjunction(leftNode, rightNode, conclusion);
      expect(node._tag).toBe("TabNegConjunction");
      expect(node.left).toBe(leftNode);
      expect(node.right).toBe(rightNode);
    });
  });

  describe("tabDisjunction (∨)", () => {
    it("選言規則（分岐あり）を作成する", () => {
      const conclusion = tabSequent([phiOrPsi]);
      const leftSeq = tabSequent([phi, phiOrPsi]);
      const rightSeq = tabSequent([psi, phiOrPsi]);
      const leftNode = tabBasicSequent(leftSeq);
      const rightNode = tabBasicSequent(rightSeq);
      const node = tabDisjunction(leftNode, rightNode, conclusion);
      expect(node._tag).toBe("TabDisjunction");
    });
  });

  describe("tabNegDisjunction (¬∨)", () => {
    it("否定選言規則を作成する", () => {
      const conclusion = tabSequent([negPhiOrPsi]);
      const premiseSeq = tabSequent([negPhi, negPsi, negPhiOrPsi]);
      const premiseNode = tabBasicSequent(premiseSeq);
      const node = tabNegDisjunction(premiseNode, conclusion);
      expect(node._tag).toBe("TabNegDisjunction");
    });
  });

  describe("tabImplication (→)", () => {
    it("含意規則（分岐あり）を作成する", () => {
      const conclusion = tabSequent([phiImplPsi]);
      const leftSeq = tabSequent([negPhi, phiImplPsi]);
      const rightSeq = tabSequent([psi, phiImplPsi]);
      const leftNode = tabBasicSequent(leftSeq);
      const rightNode = tabBasicSequent(rightSeq);
      const node = tabImplication(leftNode, rightNode, conclusion);
      expect(node._tag).toBe("TabImplication");
    });
  });

  describe("tabNegImplication (¬→)", () => {
    it("否定含意規則を作成する", () => {
      const conclusion = tabSequent([negPhiImplPsi]);
      const premiseSeq = tabSequent([phi, negPsi, negPhiImplPsi]);
      const premiseNode = tabBasicSequent(premiseSeq);
      const node = tabNegImplication(premiseNode, conclusion);
      expect(node._tag).toBe("TabNegImplication");
    });
  });

  describe("tabUniversal (∀)", () => {
    it("全称規則を作成する", () => {
      const conclusion = tabSequent([forallXPx]);
      const premiseSeq = tabSequent([Px, forallXPx]);
      const premiseNode = tabBasicSequent(premiseSeq);
      const node = tabUniversal(premiseNode, xVar, conclusion);
      expect(node._tag).toBe("TabUniversal");
      expect(node.substitutedTerm).toBe(xVar);
    });
  });

  describe("tabNegUniversal (¬∀)", () => {
    it("否定全称規則を作成する", () => {
      const conclusion = tabSequent([negForallXPx]);
      const negPx = negation(Px);
      const premiseSeq = tabSequent([negPx, negForallXPx]);
      const premiseNode = tabBasicSequent(premiseSeq);
      const node = tabNegUniversal(premiseNode, "x", conclusion);
      expect(node._tag).toBe("TabNegUniversal");
      expect(node.eigenVariable).toBe("x");
    });
  });

  describe("tabExistential (∃)", () => {
    it("存在規則を作成する", () => {
      const conclusion = tabSequent([existsXPx]);
      const premiseSeq = tabSequent([Px, existsXPx]);
      const premiseNode = tabBasicSequent(premiseSeq);
      const node = tabExistential(premiseNode, "x", conclusion);
      expect(node._tag).toBe("TabExistential");
      expect(node.eigenVariable).toBe("x");
    });
  });

  describe("tabNegExistential (¬∃)", () => {
    it("否定存在規則を作成する", () => {
      const conclusion = tabSequent([negExistsXPx]);
      const negPx = negation(Px);
      const premiseSeq = tabSequent([negPx, negExistsXPx]);
      const premiseNode = tabBasicSequent(premiseSeq);
      const node = tabNegExistential(premiseNode, xVar, conclusion);
      expect(node._tag).toBe("TabNegExistential");
      expect(node.substitutedTerm).toBe(xVar);
    });
  });
});

// ── getTabConclusion ──────────────────────────────────────

describe("getTabConclusion", () => {
  it("ノードの結論を取得する", () => {
    const seq = tabSequent([phi]);
    const node = tabBasicSequent(seq);
    expect(getTabConclusion(node)).toBe(seq);
  });
});

// ── countTabNodes ──────────────────────────────────────────

describe("countTabNodes", () => {
  it("公理ノードは1", () => {
    const node = tabBasicSequent(tabSequent([negPhi, phi]));
    expect(countTabNodes(node)).toBe(1);
  });

  it("⊥ノードは1", () => {
    const bottom = predicate("⊥", []);
    const node = tabBottom(tabSequent([bottom]));
    expect(countTabNodes(node)).toBe(1);
  });

  it("1前提規則は前提+1", () => {
    const leaf = tabBasicSequent(tabSequent([phi, doubleNegPhi]));
    const node = tabDoubleNegation(leaf, tabSequent([doubleNegPhi]));
    expect(countTabNodes(node)).toBe(2);
  });

  it("2前提規則は左+右+1", () => {
    const leftLeaf = tabBasicSequent(tabSequent([negPhi, negPhiAndPsi]));
    const rightLeaf = tabBasicSequent(tabSequent([negPsi, negPhiAndPsi]));
    const node = tabNegConjunction(
      leftLeaf,
      rightLeaf,
      tabSequent([negPhiAndPsi]),
    );
    expect(countTabNodes(node)).toBe(3);
  });

  it("交換規則は前提+1", () => {
    const leaf = tabBasicSequent(tabSequent([psi, phi]));
    const node = tabExchange(leaf, 0, tabSequent([phi, psi]));
    expect(countTabNodes(node)).toBe(2);
  });

  it("含意規則は左+右+1", () => {
    const leftLeaf = tabBasicSequent(tabSequent([negPhi, phiImplPsi]));
    const rightLeaf = tabBasicSequent(tabSequent([psi, phiImplPsi]));
    const node = tabImplication(leftLeaf, rightLeaf, tabSequent([phiImplPsi]));
    expect(countTabNodes(node)).toBe(3);
  });

  it("選言規則は左+右+1", () => {
    const leftLeaf = tabBasicSequent(tabSequent([phi, phiOrPsi]));
    const rightLeaf = tabBasicSequent(tabSequent([psi, phiOrPsi]));
    const node = tabDisjunction(leftLeaf, rightLeaf, tabSequent([phiOrPsi]));
    expect(countTabNodes(node)).toBe(3);
  });

  it("否定選言規則は前提+1", () => {
    const leaf = tabBasicSequent(tabSequent([negPhi, negPsi, negPhiOrPsi]));
    const node = tabNegDisjunction(leaf, tabSequent([negPhiOrPsi]));
    expect(countTabNodes(node)).toBe(2);
  });

  it("否定含意規則は前提+1", () => {
    const leaf = tabBasicSequent(tabSequent([phi, negPsi, negPhiImplPsi]));
    const node = tabNegImplication(leaf, tabSequent([negPhiImplPsi]));
    expect(countTabNodes(node)).toBe(2);
  });

  it("連言規則は前提+1", () => {
    const leaf = tabBasicSequent(tabSequent([phi, psi, phiAndPsi]));
    const node = tabConjunction(leaf, tabSequent([phiAndPsi]));
    expect(countTabNodes(node)).toBe(2);
  });

  it("全称規則は前提+1", () => {
    const leaf = tabBasicSequent(tabSequent([Px, forallXPx]));
    const node = tabUniversal(leaf, xVar, tabSequent([forallXPx]));
    expect(countTabNodes(node)).toBe(2);
  });

  it("否定全称規則は前提+1", () => {
    const negPx = negation(Px);
    const leaf = tabBasicSequent(tabSequent([negPx, negForallXPx]));
    const node = tabNegUniversal(leaf, "x", tabSequent([negForallXPx]));
    expect(countTabNodes(node)).toBe(2);
  });

  it("存在規則は前提+1", () => {
    const leaf = tabBasicSequent(tabSequent([Px, existsXPx]));
    const node = tabExistential(leaf, "x", tabSequent([existsXPx]));
    expect(countTabNodes(node)).toBe(2);
  });

  it("否定存在規則は前提+1", () => {
    const negPx = negation(Px);
    const leaf = tabBasicSequent(tabSequent([negPx, negExistsXPx]));
    const node = tabNegExistential(leaf, xVar, tabSequent([negExistsXPx]));
    expect(countTabNodes(node)).toBe(2);
  });

  it("深い証明木のノード数を正しくカウントする", () => {
    const leaf1 = tabBasicSequent(tabSequent([phi, doubleNegPhi]));
    const mid = tabDoubleNegation(leaf1, tabSequent([doubleNegPhi]));
    const leaf2 = tabBasicSequent(tabSequent([negPsi, negPhiAndPsi]));
    const root = tabNegConjunction(mid, leaf2, tabSequent([negPhiAndPsi]));
    expect(countTabNodes(root)).toBe(4);
  });
});

// ── tabProofDepth ──────────────────────────────────────────

describe("tabProofDepth", () => {
  it("公理ノードの深さは0", () => {
    const node = tabBasicSequent(tabSequent([negPhi, phi]));
    expect(tabProofDepth(node)).toBe(0);
  });

  it("⊥ノードの深さは0", () => {
    const bottom = predicate("⊥", []);
    const node = tabBottom(tabSequent([bottom]));
    expect(tabProofDepth(node)).toBe(0);
  });

  it("1前提規則の深さは前提の深さ+1", () => {
    const leaf = tabBasicSequent(tabSequent([phi, doubleNegPhi]));
    const node = tabDoubleNegation(leaf, tabSequent([doubleNegPhi]));
    expect(tabProofDepth(node)).toBe(1);
  });

  it("2前提規則の深さは左右の最大深さ+1", () => {
    const leftLeaf = tabBasicSequent(tabSequent([negPhi, negPhiAndPsi]));
    const rightChild = tabDoubleNegation(
      tabBasicSequent(tabSequent([psi, negation(negPsi)])),
      tabSequent([negation(negPsi)]),
    );
    const node = tabNegConjunction(
      leftLeaf,
      rightChild,
      tabSequent([negPhiAndPsi]),
    );
    expect(tabProofDepth(node)).toBe(2); // max(0, 1) + 1 = 2
  });

  it("交換規則の深さは前提+1", () => {
    const leaf = tabBasicSequent(tabSequent([psi, phi]));
    const node = tabExchange(leaf, 0, tabSequent([phi, psi]));
    expect(tabProofDepth(node)).toBe(1);
  });

  it("含意規則の深さは左右の最大深さ+1", () => {
    const leftLeaf = tabBasicSequent(tabSequent([negPhi, phiImplPsi]));
    const rightLeaf = tabBasicSequent(tabSequent([psi, phiImplPsi]));
    const node = tabImplication(leftLeaf, rightLeaf, tabSequent([phiImplPsi]));
    expect(tabProofDepth(node)).toBe(1);
  });

  it("選言規則の深さは左右の最大深さ+1", () => {
    const leftLeaf = tabBasicSequent(tabSequent([phi, phiOrPsi]));
    const rightLeaf = tabBasicSequent(tabSequent([psi, phiOrPsi]));
    const node = tabDisjunction(leftLeaf, rightLeaf, tabSequent([phiOrPsi]));
    expect(tabProofDepth(node)).toBe(1);
  });

  it("量化子規則の深さは前提+1", () => {
    const leaf = tabBasicSequent(tabSequent([Px, forallXPx]));
    const node = tabUniversal(leaf, xVar, tabSequent([forallXPx]));
    expect(tabProofDepth(node)).toBe(1);
  });
});

// ── validateTabProof ──────────────────────────────────────

describe("validateTabProof", () => {
  it("正当なBSはValidを返す", () => {
    const node = tabBasicSequent(tabSequent([negPhi, phi]));
    expect(validateTabProof(node)._tag).toBe("Valid");
  });

  it("正当な⊥はValidを返す", () => {
    const bottom = predicate("⊥", []);
    const node = tabBottom(tabSequent([bottom]));
    expect(validateTabProof(node)._tag).toBe("Valid");
  });

  it("右辺が空でない場合はエラー", () => {
    const node = tabBasicSequent({
      antecedents: [negPhi, phi],
      succedents: [psi],
    });
    const result = validateTabProof(node);
    expect(result._tag).toBe("Invalid");
    if (result._tag === "Invalid") {
      expect(result.errors[0]._tag).toBe("SuccedentsNotEmpty");
    }
  });

  it("BSの左辺が2未満の場合はエラー", () => {
    const node = tabBasicSequent(tabSequent([phi]));
    const result = validateTabProof(node);
    expect(result._tag).toBe("Invalid");
    if (result._tag === "Invalid") {
      expect(result.errors[0]._tag).toBe("BasicSequentInvalid");
    }
  });

  it("⊥の左辺が空の場合はエラー", () => {
    const node = tabBottom(tabSequent([]));
    const result = validateTabProof(node);
    expect(result._tag).toBe("Invalid");
    if (result._tag === "Invalid") {
      expect(result.errors[0]._tag).toBe("BottomInvalid");
    }
  });

  it("交換位置が範囲外の場合はエラー", () => {
    const leaf = tabBasicSequent(tabSequent([phi, psi]));
    const node = tabExchange(leaf, 5, tabSequent([phi, psi]));
    const result = validateTabProof(node);
    expect(result._tag).toBe("Invalid");
    if (result._tag === "Invalid") {
      expect(
        result.errors.some((e) => e._tag === "ExchangePositionOutOfRange"),
      ).toBe(true);
    }
  });

  it("負の交換位置の場合はエラー", () => {
    const leaf = tabBasicSequent(tabSequent([phi, psi]));
    const node = tabExchange(leaf, -1, tabSequent([phi, psi]));
    const result = validateTabProof(node);
    expect(result._tag).toBe("Invalid");
    if (result._tag === "Invalid") {
      expect(
        result.errors.some((e) => e._tag === "ExchangePositionOutOfRange"),
      ).toBe(true);
    }
  });

  it("正当な交換規則はValid", () => {
    const leaf = tabBasicSequent(tabSequent([psi, phi]));
    const node = tabExchange(leaf, 0, tabSequent([phi, psi]));
    expect(validateTabProof(node)._tag).toBe("Valid");
  });

  it("1前提の論理規則は再帰的にバリデーションする", () => {
    // 前提が正当
    const leaf = tabBasicSequent(tabSequent([phi, doubleNegPhi]));
    const node = tabDoubleNegation(leaf, tabSequent([doubleNegPhi]));
    expect(validateTabProof(node)._tag).toBe("Valid");
  });

  it("2前提の論理規則は両方の前提を再帰的にバリデーションする", () => {
    const leftLeaf = tabBasicSequent(tabSequent([negPhi, negPhiAndPsi]));
    const rightLeaf = tabBasicSequent(tabSequent([negPsi, negPhiAndPsi]));
    const node = tabNegConjunction(
      leftLeaf,
      rightLeaf,
      tabSequent([negPhiAndPsi]),
    );
    expect(validateTabProof(node)._tag).toBe("Valid");
  });

  it("ネストされた不正な前提を検出する", () => {
    // 前提に右辺が空でないノードが含まれる
    const invalidLeaf = tabBasicSequent({
      antecedents: [negPhi],
      succedents: [phi],
    });
    const node = tabDoubleNegation(invalidLeaf, tabSequent([doubleNegPhi]));
    const result = validateTabProof(node);
    expect(result._tag).toBe("Invalid");
    if (result._tag === "Invalid") {
      expect(result.errors.some((e) => e._tag === "SuccedentsNotEmpty")).toBe(
        true,
      );
    }
  });

  it("量化子規則のバリデーションが通る", () => {
    const leaf = tabBasicSequent(tabSequent([Px, forallXPx]));
    const node = tabUniversal(leaf, xVar, tabSequent([forallXPx]));
    expect(validateTabProof(node)._tag).toBe("Valid");
  });

  it("含意規則のバリデーションが通る", () => {
    const leftLeaf = tabBasicSequent(tabSequent([negPhi, phiImplPsi]));
    const rightLeaf = tabBasicSequent(tabSequent([psi, phiImplPsi]));
    const node = tabImplication(leftLeaf, rightLeaf, tabSequent([phiImplPsi]));
    expect(validateTabProof(node)._tag).toBe("Valid");
  });

  it("選言規則のバリデーションが通る", () => {
    const leftLeaf = tabBasicSequent(tabSequent([phi, phiOrPsi]));
    const rightLeaf = tabBasicSequent(tabSequent([psi, phiOrPsi]));
    const node = tabDisjunction(leftLeaf, rightLeaf, tabSequent([phiOrPsi]));
    expect(validateTabProof(node)._tag).toBe("Valid");
  });

  it("否定選言規則のバリデーションが通る", () => {
    const leaf = tabBasicSequent(tabSequent([negPhi, negPsi, negPhiOrPsi]));
    const node = tabNegDisjunction(leaf, tabSequent([negPhiOrPsi]));
    expect(validateTabProof(node)._tag).toBe("Valid");
  });

  it("否定含意規則のバリデーションが通る", () => {
    const leaf = tabBasicSequent(tabSequent([phi, negPsi, negPhiImplPsi]));
    const node = tabNegImplication(leaf, tabSequent([negPhiImplPsi]));
    expect(validateTabProof(node)._tag).toBe("Valid");
  });

  it("連言規則のバリデーションが通る", () => {
    const leaf = tabBasicSequent(tabSequent([phi, psi, phiAndPsi]));
    const node = tabConjunction(leaf, tabSequent([phiAndPsi]));
    expect(validateTabProof(node)._tag).toBe("Valid");
  });

  it("否定全称規則のバリデーションが通る", () => {
    const negPx = negation(Px);
    const leaf = tabBasicSequent(tabSequent([negPx, negForallXPx]));
    const node = tabNegUniversal(leaf, "x", tabSequent([negForallXPx]));
    expect(validateTabProof(node)._tag).toBe("Valid");
  });

  it("存在規則のバリデーションが通る", () => {
    const leaf = tabBasicSequent(tabSequent([Px, existsXPx]));
    const node = tabExistential(leaf, "x", tabSequent([existsXPx]));
    expect(validateTabProof(node)._tag).toBe("Valid");
  });

  it("否定存在規則のバリデーションが通る", () => {
    const negPx = negation(Px);
    const leaf = tabBasicSequent(tabSequent([negPx, negExistsXPx]));
    const node = tabNegExistential(leaf, xVar, tabSequent([negExistsXPx]));
    expect(validateTabProof(node)._tag).toBe("Valid");
  });
});

// ── 規則分類ヘルパー ──────────────────────────────────────

describe("allTabRuleIds", () => {
  it("全14規則がリストに含まれる", () => {
    expect(allTabRuleIds).toHaveLength(14);
  });

  it("重複がない", () => {
    const uniqueIds = new Set(allTabRuleIds);
    expect(uniqueIds.size).toBe(allTabRuleIds.length);
  });
});

describe("getTabRuleDisplayName", () => {
  it.each<[TabRuleId, string]>([
    ["bs", "BS"],
    ["bottom", "⊥"],
    ["exchange", "e"],
    ["double-negation", "¬¬"],
    ["conjunction", "∧"],
    ["neg-conjunction", "¬∧"],
    ["disjunction", "∨"],
    ["neg-disjunction", "¬∨"],
    ["implication", "→"],
    ["neg-implication", "¬→"],
    ["universal", "∀"],
    ["neg-universal", "¬∀"],
    ["existential", "∃"],
    ["neg-existential", "¬∃"],
  ])("規則 %s の表示名は %s", (ruleId, expected) => {
    expect(getTabRuleDisplayName(ruleId)).toBe(expected);
  });
});

describe("tabNodeToRuleId", () => {
  it("各ノードタイプから正しいruleIdを取得する", () => {
    const bs = tabBasicSequent(tabSequent([negPhi, phi]));
    expect(tabNodeToRuleId(bs)).toBe("bs");

    const bottom = tabBottom(tabSequent([predicate("⊥", [])]));
    expect(tabNodeToRuleId(bottom)).toBe("bottom");

    const leaf = tabBasicSequent(tabSequent([phi, psi]));
    const exchange = tabExchange(leaf, 0, tabSequent([psi, phi]));
    expect(tabNodeToRuleId(exchange)).toBe("exchange");

    const dn = tabDoubleNegation(
      tabBasicSequent(tabSequent([phi, doubleNegPhi])),
      tabSequent([doubleNegPhi]),
    );
    expect(tabNodeToRuleId(dn)).toBe("double-negation");

    const conj = tabConjunction(
      tabBasicSequent(tabSequent([phi, psi, phiAndPsi])),
      tabSequent([phiAndPsi]),
    );
    expect(tabNodeToRuleId(conj)).toBe("conjunction");

    const negConj = tabNegConjunction(
      tabBasicSequent(tabSequent([negPhi, negPhiAndPsi])),
      tabBasicSequent(tabSequent([negPsi, negPhiAndPsi])),
      tabSequent([negPhiAndPsi]),
    );
    expect(tabNodeToRuleId(negConj)).toBe("neg-conjunction");

    const disj = tabDisjunction(
      tabBasicSequent(tabSequent([phi, phiOrPsi])),
      tabBasicSequent(tabSequent([psi, phiOrPsi])),
      tabSequent([phiOrPsi]),
    );
    expect(tabNodeToRuleId(disj)).toBe("disjunction");

    const negDisj = tabNegDisjunction(
      tabBasicSequent(tabSequent([negPhi, negPsi, negPhiOrPsi])),
      tabSequent([negPhiOrPsi]),
    );
    expect(tabNodeToRuleId(negDisj)).toBe("neg-disjunction");

    const impl = tabImplication(
      tabBasicSequent(tabSequent([negPhi, phiImplPsi])),
      tabBasicSequent(tabSequent([psi, phiImplPsi])),
      tabSequent([phiImplPsi]),
    );
    expect(tabNodeToRuleId(impl)).toBe("implication");

    const negImpl = tabNegImplication(
      tabBasicSequent(tabSequent([phi, negPsi, negPhiImplPsi])),
      tabSequent([negPhiImplPsi]),
    );
    expect(tabNodeToRuleId(negImpl)).toBe("neg-implication");

    const univ = tabUniversal(
      tabBasicSequent(tabSequent([Px, forallXPx])),
      xVar,
      tabSequent([forallXPx]),
    );
    expect(tabNodeToRuleId(univ)).toBe("universal");

    const negUniv = tabNegUniversal(
      tabBasicSequent(tabSequent([negation(Px), negForallXPx])),
      "x",
      tabSequent([negForallXPx]),
    );
    expect(tabNodeToRuleId(negUniv)).toBe("neg-universal");

    const exist = tabExistential(
      tabBasicSequent(tabSequent([Px, existsXPx])),
      "x",
      tabSequent([existsXPx]),
    );
    expect(tabNodeToRuleId(exist)).toBe("existential");

    const negExist = tabNegExistential(
      tabBasicSequent(tabSequent([negation(Px), negExistsXPx])),
      xVar,
      tabSequent([negExistsXPx]),
    );
    expect(tabNodeToRuleId(negExist)).toBe("neg-existential");
  });
});

describe("isTabBranchingRule", () => {
  it("分岐規則は neg-conjunction, disjunction, implication", () => {
    expect(isTabBranchingRule("neg-conjunction")).toBe(true);
    expect(isTabBranchingRule("disjunction")).toBe(true);
    expect(isTabBranchingRule("implication")).toBe(true);
  });

  it("非分岐規則はfalse", () => {
    const nonBranching: readonly TabRuleId[] = [
      "bs",
      "bottom",
      "exchange",
      "double-negation",
      "conjunction",
      "neg-disjunction",
      "neg-implication",
      "universal",
      "neg-universal",
      "existential",
      "neg-existential",
    ];
    for (const ruleId of nonBranching) {
      expect(isTabBranchingRule(ruleId)).toBe(false);
    }
  });
});

describe("hasTabEigenVariableCondition", () => {
  it("固有変数条件がある規則は neg-universal, existential", () => {
    expect(hasTabEigenVariableCondition("neg-universal")).toBe(true);
    expect(hasTabEigenVariableCondition("existential")).toBe(true);
  });

  it("固有変数条件がない規則はfalse", () => {
    const noEigen: readonly TabRuleId[] = [
      "bs",
      "bottom",
      "exchange",
      "double-negation",
      "conjunction",
      "neg-conjunction",
      "disjunction",
      "neg-disjunction",
      "implication",
      "neg-implication",
      "universal",
      "neg-existential",
    ];
    for (const ruleId of noEigen) {
      expect(hasTabEigenVariableCondition(ruleId)).toBe(false);
    }
  });
});

// ── 実用的な証明例 ──────────────────────────────────────────

describe("実用的な証明例", () => {
  it("P ∨ ¬P のタブロー証明（排中律の枝閉じ）", () => {
    // ¬(P ∨ ¬P), Γ ⇒ を根とするタブロー
    // ¬∨ 規則で ¬P, ¬¬P, ¬(P ∨ ¬P) ⇒ に展開
    // BS で閉じる（¬P と ¬¬P は φ と ¬φ の形ではないが、
    // ¬P と ¬(¬P) の形として認識すれば閉じる）
    const P = metaVariable("φ");
    const notP = negation(P);
    const PorNotP = disjunction(P, notP);
    const negPorNotP = negation(PorNotP);

    // ¬P, ¬(¬P), ¬(P ∨ ¬P) ⇒ — BS で閉じる
    const leaf = tabBasicSequent(
      tabSequent([notP, negation(notP), negPorNotP]),
    );

    // ¬∨ 規則: ¬P, ¬(¬P), ¬(P ∨ ¬P) ⇒ から ¬(P ∨ ¬P) ⇒
    const root = tabNegDisjunction(leaf, tabSequent([negPorNotP]));

    expect(countTabNodes(root)).toBe(2);
    expect(tabProofDepth(root)).toBe(1);
    expect(validateTabProof(root)._tag).toBe("Valid");
  });

  it("φ → ψ, φ のタブロー（含意規則の分岐で片方が閉じる）", () => {
    // φ → ψ, φ, ¬ψ ⇒ を反駁するタブロー
    // → 規則で分岐:
    //   左枝: ¬φ, φ→ψ, φ, ¬ψ ⇒ — BS (¬φ, φ)
    //   右枝: ψ, φ→ψ, φ, ¬ψ ⇒ — BS (ψ, ¬ψ)
    const leftLeaf = tabBasicSequent(
      tabSequent([negPhi, phiImplPsi, phi, negPsi]),
    );
    const rightLeaf = tabBasicSequent(
      tabSequent([psi, phiImplPsi, phi, negPsi]),
    );
    const root = tabImplication(
      leftLeaf,
      rightLeaf,
      tabSequent([phiImplPsi, phi, negPsi]),
    );

    expect(countTabNodes(root)).toBe(3);
    expect(tabProofDepth(root)).toBe(1);
    expect(validateTabProof(root)._tag).toBe("Valid");
  });
});
