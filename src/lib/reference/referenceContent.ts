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
      "Axiom A1, also called the **K axiom** or **weakening axiom**, states that if φ is true, then ψ → φ holds for any ψ. Intuitively, already known things remain true even with extra assumptions.",
      "In combinatory logic, this corresponds to the K combinator: K = λx.λy.x, which takes two arguments and returns the first.",
      "A1 is common to all Hilbert-style axiom systems implemented in this application (Łukasiewicz, Mendelson, etc.). It appears frequently in proofs when a previously established result needs to be preserved under additional hypotheses.",
    ],
    ja: [
      "公理A1は**K公理**（弱化公理）とも呼ばれ、φが真ならば、任意のψに対してψ → φが成り立つことを述べます。直観的には、既知の事実は追加の仮定があっても真のままです。",
      "コンビネータ論理では、Kコンビネータ K = λx.λy.x に対応します。2つの引数を取り、最初の引数を返します。",
      "A1は、本アプリケーションで実装されているすべてのHilbert系公理体系（Łukasiewicz、Mendelsonなど）に共通です。以前に確立された結果を追加の仮定のもとで保持する必要がある場合に、証明の中で頻繁に出現します。",
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
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/Hilbert+system",
      label: {
        en: "Hilbert system (nLab)",
        ja: "ヒルベルト体系 (nLab)",
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
      "The proof of φ → φ (identity) uses both A1 and A2: this is the combinatory identity SKK = I. Much of proof construction in Hilbert systems reduces to finding appropriate A1 and A2 instantiations.",
    ],
    ja: [
      "公理A2は**S公理**とも呼ばれ、含意が自身に分配することを述べます。φが(ψがχを含意すること)を含意し、φがψを含意するなら、φはχを含意します。",
      "コンビネータ論理では、Sコンビネータ S = λx.λy.λz.(xz)(yz) に対応します。K (A1)とともに、SとKはコンビネータ論理の完全な基盤を形成します。",
      "φ → φ（恒等律）の証明にはA1とA2の両方が使われます。これはコンビネータの等式 SKK = I に対応します。Hilbert系での証明構成の多くは、適切なA1とA2のインスタンス化を見つけることに帰着します。",
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
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/SKI%E3%82%B3%E3%83%B3%E3%83%93%E3%83%8D%E3%83%BC%E3%82%BF%E8%A8%88%E7%AE%97",
      label: {
        en: "SKI combinator calculus (Wikipedia JA)",
        ja: "SKIコンビネータ計算 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/combinatory+logic",
      label: {
        en: "Combinatory logic (nLab)",
        ja: "コンビネータ論理 (nLab)",
      },
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
      "This axiom captures the essence of classical logic. In the presence of A1 and A2, A3 is equivalent to: the law of excluded middle (φ ∨ ¬φ), double negation elimination (¬¬φ → φ), Peirce's law (((φ → ψ) → φ) → φ), and Mendelson's M3.",
      "In systems without A3 (using only A1, A2, and MP), you get the **positive implicational calculus**, which is weaker than classical logic.",
    ],
    ja: [
      "公理A3はŁukasiewicz体系で使用される**対偶公理**です。¬φが¬ψを含意するなら、ψはφを含意することを述べます。",
      "この公理は古典論理の本質を捉えます。A1とA2の存在下で、A3は以下と同値です: 排中律（φ ∨ ¬φ）、二重否定除去（¬¬φ → φ）、Peirceの法則（((φ → ψ) → φ) → φ）、MendelsonのM3。",
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
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E5%AF%BE%E5%81%B6_(%E8%AB%96%E7%90%86%E5%AD%A6)",
      label: { en: "Contraposition (Wikipedia JA)", ja: "対偶 (Wikipedia)" },
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
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E8%83%8C%E7%90%86%E6%B3%95",
      label: {
        en: "Reductio ad absurdum (Wikipedia JA)",
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
      "**Ex falso quodlibet** (from falsehood, anything follows) states that if both φ and ¬φ are true, then any proposition ψ is true. Equivalently, it can be written as ⊥ → φ when a falsum constant ⊥ is available.",
      "This axiom is what distinguishes intuitionistic logic from minimal logic (Johansson's system). Minimal logic has no explosion principle, making it strictly weaker.",
      "In classical logic, EFQ is derivable from A3 (or M3) via A1 and A2, so it does not need to be added as a separate axiom.",
    ],
    ja: [
      "**爆発律** (Ex falso quodlibet、偽からは何でも導ける) は、φと¬φの両方が真ならば、任意の命題ψが真であることを述べます。矛盾定数⊥が利用可能な場合、⊥ → φ とも書けます。",
      "この公理は直観主義論理と最小論理（Johanssonの体系）を区別するものです。最小論理は爆発律を持たないため、厳密に弱い体系です。",
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
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E7%88%86%E7%99%BA%E5%BE%8B",
      label: {
        en: "Principle of explosion (Wikipedia JA)",
        ja: "爆発律 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/ex+falso+quodlibet",
      label: {
        en: "Ex falso quodlibet (nLab)",
        ja: "爆発律 (nLab)",
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
      "In the Łukasiewicz system, ¬¬φ → φ can be derived from A1, A2, A3, and MP, but the proof takes over a dozen steps — illustrating why Hilbert systems are verbose in practice.",
    ],
    ja: [
      "**二重否定除去** (DNE) は、φが真でないということがない（¬¬φ）なら、φは真であることを述べます。",
      "DNEは古典論理と直観主義論理を区別する核心的な公理です。直観主義論理にDNEを加えると古典論理になります。",
      "DNEは他の公理の存在下で、排中律（φ ∨ ¬φ）やPeirceの法則（((φ → ψ) → φ) → φ）と同値です。",
      "Łukasiewicz体系では、¬¬φ → φ はA1, A2, A3, MPから導出可能ですが、十数ステップを要します。Hilbert系が実践的に冗長である理由を示しています。",
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
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E4%BA%8C%E9%87%8D%E5%90%A6%E5%AE%9A%E3%81%AE%E9%99%A4%E5%8E%BB",
      label: {
        en: "Double negation elimination (Wikipedia JA)",
        ja: "二重否定の除去 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/double+negation",
      label: {
        en: "Double negation (nLab)",
        ja: "二重否定 (nLab)",
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
      'The side condition "t is free for x in φ" means that substituting t for x does not accidentally capture any free variables of t under a quantifier in φ. For example, substituting y into ∀y.Q(x,y) would capture y, so it is not allowed.',
      "Examples: From ∀x.P(x), instantiate with t = a to get P(a). From ∀x.Q(x,y), instantiate with t = f(z) to get Q(f(z),y) (valid since z is free for x).",
    ],
    ja: [
      "公理A4は**全称例化**を可能にします: ∀x.φがすべてのxについて成り立つなら、任意の項tに対してφ[t/x]が成り立ちます（tがφにおいてxについて自由であるという条件付き）。",
      "「tがφにおいてxについて自由である」という条件は、xをtに置換してもtの自由変数がφの量化子に捕獲されないことを意味します。例えば、∀y.Q(x,y)にyを代入するとyが捕獲されるため、許可されません。",
      "例: ∀x.P(x)からt = aで例化してP(a)を得る。∀x.Q(x,y)からt = f(z)で例化してQ(f(z),y)を得る（zはxについて自由なので有効）。",
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
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/First-order_logic",
      label: {
        en: "First-order logic (Wikipedia)",
        ja: "一階論理 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E4%B8%80%E9%9A%8E%E8%BF%B0%E8%AA%9E%E8%AB%96%E7%90%86",
      label: {
        en: "First-order logic (Wikipedia JA)",
        ja: "一階述語論理 (Wikipedia)",
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
      "Axiom A5 states that if ∀x.(φ → ψ) holds, and x is not free in φ, then φ → ∀x.ψ also holds. Intuitively, if φ's truth is independent of x, then φ can be moved outside the scope of ∀x.",
      "The side condition that x must not be free in φ is essential. Without it, the axiom would be unsound. For example, ∀x.(P(x) → Q(x)) → (P(x) → ∀x.Q(x)) would be invalid because x appears free in P(x).",
      "Together with A4 and the Gen rule, A5 completes the axiomatization of first-order predicate logic.",
    ],
    ja: [
      "公理A5は、∀x.(φ → ψ)が成り立ち、xがφに自由出現しないならば、φ → ∀x.ψも成り立つことを述べます。直観的には、φの真偽がxに依存しないなら、φを∀xのスコープの外に出せるということです。",
      "xがφに自由出現しないという条件は本質的です。この条件がなければ、公理は健全ではなくなります。例えば、∀x.(P(x) → Q(x)) → (P(x) → ∀x.Q(x))はP(x)にxが自由出現するため不正です。",
      "A4およびGen規則とともに、A5は一階述語論理の公理化を完成させます。",
    ],
  },
  formalNotation:
    "\\forall x.(\\varphi \\to \\psi) \\to (\\varphi \\to \\forall x.\\psi)",
  relatedEntryIds: ["axiom-a4", "rule-gen", "concept-free-variable"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/First-order_logic#Axioms_for_quantifiers",
      label: {
        en: "First-order logic: quantifier axioms (Wikipedia)",
        ja: "一階論理: 量化子の公理 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E4%B8%80%E9%9A%8E%E8%BF%B0%E8%AA%9E%E8%AB%96%E7%90%86",
      label: {
        en: "First-order logic (Wikipedia JA)",
        ja: "一階述語論理 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/first-order+logic",
      label: {
        en: "First-order logic (nLab)",
        ja: "一階論理 (nLab)",
      },
    },
  ],
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
      "This axiom provides the base case for equality reasoning. Via universal instantiation (A4), it gives concrete instances like 0 = 0, f(x) = f(x), and x + y = x + y for any term.",
    ],
    ja: [
      "**反射律**は等号の最も基本的な性質です: すべての対象は自分自身と等しいです。",
      "この公理は等号に関する推論の基本ケースを提供します。全称例化(A4)により、任意の項に対して 0 = 0, f(x) = f(x), x + y = x + y などの具体的なインスタンスが得られます。",
    ],
  },
  formalNotation: "\\forall x.\\ x = x",
  relatedEntryIds: ["axiom-e2", "axiom-e3", "axiom-e4", "axiom-e5"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Equality_(mathematics)",
      label: { en: "Equality (Wikipedia)", ja: "等号 (Wikipedia)" },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E7%AD%89%E5%8F%B7",
      label: { en: "Equality (Wikipedia JA)", ja: "等号 (Wikipedia)" },
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/Reflexive.html",
      label: { en: "Reflexive (MathWorld)", ja: "反射的 (MathWorld)" },
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
  relatedEntryIds: ["axiom-e1", "axiom-e3", "axiom-e4", "axiom-e5"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Symmetric_relation",
      label: {
        en: "Symmetric relation (Wikipedia)",
        ja: "対称関係 (Wikipedia)",
      },
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/EquivalenceRelation.html",
      label: {
        en: "Equivalence relation (MathWorld)",
        ja: "同値関係 (MathWorld)",
      },
    },
  ],
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
      "For multi-step equality chains (e.g., a = b, b = c, c = d → a = d), transitivity must be applied repeatedly.",
    ],
    ja: [
      "**推移律**は、x = y かつ y = z ならば x = z であることを述べます。等式を連鎖させることができます。",
      "反射律(E1)と対称律(E2)とともに、推移律は等号を同値関係にします。",
      "多段の等式連鎖（例: a = b, b = c, c = d → a = d）では、推移律を繰り返し適用する必要があります。",
    ],
  },
  formalNotation:
    "\\forall x. \\forall y. \\forall z.\\ x = y \\to (y = z \\to x = z)",
  relatedEntryIds: ["axiom-e1", "axiom-e2", "axiom-e4", "axiom-e5"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Transitive_relation",
      label: {
        en: "Transitive relation (Wikipedia)",
        ja: "推移関係 (Wikipedia)",
      },
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/Transitive.html",
      label: { en: "Transitive (MathWorld)", ja: "推移的 (MathWorld)" },
    },
  ],
  keywords: ["E3", "transitivity", "equality", "推移律"],
  order: 11,
};

const axiomE4: ReferenceEntry = {
  id: "axiom-e4",
  category: "axiom",
  title: {
    en: "Axiom E4 (Function Congruence)",
    ja: "公理 E4 (関数の合同律)",
  },
  summary: {
    en: "x₁ = y₁ ∧ ··· ∧ xₙ = yₙ → f(x₁,...,xₙ) = f(y₁,...,yₙ) — Equal arguments yield equal function values.",
    ja: "x₁ = y₁ ∧ ··· ∧ xₙ = yₙ → f(x₁,...,xₙ) = f(y₁,...,yₙ) — 等しい引数は等しい関数値を与える。",
  },
  body: {
    en: [
      "**Function congruence** (E4) states that if corresponding arguments are equal, then the function values are also equal. For each n-ary function symbol f in the signature, there is an instance of E4.",
      "For a unary function f: ∀x.∀y. x = y → f(x) = f(y). For a binary operation ∘: ∀x₁.∀y₁.∀x₂.∀y₂. x₁ = y₁ ∧ x₂ = y₂ → x₁ ∘ x₂ = y₁ ∘ y₂.",
      "E4 is a *schema family*: it generates a separate axiom instance for each function symbol in the theory's signature (including binary operators like +, −, ×).",
    ],
    ja: [
      "**関数の合同律** (E4) は、対応する引数が等しければ関数値も等しいことを述べます。シグネチャ中の各n項関数記号fに対してE4のインスタンスがあります。",
      "単項関数fの場合: ∀x.∀y. x = y → f(x) = f(y)。二項演算∘の場合: ∀x₁.∀y₁.∀x₂.∀y₂. x₁ = y₁ ∧ x₂ = y₂ → x₁ ∘ x₂ = y₁ ∘ y₂。",
      "E4は*スキーマ族*です: 理論のシグネチャ中の各関数記号（+, −, ×などの二項演算子を含む）に対して、別個の公理インスタンスが生成されます。",
    ],
  },
  formalNotation:
    "\\forall \\vec{x}. \\forall \\vec{y}.\\ \\bigwedge_i x_i = y_i \\to f(\\vec{x}) = f(\\vec{y})",
  relatedEntryIds: ["axiom-e1", "axiom-e3", "axiom-e5"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Congruence_relation",
      label: {
        en: "Congruence relation (Wikipedia)",
        ja: "合同関係 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E5%90%88%E5%90%8C%E9%96%A2%E4%BF%82",
      label: {
        en: "Congruence relation (Wikipedia JA)",
        ja: "合同関係 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/congruence",
      label: {
        en: "Congruence (nLab)",
        ja: "合同 (nLab)",
      },
    },
  ],
  keywords: [
    "E4",
    "function congruence",
    "congruence",
    "equality",
    "合同律",
    "関数",
  ],
  order: 12,
};

const axiomE5: ReferenceEntry = {
  id: "axiom-e5",
  category: "axiom",
  title: {
    en: "Axiom E5 (Predicate Congruence)",
    ja: "公理 E5 (述語の合同律)",
  },
  summary: {
    en: "x₁ = y₁ ∧ ··· ∧ xₙ = yₙ → (P(x₁,...,xₙ) → P(y₁,...,yₙ)) — Equal arguments preserve predicate truth.",
    ja: "x₁ = y₁ ∧ ··· ∧ xₙ = yₙ → (P(x₁,...,xₙ) → P(y₁,...,yₙ)) — 等しい引数は述語の真偽を保存する。",
  },
  body: {
    en: [
      "**Predicate congruence** (E5) states that if corresponding arguments are equal, and the predicate holds for one set of arguments, it also holds for the other. For each n-ary predicate symbol P, there is an instance of E5.",
      "For a unary predicate P: ∀x.∀y. x = y → (P(x) → P(y)). The reverse direction (P(y) → P(x)) is derivable by combining E2 (symmetry) with E5.",
      "Like E4, E5 is a *schema family*: it generates a separate axiom instance for each predicate symbol in the theory's signature.",
      "E5 is equivalent to the **Leibniz substitution principle**: t₁ = t₂ → φ[t₁/x] → φ[t₂/x], which encompasses both E4 and E5 in a more abstract form.",
    ],
    ja: [
      "**述語の合同律** (E5) は、対応する引数が等しく、一方の引数の組に対して述語が成り立つなら、もう一方でも成り立つことを述べます。シグネチャ中の各n項述語記号Pに対してE5のインスタンスがあります。",
      "単項述語Pの場合: ∀x.∀y. x = y → (P(x) → P(y))。逆方向（P(y) → P(x)）はE2（対称律）とE5を組み合わせて導出できます。",
      "E4と同様に、E5は*スキーマ族*です: 理論のシグネチャ中の各述語記号に対して、別個の公理インスタンスが生成されます。",
      "E5は**ライプニッツの代入原理** t₁ = t₂ → φ[t₁/x] → φ[t₂/x] と同値であり、より抽象的な形でE4とE5の両方を包含します。",
    ],
  },
  formalNotation:
    "\\forall \\vec{x}. \\forall \\vec{y}.\\ \\bigwedge_i x_i = y_i \\to (P(\\vec{x}) \\to P(\\vec{y}))",
  relatedEntryIds: ["axiom-e1", "axiom-e2", "axiom-e4", "concept-substitution"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Leibniz%27s_law",
      label: {
        en: "Identity of indiscernibles (Wikipedia)",
        ja: "不可識別者同一の原理 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E4%B8%8D%E5%8F%AF%E8%AD%98%E5%88%A5%E8%80%85%E5%90%8C%E4%B8%80%E3%81%AE%E5%8E%9F%E7%90%86",
      label: {
        en: "Identity of indiscernibles (Wikipedia JA)",
        ja: "不可識別者同一の原理 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/identity+of+indiscernibles",
      label: {
        en: "Identity of indiscernibles (nLab)",
        ja: "不可識別者同一の原理 (nLab)",
      },
    },
  ],
  keywords: [
    "E5",
    "predicate congruence",
    "Leibniz",
    "congruence",
    "equality",
    "合同律",
    "述語",
    "ライプニッツ",
  ],
  order: 13,
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
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%83%A2%E3%83%BC%E3%83%80%E3%82%B9%E3%83%9D%E3%83%8D%E3%83%B3%E3%82%B9",
      label: {
        en: "Modus ponens (Wikipedia JA)",
        ja: "モーダスポネンス (Wikipedia)",
      },
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/ModusPonens.html",
      label: {
        en: "Modus Ponens (MathWorld)",
        ja: "モーダスポネンス (MathWorld)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/modus+ponens",
      label: {
        en: "Modus ponens (nLab)",
        ja: "モーダスポネンス (nLab)",
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
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E5%85%A8%E7%A7%B0%E6%B1%8E%E5%8C%96",
      label: {
        en: "Universal generalization (Wikipedia JA)",
        ja: "全称汎化 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/universal+quantifier",
      label: {
        en: "Universal quantifier (nLab)",
        ja: "全称量化子 (nLab)",
      },
    },
  ],
  keywords: ["Gen", "generalization", "universal", "汎化", "全称"],
  order: 2,
};

const ruleNdOverview: ReferenceEntry = {
  id: "rule-nd-overview",
  category: "inference-rule",
  title: {
    en: "Natural Deduction (Overview)",
    ja: "自然演繹 (概要)",
  },
  summary: {
    en: "A proof system using introduction and elimination rules for each connective.",
    ja: "各結合子に対する導入規則と除去規則を用いる証明体系。",
  },
  body: {
    en: [
      "**Natural deduction** (ND) is a proof system introduced by Gentzen (1935) where each logical connective has *introduction* rules (how to prove it) and *elimination* rules (how to use it).",
      "Three variants are supported: **NM** (minimal logic, no explosion or DNE), **NJ** (intuitionistic logic, adds EFQ), and **NK** (classical logic, adds DNE). NM ⊂ NJ ⊂ NK in terms of provable theorems.",
      "Unlike Hilbert systems (which use only MP), natural deduction allows *assuming* a hypothesis and later *discharging* it — e.g., to prove φ → ψ, assume φ and derive ψ.",
      "This application's implementation follows Bekki (戸次大介)『数理論理学』Chapter 8.",
    ],
    ja: [
      "**自然演繹** (ND) はGentzen (1935) が導入した証明体系で、各論理結合子に*導入規則*（どう証明するか）と*除去規則*（どう使うか）があります。",
      "3つの変種をサポートします: **NM**（最小論理、爆発律もDNEもなし）、**NJ**（直観主義論理、EFQを追加）、**NK**（古典論理、DNEを追加）。証明可能な定理の範囲は NM ⊂ NJ ⊂ NK です。",
      "Hilbert系（MPのみ使用）と異なり、自然演繹では仮定を*仮定*して後で*解除*することができます — 例えば、φ → ψ を証明するには、φを仮定してψを導出します。",
      "本アプリケーションの実装は戸次大介『数理論理学』第8章に基づいています。",
    ],
  },
  relatedEntryIds: [
    "rule-mp",
    "rule-nd-implication",
    "rule-nd-conjunction",
    "rule-nd-disjunction",
    "rule-sc-overview",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Natural_deduction",
      label: {
        en: "Natural deduction (Wikipedia)",
        ja: "自然演繹 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E8%87%AA%E7%84%B6%E6%BC%94%E7%B9%B9",
      label: {
        en: "Natural deduction (Wikipedia JA)",
        ja: "自然演繹 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/natural+deduction",
      label: {
        en: "Natural deduction (nLab)",
        ja: "自然演繹 (nLab)",
      },
    },
  ],
  keywords: [
    "natural deduction",
    "ND",
    "NM",
    "NJ",
    "NK",
    "Gentzen",
    "自然演繹",
    "導入規則",
    "除去規則",
  ],
  order: 3,
};

const ruleNdImplication: ReferenceEntry = {
  id: "rule-nd-implication",
  category: "inference-rule",
  title: {
    en: "ND: Implication Rules (→I / →E)",
    ja: "ND: 含意規則 (→I / →E)",
  },
  summary: {
    en: "→I discharges an assumption to form φ→ψ; →E is Modus Ponens.",
    ja: "→Iは仮定を解除してφ→ψを形成し、→Eはモーダスポネンス。",
  },
  body: {
    en: [
      "**Implication Introduction (→I)**: Assume φ, derive ψ, then discharge the assumption to conclude φ → ψ. This is the core mechanism of natural deduction — hypothetical reasoning.",
      "**Implication Elimination (→E)**: From φ and φ → ψ, derive ψ. This is exactly Modus Ponens (MP).",
      "→I is the rule that most distinguishes natural deduction from Hilbert systems: instead of needing the deduction theorem as a metatheorem, it is built directly into the proof system.",
    ],
    ja: [
      "**含意導入 (→I)**: φを仮定し、ψを導出し、その仮定を解除してφ → ψを結論します。これは自然演繹の核心的メカニズム — 仮説的推論です。",
      "**含意除去 (→E)**: φとφ → ψからψを導出します。これはモーダスポネンス(MP)そのものです。",
      "→Iは自然演繹をHilbert系から最も区別する規則です: 演繹定理をメタ定理として必要とする代わりに、証明体系に直接組み込まれています。",
    ],
  },
  formalNotation:
    "\\to\\text{I}: \\dfrac{[\\varphi] \\quad \\vdots \\quad \\psi}{\\varphi \\to \\psi} \\qquad \\to\\text{E}: \\dfrac{\\varphi \\quad \\varphi \\to \\psi}{\\psi}",
  relatedEntryIds: [
    "rule-mp",
    "rule-nd-overview",
    "rule-nd-conjunction",
    "rule-nd-disjunction",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Natural_deduction#Implication_introduction_and_elimination",
      label: {
        en: "ND implication rules (Wikipedia)",
        ja: "自然演繹の含意規則 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Deduction_theorem",
      label: {
        en: "Deduction theorem (Wikipedia)",
        ja: "演繹定理 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E6%BC%94%E7%B9%B9%E5%AE%9A%E7%90%86",
      label: {
        en: "Deduction theorem (Wikipedia JA)",
        ja: "演繹定理 (Wikipedia)",
      },
    },
  ],
  keywords: [
    "implication introduction",
    "implication elimination",
    "→I",
    "→E",
    "含意導入",
    "含意除去",
    "deduction theorem",
    "演繹定理",
  ],
  order: 4,
};

const ruleNdConjunction: ReferenceEntry = {
  id: "rule-nd-conjunction",
  category: "inference-rule",
  title: {
    en: "ND: Conjunction Rules (∧I / ∧E)",
    ja: "ND: 連言規則 (∧I / ∧E)",
  },
  summary: {
    en: "∧I combines two formulas into a conjunction; ∧E extracts a component.",
    ja: "∧Iは2つの論理式を連言に結合し、∧Eは成分を取り出す。",
  },
  body: {
    en: [
      "**Conjunction Introduction (∧I)**: From φ and ψ, derive φ ∧ ψ. Both components must be proven independently.",
      "**Conjunction Elimination (∧E)**: From φ ∧ ψ, derive φ (left projection) or ψ (right projection). There are two variants: ∧E-left and ∧E-right.",
      "In Hilbert systems, conjunction is typically defined as φ ∧ ψ ≡ ¬(φ → ¬ψ), making these rules derivable rather than primitive.",
    ],
    ja: [
      "**連言導入 (∧I)**: φとψからφ ∧ ψを導出します。両方の成分を独立に証明する必要があります。",
      "**連言除去 (∧E)**: φ ∧ ψからφ（左射影）またはψ（右射影）を導出します。∧E-左と∧E-右の2つの変種があります。",
      "Hilbert系では連言は通常 φ ∧ ψ ≡ ¬(φ → ¬ψ) と定義されるため、これらの規則は原始的ではなく導出可能です。",
    ],
  },
  formalNotation:
    "\\land\\text{I}: \\dfrac{\\varphi \\quad \\psi}{\\varphi \\land \\psi} \\qquad \\land\\text{E}: \\dfrac{\\varphi \\land \\psi}{\\varphi} \\quad \\dfrac{\\varphi \\land \\psi}{\\psi}",
  relatedEntryIds: [
    "rule-nd-overview",
    "rule-nd-implication",
    "rule-nd-disjunction",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Conjunction_introduction",
      label: {
        en: "Conjunction introduction (Wikipedia)",
        ja: "連言導入 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Conjunction_elimination",
      label: {
        en: "Conjunction elimination (Wikipedia)",
        ja: "連言除去 (Wikipedia)",
      },
    },
  ],
  keywords: [
    "conjunction introduction",
    "conjunction elimination",
    "∧I",
    "∧E",
    "連言導入",
    "連言除去",
    "and",
  ],
  order: 5,
};

const ruleNdDisjunction: ReferenceEntry = {
  id: "rule-nd-disjunction",
  category: "inference-rule",
  title: {
    en: "ND: Disjunction Rules (∨I / ∨E)",
    ja: "ND: 選言規則 (∨I / ∨E)",
  },
  summary: {
    en: "∨I introduces a disjunction from one component; ∨E performs case analysis.",
    ja: "∨Iは一方の成分から選言を導入し、∨Eは場合分けを行う。",
  },
  body: {
    en: [
      "**Disjunction Introduction (∨I)**: From φ, derive φ ∨ ψ (left injection) or ψ ∨ φ (right injection). Only one disjunct needs to be proven.",
      "**Disjunction Elimination (∨E)**: From φ ∨ ψ, assuming φ yields χ, and assuming ψ also yields χ, then conclude χ. This is proof by cases — the most complex natural deduction rule, requiring two subproofs.",
      "In Hilbert systems, disjunction is defined as φ ∨ ψ ≡ ¬φ → ψ, and case analysis must be reconstructed from this definition.",
    ],
    ja: [
      "**選言導入 (∨I)**: φからφ ∨ ψ（左注入）またはψ ∨ φ（右注入）を導出します。選言肢の一方だけを証明すれば十分です。",
      "**選言除去 (∨E)**: φ ∨ ψから、φを仮定してχを導出し、ψを仮定してもχを導出できるなら、χを結論します。これは場合分けによる証明 — 自然演繹で最も複雑な規則であり、2つの部分証明を必要とします。",
      "Hilbert系では選言は φ ∨ ψ ≡ ¬φ → ψ と定義され、場合分けはこの定義から再構成する必要があります。",
    ],
  },
  formalNotation:
    "\\lor\\text{I}: \\dfrac{\\varphi}{\\varphi \\lor \\psi} \\qquad \\lor\\text{E}: \\dfrac{\\varphi \\lor \\psi \\quad [\\varphi] \\vdots \\chi \\quad [\\psi] \\vdots \\chi}{\\chi}",
  relatedEntryIds: [
    "rule-nd-overview",
    "rule-nd-implication",
    "rule-nd-conjunction",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Disjunction_introduction",
      label: {
        en: "Disjunction introduction (Wikipedia)",
        ja: "選言導入 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Disjunction_elimination",
      label: {
        en: "Disjunction elimination (Wikipedia)",
        ja: "選言除去 (Wikipedia)",
      },
    },
  ],
  keywords: [
    "disjunction introduction",
    "disjunction elimination",
    "∨I",
    "∨E",
    "選言導入",
    "選言除去",
    "case analysis",
    "場合分け",
    "or",
  ],
  order: 6,
};

const ruleScOverview: ReferenceEntry = {
  id: "rule-sc-overview",
  category: "inference-rule",
  title: {
    en: "Sequent Calculus (Overview)",
    ja: "シーケント計算 (概要)",
  },
  summary: {
    en: "A proof system using sequents Γ ⇒ Δ with left/right rules for each connective.",
    ja: "シーケント Γ ⇒ Δ を用い、各結合子に左右規則を持つ証明体系。",
  },
  body: {
    en: [
      "**Sequent calculus** (SC) is a proof system introduced by Gentzen (1935) alongside natural deduction. Proofs manipulate *sequents* of the form Γ ⇒ Δ, meaning 'from the multiset of assumptions Γ, at least one formula in Δ holds.'",
      "Each logical connective has a **left rule** (how it behaves as an assumption) and a **right rule** (how it behaves as a conclusion). Structural rules (weakening, contraction, exchange) control the shape of sequents.",
      "Three variants are supported: **LM** (minimal logic, right side exactly 1 formula), **LJ** (intuitionistic logic, right side at most 1 formula), and **LK** (classical logic, unrestricted right side).",
      "The **cut elimination theorem** (Gentzen's Hauptsatz) proves that the cut rule can always be eliminated, yielding proofs in a canonical form — a fundamental result in proof theory.",
    ],
    ja: [
      "**シーケント計算** (SC) はGentzen (1935) が自然演繹とともに導入した証明体系です。*シーケント* Γ ⇒ Δ を操作します。意味は「仮定の多重集合Γから、Δの論理式の少なくとも1つが成り立つ」です。",
      "各論理結合子に**左規則**（仮定としてどう振る舞うか）と**右規則**（結論としてどう振る舞うか）があります。構造規則（弱化、縮約、交換）がシーケントの形を制御します。",
      "3つの変種をサポートします: **LM**（最小論理、右辺はちょうど1つの論理式）、**LJ**（直観主義論理、右辺は高々1つ）、**LK**（古典論理、右辺の制約なし）。",
      "**カット除去定理** (Gentzenの基本定理, Hauptsatz) は、カット規則が常に除去可能であることを証明し、正規形の証明が得られます — 証明論における基本的な結果です。",
    ],
  },
  relatedEntryIds: [
    "rule-nd-overview",
    "rule-sc-structural",
    "rule-sc-logical",
    "rule-mp",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Sequent_calculus",
      label: {
        en: "Sequent calculus (Wikipedia)",
        ja: "シーケント計算 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%B7%E3%83%BC%E3%82%B1%E3%83%B3%E3%83%88%E8%A8%88%E7%AE%97",
      label: {
        en: "Sequent calculus (Wikipedia JA)",
        ja: "シーケント計算 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/sequent+calculus",
      label: {
        en: "Sequent calculus (nLab)",
        ja: "シーケント計算 (nLab)",
      },
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/Sequent.html",
      label: {
        en: "Sequent (MathWorld)",
        ja: "シーケント (MathWorld)",
      },
    },
  ],
  keywords: [
    "sequent calculus",
    "SC",
    "LM",
    "LJ",
    "LK",
    "Gentzen",
    "Hauptsatz",
    "シーケント計算",
    "カット除去",
    "sequent",
  ],
  order: 7,
};

const ruleScStructural: ReferenceEntry = {
  id: "rule-sc-structural",
  category: "inference-rule",
  title: {
    en: "SC: Structural Rules",
    ja: "SC: 構造規則",
  },
  summary: {
    en: "Cut, weakening, contraction, and exchange rules that manipulate sequent structure without introducing logical connectives.",
    ja: "カット、弱化、縮約、交換 — 論理結合子を導入せずにシーケントの構造を操作する規則群。",
  },
  body: {
    en: [
      "Structural rules manipulate the shape of sequents without referring to any logical connective. In Gentzen-style sequent calculus, each structural rule has a left variant (operating on the antecedent) and a right variant (operating on the succedent). The availability of right-side variants is the key distinction between LK (classical), LJ (intuitionistic), and LM (minimal) (Bekki, Definitions 10.3, 10.23, 10.36).",
      "**Identity (ID)**: φ ⇒ φ — the axiom of sequent calculus. Every formula implies itself. Present in all three systems (LK, LJ, LM).",
      "**Cut**: From Γ ⇒ Π,φ and φ,Σ ⇒ Δ, derive Γ,Σ ⇒ Π,Δ. Corresponds to lemma usage — proving an intermediate result and then using it. The cut elimination theorem (Theorem 11.2) shows that cut is *admissible*: any sequent provable with cut can also be proved without it, though the proof may be much larger.",
      "**Weakening (w)**: Left weakening (w⇒) adds an unused formula to the antecedent: from Γ ⇒ Δ derive φ,Γ ⇒ Δ. Right weakening (⇒w) adds to the succedent: from Γ ⇒ Δ derive Γ ⇒ Δ,φ. In **LK**, both variants are primitive rules. In **LJ**, only left weakening (w⇒) and a restricted right weakening (⇒w, only when succedent is empty) are available, because the succedent has at most one formula. In **LM**, right weakening is effectively unavailable (Remark 10.35): the succedent is never empty in a subproof, so ⇒w cannot be applied. In tableau-style sequent calculus (TAB), weakening is not a primitive rule but is *admissible* (Theorem 12.9).",
      "**Contraction (c)**: Left contraction (c⇒) merges duplicates in the antecedent: from φ,φ,Γ ⇒ Δ derive φ,Γ ⇒ Δ. Right contraction (⇒c) merges duplicates in the succedent: from Γ ⇒ Δ,φ,φ derive Γ ⇒ Δ,φ. In **LK**, both variants are available. In **LJ** and **LM**, only left contraction (c⇒) is available, since the succedent length is already at most 1. In TAB, contraction is also *admissible* (Theorem 12.11): one can always absorb duplicate formulas without an explicit contraction step.",
      "**Exchange (e)**: Left exchange (e⇒) reorders formulas in the antecedent: from Γ,φ,ψ,Σ ⇒ Δ derive Γ,ψ,φ,Σ ⇒ Δ. Right exchange (⇒e) does the same in the succedent. In **LK**, both variants are available. In **LJ** and **LM**, only left exchange (e⇒) is primitive, since the succedent has at most one formula. In practice, many formulations use multisets instead of sequences, making exchange implicit.",
      "**Differences across systems**: LK has full left/right symmetry in structural rules. LJ restricts the succedent to at most one formula (Definition 10.20), removing ⇒w, ⇒c, and ⇒e as independent rules. LM further removes the ⊥⇒ axiom from LJ (Definition 10.36), and effectively cannot use ⇒w (Remark 10.35). The inclusion relations are LM ⊂ LJ ⊂ LK (Theorems 10.26, 10.34).",
      "**Admissibility and cut elimination**: The cut elimination theorem (Theorem 11.2) holds for all three systems: LK, LJ, and LM. After cut elimination, the resulting proof uses only the identity axiom, structural rules other than cut, and logical rules. In TAB (tableau-style sequent calculus), weakening and contraction are *admissible* rather than primitive (Theorems 12.9, 12.11), meaning they can always be eliminated from proofs without loss of provability.",
    ],
    ja: [
      "構造規則は、論理結合子に言及することなくシーケントの形を操作する規則です。ゲンツェン流シーケント計算では、各構造規則に前件（左辺）に作用する左規則と後件（右辺）に作用する右規則があります。右側の規則の利用可否が、LK（古典）、LJ（直観主義）、LM（最小）の体系間の核心的な違いです（戸次, 定義10.3, 10.23, 10.36）。",
      "**同一律 (ID)**: φ ⇒ φ — シーケント計算の公理。すべての論理式は自分自身を含意します。LK, LJ, LM のすべてで利用できます。",
      "**カット (Cut)**: Γ ⇒ Π,φ と φ,Σ ⇒ Δ から Γ,Σ ⇒ Π,Δ を導出します。中間結果を証明してそれを使うという補題の使用に対応します。カット除去定理（定理11.2）により、カットは*許容的*です：カットを使って証明可能なシーケントは、カットなしでも証明できます（ただし証明はずっと大きくなりうります）。",
      "**弱化 (w)**: 左弱化(w⇒)は前件に未使用の論理式を追加します：Γ ⇒ Δ から φ,Γ ⇒ Δ。右弱化(⇒w)は後件に追加します：Γ ⇒ Δ から Γ ⇒ Δ,φ。**LK**では両方が基本規則です。**LJ**では左弱化(w⇒)と制限付き右弱化（後件が空のときのみ⇒w）のみ利用可能です（後件は高々1個の論理式のため）。**LM**では右弱化は実質的に利用不可能です（解説10.35）：部分証明中に後件が空になることがないため、⇒wを適用できません。タブロー式シーケント計算(TAB)では、弱化は基本規則ではなく*許容規則*です（定理12.9）。",
      "**縮約 (c)**: 左縮約(c⇒)は前件の重複を統合します：φ,φ,Γ ⇒ Δ から φ,Γ ⇒ Δ。右縮約(⇒c)は後件の重複を統合します：Γ ⇒ Δ,φ,φ から Γ ⇒ Δ,φ。**LK**では両方利用可能です。**LJ**と**LM**では後件の長さが高々1なので、左縮約(c⇒)のみ利用可能です。TABでも、縮約は*許容規則*です（定理12.11）：明示的な縮約ステップなしに重複する論理式を吸収できます。",
      "**交換 (e)**: 左交換(e⇒)は前件の論理式を並び替えます：Γ,φ,ψ,Σ ⇒ Δ から Γ,ψ,φ,Σ ⇒ Δ。右交換(⇒e)は後件で同様の操作を行います。**LK**では両方利用可能です。**LJ**と**LM**では後件が高々1個のため、左交換(e⇒)のみが基本規則です。実用的には多重集合ベースの定式化で交換を暗黙化することが一般的です。",
      "**体系間の違い**: LKは構造規則について完全な左右対称性を持ちます。LJは後件を高々1個の論理式に制限し（定義10.20）、⇒w, ⇒c, ⇒e を独立した規則として持ちません。LMはさらにLJから ⊥⇒ 公理を除いた体系で（定義10.36）、実質的に ⇒w も使用できません（解説10.35）。包含関係は LM ⊂ LJ ⊂ LK です（定理10.26, 10.34）。",
      "**許容性とカット除去**: カット除去定理（定理11.2）はLK, LJ, LMすべてで成り立ちます。カット除去後の証明は、同一律公理、カット以外の構造規則、論理規則のみを使用します。TAB（タブロー式シーケント計算）では、弱化と縮約は基本規則ではなく*許容規則*です（定理12.9, 12.11）。つまり、証明可能性を失うことなく証明から常に除去できます。",
    ],
  },
  formalNotation:
    "\\text{Cut}: \\dfrac{\\Gamma \\Rightarrow \\Pi, \\varphi \\qquad \\varphi, \\Sigma \\Rightarrow \\Delta}{\\Gamma, \\Sigma \\Rightarrow \\Pi, \\Delta} \\\\ \\text{w}\\Rightarrow: \\dfrac{\\Gamma \\Rightarrow \\Delta}{\\varphi, \\Gamma \\Rightarrow \\Delta} \\qquad \\Rightarrow\\text{w}: \\dfrac{\\Gamma \\Rightarrow \\Delta}{\\Gamma \\Rightarrow \\Delta, \\varphi} \\\\ \\text{c}\\Rightarrow: \\dfrac{\\varphi, \\varphi, \\Gamma \\Rightarrow \\Delta}{\\varphi, \\Gamma \\Rightarrow \\Delta} \\qquad \\Rightarrow\\text{c}: \\dfrac{\\Gamma \\Rightarrow \\Delta, \\varphi, \\varphi}{\\Gamma \\Rightarrow \\Delta, \\varphi}",
  relatedEntryIds: [
    "rule-sc-overview",
    "rule-sc-logical",
    "concept-cut-elimination",
    "concept-admissible-derivable",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Sequent_calculus#Structural_rules",
      label: {
        en: "Sequent calculus: Structural rules (Wikipedia)",
        ja: "シーケント計算: 構造規則 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%B7%E3%83%BC%E3%82%AF%E3%82%A8%E3%83%B3%E3%83%88%E8%A8%88%E7%AE%97",
      label: {
        en: "Sequent calculus (Wikipedia JA)",
        ja: "シーケント計算 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/structural+rule",
      label: {
        en: "Structural rule (nLab)",
        ja: "構造規則 (nLab)",
      },
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Cut-elimination_theorem",
      label: {
        en: "Cut-elimination theorem (Wikipedia)",
        ja: "カット除去定理 (Wikipedia)",
      },
    },
  ],
  keywords: [
    "cut",
    "weakening",
    "contraction",
    "exchange",
    "structural rule",
    "identity",
    "admissible",
    "LK",
    "LJ",
    "LM",
    "カット",
    "弱化",
    "縮約",
    "交換",
    "構造規則",
    "同一律",
    "許容規則",
  ],
  order: 8,
};

const ruleScLogical: ReferenceEntry = {
  id: "rule-sc-logical",
  category: "inference-rule",
  title: {
    en: "SC: Logical Rules",
    ja: "SC: 論理規則",
  },
  summary: {
    en: "Left/right introduction rules for →, ∧, ∨, ∀, ∃ in sequent calculus.",
    ja: "シーケント計算における →, ∧, ∨, ∀, ∃ の左右導入規則。",
  },
  body: {
    en: [
      "**Implication**: (→⇒) decomposes φ→ψ on the left into two subgoals; (⇒→) moves φ from right to left assumptions to prove ψ.",
      "**Conjunction**: (∧⇒) selects one conjunct from the left; (⇒∧) requires proving both conjuncts on the right.",
      "**Disjunction**: (∨⇒) performs case analysis on the left; (⇒∨) selects which disjunct to prove on the right.",
      "**Universal**: (∀⇒) instantiates with a term on the left; (⇒∀) introduces a fresh eigenvariable on the right.",
      "**Existential**: (∃⇒) introduces a fresh eigenvariable on the left; (⇒∃) instantiates with a term on the right.",
    ],
    ja: [
      "**含意**: (→⇒) 左のφ→ψを2つの部分目標に分解します; (⇒→) 右のφを左の仮定に移してψを証明します。",
      "**連言**: (∧⇒) 左から連言の一方を選びます; (⇒∧) 右の両方の連言肢を証明する必要があります。",
      "**選言**: (∨⇒) 左で場合分けを行います; (⇒∨) 右でどちらの選言肢を証明するか選びます。",
      "**全称**: (∀⇒) 左で項によって例化します; (⇒∀) 右で新しい固有変数を導入します。",
      "**存在**: (∃⇒) 左で新しい固有変数を導入します; (⇒∃) 右で項によって例化します。",
    ],
  },
  formalNotation:
    "\\to\\Rightarrow: \\dfrac{\\Gamma \\Rightarrow \\Delta, \\varphi \\qquad \\psi, \\Gamma' \\Rightarrow \\Delta'}{\\varphi \\to \\psi, \\Gamma, \\Gamma' \\Rightarrow \\Delta, \\Delta'}",
  relatedEntryIds: [
    "rule-sc-overview",
    "rule-sc-structural",
    "rule-nd-implication",
    "rule-nd-conjunction",
    "rule-nd-disjunction",
    "concept-context-sharing-independence",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Sequent_calculus#Inference_rules",
      label: {
        en: "Sequent calculus inference rules (Wikipedia)",
        ja: "シーケント計算の推論規則 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%B7%E3%83%BC%E3%82%AF%E3%82%A8%E3%83%B3%E3%83%88%E8%A8%88%E7%AE%97",
      label: {
        en: "Sequent calculus (Wikipedia JA)",
        ja: "シーケント計算 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/sequent+calculus",
      label: {
        en: "Sequent calculus (nLab)",
        ja: "シーケント計算 (nLab)",
      },
    },
  ],
  keywords: [
    "logical rule",
    "left rule",
    "right rule",
    "implication",
    "conjunction",
    "disjunction",
    "universal",
    "existential",
    "論理規則",
    "左規則",
    "右規則",
  ],
  order: 9,
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
      "The **Łukasiewicz system** is a Hilbert-style axiom system for classical propositional logic, named after the Polish logician Jan Łukasiewicz (1878–1956). It uses implication (→) and negation (¬) as primitive connectives.",
      "It consists of three axiom schemas — **A1** (φ → (ψ → φ)), **A2** ((φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))), **A3** ((¬φ → ¬ψ) → (ψ → φ)) — and one inference rule (Modus Ponens). All three axioms are independent: none can be derived from the others.",
      "Other connectives are defined in terms of → and ¬: φ ∧ ψ ≡ ¬(φ → ¬ψ), φ ∨ ψ ≡ ¬φ → ψ, φ ↔ ψ ≡ (φ → ψ) ∧ (ψ → φ). This minimality is characteristic of Hilbert-style systems.",
      "The system is **sound and complete** for classical propositional logic: every provable formula is a tautology (soundness), and every tautology is provable (completeness).",
      "In this application, the Łukasiewicz system serves as the default classical propositional base. It can be extended with predicate logic axioms (A4, A5 + Gen) for first-order logic, equality axioms (E1–E5) for equality logic, and theory-specific axioms (e.g., Peano Arithmetic, Group Theory) for mathematical theories.",
      "**Hierarchy in this application**: Minimal Logic (A1+A2) ⊂ Intuitionistic (A1+A2+EFQ) ⊂ Łukasiewicz/Classical (A1+A2+A3). The Łukasiewicz and Mendelson systems prove exactly the same theorems but use different formulations of the classical negation axiom.",
      '**Standard references**: This axiom system appears in many logic textbooks. The contraposition formulation (A3) is associated with the Polish school of logic. For Japanese readers, Daisuke Bekki\'s "数理論理学" covers Hilbert-style axiom systems in the Polish tradition.',
    ],
    ja: [
      "**ウカシェヴィチ体系**は、ポーランドの論理学者ヤン・ウカシェヴィチ (1878–1956) の名にちなむ古典命題論理のHilbert系公理体系です。含意(→)と否定(¬)を原始結合子とします。",
      "3つの公理スキーマ — **A1** (φ → (ψ → φ))、**A2** ((φ → (ψ → χ)) → ((φ → ψ) → (φ → χ)))、**A3** ((¬φ → ¬ψ) → (ψ → φ)) — と1つの推論規則(モーダスポネンス)からなります。3つの公理はすべて独立しています: いずれも他から導出できません。",
      "他の結合子は→と¬で定義されます: φ ∧ ψ ≡ ¬(φ → ¬ψ)、φ ∨ ψ ≡ ¬φ → ψ、φ ↔ ψ ≡ (φ → ψ) ∧ (ψ → φ)。この最小性はHilbert系の特徴です。",
      "この体系は古典命題論理に対して**健全かつ完全**です: 証明可能な論理式はすべてトートロジーであり（健全性）、すべてのトートロジーは証明可能です（完全性）。",
      "本アプリケーションでは、ウカシェヴィチ体系がデフォルトの古典命題論理基盤です。述語論理公理(A4, A5 + Gen)で一階論理へ、等号公理(E1–E5)で等号論理へ、理論公理（ペアノ算術、群論など）で数学理論へと拡張できます。",
      "**本アプリケーションでの階層**: 最小論理(A1+A2) ⊂ 直観主義(A1+A2+EFQ) ⊂ ウカシェヴィチ/古典(A1+A2+A3)。ウカシェヴィチ体系とメンデルソン体系はまったく同じ定理を証明しますが、古典的否定公理の定式化が異なります。",
      "**参考文献**: この公理系は多くの論理学教科書に登場します。対偶形式(A3)はポーランド学派の論理学に関連します。日本語では、戸次大介『数理論理学』がポーランド流のHilbert系公理体系を扱っています。",
    ],
  },
  relatedEntryIds: [
    "axiom-a1",
    "axiom-a2",
    "axiom-a3",
    "rule-mp",
    "system-mendelson",
    "system-classical",
    "system-minimal",
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
      url: "https://ja.wikipedia.org/wiki/%E3%83%92%E3%83%AB%E3%83%99%E3%83%AB%E3%83%88%E6%B5%81%E8%A8%BC%E6%98%8E%E8%AB%96",
      label: {
        en: "Hilbert-style deduction system (Wikipedia JA)",
        ja: "ヒルベルト流証明論 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/Hilbert+system",
      label: {
        en: "Hilbert system (nLab)",
        ja: "ヒルベルト体系 (nLab)",
      },
    },
  ],
  keywords: [
    "Łukasiewicz",
    "classical",
    "propositional",
    "Hilbert",
    "ウカシェヴィチ",
    "古典",
    "命題論理",
    "ヒルベルト",
    "sound",
    "complete",
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
      "The **Mendelson system** is a Hilbert-style axiom system for classical propositional logic, named after the American logician Elliott Mendelson (1931–2020). It replaces the Łukasiewicz contraposition axiom A3 with M3 (reductio ad absurdum): (¬φ → ¬ψ) → ((¬φ → ψ) → φ).",
      "A1 and A2 remain the same as in the Łukasiewicz system. M3 and A3 are **interderivable** in the presence of A1, A2, and MP, so both systems prove exactly the same set of theorems.",
      'The Mendelson system is widely used in logic textbooks, most notably in Mendelson\'s own "Introduction to Mathematical Logic" (1964, multiple editions). The reductio formulation M3 is sometimes considered more intuitive for beginners because it directly encodes proof by contradiction.',
      "In this application, the Mendelson system is available as an alternative classical propositional base. Like the Łukasiewicz system, it can be extended with predicate logic axioms (A4, A5 + Gen), equality axioms (E1–E5), and theory-specific axioms (Peano Arithmetic, Group Theory, etc.).",
      "**Comparison with Łukasiewicz**: While the two systems are equivalent in deductive power, they differ in proof style. A3 (contraposition) is concise but requires more intermediate steps; M3 (reductio) often leads to shorter proofs when reasoning by contradiction. The choice between them is largely a matter of taste and pedagogical preference.",
      '**Standard references**: Elliott Mendelson, "Introduction to Mathematical Logic" (1964, 6th ed. 2015) is the definitive textbook for this system. Herbert Enderton\'s "A Mathematical Introduction to Logic" (2001) uses a similar axiomatization.',
    ],
    ja: [
      "**メンデルソン体系**は、アメリカの論理学者エリオット・メンデルソン (1931–2020) の名にちなむ古典命題論理のHilbert系公理体系です。ウカシェヴィチ体系の対偶公理A3をM3（背理法）(¬φ → ¬ψ) → ((¬φ → ψ) → φ) に置き換えます。",
      "A1とA2はウカシェヴィチ体系と同じです。M3とA3はA1, A2, MPの存在下で**相互導出可能**なので、両体系はまったく同じ定理集合を証明します。",
      "メンデルソン体系は論理学の教科書で広く使われています。特にMendelsonの「Introduction to Mathematical Logic」(1964年、複数版)で有名です。背理法の定式化M3は矛盾による証明を直接符号化するため、初学者にはより直観的と考えられることもあります。",
      "本アプリケーションでは、メンデルソン体系は古典命題論理の代替基盤として利用可能です。ウカシェヴィチ体系と同様に、述語論理公理(A4, A5 + Gen)、等号公理(E1–E5)、理論公理（ペアノ算術、群論など）で拡張できます。",
      "**ウカシェヴィチ体系との比較**: 2つの体系は演繹力では同等ですが、証明のスタイルが異なります。A3（対偶）は簡潔ですが中間ステップが多くなりがちで、M3（背理法）は矛盾による推論で短い証明になることが多いです。選択は主に好みと教育的配慮の問題です。",
      "**参考文献**: Elliott Mendelson『Introduction to Mathematical Logic』(1964年、第6版2015年)がこの体系の標準的教科書です。Herbert Endertonの『A Mathematical Introduction to Logic』(2001年)も同様の公理化を使用しています。",
    ],
  },
  relatedEntryIds: [
    "axiom-a1",
    "axiom-a2",
    "axiom-m3",
    "rule-mp",
    "system-lukasiewicz",
    "system-classical",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Elliott_Mendelson",
      label: {
        en: "Elliott Mendelson (Wikipedia)",
        ja: "エリオット・メンデルソン (Wikipedia)",
      },
    },
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
      url: "https://ja.wikipedia.org/wiki/%E3%83%92%E3%83%AB%E3%83%99%E3%83%AB%E3%83%88%E6%B5%81%E8%A8%BC%E6%98%8E%E8%AB%96",
      label: {
        en: "Hilbert-style deduction system (Wikipedia JA)",
        ja: "ヒルベルト流証明論 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/Hilbert+system",
      label: {
        en: "Hilbert system (nLab)",
        ja: "ヒルベルト体系 (nLab)",
      },
    },
  ],
  keywords: [
    "Mendelson",
    "classical",
    "reductio",
    "メンデルソン",
    "背理法",
    "proof by contradiction",
  ],
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
      "**Minimal logic** (also called *Johansson's minimal logic*, named after Ingebrigt Johansson, 1936) uses only the axioms A1 (K), A2 (S), and the inference rule Modus Ponens. When restricted to implication alone, it is called the *positive implicational calculus*.",
      "It has no negation axioms: neither **ex falso quodlibet** (EFQ: φ → (¬φ → ψ)) nor **double negation elimination** (DNE: ¬¬φ → φ) holds. Negation ¬φ is simply an abbreviation for φ → ⊥ (or not treated specially at all).",
      "Minimal logic is the common core of all the logic systems in this application: **Minimal ⊂ Intuitionistic ⊂ Classical**. Any theorem of minimal logic is automatically a theorem of all stronger systems.",
      "In natural deduction, minimal logic corresponds to the system **NM**: it has introduction and elimination rules for →, ∧, ∨, and weakening, but lacks EFQ and DNE. In sequent calculus, it corresponds to **LM**.",
      "Despite its weakness, minimal logic is computationally significant. Via the Curry-Howard correspondence, proofs in minimal logic correspond to simply-typed lambda calculus terms, making it the logical foundation of functional programming.",
    ],
    ja: [
      "**最小論理**（*ヨハンソンの最小論理*とも呼ばれ、Ingebrigt Johansson, 1936年に由来）は、公理A1 (K)、A2 (S)と推論規則モーダスポネンスのみを使用します。含意のみに限定した場合は*正含意計算*と呼ばれます。",
      "否定公理を持ちません: **爆発律** (EFQ: φ → (¬φ → ψ)) も**二重否定除去** (DNE: ¬¬φ → φ) も成り立ちません。否定¬φは単にφ → ⊥の省略形（あるいは特別扱いしない）です。",
      "最小論理は本アプリケーションのすべての論理体系の共通核です: **最小論理 ⊂ 直観主義 ⊂ 古典**。最小論理の定理はすべての強い体系でも自動的に定理です。",
      "自然演繹では最小論理はシステム**NM**に対応します: →, ∧, ∨の導入規則・除去規則と弱化を持ちますが、EFQとDNEを欠きます。シーケント計算では**LM**に対応します。",
      "弱い体系にもかかわらず、最小論理は計算論的に重要です。Curry-Howard対応を通じて、最小論理の証明は単純型付きラムダ計算の項に対応し、関数型プログラミングの論理的基盤となっています。",
    ],
  },
  relatedEntryIds: [
    "axiom-a1",
    "axiom-a2",
    "rule-mp",
    "system-intuitionistic",
    "system-classical",
    "rule-nd-overview",
    "rule-sc-overview",
    "concept-curry-howard",
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
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Curry%E2%80%93Howard_correspondence",
      label: {
        en: "Curry-Howard correspondence (Wikipedia)",
        ja: "Curry-Howard対応 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%AB%E3%83%AA%E3%83%BC%EF%BC%9D%E3%83%8F%E3%83%AF%E3%83%BC%E3%83%89%E5%90%8C%E5%9E%8B%E5%AF%BE%E5%BF%9C",
      label: {
        en: "Curry-Howard correspondence (Wikipedia JA)",
        ja: "カリー＝ハワード同型対応 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/minimal+logic",
      label: {
        en: "Minimal logic (nLab)",
        ja: "最小論理 (nLab)",
      },
    },
  ],
  keywords: [
    "minimal",
    "Johansson",
    "最小論理",
    "positive implicational",
    "正含意計算",
    "NM",
    "LM",
    "Curry-Howard",
  ],
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
      "**Intuitionistic logic** (also called *constructive logic*) was developed by L.E.J. Brouwer (1881–1966) and formalized by Arend Heyting (1898–1980). In the Hilbert-style formulation, it extends minimal logic with **ex falso quodlibet** (EFQ): φ → (¬φ → ψ) — from a contradiction, anything follows.",
      "It does **not** have the law of excluded middle (φ ∨ ¬φ) or double negation elimination (¬¬φ → φ). A proof of φ requires constructive evidence — you cannot simply show that ¬φ leads to a contradiction.",
      "In natural deduction, intuitionistic logic corresponds to **NJ** (NM + EFQ). In sequent calculus, it corresponds to **LJ** (right side of sequents has at most one formula). In this application, the Hilbert-style variant uses A1, A2, EFQ, and MP.",
      "Intuitionistic logic is the foundation of **constructive mathematics** and the **BHK interpretation** (Brouwer-Heyting-Kolmogorov): a proof of φ → ψ is a function transforming proofs of φ into proofs of ψ; a proof of φ ∧ ψ is a pair of proofs; a proof of φ ∨ ψ specifies which disjunct holds and provides its proof.",
      "Via the **Curry-Howard correspondence**, intuitionistic proofs correspond to programs in typed lambda calculi. This connection is the basis of proof assistants like Coq, Agda, and Lean.",
      "**Heyting Arithmetic** (HA) is the intuitionistic variant of Peano Arithmetic: it uses A1, A2, EFQ (instead of A3/M3/DNE) as the propositional base, combined with predicate logic and PA axioms. HA is available as a preset in this application.",
    ],
    ja: [
      "**直観主義論理**（*構成的論理*とも呼ばれる）は L.E.J. ブラウワー (1881–1966) によって発展され、アレンド・ヘイティング (1898–1980) によって形式化されました。Hilbert系の定式化では、最小論理に**爆発律** (EFQ): φ → (¬φ → ψ)（矛盾からは何でも導ける）を加えます。",
      "排中律（φ ∨ ¬φ）や二重否定除去（¬¬φ → φ）は成り立ち**ません**。φの証明には構成的な証拠が必要です — ¬φが矛盾を導くことを示すだけでは不十分です。",
      "自然演繹では直観主義論理はシステム**NJ** (NM + EFQ)に対応します。シーケント計算では**LJ**（シーケントの右辺が高々1つの論理式）に対応します。本アプリケーションのHilbert系では A1, A2, EFQ, MP を使用します。",
      "直観主義論理は**構成的数学**と**BHK解釈** (Brouwer-Heyting-Kolmogorov)の基礎です: φ → ψの証明はφの証明をψの証明に変換する関数; φ ∧ ψの証明は証明の対; φ ∨ ψの証明はどちらの選言肢が成り立つか指定しその証明を与えます。",
      "**Curry-Howard対応**を通じて、直観主義の証明は型付きラムダ計算のプログラムに対応します。この対応関係はCoq, Agda, Leanなどの証明支援系の基礎です。",
      "**ヘイティング算術** (HA) はペアノ算術の直観主義版です: 命題論理基盤としてA1, A2, EFQ (A3/M3/DNEではなく) を使用し、述語論理とPA公理を組み合わせます。HAは本アプリケーションでプリセットとして利用可能です。",
    ],
  },
  relatedEntryIds: [
    "axiom-a1",
    "axiom-a2",
    "axiom-efq",
    "axiom-dne",
    "system-minimal",
    "system-classical",
    "rule-nd-overview",
    "rule-sc-overview",
    "theory-peano",
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
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E7%9B%B4%E8%A6%B3%E4%B8%BB%E7%BE%A9%E8%AB%96%E7%90%86",
      label: {
        en: "Intuitionistic logic (Wikipedia JA)",
        ja: "直観主義論理 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Heyting_arithmetic",
      label: {
        en: "Heyting arithmetic (Wikipedia)",
        ja: "ヘイティング算術 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/intuitionistic+logic",
      label: {
        en: "Intuitionistic logic (nLab)",
        ja: "直観主義論理 (nLab)",
      },
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/IntuitionisticLogic.html",
      label: {
        en: "Intuitionistic Logic (MathWorld)",
        ja: "直観主義論理 (MathWorld)",
      },
    },
  ],
  keywords: [
    "intuitionistic",
    "constructive",
    "Brouwer",
    "Heyting",
    "BHK",
    "直観主義",
    "構成的",
    "Curry-Howard",
    "NJ",
    "LJ",
    "HA",
    "ブラウワー",
    "ヘイティング",
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
      "**Classical logic** is the standard logic of mathematics, extending intuitionistic logic with principles that allow non-constructive reasoning. Any of the following equivalent additions to minimal logic (A1+A2+MP) yields classical propositional logic: **A3** (contraposition), **M3** (reductio), **DNE** (double negation elimination), the **law of excluded middle** (LEM: φ ∨ ¬φ), or **Peirce's law** (((φ → ψ) → φ) → φ).",
      "The key semantic property is **bivalence**: every proposition is either true or false, with no middle ground. This enables proof techniques like proof by contradiction and case analysis on φ ∨ ¬φ, which are not available in intuitionistic logic.",
      "In this application, classical logic can be realized in multiple equivalent ways: the **Łukasiewicz system** (A1+A2+A3), the **Mendelson system** (A1+A2+M3), or the **HK system** (A1+A2+DNE). All three prove exactly the same theorems.",
      "In natural deduction, classical logic corresponds to **NK** (NM + DNE). In sequent calculus, it corresponds to **LK** (unrestricted right side of sequents). The key difference from LJ (intuitionistic) is that LK allows multiple formulas on the right side, enabling classical reasoning.",
      "**Completeness theorems**: Classical propositional logic is decidable (truth tables). Classical first-order predicate logic is complete (Gödel's completeness theorem, 1930): every valid formula is provable. However, it is undecidable (Church-Turing theorem, 1936).",
      "**Hierarchy**: Minimal Logic (A1+A2) ⊂ Intuitionistic (A1+A2+EFQ) ⊂ Classical (A1+A2+A3/M3/DNE). Classical logic proves strictly more theorems than intuitionistic logic, which in turn proves strictly more than minimal logic.",
    ],
    ja: [
      "**古典論理**は数学の標準的な論理であり、直観主義論理を非構成的推論を可能にする原理で拡張します。最小論理(A1+A2+MP)への以下の同値な追加のいずれかにより古典命題論理が得られます: **A3**（対偶）、**M3**（背理法）、**DNE**（二重否定除去）、**排中律** (LEM: φ ∨ ¬φ)、**Peirceの法則** (((φ → ψ) → φ) → φ)。",
      "重要な意味論的性質は**二値性**です: すべての命題は真か偽のいずれかであり、中間はありません。これにより背理法やφ ∨ ¬φに基づく場合分けなど、直観主義論理では使えない証明技法が可能になります。",
      "本アプリケーションでは、古典論理は複数の同値な方法で実現できます: **ウカシェヴィチ体系** (A1+A2+A3)、**メンデルソン体系** (A1+A2+M3)、**HK体系** (A1+A2+DNE)。3つとも完全に同じ定理を証明します。",
      "自然演繹では古典論理はシステム**NK** (NM + DNE)に対応します。シーケント計算では**LK**（シーケントの右辺に制約なし）に対応します。LJ（直観主義）との主要な違いは、LKが右辺に複数の論理式を許すことで、古典的推論を可能にする点です。",
      "**完全性定理**: 古典命題論理は決定可能です（真理値表）。古典一階述語論理は完全です（ゲーデルの完全性定理, 1930年）: 妥当なすべての論理式は証明可能です。ただし決定不能です（Church-Turingの定理, 1936年）。",
      "**階層**: 最小論理(A1+A2) ⊂ 直観主義(A1+A2+EFQ) ⊂ 古典(A1+A2+A3/M3/DNE)。古典論理は直観主義論理より真に多くの定理を証明し、直観主義論理は最小論理より真に多くの定理を証明します。",
    ],
  },
  relatedEntryIds: [
    "axiom-a3",
    "axiom-m3",
    "axiom-dne",
    "system-lukasiewicz",
    "system-mendelson",
    "system-intuitionistic",
    "system-minimal",
    "rule-nd-overview",
    "rule-sc-overview",
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
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E5%8F%A4%E5%85%B8%E8%AB%96%E7%90%86",
      label: {
        en: "Classical logic (Wikipedia JA)",
        ja: "古典論理 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/G%C3%B6del%27s_completeness_theorem",
      label: {
        en: "Gödel's completeness theorem (Wikipedia)",
        ja: "ゲーデルの完全性定理 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%B2%E3%83%BC%E3%83%87%E3%83%AB%E3%81%AE%E5%AE%8C%E5%85%A8%E6%80%A7%E5%AE%9A%E7%90%86",
      label: {
        en: "Gödel's completeness theorem (Wikipedia JA)",
        ja: "ゲーデルの完全性定理 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/classical+logic",
      label: {
        en: "Classical logic (nLab)",
        ja: "古典論理 (nLab)",
      },
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/PropositionalCalculus.html",
      label: {
        en: "Propositional Calculus (MathWorld)",
        ja: "命題計算 (MathWorld)",
      },
    },
  ],
  keywords: [
    "classical",
    "excluded middle",
    "bivalence",
    "古典",
    "排中律",
    "二値性",
    "LEM",
    "DNE",
    "NK",
    "LK",
    "HK",
    "Gödel",
    "completeness",
  ],
  order: 5,
};

const systemPredicateLogic: ReferenceEntry = {
  id: "system-predicate",
  category: "logic-system",
  title: { en: "Predicate Logic", ja: "述語論理" },
  summary: {
    en: "First-order predicate logic extending propositional logic with quantifiers (∀, ∃) and the Gen rule.",
    ja: "命題論理を量化子（∀, ∃）と Gen 規則で拡張した一階述語論理。",
  },
  body: {
    en: [
      '**Predicate logic** (first-order logic) extends propositional logic with **universal quantification** (∀x.φ: "for all x, φ holds") and **existential quantification** (∃x.φ: "there exists an x such that φ holds"). This allows reasoning about objects, their properties (predicates), and functions.',
      "The predicate logic system adds two axiom schemas to the propositional base (A1+A2+A3): **A4** (∀x.φ → φ[t/x], universal instantiation) allows removing ∀ by substituting a specific term, and **A5** (∀x.(φ → ψ) → (φ → ∀x.ψ), universal distribution) allows introducing ∀ when x is not free in φ.",
      "A new inference rule **Gen** (generalization) is also added: from a proved theorem φ, derive ∀x.φ. Gen can only be applied to theorems (not to assumptions in a deduction), which is a crucial restriction.",
      'The existential quantifier ∃ is defined as ¬∀¬: ∃x.φ ≡ ¬∀x.¬φ. This means "there exists an x satisfying φ" is equivalent to "it is not the case that all x fail to satisfy φ".',
      "Key properties: (1) ∀x.∀y.φ ↔ ∀y.∀x.φ (quantifier order is swappable for ∀), (2) ∃x.¬φ → ¬∀x.φ, (3) ∀x.¬φ → ¬∃x.φ. These relationships between ∀ and ∃ are fundamental in predicate logic reasoning.",
    ],
    ja: [
      "**述語論理**（一階論理）は命題論理を**全称量化**（∀x.φ: 「すべてのxについてφが成り立つ」）と**存在量化**（∃x.φ: 「φを満たすxが存在する」）で拡張します。これにより対象、その性質（述語）、関数についての推論が可能になります。",
      "述語論理体系は命題論理の基盤(A1+A2+A3)に2つの公理スキーマを追加します: **A4**（∀x.φ → φ[t/x], 全称消去）は∀を外して具体的な項を代入でき、**A5**（∀x.(φ → ψ) → (φ → ∀x.ψ), 全称分配）はxがφに自由出現しないとき∀を導入できます。",
      "新しい推論規則**Gen**（汎化）も追加されます: 証明済みの定理φから∀x.φを導出します。Genは定理にのみ適用でき（演繹中の仮定には適用不可）、この制約は極めて重要です。",
      "存在量化子∃は¬∀¬として定義されます: ∃x.φ ≡ ¬∀x.¬φ。「φを満たすxが存在する」は「すべてのxがφを満たさないわけではない」と同値です。",
      "重要な性質: (1) ∀x.∀y.φ ↔ ∀y.∀x.φ（∀の順序は交換可能）、(2) ∃x.¬φ → ¬∀x.φ、(3) ∀x.¬φ → ¬∃x.φ。これらの∀と∃の関係は述語論理の推論の基本です。",
    ],
  },
  relatedEntryIds: [
    "axiom-a4",
    "axiom-a5",
    "rule-gen",
    "system-classical",
    "concept-free-variable",
    "concept-substitution",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/First-order_logic",
      label: {
        en: "First-order logic (Wikipedia)",
        ja: "一階論理 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E4%B8%80%E9%9A%8E%E8%BF%B0%E8%AA%9E%E8%AB%96%E7%90%86",
      label: {
        en: "First-order logic (Wikipedia JA)",
        ja: "一階述語論理 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/first-order+logic",
      label: {
        en: "First-order logic (nLab)",
        ja: "一階論理 (nLab)",
      },
    },
  ],
  keywords: [
    "predicate",
    "first-order",
    "quantifier",
    "forall",
    "exists",
    "述語",
    "一階",
    "量化",
    "全称",
    "存在",
  ],
  order: 6,
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
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/substitution",
      label: {
        en: "Substitution (nLab)",
        ja: "代入 (nLab)",
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
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E8%87%AA%E7%94%B1%E5%A4%89%E6%95%B0%E3%81%A8%E6%9D%9F%E7%B8%9B%E5%A4%89%E6%95%B0",
      label: {
        en: "Free and bound variables (Wikipedia JA)",
        ja: "自由変数と束縛変数 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/free+variable",
      label: {
        en: "Free variable (nLab)",
        ja: "自由変数 (nLab)",
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
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/unification",
      label: {
        en: "Unification (nLab)",
        ja: "ユニフィケーション (nLab)",
      },
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/Unification.html",
      label: {
        en: "Unification (MathWorld)",
        ja: "ユニフィケーション (MathWorld)",
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

const conceptDeductionTheorem: ReferenceEntry = {
  id: "concept-deduction-theorem",
  category: "concept",
  title: { en: "Deduction Theorem", ja: "演繹定理" },
  summary: {
    en: "Γ, φ ⊢ ψ if and only if Γ ⊢ φ → ψ — derivation from a hypothesis is equivalent to proving an implication.",
    ja: "Γ, φ ⊢ ψ ⟺ Γ ⊢ φ → ψ — 仮説からの導出は含意の証明と同値である。",
  },
  body: {
    en: [
      "The **Deduction Theorem** is a fundamental meta-theorem in Hilbert-style proof systems. It states that if ψ can be derived from a set of hypotheses Γ together with an additional hypothesis φ, then the implication φ → ψ can be derived from Γ alone. Conversely, if Γ ⊢ φ → ψ, then Γ, φ ⊢ ψ follows immediately by Modus Ponens.",
      "**Formal statement:** Γ, φ ⊢ ψ if and only if Γ ⊢ φ → ψ. The left-to-right direction (⇒) is the non-trivial part. It is proved by induction on the length of the derivation of ψ from Γ ∪ {φ}. The proof critically uses axioms A1 (K: φ → (ψ → φ)) and A2 (S: (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))).",
      "**Significance:** In Hilbert-style systems, proofs are notoriously difficult to construct because the only inference rule is Modus Ponens. The Deduction Theorem provides a powerful proof strategy: to prove φ → ψ, one can instead assume φ and derive ψ, which is often much easier. This bridges the gap between Hilbert systems and the more intuitive natural deduction style.",
      "**Example:** To prove φ → φ (identity) in a Hilbert system, one can use the Deduction Theorem: assume φ, then φ is immediately derivable, so by the theorem, ⊢ φ → φ. The actual Hilbert-style proof (using S, K, and MP) is considerably longer and less intuitive.",
      "**Limitations:** The Deduction Theorem does not hold in all logical systems. In particular, for predicate logic, the generalization rule (Gen) requires a side condition: the Deduction Theorem holds only when the hypothesis φ does not contain free occurrences of the variable being generalized.",
    ],
    ja: [
      "**演繹定理**はヒルベルト流証明体系における基本的なメタ定理です。仮説の集合Γに追加の仮説φを合わせたものからψが導出できるならば、Γだけから含意φ → ψが導出できることを述べます。逆に、Γ ⊢ φ → ψ であれば、モーダスポネンスにより直ちに Γ, φ ⊢ ψ が従います。",
      "**形式的記述:** Γ, φ ⊢ ψ ⟺ Γ ⊢ φ → ψ。左から右の方向（⇒）が非自明な部分です。Γ ∪ {φ} からのψの導出の長さに関する帰納法で証明されます。証明では公理A1（K: φ → (ψ → φ)）と公理A2（S: (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))）が本質的に使われます。",
      "**意義:** ヒルベルト流体系では、唯一の推論規則がモーダスポネンスであるため、証明の構成は非常に困難です。演繹定理は強力な証明戦略を提供します: φ → ψ を証明するには、φを仮定してψを導出すればよく、これは多くの場合はるかに容易です。これにより、ヒルベルト体系とより直観的な自然演繹スタイルの間の橋渡しが実現されます。",
      "**例:** ヒルベルト体系でφ → φ（恒等式）を証明するには、演繹定理を使えます: φを仮定すると、φは直ちに導出可能なので、定理により ⊢ φ → φ が得られます。実際のヒルベルト流の証明（S, K, MPを使用）はかなり長く、直観的ではありません。",
      "**制限:** 演繹定理はすべての論理体系で成り立つわけではありません。特に述語論理では、汎化規則（Gen）に条件が必要です: 演繹定理は、仮説φが汎化される変数の自由出現を含まない場合にのみ成り立ちます。",
    ],
  },
  formalNotation:
    "\\Gamma, \\varphi \\vdash \\psi \\iff \\Gamma \\vdash \\varphi \\to \\psi",
  relatedEntryIds: [
    "axiom-a1",
    "axiom-a2",
    "rule-mp",
    "system-lukasiewicz",
    "system-mendelson",
    "rule-gen",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Deduction_theorem",
      label: {
        en: "Deduction theorem (Wikipedia)",
        ja: "演繹定理 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E6%BC%94%E7%B9%B9%E5%AE%9A%E7%90%86",
      label: {
        en: "Deduction theorem (Wikipedia JA)",
        ja: "演繹定理 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/deduction+theorem",
      label: {
        en: "Deduction theorem (nLab)",
        ja: "演繹定理 (nLab)",
      },
    },
  ],
  keywords: [
    "deduction theorem",
    "演繹定理",
    "hypothesis",
    "仮説",
    "meta-theorem",
    "メタ定理",
    "Herbrand",
  ],
  order: 4,
};

const conceptGlivenko: ReferenceEntry = {
  id: "concept-glivenko",
  category: "concept",
  title: { en: "Glivenko's Theorem", ja: "グリヴェンコの定理" },
  summary: {
    en: "Γ ⊢_LK φ if and only if Γ ⊢_LJ ¬¬φ — a formula provable in classical logic is provable under double negation in intuitionistic logic.",
    ja: "Γ ⊢_LK φ ⟺ Γ ⊢_LJ ¬¬φ — 古典論理で証明可能な命題は、直観主義論理で二重否定を付ければ証明可能。",
  },
  body: {
    en: [
      "**Glivenko's Theorem** (1929) establishes a precise relationship between classical and intuitionistic propositional logic. It states that a propositional formula φ is provable in classical logic (LK) if and only if its double negation ¬¬φ is provable in intuitionistic logic (LJ). This holds even when hypotheses Γ are present: Γ ⊢_LK φ ⟺ Γ ⊢_LJ ¬¬φ.",
      '**Proof outline:** The right-to-left direction (⟸) follows from the fact that intuitionistic logic is a subsystem of classical logic, and DNE (¬¬φ → φ) holds classically. For the left-to-right direction (⟹), one shows that for every classical axiom and inference rule, the double-negation translation preserves derivability in intuitionistic logic. The key insight is that ¬¬ acts as a "modality" that absorbs classical reasoning.',
      '**Significance:** Glivenko\'s theorem shows that classical and intuitionistic logic are "not so far apart" for propositional logic — every classical theorem has an intuitionistic counterpart under double negation. This is a foundational result in the study of the relationship between constructive and classical mathematics.',
      "**Limitation to propositional logic:** Glivenko's theorem in its original form applies only to propositional logic. For predicate logic, a more refined translation is needed. Kuroda's negative translation (inserting ¬¬ after each ∀) provides the predicate-logic generalization.",
      '**Connection to other results:** Glivenko\'s theorem is closely related to the Kuroda translation and the Gödel-Gentzen negative translation. These translations systematically embed classical logic into intuitionistic logic, demonstrating that classical reasoning can always be "interpreted" constructively via double negation.',
    ],
    ja: [
      "**グリヴェンコの定理** (1929) は、古典命題論理と直観主義命題論理の間の正確な関係を確立するものです。命題論理式 φ が古典論理 (LK) で証明可能であることと、その二重否定 ¬¬φ が直観主義論理 (LJ) で証明可能であることは同値です。仮説 Γ がある場合にも成立します: Γ ⊢_LK φ ⟺ Γ ⊢_LJ ¬¬φ。",
      "**証明の概略:** 右から左の方向 (⟸) は、直観主義論理が古典論理の部分体系であり、古典論理では DNE (¬¬φ → φ) が成り立つことから従います。左から右の方向 (⟹) では、古典論理の各公理と推論規則について、二重否定翻訳が直観主義論理での導出可能性を保存することを示します。鍵となる洞察は、¬¬ が古典的推論を吸収する「モダリティ」として機能することです。",
      "**意義:** グリヴェンコの定理は、命題論理に関しては古典論理と直観主義論理が「それほど離れていない」ことを示します — すべての古典的定理は、二重否定の下で直観主義的な対応物を持ちます。これは、構成的数学と古典的数学の関係の研究における基礎的な結果です。",
      "**命題論理への限定:** グリヴェンコの定理は、元の形では命題論理にのみ適用されます。述語論理に対しては、より精緻な翻訳が必要です。黒田の否定翻訳（各 ∀ の直後に ¬¬ を挿入する）が、述語論理への一般化を提供します。",
      "**他の結果との関連:** グリヴェンコの定理は、黒田翻訳やゲーデル・ゲンツェンの否定翻訳と密接に関連しています。これらの翻訳は、古典論理を直観主義論理に体系的に埋め込むものであり、古典的推論が二重否定を通じて常に構成的に「解釈」できることを示しています。",
    ],
  },
  formalNotation:
    "\\Gamma \\vdash_{\\mathbf{LK}} \\varphi \\iff \\Gamma \\vdash_{\\mathbf{LJ}} \\lnot\\lnot\\varphi",
  relatedEntryIds: [
    "axiom-dne",
    "system-classical",
    "system-intuitionistic",
    "concept-deduction-theorem",
    "concept-kuroda-translation",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Glivenko%27s_theorem",
      label: {
        en: "Glivenko's theorem (Wikipedia)",
        ja: "グリヴェンコの定理 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%B0%E3%83%AA%E3%83%B4%E3%82%A7%E3%83%B3%E3%82%B3%E3%81%AE%E5%AE%9A%E7%90%86",
      label: {
        en: "Glivenko's theorem (Wikipedia JA)",
        ja: "グリヴェンコの定理 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/Glivenko%27s+theorem",
      label: {
        en: "Glivenko's theorem (nLab)",
        ja: "グリヴェンコの定理 (nLab)",
      },
    },
  ],
  keywords: [
    "Glivenko",
    "グリヴェンコ",
    "double negation",
    "二重否定",
    "classical",
    "古典論理",
    "intuitionistic",
    "直観主義論理",
    "negative translation",
    "否定翻訳",
  ],
  order: 5,
};

const conceptKurodaTranslation: ReferenceEntry = {
  id: "concept-kuroda-translation",
  category: "concept",
  title: {
    en: "Kuroda's Negative Translation",
    ja: "黒田の否定翻訳",
  },
  summary: {
    en: "A translation inserting ¬¬ after each ∀ to embed classical predicate logic into intuitionistic logic: ⊢_LK φ ⟺ ⊢_LJ ¬¬φ*.",
    ja: "各 ∀ の直後に ¬¬ を挿入し、古典述語論理を直観主義論理に埋め込む翻訳: ⊢_LK φ ⟺ ⊢_LJ ¬¬φ*。",
  },
  body: {
    en: [
      "**Kuroda's negative translation** (1951) extends Glivenko's theorem from propositional logic to first-order predicate logic. While Glivenko showed that ⊢_LK φ ⟺ ⊢_LJ ¬¬φ for propositional formulas, simply prefixing ¬¬ does not work for predicate logic. Kuroda's key insight is that inserting ¬¬ immediately after each universal quantifier (∀) is sufficient to bridge the gap.",
      "**Definition:** The Kuroda transform φ* of a formula φ is defined recursively: (1) Atomic formulas are unchanged: P(t₁,...,tₙ)* = P(t₁,...,tₙ). (2) Propositional connectives distribute to subformulas: (¬φ)* = ¬(φ*), (φ → ψ)* = φ* → ψ*, (φ ∧ ψ)* = φ* ∧ ψ*, (φ ∨ ψ)* = φ* ∨ ψ*. (3) The universal quantifier gets a ¬¬ insertion: (∀x.φ)* = ∀x.¬¬(φ*). (4) The existential quantifier just recurses: (∃x.φ)* = ∃x.(φ*).",
      "**Main theorem:** For any first-order formula φ, ⊢_LK φ if and only if ⊢_LJ ¬¬φ*. This extends Glivenko's result to the full first-order predicate logic, using the Kuroda transform to handle the universal quantifier.",
      "**Why simple ¬¬ prefix fails for predicate logic:** The formula ∀x(F(x) ∨ ¬F(x)) is provable in classical logic (LK), but ¬¬∀x(F(x) ∨ ¬F(x)) is not provable in intuitionistic logic (LJ). The universal quantifier interacts non-trivially with excluded middle, and Kuroda's insertion of ¬¬ after each ∀ precisely neutralizes this interaction.",
      "**Comparison with other negative translations:** Kolmogorov's translation (1925) prefixes every subformula with ¬¬. The Gödel-Gentzen translation (1933) places ¬¬ before atomic formulas, disjunctions, and existential quantifiers. Kuroda's translation is the simplest — it only modifies universal quantifiers. All three translations produce intuitionistically equivalent results.",
      "**Significance:** Kuroda's translation reveals that the gap between classical and intuitionistic predicate logic resides specifically in the universal quantifier. Classical reasoning about \"for all x\" implicitly uses excluded middle at each instance, and Kuroda's ¬¬ after ∀ neutralizes precisely this. The result is foundational for proof theory, establishing that classical systems (LK, NK, HK) are equivalent to their minimal logic counterparts plus the DNE rule.",
    ],
    ja: [
      "**黒田の否定翻訳** (1951) は、グリヴェンコの定理を命題論理から一階述語論理に拡張するものです。グリヴェンコは命題論理式について ⊢_LK φ ⟺ ⊢_LJ ¬¬φ を示しましたが、述語論理では単に ¬¬ を前置するだけでは不十分です。黒田の鍵となる洞察は、各全称量化子 (∀) の直後に ¬¬ を挿入するだけで十分であるということです。",
      "**定義:** 論理式 φ の黒田変換 φ* は再帰的に定義されます: (1) 原子論理式は変更なし: P(t₁,...,tₙ)* = P(t₁,...,tₙ)。(2) 命題結合子は部分論理式に分配: (¬φ)* = ¬(φ*)、(φ → ψ)* = φ* → ψ*、(φ ∧ ψ)* = φ* ∧ ψ*、(φ ∨ ψ)* = φ* ∨ ψ*。(3) 全称量化子に ¬¬ を挿入: (∀x.φ)* = ∀x.¬¬(φ*)。(4) 存在量化子は再帰のみ: (∃x.φ)* = ∃x.(φ*)。",
      "**主定理:** 任意の一階論理式 φ について、⊢_LK φ であることと ⊢_LJ ¬¬φ* であることは同値です。これは黒田変換を用いて全称量化子を処理することで、グリヴェンコの結果を一階述語論理全体に拡張するものです。",
      "**述語論理で単純な ¬¬ 前置が失敗する理由:** 論理式 ∀x(F(x) ∨ ¬F(x)) は古典論理 (LK) で証明可能ですが、¬¬∀x(F(x) ∨ ¬F(x)) は直観主義論理 (LJ) では証明できません。全称量化子は排中律と非自明に相互作用し、黒田の各 ∀ の直後への ¬¬ 挿入がまさにこの相互作用を中和します。",
      "**他の否定翻訳との比較:** コルモゴロフの翻訳 (1925) はすべての部分論理式に ¬¬ を前置します。ゲーデル・ゲンツェンの翻訳 (1933) は原子論理式、選言、存在量化子の前に ¬¬ を配置します。黒田の翻訳は最も単純で、全称量化子のみを修正します。3つの翻訳はすべて直観主義的に同値な結果を生成します。",
      "**意義:** 黒田の翻訳は、古典述語論理と直観主義述語論理の間の差異が特に全称量化子に存在することを明らかにします。「すべての x について」という古典的推論は各インスタンスで暗黙に排中律を使用しており、黒田の ∀ の直後の ¬¬ がまさにこれを中和します。この結果は証明論の基礎であり、古典的体系 (LK, NK, HK) がそれぞれの最小論理の対応物に DNE 規則を加えたものと等価であることを確立します。",
    ],
  },
  formalNotation:
    "(\\forall x.\\varphi)^* = \\forall x.\\lnot\\lnot(\\varphi^*)",
  relatedEntryIds: [
    "concept-glivenko",
    "axiom-dne",
    "system-classical",
    "system-intuitionistic",
    "axiom-a4",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Double-negation_translation",
      label: {
        en: "Double-negation translation (Wikipedia)",
        ja: "二重否定翻訳 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E4%BA%8C%E9%87%8D%E5%90%A6%E5%AE%9A%E7%BF%BB%E8%A8%B3",
      label: {
        en: "Double-negation translation (Wikipedia JA)",
        ja: "二重否定翻訳 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/double+negation+translation",
      label: {
        en: "Double negation translation (nLab)",
        ja: "二重否定翻訳 (nLab)",
      },
    },
  ],
  keywords: [
    "Kuroda",
    "黒田",
    "negative translation",
    "否定翻訳",
    "double negation",
    "二重否定",
    "classical",
    "古典論理",
    "intuitionistic",
    "直観主義論理",
    "universal quantifier",
    "全称量化子",
    "Glivenko",
    "グリヴェンコ",
    "predicate logic",
    "述語論理",
  ],
  order: 6,
};

const conceptSystemEquivalence: ReferenceEntry = {
  id: "concept-system-equivalence",
  category: "concept",
  title: {
    en: "Equivalence of Proof Systems (H = N = L)",
    ja: "証明体系の等価性 (H = N = L)",
  },
  summary: {
    en: "Hilbert systems, natural deduction, and sequent calculus prove the same formulas: HM=NM=LM, HJ=NJ=LJ, HK=NK=LK.",
    ja: "ヒルベルト系、自然演繹、シーケント計算は同じ論理式を証明する: HM=NM=LM, HJ=NJ=LJ, HK=NK=LK。",
  },
  body: {
    en: [
      "**Three styles, one logic.** For each level of logical strength — minimal (M), intuitionistic (J), and classical (K) — there exist three distinct proof systems: the Hilbert-style system (H), natural deduction (N), and sequent calculus (L). Despite their vastly different structure, each triple proves exactly the same set of formulas. Formally, for any formula φ: ⊢_HX φ ⟺ ⊢_NX φ ⟺ ⊢_LX φ, where X ∈ {M, J, K}.",
      '**What "equivalence" means precisely.** Two proof systems are equivalent if they have the same set of theorems — that is, a formula φ is provable in one system if and only if it is provable in the other. This does not mean the proofs look the same: a Hilbert-style proof is a linear sequence of formulas, a natural deduction proof is a tree of hypothetical derivations with discharge, and a sequent calculus proof operates on sequents Γ ⇒ Δ. The equivalence is purely about provability, not about proof structure.',
      "**H ⊆ N (Hilbert to Natural Deduction).** Every Hilbert-style axiom can be derived in natural deduction without hypotheses. For instance, A1 (φ → (ψ → φ)) is derivable by: assume φ, then assume ψ, weaken to get φ, apply →I twice. Similarly, A2 is derivable using →I and →E. Modus Ponens corresponds directly to →E. Thus every Hilbert proof can be simulated step-by-step in natural deduction.",
      "**N ⊆ L (Natural Deduction to Sequent Calculus).** The key insight is that each natural deduction rule has a sequent calculus counterpart. The discharge mechanism of natural deduction corresponds to having formulas on the left side of the sequent (antecedent). The →I rule corresponds to (→⇒), and →E corresponds to combining (⇒→) with Cut. The translation preserves provability (bekki Ch.10, Theorem 10.41).",
      "**L ⊆ H (Sequent Calculus to Hilbert).** Each sequent rule can be simulated using Hilbert axioms and MP. The structural rules (exchange, contraction, weakening) correspond to propositional tautologies derivable in the Hilbert system. Logical rules translate to combinations of axiom instances and MP applications. The translation is typically by induction on the derivation height (bekki Ch.9, Theorem 9.24).",
      "**The three levels.** (1) **Minimal logic (M):** HM uses axioms A1, A2, A3 + MP. NM has →I/E, ∧I/E, ∨I/E, and weakening. LM is LJ without (⊥⇒). All three prove exactly the same formulas. (2) **Intuitionistic logic (J):** HJ adds the absurdity axiom (⊥ → φ). NJ adds EFQ (ex falso quodlibet). LJ adds (⊥⇒). (3) **Classical logic (K):** HK adds DNE (¬¬φ → φ) or Peirce's law. NK adds the DNE rule. LK allows multiple formulas on the right side of sequents.",
      '**Significance.** The equivalence theorems have deep consequences: (1) Any metatheorem proved about one system immediately transfers to the others. For example, cut elimination in LK implies the subformula property for HK and NK proofs. (2) Each system has distinct practical advantages — Hilbert systems are minimal and elegant, natural deduction mirrors informal mathematical reasoning, and sequent calculus is ideal for proof search and metatheory. (3) The equivalence shows that the notion of "provability" is robust and independent of the particular formalization chosen.',
    ],
    ja: [
      "**3つの流儀、1つの論理。** 論理的強さの各レベル — 最小論理 (M)、直観主義論理 (J)、古典論理 (K) — に対して、3つの異なる証明体系が存在します: ヒルベルト系 (H)、自然演繹 (N)、シーケント計算 (L)。その構造は大きく異なりますが、各三つ組はまったく同じ論理式の集合を証明します。形式的に、任意の論理式 φ について: ⊢_HX φ ⟺ ⊢_NX φ ⟺ ⊢_LX φ、ただし X ∈ {M, J, K}。",
      "**「等価性」の正確な意味。** 2つの証明体系が等価であるとは、同じ定理の集合を持つことです — すなわち、論理式 φ が一方の体系で証明可能であることと他方の体系で証明可能であることが同値です。これは証明が同じ見た目であることを意味しません: ヒルベルト系の証明は論理式の線形列、自然演繹の証明は仮定の打ち消しを伴う仮説的導出の木、シーケント計算の証明はシーケント Γ ⇒ Δ 上で操作します。等価性は純粋に証明可能性に関するものであり、証明の構造に関するものではありません。",
      "**H ⊆ N（ヒルベルト系から自然演繹へ）。** ヒルベルト系のすべての公理は、自然演繹で仮定なしに導出できます。例えば A1 (φ → (ψ → φ)) は: φ を仮定し、ψ を仮定し、弱化で φ を得て、→I を2回適用することで導出できます。同様に A2 も →I と →E で導出可能です。モーダスポネンスは直接 →E に対応します。したがって、すべてのヒルベルト証明は自然演繹でステップごとにシミュレートできます。",
      "**N ⊆ L（自然演繹からシーケント計算へ）。** 鍵となる洞察は、各自然演繹規則にシーケント計算の対応物があることです。自然演繹の打ち消し機構は、シーケントの左辺（前件）に論理式を持つことに対応します。→I 規則は (→⇒) に対応し、→E は (⇒→) とカットの組み合わせに対応します。この翻訳は証明可能性を保存します（戸次 Ch.10, 定理10.41）。",
      "**L ⊆ H（シーケント計算からヒルベルト系へ）。** 各シーケント規則はヒルベルト公理と MP を用いてシミュレートできます。構造規則（交換、縮約、弱化）はヒルベルト系で導出可能な命題論理のトートロジーに対応します。論理規則は公理インスタンスと MP 適用の組み合わせに翻訳されます。翻訳は通常、導出の高さに関する帰納法で行います（戸次 Ch.9, 定理9.24）。",
      "**3つのレベル。** (1) **最小論理 (M):** HM は公理 A1, A2, A3 + MP を使用。NM は →I/E, ∧I/E, ∨I/E と弱化を持ちます。LM は LJ から (⊥⇒) を除いた体系です。3つすべてがまったく同じ論理式を証明します。(2) **直観主義論理 (J):** HJ は矛盾公理 (⊥ → φ) を追加。NJ は EFQ（矛盾からの爆発）を追加。LJ は (⊥⇒) を追加。(3) **古典論理 (K):** HK は DNE (¬¬φ → φ) またはパースの法則を追加。NK は DNE 規則を追加。LK はシーケント右辺に複数の論理式を許可します。",
      "**意義。** 等価性定理は深い帰結を持ちます: (1) 1つの体系について証明されたメタ定理は直ちに他の体系に転用できます。例えば、LK のカット除去は HK と NK の証明に対する部分論理式性を含意します。(2) 各体系には異なる実用上の利点があります — ヒルベルト系は最小限でエレガント、自然演繹は非形式的な数学的推論を反映、シーケント計算は証明探索とメタ理論に最適です。(3) 等価性は「証明可能性」の概念が頑健であり、選択した特定の形式化に依存しないことを示しています。",
    ],
  },
  formalNotation:
    "\\vdash_{HX} \\varphi \\;\\Longleftrightarrow\\; \\vdash_{NX} \\varphi \\;\\Longleftrightarrow\\; \\vdash_{LX} \\varphi \\quad (X \\in \\{M, J, K\\})",
  relatedEntryIds: [
    "system-minimal",
    "system-intuitionistic",
    "system-classical",
    "concept-glivenko",
    "concept-kuroda-translation",
    "rule-nd-overview",
    "rule-sc-overview",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Curry%E2%80%93Howard_correspondence",
      label: {
        en: "Curry–Howard correspondence (Wikipedia)",
        ja: "カリー＝ハワード対応 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%AB%E3%83%AA%E3%83%BC%EF%BC%9D%E3%83%8F%E3%83%AF%E3%83%BC%E3%83%89%E5%90%8C%E5%9E%8B",
      label: {
        en: "Curry–Howard isomorphism (Wikipedia JA)",
        ja: "カリー＝ハワード同型 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/natural+deduction",
      label: {
        en: "Natural deduction (nLab)",
        ja: "自然演繹 (nLab)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/sequent+calculus",
      label: {
        en: "Sequent calculus (nLab)",
        ja: "シーケント計算 (nLab)",
      },
    },
  ],
  keywords: [
    "equivalence",
    "等価性",
    "Hilbert",
    "ヒルベルト",
    "natural deduction",
    "自然演繹",
    "sequent calculus",
    "シーケント計算",
    "HM",
    "NM",
    "LM",
    "HJ",
    "NJ",
    "LJ",
    "HK",
    "NK",
    "LK",
    "minimal",
    "最小論理",
    "intuitionistic",
    "直観主義論理",
    "classical",
    "古典論理",
    "proof system",
    "証明体系",
  ],
  order: 7,
};

const conceptSoundness: ReferenceEntry = {
  id: "concept-soundness",
  category: "concept",
  title: {
    en: "Soundness Theorem",
    ja: "健全性定理",
  },
  summary: {
    en: "If a formula is provable in a proof system, then it is semantically valid: ⊢_K Δ implies ⊨ Δ.",
    ja: "証明体系で証明可能な論理式は意味論的に妥当である: ⊢_K Δ ならば ⊨ Δ。",
  },
  body: {
    en: [
      `**What soundness means.** The soundness theorem states that if a formula (or sequent) is provable in a proof system K, then it is semantically valid — that is, true under every interpretation. Formally: if Γ ⊢_K Δ, then Γ ⊨ Δ. In other words, the proof system never "lies": it cannot prove something that is false. This is a fundamental requirement for any proof system to be trustworthy.`,
      `**Semantic validity (⊨).** To say Γ ⊨ Δ means that for every interpretation (M, g), if (M, g) satisfies all formulas in Γ, then (M, g) satisfies at least one formula in Δ. Equivalently, the set ¬Δ, Γ is unsatisfiable — there is no interpretation making all of Γ true while making all of Δ false. For propositional logic, an interpretation is a truth-value assignment; for predicate logic, it is a structure with a domain and interpretation function (bekki Ch.5, Definition 5.66).`,
      `**Proof strategy: preserving satisfiability.** The standard proof of soundness proceeds by induction on the derivation. For tableau-style sequent calculus (TAB), the key lemma (bekki Lemma 13.7) shows that each inference rule preserves satisfiability upward: if the conclusion sequent Γ ⇒ has a satisfying interpretation, then at least one premise also has a satisfying interpretation. Since axioms (basic sequents) ¬φ, φ, Γ ⇒ are clearly unsatisfiable, any completed derivation starting from provable sequents reaches only unsatisfiable leaves, guaranteeing the root is valid.`,
      `**Soundness for specific systems.** (1) **TAB** (Theorem 13.10): Γ ⊢_TAB Δ ⟹ Γ ⊨ Δ. Proved by contraposition — if Γ ⊭ Δ, then ¬Δ, Γ is satisfiable, and the satisfiability lemma shows Γ ⊬_TAB Δ. (2) **LK** (Theorem 13.24): Γ ⊢_LK Δ ⟹ Γ ⊨ Δ. Proved similarly via a soundness lemma for LK rules (Lemma 13.25). By the equivalence of proof systems (HK = NK = LK = TAB), soundness extends to all classical proof systems.`,
      `**Consequences of soundness.** Soundness has important corollaries: (1) **Consistency:** If a system is sound, it cannot prove a contradiction (⊥), since ⊥ has no satisfying interpretation. (2) **Semantic cut elimination:** From LK soundness, for any LK derivation of S, there exists an LK-CUT derivation of S. This gives a completely different proof of cut elimination via semantics rather than syntactic transformation (bekki Section 13.6). (3) **Trustworthiness:** Soundness justifies using the proof system as a reliable tool for establishing truths about mathematical structures.`,
      `**Soundness vs. completeness.** Soundness (⊢ ⟹ ⊨) and completeness (⊨ ⟹ ⊢) are dual properties. Together they establish that provability and semantic validity coincide: ⊢ ⟺ ⊨. While soundness is generally straightforward to prove (induction on derivations), completeness is significantly harder and historically deeper — Gödel's completeness theorem (1930) established it for first-order logic. Soundness says the system is safe; completeness says the system is sufficient.`,
    ],
    ja: [
      `**健全性の意味。** 健全性定理は、証明体系 K で証明可能な論理式（またはシーケント）が意味論的に妥当であること — すなわち、すべての解釈のもとで真であること — を述べます。形式的に: Γ ⊢_K Δ ならば Γ ⊨ Δ。言い換えれば、証明体系は決して「嘘をつかない」: 偽であるものを証明することはできません。これは、証明体系が信頼できるための基本的な要件です。`,
      `**意味論的妥当性（⊨）。** Γ ⊨ Δ とは、任意の解釈 (M, g) について、(M, g) が Γ のすべての論理式を充足するならば、(M, g) が Δ の少なくとも1つの論理式を充足することを意味します。同値的に、集合 ¬Δ, Γ が充足不能 — Γ のすべてを真にしつつ Δ のすべてを偽にする解釈が存在しない — ということです。命題論理では解釈は真理値割当であり、述語論理では解釈は領域と解釈関数を持つ構造です（戸次 Ch.5, 定義5.66）。`,
      `**証明戦略: 充足可能性の保存。** 健全性の標準的な証明は、導出に関する帰納法で進みます。タブロー式シーケント計算 (TAB) では、鍵となる補題（戸次 補題13.7）が、各推論規則が充足可能性を上方に保存することを示します: 結論のシーケント Γ ⇒ に充足する解釈があるならば、少なくとも1つの前提にも充足する解釈があります。公理（基本式）¬φ, φ, Γ ⇒ は明らかに充足不能なので、証明可能なシーケントから始まる完成した導出は充足不能な葉のみに到達し、根が妥当であることが保証されます。`,
      `**各体系の健全性。** (1) **TAB**（定理13.10）: Γ ⊢_TAB Δ ⟹ Γ ⊨ Δ。対偶による証明 — Γ ⊭ Δ ならば ¬Δ, Γ は充足可能であり、充足可能性補題により Γ ⊬_TAB Δ。(2) **LK**（定理13.24）: Γ ⊢_LK Δ ⟹ Γ ⊨ Δ。LK 規則に対する健全性補題（補題13.25）を用いて同様に証明されます。証明体系の等価性（HK = NK = LK = TAB）により、健全性はすべての古典論理の証明体系に拡張されます。`,
      `**健全性の帰結。** 健全性には重要な系があります: (1) **無矛盾性:** 体系が健全であれば、矛盾（⊥）を証明できません。⊥ には充足する解釈が存在しないからです。(2) **意味論的カット除去:** LK の健全性から、任意の LK 導出のシーケント S に対して LK-CUT の導出が存在します。これは構文的変換ではなく意味論を介したカット除去の全く異なる証明を与えます（戸次 13.6節）。(3) **信頼性:** 健全性は、証明体系を数学的構造に関する真理を確立するための信頼できるツールとして使うことを正当化します。`,
      `**健全性と完全性。** 健全性（⊢ ⟹ ⊨）と完全性（⊨ ⟹ ⊢）は双対的な性質です。これらを合わせると、証明可能性と意味論的妥当性が一致することが確立されます: ⊢ ⟺ ⊨。健全性の証明は一般に比較的容易（導出に関する帰納法）ですが、完全性の証明はかなり困難で歴史的にも深い結果です — ゲーデルの完全性定理（1930年）が一階論理に対してこれを確立しました。健全性は体系が安全であることを、完全性は体系が十分であることを述べます。`,
    ],
  },
  formalNotation:
    "\\Gamma \\vdash_K \\Delta \\;\\Longrightarrow\\; \\Gamma \\vDash \\Delta",
  relatedEntryIds: [
    "concept-semantic-validity",
    "concept-system-equivalence",
    "system-classical",
    "rule-sc-overview",
    "rule-sc-logical",
    "rule-sc-structural",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Soundness",
      label: {
        en: "Soundness (Wikipedia)",
        ja: "健全性 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E5%81%A5%E5%85%A8%E6%80%A7",
      label: {
        en: "Soundness (Wikipedia JA)",
        ja: "健全性 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/soundness+theorem",
      label: {
        en: "Soundness theorem (nLab)",
        ja: "健全性定理 (nLab)",
      },
    },
  ],
  keywords: [
    "soundness",
    "健全性",
    "sound",
    "semantic validity",
    "意味論的妥当性",
    "satisfiability",
    "充足可能性",
    "interpretation",
    "解釈",
    "consistency",
    "無矛盾性",
    "trustworthy",
    "信頼性",
  ],
  order: 8,
};

const conceptCompleteness: ReferenceEntry = {
  id: "concept-completeness",
  category: "concept",
  title: {
    en: "Completeness Theorem",
    ja: "完全性定理",
  },
  summary: {
    en: "If a formula is semantically valid, then it is provable in the proof system: ⊨ Δ implies ⊢_K Δ. Gödel's completeness theorem.",
    ja: "意味論的に妥当な論理式は証明体系で証明可能である: ⊨ Δ ならば ⊢_K Δ。ゲーデルの完全性定理。",
  },
  body: {
    en: [
      `**What completeness means.** The completeness theorem states that if a formula (or sequent) is semantically valid, then it is provable in the proof system K. Formally: if Γ ⊨ Δ, then Γ ⊢_K Δ (bekki Definition 13.2). In other words, the proof system has no "gaps": every semantic truth can be captured by a formal derivation. Together with soundness (⊢ ⟹ ⊨), completeness establishes the equivalence ⊢ ⟺ ⊨, meaning the syntactic notion of provability perfectly matches the semantic notion of validity.`,
      `**Two forms of completeness.** Completeness comes in two variants: (1) **(Weak) completeness** (Theorem 13.13): ⊨ φ ⟹ ⊢_TAB φ — if a sentence is valid (true in all interpretations), it is provable. (2) **Strong completeness** (Theorem 13.14): Γ ⊨ Δ ⟹ Γ ⊢_TAB Δ — if Δ is a semantic consequence of Γ, then Δ is derivable from Γ. Strong completeness subsumes weak completeness (take Γ = ∅). Both forms hold for classical first-order logic.`,
      `**Henkin's theorem: the key ingredient.** The proof of completeness relies on Henkin's theorem (Theorem 13.12): if Γ ⊬_TAB, then Γ is satisfiable in a countable domain. The contrapositive gives completeness. The proof constructs a *full* (充満) sequence (Definition 13.17) — a maximally expanded sequence of formulas where every TAB rule's requirements are met — and then extracts an *induced Herbrand interpretation* (Definition 13.19) from this full sequence, which serves as a countable model.`,
      `**Full sequences and induced interpretations.** A full sequence Γ̂ (Definition 13.17) satisfies the condition that for every formula that is a principal formula of a TAB rule, the corresponding requirements of that rule are met within Γ̂. Given an unprovable Γ, Lemma 13.18 constructs such a full Γ̂ ⊇ Γ with Γ̂ ⊬_TAB by systematically enumerating all formulas and extending Γ step by step. The induced interpretation F_M from this full sequence (Definition 13.19) assigns truth values based on membership in the sequence, and Lemma 13.20 shows this interpretation satisfies every formula in Γ̂.`,
      `**Gödel's completeness theorem.** The completeness of first-order logic was first proved by Kurt Gödel in 1930 (his doctoral dissertation). From Theorem 13.13 and TAB soundness, one obtains ⊨ φ ⟺ ⊢_TAB φ — this is Gödel's completeness theorem (bekki p.285, footnote). By the equivalence of proof systems (HK = NK = LK = TAB), completeness extends to all formulations of classical first-order logic.`,
      `**Significance and related results.** Completeness has profound consequences: (1) It guarantees that the proof system is *sufficient* — no valid inference escapes it. (2) Combined with soundness, it shows the proof system is equivalent to the semantics (Chapter 5). (3) It underlies the Löwenheim–Skolem theorem (every satisfiable set has a countable model) and the compactness theorem (a set is satisfiable iff every finite subset is). Note: Gödel's completeness theorem should not be confused with Gödel's *incompleteness* theorems, which concern the limitations of formal systems for arithmetic.`,
    ],
    ja: [
      `**完全性の意味。** 完全性定理は、意味論的に妥当な論理式（またはシーケント）が証明体系 K で証明可能であることを述べます。形式的に: Γ ⊨ Δ ならば Γ ⊢_K Δ（戸次 定義13.2）。言い換えれば、証明体系に「漏れ」はない: すべての意味論的真理は形式的な導出で捉えることができます。健全性（⊢ ⟹ ⊨）と合わせて、完全性は ⊢ ⟺ ⊨ という等価性を確立し、証明可能性という構文的概念と妥当性という意味論的概念が完全に一致することを意味します。`,
      `**完全性の二つの形式。** 完全性には二つのバリエーションがあります: (1) **（弱い）完全性定理**（定理13.13）: ⊨ φ ⟹ ⊢_TAB φ — 恒真な文（すべての解釈で真）は証明可能である。(2) **強い完全性定理**（定理13.14）: Γ ⊨ Δ ⟹ Γ ⊢_TAB Δ — Δ が Γ の意味論的帰結ならば、Δ は Γ から導出可能である。強い完全性は弱い完全性を包含します（Γ = ∅ とすればよい）。両形式とも古典一階論理で成立します。`,
      `**ヘンキンの定理: 鍵となる成分。** 完全性の証明はヘンキンの定理（定理13.12）に依拠します: Γ ⊬_TAB ならば、Γ は可算領域で充足可能です。この対偶が完全性を与えます。証明は *充満* した列（定義13.17）— TAB の各規則の要請がすべて満たされた、極大的に拡張された論理式の列 — を構成し、この充満した列から *導出された解釈*（エルブラン解釈）（定義13.19）を取り出します。これが可算モデルとして機能します。`,
      `**充満した列と導出された解釈。** 充満した列 Γ̂（定義13.17）は、TAB 規則の主論理式であるすべての論理式について、その規則の対応する要請が Γ̂ 内で満たされるという条件を満足します。証明不能な Γ が与えられたとき、補題13.18 はすべての論理式を体系的に列挙し、Γ を段階的に拡張することで、Γ̂ ⊇ Γ かつ Γ̂ ⊬_TAB である充満した列を構成します。この充満した列からの導出された解釈 F_M（定義13.19）は列への所属に基づいて真理値を割り当て、補題13.20 はこの解釈が Γ̂ 内のすべての論理式を充足することを示します。`,
      `**ゲーデルの完全性定理。** 一階論理の完全性は、1930年にクルト・ゲーデルによって初めて証明されました（博士論文）。定理13.13 と TAB の健全性から、⊨ φ ⟺ ⊢_TAB φ が得られます — これがゲーデルの完全性定理です（戸次 p.285, 脚注）。証明体系の等価性（HK = NK = LK = TAB）により、完全性は古典一階論理のすべての定式化に拡張されます。`,
      `**意義と関連する結果。** 完全性には深い帰結があります: (1) 証明体系が *十分* であること — 妥当な推論は一つも漏れない — を保証します。(2) 健全性と合わせて、証明体系が意味論（第5章）と等価であることを示します。(3) レーヴェンハイム・スコーレムの定理（充足可能な集合は可算モデルを持つ）やコンパクト性定理（集合が充足可能 ⟺ すべての有限部分集合が充足可能）の基礎となります。注意: ゲーデルの完全性定理はゲーデルの *不完全性* 定理と混同してはなりません。後者は算術の形式体系の限界に関するものです。`,
    ],
  },
  formalNotation:
    "\\Gamma \\vDash \\Delta \\;\\Longrightarrow\\; \\Gamma \\vdash_K \\Delta",
  relatedEntryIds: [
    "concept-soundness",
    "concept-semantic-validity",
    "concept-system-equivalence",
    "system-classical",
    "rule-sc-overview",
    "rule-sc-logical",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/G%C3%B6del%27s_completeness_theorem",
      label: {
        en: "Gödel's completeness theorem (Wikipedia)",
        ja: "ゲーデルの完全性定理 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%B2%E3%83%BC%E3%83%87%E3%83%AB%E3%81%AE%E5%AE%8C%E5%85%A8%E6%80%A7%E5%AE%9A%E7%90%86",
      label: {
        en: "Gödel's completeness theorem (Wikipedia JA)",
        ja: "ゲーデルの完全性定理 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/completeness+theorem",
      label: {
        en: "Completeness theorem (nLab)",
        ja: "完全性定理 (nLab)",
      },
    },
  ],
  keywords: [
    "completeness",
    "完全性",
    "complete",
    "Gödel",
    "ゲーデル",
    "Henkin",
    "ヘンキン",
    "semantic validity",
    "意味論的妥当性",
    "satisfiability",
    "充足可能性",
    "countable model",
    "可算モデル",
    "full sequence",
    "充満",
  ],
  order: 9,
};

const conceptLowenheimSkolem: ReferenceEntry = {
  id: "concept-lowenheim-skolem",
  category: "concept",
  title: {
    en: "Löwenheim–Skolem Theorem",
    ja: "レーヴェンハイム・スコーレムの定理",
  },
  summary: {
    en: "If a set of first-order formulas is satisfiable, then it is satisfiable in a countable domain. Skolem's paradox.",
    ja: "一階論理式の集合が充足可能ならば、可算領域で充足可能である。スコーレムのパラドックス。",
  },
  body: {
    en: [
      `**Statement of the theorem.** The (downward) Löwenheim–Skolem theorem (bekki Theorem 13.23) states: if a set Γ of first-order formulas is satisfiable, then Γ is satisfiable in a countable domain. Formally: if there exists any interpretation (M, g) satisfying Γ, then there exists a countable interpretation (M', g') also satisfying Γ. This means that no first-order theory can force its models to be uncountable — even theories that "talk about" uncountable sets always have countable models.`,
      `**Proof from Henkin's theorem.** The proof is remarkably short. Henkin's theorem (Theorem 13.12) shows that if Γ is unprovable (Γ ⊬_TAB), then Γ is satisfiable in a countable domain. Combined with Lemma 13.9 (if Γ is satisfiable, then Γ ⊬_TAB), the Löwenheim–Skolem theorem follows immediately. The key insight is that the Henkin construction always builds a countable model, since it uses only countably many terms as domain elements.`,
      `**Skolem's paradox.** The theorem leads to the famous Skolem's paradox: set theory (ZFC) proves the existence of uncountable sets, yet by the Löwenheim–Skolem theorem, ZFC itself has a countable model. How can a countable model contain an "uncountable" set? The resolution is that "uncountable" is defined *within* the model — the model lacks a bijection between its version of ℕ and its version of the reals, even though from outside both are countable. This reveals a fundamental limitation of first-order expressiveness.`,
      `**Upward variant.** While bekki presents only the downward direction, there is also an upward Löwenheim–Skolem theorem: any first-order theory with an infinite model has models of every infinite cardinality. Together, the downward and upward versions show that first-order logic cannot characterize infinite structures up to isomorphism — it cannot distinguish between different infinite cardinalities.`,
      `**Significance for model theory.** The Löwenheim–Skolem theorem is a cornerstone of model theory and has far-reaching consequences: (1) It establishes that first-order logic has limited expressive power regarding cardinality. (2) It is closely related to the compactness theorem (Theorem 5.109) — both follow from the completeness theorem. (3) It motivates the study of stronger logics (second-order, infinitary) that can distinguish cardinalities.`,
    ],
    ja: [
      `**定理の記述。** （下方）レーヴェンハイム・スコーレムの定理（戸次 定理13.23）は次のように述べます: 一階論理式の集合 Γ が充足可能ならば、Γ は可算領域で充足可能である。形式的に: Γ を充足する解釈 (M, g) が存在するならば、Γ を充足する可算な解釈 (M', g') も存在する。これは、いかなる一階理論もモデルを非可算に強制することはできないことを意味します — 非可算集合を「語る」理論であっても常に可算モデルを持ちます。`,
      `**ヘンキンの定理からの証明。** 証明は驚くほど短いです。ヘンキンの定理（定理13.12）は、Γ が証明不能（Γ ⊬_TAB）ならば、Γ が可算領域で充足可能であることを示します。補題13.9（Γ が充足可能ならば Γ ⊬_TAB）と組み合わせることで、レーヴェンハイム・スコーレムの定理が直ちに従います。鍵となる洞察は、ヘンキンの構成が常に可算モデルを構築するということです。領域の要素として可算個の項のみを使用するからです。`,
      `**スコーレムのパラドックス。** この定理は有名なスコーレムのパラドックスを導きます: 集合論 (ZFC) は非可算集合の存在を証明しますが、レーヴェンハイム・スコーレムの定理により ZFC 自体が可算モデルを持ちます。可算モデルがどのようにして「非可算」集合を含むことができるのでしょうか？ 解決は、「非可算」がモデル *内部* で定義されるということにあります — モデルには ℕ の版と実数の版の間の全単射が欠けていますが、外部から見ればどちらも可算です。これは一階論理の表現力の根本的な限界を露呈します。`,
      `**上方バリアント。** 戸次では下方向のみが提示されていますが、上方レーヴェンハイム・スコーレムの定理もあります: 無限モデルを持つ一階理論は、あらゆる無限基数のモデルを持ちます。下方と上方を合わせると、一階論理は無限構造を同型を除いて特徴づけることができない — 異なる無限基数を区別できない — ことが示されます。`,
      `**モデル理論への意義。** レーヴェンハイム・スコーレムの定理はモデル理論の礎石であり、広範な帰結を持ちます: (1) 一階論理が基数に関して限定的な表現力を持つことを確立します。(2) コンパクト性定理（定理5.109）と密接に関連します — どちらも完全性定理から従います。(3) 基数を区別できるより強力な論理（二階論理、無限長論理）の研究を動機づけます。`,
    ],
  },
  formalNotation:
    "\\Gamma \\text{ is satisfiable} \\;\\Longrightarrow\\; \\Gamma \\text{ is satisfiable in a countable domain}",
  relatedEntryIds: [
    "concept-completeness",
    "concept-soundness",
    "concept-system-equivalence",
    "system-classical",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/L%C3%B6wenheim%E2%80%93Skolem_theorem",
      label: {
        en: "Löwenheim–Skolem theorem (Wikipedia)",
        ja: "レーヴェンハイム・スコーレムの定理 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%83%AC%E3%83%BC%E3%83%B4%E3%82%A7%E3%83%B3%E3%83%8F%E3%82%A4%E3%83%A0%E2%80%93%E3%82%B9%E3%82%B3%E3%83%BC%E3%83%AC%E3%83%A0%E3%81%AE%E5%AE%9A%E7%90%86",
      label: {
        en: "Löwenheim–Skolem theorem (Wikipedia JA)",
        ja: "レーヴェンハイム・スコーレムの定理 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/L%C3%B6wenheim-Skolem+theorem",
      label: {
        en: "Löwenheim–Skolem theorem (nLab)",
        ja: "レーヴェンハイム・スコーレムの定理 (nLab)",
      },
    },
  ],
  keywords: [
    "Löwenheim",
    "レーヴェンハイム",
    "Skolem",
    "スコーレム",
    "countable model",
    "可算モデル",
    "Skolem's paradox",
    "スコーレムのパラドックス",
    "downward",
    "下方",
    "model theory",
    "モデル理論",
    "cardinality",
    "基数",
  ],
  order: 10,
};

const conceptCompactness: ReferenceEntry = {
  id: "concept-compactness",
  category: "concept",
  title: {
    en: "Compactness Theorem",
    ja: "コンパクト性定理",
  },
  summary: {
    en: "A set of first-order formulas is satisfiable if and only if every finite subset is satisfiable.",
    ja: "一階論理式の集合が充足可能であるのは、そのすべての有限部分集合が充足可能であるときに限る。",
  },
  body: {
    en: [
      `**Statement of the theorem.** The compactness theorem (bekki Theorem 5.109, restated in Section 13.5) states: a set Γ of first-order formulas is satisfiable if and only if every finite subset Γ' ⊆ Γ is satisfiable. The "if" direction is the non-trivial part — the "only if" direction is immediate (any interpretation satisfying Γ also satisfies all its subsets). This theorem captures a remarkable property of first-order logic: infinite unsatisfiability always has a finite "witness."`,
      `**Proof from Henkin's theorem.** In bekki's presentation, compactness follows immediately from Henkin's theorem and the completeness theorem. If every finite subset of Γ is satisfiable, then by soundness, no finite subset is refutable. Since proofs are finite objects, Γ itself is not refutable (any proof of ⊥ from Γ would use only finitely many premises). By completeness, Γ is therefore satisfiable. The proof was originally given in Section 5.5.3, where it was used in proving Herbrand's theorem (Theorem 5.110).`,
      `**Why "compactness"?** The name comes from topology. Consider the space of all truth-value assignments (interpretations) with the product topology. The set of models of each formula is a closed set, and satisfiability of Γ means the intersection of these closed sets is non-empty. By the topological compactness of the product space (Tychonoff's theorem), if every finite sub-intersection is non-empty (every finite subset is satisfiable), then the full intersection is non-empty.`,
      `**Applications.** Compactness is one of the most powerful tools in model theory: (1) **Non-standard models:** It can show that if a theory has arbitrarily large finite models, it has an infinite model (adding axioms saying "there exist at least n distinct elements" for each n). (2) **Transfer principles:** Properties true in all finite structures that can be expressed in first-order logic must also hold in some infinite structures. (3) **Constructing models:** It enables the construction of models with specific properties by adding axiom schemas.`,
      `**Failure in stronger logics.** Compactness is specific to first-order logic and fails in most stronger logics. For example, in second-order logic, the set {"there exist at least n elements" | n ∈ ℕ} ∪ {"the domain is finite"} has every finite subset satisfiable, but the whole set is not. This failure is intimately related to the failure of completeness in second-order logic. Together with the Löwenheim–Skolem theorem, compactness characterizes first-order logic (Lindström's theorem).`,
    ],
    ja: [
      `**定理の記述。** コンパクト性定理（戸次 定理5.109、13.5節に再掲）は次のように述べます: 一階論理式の集合 Γ が充足可能であるのは、すべての有限部分集合 Γ' ⊆ Γ が充足可能であるときに限る。「ときに限る」の「ならば」方向が自明でない部分です — 「であるならば」方向は自明です（Γ を充足する解釈はそのすべての部分集合も充足します）。この定理は一階論理の驚くべき性質を捉えています: 無限の充足不能性には常に有限の「証拠」があります。`,
      `**ヘンキンの定理からの証明。** 戸次の提示では、コンパクト性はヘンキンの定理と完全性定理から直ちに従います。Γ のすべての有限部分集合が充足可能ならば、健全性により、有限部分集合は反駁不能です。証明は有限のオブジェクトなので、Γ 自体も反駁不能です（Γ からの ⊥ の証明は有限個の前提のみを使うため）。完全性により、Γ は充足可能です。証明は元々5.5.3節で与えられ、エルブランの定理（定理5.110）の証明に使われました。`,
      `**なぜ「コンパクト性」か？** 名前は位相幾何学に由来します。すべての真理値割当（解釈）の空間を直積位相で考えます。各論理式のモデルの集合は閉集合であり、Γ の充足可能性はこれらの閉集合の共通部分が空でないことを意味します。直積空間の位相的コンパクト性（チコノフの定理）により、すべての有限部分共通が空でなければ（すべての有限部分集合が充足可能ならば）、全体の共通部分も空でありません。`,
      `**応用。** コンパクト性はモデル理論における最も強力なツールの一つです: (1) **超準モデル:** ある理論が任意に大きな有限モデルを持つならば、無限モデルも持つことを示せます（「少なくとも n 個の異なる要素が存在する」という公理を各 n について追加）。(2) **転移原理:** すべての有限構造で成り立つ一階論理で表現可能な性質は、ある無限構造でも成立しなければなりません。(3) **モデルの構成:** 公理スキーマを追加することで特定の性質を持つモデルの構成が可能になります。`,
      `**より強い論理での不成立。** コンパクト性は一階論理に特有であり、ほとんどのより強い論理では成立しません。例えば、二階論理では {「少なくとも n 個の要素が存在する」 | n ∈ ℕ} ∪ {「領域は有限である」} はすべての有限部分集合が充足可能ですが、全体は充足不能です。この不成立は二階論理での完全性の不成立と密接に関連しています。レーヴェンハイム・スコーレムの定理とともに、コンパクト性は一階論理を特徴づけます（リンドストレームの定理）。`,
    ],
  },
  formalNotation:
    "\\forall \\Gamma' \\subseteq \\Gamma \\;(|\\Gamma'| < \\omega \\Rightarrow \\Gamma' \\text{ sat.}) \\;\\Longrightarrow\\; \\Gamma \\text{ sat.}",
  relatedEntryIds: [
    "concept-completeness",
    "concept-soundness",
    "concept-lowenheim-skolem",
    "system-classical",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Compactness_theorem",
      label: {
        en: "Compactness theorem (Wikipedia)",
        ja: "コンパクト性定理 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%B3%E3%83%B3%E3%83%91%E3%82%AF%E3%83%88%E6%80%A7%E5%AE%9A%E7%90%86",
      label: {
        en: "Compactness theorem (Wikipedia JA)",
        ja: "コンパクト性定理 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/compactness+theorem",
      label: {
        en: "Compactness theorem (nLab)",
        ja: "コンパクト性定理 (nLab)",
      },
    },
  ],
  keywords: [
    "compactness",
    "コンパクト性",
    "compact",
    "finite subset",
    "有限部分集合",
    "satisfiable",
    "充足可能",
    "model theory",
    "モデル理論",
    "non-standard model",
    "超準モデル",
    "Lindström",
    "リンドストレーム",
  ],
  order: 11,
};

const conceptProofTheoreticSemantics: ReferenceEntry = {
  id: "concept-proof-theoretic-semantics",
  category: "concept",
  title: {
    en: "Proof-Theoretic Semantics",
    ja: "証明論的意味論",
  },
  summary: {
    en: "An approach that defines the meaning of logical connectives through their behavior in proof systems, rather than through truth values or model-theoretic interpretations.",
    ja: "論理結合子の意味を真理値やモデル論的解釈ではなく、証明体系における振る舞いによって定める立場。",
  },
  body: {
    en: [
      `**From soundness and completeness to meaning.** The soundness and completeness theorems for first-order logic establish that Γ ⊢ Δ if and only if Γ ⊨ Δ. This means that any formula provable in a proof system (Hilbert, natural deduction, sequent calculus, or tableau — all equivalent by the results of Chapters 9–10) is indeed semantically valid. In the standard view, this gives proof systems their "legitimacy": they are justified because they agree with model-theoretic truth.`,
      `**Two perspectives on legitimacy.** However, one can also adopt a different viewpoint (bekki Section 13.7). Instead of asking whether a proof system faithfully captures semantic truth, one can ask whether every individual proof system is legitimate in its own right. Under this view, soundness and completeness theorems are needed to certify that a proof system is a "genuine proof system." But another perspective — proof-theoretic semantics — proposes that proof systems can define the meaning of logical connectives independently.`,
      `**Meaning through proof rules.** In proof-theoretic semantics, the meaning of a connective like ∧ (conjunction) is not given by "∧ is true when both conjuncts are true" (the model-theoretic account). Instead, it is determined by the inference rules that govern it. In model-theoretic semantics, |∧| is expressed as a truth table; in proof-theoretic semantics, the meaning of ∧ is determined by the two rules (∧) and (¬∧) in the tableau system — or equivalently by the introduction and elimination rules ∧I and ∧E in natural deduction (bekki Section 13.7).`,
      `**Circularity concern and its resolution.** A natural worry arises: when we transfer from one proof system to another (say, from Hilbert to natural deduction), is the validity ultimately preserved? Could the transfer chain produce a circularity, where no system is grounded in absolute correctness? In proof-theoretic semantics, the definition of validity is internal to each system: a proof system's rules themselves constitute the meaning of the connectives. There is no need to appeal to an external notion of truth. However, the equivalence between proof systems and their inclusion relationships guarantee that validity is maintained relatively — each system is justified by its relationship to other systems (bekki Section 13.7).`,
      `**Significance: meaning without truth.** The key insight from soundness and completeness is that the meaning of a formula need not be defined via truth values. Model-theoretic semantics defines meaning through truth functions and interpretations, but proof-theoretic semantics shows that an entirely different — yet equally valid — notion of "meaning" can be given through the behavior of formulas in proofs. This observation, discussed in bekki's concluding remarks on Chapter 2, challenges the common intuition that truth is the fundamental concept. Multiple "meaning" frameworks can coexist, each revealing different aspects of logic.`,
    ],
    ja: [
      `**健全性と完全性から意味へ。** 一階論理の健全性定理と完全性定理は Γ ⊢ Δ と Γ ⊨ Δ が同値であることを確立します。つまり、証明体系（ヒルベルト流、自然演繹、シーケント計算、タブロー — 9–10章の結果によりすべて等価）で証明可能な論理式は、意味論的に妥当です。標準的な見方では、これが証明体系に「正当性」を与えます: モデル論的な真理と一致するがゆえに正当化されるのです。`,
      `**正当性に関する二つの視点。** しかし、別の見方も可能です（戸次 13.7節）。証明体系が意味論的真理を忠実に捉えているかを問う代わりに、個々の証明体系がそれ自体として正当であるかを問うこともできます。この見方では、証明体系が「まともな証明体系」であることを保証するために健全性・完全性定理が必要です。しかし別の視点 — 証明論的意味論 — は、証明体系が論理結合子の意味を独立に定義できると提案します。`,
      `**証明規則による意味。** 証明論的意味論では、∧（連言）のような結合子の意味は「両方の連言肢が真のとき ∧ は真」（モデル論的説明）としてではなく、それを支配する推論規則によって定められます。モデル論の意味論では |∧| は真理値表として表されますが、証明論的意味論では ∧ の意味はタブロー体系における (∧) と (¬∧) の二つの規則によって — あるいは同等に自然演繹の導入規則 ∧I と除去規則 ∧E によって — 決定されます（戸次 13.7節）。`,
      `**循環の懸念とその解消。** 自然な疑問が生じます: ある証明体系から別の体系へ（たとえばヒルベルト流から自然演繹へ）移行するとき、妥当性は最終的に保存されるのでしょうか？ 移行の連鎖が循環を生み、どの体系も絶対的な正しさに基盤を持たないということにならないでしょうか？ 証明論的意味論では、妥当性の定義は各体系の内部にあります: 証明体系の規則自体が結合子の意味を構成するのです。外部的な真理概念に訴える必要はありません。ただし、証明体系間の等価性や包含関係により、妥当性は相対的に保証されます — 各体系は他の体系との関係によって正当化されます（戸次 13.7節）。`,
      `**意義: 真理なしの意味。** 健全性と完全性からの重要な洞察は、論理式の意味が真理値によって定義される必要がないということです。モデル論の意味論は真理関数と解釈を通じて意味を定義しますが、証明論的意味論は、証明における論理式の振る舞いを通じて、まったく異なりながらも同様に妥当な「意味」の概念を与えられることを示します。戸次の第2章に関する結びの考察で述べられたこの観察は、真理が根本概念であるという一般的直観に挑戦するものです。複数の「意味」の枠組みが共存でき、それぞれが論理の異なる側面を明らかにするのです。`,
    ],
  },
  relatedEntryIds: [
    "concept-soundness",
    "concept-completeness",
    "concept-system-equivalence",
    "rule-nd-overview",
    "rule-sc-overview",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Proof-theoretic_semantics",
      label: {
        en: "Proof-theoretic semantics (Wikipedia)",
        ja: "証明論的意味論 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E8%A8%BC%E6%98%8E%E8%AB%96%E7%9A%84%E6%84%8F%E5%91%B3%E8%AB%96",
      label: {
        en: "Proof-theoretic semantics (Wikipedia JA)",
        ja: "証明論的意味論 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/proof-theoretic+semantics",
      label: {
        en: "Proof-theoretic semantics (nLab)",
        ja: "証明論的意味論 (nLab)",
      },
    },
  ],
  keywords: [
    "proof-theoretic semantics",
    "証明論的意味論",
    "proof-theoretic",
    "meaning",
    "意味",
    "inference rule",
    "推論規則",
    "introduction rule",
    "導入規則",
    "elimination rule",
    "除去規則",
    "Dummett",
    "Prawitz",
    "harmony",
    "調和",
  ],
  order: 12,
};

const conceptCutElimination: ReferenceEntry = {
  id: "concept-cut-elimination",
  category: "concept",
  title: {
    en: "Cut Elimination Theorem",
    ja: "カット除去定理",
  },
  summary: {
    en: "Any sequent provable with the CUT rule can be proved without it. The CUT rule is admissible in LM, LJ, and LK. Also known as Gentzen's Hauptsatz.",
    ja: "カット規則を用いた証明は、カット規則なしの証明に変換できる。カット規則は LM, LJ, LK において許容規則である。ゲンツェンの基本定理とも呼ばれる。",
  },
  body: {
    en: [
      `**Statement and significance.** The cut elimination theorem (Hauptsatz) states that for any sequent S, if S is provable in the sequent calculus K (= K-CUT + CUT), then S is provable in K-CUT (i.e., without the CUT rule). This holds for all three sequent calculi: LM (minimal logic), LJ (intuitionistic logic), and LK (classical logic) (bekki Theorem 11.2). Since K = K-CUT + CUT by definition, this means the CUT rule is an **admissible rule** — adding it does not increase the set of provable sequents. This fundamental result, discovered by Gerhard Gentzen in 1934, is one of the most important theorems in proof theory.`,
      `**The MIX rule and proof strategy.** The proof uses a variant of CUT called the **MIX rule**, which replaces *all* occurrences of the cut formula rather than just one. On LM-CUT and LJ-CUT, CUT and MIX are equivalent (bekki Lemma 11.13), so proving that MIX is admissible suffices. MIX has better structural properties for the induction argument. The proof proceeds by **double induction** on the pair (depth d, rank r): the depth d measures the syntactic complexity of the principal (cut) formula, and the rank r counts the consecutive occurrences of the principal formula along paths in the proof tree (bekki Definitions 11.16–11.18).`,
      `**Double induction structure.** The elimination is decomposed into three lemmas: (1) Cut(1,1) — the base case for depth 1 and rank 1 (bekki Lemma 11.23); (2) Cut(d,r) follows from Cut(d,1)…Cut(d,r−1) for r ≥ 2 — reducing rank while keeping depth fixed (bekki Lemma 11.24); (3) Cut(d,1) follows from Cut(1,r)…Cut(d−1,r) for all r, for d ≥ 2 — reducing depth at the cost of possibly increasing rank (bekki Lemma 11.26). This lexicographic induction on (d,r) terminates because each step strictly decreases the pair (bekki Remark 11.28).`,
      `**Consistency as a corollary.** A profound consequence of cut elimination is the **consistency** (inconsistency-freeness) of the proof systems: ⊥ is not provable in LK or LJ (bekki Theorem 11.5). The proof is elegant: if ⊥ were provable, there would be a CUT-free proof of the sequent ⇒ ⊥. But no CUT-free inference rule can produce a sequent with an empty antecedent and ⊥ as the sole succedent, yielding a contradiction. This extends to all equivalent systems (NK, NJ, HK, HJ).`,
      `**Independence of classical axioms.** Another corollary is the **independence of DNE from intuitionistic logic**: the law of double negation elimination (¬¬φ → φ) is not provable in LJ (bekki Theorem 11.9). The proof uses the fact that LEM (φ ∨ ¬φ) is not LJ-provable (bekki Theorem 11.8), which follows from a structural analysis of LJ-CUT proofs showing that CUT-free proofs in LJ must have non-empty antecedents with compound formulas (bekki Lemma 11.6). The LK proof uses a different, elegant approach: via Glivenko's theorem, LK cut elimination is reduced to LJ cut elimination (bekki p.266–267).`,
    ],
    ja: [
      `**定理の主張と意義。** カット除去定理（基本定理, Hauptsatz）は、シーケント S が体系 K（= K-CUT + CUT）で証明可能ならば、K-CUT（カット規則なし）でも証明可能であることを述べます。これはすべてのシーケント計算 — LM（最小論理）、LJ（直観主義論理）、LK（古典論理）— で成り立ちます（戸次 定理11.2）。K = K-CUT + CUT なので、これはカット規則が**許容規則**であることを意味します — カット規則を追加しても証明可能なシーケントの集合は増えません。ゲルハルト・ゲンツェンが1934年に発見したこの基本的な結果は、証明論において最も重要な定理の一つです。`,
      `**ミックス規則と証明戦略。** 証明にはカットの変種である**ミックス規則 (MIX)** が使われます。MIX はカット論理式のすべての出現を一度に置き換える規則で、LM-CUT および LJ-CUT 上でカットと同値です（戸次 補題11.13）。そのため、MIX の許容性を示せば十分です。MIX は帰納法の議論により適した構造的性質を持ちます。証明は対 (深さ d, 階数 r) に対する**二重帰納法**で進みます。深さ d は主論理式（カット論理式）の構文的複雑さ、階数 r は証明図の経路に沿った主論理式の連続出現回数を測ります（戸次 定義11.16–11.18）。`,
      `**二重帰納法の構造。** 除去は3つの補題に分解されます: (1) Cut(1,1) — 深さ1・階数1の基本ケース（戸次 補題11.23）、(2) r ≥ 2 のとき Cut(d,1)…Cut(d,r−1) から Cut(d,r) が従う — 深さを固定して階数を減少（戸次 補題11.24）、(3) d ≥ 2 のとき任意の r に対して Cut(1,r)…Cut(d−1,r) から Cut(d,1) が従う — 階数が増える可能性があるが深さが減少（戸次 補題11.26）。(d,r) の辞書式帰納法は各ステップで対を真に減少させるため停止します（戸次 解説11.28）。`,
      `**系としての無矛盾性。** カット除去の深い帰結として、証明体系の**無矛盾性**（矛盾の導出不可能性）があります: LK でも LJ でも ⊥ は証明不能です（戸次 定理11.5）。証明は簡明です: もし ⊥ が証明可能なら、シーケント ⇒ ⊥ のカットなし証明が存在しますが、前件が空で ⊥ のみを後件に持つシーケントを結論とするカットなし推論規則は存在しないため矛盾します。これは等価な体系（NK, NJ, HK, HJ）にも拡張されます。`,
      `**古典論理固有の公理の独立性。** もう一つの系として、**直観主義論理からの DNE の独立性**があります: 二重否定除去（¬¬φ → φ）は LJ では証明不能です（戸次 定理11.9）。証明には、排中律（φ ∨ ¬φ）が LJ で証明不能であること（戸次 定理11.8）を利用します。これは LJ-CUT の証明の構造分析 — カットなし証明では前件が非空で複合論理式を含む必要がある（戸次 補題11.6）— から従います。LK の証明は異なる巧妙なアプローチを取ります: グリベンコの定理を経由して、LK のカット除去を LJ のカット除去に帰着させます（戸次 p.266–267）。`,
    ],
  },
  formalNotation:
    "\\vdash_K S \\;\\Longrightarrow\\; \\vdash_{K\\text{-CUT}} S",
  relatedEntryIds: [
    "concept-soundness",
    "concept-completeness",
    "concept-system-equivalence",
    "rule-sc-overview",
    "rule-sc-structural",
    "rule-sc-logical",
    "concept-glivenko",
    "concept-curry-howard",
    "concept-admissible-derivable",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Cut-elimination_theorem",
      label: {
        en: "Cut-elimination theorem (Wikipedia)",
        ja: "カット除去定理 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%AB%E3%83%83%E3%83%88%E9%99%A4%E5%8E%BB%E5%AE%9A%E7%90%86",
      label: {
        en: "Cut elimination theorem (Wikipedia JA)",
        ja: "カット除去定理 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/cut+elimination",
      label: {
        en: "Cut elimination (nLab)",
        ja: "カット除去 (nLab)",
      },
    },
  ],
  keywords: [
    "cut elimination",
    "カット除去",
    "Hauptsatz",
    "基本定理",
    "Gentzen",
    "ゲンツェン",
    "admissible",
    "許容規則",
    "MIX rule",
    "ミックス規則",
    "consistency",
    "無矛盾性",
    "double induction",
    "二重帰納法",
    "rank",
    "階数",
  ],
  order: 13,
};

const conceptCurryHoward: ReferenceEntry = {
  id: "concept-curry-howard",
  category: "concept",
  title: {
    en: "Curry-Howard Correspondence",
    ja: "カリー・ハワード対応",
  },
  summary: {
    en: "A deep structural isomorphism between typed lambda calculus and natural deduction: proofs correspond to programs, and propositions correspond to types.",
    ja: "型付きラムダ計算と自然演繹の間の深い構造的同型: 証明はプログラムに、命題は型に対応する。",
  },
  body: {
    en: [
      `**Proofs as programs, propositions as types.** The Curry-Howard correspondence (also called the Curry-Howard isomorphism or proofs-as-programs interpretation) reveals a profound structural identity between formal proof systems and type systems in programming languages. Under this correspondence, **propositions correspond to types** and **proofs correspond to programs** (lambda terms). For example, a proof of the implication φ → ψ corresponds to a function of type φ → ψ — a program that takes an input of type φ and produces an output of type ψ. This insight, discovered independently by Haskell Curry (1958) and William Howard (1969), fundamentally connects logic and computation.`,
      `**The correspondence table.** The key correspondences are: implication (→) corresponds to function types, conjunction (∧) to product types (pairs), disjunction (∨) to sum types (tagged unions), universal quantification (∀) to dependent function types, and existential quantification (∃) to dependent pair types. On the proof side, the introduction and elimination rules of natural deduction correspond precisely to the construction and destruction operations of typed lambda calculus: →-introduction is lambda abstraction, →-elimination is function application, ∧-introduction is pair construction, and so on.`,
      `**Cut elimination and normalization.** One of the most striking aspects of the correspondence is the connection between **cut elimination** in sequent calculus and **normalization** (β-reduction) in lambda calculus. A cut in a proof corresponds to a β-redex in a lambda term — the composition of an introduction rule immediately followed by an elimination rule. Cut elimination transforms a proof into cut-free (normal) form, just as β-reduction normalizes a lambda term. The strong normalization theorem for typed lambda calculus is thus the computational counterpart of the cut elimination theorem (bekki Afterword p.298). Key references include Prawitz (1965), Zucker (1974), Pottinger (1977), and Barendregt and Ghilezan (2000).`,
      `**Logical systems and type systems.** Different logical systems correspond to different type systems: minimal logic (NM) corresponds to the simply typed lambda calculus, intuitionistic logic (NJ) to the simply typed lambda calculus with an empty type (⊥), and classical logic (NK) to extensions with control operators (such as call/cc or continuations). The correspondence extends beyond propositional logic — Martin-Löf's intuitionistic type theory extends it to predicate logic with dependent types, forming the foundation of proof assistants such as Coq, Agda, and Lean.`,
      `**Significance and applications.** The Curry-Howard correspondence bridges the gap between mathematics and computer science, enabling: (1) proof assistants that verify mathematical proofs as type-checked programs, (2) program extraction from constructive proofs, and (3) a unified framework for understanding both proof theory and programming language theory. The correspondence has inspired the development of modern programming language features including pattern matching (corresponding to case analysis on disjunctions), dependent types (corresponding to quantifiers), and effects/continuations (corresponding to classical reasoning principles).`,
    ],
    ja: [
      `**証明はプログラム、命題は型。** カリー・ハワード対応（カリー・ハワード同型とも呼ばれる）は、形式的な証明体系とプログラミング言語の型システムの間に存在する深い構造的同一性を明らかにします。この対応のもとで、**命題は型に対応**し、**証明はプログラム**（ラムダ項）に対応します。たとえば、含意 φ → ψ の証明は型 φ → ψ を持つ関数 — 型 φ の入力を受け取り型 ψ の出力を返すプログラム — に対応します。この洞察はハスケル・カリー（1958年）とウィリアム・ハワード（1969年）によって独立に発見され、論理学と計算を根本的に結びつけるものです。`,
      `**対応表。** 主要な対応は次のとおりです: 含意（→）は関数型に、連言（∧）は直積型（ペア）に、選言（∨）は直和型（タグ付き共用体）に、全称量化（∀）は依存関数型に、存在量化（∃）は依存ペア型に対応します。証明の側では、自然演繹の導入規則と除去規則が型付きラムダ計算の構成操作と分解操作に正確に対応します: →導入はラムダ抽象、→除去は関数適用、∧導入はペア構成、などとなります。`,
      `**カット除去と正規化。** この対応の最も顕著な側面の一つが、シーケント計算における**カット除去**とラムダ計算における**正規化**（β簡約）の間の結びつきです。証明のカットはラムダ項のβ簡約基（β-redex）— 導入規則の直後に除去規則が続く合成 — に対応します。カット除去は証明をカットなし（正規）の形に変換しますが、これはちょうどβ簡約がラムダ項を正規化するのと同じです。型付きラムダ計算の強正規化定理はカット除去定理の計算的対応物です（戸次 おわりに p.298）。主要な参考文献として Prawitz (1965)、Zucker (1974)、Pottinger (1977)、Barendregt and Ghilezan (2000) があります。`,
      `**論理体系と型システム。** 異なる論理体系は異なる型システムに対応します: 最小論理（NM）は単純型付きラムダ計算に、直観主義論理（NJ）は空型（⊥）を持つ単純型付きラムダ計算に、古典論理（NK）は制御演算子（call/ccや継続など）を持つ拡張に対応します。この対応は命題論理を超えて拡張され — マルティン＝レーフの直観主義型理論は依存型による述語論理への拡張であり、Coq, Agda, Lean などの証明支援系の基盤となっています。`,
      `**意義と応用。** カリー・ハワード対応は数学と計算機科学を橋渡しし、以下を可能にします: (1) 数学的証明を型検査されたプログラムとして検証する証明支援系、(2) 構成的証明からのプログラム抽出、(3) 証明論とプログラミング言語理論の両方を理解するための統一的な枠組み。この対応は現代のプログラミング言語機能の発展にも影響を与えており、パターンマッチング（選言に対するケース分析に対応）、依存型（量化子に対応）、エフェクト・継続（古典的推論原理に対応）などがあります。`,
    ],
  },
  formalNotation:
    "\\text{Proof of } \\varphi \\;\\longleftrightarrow\\; \\text{Term } M : \\varphi",
  relatedEntryIds: [
    "concept-cut-elimination",
    "rule-nd-overview",
    "rule-nd-implication",
    "system-minimal",
    "system-intuitionistic",
    "system-classical",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Curry%E2%80%93Howard_correspondence",
      label: {
        en: "Curry-Howard correspondence (Wikipedia)",
        ja: "カリー・ハワード対応 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%AB%E3%83%AA%E3%83%BC%EF%BC%9D%E3%83%8F%E3%83%AF%E3%83%BC%E3%83%89%E5%90%8C%E5%9E%8B",
      label: {
        en: "Curry-Howard isomorphism (Wikipedia JA)",
        ja: "カリー＝ハワード同型 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/propositions+as+types",
      label: {
        en: "Propositions as types (nLab)",
        ja: "命題としての型 (nLab)",
      },
    },
  ],
  keywords: [
    "Curry-Howard",
    "カリー・ハワード",
    "proofs as programs",
    "propositions as types",
    "命題は型",
    "証明はプログラム",
    "isomorphism",
    "同型",
    "typed lambda calculus",
    "型付きラムダ計算",
    "normalization",
    "正規化",
    "β-reduction",
    "β簡約",
    "proof assistant",
    "証明支援系",
  ],
  order: 14,
};

const conceptAdmissibleDerivable: ReferenceEntry = {
  id: "concept-admissible-derivable",
  category: "concept",
  title: {
    en: "Admissible vs Derivable Rules",
    ja: "許容規則と派生規則",
  },
  summary: {
    en: "A derivable rule can be justified within the system by a proof tree; an admissible rule preserves provability but may lack such justification.",
    ja: "派生規則は体系内の証明図で正当化できる規則であり、許容規則は証明可能性を保存するが体系内での正当化を持つとは限らない。",
  },
  body: {
    en: [
      `**Derivable and admissible rules.** In formal proof systems, particularly sequent calculus, the distinction between **derivable** (derivable) and **admissible** (admissible) rules is fundamental. Consider a rule R of the form "from premises S₁, ..., Sₙ conclude S." Rule R is **derivable** in a proof system K if there exists a proof tree in K from S₁, ..., Sₙ to S — that is, the rule can be justified entirely within the system. Rule R is **admissible** in K if whenever S₁, ..., Sₙ are all provable in K, then S is also provable in K — that is, adding the rule does not increase the set of theorems (bekki Definition 9.24).`,
      `**Every derivable rule is admissible.** If a rule can be justified within the system (derivable), then it certainly preserves provability (admissible). The converse does not hold in general: there are rules that preserve provability without being justifiable within the system. This asymmetry is precisely what makes the distinction important (bekki Remark 9.25).`,
      `**The cut rule as a key example.** The most prominent example of this distinction is the **cut rule** in sequent calculus. The cut rule is derivable in systems that include it (such as LK, LJ, LM with cut), but the **cut elimination theorem** shows that the cut rule is admissible in the cut-free systems — any sequent provable with cut is also provable without it. This means removing the cut rule does not reduce the proving power of the system, even though the cut rule cannot be derived from the remaining rules alone (bekki Theorem 9.28).`,
      `**Characterization theorem.** Bekki's Theorem 9.28 provides five equivalent conditions for a rule R to be admissible in K: (1) K = K+R (adding the rule does not change the system), (2) anything provable in K+R is already provable in K, (3) any K+R proof can be transformed into a K proof, (4) any K+R proof where R is used only at the bottom can be transformed into a K proof, and (5) the premises being provable in K implies the conclusion is provable in K. Furthermore, two rules R and R' are equivalent over K if and only if each is admissible in the system extended by the other (bekki Theorem 9.30).`,
      `**Significance in proof theory.** The admissible/derivable distinction is central to understanding the structure of proof systems. When designing or analyzing a logic, one must determine whether certain rules (weakening, contraction, cut) are built into the system (derivable) or merely preserve theorems (admissible). This distinction also affects the computational content of proofs under the Curry-Howard correspondence: derivable rules correspond to definable functions, while admissible rules may require global transformations that have no direct computational counterpart.`,
    ],
    ja: [
      `**派生規則と許容規則。** 形式的な証明体系、特にシーケント計算において、**派生可能**（derivable）と**許容的**（admissible）の区別は基本的に重要です。「前提 S₁, ..., Sₙ から結論 S を得る」形式の規則 R を考えます。規則 R が証明体系 K において**派生規則**であるとは、S₁, ..., Sₙ から S への K の証明図が存在すること — すなわち、その規則が体系内で完全に正当化できることを意味します。規則 R が K において**許容規則**であるとは、S₁, ..., Sₙ がすべて K で証明可能であるならば S もまた K で証明可能であること — すなわち、その規則を加えても定理の集合が増えないことを意味します（戸次 定義9.24）。`,
      `**すべての派生規則は許容規則である。** 規則が体系内で正当化できる（派生可能な）場合、それは確実に証明可能性を保存します（許容的です）。逆は一般には成り立ちません: 証明可能性を保存するが体系内では正当化できない規則が存在します。この非対称性こそが、この区別を重要にしている点です（戸次 解説9.25）。`,
      `**カット規則 — 鍵となる例。** この区別の最も顕著な例は、シーケント計算における**カット規則**です。カット規則はそれを含む体系（カット付きの LK, LJ, LM など）では派生規則ですが、**カット除去定理**はカットなし体系においてカット規則が許容規則であることを示しています — カットを使って証明できるシーケントはカットなしでも証明可能です。これは、カット規則を除いても体系の証明力が減らないことを意味しますが、残りの規則だけからカット規則を導出することはできません（戸次 定理9.28）。`,
      `**特徴付け定理。** 戸次の定理9.28は、規則 R が K において許容規則であるための5つの同値条件を与えます: (1) K = K+R（規則を加えても体系が変わらない）、(2) K+R で証明可能なものはすでに K で証明可能、(3) K+R の証明図は K の証明図に変換できる、(4) R が最下段のみで使われている K+R の証明図は K の証明図に変換できる、(5) 前提が K で証明可能ならば結論も K で証明可能。さらに、2つの規則 R と R' が K 上で等価であるための必要十分条件は、それぞれが他方を加えた体系の許容規則であることです（戸次 定理9.30）。`,
      `**証明論における意義。** 許容規則と派生規則の区別は、証明体系の構造を理解するうえで中心的です。論理を設計・分析する際には、ある規則（弱化、縮約、カット）が体系に組み込まれている（派生可能）のか、単に定理を保存する（許容的）だけなのかを判定する必要があります。この区別はカリー・ハワード対応のもとでの証明の計算的内容にも影響します: 派生規則は定義可能な関数に対応しますが、許容規則は直接的な計算的対応物を持たない大域的変換を要求する場合があります。`,
    ],
  },
  formalNotation: `\\text{Derivable: } \\exists\\text{proof tree in }\\mathcal{K}\\text{ from }S_1,\\ldots,S_n\\text{ to }S \\\\
\\text{Admissible: } \\vdash_{\\mathcal{K}} S_1,\\ldots,\\vdash_{\\mathcal{K}} S_n \\implies \\vdash_{\\mathcal{K}} S`,
  relatedEntryIds: [
    "concept-cut-elimination",
    "concept-curry-howard",
    "rule-sc-structural",
    "rule-sc-logical",
    "system-classical",
    "system-intuitionistic",
    "system-minimal",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Admissible_rule",
      label: {
        en: "Admissible rule (Wikipedia)",
        ja: "許容規則 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E8%A8%B1%E5%AE%B9%E8%A6%8F%E5%89%87",
      label: {
        en: "Admissible rule (Wikipedia JA)",
        ja: "許容規則 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/admissible+rule",
      label: {
        en: "Admissible rule (nLab)",
        ja: "許容規則 (nLab)",
      },
    },
  ],
  keywords: [
    "admissible",
    "derivable",
    "許容規則",
    "派生規則",
    "許容的",
    "派生可能",
    "admissible rule",
    "derivable rule",
    "cut rule",
    "カット規則",
    "cut elimination",
    "カット除去",
    "structural rule",
    "構造規則",
  ],
  order: 15,
};

const conceptContextSharingIndependence: ReferenceEntry = {
  id: "concept-context-sharing-independence",
  category: "concept",
  title: {
    en: "Context-Sharing vs Context-Independent Rules",
    ja: "構造共有形と構造独立形の規則",
  },
  summary: {
    en: "Two formulations of sequent calculus rules: context-sharing (Gentzen's original) where premises share the same context Γ,Δ, and context-independent (this app's choice) where premises have separate contexts.",
    ja: "シーケント計算の規則の2つの定式化: 前提が同一のコンテキストΓ,Δを共有する構造共有形（Gentzenのオリジナル）と、前提が独立したコンテキストを持つ構造独立形（本アプリの採用形式）。",
  },
  body: {
    en: [
      `**Two formulations of inference rules.** In sequent calculus, two-premise rules like (→⇒) can be formulated in two different ways. In the **context-sharing** form (Gentzen's original), both premises share the same side formulas Γ and Δ. In the **context-independent** form (used in this application, following bekki), each premise has its own independent context. For (→⇒), these look like:`,
      `**Context-sharing (→⇒):** From Γ ⇒ Δ, φ and ψ, Γ ⇒ Δ, conclude φ → ψ, Γ ⇒ Δ. Here the context Γ, Δ is shared between both premises and the conclusion. This is Gentzen's original 1935 formulation.`,
      `**Context-independent (→⇒):** From Γ ⇒ Δ, φ and ψ, Γ' ⇒ Δ', conclude φ → ψ, Γ, Γ' ⇒ Δ, Δ'. Here each premise has its own context (Γ,Δ and Γ',Δ' respectively), and the conclusion combines them.`,
      `**Why this application uses the context-independent form.** The context-independent form is adopted here for a specific reason related to the relationship between LK (classical) and LJ (intuitionistic). When LJ is defined by restricting LK's right side to at most one formula, the context-sharing (→⇒) forces Δ to be empty (since both Δ,φ and Δ must have length ≤ 1). This means the LJ version of (→⇒) becomes a special case with a different form. Troelstra and Schwichtenberg (2000) address this in their systems G1i and G1m by using a modified rule: from Γ ⇒ φ and ψ, Γ ⇒ χ, conclude φ → ψ, Γ ⇒ χ (bekki pp.296–297).`,
      `**The problem with the modified rule.** While this modified (→⇒) is a derivable rule in LK, it is not the same as LK's (→⇒) restricted to single-conclusion sequents. Consequently, a proof in G1i is not automatically a proof in G1c (the classical system), making the relationship between intuitionistic and classical provability less transparent.`,
      `**Trade-off.** The context-independent form avoids these issues: the LJ version of (→⇒) is simply the LK version with single-formula right sides, so any LJ proof is automatically an LK proof. However, it introduces an asymmetry — while all other logical rules in this application's LK use the context-sharing form, (→⇒) alone uses the context-independent form (bekki p.297). The choice reflects a deliberate design decision prioritizing the clean subsystem relationship LM ⊂ LJ ⊂ LK.`,
      `**Connection to weakening and contraction.** The context-sharing and context-independent forms are interderivable in the presence of weakening and contraction. Context-sharing can simulate context-independence by weakening both premises to have a common context; conversely, context-independence can simulate context-sharing by using the same context Γ in both premises (setting Γ' = Γ and Δ' = Δ). This means the two formulations yield the same set of provable sequents.`,
    ],
    ja: [
      `**推論規則の2つの定式化。** シーケント計算において、(→⇒) のような2前提規則には2通りの定式化があります。**構造共有形**（Gentzenのオリジナル）では両前提が同一の副論理式列 Γ, Δ を共有します。**構造独立形**（本アプリケーションが戸次に従い採用する形式）では各前提が独立したコンテキストを持ちます。(→⇒) の場合、以下のようになります:`,
      `**構造共有形 (→⇒):** Γ ⇒ Δ, φ と ψ, Γ ⇒ Δ から φ → ψ, Γ ⇒ Δ を得る。ここでコンテキスト Γ, Δ は両前提と結論で共有されます。これが Gentzen (1935) のオリジナルの定式化です。`,
      `**構造独立形 (→⇒):** Γ ⇒ Δ, φ と ψ, Γ' ⇒ Δ' から φ → ψ, Γ, Γ' ⇒ Δ, Δ' を得る。ここで各前提はそれぞれ独立したコンテキスト (Γ,Δ と Γ',Δ') を持ち、結論でそれらが結合されます。`,
      `**本アプリケーションが構造独立形を採用する理由。** 構造独立形の採用にはLK（古典論理）とLJ（直観主義論理）の関係に関する具体的な理由があります。LJをLKの右辺を高々1つの論理式に制限して定義する場合、構造共有形の(→⇒)ではΔが空列に限定されます（Δ,φ と Δ の両方が長さ1以下でなければならないため）。このためLJ版の(→⇒)は異なる形式の特殊なものになります。Troelstra and Schwichtenberg (2000) はG1i・G1m体系で修正された規則を使っています: Γ ⇒ φ と ψ, Γ ⇒ χ から φ → ψ, Γ ⇒ χ を導く形式です（戸次 pp.296–297）。`,
      `**修正規則の問題点。** この修正された (→⇒) はLKの派生規則ではありますが、単結論シーケントに制限したLKの (→⇒) とは同一ではありません。その結果、G1i の証明が自動的に G1c（古典体系）の証明にはならず、直観主義と古典論理の証明可能性の関係が不透明になります。`,
      `**トレードオフ。** 構造独立形はこれらの問題を回避します: LJ版の(→⇒)は単にLK版を右辺1論理式に制限したものになるため、あらゆるLJ証明が自動的にLK証明となります。ただし、非対称性が生じます — 本アプリケーションのLKにおいて、他のすべての論理規則は構造共有形なのに対し、(→⇒) だけが構造独立形です（戸次 p.297）。この選択は、LM ⊂ LJ ⊂ LK という明確な部分体系関係を優先する意図的な設計判断を反映しています。`,
      `**弱化・縮約との関係。** 構造共有形と構造独立形は、弱化と縮約がある体系では相互に導出可能です。構造共有形は、両前提を弱化して共通のコンテキストを持たせることで構造独立形を模倣でき、逆に構造独立形は同一のコンテキストΓを両前提に使う（Γ' = Γ, Δ' = Δ とする）ことで構造共有形を模倣できます。つまり、2つの定式化は同じ証明可能シーケントの集合を与えます。`,
    ],
  },
  formalNotation: `\\text{Context-sharing: } (\\to\\Rightarrow)\\; \\dfrac{\\Gamma \\Rightarrow \\Delta, \\varphi \\qquad \\psi, \\Gamma \\Rightarrow \\Delta}{\\varphi \\to \\psi, \\Gamma \\Rightarrow \\Delta} \\\\[12pt]
\\text{Context-independent: } (\\to\\Rightarrow)\\; \\dfrac{\\Gamma \\Rightarrow \\Delta, \\varphi \\qquad \\psi, \\Gamma' \\Rightarrow \\Delta'}{\\varphi \\to \\psi, \\Gamma, \\Gamma' \\Rightarrow \\Delta, \\Delta'}`,
  relatedEntryIds: [
    "rule-sc-overview",
    "rule-sc-structural",
    "rule-sc-logical",
    "concept-admissible-derivable",
    "system-classical",
    "system-intuitionistic",
    "system-minimal",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Sequent_calculus",
      label: {
        en: "Sequent calculus (Wikipedia)",
        ja: "シーケント計算 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%B7%E3%83%BC%E3%82%AF%E3%82%A8%E3%83%B3%E3%83%88%E8%A8%88%E7%AE%97",
      label: {
        en: "Sequent calculus (Wikipedia JA)",
        ja: "シーケント計算 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/sequent+calculus",
      label: {
        en: "Sequent calculus (nLab)",
        ja: "シーケント計算 (nLab)",
      },
    },
    {
      type: "other",
      url: "https://www.cambridge.org/core/books/basic-proof-theory/51CA760BC24E2B4C3FC1E7072961AE49",
      label: {
        en: "Troelstra & Schwichtenberg: Basic Proof Theory",
        ja: "Troelstra & Schwichtenberg: Basic Proof Theory",
      },
    },
  ],
  keywords: [
    "context-sharing",
    "context-independent",
    "構造共有形",
    "構造独立形",
    "implication left",
    "→⇒",
    "Gentzen",
    "G1c",
    "G1i",
    "G1m",
    "LK",
    "LJ",
    "Troelstra",
    "Schwichtenberg",
  ],
  order: 16,
};

const conceptPredicateSemantics: ReferenceEntry = {
  id: "concept-predicate-semantics",
  category: "concept",
  title: {
    en: "Structure and Interpretation in Predicate Logic",
    ja: "述語論理の構造と解釈",
  },
  summary: {
    en: "A structure M = (D_M, F_M) provides a domain and interpretation for non-logical symbols; together with an assignment g, it determines the truth value of every formula.",
    ja: "構造 M = (D_M, F_M) は領域と非論理記号の解釈を与え、割り当て g と合わせて、すべての論理式の真理値を決定する。",
  },
  body: {
    en: [
      `**From propositional to predicate semantics.** In propositional logic, a truth-value assignment to propositional variables suffices to determine the truth value of any formula. In predicate logic, the situation is richer: formulas speak about objects in a domain, and their truth depends on which objects the domain contains and how names, functions, and predicates are interpreted. The semantic framework requires two components: a **structure** M providing the "world" being described, and a variable **assignment** g specifying which objects the variables denote (bekki Ch.5, Section 5.3).`,
      `**Structure: domain and interpretation.** A structure M = (D_M, F_M) consists of a non-empty set D_M called the **domain** (or universe) and an **interpretation function** F_M (bekki Definition 5.43). The domain D_M is the collection of **entities** that the formulas talk about — for example, the natural numbers N, the real numbers R, or any non-empty set. The interpretation function F_M maps each non-logical symbol to a mathematical object: each name (constant) α maps to an element F_M(α) ∈ D_M; each n-ary function symbol o maps to a function F_M(o): D_M^n → D_M; and each n-ary predicate symbol θ maps to a truth-function F_M(θ): D_M^n → D_t (where D_t = {0, 1}).`,
      `**Variable assignment.** An assignment g is a function from the set of variables to D_M (bekki Section 5.3.4). Given a structure M and assignment g, the pair (M, g) is called an **interpretation**. Since predicate logic formulas may contain free variables, the assignment is needed to specify what those variables denote. For a variable ξ, g(ξ) ∈ D_M. An important operation is the **ξ-variant** g[ξ ↦ a] that agrees with g on all variables except ξ, which it maps to a ∈ D_M (bekki Definition 5.49).`,
      `**Denotation of terms.** Given an interpretation (M, g), every term τ receives a value ⟦τ⟧_{M,g} ∈ D_M, called its **denotation** (bekki Definition 5.45). For a name α: ⟦α⟧_{M,g} = F_M(α). For a variable ξ: ⟦ξ⟧_{M,g} = g(ξ). For a function application o(τ₁, …, τₙ): ⟦o(τ₁, …, τₙ)⟧_{M,g} = F_M(o)(⟦τ₁⟧_{M,g}, …, ⟦τₙ⟧_{M,g}). This recursive definition ensures that every term denotes a unique element of D_M.`,
      `**Satisfaction of formulas.** The truth value ⟦φ⟧_{M,g} ∈ {0, 1} of a formula φ under interpretation (M, g) is defined recursively (bekki Definitions 5.46–5.51). For atomic formulas: ⟦θ(τ₁, …, τₙ)⟧_{M,g} = F_M(θ)(⟦τ₁⟧_{M,g}, …, ⟦τₙ⟧_{M,g}). For propositional connectives (¬, ∧, ∨, →, ↔), the truth functions are the standard ones from propositional logic (bekki Definition 5.47). The key new cases are the quantifiers: ⟦∀ξφ⟧_{M,g} = 1 if and only if for every a ∈ D_M, ⟦φ⟧_{M,g[ξ↦a]} = 1; and ⟦∃ξφ⟧_{M,g} = 1 if and only if there exists an a ∈ D_M such that ⟦φ⟧_{M,g[ξ↦a]} = 1 (bekki Definition 5.51).`,
      `**Examples.** Consider a structure where D_M = {mammals}, F(x) means "x is a mammal" and G(x) means "x lays eggs". The formula ∃x(F(x) ∧ G(x)) asserts "there exists an egg-laying mammal." Under an assignment mapping x to a platypus, both F(x) and G(x) are true, so the formula is satisfied. In contrast, under D_M = N (natural numbers) with the standard interpretation, ∀x(F(x) → ∃xF(x)) is always true regardless of the predicate F, since if F(a) holds for some a, then ∃xF(x) follows (bekki Examples 5.52–5.53).`,
      `**Semantic entailment.** An interpretation (M, g) **satisfies** a formula φ (written (M, g) ⊨ φ) if ⟦φ⟧_{M,g} = 1. A set Γ **semantically entails** Δ (written Γ ⊨ Δ) if every interpretation satisfying all formulas in Γ also satisfies at least one formula in Δ (bekki Definition 5.66). A formula φ is a **tautology** (or logically valid) if ⊨ φ, meaning it is true under every interpretation. These semantic notions are the predicate-logic analogues of propositional tautology and entailment, and they are connected to the proof-theoretic notions (⊢) by the soundness and completeness theorems.`,
    ],
    ja: [
      `**命題論理から述語論理の意味論へ。** 命題論理では、命題変数への真理値割当だけで任意の論理式の真理値が決まります。述語論理では状況がより豊かです: 論理式は領域内の対象について述べ、その真理値は領域がどのような対象を含み、名前・関数・述語がどう解釈されるかに依存します。意味論的枠組みには2つの要素が必要です: 記述される「世界」を提供する**構造** M と、変数がどの対象を指示するかを指定する変数**割り当て** g です（戸次 Ch.5, 5.3節）。`,
      `**構造: 領域と対応付け。** 構造 M = (D_M, F_M) は、**領域**（または存在物の集合）と呼ばれる空でない集合 D_M と**対応付け** F_M からなります（戸次 定義5.43）。領域 D_M は論理式が語る**存在物**の集まりです — 例えば、自然数 N、実数 R、または任意の空でない集合です。対応付け F_M は各非論理記号を数学的対象に写します: 各名前（定数）α は要素 F_M(α) ∈ D_M に、各 n 項演算子 o は関数 F_M(o): D_M^n → D_M に、各 n 項述語 θ は真理関数 F_M(θ): D_M^n → D_t（ただし D_t = {0, 1}）に写されます。`,
      `**変数の割り当て。** 割り当て g は変数の集合から D_M への関数です（戸次 5.3.4節）。構造 M と割り当て g の対 (M, g) を**解釈**と呼びます。述語論理の論理式は自由変数を含みうるため、それらの変数が何を指示するかを指定する割り当てが必要です。変数 ξ に対して g(ξ) ∈ D_M です。重要な操作として、ξ 以外のすべての変数で g と一致し、ξ を a ∈ D_M に写す**ξ変異** g[ξ ↦ a] があります（戸次 定義5.49）。`,
      `**項の指示対象。** 解釈 (M, g) のもとで、すべての項 τ は値 ⟦τ⟧_{M,g} ∈ D_M を受け取ります。これを**指示対象**（denotation）と呼びます（戸次 定義5.45）。名前 α の場合: ⟦α⟧_{M,g} = F_M(α)。変数 ξ の場合: ⟦ξ⟧_{M,g} = g(ξ)。関数適用 o(τ₁, …, τₙ) の場合: ⟦o(τ₁, …, τₙ)⟧_{M,g} = F_M(o)(⟦τ₁⟧_{M,g}, …, ⟦τₙ⟧_{M,g})。この再帰的定義により、すべての項は D_M の一意な要素を指示します。`,
      `**論理式の充足。** 解釈 (M, g) のもとでの論理式 φ の真理値 ⟦φ⟧_{M,g} ∈ {0, 1} は再帰的に定義されます（戸次 定義5.46–5.51）。基本述語式: ⟦θ(τ₁, …, τₙ)⟧_{M,g} = F_M(θ)(⟦τ₁⟧_{M,g}, …, ⟦τₙ⟧_{M,g})。命題結合子（¬, ∧, ∨, →, ↔）の真理関数は命題論理の標準的なものです（戸次 定義5.47）。鍵となる新しい場合は量化子です: ⟦∀ξφ⟧_{M,g} = 1 ⟺ すべての a ∈ D_M について ⟦φ⟧_{M,g[ξ↦a]} = 1 であり、⟦∃ξφ⟧_{M,g} = 1 ⟺ ⟦φ⟧_{M,g[ξ↦a]} = 1 となる a ∈ D_M が存在する（戸次 定義5.51）。`,
      `**例。** D_M = {哺乳類}、F(x) が「xは哺乳類である」、G(x) が「xは卵生である」という構造を考えます。論理式 ∃x(F(x) ∧ G(x)) は「卵を産む哺乳類が存在する」と主張します。x にカモノハシを割り当てると F(x) も G(x) も真になるので、この論理式は充足されます。一方、D_M = N（自然数）で標準的な解釈のもとでは、∀x(F(x) → ∃xF(x)) は述語 F によらず常に真です。ある a に対して F(a) が成り立てば ∃xF(x) が従うからです（戸次 例5.52–5.53）。`,
      `**意味論的含意。** 解釈 (M, g) が論理式 φ を**充足する**（(M, g) ⊨ φ と書く）とは ⟦φ⟧_{M,g} = 1 のことです。集合 Γ が Δ を**意味論的に含意する**（Γ ⊨ Δ と書く）とは、Γ のすべての論理式を充足するすべての解釈が Δ の少なくとも1つの論理式も充足することです（戸次 定義5.66）。論理式 φ が**恒真**（論理的に妥当）であるとは ⊨ φ のこと、すなわちすべての解釈のもとで真であることです。これらの意味論的概念は命題論理のトートロジーや含意の述語論理版であり、健全性定理と完全性定理によって証明論的概念（⊢）と結びつけられます。`,
    ],
  },
  formalNotation: `M = (D_M, F_M) \\\\
\\llbracket \\tau \\rrbracket_{M,g} \\in D_M \\\\
\\llbracket \\forall \\xi \\, \\varphi \\rrbracket_{M,g} = 1 \\;\\Longleftrightarrow\\; \\text{for all } a \\in D_M,\\; \\llbracket \\varphi \\rrbracket_{M,g[\\xi \\mapsto a]} = 1`,
  relatedEntryIds: [
    "concept-soundness",
    "concept-completeness",
    "concept-semantic-validity",
    "concept-lowenheim-skolem",
    "concept-compactness",
    "system-predicate",
    "notation-quantifiers",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Interpretation_(logic)",
      label: {
        en: "Interpretation (Wikipedia)",
        ja: "解釈 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E8%A7%A3%E9%87%88_(%E8%AB%96%E7%90%86%E5%AD%A6)",
      label: {
        en: "Interpretation (Wikipedia JA)",
        ja: "解釈 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Structure_(mathematical_logic)",
      label: {
        en: "Structure (Wikipedia)",
        ja: "構造 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/first-order+theory#semantics",
      label: {
        en: "First-order theory: semantics (nLab)",
        ja: "一階理論: 意味論 (nLab)",
      },
    },
  ],
  keywords: [
    "structure",
    "構造",
    "interpretation",
    "解釈",
    "domain",
    "領域",
    "assignment",
    "割り当て",
    "denotation",
    "指示対象",
    "satisfaction",
    "充足",
    "semantics",
    "意味論",
    "model",
    "モデル",
    "truth value",
    "真理値",
    "variable assignment",
    "変数割り当て",
    "predicate logic",
    "述語論理",
    "quantifier",
    "量化子",
    "semantic entailment",
    "意味論的含意",
  ],
  order: 17,
};

const conceptSemanticValidity: ReferenceEntry = {
  id: "concept-semantic-validity",
  category: "concept",
  title: {
    en: "Semantic Validity, Satisfiability, and Contradiction",
    ja: "意味論的妥当性・充足可能性・矛盾",
  },
  summary: {
    en: "A formula is valid (⊨ φ) if true under all interpretations, satisfiable if true under some, and a contradiction if true under none. These semantic notions are connected to provability (⊢) by soundness and completeness.",
    ja: "論理式が妥当（⊨ φ）であるとはすべての解釈で真、充足可能であるとはある解釈で真、矛盾であるとはどの解釈でも偽であること。これらの意味論的概念は健全性と完全性により証明可能性（⊢）と結びつく。",
  },
  body: {
    en: [
      `**Three fundamental semantic properties.** Every formula φ falls into exactly one of three mutually exclusive categories based on its behavior across all possible interpretations: (1) **Valid** (tautology): φ is true under every interpretation — written ⊨ φ. (2) **Satisfiable but not valid** (contingent): φ is true under some interpretations and false under others. (3) **Unsatisfiable** (contradiction): φ is false under every interpretation. A formula is **satisfiable** if it is true under at least one interpretation, i.e., either valid or contingent. These three categories partition the set of all formulas and provide the semantic classification used throughout mathematical logic (bekki Ch.5, Definition 5.66–5.67).`,
      `**Formal definitions.** Let (M, g) denote an interpretation (a structure M paired with a variable assignment g). A formula φ is **satisfied** by (M, g) — written (M, g) ⊨ φ — if ⟦φ⟧_{M,g} = 1. A formula is **valid** (written ⊨ φ) if for all interpretations (M, g), (M, g) ⊨ φ. A formula is **satisfiable** if there exists an interpretation (M, g) such that (M, g) ⊨ φ. A formula is **unsatisfiable** (a contradiction) if no interpretation satisfies it. For propositional logic, interpretations are truth-value assignments; for predicate logic, they include a domain D_M and interpretation function F_M (bekki Definitions 3.48, 5.66).`,
      `**Semantic entailment.** Beyond classifying individual formulas, the semantic turnstile ⊨ also captures entailment between sets of formulas: Γ ⊨ Δ means that every interpretation satisfying all formulas in Γ also satisfies at least one formula in Δ. Important special cases: Γ ⊨ φ (a single conclusion) means φ is a semantic consequence of Γ — i.e., φ is true whenever all formulas in Γ are true. When Γ = ∅, this reduces to ⊨ φ (validity). The relationship Γ ⊨ Δ is purely semantic: it makes no reference to any proof system (bekki Definition 5.66).`,
      `**Duality between validity and unsatisfiability.** A formula φ is valid (⊨ φ) if and only if ¬φ is unsatisfiable. Equivalently, φ is satisfiable if and only if ¬φ is not valid. This duality is fundamental: to show that a formula is valid, it suffices to show that its negation leads to a contradiction (refutation). Tableau methods and resolution exploit this duality directly by attempting to construct a satisfying interpretation for ¬φ; if no such interpretation exists, φ must be valid.`,
      `**Proof-theoretic derivability (⊢) vs. semantic validity (⊨).** The syntactic turnstile ⊢ denotes derivability within a formal proof system: Γ ⊢_K φ means "φ is derivable from Γ in system K" using only the axioms and inference rules of K. This is a purely mechanical, finitary notion — a derivation is a finite sequence of rule applications. In contrast, the semantic turnstile ⊨ quantifies over all (potentially uncountably many) interpretations. The key difference: ⊢ depends on the choice of proof system K; ⊨ depends only on the logical connectives' meaning. The soundness theorem (⊢ ⟹ ⊨) guarantees that provable formulas are valid, and the completeness theorem (⊨ ⟹ ⊢) guarantees that valid formulas are provable. Together: Γ ⊢_K Δ ⟺ Γ ⊨ Δ for classical first-order logic (bekki Theorems 13.10, 13.13).`,
      `**Propositional vs. predicate logic.** In propositional logic, validity is decidable: one can check all 2^n truth-value assignments for n variables. The truth table method provides a complete decision procedure. In predicate logic, however, validity is only semi-decidable (by Church's theorem, 1936): if φ is valid, a proof can eventually be found, but if φ is not valid, no algorithm can always detect this in finite time. This asymmetry makes the completeness theorem all the more remarkable — despite the undecidability of the general validity problem, every valid formula has a finite proof.`,
    ],
    ja: [
      `**3つの基本的な意味論的性質。** すべての論理式 φ は、可能なすべての解釈に対する振る舞いに基づいて、相互に排他的な3つのカテゴリのちょうど1つに分類されます: (1) **妥当**（恒真式）: φ がすべての解釈のもとで真 — ⊨ φ と書きます。(2) **充足可能だが妥当でない**（偶然的）: φ がある解釈では真、別の解釈では偽。(3) **充足不能**（矛盾）: φ がすべての解釈のもとで偽。論理式が**充足可能**であるとは、少なくとも1つの解釈のもとで真であること、すなわち妥当か偶然的かのどちらかです。これら3つのカテゴリはすべての論理式の集合を分割し、数理論理学全体で使用される意味論的分類を提供します（戸次 Ch.5, 定義5.66–5.67）。`,
      `**形式的定義。** (M, g) を解釈（構造 M と変数割り当て g の対）とします。論理式 φ が (M, g) に**充足される** — (M, g) ⊨ φ と書く — とは ⟦φ⟧_{M,g} = 1 のことです。論理式が**妥当**（⊨ φ と書く）であるとは、すべての解釈 (M, g) について (M, g) ⊨ φ が成り立つことです。論理式が**充足可能**であるとは、(M, g) ⊨ φ となる解釈 (M, g) が存在することです。論理式が**充足不能**（矛盾）であるとは、それを充足する解釈が存在しないことです。命題論理では解釈は真理値割当であり、述語論理では領域 D_M と解釈関数 F_M を含みます（戸次 定義3.48, 5.66）。`,
      `**意味論的含意。** 個々の論理式の分類を超えて、意味論的ターンスタイル ⊨ は論理式集合間の含意も捉えます: Γ ⊨ Δ とは、Γ のすべての論理式を充足するすべての解釈が Δ の少なくとも1つの論理式も充足することです。重要な特殊ケース: Γ ⊨ φ（結論が1つ）は φ が Γ の意味論的帰結であること — すなわち Γ のすべての論理式が真であるときは常に φ も真 — を意味します。Γ = ∅ のとき、これは ⊨ φ（妥当性）に帰着します。関係 Γ ⊨ Δ は純粋に意味論的であり、いかなる証明体系にも言及しません（戸次 定義5.66）。`,
      `**妥当性と充足不能性の双対性。** 論理式 φ が妥当（⊨ φ）であることと ¬φ が充足不能であることは同値です。同値的に、φ が充足可能であることと ¬φ が妥当でないことは同値です。この双対性は基本的です: 論理式が妥当であることを示すには、その否定が矛盾に導くこと（反駁）を示せば十分です。タブロー法や導出原理はこの双対性を直接利用し、¬φ を充足する解釈の構成を試みます; そのような解釈が存在しなければ、φ は妥当でなければなりません。`,
      `**証明論的導出可能性（⊢）と意味論的妥当性（⊨）。** 構文的ターンスタイル ⊢ は形式的証明体系内での導出可能性を表します: Γ ⊢_K φ は「K の公理と推論規則のみを用いて φ が Γ から導出可能」を意味します。これは純粋に機械的で有限的な概念です — 導出は規則適用の有限列です。対照的に、意味論的ターンスタイル ⊨ は（潜在的に非可算無限個の）すべての解釈にわたる量化です。主要な違い: ⊢ は証明体系 K の選択に依存し、⊨ は論理結合子の意味のみに依存します。健全性定理（⊢ ⟹ ⊨）は証明可能な論理式が妥当であることを保証し、完全性定理（⊨ ⟹ ⊢）は妥当な論理式が証明可能であることを保証します。合わせると: 古典一階論理では Γ ⊢_K Δ ⟺ Γ ⊨ Δ です（戸次 定理13.10, 13.13）。`,
      `**命題論理と述語論理。** 命題論理では、妥当性は決定可能です: n 個の変数に対する 2^n 通りの真理値割当をすべて検査できます。真理値表法が完全な決定手続きを提供します。しかし述語論理では、妥当性は半決定可能にすぎません（チャーチの定理, 1936年）: φ が妥当であれば証明はいずれ見つかりますが、φ が妥当でない場合、有限時間でそれを常に検出するアルゴリズムは存在しません。この非対称性は完全性定理をいっそう注目すべきものにします — 一般的な妥当性問題の決定不能性にもかかわらず、すべての妥当な論理式は有限の証明を持つのです。`,
    ],
  },
  formalNotation: `\\vDash \\varphi \\;\\Longleftrightarrow\\; \\text{for all } (M, g),\\; (M,g) \\vDash \\varphi \\\\
\\varphi \\text{ satisfiable} \\;\\Longleftrightarrow\\; \\exists (M,g),\\; (M,g) \\vDash \\varphi \\\\
\\varphi \\text{ unsatisfiable} \\;\\Longleftrightarrow\\; \\lnot(\\exists (M,g),\\; (M,g) \\vDash \\varphi)`,
  relatedEntryIds: [
    "concept-soundness",
    "concept-completeness",
    "concept-predicate-semantics",
    "concept-cut-elimination",
    "system-classical",
    "notation-connectives",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Validity_(logic)",
      label: {
        en: "Validity (Wikipedia)",
        ja: "妥当性 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E5%A6%A5%E5%BD%93%E6%80%A7",
      label: {
        en: "Validity (Wikipedia JA)",
        ja: "妥当性 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Satisfiability",
      label: {
        en: "Satisfiability (Wikipedia)",
        ja: "充足可能性 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E5%85%85%E8%B6%B3%E5%8F%AF%E8%83%BD%E6%80%A7",
      label: {
        en: "Satisfiability (Wikipedia JA)",
        ja: "充足可能性 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Logical_consequence",
      label: {
        en: "Logical consequence (Wikipedia)",
        ja: "論理的帰結 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/semantics",
      label: {
        en: "Semantics (nLab)",
        ja: "意味論 (nLab)",
      },
    },
  ],
  keywords: [
    "validity",
    "妥当性",
    "valid",
    "妥当",
    "tautology",
    "恒真式",
    "satisfiable",
    "充足可能",
    "satisfiability",
    "充足可能性",
    "unsatisfiable",
    "充足不能",
    "contradiction",
    "矛盾",
    "semantic entailment",
    "意味論的含意",
    "⊨",
    "⊢",
    "turnstile",
    "ターンスタイル",
    "contingent",
    "偶然的",
    "decidable",
    "決定可能",
    "semi-decidable",
    "半決定可能",
    "refutation",
    "反駁",
  ],
  order: 18,
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
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%83%9A%E3%82%A2%E3%83%8E%E3%81%AE%E5%85%AC%E7%90%86",
      label: {
        en: "Peano axioms (Wikipedia JA)",
        ja: "ペアノの公理 (Wikipedia)",
      },
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/PeanosAxioms.html",
      label: {
        en: "Peano's Axioms (MathWorld)",
        ja: "ペアノの公理 (MathWorld)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/Peano+arithmetic",
      label: {
        en: "Peano arithmetic (nLab)",
        ja: "ペアノ算術 (nLab)",
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
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E7%BE%A4%E8%AB%96",
      label: {
        en: "Group theory (Wikipedia JA)",
        ja: "群論 (Wikipedia)",
      },
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/Group.html",
      label: {
        en: "Group (MathWorld)",
        ja: "群 (MathWorld)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/group",
      label: {
        en: "Group (nLab)",
        ja: "群 (nLab)",
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
// 記法・記号 (Notation)
// ============================================================

const notationConnectives: ReferenceEntry = {
  id: "notation-connectives",
  category: "notation",
  title: {
    en: "Logical Connectives",
    ja: "論理結合子",
  },
  summary: {
    en: "→ (implication), ∧ (conjunction), ∨ (disjunction), ¬ (negation), ↔ (biconditional).",
    ja: "→（含意）、∧（連言）、∨（選言）、¬（否定）、↔（双条件）。",
  },
  body: {
    en: [
      "**Logical connectives** combine formulas to form compound statements. This application supports five connectives, listed from highest to lowest precedence:",
      "**¬ (Negation):** A unary prefix operator. ¬φ is true when φ is false. Written `~` or `not` in ASCII input. LaTeX: `\\lnot`.",
      "**∧ (Conjunction):** A binary infix operator, left-associative. φ ∧ ψ is true when both φ and ψ are true. Written `/\\` or `and` in ASCII input. LaTeX: `\\land`.",
      "**∨ (Disjunction):** A binary infix operator, left-associative. φ ∨ ψ is true when at least one of φ or ψ is true. Written `\\/` or `or` in ASCII input. LaTeX: `\\lor`.",
      "**→ (Implication):** A binary infix operator, right-associative. φ → ψ is false only when φ is true and ψ is false. Written `->` or `implies` in ASCII input. LaTeX: `\\to`.",
      "**↔ (Biconditional):** A binary infix operator, right-associative. φ ↔ ψ is true when φ and ψ have the same truth value. Written `<->` or `iff` in ASCII input. LaTeX: `\\leftrightarrow`.",
    ],
    ja: [
      "**論理結合子**は論理式を組み合わせて複合命題を形成します。本アプリケーションでは5つの結合子をサポートしており、優先順位の高い順に列挙します：",
      "**¬（否定）：** 単項前置演算子です。¬φはφが偽のとき真になります。ASCII入力では `~` または `not` と書きます。LaTeX: `\\lnot`。",
      "**∧（連言）：** 二項中置演算子で、左結合です。φ ∧ ψはφとψの両方が真のとき真になります。ASCII入力では `/\\` または `and` と書きます。LaTeX: `\\land`。",
      "**∨（選言）：** 二項中置演算子で、左結合です。φ ∨ ψはφとψの少なくとも一方が真のとき真になります。ASCII入力では `\\/` または `or` と書きます。LaTeX: `\\lor`。",
      "**→（含意）：** 二項中置演算子で、右結合です。φ → ψはφが真でψが偽のときのみ偽になります。ASCII入力では `->` または `implies` と書きます。LaTeX: `\\to`。",
      "**↔（双条件）：** 二項中置演算子で、右結合です。φ ↔ ψはφとψの真偽値が同じとき真になります。ASCII入力では `<->` または `iff` と書きます。LaTeX: `\\leftrightarrow`。",
    ],
  },
  formalNotation: "\\lnot, \\land, \\lor, \\to, \\leftrightarrow",
  relatedEntryIds: [
    "notation-precedence",
    "notation-input-methods",
    "axiom-a1",
    "axiom-a2",
    "axiom-a3",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Logical_connective",
      label: {
        en: "Logical connective (Wikipedia)",
        ja: "論理結合子 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E8%AB%96%E7%90%86%E7%B5%90%E5%90%88%E5%AD%90",
      label: {
        en: "Logical connective (Wikipedia JA)",
        ja: "論理結合子 (Wikipedia)",
      },
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/Connective.html",
      label: {
        en: "Connective (MathWorld)",
        ja: "結合子 (MathWorld)",
      },
    },
  ],
  keywords: [
    "connective",
    "結合子",
    "negation",
    "否定",
    "conjunction",
    "連言",
    "disjunction",
    "選言",
    "implication",
    "含意",
    "biconditional",
    "双条件",
    "→",
    "∧",
    "∨",
    "¬",
    "↔",
  ],
  order: 1,
};

const notationQuantifiers: ReferenceEntry = {
  id: "notation-quantifiers",
  category: "notation",
  title: {
    en: "Quantifiers",
    ja: "量化子",
  },
  summary: {
    en: "∀ (universal quantifier) and ∃ (existential quantifier) for predicate logic.",
    ja: "∀（全称量化子）と∃（存在量化子）、述語論理における量化。",
  },
  body: {
    en: [
      "**Quantifiers** bind variables and specify the scope over which a formula holds. They are essential for predicate logic (first-order logic).",
      "**∀ (Universal quantifier):** ∀x.φ asserts that φ holds for all values of x. Written `all x.` or `forall x.` in ASCII input. The dot (`.`) separates the bound variable from the formula scope. LaTeX: `\\forall`.",
      "**∃ (Existential quantifier):** ∃x.φ asserts that there exists at least one value of x for which φ holds. Written `ex x.` or `exists x.` in ASCII input. LaTeX: `\\exists`.",
      "Quantifiers bind tighter than all connectives: ∀x.φ → ψ is parsed as (∀x.φ) → ψ, not ∀x.(φ → ψ). Use parentheses to change grouping when needed.",
    ],
    ja: [
      "**量化子**は変数を束縛し、論理式が成り立つ範囲を指定します。述語論理（一階論理）において不可欠です。",
      "**∀（全称量化子）：** ∀x.φはxのすべての値に対してφが成り立つことを主張します。ASCII入力では `all x.` または `forall x.` と書きます。ドット（`.`）が束縛変数と論理式のスコープを分離します。LaTeX: `\\forall`。",
      "**∃（存在量化子）：** ∃x.φはφが成り立つようなxの値が少なくとも1つ存在することを主張します。ASCII入力では `ex x.` または `exists x.` と書きます。LaTeX: `\\exists`。",
      "量化子はすべての結合子よりも強く束縛します：∀x.φ → ψは(∀x.φ) → ψと解析され、∀x.(φ → ψ)ではありません。グルーピングを変更するには括弧を使用してください。",
    ],
  },
  formalNotation: "\\forall x.\\varphi, \\quad \\exists x.\\varphi",
  relatedEntryIds: ["notation-connectives", "axiom-a4", "axiom-a5", "rule-gen"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Quantifier_(logic)",
      label: {
        en: "Quantifier (Wikipedia)",
        ja: "量化子 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E9%87%8F%E5%8C%96%E5%AD%90",
      label: {
        en: "Quantifier (Wikipedia JA)",
        ja: "量化子 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/quantifier",
      label: {
        en: "Quantifier (nLab)",
        ja: "量化子 (nLab)",
      },
    },
  ],
  keywords: [
    "quantifier",
    "量化子",
    "universal",
    "全称",
    "existential",
    "存在",
    "∀",
    "∃",
    "forall",
    "exists",
    "bound variable",
    "束縛変数",
  ],
  order: 2,
};

const notationEquality: ReferenceEntry = {
  id: "notation-equality",
  category: "notation",
  title: {
    en: "Equality",
    ja: "等号",
  },
  summary: {
    en: "t₁ = t₂ — equality between terms, governed by equality axioms E1–E5.",
    ja: "t₁ = t₂ — 項間の等号、等号公理E1–E5により規定。",
  },
  body: {
    en: [
      "**Equality** (=) is a binary predicate on terms that forms an atomic formula. The expression t₁ = t₂ states that the terms t₁ and t₂ denote the same object.",
      "Equality is governed by the equality axioms: E1 (reflexivity: x = x), E2 (symmetry), E3 (transitivity), E4 (function congruence), and E5 (predicate congruence). These axioms ensure that = behaves as a proper equivalence relation compatible with all operations.",
      "In this application, equality formulas are written as `t1 = t2` where t1 and t2 are terms. Equality is available when the logic system includes equality axioms (e.g., predicate logic with equality).",
    ],
    ja: [
      "**等号**（=）は項に対する二項述語で、原子論理式を形成します。式 t₁ = t₂ は項t₁とt₂が同じ対象を表すことを述べます。",
      "等号は等号公理により規定されます：E1（反射律: x = x）、E2（対称律）、E3（推移律）、E4（関数合同律）、E5（述語合同律）。これらの公理により、=はすべての演算と互換な適切な同値関係として振る舞います。",
      "本アプリケーションでは、等号論理式は `t1 = t2` のように書きます（t1, t2は項）。論理体系に等号公理が含まれている場合（述語論理+等号など）に利用可能です。",
    ],
  },
  formalNotation: "t_1 = t_2",
  relatedEntryIds: ["axiom-e1", "axiom-e2", "axiom-e3", "axiom-e4", "axiom-e5"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/First-order_logic#Equality_and_its_axioms",
      label: {
        en: "Equality in first-order logic (Wikipedia)",
        ja: "一階論理における等号 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E7%AD%89%E5%8F%B7",
      label: {
        en: "Equality sign (Wikipedia JA)",
        ja: "等号 (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/equality",
      label: {
        en: "Equality (nLab)",
        ja: "等号 (nLab)",
      },
    },
  ],
  keywords: [
    "equality",
    "等号",
    "=",
    "reflexivity",
    "反射律",
    "symmetry",
    "対称律",
    "transitivity",
    "推移律",
  ],
  order: 3,
};

const notationMetavariables: ReferenceEntry = {
  id: "notation-metavariables",
  category: "notation",
  title: {
    en: "Metavariables",
    ja: "メタ変数",
  },
  summary: {
    en: "Greek letters (φ, ψ, χ, ...) as placeholders for arbitrary formulas in axiom schemas.",
    ja: "ギリシャ文字（φ, ψ, χ, ...）を公理スキーマ内の任意の論理式のプレースホルダーとして使用。",
  },
  body: {
    en: [
      "**Metavariables** are placeholders that stand for arbitrary formulas. In axiom schemas like A1: φ → (ψ → φ), the symbols φ and ψ are metavariables that can be replaced with any well-formed formula.",
      "This application uses 22 Greek letters as metavariables: α, β, γ, δ, ε, ζ, η, θ, ι, κ, λ, μ, ν, ξ, π, ρ, σ, τ, υ, φ, χ, ψ, ω. The letter omicron (ο) is excluded to avoid confusion with the Latin letter 'o'.",
      "Metavariables support optional subscript digits for disambiguation. For example, φ₁, φ₂, φ₀₁ are all distinct metavariables. Subscripts are treated as strings, so φ₁, φ₀₁, and φ₀₀₁ are three different variables.",
      "In ASCII input, Greek letters are typed by name (e.g., `phi`, `psi`, `chi`). Subscripts are appended directly: `phi1`, `phi01`, or with underscore: `phi_1`, `phi_01`. In Unicode output, subscripts use dedicated Unicode subscript digits (₀–₉).",
    ],
    ja: [
      "**メタ変数**は任意の論理式を表すプレースホルダーです。公理スキーマ A1: φ → (ψ → φ) において、φやψは任意の整形式論理式に置き換えることができるメタ変数です。",
      "本アプリケーションでは22のギリシャ文字をメタ変数として使用します：α, β, γ, δ, ε, ζ, η, θ, ι, κ, λ, μ, ν, ξ, π, ρ, σ, τ, υ, φ, χ, ψ, ω。オミクロン(ο)はラテン文字の'o'との混同を避けるため除外されています。",
      "メタ変数は曖昧さ回避のためにオプションの添字数字をサポートします。例えば、φ₁, φ₂, φ₀₁はすべて異なるメタ変数です。添字は文字列として扱われるため、φ₁, φ₀₁, φ₀₀₁は3つの異なる変数です。",
      "ASCII入力ではギリシャ文字は名前で入力します（例：`phi`, `psi`, `chi`）。添字は直接追加：`phi1`, `phi01`、またはアンダースコア付き：`phi_1`, `phi_01`。Unicode出力では添字に専用のUnicode下付き数字（₀–₉）を使用します。",
    ],
  },
  relatedEntryIds: [
    "notation-connectives",
    "notation-input-methods",
    "axiom-a1",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Metavariable",
      label: {
        en: "Metavariable (Wikipedia)",
        ja: "メタ変数 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Axiom_schema",
      label: {
        en: "Axiom schema (Wikipedia)",
        ja: "公理スキーマ (Wikipedia)",
      },
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/metavariable",
      label: {
        en: "Metavariable (nLab)",
        ja: "メタ変数 (nLab)",
      },
    },
  ],
  keywords: [
    "metavariable",
    "メタ変数",
    "Greek letter",
    "ギリシャ文字",
    "φ",
    "ψ",
    "χ",
    "phi",
    "psi",
    "chi",
    "subscript",
    "添字",
    "placeholder",
    "プレースホルダー",
  ],
  order: 4,
};

const notationTermOperations: ReferenceEntry = {
  id: "notation-term-operations",
  category: "notation",
  title: {
    en: "Term Operations",
    ja: "項演算",
  },
  summary: {
    en: "Binary operations on terms: + (addition), − (subtraction), × (multiplication), ÷ (division), ^ (power).",
    ja: "項に対する二項演算：+（加法）、−（減法）、×（乗法）、÷（除法）、^（冪乗）。",
  },
  body: {
    en: [
      "**Term operations** are binary infix operators on terms, used primarily in theories like Peano Arithmetic and Group Theory.",
      "Five operations are supported, listed from highest to lowest precedence: **^** (power, right-associative), **×** (multiplication, left-associative) and **÷** (division, left-associative) at the same level, **+** (addition, left-associative) and **−** (subtraction, left-associative) at the same level.",
      "In ASCII input: `+` for addition, `-` for subtraction, `*` for multiplication, `/` for division, `^` for power. In Unicode output: + is kept as-is, − uses U+2212 (minus sign), × uses U+00D7, ÷ uses U+00F7.",
      "Terms also include variables (lowercase identifiers like x, y, z), constants (digits like 0, 1), and function applications (like f(x), g(x, y)). Term metavariables use Greek letters (τ, σ, etc.) analogous to formula metavariables.",
    ],
    ja: [
      "**項演算**は項に対する二項中置演算子で、主にペアノ算術や群論などの理論で使用されます。",
      "5つの演算をサポートしており、優先順位の高い順に：**^**（冪乗、右結合）、**×**（乗法、左結合）と**÷**（除法、左結合）が同レベル、**+**（加法、左結合）と**−**（減法、左結合）が同レベルです。",
      "ASCII入力では：`+`で加法、`-`で減法、`*`で乗法、`/`で除法、`^`で冪乗。Unicode出力では：+はそのまま、−はU+2212（マイナス記号）、×はU+00D7、÷はU+00F7を使用します。",
      "項には変数（x, y, zなどの小文字識別子）、定数（0, 1などの数字）、関数適用（f(x), g(x, y)など）も含まれます。項メタ変数は論理式メタ変数と同様にギリシャ文字（τ, σなど）を使用します。",
    ],
  },
  formalNotation: "+, -, \\times, \\div, \\hat{}",
  relatedEntryIds: [
    "notation-precedence",
    "notation-equality",
    "theory-peano",
    "theory-group",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Term_(logic)",
      label: {
        en: "Term (logic) (Wikipedia)",
        ja: "項 (論理学) (Wikipedia)",
      },
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E9%A0%85_(%E6%95%B0%E7%90%86%E8%AB%96%E7%90%86%E5%AD%A6)",
      label: {
        en: "Term (mathematical logic) (Wikipedia JA)",
        ja: "項 (数理論理学) (Wikipedia)",
      },
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/Term.html",
      label: {
        en: "Term (MathWorld)",
        ja: "項 (MathWorld)",
      },
    },
  ],
  keywords: [
    "term",
    "項",
    "operation",
    "演算",
    "addition",
    "加法",
    "+",
    "multiplication",
    "乗法",
    "×",
    "power",
    "冪乗",
    "^",
    "function",
    "関数",
    "variable",
    "変数",
    "constant",
    "定数",
  ],
  order: 5,
};

const notationPrecedence: ReferenceEntry = {
  id: "notation-precedence",
  category: "notation",
  title: {
    en: "Operator Precedence and Associativity",
    ja: "演算子の優先順位と結合性",
  },
  summary: {
    en: "Binding strength and associativity rules that determine how expressions are parsed.",
    ja: "式の解析方法を決定する束縛の強さと結合性の規則。",
  },
  body: {
    en: [
      "**Operator precedence** determines the order in which operators bind their operands when parentheses are omitted. Higher precedence means tighter binding. The associativity of an operator determines grouping when operators of equal precedence are chained.",
      "**Formula connective precedence** (highest to lowest): ¬ (prefix, strongest) > ∧ (left-associative) > ∨ (left-associative) > → (right-associative) > ↔ (right-associative, weakest). Example: ¬φ ∧ ψ → χ is parsed as (((¬φ) ∧ ψ) → χ).",
      "**Term operation precedence** (highest to lowest): ^ (right-associative, strongest) > ×, ÷ (left-associative) > +, − (left-associative, weakest). Example: a + b × c ^ d is parsed as (a + (b × (c ^ d))).",
      "**Quantifiers** bind tighter than connectives: ∀x.φ → ψ is (∀x.φ) → ψ. Use explicit parentheses for ∀x.(φ → ψ). The Pratt parsing algorithm used internally assigns binding powers to achieve minimal parenthesization in output.",
    ],
    ja: [
      "**演算子の優先順位**は、括弧が省略された場合に演算子がオペランドを束縛する順序を決定します。優先順位が高いほど強く束縛します。**結合性**は、同じ優先順位の演算子が連鎖した場合のグルーピングを決定します。",
      "**論理式の結合子の優先順位**（高→低）：¬（前置、最強）> ∧（左結合）> ∨（左結合）> →（右結合）> ↔（右結合、最弱）。例：¬φ ∧ ψ → χ は (((¬φ) ∧ ψ) → χ) と解析されます。",
      "**項演算の優先順位**（高→低）：^（右結合、最強）> ×, ÷（左結合）> +, −（左結合、最弱）。例：a + b × c ^ d は (a + (b × (c ^ d))) と解析されます。",
      "**量化子**は結合子より強く束縛します：∀x.φ → ψ は (∀x.φ) → ψ です。∀x.(φ → ψ) とするには明示的な括弧を使用します。内部で使用されるPratt解析アルゴリズムは出力における最小括弧化を実現するために束縛力を割り当てます。",
    ],
  },
  relatedEntryIds: [
    "notation-connectives",
    "notation-quantifiers",
    "notation-term-operations",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Order_of_operations",
      label: {
        en: "Order of operations (Wikipedia)",
        ja: "演算の順序 (Wikipedia)",
      },
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Pratt_parser",
      label: {
        en: "Pratt parser (Wikipedia)",
        ja: "Prattパーサー (Wikipedia)",
      },
    },
  ],
  keywords: [
    "precedence",
    "優先順位",
    "associativity",
    "結合性",
    "binding power",
    "束縛力",
    "Pratt parser",
    "parentheses",
    "括弧",
    "order of operations",
    "演算の順序",
  ],
  order: 6,
};

const notationInputMethods: ReferenceEntry = {
  id: "notation-input-methods",
  category: "notation",
  title: {
    en: "Input Methods",
    ja: "入力方法",
  },
  summary: {
    en: "How to type logical symbols using ASCII shortcuts that are converted to Unicode.",
    ja: "ASCII短縮表記からUnicodeへの変換による論理記号の入力方法。",
  },
  body: {
    en: [
      "**Input methods** allow typing logical symbols using standard ASCII characters. The application converts ASCII input to proper Unicode symbols for display.",
      "**Connective input:** `->` or `implies` → →, `/\\` or `and` → ∧, `\\/` or `or` → ∨, `~` or `not` → ¬, `<->` or `iff` → ↔. The completion system also suggests symbols as you type.",
      "**Quantifier input:** `all x.` or `forall x.` → ∀x., `ex x.` or `exists x.` → ∃x. The dot (`.`) is required to delimit the quantifier scope.",
      "**Greek letter input:** Type the letter name to input a Greek letter: `phi` → φ, `psi` → ψ, `chi` → χ, `alpha` → α, etc. Subscripts are appended: `phi1` → φ₁, `phi_01` → φ₀₁. The tab-completion popup shows available completions.",
      "**Term input:** Variables are lowercase identifiers (x, y, z), predicates start with uppercase (P, Q), constants are digits (0, 1). Functions use parenthesized arguments: f(x), g(x, y).",
    ],
    ja: [
      "**入力方法**により、標準的なASCII文字を使って論理記号を入力できます。アプリケーションはASCII入力を適切なUnicode記号に変換して表示します。",
      "**結合子の入力：** `->` または `implies` → →、`/\\` または `and` → ∧、`\\/` または `or` → ∨、`~` または `not` → ¬、`<->` または `iff` → ↔。補完システムが入力中に記号を提案します。",
      "**量化子の入力：** `all x.` または `forall x.` → ∀x.、`ex x.` または `exists x.` → ∃x.。ドット（`.`）は量化子のスコープを区切るために必須です。",
      "**ギリシャ文字の入力：** 文字名を入力してギリシャ文字を入力します：`phi` → φ、`psi` → ψ、`chi` → χ、`alpha` → α、など。添字は追加します：`phi1` → φ₁、`phi_01` → φ₀₁。タブ補完ポップアップが利用可能な補完を表示します。",
      "**項の入力：** 変数は小文字識別子（x, y, z）、述語は大文字開始（P, Q）、定数は数字（0, 1）です。関数は括弧付き引数を使用します：f(x), g(x, y)。",
    ],
  },
  relatedEntryIds: [
    "notation-connectives",
    "notation-quantifiers",
    "notation-metavariables",
  ],
  externalLinks: [],
  keywords: [
    "input",
    "入力",
    "ASCII",
    "Unicode",
    "completion",
    "補完",
    "shortcut",
    "ショートカット",
    "input method",
    "入力方法",
    "tab completion",
    "タブ補完",
  ],
  order: 7,
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
  axiomE4,
  axiomE5,
  // Inference Rules
  ruleMP,
  ruleGen,
  ruleNdOverview,
  ruleNdImplication,
  ruleNdConjunction,
  ruleNdDisjunction,
  ruleScOverview,
  ruleScStructural,
  ruleScLogical,
  // Logic Systems
  systemLukasiewicz,
  systemMendelson,
  systemMinimal,
  systemIntuitionistic,
  systemClassical,
  systemPredicateLogic,
  // Notation
  notationConnectives,
  notationQuantifiers,
  notationEquality,
  notationMetavariables,
  notationTermOperations,
  notationPrecedence,
  notationInputMethods,
  // Concepts
  conceptSubstitution,
  conceptFreeVariable,
  conceptUnification,
  conceptDeductionTheorem,
  conceptGlivenko,
  conceptKurodaTranslation,
  conceptSystemEquivalence,
  conceptSoundness,
  conceptCompleteness,
  conceptLowenheimSkolem,
  conceptCompactness,
  conceptProofTheoreticSemantics,
  conceptCutElimination,
  conceptCurryHoward,
  conceptAdmissibleDerivable,
  conceptContextSharingIndependence,
  conceptPredicateSemantics,
  conceptSemanticValidity,
  // Theories
  theoryPeanoArithmetic,
  theoryGroupTheory,
] as const;
