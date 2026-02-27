/**
 * 推論規則モジュール。
 *
 * Hilbert系の推論規則・公理スキーマ・体系設定を定義し、
 * 規則適用の検証関数を提供する。
 *
 * @see dev/logic-reference/02-propositional-logic.md
 * @see dev/logic-reference/03-predicate-logic.md
 * @see dev/logic-reference/05-equality-logic.md
 * @see dev/logic-reference/07-axiom-systems-survey.md
 */

import {
  type Formula,
  implication,
  negation,
  metaVariable,
  universal,
  existential,
  disjunction,
  equality,
} from "./formula";
import {
  type Term,
  TermVariable,
  termVariable,
  constant,
  functionApplication,
  binaryOperation,
} from "./term";
import { equalFormula, equalTerm } from "./equality";
import { metaVariableKey, termMetaVariableKey } from "./metaVariable";
import {
  substituteFormulaMetaVariables,
  substituteTermMetaVariablesInFormula,
  substituteTermVariableInFormula,
  isFreeFor,
  type FormulaSubstitutionMap,
  type TermMetaSubstitutionMap,
} from "./substitution";
import { freeVariablesInFormula } from "./freeVariables";

// ── 公理スキーマ定義 ──────────────────────────────────────

/**
 * 命題論理の公理スキーマID。
 *
 * - A1 (K公理): φ → (ψ → φ) — 全体系共通
 * - A2 (S公理): (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ)) — 全体系共通
 * - A3 (対偶): (¬φ → ¬ψ) → (ψ → φ) — Łukasiewicz体系
 * - M3 (背理法): (¬φ → ¬ψ) → ((¬φ → ψ) → φ) — Mendelson体系
 * - EFQ (爆発): ¬φ → (φ → ψ) — 直観主義論理
 * - DNE (二重否定除去): ¬¬φ → φ — 古典論理(HK)
 *
 * 新しい命題論理公理を追加する場合:
 *   1. ここに ID を追加
 *   2. テンプレートを追加 (axiomXXTemplate)
 *   3. getPropositionalAxiomTemplate の switch に追加
 *   4. axiomNameLogic.ts の axiomDisplayNames に追加
 *   5. axiomPaletteLogic.ts の propositionalAxiomMetas に追加
 *   6. notebookSerialization.ts の VALID_AXIOM_IDS に追加
 */
export type PropositionalAxiomId = "A1" | "A2" | "A3" | "M3" | "EFQ" | "DNE";

/**
 * 述語論理の追加公理スキーマID。
 */
export type PredicateAxiomId = "A4" | "A5";

/**
 * 等号公理スキーマID。
 */
export type EqualityAxiomId = "E1" | "E2" | "E3" | "E4" | "E5";

/**
 * すべての公理スキーマID。
 */
export type AxiomId = PropositionalAxiomId | PredicateAxiomId | EqualityAxiomId;

// ── 公理スキーマのテンプレート ─────────────────────────────

// メタ変数ヘルパー（内部使用）
const phi = metaVariable("φ");
const psi = metaVariable("ψ");
const chi = metaVariable("χ");
const xVar = termVariable("x");
const yVar = termVariable("y");
const zVar = termVariable("z");

/**
 * A1: K公理 φ → (ψ → φ)
 */
export const axiomA1Template: Formula = implication(phi, implication(psi, phi));

/**
 * A2: S公理 (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))
 */
export const axiomA2Template: Formula = implication(
  implication(phi, implication(psi, chi)),
  implication(implication(phi, psi), implication(phi, chi)),
);

/**
 * A3: 対偶公理 (¬φ → ¬ψ) → (ψ → φ)
 * Łukasiewicz体系で使用
 */
export const axiomA3Template: Formula = implication(
  implication(negation(phi), negation(psi)),
  implication(psi, phi),
);

/**
 * M3: 背理法 (¬φ → ¬ψ) → ((¬φ → ψ) → φ)
 * Mendelson体系で使用
 * @see dev/logic-reference/07-axiom-systems-survey.md §3.2
 */
export const axiomM3Template: Formula = implication(
  implication(negation(phi), negation(psi)),
  implication(implication(negation(phi), psi), phi),
);

/**
 * EFQ: 爆発原理 (Ex Falso Quodlibet) ¬φ → (φ → ψ)
 * 直観主義論理(HJ)で使用。矛盾から任意の命題が導かれる。
 * ¬をプリミティブとして持つ体系での表現。⊥ベースでは ⊥ → φ に相当。
 * @see dev/logic-reference/07-axiom-systems-survey.md §4.4
 */
export const axiomEFQTemplate: Formula = implication(
  negation(phi),
  implication(phi, psi),
);

/**
 * DNE: 二重否定除去 (Double Negation Elimination) ¬¬φ → φ
 * 古典論理(HK)で使用。最小論理(HM) + DNE = HK。
 * 戸次大介『数理論理学』定義7.21, §7.8 参照。
 * @see dev/logic-reference/07-axiom-systems-survey.md
 */
export const axiomDNETemplate: Formula = implication(
  negation(negation(phi)),
  phi,
);

/**
 * E1: 反射律 ∀x. x = x
 */
export const axiomE1Template: Formula = universal(xVar, equality(xVar, xVar));

/**
 * E2: 対称律 ∀x.∀y. x = y → y = x
 */
export const axiomE2Template: Formula = universal(
  xVar,
  universal(yVar, implication(equality(xVar, yVar), equality(yVar, xVar))),
);

/**
 * E3: 推移律 ∀x.∀y.∀z. x = y → (y = z → x = z)
 */
export const axiomE3Template: Formula = universal(
  xVar,
  universal(
    yVar,
    universal(
      zVar,
      implication(
        equality(xVar, yVar),
        implication(equality(yVar, zVar), equality(xVar, zVar)),
      ),
    ),
  ),
);

// E4, E5 はシグネチャ依存（関数記号・述語記号ごとに生成）のため、テンプレートではなく
// 検証関数内で動的に処理する。

// ── 理論公理（非論理的公理） ──────────────────────────────

