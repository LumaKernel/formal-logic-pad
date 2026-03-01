/**
 * 分析的タブロー (Analytic Tableau) モジュールのテスト。
 *
 * テスト計画:
 * 1. 署名付き論理式のファクトリ関数
 * 2. 規則IDの分類ヘルパー（α/β/γ/δ/closure）
 * 3. 規則表示名
 * 4. α規則の適用（7パターン）
 * 5. β規則の適用（3パターン）
 * 6. γ規則の適用（2パターン）
 * 7. δ規則の適用（2パターン）
 * 8. 規則の自動分類（classifySignedFormula）
 * 9. 枝の閉じ判定（checkBranchClosure）
 * 10. 固有変数条件のチェック（checkEigenVariableCondition）
 * 11. canApplyRule
 * 12. 実践的な証明例
 */

import { describe, it, expect } from "vitest";
import {
  type SignedFormula,
  signedFormula,
  allAtRuleIds,
  isAlphaRule,
  isBetaRule,
  isGammaRule,
  isDeltaRule,
  isClosureRule,
  getAtRuleDisplayName,
  applyAlphaRule,
  applyBetaRule,
  applyGammaRule,
  applyDeltaRule,
  classifySignedFormula,
  checkBranchClosure,
  checkEigenVariableCondition,
  canApplyRule,
} from "./analyticTableau";
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

// ── テストヘルパー ───────────────────────────────────────────

const phi = metaVariable("φ");
const psi = metaVariable("ψ");
const negPhi = negation(phi);
const negNegPhi = negation(negPhi);
const phiAndPsi = conjunction(phi, psi);
const phiOrPsi = disjunction(phi, psi);
const phiImplPsi = implication(phi, psi);
const x = termVariable("x");
const y = termVariable("y");
const forallXPhi = universal(x, predicate("P", [x]));
const existsXPhi = existential(x, predicate("P", [x]));

// ── 1. 署名付き論理式 ──────────────────────────────────────────

describe("signedFormula", () => {
  it("T(φ) を作成する", () => {
    const sf = signedFormula("T", phi);
    expect(sf.sign).toBe("T");
    expect(sf.formula).toBe(phi);
  });

  it("F(φ) を作成する", () => {
    const sf = signedFormula("F", phi);
    expect(sf.sign).toBe("F");
    expect(sf.formula).toBe(phi);
  });
});

// ── 2. 規則IDの分類 ─────────────────────────────────────────

describe("規則分類ヘルパー", () => {
  it("allAtRuleIds に全15規則が含まれる", () => {
    expect(allAtRuleIds).toHaveLength(15);
  });

  it("α規則を正しく判定する", () => {
    const alphaRules = allAtRuleIds.filter(isAlphaRule);
    expect(alphaRules).toEqual([
      "alpha-conj",
      "alpha-neg-disj",
      "alpha-neg-impl",
      "alpha-double-neg-t",
      "alpha-double-neg-f",
      "alpha-neg-t",
      "alpha-neg-f",
    ]);
  });

  it("β規則を正しく判定する", () => {
    const betaRules = allAtRuleIds.filter(isBetaRule);
    expect(betaRules).toEqual(["beta-neg-conj", "beta-disj", "beta-impl"]);
  });

  it("γ規則を正しく判定する", () => {
    const gammaRules = allAtRuleIds.filter(isGammaRule);
    expect(gammaRules).toEqual(["gamma-univ", "gamma-neg-exist"]);
  });

  it("δ規則を正しく判定する", () => {
    const deltaRules = allAtRuleIds.filter(isDeltaRule);
    expect(deltaRules).toEqual(["delta-neg-univ", "delta-exist"]);
  });

  it("closure規則を正しく判定する", () => {
    const closureRules = allAtRuleIds.filter(isClosureRule);
    expect(closureRules).toEqual(["closure"]);
  });

  it("各規則は1つの分類にのみ属する", () => {
    for (const ruleId of allAtRuleIds) {
      const classifications = [
        isAlphaRule(ruleId),
        isBetaRule(ruleId),
        isGammaRule(ruleId),
        isDeltaRule(ruleId),
        isClosureRule(ruleId),
      ].filter(Boolean);
      expect(classifications).toHaveLength(1);
    }
  });
});

// ── 3. 規則表示名 ──────────────────────────────────────────

