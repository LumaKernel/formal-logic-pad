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

// --- Level 4: 否定と含意の相互作用（続き） ---

const q20LawOfExcludedMiddle: QuestDefinition = {
  id: "prop-20",
  category: "propositional-negation",
  title: "排中律 (Law of Excluded Middle)",
  description:
    "¬φ ∨ φ を証明せよ。選言の定義 α ∨ β ≡ ¬α → β を使えば DNE と同値。",
  difficulty: 4,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "~phi \\/ phi",
      label: "Goal: ¬φ ∨ φ",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "選言 α ∨ β は ¬α → β として定義されています。",
    "つまりゴールは ¬¬φ → φ（二重否定除去）と同値です。",
    "Q-17 (DNE) の証明を再利用しましょう。",
  ],
  estimatedSteps: 18,
  learningPoint:
    "選言の定義 α ∨ β ≡ ¬α → β を使えば、排中律は二重否定除去 (DNE) と等価。",
  order: 6,
};

const q21PeirceLaw: QuestDefinition = {
  id: "prop-21",
  category: "propositional-negation",
  title: "Peirce の法則",
  description:
    "((φ → ψ) → φ) → φ を証明せよ。古典論理に特有の法則。排中律・DNE と等価。",
  difficulty: 4,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "((phi -> psi) -> phi) -> phi",
      label: "Goal: ((φ → ψ) → φ) → φ",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "A3（対偶）を複数回使う複雑な証明が必要です。",
    "爆発律 (Q-18) と推移律を活用します。",
    "DNE (Q-17) と組み合わせると見通しがよくなります。",
  ],
  estimatedSteps: 30,
  learningPoint:
    "Peirce の法則は古典論理と直観主義論理を分ける等価条件のひとつ。排中律、DNE と等価。",
  order: 7,
};

// --- Level 5: 挑戦問題（連言・選言の定義展開） ---

const q22ConjunctionIntro: QuestDefinition = {
  id: "prop-22",
  category: "propositional-advanced",
  title: "連言の導入 (Conjunction Introduction)",
  description:
    "φ → (ψ → (φ ∧ ψ)) を証明せよ。連言 α ∧ β ≡ ¬(α → ¬β) の定義を使う。",
  difficulty: 5,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "phi -> (psi -> (phi /\\ psi))",
      label: "Goal: φ → (ψ → (φ ∧ ψ))",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "連言 α ∧ β は ¬(α → ¬β) として定義されています。",
    "ゴールを展開: φ → (ψ → ¬(φ → ¬ψ))。",
    "A1, A2, A3 と二重否定の処理を組み合わせる非常に長い証明になります。",
  ],
  estimatedSteps: 40,
  learningPoint:
    "Hilbert 系で連言を直接扱うのは非常に手間がかかる。自然演繹の方がはるかに簡潔。",
  order: 1,
};

const q23ConjunctionElim: QuestDefinition = {
  id: "prop-23",
  category: "propositional-advanced",
  title: "連言の除去 (Conjunction Elimination)",
  description:
    "(φ ∧ ψ) → φ を証明せよ。連言 α ∧ β ≡ ¬(α → ¬β) の定義を展開し二重否定除去を使う。",
  difficulty: 5,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "(phi /\\ psi) -> phi",
      label: "Goal: (φ ∧ ψ) → φ",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "連言を定義で展開: ¬(φ → ¬ψ) → φ。",
    "対偶を取って変形します。",
    "A1, A3, 推移律を組み合わせましょう。",
  ],
  estimatedSteps: 25,
  learningPoint:
    "連言の除去も定義の展開が必要。左射影 (φ∧ψ→φ) と右射影 (φ∧ψ→ψ) は別々に証明する。",
  order: 2,
};

const q24DeMorgan: QuestDefinition = {
  id: "prop-24",
  category: "propositional-advanced",
  title: "De Morgan の法則",
  description:
    "¬(φ ∨ ψ) → (¬φ ∧ ¬ψ) を証明せよ。選言と連言の定義を展開し否定の性質を使う。",
  difficulty: 5,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "~(phi \\/ psi) -> (~phi /\\ ~psi)",
      label: "Goal: ¬(φ ∨ ψ) → (¬φ ∧ ¬ψ)",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "選言の定義: φ ∨ ψ ≡ ¬φ → ψ。連言の定義: α ∧ β ≡ ¬(α → ¬β)。",
    "展開すると: ¬(¬φ → ψ) → ¬(¬φ → ¬¬ψ)。",
    "二重否定導入 ψ → ¬¬ψ を使って内部を変形します。",
  ],
  estimatedSteps: 40,
  learningPoint:
    "De Morgan の法則は命題論理の重要な等価性。Hilbert 系では証明が非常に長くなる典型例。",
  order: 3,
};

