/**
 * ビルトインクエストの模範解答定義。
 *
 * 各クエストに対して、証明図のステップ列（DAG構造）として模範解答を保持する。
 * ノート自体ではなく、証明の構造として表現し、buildModelAnswerWorkspace で
 * ワークスペースに変換する。
 *
 * 変更時は builtinModelAnswers.test.ts も同期すること。
 * 新カテゴリ追加時は modelAnswerRegistry のマップにも追加すること。
 */

import type { ModelAnswer } from "./modelAnswer";

// ============================================================
// propositional-basics: 命題論理の基礎（Łukasiewicz体系）
// A1: φ → (ψ → φ)
// A2: (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))
// A3: (¬φ → ¬ψ) → (ψ → φ)
// ============================================================

/**
 * prop-01: 恒等律 φ → φ
 *
 * SKK = I の対応。5ステップ。
 * 1. A2[φ/φ, ψ/(φ→φ), χ/φ]: (φ → ((φ → φ) → φ)) → ((φ → (φ → φ)) → (φ → φ))
 * 2. A1[φ/φ, ψ/(φ→φ)]: φ → ((φ → φ) → φ)
 * 3. MP(1,0): (φ → (φ → φ)) → (φ → φ)
 * 4. A1[φ/φ, ψ/φ]: φ → (φ → φ)
 * 5. MP(3,2): φ → φ
 */
const prop01Identity: ModelAnswer = {
  questId: "prop-01",
  steps: [
    {
      _tag: "axiom",
      formulaText:
        "(phi -> ((phi -> phi) -> phi)) -> ((phi -> (phi -> phi)) -> (phi -> phi))",
    },
    { _tag: "axiom", formulaText: "phi -> ((phi -> phi) -> phi)" },
    { _tag: "mp", leftIndex: 1, rightIndex: 0 },
    { _tag: "axiom", formulaText: "phi -> (phi -> phi)" },
    { _tag: "mp", leftIndex: 3, rightIndex: 2 },
  ],
};

/**
 * prop-02: 定数関数の合成 ψ → (φ → φ)
 *
 * φ → φ を導出し、A1で持ち上げる。7ステップ。
 */
const prop02ConstantComposition: ModelAnswer = {
  questId: "prop-02",
  steps: [
    // φ → φ の導出（prop-01と同じ5ステップ）
    {
      _tag: "axiom",
      formulaText:
        "(phi -> ((phi -> phi) -> phi)) -> ((phi -> (phi -> phi)) -> (phi -> phi))",
    },
    { _tag: "axiom", formulaText: "phi -> ((phi -> phi) -> phi)" },
    { _tag: "mp", leftIndex: 1, rightIndex: 0 },
    { _tag: "axiom", formulaText: "phi -> (phi -> phi)" },
    { _tag: "mp", leftIndex: 3, rightIndex: 2 },
    // A1で持ち上げ
    {
      _tag: "axiom",
      formulaText: "(phi -> phi) -> (psi -> (phi -> phi))",
    },
    { _tag: "mp", leftIndex: 4, rightIndex: 5 },
  ],
};

/**
 * prop-03: 推移律の準備 (φ → ψ) → ((ψ → χ) → (φ → ψ))
 *
 * A1の直接のインスタンス。1ステップ。
 */
const prop03TransitivityPrep: ModelAnswer = {
  questId: "prop-03",
  steps: [
    {
      _tag: "axiom",
      formulaText: "(phi -> psi) -> ((psi -> chi) -> (phi -> psi))",
    },
  ],
};

/**
 * prop-04: 推移律 (φ → ψ) → ((ψ → χ) → (φ → χ))
 *
 * Hilbert系で最も基本的な補題。11ステップ。
 *
 * 証明の概略:
 * A2[φ/φ, ψ/ψ, χ/χ]から始めて、
 * A1で前提を持ち上げ、S公理で分配する。
 */
