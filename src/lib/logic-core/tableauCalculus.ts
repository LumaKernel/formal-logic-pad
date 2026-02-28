/**
 * タブロー式シーケント計算 (Tableau-style Sequent Calculus: TAB) の証明図モジュール。
 *
 * 戸次大介『数理論理学』第12章に基づく。
 * ゲンツェン流シーケント計算(sequentCalculus.ts)とは独立した、タブロー式専用の証明構造。
 *
 * 特徴:
 * - シーケントの右辺が常に空（Γ ⇒ の形）
 * - 構造規則は交換(e)のみ（弱化・縮約は許容規則として導出可能）
 * - 否定形の論理式に対する専用規則（¬∧, ¬∨, ¬→, ¬∀, ¬∃）を持つ
 * - 公理は基本式(BS): ¬φ, φ が同じ枝にあれば閉じる
 *
 * TAB と LK-CUT の等価性 (戸次本 §12.4):
 *   TAB = LK-CUT（カット付きシーケント計算と証明力が等価）
 *
 * 主論理式・副論理式 (戸次本 §12.2 表):
 * - 各規則の結論に残る主論理式と、前提に追加される副論理式が明確に定義される
 *
 * @see sequentCalculus.ts ゲンツェン流シーケント計算
 * @see naturalDeduction.ts 自然演繹の証明図
 */

import type { Formula } from "./formula";
import type { Term } from "./term";
import type { Sequent } from "./sequentCalculus";

// ── TAB用シーケント ──────────────────────────────────────────

/**
 * TABシーケント型。右辺が常に空であることを型レベルでは強制しないが、
 * TABの全規則で右辺は空であり、バリデーションで検証する。
 *
 * Sequent型を再利用する（succedents は常に []）。
 * これにより、LK-CUTとの等価性の議論で Sequent 型を共有できる。
 */
export type TabSequent = Sequent;

/**
 * TABシーケントのファクトリ関数。右辺は常に空。
 */
export const tabSequent = (antecedents: readonly Formula[]): TabSequent => ({
  antecedents,
  succedents: [],
});

// ── 公理 ──────────────────────────────────────────────────

/**
 * 基本式 (BS: Basic Sequent)。
 * ¬φ, φ, Γ ⇒
 * 枝上に φ と ¬φ の両方が存在すれば閉じる。
 * 戸次本 定義12.1
 */
export type TabBasicSequent = {
  readonly _tag: "TabBasicSequent";
  readonly conclusion: TabSequent;
};

/**
 * ⊥公理 (⊥)。
 * ⊥, Γ ⇒
 * 戸次本 定義12.3
 */
export type TabBottom = {
  readonly _tag: "TabBottom";
  readonly conclusion: TabSequent;
};

// ── 構造規則 ──────────────────────────────────────────────

/**
 * 交換規則 (e)。
 *   Δ, ψ, φ, Γ ⇒
 *   ──────────────
 *   Δ, φ, ψ, Γ ⇒
 * 戸次本 定義12.2
 */
export type TabExchange = {
  readonly _tag: "TabExchange";
  readonly conclusion: TabSequent;
  readonly premise: TabProofNode;
  /** 交換位置（0-based: positionとposition+1が入れ替わる） */
  readonly position: number;
};

// ── 論理規則（命題） ──────────────────────────────────────

/**
 * 二重否定規則 (¬¬)。
 *   φ, ¬¬φ, Γ ⇒
 *   ──────────────
 *     ¬¬φ, Γ ⇒
 * 戸次本 定義12.3
 * 主論理式: ¬¬φ, 副論理式: φ
 */
export type TabDoubleNegation = {
  readonly _tag: "TabDoubleNegation";
  readonly conclusion: TabSequent;
  readonly premise: TabProofNode;
};

