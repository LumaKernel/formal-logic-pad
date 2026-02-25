/**
 * ビルトインクエスト問題の定義。
 *
 * dev/quest-problems/ のドキュメントをコード化したもの。
 * 新しいクエストを追加する場合はここに追記し、テストも同期すること。
 *
 * 変更時は builtinQuests.test.ts も同期すること。
 */

import type { QuestDefinition } from "./questDefinition";

// --- Level 1: 公理のインスタンス化とMP入門 ---

const q01Identity: QuestDefinition = {
  id: "prop-01",
  category: "propositional-basics",
  title: "恒等律 (Identity)",
  description: "φ → φ を証明せよ。SKK = I の対応を体験する。",
  difficulty: 1,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "phi -> phi",
      label: "Goal: φ → φ",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "A1とA2の具体的なインスタンスを組み合わせます。",
    "A1: φ → ((φ → φ) → φ) のインスタンスを作ってみましょう。",
    "A2: 上の結果と組み合わせて (φ → (φ → φ)) → (φ → φ) を導きましょう。",
  ],
  estimatedSteps: 5,
  learningPoint:
    "A2 (S公理) は「関数適用の分配」に相当する。この証明はSKK = I の対応。",
  order: 1,
};

const q02ConstantComposition: QuestDefinition = {
  id: "prop-02",
  category: "propositional-basics",
  title: "定数関数の合成",
  description: "ψ → (φ → φ) を証明せよ。A1で既知の定理を「持ち上げる」。",
  difficulty: 1,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "psi -> (phi -> phi)",
      label: "Goal: ψ → (φ → φ)",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "まずQ-01と同じ手順で φ → φ を導出しましょう。",
    "A1: (φ → φ) → (ψ → (φ → φ)) のインスタンスを作りましょう。",
    "MPで組み合わせれば完成です。",
  ],
  estimatedSteps: 7,
  learningPoint:
    "A1 (K公理) は「結論を前提で持ち上げる」。既に証明した定理は再利用できる。",
  order: 2,
};

const q03TransitivityPrep: QuestDefinition = {
  id: "prop-03",
  category: "propositional-basics",
  title: "推移律の準備",
  description:
    "(φ → ψ) → ((ψ → χ) → (φ → ψ)) を証明せよ。A1の直接のインスタンス。",
  difficulty: 1,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "(phi -> psi) -> ((psi -> chi) -> (phi -> psi))",
      label: "Goal",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "この式はA1のインスタンスです。",
    "A1のφに「φ → ψ」、ψに「ψ → χ」を代入してみましょう。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "公理のメタ変数にはどんな式でも代入できる。単純な式だけでなく、含意式も代入可能。",
  order: 3,
};

// --- Level 2: MPチェインの基本 ---

const q04HypotheticalSyllogism: QuestDefinition = {
  id: "prop-04",
  category: "propositional-basics",
  title: "推移律 (Hypothetical Syllogism)",
  description:
    "(φ → ψ) → ((ψ → χ) → (φ → χ)) を証明せよ。Hilbert系で最も基本かつ頻出の補題。",
  difficulty: 2,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "(phi -> psi) -> ((psi -> chi) -> (phi -> chi))",
      label: "Goal",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "A2でφ→(ψ→χ)の形を作り、A1で前提を持ち上げます。",
    "A2: (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ)) をそのまま使いましょう。",
    "A1でψ→χをφの前提に持ち上げ、S公理で分配します。",
  ],
  estimatedSteps: 11,
  learningPoint:
    "推移律はHilbert系で最も基本的かつ頻出の補題。以降の証明で多用する。",
  order: 4,
};

