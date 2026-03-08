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

// --- 等号付き述語論理の基礎 ---

const qEq01Reflexivity: QuestDefinition = {
  id: "eq-01",
  category: "equality-basics",
  title: "反射律 (E1)",
  description: "∀x. x = x を証明せよ。等号公理E1を配置する。",
  difficulty: 1,
  systemPresetId: "equality",
  goals: [
    {
      formulaText: "all x. x = x",
      label: "Goal: ∀x. x = x",
    },
  ],
  hints: [
    "E1は等号の反射律です。公理パレットから直接配置できます。",
    "E1: ∀x. x = x — 任意のものは自分自身と等しい。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "E1（反射律）は等号の最も基本的な性質。「x = x」は無条件に成り立つ。",
  order: 1,
  version: 1,
};

const qEq02Symmetry: QuestDefinition = {
  id: "eq-02",
  category: "equality-basics",
  title: "対称律 (E2)",
  description: "∀x.∀y. x = y → y = x を証明せよ。等号公理E2を配置する。",
  difficulty: 1,
  systemPresetId: "equality",
  goals: [
    {
      formulaText: "all x. all y. x = y -> y = x",
      label: "Goal: ∀x.∀y. x = y → y = x",
    },
  ],
  hints: [
    "E2は等号の対称律です。公理パレットから直接配置できます。",
    "E2: ∀x.∀y. x = y → y = x — 等式は左右を入れ替えられる。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "E2（対称律）は「x = y ならば y = x」を保証。等式の方向は自由に変えられる。",
  order: 2,
  version: 1,
};

const qEq03Transitivity: QuestDefinition = {
  id: "eq-03",
  category: "equality-basics",
  title: "推移律 (E3)",
  description:
    "∀x.∀y.∀z. x = y → (y = z → x = z) を証明せよ。等号公理E3を配置する。",
  difficulty: 1,
  systemPresetId: "equality",
  goals: [
    {
      formulaText: "all x. all y. all z. x = y -> (y = z -> x = z)",
      label: "Goal: ∀x.∀y.∀z. x = y → (y = z → x = z)",
    },
  ],
  hints: [
    "E3は等号の推移律です。公理パレットから直接配置できます。",
    "E3: ∀x.∀y.∀z. x = y → (y = z → x = z) — 等式は鎖のように繋げられる。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "E3（推移律）は「x = y かつ y = z ならば x = z」を保証。等式の連鎖推論の基礎。",
  order: 3,
  version: 1,
};

const qEq04ConcreteReflexivity: QuestDefinition = {
  id: "eq-04",
  category: "equality-basics",
  title: "具体的な反射律",
  description: "a = a を証明せよ。E1（反射律）とA4（全称消去）を組み合わせる。",
  difficulty: 2,
  systemPresetId: "equality",
  goals: [
    {
      formulaText: "a = a",
      label: "Goal: a = a",
    },
  ],
  hints: [
    "E1: ∀x. x = x を配置します。",
    "A4で∀xを消去して具体的な項aを代入します: (∀x. x=x) → a=a",
    "MPで組み合わせれば完成です。",
  ],
  estimatedSteps: 3,
  learningPoint:
    "全称量化された公理は、A4（全称消去）で具体的な項にインスタンス化できる。E1 + A4 + MPの基本パターン。",
  order: 4,
  version: 1,
};

const qEq05ConcreteSymmetry: QuestDefinition = {
  id: "eq-05",
  category: "equality-basics",
  title: "具体的な対称律",
  description:
    "a = b → b = a を証明せよ。E2にA4を2回適用してインスタンス化する。",
  difficulty: 2,
  systemPresetId: "equality",
  goals: [
    {
      formulaText: "a = b -> b = a",
      label: "Goal: a = b → b = a",
    },
  ],
  hints: [
    "E2: ∀x.∀y. x = y → y = x を配置します。",
    "A4で∀xを消去（x→a）して ∀y. a = y → y = a を導きます。",
    "再度A4で∀yを消去（y→b）して a = b → b = a を導きます。",
  ],
  estimatedSteps: 5,
  learningPoint:
    "複数の全称量化子がある公理は、A4を繰り返し適用して一つずつ消去する。E2のx→a, y→bの2段階インスタンス化。",
  order: 5,
  version: 1,
};

const qEq06ConcreteTransitivity: QuestDefinition = {
  id: "eq-06",
  category: "equality-basics",
  title: "具体的な推移律",
  description: "a = b → (b = c → a = c) を証明せよ。E3にA4を3回適用する。",
  difficulty: 3,
  systemPresetId: "equality",
  goals: [
    {
      formulaText: "a = b -> (b = c -> a = c)",
      label: "Goal: a = b → (b = c → a = c)",
    },
  ],
  hints: [
    "E3: ∀x.∀y.∀z. x = y → (y = z → x = z) を配置します。",
    "A4で∀xを消去（x→a）、∀yを消去（y→b）、∀zを消去（z→c）の3段階。",
    "各A4の後にMPで全称量化子を一つずつ外していきます。合計7ステップ。",
  ],
  estimatedSteps: 7,
  learningPoint:
    "3重全称量化の消去パターン。A4+MPを3回繰り返す機械的な手順だが、各ステップでどの変数を代入するか意識することが重要。",
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

const qG09AssociativityInstance: QuestDefinition = {
  id: "group-09",
  category: "group-proofs",
  title: "(a·b)·c = a·(b·c)",
  description:
    "結合律G1の具体的なインスタンスを導出せよ。∀x.∀y.∀z形式の3変数全称量化子を段階的に消去する。",
  difficulty: 3,
  systemPresetId: "group-full",
  goals: [
    {
      formulaText: "(a * b) * c = a * (b * c)",
      label: "Goal: (a·b)·c = a·(b·c)",
    },
  ],
  hints: [
    "G1: ∀x.∀y.∀z. (x*y)*z = x*(y*z) を配置します。",
    "A4を3回使って、x→a, y→b, z→c の順に全称量化子を消去します。",
    "手順: G1 → A4[x→a] → MP → A4[y→b] → MP → A4[z→c] → MP",
  ],
  estimatedSteps: 7,
  learningPoint:
    "多変数の全称量化子は外側から順にA4+MPで消去する。3段階の∀消去は等号推移律（E3）と同じパターン。",
  order: 3,
  version: 1,
};

const qG10RightInverseInstance: QuestDefinition = {
  id: "group-10",
  category: "group-proofs",
  title: "a·i(a) = e",
  description:
    "右逆元公理G3Rの具体的なインスタンスを導出せよ。∀消去で特定の元aに適用する。",
  difficulty: 2,
  systemPresetId: "group-full",
  goals: [
    {
      formulaText: "a * i(a) = e",
      label: "Goal: a·i(a) = e",
    },
  ],
  hints: [
    "G3R: ∀x. x * i(x) = e を使います。xをaに代入します。",
    "A4（∀消去）で∀x.φ(x) から φ(a) を導出します。",
    "手順: G3R(公理) → A4インスタンス((∀x. x*i(x)=e) → a*i(a)=e) → MP",
  ],
  estimatedSteps: 3,
  learningPoint:
    "G3L（左逆元: i(x)*x=e）とG3R（右逆元: x*i(x)=e）は群論の両側公理系で対称的。∀消去パターンはgroup-07/08と同一。",
  order: 4,
  version: 1,
};

const qG11CommutativityInstance: QuestDefinition = {
  id: "group-11",
  category: "group-proofs",
  title: "a·b = b·a",
  description:
    "アーベル群の可換律G4の具体的なインスタンスを導出せよ。2変数の全称量化子を段階的に消去する。",
  difficulty: 2,
  systemPresetId: "abelian-group",
  goals: [
    {
      formulaText: "a * b = b * a",
      label: "Goal: a·b = b·a",
    },
  ],
  hints: [
    "G4: ∀x.∀y. x * y = y * x を配置します。",
    "A4を2回使って、x→a, y→b の順に全称量化子を消去します。",
    "手順: G4 → A4[x→a] → MP → A4[y→b] → MP",
  ],
  estimatedSteps: 5,
  learningPoint:
    "2段階の∀消去は対称律（E2）と同じパターン。アーベル群は通常の群公理に可換律G4を追加した体系。",
  order: 5,
  version: 1,
};

const qG12LeftIdentityCompound: QuestDefinition = {
  id: "group-12",
  category: "group-proofs",
  title: "e·(a·b) = a·b",
  description:
    "複合項a·bに対して左単位元G2Lを適用せよ。∀消去で項変数を複合項に代入するパターンを学ぶ。",
  difficulty: 2,
  systemPresetId: "group-full",
  goals: [
    {
      formulaText: "e * (a * b) = a * b",
      label: "Goal: e·(a·b) = a·b",
    },
  ],
  hints: [
    "G2L: ∀x. e * x = x を配置します。",
    "A4（∀消去）でxを複合項 a*b に代入します。",
    "手順: G2L(公理) → A4インスタンス((∀x. e*x=x) → e*(a*b)=a*b) → MP",
  ],
  estimatedSteps: 3,
  learningPoint:
    "∀消去では変数を単一項だけでなく複合項（a*bなど）にも代入できる。これは項の構造に関する重要な性質。",
  order: 6,
  version: 1,
};

const qG13RightIdentityCompound: QuestDefinition = {
  id: "group-13",
  category: "group-proofs",
  title: "(a·b)·e = a·b",
  description:
    "複合項a·bに対して右単位元G2Rを適用せよ。∀消去で複合項を代入するパターン。",
  difficulty: 2,
  systemPresetId: "group-full",
  goals: [
    {
      formulaText: "(a * b) * e = a * b",
      label: "Goal: (a·b)·e = a·b",
    },
  ],
  hints: [
    "G2R: ∀x. x * e = x を配置します。",
    "A4（∀消去）でxを複合項 a*b に代入します。",
    "手順: G2R(公理) → A4インスタンス((∀x. x*e=x) → (a*b)*e=a*b) → MP",
  ],
  estimatedSteps: 3,
  learningPoint:
    "G2R（右単位元）もG2L（左単位元）と同様に複合項に適用できる。両側公理系ではどちらも自由に使える。",
  order: 7,
  version: 1,
};

const qG14LeftInverseCompound: QuestDefinition = {
  id: "group-14",
  category: "group-proofs",
  title: "i(a·b)·(a·b) = e",
  description:
    "複合項a·bの左逆元を適用せよ。逆元関数iも複合項に適用でき、i(a·b)·(a·b) = e が成り立つ。",
  difficulty: 2,
  systemPresetId: "group-full",
  goals: [
    {
      formulaText: "i(a * b) * (a * b) = e",
      label: "Goal: i(a·b)·(a·b) = e",
    },
  ],
  hints: [
    "G3L: ∀x. i(x) * x = e を配置します。",
    "A4（∀消去）でxを複合項 a*b に代入します。",
    "手順: G3L(公理) → A4インスタンス((∀x. i(x)*x=e) → i(a*b)*(a*b)=e) → MP",
  ],
  estimatedSteps: 3,
  learningPoint:
    "逆元関数iは任意の項に適用可能。i(a*b)は「a*bの逆元」を表し、必ずしもi(b)*i(a)とは限らない（一般の群では反転則が別途必要）。",
  order: 8,
  version: 1,
};

const qG15RightInverseCompound: QuestDefinition = {
  id: "group-15",
  category: "group-proofs",
  title: "(a·b)·i(a·b) = e",
  description:
    "複合項a·bの右逆元を適用せよ。G3Rの∀消去で複合項に適用するパターン。",
  difficulty: 2,
  systemPresetId: "group-full",
  goals: [
    {
      formulaText: "(a * b) * i(a * b) = e",
      label: "Goal: (a·b)·i(a·b) = e",
    },
  ],
  hints: [
    "G3R: ∀x. x * i(x) = e を配置します。",
    "A4（∀消去）でxを複合項 a*b に代入します。",
    "手順: G3R(公理) → A4インスタンス((∀x. x*i(x)=e) → (a*b)*i(a*b)=e) → MP",
  ],
  estimatedSteps: 3,
  learningPoint:
    "左逆元G3Lと右逆元G3Rは対称的。両側公理系では両方を自由に使え、i(t)*t=eとt*i(t)=eの両方が公理から直接導ける。",
  order: 9,
  version: 1,
};

// --- 群論の等号推論 ---

const qG16IdentityCommutes: QuestDefinition = {
  id: "group-16",
  category: "group-proofs",
  title: "a·e = e·a",
  description:
    "右単位元と左単位元の結果をE2（対称律）とE3（推移律）で連鎖させ、単位元の交換律を導出せよ。",
  difficulty: 3,
  systemPresetId: "group-full",
  goals: [
    {
      formulaText: "a * e = e * a",
      label: "Goal: a·e = e·a",
    },
  ],
  hints: [
    "G2R[x→a]: a*e=a と G2L[x→a]: e*a=a を導出します。",
    "E2で e*a=a を反転して a=e*a を得ます。",
    "E3で a*e=a と a=e*a を連鎖させて a*e=e*a を導きます。",
    "E2の∀消去は2段階、E3の∀消去は3段階です。",
  ],
  estimatedSteps: 21,
  learningPoint:
    "E2（対称律）で等式を反転し、E3（推移律）で等式を連鎖させるパターン。群論の等号推論の基本技法。",
  order: 10,
  version: 1,
};

const qG17InverseCommutes: QuestDefinition = {
  id: "group-17",
  category: "group-proofs",
  title: "i(a)·a = a·i(a)",
  description:
    "左逆元と右逆元の結果をE2+E3で連鎖させ、逆元の交換律を導出せよ。group-16と同じパターン。",
  difficulty: 3,
  systemPresetId: "group-full",
  goals: [
    {
      formulaText: "i(a) * a = a * i(a)",
      label: "Goal: i(a)·a = a·i(a)",
    },
  ],
  hints: [
    "G3L[x→a]: i(a)*a=e と G3R[x→a]: a*i(a)=e を導出します。",
    "E2で a*i(a)=e を反転して e=a*i(a) を得ます。",
    "E3で i(a)*a=e と e=a*i(a) を連鎖させて i(a)*a=a*i(a) を導きます。",
  ],
  estimatedSteps: 21,
  learningPoint:
    "group-16と対称的なパターン。2つの等式 x=m, y=m から E2+E3 で x=y を導くテクニック。",
  order: 11,
  version: 1,
};

const qG18DoubleRightIdentity: QuestDefinition = {
  id: "group-18",
  category: "group-proofs",
  title: "(a·e)·e = a",
  description:
    "G2Rを2回異なるインスタンスで適用し、E3（推移律）で連鎖させる。推移律チェーンの基本。",
  difficulty: 3,
  systemPresetId: "group-full",
  goals: [
    {
      formulaText: "(a * e) * e = a",
      label: "Goal: (a·e)·e = a",
    },
  ],
  hints: [
    "G2R[x→a*e]: (a*e)*e=a*e と G2R[x→a]: a*e=a を導出します。",
    "E3で (a*e)*e=a*e と a*e=a を連鎖させて (a*e)*e=a を導きます。",
    "E3の∀消去は3段階（x, y, z それぞれA4+MP）です。",
  ],
  estimatedSteps: 14,
  learningPoint:
    "同じ公理（G2R）を異なる代入で2回使い、推移律E3で結果を繋げるパターン。等号推論の効率的な連鎖。",
  order: 12,
  version: 1,
};

const qG19InverseOfIdentity: QuestDefinition = {
  id: "group-19",
  category: "group-proofs",
  title: "i(e) = e",
  description:
    "単位元の逆元が単位元自身であることを証明せよ。G3LとG2Rの結果をE2+E3で連鎖させる。",
  difficulty: 4,
  systemPresetId: "group-full",
  goals: [
    {
      formulaText: "i(e) = e",
      label: "Goal: i(e) = e",
    },
  ],
  hints: [
    "G3L[x→e]: i(e)*e=e と G2R[x→i(e)]: i(e)*e=i(e) を導出します。",
    "E2で i(e)*e=i(e) を反転して i(e)=i(e)*e を得ます。",
    "E3で i(e)=i(e)*e と i(e)*e=e を連鎖させて i(e)=e を導きます。",
  ],
  estimatedSteps: 21,
  learningPoint:
    "「2つの等式が共通の中間項を持つとき、E2で片方を反転してE3で連鎖」は等号推論の万能パターン。",
  order: 13,
  version: 1,
};

// --- 述語論理の基礎 ---

const qPred01UniversalElim: QuestDefinition = {
  id: "pred-01",
  category: "predicate-basics",
  title: "全称消去 (A4)",
  description:
    "(∀x.P(x)) → P(x) を証明せよ。A4（全称消去公理）の最も基本的なインスタンス。",
  difficulty: 1,
  systemPresetId: "predicate",
  goals: [
    {
      formulaText: "(all x. P(x)) -> P(x)",
      label: "Goal: (∀x.P(x)) → P(x)",
    },
  ],
  hints: [
    "A4: (∀ξ.φ) → φ[τ/ξ] のインスタンスを作ります。",
    "ξ=x, φ=P(x), τ=x として、(∀x.P(x)) → P(x)[x/x] = (∀x.P(x)) → P(x) です。",
    "A4を配置するだけで完成します。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "A4（全称消去）は量化子∀を外す基本公理。(∀x.φ(x)) → φ(t) で任意の項tを代入できる。",
  order: 1,
  version: 2,
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
    "(∀x.∀y.P(x, y)) → (∀y.∀x.P(x, y)) を証明せよ。量化子の順序交換（例7.49）。",
  difficulty: 3,
  systemPresetId: "predicate",
  goals: [
    {
      formulaText: "(all x. all y. P(x, y)) -> all y. all x. P(x, y)",
      label: "Goal: (∀x.∀y.P(x,y)) → (∀y.∀x.P(x,y))",
    },
  ],
  hints: [
    "∀x.∀y.P(x,y) から ∀y.∀x.P(x,y) を演繹することを目標にします。",
    "A4で外側の∀xを消去し、再びA4で∀yを消去して P(x,y) を得ます。",
    "Genでまず∀x.P(x,y)を得て、再びGenで∀y.∀x.P(x,y)を得ます。",
    "A5を使って∀の中に戻していく操作が必要です。",
  ],
  estimatedSteps: 13,
  learningPoint:
    "∀量化子の順序は交換可能。A4(消去)とA5+Gen(導入)の組み合わせで示す。",
  order: 3,
  version: 2,
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
      formulaText: "(ex x. ~P(x)) -> ~(all x. P(x))",
      label: "Goal: (∃x.¬P(x)) → ¬(∀x.P(x))",
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
  version: 2,
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
      formulaText: "(all x. ~P(x)) -> ~(ex x. P(x))",
      label: "Goal: (∀x.¬P(x)) → ¬(∃x.P(x))",
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
    "(∀x.¬P(x)) → ¬(∃x.P(x)) は量化子と否定の基本関係。∃の定義（¬∀¬）を展開して二重否定導入で証明。",
  order: 6,
  version: 2,
};

// --- 述語論理の上級 ---

const qPredAdv01UniversalImplicationDistribution: QuestDefinition = {
  id: "pred-adv-01",
  category: "predicate-advanced",
  title: "全称と含意の分配",
  description:
    "(∀x.(P(x)→Q(x))) → ((∀x.P(x)) → (∀x.Q(x))) を証明せよ。全称量化子と含意の基本的な相互作用。",
  difficulty: 4,
  systemPresetId: "predicate",
  goals: [
    {
      formulaText:
        "(all x. (P(x) -> Q(x))) -> ((all x. P(x)) -> (all x. Q(x)))",
      label: "Goal: (∀x.(P(x)→Q(x))) → ((∀x.P(x)) → (∀x.Q(x)))",
    },
  ],
  hints: [
    "A4で∀を除去し、A2で含意を分配します。",
    "A4: (∀x.(P(x)→Q(x))) → (P(x)→Q(x)) と A4: (∀x.P(x)) → P(x) を組み合わせます。",
    "(∀x.(P(x)→Q(x))) → ((∀x.P(x)) → Q(x)) を中間ステップとして構築し、Gen+A5で全称化します。",
    "A1で持ち上げてA2で分配する「HS展開」パターンを活用します。",
  ],
  estimatedSteps: 28,
  learningPoint:
    "∀は含意に対して分配可能。述語論理で最も頻出するパターンの一つ。",
  order: 1,
  version: 1,
};

const qPredAdv02NegationOfExistence: QuestDefinition = {
  id: "pred-adv-02",
  category: "predicate-advanced",
  title: "存在の否定 → 全称の否定",
  description:
    "¬(∃x.P(x)) → (∀x.¬P(x)) を証明せよ。存在量化子の否定が全称量化子の否定に帰着することを示す。",
  difficulty: 4,
  systemPresetId: "predicate",
  goals: [
    {
      formulaText: "~(ex x. P(x)) -> (all x. ~P(x))",
      label: "Goal: ¬(∃x.P(x)) → (∀x.¬P(x))",
    },
  ],
  hints: [
    "∃x.P(x) は ¬∀x.¬P(x) の略記です。",
    "¬(∃x.P(x)) = ¬¬(∀x.¬P(x)) です。",
    "二重否定除去 ¬¬φ→φ のインスタンスを使います。",
    "二重否定除去の証明は A3 を2回使います。",
  ],
  estimatedSteps: 12,
  learningPoint:
    "¬∃x.P(x) ↔ ∀x.¬P(x) は量化子と否定の基本関係。∃の定義（¬∀¬）を展開して二重否定除去で証明。",
  order: 2,
  version: 1,
};

const qPredAdv03NegationOfUniversal: QuestDefinition = {
  id: "pred-adv-03",
  category: "predicate-advanced",
  title: "全称の否定 → 存在の否定",
  description:
    "¬(∀x.P(x)) → (∃x.¬P(x)) を証明せよ。全称量化子の否定が存在量化子の否定に帰着することを示す。",
  difficulty: 4,
  systemPresetId: "predicate",
  goals: [
    {
      formulaText: "~(all x. P(x)) -> ex x. ~P(x)",
      label: "Goal: ¬(∀x.P(x)) → (∃x.¬P(x))",
    },
  ],
  hints: [
    "∃x.¬P(x) は ¬∀x.¬¬P(x) の略記です。",
    "ゴールを定義展開すると ¬(∀x.P(x)) → ¬(∀x.¬¬P(x)) になります。",
    "二重否定除去 ¬¬P(x)→P(x) を Gen + Dist∀ で ∀x.¬¬P(x)→∀x.P(x) に変換します。",
    "Modus Tollens で対偶を取ります。",
  ],
  estimatedSteps: 30,
  learningPoint:
    "¬∀x.P(x) → ∃x.¬P(x) は古典論理でのみ成り立つ。Hilbert系では DNE + Gen + Dist∀ + MT の組み合わせで証明。",
  order: 3,
  version: 1,
};

const qPredAdv04ExistentialImplicationDistribution: QuestDefinition = {
  id: "pred-adv-04",
  category: "predicate-advanced",
  title: "存在の含意分配",
  description:
    "(∀x.(P(x)→Q(x))) → ((∃x.P(x)) → (∃x.Q(x))) を証明せよ。全称的な含意が存在量化子に対しても分配可能であることを示す。",
  difficulty: 5,
  systemPresetId: "predicate",
  goals: [
    {
      formulaText: "(all x. (P(x) -> Q(x))) -> ((ex x. P(x)) -> (ex x. Q(x)))",
      label: "Goal: (∀x.(P(x)→Q(x))) → ((∃x.P(x)) → (∃x.Q(x)))",
    },
  ],
  hints: [
    "∃x.P(x) = ¬∀x.¬P(x) と ∃x.Q(x) = ¬∀x.¬Q(x) に定義展開します。",
    "A4 で P(x)→Q(x) を取り出し、MT で ¬Q(x)→¬P(x) に変換します。",
    "Gen + A5 で ∀x.(¬Q(x)→¬P(x)) を構成し、Dist∀ で ∀x.¬Q(x)→∀x.¬P(x) を導きます。",
    "MT で対偶を取り、HS で全体を接続します。",
  ],
  estimatedSteps: 40,
  learningPoint:
    "∀は∃に対しても含意分配可能。∃の定義展開 + MT + Dist∀ のパターンが核心。",
  order: 4,
  version: 1,
};

const qPredAdv05QuantifierSwap: QuestDefinition = {
  id: "pred-adv-05",
  category: "predicate-advanced",
  title: "全称量化子の交換",
  description:
    "(∀x.∀y.P(x,y)) → (∀y.∀x.P(x,y)) を証明せよ。全称量化子の入れ替えが可能であることを示す。",
  difficulty: 4,
  systemPresetId: "predicate",
  goals: [
    {
      formulaText: "(all x. (all y. P(x, y))) -> (all y. (all x. P(x, y)))",
      label: "Goal: (∀x.∀y.P(x,y)) → (∀y.∀x.P(x,y))",
    },
  ],
  hints: [
    "A4を2回使って∀x と ∀y を両方除去し、P(x,y) を取り出します。",
    "Gen[x] で x を全称化し、A5 で含意の外に出します。",
    "さらに Gen[y] で y を全称化し、A5 で含意の外に出します。",
    "量化子の順序を入れ替える鍵は、Gen の適用順序です。",
  ],
  estimatedSteps: 13,
  learningPoint:
    "全称量化子は入れ替え可能。A4で除去→Genで逆順に再導入→A5で含意の外に出すパターン。",
  order: 5,
  version: 1,
};

const qPredAdv06UniversalToExistential: QuestDefinition = {
  id: "pred-adv-06",
  category: "predicate-advanced",
  title: "全称から存在",
  description:
    "(∀x.P(x)) → (∃x.P(x)) を証明せよ。全称命題から存在命題への含意を示す。",
  difficulty: 4,
  systemPresetId: "predicate",
  goals: [
    {
      formulaText: "(all x. P(x)) -> (ex x. P(x))",
      label: "Goal: (∀x.P(x)) → (∃x.P(x))",
    },
  ],
  hints: [
    "∃x.P(x) は ¬∀x.¬P(x) の略記です。",
    "ゴールを定義展開すると (∀x.P(x)) → ¬(∀x.¬P(x)) になります。",
    "A4 と A3 (対偶) を組み合わせて証明できます。",
    "∀x.¬P(x) → ¬P(x) と ∀x.P(x) → P(x) から矛盾を導きます。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "全称命題は存在命題を含意する。∃x.P(x) = ¬∀x.¬P(x) の定義を理解する基本的な性質。",
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

const qNd24DeMorganDisjunction: QuestDefinition = {
  id: "nd-24",
  category: "nd-basics",
  title: "ド・モルガン ¬∨→∧¬ (NM)",
  description:
    "¬(φ ∨ ψ) → (¬φ ∧ ¬ψ) を自然演繹 NM で証明せよ。否定された選言を連言的な否定に分解する。",
  difficulty: 2,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "~(phi \\/ psi) -> (~phi /\\ ~psi)",
      label: "Goal: ¬(φ ∨ ψ) → (¬φ ∧ ¬ψ)",
    },
  ],
  hints: [
    "¬(φ ∨ ψ) を仮定します。",
    "φ を仮定し、∨I で φ ∨ ψ を作り、¬(φ ∨ ψ) と →E で ⊥ を得ます。→I で ¬φ。",
    "同様に ψ を仮定して ¬ψ を導きます。",
    "∧I で ¬φ ∧ ¬ψ を作り、→I で仮定を解消。",
  ],
  estimatedSteps: 10,
  learningPoint:
    "ド・モルガンの法則の一方向。否定された選言から各成分の否定を取り出す。最小論理で証明可能。",
  order: 24,
  version: 1,
};

const qNd25DeMorganDisjunctionReverse: QuestDefinition = {
  id: "nd-25",
  category: "nd-basics",
  title: "ド・モルガン ∧¬→¬∨ (NM)",
  description:
    "(¬φ ∧ ¬ψ) → ¬(φ ∨ ψ) を自然演繹 NM で証明せよ。各成分の否定の連言から選言の否定を導く。",
  difficulty: 2,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "(~phi /\\ ~psi) -> ~(phi \\/ psi)",
      label: "Goal: (¬φ ∧ ¬ψ) → ¬(φ ∨ ψ)",
    },
  ],
  hints: [
    "¬φ ∧ ¬ψ を仮定し、∧E で ¬φ と ¬ψ を取り出します。",
    "φ ∨ ψ を仮定し、∨E で場合分けします。",
    "φ の場合は ¬φ と →E で ⊥、ψ の場合は ¬ψ と →E で ⊥。",
    "∨E で ⊥ を統合し、→I で φ ∨ ψ を解消して ¬(φ ∨ ψ) を得ます。",
  ],
  estimatedSteps: 10,
  learningPoint:
    "ド・モルガンの法則の逆方向。各成分の否定から選言全体の否定を構成する。最小論理で証明可能。",
  order: 25,
  version: 1,
};

const qNd26DeMorganConjunction: QuestDefinition = {
  id: "nd-26",
  category: "nd-basics",
  title: "ド・モルガン ¬∧→∨¬ (NK)",
  description:
    "¬(φ ∧ ψ) → (¬φ ∨ ¬ψ) を自然演繹 NK で証明せよ。古典論理の DNE が必要な方向。",
  difficulty: 3,
  systemPresetId: "nd-nk",
  goals: [
    {
      formulaText: "~(phi /\\ psi) -> (~phi \\/ ~psi)",
      label: "Goal: ¬(φ ∧ ψ) → (¬φ ∨ ¬ψ)",
    },
  ],
  hints: [
    "¬(φ ∧ ψ) を仮定します。結論 ¬φ ∨ ¬ψ を直接構成するのは難しい。",
    "¬(¬φ ∨ ¬ψ) を仮定して矛盾を導く戦略を取ります。",
    "φ を仮定 → ψ を仮定 → φ ∧ ψ → ¬(φ∧ψ) と矛盾 → ¬ψ → ¬φ∨¬ψ → ¬(¬φ∨¬ψ) と矛盾 → ¬φ → 同様に矛盾。",
    "¬¬(¬φ ∨ ¬ψ) を →I で得て、DNE で二重否定を除去。",
  ],
  estimatedSteps: 14,
  learningPoint:
    "ド・モルガンの法則のうち ¬∧→∨¬ 方向は直観主義では証明できず、古典論理の DNE が必要。直観主義と古典論理の違いを体験する重要な例。",
  order: 26,
  version: 1,
};

const qNd27ConjunctionDisjunctionDistribution: QuestDefinition = {
  id: "nd-27",
  category: "nd-basics",
  title: "∧∨分配律 (NM)",
  description:
    "φ ∧ (ψ ∨ χ) → (φ ∧ ψ) ∨ (φ ∧ χ) を自然演繹 NM で証明せよ。連言を選言に分配する。",
  difficulty: 2,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "phi /\\ (psi \\/ chi) -> (phi /\\ psi) \\/ (phi /\\ chi)",
      label: "Goal: φ ∧ (ψ ∨ χ) → (φ ∧ ψ) ∨ (φ ∧ χ)",
    },
  ],
  hints: [
    "φ ∧ (ψ ∨ χ) を仮定し、∧E で φ と ψ ∨ χ を取り出します。",
    "ψ ∨ χ に ∨E を適用して場合分けします。",
    "ψ の場合: φ ∧ ψ を ∧I で作り、∨I_L で (φ ∧ ψ) ∨ (φ ∧ χ)。",
    "χ の場合: φ ∧ χ を ∧I で作り、∨I_R で (φ ∧ ψ) ∨ (φ ∧ χ)。∨E で統合し →I で仮定を解消。",
  ],
  estimatedSteps: 10,
  learningPoint:
    "連言と選言の分配律。∨E による場合分けで各ケースを処理し、∨I で統合する標準的なテクニック。",
  order: 27,
  version: 1,
};

const qNd28DoubleNegationElim: QuestDefinition = {
  id: "nd-28",
  category: "nd-basics",
  title: "二重否定除去 (NK)",
  description:
    "¬¬φ → φ を自然演繹 NK で証明せよ。DNE 規則を直接適用する最も基本的な古典論理の証明。",
  difficulty: 2,
  systemPresetId: "nd-nk",
  goals: [
    {
      formulaText: "~~phi -> phi",
      label: "Goal: ¬¬φ → φ",
    },
  ],
  hints: [
    "¬¬φ を仮定します。",
    "DNE 規則を適用して ¬¬φ から φ を導きます。",
    "→I で仮定を解消して完成です。",
  ],
  estimatedSteps: 3,
  learningPoint:
    "二重否定除去（DNE）は古典論理 NK の特徴的な規則。直観主義論理では使えない。",
  order: 28,
  version: 1,
};

const qNd29ContrapositiveReverse: QuestDefinition = {
  id: "nd-29",
  category: "nd-basics",
  title: "対偶の逆 (NK)",
  description:
    "(¬ψ → ¬φ) → (φ → ψ) を自然演繹 NK で証明せよ。対偶の逆方向は DNE が必要。",
  difficulty: 3,
  systemPresetId: "nd-nk",
  goals: [
    {
      formulaText: "(~psi -> ~phi) -> (phi -> psi)",
      label: "Goal: (¬ψ → ¬φ) → (φ → ψ)",
    },
  ],
  hints: [
    "¬ψ → ¬φ と φ を仮定します。",
    "¬ψ を仮定し、→E で ¬φ を導き、さらに →E で ⊥ を得ます。",
    "→I で ¬¬ψ を作り、DNE で ψ を得ます。",
    "→I を2回適用して仮定を解消します。",
  ],
  estimatedSteps: 9,
  learningPoint:
    "対偶の逆方向は古典論理でのみ成り立つ。背理法的な推論で ¬¬ψ を構成し DNE で ψ を得る。",
  order: 29,
  version: 1,
};

const qNd30PeirceLaw: QuestDefinition = {
  id: "nd-30",
  category: "nd-basics",
  title: "ピアースの法則 (NK)",
  description:
    "((φ → ψ) → φ) → φ を自然演繹 NK で証明せよ。古典論理の有名な定理。",
  difficulty: 3,
  systemPresetId: "nd-nk",
  goals: [
    {
      formulaText: "((phi -> psi) -> phi) -> phi",
      label: "Goal: ((φ → ψ) → φ) → φ",
    },
  ],
  hints: [
    "(φ → ψ) → φ を仮定します。",
    "¬φ を仮定し、φ を仮定して ⊥ を導きます。",
    "EFQ で ψ を得て、→I で φ → ψ を作ります。",
    "→E で φ を得て、¬φ との矛盾から ¬¬φ を作り、DNE で φ を得ます。",
  ],
  estimatedSteps: 11,
  learningPoint:
    "ピアースの法則は直観主義論理では証明できない古典論理固有の定理。EFQ と DNE の組み合わせが鍵。",
  order: 30,
  version: 1,
};

const qNd31DisjunctionConjunctionDistribution: QuestDefinition = {
  id: "nd-31",
  category: "nd-basics",
  title: "∨∧分配律の逆 (NM)",
  description:
    "(φ ∨ ψ) ∧ (φ ∨ χ) → φ ∨ (ψ ∧ χ) を自然演繹 NM で証明せよ。∨E を2回使用する。",
  difficulty: 3,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "(phi \\/ psi) /\\ (phi \\/ chi) -> phi \\/ (psi /\\ chi)",
      label: "Goal: (φ ∨ ψ) ∧ (φ ∨ χ) → φ ∨ (ψ ∧ χ)",
    },
  ],
  hints: [
    "(φ ∨ ψ) ∧ (φ ∨ χ) を仮定し、∧E で φ ∨ ψ と φ ∨ χ を取り出します。",
    "φ ∨ ψ に ∨E を適用して場合分けします。",
    "φ の場合: 直接 ∨I_L で φ ∨ (ψ ∧ χ)。",
    "ψ の場合: さらに φ ∨ χ に ∨E を適用。φ なら ∨I_L、χ なら ψ ∧ χ を ∧I で作り ∨I_R。",
  ],
  estimatedSteps: 14,
  learningPoint:
    "∨E のネスト（二重場合分け）のテクニック。外側の ∨E の右ケースで内側の ∨E を使う構造。",
  order: 31,
  version: 1,
};

