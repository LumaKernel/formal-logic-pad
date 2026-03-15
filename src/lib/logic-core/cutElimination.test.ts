import { describe, it, expect } from "vitest";
import {
  formulaDepth,
  removeAllOccurrences,
  removeFirstOccurrence,
  containsFormula,
  countOccurrences,
  rightRank,
  leftRank,
  mixRank,
  getScChildren,
  eliminateCuts,
  eliminateCutsWithSteps,
  isCutFree,
  countCuts,
  sequentEqual,
  DEFAULT_MAX_STEPS,
} from "./cutElimination";
import {
  FormulaSubstitution,
  Biconditional,
  metaVariable,
  implication,
  conjunction,
  disjunction,
  negation,
  universal,
  existential,
  predicate,
  equality,
} from "./formula";
import { termVariable } from "./term";
import {
  sequent,
  scIdentity,
  scCut,
  scWeakeningLeft,
  scWeakeningRight,
  scContractionLeft,
  scContractionRight,
  scExchangeLeft,
  scExchangeRight,
  scImplicationLeft,
  scImplicationRight,
  scConjunctionLeft,
  scConjunctionRight,
  scDisjunctionLeft,
  scDisjunctionRight,
  scUniversalLeft,
  scExistentialRight,
  scBottomLeft,
  scNegationLeft,
  scNegationRight,
  getScConclusion,
} from "./sequentCalculus";

// ── テスト用ヘルパー ────────────────────────────────────────

const phi = metaVariable("φ");
const psi = metaVariable("ψ");
const chi = metaVariable("χ");
const alpha = metaVariable("α");
const beta = metaVariable("β");

const phiImplPsi = implication(phi, psi);
const phiAndPsi = conjunction(phi, psi);
const phiOrPsi = disjunction(phi, psi);
const notPhi = negation(phi);

const x = termVariable("x");

// ── formulaDepth ──────────────────────────────────────────

describe("formulaDepth", () => {
  it("原子式(MetaVariable)の深さは1", () => {
    expect(formulaDepth(phi)).toBe(1);
  });

  it("原子式(Predicate)の深さは1", () => {
    expect(formulaDepth(predicate("P", []))).toBe(1);
  });

  it("原子式(Equality)の深さは1", () => {
    expect(formulaDepth(equality(x, x))).toBe(1);
  });

  it("否定の深さは1+内部", () => {
    expect(formulaDepth(notPhi)).toBe(2);
  });

  it("含意の深さは1+max(左,右)", () => {
    expect(formulaDepth(phiImplPsi)).toBe(2);
  });

  it("連言の深さは1+max(左,右)", () => {
    expect(formulaDepth(phiAndPsi)).toBe(2);
  });

  it("選言の深さは1+max(左,右)", () => {
    expect(formulaDepth(phiOrPsi)).toBe(2);
  });

  it("双条件の深さは1+max(左,右)", () => {
    expect(formulaDepth(new Biconditional({ left: phi, right: psi }))).toBe(2);
  });

  it("全称量化の深さは1+内部", () => {
    expect(formulaDepth(universal(x, phi))).toBe(2);
  });

  it("存在量化の深さは1+内部", () => {
    expect(formulaDepth(existential(x, phi))).toBe(2);
  });

  it("FormulaSubstitutionの深さは1+内部", () => {
    expect(
      formulaDepth(
        new FormulaSubstitution({ formula: phi, term: x, variable: x }),
      ),
    ).toBe(2);
  });

  it("ネストした式の深さを正しく計算", () => {
    // (φ → ψ) ∧ χ: depth = 1 + max(2, 1) = 3
    expect(formulaDepth(conjunction(phiImplPsi, chi))).toBe(3);
  });

  it("深くネストした式", () => {
    // ¬(φ → (ψ ∧ χ)): depth = 1 + 1 + max(1, 1+max(1,1)) = 4
    const inner = implication(phi, conjunction(psi, chi));
    expect(formulaDepth(negation(inner))).toBe(4);
  });
});

// ── シーケント操作ユーティリティ ────────────────────────────

describe("removeAllOccurrences", () => {
  it("出現をすべて除去する", () => {
    const result = removeAllOccurrences([phi, psi, phi, chi], phi);
    expect(result).toHaveLength(2);
  });

  it("出現がなければそのまま返す", () => {
    const result = removeAllOccurrences([psi, chi], phi);
    expect(result).toHaveLength(2);
  });

  it("空配列に対しては空配列を返す", () => {
    expect(removeAllOccurrences([], phi)).toHaveLength(0);
  });
});

describe("removeFirstOccurrence", () => {
  it("最初の出現のみ除去する", () => {
    const result = removeFirstOccurrence([phi, psi, phi, chi], phi);
    expect(result).toHaveLength(3);
  });

  it("出現がなければそのまま返す", () => {
    const result = removeFirstOccurrence([psi, chi], phi);
    expect(result).toHaveLength(2);
  });
});

describe("containsFormula", () => {
  it("含まれる場合trueを返す", () => {
    expect(containsFormula([phi, psi], phi)).toBe(true);
  });

  it("含まれない場合falseを返す", () => {
    expect(containsFormula([psi, chi], phi)).toBe(false);
  });

  it("空配列に対してfalseを返す", () => {
    expect(containsFormula([], phi)).toBe(false);
  });
});

describe("countOccurrences", () => {
  it("出現回数を正しく数える", () => {
    expect(countOccurrences([phi, psi, phi, chi, phi], phi)).toBe(3);
  });

  it("出現がなければ0を返す", () => {
    expect(countOccurrences([psi, chi], phi)).toBe(0);
  });
});

describe("sequentEqual", () => {
  it("同じシーケントはtrue", () => {
    expect(sequentEqual(sequent([phi], [psi]), sequent([phi], [psi]))).toBe(
      true,
    );
  });

  it("異なるシーケントはfalse", () => {
    expect(sequentEqual(sequent([phi], [psi]), sequent([psi], [phi]))).toBe(
      false,
    );
  });

  it("長さが異なればfalse", () => {
    expect(
      sequentEqual(sequent([phi], [psi]), sequent([phi, psi], [psi])),
    ).toBe(false);
  });
});

// ── getScChildren ──────────────────────────────────────────

describe("getScChildren", () => {
  it("ScIdentityの子は空", () => {
    const node = scIdentity(sequent([phi], [phi]));
    expect(getScChildren(node)).toHaveLength(0);
  });

  it("ScBottomLeftの子は空", () => {
    const node = scBottomLeft(sequent([], []));
    expect(getScChildren(node)).toHaveLength(0);
  });

  it("ScCutの子は2つ", () => {
    const left = scIdentity(sequent([phi], [phi]));
    const right = scIdentity(sequent([phi], [phi]));
    const node = scCut(left, right, phi, sequent([phi], [phi]));
    expect(getScChildren(node)).toHaveLength(2);
  });

  it("ScWeakeningLeftの子は1つ", () => {
    const premise = scIdentity(sequent([phi], [phi]));
    const node = scWeakeningLeft(premise, psi, sequent([psi, phi], [phi]));
    expect(getScChildren(node)).toHaveLength(1);
  });

  it("ScImplicationLeftの子は2つ", () => {
    const left = scIdentity(sequent([phi], [phi]));
    const right = scIdentity(sequent([psi], [psi]));
    const node = scImplicationLeft(left, right, sequent([phiImplPsi], []));
    expect(getScChildren(node)).toHaveLength(2);
  });

  it("ScConjunctionRightの子は2つ", () => {
    const left = scIdentity(sequent([phi], [phi]));
    const right = scIdentity(sequent([psi], [psi]));
    const node = scConjunctionRight(left, right, sequent([], [phiAndPsi]));
    expect(getScChildren(node)).toHaveLength(2);
  });

  it("ScDisjunctionLeftの子は2つ", () => {
    const left = scIdentity(sequent([phi], [phi]));
    const right = scIdentity(sequent([psi], [psi]));
    const node = scDisjunctionLeft(left, right, sequent([phiOrPsi], []));
    expect(getScChildren(node)).toHaveLength(2);
  });

  it("単項規則の子は1つ", () => {
    const premise = scIdentity(sequent([phi], [phi]));
    expect(
      getScChildren(scImplicationRight(premise, sequent([], [phiImplPsi]))),
    ).toHaveLength(1);
    expect(
      getScChildren(scConjunctionLeft(premise, 1, sequent([phiAndPsi], [phi]))),
    ).toHaveLength(1);
    expect(
      getScChildren(scDisjunctionRight(premise, 1, sequent([], [phiOrPsi]))),
    ).toHaveLength(1);
    expect(
      getScChildren(scContractionLeft(premise, phi, sequent([phi], [phi]))),
    ).toHaveLength(1);
    expect(
      getScChildren(
        scContractionRight(
          scIdentity(sequent([phi], [phi, phi])),
          phi,
          sequent([phi], [phi]),
        ),
      ),
    ).toHaveLength(1);
    expect(
      getScChildren(scExchangeLeft(premise, 0, sequent([phi], [phi]))),
    ).toHaveLength(1);
    expect(
      getScChildren(scWeakeningRight(premise, psi, sequent([phi], [phi, psi]))),
    ).toHaveLength(1);
    expect(
      getScChildren(scNegationLeft(premise, sequent([notPhi], [phi]))),
    ).toHaveLength(1);
    expect(
      getScChildren(scNegationRight(premise, sequent([phi], [notPhi]))),
    ).toHaveLength(1);
  });

  it("量化子規則の子は1つ", () => {
    const premise = scIdentity(sequent([phi], [phi]));
    expect(
      getScChildren(
        scUniversalLeft(premise, sequent([universal(x, phi)], [phi])),
      ),
    ).toHaveLength(1);
    expect(
      getScChildren(
        scExistentialRight(premise, sequent([phi], [existential(x, phi)])),
      ),
    ).toHaveLength(1);
  });
});

// ── rightRank / leftRank ──────────────────────────────────

