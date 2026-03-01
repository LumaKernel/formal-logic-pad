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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
    },
  ],
  hints: ["この式はある公理のインスタンスです。", "A2をよく見てみましょう。"],
  estimatedSteps: 1,
  learningPoint:
    "一見難しそうに見えても公理のインスタンスであることがある。メタ変数への代入パターンを見抜く力が重要。",
  order: 3,
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
};

// --- Level 2-3: 演繹定理の活用 ---

const q33ModusPonensImplication: QuestDefinition = {
  id: "prop-33",
  category: "propositional-intermediate",
  title: "MPの含意化",
  description:
    "φ → ((φ → ψ) → ψ) を証明せよ。Modus Ponensを含意の形で表現する。演繹定理的に「φを仮定し、φ→ψを仮定するとψが出る」ことの形式化。",
  difficulty: 2,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "phi -> ((phi -> psi) -> psi)",
      label: "Goal: φ → ((φ → ψ) → ψ)",
    },
  ],
  hints: [
    "演繹定理的に考えると: φを仮定し、φ→ψを仮定するとMPでψが出ます。",
    "A1: φ → ((φ → ψ) → φ) のインスタンスを作りましょう。",
    "A2で分配し、恒等律と組み合わせます。",
  ],
  estimatedSteps: 8,
  learningPoint:
    "MPの含意化はMP規則そのものを対象言語内で表現したもの。演繹定理の基本応用であり、φを仮定すればφ→ψからψが得られることの形式化。",
  order: 7,
  version: 1,
};

const q34ImplicationWeakeningElim: QuestDefinition = {
  id: "prop-34",
  category: "propositional-intermediate",
  title: "含意の弱化除去",
  description:
    "((φ → ψ) → χ) → (ψ → χ) を証明せよ。「φ→ψの証明にはψで十分」。演繹定理の典型的応用パターン。",
  difficulty: 3,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "((phi -> psi) -> chi) -> (psi -> chi)",
      label: "Goal: ((φ → ψ) → χ) → (ψ → χ)",
    },
  ],
  hints: [
    "A1: ψ → (φ → ψ) で ψ から φ → ψ を導けます。",
    "推移律 (Q-04) で A1 と仮定 (φ→ψ)→χ を接続します。",
    "B combinator (Q-10) を使うとより簡潔に構成できます。",
  ],
  estimatedSteps: 15,
  learningPoint:
    "演繹定理的に見ると「ψを仮定→A1でφ→ψ→仮定(φ→ψ)→χでχ」。A1の「持ち上げ」と推移律の組合せ。",
  order: 8,
  version: 1,
};

const q35MendelsonIdentity: QuestDefinition = {
  id: "prop-35",
  category: "propositional-intermediate",
  title: "Mendelson体系での恒等律",
  description:
    "φ → φ を Mendelson 体系 (A1, A2, M3) で証明せよ。Łukasiewicz体系と同じ証明が使える。体系が変わっても演繹定理の証明構造は共通。",
  difficulty: 2,
  systemPresetId: "mendelson",
  goals: [
    {
      formulaText: "phi -> phi",
      label: "Goal: φ → φ",
    },
  ],
  hints: [
    "Q-01 (Łukasiewicz体系) と全く同じ証明が使えます。",
    "恒等律の証明は A1 と A2 のみで構成されるため、A3/M3 の違いに影響されません。",
    "演繹定理の証明がA1とA2のみに依存することの実例です。",
  ],
  estimatedSteps: 5,
  learningPoint:
    "恒等律はA1+A2のみで証明可能。Łukasiewicz/Mendelson/Classical(HK)/Intuitionistic(HJ)すべてで同じ証明が使える。演繹定理の核心はA1(K)とA2(S)にある。",
  order: 9,
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
};

const q31ConjunctionElimRight: QuestDefinition = {
  id: "prop-31",
  category: "propositional-advanced",
  title: "連言の右除去",
  description: "(φ ∧ ψ) → ψ を証明せよ。連言の右射影（右側要素の取り出し）。",
  difficulty: 5,
  systemPresetId: "lukasiewicz",
  goals: [
    {
      formulaText: "(phi /\\ psi) -> psi",
      label: "Goal: (φ ∧ ψ) → ψ",
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
  version: 1,
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
    },
  ],
  hints: [
    "∃x.P(x) は ¬∀x.¬P(x) の略記です。",
    "A4のインスタンスとして使えます。",
  ],
  estimatedSteps: 1,
  learningPoint: "存在量化子の導入。P(t) が成り立てば ∃x.P(x) が成り立つ。",
  order: 4,
  version: 1,
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
  version: 1,
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
  version: 1,
};

// --- 自然演繹の基礎 ---

const qNd01Identity: QuestDefinition = {
  id: "nd-01",
  category: "nd-basics",
  title: "恒等律 (→I)",
  description:
    "φ → φ を自然演繹 NM で証明せよ。仮定を置いてそのまま解消する、→I の最も基本的な使い方。",
  difficulty: 1,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "phi -> phi",
      label: "Goal: φ → φ",
    },
  ],
  hints: [
    "仮定φを置きます。",
    "φからφは自明なので、→Iで仮定を解消して φ → φ を得ます。",
  ],
  estimatedSteps: 2,
  learningPoint:
    "→I（含意導入）は「φを仮定してψを導いたら、仮定を解消して φ → ψ を得る」規則。Hilbert系では5ステップ必要だった証明が2ステップで完了。",
  order: 1,
  version: 1,
};

const qNd02KAxiom: QuestDefinition = {
  id: "nd-02",
  category: "nd-basics",
  title: "K公理 (→Iの2重使用)",
  description:
    "φ → (ψ → φ) を自然演繹 NM で証明せよ。→Iを2回使って不要な前提を導入する。",
  difficulty: 1,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "phi -> (psi -> phi)",
      label: "Goal: φ → (ψ → φ)",
    },
  ],
  hints: [
    "まず仮定φを置きます。",
    "次に仮定ψを置きます。",
    "φは既に仮定されているので、→Iでψを解消してψ→φを得て、さらに→Iでφを解消します。",
  ],
  estimatedSteps: 3,
  learningPoint:
    "Hilbert系のK公理（A1）に対応する定理。自然演繹では→Iの入れ子で直接証明可能。",
  order: 2,
  version: 1,
};