/**
 * 理論公理（非論理的公理）。
 *
 * 論理体系の上に乗る、特定の理論（ペアノ算術、群論など）の公理。
 * パターンマッチングで使用されるテンプレートと、表示用メタデータを保持する。
 *
 * matchMode:
 * - "pattern": テンプレートをパターンとして一方向マッチング（メタ変数を含むスキーマ）
 * - "exact": 完全一致（メタ変数を含まない固定公理）
 */
export type TheoryAxiom = {
  /** 公理ID（表示・識別用。例: "PA1", "PA2"） */
  readonly id: string;
  /** 公理の表示名（例: "PA1 (0≠後者)"） */
  readonly displayName: string;
  /** 公理テンプレートの論理式 */
  readonly template: Formula;
  /** DSLテキスト（パレット表示・エディタ用） */
  readonly dslText: string;
  /** マッチングモード */
  readonly matchMode: "pattern" | "exact";
};

// ── ペアノ算術の公理テンプレート ─────────────────────────

// ヘルパー: ペアノ算術の定数・関数
const zero = constant("0");
const succOfX = functionApplication("S", [xVar]);
const succOfY = functionApplication("S", [yVar]);

/**
 * PA1: ∀x. ¬(S(x) = 0)
 * 0は後者関数の値域にない。
 */
export const axiomPA1Template: Formula = universal(
  xVar,
  negation(equality(succOfX, zero)),
);

/**
 * PA2: ∀x.∀y. S(x) = S(y) → x = y
 * 後者関数は単射。
 */
export const axiomPA2Template: Formula = universal(
  xVar,
  universal(
    yVar,
    implication(equality(succOfX, succOfY), equality(xVar, yVar)),
  ),
);

/**
 * PA3: ∀x. x + 0 = x
 * 加法の基底。
 */
export const axiomPA3Template: Formula = universal(
  xVar,
  equality(binaryOperation("+", xVar, zero), xVar),
);

/**
 * PA4: ∀x.∀y. x + S(y) = S(x + y)
 * 加法の再帰定義。
 */
export const axiomPA4Template: Formula = universal(
  xVar,
  universal(
    yVar,
    equality(
      binaryOperation("+", xVar, succOfY),
      functionApplication("S", [binaryOperation("+", xVar, yVar)]),
    ),
  ),
);

/**
 * PA5: ∀x. x * 0 = 0
 * 乗法の基底。
 */
export const axiomPA5Template: Formula = universal(
  xVar,
  equality(binaryOperation("*", xVar, zero), zero),
);

/**
 * PA6: ∀x.∀y. x * S(y) = x * y + x
 * 乗法の再帰定義。
 */
export const axiomPA6Template: Formula = universal(
  xVar,
  universal(
    yVar,
    equality(
      binaryOperation("*", xVar, succOfY),
      binaryOperation("+", binaryOperation("*", xVar, yVar), xVar),
    ),
  ),
);

/**
 * PA7: 帰納法スキーマ
 * φ[0/x] → (∀x.(φ → φ[S(x)/x])) → ∀x.φ
 *
 * これはメタ変数φを含むスキーマ。任意の論理式φに対して成立する。
 * matchMode: "pattern" でパターンマッチングにより検証する。
 *
 * テンプレートでは:
 * - φ はメタ変数 (matchFormulaPattern で自由にバインド)
 * - x は項変数 (テンプレート内で固定)
 *
 * 注意: このテンプレートのマッチングは matchFormulaPattern だけでは不十分。
 * φ[0/x] と φ[S(x)/x] が正しい代入結果であることの検証が必要。
 * → matchTheoryAxiomPA7 で専用ロジックを実装。
 */
export const axiomPA7Template: Formula = implication(
  metaVariable("φ"), // placeholder: 実際は φ[0/x]
  implication(
    universal(xVar, implication(metaVariable("φ"), metaVariable("φ"))),
    universal(xVar, metaVariable("φ")),
  ),
);
// PA7 は構造的パターンマッチだけでは表現できないため、
// 専用の matchTheoryAxiomPA7 関数で検証する。

/**
 * Q7: ∀x.(x = 0 ∨ ∃y.(x = S(y)))
 * Robinson算術(Q)の追加公理。すべての自然数は0か、何かの後者。
 * 帰納法(PA7)の代替として、数列の全体像を保証する。
 */
export const axiomQ7Template: Formula = universal(
  xVar,
  disjunction(equality(xVar, zero), existential(yVar, equality(xVar, succOfY))),
);

// ── ペアノ算術の理論公理定義 ────────────────────────────

/**
 * ペアノ算術の固定公理（PA1-PA6）。
 * これらはメタ変数を含まない固定テンプレート。exact マッチで検証。
 */
export const peanoFixedAxioms: readonly TheoryAxiom[] = [
  {
    id: "PA1",
    displayName: "PA1 (0≠後者)",
    template: axiomPA1Template,
    dslText: "all x. ~(S(x) = 0)",
    matchMode: "exact",
  },
  {
    id: "PA2",
    displayName: "PA2 (Sの単射性)",
    template: axiomPA2Template,
    dslText: "all x. all y. S(x) = S(y) -> x = y",
    matchMode: "exact",
  },
  {
    id: "PA3",
    displayName: "PA3 (加法基底)",
    template: axiomPA3Template,
    dslText: "all x. x + 0 = x",
    matchMode: "exact",
  },
  {
    id: "PA4",
    displayName: "PA4 (加法再帰)",
    template: axiomPA4Template,
    dslText: "all x. all y. x + S(y) = S(x + y)",
    matchMode: "exact",
  },
  {
    id: "PA5",
    displayName: "PA5 (乗法基底)",
    template: axiomPA5Template,
    dslText: "all x. x * 0 = 0",
    matchMode: "exact",
  },
  {
    id: "PA6",
    displayName: "PA6 (乗法再帰)",
    template: axiomPA6Template,
    dslText: "all x. all y. x * S(y) = x * y + x",
    matchMode: "exact",
  },
];

/**
 * Robinson算術(Q)の公理: PA1-PA6 + Q7。
 * PA7(帰納法スキーマ)を含まない代わりに、Q7で自然数の全体像を保証。
 */