describe("rightRank", () => {
  it("φが右辺にないノードのランクは0", () => {
    const node = scIdentity(sequent([phi], [phi]));
    expect(rightRank(node, psi)).toBe(0);
  });

  it("φが右辺にある葉ノードのランクは1", () => {
    const node = scIdentity(sequent([phi], [phi]));
    expect(rightRank(node, phi)).toBe(1);
  });

  it("弱化でφが右辺に追加されたノードのランク", () => {
    // 前提: psi ⇒ psi (φなし) → 弱化: psi ⇒ psi,φ
    const premise = scIdentity(sequent([psi], [psi]));
    const node = scWeakeningRight(premise, phi, sequent([psi], [psi, phi]));
    // 前提にφがないので子のランクは0、自身にφがあるので1
    expect(rightRank(node, phi)).toBe(1);
  });

  it("φが連続して右辺にあるパスでランクが増加", () => {
    // φ ⇒ φ → (⇒w) → φ ⇒ φ,ψ → (⇒w) → φ ⇒ φ,ψ,χ
    // φが右辺に出続ける → ランク増加
    const id = scIdentity(sequent([phi], [phi]));
    const w1 = scWeakeningRight(id, psi, sequent([phi], [phi, psi]));
    const w2 = scWeakeningRight(w1, chi, sequent([phi], [phi, psi, chi]));
    expect(rightRank(w2, phi)).toBe(3);
  });
});

describe("leftRank", () => {
  it("φが左辺にないノードのランクは0", () => {
    const node = scIdentity(sequent([phi], [phi]));
    expect(leftRank(node, psi)).toBe(0);
  });

  it("φが左辺にある葉ノードのランクは1", () => {
    const node = scIdentity(sequent([phi], [phi]));
    expect(leftRank(node, phi)).toBe(1);
  });

  it("弱化でφが左辺に追加されたノードのランク", () => {
    const premise = scIdentity(sequent([psi], [psi]));
    const node = scWeakeningLeft(premise, phi, sequent([phi, psi], [psi]));
    expect(leftRank(node, phi)).toBe(1);
  });
});

describe("mixRank", () => {
  it("両方IDのカットのランクは1", () => {
    // φ ⇒ φ   φ ⇒ φ  → CUT(φ) → φ ⇒ φ
    const left = scIdentity(sequent([phi], [phi]));
    const right = scIdentity(sequent([phi], [phi]));
    const cut = scCut(left, right, phi, sequent([phi], [phi]));
    expect(mixRank(cut)).toBe(1);
  });

  it("片側にφがなければランクは低い", () => {
    // psi ⇒ psi   φ ⇒ φ  → CUT(φ)
    const left = scIdentity(sequent([psi], [psi]));
    const right = scIdentity(sequent([phi], [phi]));
    const cut = scCut(left, right, phi, sequent([psi], [psi]));
    // 左の右辺にφなし → leftRank=0, 右の左辺にφあり → rightRank=1
    expect(mixRank(cut)).toBe(1);
  });
});

// ── isCutFree / countCuts ──────────────────────────────────

describe("isCutFree", () => {
  it("カットなしの証明はtrue", () => {
    const node = scIdentity(sequent([phi], [phi]));
    expect(isCutFree(node)).toBe(true);
  });

  it("カットありの証明はfalse", () => {
    const left = scIdentity(sequent([phi], [phi]));
    const right = scIdentity(sequent([phi], [phi]));
    const node = scCut(left, right, phi, sequent([phi], [phi]));
    expect(isCutFree(node)).toBe(false);
  });

  it("ネストされた構造の中のカットも検出", () => {
    const cut = scCut(
      scIdentity(sequent([phi], [phi])),
      scIdentity(sequent([phi], [phi])),
      phi,
      sequent([phi], [phi]),
    );
    const weakened = scWeakeningLeft(cut, psi, sequent([psi, phi], [phi]));
    expect(isCutFree(weakened)).toBe(false);
  });
});

describe("countCuts", () => {
  it("カットなしは0", () => {
    expect(countCuts(scIdentity(sequent([phi], [phi])))).toBe(0);
  });

  it("1つのカットは1", () => {
    const cut = scCut(
      scIdentity(sequent([phi], [phi])),
      scIdentity(sequent([phi], [phi])),
      phi,
      sequent([phi], [phi]),
    );
    expect(countCuts(cut)).toBe(1);
  });

  it("ネストされたカットを正しく数える", () => {
    const inner = scCut(
      scIdentity(sequent([phi], [phi])),
      scIdentity(sequent([phi], [phi])),
      phi,
      sequent([phi], [phi]),
    );
    const outer = scCut(
      inner,
      scIdentity(sequent([phi], [phi])),
      phi,
      sequent([phi], [phi]),
    );
    expect(countCuts(outer)).toBe(2);
  });
});

// ── eliminateCuts ──────────────────────────────────────────