/**
 * 連言規則 (∧)。
 *   φ, ψ, φ∧ψ, Γ ⇒
 *   ──────────────────
 *      φ∧ψ, Γ ⇒
 * 戸次本 定義12.3
 * 主論理式: φ∧ψ, 副論理式: φ, ψ
 */
export type TabConjunction = {
  readonly _tag: "TabConjunction";
  readonly conclusion: TabSequent;
  readonly premise: TabProofNode;
};

/**
 * 否定連言規則 (¬∧)。2前提（分岐あり）。
 *   ¬φ, ¬(φ∧ψ), Γ ⇒    ¬ψ, ¬(φ∧ψ), Γ ⇒
 *   ─────────────────────────────────────────
 *              ¬(φ∧ψ), Γ ⇒
 * 戸次本 定義12.3
 * 主論理式: ¬(φ∧ψ), 副論理式: ¬φ, ¬ψ
 */
export type TabNegConjunction = {
  readonly _tag: "TabNegConjunction";
  readonly conclusion: TabSequent;
  readonly left: TabProofNode;
  readonly right: TabProofNode;
};

/**
 * 選言規則 (∨)。2前提（分岐あり）。
 *   φ, φ∨ψ, Γ ⇒    ψ, φ∨ψ, Γ ⇒
 *   ───────────────────────────────
 *           φ∨ψ, Γ ⇒
 * 戸次本 定義12.3
 * 主論理式: φ∨ψ, 副論理式: φ, ψ
 */
export type TabDisjunction = {
  readonly _tag: "TabDisjunction";
  readonly conclusion: TabSequent;
  readonly left: TabProofNode;
  readonly right: TabProofNode;
};

/**
 * 否定選言規則 (¬∨)。
 *   ¬φ, ¬ψ, ¬(φ∨ψ), Γ ⇒
 *   ──────────────────────
 *       ¬(φ∨ψ), Γ ⇒
 * 戸次本 定義12.3
 * 主論理式: ¬(φ∨ψ), 副論理式: ¬φ, ¬ψ
 */
export type TabNegDisjunction = {
  readonly _tag: "TabNegDisjunction";
  readonly conclusion: TabSequent;
  readonly premise: TabProofNode;
};

/**
 * 含意規則 (→)。2前提（分岐あり）。
 *   ¬φ, φ→ψ, Γ ⇒    ψ, φ→ψ, Γ ⇒
 *   ─────────────────────────────────
 *            φ→ψ, Γ ⇒
 * 戸次本 定義12.3
 * 主論理式: φ→ψ, 副論理式: ¬φ, ψ
 */
export type TabImplication = {
  readonly _tag: "TabImplication";
  readonly conclusion: TabSequent;
  readonly left: TabProofNode;
  readonly right: TabProofNode;
};

/**
 * 否定含意規則 (¬→)。
 *   φ, ¬ψ, ¬(φ→ψ), Γ ⇒
 *   ──────────────────────
 *       ¬(φ→ψ), Γ ⇒
 * 戸次本 定義12.3
 * 主論理式: ¬(φ→ψ), 副論理式: φ, ¬ψ
 */
export type TabNegImplication = {
  readonly _tag: "TabNegImplication";
  readonly conclusion: TabSequent;
  readonly premise: TabProofNode;
};

// ── 論理規則（量化子） ──────────────────────────────────────

/**
 * 全称規則 (∀)。
 *   φ[τ/ξ], ∀ξφ, Γ ⇒
 *   ───────────────────
 *      ∀ξφ, Γ ⇒
 * τは任意の項。
 * 戸次本 定義12.3
 * 主論理式: ∀ξφ, 副論理式: φ[τ/ξ]
 */
export type TabUniversal = {
  readonly _tag: "TabUniversal";
  readonly conclusion: TabSequent;
  readonly premise: TabProofNode;
  /** 代入する項 τ */
  readonly substitutedTerm: Term;
};

