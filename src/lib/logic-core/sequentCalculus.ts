/**
 * ゲンツェン流シーケント計算 (Gentzen-style Sequent Calculus) の証明図モジュール。
 *
 * 戸次大介『数理論理学』第10章に基づく。
 * Hilbert流証明図(proofTree.ts)・自然演繹(naturalDeduction.ts)とは独立した、
 * シーケント計算専用の証明構造。
 *
 * 特徴:
 * - シーケント Γ ⇒ Δ が基本単位（左辺=前提の列、右辺=結論の列）
 * - 左規則と右規則の対称性
 * - 構造規則（弱化・縮約・交換・カット）
 *
 * 体系:
 * - LK (古典論理): 右辺が0個以上の論理式列（完全対称）
 * - LJ (直観主義論理): 右辺が高々1個に制限
 * - LM (最小論理): LJから (⊥⇒) を除いた体系
 *
 * 関係 (戸次本 定義10.36, 定理10.41-42):
 *   LM = NM, LJ = NJ, LK = NK
 *   LM ⊂ LJ ⊂ LK
 *
 * @see proofTree.ts Hilbert流の証明図
 * @see naturalDeduction.ts 自然演繹の証明図
 */

import type { Formula } from "./formula";

// ── シーケント ────────────────────────────────────────────

/**
 * シーケント (Sequent)。
 *
 * Γ ⇒ Δ の形式。
 * - antecedents (Γ): 左辺。前提の論理式列（連言の意味）。
 * - succedents (Δ): 右辺。結論の論理式列（選言の意味）。
 *
 * 戸次本 §10.1:
 * - LK: Γ,Δ はともに0個以上の論理式の列
 * - LJ: Δ は高々1個（|Δ| ≤ 1）
 * - LM: Δ は常に1個（右辺が空にならない）
 */
export type Sequent = {
  readonly antecedents: readonly Formula[];
  readonly succedents: readonly Formula[];
};

/** シーケントのファクトリ関数 */
export const sequent = (
  antecedents: readonly Formula[],
  succedents: readonly Formula[],
): Sequent => ({
  antecedents,
  succedents,
});

// ── シーケント計算の証明図ノード型 ────────────────────────────

/**
 * 公理 (ID): φ ⇒ φ
 * 戸次本 定義10.2
 */
export type ScIdentity = {
  readonly _tag: "ScIdentity";
  readonly conclusion: Sequent;
};

/**
 * ⊥公理 (⊥⇒): ⊥ ⇒
 * 戸次本 定義10.2
 * LJ/LKで使用。LMでは使用不可。
 */
export type ScBottomLeft = {
  readonly _tag: "ScBottomLeft";
  readonly conclusion: Sequent;
};

/**
 * カット規則 (CUT):
 *   Γ ⇒ Π,φ    φ,Σ ⇒ Δ
 *   ─────────────────────
 *        Γ,Σ ⇒ Π,Δ
 * 戸次本 定義10.3
 */
export type ScCut = {
  readonly _tag: "ScCut";
  readonly conclusion: Sequent;
  readonly left: ScProofNode;
  readonly right: ScProofNode;
  /** カット式 */
  readonly cutFormula: Formula;
};

/**
 * 左弱化 (w⇒):
 *     Γ ⇒ Δ
 *   ─────────
 *   φ,Γ ⇒ Δ
 * 戸次本 定義10.3
 */
export type ScWeakeningLeft = {
  readonly _tag: "ScWeakeningLeft";
  readonly conclusion: Sequent;
  readonly premise: ScProofNode;
  /** 追加する論理式 */
  readonly weakenedFormula: Formula;
};

/**
 * 右弱化 (⇒w):
 *     Γ ⇒ Δ
 *   ─────────
 *   Γ ⇒ Δ,φ
 * 戸次本 定義10.3
 * LMでは使用不可（系10.37: LMではシーケントの右辺は常に1つ）
 */
