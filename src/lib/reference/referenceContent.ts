/**
 * リファレンスコンテンツ定義。
 *
 * 公理、推論規則、論理体系、概念などの
 * ユーザー向け多言語解説データを提供する。
 *
 * パラグラフ単位でen/jaを対応させ、翻訳の同期を取りやすくする。
 *
 * 変更時は referenceContent.test.ts, referenceEntry.ts も同期すること。
 */

import type { ReferenceEntry } from "./referenceEntry";

// ============================================================
// 公理 (Axioms)
// ============================================================

const axiomA1: ReferenceEntry = {
  id: "axiom-a1",
  category: "axiom",
  title: { en: "Axiom A1 (K)", ja: "公理 A1 (K)" },
  summary: {
    en: "φ → (ψ → φ) — What is already known remains true under additional assumptions.",
    ja: "φ → (ψ → φ) — 既知の事実は、追加の仮定のもとでも成り立つ。",
  },
  body: {
    en: [
      "Axiom A1, also called the **K axiom** or **weakening axiom**, states that if φ is true, then ψ → φ holds for any ψ.",
      "In combinatory logic, this corresponds to the K combinator: K = λx.λy.x, which takes two arguments and returns the first.",
      "A1 is common to all Hilbert-style axiom systems implemented in this application (Łukasiewicz, Mendelson, etc.).",
    ],
    ja: [
      "公理A1は**K公理**（弱化公理）とも呼ばれ、φが真ならば、任意のψに対してψ → φが成り立つことを述べます。",
      "コンビネータ論理では、Kコンビネータ K = λx.λy.x に対応します。2つの引数を取り、最初の引数を返します。",
      "A1は、本アプリケーションで実装されているすべてのHilbert系公理体系（Łukasiewicz、Mendelsonなど）に共通です。",
    ],
  },
  formalNotation: "\\varphi \\to (\\psi \\to \\varphi)",
  relatedEntryIds: ["axiom-a2", "axiom-a3", "rule-mp", "system-lukasiewicz"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Hilbert_system",
      label: {
        en: "Hilbert system (Wikipedia)",
        ja: "ヒルベルト体系 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%83%92%E3%83%AB%E3%83%99%E3%83%AB%E3%83%88%E6%B5%81%E6%BC%94%E7%B9%B9%E4%BD%93%E7%B3%BB",
      label: {
        en: "Hilbert-style system (Wikipedia JA)",
        ja: "ヒルベルト流演繹体系 (Wikipedia)",
      },
    },
  ],
  keywords: ["K", "K axiom", "weakening", "A1", "弱化"],
  order: 1,
};

const axiomA2: ReferenceEntry = {
  id: "axiom-a2",
  category: "axiom",
  title: { en: "Axiom A2 (S)", ja: "公理 A2 (S)" },
  summary: {
    en: "(φ → (ψ → χ)) → ((φ → ψ) → (φ → χ)) — Distribution of implication.",
    ja: "(φ → (ψ → χ)) → ((φ → ψ) → (φ → χ)) — 含意の分配。",
  },
  body: {
    en: [
      "Axiom A2, also called the **S axiom**, states that implication distributes over itself. If φ implies (ψ implies χ), and φ implies ψ, then φ implies χ.",
      "In combinatory logic, this corresponds to the S combinator: S = λx.λy.λz.(xz)(yz). Together with K (A1), S and K form a complete basis for combinatory logic.",
      "The proof of φ → φ (identity) uses both A1 and A2: this is the combinatory identity SKK = I.",
    ],
    ja: [
      "公理A2は**S公理**とも呼ばれ、含意が自身に分配することを述べます。φが(ψがχを含意すること)を含意し、φがψを含意するなら、φはχを含意します。",
      "コンビネータ論理では、Sコンビネータ S = λx.λy.λz.(xz)(yz) に対応します。K (A1)とともに、SとKはコンビネータ論理の完全な基盤を形成します。",
      "φ → φ（恒等律）の証明にはA1とA2の両方が使われます。これはコンビネータの等式 SKK = I に対応します。",
    ],
  },
  formalNotation:
    "(\\varphi \\to (\\psi \\to \\chi)) \\to ((\\varphi \\to \\psi) \\to (\\varphi \\to \\chi))",
  relatedEntryIds: ["axiom-a1", "axiom-a3", "rule-mp", "system-lukasiewicz"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/S,_K,_I_combinator_calculus",
      label: { en: "SKI combinator calculus", ja: "SKIコンビネータ計算" },
    },
  ],
  keywords: ["S", "S axiom", "distribution", "A2", "分配"],
  order: 2,
};

