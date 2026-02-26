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
 *
 * 変更時は deductionSystem.test.ts, notebookCreateLogic.ts,
 * questDefinition.ts の SystemPresetId も同期すること。
 *
 * @see inferenceRule.ts Hilbert流の体系定義 (LogicSystem)
 * @see naturalDeduction.ts 自然演繹のピュアロジック
 * @see sequentCalculus.ts シーケント計算のピュアロジック
 */

import type { LogicSystem } from "./inferenceRule";

// ── 証明スタイル ─────────────────────────────────────────

/**
 * 証明スタイルの分類。
 *
 * - "hilbert": Hilbert流（公理 + MP + Gen）
 * - "natural-deduction": 自然演繹（推論規則のペア + 仮定の打ち消し）
 * - "sequent-calculus": シーケント計算（将来追加予定）
 *
 * 新しいスタイル追加時はすべての switch 文を更新すること
 * （satisfies never でコンパイル時に検出される）。
 */
export type DeductionStyle =
  | "hilbert"
  | "natural-deduction"
  | "sequent-calculus";

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
  | "dne";

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
  rules: new Set([
    ...lmBaseRules,
    "bottom-left",
    "weakening-right",
  ]),
  maxSuccedentLength: undefined,
};

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

// ── ユーティリティ ──────────────────────────────────────────

/** 演繹体系の名前を取得する */
export function getDeductionSystemName(ds: DeductionSystem): string {
  switch (ds.style) {
    case "hilbert":
      return ds.system.name;
    case "natural-deduction":
      return ds.system.name;
    case "sequent-calculus":
      return ds.system.name;
    default: {
      /* v8 ignore start */
      const _exhaustive: never = ds;
      return _exhaustive;
      /* v8 ignore stop */
    }
  }
}

/** 演繹体系の証明スタイルの表示名を取得する */
export function getDeductionStyleLabel(style: DeductionStyle): string {
  switch (style) {
    case "hilbert":
      return "Hilbert流";
    case "natural-deduction":
      return "自然演繹";
    case "sequent-calculus":
      return "シーケント計算";
    default: {
      /* v8 ignore start */
      const _exhaustive: never = style;
      return _exhaustive;
      /* v8 ignore stop */
    }
  }
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
  "universal-left",
  "universal-right",
  "existential-left",
  "existential-right",
];

/** ScRuleIdの表示名 */
export function getScRuleDisplayName(ruleId: ScRuleId): string {
  switch (ruleId) {
    case "identity":
      return "公理 (ID)";
    case "bottom-left":
      return "⊥公理 (⊥⇒)";
    case "cut":
      return "カット (CUT)";
    case "weakening-left":
      return "左弱化 (w⇒)";
    case "weakening-right":
      return "右弱化 (⇒w)";
    case "contraction-left":
      return "左縮約 (c⇒)";
    case "contraction-right":
      return "右縮約 (⇒c)";
    case "exchange-left":
      return "左交換 (e⇒)";
    case "exchange-right":
      return "右交換 (⇒e)";
    case "implication-left":
      return "左→規則 (→⇒)";
    case "implication-right":
      return "右→規則 (⇒→)";
    case "conjunction-left":
      return "左∧規則 (∧⇒)";
    case "conjunction-right":
      return "右∧規則 (⇒∧)";
    case "disjunction-left":
      return "左∨規則 (∨⇒)";
    case "disjunction-right":
      return "右∨規則 (⇒∨)";
    case "universal-left":
      return "左∀規則 (∀⇒)";
    case "universal-right":
      return "右∀規則 (⇒∀)";
    case "existential-left":
      return "左∃規則 (∃⇒)";
    case "existential-right":
      return "右∃規則 (⇒∃)";
    default: {
      /* v8 ignore start */
      const _exhaustive: never = ruleId;
      return _exhaustive;
      /* v8 ignore stop */
    }
  }
}

/** NdRuleIdの表示名 */
export function getNdRuleDisplayName(ruleId: NdRuleId): string {
  switch (ruleId) {
    case "implication-intro":
      return "→導入 (→I)";
    case "implication-elim":
      return "→除去 (→E)";
    case "conjunction-intro":
      return "∧導入 (∧I)";
    case "conjunction-elim-left":
      return "∧除去左 (∧E_L)";
    case "conjunction-elim-right":
      return "∧除去右 (∧E_R)";
    case "disjunction-intro-left":
      return "∨導入左 (∨I_L)";
    case "disjunction-intro-right":
      return "∨導入右 (∨I_R)";
    case "disjunction-elim":
      return "∨除去 (∨E)";
    case "weakening":
      return "弱化 (w)";
    case "efq":
      return "爆発律 (EFQ)";
    case "dne":
      return "二重否定除去 (DNE)";
    default: {
      /* v8 ignore start */
      const _exhaustive: never = ruleId;
      return _exhaustive;
      /* v8 ignore stop */
    }
  }
}