const qNd03Contraposition: QuestDefinition = {
  id: "nd-03",
  category: "nd-basics",
  title: "対偶 (Modus Tollens)",
  description:
    "(φ → ψ) → (¬ψ → ¬φ) を自然演繹 NM で証明せよ。最小論理でも証明可能な対偶律。",
  difficulty: 2,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "(phi -> psi) -> (~psi -> ~phi)",
      label: "Goal: (φ → ψ) → (¬ψ → ¬φ)",
    },
  ],
  hints: [
    "仮定φ→ψ、仮定¬ψ、仮定φの3つを置きます。",
    "→Eでφ→ψとφからψを得て、→Eで¬ψとψから矛盾を導きます。",
    "→Iで仮定を順に解消していきます。",
  ],
  estimatedSteps: 6,
  learningPoint:
    "対偶律は最小論理NMでも証明可能。¬φ は φ → ⊥ の略記であり、→Iと→Eだけで構成できる。",
  order: 3,
  version: 1,
};

const qNd04ConjunctionCommutativity: QuestDefinition = {
  id: "nd-04",
  category: "nd-basics",
  title: "連言の交換律",
  description:
    "(φ ∧ ψ) → (ψ ∧ φ) を自然演繹 NM で証明せよ。∧Eと∧Iの組み合わせ。",
  difficulty: 1,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "(phi /\\ psi) -> (psi /\\ phi)",
      label: "Goal: (φ ∧ ψ) → (ψ ∧ φ)",
    },
  ],
  hints: [
    "仮定φ∧ψを置きます。",
    "∧E（左）でφを、∧E（右）でψを取り出します。",
    "∧Iでψとφを逆順に組み合わせてψ∧φを作り、→Iで仮定を解消します。",
  ],
  estimatedSteps: 4,
  learningPoint:
    "自然演繹では連言を∧Eで分解し、∧Iで再構成できる。Hilbert系では定義展開が必要だった操作が直接行える。",
  order: 4,
  version: 1,
};

const qNd05DisjunctionCommute: QuestDefinition = {
  id: "nd-05",
  category: "nd-basics",
  title: "選言の交換律",
  description:
    "(φ ∨ ψ) → (ψ ∨ φ) を自然演繹 NM で証明せよ。∨Eと∨Iの組み合わせ。",
  difficulty: 2,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "(phi \\/ psi) -> (psi \\/ phi)",
      label: "Goal: (φ ∨ ψ) → (ψ ∨ φ)",
    },
  ],
  hints: [
    "仮定φ∨ψを置きます。",
    "∨E（場合分け）を使います: φの場合は∨I(右)でψ∨φ、ψの場合は∨I(左)でψ∨φ。",
    "→Iで仮定を解消します。",
  ],
  estimatedSteps: 6,
  learningPoint:
    "∨E（選言除去）は場合分け推論。各ケースで同じ結論を導くことで選言を処理する。",
  order: 5,
  version: 1,
};

const qNd06DoubleNegationIntro: QuestDefinition = {
  id: "nd-06",
  category: "nd-basics",
  title: "二重否定導入 (DNI)",
  description:
    "φ → ¬¬φ を自然演繹 NM で証明せよ。最小論理でも証明可能な基本定理。",
  difficulty: 2,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "phi -> ~~phi",
      label: "Goal: φ → ¬¬φ",
    },
  ],
  hints: [
    "φを仮定し、さらに¬φを仮定します。",
    "→Eで¬φとφから⊥（矛盾）を導きます。",
    "→Iで¬φの仮定を解消して¬¬φを得、さらにφの仮定を解消します。",
  ],
  estimatedSteps: 4,
  learningPoint:
    "DNI は最小論理 NM でも証明可能。¬φ = φ → ⊥ なので、¬¬φ = (φ → ⊥) → ⊥。Hilbert系のA3は不要。",
  order: 6,
  version: 1,
};

const qNd07ExFalsoNJ: QuestDefinition = {
  id: "nd-07",
  category: "nd-basics",
  title: "爆発律 (EFQ)",
  description: "¬φ → (φ → ψ) を自然演繹 NJ で証明せよ。矛盾からは何でも出る。",
  difficulty: 2,
  systemPresetId: "nd-nj",
  goals: [
    {
      formulaText: "~phi -> (phi -> psi)",
      label: "Goal: ¬φ → (φ → ψ)",
    },
  ],
  hints: [
    "¬φを仮定し、φを仮定します。",
    "→Eで¬φとφから⊥を導きます。",
    "EFQで⊥からψを得て、→Iで仮定を順に解消します。",
  ],
  estimatedSteps: 5,
  learningPoint:
    "EFQ（Ex Falso Quodlibet）は NJ で追加される規則。最小論理 NM では矛盾から任意の命題を導けない。",
  order: 7,
  version: 1,
};

const qNd08ClaviusLawNK: QuestDefinition = {
  id: "nd-08",
  category: "nd-basics",
  title: "Clavius の法則 (CM*)",
  description:
    "(¬φ → φ) → φ を自然演繹 NK で証明せよ。古典論理の特徴的な推論パターン。",
  difficulty: 3,
  systemPresetId: "nd-nk",
  goals: [
    {
      formulaText: "(~phi -> phi) -> phi",
      label: "Goal: (¬φ → φ) → φ",
    },
  ],
  hints: [
    "¬φ→φ を仮定します。",
    "¬φ を仮定し、→E で φ を得ます。これは ¬φ の仮定と矛盾。",
    "→I で ¬¬φ を得て、DNE で φ を得ます。",
  ],
  estimatedSteps: 6,
  learningPoint:
    "Clavius の法則は古典論理 NK に特有。DNE（二重否定除去）が鍵。直観主義論理 NJ では証明不可能。",
  order: 8,
  version: 1,
};

const qNd09ExcludedMiddleNK: QuestDefinition = {
  id: "nd-09",
  category: "nd-basics",
  title: "排中律 (TND)",
  description: "φ ∨ ¬φ を自然演繹 NK で証明せよ。古典論理の核心的定理。",
  difficulty: 3,
  systemPresetId: "nd-nk",
  goals: [
    {
      formulaText: "phi \\/ ~phi",
      label: "Goal: φ ∨ ¬φ",
    },
  ],
  hints: [
    "¬(φ ∨ ¬φ) を仮定して矛盾を導きます。",
    "φを仮定し、∨I(左)でφ∨¬φ → ¬(φ∨¬φ)と矛盾 → ¬φ を得ます。",
    "¬φから∨I(右)でφ∨¬φ → ¬(φ∨¬φ)と矛盾 → ¬¬(φ∨¬φ) → DNEでφ∨¬φ。",
  ],
  estimatedSteps: 10,
  learningPoint:
    "排中律 (TND) は古典論理 NK の核心。直観主義論理 NJ では証明不可能。DNE と等価。",
  order: 9,
  version: 1,
};