// --- Level 3-4: 否定公理の追加問題 ---

const q25TripleNegationElim: QuestDefinition = {
  id: "prop-25",
  category: "propositional-negation",
  title: "三重否定除去",
  description:
    "¬¬¬φ → ¬φ を証明せよ。三重否定を一重否定に還元する（戸次7.23）。",
  difficulty: 3,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "~~~phi -> ~phi",
      label: "Goal: ¬¬¬φ → ¬φ",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "DNE (¬¬φ → φ) を ¬φ に適用して ¬¬¬φ → ¬φ を直接得る方法を考えましょう。",
    "DNE: ¬¬α → α のαに¬φを代入します。",
    "DNEが補題として使える場合は1ステップで完了します。",
  ],
  estimatedSteps: 18,
  learningPoint:
    "三重否定除去はDNEの直接的な帰結。¬¬(¬φ) → ¬φ はDNEのインスタンス。しかしDNE自体の証明を含めると長い。",
  order: 8,
};

const q26ConsequentiaMirabilis: QuestDefinition = {
  id: "prop-26",
  category: "propositional-negation",
  title: "驚嘆すべき帰結 (CM)",
  description:
    "(φ → ¬φ) → ¬φ を証明せよ。自己矛盾する仮定から否定を導く（戸次7.24）。",
  difficulty: 3,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "(phi -> ~phi) -> ~phi",
      label: "Goal: (φ → ¬φ) → ¬φ",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "S公理の特殊ケース (Q-06) と恒等律 (Q-01) を組み合わせます。",
    "A2: (φ → (φ → ¬φ)) → ((φ → φ) → (φ → ¬φ)) のφ→¬φ版を考えます。",
    "(φ → ¬φ) は「φが2回必要な含意」の形。Q-06のパターンが使えます。",
  ],
  estimatedSteps: 15,
  learningPoint:
    "Consequentia mirabilis（驚嘆すべき帰結）はラテン語由来の古典的定理。自己矛盾する仮定を排除する推論パターン。",
  order: 9,
};

const q27Contraposition2: QuestDefinition = {
  id: "prop-27",
  category: "propositional-negation",
  title: "対偶律 (CON2)",
  description:
    "(φ → ¬ψ) → (ψ → ¬φ) を証明せよ。否定を含む対偶律の第2形態（戸次7.29）。",
  difficulty: 3,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "(phi -> ~psi) -> (psi -> ~phi)",
      label: "Goal: (φ → ¬ψ) → (ψ → ¬φ)",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "DNI (ψ → ¬¬ψ) と推移律で ψ → ¬¬ψ → ... の形を作ります。",
    "A3: (¬α → ¬β) → (β → α) を活用します。",
    "φ → ¬ψ の対偶を取ることで ¬¬ψ → ¬φ を導き、DNIと推移律で結合します。",
  ],
  estimatedSteps: 20,
  learningPoint:
    "対偶律は4つの形態 (CON1-CON4) がある。CON1 (Modus Tollens) と CON2 はSK体系でも証明可能。",
  order: 10,
};

const q28ClaviusLaw: QuestDefinition = {
  id: "prop-28",
  category: "propositional-negation",
  title: "Clavius の法則 (CM*)",
  description:
    "(¬φ → φ) → φ を証明せよ。CMの双対。古典論理の重要な定理（戸次7.55）。",
  difficulty: 4,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "(~phi -> phi) -> phi",
      label: "Goal: (¬φ → φ) → φ",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "DNE (¬¬φ → φ) を活用する戦略が有効です。",
    "推移律で (¬φ → φ) → (¬φ → ¬¬φ) → ... の形を作ります。",
    "CM (Q-26): (α → ¬α) → ¬α を ¬φ に適用して ¬φ → ¬¬φ → φ の形に持ち込みます。",
  ],
  estimatedSteps: 25,
  learningPoint:
    "Clavius の法則は古典論理に特有。直観主義論理では証明できない。CMと対を成す重要な定理。",
  order: 11,
};