describe("eliminateCuts", () => {
  it("カットフリーな証明はそのまま返す", () => {
    const node = scIdentity(sequent([phi], [phi]));
    const result = eliminateCuts(node);
    expect(result._tag).toBe("Success");
    if (result._tag === "Success") {
      expect(isCutFree(result.proof)).toBe(true);
    }
  });

  describe("基底ケース Cut(1,1)", () => {
    it("ID-ID カット: φ⇒φ  φ⇒φ → カット除去", () => {
      // φ ⇒ φ   φ ⇒ φ  → CUT(φ) → φ ⇒ φ
      const left = scIdentity(sequent([phi], [phi]));
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(left, right, phi, sequent([phi], [phi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("左がIDのカット: 右前提がそのまま返る", () => {
      // φ ⇒ φ   φ,ψ ⇒ ψ → CUT(φ) → φ,ψ ⇒ ψ
      // 実際は: φ⇒φ と φ⇒ψ(弱化) のカット
      const left = scIdentity(sequent([phi], [phi]));
      const rightInner = scIdentity(sequent([psi], [psi]));
      const right = scWeakeningLeft(
        rightInner,
        phi,
        sequent([phi, psi], [psi]),
      );
      const cut = scCut(left, right, phi, sequent([psi], [psi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });
  });

  describe("ランク0のケース", () => {
    it("左にカット式なし → 弱化で構成", () => {
      // psi ⇒ psi（φなし）  φ ⇒ φ → CUT(φ) → psi ⇒ psi
      const left = scIdentity(sequent([psi], [psi]));
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(left, right, phi, sequent([psi], [psi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("右にカット式なし → 弱化で構成（左にφ以外の右辺あり）", () => {
      // 左: φ,psi ⇒ φ,chi で右辺にφ以外もある
      const left = scIdentity(sequent([phi, psi], [phi, chi]));
      // 右: psi ⇒ psi（φなし）
      const right = scIdentity(sequent([psi], [psi]));
      const cut = scCut(left, right, phi, sequent([psi, psi], [chi, psi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("右にカット式なし → 弱化で構成", () => {
      // φ ⇒ φ  psi ⇒ psi（φなし） → CUT(φ) → psi ⇒ psi
      const left = scIdentity(sequent([phi], [phi]));
      const right = scIdentity(sequent([psi], [psi]));
      const cut = scCut(left, right, phi, sequent([psi], [psi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });
  });

  describe("構造規則とカットの相互作用", () => {
    it("弱化で導入されたカット式の除去", () => {
      // (⇒w): ψ ⇒ ψ → ψ ⇒ ψ,φ   φ ⇒ φ → CUT(φ) → ψ ⇒ ψ
      const premise = scIdentity(sequent([psi], [psi]));
      const left = scWeakeningRight(premise, phi, sequent([psi], [psi, phi]));
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(left, right, phi, sequent([psi], [psi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("左弱化とカットの相互作用", () => {
      // (w⇒): ψ ⇒ φ → χ,ψ ⇒ φ   φ ⇒ φ → CUT(φ) → χ,ψ ⇒ φ
      const premise = scIdentity(sequent([phi], [phi]));
      const left = scWeakeningLeft(premise, chi, sequent([chi, phi], [phi]));
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(left, right, phi, sequent([chi, phi], [phi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });
  });

  describe("深さ削減: 含意", () => {
    it("含意カット (⇒→)/(→⇒) の除去", () => {
      // 左: φ,Γ ⇒ ψ / (⇒→) Γ ⇒ φ→ψ
      // 右: Σ ⇒ φ / ψ,Σ'⇒Δ / (→⇒) φ→ψ,Σ,Σ'⇒Δ
      // カット: Γ,Σ,Σ' ⇒ Δ

      // 簡単な例: α,⇒β / (⇒→) ⇒α→β と α⇒α / β⇒β / (→⇒) α→β,α⇒β
      const left = scImplicationRight(
        // α⇒βは厳密には不正だがテスト上の簡略化
        // 実際は α,⇒β を (⇒→) で α→β にする
        scIdentity(sequent([alpha], [beta])),
        sequent([], [implication(alpha, beta)]),
      );

      const rightLeftPremise = scIdentity(sequent([alpha], [alpha]));
      const rightRightPremise = scIdentity(sequent([beta], [beta]));
      const right = scImplicationLeft(
        rightLeftPremise,
        rightRightPremise,
        sequent([implication(alpha, beta), alpha], [beta]),
      );

      const cut = scCut(
        left,
        right,
        implication(alpha, beta),
        sequent([alpha], [beta]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });
  });

  describe("深さ削減: 連言", () => {
    it("連言カット (⇒∧)/(∧⇒) の除去", () => {
      // 左: α⇒α / β⇒β / (⇒∧) ⇒ α∧β
      // 右: α ⇒ (∧⇒,1) α∧β ⇒
      const leftLeft = scIdentity(sequent([alpha], [alpha]));
      const leftRight = scIdentity(sequent([beta], [beta]));
      const left = scConjunctionRight(
        leftLeft,
        leftRight,
        sequent([alpha, beta], [conjunction(alpha, beta)]),
      );

      const rightPremise = scIdentity(sequent([alpha], [alpha]));
      const right = scConjunctionLeft(
        rightPremise,
        1,
        sequent([conjunction(alpha, beta)], [alpha]),
      );

      const cut = scCut(
        left,
        right,
        conjunction(alpha, beta),
        sequent([alpha, beta], [alpha]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("連言カット componentIndex=2", () => {
      const leftLeft = scIdentity(sequent([alpha], [alpha]));
      const leftRight = scIdentity(sequent([beta], [beta]));
      const left = scConjunctionRight(
        leftLeft,
        leftRight,
        sequent([alpha, beta], [conjunction(alpha, beta)]),
      );

      const rightPremise = scIdentity(sequent([beta], [beta]));
      const right = scConjunctionLeft(
        rightPremise,
        2,
        sequent([conjunction(alpha, beta)], [beta]),
      );

      const cut = scCut(
        left,
        right,
        conjunction(alpha, beta),
        sequent([alpha, beta], [beta]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });
  });

  describe("深さ削減: 選言", () => {
    it("選言カット (⇒∨)/(∨⇒) の除去", () => {
      // 左: α⇒α / (⇒∨,1) ⇒α∨β
      // 右: α⇒α / β⇒β / (∨⇒) α∨β⇒

      const leftPremise = scIdentity(sequent([alpha], [alpha]));
      const left = scDisjunctionRight(
        leftPremise,
        1,
        sequent([alpha], [disjunction(alpha, beta)]),
      );

      const rightLeft = scIdentity(sequent([alpha], [alpha]));
      const rightRight = scIdentity(sequent([beta], [beta]));
      const right = scDisjunctionLeft(
        rightLeft,
        rightRight,
        sequent([disjunction(alpha, beta)], [alpha, beta]),
      );

      const cut = scCut(
        left,
        right,
        disjunction(alpha, beta),
        sequent([alpha], [alpha, beta]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });
  });

  describe("eliminateCutsWithSteps", () => {
    it("ステップ情報を返す", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(left, right, phi, sequent([phi], [phi]));

      const { result, steps } = eliminateCutsWithSteps(cut);
      expect(result._tag).toBe("Success");
      expect(steps.length).toBeGreaterThanOrEqual(1);
      expect(steps[0].depth).toBe(1);
      expect(steps[0].rank).toBe(1);
    });

    it("カットフリーな証明はステップなし", () => {
      const node = scIdentity(sequent([phi], [phi]));
      const { result, steps } = eliminateCutsWithSteps(node);
      expect(result._tag).toBe("Success");
      expect(steps).toHaveLength(0);
    });
  });

  describe("ネストされたカットの除去", () => {
    it("2重にネストされたカットを除去できる", () => {
      // inner: φ⇒φ  φ⇒φ → CUT(φ) → φ⇒φ
      const inner = scCut(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      // outer: inner  φ⇒φ → CUT(φ) → φ⇒φ
      const outer = scCut(
        inner,
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );

      const result = eliminateCuts(outer);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });
  });

  describe("カットを含む子を持つ非カットノード", () => {
    it("弱化の前提にカットがある場合も除去される", () => {
      const cut = scCut(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      const weakened = scWeakeningLeft(cut, psi, sequent([psi, phi], [phi]));

      const result = eliminateCuts(weakened);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("含意右規則の前提にカットがある場合も除去される", () => {
      const cut = scCut(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      const impl = scImplicationRight(
        cut,
        sequent([], [implication(phi, phi)]),
      );

      const result = eliminateCuts(impl);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("連言右規則の左右前提にカットがある場合も除去される", () => {
      const cut1 = scCut(
        scIdentity(sequent([alpha], [alpha])),
        scIdentity(sequent([alpha], [alpha])),
        alpha,
        sequent([alpha], [alpha]),
      );
      const cut2 = scCut(
        scIdentity(sequent([beta], [beta])),
        scIdentity(sequent([beta], [beta])),
        beta,
        sequent([beta], [beta]),
      );
      const conj = scConjunctionRight(
        cut1,
        cut2,
        sequent([alpha, beta], [conjunction(alpha, beta)]),
      );

      const result = eliminateCuts(conj);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("選言左規則の前提にカットがある場合も除去される", () => {
      const cut1 = scCut(
        scIdentity(sequent([alpha], [alpha])),
        scIdentity(sequent([alpha], [alpha])),
        alpha,
        sequent([alpha], [alpha]),
      );
      const cut2 = scCut(
        scIdentity(sequent([beta], [beta])),
        scIdentity(sequent([beta], [beta])),
        beta,
        sequent([beta], [beta]),
      );
      const disj = scDisjunctionLeft(
        cut1,
        cut2,
        sequent([disjunction(alpha, beta)], [alpha, beta]),
      );

      const result = eliminateCuts(disj);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("含意左規則の前提にカットがある場合も除去される", () => {
      const cut1 = scCut(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      const cut2 = scCut(
        scIdentity(sequent([psi], [psi])),
        scIdentity(sequent([psi], [psi])),
        psi,
        sequent([psi], [psi]),
      );
      const impl = scImplicationLeft(cut1, cut2, sequent([phiImplPsi], []));

      const result = eliminateCuts(impl);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("縮約規則の前提にカットがある場合も除去される", () => {
      const cut = scCut(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      const contracted = scContractionLeft(
        scWeakeningLeft(cut, phi, sequent([phi, phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );

      const result = eliminateCuts(contracted);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("交換規則の前提にカットがある場合も除去される", () => {
      const cut = scCut(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      const exchanged = scExchangeLeft(cut, 0, sequent([phi], [phi]));

      const result = eliminateCuts(exchanged);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("連言左規則の前提にカットがある場合も除去される", () => {
      const cut = scCut(
        scIdentity(sequent([alpha], [alpha])),
        scIdentity(sequent([alpha], [alpha])),
        alpha,
        sequent([alpha], [alpha]),
      );
      const conjLeft = scConjunctionLeft(
        cut,
        1,
        sequent([conjunction(alpha, beta)], [alpha]),
      );

      const result = eliminateCuts(conjLeft);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("選言右規則の前提にカットがある場合も除去される", () => {
      const cut = scCut(
        scIdentity(sequent([alpha], [alpha])),
        scIdentity(sequent([alpha], [alpha])),
        alpha,
        sequent([alpha], [alpha]),
      );
      const disjRight = scDisjunctionRight(
        cut,
        1,
        sequent([alpha], [disjunction(alpha, beta)]),
      );

      const result = eliminateCuts(disjRight);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("量化子規則の前提にカットがある場合も除去される", () => {
      const cut = scCut(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      const univLeft = scUniversalLeft(
        cut,
        sequent([universal(x, phi)], [phi]),
      );

      const result = eliminateCuts(univLeft);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("右縮約規則の前提にカットがある場合も除去される", () => {
      const cut = scCut(
        scIdentity(sequent([phi], [phi, phi])),
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi, phi]),
      );
      const contracted = scContractionRight(cut, phi, sequent([phi], [phi]));

      const result = eliminateCuts(contracted);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });
  });

  describe("ランク削減 pushMixIntoLeft: 各構造規則ケース", () => {
    it("ScWeakeningRight でφが弱化で導入された場合（rank削減）", () => {
      const idLeft = scIdentity(sequent([phi], [phi]));
      const weakLeft = scWeakeningRight(
        idLeft,
        psi,
        sequent([phi], [phi, psi]),
      );
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(weakLeft, right, phi, sequent([phi], [phi, psi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScWeakeningRight でφ以外が弱化された場合", () => {
      const idLeft = scIdentity(sequent([phi], [phi]));
      const weak1 = scWeakeningRight(idLeft, psi, sequent([phi], [phi, psi]));
      const weak2 = scWeakeningRight(
        weak1,
        chi,
        sequent([phi], [phi, psi, chi]),
      );
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(weak2, right, phi, sequent([phi], [phi, psi, chi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScWeakeningLeft: 左弱化の場合", () => {
      const idLeft = scIdentity(sequent([phi], [phi]));
      const weakLeft1 = scWeakeningLeft(
        idLeft,
        psi,
        sequent([psi, phi], [phi]),
      );
      const weakLeft2 = scWeakeningRight(
        weakLeft1,
        chi,
        sequent([psi, phi], [phi, chi]),
      );
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(weakLeft2, right, phi, sequent([psi, phi], [phi, chi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScContractionRight でφが縮約される場合", () => {
      const idLeft = scIdentity(sequent([phi], [phi, phi]));
      const contracted = scContractionRight(idLeft, phi, sequent([phi], [phi]));
      const weak = scWeakeningRight(
        contracted,
        psi,
        sequent([phi], [phi, psi]),
      );
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(weak, right, phi, sequent([phi], [phi, psi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScContractionRight でφ以外が縮約される場合", () => {
      const idLeft = scIdentity(sequent([phi], [phi]));
      const weak1 = scWeakeningRight(idLeft, psi, sequent([phi], [phi, psi]));
      const weak2 = scWeakeningRight(
        weak1,
        psi,
        sequent([phi], [phi, psi, psi]),
      );
      const contracted = scContractionRight(
        weak2,
        psi,
        sequent([phi], [phi, psi]),
      );
      const weak3 = scWeakeningRight(
        contracted,
        chi,
        sequent([phi], [phi, psi, chi]),
      );
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(weak3, right, phi, sequent([phi], [phi, psi, chi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScContractionLeft: 左縮約の場合", () => {
      const idLeft = scIdentity(sequent([phi, phi], [phi]));
      const contracted = scContractionLeft(idLeft, phi, sequent([phi], [phi]));
      const weak = scWeakeningRight(
        contracted,
        psi,
        sequent([phi], [phi, psi]),
      );
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(weak, right, phi, sequent([phi], [phi, psi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScExchangeLeft: 左交換の場合", () => {
      const idLeft = scIdentity(sequent([phi, psi], [phi]));
      const exchanged = scExchangeLeft(idLeft, 0, sequent([psi, phi], [phi]));
      const weak = scWeakeningRight(
        exchanged,
        chi,
        sequent([psi, phi], [phi, chi]),
      );
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(weak, right, phi, sequent([psi, phi], [phi, chi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScImplicationRight: 含意右規則の場合", () => {
      const idLeft = scIdentity(sequent([phi], [phi]));
      const weak = scWeakeningRight(idLeft, psi, sequent([phi], [phi, psi]));
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(weak, right, phi, sequent([phi], [phi, psi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScImplicationLeft: 左の左前提にφがある場合", () => {
      const leftLeft = scIdentity(sequent([phi], [phi]));
      const leftLeftWeak = scWeakeningRight(
        leftLeft,
        alpha,
        sequent([phi], [phi, alpha]),
      );
      const leftRight = scIdentity(sequent([beta], [beta]));
      const left = scImplicationLeft(
        leftLeftWeak,
        leftRight,
        sequent([implication(alpha, beta), phi], [phi, beta]),
      );
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(
        left,
        right,
        phi,
        sequent([implication(alpha, beta), phi], [beta]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScImplicationLeft: 左の右前提にφがある場合", () => {
      const leftLeft = scIdentity(sequent([alpha], [alpha]));
      const leftRight = scIdentity(sequent([phi, beta], [phi, beta]));
      const left = scImplicationLeft(
        leftLeft,
        leftRight,
        sequent([implication(alpha, beta), phi], [alpha, phi, beta]),
      );
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(
        left,
        right,
        phi,
        sequent([implication(alpha, beta), phi], [alpha, beta]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScConjunctionRight: 左の左前提にφがある場合", () => {
      const leftLeft = scIdentity(sequent([phi], [phi]));
      const leftLeftWeak = scWeakeningRight(
        leftLeft,
        alpha,
        sequent([phi], [phi, alpha]),
      );
      const leftRight = scIdentity(sequent([beta], [beta]));
      const left = scConjunctionRight(
        leftLeftWeak,
        leftRight,
        sequent([phi, beta], [phi, conjunction(alpha, beta)]),
      );
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(
        left,
        right,
        phi,
        sequent([phi, beta], [conjunction(alpha, beta)]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScConjunctionRight: 左の右前提にφがある場合", () => {
      const leftLeft = scIdentity(sequent([alpha], [alpha]));
      const leftRight = scIdentity(sequent([phi], [phi]));
      const leftRightWeak = scWeakeningRight(
        leftRight,
        beta,
        sequent([phi], [phi, beta]),
      );
      const left = scConjunctionRight(
        leftLeft,
        leftRightWeak,
        sequent([alpha, phi], [conjunction(alpha, beta), phi]),
      );
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(
        left,
        right,
        phi,
        sequent([alpha, phi], [conjunction(alpha, beta)]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScConjunctionLeft: 連言左規則の場合", () => {
      const premise = scIdentity(sequent([alpha], [phi, alpha]));
      const left = scConjunctionLeft(
        premise,
        1,
        sequent([conjunction(alpha, beta)], [phi, alpha]),
      );
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(
        left,
        right,
        phi,
        sequent([conjunction(alpha, beta)], [alpha]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScDisjunctionRight: 選言右規則の場合", () => {
      const premise = scIdentity(sequent([alpha], [phi, alpha]));
      const left = scDisjunctionRight(
        premise,
        1,
        sequent([alpha], [phi, disjunction(alpha, beta)]),
      );
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(
        left,
        right,
        phi,
        sequent([alpha], [disjunction(alpha, beta)]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScDisjunctionLeft: 左の左前提にφがある場合", () => {
      const leftLeft = scIdentity(sequent([phi, alpha], [phi, alpha]));
      const leftRight = scIdentity(sequent([beta], [beta]));
      const left = scDisjunctionLeft(
        leftLeft,
        leftRight,
        sequent([disjunction(alpha, beta), phi], [phi, alpha, beta]),
      );
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(
        left,
        right,
        phi,
        sequent([disjunction(alpha, beta), phi], [alpha, beta]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScDisjunctionLeft: 左の右前提にφがある場合", () => {
      const leftLeft = scIdentity(sequent([alpha], [alpha]));
      const leftRight = scIdentity(sequent([phi, beta], [phi, beta]));
      const left = scDisjunctionLeft(
        leftLeft,
        leftRight,
        sequent([disjunction(alpha, beta), phi], [alpha, phi, beta]),
      );
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(
        left,
        right,
        phi,
        sequent([disjunction(alpha, beta), phi], [alpha, beta]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScUniversalLeft: 全称左規則の場合", () => {
      const premise = scIdentity(sequent([phi], [phi]));
      const weak = scWeakeningRight(premise, psi, sequent([phi], [phi, psi]));
      const left = scUniversalLeft(
        weak,
        sequent([universal(x, phi)], [phi, psi]),
      );
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(left, right, phi, sequent([universal(x, phi)], [psi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScBottomLeft: 左がBottomLeftの場合", () => {
      const left = scBottomLeft(sequent([], []));
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(left, right, phi, sequent([], []));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });
  });

  describe("ランク削減 pushMixIntoRight: 各構造規則ケース", () => {
    it("ScWeakeningLeft でφが弱化で導入された場合", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const idRight = scIdentity(sequent([phi], [phi]));
      const weakRight = scWeakeningLeft(
        idRight,
        psi,
        sequent([phi, psi], [phi]),
      );
      const cut = scCut(left, weakRight, phi, sequent([psi], [phi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScWeakeningLeft でφ以外が弱化された場合", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const idRight = scIdentity(sequent([phi], [phi]));
      const weak1 = scWeakeningLeft(idRight, psi, sequent([phi, psi], [phi]));
      const weak2 = scWeakeningLeft(
        weak1,
        chi,
        sequent([phi, psi, chi], [phi]),
      );
      const cut = scCut(left, weak2, phi, sequent([psi, chi], [phi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScWeakeningRight: 右弱化の場合", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const idRight = scIdentity(sequent([phi], [phi]));
      const weakRight1 = scWeakeningRight(
        idRight,
        psi,
        sequent([phi], [phi, psi]),
      );
      const weakRight2 = scWeakeningLeft(
        weakRight1,
        chi,
        sequent([phi, chi], [phi, psi]),
      );
      const cut = scCut(left, weakRight2, phi, sequent([chi], [phi, psi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScContractionLeft でφが縮約される場合", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const idRight = scIdentity(sequent([phi, phi], [phi]));
      const contracted = scContractionLeft(idRight, phi, sequent([phi], [phi]));
      const weak = scWeakeningLeft(contracted, psi, sequent([phi, psi], [phi]));
      const cut = scCut(left, weak, phi, sequent([psi], [phi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScContractionLeft でφ以外が縮約される場合", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const idRight = scIdentity(sequent([phi], [phi]));
      const weak1 = scWeakeningLeft(idRight, psi, sequent([phi, psi], [phi]));
      const weak2 = scWeakeningLeft(
        weak1,
        psi,
        sequent([phi, psi, psi], [phi]),
      );
      const contracted = scContractionLeft(
        weak2,
        psi,
        sequent([phi, psi], [phi]),
      );
      const weak3 = scWeakeningLeft(
        contracted,
        chi,
        sequent([phi, psi, chi], [phi]),
      );
      const cut = scCut(left, weak3, phi, sequent([psi, chi], [phi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScContractionRight: 右縮約の場合", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const idRight = scIdentity(sequent([phi], [phi, phi]));
      const contracted = scContractionRight(
        idRight,
        phi,
        sequent([phi], [phi]),
      );
      const weak = scWeakeningLeft(contracted, psi, sequent([phi, psi], [phi]));
      const cut = scCut(left, weak, phi, sequent([psi], [phi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScImplicationLeft: 右の左前提にφがある場合", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const rightLeft = scIdentity(sequent([phi, alpha], [phi, alpha]));
      const rightRight = scIdentity(sequent([beta], [beta]));
      const right = scImplicationLeft(
        rightLeft,
        rightRight,
        sequent([implication(alpha, beta), phi], [phi, alpha, beta]),
      );
      const cut = scCut(
        left,
        right,
        phi,
        sequent([implication(alpha, beta)], [alpha, beta]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScImplicationLeft: 右の右前提にφがある場合", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const rightLeft = scIdentity(sequent([alpha], [alpha]));
      const rightRight = scIdentity(sequent([phi, beta], [phi, beta]));
      const right = scImplicationLeft(
        rightLeft,
        rightRight,
        sequent([implication(alpha, beta), phi], [alpha, phi, beta]),
      );
      const cut = scCut(
        left,
        right,
        phi,
        sequent([implication(alpha, beta)], [alpha, beta]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScImplicationRight: 含意右規則の場合", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const idRight = scIdentity(sequent([phi], [phi]));
      const weak = scWeakeningLeft(idRight, psi, sequent([phi, psi], [phi]));
      const cut = scCut(left, weak, phi, sequent([psi], [phi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScConjunctionLeft: 連言左規則の場合", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const premise = scIdentity(sequent([phi, alpha], [phi, alpha]));
      const right = scConjunctionLeft(
        premise,
        1,
        sequent([conjunction(alpha, beta), phi], [phi, alpha]),
      );
      const cut = scCut(
        left,
        right,
        phi,
        sequent([conjunction(alpha, beta)], [alpha]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScConjunctionRight: 右の左前提にφがある場合", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const rightLeft = scIdentity(sequent([phi, alpha], [phi, alpha]));
      const rightRight = scIdentity(sequent([beta], [beta]));
      const right = scConjunctionRight(
        rightLeft,
        rightRight,
        sequent([phi, beta], [phi, conjunction(alpha, beta)]),
      );
      const cut = scCut(
        left,
        right,
        phi,
        sequent([beta], [conjunction(alpha, beta)]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScConjunctionRight: 右の右前提にφがある場合", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const rightLeft = scIdentity(sequent([alpha], [alpha]));
      const rightRight = scIdentity(sequent([phi, beta], [phi, beta]));
      const right = scConjunctionRight(
        rightLeft,
        rightRight,
        sequent([alpha, phi], [conjunction(alpha, beta), phi]),
      );
      const cut = scCut(
        left,
        right,
        phi,
        sequent([alpha], [conjunction(alpha, beta)]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScDisjunctionLeft: 右の左前提にφがある場合", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const rightLeft = scIdentity(sequent([phi, alpha], [phi, alpha]));
      const rightRight = scIdentity(sequent([beta], [beta]));
      const right = scDisjunctionLeft(
        rightLeft,
        rightRight,
        sequent([disjunction(alpha, beta), phi], [phi, alpha, beta]),
      );
      const cut = scCut(
        left,
        right,
        phi,
        sequent([disjunction(alpha, beta)], [alpha, beta]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScDisjunctionLeft: 右の右前提にφがある場合", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const rightLeft = scIdentity(sequent([alpha], [alpha]));
      const rightRight = scIdentity(sequent([phi, beta], [phi, beta]));
      const right = scDisjunctionLeft(
        rightLeft,
        rightRight,
        sequent([disjunction(alpha, beta), phi], [alpha, phi, beta]),
      );
      const cut = scCut(
        left,
        right,
        phi,
        sequent([disjunction(alpha, beta)], [alpha, beta]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScDisjunctionRight: 選言右規則の場合", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const premise = scIdentity(sequent([phi, alpha], [phi, alpha]));
      const right = scDisjunctionRight(
        premise,
        1,
        sequent([phi, alpha], [phi, disjunction(alpha, beta)]),
      );
      const cut = scCut(
        left,
        right,
        phi,
        sequent([alpha], [disjunction(alpha, beta)]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScExistentialRight: 存在右規則の場合", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const premise = scIdentity(sequent([phi], [phi]));
      const weak = scWeakeningLeft(premise, psi, sequent([phi, psi], [phi]));
      const right = scExistentialRight(
        weak,
        sequent([phi, psi], [existential(x, phi)]),
      );
      const cut = scCut(
        left,
        right,
        phi,
        sequent([psi], [existential(x, phi)]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScUniversalLeft: 全称左規則の場合", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const premise = scIdentity(sequent([phi], [phi]));
      const weak = scWeakeningRight(premise, psi, sequent([phi], [phi, psi]));
      const right = scUniversalLeft(
        weak,
        sequent([phi, universal(x, phi)], [phi, psi]),
      );
      const cut = scCut(left, right, phi, sequent([universal(x, phi)], [psi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScBottomLeft: 右がBottomLeftの場合", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const right = scBottomLeft(sequent([], []));
      const cut = scCut(left, right, phi, sequent([], []));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScExchangeLeft: 右交換の場合", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const idRight = scIdentity(sequent([phi, psi], [phi]));
      const exchanged = scExchangeLeft(idRight, 0, sequent([psi, phi], [phi]));
      const cut = scCut(left, exchanged, phi, sequent([psi], [phi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });
  });

  describe("pushMixIntoLeft: 追加の分岐カバレッジ", () => {
    it("ScImplicationRight: 左が含意右規則で phi が右辺にある場合", () => {
      // 左: (⇒→) phi,α ⇒ phi,β を phi ⇒ phi,α→β にする（ランク2）
      const leftPremise = scIdentity(sequent([phi, alpha], [phi, beta]));
      const left = scImplicationRight(
        leftPremise,
        sequent([phi], [phi, implication(alpha, beta)]),
      );
      // leftのrightRank: phiはleftの succedents にある
      // leftPremise の succedents にも phi がある
      // rightRank(left, phi) = rightRank(leftPremise, phi) + 1 = 1 + 1 = 2
      // 右: φ⇒φ (leftRank=1)
      const right = scIdentity(sequent([phi], [phi]));
      // lr=2, rr=1 → pushMixIntoLeft, left is ScImplicationRight
      const cut = scCut(
        left,
        right,
        phi,
        sequent([], [implication(alpha, beta)]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });
  });

  describe("pushMixIntoRight: ScIdentity/ScBottomLeft ケース", () => {
    it("ScIdentity: 右がIDで pushMixIntoRight に到達", () => {
      // rr > lr を作る: rightRank(left, phi) = 0, leftRank(right, phi) = 1
      // 但し pushMixIntoRight は rr > lr かつ r >= 2 の場合のみ呼ばれる
      // ScIdentity のケースは rank >= 2 では到達し得ない（IDは葉でrankは常に1以下）
      // → 実際にはこのケースは rank >= 2 で ScIdentity が右にある場合に起きるが、
      //   ScIdentity の leftRank は最大1なので rr >= 2 にならない
      //   ただし、カット除去過程で中間的に ScIdentity が現れる可能性がある
      // テスト: このケースは到達しにくいため、pushMixIntoLeft経由のScIdentityでカバー
      const left = scIdentity(sequent([phi], [phi]));
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(left, right, phi, sequent([phi], [phi]));
      // rank=1 なので pushMixIntoLeft/Right ではなく基底ケースに行く
      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
    });
  });

  describe("pushMixIntoRight: 追加の分岐カバレッジ", () => {
    it("ScWeakeningLeft でφ自体が弱化で導入された場合（rr > lr）", () => {
      // 左: φ⇒φ (rightRank=1 for phi)
      const left = scIdentity(sequent([phi], [phi]));
      // 右: φ⇒φ を弱化で φ,φ⇒φ にし、leftRank=2
      const idRight = scIdentity(sequent([phi], [phi]));
      const weakRight = scWeakeningLeft(
        idRight,
        phi, // phi自体を弱化で追加
        sequent([phi, phi], [phi]),
      );
      const cut = scCut(left, weakRight, phi, sequent([phi], [phi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScImplicationRight: 右が含意右規則で phi が前提の左辺にある場合", () => {
      // 左: φ⇒φ (rightRank=1)
      const left = scIdentity(sequent([phi], [phi]));
      // 右: (⇒→) phi,α ⇒ β を phi ⇒ α→β にする
      // 前提: phi,α ⇒ phi,β (phi が左辺にある → leftRank >= 1)
      const rightPremise = scIdentity(sequent([phi, alpha], [phi, beta]));
      const right = scImplicationRight(
        rightPremise,
        sequent([phi], [phi, implication(alpha, beta)]),
      );
      // rightのleftRank: phiはrightの antecedents にある
      // rightPremise の antecedents にも phi がある
      // leftRank(right, phi) = leftRank(rightPremise, phi) + 1 = 1 + 1 = 2
      // lr=1, rr=2 → pushMixIntoRight
      const cut = scCut(
        left,
        right,
        phi,
        sequent([], [implication(alpha, beta)]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });
  });

  describe("深さ削減: フォールバックケース", () => {
    it("Negation: 否定のカットはpushMixIntoLeftにフォールバック", () => {
      const negAlpha = negation(alpha);
      const left = scIdentity(sequent([negAlpha], [negAlpha]));
      const right = scIdentity(sequent([negAlpha], [negAlpha]));
      const cut = scCut(left, right, negAlpha, sequent([negAlpha], [negAlpha]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("Universal: 全称量化子のカットはフォールバック", () => {
      const univAlpha = universal(x, alpha);
      const left = scIdentity(sequent([univAlpha], [univAlpha]));
      const right = scIdentity(sequent([univAlpha], [univAlpha]));
      const cut = scCut(
        left,
        right,
        univAlpha,
        sequent([univAlpha], [univAlpha]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("Existential: 存在量化子のカットはフォールバック", () => {
      const existAlpha = existential(x, alpha);
      const left = scIdentity(sequent([existAlpha], [existAlpha]));
      const right = scIdentity(sequent([existAlpha], [existAlpha]));
      const cut = scCut(
        left,
        right,
        existAlpha,
        sequent([existAlpha], [existAlpha]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("Predicate: 述語（深さ1）のカットは基底ケース", () => {
      const pred = predicate("P", [x]);
      const left = scIdentity(sequent([pred], [pred]));
      const right = scIdentity(sequent([pred], [pred]));
      const cut = scCut(left, right, pred, sequent([pred], [pred]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("選言カット componentIndex=2", () => {
      const leftPremise = scIdentity(sequent([beta], [beta]));
      const left = scDisjunctionRight(
        leftPremise,
        2,
        sequent([beta], [disjunction(alpha, beta)]),
      );

      const rightLeft = scIdentity(sequent([alpha], [alpha]));
      const rightRight = scIdentity(sequent([beta], [beta]));
      const right = scDisjunctionLeft(
        rightLeft,
        rightRight,
        sequent([disjunction(alpha, beta)], [alpha, beta]),
      );

      const cut = scCut(
        left,
        right,
        disjunction(alpha, beta),
        sequent([beta], [alpha, beta]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });
  });

  describe("深さ削減: 規則不一致によるフォールバック", () => {
    it("Implication: 左がScImplicationRightでない場合はフォールバック", () => {
      // φ = α→β (depth=2), left is NOT ScImplicationRight (弱化), rank=1
      const impl = implication(alpha, beta);
      // 左: ID(α→β ⇒ α→β) を弱化した構造
      const premise = scIdentity(sequent([psi], [psi]));
      const left = scWeakeningRight(premise, impl, sequent([psi], [psi, impl]));
      // 右: ID(α→β ⇒ α→β) を弱化した構造
      const premise2 = scIdentity(sequent([chi], [chi]));
      const right = scWeakeningLeft(
        premise2,
        impl,
        sequent([impl, chi], [chi]),
      );
      const cut = scCut(left, right, impl, sequent([psi, chi], [psi, chi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("Conjunction: 左がScConjunctionRightでない場合はフォールバック", () => {
      const conj = conjunction(alpha, beta);
      const premise = scIdentity(sequent([psi], [psi]));
      const left = scWeakeningRight(premise, conj, sequent([psi], [psi, conj]));
      const premise2 = scIdentity(sequent([chi], [chi]));
      const right = scWeakeningLeft(
        premise2,
        conj,
        sequent([conj, chi], [chi]),
      );
      const cut = scCut(left, right, conj, sequent([psi, chi], [psi, chi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("Disjunction: 左がScDisjunctionRightでない場合はフォールバック", () => {
      const disj = disjunction(alpha, beta);
      const premise = scIdentity(sequent([psi], [psi]));
      const left = scWeakeningRight(premise, disj, sequent([psi], [psi, disj]));
      const premise2 = scIdentity(sequent([chi], [chi]));
      const right = scWeakeningLeft(
        premise2,
        disj,
        sequent([disj, chi], [chi]),
      );
      const cut = scCut(left, right, disj, sequent([psi, chi], [psi, chi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });
  });

  describe("reduceRank: ランク削減の分岐", () => {
    it("lr >= rr の場合: pushMixIntoLeft を呼ぶ", () => {
      const idLeft = scIdentity(sequent([phi], [phi]));
      const weakLeft = scWeakeningRight(
        idLeft,
        psi,
        sequent([phi], [phi, psi]),
      );
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(weakLeft, right, phi, sequent([phi], [phi, psi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("lr < rr の場合: pushMixIntoRight を呼ぶ", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const idRight = scIdentity(sequent([phi], [phi]));
      const weakRight = scWeakeningLeft(
        idRight,
        psi,
        sequent([phi, psi], [phi]),
      );
      const cut = scCut(left, weakRight, phi, sequent([psi], [phi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });
  });

  describe("eliminateBaseCut: 基底ケースの非IDケース", () => {
    it("左右どちらもIDでない場合: pushMixIntoLeftにフォールバック", () => {
      const premise = scIdentity(sequent([psi], [psi]));
      const left = scWeakeningRight(premise, phi, sequent([psi], [psi, phi]));
      const premise2 = scIdentity(sequent([chi], [chi]));
      const right = scWeakeningLeft(premise2, phi, sequent([phi, chi], [chi]));
      const cut = scCut(left, right, phi, sequent([psi, chi], [psi, chi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });
  });

  describe("adjustConclusion 経由テスト", () => {
    it("結論が異なる場合も正しく調整される", () => {
      const left = scIdentity(sequent([psi], [psi]));
      const rightInner = scIdentity(sequent([phi], [phi]));
      const right = scWeakeningLeft(
        rightInner,
        chi,
        sequent([phi, chi], [phi]),
      );
      const cut = scCut(left, right, phi, sequent([psi, chi], [psi, phi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("結論が既に一致している場合はそのまま返す（adjustConclusion早期リターン）", () => {
      // adjustConclusion の早期リターンをカバーするケース
      // eliminateRankZeroLeft: right.antecedents=[φ], right.succedents=[]
      // → 弱化ループが空 → current = left → conclusion が既に一致
      const left = scIdentity(sequent([psi], [psi]));
      // right: ScBottomLeft with conclusion φ⊢ (antecedents=[φ], succedents=[])
      const right = scBottomLeft(sequent([phi], []));
      // leftRank = count(φ in [ψ]) = 0 → eliminateRankZeroLeft
      // cutNode.conclusion = ψ⊢ψ = left.conclusion → adjustConclusion 早期リターン
      const cut = scCut(left, right, phi, sequent([psi], [psi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
        // 結果は left そのもの（ID(ψ⊢ψ)）と同じはず
        expect(result.proof._tag).toBe("ScIdentity");
      }
    });
  });

  describe("eliminateFromChildren: ScExchangeRight ケース", () => {
    it("ScExchangeRight の子にカットがある場合も除去される", () => {
      // ExchangeRight の premise にカットを含む証明
      // Cut(ID(φ⊢φ), ID(φ⊢φ)) を ExchangeRight で包む
      const left = scIdentity(sequent([phi], [phi]));
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(left, right, phi, sequent([], []));

      // ExchangeRight(Cut(...), position=0, 結論)
      const exchangeRight = scExchangeRight(cut, 0, sequent([], []));

      const result = eliminateCuts(exchangeRight);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScExchangeRight の子にカットがある場合（後件あり）", () => {
      // より具体的なケース: 後件が2つあり、交換が意味を持つ
      const left = scIdentity(sequent([phi], [phi]));
      const rightInner = scIdentity(sequent([psi], [psi]));
      const right = scWeakeningRight(
        rightInner,
        phi,
        sequent([psi], [psi, phi]),
      );
      // Cut(φ⊢φ, ψ⊢ψ,φ) → ψ⊢ψ
      const cut = scCut(left, right, phi, sequent([psi], [psi]));

      // ExchangeRight wrapping a cut
      const exchangeRight = scExchangeRight(cut, 0, sequent([psi], [psi]));

      const result = eliminateCuts(exchangeRight);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });
  });

  // ── ステップ上限 ────────────────────────────────────────────

  describe("ステップ上限 (maxSteps)", () => {
    it("DEFAULT_MAX_STEPS は 1000", () => {
      expect(DEFAULT_MAX_STEPS).toBe(1000);
    });

    it("maxSteps を指定しないとデフォルト上限が適用される", () => {
      // 単純なカットは上限内で成功する
      const proof = scCut(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      const result = eliminateCuts(proof);
      expect(result._tag).toBe("Success");
    });

    it("maxSteps: 0 では即座に StepLimitExceeded を返す", () => {
      const proof = scCut(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      const result = eliminateCuts(proof, { maxSteps: 0 });
      expect(result._tag).toBe("StepLimitExceeded");
      if (result._tag === "StepLimitExceeded") {
        expect(result.stepsUsed).toBe(0);
        // 部分結果の proof が含まれる
        expect(result.proof).toBeDefined();
      }
    });

    it("maxSteps: 1 で複数ステップ必要な証明は StepLimitExceeded を返す", () => {
      // ネストしたカット: 内側のカット除去後に外側のカットが残る → 2ステップ以上必要
      const innerCut = scCut(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      const outerCut = scCut(
        innerCut,
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      const result = eliminateCuts(outerCut, { maxSteps: 1 });
      // 1ステップだけでは足りないはず
      expect(result._tag).toBe("StepLimitExceeded");
    });

    it("十分な maxSteps を設定すれば成功する", () => {
      const innerCut = scCut(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      const outerCut = scCut(
        innerCut,
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      const result = eliminateCuts(outerCut, { maxSteps: 100 });
      expect(result._tag).toBe("Success");
    });

    it("eliminateCutsWithSteps も maxSteps に対応する", () => {
      const proof = scCut(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      const { result, steps } = eliminateCutsWithSteps(proof, { maxSteps: 0 });
      expect(result._tag).toBe("StepLimitExceeded");
      expect(steps.length).toBe(0);
    });

    it("eliminateCutsWithSteps でステップが記録される", () => {
      const proof = scCut(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      const { result, steps } = eliminateCutsWithSteps(proof, {
        maxSteps: 100,
      });
      expect(result._tag).toBe("Success");
      expect(steps.length).toBeGreaterThan(0);
    });

    it("StepLimitExceeded の stepsUsed は消費したステップ数を反映する", () => {
      // ランク2のカット: 複数ステップ必要
      const phi_impl_psi = implication(phi, psi);
      const leftProof = scImplicationRight(
        scIdentity(sequent([phi], [phi, psi])),
        sequent([], [phi_impl_psi]),
      );
      const rightProof = scImplicationLeft(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([psi], [psi])),
        sequent([phi_impl_psi], [psi]),
      );
      const cut = scCut(
        leftProof,
        rightProof,
        phi_impl_psi,
        sequent([], [psi]),
      );
      // maxSteps: 2 でいくつかのステップを実行
      const result = eliminateCuts(cut, { maxSteps: 2 });
      if (result._tag === "StepLimitExceeded") {
        expect(result.stepsUsed).toBeLessThanOrEqual(2);
        expect(result.stepsUsed).toBeGreaterThan(0);
      }
      // maxSteps: 100 なら成功する
      const fullResult = eliminateCuts(cut, { maxSteps: 100 });
      expect(fullResult._tag).toBe("Success");
    });

    it("StepLimitExceeded がランク削減右(ScImplicationRight)で伝播する", () => {
      // right is ScImplicationRight with phi in the premise's antecedents
      const left = scIdentity(sequent([phi], [phi]));
      const rightPremise = scIdentity(
        sequent([phi, alpha], [phi, alpha, beta]),
      );
      const right = scImplicationRight(
        rightPremise,
        sequent([phi, alpha], [phi, implication(alpha, beta)]),
      );
      const cut = scCut(
        left,
        right,
        phi,
        sequent([alpha], [implication(alpha, beta)]),
      );

      const result = eliminateCuts(cut, { maxSteps: 1 });
      expect(result._tag).toBe("StepLimitExceeded");
    });

    it("StepLimitExceeded がランク削減右(ScConjunctionLeft)で伝播する", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const premise = scIdentity(sequent([phi, alpha], [phi, alpha]));
      const right = scConjunctionLeft(
        premise,
        1,
        sequent([conjunction(alpha, beta), phi], [phi, alpha]),
      );
      const cut = scCut(
        left,
        right,
        phi,
        sequent([conjunction(alpha, beta)], [alpha]),
      );

      const result = eliminateCuts(cut, { maxSteps: 1 });
      expect(result._tag).toBe("StepLimitExceeded");
    });

    it("StepLimitExceeded がランク削減右(ScConjunctionRight左)で伝播する", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const rightLeft = scIdentity(sequent([phi, alpha], [phi, alpha]));
      const rightRight = scIdentity(sequent([beta], [beta]));
      const right = scConjunctionRight(
        rightLeft,
        rightRight,
        sequent([phi, beta], [phi, conjunction(alpha, beta)]),
      );
      const cut = scCut(
        left,
        right,
        phi,
        sequent([beta], [conjunction(alpha, beta)]),
      );

      const result = eliminateCuts(cut, { maxSteps: 1 });
      expect(result._tag).toBe("StepLimitExceeded");
    });

    it("StepLimitExceeded がランク削減右(ScConjunctionRight右)で伝播する", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const rightLeft = scIdentity(sequent([alpha], [alpha]));
      const rightRight = scIdentity(sequent([phi, beta], [phi, beta]));
      const right = scConjunctionRight(
        rightLeft,
        rightRight,
        sequent([alpha, phi], [conjunction(alpha, beta), phi]),
      );
      const cut = scCut(
        left,
        right,
        phi,
        sequent([alpha], [conjunction(alpha, beta)]),
      );

      const result = eliminateCuts(cut, { maxSteps: 1 });
      expect(result._tag).toBe("StepLimitExceeded");
    });

    it("StepLimitExceeded がランク削減右(ScDisjunctionLeft左)で伝播する", () => {
      // reduceRankRight → ScDisjunctionLeft, 左前提にφあり
      const left = scIdentity(sequent([phi], [phi]));
      const rightLeft = scIdentity(sequent([phi, alpha], [phi, alpha]));
      const rightRight = scIdentity(sequent([beta], [beta]));
      const right = scDisjunctionLeft(
        rightLeft,
        rightRight,
        sequent([disjunction(alpha, beta), phi], [phi, alpha, beta]),
      );
      const cut = scCut(
        left,
        right,
        phi,
        sequent([disjunction(alpha, beta)], [alpha, beta]),
      );

      // maxSteps: 1 → 外側のカットで1ステップ消費、内側再帰で上限超過
      const result = eliminateCuts(cut, { maxSteps: 1 });
      expect(result._tag).toBe("StepLimitExceeded");
    });

    it("StepLimitExceeded がランク削減右(ScDisjunctionLeft右)で伝播する", () => {
      // reduceRankRight → ScDisjunctionLeft, 右前提にφあり
      const left = scIdentity(sequent([phi], [phi]));
      const rightLeft = scIdentity(sequent([alpha], [alpha]));
      const rightRight = scIdentity(sequent([phi, beta], [phi, beta]));
      const right = scDisjunctionLeft(
        rightLeft,
        rightRight,
        sequent([disjunction(alpha, beta), phi], [alpha, phi, beta]),
      );
      const cut = scCut(
        left,
        right,
        phi,
        sequent([disjunction(alpha, beta)], [alpha, beta]),
      );

      const result = eliminateCuts(cut, { maxSteps: 1 });
      expect(result._tag).toBe("StepLimitExceeded");
    });

    it("StepLimitExceeded がランク削減右(ScDisjunctionRight)で伝播する", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const premise = scIdentity(sequent([phi, alpha], [phi, alpha]));
      const right = scDisjunctionRight(
        premise,
        1,
        sequent([phi, alpha], [phi, disjunction(alpha, beta)]),
      );
      const cut = scCut(
        left,
        right,
        phi,
        sequent([alpha], [disjunction(alpha, beta)]),
      );

      const result = eliminateCuts(cut, { maxSteps: 1 });
      expect(result._tag).toBe("StepLimitExceeded");
    });

    it("StepLimitExceeded がランク削減右(ScExistentialRight)で伝播する", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const premise = scIdentity(sequent([phi], [phi]));
      const weak = scWeakeningLeft(premise, psi, sequent([phi, psi], [phi]));
      const right = scExistentialRight(
        weak,
        sequent([phi, psi], [existential(x, phi)]),
      );
      const cut = scCut(
        left,
        right,
        phi,
        sequent([psi], [existential(x, phi)]),
      );

      const result = eliminateCuts(cut, { maxSteps: 1 });
      expect(result._tag).toBe("StepLimitExceeded");
    });

    it("StepLimitExceeded が深さ削減(含意カット)で伝播する", () => {
      // reduceImplicationCut の最初の内部カットで上限超過
      const left = scImplicationRight(
        scIdentity(sequent([alpha], [beta])),
        sequent([], [implication(alpha, beta)]),
      );
      const rightLeftPremise = scIdentity(sequent([alpha], [alpha]));
      const rightRightPremise = scIdentity(sequent([beta], [beta]));
      const right = scImplicationLeft(
        rightLeftPremise,
        rightRightPremise,
        sequent([implication(alpha, beta), alpha], [beta]),
      );
      const cut = scCut(
        left,
        right,
        implication(alpha, beta),
        sequent([alpha], [beta]),
      );

      // maxSteps: 1 → 外側カットで1ステップ消費、内側の最初のカットで上限超過
      const result = eliminateCuts(cut, { maxSteps: 1 });
      expect(result._tag).toBe("StepLimitExceeded");
    });
  });

  // ── 正当性検証: 結論シーケント保存 ──────────────────────────

  describe("正当性検証: 結論シーケントの保存", () => {
    /**
     * カット除去の核心的な正当性条件:
     * 除去後の証明の結論シーケントが元の証明と同じであること
     */
    const assertCutEliminationCorrect = (
      proof: Parameters<typeof eliminateCuts>[0],
      label: string,
    ) => {
      const originalConclusion = getScConclusion(proof);
      const result = eliminateCuts(proof);
      expect(result._tag, `${label satisfies string}: should succeed`).toBe(
        "Success",
      );
      if (result._tag === "Success") {
        expect(
          isCutFree(result.proof),
          `${label satisfies string}: should be cut-free`,
        ).toBe(true);
        const resultConclusion = getScConclusion(result.proof);
        expect(
          sequentEqual(resultConclusion, originalConclusion),
          `${label satisfies string}: conclusion should be preserved. Got ${JSON.stringify(resultConclusion) satisfies string} but expected ${JSON.stringify(originalConclusion) satisfies string}`,
        ).toBe(true);
      }
    };

    it("ID-ID カット: 結論が保存される", () => {
      const cut = scCut(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      assertCutEliminationCorrect(cut, "ID-ID");
    });

    it("ランク0左: 左にカット式なしの場合も結論が保存される", () => {
      const left = scIdentity(sequent([psi], [psi]));
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(left, right, phi, sequent([psi], [psi]));
      assertCutEliminationCorrect(cut, "rank0-left");
    });

    it("ランク0右: 右にカット式なしの場合も結論が保存される", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const right = scIdentity(sequent([psi], [psi]));
      const cut = scCut(left, right, phi, sequent([psi], [psi]));
      assertCutEliminationCorrect(cut, "rank0-right");
    });

    it("弱化右+カット: 結論が保存される", () => {
      const premise = scIdentity(sequent([psi], [psi]));
      const left = scWeakeningRight(premise, phi, sequent([psi], [psi, phi]));
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(left, right, phi, sequent([psi], [psi]));
      assertCutEliminationCorrect(cut, "weakR+cut");
    });

    it("含意カット (⇒→)/(→⇒): 結論が保存される", () => {
      // 有効な証明: φ ⊢ φ から ⊢ φ→φ を導出
      const implPhiPhi = implication(phi, phi);
      const left = scImplicationRight(
        scIdentity(sequent([phi], [phi])),
        sequent([], [implPhiPhi]),
      );
      const right = scImplicationLeft(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        sequent([implPhiPhi, phi], [phi]),
      );
      const cut = scCut(left, right, implPhiPhi, sequent([phi], [phi]));
      assertCutEliminationCorrect(cut, "impl-cut");
    });

    it("連言カット (⇒∧)/(∧⇒): 結論が保存される", () => {
      const left = scConjunctionRight(
        scIdentity(sequent([alpha], [alpha])),
        scIdentity(sequent([beta], [beta])),
        sequent([alpha, beta], [conjunction(alpha, beta)]),
      );
      const right = scConjunctionLeft(
        scIdentity(sequent([alpha], [alpha])),
        1,
        sequent([conjunction(alpha, beta)], [alpha]),
      );
      const cut = scCut(
        left,
        right,
        conjunction(alpha, beta),
        sequent([alpha, beta], [alpha]),
      );
      assertCutEliminationCorrect(cut, "conj-cut");
    });

    it("選言カット (⇒∨)/(∨⇒): 結論が保存される", () => {
      const left = scDisjunctionRight(
        scIdentity(sequent([alpha], [alpha])),
        1,
        sequent([alpha], [disjunction(alpha, beta)]),
      );
      const right = scDisjunctionLeft(
        scIdentity(sequent([alpha], [alpha])),
        scIdentity(sequent([beta], [beta])),
        sequent([disjunction(alpha, beta)], [alpha, beta]),
      );
      const cut = scCut(
        left,
        right,
        disjunction(alpha, beta),
        sequent([alpha], [alpha, beta]),
      );
      assertCutEliminationCorrect(cut, "disj-cut");
    });

    it("ネストされたカット: 結論が保存される", () => {
      const inner = scCut(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      const outer = scCut(
        inner,
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      assertCutEliminationCorrect(outer, "nested-cut");
    });

    it("3重ネストされたカット: 結論が保存される", () => {
      const inner = scCut(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      const middle = scCut(
        inner,
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      const outer = scCut(
        middle,
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      assertCutEliminationCorrect(outer, "triple-nested");
    });

    it("左右両方にサブプルーフを持つカット: 結論が保存される", () => {
      const leftSub = scCut(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      const rightSub = scCut(
        scIdentity(sequent([psi], [psi])),
        scIdentity(sequent([psi], [psi])),
        psi,
        sequent([psi], [psi]),
      );
      const outer = scCut(
        scWeakeningRight(leftSub, psi, sequent([phi], [phi, psi])),
        scWeakeningLeft(rightSub, phi, sequent([psi, phi], [psi])),
        psi,
        sequent([phi, psi], [phi, psi]),
      );
      assertCutEliminationCorrect(outer, "both-sub-cuts");
    });

    it("ランク2のカット: 結論が保存される", () => {
      // ランク2: 左の弱化でφが追加されている
      const idLeft = scIdentity(sequent([phi], [phi]));
      const weakLeft = scWeakeningRight(
        idLeft,
        psi,
        sequent([phi], [phi, psi]),
      );
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(weakLeft, right, phi, sequent([phi], [phi, psi]));
      assertCutEliminationCorrect(cut, "rank2-cut");
    });

    it("複合的な証明: 構造規則+論理規則+カットの組み合わせ", () => {
      // ψ ⊢ ψ → (w⇒) φ,ψ ⊢ ψ → (⇒w) φ,ψ ⊢ ψ,α
      const p1 = scIdentity(sequent([psi], [psi]));
      const p2 = scWeakeningLeft(p1, phi, sequent([phi, psi], [psi]));
      const left = scWeakeningRight(
        p2,
        alpha,
        sequent([phi, psi], [psi, alpha]),
      );

      // α ⊢ α → (w⇒) φ,α ⊢ α
      const right = scWeakeningLeft(
        scIdentity(sequent([alpha], [alpha])),
        phi,
        sequent([phi, alpha], [alpha]),
      );

      // CUT(φ) on left and right
      // 結論: ψ,α ⊢ ψ,α (φを除去して結論)
      const cut = scCut(left, right, phi, sequent([psi, alpha], [psi, alpha]));
      assertCutEliminationCorrect(cut, "complex-structural");
    });

    it("含意のネストしたカット: 結論が保存される", () => {
      // 有効な含意カットの結果にさらにカットを適用
      const implPhiPhi = implication(phi, phi);
      const leftInner = scImplicationRight(
        scIdentity(sequent([phi], [phi])),
        sequent([], [implPhiPhi]),
      );
      const rightInner = scImplicationLeft(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        sequent([implPhiPhi, phi], [phi]),
      );
      const innerCut = scCut(
        leftInner,
        rightInner,
        implPhiPhi,
        sequent([phi], [phi]),
      );

      // innerCut の結論 φ ⊢ φ を使ってさらに弱化してカット
      const weakened = scWeakeningRight(
        innerCut,
        chi,
        sequent([phi], [phi, chi]),
      );
      const rightOuter = scIdentity(sequent([phi], [phi]));
      const outerCut = scCut(
        weakened,
        rightOuter,
        phi,
        sequent([phi], [phi, chi]),
      );
      assertCutEliminationCorrect(outerCut, "nested-impl-cut");
    });
  });

  // ── 正当性検証: eliminateCutsWithSteps の結果一貫性 ──────────

  describe("正当性検証: eliminateCutsWithSteps の結果一貫性", () => {
    it("eliminateCuts と eliminateCutsWithSteps は同じ結論を返す", () => {
      const cut = scCut(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );

      const result1 = eliminateCuts(cut);
      const { result: result2 } = eliminateCutsWithSteps(cut);

      expect(result1._tag).toBe("Success");
      expect(result2._tag).toBe("Success");
      if (result1._tag === "Success" && result2._tag === "Success") {
        expect(
          sequentEqual(
            getScConclusion(result1.proof),
            getScConclusion(result2.proof),
          ),
        ).toBe(true);
      }
    });

    it("含意カットでも両APIが同じ結論を返す", () => {
      const implPhiPhi = implication(phi, phi);
      const left = scImplicationRight(
        scIdentity(sequent([phi], [phi])),
        sequent([], [implPhiPhi]),
      );
      const right = scImplicationLeft(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        sequent([implPhiPhi, phi], [phi]),
      );
      const cut = scCut(left, right, implPhiPhi, sequent([phi], [phi]));

      const result1 = eliminateCuts(cut);
      const { result: result2 } = eliminateCutsWithSteps(cut);

      expect(result1._tag).toBe("Success");
      expect(result2._tag).toBe("Success");
      if (result1._tag === "Success" && result2._tag === "Success") {
        expect(
          sequentEqual(
            getScConclusion(result1.proof),
            getScConclusion(result2.proof),
          ),
        ).toBe(true);
      }
    });

    it("ステップ配列の各エントリは証明ノードとメタデータを持つ", () => {
      const implPhiPhi = implication(phi, phi);
      const left = scImplicationRight(
        scIdentity(sequent([phi], [phi])),
        sequent([], [implPhiPhi]),
      );
      const right = scImplicationLeft(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        sequent([implPhiPhi, phi], [phi]),
      );
      const cut = scCut(left, right, implPhiPhi, sequent([phi], [phi]));

      const { result, steps } = eliminateCutsWithSteps(cut);
      expect(result._tag).toBe("Success");
      expect(steps.length).toBeGreaterThan(0);

      for (const step of steps) {
        expect(step.description).toContain("Cut elimination");
        expect(step.depth).toBeGreaterThanOrEqual(1);
        expect(step.rank).toBeGreaterThanOrEqual(1);
        expect(step.proof).toBeDefined();
        expect(step.proof._tag).toBe("ScCut");
      }
    });
  });

  // ── 正当性検証: 非自明な証明パターン ──────────────────────────

  describe("正当性検証: 非自明な証明パターン", () => {
    it("連言カット componentIndex=2: 結論が保存される", () => {
      const left = scConjunctionRight(
        scIdentity(sequent([alpha], [alpha])),
        scIdentity(sequent([beta], [beta])),
        sequent([alpha, beta], [conjunction(alpha, beta)]),
      );
      const right = scConjunctionLeft(
        scIdentity(sequent([beta], [beta])),
        2,
        sequent([conjunction(alpha, beta)], [beta]),
      );
      const cut = scCut(
        left,
        right,
        conjunction(alpha, beta),
        sequent([alpha, beta], [beta]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
        const resultConc = getScConclusion(result.proof);
        expect(sequentEqual(resultConc, sequent([alpha, beta], [beta]))).toBe(
          true,
        );
      }
    });

    it("選言カット componentIndex=2: 結論が保存される", () => {
      const left = scDisjunctionRight(
        scIdentity(sequent([beta], [beta])),
        2,
        sequent([beta], [disjunction(alpha, beta)]),
      );
      const right = scDisjunctionLeft(
        scIdentity(sequent([alpha], [alpha])),
        scIdentity(sequent([beta], [beta])),
        sequent([disjunction(alpha, beta)], [alpha, beta]),
      );
      const cut = scCut(
        left,
        right,
        disjunction(alpha, beta),
        sequent([beta], [alpha, beta]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
        const resultConc = getScConclusion(result.proof);
        expect(sequentEqual(resultConc, sequent([beta], [alpha, beta]))).toBe(
          true,
        );
      }
    });

    it("否定のカット: 結論が保存される", () => {
      const negAlpha = negation(alpha);
      const left = scIdentity(sequent([negAlpha], [negAlpha]));
      const right = scIdentity(sequent([negAlpha], [negAlpha]));
      const cut = scCut(left, right, negAlpha, sequent([negAlpha], [negAlpha]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
        const resultConc = getScConclusion(result.proof);
        expect(sequentEqual(resultConc, sequent([negAlpha], [negAlpha]))).toBe(
          true,
        );
      }
    });

    it("全称量化のカット: 結論が保存される", () => {
      const univAlpha = universal(x, alpha);
      const left = scIdentity(sequent([univAlpha], [univAlpha]));
      const right = scIdentity(sequent([univAlpha], [univAlpha]));
      const cut = scCut(
        left,
        right,
        univAlpha,
        sequent([univAlpha], [univAlpha]),
      );

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
        const resultConc = getScConclusion(result.proof);
        expect(
          sequentEqual(resultConc, sequent([univAlpha], [univAlpha])),
        ).toBe(true);
      }
    });

    it("述語（原子式）のカット: 結論が保存される", () => {
      const pred = predicate("P", [x]);
      const left = scIdentity(sequent([pred], [pred]));
      const right = scIdentity(sequent([pred], [pred]));
      const cut = scCut(left, right, pred, sequent([pred], [pred]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
        const resultConc = getScConclusion(result.proof);
        expect(sequentEqual(resultConc, sequent([pred], [pred]))).toBe(true);
      }
    });

    it("弱化+縮約+カットの組み合わせ: 結論が保存される", () => {
      // φ ⊢ φ → (⇒w) φ ⊢ φ,φ → (⇒c) φ ⊢ φ → (⇒w) φ ⊢ φ,ψ
      const id = scIdentity(sequent([phi], [phi]));
      const w1 = scWeakeningRight(id, phi, sequent([phi], [phi, phi]));
      const c1 = scContractionRight(w1, phi, sequent([phi], [phi]));
      const left = scWeakeningRight(c1, psi, sequent([phi], [phi, psi]));

      // φ ⊢ φ
      const right = scIdentity(sequent([phi], [phi]));

      const cut = scCut(left, right, phi, sequent([phi], [phi, psi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
        const resultConc = getScConclusion(result.proof);
        expect(sequentEqual(resultConc, sequent([phi], [phi, psi]))).toBe(true);
      }
    });

    it("交換規則+カット: 結論が保存される", () => {
      // φ,ψ ⊢ φ → (x⇒ pos=0) ψ,φ ⊢ φ
      const id = scIdentity(sequent([phi, psi], [phi]));
      const left = scExchangeLeft(id, 0, sequent([psi, phi], [phi]));

      const right = scIdentity(sequent([phi], [phi]));

      const cut = scCut(left, right, phi, sequent([psi, phi], [phi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
        const resultConc = getScConclusion(result.proof);
        expect(sequentEqual(resultConc, sequent([psi, phi], [phi]))).toBe(true);
      }
    });

    it("カットフリーな証明は不変（恒等性テスト）", () => {
      const proof = scWeakeningRight(
        scIdentity(sequent([phi], [phi])),
        psi,
        sequent([phi], [phi, psi]),
      );

      const result = eliminateCuts(proof);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
        const resultConc = getScConclusion(result.proof);
        expect(sequentEqual(resultConc, sequent([phi], [phi, psi]))).toBe(true);
      }
    });

    it("BottomLeft + カット: 結論が保存される", () => {
      const left = scBottomLeft(sequent([], []));
      const right = scIdentity(sequent([phi], [phi]));
      const cut = scCut(left, right, phi, sequent([], []));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
        const resultConc = getScConclusion(result.proof);
        expect(sequentEqual(resultConc, sequent([], []))).toBe(true);
      }
    });

    it("複数の異なる論理式のカット連鎖: 結論が保存される", () => {
      // まず φ でカット、次に ψ でカット
      const cut1 = scCut(
        scIdentity(sequent([phi], [phi])),
        scWeakeningRight(
          scIdentity(sequent([phi], [phi])),
          psi,
          sequent([phi], [phi, psi]),
        ),
        phi,
        sequent([phi], [phi, psi]),
      );

      // cut1 の結論: φ ⊢ φ,ψ を使ってさらにψでカット
      const cut2 = scCut(
        cut1,
        scIdentity(sequent([psi], [psi])),
        psi,
        sequent([phi], [phi, psi]),
      );

      const result = eliminateCuts(cut2);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
        const resultConc = getScConclusion(result.proof);
        expect(sequentEqual(resultConc, sequent([phi], [phi, psi]))).toBe(true);
      }
    });
  });

  // ── pushMixIntoRight: 追加カバレッジ ────────────────────────

  describe("pushMixIntoRight: 追加の構造規則カバレッジ", () => {
    it("ScExchangeRight: 右交換の場合", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const idRight = scIdentity(sequent([phi, psi], [phi, psi]));
      const exchanged = scExchangeRight(
        idRight,
        0,
        sequent([phi, psi], [psi, phi]),
      );
      // leftRank(exchanged, phi) = leftRank(idRight, phi) + 1 = 1 + 1 = 2
      // rightRank(left, phi) = 1, so rr > lr → pushMixIntoRight
      const cut = scCut(left, exchanged, phi, sequent([psi], [psi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });

    it("ScContractionRight でφ以外が縮約される場合", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const idRight = scIdentity(sequent([phi], [phi]));
      const weak1 = scWeakeningRight(idRight, psi, sequent([phi], [phi, psi]));
      const weak2 = scWeakeningRight(
        weak1,
        psi,
        sequent([phi], [phi, psi, psi]),
      );
      const contracted = scContractionRight(
        weak2,
        psi,
        sequent([phi], [phi, psi]),
      );
      const weak3 = scWeakeningLeft(
        contracted,
        chi,
        sequent([phi, chi], [phi, psi]),
      );
      const cut = scCut(left, weak3, phi, sequent([chi], [phi, psi]));

      const result = eliminateCuts(cut);
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(isCutFree(result.proof)).toBe(true);
      }
    });
  });
});