describe("getAtRuleDisplayName", () => {
  it.each([
    ["alpha-conj", "T(∧)"],
    ["alpha-neg-disj", "F(∨)"],
    ["alpha-neg-impl", "F(→)"],
    ["alpha-double-neg-t", "T(¬¬)"],
    ["alpha-double-neg-f", "F(¬¬)"],
    ["alpha-neg-t", "T(¬)"],
    ["alpha-neg-f", "F(¬)"],
    ["beta-neg-conj", "F(∧)"],
    ["beta-disj", "T(∨)"],
    ["beta-impl", "T(→)"],
    ["gamma-univ", "T(∀)"],
    ["gamma-neg-exist", "F(∃)"],
    ["delta-neg-univ", "F(∀)"],
    ["delta-exist", "T(∃)"],
    ["closure", "×"],
  ] as const)("規則 %s の表示名は %s", (ruleId, expected) => {
    expect(getAtRuleDisplayName(ruleId)).toBe(expected);
  });
});

// ── 4. α規則の適用 ─────────────────────────────────────────

describe("applyAlphaRule", () => {
  it("T(φ∧ψ) → T(φ), T(ψ)", () => {
    const sf = signedFormula("T", phiAndPsi);
    const result = applyAlphaRule(sf);
    expect(result).toBeDefined();
    expect(result!._tag).toBe("alpha");
    expect(result!.ruleId).toBe("alpha-conj");
    const results = result!.results;
    expect(results).toHaveLength(2);
    expect(results[0].sign).toBe("T");
    expect(results[0].formula).toBe(phi);
    const r1 = results[1];
    expect(r1).toBeDefined();
    expect(r1!.sign).toBe("T");
    expect(r1!.formula).toBe(psi);
  });

  it("F(φ∨ψ) → F(φ), F(ψ)", () => {
    const sf = signedFormula("F", phiOrPsi);
    const result = applyAlphaRule(sf);
    expect(result).toBeDefined();
    expect(result!.ruleId).toBe("alpha-neg-disj");
    const results = result!.results;
    expect(results).toHaveLength(2);
    expect(results[0].sign).toBe("F");
    expect(results[0].formula).toBe(phi);
    const r1 = results[1];
    expect(r1).toBeDefined();
    expect(r1!.sign).toBe("F");
    expect(r1!.formula).toBe(psi);
  });

  it("F(φ→ψ) → T(φ), F(ψ)", () => {
    const sf = signedFormula("F", phiImplPsi);
    const result = applyAlphaRule(sf);
    expect(result).toBeDefined();
    expect(result!.ruleId).toBe("alpha-neg-impl");
    const results = result!.results;
    expect(results).toHaveLength(2);
    expect(results[0].sign).toBe("T");
    expect(results[0].formula).toBe(phi);
    const r1 = results[1];
    expect(r1).toBeDefined();
    expect(r1!.sign).toBe("F");
    expect(r1!.formula).toBe(psi);
  });

  it("T(¬¬φ) → T(φ)", () => {
    const sf = signedFormula("T", negNegPhi);
    const result = applyAlphaRule(sf);
    expect(result).toBeDefined();
    expect(result!.ruleId).toBe("alpha-double-neg-t");
    expect(result!.results).toHaveLength(1);
    expect(result!.results[0].sign).toBe("T");
    expect(result!.results[0].formula).toBe(phi);
  });

  it("F(¬¬φ) → F(φ)", () => {
    const sf = signedFormula("F", negNegPhi);
    const result = applyAlphaRule(sf);
    expect(result).toBeDefined();
    expect(result!.ruleId).toBe("alpha-double-neg-f");
    expect(result!.results).toHaveLength(1);
    expect(result!.results[0].sign).toBe("F");
    expect(result!.results[0].formula).toBe(phi);
  });

  it("T(¬φ) → F(φ)（φが否定でない場合）", () => {
    const sf = signedFormula("T", negPhi);
    const result = applyAlphaRule(sf);
    expect(result).toBeDefined();
    expect(result!.ruleId).toBe("alpha-neg-t");
    expect(result!.results).toHaveLength(1);
    expect(result!.results[0].sign).toBe("F");
    expect(result!.results[0].formula).toBe(phi);
  });

  it("F(¬φ) → T(φ)（φが否定でない場合）", () => {
    const sf = signedFormula("F", negPhi);
    const result = applyAlphaRule(sf);
    expect(result).toBeDefined();
    expect(result!.ruleId).toBe("alpha-neg-f");
    expect(result!.results).toHaveLength(1);
    expect(result!.results[0].sign).toBe("T");
    expect(result!.results[0].formula).toBe(phi);
  });

  it("T(¬¬φ) は二重否定規則が優先される（¬規則ではなく）", () => {
    const sf = signedFormula("T", negNegPhi);
    const result = applyAlphaRule(sf);
    expect(result!.ruleId).toBe("alpha-double-neg-t");
  });

  it("適用不可能な場合 undefined を返す（T(φ∨ψ) はβ規則）", () => {
    const sf = signedFormula("T", phiOrPsi);
    expect(applyAlphaRule(sf)).toBeUndefined();
  });

  it("適用不可能な場合 undefined を返す（メタ変数単体）", () => {
    const sf = signedFormula("T", phi);
    expect(applyAlphaRule(sf)).toBeUndefined();
  });
});

