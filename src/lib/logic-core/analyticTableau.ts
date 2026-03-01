/**
 * 分析的タブロー (Analytic Tableau / Semantic Tableau) モジュール。
 *
 * 戸次大介『数理論理学』第6章に基づく。
 * 背理法に基づく証明法: 証明したい式の否定を仮定し、木構造上で規則を
 * 適用しながらすべての枝を閉じること（矛盾の導出）で証明を完成させる。
 *
 * TAB（タブロー式シーケント計算, Ch.12）との関係:
 * - TABは分析的タブローをシーケント計算として再定式化したもの
 * - 本質的に同じ規則を持つが、表現が異なる
 *   - TAB: シーケント Γ ⇒（左辺のみ）
 *   - AT: 署名付き論理式の木（1ノード = 1論理式）
 *
 * 規則の分類 (α/β/γ/δ):
 * - α規則（非分岐）: 1つの前提から1-2個の帰結を同一枝上に追加
 * - β規則（分岐）: 1つの前提から2つの枝に分岐
 * - γ規則（全称）: 任意の項で代入（∀-true, ∃-false）
 * - δ規則（存在）: 固有変数で代入（∀-false, ∃-true）
 *
 * @see tableauCalculus.ts タブロー式シーケント計算
 */

import type { Formula } from "./formula";
import type { Term } from "./term";
import { TermVariable } from "./term";
import { substituteTermVariableInFormula } from "./substitution";
import { freeVariablesInFormula } from "./freeVariables";

// ── 署名付き論理式 ─────────────────────────────────────────────

/**
 * 符号: T = 真を仮定、F = 偽を仮定。
 *
 * bekki 6.5節の簡略化記法:
 * - T(φ) ≡ [[φ]]_{M,g} = 1 ≡ 簡略表記 φ
 * - F(φ) ≡ [[φ]]_{M,g} = 0 ≡ 簡略表記 ¬φ
 */
export type Sign = "T" | "F";

/**
 * 署名付き論理式。分析的タブローのノードの基本要素。
 */
export type SignedFormula = {
  readonly sign: Sign;
  readonly formula: Formula;
};

/**
 * 署名付き論理式のファクトリ関数。
 */
export const signedFormula = (sign: Sign, formula: Formula): SignedFormula => ({
  sign,
  formula,
});

// ── 規則ID ────────────────────────────────────────────────────

/**
 * 分析的タブロー規則のID。
 *
 * α規則（非分岐）:
 * - "alpha-conj": T(φ∧ψ) → T(φ), T(ψ)
 * - "alpha-neg-disj": F(φ∨ψ) → F(φ), F(ψ)
 * - "alpha-neg-impl": F(φ→ψ) → T(φ), F(ψ)
 * - "alpha-double-neg-t": T(¬¬φ) → T(φ)
 * - "alpha-double-neg-f": F(¬¬φ) → F(φ)
 * - "alpha-neg-t": T(¬φ) → F(φ)
 * - "alpha-neg-f": F(¬φ) → T(φ)
 *
 * β規則（分岐）:
 * - "beta-neg-conj": F(φ∧ψ) → [F(φ) | F(ψ)]
 * - "beta-disj": T(φ∨ψ) → [T(φ) | T(ψ)]
 * - "beta-impl": T(φ→ψ) → [F(φ) | T(ψ)]
 *
 * γ規則（全称、任意の項で代入）:
 * - "gamma-univ": T(∀ξφ) → T(φ[τ/ξ])
 * - "gamma-neg-exist": F(∃ξφ) → F(φ[τ/ξ])
 *
 * δ規則（存在、固有変数条件）:
 * - "delta-neg-univ": F(∀ξφ) → F(φ[ζ/ξ])
 * - "delta-exist": T(∃ξφ) → T(φ[ζ/ξ])
 *
 * 公理（枝の閉じ条件）:
 * - "closure": 同一枝上に T(φ) と F(φ) が存在 → 閉じる
 *
 * 注: ⊥ (Bottom) や ⊤ (Top) は Formula union に存在しないため、
 * これらの閉じ条件は定義しない。必要であれば Predicate として表現する。
 */
export type AtRuleId =
  | "alpha-conj"
  | "alpha-neg-disj"
  | "alpha-neg-impl"
  | "alpha-double-neg-t"
  | "alpha-double-neg-f"
  | "alpha-neg-t"
  | "alpha-neg-f"
  | "beta-neg-conj"
  | "beta-disj"
  | "beta-impl"
  | "gamma-univ"
  | "gamma-neg-exist"
  | "delta-neg-univ"
  | "delta-exist"
  | "closure";

/**
 * 全規則IDのリスト。
 */
export const allAtRuleIds: readonly AtRuleId[] = [
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
];