const qNd10ConsequentiaMirabilisNK: QuestDefinition = {
  id: "nd-10",
  category: "nd-basics",
  title: "驚嘆すべき帰結 (CM)",
  description:
    "(φ → ¬φ) → ¬φ を自然演繹 NM で証明せよ。最小論理でも証明可能な自己矛盾パターン。",
  difficulty: 2,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "(phi -> ~phi) -> ~phi",
      label: "Goal: (φ → ¬φ) → ¬φ",
    },
  ],
  hints: [
    "φ→¬φ を仮定します。",
    "φ を仮定し、→E で ¬φ を得ます。→E で ¬φ と φ から ⊥ を導きます。",
    "→I で φ の仮定を解消して ¬φ を得ます。→I で φ→¬φ の仮定を解消します。",
  ],
  estimatedSteps: 5,
  learningPoint:
    "Consequentia mirabilis（驚嘆すべき帰結）は最小論理 NM でも証明可能。φ→¬φ は自己矛盾する仮定であり、¬φ が帰結する。",
  order: 10,
  version: 1,
};

// --- Level ND-2: 背理法・矛盾からの推論 (RAA, CON) ---

const qNd11RaaMinimal: QuestDefinition = {
  id: "nd-11",
  category: "nd-basics",
  title: "背理法 RAA¬ (NM)",
  description:
    "(φ → ψ) → (φ → ¬ψ) → ¬φ を自然演繹 NM で証明せよ。φの仮定から矛盾が導かれるなら¬φ。",
  difficulty: 2,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "(phi -> psi) -> (phi -> ~psi) -> ~phi",
      label: "Goal: (φ → ψ) → (φ → ¬ψ) → ¬φ",
    },
  ],
  hints: [
    "φ→ψ と φ→¬ψ と φ をそれぞれ仮定します。",
    "→E で φ→ψ と φ からψを、φ→¬ψ と φ から¬ψを得ます。",
    "→E で ¬ψ と ψ から ⊥ を導き、→I で φ を解消して ¬φ を得ます。外側の仮定も順に→Iで解消します。",
  ],
  estimatedSteps: 8,
  learningPoint:
    "背理法 RAA¬ は最小論理 NM の派生規則。φを仮定して矛盾（ψと¬ψの両方）が導かれるなら¬φが結論される。否定導入の一般化。",
  order: 11,
  version: 1,
};

const qNd12RaaClassical: QuestDefinition = {
  id: "nd-12",
  category: "nd-basics",
  title: "古典的背理法 RAA*¬ (NK)",
  description:
    "(¬φ → ψ) → (¬φ → ¬ψ) → φ を自然演繹 NK で証明せよ。¬φの仮定から矛盾が導かれるならφ。",
  difficulty: 3,
  systemPresetId: "nd-nk",
  goals: [
    {
      formulaText: "(~phi -> psi) -> (~phi -> ~psi) -> phi",
      label: "Goal: (¬φ → ψ) → (¬φ → ¬ψ) → φ",
    },
  ],
  hints: [
    "¬φ→ψ と ¬φ→¬ψ と ¬φ をそれぞれ仮定します。",
    "→E でψと¬ψを得て、→E で矛盾を導きます。→Iで¬φを解消して¬¬φを得ます。",
    "DNE で ¬¬φ から φ を得ます。外側の仮定を→Iで順に解消します。",
  ],
  estimatedSteps: 9,
  learningPoint:
    "古典的背理法 RAA*¬ は NK の派生規則。DNE が鍵。NJ では証明不可能で、古典論理と直観主義論理の違いを示す。",
  order: 12,
  version: 1,
};

const qNd13Con1: QuestDefinition = {
  id: "nd-13",
  category: "nd-basics",
  title: "矛盾からの推論 CON1 (NM)",
  description:
    "ψ → ¬ψ → ¬φ を自然演繹 NM で証明せよ。ψと¬ψが同時に成り立つなら任意の¬φが結論される。",
  difficulty: 2,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "psi -> ~psi -> ~phi",
      label: "Goal: ψ → ¬ψ → ¬φ",
    },
  ],
  hints: [
    "ψ と ¬ψ と φ をそれぞれ仮定します。",
    "→E で ¬ψ と ψ から ⊥ を導きます（¬ψ = ψ→⊥）。",
    "→I で φ を解消して ¬φ を得ます。外側の仮定も→Iで解消します。",
  ],
  estimatedSteps: 5,
  learningPoint:
    "CON1 は NM の派生規則。矛盾した前提（ψと¬ψ）からは任意の否定命題 ¬φ を導ける。EFQ との違いに注意：EFQ は任意のφ（否定なし）も導けるが、CON1 は ¬φ のみ。",
  order: 13,
  version: 1,
};

const qNd14Con4: QuestDefinition = {
  id: "nd-14",
  category: "nd-basics",
  title: "矛盾からの推論 CON4 (NK)",
  description:
    "¬ψ → ψ → φ を自然演繹 NK で証明せよ。矛盾した前提から任意のφが結論される（古典版）。",
  difficulty: 3,
  systemPresetId: "nd-nk",
  goals: [
    {
      formulaText: "~psi -> psi -> phi",
      label: "Goal: ¬ψ → ψ → φ",
    },
  ],
  hints: [
    "¬ψ と ψ と ¬φ をそれぞれ仮定します。",
    "→E で ¬ψ と ψ から ⊥ を導きます。→I で ¬φ を解消して ¬¬φ を得ます。",
    "DNE で ¬¬φ から φ を得ます。外側の仮定を→Iで解消します。",
  ],
  estimatedSteps: 6,
  learningPoint:
    "CON4 は NK の派生規則。NM の CON1 が ¬φ しか導けないのに対し、NK では DNE を使って任意の φ を導ける。EFQ と同値な主張。",
  order: 14,
  version: 1,
};

// --- Level ND-Quantifier: 自然演繹の量化子規則 ---

const qNd15UniversalIntro: QuestDefinition = {
  id: "nd-15",
  category: "nd-basics",
  title: "全称導入 ∀I (NM)",
  description:
    "P(x) → ∀x.P(x) → P(x) を自然演繹 NM で証明せよ。∀I規則の基本的な使い方を学ぶ。",
  difficulty: 2,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "P(x) -> all x. P(x) -> P(x)",
      label: "Goal: P(x) → ∀x.(P(x) → P(x))",
    },
  ],
  hints: [
    "P(x) を仮定します。",
    "→I で P(x) → P(x) を作ります（P(x) を仮定して即解消）。",
    "∀I でxを量化して ∀x.(P(x) → P(x)) を得ます。",
    "最初の仮定P(x)を→Iで解消します。",
  ],
  estimatedSteps: 4,
  learningPoint:
    "∀I（全称導入）は前提φからx.φを導出する。xは未打ち消し仮定に自由に現れてはならない（固有変数条件）。",
  order: 15,
  version: 1,
};