/**
 * 否定全称規則 (¬∀)。
 *   ¬φ[ζ/ξ], ¬∀ξφ, Γ ⇒
 *   ─────────────────────
 *       ¬∀ξφ, Γ ⇒
 * ζ は変項。ただし ζ ∉ fv(Γ) ∪ fv(¬∀ξφ)。
 * 戸次本 定義12.3
 * 主論理式: ¬∀ξφ, 副論理式: ¬φ[ζ/ξ]
 */
export type TabNegUniversal = {
  readonly _tag: "TabNegUniversal";
  readonly conclusion: TabSequent;
  readonly premise: TabProofNode;
  /** 固有変項名 ζ */
  readonly eigenVariable: string;
};

/**
 * 存在規則 (∃)。
 *   φ[ζ/ξ], ∃ξφ, Γ ⇒
 *   ───────────────────
 *      ∃ξφ, Γ ⇒
 * ζ は変項。ただし ζ ∉ fv(Γ) ∪ fv(∃ξφ)。
 * 戸次本 定義12.3
 * 主論理式: ∃ξφ, 副論理式: φ[ζ/ξ]
 */
export type TabExistential = {
  readonly _tag: "TabExistential";
  readonly conclusion: TabSequent;
  readonly premise: TabProofNode;
  /** 固有変項名 ζ */
  readonly eigenVariable: string;
};

/**
 * 否定存在規則 (¬∃)。
 *   ¬φ[τ/ξ], ¬∃ξφ, Γ ⇒
 *   ─────────────────────
 *       ¬∃ξφ, Γ ⇒
 * τ は任意の項。
 * 戸次本 定義12.3
 * 主論理式: ¬∃ξφ, 副論理式: ¬φ[τ/ξ]
 */
export type TabNegExistential = {
  readonly _tag: "TabNegExistential";
  readonly conclusion: TabSequent;
  readonly premise: TabProofNode;
  /** 代入する項 τ */
  readonly substitutedTerm: Term;
};

// ── 証明図ノードの統一型 ──────────────────────────────────

/**
 * タブロー式シーケント計算の証明図ノード (discriminated union)。
 *
 * 変更時に同期すべきもの:
 * - この型定義のメンバー追加時は以下のswitch文すべてを更新:
 *   getTabConclusion, countTabNodes, tabProofDepth, validateTabNode
 * - index.ts のエクスポート
 * - tableauCalculus.test.ts のテスト
 */
export type TabProofNode =
  | TabBasicSequent
  | TabBottom
  | TabExchange
  | TabDoubleNegation
  | TabConjunction
  | TabNegConjunction
  | TabDisjunction
  | TabNegDisjunction
  | TabImplication
  | TabNegImplication
  | TabUniversal
  | TabNegUniversal
  | TabExistential
  | TabNegExistential;

// ── ファクトリ関数 ──────────────────────────────────────────

export const tabBasicSequent = (conclusion: TabSequent): TabBasicSequent => ({
  _tag: "TabBasicSequent",
  conclusion,
});

export const tabBottom = (conclusion: TabSequent): TabBottom => ({
  _tag: "TabBottom",
  conclusion,
});

export const tabExchange = (
  premise: TabProofNode,
  position: number,
  conclusion: TabSequent,
): TabExchange => ({
  _tag: "TabExchange",
  conclusion,
  premise,
  position,
});

export const tabDoubleNegation = (
  premise: TabProofNode,
  conclusion: TabSequent,
): TabDoubleNegation => ({
  _tag: "TabDoubleNegation",
  conclusion,
  premise,
});

export const tabConjunction = (
  premise: TabProofNode,
  conclusion: TabSequent,
): TabConjunction => ({
  _tag: "TabConjunction",
  conclusion,
  premise,
});

export const tabNegConjunction = (
  left: TabProofNode,
  right: TabProofNode,
  conclusion: TabSequent,
): TabNegConjunction => ({
  _tag: "TabNegConjunction",
  conclusion,
  left,
  right,
});

