/**
 * 自然演繹 (Natural Deduction) の証明図モジュール。
 *
 * 戸次大介『数理論理学』第8章に基づく。
 * Hilbert流証明図(proofTree.ts)とは独立した、自然演繹専用の証明構造。
 *
 * 特徴:
 * - 公理を持たず、推論規則のみ（導入規則+除去規則のペア）
 * - 仮定の打ち消し(discharge)が核心概念
 * - 仮定IDで打ち消しを追跡
 *
 * 体系:
 * - NM (最小論理): 基本規則のみ
 * - NJ (直観主義論理): NM + EFQ
 * - NK (古典論理): NM + DNE
 *
 * @see proofTree.ts Hilbert流の証明図
 */

import {
  type Formula,
  Implication,
  Conjunction,
  Disjunction,
  Negation,
  implication,
  conjunction,
  disjunction,
} from "./formula";
import { equalFormula } from "./equality";

// ── 仮定ID ────────────────────────────────────────────────
/**
 * 仮定を一意に識別するためのID。
 * 打ち消し時にどの仮定が打ち消されたかを追跡する。
 */
export type AssumptionId = number;

// ── 自然演繹の証明図ノード型 ────────────────────────────────

/**
 * 仮定ノード（葉ノード）。
 * 打ち消し可能な仮定を導入する。
 */
export type NdAssumption = {
  readonly _tag: "NdAssumption";
  readonly formula: Formula;
  readonly assumptionId: AssumptionId;
};

/**
 * 弱化ノード。
 * 2つの前提 φ, ψ から φ のみを結論とする（ψを捨てる）。
 * (w) 規則: 戸次本 定義8.9
 */
export type NdWeakening = {
  readonly _tag: "NdWeakening";
  readonly formula: Formula;
  /** 残す方の前提 */
  readonly kept: NdProofNode;
  /** 捨てる方の前提 */
  readonly discarded: NdProofNode;
};

/**
 * →導入ノード (→I)。
 * 仮定φの下でψが証明されたとき、φ→ψを導出し仮定を打ち消す。
 * 戸次本 8.1.3: 導入規則
 */
export type NdImplicationIntro = {
  readonly _tag: "NdImplicationIntro";
  readonly formula: Formula; // φ→ψ
  readonly premise: NdProofNode;
  /** 打ち消す仮定の論理式 */
  readonly dischargedFormula: Formula; // φ
  /** 打ち消す仮定のID */
  readonly dischargedId: AssumptionId;
};

/**
 * →除去ノード (→E = MP)。
 * φ と φ→ψ から ψ を導出する。
 * 戸次本 8.1.3: 除去規則
 */
export type NdImplicationElim = {
  readonly _tag: "NdImplicationElim";
  readonly formula: Formula; // ψ
  /** 前提: φ */
  readonly left: NdProofNode;
  /** 前提: φ→ψ */
  readonly right: NdProofNode;
};

/**
 * ∧導入ノード (∧I)。
 * φ と ψ から φ∧ψ を導出する。
 */
export type NdConjunctionIntro = {
  readonly _tag: "NdConjunctionIntro";
  readonly formula: Formula; // φ∧ψ
  readonly left: NdProofNode;
  readonly right: NdProofNode;
};

/**
 * ∧除去左ノード (∧E)。
 * φ∧ψ から φ を導出する。
 */
export type NdConjunctionElimLeft = {
  readonly _tag: "NdConjunctionElimLeft";
  readonly formula: Formula; // φ
  readonly premise: NdProofNode;
};

/**
 * ∧除去右ノード (∧E)。
 * φ∧ψ から ψ を導出する。
 */
export type NdConjunctionElimRight = {
  readonly _tag: "NdConjunctionElimRight";
  readonly formula: Formula; // ψ
  readonly premise: NdProofNode;
};

/**
 * ∨導入左ノード (∨I)。
 * φ から φ∨ψ を導出する。
 */
export type NdDisjunctionIntroLeft = {
  readonly _tag: "NdDisjunctionIntroLeft";
  readonly formula: Formula; // φ∨ψ
  readonly premise: NdProofNode;
  /** 追加する右辺 */
  readonly addedRight: Formula; // ψ
};

/**
 * ∨導入右ノード (∨I)。
 * ψ から φ∨ψ を導出する。
 */