const prop04HypotheticalSyllogism: ModelAnswer = {
  questId: "prop-04",
  steps: [
    // S公理インスタンス: (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))
    {
      _tag: "axiom",
      formulaText: "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
    },
    // A1: (ψ → χ) → (φ → (ψ → χ))
    {
      _tag: "axiom",
      formulaText: "(psi -> chi) -> (phi -> (psi -> chi))",
    },
    // 推移律準備: A2インスタンスで合成
    // 目標: (ψ→χ) → ((φ→ψ) → (φ→χ))
    // (ψ→χ) → (φ→(ψ→χ)) と (φ→(ψ→χ)) → ((φ→ψ)→(φ→χ)) を合成

    // S公理: ( (ψ→χ) → ( (φ→(ψ→χ)) → ((φ→ψ)→(φ→χ)) ) ) → ( ((ψ→χ)→(φ→(ψ→χ))) → ((ψ→χ)→((φ→ψ)→(φ→χ))) )
    // これはA2[φ/(ψ→χ), ψ/(φ→(ψ→χ)), χ/((φ→ψ)→(φ→χ))]
    {
      _tag: "axiom",
      formulaText:
        "((psi -> chi) -> ((phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi)))) -> (((psi -> chi) -> (phi -> (psi -> chi))) -> ((psi -> chi) -> ((phi -> psi) -> (phi -> chi))))",
    },
    // A1: step0を持ち上げ: ((φ→(ψ→χ))→((φ→ψ)→(φ→χ))) → ((ψ→χ) → ((φ→(ψ→χ))→((φ→ψ)→(φ→χ))))
    {
      _tag: "axiom",
      formulaText:
        "((phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))) -> ((psi -> chi) -> ((phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))))",
    },
    // MP(step0, step3): (ψ→χ) → ((φ→(ψ→χ)) → ((φ→ψ)→(φ→χ)))
    { _tag: "mp", leftIndex: 0, rightIndex: 3 },
    // MP(step4, step2): ((ψ→χ)→(φ→(ψ→χ))) → ((ψ→χ)→((φ→ψ)→(φ→χ)))
    { _tag: "mp", leftIndex: 4, rightIndex: 2 },
    // MP(step1, step5): (ψ→χ) → ((φ→ψ)→(φ→χ))
    { _tag: "mp", leftIndex: 1, rightIndex: 5 },
    // A2: ((ψ→χ)→((φ→ψ)→(φ→χ))) → (((ψ→χ)→(φ→ψ))→((ψ→χ)→(φ→χ)))
    {
      _tag: "axiom",
      formulaText:
        "((psi -> chi) -> ((phi -> psi) -> (phi -> chi))) -> (((psi -> chi) -> (phi -> psi)) -> ((psi -> chi) -> (phi -> chi)))",
    },
    // MP(step6, step7): ((ψ→χ)→(φ→ψ)) → ((ψ→χ)→(φ→χ))
    { _tag: "mp", leftIndex: 6, rightIndex: 7 },
    // A1: (φ→ψ) → ((ψ→χ)→(φ→ψ))
    {
      _tag: "axiom",
      formulaText: "(phi -> psi) -> ((psi -> chi) -> (phi -> psi))",
    },
    // 最終合成: A2[φ/(φ→ψ), ψ/((ψ→χ)→(φ→ψ)), χ/((ψ→χ)→(φ→χ))]
    // ((φ→ψ) → (((ψ→χ)→(φ→ψ)) → ((ψ→χ)→(φ→χ)))) → (((φ→ψ)→((ψ→χ)→(φ→ψ))) → ((φ→ψ)→((ψ→χ)→(φ→χ))))
    {
      _tag: "axiom",
      formulaText:
        "((phi -> psi) -> (((psi -> chi) -> (phi -> psi)) -> ((psi -> chi) -> (phi -> chi)))) -> (((phi -> psi) -> ((psi -> chi) -> (phi -> psi))) -> ((phi -> psi) -> ((psi -> chi) -> (phi -> chi))))",
    },
    // A1: step8を持ち上げ
    {
      _tag: "axiom",
      formulaText:
        "(((psi -> chi) -> (phi -> psi)) -> ((psi -> chi) -> (phi -> chi))) -> ((phi -> psi) -> (((psi -> chi) -> (phi -> psi)) -> ((psi -> chi) -> (phi -> chi))))",
    },
    // MP(step8, step11): (φ→ψ) → (((ψ→χ)→(φ→ψ))→((ψ→χ)→(φ→χ)))
    { _tag: "mp", leftIndex: 8, rightIndex: 11 },
    // MP(step12, step10): ((φ→ψ)→((ψ→χ)→(φ→ψ))) → ((φ→ψ)→((ψ→χ)→(φ→χ)))
    { _tag: "mp", leftIndex: 12, rightIndex: 10 },
    // MP(step9, step13): (φ→ψ) → ((ψ→χ)→(φ→χ))
    { _tag: "mp", leftIndex: 9, rightIndex: 13 },
  ],
};