const q05ImplicationWeakening: QuestDefinition = {
  id: "prop-05",
  category: "propositional-basics",
  title: "含意の弱化",
  description: "φ → (ψ → (χ → ψ)) を証明せよ。K公理の2重適用。",
  difficulty: 2,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "phi -> (psi -> (chi -> psi))",
      label: "Goal",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "A1のインスタンスをA1で持ち上げます。",
    "A1: ψ → (χ → ψ) をまず作りましょう。",
    "A1: (ψ → (χ → ψ)) → (φ → (ψ → (χ → ψ))) で持ち上げます。",
  ],
  estimatedSteps: 3,
  learningPoint: "K公理の2重適用。「不要な前提を追加する」操作。",
  order: 5,
};

const q06SSpecialCase: QuestDefinition = {
  id: "prop-06",
  category: "propositional-basics",
  title: "S公理の特殊ケース",
  description:
    "(φ → (φ → ψ)) → (φ → ψ) を証明せよ。「φが2回必要な含意」を1回に圧縮。",
  difficulty: 2,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "(phi -> (phi -> psi)) -> (phi -> psi)",
      label: "Goal",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "A2でψをφに置き換えてみましょう。",
    "A2: (φ → (φ → ψ)) → ((φ → φ) → (φ → ψ)) を使います。",
    "Q-01の手順で φ → φ を導出し、推移律的に組み合わせます。",
  ],
  estimatedSteps: 12,
  learningPoint:
    "「φ → (φ → ψ)」は「φが2回必要な含意」。S公理で1回分に圧縮できる。",
  order: 6,
};

const q07Permutation: QuestDefinition = {
  id: "prop-07",
  category: "propositional-basics",
  title: "含意の交換 (C Combinator)",
  description:
    "(φ → (ψ → χ)) → (ψ → (φ → χ)) を証明せよ。前提の順序を入れ替える。",
  difficulty: 2,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "(phi -> (psi -> chi)) -> (psi -> (phi -> chi))",
      label: "Goal",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "A1でψをφ → ...の中に持ち上げ、A2で分配します。",
    "A1: ψ → (φ → ψ) をまず使います。",
    "推移律で接続して完成させます。",
  ],
  estimatedSteps: 15,
  learningPoint:
    "C combinator に対応。前提の順序は自由に入れ替えられる（ただし手間がかかる）。",
  order: 7,
};

// --- Level 2-3: 命題論理の中級 ---

const q08TransitivityChain: QuestDefinition = {
  id: "prop-08",
  category: "propositional-intermediate",
  title: "推移律の3段チェイン",
  description:
    "(φ → ψ) → ((ψ → χ) → ((χ → θ) → (φ → θ))) を証明せよ。推移律を2回適用する。",
  difficulty: 2,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText:
        "(phi -> psi) -> ((psi -> chi) -> ((chi -> theta) -> (phi -> theta)))",
      label: "Goal",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "推移律 (Q-04) を2回適用します。",
    "まず推移律で (φ → ψ) → ((ψ → χ) → (φ → χ)) を導きましょう。",
    "次に推移律で (φ → χ) → ((χ → θ) → (φ → θ)) を導き、組み合わせます。",
  ],
  estimatedSteps: 25,
  learningPoint: "推移律は任意の長さのチェインに拡張できる。",
  order: 1,
};

const q10BComposition: QuestDefinition = {
  id: "prop-10",
  category: "propositional-intermediate",
  title: "B combinator (合成)",
  description:
    "(ψ → χ) → ((φ → ψ) → (φ → χ)) を証明せよ。推移律の前提を入れ替えたもの。",
  difficulty: 3,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "(psi -> chi) -> ((phi -> psi) -> (phi -> chi))",
      label: "Goal",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "推移律 (Q-04) を出発点にします。",
    "推移律: (φ → ψ) → ((ψ → χ) → (φ → χ))",
    "含意の交換 (Q-07) を推移律に適用して前提を入れ替えましょう。",
  ],
  estimatedSteps: 20,
  learningPoint: "B combinator: Bxyz = x(yz)。関数合成に対応。",
  order: 2,
};