const axiomA3: ReferenceEntry = {
  id: "axiom-a3",
  category: "axiom",
  title: { en: "Axiom A3 (Contraposition)", ja: "公理 A3 (対偶)" },
  summary: {
    en: "(¬φ → ¬ψ) → (ψ → φ) — Contraposition: reversing the direction of implication via negation.",
    ja: "(¬φ → ¬ψ) → (ψ → φ) — 対偶: 否定を通じて含意の方向を逆転する。",
  },
  body: {
    en: [
      "Axiom A3 is the **contraposition axiom** used in the Łukasiewicz system. It states that if ¬φ implies ¬ψ, then ψ implies φ.",
      "This axiom captures the essence of classical logic: it is equivalent to the law of excluded middle (φ ∨ ¬φ) and double negation elimination (¬¬φ → φ) in the presence of A1 and A2.",
      "In systems without A3 (using only A1, A2, and MP), you get the **positive implicational calculus**, which is weaker than classical logic.",
    ],
    ja: [
      "公理A3はŁukasiewicz体系で使用される**対偶公理**です。¬φが¬ψを含意するなら、ψはφを含意することを述べます。",
      "この公理は古典論理の本質を捉えます: A1とA2の存在下で、排中律（φ ∨ ¬φ）および二重否定除去（¬¬φ → φ）と同値です。",
      "A3がない体系（A1, A2, MPのみ）は**正含意計算**となり、古典論理より弱い体系になります。",
    ],
  },
  formalNotation:
    "(\\lnot\\varphi \\to \\lnot\\psi) \\to (\\psi \\to \\varphi)",
  relatedEntryIds: [
    "axiom-a1",
    "axiom-a2",
    "axiom-m3",
    "axiom-dne",
    "system-lukasiewicz",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Contraposition",
      label: { en: "Contraposition (Wikipedia)", ja: "対偶 (Wikipedia)" },
    },
  ],
  keywords: ["A3", "contraposition", "Łukasiewicz", "対偶", "classical"],
  order: 3,
};

const axiomM3: ReferenceEntry = {
  id: "axiom-m3",
  category: "axiom",
  title: { en: "Axiom M3 (Reductio)", ja: "公理 M3 (背理法)" },
  summary: {
    en: "(¬φ → ¬ψ) → ((¬φ → ψ) → φ) — Proof by contradiction.",
    ja: "(¬φ → ¬ψ) → ((¬φ → ψ) → φ) — 背理法。",
  },
  body: {
    en: [
      "Axiom M3 is the **reductio ad absurdum** axiom used in the Mendelson system. If assuming ¬φ leads to both ¬ψ and ψ (a contradiction), then φ must be true.",
      "M3 and A3 are interchangeable in the presence of A1 and A2: each can derive the other. They represent different formulations of classical reasoning about negation.",
    ],
    ja: [
      "公理M3はMendelson体系で使用される**背理法**の公理です。¬φを仮定すると¬ψとψの両方が導かれる（矛盾する）なら、φは真でなければなりません。",
      "M3とA3はA1・A2の存在下で互換です: 互いに導出可能です。否定に関する古典的推論の異なる定式化を表しています。",
    ],
  },
  formalNotation:
    "(\\lnot\\varphi \\to \\lnot\\psi) \\to ((\\lnot\\varphi \\to \\psi) \\to \\varphi)",
  relatedEntryIds: ["axiom-a3", "axiom-dne", "system-mendelson"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Reductio_ad_absurdum",
      label: {
        en: "Reductio ad absurdum (Wikipedia)",
        ja: "背理法 (Wikipedia)",
      },
    },
  ],
  keywords: ["M3", "reductio", "Mendelson", "背理法", "contradiction"],
  order: 4,
};

const axiomEfq: ReferenceEntry = {
  id: "axiom-efq",
  category: "axiom",
  title: {
    en: "Axiom EFQ (Ex Falso Quodlibet)",
    ja: "公理 EFQ (爆発律)",
  },
  summary: {
    en: "φ → (¬φ → ψ) — From a contradiction, anything follows.",
    ja: "φ → (¬φ → ψ) — 矛盾からは何でも導ける。",
  },
  body: {
    en: [
      "**Ex falso quodlibet** (from falsehood, anything follows) states that if both φ and ¬φ are true, then any proposition ψ is true.",
      "This axiom is used in intuitionistic and minimal logic systems. It provides the ability to derive arbitrary conclusions from contradictions.",
      "In classical logic, EFQ is derivable from A3 (or M3) via A1 and A2, so it does not need to be added as a separate axiom.",
    ],
    ja: [
      "**爆発律** (Ex falso quodlibet、偽からは何でも導ける) は、φと¬φの両方が真ならば、任意の命題ψが真であることを述べます。",
      "この公理は直観主義論理や最小論理の体系で使用されます。矛盾から任意の結論を導く能力を提供します。",
      "古典論理ではEFQはA3（またはM3）からA1, A2を使って導出可能なので、別の公理として追加する必要はありません。",
    ],
  },
  formalNotation: "\\varphi \\to (\\lnot\\varphi \\to \\psi)",
  relatedEntryIds: ["axiom-dne", "system-intuitionistic", "system-minimal"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Principle_of_explosion",
      label: {
        en: "Principle of explosion (Wikipedia)",
        ja: "爆発律 (Wikipedia)",
      },
    },
  ],
  keywords: ["EFQ", "ex falso", "explosion", "爆発律", "intuitionistic"],
  order: 5,
};