/**
 * prop-05: 含意の弱化 φ → (ψ → (χ → ψ))
 *
 * K公理の2重適用。3ステップ。
 */
const prop05ImplicationWeakening: ModelAnswer = {
  questId: "prop-05",
  steps: [
    // A1: ψ → (χ → ψ)
    { _tag: "axiom", formulaText: "psi -> (chi -> psi)" },
    // A1: (ψ → (χ → ψ)) → (φ → (ψ → (χ → ψ)))
    {
      _tag: "axiom",
      formulaText: "(psi -> (chi -> psi)) -> (phi -> (psi -> (chi -> psi)))",
    },
    // MP(0, 1): φ → (ψ → (χ → ψ))
    { _tag: "mp", leftIndex: 0, rightIndex: 1 },
  ],
};

/**
 * prop-06: S公理の特殊ケース (φ → (φ → ψ)) → (φ → ψ)
 *
 * A2でψをφに置き換え、φ→φと組み合わせる。12ステップ。
 *
 * 証明方針:
 * A2[φ/φ, ψ/φ, χ/ψ]: (φ→(φ→ψ)) → ((φ→φ)→(φ→ψ))
 * φ→φ を導出
 * 推移律で: (φ→(φ→ψ)) → ((φ→φ)→(φ→ψ)) と (φ→φ) から
 *   (φ→(φ→ψ)) → (φ→ψ) を導く
 *
 * 具体的には:
 * A2[φ/φ, ψ/φ, χ/ψ]の結果 + φ→φ をMPで合成する方法を使う
 * S公理のインスタンス: ((φ→(φ→ψ)) → ((φ→φ)→(φ→ψ))) → (((φ→(φ→ψ))→(φ→φ)) → ((φ→(φ→ψ))→(φ→ψ)))
 */
const prop06SSpecialCase: ModelAnswer = {
  questId: "prop-06",
  steps: [
    // A2[φ/φ, ψ/φ, χ/ψ]: (φ→(φ→ψ)) → ((φ→φ)→(φ→ψ))
    {
      _tag: "axiom",
      formulaText: "(phi -> (phi -> psi)) -> ((phi -> phi) -> (phi -> psi))",
    },
    // S公理でこれを分配:
    // A2[φ/(φ→(φ→ψ)), ψ/(φ→φ), χ/(φ→ψ)]
    {
      _tag: "axiom",
      formulaText:
        "((phi -> (phi -> psi)) -> ((phi -> phi) -> (phi -> psi))) -> (((phi -> (phi -> psi)) -> (phi -> phi)) -> ((phi -> (phi -> psi)) -> (phi -> psi)))",
    },
    // MP(0, 1): ((φ→(φ→ψ))→(φ→φ)) → ((φ→(φ→ψ))→(φ→ψ))
    { _tag: "mp", leftIndex: 0, rightIndex: 1 },
    // φ → φ の導出
    {
      _tag: "axiom",
      formulaText:
        "(phi -> ((phi -> phi) -> phi)) -> ((phi -> (phi -> phi)) -> (phi -> phi))",
    },
    { _tag: "axiom", formulaText: "phi -> ((phi -> phi) -> phi)" },
    { _tag: "mp", leftIndex: 4, rightIndex: 3 },
    { _tag: "axiom", formulaText: "phi -> (phi -> phi)" },
    { _tag: "mp", leftIndex: 6, rightIndex: 5 },
    // A1: (φ→φ) → ((φ→(φ→ψ)) → (φ→φ))
    {
      _tag: "axiom",
      formulaText: "(phi -> phi) -> ((phi -> (phi -> psi)) -> (phi -> phi))",
    },
    // MP(7, 8): (φ→(φ→ψ)) → (φ→φ)
    { _tag: "mp", leftIndex: 7, rightIndex: 8 },
    // MP(9, 2): (φ→(φ→ψ)) → (φ→ψ)
    { _tag: "mp", leftIndex: 9, rightIndex: 2 },
  ],
};