const q29TertiumNonDatur: QuestDefinition = {
  id: "prop-29",
  category: "propositional-negation",
  title: "第三の可能性は存在しない (TND)",
  description:
    "(φ → ψ) → ((¬φ → ψ) → ψ) を証明せよ。場合分け推論の根幹（戸次7.81）。",
  difficulty: 4,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "(phi -> psi) -> ((~phi -> psi) -> psi)",
      label: "Goal: (φ → ψ) → ((¬φ → ψ) → ψ)",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "CM* (Q-28): (¬α → α) → α を出発点に考えます。",
    "φ → ψ と ¬φ → ψ の2つの前提から ψ を導く。",
    "推移律で (¬ψ → ¬φ) と (¬φ → ψ) を接続し、CM* のパターンに持ち込みます。",
  ],
  estimatedSteps: 30,
  learningPoint:
    "TND（tertium non datur）は場合分け推論の形式化。排中律 (LEM) と密接に関連する古典論理の基本法則。",
  order: 12,
};

// --- Level 5: 挑戦問題（追加） ---

const q30LawOfNonContradiction: QuestDefinition = {
  id: "prop-30",
  category: "propositional-advanced",
  title: "矛盾律 (LNC)",
  description:
    "¬(φ ∧ ¬φ) を証明せよ。矛盾は起こり得ないという基本法則（戸次7.40）。",
  difficulty: 5,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "~(phi /\\ ~phi)",
      label: "Goal: ¬(φ ∧ ¬φ)",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "連言の定義: α ∧ β ≡ ¬(α → ¬β) を展開します。",
    "φ ∧ ¬φ = ¬(φ → ¬¬φ) なので、ゴールは ¬¬(φ → ¬¬φ) です。",
    "DNI (α → ¬¬α) を φ → ¬¬φ に適用すれば (φ → ¬¬φ) が導け、DNI で二重否定にします。",
  ],
  estimatedSteps: 20,
  learningPoint:
    "矛盾律 (LNC) は最小論理 HM でも証明可能な基本法則。連言の定義を展開すると DNI で証明できる。",
  order: 4,
};

const q31ConjunctionElimRight: QuestDefinition = {
  id: "prop-31",
  category: "propositional-advanced",
  title: "連言の右除去",
  description:
    "(φ ∧ ψ) → ψ を証明せよ。連言の右射影（右側要素の取り出し）。",
  difficulty: 5,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "(phi /\\ psi) -> psi",
      label: "Goal: (φ ∧ ψ) → ψ",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "連言を定義で展開: ¬(φ → ¬ψ) → ψ。",
    "爆発律 (Q-18) と A3（対偶）を組み合わせます。",
    "Q-23の左射影と同様の手法だが、取り出す側が異なるため若干アプローチが変わります。",
  ],
  estimatedSteps: 25,
  learningPoint:
    "連言の除去には左射影 (φ∧ψ→φ) と右射影 (φ∧ψ→ψ) の2つが必要。Hilbert系では各々独立に証明する。",
  order: 5,
};

const q32DisjunctionElim: QuestDefinition = {
  id: "prop-32",
  category: "propositional-advanced",
  title: "選言除去 (Disjunction Elimination)",
  description:
    "(φ ∨ ψ) → ((φ → χ) → ((ψ → χ) → χ)) を証明せよ。場合分け推論の形式化。",
  difficulty: 5,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "(phi \\/ psi) -> ((phi -> chi) -> ((psi -> chi) -> chi))",
      label: "Goal: (φ ∨ ψ) → ((φ → χ) → ((ψ → χ) → χ))",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "選言の定義: φ ∨ ψ ≡ ¬φ → ψ を展開します。",
    "TND (Q-29) の考え方が使えます: φ → χ と ¬φ → ψ → χ の2つから χ を導く形。",
    "含意の交換 (Q-07) と推移律を多用する長い証明になります。",
  ],
  estimatedSteps: 45,
  learningPoint:
    "選言除去は場合分け推論の形式化。自然演繹では1ルールで済むが、Hilbert系では非常に長い証明が必要。",
  order: 6,
};

// --- ペアノ算術の基礎 ---