export const robinsonAxioms: readonly TheoryAxiom[] = [
  ...peanoFixedAxioms,
  {
    id: "Q7",
    displayName: "Q7 (後者の全射性)",
    template: axiomQ7Template,
    dslText: "all x. x = 0 | ex y. x = S(y)",
    matchMode: "exact",
  },
];

// ── 群論の公理テンプレート ─────────────────────────────────

// ヘルパー: 群論の定数・演算
/** 群の単位元 e */
const groupIdentity = constant("e");
/** 群の逆元関数 i(x) */
const inverseOfX = functionApplication("i", [xVar]);

/**
 * G1: ∀x.∀y.∀z. (x * y) * z = x * (y * z)
 * 結合律。群の最も基本的な性質。
 */
export const axiomG1Template: Formula = universal(
  xVar,
  universal(
    yVar,
    universal(
      zVar,
      equality(
        binaryOperation("*", binaryOperation("*", xVar, yVar), zVar),
        binaryOperation("*", xVar, binaryOperation("*", yVar, zVar)),
      ),
    ),
  ),
);

/**
 * G2L: ∀x. e * x = x
 * 左単位元。
 */
export const axiomG2LTemplate: Formula = universal(
  xVar,
  equality(binaryOperation("*", groupIdentity, xVar), xVar),
);

/**
 * G2R: ∀x. x * e = x
 * 右単位元。
 */
export const axiomG2RTemplate: Formula = universal(
  xVar,
  equality(binaryOperation("*", xVar, groupIdentity), xVar),
);

/**
 * G3L: ∀x. i(x) * x = e
 * 左逆元。逆元関数 i を使って表現。
 */
export const axiomG3LTemplate: Formula = universal(
  xVar,
  equality(binaryOperation("*", inverseOfX, xVar), groupIdentity),
);

/**
 * G3R: ∀x. x * i(x) = e
 * 右逆元。
 */
export const axiomG3RTemplate: Formula = universal(
  xVar,
  equality(binaryOperation("*", xVar, inverseOfX), groupIdentity),
);

/**
 * G4: ∀x.∀y. x * y = y * x
 * 可換律。アーベル群の追加公理。
 */
export const axiomG4CommTemplate: Formula = universal(
  xVar,
  universal(
    yVar,
    equality(
      binaryOperation("*", xVar, yVar),
      binaryOperation("*", yVar, xVar),
    ),
  ),
);

// ── 群論の理論公理定義 ────────────────────────────────────

/**
 * 群論の左公理系: G1(結合律) + G2L(左単位元) + G3L(左逆元)。
 * 数学的に最小限の群の公理化。右単位元・右逆元は定理として導出可能。
 */
export const groupLeftAxioms: readonly TheoryAxiom[] = [
  {
    id: "G1",
    displayName: "G1 (結合律)",
    template: axiomG1Template,
    dslText: "all x. all y. all z. (x * y) * z = x * (y * z)",
    matchMode: "exact",
  },
  {
    id: "G2L",
    displayName: "G2L (左単位元)",
    template: axiomG2LTemplate,
    dslText: "all x. e * x = x",
    matchMode: "exact",
  },
  {
    id: "G3L",
    displayName: "G3L (左逆元)",
    template: axiomG3LTemplate,
    dslText: "all x. i(x) * x = e",
    matchMode: "exact",
  },
];

/**
 * 群論の両側公理系: 結合律 + 左右単位元 + 左右逆元。
 * 冗長だが直感的な公理化。初学者向け。
 */
export const groupFullAxioms: readonly TheoryAxiom[] = [
  ...groupLeftAxioms,
  {
    id: "G2R",
    displayName: "G2R (右単位元)",
    template: axiomG2RTemplate,
    dslText: "all x. x * e = x",
    matchMode: "exact",
  },
  {
    id: "G3R",
    displayName: "G3R (右逆元)",
    template: axiomG3RTemplate,
    dslText: "all x. x * i(x) = e",
    matchMode: "exact",
  },
];

/**
 * アーベル群の公理: 両側群公理 + 可換律。
 */
export const abelianGroupAxioms: readonly TheoryAxiom[] = [
  ...groupFullAxioms,
  {
    id: "G4",
    displayName: "G4 (可換律)",
    template: axiomG4CommTemplate,
    dslText: "all x. all y. x * y = y * x",
    matchMode: "exact",
  },
];

// ── 体系設定 ──────────────────────────────────────────────

/**
 * 論理体系の設定。
 *
 * どの公理・推論規則を有効にするかを指定する。
 * 段階的実装: Phase 1 Łukasiewicz → Phase 2 他の体系追加
 *
 * theoryAxioms を指定することで、特定の理論（ペアノ算術、群論など）の
 * 非論理的公理を体系に含めることができる。
 */
export type LogicSystem = {
  /** 体系名 */
  readonly name: string;
  /** 有効な命題論理公理 */
  readonly propositionalAxioms: ReadonlySet<PropositionalAxiomId>;
  /** 述語論理公理の有効/無効 */
  readonly predicateLogic: boolean;
  /** 等号付き論理の有効/無効 */
  readonly equalityLogic: boolean;
  /** 汎化規則（Gen）の有効/無効 */
  readonly generalization: boolean;
  /** 理論公理（非論理的公理）。デフォルトは空。 */
  readonly theoryAxioms?: readonly TheoryAxiom[];
};

/**
 * 最小論理（Minimal Logic / HM）: A1, A2 + MP
 * 否定に関する公理を含まない。含意のみで閉じた体系。
 * 直観主義論理・古典論理の共通部分。
 *
 * 戸次本の体系 SK（(S)(K) + MP）と同一。
 * HM ⊆ HJ ⊆ HK の包含関係の基底となる。
 * @see dev/logic-reference/07-axiom-systems-survey.md
 */
export const minimalLogicSystem: LogicSystem = {
  name: "Minimal Logic",
  propositionalAxioms: new Set(["A1", "A2"]),
  predicateLogic: false,
  equalityLogic: false,
  generalization: false,
};