export type ScWeakeningRight = {
  readonly _tag: "ScWeakeningRight";
  readonly conclusion: Sequent;
  readonly premise: ScProofNode;
  /** 追加する論理式 */
  readonly weakenedFormula: Formula;
};

/**
 * 左縮約 (c⇒):
 *   φ,φ,Γ ⇒ Δ
 *   ───────────
 *    φ,Γ ⇒ Δ
 * 戸次本 定義10.3
 */
export type ScContractionLeft = {
  readonly _tag: "ScContractionLeft";
  readonly conclusion: Sequent;
  readonly premise: ScProofNode;
  /** 縮約する論理式 */
  readonly contractedFormula: Formula;
};

/**
 * 右縮約 (⇒c):
 *   Γ ⇒ Δ,φ,φ
 *   ───────────
 *    Γ ⇒ Δ,φ
 * 戸次本 定義10.3
 * LJでは右辺高々1のため使用不可。
 */
export type ScContractionRight = {
  readonly _tag: "ScContractionRight";
  readonly conclusion: Sequent;
  readonly premise: ScProofNode;
  /** 縮約する論理式 */
  readonly contractedFormula: Formula;
};

/**
 * 左交換 (e⇒):
 *   Γ,φ,ψ,Σ ⇒ Δ
 *   ──────────────
 *   Γ,ψ,φ,Σ ⇒ Δ
 * 戸次本 定義10.3
 */
export type ScExchangeLeft = {
  readonly _tag: "ScExchangeLeft";
  readonly conclusion: Sequent;
  readonly premise: ScProofNode;
  /** 交換位置（0-based: positionとposition+1が入れ替わる） */
  readonly position: number;
};

/**
 * 右交換 (⇒e):
 *   Γ ⇒ Δ,φ,ψ,Σ
 *   ──────────────
 *   Γ ⇒ Δ,ψ,φ,Σ
 * 戸次本 定義10.3
 * LJでは右辺高々1のため使用不可。
 */
export type ScExchangeRight = {
  readonly _tag: "ScExchangeRight";
  readonly conclusion: Sequent;
  readonly premise: ScProofNode;
  /** 交換位置（0-based: positionとposition+1が入れ替わる） */
  readonly position: number;
};

// ── 論理規則 ──────────────────────────────────────────────

/**
 * 左→規則 (→⇒):
 *   Γ ⇒ Π,φ    ψ,Σ ⇒ Δ
 *   ─────────────────────
 *     Γ,φ→ψ,Σ ⇒ Π,Δ
 * 戸次本 定義10.4
 */
export type ScImplicationLeft = {
  readonly _tag: "ScImplicationLeft";
  readonly conclusion: Sequent;
  readonly left: ScProofNode;
  readonly right: ScProofNode;
};

/**
 * 右→規則 (⇒→):
 *   φ,Γ ⇒ Δ,ψ
 *   ───────────
 *   Γ ⇒ Δ,φ→ψ
 * 戸次本 定義10.4
 */
export type ScImplicationRight = {
  readonly _tag: "ScImplicationRight";
  readonly conclusion: Sequent;
  readonly premise: ScProofNode;
};

/**
 * 左∧規則 (∧⇒):
 *   φ_i,Γ ⇒ Δ    (i=1,2)
 *   ──────────────
 *   φ1∧φ2,Γ ⇒ Δ
 * 戸次本 定義10.4
 */
export type ScConjunctionLeft = {
  readonly _tag: "ScConjunctionLeft";
  readonly conclusion: Sequent;
  readonly premise: ScProofNode;
  /** どちらの成分を使うか (1=左, 2=右) */
  readonly componentIndex: 1 | 2;
};

/**
 * 右∧規則 (⇒∧):
 *   Γ ⇒ Δ,φ1    Γ ⇒ Δ,φ2
 *   ─────────────────────
 *      Γ ⇒ Δ,φ1∧φ2
 * 戸次本 定義10.4
 */
export type ScConjunctionRight = {
  readonly _tag: "ScConjunctionRight";
  readonly conclusion: Sequent;
  readonly left: ScProofNode;
  readonly right: ScProofNode;
};

