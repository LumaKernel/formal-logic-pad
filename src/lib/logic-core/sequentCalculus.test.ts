import { describe, it, expect } from "vitest";
import {
  type Sequent,
  sequent,
  scIdentity,
  scBottomLeft,
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
  scUniversalRight,
  scExistentialLeft,
  scExistentialRight,
  scNegationLeft,
  scNegationRight,
  getScConclusion,
  countScNodes,
  scProofDepth,
  validateScProof,
} from "./sequentCalculus";
import { MetaVariable, Implication } from "./formula";

// ── テスト用ヘルパー ────────────────────────────────────────

const phi = new MetaVariable({ name: "φ" });
const psi = new MetaVariable({ name: "ψ" });
const chi = new MetaVariable({ name: "χ" });
const phiImpliesPsi = new Implication({ left: phi, right: psi });

const idSequent: Sequent = sequent([phi], [phi]);
const bottomSequent: Sequent = sequent([], []);

// ── sequent ファクトリ関数 ───────────────────────────────────

describe("sequent", () => {
  it("空のシーケントを作成できる", () => {
    const s = sequent([], []);
    expect(s.antecedents).toEqual([]);
    expect(s.succedents).toEqual([]);
  });

  it("左辺のみのシーケントを作成できる", () => {
    const s = sequent([phi, psi], []);
    expect(s.antecedents).toHaveLength(2);
    expect(s.succedents).toHaveLength(0);
  });

  it("両辺のシーケントを作成できる", () => {
    const s = sequent([phi], [psi, chi]);
    expect(s.antecedents).toHaveLength(1);
    expect(s.succedents).toHaveLength(2);
  });
});

// ── 公理ノード ──────────────────────────────────────────────

describe("ScIdentity (ID)", () => {
  it("公理ノードを作成できる", () => {
    const node = scIdentity(idSequent);
    expect(node._tag).toBe("ScIdentity");
    expect(node.conclusion).toBe(idSequent);
  });

  it("getScConclusion で結論を取得できる", () => {
    const node = scIdentity(idSequent);
    expect(getScConclusion(node)).toBe(idSequent);
  });

  it("countScNodes は1を返す", () => {
    const node = scIdentity(idSequent);
    expect(countScNodes(node)).toBe(1);
  });

  it("scProofDepth は0を返す", () => {
    const node = scIdentity(idSequent);
    expect(scProofDepth(node)).toBe(0);
  });

  it("正しい形のIDはバリデーション通過", () => {
    const node = scIdentity(idSequent);
    const result = validateScProof(node);
    expect(result._tag).toBe("Valid");
  });

  it("左辺が複数のIDはバリデーションエラー", () => {
    const badSequent = sequent([phi, psi], [phi]);
    const node = scIdentity(badSequent);
    const result = validateScProof(node);
    expect(result._tag).toBe("Invalid");
    if (result._tag === "Invalid") {
      expect(result.errors[0]._tag).toBe("IdentityNotSingle");
    }
  });

  it("右辺が空のIDはバリデーションエラー", () => {
    const badSequent = sequent([phi], []);
    const node = scIdentity(badSequent);
    const result = validateScProof(node);
    expect(result._tag).toBe("Invalid");
  });
});

describe("ScBottomLeft (⊥⇒)", () => {
  it("⊥公理ノードを作成できる", () => {
    const node = scBottomLeft(bottomSequent);
    expect(node._tag).toBe("ScBottomLeft");
  });

  it("countScNodes は1を返す", () => {
    const node = scBottomLeft(bottomSequent);
    expect(countScNodes(node)).toBe(1);
  });

  it("scProofDepth は0を返す", () => {
    const node = scBottomLeft(bottomSequent);
    expect(scProofDepth(node)).toBe(0);
  });

  it("バリデーションは構造的に通過", () => {
    const node = scBottomLeft(bottomSequent);
    const result = validateScProof(node);
    expect(result._tag).toBe("Valid");
  });
});

// ── 構造規則ノード ──────────────────────────────────────────