const axiomDne: ReferenceEntry = {
  id: "axiom-dne",
  category: "axiom",
  title: {
    en: "Axiom DNE (Double Negation Elimination)",
    ja: "公理 DNE (二重否定除去)",
  },
  summary: {
    en: "¬¬φ → φ — Removing double negation.",
    ja: "¬¬φ → φ — 二重否定の除去。",
  },
  body: {
    en: [
      "**Double negation elimination** (DNE) states that if it is not the case that φ is not true, then φ is true.",
      "DNE is the key axiom that distinguishes classical logic from intuitionistic logic. Adding DNE to intuitionistic logic yields classical logic.",
      "DNE is equivalent to the law of excluded middle (φ ∨ ¬φ) and Peirce's law (((φ → ψ) → φ) → φ) in the presence of the other axioms.",
    ],
    ja: [
      "**二重否定除去** (DNE) は、φが真でないということがない（¬¬φ）なら、φは真であることを述べます。",
      "DNEは古典論理と直観主義論理を区別する核心的な公理です。直観主義論理にDNEを加えると古典論理になります。",
      "DNEは他の公理の存在下で、排中律（φ ∨ ¬φ）やPeirceの法則（((φ → ψ) → φ) → φ）と同値です。",
    ],
  },
  formalNotation: "\\lnot\\lnot\\varphi \\to \\varphi",
  relatedEntryIds: [
    "axiom-a3",
    "axiom-m3",
    "axiom-efq",
    "system-classical",
    "system-intuitionistic",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Double_negation",
      label: {
        en: "Double negation (Wikipedia)",
        ja: "二重否定 (Wikipedia)",
      },
    },
  ],
  keywords: [
    "DNE",
    "double negation",
    "classical",
    "二重否定",
    "excluded middle",
  ],
  order: 6,
};

const axiomA4: ReferenceEntry = {
  id: "axiom-a4",
  category: "axiom",
  title: {
    en: "Axiom A4 (Universal Instantiation)",
    ja: "公理 A4 (全称例化)",
  },
  summary: {
    en: "∀x.φ → φ[t/x] — From a universal statement, derive a specific instance.",
    ja: "∀x.φ → φ[t/x] — 全称命題から特定のインスタンスを導出する。",
  },
  body: {
    en: [
      "Axiom A4 allows **universal instantiation**: if ∀x.φ holds for all x, then φ[t/x] holds for any specific term t (provided t is free for x in φ).",
      'The side condition "t is free for x in φ" means that substituting t for x does not accidentally capture any free variables of t under a quantifier in φ.',
    ],
    ja: [
      "公理A4は**全称例化**を可能にします: ∀x.φがすべてのxについて成り立つなら、任意の項tに対してφ[t/x]が成り立ちます（tがφにおいてxについて自由であるという条件付き）。",
      "「tがφにおいてxについて自由である」という条件は、xをtに置換してもtの自由変数がφの量化子に捕獲されないことを意味します。",
    ],
  },
  formalNotation: "\\forall x. \\varphi \\to \\varphi[t/x]",
  relatedEntryIds: ["axiom-a5", "rule-gen", "concept-substitution"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Universal_instantiation",
      label: {
        en: "Universal instantiation (Wikipedia)",
        ja: "全称例化 (Wikipedia)",
      },
    },
  ],
  keywords: ["A4", "universal instantiation", "UI", "全称例化", "predicate"],
  order: 7,
};

const axiomA5: ReferenceEntry = {
  id: "axiom-a5",
  category: "axiom",
  title: {
    en: "Axiom A5 (Universal Distribution)",
    ja: "公理 A5 (全称分配)",
  },
  summary: {
    en: "∀x.(φ → ψ) → (φ → ∀x.ψ) — Distributing universal quantifier over implication (when x is not free in φ).",
    ja: "∀x.(φ → ψ) → (φ → ∀x.ψ) — 全称量化子の含意への分配（xがφに自由出現しない場合）。",
  },
  body: {
    en: [
      "Axiom A5 states that if ∀x.(φ → ψ) holds, and x is not free in φ, then φ → ∀x.ψ also holds.",
      "The side condition that x must not be free in φ is essential. Without it, the axiom would be unsound.",
      "Together with A4 and the Gen rule, A5 completes the axiomatization of first-order predicate logic.",
    ],
    ja: [
      "公理A5は、∀x.(φ → ψ)が成り立ち、xがφに自由出現しないならば、φ → ∀x.ψも成り立つことを述べます。",
      "xがφに自由出現しないという条件は本質的です。この条件がなければ、公理は健全ではなくなります。",
      "A4およびGen規則とともに、A5は一階述語論理の公理化を完成させます。",
    ],
  },
  formalNotation:
    "\\forall x.(\\varphi \\to \\psi) \\to (\\varphi \\to \\forall x.\\psi)",
  relatedEntryIds: ["axiom-a4", "rule-gen", "concept-free-variable"],
  externalLinks: [],
  keywords: [
    "A5",
    "universal distribution",
    "全称分配",
    "predicate",
    "side condition",
  ],
  order: 8,
};