// ── 5. β規則の適用 ─────────────────────────────────────────

describe("applyBetaRule", () => {
  it("F(φ∧ψ) → [F(φ) | F(ψ)]", () => {
    const sf = signedFormula("F", phiAndPsi);
    const result = applyBetaRule(sf);
    expect(result).toBeDefined();
    expect(result!._tag).toBe("beta");
    expect(result!.ruleId).toBe("beta-neg-conj");
    expect(result!.left.sign).toBe("F");
    expect(result!.left.formula).toBe(phi);
    expect(result!.right.sign).toBe("F");
    expect(result!.right.formula).toBe(psi);
  });

  it("T(φ∨ψ) → [T(φ) | T(ψ)]", () => {
    const sf = signedFormula("T", phiOrPsi);
    const result = applyBetaRule(sf);
    expect(result).toBeDefined();
    expect(result!.ruleId).toBe("beta-disj");
    expect(result!.left.sign).toBe("T");
    expect(result!.left.formula).toBe(phi);
    expect(result!.right.sign).toBe("T");
    expect(result!.right.formula).toBe(psi);
  });

  it("T(φ→ψ) → [F(φ) | T(ψ)]", () => {
    const sf = signedFormula("T", phiImplPsi);
    const result = applyBetaRule(sf);
    expect(result).toBeDefined();
    expect(result!.ruleId).toBe("beta-impl");
    expect(result!.left.sign).toBe("F");
    expect(result!.left.formula).toBe(phi);
    expect(result!.right.sign).toBe("T");
    expect(result!.right.formula).toBe(psi);
  });

  it("適用不可能な場合 undefined を返す（T(φ∧ψ) はα規則）", () => {
    const sf = signedFormula("T", phiAndPsi);
    expect(applyBetaRule(sf)).toBeUndefined();
  });

  it("適用不可能な場合 undefined を返す（F(φ→ψ) はα規則）", () => {
    const sf = signedFormula("F", phiImplPsi);
    expect(applyBetaRule(sf)).toBeUndefined();
  });
});

// ── 6. γ規則の適用 ─────────────────────────────────────────

describe("applyGammaRule", () => {
  it("T(∀x.P(x)) → T(P(y)) （項yで代入）", () => {
    const sf = signedFormula("T", forallXPhi);
    const result = applyGammaRule(sf, y);
    expect(result).toBeDefined();
    expect(result!._tag).toBe("gamma");
    expect(result!.ruleId).toBe("gamma-univ");
    expect(result!.result.sign).toBe("T");
    // P(y) — x が y に代入される
    expect(result!.result.formula._tag).toBe("Predicate");
    expect(result!.substitutedTerm).toBe(y);
  });

  it("F(∃x.P(x)) → F(P(y)) （項yで代入）", () => {
    const sf = signedFormula("F", existsXPhi);
    const result = applyGammaRule(sf, y);
    expect(result).toBeDefined();
    expect(result!.ruleId).toBe("gamma-neg-exist");
    expect(result!.result.sign).toBe("F");
    expect(result!.result.formula._tag).toBe("Predicate");
    expect(result!.substitutedTerm).toBe(y);
  });

  it("適用不可能な場合 undefined を返す（F(∀x.P(x)) はδ規則）", () => {
    const sf = signedFormula("F", forallXPhi);
    expect(applyGammaRule(sf, y)).toBeUndefined();
  });

  it("適用不可能な場合 undefined を返す（T(∃x.P(x)) はδ規則）", () => {
    const sf = signedFormula("T", existsXPhi);
    expect(applyGammaRule(sf, y)).toBeUndefined();
  });

  it("適用不可能な場合 undefined を返す（命題論理式）", () => {
    const sf = signedFormula("T", phi);
    expect(applyGammaRule(sf, y)).toBeUndefined();
  });
});

