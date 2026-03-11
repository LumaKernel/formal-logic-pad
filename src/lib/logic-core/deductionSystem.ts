/**
 * 演繹体系の統一的管理モジュール。
 *
 * Hilbert流・自然演繹・シーケント計算など、異なる証明スタイルを
 * 統一的に扱う型と定義を提供する。
 *
 * 戸次大介『数理論理学』に基づく体系分類:
 * - 第7章: Hilbert流証明論 (SK, HM, HJ, HK)
 * - 第8章: 自然演繹 (NM, NJ, NK)
 * - 第10章: ゲンツェン流シーケント計算 (LM, LJ, LK)
 * - 第12章: タブロー式シーケント計算 (TAB)
 * - 第6章: 分析的タブロー (AT)
 *
 * 変更時は deductionSystem.test.ts, notebookCreateLogic.ts,
 * questDefinition.ts の SystemPresetId も同期すること。
 *
 * @see inferenceRule.ts Hilbert流の体系定義 (LogicSystem)
 * @see naturalDeduction.ts 自然演繹のピュアロジック
 * @see sequentCalculus.ts シーケント計算のピュアロジック
 * @see tableauCalculus.ts タブロー式シーケント計算のピュアロジック
 * @see analyticTableau.ts 分析的タブローのピュアロジック
 */

import type { LogicSystem } from "./inferenceRule";
import type { TabRuleId } from "./tableauCalculus";
import type { AtRuleId } from "./analyticTableau";

// ── 証明スタイル ─────────────────────────────────────────

/**
 * 証明スタイルの分類。
 *
 * - "hilbert": Hilbert流（公理 + MP + Gen）
 * - "natural-deduction": 自然演繹（推論規則のペア + 仮定の打ち消し）
 * - "sequent-calculus": シーケント計算
 * - "tableau-calculus": タブロー式シーケント計算
 * - "analytic-tableau": 分析的タブロー
 *
 * 新しいスタイル追加時はすべての switch 文を更新すること
 * （satisfies never でコンパイル時に検出される）。
 */
export type DeductionStyle =
  | "hilbert"
  | "natural-deduction"
  | "sequent-calculus"
  | "tableau-calculus"
  | "analytic-tableau";

// ── 自然演繹の体系設定 ─────────────────────────────────────

/**
 * 自然演繹の推論規則ID。
 *
 * NM（最小論理）で使える基本規則:
 * - implication-intro, implication-elim (→I, →E)
 * - conjunction-intro, conjunction-elim-left, conjunction-elim-right (∧I, ∧E)
 * - disjunction-intro-left, disjunction-intro-right, disjunction-elim (∨I, ∨E)
 * - weakening (弱化)
 *
 * NJ（直観主義論理）で追加:
 * - efq (爆発律: ⊥→任意)
 *
 * NK（古典論理）で追加:
 * - dne (二重否定除去: ¬¬φ→φ)
 */
export type NdRuleId =
  | "implication-intro"
  | "implication-elim"
  | "conjunction-intro"
  | "conjunction-elim-left"
  | "conjunction-elim-right"
  | "disjunction-intro-left"
  | "disjunction-intro-right"
  | "disjunction-elim"
  | "weakening"
  | "efq"
  | "dne"
  | "universal-intro"
  | "universal-elim"
  | "existential-intro"
  | "existential-elim";

/** NM（最小論理）の基本規則セット */
const nmBaseRules: ReadonlySet<NdRuleId> = new Set([
  "implication-intro",
  "implication-elim",
  "conjunction-intro",
  "conjunction-elim-left",
  "conjunction-elim-right",
  "disjunction-intro-left",
  "disjunction-intro-right",
  "disjunction-elim",
  "weakening",
  "universal-intro",
  "universal-elim",
  "existential-intro",
  "existential-elim",
]);

/**
 * 自然演繹の体系設定。
 *
 * どの推論規則を有効にするかを指定する。
 */
export type NaturalDeductionSystem = {
  /** 体系名 */
  readonly name: string;
  /** 有効な推論規則 */
  readonly rules: ReadonlySet<NdRuleId>;
};

/**
 * NM: 自然演繹の最小論理。
 * 基本規則のみ。EFQ/DNEなし。
 * 戸次『数理論理学』§8.2
 */
export const nmSystem: NaturalDeductionSystem = {
  name: "Natural Deduction NM",
  rules: nmBaseRules,
};