const q11PremiseConfluence: QuestDefinition = {
  id: "prop-11",
  category: "propositional-intermediate",
  title: "前提の合流",
  description: "(φ → (ψ → χ)) → ((φ → ψ) → (φ → χ)) を証明せよ。A2そのもの。",
  difficulty: 3,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
      label: "Goal",
      position: { x: 400, y: 500 },
    },
  ],
  hints: ["この式はある公理のインスタンスです。", "A2をよく見てみましょう。"],
  estimatedSteps: 1,
  learningPoint:
    "一見難しそうに見えても公理のインスタンスであることがある。メタ変数への代入パターンを見抜く力が重要。",
  order: 3,
};

const q12LeftAssociation: QuestDefinition = {
  id: "prop-12",
  category: "propositional-intermediate",
  title: "含意の左結合化",
  description:
    "((φ → ψ) → (φ → χ)) → (φ → (ψ → χ)) を証明せよ。演繹定理の逆方向。",
  difficulty: 3,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "((phi -> psi) -> (phi -> chi)) -> (phi -> (psi -> chi))",
      label: "Goal",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "A1でψをφ → ...の中に持ち上げます。",
    "A1: ψ → (φ → ψ) を出発点にします。",
    "推移律で (φ → ψ) → (φ → χ) の前提側を変形し、含意の交換 (Q-07) で整理します。",
  ],
  estimatedSteps: 20,
  learningPoint:
    "含意の「右結合」と「左結合」を相互変換する技法。演繹定理の逆方向。",
  order: 4,
};

const q13FregeTheorem: QuestDefinition = {
  id: "prop-13",
  category: "propositional-intermediate",
  title: "Frege の定理",
  description:
    "(φ → (ψ → χ)) → ((φ → ψ) → (φ → χ)) を証明せよ。歴史的に重要な法則。",
  difficulty: 3,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
      label: "Goal",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "これもある公理のインスタンスです。",
    "Q-11と同じゴールですが、歴史的文脈で「Fregeの定理」と呼ばれます。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "Frege は歴史上最初にこの法則を明示的に公理として採用した。同じ定理が異なる文脈で別名を持つことがある。",
  order: 5,
};

const q14DoubleImplicationDistribution: QuestDefinition = {
  id: "prop-14",
  category: "propositional-intermediate",
  title: "二重含意の分配",
  description:
    "(φ → ψ) → ((φ → (ψ → χ)) → (φ → χ)) を証明せよ。前提の並び替え。",
  difficulty: 3,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "(phi -> psi) -> ((phi -> (psi -> chi)) -> (phi -> chi))",
      label: "Goal",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "A2の結論部分に推移律を適用する形です。",
    "A2: (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))",
    "含意の交換 (Q-07) で前提の順序を入れ替えます。",
  ],
  estimatedSteps: 18,
  learningPoint: "前提の並び替えはHilbert系では頻出操作。慣れが必要。",
  order: 6,
};

// --- Level 3: 否定公理 A3 の活用 ---

const q15DoubleNegationIntro: QuestDefinition = {
  id: "prop-15",
  category: "propositional-negation",
  title: "二重否定導入 (DNI)",
  description: "φ → ¬¬φ を証明せよ。否定公理 A3 を本格的に使う最初の問題。",
  difficulty: 3,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "phi -> ~~phi",
      label: "Goal: φ → ¬¬φ",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "A3: (¬φ → ¬ψ) → (ψ → φ) を活用します。",
    "A3 に φ=¬¬φ, ψ=φ を代入: (¬¬¬φ → ¬φ) → (φ → ¬¬φ) を得ます。",
    "中間補題 Clavius' Law「(¬α → α) → α」を先に証明すると見通しがよくなります。",
  ],
  estimatedSteps: 15,
  learningPoint:
    "二重否定導入は古典論理の基本。A3 の使い方の典型例であり、以降の否定関連証明の出発点。",
  order: 1,
};