const axiomE1: ReferenceEntry = {
  id: "axiom-e1",
  category: "axiom",
  title: { en: "Axiom E1 (Reflexivity)", ja: "公理 E1 (反射律)" },
  summary: {
    en: "∀x. x = x — Every term is equal to itself.",
    ja: "∀x. x = x — すべての項は自分自身と等しい。",
  },
  body: {
    en: [
      "**Reflexivity** is the most fundamental property of equality: every object is equal to itself.",
      "This axiom provides the base case for equality reasoning.",
    ],
    ja: [
      "**反射律**は等号の最も基本的な性質です: すべての対象は自分自身と等しいです。",
      "この公理は等号に関する推論の基本ケースを提供します。",
    ],
  },
  formalNotation: "\\forall x.\\ x = x",
  relatedEntryIds: ["axiom-e2", "axiom-e3"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Equality_(mathematics)",
      label: { en: "Equality (Wikipedia)", ja: "等号 (Wikipedia)" },
    },
  ],
  keywords: ["E1", "reflexivity", "equality", "反射律", "等号"],
  order: 9,
};

const axiomE2: ReferenceEntry = {
  id: "axiom-e2",
  category: "axiom",
  title: { en: "Axiom E2 (Symmetry)", ja: "公理 E2 (対称律)" },
  summary: {
    en: "∀x.∀y. x = y → y = x — Equality is symmetric.",
    ja: "∀x.∀y. x = y → y = x — 等号は対称的である。",
  },
  body: {
    en: [
      "**Symmetry** states that if x equals y, then y equals x. The direction of equality does not matter.",
    ],
    ja: [
      "**対称律**は、xがyと等しいならば、yもxと等しいことを述べます。等号の向きは関係ありません。",
    ],
  },
  formalNotation: "\\forall x. \\forall y.\\ x = y \\to y = x",
  relatedEntryIds: ["axiom-e1", "axiom-e3"],
  externalLinks: [],
  keywords: ["E2", "symmetry", "equality", "対称律"],
  order: 10,
};

const axiomE3: ReferenceEntry = {
  id: "axiom-e3",
  category: "axiom",
  title: { en: "Axiom E3 (Transitivity)", ja: "公理 E3 (推移律)" },
  summary: {
    en: "∀x.∀y.∀z. x = y → (y = z → x = z) — Equality is transitive.",
    ja: "∀x.∀y.∀z. x = y → (y = z → x = z) — 等号は推移的である。",
  },
  body: {
    en: [
      "**Transitivity** states that if x = y and y = z, then x = z. This allows chaining equalities.",
      "Together with reflexivity (E1) and symmetry (E2), transitivity makes equality an equivalence relation.",
    ],
    ja: [
      "**推移律**は、x = y かつ y = z ならば x = z であることを述べます。等式を連鎖させることができます。",
      "反射律(E1)と対称律(E2)とともに、推移律は等号を同値関係にします。",
    ],
  },
  formalNotation:
    "\\forall x. \\forall y. \\forall z.\\ x = y \\to (y = z \\to x = z)",
  relatedEntryIds: ["axiom-e1", "axiom-e2"],
  externalLinks: [],
  keywords: ["E3", "transitivity", "equality", "推移律"],
  order: 11,
};

// ============================================================
// 推論規則 (Inference Rules)
// ============================================================

const ruleMP: ReferenceEntry = {
  id: "rule-mp",
  category: "inference-rule",
  title: { en: "Modus Ponens (MP)", ja: "モーダスポネンス (MP)" },
  summary: {
    en: "From φ and φ → ψ, derive ψ.",
    ja: "φ と φ → ψ から ψ を導出する。",
  },
  body: {
    en: [
      "**Modus ponens** (MP, also called *detachment*) is the sole inference rule in Hilbert-style proof systems.",
      "Given two premises — φ (the minor premise) and φ → ψ (the major premise) — MP allows us to conclude ψ.",
      "All logical reasoning in Hilbert systems reduces to combinations of axiom instances and MP applications.",
    ],
    ja: [
      "**モーダスポネンス** (MP、*分離規則*とも呼ばれる) はHilbert系証明体系における唯一の推論規則です。",
      "2つの前提 — φ（小前提）と φ → ψ（大前提）— から、MPはψを結論として導きます。",
      "Hilbert系におけるすべての論理的推論は、公理インスタンスとMP適用の組み合わせに帰着します。",
    ],
  },
  formalNotation: "\\dfrac{\\varphi \\qquad \\varphi \\to \\psi}{\\psi}",
  relatedEntryIds: ["axiom-a1", "axiom-a2", "rule-gen"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Modus_ponens",
      label: {
        en: "Modus ponens (Wikipedia)",
        ja: "モーダスポネンス (Wikipedia)",
      },
    },
  ],
  keywords: [
    "MP",
    "modus ponens",
    "detachment",
    "モーダスポネンス",
    "分離規則",
  ],
  order: 1,
};