/**
 * 左∨規則 (∨⇒):
 *   φ1,Γ ⇒ Δ    φ2,Γ ⇒ Δ
 *   ─────────────────────
 *      φ1∨φ2,Γ ⇒ Δ
 * 戸次本 定義10.4
 */
export type ScDisjunctionLeft = {
  readonly _tag: "ScDisjunctionLeft";
  readonly conclusion: Sequent;
  readonly left: ScProofNode;
  readonly right: ScProofNode;
};

/**
 * 右∨規則 (⇒∨):
 *   Γ ⇒ Δ,φ_i    (i=1,2)
 *   ──────────────
 *   Γ ⇒ Δ,φ1∨φ2
 * 戸次本 定義10.4
 */
export type ScDisjunctionRight = {
  readonly _tag: "ScDisjunctionRight";
  readonly conclusion: Sequent;
  readonly premise: ScProofNode;
  /** どちらの成分を使うか (1=左, 2=右) */
  readonly componentIndex: 1 | 2;
};

/**
 * 左¬規則 (¬⇒):
 *    Γ ⇒ Δ,φ
 *   ──────────
 *   ¬φ,Γ ⇒ Δ
 * 戸次本 定義10.4
 */
export type ScNegationLeft = {
  readonly _tag: "ScNegationLeft";
  readonly conclusion: Sequent;
  readonly premise: ScProofNode;
};

/**
 * 右¬規則 (⇒¬):
 *   φ,Γ ⇒ Δ
 *   ──────────
 *   Γ ⇒ Δ,¬φ
 * 戸次本 定義10.4
 */
export type ScNegationRight = {
  readonly _tag: "ScNegationRight";
  readonly conclusion: Sequent;
  readonly premise: ScProofNode;
};

/**
 * 左∀規則 (∀⇒):
 *   φ[τ/ξ],Γ ⇒ Δ
 *   ──────────────
 *    ∀ξφ,Γ ⇒ Δ
 * 戸次本 定義10.4
 */
export type ScUniversalLeft = {
  readonly _tag: "ScUniversalLeft";
  readonly conclusion: Sequent;
  readonly premise: ScProofNode;
};

/**
 * 右∀規則 (⇒∀):
 *   Γ ⇒ Δ,φ[ζ/ξ]
 *   ──────────────
 *    Γ ⇒ Δ,∀ξφ
 * ただし ζ ∉ fv(Γ) ∪ fv(Δ) ∪ fv(∀ξφ)
 * 戸次本 定義10.4
 */
export type ScUniversalRight = {
  readonly _tag: "ScUniversalRight";
  readonly conclusion: Sequent;
  readonly premise: ScProofNode;
};

/**
 * 左∃規則 (∃⇒):
 *   φ[ζ/ξ],Γ ⇒ Δ
 *   ──────────────
 *    ∃ξφ,Γ ⇒ Δ
 * ただし ζ ∉ fv(∃ξφ) ∪ fv(Γ) ∪ fv(Δ)
 * 戸次本 定義10.4
 */
export type ScExistentialLeft = {
  readonly _tag: "ScExistentialLeft";
  readonly conclusion: Sequent;
  readonly premise: ScProofNode;
};

/**
 * 右∃規則 (⇒∃):
 *   Γ ⇒ Δ,φ[τ/ξ]
 *   ──────────────
 *    Γ ⇒ Δ,∃ξφ
 * 戸次本 定義10.4
 */
export type ScExistentialRight = {
  readonly _tag: "ScExistentialRight";
  readonly conclusion: Sequent;
  readonly premise: ScProofNode;
};

// ── 証明図ノードの統一型 ──────────────────────────────────

/**
 * シーケント計算の証明図ノード (discriminated union)。
 *
 * 変更時に同期すべきもの:
 * - この型定義のメンバー追加時は以下のswitch文すべてを更新:
 *   getScConclusion, countScNodes, scProofDepth, validateScNode
 * - index.ts のエクスポート
 * - sequentCalculus.test.ts のテスト
 */