const qPA01SuccessorNotZero: QuestDefinition = {
  id: "peano-01",
  category: "peano-basics",
  title: "0は後者ではない (PA1)",
  description:
    "∀x. ¬(S(x) = 0) を証明せよ。ペアノ算術の最初の公理PA1を公理パレットから配置する。",
  difficulty: 1,
  systemPresetId: "peano",
  goals: [
    {
      formulaText: "all x. ~(S(x) = 0)",
      label: "Goal: ∀x. ¬(S(x) = 0)",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "PA1はペアノ算術の公理です。公理パレットから直接配置できます。",
    "PA1: ∀x. ¬(S(x) = 0) — 0はどの自然数の後者でもない。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "PA1は「0は後者関数の値域にない」という自然数の基本性質。公理はそのまま定理として使える。",
  order: 1,
};

const qPA02AdditionBase: QuestDefinition = {
  id: "peano-02",
  category: "peano-basics",
  title: "加法の基底 (PA3)",
  description: "∀x. x + 0 = x を証明せよ。加法の再帰定義の基底ケース。",
  difficulty: 1,
  systemPresetId: "peano",
  goals: [
    {
      formulaText: "all x. x + 0 = x",
      label: "Goal: ∀x. x + 0 = x",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "PA3は加法の基底を定義する公理です。",
    "公理パレットからPA3を配置すればゴールと一致します。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "PA3は「任意の自然数に0を加えても変わらない」という加法の基底ケース。算術の再帰定義の出発点。",
  order: 2,
};

const qPA03MultiplicationBase: QuestDefinition = {
  id: "peano-03",
  category: "peano-basics",
  title: "乗法の基底 (PA5)",
  description: "∀x. x * 0 = 0 を証明せよ。乗法の再帰定義の基底ケース。",
  difficulty: 1,
  systemPresetId: "peano",
  goals: [
    {
      formulaText: "all x. x * 0 = 0",
      label: "Goal: ∀x. x × 0 = 0",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "PA5は乗法の基底を定義する公理です。",
    "公理パレットからPA5を配置すればゴールと一致します。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "PA5は「任意の自然数と0の積は0」という乗法の基底ケース。PA3（加法基底）と対を成す。",
  order: 3,
};

const qPA04Reflexivity: QuestDefinition = {
  id: "peano-04",
  category: "peano-basics",
  title: "等号の反射律",
  description:
    "∀x. x = x を証明せよ。等号公理E1を使い、全称量化と組み合わせる。",
  difficulty: 1,
  systemPresetId: "peano",
  goals: [
    {
      formulaText: "all x. x = x",
      label: "Goal: ∀x. x = x",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "等号の反射律 E1 は公理パレットにあります。",
    "E1: ∀x. x = x をそのまま配置すれば完成です。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "E1（反射律）はPA体系の等号公理の一つ。ペアノ算術では等号が基本的な道具になる。",
  order: 4,
};

const qPA05SuccessorInjective: QuestDefinition = {
  id: "peano-05",
  category: "peano-basics",
  title: "後者関数の単射性 (PA2)",
  description:
    "∀x.∀y. S(x) = S(y) → x = y を証明せよ。後者関数が単射であることを示す。",
  difficulty: 1,
  systemPresetId: "peano",
  goals: [
    {
      formulaText: "all x. all y. S(x) = S(y) -> x = y",
      label: "Goal: ∀x.∀y. S(x) = S(y) → x = y",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "PA2は後者関数の単射性を保証する公理です。",
    "公理パレットからPA2を配置すればゴールと一致します。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "PA2は「S(x) = S(y) ならば x = y」を保証。PA1（0≠後者）と合わせて自然数の構造を規定する。",
  order: 5,
};

const qPA06AdditionRecursion: QuestDefinition = {
  id: "peano-06",
  category: "peano-basics",
  title: "加法の再帰 (PA4)",
  description:
    "∀x.∀y. x + S(y) = S(x + y) を証明せよ。加法の再帰ステップの定義。",
  difficulty: 1,
  systemPresetId: "peano",
  goals: [
    {
      formulaText: "all x. all y. x + S(y) = S(x + y)",
      label: "Goal: ∀x.∀y. x + S(y) = S(x + y)",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "PA4は加法の再帰ステップを定義する公理です。",
    "公理パレットからPA4を配置すればゴールと一致します。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "PA4は「x + S(y) = S(x + y)」で加法の再帰ステップを定義。PA3（基底）とペアで加法を完全に定義する。",
  order: 6,
};

// --- ペアノ算術の推論 ---

const qPA07ZeroPlusZero: QuestDefinition = {
  id: "peano-07",
  category: "peano-arithmetic",
  title: "0 + 0 = 0",
  description:
    "0 + 0 = 0 を証明せよ。PA3の全称量化をA5で除去し、具体的な計算結果を導く。",
  difficulty: 2,
  systemPresetId: "peano",
  goals: [
    {
      formulaText: "0 + 0 = 0",
      label: "Goal: 0 + 0 = 0",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "PA3: ∀x. x + 0 = x から出発します。",
    "A5（∀x.φ(x) → φ(t)）でxに0を代入して 0 + 0 = 0 を得ます。",
    "PA3をA5でインスタンス化し、MPで適用します。",
  ],
  estimatedSteps: 3,
  learningPoint:
    "∀消去（A5 + MP）でPA公理を具体的な数に適用する基本技法。形式証明では「計算」もこの操作が必要。",
  order: 1,
};

const qPA08OnePlusZero: QuestDefinition = {
  id: "peano-08",
  category: "peano-arithmetic",
  title: "S(0) + 0 = S(0)",
  description: "S(0) + 0 = S(0) を証明せよ。PA3から1+0=1を導く。",
  difficulty: 2,
  systemPresetId: "peano",
  goals: [
    {
      formulaText: "S(0) + 0 = S(0)",
      label: "Goal: S(0) + 0 = S(0)",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "PA3: ∀x. x + 0 = x を使います。",
    "A5でxにS(0)を代入して S(0) + 0 = S(0) を得ます。",
  ],
  estimatedSteps: 3,
  learningPoint:
    "S(0)は自然数1を表す。PA3をS(0)にインスタンス化するだけで1+0=1が証明できる。",
  order: 2,
};

const qPA09ZeroTimesZero: QuestDefinition = {
  id: "peano-09",
  category: "peano-arithmetic",
  title: "0 × 0 = 0",
  description:
    "0 * 0 = 0 を証明せよ。PA5の全称量化を除去して具体的に計算する。",
  difficulty: 2,
  systemPresetId: "peano",
  goals: [
    {
      formulaText: "0 * 0 = 0",
      label: "Goal: 0 × 0 = 0",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "PA5: ∀x. x * 0 = 0 を使います。",
    "A5でxに0を代入して 0 * 0 = 0 を得ます。",
  ],
  estimatedSteps: 3,
  learningPoint:
    "乗法の基底ケースPA5も同じ∀消去パターンで具体化。加法と乗法の基底は対称的。",
  order: 3,
};

const qPA10SuccessorNotZeroInstance: QuestDefinition = {
  id: "peano-10",
  category: "peano-arithmetic",
  title: "¬(S(0) = 0)",
  description: "¬(S(0) = 0) を証明せよ。PA1から「1≠0」を導く。",
  difficulty: 2,
  systemPresetId: "peano",
  goals: [
    {
      formulaText: "~(S(0) = 0)",
      label: "Goal: ¬(S(0) = 0)",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "PA1: ∀x. ¬(S(x) = 0) を使います。",
    "A5でxに0を代入して ¬(S(0) = 0) を得ます。",
  ],
  estimatedSteps: 3,
  learningPoint:
    "PA1のインスタンス化で「1 ≠ 0」が導ける。自然数論の最も基本的な事実。",
  order: 4,
};

const qPA11OnePlusOne: QuestDefinition = {
  id: "peano-11",
  category: "peano-arithmetic",
  title: "S(0) + S(0) = S(S(0))",
  description:
    "S(0) + S(0) = S(S(0)) を証明せよ。1+1=2の形式的証明。PA3とPA4を組み合わせる。",
  difficulty: 3,
  systemPresetId: "peano",
  goals: [
    {
      formulaText: "S(0) + S(0) = S(S(0))",
      label: "Goal: 1 + 1 = 2",
      position: { x: 400, y: 600 },
    },
  ],
  hints: [
    "PA4: ∀x.∀y. x + S(y) = S(x + y) をx=S(0), y=0でインスタンス化します。",
    "すると S(0) + S(0) = S(S(0) + 0) が得られます。",
    "PA3: ∀x. x + 0 = x をx=S(0)でインスタンス化し、等号推論で S(0) + 0 = S(0) を使います。",
  ],
  estimatedSteps: 10,
  learningPoint:
    "「1+1=2」の形式証明にはPA3、PA4、等号公理の組み合わせが必要。算術の「計算」は複数の公理の連鎖。",
  order: 5,
};

const qPA12RobinsonSurjectivity: QuestDefinition = {
  id: "peano-12",
  category: "peano-arithmetic",
  title: "後者の全射性 (Q7)",
  description: "∀x.(x = 0 ∨ ∃y.(x = S(y))) を証明せよ。Robinson算術Q7の公理。",
  difficulty: 1,
  systemPresetId: "robinson",
  goals: [
    {
      formulaText: "all x. x = 0 \\/ ex y. x = S(y)",
      label: "Goal: ∀x.(x = 0 ∨ ∃y.(x = S(y)))",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "Q7はRobinson算術の公理です。公理パレットから直接配置できます。",
    "Q7: ∀x.(x = 0 ∨ ∃y.(x = S(y))) — すべての自然数は0か、何かの後者。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "Q7はRobinson算術固有の公理。PAの帰納法スキーマの代わりに自然数の構造を保証する。",
  order: 6,
};

// --- 群論の基礎 ---

const qG01Associativity: QuestDefinition = {
  id: "group-01",
  category: "group-basics",
  title: "結合律 (G1)",
  description:
    "∀x.∀y.∀z. (x * y) * z = x * (y * z) を証明せよ。群の最も基本的な公理。",
  difficulty: 1,
  systemPresetId: "group-full",
  goals: [
    {
      formulaText: "all x. all y. all z. (x * y) * z = x * (y * z)",
      label: "Goal: ∀x.∀y.∀z. (x·y)·z = x·(y·z)",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "G1は群の結合律です。公理パレットから直接配置できます。",
    "G1: ∀x.∀y.∀z. (x * y) * z = x * (y * z)",
  ],
  estimatedSteps: 1,
  learningPoint:
    "結合律は群の定義で最も基本的な公理。括弧の付け方によらず演算結果が同じことを保証する。",
  order: 1,
};

const qG02LeftIdentity: QuestDefinition = {
  id: "group-02",
  category: "group-basics",
  title: "左単位元 (G2L)",
  description: "∀x. e * x = x を証明せよ。群の単位元の左からの性質。",
  difficulty: 1,
  systemPresetId: "group-full",
  goals: [
    {
      formulaText: "all x. e * x = x",
      label: "Goal: ∀x. e·x = x",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "G2Lは群の左単位元公理です。公理パレットから配置します。",
    "G2L: ∀x. e * x = x — eを左から掛けても変わらない。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "単位元eは群の演算の「何もしない要素」。左から掛けても元の要素を変えない。",
  order: 2,
};

const qG03LeftInverse: QuestDefinition = {
  id: "group-03",
  category: "group-basics",
  title: "左逆元 (G3L)",
  description:
    "∀x. i(x) * x = e を証明せよ。任意の元の左逆元が単位元を与える。",
  difficulty: 1,
  systemPresetId: "group-full",
  goals: [
    {
      formulaText: "all x. i(x) * x = e",
      label: "Goal: ∀x. i(x)·x = e",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "G3Lは群の左逆元公理です。公理パレットから配置します。",
    "G3L: ∀x. i(x) * x = e — 逆元を左から掛けると単位元になる。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "逆元i(x)は「xの効果を打ち消す」元。左から掛けると単位元eに戻る。",
  order: 3,
};

const qG04RightIdentity: QuestDefinition = {
  id: "group-04",
  category: "group-basics",
  title: "右単位元 (G2R)",
  description: "∀x. x * e = x を証明せよ。群の単位元の右からの性質。",
  difficulty: 1,
  systemPresetId: "group-full",
  goals: [
    {
      formulaText: "all x. x * e = x",
      label: "Goal: ∀x. x·e = x",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "G2Rは群の右単位元公理です。公理パレットから配置します。",
    "G2R: ∀x. x * e = x — eを右から掛けても変わらない。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "両側公理系では左右の単位元性が公理として与えられる。左公理系では右単位元は定理。",
  order: 4,
};

const qG05RightInverse: QuestDefinition = {
  id: "group-05",
  category: "group-basics",
  title: "右逆元 (G3R)",
  description: "∀x. x * i(x) = e を証明せよ。任意の元の右逆元。",
  difficulty: 1,
  systemPresetId: "group-full",
  goals: [
    {
      formulaText: "all x. x * i(x) = e",
      label: "Goal: ∀x. x·i(x) = e",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "G3Rは群の右逆元公理です。公理パレットから配置します。",
    "G3R: ∀x. x * i(x) = e — 逆元を右から掛けると単位元になる。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "両側公理系では左右の逆元性が公理として与えられる。左公理系では右逆元は定理。",
  order: 5,
};

const qG06Commutativity: QuestDefinition = {
  id: "group-06",
  category: "group-basics",
  title: "可換律 (G4)",
  description: "∀x.∀y. x * y = y * x を証明せよ。アーベル群の追加公理。",
  difficulty: 1,
  systemPresetId: "abelian-group",
  goals: [
    {
      formulaText: "all x. all y. x * y = y * x",
      label: "Goal: ∀x.∀y. x·y = y·x",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "G4はアーベル群の可換律公理です。公理パレットから配置します。",
    "G4: ∀x.∀y. x * y = y * x — 演算の順序を入れ替えられる。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "可換律は一般の群では成り立たない。可換律が成り立つ群を特にアーベル群（可換群）と呼ぶ。",
  order: 6,
};

// --- 群論の推論 ---

const qG07IdentityTimesIdentity: QuestDefinition = {
  id: "group-07",
  category: "group-proofs",
  title: "e * e = e",
  description:
    "単位元同士の積が単位元になることを証明せよ。G2Lの∀消去で導出する。",
  difficulty: 2,
  systemPresetId: "group-full",
  goals: [
    {
      formulaText: "e * e = e",
      label: "Goal: e·e = e",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "G2L: ∀x. e * x = x を使います。xをeに代入すれば e * e = e が得られます。",
    "A5（∀消去）を使って∀x.φ(x) から φ(e) を導出します。",
    "手順: G2L(公理) → A5インスタンス((∀x. e*x=x) → e*e=e) → MP",
  ],
  estimatedSteps: 3,
  learningPoint:
    "∀消去は「A5: (∀x.φ) → φ[t/x]」のインスタンスとMPの組み合わせ。群論でも同じパターンが使える。",
  order: 1,
};

const qG08InverseIdentity: QuestDefinition = {
  id: "group-08",
  category: "group-proofs",
  title: "i(e) * e = e",
  description:
    "単位元の逆元と単位元の積が単位元になることを証明せよ。G3Lの∀消去で導出。",
  difficulty: 2,
  systemPresetId: "group-full",
  goals: [
    {
      formulaText: "i(e) * e = e",
      label: "Goal: i(e)·e = e",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "G3L: ∀x. i(x) * x = e を使います。xをeに代入すれば i(e) * e = e が得られます。",
    "A5（∀消去）を使って∀x.φ(x) から φ(e) を導出します。",
    "手順: G3L(公理) → A5インスタンス → MP",
  ],
  estimatedSteps: 3,
  learningPoint:
    "逆元関数iは任意の元に適用可能。特にi(e)は単位元の逆元で、自分自身が単位元になる。",
  order: 2,
};

// --- 述語論理の基礎 ---

const qPred01UniversalElim: QuestDefinition = {
  id: "pred-01",
  category: "predicate-basics",
  title: "全称消去 (A4)",
  description:
    "∀x.P(x) → P(x) を証明せよ。A4（全称消去公理）の最も基本的なインスタンス。",
  difficulty: 1,
  systemPresetId: "predicate",
  goals: [
    {
      formulaText: "all x. P(x) -> P(x)",
      label: "Goal: ∀x.P(x) → P(x)",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "A4: ∀ξ.φ → φ[τ/ξ] のインスタンスを作ります。",
    "ξ=x, φ=P(x), τ=x として、∀x.P(x) → P(x)[x/x] = ∀x.P(x) → P(x) です。",
    "A4を配置するだけで完成します。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "A4（全称消去）は量化子∀を外す基本公理。∀x.φ(x) → φ(t) で任意の項tを代入できる。",
  order: 1,
};

const qPred02IdentityQuantified: QuestDefinition = {
  id: "pred-02",
  category: "predicate-basics",
  title: "全称化された恒等律",
  description:
    "∀x.(P(x) → P(x)) を証明せよ。命題論理の恒等律に Gen を適用する。",
  difficulty: 2,
  systemPresetId: "predicate",
  goals: [
    {
      formulaText: "all x. (P(x) -> P(x))",
      label: "Goal: ∀x.(P(x) → P(x))",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "まず命題論理の恒等律 P(x) → P(x) を証明します（A1, A2, MP）。",
    "次に Gen 規則を使って ∀x.(P(x) → P(x)) を得ます。",
    "Gen: φ が証明されていれば ∀x.φ も証明される。",
  ],
  estimatedSteps: 6,
  learningPoint:
    "Gen（汎化規則）は証明済みの式を全称量化する。定理に対してのみ適用可能であることに注意。",
  order: 2,
};

const qPred03UniversalSwap: QuestDefinition = {
  id: "pred-03",
  category: "predicate-basics",
  title: "全称量化子の交換",
  description:
    "∀x.∀y.P(x, y) → ∀y.∀x.P(x, y) を証明せよ。量化子の順序交換（例7.49）。",
  difficulty: 3,
  systemPresetId: "predicate",
  goals: [
    {
      formulaText: "all x. all y. P(x, y) -> all y. all x. P(x, y)",
      label: "Goal: ∀x.∀y.P(x,y) → ∀y.∀x.P(x,y)",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "∀x.∀y.P(x,y) から ∀y.∀x.P(x,y) を演繹することを目標にします。",
    "A4で外側の∀xを消去し、再びA4で∀yを消去して P(x,y) を得ます。",
    "Genでまず∀x.P(x,y)を得て、再びGenで∀y.∀x.P(x,y)を得ます。",
    "A5を使って∀の中に戻していく操作が必要です。",
  ],
  estimatedSteps: 10,
  learningPoint:
    "∀量化子の順序は交換可能。A4(消去)とA5+Gen(導入)の組み合わせで示す。",
  order: 3,
};

const qPred04ExistentialIntro: QuestDefinition = {
  id: "pred-04",
  category: "predicate-basics",
  title: "存在導入 (EI)",
  description:
    "P(x) → ∃x.P(x) を証明せよ。具体的な項から存在命題を導く基本操作。",
  difficulty: 1,
  systemPresetId: "predicate",
  goals: [
    {
      formulaText: "P(x) -> ex x. P(x)",
      label: "Goal: P(x) → ∃x.P(x)",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "∃x.P(x) は ¬∀x.¬P(x) の略記です。",
    "A4のインスタンスとして使えます。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "存在量化子の導入。P(t) が成り立てば ∃x.P(x) が成り立つ。",
  order: 4,
};

const qPred05ExistNegToNegUniv: QuestDefinition = {
  id: "pred-05",
  category: "predicate-basics",
  title: "∃x.¬P(x) → ¬∀x.P(x)",
  description:
    "「¬P(x) を満たすxが存在する」ならば「すべてのxがP(x) を満たすわけではない」ことを証明せよ。",
  difficulty: 3,
  systemPresetId: "predicate",
  goals: [
    {
      formulaText: "ex x. ~P(x) -> ~(all x. P(x))",
      label: "Goal: ∃x.¬P(x) → ¬∀x.P(x)",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "∃x.¬P(x) は ¬∀x.¬¬P(x) の略記です。",
    "A4を使って ∀x.P(x) → P(x) を得て、対偶操作と組み合わせます。",
    "A3（対偶律）が鍵です: (¬ψ → ¬φ) → (φ → ψ) の形。",
    "二重否定の導入・除去と推移律を活用します。",
  ],
  estimatedSteps: 15,
  learningPoint:
    "∃xと∀xの関係は否定を介して結ばれる。述語論理の対偶的推論の基本。",
  order: 5,
};

const qPred06UnivNegToNegExist: QuestDefinition = {
  id: "pred-06",
  category: "predicate-basics",
  title: "∀x.¬P(x) → ¬∃x.P(x)",
  description:
    "「すべてのxが¬P(x) を満たす」ならば「P(x) を満たすxは存在しない」ことを証明せよ。",
  difficulty: 3,
  systemPresetId: "predicate",
  goals: [
    {
      formulaText: "all x. ~P(x) -> ~(ex x. P(x))",
      label: "Goal: ∀x.¬P(x) → ¬∃x.P(x)",
      position: { x: 400, y: 500 },
    },
  ],
  hints: [
    "∃x.P(x) は ¬∀x.¬P(x) の略記です。",
    "¬∃x.P(x) は ¬¬∀x.¬P(x) 、すなわち二重否定の形です。",
    "∀x.¬P(x) から ∀x.¬P(x) への恒等律と、二重否定導入を組み合わせます。",
    "DNI（φ → ¬¬φ）のインスタンスを∀x.¬P(x)に適用します。",
  ],
  estimatedSteps: 8,
  learningPoint:
    "∀x.¬P(x) → ¬∃x.P(x) は量化子と否定の基本関係。∃の定義（¬∀¬）を展開して二重否定導入で証明。",
  order: 6,
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
  q20LawOfExcludedMiddle,
  q21PeirceLaw,
  q25TripleNegationElim,
  q26ConsequentiaMirabilis,
  q27Contraposition2,
  q28ClaviusLaw,
  q29TertiumNonDatur,
  q22ConjunctionIntro,
  q23ConjunctionElim,
  q24DeMorgan,
  q30LawOfNonContradiction,
  q31ConjunctionElimRight,
  q32DisjunctionElim,
  qPA01SuccessorNotZero,
  qPA02AdditionBase,
  qPA03MultiplicationBase,
  qPA04Reflexivity,
  qPA05SuccessorInjective,
  qPA06AdditionRecursion,
  qPA07ZeroPlusZero,
  qPA08OnePlusZero,
  qPA09ZeroTimesZero,
  qPA10SuccessorNotZeroInstance,
  qPA11OnePlusOne,
  qPA12RobinsonSurjectivity,
  qG01Associativity,
  qG02LeftIdentity,
  qG03LeftInverse,
  qG04RightIdentity,
  qG05RightInverse,
  qG06Commutativity,
  qG07IdentityTimesIdentity,
  qG08InverseIdentity,
  qPred01UniversalElim,
  qPred02IdentityQuantified,
  qPred03UniversalSwap,
  qPred04ExistentialIntro,
  qPred05ExistNegToNegUniv,
  qPred06UnivNegToNegExist,
];