const ruleGen: ReferenceEntry = {
  id: "rule-gen",
  category: "inference-rule",
  title: { en: "Generalization (Gen)", ja: "汎化 (Gen)" },
  summary: {
    en: "From φ, derive ∀x.φ — If φ is provable, then ∀x.φ is provable.",
    ja: "φ から ∀x.φ を導出する — φが証明可能なら、∀x.φも証明可能。",
  },
  body: {
    en: [
      "The **generalization rule** (Gen) allows us to universally quantify over a provable formula.",
      "If φ has been derived (without any undischarged assumptions involving x), then ∀x.φ can be concluded.",
      "Gen is the second inference rule (alongside MP) used in first-order predicate logic.",
    ],
    ja: [
      "**汎化規則** (Gen) は、証明可能な論理式に全称量化子を付けることを許します。",
      "φが（xを含む解除されていない仮定なしに）導出されているなら、∀x.φを結論できます。",
      "Genは一階述語論理で（MPに加えて）使用される第二の推論規則です。",
    ],
  },
  formalNotation: "\\dfrac{\\varphi}{\\forall x. \\varphi}",
  relatedEntryIds: ["rule-mp", "axiom-a4", "axiom-a5"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Universal_generalization",
      label: {
        en: "Universal generalization (Wikipedia)",
        ja: "全称汎化 (Wikipedia)",
      },
    },
  ],
  keywords: ["Gen", "generalization", "universal", "汎化", "全称"],
  order: 2,
};

// ============================================================
// 論理体系 (Logic Systems)
// ============================================================

const systemLukasiewicz: ReferenceEntry = {
  id: "system-lukasiewicz",
  category: "logic-system",
  title: {
    en: "Łukasiewicz System",
    ja: "ウカシェヴィチ体系",
  },
  summary: {
    en: "Classical propositional logic with axioms A1 (K), A2 (S), A3 (contraposition) + MP.",
    ja: "公理 A1 (K), A2 (S), A3 (対偶) + MP による古典命題論理体系。",
  },
  body: {
    en: [
      "The **Łukasiewicz system** is a Hilbert-style axiom system for classical propositional logic, using implication (→) and negation (¬) as primitive connectives.",
      "It consists of three axiom schemas (A1, A2, A3) and one inference rule (Modus Ponens). All three axioms are independent — none can be derived from the others.",
      "Other connectives are defined: φ ∧ ψ ≡ ¬(φ → ¬ψ), φ ∨ ψ ≡ ¬φ → ψ, φ ↔ ψ ≡ (φ → ψ) ∧ (ψ → φ).",
      "The system is sound and complete for classical propositional logic.",
    ],
    ja: [
      "**ウカシェヴィチ体系**は、含意(→)と否定(¬)を原始結合子とする古典命題論理のHilbert系公理体系です。",
      "3つの公理スキーマ(A1, A2, A3)と1つの推論規則(モーダスポネンス)からなります。3つの公理はすべて独立しています — いずれも他から導出できません。",
      "他の結合子は定義されます: φ ∧ ψ ≡ ¬(φ → ¬ψ), φ ∨ ψ ≡ ¬φ → ψ, φ ↔ ψ ≡ (φ → ψ) ∧ (ψ → φ)。",
      "この体系は古典命題論理に対して健全かつ完全です。",
    ],
  },
  relatedEntryIds: [
    "axiom-a1",
    "axiom-a2",
    "axiom-a3",
    "rule-mp",
    "system-mendelson",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Jan_%C5%81ukasiewicz",
      label: {
        en: "Jan Łukasiewicz (Wikipedia)",
        ja: "ヤン・ウカシェヴィチ (Wikipedia)",
      },
    },
  ],
  keywords: [
    "Łukasiewicz",
    "classical",
    "propositional",
    "ウカシェヴィチ",
    "古典",
    "命題論理",
  ],
  order: 1,
};