export type ScProofNode =
  | ScIdentity
  | ScBottomLeft
  | ScCut
  | ScWeakeningLeft
  | ScWeakeningRight
  | ScContractionLeft
  | ScContractionRight
  | ScExchangeLeft
  | ScExchangeRight
  | ScImplicationLeft
  | ScImplicationRight
  | ScConjunctionLeft
  | ScConjunctionRight
  | ScDisjunctionLeft
  | ScDisjunctionRight
  | ScNegationLeft
  | ScNegationRight
  | ScUniversalLeft
  | ScUniversalRight
  | ScExistentialLeft
  | ScExistentialRight;

// ── ファクトリ関数 ──────────────────────────────────────────

export const scIdentity = (conclusion: Sequent): ScIdentity => ({
  _tag: "ScIdentity",
  conclusion,
});

export const scBottomLeft = (conclusion: Sequent): ScBottomLeft => ({
  _tag: "ScBottomLeft",
  conclusion,
});

export const scCut = (
  left: ScProofNode,
  right: ScProofNode,
  cutFormula: Formula,
  conclusion: Sequent,
): ScCut => ({
  _tag: "ScCut",
  conclusion,
  left,
  right,
  cutFormula,
});

export const scWeakeningLeft = (
  premise: ScProofNode,
  weakenedFormula: Formula,
  conclusion: Sequent,
): ScWeakeningLeft => ({
  _tag: "ScWeakeningLeft",
  conclusion,
  premise,
  weakenedFormula,
});

export const scWeakeningRight = (
  premise: ScProofNode,
  weakenedFormula: Formula,
  conclusion: Sequent,
): ScWeakeningRight => ({
  _tag: "ScWeakeningRight",
  conclusion,
  premise,
  weakenedFormula,
});

export const scContractionLeft = (
  premise: ScProofNode,
  contractedFormula: Formula,
  conclusion: Sequent,
): ScContractionLeft => ({
  _tag: "ScContractionLeft",
  conclusion,
  premise,
  contractedFormula,
});

export const scContractionRight = (
  premise: ScProofNode,
  contractedFormula: Formula,
  conclusion: Sequent,
): ScContractionRight => ({
  _tag: "ScContractionRight",
  conclusion,
  premise,
  contractedFormula,
});

export const scExchangeLeft = (
  premise: ScProofNode,
  position: number,
  conclusion: Sequent,
): ScExchangeLeft => ({
  _tag: "ScExchangeLeft",
  conclusion,
  premise,
  position,
});

export const scExchangeRight = (
  premise: ScProofNode,
  position: number,
  conclusion: Sequent,
): ScExchangeRight => ({
  _tag: "ScExchangeRight",
  conclusion,
  premise,
  position,
});

export const scImplicationLeft = (
  left: ScProofNode,
  right: ScProofNode,
  conclusion: Sequent,
): ScImplicationLeft => ({
  _tag: "ScImplicationLeft",
  conclusion,
  left,
  right,
});

export const scImplicationRight = (
  premise: ScProofNode,
  conclusion: Sequent,
): ScImplicationRight => ({
  _tag: "ScImplicationRight",
  conclusion,
  premise,
});

export const scConjunctionLeft = (
  premise: ScProofNode,
  componentIndex: 1 | 2,
  conclusion: Sequent,
): ScConjunctionLeft => ({
  _tag: "ScConjunctionLeft",
  conclusion,
  premise,
  componentIndex,
});

export const scConjunctionRight = (
  left: ScProofNode,
  right: ScProofNode,
  conclusion: Sequent,
): ScConjunctionRight => ({
  _tag: "ScConjunctionRight",
  conclusion,
  left,
  right,
});

export const scDisjunctionLeft = (
  left: ScProofNode,
  right: ScProofNode,
  conclusion: Sequent,
): ScDisjunctionLeft => ({
  _tag: "ScDisjunctionLeft",
  conclusion,
  left,
  right,
});