/**
 * prop-07: 含意の交換 (φ → (ψ → χ)) → (ψ → (φ → χ))
 *
 * C combinator。前提の順序を入れ替える。
 *
 * 証明方針:
 * A2[φ/φ, ψ/ψ, χ/χ]: (φ→(ψ→χ))→((φ→ψ)→(φ→χ))
 * A1: ψ→(φ→ψ) を使って
 * 合成: (φ→(ψ→χ)) → (ψ→(φ→χ))
 *
 * ステップ:
 * 0. A2: (φ→(ψ→χ)) → ((φ→ψ)→(φ→χ))
 * 1. A1: ψ → (φ→ψ)
 * 2. A2[φ/(φ→(ψ→χ)), ψ/((φ→ψ)→(φ→χ)), χ/(ψ→(φ→χ))]:
 *    ((φ→(ψ→χ)) → (((φ→ψ)→(φ→χ)) → (ψ→(φ→χ)))) →
 *    (((φ→(ψ→χ)) → ((φ→ψ)→(φ→χ))) → ((φ→(ψ→χ)) → (ψ→(φ→χ))))
 * ψ→(φ→ψ) と ((φ→ψ)→(φ→χ)) → (ψ→(φ→χ)) を合成
 */
const prop07Permutation: ModelAnswer = {
  questId: "prop-07",
  steps: [
    // 0. A2: (φ→(ψ→χ)) → ((φ→ψ)→(φ→χ))
    {
      _tag: "axiom",
      formulaText: "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
    },
    // 1. A1: ψ → (φ→ψ)
    { _tag: "axiom", formulaText: "psi -> (phi -> psi)" },
    // 合成: (ψ→(φ→ψ)) と ((φ→ψ)→(φ→χ)) から ψ→(φ→χ) を得る
    // つまり ((φ→ψ)→(φ→χ)) → (ψ→(φ→χ)) を ψ→(φ→ψ) 経由で構築

    // 推移律的に合成する必要がある
    // A2[φ/ψ, ψ/(φ→ψ), χ/(φ→χ)]:
    // (ψ → ((φ→ψ) → (φ→χ))) → ((ψ → (φ→ψ)) → (ψ → (φ→χ)))
    {
      _tag: "axiom",
      formulaText:
        "(psi -> ((phi -> psi) -> (phi -> chi))) -> ((psi -> (phi -> psi)) -> (psi -> (phi -> chi)))",
    },
    // A1: ((φ→ψ)→(φ→χ)) → (ψ → ((φ→ψ)→(φ→χ)))
    {
      _tag: "axiom",
      formulaText:
        "((phi -> psi) -> (phi -> chi)) -> (psi -> ((phi -> psi) -> (phi -> chi)))",
    },
    // 合成: step0のA2結果を step3 のA1で持ち上げて step2 のS公理で分配

    // A2[φ/(φ→(ψ→χ)), ψ/((φ→ψ)→(φ→χ)), χ/(ψ→((φ→ψ)→(φ→χ)))]
    {
      _tag: "axiom",
      formulaText:
        "((phi -> (psi -> chi)) -> (((phi -> psi) -> (phi -> chi)) -> (psi -> ((phi -> psi) -> (phi -> chi))))) -> (((phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))) -> ((phi -> (psi -> chi)) -> (psi -> ((phi -> psi) -> (phi -> chi)))))",
    },
    // A1: step3を(φ→(ψ→χ))の前提で持ち上げ
    {
      _tag: "axiom",
      formulaText:
        "(((phi -> psi) -> (phi -> chi)) -> (psi -> ((phi -> psi) -> (phi -> chi)))) -> ((phi -> (psi -> chi)) -> (((phi -> psi) -> (phi -> chi)) -> (psi -> ((phi -> psi) -> (phi -> chi)))))",
    },
    // MP(3, 5): (φ→(ψ→χ)) → (((φ→ψ)→(φ→χ)) → (ψ→((φ→ψ)→(φ→χ))))
    { _tag: "mp", leftIndex: 3, rightIndex: 5 },
    // MP(6, 4): ((φ→(ψ→χ))→((φ→ψ)→(φ→χ))) → ((φ→(ψ→χ)) → (ψ→((φ→ψ)→(φ→χ))))
    { _tag: "mp", leftIndex: 6, rightIndex: 4 },
    // MP(0, 7): (φ→(ψ→χ)) → (ψ→((φ→ψ)→(φ→χ)))
    { _tag: "mp", leftIndex: 0, rightIndex: 7 },

    // 次に ψ→((φ→ψ)→(φ→χ)) と ψ→(φ→ψ) → ψ→(φ→χ) への変換
    // A2[φ/ψ, ψ/(φ→ψ), χ/(φ→χ)] を使う (= step2)
    // step8の結果をstep2に通す

    // A2[φ/(φ→(ψ→χ)), ψ/(ψ→((φ→ψ)→(φ→χ))), χ/((ψ→(φ→ψ))→(ψ→(φ→χ)))]
    {
      _tag: "axiom",
      formulaText:
        "((phi -> (psi -> chi)) -> ((psi -> ((phi -> psi) -> (phi -> chi))) -> ((psi -> (phi -> psi)) -> (psi -> (phi -> chi))))) -> (((phi -> (psi -> chi)) -> (psi -> ((phi -> psi) -> (phi -> chi)))) -> ((phi -> (psi -> chi)) -> ((psi -> (phi -> psi)) -> (psi -> (phi -> chi)))))",
    },
    // A1: step2を持ち上げ
    {
      _tag: "axiom",
      formulaText:
        "((psi -> ((phi -> psi) -> (phi -> chi))) -> ((psi -> (phi -> psi)) -> (psi -> (phi -> chi)))) -> ((phi -> (psi -> chi)) -> ((psi -> ((phi -> psi) -> (phi -> chi))) -> ((psi -> (phi -> psi)) -> (psi -> (phi -> chi)))))",
    },
    // MP(2, 10): (φ→(ψ→χ)) → ((ψ→((φ→ψ)→(φ→χ))) → ((ψ→(φ→ψ))→(ψ→(φ→χ))))
    { _tag: "mp", leftIndex: 2, rightIndex: 10 },
    // MP(11, 9): ((φ→(ψ→χ))→(ψ→((φ→ψ)→(φ→χ)))) → ((φ→(ψ→χ))→((ψ→(φ→ψ))→(ψ→(φ→χ))))
    { _tag: "mp", leftIndex: 11, rightIndex: 9 },
    // MP(8, 12): (φ→(ψ→χ)) → ((ψ→(φ→ψ))→(ψ→(φ→χ)))
    { _tag: "mp", leftIndex: 8, rightIndex: 12 },

    // 最後: (φ→(ψ→χ))→((ψ→(φ→ψ))→(ψ→(φ→χ))) と (ψ→(φ→ψ)) [= step1] を合成
    // A2[φ/(φ→(ψ→χ)), ψ/(ψ→(φ→ψ)), χ/(ψ→(φ→χ))]
    {
      _tag: "axiom",
      formulaText:
        "((phi -> (psi -> chi)) -> ((psi -> (phi -> psi)) -> (psi -> (phi -> chi)))) -> (((phi -> (psi -> chi)) -> (psi -> (phi -> psi))) -> ((phi -> (psi -> chi)) -> (psi -> (phi -> chi))))",
    },
    // MP(13, 14): ((φ→(ψ→χ))→(ψ→(φ→ψ))) → ((φ→(ψ→χ))→(ψ→(φ→χ)))
    { _tag: "mp", leftIndex: 13, rightIndex: 14 },
    // A1: step1を持ち上げ: (ψ→(φ→ψ)) → ((φ→(ψ→χ))→(ψ→(φ→ψ)))
    {
      _tag: "axiom",
      formulaText:
        "(psi -> (phi -> psi)) -> ((phi -> (psi -> chi)) -> (psi -> (phi -> psi)))",
    },
    // MP(1, 16): (φ→(ψ→χ)) → (ψ→(φ→ψ))
    { _tag: "mp", leftIndex: 1, rightIndex: 16 },
    // MP(17, 15): (φ→(ψ→χ)) → (ψ→(φ→χ))
    { _tag: "mp", leftIndex: 17, rightIndex: 15 },
  ],
};

// --- レジストリ ---

/** 全ビルトイン模範解答 */
export const builtinModelAnswers: readonly ModelAnswer[] = [
  prop01Identity,
  prop02ConstantComposition,
  prop03TransitivityPrep,
  prop04HypotheticalSyllogism,
  prop05ImplicationWeakening,
  prop06SSpecialCase,
  prop07Permutation,
];

/** QuestId → ModelAnswer のマップ */
export const modelAnswerRegistry: ReadonlyMap<string, ModelAnswer> = new Map(
  builtinModelAnswers.map((a) => [a.questId, a]),
);