const qNd32UniversalConjunctionDistribution: QuestDefinition = {
  id: "nd-32",
  category: "nd-basics",
  title: "∀の∧分配 (NM)",
  description:
    "∀x.(P(x) ∧ Q(x)) → (∀x.P(x)) ∧ (∀x.Q(x)) を自然演繹 NM で証明せよ。全称量化子を連言の外に分配する。",
  difficulty: 2,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText:
        "(all x. (P(x) /\\ Q(x))) -> (all x. P(x)) /\\ (all x. Q(x))",
      label: "Goal: (∀x.(P(x) ∧ Q(x))) → (∀x.P(x)) ∧ (∀x.Q(x))",
    },
  ],
  hints: [
    "∀x.(P(x) ∧ Q(x)) を仮定します。",
    "∀E で P(x) ∧ Q(x) を取り出し、∧E で P(x) と Q(x) に分解します。",
    "それぞれに ∀I を適用して ∀x.P(x) と ∀x.Q(x) を作ります。",
    "∧I で結合し、→I で仮定を解消します。",
  ],
  estimatedSteps: 8,
  learningPoint:
    "∀の∧分配は nd-23（逆方向）と対をなす。∀E → ∧E → ∀I のパターン。",
  order: 32,
  version: 1,
};

const qNd33ExistentialDisjunctionCombine: QuestDefinition = {
  id: "nd-33",
  category: "nd-basics",
  title: "∃と∨の結合 (NM)",
  description:
    "(∃x.P(x)) ∨ (∃x.Q(x)) → ∃x.(P(x) ∨ Q(x)) を自然演繹 NM で証明せよ。存在量化子の選言を統合する。",
  difficulty: 2,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "(ex x. P(x)) \\/ (ex x. Q(x)) -> ex x. (P(x) \\/ Q(x))",
      label: "Goal: (∃x.P(x)) ∨ (∃x.Q(x)) → ∃x.(P(x) ∨ Q(x))",
    },
  ],
  hints: [
    "(∃x.P(x)) ∨ (∃x.Q(x)) を仮定し、∨E で場合分けします。",
    "∃x.P(x) の場合: ∃E で P(x) を取り出し、∨I_L → ∃I で ∃x.(P(x) ∨ Q(x))。",
    "∃x.Q(x) の場合: ∃E で Q(x) を取り出し、∨I_R → ∃I で ∃x.(P(x) ∨ Q(x))。",
    "∨E で統合し →I で完成。",
  ],
  estimatedSteps: 13,
  learningPoint:
    "∨E と ∃E のネストが必要な証明。各場合で ∨I + ∃I を組み合わせるパターン。",
  order: 33,
  version: 1,
};