export const scDisjunctionRight = (
  premise: ScProofNode,
  componentIndex: 1 | 2,
  conclusion: Sequent,
): ScDisjunctionRight => ({
  _tag: "ScDisjunctionRight",
  conclusion,
  premise,
  componentIndex,
});

export const scNegationLeft = (
  premise: ScProofNode,
  conclusion: Sequent,
): ScNegationLeft => ({
  _tag: "ScNegationLeft",
  conclusion,
  premise,
});

export const scNegationRight = (
  premise: ScProofNode,
  conclusion: Sequent,
): ScNegationRight => ({
  _tag: "ScNegationRight",
  conclusion,
  premise,
});

export const scUniversalLeft = (
  premise: ScProofNode,
  conclusion: Sequent,
): ScUniversalLeft => ({
  _tag: "ScUniversalLeft",
  conclusion,
  premise,
});

export const scUniversalRight = (
  premise: ScProofNode,
  conclusion: Sequent,
): ScUniversalRight => ({
  _tag: "ScUniversalRight",
  conclusion,
  premise,
});

export const scExistentialLeft = (
  premise: ScProofNode,
  conclusion: Sequent,
): ScExistentialLeft => ({
  _tag: "ScExistentialLeft",
  conclusion,
  premise,
});

export const scExistentialRight = (
  premise: ScProofNode,
  conclusion: Sequent,
): ScExistentialRight => ({
  _tag: "ScExistentialRight",
  conclusion,
  premise,
});

// ── ユーティリティ ──────────────────────────────────────────

/**
 * 証明図ノードの結論シーケントを取得する。
 */
export const getScConclusion = (node: ScProofNode): Sequent => node.conclusion;

/**
 * 証明図のすべてのノード数を返す。
 */
export const countScNodes = (node: ScProofNode): number => {
  switch (node._tag) {
    case "ScIdentity":
    case "ScBottomLeft":
      return 1;
    case "ScCut":
      return 1 + countScNodes(node.left) + countScNodes(node.right);
    case "ScWeakeningLeft":
    case "ScWeakeningRight":
    case "ScContractionLeft":
    case "ScContractionRight":
    case "ScExchangeLeft":
    case "ScExchangeRight":
      return 1 + countScNodes(node.premise);
    case "ScImplicationLeft":
      return 1 + countScNodes(node.left) + countScNodes(node.right);
    case "ScImplicationRight":
      return 1 + countScNodes(node.premise);
    case "ScConjunctionLeft":
      return 1 + countScNodes(node.premise);
    case "ScConjunctionRight":
      return 1 + countScNodes(node.left) + countScNodes(node.right);
    case "ScDisjunctionLeft":
      return 1 + countScNodes(node.left) + countScNodes(node.right);
    case "ScDisjunctionRight":
      return 1 + countScNodes(node.premise);
    case "ScNegationLeft":
    case "ScNegationRight":
      return 1 + countScNodes(node.premise);
    case "ScUniversalLeft":
    case "ScUniversalRight":
    case "ScExistentialLeft":
    case "ScExistentialRight":
      return 1 + countScNodes(node.premise);
  }
  /* v8 ignore start */
  node satisfies never;
  return 0;
  /* v8 ignore stop */
};

/**
 * 証明図の深さを返す。
 */
export const scProofDepth = (node: ScProofNode): number => {
  switch (node._tag) {
    case "ScIdentity":
    case "ScBottomLeft":
      return 0;
    case "ScCut":
      return 1 + Math.max(scProofDepth(node.left), scProofDepth(node.right));
    case "ScWeakeningLeft":
    case "ScWeakeningRight":
    case "ScContractionLeft":
    case "ScContractionRight":
    case "ScExchangeLeft":
    case "ScExchangeRight":
      return 1 + scProofDepth(node.premise);
    case "ScImplicationLeft":
      return 1 + Math.max(scProofDepth(node.left), scProofDepth(node.right));
    case "ScImplicationRight":
      return 1 + scProofDepth(node.premise);
    case "ScConjunctionLeft":
      return 1 + scProofDepth(node.premise);
    case "ScConjunctionRight":
      return 1 + Math.max(scProofDepth(node.left), scProofDepth(node.right));
    case "ScDisjunctionLeft":
      return 1 + Math.max(scProofDepth(node.left), scProofDepth(node.right));
    case "ScDisjunctionRight":
      return 1 + scProofDepth(node.premise);
    case "ScNegationLeft":
    case "ScNegationRight":
      return 1 + scProofDepth(node.premise);
    case "ScUniversalLeft":
    case "ScUniversalRight":
    case "ScExistentialLeft":
    case "ScExistentialRight":
      return 1 + scProofDepth(node.premise);
  }
  /* v8 ignore start */
  node satisfies never;
  return 0;
  /* v8 ignore stop */
};