describe("ScCut", () => {
  it("カット規則ノードを作成できる", () => {
    const left = scIdentity(sequent([phi], [phi]));
    const right = scIdentity(sequent([phi], [phi]));
    const conclusion = sequent([], []);
    const node = scCut(left, right, phi, conclusion);
    expect(node._tag).toBe("ScCut");
    expect(node.cutFormula).toBe(phi);
  });

  it("countScNodes は子ノードを含む", () => {
    const left = scIdentity(idSequent);
    const right = scIdentity(idSequent);
    const node = scCut(left, right, phi, sequent([], []));
    expect(countScNodes(node)).toBe(3);
  });

  it("scProofDepth は子の深さ+1", () => {
    const left = scIdentity(idSequent);
    const right = scIdentity(idSequent);
    const node = scCut(left, right, phi, sequent([], []));
    expect(scProofDepth(node)).toBe(1);
  });
});

describe("ScWeakeningLeft (w⇒)", () => {
  it("左弱化ノードを作成できる", () => {
    const premise = scIdentity(idSequent);
    const conclusion = sequent([psi, phi], [phi]);
    const node = scWeakeningLeft(premise, psi, conclusion);
    expect(node._tag).toBe("ScWeakeningLeft");
    expect(node.weakenedFormula).toBe(psi);
  });

  it("countScNodes は前提+1", () => {
    const premise = scIdentity(idSequent);
    const node = scWeakeningLeft(premise, psi, sequent([psi, phi], [phi]));
    expect(countScNodes(node)).toBe(2);
  });
});

describe("ScWeakeningRight (⇒w)", () => {
  it("右弱化ノードを作成できる", () => {
    const premise = scIdentity(idSequent);
    const conclusion = sequent([phi], [phi, psi]);
    const node = scWeakeningRight(premise, psi, conclusion);
    expect(node._tag).toBe("ScWeakeningRight");
    expect(node.weakenedFormula).toBe(psi);
  });
});

describe("ScContractionLeft (c⇒)", () => {
  it("左縮約ノードを作成できる", () => {
    const premise = scIdentity(sequent([phi, phi], [phi]));
    const conclusion = sequent([phi], [phi]);
    const node = scContractionLeft(premise, phi, conclusion);
    expect(node._tag).toBe("ScContractionLeft");
    expect(node.contractedFormula).toBe(phi);
  });
});

describe("ScContractionRight (⇒c)", () => {
  it("右縮約ノードを作成できる", () => {
    const premise = scIdentity(sequent([phi], [phi, phi]));
    const conclusion = sequent([phi], [phi]);
    const node = scContractionRight(premise, phi, conclusion);
    expect(node._tag).toBe("ScContractionRight");
    expect(node.contractedFormula).toBe(phi);
  });
});

describe("ScExchangeLeft (e⇒)", () => {
  it("左交換ノードを作成できる", () => {
    const premise = scIdentity(sequent([phi, psi], [chi]));
    const conclusion = sequent([psi, phi], [chi]);
    const node = scExchangeLeft(premise, 0, conclusion);
    expect(node._tag).toBe("ScExchangeLeft");
    expect(node.position).toBe(0);
  });
});

describe("ScExchangeRight (⇒e)", () => {
  it("右交換ノードを作成できる", () => {
    const premise = scIdentity(sequent([chi], [phi, psi]));
    const conclusion = sequent([chi], [psi, phi]);
    const node = scExchangeRight(premise, 0, conclusion);
    expect(node._tag).toBe("ScExchangeRight");
    expect(node.position).toBe(0);
  });
});

// ── 論理規則ノード ──────────────────────────────────────────

describe("ScImplicationLeft (→⇒)", () => {
  it("左→規則ノードを作成できる", () => {
    const left = scIdentity(sequent([phi], [phi]));
    const right = scIdentity(sequent([psi], [psi]));
    const conclusion = sequent([phiImpliesPsi], []);
    const node = scImplicationLeft(left, right, conclusion);
    expect(node._tag).toBe("ScImplicationLeft");
    expect(countScNodes(node)).toBe(3);
    expect(scProofDepth(node)).toBe(1);
  });
});