export type NdDisjunctionIntroRight = {
  readonly _tag: "NdDisjunctionIntroRight";
  readonly formula: Formula; // φ∨ψ
  readonly premise: NdProofNode;
  /** 追加する左辺 */
  readonly addedLeft: Formula; // φ
};

/**
 * ∨除去ノード (∨E)。
 * φ∨ψ と、φからχの証明、ψからχの証明から、χを導出する。
 * 左右の仮定をそれぞれ打ち消す。
 */
export type NdDisjunctionElim = {
  readonly _tag: "NdDisjunctionElim";
  readonly formula: Formula; // χ
  /** 前提: φ∨ψ の証明 */
  readonly disjunction: NdProofNode;
  /** φからχの証明 */
  readonly leftCase: NdProofNode;
  /** 打ち消す左仮定のID */
  readonly leftDischargedId: AssumptionId;
  /** ψからχの証明 */
  readonly rightCase: NdProofNode;
  /** 打ち消す右仮定のID */
  readonly rightDischargedId: AssumptionId;
};

/**
 * EFQ規則ノード（爆発律）。
 * ⊥ から任意のφを導出する。NJの追加規則。
 * 戸次本 定義8.18
 * ⊥ は ¬φ∧φ から導出されるが、ここでは Negation を φ→⊥ と解釈し、
 * ¬φ と φ から ⊥ を得て、任意のψを導出する形にする。
 * 簡略化のため、前提が ⊥ （bottom）であることを表現する。
 * 本実装では bottom = Predicate("⊥", []) ではなく、
 * →Eで得られた ⊥ に相当する結果から任意のφを導出する形とする。
 */
export type NdEfq = {
  readonly _tag: "NdEfq";
  readonly formula: Formula; // 導出される任意の論理式
  readonly premise: NdProofNode; // ⊥ の証明（前提の結論がbottomであること）
};

/**
 * DNE規則ノード（二重否定除去）。
 * ¬¬φ から φ を導出する。NKの追加規則。
 * 戸次本 定義8.20
 */
export type NdDne = {
  readonly _tag: "NdDne";
  readonly formula: Formula; // φ
  readonly premise: NdProofNode; // ¬¬φ の証明
};

/**
 * 自然演繹の証明図ノード (discriminated union)。
 *
 * 変更時に同期すべきもの:
 * - この型定義のメンバー追加時は以下のswitch文すべてを更新:
 *   getNdConclusion, getOpenAssumptions, countNdNodes, ndProofDepth, validateNdNode
 * - index.ts のエクスポート
 * - naturalDeduction.test.ts のテスト
 */
export type NdProofNode =
  | NdAssumption
  | NdWeakening
  | NdImplicationIntro
  | NdImplicationElim
  | NdConjunctionIntro
  | NdConjunctionElimLeft
  | NdConjunctionElimRight
  | NdDisjunctionIntroLeft
  | NdDisjunctionIntroRight
  | NdDisjunctionElim
  | NdEfq
  | NdDne;

// ── ファクトリ関数 ──────────────────────────────────────────

export const assumption = (
  formula: Formula,
  assumptionId: AssumptionId,
): NdAssumption => ({
  _tag: "NdAssumption",
  formula,
  assumptionId,
});

export const weakening = (
  kept: NdProofNode,
  discarded: NdProofNode,
): NdWeakening => ({
  _tag: "NdWeakening",
  formula: getNdConclusion(kept),
  kept,
  discarded,
});

export const implicationIntro = (
  premise: NdProofNode,
  dischargedFormula: Formula,
  dischargedId: AssumptionId,
): NdImplicationIntro => ({
  _tag: "NdImplicationIntro",
  formula: implication(dischargedFormula, getNdConclusion(premise)),
  premise,
  dischargedFormula,
  dischargedId,
});

export const implicationElim = (
  left: NdProofNode,
  right: NdProofNode,
): NdImplicationElim => {
  const rightConclusion = getNdConclusion(right);
  // rightはφ→ψの形であるべき（構築時はチェックせず、バリデーション時にチェック）
  /* v8 ignore start -- 防御的フォールバック: バリデーション時にエラーとなるため通常到達しない */
  if (!(rightConclusion instanceof Implication)) {
    return { _tag: "NdImplicationElim", formula: rightConclusion, left, right };
  }
  /* v8 ignore stop */
  // fall-through: TypeScript narrows to Implication
  return {
    _tag: "NdImplicationElim",
    formula: rightConclusion.right,
    left,
    right,
  };
};