export const tabDisjunction = (
  left: TabProofNode,
  right: TabProofNode,
  conclusion: TabSequent,
): TabDisjunction => ({
  _tag: "TabDisjunction",
  conclusion,
  left,
  right,
});

export const tabNegDisjunction = (
  premise: TabProofNode,
  conclusion: TabSequent,
): TabNegDisjunction => ({
  _tag: "TabNegDisjunction",
  conclusion,
  premise,
});

export const tabImplication = (
  left: TabProofNode,
  right: TabProofNode,
  conclusion: TabSequent,
): TabImplication => ({
  _tag: "TabImplication",
  conclusion,
  left,
  right,
});

export const tabNegImplication = (
  premise: TabProofNode,
  conclusion: TabSequent,
): TabNegImplication => ({
  _tag: "TabNegImplication",
  conclusion,
  premise,
});

export const tabUniversal = (
  premise: TabProofNode,
  substitutedTerm: Term,
  conclusion: TabSequent,
): TabUniversal => ({
  _tag: "TabUniversal",
  conclusion,
  premise,
  substitutedTerm,
});

export const tabNegUniversal = (
  premise: TabProofNode,
  eigenVariable: string,
  conclusion: TabSequent,
): TabNegUniversal => ({
  _tag: "TabNegUniversal",
  conclusion,
  premise,
  eigenVariable,
});

export const tabExistential = (
  premise: TabProofNode,
  eigenVariable: string,
  conclusion: TabSequent,
): TabExistential => ({
  _tag: "TabExistential",
  conclusion,
  premise,
  eigenVariable,
});

export const tabNegExistential = (
  premise: TabProofNode,
  substitutedTerm: Term,
  conclusion: TabSequent,
): TabNegExistential => ({
  _tag: "TabNegExistential",
  conclusion,
  premise,
  substitutedTerm,
});

// ── ユーティリティ ──────────────────────────────────────────

/**
 * 証明図ノードの結論シーケントを取得する。
 */
export const getTabConclusion = (node: TabProofNode): TabSequent =>
  node.conclusion;

/**
 * 証明図のすべてのノード数を返す。
 */
export const countTabNodes = (node: TabProofNode): number => {
  switch (node._tag) {
    case "TabBasicSequent":
    case "TabBottom":
      return 1;
    case "TabExchange":
    case "TabDoubleNegation":
    case "TabConjunction":
    case "TabNegDisjunction":
    case "TabNegImplication":
    case "TabUniversal":
    case "TabNegUniversal":
    case "TabExistential":
    case "TabNegExistential":
      return 1 + countTabNodes(node.premise);
    case "TabNegConjunction":
      return 1 + countTabNodes(node.left) + countTabNodes(node.right);
    case "TabDisjunction":
      return 1 + countTabNodes(node.left) + countTabNodes(node.right);
    case "TabImplication":
      return 1 + countTabNodes(node.left) + countTabNodes(node.right);
  }
  /* v8 ignore start */
  node satisfies never;
  return 0;
  /* v8 ignore stop */
};

/**
 * 証明図の深さを返す。
 */
export const tabProofDepth = (node: TabProofNode): number => {
  switch (node._tag) {
    case "TabBasicSequent":
    case "TabBottom":
      return 0;
    case "TabExchange":
    case "TabDoubleNegation":
    case "TabConjunction":
    case "TabNegDisjunction":
    case "TabNegImplication":
    case "TabUniversal":
    case "TabNegUniversal":
    case "TabExistential":
    case "TabNegExistential":
      return 1 + tabProofDepth(node.premise);
    case "TabNegConjunction":
      return 1 + Math.max(tabProofDepth(node.left), tabProofDepth(node.right));
    case "TabDisjunction":
      return 1 + Math.max(tabProofDepth(node.left), tabProofDepth(node.right));
    case "TabImplication":
      return 1 + Math.max(tabProofDepth(node.left), tabProofDepth(node.right));
  }
  /* v8 ignore start */
  node satisfies never;
  return 0;
  /* v8 ignore stop */
};