const qNd34NegExistentialToUniversalNeg: QuestDefinition = {
  id: "nd-34",
  category: "nd-basics",
  title: "量化子のド・モルガン ¬∃→∀¬ (NM)",
  description:
    "¬∃x.P(x) → ∀x.¬P(x) を自然演繹 NM で証明せよ。存在の否定から全称的な否定を導く。",
  difficulty: 2,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "~(ex x. P(x)) -> all x. ~P(x)",
      label: "Goal: ¬∃x.P(x) → ∀x.¬P(x)",
    },
  ],
  hints: [
    "¬∃x.P(x) を仮定します。",
    "P(x) を仮定し、∃I で ∃x.P(x) を作ります。",
    "→E で ¬∃x.P(x) と ∃x.P(x) から ⊥ を得ます。",
    "→I で P(x) を解消して ¬P(x)。∀I で ∀x.¬P(x)。→I で完成。",
  ],
  estimatedSteps: 7,
  learningPoint:
    "量化子のド・モルガン法則の一方向。∃I + →E で矛盾を作り、→I で否定を構成する基本パターン。最小論理で証明可能。",
  order: 34,
  version: 1,
};

const qNd35UniversalNegToNegExistential: QuestDefinition = {
  id: "nd-35",
  category: "nd-basics",
  title: "量化子のド・モルガン ∀¬→¬∃ (NM)",
  description:
    "∀x.¬P(x) → ¬∃x.P(x) を自然演繹 NM で証明せよ。全称的な否定から存在の否定を導く。",
  difficulty: 2,
  systemPresetId: "nd-nm",
  goals: [
    {
      formulaText: "(all x. ~P(x)) -> ~(ex x. P(x))",
      label: "Goal: (∀x.¬P(x)) → ¬∃x.P(x)",
    },
  ],
  hints: [
    "∀x.¬P(x) を仮定します。",
    "∃x.P(x) を仮定し、∃E で P(x) を取り出します。",
    "∀E で ¬P(x) を取得し、→E で P(x) と合わせて ⊥ を導きます。",
    "∃E で ⊥ を統合し、→I で ∃x.P(x) を解消して ¬∃x.P(x)。→I で完成。",
  ],
  estimatedSteps: 8,
  learningPoint:
    "量化子のド・モルガン法則の逆方向。∃E + ∀E + →E の組み合わせ。nd-34 と対をなす定理。最小論理で証明可能。",
  order: 35,
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

const qTab11DoubleNegationIntro: QuestDefinition = {
  id: "tab-11",
  category: "tab-basics",
  title: "二重否定導入の反駁 (¬¬)",
  description:
    "¬(φ → ¬¬φ) を根として閉じたタブローを構築せよ。¬→ で分解し、¬¬ 規則で二重否定を除去する基本パターン。",
  difficulty: 1,
  systemPresetId: "tab-prop",
  goals: [
    {
      formulaText: "~(phi -> ~~phi)",
      label: "Root: ¬(φ → ¬¬φ) ⇒",
    },
  ],
  hints: [
    "¬→ で分解すると φ と ¬(¬¬φ) が得られます。",
    "¬¬¬φ に ¬¬ 規則を適用して ¬φ を得ます。",
    "φ と ¬φ が同一枝上にあるので BS で閉じます。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "二重否定導入（DNI）は TAB では ¬¬¬ の二重否定除去で単純に閉じる。DNEと対をなす基本パターン。",
  order: 11,
  version: 1,
};

const qTab12ExFalso: QuestDefinition = {
  id: "tab-12",
  category: "tab-basics",
  title: "爆発律の反駁 (¬→, →)",
  description:
    "¬(¬φ → (φ → ψ)) を根として閉じたタブローを構築せよ。矛盾から何でも出る原理。",
  difficulty: 2,
  systemPresetId: "tab-prop",
  goals: [
    {
      formulaText: "~(~phi -> (phi -> psi))",
      label: "Root: ¬(¬φ → (φ → ψ)) ⇒",
    },
  ],
  hints: [
    "¬→ で分解すると ¬φ と ¬(φ → ψ) が得られます。",
    "もう一度 ¬→ で ¬(φ → ψ) を分解して φ と ¬ψ を得ます。",
    "¬φ と φ が同一枝上にあるので BS で閉じます。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "爆発律（EFQ）は矛盾した前提からは何でも導けることを示す。TAB では ¬→ の2回適用で機械的に閉じる。",
  order: 12,
  version: 1,
};

const qTab13DeMorgan3: QuestDefinition = {
  id: "tab-13",
  category: "tab-basics",
  title: "ド・モルガン逆方向 (¬∧, ∨)",
  description:
    "¬((¬φ ∨ ¬ψ) → ¬(φ ∧ ψ)) を根として閉じたタブローを構築せよ。ド・モルガンの法則の逆方向を反駁する。",
  difficulty: 2,
  systemPresetId: "tab-prop",
  goals: [
    {
      formulaText: "~((~phi \\/ ~psi) -> ~(phi /\\ psi))",
      label: "Root: ¬((¬φ ∨ ¬ψ) → ¬(φ ∧ ψ)) ⇒",
    },
  ],
  hints: [
    "¬→ で分解すると ¬φ ∨ ¬ψ と ¬(¬(φ ∧ ψ)) が得られます。",
    "¬¬(φ ∧ ψ) に ¬¬ 規則を適用して φ ∧ ψ を得ます。",
    "∧ 規則で φ と ψ を得ます。",
    "∨ で分岐: ¬φ の枝は φ と BS、¬ψ の枝は ψ と BS。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "ド・モルガンの法則には4つの方向がある。TAB では ¬¬ 除去と ∧/∨ の分解で全方向を処理できる。",
  order: 13,
  version: 1,
};

const qTab14ImplicationConjDistrib: QuestDefinition = {
  id: "tab-14",
  category: "tab-basics",
  title: "含意と連言の分配 (¬∧, →)",
  description:
    "¬((φ → (ψ ∧ χ)) → ((φ → ψ) ∧ (φ → χ))) を根として閉じたタブローを構築せよ。含意が連言を分配する定理。",
  difficulty: 3,
  systemPresetId: "tab-prop",
  goals: [
    {
      formulaText:
        "~((phi -> (psi /\\ chi)) -> ((phi -> psi) /\\ (phi -> chi)))",
      label: "Root: ¬((φ → (ψ ∧ χ)) → ((φ → ψ) ∧ (φ → χ))) ⇒",
    },
  ],
  hints: [
    "¬→ で分解: φ → (ψ ∧ χ) と ¬((φ → ψ) ∧ (φ → χ)) を得ます。",
    "¬∧ で分岐: ¬(φ → ψ) と ¬(φ → χ) の2枝。",
    "各枝で ¬→ を適用して φ と ¬ψ（または ¬χ）を得ます。",
    "φ → (ψ ∧ χ) に → で分岐: ¬φ / (ψ ∧ χ)。¬φ の枝は φ と BS。(ψ ∧ χ) の枝は ψ と χ を得て矛盾。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "含意が連言を分配する定理は、¬∧ のβ規則で2枝に分かれるが、各枝で同じ含意を → 規則で分岐させて閉じる。",
  order: 14,
  version: 1,
};

const qTab15ConjunctionAssoc: QuestDefinition = {
  id: "tab-15",
  category: "tab-basics",
  title: "連言の結合律 (∧, ¬∧)",
  description:
    "¬(((φ ∧ ψ) ∧ χ) → (φ ∧ (ψ ∧ χ))) を根として閉じたタブローを構築せよ。連言の結合律の定理。",
  difficulty: 2,
  systemPresetId: "tab-prop",
  goals: [
    {
      formulaText: "~(((phi /\\ psi) /\\ chi) -> (phi /\\ (psi /\\ chi)))",
      label: "Root: ¬(((φ ∧ ψ) ∧ χ) → (φ ∧ (ψ ∧ χ))) ⇒",
    },
  ],
  hints: [
    "¬→ で分解: (φ ∧ ψ) ∧ χ と ¬(φ ∧ (ψ ∧ χ)) を得ます。",
    "∧ を2回適用して φ, ψ, χ を得ます。",
    "¬∧ で分岐: ¬φ と ¬(ψ ∧ χ) の2枝。",
    "¬φ の枝は φ と BS。¬(ψ ∧ χ) の枝はさらに ¬∧ で分岐して ¬ψ / ¬χ で BS。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "連言の結合律は ∧（α規則）と ¬∧（β規則）の組合せで証明する。ネストした ¬∧ が二段階の分岐を生む。",
  order: 15,
  version: 1,
};

const qTab16DisjunctionAssoc: QuestDefinition = {
  id: "tab-16",
  category: "tab-basics",
  title: "選言の結合律 (∨, ¬∨)",
  description:
    "¬((φ ∨ (ψ ∨ χ)) → ((φ ∨ ψ) ∨ χ)) を根として閉じたタブローを構築せよ。選言の結合律の定理。",
  difficulty: 3,
  systemPresetId: "tab-prop",
  goals: [
    {
      formulaText: "~((phi \\/ (psi \\/ chi)) -> ((phi \\/ psi) \\/ chi))",
      label: "Root: ¬((φ ∨ (ψ ∨ χ)) → ((φ ∨ ψ) ∨ χ)) ⇒",
    },
  ],
  hints: [
    "¬→ で分解: φ ∨ (ψ ∨ χ) と ¬((φ ∨ ψ) ∨ χ) を得ます。",
    "¬∨ を2回適用して ¬(φ ∨ ψ), ¬χ, さらに ¬φ, ¬ψ を得ます。",
    "∨ で分岐: φ の枝は ¬φ と BS。ψ ∨ χ の枝はさらに ∨ で分岐。",
    "ψ の枝は ¬ψ と BS。χ の枝は ¬χ と BS。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "選言の結合律は ¬∨（α規則）と ∨（β規則）の組合せ。二段階の ∨ 分岐が特徴的。",
  order: 16,
  version: 1,
};

const qTab17Absorption: QuestDefinition = {
  id: "tab-17",
  category: "tab-basics",
  title: "吸収律 (→, ¬∧)",
  description:
    "¬((φ → ψ) → (φ → (φ ∧ ψ))) を根として閉じたタブローを構築せよ。吸収律の定理。",
  difficulty: 2,
  systemPresetId: "tab-prop",
  goals: [
    {
      formulaText: "~((phi -> psi) -> (phi -> (phi /\\ psi)))",
      label: "Root: ¬((φ → ψ) → (φ → (φ ∧ ψ))) ⇒",
    },
  ],
  hints: [
    "¬→ を2回適用: φ → ψ, φ, ¬(φ ∧ ψ) を得ます。",
    "¬∧ で分岐: ¬φ と ¬ψ の2枝。",
    "¬φ の枝は φ と BS。",
    "¬ψ の枝で φ → ψ に → 規則: ¬φ の枝は φ と BS、ψ の枝は ¬ψ と BS。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "吸収律は「前提が含まれる」性質。¬∧ と → の分岐を組合せて全枝を閉じる。",
  order: 17,
  version: 1,
};

const qTab18ImplicationDisjunction: QuestDefinition = {
  id: "tab-18",
  category: "tab-basics",
  title: "含意の選言表現 (¬∨, →)",
  description:
    "¬((φ → ψ) → (¬φ ∨ ψ)) を根として閉じたタブローを構築せよ。含意を選言で表す古典的定理。",
  difficulty: 2,
  systemPresetId: "tab-prop",
  goals: [
    {
      formulaText: "~((phi -> psi) -> (~phi \\/ psi))",
      label: "Root: ¬((φ → ψ) → (¬φ ∨ ψ)) ⇒",
    },
  ],
  hints: [
    "¬→ で分解: φ → ψ と ¬(¬φ ∨ ψ) を得ます。",
    "¬∨ で ¬¬φ, ¬ψ を得ます。",
    "¬¬ で φ を得ます。",
    "φ → ψ に → で分岐: ¬φ の枝は φ と BS、ψ の枝は ¬ψ と BS。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "含意 φ → ψ と選言 ¬φ ∨ ψ の同値性は古典論理の基本。¬∨ と ¬¬ で準備し、→ 分岐で閉じる。",
  order: 18,
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

const qAt08ConjunctionCommute: QuestDefinition = {
  id: "at-08",
  category: "at-basics",
  title: "連言の交換律 (α規則)",
  description:
    "F:(φ ∧ ψ) → (ψ ∧ φ) をルートに配置し、全枝を閉じて連言の交換律を証明せよ。T∧/F∧のα/β規則を使い分ける。",
  difficulty: 1,
  systemPresetId: "at",
  goals: [
    {
      formulaText: "(phi /\\ psi) -> (psi /\\ phi)",
      label: "Goal: (φ ∧ ψ) → (ψ ∧ φ)",
    },
  ],
  hints: [
    "F((φ ∧ ψ) → (ψ ∧ φ)) をルートに配置しましょう（テキスト: F:(phi /\\ psi) -> (psi /\\ phi)）。",
    "F→ で T(φ ∧ ψ) と F(ψ ∧ φ) を得ます。",
    "T(φ ∧ ψ) にα規則（T∧）を適用: T(φ) と T(ψ) を得ます。",
    "F(ψ ∧ φ) にβ規則（F∧）を適用: F(ψ) と F(φ) に分岐。それぞれ T(ψ)/T(φ) と矛盾。",
  ],
  estimatedSteps: 4,
  learningPoint:
    "T∧ はα規則（非分岐）で両成分を得る。F∧ はβ規則（分岐）で少なくとも一方が偽であることを表す。α規則を先に適用して情報を増やすのがコツ。",
  order: 8,
  version: 1,
};

const qAt09DisjunctionCommute: QuestDefinition = {
  id: "at-09",
  category: "at-basics",
  title: "選言の交換律 (β規則)",
  description:
    "F:(φ ∨ ψ) → (ψ ∨ φ) をルートに配置し、全枝を閉じて選言の交換律を証明せよ。T∨/F∨のβ/α規則を使い分ける。",
  difficulty: 2,
  systemPresetId: "at",
  goals: [
    {
      formulaText: "(phi \\/ psi) -> (psi \\/ phi)",
      label: "Goal: (φ ∨ ψ) → (ψ ∨ φ)",
    },
  ],
  hints: [
    "F((φ ∨ ψ) → (ψ ∨ φ)) をルートに配置しましょう（テキスト: F:(phi \\/ psi) -> (psi \\/ phi)）。",
    "F→ で T(φ ∨ ψ) と F(ψ ∨ φ) を得ます。",
    "F(ψ ∨ φ) にα規則（F∨）を適用: F(ψ) と F(φ) を得ます。",
    "T(φ ∨ ψ) にβ規則（T∨）を適用: T(φ) と T(ψ) に分岐。それぞれ F(φ)/F(ψ) と矛盾。",
  ],
  estimatedSteps: 4,
  learningPoint:
    "F∨ はα規則（非分岐）で両成分を否定に分解する。T∨ はβ規則（分岐）で少なくとも一方が真であることを表す。F∨を先に適用して非分岐の情報を増やすのが効率的。",
  order: 9,
  version: 1,
};

const qAt10Transitivity: QuestDefinition = {
  id: "at-10",
  category: "at-basics",
  title: "推移律 (複数F→分解)",
  description:
    "F:(φ → ψ) → ((ψ → χ) → (φ → χ)) をルートに配置し、全枝を閉じて含意の推移律を証明せよ。",
  difficulty: 2,
  systemPresetId: "at",
  goals: [
    {
      formulaText: "(phi -> psi) -> ((psi -> chi) -> (phi -> chi))",
      label: "Goal: (φ → ψ) → ((ψ → χ) → (φ → χ))",
    },
  ],
  hints: [
    "F((φ → ψ) → ((ψ → χ) → (φ → χ))) をルートに配置しましょう。",
    "F→ を繰り返し適用: T(φ → ψ), T(ψ → χ), T(φ), F(χ) を得ます。",
    "T(φ → ψ) にβ規則（T→）を適用: F(φ) と T(ψ) に分岐。",
    "F(φ) は T(φ) と矛盾。T(ψ) の枝で T(ψ → χ) にβ規則を適用: F(ψ) と T(χ) に分岐。",
    "F(ψ) は T(ψ) と矛盾。T(χ) は F(χ) と矛盾。全枝閉じる。",
  ],
  estimatedSteps: 5,
  learningPoint:
    "F→ はα規則（非分岐）で前件をTに、後件をFにする。T→ はβ規則（分岐）で前件がFまたは後件がTに分岐する。F→を先に全て適用してからT→で分岐するのが効率的。",
  order: 10,
  version: 1,
};

const qAt11DeMorgan2: QuestDefinition = {
  id: "at-11",
  category: "at-basics",
  title: "ド・モルガン 2 (α規則中心)",
  description:
    "F:¬(φ ∨ ψ) → (¬φ ∧ ¬ψ) をルートに配置し、全枝を閉じてド・モルガンの法則（選言版）を証明せよ。",
  difficulty: 2,
  systemPresetId: "at",
  goals: [
    {
      formulaText: "~(phi \\/ psi) -> (~phi /\\ ~psi)",
      label: "Goal: ¬(φ ∨ ψ) → (¬φ ∧ ¬ψ)",
    },
  ],
  hints: [
    "F(¬(φ ∨ ψ) → (¬φ ∧ ¬ψ)) をルートに配置しましょう（テキスト: F:~(phi \\/ psi) -> (~phi /\\ ~psi)）。",
    "F→ で T(¬(φ ∨ ψ)) と F(¬φ ∧ ¬ψ) を得ます。",
    "T¬ で T(¬(φ ∨ ψ)) から F(φ ∨ ψ) を得ます。",
    "F∨（α規則）で F(φ) と F(ψ) を得ます。",
    "F∧（β規則）で F(¬φ) と F(¬ψ) に分岐。F¬ で T(φ)/T(ψ) を得て矛盾。",
  ],
  estimatedSteps: 5,
  learningPoint:
    "T¬ は F に、F¬ は T に符号を反転するα規則。¬(φ ∨ ψ) の分析ではまずT¬→F∨と進むと非分岐で情報が増える。",
  order: 11,
  version: 1,
};

const qAt12ImplicationDeMorgan: QuestDefinition = {
  id: "at-12",
  category: "at-basics",
  title: "含意のド・モルガン (α規則)",
  description:
    "F:¬(φ → ψ) → (φ ∧ ¬ψ) をルートに配置し、全枝を閉じて ¬(φ → ψ) → (φ ∧ ¬ψ) を証明せよ。α規則のみで完結する。",
  difficulty: 1,
  systemPresetId: "at",
  goals: [
    {
      formulaText: "~(phi -> psi) -> (phi /\\ ~psi)",
      label: "Goal: ¬(φ → ψ) → (φ ∧ ¬ψ)",
    },
  ],
  hints: [
    "F(¬(φ → ψ) → (φ ∧ ¬ψ)) をルートに配置しましょう（テキスト: F:~(phi -> psi) -> (phi /\\ ~psi)）。",
    "F→ で T(¬(φ → ψ)) と F(φ ∧ ¬ψ) を得ます。",
    "T¬ で T(¬(φ → ψ)) から F(φ → ψ) を得ます。F→（α規則）で T(φ) と F(ψ) を得ます。",
    "F∧（β規則）で F(φ) と F(¬ψ) に分岐。F(φ) は T(φ) と矛盾。F¬ で F(¬ψ) → T(ψ) → F(ψ) と矛盾。",
  ],
  estimatedSteps: 5,
  learningPoint:
    "¬(φ → ψ) はα規則の連鎖で T(φ) と F(ψ) に分解できる。F∧ のβ規則（分岐）だけが唯一の分岐点。",
  order: 12,
  version: 1,
};

const qAt13DoubleNegationIntro: QuestDefinition = {
  id: "at-13",
  category: "at-basics",
  title: "二重否定導入 (α規則)",
  description:
    "F:φ → ¬¬φ をルートに配置し、全枝を閉じて φ → ¬¬φ を証明せよ。否定のα規則を使う。",
  difficulty: 1,
  systemPresetId: "at",
  goals: [
    {
      formulaText: "phi -> ~~phi",
      label: "Goal: φ → ¬¬φ",
    },
  ],
  hints: [
    "F(φ → ¬¬φ) をルートに配置しましょう（テキスト: F:phi -> ~~phi）。",
    "F→ で T(φ) と F(¬¬φ) を得ます。",
    "F¬ で F(¬¬φ) → T(¬φ) を得ます。T¬ で T(¬φ) → F(φ) を得ます。",
    "T(φ) と F(φ) で closure。",
  ],
  estimatedSteps: 3,
  learningPoint:
    "二重否定導入はF¬ → T¬ の2段階α規則で処理できる。at-03（二重否定除去）と対になる基本パターン。",
  order: 13,
  version: 1,
};

const qAt14ImplicationDisjunction: QuestDefinition = {
  id: "at-14",
  category: "at-basics",
  title: "含意と選言の変換 (β規則)",
  description:
    "F:(φ → ψ) → (¬φ ∨ ψ) をルートに配置し、全枝を閉じて含意から選言への変換を証明せよ。T→のβ規則が鍵。",
  difficulty: 2,
  systemPresetId: "at",
  goals: [
    {
      formulaText: "(phi -> psi) -> (~phi \\/ psi)",
      label: "Goal: (φ → ψ) → (¬φ ∨ ψ)",
    },
  ],
  hints: [
    "F((φ → ψ) → (¬φ ∨ ψ)) をルートに配置しましょう。",
    "F→ で T(φ → ψ) と F(¬φ ∨ ψ) を得ます。",
    "F∨（α規則）で F(¬φ) と F(ψ) を得ます。F¬ で F(¬φ) → T(φ) を得ます。",
    "T(φ → ψ) にβ規則（T→）を適用: F(φ) と T(ψ) に分岐。",
    "F(φ) は T(φ) と矛盾。T(ψ) は F(ψ) と矛盾。全枝閉じる。",
  ],
  estimatedSteps: 5,
  learningPoint:
    "含意 φ → ψ は ¬φ ∨ ψ と同値。T→ のβ規則で F(前件)/T(後件) に分岐するのは、この同値性を反映している。",
  order: 14,
  version: 1,
};

const qAt15PeirceLaw: QuestDefinition = {
  id: "at-15",
  category: "at-basics",
  title: "ピアースの法則 (複合β規則)",
  description:
    "F:((φ → ψ) → φ) → φ をルートに配置し、全枝を閉じてピアースの法則を証明せよ。T→のβ規則を2回適用する。",
  difficulty: 3,
  systemPresetId: "at",
  goals: [
    {
      formulaText: "((phi -> psi) -> phi) -> phi",
      label: "Goal: ((φ → ψ) → φ) → φ",
    },
  ],
  hints: [
    "F(((φ → ψ) → φ) → φ) をルートに配置しましょう（テキスト: F:((phi -> psi) -> phi) -> phi）。",
    "F→ で T((φ → ψ) → φ) と F(φ) を得ます。",
    "T((φ → ψ) → φ) にβ規則（T→）を適用: F(φ → ψ) と T(φ) に分岐。",
    "T(φ) の枝は F(φ) と矛盾で closure。",
    "F(φ → ψ) の枝にα規則（F→）を適用: T(φ) と F(ψ) を得ます。T(φ) は F(φ) と矛盾で closure。",
  ],
  estimatedSteps: 4,
  learningPoint:
    "ピアースの法則は古典論理固有のトートロジー。タブローでは T→ のβ規則1つで2枝に分かれ、各枝が短く閉じる。Hilbert系やNDでは複雑な証明が必要だが、タブローでは効率的。",
  order: 15,
  version: 1,
};

const qAt16ExistentialToNegUniversal: QuestDefinition = {
  id: "at-16",
  category: "at-basics",
  title: "存在から全称否定 (δ/γ規則)",
  description:
    "F:∃x.P(x) → ¬∀x.¬P(x) をルートに配置し、全枝を閉じて証明せよ。δ規則（T∃）で固有変数導入、γ規則（T∀）で具体項代入。",
  difficulty: 2,
  systemPresetId: "at",
  goals: [
    {
      formulaText: "ex x. P(x) -> ~(all x. ~P(x))",
      label: "Goal: ∃x.P(x) → ¬∀x.¬P(x)",
    },
  ],
  hints: [
    "F(∃x.P(x) → ¬∀x.¬P(x)) をルートに配置しましょう（テキスト: F:ex x. P(x) -> ~(all x. ~P(x))）。",
    "F→ で T(∃x.P(x)) と F(¬∀x.¬P(x)) を得ます。",
    "F¬ で F(¬∀x.¬P(x)) → T(∀x.¬P(x)) を得ます。",
    "T(∃x.P(x)) にδ規則（T∃）を適用: T(P(a))（固有変数 a）。",
    "T(∀x.¬P(x)) にγ規則（T∀）を適用（項 a）: T(¬P(a))。T¬ で F(P(a)) を得ます。",
    "T(P(a)) と F(P(a)) で closure。",
  ],
  estimatedSteps: 5,
  learningPoint:
    "δ規則で導入した固有変数をγ規則の具体項として再利用するパターン。∃ → ¬∀¬ は直観主義論理でも成立する。",
  order: 16,
  version: 1,
};

const qAt17UniversalImplicationDistribution: QuestDefinition = {
  id: "at-17",
  category: "at-basics",
  title: "全称と含意の分配 (γ規則×2)",
  description:
    "F:∀x.(P(x) → Q(x)) → (∀x.P(x) → ∀x.Q(x)) をルートに配置し、全枝を閉じて証明せよ。γ規則を複数回適用する。",
  difficulty: 2,
  systemPresetId: "at",
  goals: [
    {
      formulaText:
        "all x. (P(x) -> Q(x)) -> (all x. P(x) -> all x. Q(x))",
      label: "Goal: ∀x.(P(x)→Q(x)) → (∀x.P(x) → ∀x.Q(x))",
    },
  ],
  hints: [
    "F(∀x.(P(x) → Q(x)) → (∀x.P(x) → ∀x.Q(x))) をルートに配置しましょう。",
    "F→ を2回適用: T(∀x.(P(x) → Q(x))), T(∀x.P(x)), F(∀x.Q(x)) を得ます。",
    "F(∀x.Q(x)) にδ規則（F∀）を適用: F(Q(a))（固有変数 a）。",
    "T(∀x.(P(x) → Q(x))) にγ規則（T∀、項 a）を適用: T(P(a) → Q(a))。",
    "T(P(a) → Q(a)) にβ規則（T→）を適用: F(P(a)) と T(Q(a)) に分岐。",
    "T(∀x.P(x)) にγ規則（T∀、項 a）を適用: T(P(a))。F(P(a)) と矛盾。T(Q(a)) は F(Q(a)) と矛盾。",
  ],
  estimatedSteps: 7,
  learningPoint:
    "γ規則は同じ全称式に対して複数回適用可能（異なる項で代入）。δ規則で導入した固有変数をγ規則の具体項として使うのが基本パターン。",
  order: 17,
  version: 1,
};

const qAt18UniversalConjunctionDistribution: QuestDefinition = {
  id: "at-18",
  category: "at-basics",
  title: "全称と連言の分配 (γ規則+F∧)",
  description:
    "F:∀x.(P(x) ∧ Q(x)) → (∀x.P(x) ∧ ∀x.Q(x)) をルートに配置し、全枝を閉じて証明せよ。γ規則とF∧β規則を組み合わせる。",
  difficulty: 2,
  systemPresetId: "at",
  goals: [
    {
      formulaText:
        "all x. (P(x) /\\ Q(x)) -> (all x. P(x) /\\ all x. Q(x))",
      label: "Goal: ∀x.(P(x)∧Q(x)) → (∀x.P(x) ∧ ∀x.Q(x))",
    },
  ],
  hints: [
    "F(∀x.(P(x) ∧ Q(x)) → (∀x.P(x) ∧ ∀x.Q(x))) をルートに配置しましょう。",
    "F→ で T(∀x.(P(x) ∧ Q(x))) と F(∀x.P(x) ∧ ∀x.Q(x)) を得ます。",
    "F∧（β規則）で F(∀x.P(x)) と F(∀x.Q(x)) に分岐。",
    "各枝でδ規則（F∀）を適用して固有変数を導入: F(P(a)) / F(Q(b))。",
    "T(∀x.(P(x) ∧ Q(x))) にγ規則（T∀）を適用して T(P(a) ∧ Q(a)) / T(P(b) ∧ Q(b)) を得ます。",
    "T∧（α規則）で T(P(a)), T(Q(a)) / T(P(b)), T(Q(b)) を得て、各枝で矛盾。",
  ],
  estimatedSteps: 7,
  learningPoint:
    "F∧のβ規則で分岐した各枝で、それぞれ独立にδ規則の固有変数を導入する。各枝のγ規則では対応する固有変数を使い分ける。",
  order: 18,
  version: 1,
};

const qAt19ExistentialDisjunctionConverse: QuestDefinition = {
  id: "at-19",
  category: "at-basics",
  title: "存在と選言 (T∨β+δ規則)",
  description:
    "F:(∃x.P(x) ∨ ∃x.Q(x)) → ∃x.(P(x) ∨ Q(x)) をルートに配置し、全枝を閉じて証明せよ。T∨β規則と量化子δ規則を組み合わせる。",
  difficulty: 3,
  systemPresetId: "at",
  goals: [
    {
      formulaText:
        "(ex x. P(x) \\/ ex x. Q(x)) -> ex x. (P(x) \\/ Q(x))",
      label: "Goal: (∃x.P(x) ∨ ∃x.Q(x)) → ∃x.(P(x) ∨ Q(x))",
    },
  ],
  hints: [
    "F((∃x.P(x) ∨ ∃x.Q(x)) → ∃x.(P(x) ∨ Q(x))) をルートに配置しましょう。",
    "F→ で T(∃x.P(x) ∨ ∃x.Q(x)) と F(∃x.(P(x) ∨ Q(x))) を得ます。",
    "T∨（β規則）で T(∃x.P(x)) と T(∃x.Q(x)) に分岐。",
    "各枝でδ規則（T∃）を適用: T(P(a)) / T(Q(b))。",
    "F(∃x.(P(x) ∨ Q(x))) にγ規則（F∃→¬∃なので再考: F∃ はないため F¬∃ 経由ではなく、直接 F(∃x.(P(x)∨Q(x))) に δ 規則は適用不可。代わりに…）",
    "F(∃x.(P(x) ∨ Q(x))) は ¬∃x.(P(x)∨Q(x)) と同じなので γ規則（F∃、任意項）を適用: F(P(a)∨Q(a)) / F(P(b)∨Q(b))。",
    "F∨（α規則）で F(P(a)), F(Q(a)) / F(P(b)), F(Q(b)) を得て矛盾。",
  ],
  estimatedSteps: 7,
  learningPoint:
    "F∃はγ規則（任意項代入）なので同じ式に複数回適用可能。T∨のβ分岐の各枝でδ導入した固有変数をF∃のγ規則に渡す。",
  order: 19,
  version: 1,
};

// --- SCクエスト: シーケント計算の基礎 ---

const qSc01Identity: QuestDefinition = {
  id: "sc-01",
  category: "sc-basics",
  title: "恒等律 (Identity)",
  description:
    "φ → φ をシーケント計算で証明せよ。⇒→ 規則（→右）と Identity 公理で導出する。",
  difficulty: 1,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "phi -> phi",
      label: "Goal: φ → φ",
    },
  ],
  hints: [
    "⇒→ 規則を使うと、⇒ φ → φ を φ ⇒ φ に帰着できます。",
    "φ ⇒ φ は Identity 公理そのものです。",
  ],
  estimatedSteps: 2,
  learningPoint:
    "シーケント計算の ⇒→ 規則は、含意を証明するために前件に仮定を移す操作に相当する。Identity 公理はすべての証明の基礎。",
  order: 1,
  version: 1,
};

const qSc02WeakeningLeft: QuestDefinition = {
  id: "sc-02",
  category: "sc-basics",
  title: "左弱化 (Weakening Left)",
  description:
    "φ → (ψ → φ) をシーケント計算で証明せよ。弱化規則（WL）で不要な前件を追加する。",
  difficulty: 1,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "phi -> (psi -> phi)",
      label: "Goal: φ → (ψ → φ)",
    },
  ],
  hints: [
    "⇒→ 規則を2回使って φ, ψ ⇒ φ に帰着します。",
    "φ ⇒ φ は Identity。そこに WL（左弱化）で ψ を追加すると φ, ψ ⇒ φ になります。",
  ],
  estimatedSteps: 4,
  learningPoint:
    "弱化規則（Weakening）は前件に不要な式を追加する構造規則。Hilbert系のK公理 φ → (ψ → φ) に相当する。",
  order: 2,
  version: 1,
};

const qSc03ContractionLeft: QuestDefinition = {
  id: "sc-03",
  category: "sc-basics",
  title: "左縮約 (Contraction Left)",
  description:
    "(φ → (φ → ψ)) → (φ → ψ) をシーケント計算で証明せよ。縮約規則（CL）で重複する前件をまとめる。",
  difficulty: 2,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "(phi -> (phi -> psi)) -> (phi -> psi)",
      label: "Goal: (φ → (φ → ψ)) → (φ → ψ)",
    },
  ],
  hints: [
    "⇒→ 規則を2回使い、φ → (φ → ψ), φ ⇒ ψ に帰着します。",
    "→⇒ 規則で φ → (φ → ψ) を分解: φ ⇒ φ と φ → ψ, φ ⇒ ψ の2つの前提。",
    "φ → ψ, φ ⇒ ψ も →⇒ で分解。CL（左縮約）で重複するφをまとめます。",
  ],
  estimatedSteps: 7,
  learningPoint:
    "縮約規則（Contraction）は前件の重複を除去する構造規則。仮定を複数回使う証明で必要になる。",
  order: 3,
  version: 1,
};

const qSc04ExchangeLeft: QuestDefinition = {
  id: "sc-04",
  category: "sc-basics",
  title: "交換 (Exchange)",
  description:
    "(φ → (ψ → χ)) → (ψ → (φ → χ)) をシーケント計算で証明せよ。交換規則（XL）で前件の順序を入れ替える。",
  difficulty: 2,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "(phi -> (psi -> chi)) -> (psi -> (phi -> chi))",
      label: "Goal: (φ → (ψ → χ)) → (ψ → (φ → χ))",
    },
  ],
  hints: [
    "⇒→ 規則を3回使い、φ → (ψ → χ), ψ, φ ⇒ χ に帰着します。",
    "→⇒ 規則で φ → (ψ → χ) を分解します。",
    "XL（左交換）で前件の順序を入れ替えて必要な形にします。",
  ],
  estimatedSteps: 8,
  learningPoint:
    "交換規則（Exchange）は前件の順序を入れ替える構造規則。Hilbert系では暗黙だが、シーケント計算では明示的に操作する。",
  order: 4,
  version: 1,
};

const qSc05ConjunctionRight: QuestDefinition = {
  id: "sc-05",
  category: "sc-basics",
  title: "連言導入 (∧R)",
  description:
    "φ → (ψ → (φ /\\ ψ)) をシーケント計算で証明せよ。⇒∧ 規則で連言を構成する。",
  difficulty: 2,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "phi -> (psi -> (phi /\\ psi))",
      label: "Goal: φ → (ψ → (φ ∧ ψ))",
    },
  ],
  hints: [
    "⇒→ を2回使って φ, ψ ⇒ φ ∧ ψ に帰着します。",
    "⇒∧ 規則は2つの前提を要求: φ, ψ ⇒ φ と φ, ψ ⇒ ψ。",
    "それぞれ Identity + WL で導出します。",
  ],
  estimatedSteps: 6,
  learningPoint:
    "⇒∧（∧右）規則は連言を導入する論理規則。2つの前提が必要で、両方の成分を別々に証明する。",
  order: 5,
  version: 1,
};

