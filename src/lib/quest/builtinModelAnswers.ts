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

// ============================================================
// propositional-intermediate: 命題論理の中級（Łukasiewicz体系）
// ============================================================

/**
 * prop-11: 前提の合流 (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))
 *
 * A2そのもの。1ステップ。
 */
const prop11PremiseMerge: ModelAnswer = {
  questId: "prop-11",
  steps: [
    {
      _tag: "axiom",
      formulaText: "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
    },
  ],
};

/**
 * prop-13: Fregeの定理 (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))
 *
 * A2と同じ。1ステップ。
 */
const prop13Frege: ModelAnswer = {
  questId: "prop-13",
  steps: [
    {
      _tag: "axiom",
      formulaText: "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
    },
  ],
};

/**
 * prop-35: Mendelson体系での恒等律 φ → φ
 *
 * prop-01と同じ証明。Mendelson体系でもA1,A2は共通。5ステップ。
 */
const prop35MendelsonIdentity: ModelAnswer = {
  questId: "prop-35",
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
 * prop-33: MPの含意化 φ → ((φ → ψ) → ψ)
 *
 * prop-07(C combinator)のインスタンス + φ→φ。
 * (φ→(ψ→χ))→(ψ→(φ→χ)) にφ/(φ→ψ), ψ/φ, χ/ψ を代入して
 * ((φ→ψ)→(φ→ψ))→(φ→((φ→ψ)→ψ)) を得て、(φ→ψ)→(φ→ψ)とMPする。
 *
 * 方針: A2を使ってφ→((φ→ψ)→ψ) を直接構築する。
 * S公理 A2[φ/φ, ψ/(φ→ψ), χ/ψ]: (φ→((φ→ψ)→ψ))→((φ→(φ→ψ))→(φ→ψ))
 * だがこれは逆向き。
 *
 * 直接的なアプローチ:
 * 1. A1[φ/φ, ψ/(φ→ψ)]: φ → ((φ→ψ) → φ)
 * 2. A2[φ/(φ→ψ), ψ/φ, χ/ψ]: ((φ→ψ) → (φ→ψ)) → (((φ→ψ) → φ) → ((φ→ψ) → ψ))
 * 3. (φ→ψ) → (φ→ψ) を導出 (identity, 5 steps)
 * 4. MP: ((φ→ψ) → φ) → ((φ→ψ) → ψ)
 * 5. 合成: φ → ((φ→ψ) → φ) と ((φ→ψ)→φ) → ((φ→ψ)→ψ) を推移律で合成
 */
const prop33MpImplication: ModelAnswer = {
  questId: "prop-33",
  steps: [
    // 0. A1[φ/φ, ψ/(φ→ψ)]: φ → ((φ→ψ) → φ)
    { _tag: "axiom", formulaText: "phi -> ((phi -> psi) -> phi)" },
    // 1. A2[φ/(φ→ψ), ψ/φ, χ/ψ]: ((φ→ψ)→(φ→ψ))→(((φ→ψ)→φ)→((φ→ψ)→ψ))
    {
      _tag: "axiom",
      formulaText:
        "((phi -> psi) -> (phi -> psi)) -> (((phi -> psi) -> phi) -> ((phi -> psi) -> psi))",
    },
    // Identity (φ→ψ)→(φ→ψ) の導出 (5 steps)
    // 2. A2[φ/(φ→ψ), ψ/((φ→ψ)→(φ→ψ)), χ/(φ→ψ)]
    {
      _tag: "axiom",
      formulaText:
        "((phi -> psi) -> (((phi -> psi) -> (phi -> psi)) -> (phi -> psi))) -> (((phi -> psi) -> ((phi -> psi) -> (phi -> psi))) -> ((phi -> psi) -> (phi -> psi)))",
    },
    // 3. A1[φ/(φ→ψ), ψ/((φ→ψ)→(φ→ψ))]
    {
      _tag: "axiom",
      formulaText:
        "(phi -> psi) -> (((phi -> psi) -> (phi -> psi)) -> (phi -> psi))",
    },
    // 4. MP(3, 2)
    { _tag: "mp", leftIndex: 3, rightIndex: 2 },
    // 5. A1[φ/(φ→ψ), ψ/(φ→ψ)]
    {
      _tag: "axiom",
      formulaText: "(phi -> psi) -> ((phi -> psi) -> (phi -> psi))",
    },
    // 6. MP(5, 4): (φ→ψ) → (φ→ψ)
    { _tag: "mp", leftIndex: 5, rightIndex: 4 },
    // 7. MP(6, 1): ((φ→ψ)→φ) → ((φ→ψ)→ψ)
    { _tag: "mp", leftIndex: 6, rightIndex: 1 },
    // 合成: φ → ((φ→ψ)→φ) と ((φ→ψ)→φ)→((φ→ψ)→ψ) を推移律で合成
    // 推移律: A2インスタンスで合成する
    // 8. A2[φ/φ, ψ/((φ→ψ)→φ), χ/((φ→ψ)→ψ)]
    {
      _tag: "axiom",
      formulaText:
        "(phi -> (((phi -> psi) -> phi) -> ((phi -> psi) -> psi))) -> ((phi -> ((phi -> psi) -> phi)) -> (phi -> ((phi -> psi) -> psi)))",
    },
    // 9. A1: step7を持ち上げ
    {
      _tag: "axiom",
      formulaText:
        "(((phi -> psi) -> phi) -> ((phi -> psi) -> psi)) -> (phi -> (((phi -> psi) -> phi) -> ((phi -> psi) -> psi)))",
    },
    // 10. MP(7, 9): φ → (((φ→ψ)→φ)→((φ→ψ)→ψ))
    { _tag: "mp", leftIndex: 7, rightIndex: 9 },
    // 11. MP(10, 8): (φ→((φ→ψ)→φ))→(φ→((φ→ψ)→ψ))
    { _tag: "mp", leftIndex: 10, rightIndex: 8 },
    // 12. MP(0, 11): φ → ((φ→ψ) → ψ)
    { _tag: "mp", leftIndex: 0, rightIndex: 11 },
  ],
};

/**
 * prop-10: B combinator (ψ → χ) → ((φ → ψ) → (φ → χ))
 *
 * prop-04の推移律 (φ→ψ)→((ψ→χ)→(φ→χ)) の前提を入れ替えたもの。
 * prop-07(C combinator) を prop-04 に適用する。
 *
 * 方針: prop-04の結果にprop-07のパターンを当てる。
 * prop-04: (φ→ψ) → ((ψ→χ) → (φ→χ))
 * これをC combinatorで変換: (ψ→χ) → ((φ→ψ) → (φ→χ))
 *
 * 直接証明: prop-04 全体をインライン展開して前提を入れ替える。
 * ただし長くなるので、直接A1+A2で構築する。
 *
 * 実際の方法: prop-04の導出(15 steps) + C combinatorの適用
 * ただしこれは非常に長くなる。
 *
 * 別の直接的なアプローチ:
 * A2[φ/φ, ψ/ψ, χ/χ]: (φ→(ψ→χ))→((φ→ψ)→(φ→χ))
 * A1: (ψ→χ)→(φ→(ψ→χ))
 * 合成: (ψ→χ)→(φ→(ψ→χ)) と (φ→(ψ→χ))→((φ→ψ)→(φ→χ)) を推移律で合成
 * → (ψ→χ)→((φ→ψ)→(φ→χ))
 */
const prop10Bcombi: ModelAnswer = {
  questId: "prop-10",
  steps: [
    // 0. A2[φ/φ, ψ/ψ, χ/χ]
    {
      _tag: "axiom",
      formulaText: "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
    },
    // 1. A1: (ψ→χ) → (φ→(ψ→χ))
    {
      _tag: "axiom",
      formulaText: "(psi -> chi) -> (phi -> (psi -> chi))",
    },
    // 合成 (推移律): step1 → step0
    // (ψ→χ)→(φ→(ψ→χ)) と (φ→(ψ→χ))→((φ→ψ)→(φ→χ))
    // A2[φ/(ψ→χ), ψ/(φ→(ψ→χ)), χ/((φ→ψ)→(φ→χ))]
    {
      _tag: "axiom",
      formulaText:
        "((psi -> chi) -> ((phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi)))) -> (((psi -> chi) -> (phi -> (psi -> chi))) -> ((psi -> chi) -> ((phi -> psi) -> (phi -> chi))))",
    },
    // 3. A1: step0を持ち上げ
    {
      _tag: "axiom",
      formulaText:
        "((phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))) -> ((psi -> chi) -> ((phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))))",
    },
    // 4. MP(0, 3): (ψ→χ) → ((φ→(ψ→χ))→((φ→ψ)→(φ→χ)))
    { _tag: "mp", leftIndex: 0, rightIndex: 3 },
    // 5. MP(4, 2): ((ψ→χ)→(φ→(ψ→χ)))→((ψ→χ)→((φ→ψ)→(φ→χ)))
    { _tag: "mp", leftIndex: 4, rightIndex: 2 },
    // 6. MP(1, 5): (ψ→χ) → ((φ→ψ) → (φ→χ))
    { _tag: "mp", leftIndex: 1, rightIndex: 5 },
  ],
};

// prop-08, prop-12 は非常に長い証明になるため、後続イテレーションで追加予定。

/**
 * prop-34: 含意の弱化除去 ((φ→ψ)→χ)→(ψ→χ)
 *
 * ψからA1でφ→ψを得て、((φ→ψ)→χ)に適用。
 * つまり ψ→(φ→ψ) と ((φ→ψ)→χ) を合成する。
 *
 * 方針:
 * A1: ψ→(φ→ψ)
 * 推移律で ((φ→ψ)→χ) → (ψ→χ) に
 * B combinator: (ψ→(φ→ψ))→(((φ→ψ)→χ)→(ψ→χ))
 * つまり prop-10 の形で合成。
 *
 * 直接: C(B(A1)) 的に構築
 *
 * A1: ψ→(φ→ψ)
 * 推移律(B combinator形):
 *   (ψ→(φ→ψ)) → (((φ→ψ)→χ)→(ψ→χ))
 *   これは prop-10[φ/ψ, ψ/(φ→ψ), χ/χ] のこと
 *
 * 実際にはA1のMP後に推移律を使って合成する。
 *
 * 方針: ψ→(φ→ψ) [A1] を
 * ((φ→ψ)→χ)→(ψ→χ) に変換する。
 *
 * A2[φ/ψ, ψ/(φ→ψ), χ/χ]: (ψ→((φ→ψ)→χ))→((ψ→(φ→ψ))→(ψ→χ))
 * これだと ψ→((φ→ψ)→χ) の形になってしまう。
 *
 * 正しいアプローチ:
 * C combinator: (A→(B→C)) → (B→(A→C))
 * を prop-10 に適用:
 * prop-10: (ψ→(φ→ψ)) → (((φ→ψ)→χ) → (ψ→χ))
 * [ψ/(φ→ψ), φ/ψ in prop-10's template]
 * = ((φ→ψ)→χ₂) → ((ψ→(φ→ψ)) → (ψ→χ₂))
 *
 * うーん、prop-10自体をインラインする方がシンプル。
 *
 * 再考:
 * Goal: ((φ→ψ)→χ) → (ψ→χ)
 *
 * Key insight: ψ→(φ→ψ) は A1。
 * ((φ→ψ)→χ) と ψ→(φ→ψ) から ψ→χ を得る（推移律）
 *
 * つまり推移律的に:
 * A = ψ→(φ→ψ) [A1], B = (φ→ψ)→χ [仮定]
 * ψ→(φ→ψ)→χ を推移律で得る。
 *
 * prop-10[φ/ψ, ψ/(φ→ψ), χ/χ]:
 *   ((φ→ψ)→χ) → ((ψ→(φ→ψ)) → (ψ→χ))
 * これとA1: ψ→(φ→ψ) を合成。
 *
 * A2[φ/((φ→ψ)→χ), ψ/(ψ→(φ→ψ)), χ/(ψ→χ)]:
 *   (((φ→ψ)→χ) → ((ψ→(φ→ψ))→(ψ→χ))) → ((((φ→ψ)→χ)→(ψ→(φ→ψ))) → (((φ→ψ)→χ)→(ψ→χ)))
 *
 * そしてA1: (ψ→(φ→ψ)) → (((φ→ψ)→χ)→(ψ→(φ→ψ)))
 * MP(A1のインスタンス, _): ((φ→ψ)→χ) → (ψ→(φ→ψ))
 *
 * 最終的に ((φ→ψ)→χ)→(ψ→χ) を得る。
 */
const prop34WeakeningElim: ModelAnswer = {
  questId: "prop-34",
  steps: [
    // まず prop-10[φ/ψ, ψ/(φ→ψ), χ/χ] をインライン導出
    // ((φ→ψ)→χ) → ((ψ→(φ→ψ)) → (ψ→χ))

    // 0. A2[φ/ψ, ψ/(φ→ψ), χ/χ]
    {
      _tag: "axiom",
      formulaText:
        "(psi -> ((phi -> psi) -> chi)) -> ((psi -> (phi -> psi)) -> (psi -> chi))",
    },
    // 1. A1[(φ→ψ)→χ をψで持ち上げ]: ((φ→ψ)→χ) → (ψ→((φ→ψ)→χ))
    {
      _tag: "axiom",
      formulaText: "((phi -> psi) -> chi) -> (psi -> ((phi -> psi) -> chi))",
    },
    // 合成: step1 と step0 を推移律で合成
    // ((φ→ψ)→χ)→(ψ→((φ→ψ)→χ)) と (ψ→((φ→ψ)→χ))→((ψ→(φ→ψ))→(ψ→χ))
    // → ((φ→ψ)→χ) → ((ψ→(φ→ψ)) → (ψ→χ))

    // 2. A2[φ/((φ→ψ)→χ), ψ/(ψ→((φ→ψ)→χ)), χ/((ψ→(φ→ψ))→(ψ→χ))]
    {
      _tag: "axiom",
      formulaText:
        "(((phi -> psi) -> chi) -> ((psi -> ((phi -> psi) -> chi)) -> ((psi -> (phi -> psi)) -> (psi -> chi)))) -> ((((phi -> psi) -> chi) -> (psi -> ((phi -> psi) -> chi))) -> (((phi -> psi) -> chi) -> ((psi -> (phi -> psi)) -> (psi -> chi))))",
    },
    // 3. A1: step0を持ち上げ
    {
      _tag: "axiom",
      formulaText:
        "((psi -> ((phi -> psi) -> chi)) -> ((psi -> (phi -> psi)) -> (psi -> chi))) -> (((phi -> psi) -> chi) -> ((psi -> ((phi -> psi) -> chi)) -> ((psi -> (phi -> psi)) -> (psi -> chi))))",
    },
    // 4. MP(0, 3)
    { _tag: "mp", leftIndex: 0, rightIndex: 3 },
    // 5. MP(4, 2)
    { _tag: "mp", leftIndex: 4, rightIndex: 2 },
    // 6. MP(1, 5): ((φ→ψ)→χ) → ((ψ→(φ→ψ)) → (ψ→χ))
    { _tag: "mp", leftIndex: 1, rightIndex: 5 },

    // 次にA1: ψ→(φ→ψ) と合成
    // ((φ→ψ)→χ)→((ψ→(φ→ψ))→(ψ→χ)) と ψ→(φ→ψ) [A1]

    // A2[φ/((φ→ψ)→χ), ψ/(ψ→(φ→ψ)), χ/(ψ→χ)]
    // 7.
    {
      _tag: "axiom",
      formulaText:
        "(((phi -> psi) -> chi) -> ((psi -> (phi -> psi)) -> (psi -> chi))) -> ((((phi -> psi) -> chi) -> (psi -> (phi -> psi))) -> (((phi -> psi) -> chi) -> (psi -> chi)))",
    },
    // 8. MP(6, 7)
    { _tag: "mp", leftIndex: 6, rightIndex: 7 },

    // 9. A1: (ψ→(φ→ψ)) → (((φ→ψ)→χ)→(ψ→(φ→ψ)))
    {
      _tag: "axiom",
      formulaText:
        "(psi -> (phi -> psi)) -> (((phi -> psi) -> chi) -> (psi -> (phi -> psi)))",
    },
    // 10. A1: ψ→(φ→ψ)
    { _tag: "axiom", formulaText: "psi -> (phi -> psi)" },
    // 11. MP(10, 9): ((φ→ψ)→χ) → (ψ→(φ→ψ))
    { _tag: "mp", leftIndex: 10, rightIndex: 9 },
    // 12. MP(11, 8): ((φ→ψ)→χ) → (ψ→χ)
    { _tag: "mp", leftIndex: 11, rightIndex: 8 },
  ],
};

/**
 * prop-14: 二重含意の分配 (φ→ψ)→((φ→(ψ→χ))→(φ→χ))
 *
 * prop-07 (C combinator) を A2 に適用する形。
 * A2: (φ→(ψ→χ))→((φ→ψ)→(φ→χ))
 * C(A2): (φ→ψ)→((φ→(ψ→χ))→(φ→χ))
 *
 * 方針: A2の結果にC combinatorのパターンを当てる。
 * A2[φ/φ, ψ/ψ, χ/χ]: (φ→(ψ→χ))→((φ→ψ)→(φ→χ))
 * prop-07[φ/(φ→(ψ→χ)), ψ/(φ→ψ), χ/(φ→χ)]:
 *   ((φ→(ψ→χ))→((φ→ψ)→(φ→χ))) → ((φ→ψ)→((φ→(ψ→χ))→(φ→χ)))
 *
 * ただし prop-07 をインライン展開すると 19 steps + A2 の 1 step = 長い
 *
 * 直接的なアプローチ: A2のインスタンスをC combinatorで変換
 * step0: A2: (φ→(ψ→χ))→((φ→ψ)→(φ→χ))
 * step1以降: C combinator pattern をA2の結果に適用
 *
 * C combinatorのコア:
 * A2[φ/A, ψ/B, χ/C]: (A→(B→C))→((A→B)→(A→C))
 * A1: B→(A→B)
 * 合成で A→(B→C) を B→(A→C) に変換
 *
 * ここでは A=(φ→(ψ→χ)), B=(φ→ψ), C=(φ→χ) として:
 * A2のresult: A→(B→C)
 * 目標: B→(A→C) = (φ→ψ)→((φ→(ψ→χ))→(φ→χ))
 */
const prop14DoubleImplDist: ModelAnswer = {
  questId: "prop-14",
  steps: [
    // 0. A2: (φ→(ψ→χ))→((φ→ψ)→(φ→χ))
    {
      _tag: "axiom",
      formulaText: "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
    },
    // 1. A1: (φ→ψ)→((φ→(ψ→χ))→(φ→ψ))
    {
      _tag: "axiom",
      formulaText: "(phi -> psi) -> ((phi -> (psi -> chi)) -> (phi -> psi))",
    },
    // C combinator: A→(B→C) [step0] を B→(A→C) に変換
    // A2でstep0からMP: (A→B)→(A→C) を得て、A1のB→(A→B)と推移律で合成

    // 2. A1: step0を(φ→ψ)前提で持ち上げ
    {
      _tag: "axiom",
      formulaText:
        "((phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))) -> ((phi -> psi) -> ((phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))))",
    },
    // 3. MP(0, 2)
    { _tag: "mp", leftIndex: 0, rightIndex: 2 },
    // 4. A2[φ/(φ→(ψ→χ)), ψ/(φ→ψ), χ/(φ→χ)]: step0→((A→B)→(A→C))
    {
      _tag: "axiom",
      formulaText:
        "((phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))) -> (((phi -> (psi -> chi)) -> (phi -> psi)) -> ((phi -> (psi -> chi)) -> (phi -> chi)))",
    },
    // 5. MP(0, 4): ((φ→(ψ→χ))→(φ→ψ))→((φ→(ψ→χ))→(φ→χ))
    { _tag: "mp", leftIndex: 0, rightIndex: 4 },
    // 推移律: step1[B→(A→B)]とstep5[(A→B)→(A→C)]を合成 → B→(A→C)
    // 6. A2[φ/(φ→ψ), ψ/((φ→(ψ→χ))→(φ→ψ)), χ/((φ→(ψ→χ))→(φ→χ))]
    {
      _tag: "axiom",
      formulaText:
        "((phi -> psi) -> (((phi -> (psi -> chi)) -> (phi -> psi)) -> ((phi -> (psi -> chi)) -> (phi -> chi)))) -> (((phi -> psi) -> ((phi -> (psi -> chi)) -> (phi -> psi))) -> ((phi -> psi) -> ((phi -> (psi -> chi)) -> (phi -> chi))))",
    },
    // 7. A1: step5を持ち上げ
    {
      _tag: "axiom",
      formulaText:
        "(((phi -> (psi -> chi)) -> (phi -> psi)) -> ((phi -> (psi -> chi)) -> (phi -> chi))) -> ((phi -> psi) -> (((phi -> (psi -> chi)) -> (phi -> psi)) -> ((phi -> (psi -> chi)) -> (phi -> chi))))",
    },
    // 8. MP(5, 7)
    { _tag: "mp", leftIndex: 5, rightIndex: 7 },
    // 9. MP(8, 6)
    { _tag: "mp", leftIndex: 8, rightIndex: 6 },
    // 10. MP(1, 9): (φ→ψ) → ((φ→(ψ→χ)) → (φ→χ))
    { _tag: "mp", leftIndex: 1, rightIndex: 9 },
  ],
};

// ============================================================
// propositional-negation: 否定の論理（Łukasiewicz体系）
// ============================================================

/**
 * prop-19: 対偶の逆 (¬ψ→¬φ)→(φ→ψ)
 *
 * A3そのもの。1ステップ。
 */
const prop19ContraposReverse: ModelAnswer = {
  questId: "prop-19",
  steps: [
    {
      _tag: "axiom",
      formulaText: "(~psi -> ~phi) -> (phi -> psi)",
    },
  ],
};

/**
 * prop-18: 爆発律 (Ex Falso Quodlibet) ¬φ→(φ→ψ)
 *
 * A3: (¬ψ→¬φ)→(φ→ψ) と A1: ¬φ→(¬ψ→¬φ) をB combinatorで合成。7ステップ。
 */
const prop18ExFalso: ModelAnswer = {
  questId: "prop-18",
  steps: [
    // 0. A3[φ/ψ, ψ/φ]: (¬ψ→¬φ)→(φ→ψ)
    { _tag: "axiom", formulaText: "(~psi -> ~phi) -> (phi -> psi)" },
    // 1. A1[φ/¬φ, ψ/¬ψ]: ¬φ→(¬ψ→¬φ)
    { _tag: "axiom", formulaText: "~phi -> (~psi -> ~phi)" },
    // B combinator: compose step1 then step0
    // 2. A2[φ/¬φ, ψ/(¬ψ→¬φ), χ/(φ→ψ)]
    {
      _tag: "axiom",
      formulaText:
        "(~phi -> ((~psi -> ~phi) -> (phi -> psi))) -> ((~phi -> (~psi -> ~phi)) -> (~phi -> (phi -> psi)))",
    },
    // 3. A1: step0を¬φで持ち上げ
    {
      _tag: "axiom",
      formulaText:
        "((~psi -> ~phi) -> (phi -> psi)) -> (~phi -> ((~psi -> ~phi) -> (phi -> psi)))",
    },
    // 4. MP(0, 3)
    { _tag: "mp", leftIndex: 0, rightIndex: 3 },
    // 5. MP(4, 2)
    { _tag: "mp", leftIndex: 4, rightIndex: 2 },
    // 6. MP(1, 5): ¬φ→(φ→ψ)
    { _tag: "mp", leftIndex: 1, rightIndex: 5 },
  ],
};

/**
 * prop-28: Claviusの法則 (¬φ→φ)→φ
 *
 * ExFalso + S公理 + A3 + B combinator + W combinator。23ステップ。
 *
 * 方針:
 * 1. ExF: ¬φ→(φ→¬(¬φ→φ))
 * 2. S公理で分配: (¬φ→φ)→(¬φ→¬(¬φ→φ))
 * 3. A3: (¬φ→¬(¬φ→φ))→((¬φ→φ)→φ)
 * 4. 合成で (¬φ→φ)→((¬φ→φ)→φ)
 * 5. W公理で (¬φ→φ)→φ
 */
const prop28Clavius: ModelAnswer = {
  questId: "prop-28",
  steps: [
    // --- ExF[φ/φ, ψ/¬(¬φ→φ)] inline: ¬φ→(φ→¬(¬φ→φ)) ---
    // 0. A3[φ/¬(¬φ→φ), ψ/φ]
    {
      _tag: "axiom",
      formulaText: "(~~(~phi -> phi) -> ~phi) -> (phi -> ~(~phi -> phi))",
    },
    // 1. A1: ¬φ→(¬¬(¬φ→φ)→¬φ)
    {
      _tag: "axiom",
      formulaText: "~phi -> (~~(~phi -> phi) -> ~phi)",
    },
    // B combinator
    // 2. A2
    {
      _tag: "axiom",
      formulaText:
        "(~phi -> ((~~(~phi -> phi) -> ~phi) -> (phi -> ~(~phi -> phi)))) -> ((~phi -> (~~(~phi -> phi) -> ~phi)) -> (~phi -> (phi -> ~(~phi -> phi))))",
    },
    // 3. A1
    {
      _tag: "axiom",
      formulaText:
        "((~~(~phi -> phi) -> ~phi) -> (phi -> ~(~phi -> phi))) -> (~phi -> ((~~(~phi -> phi) -> ~phi) -> (phi -> ~(~phi -> phi))))",
    },
    // 4. MP(0, 3)
    { _tag: "mp", leftIndex: 0, rightIndex: 3 },
    // 5. MP(4, 2)
    { _tag: "mp", leftIndex: 4, rightIndex: 2 },
    // 6. MP(1, 5): ¬φ→(φ→¬(¬φ→φ))
    { _tag: "mp", leftIndex: 1, rightIndex: 5 },

    // --- S公理: (¬φ→φ)→(¬φ→¬(¬φ→φ)) ---
    // 7. A2[φ/¬φ, ψ/φ, χ/¬(¬φ→φ)]
    {
      _tag: "axiom",
      formulaText:
        "(~phi -> (phi -> ~(~phi -> phi))) -> ((~phi -> phi) -> (~phi -> ~(~phi -> phi)))",
    },
    // 8. MP(6, 7)
    { _tag: "mp", leftIndex: 6, rightIndex: 7 },

    // --- A3: (¬φ→¬(¬φ→φ))→((¬φ→φ)→φ) ---
    // 9. A3[φ/φ, ψ/(¬φ→φ)]
    {
      _tag: "axiom",
      formulaText: "(~phi -> ~(~phi -> phi)) -> ((~phi -> phi) -> phi)",
    },

    // --- B combinator: step8 then step9 ---
    // 10. A2
    {
      _tag: "axiom",
      formulaText:
        "((~phi -> phi) -> ((~phi -> ~(~phi -> phi)) -> ((~phi -> phi) -> phi))) -> (((~phi -> phi) -> (~phi -> ~(~phi -> phi))) -> ((~phi -> phi) -> ((~phi -> phi) -> phi)))",
    },
    // 11. A1
    {
      _tag: "axiom",
      formulaText:
        "((~phi -> ~(~phi -> phi)) -> ((~phi -> phi) -> phi)) -> ((~phi -> phi) -> ((~phi -> ~(~phi -> phi)) -> ((~phi -> phi) -> phi)))",
    },
    // 12. MP(9, 11)
    { _tag: "mp", leftIndex: 9, rightIndex: 11 },
    // 13. MP(12, 10)
    { _tag: "mp", leftIndex: 12, rightIndex: 10 },
    // 14. MP(8, 13): (¬φ→φ)→((¬φ→φ)→φ)
    { _tag: "mp", leftIndex: 8, rightIndex: 13 },

    // --- W combinator (prop-06パターン) ---
    // 15. A2[φ/(¬φ→φ), ψ/(¬φ→φ), χ/φ]
    {
      _tag: "axiom",
      formulaText:
        "((~phi -> phi) -> ((~phi -> phi) -> phi)) -> (((~phi -> phi) -> (~phi -> phi)) -> ((~phi -> phi) -> phi))",
    },
    // 16. MP(14, 15)
    { _tag: "mp", leftIndex: 14, rightIndex: 15 },

    // Identity: (¬φ→φ)→(¬φ→φ)
    // 17. A2
    {
      _tag: "axiom",
      formulaText:
        "((~phi -> phi) -> (((~phi -> phi) -> (~phi -> phi)) -> (~phi -> phi))) -> (((~phi -> phi) -> ((~phi -> phi) -> (~phi -> phi))) -> ((~phi -> phi) -> (~phi -> phi)))",
    },
    // 18. A1
    {
      _tag: "axiom",
      formulaText:
        "(~phi -> phi) -> (((~phi -> phi) -> (~phi -> phi)) -> (~phi -> phi))",
    },
    // 19. MP(18, 17)
    { _tag: "mp", leftIndex: 18, rightIndex: 17 },
    // 20. A1
    {
      _tag: "axiom",
      formulaText: "(~phi -> phi) -> ((~phi -> phi) -> (~phi -> phi))",
    },
    // 21. MP(20, 19)
    { _tag: "mp", leftIndex: 20, rightIndex: 19 },

    // 22. MP(21, 16): (¬φ→φ)→φ
    { _tag: "mp", leftIndex: 21, rightIndex: 16 },
  ],
};

/**
 * prop-17: 二重否定除去 (DNE) ¬¬φ→φ
 *
 * A1 + A3 + B combinator で ¬¬φ→(¬φ→φ) を得て、
 * Claviusインライン (23 steps) と合成。35ステップ。
 */
const prop17DNE: ModelAnswer = {
  questId: "prop-17",
  steps: [
    // --- ¬¬φ→(¬φ→φ) の導出 ---
    // 0. A1: ¬¬φ→(¬φ→¬¬φ)
    { _tag: "axiom", formulaText: "~~phi -> (~phi -> ~~phi)" },
    // 1. A3[φ/φ, ψ/¬φ]: (¬φ→¬¬φ)→(¬φ→φ)
    { _tag: "axiom", formulaText: "(~phi -> ~~phi) -> (~phi -> phi)" },
    // B combinator: compose step0 and step1
    // 2. A2
    {
      _tag: "axiom",
      formulaText:
        "(~~phi -> ((~phi -> ~~phi) -> (~phi -> phi))) -> ((~~phi -> (~phi -> ~~phi)) -> (~~phi -> (~phi -> phi)))",
    },
    // 3. A1
    {
      _tag: "axiom",
      formulaText:
        "((~phi -> ~~phi) -> (~phi -> phi)) -> (~~phi -> ((~phi -> ~~phi) -> (~phi -> phi)))",
    },
    // 4. MP(1, 3)
    { _tag: "mp", leftIndex: 1, rightIndex: 3 },
    // 5. MP(4, 2)
    { _tag: "mp", leftIndex: 4, rightIndex: 2 },
    // 6. MP(0, 5): ¬¬φ→(¬φ→φ)
    { _tag: "mp", leftIndex: 0, rightIndex: 5 },

    // --- Clavius inline (23 steps, indices 7-29) ---
    // 7
    {
      _tag: "axiom",
      formulaText: "(~~(~phi -> phi) -> ~phi) -> (phi -> ~(~phi -> phi))",
    },
    // 8
    {
      _tag: "axiom",
      formulaText: "~phi -> (~~(~phi -> phi) -> ~phi)",
    },
    // 9
    {
      _tag: "axiom",
      formulaText:
        "(~phi -> ((~~(~phi -> phi) -> ~phi) -> (phi -> ~(~phi -> phi)))) -> ((~phi -> (~~(~phi -> phi) -> ~phi)) -> (~phi -> (phi -> ~(~phi -> phi))))",
    },
    // 10
    {
      _tag: "axiom",
      formulaText:
        "((~~(~phi -> phi) -> ~phi) -> (phi -> ~(~phi -> phi))) -> (~phi -> ((~~(~phi -> phi) -> ~phi) -> (phi -> ~(~phi -> phi))))",
    },
    // 11. MP(7, 10)
    { _tag: "mp", leftIndex: 7, rightIndex: 10 },
    // 12. MP(11, 9)
    { _tag: "mp", leftIndex: 11, rightIndex: 9 },
    // 13. MP(8, 12)
    { _tag: "mp", leftIndex: 8, rightIndex: 12 },
    // 14
    {
      _tag: "axiom",
      formulaText:
        "(~phi -> (phi -> ~(~phi -> phi))) -> ((~phi -> phi) -> (~phi -> ~(~phi -> phi)))",
    },
    // 15. MP(13, 14)
    { _tag: "mp", leftIndex: 13, rightIndex: 14 },
    // 16
    {
      _tag: "axiom",
      formulaText: "(~phi -> ~(~phi -> phi)) -> ((~phi -> phi) -> phi)",
    },
    // 17
    {
      _tag: "axiom",
      formulaText:
        "((~phi -> phi) -> ((~phi -> ~(~phi -> phi)) -> ((~phi -> phi) -> phi))) -> (((~phi -> phi) -> (~phi -> ~(~phi -> phi))) -> ((~phi -> phi) -> ((~phi -> phi) -> phi)))",
    },
    // 18
    {
      _tag: "axiom",
      formulaText:
        "((~phi -> ~(~phi -> phi)) -> ((~phi -> phi) -> phi)) -> ((~phi -> phi) -> ((~phi -> ~(~phi -> phi)) -> ((~phi -> phi) -> phi)))",
    },
    // 19. MP(16, 18)
    { _tag: "mp", leftIndex: 16, rightIndex: 18 },
    // 20. MP(19, 17)
    { _tag: "mp", leftIndex: 19, rightIndex: 17 },
    // 21. MP(15, 20)
    { _tag: "mp", leftIndex: 15, rightIndex: 20 },
    // 22
    {
      _tag: "axiom",
      formulaText:
        "((~phi -> phi) -> ((~phi -> phi) -> phi)) -> (((~phi -> phi) -> (~phi -> phi)) -> ((~phi -> phi) -> phi))",
    },
    // 23. MP(21, 22)
    { _tag: "mp", leftIndex: 21, rightIndex: 22 },
    // 24
    {
      _tag: "axiom",
      formulaText:
        "((~phi -> phi) -> (((~phi -> phi) -> (~phi -> phi)) -> (~phi -> phi))) -> (((~phi -> phi) -> ((~phi -> phi) -> (~phi -> phi))) -> ((~phi -> phi) -> (~phi -> phi)))",
    },
    // 25
    {
      _tag: "axiom",
      formulaText:
        "(~phi -> phi) -> (((~phi -> phi) -> (~phi -> phi)) -> (~phi -> phi))",
    },
    // 26. MP(25, 24)
    { _tag: "mp", leftIndex: 25, rightIndex: 24 },
    // 27
    {
      _tag: "axiom",
      formulaText: "(~phi -> phi) -> ((~phi -> phi) -> (~phi -> phi))",
    },
    // 28. MP(27, 26)
    { _tag: "mp", leftIndex: 27, rightIndex: 26 },
    // 29. MP(28, 23): (¬φ→φ)→φ — Clavius
    { _tag: "mp", leftIndex: 28, rightIndex: 23 },

    // --- ¬¬φ→(¬φ→φ) [step6] と (¬φ→φ)→φ [step29] をB combinatorで合成 ---
    // 30. A2
    {
      _tag: "axiom",
      formulaText:
        "(~~phi -> ((~phi -> phi) -> phi)) -> ((~~phi -> (~phi -> phi)) -> (~~phi -> phi))",
    },
    // 31. A1
    {
      _tag: "axiom",
      formulaText:
        "((~phi -> phi) -> phi) -> (~~phi -> ((~phi -> phi) -> phi))",
    },
    // 32. MP(29, 31)
    { _tag: "mp", leftIndex: 29, rightIndex: 31 },
    // 33. MP(32, 30)
    { _tag: "mp", leftIndex: 32, rightIndex: 30 },
    // 34. MP(6, 33): ¬¬φ→φ
    { _tag: "mp", leftIndex: 6, rightIndex: 33 },
  ],
};

/**
 * prop-25: 三重否定除去 ¬¬¬φ→¬φ
 *
 * DNE[φ/¬φ]: すべてのφを¬φに置き換えた形。35ステップ。
 */
const prop25TripleNeg: ModelAnswer = {
  questId: "prop-25",
  steps: [
    // --- ¬¬¬φ→(¬¬φ→¬φ) の導出 ---
    // 0. A1: ¬¬¬φ→(¬¬φ→¬¬¬φ)
    { _tag: "axiom", formulaText: "~~~phi -> (~~phi -> ~~~phi)" },
    // 1. A3[φ/¬φ, ψ/¬¬φ]: (¬¬φ→¬¬¬φ)→(¬¬φ→¬φ)
    { _tag: "axiom", formulaText: "(~~phi -> ~~~phi) -> (~~phi -> ~phi)" },
    // B combinator
    // 2. A2
    {
      _tag: "axiom",
      formulaText:
        "(~~~phi -> ((~~phi -> ~~~phi) -> (~~phi -> ~phi))) -> ((~~~phi -> (~~phi -> ~~~phi)) -> (~~~phi -> (~~phi -> ~phi)))",
    },
    // 3. A1
    {
      _tag: "axiom",
      formulaText:
        "((~~phi -> ~~~phi) -> (~~phi -> ~phi)) -> (~~~phi -> ((~~phi -> ~~~phi) -> (~~phi -> ~phi)))",
    },
    // 4. MP(1, 3)
    { _tag: "mp", leftIndex: 1, rightIndex: 3 },
    // 5. MP(4, 2)
    { _tag: "mp", leftIndex: 4, rightIndex: 2 },
    // 6. MP(0, 5): ¬¬¬φ→(¬¬φ→¬φ)
    { _tag: "mp", leftIndex: 0, rightIndex: 5 },

    // --- Clavius[φ/¬φ] inline (23 steps, indices 7-29) ---
    // 7
    {
      _tag: "axiom",
      formulaText: "(~~(~~phi -> ~phi) -> ~~phi) -> (~phi -> ~(~~phi -> ~phi))",
    },
    // 8
    { _tag: "axiom", formulaText: "~~phi -> (~~(~~phi -> ~phi) -> ~~phi)" },
    // 9
    {
      _tag: "axiom",
      formulaText:
        "(~~phi -> ((~~(~~phi -> ~phi) -> ~~phi) -> (~phi -> ~(~~phi -> ~phi)))) -> ((~~phi -> (~~(~~phi -> ~phi) -> ~~phi)) -> (~~phi -> (~phi -> ~(~~phi -> ~phi))))",
    },
    // 10
    {
      _tag: "axiom",
      formulaText:
        "((~~(~~phi -> ~phi) -> ~~phi) -> (~phi -> ~(~~phi -> ~phi))) -> (~~phi -> ((~~(~~phi -> ~phi) -> ~~phi) -> (~phi -> ~(~~phi -> ~phi))))",
    },
    // 11. MP(7, 10)
    { _tag: "mp", leftIndex: 7, rightIndex: 10 },
    // 12. MP(11, 9)
    { _tag: "mp", leftIndex: 11, rightIndex: 9 },
    // 13. MP(8, 12)
    { _tag: "mp", leftIndex: 8, rightIndex: 12 },
    // 14
    {
      _tag: "axiom",
      formulaText:
        "(~~phi -> (~phi -> ~(~~phi -> ~phi))) -> ((~~phi -> ~phi) -> (~~phi -> ~(~~phi -> ~phi)))",
    },
    // 15. MP(13, 14)
    { _tag: "mp", leftIndex: 13, rightIndex: 14 },
    // 16
    {
      _tag: "axiom",
      formulaText: "(~~phi -> ~(~~phi -> ~phi)) -> ((~~phi -> ~phi) -> ~phi)",
    },
    // 17
    {
      _tag: "axiom",
      formulaText:
        "((~~phi -> ~phi) -> ((~~phi -> ~(~~phi -> ~phi)) -> ((~~phi -> ~phi) -> ~phi))) -> (((~~phi -> ~phi) -> (~~phi -> ~(~~phi -> ~phi))) -> ((~~phi -> ~phi) -> ((~~phi -> ~phi) -> ~phi)))",
    },
    // 18
    {
      _tag: "axiom",
      formulaText:
        "((~~phi -> ~(~~phi -> ~phi)) -> ((~~phi -> ~phi) -> ~phi)) -> ((~~phi -> ~phi) -> ((~~phi -> ~(~~phi -> ~phi)) -> ((~~phi -> ~phi) -> ~phi)))",
    },
    // 19. MP(16, 18)
    { _tag: "mp", leftIndex: 16, rightIndex: 18 },
    // 20. MP(19, 17)
    { _tag: "mp", leftIndex: 19, rightIndex: 17 },
    // 21. MP(15, 20)
    { _tag: "mp", leftIndex: 15, rightIndex: 20 },
    // 22
    {
      _tag: "axiom",
      formulaText:
        "((~~phi -> ~phi) -> ((~~phi -> ~phi) -> ~phi)) -> (((~~phi -> ~phi) -> (~~phi -> ~phi)) -> ((~~phi -> ~phi) -> ~phi))",
    },
    // 23. MP(21, 22)
    { _tag: "mp", leftIndex: 21, rightIndex: 22 },
    // 24
    {
      _tag: "axiom",
      formulaText:
        "((~~phi -> ~phi) -> (((~~phi -> ~phi) -> (~~phi -> ~phi)) -> (~~phi -> ~phi))) -> (((~~phi -> ~phi) -> ((~~phi -> ~phi) -> (~~phi -> ~phi))) -> ((~~phi -> ~phi) -> (~~phi -> ~phi)))",
    },
    // 25
    {
      _tag: "axiom",
      formulaText:
        "(~~phi -> ~phi) -> (((~~phi -> ~phi) -> (~~phi -> ~phi)) -> (~~phi -> ~phi))",
    },
    // 26. MP(25, 24)
    { _tag: "mp", leftIndex: 25, rightIndex: 24 },
    // 27
    {
      _tag: "axiom",
      formulaText: "(~~phi -> ~phi) -> ((~~phi -> ~phi) -> (~~phi -> ~phi))",
    },
    // 28. MP(27, 26)
    { _tag: "mp", leftIndex: 27, rightIndex: 26 },
    // 29. MP(28, 23): (¬¬φ→¬φ)→¬φ — Clavius[φ/¬φ]
    { _tag: "mp", leftIndex: 28, rightIndex: 23 },

    // --- ¬¬¬φ→(¬¬φ→¬φ) [step6] と (¬¬φ→¬φ)→¬φ [step29] をB combinatorで合成 ---
    // 30. A2
    {
      _tag: "axiom",
      formulaText:
        "(~~~phi -> ((~~phi -> ~phi) -> ~phi)) -> ((~~~phi -> (~~phi -> ~phi)) -> (~~~phi -> ~phi))",
    },
    // 31. A1
    {
      _tag: "axiom",
      formulaText:
        "((~~phi -> ~phi) -> ~phi) -> (~~~phi -> ((~~phi -> ~phi) -> ~phi))",
    },
    // 32. MP(29, 31)
    { _tag: "mp", leftIndex: 29, rightIndex: 31 },
    // 33. MP(32, 30)
    { _tag: "mp", leftIndex: 32, rightIndex: 30 },
    // 34. MP(6, 33): ¬¬¬φ→¬φ
    { _tag: "mp", leftIndex: 6, rightIndex: 33 },
  ],
};

/**
 * prop-15: 二重否定導入 (DNI) φ→¬¬φ
 *
 * prop-25 (¬¬¬φ→¬φ) + A3[φ/¬¬φ, ψ/φ] で導出。37ステップ。
 */
const prop15DNI: ModelAnswer = {
  questId: "prop-15",
  steps: [
    // --- prop-25 inline (35 steps, indices 0-34) ---
    // 0
    { _tag: "axiom", formulaText: "~~~phi -> (~~phi -> ~~~phi)" },
    // 1
    { _tag: "axiom", formulaText: "(~~phi -> ~~~phi) -> (~~phi -> ~phi)" },
    // 2
    {
      _tag: "axiom",
      formulaText:
        "(~~~phi -> ((~~phi -> ~~~phi) -> (~~phi -> ~phi))) -> ((~~~phi -> (~~phi -> ~~~phi)) -> (~~~phi -> (~~phi -> ~phi)))",
    },
    // 3
    {
      _tag: "axiom",
      formulaText:
        "((~~phi -> ~~~phi) -> (~~phi -> ~phi)) -> (~~~phi -> ((~~phi -> ~~~phi) -> (~~phi -> ~phi)))",
    },
    // 4. MP(1, 3)
    { _tag: "mp", leftIndex: 1, rightIndex: 3 },
    // 5. MP(4, 2)
    { _tag: "mp", leftIndex: 4, rightIndex: 2 },
    // 6. MP(0, 5)
    { _tag: "mp", leftIndex: 0, rightIndex: 5 },
    // 7
    {
      _tag: "axiom",
      formulaText: "(~~(~~phi -> ~phi) -> ~~phi) -> (~phi -> ~(~~phi -> ~phi))",
    },
    // 8
    { _tag: "axiom", formulaText: "~~phi -> (~~(~~phi -> ~phi) -> ~~phi)" },
    // 9
    {
      _tag: "axiom",
      formulaText:
        "(~~phi -> ((~~(~~phi -> ~phi) -> ~~phi) -> (~phi -> ~(~~phi -> ~phi)))) -> ((~~phi -> (~~(~~phi -> ~phi) -> ~~phi)) -> (~~phi -> (~phi -> ~(~~phi -> ~phi))))",
    },
    // 10
    {
      _tag: "axiom",
      formulaText:
        "((~~(~~phi -> ~phi) -> ~~phi) -> (~phi -> ~(~~phi -> ~phi))) -> (~~phi -> ((~~(~~phi -> ~phi) -> ~~phi) -> (~phi -> ~(~~phi -> ~phi))))",
    },
    // 11. MP(7, 10)
    { _tag: "mp", leftIndex: 7, rightIndex: 10 },
    // 12. MP(11, 9)
    { _tag: "mp", leftIndex: 11, rightIndex: 9 },
    // 13. MP(8, 12)
    { _tag: "mp", leftIndex: 8, rightIndex: 12 },
    // 14
    {
      _tag: "axiom",
      formulaText:
        "(~~phi -> (~phi -> ~(~~phi -> ~phi))) -> ((~~phi -> ~phi) -> (~~phi -> ~(~~phi -> ~phi)))",
    },
    // 15. MP(13, 14)
    { _tag: "mp", leftIndex: 13, rightIndex: 14 },
    // 16
    {
      _tag: "axiom",
      formulaText: "(~~phi -> ~(~~phi -> ~phi)) -> ((~~phi -> ~phi) -> ~phi)",
    },
    // 17
    {
      _tag: "axiom",
      formulaText:
        "((~~phi -> ~phi) -> ((~~phi -> ~(~~phi -> ~phi)) -> ((~~phi -> ~phi) -> ~phi))) -> (((~~phi -> ~phi) -> (~~phi -> ~(~~phi -> ~phi))) -> ((~~phi -> ~phi) -> ((~~phi -> ~phi) -> ~phi)))",
    },
    // 18
    {
      _tag: "axiom",
      formulaText:
        "((~~phi -> ~(~~phi -> ~phi)) -> ((~~phi -> ~phi) -> ~phi)) -> ((~~phi -> ~phi) -> ((~~phi -> ~(~~phi -> ~phi)) -> ((~~phi -> ~phi) -> ~phi)))",
    },
    // 19. MP(16, 18)
    { _tag: "mp", leftIndex: 16, rightIndex: 18 },
    // 20. MP(19, 17)
    { _tag: "mp", leftIndex: 19, rightIndex: 17 },
    // 21. MP(15, 20)
    { _tag: "mp", leftIndex: 15, rightIndex: 20 },
    // 22
    {
      _tag: "axiom",
      formulaText:
        "((~~phi -> ~phi) -> ((~~phi -> ~phi) -> ~phi)) -> (((~~phi -> ~phi) -> (~~phi -> ~phi)) -> ((~~phi -> ~phi) -> ~phi))",
    },
    // 23. MP(21, 22)
    { _tag: "mp", leftIndex: 21, rightIndex: 22 },
    // 24
    {
      _tag: "axiom",
      formulaText:
        "((~~phi -> ~phi) -> (((~~phi -> ~phi) -> (~~phi -> ~phi)) -> (~~phi -> ~phi))) -> (((~~phi -> ~phi) -> ((~~phi -> ~phi) -> (~~phi -> ~phi))) -> ((~~phi -> ~phi) -> (~~phi -> ~phi)))",
    },
    // 25
    {
      _tag: "axiom",
      formulaText:
        "(~~phi -> ~phi) -> (((~~phi -> ~phi) -> (~~phi -> ~phi)) -> (~~phi -> ~phi))",
    },
    // 26. MP(25, 24)
    { _tag: "mp", leftIndex: 25, rightIndex: 24 },
    // 27
    {
      _tag: "axiom",
      formulaText: "(~~phi -> ~phi) -> ((~~phi -> ~phi) -> (~~phi -> ~phi))",
    },
    // 28. MP(27, 26)
    { _tag: "mp", leftIndex: 27, rightIndex: 26 },
    // 29. MP(28, 23)
    { _tag: "mp", leftIndex: 28, rightIndex: 23 },
    // 30
    {
      _tag: "axiom",
      formulaText:
        "(~~~phi -> ((~~phi -> ~phi) -> ~phi)) -> ((~~~phi -> (~~phi -> ~phi)) -> (~~~phi -> ~phi))",
    },
    // 31
    {
      _tag: "axiom",
      formulaText:
        "((~~phi -> ~phi) -> ~phi) -> (~~~phi -> ((~~phi -> ~phi) -> ~phi))",
    },
    // 32. MP(29, 31)
    { _tag: "mp", leftIndex: 29, rightIndex: 31 },
    // 33. MP(32, 30)
    { _tag: "mp", leftIndex: 32, rightIndex: 30 },
    // 34. MP(6, 33): ¬¬¬φ→¬φ
    { _tag: "mp", leftIndex: 6, rightIndex: 33 },

    // --- A3 + MP で φ→¬¬φ を導出 ---
    // 35. A3[φ/¬¬φ, ψ/φ]: (¬¬¬φ→¬φ)→(φ→¬¬φ)
    { _tag: "axiom", formulaText: "(~~~phi -> ~phi) -> (phi -> ~~phi)" },
    // 36. MP(34, 35): φ→¬¬φ
    { _tag: "mp", leftIndex: 34, rightIndex: 35 },
  ],
};

// prop-16, prop-20, prop-21, prop-26, prop-27, prop-29 は
// DNE/DNIのインライン展開が必要で50-100+ステップとなるため、後続イテレーションで追加予定。

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
  // propositional-intermediate
  prop11PremiseMerge,
  prop13Frege,
  prop35MendelsonIdentity,
  prop33MpImplication,
  prop10Bcombi,
  prop34WeakeningElim,
  prop14DoubleImplDist,
  // propositional-negation
  prop19ContraposReverse,
  prop18ExFalso,
  prop28Clavius,
  prop17DNE,
  prop25TripleNeg,
  prop15DNI,
];

/** QuestId → ModelAnswer のマップ */
export const modelAnswerRegistry: ReadonlyMap<string, ModelAnswer> = new Map(
  builtinModelAnswers.map((a) => [a.questId, a]),
);