// ── バリデーション ──────────────────────────────────────────

/**
 * TABのバリデーションエラー。
 */
export type TabValidationError =
  | {
      readonly _tag: "SuccedentsNotEmpty";
      readonly conclusion: TabSequent;
    }
  | {
      readonly _tag: "BasicSequentInvalid";
      readonly conclusion: TabSequent;
    }
  | {
      readonly _tag: "BottomInvalid";
      readonly conclusion: TabSequent;
    }
  | {
      readonly _tag: "ExchangePositionOutOfRange";
      readonly position: number;
      readonly antecedentLength: number;
    }
  | {
      readonly _tag: "ExchangeMismatch";
      readonly conclusion: TabSequent;
      readonly premiseConclusion: TabSequent;
    }
  | {
      readonly _tag: "LogicalRuleMismatch";
      readonly rule: string;
      readonly conclusion: TabSequent;
    };

/**
 * TABの検証結果。
 */
export type TabValidationResult =
  | { readonly _tag: "Valid" }
  | {
      readonly _tag: "Invalid";
      readonly errors: readonly TabValidationError[];
    };

/**
 * TABの証明図を検証する。
 * 構造的な正当性（各規則の前提と結論の整合性、右辺が空であること）を検証する。
 */
export const validateTabProof = (proof: TabProofNode): TabValidationResult => {
  const errors: TabValidationError[] = [];
  validateTabNode(proof, errors);
  if (errors.length === 0) {
    return { _tag: "Valid" };
  }
  return { _tag: "Invalid", errors };
};

const validateTabNode = (
  node: TabProofNode,
  errors: TabValidationError[],
): void => {
  // 全規則共通: 右辺が空であること
  if (node.conclusion.succedents.length > 0) {
    errors.push({
      _tag: "SuccedentsNotEmpty",
      conclusion: node.conclusion,
    });
  }

  switch (node._tag) {
    case "TabBasicSequent":
      // BS: 左辺に φ と ¬φ が存在するかどうかは
      // 構造的チェックのみ（最低2つの論理式が必要）
      if (node.conclusion.antecedents.length < 2) {
        errors.push({
          _tag: "BasicSequentInvalid",
          conclusion: node.conclusion,
        });
      }
      return;
    case "TabBottom":
      // ⊥: 左辺に ⊥ が存在するかは意味的チェック
      // ここでは構造的に左辺が空でないことのみ検証
      if (node.conclusion.antecedents.length < 1) {
        errors.push({
          _tag: "BottomInvalid",
          conclusion: node.conclusion,
        });
      }
      return;
    case "TabExchange":
      validateTabNode(node.premise, errors);
      // 交換位置の範囲チェック
      if (
        node.position < 0 ||
        node.position + 1 >= node.conclusion.antecedents.length
      ) {
        errors.push({
          _tag: "ExchangePositionOutOfRange",
          position: node.position,
          antecedentLength: node.conclusion.antecedents.length,
        });
      }
      return;
    case "TabDoubleNegation":
    case "TabConjunction":
    case "TabNegDisjunction":
    case "TabNegImplication":
      validateTabNode(node.premise, errors);
      return;
    case "TabNegConjunction":
      validateTabNode(node.left, errors);
      validateTabNode(node.right, errors);
      return;
    case "TabDisjunction":
      validateTabNode(node.left, errors);
      validateTabNode(node.right, errors);
      return;
    case "TabImplication":
      validateTabNode(node.left, errors);
      validateTabNode(node.right, errors);
      return;
    case "TabUniversal":
    case "TabNegUniversal":
    case "TabExistential":
    case "TabNegExistential":
      validateTabNode(node.premise, errors);
      return;
  }
  /* v8 ignore start */
  node satisfies never;
  /* v8 ignore stop */
};