describe("ScImplicationRight (⇒→)", () => {
  it("右→規則ノードを作成できる", () => {
    const premise = scIdentity(sequent([phi], [psi]));
    const conclusion = sequent([], [phiImpliesPsi]);
    const node = scImplicationRight(premise, conclusion);
    expect(node._tag).toBe("ScImplicationRight");
    expect(countScNodes(node)).toBe(2);
    expect(scProofDepth(node)).toBe(1);
  });
});

describe("ScConjunctionLeft (∧⇒)", () => {
  it("左∧規則ノードを作成できる（成分1）", () => {
    const premise = scIdentity(sequent([phi], [phi]));
    const conclusion = sequent([phi], [phi]);
    const node = scConjunctionLeft(premise, 1, conclusion);
    expect(node._tag).toBe("ScConjunctionLeft");
    expect(node.componentIndex).toBe(1);
    expect(countScNodes(node)).toBe(2);
  });

  it("左∧規則ノードを作成できる（成分2）", () => {
    const premise = scIdentity(sequent([psi], [psi]));
    const conclusion = sequent([psi], [psi]);
    const node = scConjunctionLeft(premise, 2, conclusion);
    expect(node.componentIndex).toBe(2);
  });

  it("scProofDepth は前提+1", () => {
    const premise = scIdentity(sequent([phi], [phi]));
    const node = scConjunctionLeft(premise, 1, sequent([phi], [phi]));
    expect(scProofDepth(node)).toBe(1);
  });
});

describe("ScConjunctionRight (⇒∧)", () => {
  it("右∧規則ノードを作成できる", () => {
    const left = scIdentity(sequent([phi], [phi]));
    const right = scIdentity(sequent([psi], [psi]));
    const conclusion = sequent([], []);
    const node = scConjunctionRight(left, right, conclusion);
    expect(node._tag).toBe("ScConjunctionRight");
    expect(countScNodes(node)).toBe(3);
    expect(scProofDepth(node)).toBe(1);
  });
});

describe("ScDisjunctionLeft (∨⇒)", () => {
  it("左∨規則ノードを作成できる", () => {
    const left = scIdentity(sequent([phi], [phi]));
    const right = scIdentity(sequent([psi], [psi]));
    const conclusion = sequent([], []);
    const node = scDisjunctionLeft(left, right, conclusion);
    expect(node._tag).toBe("ScDisjunctionLeft");
    expect(countScNodes(node)).toBe(3);
    expect(scProofDepth(node)).toBe(1);
  });
});

describe("ScDisjunctionRight (⇒∨)", () => {
  it("右∨規則ノードを作成できる（成分1）", () => {
    const premise = scIdentity(sequent([phi], [phi]));
    const conclusion = sequent([phi], [phi]);
    const node = scDisjunctionRight(premise, 1, conclusion);
    expect(node._tag).toBe("ScDisjunctionRight");
    expect(node.componentIndex).toBe(1);
  });

  it("右∨規則ノードを作成できる（成分2）", () => {
    const premise = scIdentity(sequent([psi], [psi]));
    const conclusion = sequent([psi], [psi]);
    const node = scDisjunctionRight(premise, 2, conclusion);
    expect(node.componentIndex).toBe(2);
  });

  it("countScNodes は前提+1", () => {
    const premise = scIdentity(sequent([phi], [phi]));
    const node = scDisjunctionRight(premise, 1, sequent([phi], [phi]));
    expect(countScNodes(node)).toBe(2);
  });

  it("scProofDepth は前提+1", () => {
    const premise = scIdentity(sequent([phi], [phi]));
    const node = scDisjunctionRight(premise, 1, sequent([phi], [phi]));
    expect(scProofDepth(node)).toBe(1);
  });
});

describe("ScUniversalLeft (∀⇒)", () => {
  it("左∀規則ノードを作成できる", () => {
    const premise = scIdentity(idSequent);
    const node = scUniversalLeft(premise, idSequent);
    expect(node._tag).toBe("ScUniversalLeft");
    expect(countScNodes(node)).toBe(2);
    expect(scProofDepth(node)).toBe(1);
  });
});

describe("ScUniversalRight (⇒∀)", () => {
  it("右∀規則ノードを作成できる", () => {
    const premise = scIdentity(idSequent);
    const node = scUniversalRight(premise, idSequent);
    expect(node._tag).toBe("ScUniversalRight");
    expect(countScNodes(node)).toBe(2);
  });
});