/**
 * 体系 SK（基本命題計算）: (S)(K) + MP
 * 戸次大介『数理論理学』§7.2 で導入される一階命題論理の体系。
 * 内部的には minimalLogicSystem と同一。教育的文脈で別名として提供。
 */
export const skSystem: LogicSystem = minimalLogicSystem;

/**
 * 直観主義論理（Intuitionistic Logic / HJ）: A1, A2, EFQ + MP
 * 最小論理(HM) + EFQ（爆発原理）。
 * ¬φ → (φ → ψ) により矛盾から任意の命題が導かれる。
 * 古典論理と異なり、二重否定除去 ¬¬φ → φ は成り立たない。
 * @see dev/logic-reference/07-axiom-systems-survey.md §4.4
 */
export const intuitionisticSystem: LogicSystem = {
  name: "Intuitionistic Logic",
  propositionalAxioms: new Set(["A1", "A2", "EFQ"]),
  predicateLogic: false,
  equalityLogic: false,
  generalization: false,
};

/**
 * Łukasiewicz体系（デフォルト）: A1, A2, A3 + MP
 */
export const lukasiewiczSystem: LogicSystem = {
  name: "Łukasiewicz",
  propositionalAxioms: new Set(["A1", "A2", "A3"]),
  predicateLogic: false,
  equalityLogic: false,
  generalization: false,
};

/**
 * Mendelson体系: A1, A2, M3 + MP
 * A1, A2 はŁukasiewiczと共通。M3（背理法）はA3（対偶）の代替。
 * 古典命題論理として等価だが、公理の形が異なる。
 * @see dev/logic-reference/07-axiom-systems-survey.md §3.2
 */
export const mendelsonSystem: LogicSystem = {
  name: "Mendelson",
  propositionalAxioms: new Set(["A1", "A2", "M3"]),
  predicateLogic: false,
  equalityLogic: false,
  generalization: false,
};

/**
 * 古典論理（Classical Logic / HK）: A1, A2, DNE + MP
 * 最小論理(HM) + DNE（二重否定除去）。
 * 戸次大介『数理論理学』§7.8 に基づく。
 * EFQ は DNE から導出可能なため公理として含めない。
 * Łukasiewicz(A3)やMendelson(M3)とは異なる古典論理の公理化。
 * @see dev/logic-reference/07-axiom-systems-survey.md
 */
export const classicalLogicSystem: LogicSystem = {
  name: "Classical Logic (HK)",
  propositionalAxioms: new Set(["A1", "A2", "DNE"]),
  predicateLogic: false,
  equalityLogic: false,
  generalization: false,
};

/**
 * 述語論理体系（Łukasiewicz基盤）: A1-A5 + MP + Gen
 */
export const predicateLogicSystem: LogicSystem = {
  name: "Predicate Logic",
  propositionalAxioms: new Set(["A1", "A2", "A3"]),
  predicateLogic: true,
  equalityLogic: false,
  generalization: true,
};

/**
 * 等号付き述語論理体系: A1-A5 + E1-E5 + MP + Gen
 */
export const equalityLogicSystem: LogicSystem = {
  name: "Predicate Logic with Equality",
  propositionalAxioms: new Set(["A1", "A2", "A3"]),
  predicateLogic: true,
  equalityLogic: true,
  generalization: true,
};

/**
 * ペアノ算術（PA）: 等号付き述語論理 + PA1-PA6
 * 帰納法スキーマ(PA7)は含まない（構造が特殊なため別途対応が必要）。
 * 命題論理基盤: Łukasiewicz体系（A3: 対偶）
 *
 * シグネチャ: 定数 0, 関数 S(·), 二項演算 +, *
 */
export const peanoArithmeticSystem: LogicSystem = {
  name: "Peano Arithmetic",
  propositionalAxioms: new Set(["A1", "A2", "A3"]),
  predicateLogic: true,
  equalityLogic: true,
  generalization: true,
  theoryAxioms: peanoFixedAxioms,
};

/**
 * Robinson算術（Q）: 等号付き述語論理 + PA1-PA6 + Q7
 * PAから帰納法スキーマを除き、Q7（後者の全射性）を追加した弱い算術体系。
 * Gödelの不完全性定理の基礎として重要。
 * 命題論理基盤: Łukasiewicz体系（A3: 対偶）
 */
export const robinsonArithmeticSystem: LogicSystem = {
  name: "Robinson Arithmetic (Q)",
  propositionalAxioms: new Set(["A1", "A2", "A3"]),
  predicateLogic: true,
  equalityLogic: true,
  generalization: true,
  theoryAxioms: robinsonAxioms,
};

/**
 * ペアノ算術 - HK基盤: 古典論理(DNE) + 述語論理 + 等号 + PA1-PA6
 * 二重否定除去を否定公理として採用するバリアント。
 * 戸次大介『数理論理学』§7.8の体系HKに基づく。
 */
export const peanoArithmeticHKSystem: LogicSystem = {
  name: "Peano Arithmetic (HK)",
  propositionalAxioms: new Set(["A1", "A2", "DNE"]),
  predicateLogic: true,
  equalityLogic: true,
  generalization: true,
  theoryAxioms: peanoFixedAxioms,
};

/**
 * ペアノ算術 - Mendelson基盤: Mendelson体系(M3) + 述語論理 + 等号 + PA1-PA6
 * 背理法(M3)を否定公理として採用するバリアント。
 * Mendelson "Introduction to Mathematical Logic" に基づく。
 */
export const peanoArithmeticMendelsonSystem: LogicSystem = {
  name: "Peano Arithmetic (Mendelson)",
  propositionalAxioms: new Set(["A1", "A2", "M3"]),
  predicateLogic: true,
  equalityLogic: true,
  generalization: true,
  theoryAxioms: peanoFixedAxioms,
};

/**
 * ヘイティング算術（HA）: 直観主義論理(EFQ) + 述語論理 + 等号 + PA1-PA6
 * 直観主義論理を基盤とする算術体系。二重否定除去は使えない。
 * 帰納法スキーマ(PA7)なし版。
 */