const qSc06DisjunctionLeft: QuestDefinition = {
  id: "sc-06",
  category: "sc-basics",
  title: "選言除去 (∨L)",
  description:
    "(φ \\/ ψ) → ((φ → χ) → ((ψ → χ) → χ)) をシーケント計算で証明せよ。∨⇒ 規則で選言を分解する。",
  difficulty: 3,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "(phi \\/ psi) -> ((phi -> chi) -> ((psi -> chi) -> chi))",
      label: "Goal: (φ ∨ ψ) → ((φ → χ) → ((ψ → χ) → χ))",
    },
  ],
  hints: [
    "⇒→ を3回使い、φ ∨ ψ, φ → χ, ψ → χ ⇒ χ に帰着します。",
    "∨⇒ 規則で φ ∨ ψ を分解: φ, φ → χ, ψ → χ ⇒ χ と ψ, φ → χ, ψ → χ ⇒ χ の2前提。",
    "各前提で →⇒ 規則を使って χ を導出します。",
  ],
  estimatedSteps: 12,
  learningPoint:
    "∨⇒（∨左）規則は選言を場合分けする論理規則。各分岐で結論を個別に証明する必要がある。",
  order: 6,
  version: 1,
};

const qSc07ExcludedMiddle: QuestDefinition = {
  id: "sc-07",
  category: "sc-basics",
  title: "排中律 (LK)",
  description:
    "φ \\/ ~φ をシーケント計算（LK体系）で証明せよ。古典論理の核心。",
  difficulty: 3,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "phi \\/ ~phi",
      label: "Goal: φ ∨ ¬φ",
    },
  ],
  hints: [
    "⇒∨ 規則と ⇒¬ 規則を組み合わせます。",
    "⇒ φ ∨ ¬φ から、⇒∨₂ で ⇒ ¬φ に帰着し、⇒¬ で φ ⇒ に帰着。",
    "φ ⇒ φ ∨ ¬φ は ⇒∨₁ + Identity。LKでは右辺が複数の式を持てるのがポイント。",
    "右縮約（CR）で右辺の φ ∨ ¬φ をまとめます。",
  ],
  estimatedSteps: 6,
  learningPoint:
    "排中律 φ ∨ ¬φ は LK（古典論理）特有の定理。LJ（直観主義論理）では証明できない。LKでは右辺に複数の式を許すことで証明可能になる。",
  order: 7,
  version: 1,
};