const qNd16UniversalElim: QuestDefinition = {
  id: "nd-16",
  category: "nd-basics",
  title: "全称除去 ∀E (NM)",
  description:
    "∀x.P(x) → P(x) を自然演繹 NM で証明せよ。∀E規則で量化子を除去する基本操作。",
  difficulty: 1,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "all x. P(x) -> P(x)",
      label: "Goal: ∀x.P(x) → P(x)",
    },
  ],
  hints: [
    "∀x.P(x) を仮定します。",
    "∀E で x を代入してP(x)を得ます（t = x）。",
    "→I で仮定を解消して完成です。",
  ],
  estimatedSteps: 3,
  learningPoint:
    "∀E（全称除去）は ∀x.φ から φ[t/x] を導出する。任意の項tを代入できるが、代入可能性条件（free-for）を満たす必要がある。",
  order: 16,
  version: 1,
};

const qNd17ExistentialIntro: QuestDefinition = {
  id: "nd-17",
  category: "nd-basics",
  title: "存在導入 ∃I (NM)",
  description:
    "P(x) → ∃x.P(x) を自然演繹 NM で証明せよ。具体例から存在命題を導く。",
  difficulty: 1,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "P(x) -> ex x. P(x)",
      label: "Goal: P(x) → ∃x.P(x)",
    },
  ],
  hints: [
    "P(x) を仮定します。",
    "∃I で x を量化変数、x を witness として ∃x.P(x) を得ます。",
    "→I で仮定を解消して完成です。",
  ],
  estimatedSteps: 3,
  learningPoint:
    "∃I（存在導入）は φ[t/x] から ∃x.φ を導出する。具体的な項tがφを満たすなら、それを存在命題に一般化できる。",
  order: 17,
  version: 1,
};

const qNd18UniversalSwap: QuestDefinition = {
  id: "nd-18",
  category: "nd-basics",
  title: "全称量化子の交換 (NM)",
  description:
    "∀x.∀y.P(x, y) → ∀y.∀x.P(x, y) を自然演繹 NM で証明せよ。∀Eと∀Iの組み合わせ。",
  difficulty: 3,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "all x. all y. P(x, y) -> all y. all x. P(x, y)",
      label: "Goal: ∀x.∀y.P(x,y) → ∀y.∀x.P(x,y)",
    },
  ],
  hints: [
    "∀x.∀y.P(x,y) を仮定します。",
    "∀E で x を消去して ∀y.P(x,y) を得ます。",
    "∀E で y を消去して P(x,y) を得ます。",
    "∀I で x を量化して ∀x.P(x,y) を得ます。∀I で y を量化して ∀y.∀x.P(x,y) を得ます。→I で完成。",
  ],
  estimatedSteps: 7,
  learningPoint:
    "∀量化子の順序は交換可能。∀E（除去）と∀I（導入）の組み合わせで示す。自然演繹ではHilbert流のA5を使わずに直接的に証明できる。",
  order: 18,
  version: 1,
};

// --- Level ND-Quantifier Advanced: 量化子規則の強化クエスト ---

const qNd19ExistentialElim: QuestDefinition = {
  id: "nd-19",
  category: "nd-basics",
  title: "存在除去 ∃E (NM)",
  description:
    "(∀x.(P(x) → φ)) → (∃x.P(x)) → φ を自然演繹 NM で証明せよ。∃E規則で存在命題の仮説を解消する基本パターンを学ぶ。",
  difficulty: 3,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "(all x. (P(x) -> phi)) -> (ex x. P(x)) -> phi",
      label: "Goal: (∀x.(P(x) → φ)) → (∃x.P(x)) → φ",
    },
  ],
  hints: [
    "∀x.(P(x) → φ) と ∃x.P(x) を仮定します。",
    "∃E を使います: ∃x.P(x) を存在前提に、P(x) を仮定した上で φ を導く証明をケース前提にします。",
    "P(x) の仮定から: ∀E で ∀x.(P(x) → φ) から P(x) → φ を得ます。→E で φ を得ます。",
    "φ が ∃E の結論です（x は φ に自由に現れないので固有変数条件を満たす）。→I で仮定を順に解消します。",
  ],
  estimatedSteps: 7,
  learningPoint:
    "∃E（存在除去）は ∃x.φ と「φを仮定して χ を導く証明」から χ を導出する。χ に x が自由に現れてはならない（固有変数条件）。仮説解消の基本パターン。",
  order: 19,
  version: 1,
};

const qNd20UniversalToExistential: QuestDefinition = {
  id: "nd-20",
  category: "nd-basics",
  title: "全称から存在 ∀→∃ (NM)",
  description:
    "∀x.P(x) → ∃x.P(x) を自然演繹 NM で証明せよ。全称命題から存在命題を導く基本操作。",
  difficulty: 1,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "all x. P(x) -> ex x. P(x)",
      label: "Goal: ∀x.P(x) → ∃x.P(x)",
    },
  ],
  hints: [
    "∀x.P(x) を仮定します。",
    "∀E で x を代入して P(x) を得ます。",
    "∃I で x を量化変数、x を witness として ∃x.P(x) を得ます。→I で仮定を解消して完成です。",
  ],
  estimatedSteps: 4,
  learningPoint:
    "∀x.φ ならば ∃x.φ が成り立つ。∀E で具体例を取り出し、∃I で存在命題に戻す。∀E と ∃I の基本的な組み合わせ。",
  order: 20,
  version: 1,
};

const qNd21ExistentialTransitivity: QuestDefinition = {
  id: "nd-21",
  category: "nd-basics",
  title: "存在の推移 (NM)",
  description:
    "(∃x.P(x)) → (∀x.(P(x) → Q(x))) → ∃x.Q(x) を自然演繹 NM で証明せよ。∃E と ∃I の組み合わせ。",
  difficulty: 3,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "(ex x. P(x)) -> (all x. (P(x) -> Q(x))) -> ex x. Q(x)",
      label: "Goal: (∃x.P(x)) → (∀x.(P(x) → Q(x))) → ∃x.Q(x)",
    },
  ],
  hints: [
    "∃x.P(x) と ∀x.(P(x) → Q(x)) を仮定します。",
    "∃E を使います: P(x) を仮定して ∃x.Q(x) を導く証明を構築します。",
    "P(x) の仮定のもとで: ∀E で P(x) → Q(x) を得て、→E で Q(x) を得ます。",
    "∃I で Q(x) から ∃x.Q(x) を導きます。これが ∃E の結論（x は ∃x.Q(x) に自由でない）。→I で仮定を解消。",
  ],
  estimatedSteps: 8,
  learningPoint:
    "∃E と ∃I の組み合わせパターン: 存在命題を開き、変換を施して、再び存在命題に包む。存在の「推移性」を示す。",
  order: 21,
  version: 1,
};