const q16ModusTollens: QuestDefinition = {
  id: "prop-16",
  category: "propositional-negation",
  title: "Modus Tollens",
  description: "(φ → ψ) → (¬ψ → ¬φ) を証明せよ。対偶（否定的推論）。",
  difficulty: 3,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "(phi -> psi) -> (~psi -> ~phi)",
      label: "Goal: (φ → ψ) → (¬ψ → ¬φ)",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "DNI (Q-15) を出発点にします: ψ → ¬¬ψ。",
    "A3 に φ=¬φ, ψ=¬ψ を代入: (¬¬φ → ¬¬ψ) → (¬ψ → ¬φ)。",
    "B combinator (Q-10) と DNE (Q-17) を使って φ → ψ を ¬¬φ → ¬¬ψ に変形します。",
  ],
  estimatedSteps: 20,
  learningPoint:
    "Modus Tollens は対偶の直接的な帰結。DNI と A3 の組合せで導出する。",
  order: 2,
};

const q17DoubleNegationElim: QuestDefinition = {
  id: "prop-17",
  category: "propositional-negation",
  title: "二重否定除去 (DNE)",
  description: "¬¬φ → φ を証明せよ。古典論理と直観主義論理を分ける分水嶺。",
  difficulty: 3,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "~~phi -> phi",
      label: "Goal: ¬¬φ → φ",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "DNI (Q-15) を ¬φ に適用: ¬φ → ¬¬¬φ。",
    "A3 に φ=φ, ψ=¬¬φ を代入: (¬φ → ¬¬¬φ) → (¬¬φ → φ)。",
    "MP で組み合わせれば 3 ステップで完成（DNI を補題として使う場合）。",
  ],
  estimatedSteps: 18,
  learningPoint:
    "DNE は古典論理と直観主義論理を分ける分水嶺。Łukasiewicz 系では A3 から DNI 経由で導出可能。",
  order: 3,
};

const q18ExFalso: QuestDefinition = {
  id: "prop-18",
  category: "propositional-negation",
  title: "爆発律 (Ex Falso Quodlibet)",
  description: "¬φ → (φ → ψ) を証明せよ。矛盾からは何でも出る。",
  difficulty: 4,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "~phi -> (phi -> psi)",
      label: "Goal: ¬φ → (φ → ψ)",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "A1: ¬φ → (¬ψ → ¬φ) を作ります。",
    "A3 に φ=ψ, ψ=φ を代入: (¬ψ → ¬φ) → (φ → ψ)。",
    "推移律 (HS) で接続すれば 3 ステップで完成。",
  ],
  estimatedSteps: 14,
  learningPoint:
    "古典論理では矛盾からはどんな命題も導出できる（爆発律）。A1 と A3 の組合せで簡潔に証明可能。",
  order: 4,
};

const q19ConverseContraposition: QuestDefinition = {
  id: "prop-19",
  category: "propositional-negation",
  title: "対偶の逆",
  description: "(¬ψ → ¬φ) → (φ → ψ) を証明せよ。A3 そのもの。",
  difficulty: 4,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "(~psi -> ~phi) -> (phi -> psi)",
      label: "Goal: (¬ψ → ¬φ) → (φ → ψ)",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "これはある公理のインスタンスです。",
    "A3: (¬φ → ¬ψ) → (ψ → φ) をよく見てみましょう。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "A3 がまさにこの形であることを再確認。メタ変数への代入パターンを見抜く力が重要。",
  order: 5,
};

// --- 全ビルトインクエスト ---

/** 全ビルトインクエスト定義 */
export const builtinQuests: readonly QuestDefinition[] = [
  q01Identity,
  q02ConstantComposition,
  q03TransitivityPrep,
  q04HypotheticalSyllogism,
  q05ImplicationWeakening,
  q06SSpecialCase,
  q07Permutation,
  q08TransitivityChain,
  q10BComposition,
  q11PremiseConfluence,
  q12LeftAssociation,
  q13FregeTheorem,
  q14DoubleImplicationDistribution,
  q15DoubleNegationIntro,
  q16ModusTollens,
  q17DoubleNegationElim,
  q18ExFalso,
  q19ConverseContraposition,
];