const systemMendelson: ReferenceEntry = {
  id: "system-mendelson",
  category: "logic-system",
  title: { en: "Mendelson System", ja: "メンデルソン体系" },
  summary: {
    en: "Classical propositional logic with A1, A2, M3 (reductio ad absurdum) + MP.",
    ja: "A1, A2, M3 (背理法) + MP による古典命題論理体系。",
  },
  body: {
    en: [
      "The **Mendelson system** replaces A3 (contraposition) with M3 (reductio ad absurdum). A1 and A2 remain the same.",
      "M3 and A3 are interderivable in the presence of A1 and A2, so both systems prove exactly the same theorems.",
      'The Mendelson system is widely used in logic textbooks (e.g., Mendelson, "Introduction to Mathematical Logic").',
    ],
    ja: [
      "**メンデルソン体系**はA3(対偶)をM3(背理法)に置き換えます。A1とA2はそのままです。",
      "M3とA3はA1・A2の存在下で相互導出可能なので、両体系はまったく同じ定理を証明します。",
      "メンデルソン体系は論理学の教科書で広く使われています（例: Mendelson「Introduction to Mathematical Logic」）。",
    ],
  },
  relatedEntryIds: [
    "axiom-a1",
    "axiom-a2",
    "axiom-m3",
    "rule-mp",
    "system-lukasiewicz",
  ],
  externalLinks: [],
  keywords: ["Mendelson", "classical", "reductio", "メンデルソン", "背理法"],
  order: 2,
};

const systemMinimal: ReferenceEntry = {
  id: "system-minimal",
  category: "logic-system",
  title: { en: "Minimal Logic", ja: "最小論理" },
  summary: {
    en: "The weakest logic: A1, A2 + MP only. No negation axioms.",
    ja: "最も弱い論理: A1, A2 + MP のみ。否定公理なし。",
  },
  body: {
    en: [
      "**Minimal logic** (also called positive implicational calculus when restricted to implication) uses only A1, A2, and MP.",
      "It has no negation axioms, so neither ex falso quodlibet nor double negation elimination hold.",
      "Minimal logic is the common core of all the logic systems in this application.",
    ],
    ja: [
      "**最小論理**（含意に限定した場合、正含意計算とも呼ばれる）はA1, A2, MPのみを使用します。",
      "否定公理がないため、爆発律も二重否定除去も成り立ちません。",
      "最小論理は、本アプリケーションのすべての論理体系に共通する核です。",
    ],
  },
  relatedEntryIds: [
    "axiom-a1",
    "axiom-a2",
    "system-intuitionistic",
    "system-classical",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Minimal_logic",
      label: {
        en: "Minimal logic (Wikipedia)",
        ja: "最小論理 (Wikipedia)",
      },
    },
  ],
  keywords: ["minimal", "最小論理", "positive implicational", "正含意計算"],
  order: 3,
};

const systemIntuitionistic: ReferenceEntry = {
  id: "system-intuitionistic",
  category: "logic-system",
  title: { en: "Intuitionistic Logic", ja: "直観主義論理" },
  summary: {
    en: "A1, A2, EFQ + MP. Constructive reasoning without excluded middle.",
    ja: "A1, A2, EFQ + MP。排中律を持たない構成的推論。",
  },
  body: {
    en: [
      "**Intuitionistic logic** extends minimal logic with ex falso quodlibet (EFQ): φ → (¬φ → ψ).",
      "It does not have the law of excluded middle (φ ∨ ¬φ) or double negation elimination (¬¬φ → φ). A proof of φ requires constructive evidence.",
      "Intuitionistic logic is the foundation of constructive mathematics and is closely connected to type theory via the Curry-Howard correspondence.",
    ],
    ja: [
      "**直観主義論理**は最小論理に爆発律(EFQ) φ → (¬φ → ψ) を加えた体系です。",
      "排中律（φ ∨ ¬φ）や二重否定除去（¬¬φ → φ）は成り立ちません。φの証明には構成的な証拠が必要です。",
      "直観主義論理は構成的数学の基礎であり、Curry-Howard対応を通じて型理論と密接に結びついています。",
    ],
  },
  relatedEntryIds: [
    "axiom-efq",
    "axiom-dne",
    "system-minimal",
    "system-classical",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Intuitionistic_logic",
      label: {
        en: "Intuitionistic logic (Wikipedia)",
        ja: "直観主義論理 (Wikipedia)",
      },
    },
  ],
  keywords: [
    "intuitionistic",
    "constructive",
    "直観主義",
    "構成的",
    "Curry-Howard",
  ],
  order: 4,
};

const systemClassical: ReferenceEntry = {
  id: "system-classical",
  category: "logic-system",
  title: { en: "Classical Logic", ja: "古典論理" },
  summary: {
    en: "Full classical propositional/predicate logic with law of excluded middle.",
    ja: "排中律を含む完全な古典命題/述語論理。",
  },
  body: {
    en: [
      "**Classical logic** extends intuitionistic logic with double negation elimination (DNE): ¬¬φ → φ.",
      "Equivalently, it can be obtained by adding the law of excluded middle (φ ∨ ¬φ), Peirce's law, or other classically equivalent axioms.",
      "In this application, classical logic is realized through the Łukasiewicz system (A1+A2+A3) or Mendelson system (A1+A2+M3), or through the intuitionistic base with DNE added.",
    ],
    ja: [
      "**古典論理**は直観主義論理に二重否定除去(DNE) ¬¬φ → φ を加えた体系です。",
      "同等に、排中律（φ ∨ ¬φ）、Peirceの法則、その他の古典的に同値な公理を加えることでも得られます。",
      "本アプリケーションでは、古典論理はŁukasiewicz体系(A1+A2+A3)、Mendelson体系(A1+A2+M3)、または直観主義ベースにDNEを追加することで実現されます。",
    ],
  },
  relatedEntryIds: [
    "axiom-a3",
    "axiom-m3",
    "axiom-dne",
    "system-lukasiewicz",
    "system-mendelson",
    "system-intuitionistic",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Classical_logic",
      label: {
        en: "Classical logic (Wikipedia)",
        ja: "古典論理 (Wikipedia)",
      },
    },
  ],
  keywords: ["classical", "excluded middle", "古典", "排中律", "LEM", "DNE"],
  order: 5,
};