export const heytingArithmeticSystem: LogicSystem = {
  name: "Heyting Arithmetic (HA)",
  propositionalAxioms: new Set(["A1", "A2", "EFQ"]),
  predicateLogic: true,
  equalityLogic: true,
  generalization: true,
  theoryAxioms: peanoFixedAxioms,
};

/**
 * 群論（左公理系）: 等号付き述語論理 + G1(結合律) + G2L(左単位元) + G3L(左逆元)
 * 最小限の群の公理化。右単位元・右逆元は定理として導出可能。
 * 命題論理基盤: Łukasiewicz体系（A3: 対偶）
 *
 * シグネチャ: 定数 e, 関数 i(·), 二項演算 *
 */
export const groupTheoryLeftSystem: LogicSystem = {
  name: "Group Theory (Left Axioms)",
  propositionalAxioms: new Set(["A1", "A2", "A3"]),
  predicateLogic: true,
  equalityLogic: true,
  generalization: true,
  theoryAxioms: groupLeftAxioms,
};

/**
 * 群論（両側公理系）: 等号付き述語論理 + G1 + G2L + G2R + G3L + G3R
 * 冗長だが直感的な公理化。初学者向け。
 * 命題論理基盤: Łukasiewicz体系（A3: 対偶）
 *
 * シグネチャ: 定数 e, 関数 i(·), 二項演算 *
 */
export const groupTheoryFullSystem: LogicSystem = {
  name: "Group Theory (Full Axioms)",
  propositionalAxioms: new Set(["A1", "A2", "A3"]),
  predicateLogic: true,
  equalityLogic: true,
  generalization: true,
  theoryAxioms: groupFullAxioms,
};

/**
 * アーベル群: 等号付き述語論理 + 両側群公理 + G4(可換律)
 * 命題論理基盤: Łukasiewicz体系（A3: 対偶）
 *
 * シグネチャ: 定数 e, 関数 i(·), 二項演算 *
 */
export const abelianGroupSystem: LogicSystem = {
  name: "Abelian Group",
  propositionalAxioms: new Set(["A1", "A2", "A3"]),
  predicateLogic: true,
  equalityLogic: true,
  generalization: true,
  theoryAxioms: abelianGroupAxioms,
};

// ── 推論規則の適用結果 ───────────────────────────────────

/**
 * 規則適用エラーの種類。
 */
export type RuleApplicationError =
  | { readonly _tag: "NotAnImplication"; readonly formula: Formula }
  | {
      readonly _tag: "PremiseMismatch";
      readonly expected: Formula;
      readonly actual: Formula;
    }
  | {
      readonly _tag: "NotAnAxiomInstance";
      readonly axiomId: AxiomId;
      readonly formula: Formula;
    }
  | { readonly _tag: "AxiomNotEnabled"; readonly axiomId: AxiomId }
  | { readonly _tag: "GeneralizationNotEnabled" }
  | {
      readonly _tag: "SubstitutionNotFreeFor";
      readonly variable: string;
      readonly formula: Formula;
    }
  | { readonly _tag: "VariableNotFreeInPremise"; readonly variable: string }
  | { readonly _tag: "EqualityNotEnabled" }
  | { readonly _tag: "NotAUniversal"; readonly formula: Formula }
  | {
      readonly _tag: "A5VariableFreeInAntecedent";
      readonly variable: string;
      readonly antecedent: Formula;
    };

/**
 * 規則適用の結果型。
 */
export type RuleApplicationResult =
  | { readonly _tag: "Ok"; readonly conclusion: Formula }
  | { readonly _tag: "Error"; readonly error: RuleApplicationError };

const ok = (conclusion: Formula): RuleApplicationResult => ({
  _tag: "Ok",
  conclusion,
});

const err = (error: RuleApplicationError): RuleApplicationResult => ({
  _tag: "Error",
  error,
});

// ── Modus Ponens ──────────────────────────────────────────

/**
 * Modus Ponens: φ と φ→ψ から ψ を導出。
 *
 * @param antecedent 前提 φ
 * @param conditional 条件 φ→ψ
 * @returns 結論 ψ、または不一致エラー
 */
export const applyModusPonens = (
  antecedent: Formula,
  conditional: Formula,
): RuleApplicationResult => {
  if (conditional._tag !== "Implication") {
    return err({ _tag: "NotAnImplication", formula: conditional });
  }
  if (!equalFormula(antecedent, conditional.left)) {
    return err({
      _tag: "PremiseMismatch",
      expected: conditional.left,
      actual: antecedent,
    });
  }
  return ok(conditional.right);
};

// ── 汎化規則 (Generalization) ─────────────────────────────

/**
 * 汎化規則（Gen）: φ から ∀x.φ を導出。
 *
 * @param formula 前提 φ
 * @param variable 量化する項変数 x
 * @param system 論理体系設定
 * @returns 結論 ∀x.φ、または無効エラー
 */
export const applyGeneralization = (
  formula: Formula,
  variable: TermVariable,
  system: LogicSystem,
): RuleApplicationResult => {
  if (!system.generalization) {
    return err({ _tag: "GeneralizationNotEnabled" });
  }
  return ok(universal(variable, formula));
};

// ── 一方向パターンマッチング ──────────────────────────────

/**
 * テンプレート（パターン）と候補式の一方向マッチング。
 *
 * テンプレート中の MetaVariable / TermMetaVariable のみがパターン変数。
 * 候補式は完全に具体的な値として扱われる（候補中のMetaVariableはパターン変数ではない）。
 *
 * 成功時: テンプレートのパターン変数 → 候補式の部分式 へのマッピングを返す。
 * 失敗時: undefined を返す。
 */