const qNd22ExistentialConjunctionDistribution: QuestDefinition = {
  id: "nd-22",
  category: "nd-basics",
  title: "∃の∧分配 (NM)",
  description:
    "(∃x.(P(x) ∧ Q(x))) → (∃x.P(x)) ∧ (∃x.Q(x)) を自然演繹 NM で証明せよ。∃E で存在命題を開き、∧E で分解、∃I で再構成。",
  difficulty: 3,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "(ex x. (P(x) /\\ Q(x))) -> (ex x. P(x)) /\\ (ex x. Q(x))",
      label: "Goal: (∃x.(P(x) ∧ Q(x))) → (∃x.P(x)) ∧ (∃x.Q(x))",
    },
  ],
  hints: [
    "∃x.(P(x) ∧ Q(x)) を仮定します。",
    "∃E を使います: P(x) ∧ Q(x) を仮定して (∃x.P(x)) ∧ (∃x.Q(x)) を導きます。",
    "∧E₁ で P(x) を、∧E₂ で Q(x) を取り出します。",
    "∃I でそれぞれ ∃x.P(x) と ∃x.Q(x) を得て、∧I で結合します。→I で仮定を解消。",
  ],
  estimatedSteps: 9,
  learningPoint:
    "存在量化子は連言の上に分配できる（逆方向は一般に成り立たない）。∃E の仮説解消内で複数の ∃I を用いる典型パターン。",
  order: 22,
  version: 1,
};

const qNd23UniversalConjunction: QuestDefinition = {
  id: "nd-23",
  category: "nd-basics",
  title: "∀の∧結合 (NM)",
  description:
    "(∀x.P(x)) ∧ (∀x.Q(x)) → ∀x.(P(x) ∧ Q(x)) を自然演繹 NM で証明せよ。∀E で分離、∧I で結合、∀I で再量化。",
  difficulty: 2,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "(all x. P(x)) /\\ (all x. Q(x)) -> all x. (P(x) /\\ Q(x))",
      label: "Goal: (∀x.P(x)) ∧ (∀x.Q(x)) → ∀x.(P(x) ∧ Q(x))",
    },
  ],
  hints: [
    "(∀x.P(x)) ∧ (∀x.Q(x)) を仮定します。",
    "∧E₁ で ∀x.P(x) を、∧E₂ で ∀x.Q(x) を取り出します。",
    "∀E でそれぞれ P(x) と Q(x) を得て、∧I で P(x) ∧ Q(x) を作ります。",
    "∀I で x を量化して ∀x.(P(x) ∧ Q(x)) を得ます。→I で仮定を解消。",
  ],
  estimatedSteps: 7,
  learningPoint:
    "全称量化子は連言の中に分配できる。∀E と ∀I を使って量化子のスコープを調整する基本テクニック。",
  order: 23,
  version: 1,
};

// --- TABクエスト: タブロー法の基礎 ---

