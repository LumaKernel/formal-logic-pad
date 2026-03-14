import { describe, it, expect } from "vitest";
import { Either } from "effect";
import {
  proveSequentLK,
  NotProvable,
  StepLimitExceeded,
  DEFAULT_SEARCH_STEP_LIMIT,
} from "./proofSearch";
import { sequent, getScConclusion, validateScProof } from "./sequentCalculus";
import {
  metaVariable,
  negation,
  implication,
  conjunction,
  disjunction,
  predicate,
} from "./formula";
import { equalFormula } from "./equality";

// ── テスト用ヘルパー ────────────────────────────────────────

const p = metaVariable("φ");
const q = metaVariable("ψ");
const r = metaVariable("χ");
const bottom = predicate("⊥", []);

/** 証明結果が成功であることを確認し、証明木を返す */
const expectProvable = (
  goal: ReturnType<typeof sequent>,
  options?: { readonly stepLimit?: number },
) => {
  const result = proveSequentLK(goal, options);
  expect(Either.isRight(result)).toBe(true);
  if (!Either.isRight(result)) throw new Error("unreachable");
  const proof = result.right;

  // 結論が目標と一致することを検証
  const conclusion = getScConclusion(proof);
  expect(conclusion.antecedents.length).toBe(goal.antecedents.length);
  expect(conclusion.succedents.length).toBe(goal.succedents.length);
  for (let i = 0; i < goal.antecedents.length; i++) {
    expect(equalFormula(conclusion.antecedents[i], goal.antecedents[i])).toBe(
      true,
    );
  }
  for (let i = 0; i < goal.succedents.length; i++) {
    expect(equalFormula(conclusion.succedents[i], goal.succedents[i])).toBe(
      true,
    );
  }

  // 証明木の妥当性を検証
  const validation = validateScProof(proof);
  expect(validation._tag).toBe("Valid");

  return proof;
};

/** 証明結果が NotProvable であることを確認 */
const expectNotProvable = (goal: ReturnType<typeof sequent>) => {
  const result = proveSequentLK(goal);
  expect(Either.isLeft(result)).toBe(true);
  if (!Either.isLeft(result)) throw new Error("unreachable");
  expect(result.left._tag).toBe("NotProvable");
};

// ── 定数エクスポート ──────────────────────────────────────────

describe("DEFAULT_SEARCH_STEP_LIMIT", () => {
  it("デフォルトのステップ数制限が定義されている", () => {
    expect(DEFAULT_SEARCH_STEP_LIMIT).toBe(10000);
  });
});

// ── 公理 ──────────────────────────────────────────────────

describe("公理", () => {
  it("恒等公理: P ⇒ P", () => {
    expectProvable(sequent([p], [p]));
  });

  it("恒等公理（複数の式あり）: P, Q ⇒ Q, R", () => {
    expectProvable(sequent([p, q], [q, r]));
  });

  it("⊥公理: ⊥ ⇒", () => {
    expectProvable(sequent([bottom], []));
  });

  it("⊥公理（後件あり）: ⊥ ⇒ P", () => {
    expectProvable(sequent([bottom], [p]));
  });

  it("⊥公理（他の前件あり）: P, ⊥ ⇒ Q", () => {
    expectProvable(sequent([p, bottom], [q]));
  });
});

// ── 右規則（後件の分解） ──────────────────────────────────────

describe("右規則", () => {
  it("⇒¬: P ⇒ ¬¬P", () => {
    expectProvable(sequent([p], [negation(negation(p))]));
  });

  it("⇒→: ⇒ P → P", () => {
    expectProvable(sequent([], [implication(p, p)]));
  });

  it("⇒→: P ⇒ Q → P", () => {
    expectProvable(sequent([p], [implication(q, p)]));
  });

  it("⇒∧: P, Q ⇒ P ∧ Q", () => {
    expectProvable(sequent([p, q], [conjunction(p, q)]));
  });

  it("⇒∨: P ⇒ P ∨ Q", () => {
    expectProvable(sequent([p], [disjunction(p, q)]));
  });

  it("⇒∨: Q ⇒ P ∨ Q", () => {
    expectProvable(sequent([q], [disjunction(p, q)]));
  });
});

// ── 左規則（前件の分解） ──────────────────────────────────────

describe("左規則", () => {
  it("¬⇒: ¬P ⇒ に対し P が後件に追加される", () => {
    // ¬P, P ⇒ (P が両辺にあるため恒等公理で閉じる)
    expectProvable(sequent([negation(p), p], []));
  });

  it("→⇒: P → Q, P ⇒ Q", () => {
    expectProvable(sequent([implication(p, q), p], [q]));
  });

  it("∧⇒: P ∧ Q ⇒ P", () => {
    expectProvable(sequent([conjunction(p, q)], [p]));
  });

  it("∧⇒: P ∧ Q ⇒ Q", () => {
    expectProvable(sequent([conjunction(p, q)], [q]));
  });

  it("∧⇒: P ∧ Q ⇒ P, Q（両成分）", () => {
    expectProvable(sequent([conjunction(p, q)], [p, q]));
  });

  it("∨⇒: P ∨ Q, P → R, Q → R ⇒ R", () => {
    expectProvable(
      sequent([disjunction(p, q), implication(p, r), implication(q, r)], [r]),
    );
  });
});