export const conjunctionIntro = (
  left: NdProofNode,
  right: NdProofNode,
): NdConjunctionIntro => ({
  _tag: "NdConjunctionIntro",
  formula: conjunction(getNdConclusion(left), getNdConclusion(right)),
  left,
  right,
});

export const conjunctionElimLeft = (
  premise: NdProofNode,
): NdConjunctionElimLeft => {
  const premConclusion = getNdConclusion(premise);
  /* v8 ignore start -- 防御的フォールバック: バリデーション時にエラーとなるため通常到達しない */
  if (!(premConclusion instanceof Conjunction)) {
    return { _tag: "NdConjunctionElimLeft", formula: premConclusion, premise };
  }
  /* v8 ignore stop */
  // fall-through: TypeScript narrows to Conjunction
  return {
    _tag: "NdConjunctionElimLeft",
    formula: premConclusion.left,
    premise,
  };
};

export const conjunctionElimRight = (
  premise: NdProofNode,
): NdConjunctionElimRight => {
  const premConclusion = getNdConclusion(premise);
  /* v8 ignore start -- 防御的フォールバック: バリデーション時にエラーとなるため通常到達しない */
  if (!(premConclusion instanceof Conjunction)) {
    return { _tag: "NdConjunctionElimRight", formula: premConclusion, premise };
  }
  /* v8 ignore stop */
  // fall-through: TypeScript narrows to Conjunction
  return {
    _tag: "NdConjunctionElimRight",
    formula: premConclusion.right,
    premise,
  };
};

export const disjunctionIntroLeft = (
  premise: NdProofNode,
  addedRight: Formula,
): NdDisjunctionIntroLeft => ({
  _tag: "NdDisjunctionIntroLeft",
  formula: disjunction(getNdConclusion(premise), addedRight),
  premise,
  addedRight,
});

export const disjunctionIntroRight = (
  addedLeft: Formula,
  premise: NdProofNode,
): NdDisjunctionIntroRight => ({
  _tag: "NdDisjunctionIntroRight",
  formula: disjunction(addedLeft, getNdConclusion(premise)),
  premise,
  addedLeft,
});

export const disjunctionElim = (
  disjunctionProof: NdProofNode,
  leftCase: NdProofNode,
  leftDischargedId: AssumptionId,
  rightCase: NdProofNode,
  rightDischargedId: AssumptionId,
): NdDisjunctionElim => ({
  _tag: "NdDisjunctionElim",
  formula: getNdConclusion(leftCase), // 両ケースの結論は同じはず（バリデーションでチェック）
  disjunction: disjunctionProof,
  leftCase,
  leftDischargedId,
  rightCase,
  rightDischargedId,
});

export const efqRule = (premise: NdProofNode, formula: Formula): NdEfq => ({
  _tag: "NdEfq",
  formula,
  premise,
});

export const dneRule = (premise: NdProofNode): NdDne => {
  const premConclusion = getNdConclusion(premise);
  // ¬¬φ → φ: 前提が ¬(¬φ) の形
  /* v8 ignore start -- 防御的フォールバック: バリデーション時にエラーとなるため通常到達しない */
  if (
    !(
      premConclusion instanceof Negation &&
      premConclusion.formula instanceof Negation
    )
  ) {
    return { _tag: "NdDne", formula: premConclusion, premise };
  }
  /* v8 ignore stop */
  // fall-through: TypeScript narrows to Negation with nested Negation
  return {
    _tag: "NdDne",
    formula: premConclusion.formula.formula,
    premise,
  };
};

// ── ユーティリティ ──────────────────────────────────────────

/**
 * 証明図ノードの結論を取得する。
 */
export const getNdConclusion = (node: NdProofNode): Formula => node.formula;

/**
 * 証明図ノードの未打ち消し仮定のIDセットを取得する。
 * 打ち消し(discharge)された仮定は除外される。
 */