const qTab01Identity: QuestDefinition = {
  id: "tab-01",
  category: "tab-basics",
  title: "恒等律の反駁 (→)",
  description:
    "¬(φ → φ) を根として閉じたタブローを構築せよ。¬→規則を適用すると φ と ¬φ が同一枝上に現れ、BSで閉じる。",
  difficulty: 1,
  systemPresetId: "tab-prop",
  goals: [
    {
      formulaText: "~(phi -> phi)",
      label: "Root: ¬(φ → φ) ⇒",
    },
  ],
  hints: [
    "¬(φ → φ) に ¬→ 規則を適用すると、φ と ¬φ が前件に追加されます。",
    "φ と ¬φ が同一枝上にあれば BS（基本式）で閉じられます。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "TABでは、証明したい式 φ の否定 ¬φ を根に置き、矛盾を導くことで証明する（反駁法）。¬→ 規則は否定含意を分解する基本規則。",
  order: 1,
  version: 1,
};

const qTab02DoubleNegationElim: QuestDefinition = {
  id: "tab-02",
  category: "tab-basics",
  title: "二重否定除去の反駁 (¬¬)",
  description:
    "¬(¬¬φ → φ) を根として閉じたタブローを構築せよ。¬→ で分解し、¬¬ 規則で二重否定を除去する。",
  difficulty: 1,
  systemPresetId: "tab-prop",
  goals: [
    {
      formulaText: "~(~~phi -> phi)",
      label: "Root: ¬(¬¬φ → φ) ⇒",
    },
  ],
  hints: [
    "¬(¬¬φ → φ) に ¬→ 規則を適用すると、¬¬φ と ¬φ が前件に追加されます。",
    "¬¬φ に ¬¬ 規則を適用すると φ が前件に追加されます。",
    "φ と ¬φ が同一枝上にあれば BS で閉じられます。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "TABの ¬¬ 規則は二重否定を除去する。Hilbert系では5ステップ必要な二重否定除去が、TABでは直接的に処理できる。",
  order: 2,
  version: 1,
};

const qTab03ExcludedMiddle: QuestDefinition = {
  id: "tab-03",
  category: "tab-basics",
  title: "排中律の反駁 (¬∨, →)",
  description:
    "¬(φ ∨ ¬φ) を根として閉じたタブローを構築せよ。¬∨ 規則で分解すると ¬φ と ¬¬φ が得られる。",
  difficulty: 1,
  systemPresetId: "tab-prop",
  goals: [
    {
      formulaText: "~(phi \\/ ~phi)",
      label: "Root: ¬(φ ∨ ¬φ) ⇒",
    },
  ],
  hints: [
    "¬(φ ∨ ¬φ) に ¬∨ 規則を適用すると、¬φ と ¬¬φ が前件に追加されます。",
    "¬¬φ に ¬¬ 規則を適用すると φ が前件に追加されます。",
    "φ と ¬φ が同一枝上にあれば BS で閉じられます。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "排中律 φ ∨ ¬φ はTABで直接的に反駁できる。¬∨ 規則は否定選言を二つの否定に分解する。",
  order: 3,
  version: 1,
};

const qTab04Contraposition: QuestDefinition = {
  id: "tab-04",
  category: "tab-basics",
  title: "対偶の反駁 (→, ¬→)",
  description:
    "¬((φ → ψ) → (¬ψ → ¬φ)) を根として閉じたタブローを構築せよ。含意の分解と分岐を組み合わせる。",
  difficulty: 2,
  systemPresetId: "tab-prop",
  goals: [
    {
      formulaText: "~((phi -> psi) -> (~psi -> ~phi))",
      label: "Root: ¬((φ → ψ) → (¬ψ → ¬φ)) ⇒",
    },
  ],
  hints: [
    "¬→ 規則で分解すると φ → ψ と ¬(¬ψ → ¬φ) が得られます。",
    "¬(¬ψ → ¬φ) に ¬→ 規則を適用すると ¬ψ と ¬¬φ が得られます。",
    "¬¬φ に ¬¬ 規則を適用して φ を得ます。",
    "φ → ψ に → 規則を適用すると分岐: ¬φ / ψ。各枝で BS を狙います。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "対偶は古典論理の基本定理。TABでは → 規則の分岐により、各枝で矛盾を独立に導く。",
  order: 4,
  version: 1,
};

const qTab05DeMorgan1: QuestDefinition = {
  id: "tab-05",
  category: "tab-basics",
  title: "ド・モルガンの法則 1 (¬∧, ∨)",
  description:
    "¬(¬(φ ∧ ψ) → (¬φ ∨ ¬ψ)) を根として閉じたタブローを構築せよ。¬∧ の分岐と ∨ の分岐を組み合わせる。",
  difficulty: 2,
  systemPresetId: "tab-prop",
  goals: [
    {
      formulaText: "~(~(phi /\\ psi) -> (~phi \\/ ~psi))",
      label: "Root: ¬(¬(φ ∧ ψ) → (¬φ ∨ ¬ψ)) ⇒",
    },
  ],
  hints: [
    "¬→ で分解すると ¬(φ ∧ ψ) と ¬(¬φ ∨ ¬ψ) が得られます。",
    "¬(¬φ ∨ ¬ψ) に ¬∨ を適用すると ¬¬φ と ¬¬ψ が得られます。",
    "¬¬ 規則で φ と ψ を取り出します。",
    "¬(φ ∧ ψ) に ¬∧ を適用すると分岐: ¬φ / ¬ψ。各枝で BS。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "ド・モルガンの法則はTABの分岐規則（¬∧）を使って自然に証明できる。各枝での矛盾を独立に示す。",
  order: 5,
  version: 1,
};

const qTab06DeMorgan2: QuestDefinition = {
  id: "tab-06",
  category: "tab-basics",
  title: "ド・モルガンの法則 2 (¬∨, ∧)",
  description:
    "¬(¬(φ ∨ ψ) → (¬φ ∧ ¬ψ)) を根として閉じたタブローを構築せよ。¬∨ で否定を分解し、∧ で結合を分解。",
  difficulty: 2,
  systemPresetId: "tab-prop",
  goals: [
    {
      formulaText: "~(~(phi \\/ psi) -> (~phi /\\ ~psi))",
      label: "Root: ¬(¬(φ ∨ ψ) → (¬φ ∧ ¬ψ)) ⇒",
    },
  ],
  hints: [
    "¬→ で分解すると ¬(φ ∨ ψ) と ¬(¬φ ∧ ¬ψ) が得られます。",
    "¬(φ ∨ ψ) に ¬∨ を適用すると ¬φ と ¬ψ が得られます。",
    "¬(¬φ ∧ ¬ψ) に ¬∧ を適用すると分岐: ¬¬φ / ¬¬ψ。",
    "各枝で ¬¬ 規則を適用して φ / ψ を取り出し、BS で閉じます。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "ド・モルガンの逆方向も TAB で自然に証明できる。¬∨ と ¬∧ の規則が否定された論理結合子を直接処理する。",
  order: 6,
  version: 1,
};

const qTab07ConjunctionCommute: QuestDefinition = {
  id: "tab-07",
  category: "tab-basics",
  title: "連言の交換律 (∧, ¬∧)",
  description:
    "¬((φ ∧ ψ) → (ψ ∧ φ)) を根として閉じたタブローを構築せよ。∧ 規則で分解し、¬∧ の分岐で閉じる。",
  difficulty: 2,
  systemPresetId: "tab-prop",
  goals: [
    {
      formulaText: "~((phi /\\ psi) -> (psi /\\ phi))",
      label: "Root: ¬((φ ∧ ψ) → (ψ ∧ φ)) ⇒",
    },
  ],
  hints: [
    "¬→ で分解すると φ ∧ ψ と ¬(ψ ∧ φ) が得られます。",
    "φ ∧ ψ に ∧ 規則を適用すると φ と ψ が前件に追加されます。",
    "¬(ψ ∧ φ) に ¬∧ を適用すると分岐: ¬ψ / ¬φ。各枝で BS。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "∧ 規則は連言を前件の二つの要素に分解する（分岐なし）。¬∧ は分岐を伴うが、各枝で矛盾が見つかれば閉じる。",
  order: 7,
  version: 1,
};

const qTab08DisjunctionCommute: QuestDefinition = {
  id: "tab-08",
  category: "tab-basics",
  title: "選言の交換律 (∨, ¬∨)",
  description:
    "¬((φ ∨ ψ) → (ψ ∨ φ)) を根として閉じたタブローを構築せよ。∨ 規則の分岐と ¬∨ を組み合わせる。",
  difficulty: 2,
  systemPresetId: "tab-prop",
  goals: [
    {
      formulaText: "~((phi \\/ psi) -> (psi \\/ phi))",
      label: "Root: ¬((φ ∨ ψ) → (ψ ∨ φ)) ⇒",
    },
  ],
  hints: [
    "¬→ で分解すると φ ∨ ψ と ¬(ψ ∨ φ) が得られます。",
    "¬(ψ ∨ φ) に ¬∨ を適用すると ¬ψ と ¬φ が前件に追加されます。",
    "φ ∨ ψ に ∨ 規則を適用すると分岐: φ / ψ。各枝で BS。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "∨ 規則は分岐（2前提）を伴うが、¬∨ は分岐なしで二つの否定を追加する。規則の対称性に注目。",
  order: 8,
  version: 1,
};

const qTab09ModusTollens: QuestDefinition = {
  id: "tab-09",
  category: "tab-basics",
  title: "モーダストレンスの反駁 (→)",
  description:
    "¬((φ → ψ) → (~ψ → ~φ)) と同値な対偶を、別の形で反駁する。¬((φ → ψ) ∧ ¬ψ → ¬φ) を扱う。",
  difficulty: 3,
  systemPresetId: "tab-prop",
  goals: [
    {
      formulaText: "~(((phi -> psi) /\\ ~psi) -> ~phi)",
      label: "Root: ¬(((φ → ψ) ∧ ¬ψ) → ¬φ) ⇒",
    },
  ],
  hints: [
    "¬→ で分解すると (φ → ψ) ∧ ¬ψ と ¬¬φ が得られます。",
    "∧ 規則で φ → ψ と ¬ψ を取り出し、¬¬ で φ を得ます。",
    "φ → ψ に → 規則を適用すると分岐: ¬φ / ψ。",
    "左枝: φ と ¬φ で BS。右枝: ψ と ¬ψ で BS。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "モーダストレンス（(φ→ψ) ∧ ¬ψ → ¬φ）はTABの → 分岐で自然に証明できる。Hilbert系でのMP連鎖より直観的。",
  order: 9,
  version: 1,
};

const qTab10HypotheticalSyllogism: QuestDefinition = {
  id: "tab-10",
  category: "tab-basics",
  title: "推移律の反駁 (→)",
  description:
    "¬((φ → ψ) → ((ψ → χ) → (φ → χ))) を根として閉じたタブローを構築せよ。複数の → 分岐を処理する。",
  difficulty: 3,
  systemPresetId: "tab-prop",
  goals: [
    {
      formulaText: "~((phi -> psi) -> ((psi -> chi) -> (phi -> chi)))",
      label: "Root: ¬((φ → ψ) → ((ψ → χ) → (φ → χ))) ⇒",
    },
  ],
  hints: [
    "¬→ で分解すると φ → ψ と ¬((ψ → χ) → (φ → χ)) が得られます。",
    "もう一度 ¬→ で分解して ψ → χ と ¬(φ → χ) を得ます。",
    "¬(φ → χ) に ¬→ を適用して φ と ¬χ を得ます。",
    "φ → ψ に → を適用して分岐: ¬φ / ψ。左枝は BS。右枝で ψ → χ に → を適用して分岐: ¬ψ / χ。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "推移律は Hilbert系では最も基本的かつ難しい補題だが、TABでは機械的に分岐を処理するだけで証明できる。",
  order: 10,
  version: 1,
};

// --- ATクエスト: 分析的タブローの基礎 ---

const qAt01ExcludedMiddle: QuestDefinition = {
  id: "at-01",
  category: "at-basics",
  title: "排中律 (α/β規則)",
  description:
    "F:φ ∨ ¬φ をルートに配置し、全枝を閉じて φ ∨ ¬φ を証明せよ。β規則で分岐し、α規則で閉じる。",
  difficulty: 1,
  systemPresetId: "at-prop",
  goals: [
    {
      formulaText: "phi \\/ ~phi",
      label: "Goal: φ ∨ ¬φ（排中律）",
    },
  ],
  hints: [
    "F(φ ∨ ¬φ) をルートノードとして配置しましょう（テキスト: F:phi \\/ ~phi）。",
    "F(φ ∨ ψ) はα規則（F∨）: F(φ) と F(ψ) の2つを同一枝上に追加します。",
    "F(¬φ) はα規則（F¬）: T(φ) に変換します。",
    "T(φ) と F(φ) が同一枝上にあれば closure 規則で閉じられます。",
  ],
  estimatedSteps: 3,
  learningPoint:
    "分析的タブローでは F(目標式) をルートに置き、矛盾を導くことで証明する（反駁法）。α規則は枝を分岐させず、β規則は枝を2つに分岐させる。",
  order: 1,
  version: 1,
};

const qAt02Implication: QuestDefinition = {
  id: "at-02",
  category: "at-basics",
  title: "含意の基本 (α規則)",
  description:
    "F:φ → (ψ → φ) をルートに配置し、全枝を閉じて φ → (ψ → φ) を証明せよ。F→規則を繰り返し適用する。",
  difficulty: 1,
  systemPresetId: "at-prop",
  goals: [
    {
      formulaText: "phi -> (psi -> phi)",
      label: "Goal: φ → (ψ → φ)",
    },
  ],
  hints: [
    "F(φ → (ψ → φ)) をルートに配置しましょう（テキスト: F:phi -> (psi -> phi)）。",
    "F(φ → ψ) はα規則（F→）: T(φ) と F(ψ) を同一枝上に追加します。",
    "F→ を2回適用すると T(φ) と F(φ) が得られ、closure で閉じます。",
  ],
  estimatedSteps: 3,
  learningPoint:
    "F→ 規則は F(φ → ψ) を T(φ) と F(ψ) に分解する非分岐（α）規則。含意の否定を前提と否定結論に分ける。",
  order: 2,
  version: 1,
};

const qAt03DoubleNegation: QuestDefinition = {
  id: "at-03",
  category: "at-basics",
  title: "二重否定除去 (α規則)",
  description:
    "F:¬¬φ → φ をルートに配置し、全枝を閉じて ¬¬φ → φ を証明せよ。二重否定のα規則を使う。",
  difficulty: 1,
  systemPresetId: "at-prop",
  goals: [
    {
      formulaText: "~~phi -> phi",
      label: "Goal: ¬¬φ → φ",
    },
  ],
  hints: [
    "F(¬¬φ → φ) をルートに配置しましょう（テキスト: F:~~phi -> phi）。",
    "F→ 規則で T(¬¬φ) と F(φ) を得ます。",
    "T(¬¬φ) に T¬¬ 規則を適用すると T(φ) が得られます。",
    "T(φ) と F(φ) で closure。",
  ],
  estimatedSteps: 3,
  learningPoint:
    "二重否定除去は T¬¬ のα規則で直接処理できる。Hilbert系では複数ステップ必要な証明がタブローでは単純。",
  order: 3,
  version: 1,
};

const qAt04Contraposition: QuestDefinition = {
  id: "at-04",
  category: "at-basics",
  title: "対偶 (α/β規則)",
  description:
    "F:(φ → ψ) → (¬ψ → ¬φ) をルートに配置し、全枝を閉じて対偶を証明せよ。β規則の分岐を処理する。",
  difficulty: 2,
  systemPresetId: "at-prop",
  goals: [
    {
      formulaText: "(phi -> psi) -> (~psi -> ~phi)",
      label: "Goal: (φ → ψ) → (¬ψ → ¬φ)",
    },
  ],
  hints: [
    "F((φ → ψ) → (¬ψ → ¬φ)) をルートに配置しましょう。",
    "F→ で T(φ → ψ) と F(¬ψ → ¬φ) を得ます。",
    "F(¬ψ → ¬φ) に F→ で T(¬ψ) と F(¬φ) を得ます。",
    "T(¬ψ) → F(ψ)、F(¬φ) → T(φ) で変換。T(φ → ψ) に T→（β規則）で分岐: F(φ)/T(ψ)。各枝で closure。",
  ],
  estimatedSteps: 6,
  learningPoint:
    "T→ は分岐を伴うβ規則。F(前件) と T(後件) の2枝に分かれ、各枝で独立に矛盾を導く。",
  order: 4,
  version: 1,
};

const qAt05DeMorgan: QuestDefinition = {
  id: "at-05",
  category: "at-basics",
  title: "ド・モルガン (α/β規則)",
  description:
    "F:¬(φ ∧ ψ) → (¬φ ∨ ¬ψ) をルートに配置し、全枝を閉じてド・モルガンの法則を証明せよ。",
  difficulty: 2,
  systemPresetId: "at-prop",
  goals: [
    {
      formulaText: "~(phi /\\ psi) -> (~phi \\/ ~psi)",
      label: "Goal: ¬(φ ∧ ψ) → (¬φ ∨ ¬ψ)",
    },
  ],
  hints: [
    "F(¬(φ ∧ ψ) → (¬φ ∨ ¬ψ)) をルートに配置しましょう。",
    "F→ で T(¬(φ ∧ ψ)) と F(¬φ ∨ ¬ψ) を得ます。",
    "T(¬(φ ∧ ψ)) に T¬ で F(φ ∧ ψ) を得ます。F(φ ∧ ψ) はβ規則（F∧）で分岐。",
    "F(¬φ ∨ ¬ψ) に F∨ で F(¬φ) と F(¬ψ) → T(φ) と T(ψ) を得ます。",
    "各枝で F(φ)/T(φ) または F(ψ)/T(ψ) の矛盾で closure。",
  ],
  estimatedSteps: 7,
  learningPoint:
    "F∧ はβ規則（分岐）、F∨ はα規則（非分岐）。ド・モルガンはこの対称的な規則の組み合わせで証明できる。",
  order: 5,
  version: 1,
};

const qAt06Distribution: QuestDefinition = {
  id: "at-06",
  category: "at-basics",
  title: "分配律 (複合分岐)",
  description:
    "F:(φ ∧ (ψ ∨ χ)) → ((φ ∧ ψ) ∨ (φ ∧ χ)) をルートに配置し、全枝を閉じて分配律を証明せよ。",
  difficulty: 3,
  systemPresetId: "at-prop",
  goals: [
    {
      formulaText:
        "(phi /\\ (psi \\/ chi)) -> ((phi /\\ psi) \\/ (phi /\\ chi))",
      label: "Goal: (φ ∧ (ψ ∨ χ)) → ((φ ∧ ψ) ∨ (φ ∧ χ))",
    },
  ],
  hints: [
    "F→ で T(φ ∧ (ψ ∨ χ)) と F((φ ∧ ψ) ∨ (φ ∧ χ)) を得ます。",
    "T(φ ∧ (ψ ∨ χ)) に T∧（α規則）で T(φ) と T(ψ ∨ χ) を得ます。",
    "F((φ ∧ ψ) ∨ (φ ∧ χ)) に F∨（α規則）で F(φ ∧ ψ) と F(φ ∧ χ) を得ます。",
    "T(ψ ∨ χ) に T∨（β規則）で分岐。各枝で F∧（β規則）をさらに適用して closure。",
  ],
  estimatedSteps: 10,
  learningPoint:
    "分配律は複数の分岐を持つ証明。T∧/F∨ はα規則（非分岐）、T∨/F∧ はβ規則（分岐）。β規則の適用順序で枝の数が変わる。",
  order: 6,
  version: 1,
};

const qAt07UniversalToExistential: QuestDefinition = {
  id: "at-07",
  category: "at-basics",
  title: "全称から存在 (γ/δ規則)",
  description:
    "F:∀x.P(x) → ∃x.P(x) をルートに配置し、全枝を閉じて ∀x.P(x) → ∃x.P(x) を証明せよ。量化子規則を使う。",
  difficulty: 2,
  systemPresetId: "at",
  goals: [
    {
      formulaText: "all x. P(x) -> ex x. P(x)",
      label: "Goal: ∀x.P(x) → ∃x.P(x)",
    },
  ],
  hints: [
    "F(∀x.P(x) → ∃x.P(x)) をルートに配置しましょう（テキスト: F:all x. P(x) -> ex x. P(x)）。",
    "F→ で T(∀x.P(x)) と F(∃x.P(x)) を得ます。",
    "F(∃x.P(x)) に δ規則（F∃）を適用: F(P(a)) （固有変数 a）。",
    "T(∀x.P(x)) に γ規則（T∀）を適用: T(P(a))（項として a を使用）。",
    "T(P(a)) と F(P(a)) で closure。",
  ],
  estimatedSteps: 4,
  learningPoint:
    "γ規則（T∀/F∃）は任意の項で代入できる。δ規則（F∀/T∃）は固有変数条件を満たす新しい変数で代入する。δ規則で導入された変数をγ規則の項として使うのが典型パターン。",
  order: 7,
  version: 1,
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
  q33ModusPonensImplication,
  q34ImplicationWeakeningElim,
  q35MendelsonIdentity,
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
  qNd01Identity,
  qNd02KAxiom,
  qNd03Contraposition,
  qNd04ConjunctionCommutativity,
  qNd05DisjunctionCommute,
  qNd06DoubleNegationIntro,
  qNd07ExFalsoNJ,
  qNd08ClaviusLawNK,
  qNd09ExcludedMiddleNK,
  qNd10ConsequentiaMirabilisNK,
  qNd11RaaMinimal,
  qNd12RaaClassical,
  qNd13Con1,
  qNd14Con4,
  qNd15UniversalIntro,
  qNd16UniversalElim,
  qNd17ExistentialIntro,
  qNd18UniversalSwap,
  qNd19ExistentialElim,
  qNd20UniversalToExistential,
  qNd21ExistentialTransitivity,
  qNd22ExistentialConjunctionDistribution,
  qNd23UniversalConjunction,
  qTab01Identity,
  qTab02DoubleNegationElim,
  qTab03ExcludedMiddle,
  qTab04Contraposition,
  qTab05DeMorgan1,
  qTab06DeMorgan2,
  qTab07ConjunctionCommute,
  qTab08DisjunctionCommute,
  qTab09ModusTollens,
  qTab10HypotheticalSyllogism,
  qAt01ExcludedMiddle,
  qAt02Implication,
  qAt03DoubleNegation,
  qAt04Contraposition,
  qAt05DeMorgan,
  qAt06Distribution,
  qAt07UniversalToExistential,
];