export const matchFormulaPattern = (
  template: Formula,
  candidate: Formula,
):
  | {
      readonly formulaSub: Map<string, Formula>;
      readonly termSub: Map<string, Term>;
    }
  | undefined => {
  const formulaSub = new Map<string, Formula>();
  const termSub = new Map<string, Term>();

  const matchFormula = (t: Formula, c: Formula): boolean => {
    // テンプレート側がMetaVariableなら、パターン変数として扱う
    if (t._tag === "MetaVariable") {
      const key = metaVariableKey(t);
      const existing = formulaSub.get(key);
      if (existing !== undefined) {
        return equalFormula(existing, c);
      }
      formulaSub.set(key, c);
      return true;
    }

    // テンプレート側が非MetaVariable → 候補も同じ構造であること
    if (t._tag !== c._tag) return false;

    switch (t._tag) {
      case "Negation":
        return matchFormula(t.formula, (c as typeof t).formula);
      case "Implication":
      case "Conjunction":
      case "Disjunction":
      case "Biconditional": {
        const cBin = c as typeof t;
        return (
          matchFormula(t.left, cBin.left) && matchFormula(t.right, cBin.right)
        );
      }
      case "Universal":
      case "Existential": {
        const cQuant = c as typeof t;
        return (
          matchTerm(t.variable, cQuant.variable) &&
          matchFormula(t.formula, cQuant.formula)
        );
      }
      case "Predicate": {
        const cPred = c as typeof t;
        if (t.name !== cPred.name || t.args.length !== cPred.args.length)
          return false;
        return t.args.every((arg, i) => matchTerm(arg, cPred.args[i]));
      }
      case "Equality": {
        const cEq = c as typeof t;
        return matchTerm(t.left, cEq.left) && matchTerm(t.right, cEq.right);
      }
      case "FormulaSubstitution": {
        const cSub = c as typeof t;
        return (
          matchFormula(t.formula, cSub.formula) &&
          matchTerm(t.term, cSub.term) &&
          matchTerm(t.variable, cSub.variable)
        );
      }
    }
    /* v8 ignore start */
    t satisfies never;
    return false;
    /* v8 ignore stop */
  };

  const matchTerm = (t: Term, c: Term): boolean => {
    // テンプレート側がTermMetaVariableなら、パターン変数
    if (t._tag === "TermMetaVariable") {
      const key = termMetaVariableKey(t);
      const existing = termSub.get(key);
      if (existing !== undefined) {
        return equalTerm(existing, c);
      }
      termSub.set(key, c);
      return true;
    }

    if (t._tag !== c._tag) return false;

    switch (t._tag) {
      case "TermVariable":
        return t.name === (c as typeof t).name;
      case "Constant":
        return t.name === (c as typeof t).name;
      case "FunctionApplication": {
        const cFunc = c as typeof t;
        if (t.name !== cFunc.name || t.args.length !== cFunc.args.length)
          return false;
        return t.args.every((arg, i) => matchTerm(arg, cFunc.args[i]));
      }
      case "BinaryOperation": {
        const cBin = c as typeof t;
        if (t.operator !== cBin.operator) return false;
        return matchTerm(t.left, cBin.left) && matchTerm(t.right, cBin.right);
      }
    }
    /* v8 ignore start */
    t satisfies never;
    return false;
    /* v8 ignore stop */
  };

  if (matchFormula(template, candidate)) {
    return { formulaSub, termSub };
  }
  return undefined;
};

// ── 公理スキーマの検証 ───────────────────────────────────

/**
 * 論理式が指定された公理スキーマのインスタンスかどうかを判定する。
 *
 * 一方向パターンマッチングを使ってテンプレートの MetaVariable を候補式にバインドする。
 * マッチした場合、使用された代入を返す。
 */
export type AxiomMatchResult =
  | {
      readonly _tag: "Ok";
      readonly formulaSubstitution: FormulaSubstitutionMap;
      readonly termSubstitution: TermMetaSubstitutionMap;
    }
  | { readonly _tag: "Error"; readonly error: RuleApplicationError };

const axiomMatchOk = (
  formulaSubstitution: FormulaSubstitutionMap,
  termSubstitution: TermMetaSubstitutionMap,
): AxiomMatchResult => ({
  _tag: "Ok",
  formulaSubstitution,
  termSubstitution,
});

const axiomMatchErr = (error: RuleApplicationError): AxiomMatchResult => ({
  _tag: "Error",
  error,
});

/**
 * 命題論理公理 (A1, A2, A3, M3, EFQ, DNE) のインスタンスか判定。
 */
export const matchPropositionalAxiom = (
  axiomId: PropositionalAxiomId,
  formula: Formula,
): AxiomMatchResult => {
  const template = getPropositionalAxiomTemplate(axiomId);
  const result = matchFormulaPattern(template, formula);
  if (result === undefined) {
    return axiomMatchErr({ _tag: "NotAnAxiomInstance", axiomId, formula });
  }
  return axiomMatchOk(result.formulaSub, result.termSub);
};

const getPropositionalAxiomTemplate = (
  axiomId: PropositionalAxiomId,
): Formula => {
  switch (axiomId) {
    case "A1":
      return axiomA1Template;
    case "A2":
      return axiomA2Template;
    case "A3":
      return axiomA3Template;
    case "M3":
      return axiomM3Template;
    case "EFQ":
      return axiomEFQTemplate;
    case "DNE":
      return axiomDNETemplate;
  }
  /* v8 ignore start */
  axiomId satisfies never;
  return axiomA1Template;
  /* v8 ignore stop */
};

/**
 * A4のインスタンスか判定: ∀x.φ → φ[t/x]
 *
 * 論理式が ∀x.φ → ψ の形であり、ψ = φ[t/x] となる t が存在するかチェック。
 * A4は項代入を含むため、パターンマッチだけでは判定できず、専用ロジックが必要。
 */