describe("ScExistentialLeft (∃⇒)", () => {
  it("左∃規則ノードを作成できる", () => {
    const premise = scIdentity(idSequent);
    const node = scExistentialLeft(premise, idSequent);
    expect(node._tag).toBe("ScExistentialLeft");
    expect(countScNodes(node)).toBe(2);
  });
});

describe("ScExistentialRight (⇒∃)", () => {
  it("右∃規則ノードを作成できる", () => {
    const premise = scIdentity(idSequent);
    const node = scExistentialRight(premise, idSequent);
    expect(node._tag).toBe("ScExistentialRight");
    expect(countScNodes(node)).toBe(2);
  });
});

describe("ScNegationLeft (¬⇒)", () => {
  it("左¬規則ノードを作成できる", () => {
    const premise = scIdentity(idSequent);
    const node = scNegationLeft(premise, idSequent);
    expect(node._tag).toBe("ScNegationLeft");
    expect(countScNodes(node)).toBe(2);
    expect(scProofDepth(node)).toBe(1);
  });
});

describe("ScNegationRight (⇒¬)", () => {
  it("右¬規則ノードを作成できる", () => {
    const premise = scIdentity(idSequent);
    const node = scNegationRight(premise, idSequent);
    expect(node._tag).toBe("ScNegationRight");
    expect(countScNodes(node)).toBe(2);
    expect(scProofDepth(node)).toBe(1);
  });
});

// ── 複合的な証明図 ──────────────────────────────────────────

describe("複合証明図", () => {
  it("φ ⇒ φ の証明（ID）", () => {
    const proof = scIdentity(sequent([phi], [phi]));
    expect(countScNodes(proof)).toBe(1);
    expect(scProofDepth(proof)).toBe(0);
    expect(validateScProof(proof)._tag).toBe("Valid");
  });

  it("例10.6: φ,Γ ⇒ φ の証明（w⇒ + e⇒ + c⇒ による構造規則の組合せ）", () => {
    // (ID) φ ⇒ φ → (w⇒) φ,φ ⇒ φ → (c⇒) φ ⇒ φ (実質的にID)
    const id = scIdentity(sequent([phi], [phi]));
    const weakened = scWeakeningLeft(id, phi, sequent([phi, phi], [phi]));
    const contracted = scContractionLeft(weakened, phi, sequent([phi], [phi]));
    expect(countScNodes(contracted)).toBe(3);
    expect(scProofDepth(contracted)).toBe(2);
    expect(validateScProof(contracted)._tag).toBe("Valid");
  });

  it("CUTを使った証明", () => {
    // (ID) φ ⇒ φ   (ID) φ ⇒ φ → (CUT) ⇒ φ...（概念的）
    const left = scIdentity(sequent([phi], [phi]));
    const right = scIdentity(sequent([phi], [phi]));
    const cutNode = scCut(left, right, phi, sequent([], [phi]));
    expect(countScNodes(cutNode)).toBe(3);
    expect(scProofDepth(cutNode)).toBe(1);
    expect(validateScProof(cutNode)._tag).toBe("Valid");
  });

  it("深さ3の証明図", () => {
    const id = scIdentity(idSequent);
    const w1 = scWeakeningLeft(id, psi, sequent([psi, phi], [phi]));
    const e1 = scExchangeLeft(w1, 0, sequent([phi, psi], [phi]));
    const c1 = scContractionLeft(e1, phi, sequent([phi], [phi]));
    expect(scProofDepth(c1)).toBe(3);
    expect(countScNodes(c1)).toBe(4);
    expect(validateScProof(c1)._tag).toBe("Valid");
  });
});

// ── バリデーション ──────────────────────────────────────────