// ── 規則分類 ──────────────────────────────────────────────────

/**
 * α規則（非分岐）かどうか判定する。
 */
export const isAlphaRule = (ruleId: AtRuleId) =>
  ruleId === "alpha-conj" ||
  ruleId === "alpha-neg-disj" ||
  ruleId === "alpha-neg-impl" ||
  ruleId === "alpha-double-neg-t" ||
  ruleId === "alpha-double-neg-f" ||
  ruleId === "alpha-neg-t" ||
  ruleId === "alpha-neg-f";

/**
 * β規則（分岐）かどうか判定する。
 */
export const isBetaRule = (ruleId: AtRuleId) =>
  ruleId === "beta-neg-conj" ||
  ruleId === "beta-disj" ||
  ruleId === "beta-impl";

/**
 * γ規則（全称、任意の項で代入）かどうか判定する。
 */
export const isGammaRule = (ruleId: AtRuleId) =>
  ruleId === "gamma-univ" || ruleId === "gamma-neg-exist";

/**
 * δ規則（存在、固有変数条件）かどうか判定する。
 */
export const isDeltaRule = (ruleId: AtRuleId) =>
  ruleId === "delta-neg-univ" || ruleId === "delta-exist";

/**
 * 閉じ条件（公理）かどうか判定する。
 */
export const isClosureRule = (ruleId: AtRuleId) => ruleId === "closure";

// ── 規則表示名 ────────────────────────────────────────────────

/**
 * 規則IDから表示名を取得する。
 */
export const getAtRuleDisplayName = (ruleId: AtRuleId): string => {
  switch (ruleId) {
    case "alpha-conj":
      return "T(∧)";
    case "alpha-neg-disj":
      return "F(∨)";
    case "alpha-neg-impl":
      return "F(→)";
    case "alpha-double-neg-t":
      return "T(¬¬)";
    case "alpha-double-neg-f":
      return "F(¬¬)";
    case "alpha-neg-t":
      return "T(¬)";
    case "alpha-neg-f":
      return "F(¬)";
    case "beta-neg-conj":
      return "F(∧)";
    case "beta-disj":
      return "T(∨)";
    case "beta-impl":
      return "T(→)";
    case "gamma-univ":
      return "T(∀)";
    case "gamma-neg-exist":
      return "F(∃)";
    case "delta-neg-univ":
      return "F(∀)";
    case "delta-exist":
      return "T(∃)";
    case "closure":
      return "×";
    /* v8 ignore start */
    default: {
      const _: never = ruleId;
      return `unknown(${_ satisfies string})`;
    }
    /* v8 ignore stop */
  }
};

// ── α規則の適用結果 ──────────────────────────────────────────

/**
 * α規則の適用結果。1-2個の署名付き論理式を同一枝上に追加する。
 */
export type AlphaResult = {
  readonly _tag: "alpha";
  readonly ruleId: AtRuleId;
  /** 追加される署名付き論理式（1個または2個） */
  readonly results:
    | readonly [SignedFormula]
    | readonly [SignedFormula, SignedFormula];
};

/**
 * β規則の適用結果。2つの枝に分岐する。
 */
export type BetaResult = {
  readonly _tag: "beta";
  readonly ruleId: AtRuleId;
  /** 左枝に追加される署名付き論理式 */
  readonly left: SignedFormula;
  /** 右枝に追加される署名付き論理式 */
  readonly right: SignedFormula;
};

/**
 * γ規則の適用結果。代入結果の署名付き論理式を同一枝上に追加する。
 */
export type GammaResult = {
  readonly _tag: "gamma";
  readonly ruleId: AtRuleId;
  readonly result: SignedFormula;
  /** 代入に使用された項 */
  readonly substitutedTerm: Term;
};

/**
 * δ規則の適用結果。固有変数による代入結果を同一枝上に追加する。
 */
export type DeltaResult = {
  readonly _tag: "delta";
  readonly ruleId: AtRuleId;
  readonly result: SignedFormula;
  /** 固有変数名 */
  readonly eigenVariable: string;
};

/**
 * 規則適用結果の union 型。
 */
export type AtRuleResult = AlphaResult | BetaResult | GammaResult | DeltaResult;

// ── α規則の適用 ──────────────────────────────────────────────

/**
 * α規則を署名付き論理式に適用する。
 * 適用不可能な場合は undefined を返す。
 */