export const matchAxiomA4 = (formula: Formula): AxiomMatchResult => {
  // A4: ∀x.φ → φ[t/x] の形をチェック
  if (formula._tag !== "Implication") {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A4",
      formula,
    });
  }
  if (formula.left._tag !== "Universal") {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A4",
      formula,
    });
  }

  const boundVar = formula.left.variable;
  const body = formula.left.formula;
  const conclusion = formula.right;

  // body 中で x の自由出現がない場合は body = conclusion であるべき
  const freeVars = freeVariablesInFormula(body);
  if (!freeVars.has(boundVar.name)) {
    if (equalFormula(body, conclusion)) {
      return axiomMatchOk(new Map(), new Map());
    }
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A4",
      formula,
    });
  }

  // body と conclusion を走査して t（boundVarへの代入先）を推論
  const replacementTerm = inferTermReplacement(body, conclusion, boundVar);
  if (replacementTerm === undefined) {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A4",
      formula,
    });
  }

  // t が φ 中の x に対して自由に代入可能かチェック
  if (!isFreeFor(replacementTerm, boundVar, body)) {
    return axiomMatchErr({
      _tag: "SubstitutionNotFreeFor",
      variable: boundVar.name,
      formula: body,
    });
  }

  // 実際に代入して一致するか最終確認
  const substituted = substituteTermVariableInFormula(
    body,
    boundVar,
    replacementTerm,
  );
  // 防御的チェック: inferTermReplacement が正しく動作していれば到達しない
  /* v8 ignore start */
  if (!equalFormula(substituted, conclusion)) {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A4",
      formula,
    });
  }
  /* v8 ignore stop */

  return axiomMatchOk(new Map(), new Map());
};

/**
 * A5のインスタンスか判定: ∀x.(φ→ψ) → (φ → ∀x.ψ)
 * 制約: x ∉ FV(φ)
 */
export const matchAxiomA5 = (formula: Formula): AxiomMatchResult => {
  if (formula._tag !== "Implication") {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A5",
      formula,
    });
  }
  if (formula.left._tag !== "Universal") {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A5",
      formula,
    });
  }

  const xv = formula.left.variable;
  const innerBody = formula.left.formula;

  if (innerBody._tag !== "Implication") {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A5",
      formula,
    });
  }

  const antecedent = innerBody.left;
  const consequent = innerBody.right;

  if (formula.right._tag !== "Implication") {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A5",
      formula,
    });
  }

  const rightAntecedent = formula.right.left;
  const rightConsequent = formula.right.right;

  if (!equalFormula(antecedent, rightAntecedent)) {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A5",
      formula,
    });
  }

  if (rightConsequent._tag !== "Universal") {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A5",
      formula,
    });
  }

  if (!equalTerm(xv, rightConsequent.variable)) {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A5",
      formula,
    });
  }

  if (!equalFormula(consequent, rightConsequent.formula)) {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A5",
      formula,
    });
  }

  // 制約: x ∉ FV(φ)
  if (freeVariablesInFormula(antecedent).has(xv.name)) {
    return axiomMatchErr({
      _tag: "A5VariableFreeInAntecedent",
      variable: xv.name,
      antecedent,
    });
  }

  return axiomMatchOk(new Map(), new Map());
};

/**
 * 等号公理 (E1, E2, E3) のインスタンスか判定。
 * 一方向パターンマッチングを使用。
 * E4, E5 はシグネチャ依存のため将来的に別途実装。
 */
export const matchEqualityAxiom = (
  axiomId: "E1" | "E2" | "E3",
  formula: Formula,
): AxiomMatchResult => {
  const template = getEqualityAxiomTemplate(axiomId);
  const result = matchFormulaPattern(template, formula);
  if (result === undefined) {
    return axiomMatchErr({ _tag: "NotAnAxiomInstance", axiomId, formula });
  }
  return axiomMatchOk(result.formulaSub, result.termSub);
};

const getEqualityAxiomTemplate = (axiomId: "E1" | "E2" | "E3"): Formula => {
  switch (axiomId) {
    case "E1":
      return axiomE1Template;
    case "E2":
      return axiomE2Template;
    case "E3":
      return axiomE3Template;
  }
  /* v8 ignore start */
  axiomId satisfies never;
  return axiomE1Template;
  /* v8 ignore stop */
};

// ── 代入の適用 ────────────────────────────────────────────

/**
 * メタ変数代入を適用して結果を返す。
 *
 * @param schema 元のスキーマ
 * @param formulaSubst 論理式メタ変数代入
 * @param termSubst 項メタ変数代入
 * @returns 代入結果の論理式
 */
export const applySubstitution = (
  schema: Formula,
  formulaSubst: FormulaSubstitutionMap,
  termSubst: TermMetaSubstitutionMap,
): Formula => {
  const afterFormula = substituteFormulaMetaVariables(schema, formulaSubst);
  return substituteTermMetaVariablesInFormula(afterFormula, termSubst);
};

// ── 総合的な公理インスタンス判定 ─────────────────────────

/**
 * 論理式がシステムで有効な公理のいずれかのインスタンスかを判定する。
 *
 * マッチした場合、公理IDと代入を返す。
 * 理論公理の場合は theoryAxiomId フィールドに理論公理のIDが入る。
 */
export type AxiomIdentificationResult =
  | {
      readonly _tag: "Ok";
      readonly axiomId: AxiomId;
      readonly theoryAxiomId?: undefined;
      readonly formulaSubstitution: FormulaSubstitutionMap;
      readonly termSubstitution: TermMetaSubstitutionMap;
    }
  | {
      readonly _tag: "TheoryAxiom";
      readonly theoryAxiomId: string;
      readonly displayName: string;
      readonly formulaSubstitution: FormulaSubstitutionMap;
      readonly termSubstitution: TermMetaSubstitutionMap;
    }
  | { readonly _tag: "Error" };

/**
 * 理論公理のインスタンスか判定する。
 *
 * matchMode に応じて:
 * - "exact": テンプレートと完全一致
 * - "pattern": テンプレートをパターンとして一方向マッチング
 */
export const matchTheoryAxiom = (
  axiom: TheoryAxiom,
  formula: Formula,
): AxiomMatchResult => {
  if (axiom.matchMode === "exact") {
    if (equalFormula(axiom.template, formula)) {
      return axiomMatchOk(new Map(), new Map());
    }
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: axiom.id as AxiomId,
      formula,
    });
  }
  // pattern mode
  const result = matchFormulaPattern(axiom.template, formula);
  if (result === undefined) {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: axiom.id as AxiomId,
      formula,
    });
  }
  return axiomMatchOk(result.formulaSub, result.termSub);
};