/**
 * NJ: 自然演繹の直観主義論理。
 * NM + EFQ（爆発律）。
 * 戸次『数理論理学』§8.3
 */
export const njSystem: NaturalDeductionSystem = {
  name: "Natural Deduction NJ",
  rules: new Set([...nmBaseRules, "efq"]),
};

/**
 * NK: 自然演繹の古典論理。
 * NM + DNE（二重否定除去）。
 * 戸次『数理論理学』§8.3
 *
 * 注: NK = NM + DNE であり、EFQ は NK で証明可能なため明示的に含めない。
 * ただし、EFQを「自明な規則」として使いたい場合は拡張可能。
 */
export const nkSystem: NaturalDeductionSystem = {
  name: "Natural Deduction NK",
  rules: new Set([...nmBaseRules, "dne"]),
};

// ── シーケント計算の体系設定 ───────────────────────────────────

/**
 * シーケント計算の推論規則ID。
 *
 * LM（最小論理）で使える基本規則:
 * - identity (公理 ID)
 * - cut (カット規則 CUT)
 * - weakening-left, contraction-left, exchange-left (左構造規則)
 * - contraction-right, exchange-right (右構造規則 ※LJでは⇒cと⇒eは不要)
 * - implication-left, implication-right (→⇒, ⇒→)
 * - conjunction-left, conjunction-right (∧⇒, ⇒∧)
 * - disjunction-left, disjunction-right (∨⇒, ⇒∨)
 * - universal-left, universal-right (∀⇒, ⇒∀)
 * - existential-left, existential-right (∃⇒, ⇒∃)
 *
 * LJ（直観主義論理）で追加:
 * - bottom-left (⊥⇒)
 * - weakening-right (⇒w)
 *
 * LK（古典論理）で追加（LJの右辺制限を解除）:
 * - contraction-right (⇒c)
 * - exchange-right (⇒e)
 *
 * 注: LMでは (⇒w) と (⊥⇒) が使用不可（定義10.36）。
 *     LJでは右辺が高々1のため (⇒c) と (⇒e) が不要。
 */
export type ScRuleId =
  | "identity"
  | "bottom-left"
  | "cut"
  | "weakening-left"
  | "weakening-right"
  | "contraction-left"
  | "contraction-right"
  | "exchange-left"
  | "exchange-right"
  | "implication-left"
  | "implication-right"
  | "conjunction-left"
  | "conjunction-right"
  | "disjunction-left"
  | "disjunction-right"
  | "universal-left"
  | "universal-right"
  | "negation-left"
  | "negation-right"
  | "existential-left"
  | "existential-right";

/** LM（最小論理）の基本規則セット */
const lmBaseRules: ReadonlySet<ScRuleId> = new Set([
  "identity",
  "cut",
  "weakening-left",
  "contraction-left",
  "exchange-left",
  "contraction-right",
  "exchange-right",
  "implication-left",
  "implication-right",
  "conjunction-left",
  "conjunction-right",
  "disjunction-left",
  "disjunction-right",
  "negation-left",
  "negation-right",
  "universal-left",
  "universal-right",
  "existential-left",
  "existential-right",
]);

/**
 * シーケント計算の体系設定。
 *
 * どの推論規則を有効にするかを指定する。
 * また、右辺の最大長を制限できる（LJ/LMでは高々1、LKでは無制限）。
 */
export type SequentCalculusSystem = {
  /** 体系名 */
  readonly name: string;
  /** 有効な推論規則 */
  readonly rules: ReadonlySet<ScRuleId>;
  /**
   * 右辺の最大長。
   * - undefined: 制限なし（LK）
   * - 1: 高々1（LJ, LM）
   */
  readonly maxSuccedentLength?: number;
};

/**
 * LM: シーケント計算の最小論理。
 * LJから (⊥⇒) と (⇒w) を除いた体系。
 * 戸次『数理論理学』定義10.36
 *
 * 注: LMでは右辺は常に1つ（系10.37）。
 * (⇒w)が使えないため右辺を0にできない。
 * また (⇒c)/(⇒e) は右辺高々1なので実質的に不要だが、
 * 形式的には持つ（LJの部分体系として）。
 */
export const lmSystem: SequentCalculusSystem = {
  name: "Sequent Calculus LM",
  rules: lmBaseRules,
  maxSuccedentLength: 1,
};