const qSc08DoubleNegationElim: QuestDefinition = {
  id: "sc-08",
  category: "sc-basics",
  title: "二重否定除去 (LK)",
  description:
    "~~φ → φ をシーケント計算（LK体系）で証明せよ。¬⇒ と ⇒¬ の組み合わせ。",
  difficulty: 2,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "~~phi -> phi",
      label: "Goal: ¬¬φ → φ",
    },
  ],
  hints: [
    "⇒→ で ¬¬φ ⇒ φ に帰着します。",
    "¬⇒ 規則で ¬¬φ を分解: ⇒ ¬φ, φ の前提が必要。",
    "⇒¬ 規則で ⇒ ¬φ を φ ⇒ に帰着。φ ⇒ φ は Identity。",
  ],
  estimatedSteps: 4,
  learningPoint:
    "二重否定除去 ¬¬φ → φ はLK特有。¬⇒ 規則は否定を前件から除去し、中身を後件に移す。",
  order: 8,
  version: 1,
};

const qSc09Contraposition: QuestDefinition = {
  id: "sc-09",
  category: "sc-basics",
  title: "対偶 (Contraposition)",
  description:
    "(φ → ψ) → (~ψ → ~φ) をシーケント計算で証明せよ。否定と含意の相互作用。",
  difficulty: 3,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "(phi -> psi) -> (~psi -> ~phi)",
      label: "Goal: (φ → ψ) → (¬ψ → ¬φ)",
    },
  ],
  hints: [
    "⇒→ を2回使い、φ → ψ, ¬ψ ⇒ ¬φ に帰着します。",
    "⇒¬ で φ → ψ, ¬ψ, φ ⇒ に帰着します。",
    "→⇒ で φ → ψ を分解し、¬⇒ で ¬ψ を分解します。",
  ],
  estimatedSteps: 8,
  learningPoint:
    "対偶の証明は含意規則と否定規則の典型的な組み合わせ。シーケント計算では各規則の相互作用が明確に見える。",
  order: 9,
  version: 1,
};

const qSc10DeMorgan: QuestDefinition = {
  id: "sc-10",
  category: "sc-basics",
  title: "ドモルガンの法則",
  description:
    "~(φ /\\ ψ) -> (~φ \\/ ~ψ) をシーケント計算で証明せよ。否定と連言・選言の関係。",
  difficulty: 3,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "~(phi /\\ psi) -> (~phi \\/ ~psi)",
      label: "Goal: ¬(φ ∧ ψ) → (¬φ ∨ ¬ψ)",
    },
  ],
  hints: [
    "⇒→ で ¬(φ ∧ ψ) ⇒ ¬φ ∨ ¬ψ に帰着します。",
    "¬⇒ 規則で ¬(φ ∧ ψ) を分解: ⇒ φ ∧ ψ, ¬φ ∨ ¬ψ の前提。",
    "⇒∧ で φ と ψ を別々に証明。⇒∨ と ⇒¬ を組み合わせます。",
    "LKでは右辺に複数の式を持てるので、¬φ ∨ ¬ψ を右辺に残しながら操作できます。",
  ],
  estimatedSteps: 10,
  learningPoint:
    "ドモルガンの法則はLKの複数式右辺を活用する典型例。否定と連言/選言の双対性がシーケント計算で明確に表現される。",
  order: 10,
  version: 1,
};

// --- LJ体系（直観主義シーケント計算）クエスト ---

const qSc11LjIdentity: QuestDefinition = {
  id: "sc-11",
  category: "sc-basics",
  title: "LJ: 恒等律",
  description:
    "φ → φ を直観主義シーケント計算（LJ体系）で証明せよ。LJでは右辺が高々1つの式に制限される。この基本的な定理はLJでも証明可能。",
  difficulty: 1,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText: "phi -> phi",
      label: "Goal: φ → φ",
    },
  ],
  hints: [
    "LKと同じく ⇒→ 規則で φ ⇒ φ に帰着します。",
    "φ ⇒ φ は Identity 公理そのものです。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "LJ体系では右辺が高々1つの式に制限されるが、恒等律のような基本的な定理は問題なく証明できる。",
  order: 11,
  version: 1,
};

const qSc12LjExFalso: QuestDefinition = {
  id: "sc-12",
  category: "sc-basics",
  title: "LJ: 矛盾からの爆発 (Ex Falso)",
  description:
    "⊥ → φ をLJ体系で証明せよ。⊥⇒（矛盾左）規則を使い、矛盾から任意の命題を導く。直観主義論理の重要な原理。",
  difficulty: 1,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText: "⊥ -> phi",
      label: "Goal: ⊥ → φ",
    },
  ],
  hints: [
    "⇒→ 規則で ⊥ ⇒ φ に帰着します。",
    "⊥⇒ 規則は ⊥ が左辺にあれば任意の結論を導けます。",
  ],
  estimatedSteps: 1,
  learningPoint:
    "⊥⇒（bottom-left）規則は直観主義論理の特徴。矛盾（⊥）からは任意の命題を構成的に導ける。これはLM（最小論理）にはない規則。",
  order: 12,
  version: 1,
};

const qSc13LjContraposition: QuestDefinition = {
  id: "sc-13",
  category: "sc-basics",
  title: "LJ: 対偶",
  description:
    "(φ → ψ) → (¬ψ → ¬φ) をLJ体系で証明せよ。対偶は直観主義論理でも成立する。右辺1式の制限のもとで否定の扱い方を学ぶ。",
  difficulty: 3,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText: "(phi -> psi) -> (~psi -> ~phi)",
      label: "Goal: (φ → ψ) → (¬ψ → ¬φ)",
    },
  ],
  hints: [
    "⇒→ を3回使い、φ → ψ, ¬ψ, φ ⇒ に帰着させます（右辺は空にできます）。",
    "→⇒ 規則で φ → ψ を分解: φ ⇒ φ と ψ, ... ⇒ の前提に分岐。",
    "¬⇒ 規則で ¬ψ を分解: ⇒ ψ の前提を要求します。この ψ を →⇒ の結果で供給します。",
  ],
  estimatedSteps: 5,
  learningPoint:
    "対偶 (φ→ψ)→(¬ψ→¬φ) は直観主義でも成立する。ただし逆の (¬ψ→¬φ)→(φ→ψ) はLJでは証明不可能。",
  order: 13,
  version: 1,
};

const qSc14LjDisjElim: QuestDefinition = {
  id: "sc-14",
  category: "sc-basics",
  title: "LJ: 選言除去",
  description:
    "(φ \\/ ψ) → ((φ → χ) → ((ψ → χ) → χ)) をLJ体系で証明せよ。構成的な選言除去はLJでも証明可能。",
  difficulty: 3,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText: "(phi \\/ psi) -> ((phi -> chi) -> ((psi -> chi) -> chi))",
      label: "Goal: (φ ∨ ψ) → ((φ → χ) → ((ψ → χ) → χ))",
    },
  ],
  hints: [
    "⇒→ を3回使い、φ ∨ ψ, φ → χ, ψ → χ ⇒ χ に帰着します。",
    "∨⇒ 規則で φ ∨ ψ を分解: φ, ... ⇒ χ と ψ, ... ⇒ χ の2つの前提に分岐。",
    "各分岐で →⇒ を使って φ → χ（または ψ → χ）を分解し、Identity で閉じます。",
  ],
  estimatedSteps: 5,
  learningPoint:
    "選言除去は構成的に正しい（各場合を尽くして結論を導く）ため、LJでも問題なく証明できる。右辺1式の制限は影響しない。",
  order: 14,
  version: 1,
};

const qSc15LjConjElim: QuestDefinition = {
  id: "sc-15",
  category: "sc-basics",
  title: "LJ: 連言除去",
  description:
    "(φ ∧ ψ) → φ をLJ体系で証明せよ。∧⇒（連言左）規則で連言を分解する基本操作。",
  difficulty: 1,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText: "(phi /\\ psi) -> phi",
      label: "Goal: (φ ∧ ψ) → φ",
    },
  ],
  hints: [
    "⇒→ 規則で φ ∧ ψ ⇒ φ に帰着します。",
    "∧⇒ 規則で φ ∧ ψ を分解: φ, ψ ⇒ φ になります。",
    "φ ⇒ φ は Identity、ψ は左弱化（weakening-left）で除去できます。",
  ],
  estimatedSteps: 3,
  learningPoint:
    "∧⇒（連言左）規則は連言を前件から分解する基本操作。分解後に不要な成分は弱化で除去する。",
  order: 15,
  version: 1,
};