export const identifyAxiom = (
  formula: Formula,
  system: LogicSystem,
): AxiomIdentificationResult => {
  const propAxiomIds: readonly PropositionalAxiomId[] = [
    "A1",
    "A2",
    "A3",
    "M3",
    "EFQ",
    "DNE",
  ];
  for (const axiomId of propAxiomIds) {
    if (system.propositionalAxioms.has(axiomId)) {
      const result = matchPropositionalAxiom(axiomId, formula);
      if (result._tag === "Ok") {
        return {
          _tag: "Ok",
          axiomId,
          formulaSubstitution: result.formulaSubstitution,
          termSubstitution: result.termSubstitution,
        };
      }
    }
  }

  if (system.predicateLogic) {
    const a4Result = matchAxiomA4(formula);
    if (a4Result._tag === "Ok") {
      return {
        _tag: "Ok",
        axiomId: "A4",
        formulaSubstitution: a4Result.formulaSubstitution,
        termSubstitution: a4Result.termSubstitution,
      };
    }

    const a5Result = matchAxiomA5(formula);
    if (a5Result._tag === "Ok") {
      return {
        _tag: "Ok",
        axiomId: "A5",
        formulaSubstitution: a5Result.formulaSubstitution,
        termSubstitution: a5Result.termSubstitution,
      };
    }
  }

  if (system.equalityLogic) {
    const eqAxiomIds: readonly ("E1" | "E2" | "E3")[] = ["E1", "E2", "E3"];
    for (const axiomId of eqAxiomIds) {
      const result = matchEqualityAxiom(axiomId, formula);
      if (result._tag === "Ok") {
        return {
          _tag: "Ok",
          axiomId,
          formulaSubstitution: result.formulaSubstitution,
          termSubstitution: result.termSubstitution,
        };
      }
    }
  }

  // 理論公理
  if (system.theoryAxioms !== undefined) {
    for (const axiom of system.theoryAxioms) {
      const result = matchTheoryAxiom(axiom, formula);
      if (result._tag === "Ok") {
        return {
          _tag: "TheoryAxiom",
          theoryAxiomId: axiom.id,
          displayName: axiom.displayName,
          formulaSubstitution: result.formulaSubstitution,
          termSubstitution: result.termSubstitution,
        };
      }
    }
  }

  return { _tag: "Error" };
};

// ── ヘルパー: 項変数代入の推論 ─────────────────────────────

/**
 * body[t/variable] = target となる t を推論する。
 *
 * body と target を比較し、variable の出現位置で target が持つ項を抽出する。
 * すべての出現位置で同じ項が得られれば、その項を返す。
 */
const inferTermReplacement = (
  body: Formula,
  target: Formula,
  variable: TermVariable,
): Term | undefined => {
  let found: Term | undefined;

  const checkConsistent = (t: Term): boolean => {
    if (found === undefined) {
      found = t;
      return true;
    }
    return equalTerm(found, t);
  };

  const matchFormula = (b: Formula, t: Formula): boolean => {
    if (b._tag !== t._tag) return false;
    switch (b._tag) {
      case "MetaVariable":
        return (
          b.name === (t as typeof b).name &&
          b.subscript === (t as typeof b).subscript
        );
      case "Negation":
        return matchFormula(b.formula, (t as typeof b).formula);
      case "Implication":
      case "Conjunction":
      case "Disjunction":
      case "Biconditional": {
        const tBin = t as typeof b;
        return (
          matchFormula(b.left, tBin.left) && matchFormula(b.right, tBin.right)
        );
      }
      case "Universal":
      case "Existential": {
        const tQuant = t as typeof b;
        if (!equalTerm(b.variable, tQuant.variable)) return false;
        // 束縛変数がvariableと同じ場合、このスコープ内ではvariableは束縛されている
        if (b.variable.name === variable.name) {
          return equalFormula(b.formula, tQuant.formula);
        }
        return matchFormula(b.formula, tQuant.formula);
      }
      case "Predicate": {
        const tPred = t as typeof b;
        if (b.name !== tPred.name) return false;
        if (b.args.length !== tPred.args.length) return false;
        return b.args.every((arg, i) => matchTerm(arg, tPred.args[i]));
      }
      case "Equality": {
        const tEq = t as typeof b;
        return matchTerm(b.left, tEq.left) && matchTerm(b.right, tEq.right);
      }
      case "FormulaSubstitution": {
        const tSub = t as typeof b;
        return (
          matchFormula(b.formula, tSub.formula) &&
          matchTerm(b.term, tSub.term) &&
          matchTerm(b.variable, tSub.variable)
        );
      }
    }
    /* v8 ignore start */
    b satisfies never;
    return false;
    /* v8 ignore stop */
  };

  const matchTerm = (b: Term, t: Term): boolean => {
    switch (b._tag) {
      case "TermVariable":
        if (b.name === variable.name) {
          return checkConsistent(t);
        }
        return b._tag === t._tag && b.name === (t as typeof b).name;
      case "TermMetaVariable":
        return (
          b._tag === t._tag &&
          b.name === (t as typeof b).name &&
          b.subscript === (t as typeof b).subscript
        );
      case "Constant":
        return b._tag === t._tag && b.name === (t as typeof b).name;
      case "FunctionApplication": {
        if (t._tag !== "FunctionApplication") return false;
        if (b.name !== t.name) return false;
        if (b.args.length !== t.args.length) return false;
        return b.args.every((arg, i) => matchTerm(arg, t.args[i]));
      }
      case "BinaryOperation": {
        if (t._tag !== "BinaryOperation") return false;
        if (b.operator !== t.operator) return false;
        return matchTerm(b.left, t.left) && matchTerm(b.right, t.right);
      }
    }
    /* v8 ignore start */
    b satisfies never;
    return false;
    /* v8 ignore stop */
  };

  if (matchFormula(body, target)) {
    // 防御的フォールバック: matchAxiomA4 が事前に freeVariablesInFormula で
    // 変数の自由出現を確認しているため、matchFormula が成功すれば found は常にセットされる
    /* v8 ignore next */
    return found ?? variable;
  }
  return undefined;
};