// ── 古典論理のトートロジー ────────────────────────────────────

describe("古典論理のトートロジー", () => {
  it("排中律: ⇒ P ∨ ¬P", () => {
    expectProvable(sequent([], [disjunction(p, negation(p))]));
  });

  it("二重否定除去: ¬¬P ⇒ P", () => {
    expectProvable(sequent([negation(negation(p))], [p]));
  });

  it("ド・モルガン則 1: ¬(P ∨ Q) ⇒ ¬P ∧ ¬Q", () => {
    expectProvable(
      sequent(
        [negation(disjunction(p, q))],
        [conjunction(negation(p), negation(q))],
      ),
    );
  });

  it("ド・モルガン則 2: ¬(P ∧ Q) ⇒ ¬P ∨ ¬Q", () => {
    expectProvable(
      sequent(
        [negation(conjunction(p, q))],
        [disjunction(negation(p), negation(q))],
      ),
    );
  });

  it("ド・モルガン則 3: ¬P ∧ ¬Q ⇒ ¬(P ∨ Q)", () => {
    expectProvable(
      sequent(
        [conjunction(negation(p), negation(q))],
        [negation(disjunction(p, q))],
      ),
    );
  });

  it("ド・モルガン則 4: ¬P ∨ ¬Q ⇒ ¬(P ∧ Q)", () => {
    expectProvable(
      sequent(
        [disjunction(negation(p), negation(q))],
        [negation(conjunction(p, q))],
      ),
    );
  });

  it("対偶: (P → Q) ⇒ (¬Q → ¬P)", () => {
    expectProvable(
      sequent([implication(p, q)], [implication(negation(q), negation(p))]),
    );
  });

  it("Peirceの法則: ⇒ ((P → Q) → P) → P", () => {
    expectProvable(
      sequent([], [implication(implication(implication(p, q), p), p)]),
    );
  });

  it("三段論法: (P → Q), (Q → R) ⇒ (P → R)", () => {
    expectProvable(
      sequent([implication(p, q), implication(q, r)], [implication(p, r)]),
    );
  });

  it("分配法則: P ∧ (Q ∨ R) ⇒ (P ∧ Q) ∨ (P ∧ R)", () => {
    expectProvable(
      sequent(
        [conjunction(p, disjunction(q, r))],
        [disjunction(conjunction(p, q), conjunction(p, r))],
      ),
    );
  });
});

// ── 証明不可能なシーケント ────────────────────────────────────

describe("証明不可能なシーケント", () => {
  it("空のシーケント: ⇒", () => {
    expectNotProvable(sequent([], []));
  });

  it("原子式のみ（不一致）: P ⇒ Q", () => {
    expectNotProvable(sequent([p], [q]));
  });

  it("⇒ P（原子式のみ）", () => {
    expectNotProvable(sequent([], [p]));
  });

  it("P ⇒（前件のみ、原子式）", () => {
    expectNotProvable(sequent([p], []));
  });

  it("P → Q ⇒ Q（前提なしでは証明不可能）", () => {
    expectNotProvable(sequent([implication(p, q)], [q]));
  });
});

// ── ステップ数制限 ────────────────────────────────────────

describe("ステップ数制限", () => {
  it("制限内であれば証明成功", () => {
    expectProvable(sequent([p], [p]), { stepLimit: 100 });
  });

  it("制限を1に設定すると複合式で超過する", () => {
    const result = proveSequentLK(sequent([], [implication(p, p)]), {
      stepLimit: 1,
    });
    expect(Either.isLeft(result)).toBe(true);
    if (!Either.isLeft(result)) throw new Error("unreachable");
    expect(result.left._tag).toBe("StepLimitExceeded");
  });

  it("デフォルト制限で十分な探索が可能", () => {
    // 複雑な式でもデフォルト制限内で証明可能
    expectProvable(
      sequent(
        [],
        [
          implication(
            conjunction(implication(p, q), implication(q, r)),
            implication(p, r),
          ),
        ],
      ),
    );
  });
});

// ── エラー型 ──────────────────────────────────────────────

describe("エラー型", () => {
  it("NotProvable は _tag を持つ", () => {
    const err = new NotProvable({});
    expect(err._tag).toBe("NotProvable");
  });

  it("StepLimitExceeded は stepsUsed を持つ", () => {
    const err = new StepLimitExceeded({ stepsUsed: 42 });
    expect(err._tag).toBe("StepLimitExceeded");
    expect(err.stepsUsed).toBe(42);
  });
});