// ── 7. δ規則の適用 ─────────────────────────────────────────

describe("applyDeltaRule", () => {
  it("F(∀x.P(x)) → F(P(ζ)) （固有変数ζで代入）", () => {
    const sf = signedFormula("F", forallXPhi);
    const result = applyDeltaRule(sf, "a");
    expect(result).toBeDefined();
    expect(result!._tag).toBe("delta");
    expect(result!.ruleId).toBe("delta-neg-univ");
    expect(result!.result.sign).toBe("F");
    expect(result!.result.formula._tag).toBe("Predicate");
    expect(result!.eigenVariable).toBe("a");
  });

  it("T(∃x.P(x)) → T(P(ζ)) （固有変数ζで代入）", () => {
    const sf = signedFormula("T", existsXPhi);
    const result = applyDeltaRule(sf, "b");
    expect(result).toBeDefined();
    expect(result!.ruleId).toBe("delta-exist");
    expect(result!.result.sign).toBe("T");
    expect(result!.result.formula._tag).toBe("Predicate");
    expect(result!.eigenVariable).toBe("b");
  });

  it("適用不可能な場合 undefined を返す（T(∀x.P(x)) はγ規則）", () => {
    const sf = signedFormula("T", forallXPhi);
    expect(applyDeltaRule(sf, "a")).toBeUndefined();
  });

  it("適用不可能な場合 undefined を返す（F(∃x.P(x)) はγ規則）", () => {
    const sf = signedFormula("F", existsXPhi);
    expect(applyDeltaRule(sf, "a")).toBeUndefined();
  });

  it("代入結果の論理式が正しい構造を持つ", () => {
    const sf = signedFormula("F", forallXPhi);
    const result = applyDeltaRule(sf, "z");
    expect(result).toBeDefined();
    const resultFormula = result!.result.formula;
    // P(z) になっているはず
    if (resultFormula._tag === "Predicate") {
      expect(resultFormula.args).toHaveLength(1);
      expect(resultFormula.args[0]._tag).toBe("TermVariable");
      if (resultFormula.args[0]._tag === "TermVariable") {
        expect(resultFormula.args[0].name).toBe("z");
      }
    }
  });
});

// ── 8. classifySignedFormula ──────────────────────────────────

describe("classifySignedFormula", () => {
  it("T(φ∧ψ) → alpha-conj", () => {
    expect(classifySignedFormula(signedFormula("T", phiAndPsi))).toBe(
      "alpha-conj",
    );
  });

  it("F(φ∨ψ) → alpha-neg-disj", () => {
    expect(classifySignedFormula(signedFormula("F", phiOrPsi))).toBe(
      "alpha-neg-disj",
    );
  });

  it("F(φ→ψ) → alpha-neg-impl", () => {
    expect(classifySignedFormula(signedFormula("F", phiImplPsi))).toBe(
      "alpha-neg-impl",
    );
  });

  it("T(¬¬φ) → alpha-double-neg-t", () => {
    expect(classifySignedFormula(signedFormula("T", negNegPhi))).toBe(
      "alpha-double-neg-t",
    );
  });

  it("F(¬¬φ) → alpha-double-neg-f", () => {
    expect(classifySignedFormula(signedFormula("F", negNegPhi))).toBe(
      "alpha-double-neg-f",
    );
  });

  it("T(¬φ) → alpha-neg-t", () => {
    expect(classifySignedFormula(signedFormula("T", negPhi))).toBe(
      "alpha-neg-t",
    );
  });

  it("F(¬φ) → alpha-neg-f", () => {
    expect(classifySignedFormula(signedFormula("F", negPhi))).toBe(
      "alpha-neg-f",
    );
  });

  it("F(φ∧ψ) → beta-neg-conj", () => {
    expect(classifySignedFormula(signedFormula("F", phiAndPsi))).toBe(
      "beta-neg-conj",
    );
  });

  it("T(φ∨ψ) → beta-disj", () => {
    expect(classifySignedFormula(signedFormula("T", phiOrPsi))).toBe(
      "beta-disj",
    );
  });

  it("T(φ→ψ) → beta-impl", () => {
    expect(classifySignedFormula(signedFormula("T", phiImplPsi))).toBe(
      "beta-impl",
    );
  });

  it("T(∀x.P(x)) → gamma-univ", () => {
    expect(classifySignedFormula(signedFormula("T", forallXPhi))).toBe(
      "gamma-univ",
    );
  });

  it("F(∃x.P(x)) → gamma-neg-exist", () => {
    expect(classifySignedFormula(signedFormula("F", existsXPhi))).toBe(
      "gamma-neg-exist",
    );
  });

  it("F(∀x.P(x)) → delta-neg-univ", () => {
    expect(classifySignedFormula(signedFormula("F", forallXPhi))).toBe(
      "delta-neg-univ",
    );
  });

  it("T(∃x.P(x)) → delta-exist", () => {
    expect(classifySignedFormula(signedFormula("T", existsXPhi))).toBe(
      "delta-exist",
    );
  });

  it("メタ変数単体は undefined", () => {
    expect(classifySignedFormula(signedFormula("T", phi))).toBeUndefined();
  });

  it("述語単体は undefined", () => {
    const p = predicate("P", []);
    expect(classifySignedFormula(signedFormula("T", p))).toBeUndefined();
  });
});