/**
 * LJ: シーケント計算の直観主義論理。
 * LM + (⊥⇒) + (⇒w)。
 * 右辺が高々1に制限。
 * 戸次『数理論理学』定義10.20, 10.22-10.24
 */
export const ljSystem: SequentCalculusSystem = {
  name: "Sequent Calculus LJ",
  rules: new Set([...lmBaseRules, "bottom-left", "weakening-right"]),
  maxSuccedentLength: 1,
};

/**
 * LK: シーケント計算の古典論理。
 * 完全対称体系。右辺は0個以上。
 * 戸次『数理論理学』定義10.2-10.4
 */
export const lkSystem: SequentCalculusSystem = {
  name: "Sequent Calculus LK",
  rules: new Set([...lmBaseRules, "bottom-left", "weakening-right"]),
  maxSuccedentLength: undefined,
};

// ── タブロー式シーケント計算の体系設定 ───────────────────────────

/**
 * タブロー式シーケント計算の体系設定。
 *
 * TAB は シーケントの右辺が常に空（Γ ⇒）という特徴を持つ。
 * 戸次『数理論理学』第12章。
 *
 * 全14規則: 公理(BS, ⊥)、構造(e)、命題(¬¬, ∧, ¬∧, ∨, ¬∨, →, ¬→)、量化子(∀, ¬∀, ∃, ¬∃)
 */
export type TableauCalculusSystem = {
  /** 体系名 */
  readonly name: string;
  /** 有効な推論規則 */
  readonly rules: ReadonlySet<TabRuleId>;
};

/** TAB（タブロー式シーケント計算）の全規則セット */
const tabAllRules: ReadonlySet<TabRuleId> = new Set<TabRuleId>([
  "bs",
  "bottom",
  "exchange",
  "double-negation",
  "conjunction",
  "neg-conjunction",
  "disjunction",
  "neg-disjunction",
  "implication",
  "neg-implication",
  "universal",
  "neg-universal",
  "existential",
  "neg-existential",
]);

/**
 * TAB: タブロー式シーケント計算（全規則）。
 * LK-CUT（カット付きシーケント計算）と証明力が等価。
 * 戸次『数理論理学』定義12.1-12.3
 */
export const tabSystem: TableauCalculusSystem = {
  name: "Tableau Calculus TAB",
  rules: tabAllRules,
};

/** TABの命題論理部分のみ（量化子規則なし） */
const tabPropositionalRules: ReadonlySet<TabRuleId> = new Set<TabRuleId>([
  "bs",
  "bottom",
  "exchange",
  "double-negation",
  "conjunction",
  "neg-conjunction",
  "disjunction",
  "neg-disjunction",
  "implication",
  "neg-implication",
]);

/**
 * TAB-Prop: タブロー式シーケント計算の命題論理部分。
 * 量化子規則を除いた10規則。
 */
export const tabPropSystem: TableauCalculusSystem = {
  name: "Tableau Calculus TAB (Propositional)",
  rules: tabPropositionalRules,
};

/** TABの規則が有効かどうかを判定する */
export function isTabRuleEnabled(
  system: TableauCalculusSystem,
  ruleId: TabRuleId,
): boolean {
  return system.rules.has(ruleId);
}

// ── 分析的タブローの体系設定 ─────────────────────────────────

/**
 * 分析的タブローの体系設定。
 *
 * 分析的タブロー (bekki 第6章) は署名付き論理式の木構造で証明を行う。
 * TAB（タブロー式シーケント計算, Ch.12）と本質的に同じ規則を持つが、
 * 表現方法が異なる（シーケントではなく個別の署名付き論理式）。
 *
 * 全15規則: α規則(7), β規則(3), γ規則(2), δ規則(2), closure(1)
 */
export type AnalyticTableauSystem = {
  /** 体系名 */
  readonly name: string;
  /** 有効な規則 */
  readonly rules: ReadonlySet<AtRuleId>;
};

/** 分析的タブロー全規則セット */
const atAllRules: ReadonlySet<AtRuleId> = new Set<AtRuleId>([
  "alpha-conj",
  "alpha-neg-disj",
  "alpha-neg-impl",
  "alpha-double-neg-t",
  "alpha-double-neg-f",
  "alpha-neg-t",
  "alpha-neg-f",
  "beta-neg-conj",
  "beta-disj",
  "beta-impl",
  "gamma-univ",
  "gamma-neg-exist",
  "delta-neg-univ",
  "delta-exist",
  "closure",
]);