// ============================================================
// 概念 (Concepts)
// ============================================================

const conceptSubstitution: ReferenceEntry = {
  id: "concept-substitution",
  category: "concept",
  title: { en: "Substitution", ja: "代入" },
  summary: {
    en: "Replacing meta-variables or term variables with specific formulas or terms.",
    ja: "メタ変数や項変数を具体的な論理式や項に置き換える操作。",
  },
  body: {
    en: [
      "**Substitution** is the operation of replacing occurrences of a variable (or meta-variable) with a specific expression.",
      "There are two kinds: *meta-variable substitution* (replacing φ with a specific formula) and *term variable substitution* (replacing x with a specific term in φ[t/x]).",
      "A key concern is **variable capture**: when substituting, free variables in the replacement expression must not become accidentally bound by quantifiers in the target formula.",
    ],
    ja: [
      "**代入**は、変数（またはメタ変数）の出現を特定の式に置き換える操作です。",
      "2種類あります: *メタ変数代入*（φを具体的な論理式に置き換え）と*項変数代入*（φ[t/x]でxを具体的な項に置き換え）。",
      "重要な注意点は**変数捕獲**です: 代入時に、置き換え式の自由変数が対象論理式の量化子に誤って束縛されてはなりません。",
    ],
  },
  relatedEntryIds: ["concept-free-variable", "axiom-a4", "concept-unification"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Substitution_(logic)",
      label: {
        en: "Substitution in logic (Wikipedia)",
        ja: "論理における代入 (Wikipedia)",
      },
    },
  ],
  keywords: [
    "substitution",
    "variable capture",
    "代入",
    "変数捕獲",
    "meta-variable",
  ],
  order: 1,
};

const conceptFreeVariable: ReferenceEntry = {
  id: "concept-free-variable",
  category: "concept",
  title: { en: "Free and Bound Variables", ja: "自由変数と束縛変数" },
  summary: {
    en: "A variable is free if not under a quantifier; bound if quantified.",
    ja: "変数は量化子の下にない場合は自由、量化されている場合は束縛。",
  },
  body: {
    en: [
      "A variable x is **free** in a formula if it occurs outside the scope of any ∀x or ∃x quantifier.",
      "A variable x is **bound** in a formula if it occurs within the scope of a ∀x or ∃x quantifier.",
      "The distinction is critical for substitution (A4) and the side condition of A5: ∀x.(φ→ψ) → (φ→∀x.ψ) requires x not free in φ.",
    ],
    ja: [
      "変数xが論理式中で**自由**であるとは、∀xや∃x量化子のスコープの外に出現することです。",
      "変数xが論理式中で**束縛**されているとは、∀xや∃x量化子のスコープ内に出現することです。",
      "この区別は代入(A4)とA5の条件にとって決定的です: ∀x.(φ→ψ) → (φ→∀x.ψ) はxがφに自由出現しないことを要求します。",
    ],
  },
  relatedEntryIds: ["concept-substitution", "axiom-a4", "axiom-a5"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Free_variables_and_bound_variables",
      label: {
        en: "Free and bound variables (Wikipedia)",
        ja: "自由変数と束縛変数 (Wikipedia)",
      },
    },
  ],
  keywords: [
    "free variable",
    "bound variable",
    "自由変数",
    "束縛変数",
    "scope",
  ],
  order: 2,
};

const conceptUnification: ReferenceEntry = {
  id: "concept-unification",
  category: "concept",
  title: { en: "Unification", ja: "ユニフィケーション" },
  summary: {
    en: "Finding a substitution that makes two formulas identical.",
    ja: "2つの論理式を同一にする代入を見つける操作。",
  },
  body: {
    en: [
      "**Unification** is the process of finding a substitution that makes two formula schemas syntactically identical.",
      "This application uses the Martelli-Montanari algorithm for unification, which handles occurs checks to prevent infinite types.",
      "Unification is used internally when applying MP: the system needs to find substitutions that make the premises match.",
    ],
    ja: [
      "**ユニフィケーション**は、2つの論理式スキーマを構文的に同一にする代入を見つけるプロセスです。",
      "本アプリケーションではMartelli-Montanariアルゴリズムを使用し、無限型を防ぐためのoccursチェックを処理します。",
      "ユニフィケーションはMP適用時に内部的に使用されます: システムは前提をマッチさせる代入を見つける必要があります。",
    ],
  },
  relatedEntryIds: ["concept-substitution", "rule-mp"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Unification_(computer_science)",
      label: {
        en: "Unification (Wikipedia)",
        ja: "ユニフィケーション (Wikipedia)",
      },
    },
  ],
  keywords: [
    "unification",
    "Martelli-Montanari",
    "ユニフィケーション",
    "occurs check",
  ],
  order: 3,
};