// ── 9. checkBranchClosure ──────────────────────────────────

describe("checkBranchClosure", () => {
  it("T(φ) と F(φ) が存在する枝は閉じる", () => {
    const branch: readonly SignedFormula[] = [
      signedFormula("T", phi),
      signedFormula("F", phi),
    ];
    const result = checkBranchClosure(branch);
    expect(result).toBeDefined();
    expect(result!.ruleId).toBe("closure");
    expect(result!.indices).toEqual([0, 1]);
  });

  it("F(φ) が先に出現する場合も閉じる", () => {
    const branch: readonly SignedFormula[] = [
      signedFormula("F", phi),
      signedFormula("T", phi),
    ];
    const result = checkBranchClosure(branch);
    expect(result).toBeDefined();
    expect(result!.ruleId).toBe("closure");
    expect(result!.indices).toEqual([0, 1]);
  });

  it("複数の論理式を含む枝で矛盾を検出する", () => {
    const branch: readonly SignedFormula[] = [
      signedFormula("T", phi),
      signedFormula("T", psi),
      signedFormula("F", psi),
    ];
    const result = checkBranchClosure(branch);
    expect(result).toBeDefined();
    expect(result!.indices).toEqual([1, 2]);
  });

  it("矛盾がない枝は閉じない", () => {
    const branch: readonly SignedFormula[] = [
      signedFormula("T", phi),
      signedFormula("T", psi),
    ];
    expect(checkBranchClosure(branch)).toBeUndefined();
  });

  it("同じ符号の重複は矛盾ではない", () => {
    const branch: readonly SignedFormula[] = [
      signedFormula("T", phi),
      signedFormula("T", phi),
    ];
    expect(checkBranchClosure(branch)).toBeUndefined();
  });

  it("異なる論理式の T/F は矛盾ではない", () => {
    const branch: readonly SignedFormula[] = [
      signedFormula("T", phi),
      signedFormula("F", psi),
    ];
    expect(checkBranchClosure(branch)).toBeUndefined();
  });

  it("空の枝は閉じない", () => {
    expect(checkBranchClosure([])).toBeUndefined();
  });

  it("複合論理式の矛盾を検出する", () => {
    const branch: readonly SignedFormula[] = [
      signedFormula("T", phiAndPsi),
      signedFormula("F", phiAndPsi),
    ];
    const result = checkBranchClosure(branch);
    expect(result).toBeDefined();
    expect(result!.ruleId).toBe("closure");
  });
});

// ── 10. checkEigenVariableCondition ──────────────────────────