/**
 * AT: 分析的タブロー（全規則）。
 * 戸次『数理論理学』第6章。
 */
export const atSystem: AnalyticTableauSystem = {
  name: "Analytic Tableau",
  rules: atAllRules,
};

/** 分析的タブロー命題論理部分（量化子規則なし） */
const atPropositionalRules: ReadonlySet<AtRuleId> = new Set<AtRuleId>([
  "alpha-conj",
  "alpha-neg-disj",
  "alpha-neg-impl",
  "alpha-double-neg-t",
  "alpha-double-neg-f",
  "alpha-neg-t",
  "alpha-neg-f",
  "beta-neg-conj",
  "beta-disj",
  "beta-impl",
  "closure",
]);

/**
 * AT-Prop: 分析的タブローの命題論理部分。
 * 量化子規則（γ/δ）を除いた11規則。
 */
export const atPropSystem: AnalyticTableauSystem = {
  name: "Analytic Tableau (Propositional)",
  rules: atPropositionalRules,
};

/** 分析的タブローの規則が有効かどうかを判定する */
export function isAtRuleEnabled(
  system: AnalyticTableauSystem,
  ruleId: AtRuleId,
): boolean {
  return system.rules.has(ruleId);
}

// ── 演繹体系（統一型） ──────────────────────────────────────

/**
 * 統一された演繹体系の定義。
 *
 * Hilbert流・自然演繹・シーケント計算を discriminated union で管理する。
 */
export type DeductionSystem =
  | {
      readonly style: "hilbert";
      readonly system: LogicSystem;
    }
  | {
      readonly style: "natural-deduction";
      readonly system: NaturalDeductionSystem;
    }
  | {
      readonly style: "sequent-calculus";
      readonly system: SequentCalculusSystem;
    }
  | {
      readonly style: "tableau-calculus";
      readonly system: TableauCalculusSystem;
    }
  | {
      readonly style: "analytic-tableau";
      readonly system: AnalyticTableauSystem;
    };

// ── ファクトリ関数 ──────────────────────────────────────────

/** Hilbert流の演繹体系を作成する */
export function hilbertDeduction(system: LogicSystem): DeductionSystem {
  return { style: "hilbert", system };
}

/** 自然演繹の演繹体系を作成する */
export function naturalDeduction(
  system: NaturalDeductionSystem,
): DeductionSystem {
  return { style: "natural-deduction", system };
}

/** シーケント計算の演繹体系を作成する */
export function sequentCalculusDeduction(
  system: SequentCalculusSystem,
): DeductionSystem {
  return { style: "sequent-calculus", system };
}

/** タブロー式シーケント計算の演繹体系を作成する */
export function tableauCalculusDeduction(
  system: TableauCalculusSystem,
): DeductionSystem {
  return { style: "tableau-calculus", system };
}

/** 分析的タブローの演繹体系を作成する */
export function analyticTableauDeduction(
  system: AnalyticTableauSystem,
): DeductionSystem {
  return { style: "analytic-tableau", system };
}

// ── ユーティリティ ──────────────────────────────────────────

/** 演繹体系の名前を取得する */
export function getDeductionSystemName(ds: DeductionSystem): string {
  // 全てのスタイルで共通のプロパティにアクセスするためswitch不要
  return ds.system.name;
}

/** 演繹体系の証明スタイルの表示名を取得する */
export function getDeductionStyleLabel(style: DeductionStyle): string {
  if (style === "hilbert") return "Hilbert流";
  if (style === "natural-deduction") return "自然演繹";
  if (style === "sequent-calculus") return "シーケント計算";
  if (style === "tableau-calculus") return "タブロー法";
  // style: "analytic-tableau" (TypeScript narrowing)
  return "分析的タブロー";
}

/** 自然演繹体系で特定の規則が有効かどうかを判定する */
export function isNdRuleEnabled(
  system: NaturalDeductionSystem,
  ruleId: NdRuleId,
): boolean {
  return system.rules.has(ruleId);
}

/** 全NdRuleIdの一覧（テスト・UI用） */
export const allNdRuleIds: readonly NdRuleId[] = [
  "implication-intro",
  "implication-elim",
  "conjunction-intro",
  "conjunction-elim-left",
  "conjunction-elim-right",
  "disjunction-intro-left",
  "disjunction-intro-right",
  "disjunction-elim",
  "weakening",
  "efq",
  "dne",
  "universal-intro",
  "universal-elim",
  "existential-intro",
  "existential-elim",
];