export const getOpenAssumptions = (
  node: NdProofNode,
): ReadonlySet<AssumptionId> => {
  switch (node._tag) {
    case "NdAssumption":
      return new Set([node.assumptionId]);
    case "NdWeakening":
      return unionSets(
        getOpenAssumptions(node.kept),
        getOpenAssumptions(node.discarded),
      );
    case "NdImplicationIntro": {
      const premiseAssumptions = getOpenAssumptions(node.premise);
      return removeFromSet(premiseAssumptions, node.dischargedId);
    }
    case "NdImplicationElim":
      return unionSets(
        getOpenAssumptions(node.left),
        getOpenAssumptions(node.right),
      );
    case "NdConjunctionIntro":
      return unionSets(
        getOpenAssumptions(node.left),
        getOpenAssumptions(node.right),
      );
    case "NdConjunctionElimLeft":
      return getOpenAssumptions(node.premise);
    case "NdConjunctionElimRight":
      return getOpenAssumptions(node.premise);
    case "NdDisjunctionIntroLeft":
      return getOpenAssumptions(node.premise);
    case "NdDisjunctionIntroRight":
      return getOpenAssumptions(node.premise);
    case "NdDisjunctionElim": {
      const disjAssumptions = getOpenAssumptions(node.disjunction);
      const leftAssumptions = removeFromSet(
        getOpenAssumptions(node.leftCase),
        node.leftDischargedId,
      );
      const rightAssumptions = removeFromSet(
        getOpenAssumptions(node.rightCase),
        node.rightDischargedId,
      );
      return unionSets(
        disjAssumptions,
        unionSets(leftAssumptions, rightAssumptions),
      );
    }
    case "NdEfq":
      return getOpenAssumptions(node.premise);
    case "NdDne":
      return getOpenAssumptions(node.premise);
  }
  /* v8 ignore start */
  node satisfies never;
  return new Set();
  /* v8 ignore stop */
};

/**
 * 証明図のすべてのノード数を返す。
 */
export const countNdNodes = (node: NdProofNode): number => {
  switch (node._tag) {
    case "NdAssumption":
      return 1;
    case "NdWeakening":
      return 1 + countNdNodes(node.kept) + countNdNodes(node.discarded);
    case "NdImplicationIntro":
      return 1 + countNdNodes(node.premise);
    case "NdImplicationElim":
      return 1 + countNdNodes(node.left) + countNdNodes(node.right);
    case "NdConjunctionIntro":
      return 1 + countNdNodes(node.left) + countNdNodes(node.right);
    case "NdConjunctionElimLeft":
      return 1 + countNdNodes(node.premise);
    case "NdConjunctionElimRight":
      return 1 + countNdNodes(node.premise);
    case "NdDisjunctionIntroLeft":
      return 1 + countNdNodes(node.premise);
    case "NdDisjunctionIntroRight":
      return 1 + countNdNodes(node.premise);
    case "NdDisjunctionElim":
      return (
        1 +
        countNdNodes(node.disjunction) +
        countNdNodes(node.leftCase) +
        countNdNodes(node.rightCase)
      );
    case "NdEfq":
      return 1 + countNdNodes(node.premise);
    case "NdDne":
      return 1 + countNdNodes(node.premise);
  }
  /* v8 ignore start */
  node satisfies never;
  return 0;
  /* v8 ignore stop */
};

/**
 * 証明図の深さを返す。
 */
export const ndProofDepth = (node: NdProofNode): number => {
  switch (node._tag) {
    case "NdAssumption":
      return 0;
    case "NdWeakening":
      return (
        1 + Math.max(ndProofDepth(node.kept), ndProofDepth(node.discarded))
      );
    case "NdImplicationIntro":
      return 1 + ndProofDepth(node.premise);
    case "NdImplicationElim":
      return 1 + Math.max(ndProofDepth(node.left), ndProofDepth(node.right));
    case "NdConjunctionIntro":
      return 1 + Math.max(ndProofDepth(node.left), ndProofDepth(node.right));
    case "NdConjunctionElimLeft":
      return 1 + ndProofDepth(node.premise);
    case "NdConjunctionElimRight":
      return 1 + ndProofDepth(node.premise);
    case "NdDisjunctionIntroLeft":
      return 1 + ndProofDepth(node.premise);
    case "NdDisjunctionIntroRight":
      return 1 + ndProofDepth(node.premise);
    case "NdDisjunctionElim":
      return (
        1 +
        Math.max(
          ndProofDepth(node.disjunction),
          ndProofDepth(node.leftCase),
          ndProofDepth(node.rightCase),
        )
      );
    case "NdEfq":
      return 1 + ndProofDepth(node.premise);
    case "NdDne":
      return 1 + ndProofDepth(node.premise);
  }
  /* v8 ignore start */
  node satisfies never;
  return 0;
  /* v8 ignore stop */
};

// ── バリデーション ──────────────────────────────────────────

/**
 * 自然演繹のバリデーションエラー。
 */