export const applyAlphaRule = (sf: SignedFormula): AlphaResult | undefined => {
  const { sign, formula } = sf;

  // T(φ∧ψ) → T(φ), T(ψ)
  if (sign === "T" && formula._tag === "Conjunction") {
    return {
      _tag: "alpha",
      ruleId: "alpha-conj",
      results: [
        signedFormula("T", formula.left),
        signedFormula("T", formula.right),
      ],
    };
  }

  // F(φ∨ψ) → F(φ), F(ψ)
  if (sign === "F" && formula._tag === "Disjunction") {
    return {
      _tag: "alpha",
      ruleId: "alpha-neg-disj",
      results: [
        signedFormula("F", formula.left),
        signedFormula("F", formula.right),
      ],
    };
  }

  // F(φ→ψ) → T(φ), F(ψ)
  if (sign === "F" && formula._tag === "Implication") {
    return {
      _tag: "alpha",
      ruleId: "alpha-neg-impl",
      results: [
        signedFormula("T", formula.left),
        signedFormula("F", formula.right),
      ],
    };
  }

  // T(¬¬φ) → T(φ)
  if (
    sign === "T" &&
    formula._tag === "Negation" &&
    formula.formula._tag === "Negation"
  ) {
    return {
      _tag: "alpha",
      ruleId: "alpha-double-neg-t",
      results: [signedFormula("T", formula.formula.formula)],
    };
  }

  // F(¬¬φ) → F(φ)
  if (
    sign === "F" &&
    formula._tag === "Negation" &&
    formula.formula._tag === "Negation"
  ) {
    return {
      _tag: "alpha",
      ruleId: "alpha-double-neg-f",
      results: [signedFormula("F", formula.formula.formula)],
    };
  }

  // T(¬φ) → F(φ) （ただし二重否定でない場合のみ）
  if (
    sign === "T" &&
    formula._tag === "Negation" &&
    formula.formula._tag !== "Negation"
  ) {
    return {
      _tag: "alpha",
      ruleId: "alpha-neg-t",
      results: [signedFormula("F", formula.formula)],
    };
  }

  // F(¬φ) → T(φ) （ただし二重否定でない場合のみ）
  if (
    sign === "F" &&
    formula._tag === "Negation" &&
    formula.formula._tag !== "Negation"
  ) {
    return {
      _tag: "alpha",
      ruleId: "alpha-neg-f",
      results: [signedFormula("T", formula.formula)],
    };
  }

  return undefined;
};

// ── β規則の適用 ──────────────────────────────────────────────

/**
 * β規則を署名付き論理式に適用する。
 * 適用不可能な場合は undefined を返す。
 */
export const applyBetaRule = (sf: SignedFormula): BetaResult | undefined => {
  const { sign, formula } = sf;

  // F(φ∧ψ) → [F(φ) | F(ψ)]
  if (sign === "F" && formula._tag === "Conjunction") {
    return {
      _tag: "beta",
      ruleId: "beta-neg-conj",
      left: signedFormula("F", formula.left),
      right: signedFormula("F", formula.right),
    };
  }

  // T(φ∨ψ) → [T(φ) | T(ψ)]
  if (sign === "T" && formula._tag === "Disjunction") {
    return {
      _tag: "beta",
      ruleId: "beta-disj",
      left: signedFormula("T", formula.left),
      right: signedFormula("T", formula.right),
    };
  }

  // T(φ→ψ) → [F(φ) | T(ψ)]
  if (sign === "T" && formula._tag === "Implication") {
    return {
      _tag: "beta",
      ruleId: "beta-impl",
      left: signedFormula("F", formula.left),
      right: signedFormula("T", formula.right),
    };
  }

  return undefined;
};

// ── γ規則の適用 ──────────────────────────────────────────────

/**
 * γ規則を署名付き論理式と代入項に対して適用する。
 * 適用不可能な場合は undefined を返す。
 *
 * γ規則は任意の項τで代入するため、項を引数として受け取る。
 */
export const applyGammaRule = (
  sf: SignedFormula,
  term: Term,
): GammaResult | undefined => {
  const { sign, formula } = sf;

  // T(∀ξφ) → T(φ[τ/ξ])
  if (sign === "T" && formula._tag === "Universal") {
    const substituted = substituteTermVariableInFormula(
      formula.formula,
      formula.variable,
      term,
    );
    return {
      _tag: "gamma",
      ruleId: "gamma-univ",
      result: signedFormula("T", substituted),
      substitutedTerm: term,
    };
  }

  // F(∃ξφ) → F(φ[τ/ξ])
  if (sign === "F" && formula._tag === "Existential") {
    const substituted = substituteTermVariableInFormula(
      formula.formula,
      formula.variable,
      term,
    );
    return {
      _tag: "gamma",
      ruleId: "gamma-neg-exist",
      result: signedFormula("F", substituted),
      substitutedTerm: term,
    };
  }

  return undefined;
};

// ── δ規則の適用 ──────────────────────────────────────────────