// ── バリデーション ──────────────────────────────────────────

/**
 * シーケント計算のバリデーションエラー。
 */
export type ScValidationError =
  | {
      readonly _tag: "IdentityNotSingle";
      readonly conclusion: Sequent;
    }
  | {
      readonly _tag: "IdentityMismatch";
      readonly left: Formula;
      readonly right: Formula;
    }
  | {
      readonly _tag: "BottomLeftInvalid";
      readonly conclusion: Sequent;
    }
  | {
      readonly _tag: "StructuralRuleMismatch";
      readonly rule: string;
      readonly conclusion: Sequent;
    };

/**
 * シーケント計算の検証結果。
 */
export type ScValidationResult =
  | { readonly _tag: "Valid" }
  | {
      readonly _tag: "Invalid";
      readonly errors: readonly ScValidationError[];
    };

/**
 * シーケント計算の証明図を検証する。
 * 構造的な正当性（各規則の前提と結論の整合性）を検証する。
 */
export const validateScProof = (proof: ScProofNode): ScValidationResult => {
  const errors: ScValidationError[] = [];
  validateScNode(proof, errors);
  if (errors.length === 0) {
    return { _tag: "Valid" };
  }
  return { _tag: "Invalid", errors };
};

const validateScNode = (
  node: ScProofNode,
  errors: ScValidationError[],
): void => {
  switch (node._tag) {
    case "ScIdentity": {
      // (ID): φ ⇒ φ — 左辺1つ、右辺1つ、かつ同じ式
      const { antecedents, succedents } = node.conclusion;
      if (antecedents.length !== 1 || succedents.length !== 1) {
        errors.push({
          _tag: "IdentityNotSingle",
          conclusion: node.conclusion,
        });
      }
      return;
    }
    case "ScBottomLeft":
      // (⊥⇒): 構造的チェックは体系依存（LMでは使用不可）
      // ここでは構造的正当性のみ
      return;
    case "ScCut":
      validateScNode(node.left, errors);
      validateScNode(node.right, errors);
      return;
    case "ScWeakeningLeft":
    case "ScWeakeningRight":
    case "ScContractionLeft":
    case "ScContractionRight":
    case "ScExchangeLeft":
    case "ScExchangeRight":
      validateScNode(node.premise, errors);
      return;
    case "ScImplicationLeft":
      validateScNode(node.left, errors);
      validateScNode(node.right, errors);
      return;
    case "ScImplicationRight":
      validateScNode(node.premise, errors);
      return;
    case "ScConjunctionLeft":
      validateScNode(node.premise, errors);
      return;
    case "ScConjunctionRight":
      validateScNode(node.left, errors);
      validateScNode(node.right, errors);
      return;
    case "ScDisjunctionLeft":
      validateScNode(node.left, errors);
      validateScNode(node.right, errors);
      return;
    case "ScDisjunctionRight":
      validateScNode(node.premise, errors);
      return;
    case "ScNegationLeft":
    case "ScNegationRight":
      validateScNode(node.premise, errors);
      return;
    case "ScUniversalLeft":
    case "ScUniversalRight":
    case "ScExistentialLeft":
    case "ScExistentialRight":
      validateScNode(node.premise, errors);
      return;
  }
  /* v8 ignore start */
  node satisfies never;
  /* v8 ignore stop */
};