export type NdValidationError =
  | {
      readonly _tag: "ImplicationElimNotImplication";
      readonly rightConclusion: Formula;
    }
  | {
      readonly _tag: "ImplicationElimAntecedentMismatch";
      readonly expected: Formula;
      readonly actual: Formula;
    }
  | {
      readonly _tag: "ImplicationElimConclusionMismatch";
      readonly expected: Formula;
      readonly actual: Formula;
    }
  | {
      readonly _tag: "ConjunctionElimNotConjunction";
      readonly premiseConclusion: Formula;
    }
  | {
      readonly _tag: "ConjunctionElimConclusionMismatch";
      readonly expected: Formula;
      readonly actual: Formula;
    }
  | {
      readonly _tag: "DisjunctionElimNotDisjunction";
      readonly premiseConclusion: Formula;
    }
  | {
      readonly _tag: "DisjunctionElimConclusionMismatch";
      readonly leftConclusion: Formula;
      readonly rightConclusion: Formula;
    }
  | {
      readonly _tag: "DneNotDoubleNegation";
      readonly premiseConclusion: Formula;
    }
  | {
      readonly _tag: "DneConclusionMismatch";
      readonly expected: Formula;
      readonly actual: Formula;
    }
  | {
      readonly _tag: "ImplicationIntroConclusionMismatch";
      readonly expected: Formula;
      readonly actual: Formula;
    }
  | {
      readonly _tag: "WeakeningConclusionMismatch";
      readonly expected: Formula;
      readonly actual: Formula;
    }
  | {
      readonly _tag: "ConjunctionIntroConclusionMismatch";
      readonly expected: Formula;
      readonly actual: Formula;
    }
  | {
      readonly _tag: "DisjunctionIntroConclusionMismatch";
      readonly expected: Formula;
      readonly actual: Formula;
    };

/**
 * 自然演繹の検証結果。
 */
export type NdValidationResult =
  | { readonly _tag: "Valid" }
  | {
      readonly _tag: "Invalid";
      readonly errors: readonly NdValidationError[];
    };

/**
 * 自然演繹の証明図を検証する。
 */
export const validateNdProof = (proof: NdProofNode): NdValidationResult => {
  const errors: NdValidationError[] = [];
  validateNdNode(proof, errors);
  if (errors.length === 0) {
    return { _tag: "Valid" };
  }
  return { _tag: "Invalid", errors };
};