const qSc16LjConjCommute: QuestDefinition = {
  id: "sc-16",
  category: "sc-basics",
  title: "LJ: 連言の可換性",
  description:
    "(φ ∧ ψ) → (ψ ∧ φ) をLJ体系で証明せよ。連言の左右を入れ替える。∧⇒ と ⇒∧ の組み合わせ。",
  difficulty: 2,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText: "(phi /\\ psi) -> (psi /\\ phi)",
      label: "Goal: (φ ∧ ψ) → (ψ ∧ φ)",
    },
  ],
  hints: [
    "⇒→ 規則で φ ∧ ψ ⇒ ψ ∧ φ に帰着します。",
    "⇒∧ 規則で右辺の ψ ∧ φ を分解: φ ∧ ψ ⇒ ψ と φ ∧ ψ ⇒ φ の2つの前提。",
    "各前提で ∧⇒ 規則を使って φ ∧ ψ を分解し、Identity と弱化で閉じます。",
  ],
  estimatedSteps: 6,
  learningPoint:
    "連言の可換性は ∧⇒（分解）と ⇒∧（導入）の組み合わせで証明する典型例。LJでも問題なく証明可能。",
  order: 16,
  version: 1,
};

const qSc17LjImplicationTransitivity: QuestDefinition = {
  id: "sc-17",
  category: "sc-basics",
  title: "LJ: 含意の推移律",
  description:
    "(φ → ψ) → ((ψ → χ) → (φ → χ)) をLJ体系で証明せよ。含意の推移性は直観主義論理の基本定理。",
  difficulty: 2,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText: "(phi -> psi) -> ((psi -> chi) -> (phi -> chi))",
      label: "Goal: (φ → ψ) → ((ψ → χ) → (φ → χ))",
    },
  ],
  hints: [
    "⇒→ を3回使い、φ → ψ, ψ → χ, φ ⇒ χ に帰着します。",
    "→⇒ 規則で φ → ψ を分解: φ ⇒ φ と ψ, ψ → χ, ... ⇒ χ に分岐。",
    "ψ, ψ → χ ⇒ χ は →⇒ + Identity で閉じます。",
  ],
  estimatedSteps: 5,
  learningPoint:
    "含意の推移律は直観主義論理でも成立する基本定理。→⇒ 規則の繰り返し適用で証明できる。",
  order: 17,
  version: 1,
};

const qSc18LjBottomNegation: QuestDefinition = {
  id: "sc-18",
  category: "sc-basics",
  title: "LJ: 矛盾からの否定帰結",
  description:
    "(φ → ⊥) → (φ → ψ) をLJ体系で証明せよ。¬φ（= φ → ⊥）から任意の帰結を導く。直観主義論理における否定の性質。",
  difficulty: 2,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText: "(phi -> ⊥) -> (phi -> psi)",
      label: "Goal: (φ → ⊥) → (φ → ψ)",
    },
  ],
  hints: [
    "⇒→ を2回使い、φ → ⊥, φ ⇒ ψ に帰着します。",
    "→⇒ 規則で φ → ⊥ を分解: φ ⇒ φ と ⊥, ... ⇒ ψ に分岐。",
    "⊥⇒ 規則で ⊥ から任意の結論を導けます。",
  ],
  estimatedSteps: 4,
  learningPoint:
    "φ → ⊥ は否定 ¬φ のシーケント計算における表現。⊥⇒ 規則と →⇒ を組み合わせると、否定から爆発原理が導ける。",
  order: 18,
  version: 1,
};

const qSc19LjDisjIntro: QuestDefinition = {
  id: "sc-19",
  category: "sc-basics",
  title: "LJ: 選言導入",
  description:
    "φ → (φ ∨ ψ) をLJ体系で証明せよ。⇒∨（選言右）規則で選言を導入する基本操作。",
  difficulty: 1,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText: "phi -> (phi \\/ psi)",
      label: "Goal: φ → (φ ∨ ψ)",
    },
  ],
  hints: [
    "⇒→ 規則で φ ⇒ φ ∨ ψ に帰着します。",
    "⇒∨ 規則で右辺の φ ∨ ψ を導入: φ ⇒ φ に帰着。",
    "φ ⇒ φ は Identity で閉じます。",
  ],
  estimatedSteps: 3,
  learningPoint:
    "⇒∨（選言右）規則は、結論に選言を導入する基本操作。左右どちらの選言肢を選ぶかを指定する。",
  order: 19,
  version: 1,
};

const qSc20LjCurry: QuestDefinition = {
  id: "sc-20",
  category: "sc-basics",
  title: "LJ: カリー化",
  description:
    "((φ ∧ ψ) → χ) → (φ → (ψ → χ)) をLJ体系で証明せよ。連言の前提を含意の連鎖に変換するカリー化の定理。",
  difficulty: 2,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText: "((phi /\\ psi) -> chi) -> (phi -> (psi -> chi))",
      label: "Goal: ((φ ∧ ψ) → χ) → (φ → (ψ → χ))",
    },
  ],
  hints: [
    "⇒→ を3回使い、(φ ∧ ψ) → χ, φ, ψ ⇒ χ に帰着します。",
    "→⇒ 規則で (φ ∧ ψ) → χ を分解: ⇒ φ ∧ ψ と χ ⇒ χ に分岐。",
    "⇒∧ 規則で φ ∧ ψ を構築: φ ⇒ φ と ψ ⇒ ψ （弱化で不要な前件を除去）。",
  ],
  estimatedSteps: 6,
  learningPoint:
    "カリー化は関数型プログラミングの基本概念であり、論理学では連言前提と含意連鎖の等価性に対応する。LJでも証明可能。",
  order: 20,
  version: 1,
};

const qSc21LjUncurry: QuestDefinition = {
  id: "sc-21",
  category: "sc-basics",
  title: "LJ: 逆カリー化",
  description:
    "(φ → (ψ → χ)) → ((φ ∧ ψ) → χ) をLJ体系で証明せよ。含意の連鎖を連言の前提に変換する逆カリー化の定理。",
  difficulty: 2,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText: "(phi -> (psi -> chi)) -> ((phi /\\ psi) -> chi)",
      label: "Goal: (φ → (ψ → χ)) → ((φ ∧ ψ) → χ)",
    },
  ],
  hints: [
    "⇒→ を2回使い、φ → (ψ → χ), φ ∧ ψ ⇒ χ に帰着します。",
    "∧⇒ 規則で φ ∧ ψ を分解: φ, ψ, φ → (ψ → χ) ⇒ χ。",
    "→⇒ を2回適用して φ → (ψ → χ) を分解し、Identity で閉じます。",
  ],
  estimatedSteps: 6,
  learningPoint:
    "逆カリー化はカリー化の逆。∧⇒ で連言を分解し、→⇒ で含意を展開して組み合わせる。",
  order: 21,
  version: 1,
};

const qSc22LjImplicationConjDistrib: QuestDefinition = {
  id: "sc-22",
  category: "sc-basics",
  title: "LJ: 含意と連言の分配",
  description:
    "(φ → (ψ ∧ χ)) → ((φ → ψ) ∧ (φ → χ)) をLJ体系で証明せよ。含意が連言に対して分配する性質。",
  difficulty: 3,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText: "(phi -> (psi /\\ chi)) -> ((phi -> psi) /\\ (phi -> chi))",
      label: "Goal: (φ → (ψ ∧ χ)) → ((φ → ψ) ∧ (φ → χ))",
    },
  ],
  hints: [
    "⇒→ 規則で φ → (ψ ∧ χ) ⇒ (φ → ψ) ∧ (φ → χ) に帰着します。",
    "⇒∧ 規則で右辺を分解: φ → (ψ ∧ χ) ⇒ φ → ψ と φ → (ψ ∧ χ) ⇒ φ → χ の2つの前提。",
    "各前提で ⇒→ + →⇒ + ∧⇒ を使い、連言成分を取り出します。",
  ],
  estimatedSteps: 8,
  learningPoint:
    "含意の連言に対する分配法則。⇒∧ で連言を分解し、各枝で →⇒ と ∧⇒ を組み合わせて証明する。複数の規則の統合的な運用が必要。",
  order: 22,
  version: 1,
};

// --- LK固有クエスト（古典論理のみ証明可能） ---

const qSc23LkPeirceLaw: QuestDefinition = {
  id: "sc-23",
  category: "sc-basics",
  title: "LK: パースの法則",
  description:
    "((φ → ψ) → φ) → φ をシーケント計算（LK体系）で証明せよ。パースの法則は古典論理の特徴的定理で、直観主義論理（LJ）では証明不可能。LKの右辺複数式が本質的に必要。",
  difficulty: 3,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "((phi -> psi) -> phi) -> phi",
      label: "Goal: ((φ → ψ) → φ) → φ",
    },
  ],
  hints: [
    "⇒→ で (φ → ψ) → φ ⇒ φ に帰着します。",
    "→⇒ で (φ → ψ) → φ を分解: ⇒ φ → ψ, φ と φ ⇒ φ の2つの前提。",
    "φ ⇒ φ は Identity。⇒ φ → ψ, φ は ⇒→ で φ ⇒ ψ, φ に帰着。",
    "φ ⇒ ψ, φ は右辺に2式あるので LK 特有。WR（右弱化）で ψ を追加して Identity で閉じます。",
  ],
  estimatedSteps: 6,
  learningPoint:
    "パースの法則 ((φ→ψ)→φ)→φ は排中律と同値な古典論理の原理。LKでは右辺に複数の式を許すことで証明可能になる。LJでは右辺高々1式の制限により証明不可能。",
  order: 23,
  version: 1,
};

const qSc24LkConverseContraposition: QuestDefinition = {
  id: "sc-24",
  category: "sc-basics",
  title: "LK: 逆対偶",
  description:
    "(¬ψ → ¬φ) → (φ → ψ) をシーケント計算（LK体系）で証明せよ。対偶の逆方向はLK固有の定理。LJでは証明不可能。",
  difficulty: 3,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "(~psi -> ~phi) -> (phi -> psi)",
      label: "Goal: (¬ψ → ¬φ) → (φ → ψ)",
    },
  ],
  hints: [
    "⇒→ を2回使い、¬ψ → ¬φ, φ ⇒ ψ に帰着します。",
    "→⇒ で ¬ψ → ¬φ を分解: ⇒ ¬ψ, ψ と ¬φ, φ ⇒ ψ の2つの前提。",
    "⇒¬ で ⇒ ¬ψ, ψ を ψ ⇒ ψ に帰着（LK: 右辺複数式が必要）。",
    "¬⇒ で ¬φ を分解: φ ⇒ ψ は WR + Identity で閉じます。",
  ],
  estimatedSteps: 7,
  learningPoint:
    "逆対偶 (¬ψ→¬φ)→(φ→ψ) はLK固有。対偶 (φ→ψ)→(¬ψ→¬φ) はLJでも証明可能だが、その逆方向は古典論理の右辺複数式を本質的に使う。",
  order: 24,
  version: 1,
};

const qSc25LkImplicationAsDisjunction: QuestDefinition = {
  id: "sc-25",
  category: "sc-basics",
  title: "LK: 含意の選言表現",
  description:
    "(φ → ψ) → (¬φ ∨ ψ) をシーケント計算（LK体系）で証明せよ。含意は古典論理では「否定と選言」で表現できる。この等価性はLK固有。",
  difficulty: 3,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "(phi -> psi) -> (~phi \\/ psi)",
      label: "Goal: (φ → ψ) → (¬φ ∨ ψ)",
    },
  ],
  hints: [
    "⇒→ で φ → ψ ⇒ ¬φ ∨ ψ に帰着します。",
    "→⇒ で φ → ψ を分解: ⇒ φ, ¬φ ∨ ψ と ψ ⇒ ¬φ ∨ ψ の2つの前提。",
    "右辺の ¬φ ∨ ψ は ⇒∨ で分解。⇒¬ と Identity を組み合わせます。",
    "LKの右辺複数式を活用して、φ と ¬φ ∨ ψ を同時に右辺に持てるのがポイント。",
  ],
  estimatedSteps: 7,
  learningPoint:
    "古典論理では φ→ψ と ¬φ∨ψ は同値。この変換はLK固有で、右辺複数式と否定規則の組み合わせが必要。直観主義論理では含意は選言に還元できない。",
  order: 25,
  version: 1,
};

const qSc26LkWeakExcludedMiddle: QuestDefinition = {
  id: "sc-26",
  category: "sc-basics",
  title: "LK: 弱排中律",
  description:
    "¬φ ∨ ¬¬φ をシーケント計算（LK体系）で証明せよ。弱排中律は排中律の変形で、LK固有の定理。",
  difficulty: 2,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "~phi \\/ ~~phi",
      label: "Goal: ¬φ ∨ ¬¬φ",
    },
  ],
  hints: [
    "排中律 φ ∨ ¬φ の証明パターンを応用します。",
    "⇒∨ 規則と ⇒¬ 規則を組み合わせます。",
    "⇒ ¬φ ∨ ¬¬φ から、⇒∨₂ で ⇒ ¬¬φ に帰着し、⇒¬ で ¬φ ⇒ に。",
    "¬φ ⇒ ¬φ ∨ ¬¬φ は ⇒∨₁ + Identity。右縮約で結合します。",
  ],
  estimatedSteps: 6,
  learningPoint:
    "弱排中律 ¬φ∨¬¬φ は排中律 φ∨¬φ と同様にLK固有。排中律の証明パターンを否定に適用した変形。LJでは証明不可能。",
  order: 26,
  version: 1,
};

// --- SC 量化子クエスト ---

const qSc27LjUniversalElim: QuestDefinition = {
  id: "sc-27",
  category: "sc-basics",
  title: "LJ: 全称消去 (∀⇒)",
  description:
    "∀x.P(x) → P(a) をLJ体系で証明せよ。∀⇒（全称左）規則で量化子を消去し、具体的な項に置き換える。シーケント計算における全称消去の基本操作。",
  difficulty: 1,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText: "all x. P(x) -> P(a)",
      label: "Goal: ∀x.P(x) → P(a)",
    },
  ],
  hints: [
    "⇒→ 規則で ∀x.P(x) ⇒ P(a) に帰着します。",
    "∀⇒（全称左）規則で ∀x.P(x) を P(a) に置き換えます。項 a を代入します。",
    "P(a) ⇒ P(a) は Identity（公理）です。",
  ],
  estimatedSteps: 3,
  learningPoint:
    "∀⇒ 規則はシーケントの左辺（前件）にある全称量化子を、具体的な項で置き換える操作。Hilbert系のA4（全称消去）に相当する。",
  order: 27,
  version: 1,
};

const qSc28LjExistentialIntro: QuestDefinition = {
  id: "sc-28",
  category: "sc-basics",
  title: "LJ: 存在導入 (⇒∃)",
  description:
    "P(a) → ∃x.P(x) をLJ体系で証明せよ。⇒∃（存在右）規則で具体的な項から存在量化子を導入する。",
  difficulty: 1,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText: "P(a) -> exists x. P(x)",
      label: "Goal: P(a) → ∃x.P(x)",
    },
  ],
  hints: [
    "⇒→ 規則で P(a) ⇒ ∃x.P(x) に帰着します。",
    "⇒∃（存在右）規則で ∃x.P(x) の証人として項 a を指定します。",
    "P(a) ⇒ P(a) は Identity（公理）です。",
  ],
  estimatedSteps: 3,
  learningPoint:
    "⇒∃ 規則はシーケントの右辺（後件）に存在量化子を導入する操作。具体的な項（証人）を指定して、その項が条件を満たすことを示す。",
  order: 28,
  version: 1,
};

const qSc29LjUniversalToExistential: QuestDefinition = {
  id: "sc-29",
  category: "sc-basics",
  title: "LJ: 全称から存在",
  description:
    "∀x.P(x) → ∃x.P(x) をLJ体系で証明せよ。∀⇒ と ⇒∃ を組み合わせて、全称から存在を導く。",
  difficulty: 2,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText: "all x. P(x) -> exists x. P(x)",
      label: "Goal: ∀x.P(x) → ∃x.P(x)",
    },
  ],
  hints: [
    "⇒→ 規則で ∀x.P(x) ⇒ ∃x.P(x) に帰着します。",
    "∀⇒ 規則で左辺の ∀x.P(x) を P(a) に。⇒∃ 規則で右辺の ∃x.P(x) を P(a) に。",
    "P(a) ⇒ P(a) は Identity（公理）です。",
  ],
  estimatedSteps: 4,
  learningPoint:
    "∀⇒ と ⇒∃ の組み合わせで全称から存在を導出。中間の項 a が全称消去と存在導入の両方で使われるのがポイント。",
  order: 29,
  version: 1,
};