describe("checkEigenVariableCondition", () => {
  it("枝上に出現しない変数は条件を満たす", () => {
    const branch: readonly SignedFormula[] = [
      signedFormula("T", predicate("P", [x])),
    ];
    expect(checkEigenVariableCondition("y", branch)).toBe(true);
  });

  it("枝上に自由出現する変数は条件を満たさない", () => {
    const branch: readonly SignedFormula[] = [
      signedFormula("T", predicate("P", [x])),
    ];
    expect(checkEigenVariableCondition("x", branch)).toBe(false);
  });

  it("空の枝では常に条件を満たす", () => {
    expect(checkEigenVariableCondition("x", [])).toBe(true);
  });

  it("束縛変数は自由変数ではないので条件を満たす", () => {
    // ∀x.P(x) の中の x は束縛されている
    const branch: readonly SignedFormula[] = [signedFormula("T", forallXPhi)];
    expect(checkEigenVariableCondition("x", branch)).toBe(true);
  });

  it("複数の論理式の中で1つでも自由出現すれば条件を満たさない", () => {
    const branch: readonly SignedFormula[] = [
      signedFormula("T", predicate("P", [y])),
      signedFormula("F", predicate("Q", [x])),
    ];
    expect(checkEigenVariableCondition("x", branch)).toBe(false);
    expect(checkEigenVariableCondition("y", branch)).toBe(false);
    expect(checkEigenVariableCondition("z", branch)).toBe(true);
  });
});

// ── 11. canApplyRule ──────────────────────────────────────────

describe("canApplyRule", () => {
  it("T(φ∧ψ) に alpha-conj は適用可能", () => {
    expect(canApplyRule("alpha-conj", signedFormula("T", phiAndPsi))).toBe(
      true,
    );
  });

  it("F(φ∧ψ) に alpha-conj は適用不可能", () => {
    expect(canApplyRule("alpha-conj", signedFormula("F", phiAndPsi))).toBe(
      false,
    );
  });

  it("T(φ∨ψ) に beta-disj は適用可能", () => {
    expect(canApplyRule("beta-disj", signedFormula("T", phiOrPsi))).toBe(true);
  });

  it("T(∀x.P(x)) に gamma-univ は適用可能", () => {
    expect(canApplyRule("gamma-univ", signedFormula("T", forallXPhi))).toBe(
      true,
    );
  });

  it("F(∀x.P(x)) に delta-neg-univ は適用可能", () => {
    expect(canApplyRule("delta-neg-univ", signedFormula("F", forallXPhi))).toBe(
      true,
    );
  });

  it("closure は常に false を返す", () => {
    expect(canApplyRule("closure", signedFormula("T", phi))).toBe(false);
  });
});

// ── 12. 実践的な証明例 ─────────────────────────────────────────