const validateNdNode = (
  node: NdProofNode,
  errors: NdValidationError[],
): void => {
  switch (node._tag) {
    case "NdAssumption":
      // 仮定は常に正当
      return;
    case "NdWeakening":
      validateNdNode(node.kept, errors);
      validateNdNode(node.discarded, errors);
      if (!equalFormula(node.formula, getNdConclusion(node.kept))) {
        errors.push({
          _tag: "WeakeningConclusionMismatch",
          expected: getNdConclusion(node.kept),
          actual: node.formula,
        });
      }
      return;
    case "NdImplicationIntro": {
      validateNdNode(node.premise, errors);
      const expected = implication(
        node.dischargedFormula,
        getNdConclusion(node.premise),
      );
      if (!equalFormula(node.formula, expected)) {
        errors.push({
          _tag: "ImplicationIntroConclusionMismatch",
          expected,
          actual: node.formula,
        });
      }
      return;
    }
    case "NdImplicationElim": {
      validateNdNode(node.left, errors);
      validateNdNode(node.right, errors);
      const rightConclusion = getNdConclusion(node.right);
      if (!(rightConclusion instanceof Implication)) {
        errors.push({
          _tag: "ImplicationElimNotImplication",
          rightConclusion,
        });
        return;
      }
      if (!equalFormula(getNdConclusion(node.left), rightConclusion.left)) {
        errors.push({
          _tag: "ImplicationElimAntecedentMismatch",
          expected: rightConclusion.left,
          actual: getNdConclusion(node.left),
        });
        return;
      }
      if (!equalFormula(node.formula, rightConclusion.right)) {
        errors.push({
          _tag: "ImplicationElimConclusionMismatch",
          expected: rightConclusion.right,
          actual: node.formula,
        });
      }
      return;
    }
    case "NdConjunctionIntro": {
      validateNdNode(node.left, errors);
      validateNdNode(node.right, errors);
      const expected = conjunction(
        getNdConclusion(node.left),
        getNdConclusion(node.right),
      );
      if (!equalFormula(node.formula, expected)) {
        errors.push({
          _tag: "ConjunctionIntroConclusionMismatch",
          expected,
          actual: node.formula,
        });
      }
      return;
    }
    case "NdConjunctionElimLeft": {
      validateNdNode(node.premise, errors);
      const premConclusion = getNdConclusion(node.premise);
      if (!(premConclusion instanceof Conjunction)) {
        errors.push({
          _tag: "ConjunctionElimNotConjunction",
          premiseConclusion: premConclusion,
        });
        return;
      }
      if (!equalFormula(node.formula, premConclusion.left)) {
        errors.push({
          _tag: "ConjunctionElimConclusionMismatch",
          expected: premConclusion.left,
          actual: node.formula,
        });
      }
      return;
    }
    case "NdConjunctionElimRight": {
      validateNdNode(node.premise, errors);
      const premConclusion = getNdConclusion(node.premise);
      if (!(premConclusion instanceof Conjunction)) {
        errors.push({
          _tag: "ConjunctionElimNotConjunction",
          premiseConclusion: premConclusion,
        });
        return;
      }
      if (!equalFormula(node.formula, premConclusion.right)) {
        errors.push({
          _tag: "ConjunctionElimConclusionMismatch",
          expected: premConclusion.right,
          actual: node.formula,
        });
      }
      return;
    }
    case "NdDisjunctionIntroLeft": {
      validateNdNode(node.premise, errors);
      const expected = disjunction(
        getNdConclusion(node.premise),
        node.addedRight,
      );
      if (!equalFormula(node.formula, expected)) {
        errors.push({
          _tag: "DisjunctionIntroConclusionMismatch",
          expected,
          actual: node.formula,
        });
      }
      return;
    }
    case "NdDisjunctionIntroRight": {
      validateNdNode(node.premise, errors);
      const expected = disjunction(
        node.addedLeft,
        getNdConclusion(node.premise),
      );
      if (!equalFormula(node.formula, expected)) {
        errors.push({
          _tag: "DisjunctionIntroConclusionMismatch",
          expected,
          actual: node.formula,
        });
      }
      return;
    }
    case "NdDisjunctionElim": {
      validateNdNode(node.disjunction, errors);
      validateNdNode(node.leftCase, errors);
      validateNdNode(node.rightCase, errors);
      const disjConclusion = getNdConclusion(node.disjunction);
      if (!(disjConclusion instanceof Disjunction)) {
        errors.push({
          _tag: "DisjunctionElimNotDisjunction",
          premiseConclusion: disjConclusion,
        });
        return;
      }
      // 左右のケースの結論が同じかチェック
      const leftConclusion = getNdConclusion(node.leftCase);
      const rightConclusion = getNdConclusion(node.rightCase);
      if (!equalFormula(leftConclusion, rightConclusion)) {
        errors.push({
          _tag: "DisjunctionElimConclusionMismatch",
          leftConclusion,
          rightConclusion,
        });
      }
      return;
    }
    case "NdEfq":
      validateNdNode(node.premise, errors);
      // EFQ: 前提が⊥であることのチェックは体系依存
      // ここでは構造的な正当性のみ検証
      return;
    case "NdDne": {
      validateNdNode(node.premise, errors);
      const premConclusion = getNdConclusion(node.premise);
      if (
        !(premConclusion instanceof Negation) ||
        !(premConclusion.formula instanceof Negation)
      ) {
        errors.push({
          _tag: "DneNotDoubleNegation",
          premiseConclusion: premConclusion,
        });
        return;
      }
      if (!equalFormula(node.formula, premConclusion.formula.formula)) {
        errors.push({
          _tag: "DneConclusionMismatch",
          expected: premConclusion.formula.formula,
          actual: node.formula,
        });
      }
      return;
    }
  }
  /* v8 ignore start */
  node satisfies never;
  /* v8 ignore stop */
};

// ── Set ヘルパー ──────────────────────────────────────────

const unionSets = (
  a: ReadonlySet<AssumptionId>,
  b: ReadonlySet<AssumptionId>,
): ReadonlySet<AssumptionId> => {
  const result = new Set(a);
  for (const id of b) {
    result.add(id);
  }
  return result;
};

const removeFromSet = (
  set: ReadonlySet<AssumptionId>,
  id: AssumptionId,
): ReadonlySet<AssumptionId> => {
  const result = new Set(set);
  result.delete(id);
  return result;
};