// ── 規則分類ヘルパー ──────────────────────────────────────

/**
 * TABの規則ID (UIや解説表示用)。
 */
export type TabRuleId =
  | "bs"
  | "bottom"
  | "exchange"
  | "double-negation"
  | "conjunction"
  | "neg-conjunction"
  | "disjunction"
  | "neg-disjunction"
  | "implication"
  | "neg-implication"
  | "universal"
  | "neg-universal"
  | "existential"
  | "neg-existential";

/**
 * 全TAB規則IDのリスト。
 */
export const allTabRuleIds: readonly TabRuleId[] = [
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
];

/**
 * TAB規則の表示名を返す。
 */
export const getTabRuleDisplayName = (ruleId: TabRuleId): string => {
  switch (ruleId) {
    case "bs":
      return "BS";
    case "bottom":
      return "⊥";
    case "exchange":
      return "e";
    case "double-negation":
      return "¬¬";
    case "conjunction":
      return "∧";
    case "neg-conjunction":
      return "¬∧";
    case "disjunction":
      return "∨";
    case "neg-disjunction":
      return "¬∨";
    case "implication":
      return "→";
    case "neg-implication":
      return "¬→";
    case "universal":
      return "∀";
    case "neg-universal":
      return "¬∀";
    case "existential":
      return "∃";
    case "neg-existential":
      return "¬∃";
  }
  /* v8 ignore start */
  ruleId satisfies never;
  return ruleId;
  /* v8 ignore stop */
};

/**
 * 証明図ノードの _tag から TabRuleId を取得する。
 */
export const tabNodeToRuleId = (node: TabProofNode): TabRuleId => {
  switch (node._tag) {
    case "TabBasicSequent":
      return "bs";
    case "TabBottom":
      return "bottom";
    case "TabExchange":
      return "exchange";
    case "TabDoubleNegation":
      return "double-negation";
    case "TabConjunction":
      return "conjunction";
    case "TabNegConjunction":
      return "neg-conjunction";
    case "TabDisjunction":
      return "disjunction";
    case "TabNegDisjunction":
      return "neg-disjunction";
    case "TabImplication":
      return "implication";
    case "TabNegImplication":
      return "neg-implication";
    case "TabUniversal":
      return "universal";
    case "TabNegUniversal":
      return "neg-universal";
    case "TabExistential":
      return "existential";
    case "TabNegExistential":
      return "neg-existential";
  }
  /* v8 ignore start */
  node satisfies never;
  return "bs";
  /* v8 ignore stop */
};

/**
 * 規則が分岐（2前提）を持つかどうかを返す。
 */
export const isTabBranchingRule = (ruleId: TabRuleId): boolean => {
  switch (ruleId) {
    case "neg-conjunction":
    case "disjunction":
    case "implication":
      return true;
    case "bs":
    case "bottom":
    case "exchange":
    case "double-negation":
    case "conjunction":
    case "neg-disjunction":
    case "neg-implication":
    case "universal":
    case "neg-universal":
    case "existential":
    case "neg-existential":
      return false;
  }
  /* v8 ignore start */
  ruleId satisfies never;
  return false;
  /* v8 ignore stop */
};

/**
 * 規則が固有変数条件を持つかどうかを返す。
 */
export const hasTabEigenVariableCondition = (ruleId: TabRuleId): boolean => {
  switch (ruleId) {
    case "neg-universal":
    case "existential":
      return true;
    case "bs":
    case "bottom":
    case "exchange":
    case "double-negation":
    case "conjunction":
    case "neg-conjunction":
    case "disjunction":
    case "neg-disjunction":
    case "implication":
    case "neg-implication":
    case "universal":
    case "neg-existential":
      return false;
  }
  /* v8 ignore start */
  ruleId satisfies never;
  return false;
  /* v8 ignore stop */
};