/**
 * δ規則を署名付き論理式と固有変数に対して適用する。
 * 適用不可能な場合は undefined を返す。
 *
 * δ規則は固有変数条件を満たす変数ζで代入する。
 * 固有変数条件: ζ は枝上のどの論理式にも自由変数として出現しない。
 * この条件のチェックは呼び出し側の責任。
 */
export const applyDeltaRule = (
  sf: SignedFormula,
  eigenVariable: string,
): DeltaResult | undefined => {
  const { sign, formula } = sf;
  const eigenTerm: Term = new TermVariable({ name: eigenVariable });

  // F(∀ξφ) → F(φ[ζ/ξ])
  if (sign === "F" && formula._tag === "Universal") {
    const substituted = substituteTermVariableInFormula(
      formula.formula,
      formula.variable,
      eigenTerm,
    );
    return {
      _tag: "delta",
      ruleId: "delta-neg-univ",
      result: signedFormula("F", substituted),
      eigenVariable,
    };
  }

  // T(∃ξφ) → T(φ[ζ/ξ])
  if (sign === "T" && formula._tag === "Existential") {
    const substituted = substituteTermVariableInFormula(
      formula.formula,
      formula.variable,
      eigenTerm,
    );
    return {
      _tag: "delta",
      ruleId: "delta-exist",
      result: signedFormula("T", substituted),
      eigenVariable,
    };
  }

  return undefined;
};

// ── 規則の自動判定と適用 ────────────────────────────────────────

/**
 * 署名付き論理式にどの規則が適用可能かを判定する。
 * α規則またはβ規則が適用可能な場合、その規則IDを返す。
 * γ/δ規則は追加引数が必要なので別途判定する。
 */
export const classifySignedFormula = (
  sf: SignedFormula,
): AtRuleId | undefined => {
  const alpha = applyAlphaRule(sf);
  if (alpha !== undefined) return alpha.ruleId;

  const beta = applyBetaRule(sf);
  if (beta !== undefined) return beta.ruleId;

  const { sign, formula } = sf;

  // γ規則
  if (sign === "T" && formula._tag === "Universal") return "gamma-univ";
  if (sign === "F" && formula._tag === "Existential") return "gamma-neg-exist";

  // δ規則
  if (sign === "F" && formula._tag === "Universal") return "delta-neg-univ";
  if (sign === "T" && formula._tag === "Existential") return "delta-exist";

  return undefined;
};

// ── 枝の閉じ判定 ────────────────────────────────────────────

/**
 * 枝上の署名付き論理式のリストから、枝が閉じるかどうか判定する。
 * 閉じる場合、矛盾を構成する2つの署名付き論理式のインデックスペアを返す。
 *
 * 閉じ条件:
 * - 同一枝上に T(φ) と F(φ) が存在（矛盾）
 */
export type BranchClosureResult = {
  readonly ruleId: "closure";
  /** 矛盾を構成する2つの論理式のインデックス */
  readonly indices: readonly [number, number];
};

export const checkBranchClosure = (
  branch: readonly SignedFormula[],
): BranchClosureResult | undefined => {
  // T(φ) と F(φ) の矛盾チェック
  // φの構造的等価性をチェックするため、JSON文字列で比較
  const trueFormulas = new Map<string, number>();
  const falseFormulas = new Map<string, number>();

  for (let i = 0; i < branch.length; i++) {
    const sf = branch[i];
    const key = JSON.stringify(sf.formula);
    if (sf.sign === "T") {
      const falseIdx = falseFormulas.get(key);
      if (falseIdx !== undefined)
        return { ruleId: "closure", indices: [falseIdx, i] };
      trueFormulas.set(key, i);
    } else {
      const trueIdx = trueFormulas.get(key);
      if (trueIdx !== undefined)
        return { ruleId: "closure", indices: [trueIdx, i] };
      falseFormulas.set(key, i);
    }
  }

  return undefined;
};

// ── 固有変数条件のチェック ────────────────────────────────────

/**
 * 固有変数条件をチェックする。
 * δ規則で使用する変数ζが、枝上のどの論理式にも自由変数として出現しないことを検証。
 *
 * @returns true: 条件を満たす（ζは安全に使用可能）
 */
export const checkEigenVariableCondition = (
  eigenVariable: string,
  branch: readonly SignedFormula[],
): boolean => {
  for (const sf of branch) {
    const fv = freeVariablesInFormula(sf.formula);
    if (fv.has(eigenVariable)) return false;
  }
  return true;
};

// ── 規則が適用可能な署名付き論理式かどうか ──────────────────────

/**
 * 与えられた規則IDが署名付き論理式に適用可能かどうか判定する。
 */
export const canApplyRule = (ruleId: AtRuleId, sf: SignedFormula): boolean => {
  if (isClosureRule(ruleId)) return false; // closure は別の判定

  const classified = classifySignedFormula(sf);
  return classified === ruleId;
};