describe("実践的な証明例", () => {
  /**
   * ヘルパー: α規則の2個結果を取得する。
   * テスト内でのみ使用し、結果が2個であることを前提とする。
   */
  const getAlpha2Results = (sf: SignedFormula) => {
    const result = applyAlphaRule(sf);
    expect(result).toBeDefined();
    const r = result!.results;
    expect(r).toHaveLength(2);
    return [r[0], r[1]!] as const;
  };

  /**
   * ヘルパー: α規則の1個結果を取得する。
   */
  const getAlpha1Result = (sf: SignedFormula) => {
    const result = applyAlphaRule(sf);
    expect(result).toBeDefined();
    expect(result!.results).toHaveLength(1);
    return result!.results[0];
  };

  describe("P ∨ ¬P（排中律）のタブロー証明", () => {
    it("F(P ∨ ¬P) から矛盾を導出できる", () => {
      const p = predicate("P", []);
      const negP = negation(p);
      const pOrNegP = disjunction(p, negP);

      // 根: F(P ∨ ¬P)
      const root = signedFormula("F", pOrNegP);

      // α規則 F(∨): F(P ∨ ¬P) → F(P), F(¬P)
      const [fP, fNegPSf] = getAlpha2Results(root);

      // α規則 F(¬): F(¬P) → T(P)
      const tP = getAlpha1Result(fNegPSf);

      // 枝: [F(P ∨ ¬P), F(P), F(¬P), T(P)]
      const branch: readonly SignedFormula[] = [root, fP, fNegPSf, tP];

      // T(P) と F(P) で矛盾 → 閉じる
      const closure = checkBranchClosure(branch);
      expect(closure).toBeDefined();
      expect(closure!.ruleId).toBe("closure");
    });
  });

  describe("P → (Q → P) のタブロー証明", () => {
    it("F(P → (Q → P)) から矛盾を導出できる", () => {
      const p = predicate("P", []);
      const q = predicate("Q", []);
      const qImplP = implication(q, p);
      const pImplQImplP = implication(p, qImplP);

      // 根: F(P → (Q → P))
      const root = signedFormula("F", pImplQImplP);

      // α規則 F(→): F(P → (Q → P)) → T(P), F(Q → P)
      const [tP, fQImplP] = getAlpha2Results(root);

      // α規則 F(→): F(Q → P) → T(Q), F(P)
      const [tQ, fP] = getAlpha2Results(fQImplP);

      // 枝: T(P) と F(P) で矛盾
      const branch: readonly SignedFormula[] = [root, tP, fQImplP, tQ, fP];
      const closure = checkBranchClosure(branch);
      expect(closure).toBeDefined();
      expect(closure!.ruleId).toBe("closure");
    });
  });

  describe("∀x.P(x) ⊨ ∃x.P(x) のタブロー証明", () => {
    it("T(∀x.P(x)) と F(∃x.P(x)) から矛盾を導出できる", () => {
      const px = predicate("P", [x]);
      const forallXPx = universal(x, px);
      const existsXPx = existential(x, px);

      // 前提: T(∀x.P(x)), 否定: F(∃x.P(x))
      const tForall = signedFormula("T", forallXPx);
      const fExists = signedFormula("F", existsXPx);

      // γ規則 T(∀): T(∀x.P(x)) → T(P(x))（項xで代入）
      const gamma = applyGammaRule(tForall, x);
      expect(gamma).toBeDefined();
      expect(gamma!.ruleId).toBe("gamma-univ");
      const tPx = gamma!.result; // T(P(x))

      // γ規則 F(∃): F(∃x.P(x)) → F(P(x))（項xで代入）
      const gammaNeg = applyGammaRule(fExists, x);
      expect(gammaNeg).toBeDefined();
      expect(gammaNeg!.ruleId).toBe("gamma-neg-exist");
      const fPx = gammaNeg!.result; // F(P(x))

      // 枝: T(P(x)) と F(P(x)) で矛盾
      const branch: readonly SignedFormula[] = [tForall, fExists, tPx, fPx];
      const closure = checkBranchClosure(branch);
      expect(closure).toBeDefined();
      expect(closure!.ruleId).toBe("closure");
    });
  });

  describe("β規則を含む証明: ¬(P ∧ Q) ⊨ ¬P ∨ ¬Q（De Morgan）", () => {
    it("F(¬P ∨ ¬Q) と T(¬(P ∧ Q)) から両方の枝が閉じる", () => {
      const p = predicate("P", []);
      const q = predicate("Q", []);
      const negP = negation(p);
      const negQ = negation(q);
      const pAndQ = conjunction(p, q);
      const negPAndQ = negation(pAndQ);
      const negPOrNegQ = disjunction(negP, negQ);

      // 前提: T(¬(P ∧ Q)), 結論の否定: F(¬P ∨ ¬Q)
      const premise = signedFormula("T", negPAndQ);
      const negConclusion = signedFormula("F", negPOrNegQ);

      // α規則 T(¬): T(¬(P ∧ Q)) → F(P ∧ Q)
      const fPAndQ = getAlpha1Result(premise); // F(P ∧ Q)

      // α規則 F(∨): F(¬P ∨ ¬Q) → F(¬P), F(¬Q)
      const [fNegP, fNegQ] = getAlpha2Results(negConclusion);

      // α規則 F(¬): F(¬P) → T(P)
      const tP = getAlpha1Result(fNegP); // T(P)

      // α規則 F(¬): F(¬Q) → T(Q)
      const tQ = getAlpha1Result(fNegQ); // T(Q)

      // β規則 F(∧): F(P ∧ Q) → [F(P) | F(Q)]
      const beta = applyBetaRule(fPAndQ);
      expect(beta).toBeDefined();
      expect(beta!.ruleId).toBe("beta-neg-conj");
      const fP = beta!.left; // F(P)
      const fQ = beta!.right; // F(Q)

      // 左枝: ..., T(P), F(P) → 閉じる
      const leftBranch: readonly SignedFormula[] = [
        premise,
        negConclusion,
        fPAndQ,
        fNegP,
        fNegQ,
        tP,
        tQ,
        fP,
      ];
      const leftClosure = checkBranchClosure(leftBranch);
      expect(leftClosure).toBeDefined();

      // 右枝: ..., T(Q), F(Q) → 閉じる
      const rightBranch: readonly SignedFormula[] = [
        premise,
        negConclusion,
        fPAndQ,
        fNegP,
        fNegQ,
        tP,
        tQ,
        fQ,
      ];
      const rightClosure = checkBranchClosure(rightBranch);
      expect(rightClosure).toBeDefined();
    });
  });
});