const qSc30LjUniversalSwap: QuestDefinition = {
  id: "sc-30",
  category: "sc-basics",
  title: "LJ: 全称量化子の交換",
  description:
    "∀x.∀y.P(x, y) → ∀y.∀x.P(x, y) をLJ体系で証明せよ。⇒∀（全称右）と ∀⇒（全称左）を組み合わせて量化子の順序を入れ替える。",
  difficulty: 3,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText: "all x. all y. P(x, y) -> all y. all x. P(x, y)",
      label: "Goal: ∀x.∀y.P(x,y) → ∀y.∀x.P(x,y)",
    },
  ],
  hints: [
    "⇒→ 規則で ∀x.∀y.P(x,y) ⇒ ∀y.∀x.P(x,y) に帰着します。",
    "⇒∀ 規則を2回使って右辺の量化子を外します。フレッシュ変数の条件に注意。",
    "∀⇒ 規則を2回使って左辺の量化子を消去し、P(a,b) ⇒ P(a,b) に帰着します。",
  ],
  estimatedSteps: 6,
  learningPoint:
    "⇒∀ 規則のフレッシュ変数条件（固有変数条件）が、量化子の順序交換を正当化する鍵。固有変数はシーケント中の他の自由変数と重複してはならない。",
  order: 30,
  version: 1,
};

const qSc31LjExistentialElim: QuestDefinition = {
  id: "sc-31",
  category: "sc-basics",
  title: "LJ: 存在除去 (∃⇒)",
  description:
    "∃x.(P(x) ∧ Q(x)) → ∃x.P(x) をLJ体系で証明せよ。∃⇒（存在左）規則で存在量化子を除去し、固有変数条件を満たしながら証明を構成する。",
  difficulty: 2,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText: "exists x. (P(x) and Q(x)) -> exists x. P(x)",
      label: "Goal: ∃x.(P(x) ∧ Q(x)) → ∃x.P(x)",
    },
  ],
  hints: [
    "⇒→ 規則で ∃x.(P(x) ∧ Q(x)) ⇒ ∃x.P(x) に帰着します。",
    "∃⇒（存在左）規則で左辺の存在量化子を除去します。固有変数 a を導入します。",
    "∧⇒ で P(a) を取り出し、⇒∃ で ∃x.P(x) を導入します。",
  ],
  estimatedSteps: 5,
  learningPoint:
    "∃⇒ 規則はシーケントの左辺（前件）にある存在量化子を、固有変数で置き換える操作。固有変数は結論のシーケントに現れてはならない（固有変数条件）。",
  order: 31,
  version: 1,
};

const qSc32LjExistentialDistrib: QuestDefinition = {
  id: "sc-32",
  category: "sc-basics",
  title: "LJ: 存在量化子の分配",
  description:
    "∃x.(P(x) ∨ Q(x)) → ∃x.P(x) ∨ ∃x.Q(x) をLJ体系で証明せよ。∃⇒ と ∨⇒ の組み合わせで、存在量化子を選言の外に分配する。",
  difficulty: 3,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText:
        "exists x. (P(x) or Q(x)) -> exists x. P(x) or exists x. Q(x)",
      label: "Goal: ∃x.(P(x) ∨ Q(x)) → ∃x.P(x) ∨ ∃x.Q(x)",
    },
  ],
  hints: [
    "⇒→ 規則で ∃x.(P(x) ∨ Q(x)) ⇒ ∃x.P(x) ∨ ∃x.Q(x) に帰着します。",
    "∃⇒ 規則で存在量化子を除去し、∨⇒ 規則で P(a) と Q(a) の場合分けをします。",
    "各分岐で ⇒∃ と ⇒∨ を使って結論を導きます。",
  ],
  estimatedSteps: 8,
  learningPoint:
    "存在量化子と選言の分配は、∃⇒ で固有変数を導入した後、∨⇒ で場合分けし、各分岐で ⇒∃ と ⇒∨ を組み合わせる典型的なパターン。",
  order: 32,
  version: 1,
};

const qSc33LkNegUniversalToExistNeg: QuestDefinition = {
  id: "sc-33",
  category: "sc-basics",
  title: "LK: 否定全称から存在否定",
  description:
    "¬(∀x.P(x)) → ∃x.¬P(x) をLK体系で証明せよ。LK固有の右辺複数式を活用した古典量化子等価性。直観主義論理（LJ）では証明できない。",
  difficulty: 3,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "not (all x. P(x)) -> exists x. not P(x)",
      label: "Goal: ¬(∀x.P(x)) → ∃x.¬P(x)",
    },
  ],
  hints: [
    "⇒→ 規則で ¬(∀x.P(x)) ⇒ ∃x.¬P(x) に帰着します。",
    "¬⇒ 規則で左辺の否定を処理すると、右辺に ∀x.P(x) と ∃x.¬P(x) が並びます（LK固有）。",
    "⇒∀ と ⇒∃ を使い、⇒¬ で P(a) ⇒ P(a) の Identity に帰着します。",
  ],
  estimatedSteps: 6,
  learningPoint:
    "¬∀ → ∃¬ は古典論理固有の等価性。LKでは右辺に複数の式を置けるため、¬⇒ で否定を処理した後に ∀x.P(x) と ∃x.¬P(x) を同時に扱える。",
  order: 33,
  version: 1,
};

const qSc34LjUniversalImplDistrib: QuestDefinition = {
  id: "sc-34",
  category: "sc-basics",
  title: "LJ: 全称と含意の分配",
  description:
    "∀x.(P(x) → Q(x)) → (∀x.P(x) → ∀x.Q(x)) をLJ体系で証明せよ。∀⇒ と ⇒∀ を組み合わせて、全称量化子を含意の外に分配する。",
  difficulty: 2,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText: "all x. (P(x) -> Q(x)) -> (all x. P(x) -> all x. Q(x))",
      label: "Goal: ∀x.(P(x) → Q(x)) → (∀x.P(x) → ∀x.Q(x))",
    },
  ],
  hints: [
    "⇒→ 規則を2回使って、∀x.(P(x) → Q(x)), ∀x.P(x) ⇒ ∀x.Q(x) に帰着します。",
    "⇒∀ 規則で右辺の ∀x.Q(x) を Q(a) に。フレッシュ変数 a を導入します。",
    "∀⇒ 規則を2回使って P(a) → Q(a) と P(a) を取り出し、→⇒ で Q(a) を導きます。",
  ],
  estimatedSteps: 6,
  learningPoint:
    "全称量化子と含意の分配は、⇒∀ でフレッシュ変数を導入し、∀⇒ で具体化して →⇒ で結論を導く典型パターン。述語論理の重要な性質。",
  order: 34,
  version: 1,
};

// --- カット除去体験クエスト ---

const qScCe01CutBasic: QuestDefinition = {
  id: "sc-ce-01",
  category: "sc-cut-elimination",
  title: "カットの基本: 推移律",
  description:
    "(φ → ψ) → ((ψ → χ) → (φ → χ)) をカット規則を使って証明せよ。2つの含意をカットで合成する基本テクニック。証明完成後、カット除去ステッパーで除去過程を観察しよう。",
  difficulty: 3,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "(phi -> psi) -> ((psi -> chi) -> (phi -> chi))",
      label: "Goal: (φ → ψ) → ((ψ → χ) → (φ → χ))",
    },
  ],
  hints: [
    "⇒→ を3回使い、φ → ψ, ψ → χ, φ ⇒ χ に帰着します。",
    "φ → ψ から →⇒ で φ ⇒ φ と ψ, ... ⇒ χ に分岐。同様に ψ → χ を分解します。",
    "カット規則を使うアプローチ: まず φ → ψ, φ ⇒ ψ（→⇒ + Identity）を導出。次に ψ → χ, ψ ⇒ χ（→⇒ + Identity）を導出。この2つをカット式 ψ で合成すると φ → ψ, ψ → χ, φ ⇒ χ が得られます。",
    "証明完成後、カット除去ステッパーのボタンを押してカット除去過程を確認しましょう。",
  ],
  estimatedSteps: 12,
  learningPoint:
    "カット規則は「補題を使った証明」に対応する。中間式 ψ を媒介にして2つの証明を合成できる。カット除去定理はこの便利なカットが原理的に不要であることを保証する。",
  order: 1,
  version: 1,
};

const qScCe02CutModusPonens: QuestDefinition = {
  id: "sc-ce-02",
  category: "sc-cut-elimination",
  title: "カットと Modus Ponens",
  description:
    "φ → (φ → ψ) → ψ をカット規則を使って証明せよ。Hilbert系のModus Ponensに相当するカットの使い方を体験する。",
  difficulty: 2,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "phi -> ((phi -> psi) -> psi)",
      label: "Goal: φ → ((φ → ψ) → ψ)",
    },
  ],
  hints: [
    "⇒→ を2回使い、φ, φ → ψ ⇒ ψ に帰着します。",
    "→⇒ 規則で φ → ψ を分解するのが直接的な方法です。",
    "カットを使う方法: φ ⇒ φ（Identity）と φ, φ → ψ ⇒ ψ（→⇒）をカット式 φ で合成。",
    "証明完成後、カット除去ステッパーでカットがどう除去されるか確認しましょう。",
  ],
  estimatedSteps: 6,
  learningPoint:
    "カット規則はModus Ponens（前件肯定）の一般化と見なせる。シーケント計算ではカットなしでも →⇒ 規則で直接表現できるが、カットを使うことで証明の構造がモジュール化される。",
  order: 2,
  version: 1,
};

const qScCe03CutConjunctionCommute: QuestDefinition = {
  id: "sc-ce-03",
  category: "sc-cut-elimination",
  title: "カットで連言の可換性",
  description:
    "(φ ∧ ψ) → (ψ ∧ φ) をカット規則で証明せよ。連言の左成分と右成分を個別に取り出し、カットで再構成する。",
  difficulty: 3,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "(phi /\\ psi) -> (psi /\\ phi)",
      label: "Goal: (φ ∧ ψ) → (ψ ∧ φ)",
    },
  ],
  hints: [
    "⇒→ で φ ∧ ψ ⇒ ψ ∧ φ に帰着します。",
    "補題1: φ ∧ ψ ⇒ ψ（∧⇒ で左成分を取得）。補題2: φ ∧ ψ ⇒ φ（∧⇒ で右成分を取得）。",
    "カットを使う方法: 補題1と補題2を ⇒∧ で合成し ψ ∧ φ を構成。あるいは中間結果をカットで繋ぐ。",
    "カット除去ステッパーで、カットが ∧⇒ と ⇒∧ の直接的な組み合わせに変換される過程を観察しましょう。",
  ],
  estimatedSteps: 10,
  learningPoint:
    "連言の可換性はカットなしでも証明できるが、「まず片方を取り出し、次にもう片方を取り出し、最後に組み立てる」というモジュール的思考をカットが表現する。カット除去後はこのモジュール構造が展開される。",
  order: 3,
  version: 1,
};

const qScCe04CutChain: QuestDefinition = {
  id: "sc-ce-04",
  category: "sc-cut-elimination",
  title: "カット連鎖",
  description:
    "(φ → ψ) → ((ψ → χ) → ((χ → theta) → (φ → theta))) を複数のカットを連鎖させて証明せよ。3段の推移律をカットで表現する。",
  difficulty: 4,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText:
        "(phi -> psi) -> ((psi -> chi) -> ((chi -> theta) -> (phi -> theta)))",
      label: "Goal: (φ → ψ) → ((ψ → χ) → ((χ → θ) → (φ → θ)))",
    },
  ],
  hints: [
    "⇒→ を4回使い、φ → ψ, ψ → χ, χ → θ, φ ⇒ θ に帰着します。",
    "カット1: φ → ψ と φ ⇒ φ をカット式 φ で使い、φ → ψ, φ ⇒ ψ を得る。",
    "カット2: ψ → χ と上の結果をカット式 ψ で合成し、..., φ ⇒ χ を得る。",
    "カット3: χ → θ と上の結果をカット式 χ で合成し、最終的に ..., φ ⇒ θ を得る。",
    "証明完成後、カット除去ステッパーでカットが1つずつ除去されていく過程を観察しましょう。深さ（depth）とランク（rank）の変化に注目。",
  ],
  estimatedSteps: 20,
  learningPoint:
    "複数のカットを連鎖させることで、長い推論を段階的に構成できる。カット除去ではこれらが1つずつ除去され、直接的な証明に変換される。除去ステップ数の増加を確認して、カット除去定理の計算量を実感しよう。",
  order: 4,
  version: 1,
};

const qScCe05CutNegation: QuestDefinition = {
  id: "sc-ce-05",
  category: "sc-cut-elimination",
  title: "否定とカット",
  description:
    "¬¬φ → φ をカット規則を使って証明せよ。否定を分解する過程でカットがどう働くかを体験する。",
  difficulty: 3,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "~~phi -> phi",
      label: "Goal: ¬¬φ → φ",
    },
  ],
  hints: [
    "⇒→ で ¬¬φ ⇒ φ に帰着します。",
    "補題: ⇒ ¬φ, φ を証明します（⇒¬ で φ ⇒ φ に帰着、Identity で完了）。",
    "本体: ¬¬φ を ¬⇒ で分解し、⇒ ¬φ, φ を得ます。",
    "カットを使う方法: 補題の結果と ¬⇒ をカットで組み合わせることもできます。",
    "カット除去ステッパーで否定のカット除去を確認しましょう。¬の深さ（depth）が減少する過程に注目。",
  ],
  estimatedSteps: 8,
  learningPoint:
    "否定のカット除去では、¬⇒ と ⇒¬ が互いに「相殺」される。これはカット除去の深さ減少ケースの典型例で、帰納法の仕組みが見える。",
  order: 5,
  version: 1,
};

const qScCe06DontEliminateCut: QuestDefinition = {
  id: "sc-ce-06",
  category: "sc-cut-elimination",
  title: "Don't Eliminate Cut: 証明の膨張",
  description:
    "((φ ∧ ψ) → χ) → (φ → (ψ → χ)) をカット規則を使って証明し、カット除去ステッパーでカット除去による証明サイズの膨張を観察せよ。Boolos (1984) は、カットありの証明は短いがカット除去後は超指数的に膨張する例（H_n 族）を示した。この問題でその「膨張」を小規模に体験する。",
  difficulty: 3,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "((phi /\\ psi) -> chi) -> (phi -> (psi -> chi))",
      label: "Goal: ((φ ∧ ψ) → χ) → (φ → (ψ → χ))",
    },
  ],
  hints: [
    "⇒→ を3回使い、(φ ∧ ψ) → χ, φ, ψ ⇒ χ に帰着します。",
    "カットなしの直接法: →⇒ で (φ ∧ ψ) → χ を分解し、⇒∧ で φ ∧ ψ を再構成する。",
    "カットを使う方法: まず補題として φ, ψ ⇒ φ ∧ ψ を（⇒∧ + Identity で）導出。次にこの結果と (φ ∧ ψ) → χ の →⇒ をカット式 φ ∧ ψ で合成する。",
    "カットを使った証明を完成させたら、ステッパーパネルでカット除去を最後まで進めてみましょう。ステップ数に注目。",
    'Boolos (1984) "Don\'t Eliminate Cut": カットは「補題の再利用」。除去すると補題が展開されて証明が膨張する。リファレンスの「Speed-Up 定理」も参照。',
  ],
  estimatedSteps: 12,
  learningPoint:
    'Boolos (1984) "Don\'t Eliminate Cut" は、カット除去定理は理論的に正しいが、実用上はカット（= 補題の再利用）を排除すると証明サイズが爆発的に増大することを示した。H_n 族ではカットあり O(2^n) に対しカットなし > 2↑↑n（超指数的）。この問題でカット除去の「コスト」を実感し、なぜ自然な推論ではカット（補題）が不可欠かを理解しよう。',
  order: 6,
  version: 1,
};

const qScCe07DisjunctionCommute: QuestDefinition = {
  id: "sc-ce-07",
  category: "sc-cut-elimination",
  title: "カットで選言の可換性",
  description:
    "(φ ∨ ψ) → (ψ ∨ φ) をカット規則を使って証明せよ。選言の分解・再構成にカットがどう関わるかを観察する。証明完成後、カット除去ステッパーで ∨ の深さ減少を確認しよう。",
  difficulty: 2,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "(phi \\/ psi) -> (psi \\/ phi)",
      label: "Goal: (φ ∨ ψ) → (ψ ∨ φ)",
    },
  ],
  hints: [
    "⇒→ で φ ∨ ψ ⇒ ψ ∨ φ に帰着します。",
    "∨⇒ で φ ∨ ψ を分解し、各分岐で ⇒∨ を使って ψ ∨ φ を構成します。",
    "カットを使う方法: 補題として φ ⇒ ψ ∨ φ と ψ ⇒ ψ ∨ φ を個別に導出し、∨⇒ の各分岐をカットで接続する。",
    "証明完成後、カット除去ステッパーで選言のカット除去を観察しましょう。",
  ],
  estimatedSteps: 8,
  learningPoint:
    "選言の可換性はカットなしでも ∨⇒ + ⇒∨ で直接証明できるが、カットを使うと「各成分の処理を独立した補題として分離」できる。カット除去ではこれらの補題が展開され、直接的な分岐証明に変換される。",
  order: 7,
  version: 1,
};