describe("validateScProof", () => {
  it("正しい証明はValidを返す", () => {
    const proof = scIdentity(idSequent);
    expect(validateScProof(proof)._tag).toBe("Valid");
  });

  it("不正なID（左辺0個）はエラーを返す", () => {
    const proof = scIdentity(sequent([], [phi]));
    const result = validateScProof(proof);
    expect(result._tag).toBe("Invalid");
  });

  it("不正なID（右辺2個）はエラーを返す", () => {
    const proof = scIdentity(sequent([phi], [phi, psi]));
    const result = validateScProof(proof);
    expect(result._tag).toBe("Invalid");
  });

  it("ネストされた証明図の子もバリデーションされる", () => {
    const badId = scIdentity(sequent([], [])); // 不正なID
    const weakened = scWeakeningLeft(badId, phi, sequent([phi], []));
    const result = validateScProof(weakened);
    expect(result._tag).toBe("Invalid");
  });

  it("CUTの両方の子がバリデーションされる", () => {
    const badLeft = scIdentity(sequent([], [])); // 不正
    const goodRight = scIdentity(idSequent);
    const node = scCut(badLeft, goodRight, phi, sequent([], [phi]));
    const result = validateScProof(node);
    expect(result._tag).toBe("Invalid");
  });

  it("右∧の両方の子がバリデーションされる", () => {
    const badLeft = scIdentity(sequent([], []));
    const goodRight = scIdentity(idSequent);
    const node = scConjunctionRight(badLeft, goodRight, sequent([], []));
    const result = validateScProof(node);
    expect(result._tag).toBe("Invalid");
  });

  it("左∨の両方の子がバリデーションされる", () => {
    const goodLeft = scIdentity(idSequent);
    const badRight = scIdentity(sequent([], []));
    const node = scDisjunctionLeft(goodLeft, badRight, sequent([], []));
    const result = validateScProof(node);
    expect(result._tag).toBe("Invalid");
  });

  it("左→の両方の子がバリデーションされる", () => {
    const goodLeft = scIdentity(idSequent);
    const badRight = scIdentity(sequent([], []));
    const node = scImplicationLeft(goodLeft, badRight, sequent([], []));
    const result = validateScProof(node);
    expect(result._tag).toBe("Invalid");
  });

  it("右→の前提がバリデーションされる", () => {
    const badPremise = scIdentity(sequent([], []));
    const node = scImplicationRight(badPremise, sequent([], [phiImpliesPsi]));
    const result = validateScProof(node);
    expect(result._tag).toBe("Invalid");
  });

  it("左∧の前提がバリデーションされる", () => {
    const badPremise = scIdentity(sequent([], []));
    const node = scConjunctionLeft(badPremise, 1, sequent([], []));
    const result = validateScProof(node);
    expect(result._tag).toBe("Invalid");
  });

  it("右∨の前提がバリデーションされる", () => {
    const badPremise = scIdentity(sequent([], []));
    const node = scDisjunctionRight(badPremise, 1, sequent([], []));
    const result = validateScProof(node);
    expect(result._tag).toBe("Invalid");
  });

  it("左∀の前提がバリデーションされる", () => {
    const badPremise = scIdentity(sequent([], []));
    const node = scUniversalLeft(badPremise, sequent([], []));
    const result = validateScProof(node);
    expect(result._tag).toBe("Invalid");
  });

  it("右∀の前提がバリデーションされる", () => {
    const badPremise = scIdentity(sequent([], []));
    const node = scUniversalRight(badPremise, sequent([], []));
    const result = validateScProof(node);
    expect(result._tag).toBe("Invalid");
  });

  it("左∃の前提がバリデーションされる", () => {
    const badPremise = scIdentity(sequent([], []));
    const node = scExistentialLeft(badPremise, sequent([], []));
    const result = validateScProof(node);
    expect(result._tag).toBe("Invalid");
  });

  it("右∃の前提がバリデーションされる", () => {
    const badPremise = scIdentity(sequent([], []));
    const node = scExistentialRight(badPremise, sequent([], []));
    const result = validateScProof(node);
    expect(result._tag).toBe("Invalid");
  });

  it("左¬の前提がバリデーションされる", () => {
    const badPremise = scIdentity(sequent([], []));
    const node = scNegationLeft(badPremise, sequent([], []));
    const result = validateScProof(node);
    expect(result._tag).toBe("Invalid");
  });

  it("右¬の前提がバリデーションされる", () => {
    const badPremise = scIdentity(sequent([], []));
    const node = scNegationRight(badPremise, sequent([], []));
    const result = validateScProof(node);
    expect(result._tag).toBe("Invalid");
  });
});