/** シーケント計算体系で特定の規則が有効かどうかを判定する */
export function isScRuleEnabled(
  system: SequentCalculusSystem,
  ruleId: ScRuleId,
): boolean {
  return system.rules.has(ruleId);
}

/** 全ScRuleIdの一覧（テスト・UI用） */
export const allScRuleIds: readonly ScRuleId[] = [
  "identity",
  "bottom-left",
  "cut",
  "weakening-left",
  "weakening-right",
  "contraction-left",
  "contraction-right",
  "exchange-left",
  "exchange-right",
  "implication-left",
  "implication-right",
  "conjunction-left",
  "conjunction-right",
  "disjunction-left",
  "disjunction-right",
  "negation-left",
  "negation-right",
  "universal-left",
  "universal-right",
  "existential-left",
  "existential-right",
];

/** ScRuleIdの表示名 */
export function getScRuleDisplayName(ruleId: ScRuleId): string {
  if (ruleId === "identity") return "公理 (ID)";
  if (ruleId === "bottom-left") return "⊥公理 (⊥⇒)";
  if (ruleId === "cut") return "カット (CUT)";
  if (ruleId === "weakening-left") return "左弱化 (w⇒)";
  if (ruleId === "weakening-right") return "右弱化 (⇒w)";
  if (ruleId === "contraction-left") return "左縮約 (c⇒)";
  if (ruleId === "contraction-right") return "右縮約 (⇒c)";
  if (ruleId === "exchange-left") return "左交換 (e⇒)";
  if (ruleId === "exchange-right") return "右交換 (⇒e)";
  if (ruleId === "implication-left") return "左→規則 (→⇒)";
  if (ruleId === "implication-right") return "右→規則 (⇒→)";
  if (ruleId === "conjunction-left") return "左∧規則 (∧⇒)";
  if (ruleId === "conjunction-right") return "右∧規則 (⇒∧)";
  if (ruleId === "disjunction-left") return "左∨規則 (∨⇒)";
  if (ruleId === "disjunction-right") return "右∨規則 (⇒∨)";
  if (ruleId === "universal-left") return "左∀規則 (∀⇒)";
  if (ruleId === "universal-right") return "右∀規則 (⇒∀)";
  if (ruleId === "negation-left") return "左¬規則 (¬⇒)";
  if (ruleId === "negation-right") return "右¬規則 (⇒¬)";
  if (ruleId === "existential-left") return "左∃規則 (∃⇒)";
  // ruleId: "existential-right" (TypeScript narrowing)
  return "右∃規則 (⇒∃)";
}

/** シーケント計算の分岐規則（前提が2つ）かどうかを判定する */
export function isScBranchingRule(ruleId: ScRuleId): boolean {
  return (
    ruleId === "cut" ||
    ruleId === "implication-left" ||
    ruleId === "conjunction-right" ||
    ruleId === "disjunction-left"
  );
}

/** NdRuleIdの表示名 */
export function getNdRuleDisplayName(ruleId: NdRuleId): string {
  if (ruleId === "implication-intro") return "→導入 (→I)";
  if (ruleId === "implication-elim") return "→除去 (→E)";
  if (ruleId === "conjunction-intro") return "∧導入 (∧I)";
  if (ruleId === "conjunction-elim-left") return "∧除去左 (∧E_L)";
  if (ruleId === "conjunction-elim-right") return "∧除去右 (∧E_R)";
  if (ruleId === "disjunction-intro-left") return "∨導入左 (∨I_L)";
  if (ruleId === "disjunction-intro-right") return "∨導入右 (∨I_R)";
  if (ruleId === "disjunction-elim") return "∨除去 (∨E)";
  if (ruleId === "weakening") return "弱化 (w)";
  if (ruleId === "efq") return "爆発律 (EFQ)";
  if (ruleId === "dne") return "二重否定除去 (DNE)";
  if (ruleId === "universal-intro") return "∀導入 (∀I)";
  if (ruleId === "universal-elim") return "∀除去 (∀E)";
  if (ruleId === "existential-intro") return "∃導入 (∃I)";
  // ruleId: "existential-elim" (TypeScript narrowing)
  return "∃除去 (∃E)";
}