const qScCe08Contraposition: QuestDefinition = {
  id: "sc-ce-08",
  category: "sc-cut-elimination",
  title: "カットで対偶",
  description:
    "(φ → ψ) → (¬ψ → ¬φ) をカット規則を使って証明せよ。否定 ¬α は α → ⊥ として扱われる。カット除去ステッパーで含意と否定のカット除去を確認しよう。",
  difficulty: 3,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "(phi -> psi) -> (~psi -> ~phi)",
      label: "Goal: (φ → ψ) → (¬ψ → ¬φ)",
    },
  ],
  hints: [
    "⇒→ を3回使い、φ, ¬ψ, φ → ψ ⇒ ⊥ に帰着します。",
    "¬ψ は ψ → ⊥ なので →⇒ で分解できます。同様に φ → ψ も →⇒ で分解できます。",
    "カットを使う方法: φ → ψ と φ ⇒ φ（Identity）をカット式 φ で合成し ψ を得る。次に ψ を ¬ψ（= ψ → ⊥）とカットで ⊥ を得る。",
    "カット除去ステッパーで、含意と否定の相互作用によるカット除去を観察しましょう。",
  ],
  estimatedSteps: 10,
  learningPoint:
    "対偶は φ → ψ から ¬ψ → ¬φ を導く古典的な推論。否定を含意（α → ⊥）として扱うことで、カットは「φ → ψ の結論 ψ」を媒介として ¬ψ の前件と合致させる。カット除去後は →⇒ の直接的な分解に変換される。",
  order: 8,
  version: 1,
};

const qScCe09DisjunctionElimination: QuestDefinition = {
  id: "sc-ce-09",
  category: "sc-cut-elimination",
  title: "カットで選言の消去",
  description:
    "(φ → χ) → ((ψ → χ) → ((φ ∨ ψ) → χ)) をカット規則を使って証明せよ。2つの含意と選言をカットで合成し、場合分けの構造を構築する。",
  difficulty: 3,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText: "(phi -> chi) -> ((psi -> chi) -> ((phi \\/ psi) -> chi))",
      label: "Goal: (φ → χ) → ((ψ → χ) → ((φ ∨ ψ) → χ))",
    },
  ],
  hints: [
    "⇒→ を3回使い、φ ∨ ψ, ψ → χ, φ → χ ⇒ χ に帰着します。",
    "∨⇒ で φ ∨ ψ を分解し、左分岐（φ）と右分岐（ψ）を個別に処理します。",
    "左分岐: φ, φ → χ ⇒ χ は →⇒ + Identity で解決。右分岐: ψ, ψ → χ ⇒ χ も同様。",
    "カットを使う方法: 各分岐で φ → χ（または ψ → χ）と Identity をカットで合成する。",
    "カット除去ステッパーで、選言の場合分けとカットの相互作用を観察しましょう。",
  ],
  estimatedSteps: 14,
  learningPoint:
    "選言の消去は「場合分け」に対応する。φ → χ と ψ → χ を持っていれば φ ∨ ψ から χ を導ける。カットは各場合の処理をモジュール化するが、カット除去後は ∨⇒ の分岐内で →⇒ が直接適用される形になる。",
  order: 9,
  version: 1,
};

const qScCe10Distribution: QuestDefinition = {
  id: "sc-ce-10",
  category: "sc-cut-elimination",
  title: "カットで分配律",
  description:
    "(φ ∧ (ψ ∨ χ)) → ((φ ∧ ψ) ∨ (φ ∧ χ)) をカット規則を使って証明せよ。連言と選言の分配律は、カットが連言の分解と選言の構成を橋渡しする例。カット除去による証明サイズの増大を観察しよう。",
  difficulty: 4,
  systemPresetId: "sc-lk",
  goals: [
    {
      formulaText:
        "(phi /\\ (psi \\/ chi)) -> ((phi /\\ psi) \\/ (phi /\\ chi))",
      label: "Goal: (φ ∧ (ψ ∨ χ)) → ((φ ∧ ψ) ∨ (φ ∧ χ))",
    },
  ],
  hints: [
    "⇒→ で φ ∧ (ψ ∨ χ) ⇒ (φ ∧ ψ) ∨ (φ ∧ χ) に帰着します。",
    "∧⇒ で φ と ψ ∨ χ を取り出し、∨⇒ で ψ ∨ χ を分解します。",
    "各分岐で ⇒∧ と ⇒∨ を組み合わせて (φ ∧ ψ) ∨ (φ ∧ χ) を構成します。",
    "カットを使う方法: φ ∧ (ψ ∨ χ) から「φ」を取り出す補題と「ψ ∨ χ」を取り出す補題をカットで合成する。",
    "カット除去ステッパーで、分配律のカット除去が連言・選言の規則をどう展開するか確認しましょう。",
  ],
  estimatedSteps: 18,
  learningPoint:
    "分配律は連言と選言の相互作用を示す重要な法則。カットを使うと「φ の取り出し」を補題として再利用できるが、カット除去後は φ の取り出しが各分岐で独立に行われ、証明が膨張する。これはカット除去の計算コストの典型例。",
  order: 10,
  version: 1,
};

const qScCe11UniversalImplicationDistribution: QuestDefinition = {
  id: "sc-ce-11",
  category: "sc-cut-elimination",
  title: "カットで ∀ の含意分配",
  description:
    "(∀x.(P(x) → Q(x))) → ((∀x.P(x)) → (∀x.Q(x))) をカット規則を使って証明せよ。∀E で個別インスタンスを取り出し、カットで含意と量化子を橋渡しする。カット除去で量化子規則がどう展開されるか観察しよう。",
  difficulty: 3,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText:
        "(all x. (P(x) -> Q(x))) -> ((all x. P(x)) -> (all x. Q(x)))",
      label: "Goal: (∀x.(P(x)→Q(x))) → ((∀x.P(x)) → (∀x.Q(x)))",
    },
  ],
  hints: [
    "⇒→ を2回使い、∀x.(P(x) → Q(x)), ∀x.P(x) ⇒ ∀x.Q(x) に帰着します。",
    "⇒∀ で右辺の ∀x.Q(x) を分解し、固有変数 ζ で ∀x.(P(x) → Q(x)), ∀x.P(x) ⇒ Q(ζ) にします。",
    "∀⇒ で ∀x.P(x) を P(ζ) に、∀x.(P(x) → Q(x)) を P(ζ) → Q(ζ) にインスタンス化します。",
    "カットを使う方法: P(ζ) を中間式として、∀x.P(x) ⇒ P(ζ) と P(ζ), P(ζ)→Q(ζ) ⇒ Q(ζ) をカットで合成。",
    "カット除去ステッパーで、量化子インスタンスのカットがどう除去されるか観察しましょう。",
  ],
  estimatedSteps: 12,
  learningPoint:
    "∀ の含意分配は量化子版の Modus Ponens チェーン。カットを使うと「∀x.P(x) から P(ζ) を取り出す」補題を再利用できる。カット除去後は ∀⇒ が直接適用される形になり、量化子の透明性が見える。",
  order: 11,
  version: 1,
};

const qScCe12ExistentialTransitivity: QuestDefinition = {
  id: "sc-ce-12",
  category: "sc-cut-elimination",
  title: "カットで ∃ の推移律",
  description:
    "(∀x.(P(x) → Q(x))) → ((∃x.P(x)) → (∃x.Q(x))) をカット規則を使って証明せよ。∀ の含意を ∃ に適用し、カットで量化子間の推移を実現する。",
  difficulty: 3,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText:
        "(all x. (P(x) -> Q(x))) -> ((exists x. P(x)) -> (exists x. Q(x)))",
      label: "Goal: (∀x.(P(x)→Q(x))) → ((∃x.P(x)) → (∃x.Q(x)))",
    },
  ],
  hints: [
    "⇒→ を2回使い、∀x.(P(x) → Q(x)), ∃x.P(x) ⇒ ∃x.Q(x) に帰着します。",
    "∃⇒ で左辺の ∃x.P(x) を固有変数 ζ で分解し、P(ζ), ∀x.(P(x)→Q(x)) ⇒ ∃x.Q(x) にします。",
    "∀⇒ で ∀x.(P(x) → Q(x)) を P(ζ) → Q(ζ) にインスタンス化し、→⇒ で分解します。",
    "⇒∃ で Q(ζ) から ∃x.Q(x) を構成します。",
    "カットを使う方法: P(ζ)→Q(ζ) と P(ζ) をカットで合成して Q(ζ) を得る。",
  ],
  estimatedSteps: 14,
  learningPoint:
    "∃ の推移律は「すべての x で P(x)→Q(x) ならば、P を満たす x が存在すれば Q を満たす x も存在する」という自然な推論。カットは ∀⇒ で取り出した含意と ∃⇒ で取り出したインスタンスを橋渡しする。カット除去で量化子と含意のインスタンスが展開される過程を観察しよう。",
  order: 12,
  version: 1,
};

const qScCe13QuantifierDeMorgan: QuestDefinition = {
  id: "sc-ce-13",
  category: "sc-cut-elimination",
  title: "カットで量化子のド・モルガン",
  description:
    "(∀x.¬P(x)) → ¬(∃x.P(x)) をカット規則を使って証明せよ。否定と量化子の変換にカットがどう関わるか体験する。",
  difficulty: 3,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText: "(all x. ~P(x)) -> ~(exists x. P(x))",
      label: "Goal: (∀x.¬P(x)) → ¬(∃x.P(x))",
    },
  ],
  hints: [
    "⇒→ で ∀x.¬P(x) ⇒ ¬(∃x.P(x)) に帰着します。",
    "¬ は → ⊥ なので、⇒→ でさらに ∃x.P(x), ∀x.¬P(x) ⇒ ⊥ にします。",
    "∃⇒ で ∃x.P(x) を固有変数 ζ で分解し、P(ζ), ∀x.¬P(x) ⇒ ⊥ にします。",
    "∀⇒ で ∀x.¬P(x) を ¬P(ζ) にインスタンス化し、¬⇒ で分解します。",
    "カットを使う方法: P(ζ) と ¬P(ζ) をカットで合成して ⊥ を導出。",
  ],
  estimatedSteps: 10,
  learningPoint:
    "量化子のド・モルガン（∀¬ → ¬∃）は否定と量化子の基本的な関係。カットは「∀⇒ で取り出した ¬P(ζ)」と「∃⇒ で取り出した P(ζ)」を媒介して矛盾を導く。カット除去後は否定と量化子の直接的な分解に変換される。",
  order: 13,
  version: 1,
};

const qScCe14QuantifierShift: QuestDefinition = {
  id: "sc-ce-14",
  category: "sc-cut-elimination",
  title: "カットで量化子シフト",
  description:
    "(∀x.(P(x) → Q)) → ((∃x.P(x)) → Q) を証明せよ（Q に x は自由出現しない）。カット規則で ∀ と ∃ の相互作用を体験する。",
  difficulty: 3,
  systemPresetId: "sc-lj",
  goals: [
    {
      formulaText: "(all x. (P(x) -> Q)) -> ((exists x. P(x)) -> Q)",
      label: "Goal: (∀x.(P(x)→Q)) → ((∃x.P(x)) → Q)",
    },
  ],
  hints: [
    "⇒→ を2回使い、∀x.(P(x)→Q), ∃x.P(x) ⇒ Q に帰着します。",
    "∃⇒ で ∃x.P(x) を固有変数 ζ で分解し、P(ζ), ∀x.(P(x)→Q) ⇒ Q にします。",
    "∀⇒ で ∀x.(P(x)→Q) を P(ζ)→Q にインスタンス化し、→⇒ で分解します。",
    "カットを使う方法: P(ζ) を中間式として、P(ζ) ⇒ P(ζ)（Identity）と P(ζ)→Q の →⇒ をカットで合成。",
    "カット除去ステッパーで量化子シフトのカットが除去される過程を観察しましょう。",
  ],
  estimatedSteps: 10,
  learningPoint:
    "量化子シフトは「すべての x で P(x)→Q ならば、ある x で P(x) ならば Q」という推論。Q に x が自由出現しないことが重要。カットは ∀ と ∃ の間の橋渡しをする。これは一階述語論理でのカット除去の典型的なパターンで、量化子が含意を跨いでシフトする構造を持つ。",
  order: 14,
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
  qEq01Reflexivity,
  qEq02Symmetry,
  qEq03Transitivity,
  qEq04ConcreteReflexivity,
  qEq05ConcreteSymmetry,
  qEq06ConcreteTransitivity,
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
  qG09AssociativityInstance,
  qG10RightInverseInstance,
  qG11CommutativityInstance,
  qG12LeftIdentityCompound,
  qG13RightIdentityCompound,
  qG14LeftInverseCompound,
  qG15RightInverseCompound,
  qG16IdentityCommutes,
  qG17InverseCommutes,
  qG18DoubleRightIdentity,
  qG19InverseOfIdentity,
  qPred01UniversalElim,
  qPred02IdentityQuantified,
  qPred03UniversalSwap,
  qPred04ExistentialIntro,
  qPred05ExistNegToNegUniv,
  qPred06UnivNegToNegExist,
  qPredAdv01UniversalImplicationDistribution,
  qPredAdv02NegationOfExistence,
  qPredAdv03NegationOfUniversal,
  qPredAdv04ExistentialImplicationDistribution,
  qPredAdv05QuantifierSwap,
  qPredAdv06UniversalToExistential,
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
  qNd24DeMorganDisjunction,
  qNd25DeMorganDisjunctionReverse,
  qNd26DeMorganConjunction,
  qNd27ConjunctionDisjunctionDistribution,
  qNd28DoubleNegationElim,
  qNd29ContrapositiveReverse,
  qNd30PeirceLaw,
  qNd31DisjunctionConjunctionDistribution,
  qNd32UniversalConjunctionDistribution,
  qNd33ExistentialDisjunctionCombine,
  qNd34NegExistentialToUniversalNeg,
  qNd35UniversalNegToNegExistential,
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
  qTab11DoubleNegationIntro,
  qTab12ExFalso,
  qTab13DeMorgan3,
  qTab14ImplicationConjDistrib,
  qTab15ConjunctionAssoc,
  qTab16DisjunctionAssoc,
  qTab17Absorption,
  qTab18ImplicationDisjunction,
  qAt01ExcludedMiddle,
  qAt02Implication,
  qAt03DoubleNegation,
  qAt04Contraposition,
  qAt05DeMorgan,
  qAt06Distribution,
  qAt07UniversalToExistential,
  qAt08ConjunctionCommute,
  qAt09DisjunctionCommute,
  qAt10Transitivity,
  qAt11DeMorgan2,
  qAt12ImplicationDeMorgan,
  qAt13DoubleNegationIntro,
  qAt14ImplicationDisjunction,
  qAt15PeirceLaw,
  qAt16ExistentialToNegUniversal,
  qAt17UniversalImplicationDistribution,
  qAt18UniversalConjunctionDistribution,
  qAt19ExistentialDisjunctionConverse,
  qSc01Identity,
  qSc02WeakeningLeft,
  qSc03ContractionLeft,
  qSc04ExchangeLeft,
  qSc05ConjunctionRight,
  qSc06DisjunctionLeft,
  qSc07ExcludedMiddle,
  qSc08DoubleNegationElim,
  qSc09Contraposition,
  qSc10DeMorgan,
  qSc11LjIdentity,
  qSc12LjExFalso,
  qSc13LjContraposition,
  qSc14LjDisjElim,
  qSc15LjConjElim,
  qSc16LjConjCommute,
  qSc17LjImplicationTransitivity,
  qSc18LjBottomNegation,
  qSc19LjDisjIntro,
  qSc20LjCurry,
  qSc21LjUncurry,
  qSc22LjImplicationConjDistrib,
  qSc23LkPeirceLaw,
  qSc24LkConverseContraposition,
  qSc25LkImplicationAsDisjunction,
  qSc26LkWeakExcludedMiddle,
  qSc27LjUniversalElim,
  qSc28LjExistentialIntro,
  qSc29LjUniversalToExistential,
  qSc30LjUniversalSwap,
  qSc31LjExistentialElim,
  qSc32LjExistentialDistrib,
  qSc33LkNegUniversalToExistNeg,
  qSc34LjUniversalImplDistrib,
  qScCe01CutBasic,
  qScCe02CutModusPonens,
  qScCe03CutConjunctionCommute,
  qScCe04CutChain,
  qScCe05CutNegation,
  qScCe06DontEliminateCut,
  qScCe07DisjunctionCommute,
  qScCe08Contraposition,
  qScCe09DisjunctionElimination,
  qScCe10Distribution,
  qScCe11UniversalImplicationDistribution,
  qScCe12ExistentialTransitivity,
  qScCe13QuantifierDeMorgan,
  qScCe14QuantifierShift,
];