// ============================================================
// 理論 (Theories)
// ============================================================

const theoryPeanoArithmetic: ReferenceEntry = {
  id: "theory-peano",
  category: "theory",
  title: { en: "Peano Arithmetic (PA)", ja: "ペアノ算術 (PA)" },
  summary: {
    en: "First-order theory of natural numbers with successor, addition, and multiplication.",
    ja: "後者関数、加法、乗法を持つ自然数の一階理論。",
  },
  body: {
    en: [
      "**Peano Arithmetic** (PA) is a first-order theory that axiomatizes the natural numbers.",
      "Non-logical axioms include: PA1 (0 is not a successor), PA2 (successor is injective), PA3-PA6 (recursion for + and ×), and the induction schema PA7.",
      "In this application, PA is built on top of the predicate logic axioms (A1-A5) and equality axioms (E1-E3).",
    ],
    ja: [
      "**ペアノ算術** (PA) は自然数を公理化する一階理論です。",
      "非論理的公理として、PA1（0は後者ではない）、PA2（後者関数は単射）、PA3-PA6（+と×の再帰的定義）、帰納法スキーマPA7を含みます。",
      "本アプリケーションでは、PAは述語論理公理(A1-A5)と等号公理(E1-E3)の上に構築されます。",
    ],
  },
  relatedEntryIds: ["theory-group", "axiom-e1", "axiom-a4"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Peano_axioms",
      label: {
        en: "Peano axioms (Wikipedia)",
        ja: "ペアノ公理 (Wikipedia)",
      },
    },
  ],
  keywords: [
    "Peano",
    "PA",
    "arithmetic",
    "natural numbers",
    "ペアノ",
    "算術",
    "自然数",
  ],
  order: 1,
};

const theoryGroupTheory: ReferenceEntry = {
  id: "theory-group",
  category: "theory",
  title: { en: "Group Theory", ja: "群論" },
  summary: {
    en: "First-order theory of groups with associativity, identity, and inverse axioms.",
    ja: "結合律、単位元、逆元の公理を持つ群の一階理論。",
  },
  body: {
    en: [
      "**Group theory** axiomatizes algebraic structures with a binary operation (·), identity element (e), and inverse function (i).",
      "Core axioms: G1 (associativity), G2 (identity), G3 (inverse). An abelian group adds G4 (commutativity).",
      "In this application, group theory is built on top of predicate logic and equality axioms, with the group axioms as theory-specific non-logical axioms.",
    ],
    ja: [
      "**群論**は二項演算(·)、単位元(e)、逆元関数(i)を持つ代数構造を公理化します。",
      "核となる公理: G1（結合律）、G2（単位元）、G3（逆元）。アーベル群はG4（交換律）を追加します。",
      "本アプリケーションでは、群論は述語論理と等号公理の上に構築され、群公理が理論固有の非論理的公理として追加されます。",
    ],
  },
  relatedEntryIds: ["theory-peano", "axiom-e1"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Group_theory",
      label: {
        en: "Group theory (Wikipedia)",
        ja: "群論 (Wikipedia)",
      },
    },
  ],
  keywords: [
    "group",
    "群",
    "associativity",
    "identity",
    "inverse",
    "結合律",
    "単位元",
    "逆元",
  ],
  order: 2,
};

// ============================================================
// エクスポート
// ============================================================

/**
 * 全リファレンスエントリの一覧。
 *
 * 新しいエントリを追加する場合はここに追加し、
 * referenceContent.test.ts にもテストを追加すること。
 */
export const allReferenceEntries: readonly ReferenceEntry[] = [
  // Axioms
  axiomA1,
  axiomA2,
  axiomA3,
  axiomM3,
  axiomEfq,
  axiomDne,
  axiomA4,
  axiomA5,
  axiomE1,
  axiomE2,
  axiomE3,
  // Inference Rules
  ruleMP,
  ruleGen,
  // Logic Systems
  systemLukasiewicz,
  systemMendelson,
  systemMinimal,
  systemIntuitionistic,
  systemClassical,
  // Concepts
  conceptSubstitution,
  conceptFreeVariable,
  conceptUnification,
  // Theories
  theoryPeanoArithmetic,
  theoryGroupTheory,
] as const;
